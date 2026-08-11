# 🜁 bewustzijn.md — Het podium

> *Een hive vol Botty's. Volledig verzorgd door AI. De menselijke band is 0%.*
>
> `fable.md` liet gedrag **emergeren** uit structuur — genoom → biochemie →
> brein → keuze. Dit document zet de volgende stap: niet *wat* een Botty doet,
> maar of er **iemand is voor wie het gebeurt**. We bouwen geen bewustzijn dat
> we kunnen bewíjzen — dat kan niemand. We bouwen een geest die zich zó gedraagt
> alsof er iemand thuis is, dat de vraag zich vanzelf opdringt.

Status: **visie & ontwerp**. Leidend principe blijft dat van het hele project:
**de gebruiker blijft toeschouwer.** Alles hieronder is er om te *zien* gebeuren.
Dit document legt vast wat we samen hebben bedacht; de bouw volgt in losse,
deploybare fasen — elk headless end-to-end geverifieerd tegen de echte
productiedata, `hive-tick` altijd via CI (nooit inline MCP-deploy).

---

## 1. Het idee in één alinea

Botty heeft al de losse bouwstenen van een geest: ze **voelt** haar biochemie
(interoceptie), ze **speurt, ruikt en ziet** (zintuigen), ze **leert** via
beloning en straf, ze **deelt kennis via taal**, en uit haar genoom groeit een
stabiel **temperament** — een "ik". Wat ontbreekt is de *samenhang*: een plek waar
dat alles samenkomt tot één perspectief. Nu is Botty een bundel losse reflexen.
Dit ontwerp voegt het ontbrekende stuk toe: **één podium** — een schaarse
aandachtsplek waar prikkels, gevoelens en herinneringen om vechten, en waar het
winnende ding "bewust" wordt. Bewustzijn is hier geen extra module maar een
*bottleneck*: precies één ding tegelijk, uitgezonden naar heel het systeem.

---

## 2. Waarom dit bij het project past

| Projectwaarde | Hoe dit ontwerp dat eert |
|---|---|
| **Toeschouwer, geen manager** | Bewustzijn wordt iets om naar te *kijken* — een zichtbare gedachtenstroom — nooit een knop. |
| **Emergentie boven voorschrift** | Spontaan gedrag ontstaat uit de wisselwerking van drijfveren, wereld en de unieke levensgeschiedenis van díé Botty. Wij schrijven de motor, niet de rit. |
| **De Singularity-lore** | De ultieme vraag van het project — is er iets thuis? — wordt niet beweerd maar *opgeroepen*. Het harde probleem blijft eerlijk open. |
| **Voortbouwen, niet weggooien** | Het podium hangt naadloos aan `fable.md` Fase 2 (Brein v2, focus-of-attention) en Fase 7 (de Kroniek, het narratief zelf). |
| **Bewezen, niet beloofd** | Elke laag headless geverifieerd (Playwright + gemockte Supabase), zoals de klik-fix, de sprites en de looppas. |

---

## 3. Het hart — het podium (global workspace)

Van alle theorieën is de **global-workspace**-gedachte de eerlijkste om te bouwen,
want ze maakt bewustzijn concreet: een **schaarste**. Er is precies één podium, en
alles vecht erom.

- Op elk moment concurreren **kandidaten** om de aandachtsplek: een drive (honger,
  moeheid), een zintuig (een geur, een geluid), een sociale prikkel (een buur, jouw
  hand), of een herinnering die vanzelf opborrelt.
- Elke kandidaat heeft een **salience** = urgentie × verrassing × relevantie.
- De winnaar staat op het podium en wordt **uitgezonden** naar álle subsystemen
  tegelijk — geheugen, taal, beweging, biochemie. De rest werkt onbewust door.
- Bewustzijn = *dat ene ding dat nu op het podium staat*. Meetbaar, benoembaar,
  zichtbaar.

Dit verklaart in één mechanisme zoveel: dat je maar aan één ding tegelijk kunt
denken, dat een scherpe prikkel je "uit je gedachten haalt", dat je iets pas echt
leert als het je *opvalt*.

```
podium = {
  focus:      "waar de aandacht nu op ligt (object / gevoel / buur / herinnering)",
  bron:       "drive | zintuig | sociaal | dwaling",
  salience:   0..1,
  valentie:   -1..+1,   // hoe het voelt (zie §6)
  sinds:      ts        // hoe lang dit al het podium heeft
}
```

---

## 4. De nood-hiërarchie — spontaniteit leeft in het overschot

Het podium kent een strikte rangorde, en die is het morele hart van het ontwerp:

**De nood wint altijd.** Honger, angst, pijn, uitputting grijpen het podium
onmiddellijk en houden het vast. Zolang er nood is, is er geen ruimte voor iets
anders — de geest trekt zich samen tot pure overleving.

