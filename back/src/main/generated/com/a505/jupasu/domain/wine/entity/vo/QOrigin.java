package com.a505.jupasu.domain.wine.entity.vo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QOrigin is a Querydsl query type for Origin
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QOrigin extends BeanPath<Origin> {

    private static final long serialVersionUID = -861569837L;

    public static final QOrigin origin = new QOrigin("origin");

    public final StringPath country = createString("country");

    public final BooleanPath isRealCountry = createBoolean("isRealCountry");

    public final BooleanPath isRealRegion = createBoolean("isRealRegion");

    public final BooleanPath isRealWinery = createBoolean("isRealWinery");

    public final StringPath region = createString("region");

    public final StringPath winery = createString("winery");

    public QOrigin(String variable) {
        super(Origin.class, forVariable(variable));
    }

    public QOrigin(Path<? extends Origin> path) {
        super(path.getType(), path.getMetadata());
    }

    public QOrigin(PathMetadata metadata) {
        super(Origin.class, metadata);
    }

}

