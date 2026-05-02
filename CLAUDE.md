# VESTIBULE — Developer Notes

*Last updated: May 2, 2026 · Latest commit: `64ecb85` (Wanderer training-wheels + Welcome Pack) · App.jsx: ~11,339 lines*

This is the canonical dev reference. If something here conflicts with another doc, this wins. If you find this doc out of sync with the code, **fix the doc in the same commit as the code**.

---

## 🔒 WORKFLOW RULE — READ FIRST EVERY SESSION

**Every commit that changes code MUST update TODO.md in the same commit.** If file structure, key code locations, rules, or constants change, CLAUDE.md updates in the same commit too. No separate "docs" commits — they rot. Stale docs cost more than no docs.

---

## CRITICAL RULES (do not violate)

1. **NEVER** put `setHand` inside a `setDeck` updater — React Strict Mode double-fires updaters in dev and you'll get desyncs. Same applies to any `setX(prev => { sideEffect; return ... })` pattern.
2. **All `setEnemyHp` damage paths** that could kill the boss MUST trigger via `triggerVictoryRef.current()`, not direct state checks.
3. **Use REFS** for values consumed inside `useCallback` closures. State variables go stale.
4. **`drawUpTo` MUST use refs** — `deckRef.current`, `discRef.current`, `handRef.current`. Same for `cardsPlayedRef`.
5. **`handleReset` must reset ALL state + ALL refs** — every new piece of state needs a corresponding reset entry.
6. **Card leak rule:** any card handler in `handleDropOnStage` MUST include the played card in `drawUpTo`'s discard arg. Otherwise the card is silently lost.
7. **Fight-start reshuffle MUST include `handRef`** alongside `deckRef` and `discRef` — `[...handRef.current, ...deckRef.current, ...discRef.current]`.
8. **BogartsMetalFont** is for display text ONLY — **NO NUMBERS** (it has weird numeric glyphs). Use `MBScribblesFont` for anything containing digits. Lint enforces this.
9. **ScratchFont** is for flavor text 20pt+ ONLY. Anything under 20pt MUST use MBScribblesFont. Lint enforced.
10. **Minimum font size: 13px** globally. Lint enforced.
11. **Never `React.useState`** — use named imports (`import { useState } from "react"`).
12. **`ErrorBoundary.render()` must `return this.props.children`** — fail open, never replace UI with an error wall.
13. **HP scaling** — only `getScaledMaxHp(enemy)` is the source of truth. Don't reinvent the formula inline.
14. **`main.jsx` changes** require `rm -rf node_modules/.vite` + dev-server restart. CRT/VHS overlays live there.
15. Vite HMR works for `App.jsx` — `git pull` is enough, no server restart.

---

## FILE STRUCTURE

