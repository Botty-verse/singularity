-- hive_detail(): de zware per-Botty detailvelden voor het construct-breinpaneel.
-- De slanke live-baan (hive_slim + realtime-broadcast) strípt brein/chem/lexicon er
-- bewust uit om egress te sparen; het breinpaneel haalt ze on-demand op voor de
-- geselecteerde Botty. Dat gebeurde eerst via een DIRECTE tabel-select op hive_state
-- (GET ...?select=bottys&single). Die transport faalde bij minstens één bezoeker
-- (Mac/Safari) waardoor de biochemie-balken én de gekleurde brein-verbindingen leeg
-- bleven, terwijl de RPC-baan (POST /rpc/...) wél werkte. Deze functie geeft dezelfde
-- detaildata terug via diezelfde, betrouwbare RPC-baan.
create or replace function public.hive_detail()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((
    select json_agg(json_build_object(
      'naam',    b->>'naam',
      'brein',   b->'brein',
      'breinN',  b->'breinN',
      'lexicon', b->'lexicon',
      'chem',    b->'chem'
    ))
    from public.hive_state h, jsonb_array_elements(h.bottys) as b
    where h.id = 'main'
  ), '[]'::json);
$$;

grant execute on function public.hive_detail() to anon, authenticated;
