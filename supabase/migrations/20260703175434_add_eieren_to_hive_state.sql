alter table hive_state add column if not exists eieren jsonb default '[]'::jsonb;
