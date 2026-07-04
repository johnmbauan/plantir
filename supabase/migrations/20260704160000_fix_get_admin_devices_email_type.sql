-- Fix type mismatch: auth.users.email is varchar(255), not text.
-- Cast to text explicitly so the RETURNS TABLE declaration matches.

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
    u.email::text                        AS owner_email,
    p.name                               AS "plantName",
    hm."humidityPercentage"              AS "lastHumidity",
    bm."batteryPercent"                  AS "lastBattery",
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
