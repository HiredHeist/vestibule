# VESTIBULE — TODO & STATUS

**Latest commit:** 2b94c35 (Pyromaniac trigger + recalibrated HP scales)
**Sim version:** v19.1 (5 decks recalibrated post-card-rewrites)
**App.jsx:** ~8,530 lines
**Last doc refresh:** post-2b94c35

> 🔒 **DOC RULE:** Every commit that changes code MUST update TODO.md (and CLAUDE.md if rules/architecture change) in the SAME commit. No exceptions. Stale docs = wasted sessions re-discovering what's done.

> 🎸 **JV'S LANES (Claude: DO NOT TOUCH):** All audio work (diegetic music system, victory sfx, corruption milestone audio stings, mute controls, SFX balance) + all PixelLab animations (boss idle/death, member attack/"too stoned"). These ship last, by JV, on original music. If people want to mute, they can fuck themselves.

---

## 🔴 UNVERIFIED — playtest needed

- [ ] **30 new cards** — playtest each in alternate decks, verify apply logic + floats + logs
- [ ] **Deck selection UI** — verify all 5 decks appear on menu, unlock gates work correctly
- [ ] **Per-deck boss HP** — verify hpScale applies to ALL fight types (regular, boss, WTH, Lucifer phases)
- [ ] **Deck = 69** — verify all 5 decks build at exactly 69 cards in-game
- [ ] **Cold open splash** — clear localStorage, hard reload, confirm splash fires on first boot
- [ ] **Weed leaf PNG** — spot-check it renders everywhere 🌿 used to

---

## ✅ SHIPPED THIS SESSION (April 17 2026)

### Card Rebalance — Direct Damage → Permanent ATK Buffs
- [x] Sound Wall: flat dmg → +1 ATK perm ALL members
- [x] Mosh Pit: per-member dmg → +1/+2 ATK perm all (4+ alive = +2)
- [x] Crowd Surf: hand×3 dmg → +1 ATK perm per card in hand
- [x] Heavy Riff: 50% ATK dmg → half target ATK perm, MAX +20
- [x] Herb Money: deal stash dmg → spend 10 stash, +3 ATK perm

### 30 New Cards (for alternate decks)
- [x] RIFF: Echo Pedal, Riff Thief, Feedback Scream, Skull Splitter, Doom Chord, Blood Harmony, Sonic Boom, Tremolo Pick, Harmonic FB, Shred Solo, Overdrive Pedal, Devil's Dice, Necrotic Amp
- [x] CORRUPT: Soul Bargain, Venom Riff, Offering Pit, Cursed Strings, Hex of Decay, Infernal Pact, Carrion Call, Possession Riff, Dark Crescendo, Russian Roulette
- [x] UTILITY: Gear Check, Setlist Rewrite, Backstage Pass, Venue Swap, Double Booking, Bootleg Copy
- [x] EMBER: Second Wind, Pyromaniac, Slow Burn, Amp Feedback, Drain the Crowd, Corruption Siphon

### 5 Decks (69 cards each, calibrated)
- [x] ⛧ Standard: 32 RIFF / 18 CORRUPT / 10 UTIL / 9 EMBER → 10.66% WR
- [x] 🎸 Shredder: 38 RIFF / 10 CORRUPT / 8 UTIL / 13 EMBER → 8.06% WR
- [x] 💀 Ritualist: 21 RIFF / 26 CORRUPT / 11 UTIL / 11 EMBER → 7.16% WR
- [x] 🔧 Engineer: 24 RIFF / 13 CORRUPT / 18 UTIL / 14 EMBER → 5.22% WR
- [x] 🛡️ Survivor: 25 RIFF / 15 CORRUPT / 15 UTIL / 14 EMBER → 4.88% WR

### Boss HP Calibration (27 bosses individually tuned)
- [x] Per-boss HP from 50K simulation
- [x] Per-deck HP scaling via hpScale factor
- [x] Lucifer fix: was unkillable (hardcoded HP bypassed override), now 100K HP
- [x] 41% of arrivals beat Lucifer at 100K (reaching him is an achievement)

### Card Math Cleanup (no more weird division)
- [x] Death Riff: 60×(1-corr/100) dmg → ALL +2 ATK perm, +10% corruption
- [x] Feedback Loop: corr÷2 dmg → +2 ATK perm (+4 at ≥50% corruption)
- [x] Dark Tuning: corr÷12 → 2 random +1 perm (3 at ≥70% corruption)
- [x] Amp the Static: corr÷12 → +2 temp ATK (+4 at ≥50% corruption)
- [x] Seance: corr÷4 heal → heal 3 (heal 6 at ≥50% corruption)
- [x] Feedback Scream: HP loss based → +4 ATK perm, -2 HP
- [x] Possession Riff: corr÷10 → +20 ATK this strike, +10% corruption
- [x] Venom Riff: DOT tracking → +3 ATK perm, +5% corruption

