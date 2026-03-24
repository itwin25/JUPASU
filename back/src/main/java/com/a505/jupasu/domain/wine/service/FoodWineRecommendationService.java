package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.report.entity.TasteReport;
import com.a505.jupasu.domain.report.repository.TasteReportRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.dto.FoodWinePersonalizationSnapshot;
import com.a505.jupasu.domain.wine.dto.FoodWineRankedCandidate;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationContext;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationRequest;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationResponse;
import com.a505.jupasu.domain.wine.dto.FoodWineScoreBreakdown;
import com.a505.jupasu.domain.wine.dto.FoodWineSearchCandidate;
import com.a505.jupasu.domain.wine.repository.FoodWineRecommendationQueryRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoodWineRecommendationService {

    private static final Map<String, List<String>> FOOD_HINTS = Map.ofEntries(
            Map.entry("소고기", List.of("스테이크", "소고기", "안심", "채끝", "립아이", "갈비", "살치")),
            Map.entry("양고기", List.of("양갈비", "양고기", "lamb")),
            Map.entry("닭고기", List.of("닭갈비", "치킨", "닭고기", "chicken")),
            Map.entry("파스타", List.of("파스타", "알리오올리오", "까르보", "리조또")),
            Map.entry("치즈", List.of("치즈", "치즈 플래터", "브리", "고르곤졸라")),
            Map.entry("해산물", List.of("해산물", "새우", "조개", "오징어", "문어", "생선")),
            Map.entry("돼지고기", List.of("돼지고기", "삼겹살", "목살", "포크", "pork")),
            Map.entry("채식/샐러드", List.of("샐러드", "채소", "비건", "vegetable"))
    );

    private static final Map<String, List<String>> FLAVOR_KEYWORDS = Map.of(
            "FRUIT", List.of("과실", "복숭아", "사과", "배", "자두", "체리", "라즈베리", "딸기"),
            "FLOWER", List.of("꽃", "플로럴", "자스민", "라벤더"),
            "BERRY", List.of("베리", "블랙베리", "블루베리", "크랜베리", "카시스"),
            "SPICE", List.of("향신료", "후추", "시나몬", "정향", "아니스"),
            "OAK", List.of("오크", "바닐라", "토스트", "삼나무", "시가 박스")
    );

    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;
    private final TasteReportRepository tasteReportRepository;
    private final FoodWineRecommendationQueryRepository foodWineRecommendationQueryRepository;

    public FoodWineRecommendationResponse recommend(
            Long userId,
            FoodWineRecommendationRequest request,
            String queryVector
    ) {
        FoodWineRecommendationContext context = prepareContext(userId, request);
        return recommendBestWine(context, queryVector);
    }

    public FoodWineRecommendationContext prepareContext(Long userId, FoodWineRecommendationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return FoodWineRecommendationContext.builder()
                .userId(user.getId())
                .foodText(normalizeFoodText(request.foodText()))
                .candidateLimit(request.resolvedCandidateLimit())
                .personalization(loadPersonalizationSnapshot(user))
                .build();
    }

    public FoodWinePersonalizationSnapshot loadPersonalizationSnapshot(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return loadPersonalizationSnapshot(user);
    }

    public List<FoodWineSearchCandidate> searchCandidates(FoodWineRecommendationContext context, String queryVector) {
        if (!StringUtils.hasText(queryVector)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        return foodWineRecommendationQueryRepository.findTopCandidatesByQueryVector(
                queryVector.trim(),
                context.candidateLimit()
        );
    }

    public List<FoodWineRankedCandidate> rerankCandidates(
            FoodWineRecommendationContext context,
            List<FoodWineSearchCandidate> candidates
    ) {
        return candidates.stream()
                .map(candidate -> FoodWineRankedCandidate.builder()
                        .candidate(candidate)
                        .scoreBreakdown(scoreCandidate(context, candidate))
                        .build())
                .sorted((left, right) -> Double.compare(
                        right.scoreBreakdown().finalScore(),
                        left.scoreBreakdown().finalScore()
                ))
                .toList();
    }

    public List<FoodWineRankedCandidate> findRankedCandidates(
            FoodWineRecommendationContext context,
            String queryVector
    ) {
        return rerankCandidates(context, searchCandidates(context, queryVector));
    }

    public FoodWineRecommendationResponse recommendBestWine(
            FoodWineRecommendationContext context,
            String queryVector
    ) {
        List<FoodWineRankedCandidate> rankedCandidates = findRankedCandidates(context, queryVector);
        if (rankedCandidates.isEmpty()) {
            throw new CustomException(ErrorCode.WINE_NOT_FOUND);
        }

        FoodWineRankedCandidate topCandidate = rankedCandidates.get(0);
        FoodWineSearchCandidate candidate = topCandidate.candidate();

        return FoodWineRecommendationResponse.builder()
                .foodText(context.foodText())
                .recommendedWine(FoodWineRecommendationResponse.RecommendedWine.builder()
                        .wineId(candidate.wineId())
                        .nameKr(candidate.nameKr())
                        .nameEn(candidate.nameEn())
                        .wineType(candidate.wineType())
                        .wineTypeLabel(toWineTypeLabel(candidate.wineType()))
                        .country(candidate.country())
                        .region(candidate.region())
                        .price(candidate.price())
                        .imageUrl(candidate.imageUrl())
                        .detailUrl(candidate.wineId() == null ? null : "/wines/" + candidate.wineId())
                        .build())
                .reason(buildReason(context, topCandidate))
                .matchPercent(toDisplayPercent(topCandidate.scoreBreakdown().finalScore()))
                .build();
    }

    private FoodWinePersonalizationSnapshot loadPersonalizationSnapshot(User user) {
        TasteReport tasteReport = tasteReportRepository.findTopByUserOrderByCreatedAtDesc(user).orElse(null);
        Preference preference = preferenceRepository.findByUserId(user.getId()).orElse(null);

        if (tasteReport != null) {
            return FoodWinePersonalizationSnapshot.builder()
                    .source("TASTE_REPORT")
                    .sweetness(tasteReport.getAvgSweetness())
                    .acidity(tasteReport.getAvgAcidity())
                    .body(tasteReport.getAvgBody())
                    .tannin(tasteReport.getAvgTannin())
                    .alcohol(tasteReport.getAvgAlcohol())
                    .preferredPriceMin(preference != null ? preference.getPreferredPriceMin() : null)
                    .preferredPriceMax(preference != null ? preference.getPreferredPriceMax() : null)
                    .preferredWineTypes(extractPreferredWineTypes(preference))
                    .preferredFlavors(extractPreferredFlavors(preference))
                    .summary(resolveSummary(tasteReport, preference))
                    .build();
        }

        if (preference != null) {
            return FoodWinePersonalizationSnapshot.builder()
                    .source("PREFERENCE")
                    .sweetness(toDouble(preference.getSweetness()))
                    .acidity(toDouble(preference.getAcidity()))
                    .body(toDouble(preference.getBody()))
                    .tannin(toDouble(preference.getTannin()))
                    .alcohol(toDouble(preference.getAbv()))
                    .preferredPriceMin(preference.getPreferredPriceMin())
                    .preferredPriceMax(preference.getPreferredPriceMax())
                    .preferredWineTypes(extractPreferredWineTypes(preference))
                    .preferredFlavors(extractPreferredFlavors(preference))
                    .summary(preference.getPreferSummary())
                    .build();
        }

        return FoodWinePersonalizationSnapshot.builder()
                .source("NONE")
                .preferredWineTypes(List.of())
                .preferredFlavors(List.of())
                .summary(null)
                .build();
    }

    private String normalizeFoodText(String foodText) {
        if (!StringUtils.hasText(foodText)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        return foodText.trim();
    }

    private List<String> extractPreferredWineTypes(Preference preference) {
        if (preference == null || preference.getPreferredWineTypes() == null) {
            return List.of();
        }
        return preference.getPreferredWineTypes().stream()
                .map(Enum::name)
                .toList();
    }

    private List<String> extractPreferredFlavors(Preference preference) {
        if (preference == null || preference.getPreferredFlavors() == null) {
            return List.of();
        }
        return preference.getPreferredFlavors().stream()
                .map(Enum::name)
                .toList();
    }

    private String resolveSummary(TasteReport tasteReport, Preference preference) {
        if (tasteReport != null && StringUtils.hasText(tasteReport.getContent())) {
            return tasteReport.getContent();
        }
        if (preference != null && StringUtils.hasText(preference.getPreferSummary())) {
            return preference.getPreferSummary();
        }
        return null;
    }

    private Double toDouble(Integer value) {
        return value == null ? null : value.doubleValue();
    }

    private FoodWineScoreBreakdown scoreCandidate(
            FoodWineRecommendationContext context,
            FoodWineSearchCandidate candidate
    ) {
        FoodWinePersonalizationSnapshot personalization = context.personalization();

        double foodScore = candidate.foodSimilarity() == null ? 0.0 : candidate.foodSimilarity();
        double directPairingScore = calculateDirectPairingScore(context.foodText(), candidate.foodPairings());

        Double bodyScore = metricMatchScore(personalization.body(), candidate.body());
        Double acidityScore = metricMatchScore(personalization.acidity(), candidate.acidity());
        Double tanninScore = metricMatchScore(personalization.tannin(), candidate.tannin());
        Double sweetnessScore = metricMatchScore(personalization.sweetness(), candidate.sweetness());
        Double alcoholScore = null;
        Double typeScore = typeMatchScore(personalization.preferredWineTypes(), candidate.wineType());
        Double flavorScore = flavorMatchScore(personalization.preferredFlavors(), candidate.embeddingTextKo());
        Double priceScore = priceMatchScore(
                candidate.price(),
                personalization.preferredPriceMin(),
                personalization.preferredPriceMax()
        );

        List<Double> preferenceScores = new ArrayList<>();
        addIfPresent(preferenceScores, bodyScore);
        addIfPresent(preferenceScores, acidityScore);
        addIfPresent(preferenceScores, tanninScore);
        addIfPresent(preferenceScores, sweetnessScore);
        addIfPresent(preferenceScores, alcoholScore);
        addIfPresent(preferenceScores, typeScore);
        addIfPresent(preferenceScores, flavorScore);
        addIfPresent(preferenceScores, priceScore);

        double preferenceScore = preferenceScores.isEmpty()
                ? 0.0
                : preferenceScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        boolean hasPreference = personalization != null && personalization.hasStructuredPreference();
        double foodWeight = hasPreference ? 0.55 : 0.70;
        double preferenceWeight = hasPreference ? 0.35 : 0.0;
        double pairingWeight = hasPreference ? 0.10 : 0.30;

        double finalScore = (foodScore * foodWeight)
                + (preferenceScore * preferenceWeight)
                + (directPairingScore * pairingWeight);

        return FoodWineScoreBreakdown.builder()
                .finalScore(finalScore)
                .foodScore(foodScore)
                .preferenceScore(preferenceScore)
                .directPairingScore(directPairingScore)
                .typeScore(typeScore)
                .flavorScore(flavorScore)
                .priceScore(priceScore)
                .bodyScore(bodyScore)
                .acidityScore(acidityScore)
                .tanninScore(tanninScore)
                .sweetnessScore(sweetnessScore)
                .alcoholScore(alcoholScore)
                .build();
    }

    private Double metricMatchScore(Double preferred, Double actual) {
        if (preferred == null || actual == null) {
            return null;
        }
        double normalizedActual = clampMetric(actual);
        return Math.max(0.0, 1.0 - (Math.abs(preferred - normalizedActual) / 4.0));
    }

    private double clampMetric(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.max(1.0, Math.min(5.0, value));
    }

    private Double typeMatchScore(List<String> preferredWineTypes, String wineType) {
        if (preferredWineTypes == null || preferredWineTypes.isEmpty() || !StringUtils.hasText(wineType)) {
            return null;
        }
        String normalizedType = wineType.trim().toUpperCase(Locale.ROOT);
        return preferredWineTypes.stream()
                .map(type -> type.toUpperCase(Locale.ROOT))
                .anyMatch(type -> type.equals(normalizedType)) ? 1.0 : 0.0;
    }

    private Double flavorMatchScore(List<String> preferredFlavors, String embeddingTextKo) {
        if (preferredFlavors == null || preferredFlavors.isEmpty() || !StringUtils.hasText(embeddingTextKo)) {
            return null;
        }

        String loweredText = embeddingTextKo.toLowerCase(Locale.ROOT);
        long hitCount = preferredFlavors.stream()
                .map(flavor -> flavor.toUpperCase(Locale.ROOT))
                .map(FLAVOR_KEYWORDS::get)
                .filter(keywords -> keywords != null && !keywords.isEmpty())
                .filter(keywords -> keywords.stream()
                        .anyMatch(keyword -> loweredText.contains(keyword.toLowerCase(Locale.ROOT))))
                .count();

        return (double) hitCount / preferredFlavors.size();
    }

    private Double priceMatchScore(Integer price, Integer minPrice, Integer maxPrice) {
        if (price == null || price <= 0 || (minPrice == null && maxPrice == null)) {
            return null;
        }

        if (minPrice == null) {
            if (price <= maxPrice) {
                return 1.0;
            }
            int tolerance = Math.max((int) (maxPrice * 0.25), 30000);
            return Math.max(0.0, 1.0 - ((double) (price - maxPrice) / tolerance));
        }

        if (maxPrice == null) {
            if (price >= minPrice) {
                return 1.0;
            }
            int tolerance = Math.max((int) (minPrice * 0.25), 30000);
            return Math.max(0.0, 1.0 - ((double) (minPrice - price) / tolerance));
        }

        if (price >= minPrice && price <= maxPrice) {
            return 1.0;
        }

        int distance = price < minPrice ? (minPrice - price) : (price - maxPrice);
        int range = Math.max(maxPrice - minPrice, 30000);
        return Math.max(0.0, 1.0 - ((double) distance / range));
    }

    private double calculateDirectPairingScore(String foodText, List<String> foodPairings) {
        if (!StringUtils.hasText(foodText) || foodPairings == null || foodPairings.isEmpty()) {
            return 0.0;
        }

        Set<String> inferredCategories = inferFoodCategories(foodText);
        Set<String> normalizedPairings = foodPairings.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.toSet());

        boolean exactCategoryMatch = inferredCategories.stream().anyMatch(normalizedPairings::contains);
        if (exactCategoryMatch) {
            return 1.0;
        }

        String loweredFoodText = foodText.toLowerCase(Locale.ROOT);
        boolean looseMatch = normalizedPairings.stream()
                .map(pairing -> pairing.toLowerCase(Locale.ROOT))
                .anyMatch(loweredFoodText::contains);

        return looseMatch ? 0.8 : 0.0;
    }

    private Set<String> inferFoodCategories(String foodText) {
        String loweredFoodText = foodText.toLowerCase(Locale.ROOT);
        return FOOD_HINTS.entrySet().stream()
                .filter(entry -> entry.getValue().stream()
                        .anyMatch(keyword -> loweredFoodText.contains(keyword.toLowerCase(Locale.ROOT))))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    private void addIfPresent(List<Double> scores, Double value) {
        if (value != null) {
            scores.add(value);
        }
    }

    private String buildReason(FoodWineRecommendationContext context, FoodWineRankedCandidate rankedCandidate) {
        FoodWineSearchCandidate candidate = rankedCandidate.candidate();
        FoodWineScoreBreakdown score = rankedCandidate.scoreBreakdown();

        String foodReason = buildFoodReason(context.foodText(), candidate, score);
        String preferenceReason = buildPreferenceReason(context.personalization(), candidate, score);

        if (StringUtils.hasText(preferenceReason)) {
            return "%s %s".formatted(foodReason, preferenceReason).trim();
        }
        return foodReason;
    }

    private String buildFoodReason(
            String foodText,
            FoodWineSearchCandidate candidate,
            FoodWineScoreBreakdown score
    ) {
        if (score.directPairingScore() >= 0.99 && candidate.foodPairings() != null && !candidate.foodPairings().isEmpty()) {
            String pairings = String.join(", ", candidate.foodPairings().stream().limit(2).toList());
            return "%s와 잘 어울리는 와인이에요. 특히 %s와 함께할 때 식사의 풍미를 자연스럽게 받쳐줘요."
                    .formatted(foodText, pairings);
        }

        if (score.foodScore() >= 0.55) {
            return "%s와 함께 마셨을 때 음식 맛을 해치지 않고 자연스럽게 어우러지는 스타일이에요."
                    .formatted(foodText);
        }

        return "%s와 무난하게 곁들이기 좋은 와인이에요.".formatted(foodText);
    }

    private String buildPreferenceReason(
            FoodWinePersonalizationSnapshot personalization,
            FoodWineSearchCandidate candidate,
            FoodWineScoreBreakdown score
    ) {
        if (personalization == null || !personalization.hasStructuredPreference()) {
            return "처음 마셔보는 분도 비교적 편하게 즐기기 좋은 스타일이에요.";
        }

        if (score.typeScore() != null && score.typeScore() >= 1.0) {
            return "평소 좋아하시는 %s 계열이라 취향에도 잘 맞을 가능성이 높아요."
                    .formatted(toWineTypeLabel(candidate.wineType()));
        }

        if (score.flavorScore() != null && score.flavorScore() >= 0.6) {
            return "평소 선호하시는 향의 방향과도 잘 맞아서 더 편하게 즐기실 수 있어요.";
        }

        Double bestMetricScore = Stream.of(
                        score.bodyScore(),
                        score.acidityScore(),
                        score.tanninScore(),
                        score.sweetnessScore())
                .filter(value -> value != null)
                .max(Double::compareTo)
                .orElse(null);

        if (bestMetricScore != null && bestMetricScore >= 0.7) {
            return "사용자 취향 리포트 기준으로도 잘 맞는 편이라 만족도가 높을 가능성이 있어요.";
        }

        if (score.priceScore() != null && score.priceScore() >= 0.9 && candidate.price() != null) {
            return "가격도 생각하신 범위에 잘 들어와서 부담 없이 고르기 좋아요.";
        }

        if (StringUtils.hasText(personalization.summary())) {
            return "현재 취향 리포트 기준으로도 크게 벗어나지 않아 무난하게 즐기기 좋은 추천이에요.";
        }

        return null;
    }

    private Integer toDisplayPercent(double finalScore) {
        double normalized = Math.max(0.0, Math.min(1.0, finalScore));
        return (int) Math.round(60 + (normalized * 40));
    }

    private String toWineTypeLabel(String wineType) {
        if (!StringUtils.hasText(wineType)) {
            return "와인";
        }
        return switch (wineType.toUpperCase(Locale.ROOT)) {
            case "RED" -> "레드 와인";
            case "WHITE" -> "화이트 와인";
            case "ROSE" -> "로제 와인";
            case "SPARKLING" -> "스파클링 와인";
            case "DESSERT" -> "디저트 와인";
            case "FORTIFIED" -> "주정 강화 와인";
            default -> wineType;
        };
    }
}
