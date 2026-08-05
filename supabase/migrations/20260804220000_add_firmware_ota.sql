-- HTTPS OTA: staged firmware releases, fleet channels, per-device pilot overrides.

-- ============================================================
-- firmware_releases (staged builds)
-- ============================================================

CREATE TABLE public.firmware_releases (
  id bigserial PRIMARY KEY,
  board text NOT NULL CHECK (board IN ('esp32c5', 'esp32c6')),
  -- Monotonic OTA key compared on-device (FIRMWARE_VERSION).
  version integer NOT NULL CHECK (version > 0),
  -- Human-facing SemVer for release notes / Admin UI; not used by the device.
  semver text NOT NULL CHECK (semver ~ '^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'),
  binary_url text NOT NULL,
  label text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board, version)
);

ALTER TABLE public.firmware_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read firmware_releases"
  ON public.firmware_releases
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "authenticated can read firmware_releases"
  ON public.firmware_releases
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin can insert firmware_releases"
  ON public.firmware_releases
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin can update firmware_releases"
  ON public.firmware_releases
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin can delete firmware_releases"
  ON public.firmware_releases
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- firmware_channels (fleet pointer per board)
-- ============================================================

CREATE TABLE public.firmware_channels (
  board text PRIMARY KEY CHECK (board IN ('esp32c5', 'esp32c6')),
  release_id bigint NOT NULL REFERENCES public.firmware_releases(id),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.firmware_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read firmware_channels"
  ON public.firmware_channels
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "authenticated can read firmware_channels"
  ON public.firmware_channels
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin can insert firmware_channels"
  ON public.firmware_channels
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin can update firmware_channels"
  ON public.firmware_channels
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin can delete firmware_channels"
  ON public.firmware_channels
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- devices: reported firmware + pilot override
-- ============================================================

ALTER TABLE public.devices
  ADD COLUMN "firmwareVersion" integer,
  ADD COLUMN "firmwareBoard" text,
  ADD COLUMN "firmwareReportedAt" timestamptz,
  ADD COLUMN "firmwareOverrideReleaseId" bigint
    REFERENCES public.firmware_releases(id) ON DELETE SET NULL;

CREATE INDEX devices_firmware_override_release_id_idx
  ON public.devices ("firmwareOverrideReleaseId");

-- ============================================================
-- Device RPC (anon key): config + firmware target + version report
-- ============================================================

CREATE OR REPLACE FUNCTION public.device_wake_sync(
  p_serial text,
  p_board text,
  p_firmware_version integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override_id bigint;
  v_firmware jsonb;
  v_result jsonb;
BEGIN
  IF p_board IS NULL OR p_board NOT IN ('esp32c5', 'esp32c6') THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'deviceId', c."deviceId",
    'airValue', c."airValue",
    'waterValue', c."waterValue",
    'minHumidityThreshold', c."minHumidityThreshold",
    'sleepDurationSeconds', c."sleepDurationSeconds",
    'calibrationModeStartedAt', c."calibrationModeStartedAt",
    'calibrated_at', c.calibrated_at
  )
  INTO v_result
  FROM public.humidity_sensors_config c
  INNER JOIN public.devices d ON d.id = c."deviceId"
  WHERE d."serialNumber" = p_serial
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.devices
  SET
    "firmwareVersion" = p_firmware_version,
    "firmwareBoard" = p_board,
    "firmwareReportedAt" = now()
  WHERE "serialNumber" = p_serial;

  SELECT d."firmwareOverrideReleaseId"
  INTO v_override_id
  FROM public.devices d
  WHERE d."serialNumber" = p_serial;

  IF v_override_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'version', r.version,
      'binary_url', r.binary_url,
      'source', 'override'
    )
    INTO v_firmware
    FROM public.firmware_releases r
    WHERE r.id = v_override_id
      AND r.board = p_board;
  END IF;

  IF v_firmware IS NULL THEN
    SELECT jsonb_build_object(
      'version', r.version,
      'binary_url', r.binary_url,
      'source', 'fleet'
    )
    INTO v_firmware
    FROM public.firmware_channels c
    JOIN public.firmware_releases r ON r.id = c.release_id
    WHERE c.board = p_board;
  END IF;

  RETURN v_result || jsonb_build_object('firmware', v_firmware);
END;
$$;

GRANT EXECUTE ON FUNCTION public.device_wake_sync(text, text, integer) TO anon;

-- ============================================================
-- Admin RPCs for pilot overrides (admin has SELECT-only on devices)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_assign_firmware_override(
  p_device_ids bigint[],
  p_release_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.firmware_releases WHERE id = p_release_id
  ) THEN
    RAISE EXCEPTION 'Firmware release not found';
  END IF;

  UPDATE public.devices
  SET "firmwareOverrideReleaseId" = p_release_id
  WHERE id = ANY (p_device_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_firmware_override(bigint[], bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_clear_firmware_overrides(p_device_ids bigint[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.devices
  SET "firmwareOverrideReleaseId" = NULL
  WHERE id = ANY (p_device_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_clear_firmware_overrides(bigint[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_clear_firmware_overrides_for_release(p_release_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.devices
  SET "firmwareOverrideReleaseId" = NULL
  WHERE "firmwareOverrideReleaseId" = p_release_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_clear_firmware_overrides_for_release(bigint) TO authenticated;

-- ============================================================
-- Storage bucket: firmware
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('firmware', 'firmware', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read access for firmware"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'firmware');

CREATE POLICY "Admin can upload firmware"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'firmware'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update firmware"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'firmware'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'firmware'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete firmware"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'firmware'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- get_admin_devices_page: include firmware fields
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
    WHEN 'firmwareVersion' THEN '"firmwareVersion"'
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
        p.name AS "plantName",
        d."firmwareVersion",
        d."firmwareBoard",
        d."firmwareReportedAt",
        d."firmwareOverrideReleaseId",
        fr.version AS "firmwareOverrideVersion"
      FROM public.devices d
      LEFT JOIN auth.users u ON u.id = d.user_id
      LEFT JOIN public.plants p ON p.id = d."plantId"
      LEFT JOIN public.firmware_releases fr ON fr.id = d."firmwareOverrideReleaseId"
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
        b."firmwareVersion",
        b."firmwareBoard",
        b."firmwareReportedAt",
        b."firmwareOverrideReleaseId",
        b."firmwareOverrideVersion",
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
