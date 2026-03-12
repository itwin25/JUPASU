package com.a505.jupasu.domain.friend.repository;

import com.a505.jupasu.domain.friend.entity.Friend;
import com.a505.jupasu.domain.friend.entity.FriendStatus;
import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // 특정 유저가 신청자이거나 수신자인 모든 친구 관계를 조회
    @Query("SELECT f FROM Friend f WHERE f.requester = :user OR f.receiver = :user")
    List<Friend> findAllByRequesterOrReceiver(@Param("user") User user);

    // 탈퇴하는 사용자와 관련된 모든 친구 관계(신청한 것 + 받은 것) 삭제
    void deleteByRequesterOrReceiver(User requester, User receiver);
}
