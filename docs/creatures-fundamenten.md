# Creatures-fundamenten — gerefereerde ontwerp-notities

> Doel: de échte mechanismen, regels, formules en parameters van Steve Grand's *Creatures*
> vastleggen als fundament voor het Botty-verse/hive ALife-ontwerp. Feitelijk en precies;
> waar de bronnen iets niet noemen, staat dat er expliciet bij.

## Bronnen

- **Paper**: Grand, S. & Cliff, D., *"Creatures: Entertainment Software Agents with Artificial Life"*,
  Autonomous Agents and Multi-Agent Systems, Kluwer (revised from Grand, Cliff & Malhotra 1997).
  CyberLife Technology Ltd / MIT AI Lab. Beschrijft **Creatures 1** (C1). 21 p.
  Hierna: *(paper p.X)*.
- **Genetics Kit Manual** (help-file v1.00, 28-2-1999), geschreven door Toby Simpson, David Bhowmik,
  Eric Goodwin, Gavin Buttimore; gebaseerd op de originele Gene Editor van Steve Grand. Beschrijft
  primair **Creatures 3** (C3) en benoemt verschillen met **Creatures 2** (C2). 50 p.
  Hierna: *(Genetics Kit p.Y)*.

> **Belangrijke kanttekening over getallen**: in de tekst-PDF van de paper zijn veel cijfers door de
> encoding wéggevallen (bv. "approximately ,000 neurons", "00,000 units"). Waar de Genetics Kit
> harde getallen geeft (C3) zijn die betrouwbaar; bij de paper (C1) noem ik een getal alleen als het
> leesbaar overkwam, en markeer onzekere cijfers als "[cijfer in PDF onleesbaar]". C1- en C3-getallen
> verschillen sowieso (C1 ≈ 1000 neuronen / 32k synapsen; C3 ≈ 970 neuronen, 810 genen).

---

## 1. Genoom & gen-typen

### Structuur
- Het genoom is **één enkele, haploïde chromosoom**: een **string van bytes**, opgedeeld in geïsoleerde
  genen door **interpunctie-/gene-markers** (paper p.16, p.18; Genetics Kit p.23).
- Genen van een bepaald type hebben **karakteristieke lengtes** en bytes die op specifieke manieren
  geïnterpreteerd worden. **Elke byte (behalve gene-markers) mag veilig muteren naar elke 8-bit waarde
  zonder de engine te laten crashen** (paper p.16) — fail-safe ontwerp.
- Genotype en fenotype zijn bewust **meerdere abstractielagen** uit elkaar gehouden: genen coderen voor
  **structuur** (chemo-receptors, reacties, brein-lobben), niet voor uitkomsten als "ziekteresistentie"
  of "nieuwsgierigheid" (paper p.18; Genetics Kit p.3). Gedrag *emergeert* uit structuur.

### Aantallen (C3, Genetics Kit p.4, p.24, p.35)
- Generatie-1 Norn: **±810 genen** (totaaltelling op p.35: **811 genen**), **±970 neuronen**.
- **17 vrouw-specifieke** en **9 man-specifieke** genen (rest is voor beide).
- C1 (paper p.19): "approximately [±50?] interacting genes, each with several parameters" — cijfer in
  PDF onleesbaar; de paper benadrukt vooral dat het genoom variabel-lang is.
- Mens ter vergelijking: 23 chromosomen diploïde (46), ~100.000 genen (Genetics Kit p.23).

### De 19 gen-typen (C3, Genetics Kit p.33-35) — met type/sub-type en aantallen in gen-1 Norn
Vier hoofdklassen. Type- en sub-typenummers tussen haakjes.

**Brain Genes (0):**
- Lobe (0,0) — definieert een brein-lobe. **15** in gen-1.
- Organ (0,1) — het brein-orgaan. **1** per creature; als de life-force hiervan 0 wordt, sterft de creature.
- Tract (0,2) — brein-tracts: bundels dendrieten met gemeenschappelijke bron-lobe, doel-lobe en
  processing-rule. **29** in gen-1.

**Biochemistry Genes (1):**
- Receptor (1,0) — chemo-receptor. **196** in gen-1.
- Emitter (1,1) — chemo-emitter. **43** in gen-1.
- NeuroEmitter (1,5) — **nieuw in C3**; door neuronen getriggerde emitter (tot 4 stoffen). **1** in gen-1.
- Reaction (1,2) — chemische reactie. **101** in gen-1.
- Half Lives (1,3) — halfwaardetijden voor élke stof. Meestal **1** gen.
- Initial Concentration (1,4) — vaste begindosis van een stof bij switch-on. **25** in gen-1.

**Creature Genes (2):**
- Stimulus (2,0) — verandert tot 4 stoffen wanneer een stimulus optreedt (bv. pijn bij botsen). **57** in gen-1.
- Genus/Species (2,1) — **het enige verplichte gen**; soort + moniker van moeder/vader. **1**.
- Appearance (2,2) — graphic-set per lichaamsdeel (kop, armen, body, benen, staart). **5** in gen-1.
- Pose (2,3) — pose-grafiek per lichaamsdeel. **242** in gen-1.
- Gait (2,4) — pose-sequentie (bv. loopcyclus). **14** in gen-1.
- Instinct (2,5) — instinct (situatie→actie→drive-effect), aangeleerd tijdens slaap. **30** in gen-1.
- Pigment (2,6) — kleur (R/G/B) + concentratie. **13** in gen-1.
- Pigment bleed (2,7) — laat newborn-kleur licht van ouders afwijken. **12** in gen-1.
- Facial Expression (2,8) — **nieuw in C3**; stemt op een gezichtsuitdrukking o.b.v. drives. **7** in gen-1.

