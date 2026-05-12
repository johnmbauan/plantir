-- Grant authenticated role full access to all RLS-enabled tables.
-- The frontend uses the authenticated role once a user is signed in,
-- and without these policies rows are silently hidden by RLS.

CREATE POLICY "authenticated can do all operations on plants"
  ON "public"."plants"
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated can do all operations on devices"
  ON "public"."devices"
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated can do all operations on humidity_sensors_config"
  ON "public"."humidity_sensors_config"
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated can do all operations on humidity_measurements"
  ON "public"."humidity_measurements"
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated can do all operations on battery_measurements"
  ON "public"."battery_measurements"
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated can do all operations on notification_settings"
  ON "public"."notification_settings"
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);
