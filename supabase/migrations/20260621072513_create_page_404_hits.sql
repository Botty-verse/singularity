create table if not exists page_404_hits (
  id          bigint generated always as identity primary key,
  ts          timestamptz not null default now(),
  path        text,
  referrer    text,
  user_agent  text
);

-- allow anonymous inserts (the 404 page runs in the browser)
alter table page_404_hits enable row level security;

create policy "anon insert" on page_404_hits
  for insert to anon with check (true);

-- allow reading for the dashboard (authenticated users only)
create policy "auth read" on page_404_hits
  for select to authenticated using (true);
