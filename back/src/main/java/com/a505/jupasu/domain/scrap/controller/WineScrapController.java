package com.a505.jupasu.domain.scrap.controller;

import com.a505.jupasu.domain.scrap.dto.ScrapToggleResponse;
import com.a505.jupasu.domain.scrap.service.WineScrapService;
import com.a505.jupasu.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wines")
@RequiredArgsConstructor
public class WineScrapController {

    private final WineScrapService wineScrapService;

    /**
     * 와인 찜하기 / 취소 (토글)
     */
    @PostMapping("/{wine_id}/scraps")
    public ApiResponse<ScrapToggleResponse> toggleScrap(
            //TODO: 로그인한 사용자 확인 (Authentication 추가)
            @PathVariable("wine_id") Long wineId
    ) {

        ScrapToggleResponse response = wineScrapService.toggleScrap(1L, wineId);

        String message = response.isScrapped() ? "와인 찜하기 완료" : "와인 찜하기 취소";

        return ApiResponse.success(message, response);
    }
}