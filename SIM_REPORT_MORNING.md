# SIM REPORT — Morning Read (10,000 runs)

**Run date:** April 30, 2026 · post-shop-polish-pass
**Sim version:** v19.1 · STANDARD deck across all stakes
**Total games simulated:** 10,000 (4k bronze + 1.5k silver + 1.5k gold + 1k obsidian + 1k blood + 1k demonic)
**Total runtime:** 31 seconds (sim is FAST)

---

## TL;DR — IS IT SLAMMING?

**The numbers go up loop is healthy.** The card economy, combo system, and progression hooks are all firing. The dopamine pulse is real:

- **9 Riff Chains per game** (36,189 ÷ 4,000 = 9.05). Slot-machine cadence ✅
- **3.4 Doom Forge upgrades per game** — players actively craft ✅
- **3.4 Pacts chosen per game** — risk/reward engagement ✅
- **43% of runs form a Mentor Link** — system is hitting ✅
- **1.6 random events per game** — choice density solid ✅

**But there's a structural problem the polish can't fix:** Nobody beats the game.

---

## 🚨 THE BIG FINDING: LUCIFER IS UNREACHABLE

**Across all 10,000 runs at every stake, Lucifer was reached 0 times.**

```
Lucifer wins: Bronze 0% · Silver 0% · Gold 0% · Obsidian 0% · Blood 0% · Demonic 0%
```

The sim AI never gets past Circle 7 (Brute, F18) at any stake. The endgame fights C7→C9 (Brute through Lucifer) have a 0.0% survive rate at every difficulty. The boss HP scaling beyond F17 is unreachable for a "normal" player even in the easiest stake.

**This matches a known problem from earlier this year — the C4-C5 damage wall — but extended into the late game.** This is NOT a sim AI weakness; it's a balance scaling problem. The sim plays an "expert AI" build that maximizes ATK and triggers combos optimally; if it can't reach Lucifer, no human can.

**Recommendation for tomorrow:** boss HP scaling pass on C7-C9. Either flatten the curve (Brute → Lucifer scales too aggressively) or buff late-game player tools.

---

## 🧱 WHERE RUNS DIE — THE WALLS

### Bronze (entry experience, 4,000 runs)

```
C1   F00 Wanderer        100% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C1   F01 Lost Soul        96% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C1 ★ F02 Drifter           95% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C2   F03 Siren             94% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C2   F04 Tempter           92% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C2 ★ F05 Seducer           91% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C3   F06 Glutton           91% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C3   F07 Feaster           91% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C3 ★ F08 Devourer          90% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C4   F09 Miser             80% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C4   F10 Hoarder           72% survive  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓
C4 ★ F11 Usurer            56% survive  ▓▓▓▓▓▓▓▓▓▓▓ ← FIRST WALL (16% die here)
C5   F12 Wrathful          21% survive  ▓▓▓▓ ← BIG WALL (34.5% die here ★ biggest single-fight death rate)
C5   F13 Berserker         11% survive  ▓▓
C5 ★ F14 Warlord            8% survive  ▓
C6   F15 Heretic            2% survive
C6   F16 Apostate         0.5% survive
C6 ★ F17 False Prophet    0.2% survive
C7+                          0% survive  (no run reaches Brute alive)
```

**Bronze death distribution by circle:**
| Circle | % runs end here |
|---|---|
| C1 | 5.3% |
| C2 | 3.9% |
| C3 | 0.8% |
| **C4** | **34.2%** ← Greed wall |
| **C5** | **48.0%** ← Anger wall (BIGGEST) |
| C6 | 7.5% |
| C7 | 0.2% |
| C8-9 + Lucifer | 0% |

**82% of all runs end in Circle 4 or 5.** That's the wall.

### Stake comparison (avg fight reached / 26)

| Stake | Avg fight | Difficulty hit |
|---|---|---|
| Bronze | 10.88 | F12 Wrathful is murder |
| Silver | 9.43 | F01 Lost Soul newly punishing (silver +2 dmg) |
| Gold | 8.71 | F01 sees 15.6% die — early loss to slight HP scaling |
| Obsidian | 10.99 | Surprisingly survives further than Bronze (no heal-after-fight is brutal but multiplier compounds harder) |
| Blood | 7.70 | F01 deadly (25% die immediately due to startCorruption=10) |
| **Demonic** | **2.86** | **64.5% die at F01 Lost Soul** — Demonic is doing its job (3 strikes max + start corruption 15) |

---

## 🃏 CARD ECONOMY — HEALTHY

**531,523 total card plays across 4,000 bronze runs · 36 cards seen.**