**Organ Genes (3):**
- Organ (3,0) — orgaan; bevat biochemie-genen (reacties/receptors/emitters) en reguleert hun snelheid. **21** in gen-1.

> NB C1 vs C3: in **C1** is lobe-functionaliteit hard-encoded en kent C1 géén **organen**, géén **tracts**
> als apart gen-type, géén **neuro-emitters** en géén **facial-expression-genen** — die zijn in C2/C3
> bijgekomen. C3 codeert lobe- én tract-functionaliteit volledig **soft** via SVRules; dendrieten zitten
> in een eigen gen-type (tract). (Genetics Kit p.3, p.20: een C1-genoom mist organen en moet geconverteerd worden.)

### Gen-header (geldt voor alle gen-typen) (Genetics Kit p.30, p.33)
Elk gen begint met een header met:
- **Sex**: Male / Female / Both. Genoom is haploïde maar draagt **beide** sekse-sets; alleen de bij de
  sekse passende set wordt ge-expresseerd (paper p.18; Genetics Kit p.30). Zo overleven sex-linked
  eigenschappen ook als ze door het "verkeerde" geslacht geërfd worden.
- **Mutation controls** — drie aparte vlaggen:
  - **Dup** (mag dupliceren tijdens crossover),
  - **Mut** (mag muteren),
  - **Cut** (mag verwijderd worden).
  - Een gen met **alle drie uit** = **compulsory gene** (nooit muteerbaar) (Genetics Kit p.31).
- **Mutability-waarde** (mate van mutatie): default **128** (≈ C1-mutatiekans), instelbaar **0–255**
  → minder/meer mutatiekans per gen (Genetics Kit p.30, p.19 "reset to default 128").
- **Switch-on time**: één van **7 levensstadia** (Embryo … Senile) waarop het gen aangaat (Genetics Kit p.30, p.33).
- **Do not express**: gen wordt gedragen maar niet ge-expresseerd (silent carrier; kan via mutatie van
  deze vlag later actief worden) (Genetics Kit p.30, p.33).
- **Variant**: ongebruikt in C3, basis voor Norn-varianten in Creatures Adventures.
- **Organ**: voor biochemie-genen — in welk orgaan het gen zit (Genetics Kit p.33).

### Gen-expressie per levensfase
- De header bevat de **switch-on time**; het genoom wordt **periodiek opnieuw gescand** en nieuwe genen
  kunnen ge-expresseerd worden om veranderingen in structuur/uiterlijk/gedrag te realiseren, bv. tijdens
  puberteit (paper p.18). De tijd tússen stadia hangt af van de **decay-rate van de "Life"-stof** en de
  chemoreceptor-genen die stadia laten oprukken (Genetics Kit p.30).

### Crossover & mutatie
- Tijdens reproductie worden ouderlijke genen **gekruist en gesplitst op gene-grenzen** (paper p.18).
- **Gene-linkage is evenredig aan afstand** op het genoom → gelinkte eigenschappen blijven samen
  (bv. temperament met gezichtstype) (paper p.18).
- **Crossover errors** kunnen genen **weglaten of dupliceren** (paper p.18; Genetics Kit p.24) — bron van
  nieuwe structuur.
- Daarnaast een **klein aantal random mutaties** op gene-bodies (paper p.18).
- Welke operaties op een gen mogen, staat per gen in de header (Dup/Mut/Cut) (paper p.18; Genetics Kit p.30).
- C3: één natuurlijke geboorte genereert **twee** nieuwe genomen (één mannelijk, één vrouwelijk); bij
  natuurlijke geboorte is de keuze random, in de Genetics Kit kies je het geslacht (Genetics Kit p.24).
- **Generatienummer** van kind = hoogste generatie van de twee ouders **+ 1** (Genetics Kit p.25).

### Implicatie voor Botty-verse
Ons voorstel (C4) van een **variabel-lange lijst getypeerde genen met per-type crossover** klopt precies
met het origineel. Voeg twee dingen toe die we nu missen: (1) een **gen-header per gen** met Sex,
Dup/Mut/Cut-vlaggen, een **mutability-byte (0–255, default 128)**, een **switch-on levensfase**, en een
**"do not express"-vlag**; (2) **gene-linkage op afstand** zodat crossover gecorreleerde trekken samenhoudt.
Het "elke byte mag veilig muteren"-principe (fail-safe) is een harde ontwerpregel voor onze encoding.

---

## 2. Biochemie

Vier objectklassen: **chemicals, emitters, reactions, receptors** (paper p.14). In C2/C3 komen daar
**organen** (containers) en **neuro-emitters** bij.

### Chemicals
- C1: numerieke labels met een concentratie; "no inherent properties" — alle reacties zijn genetisch
  bepaald (paper p.15). Het exacte aantal in C1 is in de PDF **onleesbaar** ("range 0 to [..]").
- C3: **256 stoffen** mogelijk, concentratie **0..1** (niet aanwezig … max) (Genetics Kit p.43).
  In gen-1 is **iets meer dan de helft** in gebruik; de rest kan via mutatie in gebruik komen.
- Stoffen zijn **globaal** (slot-nummers gedeeld over alle agents/genomes) — gevaar van slot-botsingen
  (Genetics Kit p.12).

