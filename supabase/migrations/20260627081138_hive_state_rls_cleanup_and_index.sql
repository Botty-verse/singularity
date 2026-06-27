-- De service-role key omzeilt RLS, dus deze ALL-policy deed feitelijk niets,
-- maar zorgde wel voor (a) dubbele permissive SELECT-policies en
-- (b) auth.role()-evaluatie per rij. Client schrijft nooit naar hive_state
-- (alleen reads/realtime), dus veilig te verwijderen.
DROP POLICY IF EXISTS "service role can write hive" ON public.hive_state;

-- Ongebruikte index: de stamboom sorteert op id, niet op ts.
DROP INDEX IF EXISTS public.geboorten_ts_idx;
