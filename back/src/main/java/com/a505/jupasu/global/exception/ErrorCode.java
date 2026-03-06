package com.a505.jupasu.global.exception;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // 공통 예외
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버에 문제가 발생했습니다"),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    FORBIDDEN_ACCESS(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // 회원 관련 예외
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 유저입니다."),
    EXISTING_EMAIL(HttpStatus.CONFLICT, "이미 존재하는 이메일입니다"),
    EXISTING_NICKNAME(HttpStatus.CONFLICT, "이미 존재하는 닉네임입니다"),

    // 와인 및 도메인 관련 예외
    WINE_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 와인입니다."),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 리뷰입니다."),
    IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 업로드에 실패했습니다.");

    private final HttpStatus status;
    private final String message;
}
