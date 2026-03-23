# NULL-aware 베이지안 교정 모델 — 수식 정의서

> **NULL-aware Bayesian Calibration Model**  
> 5가지 특성 NULL 처리 통합 · 베이지안 선호 교정 확장판

---

## 범례

| 표기 | 의미 |
|------|------|
| `[수정]` | 기존 수식에서 변경된 항목 |
| `[신규]` | 새로 추가된 개념 |
| `[동일]` | 변경 없음 |

---

## ① 전처리 — 유효성 지시 함수 및 정규화

### `[신규]` 특성 유효성 지시 함수

$$
\mathbb{1}_i =
\begin{cases}
1 & \text{if } W_i \text{ is not NULL} \\
0 & \text{if } W_i \text{ is NULL}
\end{cases}
\qquad i \in \{\text{sweetness, acidity, body, tannin, alc}\}
$$

> 5가지 특성 전체에 적용. NULL 차원은 이후 모든 연산에서 자동 제외.

---

### `[수정]` 유효 특성 개수 — 기존 4개 → 도수 포함 5개로 확장

$$
N_{\text{valid}} = \mathbb{1}_{\text{sweet}} + \mathbb{1}_{\text{acid}} + \mathbb{1}_{\text{body}} + \mathbb{1}_{\text{tannin}} + \mathbb{1}_{\text{alc}}
\qquad (0 \le N_{\text{valid}} \le 5)
$$

> 기존: 취향 4차원만 $N_{\text{valid}}$ 계산. 수정: 도수($\text{alc}$) 포함 5차원 통합 관리.

---

### `[동일]` 와인 특성값 정규화

$$
W'_i = \mathbb{1}_i \times W_i \times 2
\qquad i \in \{\text{sweetness, acidity, body, tannin}\}
$$

> 유효한 차원에만 적용. 사용자 취향 $U_i$는 0–10 원척도 그대로 사용.

---

## ② 취향·도수 통합 점수 $S_{\text{pref}}$

### `[수정]` 5차원 통합 — 차원별 σ̂_i 적용

