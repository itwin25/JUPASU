package com.a505.jupasu.global.security.auth;

import com.a505.jupasu.domain.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Spring Security의 시스템 규격(UserDetails)에 맞춰
 * 우리 서비스의 User 엔티티를 포장하는 클래스입니다.
 */
@Getter
public class LoginUserCustom implements UserDetails {

    // 우리가 DB에서 가져온 실제 유저 객체를 내부에 품습니다.
    private final User user;

    public LoginUserCustom(User user) {
        this.user = user;
    }

    /**
     * 유저의 권한을 반환 (현재는 기본 USER 권한 부여)
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail(); // 로그인 아이디로 사용하는 필드를 반환
    }

    // 계정 만료, 잠금 등의 설정은 모두 true(정상)로 반환
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
