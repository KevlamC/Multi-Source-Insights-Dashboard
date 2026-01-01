import os
import asyncio
import logging
import requests
import io
import csv
import sys
import brotli
from datetime import datetime
from pathlib import Path
import boto3
from typing import List, Optional, Dict, Any, Set # Added Dict, Any for type hints
from pydantic import BaseModel
import pandas as pd

# --- Import FilterRequest from new models.py ---
from .models import FilterRequest

# Import filter_reddit_comments
from .universal_filter_function import filter_reddit_comments

# --- FastAPI Imports ---
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

# --- Mangum Import for AWS Lambda Integration ---
from mangum import Mangum # New: Import Mangum

# Configure logging for the Lambda function
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("lambda-fastapi-router")

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from . import reddit_scraper
from . import generate_clusters
from . import genWriteup

# --- Environment Variables & Supabase Setup ---
# Kept load_dotenv() for local development
from dotenv import load_dotenv # Ensured this import is present
load_dotenv()

# Use VECTORDB_URL for consistency with reddit_scraper.py
SUPABASE_URL = os.getenv("VECTORDB_URL") 
SUPABASE_KEY = os.getenv("VECTORDB_API_KEY")

# Ensure Supabase credentials are available. In Lambda, these come from env vars.
# The following lines were removed to avoid re-initializing the client
# with potentially different environment variables. We will now rely on the
# Supabase client that is initialized in reddit_scraper.py and query_db.py.
# if not SUPABASE_URL or not SUPABASE_KEY:
#     logger.error("SUPABASE_URL (VECTORDB_URL) or SUPABASE_API_KEY environment variables are not set.")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# --- FastAPI Application Instance ---
app = FastAPI()

# This is used to handle the root urls
@app.get("/")
def read_root():
    return {"message": "Hello World"}

# CORS setup (replace "*" with your frontend URL if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS S3 config
# Note: It's generally recommended to use IAM Roles for Lambda to access S3,
# rather than hardcoding AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
# environment variables, for better security.
# these we have to manually set if testing local, but can delete them if backend is on AWS lambda
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = "ca-central-1"
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)
# Define S3 config for Brotli output
BROTLI_OUTPUT_BUCKET = os.getenv("BROTLI_OUTPUT_BUCKET")
BROTLI_OUTPUT_PREFIX = os.getenv("BROTLI_OUTPUT_PREFIX", "reddit-comments/")


# helpers
# List all S3 objects in the bucket that optionally match a subreddit and always end with the given suffix.
# ignore files with name containing "filtered_comments"
# def list_s3_files(bucket: str, suffix: str = ".csv.br", subreddit: Optional[str] = None) -> List[str]:
#     paginator = s3_client.get_paginator("list_objects_v2")
#     urls = []

#     # If subreddit provided, use it to build prefix
#     prefix = f"reddit_{subreddit}_" if subreddit else ""

#     try:
#         for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
#             for obj in page.get("Contents", []):
#                 key = obj["Key"]
#                 # Must end with suffix AND NOT contain "filtered_comments"
#                 # Removed the condition "and "filtered_comments" not in key"
#                 if key.endswith(suffix):
#                     url = f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{key}"
#                     urls.append(url)
#     except Exception as e:
#         logger.error(f"Error listing S3 files from bucket {bucket} with prefix '{prefix}': {e}", exc_info=True)
#         return []

#     return urls
def list_s3_files(bucket: str, suffix: str = ".csv.br", subreddit: Optional[str] = None) -> List[str]:
    paginator = s3_client.get_paginator("list_objects_v2")
    urls = []

    # If subreddit provided, use it to build prefix
    prefix = f"reddit_{subreddit}_" if subreddit else ""

    try:
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                # Must end with suffix AND NOT contain "filtered_comments"
                # Removed the condition "and "filtered_comments" not in key"
                if key.endswith(suffix) and "filtered_comments" not in key:
                    url = f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{key}"
                    urls.append(url)
    except Exception as e:
        logger.error(f"Error listing S3 files from bucket {bucket} with prefix '{prefix}': {e}", exc_info=True)
        return []

    return urls


