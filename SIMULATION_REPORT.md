# VESTIBULE — Simulation Report
*Last updated: Session 12, March 22, 2026 — Sim v8.0, 5,000 games*

---

## LATEST RUN (v8.0, 5000 games, March 22 2026)

| Metric | Value |
|--------|-------|
| Total games | 5,000 |
| Lucifer wins | 0 (0.000%) |
| Avg fight reached | 9.93 / 26 |
| C4 Greed deaths | 96.9% |

### Survival Curve (current):
```
F09 The Miser:   71.8% survive  (25.2% die here)
F10 The Hoarder: 30.4% survive  (41.4% die here) ← was 0% before HP cut!
F11 The Usurer:   0.0% survive  (30.4% die here) ← CURRENT WALL
F12+:             0.0% survive
```

### Key changes since last sim (800k run, March 21):
- Hoarder HP 480 → 300: **F10 now has 30.4% survival** (was 0%)
- Mentor Link system added: tiered members provide ATK/HP bonus + strike multiplier
- Pack availability updated: Touring from C2, Demonic from C4
- Distortion +15% (was +10%)

---

## PREVIOUS RUN (800k games, March 21 2026)

| Metric | Value |
|--------|-------|
| Lucifer wins | 0 (0.000%) |
| Avg fight reached | 8.13 / 26 |
| C4 deaths | 73.4% |

F10 Hoarder: **0% survival** (was the instant death wall — now fixed)

---

## CURRENT STATUS

### The wall: Usurer (F11, 680 HP)
30% of all runs now reach the Usurer but 0% survive it.
**Recommended fix: Usurer HP 680 → 420**

### After Usurer fix, expect next wall at:
- F12 Wrathful (800 HP) or F14 Warlord (1520 HP)
- Will need re-sim to confirm

### Damage scaling math:
A typical band at C4 has ~18–25 combined ATK.
Over 4 strikes + cards: ~100–150 damage.
With one active Mentor Link (×1.5 foil): ~150–225 damage.
With Overdrive + Double Time + Mentor Link: ~400–600 possible.
Usurer at 680 HP is still just out of reach without strong RNG.

### Sim version: v8.0
Run command: `node vestibule-sim.js 5000` (from /home/claude)

Includes:
- Hoarder 300 ✅
- Touring from C2, Demonic from C4 ✅
- Multi-candidate packs (2/3/4, picks best) ✅
- Mentor Link aware (60% chance to pick linkable member) ✅
- Distortion +15% ✅
- Controlled Feedback heals most-injured member ✅
- Remaster Option C ✅
- Amp Overload costs 1 discard ✅

---

## WHAT THE SIM DOES

The simulator runs N full games with an expert AI player:
- Expert card play (phases: emergency embers → combo setup → damage)
- Smart shop decisions (prioritises band fill, then artifacts/passives/cards)
- Mentor Link aware (buys tiered members that match existing stage members)
- ANCHOR positioning (always centres anchors for maximum heal coverage)
- Outputs: fight survival curve, death distribution, starting pair win rates

---

## BALANCE RECOMMENDATIONS (pending re-sim)

| Enemy | Current HP | Recommended | Status |
|-------|-----------|-------------|--------|
| Hoarder | 300 | ✅ done | Fixed Session 12 |
| Usurer | 680 | ~420 | **DO NEXT** |
| Wrathful | 800 | TBD after Usurer fix | |
| Warlord | 1520 | TBD | |
| Everything C5+ | varies | TBD | Nobody reaches yet |

Target win rate: ~6.66% (sacred number for Lucifer fight)
