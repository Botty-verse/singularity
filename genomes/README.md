# 🧬 Genome ledger — the hive's fossil record

A permanent, version-controlled archive of the Botty-verse genome. One line per
**completed life** (a deceased Botty), so `git diff` on these files literally
shows the mutations between generations. Unlike the database (which prunes
history after 180 days), this archive is forever — and public.

It is written by the [`genome-ledger`](../.github/workflows/genome-ledger.yml)
GitHub Action, which reads the public anon REST every 15 minutes and appends
new lives. It is **read-only against the simulation** and never touches
`hive-tick`.

## Layout

- `YYYY-MM.jsonl` — one shard per month (by date of death), JSON Lines.
- `.ledger-state.json` — watermark (last processed `levens.id`).

## Record

```jsonc
{
  "bid": "d2051ff5",            // stable Botty id
  "naam": "Byte",
  "generatie": 277,
  "geboren": "…", "gestorven": "…", "leeftijd_sec": 35999,
  "oorzaak": "ouderdom",        // cause of death
  "ouderA": "Nova", "ouderB": "Spark",
  "immigrant": false,
  "mutaties": 0,                // mutations at conception
  "verwantschap": 0.74,         // parental relatedness (inbreeding)
  "uitkomst": { "kinderen": 0, "woorden": 13, "vrienden": 6, "piek_iq": 100, "niveau": 0 },
  "genome": "vIlDWKA1q7U4r9FM_yPK8Q",   // raw base64url (the source of truth)
  "profiel": { "energy_decay": 188, …, "ageing": 241 }  // decoded 16-gene profile (0–255)
}
```

## The 16 genes (`profiel`)

Each value is 0–255 (128 = neutral baseline).

| key | meaning | | key | meaning |
|---|---|---|---|---|
| `energy_decay` | energy decay | | `happiness_care` | happiness care |
| `data_decay` | data decay | | `illness_chance` | illness chance |
| `fitness_decay` | fitness decay | | `recovery_speed` | recovery speed |
| `happiness_decay` | happiness decay | | `social_sensitivity` | social sensitivity |
| `mood_decay` | mood decay | | `colour_tint` | colour tint |
| `energy_care` | energy care | | `size` | body size |
| `data_care` | data care | | `expression_bias` | expression bias |
| `fitness_care` | fitness care | | **`ageing`** | **ageing / lifespan** |

> **What works?** Join `profiel` against `uitkomst` and `leeftijd_sec` across the
> ledger to see which gene values correlate with long life, many children, or
> rich vocabulary — and watch how the population drifts over generations.
