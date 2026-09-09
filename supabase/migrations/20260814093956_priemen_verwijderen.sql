-- Priemgetallen-onderzoek uit productie halen — Fase D (database).
-- Het IQ-priemspel, de vind-ronde en de browser-megapriemen zijn uit de code
-- verwijderd (zie de "Priemen verwijderen"-PR's A/B/C). Deze migratie ruimt de
-- bijbehorende databank-objecten op. IQ blijft als rustend cijfer in hive_state
-- bestaan; de levens-tabel (grafschriften) blijft ongewijzigd.
drop function if exists public.priem_stats();
drop table if exists public.priemvondsten cascade;
drop table if exists public.mega_priemen cascade;
