package com.a505.jupasu.domain.friend.service;

import com.a505.jupasu.domain.friend.dto.request.FriendResponseRequest;
import com.a505.jupasu.domain.friend.entity.Friend;
import com.a505.jupasu.domain.friend.entity.FriendStatus;
import com.a505.jupasu.domain.friend.repository.FriendRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 친구 요청과 관련된 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FriendService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;

    /**
     * 닉네임을 통해 상대방을 찾아 친구 요청 전송
     *
     * @param requester        친구 요청을 보내는 사용자(본인) 엔티티
     * @param receiverNickname 친구 요청을 받을 상대방의 닉네임
     * @throws CustomException 대상 유저를 찾을 수 없는 경우 (USER_NOT_FOUND) 발생
     * @throws CustomException 본인에게 친구 신청을 하는 경우 (SELF_FRIEND_REQUEST) 발생
     * @throws CustomException 이미 친구 신청이 진행 중이거나 친구인 경우 (ALREADY_FRIEND_REQUESTED) 발생
     */
    @Transactional
    public void inviteFriend(User requester, String receiverNickname) {
        // 수신자 존재 여부 확인
        User receiver = userRepository.findByNickname(receiverNickname)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 자기 자신에게 신청하는지 확인
        if (requester.equals(receiver)) {
            throw new CustomException(ErrorCode.SELF_FRIEND_REQUEST);
        }

        // 이미 요청을 보낸 유저인지 확인
        if (friendRepository.findByRequesterAndReceiver(requester, receiver).isPresent()) {
            throw new CustomException(ErrorCode.ALREADY_FRIEND_REQUESTED);
        }

        Friend friend = Friend.builder()
                .requester(requester)
                .receiver(receiver)
                .status(FriendStatus.PENDING)
                .build();

        friendRepository.save(friend);
    }

    @Transactional
    public void respondToFriendRequest(User loginUser, FriendResponseRequest request) {
        // 친구 요청 데이터 조회
        Friend friend = friendRepository.findById(request.getFriendId())
                .orElseThrow(() -> new CustomException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

        // 로그인 유저와 요청을 받은 사람 비교
        if (!friend.getReceiver().getId().equals(loginUser.getId())) {
            throw new CustomException(ErrorCode.FORBIDDEN_ACCESS);
        }

        if (request.getStatus() == FriendStatus.ACCEPTED) {
            friend.accept();
        } else if (request.getStatus() == FriendStatus.REJECTED) {
            friendRepository.delete(friend);
        } else {
            throw new CustomException(ErrorCode.INVALID_FRIEND_STATUS);
        }
    }
}
