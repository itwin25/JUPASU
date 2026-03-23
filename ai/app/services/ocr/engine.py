# from paddleocr import PaddleOCR
from PIL import Image
import numpy as np
import os
from app.core.config import get_settings
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class OCREngine(ABC):
    @abstractmethod
    def recognize_menu(self, image: Image.Image) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def recognize_label(self, image: Image.Image) -> List[Dict[str, Any]]:
        pass

class DummyOCREngine(OCREngine):
    """OCR 기능을 비활성화한 더미 엔진"""
    def recognize_menu(self, image: Image.Image) -> List[Dict[str, Any]]:
        return []

    def recognize_label(self, image: Image.Image) -> List[Dict[str, Any]]:
        return []

# class PaddleOCREngine(OCREngine):
#     def __init__(self):
#         self._menu_ocr = None
#         self._label_ocr = None
#         # 모델 기본 경로 설정
#         self.base_model_dir = os.path.join(os.getcwd(), "models", "PP-OCRv5")
#
#     def _get_model_path(self, model_name: str) -> str:
#         return os.path.join(self.base_model_dir, model_name)
#
#     def _get_menu_ocr(self):
#         """메뉴판용: SERVER 탐지 + KOREAN 인식 모델"""
#         if self._menu_ocr is None:
#             self._menu_ocr = PaddleOCR(
#                 use_angle_cls=True,
#                 show_log=False,
#                 use_gpu=True,
#                 det_model_dir=self._get_model_path("PP-OCRV5_SERVER_DET"),
#                 rec_model_dir=self._get_model_path("KOREAN_PP-OCRV5_MOBILE_REC"), # 또는 SERVER_REC 선택 가능
#                 lang='korean'
#             )
#         return self._menu_ocr
#
#     def _get_label_ocr(self):
#         """라벨용: SERVER 탐지 + LATIN(영문) 인식 모델"""
#         if self._label_ocr is None:
#             self._label_ocr = PaddleOCR(
#                 use_angle_cls=True,
#                 show_log=False,
#                 use_gpu=True,
#                 det_model_dir=self._get_model_path("PP-OCRV5_SERVER_DET"),
#                 rec_model_dir=self._get_model_path("LATIN_PP-OCRV5_MOBILE_REC"),
#                 lang='en'
#             )
#         return self._label_ocr
#
#     def _process(self, ocr_instance, image: Image.Image) -> List[Dict[str, Any]]:
#         img_array = np.array(image)
#         result = ocr_instance.ocr(img_array, cls=True)
#         if not result or not result[0]:
#             return []
#         return [{"text": line[1][0], "score": float(line[1][1]), "box": line[0]} for line in result[0]]
#
#     def recognize_menu(self, image: Image.Image) -> List[Dict[str, Any]]:
#         return self._process(self._get_menu_ocr(), image)
#
#     def recognize_label(self, image: Image.Image) -> List[Dict[str, Any]]:
#         return self._process(self._get_label_ocr(), image)

ocr_engine = DummyOCREngine()
