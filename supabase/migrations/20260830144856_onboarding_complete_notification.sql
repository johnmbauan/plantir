ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('watering', 'offline', 'achievement', 'onboardingCompleted'));

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_onboarding_completed_uidx
  ON public.notifications (user_id)
  WHERE type = 'onboardingCompleted';

CREATE POLICY "authenticated users insert own onboardingCompleted notifications"
  ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND type = 'onboardingCompleted');
