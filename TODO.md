# Vestibule — Master TODO
*Updated end of Session 6. Read CLAUDE.md for full project context.*

---

## ✅ COMPLETED — Sessions 1-6

### Sessions 1-4: Foundation
- [x] Full 9-circle enemy progression (27 enemies, all passives and death quotes)
- [x] Complete card system (37 unique card types, per-card copy counts)
- [x] All keywords: FRENZIED, DOUBLE TIME, ANCHOR, CORRUPT, DEBUFF
- [x] Hellquake d10 system (10 wild outcomes)
- [x] Corruption visual system (chroma, VHS drift, interlace at high corruption)
- [x] The Remaster modal, Setlist drag-to-reorder, Demo Tape
- [x] All hand card interactions (hover, drag-to-reorder, z-index)
- [x] Full Stash economy (perfect strike bonus, merch drop, corruption dividend)

### Session 5: Deck Expansion
- [x] 9 new cards added (Distortion, Séance, Static Charge, Dark Tuning, Power Tap, Soundboard, Setbreak, Heavy Riff, Resonance)
- [x] Resonance mechanic (duplicate in hand = auto-discard + 1 ember)
- [x] Balance fixes: Feedback Loop ÷2, Death Riff capped, Amp the Static rebalanced
- [x] Opening Night redesigned with keyword badges + 4×2 ability grid

### Session 6 — The Mega Push
- [x] **Push A:** Circle I HP 27/42/69, Lucifer 420,666 HP, Circles 4-9 HP scaled, Overdrive >=60%, Nott -2x debuff, card improvements, DOUBLE TIME d6 with die badge, Herb Money + Going Broke, Stash cap 420, circle-scaled rewards, 69% corruption dividend
- [x] **Push B:** Shop redesign — 5 booster pack tiers, 3 recruit tiers, pawn shop, circle-scaling stock, member appearances in card slots
- [x] **Push C:** 10 starter artifacts (A1-A10) + 10 starter passives (P1-P10), all implemented, active panel on battle screen
- [x] **Push D:** Boss kill quotes (27), discovery floats, streak tracker, daily seed + worldwide challenge, foil badge + ember discount, end screen overhaul with 2-col stats
- [x] Vitalik the Dark Minstrel (FOLK MAGIC, 6/9, 20% ember refund)
- [x] 8 new members: Sigrid+Gunnar (SHREDDER), Astrid (DEBUFF), Freya (CORRUPT), Ulf+Brynja (ANCHOR), Rolf (DOUBLE TIME), Orm (HEXED)
- [x] 2 locked mystery cards (🔒 "Can you find the key?"), max 1 shown per Opening Night
- [x] Random 8-member Opening Night from pool of 18
- [x] Opening Night pulse animation + blood red title

---

## 🔴 IMMEDIATE — Shop Screen Review
*Just reached the shop for first time. Current active task.*

- [ ] Full visual and UX review of shop layout
- [ ] Card slot sizing and readability
- [ ] Artifact / passive section clarity
- [ ] Pawn shop UX
- [ ] Booster pack tier visibility and pricing display
- [ ] Stash display and cap warning
- [ ] General polish pass

---

## 🟠 HIGH PRIORITY

### ATK Snowball / Cap
- [ ] Run 500k sim with all Push A-D changes active
- [ ] Determine correct ATK cap per member from data (no hard number yet)
- [ ] Implement cap with visual indicator on member cards

### Unlockable Artifacts A11-A20 (designed, not coded)
- [ ] A11 Lucifer's Pick — reach Circle VI — lead guitarist triple ATK on first Strike
- [ ] A12 Dark Matter Amp — beat game once — all CORRUPT cards -1 Ember
- [ ] A13 Soul Chains — all-stoned and survive — all members revive at 1 HP
- [ ] A14 Blood Strings — 500+ single Strike — New Strings gives +3 ATK permanently
- [ ] A15 The Third Eye — 5 Hellquakes — boss passive revealed + disabled first Strike
- [ ] A16 Bone Microphone — run with Nott — DEBUFF stacks -3 per Strike
- [ ] A17 The Sacred Herb — 150+ stash in one run — each circle: +1 max HP all + 2 Embers
- [ ] A18 The Mask — use all 7 members in 5+ runs — one member gains second keyword
- [ ] A19 The Void Pedal — win spending 0 stash — name any card, guaranteed in hand
- [ ] A20 Pentagram Capacitor — OBLITERATION 3 times — Sigil rolls 2d10, both apply

