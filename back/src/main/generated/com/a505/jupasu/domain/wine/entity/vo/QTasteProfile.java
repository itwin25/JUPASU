package com.a505.jupasu.domain.wine.entity.vo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QTasteProfile is a Querydsl query type for TasteProfile
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QTasteProfile extends BeanPath<TasteProfile> {

    private static final long serialVersionUID = 1733342463L;

    public static final QTasteProfile tasteProfile = new QTasteProfile("tasteProfile");

    public final NumberPath<Float> acidity = createNumber("acidity", Float.class);

    public final NumberPath<Float> body = createNumber("body", Float.class);

    public final BooleanPath isRealAcidity = createBoolean("isRealAcidity");

    public final BooleanPath isRealBody = createBoolean("isRealBody");

    public final BooleanPath isRealSweetness = createBoolean("isRealSweetness");

    public final BooleanPath isRealTannin = createBoolean("isRealTannin");

    public final NumberPath<Float> sweetness = createNumber("sweetness", Float.class);

    public final NumberPath<Float> tannin = createNumber("tannin", Float.class);

    public QTasteProfile(String variable) {
        super(TasteProfile.class, forVariable(variable));
    }

    public QTasteProfile(Path<? extends TasteProfile> path) {
        super(path.getType(), path.getMetadata());
    }

    public QTasteProfile(PathMetadata metadata) {
        super(TasteProfile.class, metadata);
    }

}

