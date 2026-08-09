# FINAL GAMEPLAY AUDIT — Vestibule (pre-early-access)
*Aug 6 2026 · veteran (PLANNER=1) bot, blinds ON (shipping state) · ~3,600–4,000 games pooled per deck across 2 independent batches (MCP shell caps runs ~178s, so I pooled 2000-game batches rather than single 10k runs — same statistical power, two estimates per deck for variance). Automated bug-hunt Stage 1 gates + full code audit of tonight's changes.*

## VERDICT: ship-healthy. No Critical or High bugs. Two Medium "could-be-better" signals, a handful of Low polish items.

---

## 1. GATE CHECKS (all pass)
- **Design-rules gate** (`npm run check`): CLEAN — font floor ≥13px, ScratchFont ≥20pt, palette colors, all clean.
- **cardEngine self-test**: PASS **86/86**.
- **Anomaly scan** (sim output): **zero** NaN / undefined / Infinity / negative-HP / impossible win-rates.
- **Card parity rig**: idle (localhost:9222 not up) → parity is "last-known", not a regression. Re-run `bash e2e/up.sh` before ship to reconfirm.
- **Code audit of tonight's changes**: scope-clean. `clutchFlash` state exists (cinematic strike reuses it safely), `startHp` in scope at the cinematic block, DISSONANCE/DIRGE present + parity-matched in sim *and* live `getEffectiveAtk`, and **no new App-level state added** → no RESET-REGISTRY gaps.

## 2. BALANCE — all 5 decks in band, tight variance
Veteran win %, blinds on (two batches each, then averaged):

| Deck | Batch A | Batch B | **Avg** | strikes/fight | one-shot % |
|---|---|---|---|---|---|
| Standard | 9.00 | 8.85 | **8.93%** | 3.19 | 33.6 |
| Shredder | 11.50 | 10.45 | **10.98%** | 3.12 | 35.6 |
| Ritualist | 11.45 | 10.19 | **10.82%** | 3.10 | 30.9 |
| Engineer | 9.00 | 8.31 | **8.66%** | 2.80 | **47.8** |
| Survivor | 9.44 | 8.78 | **9.11%** | 3.45 | 27.5 |

Batch-to-batch spread is ~0.5–1.0% (pure sampling noise). The spread *across* decks is 8.7–11.0% — exactly the 8–11% target. **Balance is locked.**

## 3. ROSTER — the even-pick goal holds at scale
Every deck: **all 16 members picked 26–31%.** No auto-includes, no dead members — including the two drummers (fixed tonight) and the three re-worked members (DISSONANCE Freya/Loki, DIRGE Orm), which all land mid-pack. DIRGE correctly scales with how many cards a deck churns (Orm: 375 dmg/fight on Ritualist, 277 Standard, 86 Engineer). The roster rebalance is confirmed solid.

---

## 4. FINDINGS — things that feel wrong or could improve

### 🟡 MEDIUM-1: Ritualist & Survivor still "cruise then cliff" at Lucifer
Death distribution shows the blinds successfully spread deaths for **Standard / Shredder / Engineer** (each has a real Circle-3 *Devourer* wall ~17–19% plus Lucifer), but **Ritualist and Survivor have only ONE wall — Lucifer, at 44% and 47% of deaths.** Those two decks shrug off the early-mid blinds (corruption burst / outlast tankiness), so their mid-game has little tension and everything funnels to the final boss.
*Why it matters:* the whole point of blinds was tension the whole way down; two of five decks still lack a mid-game wall.
*Possible fixes (not urgent):* give the harsh-tier blinds (Silence / Deadline) a bit more bite specifically vs tanky/burst comps; or add a Circle-5/6 mini-wall; or a small always-on scaling that these two archetypes can't fully ignore. Worth a design pass, not a pre-ship blocker.

### 🟡 MEDIUM-2: The drug dealer isn't actually a gamble
Confirmed at scale across every deck: **~90% "good" outcomes** (e.g. Standard 6,455 good / 337 bad / 327 bunk). A risk with a 90% payoff is strictly-correct "always buy," not a decision or a hype moment.
*Fix:* widen the outcome spread (bigger highs, real lows) so the dealer becomes a genuine risk/reward beat. Small, isolated change; also a dopamine win (see FUN_DOPAMINE_PLAN #10).

### 🟢 LOW-1: Engineer is feast-or-famine (likely a feature, worth a glance)
Highest one-shot rate by far (**47.8%** vs ~33% elsewhere), lowest strikes/fight (2.80), and it fires the fewest riff-chains (~0.7/game) because it wins through copy/multiplier cards, not chains. It also has three walls with Lucifer at only 15.9%. This reads as intentional combo-deck identity ("assemble the engine, then delete a boss"), but it's the most "solved-feeling" deck when it pops. Flagging so it's a conscious choice, not an accident.

### 🟢 LOW-2: ~6 genuinely weak cards (revision candidates, not bugs)
Weak in *every* deck they can appear in (not just deck-locked): **Record Deal** (~0.01–0.03/g), **Riff Barrage/tremolopick**, **Sabbath Sigil**, **ampfeedback**, **setlistrewrite**, **slowburn**, and Ritualist's **carrioncall** (0.39/g). No *new* dead cards were introduced by tonight's changes — this is the same pre-existing list. Candidates for a buff-or-cut pass.

### 🟢 LOW-3: Inert corruption hooks (cleanup)
After making the CORRUPT/HEXED members universal, the "100% corruption buffs CORRUPT members" possession payoff and the HEXED corruption-pump are now dead code paths (no member carries those keywords). Harmless, but they're a dangling reward you could repurpose (e.g. a high-corruption DISSONANCE/DIRGE bonus on Ritualist).

### ✅ Fixed during the audit
- Removed the misleading `Genre activations: 0` sim readout + stale Genre TODO (the "Genre bug" was vestigial dead code from a removed system — no gameplay impact).

---

## ✅ DECISIONS (Aug 6 pm — gameplay locked for early access)
- **Medium-2 (dealer): FIXED + shipped.** Bad-trip 5%→20% (0.25 Demonic), bunk stays removed. Economy now ~79% good / ~21% bad (was ~90%); a real gamble. Win rate held (Standard 9.4%). Sim+live synced.
- **Medium-1 (cruise-cliff): DEFERRED** to a focused post-UI balance pass. Correct fix is targeted anti-cruise blinds (No-Heals vs Survivor sustain, Entropy vs Ritualist corruption), NOT a global enrage (all decks average ~3 strikes, so enrage wouldn't isolate the two decks). Non-blocking.
- **LOW-1 (Engineer): no change** — intended combo-deck identity, in band.
- **LOW-2 (weak cards): DEFERRED** to the same post-UI balance pass.
- **LOW-3 (inert hooks): left as harmless** dead code; future repurpose opportunity.
- **Genre readout/TODO: removed.**

**Gameplay is locked. Next: UI cleanup pass.**

## 5. RECOMMENDATION
Nothing here blocks early access. If you want to spend a little polish time before shipping, the two highest-value gameplay tweaks are **Medium-2 (make the dealer a real gamble — quick + also a dopamine win)** and **Medium-1 (give Ritualist/Survivor a mid-game wall — a small design pass)**. Everything else (weak-card pass, Engineer swinginess, inert-hook cleanup) is safe to defer to post-launch. Then the roster and balance are locked and it's clear to move to the UI polish pass.
