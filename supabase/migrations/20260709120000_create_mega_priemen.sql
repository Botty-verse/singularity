-- Megapriemen: enorme priemgetallen (honderden cijfers) die niet door de hive
-- zelf, maar door de BROWSER van bezoekers worden gevonden. De bezoeker levert
-- rekenkracht: een Web Worker zoekt een waarschijnlijk priemgetal en stuurt de
-- winnaar naar de edge function `priem-claim`, die 'm verifieert (Miller-Rabin)
-- en toekent aan een levende Botty. Zulke getallen passen niet in `integer`,
-- dus we bewaren ze als decimale string.
--
-- Alleen de service-role (via priem-claim) mag schrijven; anon leest voor
-- priemen.html. De +IQ-toekenning gebeurt in hive-tick (die als enige
-- hive_state schrijft), zodat er geen race is: `verrekend` markeert of de
-- ontdekker z'n IQ-bonus al kreeg.
CREATE TABLE IF NOT EXISTS public.mega_priemen (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cijfers        text NOT NULL UNIQUE,
  digits         integer NOT NULL,
  ontdekker_naam text,
  ontdekker_bid  text,
  generatie      integer,
  verrekend      boolean NOT NULL DEFAULT false,
  ts             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mega_priemen ENABLE ROW LEVEL SECURITY;

-- Publiek leesbaar (priemen.html), niet publiek schrijfbaar.
CREATE POLICY mega_priemen_select_anon ON public.mega_priemen
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS mega_priemen_ts_idx     ON public.mega_priemen (ts DESC);
CREATE INDEX IF NOT EXISTS mega_priemen_digits_idx ON public.mega_priemen (digits DESC);
CREATE INDEX IF NOT EXISTS mega_priemen_open_idx   ON public.mega_priemen (id) WHERE NOT verrekend;

-- Compacte totalen voor de KPI's op priemen.html (de collectie zelf kan groot
-- en de getallen lang worden, dus tellen we server-side).
CREATE OR REPLACE FUNCTION public.mega_priem_stats()
RETURNS TABLE (totaal bigint, grootste_digits integer, top_naam text, top_aantal bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH tel AS (
    SELECT ontdekker_naam, count(*) AS n FROM public.mega_priemen
    WHERE ontdekker_naam IS NOT NULL GROUP BY ontdekker_naam
  )
  SELECT
    (SELECT count(*) FROM public.mega_priemen),
    (SELECT max(digits) FROM public.mega_priemen),
    (SELECT ontdekker_naam FROM tel ORDER BY n DESC, ontdekker_naam LIMIT 1),
    (SELECT n FROM tel ORDER BY n DESC, ontdekker_naam LIMIT 1);
$$;

GRANT EXECUTE ON FUNCTION public.mega_priem_stats() TO anon;
