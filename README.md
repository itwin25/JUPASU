# 주(酒)파수

실패 없는 한 병을 위한 개인화 와인 추천 가이드

---

## 1. 프로젝트 개요

### 1.1. 프로젝트 개요

본 프로젝트는 와인 입문자와 라이트 구매자가 복잡한 정보 탐색 없이도 자신의 취향과 상황에 맞는 와인을 쉽고 빠르게 선택할 수 있도록 돕는 맞춤형 와인 추천 서비스입니다.

와인 구매 과정에서 사용자는 어려운 라벨, 전문 용어, 방대한 선택지, 가격과 구매처 비교, 음식과의 조합 문제까지 한 번에 마주하게 됩니다. 주(酒)파수는 이러한 문제를 개인화 추천, 쉬운 용어 설명, 음식 기반 추천, 메뉴판 스캔, AI 소믈리에 기능으로 풀어내어 와인 선택 경험을 더 직관적이고 부담 없는 서비스 경험으로 전환합니다.

### 1.2. 프로젝트 목표

- 사용자가 본인 취향과 상황에 맞는 와인을 빠르게 찾을 수 있도록 지원합니다.
- 와인 탐색 과정에서 발생하는 정보 해석 부담과 선택 피로를 최소화합니다.
- 추천, 검색, 스캔, AI 기능을 통해 와인 구매의 진입 장벽을 낮춥니다.
- 와인을 "어렵고 복잡한 취향 상품"이 아니라 일상적으로 활용 가능한 선택 경험으로 전환합니다.

### 1.3. 주요 기능

#### 1.3.1. 맞춤 와인 추천

사용자의 취향 정보, 리뷰 기록, 선호 가격대, 상황 정보를 바탕으로 매칭률이 높은 와인을 추천합니다.

#### 1.3.2. 와인 정보 상세 제공

와인 타입, 맛 프로필, 가격, 평점, 페어링 음식, 추천 이유 등 핵심 정보를 한눈에 확인할 수 있는 상세 페이지를 제공합니다.

#### 1.3.3. 쉬운 용어 설명 및 취향 해석

타닌, 산도, 바디감과 같은 와인 용어를 보다 직관적으로 이해할 수 있도록 정리하고, 사용자의 취향 데이터를 기반으로 취향 리포트를 제공합니다.

#### 1.3.4. AI 소믈리에 추천

사용자는 AI에게 자연어로 와인을 추천받을 수 있으며, 음식이나 상황, 친구와의 조합을 함께 고려한 추천도 받을 수 있습니다.

#### 1.3.5. 메뉴판 스캔 기반 페어 추천

메뉴판을 스캔하면 메뉴판에 포함된 음식과 와인 정보를 OCR로 추출하고, 이를 사용자의 취향 정보와 함께 분석하여 가장 어울리는 음식-와인 한 쌍의 페어를 추천합니다.

#### 1.3.6. 음식 기반 페어링 추천

사용자가 음식이나 메뉴를 입력하면 해당 음식과 잘 어울리는 와인을 추천하고, 추천 이유까지 함께 제공합니다.

#### 1.3.7. 스캔 기반 탐색

와인 라벨 이미지를 업로드하여 OCR 기반으로 와인을 탐색하고, 검색 결과와 상세 정보로 연결할 수 있습니다.

#### 1.3.8. 마이페이지 및 기록 관리

스크랩한 와인, 작성한 리뷰, 취향 정보, 친구 정보 등을 관리할 수 있으며, 이를 바탕으로 추천 품질을 점진적으로 고도화합니다.

---

## 2. 서비스 기획 배경

### 1. 선택지는 많지만, 실패 없이 고르기는 어렵다

편의점, 대형마트, 와인 전문점, 온라인 주류몰 등 구매 채널은 다양해졌지만, 와인을 자주 마시지 않는 사용자에게는 오히려 선택지가 많아질수록 탐색 피로가 커집니다.

### 2. 전문 용어와 정보 해석 장벽

