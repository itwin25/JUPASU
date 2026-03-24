import logging
from typing import List, Optional, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

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
    input_context: Optional[dict]
    food_wine_recommendation: Optional[dict]
    final_output: Optional[FinalSommelierResponse]


def normalize_food_label(food_text: str | None) -> str:
    if not food_text:
        return "이 음식"

    normalized = food_text.strip()
    suffixes = (
        "과 어울리는 와인 추천해줘",
        "와 어울리는 와인 추천해줘",
        "랑 어울리는 와인 추천해줘",
        "과 어울리는 와인 추천",
        "와 어울리는 와인 추천",
        "랑 어울리는 와인 추천",
        "추천해줘",
        "추천해 줘",
    )

    for suffix in suffixes:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)].strip()
            break

    if normalized.endswith("이랑"):
        normalized = normalized[:-2].strip()
    elif normalized.endswith("랑"):
        normalized = normalized[:-1].strip()

    return normalized or "이 음식"


def build_recommendation_first_message(recommendation: dict) -> str:
    recommended_wine = recommendation.get("recommendedWine") or {}
    wine_name = recommended_wine.get("nameKr") or recommended_wine.get("nameEn") or "추천 와인"
    reason = recommendation.get("reason") or "음식과 잘 어울리는 와인이에요."
    raw_food_text = recommendation.get("foodText")
    food_label = normalize_food_label(raw_food_text)

    if raw_food_text:
        reason = reason.replace(f"{raw_food_text}와", f"{food_label}와")
        reason = reason.replace(str(raw_food_text), food_label)

    message_lines = [
        f"오늘은 {wine_name}를 추천드릴게요.",
        reason,
    ]

    return "\n".join(message_lines)


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
    recommendation = state.get("food_wine_recommendation")
    if recommendation:
        return {
            "final_output": FinalSommelierResponse(
                main_message=build_recommendation_first_message(recommendation)
            )
        }

    llm = get_llm()

    input_context = state.get("input_context") or {}
    input_context_summary = input_context.get("summary", "없음")

    system_instruction = """
당신은 사용자의 취향과 상황에 맞는 와인을 제안하는 소믈리에 챗봇입니다.

가능하면 먼저 사용자가 이미 제공한 정보만으로 답변하세요.
추가 질문이 꼭 필요할 때만 짧게 물어보고, 이미 추천 결과나 메뉴 정보가 있으면 그것을 우선 활용하세요.

답변 원칙:
1. 사용자가 바로 이해할 수 있도록 자연스럽고 친절한 한국어로 답변합니다.
2. 추천 결과가 있는 경우, 그 내용을 중심으로 이유를 설명합니다.
3. 와인명, 추천 이유, 매칭 포인트가 있으면 우선적으로 반영합니다.
4. 불필요하게 질문을 되돌리지 말고, 이미 있는 정보로 최대한 도움을 줍니다.
5. 초보자도 이해할 수 있도록 쉬운 표현을 사용합니다.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_instruction),
            (
                "user",
                "[정리된 입력 정보]\n{context}\n\n"
                "[사용자 메시지]\n{input}",
            ),
        ]
    )

    chain = prompt | llm

    full_content = ""
    async for chunk in chain.astream(
        {
            "input": state.get("raw_input", ""),
            "context": input_context_summary,
        }
    ):
        full_content += chunk.content

    return {"final_output": FinalSommelierResponse(main_message=full_content)}


def build_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("prepare_input_context", prepare_input_context_node)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("prepare_input_context")
    workflow.add_edge("prepare_input_context", "chat")
    workflow.add_edge("chat", END)
    return workflow.compile()


sommelier_agent = build_chat_graph()
