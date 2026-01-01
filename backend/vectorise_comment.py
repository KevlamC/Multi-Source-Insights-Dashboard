import os
import torch
import torch.nn.functional as F
import numpy as np
from dotenv import load_dotenv
from transformers import AutoModel, AutoTokenizer
from typing import List

load_dotenv()

MODEL_ID = "sentence-transformers/multi-qa-MiniLM-L6-cos-v1"
# Use environment variable for flexibility, default to ~/models/m for local development
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", os.path.expanduser("~/models/m"))

try:
    tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_PATH, local_files_only=True)
    model = AutoModel.from_pretrained(LOCAL_MODEL_PATH, local_files_only=True)
except Exception as e:
    print(f"❌ Error loading model: {e}")
    tokenizer, model = None, None

# Initialiase a constant specifying the batch size to feed to the vector database
BATCH_SIZE = 500

# Mean Pooling - Take average of all tokens
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0] # First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

def clear_vector_db(supabase):

    # Define the table to clear 
    table_to_clear = 'reddit_records'

    print(f"🧹 Clearing {table_to_clear} vector database for new scraping session...")

    try:
        supabase.rpc("clear_reddit_records_table").execute()
        print(f"✅ Successfully cleared {table_to_clear}")
    except Exception as e:
        print(f"❌ Error clearing {table_to_clear}: {e}")

# Corrected function with proper syntax
def vectorise_batch(comments: List[dict]):
    """
    Vectorizes a list of comments in a single batch.
    
    Args:
        comments (List[dict]): A list of comment dictionaries, each with at least an 'id' and 'body'.

    Returns:
        List[dict]: A list of vector records ready for insertion into Supabase.
    """
    if not tokenizer or not model:
        print("❌ Model not loaded, skipping vectorization.")
        return []
    
    comment_bodies = [c.get("body", "") for c in comments]

    try:
        encoded_input = tokenizer(
            comment_bodies,
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=128
        )
        
        with torch.no_grad():
            model_output = model(**encoded_input)
        
        embeddings = mean_pooling(model_output, encoded_input['attention_mask'])

        embeddings = F.normalize(embeddings, p=2, dim=1)

        vector_records = []
        for i, embedding in enumerate(embeddings):
            vector_records.append({
                "id": comments[i].get("id"),
                "embedding": embedding.tolist(),
                })
        return vector_records
    except Exception as e:
        print(f"Embedding error: {e}")
        return []