### State Tracking + Polish
- [x] Echo Pedal / Riff Thief: adds card copy to hand for free play
- [x] Slow Burn: slowBurnStrikes per-strike ember tracking
- [x] Amp Feedback: ampFeedbackDiscount, next RIFF costs -1
- [x] Pyromaniac: spend all embers = +3 ATK all at strike time
- [x] Per-fight state reset (slowBurn, ampFeedback, pyromaniac)
- [x] Deck unlock achievements (beat_standard, beat_shredder, etc.)
- [x] P5 passive description updated for new Sound Wall/Heavy Riff mechanics
- [x] Scratch files removed (7 files, -2,704 lines)
- [x] .gitignore updated for sim scratch patterns

---

## 🎸 ROCKSTAR POLISH (top-priority pass — "make it feel published by Rockstar")

Ranked by ship-impact per line of code:

### Tier 1
- [x] 🎤 **Pre-fight loading screen** w/ random tour quote — 30 quotes, 2.2s overlay, enemy name + passive + circle + quote
- [ ] 🎵 ~~Diegetic music tied to game state~~ — **JV's lane (audio)**

### Tier 2
- [ ] 📖 **Character bios on hover** — musicians + bosses get backstory blurbs
- [ ] 📓 **TOUR DIARY tab** on main menu — cumulative stats styled as hand-written tour journal
- [ ] 🎞️ **Run replay system** — 30s timelapse of key moments at game end

### Tier 3
- [ ] ✨ **Particle physics everywhere** — ember trails, damage splatter, card-shuffle dust
- [ ] 📸 **Achievement Polaroids** — slide in from edge, hand-scrawled, vinyl-skip SFX
- [ ] ⏸️ **Real pause menu** — Cmd+P drawer, vinyl-warp audio ducking

### Tier 4
- [x] 🎫 **"Press any key" boot screen** — flickering venue marquee, light bulbs, auto-dismiss 4s or any key
- [x] 🎬 **Credits roll** — full cinema scroll after Lucifer kill, every role by Hired Heist, Sly on merch, click to skip

---

## 🟡 QoL QUEUE (open items — impact-ordered)

### Combat Flow
- [x] **Ember forecast — hover dims pips to show remaining (already shipped)**
- [ ] **Undo last card play** — one-step within same strike
- [x] **Hand size indicator** — "X/Y" at top of card fan, gold pulse at overcap
- [x] **Fast-forward HOLD spacebar — already shipped (space key held = fast mode)**

### Visual Feedback (juice)
- [x] **Victory fanfare — clutchFlash system: "⛧ VICTORY ⛧" / "SOLO VICTORY" / "BY THE SKIN"**
- [ ] **Boss HP drain animation** — smooth countdown, not instant jump
- [x] **Card upgrade shimmer — upgradeShimmer keyframe on upgraded cards**
- [ ] **Member portrait shake** on hit
- [ ] **Boss low-HP desperation glow**
- [ ] **Mentor link visual chain**
- [ ] **Riff chain warning glow** on hand cards about to chain
- [x] **"+×3 ATK active" badge** — shows ×X.XX CHAIN (gold) and/or +N TEMP ATK (purple) above damage preview when live

### Information & Clarity
- [x] **Pact icons in combat — footer row with hover tooltips**
- [x] **Boss telegraph** — "NEXT: X DMG → target" + special effects, live-calculated under boss name
- [x] **Card count remaining — DECK/DISC counters above card fan** — "2 left in deck" on hover
- [x] **Discard pile preview — click DISC counter to see pile (already shipped)**
- [ ] **Drug pin tape marks** — zine-feel attachment detail

### Quality of Life
- [x] **Auto-sort preference persists to localStorage**
- [x] **Bulk discard — select multiple then discard all (already shipped)**
- [x] **Run timer** — MM:SS elapsed time on end screen stats grid
- [ ] **"Why did I die?" tooltip** — brief analysis on death screen
- [x] **Screen transitions — 350ms fade flash on state changes (already shipped)**
- [ ] ~~Mute hotkey (M)~~ — **JV's lane (audio)**
- [ ] ~~Corruption milestone audio~~ — **JV's lane (audio)**

---

## 🟠 UI / DESIGN REMAINING

- [ ] Font sizing consistency pass across all UI
- [ ] Color consistency — too many slightly-different gold/amber shades
- [ ] Mobile/touch considerations for quick-play
- [ ] Artifact tray on left — verify it feels connected to battle area post-cockpit-refactor

---

## 🟢 ANIMATIONS (PixelLab, separate workflow)

- [ ] Boss idle animations (29 bosses)
- [ ] Boss death animations (29 bosses)
- [ ] Member attack/strike animations (18 members)
- [ ] Member "too stoned" animations (18 members)

