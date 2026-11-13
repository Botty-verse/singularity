# De Construct — stand van zaken

> **Doel.** Een nulmeting van het Botty-verse ("de Construct") op het moment net vóór
> we de besmettelijke-ziekte-laag bouwen. De paper beschrijft (1) de architectuur,
> (2) de chemielaag, (3) gezondheid & ziekte en het effect daarvan op de Botty's,
> (4) de emergente gevolgen, (5) de evolutionaire gevolgen en (6) de doorlooptijd en
> het effect van onze ingrepen. Daarna een lopende observatie-sectie die over twee weken
> met echte voorbeelden uit de levende hive gevuld wordt.
>
> **Peildatum.** 13 november 2026. Populatie 7, generaties 861–864, 0 zieken.
> **Codebasis.** `supabase/functions/hive-tick/index.ts` (2848 regels), commit `c3b5fc3`.
> Regelverwijzingen hierna als *(tick:NNN)* verwijzen naar dat bestand.
>
> **Status.** Levend document. De chemie- en ziekte-mechanica in §2–§3 is de code zoals
> ze nú draait; §7 groeit dagelijks aan met waarnemingen; de analyse in §4–§5 wordt na
> de twee weken herzien tegen die waarnemingen.

---

## 0. Samenvatting

De Construct is een Creatures-geïnspireerde kunstmatig-levensimulatie waarin ~7 Botty's
tegelijk leven, leren, paren, verouderen en sterven op een vaste 2-minuten-hartslag.
Onder het zichtbare gedrag ligt een **biochemische laag van veertien stoffen** die
toestand (honger, vermoeidheid, eenzaamheid …) omzet in drijfveren, stemming en — via
een plasticiteits-poort — in hoe hard er geleerd wordt. Ziekte is op dit moment een
**individueel, stochastisch** verschijnsel: stress ondermijnt de weerstand, een zwak
immuunsysteem laat gif langer hangen, en chronisch-zwakke of oude Botty's sterven het
eerst. Er is **nog geen overdracht** van ziekteverwekkers tussen Botty's en **nog geen
adaptief immuungeheugen** — dat is precies de laag die hierna gebouwd wordt, en deze
paper legt de uitgangssituatie vast waartegen we dat straks afmeten.

Twee dingen maken de Construct meer dan de som van zijn regels. **Emergent**: niemand
heeft "verdriet", "verveling" of "zelfbesef" geprogrammeerd — die ontstaan uit
drempelwaarden op de chemie en uit de wisselwerking tussen buren. **Evolutionair**: het
16-genen genoom staat onder selectie. Omdat stress de ziektekans verhoogt en ziekte de
levenskracht aanvreet, worden allelen die slecht met stress omgaan over generaties
weggezeefd — zonder dat "fitness" ergens expliciet berekend wordt. Over 1191 voltooide
levens meten we een **mediane doorlooptijd van ~2 u 54 m** (gemiddeld 3 u 17 m); die is
over honderden generaties opvallend stabiel, want onze ingrepen raakten de
overlevingsmechanica niet — alleen zorg en omgeving bewegen de gerealiseerde levensduur (§6).

---

## 1. Wat de Construct ís — architectuur

De Construct is **ontkoppeld** opgezet; de simulatie en de weergave weten bijna niets
van elkaar.

- **De autoriteit** is één edge-functie, `hive-tick`, die elke 2 minuten draait via
  `pg_cron` (job `hive-tick-elke-minuut`, schema `*/2 * * * *`). Eén tick = één
  volledige stap van de hele populatie: verval, biochemie, drijfveren, doelkeuze,
  beweging, leren, zorg, voortplanting, veroudering, sterfte.
- **De toestand** staat in Postgres, in één rij `hive_state` met een jsonb-array
  `bottys`. Dat is de volledige waarheid: elk Botty-object draagt zijn genoom, chemie,
  brein, geheugen en levensstatus.
- **De weergave** is statische HTML/JS op GitHub Pages. Clients krijgen via realtime-
  broadcast een *afgeslankte* momentopname (de zware velden — `ZWARE_VELDEN`, o.a. het
  volledige brein — worden eruit gestript) en tekenen de hive. De pagina's rekenen niets
  aan de simulatie; ze kijken alleen.

