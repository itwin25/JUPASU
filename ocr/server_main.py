import os
import cv2
import numpy as np
import time

# 모델 소스 체크 비활성화
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
from paddleocr import PaddleOCR

class WineLabelServerPipeline:
    def __init__(self):
        self.model_name = "PP-OCRv5-server"
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 서버 모델 경로 설정
        det_dir = os.path.join(base_dir, 'models/PP-OCRv5/server_det')
        rec_dir = os.path.join(base_dir, 'models/PP-OCRv5/server_rec')
            
        # PaddleOCR 서버 모델 초기화
        self.ocr = PaddleOCR(
            text_detection_model_dir=det_dir,
            text_recognition_model_dir=rec_dir,
            use_textline_orientation=False,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            lang='en',
            device='cpu',
            enable_mkldnn=False # CPU 환경의 PIR 엔진 충돌 방지 핵심 설정
        )

    def _preprocess(self, img):
        """서버 모델의 정밀도를 극대화하는 전처리"""
        h, w = img.shape[:2]
        target_long_side = 1000
        current_long_side = max(h, w)
        
        if current_long_side > target_long_side or current_long_side < 600:
            scale = target_long_side / current_long_side
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        
        # 그레이스케일 및 대비 향상 (CLAHE)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrast = clahe.apply(gray)
        
        # 모델 입력 규격(3채널) 유지
        processed_bgr = cv2.cvtColor(contrast, cv2.COLOR_GRAY2BGR)
        return processed_bgr

    def process_image(self, image_path, use_preproc=True):
        """이미지에서 고정밀 텍스트 추출"""
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        if use_preproc:
            img = self._preprocess(img)
        
        # 추론 실행
        result = self.ocr.predict(img)
        
        extracted_texts = []
        for res in result:
            if hasattr(res, 'json') and 'res' in res.json:
                rec_texts = res.json['res'].get('rec_texts', [])
                extracted_texts.extend(rec_texts)
                
        return extracted_texts

if __name__ == "__main__":
    pipeline = WineLabelServerPipeline()
    test_image = "data/images/abbazia-moscato-dolce_nv_2115561.png"
    if os.path.exists(test_image):
        print(f"--- Running Server Model ({pipeline.model_name}) ---")
        start = time.time()
        texts = pipeline.process_image(test_image, use_preproc=True)
        end = time.time()
        print(f"Time taken: {end - start:.2f}s")
        print("Recognized:", texts)
