import onnx
import os

def count_nodes(model_path):
    """모델 내의 총 노드 수를 반환"""
    try:
        model = onnx.load(model_path)
        return len(model.graph.node)
    except:
        return 0

if __name__ == "__main__":
    orig_dir = "models/onnx/converted"
    simp_dir = "models/onnx/simplified"
    
    print(f"{'Model Name':<35} | {'Original':<10} | {'Simplified':<10} | {'Reduction'}")
    print("-" * 75)

    for filename in sorted(os.listdir(orig_dir)):
        if filename.endswith(".onnx"):
            orig_path = os.path.join(orig_dir, filename)
            simp_name = filename.replace(".onnx", "_simplified.onnx")
            simp_path = os.path.join(simp_dir, simp_name)
            
            if os.path.exists(simp_path):
                orig_cnt = count_nodes(orig_path)
                simp_cnt = count_nodes(simp_path)
                reduction = orig_cnt - simp_cnt
                percent = (reduction / orig_cnt * 100) if orig_cnt > 0 else 0
                
                print(f"{filename:<35} | {orig_cnt:<10} | {simp_cnt:<10} | {reduction} ({percent:.1f}%)")
