import logging
import re
from typing import List, Optional, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from app.api.v1.schemas import ChatMessage
from app.services.chat.food_wine_recommendation_client import (
    build_food_recommendation_summary,
    request_menu_pairing_recommendations,
    request_food_wine_recommendation,
    should_request_food_recommendation,
)
from app.services.chat.input_context_builder import build_chat_input_context
from app.services.llm.factory import get_llm
from app.services.rag.hybrid_candidate_retrieval_service import (
    perform_hybrid_candidate_recommendation,
    perform_profile_candidate_recommendation,
)

logger = logging.getLogger(__name__)


# --- 데이터 모델 정의 ---
class ChatActionData(BaseModel):
    type: str
    label: str
    wine_id: Optional[int] = None


class WineRecommendation(BaseModel):
    wine_id: int
    name_kr: str
    name_en: Optional[str] = None
    subtitle: Optional[str] = None
    price: Optional[int] = None
    match_percent: int
    image_url: Optional[str] = None
    detail_url: Optional[str] = None
    reason: str
    actions: List[ChatActionData] = Field(default=[])


class FinalSommelierResponse(BaseModel):
    main_message: str
    recommendations: Optional[List[WineRecommendation]] = Field(default=None)
    suggested_next_steps: List[str] = Field(default=[])


class AgentState(TypedDict):
    raw_input: str
    user_id: str
    user_nickname: Optional[str]
    mentioned_friends: Optional[List[dict]]
    group_context: Optional[dict]
    selected_wine: Optional[dict]
    selected_menu: Optional[dict]
    history: Optional[List[ChatMessage]]
    messages: List[BaseMessage]
    input_context: Optional[dict]
    food_wine_recommendation: Optional[dict]
    final_output: Optional[FinalSommelierResponse]
    wine_card: Optional[dict]
    wine_cards: Optional[List[dict]]


# --- 메뉴판 전용 유틸리티 ---

MENU_NEXT_RECOMMENDATION_CUES = (
    "별로",
    "다른",
    "또 추천",
    "다른 추천",
    "다음 추천",
    "다른 와인",
    "다른 조합",
    "변경",
    "말고",
)


def _normalize_overlap_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9가-힣]+", "", str(value).lower().strip())


def _has_meaningful_food_overlap(menu_food: str, user_input: str) -> bool:
    f = _normalize_overlap_text(menu_food)
    i = _normalize_overlap_text(user_input)
    if not f or not i:
        return False
    return f in i or i in f


def should_handle_menu_pairing_request(raw_input: str, menu_foods: list[str]) -> bool:
    if not menu_foods:
        return False
    inp = (raw_input or "").strip()
    if inp == "메뉴판 스캔 완료":
        return True
    if any(cue in inp for cue in MENU_NEXT_RECOMMENDATION_CUES):
        return True
    if any(_has_meaningful_food_overlap(food, inp) for food in menu_foods):
        return True
    return False


def resolve_menu_target_foods(
    raw_input: str, menu_foods: list[str], previous_pairings: list[dict]
) -> list[str]:
    inp = (raw_input or "").strip()
    mentioned = [f for f in menu_foods if _has_meaningful_food_overlap(f, inp)]
    if mentioned:
        return mentioned

    if any(cue in inp for cue in MENU_NEXT_RECOMMENDATION_CUES):
        already_recommended = {
            p.get("foodName", "").strip().casefold() for p in previous_pairings
        }
        return [f for f in menu_foods if f.strip().casefold() not in already_recommended]
    return menu_foods


def extract_previous_menu_pairings(history: List[ChatMessage] | None) -> list[dict]:
    pairings = []
    if not history:
        return pairings
    for msg in history:
        if msg.role not in ("assistant", "bot"):
            continue
        sects = re.split(r"(?=\d+\.\s*음식)", msg.content)
        for s in sects:
            f = re.search(r"음식[:\s*]+([^\n]+)", s)
            w = re.search(r"와인[:\s*]+([^\n]+)", s)
            if f and w:
                pairings.append(
                    {"foodName": f.group(1).strip(), "wineName": w.group(1).strip()}
                )
    return pairings