설문 결과에서도 타닌, 바디감, 오크향, 피니시, 빈티지 같은 용어를 어렵게 느끼는 응답이 반복적으로 나타났습니다. 많은 사용자가 라벨의 외국어와 설명을 읽고도 실제 맛을 상상하지 못했습니다.

### 3. 사용자가 가장 두려워하는 것은 '정보 부족'보다 '실패'

응답자들은 와인 구매 시 가장 피하고 싶은 상황으로 입맛이나 음식과 맞지 않는 선택, 즉 맛 실패와 상황 실패를 가장 많이 꼽았습니다. 이는 주(酒)파수가 단순 정보 서비스가 아니라 실패 가능성을 줄여주는 추천 서비스여야 한다는 점을 보여줍니다.

### 4. 실제 구매 맥락은 상황 중심이다

설문에서 주요 구매 상황은 기념일, 데이트, 집들이, 선물용, 혼술에 집중되었습니다. 따라서 사용자는 와인을 공부하기보다 "지금 이 상황에서 무난하고 만족도 높은 한 병"을 빠르게 알고 싶어합니다.

### 5. 라이트 구매층에게는 빠른 판단 도구가 필요하다

응답자의 다수는 20대 후반에서 30대 초반의 라이트 구매층이었고, 1년에 몇 번 구매하거나 거의 구매하지 않는 경우가 많았습니다. 이들에게 필요한 것은 전문가용 리뷰 아카이브가 아니라, 직관적인 추천과 쉬운 설명, 그리고 신뢰할 수 있는 선택 근거입니다.

---

## 3. 팀원 별 기여 사항

<table align="center" width="1000" cellpadding="0" cellspacing="0" border="0">
  <colgroup>
    <col width="333" />
    <col width="333" />
    <col width="334" />
  </colgroup>

  <!-- ================= BE ================= -->

  <tr>
    <td align="center"><b>정민선 (팀장 · FE · AI)</b></td>
    <td align="center"><b>김도희 (FE · BE · AI)</b></td>
    <td align="center"><b>박연준 (FE · BE)</b></td>
  </tr>

  <tr>
    <td align="center">
      <a href="https://github.com/hula32">
        <img src="https://github.com/hula32.png" width="150" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/9imDohee">
        <img src="https://github.com/9imDohee.png" width="150" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/QUWR">
        <img src="https://github.com/QUWR.png" 
        width="150" />
      </a>
    </td>
  </tr>

  <tr>
    <td align="center">
      프론트 화면 구조
      <br/>
      마이페이지/프로필
      <br/>
      챗봇 - 음식 기반 와인 추천
    </td>
    <td align="center">
      인증/회원가입(온보딩)
      <br/>
      챗봇 - 메뉴판 스캔
    </td>
    <td align="center">
      와인 상세/검색/리뷰
      <br/>
      와인 데이터 
    </td>
  </tr>

  <!-- spacer -->
  <tr><td colspan="3" height="32"></td></tr>

  <tr>
    <td align="center"><b>신종혁 (FE · BE · INFRA)</b></td>
    <td align="center"><b>이수인 (FE · BE · AI)</b></td>
    <td align="center"><b>최형선 (FE · BE · AI)</b></td>
  </tr>

  <tr>
    <td align="center">
      <a href="https://github.com/Rasit-NP">
        <img src="https://github.com/Rasit-NP.png" width="150" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/itwin25">
        <img src="https://github.com/itwin25.png" width="150" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ssafychs135">
        <img src="https://github.com/ssafychs135.png" width="150" />
      </a>
    </td>
  </tr>

  <tr>
    <td align="center">
    추천 알고리즘
    <br/>
    메인 홈 API 연동
    <br/>
    인프라
    </td>
    <td align="center">
    챗봇 - 친구와 나의 와인 추천 기능
    <br/>
    나의 취향 리포트
    </td>
    <td align="center">
    OCR
    <br/>
    AI 서버
    <br/>
    챗봇 전반
    <br/>
    와인 데이터 크롤링
    </td>
  </tr>

  <tr><td colspan="3" height="32"></td></tr>
