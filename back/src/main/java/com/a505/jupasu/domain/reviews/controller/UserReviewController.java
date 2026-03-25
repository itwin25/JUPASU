package com.a505.jupasu.domain.reviews.controller;

import com.a505.jupasu.domain.reviews.dto.MyPageReviewResponse;
import com.a505.jupasu.domain.reviews.service.ReviewService;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 사용자(User) 관점의 리뷰 관련 요청을 처리하는 컨트롤러
 */
@RestController
@RequestMapping("/api/users/reviews")
@RequiredArgsConstructor
public class UserReviewController {

    private final ReviewService reviewService;

    /**
     * 현재 로그인한 사용자가 작성한 모든 리뷰 목록을 조회
     * * @param loginUser Spring Security 인증 컨텍스트에서 주입된 현재 사용자 정보
     * @return 사용자의 닉네임, 별점, 와인 정보 등이 포함된 리뷰 응답 리스트 (최신순)
     */
    @GetMapping
    public ApiResponse<Page<MyPageReviewResponse>> getMyReviews(
            @AuthenticationPrincipal LoginUserCustom loginUser,
            @RequestParam(defaultValue = "0") int page) {

        Pageable pageable = PageRequest.of(page, 3);
        return ApiResponse.success(reviewService.getMyReviews(loginUser.getUser(), pageable));
    }
}
