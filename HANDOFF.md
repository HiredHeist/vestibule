# VESTIBULE — AI Development Handoff Document
*Last updated: Sunday, March 22, 2026 — Session 12 end state*
*This is a living document. Update it at the end of every session.*

---

## 🎯 WHAT IS THIS PROJECT

**Vestibule** is a roguelite card game built in React/Vite. The player builds a metal band and fights through 9 circles of Hell (27 fights), playing RIFF/EMBER/CORRUPT/UTILITY cards to buff members and deal damage. Death is permanent. Target: Steam at $6.66.

Developer = "player" in dev sessions. Music producer, doom metal, lives in rural Japan. It's his game.

**Core loop:** Pick 2 members → Fight → Shop → Fight → Shop → Circle Boss → repeat × 9

---

## 🔧 TECHNICAL SETUP

### Repo
- **GitHub:** github.com/HiredHeist/vestibule (private)
- **PAT:** `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` (expires ~Jun 17 2026)
- **Dev server:** `cd vestibule && npm install && npm run dev` → http://localhost:5173/

### Stack
- React 18 + Vite (single file: `src/App.jsx` ~3500+ lines)
- `src/App.css` — animations and global styles
- No backend — pure client-side
- Claude in Chrome extension → localhost:5173 tab for live monitoring

### Dev Shortcuts
- **Shift+S** — jump to shop with 69 stash
- **Shift+D** — jump to death screen

### Live Log
```js
window.__devLog.map((e,i)=>`[${i+1}][${e.t}] ${e.msg}`).join('\n')
// Reset: window.__devLog = []
```

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire game ~3500 lines |
| `src/App.css` | Global styles + keyframes |
| `TODO.md` | Master task list — update on every push |
| `HANDOFF.md` | This file |
| `/home/claude/vestibule-sim.js` | Expert AI simulator v8.0 |

---

## 🎮 LATEST COMMIT STATE

**Latest commit:** `faa7cb5` (Session 12, March 22 2026)

### Shipped in Session 12:
1. ✅ **Mentor Link system** — full implementation
2. ✅ **Hoarder HP 480→300**
3. ✅ **Pack availability** — Touring from C2 (was C3), Demonic from C4 (was C5)
4. ✅ **Pack odds** — Touring: foil 25%/mythic 5%; Demonic: demonic 5%
5. ✅ **Controlled Feedback** — heals target member 50% maxHP on play
6. ✅ **Center shop member** — shows specific named member (Foil Bjorn etc)
7. ✅ **Score system** — full implementation on both death screens
8. ✅ **Grade tiers** — GARAGE BAND → LUCIFER SLAYER (win only)
9. ✅ **Personal best** — localStorage, shows NEW BEST or X pts away
10. ✅ **Daily streak** — 🔥 N DAY STREAK
11. ✅ **Run counter** — RUN #N on death screen
12. ✅ **Remaster bug fix** — `selected` added to applyCard dep array
13. ✅ **PostCSS fix** — @import moved to top of App.css
14. ✅ **Distortion** — +10%→+15% in game AND sim

---

## ⛓ MENTOR LINK SYSTEM (fully implemented)

Foil/mythic/demonic member placed **directly LEFT** of same-id basic = Mentor Link.

| Tier | ATK Bonus | HP Bonus | Strike Multiplier |
|------|-----------|----------|------------------|
| Foil ✨ | +1 ATK | +2 HP | ×1.5 |
| Mythic ✦ | +2 ATK | +4 HP | ×2.0 |
| Demonic ⛧ | +4 ATK | +8 HP | ×3.0 |

**Rules:**
- Stat bonus sticks permanently even if mentor dies
- Strike multiplier fires only when both alive AND in position
- Multiplier stacks with Overdrive and Double Time
- If mentor dies: multiplier pauses, 💔 shown, stats kept
- If mentor revived: bond + multiplier fully restore
- Visual: gold border + ⛓ pulse animation on both members

**Key functions:**
- `MENTOR_LINK_BONUS` — tier bonus constants (top of App.jsx)
- `scanMentorLinks(stageArr)` — detects + applies links
- `mentorLinkBonusDmg(stage, corruption)` — calculates bonus per strike
- Called on: fight start, stage swap, recruit join

---

## 🃏 SCORE SYSTEM (fully implemented)

### Formula:
```
score = (circleReached × 1000) + (fightsWon × 150) + (totalDamage ÷ 10)
      + (highestStrike × 5) + (stashEarned × 2) - (tooStonedEvents × 50)
      + (win bonus: 50,000)
```

