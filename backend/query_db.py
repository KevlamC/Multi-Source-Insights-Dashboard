import os
import torch
import torch.nn.functional as F
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModel
from . import category_config
from .models import FilterRequest # NEW: Import FilterRequest from models.py
import logging # Import logging
from supabase import create_client, Client # Added create_client, Client


# Configure logging for query_db.py
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("query_db")

load_dotenv()

# Initialize a new Supabase client
url: str = os.environ.get("VECTORDB_URL")
key: str = os.environ.get("VECTORDB_API_KEY")

# Add explicit checks for these specific vector database environment variables
if not url:
    logger.error("VECTORDB_URL environment variable is not set. Please ensure it's provided.")
    # In a production Lambda, this might need a more robust error handling or exit strategy
    # For now, we'll let it proceed and rely on subsequent supabase client calls to fail.
if not key:
    logger.error("VECTORDB_API_KEY environment variable is not set. Please ensure it's provided.")
    # Same as above for key

supabase: Client = create_client(url, key) if url and key else None # Initialize client only if credentials exist


# Load embedding model
MODEL_ID = "sentence-transformers/multi-qa-MiniLM-L6-cos-v1"

# Define the explicit local path where the model was downloaded in the Dockerfile
# This path should match 'multi-qa-MiniLM-L6-cos-v1-local' inside HF_HOME
# HF_HOME_DIR = os.getenv("HF_HOME", "/app/hf_cache") # Get HF_HOME, default to /app/hf_cache
# LOCAL_MODEL_PATH = os.path.join(HF_HOME_DIR, 'multi-qa-MiniLM-L6-cos-v1-local')

# === SOILA: TROUBLESHOOTING MODEL ISSUE === #
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", os.path.expanduser("~/models/m"))

# --- DIAGNOSTIC PRINTS (CRITICAL FOR DEBUGGING THIS ISSUE) ---
# These logs will show us where the system is looking for the model and what it finds.
logger.info(f"HF_HOME environment variable: {os.getenv('HF_HOME')}")
logger.info(f"TRANSFORMERS_OFFLINE environment variable: {os.getenv('TRANSFORMERS_OFFLINE')}")
logger.info(f"Attempting to load model from LOCAL_MODEL_PATH: {LOCAL_MODEL_PATH}")

# Check if the LOCAL_MODEL_PATH exists
# if not os.path.isdir(LOCAL_MODEL_PATH):
#     logger.error(f"LOCAL_MODEL_PATH does NOT exist: {LOCAL_MODEL_PATH}")
#     # Attempt to list contents of the parent directory to see if there's a typo or incorrect structure
#     if os.path.isdir(HF_HOME_DIR):
#         logger.error(f"Listing contents of {HF_HOME_DIR}: {os.listdir(HF_HOME_DIR)}")
#     else:
#         logger.error(f"HF_HOME_DIR also does NOT exist: {HF_HOME_DIR}")
# else:
#     logger.info(f"LOCAL_MODEL_PATH exists: {LOCAL_MODEL_PATH}")
    
# Check for config.json specifically, as it's a critical file for model loading
config_path = os.path.join(LOCAL_MODEL_PATH, 'config.json')
logger.info(f"Checking for config.json at: {config_path}")
if os.path.exists(config_path):
    logger.info("config.json FOUND at specified local path!")
else:
    logger.error("config.json NOT FOUND at specified local path.")
    # Only try to list contents if the directory actually exists
    if os.path.isdir(LOCAL_MODEL_PATH):
        logger.error("Listing contents of LOCAL_MODEL_PATH:")
        # List all files and directories recursively to aid debugging the file structure
        for root, dirs, files in os.walk(LOCAL_MODEL_PATH):
            logger.error(f"  Dir: {root}, Files: {files}, Dirs: {dirs}")
# --- END DIAGNOSTIC PRINTS ---

# Load the tokenizer and model directly from the local path
# local_files_only=True is now appropriate as we are pointing to a known local directory
# These should only be initialized once.
try:
    tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_PATH, local_files_only=True)
    model = AutoModel.from_pretrained(LOCAL_MODEL_PATH, local_files_only=True)
    logger.info("✅ Model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load model: {e}. Vector search will be disabled.")
    logger.info("⚠️  To fix this, run: python backend/download_model.py")
    tokenizer = None
    model = None


# Mean Pooling - Take average of all tokens
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0] # First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

def embed_target(target: str):
    try:

        # Tokenize target query
        encoded_input = tokenizer(
            [target],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128
        )

        # Compute vector embedding for target
        with torch.no_grad():
            model_output = model(**encoded_input)

        # Perform pooling
        target_embedding = mean_pooling(model_output, encoded_input['attention_mask'])

        # Normalize embeddings
        target_embedding = F.normalize(target_embedding, p=2, dim=1)
        return target_embedding[0].tolist()
    
    except Exception as e:
            logger.error(f"Embedding error: {e}", exc_info=True)
            return None

def get_max_similarity_by_id(rows):
    best = {}
    for r in rows:
        rid = r.get("id")
        if not rid: 
            continue
        s = float(r.get("similarity", 0))
        if rid not in best or s > float(best[rid].get("similarity", 0)):
            best[rid] = r
    return best