### Emitters (paper p.15; Genetics Kit p.34)
- Een emitter is **gekoppeld aan een locus** (een arbitraire byte in een ander systeem-object: neuron,
  zintuig-output, orgaan-waarde, …). Locus wordt aangeduid door een descriptor **organ / tissue / site**
  aan het begin van het emitter-gen.
- Emitter-gen bevat: locus-descriptor, **de te emitteren stof**, een **gain**, en "other characteristics".
- Werking: verandert de byte op de locus, dan past de emitter automatisch zijn **output** aan — zonder dat
  de veroorzakende code van de emitter hoeft te weten (paper p.15).
- C3: emitter "emits an amount of a specified chemical according to the value of the locus" (Genetics Kit p.34).
- Exacte parameter-namen genoemd in de paper-tekst: **gain** (rate/sample-rate worden in deze PDF's niet
  expliciet als emitter-veld genoemd — niet verzinnen).

### NeuroEmitter (C3, Genetics Kit p.34) — nieuw t.o.v. C1
- Als emitter, maar **getriggerd door neuronen** waar hij aan vastzit; kan **tot 4 stoffen** tegelijk
  emitteren. Dit is de brug brein → biochemie (een neuron dat vuurt stort stoffen in de soup).

### Receptors (paper p.15; Genetics Kit p.33-34, p.3)
- Een receptor **monitort een stof-concentratie** en **zet een arbitraire byte op een locus** (zelfde
  locus-systeem als emitters).
- Receptor-gen specificeert: **locus, de stof waarop hij reageert, de gain, de threshold en de nominal
  output** (paper p.15). Dit zijn precies de velden die het ontwerpdoc als voorbeeld noemt
  (locus/nominal/gain/threshold) — bevestigd door de bron.
- C3: receptor kan o.a. binden aan de **reaction-rate-locus** (per-reactie enzymsnelheid) én aan de
  **organ-clockrate-locus** (Genetics Kit p.3, p.34). Dus: stof-niveau → reactiesnelheid omhoog/omlaag →
  homeostatische feedback (concentratie constant houden).

### Reactions (paper p.15; Genetics Kit p.34)
- Vorm: **iA + [jB] → [kC] + [lD]** met i,j,k,l de verhoudingen/concentraties; optionele componenten
  tussen haken.
- **Alle reacties toegestaan behalve "nothing → something"** (paper p.15; Genetics Kit p.34).
- Voorbeelden (paper p.15):
  - `A + B → C + D` normale reactie (2 producten)
  - `A + B → C` "fusion"
  - `A → nothing` exponentieel verval
  - `A + B → A + C` katalyse (A onveranderd)
  - `A + B → A` katalytische afbraak (van B)
- **Reaction rate** is een gen-veld; de reactie is **concentratie-afhankelijk en dus exponentieel over tijd**
  (paper p.15). C3 toont de **approximate half-life** van de rate in de statusbalk (Genetics Kit p.34).

### Half-lives (Genetics Kit p.34, p.47)
- Eén gen ("Half Lives") specificeert per stof de **approximate half-life** = tijd waarin een stof tot de
  helft van zijn concentratie vervalt. Dit is het globale verval-mechanisme bovenop reacties.
- Exacte half-life-getallen per stof staan **niet** in deze PDF's (alleen het concept). Niet verzinnen.

### Organen als biochemie-containers (C2/C3, Genetics Kit p.36-37)
- Een **Organ-gen** "bevat" alle biochemie-genen die er in het genoom op volgen, tot het volgende organ-gen.
- Organ-velden:
  - **Clockrate** — hoe vaak de biochemie erin geüpdatet wordt (een receptor kan dit versnellen/vertragen).
  - **Organ vulnerability** — hoe snel Long-Term Life Force naar Short-Term beweegt (lager = robuuster).
  - **Lifeforce start value** — hoe stevig het orgaan bij geboorte is.
  - **Biotick start** — coördineert volgorde van orgaan-genese tijdens ontwikkeling.
  - **ATP damage coefficient** — afhankelijkheid van ATP; bij ATP-tekort wordt de creature bewusteloos en
    degraderen organen met dit tempo.
  - **Repair-rate-locus** — receptor kan hieraan binden; reguleert herstel (STLF → LTLF). Bij hatchery-Norns
    geregeld door **prostaglandine** (door botten geproduceerd op **Injury**-stof) (Genetics Kit p.37).
- **Orgaan-dood**: als Long-Term Life Force 0 bereikt, sterft het orgaan; zijn biochemie wordt nooit meer
  geüpdatet (bv. voortplanting kan sneuvelen terwijl de Norn verder gezond blijft) (Genetics Kit p.37).
- 21 organen in gen-1 Norn (1 vrouw-only). Meer organen = meer ATP-verbruik (Genetics Kit p.36).

### Metabolisme & immuunsysteem (paper p.16; Genetics Kit p.43-47)
- C1-metabolisme als reactieketen, o.a.: `starch → glucose (→ glycogen) + CO2 + H2O + energy` (paper p.16,
  cijfers in PDF deels onleesbaar).
- C3-energiepad (uit de chemie-lijst, p.43-46): starch→glucose↔glycogen; glucose→pyruvate→energy;
  energy + ADP → ATP; **ATP is de energievaluta die reacties/receptors/emitters aandrijft**; bij ATP-tekort
  → bewusteloosheid + orgaanschade. Vet-pad: fat→fatty acid→…→adipose tissue. Eiwit-pad: protein→amino acid
  (via **protease**)→muscle tissue.
- Toxines (bv. cyanide, alcohol, sleep toxin) en hun **cures** (sodium thiosulphate, antihistamine, etc.)
  zijn afzonderlijke stoffen + reacties (Genetics Kit p.45-46).
