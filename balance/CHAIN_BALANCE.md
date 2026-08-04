# RIFF CHAIN BALANCE — measurement, variants, recommendation

*Aug 4 2026 · balance experiment, nothing merged · all numbers from `balance/sim-chainlab.js`, a copy of `vestibule-sim-kwstacks.js` that shares `src/data/cardEngine.js` with the live game*

---

## 0. TL;DR

1. **The headline evidence is wrong, or at least self-contradictory, and it matters.** The live bot session reports **1.99 riff chains per strike** (551 game-log lines / 277 strikes). The *same session file* also contains the bot's own play-based chain inference: **0.18 chains per strike** (49 events) — and that counter is scoped per **fight**, so it should *over*-count, not under-count. The sim independently measures **0.26/strike**. Two of the three agree; the outlier is the one the diagnosis was built on. Details and the likely mechanism: §2.
2. Because of that, every variant was measured at **both** chain rates. The recommendation was chosen specifically for being **safe at the low rate and biting hard at the high rate**.
3. **The diagnosis is correct on the mechanism.** Chains are the damage economy. At 2 chains/strike they supply a median ×3.17 of the median ×4.66 strike multiplier; deleting them drops the win rate 18.2% → 3.9%. The band's raw ATK line accounts for **0.23% of the damage a strike deals**.
4. **"Band building is decorative" — quantified.** Varying band base ATK from ×0.5 to ×2 (a 4× swing in every recruit's stat line) moves the Lucifer win rate by a factor of **1.34×** at the live chain rate. At the shipped sim's chain rate the same swing is worth **2.17×**. Chain volume is what flattens it.
5. **Recommended: two patches** — a diminishing-returns ladder per chain within a strike, plus a flat band-ATK-scaled bonus per chain that lands *after* the multiplier cascade. Measured at 2 chains/strike (n=4,000): win 18.2% → **9.6%**, boss one-shot 30.7% → **19.3%**, p90 amplification ×68.3 → **×37.6**, ATK sensitivity 1.34× → **1.50×**. At the shipped chain rate the same change is win-rate-neutral (4.85% vs 4.85% baseline) and pace-neutral.
6. **Honest limits.** Chains alone cannot hit the one-shot target. Even setting every chain to zero value leaves a **6.8%** boss one-shot rate and a **×17.6** p90 amplification — the rest of the multiplier economy (Possessed Perf ×3, Infernal Encore ×2, corruption ×3, relic multipliers, per-card ×1.08) does that work, and it sits *outside* `strikeMult` where no chain knob can reach it. Also: `MAX_STRIKES = 4`, so an *average* of 4–6 strikes per fight is arithmetically impossible; only the boss-fight average can live in that band.

---

## 1. What was built

| File | What |
|---|---|
| `balance/sim-chainlab.js` | Copy of `vestibule-sim-kwstacks.js` with every chain rule behind an env var, plus per-strike instrumentation. With no env vars set it reproduces the shipped sim exactly. |
| `balance/run-matrix.mjs` | Spawns one lab process per (variant × ATK scale) cell, prints the comparison table, writes raw JSON to `balance/results/`. |
| `balance/spec-*.json` | The grids that were run. Re-runnable verbatim. `spec-cal-*` are the policy-calibration sweeps in §2a; `spec-live*` / `spec-tune` / `spec-global` are the variant grids in §4; `spec-confirm` is the headline table in §5; `spec-shipped-policy` is the regime-W check. |
| `balance/results/*.json` | Raw per-cell output for every grid above, including the per-fight-index breakdowns not reproduced in this document. |
| `balance/make-patches.mjs` | Regenerates the `.patch` files from the current source. Every edit asserts its anchor text first, so a patch is never generated against a file that moved. |

```bash
# reproduce the headline table (~7 min on 2 cores)
node balance/run-matrix.mjs balance/spec-confirm.json 4000 2

# one-off cell
CHAIN_MODEL=dim CHAIN_DIM=1.60,1.25,1.10,1.02 ATK_SCALE=2 QUIET=1 \
  node balance/sim-chainlab.js 3000 bronze
```

Knobs: `CHAIN_MODEL` (`flat`|`dim`|`add`|`hybrid`|`none`), `CHAIN_MULT`, `CHAIN_DIM`, `CHAIN_SCOPE` (`strike`|`fight`), `CHAIN_ADD_PCT`, `CHAIN_ADD_WHEN` (`pre`|`post`), `SOFTCAP_KNEE`/`SOFTCAP_K`, `GLOBAL_KNEE`/`GLOBAL_K`, `CHAIN_EMBER_COST`, `CHAIN_CORR_COST`, `ATK_SCALE`, plus the policy knobs `CHAIN_FORCE`, `DECK_THIN`, `HAND_BONUS`, `EMBER_REFILL`, `CHAIN_SEEK`.

---

## 2. THE CALIBRATION GAP — read this before trusting anything below

This is the biggest threat to the conclusions, so it goes first.

### 2a. The sim's card AI fires 7× fewer chains than the live bot reports

Shipped sim, 2,000 games: **0.26 chains/strike**, 76.9% of strikes fire zero chains. Live bot: 1.99. I tried to close that gap with policy and could not:

| policy | chains/strike |
|---|---|
| shipped AI | 0.26 |
| chain priority ×3 / ×8 / ×20 / ×60 in `scoreCard` | 0.26 / 0.26 / 0.27 / 0.26 |
| hand +3 | 0.30 |
| hand +5, +4 embers/strike | 0.36 |
| hand +8, +8 embers/strike | 0.36 |
| deck thinned to 20 chain-dense cards | 0.53 |
| deck 20 + hand +2 + 2 embers/strike | **0.66** (the ceiling I could reach) |

Chain priority in the AI is irrelevant — the AI already values chain completion at +40 and raising that to +2400 changes nothing, because the binding constraint is *drawing both halves of a specific pair into the same hand*. Deck thinning is the only lever that moves it, and it tops out at 0.66.

### 2b. The live bot's own data disagrees with itself by 10×

`e2e/session3-events.jsonl`, one 35-minute session, 3 runs, 277 strikes:

| counter | source | events | per strike |
|---|---|---|---|
| `chain_confirmed` | scrape of the game's `⛧ RIFF CHAIN:` log lines in `window.__devLog` | 551 | **1.99** |
| `chain_fired` | the bot's own inference from the card ids it played | 49 | **0.18** |
| `play` | cards the bot actually played | 527 | 1.90 cards/strike |

Three problems with the 551:

- **551 chains from 527 card plays** means, on average, every single card the bot played completed a chain. Chains fire on the *second* card of a pair, so this requires nearly every play to complete one — and the deck to be almost entirely chain partners.
- **The inference counter is scoped per FIGHT** (`autopilot.cjs:797`, `firedChainsThisFight`) while the game requires both cards in the same **strike**. A per-fight scope can only *over*-count relative to the game's rule. It still lands 10× *below* the log scrape.
- **The per-run "chains" figure in the analyzer double-counts.** `e2e/analyze.cjs:119` is `else if (k === 'chain_confirmed' || k === 'chain_fired') cur.chains++` — both counters bump the same total, which is why the run table reads 234 / 209 / 157 = 600 while only 551 `chain_confirmed` events exist. That is a straightforward bug; the compiled section further down the same file (line 480–483) correctly prefers confirmed-only.

I could **not** determine which counter is right. `window.__devLog` is never trimmed and never reset (`App.jsx:5371`), and `chainLogSeen` in the scraper dedupes by occurrence count, so on paper the scrape should be exact. But its result is arithmetically hard to reconcile with the bot's own play log, and both other measurements agree with each other against it.

**This is the single highest-value thing to fix before shipping any chain change**: instrument the live game directly (a counter incremented at `App.jsx:6791` next to `combosFiredRef.current.push`) and read the true chains-per-strike. Everything downstream depends on it.

### 2c. The ×30.4 amplification figure is not a pure multiplier signal

`analyze.cjs` divides damage by **`bandAtkBase`** — `autopilot.cjs:323`, the base group of the `ATK 5 +3` stage display, which **excludes every this-strike ATK buff**. So Battle Cry, Amp It Up, Resonance and Possessed Perf's ×3 all count as "amplification" rather than as band ATK. Recomputed against the effective band ATK at strike time (`bandAtk`, the same rows), the non-lethal median in that session is **×2.2** (n=22 settled reads).

That also explains why the "overpowered" list is exactly `possessedperf / encore / infencore / resonancecard / tappedout / distortion`: those are the cards that inflate `atk` relative to `atkBase`, i.e. the metric partly measures its own denominator. It does not refute "multipliers do too much work" — the sim finds the same thing — but the specific numbers ×30.4 / ×181.6 / ×819.4 should not be treated as multiplier magnitudes, and **the lab's `ampMed`/`ampP90` columns are not comparable to them** (the lab divides by the full effective band ATK line, so it reads systematically lower).

### 2d. How this was handled

Every variant was measured in **two regimes**:

- **Regime W — shipped policy.** No overrides. 0.26 chains/strike. Reproduces the published `4.48%` headline (measured 3.95–4.90% across runs of 1,500–3,000 games).
- **Regime L — live-parity chain frequency.** `CHAIN_FORCE=1.9` tops each strike up to a Poisson(1.9) number of chains regardless of what the AI drew, plus the chain-drafted deck proxy (`DECK_THIN=20 HAND_BONUS=2 EMBER_REFILL=2`). Result: 2.03 chains/strike, boss one-shot 30.7%, win 18.2%. This is a **what-if**, not a derived model: it holds chain *frequency* at the disputed live value so that chain *models* can be compared on equal footing.

**What the sim cannot answer:** anything requiring the live bot's decision policy. Regime L's "good player" proxy only widens what the AI sees and can pay for; it does not make the AI sequence, shop or recruit better. Its win rate on the shipped rule (18.2%) is nowhere near the bot's 67%, and the gap is policy quality, which is not modelled. **Do not read the absolute win rates as predictions for a skilled human.** Read the *deltas between variants*, measured on identical policy.

---

## 3. CURRENT STATE, MEASURED

### 3a. Chains per strike

| chains in a strike | shipped sim (regime W) | live-parity (regime L) |
|---|---|---|
| 0 | 76.9% | 7.3% |
| 1 | 20.7% | 31.5% |
| 2 | 2.3% | 30.9% |
| 3 | 0.1% | 17.8% |
| 4 | 0.0% | 8.1% |
| 5+ | 0.0% | 4.5% |

### 3b. The strike multiplier, and how much of it is chains

`strikeMult` starts at 1.0 and is multiplied by ×1.08 per card played and ×1.78 per chain. Cards played per strike: 3.95 (W) / 4.77 (L).

| | regime W | regime L |
|---|---|---|
| total strike multiplier, median | ×1.47 | **×4.66** |
| total strike multiplier, p90 | ×2.62 | **×14.74** |
| product of chain multipliers alone, median | ×1.00 | **×3.17** |
| product of chain multipliers alone, p90 | ×1.78 | **×10.04** |

At the live chain rate chains are **88% of the strike multiplier in log terms** (`ln 3.17 / ln 4.66`). The per-card ×1.08 is noise by comparison.

The compounding is the whole problem — the ladder in §5 exists to flatten exactly this curve:

| chains in one strike | shipped (×1.78 flat) | recommended ladder |
|---|---|---|
| 1 | ×1.78 | ×1.60 |
| 2 | ×3.17 | ×2.00 |
| 3 | ×5.64 | ×2.20 |
| 4 | ×10.04 | ×2.24 |
| 5 | ×17.87 | ×2.29 |
| mean over the measured live-parity distribution | **×4.09** | **×1.75** |

### 3c. How much of the damage is the band?

Total raw band ATK summed over every strike, divided by total damage dealt:

| | band ATK share of damage dealt |
|---|---|
| regime W (shipped sim) | **1.23%** |
| regime L (live chain rate) | **0.23%** |
| regime L, chains worth zero | 1.33% |
| regime L, recommended patch | **0.50%** |

The band's stat line is between one quarter and one and a quarter percent of the damage that comes out. Everything else is multipliers.

### 3d. ATK SENSITIVITY — the number the task asked for

Band base ATK scaled at recruit time (`makeMember`); card-granted flat ATK untouched, so this measures "does a better roster matter", not "does everything scale". Lucifer win rate:

| regime | atk ×0.5 | atk ×1 | atk ×2 | Δ (pp) | significance | ratio |
|---|---|---|---|---|---|---|
| **W — shipped sim, 0.26 chains/strike** (n=2,000) | 3.50% | 3.95% | 7.60% | +4.10 | 5.7σ | **2.17×** |
| **L — live chain rate, 2.03 chains/strike** (n=4,000) | 18.63% | 18.22% | 24.88% | +6.25 | 6.8σ | **1.34×** |

**Quadrupling every recruit's base ATK is worth a 1.34× change in win rate at the live chain rate.** That is the "band building is decorative" number. It is not zero — damage is linear in band ATK, so doubling ATK does double damage — but the multiplier stack's spread is two orders of magnitude wide, so a ×2 shift in the whole distribution barely moves the probability of crossing a boss's HP bar.

**The mechanism is variance, not linearity.** Adding more ATK-proportional damage does not by itself make ATK matter more; *reducing the spread of the multiplier stack* does. That is why the sensitivity ranking below tracks how much each variant suppresses the multiplier tail.

---

## 4. VARIANT TABLE

All rows: Bronze / Standard. `bStr` = strikes per **boss** fight, `b1shot` = share of boss fights won in one strike (the all-fight one-shot column is dominated by trash fights that *should* die in one strike). `ampMed`/`ampP90` are final strike damage ÷ raw band ATK line — see §2c, these are **not** comparable to the bot's ×30.4. `×sens` = win%(atk×2) ÷ win%(atk×0.5).

### 4a. Regime L — live-parity chain frequency, n=1,500/cell

Shipped sim AI (no deck proxy), `CHAIN_FORCE=1.9`.

| variant | win% | ± | str/fgt | 1shot% | ampMed | ampP90 | ch/str | ΔATK | Δ/± | ×sens |
|---|---|---|---|---|---|---|---|---|---|---|
| BASE shipped ×1.78 | 16.13 | 0.95 | 2.45 | 45.9 | 12.19 | 51.02 | 1.74 | +3.13 | 2.3σ | 1.21 |
| **A** dim 1.78/1.40/1.20/1.05 | 10.00 | 0.77 | 2.74 | 38.7 | 11.30 | 34.39 | 1.73 | +2.94 | 2.8σ | 1.37 |
| **A2** dim 1.60/1.25/1.10/1.02 | 6.67 | 0.64 | 2.99 | 31.7 | 9.59 | 27.96 | 1.71 | +2.27 | 2.4σ | 1.37 |
| **B** once per chain id per fight | 15.60 | 0.94 | 2.46 | 46.4 | 11.77 | 49.18 | 1.74 | +3.60 | 2.6σ | 1.23 |
| **C1** flat ×1.40 | 8.87 | 0.73 | 2.87 | 35.6 | 9.37 | 32.11 | 1.71 | +2.07 | 2.0σ | 1.27 |
| **C2** flat ×1.25 | 6.33 | 0.63 | 3.15 | 28.6 | 7.95 | 23.65 | 1.71 | +2.93 | 3.2σ | 1.56 |
| **D** additive 1.0×ATK (pre-mult) | 10.60 | 0.79 | 2.69 | 41.4 | 11.74 | 36.10 | 1.73 | +2.53 | 2.3σ | 1.28 |
| **D2** additive 0.5×ATK (pre-mult) | 6.73 | 0.65 | 3.05 | 31.4 | 9.18 | 27.29 | 1.72 | +1.20 | 1.3σ | 1.21 |
| **E** softcap knee ×10, k 1.0 | 15.93 | 0.94 | 2.45 | 46.4 | 11.84 | 49.04 | 1.74 | +4.20 | 3.2σ | 1.32 |
| **E2** softcap knee ×5, k 0.7 | 12.33 | 0.85 | 2.53 | 44.3 | 12.45 | 46.43 | 1.75 | +3.87 | 3.3σ | 1.38 |
| **F** chains cost 2 embers | 4.20 | 0.52 | 3.23 | 33.4 | 5.29 | 24.49 | **0.61** | +1.80 | 2.3σ | 1.48 |
| **F2** chains cost 8 corruption | 20.47 | 1.04 | 2.36 | 49.4 | 14.33 | 57.24 | 1.77 | +4.20 | 2.8σ | 1.23 |
| **A+E** dim + knee ×10 | 9.00 | 0.74 | 2.78 | 37.9 | 11.15 | 35.37 | 1.74 | +1.60 | 1.6σ | 1.22 |
| **A+D** hybrid 1.40 ladder + 0.6×ATK pre | 12.53 | 0.85 | 2.55 | 44.9 | 13.76 | 44.11 | 1.74 | +4.27 | 3.6σ | 1.44 |
| **A+B** dim + once per fight | 7.87 | 0.70 | 2.79 | 37.6 | 11.31 | 34.04 | 1.72 | +3.80 | 3.6σ | 1.51 |
| **D+E** additive + knee ×10 | 9.33 | 0.75 | 2.72 | 40.5 | 11.81 | 36.21 | 1.73 | +3.13 | 3.0σ | 1.41 |
| **A+F** dim + 2 embers | 3.40 | 0.47 | 3.35 | 29.7 | 5.28 | 22.85 | 0.60 | +2.74 | 3.8σ | 2.00 |
| **NONE** chains worth 0 (control) | 3.40 | 0.47 | 3.67 | 18.1 | 5.37 | 14.77 | — | +3.53 | 5.2σ | 2.89 |

### 4b. Tuning grid — regime L + chain-drafted deck proxy, n=2,000/cell

| variant | win% | ± | str/fgt | bStr | 1shot% | b1shot% | ampMed | ampP90 | ΔATK | Δ/± | ×sens |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BASE shipped ×1.78 | 20.15 | 0.90 | 2.29 | 3.17 | 47.9 | 31.7 | 18.98 | 68.23 | +4.90 | 3.7σ | 1.25 |
| A dim 1.78/1.40 | 10.15 | 0.68 | 2.62 | 3.75 | 38.5 | 19.9 | 16.02 | 42.85 | +2.75 | 2.7σ | 1.27 |
| A2 dim 1.60/1.25 | 10.45 | 0.68 | 2.74 | 3.92 | 34.4 | 16.6 | 13.31 | 35.37 | +2.35 | 2.6σ | 1.30 |
| R2 dim 1.78/1.20/1.00 | 8.75 | 0.63 | 2.74 | 3.92 | 34.3 | 15.8 | 13.91 | 35.93 | +3.25 | 3.5σ | 1.41 |
| D-post additive 1.0×ATK | 5.60 | 0.51 | 3.18 | 4.53 | 25.0 | 11.1 | 9.40 | 21.31 | +1.35 | 1.8σ | 1.24 |
| R4 additive 2.0×ATK post, no mult | 6.20 | 0.54 | 2.99 | 4.26 | 30.6 | 15.7 | 11.83 | 25.41 | +2.60 | 3.3σ | 1.50 |
| R3 dim 1.45 + 1.0×ATK post | 8.30 | 0.62 | 2.79 | 3.99 | 34.6 | 17.1 | 13.78 | 33.70 | +3.15 | 3.7σ | 1.48 |
| **R5 dim 1.60 + 0.75×ATK post** | 9.00 | 0.64 | 2.71 | 3.89 | 36.8 | 18.4 | 15.03 | 38.65 | +3.85 | 4.2σ | **1.52** |
| A+B dim + once per fight | 11.30 | 0.71 | 2.57 | 3.68 | 39.8 | 21.1 | 15.90 | 44.45 | +1.25 | 1.3σ | 1.13 |
| NONE chains worth 0 | 3.90 | 0.43 | 3.39 | 4.79 | 18.9 | 6.8 | 6.99 | 17.62 | +2.05 | 3.1σ | 1.57 |

### 4c. Variant G — a global cap on total amplification (tested, rejected), n=1,500

Capping `strikeMult` (variant E) barely moves anything because Possessed Perf ×3, Infernal Encore ×2, corruption ×3 and every relic multiplier live *outside* `strikeMult`. So I tested capping the whole thing: final damage ≤ bandATK × knee × (1 + ln(amp/knee)·k).

| variant | win% | bStr | b1shot% | ampP90 |
|---|---|---|---|---|
| BASE | 21.60 | 2.28 | — | 69.30 |
| G knee ×10, k 1.0 | 2.40 | 2.78 | — | 36.67 |
| G2 knee ×6, k 0.7 | **0.53** | 3.28 | — | 19.62 |
| G3 knee ×4, k 0.5 | **0.20** | 3.69 | — | 11.04 |
| A2+G2 | 0.47 | 3.51 | — | 14.93 |

**Rejected.** It works on the shape metrics and destroys the game. This is the clearest evidence that **the boss HP curve is tuned assuming enormous amplification** — Lucifer's 100,000 base HP × 1.85 deck scale × 1.30 stake = 240,500 effective, against a band whose peak base ATK the live bot measured at 11. Any deep cut to the multiplier economy has to ship with an HP pass, or it just makes the game unwinnable rather than skilful.

### 4d. Notes on individual variants

- **B (once per chain id per FIGHT) does almost nothing alone** — 15.60% vs 16.13%, well inside noise. With 16 chains and ~2 firing per strike over ~2.5 strikes, per-fight uniqueness rarely binds. It only earns its keep bolted to A, and even there the ATK-sensitivity gain did not replicate between grids (1.51× at n=1,500, 1.13× at n=2,000). **Not recommended.**
- **C (lower flat rate) is the wrong shape.** ×1.25 gets similar aggregate numbers to the ladder, but it pays for them by nerfing the *single* chain just as hard as the fifth. At the shipped chain rate — where 97% of strikes fire zero or one chain — C is a straight nerf to a mechanic that is not misbehaving. The ladder is neutral there and bites only where the compounding is.
- **F (chains cost 2 embers) works by not letting chains fire** — the chain rate collapses from 1.74 to 0.61, Circle 1 deaths jump to 26%, and the run dies before it starts. Corruption cost (F2) is free value at these levels and made things *worse* (20.47%). **Not recommended.**
- **D placement matters more than D's size.** An ATK-scaled bonus added *before* the multiplier cascade is itself amplified and barely changes the distribution (A+D pre: ampMed 13.76, *higher* than base). The same bonus applied *after* everything (`CHAIN_ADD_WHEN=post`) is the version that suppresses the tail.

---

## 5. RECOMMENDATION

**Two patches, applied together. Patch 2 contains patch 1.**

### Patch 1 — diminishing returns per chain within a strike
`balance/01-chain-diminishing-returns.patch`

The Nth chain completed in one strike is worth `CHAIN_MULT_LADDER[N-1] = [1.60, 1.25, 1.10, 1.02]`, last entry repeating. Chains still fire unlimited times; they stop compounding.

New export in `src/data/cards.js`; `App.jsx:6786-6790` reads it (`combosFiredRef.current.length` is already the 0-based index of the chain about to fire, because the push happens further down); `vestibule-sim-kwstacks.js:987` gets the same rule.

### Patch 2 — chains also pay a band-ATK-scaled flat bonus
`balance/02-chain-band-atk-bonus.patch`

Each chain fired this strike adds `0.75 × the band's raw ATK line` as flat damage, applied **after** the entire multiplier cascade so it can never be amplified. Three edits in `App.jsx`'s strike body: capture the raw band ATK line at `~8531`, add the term to `finalDmg` at `~8926`, and push a damage-breakdown line so the player can see it.

### Measured effect, n=4,000/cell

Left block n=4,000/cell (regime L). Right block n=2,000 (shipped rule) / n=3,000 (P1+P2), regime W.

| | live-parity chain rate (2.03/strike) | | | shipped chain rate (0.26/strike) | |
|---|---|---|---|---|---|
| | shipped rule | **P1+P2** | P1 only | shipped rule | P1+P2 |
| Lucifer win % | 18.22 ±0.61 | **9.57 ±0.47** | 8.60 ±0.44 | 3.95 ±0.44 | 4.83 ±0.39 |
| strikes / fight | 2.31 | **2.68** | 2.79 | 3.45 | 3.44 |
| strikes / **boss** fight | 3.21 | **3.83** | 3.99 | 4.95 | 4.94 |
| one-shot % (all fights) | 47.0 | **37.5** | 33.3 | 23.3 | 23.8 |
| one-shot % (**boss** fights) | 30.7 | **19.3** | 15.7 | 12.0 | 12.3 |
| amplification median | 18.83 | **14.89** | 13.19 | 5.84 | 5.93 |
| amplification p90 | 68.29 | **37.59** | 34.47 | 18.15 | 18.33 |
| chains / strike | 2.03 | 2.02 | 2.03 | 0.26 | 0.26 |
| deaths Circle 1 | 0.33% | 0.33% | 1.57% | 23.5% | 22.3% |
| deaths Circle 9 | 59.5% | 53.9% | 50.9% | 34.9% | 32.9% |
| **ATK sensitivity (×2 ÷ ×0.5)** | 1.34× | **1.50×** | 1.40× | 2.17× | 2.02× |
| ATK Δ / significance | +6.25pp / 6.8σ | +4.10pp / 6.1σ | +3.05pp / 4.7σ | +4.10pp / 5.7σ | +3.00pp / 4.2σ |

The right-hand block is the point: at the shipped chain rate every row is within noise of the current build. The patch is inert where chains are rare.

### Why this pair

1. **It is robust to the unresolved chain-rate question (§2b).** At 0.26 chains/strike every measured row is within noise of the current build — 3.44 vs 3.45 strikes per fight, 12.3% vs 12.0% boss one-shots, p90 amplification ×18.3 vs ×18.2 (the win rate reads 4.83% vs 3.95%, a 1.5σ difference on cells of 3,000 and 2,000 games; the patched *real* sim independently printed 4.85% on 2,000 games against a 4.5–4.9% baseline). At 2.03 chains/strike it halves the win rate and cuts the p90 amplification by 45%. **A fix that does nothing when the mechanic is rare and bites hard when it is frequent is the only kind worth shipping while the evidence is in dispute.** The flat-rate cut (variant C) has the opposite profile and is the wrong bet.
2. **It targets compounding, not chains.** The first chain of a strike is still ×1.60 — the biggest single multiplier a card play can produce, and the flash still reads `×1.60 DAMAGE`. What dies is `1.78^k`: five chains go from ×17.87 to ×2.29.
3. **Patch 2 is the half that answers the actual complaint.** It is the only tested change that raised ATK sensitivity without gutting the mechanic: 1.34× → 1.50×, against a ceiling of 1.57× measured with chains set to zero value. It reaches 96% of the "delete chains entirely" benefit while chains keep firing at full frequency. It also more than doubles the band's share of damage dealt (0.23% → 0.50%), and it is the term a player can *see* scaling when they recruit a 12-ATK member over a 6.
4. **P1 alone is the lighter option** if 9.6% reads too harsh: better pace (3.99 boss strikes, 15.7% boss one-shot) but noticeably worse on the metric the owner cares most about (1.40× vs 1.50×).

### Where it lands against the targets

| target | result | verdict |
|---|---|---|
| win rate 10–20% for a skilled player | 9.6% at the live chain rate under the sim's mediocre policy | **can't be confirmed.** The sim's policy is far weaker than the live bot's (18.2% vs the bot's 67% on the shipped rule) and that gap is not modelled. 9.6% is a *lower* bound for a good player, not an estimate. |
| strikes per fight 4–6 | 2.68 all-fight / **3.83 boss** (from 2.31 / 3.21) | **partly.** `MAX_STRIKES = 4` makes an all-fight average of 4–6 arithmetically impossible; the boss average moves the right way and 3.83 of a possible ~4 is close to "every boss fight goes the distance". |
| one-shot rate < 10% | 19.3% boss one-shots (from 30.7%) | **no.** Not reachable by any chain change — see below. |
| large ATK sensitivity | 1.34× → 1.50× (ceiling 1.57×) | **yes, as far as chains can take it.** |

---

## 6. WHAT THIS DOES NOT FIX

**Chains are not the only reason band ATK is decorative, and they cannot be made to be.** Setting every chain to zero value (`NONE`) still leaves a **6.8%** boss one-shot rate, a **×17.6** p90 amplification and only a 1.57× ATK sensitivity. The remaining work is done by multipliers that live *outside* `strikeMult`, which is why variant E (soft-capping `strikeMult`) moved almost nothing:

- `possessedperf` — ×3 to every member's ATK this strike
- `infencore` — ×2 to the whole strike
- `encore` / DOUBLE TIME stack-3 — every member attacks twice
- corruption power multiplier — ×1.2 / ×1.5 / ×2.0 / **×3.0**
- relic multipliers, applied as `Math.pow(mult, fires)` — Goat's Head compounds ×1.3 per other relic
- band synergy ×1.35, mentor links, boss loot multipliers
- per-card ×1.08 (`PER_CARD_MULT`)

Those are exactly the six cards the live analyzer flagged, and the flag stands even after correcting for the denominator problem in §2c. **The natural next experiment is the same lab pointed at the ATK-multiplier cards** (`possessedperf` ×3 → additive, `infencore` ×2 → ×1.5, corruption ×3.0 → ×2.0), measured together with a Lucifer/boss HP pass — because §4c shows the HP curve currently *requires* the amplification it is getting.

---

## 7. SANITY CHECK AGAINST THE 16 CHAINS AND THE DECKS THAT NEED THEM

Chain **frequency** is untouched by both patches — chains fire exactly as often, they just pay differently. Everything that counts chains still works.

| thing | effect | verdict |
|---|---|---|
| **Shredder `riff_chain_echo`** (`App.jsx:6809`) — echo 33% of final damage per queued chain | Chain count unchanged, so the number of echoes is unchanged. Echo damage scales off final strike damage, which is lower, so the signature is proportionally intact but absolutely weaker in line with everything else. | **intact** |
| **Octave Pedal** — first chain each fight applies its mult twice | Reads `_chainBase`, so it still doubles the chain it fires on. Because it only ever fires on the first chain of a fight it always doubles the top rung: ×3.17 → ×2.56. A 19% nerf to the relic; it is still by far the biggest single multiplier event in a fight. | **intact, weaker** |
| **Tablet of Az'Tothoth** — all 16 chains in one run | Counts chain ids, not multipliers. Completely unaffected. | **intact** |
| **Haunted Radio** (`a5`, `perChain` ×1.2) | Unaffected — separate multiplier. Relatively *stronger* now. | **intact** |
| **Black Mass Bell** (`chains3`, ×2.5 at 3+ chains in a strike) | Unaffected. 30.9% of strikes fire 3+ chains at the live rate, 0.1% at the shipped rate. | **intact** |
| **Patch 2 and the aggro decks** | The band-ATK bonus scales with total stage ATK, so it is worth most to the decks that build ATK — Shredder above all. It is a small buff to exactly the identity that leans hardest on chains. | **positive** |

Two **pre-existing** problems found while checking this, neither caused by these patches:

- **`hellfire` and `demon_core` are unobtainable from any starter deck.** Both need `overdrive`, which is `shopOnly` with `copies:0` and appears in no manifest; `demon_core` also needs `sabbathsigil` (also shop-only). So **Tablet of Az'Tothoth's "master every chain in a single descent" already requires two specific shop purchases** on top of drawing all 16 pairs. Worth confirming that is intended.
- **The Engineer — the combo deck — has the worst chain access in the game**: only **7 of 16** chains are completable from its manifest (Standard 14, Ritualist 12, Shredder 11, Survivor 11). It is missing `shred_storm`, `blood_pact`, `death_wish`, `mosh_madness`, `dark_sacrifice`, `power_surge`, `last_stand`. If the Engineer is meant to be the chain deck, its manifest disagrees.

---

## 8. RISKS AND TRADEOFFS OF THE RECOMMENDATION

1. **The chain rate is unresolved (§2b) and the size of the effect depends entirely on it.** If 0.26/strike is the truth, these patches are close to a no-op and the real problem is elsewhere. If 2.0/strike is the truth, they are a large nerf. The patches were chosen to be safe under both, but "safe" is not "correct" — **instrument the live game before shipping**.
2. **The absolute win rates are not predictions.** The sim's policy gap to the live bot (18.2% vs 67% on the same rule) is not modelled. Only the variant-to-variant deltas are trustworthy.
3. **ATK sensitivity moved less than hoped.** 1.34× → 1.50× against a 1.57× ceiling. Chains are not the whole reason the band is decorative (§6); expect the recruiting layer to still feel light until the ATK-multiplier cards are addressed.
4. **The one-shot target is not reachable through chains.** 19.3% boss one-shots vs the 10% goal, with a 6.8% floor even at zero chain value.
5. **Two numbers to hand-tune.** `CHAIN_MULT_LADDER` and `CHAIN_ATK_BONUS` were tuned on 2,000–4,000-game cells. Neighbouring settings measured: ladder `1.78/1.40/1.20/1.05` (softer, win 10.15%, sensitivity 1.27×), ladder `1.45` + bonus `1.0` (harder, win 8.30%, 1.48×), bonus `2.0` with no ladder at all (win 6.20%, 1.50×, best pace at 4.26 boss strikes).
6. **Nothing was measured off Bronze/Standard.** Higher stakes and the other four decks are unmeasured, and the Shredder in particular (chain echo + 80% band HP) sits closest to this change.
7. **Two sources of truth to keep in sync.** `CHAIN_MULT_LADDER` in `src/data/cards.js` and `CHAIN_MULT_LADDER_SIM` in `vestibule-sim-kwstacks.js`. The patch comments say so at both sites, but the repo has no assertion for it the way it has `assertBossHpSync` for boss HP. Adding one to `e2e/test-card-parity.cjs` would be cheap insurance.
8. **A lab bug was found and fixed mid-run**: `Math.max(...arr)` overflowed the stack past ~120k amplification samples. It failed loudly (the cell produced no JSON and the runner threw), so no reported number was affected — but it is why one cell in `spec-shipped-policy.json` had to be re-run by hand.

---

## 9. VERIFICATION PERFORMED

- Both patches apply cleanly to the working tree (`git apply --check`).
- Applied to a scratch copy: `src/App.jsx` bundles without error (esbuild, JSX loader), and `node vestibule-sim-kwstacks.js 2000 bronze` runs to completion and prints 4.85% / 3.43 strikes per fight / 23.2% one-shot.
- The lab reproduces the shipped sim with no env vars set (4.6–4.9% across 500–3,000-game runs vs the published 4.48%).
- `grep -n "1\.78"` over `src/` and `vestibule-sim-kwstacks.js` confirms the constant appears only in the chain-firing block, the Octave Pedal comment, the combo-flash fallback, one auto-peak comment (`peakMult=4.31`) and one Rules-screen help string. **The Rules text at `App.jsx:10666` still says "Riff Chains multiply by ×1.78" and is not updated by either patch** — it needs a manual edit when the numbers land.
- Nothing in `src/App.jsx`, `src/data/cards.js` or `src/data/cardEngine.js` was modified. Nothing committed.
