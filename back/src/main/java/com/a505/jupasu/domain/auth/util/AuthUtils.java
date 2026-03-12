package com.a505.jupasu.domain.auth.util;

import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JwtTokenProvider jwtTokenProvider;

    // OTP 생성
    public String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    // 토큰 관련 Utils
    /**
     * Authorization 헤더에서 순수 토큰 값만 추출 (Bearer 생략)
     */
    public static String extractToken(String authHeader) {
        if (org.springframework.util.StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    public record TokenInfo(String email, String jti, long remainingTime, boolean isExpired) {}

    public TokenInfo parseTokenForLogout(String accessToken) {
        try {
            Claims claims = jwtTokenProvider.getClaims(accessToken);
            return new TokenInfo(
                claims.getSubject(),
                claims.getId(),
                jwtTokenProvider.getRemainingTime(accessToken),
                false
            );
        } catch (ExpiredJwtException e) {
            if (e.getClaims() != null && e.getClaims().getSubject() != null) {
                return new TokenInfo(e.getClaims().getSubject(), null, 0, true);
            }
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
    }
}
