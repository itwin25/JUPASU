# 일반 채팅 응답 누락 해결 및 스트리밍 최적화 계획

## 1. 문제 진단
- **현상**: 메뉴판 스캔 추천은 작동하지만, 일반적인 대화 입력 시 프론트엔드에 응답이 표시되지 않음.
- **원인**: `sommelier_agent.py`의 `chat_node`가 LLM 스트리밍 이벤트를 상위 레벨인 `endpoints.py`의 `astream_events`로 전달하지 못함. 노드 함수가 고립된 상태에서 실행되어 내부 콜백이 외부와 연결되지 않음.

## 2. 해결 전략
- **RunnableConfig 전달**: LangGraph 노드 함수에 `config: RunnableConfig` 인자를 추가하고, 이를 내부 `chain.ainvoke(..., config=config)`에 전달합니다. 이렇게 하면 LangChain이 내부 LLM 이벤트를 상위 호출자에게 자동으로 전파합니다.
- **방어적 데이터 추출**: `endpoints.py`에서 스트림 조각을 추출할 때 다양한 데이터 구조에 대응할 수 있도록 로직을 개선합니다.

## 3. 상세 수정 계획

### Step 1: `ai/app/services/chat/sommelier_agent.py` 수정
- `from langchain_core.runnables import RunnableConfig` 임포트 추가.
- `chat_node` 함수 시그니처를 `async def chat_node(state: AgentState, config: RunnableConfig)`로 변경.
- LLM 체인 호출 시 `config` 객체 주입.

### Step 2: `ai/app/api/v1/endpoints.py` 확인 (필요시)
- `on_chat_model_stream` 이벤트 처리부의 데이터 추출 로직 검증.

## 4. 검증 시나리오
1. 일반 텍스트 입력 ("반가워") -> 실시간 스트리밍 응답 확인.
2. 메뉴판 스캔 트리거 -> 최종 분석 결과 정상 출력 확인.
3. 중복 응답 여부 체크.
