-- Opt-in email digest channel and per-user daily send log.

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE public.notification_email_log (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date date        NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, local_date)
);

COMMENT ON TABLE public.notification_email_log IS
  'One row per user per local calendar day; used to dedupe daily alert digest emails.';

ALTER TABLE public.notification_email_log ENABLE ROW LEVEL SECURITY;
