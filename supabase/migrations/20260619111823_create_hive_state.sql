CREATE TABLE IF NOT EXISTS hive_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  bottys JSONB NOT NULL DEFAULT '[]',
  first_opened BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  acties INTEGER NOT NULL DEFAULT 0,
  last_updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Enable Row Level Security but allow public reads
ALTER TABLE hive_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read hive" ON hive_state
  FOR SELECT USING (true);

-- Only the service role / edge functions can write
CREATE POLICY "service role can write hive" ON hive_state
  FOR ALL USING (auth.role() = 'service_role');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE hive_state;
