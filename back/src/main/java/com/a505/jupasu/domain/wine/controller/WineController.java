package com.a505.jupasu.domain.wine.controller;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationRequest;
import com.a505.jupasu.domain.wine.dto.FoodWineRecommendationResponse;
import com.a505.jupasu.domain.wine.dto.InternalFoodWineRecommendationRequest;
import com.a505.jupasu.domain.wine.dto.WineDetailResponse;
import com.a505.jupasu.domain.wine.dto.WineQuickRecommendResponse;
import com.a505.jupasu.domain.wine.dto.WineRecommendationItem;
import com.a505.jupasu.domain.wine.dto.WineSearchCondition;
import com.a505.jupasu.domain.wine.dto.WineSearchResponse;
import com.a505.jupasu.domain.wine.dto.response.HybridSearchResponse;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import com.a505.jupasu.domain.wine.service.FoodWineRecommendationService;
import com.a505.jupasu.domain.wine.service.WineSearchService;
import com.a505.jupasu.domain.wine.service.WineService;
import com.a505.jupasu.domain.wine.util.WineRecommendationCalculator;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import jakarta.validation.Valid;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wines")
@RequiredArgsConstructor
public class WineController {

    private static final Set<DrinkingSituation> SUPPORTED_SITUATIONS =
            EnumSet.of(DrinkingSituation.ALONE, DrinkingSituation.DATE, DrinkingSituation.PARTY);

    private final WineService wineService;
    private final WineSearchService wineSearchService;
    private final WineRecommendationCalculator wineRecommendationCalculator;
    private final WineRepository wineRepository;
    private final FoodWineRecommendationService foodWineRecommendationService;

    @Value("${ai.server.internal-api-key}")
    private String internalApiKey;

    @GetMapping
    public ApiResponse<Page<WineSearchResponse>> searchWines(
            @AuthenticationPrincipal LoginUserCustom user,
            @ModelAttribute WineSearchCondition condition,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<WineSearchResponse> response = wineService.searchWines(condition, pageable);
        return ApiResponse.success("?Â€??å¯ƒÂ€??å¯ƒê³Œë‚µ?ë‚…ë•²??", response);
    }

    @GetMapping("/advanced-search")
    public ApiResponse<HybridSearchResponse> searchWinesAdvanced(
            @RequestParam(value = "q", defaultValue = "") String query
    ) {
        if (query.isBlank()) {
            return ApiResponse.success(
                    "å¯ƒÂ€?ë±ë¼±åª›Â€ é®ê¾©ë¼± ?ë‰ë’¿?ëˆë–Ž.",
                    HybridSearchResponse.builder()
                            .recommendations(Collections.emptyList())
                            .build()
            );
        }

        HybridSearchResponse response = wineSearchService.searchHybrid(query);
        return ApiResponse.success("?ì„ì” é‡‰ëš®â”???Â€??å¯ƒÂ€???ê¾¨ì¦º", response);
    }

    @GetMapping("/test-images")
    public ApiResponse<List<String>> getRandomImages() {
        List<String> images = wineRepository.findAll().stream()
                .map(Wine::getImageUrl)
                .collect(Collectors.toList());
        Collections.shuffle(images);
        return ApiResponse.success("è‡¾ëŒì˜‰???ëŒ€?ï§žÂ€ æ¿¡ì’•ë±¶", images.stream().limit(100).toList());
    }

    @GetMapping("/{wine_id}")
    public ApiResponse<WineDetailResponse> getWineDetail(
            @AuthenticationPrincipal LoginUserCustom user,
            @PathVariable("wine_id") Long wineId
    ) {
        Long userId = user.getUser().getId();
        WineDetailResponse response = wineService.getWineDetail(userId, wineId);
        return ApiResponse.success("?Â€???ê³¸ê½­ ?ëº£ë‚«?ë‚…ë•²??", response);
    }

    @GetMapping("/quick")
    public ApiResponse<WineQuickRecommendResponse> getQuickWines(
            @AuthenticationPrincipal LoginUserCustom loginUser,
            @RequestParam(required = false) DrinkingSituation situation
    ) {
        if (situation != null && !SUPPORTED_SITUATIONS.contains(situation)) {
            throw new CustomException(ErrorCode.SITUATION_NOT_FOUND);
        }

        if (situation == null) {
            WineQuickRecommendResponse response = wineRecommendationCalculator.allQuickLists(loginUser.getUser());
            return ApiResponse.success("é®ì¢Šâ…¨ ç•°ë¶¿ì¿‡ å¯ƒê³Œë‚µ?ë‚…ë•²??", response);
        }

        List<WineRecommendationItem> wineList = wineRecommendationCalculator.quickList(loginUser.getUser(), situation);
        WineQuickRecommendResponse response = WineQuickRecommendResponse.of(
                List.of(),
                List.of(WineQuickRecommendResponse.SituationResult.of(situation, wineList))
        );

        return ApiResponse.success("?ê³¹ì†´è¹‚?é®ì¢Šâ…¨ ç•°ë¶¿ì¿‡ å¯ƒê³Œë‚µ?ë‚…ë•²??", response);
    }

    @PostMapping("/recommendations/food")
    public ApiResponse<FoodWineRecommendationResponse> recommendWineByFood(
            @AuthenticationPrincipal LoginUserCustom loginUser,
            @Valid @RequestBody FoodWineRecommendationRequest request,
            @RequestParam String queryVector
    ) {
        FoodWineRecommendationResponse response = foodWineRecommendationService.recommend(
                loginUser.getUser().getId(),
                request,
                queryVector
        );

        return ApiResponse.success("?ëš¯ë–‡ æ¹²ê³•ì»² ?Â€??ç•°ë¶¿ì¿‡ å¯ƒê³Œë‚µ?ë‚…ë•²??", response);
    }

    @PostMapping("/recommendations/food/internal")
    public ApiResponse<FoodWineRecommendationResponse> recommendWineByFoodInternal(
            @RequestHeader("X-Internal-Api-Key") String internalApiKeyHeader,
            @RequestParam Long userId,
            @Valid @RequestBody InternalFoodWineRecommendationRequest request
    ) {
        if (!internalApiKey.equals(internalApiKeyHeader)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST, "invalid internal api key");
        }

        try {
            FoodWineRecommendationResponse response = foodWineRecommendationService.recommend(
                    userId,
                    request.toFoodRequest(),
                    request.queryVector()
            );

            return ApiResponse.success("?ëš¯ë–‡ æ¹²ê³•ì»² ?Â€??ç•°ë¶¿ì¿‡ å¯ƒê³Œë‚µ?ë‚…ë•²??", response);
        } catch (CustomException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new CustomException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    exception.getClass().getSimpleName() + ": " + exception.getMessage()
            );
        }
    }
}
