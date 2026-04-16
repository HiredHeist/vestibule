# VESTIBULE — Developer Notes (Claude)
**Last updated: April 17, 2026 | Commit: 51f819e (HEAD)**

## 🔒 WORKFLOW RULE (read first, every session)
**Every commit that changes code MUST update TODO.md in the same commit.** If rules, architecture, file structure, or key code locations change, CLAUDE.md updates in the same commit too. No separate "docs" commits — they rot. Stale docs = wasted sessions re-discovering what's done.

## Critical Rules
1. NEVER put setHand inside setDeck — React Strict Mode double-fires
2. ALL setEnemyHp damage calls MUST use triggerVictoryRef.current
3. Use REFS for values in useCallback closures
4. drawUpTo MUST use refs: deckRef.current, discRef.current, handRef.current
5. handleReset must reset ALL 34 states + ALL 22 refs
6. Card leak rule: ANY card handler in handleDropOnStage MUST include played card in drawUpTo discard arg
7. Fight-start reshuffle MUST include handRef: [...handRef.current,...deckRef.current,...discRef.current]
8. BogartsMetalFont ONLY for text — NO NUMBERS (use MBScribblesFont for anything with digits)
9. Vite HMR works — just git pull, no server restart needed
10. NEVER navigate user's browser tab while they're playing

## File Structure
- `src/App.jsx` — 7,935 lines, single-file architecture
- `public/members/` — 18 PNG portraits (9 small + 9 stage)
- `public/fonts/` — 5 custom fonts (BogartsMetalFont display only — NO numbers)
- `public/sfx/` — 30 sound effects
- `public/music/` — 11 music tracks
- `vestibule-sim.js` — Simulation engine v19.1

## Key Code Locations (approximate line numbers)
- MEMBER_PORTRAITS + STAGE_PORTRAITS maps: ~490-520
- SQUIGGLE_CSS: ~510
- MASTERY helpers: ~470
- TROPHY helpers: ~500
- LEGACY helpers: ~540
- DAILY SEED helpers: ~560
- HELL_EVENTS: ~340
- STARTER_DECKS: ~360
- CORRUPTION_THRESHOLDS: useEffect ~4160
- DamageBreakdown component: ~1825
- TrophyWall component: ~2030
- MasteryGallery component: ~2160
- EventScreen component: ~2230
- BossSection component: ~2390
- EndScreen (unified): ~2340
- handleEventChoice: ~4170
- handleStrike + breakdown: ~3700
- handleReset: ~4580
- Dev shortcuts: ~4155 (Shift+D=death, Shift+W=victory, Shift+S=shop, Shift+C=forge)

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_HAND: 10
- MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting deck: 69 cards, 41 unique
- hpMult: Bronze 1.30, Silver 1.30, Gold 1.30, Obsidian 1.50, Blood 1.60, Demonic 1.80
- dmgAdd: Bronze 0, Silver 2, Gold 3, Obsidian 2, Blood 2, Demonic 4

## localStorage Keys
- `vst_mastery` — Card mastery play counts (JSON object)
- `vst_trophies` — Boss trophy kills/stats (JSON object)
- `vst_legacy` — Band member legacy stats (JSON object)
- `vst_daily_best` — Daily challenge best score (JSON object)
- `vst_runs`, `vst_best`, `vst_lifetime` — Run tracking
- `vst_streak`, `vst_lastdate` — Daily streak
- `vst_combos_discovered` — Riff chains found
- `vst_achievements` — Achievement list
- `vst_stake_unlocks` — Beaten stakes
- `vst_scanlines`, `vst_speed` — Options

## Simulation
- File: `vestibule-sim.js` v19.1
- Usage: `node vestibule-sim.js [numGames] [stake]`
- Models: All cards, passives, artifacts, pacts, loot, combos, mentor links,
  drugs, genres, hellquakes, corruption thresholds, random events, blood oath
- Latest results (10K Bronze): 9.67% win rate, proper descending curve across all stakes
