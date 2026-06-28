-- Latest-per-device and time-range lookups filter by deviceId and order/filter on createdAt
-- (dashboard fetchPlants, fetchPlantHistory, telegram-notifier WATERING_QUERY / OFFLINE_QUERY).
CREATE INDEX IF NOT EXISTS humidity_measurements_device_id_created_at_idx
  ON public.humidity_measurements ("deviceId", "createdAt" DESC);
