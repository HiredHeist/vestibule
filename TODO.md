# VESTIBULE — TODO & STATUS

## Latest Session: April 15, 2026
**Latest commit:** 4acd218
**Sim version:** v19.1 (synced with game code)

---

## 🔴 PRIORITY 1 — UI CLEANUP (must fix before anything else)

The cockpit layout is functional but needs design polish to feel clean and professional.

### Battle Area
- [ ] Background needs more visual life — animated gradient shift, subtle particle/fog effects
- [ ] Boss section could be more compact / concert-poster style
- [ ] Stage slot member cards need design pass — sprite should dominate, text minimal at bottom
- [ ] Empty stage slots look barren — subtle placeholder art or darker treatment
- [ ] Artifact tray on left feels disconnected from the battle area

### Hand Area / Cockpit
- [ ] Left panel (discard + stats) spacing and alignment needs polish
- [ ] Right panel (strike) sizing and centering needs tuning
- [ ] Card fan overlap/spacing — cards feel cramped with the panels
- [ ] Card portrait area still has dead space below emoji — effect text too tall
- [ ] Hover zoom on cards may clip behind panels
- [ ] Corruption/genre indicators between battle and hand need cleaner positioning

### General
- [ ] Screen transitions between fight/shop/event/descent (currently instant swap)
- [ ] Font sizing consistency pass across all UI elements
- [ ] Color consistency — too many slightly-different gold/amber shades
- [ ] Mobile/touch considerations for quick-play

---

## 🟡 PRIORITY 2 — 20 QoL Improvements (impact-ordered)

### Combat Flow
- [ ] 1. **Damage preview on Strike button** — show estimated total live as you buff
- [ ] 2. **Ember forecast** — hovering card dims pips to show remaining
- [ ] 3. **Fight intro splash** — "CIRCLE V — ANGER" + enemy name slam (1s)
- [ ] 4. **Keyboard shortcuts** — S=Strike, D=Discard, 1-6=select cards, Space=speed
- [ ] 5. **Undo last card play** — one-step within same strike
- [ ] 6. **Hand size indicator** — "6/6" turns gold at overcap

### Visual Feedback (juice)
- [ ] 7. **Victory fanfare** — golden burst + "VICTORY" slam when boss dies
- [ ] 8. **Boss HP drain animation** — smooth countdown, not instant jump
- [ ] 9. **Stash change floats** — "+5 🌿" / "-3 🌿" on stash changes
- [ ] 10. **Screen transitions** — 0.3s crossfade between game states
- [ ] 11. **Card upgrade shimmer** — persistent golden pulse on upgraded card borders

### Information & Clarity
- [ ] 12. **Pact icons in combat** — small row of active pact icons visible
- [ ] 13. **Boss telegraph** — "NEXT: 6 DMG to weakest" shown on boss
- [ ] 14. **Card count remaining** — "2 left in deck" on hover
- [ ] 15. **End-of-fight summary** — 2s popup: damage dealt, cards played, chains

### Quality of Life
- [ ] 16. **Auto-sort preference** — persist hand sort in localStorage
- [ ] 17. **Bulk discard** — select multiple then discard all at once
- [ ] 18. **Run timer** — elapsed time on death/victory screen
- [ ] 19. **Corruption milestone audio** — dark tones at 25/50/75/100%
- [ ] 20. **"Why did I die?" tooltip** — brief analysis on death screen

---

## 🟢 PRIORITY 3 — Animations (PixelLab, separate chat)

- [ ] Boss idle animations (29 bosses)
- [ ] Boss death animations (29 bosses)
- [ ] Member attack/strike animations (18 members)
- [ ] Member "too stoned" animations (18 members)

---

## ✅ COMPLETED — Session 19 (April 14-15, 2026)

### Sprites & Wiring
- [x] All 18 member sprites (128x128 PixFlux) generated + wired
- [x] All 29 boss sprites generated + wired
- [x] All 18 idle GIF animations wired (auto-play idle, static during combat)
- [x] Lucifer phase swap (P1 Baphomet → P2 Lord of Flies)
- [x] Grimnir replaces Nott (masked vocalist, DEBUFF)
- [x] MEMBER_PORTRAITS, STAGE_PORTRAITS, IDLE_PORTRAITS, BOSS_PORTRAITS maps

### Tutorial System
- [x] 3 scripted fights with predetermined hands + tooltips
- [x] First-encounter tips (pacts, shop, events, descent)
- [x] Progressive UI hiding during tutorial

### Card Balance
- [x] Dial to Eleven: +3 ATK base, +4 upgraded (was +2/+3)
- [x] Smoke Break: draws 1 card after discard
- [x] CORRUPT keyword: +1 per 12% corruption (was 15%)
- [x] Sabbath Offering rework: deck thin + all members +1 ATK

### Balance & Pacing
- [x] Circle I HP bump: 50/75/110 → 65/95/140
- [x] Circle II HP bump: 100/150/220 → 145/210/310
- [x] Circle III heal buff: 2/3/6 → 3/5/8 per card played
- [x] 69-card deck: 4 rares moved to shop-only
- [x] Corruption deck: Dark Whisper (25%), Blood Price (50%), Void Pact (75%)
- [x] Madness card loss: 15% → 20%
- [x] Sim v19.1 synced

### UX Improvements (9 items)
- [x] Genre approaching indicator at 40%
- [x] Boss info: tagline shown, hover for passive
- [x] Best run tracking + descent map marker
- [x] Death screen: boss passive + run summary stats
- [x] Speed toggle (⚡2X) synced with localStorage
- [x] Collapsible stats footer
- [x] Progressive rules (NEW badges)
- [x] Tabbed shop (All/Cards/Packs/Gear)
- [x] Deck peek by type columns (RIFF/CORRUPT/UTILITY/EMBER)

### Visual Overhaul
- [x] Circle-themed battle backgrounds (9 unique color themes)
- [x] Corruption vignette (blood red edges, pulses at 75%+)
- [x] Chain pulse (golden burst on Riff Chain)
- [x] Boss near-death fracture (<10% HP)
- [x] Member card borders softened (shadows, not borders)
- [x] Ghost preview on drag ("+1 ATK" shown before dropping)

### Layout Refactors
- [x] Parchment background removed → dark transparent battle area
- [x] Stage divider removed
- [x] Cockpit layout: discard left, strike right, cards center
- [x] All info moved to left panel, strike-only right panel

### Polish
- [x] Fade unbuffed members during card phase (70% opacity)
- [x] Chain hints only after first chain discovered
- [x] Quick-play (tap card then tap member)
- [x] Damage breakdown auto-dismiss (1.5s)
- [x] Hand card portrait area enlarged (75→100px, emoji 40→52)
- [x] Stage slot sprite scaled up (85%/95%)

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
- C2: 0.9% deaths
- C3: 0.1% deaths
- C4: 0.7% deaths
- C5: 2.6% deaths
- C6: 13.9% deaths (the wall)
- C7: 30.3% deaths
- C8-9: steep ramp to Lucifer

### Card Balance
All 69 starter cards SOLID or STRONG. No dead cards.
Lowest: Smoke Break 1.99/g, Setlist 1.96/g.
Record Deal (0.20/g) is a boss mechanic, not player card.
