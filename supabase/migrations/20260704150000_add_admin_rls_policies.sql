-- Admin-level read access for all devices, plants, measurements, and logs.
--
-- Admin users are identified by app_metadata.role = 'admin', set via the
-- Supabase dashboard (Authentication → Users → Edit → app_metadata).
--
-- These policies are additive: existing per-user policies remain untouched.
-- Admin SELECT policies bypass the user_id = auth.uid() filter so that
-- admins can see every row regardless of owner.
--
-- get_admin_devices() is a SECURITY DEFINER RPC that returns a pre-joined
-- view of all devices with their latest humidity/battery readings and the
-- owner's email (sourced from auth.users, which RLS cannot normally expose).
-- It re-checks the admin role internally so it cannot be called by regular
-- authenticated users even if they somehow discover the function name.

-- Helper: reusable admin check expression used in all USING clauses below.
-- (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

-- ============================================================
-- devices
-- ============================================================

CREATE POLICY "admin can read all devices"
  ON public.devices
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- plants
-- ============================================================

CREATE POLICY "admin can read all plants"
  ON public.plants
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- humidity_measurements
-- ============================================================

CREATE POLICY "admin can read all humidity_measurements"
  ON public.humidity_measurements
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- battery_measurements
-- ============================================================

CREATE POLICY "admin can read all battery_measurements"
  ON public.battery_measurements
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- device_logs
-- ============================================================

CREATE POLICY "admin can read all device_logs"
  ON public.device_logs
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- get_admin_devices() RPC
-- Returns one enriched row per device, visible only to admins.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_devices()
RETURNS TABLE (
  id              bigint,
  "serialNumber"  text,
  type            text,
  user_id         uuid,
  owner_email     text,
  "plantName"     text,
  "lastHumidity"  bigint,
  "lastBattery"   smallint,
  "lastSeenAt"    timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d."serialNumber",
    d.type,
    d.user_id,
    u.email::text                   AS owner_email,
    p.name                          AS "plantName",
    hm."humidityPercentage"         AS "lastHumidity",
    bm."batteryPercent"             AS "lastBattery",
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
  ORDER BY d.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_devices() TO authenticated;
