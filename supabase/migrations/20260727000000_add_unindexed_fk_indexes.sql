-- Add covering indexes for foreign key columns flagged by the Supabase linter.
-- Without these, ON DELETE CASCADE / SET NULL scans and reverse-join queries
-- against the referenced tables perform sequential scans on the child tables.

CREATE INDEX IF NOT EXISTS calibration_readings_device_id_idx
  ON public.calibration_readings ("deviceId");

CREATE INDEX IF NOT EXISTS device_pairing_tokens_plant_id_idx
  ON public.device_pairing_tokens (plant_id);

CREATE INDEX IF NOT EXISTS device_pairing_tokens_registered_device_id_idx
  ON public.device_pairing_tokens (registered_device_id);

-- plant_notification_snooze already has a (user_id, plant_id) composite index,
-- but it does not cover lookups by plant_id alone (e.g. cascade deletes from plants).
CREATE INDEX IF NOT EXISTS plant_notification_snooze_plant_id_idx
  ON public.plant_notification_snooze (plant_id);

CREATE INDEX IF NOT EXISTS user_achievements_achievement_key_idx
  ON public.user_achievements (achievement_key);
