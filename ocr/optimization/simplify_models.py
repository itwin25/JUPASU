import os
import onnx
from onnxsim import simplify

def simplify_onnx_model(model_path, output_path):
    print(f"Simplifying {os.path.basename(model_path)}...")
    
    try:
        # 모델 로드
        model = onnx.load(model_path)
        
        # onnx-simplifier 실행
        # dynamic_input_shape=True는 가변 입력 크기를 지원하는 모델에 유용합니다.
        model_simp, check = simplify(model)
        
        if not check:
            print(f"Warning: Simplification check failed for {model_path}")
            
        # 최적화된 모델 저장
        onnx.save(model_simp, output_path)
        
        # 용량 변화 확인
        old_size = os.path.getsize(model_path) / (1024 * 1024)
        new_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"Success! Size: {old_size:.2f}MB -> {new_size:.2f}MB (Reduction: {(1 - new_size/old_size)*100:.1f}%)")
        
    except Exception as e:
        print(f"Failed to simplify {model_path}: {e}")

if __name__ == "__main__":
    input_dir = "models/onnx/converted"
    output_dir = "models/onnx/simplified"
    os.makedirs(output_dir, exist_ok=True)

    for filename in sorted(os.listdir(input_dir)):
        if filename.endswith(".onnx"):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename.replace(".onnx", "_simplified.onnx"))
            simplify_onnx_model(input_path, output_path)
