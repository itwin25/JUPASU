import logging
import re
from typing import List, Optional, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from app.api.v1.schemas import ChatMessage
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
    image_url: Optional[str] = None
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
    history: Optional[List[ChatMessage]]
    messages: List[BaseMessage]
    input_context: Optional[dict]
    food_wine_recommendation: Optional[dict]
    final_output: Optional[FinalSommelierResponse]


FOOD_REQUEST_SUFFIXES = (
    "와 어울리는 와인 추천해줘",
    "랑 어울리는 와인 추천해줘",
    "와 어울리는 와인 추천",
    "랑 어울리는 와인 추천",
    "어울리는 와인 추천해줘",
    "어울리는 와인 추천",
    "어울리는 와인",
    "추천해줘",
    "추천",
)


def normalize_food_label(food_text: str | None) -> str:
    if not food_text:
        return "이 음식"

    normalized = re.sub(r"\s+", " ", food_text).strip()

    for suffix in FOOD_REQUEST_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
            break

    for particle in ("이랑", "랑", "과", "와"):
        if normalized.endswith(particle):
            normalized = normalized[: -len(particle)].strip()
            break

    normalized = re.sub(r"[?.!,]+$", "", normalized).strip()
    return normalized or "이 음식"


def polish_recommendation_reason(reason: str, food_label: str, raw_food_text: str | None) -> str:
    polished = (reason or "").strip()

    if raw_food_text:
        polished = polished.replace(raw_food_text, food_label)
        polished = polished.replace(f"{raw_food_text}와", f"{food_label}와")
        polished = polished.replace(f"{raw_food_text}랑", f"{food_label}와")

    polished = re.sub(r"\s+", " ", polished).strip()
    if not polished:
        return f"{food_label}와 잘 어울리는 와인이에요."

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
        or "추천 와인"
    )
    raw_food_text = recommendation.get("foodText")
    food_label = normalize_food_label(raw_food_text)
    reason = polish_recommendation_reason(
        recommendation.get("reason") or "",
        food_label,
        raw_food_text,
    )

    particle = choose_with_particle(food_label)
    lead = f"{food_label}{particle} 함께라면 {wine_name}를 추천드릴게요."
    return "\n".join([lead, reason])


def convert_history_to_base_messages(history: List[ChatMessage] | List[dict] | None) -> List[BaseMessage]:
    messages: List[BaseMessage] = []
    if not history:
        return messages

    for entry in history:
        role = getattr(entry, "role", None) or (entry.get("role") if isinstance(entry, dict) else None)
        content = getattr(entry, "content", None) or (entry.get("content") if isinstance(entry, dict) else None)

        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in ("assistant", "bot"):
            messages.append(AIMessage(content=content))

    return messages


async def prepare_input_context_node(state: AgentState):
    raw_history = state.get("history")

    input_context = build_chat_input_context(
        raw_input=state.get("raw_input", ""),
        selected_menu=state.get("selected_menu"),
        selected_wine=state.get("selected_wine"),
        mentioned_friends=state.get("mentioned_friends"),
    )

    history_text = "대화 이력 없음"
    if raw_history:
        history_lines = []
        for entry in raw_history:
            role = getattr(entry, "role", None) or (entry.get("role") if isinstance(entry, dict) else None)
            content = getattr(entry, "content", None) or (entry.get("content") if isinstance(entry, dict) else None)
            role_label = "사용자" if role == "user" else "소믈리에"
            history_lines.append(f"[{role_label}]: {content}")
        history_text = "\n".join(history_lines)

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

    input_context["summary"] = (
        f"### 이전 대화 이력\n{history_text}\n\n"
        f"### 현재 상황 정보\n{summary}\n{recommendation_summary}"
    ).strip()

    return {
        "input_context": input_context,
        "food_wine_recommendation": recommendation,
    }


