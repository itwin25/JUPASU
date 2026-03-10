package com.a505.jupasu.domain.user.service;

import com.a505.jupasu.domain.user.dto.request.UserUpdateRequest;
import com.a505.jupasu.domain.user.dto.response.UserMyPageResponse;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User 도메인의 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * 현재 로그인한 사용자의 마이페이지 정보를 조회
     *
     * @return 마이페이지 프로필 및 통계 응답 DTO
     * @throws CustomException 사용자를 찾을 수 없는 경우 USER_NOT_FOUND 발생
     */
    public UserMyPageResponse getMyPageInfo() {
        // TODO: 추후 임시 데이터 교체 예정
        Long mockUserId = 1L;

        User user = userRepository.findById(mockUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return UserMyPageResponse.from(user);
    }

    /**
     * 사용자의 마이페이지 프로필 정보를 수정
     *
     * @param request 수정할 닉네임, 캐릭터, 비밀번호 정보를 담은 DTO
     * @throws CustomException 사용자를 찾을 수 없거나 중복된 닉네임인 경우 발생
     */
    @Transactional
    public void updateMyPageInfo(UserUpdateRequest request) {
        // TODO: 추후 변경 예정
        User user = userRepository.findById(1L)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 닉네임이 변경된 경우에만 중복 검증 및 업데이트 수행
        if (request.getNickname() != null && !request.getNickname().equals(user.getNickname())) {
            validateNickname(request.getNickname());
            user.updateNickname(request.getNickname());
        }

        // 캐릭터 정보 업데이트
        if(request.getCharacter() != null && !request.getCharacter().equals(user.getCharacter())) {
            user.updateCharacter(request.getCharacter());
        }

        System.out.println("입력된 비번: " + request.getCurrentPassword());
        System.out.println("DB에서 온 비번: " + user.getPasswordHash());
        System.out.println(passwordEncoder.encode(request.getCurrentPassword()));
        System.out.println("일치 여부: " + passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash()));
        // 비밀번호 업데이트
        if(request.getNewPassword() != null) {
            updatePassword(user, request.getCurrentPassword(), request.getNewPassword(), request.getConfirmNewPassword());
        }
    }

    /**
     * 사용자의 현재 비밀번호를 확인하고, 새 비밀번호의 유효성 및 일치 여부를 검증한 뒤 암호화하여 업데이트
     *
     * @param user           비밀번호를 변경할 대상 사용자 엔티티
     * @param currentPw      본인 확인을 위해 입력받은 현재 비밀번호 (평문)
     * @param newPw          새로 설정할 비밀번호 (평문, 대문자/숫자/특수문자 포함 8자 이상)
     * @param confirmNewPw   입력한 새 비밀번호가 정확한지 확인하기 위한 재입력 값
     * @throws CustomException 현재 비밀번호가 데이터베이스에 저장된 해시값과 일치하지 않는 경우 (INVALID_CURRENT_PASSWORD) 발생
     * @throws CustomException 새 비밀번호가 정해진 보안 규칙을 준수하지 않는 경우 (INVALID_PASSWORD_FORMAT) 발생
     * @throws CustomException 새 비밀번호와 재입력한 비밀번호가 서로 일치하지 않는 경우 (PASSWORD_CONFIRM_NOT_MATCHED) 발생
     */
    private void updatePassword(User user, String currentPw, String newPw, String confirmNewPw) {
        // 현재 비밀번호 일치 확인
        if (currentPw == null || !passwordEncoder.matches(currentPw, user.getPasswordHash())) {
            throw new CustomException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }

        // 새 비밀번호 유효성 검증
        validatePassword(newPw);

        // 새 비밀번호와 재입력 확인
        if (!newPw.equals(confirmNewPw)) {
            throw new CustomException(ErrorCode.PASSWORD_CONFIRM_NOT_MATCHED);
        }

        // 새 비밀번호 저장
        String encodedPassword = passwordEncoder.encode(newPw);
        user.updatePassword(encodedPassword);
    }

    /**
     * 닉네임 중복 및 유효성을 검사하는 공통 메서드
     * @param nickname 검사할 닉네임
     * @throws CustomException 닉네임 형식이 올바르지 않은 경우 (INVALID_NICKNAME_FORMAT) 발생
     * @throws CustomException 중복된 경우 DUPLICATE_NICKNAME 발생
     */
    private void validateNickname(String nickname) {
        String nicknameRegex = "^[가-힣a-zA-Z0-9]{2,20}$";

        // 닉네임 유효성 검사
        if (nickname == null || !nickname.matches(nicknameRegex)) {
            throw new CustomException(ErrorCode.INVALID_NICKNAME_FORMAT);
        }

        // 닉네임 중복 검사
        if (userRepository.existsByNickname(nickname)) {
            throw new CustomException(ErrorCode.EXISTING_NICKNAME);
        }
    }

    /**
     * 비밀번호의 유효성(형식)을 검증
     *
     * @param password 검증할 새 비밀번호 (최소 8자, 대문자, 숫자, 특수문자 각 1개 이상 포함)
     * @throws CustomException 비밀번호 형식이 올바르지 않은 경우 (INVALID_PASSWORD_FORMAT) 발생
     */
    private void validatePassword(String password) {
        String passwordRegex = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[\\p{Punct}]).{8,}$";

        if(password == null || !password.matches(passwordRegex)) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD_FORMAT);
        }
    }
}
