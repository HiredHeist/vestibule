# DIFFICULTY CURVE — measurement, variants, recommendation

*Aug 5 2026 · balance experiment · **nothing merged, no tracked file modified** · all numbers from `balance/sim-difficulty.js`, a copy of `balance/sim-chainlab.js` (itself a copy of `vestibule-sim-kwstacks.js`) with every variant behind an env flag.*

*Rev 2 — the first revision of this document was built on a **wrong** Lucifer HP and every number in it was void. See §0a. Everything below is re-measured on the corrected basis.*

---

## 0a. RETRACTION — the Lucifer "bug" was not a bug, and it invalidated rev 1

Rev 1 claimed `vestibule-sim-kwstacks.js:1488`'s `actualHp=666666` was a sim bug and that live Lucifer was `enemies.js maxHp (100000) × deck hpScale (1.85) = 185,000`. **That was wrong.** `src/App.jsx` `getScaledMaxHp` (~5209) special-cases him:

```js
if(e&&(e.passiveId==='luciferBoss'||e.id==='lucifer')){
  const _lhl=parseInt(localStorage.getItem('vst_heat')||'1')
  return Math.ceil(333333*(1+Math.max(0,_lhl-1)*0.15)*(encoreMode?2.0:1.0))
}
```

Six further sites agree (`7174` phase-2 HP, `7188`/`7191` cinematic + log, `9648`/`9653` phase-1 spawn + log, `10265`). Live Lucifer is a **flat 666,666 total / 333,333 per phase, with no deck hpScale and no boss-kill reduction**. `enemies.js maxHp:100000` is **dead data** for him — nothing reads it for the real fight, which is exactly why `assertBossHpSync()` never caught the discrepancy.

The sim's hardcode was correct all along. My "fix" made the final boss **3.6× easier**, which is where rev 1's headline "the sim jumps from 5.9% to 24.5%, closing the calibration gap" came from. That number was an artifact of a boss I had broken, and **every variant result in rev 1 was inflated at the Circle-9 end**. Retracted in full.

Three consequences carried into this revision:

1. **The calibration gap the brief warned about is real and large.** Corrected baseline: sim **5.03%** vs the live bot's **22.4%**. §2.
2. **Rev 1's most suspicious number was indeed suspicious, but not for the reason feared.** "Circle-9 deaths 26% → 4.8%" was wrong in its *baseline* (the truth is **37.8%**) and the drop was real but came from a deliberate 9× Lucifer cut that rev 1's patch **did not actually implement** — it edited `enemies.js`, which does nothing. §5c.
3. **The patches were wrong and are regenerated.** A Lucifer change must patch the seven `333333` literals in `App.jsx`, `boss_hp_override.json[26]`, and the exemption constants in the parity assertions. §5d.

---

## 0. TL;DR

1. **Recommendation: V1 + V5 + V6 + V20C** — no overtime, band HP is not a loss condition, full heal between fights, and a **Balatro-shaped** published HP curve. n=6,000: win **22.8%** (from 5.0%), Circle-1 deaths **11.3%** (from 14.3%), middle mass **50.1%** (from 42.9%), Circle-9 deaths **15.8%** (from 37.8%), and **100% of losses are "you missed the number"** instead of 48% "the band ran out of herb". §5.
2. **The coordinator's structural hypothesis was right, and it resolves the tension problem rev 1 reported.** Concentrating difficulty into the circle boss — Small/Big comfortable (98% pass), circle BOSS the real check (92%), Circle IX the Ante-8 wall (79% per Lucifer phase) — beats a flat curve on nearly every axis: Circle-1 deaths 11.3% vs 17.1%, boss fights reaching the final strike **15.5% vs 10.1%**, boss one-shots 29.5% vs 34.0%, win rate 22.8% vs 20.0%. §6.
3. **The "27 checks needs 94.5% pass" arithmetic was not disqualifying — I framed it wrongly.** It is a *budget*, not a verdict: `∏ pass = winRate`. The question is how to *spend* it, and Balatro spends it unevenly. Measured REC-C spend: `0.98^18 × 0.92^8 × 0.62 = 0.221`, matching the observed 22.8%. §6.
4. **V9 backfired, harder than in rev 1** — 70.9% win rate, middle mass 4.9%, deck-skill sensitivity **1.02×**, the least skill-sensitive configuration measured. §7.
5. **V11 is inert.** Every delta under 1 SE. §7.
6. **Deck-skill sensitivity is barely moved by anything here** (baseline 1.20×, best 1.27×, ~1σ). The difficulty curve is not the lever. §8.
7. **The live ×1.06 amplification figure cannot be correct.** At ×1.06 the bot would need ~1,048 strikes to kill Lucifer; it logs ~92 strikes per *entire run*. Explicit arithmetic in §9. Do not size anything with it.
8. **Two live bugs found in passing**, both independent of this experiment: `e2e/test-card-parity.cjs` fails on a correct repo and will block the bot rig, and `vestibule-sim-kwstacks.js:1341` crashes ~1 run in 90,000 on an unguarded `reduce`. §10.

---

## 1. What was built

| File | What |
|---|---|
| `balance/sim-difficulty.js` | The lab. V1/V5/V6/V8/V9/V11/V20 behind env flags, plus per-fight pass-rate, band-ATK, strike-damage, boss-only pace and death-cause instrumentation. With no env vars set it reproduces the shipped sim — §1a. |
| `balance/run-difficulty.mjs` | Runs a spec's variants × {good, weak} policy, prints the comparison and deaths-by-circle tables, writes raw JSON to `balance/results/`. |
| `balance/fit-curve.mjs` | Iteratively refits a 27-entry HP curve until each fight hits a target pass rate. `SHAPE=flat` or `SHAPE=balatro`. Produced V20F and V20C. |
| `balance/make-difficulty-patches.mjs` | Regenerates the `.patch` files from current source; every edit asserts its anchor first. |
| `balance/spec-difficulty-{main,tension,final}.json` | The grids that were run. Re-runnable verbatim. |
| `balance/results/*.json` | Raw per-cell output including per-fight breakdowns. |
| `balance/*.patch` | The recommended change and each variant separately. **Not applied.** |
| `balance/RECOMMENDED_PLAYER_NOTE.md` | What changes on screen. |

