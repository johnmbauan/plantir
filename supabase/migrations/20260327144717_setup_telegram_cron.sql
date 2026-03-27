-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the cron job
SELECT cron.schedule(
  'telegram-notifier-daily',
  '0 6 * * *', -- Every day at 6:00 AM (UTC), meaning 7:00 AM in CET (Italy, winter) and 8:00 AM in CEST (Italy, summer)
  $$
  SELECT net.http_post(
    url := 'https://zlsmzlingdehpgglxpmk.supabase.co/functions/v1/telegram-notifier',
    headers := jsonb_build_object(
      'apikey', current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);