---

## 🧹 TRIVIAL CLEANUP

- [x] `vestibule-sim.js` console banner prints v19.1 (synced with header) — done in 3cd795f→next

---

## ✅ COMPLETED (recent — post-Session 19)

### Bug fixes + polish (Roadie session, April 17)
- [x] 🔴 BUG: `copies||2` treated `copies:0` as falsy — corruption threshold cards (Dark Whisper, Hungering Flame, Madness Unleashed) got 2 copies in starter deck instead of 0. Deck was 73, now 69 with all unlocks.
- [x] Demo Tape copies 1→2, Soundboard copies 1→2 to hit 69 target (base 66 + 3 unlockable)
- [x] Member keyword tooltip + recruit/shop desc: ScratchFont → MBScribblesFont for readability
- [x] Hand size indicator (X/Y pill, gold pulse at overcap)
- [x] Boss telegraph (live NEXT: X DMG → target + special effects)
- [x] Run timer (MM:SS on end screen)
- [x] Active buff badges (×CHAIN gold + +TEMP ATK purple above damage preview)
- [x] JV's lanes declared (audio + PixelLab anims — do not touch from chat)
- [x] TODO + CLAUDE.md synced to reality + doc-on-every-commit rule
- [x] Sim banner v17.1→v19.1

### Cold open + polish pass (51f819e)
- [x] Cold open splash screen
- [x] Weed leaf PNG component (replaces 🌿 emoji)
- [x] Strike fly-to-boss animation fix

### Victory + map (56d0b8e)
- [x] End-of-fight summary popup
- [x] DESCENT: tarot-card map redesign

### Shop (b2ad579, 51d5a07, df0621b)
- [x] Pokemon-style pack tear-open animation
- [x] Shop layout overflow fix
- [x] Sly the Fence pass 2 (porn-stache energy)
- [x] Pack purchase limit + full shop redesign

### Keyboard shortcuts (d73e78e, 13e19bb)
- [x] S / D / 1-6 hotkeys firing correctly (stale closure fix via refs)
- [x] Tier 4 BEAST tier hype visuals

### Strike panel (96654db, d8c7224, b05dac3)
- [x] Damage preview correctness fix
- [x] Live damage preview under STRIKE (every mult tick visible)
- [x] Layout restructure, BLACK METAL banner, EMBERS label
- [x] Dynamic pips, card legibility pass

### Ritual altar design system (a103d00 → 5b4c456, ~12 commits)
- [x] Unified cockpit altar panel
- [x] Rune-circle boss + ritual platform stage slots
- [x] Tarot treatment cards w/ wax seal embers
- [x] Mercury tube thermometer + ribbon banner
- [x] Frieze visibility + panel spacing + Combined Attack
- [x] Ink stamp flashes + bone-white ember display
- [x] Circle splash design pass
- [x] Stash/ember floats
- [x] Keyword tooltip fix

### Session 19 (Apr 14-15) — sprites, balance, tutorial
- [x] All 18 member sprites + 29 boss sprites wired
- [x] All 18 idle GIF animations wired
- [x] Lucifer phase swap (P1 Baphomet → P2 Lord of Flies)
- [x] Grimnir replaces Nott (masked vocalist, DEBUFF)
- [x] 3 scripted tutorial fights + first-encounter tips
- [x] Card balance: Dial to Eleven, Smoke Break, CORRUPT, Sabbath Offering
- [x] Circle I/II HP bumps, Circle III heal buff
- [x] 69-card deck + Corruption deck (Dark Whisper, Blood Price, Void Pact)
- [x] Madness card loss 15% → 20%
- [x] Sim v19.1 synced
- [x] 9 UX items: genre approaching, boss tagline, best run, death screen stats, speed toggle, collapsible footer, progressive rules, tabbed shop, deck peek
- [x] Circle-themed backgrounds (9 unique)
- [x] Corruption vignette, chain pulse, boss fracture
- [x] Ghost preview on drag

---

## SIM DATA (post-rewrite calibration, 5K per deck)

| Deck | hpScale | Win Rate | Target |
|------|---------|----------|--------|
| ⛧ Standard | 0.74 | 10.60% | 10% |
| 🎸 Shredder | 0.79 | 8.06% | 8% |
| 💀 Ritualist | 0.81 | 7.48% | 7% |
| 🔧 Engineer | 0.85 | 5.52% | 6% |
| 🛡️ Survivor | 0.88 | 4.68% | 5% |

### Card Design Rules (established this session)
- Permanent ATK buffs > direct damage (creates member attachment, compounds, scales)
- No division math in card effects (use thresholds: ≥40%, ≥50%, ≥70%)
- Every card does ONE thing simply
- Ember generation needs REAL costs (corruption, HP, tempo)
- 420 (stash cap, card height) and 69 (deck size) are sacred numbers

