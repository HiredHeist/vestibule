# CLAUDE.md — AI Assistant Instructions for Vestibule

## Project Context
Vestibule is a roguelite deck-building card game. React 19 + Vite. Single-file: src/App.jsx (5359 lines).
Repo: github.com/HiredHeist/vestibule. PAT: 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 (expires Jun 2026).

## Critical Rules
1. **NEVER push without player go-ahead**
2. **Always use JST time in TODO timestamps**
3. **420, 666, 69 are sacred numbers** — do not change without approval
4. **Run npx vite build before every push** — verify it passes
5. **Check brace/paren balance** before pushing
6. **Update docs (TODO.md, HANDOFF.md, GDD.md) on major changes**

## Architecture Gotchas
- **Temporal dead zone:** Any variable in a useCallback dep array MUST be declared ABOVE the callback
- **Stale closures:** Use refs (nextCardFreeRef, allCardsFreeRef, strikeMultRef, triggerVictoryRef) for values read inside useCallback
- **cardHeal guard:** All cardHeal setEnemyHp calls use p<=0?p: to prevent boss resurrection
- **triggerVictoryRef:** ALL setTimeout victory calls go through the ref, never direct
- **victoryFiredRef:** Only set INSIDE triggerVictory itself
- **No nested setState:** Never put setHand inside setDeck callback (React Strict Mode)
- **Apostrophes:** Use "could not" not "couldn't" in JS strings

## Quick Reference
- Dev: npm run dev -> http://localhost:5173/vestibule/
- Build: npx vite build
- Sim: node vestibule-sim.js [games] [stake]
- Shortcuts: Shift+S (shop), Shift+D (death), Shift+W (victory), Shift+C (Doom Forge)
- Assets: import.meta.env.BASE_URL + 'sfx/name.mp3' or 'music/name.mp3'

## Current Balance (Sim v16, 50k games)
Bronze 9.33% | Silver 11.22% | Gold 11.20% | Obsidian 9.12% | Blood 2.10% | Demonic 0.03%

## Content: 41 cards, 69 deck, 18 musicians, 27 enemies, 7 artifacts, 10 passives, 12 pacts, 16 combos, 41 upgrades, 8 boss loot, 30 SFX, 11 music tracks, 6 stakes
