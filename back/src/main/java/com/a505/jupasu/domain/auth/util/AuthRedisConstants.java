package com.a505.jupasu.domain.auth.util;

import org.springframework.data.redis.core.script.RedisScript;

/**
 * 인증 및 권한 도메인에서 사용하는 Redis Key Prefix 상수 모음
 */
public final class AuthRedisConstants {

    // 인스턴스화 방지
    private AuthRedisConstants() {
    }

    public static final String CODE_PREFIX      = "code:";
    public static final String ATTEMPTS_PREFIX  = "attempts:";
    public static final String RESEND_PREFIX    = "resend:lock:";
    public static final String SIGNUP_VERIFIED_PREFIX = "auth:verified:signup:";
    public static final String PW_RESET_VERIFIED_PREFIX = "auth:verified:pw-reset:";
    public static final String LOCKOUT_PREFIX   = "auth:lockout:account:";
    public static final String RT_PREFIX        = "auth:rt:";
    public static final String BLACKLIST_PREFIX = "auth:blacklist:";

    public static final int MAX_OTP_ATTEMPTS = 5;
    public static final int MAX_LOGIN_ATTEMPTS = 5;
    public static final long LOCKOUT_TTL_SECONDS = 1800;  // 잠금 시간: 30분
    public static final long COUNTER_TTL_SECONDS = 1800;  // 카운터 유지 시간: 30분 (미초과 시 자동 정리)



    /**
     * OTP 코드와 시도 횟수 카운터를 하나의 트랜잭션으로 처리
     * 두 키가 항상 동일한 TTL로 함께 생성되는 것을 보장
     * - KEYS[1] : OTP 코드 키    예) "signup:code:{email}"
     * - KEYS[2] : 시도 횟수 키  예) "signup:attempts:{email}"
     * - ARGV[1] : TTL 초         예) "300" (5분)
     * - ARGV[2] : OTP 코드 값   예) "482910"
     * - 반환값  : 항상 1 (성공)
     */
    public static final RedisScript<Long> STORE_OTP_SCRIPT = RedisScript.of(
        "redis.call('SETEX', KEYS[1], tonumber(ARGV[1]), ARGV[2]) " +
        "redis.call('SETEX', KEYS[2], tonumber(ARGV[1]), '0') "    +
        "return 1",
        Long.class
    );

    /**
     * 로그인 실패 횟수를 관리
     * - 1 ~ (MAX-1)회 실패 : INCR 후 카운터 TTL(2h)을 첫 실패 시 한 번만 설정
     *                        → 2시간 안에 임계값에 안 도달하면 키가 자동 삭제됨
     * - MAX회 실패          : INCR 후 TTL을 30분으로 리셋 (마지막 로그인 시도로부터 30분)
     *
     * - KEYS[1] : lockout 키 - auth:lockout:account:{email}
     * - ARGV[1] : 임계값 - 5
     * - ARGV[2] : 잠금 TTL 초 - 1800 (30분)
     * - ARGV[3] : 카운터 TTL 초 - 7200(2시간)
     * - 반환값  : 증가 후 현재 카운트
     */
    public static final RedisScript<Long> LOGIN_LOCKOUT_SCRIPT = RedisScript.of(
        "local count = redis.call('INCR', KEYS[1]) " +
        "if count == 1 then " +
        "  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3])) " +
        "end " +
        "if count >= tonumber(ARGV[1]) then " +
        "  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2])) " +
        "end " +
        "return count",
        Long.class
    );
}
