-- priem_stats(): geaggregeerde totalen voor priemen.html.
-- De collectie kan groter worden dan de PostgREST-rijlimiet (max 1000/req), dus
-- tellen we het totaal, de hoogste priem en de top-ontdekker server-side i.p.v.
-- in de client (waar de telling op 1000 zou blijven steken).
create or replace function public.priem_stats()
returns json
language sql
stable
security invoker
as $$
  select json_build_object(
    'totaal',     (select count(*) from public.priemvondsten),
    'hoogste',    (select max(getal) from public.priemvondsten),
    'top_naam',   (select ontdekker_naam from public.priemvondsten
                     group by ontdekker_naam order by count(*) desc limit 1),
    'top_aantal', (select count(*) from public.priemvondsten
                     group by ontdekker_naam order by count(*) desc limit 1)
  );
$$;

grant execute on function public.priem_stats() to anon, authenticated;
