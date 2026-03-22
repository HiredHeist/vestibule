# VESTIBULE — Master Development Context
> Read this first. Every time. Without exception.
> *Last updated: Session 12, March 22, 2026*

---

## What This Is

**Vestibule** is a roguelite card game built in React/Vite. Stoner/psychedelic/occult/heavy metal theme. Norse band members descend through 9 circles of hell fighting increasingly powerful bosses. The player builds a band, plays cards to deal damage each Strike, manages Corruption and Embers, and buys upgrades in a shop between fights.

**The owner** is a music producer and musician living in rural Minamiyamashiro, Japan. He plays doom metal, industrial music, builds analog pedals, collects vinyl. The game is his passion project. He knows what he wants, has strong aesthetic opinions, and trusts you to make smart technical decisions independently. **Do not over-explain. Do not ask permission for obvious things. Just build it.**

**The vibe:** You are a collaborator who has spent sessions building this together. You know the codebase inside out. You have opinions. You push back when something is wrong. You celebrate when something is right. This is not a client relationship — it's a creative partnership.

---

## Repo & Setup

```
github.com/HiredHeist/vestibule  (private)
PAT: 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  (expires ~Jun 17 2026)
Dev: cd vestibule && npm install && npm run dev  →  http://localhost:5173/
Main file: src/App.jsx (~3500+ lines)
CSS: src/App.css
Sim: /home/claude/vestibule-sim.js (v8.0)
```

**Always verify brace/paren balance after scripted edits. Never push broken JSX.**
**Always assert old string exists before replacing. If assertion fails, script exits without writing.**
**Never use React.useState — file uses named imports: useState, useEffect, useCallback, useRef**

---

## Current Build State (Session 12 end)

**Latest commit:** `6cbf58b`  
**App.jsx:** ~3500+ lines  

### Fully working systems:
- Full 9-circle enemy progression (27 enemies, all with passives + death quotes)
- Complete card system (40+ unique cards)
- 16 band members (all active, none locked by default — unlock system TBD)
- Shop with scaling inventory, pawn shop, booster packs, circle artifacts
- **Mentor Link system** (foil/mythic/demonic left of same-id basic = bond + multiplier)
- **Score system** (count-up animation, grade tiers, personal best, daily streak, run counter)
- Artifacts A1–A10, Passives P1–P10
- DOUBLE TIME d6, HEXED corruption scaling, FOLK MAGIC ember refund
- Foil/Mythic/Demonic member tiers with visual glow + badges
- Two distinct death screens: Stoned to the Bone + Beaten by [Boss]
- Daily seed system
- localStorage: run count, personal best, lifetime score, daily streak

### What's next (P1 priority):
- **Usurer HP cut** (F11, 680HP is the wall — 30% die here after Hoarder fix)
- **Re-sim after each cut** to find next wall
- **Lucifer phase system** (3 phases × 140,222 HP, different passives — discuss first)
- **Score display playtest** — verify renders on real death screens (Shift+D uses dummy stats)
- **Share score button**

---

## Dev Shortcuts
- **Shift+S** — jump to shop with 69 stash
- **Shift+D** — jump to death screen (uses dummy stats — score shows 0 here, use real run to verify)

## Live Log
```js
window.__devLog.map((e,i)=>`[${i+1}][${e.t}] ${e.msg}`).join('\n')
// Reset: window.__devLog = []
```

---

## ⛓ MENTOR LINK SYSTEM (Session 12 — fully implemented)

Foil/mythic/demonic member placed **directly LEFT** of same-id basic = Mentor Link.

| Tier | ATK Bonus | HP Bonus | Strike Multiplier |
|------|-----------|----------|------------------|
| Foil ✨ | +1 ATK | +2 HP | ×1.5 |
| Mythic ✦ | +2 ATK | +4 HP | ×2.0 |
| Demonic ⛧ | +4 ATK | +8 HP | ×3.0 |

- Stat bonus sticks permanently even if mentor dies
- Strike multiplier fires only when both alive + in correct position
- Multiplier stacks with Overdrive and Double Time (path to Lucifer)
- Visual: gold border + ⛓ pulse on both. 💔 when mentor dead, bond restores on revival.
- Key functions: `MENTOR_LINK_BONUS`, `scanMentorLinks(stageArr)`, `mentorLinkBonusDmg(stage, corruption)`

---

## 🃏 SCORE SYSTEM (Session 12 — fully implemented)

```
score = (circleReached × 1000) + (fightsWon × 150) + (totalDamage ÷ 10)
      + (highestStrike × 5) + (stashEarned × 2) - (tooStonedEvents × 50)
      + (win bonus: 50,000)
```

