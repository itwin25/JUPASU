import os
import cv2
import numpy as np
import onnxruntime as ort
from huggingface_hub import hf_hub_download
import pyclipper
from shapely.geometry import Polygon

class WineLabelONNXPipeline:
    def __init__(self, lang='english'):
        self.model_name = "PP-OCRv5-ONNX-Optimized"
        self.lang = lang
        self._setup_models()
        
        providers = ['CPUExecutionProvider']
        if 'CUDAExecutionProvider' in ort.get_available_providers():
            providers.insert(0, 'CUDAExecutionProvider')
        
        self.det_session = ort.InferenceSession(self.det_model_path, providers=providers)
        self.rec_session = ort.InferenceSession(self.rec_model_path, providers=providers)
        
        with open(self.dict_path, 'r', encoding='utf-8') as f:
            # PaddleOCR ONNX 모델들은 보통 사전 파일 자체가 0번 인덱스부터 시작하거나
            # 내부적으로 blank 처리가 되어 있어 중복 삽입 시 인덱스가 밀릴 수 있음
            self.character = [line.strip('\r\n') for line in f.readlines()]

    def _setup_models(self):
        # 최적화된 모델 경로 사용
        model_dir = "./models/optimized_final"
        
        # 검출 모델 (공통)
        self.det_model_path = os.path.join(model_dir, "PP-OCRv5_mobile_det_optimized.onnx")
        
        # 언어별 인식 모델 및 사전 설정
        if self.lang == 'korean':
            self.rec_model_path = os.path.join(model_dir, "hfonnx_korean_PP-OCRv5_mobile_rec_optimized.onnx")
            self.dict_path = os.path.join(model_dir, "dicts/korean_dict.txt")
        else: # 기본 영어(latin)
            self.rec_model_path = os.path.join(model_dir, "hfonnx_latin_PP-OCRv5_mobile_rec_optimized.onnx")
            self.dict_path = os.path.join(model_dir, "dicts/english_dict.txt")

    def _preprocess_det(self, img):
        h, w = img.shape[:2]
        limit_side_len = 960
        ratio = limit_side_len / max(h, w)
        new_h, new_w = int(h * ratio), int(w * ratio)
        new_h, new_w = int(np.ceil(new_h / 32) * 32), int(np.ceil(new_w / 32) * 32)
        resized_img = cv2.resize(img, (new_w, new_h))
        mean = np.array([0.485, 0.456, 0.406], dtype='float32')
        std = np.array([0.229, 0.224, 0.225], dtype='float32')
        normalized_img = (resized_img.astype('float32') / 255.0 - mean) / std
        return normalized_img.transpose((2, 0, 1))[np.newaxis, :].astype('float32'), ratio

    def _postprocess_det(self, pred, ratio, ori_shape):
        mask = pred[0, 0, :, :] > 0.3
        bitmap = (mask * 255).astype(np.uint8)
        contours, _ = cv2.findContours(bitmap, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        boxes = []
        for contour in contours:
            points = contour.reshape(-1, 2)
            if points.shape[0] < 4: continue
            
            rect = cv2.minAreaRect(points)
            box = cv2.boxPoints(rect)
            
            # Pyclipper 메서드 이름 수정 (AddPath, Execute)
            poly = Polygon(box)
            distance = poly.area * 1.5 / poly.length
            offset = pyclipper.PyclipperOffset()
            offset.AddPath(box, pyclipper.JT_ROUND, pyclipper.ET_CLOSEDPOLYGON)
            expanded = offset.Execute(distance)
            if not expanded: continue
            
            expanded_box = np.array(expanded[0])
            expanded_box = expanded_box / ratio
            boxes.append(expanded_box.astype(np.int32))
        return boxes

    def _preprocess_rec(self, img):
        target_h = 48
        h, w = img.shape[:2]
        if h == 0 or w == 0: return None
        target_w = int(target_h * (w / h))
        # 너무 긴 텍스트 제한
        target_w = min(target_w, 1000)
        resized_img = cv2.resize(img, (target_w, target_h))
        resized_img = (resized_img.astype('float32') / 255.0 - 0.5) / 0.5
        return resized_img.transpose((2, 0, 1))[np.newaxis, :].astype('float32')

    def _ctc_decode(self, preds):
        # 차원 정리 (예: [1, seq, dict] -> [seq, dict])
        x = np.squeeze(preds)
        if x.ndim == 1: x = x[np.newaxis, :]
        
        # 수치 안정성을 위해 max 값을 뺀 후 softmax 적용
        e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
        probs = e_x / np.sum(e_x, axis=-1, keepdims=True)
        
        preds_idx = probs.argmax(axis=-1)
        preds_prob = probs.max(axis=-1)
        
        text = ""
        score = 0.0
        count = 0
        
        for i in range(len(preds_idx)):
            # 모델 출력 인덱스 0, 1은 blank/special 토큰으로 예약됨
            # 실제 사전의 첫 번째 문자(0)는 모델 인덱스 2에 대응함
            if preds_idx[i] > 1 and (i == 0 or preds_idx[i] != preds_idx[i-1]):
                char_idx = preds_idx[i] - 2
                if char_idx < len(self.character):
                    text += self.character[char_idx]
                    score += preds_prob[i]
                    count += 1
        
        final_score = score / count if count > 0 else 0.0
        return text, float(final_score)

    def process_image(self, image_path):
        img = cv2.imread(image_path)
        if img is None: return []
        
        blob, ratio = self._preprocess_det(img)
        det_preds = self.det_session.run(None, {self.det_session.get_inputs()[0].name: blob})[0]
        boxes = self._postprocess_det(det_preds, ratio, img.shape)
        
        # 박스 정렬 (위에서 아래로)
        boxes = sorted(boxes, key=lambda x: np.min(x, axis=0)[1])
        
        results = []
        for box in boxes:
            x_min, y_min = np.min(box, axis=0)
            x_max, y_max = np.max(box, axis=0)
            x_min, y_min = max(0, x_min), max(0, y_min)
            x_max, y_max = min(img.shape[1], x_max), min(img.shape[0], y_max)
            
            if x_max - x_min < 5 or y_max - y_min < 5: continue
            
            crop_img = img[int(y_min):int(y_max), int(x_min):int(x_max)]
            rec_blob = self._preprocess_rec(crop_img)
            if rec_blob is None: continue
            
            rec_preds = self.rec_session.run(None, {self.rec_session.get_inputs()[0].name: rec_blob})[0]
            # 디버깅: 모델 출력의 값 범위 확인
            # print(f"DEBUG: rec_preds shape: {rec_preds.shape}, range: [{rec_preds.min()}, {rec_preds.max()}]")
            text, score = self._ctc_decode(rec_preds)
            if text:
                results.append({
                    'text': text,
                    'score': float(score),
                    'box': box.tolist()
                })
            
        return results

if __name__ == "__main__":
    pipeline = WineLabelONNXPipeline()
    test_image = "data/images/abbazia-moscato-dolce_nv_2115561.png"
    if os.path.exists(test_image):
        import time
        start = time.time()
        res = pipeline.process_image(test_image)
        print(f"ONNX Inference Time: {time.time()-start:.2f}s")
        print("Recognized Texts:", res)
