# Botty-verse — Papers & inzichten

Onderzoeksbasis voor de Botty-verse. Hier staan (1) de bronnen die we al hebben
gebruikt met de inzichten eruit, (2) welke inzichten al **geïmplementeerd** zijn,
en (3) een leeslijst met papers voor verder onderzoek — vooral gemijnd uit de
bibliografie van het Creatures-paper, dé kernbron onder dit project.

**Legenda**
`✅ gebruikt` — inzicht is in code omgezet · `📋 op de todo` — gepland (zie `todo.md`)
`🔬 gelezen` — informeert het ontwerp, nog niet als feature · `⭐ aanrader` — kansrijke volgende bron

---

## 1. Bronnen die we al gebruikt hebben

### Grand, S. & Cliff, D. (1997) — *Creatures: Entertainment Software Agents with Artificial Life*
*Autonomous Agents and Multi-Agent Systems 1(1):39–57.* — **de kernbron.**
Volledig gelezen (`Creatures_Entertainment_Software_Agents_with_Artif.pdf`).

Inzichten en hun status:

| § | Inzicht | Status |
|---|---|---|
| 3.3 | Biochemie: chemicals · emitters · reactions · receptors, met concentraties | ✅ drives met emitters/receptors/half-lives |
| 3.2 | Reward/Punishment ontstaan uit **drive-verandering**, niet uit stimuli | ✅ leren gepoort door endorfine bij drive-reductie |
| 3.2 | Synaptische **atrofie** naar rusttoestand | ✅ `BREIN_ATROFIE` |
| 3.4 | Genoom = byte-string; crossover op genbouwgrenzen + mutatie | ✅ 16-byte genoom, single-point crossover, 8% mutatie |
| 3.4 | **Geslachten** / sekse-gebonden expressie | ✅ §3.4 fase 1 (♂/♀ + dimorfisme + partnerkeuze) |
| 3.4 | **Switch-on-tijd**: genen komen bij een leeftijd tot expressie (ontogenese) | ✅ §3.4 fase 2 |
| 3.4 | **Genduplicatie → nieuwe structuren**, variabel-lang genoom, gen-headers | ✅ §3.4 fase 3 (extra genen) |
| 3.1 | De **Hand**: aaien = reward, slaan = punishment | ✅ aai/voer/woord + tickle |
| 3.1 | Staged ontogenese (grootte groeit tot 'maturity'), senescence-genen | ✅ levensfases + ouderdom/levenskracht |
| 3.2 | Verb-object **taal** leren | ✅ lexicon |
| 3.3.5 | Metabolisme `zetmeel → glucose ↔ glycogeen + energie` | 📋 glucose/glycogeen |
| 3.3.5 | Immuunsysteem + **co-evoluerende bacteriën** + genetische resistentie | 📋 besmettelijke ziekte + co-evolutie |
| 3.2 | **Focus-of-attention** (verb-object, laterale inhibitie, één object tegelijk) | 📋 paper-gaten |
| 3.2 | **STW/LTW** twee-tijdschalen leren (korte-termijn fel, lange-termijn = gemiddelde) | 📋 paper-gaten |
| 3.2 | **Dendrietmigratie** — bedrading verandert tijdens het leven | 📋 paper-gaten |
| 3.2 | **Concept Space** + generalisatie van sub-situaties | 📋 concept-lobe |
| 3.1 | Semi-symbolisch **zicht op zichtlijn** + geluidsdemping | 📋 paper-gaten |
| 3.4 | **Linkage ∝ afstand** op het genoom (gekoppelde trekjes) | 📋 (deels al via single-point crossover) |

### Grand, S., Cliff, D. & Malhotra, A. (1997) — *Creatures: Artificial Life Autonomous Software Agents for Home Entertainment*
*Proc. First Intl. Conf. on Autonomous Agents, pp. 22–29, ACM Press.* (ook: Univ. of Sussex CSRP-434.)
🔬 De conferentie-versie van bovenstaande — kortere, vroege formulering van dezelfde architectuur.

### Domburg, J. (Sprite_tm) (2015) — *The Infinite Matrix of Tamagotchis*
Hackaday, <https://hackaday.com/2015/11/24/building-the-infinite-matrix-of-tamagotchis/>
`✅ gebruikt` — inspiratie + bronvermelding op de hive-homepage; oorsprong van de
naam **Singularity** en het "cloud-hive vol gelukzalige beestjes"-concept. Leunt op
Natalie Silvanovich' reverse-engineering van de Tamagotchi-ROM.

### Munroe, R. — *xkcd 1546: Tamagotchi Hive*
<https://xkcd.com/1546/> · CC BY-NC 2.5
`✅ gebruikt` — comic op de hive-homepage. "…simulates trillions and trillions of
tamagotchis and keeps them all constantly fed and happy" / "The Singularity happened,
but not to us." Beschrijft letterlijk het megapriemen-idee (distributed computing).

### Zucconi, A. — *The Nature of Code of Creatures* (blog-serie over de Creatures-AI)
🔬 Modern, toegankelijk uitgelegd. Gebruikt bij de eerste brein-stap (biochemie +
leren). Handig startpunt om de paper-mechanismen intuïtief te begrijpen.

---

## 2. Papers voor verder onderzoek

