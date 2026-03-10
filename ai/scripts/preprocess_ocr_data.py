import json
import os

def refine_metadata(source_json, output_path):
    """
    대용량 Vivino 결과 JSON에서 OCR 테스트에 필요한 {파일명: 와인이름} 정보만 추출합니다.
    """
    if not os.path.exists(source_json):
        print(f"Source file not found: {source_json}")
        return

    with open(source_json, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    refined = {}
    for entry in data:
        # local_image_path: "/home/ssafy/.../images/wine_name.png" -> "wine_name.png"
        orig_path = entry.get("local_image_path", "")
        filename = os.path.basename(orig_path)
        
        if filename and "wine_name" in entry:
            refined[filename] = entry["wine_name"]
            
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(refined, f, indent=4, ensure_ascii=False)
    
    print(f"Successfully refined {len(refined)} items.")
    print(f"Output saved to: {output_path}")

if __name__ == "__main__":
    # 프로젝트 경로에 맞게 설정
    SRC_JSON = "crawled-results/data_results/vivino_mass_production_results.json"
    DST_JSON = "data/ocr/test_metadata.json"
    
    refine_metadata(SRC_JSON, DST_JSON)