### Unlockable Passives P11-P20 (designed, not coded)
- [ ] P11 Cursed Demo — reach Circle V — at 69%+ Corruption, damage +20%
- [ ] P12 Ouija Board — 3 Hellquakes in one run — Black Sabbath Sigil costs 0 Embers
- [ ] P13 Whammy Bar — buff one member 5+ times in one fight — Amp It Up permanent for fight
- [ ] P14 Pentatonic Riff — play 50 RIFF cards — draw 1 extra card per Strike start
- [ ] P15 Smoke Machine — survive 90%+ Corruption — at 80%+, all members +2 ATK
- [ ] P16 The Reissue — delete 10+ with Remaster in one run — Remaster copies 2, deletes 3
- [ ] P17 Ritual Circle — complete Circle VI — at 0% corruption: +3 Embers + 10 dmg pre-fight
- [ ] P18 666 Hz — deal exactly 66 or 666 damage — Feedback Loop playable twice per fight
- [ ] P19 Dead Wax — win with 0 deletions — full reshuffle → 5 damage to boss
- [ ] P20 Mythic Riff — beat game 3 times — random opening hand card doubled

---

## 🟡 MEDIUM PRIORITY

### Foil / Mythic Full Implementation
- [ ] Foil pack drop logic (8% from any card pack) — badge exists, drop rate not wired
- [ ] Mythic pack drop logic (2% from Rare Vinyl only) — badge exists, upgrades not coded
- [ ] 15 defined Mythic card upgrades (see CLAUDE.md for full list)
- [ ] Going Broke Foil = ×2, Mythic = ×6 (approved, not coded)
- [ ] Pack opening screen / dramatic reveal moment

### Collection / Unlock Screen
- [ ] New game state: `collection`
- [ ] 18 members shown (locked = dark silhouette + cryptic unlock hint)
- [ ] 37 cards shown (undiscovered = dark outline)
- [ ] All artifacts + passives shown
- [ ] Run history (last 5 runs: seed, circle, cause of death)
- [ ] Lifetime statistics

### Font Swap
- [ ] Owner will provide TTF for IM Fell English replacement (hard to read at small sizes)
- [ ] Owner will provide TTF for UnifrakturMaguntia replacement (more metal)
- [ ] Process: `public/fonts/`, @font-face in App.css, find/replace font-family in App.jsx

---

## 🟢 FUTURE / POLISH

- [ ] Mythic card animation (void/flame on card art)
- [ ] Foil card animation (gold shimmer border — badge exists, CSS animation not yet)
- [ ] Daily challenge leaderboard (button exists, no backend)
- [ ] Settings menu (volume, accessibility, seed input)
- [ ] Steam page + card artwork (real illustrations to replace emojis eventually)
- [ ] Mobile / responsive pass

---

## 📊 Simulation Benchmarks

| Metric | Pre-Push A | Post-Push A |
|---|---|---|
| Overall win rate | 6.07% | 0.05% (Lucifer too hard now — need artifacts/passives live to recheck) |
| Circle I kills | 86.67% | 85.01% (marginal improvement — ATK cap will help more) |
| Lucifer death rate | 93.64% | 93.64% |
| Best starting combo | Ingrid+Thor 18.66% | TBD after cap |
| Avg ATK at win | 5,225 | 296,142 (snowball worse — cap urgently needed) |

*Sim script lives at `/tmp/sim500k.js` — run after any major balance change*

---

## 🔧 Key Numbers (never change without good reason)

| Value | Number | Why |
|---|---|---|
| Stash cap | 420 | Cultural |
| Lucifer HP | 420,666 | 420 + 666 |
| Wanderer HP | 27 | Cool number |
| Lost Soul HP | 42 | Cool number |
| Drifter HP | 69 | Cool number |
| Corruption dividend | 69% | Thematic |
| Max Embers | 8 | +1 per circle boss |
| Artifact slots | 3 | Approved limit |
| Passive slots | 5 | Approved limit |
| Stage slots | 5 | Band size |
| Opening Night pool | 18 total | Shows 7+1 per run |
