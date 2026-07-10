# Botty-verse — Papers & inzichten

Onderzoeksbasis voor de Botty-verse. Hier staan (1) de bronnen die we al hebben
gebruikt met de inzichten eruit en hun **geïmplementeerd**-status, (2) een leeslijst
met de *intellectuele voorouders* van Creatures (gemijnd uit de paper-bibliografie),
en (3) onderzoek óver de game zélf — als onderwerp, platform of broncode.

**Legenda**
`✅ gebruikt` — inzicht is in code omgezet · `📋 op de todo` — gepland (zie `todo.md`)
`🔬 gelezen` — informeert het ontwerp, nog niet als feature · `⭐ aanrader` — kansrijke volgende bron

---

## 1. Bronnen die we al gebruikt hebben

### Grand, S. & Cliff, D. (1997/1998) — *Creatures: Entertainment Software Agents with Artificial Life*
*Autonomous Agents and Multi-Agent Systems 1(1):39–57.* DOI 10.1023/A:1010042522104. — **de kernbron.**
Volledig gelezen (`Creatures_Entertainment_Software_Agents_with_Artif.pdf`).
(Vaak als 1997 geciteerd; het tijdschriftnummer verscheen in 1998.)

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
- **Cliff, D. & Grand, S. (1999)** — *The Creatures Global Digital Ecosystem*, Artificial Life
  5(1):77–93, MIT Press (PubMed 10421678). → vervolg van de kernbron; verspreiding van norns,
  genen en "digital naturalism" over machines. Direct relevant voor het hive-idee.

### Taal & communicatie (emergente taal tussen agents)
Zie ook het aparte ontwerpdoc `taal.md`.
- ⭐ **Steels, L. — Naming Games / Talking Heads (language games)**, o.a. *The Talking
  Heads Experiment* (1999/2015) en *Language Games for Autonomous Robots* (IEEE Intelligent
  Systems, 2001). → agents met joint attention + feedback convergeren zonder centrale sturing
  naar een gedeeld lexicon. **Dé theorie onder onze naming game** (taal fase B).
- ⭐ **Kirby, S. — Iterated Learning** (o.a. Kirby, Cornish & Smith, *Cumulative cultural
  evolution in the lab*, PNAS 2008). → compositie/grammatica ontstaat vanzelf uit een
  transmissie-bottleneck. Route naar productieve taal (taal fase C).
- **Steels, L. (2011)** — *Modeling the cultural evolution of language*, Physics of Life
  Reviews 8(4):339–356. → overzicht van taalspel-modellen.

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

### Steve Grand — boeken & vervolgprojecten
- ⭐ **Grand, S. (2000)** — *Creation: Life and How to Make It*, Weidenfeld & Nicolson (Harvard
  UP, 2001). → Grands eigen boek over de filosofie achter Creatures; de rijkste vervolgbron.
  Waarom bottom-up i.p.v. regelgebaseerd.
- **Grand, S. (2003)** — *Growing Up with Lucy: How to Build an Android in Twenty Easy Steps*,
  Weidenfeld & Nicolson. → Lucy (2001–2006), een robot-baby-orang-oetan; dezelfde leer-/
  ontwikkelideeën, nu belichaamd in hardware.
- **Grand, S. (2011)** — *Grandroids* (crowdfunded). → aangekondigd als opvolger van Creatures;
  interessant voor wat Grand aan het oorspronkelijke ontwerp zou veranderen.
- **Grand, S.** — *Sim-biosis / Simergy* (SourceForge). → latere sim waarin complete wezens uit
  functionele bouwblokken worden opgebouwd; verwant aan de modulaire norn-opzet.
- **Silvanovich, N.** — reverse-engineering van de Tamagotchi-ROM (basis onder Domburgs
  Infinite Matrix). → hardware-emulatie-hoek.

---

## 3. Onderzoek óver Creatures zelf (de game als onderwerp of platform)

Waar §2 de *intellectuele voorouders* van Creatures verzamelt (gemijnd uit de paper-
bibliografie), gaat dit deel over werk dat de game zélf onderzoekt of als platform gebruikt.

