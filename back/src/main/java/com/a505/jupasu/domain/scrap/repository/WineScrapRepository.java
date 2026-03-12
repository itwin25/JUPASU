package com.a505.jupasu.domain.scrap.repository;

import com.a505.jupasu.domain.scrap.entity.WineScrap;
import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WineScrapRepository extends JpaRepository<WineScrap, Long> {

    Optional<WineScrap> findByUserIdAndWineId(Long userId, Long wineId);

    // 탈퇴하는 유저의 스크랩 목록 삭제
    void deleteByUser(User user);
}
