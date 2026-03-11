package com.a505.jupasu.domain.auth.controller;

import com.a505.jupasu.domain.auth.dto.request.SendOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignInRequest;
import com.a505.jupasu.domain.auth.dto.request.SignupRequest;
import com.a505.jupasu.domain.auth.dto.request.VerifyOtpRequest;
import com.a505.jupasu.domain.auth.dto.response.SignInResponse;
import com.a505.jupasu.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.domain.auth.dto.request.CheckEmailRequest;
import com.a505.jupasu.domain.auth.dto.request.CheckNicknameRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/signin
     * 일반 로그인 (액세스 및 리프레시 토큰 발급)
     */
    @PostMapping("/signin")
    public ApiResponse<SignInResponse> signIn(@Valid @RequestBody SignInRequest request) {
        SignInResponse response = authService.signIn(request);
        return ApiResponse.success("로그인 성공", response);
    }

    /**
     * POST /api/auth/check-nickname
     * 닉네임 중복 확인
     */
    @PostMapping("/check-nickname")
    public ApiResponse<Void> checkNickname(@Valid @RequestBody CheckNicknameRequest request) {
        authService.checkNicknameDuplicate(request.getNickname());
        return ApiResponse.success("사용 가능한 닉네임입니다.");
    }


    /**
     * POST /api/auth/check-email
     * 이메일 중복 확인
     */
    @PostMapping("/check-email")
    public ApiResponse<Void> checkEmail(@Valid @RequestBody CheckEmailRequest request) {
        authService.checkEmailDuplicate(request.getEmail());
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
        return ApiResponse.created("회원가입이 완료되었습니다. 로그인해주세요.", null);
    }
}
