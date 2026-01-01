import sys
import os
import asyncio
import time
import psutil
import csv
import asyncpraw
import json
import logging
import statistics
import shutil # Added for directory operations
from .brotli_compression import BrotliFileCompressor
from datetime import datetime
from collections import deque
from pathlib import Path
from . import vectorise_comment
from supabase import create_client, Client
from transformers import AutoTokenizer, AutoModel
from .filter_comment import is_useless_comment
from .analyzer_worker import start_workers

import boto3
import torch
import torch.nn.functional as F

# --- AWS Configuration ---
AWS_REGION = "ca-central-1"

# Initialize a new Supabase client
url: str = os.environ.get("VECTORDB_URL")
key: str = os.environ.get("VECTORDB_API_KEY")
supabase: Client = create_client(url, key) if url and key else None

# === Setup Logging ===
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reddit-scraper-lambda")


# --- NEW DIAGNOSTICS FOR BROTLI ---
logger.info(f"__file__: {__file__}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"sys.path: {sys.path}")
try:
    if os.path.exists('backend'):
        logger.info(f"Listing contents of 'backend' directory: {os.listdir('backend')}")
    else:
        logger.info("backend directory does not exist.")
    file_exists = os.path.exists('backend/brotli_compression.py')
    logger.info(f"Does backend/brotli_compression.py exist? {file_exists}")
except OSError as e:
    logger.error(f"Error listing backend directory: {e}")
# --- END NEW DIAGNOSTICS ---


# Constants
REDDIT_API_LIMIT = 950
COOLDOWN = 600
REPLACE_MORE_LIMIT = 100

# Global counters
global_api_call_count = 0
reddit_call_count = 0
reddit_window_start = time.time()

# Define paths for the model
# The model will be downloaded to /tmp for read/write access
# HF_MODEL_ID = os.getenv("HF_MODEL_ID", "sentence-transformers/multi-qa-MiniLM-L6-cos-v1")
# LOCAL_MODEL_PATH = Path("/tmp") / HF_MODEL_ID.split('/')[-1]
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", os.path.expanduser("~/models/m"))

# Global Initialization of Tokenizer and Model
tokenizer = None
model = None

# --- NEW FUNCTION TO ENSURE MODEL AVAILABILITY ---
# This function checks if the model exists in /tmp and, if not,
# copies it from the build-time cache location /app/hf_cache.
# def ensure_model_is_available():
#     """Ensures the Hugging Face model is available in the writable /tmp directory."""
#     logger.info("Checking for model files in /tmp...")
#     if not LOCAL_MODEL_PATH.is_dir():
#         logger.warning(f"Model directory not found at {LOCAL_MODEL_PATH}. Attempting to copy from cache...")
#         # Path to the model where it was cached during the Docker build
#         HF_HOME_DIR = os.getenv("HF_HOME", "/app/hf_cache")
#         source_path = Path(HF_HOME_DIR) / HF_MODEL_ID.split('/')[-1]
        
#         if source_path.is_dir():
#             try:
#                 # Use dirs_exist_ok=True to prevent an error if /tmp/model_name already exists.
#                 shutil.copytree(source_path, LOCAL_MODEL_PATH, dirs_exist_ok=True)
#                 logger.info(f"✅ Successfully copied model from {source_path} to {LOCAL_MODEL_PATH}")
#             except Exception as e:
#                 logger.error(f"❌ Error copying model directory: {e}", exc_info=True)
#                 sys.exit(1) # Exit if essential model components cannot be copied
#         else:
#             logger.error(f"❌ Source model directory does not exist at {source_path}. Aborting.")
#             sys.exit(1) # Exit if source is not found

try:
    # ensure_model_is_available()
    logger.info(f"Loading tokenizer from local path: {LOCAL_MODEL_PATH}")
    tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_PATH, local_files_only=True)
    logger.info(f"Loading model from local path: {LOCAL_MODEL_PATH}")
    model = AutoModel.from_pretrained(LOCAL_MODEL_PATH, local_files_only=True)
    logger.info("✅ Successfully loaded tokenizer and model from local path.")
