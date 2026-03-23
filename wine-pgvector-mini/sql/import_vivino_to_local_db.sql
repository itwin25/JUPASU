BEGIN;

TRUNCATE TABLE wine_food_pairing, wine, food RESTART IDENTITY CASCADE;

CREATE TEMP TABLE staging_wine_raw (
    ord BIGINT PRIMARY KEY,
    payload JSONB NOT NULL
);

INSERT INTO staging_wine_raw (ord, payload)
SELECT ordinality::bigint, item
FROM jsonb_array_elements(pg_read_file('/tmp/vivino_ultra_results_kr_food.json')::jsonb) WITH ORDINALITY AS src(item, ordinality);

INSERT INTO wine (
    created_at,
    updated_at,
    alcohol_degree,
    description,
    grape_variety,
    image_url,
    is_real_alcohol_degree,
    is_real_name_en,
    is_real_name_kr,
    name_en,
    name_kr,
    country,
    is_real_country,
    is_real_region,
    is_real_winery,
    region,
    winery,
    average_rating,
    is_real_price,
    is_real_rating,
    price,
    style,
    acidity,
    body,
    is_real_acidity,
    is_real_body,
    is_real_sweetness,
    is_real_tannin,
    sweetness,
    tannin,
    type
)
SELECT
    NOW(),
    NOW(),
    CASE
        WHEN COALESCE(payload #>> '{all_facts,Alcohol content}', '') ~ '[0-9]'
            THEN NULLIF(REGEXP_REPLACE(payload #>> '{all_facts,Alcohol content}', '[^0-9.]', '', 'g'), '')::REAL
        ELSE 13.0
    END,
    NULLIF(payload ->> 'description', ''),
    NULLIF(payload #>> '{all_facts,Grapes}', ''),
    NULL,
    CASE
        WHEN COALESCE(payload #>> '{all_facts,Alcohol content}', '') = '' THEN FALSE
        ELSE TRUE
    END,
    CASE
        WHEN COALESCE(payload ->> 'wine_name', '') = '' THEN FALSE
        ELSE TRUE
    END,
    CASE
        WHEN COALESCE(payload ->> 'name_kr', '') = '' THEN FALSE
        ELSE TRUE
    END,
    NULLIF(payload ->> 'wine_name', ''),
    NULLIF(payload ->> 'name_kr', ''),
    NULLIF(payload ->> 'country', ''),
    CASE
        WHEN COALESCE(payload ->> 'country', '') = '' THEN FALSE
        ELSE TRUE
    END,
    CASE
        WHEN COALESCE(COALESCE(payload ->> 'region', payload #>> '{all_facts,Region}'), '') = '' THEN FALSE
        ELSE TRUE
    END,
    CASE
        WHEN COALESCE(COALESCE(payload ->> 'winery', payload #>> '{all_facts,Winery}'), '') = '' THEN FALSE
        ELSE TRUE
    END,
    NULLIF(COALESCE(payload ->> 'region', payload #>> '{all_facts,Region}'), ''),
    NULLIF(COALESCE(payload ->> 'winery', payload #>> '{all_facts,Winery}'), ''),
    CASE
        WHEN COALESCE(payload #>> '{ratings,average}', '') ~ '[0-9]'
            THEN NULLIF(payload #>> '{ratings,average}', '')::DOUBLE PRECISION
        ELSE 0.0
    END,
    CASE
        WHEN COALESCE(payload ->> 'price', '') ~ '[0-9]' THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN COALESCE(payload #>> '{ratings,average}', '') ~ '[0-9]' THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN COALESCE(payload ->> 'price', '') ~ '[0-9]'
            THEN NULLIF(REGEXP_REPLACE(payload ->> 'price', '[^0-9]', '', 'g'), '')::INTEGER
        ELSE 0
    END,
    NULLIF(payload #>> '{all_facts,Wine style}', ''),
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,acidity}', '') ~ '[0-9]'
            THEN NULLIF(REGEXP_REPLACE(payload #>> '{taste_profile,acidity}', '[^0-9.]', '', 'g'), '')::REAL / 20.0
        ELSE 3.0
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,boldness}', '') ~ '[0-9]'
            THEN NULLIF(REGEXP_REPLACE(payload #>> '{taste_profile,boldness}', '[^0-9.]', '', 'g'), '')::REAL / 20.0
        ELSE 3.0
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,acidity}', '') ~ '[0-9]' THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,boldness}', '') ~ '[0-9]' THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,sweetness}', '') ~ '[0-9]' THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,tannic}', '') ~ '[0-9]' THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,sweetness}', '') ~ '[0-9]'
            THEN NULLIF(REGEXP_REPLACE(payload #>> '{taste_profile,sweetness}', '[^0-9.]', '', 'g'), '')::REAL / 20.0
        ELSE 3.0
    END,
    CASE
        WHEN COALESCE(payload #>> '{taste_profile,tannic}', '') ~ '[0-9]'
            THEN NULLIF(REGEXP_REPLACE(payload #>> '{taste_profile,tannic}', '[^0-9.]', '', 'g'), '')::REAL / 20.0
        ELSE 3.0
    END,
    CASE
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%WHITE%' THEN 'WHITE'
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%SPARK%' THEN 'SPARKLING'
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%ROSE%' THEN 'ROSE'
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%ROSÉ%' THEN 'ROSE'
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%DESSERT%' THEN 'DESSERT'
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%PORT%' THEN 'DESSERT'
        WHEN UPPER(COALESCE(payload ->> 'wine_type', '')) LIKE '%FORTIFIED%' THEN 'FORTIFIED'
        ELSE 'RED'
    END
FROM staging_wine_raw
ORDER BY ord;

INSERT INTO food (name)
SELECT DISTINCT TRIM(food_name)
FROM staging_wine_raw s
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(s.payload -> 'food_pairings', '[]'::jsonb)) AS f(food_name)
WHERE TRIM(food_name) <> '';

INSERT INTO wine_food_pairing (wine_id, food_id)
SELECT
    s.ord,
    f.id
FROM staging_wine_raw s
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(s.payload -> 'food_pairings', '[]'::jsonb)) AS fp(food_name)
JOIN food f ON f.name = TRIM(fp.food_name)
JOIN wine w ON w.id = s.ord;

COMMIT;
