from typing import List, TypedDict, Annotated, Optional, Literal
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from services.llm.factory import get_llm
import operator
import asyncio
import json

# --- 1. AI 의사결정 및 응답을 위한 구조화된 출력 스키마 (AI Docs) ---

class RefinedInput(BaseModel):
    """Schema for analyzing and refining user intent into actionable tasks."""
    intent_query: str = Field(description="The refined, professional sommelier instruction derived from raw user query.")
    friend_ids: List[str] = Field(default=[], description="List of friend names or IDs identified for preference loading.")
    needs_menu_analysis: bool = Field(description="Whether the OCR text contains menu data that needs extraction.")
    is_general_chat: bool = Field(description="True if the input is just a greeting or non-wine related talk.")

class MenuExtraction(BaseModel):
    """Schema for extracting specific entities from wine menu OCR text."""
    wine_names: List[str] = Field(description="Clean list of wine names identified from the menu.")
    food_names: List[str] = Field(description="Clean list of food/dish items identified from the menu.")

class WineRecommendation(BaseModel):
    """Schema for a single wine recommendation detail."""
    name: str = Field(description="Name of the recommended wine.")
    reason: str = Field(description="Detailed reason why this wine is a good match for the participants.")
    match_score: int = Field(description="Match percentage (1-100).")

class FinalSommelierResponse(BaseModel):
    """The final, highly structured response provided to the user."""
    main_message: str = Field(description="The primary response message in Korean.")
    recommendations: Optional[List[WineRecommendation]] = Field(default=None, description="Detailed list if recommendations are made.")
    analysis_context: Optional[str] = Field(default=None, description="Context on whose tastes were considered (e.g., group consensus).")
    food_pairing_notes: Optional[str] = Field(default=None, description="Specific notes on food and wine harmony.")
    suggested_next_steps: List[str] = Field(default=[], description="Suggested follow-up questions in Korean.")

# --- 2. Graph State 정의 (데이터 공유 바구니) ---

class AgentState(TypedDict):
    """
    [핵심 상태 객체] 
    그래프의 모든 노드가 이 상태를 공유하며 데이터를 누적하거나 수정합니다.
    """
    # 입력 데이터
    raw_input: str                      # 사용자 질문 (날것)
    raw_ocr: Optional[str]              # 메뉴판 텍스트 (날것)
    user_id: str
    
    # AI 정제 결과 및 제어 정보
    refined: Optional[RefinedInput]     # 1단계에서 AI가 정제한 구조화된 데이터
    retry_count: int                    # 분석 실패 시 재시도 횟수
    
    # 노드별 작업 결과 저장소
    user_preference: Optional[dict] = None
    # 여러 친구의 데이터를 리스트에 계속 추가(Append)하기 위해 operator.add 사용
    friends_preferences: Annotated[List[dict], operator.add] = [] 
    extracted_menu: dict = {}           # {"wines": [...], "foods": [...]}
    wine_details: List[dict] = []       # DB에서 검색된 상세 정보
    
    # 최종 결과 객체
    final_output: Optional[FinalSommelierResponse] = None

# --- 3. 독립적인 에이전트 도구 (@tool) ---

@tool
async def get_user_preference(user_id: str):
    """Retrieve the current user's wine preferences and taste profiles from the database."""
    # [한글 주석] 사용자 본인의 선호 스타일을 DB에서 조회합니다.
    return {"style": "Heavy Red", "pref": "Bold & Tannic"}

@tool
async def get_friend_preferences(friend_ids: List[str]):
    """Fetch wine preference metadata for multiple friends in parallel from the database."""
    # [한글 주석] 요청된 여러 친구들의 취향 데이터를 동시에 가져옵니다.
    return [{"id": fid, "style": "Crisp White"} for fid in friend_ids]

@tool
async def search_wine_details(wine_names: List[str]):
    """Search the wine database for detailed technical specifications based on extracted names."""
    # [한글 주석] 메뉴에서 발견된 와인 이름들을 들고 실제 DB를 뒤져 상세 스펙을 확보합니다.
    return [{"name": n, "rating": 4.5, "body": 4} for n in wine_names]

# --- 4. Versatile System Prompts (영문 최적화) ---

REFINER_SYSTEM_PROMPT = """
You are a versatile Wine Intelligence Orchestrator. 
Analyze the input context and generate a RefinedInput object.

[SCENARIO GUIDELINES]
1. General Chat: Greeting or general wine knowledge (e.g. "What is tannin?"). -> is_general_chat=True
2. Menu Analysis: If OCR text or wine list images are provided. -> needs_menu_analysis=True
3. Personal Recommendation: If user asks for their own taste. -> intent_query should reflect personal match.
4. Group Recommendation: If friends are mentioned. -> intent_query should reflect group consensus.
"""

ENGINE_SYSTEM_PROMPT = """
You are a Master Sommelier with expertise in pairing and social coordination.
Provide a structured, professional response in KOREAN.

[ADAPTIVE RESPONSE GUIDELINES]
- No specific data: Be an educator. Answer general questions.
- User preference only: Be a personal consultant.
- Menu available: Be a pairing specialist. Match wine to food items.
- Multiple people: Be a mediator. Find the best consensus for everyone.
"""

# --- 5. Asynchronous Nodes Implementation ---

