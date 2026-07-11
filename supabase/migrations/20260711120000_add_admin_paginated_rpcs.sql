-- Paginated admin list RPCs for server-side table pagination, sorting, and filtering.

CREATE OR REPLACE FUNCTION public.get_admin_devices_page(
  p_search text DEFAULT '',
  p_sort_column text DEFAULT 'lastSeenAt',
  p_sort_asc boolean DEFAULT false,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 25
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
    WITH enriched AS (
      SELECT
        d.id,
        d."serialNumber",
        d.type,
        d.user_id,
        u.email::text AS owner_email,
        p.name AS "plantName",
        hm."humidityPercentage" AS "lastHumidity",
        bm."batteryPercent" AS "lastBattery",
        GREATEST(hm."createdAt", bm."createdAt") AS "lastSeenAt"
      FROM public.devices d
      LEFT JOIN auth.users u ON u.id = d.user_id
      LEFT JOIN public.plants p ON p.id = d."plantId"
      LEFT JOIN LATERAL (
        SELECT "humidityPercentage", "createdAt"
        FROM public.humidity_measurements
        WHERE "deviceId" = d.id
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) hm ON true
      LEFT JOIN LATERAL (
        SELECT "batteryPercent", "createdAt"
        FROM public.battery_measurements
        WHERE "deviceId" = d.id
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) bm ON true
    ),
    filtered AS (
      SELECT *
      FROM enriched
      WHERE $1 = ''
        OR "serialNumber" ILIKE '%%' || $1 || '%%'
        OR COALESCE(owner_email, '') ILIKE '%%' || $1 || '%%'
        OR COALESCE("plantName", '') ILIKE '%%' || $1 || '%%'
    ),
    total AS (
      SELECT COUNT(*)::integer AS cnt FROM filtered
    ),
    paged AS (
      SELECT *
      FROM filtered
      ORDER BY %s %s NULLS LAST
      LIMIT $2 OFFSET $3
    )
    SELECT jsonb_build_object(
      'items', COALESCE((SELECT jsonb_agg(to_jsonb(paged)) FROM paged), '[]'::jsonb),
      'total_count', (SELECT cnt FROM total)
    )
    $sql$,
    v_sort_column,
    v_direction
  )
  INTO v_result
  USING p_search, v_page_size, v_offset;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_logs_page(
  p_serial text DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_sort_column text DEFAULT 'createdAt',
  p_sort_asc boolean DEFAULT false,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sort_expr text;
  v_direction text;
  v_page integer;
  v_page_size integer;
  v_offset integer;
  v_result jsonb;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  v_sort_expr := CASE p_sort_column
    WHEN 'serialNumber' THEN '"serialNumber"'
    WHEN 'level' THEN 'CASE level WHEN ''error'' THEN 0 WHEN ''warning'' THEN 1 WHEN ''info'' THEN 2 ELSE 99 END'
    WHEN 'message' THEN 'message'
    ELSE '"createdAt"'
  END;

  v_direction := CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END;
  v_page := GREATEST(p_page, 1);
  v_page_size := LEAST(GREATEST(p_page_size, 1), 100);
  v_offset := (v_page - 1) * v_page_size;

  EXECUTE format(
    $sql$
    WITH filtered AS (
      SELECT
        dl.id,
        dl."serialNumber",
        dl.level,
        dl.message,
        dl."createdAt"
      FROM public.device_logs dl
      WHERE ($1 IS NULL OR $1 = '' OR dl."serialNumber" = $1)
        AND (
          $2 IS NULL OR $2 = ''
          OR ($2 = '__unassigned__' AND dl."serialNumber" IN (
            SELECT d."serialNumber"
            FROM public.devices d
            LEFT JOIN auth.users u ON u.id = d.user_id
            WHERE u.email IS NULL
          ))
          OR dl."serialNumber" IN (
            SELECT d."serialNumber"
            FROM public.devices d
            LEFT JOIN auth.users u ON u.id = d.user_id
            WHERE u.email = $2
          )
        )
        AND ($3 IS NULL OR $3 = '' OR dl.level = $3)
    ),
    total AS (
      SELECT COUNT(*)::integer AS cnt FROM filtered
    ),
    paged AS (
      SELECT *
      FROM filtered
      ORDER BY %s %s NULLS LAST
      LIMIT $4 OFFSET $5
    )
    SELECT jsonb_build_object(
      'items', COALESCE((SELECT jsonb_agg(to_jsonb(paged)) FROM paged), '[]'::jsonb),
      'total_count', (SELECT cnt FROM total)
    )
    $sql$,
    v_sort_expr,
    v_direction
  )
  INTO v_result
  USING p_serial, p_owner_email, p_level, v_page_size, v_offset;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_devices_page(text, text, boolean, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_logs_page(text, text, text, text, boolean, integer, integer) TO authenticated;
