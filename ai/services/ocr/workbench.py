import os
import time
import torch
import json
import numpy as np
from PIL import Image
from datetime import datetime
from transformers import AutoProcessor, AutoModelForCausalLM, BitsAndBytesConfig
from evaluate import load
from core.config import get_settings

class OCRModelWorkbench:
    """
    최신 Florence-2-large 모델을 위한 경량화 및 검증 워크벤치입니다.
    attn_implementation="eager" 설정을 통해 라이브러리 호환성 이슈를 해결했습니다.
    """
    def __init__(self, model_id: str = "microsoft/Florence-2-large"):
        self.model_id = model_id
        self.output_dir = "optimized_models"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # GPU 사용 시 FP16, CPU 사용 시 FP32 권장
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        try:
            self.wer_metric = load("wer")
            self.cer_metric = load("cer")
        except Exception as e:
            print(f"Metrics load failed: {e}")
        
        os.makedirs(self.output_dir, exist_ok=True)

    def prepare_dataset(self, metadata_path: str, image_dir: str, limit: int = 10):
        """정제된 메타데이터와 이미지를 로드합니다."""
        if not os.path.exists(metadata_path):
            print(f"Metadata not found at {metadata_path}.")
            return []

        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        test_dataset = []
        sample_filenames = list(metadata.keys())[:limit]
        
        for fname in sample_filenames:
            wine_name = metadata[fname]
            img_path = os.path.join(image_dir, fname)
            try:
                img = Image.open(img_path).convert("RGB") if os.path.exists(img_path) else Image.new("RGB", (384, 384), color=(255, 255, 255))
                test_dataset.append({"image": img, "text": wine_name})
            except Exception as e:
                print(f"Failed to load {fname}: {e}")

        return test_dataset

    def run_benchmark(self, test_dataset: list[dict], quantization: str = None):
        """
        Florence-2-large 모델의 성능을 측정합니다.
        quantization: None, '8bit', '4bit' 선택 가능
        """
        print(f"--- [Benchmark] Evaluating {self.model_id} (Mode: {quantization or 'FP16'}) on {self.device} ---")
        
        # 모델 로딩 설정
        load_kwargs = {
            "trust_remote_code": True,
            "torch_dtype": self.torch_dtype,
            "attn_implementation": "eager" # [FIX] _supports_sdpa AttributeError 방지
        }

        # 양자화 설정 (BitsAndBytes 활용)
        if quantization == "8bit":
            load_kwargs["load_in_8bit"] = True
        elif quantization == "4bit":
            # 4bit 양자화 (NF4) 설정
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=self.torch_dtype,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True
            )
            load_kwargs["quantization_config"] = bnb_config

        # 모델 및 프로세서 로드
        processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(self.model_id, **load_kwargs)
        
        # 양자화 모델이 아닌 경우에만 명시적으로 디바이스 할당
        if quantization is None:
            model = model.to(self.device)

        predictions, references, latencies = [], [], []
        prompt = "<OCR>"

        for item in test_dataset:
            img, label = item["image"], item["text"]
            
            start_time = time.time()
            
            # 추론 프로세스
            inputs = processor(text=prompt, images=img, return_tensors="pt").to(self.device, self.torch_dtype)
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                do_sample=False,
                num_beams=3
            )
            
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed_answer = processor.post_process_generation(generated_text, task=prompt, image_size=(img.width, img.height))
            ocr_result = parsed_answer[prompt]
            
            latencies.append(time.time() - start_time)
            predictions.append(ocr_result)
            references.append(label)

        # 분석 및 리포트 저장
        metrics = {
            "wer": self.wer_metric.compute(predictions=predictions, references=references),
            "cer": self.cer_metric.compute(predictions=predictions, references=references),
            "latency": np.mean(latencies)
        }
        
        self.save_report(metrics, quantization)
        return metrics

    def save_report(self, metrics: dict, quantization: str):
        """결과를 Markdown/JSON으로 기록합니다."""
        report_dir = "reports"
        os.makedirs(report_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        mode_str = quantization or "baseline"
        report_name = f"florence2_report_{mode_str}_{timestamp}"
        
        report_data = {
            "metadata": {"timestamp": timestamp, "model_id": self.model_id, "mode": mode_str, "device": self.device},
            "metrics": {
                "wer": round(metrics["wer"], 4),
                "cer": round(metrics["cer"], 4),
                "latency_ms": round(metrics["latency"] * 1000, 2)
            }
        }

        with open(os.path.join(report_dir, f"{report_name}.json"), "w") as f:
            json.dump(report_data, f, indent=4)

        md_content = f"""# Florence-2 OCR Benchmark Report ({mode_str.upper()})
- **Model:** `{self.model_id}`
- **Device:** `{self.device}`
- **Timestamp:** {timestamp}

## Results
| Metric | Value |
| --- | --- |
| **WER** | `{metrics['wer']:.4f}` |
| **CER** | `{metrics['cer']:.4f}` |
| **Avg Latency** | `{metrics['latency']*1000:.2f} ms` |
"""
        with open(os.path.join(report_dir, f"{report_name}.md"), "w") as f:
            f.write(md_content)
        print(f"\n[Report Saved] reports/{report_name}.md")

if __name__ == "__main__":
    # 연구 환경 설정
    TARGET_MODEL = "microsoft/Florence-2-large" 
    REFINED_META = "data/ocr/test_metadata.json"
    IMAGE_DIR = "data/ocr/images"
    
    workbench = OCRModelWorkbench(TARGET_MODEL)
    my_test_dataset = workbench.prepare_dataset(REFINED_META, IMAGE_DIR, limit=10)
    
    if my_test_dataset:
        # 1. 먼저 4-bit 양자화 버전으로 벤치마크를 진행해 봅니다. (속도/용량 최적화 확인)
        workbench.run_benchmark(my_test_dataset, quantization="4bit")
        
        # 2. 필요 시 원본(Baseline)과 비교하고 싶다면 아래 주석을 해제하세요.
        # workbench.run_benchmark(my_test_dataset, quantization=None)
