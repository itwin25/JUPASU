from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.core.security import verify_internal_api_key
from app.services.chat.sommelier_agent import sommelier_agent
from app.services.ocr.refiner import ocr_refiner
from app.core.config import get_settings
from app.api.v1.schemas import (
    CustomChatRequest, 
    CustomChatResponse,
    RefineRequest,
    RefineResponse,
    SommelierTask
)
import json

router = APIRouter(dependencies=[Depends(verify_internal_api_key)])

@router.post("/chat", response_model=CustomChatResponse)
async def chat(request: CustomChatRequest):
    """[채팅] 실시간 소믈리에 상담 (Streaming 지원)"""
    initial_state = {
        "raw_input": request.message,
        "selected_wine": request.selected_wine,
        "selected_menu": request.selected_menu,
        "user_id": request.user_id,
        "mentioned_friends": request.mentioned_friends
    }

    settings = get_settings()

    if request.stream:
        async def stream_generator():
            has_sent_content = False
            
            async for event in sommelier_agent.astream_events(initial_state, version="v2"):
                kind = event.get("event")
                # print(f"DEBUG: Event Kind = {kind}, Name = {event.get('name')}")
                
                # 1. 실시간 토큰이 지원되는 경우 (gemini 등)
                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        has_sent_content = True
                        yield f"data: {json.dumps({'content': content, 'provider': settings.LLM_PROVIDER}, ensure_ascii=False)}\n\n"
                
                # 2. 실시간 토큰은 안 오지만, 특정 노드가 끝났을 때 결과가 있는 경우 (gms-sdk 등)
                elif kind == "on_chain_end" and event.get("name") == "chat":
                    output = event.get("data", {}).get("output", {})
                    # LangGraph의 최종 출력물에서 메시지 추출
                    if output and not has_sent_content:
                        # final_output이 pydantic 모델이므로 dict로 변환하거나 직접 접근
                        final_out = output.get("final_output")
                        if final_out:
                            content = final_out.main_message if hasattr(final_out, 'main_message') else str(final_out)
                            if content:
                                yield f"data: {json.dumps({'content': content, 'provider': settings.LLM_PROVIDER}, ensure_ascii=False)}\n\n"
            
            yield "data: [DONE]\n\n"
        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    try:
        result = await sommelier_agent.ainvoke(initial_state)
        final_output = result.get("final_output")
        answer = final_output.main_message if final_output else "답변 생성 실패"
        return {"answer": answer, "status": "success", "provider": settings.LLM_PROVIDER}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refine", response_model=RefineResponse)
async def refine(request: RefineRequest):
    """[정제] OCR 텍스트 구조화 데이터 변환 (Non-Streaming)"""
    try:
        is_menu = (request.task == SommelierTask.MENU_SCAN)
        result_data = await ocr_refiner.refine_wine_info(request.text_content, is_menu=is_menu)

        settings = get_settings()
        return {
            "status": "success",
            "data": result_data,
            "raw_input": request.text_content,
            "provider": settings.LLM_PROVIDER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