### Grades:
| Score | Label | Color |
|-------|-------|-------|
| 0–499 | GARAGE BAND | grey |
| 500–999 | OPENING ACT | tan |
| 1,000–1,999 | LOCAL LEGEND | gold |
| 2,000–3,499 | TOURING ACT | blue |
| 3,500–5,999 | HEADLINER | purple |
| 6,000–9,999 | CULT LEGEND | red |
| Win only | ⛧ LUCIFER SLAYER | gold |

LUCIFER SLAYER = winning only, never by score alone.

### localStorage keys:
- `vst_runs` — total run count
- `vst_best` — personal best score
- `vst_lifetime` — cumulative lifetime score
- `vst_streak` — consecutive days played
- `vst_lastdate` — ISO date of last play

### TODO still needed:
- Beating Lucifer → unlocks Lucifer as playable member (stats TBD)
- Share score button (copy to clipboard)
- Online leaderboard (P3)

---

## 🎴 PACK SYSTEM

| Circle | Pack | Foil% | Mythic% | Demonic% | Cost |
|--------|------|-------|---------|----------|------|
| C1 | Garage Band only | 0% | 0% | 0% | 10🌿 |
| C2–C3 | Garage OR Touring 50/50 | 0–25% | 0–5% | 0% | 10/22🌿 |
| C4+ | All three (random) | 0–25% | 0–15% | 0–5% | 10/22/40🌿 |

Touring from C2 allows Mentor Link before C4 Hoarder wall.

---

## 📊 SIM DATA (v8.0, 5000 games, Mar 22 2026)

```
node vestibule-sim.js 5000    # from /home/claude
node vestibule-sim.js 200000  # thorough run
```

### Latest results:
- Lucifer wins: 0 (0%)
- Avg fight reached: 9.93 / 26
- C4 Greed deaths: 96.9%
  - F09 Miser: 25.2% die here
  - F10 Hoarder: 41.4% die here (was 67% before HP cut — big improvement)
  - F11 Usurer: 30.4% die here ← NEW WALL
- C5+: 0% survival

### Usurer (F11, 680HP) is now the wall. Likely needs HP cut to ~420 before C5 becomes reachable.

### Sim v8.0 includes:
- Hoarder 300, Touring C2, Demonic C4, odds updated
- Multi-candidate packs (2/3/4 candidates, picks best)
- Mentor Link aware (60% chance to pick linkable member)
- Distortion +15%, CF heal, Remaster Option C
- Amp Overload costs 1 discard
- Starting stash 3

---

## 🔴 CURRENT P1 PRIORITIES

1. **Usurer HP cut** — 680→~420. It's the new wall (30% die here)
2. **Re-sim after cut** — find next wall, repeat until C5 reachable
3. **Lucifer phase system** — 3 phases of 140,222 HP with different passives. Same total. More epic. DISCUSS before implementing.
4. **Target:** ~6.66% Lucifer win rate
5. **Score display verification** — Shift+D uses dummy stats so score shows 0. Need real playtest to confirm both death screens render score correctly.
6. **Share score button** — copy formatted string to clipboard

---

## 🏆 P2 PRIORITIES

- Unlock milestone teaser on death screen
- Lifetime milestone unlocks:
  - 1,000 pts → Loki unlocked
  - 3,000 pts → Vitalik unlocked
  - 5,000 pts → bonus artifact slot
  - 10,000 pts → A11–A20 artifact set
  - 25,000 pts → Lucifer's Guitarist (demonic tier)
  - Beat Lucifer → LUCIFER SLAYER grade + Lucifer member (broken stats TBD)
- Daily challenge: seed banner on Opening Night, lock first attempt score
- Card balance: Signal Decay rework, Roadie (1→2 strike immunity), Séance cost 2→1
- Circle complete flash screen (2 sec "⛧ CIRCLE I CLEARED ⛧")
- Lucifer boss intro cinematic

---

## ⚙️ GAME CONSTANTS

```
MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6
MAX_STASH: 420 | MAX_EMBERS_CAP: 8
Starting embers: 5 | Starting stash: 3
Fights: 27 (index 0-26) | 420 is sacred, never change card height
Circle boss every 3rd fight → +1 max ember permanently
```

### Enemy HP (current):
```
Wanderer 27 → Lost Soul 42 → Drifter 69 → Siren 60 → Tempter 90 → Seducer 140
Glutton 80 → Feaster 110 → Devourer 160 → Miser 260 → Hoarder 300 → Usurer 680 ← WALL
Wrathful 800 → Berserker 1040 → Warlord 1520 → Heretic 1650 → Apostate 2175
False Prophet 3000 → Brute 3000 → Hunter 4000 → Executioner 5500
Trickster 5200 → Deceiver 6800 → Archfraud 9600 → Traitor 9000 → Betrayer 11400
LUCIFER 420,666
```

---

## 🎸 ALL MEMBERS

