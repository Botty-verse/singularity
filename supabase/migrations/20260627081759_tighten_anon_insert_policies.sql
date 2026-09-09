-- Vervang de overpermissieve `WITH CHECK (true)` anon-INSERT-policies door
-- zinnige beperkingen: recent tijdstip (geen vervalste timestamps) en, voor de
-- 404-logger, begrensde payload-groottes. Append-only telemetrie blijft werken.

-- bezoeker_pings: anon mag een ping plaatsen (ts heeft default now()).
DROP POLICY IF EXISTS "anon insert" ON public.bezoeker_pings;
CREATE POLICY "anon insert" ON public.bezoeker_pings
  FOR INSERT TO anon
  WITH CHECK (ts >= now() - interval '2 minutes' AND ts <= now() + interval '2 minutes');

-- page_404_hits: anon mag een 404-hit loggen, met begrensde payloads.
DROP POLICY IF EXISTS "anon insert" ON public.page_404_hits;
CREATE POLICY "anon insert" ON public.page_404_hits
  FOR INSERT TO anon
  WITH CHECK (
    ts >= now() - interval '2 minutes' AND ts <= now() + interval '2 minutes'
    AND char_length(coalesce(path, ''))       <= 2048
    AND char_length(coalesce(referrer, ''))   <= 2048
    AND char_length(coalesce(user_agent, '')) <= 1024
  );
