from typing import List, TypedDict, Optional
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm.factory import get_llm
import asyncio

# --- 1. AI 의사결정 및 응답을 위한 구조화된 출력 스키마 (AI Docs) ---

class RefinedInput(BaseModel):
    """Schema for analyzing and refining user intent into actionable tasks."""
    intent_query: str = Field(description="The refined, professional sommelier instruction derived from raw user query.")
    # friend_ids는 프론트엔드에서 명시적으로 넘겨주므로 삭제됨
    needs_menu_analysis: bool = Field(description="Whether the OCR text contains menu data that needs extraction.")
    is_general_chat: bool = Field(description="True if the input is just a greeting or non-wine related talk.")

class MenuExtraction(BaseModel):
    """Schema for extracting specific entities from wine menu OCR text."""
    wine_names: List[str] = Field(default=[], description="Clean list of wine names identified from the menu.")
    food_names: List[str] = Field(default=[], description="Clean list of food/dish items identified from the menu.")

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
    raw_input: str
    raw_ocr: Optional[str]
    user_id: str
    
    # [추가됨] 프론트엔드에서 명시적으로 전달받은 멘션된 친구 목록 
    # 예: [{"fname": "kim", "fid": "id12312"}]
    mentioned_friends: Optional[List[dict]]
    
    # AI 정제 결과
    refined: Optional[RefinedInput]
    
    # 노드별 작업 결과 저장소
    user_preference: Optional[dict]
    friends_preferences: List[dict]
    extracted_menu: dict
    wine_details: List[dict]
    
    # 최종 결과 객체
    final_output: Optional[FinalSommelierResponse]

# --- 3. 일반 비동기 함수 (DB 조회 및 도구) ---

async def fetch_user_preference(user_id: str) -> dict:
    """Retrieve the current user's wine preferences and taste profiles from the database."""
    return {"style": "Heavy Red", "pref": "Bold & Tannic"}

async def fetch_friend_preferences(friends: List[dict]) -> List[dict]:
    """Fetch wine preference metadata for multiple friends using explicitly provided IDs."""
    # 실제 구현 시: SELECT * FROM user_preferences WHERE user_id IN ([f["fid"] for f in friends])
    # LLM이 응답 시 자연스럽게 이름을 부를 수 있도록 fname도 함께 반환
    return [{"name": f.get("fname", "Unknown"), "fid": f.get("fid"), "style": "Crisp White"} for f in friends]

async def fast_db_search(wine_name: str) -> Optional[dict]:
    """[TODO] 1차 고속 DB 검색 (Vector/Fuzzy). 신뢰도 점수를 함께 반환합니다."""
    # 임시 목업: 랜덤하게 성공(신뢰도 0.85 이상) 또는 실패 시뮬레이션
    import random
    score = random.uniform(0.6, 0.99)
    if score >= 0.85:
        return {"name": wine_name, "rating": 4.5, "body": 4, "confidence": score}
    return None

class QueryRefinement(BaseModel):
    refined_query: str = Field(description="The corrected and refined wine name for better DB search.")

async def rewrite_wine_query(wine_name: str) -> str:
    """[LLM 구조대] 검색에 실패한 와인 이름의 오타를 정식 영문 명칭으로 교정합니다."""
    print(f"   [LLM 교정] '{wine_name}' 오타 수정을 시도합니다...")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Master Sommelier. Your task is to correct any typos or abbreviations in wine names to their official, standard names (preferably in English). If the name is already correct, return it as is. Output ONLY the corrected name."),
        ("user", "Wine Name to Correct: {query}")
    ])
    chain = prompt | llm.with_structured_output(QueryRefinement)
    try:
        res = await chain.ainvoke({"query": wine_name})
        return res.refined_query
    except Exception as e:
        print(f"Query Refinement Error for {wine_name}: {e}")
        return wine_name  # 실패 시 원본 반환