- Immuunsysteem: **bacteriën** dragen **antigenen** → roepen **antibody**-productie op; antibody N hoort bij
  antigen N. Bacteriepopulatie mag muteren/evolueren → **co-evolutie** met de creature-populatie (paper p.16;
  Genetics Kit p.46).

### Implicatie voor Botty-verse
Onze C2-schets (chemicals, emitters, receptors, reacties, half-lives) is qua skelet correct, maar mist drie
zaken die in het origineel essentieel zijn: (1) **organen als clockrate-containers** met eigen life-force —
dit geeft gratis een ziekte/herstel/sterfte-systeem en lokaliseert metabolisme; (2) **het locus-mechanisme**
(emitter/receptor binden aan een byte van een ander object) als universele koppeling tussen biochemie,
brein en zintuigen — inclusief receptors op de **reaction-rate-locus** voor homeostase; (3) de
**NeuroEmitter** (neuron→stof) als brug brein→chemie. Concrete receptor-velden om over te nemen:
**locus, stof, gain, threshold, nominal output**. Concrete emitter-velden: **locus(organ/tissue/site),
stof, gain**. Reactie-notatie `iA+jB→kC+lD`, regel "geen nothing→something", rate concentratie-afhankelijk
(exponentieel). Begin met 8–16 stoffen (onze schatting), wetende dat het origineel 256 slots heeft en ~de
helft gebruikt.

---

## 3. Drives & homeostase

