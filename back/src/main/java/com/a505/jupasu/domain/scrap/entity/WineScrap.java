package com.a505.jupasu.domain.scrap.entity;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.global.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "wine_scrap")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WineScrap extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wine_id")
    private Wine wine;

    @Builder
    public WineScrap(User user, Wine wine){
        this.user = user;
        this.wine = wine;
    }
}
