package com.a505.jupasu.domain.reviews.service;


import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.reviews.dto.MyPageReviewResponse;
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
    private final PreferenceRepository preferenceRepository;

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
    public Long createReview(Long userId, Long wineId, ReviewCreateRequest request) {
        if (reviewRepository.existsByUserIdAndWineId(userId, wineId)) {
            throw new CustomException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        User user = userRepository.getReferenceById(userId);
        Wine wine = wineRepository.getReferenceById(wineId);

        Review review = Review.builder()
                .user(user)
                .wine(wine)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        reviewRepository.save(review);
        user.increaseReviewCount();

        wine.addUserReviewRating(request.getRating());

        preferenceRepository.findByUserId(userId).ifPresent(preference ->
                preference.markReportAsOutdated()
        );

        return review.getId();
    }

    /**
     * 리뷰 수정
     */
    public void updateReview(Long userId, Long wineId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getWine().getId().equals(wineId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (!review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN_ACCESS);
        }

        int oldRating = review.getRating();
        int newRating = request.getRating();

        review.updateReview(request.getRating(), request.getContent());

        if (oldRating != newRating) {
            review.getWine().updateUserReviewRating(oldRating, newRating);
        }

        preferenceRepository.findByUserId(userId).ifPresent(preference ->
                preference.markReportAsOutdated()
        );
    }


    /**
     * 리뷰 삭제
     */
    public void deleteReview(Long userId, Long wineId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getWine().getId().equals(wineId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (!review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN_ACCESS);
        }

        int oldRating = review.getRating();

        review.getWine().removeUserReviewRating(oldRating);
        review.getUser().decreaseReviewCount();
        reviewRepository.delete(review);

        preferenceRepository.findByUserId(userId).ifPresent(preference ->
                preference.markReportAsOutdated()
        );
    }


    /**
     * 현재 로그인한 사용자의 리뷰 목록을 조회하여 DTO로 반환
     * * @param user 현재 인증된 사용자 객체
     * @return 마이페이지용 리뷰 응답 DTO 리스트
     */
    @Transactional(readOnly = true)
    public Page<MyPageReviewResponse> getMyReviews(User user, Pageable pageable) {
        return reviewRepository.findAllByUserWithWine(user, pageable)
                .map(MyPageReviewResponse::from);
    }


}