### Mechanisme (paper p.14)
- Elke creature houdt een set **stoffen die "drives" representeren** ("drive to avoid pain", "drive to
  reduce hunger", …). **Hogere concentratie = dringender drive.**
- Omgevingsstimuli produceren **drive raisers** of **drive reducers** (stoffen die drive-niveaus
  verhogen/verlagen). Voorbeeld (paper p.14): een douche verlaagt "hotness"/"coldness", verlaagt
  vermoeidheid, verhoogt slaperigheid.
- **De reward/punishment-koppeling** (paper p.14), de kern van het leren:
  - `DriveReducer + Drive → Reward`  (drive-verlaging → Reward-stof)
  - `DriveRaiser → Drive + Punishment` (drive-verhoging → Punishment-stof)
- Gevolg: **drive-reductie versterkt excitatoire synapsen; drive-verhoging versterkt inhibitoire synapsen**
  (paper p.14). Reward- en Punishment-stof worden dus **niet direct door de omgeving** gemaakt, maar
  **ontstaan uit drive-level-veranderingen** tijdens reacties.
- Een **niet-aanwezige drive verlagen heeft geen effect** → dezelfde actie kan net punishment of net reward
  opleveren afhankelijk van de interne toestand. Daarom: "creatures leren eten als ze hongerig zijn, maar
  niet als ze vol zitten" (paper p.14).

### C3-drives (uit de chemie-lijst, Genetics Kit p.47-49)
- Honger is in C3 **opgesplitst in 3 drive-stoffen** (per voedselgroep die de creature kan detecteren).
- **Comfort drive** = soort "heimwee-drive": stuurt terug naar nest/lair (navigatie).
- **Stress** = gegenereerd door hoge drive-niveaus, bouwt op; hoog → effect op fertiliteit/immuniteit.
  Tussenstap "Stress (high drive)" wordt traag omgezet in Stress.
- **Drive backups**: bij angst/pijn worden alle andere drives "weggeborgen" als backup-stoffen (onzichtbaar
  voor het brein); aangedreven door hoge pijn/angst-niveaus.
- Navigatie-"drives": **Up, Down, Exit, Enter, Wait** (helpen liften/deuren gebruiken) (Genetics Kit p.48-49).
- **Disappointment** = brein-stof bij een niet-toegestane actie (bv. machine eten) → ontmoedigt herhaling.
- **Reward / Punishment** als expliciete brein-stoffen (Genetics Kit p.49).

### Implicatie voor Botty-verse
Onze C1-herframing (stats → drives, drive-verlaging = beloning) is exact het Creatures-model. Neem de
**precieze reward/punishment-reacties** over: `DriveReducer + Drive → Reward` en `DriveRaiser → Drive +
Punishment`. Dit maakt onze priem-euforie tot een natuurlijk geval van drive-reductie. Overweeg honger te
**splitsen per resource** (energie/data zoals C3 honger splitst), een **Comfort/heimwee-drive** voor
navigatie in de Construct, en een **Stress-stof** die uit hoge drives ontstaat en fertiliteit/immuniteit
remt (koppelt mooi aan Laag 4: chronisch eenzaam/gestrest → minder vruchtbaar).

---

## 4. Brein

### Architectuur (paper p.7-13; Genetics Kit p.37-42)
- Het brein is een **heterogeen neuraal netwerk**, onderverdeeld in objecten genaamd **lobes**. Cellen in
  een lobe verbinden met cellen in **tot twee andere bron-lobben** (paper p.7).
- **C1**: ±1000 neuronen, **9 lobben** [cijfer in PDF deels onleesbaar], ±32.000 synapsen; alle parameters
  genetisch (paper p.8). Eis: ~10.000 neuronen + ~320.000 synapsen/seconde verwerken bij 10 creatures
  [cijfers onleesbaar]. **C3**: ~970 neuronen, 15 lobben, 29 tracts (Genetics Kit p.4, p.35).
- **C3 tick**: lobben/tracts worden ~**4×/seconde** geüpdatet via een **Update Sequence** (een grote
  geordende lijst van alle lobben+tracts) (Genetics Kit p.37-38).
- Lobe-gen-velden (C3): positie/dimensies (Width×Height in neuronen), kleur, **Lobe ID (4-char word)**,
  **Tissue ID** (laat biochemie-receptors/emitters aan de neuronen binden), Update-Sequence-positie, en
  **SVRules** (Genetics Kit p.38).
- Tract-gen-velden (C3): **Source Lobe / Destination Lobe**, Start/End-neuron, **Connections Per Neuron**
  (bron & doel), **NGF States** (welke state-variabele Neural Growth Factor representeert — dendrieten
  migreren naar bron-neuronen met de hoogste NGF, naar het doel-neuron met de hoogste NGF), en vlaggen
  "dendrites migrate / random init" en "random aantal connecties tot max" (Genetics Kit p.40).

### Neuron-parameters (paper p.8-10)
- **Input types**: 0, 1 of 2 klassen input-dendrieten, elk uit een andere bron-lobe.
- **Input gain**: moduleert inputs.
- **Rest state**: interne scalar; bij afwezigheid van perturbatie keert de state hiernaartoe terug.
- **Relaxation rate**: state keert **exponentieel** terug naar rest state; hoe verder van evenwicht, hoe
  sneller de relaxatie (dempend; integreert intensiteit én frequentie van stimuli).
- **Threshold**: output = 0 tenzij state > threshold; dan output = state.
- **SVRule (State-Variable Rule)**: genetisch gedefinieerde functie input→state, samengesteld uit
  **opcodes + operands**, ontworpen om **extreem snel** en **fail-safe** (mutaties kunnen nooit een
  syntax-error geven) te zijn (paper p.9; Genetics Kit p.41). C3: een rule mag **tot 16 opcodes/operands**
  bevatten; werkt op een **accumulator**; lobben/tracts hebben een **Initialization Rule** (bij creatie/na
  migratie) en een **Update Rule** (elke tick) (Genetics Kit p.41, p.37).
- SVRule-variabelen: elk neuron én elke dendriet heeft **8 variabelen**. Neuron-hoofdvars: **Input, State,
  Output**. Dendriet-hoofdvars (op de leer-tract): **Short Term Weight, Long Term Weight**. Globaal zijn er
  **8 lobe-variabelen en 8 tract-variabelen** voor opslag/berekening in SVRules (Genetics Kit p.16, p.41).
- SVRule-voorbeelden (paper p.9 Table 1): `state PLUS type0`; `state PLUS type0 MINUS type1` (type0
  excitatoir, type1 inhibitoir); `anded0` (state = som type0 of 0 als niet alle inputs vuren); `state PLUS
  type0 TIMES chem` (input gemoduleerd door een **chemo-receptor**).

### Dendriet/synaps-parameters (paper p.10-11) — het leer-substraat
- **STW** (short-term weight) — moduleert het inputsignaal.
- **LTW** (long-term weight) — fungeert als **rest state voor STW**; statistische respons op reinforcement.
- **STW relaxation rate** — tempo waarmee STW terug naar LTW relaxeert.
- **LTW relaxation rate** — tempo waarmee LTW richting STW kruipt (LTW is de tragere → effectief een
  *moving average* van STW-verstoringen).
- **Susceptibility** — huidige gevoeligheid voor reinforcement.
- **Susceptibility relaxation rate** — half-life van Susceptibility.
- **Strength** — stuurt dendriet-migratie.
- Vier SVRules per dendriet: **Reinforcement SVRule** (verandert STW), **Susceptibility SVRule**,
  **Strength gain SVRule**, **Strength loss/atrophy SVRule**.

### Leerregels (paper p.10-13)
- **Reinforcement**: een stijging in STW wordt getriggerd door een Reinforcement-SVRule, meestal als reactie
  op activiteit aan een **chemo-receptor** (de Reward/Punishment-stof). STW reageert sterk op individuele
  episodes; LTW middelt over vele episodes (paper p.11).
- **Dendritic migration**: bekabeling is bij geboorte ruw gezet maar **migreert levenslang**. Periodiek
  wordt per synaps een **strength-change** berekend (vaak op chemische verandering); valt strength naar 0,
  dan **ontkoppelt** de dendriet en zoekt een nieuwe verbinding (altijd binnen dezelfde bron-lobe) (paper p.11).
- C3 leer-tract (de "visn→move"-SVRule, Genetics Kit p.41-42): elke dendriet vuurt zijn move-neuron naar
  rato van **hoeveel zijn vision-neuron veranderd is** (verschil met "last signal", **× 0.8508** attenuatie)
  — een concreet voorbeeld van getallen in een echte SVRule.

### Brain Model — de specifieke lobe-organisatie (C1, paper p.11-13)
- **Attention-directing**: twee lobben. Stimuli laten een cel vuren in een **input-lobe** (elke cel = een
  objectklasse); 1-op-1 naar een **output-lobe** die intensiteit+frequentie over tijd somt. **Laterale
  inhibitie** laat cellen concurreren om de aandacht. De blik (en dus veel zintuig-apparaat) fixeert op dit
  object; het wordt de ontvanger van gekozen acties. Beperkt de creature tot **"verb-object"** (niet
  "subject-verb-object") — bespaart verwerking (1 object tegelijk).
- **Perception lobe**: combineert meerdere zintuig-groepen; ±[?] sensorische inputs.
- **Concept Space**: groot; **event-memories**. Cellen zijn **pattern-matchers** met 1–4 dendrieten die de
  **logische AND** van hun analoge inputs berekenen (vuurt als álle inputs vuren). Random bedraad bij
  geboorte; zoeken nieuwe patronen; blijven verbonden tot dendriet-strengths 0 worden. Een biochemische
  feedback-loop + 2 SVRules houden een pool ongebruikte neuronen vrij terwijl nuttige (herhaald
  gereinforcede) cellen lang verbonden blijven.
- **Decision Layer**: klein maar **massaal dendritisch**; **relatie-memories** + actiebeslissingen. Elke cel
  = één mogelijke **actie** ("activate it", "deactivate it", "walk west", …), "it" = het aandacht-object.
  Voedt uit Concept Space. Een **Susceptibility-SVRule** per dendriet bepaalt gevoeligheid voor reinforcers;
  verhoogd als de dendriet een signaal voert én de cel vuurt; daarna **exponentieel verval**. Decision-cellen
  sommeren type0-inputs (excitatoir) − type1-inputs (inhibitoir); **matige relaxatie** → integreren over korte
  tijd; **sterkst-vurende Decision-cel = gekozen actie**; bij winnaarwissel wordt het bijbehorende
  **action-script** aangeroepen (paper p.12-13).
- **Generalisatie**: omdat Concept Space alle permutaties van 1–4 inputs probeert te representeren, roept een
  nieuwe situatie ABCD herinneringen op aan deelsituaties (D, ABD, …) maar niet aan ongerelateerde (BCDE).
  Super-concepts vuren sterker dan sub-concepts; reinforcement evenredig aan output → discriminatie ontstaat
  geleidelijk (paper p.13).
- Het hele model is **behaviouristisch**, gebaseerd op **reinforcement by drive reduction** (paper p.12).

### Chemo-modulatie van het brein
- Receptors/emitters kunnen aan loci binnen brein-lobben hangen → wijdverspreide feedback-paden. Concreet
  geïmplementeerd voor synaptische atrofie/migratie en drive-reductie/leer-reinforcement; controle van
  "arousal" was mogelijk maar **niet geïmplementeerd** (afwachten of evolutie het vindt) (paper p.15-16).
- **Delayed-reinforcement learning**: STW-veranderingen in de Decision Layer als reactie op een **Reward-stof**
  (voor excitatoire synapsen) of **Punishment-stof** (voor inhibitoire) (paper p.13).

### Implicatie voor Botty-verse
Onze C3-brein-schets (perceptie-lob → beslis-lob met reward/punishment) is trouw, maar we onderschatten de
rijkdom. Belangrijk om over te nemen: (1) de **focus-of-attention/verb-object-beperking** (laterale inhibitie
kiest één object) — dit maakt zowel het brein als Laag 4 (alleen op één buur tegelijk reageren) goedkoop en
geloofwaardig; (2) de **STW/LTW-tweetrapsleerregel** (snel reagerende short-term + tragere long-term moving
average) i.p.v. één gewicht — geeft "eerste indruk telt zwaar, maar verzacht over tijd"; (3) **Concept Space
als AND-pattern-matchers met ingebouwde generalisatie** zodat een Botty van bekende deelsituaties naar nieuwe
generaliseert; (4) **SVRules als gemuteerde, fail-safe opcode-functies** voor neuron/dendriet-gedrag (tot 16
opcodes, Init- + Update-rule) — dit is dé manier om brein-gedrag genetisch evolueerbaar te maken zonder
crashes; (5) **chemo-receptors op neuronen** (`state … TIMES chem`) zodat de biochemie het brein moduleert.
Concrete defaults om te lenen: brein-tick ~4×/sec, ~970 neuronen / 15 lobben / 29 tracts als ordegrootte.

---

## 5. Zintuigen & acties

### Zintuigen (paper p.6-7)
- Zintuigen: **zicht, geluid, tast** — alle **semi-symbolisch** benaderd (geen optica/retina-simulatie).
  Bij zicht: ligt een object in de gezichtslijn, dan vuurt een **neuron dat dat object representeert**.
- Geluid **attenueert over afstand** en wordt **gedempt door objecten** ertussen; een object is alleen
  zichtbaar als de ogen die richting op wijzen (paper p.7).
- C3 voegt **CA-stoffen** (Cellular Automata / room-systeem) toe als zintuig-/navigatielaag: o.a. **CA Sound,
  CA Light, CA Heat, CA Water, CA Nutrient, CA Protein, CA Carbohydrate, CA Fat, CA Flowers, CA Machinery**,
  en **smell-stoffen**: CA Norn/Grendel/Ettin smell + bijbehorende **home smells** (navigeren naar huis)
  (Genetics Kit p.47-48). Dit is een **geur-gradiënt-wereldmodel**.

### Acties (verbs) & objecten (nouns)
- Acties = de cellen in de **Decision Layer** (één cel = één actie): "activate it", "deactivate it",
  "walk west", enz. (paper p.12). "it" = het huidige aandacht-object.
- Objectcategorieën (nouns) = de cellen in de **attention/input-lobe**, elk een **objectklasse** (paper p.11).
- Creatures leren een **verb-object-taal** via toetsenbord, een teaching-machine, of andere creatures (paper p.7).
- Een exhaustieve lijst verbs/nouns staat **niet** in deze PDF's (alleen voorbeelden). Niet verzinnen.

### Implicatie voor Botty-verse
Onze Construct (B1-B3: objecten met affordances die een **geur-gradiënt** uitzenden waarop genavigeerd wordt)
is letterlijk het C3-model: bouw navigatie op **diffunderende "CA"-smell-stoffen** per resource/agent-type,
plus **home-smells** voor de Comfort/heimwee-drive. Zintuigen mogen semi-symbolisch: "object in zicht →
neuron vuurt", geen ray-casting nodig. Nouns = objectklasse-neuronen in de attentie-lob, verbs =
beslis-cellen; dat sluit naadloos op het brein (sectie 4) aan.

---

## 6. Levenscyclus

### Verouderingsklok (paper p.6, p.18; Genetics Kit p.30, p.47)
- C1: leeftijd in **game-hours**; bij oude leeftijd kunnen **senescence-genen** actief worden en de creature
  uiteindelijk doden (paper p.6). On-screen grootte groeit tot **"maturity" ≈ 1/3 van de levensduur** (paper p.6).
- De levensduur is **genetisch beïnvloed** (paper p.6).
- C3: een speciale stof **"Life"** vervalt van volle concentratie bij geboorte naar 0 bij dood; terwijl hij
  vervalt, **verandert hij de levensfase via receptors** (Genetics Kit p.47). De tijd tussen fasen hangt af
  van de **decay-rate van Life** + de chemoreceptor-genen die fasen laten oprukken (Genetics Kit p.30).
- **7 levensstadia** (gen-switch-on): **Embryo … Senile** (paper p.18 "puberty"; Genetics Kit p.30, p.33).
  De exacte namen van alle 7 stadia worden in de PDF's niet volledig uitgespeld (alleen Embryo en Senile als
  uitersten genoemd). Niet verzinnen.

