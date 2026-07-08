# Botty-verse — TODO

Alles wat nog open staat in de ontwikkeling. Leidend principe: **de gebruiker
blijft toeschouwer**. Interacties zijn te observeren, niet om te micromanagen.

## Uitgesteld (afgesproken later te tunen)

- [ ] **Niveaukeuze tunen** — waarom zit een Botty boven (tuin) of onder (kamer)?
  Nu grotendeels willekeurig/lane-gestuurd. Koppel de keuze aan gedrag
  (honger → naar eten, slaap → naar rustplek, sociaal → bij anderen, dag/nacht).

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