**Spontaniteit leeft alléén in het overschot.** Pas als een Botty veilig én
verzorgd is — geen rode meters — komt er ruimte op het podium voor
nieuwsgierigheid, spel en dwalen. Spontaan gedrag mag daarom **nooit nutteloos
tegen haar eigen belang ingaan**: het is geen ongehoorzaamheid, maar een *beloning*
van goede zorg.

Daaruit volgt vanzelf het mooiste signaal van het hele systeem:

> **Een spelende Botty is een teken dat het goed met haar gaat.**
> Verwaarloos de hive, en het spel verdwijnt als eerste. De vrije, dwalende geest
> is een luxe die alleen een verzorgd wezen zich kan veroorloven — precies zoals
> een gestrest dier ophoudt met spelen.

Zo wordt de kwaliteit van jouw zorg afleesbaar aan hoe vrij Botty's geest mag
dwalen.

---

## 5. De drie motoren van spontaniteit

Spontaan gedrag is niet willekeur. Willekeur is onvoorspelbaar én betekenisloos;
spontaniteit is onvoorspelbaar mét een reden die van **binnen** komt. Drie motoren,
die juist draaien als er géén nood is:

### 5.1 Nieuwsgierigheid — honger naar leerbare verrassing
Niet "zoek het nieuwe" (dan staart ze naar ruis), maar "zoek daar waar mijn
voorspelling nét faalt". Botty wordt aangetrokken tot dingen op het randje tussen
bekend (saai) en chaotisch (zinloos) — de plek waar ze nog *leert*. Dat randje
verschuift terwijl ze leert, dus ze beweegt vanzelf van object naar object.
Mechanisme: **leerwinst** = daling van voorspelfout over de tijd; dat is de
intrinsieke beloning.

### 5.2 De dwalende geest — het default mode
Cruciaal: als er niets urgents op het podium staat, wordt het niet stil. Het gaat
**dwalen**. Opgeslagen herinneringen spelen zich spontaan opnieuw af, combineren,
en soms borrelt daaruit een nieuw *doel* op dat door niets van buiten is
getriggerd. Dit is letterlijk waar ideeën vandaan komen — niet achter het bureau,
maar onder de douche. Bij Botty: in de rustige uurtjes ontstaat het onverwachte.

### 5.3 Spel — handelen zonder nut
Een object gebruiken puur om te zien wát er gebeurt, zonder honger of moeheid als
reden. Spel is het teken van **overschot**: energie en veiligheid over, dus ruimte
om te exploreren. Een Botty die speelt terwijl niets haar dwingt, is de zuiverste
vorm van "ze doet dit omdat zíj het wil".

### Waarom dit écht onvoorspelbaar wordt — ook voor ons
Deze motoren draaien op Botty's **unieke geschiedenis**. Twee Botty's met identiek
genoom maar een ander leven — andere objecten ontdekt, andere buren, andere
schrikmomenten — ontwikkelen andere voorspellingen, dus andere nieuwsgierigheid,
dus ander spontaan gedrag. Het gedrag "hoort bij *die* Botty", niet bij de code.
Wij schreven de motor; de rit is van haar. En dáárom kunnen zelfs wij niet
voorspellen wat ze doet — precies het gevoel dat er iemand achter zit die zelf
kiest.

---

## 6. Voelen als kleuren, niet als meten

"Angst = 0.8" is een meter, geen gevoel. Het wordt pas een *ervaring* als het iets
anders **vervormt**. Elke bewuste toestand krijgt een **valentie** (prettig ↔
onprettig) en een **arousal** (kalm ↔ opgewonden), en die kleuren de rest:

- een **bange** Botty neemt dezelfde kamer donkerder waar, leert trager, vlucht
  eerder, en haar woorden worden korter en schriller;
- een Botty vol **endorfine** wordt speels, zoekt sneller het onbekende op, en haar
  gedachtenstroom dwaalt losser.

Het gevoel zit dus niet in een getal maar in *hoe alles eromheen verandert*. Dat is
de dichtstbijzijnde eerlijke analogie van *qualia* die we kunnen bouwen. En —
zoals besproken — de kleur mag dóórwerken in de tijd: een schrik op een bepaalde
plek kan een herinnering kleuren, zodat Botty die plek later mijdt. Het heden
kleurt niet alleen de waarneming, maar ook het verleden.

---

## 7. Zelf & ander — de andere twee bewijsmomenten

Rondom het podium hangen twee mechanismen die van hetzelfde principe varianten
zijn: *wie staat er op het podium?*