### Dood
- Brein-orgaan dood (life force → 0) doodt de creature (Genetics Kit p.33).
- ATP-tekort → bewusteloosheid → orgaandegradatie (Genetics Kit p.36).
- Toxines/ziekten/wonden kunnen doden (Genetics Kit p.45-47, stof "Wounded" "can be fatal in large doses").
- C3 hatch-tijd: een ei komt na **±4 minuten** uit (sneller in de incubator) (Genetics Kit p.27).

### Implicatie voor Botty-verse
Onze C5-keuze (chemische leeftijdsklok i.p.v. vaste timer) is precies het C3-**"Life"-stof**-model: één
stof die van 1→0 vervalt en via **receptors levensfasen omzet**. Combineer dit met de **switch-on-time per
gen** (sectie 1) zodat nieuwe structuren bij puberteit/volwassenheid aangaan. Veroudering en sterfte worden zo
emergent (decay-rate genetisch beïnvloedbaar). Maturity ≈ 1/3 van de levensduur is een bruikbare default.

---

## 7. Concrete getallen/defaults om te hergebruiken

| Grootheid | Waarde | Bron |
|---|---|---|
| Gen-typen totaal | **19** | Genetics Kit p.3, p.35 |
| Genen in gen-1 Norn (C3) | **±810 (telling 811)** | Genetics Kit p.4, p.35 |
| Vrouw-/man-specifieke genen | **17 / 9** | Genetics Kit p.24, p.35 |
| Neuronen gen-1 Norn (C3) | **±970** | Genetics Kit p.4 |
| Lobben / tracts (C3) | **15 / 29** | Genetics Kit p.35 |
| Neuronen / synapsen (C1) | ~1000 / ~32000 [cijfers in PDF deels onleesbaar] | paper p.8 |
| Lobben (C1) | 9 [onleesbaar] | paper p.8 |
| Brein-tick | **~4×/seconde** | Genetics Kit p.37 |
| SVRule max lengte | **16 opcodes/operands** | Genetics Kit p.41 |
| Variabelen per neuron/dendriet | **8** | Genetics Kit p.41 |
| Lobe-vars / tract-vars (globaal) | **8 / 8** | Genetics Kit p.16 |
| Chemicaliën (C3) | **256 slots, 0..1, ~½ in gebruik** | Genetics Kit p.43 |
| Receptor-velden | locus, stof, gain, threshold, nominal output | paper p.15 |
| Emitter-velden | locus(organ/tissue/site), stof, gain | paper p.15 |
| Reactie-vorm | `iA + [jB] → [kC] + [lD]`, geen nothing→something | paper p.15 |
| Reactie-rate | concentratie-afhankelijk (exponentieel) | paper p.15 |
| Organen gen-1 Norn | **21** (1 vrouw-only) | Genetics Kit p.36 |
| Organ-velden | clockrate, vulnerability, lifeforce-start, biotick-start, ATP-damage-coeff, repair-rate-locus | Genetics Kit p.36-37 |
| Levensstadia | **7** (Embryo … Senile) | Genetics Kit p.30, p.33 |
| Maturity | **≈ 1/3 van levensduur** | paper p.6 |
| Mutability default | **128** (range 0–255) | Genetics Kit p.30, p.19 |
| Mutatie-vlaggen per gen | **Dup / Mut / Cut** (alle uit = compulsory) | Genetics Kit p.30-31 |
| Generatienummer kind | **max(ouders) + 1** | Genetics Kit p.25 |
| Reward-reactie | `DriveReducer + Drive → Reward` | paper p.14 |
| Punishment-reactie | `DriveRaiser → Drive + Punishment` | paper p.14 |
| Poses (C3) | **256 mogelijk, 170 in gen-1** (pose 77 = dood) | Genetics Kit p.49 |
| Gezichtsuitdrukkingen (C3) | **6** (Normal/Happy/Sad/Angry/Scared/Sleepy) | Genetics Kit p.50 |
| Hatch-tijd ei (C3) | **±4 min** | Genetics Kit p.27 |
| Voorbeeld-attenuatie in echte SVRule | **× 0.8508** (visn→move) | Genetics Kit p.42 |