---

## 🃏 CARD RETHINK — MOSTLY ADDRESSED

**Status:** 30 new cards shipped, 8 cards rewritten to remove math, perm-buff philosophy established. Ember cards now have real costs (Corruption Siphon +8% corr, Drain the Crowd -2 HP, Pyromaniac conditional).

### Remaining Ideas (from CARD_IDEAS.md)
- [ ] RITUAL card type — multi-turn setups, countdowns, delayed nukes (not yet implemented)
- [ ] EMBER OVERFLOW — excess embers convert to damage (not yet implemented)
- [ ] MYTHIC INTERACTIONS — 4-5 card combos for ×50+ damage (partially via Echo Pedal chains)

---

## 💎 NEW QoL IDEAS (Roadie brainstorm)

### Combat Feel
- [ ] Damage number size scales with damage amount (10 = small, 100+ = HUGE)
- [ ] Strike counter typography gets more dramatic each strike (bigger, redder, shakier)
- [ ] Cards played this strike shown as ghostly trail/stack near strike button
- [ ] Brief screen dim between strikes for dramatic beat/pacing
- [ ] Boss kill quote appears with typewriter effect instead of instant
- [ ] Visible deck reshuffle animation when draw pile empties

### Information
- [ ] Corruption trajectory warning ("at this rate, 100% in 2 fights")
- [ ] Deck viewer button during combat (see full deck contents sorted by type)
- [ ] Card compare tooltip in shop (this card vs what's in your deck)
- [ ] Combo discovery log (list of chains found this run, visible in pause menu)
- [ ] Boss kill counter visible during fight ("3rd time fighting The Shade")

### Shop / Meta
- [ ] Quick-restart button on death screen (skip stats, straight to new run)
- [ ] "Last run" comparison on end screen (did better/worse than previous)
- [ ] Win streak fire border on main menu
- [ ] Daily challenge mini-leaderboard

### Visual Flair
- [ ] Card foil holographic shimmer on hover (enhanced version of current)
- [ ] Enemy intro animation (portrait slides in from side with name slam)
- [ ] Member death: dramatic fade + skull icon + brief slow-mo
- [ ] Corruption visual escalation: screen edges redden, text starts glitching at 80%+
- [ ] Boss portrait cracks deepen as HP drops (expand existing fracture system)
- [ ] Combo name display scales with chain multiplier (bigger chains = BIGGER text)
- [ ] Card shuffle dust puff when deck reshuffles
- [ ] Stash earned sparkle trail when gaining stash
- [ ] Victory screen confetti/embers rain
- [ ] Pact selection: dramatic reveal with smoke/ember effect

---

## 🧠 COMBO SYSTEM OVERHAUL — Balatro-style "break the game" moments

**Current state:** Riff Chains give ×1.78 multiplier. Linear, predictable, no exponential scaling. No "holy shit" moment. No reason to screenshot your run.

**Target:** 5 tiers of combo discovery, each ~3× damage of the last. Players should chase mythic combos across dozens of runs.

### Combo Systems to Implement (details in CARD_IDEAS.md)
- [ ] **ECHO / REPLAY** — cards that replay previous cards. Echo + Echo + big card = exponential.
- [ ] **COPY / DUPLICATE** — Bootleg Tape copies cards in hand. Copy the copier = brain melting.
- [ ] **MULTIPLIER STACKING** — cards that multiply the strike multiplier (currently only chains do this).
- [ ] **CORRUPTION AS POWER** — 100% corruption should feel GODLIKE not just scary. Dark Crescendo triples mult at 80%+.
- [ ] **SACRIFICE LOOP** — kill members for power, revive them stronger, repeat.
- [ ] **EMBER OVERFLOW** — excess embers convert to damage or ATK. Ember decks become a damage strategy.
- [ ] **MYTHIC INTERACTIONS** — 4-5 card combos that do 200× damage. Extremely rare, endlessly chased.

### Combo Discovery Tiers
- [ ] Tier 1 (2-card, common): ×1.78 chains — already exists, baseline
- [ ] Tier 2 (3-card, moderate): ~×5 damage — requires deck building awareness
- [ ] Tier 3 (4-card, rare): ~×15 damage — requires specific artifacts + cards
- [ ] Tier 4 (5-card, mythic): ~×50 damage — once-in-50-runs, screenshot-worthy
- [ ] Tier 5 (god run): ×200+ damage — everything aligns, 10K+ damage single strike, post on Reddit

### Combo Tracking / Reward
- [ ] Combo discovery log (track what combos players have found)
- [ ] Hidden achievement per mythic combo discovered
- [ ] Combo name + damage flash on screen when triggered (bigger = flashier)
- [ ] End-of-run "Best Combo" stat with replay of the moment
