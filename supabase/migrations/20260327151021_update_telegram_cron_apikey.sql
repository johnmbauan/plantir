SELECT cron.unschedule('telegram-notifier-daily');

SELECT cron.schedule(
  'telegram-notifier-daily',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zlsmzlingdehpgglxpmk.supabase.co/functions/v1/telegram-notifier',
    headers := jsonb_build_object(
      'apikey', 'GhmRvI7Y3ciHcmEYDfXqLoUOE4JYZQwdxdVrXXhD9j8='),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);