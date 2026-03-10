package com.a505.jupasu.domain.user.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 마이페이지 프로필 수정을 위한 요청 DTO
 */
@Getter
@NoArgsConstructor
public class UserUpdateRequest {
    private String nickname;
    private String character;
    private String currentPassword;
    private String newPassword;
    private String confirmNewPassword;
}
