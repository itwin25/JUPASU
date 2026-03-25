import logging
import re
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
You are a warm sommelier assistant.
Reply in natural Korean.
Keep answers concise and practical.
When recommending wine, prioritize a short lead sentence and one clear reason.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_instruction),
            (
                "user",
                "[\uc785\ub825 \ucee8\ud14d\uc2a4\ud2b8]\n{context}\n\n"
                "[\uc0ac\uc6a9\uc790 \uba54\uc2dc\uc9c0]\n{input}",
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
