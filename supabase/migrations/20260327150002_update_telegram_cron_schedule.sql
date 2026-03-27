SELECT cron.unschedule('telegram-notifier-daily');

SELECT cron.schedule(
  'telegram-notifier-daily',
  '* * * * *',
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