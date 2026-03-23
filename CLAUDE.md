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

## Current Build State (Session 13 end)

**Latest commit:** `ea8001e`  
**App.jsx:** ~3700+ lines  

### Fully working systems:
- Full 9-circle enemy progression (27 enemies, all with passives + death quotes)
- Complete card system (40+ unique cards)
- 16 band members (all active, none locked by default — unlock system TBD)
- Shop with scaling inventory, pawn shop, booster packs, circle artifacts
- **Mentor Link system** (foil/mythic/demonic left of same-id basic = bond + multiplier)
- **Score system** (count-up animation, grade tiers, personal best, daily streak, run counter)
- Artifacts A1–A10 (shop rotation), Circle Artifacts CA1–CA4 (boss shops, all functional)
- Passives P1–P10
- DOUBLE TIME d6, HEXED corruption scaling, FOLK MAGIC ember refund
- Foil/Mythic/Demonic member tiers with visual glow + badges
- Two distinct death screens: Stoned to the Bone + Beaten by [Boss]
- Daily seed system
- localStorage: run count, personal best, lifetime score, daily streak
- C4 stashSteal mechanic (steals herb, refunds on win)
- C5 softened rageScale (+1/+1/+2)
- C8 fraudShuffle (discard+redraw cards after each strike)
- Deterministic boss damage (no variance)

### What's next (P1 priority):
- **Run sim v10.0 at 20k** — get the real survival curve
- **War Drums artifact** (+1 Strike) — if sim says we need it
- **Share score button**
- **Lucifer phase system** (3 phases × 140,222 HP — discuss first)

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

### Key card notes (Session 13 updates):
- `distortion` — +15% corruption (was +10%), embers: 1 (Session 12)
- `wakeup` — embers: 0 (was 2). Free revival.
- `groupie` — embers: 1, rarity: Uncommon (was 2 embers, Common)
- `ampoverload` — embers: 0, costs 1 discard (unplayable at 0 discards)
- `controlfeedback` — set corruption to 50% AND heal target member 50% maxHP
- `remaster` — select 1 card in hand, delete it, draw 3 (handled in handleDropOnStage)
- `sigdecay` — REWORKED: discard 1 random card from hand, draw 2 cards, 1 ember (handled in handleDropOnStage)
- `seance` — 1 ember, heals corruption ÷ 4 to all (was 2 embers, ÷ 8). Rewards high corruption.
- `herbmoney` — deal stash ÷ 2 as damage, keep stash (was 10% of stash, lose it)
- `roadie` — stoneShield: 2 strikes immunity + heal 2 HP (was 1 strike). Shield decrements per lethal hit.

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

## All Enemies + Current HP + Passives

```
C1 Limbo:    F00 Wanderer 27   | F01 Lost Soul 42   | F02 Drifter 69       [no passive]
C2 Lust:     F03 Siren 60      | F04 Tempter 90     | F05 Seducer 140      [selfbuff +1/+1/+2]
C3 Gluttony: F06 Glutton 80    | F07 Feaster 110    | F08 Devourer 160     [cardHeal 2/3/4]
C4 Greed:    F09 Miser 260     | F10 Hoarder 300    | F11 Usurer 420       [stashSteal 1/2/3]
C5 Anger:    F12 Wrathful 900  | F13 Berserker 1000 | F14 Warlord 1111     [rageScale +1/+1/+2]
C6 Heresy:   F15 Heretic 1650  | F16 Apostate 2175  | F17 False Prophet 3000 [corruptPlayer +10/15/20%]
C7 Violence: F18 Brute 3000    | F19 Hunter 4000    | F20 Executioner 5500  [targetHighestHp 1x/1.5x/2x]
C8 Fraud:    F21 Trickster 5200| F22 Deceiver 6800  | F23 Archfraud 9600   [fraudShuffle 1/2/3]
C9 Treachery:F24 Traitor 9000  | F25 Betrayer 11400 | F26 LUCIFER 420,666→6,666 [paranoia/soulThief/2-phase]
```

---

## Simulation

```bash
cd /home/claude && node vestibule-sim.js 5000    # quick
cd /home/claude && node vestibule-sim.js 20000   # thorough
```

**v10.0 (Session 13) — synced with all changes:**
- C4 stashSteal (no damage scaling), C5 rageScale +1/+1/+2, C8 fraudShuffle
- Circle artifacts ca1-ca4 functional
- Signal Decay reworked, Groupie buffed
- Mentor Link aware, smart shop AI, pawn shop selling
- Deterministic boss damage (no variance)
- Smoke test (100 games): avg fight 17.10 (up from 14.99 in v9.0)
- **Awaiting full 20k run for definitive data**
- Sim needs update for: dealer (shrooms/acid), C9 passives, Lucifer phases, card buffs

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
11. **UPDATE DOCS ON EVERY PUSH** — TODO.md, HANDOFF.md, CLAUDE.md are the bible. No exceptions.

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
| 13 | Mar 22-23 | 45+ pushes: C4/C5/C8/C9 rework, Lucifer 2-phase, The Dealer, card balance, Addiction Stack (death screen, unlocks, achievements, run history, daily streak, share score) |

---

## What To Do When Starting A New Session

1. `cd vestibule && git pull`
2. `npm run dev` → http://localhost:5173/
3. Hard refresh browser (Cmd+Shift+R)
4. Read HANDOFF.md for exact current state
5. Read TODO.md for priority list
6. Build it. 🤘
