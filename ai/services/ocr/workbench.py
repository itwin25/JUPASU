import os
import time
import torch
import json
import numpy as np
from PIL import Image
from datetime import datetime
from transformers import AutoProcessor, AutoModelForCausalLM, BitsAndBytesConfig
from optimum.onnxruntime import ORTModelForVision2Seq
from evaluate import load
# from core.config import get_settings

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
        """Florence-2-large PyTorch 모델 성능 측정"""
        print(f"\n--- [Benchmark] Evaluating {self.model_id} (Mode: {quantization or 'FP16'}) on {self.device} ---")
        
        # 모델 로딩 설정
        load_kwargs = {
            "trust_remote_code": True,
            "dtype": self.torch_dtype,
            "attn_implementation": "eager"
        }

        if quantization == "8bit":
            load_kwargs["load_in_8bit"] = True
        elif quantization == "4bit":
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=self.torch_dtype,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True
            )
            load_kwargs["quantization_config"] = bnb_config

        processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(self.model_id, **load_kwargs)
        
        if quantization is None:
            model = model.to(self.device)

        return self._execute_inference_loop(model, processor, test_dataset, quantization or "baseline")

    def run_onnx_benchmark(self, test_dataset: list[dict]):
        """Florence-2-large ONNX 모델 성능 측정 (onnx-community 버전)"""
        onnx_model_id = "onnx-community/Florence-2-large"
        print(f"\n--- [Benchmark] Evaluating {onnx_model_id} (ONNX Runtime) on {self.device} ---")
        
        # ONNX 모델 로드
        provider = "CUDAExecutionProvider" if self.device == "cuda" else "CPUExecutionProvider"
        model = ORTModelForVision2Seq.from_pretrained(onnx_model_id, provider=provider)
        
        # 프로세서는 커스텀 코드가 포함된 원본 레포지토리에서 로드 (onnx-community 레포에 코드 누락 대응)
        processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)

        return self._execute_inference_loop(model, processor, test_dataset, "onnx")

    def _execute_inference_loop(self, model, processor, test_dataset, mode_label):
        """공통 추론 루프 엔진"""
        predictions, references, latencies = [], [], []
        prompt = "<OCR>"

        for i, item in enumerate(test_dataset):
            img, label = item["image"], item["text"]
            start_time = time.time()
            
            inputs = processor(text=prompt, images=img, return_tensors="pt")
            # ONNX의 경우 입력 텐서의 dtype을 모델에 맞춰야 함
            if hasattr(model, "dtype") and model.dtype == torch.float16:
                 inputs = {k: v.to(self.device, torch.float16) if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}
            else:
                 inputs = inputs.to(self.device)
                 
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=1024,
                do_sample=False,
                num_beams=3,
                use_cache=False
            )
            
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed_answer = processor.post_process_generation(generated_text, task=prompt, image_size=(img.width, img.height))
            ocr_result = parsed_answer[prompt]
            
            latencies.append(time.time() - start_time)
            predictions.append(ocr_result)
            references.append(label)
            
            print(f"[{i+1}/{len(test_dataset)}] Pred: {ocr_result[:30]}... | Label: {label[:30]}...")

        metrics = {
            "wer": self.wer_metric.compute(predictions=predictions, references=references),
            "cer": self.cer_metric.compute(predictions=predictions, references=references),
            "latency": np.mean(latencies),
            "samples": [{"pred": p, "ref": r} for p, r in zip(predictions, references)]
        }
        
        self.save_report(metrics, mode_label)
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
            },
            "detailed_samples": metrics["samples"]
        }

        with open(os.path.join(report_dir, f"{report_name}.json"), "w") as f:
            json.dump(report_data, f, indent=4, ensure_ascii=False)

        # Markdown 생성
        md_content = f"""# Florence-2 OCR Benchmark Report ({mode_str.upper()})
- **Model:** `{self.model_id}`
- **Device:** `{self.device}`
- **Timestamp:** {timestamp}

## Overall Metrics
| Metric | Value |
| --- | --- |
| **WER** | `{metrics['wer']:.4f}` |
| **CER** | `{metrics['cer']:.4f}` |
| **Avg Latency** | `{metrics['latency']*1000:.2f} ms` |

## Detailed Comparisons (First 10 Samples)
| No | Predicted Text | Reference Label |
| --- | --- | --- |
"""
        for i, sample in enumerate(metrics["samples"][:10]):
            md_content += f"| {i+1} | {sample['pred']} | {sample['ref']} |\n"

        with open(os.path.join(report_dir, f"{report_name}.md"), "w") as f:
            f.write(md_content)
        print(f"\n[Report Saved] reports/{report_name}.md")

if __name__ == "__main__":
    # 연구 환경 설정
    TARGET_MODEL = "microsoft/Florence-2-large" 
    REFINED_META = "data/ocr/test_metadata.json"
    IMAGE_DIR = "data/ocr/images"
    
    workbench = OCRModelWorkbench(TARGET_MODEL)
    my_test_dataset = workbench.prepare_dataset(REFINED_META, IMAGE_DIR, limit=5)
    
    if my_test_dataset:
        # 1. Baseline (비양자화) 테스트
        # print("\n>>> Step 1: Running Baseline (FP16)")
        # workbench.run_benchmark(my_test_dataset, quantization=None)
        
        # 2. 8-bit 양자화 테스트
        # print("\n>>> Step 2: Running 8-bit Quantization")
        # workbench.run_benchmark(my_test_dataset, quantization="8bit")

        # 3. 4-bit 양자화 테스트
        # print("\n>>> Step 3: Running 4-bit Quantization")
        # workbench.run_benchmark(my_test_dataset, quantization="4bit")

        # 4. ONNX Runtime 테스트 (현재 활성화)
        print("\n>>> Running ONLY ONNX Runtime Benchmark")
        try:
            workbench.run_onnx_benchmark(my_test_dataset)
        except Exception as e:
            print(f"ONNX Benchmark failed: {e}")
