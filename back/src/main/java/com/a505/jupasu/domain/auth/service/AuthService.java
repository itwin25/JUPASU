package com.a505.jupasu.domain.auth.service;

import com.a505.jupasu.domain.auth.dto.request.SendOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignupRequest;
import com.a505.jupasu.domain.auth.dto.request.VerifyOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignInRequest;
import com.a505.jupasu.domain.auth.dto.response.SignInResponse;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.redis.RedisService;
import com.a505.jupasu.global.security.jwt.JwtTokenProvider;
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
    private final com.a505.jupasu.domain.auth.util.AuthUtils authUtils;


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

        // 재전송 쿨타임(60초) 확인 및 락 설정
        String resendKey = com.a505.jupasu.domain.auth.util.AuthRedisConstants.RESEND_PREFIX + request.getEmail();
        boolean locked = redisService.setIfAbsent(resendKey, "1", 60);
        if (!locked) {
            throw new CustomException(ErrorCode.SIGNUP_EMAIL_SEND_TOO_SOON);
        }

        String code = authUtils.generateOtp();

        // Lua Script로 2개 키 원자적 저장 (code, attempts)
        storeOtpKeys(request.getEmail(), code);

        // @Async 이메일 발송
        emailService.sendOtpEmail(request.getEmail(), code);
    }


    /**
     * OTP 검증
     * POST /api/auth/otp/verify
     * @param request
     */
    public void verifyOtp(VerifyOtpRequest request) {
        String email       = request.getEmail();
        String codeKey     = com.a505.jupasu.domain.auth.util.AuthRedisConstants.CODE_PREFIX     + email;
        String attemptsKey = com.a505.jupasu.domain.auth.util.AuthRedisConstants.ATTEMPTS_PREFIX + email;
        String resendKey   = com.a505.jupasu.domain.auth.util.AuthRedisConstants.RESEND_PREFIX   + email;

        // OTP 존재 확인
        String storedCode = redisService.get(codeKey);
        if (storedCode == null) {
            throw new CustomException(ErrorCode.OTP_EXPIRED_OR_INVALID);
        }

        // 시도 횟수 증가
        Long attempts = redisService.increment(attemptsKey);
        if (attempts >= 6) {
            redisService.deletePipelined(List.of(codeKey, attemptsKey, resendKey));
            throw new CustomException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
        }

        // 코드 검증
        if (!storedCode.equals(request.getCode())) {
            int remaining = (int) (com.a505.jupasu.domain.auth.util.AuthRedisConstants.MAX_OTP_ATTEMPTS - (attempts - 1));
            throw new CustomException(
                ErrorCode.OTP_INVALID,
                "(남은 시도: " + remaining + "회)"
            );
        }

        // 인증 성공 → "verified" 플래그 저장 (TTL 30분)
        redisService.setIfAbsent(com.a505.jupasu.domain.auth.util.AuthRedisConstants.VERIFIED_PREFIX + email, "true", 1800);

        // OTP 관련 키만 정리
        redisService.deletePipelined(List.of(codeKey, attemptsKey, resendKey));

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
        String verifiedKey = com.a505.jupasu.domain.auth.util.AuthRedisConstants.VERIFIED_PREFIX + email;

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
     * 로그인 - AT, RT 발급
     * POST /api/auth/signin
     * @param request
     * @return
     */
    @Transactional(readOnly = true)
    public SignInResponse signIn(SignInRequest request) {
        String email = request.getEmail();
        String lockoutKey = com.a505.jupasu.domain.auth.util.AuthRedisConstants.LOCKOUT_PREFIX + email;

        // 계정 잠김 체크 (redis에서 수행)
        String lockoutCountStr = redisService.get(lockoutKey);

        if (lockoutCountStr != null && Integer.parseInt(lockoutCountStr) >= 5) {
            throw new CustomException(ErrorCode.ACCOUNT_LOCKED);
        }

        // 유저 및 암호 검증
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 비밀번호 오류
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // increment & expire 동시 호출
            redisService.increment(lockoutKey);
            redisService.expire(lockoutKey, 1800);
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        // 로그인 성공 -> 실패 기록 정리 및 토큰 발급
        redisService.delete(lockoutKey);

        String accessToken = jwtTokenProvider.createAccessToken(email);
        String refreshToken = jwtTokenProvider.createRefreshToken(email);

        // Redis에 Refresh Token 저장 (TTL: 7일)
        redisService.set(com.a505.jupasu.domain.auth.util.AuthRedisConstants.RT_PREFIX + email, refreshToken, 604800);

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

        // RT 삭제
        redisService.delete(com.a505.jupasu.domain.auth.util.AuthRedisConstants.RT_PREFIX + tokenInfo.email());

        // 유효한 토큰인 경우 블랙리스트 추가
        if (!tokenInfo.isExpired() && tokenInfo.jti() != null && tokenInfo.remainingTime() > 0) {
            redisService.set(com.a505.jupasu.domain.auth.util.AuthRedisConstants.BLACKLIST_PREFIX + tokenInfo.jti(), "logout", tokenInfo.remainingTime() / 1000);
        }

        log.info("로그아웃 처리 완료: email={}, isExpired={}", tokenInfo.email(), tokenInfo.isExpired());
    }

    // 내부 유틸
    private void storeOtpKeys(String email, String code) {
        stringRedisTemplate.execute(
            com.a505.jupasu.domain.auth.util.AuthRedisConstants.STORE_OTP_SCRIPT,
            List.of(com.a505.jupasu.domain.auth.util.AuthRedisConstants.CODE_PREFIX + email, com.a505.jupasu.domain.auth.util.AuthRedisConstants.ATTEMPTS_PREFIX + email),
            "300", code
        );
    }
}