async def chat_node(state: AgentState):
    recommendation = state.get("food_wine_recommendation")
    if recommendation:
        recommended_wine = recommendation.get("recommendedWine", {})
        wine_id = recommended_wine.get("wineId") or recommended_wine.get("id", 0)
        wine_name = recommended_wine.get("nameKr") or recommended_wine.get("name_kr", "이름 모름")
        wine_image = recommended_wine.get("imageUrl")
        match_score = recommendation.get("matchPercent", 0)

        recommendations = [
            WineRecommendation(
                wine_id=wine_id,
                name=wine_name,
                image_url=wine_image,
                match_score=match_score,
                reason=recommendation.get("reason", "음식과 잘 어울리는 와인이에요."),
            )
        ]

        return {
            "final_output": FinalSommelierResponse(
                main_message=build_recommendation_first_message(recommendation),
                recommendations=recommendations,
            )
        }

    llm = get_llm()
    input_context = state.get("input_context") or {}
    input_context_summary = input_context.get("summary", "정보 없음")

    friend_ids = []
    if state.get("mentioned_friends"):
        friend_ids = [friend["id"] for friend in state["mentioned_friends"]]

    recommended_wines = perform_hybrid_recommendation(
        user_id=state.get("user_id", "guest"),
        query=state["raw_input"],
        friend_ids=friend_ids,
    )

    wine_context = ""
    wine_meta = None
    if recommended_wines:
        top_wine = recommended_wines[0]
        wine_id = top_wine.get("wineId") or top_wine.get("wine_id", 0)
        wine_name = top_wine.get("nameKr") or top_wine.get("name_kr", "이름 모름")
        match_score = top_wine.get("matchRate") or int(top_wine.get("similarity_score", 0) * 100)
        wine_image = top_wine.get("imageUrl", "")
        wine_style = top_wine.get("style") or top_wine.get("type", "")

        wine_context = (
            f"추천 와인 정보:\n"
            f"- 이름: {wine_name}\n"
            f"- 스타일: {wine_style}\n"
            f"- 매칭률: {match_score}%\n"
        )
        wine_meta = (wine_id, wine_name, wine_image, match_score, wine_style)

    system_instruction = """당신은 바에서 손님에게 짧고 간결하게 안내하는 '프로 소믈리에'입니다.
1. 분량 제한: 모든 응답은 공감 포함 100자 내외를 우선으로 하세요. 너무 긴 문장은 피해주세요.
2. 채팅 모드: 친절하고 편안한 톤을 유지하되 과장 없이 본론만 말해주세요."""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_instruction),
            ("user", "[입력 컨텍스트]\n{context}\n\n[추천 와인 정보]\n{wine_context}\n\n질문: {input}"),
        ]
    )

    chain = prompt | llm

    full_content = ""
    async for chunk in chain.astream(
        {
            "input": state["raw_input"],
            "wine_context": wine_context,
            "context": input_context_summary,
        }
    ):
        full_content += chunk.content

    recommendations = []
    if wine_meta:
        wine_id, wine_name, wine_image, match_score, _wine_style = wine_meta
        paragraphs = [paragraph.strip() for paragraph in full_content.split("\n\n") if paragraph.strip()]
        desc_raw = paragraphs[1] if len(paragraphs) > 1 else paragraphs[0] if paragraphs else full_content
        clean = re.sub(r"[*#_`~>\-]{1,3}", "", desc_raw)
        clean = re.sub(r"[^\w\s가-힣,!?%()~]", "", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        sentence_match = re.search(r"[^.!?]*[요다]\s*[.!]", clean)
        reason_text = sentence_match.group(0).strip() if sentence_match else clean[:80].rstrip()

        if len(reason_text) > 80:
            reason_text = reason_text[:78].rstrip() + "."

        recommendations.append(
            WineRecommendation(
                wine_id=wine_id,
                name=wine_name,
                image_url=wine_image,
                match_score=match_score,
                reason=reason_text,
            )
        )

    return {
        "final_output": FinalSommelierResponse(
            main_message=full_content,
            recommendations=recommendations if recommendations else None,
        )
    }


def build_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("prepare_input_context", prepare_input_context_node)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("prepare_input_context")
    workflow.add_edge("prepare_input_context", "chat")
    workflow.add_edge("chat", END)
    return workflow.compile()


sommelier_agent = build_chat_graph()