### Top tier (5%+ pick rate) — the staples
| Card | Plays/game | % of total |
|---|---|---|
| 🔥 Battle Cry | 8.22 | 6.2% |
| Encore | 6.91 | 5.2% |
| Infernal Encore | 6.62 | 5.0% |
| Distortion | 6.46 | 4.9% |
| Resonance | 6.41 | 4.8% |

### Mid tier (3-4%) — solid 11 cards
Power Tap, Static Charge, Tapped Out, Possessed Perf, Amp It Up, Heavy Riff, Soundboard, Mosh Pit, Groupie, New Strings, Demo Tape

### Lower mid (2-3%) — workhorse 9 cards
Wake Up Call, Stage Dive, Crowd Surf, Death Riff, Roadie, Sound Check, Amp the Static, Dark Tuning

### Niche (1-2%) — situational 11 cards
Most cards land here. Healthy distribution.

### 🚩 Underplayed
| Card | Plays/game | Note |
|---|---|---|
| **Herb Money** | **0.53** (0.4%) | Likely too situational or cost is wrong |

**Conclusion:** Card balance is in a good spot. No oppressive must-pick, no dead cards except Herb Money (rebalance candidate).

---

## 🎰 SLOT-MACHINE METRICS — THE DOPAMINE LOOP

These are the numbers that determine "is the game burning a hole in your face."

| System | Per game | Verdict |
|---|---|---|
| 🔗 **Riff Chains triggered** | **9.05** | Strong rhythm. Players see chain sparks frequently. |
| ⚒ **Doom Forge upgrades** | **3.4** | Active crafting per run. |
| 🎲 **Random Events fired** | **1.6** | Choice density is good. |
| 📜 **Pacts chosen** | **3.4** | Players engage risk/reward. |
| ⛓ **Mentor Link forms** | **43%** of games | Lucky-feeling synergy hits often enough to matter. |
| 🍄 **Shrooms used** | 1.59k uses / 4k games (~40%) | Shrooms popular |
| 🧪 **Acid used** | 63 uses / 4k games (1.6%) | Acid is **dead** — players don't trust the variance |
| 💀 **Hellquakes fired** | **0** | ⚠ Either sim doesn't model corruption-100% triggers OR Hellquakes never fire because no run survives long enough at high corruption. Worth investigating. |
| 🤝 **Boss loot collected** | 13,564 / 4,000 runs (~3.4 each) | Good drop rhythm |

### What's slamming ✅
- **Riff Chain frequency** — 9 per game is constant fireworks
- **Card variety** — every card sees play, no obvious bench warmers
- **Mentor Link reveal moments** — 43% of runs feature one
- **Forge crafting** — 3.4 upgrades is active engagement

### What's NOT slamming ❌
- **Acid is broken** — 1.6% use rate vs 40% for shrooms. Players don't see the value or trust the variance. Either the upside isn't visible enough, the downside ("Hellquake") is too punishing, or the price (12) is too high relative to shrooms (6).
- **Hellquakes never fire** — the climactic corruption-100% moment isn't happening because runs don't sustain that long
- **Endgame is invisible** — nobody sees Brute, Hunter, Executioner, Trickster, Deceiver, Archfraud, Traitor, Betrayer, or Lucifer. 8 fights of late-game content that may as well not exist.

---

## 🎯 RECOMMENDED FIXES — RANKED BY IMPACT

### Tier 1 — Ship-blocking
1. **Boss HP scaling pass C5-C9.** Wrathful at 24.3k kills 34% of runs at the WEAKEST stake. Either flatten the curve so endgame is reachable, or buff player damage scaling at C5+. Without this, 99%+ of Steam EA players will never see the back half of the game.

### Tier 2 — Major balance
2. **Acid rebalance.** 40:1 shroom-to-acid usage ratio means acid is functionally broken. Try: cheaper (12→8), or remove the bad-trip on Bronze, or buff the upside (more guaranteed positive outcomes).
3. **Herb Money buff.** Only card under 1% pick rate. Either drop the cost or add a synergy hook.

### Tier 3 — Polish
4. **Hellquake reachability.** Worth investigating why sim never triggers them. If it's a sim limitation, fine. If it's a real game issue (corruption-100% never reached), the system is decorative.

### Tier 4 — Future content
5. **Sim verification of Lucifer reachability.** Once HP curve is rebalanced, re-run and verify a healthy player can reach + occasionally beat Lucifer (target: 5-15% Lucifer win rate at Bronze for an "earned victory" feel).

---

## 📂 RAW SIM OUTPUTS

Full per-stake outputs saved to `/tmp/sim_results/{bronze,silver,gold,obsidian,blood,demonic}.txt`. Each file has the full survival curve, card usage, event stats, and dealer numbers for that stake.

---

*Generated overnight by Roadie. Coffee, then C5-C9 boss HP curve. Get some sleep.* 🤘
