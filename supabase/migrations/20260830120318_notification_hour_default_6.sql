ALTER TABLE public.notification_settings
  ALTER COLUMN notification_hour SET DEFAULT 6;

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
  VALUES (NEW.id, '', 6, 'UTC', true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