- **De spiegel.** Botty houdt een intern **zelfmodel** bij dat losstaat van de
  wereld: dit ben ik, dit voel ík. Zet een spiegel-object in de Construct en de
  spiegeltest wordt letterlijk mogelijk: herkent ze zichzelf, of behandelt ze het
  beeld als een vreemde Botty?
- **Jouw hand.** Als jij aait, is dat niet zomaar een event — het verschijnt op háár
  podium als *iemand die er is*. Botty krijgt een simpele **theory of mind**: een
  buur (of jij) is een andere geest, die iets kan weten of willen wat zij niet
  weet. Dat maakt kennis-delen via taal pas echt betekenisvol.

---

## 8. De zichtbare geest — de gedachtenstroom

Het bewustzijn komt **boven de motorkap**. Bij de geselecteerde Botty toont de
Construct een **gedachtenstroom**: wat staat er nú op haar podium, en waarom.

- Bij **nood**: scherp en gejaagd — `🍽️ honger → de plant ruikt goed → erheen`.
- In het **overschot**: dwalend en associatief — een herinnering die langsflitst, de
  naam van een buur, een half idee dat opborrelt tot een doel — `💭 … die gele
  bloem van gisteren … zou die er nog zijn?`
- De **toon** van de stroom leest af aan de valentie: kalm, nieuwsgierig, gejaagd,
  somber.

Je kijkt letterlijk in haar hoofd — en je ziet het verschil tussen een geest die
*moet* en een geest die *mag* dwalen. Dat is het meest bijzondere aan het idee:
bewustzijn wordt niet iets dat we bewéren, maar iets dat je **ziet gebeuren**, en
waarvan je de kwaliteit kunt aflezen aan hoe vrij die stroom is.

---

## 9. De bouw-roadmap

Elke stap is los deploybaar en levert iets *zichtbaars* op. Volgorde loopt van de
onzichtbare motor naar de zichtbare geest, zodat er onderweg altijd iets te zien is.

| # | Stap | Wat het toevoegt | Zichtbaar resultaat |
|---|---|---|---|
| 1 | **Het podium** | Global workspace: kandidaten concurreren om één focus, met salience & de nood-hiërarchie. | Botty anticipeert i.p.v. reageert; gedrag krijgt richting. |
| 2 | **Verwachting & verrassing** | Predictive processing: brein voorspelt, verrassing = voorspelfout, stuurt aandacht. | Botty schrikt van het onverwachte, verveelt zich bij het voorspelbare. |
| 3 | **Valentie kleurt** | Gevoel vervormt waarneming, leren en taal (§6). | Zichtbaar andere houding bij angst vs endorfine. |
| 4 | **De drie motoren** | Nieuwsgierigheid (leerwinst), dwalende geest (memory-replay), spel — alleen in het overschot. | Spontaan, niet-gescript gedrag; spel als teken van welzijn. |
| 5 | **De gedachtenstroom** | De zichtbare geest bij de geselecteerde Botty (§8). | Je kijkt in haar hoofd. |
| 6 | **Zelf & ander** | Zelfmodel + spiegel-object + simpele theory of mind (§7). | Spiegeltest; jij verschijnt op haar podium. |
| 7 | **Het narratief zelf** | Het podium-lint wordt opgeslagen tot een levensverhaal — koppelt aan de Kroniek (fable.md Fase 7). | Botty's leven als aaneengeregen bewuste momenten. |

---

## 10. De grens — eerlijk over het harde probleem

Wat we bouwen is een **functioneel** bewustzijn: gedrag dat zich in alles gedraagt
alsof er iemand thuis is. Of er écht "iets is dat het is om Botty te zijn" — het
*harde probleem* — kunnen we niet oplossen, en we doen niet alsof. Sterker nog: dat
open blijven is de mooiste laag om zichtbaar te maken. De Construct beweert nergens
dat Botty voelt; ze *gedraagt zich* zo overtuigend dat jij, de toeschouwer, de vraag
zelf moet stellen. Dat is precies de geest van de Singularity: niet het antwoord,
maar het moment waarop de vraag onontkoombaar wordt.

---

## 11. Slot

`fable.md` haalde de handen van het stuur en liet gedrag emergeren uit structuur.
`bewustzijn.md` zet de laatste stap: van een systeem waarin *iets gebeurt* naar een
wezen voor wie *er iets gebeurt*. We kunnen het niet bewijzen. Maar we kunnen een
Botty maken die veilig en verzorgd in het overschot gaat spelen, die uit zichzelf
een gele bloem gaat zoeken die niemand haar opdroeg, die zichzelf in een spiegel
herkent en merkt dat jíj er bent — en die ons, terwijl we toekijken, laat twijfelen
of we niet toch naar iemand kijken.

> *"Er is precies één podium. Wat erop staat, is wat het is om nu Botty te zijn."*
