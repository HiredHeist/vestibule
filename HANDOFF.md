# VESTIBULE — Developer Handoff
**Latest commit: 36e9b4d | March 24, 2026**

## Quick Start
```bash
cd vestibule && npm run dev    # http://localhost:5173/vestibule/
npm run build                  # Production build to dist/
node vestibule-sim.js 5000 bronze  # Run simulator
```

## Architecture
Single-file React app: `src/App.jsx` (5359 lines, 405KB).
No component splitting — everything in one file for rapid iteration.
Vite dev server with HMR. Base path: /vestibule/

## Critical Gotchas
1. **NEVER put setHand inside setDeck** — React Strict Mode double-fires
2. **ALL setEnemyHp damage calls MUST check victory** — use triggerVictoryRef.current
3. **Use REFS for values in useCallback closures:** nextCardFreeRef, allCardsFreeRef, strikeMultRef, triggerVictoryRef
4. **applyCard/handleDropOnStage/handleStrike** all have comprehensive dependency arrays — verify any new deps are declared ABOVE the callback (temporal dead zone)
5. **Top-level return order:** victoryCinematic -> welcomeToHell -> circleSplash -> descent -> campfire -> pact -> gameState checks
6. **Apostrophes** — use "could not" not "couldn't" in JS strings
7. **UPDATE DOCS ON EVERY PUSH**
8. **Base path /vestibule/** — use import.meta.env.BASE_URL for assets
9. **420 is sacred. 666 is the Usurer HP. 69 is the deck size.**
10. **Mentor links match by ROLE not by name/id**
11. **cardHeal passives guard with p<=0?p:** — prevents boss resurrection
12. **Sabbath Sigil is CONSUMABLE** — destroyed after use, never goes to discard
13. **victoryFiredRef** — only set inside triggerVictory itself, never externally

## Key Code Locations
| What | ~Line |
|------|-------|
| ENEMIES array | 125 |
| ALL_MUSICIANS | 160 |
| CARD_UPGRADES | 247 |
| BOSS_LOOT | 292 |
| STREAK_BONUSES | 330 |
| RIFF_CHAINS | 340 |
| PACT_REWARDS | 355 |
| ALL_CARDS | 400 |
| STARTER_ARTIFACTS | 477 |
| STARTER_PASSIVES | 494 |
| cardPrice() | 545 |
| genShopCards() | 553 |
| BossSection component | 1813 |
| DeckPile component | 1841 |
| EndScreen component | 1870 |
| StageSlot component | 1697 |
| HandCard component | 1769 |
| Music system | 2546 |
| applyCard | ~2716 |
| handleDropOnStage | ~3137 |
| triggerVictory | ~3338 |
| Safety net useEffect | ~3497 |
| handleStrike | ~3612 |
| activateTrip (drugs) | ~3545 |
| handleShopLeave | ~3970 |
| handleReset | ~4316 |
| Combined Attack display | ~5084 |

## State Management
All state lives in App() via useState. Key refs for closure stability:
- nextCardFreeRef, allCardsFreeRef (ember cost calculations)
- strikeMultRef (captured before reset in handleStrike)
- triggerVictoryRef (all setTimeout victory calls go through this)
- victoryFiredRef (prevents double-fire)
- deckRef, discRef, handRef (stable deck/discard/hand access)

## Simulator
`vestibule-sim.js` v16.0 — models ALL game mechanics:
Artifacts, passives, pacts, boss loot, combos, multiplier, hellquake, drugs, genre, mentor links, doom forge, deck thinning, shop AI.
Usage: `node vestibule-sim.js [games] [stake]`

## Dev Shortcuts (in combat)
- Shift+S: Jump to shop
- Shift+D: Trigger death screen
- Shift+W: Trigger victory cinematic
- Shift+C: Open Doom Forge

## Audio
- Music: public/music/*.mp3 (11 tracks, crossfade on switch)
- SFX: public/sfx/*.mp3 (30 files)
- playSfx(name, vol?) — volume defaults to 1.0
- TRACK_MAP determines music per gameState + boss/lucifer/victory overrides
