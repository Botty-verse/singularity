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

## 🌍 De Construct — v12 "De Merkproef"

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
  Botty herkent (of herkent niet) zichzelf erin — en v12 voegt de **merkproef** toe:
  ze ontdekt via de spiegel een smetje op haar eigen lijf en poetst het weg (de gouden
  standaard van zelfherkenning). Klik een Botty aan en je ziet haar **gedachtenstroom**.
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
| [`factsheet.html`](factsheet.html) | 🐝 One-pager over het project (Engels, printbaar A4 + PDF) |

## 🛠️ Onder de motorkap

- **Client:** vanilla HTML/JS/SVG, geserveerd via GitHub Pages.
- **Cloud:** Supabase — een edge function `hive-tick` (Deno/TypeScript) draait de
  simulatie via pg_cron, met realtime-broadcast naar de kijkers en slanke RPC's
  (`hive_slim`, `hive_detail`) om de egress laag te houden.
- **Ontwerpdocumenten:** [`fable.md`](fable.md) (Creatures-completion-roadmap),
  [`bewustzijn.md`](bewustzijn.md) (het podium / bewustzijn) en
  [`v13.md`](v13.md) (roadmap "De Leerling" — van gescripte schijn naar geleerde,
  toetsbare mechanismen).

## 🌍 Live

