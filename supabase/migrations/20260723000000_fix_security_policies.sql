-- Harden DB security: drop stale permissive anon policies, revoke unintended
-- SECURITY DEFINER EXECUTE grants, narrow storage listing, move pg_net out of public.
--
-- Keeps app-required access:
--   anon: SELECT devices/humidity_sensors_config, INSERT humidity/battery measurements,
--         EXECUTE clear_calibration_mode
--   authenticated: EXECUTE admin RPCs (role checked inside each function)

-- ============================================================
-- A. Drop overly-permissive Studio-created anon write policies
-- ============================================================

-- devices (anon does not need write access; register-device edge function uses service role)
DROP POLICY IF EXISTS "public can delete devices" ON public.devices;
DROP POLICY IF EXISTS "public can insert devices" ON public.devices;
DROP POLICY IF EXISTS "public can update devices" ON public.devices;

-- plants (user-owned; never accessible without auth)
DROP POLICY IF EXISTS "public can delete plants" ON public.plants;
DROP POLICY IF EXISTS "public can insert plants" ON public.plants;
DROP POLICY IF EXISTS "public can update plants" ON public.plants;

-- humidity_sensors_config (edge function handles writes via service role)
DROP POLICY IF EXISTS "public can delete humidity_sensors_config" ON public.humidity_sensors_config;
DROP POLICY IF EXISTS "public can insert humidity_sensors_config" ON public.humidity_sensors_config;
DROP POLICY IF EXISTS "public can update humidity_sensors_config" ON public.humidity_sensors_config;

-- humidity_measurements INSERT: drop USING(true) duplicate; scoped policy from 20260628000000 remains
DROP POLICY IF EXISTS "public can insert humidity_measurements" ON public.humidity_measurements;

-- ============================================================
-- B. Revoke EXECUTE on trigger / event-trigger functions
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_notification_settings() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_invited_user_password_setup() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.flag_invited_user_password_setup() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- ============================================================
-- C. Revoke EXECUTE on admin RPCs from anon only
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_admin_devices() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_devices_page(text, text, text, text, boolean, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_logs_page(text, text, text, text, boolean, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_device_filter_options() FROM anon;

-- ============================================================
-- D. Narrow storage SELECT policies (prevent bucket enumeration)
-- Public bucket URLs remain accessible by direct URL.
-- ============================================================

DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Users can read own avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Public read access for plant images" ON storage.objects;
CREATE POLICY "Users can read own plant images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'plant-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- E. Move pg_net out of the public schema
-- net.http_post(...) is unaffected (lives in the net schema).
-- ============================================================

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
