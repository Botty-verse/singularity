-- hive_slim(): het slanke live-snapshot voor de eerste paginaweergave.
-- De hele hive_state-rij is ~31 KB doordat elke Botty zware leer-/geheugenvelden
-- meedraagt (brein, lexicon, herinneringen, relaties, chem, …). De live-weergave
-- gebruikt die niet; alleen het construct-breinpaneel haalt ze on-demand op voor
-- de geselecteerde Botty. Deze functie geeft dezelfde slanke vorm terug als de
-- realtime-broadcast (~9 KB), zodat een paginabezoek ~70% minder egress kost.
create or replace function public.hive_slim()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'bottys', coalesce((
      select json_agg(
        b - 'brein' - 'breinN' - 'lexicon' - 'herinneringen'
          - 'relaties' - 'chem' - 'erfenis' - 'zelfzorgGeleerd' - 'groei'
      )
      from public.hive_state h, jsonb_array_elements(h.bottys) as b
      where h.id = 'main'
    ), '[]'::json),
    'eieren',       (select eieren       from public.hive_state where id = 'main'),
    'acties',       (select acties       from public.hive_state where id = 'main'),
    'first_opened', (select first_opened from public.hive_state where id = 'main'),
    'last_kweek',   (select last_kweek   from public.hive_state where id = 'main')
  );
$$;

grant execute on function public.hive_slim() to anon, authenticated;
