package com.a505.jupasu.domain.scrap.repository;

import com.a505.jupasu.domain.scrap.entity.WineScrap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WineScrapRepository extends JpaRepository<WineScrap, Long> {

    Optional<WineScrap> findByUserIdAndWineId(Long userId, Long wineId);
}
