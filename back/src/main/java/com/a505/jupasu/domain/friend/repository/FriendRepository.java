package com.a505.jupasu.domain.friend.repository;

import com.a505.jupasu.domain.friend.entity.Friend;
import com.a505.jupasu.domain.friend.entity.FriendStatus;
import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Friend 엔티티에 대한 데이터 접근 기능 제공
 */
public interface FriendRepository extends JpaRepository<Friend,Long> {

    // 특정 두 사용자 사이에 이미 존재하는 친구 관계를 조회
    Optional<Friend> findByRequesterAndReceiver(User requester, User receiver);

    // 사용자와 연관된 특정 상태의 모든 친구 관계를 조회
    List<Friend> findAllByRequesterAndStatusOrReceiverAndStatus(User requester, FriendStatus status1, User receiver, FriendStatus status2);

    // 특정 상태의 수신자 데이터만 조회
    List<Friend> findAllByReceiverAndStatus(User receiver, FriendStatus status);
}
