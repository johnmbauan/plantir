-- Speed up dashboard "latest humidity/battery per device" lookups.
--
-- The previous PostgREST embed:
--   devices?select=...,humidity_measurements(...),battery_measurements(...)
--   &humidity_measurements.order=createdAt.desc&humidity_measurements.limit=1
--   &battery_measurements.order=createdAt.desc&battery_measurements.limit=1
-- combines LATERAL+json_agg with RLS policies that re-evaluate
--   deviceId IN (SELECT id FROM devices WHERE user_id = auth.uid())
-- per measurement row. On large measurement tables that becomes very slow.
--
-- Fix:
-- 1. SECURITY DEFINER RPC that does indexed LATERAL LIMIT 1 per device
--    (same pattern as get_admin_devices) with an explicit ownership check.
-- 2. Rewrite measurement SELECT/DELETE RLS so auth.uid() and the devices
--    subquery are InitPlans (evaluated once), not per-row.

-- ============================================================
-- RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_latest_device_measurements(p_device_ids bigint[])
RETURNS TABLE (
  "deviceId" bigint,
  "humidityPercentage" bigint,
  humidity_created_at timestamptz,
  "batteryPercent" smallint,
  battery_created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    hm."humidityPercentage",
    hm."createdAt",
    bm."batteryPercent",
    bm."createdAt"
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
  WHERE d.id = ANY (p_device_ids)
    AND (
      d.user_id = (SELECT auth.uid())
      OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_latest_device_measurements(bigint[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_device_measurements(bigint[]) TO authenticated;

-- ============================================================
-- RLS: InitPlan-friendly policies for measurement reads/deletes
-- ============================================================

DROP POLICY IF EXISTS "authenticated users read measurements for own devices"
  ON public.humidity_measurements;
CREATE POLICY "authenticated users read measurements for own devices"
  ON public.humidity_measurements
  FOR SELECT TO authenticated
  USING (
    "deviceId" IN ((SELECT id FROM public.devices WHERE user_id = (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "authenticated users delete measurements for own devices"
  ON public.humidity_measurements;
CREATE POLICY "authenticated users delete measurements for own devices"
  ON public.humidity_measurements
  FOR DELETE TO authenticated
  USING (
    "deviceId" IN ((SELECT id FROM public.devices WHERE user_id = (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "authenticated users read battery for own devices"
  ON public.battery_measurements;
CREATE POLICY "authenticated users read battery for own devices"
  ON public.battery_measurements
  FOR SELECT TO authenticated
  USING (
    "deviceId" IN ((SELECT id FROM public.devices WHERE user_id = (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "authenticated users delete battery for own devices"
  ON public.battery_measurements;
CREATE POLICY "authenticated users delete battery for own devices"
  ON public.battery_measurements
  FOR DELETE TO authenticated
  USING (
    "deviceId" IN ((SELECT id FROM public.devices WHERE user_id = (SELECT auth.uid())))
  );
