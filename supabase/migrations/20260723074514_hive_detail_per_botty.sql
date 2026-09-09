-- #3 uit de DB-besparingsanalyse — klaar om te draaien in de Supabase SQL Editor.
--
-- hive_detail() geeft nu optioneel de detaildata van ÉÉN Botty terug i.p.v. van alle
-- ~10. Backward-compatible: zonder param (p_naam is null) geeft-ie nog steeds alles,
-- dus de bestaande client blijft werken tot de client-kant is bijgewerkt om
-- rpc("hive_detail", { p_naam: <geselecteerde naam> }) aan te roepen (~10x kleinere
-- detail-read bij selectie en de 30s-poll).
create or replace function public.hive_detail(p_naam text default null)
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
    where h.id = 'main' and (p_naam is null or b->>'naam' = p_naam)
  ), '[]'::json);
$$;

grant execute on function public.hive_detail(text) to anon, authenticated;
