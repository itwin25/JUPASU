package com.a505.jupasu.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WithdrawRequest {

    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String password;
}
