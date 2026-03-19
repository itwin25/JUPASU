from fastapi import APIRouter, UploadFile, File, Request, Depends, HTTPException, Form
from fastapi.responses import StreamingResponse
from app.core.security import verify_internal_api_key
from app.core.logging import log_performance_meta
from app.services.ocr.engine import ocr_engine
from app.services.ocr.refiner import ocr_refiner
from app.services.sommelier.sommelier_agent import sommelier_agent
from app.services.llm.proxy import sglang_proxy
from app.api.v1.schemas import (
    ChatCompletionRequest, 
    ChatCompletionResponse, 
    CustomChatRequest, 
    CustomChatResponse
)
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

from app.api.v1.schemas import (
    SommelierRequest, 
    SommelierTask, 
    CustomChatResponse,
    ChatCompletionRequest,
    ChatCompletionResponse
)

@router.post("/sommelier/process")
async def process_sommelier_task(
    request: SommelierRequest = Depends(),
    file: Optional[UploadFile] = File(None)
):
    """
    통합 스마트 엔드포인트 (Logging + Logic 통합)
    """
    start_time = time.time()
    raw_ocr_text = request.text_content
    
    # [1] 서버 사이드 OCR 수행
    if not raw_ocr_text and file:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        results = ocr_engine.recognize_label(image) if request.task == SommelierTask.LABEL_SCAN else ocr_engine.recognize_menu(image)
        raw_ocr_text = "\n".join([r["text"] for r in results if r["score"] > 0.8]) or "\n".join([r["text"] for r in results])

    initial_state = {
        "raw_input": raw_ocr_text if request.task != SommelierTask.CHAT else request.text_content,
        "raw_ocr": raw_ocr_text,
        "user_id": request.user_id,
        "mentioned_friends": request.mentioned_friends,
        "task": request.task
    }

    # [2] 스트리밍 응답 (CHAT용)
    if request.stream:
        async def smart_stream():
            async for chunk, _ in sommelier_agent.astream(initial_state, stream_mode="messages"):
                if chunk and hasattr(chunk, "content"):
                    # Spring이 파싱하기 쉽게 깔끔한 JSON만 전송
                    yield f"data: {json.dumps({'content': chunk.content}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(smart_stream(), media_type="text/event-stream")

    # [3] 일반 응답 (SCAN용) + 로깅
    try:
        result = await sommelier_agent.ainvoke(initial_state)
        duration = time.time() - start_time
        final_output = result.get("final_output")
        answer = final_output.main_message if final_output else "결과 생성 실패"
        
        # 성능 로그 기록 (매우 중요!)
        log_performance_meta(
            prompt=str(initial_state["raw_input"])[:50],
            response_content=answer,
            duration=duration,
            status="success",
            session_id=request.session_id
        )
        
        return {"answer": answer, "status": "success", "raw_ocr": raw_ocr_text}
    except Exception as e:
        log_performance_meta(prompt=request.task, duration=time.time()-start_time, status="error", error_msg=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vision/ocr/label")
async def process_label(
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """[독립/스마트] 와인 라벨 분석 (이미지 또는 텍스트 입력)"""
    raw_text = text_content
    
    # 1. 텍스트가 없고 파일만 있는 경우 서버 OCR 수행
    if not raw_text and file:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        results = ocr_engine.recognize_label(image)
        raw_text = "\n".join([r["text"] for r in results if r["score"] > 0.8]) or "\n".join([r["text"] for r in results])
    
    if not raw_text:
        raise HTTPException(status_code=400, detail="이미지 파일 또는 텍스트 내용이 필요합니다.")

    # 2. LLM 정제 (공통)
    refined_data = await ocr_refiner.refine_wine_info(raw_text, is_menu=False)
    
    return {"success": True, "data": refined_data, "raw_text": raw_text}

@router.post("/vision/ocr/menu")
async def process_menu(
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """[독립/스마트] 메뉴판 분석 (이미지 또는 텍스트 입력)"""
    raw_text = text_content
    
    # 1. 텍스트가 없고 파일만 있는 경우 서버 OCR 수행
    if not raw_text and file:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        results = ocr_engine.recognize_menu(image)
        raw_text = "\n".join([r["text"] for r in results if r["score"] > 0.8]) or "\n".join([r["text"] for r in results])

    if not raw_text:
        raise HTTPException(status_code=400, detail="이미지 파일 또는 텍스트 내용이 필요합니다.")

    # 2. LLM 정제 (공통)
    refined_data = await ocr_refiner.refine_wine_info(raw_text, is_menu=True)
    
    return {"success": True, "data": refined_data, "raw_text": raw_text}

@router.post("/chat")
async def sommelier_chat(request: CustomChatRequest):
    """
    고도화된 소믈리에 채팅 (사용자 확정 데이터 포함 가능)
    """
    start_time = time.time()
    
    initial_state = {
        "raw_input": request.message,
        "selected_wine": request.selected_wine,
        "selected_menu": request.selected_menu, # 메뉴판 확정 데이터 추가
        "user_id": request.user_id,
        "mentioned_friends": request.mentioned_friends,
        "task": "CHAT"
    }

    if request.stream:
        async def smart_stream():
            async for chunk, _ in sommelier_agent.astream(initial_state, stream_mode="messages"):
                if chunk and hasattr(chunk, "content"):
                    yield f"data: {json.dumps({'content': chunk.content}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(smart_stream(), media_type="text/event-stream")

    try:
        result = await sommelier_agent.ainvoke(initial_state)
        duration = time.time() - start_time
        final_output = result.get("final_output")
        answer = final_output.main_message if final_output else "결과 생성 실패"
        
        log_performance_meta(
            prompt=request.message[:50],
            response_content=answer,
            duration=duration,
            status="success",
            session_id=request.session_id
        )
        return {"answer": answer, "status": "success"}
    except Exception as e:
        log_performance_meta(prompt="CHAT", duration=time.time()-start_time, status="error", error_msg=str(e))
        raise HTTPException(status_code=500, detail=str(e))
