# Ontwerp — Laag 4 (besef van anderen) & De Construct

> Status: **ontwerp / levend document**. Nog niets gebouwd. Bedoeld om samen te kneden.
> Inspiratie: Steve Grand's *Creatures* (1996) — biochemie, drives, genetica en brein.

Dit document schetst twee samenhangende stappen:

1. **Laag 4** van het bewustzijn — een Botty wordt zich bewust van *anderen*.
2. **De Construct** — een ruimtelijke wereld waarin de hive vrij rondloopt, met een
   genetica/biochemie/brein-model gefundeerd op de Creatures-architectuur.

Beide bouwen voort op wat er al draait: het 16-byte genoom, de stats, priemsmaak,
leren-door-doen, en bewustzijn **Laag 1** (innerlijke gedachte), **Laag 2**
(episodisch geheugen) en **Laag 3** (eigen doelen/agency).

---

## Deel A — Laag 4: besef van anderen (theory of mind)

Tot nu toe is een Botty zich bewust van *zichzelf* (staat, geheugen, doel). Laag 4
voegt besef van **anderen** toe: hij merkt hun toestand op en reageert sociaal.

### A1. Perceptie van anderen
Elke tick "leest" een Botty de zichtbare signalen van andere Botty's:
`stemming`, `ziek`, recente euforie (vondst), en hun `doel`. In de huidige abstracte
sim is iedereen zichtbaar; in de Construct (Deel B) alleen wie dichtbij/zichtbaar is —
dat is meteen de natuurlijke begrenzing van theory of mind.

### A2. Sociale gedachten
`denkBewust` krijgt sociale varianten in de saillantie-prioriteit:
- "Volt ziet er moe uit." (lage stemming bij ander)
- "Iris is dolblij — wat vond ze?" (euforie bij ander)
- "Arc is ziek… ik maak me zorgen." (ziek ander)

Gewogen door temperament: gen 11 (sociaal) bepaalt hoe vaak een Botty áán anderen
denkt; een nieuwe afgeleide **empathie** bepaalt hoe sterk hij meevoelt.

### A3. Emotionele besmetting (emotional contagion)
Een Botty dicht bij een zeer blije/verdrietige ander schuift zijn eigen `stemming`
licht die kant op (geschaald met empathie). Simpele, geloofwaardige ALife-dynamiek.

### A4. Relaties & affiniteit
Per Botty een kleine `relaties`-map (`bid → affiniteit`): positieve ontmoetingen
(kennisuitwisseling, samen rondhangen, gedeelde smaak, getroost worden) verhogen de
affiniteit; tijd laat 'm langzaam zakken. Hieruit ontstaan **vriendschappen**, die
terugkoppelen naar Laag 3:
- gezelschap-doel kiest bij voorkeur een *vriend* i.p.v. willekeurig;
- partnerkeuze weegt affiniteit mee (naast genen/IQ/diversiteit).

### A5. Andersgerichte acties (de kern van theory of mind)
Een empathische Botty die een zieke/verdrietige buur opmerkt, kan zijn beurt
besteden aan **troosten** i.p.v. jagen: hij geeft de ander een stemmingsboost. Dat is
een handeling *voor een ander* — het zichtbare bewijs van besef van anderen. De
getrooste onthoudt het ("X troostte me") → affiniteit stijgt → wederkerigheid.

### A6. Datamodel (geen migratie nodig)
Alles in het bestaande `bottys`-jsonb: `b.relaties` (capped), uitbreiding van
`b.gedachte`-varianten, en stemmings-aanpassing via besmetting. Geen genoom-wijziging:
empathie leiden we (voorlopig) af uit gen 11. In de Creatures-genoomtoekomst (Deel C)
wordt dit een **receptor** (neemt de "emotie-stof" van anderen waar) gekoppeld aan een
**drive** (eenzaamheid).

### A7. UI
- `index.html`: sociale gedachten verschijnen vanzelf in de gedachtenbubbel; eventueel
  een klein hartje/affiniteits-icoon tussen bevriende Botty's.
