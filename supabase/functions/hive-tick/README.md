# hive-tick — edge function

De motor van de hive: één HTTP-tick verzorgt de Botty's, laat stats vervallen,
wisselt kennis uit, en kweekt af en toe een nieuwe generatie (genomen kruisen +
muteren). Wordt aangeroepen door pg_cron (`hive-tick-elke-minuut`) én door de
browser zolang er iemand kijkt.

## Bron van waarheid
`index.ts` in deze map **is** de gedeployde function. Wijzig hier, deploy, klaar —
zo blijft git in sync met productie.

## Deployen
**Automatisch:** een push naar `main` die `supabase/functions/**` raakt triggert
`.github/workflows/deploy-edge-function.yml`. Dat vereist één repo-secret:
`SUPABASE_ACCESS_TOKEN` (Supabase → Account → Access Tokens).

**Handmatig:**
```bash
supabase functions deploy hive-tick --project-ref oblzouaapvdippyhxmpo --no-verify-jwt
```
`verify_jwt` staat uit (de viewer roept de function direct aan met de anon-flow).

## Databank
- `hive_state`  — de live toestand (1 rij, `id = 'main'`), incl. `last_kweek`
- `geboorten`   — geboortelog voor de stamboom (zie `stamboom.html`)
- `priemvondsten` — gedeelde priem-collectie voor het IQ-spel (zie `priemen.html`)
- `bezoeker_pings` — telt actieve kijkers voor de stemmings-bonus

## IQ-spel — priemsmaak
Elke actieve tick maakt elke Botty een **bewuste keuze**: uit een shortlist van
nog vrije priemen in `[PRIEM_LO, PRIEM_HI)` kiest hij de priem die het best bij
zijn persoonlijke **priemsmaak** past (+1 IQ); een verstrooide misgok kost −2.

- **Smaak** (`SMAKEN` + `smaakVan`) wordt afgeleid uit het genoom (`b0 ^ b2`),
  dus stabiel én erfelijk: kinderen lijken meestal op hun ouders (~87%), recombinatie
  en mutatie laten de smaak af en toe driften. Niches: tweeling-, Sophie-Germain-,
  palindroom-, Pythagoras-priemen, eindcijfer 1/3/7/9 en hoge cijfersom.
- **Datakwaliteit** bepaalt zowel de slaagkans als de grootte van de shortlist:
  slimmere Bottys vinden vaker iets én uiten hun smaak sterker.
- **Basis-wiskunde (leren door doen):** elke Botty telt zijn vondsten (`b.vondsten`).
  Bij mijlpalen (3, 10, 25, 50, 100, 200) beheerst hij een extra deelbaarheidsregel
  (2, 3, 5, 7, 11, 13) en verwerpt hij die kandidaten meteen — zo besteedt hij zijn
  denkmoeite aan kansrijkere getallen en vindt hij efficiënter, vooral als priemen
  schaars worden. De ervaring wordt bij de eerste tick geseed uit `priemvondsten`.
- **Euforie:** een verse vondst voelt geweldig — alle bars (energie/data/fit/geluk)
  en de stemming schieten naar 100%. Die beloning is mede de drijfveer om te jagen.
- De `priemvondsten`-tabel voorkomt dubbele ontdekkingen; IQ weegt mee in de
  partnerkeuze (`PARTNER_IQ_GEWICHT`).
- **Zoekbereik:** `PRIEM_LO`/`PRIEM_HI` (nu 10000–25000; de priemen <10000 waren
  al verzameld). Bereik verschuiven = die twee constanten aanpassen.

## Genoom
16 genen, base64url. De gen-layout staat ook in `assets/genome.js` voor de
clientside weergave — houd beide gelijk als je genen toevoegt of herordent.
