-- Persistent log store for firmware-reported errors and warnings.
--
-- The device firmware calls POST /rest/v1/device_logs (anon key) whenever it
-- encounters a fatal condition (e.g. WiFi failure, missing remote config) and
-- is about to enter emergency deep sleep. Logs are identified by serialNumber
-- (the MAC-derived device ID) so they can be written even before the device
-- fetches its numeric deviceId from the DB.
--
-- Authenticated users can read and delete logs for their own devices through
-- the web application.

CREATE TABLE public.device_logs (
  id             bigserial    PRIMARY KEY,
  "serialNumber" text         NOT NULL,
  level          text         NOT NULL CHECK (level IN ('error', 'warning', 'info')),
  message        text         NOT NULL,
  "createdAt"    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

-- Firmware (anon key) may insert logs only for devices that are already registered.
CREATE POLICY "anon can insert device_logs for registered devices"
  ON public.device_logs
  FOR INSERT TO anon
  WITH CHECK (
    "serialNumber" IN (SELECT "serialNumber" FROM public.devices)
  );

-- Authenticated users can read logs for their own devices.
CREATE POLICY "authenticated users can read own device_logs"
  ON public.device_logs
  FOR SELECT TO authenticated
  USING (
    "serialNumber" IN (
      SELECT "serialNumber" FROM public.devices WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can delete logs for their own devices.
CREATE POLICY "authenticated users can delete own device_logs"
  ON public.device_logs
  FOR DELETE TO authenticated
  USING (
    "serialNumber" IN (
      SELECT "serialNumber" FROM public.devices WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookup by device and recency in the web app.
CREATE INDEX device_logs_serial_created_idx
  ON public.device_logs ("serialNumber", "createdAt" DESC);
