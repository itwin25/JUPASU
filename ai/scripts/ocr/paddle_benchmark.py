from paddleocr import PaddleOCR
import os
import time
import json
import subprocess

def run_paddle_benchmark():
    # 1. 모델 초기화 (한국어+영어)
    print(">>> Initializing PaddleOCR...")
    ocr = PaddleOCR(use_angle_cls=True, lang='korean', show_log=False)
    
    image_dir = "data/ocr/images"
    meta_path = "data/ocr/test_metadata.json"
    
    if not os.path.exists(meta_path):
        print(f"Error: {meta_path} not found.")
        return ""

    with open(meta_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    
    sample_images = list(metadata.keys())[:5]
    results = []

    print(f"\n>>> Running Benchmark on {len(sample_images)} images...")
    
    for fname in sample_images:
        img_path = os.path.join(image_dir, fname)
        label = metadata[fname]
        
        if not os.path.exists(img_path):
            continue
            
        start_time = time.time()
        result = ocr.ocr(img_path, cls=True)
        latency = (time.time() - start_time) * 1000
        
        detected_text = ""
        if result and result[0]:
            detected_text = " ".join([line[1][0] for line in result[0]])
        
        results.append({
            "filename": fname,
            "pred": detected_text,
            "ref": label,
            "latency": latency
        })
        print(f"File: {fname} | Latency: {latency:.2f}ms")

    # 리포트 생성
    report = "\n### PaddleOCR Benchmark Result (CPU)\n"
    report += "| 파일명 | 인식 텍스트 | 정답 | 지연시간 |\n"
    report += "| --- | --- | --- | --- |\n"
    for r in results:
        report += f"| {r['filename']} | {r['pred'][:30]}... | {r['ref']} | {r['latency']:.1f}ms |\n"
    
    return report

if __name__ == "__main__":
    report_content = run_paddle_benchmark()
    
    # 윈도우 사용자명 가져오기
    try:
        win_user = subprocess.check_output(['cmd.exe', '/c', 'echo %USERNAME%'], stderr=subprocess.DEVNULL).decode('utf-8').strip()
        daily_note_path = f"/mnt/c/Users/{win_user}/Documents/Obsidian Vault/Daily_Notes/2026-03-11.md"
        
        if os.path.exists(daily_note_path):
            with open(daily_note_path, "a", encoding="utf-8") as f:
                f.write(report_content)
            print(f"\n>>> Results recorded to Obsidian: {daily_note_path}")
        else:
            print(f"\n>>> Daily note not found at {daily_note_path}. Results:")
            print(report_content)
    except Exception as e:
        print(f"\n>>> Error writing to Obsidian: {e}")
        print(report_content)