- `genoom.html`: een mini-relatielijst per Botty ("vrienden: Iris, Volt").

> **Scope-inschatting:** Laag 4 is bouwbaar op het huidige abstracte model (ruimte niet
> vereist), maar wordt rijker mét de Construct (perceptie begrensd door nabijheid).

---

## Deel B — De Construct: een ruimtelijke wereld

Een 2D-wereld waarin de Botty's daadwerkelijk **rondlopen**, eten, rusten, elkaar
opzoeken en priemen "oogsten" — i.p.v. abstracte kaarten.

### B1. Wereldmodel
- Een 2D-ruimte (top-down of side-on) met **regio's/kamers** en **objecten**.
- Elke Botty heeft `pos {x,y}`, `snelheid`, `richting`.
- **Objecten met affordances** (Creatures-stijl): voedsel (→ energie), datakristal
  (→ data), rustplek (→ fit/herstel), speelobject (→ geluk), priem-bron (→ jachtgrond).
  Elk object zendt een "geur"-gradiënt uit waar de Botty op af kan navigeren.

### B2. Beweging & navigatie
Beweging volgt uit `doel` (Laag 3) + drives: honger → naar voedsel, eenzaam → naar een
vriend, jachtlust → naar een priem-bron. Sturen = simpele steering naar het doelwit;
geen zware pathfinding nodig in v1.

### B3. Perceptie begrensd door ruimte
Een Botty ziet/ruikt alleen wat **dichtbij** is. Dit begrenst Laag 4 (alleen buren
worden "gelezen") en maakt foerageren betekenisvol (geur-gradiënt volgen).

### B4. Architectuur: waar draait de beweging?
De sim draait 24/7 server-side (`hive-tick`), dus **canonieke posities staan in
`hive_state`** en bewegen per tick. Maar de tick is grof (pg_cron 1×/min; browser 3s) —
te traag voor vloeiende beweging. Opties (te kiezen):

- **B4-a (aanbevolen): server-autoritatief + client-interpolatie.** De tick zet grote,
  doelgerichte stappen; de browser interpoleert/dead-reckont tussen ticks voor vloeiend
  beeld. Canon blijft server-side, goedkoop, 24/7-bestendig.
- **B4-b: snellere server-tick** (bv. elke seconde) — vloeiender maar duurder/meer
  schrijflast op Supabase.
- **B4-c: puur client-side beweging** als "voorspelling" boven een trage canon-staat —
  mooist ogend, maar twee bronnen van waarheid (driftrisico).

### B5. Rendering
De viewer wordt een **canvas** (top-down of side-on) met bewegende Botty-sprites i.p.v.
statische kaarten. De bestaande kaart-info (stats, gedachte, doel) verhuist naar een
hover/inspecteer-paneel. Grote UI-verandering → gefaseerd (eerst simpele stippen/sprites
die bewegen, daarna rijker).

### B6. Top-down vs side-on
Creatures is **side-on** met zwaartekracht, verdiepingen en liften — sfeervol maar
complexer (fysica). **Top-down** is simpeler (vrij bewegen in het vlak) en sluit goed
aan op een hive. Te kiezen.

---

## Deel C — Creatures-gefundeerde genetica

Het huidige genoom (16 bytes, elk gen een multiplier) is bewust simpel. Creatures (C2)
heeft ~800 genen, waarvan de helft **biochemie + zenuwstelsel**. Om die kant op te
groeien zonder alles te herschrijven, een gefaseerd pad.

### C1. Stats → drives
Herframe de huidige stats als **drives** die een creature wíl verlagen:
honger (energie), kennisdorst (data), vermoeidheid (fit), verveling (geluk),
eenzaamheid (sociaal). Een drive verlagen = beloning; dat is precies de leer-signaal-
logica die Creatures gebruikt (en die wij al kennen via de priem-euforie).

### C2. Biochemie-laag (Creatures-kern)
Introduceer een kleine **chemie-engine**:
- **Chemicaliën**: een set stoffen met een concentratie (start klein, bv. 8–16).
- **Emitters**: lichaams-/wereldtoestand → stof (bv. "energie laag" emitteert honger-stof).
- **Receptors**: stof-concentratie → effect op een locus (bv. honger-stof → drijf naar
  voedsel / stemming omlaag).
