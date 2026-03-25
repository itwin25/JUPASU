import re
from typing import List, TypedDict, Optional, Any
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm.factory import get_llm
from app.services.rag.chat_retrieval_service import perform_hybrid_recommendation

# --- 채팅 전용 응답 스키마 ---

class WineRecommendation(BaseModel):
    wine_id: int
    name: str
    image_url: str
    match_score: int
    reason: str

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

    # (핵심 로직 추가) 추천이 필요한 상황이라 가정하고 RAG 로직 호출
    # 실제 환경에서는 라우팅 노드를 두거나, state.raw_input 을 분석해서 추천 요청일 때만 실행
    friend_ids = []
    if state.get("mentioned_friends"):
        friend_ids = [f["id"] for f in state["mentioned_friends"]]
        
    recommended_wines = perform_hybrid_recommendation(
        user_id=state.get("user_id", "guest"),
        query=state["raw_input"],
        friend_ids=friend_ids
    )
    
    wine_context = ""
    wine_meta = None   # (w_id, w_name, w_img, w_match) — LLM 실행 후 reason과 함께 WineRecommendation 생성
    if recommended_wines:
        top_wine = recommended_wines[0]  # 오직 Top 1 와인만 선택
        
        # 백엔드 응답(camelCase)과 폴백(snake_case) 두 가지 모두 대응
        w_id = top_wine.get("wineId") or top_wine.get("wine_id", 0)
        w_name = top_wine.get("nameKr") or top_wine.get("name_kr", "이름 모름")
        w_match = top_wine.get("matchRate") or int(top_wine.get("similarity_score", 0) * 100)
        w_img = top_wine.get("imageUrl", "")
        w_style = top_wine.get("style") or top_wine.get("type", "")
        
        wine_context = f"다음은 유저의 질문과 상황에 가장 잘 맞는 단 하나의 완벽한 추천 와인입니다. 이 와인을 자연스럽게 추천해주세요:\n"
        wine_context += f"- 와인 이름: {w_name}\n- 스타일: {w_style}\n- 매칭률: {w_match}%\n"
        
        wine_meta = (w_id, w_name, w_img, w_match, w_style)
    
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
        ("user", "추천 와인 정보:\n{wine_context}\n\n질문:{input}")
    ])
    
    chain = prompt | llm
    
    # LLM 답변 생성 (스트리밍 수집)
    full_content = ""
    async for chunk in chain.astream({"input": state["raw_input"], "wine_context": wine_context}):
        full_content += chunk.content
    
    # LLM이 생성한 추천 이유 및 와인 카드 reason 생성
    recs = []
    if wine_meta:
        w_id, w_name, w_img, w_match, w_style = wine_meta
        
        # ① full_content의 두 번째 단락에서 와인 설명 부분을 추출
        # LLM이 "추천 문장 + \n\n + 와인 설명 문장" 패턴으로 생성함을 활용
        paragraphs = [p.strip() for p in full_content.split("\n\n") if p.strip()]
        # 두 번째 단락이 있으면 사용, 없으면 첫 단락 사용
        desc_raw = paragraphs[1] if len(paragraphs) > 1 else paragraphs[0] if paragraphs else full_content
        
        # 마크다운 서식 제거 (**, ##, *, 😊 등 이모지도 제거)
        clean = re.sub(r"[*#_`~>\-]{1,3}", "", desc_raw)
        clean = re.sub(r"[^\w\s가-힣.,!?%()~]", "", clean)  # 이모지 등 특수문자 제거
        clean = re.sub(r"\s+", " ", clean).strip()
        
        # 첫 한국어 문장 추출 (다. / 요. / 요! 으로 끝나는 패턴)
        m = re.search(r"[^.!?]*[다요]\s*[.!]", clean)
        reason_text = m.group(0).strip() if m else clean[:80].rstrip()
        
        # 80자 초과 시 강제 절단
        if len(reason_text) > 80:
            reason_text = reason_text[:78].rstrip() + "."
        
        recs.append(
            WineRecommendation(
                wine_id=w_id,
                name=w_name,
                image_url=w_img,
                match_score=w_match,
                reason=reason_text
            )
        )
    
    return {"final_output": FinalSommelierResponse(
        main_message=full_content,
        recommendations=recs if recs else None
    )}

# --- Graph Build ---

def build_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)
    return workflow.compile()

sommelier_agent = build_chat_graph()