except Exception as e:
    logger.error(f"❌ Error loading tokenizer or model locally from {LOCAL_MODEL_PATH}: {e}", exc_info=True)
    # If model loading fails, the application might not function correctly.
    # Consider raising an error here if model is absolutely critical.
    sys.exit(1) # Exit if essential model components cannot be loaded

# Define S3 configuration for ONNX model (variables kept, but loading commented out)
ONNX_S3_BUCKET_NAME = os.getenv("ONNX_MODEL_BUCKET")
ONNX_S3_KEY = os.getenv("ONNX_MODEL_KEY")
ONNX_LOCAL_PATH = Path("/tmp/model-quant.onnx")

# Initialize S3 client for downloading ONNX model and uploading Brotli file
s3_client = boto3.client("s3", region_name=AWS_REGION)

# Define S3 config for Brotli output
BROTLI_OUTPUT_BUCKET = os.getenv("BROTLI_OUTPUT_BUCKET")
BROTLI_OUTPUT_PREFIX = os.getenv("BROTLI_OUTPUT_PREFIX", "reddit-comments/")

# Define schema keys
COMMENT_SCHEMA_KEYS = [
    'id', 'post_id', 'subreddit', 'author', 'body', 'created_utc', 'score', 'parent_id',
    'sentiment', 'sentiment_score', 'desire_and_wish', 'trigger_phrase', 'metaphors',
    'question', 'topics', 'practitioner_reference', 'painpointsxfrustrations', 'emotions',
    'failed_solutions'
]

# Code Credit: Daky
# Background task to log memory usage every 10 seconds, add sample memory usage every 0.0001 second
# === Memory monitor globals ===
async def log_and_sample_memory_usage(proc, stop_event):
    memory_samples = []
    sample_interval = 0.0001
    log_interval = 1
    elapsed = 0

    while not stop_event.is_set():
        try:
            mem_mb = proc.memory_info().rss / (1024 ** 2)
            memory_samples.append(mem_mb)
            elapsed += sample_interval

            if elapsed >= log_interval:
                logger.info(f"[MEMORY MONITOR] Current memory: {mem_mb:.2f} MB")
                elapsed = 0
        except psutil.NoSuchProcess:
            logger.warning("[MEMORY MONITOR] Process not found, stopping.")
            break
        except Exception as e:
            logger.error(f"[MEMORY MONITOR] Error: {e}")

        await asyncio.sleep(sample_interval)

    return memory_samples

# Function to create a comment with all keys
def create_comment(**kwargs):
    comment = {key: None for key in COMMENT_SCHEMA_KEYS}
    comment.update(kwargs)
    return comment

# Helper function for inserting metadata in chunks
def _chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]

def bytes_to_mb(bytes_val):
    """Convert bytes to megabytes."""
    return bytes_val / (1024 * 1024)

