-- Egress-meter meesturen in het slanke snapshot, zodat ook een verse paginabezoeker
-- 'm meteen ziet (de meter zelf wordt door hive-tick in ia_bucket.egress bijgehouden;
-- dit voegt alleen een lees-veld toe — geen extra schrijf/kosten).
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
    'last_kweek',   (select last_kweek   from public.hive_state where id = 'main'),
    'egress',       (select ia_bucket->'egress' from public.hive_state where id = 'main')
  );
$$;

grant execute on function public.hive_slim() to anon, authenticated;
