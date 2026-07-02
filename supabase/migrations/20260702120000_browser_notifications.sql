-- Browser notifications: settings flag, notifications table, auth trigger, RLS, realtime auth.

-- ============================================================
-- notification_settings: browser toggle
-- ============================================================

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS browser_notifications_enabled boolean NOT NULL DEFAULT true;

-- Backfill settings rows for existing users without one.
INSERT INTO public.notification_settings (
  user_id,
  telegram_chat_id,
  notification_hour,
  notification_timezone,
  browser_notifications_enabled
)
SELECT
  u.id,
  '',
  8,
  'UTC',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_settings ns WHERE ns.user_id = u.id
);

-- ============================================================
-- notifications table
-- ============================================================

CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('watering', 'offline')),
  title       text NOT NULL,
  body        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at     timestamptz,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL AND resolved_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own notifications"
  ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "authenticated users update own notifications"
  ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- auth trigger: create notification_settings on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_settings (
    user_id,
    telegram_chat_id,
    notification_hour,
    notification_timezone,
    browser_notifications_enabled
  )
  VALUES (NEW.id, '', 8, 'UTC', true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_notification_settings ON auth.users;

CREATE TRIGGER on_auth_user_created_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notification_settings();

-- ============================================================
-- Realtime authorization for private user notification channels
-- ============================================================

CREATE POLICY "users receive own notification broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT realtime.topic()) = 'user:' || (SELECT auth.uid())::text
  );
