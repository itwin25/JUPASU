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


# --- 복구된 풍성한 와인 카드 데이터 구조 ---
class ChatActionData(BaseModel):
    type: str
    label: str
    wine_id: Optional[int] = None


class WineRecommendation(BaseModel):
    wine_id: int
    name_kr: str  # name -> name_kr로 복구
    name_en: Optional[str] = None  # 추가
    subtitle: Optional[str] = None
    price: Optional[int] = None
    match_percent: int  # match_score -> match_percent로 복구
    image_url: Optional[str] = None
    detail_url: Optional[str] = None  # 추가
    reason: str
    actions: List[ChatActionData] = Field(default=[])  # 추가


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

    # --- 시나리오 1: 메뉴판 스캔 모드 (전문가 화법) ---
    menu_foods = input_context.get("menu_foods") or []
    menu_wines = input_context.get("menu_wines") or []

    if menu_foods and should_handle_menu_pairing_request(state["raw_input"], menu_foods):
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
            sys = f"당신은 식당의 소믈리에입니다. 주인공 '{user_nickname}'님의 메뉴판을 분석했습니다. 딱딱한 양식 대신 다정하게 말을 거세요."
            prompt = ChatPromptTemplate.from_messages([
                ("system", sys),
                ("user", f"음식 '{first['foodName']}'에 어울리는 메뉴판 내 와인 '{first['recommendation']['recommendedWine']['nameKr']}'을(를) 찾았습니다. 추천 이유: {first['recommendation'].get('reason','')}. 이를 바탕으로 100자 내외로 멋진 추천 멘트를 써줘.")
            ])
            res = await (prompt | llm).ainvoke({}, config=config)
            
            w = first.get("recommendation", {}).get("recommendedWine", {})
            # 풍성한 데이터로 복구하여 생성
            recs = [WineRecommendation(
                wine_id=w.get("wineId", 0),
                name_kr=w.get("nameKr", "와인"),
                name_en=w.get("nameEn"),
                subtitle=f"{w.get('country','')} {w.get('wineTypeLabel', w.get('wineType',''))}".strip(),
                price=w.get("price"),
                match_percent=first.get("recommendation", {}).get("matchPercent", 0),
                image_url=w.get("imageUrl"),
                detail_url=f"/wines/{w.get('wineId')}" if w.get("wineId") else None,
                reason="메뉴판에서 찾은 최고의 조합입니다.",
                actions=[ChatActionData(type="wishlist", label="위시리스트", wine_id=w.get("wineId"))]
            )]
            return {"final_output": FinalSommelierResponse(main_message=res.content, recommendations=recs)}

    # --- 시나리오 2 & 3 통합: 자율적인 답변 생성 ---
    recommendation = state.get("food_wine_recommendation")
    wine_meta = None
    
    if recommendation:
        w = recommendation.get("recommendedWine", {})
        # [복구] 백엔드에서 받은 모든 필드 추출
        wine_meta = {
            "id": w.get("wineId", 0),
            "name_kr": w.get("nameKr", "와인"),
            "name_en": w.get("nameEn"),
            "image": w.get("imageUrl"),
            "match": recommendation.get("matchPercent", 0),
            "subtitle": f"{w.get('country', '')} {w.get('wineTypeLabel', w.get('wineType', ''))}".strip(),
            "price": w.get("price")
        }
    elif food_text or mentioned_friends:
        ids = [str(f["id"]) for f in mentioned_friends]
        recommends = perform_hybrid_candidate_recommendation(user_id=state["user_id"], food_text=food_text, friend_ids=ids) if food_text else perform_profile_candidate_recommendation(user_id=state["user_id"], friend_ids=ids)
        if recommends:
            top = recommends[0]
            wine_meta = {
                "id": top.get("wineId") or top.get("wine_id", 0),
                "name_kr": top.get("nameKr") or top.get("name_kr", "와인"),
                "name_en": top.get("nameEn") or top.get("name_en"),
                "image": top.get("imageUrl") or top.get("image_url"),
                "match": top.get("matchRate") or int(top.get("similarity_score", 0) * 100),
                "subtitle": f"{top.get('country','')} {top.get('style', top.get('type', ''))}".strip(),
                "price": top.get("price")
            }

    system_instruction = f"""당신은 다정하고 위트 있는 전문 소믈리에입니다. 
1. 페르소나: 격식은 차리되 친구처럼 편안하고 전문적인 조언을 건네세요.
2. 답변 스타일: 고정된 문구를 쓰지 말고 상황에 맞춰 매번 새롭게 말을 거세요.
3. 주인공 인지: 대화의 주인은 '{user_nickname}'님입니다.
4. 그룹 배려: 친구들의 취향({group_context.get('summary','')})을 고려했음을 자연스럽게 녹여내세요.
5. 분량: 100자 내외로 핵심만 작성하세요."""

    wine_name_for_prompt = wine_meta["name_kr"] if wine_meta else "정보 없음"
    user_context = f"[상황] {food_text if food_text else '친구와 대화 중'}\n[추천 와인] {wine_name_for_prompt}\n[매칭률] {wine_meta['match'] if wine_meta else 0}%"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("user", f"{user_context}\n\n위 정보를 바탕으로, {user_nickname}님께 자연스러운 추천 멘트를 해줘. 질문: {state['raw_input']}")
    ])

    chain = prompt | llm
    response = await chain.ainvoke({}, config=config)
    full_content = response.content

    recs = []
    if wine_meta:
        # [복구] 확장된 필드들을 사용하여 카드 생성
        recs = [WineRecommendation(
            wine_id=wine_meta["id"],
            name_kr=wine_meta["name_kr"],
            name_en=wine_meta["name_en"],
            image_url=wine_meta["image"],
            match_percent=wine_meta["match"],
            reason="소믈리에가 선정한 오늘의 와인입니다.",
            subtitle=wine_meta["subtitle"],
            price=wine_meta["price"],
            detail_url=f"/wines/{wine_meta['id']}",
            actions=[ChatActionData(type="wishlist", label="위시리스트", wine_id=wine_meta["id"])]
        )]

    return {
        "final_output": FinalSommelierResponse(
            main_message=full_content,
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
