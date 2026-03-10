import os
import torch
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from optimum.onnxruntime import ORTModelForVision2Seq
from core.config import get_settings

class TrOCREngine:
    """
    실시간 서비스용 OCR 엔진입니다.
    최적화된 로컬 모델(ONNX/Quantized)을 우선적으로 로드하여 추론 속도를 높입니다.
    """
    def __init__(self):
        self.settings = get_settings()
        self.processor = None
        self.model = None
        # workbench.py에서 생성한 최적화 모델 경로
        self.quant_path = os.path.join("optimized_models", "quantized")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self):
        """모델을 지연 로딩(Lazy Loading)하여 메모리를 효율적으로 관리합니다."""
        if self.model is not None: 
            return

        if os.path.exists(self.quant_path):
            print(f"Loading Quantized Model from: {self.quant_path}")
            self.processor = TrOCRProcessor.from_pretrained(self.quant_path)
            # ORT 모델은 자체적으로 최적화된 실행 환경을 가집니다.
            self.model = ORTModelForVision2Seq.from_pretrained(self.quant_path, use_cache=False)
        else:
            print(f"Quantized model not found. Falling back to HF Hub Model: {self.settings.OCR_MODEL_NAME}")
            self.processor = TrOCRProcessor.from_pretrained(self.settings.OCR_MODEL_NAME)
            self.model = VisionEncoderDecoderModel.from_pretrained(self.settings.OCR_MODEL_NAME)
            self.model.to(self.device)

    def recognize(self, image: Image.Image) -> str:
        """
        이미지를 전달받아 텍스트를 추출합니다.
        """
        try:
            self.load_model()
            
            # 이미지 전처리 (RGB 변환 필수)
            pixel_values = self.processor(images=image.convert("RGB"), return_tensors="pt").pixel_values
            
            # 일반 PyTorch 모델인 경우에만 명시적으로 디바이스(VRAM) 할당
            if isinstance(self.model, VisionEncoderDecoderModel):
                pixel_values = pixel_values.to(self.device)
                
            # 추론
            generated_ids = self.model.generate(pixel_values)
            return self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
        except Exception as e:
            print(f"OCR Recognition Error: {e}")
            return ""

# FastAPI 서비스 등에서 의존성 주입으로 사용할 싱글톤 인스턴스
ocr_engine = TrOCREngine()
