import os
import cv2
import numpy as np
import time

# 모델 소스 체크 비활성화
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
from paddleocr import PaddleOCR

class WineLabelPipeline:
    def __init__(self, model_type='mobile'):
        self.model_type = model_type
        self.model_name = f"PP-OCRv5-{model_type}"
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        if model_type == 'server':
            det_dir = os.path.join(base_dir, 'models/PP-OCRv5/server_det')
            rec_dir = os.path.join(base_dir, 'models/PP-OCRv5/server_rec')
        else:
            det_dir = os.path.join(base_dir, 'models/PP-OCRv5/mobile_det')
            rec_dir = os.path.join(base_dir, 'models/PP-OCRv5/mobile_rec')
            
        self.ocr = PaddleOCR(
            text_detection_model_dir=det_dir,
            text_recognition_model_dir=rec_dir,
            use_textline_orientation=False,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            lang='en',
            device='cpu',
            enable_mkldnn=False
        )

    def _preprocess(self, img):
        """부드러운 정밀도 전처리: 자연스러운 윤곽 강조"""
        h, w = img.shape[:2]
        
        # 1. 적정 해상도 확대 (1280px)
        target_side = 1280
        scale = target_side / max(h, w)
        img = cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_LINEAR)
        
        # 2. 그레이스케일 변환
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3. 부드러운 노이즈 제거 (Median Blur)
        denoised = cv2.medianBlur(gray, 3)
        
        # 4. 적절한 대비 향상 (CLAHE - clipLimit 낮춤)
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8,8))
        contrast = clahe.apply(denoised)
        
        # 5. 아주 약한 Unsharp Mask (테두리 살짝만)
        gaussian = cv2.GaussianBlur(contrast, (0, 0), 1.0)
        refined = cv2.addWeighted(contrast, 1.2, gaussian, -0.2, 0)
        
        processed_bgr = cv2.cvtColor(refined, cv2.COLOR_GRAY2BGR)
        return processed_bgr

    def process_image(self, image_path, use_preproc=True):
        """이미지에서 텍스트를 추출"""
        img = cv2.imread(image_path)
        if img is None: return []
        
        if use_preproc:
            img = self._preprocess(img)
        
        result = self.ocr.predict(img)
        
        extracted_texts = []
        for res in result:
            if hasattr(res, 'json') and 'res' in res.json:
                rec_texts = res.json['res'].get('rec_texts', [])
                extracted_texts.extend(rec_texts)
        return extracted_texts

if __name__ == "__main__":
    pipeline = WineLabelPipeline(model_type='mobile')
    test_image = "data/images/abbazia-moscato-dolce_nv_2115561.png"
    if os.path.exists(test_image):
        start = time.time()
        texts = pipeline.process_image(test_image, use_preproc=True)
        print(f"Model: {pipeline.model_name} | Time: {time.time()-start:.2f}s")
        print("Recognized (Soft Precision):", texts)
