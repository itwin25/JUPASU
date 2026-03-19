import cv2
from onnx_main import WineLabelONNXPipeline
import os

def test_english():
    # 1. 영어(라틴) 파이프라인 초기화
    pipeline = WineLabelONNXPipeline(lang='english')
    
    # 2. 테스트 이미지 선택
    image_dir = "data/images"
    sample_images = [f for f in os.listdir(image_dir) if f.endswith('.png')]
    if not sample_images: return
        
    test_image = os.path.join(image_dir, sample_images[0])
    print(f"Testing English OCR with image: {test_image}")

    # 3. OCR 실행
    results = pipeline.process_image(test_image)
    
    # 4. 결과 출력
    print("\n--- OCR Results ---")
    for res in results:
        print(f"Detected: {res['text']:<20} | Confidence: {res['score']*100:>6.1f}%")

if __name__ == "__main__":
    test_english()