```bash
# headline table (~4.5 min on 2 cores)
node balance/run-difficulty.mjs balance/spec-difficulty-final.json 6000 2

# one-off cell
NO_SKIP=1 START_PICK=1 V1_NO_OVERTIME=1 V5_HP_NOT_LOSS=1 V6_FULL_HEAL=1 \
HP_CURVE_MODE=v20c QUIET=1 node balance/sim-difficulty.js 4000 bronze standard

# refit the recommended shape against new data (e.g. after the bot re-measures)
SHAPE=balatro NONBOSS_PASS=0.99 BOSS_PASS=0.92 C9_BOSS_PASS=0.81 \
  node balance/fit-curve.mjs v20c 0.22 8 1500 V1_NO_OVERTIME=1 V5_HP_NOT_LOSS=1 V6_FULL_HEAL=1
```

Flags: `V1_NO_OVERTIME`, `V5_HP_NOT_LOSS` (+`V5_WAKE_PCT`), `V6_FULL_HEAL`, `V8_FIXED_DRUM` (+`V8_DRUM`), `V11_ATK_CAP`, `HP_CURVE_MODE` (`off|v9|v20|v20f|v20c|custom`) `+HP_CURVE`, `HP_CURVE_MULT`, `HP_CURVE_BOSS_MULT`, `LUCIFER_TOTAL`, plus calibration flags `NO_SKIP`, `START_PICK`, `POLICY`.

### 1a. Regression check — the lab is a faithful copy

