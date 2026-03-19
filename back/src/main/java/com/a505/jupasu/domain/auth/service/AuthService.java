package com.a505.jupasu.domain.auth.service;

import com.a505.jupasu.domain.auth.dto.request.SendOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignupRequest;
import com.a505.jupasu.domain.auth.dto.request.VerifyOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignInRequest;
import com.a505.jupasu.domain.auth.dto.request.ResetPasswordRequest;
import com.a505.jupasu.domain.auth.dto.response.SignInResponse;
import com.a505.jupasu.domain.auth.enums.VerificationType;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.redis.RedisService;
import com.a505.jupasu.global.security.jwt.JwtTokenProvider;
import com.a505.jupasu.domain.auth.util.AuthUtils;

import static com.a505.jupasu.domain.auth.util.AuthRedisConstants.*;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final RedisService          redisService;
    private final StringRedisTemplate   stringRedisTemplate;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService          emailService;
    private final JwtTokenProvider      jwtTokenProvider;
    private final AuthUtils authUtils;
    private final VerificationService verificationService;


    /**
     * 이메일 중복 확인
     * @param email
     */
    public void checkEmailDuplicate(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new CustomException(ErrorCode.EXISTING_EMAIL);
        }
    }


    /**
     * 닉넥임 중복 확인
     * @param nickname
     */
    public void checkNicknameDuplicate(String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            throw new CustomException(ErrorCode.EXISTING_NICKNAME);
        }
    }


    /**
     * OTP 발송
     * POST /api/auth/otp/send
     * @param request
     */
    public void sendOtp(SendOtpRequest request) {
        // 이미 가입된 이메일인지 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EXISTING_EMAIL);
        }

        verificationService.sendCode(request.getEmail(), VerificationType.SIGN_UP);
    }


    /**
     * OTP 검증
     * POST /api/auth/otp/verify
     * @param request
     */
    public void verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail();

        verificationService.verifyCode(email, request.getCode(), VerificationType.SIGN_UP);

        // 인증 성공 → "verified" 플래그 저장 (TTL 30분)
        redisService.setIfAbsent(SIGNUP_VERIFIED_PREFIX + email, "true", 1800);

        log.info("이메일 인증 완료: {}", email);
    }


    /**
     * 회원 가입 (DB INSERT)
     * POST /api/auth/signup
     * @param request
     */
    @Transactional
    public void signUp(SignupRequest request) {
        String email = request.getEmail();
        String verifiedKey = SIGNUP_VERIFIED_PREFIX + email;

        // 이메일 인증 완료 여부 확인
        if (!redisService.exists(verifiedKey)) {
            throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        // DB 중복 체크
        if (userRepository.existsByEmail(email)) {
             throw new CustomException(ErrorCode.EXISTING_EMAIL);
        }
        if (userRepository.existsByNickname(request.getNickname())) {
             throw new CustomException(ErrorCode.EXISTING_NICKNAME);
        }

        // 비밀번호 해싱
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // DB INSERT
        User user = User.builder()
                .email(email)
                .passwordHash(passwordHash)
                .nickname(request.getNickname())
                .build();
        userRepository.save(user);

        // DB 커밋 후 Redis 키 정리
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                redisService.deletePipelined(List.of(verifiedKey));
                log.info("회원가입 완료 — Redis 키 정리: {}", email);
            }
        });
    }


    /**
     * 토큰 재발급 - RT 검증 후 AT, RT 재발행
     * POST /api/auth/reissue
     * @param refreshToken
     * @return
     */
    @Transactional
    public SignInResponse reissue(String refreshToken) {

        // 1. Refresh Token 자체 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        // 2. Refresh Token에서 email 추출 - redis 키 값
        String email = jwtTokenProvider.getSubjectBaseOnToken(refreshToken);

        // 3. Redis에 저장된 RT와 일치하는지 확인 (이미 로그아웃되었거나 다른 기기에서 로그인했을 경우 대비)
        String storedRefreshToken = redisService.get(RT_PREFIX + email);
        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // 4. 새로운 토큰 쌍 발급 (Refresh Token Rotation)
        String newAccessToken = jwtTokenProvider.createAccessToken(email);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(email);

        // 5. Redis 갱신 (7일 TTL)
        redisService.set(RT_PREFIX + email, newRefreshToken, 604800);

        log.info("토큰 재발급 완료: email={}", email);
        return SignInResponse.of(newAccessToken, newRefreshToken);
    }


    /**
     * 로그인 - AT, RT 발급
     * POST /api/auth/signin
     * @param request
     * @return
     */
    @Transactional(readOnly = true)
    public SignInResponse signIn(SignInRequest request) {
        String email = request.getEmail();
        String lockoutKey = LOCKOUT_PREFIX + email;

        // 계정 잠김 체크 (redis에서 수행)
        String lockoutCountStr = redisService.get(lockoutKey);

        // 계정 잠김 -> 로그인 가능 시간
        if (lockoutCountStr != null && Integer.parseInt(lockoutCountStr) >= MAX_LOGIN_ATTEMPTS) {
            String unlockTime = redisService.getUnlockTimeAsString(lockoutKey, LOCKOUT_TTL_SECONDS);
            throw new CustomException(ErrorCode.ACCOUNT_LOCKED, "(로그인 가능 시간: " + unlockTime + ")");
        }

        // 유저 및 암호 검증
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 비밀번호 오류
        // 1~4회: INCR + 2h TTL, 5회: TTL을 30분으로 리셋
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            Long currentCount = redisService.executeScript(
                LOGIN_LOCKOUT_SCRIPT,
                List.of(lockoutKey),
                String.valueOf(MAX_LOGIN_ATTEMPTS),
                String.valueOf(LOCKOUT_TTL_SECONDS),
                String.valueOf(COUNTER_TTL_SECONDS)
            );

            // 5번째 실패인 경우
            if (currentCount >= MAX_LOGIN_ATTEMPTS) {
                String unlockTime = redisService.getUnlockTimeAsString(lockoutKey, LOCKOUT_TTL_SECONDS);
                throw new CustomException(ErrorCode.ACCOUNT_LOCKED, "(로그인 가능 시간: " + unlockTime + ")");
            }

            int remaining = MAX_LOGIN_ATTEMPTS - currentCount.intValue();
            throw new CustomException(ErrorCode.INVALID_PASSWORD, "(남은 시도: " + remaining + "회)");
        }

        // 로그인 성공 -> 실패 기록 정리 및 토큰 발급
        redisService.delete(lockoutKey);

        String accessToken = jwtTokenProvider.createAccessToken(email);
        String refreshToken = jwtTokenProvider.createRefreshToken(email);

        // Redis에 Refresh Token 저장 (TTL: 7일)
        redisService.set(RT_PREFIX + email, refreshToken, 604800);

        return SignInResponse.of(accessToken, refreshToken);
    }


    /**
     * 로그아웃 - AT 블랙리스트 추가, RT 삭제
     * POST /api/auth/signout
     * @param accessToken
     */
    public void signOut(String accessToken) {
        // 토큰 파싱 및 검증 (만료된 토큰이어도 이메일 추출)
        com.a505.jupasu.domain.auth.util.AuthUtils.TokenInfo tokenInfo = authUtils.parseTokenForLogout(accessToken);

        redisService.delete(RT_PREFIX + tokenInfo.email());

        // 유효한 토큰인 경우 블랙리스트 추가
        if (!tokenInfo.isExpired() && tokenInfo.jti() != null && tokenInfo.remainingTime() > 0) {
            redisService.set(BLACKLIST_PREFIX + tokenInfo.jti(), "logout", tokenInfo.remainingTime() / 1000);
        }

        log.info("로그아웃 처리 완료: email={}, isExpired={}", tokenInfo.email(), tokenInfo.isExpired());
    }

    /**
     * 비밀번호 재설정용 OTP 발송
     * POST /api/auth/password/otp
     */
    public void sendPasswordResetOtp(SendOtpRequest request) {
        // 가입된 이메일인지 확인
        if (!userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.PASSWORD_RESET_NOT_FOUND);
        }
        verificationService.sendCode(request.getEmail(), VerificationType.PASSWORD_RESET);
    }

    /**
     * 비밀번호 재설정용 OTP 검증
     * POST /api/auth/password/verify
     */
    public String verifyPasswordResetOtp(VerifyOtpRequest request) {
        String email = request.getEmail();
        verificationService.verifyCode(email, request.getCode(), VerificationType.PASSWORD_RESET);

        // 인증 성공 -> 임시 토큰(UUID) 생성 및 저장 (TTL 30분)
        String token = java.util.UUID.randomUUID().toString();
        redisService.set(PW_RESET_VERIFIED_PREFIX + email, token, 1800);

        return token;
    }

    /**
     * 비밀번호 재설정 실행
     * POST /api/auth/password/reset
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request, String token) {
        String email = request.getEmail();
        String verifiedKey = PW_RESET_VERIFIED_PREFIX + email;

        // 인증 완료 여부 및 토큰 일치 확인
        String storedToken = redisService.get(verifiedKey);
        if (storedToken == null || !storedToken.equals(token)) {
            throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 비밀번호 업데이트
        user.updatePassword(passwordEncoder.encode(request.getNewPassword()));

        // Redis 키 정리
        redisService.delete(verifiedKey);
        log.info("비밀번호 재설정 완료: {}", email);
    }
}