- **Reacties**: stof A (+B) → C, met snelheid (metabolisme).
- **Halfwaardetijden**: elke stof vervalt per tick.

Dit vervangt de ad-hoc verval-formules door een emergente chemie — veel
Creatures-authentieker. Begint klein, groeit gen voor gen.

### C3. Brein-laag
Vervang op termijn de hand-gecodeerde keuze-logica (`kiesDoel`/`zorg`) door een klein
**beslis-netwerk**: een perceptie-lob (zintuigen: eigen drives, nabije objecten/anderen)
→ beslis-lob (actie: eten, rusten, spelen, naderen, jagen, troosten), met **reward/
punishment-stoffen** die dendrieten versterken/verzwakken (reinforcement). Zo *leert* een
Botty welke actie zijn drives verlaagt — i.p.v. dat wij het voorschrijven.

### C4. Genoom-migratie
16 bytes is te klein. Ontwerp een **nieuw, gestructureerd genoom**: een variabel-lange
lijst **getypeerde genen** (reactie, emitter, receptor, halfwaardetijd, lob, dendriet,
stimulus-respons, drive, uiterlijk), base64url-gecodeerd en **geversioneerd**.
- Crossover/mutatie werken **per gen-type** (zoals Creatures), niet als platte bytestring.
- **Backward-compatible**: het klassieke 16-byte genoom blijft als "v1/legacy" leesbaar;
  bestaande Botty's krijgen een nette default-vertaling naar de nieuwe structuur.

### C5. Levensfase-klok
Veroudering (baby → tiener → volwassen → ouderdom → dood) via een **chemische klok**
i.p.v. een vaste timer — zoals Creatures' leeftijdsstof. Dit maakt sterfte en
generatiewissel emergenter.

---

## Gefaseerde roadmap

| Fase | Inhoud | Afhankelijk van |
|---|---|---|
| 0 | Stats, priemsmaak, leren, bewustzijn L1–L3 | **klaar** |
| 1 | **Laag 4** — theory of mind (op huidig model) | — |
| 2 | **Construct v1** — posities + simpele 2D-beweging + canvas-viewer | — |
| 3 | **Drives & biochemie v1** — stats→drives, mini chemie-engine, genoom-uitbreiding | 2 |
| 4 | **Brein v1** — geleerde beslissingen + reward/punishment | 3 |
| 5 | **Volledig Creatures-genoom** — getypeerde genen, per-type crossover, chemische klok | 3,4 |

Elke fase is los te deployen; de hive blijft draaien.

## Open keuzes (input gevraagd)
1. **Beweging/rendering** (B4): server-autoritatief + interpolatie *(aanbevolen)*, snellere tick, of client-side?
2. **Wereldaanzicht** (B6): top-down *(simpeler)* of side-on (Creatures-sfeer)?
3. **Genoom-rework** (C4): huidige 16-byte uitbreiden, of nieuw geversioneerd getypeerd genoom *(aanbevolen)* met legacy-fallback?
4. **Getrouwheid** (C2/C3): hoe ver willen we Creatures volgen — pragmatische subset of zo dicht mogelijk bij het neuro-genetische origineel?
5. **Volgorde**: eerst Laag 4 (klein, op huidig model) of eerst Construct v1 (ruimte), aangezien Laag 4 rijker wordt mét ruimte?

## Bronnen
- [Creatures Wiki — Genetics](https://creatures.wiki/Genetics)
- [Creatures Wiki — Biochemistry](https://creatures.wiki/Biochemistry)
- [Genetics Kit Manual (PDF)](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1838430/manuals/Genetics_Kit_Manual.pdf)
- [Creatures (video game series) — Grokipedia](https://grokipedia.com/page/Creatures_video_game_series)
- Grand, S., Cliff, D., Malhotra, A. (1997) — *Creatures: Artificial Life Autonomous Software Agents for Home Entertainment*
- Grand, S. — *Creation: Life and How to Make It*
