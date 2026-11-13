-- One admission record shared across Edge isolates. No client access.
create table if not exists public.hive_tick_gate (
  id text primary key check (id = 'main'),
  token uuid,
  committed boolean not null default false,
  lease_until timestamptz,
  admitted_at timestamptz not null default '-infinity'
);
insert into public.hive_tick_gate(id) values ('main') on conflict do nothing;
alter table public.hive_tick_gate enable row level security;
revoke all on public.hive_tick_gate from public, anon, authenticated;

create or replace function public.acquire_hive_tick(p_token uuid, p_interaction boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare gate public.hive_tick_gate%rowtype;
begin
  if p_token is null or p_interaction is null then return false; end if;
  -- NOWAIT prevents a burst from queueing behind the admission/commit transaction.
  begin
    select * into gate from public.hive_tick_gate where id = 'main' for update nowait;
  exception when lock_not_available then return false;
  end;
  if not found then raise exception 'tick gate missing'; end if;
  if gate.lease_until > clock_timestamp()
     or gate.admitted_at + (case when p_interaction then interval '1 second' else interval '5 seconds' end) > clock_timestamp()
  then return false; end if;
  update public.hive_tick_gate set token = p_token, committed = false,
    lease_until = clock_timestamp() + interval '90 seconds', admitted_at = clock_timestamp()
    where id = 'main';
  return true;
end;
$$;

create or replace function public.release_hive_tick(p_token uuid)
returns void language sql security definer set search_path = '' as $$
  update public.hive_tick_gate set token = null, lease_until = null
  where id = 'main' and token = p_token;
$$;

-- State and history commit together. Expired/superseded workers cannot write.
create or replace function public.commit_hive_tick(
  p_token uuid, p_state jsonb, p_births jsonb, p_deaths jsonb, p_cleanup boolean
) returns boolean language plpgsql security definer set search_path = '' as $$
declare gate public.hive_tick_gate%rowtype;
begin
  select * into gate from public.hive_tick_gate where id = 'main' for update;
  if gate.committed or gate.token is distinct from p_token or p_token is null
     or gate.lease_until is null or gate.lease_until <= clock_timestamp()
  then return false; end if;
  if p_state->>'id' is distinct from 'main' then raise exception 'invalid hive id'; end if;

  insert into public.hive_state(id, bottys, first_opened, acties, last_updated_at, last_kweek, eieren, ia_bucket)
  select id, bottys, first_opened, acties, last_updated_at, last_kweek, eieren, ia_bucket
  from jsonb_populate_record(null::public.hive_state, p_state)
  on conflict(id) do update set bottys = excluded.bottys, first_opened = excluded.first_opened,
    acties = excluded.acties, last_updated_at = excluded.last_updated_at,
    last_kweek = excluded.last_kweek, eieren = excluded.eieren, ia_bucket = excluded.ia_bucket;

  insert into public.geboorten(kind_id, kind_naam, generatie, oudera_id, oudera_naam,
    ouderb_id, ouderb_naam, genome, grootte, van_a, van_b, mutaties, verwantschap, immigrant)
  select kind_id, kind_naam, generatie, oudera_id, oudera_naam, ouderb_id, ouderb_naam,
    genome, grootte, van_a, van_b, mutaties, verwantschap, immigrant
  from jsonb_populate_recordset(null::public.geboorten, coalesce(p_births, '[]'::jsonb));

  insert into public.levens(bid, naam, generatie, geboren, gestorven, leeftijd_sec, oorzaak,
    piek_iq, vondsten, kinderen, woorden, vrienden, niveau, genome)
  select bid, naam, generatie, geboren, gestorven, leeftijd_sec, oorzaak,
    piek_iq, vondsten, kinderen, woorden, vrienden, niveau, genome
  from jsonb_populate_recordset(null::public.levens, coalesce(p_deaths, '[]'::jsonb));

  if p_cleanup then
    delete from public.bezoeker_pings where ts < now() - interval '2 minutes';
    delete from public.geboorten where ts < now() - interval '180 days';
    delete from public.levens where ts < now() - interval '180 days';
  end if;
  update public.hive_tick_gate set committed = true where id = 'main';
  -- Keep admission locked through best-effort broadcasts; release runs in finally.
  return true;
end;
$$;

revoke all on function public.acquire_hive_tick(uuid, boolean) from public, anon, authenticated;
revoke all on function public.release_hive_tick(uuid) from public, anon, authenticated;
revoke all on function public.commit_hive_tick(uuid, jsonb, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.acquire_hive_tick(uuid, boolean) to service_role;
grant execute on function public.release_hive_tick(uuid) to service_role;
grant execute on function public.commit_hive_tick(uuid, jsonb, jsonb, jsonb, boolean) to service_role;
