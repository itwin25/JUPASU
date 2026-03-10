package com.a505.jupasu.domain.reviews.controller;


import com.a505.jupasu.domain.reviews.dto.ReviewCreateRequest;
import com.a505.jupasu.domain.reviews.dto.ReviewResponse;
import com.a505.jupasu.domain.reviews.dto.ReviewUpdateRequest;
import com.a505.jupasu.domain.reviews.service.ReviewService;
import com.a505.jupasu.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{wine_id}")
    public ApiResponse<List<ReviewResponse>> getWineReviews(
            //TODO: 로그인한 사용자 확인 (Authentication 추가)
            @PathVariable("wine_id") Long wineId
    ) {
        return ApiResponse.success("와인 리뷰 조회 성공", reviewService.getWineReviews(wineId));
    }

    @PostMapping("/{wine_id}/review")
    public ApiResponse<Long> createReview(
            //TODO: 로그인 한 사용자 확인
            @PathVariable("wine_id") Long wineId,
            @Valid @RequestBody ReviewCreateRequest request
    ) {
        return ApiResponse.success("리뷰 생성 성공", reviewService.createReview(1L, wineId, request));
    }

    @PatchMapping("/{wine_id}/review/{review_id}")
    public ApiResponse<Void> updateReview(
            //TODO: 로그인한 사용자 확인
            @PathVariable("wine_id") Long wineId,
            @PathVariable("review_id") Long reviewId,
            @Valid @RequestBody ReviewUpdateRequest request
    ) {
        reviewService.updateReview(1L, wineId, reviewId, request);
        return ApiResponse.success("리뷰 수정 성공");
    }
}