def download_and_parse_csv(url: str) -> pd.DataFrame:
    """Download CSV.BR file from S3 (assume automatically decompressed) and parse as DataFrame."""
    try:
        key = url.split(".com/")[1]
        obj = s3_client.get_object(Bucket=BROTLI_OUTPUT_BUCKET, Key=key)
        return pd.read_csv(obj["Body"])
    except Exception as e:
        logger.error(f"Error downloading or parsing CSV from S3 URL {url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to download or parse CSV from S3: {e}")


def upload_filtered_file(df: pd.DataFrame) -> str: #Changed, added bytes
    """Save filtered DataFrame as CSV.BR and upload to S3."""

    try:
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)

        csv_string = csv_buffer.getvalue()
        csv_bytes = csv_string.encode('utf-8')  # ← This should be bytes already

        # --- ADDED DEBUGGING LINE ---
        print(f"DEBUG: Type of object being compressed: {type(csv_bytes)}")

        # Compress the CSV file content with brotli
        compressed_bytes = brotli.compress(csv_bytes)

        # Upload the compressed bytes to S3
        key = f"filtered_comments_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv.br"
        
        # s3_client.upload_file(tmp.name, BROTLI_OUTPUT_BUCKET, key)
        s3_client.put_object(
            Bucket=BROTLI_OUTPUT_BUCKET,
            Key=key,
            Body=compressed_bytes,
            ContentType="application/x-brotli"
        )
        return f"https://{BROTLI_OUTPUT_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
    except Exception as e:
            logger.error(f"Error uploading filtered file to S3: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to upload filtered file to S3: {e}")

# use previous data route
@app.get("/use_prev_data")
def use_prev_data():
    """
    Looks for all files in S3 ending with '.csv.br' and returns their URLs.
    """
    suffix = ".csv.br"  # no subreddit filtering
    urls = list_s3_files(BROTLI_OUTPUT_BUCKET, suffix)
    return {"urls": urls}



# Filtering Request format
class FilterRequest(BaseModel):
    subreddits: Optional[List[str]] = None
    emotions: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    practitioner_types: Optional[List[str]] = None
    min_intensity: Optional[float] = None
    time: Optional[str] = None
    keyword: Optional[str] = None
    # Boolean filters: True = must exist, False = must be empty, None = ignore
    desire_and_wish: Optional[bool] = None
    trigger_phrase: Optional[bool] = None
    metaphors: Optional[bool] = None
    question: Optional[bool] = None
    practitioner_reference: Optional[bool] = None
    painpointsxfrustrations: Optional[bool] = None
    failed_solutions: Optional[bool] = None
    

@app.post("/get_filtered_cmts")
async def get_filtered_cmts(filters: FilterRequest):
    if not BROTLI_OUTPUT_BUCKET:
        logger.error("S3_BUCKET_NAME not configured")
        # return {"error": "S3_BUCKET_NAME not configured"}
        raise HTTPException(status_code=500, detail = "S3_BUCKET_NAME has not configured")

    # 1. Get all S3 URLs without initial subreddit filtering; files must end with '.csv.br' suffix
    all_urls = list_s3_files(bucket=BROTLI_OUTPUT_BUCKET, suffix=".csv.br", subreddit=None)
    if not all_urls:
        return {"urls": []}

    # 2. Manually filter the urls based on the subreddits in the filter request
    filtered_urls = []
    if getattr(filters, 'subreddits') is not None:
        for url in all_urls:
            # Check if the prefix with the particular subreddit name exists in the url
            if any(f"reddit_{subreddit}_" in url for subreddit in filters.subreddits):
                filtered_urls.append(url)
    else:
        # If no subreddits are specified, return the urls of all subreddits 
        filtered_urls = all_urls

    if not filtered_urls:
        return {"urls" : []}

    # 3. Download and combine all CSVs
    combined_df = pd.DataFrame()
    all_dfs = []
    tasks = []
    loop = asyncio.get_event_loop()

    for url in filtered_urls:
        # Create a task for each download and parse to run concurrently
        task = loop.run_in_executor(None, download_and_parse_csv, url)
        tasks.append(task)

    # Wait for all tasks to complete and collect results
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Loop through each downloaded results and check for any exceptions
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Skipping URL due to download error: {result}")
            continue

        all_dfs.append(result)
    
    if not all_dfs:
        logger.warning("No valid data frames could be downloaded from S3.")
        return {"urls": []}
    
    combined_df = pd.concat(all_dfs, ignore_index=True)

    # 4. Apply the unified filtering function
    try:
        #filter_reddit_comments now returns a pandas DataFrame
        processing_filters = filters.dict(exclude_none=True)

        if 'subreddits' in processing_filters:
            del processing_filters['subreddits']

        filtered_df = filter_reddit_comments(combined_df, filters.dict(exclude_none=True))

        #Save the filtered DataFrame directly to S3
        new_url = upload_filtered_file(filtered_df)

        return {"urls": [new_url]}
    except Exception as e:
        logger.error(f"Error during filtering process: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Filtering failed: {str(e)}")

