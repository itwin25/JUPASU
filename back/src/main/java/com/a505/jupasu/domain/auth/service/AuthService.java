package com.a505.jupasu.domain.auth.service;

import com.a505.jupasu.domain.auth.dto.request.SendOtpRequest;
import com.a505.jupasu.domain.auth.dto.request.SignupRequest;
import com.a505.jupasu.domain.auth.dto.request.VerifyOtpRequest;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.redis.RedisService;
import java.security.SecureRandom;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.script.RedisScript;
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

    // Redis Key Prefix
    private static final String CODE_PREFIX     = "verify:code:";
    private static final String ATTEMPTS_PREFIX = "verify:attempts:";
    private static final String RESEND_PREFIX   = "resend:lock:";
    private static final String VERIFIED_PREFIX = "verified:email:";

    // Redis Lua Script — 2개 키 원자적 SET
    private static final RedisScript<Long> STORE_OTP_SCRIPT = RedisScript.of(
        "redis.call('SETEX', KEYS[1], tonumber(ARGV[1]), ARGV[2]) " +
        "redis.call('SETEX', KEYS[2], tonumber(ARGV[1]), '0') "    +
        "return 1",
        Long.class
    );

    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository        userRepository;
    private final RedisService          redisService;
    private final StringRedisTemplate   stringRedisTemplate;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService          emailService;

    // 이메일 / 닉네임 중복 확인
    public void checkEmailDuplicate(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new CustomException(ErrorCode.EXISTING_EMAIL);
        }
    }


    public void checkNicknameDuplicate(String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            throw new CustomException(ErrorCode.EXISTING_NICKNAME);
        }
    }


    // POST /api/auth/otp/send — OTP 발송
    public void sendOtp(SendOtpRequest request) {
        // 이미 가입된 이메일인지 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EXISTING_EMAIL);
        }

        // 재전송 쿨타임(60초) 확인 및 락 설정
        String resendKey = RESEND_PREFIX + request.getEmail();
        boolean locked = redisService.setIfAbsent(resendKey, "1", 60);
        if (!locked) {
            throw new CustomException(ErrorCode.SIGNUP_EMAIL_SEND_TOO_SOON);
        }

        String code = generateOtp();

        // Lua Script로 2개 키 원자적 저장 (code, attempts)
        storeOtpKeys(request.getEmail(), code);

        // @Async 이메일 발송
        emailService.sendOtpEmail(request.getEmail(), code);
    }


    // POST /api/auth/otp/verify — OTP 검증 (DB 저장 안 함)
    public void verifyOtp(VerifyOtpRequest request) {
        String email       = request.getEmail();
        String codeKey     = CODE_PREFIX     + email;
        String attemptsKey = ATTEMPTS_PREFIX + email;
        String resendKey   = RESEND_PREFIX   + email;

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
            int remaining = (int) (MAX_ATTEMPTS - (attempts - 1));
            throw new CustomException(
                ErrorCode.OTP_INVALID,
                "(남은 시도: " + remaining + "회)"
            );
        }

        // 인증 성공 → "verified" 플래그 저장 (TTL 30분)
        redisService.setIfAbsent(VERIFIED_PREFIX + email, "true", 1800);

        // OTP 관련 키만 정리
        redisService.deletePipelined(List.of(codeKey, attemptsKey, resendKey));

        log.info("이메일 인증 완료: {}", email);
    }


    // POST /api/auth/signup — 회원가입 (DB INSERT)
    @Transactional
    public void signup(SignupRequest request) {
        String email = request.getEmail();
        String verifiedKey = VERIFIED_PREFIX + email;

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


    // 내부 유틸
    private void storeOtpKeys(String email, String code) {
        stringRedisTemplate.execute(
            STORE_OTP_SCRIPT,
            List.of(CODE_PREFIX + email, ATTEMPTS_PREFIX + email),
            "300", code
        );
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }
}
