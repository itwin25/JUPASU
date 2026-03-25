package com.a505.jupasu.domain.wine.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.report.repository.TasteReportRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.dto.FoodWinePersonalizationSnapshot;
import com.a505.jupasu.domain.wine.dto.FoodWineRankedCandidate;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationContext;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationRequest;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationResponse;
import com.a505.jupasu.domain.wine.dto.FoodWineSearchCandidate;
import com.a505.jupasu.domain.wine.repository.FoodWineRecommendationQueryRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FoodWineRecommendationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PreferenceRepository preferenceRepository;

    @Mock
    private TasteReportRepository tasteReportRepository;

    @Mock
    private FoodWineRecommendationQueryRepository queryRepository;

    private FoodWineRecommendationService service;
    private FoodContextAnalyzer foodContextAnalyzer;

    @BeforeEach
    void setUp() {
        foodContextAnalyzer = new FoodContextAnalyzer();
        service = new FoodWineRecommendationService(
                userRepository,
                preferenceRepository,
                tasteReportRepository,
                queryRepository,
                foodContextAnalyzer,
                new FoodWineReasonGenerator()
        );
    }

    @Test
    @DisplayName("direct pairing and preference matching red wins reranking")
    void rerankCandidates_prefersDirectPairingAndPreferenceMatch() {
        FoodWineRecommendationContext context = buildSteakContext();

        List<FoodWineRankedCandidate> ranked = service.rerankCandidates(
                context,
                List.of(buildSeafoodSparklingCandidate(), buildSteakRedCandidate())
        );

        assertThat(ranked).hasSize(2);
        assertThat(ranked.get(0).candidate().wineId()).isEqualTo(101L);
        assertThat(ranked.get(0).scoreBreakdown().finalScore())
                .isGreaterThan(ranked.get(1).scoreBreakdown().finalScore());
        assertThat(ranked.get(0).scoreBreakdown().directPairingScore()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("recommend assembles a best-one response through the public contract")
    void recommend_returnsBestOneResponse() {
        User user = stubContextLookups(1L);
        FoodWineSearchCandidate topCandidate = buildConsoleTopCandidate();

        when(queryRepository.findTopCandidatesByQueryVector(anyString(), anyInt()))
                .thenReturn(List.of(topCandidate));

        FoodWineRecommendationResponse response = service.recommend(
                user.getId(),
                FoodWineRecommendationRequest.builder()
                        .foodText("스테이크")
                        .candidateLimit(5)
                        .build(),
                "[0.1,0.2,0.3]"
        );

        assertThat(response.foodText()).isEqualTo("스테이크");
        assertThat(response.recommendedWine().wineId()).isEqualTo(303L);
        assertThat(response.recommendedWine().nameKr()).isEqualTo("캐릭 배너크번 피노 누아 2021");
        assertThat(response.recommendedWine().detailUrl()).isEqualTo("/wines/303");
        assertThat(response.matchPercent()).isBetween(60, 100);
        assertThat(response.reason()).contains("스테이크");
    }

    @Test
    @DisplayName("prints reranked best wine to console")
    void recommendBestWine_printsConsolePreview() {
        User user = stubContextLookups(1L);
        FoodWineSearchCandidate topCandidate = buildConsoleTopCandidate();

        when(queryRepository.findTopCandidatesByQueryVector(anyString(), anyInt()))
                .thenReturn(List.of(buildSeafoodSparklingCandidate(), topCandidate));

        FoodWineRecommendationResponse response = service.recommend(
                user.getId(),
                FoodWineRecommendationRequest.builder()
                        .foodText("스테이크")
                        .candidateLimit(5)
                        .build(),
                "[0.1,0.2,0.3]"
        );

        System.out.println("=== Food Wine Recommendation Preview ===");
        System.out.println("foodText      : " + response.foodText());
        System.out.println("recommendedId : " + response.recommendedWine().wineId());
        System.out.println("recommendedKr : " + response.recommendedWine().nameKr());
        System.out.println("matchPercent  : " + response.matchPercent());
        System.out.println("reason        : " + response.reason());

        assertThat(response.recommendedWine().wineId()).isEqualTo(303L);
    }

    @Test
    @DisplayName("multiple foods share one recommendation reason")
    void recommend_handlesMultipleFoods() {
        User user = stubContextLookups(1L);
        FoodWineSearchCandidate topCandidate = buildSharedCandidate();

        when(queryRepository.findTopCandidatesByQueryVector(anyString(), anyInt()))
                .thenReturn(List.of(topCandidate));

        FoodWineRecommendationResponse response = service.recommend(
                user.getId(),
                FoodWineRecommendationRequest.builder()
                        .foodText("우삼겹 된장 덮밥, 김치 날치알밥")
                        .candidateLimit(5)
                        .build(),
                "[0.1,0.2,0.3]"
        );

        assertThat(response.foodText()).isEqualTo("우삼겹 된장 덮밥, 김치 날치알밥");
        assertThat(response.reason()).contains("진하고 고소한 맛", "양념");
    }

    private User stubContextLookups(Long userId) {
        User user = buildUser(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(tasteReportRepository.findTopByUserOrderByCreatedAtDesc(any(User.class)))
                .thenReturn(Optional.empty());
        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.empty());
        return user;
    }

    private FoodWineRecommendationContext buildSteakContext() {
        return FoodWineRecommendationContext.builder()
                .userId(1L)
                .foodText("스테이크")
                .foodContext(foodContextAnalyzer.analyze("스테이크"))
                .candidateLimit(5)
                .personalization(FoodWinePersonalizationSnapshot.builder()
                        .source("TASTE_REPORT")
                        .body(5.0)
                        .tannin(4.0)
                        .acidity(3.0)
                        .sweetness(1.0)
                        .preferredWineTypes(List.of("RED"))
                        .preferredFlavors(List.of("OAK"))
                        .summary("묵직한 레드 와인과 오크 풍미를 좋아해요.")
                        .build())
                .build();
    }

    private FoodWineSearchCandidate buildSteakRedCandidate() {
        return FoodWineSearchCandidate.builder()
                .wineId(101L)
                .nameKr("스테이크와 잘 맞는 레드")
                .nameEn("Steak Red")
                .wineType("RED")
                .country("New Zealand")
                .region("Central Otago")
                .price(45000)
                .body(4.8)
                .acidity(3.0)
                .tannin(4.0)
                .sweetness(1.0)
                .embeddingTextKo("스테이크와 소고기 요리에 잘 어울리는 오크 풍미의 묵직한 레드 와인입니다.")
                .foodPairings(List.of("소고기", "양고기"))
                .foodSimilarity(0.58)
                .build();
    }

    private FoodWineSearchCandidate buildSeafoodSparklingCandidate() {
        return FoodWineSearchCandidate.builder()
                .wineId(202L)
                .nameKr("해산물용 스파클링")
                .nameEn("Seafood Sparkling")
                .wineType("SPARKLING")
                .country("France")
                .region("Champagne")
                .price(52000)
                .body(2.0)
                .acidity(4.0)
                .tannin(1.0)
                .sweetness(2.0)
                .embeddingTextKo("해산물과 치즈에 잘 어울리는 산뜻한 스파클링 와인입니다.")
                .foodPairings(List.of("해산물", "치즈"))
                .foodSimilarity(0.61)
                .build();
    }

    private FoodWineSearchCandidate buildConsoleTopCandidate() {
        return FoodWineSearchCandidate.builder()
                .wineId(303L)
                .nameKr("캐릭 배너크번 피노 누아 2021")
                .nameEn("Carrick Bannockburn Pinot Noir 2021")
                .wineType("RED")
                .country("New Zealand")
                .region("Central Otago")
                .price(45754)
                .imageUrl("https://example.com/wine.png")
                .body(4.7)
                .acidity(3.0)
                .tannin(4.0)
                .sweetness(1.0)
                .embeddingTextKo("스테이크와 소고기 요리에 잘 어울리는 붉은 과실과 오크 풍미의 레드 와인입니다.")
                .foodPairings(List.of("소고기", "양고기"))
                .foodSimilarity(0.60)
                .build();
    }

    private FoodWineSearchCandidate buildSharedCandidate() {
        return FoodWineSearchCandidate.builder()
                .wineId(404L)
                .nameKr("함께 먹기 좋은 화이트")
                .nameEn("Shared White")
                .wineType("WHITE")
                .country("Germany")
                .region("Mosel")
                .price(32000)
                .body(3.1)
                .acidity(3.4)
                .tannin(1.0)
                .sweetness(2.4)
                .embeddingTextKo("고기 요리와 발효된 양념, 해산물 풍미가 섞인 음식과 잘 어울리는 산뜻한 화이트 와인입니다.")
                .foodPairings(List.of("소고기", "해산물"))
                .foodSimilarity(0.63)
                .build();
    }

    private User buildUser(Long userId) {
        User user = User.builder()
                .email("food-wine@example.com")
                .passwordHash("encoded-password")
                .nickname("food-wine-tester")
                .character("sommelier")
                .build();

        try {
            java.lang.reflect.Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, userId);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException("failed to set test user id", exception);
        }

        return user;
    }
}
