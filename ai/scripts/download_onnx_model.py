import os
from huggingface_hub import snapshot_download

def download_onnx():
    repo_id = "onnx-community/Florence-2-large"
    local_dir = "data/onnx_model/Florence-2-large"
    
    print(f"Downloading {repo_id} to {local_dir}...")
    
    # Download the ONNX snapshot
    snapshot_download(
        repo_id=repo_id,
        local_dir=local_dir,
        local_dir_use_symlinks=False, # Copy files instead of linking
        ignore_patterns=["*.msgpack", "*.h5"] # We only need ONNX and configs
    )
    print("Download complete!")

if __name__ == "__main__":
    download_onnx()