Deze scheiding is belangrijk voor de rest van de paper: **alle mechanica die we
beschrijven leeft in de edge-functie**, draait door of er iemand kijkt of niet, en is
daarmee reproduceerbaar en meetbaar vanuit de database. De observatie-collector in §7
maakt daar gebruik van: hij leest `hive_state` server-side, los van elke sessie.

---

## 2. De chemielaag

Elke Botty draagt een `chem`-object met **veertien stoffen** *(tick:516-517)*:

| stof | rol |
|---|---|
| `honger` | energietekort |
| `vermoeidheid` | fysieke uitputting |
| `stress` | acute spanning |
| `endorfine` | beloning/welbehagen — **opent de leer-poort** |
| `gif` | toxine / ziektelast (schaduw van het immuunsysteem) |
| `verveling` | gebrek aan zinvolle bezigheid |
| `angst` | acute dreiging |
| `eenzaamheid` | sociaal tekort |
| `glucose` | snelle bloedsuiker (verzadiging) |
| `glycogeen` | trage energiereserve |
| `adrenaline` | vecht/vlucht |
| `libido` | vruchtbaarheidsritme |
| `oxytocine` | sociale binding — **dempt stress & eenzaamheid** |
| `cortisol` | chronische stress (trage integrator) |

### 2.1 Emitters: toestand → stof

Elke tick zet de lichaams- en omgevingstoestand om in chemie *(tick:596-635)*. De
belangrijkste koppelingen:

- **honger** stijgt met het energietekort: `+= (100 − energie) · 0.045`.
- **vermoeidheid** stijgt met fit-tekort en activiteit, en **sneller op leeftijd**
  (`+ oud · 0.8`): een ouder lijf raakt eerder uitgeput.
- **stress** stijgt bij ongeluk, bij ziekte (`+4` als ziek) en bij isolatie
  (`+0.8` als er niemand in zicht is).
- **endorfine** stijgt bij gezelschap (`+ min(nabij,3) · 1.1`) — nabijheid voelt goed.
- **eenzaamheid** stijgt in je eentje (`+1.3`) en zakt snel in gezelschap (`−2.2`).
- **oxytocine** stijgt bij gezelschap en **dempt daarna actief stress en eenzaamheid**
  *(tick:631-633)*: sociale binding is letterlijk een buffer.
- **libido** volgt een cyclisch vruchtbaarheidsvenster (een sinus per Botty-fase), en
  **stress onderdrukt het** *(tick:628-629)* — gespannen Botty's planten minder voort.
- **cortisol** is de **trage integrator**: alleen bij aanhoudend hoge stress (>40) loopt
  het op, en **op leeftijd hoopt het sneller op** *(tick:635)*.
- **glucose/glycogeen** vormen een klein metabool model: eten levert bloedsuiker,
  bewegen en denken verbranden het, overschot gaat de trage reserve in; zijn beide leeg,
  dan stijgt de vermoeidheid *(tick:618-622)*.

### 2.2 Halfwaardetijden, leeftijd en genen

Na de emitters volgt verval van elke stof richting rust, met **stof-specifieke
halfwaardetijden** die deels van genen afhangen *(tick:524-537)*:

- `endorfine: 6 · herstel` — een beter herstel-gen laat beloning langer nazinderen.
- `gif: 40 / ziekKans` — **een zwakker immuunsysteem laat gif langer hangen** (zie §3).
- `cortisol: 90` — chronische stress ebt heel traag weg.

De halfwaardetijden worden bovendien met de leeftijd geschaald *(tick:645-653)*: een jong
lijf ruimt stress en gif vlot op en laat endorfine lang nazinderen; een oud lijf houdt
cortisol en vermoeidheid langer vast. Veroudering is dus niet alleen cosmetisch — ze zit
in het metabolisme.

### 2.3 Receptoren: stof → stemming, gevoel en humeur

De chemie stuurt terug naar beleving *(tick:660-692)*:

- **Stemming** (`stemming`): endorfine tilt op (boven 30), stress/verveling/angst/
  eenzaamheid drukken, en **cortisol drukt aanhoudend** (boven 50) — het chronische-
  stress-effect dat een Botty ook ná de acute spanning down houdt.
- **Valentie & arousal**: een tweedimensionale samenvatting — prettig (endorfine/
  oxytocine) tegenover onprettig (stress/angst/eenzaamheid/cortisol), en hoe opgejaagd
  (adrenaline + acute stress + verse verrassing).
