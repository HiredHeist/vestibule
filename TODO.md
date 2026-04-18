# VESTIBULE — TODO & STATUS

**Latest commit:** (genre removal + sim recalibration + Tier 1-3 polish)
**Sim version:** v19.2 (genre removed, recalibrated: 10%/8%/7%/6%/5%)
**App.jsx:** ~8,540 lines
**Last doc refresh:** post-a602191 (end of April 17 megasession)

> 🔒 **DOC RULE:** Every commit that changes code MUST update TODO.md (and CLAUDE.md if rules/architecture change) in the SAME commit. No exceptions. Stale docs = wasted sessions re-discovering what's done.

> 🎸 **JV'S LANES (Claude: DO NOT TOUCH):** All audio work (diegetic music system, victory sfx, corruption milestone audio stings, mute controls, SFX balance) + all PixelLab animations (boss idle/death, member attack/"too stoned"). These ship last, by JV, on original music.

---

## 🔴 PLAYTEST NEEDED — verify before building on top

- [ ] **30 new cards** — playtest each in alternate decks, verify apply logic + floats + logs
- [ ] **Deck selection UI** — verify all 5 decks appear on menu, unlock gates work
- [ ] **Per-deck boss HP** — verify hpScale applies to ALL fights (regular, boss, WTH, Lucifer)
- [ ] **Deck = 69** — verify all 5 decks build at exactly 69 cards in-game
- [ ] **Cold open splash** — clear localStorage, hard reload, confirm splash fires
- [ ] **Weed leaf PNG** — spot-check it renders everywhere 🌿 used to

---

## 🎯 NEXT MAJOR: Balatro-Style Combo Overhaul

Genre system removed (was noise, not strategy). Next priority is multiplicative combo system:

- [ ] **Artifacts → Jokers** — multiplier-based triggers, not flat stat buffs
- [ ] **Chain stacking** — fire 2+ chains = multiply (×1.78 × ×1.78 = ×3.17)
- [ ] **Strike mult scales harder** — ×1.1 per card played, not +0.05
- [ ] **Corruption = power** — every 20% corruption = ×1.2 base multiplier
- [ ] **Card types = flavor only** — no mechanical system on top of types
- [ ] Kill all additive clutter, make everything multiplicative

Goal: experienced players feel like they "broke the game" with the right artifact combo.
New players struggle to reach Circle 5 until they unlock the cards that enable big combos.

---

## 🟠 NEXT UP — priority work for next session

### UI / Design Polish
- [x] Font sizing — consistent across element types (checked, acceptable)
- [x] Color consistency — --gold:#e8a820, --gold-dim:#c8a040, --gold-dark:#c87820
- [ ] Artifact tray on left — verify it feels connected to battle area
- [ ] Mobile/touch considerations for quick-play

### Rockstar Polish (Tier 2-3)
- [x] 📖 **Character bios on hover** — 18 musician bios + 27 boss bios in tooltips
- [ ] 📓 **TOUR DIARY tab** on main menu — cumulative stats as hand-written tour journal
- [ ] ⏸️ **Real pause menu** — Cmd+P drawer, vinyl-warp audio ducking
- [ ] ✨ **Particle physics** — ember trails, damage splatter, card-shuffle dust
- [ ] 📸 **Achievement Polaroids** — slide in from edge, hand-scrawled

### Combat Feel
- [x] Damage number size scales with amount (20→3.5rem, 100→5.5rem, 500+→8rem)
- [x] Strike counter dramatic — bigger/redder/shakier at 2 and 1 strikes left
- [ ] Cards played this strike shown as ghostly trail near strike button
- [ ] Brief screen dim between strikes for dramatic pacing
- [x] Boss kill quote typewriter — letter by letter with cursor, fades after 3.5s
- [ ] Visible deck reshuffle animation when draw pile empties

