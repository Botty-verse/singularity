-- Elke minuut de hive-tick edge function aanroepen via pg_net
SELECT cron.schedule(
  'hive-tick-cron',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oblzouaapvdippyhxmpo.supabase.co/functions/v1/hive-tick',
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