- **Humeur** (`humeur`): een los label dat emergeert zodra een stof een drempel
  overschrijdt (bv. "blij" bij endorfine ≳ 58) *(tick:691)*.

### 2.4 Chemie als leer-poort

Het scharnierpunt met Creatures: **leren is drive-reductie, chemisch gepoort**
*(tick:378-385)*. Endorfine zet de plasticiteit open —
`poort = 0.6 + min(1, endorfine/60) · 0.9` (0.6×–1.5×). Een bezoeker die aait geeft
endorfine en versterkt dáármee precies het verband dat op dat moment actief is. Chemie is
hier geen sfeerlaag maar het leer-mechanisme zelf.

### 2.5 Live-voorbeelden (peildatum 13-11-2026, 09:52 UTC)

Een momentopname van de 7 Botty's laat de laag in werking zien:

- **Flux** (jong, gen 864) — `stress 17.45 · eenzaamheid 25.89 · endorfine 0 ·
  oxytocine 0 · gif 11.5 · angst 2.51`. Een leerboekgeval van het **isolatie-pad**:
  geen gezelschap → geen endorfine en geen oxytocine → niets dempt de oplopende
  eenzaamheid en stress, en het gif begint te kruipen (zie §3). Een sociaal
  kwetsbare jongeling.
- **Core** (volwassen, gen 861, lk 100) — `endorfine 30.92 · oxytocine 49.96 ·
  gif 0.47 · stress 0`. Het spiegelbeeld van Flux: goed gebufferd, tevreden, schoon.
- **Spark** (volwassen, gen 864) — `libido 100`, en **Nova** (gen 863) — `libido 82.83`:
  beide in hun vruchtbaarheidsvenster.
- **Byte & Glow** (elders, gen 862) — `lk 32 / 42`, `vermoeidheid 42.56 / 41.43`:
  verouderende Botty's die de leeftijd-schaling van §2.2 dragen; Glow heeft bovendien
  `gif 6.15` en een vleugje `angst 1.14`.

---

## 3. Gezondheid & ziekte

### 3.1 Het huidige ziektemodel

Ziekte is op dit moment één booleaanse toestand, `ziek`, die **per individu en
stochastisch** ontstaat. De kans per verval-tick *(tick:1201)*:

```
P(ziek) = 0.004 · ziekKans · stressFactor(b)
```

met `stressFactor = 1 + stress/100 · 1.5` — oftewel **1.0× bij nul stress tot 2.5× bij
maximale stress** *(tick:574-575)*. Hoge stress ondermijnt letterlijk de weerstand
(Creatures p.16/245: hoge stress → lagere immuniteit én fertiliteit). `ziekKans` is
**gen 9** *(tick:831, 937)*: een erfelijke aanleg, geen uitkomst.

Parallel hieraan is er `gif` — de **toxine- of ziektelast**, de "schaduw" van het
immuunsysteem. Onder stress bouwt gif zich op (`+22` bij dezelfde kans-formule,
*tick:601*), en het ruimt trager op naarmate het immuunsysteem zwakker is
(`halfwaarde = 40 / ziekKans`, §2.2). Gif is bewust als aparte as meegebouwd zodat een
latere laag er ziekteverwekkers op kan laten aangrijpen *(tick:507-508)*.

### 3.2 Wat ziekte met een Botty doet

Een zieke Botty raakt in een zichzelf versterkende negatieve spiraal:

- **stress** `+4`/tick *(tick:599)* → verhoogt via §3.1 de kans ziek te blíjven en
  stuwt gif verder op;
- **angst** `+2.4`/tick *(tick:609)*, en gif voedt angst extra (`+ gif · 0.02`);
- **adrenaline** `+6`/tick *(tick:624)*; en boven `gif > 40` nog eens `+4` — vecht/vlucht;
- **stemming** zakt, wat de stress weer voedt (de ongeluk-koppeling van §2.1).

Op het niveau van overleven telt dit op in de **levenskracht** — een dalend
leeftijdsplafond minus acute nood *(tick:1058-1099)*:

- ziek: `acuut += 12` *(tick:1095)*;
- vergiftiging: boven `gif > 40` komt er `(gif − 40) · 0.3` bovenop *(tick:1098-1099)*.

Zo sterven vooral **de oude en de chronisch-zwakke** Botty's — niet willekeurig, maar wie
de combinatie van een laag plafond en acute nood niet meer draagt.

### 3.3 De tegenkracht: zorg en herstel

