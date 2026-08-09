# OVERNIGHT BRIEFING — Corruption Rework + Boss Blinds
*The major-change session. All work sim-verified with the VETERAN (planner) bot. Live App.jsx changes are mirrored + parse-clean but NOT build-verified in my sandbox — your `push-fixes.bat` build-gate confirms compile on push. Nothing is committed; the current good version is safe in git.*

---

## ☕ TL;DR
Two big changes shipped, both fixing things the veteran data proved were broken:
1. **Corruption is no longer the confusing default.** It's stripped from 4 of 5 decks entirely and reworked into a deliberate risk/reward *gamble* that lives only in the Ritualist deck. A beginner on Standard now never sees it.
2. **Boss blinds are live (Balatro-style).** Every circle boss rolls a random rule-changer, tiered gentle→harsh by depth. This fixes the "cruise then Lucifer cliff" — the skilled run is now tense the whole way down.

**Result:** every deck lands ~8–11% for the veteran *with blinds on*, and deaths spread across all 9 circles instead of piling on the final boss. `node --check` / Babel-parse clean on every file; cardEngine self-test 86/86.

**To ship it all: run `push-fixes.bat`.** (I fixed the file list — it was missing `App.css`.)

---

## 1. CORRUPTION REWORK (your B+C decisions)

**Isolated to Ritualist (Option C).** Standard / Shredder / Engineer / Survivor are now **100% corruption-free** — verified in-sim: on those decks the corruption trackers read **Whisper 0, Madness 0, Possession 0**. Corrupt cards *and* CORRUPT/HEXED keyword members are removed from those decks and their draft/recruit pools; freed slots refilled with on-theme non-corrupt cards (all decks still 69). A robust clamp forces corruption to 0 on clean decks from any source (enemy passives, relics, drug trips, pacts) so nothing leaks it in.

**Corruption is now a real gamble (your "make it a gamble" choice).** The multiplier was cut hard — **×1.10 / ×1.22 / ×1.40 / ×1.60** at 40/60/80/100% (was ×1.2 / ×1.5 / ×2.0 / ×3.0) — AND high corruption now **raises the boss damage you take** (`×(1 + 0.60·corr/100)`). So pushing corruption is a genuine bet, not free power.

**Simplified (your "keep hangover simplified" choice + declutter).**
- **Corruption GIFTS removed entirely** — the hidden system that auto-injected free corrupt cards at thresholds is gone.
- **Hangover simplified** to a single flat "+20% shop prices at 50%+" — deleted the stash-cut and member-HP-debuff tiers.
- **Red tint** now a subtle vignette only above 80% corruption.

**Ritualist stays the corruption archetype** (it keeps the full corrupt pool + its Corruption Feeds signature) — a deliberate "embrace the rot" deck for advanced players, unlocked 3rd.

## 2. BOSS BLINDS (Balatro-style)

