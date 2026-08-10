-- The previous keepalive hit PostgREST with vault `api_key` (CRON_API_KEY),
-- which is accepted by edge functions but rejected by PostgREST (HTTP 401).
-- Switch to a direct SQL ping so the job actually touches Postgres.

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'db-keepalive';

SELECT cron.schedule(
  'db-keepalive',
  '* * * * *',
  $$ SELECT id FROM public.devices LIMIT 1; $$
);
