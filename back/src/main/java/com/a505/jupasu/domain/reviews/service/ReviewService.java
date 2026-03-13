package com.a505.jupasu.domain.reviews.service;


import com.a505.jupasu.domain.reviews.dto.ReviewCreateRequest;
import com.a505.jupasu.domain.reviews.dto.ReviewResponse;
import com.a505.jupasu.domain.reviews.dto.ReviewUpdateRequest;
import com.a505.jupasu.domain.reviews.entity.Review;
import com.a505.jupasu.domain.reviews.repository.ReviewRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final WineRepository wineRepository;
    private final UserRepository userRepository;

    /**
     * 와인별 리뷰 조회
     */
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getWineReviews(Long wineId, Pageable pageable){
        if(!wineRepository.existsById(wineId)){
            throw new CustomException(ErrorCode.WINE_NOT_FOUND);
        }

        return reviewRepository.findAllByWineId(wineId, pageable)
                .map(ReviewResponse::from);
    }

    /**
     * 리뷰 등록
     */
    public Long createReview (Long userId, Long wineId, ReviewCreateRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Wine wine = wineRepository.findById(wineId)
                .orElseThrow(() -> new CustomException(ErrorCode.WINE_NOT_FOUND));

        if (reviewRepository.existsByUserAndWine(user, wine)) {
            throw new CustomException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Review review = Review.builder()
                .user(user)
                .wine(wine)
                .rating(request.getRating())
                .content(request.getContent())
                .isCounted(false) // 초기값
                .build();

        return reviewRepository.save(review).getId();
    }

    /**
     * 리뷰 수정
     */
    public void updateReview (Long userId, Long wineId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if(!review.getWine().getId().equals(wineId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if(!review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN_ACCESS);
        }

        review.updateReview(request.getRating(), request.getContent());
    }

    /**
     * 리뷰 삭제
     */
    public void deleteReview (Long userId, Long wineId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if(!review.getWine().getId().equals(wineId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if(!review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN_ACCESS);
        }
        reviewRepository.delete(review);
    }

}
