package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.report.entity.TasteReport;
import com.a505.jupasu.domain.report.repository.TasteReportRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.dto.FoodContext;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoodWineRecommendationService {

    private static final Map<String, List<String>> FLAVOR_KEYWORDS = Map.of(
            "FRUIT", List.of("과일", "복숭아", "사과", "배", "자몽", "레몬", "체리", "자두", "블랙커런트"),
            "FLOWER", List.of("꽃", "플로럴", "장미", "제비꽃"),
            "BERRY", List.of("베리", "딸기", "라즈베리", "블루베리", "블랙베리"),
            "SPICE", List.of("향신료", "후추", "시나몬", "정향", "스파이스"),
            "OAK", List.of("오크", "바닐라", "버터", "토스트", "훈연")
    );

    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;
    private final TasteReportRepository tasteReportRepository;
    private final FoodWineRecommendationQueryRepository foodWineRecommendationQueryRepository;
    private final FoodContextAnalyzer foodContextAnalyzer;
    private final FoodWineReasonGenerator foodWineReasonGenerator;

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
        FoodContext foodContext = foodContextAnalyzer.analyze(request.foodText());

        return FoodWineRecommendationContext.builder()
                .userId(user.getId())
                .foodText(normalizeFoodText(foodContext.label()))
                .foodContext(foodContext)
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
        double directPairingScore = calculateDirectPairingScore(context.foodContext(), candidate.foodPairings());

        Double bodyScore = metricMatchScore(personalization.body(), candidate.body());
        Double acidityScore = metricMatchScore(personalization.acidity(), candidate.acidity());
        Double tanninScore = metricMatchScore(personalization.tannin(), candidate.tannin());
        Double sweetnessScore = metricMatchScore(personalization.sweetness(), candidate.sweetness());
        Double alcoholScore = null;
        Double typeScore = typeMatchScore(personalization.preferredWineTypes(), candidate.wineType());
        Double flavorScore = flavorMatchScore(personalization.preferredFlavors(), candidate.richDescription());
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

    private Double flavorMatchScore(List<String> preferredFlavors, String richDescription) {
        if (preferredFlavors == null || preferredFlavors.isEmpty() || !StringUtils.hasText(richDescription)) {
            return null;
        }

        String loweredText = richDescription.toLowerCase(Locale.ROOT);
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

    private double calculateDirectPairingScore(FoodContext foodContext, List<String> foodPairings) {
        if (foodContext == null || foodPairings == null || foodPairings.isEmpty()) {
            return 0.0;
        }

        Set<String> normalizedPairings = foodPairings.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.toSet());

        boolean exactCategoryMatch = foodContext.pairingHints().stream().anyMatch(normalizedPairings::contains);
        if (exactCategoryMatch) {
            return 1.0;
        }

        List<String> labels = foodContext.foods() == null || foodContext.foods().isEmpty()
                ? List.of(foodContext.label())
                : foodContext.foods().stream().map(item -> item.label().toLowerCase(Locale.ROOT)).toList();

        boolean looseMatch = normalizedPairings.stream()
                .map(pairing -> pairing.toLowerCase(Locale.ROOT))
                .anyMatch(pairing -> labels.stream()
                        .anyMatch(label -> label.contains(pairing) || pairing.contains(label)));

        return looseMatch ? 0.8 : 0.0;
    }

    private void addIfPresent(List<Double> scores, Double value) {
        if (value != null) {
            scores.add(value);
        }
    }

    private String buildReason(FoodWineRecommendationContext context, FoodWineRankedCandidate rankedCandidate) {
        FoodWineSearchCandidate candidate = rankedCandidate.candidate();
        FoodWineScoreBreakdown score = rankedCandidate.scoreBreakdown();
        FoodContext foodContext = context.foodContext() != null
                ? context.foodContext()
                : foodContextAnalyzer.analyze(context.foodText());

        return foodWineReasonGenerator.generate(
                foodContext,
                candidate,
                score,
                context.personalization(),
                toWineTypeLabel(candidate.wineType())
        );
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
