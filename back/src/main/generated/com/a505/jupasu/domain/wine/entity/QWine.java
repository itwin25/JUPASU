package com.a505.jupasu.domain.wine.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QWine is a Querydsl query type for Wine
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWine extends EntityPathBase<Wine> {

    private static final long serialVersionUID = 1751479409L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QWine wine = new QWine("wine");

    public final com.a505.jupasu.global.common.entity.QBaseEntity _super = new com.a505.jupasu.global.common.entity.QBaseEntity(this);

    public final NumberPath<Float> alcoholDegree = createNumber("alcoholDegree", Float.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath description = createString("description");

    public final StringPath grapeVariety = createString("grapeVariety");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath imageUrl = createString("imageUrl");

    public final BooleanPath isRealAlcoholDegree = createBoolean("isRealAlcoholDegree");

    public final BooleanPath isRealNameEn = createBoolean("isRealNameEn");

    public final BooleanPath isRealNameKr = createBoolean("isRealNameKr");

    public final StringPath nameEn = createString("nameEn");

    public final StringPath nameKr = createString("nameKr");

    public final com.a505.jupasu.domain.wine.entity.vo.QOrigin origin;

    public final com.a505.jupasu.domain.wine.entity.vo.QWinePriceAndRating priceAndRating;

    public final StringPath summary = createString("summary");

    public final com.a505.jupasu.domain.wine.entity.vo.QTasteProfile tasteProfile;

    public final EnumPath<WineType> type = createEnum("type", WineType.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QWine(String variable) {
        this(Wine.class, forVariable(variable), INITS);
    }

    public QWine(Path<? extends Wine> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QWine(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QWine(PathMetadata metadata, PathInits inits) {
        this(Wine.class, metadata, inits);
    }

    public QWine(Class<? extends Wine> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.origin = inits.isInitialized("origin") ? new com.a505.jupasu.domain.wine.entity.vo.QOrigin(forProperty("origin")) : null;
        this.priceAndRating = inits.isInitialized("priceAndRating") ? new com.a505.jupasu.domain.wine.entity.vo.QWinePriceAndRating(forProperty("priceAndRating")) : null;
        this.tasteProfile = inits.isInitialized("tasteProfile") ? new com.a505.jupasu.domain.wine.entity.vo.QTasteProfile(forProperty("tasteProfile")) : null;
    }

}

