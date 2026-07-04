-- Add calibration mode support to humidity sensors.
--
-- calibrationModeStartedAt: set by the web app when the user starts a calibration session.
-- The firmware checks this field on wake; if it is set and less than 2 minutes old the
-- device enters its calibration loop (posting raw ADC readings every 10 seconds for 2 minutes)
-- instead of the normal humidity check. The web wizard clears this field on success or close.
--
-- calibration_readings: transient table for raw ADC values posted by the device during a
-- calibration session. Rows are deleted by the web app once calibration values are saved.

ALTER TABLE public.humidity_sensors_config
  ADD COLUMN "calibrationModeStartedAt" timestamptz NULL DEFAULT NULL;

-- ============================================================
-- calibration_readings
-- ============================================================

CREATE TABLE public.calibration_readings (
  id          bigserial    PRIMARY KEY,
  "deviceId"  bigint       NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  "rawValue"  integer      NOT NULL,
  "createdAt" timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.calibration_readings ENABLE ROW LEVEL SECURITY;

-- Firmware (anon key) can INSERT readings for any registered device.
-- Same trade-off as humidity_measurements: any anon client that knows a valid deviceId
-- can submit readings. Acceptable for a private home deployment.
CREATE POLICY "anon can insert calibration_readings"
  ON public.calibration_readings
  FOR INSERT TO anon
  WITH CHECK (
    "deviceId" IN (SELECT id FROM public.devices)
  );

-- Authenticated users can read and delete calibration readings for their own devices.
CREATE POLICY "authenticated users read calibration_readings for own devices"
  ON public.calibration_readings
  FOR SELECT TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );

CREATE POLICY "authenticated users delete calibration_readings for own devices"
  ON public.calibration_readings
  FOR DELETE TO authenticated
  USING (
    "deviceId" IN (SELECT id FROM public.devices WHERE user_id = auth.uid())
  );
