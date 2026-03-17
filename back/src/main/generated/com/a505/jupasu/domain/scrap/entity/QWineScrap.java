package com.a505.jupasu.domain.scrap.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QWineScrap is a Querydsl query type for WineScrap
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWineScrap extends EntityPathBase<WineScrap> {

    private static final long serialVersionUID = -1378898084L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QWineScrap wineScrap = new QWineScrap("wineScrap");

    public final com.a505.jupasu.global.common.entity.QBaseEntity _super = new com.a505.jupasu.global.common.entity.QBaseEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.a505.jupasu.domain.user.entity.QUser user;

    public final com.a505.jupasu.domain.wine.entity.QWine wine;

    public QWineScrap(String variable) {
        this(WineScrap.class, forVariable(variable), INITS);
    }

    public QWineScrap(Path<? extends WineScrap> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QWineScrap(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QWineScrap(PathMetadata metadata, PathInits inits) {
        this(WineScrap.class, metadata, inits);
    }

    public QWineScrap(Class<? extends WineScrap> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new com.a505.jupasu.domain.user.entity.QUser(forProperty("user")) : null;
        this.wine = inits.isInitialized("wine") ? new com.a505.jupasu.domain.wine.entity.QWine(forProperty("wine")) : null;
    }

}

