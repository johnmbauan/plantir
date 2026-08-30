-- The initial onboarding backfill treated "plant + device for 3 days" as
-- completing the notifications step. That inference is no longer wanted:
-- the step is recorded only when the user saves notification settings.

UPDATE public.user_onboarding AS o
SET
  completed_notifications_at = NULL,
  updated_at = now()
WHERE o.completed_notifications_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_achievements ua
    WHERE ua.user_id = o.user_id
      AND ua.achievement_key = 'plant_texted_back'
  )
  AND o.completed_plants_at IS NOT NULL
  AND o.completed_devices_at IS NOT NULL
  AND o.completed_plants_at <= now() - interval '3 days';