> Niet in de bronnen (dus **niet verzinnen** in ons ontwerp): exacte half-life-getallen per stof; exacte
> mutatie-kans als percentage; volledige verb/noun-lijst; alle 7 stadia-namen; emitter rate/sample-rate als
> aparte velden (alleen "gain" + "other characteristics" worden genoemd).

---

## Samenvatting: wat raakt ons ontwerp het hardst

1. **Gen-header is een gen-type-overstijgend mechanisme** dat ons ontwerpdoc (C4) nog mist: Sex,
   Dup/Mut/Cut, mutability-byte (0–255, default 128), switch-on-fase, do-not-express. Crossover/mutatie
   horen híer te haken, niet op de byte-string.
2. **Gene-linkage op afstand** — gecorreleerde trekken erven samen; bewust ontwerpkenmerk, niet toevallig.
3. **Organen als clockrate-containers met life-force** ontbreken in onze C2-schets en leveren gratis een
   ziekte/herstel/sterfte-systeem + gelokaliseerd metabolisme.
4. **Het locus-koppelmechanisme** (emitter/receptor binden aan een byte van willekeurig object, incl.
   reaction-rate-locus) is dé universele lijm tussen chemie, brein en zintuigen — homeostase valt eruit.
5. **NeuroEmitter** (neuron→stof) is de brug brein→chemie die we niet expliciet hadden.
6. **STW/LTW-tweetrapsleren** i.p.v. één synaps-gewicht: snelle short-term reactie + trage long-term
   moving-average → realistisch leren.