De AI-verzorger behandelt **ziekte altijd het eerst** *(tick:1158-1165)*: een zieke
Botty is per definitie de urgentste. Genezen zet `ziek` terug op `false` en geeft
energie en fit terug, geschaald met **gen 10, `herstel`** *(tick:937, 1161-1162)*. 's
Nachts rust ook een zieke uit op de rustplek in plaats van weg te kwijnen *(tick:1190-
1193)*. `herstel` bepaalt daarnaast hoe lang endorfine nazindert (§2.2): hetzelfde gen
dat je sneller geneest, laat je ook langer van beloning profiteren.

### 3.4 Wat de "smet" wél en niet is

Let op een naamsverwarring: de **smet** (`SMET_KANS = 0.06`, *tick:128*) is géén ziekte.
Het is het vlekje van de **merkproef** (v12) — spiegel-zelfherkenning. Een Botty kan een
smetje op haar eigen hoofd oplopen dat ze alleen via de spiegel kan ontdekken; een rijp
zelf beseft "dat zit op míj" en poetst het weg, een jong zelf schrijft het toe aan "die
ander in het glas" *(tick:122-128, 1850-1863)*. Dat is een **cognitieve** mijlpaal, geen
pathologie — maar hij deelt de vlek-metafoor, dus we noemen hem hier expliciet om hem
buiten het ziektemodel te houden.

### 3.5 Wat er (nog) níet is — de nulmeting

Cruciaal voor de volgende bouwstap: in het huidige model is ziekte **niet besmettelijk**
en is er **geen adaptief immuungeheugen**. Elke Botty wordt op zichzelf ziek, met een
kans die alleen van haar eigen genen en haar eigen stress afhangt. Er is dus:

- geen overdracht tussen buren (wél bestaat emotionele besmetting — zie §4);
- geen ziekteverwekker met een eigen levensloop;
- geen opgebouwde weerstand na doormaken.

