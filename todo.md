# Botty-verse — TODO

Alles wat nog open staat in de ontwikkeling. Leidend principe: **de gebruiker
blijft toeschouwer**. Interacties zijn te observeren, niet om te micromanagen.

## Afgerond

- [x] **§3.4 Genetica (Grand & Cliff 1997) — de grootste groei** — in drie fases:
  - *Geslachten* — ♂/♀ met subtiel dimorfisme en ♂×♀-partnervoorkeur; tekens op
    de kaarten, de Construct en het verzorgerskit-paneel.
  - *Ontogenese* — genen komen mét de leeftijd tot expressie (switch-on-tijd):
    overlevingsgenen vanaf de geboorte, "volwassen" trekken rijpen mee.
  - *Variabel-lang genoom* — extra genen bovenop de 16 kern-genen met gen-headers
    (mut/dup/del) en eigen switch-on-fase; duplicatie stapelt effect → open-einde-
    evolutie. Zichtbaar via `🧬+N`-badge + geboorte-melding bij duplicatie.
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

## Wereld & objecten — opladen, eten, tanken (in uitwerking)

De Botty's vullen hun drives aan bij objecten in de Construct: elk object hoort
bij één drive en biedt een eigen manier om die te stillen. Nabijheid + het juiste
doel triggert de aanvulling (zoals `zelfzorgRonde` nu al doet); we verrijken de
feedback zodat de toeschouwer ziet wát een Botty ophaalt.

### Objectenlijst — wat een Botty er vindt

| Object (id) | Klasse | Icoon | Drive | Wat de Botty er doet / vindt |
|---|---|---|---|---|
| Laadcomputer (`laadkruk`) | machine | ⚡ | energie | **Opladen** — koppelt zich aan de steampunk-laadcomputer |
| Kastje (`kastje`) | machine | 🗄️ | energie | **Tanken** — haalt er een schepje energie uit |
| Bloempot (`bloempot`) | food | 🌼 | energie | **Eten** — knabbelt aan de eetbare, voedzame plant |
| **Zon (`zon`) — NIEUW** | hemellichaam | ☀️ | energie | **Draadloos zonneladen** — staat stil in de openlucht, ☀️ boven de kop |
| Schoolbord (`bord`) | kennis | 💾 | data | **Leren** — bestudeert de sommen op het bord |
| Boekenkast (`boekenkast`) | kennis | 📚 | data | **Leren** — bladert door de boeken |
| Lessenaar (`lessenaar`) | kennis | ✒️ | data | **Schrijven** — ordent zijn gedachten |
| Wereldbol (`bal`) | kennis | 🏃 | fit | **Bewegen** — laat de globe tollen |
| Kruk (`kruk`) | meubel | 🪑 | fit | **Rekken** — houdt zich soepel |
| Stolp (`stolp`) | curio | 🔬 | geluk | **Verwonderen** — tuurt naar het wezen onder de stolp |
| Open deur (`deur`) | plek | 🌲 | geluk | **Ontspannen** — snuift de bosgeur |

Samengevat per drive: **energie** = opladen (laadcomputer), tanken (kastje), eten
(bloempot) én zonneladen (zon) · **data** = leren (bord, boekenkast, lessenaar) ·
**fit** = bewegen (wereldbol, kruk) · **geluk** = verwonderen/ontspannen (stolp, deur).

### Uit te werken

- [ ] **Opladen / eten / tanken zichtbaar maken** — per energiebron een eigen
  micro-animatie + emoji boven de kop tijdens het aanvullen (⚡ opladen aan de
  laadcomputer, 🍽️ eten bij de bloempot, 🔋 tanken bij het kastje). De drie
  bronnen voelen zo elk anders, ook al vullen ze dezelfde `energie`-drive.
- [ ] **Zon als object + draadloos zonneladen** — nieuw agent `zon` (klasse
  hemellichaam, icoon ☀️, drive energie). Staat niet op de vloer maar aan de
  hemel/bovenin en werkt alleen **bovengronds/in de openlucht** (tuin, niveau 0).
  Laadregel: een Botty die **stilstaat** (idle, geen doel dat beweging vraagt) in
  de openlucht laadt langzaam `energie` op; boven zijn kop verschijnt een ☀️.
  's Nachts geen zon (haakt in op de bestaande `NACHT`-stand); later eventueel
  weer/seizoen. Toeschouwer ziet Botty's die stil "zonnebaden".
