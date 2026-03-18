import json
import os

def extract_dict_from_config(config_path, output_path):
    print(f"Extracting dictionary from {config_path}...")
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # PostProcess 내의 character_dict 추출
        char_list = data.get("PostProcess", {}).get("character_dict", [])
        
        if not char_list:
            print(f"No character_dict found in {config_path}")
            return
        
        # 한 줄에 하나씩 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            for char in char_list:
                f.write(f"{char}\n")
        
        print(f"Successfully saved {len(char_list)} characters to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    models_base = "models/onnx/hfonnx/models"
    
    # 1. 한국어 모델
    ko_config = os.path.join(models_base, "korean_PP-OCRv5_mobile_rec/config.json")
    ko_dict = os.path.join(models_base, "korean_PP-OCRv5_mobile_rec/dict.txt")
    extract_dict_from_config(ko_config, ko_dict)
    
    # 2. 라틴(유럽어) 모델
    la_config = os.path.join(models_base, "latin_PP-OCRv5_mobile_rec/config.json")
    la_dict = os.path.join(models_base, "latin_PP-OCRv5_mobile_rec/dict.txt")
    extract_dict_from_config(la_config, la_dict)

    # 3. 통합 저장소(optimized_final)용으로 복사본 생성
    os.makedirs("models/optimized_final/dicts", exist_ok=True)
    import shutil
    if os.path.exists(ko_dict):
        shutil.copy(ko_dict, "models/optimized_final/dicts/korean_dict.txt")
    if os.path.exists(la_dict):
        shutil.copy(la_dict, "models/optimized_final/dicts/latin_dict.txt")
    # 기존에 있던 영어 사전도 복사
    eng_orig = "models/onnx/languages/english/dict.txt"
    if os.path.exists(eng_orig):
        shutil.copy(eng_orig, "models/optimized_final/dicts/english_dict.txt")
