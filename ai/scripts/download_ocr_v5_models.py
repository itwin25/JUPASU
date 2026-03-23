import os
from huggingface_hub import snapshot_download
import concurrent.futures

models = [
    "PaddlePaddle/PP-OCRV5_MOBILE_DET",
    "PaddlePaddle/PP-OCRV5_MOBILE_REC",
    "PaddlePaddle/PP-OCRV5_SERVER_DET",
    "PaddlePaddle/PP-OCRV5_SERVER_REC",
    "PaddlePaddle/LATIN_PP-OCRV5_MOBILE_REC",
    "PaddlePaddle/ESLAV_PP-OCRV5_MOBILE_REC",
    "PaddlePaddle/KOREAN_PP-OCRV5_MOBILE_REC",
    "PaddlePaddle/PP-LCNET_X1_0_DOC_ORI",
    "PaddlePaddle/PP-LCNET_X1_0_TEXTLINE_ORI",
    "PaddlePaddle/PP-LCNET_X0_25_TEXTLINE_ORI",
    "PaddlePaddle/UVDOC"
]

base_dir = "ai/data/models/PP-OCRv5"

def download_model(repo_id):
    model_name = repo_id.split("/")[-1]
    local_dir = os.path.join(base_dir, model_name)
    print(f"Downloading {repo_id} to {local_dir}...")
    try:
        snapshot_download(
            repo_id=repo_id,
            local_dir=local_dir,
            local_dir_use_symlinks=False
        )
        return f"Successfully downloaded {repo_id}"
    except Exception as e:
        return f"Failed to download {repo_id}: {str(e)}"

if __name__ == "__main__":
    os.makedirs(base_dir, exist_ok=True)
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(download_model, models))
    
    for res in results:
        print(result)
