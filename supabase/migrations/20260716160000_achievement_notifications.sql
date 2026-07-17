-- Allow achievement unlocks as persisted in-app notifications.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('watering', 'offline', 'achievement'));
