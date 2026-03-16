package com.a505.jupasu.domain.report.service;

import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.report.dto.response.TasteReportResponse;
import com.a505.jupasu.domain.report.entity.TasteReport;
import com.a505.jupasu.domain.report.repository.TasteReportRepository;
import com.a505.jupasu.domain.reviews.entity.Review;
import com.a505.jupasu.domain.reviews.repository.ReviewRepository;
import com.a505.jupasu.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 취향 리포트 생성 및 분석 비즈니스 로직을 담당하는 서비스
 */
@Service
@RequiredArgsConstructor
public class TasteReportService {
    private final ReviewRepository reviewRepository;
    private final TasteReportRepository tasteReportRepository;
    private final PreferenceRepository preferenceRepository;

    private static final double PREFERENCE_WEIGHT = 5.0;

    /**
     * 유저의 온보딩 데이터와 리뷰 히스토리를 결합하여 가중 평균 리포트를 생성
     */
    @Transactional
    public TasteReportResponse generateReport(User user) {
        List<Review> reviews = reviewRepository.findAllByUserWithWine(user);
        Preference preference = preferenceRepository.findByUserId(user.getId()).orElse(null);

        if (reviews.isEmpty() && preference == null) {
            return null;
        }

        // 가중 평균 계산
        double totalWeight = 0;
        double sumSweet = 0, sumAcid = 0, sumBody = 0, sumTan = 0, sumAlc = 0;

        if (preference != null) {
            totalWeight += PREFERENCE_WEIGHT;
            sumSweet += PREFERENCE_WEIGHT * preference.getSweetness();
            sumAcid += PREFERENCE_WEIGHT * preference.getAcidity();
            sumBody += PREFERENCE_WEIGHT * preference.getBody();
            sumTan += PREFERENCE_WEIGHT * preference.getTannin();
            sumAlc += PREFERENCE_WEIGHT * preference.getAbv();
        }

        for (Review review : reviews) {
            double rating = review.getRating();
            var wine = review.getWine();

            sumSweet += rating * wine.getSweetness();
            sumAcid += rating * wine.getAcidity();
            sumBody += rating * wine.getBody();
            sumTan += rating * wine.getTannin();
            sumAlc += rating * normalizeAlcohol(Double.valueOf(wine.getAlcoholDegree())); // 도수 1~5 척도 변환

            totalWeight += rating;
        }

        // 2. 최종 점수 산출 (0.0 ~ 5.0)
        double avgSweetness = sumSweet / totalWeight;
        double avgAcidity = sumAcid / totalWeight;
        double avgBody = sumBody / totalWeight;
        double avgTannin = sumTan / totalWeight;
        double avgAlcohol = sumAlc / totalWeight;

        // 3. 임시 텍스트 생성 (AI 도입 전까지 사용할 템플릿)
        String title = user.getNickname() + "님은 '밸런스가 좋은' 와인 취향이에요!";
        String content = String.format("평균적으로 당도 %.1f, 산도 %.1f의 와인을 선호하시네요.", avgSweetness, avgAcidity);

        // 4. 저장 및 반환
        TasteReport report = TasteReport.builder()
                .user(user)
                .avgSweetness(avgSweetness).avgAcidity(avgAcidity)
                .avgBody(avgBody).avgTannin(avgTannin).avgAlcohol(avgAlcohol)
                .mainTitle(title).content(content)
                .createdAt(LocalDateTime.now())
                .build();

        tasteReportRepository.save(report);
        return TasteReportResponse.from(report);
    }

    /**
     * 와인의 실제 알코올 도수(%)를 차트용 1~5점 척도로 변환하는 헬퍼 메서드
     */
    private double normalizeAlcohol(Double alcohol) {
        if (alcohol == null) return 3.0;
        if (alcohol < 11) return 1.0;
        if (alcohol < 12.5) return 2.0;
        if (alcohol < 13.5) return 3.0;
        if (alcohol < 14.5) return 4.0;
        return 5.0;
    }

    /**
     * AI API 호출 시 전달할 유저 데이터 텍스트를 생성
     */
    private String createPromptContext(List<Review> reviews) {
        StringBuilder sb = new StringBuilder();
        sb.append("사용자의 와인 리뷰 히스토리:\n");
        for (Review review : reviews) {
            sb.append(String.format("- 와인: %s, 평점: %.1f, 맛(당/산/바/탄/알): %.1f/%.1f/%.1f/%.1f/%.1f\n",
                    review.getWine().getNameKr(), review.getRating(),
                    review.getWine().getSweetness(), review.getWine().getAcidity(),
                    review.getWine().getBody(), review.getWine().getTannin(),
                    review.getWine().getAlcoholDegree()));
        }
        return sb.toString();
    }

}