</table>


## 4. 서비스 실행 방법

- 링크 : https://j14a505.p.ssafy.io/

    ※ 모바일 환경에 최적화된 웹 서비스입니다.

    ※ OCR 및 AI 관련 기능은 실행 환경에 따라 초기 로딩 시간이 있을 수 있습니다.

    ※ 일부 기능은 로컬 데이터 및 AI 서버 설정 상태에 따라 동작 방식이 달라질 수 있습니다.

---

## 5. 서비스 주요 기능 및 사용 방법

### 로그인/회원가입

![회원가입.png](https://shining-chess-951.notion.site/image/attachment%3A84844ea3-e7ee-4c8c-84d9-aa8b711ccc80%3A%E1%84%92%E1%85%AC%E1%84%8B%E1%85%AF%E1%86%AB%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%86%B8.png?table=block&id=332fc013-f8d0-80b2-9a00-f367fc4f4c4f&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=1410&userId=&cache=v2)

### 맞춤 와인 추천/ 상황별 추천

![상황별 추천.png](https://shining-chess-951.notion.site/image/attachment%3Ab91e8e7e-f542-4de4-9fcc-a8403441bee1%3A%E1%84%89%E1%85%A1%E1%86%BC%E1%84%92%E1%85%AA%E1%86%BC%E1%84%87%E1%85%A7%E1%86%AF_%E1%84%8E%E1%85%AE%E1%84%8E%E1%85%A5%E1%86%AB.png?table=block&id=332fc013-f8d0-809b-849f-e39d1843f3e4&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=1410&userId=&cache=v2)

### OCR 와인 검색

![OCR 와인 스캔.png](https://shining-chess-951.notion.site/image/attachment%3Ae9b06967-87e6-496b-8f5a-80ea96d78e8e%3AOCR_%E1%84%8B%E1%85%AA%E1%84%8B%E1%85%B5%E1%86%AB_%E1%84%89%E1%85%B3%E1%84%8F%E1%85%A2%E1%86%AB_(1).png?table=block&id=332fc013-f8d0-80f3-b8e2-d2347d18a021&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=2000&userId=&cache=v2)

### 챗봇

![챗봇- 일반채팅, 음식 기반 와인 추천.png](https://shining-chess-951.notion.site/image/attachment%3A06eea617-13f9-4936-bf25-38212bc98156%3A%E1%84%8E%E1%85%A2%E1%86%BA%E1%84%87%E1%85%A9%E1%86%BA-_%E1%84%8B%E1%85%B5%E1%86%AF%E1%84%87%E1%85%A1%E1%86%AB%E1%84%8E%E1%85%A2%E1%84%90%E1%85%B5%E1%86%BC_%E1%84%8B%E1%85%B3%E1%86%B7%E1%84%89%E1%85%B5%E1%86%A8_%E1%84%80%E1%85%B5%E1%84%87%E1%85%A1%E1%86%AB_%E1%84%8B%E1%85%AA%E1%84%8B%E1%85%B5%E1%86%AB_%E1%84%8E%E1%85%AE%E1%84%8E%E1%85%A5%E1%86%AB.png?table=block&id=332fc013-f8d0-8029-88df-e9b7d556de58&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=1410&userId=&cache=v2)

![챗봇 - 친구 와인 추천, 메뉴판 스캔.png](https://shining-chess-951.notion.site/image/attachment%3A16b40744-3491-46d9-88bf-b59f6b1433fc%3A%E1%84%8E%E1%85%A2%E1%86%BA%E1%84%87%E1%85%A9%E1%86%BA_-_%E1%84%8E%E1%85%B5%E1%86%AB%E1%84%80%E1%85%AE_%E1%84%8B%E1%85%AA%E1%84%8B%E1%85%B5%E1%86%AB_%E1%84%8E%E1%85%AE%E1%84%8E%E1%85%A5%E1%86%AB_%E1%84%86%E1%85%A6%E1%84%82%E1%85%B2%E1%84%91%E1%85%A1%E1%86%AB_%E1%84%89%E1%85%B3%E1%84%8F%E1%85%A2%E1%86%AB_(1).png?table=block&id=332fc013-f8d0-809a-bdab-f706d672e2b0&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=2000&userId=&cache=v2)

### 와인검색 및 상세 페이지

![와인 검색, 상세페이지.png](https://shining-chess-951.notion.site/image/attachment%3Ac4cf6550-8c7e-409b-932d-c8e5a12692d7%3A%E1%84%8B%E1%85%AA%E1%84%8B%E1%85%B5%E1%86%AB_%E1%84%80%E1%85%A5%E1%86%B7%E1%84%89%E1%85%A2%E1%86%A8_%E1%84%89%E1%85%A1%E1%86%BC%E1%84%89%E1%85%A6%E1%84%91%E1%85%A6%E1%84%8B%E1%85%B5%E1%84%8C%E1%85%B5_(1).png?table=block&id=332fc013-f8d0-808a-9e61-fa66d45fa37d&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=2000&userId=&cache=v2)

### 마이페이지

![마이페이지 - 1.png](https://shining-chess-951.notion.site/image/attachment%3A3b3fb3b5-c07e-4ab4-a2b6-7cbb69614c2e%3A%E1%84%86%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%91%E1%85%A6%E1%84%8B%E1%85%B5%E1%84%8C%E1%85%B5_-_1.png?table=block&id=332fc013-f8d0-809f-a006-faefab279608&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=2000&userId=&cache=v2)

![마이페이지 - 2.png](https://shining-chess-951.notion.site/image/attachment%3Adb67c0f4-1191-461b-a93c-7fe6f6cee5cc%3A%E1%84%86%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%91%E1%85%A6%E1%84%8B%E1%85%B5%E1%84%8C%E1%85%B5_-_2.png?table=block&id=332fc013-f8d0-8056-a8f6-e163f1898312&spaceId=ad9fc013-f8d0-81c5-89f7-000376158492&width=2000&userId=&cache=v2)
---

## 6. 영상 포트폴리오
[주파수 영상 포트폴리오](@/14기_특화PJT_영상%20포트폴리오_A505.mp4)

## 7. 설문 기반 핵심 인사이트

프로젝트 기획 과정에서 진행한 설문 결과, 다음과 같은 핵심 인사이트를 확인했습니다.

- 주요 사용자층은 20대 후반에서 30대 초반의 라이트 와인 구매층이었습니다.
- 구매 상황은 기념일, 데이트, 선물, 집들이, 혼술 중심으로 나타났습니다.
- 가장 큰 어려움은 취향 매칭의 불확실성과 정보 해석의 어려움이었습니다.
- 와인 구매 시 가장 피하고 싶은 상황은 맛 실패와 상황 실패였습니다.
- 타닌, 바디감, 산도, 오크향, 피니시, 빈티지 같은 용어에서 이해 장벽이 크게 나타났습니다.
- 선호 기능으로는 실패 제로 추천, 푸드 페어링, 쉬운 용어 번역, 주변 재고 확인, 최저가 비교가 반복적으로 나타났습니다.

이러한 인사이트를 바탕으로 주(酒)파수는 "많은 정보를 주는 서비스"보다 "실패 없이 고르게 돕는 서비스"를 목표로 설계되었습니다.

---

## 8. 프로젝트 구조

```text
S14P21A505/
├─ front/        # Next.js 프론트엔드
├─ back/         # Spring Boot 백엔드
├─ ai/           # FastAPI AI 서버
├─ nginx/        # Reverse proxy 설정
├─ data/         # 데이터 및 리소스
├─ docker-compose.local.yml
└─ README.md
```

---

## 8. 한 줄 소개

주(酒)파수는 와인을 잘 아는 사람보다, 와인을 잘 모르지만 필요한 순간에 실패 없이 한 병을 고르고 싶은 사람을 위한 서비스입니다.
