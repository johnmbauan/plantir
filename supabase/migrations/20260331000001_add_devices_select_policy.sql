-- Allow anon role to read devices (required for fetchDevices and INSERT...RETURNING)
CREATE POLICY "public can read devices"
  ON "public"."devices" FOR SELECT TO "anon" USING (true);
