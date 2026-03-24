# VESTIBULE — Master TODO
**Living document — updated with every push**
**Latest: 833fc82 | March 25, 2026 JST**

---

## 🎯 PRIORITY ROADMAP — Ship the Playtest Demo

### TIER 1 — Must Ship (gameplay feel)
- [x] **Damage Breakdown Animation** — Balatro-style number-go-up spectacle after every Strike. Base ATK ticks up per member → multiplier applies with shake → genre/mentor/combo bonuses flash → final number SLAMS. Currently damage just happens silently. This is THE #1 addiction hook.
- [x] **Random Events Between Fights** — Slay the Spire events. 50% chance between non-boss fights. 8 Hell-themed choices: Ferryman, Crossroads Demon, Mosh Pit, Vinyl Collector, Cursed Amp, Blood Pact, Audience with Satan, The Groupie. Makes every run unique.
- [ ] **Opening Night Redesign** — 4-5 candidates instead of full roster, synergy hints, flavor text. First impression matters.
- [ ] **Deploy to royceprinting.com/vestibule/** — Nobody can play it until this ships. Production build + hosting.

### TIER 2 — Should Ship (retention / "one more run")
- [x] **Post-Run Highlights** — "You were 2 strikes from beating the Archfraud. Try again?" + biggest strike, closest call, longest combo chain. Loss aversion is the most powerful Play Again trigger.
- [x] **End Screen Stats Bigger** — Individual stat boxes, screenshot-worthy layout. Current stats are small and forgettable.
- [x] **Card Mastery System** — 41 cards × 4 tiers (Novice→Adept→Master→Legendary). Persistent progress bars across runs. Completionists play for weeks.
- [ ] **Boss Trophy Wall** — "Hall of Damnation" in main menu. 29 boss slots (27 + Lucifer + Executive). Empty "???" slots drive completionists. Demonic-stake frames glow red.

### TIER 3 — Nice to Have (depth / replayability)
- [ ] **Achievement-Gated Starter Decks** — 6 alternate decks: Purist, Corrupted, Speedrunner, Hoarder, Minimalist, Sabbath. Each unlocked by specific achievements. Turns 1 game into 7.
- [ ] **Daily Seed + Leaderboard** — Wordle-style daily habit. One shared seed, global comparison, streak badges. Requires simple backend or seed-encoded scoring.
- [ ] **Corruption Gambling Mini-Game** — At 25/50/75% corruption thresholds, offer risk/reward gambles. The 50% coin flip is pure gambling psychology.
- [ ] **Band Legacy System** — Musicians persist across runs, gain experience, earn nicknames. XCOM-style attachment. Death of a veteran member HURTS.
- [ ] **The Encore (Endless Mode)** — Post-Lucifer infinite scaling. Circle 10+: random passives, x1.2 HP per circle. Remix Bosses. Escalating visual distortion.

### TIER 4 — Art & Audio (player provides)
- [ ] Replace all emoji placeholders with custom card art
- [ ] Boss artwork for all 27 enemies
- [ ] Card frame designs per type (RIFF purple, CORRUPT red, UTILITY green, EMBER orange)
- [ ] Unique music tracks for boss, lucifer, pact, forge, descent, victory (currently reusing select/shop)
- [ ] Circle splash audio (short 3-sec dramatic stings per circle)

### TIER 5 — Polish & Future
- [ ] Card animations (play, discard, draw)
- [ ] Turn flow animations (strike sequence, boss attack)
- [ ] Score chain visualization
- [ ] Deck tracker overlay
- [ ] Combo reveals (preview available combos before playing)
- [ ] Daily mutations (modifiers that change each day)
- [ ] Boss loot table expansion
- [ ] Stash gambling mini-game
- [ ] Deck Personality System (track player card preferences)
- [ ] Skill tree (meta-progression between runs)
- [ ] Addiction Loop Timer ("Average run time: 8 minutes")
- [ ] Seed Sharing + Challenge Mode (URL-based seed comparison)
- [ ] Performance optimization (component splitting if needed)

---

## ✅ COMPLETED — All checked off

### Bug Fixes (Circle 9 Crash — 15 bugs found and fixed)
- [x] BUG 9: 8 drawUpTo() stale state calls → all use deckRef/discRef now
- [x] BUG 10: 10 unguarded .map() in render → .filter(Boolean) added
- [x] BUG 11: Groupie/Setbreak setHand race → return false pattern
- [x] BUG 12: 126 duplicate React key errors → root cause (Bug 9) fixed
- [x] BUG 15: 6 card leak bugs (Groupie, Setlist, Burnset, Remaster, Signal Decay, Setbreak) → cards now go to discard
- [x] BUG 1-4,7: Stonewall bypass on self-inflicted card effects → DESIGN CORRECT
- [x] BUG 5+6: Uncapped stash additions → Math.min(420) on all calls
- [x] BUG 8: Corruption 100% visual → ☠ prefix + bright red
- [x] BUG 13: Consumable cards in Doom Forge → filtered from upgrade list
- [x] BUG 14: Uncapped setEmbers → all capped to maxEmbers

### Play Again Bugs (found during edge case audit)
- [x] handleReset missing setStrikeMult → multiplier carried over between runs
- [x] handleReset missing victoryFiredRef → bosses UNKILLABLE on second run
- [x] handleReset missing setAllCardsFree → POSSESSION hellquake persisted forever
- [x] handleReset missing setNextCardFree/Ref → free card stuck on
- [x] handleReset missing setMemberBuffs → stale buff badges
- [x] handleReset missing milestonesFiredRef → boss HP milestones never re-fired
- [x] handleReset missing wthStrikesRef + recruitPickFiredRef
- [x] Division by alive.length without ||1 guard

### Balance Pass v4 (from 300K sim data)
- [x] Clean Living pact: 0%→<15% threshold, +2→+3 ATK (was 3.8% WR)
- [x] Setlist: draw 2→3 cards, upgraded draws 4 (was 1.0 plays/game)
- [x] Herb Money: 2→1 ember cost (was 2.3 plays/game)
- [x] Dial to Eleven: +20%→+15% corruption, added +1 ATK all (was 2.0 plays/game)
- [x] Drummer DOUBLE TIME: removed x0.5 penalty → x1.0 standard (was 5.5% WR)
- [x] All changes synced to simulator

### Core Game
- [x] 41 unique cards, 69-card starting deck
- [x] 18 musicians across 9 roles
- [x] 27 enemies across 9 circles of Hell
- [x] 6 difficulty stakes (Bronze through Demonic)
- [x] Lucifer 2-phase final boss
- [x] Welcome to Hell bonus boss (The Executive, 69k HP)
- [x] ScaleRoot responsive scaling at 1920x1080

### Big 5 Features
- [x] Riff Chains (16 combos, +10% ATK + multiplier spike)
- [x] Pacts (12 choices after each boss)
- [x] Descent Map (fight skip with rewards)
- [x] Genre Bonus (4 genres at 50%+ threshold)
- [x] Victory Cinematic + Welcome to Hell bonus boss

### Addiction Features
- [x] Score Multiplier Counter (x0.03/card, x0.15/combo, wired into damage)
- [x] Near-Death Clutch System (SOLO VICTORY / BY THE SKIN OF YOUR TEETH / CLUTCH)
- [x] Boss Loot Drops (8 unique drops per circle boss)
- [x] Streak Rewards (2-win ember, 3-win Foil, 5-win Mythic)
- [x] One More Circle Hook (next circle enemy preview on boss clear)

### Doom Forge
- [x] 41 upgrade definitions, 15 with permanent HP buffs
- [x] Gold "+" badge on upgraded cards
- [x] Consumable cards excluded from upgrades
- [x] Appears after Pact, before Shop

### UI/UX
- [x] Multiplier wired into strike damage
- [x] Persistent buff badges on members
- [x] Stage 17% smaller, cards 20% larger
- [x] Boss box v4: 180px icon, centered text, 35pt passive, dark blood red
- [x] Passive/Artifact tooltips in combat
- [x] Deck hover distribution tooltip
- [x] Shop section borders + labels
- [x] Circle transition splash (3-second)
- [x] Card hover 50% scale
- [x] Sabbath Sigil consumable (1 in deck, 5% shop at 42 herb)

### Audio
- [x] 30 SFX files, 21 unique playSfx calls
- [x] 11 music tracks with smart per-screen switching
- [x] All audio normalized -6dB
- [x] Crossfade on track switch
- [x] Boss/Lucifer/Victory music overrides

### Balance
- [x] Sim v16.0 with ALL mechanics modeled
- [x] 300K game simulation report (SIMULATION_REPORT.md)
- [x] Bronze ~10% | Silver ~11% | Gold ~11% | Obsidian ~9% | Blood ~2% | Demonic ~0.04%
- [x] 18-point code verification — all clean

### Previous Bug Fixes
- [x] Strike damage scope + strikeMult ref
- [x] Free first card (nextCardFreeRef)
- [x] Nested setState (Soundboard)
- [x] Victory checks on ALL direct damage cards
- [x] POSSESSION Hellquake state
- [x] Missing useCallback deps
- [x] activeGenre temporal dead zone
- [x] Boss not dying (triggerVictoryRef)
- [x] cardHeal resurrection guard (15 lines)
- [x] Safety net self-block
- [x] Black Candle game lock
- [x] Play Again button crash
- [x] EndScreen scroll clipping
