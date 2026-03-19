from fastapi import APIRouter, UploadFile, File, Request, Depends
from fastapi.responses import StreamingResponse
from app.core.security import verify_internal_api_key
from app.services.ocr.engine import ocr_engine
from app.services.ocr.refiner import ocr_refiner
from app.services.sommelier.sommelier_agent import sommelier_agent
from app.services.llm.proxy import sglang_proxy
from app.api.v1.schemas import ChatCompletionRequest, ChatCompletionResponse
from PIL import Image
import io
import time
import uuid

router = APIRouter(dependencies=[Depends(verify_internal_api_key)])

@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions(request: ChatCompletionRequest):
    """
    OpenAI 호환 Chat Completions 엔드포인트.
    response_format이 있으면 sglang으로 직접 프록시하고,
    그 외에는 sommelier_agent를 통해 비즈니스 로직을 수행합니다.
    """
    payload = request.model_dump(exclude_none=True)
    
    if request.response_format:
        if request.stream:
            return StreamingResponse(
                sglang_proxy.chat_completions_stream(payload),
                media_type="text/event-stream"
            )
        else:
            return await sglang_proxy.chat_completions(payload)

    user_msg = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
    
    initial_state = {
        "raw_input": user_msg,
        "raw_ocr": None,
        "user_id": request.user or "guest",
        "mentioned_friends": []
    }
    
    result = await sommelier_agent.ainvoke(initial_state)
    final_output = result.get("final_output")
    
    content = final_output.main_message if final_output else "답변을 생성하지 못했습니다."
    
    return {
        "id": f"chatcmpl-{uuid.uuid4()}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }

@router.post("/vision/ocr/menu")
async def process_menu(file: UploadFile = File(...)):
    """
    식당 메뉴판 이미지 분석 (프론트엔드 ocr.action.ts 로직 이식)
    """
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # 1. OCR 엔진 수행 (구조화된 결과 획득)
    raw_results = ocr_engine.recognize_menu(image)
    
    # 2. 결과 정제 (프론트엔드와 동일한 0.8 Score 필터링 적용)
    all_text = "\n".join([r["text"] for r in raw_results])
    filtered_text = "\n".join([r["text"] for r in raw_results if r["score"] > 0.8])
    
    # 신뢰도 높은 텍스트 우선 사용, 없으면 전체 사용
    input_text = filtered_text if filtered_text.strip() else all_text
    
    # 3. LLM을 통한 최종 정제 (Wines, Foods 리스트)
    refined_data = await ocr_refiner.refine_wine_info(input_text, is_menu=True)
    
    return {
        "success": True,
        "results": raw_results,
        "refined": refined_data,
        "imageInfo": {"width": image.width, "height": image.height},
        "type": "menu"
    }

@router.post("/vision/ocr/label")
async def process_label(file: UploadFile = File(...)):
    """
    와인 라벨 이미지 분석 (프론트엔드 ocr.action.ts 로직 이식)
    """
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # 1. OCR 엔진 수행 (구조화된 결과 획득)
    raw_results = ocr_engine.recognize_label(image)
    
    # 2. 결과 정제 (프론트엔드와 동일한 0.8 Score 필터링 적용)
    all_text = "\n".join([r["text"] for r in raw_results])
    filtered_text = "\n".join([r["text"] for r in raw_results if r["score"] > 0.8])
    
    # 신뢰도 높은 텍스트 우선 사용, 없으면 전체 사용
    input_text = filtered_text if filtered_text.strip() else all_text
    
    # 3. LLM을 통한 최종 정제 (Winery, Name, Vintage)
    refined_data = await ocr_refiner.refine_wine_info(input_text, is_menu=False)
    
    return {
        "success": True,
        "results": raw_results,
        "refined": refined_data,
        "imageInfo": {"width": image.width, "height": image.height},
        "type": "label"
    }