### De game als onderwerp / platform
- ⭐ **Bunt, B. & Gouws, G. (2020)** — *Using an artificial life simulation to enhance reflective
  critical thinking among student teachers*, Smart Learning Environments 7:16 (DOI
  10.1186/s40561-020-00119-6). → zet Creatures in als serious game in de lerarenopleiding
  (norns voeden/onderwijzen → reflecteren op leren). Zeer relevant voor de **onderwijskant**:
  koppelt de game aan leertheorie (constructivisme, game-based learning, metacognitie).
- **Taylor, T., Dorin, A. & Korb, K. (2014)** — *Artificial Life and the Web: WebAL Comes of
  Age*, arXiv:1407.5719. → plaatst Creatures (norns die via Docking Station tussen online
  werelden reizen) in de geschiedenis van web-based alife. Kader voor het **gedistribueerde
  cloud-hive-concept**.
- **"The forgotten AI critters of the 1990s…"** (2026), pickles.news. → essay dat Creatures
  naast Tierra/Avida legt en betoogt dat de alife-periode agents als *wezens* zag (intrinsieke
  drives, individuele verschillen, drift, emergente faalmodi) i.p.v. als modelconfiguraties.
  Direct relevant voor hoe je Botty's positioneert. (Niet peer-reviewed.)

### Broncode & aangrenzende platformen
- ⭐ **openc2e** — open-source Creatures-engine (C++, SDL/Qt, LGPL). openc2e.github.io ·
  github.com/openc2e/openc2e. → draait de originele Creatures 1/2/3 + Docking Station; bevat
  CAOS-parser/runtime, genoom-/creature-code en de biochemie-simulatie. **Dé plek om het
  mechanisme op codeniveau te lezen** i.p.v. alleen te beschrijven. (Engine, geen spel — content
  nodig om te draaien.)
- **Lenski, R.E., Ofria, C., Pennock, R.T. & Adami, C. (2003)** — *The Evolutionary Origin of
  Complex Features*, Nature 423(6936):139–144 (DOI 10.1038/nature01568). → over **Avida** (buur-
  platform): complexe functies ontstaan door voort te bouwen op eenvoudiger functies, mits
  tussenstappen niet worden bestraft — soms zijn nadelige mutaties opstapjes. Relevant voor de
  **ziekte-co-evolutie** en het human-in-the-loop reward-mechanisme (niet-bestraffen van
  tussenstappen ≈ curriculum learning).
- **"Forgotten Future: Creatures' Radical AI NPCs of 1996"** — playxix.com. → documentaire-
  achtige achtergrond over de geschiedenis en ambitie van de game.
- **Creatures Wiki / Norn-brein-documentatie** (community) — praktische naslag over de
  lobe-indeling van het Norn-brein; handig naast §3.2 van de paper.

---

## 4. Hoe deze lijst te gebruiken

Elke ⭐-bron is een goed startpunt om **verder te snowballen**: pak de
referentielijst van die paper en herhaal. Voor de eerstvolgende open todo-punten:
- *Besmettelijke ziekte + co-evolutie* → begin bij **Cliff & Miller (1995)** en **Lenski et al. (2003, Avida)**.
- *STW/LTW & concept-lobe* → begin bij **Beer (1995a)** + **Blumberg (1996)**.
- *Focus-of-attention* → **Blumberg (1996)**.
- *Mechanisme op codeniveau lezen* → **openc2e** (broncode).
- *Onderwijshoek* → **Bunt & Gouws (2020)** en z'n referentielijst.

**Verder snowballen:**
- Referentielijst van **Bunt & Gouws (2020)** voor onderwijs-/leertheorie.
- Google Scholar "cited by" op **Grand & Cliff (1998)** voor nieuwere toepassingen/analyses.
- Zoektermen: "Creatures norn neural network", "digital naturalism Creatures",
  "Cyberlife biochemistry artificial life", "Docking Station online evolution".
