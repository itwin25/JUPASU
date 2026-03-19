package com.a505.jupasu.domain.report.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTasteReport is a Querydsl query type for TasteReport
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTasteReport extends EntityPathBase<TasteReport> {

    private static final long serialVersionUID = 1848069304L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTasteReport tasteReport = new QTasteReport("tasteReport");

    public final NumberPath<Double> avgAcidity = createNumber("avgAcidity", Double.class);

    public final NumberPath<Double> avgAlcohol = createNumber("avgAlcohol", Double.class);

    public final NumberPath<Double> avgBody = createNumber("avgBody", Double.class);

    public final NumberPath<Double> avgSweetness = createNumber("avgSweetness", Double.class);

    public final NumberPath<Double> avgTannin = createNumber("avgTannin", Double.class);

    public final StringPath bestDescription = createString("bestDescription");

    public final StringPath content = createString("content");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath mainTitle = createString("mainTitle");

    public final StringPath tasteTypeTag = createString("tasteTypeTag");

    public final com.a505.jupasu.domain.user.entity.QUser user;

    public final StringPath worstDescription = createString("worstDescription");

    public QTasteReport(String variable) {
        this(TasteReport.class, forVariable(variable), INITS);
    }

    public QTasteReport(Path<? extends TasteReport> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTasteReport(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTasteReport(PathMetadata metadata, PathInits inits) {
        this(TasteReport.class, metadata, inits);
    }

    public QTasteReport(Class<? extends TasteReport> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new com.a505.jupasu.domain.user.entity.QUser(forProperty("user")) : null;
    }

}

