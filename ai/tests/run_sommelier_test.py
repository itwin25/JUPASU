import asyncio
import os
from services.sommelier.sommelier_agent import sommelier_agent

async def run_test():
    """
    실제 Gemini에 연결하여 AI 소믈리에 에이전트의 워크플로우를 테스트합니다.
    gather_context_node는 현재 하드코딩된 테스트 데이터를 반환하도록 설정되어 있습니다.
    """
    
    # 1. 테스트용 입력 데이터 구성
    # 사용자: Heavy Red 선호
    # 지훈: Crisp White 선호
    # 민수: Sparkling 선호
    # 메뉴판: Chateau Margaux, Cloudy Bay, Moet & Chandon 등 존재 (하드코딩 데이터 기반)
    input_state = {
        "raw_input": "오늘 지훈이랑 민수랑 같이 식사 중이야. 우리 셋의 취향을 모두 고려해서 지금 메뉴판에 있는 와인 중에 가장 어울리는 걸로 추천해줘.",
        "user_id": "tester_01",
        "mentioned_friends": [
            {"fname": "지훈", "fid": "friend_jh_001"},
            {"fname": "민수", "fid": "friend_ms_002"}
        ],
        "raw_ocr": "이미 gather_context에서 고정 데이터를 반환하므로 생략 가능"
    }

    print("\n" + "="*60)
    print("🍷 Jupasu AI 소믈리에 통합 테스트 시작 (Gemini 연동)")
    print("="*60)
    print(f"💬 질문: {input_state['raw_input']}")
    print("-" * 60)

    try:
        # 2. LangGraph 에이전트 실행
        # (refine -> gather_context(mock) -> generate_final_response 순서로 진행됨)
        final_state = await sommelier_agent.ainvoke(input_state)

        # 3. 결과 파싱 및 출력
        output = final_state.get("final_output")
        
        if output:
            print(f"\n[최종 응답 메시지]\n{output.main_message}")
            
            if output.recommendations:
                print(f"\n[와인 추천 리스트]")
                for i, rec in enumerate(output.recommendations, 1):
                    print(f"{i}. {rec.name} (적합도: {rec.match_score}%)")
                    print(f"   ㄴ 추천 이유: {rec.reason}")
            
            if output.food_pairing_notes:
                print(f"\n[푸드 페어링 노트]\n{output.food_pairing_notes}")
                
            if output.analysis_context:
                print(f"\n[분석 컨텍스트]\n{output.analysis_context}")

            if output.suggested_next_steps:
                print(f"\n[추천 다음 질문]")
                for step in output.suggested_next_steps:
                    print(f"- {step}")
        else:
            print("\n❌ 에러: 최종 응답 객체(final_output)를 찾을 수 None")

    except Exception as e:
        print(f"\n❌ 테스트 도중 오류 발생: {e}")
    
    print("\n" + "="*60)
    print("테스트 종료")
    print("="*60)

if __name__ == "__main__":
    # 비동기 루프 실행
    asyncio.run(run_test())
