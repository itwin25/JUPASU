package com.a505.jupasu.domain.wine.repository;


import com.a505.jupasu.domain.wine.entity.WineFoodPairing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface WineFoodPairingRepository extends JpaRepository<WineFoodPairing, Long> {

    /**
     * 와인 아이디 기반 페어링 음식 목록 조회
     * @param wineId
     * @return foodName
     */
    @Query("SELECT wf.food.name FROM WineFoodPairing wf WHERE wf.wine.id = :wineId")
    List<String> findFoodNamesByWineId(@Param("wineId") Long wineId);

    /**
     * 여러 와인 아이디 기반 페어링 음식 목록 조회
     * @param wineIds
     * @return List of [wineId, foodName]
     */
    @Query("SELECT wf.wine.id, wf.food.name FROM WineFoodPairing wf WHERE wf.wine.id IN :wineIds")
    List<Object[]> findFoodNamesByWineIds(@Param("wineIds") Collection<Long> wineIds);
}
