import os
from onnxruntime.quantization import quantize_dynamic, QuantType

def quantize_onnx_model(model_path):
    output_path = model_path.replace(".onnx", "_quantized.onnx")
    
    print(f"Quantizing {model_path}...")
    
    # 동적 양자화 수행 (Float32 -> Int8)
    quantize_dynamic(
        model_input=model_path,
        model_output=output_path,
        weight_type=QuantType.QUInt8 # 가중치를 8비트 정수로 변환
    )
    
    # 용량 비교
    old_size = os.path.getsize(model_path) / (1024 * 1024)
    new_size = os.path.getsize(output_path) / (1024 * 1024)
    
    print(f"Original Size: {old_size:.2f} MB")
    print(f"Quantized Size: {new_size:.2f} MB")
    print(f"Reduction Ratio: {(1 - new_size/old_size)*100:.1f}%")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    # 다운로드받은 ONNX 검출 모델 경로
    det_model = "./models/onnx/detection/v5/det.onnx"
    if os.path.exists(det_model):
        quantize_onnx_model(det_model)
    else:
        print(f"Model not found: {det_model}")