- [ ] **Slaapvoorkeur: ondergronds slapen, bovengronds wakker** — slapende/
  rustende Botty's trekken naar de lagere, beschutte laag (kamer/ondergronds hol):
  veilig en donker. Wakkere/actieve Botty's prefereren juist de bovengrondse laag
  (tuin) — daar schijnt de zon om te laden en is er ruimte. Vervangt/vult de
  huidige `dapper`-gebaseerde woonlaagkeuze (`thuis(b)` / `kiesDoelen`) aan met een
  slaap/waak- + dag/nacht-gedreven verticaal ritme. Versterkt het zonneladen: naar
  bóven voor de zon, naar béneden om te slapen.

## Creatures-roadmap (voorgesteld, nog niet gestart)

- [ ] **Besmettelijke ziekte + co-evolutie** — het paper-model (§3.3.5): muterende
  bacteriën met antigenen, genetische vatbaarheid/resistentie en co-evolutie.
  Toeschouwer ziet uitbraken ontstaan, uitdoven én resistentie zich verspreiden.
- [ ] **Meer levensfases** — nu baby/tiener/volwassen; toevoegen: pup/kind en
  bejaard, met eigen gedrag en uiterlijk.
- [ ] **Biochemie zichtbaar** in de verzorgerskit / construct (drives & stofjes tonen).
- [ ] **Glucose/glycogeen-metabolisme** — echte energiehuishouding i.p.v. losse honger.
- [ ] **Adrenaline** — kortstondige stress-boost met gedragsgevolg (vluchten/bevriezen).
- [ ] **Hormonale voortplantingscyclus** — vruchtbaarheid als ritme i.p.v. simpele kans.
- [ ] **Benoemde mutaties** — mutaties een naam/label geven i.p.v. anonieme byte-flips.
- [ ] **Eetbare objecten + gifstoffen** — objecten in de construct die een Botty kan
  opeten (effect op drives); planten/objecten met inslikbare gifstoffen (het `gif`-
  drive bestaat al, de bron nog niet).
- [ ] **Geurgradiënten** — Botty's ruiken eten/soortgenoten en bewegen langs de gradiënt.
- [ ] **Temperament-genen** — erfelijke persoonlijkheid (verlegen/nieuwsgierig/agressief).
- [ ] **Levensverhaal-lezer** — per Botty een terug-te-lezen biografie (geboorte, leren, kinderen, dood).
- [ ] **Hall of Fame** — eregalerij van bijzondere Botty's (oudste, slimste, meeste nakomelingen).

## Uit het Creatures-paper (Grand & Cliff 1997) — nog open

Mechanismen uit het paper die we nog niet hebben (§ verwijst naar het paper):

- [ ] **Focus-of-attention** (§3.2) — verb-object: één object tegelijk in de aandacht,
  met laterale inhibitie die objecten laat wedijveren om de blik.
- [ ] **Twee-tijdschalen leren: STW vs LTW** (§3.2) — een korte-termijngewicht dat fel
  reageert op één ervaring, en een lange-termijngewicht = voortschrijdend gemiddelde.
- [ ] **Dendrietmigratie** (§3.2) — synapsen verzwakken, koppelen los en zoeken nieuwe
  bronnen; de breintopologie verandert tijdens het leven.
- [ ] **Susceptibility-venster** (§3.2) — een dendriet blijft even gevoelig na een actie,
  zodat uitgestelde beloning/straf aan de juiste beslissing wordt toegekend.
- [ ] **Gen-koppeling (linkage ∝ afstand)** (§3.4) — trekjes die samen overerven; sluit
  aan op *temperament-genen*. (Single-point crossover geeft dit deels al.)
- [ ] **Zicht op zichtlijn + geluidsdemping** (§3.1) — semi-symbolische waarneming: alleen
  zien wat in de kijkrichting ligt, geluid dat dooft achter objecten. (Geur staat al los.)

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
