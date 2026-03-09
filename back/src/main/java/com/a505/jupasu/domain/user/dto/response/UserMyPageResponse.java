package com.a505.jupasu.domain.user.dto.response;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.service.UserService;
import lombok.Builder;
import lombok.Getter;

/**
 * 마이페이지의 사용자 프로필 및 활동 통계 정보를 전달하는 응답 DTO
 */
@Getter
@Builder
public class UserMyPageResponse {
    private String nickname;
    private String character;
    private long wishlistCount;
    private long reviewCount;
    private long friendCount;

    /**
     * User 엔티티를 UserMyPageResponse DTO로 변환하는 정적 팩토리 메서드
     * @param user 변환할 사용자 엔티티
     * @return 가공된 마이페이지 응답 DTO
     */
    public static UserMyPageResponse from(User user) {
        return UserMyPageResponse.builder()
                .nickname(user.getNickname())
                .character(user.getCharacter())
                // TODO: 추후 수정 예정
                .wishlistCount(8)
                .reviewCount(user.getReviewCount() != null ? user.getReviewCount() : 0)
                .friendCount(8)
                .build();
    }
}