CSV_FIELDS = [
    'id', 'post_id', 'subreddit', 'author', 'body', 'created_utc', 'score', 'parent_id',
    'sentiment', 'sentiment_score', 'desire_and_wish', 'trigger_phrase', 'metaphors', 'question',
    'topics', 'practitioner_reference', 'painpointsxfrustrations', 'emotions', 'failed_solutions'
]

pk_columns = {
    "comments": "id",
    "posts": "id",
    "authors": "username",
    "subreddits": "name",
}

def comments_to_brotli_csv(comments: list[dict], fieldnames: list[str] = None) -> bytes:
    """
    Convert a list of comment dicts to a Brotli-compressed CSV (as bytes).

    Args:
        comments: List of comment dictionaries
        fieldnames: Optional list of CSV column order. Defaults to CSV_FIELDS.

    Returns:
        Brotli-compressed CSV bytes
    """
    if fieldnames is None:
        fieldnames = CSV_FIELDS

    csv_buffer = io.StringIO()
    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()

    for c in comments:
        writer.writerow({field: c.get(field, "") for field in fieldnames})

    csv_bytes = csv_buffer.getvalue().encode("utf-8")
    return brotli.compress(csv_bytes)

def clear_database():
    print("🧹 Clearing database for new scraping session...")
    tables_to_clear = ["comments", "posts", "authors", "subreddits"]

    for table in tables_to_clear:
        pk = pk_columns[table]
        try:
            response = requests.delete(
                f"{SUPABASE_URL}/rest/v1/{table}?{pk}=not.is.null",
                headers={**HEADERS, "Prefer": "return=minimal"}
            )
            # Check if response is not None before accessing its status_code
            if response and response.status_code in [200, 204]:
                print(f"✅ Cleared {table} table")
            else:
                print(f"⚠️ Warning: Could not clear {table} table: {response.text}")
        except Exception as e:
            print(f"❌ Error clearing {table}: {e}")


