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
    TasteReportSummaryRequest,
    TasteReportSummaryResponse,
)
from app.core.config import get_settings
from app.core.security import verify_internal_api_key
from app.services.chat.sommelier_agent import sommelier_agent
from app.services.ocr.refiner import ocr_refiner
from app.services.taste.taste_report_service import generate_taste_report_summary

router = APIRouter(dependencies=[Depends(verify_internal_api_key)])

COUNTRY_LABELS = {
    "France": "\ud504\ub791\uc2a4",
    "Italy": "\uc774\ud0c8\ub9ac\uc544",
    "Spain": "\uc2a4\ud398\uc778",
    "United States": "\ubbf8\uad6d",
    "USA": "\ubbf8\uad6d",
    "Australia": "\ud638\uc8fc",
    "New Zealand": "\ub274\uc9c8\ub79c\ub4dc",
    "Germany": "\ub3c5\uc77c",
    "Romania": "\ub8e8\ub9c8\ub2c8\uc544",
    "Argentina": "\uc544\ub974\ud5e8\ud2f0\ub098",
    "Chile": "\uce60\ub808",
    "Portugal": "\ud3ec\ub974\ud22c\uac08",
}


def localize_country(country: str | None) -> str | None:
    if not country:
        return None
    return COUNTRY_LABELS.get(country, country)


def build_recommendation_card(recommendation: dict | None) -> ChatCardData | None:
    if not recommendation:
        return None

    recommended_wine = recommendation.get("recommendedWine") or {}
    if not recommended_wine:
        return None

    country = localize_country(recommended_wine.get("country"))
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
            label="\uc704\uc2dc\ub9ac\uc2a4\ud2b8\uc5d0 \ucd94\uac00\ud558\uae30",
            wine_id=wine_id,
        )
    ]


@router.post("/chat", response_model=CustomChatResponse)
async def chat(request: CustomChatRequest):
    initial_state = {
        "raw_input": request.message,
        "selected_wine": request.selected_wine,
        "selected_menu": request.selected_menu,
        "user_id": request.user_id,
        "mentioned_friends": request.mentioned_friends,
        "history": request.history, # 추가: 과거 대화 이력 전달
    }

    settings = get_settings()

    if request.stream:
        async def stream_generator():
            # [ULTIMATE HOTFIX] GMS 프록시의 버퍼링 및 초기 바이트 유실 문제를 해결하기 위해
            # 약 2KB 크기의 벌크 더미 데이터를 먼저 전송하여 프록시 버퍼를 강제로 밀어냅니다.
            dummy_padding = " " * 2048
            yield f"data: {json.dumps({'content': '', 'status': 'ping', 'padding': dummy_padding, 'provider': settings.LLM_PROVIDER})}\n\n"
            
            has_sent_content = False

            # v2 대신 v1을 사용하여 더 원시적인 이벤트를 캡처합니다. (짤림 방지)
            async for event in sommelier_agent.astream_events(initial_state, version="v1"):
                kind = event.get("event")

                # v1에서는 on_chat_model_stream의 데이터 구조가 약간 다를 수 있으나 
                # LangChain 추상화 레이어에서 대부분 호환됩니다.
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    content = chunk.content if hasattr(chunk, "content") else str(chunk)
                    if content is not None:
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
        answer = final_output.main_message if final_output else "\ub2f5\ubcc0 \uc0dd\uc131\uc5d0 \uc2e4\ud328\ud588\uc5b4\uc694."

        return {
            "answer": answer,
            "status": "success",
            "provider": settings.LLM_PROVIDER,
            "card": build_recommendation_card(recommendation),
            "actions": build_recommendation_actions(recommendation),
        }
    except Exception as exception:
        raise HTTPException(status_code=500, detail=str(exception))


@router.post("/taste-report/summary", response_model=TasteReportSummaryResponse)
async def taste_report_summary(request: TasteReportSummaryRequest):
    """사용자의 맛 프로파일을 받아 AI 취향 요약 텍스트를 생성합니다.
    TasteReport가 outdated 상태일 때만 Java 백엔드에서 호출합니다."""
    try:
        result = await generate_taste_report_summary(
            nickname=request.nickname,
            avg_sweetness=request.avg_sweetness,
            avg_acidity=request.avg_acidity,
            avg_body=request.avg_body,
            avg_tannin=request.avg_tannin,
            avg_alcohol=request.avg_alcohol,
        )
        return TasteReportSummaryResponse(
            main_title=result["mainTitle"],
            taste_type_tag=result["tasteTypeTag"],
            content=result["content"],
            best_description=result["bestDescription"],
            worst_description=result["worstDescription"],
        )
    except Exception as exception:
        raise HTTPException(status_code=500, detail=str(exception))


@router.post("/refine", response_model=RefineResponse)
async def refine(request: RefineRequest):
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
