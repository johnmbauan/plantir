-- Per-plant notification snooze (24h / 48h) used by in-app quick actions
-- and respected by telegram-notifier when sending watering alerts.

CREATE TABLE IF NOT EXISTS public.plant_notification_snooze (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id bigint NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  snoozed_until timestamptz NOT NULL,
  UNIQUE (user_id, plant_id)
);

CREATE INDEX IF NOT EXISTS plant_notification_snooze_user_plant_idx
  ON public.plant_notification_snooze (user_id, plant_id);

ALTER TABLE public.plant_notification_snooze ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users manage own plant snoozes"
  ON public.plant_notification_snooze
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
