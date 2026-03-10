package com.a505.jupasu.domain.scrap.service;


import com.a505.jupasu.domain.scrap.dto.ScrapToggleResponse;
import com.a505.jupasu.domain.scrap.entity.WineScrap;
import com.a505.jupasu.domain.scrap.repository.WineScrapRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class WineScrapService {

    private final WineScrapRepository wineScrapRepository;
    private final WineRepository wineRepository;
    private final UserRepository userRepository;

    public ScrapToggleResponse toggleScrap(Long userId, Long wineId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Wine wine = wineRepository.findById(wineId)
                .orElseThrow(() -> new CustomException(ErrorCode.WINE_NOT_FOUND));

        Optional<WineScrap> existingScrap = wineScrapRepository.findByUserIdAndWineId(userId, wineId);

        if (existingScrap.isPresent()) {
            wineScrapRepository.delete(existingScrap.get());
            return ScrapToggleResponse.builder()
                    .isScarpped(false)
                    .build();
        } else {
            WineScrap newScrap = WineScrap.builder()
                    .user(user)
                    .wine(wine)
                    .build();
            wineScrapRepository.save(newScrap);

            return ScrapToggleResponse.builder()
                    .isScarpped(true)
                    .build();
        }
    }
}
