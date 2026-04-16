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
- [ ] 🎫 **"Press any key" boot screen** — flickering venue marquee ("VESTIBULE TONIGHT — DOORS 8PM")
- [x] 🎬 **Credits roll** — full cinema scroll after Lucifer kill, every role by Hired Heist, Sly on merch, click to skip

---

## 🟡 QoL QUEUE (open items — impact-ordered)

### Combat Flow
- [ ] **Ember forecast** — hovering card dims pips to show remaining
- [ ] **Undo last card play** — one-step within same strike
- [x] **Hand size indicator** — "X/Y" at top of card fan, gold pulse at overcap
- [ ] **Fast-forward HOLD spacebar** — speed up while held

### Visual Feedback (juice)
- [ ] **Victory fanfare** — golden burst + "VICTORY" slam when boss dies
- [ ] **Boss HP drain animation** — smooth countdown, not instant jump
- [ ] **Card upgrade shimmer** — persistent golden pulse on upgraded card borders
- [ ] **Member portrait shake** on hit
- [ ] **Boss low-HP desperation glow**
- [ ] **Mentor link visual chain**
- [ ] **Riff chain warning glow** on hand cards about to chain
- [x] **"+×3 ATK active" badge** — shows ×X.XX CHAIN (gold) and/or +N TEMP ATK (purple) above damage preview when live

### Information & Clarity
- [ ] **Pact icons in combat** — small row of active pact icons visible
- [x] **Boss telegraph** — "NEXT: X DMG → target" + special effects, live-calculated under boss name
- [ ] **Card count remaining** — "2 left in deck" on hover
- [ ] **Discard pile preview** — click/hover to see what's in there
- [ ] **Drug pin tape marks** — zine-feel attachment detail

### Quality of Life
- [ ] **Auto-sort preference** — persist hand sort in localStorage
- [ ] **Bulk discard** — select multiple then discard all at once
- [x] **Run timer** — MM:SS elapsed time on end screen stats grid
- [ ] **"Why did I die?" tooltip** — brief analysis on death screen
- [ ] **Screen transitions** — 0.3s crossfade between fight/shop/event/descent
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
