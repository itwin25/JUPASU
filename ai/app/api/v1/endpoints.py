import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.v1.schemas import (
    ChatActionData,
    ChatCardData,
    CustomChatRequest,
    CustomChatResponse,
    RefineRequest,
    RefineResponse,
    SommelierTask,
)
from app.core.config import get_settings
from app.core.security import verify_internal_api_key
from app.services.chat.sommelier_agent import sommelier_agent
from app.services.ocr.refiner import ocr_refiner

router = APIRouter(dependencies=[Depends(verify_internal_api_key)])


def build_recommendation_card(recommendation: dict | None) -> ChatCardData | None:
    if not recommendation:
        return None

    recommended_wine = recommendation.get("recommendedWine") or {}
    if not recommended_wine:
        return None

    country = recommended_wine.get("country")
    wine_type_label = recommended_wine.get("wineTypeLabel") or recommended_wine.get("wineType")
    subtitle_parts = [part for part in (country, wine_type_label) if part]

    return ChatCardData(
        wine_id=recommended_wine.get("wineId"),
        name_kr=recommended_wine.get("nameKr"),
        name_en=recommended_wine.get("nameEn"),
        subtitle=" ".join(subtitle_parts) if subtitle_parts else None,
        price=recommended_wine.get("price"),
        match_percent=recommendation.get("matchPercent"),
        image_url=recommended_wine.get("imageUrl"),
        detail_url=recommended_wine.get("detailUrl"),
    )


def build_recommendation_actions(recommendation: dict | None) -> list[ChatActionData]:
    if not recommendation:
        return []

    recommended_wine = recommendation.get("recommendedWine") or {}
    wine_id = recommended_wine.get("wineId")
    if not wine_id:
        return []

    return [
        ChatActionData(
            type="wishlist",
            label="위시리스트에 추가하기",
            wine_id=wine_id,
        )
    ]


@router.post("/chat", response_model=CustomChatResponse)
async def chat(request: CustomChatRequest):
    """실시간 소믈리에 상담."""
    initial_state = {
        "raw_input": request.message,
        "selected_wine": request.selected_wine,
        "selected_menu": request.selected_menu,
        "user_id": request.user_id,
        "mentioned_friends": request.mentioned_friends,
    }

    settings = get_settings()

    if request.stream:
        async def stream_generator():
            has_sent_content = False

            async for event in sommelier_agent.astream_events(initial_state, version="v2"):
                kind = event.get("event")

                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        has_sent_content = True
                        yield f"data: {json.dumps({'content': content, 'provider': settings.LLM_PROVIDER}, ensure_ascii=False)}\n\n"

                elif kind == "on_chain_end" and event.get("name") == "chat":
                    output = event.get("data", {}).get("output", {})
                    if output and not has_sent_content:
                        final_out = output.get("final_output")
                        if final_out:
                            content = final_out.main_message if hasattr(final_out, "main_message") else str(final_out)
                            if content:
                                yield f"data: {json.dumps({'content': content, 'provider': settings.LLM_PROVIDER}, ensure_ascii=False)}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    try:
        result = await sommelier_agent.ainvoke(initial_state)
        final_output = result.get("final_output")
        recommendation = result.get("food_wine_recommendation")
        answer = final_output.main_message if final_output else "답변 생성 실패"

        return {
            "answer": answer,
            "status": "success",
            "provider": settings.LLM_PROVIDER,
            "card": build_recommendation_card(recommendation),
            "actions": build_recommendation_actions(recommendation),
        }
    except Exception as exception:
        raise HTTPException(status_code=500, detail=str(exception))


@router.post("/refine", response_model=RefineResponse)
async def refine(request: RefineRequest):
    """OCR 정제 요청."""
    try:
        is_menu = request.task == SommelierTask.MENU_SCAN
        result_data = await ocr_refiner.refine_wine_info(request.text_content, is_menu=is_menu)

        settings = get_settings()
        return {
            "status": "success",
            "data": result_data,
            "raw_input": request.text_content,
            "provider": settings.LLM_PROVIDER,
        }
    except Exception as exception:
        raise HTTPException(status_code=500, detail=str(exception))
