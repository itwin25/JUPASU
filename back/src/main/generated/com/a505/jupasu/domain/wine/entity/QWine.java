package com.a505.jupasu.domain.wine.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QWine is a Querydsl query type for Wine
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWine extends EntityPathBase<Wine> {

    private static final long serialVersionUID = 1751479409L;

    public static final QWine wine = new QWine("wine");

    public final com.a505.jupasu.global.common.entity.QBaseEntity _super = new com.a505.jupasu.global.common.entity.QBaseEntity(this);

    public final NumberPath<Float> acidity = createNumber("acidity", Float.class);

    public final NumberPath<Float> alcoholDegree = createNumber("alcoholDegree", Float.class);

    public final NumberPath<Double> averageRating = createNumber("averageRating", Double.class);

    public final NumberPath<Float> body = createNumber("body", Float.class);

    public final StringPath country = createString("country");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath description = createString("description");

    public final StringPath grapeVariety = createString("grapeVariety");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath imageUrl = createString("imageUrl");

    public final StringPath nameEn = createString("nameEn");

    public final StringPath nameKr = createString("nameKr");

    public final NumberPath<Integer> price = createNumber("price", Integer.class);

    public final StringPath region = createString("region");

    public final StringPath summary = createString("summary");

    public final NumberPath<Float> sweetness = createNumber("sweetness", Float.class);

    public final NumberPath<Float> tannin = createNumber("tannin", Float.class);

    public final EnumPath<WineType> type = createEnum("type", WineType.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final StringPath winery = createString("winery");

    public QWine(String variable) {
        super(Wine.class, forVariable(variable));
    }

    public QWine(Path<? extends Wine> path) {
        super(path.getType(), path.getMetadata());
    }

    public QWine(PathMetadata metadata) {
        super(Wine.class, metadata);
    }

}