def format_time(seconds):
    """Format seconds into readable time string."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}m {secs:.1f}s"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        return f"{hours}h {minutes}m {secs:.1f}s"

def utc_to_iso(utc_ts):
    """Convert UTC timestamp to ISO format string."""
    return datetime.utcfromtimestamp(utc_ts).isoformat() + "+00:00"

async def async_guard_reddit(calls=1, context=None):
    """
    Rate limiting guard for Reddit API calls.
    Ensures we don't exceed REDDIT_API_LIMIT calls per 10-minute window.
    """
    global reddit_call_count, reddit_window_start, global_api_call_count

    now = time.time()
    elapsed = now - reddit_window_start

    # Reset window if 10 minutes have passed
    if elapsed >= COOLDOWN:
        reddit_window_start = now
        reddit_call_count = 0
        elapsed = 0

    # Check if we would exceed the limit
    if reddit_call_count + calls > REDDIT_API_LIMIT:
        sleep_time = COOLDOWN - elapsed
        if context:
            logger.info(f"⏸️ API rate limit reached while {context}. Sleeping for {sleep_time:.1f}s...")
        else:
            logger.info(f"⏸️ API rate limit reached. Sleeping for {sleep_time:.1f}s...")
        await asyncio.sleep(sleep_time)
        logger.info(f"▶️ Resuming after cooldown period")
        reddit_window_start = time.time()
        reddit_call_count = 0

    reddit_call_count += calls
    global_api_call_count += calls

# Mean Pooling - Take average of all tokens
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0] # First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

# Added embed_text function to be used within scraper for consistency
def embed_text(texts: list[str]):
    global tokenizer, model
    if tokenizer is None or model is None:
        logger.error("Tokenizer or model not loaded. Cannot embed text.")
        return [None] * len(texts)
    try:
        encoded_input = tokenizer(
            texts,
            padding=True,
            truncation=True,
            return_tensors="pt"
        )
        with torch.no_grad():
            model_output = model(**encoded_input)
        sentence_embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
        return F.normalize(sentence_embeddings, p=2, dim=1).tolist()
    except Exception as e:
        logger.error(f"Error embedding text in reddit_scraper: {e}", exc_info=True)
        return [None] * len(texts) # Return list of Nones for failure


async def scrape_comments(subreddit_name, post_limit):
    """
    Scrape comments from a specific subreddit with complete data for database storage.

    Args:
        subreddit_name (str): Name of the subreddit to scrape
        post_limit (int): Number of posts to process

    Returns:
        dict: Dictionary containing posts, authors, and comments data
    """

    # --- SSL CERTIFICATE FIX ---
    # Set the environment variable to point to the CA certificate bundle.
    # This must be done before the PRAW client is initialized.
    try:
        # Assuming cacert.pem is in the root of the deployed container image.
        cert_path = '/cacert.pem'
        os.environ['REQUESTS_CA_BUNDLE'] = cert_path
        logger.info(f"REQUESTS_CA_BUNDLE environment variable set to: {cert_path}")
    except Exception as e:
        logger.error(f"Error setting REQUESTS_CA_BUNDLE: {e}")
    
    # Clear vector db before scraping comments
    # This remains the same, but it should be called once at the start of the entire scraping run,
    # not at the beginning of each subreddit. This is handled correctly in scrape_comments_async.
    vectorise_comment.clear_vector_db(supabase)

    subreddit_name = subreddit_name.lower()
    scraped_data = {
        'subreddit_info': {'name': subreddit_name},
        'posts': {},
        'authors': set(),
        'comments': [],
        'comments_by_id': {},
    }

    posts_processed = 0
    total_comments_collected = 0
    total_comments_vectorised = 0

    num_workers = 3

    # Start analysis worker task
    analyze_queue, worker_threads = start_workers(num_workers, scraped_data)

    # Get process for memory monitoring
    proc = psutil.Process()

    stop_event = asyncio.Event()
    tracking_task = asyncio.create_task(log_and_sample_memory_usage(proc, stop_event))

    mem_before = proc.memory_info().rss / (1024 ** 2)
    logger.info(f"[VECTORISE] Initial memory usage: {mem_before:.2f} MB")
    start_time = time.time()

    # Create reddit instance
    async with asyncpraw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT"),
        requestor_kwargs={'timeout': 30}
    ) as reddit:

        logger.info(f"📥 Fetching top {post_limit} hot posts from r/{subreddit_name}...")

        try:
            subreddit = await reddit.subreddit(subreddit_name)
            await async_guard_reddit(context="fetching subreddit info")

            async for submission in subreddit.hot(limit=post_limit):
                # Check rate limit before processing each post
                await async_guard_reddit(context="fetching submission")

                if posts_processed >= post_limit:
                    logger.info(f"✅ Reached post limit of {post_limit} for r/{subreddit_name}")
                    break

                posts_processed += 1
                logger.info(f"🔄 Processing post {posts_processed}/{post_limit}: {submission.id} - {submission.title[:50]}...")

                # Store post information
                post_author = str(submission.author) if submission.author else "deleted"
                scraped_data['authors'].add(post_author)
                scraped_data['posts'][submission.id] = {
                    'id': submission.id,
                    'subreddit': subreddit_name,
                    'author': post_author,
                    'title': submission.title,
                    'selftext': submission.selftext or "",
                    'created_utc': utc_to_iso(submission.created_utc),
                    'score': submission.score,
                    'num_comments': submission.num_comments,
                    'permalink': submission.permalink
                }

                # Guard before fetching comments
                await async_guard_reddit(context="fetching comments for submission")

                try:
                    # Fetch comments with timeout handling
                    comments_task = asyncio.create_task(submission.comments())
                    comments_obj = await asyncio.wait_for(comments_task, timeout=30)

                    replace_more_task = asyncio.create_task(comments_obj.replace_more(limit=REPLACE_MORE_LIMIT))
                    await asyncio.wait_for(replace_more_task, timeout=60)

                    comment_list = comments_obj.list()
                except asyncio.TimeoutError:
                    logger.warning(f"⏰ Timeout fetching comments for {submission.id}; skipping...")
                    continue
                except Exception as e:
                    logger.error(f"❌ Error fetching comments for {submission.id}: {e}", exc_info=True)
                    continue

                # Process comments with proper rate limiting
                comments_processed_for_this_post = 0
                filtered_comments = []
                comments_to_vectorise = [] # new list to hold comments for batch vectorization
                
                filtering_time = 0
                for i, comment in enumerate(comment_list):
                    if i % 1000 == 0 and i != 0:
                        await asyncio.sleep(0.1)
                    time_before_filter = time.time()
                    if comment is None or not hasattr(comment, 'body') or not comment.body:
                        logger.warning(f"⚠️ Received None or empty body for comment in post {submission.id}; skipping...")
                        continue
                    reason = is_useless_comment(comment.body)
                    filtering_time += time.time() - time_before_filter
                    if reason:
                        filtered_comments.append({
                            "comment_id": comment.id,
                            "author": str(comment.author) if comment.author else "deleted",
                            "body": comment.body,
                            "reason": reason
                        })
                        continue

                    # Get comment author
                    comment_author = str(comment.author) if comment.author else "deleted"
                    scraped_data['authors'].add(comment_author)

                    # Clean the comment body for database storage
                    clean_body = comment.body.replace('\n', ' ').replace('\r', ' ').strip()

                    # Get parent ID - could be another comment or the post itself
                    parent_id = None
                    if hasattr(comment, 'parent_id') and comment.parent_id:
                        parent_id = comment.parent_id.split('_')[1] if '_' in comment.parent_id else comment.parent_id

                    comment_data = create_comment(
                        id=comment.id,
                        post_id=submission.id,
                        subreddit=submission.subreddit.display_name.lower(),
                        author=str(comment.author) if comment.author else None,
                        body=comment.body,
                        created_utc=datetime.utcfromtimestamp(comment.created_utc).isoformat(),
                        score=comment.score,
                        parent_id=comment.parent_id
                    )

                    scraped_data['comments'].append(comment_data)
                    scraped_data['comments_by_id'][comment.id] = comment_data

                    # Also enqueue for AI attribute analysis
                    analyze_queue.put(comment_data)
                    
                    # Add comment to the list for batch vectorization
                    comments_to_vectorise.append({
                        "id": comment.id,
                        "body": clean_body
                    })

                    comments_processed_for_this_post += 1

                # --- BATCH VECTORIZATION LOGIC ADDED HERE --- #
                logger.info(f"[VECTORISE] Batching {len(comments_to_vectorise)} comments for vectorization...")
                if comments_to_vectorise:
                    try:
                        # vector_batch = brotli_compression.vectorise_batch(comments_to_vectorise)
                        vector_batch = vectorise_comment.vectorise_batch(comments_to_vectorise)
                        if vector_batch:
                            # Split into smaller chunks for insertion to avoid timeouts
                            for i, chunk in enumerate(_chunks(vector_batch, 500)):
                                logger.info(f"🛰️ Inserting vector batch {i+1} of {len(chunk)} comments into Supabase...")
                                supabase.table('reddit_records').insert(chunk).execute()
                                total_comments_vectorised += len(chunk)
                                current_memory_mb = proc.memory_info().rss / (1024 ** 2)
                                logger.info(f"[VECTORISE] ✅ Vectorised and inserted {total_comments_vectorised} comments | Memory: {current_memory_mb:.2f} MB")
                    except Exception as e:
                        logger.error("[VECTORISE] Exception during batch vectorisation or insertion", exc_info=True)

                total_comments_collected += comments_processed_for_this_post
                logger.info(f"📝 Collected {comments_processed_for_this_post} comments from post {submission.id} (Total: {total_comments_collected})")

                # print filtering info
                logger.info(f"⏱️ Filtering time: {filtering_time:.8f} seconds")
                logger.info(f"🚫 Filtered out {len(filtered_comments)} comments")
                #logger.info("🧹 Filtered Comments:")
                #for fc in filtered_comments:
                #    logger.info(json.dumps(fc, ensure_ascii=False, indent=2))

        except Exception as e:
            logger.error(f"❌ Error accessing subreddit r/{subreddit_name}: {e}", exc_info=True)
            return scraped_data

    # The rest of the function remains the same, as it deals with post-scraping tasks
    stop_event.set()
    end_time = time.time()

    memory_samples = await tracking_task
    avg_mem_usage = statistics.mean(memory_samples) if memory_samples else 0
    peak_mem_usage = max(memory_samples) if memory_samples else 0

    elapsed = end_time - start_time
    mem_after = proc.memory_info().rss

    # Finish scraping
    logger.info("[scraper] Sending None flag to analysis workers")
    # Send shutdown signals (one None per worker)
    for _ in range(num_workers):
        analyze_queue.put(None)

    # Wait for all threads to finish
    for t in worker_threads:
        t.join()
    logger.info("All analysis workers finished.")
    ai_wait_time = time.time() - end_time

    # Insert the metadata into our vector database with corresponding comment id
    rows_to_update = []
    batch_size_db_update = 500

    for c in scraped_data['comments']:
        cid = c['id']
        src = scraped_data['comments_by_id'][cid]

        row = {
            'id': cid,
            'subreddit': src.get('subreddit'),
            'emotions': src.get('emotions'),
            'topics': src.get('topics'),
            'practitioner_reference': src.get('practitioner_reference'),
            'created_at': src.get('created_utc')
        }

        # Filter out None values before sending to Supabase RPC, ensure JSON string for dict/list types
        cleaned_row = {
            k: v if k not in row else (v if v is not None else {})  # default to empty dict if None
            for k, v in row.items()
            if v is not None or k in row
        } 
        rows_to_update.append(cleaned_row)

    # bulk upsert; relies on id being the PK of the vector database (must be unique)
    if supabase:
        try:
            for i, chunk in enumerate(_chunks(rows_to_update, batch_size_db_update)):
                supabase.rpc('update_reddit_records_attr', {"payload" : chunk}).execute()
                logger.info(f"[VECTORISE] 🛰️ Updated metadata for batch {i+1}")
        except Exception as e:
            logger.error(f"Error updating Supabase records metadata: {e}", exc_info=True)


    # Save comments to CSV file (keeping the original functionality)
    csv_filename_base = f"reddit_{subreddit_name}_comments_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    csv_filename_path = Path("/tmp") / csv_filename_base # Use /tmp for writable storage
    temp_br_filename_path = Path("/tmp") / f"{csv_filename_base}.br"
    
    # ==== Soila -> Create the parent directory if it doesn't exist ==== #
    csv_filename_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: Write to CSV file (this section is safe as-is)
        with open(csv_filename_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=COMMENT_SCHEMA_KEYS)
            writer.writeheader()
            for comment in scraped_data['comments']:
                row = {}
                for key in COMMENT_SCHEMA_KEYS:
                    val = comment.get(key)
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val, ensure_ascii=False)
                    row[key] = val
                writer.writerow(row)
        logger.info(f"✅ Comments written to CSV: {csv_filename_path}")

        # Step 2: Attempt to compress the file in its own logical block.
        # This will prevent dependent operations from being called on failure.
        try:
            compressor = BrotliFileCompressor(compression_level=11)
            stats = compressor.compress_file(str(csv_filename_path), str(temp_br_filename_path))
            
            # These lines only run if compression was successful
            os.remove(csv_filename_path)
            logger.info(f"💾 Comments saved and Brotli-compressed to: {temp_br_filename_path} "
                        f"(ratio={stats['compression_ratio']:.2f}:1, "
                        f"saved={stats['space_saved_percent']:.1f}%)")
            
            # Step 3: Attempt to upload the file to S3 in its own logical block.
            if BROTLI_OUTPUT_BUCKET:
                output_s3_key = f"{BROTLI_OUTPUT_PREFIX}{temp_br_filename_path.name}"
                logger.info(f"☁️ Uploading Brotli file to s3://{BROTLI_OUTPUT_BUCKET}/{output_s3_key} ...")
                s3_client.upload_file(str(temp_br_filename_path), BROTLI_OUTPUT_BUCKET, output_s3_key)
                logger.info("✅ Brotli file uploaded to S3 successfully.")
                
            os.remove(temp_br_filename_path)

        except Exception as e:
            logger.error(f"❌ Error during compression or S3 upload: {e}", exc_info=True)
            # We don't raise here, so the script can continue to log the summary.
            # The original CSV file will remain in /tmp for debugging.

    except Exception as e:
        logger.error(f"❌ Error during initial file writing: {e}", exc_info=True)
        # This catch is for a fundamental failure to write the initial CSV
        raise

    # Log summary for this subreddit
    logger.info(f"\n--- r/{subreddit_name} Scraping Summary ---")
    logger.info(f"📄 Posts processed: {posts_processed}")
    logger.info(f"💬 Total comments collected: {total_comments_collected}")
    logger.info(f"👥 Unique authors found: {len(scraped_data['authors'])}")
    logger.info(f"⏱️ Scraping time: {format_time(elapsed)}")
    logger.info(f"⏱️ Extra time waiting for attribute update: {format_time(ai_wait_time)}")
    if posts_processed > 0:
        avg_time_per_post = elapsed / posts_processed
        logger.info(f"📊 Average time per post: {avg_time_per_post:.2f}s")

    logger.info(f"🖥️ Memory usage: {bytes_to_mb(mem_after - mem_before):.1f} MB")
    logger.info(f"🔄 API calls made: {global_api_call_count}")

    logger.info("\n==== 🧠 Memory Usage (Vectorisation Edition) ====")
    logger.info(f"🔥 Average Memory Usage: {avg_mem_usage:.2f} MB")
    logger.info(f"💥 Peak Memory Usage: {peak_mem_usage:.2f} MB")
    logger.info(f"💬 Total # of vectorised comments: {total_comments_vectorised}")

    return scraped_data

async def scrape_comments_async(subreddit_list, post_limit=1000):
    """
    Scrape comments from multiple subreddits sequentially.
    """
    global reddit_call_count, reddit_window_start, global_api_call_count
    global supabase

    # Re-initialize Supabase client if it's None (can happen if env vars aren't ready at global init)
    if supabase is None:
        url: str = os.getenv("VECTORDB_URL")
        key: str = os.getenv("VECTORDB_API_KEY")
        supabase = create_client(url, key)

    if supabase:
        try:
            vectorise_comment.clear_vector_db(supabase)
            logger.info("✅ Vector database cleared at start of scraping run.")
        except Exception as e:
            logger.error(f"Error clearing vector DB at start of async run: {e}", exc_info=True)


    if not isinstance(subreddit_list, list) or len(subreddit_list) == 0:
        raise ValueError("subreddit_list must be a non-empty list of strings.")
    if not isinstance(post_limit, int) or post_limit < 1 or post_limit > 1000:
        raise ValueError("post_limit must be an integer between 1 and 1000.")

    subreddit_queue = deque([sub.lower().strip() for sub in subreddit_list])
    aggregated_results = { 'subreddits': set(), 'authors': set(), 'posts': {}, 'comments': [] }
    failed_subreddits = {}
    
    logger.info(f"🚀 Starting scrape for {len(subreddit_queue)} subreddit(s): {list(subreddit_queue)}")
    logger.info(f"📊 Post limit per subreddit: {post_limit}")
    overall_start_time = time.time()

    while subreddit_queue:
        current_subreddit = subreddit_queue.popleft()
        logger.info(f"\n🎯 Now scraping: r/{current_subreddit}")
        try:
            if current_subreddit in failed_subreddits: logger.warning(f"⚠️ Retry attempt for r/{current_subreddit}")
            scraped_data = await scrape_comments(current_subreddit, post_limit)
            if scraped_data and scraped_data.get('comments'):
                aggregated_results['subreddits'].add(current_subreddit)
                aggregated_results['authors'].update(scraped_data['authors'])
                aggregated_results['posts'].update(scraped_data['posts'])
                aggregated_results['comments'].extend(scraped_data['comments'])
                logger.info(f"✅ Successfully scraped r/{current_subreddit}: {len(scraped_data['comments'])} comments")
                failed_subreddits.pop(current_subreddit, None)
            else:
                logger.warning(f"⚠️ No comments collected for r/{current_subreddit}")
                if current_subreddit not in failed_subreddits:
                    failed_subreddits[current_subreddit] = 1
                    subreddit_queue.append(current_subreddit)
                    logger.info(f"🔄 Added r/{current_subreddit} back to queue for retry")
                else: logger.error(f"❌ Final failure for r/{current_subreddit} after retry")
        except Exception as e:
            logger.error(f"❌ Error scraping r/{current_subreddit}: {e}", exc_info=True)
            if current_subreddit not in failed_subreddits:
                failed_subreddits[current_subreddit] = 1
                subreddit_queue.append(current_subreddit)
                logger.info(f"🔄 Added r/{current_subreddit} back to queue for retry")
            else: logger.error(f"❌ Final failure for r/{current_subreddit} after retry")
        logger.info(f"✅ Finished processing r/{current_subreddit}")

    overall_end_time = time.time()
    total_elapsed = overall_end_time - overall_start_time
    total_comments = len(aggregated_results['comments'])

    logger.info(f"\n🎉 === FINAL SCRAPING SUMMARY ===")
    logger.info(f"📊 Subreddits processed: {len(aggregated_results['subreddits'])}")
    logger.info(f"💬 Total comments collected: {total_comments}")
    logger.info(f"👥 Total unique authors: {len(aggregated_results['authors'])}")
    logger.info(f"📄 Total posts processed: {len(aggregated_results['posts'])}")
    logger.info(f"⏱️ Total scraping time: {format_time(total_elapsed)}")
    logger.info(f"🔄 Total API calls made: {global_api_call_count}")

    for subreddit in aggregated_results['subreddits']:
        subreddit_comments = [c for c in aggregated_results['comments'] if c['subreddit'] == subreddit]
        logger.info(f"  📂 r/{subreddit}: {len(subreddit_comments)} comments")

    return aggregated_results

def lambda_handler(event, context):
    """
    AWS Lambda handler function.
    This function acts as the entry point for API Gateway requests.
    """
    logger.info("Received event: %s", json.dumps(event, indent=2))
    
    # Check if the request body is present
    if 'body' not in event or not event['body']:
        logger.error("Request body is missing or empty.")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({"status": "error", "message": "Request body missing"})
        }

    try:
        # Parse the JSON body from the API Gateway event
        body = json.loads(event['body'])
        subreddits = body.get('subreddits', [])
        post_limit = body.get('post_limit', 100)
        
        # Call the main scraping logic
        aggregated_results = asyncio.run(scrape_comments_async(subreddits, post_limit))
        
        # Prepare the response for API Gateway
        response_body = {
            "status": "success",
            "message": "Scraping completed successfully",
            "data": aggregated_results
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', # Adjust this for production to be more secure
            },
            'body': json.dumps(response_body, default=str)
        }
        
    except json.JSONDecodeError as e:
        logger.error("JSON decode error: %s", str(e))
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({"status": "error", "message": "Invalid JSON in request body"})
        }
    except ValueError as e:
        logger.error("Validation error: %s", str(e))
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({"status": "error", "message": str(e)})
        }
    except Exception as e:
        logger.error("An unexpected error occurred: %s", str(e))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({"status": "error", "message": "An unexpected error occurred"})
        }