package com.a505.jupasu.domain.wine.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QWineFoodPairing is a Querydsl query type for WineFoodPairing
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWineFoodPairing extends EntityPathBase<WineFoodPairing> {

    private static final long serialVersionUID = 1850492761L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QWineFoodPairing wineFoodPairing = new QWineFoodPairing("wineFoodPairing");

    public final QFood food;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QWine wine;

    public QWineFoodPairing(String variable) {
        this(WineFoodPairing.class, forVariable(variable), INITS);
    }

    public QWineFoodPairing(Path<? extends WineFoodPairing> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QWineFoodPairing(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QWineFoodPairing(PathMetadata metadata, PathInits inits) {
        this(WineFoodPairing.class, metadata, inits);
    }

    public QWineFoodPairing(Class<? extends WineFoodPairing> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.food = inits.isInitialized("food") ? new QFood(forProperty("food")) : null;
        this.wine = inits.isInitialized("wine") ? new QWine(forProperty("wine")) : null;
    }

}

