# Vestibule — To-Do List
*Priority ranked. Updated end of Session 4.*

---

## 🔴 P1 — DO NEXT SESSION (Blocks proper playtesting)

### Implement all unfinished cards
Every dead card in the deck breaks trust and feels like a bug. Fix these first.

- [ ] **Demo Tape** — track `lastRiffPlayed` in state, on play: re-cast that card free
- [ ] **Setlist** — modal overlay showing top 4 deck cards as draggable tiles, player reorders then confirms
- [ ] **The Remaster** — modal showing 10 deck cards, player clicks 2 to delete + 1 to duplicate
- [ ] **Hellquake** — triggered by Black Sabbath Sigil: screen shake + damage = total band ATK × (corruption/10), vignette flash

### Band member keyword passives (currently decorative)
Keywords show on cards but do nothing. Making them real transforms the game.
- [ ] **FRENZIED** (Bjorn/Ragnar) — +1 ATK each time they deal a killing blow (boss HP to 0)
- [ ] **DOUBLE TIME** (Thor) — already works (doubles ATK) ✅
- [ ] **ANCHOR** (Ingrid/Dag) — at end of each Strike, heal adjacent members for 1 HP
- [ ] **CORRUPT** (Loki) — ATK = base + floor(corruption/20) dynamically
- [ ] **DEBUFF** (Nott) — each Strike reduces boss baseDmg by 1 (min 1), resets each fight

---

## 🟠 P2 — HIGH IMPACT (Next 2 sessions)

### Shop redesign
Currently functional but feels like a spreadsheet. Needs to feel like a cursed black market.
- [ ] Dark atmospheric layout — candlelit, dangerous feeling
- [ ] Cards for sale displayed as proper game cards (same style as hand cards)
- [ ] Booster pack opening animation — cards flip over one by one
- [ ] Artifact display more prominent and tempting
- [ ] Shop music/ambience hint (even just a CSS pulse effect)

### Circle II — Gluttony
The game has no end state beyond Circle I. Players need somewhere to go.
- [ ] 3 new enemies with unique passives (not just stat bumps)
- [ ] New circle-specific artifact set
- [ ] Slightly harder difficulty curve

### Psychedelic Too Stoned visual system
*(Full spec in notes below)*
This is the signature mechanic — needs the visual treatment to match
- [ ] 4-stage HP degradation visuals on member cards
- [ ] Corruption UI escalation (50/75/100% thresholds)
- [ ] Too Stoned moment: screen flash + bloom + sound

---

## 🟡 P3 — POLISH & JUICE (Ongoing)

### Sound design
Already have basic Web Audio synth sounds. Need:
- [ ] Card draw sound (upward whoosh)
- [ ] Too Stoned moment (psychedelic swell)
- [ ] Victory fanfare (full chord progression)
- [ ] Hellquake (earth-shaking sub bass hit)
- [ ] Shop music (dark ambient loop)

### Card draw animation
- [ ] Cards slide up from deck pile into hand when drawn
- [ ] Would add massive juice to the refill moment

### End screen improvements
- [ ] Victory screen feels more celebratory
- [ ] Defeat screen leans into the Too Stoned aesthetic
- [ ] Show run summary stats more prominently

### Opening Night screen
- [ ] Show more musicians (currently shows 5 of 7)
- [ ] Better visual layout for selection

---

## 🟢 P4 — FUTURE FEATURES

### Artifact system (active)
- [ ] Artifacts should trigger visually when their effect fires
- [ ] Add 4+ new artifacts per circle

### More card types
- [ ] **GEAR** type — persistent equipment cards that stay in play
- [ ] **CURSE** type — negative cards that can be removed via shop

### Progression
- [ ] Circle III, IV, V... (deeper = harder + more psychedelic)
- [ ] Meta-progression: unlockable starting bands, card discoveries
- [ ] Daily seed challenge mode

### Platform
- [ ] Steam page planning
- [ ] Card artwork (real illustrations to replace emojis)
- [ ] Mobile responsiveness check

---

## 📝 DESIGN NOTES

### Psychedelic Too Stoned Visual System — Full Spec
*Questions still to confirm before building:*
1. HP degradation: subtle start (barely noticeable at 75%, dramatic at 25%) — YES
2. Corruption parchment shift: parchment bleeds red/dark at high corruption — YES
3. Too Stoned card: whole card face changes — YES
4. Text effects: smooth CSS for deterioration, sharp glitch for the Too Stoned moment
5. Too Stoned screen flash: YES — most memorable moment in game

**Stage 1 (HP 75%):** Amber/yellow tint, faint haze, throb slightly faster
**Stage 2 (HP 50%):** Purple/magenta saturation, edge blur, emoji drifts, numbers flicker
**Stage 3 (HP 25%):** Heavy distortion, pulses purple↔red, text wobbles, stars in emoji zone
**Stage 4 (HP 0):** 15° tilt, grey-green pallor, emoji → 💨, blurs out, locked

**Corruption escalation:**
- 50%+ background breathes (scale pulse)
- 75%+ HUD shifts purple
- 100% strong vignette, parchment bleeds red

### On Game Addictiveness
The core is strong. What makes roguelites addictive is the "one more run" feeling — you need:
1. ✅ Meaningful choices (card plays, discard vs keep, shop decisions)
2. ✅ Distinctive aesthetic (nobody else has doom metal + Dante's Inferno)
3. ⚠️ Build variety — right now most runs feel similar. Keyword passives + more card synergies will fix this
4. ⚠️ Stakes — Too Stoned needs to hurt more. Right now it's too easy to avoid/recover
5. ❌ Meta-progression — nothing carries between runs yet. Even unlocking new band members would help enormously

---

## ✅ COMPLETED (Session 4)

- [x] Play screen UI fully locked
- [x] Boss throbbing red glow box, large readable text
- [x] Member cards 230×345, correct size matching placeholders
- [x] Hand cards: fixed height 295px, effect text centered
- [x] Hover z-index via anyHovered+isolation — always on top
- [x] Hand drag-to-reorder (insert style, like Balatro)
- [x] drawUpTo while loop fix — hand always refills to 6
- [x] Attack number red pulse animation on value change
- [x] Ghost card bug fixed (dragHandIdx cleared on stage drop)
- [x] Shop leave bug fixed (animPhase reset, hand redealt for fight 2/3)
- [x] Recruit screen — buy pack → pick musician → add to stage
- [x] Enemy rebalance: Wanderer 40HP, Lost Soul 69HP ← non-negotiable, Drifter 100HP
- [x] GitHub + GDD.md auto-maintained living document
