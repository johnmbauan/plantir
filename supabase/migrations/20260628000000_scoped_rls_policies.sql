-- Narrow anon access for device firmware; scope authenticated access by user_id.
--
-- Devices (anon role) may only:
--   SELECT devices + humidity_sensors_config  (fetch config by serialNumber)
--   INSERT humidity_measurements + battery_measurements
--
-- Dashboard users (authenticated role) may only access their own rows (user_id = auth.uid()),
-- or child rows linked to their devices.
--
-- IMPORTANT — intentional RLS trade-offs:
--
-- The anon SELECT policies on `devices` and `humidity_sensors_config` use USING (true) with no
-- user-scoping. Any holder of the publishable anon key can therefore read all device records and
-- sensor configurations across all users. This is deliberate: firmware identifies itself only by
-- serial number and must look itself up in `devices` to obtain its deviceId and sensor config.
-- Scoping these reads per user would require device-level authentication, which is not implemented.
--
-- The anon INSERT policies on `humidity_measurements` and `battery_measurements` only check that
-- the target deviceId exists — they do not authenticate the device. Any anon client that knows a
-- valid deviceId can submit readings for it. For a private home deployment this is an acceptable
-- trade-off. If stronger guarantees are needed, consider per-device JWTs or a dedicated device
-- auth scheme.

-- ============================================================
-- Drop broad policies from prior migrations
-- ============================================================

DROP POLICY IF EXISTS "anon can do all operations on humidity_measurements" ON public.humidity_measurements;
DROP POLICY IF EXISTS "anon can do all operations on plants" ON public.plants;
DROP POLICY IF EXISTS "anon can do all operations on devices" ON public.devices;
DROP POLICY IF EXISTS "anon can do all operations on humidity_sensors_config" ON public.humidity_sensors_config;
DROP POLICY IF EXISTS "anon can do all operations on battery_measurements" ON public.battery_measurements;
DROP POLICY IF EXISTS "anon can do all operations on notification_settings" ON public.notification_settings;

DROP POLICY IF EXISTS "authenticated can do all operations on plants" ON public.plants;
DROP POLICY IF EXISTS "authenticated can do all operations on devices" ON public.devices;
DROP POLICY IF EXISTS "authenticated can do all operations on humidity_sensors_config" ON public.humidity_sensors_config;
DROP POLICY IF EXISTS "authenticated can do all operations on humidity_measurements" ON public.humidity_measurements;
DROP POLICY IF EXISTS "authenticated can do all operations on battery_measurements" ON public.battery_measurements;
DROP POLICY IF EXISTS "authenticated can do all operations on notification_settings" ON public.notification_settings;

-- ============================================================
-- plants — authenticated only, scoped by owner
-- ============================================================

CREATE POLICY "authenticated users manage own plants"
  ON public.plants
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- devices — anon SELECT; authenticated full access on own rows
-- ============================================================

CREATE POLICY "anon can read devices"
  ON public.devices
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "authenticated users manage own devices"
  ON public.devices
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- humidity_sensors_config — anon SELECT; authenticated via device ownership
-- ============================================================

CREATE POLICY "anon can read humidity_sensors_config"
  ON public.humidity_sensors_config
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "authenticated users manage config for own devices"
  ON public.humidity_sensors_config
  FOR ALL TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  )
  WITH CHECK (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );

-- ============================================================
-- humidity_measurements — anon INSERT; authenticated read/delete own
-- ============================================================

CREATE POLICY "anon can insert humidity_measurements"
  ON public.humidity_measurements
  FOR INSERT TO anon
  WITH CHECK (
    "deviceId" IN (SELECT id FROM public.devices)
  );

CREATE POLICY "authenticated users read measurements for own devices"
  ON public.humidity_measurements
  FOR SELECT TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );

CREATE POLICY "authenticated users delete measurements for own devices"
  ON public.humidity_measurements
  FOR DELETE TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );

-- ============================================================
-- battery_measurements — anon INSERT; authenticated read/delete own
-- ============================================================

CREATE POLICY "anon can insert battery_measurements"
  ON public.battery_measurements
  FOR INSERT TO anon
  WITH CHECK (
    "deviceId" IN (SELECT id FROM public.devices)
  );

CREATE POLICY "authenticated users read battery for own devices"
  ON public.battery_measurements
  FOR SELECT TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );

CREATE POLICY "authenticated users delete battery for own devices"
  ON public.battery_measurements
  FOR DELETE TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );

-- ============================================================
-- notification_settings — authenticated only, scoped by owner
-- ============================================================

CREATE POLICY "authenticated users manage own notification_settings"
  ON public.notification_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
