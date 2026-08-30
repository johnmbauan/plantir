ALTER TABLE public.user_onboarding
  ADD COLUMN skipped_location_at timestamptz,
  ADD COLUMN skipped_notifications_at timestamptz;