| ID | Name | Role | ATK | HP | Keyword |
|----|------|------|-----|----|---------|
| bjorn | Bjorn | Lead Guitarist | 5 | 6 | FRENZIED |
| ragnar | Ragnar | Lead Guitarist | 4 | 7 | FRENZIED |
| thor | Thor | Drummer | 0 | 8 | DOUBLE TIME |
| ingrid | Ingrid | Bass Player | 3 | 10 | ANCHOR |
| loki | Loki | Synth Player | 3 | 6 | CORRUPT |
| nott | Nott | Vocalist | 2 | 7 | DEBUFF |
| dag | Dag | Bass Player | 2 | 12 | ANCHOR |
| vitalik | Vitalik | Dark Minstrel | 6 | 9 | FOLK MAGIC |
| sigrid | Sigrid | Rhythm Guitarist | 3 | 8 | SHREDDER |
| gunnar | Gunnar | Rhythm Guitarist | 4 | 7 | SHREDDER |
| astrid | Astrid | Vocalist | 3 | 8 | DEBUFF |
| freya | Freya | Synth Player | 4 | 5 | CORRUPT |
| ulf | Ulf | Bass Player | 4 | 9 | ANCHOR |
| brynja | Brynja | Bass Player | 1 | 14 | ANCHOR |
| rolf | Rolf | Drummer | 1 | 9 | DOUBLE TIME |
| orm | Orm | Dark Minstrel | 2 | 11 | HEXED |

**Keywords:**
- FRENZIED — +1 ATK permanently each boss kill
- DOUBLE TIME — d6 each fight: 5-6=×2, 3-4=×1.5, 1-2=×0.5
- ANCHOR — heals adjacent members +1 HP after every Strike
- CORRUPT — ATK = atk + floor(corruption/15)
- DEBUFF — each Strike permanently reduces boss dmg by 2
- FOLK MAGIC — 20% chance to refund ALL embers each Strike
- SHREDDER — first RIFF each Strike costs 1 less ember
- HEXED — each Strike +5% corruption, +1 ATK per 10% corruption

---

## 🃏 ALL CARDS (IDs)

**IMPORTANT: Resonance card id = `'resonancecard'` not `'resonance'`**

Common: `amp` `battlecry` `crowdsurf` `soundcheck` `sigdecay` `dialtoeleven` `roadie` `setlist` `groupie` `demotape` `distortion` `staticcharge` `powertap`

Uncommon: `newstrings` `encore` `wakeup` `feedbackloop` `tappedout` `controlfeedback` `burnset` `soundwall` `doubledown` `deathriff` `ampoverload` `ampstatic` `seance` `soundboard` `setbreak` `heavyriff` `herbmoney` `darktuning`

Rare: `stagedive` `overdrive` `infencore` `remaster` `sabbathsigil` `possessedperf` `goingbroke` `resonancecard`

---

## ⚠️ CRITICAL CODE GOTCHAS

1. **React Strict Mode double-fire** — NEVER put addLog/addFloat inside `setX(prev => ...)`. Always outside.
2. **Apostrophes in strings** — use `could not` not `couldn't` in taglines/JS strings.
3. **`resonancecard` not `resonance`** — always check actual id field.
4. **Named React imports** — file uses `useState`/`useEffect` NOT `React.useState`. `React.x` = "React is not defined" error.
5. **`selected` in applyCard deps** — `selected` MUST be in applyCard useCallback dep array. Remaster depends on this.
6. **`@import` first in CSS** — must be very first line in App.css or PostCSS errors.
7. **Chrome tab** — extension monitors ONE tab only. Always use the watched tab.
8. **scoreCard vs applyCardSim** — two separate switch statements in sim. `scoreCard` returns score value. `applyCardSim` mutates state.
9. **Python patch assertions** — always `assert old in src` before replacing. Failure = script exits without writing file.

---

## 📝 SESSION HISTORY

| Session | Date | Key Achievements |
|---------|------|-----------------|
| 1–5 | Feb 2026 | Core game built |
| 6 | Feb 2026 | Shop UI, pawn shop, booster packs |
| 7 | Feb 2026 | AI sim, economy rebalance |
| 8 | Feb 2026 | Death screens, Hellquake, Fire & Recruit |
| 9 | Mar 2026 | 13 bugs fixed, balance pass |
| 10 | Mar 21 | Batch 1–3: sold state, death screens, hand over-cap, Setlist, Remaster, Amp Overload |
| 11 | Mar 22 | 9 double-fire bugs, Demo Tape, Distortion +15%, Batch A, HANDOFF created |
| 12 | Mar 22 | Mentor Link, Hoarder cut, pack odds, score system, grades, personal best, daily streak, sim v8.0 |

---

*Update this at end of every session. Paste HANDOFF.md + TODO.md into new chat to continue seamlessly.*