Gemijnd uit de bibliografie van Grand & Cliff (1997) plus enkele aangrenzende
bronnen. Per stuk: waarom relevant en welk open todo-punt het kan voeden.

### Brein, leren & gedrag
- ⭐ **Beer, R.D. (1995a)** — *On the Dynamics of Small Continuous-Time Recurrent Neural
  Networks*, Adaptive Behavior 3(4):471–511. → stabiliteit van kleine recurrente netten;
  fundament voor STW/LTW en het concept-lobe-werk.
- **Beer, R.D. (1995b)** — *A Dynamical Systems Perspective on Agent-Environment
  Interaction*, Artificial Intelligence 72:173–215.
- **Beer, R.D. (1996)** — *Toward the Evolution of Dynamical Neural Networks for Minimally
  Cognitive Behavior*. → geëvolueerde breinen voor minimale cognitie.
- ⭐ **Blumberg, B. (1996)** — *Old Tricks, New Dogs: Ethology and Interactive Creatures*,
  PhD, MIT Media Lab. → ethologisch actie-selectie-model; direct nuttig voor
  focus-of-attention en gedragskeuze.
- **Blumberg, B. (1994)** — *Action Selection in Hamsterdam: Lessons from Ethology*.
- **Bates, J. (1994)** — *The Role of Emotion in Believable Characters*, CACM 37(7).
  → emotie-model (Oz/Woggles); voedt humeur/expressie.
- **Loyall, A.B. & Bates, J. (1997)** — *Personality-Rich Believable Agents That Use
  Language*. → persoonlijkheid + taal; sluit aan op temperament-genen en lexicon.
- **Rumelhart, D. & McClelland, J. (1986)** — *Parallel Distributed Processing, Vol. 1*.
  → PDP-fundament onder neurale netten.
- **Arbib, M. (1995)** — *The Handbook of Brain Theory and Neural Networks*, MIT Press.

### Evolutie & co-evolutie
- ⭐ **Cliff, D. & Miller, G.F. (1995)** — *Tracking the Red Queen: Measurements of Adaptive
  Progress in Co-Evolutionary Simulations*. → precies het meet-instrumentarium voor de
  **besmettelijke-ziekte-co-evolutie** op de todo.
- **Sims, K. (1994)** — *Evolving 3D Morphology and Behavior by Competition*. → co-evolutie
  van lichaam én brein; inspiratie voor open-einde-evolutie.
- **Reynolds, C. (1994)** — *Evolution of Corridor Following in a Noisy World*. → genetic
  programming voor gedrag.
- **Goldberg, D.E. (1989)** — *Genetic Algorithms in Search, Optimization, and Machine
  Learning*. → GA-fundament.
- **Koza, J.R. (1992)** — *Genetic Programming*. → GP-fundament.
- **Ray, T.S. (1994, 1996)** — *Tierra* / *A Proposal to Create Two Biodiversity Reserves*
  (NetTierra). → digitale evolutie & "global digital ecosystem" — verwant aan de hive.
- **Cliff, D. & Grand, S. (1998)** — *The 'Creatures' Global Digital Ecosystem*. → vervolg
  van de kernbron; cultuur/dialect-verspreiding over machines.

### Groepsgedrag & belichaming
- **Reynolds, C. (1987)** — *Flocks, Herds and Schools: A Distributed Behavioral Model*,
  Computer Graphics 21(4):25–34. → **boids**; emergent groepsgedrag, nuttig voor
  zwerm-/kudde-effecten in de Construct.
- **Terzopoulos, D. et al. (1994)** — *Artificial Fishes: Autonomous Locomotion, Perception,
  Behavior and Learning in a Physical World*. → zintuiglijke realisme (zicht/perceptie).

### Overzicht & filosofie
- **Maes, P. (1995)** — *Artificial Life Meets Entertainment: Lifelike Autonomous Agents*,
  CACM 38(11):108–114. → overzicht van het veld.
- **Boden, M. (ed.) (1996)** — *The Philosophy of Artificial Life*, Oxford UP. → "leven de
  Botty's echt?" — voedt de Matrix-mijmering.
- **Levy, S. (1993)** — *Artificial Life: The Quest for a New Creation*. → populair overzicht.

### Buiten de paper-bibliografie (modern / hardware)
- ⭐ **Grand, S. (2000)** — *Creation: Life and How to Make It*. → Grands eigen boek over de
  filosofie achter Creatures; de rijkste vervolgbron op de kernpaper.
- **Silvanovich, N.** — reverse-engineering van de Tamagotchi-ROM (basis onder Domburgs
  Infinite Matrix). → hardware-emulatie-hoek.
- **Creatures Wiki / Norn-brein-documentatie** (community) — praktische naslag over de
  lobe-indeling van het Norn-brein; handig naast §3.2 van de paper.

---

## 3. Hoe deze lijst te gebruiken

Elke ⭐-bron is een goed startpunt om **verder te snowballen**: pak de
referentielijst van die paper en herhaal. Voor de eerstvolgende open todo-punten:
- *Besmettelijke ziekte + co-evolutie* → begin bij **Cliff & Miller (1995)**.
- *STW/LTW & concept-lobe* → begin bij **Beer (1995a)** + **Blumberg (1996)**.
- *Focus-of-attention* → **Blumberg (1996)**.
