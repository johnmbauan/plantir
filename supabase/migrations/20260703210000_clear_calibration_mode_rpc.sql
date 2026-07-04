-- RPC callable by the device firmware (anon key) to clear calibration mode
-- once the 2-minute loop completes on-device.
--
-- SECURITY DEFINER runs with the privileges of the function owner (postgres),
-- bypassing RLS. The function is intentionally narrow: it only nulls out
-- calibrationModeStartedAt for the given deviceId and touches nothing else.

CREATE OR REPLACE FUNCTION public.clear_calibration_mode(p_device_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.humidity_sensors_config
  SET "calibrationModeStartedAt" = NULL
  WHERE "deviceId" = p_device_id;
END;
$$;

-- Allow the anon role (firmware) to call this function.
GRANT EXECUTE ON FUNCTION public.clear_calibration_mode(bigint) TO anon;
