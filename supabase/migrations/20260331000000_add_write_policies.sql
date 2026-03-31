-- Allow anon role to insert, update and delete on plants
CREATE POLICY "public can insert plants"
  ON "public"."plants" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "public can update plants"
  ON "public"."plants" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "public can delete plants"
  ON "public"."plants" FOR DELETE TO "anon" USING (true);

-- Allow anon role to insert, update and delete on devices
CREATE POLICY "public can insert devices"
  ON "public"."devices" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "public can update devices"
  ON "public"."devices" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "public can delete devices"
  ON "public"."devices" FOR DELETE TO "anon" USING (true);

-- Allow anon role to read, insert, update and delete on humidity_sensors_config
CREATE POLICY "public can read humidity_sensors_config"
  ON "public"."humidity_sensors_config" FOR SELECT TO "anon" USING (true);

CREATE POLICY "public can insert humidity_sensors_config"
  ON "public"."humidity_sensors_config" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "public can update humidity_sensors_config"
  ON "public"."humidity_sensors_config" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "public can delete humidity_sensors_config"
  ON "public"."humidity_sensors_config" FOR DELETE TO "anon" USING (true);
