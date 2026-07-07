-- Add missing indexes for common frontend query patterns.
-- Targets user-scoped filters and latest-per-device lookups.

CREATE INDEX IF NOT EXISTS battery_measurements_device_id_created_at_idx
  ON public.battery_measurements ("deviceId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS plants_user_id_idx
  ON public.plants (user_id);

CREATE INDEX IF NOT EXISTS devices_user_id_created_at_idx
  ON public.devices (user_id, "createdAt");

CREATE INDEX IF NOT EXISTS devices_plant_id_idx
  ON public.devices ("plantId");

CREATE INDEX IF NOT EXISTS humidity_sensors_config_device_id_idx
  ON public.humidity_sensors_config ("deviceId");
