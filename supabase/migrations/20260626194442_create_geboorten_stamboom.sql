-- Geboortelog voor de stamboom (stamboom.html)
CREATE TABLE IF NOT EXISTS public.geboorten (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts          timestamptz NOT NULL DEFAULT now(),
  kind_id     text NOT NULL,
  kind_naam   text NOT NULL,
  generatie   integer NOT NULL DEFAULT 1,
  oudera_id   text,
  oudera_naam text,
  ouderb_id   text,
  ouderb_naam text,
  genome      text,
  grootte     real,
  van_a       integer,
  van_b       integer,
  mutaties    integer
);

ALTER TABLE public.geboorten ENABLE ROW LEVEL SECURITY;

-- Iedereen mag de stamboom lezen (publieke viewer)
CREATE POLICY geboorten_select_anon ON public.geboorten
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS geboorten_ts_idx ON public.geboorten (ts);
