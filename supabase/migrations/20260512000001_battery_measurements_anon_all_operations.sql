-- Replace all narrow anon policies with FOR ALL policies across every
-- RLS-enabled table, so the anon role (used by devices posting measurements)
-- can perform any operation on any of these tables.

-- humidity_measurements
DROP POLICY IF EXISTS "public can read humidity_measurements" ON "public"."humidity_measurements";
CREATE POLICY "anon can do all operations on humidity_measurements"
  ON "public"."humidity_measurements"
  FOR ALL TO "anon"
  USING (true)
  WITH CHECK (true);

-- plants
DROP POLICY IF EXISTS "public can read plants" ON "public"."plants";
CREATE POLICY "anon can do all operations on plants"
  ON "public"."plants"
  FOR ALL TO "anon"
  USING (true)
  WITH CHECK (true);

-- devices (had RLS enabled but no policies — anon reads were silently blocked)
CREATE POLICY "anon can do all operations on devices"
  ON "public"."devices"
  FOR ALL TO "anon"
  USING (true)
  WITH CHECK (true);

-- humidity_sensors_config (same situation as devices)
CREATE POLICY "anon can do all operations on humidity_sensors_config"
  ON "public"."humidity_sensors_config"
  FOR ALL TO "anon"
  USING (true)
  WITH CHECK (true);

-- battery_measurements
DROP POLICY IF EXISTS "public can insert battery_measurements" ON "public"."battery_measurements";
DROP POLICY IF EXISTS "public can read battery_measurements"   ON "public"."battery_measurements";
CREATE POLICY "anon can do all operations on battery_measurements"
  ON "public"."battery_measurements"
  FOR ALL TO "anon"
  USING (true)
  WITH CHECK (true);

-- notification_settings (RLS was not previously enabled)
ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can do all operations on notification_settings"
  ON "public"."notification_settings"
  FOR ALL TO "anon"
  USING (true)
  WITH CHECK (true);
