-- Grafschriften: bij het sterven schrijft de hive-tick edge function één rij per
-- overleden Botty weg — een blijvend levensverhaal (de sterfelijkheid laat nu een
-- spoor na). Read-only publiek, net als de geboorten-stamboom. De edge function
-- schrijft met de service-role key en omzeilt RLS, dus er is geen anon-INSERT nodig.
CREATE TABLE IF NOT EXISTS public.levens (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts           timestamptz NOT NULL DEFAULT now(),
  bid          text,
  naam         text NOT NULL,
  generatie    integer,
  geboren      timestamptz,
  gestorven    timestamptz NOT NULL DEFAULT now(),
  leeftijd_sec integer,
  oorzaak      text,
  piek_iq      integer,
  vondsten     integer,
  kinderen     integer,
  woorden      integer,
  vrienden     integer,
  niveau       integer,
  genome       text
);

ALTER TABLE public.levens ENABLE ROW LEVEL SECURITY;

-- Iedereen mag de grafschriften lezen (publieke viewer)
CREATE POLICY levens_select_anon ON public.levens
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS levens_ts_idx ON public.levens (ts);