| n=5,000, Bronze/Standard, **no flags** | win | C1 deaths | C9 deaths | strikes/fight | one-shot |
|---|---|---|---|---|---|
| `balance/sim-difficulty.js` | 4.12% | 22.2% | 34.0% | 3.44 | 23.3% |
| `vestibule-sim-kwstacks.js` (coordinator's run) | 4.68% | — | — | 3.40 | 23.8% |
| `vestibule-sim-kwstacks.js` (my run) | 4.94% | 23.0% | 33.6% | 3.39 | 23.8% |

All inside CLAUDE.md's published 3.95–4.94% band. (These are with the sim's default policy, which skips fight 0 — regime G below turns that off, which is why §3's baseline differs.)

---

## 2. CALIBRATION — the gap is real, and it is concentrated in the deep game

**Two genuine sim/live divergences were found and are corrected in the measurement regime. Neither is the Lucifer claim, which was mine and was wrong.**

- **The sim never fights The Wanderer.** `decideDescentSkips()` unconditionally skips fight 0 of Circle 1. The live bot fights it and dies there 47% of the time. `NO_SKIP=1`.
- **The sim drafts a perfect starting band.** `pickStartingPair()` takes the best of **40** random pairs by `memberScore`; the live player gets one booster. `START_PICK=1` takes a random pair, dropping fight-0 band ATK from 24 to 18, in line with the live bot's 15–17.

**Regime G (every number in this document):** `NO_SKIP=1 START_PICK=1`, Bronze / Standard, Lucifer at the live flat 666,666.

| | live bot (107 runs) | regime G (n=6,000) | verdict |
|---|---|---|---|
| win rate | **22.4%** | **5.03%** | **4.5× gap — policy** |
| strikes per fight | 3.44 | 3.16 | close |
| Circle 9 deaths | 30% | 37.8% | same order |
| Circle 1 deaths | **60%** | **14.3%** | **not reproduced** |
| middle mass (C2–8) | **9%** | **42.9%** | **not reproduced** |

**The brief's caveat was right: the sim's card-play policy is materially weaker than the live bot's, and rev 1's claim to the contrary is withdrawn.** The gap is concentrated at depth — the sim reaches fight 26 in 42.6% of runs but converts only 5.03%, because it needs a median of **13 strikes** to grind Lucifer down through overtime and usually dies trying. The live bot kills a 666,666 Lucifer often enough to win 22.4% of runs, so its deep-game output is far above the sim's. §9 quantifies how far.

**Consequence for the recommendation, stated plainly:** V20C is fitted to *sim* output. If live deep-game output is several times the sim's, the late entries are **too low for a live player** and the live win rate under REC-C would land above the 22.8% measured here. This is the largest risk in the recommendation, and it is why §12 says to ship the curve first and refit from bot data with the same harness.

### 2a. What the sim cannot tell you: the live Circle-1 disaster

Live: fight 0 takes a **median of 9 strikes** against an 84-HP Wanderer and kills 47% of runs. Sim: 3 strikes, 1.8–14% deaths depending on draft quality. The *mechanism* reproduces — fight 0 has the worst HP-to-output ratio on the shipped curve — but the magnitude does not.

**Every claim about Circle 1 below is arithmetic, not simulation.** In particular: a fight taking 9 strikes at the median cannot be passed under a 4-strike hard check at any frequency. V1 without an HP refit does not make Circle 1 harder live — it makes it **impossible**.

---

## 3. Baseline, measured (regime G, n=6,000)

| | value |
|---|---|
| win rate | 5.03% ± 0.28 |
| deaths C1 / C2–8 / C9 | 14.3% / 42.9% / **37.8%** |
| conditional win given reaching fight 3 | 5.9% |
| strikes per fight (mean / median) | 3.16 / 2 |
| **boss** strikes per fight | **4.75** |
| boss fights reaching strike 4+ | 45.0% |
| one-shot fights (all / boss) | 31.3% / 16.9% |
| deaths caused by the band going Too Stoned | **47.6%** |

**The strike allowance is not a check.** Boss-fight strike distribution:

| strikes | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| % of boss fights | 16.3 | 18.3 | 15.1 | 11.1 | 8.0 | 5.9 | 4.6 | 3.4 | 2.9 | 2.1 | 1.7 | 3.6 | **7.1** |

**Nearly half of boss fights run past the allowance, and 7% run to 13 strikes** — more than three times the budget. The average boss fight is already an overtime fight.

**The run is decided by fight 9, then nothing happens until Lucifer.** Share of runs still alive entering each fight:

| entering fight | 1 | 2 | 3 | 4 | 6 | 9 | 12 | 15 | 18 | 21 | 24 | 26 | win |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **BASE** | 88.6 | 88.2 | 85.7 | 85.6 | 79.5 | 59.5 | 53.9 | 50.3 | 48.9 | 46.2 | 42.8 | **42.6** | **5.0** |
| **REC-C** | 98.2 | 97.0 | 88.7 | 87.6 | 79.4 | 71.4 | 63.2 | 56.3 | 49.7 | 43.8 | 38.7 | 36.9 | 22.8 |

BASE sheds 11 points between fight 12 and fight 26, then **loses 37.6 of the remaining 42.6 at Lucifer**. That is the bimodality, in the sim, on the corrected basis: a soft middle and one enormous wall. REC-C decays smoothly and keeps a real, survivable final wall.

---

## 4. VARIANT TABLE

Regime G, **n = 4,000 per cell**, Bronze / Standard. 1 SE on the win rate is ±0.15–0.8 pp depending on rate; the 95% band is roughly ±2 SE. Differences under ~1.5 pp are noise.

`mid%` = runs ending in Circles 2–8. `condF3` = win rate among runs reaching fight 3. `4th%` = fights using the full allowance. `bStr`/`b4th%`/`b1shot%` = the same, restricted to circle-boss fights. `stoned%` = share of deaths from the band going Too Stoned. `skill×` = win%(good) ÷ win%(weak).

| variant | win% | ± | C1% | mid% | C9% | condF3 | str/fgt | 4th% | bStr | b4th% | b1shot% | 1shot% | stoned% | skill× |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **BASE (shipped)** | 5.03 | 0.28 | 14.3 | 42.9 | **37.8** | 5.9 | 3.16 | 23.9 | 4.75 | 45.0 | 16.9 | 31.3 | 47.6 | 1.20 |
| V1 no overtime | **0.90** | 0.15 | **35.3** | 61.4 | 2.4 | 1.4 | 2.20 | 18.3 | 2.78 | 32.7 | 21.8 | 37.9 | 1.5 | 2.37 |
| V5 hp not loss | 5.92 | 0.37 | 11.3 | 35.0 | 47.7 | 6.7 | 3.13 | 22.9 | 4.75 | 44.1 | 17.2 | 32.5 | **0** | 1.15 |
| V6 full heal | 5.17 | 0.35 | 13.0 | 36.9 | 44.9 | 6.0 | 3.07 | 22.5 | 4.64 | 43.3 | 17.3 | 33.0 | 43.9 | 1.14 |
| V8 fixed drummer | 5.60 | 0.36 | 11.3 | 42.3 | 40.9 | 6.3 | 3.13 | 23.5 | 4.71 | 44.6 | 16.9 | 31.9 | 44.6 | 1.33 |
| V9 exp curve | **70.88** | 0.72 | 12.3 | **4.9** | 11.9 | 80.8 | 2.15 | 8.1 | 2.31 | 4.6 | 57.6 | 55.3 | 77.9 | **1.02** |
| V11 atk cap | 4.42 | 0.32 | 13.4 | 43.2 | 39.0 | 5.1 | 3.17 | 24.2 | 4.74 | 45.5 | 16.4 | 31.4 | 47.6 | 1.10 |
| V20 median-fit curve | 52.58 | 0.79 | 14.9 | 23.9 | 8.6 | 61.8 | 2.83 | 16.8 | 3.23 | 19.6 | 25.6 | 26.1 | 90.2 | 1.04 |
| V20F flat-fit curve | 51.10 | 0.79 | 5.9 | 26.6 | 16.4 | 54.3 | 2.85 | 17.4 | 3.03 | 16.6 | 26.7 | 25.2 | 91.8 | 1.09 |
| V20C balatro curve | 45.67 | 0.79 | 4.4 | 19.6 | 30.4 | 47.8 | 2.52 | 12.4 | 3.29 | 22.3 | 24.6 | 34.1 | 90.1 | — |
| V1+V5 | 1.10 | 0.16 | 35.0 | 60.4 | 3.5 | 1.7 | 2.17 | 17.5 | 2.78 | 32.2 | 22.5 | 39.4 | 0 | 1.22 |
| V1+V5+V6 | 1.27 | 0.18 | 34.7 | 60.5 | 3.5 | 1.9 | 2.16 | 17.2 | 2.76 | 31.6 | 22.9 | 39.8 | 0 | 2.70 |
| V1+V5+V6+V20 | 18.52 | 0.61 | 33.6 | 44.4 | 3.5 | 27.9 | 2.27 | 12.6 | 2.42 | 16.3 | 28.6 | 30.1 | 0 | 1.14 |
| V1+V5+V6+V9 | 31.75 | 0.74 | 33.6 | 21.3 | 13.3 | 47.9 | 1.73 | 6.5 | 1.65 | 3.4 | 64.1 | 59.3 | 0 | 1.21 |
| V1+V5+V6+V9+V11 | 31.87 | 0.74 | 31.5 | 22.3 | 14.3 | 46.5 | 1.73 | 6.4 | 1.66 | 3.3 | 63.7 | 59.3 | 0 | 1.20 |
| V1+V5+V6+V8+V20 | 22.80 | 0.66 | 31.6 | 42.5 | 3.1 | 33.3 | 2.23 | 11.4 | 2.39 | 15.1 | 29.5 | 31.0 | 0 | 1.23 |
| V1+V20F (no V5/V6) | 16.95 | 0.59 | 15.9 | 62.6 | 4.5 | 20.2 | 2.29 | 12.2 | 2.25 | 11.3 | 33.1 | 29.4 | 4.2 | 1.21 |
| V1+V5+V6+V20F | 20.28 | 0.64 | 16.6 | 57.9 | 5.3 | 24.3 | 2.24 | 11.1 | 2.21 | 10.4 | 34.2 | 30.8 | 0 | 1.21 |
| V1+V5+V6+V8+V20F | 23.25 | 0.67 | 13.5 | 57.0 | 6.3 | 26.9 | 2.25 | 10.8 | 2.22 | 10.0 | 34.3 | 30.6 | 0 | 1.22 |
| V1+V20C (no V5/V6) | 19.55 | 0.63 | 11.1 | 55.3 | 14.0 | 22.0 | 2.06 | 8.6 | 2.45 | 16.7 | 28.6 | 38.5 | 8.9 | 1.28 |
| **V1+V5+V6+V20C** ★ | **22.10** | 0.66 | **10.1** | 51.1 | 16.7 | 24.6 | 2.02 | 8.1 | 2.42 | **15.9** | 29.7 | 40.2 | **0** | 1.14 |
| V1+V5+V6+V8+V20C | 23.23 | 0.67 | 10.8 | 50.1 | 15.9 | 26.0 | 2.01 | 7.8 | 2.43 | 15.9 | 29.3 | 40.4 | 0 | 1.08 |
| V1+V5+V6+V11+V20C | 22.32 | 0.66 | 11.3 | 51.4 | 15.0 | 25.2 | 2.02 | 8.1 | 2.43 | 16.2 | 29.4 | 39.9 | 0 | 1.28 |

### Deaths by circle, all nine (% of all runs, good policy)

| variant | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | WIN |
|---|---|---|---|---|---|---|---|---|---|---|
| **BASE (shipped)** | 14.3 | 6.2 | **19.9** | 5.6 | 3.6 | 1.4 | 2.8 | 3.3 | **37.8** | 5.0 |
| V1 no overtime | **35.3** | 11.1 | 31.1 | 8.3 | 4.5 | 1.5 | 2.0 | 3.0 | 2.4 | 0.9 |
| V5 hp not loss | 11.3 | 4.5 | 15.8 | 4.0 | 2.7 | 1.2 | 3.5 | 3.3 | 47.7 | 5.9 |
| V9 exp curve | 12.3 | **0.1** | **0.1** | 0.0 | 0.2 | 0.3 | 2.4 | 1.8 | 11.9 | **70.9** |
| V1+V5+V6 | 34.7 | 8.9 | 30.1 | 8.4 | 4.9 | 1.7 | 2.8 | 3.8 | 3.5 | 1.3 |
| V1+V5+V6+V20 | 33.6 | 9.5 | 9.2 | 8.4 | 5.5 | 4.8 | 4.2 | 2.6 | 3.5 | 18.5 |
| V1+V5+V6+V9 | 33.6 | 0.1 | 0.1 | 0.3 | 1.0 | 1.6 | 7.4 | 10.7 | 13.3 | 31.8 |
| V1+V5+V6+V20F | 16.6 | 12.3 | 12.5 | 8.8 | 7.2 | 6.5 | 5.8 | 4.8 | 5.3 | 20.3 |
| **V1+V5+V6+V20C** ★ | **10.1** | 9.8 | 8.0 | 8.3 | 7.8 | 6.6 | 5.2 | 5.6 | **16.7** | 22.1 |
| V1+V5+V6+V8+V20C | 10.8 | 8.8 | 7.4 | 8.7 | 7.6 | 6.6 | 5.5 | 5.7 | 15.9 | 23.2 |

### Per-variant verdicts

- **V1 (no overtime)** — correct in principle: it converts the loss condition from attrition to "missed the number" (Too-Stoned deaths 47.6% → 1.5%). Alone it is unshippable at 0.90%. **Not a standalone change; it obligates an HP refit, Lucifer included.**
- **V5 (band HP is not a loss condition)** — drives Too-Stoned deaths to exactly **0** in every combination containing it, and on its own is worth +0.9 pp (5.03 → 5.92, ~2σ). Its real work is between fights: a wiped band returns at 25% HP instead of staying disabled for the rest of the run.
- **V6 (full heal between fights)** — +0.1 pp alone (noise), largely redundant *with* V5. Keep it anyway: it is what makes the published number fully plannable, because the band that fights fight *n* is always the same band.
- **V8 (fixed drummer multiplier)** — worth **+1 to +2 pp** wherever it appears (REC-C: 22.82 → 24.77 at n=6,000, 2.5σ). Removing a coin flip removes downside variance more than upside. It does not improve skill sensitivity. A *plannability* win, and on the brief's own terms that is the point. **Recommended as an optional add-on.**
- **V9 (exponential curve)** — **backfired.** §7.
- **V11 (capped ATK growth)** — **inert.** §7.
- **V20 (median-fit)** — 18.5% under V1 but leaves Circle 1 at 33.6%; the median target is the problem. §6.
- **V20F (flat pass-rate fit)** — works, 20.3%, best middle mass (57.9%), but the softest boss fights and no final wall (C9 5.3%).
- **V20C (Balatro-shaped)** — the recommendation. §5, §6.

---

## 5. RECOMMENDATION — V1 + V5 + V6 + V20C

Final confirmation, **n = 6,000 per cell**, regime G. 1 SE ≈ ±0.28–0.56 pp.

| | BASE shipped | REC-A V1+V5+V6+**V20F** | **REC-C V1+V5+V6+V20C** ★ | REC-C + V8 |
|---|---|---|---|---|
| **win rate** | 5.03 ± 0.28 | 19.97 ± 0.52 | **22.82 ± 0.54** | 24.77 ± 0.56 |
| **Circle 1 deaths** | 14.3 | 17.1 | **11.3** | 10.3 |
| **middle mass (C2–8)** | 42.9 | **57.5** | 50.1 | 48.6 |
| **Circle 9 deaths** | **37.8** | 5.4 | **15.8** | 16.3 |
| cond. win given fight 3 | 5.9 | 24.1 | 25.7 | 27.6 |
| strikes/fight (mean, median) | 3.16, 2 | 2.25, 2 | 2.02, 2 | 2.01, 2 |
| **boss** strikes/fight | 4.75 | 2.22 | **2.42** | 2.40 |
| **boss fights to final strike** | 45.0† | 10.1 | **15.5** | 15.1 |
| boss one-shots | 16.9 | 34.0 | **29.5** | 30.2 |
| **deaths from Too Stoned** | **47.6%** | **0%** | **0%** | **0%** |
| deck-skill sensitivity | 1.20× | 1.24× | 1.27× | 1.22× |

† BASE's 45% is not a tension figure — it counts every boss fight that *reached* strike 4, and 28% of boss fights then continue past strike 6 into deep overtime. Under V1 there is no past.

**REC-C is recommended.** Against the flat-fitted alternative it is better on Circle-1 deaths (11.3 vs 17.1), win rate (22.8 vs 20.0), boss tension (15.5% of boss fights use the full allowance vs 10.1%), boss one-shots (29.5 vs 34.0) and skill sensitivity (1.27 vs 1.24). It is worse on middle mass (50.1 vs 57.5) — deliberately, because it keeps a real final wall at Circle IX (15.8% vs 5.4%) instead of flattening the endgame into nothing. **V8 is worth adding** (+2.0 pp, 2.5σ; Circle-1 deaths 11.3 → 10.3).

### 5a. The rhythm — this is the point of the shape

Measured pass rate at every fight index, REC-C, by circle:

| circle | fight 1 | fight 2 | **BOSS** |
|---|---|---|---|
| I | .98 | .99 | **.91** |
| II | .99 | .98 | **.92** |
| III | .98 | .99 | **.93** |
| IV | .99 | .98 | **.91** |
| V | .98 | .98 | **.92** |
| VI | .98 | .98 | **.91** |
| VII | .98 | .98 | **.91** |
| VIII | .98 | .98 | **.92** |
| IX | .97 | .98 | **.79** (per Lucifer phase; ~.62 for the fight) |

The deaths follow it exactly — non-boss fights kill ~1% of runs each, circle bosses kill 3.5–8.3%, Lucifer kills 14.1%. **That is Balatro's structure**: you do not die to the Small Blind, you die to the boss blind, and Ante 8 is where runs end.

### 5b. The V20C curve — the published number

Generating rule (re-runnable, `balance/fit-curve.mjs`):

1. target pass rates: non-boss **0.99**, circle boss **0.92**, Circle IX non-boss **0.98**, Lucifer **0.81 per phase** (two phases ⇒ ~0.66 for the fight);
2. iterate HP at every fight index until the measured pass rate hits its target (converged: RMSE 0.008);
3. round to 2 significant figures.

| f | boss | now shown | **V20C shown** | med strikes | die here % |
|---|---|---|---|---|---|
| 0 | The Wanderer | 84 | **32** | 1 | 1.78 |
| 1 | The Lost Soul | 82 | **76** | 2 | 1.23 |
| 2 | The Drifter ★ | 213 | **204** | 2 | 8.25 |
| 3 | The Siren | 235 | **315** | 1 | 1.17 |
| 4 | The Tempter | 407 | **481** | 1 | 1.40 |
| 5 | The Seducer ★ | 1,203 | **981** | 2 | 6.80 |
| 6 | The Glutton | 813 | **1,018** | 2 | 1.33 |
| 7 | The Feaster | 1,331 | **1,092** | 1 | 1.08 |
| 8 | The Devourer ★ | 4,768 | **1,850** | 2 | 5.57 |
| 9 | The Miser | 1,175 | **1,647** | 2 | 0.85 |
| 10 | The Hoarder | 2,109 | **2,035** | 2 | 1.37 |
| 11 | The Usurer ★ | 6,949 | **3,515** | 2 | 5.97 |
| 12 | The Wrathful | 2,409 | **4,255** | 2 | 1.00 |
| 13 | The Berserker | 4,207 | **2,960** | 2 | 0.98 |
| 14 | The Warlord ★ | 10,878 | **5,550** | 2 | 4.90 |
| 15 | The Heretic | 4,960 | **4,810** | 2 | 0.97 |
| 16 | The Apostate | 8,466 | **5,365** | 2 | 1.02 |
| 17 | The False Prophet ★ | 15,452 | **9,805** | 2 | 4.65 |
| 18 | The Brute | 9,234 | **6,845** | 2 | 0.77 |
| 19 | The Hunter | 14,847 | **7,400** | 2 | 0.88 |
| 20 | The Executioner ★ | 24,587 | **12,950** | 2 | 4.27 |
| 21 | The Trickster | 26,270 | **11,100** | 2 | 0.87 |
| 22 | The Deceiver | 37,716 | **12,025** | 2 | 0.78 |
| 23 | The Archfraud ★ | 54,022 | **20,350** | 2 | 3.45 |
| 24 | The Traitor | 19,035 | **13,320** | 2 | 0.98 |
| 25 | The Betrayer | 22,526 | **18,500** | 2 | 0.75 |
| 26 | **Lucifer** ★ | **666,666 flat** | **72,000 flat** (36,000/phase) | 3 | **14.12** |

★ = circle boss. "shown" = the on-screen number for Standard deck at heat 1 (`base × 1.85`) — **except Lucifer, who is flat and unscaled at both ends.**

### 5c. Does the Circle-9 result survive? Yes, but the framing changes

The coordinator flagged "C9 26% → 4.8%" as suspicious. It was, and here is the corrected account:

- The **baseline was wrong**: the true Circle-9 death rate is **37.8%**, not 25.8%. Lucifer at 666,666 is the single biggest killer in the game — bigger than all of Circles 2–8 combined.
- The drop is **real and deliberate**, not an artifact: it comes from cutting Lucifer **666,666 → 72,000**, a 9.3× reduction, which the fitter chose because at 666,666 a 4-strike hard check is unwinnable (§9: it needs ×278 amplification per strike).
- Rev 1's patch **did not implement that cut** — it rewrote `enemies.js maxHp[26]`, which is dead data. The recommendation only works with the seven `App.jsx` literals patched. Fixed in §5d.
- **The flat curve (REC-A) overshot** — C9 5.4% means no final wall at all. REC-C deliberately leaves Circle IX at **15.8%**, so the final circle stays the place runs end, at a survivable rate.

**Caveat that applies specifically to the Lucifer number:** it is the single entry most exposed to the sim's policy gap (§2), because the gap is largest at depth. 72,000 is the sim's answer. A live player who can already grind 666,666 down through overtime will find 72,000 in four strikes much easier than the sim does. **Expect this number to move up after the bot re-measures.**

### 5d. Patches (generated, **not applied**)

| file | what |
|---|---|
| `00-FIX-e2e-parity-lucifer-exemption.patch` | **apply first, unrelated live bug** — §10 |
| `00-RECOMMENDED-v1-v5-v6-v20c.patch` | the whole recommended set, one apply |
| `01-v1-no-overtime.patch` | V1 only |
| `02-v5-hp-not-loss.patch` | V5 only (**conflicts with 03**) |
| `03-v6-full-heal.patch` | V6 only (**conflicts with 02**) |
| `04-v20c-hp-curve.patch` | the recommended curve only |
| `05-v20f-hp-curve-ALT.patch` | the flat-shaped alternative curve |

All verified with `git apply --check`; the recommended patch was applied in a scratch clone, `enemies.js` / `vestibule-sim-kwstacks.js` / `test-card-parity.cjs` re-parsed with `node --check`, `App.jsx` brace/paren balance confirmed unchanged, and the parity assertion re-run clean on the patched tree. Regenerate with `node balance/make-difficulty-patches.mjs`.

**Exact line locations** (against `b58f997`; `src/App.jsx` = 12,566 lines):

| # | file | line | change |
|---|---|---|---|
| V1a | `src/App.jsx` | **9,483** | `if(false){ // OVERTIME...` → `if(cur<=0&&_bossAlive){`. The loss branch is intact underneath; it was only disabled. The `enemyHpRef` guard is load-bearing — this updater runs after the strike resolves and a kill on the final strike must resolve as a win. |
| V1b | `src/App.jsx` | **9,278** | the OVERTIME ×2 enrage — now unreachable, neutralised rather than left as live-looking dead code. |
| V1c | `src/App.jsx` | **12,253** | strike counter `☠ OVERTIME ×N` → `☠ NO STRIKES LEFT`. |
| V5a | `src/App.jsx` | **9,333** | all-stoned branch: logs a wipe, does not end the run. |
| V5b | `src/App.jsx` | **9,393** | the second copy of the same branch. **Both** must change or the run still ends on one of the two damage paths. |
| V6 | `src/App.jsx` | **7,398** | `if(activeStake.healAfterFight){...hp+2...}` → full heal + un-stone. Overrides the stake flag; see risks. |
| curve | `src/data/enemies.js` | 26 × `maxHp:` | entries **0–25 only**. Entry 26 (lucifer) is deliberately left alone — it is dead data. |
| **Lucifer** | `src/App.jsx` | **5,213 / 7,174 / 9,648 / 10,265** | `Math.ceil(333333*(1+…))` → `36000`. These four are the ones that matter. |
| Lucifer | `src/App.jsx` | **7,188 / 7,191 / 9,653** | cinematic HP and the two phase log lines. |
| Lucifer | `src/App.jsx` | **5,209** | the comment documenting the flat total. |
| sync | `boss_hp_override.json` | all 27 | entries 0–25 mirror `enemies.js`; **entry 26 carries Lucifer's flat TOTAL (72,000)** and is deliberately *not* equal to `enemies.js maxHp`. |
| sync | `vestibule-sim-kwstacks.js` | **~53**, **1,488** | the `LUCIFER_EXEMPT` constant and the `simGame` hardcode both move 666666 → 72000. |

CLAUDE.md cardinal rule: all of the above in the **same commit**.

### 5e. Risks

1. **The curve is fitted to sim output, and the sim is 4.5× weaker than the live bot** (§2). The late entries — Lucifer above all — are the most likely to be too soft live. **Largest risk.** Mitigation in §12: ship the curve first with overtime still on, re-measure, refit.
2. **The live Circle-1 number is not validated** (§2a). V20C's Wanderer is 32 shown HP against today's 84. If live fight 0 really needs 9 strikes at 84, it needs ~3.4 at 32 — inside the allowance, but only just.
3. **One-shot rate gets worse**, 31.3% → 40.2% overall. Deliberate: 18 of 27 fights are now formalities by design. Boss one-shots are the meaningful figure and they move the right way relative to the flat curve (29.5% vs 34.0%) but the wrong way against BASE (16.9%). If that matters more than win rate, raise `BOSS_PASS` / lower `NONBOSS_PASS` and accept a lower win rate.
4. **V6 overrides the stake `healAfterFight` flag**, currently the main mechanical difference between Bronze and Obsidian/Blood/Demonic, and their descriptions say so. Those descriptions must change in the same commit. The patch comment documents the softer option: gate the un-stoning on `activeStake.healAfterFight` and leave the heal at +2.
5. **Bronze / Standard only.** Deck `hpScale` spans 1.65–2.00, a 21% swing in every number. Re-run `fit-curve.mjs` per deck if per-deck win rates matter. Lucifer, being unscaled, is *relatively* harder for Ritualist and easier for Shredder than every other fight — pre-existing, but the cut makes it a larger share of total difficulty.
6. **Re-arming a branch that has not executed since Jul 31 2026.** The `if(false)` path calls `calcRunScore` / `saveRunHistory` / achievement code on the `beaten` cause. Test the death screen on a deliberate timeout before shipping.
7. **Save compatibility.** `vst_save` stores `sl:Math.max(1,strikesLeft)` (`App.jsx:7717`) so overtime states are never persisted; with V1 that clamp protects nothing but does not break — a resumed fight restarts with a full allowance, now more generous.

---

## 6. THE STRUCTURE QUESTION — the coordinator was right, and I framed the arithmetic wrongly

Rev 1 claimed "27 sequential checks require 94.5% pass each, therefore tense fights and no overtime are mutually exclusive." **The premise is arithmetic and correct; the conclusion was wrong**, because it silently assumed the pass rate had to be *uniform*.

The correct statement is a **budget**:

```
∏(f=0..26) passRate(f) = runWinRate
```

A flat spend gives `0.22^(1/27) = 94.5%` everywhere. But the budget can be spent unevenly, and Balatro spends it very unevenly — Small and Big blinds are near-certain, the boss blind is the check, Ante 8 is the wall. **Vestibule already has that skeleton**: 3 fights per circle, 9 circles, every third fight a circle boss.

Measured REC-C spend:

```
0.98^18   ×   0.92^8   ×   0.62        =  0.221
└ Small/Big   └ circle bosses  └ Lucifer (both phases)
```

against an observed **22.8%**. The budget balances, and the tension goes where it belongs.

What the shape buys, at the same total difficulty:

| | flat (V20F) | **Balatro (V20C)** |
|---|---|---|
| win rate | 19.97 | **22.82** |
| Circle-1 deaths | 17.1 | **11.3** |
| **boss fights using the full allowance** | 10.1% | **15.5%** |
| boss one-shots | 34.0% | **29.5%** |
| boss strikes/fight | 2.22 | **2.42** |
| Circle-9 deaths (a real final wall?) | 5.4 (no) | **15.8 (yes)** |
| middle mass | **57.5** | 50.1 |

Boss-fight strike distribution under REC-C: **29.5 / 30.9 / 18.7 / 13.8 / 7.0** for 1 / 2 / 3 / 4 / 5+ strikes. **20.8% of circle-boss fights go to the fourth strike or beyond**, against 10.1% under the flat curve.

**Honest limit.** A real improvement, not a complete fix. The median boss fight is still won in 2 strikes and 29.5% are one-shot. Concentrating difficulty raises boss tension by roughly 50% relative to a flat curve; it does not turn every boss into a nail-biter. Pushing further was measured and does not pay: refitting at `BOSS_PASS=0.87` drops the win rate to 17.1% and pushes Circle-1 deaths back to 15.5% without improving the boss strike distribution. The remaining ceiling is the **variance of the multiplier stack** (§8), not the shape of the curve.

Two structural levers not tested here, both outside the brief, both of which would raise that ceiling: **more strikes** (`MAX_STRIKES` 4 → 5/6 narrows the gap between the median and the 5th percentile of achievable damage, so a tighter number stays survivable), and **non-lethal misses** on non-boss fights (Slay the Spire's model — a miss costs HP or stash, not the run, letting the two "Small/Big" fights carry real cost without spending win-rate budget).

---

## 7. WHAT BACKFIRED

### V9 — the exponential curve. Comprehensively.

The brief asked for an exponential steep enough that raw band ATK alone cannot clear past ~Circle 4. The fitted formula does exactly that:

```
HP(f) = round( 45 × 1.25^f )
```

Measured band raw ATK grows ~1.19×/fight, so a 1.25× curve outruns it by 1.05×/fight; `4 × bandATK` covers the number through fight 10 and falls behind permanently from fight 11 — Circle IV, as specified. **The requirement was met and the result was a disaster:**

| | BASE | V9 |
|---|---|---|
| win rate | 5.03% | **70.88%** |
| middle mass (C2–8) | 42.9% | **4.9%** |
| deaths C2 / C3 / C4 | 6.2 / 19.9 / 5.6 | **0.1 / 0.1 / 0.0** |
| boss fights to final strike | 45.0% | **4.6%** |
| one-shot rate | 31.3% | **55.3%** |
| deck-skill sensitivity | 1.20× | **1.02×** |

**Why:** the shipped curve is not remotely exponential — it is a ramp with enormous boss spikes and one colossal terminal wall. The Devourer is 2,577 base at fight 8 where a 1.25 exponential says 268; the Archfraud is 29,201 where it says 13,018; Lucifer is 666,666 flat where it says 36,347. Replacing the table with *any* clean exponential anchored at the Wanderer's 45 **deletes every wall in the game**. Circles 2–6 become deathless (0.0–0.3% each), and with nothing to plan around, skill sensitivity falls to 1.02× — the least skill-sensitive configuration measured anywhere in this experiment.

V9 also fails on its own terms. Forcing "you need a multiplier engine" is not the same as forcing "you need a *good* one": once the bar is `>1×` amplification, every deck clears it, because the median strike already amplifies ~5×. Raw ATK was never the binding constraint. **Drop V9.** If a published exponential is wanted for readability, fit it to *output* (V20C/V20F), not to raw ATK.

### V11 — capped ATK growth. Inert, not harmful.

| | BASE | V11 | REC-C | REC-C+V11 |
|---|---|---|---|---|
| win rate | 5.03 | 4.42 | 22.10 | 22.32 |
| middle mass | 42.9 | 43.2 | 51.1 | 51.4 |
| skill× | 1.20 | 1.10 | 1.14 | 1.28 |

Every delta within ~1 SE. The cap almost never binds, and when it does it trims something that is ~1% of damage output (`CHAIN_BALANCE.md §3c`: the band's raw stat line is 0.23–1.23% of damage dealt). A published per-fight ceiling on permanent ATK governs almost nothing. **Drop it** — or, if the intent was to cap *the engine*, cap the multiplier stack, which is where the damage is.

### V20 as literally specified — median-fit. Fails under its own partner change.

Fitting HP to 3.5 strikes at the *median* gives 52.6% with overtime and 18.5% under V1, but leaves **33.6% of runs dying in Circle 1** — it re-creates the wall it was meant to remove. §6 explains why: the median is a coin flip, and a coin flip is not something you can afford 27 times *in a row at the same rate*. Spending the budget unevenly (V20C) is what fixes it.

---

## 8. DECK-SKILL SENSITIVITY — still not fixed by anything here

**Method.** Two policies, identical otherwise. `POLICY=good` is the shipped `scoreCard` AI. `POLICY=weak` plays a **random affordable card** each time instead of the best-scoring one, with chain-seeking disabled (`CHAIN_SEEK=0`) so it never sequences for a riff chain or holds embers for a payoff. Metric: `win%(good) ÷ win%(weak)`.

| configuration (n=6,000 unless noted) | good | weak | **skill×** |
|---|---|---|---|
| BASE shipped | 5.03 | 4.20 | **1.20** |
| V9 exp curve (n=4,000) | 70.88 | 69.50 | **1.02** |
| V20 median-fit (n=4,000) | 52.58 | 50.42 | **1.04** |
| REC-A V1+V5+V6+V20F | 19.97 | 16.15 | **1.24** |
| **REC-C V1+V5+V6+V20C** | 22.82 | 17.98 | **1.27** |
| REC-C + V8 | 24.77 | 20.37 | **1.22** |

**No variant meaningfully improves it.** Baseline 1.20×, best 1.27–1.28×, and on a ratio whose standard error is ±0.05–0.08 that is about 1σ. **Treat "the recommendation improves skill sensitivity" as unproven.**

The one robust pattern: **flattening the difficulty destroys skill expression** — V9 (1.02×) and V20-median (1.04×) are the two easiest configurations and the two least skill-sensitive. Skill needs the check to be close. Concentrating tension into 9 boss fights is a step in that direction (1.27 vs 1.20) but a small one, because the other 18 fights are formalities where nothing a player does matters.

Same conclusion `CHAIN_BALANCE.md` reached from the other direction: the multiplier stack's spread is two orders of magnitude wide and swamps the difference between good and bad play. **The difficulty curve is not the lever for skill expression. Variance reduction is.** V8 is the only variant here that touches variance and is worth +2 pp of win rate but nothing measurable in sensitivity — one d6 is a small part of a stack whose p99 is ×29.5. **If skill expression is the priority, the next experiment belongs on the multiplier stack, not on boss HP.**

---

## 9. THE ×1.06 AMPLIFICATION FIGURE CANNOT BE CORRECT

The brief reports median damage amplification **×1.06** (p90 ×4.42, p99 ×29.5, n=2,373), amplification being final strike damage ÷ band ATK. Three checks, all using the brief's own numbers.

**Check 1 — strikes required at ×1.06, against the brief's own "3–4 strikes".** Using the brief's median band ATK by fight and the live shown HP:

| f | boss | shown HP | band ATK | dmg @×1.06 | strikes needed | brief says |
|---|---|---|---|---|---|---|
| 1 | The Lost Soul | 82 | 35 | 37 | 2.2 | 3–4 |
| 2 | The Drifter | 213 | 62 | 66 | 3.2 | 3–4 |
| 4 | The Tempter | 407 | 122 | 129 | 3.1 | 3–4 |
| 5 | The Seducer | 1,203 | 138 | 146 | **8.2** | 3–4 |
| 6 | The Glutton | 813 | 165 | 175 | **4.6** | 3–4 |
| 8 | The Devourer | 4,768 | 212 | 225 | **21.2** | 3–4 |

It holds for the first four fights and then diverges hard. The Devourer additionally heals 25 HP per card played (`cardHeal8`); at ~4 cards/strike that is +100 HP/strike against 225 damage, pushing the true figure past 38 strikes.

**Check 2 — Lucifer, the decisive one.** Lucifer is a flat 666,666.

| band ATK at f26 | dmg @×1.06 | strikes to kill Lucifer |
|---|---|---|
| 212 | 225 | **2,967** |
| 400 | 424 | **1,572** |
| 600 | 636 | **1,048** |
| 800 | 848 | **786** |

The live bot logged **277 strikes across three entire runs** — about 92 strikes per run across all 27 fights. It cannot be spending ~1,000 of them on Lucifer, and it wins 22.4% of runs, so it is killing him.

**Check 3 — what amplification is actually required.**

| | HP | band ATK | in 3 strikes | in 4 strikes |
|---|---|---|---|---|
| The Devourer | 4,768 | 212 | **×7.5** | **×5.6** |
| Lucifer | 666,666 | 600 | **×370** | **×278** |

Even the reported **p99 of ×29.5** is an order of magnitude short of what Lucifer demands. **The whole distribution is mis-scaled, not just the median.**

**Verdict: do not use ×1.06, ×4.42 or ×29.5 to size anything.** This is the same denominator problem `CHAIN_BALANCE.md §2c` documented in the bot's amplification metric — the divisor appears to already include the multipliers it is trying to measure, so the ratio collapses toward 1. The sim's own series (`results/*.json`, `byFight[].ampMed`) reads ×1.4 at fight 1 rising to ×12.8 at fight 26, self-consistent with clearing the shipped curve; even that is likely an *under*-estimate of live, since the live bot beats a boss the sim mostly cannot.

**What to do:** instrument the live game directly — one counter where the final strike damage and the raw band ATK line are both in scope — and re-derive the series. Until then the only trustworthy live pace numbers are the ones that need no denominator: strikes per fight, deaths by circle, win rate.

---

## 10. TWO LIVE BUGS FOUND IN PASSING

**1. `e2e/test-card-parity.cjs` fails on a correct repo — the bot rig cannot start.** The `LUCIFER_EXEMPT` branch was added to `vestibule-sim-kwstacks.js` but not to the e2e parity assertion, which still compares `boss_hp_override.json[26]` (666666, correct) against `enemies.js maxHp` (100000, dead data):

```
✗ index 26 (lucifer): json=666666 enemies.js=100000
```

`process.exit(1)` before the rig connects. Fix: `balance/00-FIX-e2e-parity-lucifer-exemption.patch`. **Apply regardless of anything else in this document.**

**2. `vestibule-sim-kwstacks.js:1341` crashes roughly 1 run in 90,000.** In the `devils_wager` event:

```js
const strongest=alive.reduce((a,b)=>a.atk>b.atk?a:b);
```

No initial value. `alive` is empty when a fight is won on the same strike that stones the last member — the run continues with a fully-stoned band into the between-fight event, and the process dies with `TypeError: Reduce of empty array with no initial value`. It killed 2 of 46 cells in this experiment's first matrix run before I guarded it. Same line at `balance/sim-chainlab.js:1534`. Fix: `alive.length?alive.reduce(...):null`; the lab copy is guarded and commented.

---

## 11. WHAT THE SIM CANNOT ANSWER

- **The live Circle-1 death rate.** Sim 14.3%, live 60%. Sim fight 0 takes 3 strikes; live takes 9. Mechanism reproduces, magnitude does not. Circle-1 claims here are arithmetic.
- **The live bimodality.** The sim's baseline has 42.9% middle mass; live has 9%. The sim cannot demonstrate "this removes the bimodality" because it never had it.
- **The absolute win rate.** Sim baseline 5.03% against live 22.4% — a 4.5× policy gap concentrated in the deep game. **Read deltas between variants on identical code, never absolute numbers.**
- **Whether the late curve is right.** Fitted to sim output, and the sim cannot beat a boss the live bot beats routinely. The late entries — Lucifer especially — are the least trustworthy part of the recommendation.
- **Anything about a human.** `weak` is a random-card bot, `good` is a greedy one-ply scorer. The ratio is a lower bound on how much *play* skill matters and says nothing about draft or shop skill, which is where deckbuilding lives.
- **Per-deck and per-stake balance.** Bronze / Standard only.
- **Whether any of this is fun.** "Tense" is operationalised as "share of boss fights using the full strike allowance". That is a proxy.

---

## 12. SUGGESTED ORDER OF WORK

1. **Apply `00-FIX-e2e-parity-lucifer-exemption.patch`.** Unrelated live bug; the rig is blocked without it. Fix the `devils_wager` reduce in the same commit.
2. **Apply `04-v20c-hp-curve.patch` alone** — the curve, with overtime still on — and run the bot. Safe (it only makes the game easier: 45.7% in sim) and it de-risks the two biggest unknowns: whether live fight 0 comes down from 9 strikes, and how much deep-game output a real player actually has. **Then refit** with `fit-curve.mjs` against the bot's measured per-fight pass rates. Expect the late entries and Lucifer to move up.
3. **Then apply `00-RECOMMENDED-v1-v5-v6-v20c.patch`.** V1 must never ship without a refitted curve, Lucifer included.
4. **Add V8** if the drummer d6 is not doing narrative work you care about.
5. **Drop V9 and V11.**
6. **Instrument live amplification properly** (§9) — several balance decisions downstream of this document depend on a number that currently cannot be right.
7. **If skill expression is the goal, the next experiment is on the multiplier stack, not on boss HP** (§8).
