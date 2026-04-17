SELECT cron.unschedule('telegram-notifier-daily');

SELECT cron.schedule(
  'telegram-notifier-daily',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/telegram-notifier',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
