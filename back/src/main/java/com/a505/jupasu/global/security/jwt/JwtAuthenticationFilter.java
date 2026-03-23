package com.a505.jupasu.global.security.jwt;

import com.a505.jupasu.global.redis.RedisService;
import com.a505.jupasu.global.security.auth.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.a505.jupasu.domain.auth.util.AuthUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisService redisService;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = AuthUtils.extractToken(request.getHeader("Authorization"));

        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 1. Blacklist 검사
            String jti = jwtTokenProvider.getJtiBaseOnToken(token);
            if (jti != null && redisService.exists(com.a505.jupasu.domain.auth.util.AuthRedisConstants.BLACKLIST_PREFIX + jti)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"status\": 401, \"message\": \"로그아웃된 토큰입니다.\", \"data\": null}");
                return;
            }

            // 2. 인증 객체 저장
            String email = jwtTokenProvider.getSubjectBaseOnToken(token);

            try {
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // 유저를 찾을 수 없거나 기타 인증 오류 발생 시 401 반환
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"status\": 401, \"message\": \"유효하지 않은 유저 정보입니다. 다시 로그인해주세요.\", \"data\": null}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
