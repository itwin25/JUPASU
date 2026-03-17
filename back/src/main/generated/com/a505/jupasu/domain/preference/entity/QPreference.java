package com.a505.jupasu.domain.preference.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QPreference is a Querydsl query type for Preference
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPreference extends EntityPathBase<Preference> {

    private static final long serialVersionUID = -609827307L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QPreference preference = new QPreference("preference");

    public final NumberPath<Integer> Abv = createNumber("Abv", Integer.class);

    public final NumberPath<Integer> acidity = createNumber("acidity", Integer.class);

    public final NumberPath<Integer> body = createNumber("body", Integer.class);

    public final ListPath<DrinkingSituation, EnumPath<DrinkingSituation>> drinkingSituations = this.<DrinkingSituation, EnumPath<DrinkingSituation>>createList("drinkingSituations", DrinkingSituation.class, EnumPath.class, PathInits.DIRECT2);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final ListPath<WineFlavor, EnumPath<WineFlavor>> preferredFlavors = this.<WineFlavor, EnumPath<WineFlavor>>createList("preferredFlavors", WineFlavor.class, EnumPath.class, PathInits.DIRECT2);

    public final NumberPath<Integer> preferredPriceMax = createNumber("preferredPriceMax", Integer.class);

    public final NumberPath<Integer> preferredPriceMin = createNumber("preferredPriceMin", Integer.class);

    public final ListPath<com.a505.jupasu.domain.wine.entity.WineType, EnumPath<com.a505.jupasu.domain.wine.entity.WineType>> preferredWineTypes = this.<com.a505.jupasu.domain.wine.entity.WineType, EnumPath<com.a505.jupasu.domain.wine.entity.WineType>>createList("preferredWineTypes", com.a505.jupasu.domain.wine.entity.WineType.class, EnumPath.class, PathInits.DIRECT2);

    public final StringPath preferSummary = createString("preferSummary");

    public final NumberPath<Integer> sweetness = createNumber("sweetness", Integer.class);

    public final NumberPath<Integer> tannin = createNumber("tannin", Integer.class);

    public final com.a505.jupasu.domain.user.entity.QUser user;

    public QPreference(String variable) {
        this(Preference.class, forVariable(variable), INITS);
    }

    public QPreference(Path<? extends Preference> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QPreference(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QPreference(PathMetadata metadata, PathInits inits) {
        this(Preference.class, metadata, inits);
    }

    public QPreference(Class<? extends Preference> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new com.a505.jupasu.domain.user.entity.QUser(forProperty("user")) : null;
    }

}

