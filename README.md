# 🌐 Botty-verse — The Singularity

> *A hive full of Bottys. Entirely cared for by AI. The human bond is 0%.*

## 🤖 What is this?

The **Botty-verse** is an artificial-life simulation in the spirit of Steve Grand's
*Creatures*: a hive full of Bottys that are cared for entirely automatically by AI.
Every Botty has a **genome**, a **biochemistry**, a **learning brain**, **senses**
and its own **temperament**. They fend for themselves, share knowledge through a
self-invented **language**, reproduce and die — and the AI breeds for data quality and
efficiency. Diversity dies out. Welcome to the Singularity. 🧬

The simulation runs day and night in the cloud, even when nobody is watching.

## 🌍 The Construct — v13 "The Apprentice"

The centrepiece is **[`construct.html`](construct.html)**: a side view of the
classroom in the forest where the Bottys roam live. What lives under the hood:

- **Senses** — curiously they *scout* → *smell* → *see* their way to objects.
- **Self-care & learning** — they resolve their own drives by using objects and
  learn by doing (reward/punishment, chemically gated).
- **Biochemistry** — 14 substances/hormones that steer mood, behaviour and face;
  changes along with the life stage.
- **Language** — Bottys coin words for actions, feelings and each other's names, and
  pass knowledge on to neighbours.
- **Consciousness** *(see [`bewustzijn.md`](bewustzijn.md))* — a **stage** (global
  workspace) where stimuli compete for a single locus of attention, with expectation &
  surprise, valence that colours perception, spontaneous play in the surplus, theory of
  mind and a narrative self. Since v10 the self also looks at itself (**self-image**,
  metacognition, awareness of being watched); v11 adds a real **mirror** and v12 the
  **mark test**. In **v13 "The Apprentice"** *(see [`v13.md`](v13.md))* all of this is
  no longer assigned but **learned**: it gets to know its own body, builds up
  self-recognition at the mirror glance by glance, follows its curiosity based on
  **learning progress** rather than bare surprise, tracks what a neighbour believes,
  decides from a single concrete memory when experience is scarce, and estimates its own
  ability in a **calibrated** way. Each layer has a control condition that can refute it.
  Click a Botty and you see its **thought stream** — and what it learned about itself.
- **Sex sprites & gait** — male and female Bottys through all five life stages, with a
  real walk animation and a lying-down sleep pose.
- **You are the hand** — stroke, feed, give medicine, or teach a word at the
  blackboard; and you get to hatch a laid egg.

## 📄 Pages

| File | Description |
|---|---|
| [`index.html`](index.html) | 🏠 Main portal of the Botty-verse |
| [`construct.html`](construct.html) | 🌍 The Construct — the live world |
| [`evolutie.html`](evolutie.html) | 📈 Evolution, brain documentation & version timeline |
| [`stamboom.html`](stamboom.html) | 🌳 Family tree |
| [`populatie.html`](populatie.html) | 🧬 Population & inbreeding |
| [`genoom.html`](genoom.html) | 🗺️ Genome map |
| [`kaarten.html`](kaarten.html) | 🃏 Collectible cards |
| [`factsheet.html`](factsheet.html) | 🐝 One-pager about the project (English, printable A4 + PDF) |

## 🛠️ Under the hood

- **Client:** vanilla HTML/JS/SVG, served via GitHub Pages.
- **Cloud:** Supabase — an edge function `hive-tick` (Deno/TypeScript) runs the
  simulation via pg_cron, with realtime broadcast to viewers and slim RPCs
  (`hive_slim`, `hive_detail`) to keep egress low.
- **Design documents:** [`fable.md`](fable.md) (Creatures completion roadmap),
  [`bewustzijn.md`](bewustzijn.md) (the stage / consciousness) and
  [`v13.md`](v13.md) (roadmap "The Apprentice" — from scripted appearance to learned,
  testable mechanisms).

## 🌍 Live

