ALTER TABLE hive_state ADD COLUMN IF NOT EXISTS vertrokken jsonb NOT NULL DEFAULT '[]'::jsonb;
