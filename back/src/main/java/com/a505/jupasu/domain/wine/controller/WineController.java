package com.a505.jupasu.domain.wine.controller;

import com.a505.jupasu.domain.wine.dto.WineSearchResponse;
import com.a505.jupasu.domain.wine.service.WineService;
import com.a505.jupasu.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<ApiResponse<List<WineSearchResponse>>> searchWines(
            //TODO: 로그인한 사용자 확인 (Authentication 추가)
            @RequestParam(required = false) String keyword
    ) {

        List<WineSearchResponse> response = wineService.searchWines(keyword);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}