# Botty-verse — Taal: onderzoek & ontwerp

Kan de hive een *concept van taal* leren en zelf verkennen? Dit document vat samen
wat er nu draait, waar de sprong van vocabulaire naar taal zit, welke modellen dat
onderbouwen, en een gefaseerd plan. Leidend principe blijft: **de gebruiker is
toeschouwer** — taal ontstaat tussen de Botty's, wij kijken toe (en mogen af en toe
een woord influisteren via de Hand).

Bronnen staan in `papers.md`; de taal-specifieke toevoegingen (Steels, Kirby) zijn
daar apart opgenomen.

---

## 1. Wat er nu al draait

De hive draait feitelijk al een **naming game** (Steels). In `hive-tick`:

- Elke Botty heeft een `lexicon`: **concept → zelfverzonnen woord**, opgebouwd uit
  medeklinker+klinker-syllaben (`muntWoord`).
- Woorden worden **gemunt** bij een sterke ervaring — geslaagde zelfzorg bij een van
  de object-concepten (`CONCEPTEN` = de objecten).
- In de sociale ronde geeft een spreker een woord door aan een luisteraar (`praat`);
  de luisteraar neemt het over met **12% kans op klankmutatie** → dialect-drift
  (`muteerWoord`).
- De hive **convergeert** langzaam naar een gedeelde taal mét varianten; Botty's
  mijmeren over hun eigen woord; de **bezoeker** kan een woord aanleren (de Hand).

Dat is echte emergente **vocabulaire**. Het is nog geen *taal* — zie §2.

---

## 2. De vier gaten naar "een concept van taal"

1. **Alleen zelfstandige naamwoorden (objecten).** Creatures' kern is **verb-object**
   ("eet voer", "kom hier"). Botty's kunnen nog geen *acties*, *drives/emoties*,
   *plaatsen* of *elkaar* benoemen.
2. **Geen compositie / syntaxis.** Elk woord is atomair. De sprong van vocabulaire
   naar taal is het **combineren** van woorden tot een nieuwe betekenis. Productiviteit
   (eindig lexicon → oneindig veel uitingen) is precies wat taal definieert.
3. **Geen feedback-lus.** Doorgeven is nu éénrichting (kopiëren). Een echt taalspel
   heeft een **succes-signaal**: begreep de luisteraar het (wees hij naar het juiste
   concept)? Bij succes versterken spreker én luisteraar het woord, bij falen zwakt
   het af. Zo ontstaat onderhandeling, snellere convergentie én af en toe een schisma.
4. **Geen zelf-exploratie.** Botty's *experimenteren* niet met taal. Zelf-verkennen =
   **gebrabbel** (jonge Botty's verzinnen klanken), sociaal **uitproberen**, en woorden
   die begrepen wórden overleven. Een lichte "taalspel"-drang.

---

## 3. Modellen die dit onderbouwen

- **Steels — Naming Games / Talking Heads (language games).** Twee agents delen
  aandacht voor een object; spreker noemt het, luisteraar wijst aan; bij succes lijnen
  ze hun woord-scores uit, bij mislukking verzwakken ze. Een populatie convergeert
  zonder centrale sturing naar een gedeeld lexicon. **Dit is precies onze naming game,
  maar mét feedback** — de directe theorie onder fase B.
- **Kirby — Iterated Learning.** Grammatica en **compositie ontstaan vanzelf** uit een
  *transmissie-bottleneck*: een lerende ziet maar een deel van de taal, moet de rest
  generaliseren, en die druk selecteert voor structuur (herbruikbare deel-woorden).
  De route naar gat #2 (fase C).
- **Creatures §3.2 (Grand & Cliff).** Verb-object + **focus-of-attention** als grounding:
  betekenis hangt aan het object dat nú in de aandacht is. Levert de koppeling tussen
  woord en wereld die joint attention nodig heeft.

---

## 4. Gefaseerd plan

Zelfde stijl als §3.4: kleine, backward-compatibele stappen, elk een eigen PR, elk
zichtbaar op de Construct en op een nieuwe taal-pagina.

### Fase A — Concepten verbreden (laag risico, snel zichtbaar)
- Naast objecten ook **acties** (aai, eet, jaag, slaap), **drives/emoties** (honger,
  angst, blij) en **elkaars namen** (proper names) als concepten.
- Woorden worden gemunt op het moment dat het concept sterk speelt (grote honger →
  woord voor "honger"; een aai → woord voor "aai"; een vriend → naam).
- Zichtbaar: rijker lexicon, Botty's die elkaar bij (verzonnen) naam noemen.

### Fase B — Feedback-lus (de echte naming game)
- **Joint attention**: spreker en luisteraar delen een concept alleen als beiden er
  op dat moment mee bezig zijn (zelfde object/POI, of zelfde drive).
- **Succes/agreement-signaal**: begrijpt de luisteraar het woord al (of raadt hij het
  concept goed), dan **versterken** beiden het; anders **verzwakken**. Woord-scores
  i.p.v. simpel kopiëren.
- Emergente convergentie wordt sneller en robuuster; dialecten en schisma's worden
  betekenisvol i.p.v. toeval.

### Fase C — Compositie (de taal-sprong, ambitieus)
- Botty's **combineren** twee woorden tot een uiting (verb+object): "eet voer",
  "kom bij Nova".
- **Iterated-learning-bottleneck**: kinderen erven maar een deel van het lexicon en
  moeten de rest generaliseren → druk richting herbruikbare deel-woorden (grammatica-
  kiem).
- Zichtbaar: uitingen van twee woorden in de ticker; herbruikbare stukjes die zich
  verspreiden.

### Doorlopend — Zelf-exploratie & een taal-pagina
- **Gebrabbel**: jonge Botty's verzinnen af en toe een klank en proberen die sociaal;
  begrepen klanken beklijven (koppelt aan ontogenese uit §3.4 fase 2).
- **`taal.html`** (nieuwe pagina): het live lexicon van de hive, per concept de
  varianten/dialecten, een "woord-stamboom" (welk woord muteerde waaruit), en meldingen
  bij een nieuw gemunt of geconvergeerd woord. Puur toeschouwen.

---

## 5. Aanbevolen startpunt

**Fase A** — concepten verbreden. Grootste zichtbare winst per regel code, laagste
risico, en het legt de conceptenset klaar die fase B (feedback) en fase C (compositie)
nodig hebben. Daarna B, dan C, met de taal-pagina zodra er iets te tonen valt.

Literatuur-snowball: begin bij **Steels' naming games** (fase B) en **Kirby's iterated
learning** (fase C) — zie `papers.md`.