Every **circle boss** (the 3rd fight of Circles 1–8; Lucifer excluded — he's already the endgame wall) rolls **one random blind** from a **depth-tiered pool**:
- **Gentle (C1–3):** Chains Muted, Feedback Wall
- **Medium (C4–6):** + Ember Drought, Deadline
- **Harsh (C7–8):** + Silence

The 5 blinds:
| Blind | Effect |
|---|---|
| ⛓ **Chains Muted** | Riff chains don't build multiplier this fight |
| 🧱 **Feedback Wall** | Boss shrugs off any single hit above 40% of its max HP (forces multiple strikes) |
| 🔇 **Silence** | Your highest-ATK member deals 0 this fight |
| ⏳ **Deadline** | One fewer Strike this fight |
| 💸 **Ember Drought** | Every card costs +1 ember this fight |

Chains-Muted and Feedback-Wall lead the early tiers because they punish the *engine* — which barely exists early (mild) but dominates late (harsh) — so they self-scale. Live it shows a **banner over the boss** ("⛓ BOSS BLIND — Chains Muted") + a combat-log line, and it **persists across save/reload**.

**Why blinds matter (from the veteran data):** without them, skilled players *cruised* Circles 1–8 (deaths <3%/circle) then lost 57–80% at Lucifer — a hollow mid-game and a cliff. Boss HP couldn't fix it (a multiplicative engine out-scales static HP). Rule-changing blinds create tension an engine *can't out-damage*.

---

## 3. THE DATA (veteran / planner bot — the skilled-human proxy)

### Veteran win %, WITH blinds (the shipping state), ~8–11% target
| Deck | Win % | Corruption |
|---|---|---|
| Standard | ~8.5% | 0 (clean) |
| Shredder | ~7.9% | 0 (clean) |
| Ritualist | ~9.7% | ACTIVE (the gamble deck) |
| Engineer | **8.9%** (rebalanced from 5.7% — see below) | 0 (clean) |
| Survivor | ~8.5% | 0 (clean) |

### The curve fix — deaths now spread across the descent (Standard, with blinds)
| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | Lucifer |
|---|---|---|---|---|---|---|---|---|
| 0.3% | 6.7% | 22% | 10.6% | 6.4% | 5.3% | 4.9% | 6.0% | **29%** |

Compare to BEFORE (no blinds): Circles 4–8 were all <3%, Lucifer was ~60%. Now C1 stays beginner-safe, every mid-circle has real teeth, and the Lucifer cliff is halved. That's the addictive "tense the whole way down" shape.

### Balance fixes made this session
- **Engineer was over-nerfed to 5.7%** by the corruption rework's Lucifer-HP tuning (it was the old 16% outlier). Eased its HP scaling (`hpScale 1.00→0.90`, `luciferScale 0.24→0.20`) in BOTH sim and live → **8.9%**, back in band.
- **Blind Armor cap** tuned 35%→40% (slightly gentler, less punishing on the harsh tier).
- **Herb Money revived** — dropped its 10-Stash cost (a terrible rate that made it dead); now a clean 1-ember +3 ATK. Play-rate jumped from ~0.3/g to 3–6/g across the 4 decks it's in, balance unaffected.

---

## 4. VERIFICATION / AUDIT
✅ `node --check` clean: sim, cardEngine.js, cards.js, flavor.js.
✅ Babel JSX parse clean: **App.jsx** (both the corruption mirror and the blinds port).
✅ cardEngine self-test: **86/86**. Sim `assertBossHpSync`: passes.
✅ Corruption isolation confirmed behaviorally (clean decks: 0 corruption of any kind).
✅ Blinds reset-registry entries confirmed (both `activeBlind` + `activeBlindRef` in `PER_FIGHT_RESETS`).
✅ Sim ↔ live HP knobs synced (Engineer values matched in both).

⚠️ **NEEDS YOU (can't do in my sandbox):**
- **`vite build` + a live playtest.** App.jsx is mirrored + parse-clean but not build-verified; `push-fixes.bat` build-gates it (won't commit if broken).
- **Live-bot / human pass** on: a circle boss per tier (banner shows, each blind bites), a Ritualist run (corruption gamble feels like a real decision), and a Standard run (confirm zero corruption anywhere).
- The `e2e/test-card-parity.cjs` needs the CDP browser (`bash e2e/up.sh`) — worth running to confirm sim↔live card parity before shipping.

---

## 5. WHAT'S DEFERRED (fully optional, noted for later)
- **GDD.md** still describes the old corruption model (CLAUDE.md + TODO.md updated; GDD not).
- Corruption-themed **relics/pacts** (Devil's Tuning Fork, corruption_engine, dark_bargain) can still be *offered* on clean decks — the clamp makes them harmless no-ops, but filtering them from clean-deck offer pools would be cleaner polish.
- The 2 strike-level synergy cards (Cult Following, One True Sound) and the "reduce auto-include staples" idea from GAMEPLAY_IMPROVEMENTS.md — I deliberately did NOT touch staples, since nerfing them would have unbalanced the freshly-tuned decks.
- Record Deal / Sabbath Sigil left as-is (dead by acquisition-gating, not weakness; both corrupt-type so they can't go in clean decks).

---

## 6. HOW TO SHIP
Run **`push-fixes.bat`**. It build-verifies, then commits + pushes: `App.jsx`, `App.css`, `cards.js`, `cardEngine.js`, `flavor.js`, the sim, and all docs. If the build is green, everything above ships. If it errors, paste it to me and I'll fix — the current good version stays safe until then.

The game went from "corruption accidentally happens and is always rewarded, and skilled runs are solved by Circle 3" to **"corruption is a deliberate Ritualist gamble, and every circle boss forces you to adapt."** That's a cleaner on-ramp for beginners and a tenser, more replayable descent for experts — exactly the brief.
