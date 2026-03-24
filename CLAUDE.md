# VESTIBULE — Context for Claude
> Read this FIRST in every new session. Then read TODO.md.
> *Last updated: Session 14 final, March 24, 2026*

## What You Need to Know Immediately
- Single-file React app: `src/App.jsx` (~4900 lines)
- Dev server: `cd vestibule && npm run dev` → http://localhost:5173/vestibule/
- Sim: `node vestibule-sim.js 10000 bronze` (v14.0, supports all 6 stakes)
- GitHub: HiredHeist/vestibule (private), PAT in HANDOFF.md
- Deploy: royceprinting.com/vestibule/
- ScaleRoot: 1920×1080 design, absolute positioning everywhere

## Architecture
- `src/App.jsx` — entire game (components, state, logic, rendering)
- `src/App.css` — keyframe animations only
- `public/music/` — 5 tracks (menu, select, battle, shop, death)
- `public/sfx/` — 30 normalized sound effects
- `public/fonts/` — 3 custom fonts (BogartsMetalFont, MBScribblesFont, ScratchFont)
- `vestibule-sim.js` — AI simulator (691 lines, all features synced)

## Key Code Locations
- ENEMIES array: ~line 125 (27 enemies + Lucifer)
- ALL_CARDS: ~line 315 (41 cards)
- ALL_MUSICIANS: ~line 160 (18 musicians)
- RIFF_CHAINS: ~line 297 (16 combos)
- PACT_REWARDS: ~line 250 (12 pacts)
- DESCENT_REWARDS: ~line 225 (18 rewards, 9 small + 9 medium)
- STAKE_UNLOCKS: ~line 290 (6 stake rewards)
- AR_EXECUTIVE: ~line 276 (Welcome to Hell boss)
- REWARD_TIPS: ~line 203 (18 skip reward descriptions)
- Genre tracking: genreCounts state + activeGenre computed (~line 3990)
- Victory cinematic: top-level return before gameState checks (~line 4313)
- WTH choice/cutscene: top-level returns after cinematic (~line 4370)
- Unlock gallery: 7 tabs, 4×2 grid (~line 4080)
- playSfx helper: near musicVol state (~line 2390)
- drawUpTo: ~line 2458 (capped at 10)
- cardsToDrawRef: set at strike press, read in refill setTimeout
- handlePawnBurnCard: ~line 4104
- handleShopSpend: ~line 3940 (central purchase handler, playSfx('buy') at top)

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_HAND: 10 (silent cap)
- MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting deck: 69 cards, 41 unique, 2 shop-only
- Stash rewards: circleBaseMin=[8,6,7,8,9,9,11,11,14], circleBaseRange=[3,4,4,3,4,4,5,5,7]

## Session 14 Completed Features
- All Big 5 features (combos, pacts, descent, genre, victory+WTH)
- 30 SFX normalized and wired (playSfx with volume param)
- Balance: C1-C4 buffed (no more autopilot), C6 smoothed
- Sim v14.0 synced with all features
- Unlock gallery rewritten (7 tabs, 4×2 grid, card tooltips)
- Pawn shop overhauled (green sell, red burn, card tooltips)
- Shop layout fixed (stash+reroll next to pawn shop)
- Critical bug: victory check added to ALL 14 direct damage effects

## Critical Rules
1. NEVER nest setHand inside setDeck callback
2. ALL setEnemyHp damage calls MUST check hp<=0 → triggerVictory
3. Top-level returns order: victoryCinematic → welcomeToHell → gameState
4. Use "could not" not "couldn't" in JS strings (apostrophe issues)
5. Hand cap is 10 (enforced in drawUpTo and strike refill)
6. UPDATE DOCS ON EVERY PUSH
7. 420 is sacred

## What Is NOT Done (see TODO.md for full list)
- Music tracks: 6 new tracks needed (victory, lucifer, boss, descent, pact, welcome)
- Sound effects: all wired but some may need quality improvements
- Visual polish: screen shake, card animations, damage bounce
- Card art: emojis are placeholder (need illustrated cards)
- 10 addiction features planned (see TODO.md)
- Balance: Demonic stake may need tuning, Executive HP may need reduction
- Future: leaderboard, A11-A20 artifacts, P11-P20 passives, Steam prep

## Sim Usage
```bash
node vestibule-sim.js 50000 silver  # 50k games on silver stake
# Stakes: bronze, silver, gold, obsidian, blood, demonic
```
Current rates: Bronze 20.72% | Silver 10.84% | Gold 4.40% | Obsidian 3.00% | Blood 0.14%
