-- #2 uit de DB-besparingsanalyse — NOG NIET toegepast op productie; klaar om te
-- draaien in de Supabase SQL Editor (de cron-job is buiten migraties, in het
-- dashboard, aangemaakt).
--
-- Verlaag de hive-tick pg_cron van elke minuut naar elke 2 minuten
-- (~43K -> ~22K invocaties/mnd). Verandert ALLEEN de frequentie; het bestaande
-- commando blijft. De catch-up-logica in hive-tick vangt de grovere cadans op.
-- Terug naar 1 min? Zet schedule op '* * * * *'.
do $$
declare j bigint;
begin
  select jobid into j from cron.job where jobname = 'hive-tick-elke-minuut';
  if j is null then
    raise exception 'cron-job hive-tick-elke-minuut niet gevonden';
  end if;
  perform cron.alter_job(job_id := j, schedule := '*/2 * * * *');
end $$;