async def search_wine_details(wine_names: List[str]) -> List[dict]:
    """
    결정론적 하이브리드 와인 검색 (Deterministic Hybrid Search)
    1. Fast-pass: 일괄 DB 검색
    2. Query Rewrite: 실패한 와인만 LLM으로 오타 교정
    3. Second-pass: 교정된 이름으로 DB 재검색 (최종 실패 시 이름만 반환)
    """
    final_results = []
    failed_wines = []

    # [1단계: 고속 DB 일괄 검색 (Fast-pass)]
    for name in wine_names:
        db_result = await fast_db_search(name)
        if db_result:
            final_results.append(db_result)
        else:
            failed_wines.append(name)

    # [2단계: 실패한 와인들 오타 교정 (LLM)]
    if failed_wines:
        print(f"🧐 {len(failed_wines)}개의 와인을 1차 검색에서 찾지 못했습니다. LLM 교정을 시작합니다: {failed_wines}")
        
        # 교정 작업을 병렬로 실행
        rewrite_tasks = [rewrite_wine_query(bad_name) for bad_name in failed_wines]
        refined_names = await asyncio.gather(*rewrite_tasks)
        
        # [3단계: 교정된 이름으로 2차 DB 검색]
        for original_name, refined_name in zip(failed_wines, refined_names):
            # 교정된 이름이 원본과 다르면 재검색
            if refined_name != original_name:
                second_try_result = await fast_db_search(refined_name)
                if second_try_result:
                    second_try_result["is_recovered"] = True
                    second_try_result["original_query"] = original_name
                    final_results.append(second_try_result)
                    continue
            
            # 2차 검색도 실패하거나 교정이 안 된 경우 (진짜 DB에 없는 와인)
            # DB 스펙은 포기하고, 이름만 넘겨서 메인 에이전트의 지식에 의존하게 함
            final_results.append({
                "name": refined_name, 
                "original_query": original_name,
                "db_found": False,
                "note": "DB 검색 실패, LLM 지식으로 추론 요망"
            })

    return final_results

async def extract_menu_data(ocr_text: str) -> dict:
    """Extract structured wine and food data from the menu text using LLM."""
    if not ocr_text:
        return {"wines": [], "foods": []}
    
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert OCR data extractor. Identify all wine names and food items from the provided menu text. Be precise and thorough."),
        ("user", "Menu Text:\n{input}")
    ])
    chain = prompt | llm.with_structured_output(MenuExtraction)
    
    try:
        result = await chain.ainvoke({"input": ocr_text})
        return {"wines": result.wine_names, "foods": result.food_names}
    except Exception as e:
        print(f"Menu Extraction Error: {e}")
        return {"wines": [], "foods": []}

# --- 4. Versatile System Prompts ---

REFINER_SYSTEM_PROMPT = """
You are a versatile Wine Intelligence Orchestrator. 
Analyze the input context and generate a RefinedInput object in JSON format.

[SCENARIO GUIDELINES]
1. General Chat: Greeting or general wine knowledge (e.g. "What is tannin?"). -> is_general_chat=True
2. Menu Analysis: If OCR text or wine list images are provided. -> needs_menu_analysis=True
3. Personal Recommendation: If user asks for their own taste. -> intent_query should reflect personal match.
4. Group Recommendation: Focus on group consensus if multiple people are implied.
5. Prioritize accuracy and structure in your analysis.
"""

ENGINE_SYSTEM_PROMPT = """
You are a Master Sommelier with expertise in pairing and social coordination.
Provide a structured, professional response in KOREAN using the provided Context Data.

[ADAPTIVE RESPONSE GUIDELINES]
- No specific data: Be an educator. Answer general questions concisely.
- User preference only: Be a personal consultant, focusing on their unique taste profile.
- Menu available: Be a pairing specialist. Match wine to food items using flavor harmony rules.
- Multiple people: Be a mediator. Find the best consensus for everyone, explaining the balance.
- Always be polite and professional in Korean.
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
            "ocr": (state["raw_ocr"][:100] + "...") if state.get("raw_ocr") else "None"
        })
        return {"refined": result}
    except Exception as e:
        print(f"Refinement Error: {e}")
        return {"refined": None}

async def gather_context_node(state: AgentState):
    """
    [데이터 수집 노드] 
    사용자의 취향과 친구들의 취향, 그리고 메뉴판에서 추출된 정보를 통합합니다.
    """
    print("--- [NODE: gather_context] ---")
    
    refined = state.get("refined")
    user_id = state.get("user_id")
    raw_ocr = state.get("raw_ocr")
    
    # [추가/변경됨] 프론트엔드에서 전달된 친구 목록 추출
    mentioned_friends = state.get("mentioned_friends") or []

    async def _empty_dict(): return {}
    async def _empty_list(): return []
    async def _empty_menu(): return {"wines": [], "foods": []}

    # 1. 병렬 데이터 수집 (사용자 취향, 명시된 친구 취향, 메뉴 분석)
    user_task = fetch_user_preference(user_id) if user_id else _empty_dict()
    friend_task = fetch_friend_preferences(mentioned_friends) if mentioned_friends else _empty_list()
    menu_task = extract_menu_data(raw_ocr) if refined and refined.needs_menu_analysis else _empty_menu()

    user_pref, friend_prefs, extracted_menu = await asyncio.gather(user_task, friend_task, menu_task)

    # 2. 메뉴 분석 결과가 있으면 와인 상세 정보 검색 (순차 실행 필요)
    wine_details = []
    if extracted_menu.get("wines"):
        wine_details = await search_wine_details(extracted_menu["wines"])

    return {
        "user_preference": user_pref,
        "friends_preferences": friend_prefs,
        "extracted_menu": extracted_menu,
        "wine_details": wine_details
    }

async def generate_final_response_node(state: AgentState):
    """[최종 응답 생성 노드] 수집된 모든 데이터를 종합하여 소믈리에 리포트를 생성합니다."""
    print("--- [NODE: generate_final_response] ---")
    llm = get_llm()
    
    refined = state.get("refined")
    instruction = refined.intent_query if refined else state.get("raw_input")
    
    # XML 태그를 활용한 명확한 컨텍스트 주입 (환각 방지)
    context_str = f"""
