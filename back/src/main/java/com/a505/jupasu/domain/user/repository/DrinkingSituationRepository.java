package com.a505.jupasu.domain.user.repository;

import com.a505.jupasu.domain.user.entity.DrinkingSituation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DrinkingSituationRepository extends JpaRepository<DrinkingSituation, Long> {
}