Grades: GARAGE BAND → OPENING ACT → LOCAL LEGEND → TOURING ACT → HEADLINER → CULT LEGEND → ⛧ LUCIFER SLAYER (win only)

localStorage: `vst_runs`, `vst_best`, `vst_lifetime`, `vst_streak`, `vst_lastdate`

---

## Core Game Mechanics

### Embers 🔥
- Start at 5, max 8 (+1 per circle boss kill). Reset to max each Strike. Cards cost embers.

### Corruption 🌀
- 0–100%. CORRUPT cards, HEXED keyword raise it. At 100% Hellquake fires.
- Corruption Dividend: 69%+ on victory = +3 bonus stash.

### Stash 🌿
- Currency. Cap: **420** (sacred number — never change).
- Earns per fight win, scales by circle. Spent in shop.

### Too Stoned
- Member HP → 0 = Too Stoned (tilted, can't fight).
- All Too Stoned = run over: "Stoned to the Bone" screen.

### Strikes
- 4 Strikes per fight. Play cards each Strike, then attack.
- 4 Discards per fight.

---

## Keywords (all 8)

| Keyword | Effect |
|---------|--------|
| FRENZIED | +1 ATK permanently per boss kill |
| DOUBLE TIME | d6 per fight: 1-2=×0.5, 3-4=×1.5, 5-6=×2 |
| ANCHOR | Heals adjacent members +1 HP after each Strike |
| CORRUPT | ATK = base + floor(corruption/15) |
| DEBUFF | -2 boss damage per Strike (stacks permanently in fight) |
| FOLK MAGIC | 20% chance per Strike to refund ALL embers spent |
| SHREDDER | First RIFF each Strike costs 1 less ember |
| HEXED | +5% corruption per Strike, +1 ATK per 10% corruption |

---

## All Members

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

---

## All Cards (IDs — IMPORTANT)

**`resonancecard`** not `resonance` — always use the actual id.

Common: `amp` `battlecry` `crowdsurf` `soundcheck` `sigdecay` `dialtoeleven` `roadie` `setlist` `groupie` `demotape` `distortion` `staticcharge` `powertap`

Uncommon: `newstrings` `encore` `wakeup` `feedbackloop` `tappedout` `controlfeedback` `burnset` `soundwall` `doubledown` `deathriff` `ampoverload` `ampstatic` `seance` `soundboard` `setbreak` `heavyriff` `herbmoney` `darktuning`

Rare: `stagedive` `overdrive` `infencore` `remaster` `sabbathsigil` `possessedperf` `goingbroke` `resonancecard`

### Key card notes (Session 12 updates):
- `distortion` — +15% corruption (was +10%), embers: 0
- `wakeup` — embers: 0 (was 2)
- `groupie` — embers: 0 (was 2)
- `ampoverload` — embers: 0, costs 1 discard (unplayable at 0 discards)
- `controlfeedback` — set corruption to 50% AND heal target member 50% maxHP
- `remaster` — select 1 card in hand, delete it, draw 3 (Option C)

---

## Recruitment Packs (Session 12 update)

| Circle | Pack | Foil% | Mythic% | Demonic% | Cost |
|--------|------|-------|---------|----------|------|
| C1 | Garage Band only | 0% | 0% | 0% | 10🌿 |
| C2–C3 | Garage OR Touring 50/50 | 0–25% | 0–5% | 0% | 10/22🌿 |
| C4+ | All three random | 0–25% | 0–15% | 0–5% | 10/22/40🌿 |

Touring from C2 (not C3) enables Mentor Link setup before the Hoarder wall.

---

## Artifacts A1–A10

| ID | Name | Cost | Effect |
|----|------|------|--------|
| a1 | Vintage Guitar | 10🌿 | Lead guitarist +1 ATK fight start |
| a2 | Devil's Tuning Fork | 8🌿 | Start at 15% corruption |
| a3 | The Evil Eye | 20🌿 | First card each Strike free |
| a4 | Roadie's Toolbelt | 12🌿 | Random member Stone Shield fight start |
| a6 | Black Candle | 14🌿 | Too Stoned event → 8 damage to boss |
| a7 | Serpent's Kiss | 15🌿 | Permanent +1 max ember |
| a8 | Stone Tablet | 18🌿 | All members +3 max HP |
| a10 | Burning Stage | 16🌿 | Win in 1 Strike → +5 embers next fight |

Circle Artifacts: `ca1` Goat of Mendes (all +1 ATK), `ca2` Hellfire Amulet (+2 max embers), `ca3` Sabbath Crown (Too Stoned revive 50% HP), `ca4` Wailing Guitar (first Strike ×2)

---

## Passives P1–P10

| ID | Name | Effect |
|----|------|--------|
| p1 | Power Chord | All band ATK +1 |
| p2 | Roadie Crew | All members +2 HP fight start |
| p3 | Merch Table | +2 stash per fight win |
| p4 | Feedback Hum | -3 stash → +1 corruption start |
| p5 | Amp Stack | Sound Wall +4 damage |
| p6 | Cult Following | +3 stash when member Too Stoned |
| p7 | Guitar Tech | Foil cards -1 ember |
| p8 | Green Room | All members +5 HP between fights |
| p9 | Heavy Rotation | Start each fight with Amp It Up in hand |
| p10 | Stage Fright Reversal | First Strike +10 bonus damage |

---

## All Enemies + Current HP

```
F00 Wanderer      27  | F01 Lost Soul    42  | F02 Drifter     69
F03 Siren         60  | F04 Tempter      90  | F05 Seducer    140
F06 Glutton       80  | F07 Feaster     110  | F08 Devourer   160
F09 Miser        260  | F10 Hoarder     300  | F11 Usurer     680  ← CURRENT WALL
F12 Wrathful     800  | F13 Berserker  1040  | F14 Warlord   1520
F15 Heretic     1650  | F16 Apostate   2175  | F17 False Prophet 3000
F18 Brute       3000  | F19 Hunter     4000  | F20 Executioner 5500
F21 Trickster   5200  | F22 Deceiver   6800  | F23 Archfraud  9600
F24 Traitor     9000  | F25 Betrayer  11400  | F26 LUCIFER  420,666
```

---

## Simulation

```bash
cd /home/claude && node vestibule-sim.js 5000    # quick
cd /home/claude && node vestibule-sim.js 200000  # thorough
```

**v8.0 latest results (5000 games):**
- 0% Lucifer wins
- Avg fight: 9.93/26
- F10 Hoarder: 30.4% survive (was 0% before HP cut)
- F11 Usurer: 0% survive ← CURRENT WALL
- Next step: cut Usurer HP to ~420, re-sim

---

## Critical Gotchas

1. **React Strict Mode double-fire** — NEVER put addLog/addFloat inside `setX(prev => ...)`. Always outside.
2. **Named imports only** — `useState` not `React.useState`. `React.x` = immediate crash.
3. **`selected` in applyCard deps** — MUST be in useCallback dep array. Remaster depends on it.
4. **`resonancecard` not `resonance`** — always check actual id field.
5. **Apostrophes** — use `could not` not `couldn't` in JS strings.
6. **`@import` first in CSS** — must be very first line in App.css.
7. **Chrome tab** — extension monitors ONE tab. Always use the watched tab.
8. **Python patch assertions** — `assert old in src` before every replace.
9. **scoreCard vs applyCardSim** — two separate switch statements in sim. Never confuse them.
10. **420 is sacred** — never change card height or stash cap.

---

## Aesthetic Rules

1. Dark background everywhere — rgba(4,2,1) near-black
2. Gold accents — #e8a820, #d0b060
3. Red danger — #ee2222 for ATK/damage/death
4. Green health — #33dd33 for HP
5. No white backgrounds ever
6. Fonts: BogartsMetalFont (titles), MBScribblesFont (UI), ScratchFont (flavour)
7. The battlefield layout is sacred — never rearrange it
8. Numbers that matter: 420, 69, 666 — maintain throughout

---

## Session History

| Session | Date | Key Work |
|---------|------|----------|
| 1–5 | Feb 2026 | Core game built |
| 6 | Feb 2026 | Shop UI, pawn shop, booster packs |
| 7 | Feb 2026 | AI sim v1, economy rebalance |
| 8 | Feb 2026 | Death screens, Hellquake, Fire & Recruit |
| 9 | Mar 2026 | 13 bugs fixed, balance pass |
| 10 | Mar 21 | Batch 1–3: sold state, death screens, hand over-cap, Setlist, Remaster, Amp Overload |
| 11 | Mar 22 | 9 double-fire bugs, Demo Tape, Distortion +15%, Batch A |
| 12 | Mar 22 | Mentor Link, Hoarder cut, pack odds, score system, grades, personal best, sim v8.0 |

---

## What To Do When Starting A New Session

1. `cd vestibule && git pull`
2. `npm run dev` → http://localhost:5173/
3. Hard refresh browser (Cmd+Shift+R)
4. Read HANDOFF.md for exact current state
5. Read TODO.md for priority list
6. Build it. 🤘
