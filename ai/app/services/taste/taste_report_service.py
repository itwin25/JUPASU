"""
취향 리포트 AI 요약 서비스
=========================
사용자의 맛 프로파일(당도/산도/바디/탄닌/알코올 평균)을 받아
LangChain 단순 체인으로 AI 텍스트를 생성합니다.

LangGraph는 사용하지 않습니다. (단순 1회 LLM 호출이므로 불필요)
"""
import re
from langchain_core.prompts import ChatPromptTemplate
from app.services.llm.factory import get_llm


def _make_profile_description(
    sweetness: float,
    acidity: float,
    body: float,
    tannin: float,
    alcohol: float,
) -> str:
    """수치를 사람이 읽기 쉬운 텍스트로 변환 (프롬프트에 주입)"""
    def level(v: float) -> str:
        if v < 1.5: return "매우 낮은"
        if v < 2.5: return "낮은"
        if v < 3.5: return "중간"
        if v < 4.2: return "높은"
        return "매우 높은"

    return (
        f"당도 {level(sweetness)}({sweetness:.1f}/5), "
        f"산도 {level(acidity)}({acidity:.1f}/5), "
        f"바디 {level(body)}({body:.1f}/5), "
        f"탄닌 {level(tannin)}({tannin:.1f}/5), "
        f"알코올 {level(alcohol)}({alcohol:.1f}도)"
    )


def _strip_markdown(text: str) -> str:
    """마크다운 서식 제거"""
    text = re.sub(r"[*#_`~>]{1,3}", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


_SYSTEM_PROMPT = """당신은 와인 소믈리에 어시스턴트입니다.
사용자의 와인 맛 프로파일을 보고 아래 JSON 형식으로만 응답하세요.
설명이나 마크다운 없이 순수 JSON만 출력하세요.

출력 형식:
{{
  "mainTitle": "닉네임님은 '취향 유형명' 와인 취향이에요!",
  "tasteTypeTag": "취향 유형명 (최대 8자)",
  "content": "취향 요약 2문장. 어떤 맛을 선호하는지 자연스럽게 설명.",
  "bestDescription": "이 취향에 딱 맞는 와인 스타일이나 품종을 추천하는 문장.",
  "worstDescription": "이 취향에 맞지 않을 수 있는 와인 스타일이나 품종을 안내하는 문장."
}}

[규칙]
- mainTitle에는 반드시 닉네임을 포함하세요.
- tasteTypeTag 예시: 과일향 러버, 드라이 선호, 밸런스형, 가벼운 취향, 풀바디 마니아
- content는 2문장 이내, 구체적인 수치 언급 금지, 자연스러운 한국어.
- bestDescription/worstDescription은 1문장, 구체적인 와인 스타일 언급.
- JSON 외 다른 텍스트 절대 출력 금지."""


async def generate_taste_report_summary(
    nickname: str,
    avg_sweetness: float,
    avg_acidity: float,
    avg_body: float,
    avg_tannin: float,
    avg_alcohol: float,
) -> dict:
    """
    취향 수치를 받아 AI가 생성한 텍스트 딕셔너리를 반환합니다.
    반환 키: mainTitle, tasteTypeTag, content, bestDescription, worstDescription
    """
    llm = get_llm()

    profile_desc = _make_profile_description(
        avg_sweetness, avg_acidity, avg_body, avg_tannin, avg_alcohol
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("user", "닉네임: {nickname}\n맛 프로파일: {profile}")
    ])

    chain = prompt | llm
    result = await chain.ainvoke({"nickname": nickname, "profile": profile_desc})

    raw = result.content.strip()

    # JSON 블록만 추출 (```json ... ``` 감싸진 경우 대응)
    json_match = re.search(r"\{[\s\S]+\}", raw)
    if not json_match:
        return _fallback_response(nickname, avg_sweetness, avg_acidity)

    import json
    try:
        parsed = json.loads(json_match.group(0))
    except json.JSONDecodeError:
        return _fallback_response(nickname, avg_sweetness, avg_acidity)

    # 각 필드 마크다운 정제
    return {
        "mainTitle":        _strip_markdown(parsed.get("mainTitle", f"{nickname}님의 와인 취향이에요!")),
        "tasteTypeTag":     _strip_markdown(parsed.get("tasteTypeTag", "밸런스형")),
        "content":          _strip_markdown(parsed.get("content", "")),
        "bestDescription":  _strip_markdown(parsed.get("bestDescription", "")),
        "worstDescription": _strip_markdown(parsed.get("worstDescription", "")),
    }


def _fallback_response(nickname: str, sweetness: float, acidity: float) -> dict:
    """LLM 파싱 실패 시 사용할 기본값"""
    return {
        "mainTitle": f"{nickname}님의 와인 취향이에요!",
        "tasteTypeTag": "밸런스형",
        "content": f"달콤함과 산뜻함이 균형 잡힌 와인을 즐기시는 편이에요.",
        "bestDescription": "균형 잡힌 미디엄 바디 와인을 추천해 드려요!",
        "worstDescription": "너무 무겁거나 탄닌이 강한 와인은 다소 부담스러우실 수 있어요.",
    }
