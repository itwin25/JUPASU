package com.a505.jupasu.domain.scrap.controller;

import com.a505.jupasu.domain.scrap.dto.ScrapListResponse;
import com.a505.jupasu.domain.scrap.dto.ScrapToggleResponse;
import com.a505.jupasu.domain.scrap.service.WineScrapService;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    /**
     * 현재 로그인한 사용자가 스크랩(찜)한 모든 와인 목록을 조회
     * * @param loginUser 인증 컨텍스트에서 주입된 사용자 정보
     * @return 스크랩한 와인의 상세 정보(평점, 가격, 매칭률 등) 리스트
     */
    @GetMapping("/scraps")
    public ApiResponse<List<ScrapListResponse>> getMyScrapList(
            @AuthenticationPrincipal LoginUserCustom loginUser) {

        List<ScrapListResponse> response = wineScrapService.getMyScrapList(loginUser.getUser());

        return ApiResponse.success(response);
    }
}