# --- 메인 노드 ---


async def prepare_input_context_node(state: AgentState):
    input_context = build_chat_input_context(
        raw_input=state.get("raw_input", ""),
        selected_menu=state.get("selected_menu"),
        selected_wine=state.get("selected_wine"),
        mentioned_friends=state.get("mentioned_friends"),
    )
    recommendation = None
    if input_context.get("tagged_foods"):
        try:
            recommendation = await request_food_wine_recommendation(
                user_id=state.get("user_id", ""),
                food_text=", ".join(input_context["tagged_foods"]),
            )
        except Exception:
            logger.exception("food wine recommendation request failed")

    return {"input_context": input_context, "food_wine_recommendation": recommendation}


async def chat_node(state: AgentState, config: RunnableConfig):
    llm = get_llm()
    input_context = state.get("input_context") or {}
    group_context = state.get("group_context") or {}
    mentioned_friends = state.get("mentioned_friends") or []
    user_nickname = state.get("user_nickname", "손님")
    food_text = input_context.get("food_text", "")

    # --- 시나리오 1: 메뉴판 스캔 모드 ---
    menu_foods = input_context.get("menu_foods") or []
    menu_wines = input_context.get("menu_wines") or []

    if menu_foods and should_handle_menu_pairing_request(state["raw_input"], menu_foods):
        loading_trigger_text = "소믈리에가 최적의 와인과 음식 페어링 조합을 찾고 있습니다."
        prev = extract_previous_menu_pairings(state.get("history"))
        target = resolve_menu_target_foods(state["raw_input"], menu_foods, prev)
        pairings = await request_menu_pairing_recommendations(
            user_id=state["user_id"],
            menu_foods=menu_foods,
            menu_wines=menu_wines,
            target_foods=target,
            excluded_wine_names=[p["wineName"] for p in prev],
            max_pairings=1,
        )
        if pairings:
            first = pairings[0]
            sys = f"""당신은 식당의 소믈리에입니다. 손님 '{user_nickname}'님의 메뉴판을 분석 중입니다.
반드시 답변의 첫 시작을 "{user_nickname}님"이라고 정확히 부르며 시작하세요.
답변 맨 앞에 "{loading_trigger_text}" 문구를 포함하여 자연스럽게 작성하세요."""
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", sys),
                ("user", f"음식 '{first['foodName']}'와 메뉴판 와인 '{first['recommendation']['recommendedWine']['nameKr']}' 조합입니다. 추천 사유: {first['recommendation'].get('reason','')}. 다정하게 추천해주세요.")
            ])
            
            response = await (prompt | llm).ainvoke({}, config=config)
            
            w = first.get("recommendation", {}).get("recommendedWine", {})
            recs = [WineRecommendation(
                wine_id=w.get("wineId", 0), name_kr=w.get("nameKr", "와인"),
                name_en=w.get("nameEn"), subtitle=f"{w.get('country','')} {w.get('wineTypeLabel','')}".strip(),
                price=w.get("price"), match_percent=first.get("recommendation", {}).get("matchPercent", 0),
                image_url=w.get("imageUrl"), detail_url=f"/wines/{w.get('wineId')}",
                reason="메뉴판 기반 최적의 조합입니다.",
                actions=[ChatActionData(type="wishlist", label="위시리스트에 추가하기", wine_id=w.get("wineId"))]
            )]
            return {"final_output": FinalSommelierResponse(main_message=response.content, recommendations=recs)}

    # --- 시나리오 2 & 3 통합: 정밀 추천 및 RAG ---
    recommendation = state.get("food_wine_recommendation")
    wine_meta = None
    
    if recommendation:
        # Scenario 2: #태그 마커 기반 정밀 추천
        w = recommendation.get("recommendedWine", {})
        wine_meta = {
            "id": w.get("wineId", 0), "name_kr": w.get("nameKr", "와인"), "name_en": w.get("nameEn"),
            "image": w.get("imageUrl"), "match": recommendation.get("matchPercent", 0),
            "subtitle": f"{w.get('country', '')} {w.get('wineTypeLabel', w.get('wineType', ''))}".strip(),
            "price": w.get("price")
        }
    elif food_text or mentioned_friends:
        # Scenario 3: 일반 대화 또는 친구만 언급
        ids = [str(f["id"]) for f in mentioned_friends]
        recommends = perform_hybrid_candidate_recommendation(user_id=state["user_id"], food_text=food_text, friend_ids=ids) if food_text else perform_profile_candidate_recommendation(user_id=state["user_id"], friend_ids=ids)
        print(f"🔍 [AGENT_TRACE] Scenario 3 recommends count: {len(recommends) if recommends else 0}")
        if recommends:
            top = recommends[0]
            wine_meta = {
                "id": top.get("wineId") or top.get("id") or top.get("wine_id", 0),
                "name_kr": top.get("nameKr") or top.get("name_kr", "와인"),
                "name_en": top.get("nameEn") or top.get("name_en"),
                "image": top.get("imageUrl") or top.get("image_url"),
                "match": top.get("matchRate") or top.get("matchPercent") or int(top.get("similarity_score", 0) * 100),
                "subtitle": f"{top.get('country','')} {top.get('style', top.get('type', ''))}".strip(),
                "price": top.get("price")
            }
            print(f"📍 [AGENT_TRACE] wine_meta created: {wine_meta['name_kr']}")

    # 공통 소믈리에 페르소나 및 자율 지침
    system_instruction = f"""당신은 다정하고 위트 있는 전문 소믈리에입니다. 
1. 주인공 인지: 대화의 주인공은 '{user_nickname}'님입니다. 반드시 답변의 첫 시작을 "{user_nickname}님"이라고 정확히 부르며 시작하세요.
2. 그룹 배려: [취향 분석 데이터] 섹션에 제공된 수치를 바탕으로, 친구들의 입맛을 어떻게 고려했는지 구체적이고 전문적으로 설명하세요.
3. 분량: 100자 내외로 핵심만 작성하세요. 상황에 맞춰 매번 자연스럽게 말을 거세요."""

    wine_name_for_prompt = wine_meta["name_kr"] if wine_meta else "정보 없음"
    wine_info = f"[추천 와인] {wine_name_for_prompt} (매칭률 {wine_meta['match'] if wine_meta else 0}%)"
    
    # [핵심] 모든 컨텍스트 데이터를 통합하여 전달
    full_context = f"""[취향 분석 데이터]
{input_context.get('summary', '정보 없음')}
{group_context.get('summary', '')}

{wine_info}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("user", f"{full_context}\n\n[사용자 질문]\n{state['raw_input']}\n\n위의 데이터와 상황을 바탕으로 자연스러운 소믈리에 추천 멘트를 작성해주세요.")
    ])

    # [핵심] config를 전달하여 노드 내부 LLM 이벤트를 외부 스트림으로 정상 전파
    response = await (prompt | llm).ainvoke({}, config=config)

    recs = []
    if wine_meta:
        recs = [WineRecommendation(
            wine_id=wine_meta["id"], name_kr=wine_meta["name_kr"], name_en=wine_meta["name_en"],
            image_url=wine_meta["image"], match_percent=wine_meta["match"],
            reason="소믈리에가 선정한 오늘의 와인입니다.", subtitle=wine_meta["subtitle"],
            price=wine_meta["price"], detail_url=f"/wines/{wine_meta['id']}",
            actions=[ChatActionData(type="wishlist", label="위시리스트", wine_id=wine_meta["id"])]
        )]

    return {
        "final_output": FinalSommelierResponse(
            main_message=response.content,
            recommendations=recs if recs else None,
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
