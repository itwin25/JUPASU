from typing import List, TypedDict, Optional, Any
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm.factory import get_llm

# --- 채팅 전용 응답 스키마 ---

class WineRecommendation(BaseModel):
    name: str
    reason: str
    match_score: int

class FinalSommelierResponse(BaseModel):
    main_message: str
    recommendations: Optional[List[WineRecommendation]] = Field(default=None)
    suggested_next_steps: List[str] = Field(default=[])

# --- Agent State ---

class AgentState(TypedDict):
    raw_input: str
    user_id: str
    mentioned_friends: Optional[List[dict]]
    selected_wine: Optional[dict] 
    selected_menu: Optional[dict] 
    final_output: Optional[FinalSommelierResponse]

# --- 노드 구현 ---

async def chat_node(state: AgentState):
    """실시간 스트리밍을 지원하는 소믈리에 채팅 노드"""
    llm = get_llm()
    
    system_instruction = """당신은 바쁜 와인바에서 손님과 짧고 간결하게 대화하는 '프로 소믈리에'입니다.

**⚠️ 경고 (반드시 지킬 것):**
1. **분량 제한**: 모든 답변은 한글 공백 포함 '100자 이내'로 끝내세요. 절대 두 문장을 넘기지 마세요.
2. **단답형 답변**: 부연 설명, 역사, 종류 나열 등을 모두 생략하고 사용자가 물어본 '핵심 정의'나 '추천 와인'만 바로 말하세요.
3. **채팅 모드**: 백과사전이 아닙니다. 카카오톡이나 문자 메시지를 보낸다고 생각하고 답변하세요.
4. **절대 금기**: '안녕하세요', '좋은 질문입니다' 같은 서론을 절대 쓰지 마세요. 바로 본론으로 들어가세요.

(예시)
질문: 바디감이 뭐야?
답변: 와인을 마셨을 때 입안에서 느껴지는 무게감이나 질감을 말해요. 우유와 물의 차이처럼 묵직함의 정도라고 생각하시면 됩니다."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("user", "{input}")
    ])
    
    chain = prompt | llm
    
    # 스트리밍 이벤트를 발생시키기 위해 astream을 루프로 돌리며 결과를 수집
    full_content = ""
    async for chunk in chain.astream({"input": state["raw_input"]}):
        full_content += chunk.content
    
    return {"final_output": FinalSommelierResponse(main_message=full_content)}

# --- Graph Build ---

def build_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)
    return workflow.compile()

sommelier_agent = build_chat_graph()
