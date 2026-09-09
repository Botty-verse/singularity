-- Toegepast op prod. De eerdere parameterloze hive_detail() en de nieuwe
-- hive_detail(p_naam text default null) vormden een ambigue overload voor PostgREST
-- bij een aanroep zonder args ("could not choose the best candidate function").
-- Drop de oude; de nieuwe met default dekt beide gevallen (met én zonder naam).
drop function if exists public.hive_detail();
