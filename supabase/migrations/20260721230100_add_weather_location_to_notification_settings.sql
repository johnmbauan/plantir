-- Persist the user's weather city coordinates so telegram-notifier can
-- fetch Open-Meteo forecasts server-side for outdoor plant rain notes.

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS weather_lat double precision,
  ADD COLUMN IF NOT EXISTS weather_lng double precision;
