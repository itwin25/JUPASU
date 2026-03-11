package com.a505.jupasu.global.exception;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String detail; // 동적 추가 정보 (없으면 null)

    /** 정적 메시지만 사용하는 일반 에러 */
    public CustomException(ErrorCode errorCode) {
        this.errorCode = errorCode;
        this.detail = null;
    }

    /** 동적 suffix가 필요한 경우 — suffix만 전달 ex) "(남은 시도: 3회)" */
    public CustomException(ErrorCode errorCode, String detail) {
        this.errorCode = errorCode;
        this.detail = detail;
    }
}
