import os
import json
import time
from datetime import datetime
from main import WineLabelPipeline

def run_evaluation(limit=None):
    # 1. 출력 디렉토리 준비
    output_dir = 'output'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")
    
    # 2. 메타데이터 로드
    metadata_path = 'data/test_metadata.json'
    if not os.path.exists(metadata_path):
        print(f"Error: Metadata file {metadata_path} not found.")
        return
        
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    # 3. 파이프라인 초기화
    print("Initializing OCR Pipeline (Mobile)...")
    pipeline = WineLabelPipeline(model_type='mobile')
    model_name = pipeline.model_name
    
    results = []
    print(f"\nModel: {model_name}")
    print(f"{'Image Path':<50} | {'Time':<8} | {'Recognized Text'}")
    print("-" * 130)
    
    count = 0
    total_time = 0
    items = list(metadata.items())
    eval_limit = limit if limit is not None else len(items)
    
    for img_name, stored_name in items[:eval_limit]:
        img_path = os.path.join('data/images', img_name)
        
        if os.path.exists(img_path):
            # OCR 실행 및 시간 측정
            start_time = time.time()
            recognized_texts = pipeline.process_image(img_path)
            duration = time.time() - start_time
            
            total_time += duration
            recognized_str = " ".join(recognized_texts)
            
            # 결과 저장 및 출력
            print(f"{img_name[:47]+'...':<50} | {duration:6.2f}s | {recognized_str[:50]}")
            
            results.append({
                "filename": img_name,
                "ground_truth": stored_name,
                "recognized": recognized_str,
                "inference_time_sec": round(duration, 3),
                "raw_list": recognized_texts
            })
            count += 1
        else:
            print(f"Warning: {img_path} not found.")

    # 4. 결과 파일 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    result_filename = f"ocr_results_{timestamp}.json"
    result_path = os.path.join(output_dir, result_filename)
    
    avg_time = total_time / count if count > 0 else 0
    summary = {
        "evaluation_date": datetime.now().isoformat(),
        "model": model_name,
        "total_evaluated": count,
        "average_time_per_image": round(avg_time, 3),
        "total_time_sec": round(total_time, 3),
        "results": results
    }
    
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    # 최신 결과 링크 (ocr_results_latest.json)
    latest_path = os.path.join(output_dir, "ocr_results_latest.json")
    with open(latest_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("-" * 130)
    print(f"Evaluation complete. Model: {model_name}")
    print(f"Avg Time: {avg_time:.2f}s | Total Time: {total_time:.2f}s")
    print(f"Results saved to: {result_path}")

    return results

if __name__ == "__main__":
    # 10개 샘플로 테스트
    run_evaluation(limit=10)
