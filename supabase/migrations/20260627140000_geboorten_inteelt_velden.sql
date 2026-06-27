-- Inteelt-mechaniek: leg per geboorte de verwantschap van de ouders vast
-- (0..1, op basis van genetische afstand) en of het kind een verse mutant
-- ("immigrant") was die de hive injecteerde bij dreigende inteelt.
ALTER TABLE public.geboorten
  ADD COLUMN IF NOT EXISTS verwantschap real,
  ADD COLUMN IF NOT EXISTS immigrant boolean DEFAULT false;
