package com.a505.jupasu.domain.wine.entity.vo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QWinePriceAndRating is a Querydsl query type for WinePriceAndRating
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QWinePriceAndRating extends BeanPath<WinePriceAndRating> {

    private static final long serialVersionUID = 1496896929L;

    public static final QWinePriceAndRating winePriceAndRating = new QWinePriceAndRating("winePriceAndRating");

    public final NumberPath<Double> averageRating = createNumber("averageRating", Double.class);

    public final BooleanPath isRealPrice = createBoolean("isRealPrice");

    public final BooleanPath isRealRating = createBoolean("isRealRating");

    public final NumberPath<Integer> price = createNumber("price", Integer.class);

    public QWinePriceAndRating(String variable) {
        super(WinePriceAndRating.class, forVariable(variable));
    }

    public QWinePriceAndRating(Path<? extends WinePriceAndRating> path) {
        super(path.getType(), path.getMetadata());
    }

    public QWinePriceAndRating(PathMetadata metadata) {
        super(WinePriceAndRating.class, metadata);
    }

}

