import asyncio
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

    recommendation = result.get("food_wine_recommendation")
    card = build_recommendation_card(recommendation)
    
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
    SSE 스트리밍을 지원하는 채팅 엔드포인트
    """
    settings = get_settings()

    async def stream_generator() -> AsyncGenerator[str, None]:
        # [정상화] 인위적인 지연 및 공백 삽입 제거. 오직 연결 확인용 메시지만 전송.
        yield f"data: {json.dumps({'content': '', 'status': 'connected'}, ensure_ascii=False)}\n\n"

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

        captured_recommendation = None
        captured_final_output = None
        captured_wine_cards = None

        try:
            async for event in sommelier_agent.astream_events(
                initial_state, version="v2", config={"configurable": {"thread_id": chat_request.session_id}}
            ):
                kind = event.get("event")
                name = event.get("name")
                
                # [강력 로깅] 모든 이벤트의 정보를 표준 출력으로 강제 출력
                print(f"📡 [EVENT_TRACE] kind: {kind}, name: {name}")

                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content is not None:
                        yield f"data: {json.dumps({'content': content, 'provider': settings.LLM_PROVIDER}, ensure_ascii=False)}\n\n"

                elif kind == "on_chain_end":
                    output = event.get("data", {}).get("output", {})
                    print(f"🔍 [CHAIN_END_TRACE] name: {name}, has_output: {output is not None}")
                    
                    if name == "prepare_input_context":
                        captured_recommendation = output.get("food_wine_recommendation")
                    elif name == "chat":
                        # 딕셔너리 또는 모델일 수 있으므로 유연하게 처리
                        captured_final_output = output.get("final_output")
                        captured_wine_cards = output.get("wine_cards")
                        print(f"📍 [CAPTURE_TRACE] has_final: {captured_final_output is not None}")

            # 최종 메타데이터 전송 직전 상태 확인
            print(f"🏁 [FINAL_TRACE] captured_final_output type: {type(captured_final_output)}")
            
            final_card = build_recommendation_card(captured_recommendation)
            
            # captured_final_output에서 recommendations 추출 (객체/딕셔너리 양쪽 대응)
            recs = None
            if captured_final_output:
                if hasattr(captured_final_output, "recommendations"):
                    recs = captured_final_output.recommendations
                elif isinstance(captured_final_output, dict):
                    recs = captured_final_output.get("recommendations")
            
            print(f"🏁 [FINAL_TRACE] recommendations count: {len(recs) if recs else 0}")

            if not final_card and recs and len(recs) > 0:
                first_rec = recs[0]
                # 리스트 아이템이 객체인지 딕셔너리인지 확인
                if hasattr(first_rec, "wine_id"):
                    final_card = ChatCardData(
                        wine_id=first_rec.wine_id,
                        name_kr=first_rec.name_kr,
                        name_en=first_rec.name_en,
                        subtitle=first_rec.subtitle,
                        price=first_rec.price,
                        match_percent=first_rec.match_percent,
                        image_url=first_rec.image_url,
                        detail_url=first_rec.detail_url,
                    )
                elif isinstance(first_rec, dict):
                    final_card = ChatCardData(
                        wine_id=first_rec.get("wine_id"),
                        name_kr=first_rec.get("name_kr"),
                        name_en=first_rec.get("name_en"),
                        subtitle=first_rec.get("subtitle"),
                        price=first_rec.get("price"),
                        match_percent=first_rec.get("match_percent"),
                        image_url=first_rec.get("image_url"),
                        detail_url=first_rec.get("detail_url"),
                    )

            final_actions = []
            if final_card:
                actions = build_recommendation_actions(final_card.wine_id)
                final_actions = [a.model_dump() for a in actions]

            final_cards = captured_wine_cards if captured_wine_cards else []

            # 카드 정보가 있다면 최종 전송
            if final_card or final_cards or final_actions:
                payload = {
                    "card": final_card.model_dump() if final_card else None,
                    "cards": final_cards,
                    "actions": final_actions,
                }
                print(f"📤 [YIELD_TRACE] Sending Metadata: {json.dumps(payload, ensure_ascii=False)[:100]}...")
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
            else:
                print("⚠️ [FINAL_TRACE] No metadata to send (final_card is None)")

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

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
