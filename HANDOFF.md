# VESTIBULE — AI Development Handoff Document
*Last updated: Tuesday, March 24, 2026 at 12:00 PM (JST) — Session 14 final*
*This is a living document. Update it at the end of every session.*

---

## Quick Start
```bash
cd vestibule && npm run dev  # http://localhost:5173/vestibule/
node vestibule-sim.js 10000 bronze  # Sim v14.0 with all features
```

## Repo & Deploy
- **GitHub:** github.com/HiredHeist/vestibule (private)
- **PAT:** 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 (expires Jun 2026)
- **Live:** royceprinting.com/vestibule/
- **Latest commit:** 17fa42a

## What Is This Game?
Roguelite card game. Build a doom metal band, fight through 9 Circles of Hell, defeat Lucifer. React/Vite single-file app (App.jsx ~4900 lines). ScaleRoot scales 1920×1080 to any screen.

## Current State — ALL BIG 5 FEATURES COMPLETE
1. ✅ Riff Chains — 16 two-card combos with visual feedback
2. ✅ The Pact — 12 boss rewards, 2 offered per boss
3. ✅ The Descent — circle map, fight skip with rewards (18 rewards)
4. ✅ Genre Bonus — RIFF/BLACK/PROG/DOOM bonuses at 50% threshold
5. ✅ Victory Experience — cinematic, stake unlocks, Welcome to Hell bonus boss

## Key Systems
- **41 unique cards**, 69-card starting deck, 4 types (RIFF/CORRUPT/UTILITY/EMBER)
- **18 musicians**, 8 keywords (FRENZIED/ANCHOR/CORRUPT/DEBUFF/DOUBLE TIME/FOLK MAGIC/SHREDDER/HEXED)
- **6 difficulty stakes:** Bronze→Demonic (1×→4× score)
- **Lucifer:** 2-phase boss (420,666 HP reduced by boss kills → 6,666)
- **Welcome to Hell:** A&R Executive bonus boss (100k HP), contract mechanic
- **30 sound effects** normalized and wired
- **Sim v14.0** with pacts, descent, genre, WTH, deck thinning

## Session 14 Balance (latest)
```
C1: 50/75/110 HP, 4/5/7 dmg (was 27/42/69)
C2: 100/150/220 HP, 5/6/7 dmg (was 60/90/140)
C3: 130/170/230 HP, 5/6/7 dmg (was 80/110/160)
C4: 340/400/500 HP (was 260/300/420)
C6 Apostate: 1900 HP (was 2175)
```

## Win Rates (Sim v14.0, 10k games)
Bronze 20.72% | Silver 10.84% | Gold 4.40%
Obsidian 3.00% | Blood 0.14% | Demonic 0.00%

## Critical Gotchas
1. NEVER put setHand inside setDeck — React Strict Mode double-fires
2. All draw operations use drawUpTo() with cap at 10
3. Strike refill = cardsToDrawRef (count of cards played)
4. ALL setEnemyHp damage calls MUST check if hp<=0 → triggerVictory
5. Top-level returns: victoryCinematic → welcomeToHell → gameState checks
6. Apostrophes — use "could not" not "couldn't" in JS strings
7. UPDATE DOCS ON EVERY PUSH — TODO.md, HANDOFF.md, CLAUDE.md
8. Base path /vestibule/ — use import.meta.env.BASE_URL for assets
9. 420 is sacred. Never change card height.

## Dev Shortcuts
- Shift+S — shop with 69 stash
- Shift+D — death screen
- Shift+W — full victory cinematic
- ESC — pause menu

## Next Priority: Addiction Features
See TODO.md "TOP 10 ADDICTION IDEAS" section. Top 3:
1. Screen shake + impact frames (cheapest, biggest feel improvement)
2. Score multiplier chain (Balatro-style core loop)
3. Card upgrade system (Slay the Spire campfire depth)