- `src/App.jsx` — ~11,339 lines, single-file architecture (split TODO'd, see TODO 3.1)
- `src/main.jsx` — root mount, CRT/VHS overlay, scale wrapper
- `src/App.css` — design tokens (`:root` CSS vars), global animations
- `public/vestibule/` — game assets (cards, artifacts, passives, pacts, loot, packs, fx)
- `public/members/` — 18 member portraits (`{id}_stage.png`) + `idle/` GIFs
- `public/bosses/` — 28 boss portraits
- `public/sfx/` — 31 SFX `.mp3` files
- `public/music/` — 11 music `.mp3` files (placeholders, JV recording originals)
- `public/fonts/` — 9 font files
- `public/sly.gif` — Sly the Fence shop character (animated)
- `vestibule-sim-kwstacks.js` — current simulation engine matching live keyword scaling

---

## KEY CODE LOCATIONS

Approximate, but maintained per session. Re-grep before relying.

> ⚠️ **Line numbers below are based on App.jsx ~9,600 lines.** Post `64ecb85` the file is ~11,339 lines, so anything past line ~5000 is shifted by 1500–1800 lines. **Always `grep -n` first** when looking for current locations.

### Recent changes (May 2 late-night, commit `64ecb85`)
| Live line | What |
|---|---|
| 211–216 | `ENEMIES[0]` Wanderer entry — `maxHp:45, baseDmg:2` (training-wheels nerf, with rationale comment) |
| 1474–1494 | `genRecruitPack(fightIndex)` — `fightIndex===0` returns free `🎸 Welcome Pack` (cost 0) at shop 1 |

### Top-level data
| Line | What |
|---|---|
| 105 | Game constants: `MAX_EMBERS_CAP=8, MAX_STRIKES=4, MAX_DISCARDS=4, HAND_SIZE=6, MAX_STASH=420` |
| 208–280 | `ENEMIES` array (27 + Lucifer = 28 bosses) |
| 305–340 | `DESCENT_REWARDS_1`, `DESCENT_REWARDS_2` (skip-fight reward pools) |
| 420–425 | `STAKES` array (Bronze through Demonic) |
| 434 | `AR_EXECUTIVE` (Welcome to Hell penultimate boss) |
| 462 | `RIFF_CHAINS` (16 chains) |
| 490 | `ALL_CARDS` array (82 cards) |
| 586 | `CARD_TYPE_BY_ID` lookup |
| 588–630 | Keyword stack helpers: `_stackTier`, `getKeywordStacks`, `getEffectiveAtk` |
| 634 | `KEYWORD_DESC` (9 keywords) |
| 683 / 703 / 724 | `MEMBER_PORTRAITS`, `STAGE_PORTRAITS`, `IDLE_PORTRAITS` |
| 744 | `BOSS_PORTRAITS` |
| 775 | `CIRCLE_BG` (per-circle backdrop themes) |
| 950 | `DECK_CARD_MANIFESTS` (5 starter decks × 69 cards) |
| 1018 | `TUTORIAL_MEMBERS = ['bjorn', 'gunnar']` |
| 1051 | `FIRST_TIPS` (first-encounter tooltips for pacts/shop/events/descent) |
| 1101 | `STARTER_DECKS` (5 decks with `hpScale`) |

### Components (top-level functions)
| Line | Component |
|---|---|
| 837 | `MemberPortrait` |
| 965 | `WeedLeaf` (used everywhere instead of 🌿 emoji) |
| 1373 | `Projectile` |
| 1390 | `Float` (damage/heal numbers) |
| 1480 | `BoosterScreen` |
| 1587 | `PawnShopModal` |
| 1823 | `ShopScreen` |
| 2758 / 2765 / 2817 | `CardArtImg`, `ArtifactArtImg`, `PackArtImg` |
| 2826 | `StageSlot` (member card) |
| 2915 | `HandCard` |
| 2987 | `DamageBreakdown` |
| 3109 | `TrophyWall` |
| 3238 | `StatsScreen` |
| 3338 | `MasteryGallery` |
| 3430 | `ColdOpenScreen` |
| 3476 | `VictorySummaryScreen` |
| 3550 | `EventScreen` |
| 3608 | `BossSection` |
| 3697 | `DeckPile` |
| 3775 | `EndScreen` |
| 4379 | `DemonicConflictScreen` |
| 4419 | `RecruitScreen` |
| 4508 | `RemasterModal` |
| 4576 | `SetlistModal` |
| 4627 | `TutorialTooltip` |
| 4649 | `TutorialMessage` |
| 4661 | **`App` (main)** |
| 9563 | `ScaleRoot` (responsive wrapper) |

### Key handlers inside App
| Line | Handler |
|---|---|
| ~4904 | `getScaledMaxHp(enemy)` — single source of truth for displayed enemy HP |
| ~5928 | `handleDropOnStage` — drag-drop card onto member |
| ~6182 | `handleDiscard` |
| ~6726 | `handleStrike` — main combat resolution (long, complex, the heart) |
| ~7360 | `handleShopLeave` — "Back to the Pit" flow |
| ~7560 | `handleEventChoice` — random event handler |

### Dev shortcuts (for testing)
| Combo | Action |
|---|---|
| Shift+D | Force death screen |
| Shift+W | Force victory screen |
| Shift+S | Force shop |
| Shift+C | Force forge |
| Shift+~ | Toggle debug HUD |

---

## GAME CONSTANTS (live values)

```
MAX_STRIKES:       4 (3 on Demonic stake)
MAX_DISCARDS:      4
HAND_SIZE:         6
MAX_HAND:          10
MAX_STASH:         420 (sacred — never change)
MAX_EMBERS_CAP:    8
strikeMult cap:    10,000× (raised from 6.66× in v20)
DECK_SIZE:         69 (sacred — never change)
TOTAL_CARDS:       82 unique cards
```

### Stake difficulty knobs

| Stake | hpMult* | dmgAdd | priceMult | maxStrikes | startEmbers | startCorr | scoreMult |
|-------|---------|--------|-----------|------------|-------------|-----------|-----------|
| Bronze | 1.20 | 0 | 1.0 | 4 | 5 | 0 | 1.0 |
| Silver | 1.25 | +2 | 1.0 | 4 | 5 | 0 | 1.5 |
| Gold | 1.25 | +3 | 1.25 | 4 | 5 | 0 | 2.0 |
| Obsidian | 1.45 | +2 | 1.25 | 4 | 5 | 0 | 2.5 |
| Blood | 1.70 | +2 | 1.25 | 4 | 4 | 10 | 3.0 |
| Demonic | 1.66 | +4 | 1.5 | 3 | 4 | 15 | 4.0 |

\* `hpMult` is currently displayed in stake descriptions but **not applied in combat** — see TODO 1.2 for the design call.

### Deck HP scaling (the actual combat multiplier)

| Deck | hpScale | Identity |
|---|---|---|
| Standard | 1.85 | Balanced |
| Shredder | 2.00 | Pure aggro |
| Ritualist | 1.65 | Corruption-power |
| Engineer | 1.85 | Combo / copy |
| Survivor | 1.75 | Outlast |

Combat formula (use `getScaledMaxHp` helper):
`Math.ceil(enemy.maxHp × deck.hpScale × heatMult × encoreMult)`
where `heatMult = 1 + max(0, heatLevel - 1) × 0.15` and `encoreMult = 2.0 if encoreMode else 1.0`.

---

## LOCALSTORAGE KEYS

```
vst_active_stake          Currently selected stake
vst_save                  Mid-fight save snapshot (JSON)
vst_history               Run history
vst_runs / vst_best       Run count + best score
vst_lifetime / vst_lifetime_score  Total lifetime stats
vst_streak / vst_lastdate Daily streak tracking
vst_mastery               Card play counts (Novice→Legendary)
vst_trophies              Boss first-kill records
vst_legacy                Member stats across runs
vst_combos_discovered     Riff chains found
vst_chains_discovered     (newer) chain discovery records
vst_achievements          Achievement list
vst_stake_unlocks         Beaten stakes
vst_lucky_draw            Lucky draw toggle
vst_seen_intro            Cold open watched flag
vst_rules_seen            FIRST_TIPS shown
vst_daily_best            Daily challenge best score
vst_heat                  Heat level (NG+ scaling)
vst_scanlines / vst_speed Visual options
vst_music_vol / vst_sfx_vol  Audio settings
vst_shake                 Screen shake toggle
vst_chainhints            Chain-ready hint toggle
vst_dmgnums               Damage number display toggle
vst_hoverzoom             Hand card hover-zoom toggle
vst_handsort              Sort mode (none / embers / rarity)
vst_best_circle           Highest circle reached
vst_achievement_*         Per-achievement unlock flags
```

---

## DESIGN TOKENS (App.css `:root`)

13 tokens, lint-enforced. `npm run check` validates.

- 5 text: `--ink-bone`, `--text-primary`, `--text-secondary`, `--text-positive`, `--text-blood`
- 2 semantic: `--blood`, `--gold`, `--rot`, `--altar` (etc. — full list in App.css)
- 4 type: `--type-riff`, `--type-corrupt`, `--type-utility`, `--type-ember`
- 2 tier: `--tier-foil`, `--tier-mythic`, `--tier-demonic`

---

## SACRED CONSTANTS

- **420** — stash cap, card height. Never change.
- **69** — deck size. Never change.
- **MBScribblesFont** is the default readable UI font.
- **BogartsMetalFont** is display only, NO digits.
- **ScratchFont** is decorative, 20pt+ only.

---

## SIMULATION

- File: `vestibule-sim-kwstacks.js` (current, post-keyword-refactor)
- Run: `node vestibule-sim-kwstacks.js [numGames] [stake] [deck]`
- Models: cards, passives, artifacts, pacts, loot, combos, mentor links, drugs, hellquakes, corruption thresholds, random events, blood oath, full keyword stack tier scaling
- **Live HP sync:** sim reads `boss_hp_override.json` at repo root for current ENEMIES maxHp values, then applies `deck.hpScale` (1.85 default Standard). Matches live `getScaledMaxHp` exactly. **When live boss HPs change, update `boss_hp_override.json` in the same commit.**
- Latest 5K Bronze sim (May 2 overnight, post-fix): avg fight reached 14.37/26, Wanderer 0% deaths, Lost Soul 20.6% deaths (new wall), Devourer C3 17.9% deaths (second wall), Lucifer wins 17.7%
- Sim is fast: 5K games in ~17 seconds, 10K in ~35 seconds

When changing game balance, run sim before committing.

---

## GIT WORKFLOW

- Repo: `github.com/HiredHeist/vestibule` (private)
- PAT in user memory if needed for push (rotate when expiring)
- Branch: `main`, no other branches in active use
- Commit style: short imperative subject, full-paragraph body explaining the change and any consequences
- Lowercase OK, profanity OK, doom-metal references encouraged
- Every code commit updates `TODO.md` in the same commit (cardinal rule)

---

## KNOWN PITFALLS

- **`useEffect` deps** with refs: don't include refs in dep arrays, only state
- **Vite caches aggressively** — if behavior is weird after a refactor, `rm -rf node_modules/.vite` and restart
- **Strict Mode double-fire** in dev — any side effect inside a state updater fires twice; refactor to refs or post-`setState` effects
- **Stale closures** in `useCallback` — check the deps array. If you're reading a value but not updating when it changes, ref it
- **Tutorial bypasses** corruption / events / shop — when adding new flows, check `tutorialFight > 0` guards

---

## RELATED DOCS

| File | Purpose |
|---|---|
| `README.md` | Public-facing intro, points new agents here |
| `TODO.md` | Prioritized task list (the active work doc) |
| `GDD.md` | Game design document (mechanics + numbers) |
| `ART_TODO.md` | Art assets needed (sizes, paths, descriptions) |
| `STEAM.md` | Build & deploy guide |

If you find any other `*.md` in the repo, it's likely stale — flag it for cleanup or removal.
