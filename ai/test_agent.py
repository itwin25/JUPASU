import asyncio
import sys

# Windows에서 ProactorEventLoop 관련 에러 방지용
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.services.chat.sommelier_agent import sommelier_agent

def run_test():
    test_query = "친구들이랑 마실 로제 와인 추천해줘. 너무 달지 않았으면 좋겠어"
    print(f"🔍 [테스트 시작] 질문: {test_query}\n")
    print("⏳ AI 소믈리에가 답변을 생성 중입니다... (RAG + LLM)\n")
    
    # sommelier_agent graph에 들어갈 state
    input_state = {
        "raw_input": test_query,
        "user_id": 1,
        "mentioned_friends": [{"id": 2}, {"id": 3}]
    }

    try:
        # LangGraph 실행 (chat_node가 async이므로 ainvoke 사용)
        result = asyncio.run(sommelier_agent.ainvoke(input_state))
        
        final_output = result.get("final_output")
        if not final_output:
            print("❌ 에이전트 응답을 받지 못했습니다.")
            return
            
        print("\n==================================")
        print("🗣️ 챗봇 대답 (main_message):")
        print(f"\"{final_output.main_message}\"")
        print("==================================\n")
        
        if final_output.recommendations:
            print("🍷 프론트엔드로 전달될 와인 데이터 (JSON 배열):")
            for i, rec in enumerate(final_output.recommendations, 1):
                print(f"[{i}] wine_id:    {rec.wine_id}")
                print(f"    name:       {rec.name}")
                print(f"    image_url:  {rec.image_url}")
                print(f"    match:      {rec.match_score}%")
                print(f"    reason:     {rec.reason}")
        else:
            print("⚠️ 추천된 와인 데이터가 없습니다.")
            
    except Exception as e:
        print(f"에러 발생: {e}")

if __name__ == "__main__":
    run_test()
