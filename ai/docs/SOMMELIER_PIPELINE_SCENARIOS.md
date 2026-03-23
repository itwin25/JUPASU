# AI 소믈리에 에이전트 파이프라인 시나리오 명세서

본 문서는 `sommelier_agent.py`에 구현된 LangGraph 기반 AI 소믈리에 에이전트가 사용자 입력과 컨텍스트(메뉴판, 동석자 등)에 따라 동적으로 라우팅되는 **5가지 주요 LLM 파이프라인 시나리오**를 정리한 문서입니다.

에이전트는 항상 `refine_input_node`에서 시작하여 사용자의 의도를 구조화(`RefinedInput`)한 뒤, 그 결과에 따라 필요한 데이터를 병렬로 수집(Fan-out)하고 종합(Fan-in)하여 응답을 생성합니다.

---

## 1. 단순 대화 및 와인 상식 (General Chat)
가장 가볍고 빠른 파이프라인으로, 와인 추천이 아닌 단순한 질문이나 인사에 대응합니다.

* **진입 조건**: 사용자의 질문이 와인 지식, 인사 등 일반적인 대화인 경우 (`is_general_chat: True`)
* **파이프라인 흐름**: 
  1. `refine_input_node` (의도 파악)
  2. ➡️ `chat_node` (일반 대화 응답 생성) ➡️ **[종료]**
* **특징**: 무거운 취향 DB 조회나 메뉴 분석 없이 빠르고 가볍게 LLM을 호출하여 챗봇처럼 답변합니다.

---

## 2. 개인 맞춤형 와인 추천 (Personal Recommendation)
사용자가 오직 **자신의 취향**에 맞는 와인 추천을 요구할 때의 기본 추천 흐름입니다.

* **진입 조건**: 동석자 언급 및 메뉴판(OCR) 제공 없이 본인을 위한 추천을 요청한 경우 (`friend_ids: []`, `needs_menu_analysis: False`)
* **파이프라인 흐름**: 
  1. `refine_input_node` (의도 파악)
  2. ➡️ `gather_context_node` (DB에서 **사용자 본인의 취향만** 조회)
  3. ➡️ `generate_final_response_node` (개인 취향 기반 최종 추천) ➡️ **[종료]**
* **특징**: 수집된 개인의 와인 취향(예: Heavy Red, Bold & Tannic) 데이터만 프롬프트에 주입하여 개인화된 컨설팅 결과를 반환합니다. (Personal Consultant 역할)

---

## 3. 일행 동석 맞춤형 추천 (Group Consensus Recommendation)
사용자뿐만 아니라 **함께 있는 친구나 일행의 취향**을 모두 고려하여 와인을 골라야 할 때의 흐름입니다.

* **진입 조건**: 사용자의 발화에서 친구(일행)가 식별된 경우 (`friend_ids` 존재)
* **파이프라인 흐름**: 
  1. `refine_input_node` (의도 및 동석자 ID 파악)
  2. ➡️ `gather_context_node` (DB에서 **사용자 취향**과 **일행들의 취향**을 병렬로 동시 조회)
  3. ➡️ `generate_final_response_node` (그룹 조율 추천) ➡️ **[종료]**
* **특징**: LLM이 '중재자(Mediator)' 역할을 수행하여, 서로 다른 취향을 가진 일행 모두가 만족할 만한 타협점이나 페어링 전략을 제시합니다.

---

## 4. 메뉴판 기반 푸드 페어링 (Menu Analysis & Pairing)
**메뉴판 이미지(OCR 텍스트)가 제공**되었을 때 동작하는 고도화된 추천 흐름입니다.

* **진입 조건**: 사용자가 메뉴판 사진을 제공하고 추천을 요구할 때 (`needs_menu_analysis: True` 및 `raw_ocr` 데이터 존재)
* **파이프라인 흐름**: 
  1. `refine_input_node` (의도 파악 및 메뉴 분석 필요성 감지)
  2. ➡️ `gather_context_node` 
     * (병렬 수집) 사용자 취향 조회 + **OCR 텍스트 내 와인/음식 이름 LLM 추출 (`extract_menu_data`)**
     * (순차 조회) 추출된 와인 이름 기반으로 와인 상세 스펙 DB 검색 (`search_wine_details`)
  3. ➡️ `generate_final_response_node` (메뉴 페어링 기반 최종 추천) ➡️ **[종료]**
* **특징**: 이 파이프라인에서는 LLM이 **총 3번 호출**됩니다(의도 파악 ➡️ 구조화 추출 ➡️ 최종 응답). 수집된 취향 데이터, 실제 음식 목록, 메뉴판 내 와인들의 스펙을 바탕으로 정교한 음식+와인 페어링 리포트를 생성합니다. (Pairing Specialist 역할)

---

## 5. 종합 추천: 일행 동석 + 메뉴판 페어링 (The Ultimate Scenario)
에이전트가 수행할 수 있는 가장 복잡하고 완전한 형태의 파이프라인으로, 일행의 취향과 현장의 메뉴판을 모두 종합하여 최적의 선택을 내립니다.

* **진입 조건**: 친구(일행)를 언급하며 동시에 메뉴판 이미지/텍스트를 제공한 경우 (`friend_ids` 존재 + `needs_menu_analysis: True`)
* **파이프라인 흐름**:
  1. `refine_input_node` (의도, 동석자 ID, 메뉴 분석 필요성 동시 파악)
  2. ➡️ `gather_context_node` (3-Way 병렬 처리의 극대화)
     * (병렬 1) DB에서 내 취향 조회
     * (병렬 2) DB에서 일행들의 취향 동시 조회
     * (병렬 3) LLM을 호출하여 OCR 텍스트에서 와인과 음식 이름 추출
     * (순차 조회) 메뉴에서 추출된 와인들로 와인 상세 스펙 DB 검색
  3. ➡️ `generate_final_response_node` (최고 난이도 추천 생성) ➡️ **[종료]**
* **특징**: `<UserPreference>`, `<FriendPreferences>`, `<MenuWines>`, `<MenuFoods>` 4가지 컨텍스트가 모두 채워져 LLM에 주입됩니다. LLM은 '중재자'와 '페어링 전문가' 역할을 동시에 수행하여 일행 간의 취향 타협과 음식 페어링을 완벽하게 조율합니다.

---

## 요약 (LLM 호출 최적화 구조)
이 에이전트는 조건문(`if/else`)으로 단일 경로를 강제하는 것이 아니라, `RefinedInput` 스키마의 속성 값에 따라 **필요한 데이터 수집 태스크를 조립하여 한 번에 병렬 실행(Fan-out)하고 다시 모으는(Fan-in)** 매우 유연한 LangGraph 아키텍처를 자랑합니다.
