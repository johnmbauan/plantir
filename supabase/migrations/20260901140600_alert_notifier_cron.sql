-- Point the hourly alert cron at alert-notifier (renamed from telegram-notifier).

DO $$
DECLARE
  jname text;
BEGIN
  FOREACH jname IN ARRAY ARRAY[
    'telegram-notifier-hourly',
    'telegram-notifier-daily',
    'telegram-notifier-minutes'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = jname) THEN
      PERFORM cron.unschedule(jname);
    END IF;
  END LOOP;
END $$;

SELECT cron.schedule(
  'alert-notifier-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:= (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/alert-notifier',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
