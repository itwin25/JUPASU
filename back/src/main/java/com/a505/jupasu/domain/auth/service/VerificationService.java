package com.a505.jupasu.domain.auth.service;

import com.a505.jupasu.domain.auth.enums.VerificationType;
import com.a505.jupasu.domain.auth.util.AuthUtils;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.a505.jupasu.domain.auth.util.AuthRedisConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final RedisService redisService;
    private final StringRedisTemplate stringRedisTemplate;
    private final EmailService emailService;
    private final AuthUtils authUtils;

    /**
     * 인증 코드 발송 및 Redis 저장
     */
    public void sendCode(String email, VerificationType type) {
        // 1. 재전송 쿨타임(60초) 확인
        String resendKey = type.getPrefix() + RESEND_PREFIX + email;
        if (!redisService.setIfAbsent(resendKey, "1", 60)) {
            throw new CustomException(ErrorCode.SIGNUP_EMAIL_SEND_TOO_SOON);
        }

        // 2. 코드 생성
        String code = authUtils.generateOtp();

        // 3. Redis 저장 (Lua Script 사용 - 코드 및 시도횟수 초기화)
        String codeKey = type.getPrefix() + CODE_PREFIX + email;
        String attemptsKey = type.getPrefix() + ATTEMPTS_PREFIX + email;

        stringRedisTemplate.execute(
            STORE_OTP_SCRIPT,
            List.of(codeKey, attemptsKey),
            "300", code // 5분 유효
        );

        // 4. 이메일 발송
        emailService.sendOtpEmail(email, code);
        log.info("인증 코드 발송 [{}] : {}", type.name(), email);
    }

    /**
     * 인증 코드 검증
     */
    public void verifyCode(String email, String code, VerificationType type) {
        String codeKey = type.getPrefix() + CODE_PREFIX + email;
        String attemptsKey = type.getPrefix() + ATTEMPTS_PREFIX + email;
        String resendKey = type.getPrefix() + RESEND_PREFIX + email;

        // 1. 코드 존재 확인
        String storedCode = redisService.get(codeKey);
        if (storedCode == null) {
            throw new CustomException(ErrorCode.OTP_EXPIRED_OR_INVALID);
        }

        // 2. 시도 횟수 체크
        Long attempts = redisService.increment(attemptsKey);
        if (attempts > MAX_OTP_ATTEMPTS) {
            redisService.deletePipelined(List.of(codeKey, attemptsKey, resendKey));
            throw new CustomException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
        }

        // 3. 코드 비교
        if (!storedCode.equals(code)) {
            int remaining = MAX_OTP_ATTEMPTS - attempts.intValue();
            throw new CustomException(ErrorCode.OTP_INVALID, "(남은 시도: " + remaining + "회)");
        }

        // 4. 성공 시 OTP 삭제
        redisService.deletePipelined(List.of(codeKey, attemptsKey, resendKey));
        log.info("인증 성공 [{}] : {}", type.name(), email);
    }
}
