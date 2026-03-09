package com.a505.jupasu.domain.auth.controller;

import com.a505.jupasu.domain.auth.dto.request.SendOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignupRequest;
import com.a505.jupasu.domain.auth.dto.request.VerifyOtpRequest;
import com.a505.jupasu.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.a505.jupasu.global.common.ApiResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/check-nickname
     * 닉네임 중복 확인
     */
    @PostMapping("/check-nickname")
    public ApiResponse<Void> checkNickname(@RequestBody Map<String, String> request) {
        authService.checkNicknameDuplicate(request.get("nickname"));
        return ApiResponse.success("사용 가능한 닉네임입니다.");
    }


    /**
     * POST /api/auth/check-email
     * 이메일 중복 확인
     */
    @PostMapping("/check-email")
    public ApiResponse<Void> checkEmail(@RequestBody Map<String, String> request) {
        authService.checkEmailDuplicate(request.get("email"));
        return ApiResponse.success("사용 가능한 이메일입니다.");
    }


    /**
     * POST /api/auth/otp/send
     * OTP 메일 발송
     */
    @PostMapping("/otp/send")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<Void> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
        return ApiResponse.success("인증 코드가 이메일로 발송되었습니다. 5분 내에 입력해주세요.");
    }


    /**
     * POST /api/auth/otp/verify
     * OTP 검증만 (DB 저장 안 함, 인증완료 플래그만 Redis에 저장)
     */
    @PostMapping("/otp/verify")
    public ApiResponse<Void> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ApiResponse.success("이메일 인증이 완료되었습니다. 회원가입을 진행해주세요.");
    }


    /**
     * POST /api/auth/signup
     * 인증완료 플래그 확인 + DB INSERT (회원가입 버튼)
     */
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        // ApiResponse.java 수정 금지 요청이 있었으므로, 기존 생성되어 있는 메서드를 활용
        return ApiResponse.created("회원가입이 완료되었습니다. 로그인해주세요.", null);
    }
}
