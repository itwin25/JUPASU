package com.a505.jupasu.domain.reviews.dto;

import com.a505.jupasu.domain.reviews.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 마이페이지에서 내가 작성한 리뷰 목록을 조회할 때 사용하는 응답 DTO
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MyPageReviewResponse {
    private Long reviewId;
    private String nickname;
    private Long wineId;
    private String wineName;
    private String wineImageUrl;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;

    /**
     * Review 엔티티를 MyPageReviewResponse DTO로 변환하는 정적 팩토리 메서드
     * * @param review 변환할 리뷰 엔티티
     * @return 변환된 DTO 객체
     */
    static public MyPageReviewResponse from(Review review){
        return MyPageReviewResponse.builder()
                .reviewId(review.getId())
                .nickname(review.getUser().getNickname())
                .wineId(review.getWine().getId())
                .wineName(review.getWine().getNameKr())
                .wineImageUrl(review.getWine().getImageUrl())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .build();

    }
}
