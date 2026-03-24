package com.a505.jupasu.domain.wine.controller;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import com.a505.jupasu.domain.wine.dto.*;
import com.a505.jupasu.domain.wine.dto.response.HybridSearchResponse;
import com.a505.jupasu.domain.wine.service.WineSearchService;
import com.a505.jupasu.domain.wine.service.WineService;
import com.a505.jupasu.domain.wine.util.WineRecommendationCalculator;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;


@RestController
@RequestMapping("/api/wines")
@RequiredArgsConstructor
public class WineController {

    private static final Set<DrinkingSituation> SUPPORTED_SITUATIONS =
            EnumSet.of(DrinkingSituation.ALONE, DrinkingSituation.DATE, DrinkingSituation.PARTY);

    private final WineService wineService;
    private final WineSearchService wineSearchService;
    private final WineRecommendationCalculator wineRecommendationCalculator;
    private final com.a505.jupasu.domain.wine.repository.WineRepository wineRepository;

    /**
     * 와인 통합 검색
     *  필터링, 페이지네이션 적용
     *  pg_trgm, gin index를 통한 고속 검색
     */
    @GetMapping
    public ApiResponse<Page<WineSearchResponse>> searchWines(
            @AuthenticationPrincipal LoginUserCustom user,
            @ModelAttribute WineSearchCondition condition,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<WineSearchResponse> response = wineService.searchWines(condition, pageable);
        return ApiResponse.success("와인 검색 완료", response);
    }

    /**
     * PostgreSQL pg_trgm 유사도 기반 와인 검색 및 유사한 맛 추천 (하이브리드 검색)
     */
    @GetMapping("/advanced-search")
    public ApiResponse<HybridSearchResponse> searchWinesAdvanced(
            @RequestParam(value = "q", defaultValue = "") String query
    ) {
        if (query.isBlank()) {
            return ApiResponse.success("검색어가 비어 있습니다.", HybridSearchResponse.builder()
                    .recommendations(java.util.Collections.emptyList())
                    .build());
        }
        HybridSearchResponse response = wineSearchService.searchHybrid(query);
        return ApiResponse.success("하이브리드 와인 검색 완료", response);
    }

    /**
     * 무작위 이미지 100개 테스트용 API
     */
    @GetMapping("/test-images")
    public ApiResponse<List<String>> getRandomImages() {
        // 성능 상관없이 ORDER BY RANDOM() 으로 100개 추출 (테스트 전용)
        List<String> images = wineRepository.findAll().stream()
                .map(com.a505.jupasu.domain.wine.entity.Wine::getImageUrl)
                .collect(java.util.stream.Collectors.toList());
        java.util.Collections.shuffle(images);
        return ApiResponse.success("무작위 이미지 로드", images.stream().limit(100).toList());
    }

    /**
     * DB 데이터를 엘라스틱서치 인덱스로 수동 동기화 (관리자용/초기화용)

     * 와인 상세 정보 검색
     *
     */
    @GetMapping("/{wine_id}")
    public ApiResponse<WineDetailResponse> getWineDetail(
            @AuthenticationPrincipal LoginUserCustom user,
            @PathVariable("wine_id") Long wineId
    ) {

        Long userId = user.getUser().getId();
        WineDetailResponse response = wineService.getWineDetail(userId, wineId);
        return ApiResponse.success("와인 상세 정보 조회 성공", response);

    }

    /**
     * 상황에 맞는 퀵 추천 와인 리스트 반환
     * 예: GET /api/wines/quick?situation=ALONE
     * 매개변수 없을 시 종합 추천 리스트 반환
     */
    @GetMapping("/quick")
    public ApiResponse<WineQuickRecommendResponse> getQuickWines(
            @AuthenticationPrincipal LoginUserCustom loginUser,
            @RequestParam(required = false) DrinkingSituation situation) {

        if (situation != null && !SUPPORTED_SITUATIONS.contains(situation)) {
            throw new CustomException(ErrorCode.SITUATION_NOT_FOUND);
        }

        if (situation == null) {
            WineQuickRecommendResponse response = wineRecommendationCalculator.allQuickLists(loginUser.getUser());
            return ApiResponse.success("종합 퀵 추천 와인 조회 성공", response);
        }

        List<WineRecommendationItem> wineList = wineRecommendationCalculator.quickList(loginUser.getUser(), situation);
        WineQuickRecommendResponse response = WineQuickRecommendResponse.of(
                List.of(),
                List.of(WineQuickRecommendResponse.SituationResult.of(situation, wineList))
        );

        return ApiResponse.success("퀵 추천 와인 조회 성공", response);
    }
}