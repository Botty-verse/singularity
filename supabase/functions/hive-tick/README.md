# hive-tick — edge function

De motor van de hive: één HTTP-tick verzorgt de Botty's, laat stats vervallen,
wisselt kennis uit, en kweekt af en toe een nieuwe generatie (genomen kruisen +
muteren). Wordt aangeroepen door pg_cron (`hive-tick-elke-minuut`) én door de
browser zolang er iemand kijkt.

## Bron van waarheid
`index.ts` in deze map **is** de gedeployde function. Wijzig hier, deploy, klaar —
zo blijft git in sync met productie.

## Deployen
```bash
supabase functions deploy hive-tick --project-ref oblzouaapvdippyhxmpo
```
`verify_jwt` staat uit (de viewer roept de function direct aan met de anon-flow).

## Databank
- `hive_state`  — de live toestand (1 rij, `id = 'main'`), incl. `last_kweek`
- `geboorten`   — geboortelog voor de stamboom (zie `stamboom.html`)
- `bezoeker_pings` — telt actieve kijkers voor de stemmings-bonus

## Genoom
16 genen, base64url. De gen-layout staat ook in `assets/genome.js` voor de
clientside weergave — houd beide gelijk als je genen toevoegt of herordent.
