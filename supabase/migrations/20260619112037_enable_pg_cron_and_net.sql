CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Roep de hive-tick Edge Function elke minuut aan
SELECT cron.schedule(
  'hive-tick-cron',
  '* * * * *',
  $$
  SELECT extensions.http_post(
    'https://oblzouaapvdippyhxmpo.supabase.co/functions/v1/hive-tick',
    '{}',
    'application/json'
  );
  $$
);