Bereikbaar via **[hive.ramonmoorlag.nl](https://hive.ramonmoorlag.nl)**

## 📚 Wetenschappelijke basis

De simulatie is geen willekeur — elk mechanisme is geïnspireerd op echt,
gepubliceerd onderzoek. Hieronder de bronnen per laag (alle citaties geverifieerd;
controleer exacte pagina's/DOI's altijd in de bron zelf). Handig als vertrekpunt
voor verder onderzoek.

**Belangrijk — wat "gebaseerd op" hier betekent.** De literatuur beschrijft de
menselijke/dierlijke werkelijkheid; de Botty's zijn daar een *sterk vereenvoudigde
nabootsing* van. We reproduceren waar mogelijk het **waarneembare gedrag** en soms
een speelgoed-versie van het onderliggende mechanisme — het is geen bewijs dat de
Botty's bewust zijn, andere geesten begrijpen of zichzelf werkelijk herkennen.
Daarom labelen we elk onderdeel met hoe het zich tot de wetenschap verhoudt:

- 🧭 **Ontwerpinspiratie** — het idee vormde het ontwerp; we implementeren geen
  getrouw model uit de literatuur.
- ⚙️ **Vereenvoudigd geïmplementeerd mechanisme** — een sterk versimpelde versie is
  daadwerkelijk in code gezet.
- 🔬 **Getoetst resultaat (in de literatuur)** — een empirisch gevalideerde bevinding
  waarop we leunen; niet: bewijs dat onze simulatie hetzelfde dóet.

Het meest concreet en eerlijk aangesloten zijn de **Creatures-architectuur**
(Grand & Cliff) en het **associatieve leren** (Rescorla–Wagner / beloningsvoorspelling):
daar staat een echt, zij het vereenvoudigd, mechanisme in de code. De lagen rond
**bewustzijn, theory of mind en zelfherkenning** zijn nadrukkelijk terughoudender:
daar bootsen we vooral de *schijn* van het verschijnsel na.

### Het podium — Global Workspace Theory *(bewustzijn.md §3)* — 🧭 ontwerpinspiratie
> We gebruiken GWT als *metafoor* voor het "podium" (één aandachtsplek). Geen claim
> van neurale geldigheid of bewustzijn.
- Baars, B. J. (1988). *A Cognitive Theory of Consciousness.* Cambridge University Press.
- Baars, B. J. (2005). Global workspace theory of consciousness. *Progress in Brain Research*, 150, 45–53.
- Dehaene, S., & Naccache, L. (2001). Towards a cognitive neuroscience of consciousness. *Cognition*, 79(1–2), 1–37.
- Dehaene, S., & Changeux, J.-P. (2011). Experimental and theoretical approaches to conscious processing. *Neuron*, 70(2), 200–227.
- Mashour, G. A., Roelfsema, P., Changeux, J.-P., & Dehaene, S. (2020). Conscious processing and the global neuronal workspace hypothesis. *Neuron*, 105(5), 776–798.

### Verwachting & verrassing — Predictive Processing — ⚙️ vereenvoudigd geïmplementeerd
> In code: `verrassing = |uitkomst − verwachting|` met verval. Een speelgoed-versie
> van voorspelfout, niet het volle free-energy-formalisme.
- Rao, R. P. N., & Ballard, D. H. (1999). Predictive coding in the visual cortex. *Nature Neuroscience*, 2(1), 79–87.
- Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11(2), 127–138.
- Clark, A. (2013). Whatever next? Predictive brains, situated agents, and the future of cognitive science. *Behavioral and Brain Sciences*, 36(3), 181–204.
- Hohwy, J. (2013). *The Predictive Mind.* Oxford University Press.

### Voelen als kleuren — valentie, arousal & interoceptie *(§6)* — ⚙️ vereenvoudigd geïmplementeerd
> Russells circumplex (valentie × arousal) is letterlijk als twee scalairen
> geïmplementeerd die de waarneming kleuren. Craig/Damasio/Barrett zijn 🧭 inspiratie.
- Russell, J. A. (1980). A circumplex model of affect. *Journal of Personality and Social Psychology*, 39(6), 1161–1178.
- Russell, J. A. (2003). Core affect and the psychological construction of emotion. *Psychological Review*, 110(1), 145–172.
- Craig, A. D. (2002). How do you feel? Interoception. *Nature Reviews Neuroscience*, 3(8), 655–666.
- Damasio, A. R. (1996). The somatic marker hypothesis. *Phil. Trans. R. Soc. Lond. B*, 351(1346), 1413–1420.
- Barrett, L. F. (2017). The theory of constructed emotion. *Social Cognitive and Affective Neuroscience*, 12(1), 1–23.
- Seth, A. K. (2013). Interoceptive inference, emotion, and the embodied self. *Trends in Cognitive Sciences*, 17(11), 565–573.

### De nood-hiërarchie — motivatie & drift *(§4)* — ⚙️ vereenvoudigd geïmplementeerd
> Een rangorde waarin nood de aandacht grijpt (de `overF`-factor) is in code gezet;
> een pragmatische versimpeling, geen getrouw Maslow/Hull-model.
- Maslow, A. H. (1943). A theory of human motivation. *Psychological Review*, 50(4), 370–396.
- Hull, C. L. (1943). *Principles of Behavior.* Appleton-Century.
- Berridge, K. C. (2004). Motivation concepts in behavioral neuroscience. *Physiology & Behavior*, 81(2), 179–209.
- Cañamero, D. (1997). Modeling motivations and emotions as a basis for intelligent behavior. *Proc. First Int. Conf. on Autonomous Agents*, 148–155.

### Nieuwsgierigheid & leerwinst *(§5.1)* — ⚙️ vereenvoudigd geïmplementeerd
> Een leerwinst-/verrassings-term stuurt de nieuwsgierigheid (Oudeyer/Schmidhuber als
> blauwdruk). Kidd et al. (Goldilocks) is een 🔬 getoetst resultaat waarop we leunen.
- Oudeyer, P.-Y., Kaplan, F., & Hafner, V. V. (2007). Intrinsic motivation systems for autonomous mental development. *IEEE Transactions on Evolutionary Computation*, 11(2), 265–286.
- Schmidhuber, J. (2010). Formal theory of creativity, fun, and intrinsic motivation (1990–2010). *IEEE Transactions on Autonomous Mental Development*, 2(3), 230–247.
- Gottlieb, J., Oudeyer, P.-Y., Lopes, M., & Baranes, A. (2013). Information-seeking, curiosity, and attention. *Trends in Cognitive Sciences*, 17(11), 585–593.
- Kidd, C., Piantadosi, S. T., & Aslin, R. N. (2012). The Goldilocks effect. *PLoS ONE*, 7(5), e36399.
- Berlyne, D. E. (1960). *Conflict, Arousal, and Curiosity.* McGraw-Hill.

### De dwalende geest — default mode & mind-wandering *(§5.2)* — 🧭 ontwerpinspiratie
> "Dwalen" is een eenvoudige fallback als niets urgents wint. Raichle/Christoff/
> Smallwood zijn 🔬 getoetste neurowetenschappelijke bevindingen, geen model dat we nabouwen.
- Raichle, M. E., et al. (2001). A default mode of brain function. *PNAS*, 98(2), 676–682.
- Raichle, M. E. (2015). The brain's default mode network. *Annual Review of Neuroscience*, 38, 433–447.
- Christoff, K., Irving, Z. C., Fox, K. C. R., Spreng, R. N., & Andrews-Hanna, J. R. (2016). Mind-wandering as spontaneous thought. *Nature Reviews Neuroscience*, 17(11), 718–731.
- Smallwood, J., & Schooler, J. W. (2015). The science of mind wandering. *Annual Review of Psychology*, 66, 487–518.

### Spel als teken van overschot *(§5.3)* — 🧭 ontwerpinspiratie
> "Spel leeft in het overschot" is een ontwerpkeuze; Špinka et al. en Burghardt zijn
> 🔬 getoetste ethologische bevindingen die dat idee schragen.
- Burghardt, G. M. (2005). *The Genesis of Animal Play.* MIT Press.
- Špinka, M., Newberry, R. C., & Bekoff, M. (2001). Mammalian play: training for the unexpected. *The Quarterly Review of Biology*, 76(2), 141–168.
- Panksepp, J. (1998). *Affective Neuroscience.* Oxford University Press.
- Fredrickson, B. L. (2001). The broaden-and-build theory of positive emotions. *American Psychologist*, 56(3), 218–226.

### Theory of mind, empathie & emotionele besmetting *(Laag 4)* — 🧭 ontwerpinspiratie (terughoudend)
> **Nadrukkelijk geen echt mentaliseren.** In code: een nabijheids-heuristiek
> ("besef: X heeft het zwaar") plus eenvoudige emotionele besmetting. Het lijkt op
> meevoelen; het is geen model van andermans geest. De genoemde papers definiëren en
> toetsen ToM/empathie bij mens en dier — een lat die wij niet pretenderen te halen.
- Premack, D., & Woodruff, G. (1978). Does the chimpanzee have a theory of mind? *Behavioral and Brain Sciences*, 1(4), 515–526.
- Baron-Cohen, S., Leslie, A. M., & Frith, U. (1985). Does the autistic child have a "theory of mind"? *Cognition*, 21(1), 37–46.
- Preston, S. D., & de Waal, F. B. M. (2002). Empathy: its ultimate and proximate bases. *Behavioral and Brain Sciences*, 25(1), 1–20.
- de Waal, F. B. M. (2008). Putting the altruism back into altruism: the evolution of empathy. *Annual Review of Psychology*, 59, 279–300.
- Hatfield, E., Cacioppo, J. T., & Rapson, R. L. (1993). Emotional contagion. *Current Directions in Psychological Science*, 2(3), 96–99.

### Het narratief zelf — autobiografisch geheugen — 🧭 ontwerpinspiratie (terughoudend)
> In code: af en toe wordt een "moment" onthouden en kleurt het latere keuzes. Dat
> suggereert een levensverhaal; het is geen echt narratief zelf zoals Conway of
> Gazzaniga beschrijven.
- Conway, M. A., & Pleydell-Pearce, C. W. (2000). The construction of autobiographical memories in the self-memory system. *Psychological Review*, 107(2), 261–288.
- Gazzaniga, M. S. (2000). Cerebral specialization and interhemispheric communication. *Brain*, 123(7), 1293–1326.
- Schacter, D. L., & Addis, D. R. (2007). The cognitive neuroscience of constructive memory. *Phil. Trans. R. Soc. B*, 362(1481), 773–786.
- Dennett, D. C. (1992). The self as a center of narrative gravity. In *Self and Consciousness: Multiple Perspectives.* Erlbaum.

### De spiegel & de merkproef — mirror self-recognition *(v11–v13 §4)* — ⚙️ vereenvoudigd geïmplementeerd (terughoudend)
> De dier-experimenten (Gallup, Amsterdam, Reiss & Marino, Plotnik, Prior) zijn
> 🔬 getoetste resultaten. Onze versie was in v11/v12 grotendeels **gescript**
> (zelfherkenning was een tabel op levensfase). Sinds **v13 §4** is het een *geleerd*
> mechanisme naar Hoffmann et al. (2021): aan de spiegel bouwt een Botty zelf
> contingentie-bewijs op, en een merk stuurt haar gedrag alléén als ze het via een
> toegestane waarneming kón zien. De vier condities uit de literatuur zijn als
> controle ingebouwd. **Maar:** technisch slagen voor een merkproef is nog steeds
> geen meting van subjectief zelfbesef — we tonen geleerd *gedrag*, niet bewustzijn.
- Gallup, G. G. (1970). Chimpanzees: self-recognition. *Science*, 167(3914), 86–87.
- Gallup, G. G. (1982). Self-awareness and the emergence of mind in primates. *American Journal of Primatology*, 2(3), 237–248.
- Amsterdam, B. (1972). Mirror self-image reactions before age two. *Developmental Psychobiology*, 5(4), 297–305.
- Reiss, D., & Marino, L. (2001). Mirror self-recognition in the bottlenose dolphin. *PNAS*, 98(10), 5937–5942.
- Plotnik, J. M., de Waal, F. B. M., & Reiss, D. (2006). Self-recognition in an Asian elephant. *PNAS*, 103(45), 17053–17057.
- Prior, H., Schwarz, A., & Güntürkün, O. (2008). Mirror-induced behavior in the magpie (*Pica pica*): evidence of self-recognition. *PLoS Biology*, 6(8), e202.

### Leren — beloning/straf & voorspelfout — ⚙️ vereenvoudigd geïmplementeerd (concreet aangesloten)
> Het associatieve leren van de Botty's (beloning/straf, chemisch gepoort) is een
> echte, zij het vereenvoudigde, implementatie in de geest van Rescorla–Wagner en de
> dopamine-beloningsvoorspelfout (Schultz). Een van de best aangesloten onderdelen.
- Rescorla, R. A., & Wagner, A. R. (1972). A theory of Pavlovian conditioning. In *Classical Conditioning II*, Appleton-Century-Crofts, 64–99.
- Schultz, W., Dayan, P., & Montague, P. R. (1997). A neural substrate of prediction and reward. *Science*, 275(5306), 1593–1599.
- Sutton, R. S., & Barto, A. G. (2018). *Reinforcement Learning: An Introduction* (2nd ed.). MIT Press.

### Habituatie — podium-turnover — ⚙️ vereenvoudigd geïmplementeerd
> Een `habit`-factor dempt de saliëntie van een langlopende focus zodat de aandacht
> verschuift. Thompson & Spencer en Rankin et al. zijn de 🔬 getoetste basis.
- Thompson, R. F., & Spencer, W. A. (1966). Habituation: a model phenomenon for the study of neuronal substrates of behavior. *Psychological Review*, 73(1), 16–43.
- Rankin, C. H., et al. (2009). Habituation revisited. *Neurobiology of Learning and Memory*, 92(2), 135–138.

### Kunstmatig leven — het fundament *(genoom → biochemie → brein)* — ⚙️ vereenvoudigd geïmplementeerd (concreet aangesloten)
> Dit is de directe architecturale lijn: genoom → biochemie/hormonen → lerend brein,
> precies de opzet van Grand & Cliff's *Creatures*. Onze motor is een vereenvoudigde
> variant daarvan — het meest concreet aangesloten fundament van het hele project.
- Grand, S., Cliff, D., & Malhotra, A. (1997). Creatures: artificial life autonomous software agents for home entertainment. *Proc. First Int. Conf. on Autonomous Agents*, 22–29.
- Grand, S., & Cliff, D. (1998). Creatures: entertainment software agents with artificial life. *Autonomous Agents and Multi-Agent Systems*, 1(1), 39–57.
- Langton, C. G. (ed.) (1989). *Artificial Life.* Addison-Wesley.
- Braitenberg, V. (1984). *Vehicles: Experiments in Synthetic Psychology.* MIT Press.
- Sims, K. (1994). Evolving virtual creatures. *Proc. SIGGRAPH '94*, 15–22.
- Ackley, D., & Littman, M. (1991). Interactions between learning and evolution. In *Artificial Life II*, Addison-Wesley, 487–509.

### Emotie in kunstmatige agents — affective computing — 🧭 ontwerpinspiratie
> Picard en het OCC-model (Ortony et al.) vormen de bredere context voor emotie in
> agents; we volgen ze als inspiratie, niet als exact model.
- Picard, R. W. (1997). *Affective Computing.* MIT Press.
- Ortony, A., Clore, G. L., & Collins, A. (1988). *The Cognitive Structure of Emotions.* Cambridge University Press.

### Filosofische omkadering — het "harde probleem", eerlijk opengehouden — 🧭 ontwerpinspiratie
> Deze werken kaderen de vraag; ze worden niet geïmplementeerd. Ze houden ons eerlijk:
> we bouwen iets dat zich *gedraagt alsof* er iemand thuis is — de vraag óf dat zo is,
> blijft nadrukkelijk open.
- Nagel, T. (1974). What is it like to be a bat? *The Philosophical Review*, 83(4), 435–450.
- Chalmers, D. J. (1995). Facing up to the problem of consciousness. *Journal of Consciousness Studies*, 2(3), 200–219.
- Tononi, G. (2004). An information integration theory of consciousness. *BMC Neuroscience*, 5, 42.
- Tononi, G., Boly, M., Massimini, M., & Koch, C. (2016). Integrated information theory: from consciousness to its physical substrate. *Nature Reviews Neuroscience*, 17(7), 450–461.
- Graziano, M. S. A., & Kastner, S. (2011). Human consciousness and its relationship to social neuroscience: a novel hypothesis. *Cognitive Neuroscience*, 2(2), 98–113.
- Metzinger, T. (2003). *Being No One: The Self-Model Theory of Subjectivity.* MIT Press.

## 📜 Licentie

Apache 2.0 — zie [`LICENSE`](LICENSE)