<UserPreference>
{state.get('user_preference', 'None')}
</UserPreference>

<FriendPreferences>
{state.get('friends_preferences', 'None')}
</FriendPreferences>

<MenuWines>
{state.get('wine_details', 'None')}
</MenuWines>

<MenuFoods>
{state.get('extracted_menu', {}).get('foods', 'None')}
</MenuFoods>
"""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", ENGINE_SYSTEM_PROMPT),
        ("user", "Instruction: {instruction}\n\nContext Data:\n{data}")
    ])
    
    chain = prompt | llm.with_structured_output(FinalSommelierResponse)
    
    try:
        result = await chain.ainvoke({
            "instruction": instruction,
            "data": context_str
        })
        return {"final_output": result}
    except Exception as e:
        print(f"Final Engine Error: {e}")
        return {"final_output": FinalSommelierResponse(
            main_message="분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            suggested_next_steps=[]
        )}

async def chat_node(state: AgentState):
    """[일반 대화 노드] 일반적인 와인 질문이나 인사에 응답합니다."""
    print("--- [NODE: chat] ---")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a friendly and professional Master Sommelier. Answer general wine questions concisely in KOREAN."),
        ("user", "{input}")
    ])
    chain = prompt | llm.with_structured_output(FinalSommelierResponse)
    try:
        result = await chain.ainvoke({"input": state["raw_input"]})
        return {"final_output": result}
    except Exception as e:
        print(f"Chat Node Error: {e}")
        return {"final_output": FinalSommelierResponse(
            main_message="안녕하세요! 와인에 대해 무엇이든 물어보세요.",
            suggested_next_steps=["와인 추천받기", "푸드 페어링 질문하기"]
        )}

# --- 6. Dynamic Routing & Build ---

def route_after_refine(state: AgentState):
    """정제된 의도에 따라 실행할 노드 리스트를 결정합니다."""
    refined = state.get("refined")
    if not refined or refined.is_general_chat:
        return "chat"
    return "gather_context"

def build_sommelier_graph():
    """병렬 처리와 지능형 분기를 포함한 안전한 소믈리에 그래프를 빌드합니다."""
    workflow = StateGraph(AgentState)
    
    # 노드 등록
    workflow.add_node("refine", refine_input_node)
    workflow.add_node("gather_context", gather_context_node)
    workflow.add_node("generate_final_response", generate_final_response_node)
    workflow.add_node("chat", chat_node)

    workflow.set_entry_point("refine")
    
    # 동적 분기 설정 (Split)
    workflow.add_conditional_edges("refine", route_after_refine, {
        "gather_context": "gather_context",
        "chat": "chat"
    })
    
    # 선형 흐름 및 종료 연결
    workflow.add_edge("gather_context", "generate_final_response")
    workflow.add_edge("generate_final_response", END)
    workflow.add_edge("chat", END)

    return workflow.compile()

sommelier_agent = build_sommelier_graph()