package com.a505.jupasu.domain.auth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 이메일 인증 용도 구분 (Redis 키 격리용)
 */
@Getter
@RequiredArgsConstructor
public enum VerificationType {
    SIGN_UP("SIGN_UP:"),
    PASSWORD_RESET("PW_RESET:");

    private final String prefix;
}
