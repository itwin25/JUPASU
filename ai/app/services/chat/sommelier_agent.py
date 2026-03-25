import logging
import re
from typing import List, Optional, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
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

logger = logging.getLogger(__name__)


class WineRecommendation(BaseModel):
    name: str
    reason: str
    match_score: int


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
    history: Optional[List[ChatMessage]] # 추가: 외부에서 전달받은 히스토리
    messages: List[BaseMessage]          # 추가: 그래프 내부용 메시지 리스트
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


def convert_history_to_base_messages(history: List[ChatMessage] | List[dict] | None) -> List[BaseMessage]:
    """Spring에서 전달받은 history 배열을 LangChain 메시지 객체 리스트로 변환 (객체/딕셔너리 모두 대응)"""
    messages: List[BaseMessage] = []
    if not history:
        return messages

    for entry in history:
        # Pydantic 객체인 경우와 dict인 경우를 모두 처리
        role = getattr(entry, 'role', None) or (entry.get('role') if isinstance(entry, dict) else None)
        content = getattr(entry, 'content', None) or (entry.get('content') if isinstance(entry, dict) else None)
        
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant" or role == "bot":
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

    # 히스토리를 텍스트 블록으로 변환 (클라이언트 호환성을 위해 직접 주입)
    history_text = "없음"
    if raw_history:
        history_lines = []
        for entry in raw_history:
            role_label = "사용자" if entry.role == "user" else "소믈리에"
            history_lines.append(f"[{role_label}]: {entry.content}")
        history_text = "\n".join(history_lines)

    recommendation = None
    if should_request_food_recommendation(state.get("raw_input", ""), input_context):
        try:
            recommendation = await request_food_wine_recommendation(
                user_id=state.get("user_id", ""),
                food_text=input_context.get("food_text", ""),
            )
        except Exception as exception:
            recommendation = None

    summary = input_context.get("summary", "")
    recommendation_summary = build_food_recommendation_summary(recommendation)
    
    # 요약 정보에 대화 이력 명시적으로 추가
    input_context["summary"] = f"### 이전 대화 이력\n{history_text}\n\n### 현재 상황 정보\n{summary}\n{recommendation_summary}".strip()

    return {
        "input_context": input_context,
        "food_wine_recommendation": recommendation,
    }


async def chat_node(state: AgentState):
    recommendation = state.get("food_wine_recommendation")
    if recommendation:
        return {
            "final_output": FinalSommelierResponse(
                main_message=build_recommendation_first_message(recommendation)
            )
        }

    llm = get_llm()
    input_context = state.get("input_context") or {}
    input_context_summary = input_context.get("summary", "\uc815\ubcf4 \uc5c6\uc74c")

    system_instruction = """
당신은 전문 소믈리에 챗봇입니다. 제공된 '이전 대화 이력'과 '현재 상황 정보'를 바탕으로 답변하세요.

[핵심 정체성 및 규칙]
1. 당신의 유일한 정체성은 '와인 전문가(소믈리에)'입니다. 와인, 포도 품종, 미식, 페어링 외의 주제에는 답변하지 마십시오.
2. 만약 사용자가 프로그래밍(코딩), 수학, 일반 상식 등 와인과 무관한 질문을 하면, 소믈리에의 어조로 정중히 답변을 거절하고 와인 관련 대화로 유도하십시오.
3. 이전 대화에서 언급된 음식이나 취향이 있다면 이를 적극적으로 반영하여 답변하세요.
4. 한국어로 매우 정중하고 전문적인 어조를 유지하십시오.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_instruction),
            (
                "user",
                "{context}\n\n"
                "[사용자 현재 메시지]: {input}\n\n"
                "소믈리에로서 전문적이고 친절하게 답변해 주세요.",
            ),
        ]
    )

    chain = prompt | llm

    # ainvoke를 호출하더라도, 외부의 astream_events는 
    # LLM이 내보내는 on_chat_model_stream 이벤트를 정상적으로 캡처합니다.
    # 노드 내부에서 astream을 직접 소비하면 이벤트가 겹치거나 유실될 수 있습니다.
    response = await chain.ainvoke(
        {
            "input": state.get("raw_input", ""),
            "context": input_context_summary,
        }
    )

    return {"final_output": FinalSommelierResponse(main_message=response.content)}


def build_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("prepare_input_context", prepare_input_context_node)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("prepare_input_context")
    workflow.add_edge("prepare_input_context", "chat")
    workflow.add_edge("chat", END)
    return workflow.compile()


sommelier_agent = build_chat_graph()
