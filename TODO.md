# VESTIBULE — TODO & Status
**Updated March 24, 2026 | Commit 36e9b4d**

---

## COMPLETED FEATURES

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

### Addiction Features (5/5)
- [x] Score Multiplier Counter (x0.03/card, x0.15/combo, wired into damage)
- [x] Near-Death Clutch System (SOLO VICTORY / BY THE SKIN OF YOUR TEETH / CLUTCH)
- [x] Boss Loot Drops (8 unique drops per circle boss)
- [x] Streak Rewards (2-win ember, 3-win Foil, 5-win Mythic)
- [x] One More Circle Hook (next circle enemy preview on boss clear)

### Doom Forge (Card Upgrades)
- [x] 41 upgrade definitions, 15 with permanent HP buffs
- [x] Gold "+" badge on upgraded cards
- [x] 9+ upgraded card effects mechanically wired
- [x] Appears after Pact, before Shop (boss -> pact -> forge -> shop)

### UI/UX Improvements
- [x] 1. Wire multiplier into damage (x0.03/card)
- [x] 2. Persistent buff badges on members (clear on strike)
- [x] 3. Shrink stage 17%, expand cards 20%
- [x] 4. Boss passive 35pt dark blood red, centered text, 180px icon
- [x] 5. Passive tooltips in combat (hover for effect)
- [x] 6. Artifact tooltips in combat (already existed)
- [x] 7. Ember cost scaling (solved by card enlargement)
- [x] 8. Deck hover distribution tooltip (RIFF/CORRUPT/UTILITY/EMBER)
- [x] 10. Shop section borders + labels ("Cards For Sale", "Booster Packs + Pawn Shop")
- [x] 13. Circle transition splash (3-second placeholder)
- [x] 15. Deck hover distribution tooltip
- [x] Card hover 50% scale (translateY -80px, scale 1.5)
- [x] Multiplier box orange (#ff8800)
- [x] Boss box redesign v4 (180px icon, centered text, 35pt passive)

### Audio
- [x] 30 SFX files (card plays, combat, UI, shop)
- [x] 11 music tracks (menu, select, battle, boss, lucifer, shop, pact, forge, descent, victory, death)
- [x] All audio normalized -6dB from SFX level
- [x] Crossfade on track switch
- [x] Smart track selection (boss/lucifer/victory overrides)

### Balance
- [x] Sim v16.0 with ALL mechanics modeled
- [x] Bronze 9.33% win rate (hpMult 1.30)
- [x] Silver 11.22% win rate (hpMult 1.30)
- [x] Gold 11.20% | Obsidian 9.12% | Blood 2.10% | Demonic 0.03%
- [x] Sabbath Sigil consumable (1 in deck, 5% shop at 42 herb)
- [x] 6 card cost reductions (Setlist 0, Burn Set 0, Feedback Loop 2, Demo Tape 1, Amp Static 2, Smoke Break +3)
- [x] Enemy rebalance (False Prophet 2600, Devourer cardHeal6, Usurer 666, Executive 69k)

### Bug Fixes
- [x] Strike damage (finalDmg scope, strikeMult ref)
- [x] Free first card (nextCardFreeRef for stable closure)
- [x] Nested setState (Soundboard setDiscardPile inside setHand)
- [x] Victory checks on ALL direct damage cards
- [x] POSSESSION Hellquake (allCardsFree state + ref)
- [x] Missing useCallback deps (applyCard, handleDropOnStage, handleStrike)
- [x] Blank screen (activeGenre temporal dead zone)
- [x] Boss not dying (stale triggerVictory closure -> triggerVictoryRef)
- [x] cardHeal resurrection (p<=0?p: guard on all 15 cardHeal lines)
- [x] Safety net self-block (removed premature victoryFiredRef flag)
- [x] Black Candle game lock (victory check + AoE path)
- [x] Play Again button crash (playSfx not in EndScreen scope)
- [x] EndScreen scroll clipping (flex-start + padding)

---

## REMAINING TODO

### High Priority
- [ ] **9. Opening Night redesign** — 4-5 candidates, synergy hints, flavor text
- [ ] **12. End screen stats bigger** — individual stat boxes, screenshot-worthy

### Card Art
- [ ] Replace all emoji placeholders with custom art
- [ ] Boss artwork for all 27 enemies
- [ ] Card frame designs per type

### Music
- [ ] Unique tracks for boss, lucifer, pact, forge, descent, victory (currently reusing select/shop)
- [ ] Circle splash audio (short 3-sec stings)

### Future Features (from Addiction Ideas)
- [ ] Run History + Ghost Data (last 20 runs timeline)
- [ ] Deck Personality System (track player card preferences)
- [ ] Seed Sharing + Challenge Mode (URL-based seed comparison)
- [ ] Addiction Loop Timer ("Average run time: 8 minutes")
- [ ] Score chain visualization
- [ ] Daily mutations
- [ ] Boss loot table expansion
- [ ] Stash gambling
- [ ] Deck tracker overlay
- [ ] Combo reveals (preview before playing)
- [ ] Skill tree (meta-progression)
- [ ] Endless mode (past Circle 9)

### Technical
- [ ] Deploy to royceprinting.com/vestibule/ (production build)
- [ ] Card animations (play, discard, draw)
- [ ] Turn flow animations (strike sequence)
- [ ] Performance optimization (component splitting if needed)
