import os
import sys
from pathlib import Path
import shutil
from sentence_transformers import SentenceTransformer
from huggingface_hub import snapshot_download # Import snapshot_download

print('Attempting to download and prepare sentence-transformers/multi-qa-MiniLM-L6-cos-v1...', flush=True)

try:
    # Use ~/models/m for local development (change LOCAL_MODEL_PATH in config to match)
    # For Lambda, would use /var/task/hf_cache
    hf_home_dir = Path(os.getenv("HF_HOME", os.path.expanduser("~/models")))
    local_model_dir_name = "m"  # matches the "m" in ~/models/m
    target_local_model_path = hf_home_dir / local_model_dir_name
    
    # Ensure the target directory exists and is clean
    if target_local_model_path.exists():
        print(f"Clearing existing directory: {target_local_model_path}", flush=True)
        shutil.rmtree(target_local_model_path)
    
    target_local_model_path.mkdir(parents=True, exist_ok=True)
    print(f'Target model directory created (or ensured clean): {target_local_model_path}', flush=True)

    # Use snapshot_download to get the model directly from Hugging Face Hub
    # This downloads to the default HF cache (usually ~/.cache/huggingface/hub or what HF_HOME points to)
    # The returned path is the actual path to the downloaded model's files in the cache.
    print('Downloading model using huggingface_hub.snapshot_download()...', flush=True)
    downloaded_path = snapshot_download(
        repo_id='sentence-transformers/multi-qa-MiniLM-L6-cos-v1',
        cache_dir=str(hf_home_dir) # Use our HF_HOME as the cache directory
    )
    print(f'Model downloaded successfully to: {downloaded_path}', flush=True)

    # Now, manually copy the contents of the downloaded model to our target local path
    print(f'Copying model files from {downloaded_path} to {target_local_model_path}...', flush=True)
    shutil.copytree(downloaded_path, target_local_model_path, dirs_exist_ok=True)
    print(f'Model files copied COMPLETE to: {target_local_model_path}', flush=True)
    
    # Validation step: Try to load the model from the saved directory
    print(f'Validating model files by reloading from: {target_local_model_path}', flush=True)
    try:
        # Load the model from the newly created directory to confirm integrity
        _ = SentenceTransformer(str(target_local_model_path), device='cpu')
        print('Model validation successful: Reloaded from saved directory.', flush=True)
    except Exception as e:
        print(f'FATAL ERROR: Model validation failed. The saved model is corrupted or incomplete. Error: {e}', file=sys.stderr, flush=True)
        sys.exit(1)
    
    # Write a marker file to indicate successful download
    marker_file = hf_home_dir / ".model_downloaded"
    with open(marker_file, 'w') as f:
        f.write(local_model_dir_name)
    
    print(f'✅ Model successfully downloaded and validated at: {target_local_model_path}', flush=True)

except Exception as e:
    print(f'FATAL ERROR IN download_model.py: {e}', file=sys.stderr, flush=True)
    sys.exit(1)