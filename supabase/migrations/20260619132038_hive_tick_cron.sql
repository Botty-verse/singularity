select cron.schedule(
  'hive-tick-elke-minuut',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://oblzouaapvdippyhxmpo.supabase.co/functions/v1/hive-tick',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
