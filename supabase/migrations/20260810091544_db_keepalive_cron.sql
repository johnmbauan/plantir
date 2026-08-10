-- Keep the Supabase connection pool / PostgREST warm after idle periods
-- by issuing a lightweight REST read every minute.

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'db-keepalive';

SELECT cron.schedule(
  'db-keepalive',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/rest/v1/devices?select=id&limit=1',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key')
    )
  ) AS request_id;
  $$
);
