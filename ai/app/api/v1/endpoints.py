import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
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
logger = logging.getLogger(__name__)

# --- 국가명 한글화 매핑 ---
COUNTRY_LABELS = {
    "France": "프랑스",
    "Italy": "이탈리아",
    "Spain": "스페인",
    "United States": "미국",
    "USA": "미국",
    "Australia": "호주",
    "New Zealand": "뉴질랜드",
    "Germany": "독일",
    "Romania": "루마니아",
    "Argentina": "아르헨티나",
    "Chile": "칠레",
    "Portugal": "포르투갈",
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
        detail_url=f"/wines/{recommended_wine.get('wineId')}" if recommended_wine.get("wineId") else None,
    )


def build_recommendation_actions(wine_id: int | None) -> list[ChatActionData]:
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
async def chat_endpoint(request: CustomChatRequest):
    """
    고도화된 채팅 에이전트 엔드포인트 (단발성 응답)
    """
    initial_state = {
        "raw_input": request.message,
        "user_id": str(request.user_id),
        "user_nickname": getattr(request, "user_nickname", "손님"),
        "mentioned_friends": request.mentioned_friends,
        "selected_wine": request.selected_wine,
        "selected_menu": request.selected_menu,
        "history": request.history,
        "messages": [],
    }

    settings = get_settings()
    result = await sommelier_agent.ainvoke(initial_state)
    final_output = result.get("final_output")

    if not final_output:
        return CustomChatResponse(answer="죄송합니다. 응답을 생성하지 못했습니다.")

    # 1. 정밀 추천 결과 우선 처리
    recommendation = result.get("food_wine_recommendation")
    card = build_recommendation_card(recommendation)
    
    # 2. 에이전트 생성 결과 처리
    if not card and final_output.recommendations:
        first = final_output.recommendations[0]
        card = ChatCardData(
            wine_id=first.wine_id,
            name_kr=first.name_kr,
            name_en=first.name_en,
            subtitle=first.subtitle,
            price=first.price,
            match_percent=first.match_percent,
            image_url=first.image_url,
            detail_url=first.detail_url,
        )

    actions = build_recommendation_actions(card.wine_id if card else None)

    return CustomChatResponse(
        answer=final_output.main_message,
        card=card,
        actions=actions,
        provider=settings.LLM_PROVIDER,
    )


@router.post("/chat/stream")
async def chat_stream_endpoint(request: Request, chat_request: CustomChatRequest):
    """
    SSE 스트리밍을 지원하는 채팅 엔드포인트 (노드별 데이터 수집 강화 및 청크 유실 방지)
    """
    settings = get_settings()

    async def stream_generator() -> AsyncGenerator[str, None]:
        import asyncio

        # [ULTIMATE HOTFIX] GMS 프록시 및 백엔드 WebFlux 버퍼링 문제 해결을 위한 패딩
        dummy_padding = " " * 4096
        yield f"data: {json.dumps({'content': '', 'status': 'ping', 'padding': dummy_padding, 'provider': settings.LLM_PROVIDER})}\n\n"
        
        # 첫 번째 방어막 (보이지 않는 공백)
        yield f"data: {json.dumps({'content': ' ', 'provider': settings.LLM_PROVIDER})}\n\n"
        
        # [핵심 보정] 백엔드 WebClient가 방어막 프레임과 진짜 첫 토큰 프레임을 병합하여 파싱하지 않도록 0.5초 대기
        await asyncio.sleep(0.5)

        initial_state = {
            "raw_input": chat_request.message,
            "user_id": str(chat_request.user_id),
            "user_nickname": getattr(chat_request, "user_nickname", "손님"),
            "mentioned_friends": chat_request.mentioned_friends,
            "selected_wine": chat_request.selected_wine,
            "selected_menu": chat_request.selected_menu,
            "history": chat_request.history,
            "messages": [],
        }

        full_answer = ""
        captured_recommendation = None
        captured_final_output = None
        captured_wine_cards = None
        has_sent_content = False

        # [수정] 이벤트 누락 버그가 없는 최신 v2 버전으로 롤백 및 업그레이드
        async for event in sommelier_agent.astream_events(
            initial_state, version="v2", config={"configurable": {"thread_id": chat_request.session_id}}
        ):
            kind = event.get("event")
            name = event.get("name")

            # 1. 텍스트 토큰 스트리밍
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                if content:
                    full_answer += content
                    has_sent_content = True
                    yield f"data: {json.dumps({'content': content, 'provider': settings.LLM_PROVIDER}, ensure_ascii=False)}\n\n"

            # 2. 노드별 데이터 캡처
            elif kind == "on_chain_end":
                output = event.get("data", {}).get("output", {})
                if name == "prepare_input_context":
                    captured_recommendation = output.get("food_wine_recommendation")
                elif name == "chat":
                    captured_final_output = output.get("final_output")
                    captured_wine_cards = output.get("wine_cards")

        # 3. 스트리밍 종료 후 수집된 모든 메타데이터 조합 전송
        card = build_recommendation_card(captured_recommendation)
        
        if not card and captured_final_output and captured_final_output.recommendations:
            first_rec = captured_final_output.recommendations[0]
            card = ChatCardData(
                wine_id=first_rec.wine_id,
                name_kr=first_rec.name_kr,
                name_en=first_rec.name_en,
                subtitle=first_rec.subtitle,
                price=first_rec.price,
                match_percent=first_rec.match_percent,
                image_url=first_rec.image_url,
                detail_url=first_rec.detail_url,
            )

        actions = build_recommendation_actions(card.wine_id if card else None)
        
        cards_data = []
        if captured_wine_cards:
            for w in captured_wine_cards:
                cards_data.append({
                    "wine_id": w.get("wine_id"),
                    "name_kr": w.get("name_kr"),
                    "name_en": w.get("name_en"),
                    "subtitle": w.get("subtitle"),
                    "price": w.get("price"),
                    "match_percent": w.get("match_percent"),
                    "image_url": w.get("image_url"),
                    "detail_url": f"/wines/{w.get('wine_id')}" if w.get('wine_id') else None
                })

        if card or cards_data or actions:
            payload = {
                "card": card.model_dump() if card else None,
                "cards": cards_data,
                "actions": [a.model_dump() for a in actions],
            }
            yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


@router.post("/refine", response_model=RefineResponse)
async def refine_endpoint(request: RefineRequest):
    try:
        is_menu = request.task == SommelierTask.MENU_SCAN
        refined_data = await ocr_refiner.refine_wine_info(request.text_content, is_menu=is_menu)
        settings = get_settings()
        return RefineResponse(
            status="success", data=refined_data, raw_input=request.text_content, provider=settings.LLM_PROVIDER
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/taste-report/summary", response_model=TasteReportSummaryResponse)
async def taste_report_summary_endpoint(request: TasteReportSummaryRequest):
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
