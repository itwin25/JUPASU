package com.a505.jupasu.domain.auth.util;

import org.springframework.data.redis.core.script.RedisScript;

/**
 * 인증 및 권한 도메인에서 사용하는 Redis Key Prefix 상수 모음
 */
public final class AuthRedisConstants {

    // 인스턴스화 방지
    private AuthRedisConstants() {
    }

    public static final String CODE_PREFIX     = "auth:verify:code:";
    public static final String ATTEMPTS_PREFIX = "auth:verify:attempts:";
    public static final String RESEND_PREFIX   = "auth:resend:lock:";
    public static final String VERIFIED_PREFIX = "auth:verified:email:";
    public static final String LOCKOUT_PREFIX  = "auth:lockout:account:";
    public static final String RT_PREFIX       = "auth:rt:";
    public static final String BLACKLIST_PREFIX = "auth:blacklist:";

    public static final int MAX_OTP_ATTEMPTS = 5;

    // Redis Lua Script — 2개 키 원자적 SET (OTP 저장용)
    public static final RedisScript<Long> STORE_OTP_SCRIPT = RedisScript.of(
        "redis.call('SETEX', KEYS[1], tonumber(ARGV[1]), ARGV[2]) " +
        "redis.call('SETEX', KEYS[2], tonumber(ARGV[1]), '0') "    +
        "return 1",
        Long.class
    );
}
