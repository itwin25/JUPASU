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
    public ResponseEntity<Map<String, String>> checkNickname(@RequestBody Map<String, String> request) {
        authService.checkNicknameDuplicate(request.get("nickname"));
        return ResponseEntity.ok(Map.of("message", "사용 가능한 닉네임입니다."));
    }


    /**
     * POST /api/auth/check-email
     * 이메일 중복 확인
     */
    @PostMapping("/check-email")
    public ResponseEntity<Map<String, String>> checkEmail(@RequestBody Map<String, String> request) {
        authService.checkEmailDuplicate(request.get("email"));
        return ResponseEntity.ok(Map.of("message", "사용 가능한 이메일입니다."));
    }


    /**
     * POST /api/auth/otp/send
     * OTP 메일 발송
     */
    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(Map.of("message", "인증 코드가 이메일로 발송되었습니다. 5분 내에 입력해주세요."));
    }


    /**
     * POST /api/auth/otp/verify
     * OTP 검증만 (DB 저장 안 함, 인증완료 플래그만 Redis에 저장)
     */
    @PostMapping("/otp/verify")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity
                .ok(Map.of("message", "이메일 인증이 완료되었습니다. 회원가입을 진행해주세요."));
    }


    /**
     * POST /api/auth/signup
     * 인증완료 플래그 확인 + DB INSERT (회원가입 버튼)
     */
    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("message", "회원가입이 완료되었습니다. 로그인해주세요."));
    }
}
