SELECT cron.unschedule('telegram-notifier-daily');

SELECT cron.schedule(
  'telegram-notifier-daily',
  '* * * * *',
  $$
  SELECT net.http_post(
    'https://zlsmzlingdehpgglxpmk.supabase.co/functions/v1/telegram-notifier',
    '{}'::jsonb,
    '{"apikey":"GhmRvI7Y3ciHcmEYDfXqLoUOE4JYZQwdxdVrXXhD9j8=","Content-Type":"application/json"}'::jsonb
  ) AS request_id;
  $$
);