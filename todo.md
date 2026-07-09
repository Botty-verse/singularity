# Botty-verse — TODO

Alles wat nog open staat in de ontwikkeling. Leidend principe: **de gebruiker
blijft toeschouwer**. Interacties zijn te observeren, niet om te micromanagen.

## Afgerond

- [x] **Bezoekers-rekenkracht → megapriemen** — de browser van bezoekers zoekt
  reuzenpriemen (honderden cijfers) voor de hive via een Web Worker. Gevonden
  priemen worden server-side geverifieerd (`priem-claim`) en toegekend aan een
  levende Botty (+IQ, race-vrij verrekend in hive-tick). Opt-in op priemen.html,
  en **automatisch aan zodra een bezoeker de Construct opent**. Nieuwe
  megapriemen-sectie op priemen.html.

## Uitgesteld (afgesproken later te tunen)

- [x] **Niveaukeuze tunen** — de visualisatie volgt nu het doel: zelfzorg en
  nieuwsgierigheid gaan naar het passende object, slapen/herstellen naar de
  rustplek, gezelschap/voortplanting naar andere Botty's en priemjacht naar het
  schoolbord. Daardoor is de keuze voor tuin of kamer niet langer willekeurig.

## Creatures-roadmap (voorgesteld, nog niet gestart)

- [ ] **Besmettelijke ziekte** — ziekte die zich verspreidt bij nabijheid; toeschouwer
  ziet uitbraken ontstaan en uitdoven.
- [ ] **Meer levensfases** — nu baby/tiener/volwassen; toevoegen: pup/kind en
  bejaard, met eigen gedrag en uiterlijk.
- [ ] **Biochemie zichtbaar** in de verzorgerskit / construct (drives & stofjes tonen).
- [ ] **Glucose/glycogeen-metabolisme** — echte energiehuishouding i.p.v. losse honger.
- [ ] **Adrenaline** — kortstondige stress-boost met gedragsgevolg (vluchten/bevriezen).
- [ ] **Hormonale voortplantingscyclus** — vruchtbaarheid als ritme i.p.v. simpele kans.
- [ ] **Benoemde mutaties** — mutaties een naam/label geven i.p.v. anonieme byte-flips.
- [ ] **Eetbare objecten** — objecten in de construct die een Botty kan opeten (effect op drives).
- [ ] **Geurgradiënten** — Botty's ruiken eten/soortgenoten en bewegen langs de gradiënt.
- [ ] **Temperament-genen** — erfelijke persoonlijkheid (verlegen/nieuwsgierig/agressief).
- [ ] **Levensverhaal-lezer** — per Botty een terug-te-lezen biografie (geboorte, leren, kinderen, dood).
- [ ] **Hall of Fame** — eregalerij van bijzondere Botty's (oudste, slimste, meeste nakomelingen).

## Brein-roadmap (volgende stappen)

- [ ] **Rijkere werkwoorden** in het lexicon: get / drop / come / run
  (nu vooral zelfstandige naamwoorden + basale acties).
- [ ] **Concept-lobe** — situatie → actie-associatie, dichter bij het Norn-model.

## E-paper Botty

- [ ] **Hardware-test op de Pi Zero W** (gebruikerskant) — Waveshare 2.13b V3.
  Code + systemd-service + README staan klaar in `epaper/`.

## Werkafspraken / lessen

- **Deploy hive-tick via CI**, niet via subagent-MCP-deploy.
  Push naar `main` die `supabase/functions/**` raakt → GitHub Action deployt
  betrouwbaar. Inline MCP-deploys hebben de functie twee keer gebroken.
- **PR's meteen mergen** (staande instructie van de gebruiker).
