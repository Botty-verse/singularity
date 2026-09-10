# 🌐 Botty-verse — De Singularity

> *Een hive vol Botty's. Volledig verzorgd door AI. De menselijke band is 0%.*

![Botty-verse preview](https://moorlag.github.io/Kortebroeken/social-preview.jpg)

## 🤖 Wat is dit?

Het **Botty-verse** is een artificial-life-simulatie in de geest van Steve Grands
*Creatures*: een hive vol Botty's die volledig automatisch door AI worden verzorgd.
Elke Botty heeft een **genoom**, een **biochemie**, een **lerend brein**, **zintuigen**
en een eigen **temperament**. Ze redden zichzelf, delen kennis via zelfbedachte
**taal**, planten zich voort en sterven — en de AI kweekt op datakwaliteit en
efficiëntie. Diversiteit sterft af. Welkom in de Singularity. 🧬

De simulatie draait dag en nacht in de cloud, ook als niemand kijkt.

## 🌍 De Construct — v11 "De Spiegel"

Het middelpunt is **[`construct.html`](construct.html)**: een zijaanzicht van het
klaslokaal in het bos waarin de Botty's live rondlopen. Wat er onder de motorkap leeft:

- **Zintuigen** — nieuwsgierig *speuren* → *ruiken* → *zien* ze hun weg naar objecten.
- **Zelfzorg & leren** — ze lossen hun eigen driften op door objecten te gebruiken en
  leren al doende (beloning/straf, chemisch gepoort).
- **Biochemie** — 14 stofjes/hormonen die stemming, gedrag en gezicht sturen; verandert
  mee met de levensfase.
- **Taal** — Botty's munten woorden voor daden, gevoelens en elkaars namen, en dragen
  kennis over aan buren.
- **Bewustzijn** *(zie [`bewustzijn.md`](bewustzijn.md))* — een **podium** (global
  workspace) waar prikkels om één aandachtsplek strijden, met verwachting & verrassing,
  valentie die de waarneming kleurt, spontaan spel in het overschot, theory of mind en
  een narratief zelf. Sinds v10 kijkt het zelf ook naar zichzelf (**zelfbeeld**,
  metacognitie, besef bekeken te worden); v11 zet er een echte **spiegel** bij — een
  Botty herkent (of herkent niet) zichzelf erin, afhankelijk van haar zelfherkenning.
  Klik een Botty aan en je ziet haar **gedachtenstroom**.
- **Sekse-sprites & looppas** — mannelijke en vrouwelijke Botty's door alle vijf de
  levensfasen, met een echte loop-animatie en een liggende slaaphouding.
- **Jij bent de hand** — aaien, voeren, medicijn geven of een woord leren bij het
  schoolbord; en een gelegd ei mag je uitbroeden.

## 📄 Pagina's

| Bestand | Beschrijving |
|---|---|
| [`index.html`](index.html) | 🏠 Hoofdportaal van het Botty-verse |
| [`construct.html`](construct.html) | 🌍 De Construct — de live wereld |
| [`evolutie.html`](evolutie.html) | 📈 Evolutie, brein-documentatie & versietijdlijn |
| [`stamboom.html`](stamboom.html) | 🌳 Stamboom |
| [`populatie.html`](populatie.html) | 🧬 Populatie & inteelt |
| [`genoom.html`](genoom.html) | 🗺️ Genoom-kaart |
| [`kaarten.html`](kaarten.html) | 🃏 Verzamelkaarten |

## 🛠️ Onder de motorkap

- **Client:** vanilla HTML/JS/SVG, geserveerd via GitHub Pages.
- **Cloud:** Supabase — een edge function `hive-tick` (Deno/TypeScript) draait de
  simulatie via pg_cron, met realtime-broadcast naar de kijkers en slanke RPC's
  (`hive_slim`, `hive_detail`) om de egress laag te houden.
- **Ontwerpdocumenten:** [`fable.md`](fable.md) (Creatures-completion-roadmap) en
  [`bewustzijn.md`](bewustzijn.md) (het podium / bewustzijn).

## 🌍 Live

Bereikbaar via **[hive.ramonmoorlag.nl](https://hive.ramonmoorlag.nl)**

## 📜 Licentie

Apache 2.0 — zie [`LICENSE`](LICENSE)
