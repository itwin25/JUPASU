package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.FoodContext;
import com.a505.jupasu.domain.wine.dto.FoodItem;
import com.a505.jupasu.domain.wine.dto.FoodWinePersonalizationSnapshot;
import com.a505.jupasu.domain.wine.dto.FoodWineScoreBreakdown;
import com.a505.jupasu.domain.wine.dto.FoodWineSearchCandidate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class FoodWineReasonGenerator {

    public String generate(
            FoodContext foodContext,
            FoodWineSearchCandidate candidate,
            FoodWineScoreBreakdown score,
            FoodWinePersonalizationSnapshot personalization,
            String wineTypeLabel
    ) {
        String foodReason = foodContext.isMultiFood()
                ? buildMultiFoodReason(foodContext, candidate, score)
                : buildSingleFoodReason(foodContext, candidate, score);
        String preferenceReason = buildPreferenceReason(personalization, score, wineTypeLabel);

        return Stream.of(foodReason, preferenceReason)
                .filter(StringUtils::hasText)
                .collect(Collectors.joining(" "));
    }

    private String buildSingleFoodReason(
            FoodContext foodContext,
            FoodWineSearchCandidate candidate,
            FoodWineScoreBreakdown score
    ) {
        List<String> reasons = new ArrayList<>();
        FoodItem food = foodContext.foods().isEmpty() ? null : foodContext.foods().get(0);
        String label = food != null ? food.label() : foodContext.label();

        if (food != null && food.hasAnyAttribute("beef", "lamb", "pork")) {
            if (candidate.body() != null && candidate.body() >= 3.2) {
                reasons.add("와인의 무게감이 " + label + "에 밀리지 않아서 함께 먹기 좋아요.");
            }
            if (candidate.tannin() != null && candidate.tannin() >= 2.8) {
                reasons.add("고기의 육즙이 느끼하지 않게 잡아줘서 더 균형 있게 즐길 수 있어요.");
            }
        }

        if (food != null && food.hasAttribute("creamy")) {
            if (candidate.acidity() != null && candidate.acidity() >= 2.8) {
                reasons.add("부드러운 소스와 자연스럽게 어우러지고, 느끼한 느낌을 덜어줘요.");
            } else if (candidate.body() != null && candidate.body() >= 2.8) {
                reasons.add("크리미한 질감과 와인의 부드러운 느낌이 자연스럽게 이어져요.");
            }
        }

        if (food != null && food.hasAttribute("spicy")) {
            if (candidate.sweetness() != null && candidate.sweetness() >= 2.3) {
                reasons.add("양념의 강한 맛을 해치지 않으면서도 입안을 조금 더 편안하게 정리해줘요.");
            } else if (candidate.acidity() != null && candidate.acidity() >= 2.8) {
                reasons.add("매콤한 맛 뒤에 남는 느낌을 조금 더 깔끔하게 정리해줘요.");
            }
        }

        if (food != null && food.hasAttribute("seafood")) {
            if (candidate.acidity() != null && candidate.acidity() >= 2.8) {
                reasons.add("해산물의 섬세한 맛을 가리지 않으면서도 전체 맛을 깔끔하게 잡아줘요.");
            } else if (candidate.body() != null && candidate.body() <= 3.4) {
                reasons.add("너무 무겁지 않은 스타일이라 해산물의 섬세한 풍미와 잘 어울려요.");
            }
        }

        if (food != null && food.hasAttribute("cheese")) {
            if ("SPARKLING".equalsIgnoreCase(candidate.wineType())
                    || (candidate.acidity() != null && candidate.acidity() >= 2.8)) {
                reasons.add("치즈의 고소한 풍미를 산뜻하게 정리해줘서 전체 조합이 더 편안해져요.");
            } else if (candidate.body() != null && candidate.body() >= 2.8) {
                reasons.add("치즈의 진한 풍미와 와인의 부드러운 느낌이 자연스럽게 이어져요.");
            }
        }

        if (food != null && food.hasAnyAttribute("dessert", "sweet")) {
            if ("DESSERT".equalsIgnoreCase(candidate.wineType())
                    || (candidate.sweetness() != null && candidate.sweetness() >= 2.5)) {
                reasons.add("달콤한 디저트의 풍미와 와인의 결이 자연스럽게 이어져서 마무리가 좋아요.");
            } else if (candidate.acidity() != null && candidate.acidity() >= 2.8) {
                reasons.add("디저트의 진한 느낌을 조금 더 산뜻하게 정리해줘서 부담이 덜해요.");
            }
        }

        if (reasons.isEmpty() && score.directPairingScore() >= 0.99) {
            reasons.add(label + "와 함께 자주 추천되는 조합이라 편하게 즐기기 좋아요.");
        }

        if (reasons.isEmpty() && candidate.acidity() != null && candidate.acidity() >= 2.8) {
            reasons.add("입안을 조금 더 산뜻하게 정리해줘서 음식과 함께 먹기 편안해요.");
        }

        if (reasons.isEmpty() && candidate.body() != null && candidate.body() >= 3.0) {
            reasons.add("음식의 풍미에 밀리지 않을 정도의 무게감이 있어서 함께 즐기기 좋아요.");
        }

        if (reasons.isEmpty()) {
            reasons.add(label + "와 자연스럽게 어우러지는 스타일의 와인이에요.");
        }

        return reasons.stream().limit(2).collect(Collectors.joining(" "));
    }

    private String buildMultiFoodReason(
            FoodContext foodContext,
            FoodWineSearchCandidate candidate,
            FoodWineScoreBreakdown score
    ) {
        List<FoodItem> foods = foodContext.foods();
        if (foods == null || foods.isEmpty()) {
            return buildSingleFoodReason(foodContext, candidate, score);
        }

        String joinedLabels = foods.stream()
                .map(FoodItem::label)
                .collect(Collectors.joining(", "));

        List<String> reasons = new ArrayList<>();
        if (foodContext.hasAnyAttribute("beef", "lamb", "pork", "grilled", "fatty")
                && candidate.body() != null && candidate.body() >= 3.0) {
            reasons.add("진하고 고소한 맛을 받쳐줄 만큼 와인의 존재감이 충분해요.");
        }

        if (foodContext.hasAnyAttribute("spicy", "fermented", "refreshing")
                && candidate.acidity() != null && candidate.acidity() >= 2.8) {
            reasons.add("양념이나 발효 풍미 뒤에 남는 느낌을 조금 더 깔끔하게 정리해줘요.");
        }

        if (foodContext.hasAttribute("creamy")
                && candidate.acidity() != null && candidate.acidity() >= 2.8) {
            reasons.add("부드러운 소스류와도 어우러져서 한쪽으로 치우치지 않게 즐기기 좋아요.");
        }

        if (foodContext.hasAttribute("seafood")
                && candidate.body() != null && candidate.body() <= 3.6) {
            reasons.add("섬세한 재료의 맛을 과하게 덮지 않아서 같이 먹기 편안해요.");
        }

        if (reasons.isEmpty() && score.directPairingScore() >= 0.8) {
            reasons.add(joinedLabels + "처럼 여러 맛이 함께 있는 음식에도 두루 잘 어울리는 편이에요.");
        }

        if (reasons.isEmpty()) {
            reasons.add("여러 음식의 풍미를 한쪽으로 치우치지 않게 받쳐줘서 함께 즐기기 좋아요.");
        }

        return reasons.stream().limit(2).collect(Collectors.joining(" "));
    }

    private String buildPreferenceReason(
            FoodWinePersonalizationSnapshot personalization,
            FoodWineScoreBreakdown score,
            String wineTypeLabel
    ) {
        if (personalization == null || !personalization.hasStructuredPreference()) {
            return null;
        }

        String bestReason = null;
        double bestScore = 0.0;

        if (score.typeScore() != null && score.typeScore() >= 1.0) {
            bestReason = "평소 좋아하시는 " + wineTypeLabel + " 계열이라 더 편하게 즐기실 수 있어요.";
            bestScore = 1.0;
        }

        if (score.flavorScore() != null && score.flavorScore() >= 0.6 && score.flavorScore() > bestScore) {
            bestReason = "평소 선호하시는 향과 결이 비슷해서 취향에도 잘 맞을 가능성이 높아요.";
            bestScore = score.flavorScore();
        }

        if (score.acidityScore() != null && score.acidityScore() >= 0.75 && score.acidityScore() > bestScore) {
            bestReason = "평소 선호하시는 산뜻한 느낌과도 잘 맞아서 부담 없이 즐기기 좋아요.";
            bestScore = score.acidityScore();
        }

        if (score.tanninScore() != null && score.tanninScore() >= 0.75 && score.tanninScore() > bestScore) {
            bestReason = "평소 좋아하시는 탄탄한 느낌과도 잘 맞는 편이에요.";
            bestScore = score.tanninScore();
        }

        if (score.bodyScore() != null && score.bodyScore() >= 0.75 && score.bodyScore() > bestScore) {
            bestReason = "평소 좋아하시는 무게감과 비슷해서 만족스럽게 느껴질 가능성이 높아요.";
            bestScore = score.bodyScore();
        }

        if (score.priceScore() != null && score.priceScore() >= 0.9 && score.priceScore() > bestScore) {
            bestReason = "보통 즐기시는 가격대와도 잘 맞는 편이라 부담이 적어요.";
        }

        return bestReason;
    }
}
