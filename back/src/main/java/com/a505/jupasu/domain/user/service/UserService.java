package com.a505.jupasu.domain.user.service;

import com.a505.jupasu.domain.user.dto.response.UserMyPageResponse;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User 도메인의 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /**
     * 현재 로그인한 사용자의 마이페이지 정보를 조회
     *
     * @return 마이페이지 프로필 및 통계 응답 DTO
     * @throws CustomException 사용자를 찾을 수 없는 경우 USER_NOT_FOUND 발생
     */
    public UserMyPageResponse getMyPageInfo() {
        // TODO: 추후 임시 데이터 교체 예정
        Long mockUserId = 1L;

        User user = userRepository.findById(mockUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return UserMyPageResponse.from(user);

    }

}
