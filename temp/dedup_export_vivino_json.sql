WITH raw AS (
    SELECT ordinality::bigint AS ord, item AS payload
    FROM jsonb_array_elements(pg_read_file('/tmp/vivino_ultra_results_kr_food.json')::jsonb)
         WITH ORDINALITY AS src(item, ordinality)
),
dedup AS (
    SELECT DISTINCT ON (
        COALESCE(payload->>'wine_name', ''),
        COALESCE(payload->>'name_kr', ''),
        COALESCE(payload->>'country', ''),
        COALESCE(COALESCE(payload->>'region', payload #>> '{all_facts,Region}'), ''),
        COALESCE(COALESCE(payload->>'winery', payload #>> '{all_facts,Winery}'), '')
    )
        ord,
        payload
    FROM raw
    ORDER BY
        COALESCE(payload->>'wine_name', ''),
        COALESCE(payload->>'name_kr', ''),
        COALESCE(payload->>'country', ''),
        COALESCE(COALESCE(payload->>'region', payload #>> '{all_facts,Region}'), ''),
        COALESCE(COALESCE(payload->>'winery', payload #>> '{all_facts,Winery}'), ''),
        ord
)
SELECT jsonb_pretty(jsonb_agg(payload ORDER BY ord))::text
FROM dedup;