$$
S_{\text{pref}} = \frac{1}{N_{\text{valid}}} \left(
  \sum_{i \in \text{valid\_taste}} \exp\!\left(-\frac{(\hat{U}_i - W'_i)^2}{2\hat{\sigma}_i^2}\right)
  + \mathbb{1}_{\text{alc}} \cdot \exp\!\left(-\frac{\bigl(\text{COALESCE}(U_{\text{alc}},\, T_{\text{alc}}) - W_{\text{alc}}\bigr)^2}{2\sigma_a^2}\right)
\right)
$$

$$
S_{\text{pref}} = 0 \qquad \text{if } N_{\text{valid}} = 0 \text{ (전체 NULL)}
$$

> **COALESCE**: 사용자 선호 도수 $U_{\text{alc}}$가 NULL이면 상황별 기본 도수 $T_{\text{alc}}$로 대체.

> **σ̂_i**: 단일 전역 σ̂_t 대신 차원별로 독립 계산된 취향 폭 (Step 4 참조).
> 예시: sweetness에 관대한 유저는 σ̂_sweet가 크고, tannin에 예민하면 σ̂_tannin이 작아짐.

---

## ③ 방향성 Half-Gaussian $H(x,\,\theta,\,\text{dir})$

### `[동일]` 유효한 차원에만 호출 — NULL 차원은 호출하지 않음

$$
H(x,\,\theta,\,\uparrow) =
\begin{cases}
1.0 & x \ge \theta \\
\exp\!\left(-\dfrac{(x-\theta)^2}{2\sigma_s^2}\right) & x < \theta
\end{cases}
\qquad
H(x,\,\theta,\,\downarrow) =
\begin{cases}
1.0 & x \le \theta \\
\exp\!\left(-\dfrac{(x-\theta)^2}{2\sigma_s^2}\right) & x > \theta
\end{cases}
$$

> $\sigma_s = 2.5$ 권장. 좋은 방향으로는 점수 하락 없음 — 나쁜 방향에만 정규분포적 감점.

---

## ④ 상황 적합도 점수 $S_{\text{sit}}$

### `[수정]` 유효 차원의 기하 평균으로 정규화

$$
S_{\text{sit}} = \left(\prod_{k \in \text{valid\_sit}} H(W'_k,\,\theta_k,\,\text{dir}_k)\right)^{\!1\,/\,|\text{valid\_sit}|}
\qquad
\left(S_{\text{sit}} = 0.5 \;\text{ if }\; |\text{valid\_sit}| = 0\right)
$$

> 기존: 차원별 고정 곱셈. 수정: 유효 차원만 포함해 기하 평균으로 정규화. NULL 차원 제외.

---

### `[수정]` 파티 — OR 합집합의 NULL 인식 버전

$$
S_{\text{sit}}^{\text{party}} =
\begin{cases}
1 - \displaystyle\prod_{k \in \text{valid\_sit}} \bigl(1 - H(W'_k,\,\theta_k,\,\uparrow)\bigr) & |\text{valid\_sit}| \ge 1 \\[6pt]
0.5 & |\text{valid\_sit}| = 0
\end{cases}
$$

> $P(A \cup B) = 1 - P(A^c) \cdot P(B^c)$ 적용. 당도·산도 중 하나만 충족해도 높은 점수.

---

### `[동일]` 상황별 유효 차원 집합 정의

$$
\text{valid\_sit} = \{k \in D_{\text{sit}} \mid \mathbb{1}_k = 1\}
\qquad
D_{\text{sit}} =
\begin{cases}
\{\text{body, tannin}\} & \text{혼술} \cdot \text{기념일} \\
\{\text{sweetness, acidity}\} & \text{파티}
\end{cases}
$$

| 상황 | 핵심 차원 | 방향 | 임계값 $\theta$ |
|------|-----------|------|----------------|
| 혼술 | body, tannin | $\downarrow$ | 6, 4 |
| 기념일 | body, tannin | $\uparrow$ | 6, 6 |
| 파티 | sweetness, acidity | $\uparrow$ | 6, 7 |

---

## ⑤ 비대칭 가격 점수 $S_{\text{price}}$

### `[수정]` 상황별 비대칭 Gaussian — 코드 구현 반영

$$
S_{\text{price}} = \exp\!\left(-\frac{(W_{\text{price}} - T_{\text{price}})^2}{2\sigma_{\text{dir}}^2}\right),
\qquad
\sigma_{\text{dir}} =
\begin{cases}
\sigma_{\text{low}} & W_{\text{price}} \le T_{\text{price}} \\
\sigma_{\text{high}} & W_{\text{price}} > T_{\text{price}}
\end{cases}
$$

| 상황 | $T_{\text{price}}$ | $\sigma_{\text{low}}$ (저가 방향) | $\sigma_{\text{high}}$ (고가 방향) |
|------|-------------------|----------------------------------|-----------------------------------|
| 혼술 | $U_{\min}$ | $0.8 \times U_{\min}$ | $0.2 \times U_{\min}$ |
| 기념일 | $1.1 \times U_{\max}$ | $0.25 \times U_{\max}$ | $0.2 \times T_{\text{price}}$ |
| 파티 | $(U_{\min} + U_{\max})\,/\,2$ | $0.4 \times T_{\text{price}}$ | $0.3 \times T_{\text{price}}$ |
| 상황 없음 | $(U_{\min} + U_{\max})\,/\,2$ | $\sigma_{\text{dir}} = 15{,}000$ | $\sigma_{\text{dir}} = 15{,}000$ |

> 혼술: 예산 초과에 강한 페널티(σ_high가 매우 작음), 저렴한 와인은 관대하게 허용.
> 기념일: 목표가를 최대 예산의 1.1배로 설정해 프리미엄 와인을 자연스럽게 유도.
> 상황 없음: 대칭 Gaussian(σ_dir = 15,000원)으로 폴백.

---

## ⑥ Step 1 — 실증 선호 벡터 $U_i^{\text{revealed}}$

### `[수정]` 긍정 리뷰 전용 + 차원별 NULL 오염 차단

$$
U_i^{\text{revealed}} =
\frac{\displaystyle\sum_{\substack{j:\,\tilde{r}_j > 0}} \tilde{r}_j \cdot \tau_j \cdot W'_{ij} \cdot \mathbb{1}_{ij}}
     {\displaystyle\sum_{\substack{j:\,\tilde{r}_j > 0}} \tilde{r}_j \cdot \tau_j \cdot \mathbb{1}_{ij}}
$$

$$
U_i^{\text{revealed}} = U_i^{\text{stated}}
\qquad \text{if } \sum_{j:\,\tilde{r}_j>0} \mathbb{1}_{ij} = 0 \text{ (긍정 평가 없음)}
$$

> **긍정 리뷰만 사용하는 이유**: 부정 신호($\tilde{r} < 0$)를 전체 리뷰에 포함하면,
> 속성값이 낮은 와인(예: sweetness=0.1)을 싫어했을 때 "낮은 속성 = 기피"가
> 아닌 "해당 속성 선호도가 낮음"으로 잘못 추론되는 방향 모호성이 발생한다.
> 기피 효과는 Gaussian 거리 감쇠($\hat{U}_i$와 $W'_i$의 차이)로 암묵적으로 처리.
>
> $\mathbb{1}_{ij}$: 와인 $j$의 차원 $i$ 유효성. NULL 와인이 역산을 오염시키는 것을 차단.

---

### `[수정]` 별점 정규화 · 시간 감쇠

$$
\tilde{r}_j = \frac{r_j - 3}{2} \in [-1,\,+1]
\qquad
\tau_j = e^{-\alpha \cdot \Delta t_j}, \quad \alpha = 0.008\,/\text{일}
$$

> $r_j \in \{1,2,3,4,5\}$. 3점 → 0 (중립), 5점 → +1 (강한 긍정), 1점 → −1 (강한 부정).
> $\tilde{r}_j > 0$ 조건은 $r_j \ge 4$ (rating 4·5점)에 해당. 3점 이하는 U_rev 계산에서 제외.
> $\alpha = 0.008$: 90일 후 가중치 ≈ 0.50.

---

## ⑦ Step 2 — 신뢰도 가중치 $\gamma$

### `[동일]`

$$
\gamma = 1 - \exp\!\left(-\frac{N_{\text{rated}}}{N_0}\right), \qquad N_0 = 10
$$

| $N_{\text{rated}}$ | $\gamma$ | 해석 |
|:-----------------:|:--------:|------|
| 0 | 0.00 | 설문 100% 의존 (콜드 스타트) |
| 5 | 0.39 | 설문 61% + 실증 39% |
| 10 | 0.63 | 실증 데이터 우세 |
| 30 | 0.95 | 실증 데이터 지배 |

---

## ⑧ Step 3 — 교정된 취향값 $\hat{U}_i$

### `[동일]` 핵심 교정식 — 이후 모든 수식의 $U_i$를 대체

$$
\boxed{
\hat{U}_i = (1 - \gamma) \cdot U_i^{\text{stated}} + \gamma \cdot U_i^{\text{revealed}}
}
$$

> $\gamma = 0$ (콜드 스타트) → $\hat{U}_i = U_i^{\text{stated}}$: 기존 모델과 동일.  
> $\gamma \to 1$ (이력 풍부) → $\hat{U}_i \approx U_i^{\text{revealed}}$: 실제 행동 데이터 지배.

---

## ⑨ Step 4 — 차원별 개인화 $\hat{\sigma}_i$

### `[수정]` 차원별 독립 σ̂_i — 전역 평균 폐기

$$
\mu_i = \frac{\displaystyle\sum_{j \in R^+} W'_{ij} \cdot \mathbb{1}_{ij}}{\displaystyle\sum_{j \in R^+} \mathbb{1}_{ij}},
\qquad
\text{Var}_i = \frac{\displaystyle\sum_{j \in R^+}(W'_{ij} - \mu_i)^2 \cdot \mathbb{1}_{ij}}{\displaystyle\sum_{j \in R^+} \mathbb{1}_{ij}}
$$

$$
\hat{\sigma}_i = \sigma_{\text{base}} \cdot \sqrt{1 + \delta \cdot \frac{\text{Var}_i}{\sigma_{\text{base}}^2}}
\qquad i \in \{\text{sweetness, acidity, body, tannin}\}
$$

$$
\hat{\sigma}_i = \sigma_{\text{base}} \qquad \text{if } \sum_{j \in R^+} \mathbb{1}_{ij} = 0 \text{ (긍정 평가 없음 → 폴백)}
$$

> $R^+$: 긍정 평가(rating ≥ 4) 와인 집합. Step 1의 U_rev 계산과 동일한 집합.

> **기존 전역 $\hat{\sigma}_t$ 폐기 이유**: 단일 평균 분산은 sweetness에 관대하지만
> tannin에 예민한 사용자의 차원별 취향 엄밀도 차이를 반영하지 못함.
> 차원별 $\hat{\sigma}_i$로 각 차원의 취향 폭을 독립적으로 개인화.
>
> $\sigma_{\text{base}} = 0.7$ (0~2 스케일), $\delta = 0.5$

---

| 상황 | $\text{Var}_i$ | $\hat{\sigma}_i$ | 해석 |
|------|:---------:|:---------:|------|
| 다양한 단맛 와인 좋아함 | 높음 | $> \sigma_{\text{base}}$ | sweetness 취향 폭 넓음 → 관대한 매칭 |
| 특정 탄닌 범위만 좋아함 | 낮음 | $\approx \sigma_{\text{base}}$ | tannin 취향 폭 좁음 → 엄격한 매칭 |
| 긍정 리뷰 없는 차원 | 없음 | $= \sigma_{\text{base}}$ | 정보 없음 → 기본 폴백 |

---

## ⑩ Step 5 — 와인 편향 보정항 $B_w$

### `[동일]`

$$
B_w =
\begin{cases}
\beta \cdot \dfrac{1}{|\text{Users}_w|} \displaystyle\sum_{u \in \text{Users}_w}(\tilde{r}_{uw} - \hat{S}_{uw})
& |\text{Users}_w| \ge 5 \\[8pt]
0 & |\text{Users}_w| < 5
\end{cases},
\qquad \beta = 0.15
$$

> $\tilde{r}_{uw}$: 사용자 $u$가 와인 $w$에 준 정규화 별점.  
> $\hat{S}_{uw}$: 해당 시점의 모델 예측 점수.  
> $\beta = 0.15$: 과적합 방지를 위해 낮게 유지. 범위: $-\beta \sim +\beta$.

---

## ⑪ 최종 추천도 Total

$$
\text{Total} = W_{\text{pref}} \cdot S_{\text{pref}}(\hat{U},\,\hat{\sigma}_t)
             + W_{\text{price}} \cdot S_{\text{price}}
             + W_{\text{sit}} \cdot S_{\text{sit}}(\hat{U})
             + B_w
$$

$$
\text{Total} = W_{\text{price}} \cdot S_{\text{price}}
\qquad \text{if } N_{\text{valid}} = 0 \text{ (가격만 판단 가능)}
$$

$$
\text{Total} = -\infty \text{ (추천 제외)}
\qquad \text{if } N_{\text{valid}} = 0 \text{ AND } W_{\text{price}} = \text{NULL}
$$

### 상황별 가중치

| 상황 | $W_{\text{pref}}$ | $W_{\text{price}}$ | $W_{\text{sit}}$ | 합계 |
|------|:-----------------:|:------------------:|:----------------:|:----:|
| 혼술 | 0.50 | 0.30 | 0.20 | 1.00 |
| 기념일 | 0.40 | 0.20 | 0.40 | 1.00 |
| 파티 | 0.30 | 0.20 | 0.50 | 1.00 |

---

## NULL 조합별 극단값 처리 정책

| NULL 조건 | $S_{\text{pref}}$ | $S_{\text{sit}}$ | Total |
|-----------|:-----------------:|:----------------:|-------|
| 취향 일부 NULL (1~3개) | $N_{\text{valid}}$ 동적 분모 | 유효 차원 기하 평균 | 정상 계산 |
| 취향 전체 NULL, 도수만 유효 | 도수 1차원만 반영 | 0.5 (판단 불가) | 정상 계산 |
| 도수만 NULL | $T_{\text{alc}}$ 기본값 대입 | 영향 없음 | 정상 계산 |
| 취향·도수 전체 NULL ($N_{\text{valid}}=0$) | 0 | 0.5 | $S_{\text{price}}$만 반영 |
| 취향·도수·가격 전체 NULL | 0 | 0.5 | 추천 목록 제외 ($-\infty$) |

---

## 전체 변수 정의

### 신규 추가 변수

| 변수 | 정의 |
|------|------|
| $\mathbb{1}_i$ | 특성 $i$ 유효성 지시 함수. 값 존재 → 1, NULL → 0. $i \in \{\text{sweet, acid, body, tannin, alc}\}$ |
| $\mathbb{1}_{ij}$ | 와인 $j$의 차원 $i$ 유효성. $U_i^{\text{revealed}}$ 역산 시 NULL 오염 방지 |
| $N_{\text{valid}}$ | 유효 특성 수. 범위 0~5. 0이면 극단값 처리 적용 |
| $\text{valid\_sit}$ | 상황별 핵심 차원 중 NULL이 아닌 집합. 비면 $S_{\text{sit}} = 0.5$ |
| $\text{Var}_i$ | 차원 $i$의 긍정 리뷰 기반 독립 분산. $\hat{\sigma}_i$ 계산에 사용 |
| $\hat{\sigma}_i$ | 차원별 개인화 취향 폭. 기존 전역 $\hat{\sigma}_t$ 대체. 기본값 $\sigma_{\text{base}}$ |

### 기존 변수

| 변수 | 정의 |
|------|------|
| $U_i^{\text{stated}}$ | 설문 응답 취향값. 범위: 0–10 |
| $U_i^{\text{revealed}}$ | 별점 역산 실증 선호값. 차원별 NULL 독립 처리 |
| $\hat{U}_i$ | 교정된 최종 취향값. 모든 수식에서 $U_i$ 대체 |
| $\gamma$ | 실증 신뢰 가중치. 0 (콜드 스타트) → 1 (이력 풍부). 전체 리뷰 수 기반 |
| $\hat{\sigma}_i$ | 차원별 개인화 취향 폭. 기본값 $\sigma_{\text{base}} = 0.7$ (0~2 스케일) |
| $\tilde{r}_j$ | 정규화 별점. $(r_j - 3)\,/\,2$. 범위: $-1 \sim +1$. U_rev에는 $>0$만 사용 |
| $\tau_j$ | 시간 감쇠 계수. $e^{-\alpha \cdot \Delta t_j}$. $\alpha = 0.008$/일 |
| $W'_i$ | 정규화 와인 특성값. $W_i \times 2$ (NULL이면 연산 제외) |
| $W_{\text{alc}}$ | 와인 도수 (%). NULL 허용. 없으면 $T_{\text{alc}}$ 대입 |
| $B_w$ | 와인 편향 보정항. $|\text{Users}_w| \ge 5$ 조건. 범위: $-\beta \sim +\beta$ |
| $\hat{S}_{uw}$ | 사용자 $u$가 와인 $w$ 평가 시점의 모델 예측 점수 |
| $R^+$ | 4점 이상 평가 와인 집합 |

### 상수

| 상수 | 값 | 의미 |
|------|----|------|
| $\sigma_a$ | 2.5 | 도수 가우시안 폭 |
| $\sigma_s$ | 2.5 | 상황 Half-Gaussian 폭 |
| $\sigma_{\text{base}}$ | 3.5 | $\hat{\sigma}_t$ 기본값 |
| $N_0$ | 10 | $\gamma$ 포화 속도 상수 |
| $\alpha$ | 0.008/일 | 시간 감쇠 속도 |
| $\delta$ | 0.5 | $\hat{\sigma}_t$ 교정 민감도 |
| $\beta$ | 0.15 | 편향 보정 강도 |

---

### 콜드 스타트 폴백

| 조건 | $\gamma$ | $\hat{\sigma}_t$ | $B_w$ | 동작 |
|------|:--------:|:----------------:|:-----:|------|
| 평가 이력 없음 | 0.00 | $\sigma_{\text{base}}$ | 0 | 기존 방향성 가우시안과 동일 |
| 평가 1~4개 | 0.10–0.33 | 부분 교정 | 0 | 설문 응답 우세, 소폭 교정 |
| 평가 5~9개 | 0.39–0.59 | 교정 진행 | 0 ($<$ 5명) | 실증 데이터 반영 본격화 |
| 평가 10개 이상 | 0.63+ | 완전 개인화 | 적용 | 완전 교정 모드 |