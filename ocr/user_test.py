# Initialize PaddleOCR instance
import os
from paddleocr import PaddleOCR

# 출력 디렉토리 생성
os.makedirs("output", exist_ok=True)

# 사용자님이 제공하신 설정으로 초기화
# v5 모델을 내부적으로 로드하려고 시도할 것입니다.
ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False)

# 샘플 이미지로 추론 실행
sample_url = "https://paddle-model-ecology.bj.bcebos.com/paddlex/imgs/demo_image/general_ocr_002.png"
print(f"--- Running OCR on {sample_url} ---")

result = ocr.predict(input=sample_url)

# 결과 시각화 및 저장
for res in result:
    res.print()
    res.save_to_img("output")
    res.save_to_json("output")

print("\n--- Process Completed. Check 'output' directory. ---")
