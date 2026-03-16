package com.a505.jupasu.domain.report.controller;

import com.a505.jupasu.domain.report.dto.response.TasteReportResponse;
import com.a505.jupasu.domain.report.service.TasteReportService;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자별 AI 취향 리포트 관련 요청을 처리하는 컨트롤러
 */
@RestController
@RequestMapping("/api/users/reports")
@RequiredArgsConstructor
public class TasteReportController {
    private final TasteReportService tasteReportService;

    /**
     * 마이페이지 - AI 나의 취향 리포트를 조회 및 생성
     * 사용자가 작성한 리뷰 데이터를 분석하여 레이더 차트 수치와 분석 문구를 반환
     *
     * @param loginUser Spring Security를 통해 주입된 현재 로그인 유저 정보
     * @return AI 분석 결과가 담긴 TasteReportResponse DTO
     */
    @GetMapping
    public ApiResponse<TasteReportResponse> getTasteReport(
            @AuthenticationPrincipal LoginUserCustom loginUser) {

        TasteReportResponse response = tasteReportService.generateReport(loginUser.getUser());

        return ApiResponse.success(response);
    }
}
