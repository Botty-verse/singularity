-- Stamboom/ticker: laatste geboorte vastleggen op de live state
ALTER TABLE public.hive_state ADD COLUMN IF NOT EXISTS last_kweek jsonb;