def similarity_search(target: str, top_k: int, threshold:float, filters: FilterRequest):

    # Ensure FilterRequest is properly handled, even if empty
    if not isinstance(filters, FilterRequest):
        filters = FilterRequest() # Default empty filters

    subreddit_filter = None
    emotion_filter = None
    intensity_score_filter = None
    topic_filter = None
    practitioner_types_filter = None
    time_filter = None

    # ==== Soila - Add other boolean filters if they are passed through this function ==== #
    # desire_and_wish_filter = None
    # trigger_phrase_filter = None
    # metaphors_filter = None
    # question_filter = None
    # practitioner_reference_filter = None
    # painpointsxfrustrations_filter = None
    # failed_solutions_filter = None

    target_embed = embed_target(target)
    if target_embed is None:
        logger.error("Failed to generate embedding for target query.")
        return []

    # Extracting the filter criteria from FilterRequest
    if filters.subreddits is not None:
        subreddit_filter = filters.subreddits

    if filters.emotions is not None:
        emotion_filter = filters.emotions

    if filters.min_intensity is not None:
        intensity_score_filter = filters.min_intensity

    if filters.topics is not None:
        topic_filter = filters.topics

    if filters.practitioner_types is not None: # Corrected from practitioner_type to practitioner_types
        practitioner_types_filter = filters.practitioner_types
    
    if filters.time is not None:
        time_filter = filters.time

    # ==== Soila -> Remove filters that are not used as metadata in the vector db ==== #
    # if filters.desire_and_wish is not None:
    #     desire_and_wish_filter = filters.desire_and_wish
    # if filters.trigger_phrase is not None:
    #     trigger_phrase_filter = filters.trigger_phrase
    # if filters.metaphors is not None:
    #     metaphors_filter = filters.metaphors
    # if filters.question is not None:
    #     question_filter = filters.question
    # if filters.practitioner_reference is not None:
    #     practitioner_reference_filter = filters.practitioner_reference
    # if filters.painpointsxfrustrations is not None:
    #     painpointsxfrustrations_filter = filters.painpointsxfrustrations
    # if filters.failed_solutions is not None:
    #     failed_solutions_filter = filters.failed_solutions

    if not supabase:
        logger.error("Supabase client is not initialized, cannot perform RPC call.")
        return []
    
    try:
        res = supabase.rpc("match_reddit_records", {
            "query_embedding": target_embed,
            "match_threshold": threshold,
            "match_count": top_k,
            "probes": 20,
            "subreddit_filter": subreddit_filter,
            "emotion_filter": emotion_filter,
            "intensity_score_filter": intensity_score_filter,
            "topic_filter": topic_filter,
            "practitioner_types_filter": practitioner_types_filter, # Corrected key
            "time_filter": time_filter

            # ==== Soila -> Remove filters that are not used as metadata in the vector db ==== #
            # "desire_and_wish_filter": desire_and_wish_filter,
            # "trigger_phrase_filter": trigger_phrase_filter,
            # "metaphors_filter": metaphors_filter,
            # "question_filter": question_filter,
            # "practitioner_reference_filter": practitioner_reference_filter,
            # "painpointsxfrustrations_filter": painpointsxfrustrations_filter,
            # "failed_solutions_filter": failed_solutions_filter
        }).execute()

        if getattr(res, "error", None):
            logger.error(f"Supabase RPC error: {res.error.get('message', 'Unknown error')}", exc_info=True)
            raise RuntimeError(res.error.get("message", "Supabase RPC error"))
        
        return res.data or []
    except Exception as e:
        logger.error(f"Error in similarity_search RPC call: {e}", exc_info=True)
        raise

def fetch_by_feature(feature: str, k_per: int, threshold: float, max_out: int):

    # Get the category for filtering
    cfg = category_config.CFG.get(feature)
    if not cfg:
        logger.error(f"Feature '{feature}' not found in category_config.CFG")
        return []

    # 1) Loop through each expansion and return relevant comments to the category
    pool = []                                           
    for q in cfg["expansions"]:
        # Filters parameter in similarity_search should be a FilterRequest instance
        # If feature-specific filters are needed, create a FilterRequest here.
        pool.extend(similarity_search(q, top_k=k_per, threshold=threshold, filters=FilterRequest()) or []) # Passed empty FilterRequest
    
    # 2) Merge by max similarity: fetch max similarity for each comment
    best = get_max_similarity_by_id(pool)

    # 3) python-side filter
    inc = cfg.get("inc"); 
    exc = cfg.get("exc"); 
    first = cfg.get("require_first"); 
    min_len = cfg.get("min_len", 0) # Default to 0 if not specified
    max_len = cfg.get("max_len", float('inf')) # Default to infinity if not specified

    out = []
    for r in best.values():
        txt = (r.get("comment") or "")
        if len(txt) < min_len or len(txt) > max_len:
            continue
        if first and not category_config.RX_FIRST.search(txt):
            continue
        if inc and not inc.search(txt):
            continue
        # Only check if 'exc' is defined AND its search returns a match (meaning it should be excluded)
        if exc and exc.search(txt):
            continue
        
        out.append(r)

    # 4) rank & return
    out.sort(key=lambda r: float(r.get("similarity", 0.0)), reverse=True)
    return out[:max_out]