def save_to_supabase(scraped_data):
    """
    Save scraped results to Supabase database with proper error handling.
    
    Args:
        scraped_data (dict): Dictionary with aggregated scraping results
    """
    print("💾 Saving scraped data to Supabase...")
    
    if not scraped_data or not scraped_data.get('comments'):
        print("⚠️ No data to save to database")
        return
    
    # Insert subreddits with upsert to handle duplicates
    if scraped_data['subreddits']:
        subreddit_data = [{'name': name} for name in scraped_data['subreddits']]
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/subreddits",
                headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
                json=subreddit_data
            )
            if response.status_code in [200, 201]:
                print(f"✅ Inserted {len(subreddit_data)} subreddits")
            else:
                print(f"⚠️ Subreddits insert response: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error inserting subreddits: {e}")
    
    # Insert authors with upsert to handle duplicates
    if scraped_data['authors']:
        author_data = [{'username': username} for username in scraped_data['authors']]
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/authors",
                headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
                json=author_data
            )
            if response.status_code in [200, 201]:
                print(f"✅ Inserted {len(author_data)} authors")
            else:
                print(f"⚠️ Authors insert response: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error inserting authors: {e}")
    
    # Insert posts with upsert to handle duplicates
    if scraped_data['posts']:
        post_data = list(scraped_data['posts'].values())
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
                json=post_data
            )
            if response.status_code in [200, 201]:
                print(f"✅ Inserted {len(post_data)} posts")
            else:
                print(f"⚠️ Posts insert response: {response.status_code} - {response.text}")
                print(f"First post data sample: {post_data[0] if post_data else 'No posts'}")
        except Exception as e:
            print(f"❌ Error inserting posts: {e}")
    
    # Insert comments in smaller batches with better error handling
    if scraped_data['comments']:
        batch_size = 500  # Reduced batch size for better reliability
        total_inserted = 0
        comments_to_insert = scraped_data['comments']
        total_comments = len(comments_to_insert)
        
        print(f"📝 Inserting {total_comments} comments in batches of {batch_size}")
        
        for i in range(0, total_comments, batch_size):
            batch = comments_to_insert[i:i + batch_size]

            # avoid 400 - {"code":"PGRST102","message":"All object keys must match"}
            for row in batch:
                # Remove keys not in EXPECTED_KEYS
                for key in list(row.keys()):
                    if key not in CSV_FIELDS:
                        del row[key]
                # Add any missing keys with None
                for key in CSV_FIELDS:
                    row.setdefault(key, None)
                    
            batch_num = (i // batch_size) + 1
            total_batches = (total_comments + batch_size - 1) // batch_size
            
            print(f"🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} comments)")
            
            try:
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/comments",
                    headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
                    json=batch
                )
                if response.status_code in [200, 201]:
                    total_inserted += len(batch)
                    print(f"✅ Inserted batch {batch_num}/{total_batches} ({len(batch)} comments) - Total: {total_inserted}/{total_comments}")
                else:
                    print(f"⚠️ Batch {batch_num} insert failed: {response.status_code} - {response.text}")
                    if response.status_code == 409:  # Conflict error
                        print("🔄 Trying individual inserts for this batch...")
                        # Try inserting comments one by one
                        for comment in batch:
                            try:
                                single_response = requests.post(
                                    f"{SUPABASE_URL}/rest/v1/comments",
                                    headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
                                    json=[comment]
                                )
                                if single_response.status_code in [200, 201]:
                                    total_inserted += 1
                                else:
                                    print(f"❌ Failed to insert comment {comment['id']}: {single_response.text[:100]}")
                            except Exception as e:
                                print(f"❌ Error inserting single comment {comment.get('id', 'unknown')}: {e}")
                        print(f"✅ Finished individual inserts for batch {batch_num} - Total: {total_inserted}/{total_comments}")
            except Exception as e:
                print(f"❌ Error inserting batch {batch_num}: {e}")
                print(f"Sample comment from failed batch: {batch[0] if batch else 'No comments'}")
    
    print(f"🎉 Database save complete!")
    print(f"📊 Final Summary:")
    print(f"  - Subreddits: {len(scraped_data['subreddits'])}")
    print(f"  - Authors: {len(scraped_data['authors'])}")
    print(f"  - Posts: {len(scraped_data['posts'])}")
    print(f"  - Comments attempted: {len(scraped_data['comments'])}")
    print(f"  - Comments successfully inserted: {total_inserted}")
    
    # Verify what was actually saved
    try:
        verify_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/comments?select=count",
            headers=HEADERS
        )
        if verify_response.status_code == 200:
            actual_count = len(verify_response.json())
            print(f"  - Comments verified in database: {actual_count}")
        else:
            print(f"⚠️ Could not verify comment count: {verify_response.text}")
    except Exception as e:
        print(f"⚠️ Error verifying comment count: {e}")

# Syed has stored the old version of scrape_comments_route in case it is needed

