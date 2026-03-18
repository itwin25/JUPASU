import onnx
import os
from onnx import helper, shape_inference

def replace_ceil_with_floor_add(model_path, output_path):
    """
    ONNX 모델에서 Ceil(x)를 Floor(x + 0.999999) 형태로 대체
    """
    if not os.path.exists(model_path):
        print(f"File not found: {model_path}")
        return

    model = onnx.load(model_path)
    graph = model.graph
    
    new_nodes = []
    replaced_count = 0
    
    for node in graph.node:
        if node.op_type == 'Ceil':
            ceil_input = node.input[0]
            ceil_output = node.output[0]
            
            add_output = ceil_output + "_pre_floor"
            const_name = ceil_output + "_const"
            
            # Constant (0.999999)
            const_node = helper.make_node(
                'Constant',
                inputs=[],
                outputs=[const_name],
                value=helper.make_tensor(
                    name=const_name + "_val",
                    data_type=onnx.TensorProto.FLOAT,
                    dims=[],
                    vals=[0.999999]
                )
            )
            
            # Add: x + 0.999999
            add_node = helper.make_node(
                'Add',
                inputs=[ceil_input, const_name],
                outputs=[add_output],
                name=node.name + "_add" if node.name else None
            )
            
            # Floor: Floor(x + 0.999999)
            floor_node = helper.make_node(
                'Floor',
                inputs=[add_output],
                outputs=[ceil_output],
                name=node.name + "_floor" if node.name else None
            )
            
            new_nodes.extend([const_node, add_node, floor_node])
            replaced_count += 1
        else:
            new_nodes.append(node)

    if replaced_count == 0:
        print(f"No Ceil nodes found in {os.path.basename(model_path)}. Skipping save.")
        return

    new_graph = helper.make_graph(
        nodes=new_nodes,
        name=graph.name,
        inputs=graph.input,
        outputs=graph.output,
        initializer=graph.initializer,
        value_info=graph.value_info
    )
    
    new_model = helper.make_model(new_graph, producer_name='onnx-ceil-remover')
    new_model.opset_import[0].version = model.opset_import[0].version
    new_model = shape_inference.infer_shapes(new_model)
    
    onnx.save(new_model, output_path)
    print(f"Optimized {os.path.basename(model_path)}: Replaced {replaced_count} nodes. Saved to {output_path}")

if __name__ == "__main__":
    input_dir = "models/onnx/converted"
    output_dir = "models/onnx/no_ceil"
    os.makedirs(output_dir, exist_ok=True)

    for filename in os.listdir(input_dir):
        if filename.endswith(".onnx"):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename.replace(".onnx", "_no_ceil.onnx"))
            replace_ceil_with_floor_add(input_path, output_path)
