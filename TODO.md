# VESTIBULE — TODO & STATUS

**Latest commit:** 51f819e (cold open splash + weed leaf PNG + strike fly-to-boss fix)
**Sim version:** v19.1 (10K Bronze: 9.67% win rate)
**App.jsx:** 7,935 lines
**Last doc refresh:** post-51f819e

> 🔒 **DOC RULE:** Every commit that changes code MUST update TODO.md (and CLAUDE.md if rules/architecture change) in the SAME commit. No exceptions. Stale docs = wasted sessions re-discovering what's done.

> 🎸 **JV'S LANES (Claude: DO NOT TOUCH):** All audio work (diegetic music system, victory sfx, corruption milestone audio stings, mute controls, SFX balance) + all PixelLab animations (boss idle/death, member attack/"too stoned"). These ship last, by JV, on original music. If people want to mute, they can fuck themselves.

---

## 🔴 UNVERIFIED — confirm before building on top

- [ ] **Cold open splash** — clear localStorage, hard reload, confirm splash fires on first boot (shipped in 51f819e)
- [ ] **Weed leaf PNG** — spot-check it renders everywhere 🌿 used to (shop, stash counter, drug pins, card effects)
- [ ] **Strike fly-to-boss animation** — confirm card travels cleanly to boss on STRIKE
- [ ] **Shop bottom-of-list items** — verify no cutoff after pack tear animation fix (b2ad579)
- [ ] **Deck = 69** — verify draw 6 hand + 63 remaining (or +unlocks: 66 base, 69 full)

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

## SIM DATA (v19.1, 10K Bronze)

| Stake | Win Rate | Avg Fight |
|-------|----------|-----------|
| Bronze | 9.67% | 18.81/26 |
| Silver | 9.96% | 15.64/26 |
| Gold | 9.06% | 14.87/26 |
| Obsidian | 9.60% | 17.03/26 |
| Blood | 7.06% | 7.74/26 |
| Demonic | 0.38% | 1.66/26 |

### Survival Curve (Bronze)
- C1: 9.0% deaths (healthy)
- C2–C4: <1% each
- C5: 2.6%
- C6: 13.9% (the wall)
- C7: 30.3%
- C8–9: steep ramp to Lucifer

### Card Balance
All 69 starter cards SOLID or STRONG. No dead cards.
Lowest: Smoke Break 1.99/g, Setlist 1.96/g.
Record Deal (0.20/g) is a boss mechanic, not player card.

---

## 🃏 CARD RETHINK (review CARD_IDEAS.md)

**Core problem:** Ember cards dominate. Playing "generate embers → spend embers" is the only viable strategy. Ember generation has zero cost — Tapped Out is literally free money.

**Fix direction:** Ember generation needs REAL costs (HP, corruption, tempo, card disadvantage). Non-ember strategies need to be viable.

### New Cards to Review (52 in CARD_IDEAS.md)
- [ ] 12 RIFF cards — damage scaling, keyword synergy, combo rewards
- [ ] 12 CORRUPT cards — high risk/reward, corruption-as-weapon, revival
- [ ] 12 UTILITY cards — card advantage, positioning, flexibility
- [ ] 8 EMBER cards — reworked with meaningful costs (HP, corruption, max ember loss, tempo)
- [ ] 5 RITUAL cards — NEW TYPE: multi-turn setups, countdowns, delayed nukes
- [ ] 3 GAMBLE cards — NEW TYPE: d6 RNG with big swings

### Ember Economy Redesign
- [ ] Audit current ember cards: Tapped Out, Power Tap, Static Charge, Groupie, Soundboard
- [ ] Add costs to each: corruption tax, HP sacrifice, max ember shrink, or tempo delay
- [ ] Test: "running out on strike 3 sucks" — generation must exist but feel like a CHOICE
- [ ] Diminishing returns? First ember card per strike = full value, second = half?
- [ ] Target: 9-10% Bronze win rate after changes

### Weak Cards to Buff or Replace
- [ ] Dial to Eleven (0.99/copy) — corruption cost too scary for +3 ATK
- [ ] Setlist (0.99/copy) — niche, rarely worth the slot
- [ ] Smoke Break (0.99/copy) — card loss too punishing for +3 embers

### Potential New Card Types
- [ ] RITUAL type — multi-turn investments (Summoning Circle, Blood Tithe, Doom Clock)
- [ ] GAMBLE type — d6 rolls with exciting variance (Devil's Dice, Russian Roulette)
- [ ] Should these be subtypes of existing types or standalone?

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
