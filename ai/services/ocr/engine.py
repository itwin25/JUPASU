from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
from core.config import get_settings

class TrOCREngine:
    def __init__(self):
        settings = get_settings()
        self.model_name = settings.OCR_MODEL_NAME
        self.processor = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self):
        """모델을 지연 로딩(Lazy Loading)하여 VRAM을 관리합니다."""
        if self.model is None:
            print(f"Loading TrOCR model: {self.model_name} on {self.device}...")
            self.processor = TrOCRProcessor.from_pretrained(self.model_name)
            self.model = VisionEncoderDecoderModel.from_pretrained(self.model_name)
            self.model.to(self.device)

    def recognize(self, image: Image.Image) -> str:
        self.load_model()
        pixel_values = self.processor(images=image, return_tensors="pt").pixel_values.to(self.device)
        generated_ids = self.model.generate(pixel_values)
        generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        return generated_text

# 싱글톤 인스턴스
ocr_engine = TrOCREngine()
