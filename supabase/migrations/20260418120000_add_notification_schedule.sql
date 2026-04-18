-- Add per-user notification schedule: preferred hour (0–23) and IANA timezone.
-- Existing users default to hour=6 / timezone='UTC', matching the old cron schedule.

ALTER TABLE public.notification_settings
  ADD COLUMN "notification_hour"     smallint NOT NULL DEFAULT 8
    CONSTRAINT notification_settings_hour_check CHECK ("notification_hour" BETWEEN 0 AND 23),
  ADD COLUMN "notification_timezone" text     NOT NULL DEFAULT 'UTC';

-- Switch from a single daily cron to an hourly cron so the edge function can
-- fire every hour and filter per-user by their chosen local hour.
SELECT cron.unschedule('telegram-notifier-daily');

SELECT cron.schedule(
  'telegram-notifier-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:= (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/telegram-notifier',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