### Information & Clarity
- [ ] Corruption trajectory warning ("at this rate, 100% in 2 fights")
- [x] Deck viewer button during combat — click DECK pile, 4 columns by type (already existed)
- [x] Card compare in shop (IN DECK: X / NEW CARD badge on shop cards's in your deck)
- [ ] Combo discovery log (chains found this run, visible in pause menu)
- [ ] Boss kill counter visible during fight ("3rd time fighting The Shade")

### Shop / Meta
- [x] Quick-restart button on death screen — ⚡ Quick Restart on loss
- [x] Last run comparison on end screen — VS LAST RUN score/damage diff
- [ ] Win streak fire border on main menu
- [ ] Daily challenge mini-leaderboard

### Visual Flair
- [ ] Card foil holographic shimmer on hover (enhanced)
- [x] Enemy intro animation — name slams from left, line draws, details stagger in
- [ ] Member death: dramatic fade + skull icon + brief slow-mo
- [x] Corruption visual escalation — red vignette + glitch + THE DARKNESS CONSUMES at 80%+
- [x] Boss portrait cracks deepen — SVG cracks at 50%, 35%, 20% HP tiers
- [x] Combo name scales with multiplier + shows ×X.XX DAMAGE
- [x] Card shuffle dust puff — 15 gold particles on reshuffle
- [x] Stash sparkle — already uses spawnParticles + green glow animation
- [x] Victory screen confetti/embers — 60 falling particles on every victory
- [x] Pact selection smoke — fog layers + staggered fadeSlideUp on cards

---

## 🔮 FUTURE — bigger features, nice-to-have

### Combo System Overhaul (Balatro-style)
- [ ] ECHO / REPLAY — Echo + Echo + big card = exponential
- [ ] COPY / DUPLICATE — Bootleg copies the copier = brain melting
- [ ] MULTIPLIER STACKING — cards that multiply strike multiplier
- [ ] CORRUPTION AS POWER — 100% = GODLIKE (Dark Crescendo ×3 exists)
- [ ] SACRIFICE LOOP — kill members for power, revive stronger, repeat
- [ ] EMBER OVERFLOW — excess embers convert to damage/ATK
- [ ] MYTHIC INTERACTIONS — 4-5 card combos for ×50+ damage

### New Card Ideas
- [ ] RITUAL card type — multi-turn setups, countdowns, delayed nukes
- [ ] EMBER OVERFLOW mechanic
- [ ] Combo discovery tiers (×5, ×15, ×50, ×200 damage)

### Other
- [ ] 🎞️ Run replay system — 30s timelapse at game end
- [ ] Combo tracking/reward log + hidden achievements

---

## 🎸 JV'S LANES (DO NOT TOUCH)

- [ ] 🎵 Diegetic music tied to game state
- [ ] Victory SFX + corruption milestone audio stings
- [ ] Mute hotkey (M) + SFX balance pass
- [ ] Boss idle animations (29 bosses)
- [ ] Boss death animations (29 bosses)
- [ ] Member attack/strike animations (18 members)
- [ ] Member "too stoned" animations (18 members)

---

## ✅ SHIPPED — April 17 2026 Megasession

### Card Rebalance — Direct Damage → Permanent ATK Buffs
- [x] Sound Wall, Mosh Pit, Crowd Surf, Heavy Riff (max +20), Herb Money

### Card Math Cleanup (no more weird division)
- [x] Death Riff, Feedback Loop, Dark Tuning, Amp the Static, Seance
- [x] Feedback Scream, Possession Riff (+20 ATK burst), Venom Riff (+3 perm)

### 30 New Cards + 5 Decks
- [x] 13 RIFF, 10 CORRUPT, 6 UTILITY, 6 EMBER — all with apply logic
- [x] Standard (10.6%), Shredder (8.1%), Ritualist (7.5%), Engineer (5.5%), Survivor (4.7%)
- [x] DECK_CARD_MANIFESTS, buildDeck with deck selection, STARTER_DECKS with unlock gates

### Boss HP + Balance
- [x] 27 bosses individually tuned via 50K simulation
- [x] Per-deck hpScale (0.74/0.79/0.81/0.85/0.88)
- [x] Lucifer 100K HP, 41% of arrivals beat him

### State Tracking
- [x] Echo Pedal/Riff Thief (card copy to hand), Slow Burn, Amp Feedback discount
- [x] Pyromaniac (spend all embers = +3 ATK all), per-fight state reset
- [x] Deck unlock achievements (beat_standard → Shredder, etc.)

### QoL (8/8)
- [x] Undo (Ctrl+Z), Boss HP drain, Member hit shake, Boss desperation glow
- [x] Mentor link chain, Riff chain glow, Drug pin tape marks, Death analysis

### Cleanup
- [x] 7 scratch files removed (-2,704 lines), .gitignore updated, P5 passive desc fixed

---

## ✅ SHIPPED — Earlier Sessions

### Session 19 (Apr 14-15)
- [x] All sprites + idle animations, Lucifer phases, tutorial, 69-card deck
- [x] 9 UX items, circle backgrounds, corruption vignette, ghost preview

### Earlier
- [x] Ritual altar design system, shop/victory/UI, keyboard shortcuts
- [x] Cold open splash, credits roll, boot screen, screen transitions

---

## SIM DATA

| Deck | hpScale | Win Rate | Target |
|------|---------|----------|--------|
| ⛧ Standard | 0.68 | ~10% | 10% |
| 🎸 Shredder | 0.73 | ~8% | 8% |
| 💀 Ritualist | 0.52 | ~7% | 7% |
| 🔧 Engineer | 0.58 | ~6% | 6% |
| 🛡️ Survivor | 0.58 | ~5% | 5% |

### Card Design Rules
- Permanent ATK buffs > direct damage
- No division math (use thresholds: ≥40%, ≥50%, ≥70%)
- Every card does ONE thing simply
- Ember generation needs REAL costs
- 420 (stash cap, card height) and 69 (deck size) are sacred
