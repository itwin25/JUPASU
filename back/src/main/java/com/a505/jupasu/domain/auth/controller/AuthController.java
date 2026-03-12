package com.a505.jupasu.domain.auth.controller;

import com.a505.jupasu.domain.auth.dto.request.SendOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignInRequest;
import com.a505.jupasu.domain.auth.dto.request.SignupRequest;
import com.a505.jupasu.domain.auth.dto.request.VerifyOtpRequest;
import com.a505.jupasu.domain.auth.dto.response.SignInResponse;
import com.a505.jupasu.domain.auth.service.AuthService;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.domain.auth.dto.request.ValidateEmailRequest;
import com.a505.jupasu.domain.auth.dto.request.ValidateNicknameRequest;
import com.a505.jupasu.domain.auth.dto.request.ResetPasswordRequest;
import com.a505.jupasu.domain.auth.util.AuthUtils;

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
    public ApiResponse<Void> signIn(@Valid @RequestBody SignInRequest request, HttpServletResponse response) {
        SignInResponse signInResponse = authService.signIn(request);
        
        response.setHeader("Authorization", "Bearer " + signInResponse.getAccessToken());
        response.setHeader("Refresh-Token", signInResponse.getRefreshToken());
        
        return ApiResponse.success("로그인 성공");
    }

    /**
     * POST /api/auth/reissue
     * 토큰 재발급 (Refresh Token Rotation)
     */
    @PostMapping("/refresh")
    public ApiResponse<Void> refresh(@RequestHeader(value = "Authorization", required = false) String authHeader, HttpServletResponse response) {
        String refreshToken = AuthUtils.extractToken(authHeader);

        if (refreshToken == null) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        SignInResponse signInResponse = authService.reissue(refreshToken);
        
        response.setHeader("Authorization", "Bearer " + signInResponse.getAccessToken());
        response.setHeader("Refresh-Token", signInResponse.getRefreshToken());
        
        return ApiResponse.success("토큰이 재발급되었습니다.");
    }

    /**
     * POST /api/auth/validate/nickname
     * 닉네임 중복 확인
     */
    @PostMapping("/validate/nickname")
    public ApiResponse<Void> checkNickname(@Valid @RequestBody ValidateNicknameRequest request) {
        authService.checkNicknameDuplicate(request.getNickname());
        return ApiResponse.success("사용 가능한 닉네임입니다.");
    }


    /**
     * POST /api/auth/validate/email
     * 이메일 중복 확인
     */
    @PostMapping("/validate/email")
    public ApiResponse<Void> checkEmail(@Valid @RequestBody ValidateEmailRequest request) {
        authService.checkEmailDuplicate(request.getEmail());
        return ApiResponse.success("사용 가능한 이메일입니다.");
    }


    /**
     * POST /api/auth/email-verification/send
     * OTP 메일 발송
     */
    @PostMapping("/email-verification/send")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<Void> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
        return ApiResponse.success("인증 코드가 이메일로 발송되었습니다. 5분 내에 입력해주세요.");
    }


    /**
     * POST /api/auth/email-verification/verify
     * OTP 검증만 (DB 저장 안 함, 인증완료 플래그만 Redis에 저장)
     */
    @PostMapping("/email-verification/verify")
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
    public ApiResponse<Void> signUp(@Valid @RequestBody SignupRequest request) {
        authService.signUp(request);
        return ApiResponse.created("회원가입이 완료되었습니다. 로그인해주세요.", null);
    }

    /**
     * POST /api/auth/password/reset/send
     * 비밀번호 재설정용 OTP 발송
     */
    @PostMapping("/password/reset/send")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<Void> sendPasswordResetOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendPasswordResetOtp(request);
        return ApiResponse.success("비밀번호 재설정 인증 코드가 발송되었습니다.");
    }

    /**
     * POST /api/auth/password/reset/verify
     * 비밀번호 재설정용 OTP 검증
     */
    @PostMapping("/password/reset/verify")
    public ApiResponse<Void> verifyPasswordResetOtp(@Valid @RequestBody VerifyOtpRequest request, HttpServletResponse response) {
        String token = authService.verifyPasswordResetOtp(request);
        response.setHeader("Authorization", "Bearer " + token);
        return ApiResponse.success("이메일 인증이 완료되었습니다. 비밀번호를 변경해주세요.");
    }

    /**
     * POST /api/auth/password/reset
     * 비밀번호 재설정 실행
     */
    @PostMapping("/password/reset")
    public ApiResponse<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String token = AuthUtils.extractToken(authHeader);
        if (token == null) {
            throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        
        authService.resetPassword(request, token);
        return ApiResponse.success("비밀번호가 성공적으로 변경되었습니다.");
    }

    /**
     * POST /api/auth/signout
     * 로그아웃 (Redis에서 Refresh Token 삭제 및 Access Token 블랙리스트 등록)
     */
    @PostMapping("/signout")
    public ApiResponse<Void> signOut(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String accessToken = AuthUtils.extractToken(authHeader);
        
        // 가드 클로즈 - 토큰이 없거나 잘못된 형식인 경우
        if (accessToken == null) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        authService.signOut(accessToken);
        
        return ApiResponse.success("로그아웃 되었습니다.");
    }
}
