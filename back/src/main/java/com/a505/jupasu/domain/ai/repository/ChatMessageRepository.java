package com.a505.jupasu.domain.ai.repository;

import com.a505.jupasu.domain.ai.entity.ChatMessage;
import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * [Spring 초보자 가이드]
 * JpaRepository를 상속받으면 save(), findAll(), findById() 등 
 * 기본적인 DB 작업을 코드 없이 자동으로 처리할 수 있게 됩니다.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // 특정 유저의 채팅 내역을 시간 순서대로 가져오는 기능 추가
    List<ChatMessage> findByUserOrderByCreatedAtAsc(User user);
}
