import logging
import re
from typing import List, TypedDict, Optional, Any
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

from langchain_core.prompts import ChatPromptTemplate

from app.services.chat.food_wine_recommendation_client import (
    build_food_recommendation_summary,
    request_food_wine_recommendation,
    should_request_food_recommendation,
)
from app.services.chat.input_context_builder import build_chat_input_context
from app.services.llm.factory import get_llm
from app.services.rag.chat_retrieval_service import perform_hybrid_recommendation

logger = logging.getLogger(__name__)


class WineRecommendation(BaseModel):
    wine_id: int
    name: str
    image_url: str
    match_score: int
    reason: str


class FinalSommelierResponse(BaseModel):
    main_message: str
    recommendations: Optional[List[WineRecommendation]] = Field(default=None)
    suggested_next_steps: List[str] = Field(default=[])


class AgentState(TypedDict):
    raw_input: str
    user_id: str
    mentioned_friends: Optional[List[dict]]
    selected_wine: Optional[dict]
    selected_menu: Optional[dict]
    input_context: Optional[dict]
    food_wine_recommendation: Optional[dict]
    final_output: Optional[FinalSommelierResponse]


FOOD_REQUEST_SUFFIXES = (
    "\uc640 \uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778 \ucd94\ucc9c\ud574\uc918",
    "\ub791 \uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778 \ucd94\ucc9c\ud574\uc918",
    "\uc640 \uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778 \ucd94\ucc9c",
    "\ub791 \uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778 \ucd94\ucc9c",
    "\uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778 \ucd94\ucc9c\ud574\uc918",
    "\uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778 \ucd94\ucc9c",
    "\uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778",
    "\ucd94\ucc9c\ud574\uc918",
    "\ucd94\ucc9c",
)


def normalize_food_label(food_text: str | None) -> str:
    if not food_text:
        return "\uc774 \uc74c\uc2dd"

    normalized = re.sub(r"\s+", " ", food_text).strip()

    for suffix in FOOD_REQUEST_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
            break

    for particle in ("\uc774\ub791", "\ub791", "\uacfc", "\uc640"):
        if normalized.endswith(particle):
            normalized = normalized[: -len(particle)].strip()
            break

    normalized = re.sub(r"[?.!,]+$", "", normalized).strip()
    return normalized or "\uc774 \uc74c\uc2dd"


def polish_recommendation_reason(reason: str, food_label: str, raw_food_text: str | None) -> str:
    polished = (reason or "").strip()

    if raw_food_text:
        polished = polished.replace(raw_food_text, food_label)
        polished = polished.replace(f"{raw_food_text}\uc640", f"{food_label}\uc640")
        polished = polished.replace(f"{raw_food_text}\ub791", f"{food_label}\uc640")

    polished = re.sub(r"\s+", " ", polished).strip()
    if not polished:
        return f"{food_label}\uc640 \uc798 \uc5b4\uc6b8\ub9ac\ub294 \uc640\uc778\uc774\uc5d0\uc694."

    if not polished.endswith((".", "!", "?")):
        polished += "."

    return polished


def choose_with_particle(text: str) -> str:
    if not text:
        return "와"

    last_char = text[-1]
    code = ord(last_char)
    if 0xAC00 <= code <= 0xD7A3:
        has_batchim = (code - 0xAC00) % 28 != 0
        return "과" if has_batchim else "와"
    return "와"


def build_recommendation_first_message(recommendation: dict) -> str:
    recommended_wine = recommendation.get("recommendedWine") or {}
    wine_name = (
        recommended_wine.get("nameKr")
        or recommended_wine.get("nameEn")
        or "\ucd94\ucc9c \uc640\uc778"
    )
    raw_food_text = recommendation.get("foodText")
    food_label = normalize_food_label(raw_food_text)
    reason = polish_recommendation_reason(
        recommendation.get("reason") or "",
        food_label,
        raw_food_text,
    )

    particle = choose_with_particle(food_label)
    lead = f"{food_label}{particle} \ud568\uaed8\ub77c\uba74 {wine_name}\ub97c \ucd94\ucc9c\ub4dc\ub9b4\uac8c\uc694."
    return "\n".join([lead, reason])


async def prepare_input_context_node(state: AgentState):
    input_context = build_chat_input_context(
        raw_input=state.get("raw_input", ""),
        selected_menu=state.get("selected_menu"),
        selected_wine=state.get("selected_wine"),
        mentioned_friends=state.get("mentioned_friends"),
    )

    recommendation = None
    if should_request_food_recommendation(state.get("raw_input", ""), input_context):
        try:
            recommendation = await request_food_wine_recommendation(
                user_id=state.get("user_id", ""),
                food_text=input_context.get("food_text", ""),
            )
        except Exception as exception:
            logger.exception("food wine recommendation request failed: %s", exception)
            recommendation = None

    summary = input_context.get("summary", "")
    recommendation_summary = build_food_recommendation_summary(recommendation)
    input_context["summary"] = f"{summary}\n{recommendation_summary}".strip()

    return {
        "input_context": input_context,
        "food_wine_recommendation": recommendation,
    }


