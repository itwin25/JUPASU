package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.entity.TasteGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface TasteGroupRepository extends JpaRepository<TasteGroup, Long>{
    Optional<TasteGroup> findByName(String name);
}
