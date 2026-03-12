package com.a505.jupasu.domain.wine.controller;

import com.a505.jupasu.domain.wine.dto.WineDetailResponse;
import com.a505.jupasu.domain.wine.dto.WineSearchCondition;
import com.a505.jupasu.domain.wine.dto.WineSearchResponse;
import com.a505.jupasu.domain.wine.service.WineService;
import com.a505.jupasu.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/wines")
@RequiredArgsConstructor
public class WineController {

    private final WineService wineService;

    /**
     * 와인 통합 검색 (초성/오타 허용 - 고도화 예정)
     *  현재는 필터 없이 와인 이름으로만 검색
     *  추후 필터링 -> elasticSearch 고도화 예정
     */
    @GetMapping
    public ApiResponse<Page<WineSearchResponse>> searchWines(
            //TODO: 로그인한 사용자 확인 (Authentication 추가)
            @ModelAttribute WineSearchCondition condition,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<WineSearchResponse> response = wineService.searchWines(condition, pageable);
        return ApiResponse.success("와인 검색 완료", response);
    }


    /**
     * 와인 상세 정보 검색
     *
     */
    @GetMapping("/{wine_id}")
    public ApiResponse<WineDetailResponse> getWineDetail(
            //TODO: 로그인한 사용자 확인
            @PathVariable("wine_id") Long wineId
    ) {
        //현재는 로그인한 유저 아이디 1L 로 고정
        Long userId = 1L;
        WineDetailResponse response = wineService.getWineDetail(userId, wineId);
        return ApiResponse.success("와인 상세 정보 조회 성공", response);

    }
}