async def refine_input_node(state: AgentState):
    """[AI 노드] 사용자의 비정형 입력을 분석하여 구조화된 실행 계획으로 변환합니다."""
    print("--- [NODE: refine_input] ---")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", REFINER_SYSTEM_PROMPT),
        ("user", "Input: {input}\nOCR: {ocr}")
    ])
    chain = prompt | llm.with_structured_output(RefinedInput)
    try:
        result = await chain.ainvoke({
            "input": state["raw_input"],
            "ocr": (state["raw_ocr"][:100] + "...") if state["raw_ocr"] else "None"
        })
        return {"refined": result, "retry_count": 0}
    except Exception as e:
        print(f"Refinement Error: {e}")
        return {"refined": None}

async def analyze_menu_node(state: AgentState):
    """[AI 노드] OCR 텍스트에서 와인과 음식 데이터를 정밀하게 추출합니다."""
    print("--- [NODE: analyze_menu] ---")
    if not state["refined"] or not state["refined"].needs_menu_analysis:
        return {"extracted_menu": {}}
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract structured wine and food data from the menu text. Be very precise."),
        ("user", "{input}")
    ])
    chain = prompt | llm.with_structured_output(MenuExtraction)
    result = await chain.ainvoke({"input": state["raw_ocr"] or ""})
    return {"extracted_menu": {"wines": result.wine_names, "foods": result.food_names}}

async def load_user_pref_node(state: AgentState):
    """[DB 노드] 사용자 본인의 취향을 비동기 조회합니다."""
    print("--- [NODE: load_user_pref] ---")
    pref = await get_user_preference.ainvoke({"user_id": state["user_id"]})
    return {"user_preference": pref}

async def load_friend_pref_node(state: AgentState):
    """[DB 노드] 친구들의 취향을 병렬로 비동기 조회합니다."""
    print("--- [NODE: load_friend_pref] ---")
    if not state["refined"] or not state["refined"].friend_ids:
        return {"friends_preferences": []}
    prefs = await get_friend_preferences.ainvoke({"friend_ids": state["refined"].friend_ids})
    return {"friends_preferences": prefs}

async def wine_search_node(state: AgentState):
    """[DB 노드] 추출된 이름들로 실제 상세 스펙을 DB에서 검색합니다."""
    print("--- [NODE: wine_search] ---")
    wines = state.get("extracted_menu", {}).get("wines", [])
    if not wines: return {"wine_details": []}
    details = await search_wine_details.ainvoke({"wine_names": wines})
    return {"wine_details": details}

async def pairing_engine_node(state: AgentState):
    """[최종 엔진] 모든 수집 데이터를 종합하여 소믈리에 리포트를 생성합니다."""
    print("--- [NODE: pairing_engine] ---")
    llm = get_llm()
    
    context_data = {
        "instruction": state["refined"].intent_query if state["refined"] else state["raw_input"],
        "user_pref": state.get("user_preference"),
        "friends_pref": state.get("friends_preferences"),
        "menu_wines": state.get("wine_details"),
        "menu_foods": state.get("extracted_menu", {}).get("foods")
    }
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", ENGINE_SYSTEM_PROMPT),
        ("user", "Instruction: {instruction}\nData: {data}")
    ])
    
    chain = prompt | llm.with_structured_output(FinalSommelierResponse)
    
    try:
        result = await chain.ainvoke({
            "instruction": context_data["instruction"],
            "data": json.dumps(context_data, ensure_ascii=False)
        })
        return {"final_output": result}
    except Exception as e:
        print(f"Final Engine Error: {e}")
        return {"final_output": FinalSommelierResponse(main_message="분석 중 오류가 발생했습니다.")}

# --- 6. Dynamic Routing & Build ---

def route_after_refine(state: AgentState):
    """정제된 의도에 따라 실행할 노드 리스트를 결정합니다."""
    refined = state["refined"]
    if not refined or refined.is_general_chat:
        return "chat"
    
    tasks = ["load_user_pref"] # 나 자신의 취향은 기본 포함
    if refined.friend_ids: tasks.append("load_friend_pref")
    if refined.needs_menu_analysis: tasks.append("analyze_menu")
    return tasks

def build_sommelier_graph():
    """병렬 처리와 지능형 분기를 포함한 소믈리에 그래프를 빌드합니다."""
    workflow = StateGraph(AgentState)
    
    workflow.add_node("refine", refine_input_node)
    workflow.add_node("load_user_pref", load_user_pref_node)
    workflow.add_node("load_friend_pref", load_friend_pref_node)
    workflow.add_node("analyze_menu", analyze_menu_node)
    workflow.add_node("wine_search", wine_search_node)
    workflow.add_node("pairing_engine", pairing_engine_node)
    workflow.add_node("chat", lambda x: {"final_output": FinalSommelierResponse(main_message="안녕하세요! 궁금한 와인 정보를 물어보세요.")})

    workflow.set_entry_point("refine")
    
    # 동적 분기 설정 (Split)
    workflow.add_conditional_edges("refine", route_after_refine, {
        "load_user_pref": "load_user_pref",
        "load_friend_pref": "load_friend_pref",
        "analyze_menu": "analyze_menu",
        "chat": END
    })
    
    # 합치기 로직 (Join)
    workflow.add_edge("load_user_pref", "pairing_engine")
    workflow.add_edge("load_friend_pref", "pairing_engine")
    workflow.add_edge("analyze_menu", "wine_search")
    workflow.add_edge("wine_search", "pairing_engine")
    
    workflow.add_edge("pairing_engine", END)

    return workflow.compile()

sommelier_agent = build_sommelier_graph()
