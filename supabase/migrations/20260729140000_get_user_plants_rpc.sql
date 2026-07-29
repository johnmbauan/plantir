-- Single-round-trip plant dashboard load.
-- Replaces the plants nested select + get_latest_device_measurements waterfall.
--
-- p_plant_ids NULL  → all plants owned by the caller
-- p_plant_ids set   → those ids (still scoped to caller) — used by status checks

CREATE OR REPLACE FUNCTION public.get_user_plants(p_plant_ids bigint[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(jsonb_agg(plant_row ORDER BY plant_row->>'name'), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'imageUrl', p."imageUrl",
      'createdAt', p."createdAt",
      'is_outdoor', p.is_outdoor,
      'species_id', p.species_id,
      'plant_species', CASE
        WHEN ps.id IS NULL THEN NULL
        ELSE jsonb_build_object(
          'id', ps.id,
          'source', ps.source,
          'sourceSpeciesId', ps."sourceSpeciesId",
          'scientificName', ps."scientificName",
          'displayName', ps."displayName",
          'imageUrl', ps."imageUrl",
          'minSoilMoisture', ps."minSoilMoisture",
          'maxSoilMoisture', ps."maxSoilMoisture",
          'minTemperatureCelsius', ps."minTemperatureCelsius",
          'maxTemperatureCelsius', ps."maxTemperatureCelsius",
          'sunlight', ps.sunlight,
          'soil', ps.soil,
          'watering', ps.watering,
          'fertilization', ps.fertilization,
          'pruning', ps.pruning
        )
      END,
      'devices', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', d.id,
            'serialNumber', d."serialNumber",
            'humidity_sensors_config', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'minHumidityThreshold', hsc."minHumidityThreshold",
                  'sleepDurationSeconds', hsc."sleepDurationSeconds"
                )
              )
              FROM public.humidity_sensors_config hsc
              WHERE hsc."deviceId" = d.id
            ), '[]'::jsonb),
            'humidityPercentage', hm."humidityPercentage",
            'humidity_created_at', hm."createdAt",
            'batteryPercent', bm."batteryPercent",
            'battery_created_at', bm."createdAt"
          )
          ORDER BY d.id
        )
        FROM public.devices d
        LEFT JOIN LATERAL (
          SELECT h."humidityPercentage", h."createdAt"
          FROM public.humidity_measurements h
          WHERE h."deviceId" = d.id
          ORDER BY h."createdAt" DESC
          LIMIT 1
        ) hm ON true
        LEFT JOIN LATERAL (
          SELECT b."batteryPercent", b."createdAt"
          FROM public.battery_measurements b
          WHERE b."deviceId" = d.id
          ORDER BY b."createdAt" DESC
          LIMIT 1
        ) bm ON true
        WHERE d."plantId" = p.id
          AND d.user_id = v_uid
      ), '[]'::jsonb)
    ) AS plant_row
    FROM public.plants p
    LEFT JOIN public.plant_species ps ON ps.id = p.species_id
    WHERE p.user_id = v_uid
      AND (p_plant_ids IS NULL OR p.id = ANY (p_plant_ids))
  ) plants;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_plants(bigint[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_plants(bigint[]) TO authenticated;
