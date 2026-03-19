from typing import List, TypedDict, Optional, Any
import json
import asyncio
import numpy as np
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm.factory import get_llm

# --- 1. 스키마 정의 ---

class WineRecommendation(BaseModel):
    name: str
    reason: str
    match_score: int # 음식과의 유사도 점수 반영

class FinalSommelierResponse(BaseModel):
    main_message: str
    recommendations: Optional[List[WineRecommendation]] = Field(default=None)
    suggested_next_steps: List[str] = Field(default=[])

# --- 2. Agent State ---

class AgentState(TypedDict):
    raw_input: str
    user_id: str
    mentioned_friends: Optional[List[dict]]
    selected_wine: Optional[dict] 
    selected_menu: Optional[dict] 
    
    user_preference: Optional[dict]
    friends_preferences: List[dict]
    wine_details: List[dict]      # DB에서 가져온 와인 정보 (pairing 리스트 포함)
    food_names: List[str]         # 메뉴판에서 확정된 음식 이름들
    
    # [핵심] 임베딩 매칭 결과
    pairing_analysis: List[dict]  # 어떤 음식과 어떤 와인이 매칭되었는지 결과
    
    final_output: Optional[FinalSommelierResponse]

# --- 3. 가상 임베딩 매칭 함수 (Semantic Matcher) ---

async def get_embedding(text: str) -> List[float]:
    """[TODO] 실제 임베딩 모델(OpenAI, HuggingFace 등) 호출"""
    # 현재는 목업 데이터 반환
    return [0.1] * 128 

def calculate_similarity(v1, v2):
    """코사인 유사도 계산"""
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

async def match_food_and_wine(foods: List[str], wines: List[dict]) -> List[dict]:
    """
    [핵심 로직] 메뉴판 음식과 와인의 DB 페어링 정보를 임베딩으로 매칭합니다.
    """
    matches = []
    for wine in wines:
        wine_pairings = wine.get("pairings", []) # DB에 저장된 ["육류", "치즈"] 등
        best_score = 0
        best_food = ""
        
        for food in foods:
            # 실무에서는 모든 조합을 임베딩 비교하거나, 
            # LLM에게 "삼겹살과 육류가 의미적으로 같은 카테고리인가?"를 물어볼 수 있습니다.
            # 여기서는 임베딩 유사도가 높다고 가정하고 로직을 구성합니다.
            score = 85 if "삼겹살" in food and "육류" in wine_pairings else 50
            if score > best_score:
                best_score = score
                best_food = food
        
        if best_score > 70:
            matches.append({
                "wine_name": wine["name"],
                "matched_food": best_food,
                "score": best_score
            })
    return matches

# --- 4. Graph 노드 구현 ---

async def gather_context_node(state: AgentState):
    print("--- [NODE: gather_context] ---")
    
    # 1. DB에서 와인 상세 정보와 페어링 키워드 가져오기
    # (실제로는 Spring에서 전달받거나 직접 DB 조회)
    wine_details = [
        {"name": "샤또 마고", "pairings": ["소고기", "육류", "그릴"], "body": 5},
        {"name": "클라우디 베이", "pairings": ["해산물", "샐러드", "치즈"], "body": 2}
    ]
    
    food_names = state.get("selected_menu", {}).get("food_names", [])
    
    # 2. 임베딩/의미론적 매칭 수행
    pairing_results = await match_food_and_wine(food_names, wine_details)
    
    return {
        "wine_details": wine_details,
        "food_names": food_names,
        "pairing_analysis": pairing_results,
        "user_preference": {"style": "Heavy Red"},
        "friends_preferences": []
    }

async def generate_final_response_node(state: AgentState):
    print("--- [NODE: generate_response] ---")
    llm = get_llm()
    
    # 임베딩 매칭 결과를 프롬프트에 주입
    pairing_context = json.dumps(state["pairing_analysis"], ensure_ascii=False)
    
    system_instruction = f"""
당신은 마스터 소믈리에입니다. 
우리 DB의 페어링 데이터와 사용자의 메뉴판 음식을 임베딩 분석한 결과는 다음과 같습니다:
{pairing_context}

[지시사항]
1. 사용자가 고른 음식과 DB상 궁합이 가장 좋은 와인을 우선적으로 추천하세요.
2. 단순히 이름만 나열하지 말고, "삼겹살(돼지고기)과 이 레드 와인의 탄닌이 잘 어우러진다"는 식으로 구체적인 매칭 이유를 설명하세요.
3. 사용자의 평소 취향과의 적합성도 함께 언급하세요.
"""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("user", "{input}")
    ])
    
    chain = prompt | llm.with_structured_output(FinalSommelierResponse)
    res = await chain.ainvoke({"input": state["raw_input"]})
    return {"final_output": res}

# --- 5. Graph Build ---

def build_sommelier_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("gather_context", gather_context_node)
    workflow.add_node("generate_response", generate_final_response_node)
    
    workflow.set_entry_point("gather_context")
    workflow.add_edge("gather_context", "generate_response")
    workflow.add_edge("generate_response", END)

    return workflow.compile()

sommelier_agent = build_sommelier_graph()
