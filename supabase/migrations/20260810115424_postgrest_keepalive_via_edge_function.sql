-- Keep PostgREST's DB pool warm by invoking an edge function that queries
-- /rest/v1 via the service-role client. Vault `api_key` (CRON_API_KEY) is valid
-- for edge auth but not for PostgREST directly.

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'db-keepalive';

SELECT cron.schedule(
  'db-keepalive',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/db-keepalive',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
