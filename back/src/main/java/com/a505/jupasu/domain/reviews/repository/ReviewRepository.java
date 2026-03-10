package com.a505.jupasu.domain.reviews.repository;

import com.a505.jupasu.domain.reviews.entity.Review;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.wine.entity.Wine;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<Review> findAllByWineIdOrderByCreatedAtDesc(Long wineId);

    boolean existsByUserAndWine(User user, Wine wine);
}
