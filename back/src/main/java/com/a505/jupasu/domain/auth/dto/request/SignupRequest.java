package com.a505.jupasu.domain.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 255, message = "이메일은 255자 이하여야 합니다.")
    private String email;

    /**
     * 최소 8자, 대문자·숫자·특수문자 각 1개 이상 포함
     */
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "비밀번호는 8자 이상이며 대문자, 숫자, 특수문자를 포함해야 합니다."
    )
    private String password;

    /**
     * 한글, 알파벳, 숫자, 2~20자
     */
    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다.")
    @Pattern(
        regexp = "^[가-힣a-zA-Z0-9]{2,20}$",
        message = "닉네임은 한글, 영문, 숫자만 사용 가능합니다."
    )
    private String nickname;
}
