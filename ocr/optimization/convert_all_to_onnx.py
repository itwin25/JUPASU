import os
import subprocess

def convert_to_onnx(model_dir, model_name, output_base):
    print(f"--- Processing {model_name} ---")
    
    # 입력 파일 확인
    json_file = "inference.json"
    params_file = "inference.pdiparams"
    
    if not os.path.exists(os.path.join(model_dir, json_file)) or \
       not os.path.exists(os.path.join(model_dir, params_file)):
        print(f"Skipping {model_name}: Missing json or params")
        return

    # ONNX 최종 저장 경로
    onnx_save_path = os.path.join(output_base, f"{model_name}.onnx")

    try:
        # paddle2onnx CLI 호출 (확인된 올바른 인자 사용)
        cmd = [
            "paddle2onnx",
            "--model_dir", model_dir,
            "--model_filename", json_file,
            "--params_filename", params_file,
            "--save_file", onnx_save_path,
            "--opset_version", "13",
            "--enable_onnx_checker", "True"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Successfully converted to {onnx_save_path}")
        else:
            print(f"Failed to convert to ONNX: {result.stderr}")

    except Exception as e:
        print(f"Error during processing {model_name}: {e}")

if __name__ == "__main__":
    base_dir = "models/onnx/hfonnx/models"
    output_base = "models/onnx/converted"
    os.makedirs(output_base, exist_ok=True)

    for model_name in sorted(os.listdir(base_dir)):
        model_path = os.path.join(base_dir, model_name)
        if os.path.isdir(model_path):
            convert_to_onnx(model_path, model_name, output_base)