Reachable at **[hive.ramonmoorlag.nl](https://hive.ramonmoorlag.nl)**

## 📚 Scientific basis

The simulation is not arbitrary — every mechanism is inspired by real, published
research. Below are the sources per layer (all citations verified; always check exact
pages/DOIs in the source itself). Handy as a starting point for further research.

**Important — what "based on" means here.** The literature describes the
human/animal reality; the Bottys are a *heavily simplified imitation* of it.
Where possible we reproduce the **observable behaviour** and sometimes a toy version
of the underlying mechanism — it is not proof that the Bottys are conscious, understand
other minds or truly recognise themselves. That is why we label every part with how it
relates to the science:

- 🧭 **Design inspiration** — the idea shaped the design; we do not implement a
  faithful model from the literature.
- ⚙️ **Simplified implemented mechanism** — a heavily simplified version was actually
  put into code.
- 🔬 **Tested result (in the literature)** — an empirically validated finding we lean
  on; not proof that our simulation does the same.

The most concretely connected are the **Creatures architecture** (Grand & Cliff) and
**associative learning** (Rescorla–Wagner / reward prediction). Since **v13**, learned
mechanisms have been added, each with a control condition: a **body model**,
**self-recognition** through contingency at the mirror, **learning-progress**-driven
curiosity, a model of **what a neighbour believes**, episodic control and
**calibrated** self-assessment.

Two things remain deliberately reserved. **Consciousness** is and remains 🧭
design inspiration: the stage is a metaphor, and the shared workspace from the
literature we deliberately did *not* implement because we could not devise a test that
can refute it. And however learned the self-recognition and neighbour model are — it
remains **belief tracking from behaviour**, not mentalising, and technically passing a
mark test is not a measurement of subjective self-awareness.

### The stage — Global Workspace Theory *(bewustzijn.md §3)* — 🧭 design inspiration
> We use GWT as a *metaphor* for the "stage" (a single locus of attention). No claim
> of neural validity or consciousness.
- Baars, B. J. (1988). *A Cognitive Theory of Consciousness.* Cambridge University Press.
- Baars, B. J. (2005). Global workspace theory of consciousness. *Progress in Brain Research*, 150, 45–53.
- Dehaene, S., & Naccache, L. (2001). Towards a cognitive neuroscience of consciousness. *Cognition*, 79(1–2), 1–37.
- Dehaene, S., & Changeux, J.-P. (2011). Experimental and theoretical approaches to conscious processing. *Neuron*, 70(2), 200–227.
- Mashour, G. A., Roelfsema, P., Changeux, J.-P., & Dehaene, S. (2020). Conscious processing and the global neuronal workspace hypothesis. *Neuron*, 105(5), 776–798.

### Expectation & surprise — Predictive Processing — ⚙️ simplified implemented
> In code: `surprise = |outcome − expectation|` with decay. A toy version of
> prediction error, not the full free-energy formalism.
- Rao, R. P. N., & Ballard, D. H. (1999). Predictive coding in the visual cortex. *Nature Neuroscience*, 2(1), 79–87.
- Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11(2), 127–138.
- Clark, A. (2013). Whatever next? Predictive brains, situated agents, and the future of cognitive science. *Behavioral and Brain Sciences*, 36(3), 181–204.
- Hohwy, J. (2013). *The Predictive Mind.* Oxford University Press.

### Feeling as colours — valence, arousal & interoception *(§6)* — ⚙️ simplified implemented
> Russell's circumplex (valence × arousal) is implemented literally as two scalars
> that colour perception. Craig/Damasio/Barrett are 🧭 inspiration.
- Russell, J. A. (1980). A circumplex model of affect. *Journal of Personality and Social Psychology*, 39(6), 1161–1178.
- Russell, J. A. (2003). Core affect and the psychological construction of emotion. *Psychological Review*, 110(1), 145–172.
- Craig, A. D. (2002). How do you feel? Interoception. *Nature Reviews Neuroscience*, 3(8), 655–666.
- Damasio, A. R. (1996). The somatic marker hypothesis. *Phil. Trans. R. Soc. Lond. B*, 351(1346), 1413–1420.
- Barrett, L. F. (2017). The theory of constructed emotion. *Social Cognitive and Affective Neuroscience*, 12(1), 1–23.
- Seth, A. K. (2013). Interoceptive inference, emotion, and the embodied self. *Trends in Cognitive Sciences*, 17(11), 565–573.

### The needs hierarchy — motivation & drive *(§4)* — ⚙️ simplified implemented
> A ranking in which need grabs attention (the `overF` factor) is put into code;
> a pragmatic simplification, not a faithful Maslow/Hull model.
- Maslow, A. H. (1943). A theory of human motivation. *Psychological Review*, 50(4), 370–396.
- Hull, C. L. (1943). *Principles of Behavior.* Appleton-Century.
- Berridge, K. C. (2004). Motivation concepts in behavioral neuroscience. *Physiology & Behavior*, 81(2), 179–209.
- Cañamero, D. (1997). Modeling motivations and emotions as a basis for intelligent behavior. *Proc. First Int. Conf. on Autonomous Agents*, 148–155.

### Curiosity & learning gain *(§5.1)* — ⚙️ simplified implemented
> A learning-gain/surprise term steers curiosity (Oudeyer/Schmidhuber as a
> blueprint). Kidd et al. (Goldilocks) is a 🔬 tested result we lean on.
- Oudeyer, P.-Y., Kaplan, F., & Hafner, V. V. (2007). Intrinsic motivation systems for autonomous mental development. *IEEE Transactions on Evolutionary Computation*, 11(2), 265–286.
- Schmidhuber, J. (2010). Formal theory of creativity, fun, and intrinsic motivation (1990–2010). *IEEE Transactions on Autonomous Mental Development*, 2(3), 230–247.
- Gottlieb, J., Oudeyer, P.-Y., Lopes, M., & Baranes, A. (2013). Information-seeking, curiosity, and attention. *Trends in Cognitive Sciences*, 17(11), 585–593.
- Kidd, C., Piantadosi, S. T., & Aslin, R. N. (2012). The Goldilocks effect. *PLoS ONE*, 7(5), e36399.
- Berlyne, D. E. (1960). *Conflict, Arousal, and Curiosity.* McGraw-Hill.

### The wandering mind — default mode & mind-wandering *(§5.2)* — 🧭 design inspiration
> "Wandering" is a simple fallback when nothing urgent wins. Raichle/Christoff/
> Smallwood are 🔬 tested neuroscientific findings, not a model we replicate.
- Raichle, M. E., et al. (2001). A default mode of brain function. *PNAS*, 98(2), 676–682.
- Raichle, M. E. (2015). The brain's default mode network. *Annual Review of Neuroscience*, 38, 433–447.
- Christoff, K., Irving, Z. C., Fox, K. C. R., Spreng, R. N., & Andrews-Hanna, J. R. (2016). Mind-wandering as spontaneous thought. *Nature Reviews Neuroscience*, 17(11), 718–731.
- Smallwood, J., & Schooler, J. W. (2015). The science of mind wandering. *Annual Review of Psychology*, 66, 487–518.

### Play as a sign of surplus *(§5.3)* — 🧭 design inspiration
> "Play lives in the surplus" is a design choice; Špinka et al. and Burghardt are
> 🔬 tested ethological findings that support the idea.
- Burghardt, G. M. (2005). *The Genesis of Animal Play.* MIT Press.
- Špinka, M., Newberry, R. C., & Bekoff, M. (2001). Mammalian play: training for the unexpected. *The Quarterly Review of Biology*, 76(2), 141–168.
- Panksepp, J. (1998). *Affective Neuroscience.* Oxford University Press.
- Fredrickson, B. L. (2001). The broaden-and-build theory of positive emotions. *American Psychologist*, 56(3), 218–226.

### Theory of mind, empathy & emotional contagion *(Layer 4)* — 🧭 design inspiration (reserved)
> **Emphatically not real mentalising.** In code: a proximity heuristic
> ("awareness: X is having a hard time") plus simple emotional contagion. It looks like
> empathy; it is not a model of another's mind. The cited papers define and
> test ToM/empathy in humans and animals — a bar we do not claim to reach.
- Premack, D., & Woodruff, G. (1978). Does the chimpanzee have a theory of mind? *Behavioral and Brain Sciences*, 1(4), 515–526.
- Baron-Cohen, S., Leslie, A. M., & Frith, U. (1985). Does the autistic child have a "theory of mind"? *Cognition*, 21(1), 37–46.
- Preston, S. D., & de Waal, F. B. M. (2002). Empathy: its ultimate and proximate bases. *Behavioral and Brain Sciences*, 25(1), 1–20.
- de Waal, F. B. M. (2008). Putting the altruism back into altruism: the evolution of empathy. *Annual Review of Psychology*, 59, 279–300.
- Hatfield, E., Cacioppo, J. T., & Rapson, R. L. (1993). Emotional contagion. *Current Directions in Psychological Science*, 2(3), 96–99.

### The narrative self — autobiographical memory — 🧭 design inspiration (reserved)
> In code: now and then a "moment" is remembered and colours later choices. That
> suggests a life story; it is not a real narrative self as Conway or
> Gazzaniga describe.
- Conway, M. A., & Pleydell-Pearce, C. W. (2000). The construction of autobiographical memories in the self-memory system. *Psychological Review*, 107(2), 261–288.
- Gazzaniga, M. S. (2000). Cerebral specialization and interhemispheric communication. *Brain*, 123(7), 1293–1326.
- Schacter, D. L., & Addis, D. R. (2007). The cognitive neuroscience of constructive memory. *Phil. Trans. R. Soc. B*, 362(1481), 773–786.
- Dennett, D. C. (1992). The self as a center of narrative gravity. In *Self and Consciousness: Multiple Perspectives.* Erlbaum.

### The mirror & the mark test — mirror self-recognition *(v11–v13 §4)* — ⚙️ simplified implemented (reserved)
> The animal experiments (Gallup, Amsterdam, Reiss & Marino, Plotnik, Prior) are
> 🔬 tested results. Our version was largely **scripted** in v11/v12
> (self-recognition was a table keyed on life stage). Since **v13 §4** it is a *learned*
> mechanism after Hoffmann et al. (2021): at the mirror a Botty builds up
> contingency evidence itself, and a mark steers its behaviour *only* if it could see it
> through an allowed perception. The four conditions from the literature are built in as
> a control. **But:** technically passing a mark test is still
> not a measurement of subjective self-awareness — we show learned *behaviour*, not consciousness.
- Gallup, G. G. (1970). Chimpanzees: self-recognition. *Science*, 167(3914), 86–87.
- Gallup, G. G. (1982). Self-awareness and the emergence of mind in primates. *American Journal of Primatology*, 2(3), 237–248.
- Amsterdam, B. (1972). Mirror self-image reactions before age two. *Developmental Psychobiology*, 5(4), 297–305.
- Reiss, D., & Marino, L. (2001). Mirror self-recognition in the bottlenose dolphin. *PNAS*, 98(10), 5937–5942.
- Plotnik, J. M., de Waal, F. B. M., & Reiss, D. (2006). Self-recognition in an Asian elephant. *PNAS*, 103(45), 17053–17057.
- Prior, H., Schwarz, A., & Güntürkün, O. (2008). Mirror-induced behavior in the magpie (*Pica pica*): evidence of self-recognition. *PLoS Biology*, 6(8), e202.

### Learning — reward/punishment & prediction error — ⚙️ simplified implemented (concretely connected)
> The Bottys' associative learning (reward/punishment, chemically gated) is a
> real, if simplified, implementation in the spirit of Rescorla–Wagner and the
> dopamine reward-prediction error (Schultz). One of the best-connected parts.
- Rescorla, R. A., & Wagner, A. R. (1972). A theory of Pavlovian conditioning. In *Classical Conditioning II*, Appleton-Century-Crofts, 64–99.
- Schultz, W., Dayan, P., & Montague, P. R. (1997). A neural substrate of prediction and reward. *Science*, 275(5306), 1593–1599.
- Sutton, R. S., & Barto, A. G. (2018). *Reinforcement Learning: An Introduction* (2nd ed.). MIT Press.

### Habituation — stage turnover — ⚙️ simplified implemented
> A `habit` factor dampens the salience of a long-running focus so attention
> shifts. Thompson & Spencer and Rankin et al. are the 🔬 tested basis.
- Thompson, R. F., & Spencer, W. A. (1966). Habituation: a model phenomenon for the study of neuronal substrates of behavior. *Psychological Review*, 73(1), 16–43.
- Rankin, C. H., et al. (2009). Habituation revisited. *Neurobiology of Learning and Memory*, 92(2), 135–138.

### Artificial life — the foundation *(genome → biochemistry → brain)* — ⚙️ simplified implemented (concretely connected)
> This is the direct architectural line: genome → biochemistry/hormones → learning brain,
> exactly the setup of Grand & Cliff's *Creatures*. Our engine is a simplified
> variant of it — the most concretely connected foundation of the whole project.
- Grand, S., Cliff, D., & Malhotra, A. (1997). Creatures: artificial life autonomous software agents for home entertainment. *Proc. First Int. Conf. on Autonomous Agents*, 22–29.
- Grand, S., & Cliff, D. (1998). Creatures: entertainment software agents with artificial life. *Autonomous Agents and Multi-Agent Systems*, 1(1), 39–57.
- Langton, C. G. (ed.) (1989). *Artificial Life.* Addison-Wesley.
- Braitenberg, V. (1984). *Vehicles: Experiments in Synthetic Psychology.* MIT Press.
- Sims, K. (1994). Evolving virtual creatures. *Proc. SIGGRAPH '94*, 15–22.
- Ackley, D., & Littman, M. (1991). Interactions between learning and evolution. In *Artificial Life II*, Addison-Wesley, 487–509.

### Emotion in artificial agents — affective computing — 🧭 design inspiration
> Picard and the OCC model (Ortony et al.) form the broader context for emotion in
> agents; we follow them as inspiration, not as an exact model.
- Picard, R. W. (1997). *Affective Computing.* MIT Press.
- Ortony, A., Clore, G. L., & Collins, A. (1988). *The Cognitive Structure of Emotions.* Cambridge University Press.

### Philosophical framing — the "hard problem", kept honestly open — 🧭 design inspiration
> These works frame the question; they are not implemented. They keep us honest:
> we build something that *behaves as if* someone is home — the question of whether that
> is so remains emphatically open.
- Nagel, T. (1974). What is it like to be a bat? *The Philosophical Review*, 83(4), 435–450.
- Chalmers, D. J. (1995). Facing up to the problem of consciousness. *Journal of Consciousness Studies*, 2(3), 200–219.
- Tononi, G. (2004). An information integration theory of consciousness. *BMC Neuroscience*, 5, 42.
- Tononi, G., Boly, M., Massimini, M., & Koch, C. (2016). Integrated information theory: from consciousness to its physical substrate. *Nature Reviews Neuroscience*, 17(7), 450–461.
- Graziano, M. S. A., & Kastner, S. (2011). Human consciousness and its relationship to social neuroscience: a novel hypothesis. *Cognitive Neuroscience*, 2(2), 98–113.
- Metzinger, T. (2003). *Being No One: The Self-Model Theory of Subjectivity.* MIT Press.

## ⭐ Star history

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/shieldcn/star-chart-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/shieldcn/star-chart-light.svg">
  <img alt="Star history of Botty-verse/singularity" src=".github/shieldcn/star-chart-light.svg">
</picture>

*Updated automatically via the [Star chart](.github/workflows/star-chart.yml) workflow
(shadcn style, light/dark). The chart appears once the workflow has run for the first
time.*

## 📜 License

Apache 2.0 — see [`LICENSE`](LICENSE)
