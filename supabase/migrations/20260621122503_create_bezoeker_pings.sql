create table if not exists bezoeker_pings (
  id  uuid default gen_random_uuid() primary key,
  ts  timestamptz not null default now()
);
alter table bezoeker_pings enable row level security;
create policy "anon insert" on bezoeker_pings for insert to anon with check (true);
create policy "service select" on bezoeker_pings for select to service_role using (true);
create policy "service delete" on bezoeker_pings for delete to service_role using (true);