@app.post("/scrape_comments")
async def scrape_comments_route(request: Request):
    """
    Scrape comments from Reddit subreddits and save to database.
    
    Expected JSON body:
    {
        "subreddits": ["subreddit1", "subreddit2"],
        "post_limit": 100
    }
    """
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    
    # Extract and validate subreddits
    subreddits = data.get("subreddits", [])
    if not subreddits or not isinstance(subreddits, list):
        raise HTTPException(status_code=400, detail="Invalid subreddit list - must be a non-empty list")
    
    if len(subreddits) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 subreddits allowed")
    
    # Extract and validate post limit
    post_limit = data.get("post_limit", 1000)
    if not isinstance(post_limit, int) or post_limit < 1 or post_limit > 1000:
        raise HTTPException(status_code=400, detail="post_limit must be an integer between 1 and 1000")

    print(f"📥 Subreddits received: {subreddits}")
    print(f"📊 Post limit: {post_limit}")

    # Clear database before starting new scraping session
    clear_database()

    try:
        scraped_data = await reddit_scraper.scrape_comments_async(subreddits, post_limit)
    except ValueError as ve:
        print(f"❌ Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"❌ Async scraping failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to scrape comments")

    # Debug: Print scraped data summary
    print(f"\n🔍 DEBUG: Scraped data summary:")
    print(f"  - Subreddits: {len(scraped_data.get('subreddits', []))}")
    print(f"  - Authors: {len(scraped_data.get('authors', set()))}")  
    print(f"  - Posts: {len(scraped_data.get('posts', {}))}")
    print(f"  - Comments: {len(scraped_data.get('comments', []))}")
    
    # Print breakdown by subreddit
    for subreddit in scraped_data.get('subreddits', []):
        subreddit_comments = [c for c in scraped_data.get('comments', []) if c['subreddit'] == subreddit]
        print(f"    - r/{subreddit}: {len(subreddit_comments)} comments")

    # Save all results to database
    save_to_supabase(scraped_data)

    # Calculate totals for response
    total_comments_scraped = len(scraped_data.get('comments', []))
    successful_subreddits = list(scraped_data.get('subreddits', []))

    return {
        "success": True,
        "message": f"Successfully scraped and saved {total_comments_scraped} comments from {len(successful_subreddits)} subreddit(s)",
        "subreddits_processed": successful_subreddits,
        "successful_subreddits": successful_subreddits,
        "total_comments_saved": total_comments_scraped,
        "total_posts_processed": len(scraped_data.get('posts', {})),
        "total_authors_found": len(scraped_data.get('authors', set())),
        "results_summary": {
            "subreddits": len(scraped_data.get('subreddits', [])),
            "posts": len(scraped_data.get('posts', {})),
            "authors": len(scraped_data.get('authors', set())),
            "comments": len(scraped_data.get('comments', []))
        }
    }

#NEW ROUTES
# --- Add these Pydantic models near your other models (e.g., near FilterRequest) ---
class Message(BaseModel):
    id: int
    type: str  # e.g., "user", "bot"
    content: str

class Chat(BaseModel):
    id: int
    title: str
    messages: List[Message]
    created_at: Optional[str] = None  # Make optional for creation
    # --- Add these endpoints to your FastAPI app ---

# In-memory storage for demo purposes.
# REPLACE THIS WITH A DATABASE (like your Supabase) FOR PRODUCTION!
chat_storage = {}

# GET /chat-history
@app.get("/chat-history", response_model=List[Chat])
async def get_chat_history():
    """Get user's chat history"""
    try:
        # For now, return sample data.
        # TODO: Replace this with a database query to fetch the user's actual chats
        sample_chats = [
            {
                "id": 1,
                "title": "Patient Experiences",
                "messages": [
                    {"id": 1, "type": "user", "content": "What are common frustrations patients share about chronic pain?"},
                    {"id": 2, "type": "bot", "content": "Many patients mention delayed diagnoses and inconsistent treatment plans."}
                ],
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": 2,
                "title": "Doctor Feedback",
                "messages": [
                    {"id": 1, "type": "user", "content": "What do Reddit users say about doctor communication?"},
                    {"id": 2, "type": "bot", "content": "Users appreciate clear explanations but complain about rushed appointments."}
                ],
                "created_at": "2024-01-14T14:20:00Z"
            }
        ]
        return sample_chats
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to load chat history")

# Rename the save endpoint to a more RESTful pattern
@app.post("/ai/chats") # Changed from "/chat"
async def save_chat(chat: Chat):
    """Save or update a chat"""
    try:
        # Store in memory for now.
        # TODO: REPLACE THIS WITH DATABASE LOGIC (INSERT/UPDATE)
        chat_storage[chat.id] = {
            "id": chat.id,
            "title": chat.title,
            "messages": [msg.dict() for msg in chat.messages],
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        return {"success": True, "chatId": chat.id}
    except Exception as e:
        logger.error(f"Error saving chat {chat.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save chat")

# The delete endpoint can stay the same or also be changed to /ai/chats/{id}
@app.delete("/ai/chats/{chat_id}") # Optional: more consistent naming
async def delete_chat(chat_id: int):
    """Delete a chat"""
    try:
        # Delete from memory.
        # TODO: REPLACE THIS WITH DATABASE LOGIC (DELETE)
        if chat_id in chat_storage:
            del chat_storage[chat_id]
            return {"success": True}
        else:
            # If it's not in our demo storage, just return success anyway.
            return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting chat {chat_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete chat")

# Add this class back:
class ExportRequest(FilterRequest):
    data_type: str = "comments"  # or "metaphors" etc.
@app.post("/export_data")
async def export_data(filters: ExportRequest):  # ← Change to ExportRequest
    """
    Export filtered data as CSV
    """
    try:
        # Get filtered data using the same logic as get_filtered_cmts
        if not BROTLI_OUTPUT_BUCKET:
            raise HTTPException(status_code=500, detail="S3_BUCKET_NAME not configured")

        all_urls = list_s3_files(bucket=BROTLI_OUTPUT_BUCKET, suffix=".csv.br", subreddit=None)
        if not all_urls:
            return {"error": "No data files found"}

        # Filter URLs based on subreddits
        filtered_urls = []
        if filters.subreddits:
            for url in all_urls:
                if any(f"reddit_{subreddit}_" in url for subreddit in filters.subreddits):
                    filtered_urls.append(url)
        else:
            filtered_urls = all_urls

        if not filtered_urls:
            return {"error": "No matching data files found"}

        # Download and combine CSVs
        combined_df = pd.DataFrame()
        loop = asyncio.get_event_loop()
        tasks = [loop.run_in_executor(None, download_and_parse_csv, url) for url in filtered_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_dfs = [result for result in results if not isinstance(result, Exception)]
        
        if not valid_dfs:
            return {"error": "Failed to download data files"}
            
        combined_df = pd.concat(valid_dfs, ignore_index=True)

        processing_filters = filters.dict(exclude_none=True)
        if 'subreddits' in processing_filters:
            del processing_filters['subreddits']

        # Apply filters
        filtered_df = filter_reddit_comments(combined_df, filters.dict(exclude_none=True))
        
        # Convert to CSV
        csv_data = filtered_df.to_csv(index=False)
        
        return StreamingResponse(
            io.StringIO(csv_data),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=desires-wishes-data.csv"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.post("/export_insights")
async def export_insights(filters: ExportRequest):  # ← Change to ExportRequest
    """
    Export insights as text file
    """
    try:
        # Get filtered data (same logic as above)
        if not BROTLI_OUTPUT_BUCKET:
            raise HTTPException(status_code=500, detail="S3_BUCKET_NAME not configured")

        all_urls = list_s3_files(bucket=BROTLI_OUTPUT_BUCKET, suffix=".csv.br", subreddit=None)
        if not all_urls:
            return {"error": "No data files found"}

        filtered_urls = []
        if filters.subreddits:
            for url in all_urls:
                if any(f"reddit_{subreddit}_" in url for subreddit in filters.subreddits):
                    filtered_urls.append(url)
        else:
            filtered_urls = all_urls

        if not filtered_urls:
            return {"error": "No matching data files found"}

        # Download and combine CSVs
        combined_df = pd.DataFrame()
        loop = asyncio.get_event_loop()
        tasks = [loop.run_in_executor(None, download_and_parse_csv, url) for url in filtered_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_dfs = [result for result in results if not isinstance(result, Exception)]
        
        if not valid_dfs:
            return {"error": "Failed to download data files"}
            
        combined_df = pd.concat(valid_dfs, ignore_index=True)

        # Create a copy of the filters to modify
        processing_filters = filters.dict(exclude_none=True)
        # We manually filter the URLs by subreddit, so we must remove this key
        # from the dictionary before passing it to the universal filter function.
        if 'subreddits' in processing_filters: 
            del processing_filters['subreddits']

        # Apply filters
        filtered_df = filter_reddit_comments(combined_df, filters.dict(exclude_none=True))
        
        # Generate insights text
        insights_text = generate_insights_text(filtered_df)
        
        return StreamingResponse(
            io.StringIO(insights_text),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=desires-wishes-insights.txt"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

def generate_insights_text(df: pd.DataFrame) -> str:
    """
    Generate insights text from DataFrame
    """
    if df.empty:
        return "No data available for insights."
    
    total = len(df)
    
    # Topic distribution
    topic_counts = df['topics'].value_counts()
    topic_insights = "Categories:\n"
    for topic, count in topic_counts.items():
        percentage = (count / total) * 100
        topic_insights += f"{topic}: {percentage:.1f}% ({count})\n"
    
    # Emotion distribution
    emotion_counts = df['emotions'].value_counts()
    emotion_insights = "\nEmotions:\n"
    for emotion, count in emotion_counts.items():
        percentage = (count / total) * 100
        emotion_insights += f"{emotion}: {percentage:.1f}% ({count})\n"
    
    # Most common desires
    if 'desire_and_wish' in df.columns:
        desire_texts = df[df['desire_and_wish'].notna()]['body'].head(10)
        common_desires = "\nCommon Desires/Wishes:\n"
        for i, desire in enumerate(desire_texts, 1):
            common_desires += f"{i}. {desire[:100]}...\n"
    else:
        common_desires = ""
    
    return f"Top Insights\n-------------\n{topic_insights}{emotion_insights}{common_desires}"


@app.get("/get_database_stats")
def get_database_stats():
    """Get current database statistics."""
    stats = {}
    
    tables = ["subreddits", "authors", "posts", "comments"]
    
    for table in tables:
        try:
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?select=*",
                headers=HEADERS
            )
            if response.status_code == 200:
                data = response.json()
                stats[table] = len(data)
                
                # For comments, also get breakdown by subreddit
                if table == "comments" and data:
                    subreddit_breakdown = {}
                    for comment in data:
                        subreddit = comment.get('subreddit', 'unknown')
                        subreddit_breakdown[subreddit] = subreddit_breakdown.get(subreddit, 0) + 1
                    stats[f"{table}_by_subreddit"] = subreddit_breakdown
            else:
                stats[table] = f"Error: {response.status_code}"
        except Exception as e:
            stats[table] = f"Error: {str(e)}"
    
    return {
        "database_stats": stats,
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }

@app.get("/get_emotion_clusters_one")
def get_emotion_clusters_route_one():
    """Get emotion clusters (method one)."""
    try:
        emotions = generate_clusters.get_emotion_clusters_one()
        return {"clusters": emotions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get_comments_by_emotion_one")
async def get_comments_by_emotion_route_one(request: Request):
    """Get comments filtered by emotion (method one)."""
    data = await request.json()
    emotion = data.get("emotion")
    if not emotion:
        raise HTTPException(status_code=400, detail="Missing emotion")

    try:
        comments = generate_clusters.get_comments_for_emotion_one(emotion)
        return {"emotion": emotion, "comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_emotion_counts")
def get_emotion_counts_route():
    """Get emotion counts."""
    try:
        counts = generate_clusters.get_emotion_counts()
        return counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_emotion_clusters_two")
def get_clusters_two():
    """Get emotion clusters (method two)."""
    try:
        clusters = generate_clusters.get_emotion_counts()
        return {"clusters": {c["emotion"]: c["count"] for c in clusters}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_writeup")
async def generate_writeup(request: Request):
    """Generate writeup for specific emotion."""
    data = await request.json()
    emotion = data.get("emotion")
    if not emotion:
        raise HTTPException(status_code=400, detail="Missing emotion")

    try:
        comments = generate_clusters.get_comments_for_emotion_one(emotion)
        bodies = [c["body"] for c in comments]
        result = genWriteup.generate_writeup_for_emotion(emotion, bodies)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#NEWLY ADDED FOR AI CHAT ROUTE
class AIChatRequest(BaseModel):
    user_prompt: str
    user_task: str
    filters: Optional[Dict[str, Any]] = None  # ← Add this line
# New: Import the process_user_request function
from backend.aiChatBot import process_user_request
# Rename the AI endpoint
@app.post("/ai/chat") # Changed from "/chat"
async def get_ai_insights(request: AIChatRequest):
    """
    Endpoint to process a user's prompt and generate AI-driven insights and content.
    """
    try:
        # Call the core AI processing function from aiChatBot.py
        response = await process_user_request(request.user_prompt, request.user_task, request.filters)
        return JSONResponse(content=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Reddit scraper API is running"}

# --- AWS Lambda Handler using Mangum ---
# This is the single entry point for AWS Lambda.
handler = Mangum(app)








# This block allows you to run the FastAPI app locally using Uvicorn
# for development and testing outside of the Lambda environment.
if __name__ == "__main__":
    import uvicorn
    # Make sure to install python-dotenv if you're using load_dotenv locally.
    uvicorn.run(app, host="0.0.0.0", port=8000)