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

### `[수정]` 5차원 통합 — 도수 NULL도 동적 분모에 포함

$$
S_{\text{pref}} = \frac{1}{N_{\text{valid}}} \left(
  \sum_{i \in \text{valid\_taste}} \exp\!\left(-\frac{(\hat{U}_i - W'_i)^2}{2\hat{\sigma}_t^2}\right)
  + \mathbb{1}_{\text{alc}} \cdot \exp\!\left(-\frac{\bigl(\text{COALESCE}(U_{\text{alc}},\, T_{\text{alc}}) - W_{\text{alc}}\bigr)^2}{2\sigma_a^2}\right)
\right)
$$

$$
S_{\text{pref}} = 0 \qquad \text{if } N_{\text{valid}} = 0 \text{ (전체 NULL)}
$$

> **COALESCE**: 사용자 선호 도수 $U_{\text{alc}}$가 NULL이면 상황별 기본 도수 $T_{\text{alc}}$로 대체.

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

### `[동일]` 구조 변경 없음

$$
S_{\text{price}} = \exp\!\left(-\frac{(W_{\text{price}} - T_{\text{price}})^2}{2\sigma_{\text{dir}}^2}\right),
\qquad
\sigma_{\text{dir}} =
\begin{cases}
\sigma_{\text{low}} & W_{\text{price}} \le T_{\text{price}} \\
\sigma_{\text{high}} & W_{\text{price}} > T_{\text{price}}
\end{cases}
$$

| 상황 | $T_{\text{price}}$ | $\sigma_{\text{low}}$ | $\sigma_{\text{high}}$ |
|------|-------------------|----------------------|------------------------|
| 혼술 | $U_{\min}$ | $0.8 \times U_{\min}$ | $0.2 \times U_{\min}$ |
| 기념일 | $1.1 \times U_{\max}$ | $0.25 \times U_{\max}$ | $0.2 \times T_{\text{price}}$ |
| 파티 | $(U_{\min} + U_{\max})\,/\,2$ | $0.4 \times T_{\text{price}}$ | $0.3 \times T_{\text{price}}$ |

---

## ⑥ Step 1 — 실증 선호 벡터 $U_i^{\text{revealed}}$

### `[수정]` 차원별 NULL 오염 차단 — $\mathbb{1}_{ij}$ 지시 함수 적용

$$
U_i^{\text{revealed}} =
\frac{\displaystyle\sum_{j \in \text{Rated}} \tilde{r}_j \cdot \tau_j \cdot W'_{ij} \cdot \mathbb{1}_{ij}}
     {\displaystyle\sum_{j \in \text{Rated}} |\tilde{r}_j| \cdot \tau_j \cdot \mathbb{1}_{ij}}
$$

$$
U_i^{\text{revealed}} = U_i^{\text{stated}}
\qquad \text{if } \sum_j \mathbb{1}_{ij} = 0 \text{ (차원 } i \text{의 유효 평가 없음)}
$$

> $\mathbb{1}_{ij}$: 와인 $j$의 차원 $i$ 유효성. NULL 와인이 역산을 오염시키는 것을 차단.

---

### `[동일]` 별점 정규화 · 시간 감쇠

$$
\tilde{r}_j = \frac{r_j - 3}{2} \in [-1,\,+1]
\qquad
\tau_j = e^{-\alpha \cdot \Delta t_j}, \quad \alpha = 0.008\,/\text{일}
$$

> $r_j \in \{1,2,3,4,5\}$. 3점 → 0 (중립), 5점 → +1 (강한 긍정), 1점 → −1 (강한 부정).  
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

## ⑨ Step 4 — 개인화 $\hat{\sigma}_t$

### `[수정]` 차원별 독립 분산 후 평균 — NULL 차원 제외

$$
\mu_i = \frac{\displaystyle\sum_{j \in R^+} W'_{ij} \cdot \mathbb{1}_{ij}}{\displaystyle\sum_{j \in R^+} \mathbb{1}_{ij}},
\qquad
\text{Var}_i = \frac{\displaystyle\sum_{j \in R^+}(W'_{ij} - \mu_i)^2 \cdot \mathbb{1}_{ij}}{\displaystyle\sum_{j \in R^+} \mathbb{1}_{ij}}
$$

$$
\text{Var}(W'_{\text{rated}}) = \frac{1}{N_{\text{valid\_rated}}} \sum_{i \in \text{valid\_rated}} \text{Var}_i
$$

> $R^+$: 4점 이상 평가 와인 집합.  
> $N_{\text{valid\_rated}}$: $R^+$ 와인에서 유효값이 1개 이상인 차원 수.  
> 모든 차원이 NULL이면 $\hat{\sigma}_t = \sigma_{\text{base}}$로 폴백.

---

### `[동일]` $\hat{\sigma}_t$ 계산

$$
\hat{\sigma}_t = \sigma_{\text{base}} \cdot \sqrt{1 + \delta \cdot \frac{\text{Var}(W'_{\text{rated}})}{\sigma_{\text{base}}^2}},
\qquad \sigma_{\text{base}} = 3.5,\quad \delta = 0.5
$$

> 취향 폭이 넓은 사용자 → $\text{Var}$ 높음 → $\hat{\sigma}_t$ 커짐 → 다양한 와인에 관대.  
> 취향 폭이 좁은 사용자 → $\text{Var}$ 낮음 → $\hat{\sigma}_t$ 작아짐 → 딱 맞는 와인만 고점수.

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
| $\text{Var}_i$ | 차원 $i$의 NULL 제외 분산. 차원별 독립 계산 |
| $N_{\text{valid\_rated}}$ | $R^+$ 와인에서 유효값 ≥ 1인 차원 수. $\text{Var}$ 분모 |

### 기존 변수

| 변수 | 정의 |
|------|------|
| $U_i^{\text{stated}}$ | 설문 응답 취향값. 범위: 0–10 |
| $U_i^{\text{revealed}}$ | 별점 역산 실증 선호값. 차원별 NULL 독립 처리 |
| $\hat{U}_i$ | 교정된 최종 취향값. 모든 수식에서 $U_i$ 대체 |
| $\gamma$ | 실증 신뢰 가중치. 0 (콜드 스타트) → 1 (이력 풍부) |
| $\hat{\sigma}_t$ | 개인화 취향 폭. 기본값 $\sigma_{\text{base}} = 3.5$ |
| $\tilde{r}_j$ | 정규화 별점. $(r_j - 3)\,/\,2$. 범위: $-1 \sim +1$ |
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