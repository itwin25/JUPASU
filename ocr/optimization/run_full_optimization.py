import os
import subprocess
import onnx
from onnxsim import simplify
from onnx import helper, shape_inference

def process_model(model_dir, model_name, output_dir):
    print(f"\n>>> Processing: {model_name}")
    onnx_path = os.path.join(output_dir, f"{model_name}_raw.onnx")
    no_ceil_path = os.path.join(output_dir, f"{model_name}_no_ceil.onnx")
    final_path = os.path.join(output_dir, f"{model_name}_optimized.onnx")

    # 1. Paddle to ONNX
    print(f"[1/3] Converting Paddle to ONNX...")
    # .json 파일이 있는 경우와 .pdmodel이 있는 경우 모두 대응
    json_file = "inference.json"
    params_file = "inference.pdiparams"
    
    if not os.path.exists(os.path.join(model_dir, json_file)):
        print(f"Skipping {model_name}: No inference.json found")
        return

    cmd = [
        "paddle2onnx",
        "--model_dir", model_dir,
        "--model_filename", json_file,
        "--params_filename", params_file,
        "--save_file", onnx_path,
        "--opset_version", "13"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Failed to convert {model_name}: {result.stderr}")
        return

    # 2. Remove Ceil
    print(f"[2/3] Checking and removing Ceil nodes...")
    model = onnx.load(onnx_path)
    new_nodes = []
    replaced = 0
    for node in model.graph.node:
        if node.op_type == 'Ceil':
            c_name = node.output[0] + "_const"
            a_name = node.output[0] + "_add"
            new_nodes.append(helper.make_node('Constant', inputs=[], outputs=[c_name],
                value=helper.make_tensor(name='v', data_type=onnx.TensorProto.FLOAT, dims=[], vals=[0.999999])))
            new_nodes.append(helper.make_node('Add', inputs=[node.input[0], c_name], outputs=[a_name]))
            new_nodes.append(helper.make_node('Floor', inputs=[a_name], outputs=[node.output[0]]))
            replaced += 1
        else:
            new_nodes.append(node)
    
    if replaced > 0:
        print(f"Replaced {replaced} Ceil nodes.")
        model.graph.ClearField("node")
        model.graph.node.extend(new_nodes)
        onnx.save(model, no_ceil_path)
    else:
        no_ceil_path = onnx_path # Ceil 없으면 원본 그대로 사용

    # 3. ONNX Simplify
    print(f"[3/3] Compressing nodes (Simplify)...")
    try:
        model_loaded = onnx.load(no_ceil_path)
        model_simp, check = simplify(model_loaded)
        onnx.save(model_simp, final_path)
        print(f"Success! Final model: {final_path}")
        # 중간 파일 삭제
        if os.path.exists(onnx_path): os.remove(onnx_path)
        if os.path.exists(no_ceil_path) and no_ceil_path != onnx_path: os.remove(no_ceil_path)
    except Exception as e:
        print(f"Simplification failed: {e}")

if __name__ == "__main__":
    # 1. 아까 지정한 hfonnx 디렉토리의 모든 서브디렉토리
    hfonnx_base = "models/onnx/hfonnx/models"
    
    # 2. 추가적인 PP-OCRv5 모델 디렉토리들
    other_dirs = [
        "models/PP-OCRv5/mobile_det",
        "models/PP-OCRv5/mobile_rec",
        "models/PP-OCRv5/server_det",
        "models/PP-OCRv5/server_rec"
    ]
    
    output_base = "models/optimized_final"
    os.makedirs(output_base, exist_ok=True)

    # hfonnx 모델들 처리
    if os.path.exists(hfonnx_base):
        for m in os.listdir(hfonnx_base):
            path = os.path.join(hfonnx_base, m)
            if os.path.isdir(path):
                process_model(path, f"hfonnx_{m}", output_base)

    # 기타 모델들 처리
    for d in other_dirs:
        if os.path.exists(d):
            name = d.replace("/", "_").replace("models_", "")
            process_model(d, name, output_base)