7. **SVRules** (fail-safe opcode-functies, ≤16 opcodes, Init+Update) zijn de manier om brein-gedrag
   genetisch evolueerbaar te maken zonder crashes — krachtiger dan onze "hand-gecodeerde keuze-logica".
8. **Verb-object focus-of-attention via laterale inhibitie**: één object tegelijk. Maakt brein én Laag 4
   goedkoop en geloofwaardig (precies de begrenzing die we in A1/B3 zoeken).
9. **Concept Space = AND-pattern-matchers met ingebouwde generalisatie** — geeft transfer van bekende
   deelsituaties naar nieuwe; iets wat onze huidige beslis-logica niet doet.
10. **Navigatie via diffunderende "CA"-smell-stoffen + home-smells** is exact onze Construct-geur-gradiënt;
    de Comfort/heimwee-drive hoort daarbij.
11. **Reward/Punishment ontstaan uit drive-veranderingen** (twee precieze reacties), niet direct uit de
    omgeving — dit verfijnt onze C1-drive-herframing en verklaart "eten alleen als hongerig".
12. **"Life"-stof als chemische leeftijdsklok** die via receptors de 7 levensfasen omzet — bevestigt C5 en
    koppelt het aan de per-gen switch-on-time. Verrassend: honger is in C3 in **3 drive-stoffen** gesplitst
    en er bestaat een **Stress**-stof die fertiliteit/immuniteit remt — beide rijke, overneembare ideeën.

### Concrete bijstellingen voor `docs/ontwerp-construct-en-laag4.md`
- **C2 (biochemie)**: voeg **organen** (clockrate + life-force + repair) en het **locus-mechanisme** toe;
  noteer de exacte receptor-velden (locus/stof/gain/threshold/nominal) en emitter-velden
  (locus organ/tissue/site, stof, gain); reactie-notatie `iA+jB→kC+lD` met "geen nothing→something" en
  concentratie-afhankelijke rate; voeg **NeuroEmitter** toe. Verhoog ambitie-bandbreedte: 256 slots is het
  origineel (start klein, groei).
- **C3 (brein)**: vervang "één synaps-gewicht" door **STW/LTW**; voeg **SVRules** (opcode-functies, Init+Update,
  ≤16), **Concept Space met AND/generalisatie**, **focus-of-attention/verb-object**, en **chemo-receptors op
  neuronen** toe. Noem defaults: ~4×/sec tick, ~970 neuronen / 15 lobben / 29 tracts.
- **C1 (drives)**: leg de twee reward/punishment-reacties expliciet vast; overweeg honger-splitsing per
  resource en een Stress-stof.
- **C4 (genoom)**: maak de **gen-header** een eersteklas concept (Sex, Dup/Mut/Cut, mutability 0–255,
  switch-on-fase, do-not-express) en voeg **gene-linkage op afstand** toe aan crossover. Onze huidige
  gen-type-lijst (reactie, emitter, receptor, halfwaardetijd, lob, dendriet, stimulus-respons, drive,
  uiterlijk) mist t.o.v. C3 minstens: **tract** (apart van dendriet), **NeuroEmitter**, **organ**,
  **initial-concentration**, **gait/pose**, **facial-expression**, **pigment(+bleed)**, **instinct**, **appearance**.
- **C5 (levensfase)**: bevestigd — "Life"-stof + receptors + 7 stadia + per-gen switch-on; maturity ≈ 1/3.
- **Nieuw te overwegen subsysteem**: **instincten** (situatie→actie→drive-effect, *aangeleerd tijdens slaap*
  via training-impulsen door verb/resp-lobben) — een elegante manier om Botty's "voorgeprogrammeerd" gedrag
  mee te geven zonder gedrag hard te coderen (Genetics Kit p.42-43). Past goed bij Laag 3/4 (bv. instinct
  "zoek gezelschap bij eenzaamheid").