async def chat_node(state: AgentState):
    # 1. 동료가 만든 '음식 추천' 결과가 있다면 바로 반환 (우선순위)
    recommendation = state.get("food_wine_recommendation")
    if recommendation:
        recommended_wine = recommendation.get("recommendedWine", {})
        w_id = recommended_wine.get("wineId") or recommended_wine.get("id", 0)
        w_name = recommended_wine.get("nameKr") or recommended_wine.get("name_kr", "이름 모름")
        w_img = recommended_wine.get("imageUrl", "")
        w_match = recommendation.get("matchPercent", 0)
        
        recs = [
            WineRecommendation(
                wine_id=w_id,
                name=w_name,
                image_url=w_img,
                match_score=w_match,
                reason=recommendation.get("reason", "음식과 잘 어울리는 와인을 추천합니다.")
            )
        ]

        return {
            "final_output": FinalSommelierResponse(
                main_message=build_recommendation_first_message(recommendation),
                recommendations=recs
            )
        }

    # 2. 컨텍스트 및 LLM 설정
    llm = get_llm()
    input_context = state.get("input_context") or {}
    input_context_summary = input_context.get("summary", "정보 없음")

    # 3. 본인의 RAG 로직 (하이브리드 추천)
    friend_ids = []
    if state.get("mentioned_friends"):
        friend_ids = [f["id"] for f in state["mentioned_friends"]]
        
    recommended_wines = perform_hybrid_recommendation(
        user_id=state.get("user_id", "guest"),
        query=state["raw_input"],
        friend_ids=friend_ids
    )
    
    wine_context = ""
    wine_meta = None
    if recommended_wines:
        top_wine = recommended_wines[0]
        w_id = top_wine.get("wineId") or top_wine.get("wine_id", 0)
        w_name = top_wine.get("nameKr") or top_wine.get("name_kr", "이름 모름")
        w_match = top_wine.get("matchRate") or int(top_wine.get("similarity_score", 0) * 100)
        w_img = top_wine.get("imageUrl", "")
        w_style = top_wine.get("style") or top_wine.get("type", "")
        
        wine_context = f"추천 와인 정보:\n- 이름: {w_name}\n- 스타일: {w_style}\n- 매칭률: {w_match}%\n"
        wine_meta = (w_id, w_name, w_img, w_match, w_style)

    # 4. 프롬프트 병합 (동료의 컨텍스트 + 본인의 페르소나 지침)
    system_instruction = """당신은 바쁜 와인바에서 손님과 짧고 간결하게 대화하는 '프로 소믈리에'입니다.
    1. 분량 제한: 모든 답변은 한글 공백 포함 '100자 이내'로 끝내세요. 절대 두 문장을 넘기지 마세요.
    2. 채팅 모드: 카카오톡을 보낸다고 생각하고 불필요한 서론 없이 본론만 말하세요."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("user", " [입력 컨텍스트]\n{context}\n\n[추천 와인 정보]\n{wine_context}\n\n질문: {input}")
    ])
    
    chain = prompt | llm
    
    # 5. LLM 답변 생성
    full_content = ""
    async for chunk in chain.astream({
        "input": state["raw_input"], 
        "wine_context": wine_context,
        "context": input_context_summary # 동료가 추가한 컨텍스트 반영
    }):
        full_content += chunk.content
    
    # 6. 본인의 정제(Regex) 로직 (WineRecommendation 생성)
    recs = []
    if wine_meta:
        w_id, w_name, w_img, w_match, w_style = wine_meta
        # (기존 본인의 정제 코드 유지)
        paragraphs = [p.strip() for p in full_content.split("\n\n") if p.strip()]
        desc_raw = paragraphs[1] if len(paragraphs) > 1 else paragraphs[0] if paragraphs else full_content
        clean = re.sub(r"[*#_`~>\-]{1,3}", "", desc_raw)
        clean = re.sub(r"[^\w\s가-힣.,!?%()~]", "", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        m = re.search(r"[^.!?]*[다요]\s*[.!]", clean)
        reason_text = m.group(0).strip() if m else clean[:80].rstrip()
        
        if len(reason_text) > 80:
            reason_text = reason_text[:78].rstrip() + "."
            
        recs.append(
            WineRecommendation(
                wine_id=w_id, name=w_name, image_url=w_img,
                match_score=w_match, reason=reason_text
            )
        )
    
    return {"final_output": FinalSommelierResponse(
        main_message=full_content,
        recommendations=recs if recs else None
    )}    


def build_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("prepare_input_context", prepare_input_context_node)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("prepare_input_context")
    workflow.add_edge("prepare_input_context", "chat")
    workflow.add_edge("chat", END)
    return workflow.compile()

sommelier_agent = build_chat_graph()