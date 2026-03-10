package com.a505.jupasu.domain.reviews.dto;


import com.a505.jupasu.domain.reviews.entity.Review;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Builder
@Getter
public class ReviewResponse {
    private Long reviewId;
    private Long userId;
    private String nickname;
    private Float rating;
    private String content;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review review){
        return ReviewResponse.builder()
                .reviewId(review.getId())
                .userId(review.getUser().getId())
                .nickname(review.getUser().getNickname())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
