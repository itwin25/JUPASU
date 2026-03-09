package com.a505.jupasu.domain.reviews.service;


import com.a505.jupasu.domain.reviews.dto.ReviewResponse;
import com.a505.jupasu.domain.reviews.repository.ReviewRepository;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public List<ReviewResponse> getWineReviews(Long wineId){
        if(!wineRepository.existsById(wineId)){
            throw new CustomException(ErrorCode.WINE_NOT_FOUND);
        }

        return reviewRepository.findAllByWineIdOrderByCreatedAtDesc(wineId).stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());
    }
}
