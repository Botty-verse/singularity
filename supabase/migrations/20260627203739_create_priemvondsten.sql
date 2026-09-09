-- Gedeelde priemgetallen-collectie voor het IQ-spel. Elke priem kan maar één
-- keer ontdekt worden (PRIMARY KEY op getal); de eerste ontdekker wordt
-- vastgelegd. De edge function leest deze lijst om dubbele ontdekkingen te
-- voorkomen. Publiek leesbaar voor priemen.html / iq-ranglijst.html.
CREATE TABLE IF NOT EXISTS public.priemvondsten (
  getal          integer PRIMARY KEY,
  ontdekker_naam text,
  ontdekker_bid  text,
  generatie      integer,
  ts             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.priemvondsten ENABLE ROW LEVEL SECURITY;

CREATE POLICY priemvondsten_select_anon ON public.priemvondsten
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS priemvondsten_ts_idx ON public.priemvondsten (ts DESC);