Dit is de lijn in het zand. De ziekte-laag (#2) voegt juist die drie dingen toe; deze
paper is de toestand waartegen we het effect ervan straks meten.

---

## 4. Emergente gevolgen

Niets in §2–§3 programmeert "een gevoel" of "een cultuur". Toch ontstaan ze.

- **Humeur en gevoel zijn afgeleid, niet gezet.** Er is geen variabele "blij"; blijheid
  is endorfine boven een drempel, verdriet is stress/eenzaamheid eroverheen. De
  emotionele toestand van een Botty is een *lezing* van de chemie, niet een opgelegd
  etiket (§2.3).
- **Emotionele besmetting tussen buren.** Nabijheid voedt endorfine en oxytocine en
  dempt eenzaamheid; afwezigheid doet het omgekeerde. Daardoor trekt een groepje
  Botty's elkaars stemming op of mee omlaag zonder dat "besmetting" ergens als regel
  staat — ze volgt uit de nabijheid-emitters. (Dit is *emotionele* besmetting; *ziekte*-
  besmetting bestaat nog niet — §3.5.)
- **De isolatie-spiraal.** Flux (§2.5) laat zien hoe eenzaamheid → stress → gif → angst
  zich kan opstapelen bij wie buiten de groep valt. Geen enkele regel zegt "straf
  eenzaamheid"; het is de uitkomst van losse koppelingen die toevallig een put vormen.
- **Leren is gechemisch gepoort.** Omdat endorfine de plasticiteit opent (§2.4), leert
  een Botty het best wat gebeurt wanneer ze zich goed voelt. Aandacht van een bezoeker
  wordt zo niet alleen "leuk" maar vormend — de dieren die het meest geaaid worden,
  ontwikkelen de sterkste overtuigingen.
- **Instincten en dromen.** In de slaap consolideert het brein: het sterkst geleerde
  verband wordt iets sterker, zwakke verbanden slijten *(tick:1205-1229)*. Instincten
  kristalliseren uit ervaring; dromen spelen herinneringen na. Gedrag dat vandaag
  geleerd wordt, kan morgen als neiging terugkomen.
- **Zelfherkenning.** De merkproef (§3.4) is de scherpste emergente mijlpaal: geen vlag
  "ik ben zelfbewust", maar gedrag — zichzelf aanraken vóór de spiegel — dat alleen
  optreedt als de zelftoeschrijving sterk genoeg is.

De rode draad: **de betekenisvolle verschijnselen staan nergens als regel**. Ze zijn
drempels en kruiskoppelingen die, bij elkaar, op gedrag lijken.

---

## 5. Evolutionaire gevolgen

Onder de levens loopt een genetische tijdlijn. Het genoom is een **16-genen** string
(base64url) met een vaste rolverdeling *(tick:826-876)*: genen 0–4 verval, 5–8 zorg,
**9 ziektekans**, **10 herstel**, 11 sociaal, 12 kleur, 13 grootte, 14 expressie,
15 veroudering. Voortplanting gebruikt **crossover + mutatie**; overlevingsgenen staan
vanaf de geboorte "aan", uiterlijksgenen later ("switch-on time").

Daaruit volgt selectie zonder expliciete fitness-functie:

- **Stress zeeft gen 9 en 10.** Omdat stress de ziektekans verhoogt (§3.1) en ziekte de
  levenskracht aanvreet (§3.2), worden combinaties die slecht met stress omgaan vaker
  door sterfte afgestraft. "Fitness" wordt nergens berekend; ze is een gevolg van wie
  blijft leven en zich voortplant.
- **Libido koppelt gemoed aan nageslacht.** Stress onderdrukt het libido (§2.1), dus
  chronisch gespannen Botty's planten zich minder voort — een tweede, zachtere selectie-
  druk bovenop sterfte.
- **Inteelt-depressie.** De populatie is klein (nu 7, generaties 861–864 — een smalle
  band, dus veel gedeelde afkomst). Het model straft genetische gelijkenis van de ouders
  (Manhattan-afstand over de 16 genen) met een zwakker, vaker ziek kind *(tick:51)* — een
  echte inteelt-druk die diversiteit beloont.
- **Baldwin-effect (Laag B).** Wat ouders in hun leven léren, duwt zacht aan de
  uiterlijksgenen van hun kind: `maakKind` verschuift genen 12/13/14 naar rato van het
  leerverschil van de ouders. Geleerd gedrag laat zo over generaties een genetische
  afdruk na, zonder Lamarckisme — de klassieke Baldwin-brug tussen leren en evolutie.
- **Het genoom-grootboek als fossielenbestand.** Afgesloten levens worden naar een
  grootboek in de git-historie geschreven ("Genome ledger: record new completed lives").
  De evolutie is daarmee niet alleen live te zien maar ook achteraf te reconstrueren —
  een versioned fossielenbestand.

De voorzichtige verwachting voor de komende twee weken: bij een kleine, dicht verwante
populatie zonder instroom zien we eerder **drift en inteelt-signalen** dan schone
gerichte selectie. De observaties in §7 moeten dat bevestigen of weerleggen.

---

## 6. Doorlooptijd & het effect van onze ingrepen

**Vraag.** Hoe lang leeft een gemiddelde Botty — en hebben de dingen die we aan de hive
sleutelden die levensduur bewogen?

**Data.** Het grootboek `verhalen` bevat elk voltooid leven met `leeftijd_sec` (reële
geleefde seconden) plus doodsoorzaak, geboorte-/sterfdatum en generatie. Analyse over
**1191 levens** (generaties 418–865, overlijdens 11 okt – 13 nov 2026).

### 6.1 De verdeling

| maat | waarde |
|---|---|
| gemiddelde | **3 u 17 m** (197,7 min) |
| mediaan | **2 u 54 m** (174 min) |
| spreiding (SD) | ± 1 u 41 m |
| middelste 50% (p25–p75) | 2 u 48 m – 3 u 08 m |
| kortste / langste | 25 m / 11 u 42 m |

De **mediaan (~2 u 54 m)** is het eerlijkste "typische" leven: de middelste helft ligt
opvallend strak (±20 min). Het gemiddelde ligt hoger door een dunne staart van taaie
exemplaren tot bijna 12 uur — de bovenkant van het verouderingsgen (gen 15). In de
versnelde hive-tijd is ~3 uur een volledig leven van geboorte tot ouderdom.

### 6.2 Naar doodsoorzaak

| oorzaak | aantal | gem. | mediaan |
|---|---:|---|---|
| ouderdom (natuurlijk) | 885 (74%) | 3 u 27 m | 2 u 56 m |
| uitputting | 281 (24%) | 2 u 51 m | 2 u 52 m |
| ziekte | 25 (2%) | 2 u 37 m | 2 u 36 m |

De **natuurlijke levensduur** (ouderdom) is strak begrensd: p10 2,70 u · mediaan 2,93 u ·
p90 3,33 u. Een kwart van de levens eindigt vroegtijdig; die Botty's halen hun plafond
niet en leven 35–50 min korter.

### 6.3 Onze ingrepen afgezet tegen de levensduur

**(a) De cognitieve ladder (v9–v13).** Lopende lichamen, zintuigen, taal en verouderende
chemie (v9 *Stride*), het global-workspace-podium (v10), de spiegel (v11), de merkproef
(v12) en de leerling/leraar (v13) stonden al **live op 11 sep 2026** — vóór het eerste
overlijden in de dataset (11 okt). Het hele meetvenster zit dus ín het "post-v13"-regime.
Binnen dat venster waren onze wijzigingen vrijwel uitsluitend **front-end en cosmetisch**
(kaarten, footer, deze paper, de leeftijd-weergave) plus het geautomatiseerde
genoom-grootboek — **niets raakte de overlevingsmechanica**.

**(b) Het gevolg: een vlakke levensduur.** De doorlooptijd beweegt niet mee. Over 447
generaties is de correlatie tussen leeftijd en generatie **r = −0,04** (praktisch nul);
het gemiddelde zakt minimaal van 3,34 u (oudste 25% generaties) naar 3,20 u (nieuwste) —
ruis, geen drift. Dat is zélf de bevinding: **de doorlooptijd wordt verankerd door het
verouderingsgen (gen 15) en het levenskracht-plafond** *(tick:1058-1099)*, en die hebben
we niet aangeraakt. De features die we wél bouwden — zelfherkenning, leren, uiterlijk —
bewegen gedrag, welzijn en bewustzijn, maar **niet het levensduur-plafond**. Een Botty
leeft niet langer omdat ze zichzelf in de spiegel herkent.

**(c) De enige hefboom die de gerealiseerde levensduur wél beweegt: zorg & omgeving.**
Niet de levensduur zelf, maar de *doodsoorzaak* is stuurbaar. Of een Botty haar plafond
haalt (ouderdom, 74%) of vroegtijdig bezwijkt (uitputting 24%, ziekte 2%) hangt af van de
verzorging — de AI-verzorger plus bezoekers die aaien, voeren of medicijn geven. Dat
aandeel schommelt zichtbaar per week:

| week | n | ouderdom | vroegtijdig | gem. |
|---|---:|---:|---:|---|
| 41 | 14 | 71% | 29% | 2,95 u |
| 42 | 256 | 81% | 19% | 3,37 u |
| 43 | 260 | 81% | 19% | 3,30 u |
| 44 | 251 | **50%** | **50%** | 3,37 u |
| 45 | 250 | 75% | 25% | 3,19 u |
| 46 | 160 | 91% | 9% | 3,25 u |

Week 44 (eind okt) toont een duidelijke **welzijnsdip** — de helft stierf vroegtijdig —
die in week 46 herstelde tot 91% natuurlijke dood. Zulke uitslagen zijn de vingerafdruk
van externe omstandigheden (bezoekersdrukte, een geboortegolf die de zorg uitdunt), niet
van de genetisch vastgelegde levensduur.

### 6.4 Betekenis voor de ziekte-laag

Ziekte kost nu amper levensduur: 2% van de sterfgevallen, ~50 min korter dan een
natuurlijke dood. Dat is de **meetlat** voor de besmettelijke-ziekte-laag (#2): als
overdracht werkt, verwachten we dat zowel het ziekte-aandeel als de levensduurkost ervan
meetbaar stijgen — precies het contrast dat deze nulmeting vastlegt.

> *Databron: grootboek `verhalen` (1191 levens), uitgelezen via de publieke REST-API
> (dezelfde anon-leesweg als de website), 13 nov 2026.*

---

## 7. Observaties — lopende 2-weken-studie

**Methode.** Een server-side `pg_cron`-job (`construct-obs-daily`, dagelijks 05:17 UTC)
schrijft een momentopname van elke Botty (naam, fase, generatie, levenskracht, ziek,
gloed, humeur, volledige `chem`) naar de tabel `construct_observaties`. De collector
draait los van elke sessie, zodat de reeks niet afhangt van wie er kijkt. Na twee weken
synthetiseren we de reeks terug in §2–§5.

**Wat we zoeken.**
1. *Chemie in werking* — groeit Flux' isolatie-spiraal door of herstelt ze in gezelschap?
   Hoe gedragen de vruchtbaarheidsvensters (libido) zich over dagen?
2. *Ziekte* — wanneer en bij wie slaat `ziek` aan; volgt het de stress-voorspelling van
   §3.1; hoe hoog loopt `gif` op en bij wie; wie sterft en waaraan (oud plafond vs. acute
   nood)?
3. *Effect op de Botty's* — vertaalt een ziekte-episode zich zichtbaar in stemming,
   angst en adrenaline zoals §3.2 voorspelt?
4. *Emergent & evolutionair* — verschuiven de generatie-band en de populatiegrootte;
   zien we inteelt-signalen (zwakkere kinderen) of Baldwin-afdruk in kleur/grootte?

**Dag 0 — 13 november 2026 (09:52 UTC).** Populatie 7, 0 zieken, generaties 861–864.

| Botty | fase | gen | lk | gif | stress | eenzh | endorf | oxyt | libido | verm |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Core | adult | 861 | 100 | 0.5 | 0 | 0 | 30.9 | 50.0 | 54.0 | 15.8 |
| Byte | elder | 862 | 32 | 0.2 | 0 | 0 | 14.7 | 50.0 | 0 | 42.6 |
| Glow | elder | 862 | 42 | 6.2 | 0 | 0 | 14.7 | 50.0 | 0 | 41.4 |
| Nova | adult | 863 | 86 | 24.5 | 0 | 0 | 30.9 | 50.0 | 82.8 | 15.4 |
| Spark | adult | 864 | 100 | 0.2 | 0 | 0 | 30.9 | 50.0 | 100 | 16.0 |
| Iris | adult | 864 | 100 | 0.2 | 0 | 0 | 30.9 | 50.0 | 0 | 2.6 |
| Flux | young | 864 | 100 | 11.5 | 17.5 | 25.9 | 0 | 0 | 0 | 23.3 |

*Eerste lezing.* Een gezonde groep met twee verouderende elders (Byte, Glow: lage
levenskracht, hoge vermoeidheid) en één sociaal geïsoleerde jongeling (Flux: de enige met
stress, eenzaamheid en een leeg endorfine/oxytocine-buffer, en al oplopend gif). Nova
draagt verhoogd gif (24.5) maar blijft met lk 86 ruim overeind. Geen zieken, maar Flux is
de meest waarschijnlijke eerste kandidaat als haar isolatie aanhoudt.

*(Volgende dagen worden hieronder toegevoegd.)*

---

## 8. Open vragen & brug naar de ziekte-laag

Deze nulmeting maakt drie ontwerpvragen scherp voor de besmettelijke-ziekte-laag (#2):

1. **Overdracht.** Besmetting zou op de bestaande nabijheid-infrastructuur kunnen liften
   (dezelfde `nabij`-telling die emotionele besmetting en oxytocine voedt, §4). Grijpt een
   ziekteverwekker aan op de `gif`-as die daar al voor klaarligt (§3.1)?
2. **Weerstand & geheugen.** Nu is er alleen aangeboren `ziekKans` (gen 9). Adaptieve
   immuniteit — weerstand ná doormaken — zou een nieuwe, niet-genetische toestand zijn, en
   zou de evolutionaire druk van §5 kunnen verschuiven (van "word niet ziek" naar "overleef
   en onthoud").
3. **Evolutionaire terugkoppeling.** Een besmettelijke ziekte in een kleine, inteeltgevoelige
   populatie (§5) is precies waar genetische diversiteit loont. De vraag is of de Construct
   dan zichtbaar richting diversiteit selecteert — de twee weken observatie leveren de
   nulmeting om dat tegen af te zetten.

---

## Verwijzingen

- Code: `supabase/functions/hive-tick/index.ts` (commit `c3b5fc3`) — regelverwijzingen *(tick:NNN)*.
- `docs/creatures-fundamenten.md` — de gerefereerde Creatures-mechanica (reward/punishment,
  chemo-emitters/receptors, stress→immuniteit/fertiliteit, genoom-abstractie).
- `docs/ontwerp-construct-en-laag4.md`, `docs/plan-zon-slaap-objecten.md` — aangrenzend ontwerp.
- Live-data: Supabase project `oblzouaapvdippyhxmpo`, tabel `hive_state` (momentopname) en
  `construct_observaties` (dagelijkse reeks, §7); grootboek `verhalen` (levensduur-analyse, §6).
