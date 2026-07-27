-- Optimize slow public-schema queries identified in the Supabase query report.
-- 1. Composite plants index for OnboardingChecklist ORDER BY createdAt
-- 2. battery_measurements(createdAt) index (index advisor recommendation)
-- 3. Push admin device filters before expensive measurement lateral joins
-- 4. Single-pass get_admin_device_filter_options

-- ============================================================
-- Indexes
-- ============================================================

DROP INDEX IF EXISTS public.plants_user_id_idx;

CREATE INDEX IF NOT EXISTS plants_user_id_created_at_idx
  ON public.plants (user_id, "createdAt");

CREATE INDEX IF NOT EXISTS battery_measurements_created_at_idx
  ON public.battery_measurements ("createdAt");

-- ============================================================
-- get_admin_devices_page: filter before lateral measurement joins
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_devices_page(
  p_serial text DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_plant_name text DEFAULT NULL,
  p_sort_column text DEFAULT 'lastSeenAt',
  p_sort_asc boolean DEFAULT false,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sort_column text;
  v_direction text;
  v_page integer;
  v_page_size integer;
  v_offset integer;
  v_result jsonb;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  v_sort_column := CASE p_sort_column
    WHEN 'serialNumber' THEN '"serialNumber"'
    WHEN 'owner_email' THEN 'owner_email'
    WHEN 'plantName' THEN '"plantName"'
    WHEN 'type' THEN 'type'
    WHEN 'lastHumidity' THEN '"lastHumidity"'
    WHEN 'lastBattery' THEN '"lastBattery"'
    WHEN 'lastSeenAt' THEN '"lastSeenAt"'
    ELSE '"lastSeenAt"'
  END;

  v_direction := CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END;
  v_page := GREATEST(p_page, 1);
  v_page_size := LEAST(GREATEST(p_page_size, 1), 100);
  v_offset := (v_page - 1) * v_page_size;

  EXECUTE format(
    $sql$
    WITH base AS (
      SELECT
        d.id,
        d."serialNumber",
        d.type,
        d.user_id,
        u.email::text AS owner_email,
        p.name AS "plantName"
      FROM public.devices d
      LEFT JOIN auth.users u ON u.id = d.user_id
      LEFT JOIN public.plants p ON p.id = d."plantId"
      WHERE ($1 IS NULL OR $1 = '' OR d."serialNumber" = $1)
        AND (
          $2 IS NULL OR $2 = ''
          OR ($2 = '__unassigned__' AND u.email IS NULL)
          OR u.email::text = $2
        )
        AND (
          $3 IS NULL OR $3 = ''
          OR ($3 = '__unassigned_plant__' AND p.name IS NULL)
          OR p.name = $3
        )
    ),
    enriched AS (
      SELECT
        b.id,
        b."serialNumber",
        b.type,
        b.user_id,
        b.owner_email,
        b."plantName",
        hm."humidityPercentage" AS "lastHumidity",
        bm."batteryPercent" AS "lastBattery",
        GREATEST(hm."createdAt", bm."createdAt") AS "lastSeenAt"
      FROM base b
      LEFT JOIN LATERAL (
        SELECT "humidityPercentage", "createdAt"
        FROM public.humidity_measurements
        WHERE "deviceId" = b.id
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) hm ON true
      LEFT JOIN LATERAL (
        SELECT "batteryPercent", "createdAt"
        FROM public.battery_measurements
        WHERE "deviceId" = b.id
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) bm ON true
    ),
    total AS (
      SELECT COUNT(*)::integer AS cnt FROM enriched
    ),
    paged AS (
      SELECT *
      FROM enriched
      ORDER BY %s %s NULLS LAST
      LIMIT $4 OFFSET $5
    )
    SELECT jsonb_build_object(
      'items', COALESCE((
        SELECT jsonb_agg(to_jsonb(p) ORDER BY %s %s NULLS LAST)
        FROM paged p
      ), '[]'::jsonb),
      'total_count', (SELECT cnt FROM total)
    )
    $sql$,
    v_sort_column,
    v_direction,
    v_sort_column,
    v_direction
  )
  INTO v_result
  USING p_serial, p_owner_email, p_plant_name, v_page_size, v_offset;

  RETURN v_result;
END;
$$;

-- ============================================================
-- get_admin_device_filter_options: single materialized CTE pass
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_device_filter_options()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  WITH device_data AS MATERIALIZED (
    SELECT
      d."serialNumber",
      u.email::text AS owner_email,
      p.name AS plant_name
    FROM public.devices d
    LEFT JOIN auth.users u ON u.id = d.user_id
    LEFT JOIN public.plants p ON p.id = d."plantId"
  )
  SELECT jsonb_build_object(
    'serials', COALESCE((
      SELECT jsonb_agg("serialNumber" ORDER BY "serialNumber")
      FROM (SELECT DISTINCT dd."serialNumber" FROM device_data dd) s
    ), '[]'::jsonb),
    'owners', COALESCE((
      SELECT jsonb_agg(email ORDER BY email)
      FROM (
        SELECT DISTINCT dd.owner_email AS email
        FROM device_data dd
        WHERE dd.owner_email IS NOT NULL
      ) o
    ), '[]'::jsonb),
    'plants', COALESCE((
      SELECT jsonb_agg(name ORDER BY name)
      FROM (
        SELECT DISTINCT dd.plant_name AS name
        FROM device_data dd
        WHERE dd.plant_name IS NOT NULL
      ) pl
    ), '[]'::jsonb),
    'has_unassigned_owner', EXISTS (
      SELECT 1 FROM device_data dd WHERE dd.owner_email IS NULL
    ),
    'has_unassigned_plant', EXISTS (
      SELECT 1 FROM device_data dd WHERE dd.plant_name IS NULL
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;
