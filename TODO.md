# Vestibule — To-Do List

## 🎨 PSYCHEDELIC / TOO STONED VISUAL SYSTEM (High Priority)
*Vision: "Drugged out psychedelic trip within Steam all-ages policy — world warps as corruption rises, band members deteriorate visually as HP drops"*

### Member Card HP Degradation (4 stages):
- **Stage 1 (HP 75%)** — Subtle warm amber/yellow tint on card. Faint haze. Throb slightly faster.
- **Stage 2 (HP 50%)** — Colors saturate + shift purple/magenta. Soft edge blur. Emoji drifts/floats. ATK/HP numbers flicker.
- **Stage 3 (HP 25%)** — Heavy color distortion, card pulses between deep purple and red. Text wobbles. Stars/spirals in emoji zone. Rapid intense throb.
- **Stage 4 (Too Stoned / HP 0)** — Card tilts 15°, desaturated grey-green pallor, emoji replaced with 💨, everything blurs out. "TOO STONED" floater. Card locked/uninteractable.

### Questions to answer before building:
1. HP degradation: subtle (barely noticeable early, dramatic late) or obvious even at 75%?
2. Corruption UI shift: parchment color shifts too (redder/darker) OR only HUD/background/borders?
3. Too Stoned card: whole card face changes (background + symbols) OR just top emoji area?
4. Flickering/wobbling text: smooth CSS animation OR sharp random glitch effect?
5. Too Stoned moment: dramatic screen flash + psychedelic color bloom + sound? (could be most memorable moment in game)

### Corruption % UI Escalation:
- **50%+** — Background starts to "breathe" (subtle scale pulse)
- **75%+** — HUD colors shift toward purple
- **100%** — Strong purple/magenta vignette over whole screen, parchment bleeds red at edges

---

## 🎵 SOUND DESIGN (Future)
- Card draw sound (satisfying whoosh/click)
- Victory fanfare (full ascending chord)
- Too Stoned moment sound (dramatic psychedelic bloom)
- Hellquake sound effect (earth-shaking bass hit)

---

## ⚡ HELLQUAKE (Not yet implemented)
- Triggered by Black Sabbath Sigil card (sets Corruption to 100%)
- Needs full effect definition — suggestion: deal massive damage to boss equal to total band ATK × corruption multiplier, with dramatic screen shake + visual effect

---

## 🃏 CARD DRAW ANIMATION (Future)
- Cards currently appear instantly when drawn
- Add upward-slide animation for new cards entering hand
- Would add significant "juice" to the draw moment

---

## 🏪 SHOP / BLACK MARKET (Next major UI pass)
- Needs full redesign to feel like a "cursed treasure room"
- Currently functional but not exciting
- Key: make it feel dangerous and tempting simultaneously

---

## 🐛 KNOWN BUGS / FIXES NEEDED
- [ ] Verify hand always refills to 6 after every Strike and Discard action
- [ ] Confirm z-index hover fix is consistent for all cards including newly drawn ones
- [ ] Hellquake has no implemented effect (placeholder only)
- [ ] Setlist card: needs modal UI to view/rearrange top 4 deck cards
- [ ] The Remaster card: needs modal UI to view/delete/copy deck cards
- [ ] Demo Tape card: needs "last riff played" tracking state

---

## ✅ COMPLETED
- [x] 3-fight structure (Wanderer → Lost Soul → Drifter boss)
- [x] Dice roll animation showing target before damage
- [x] Boss damage reduces member HP → Too Stoned at 0
- [x] +ATK buff badges on stage members
- [x] Band-wide synergy bonus (3/4/5 buffed = +10/20/35%)
- [x] Selected cards lift + gold border (discard selection)
- [x] Selected cards now: blood red border + glow + -50px lift
- [x] Corruption triggers from 3+ buffs on one member
- [x] Hand refill fix (includes discarded cards in reshuffle)
- [x] GitHub workflow established (push → git pull)
- [x] Phase dots enlarged + repositioned
- [x] Boss section enlarged (A+B+C treatment)
- [x] Artifact zone flush left with separator
- [x] 230×345 member cards with scaled internals

---

## ✅ PLAY SCREEN — LOCKED IN (Session 4 complete)
- [x] Play screen UI finalized — boss box, member cards, hand cards, artifacts, buttons
- [x] Hand cards: correct size, hover z-index, drag-to-reorder, no cutoff
- [x] drawUpTo while loop fix — hand always refills to full after strike/discard
- [x] Attack number pulse animation
- [x] Ghost card bug fixed (dragHandIdx cleared on stage drop)
- [x] All cards same height, effect text vertically centered

## 🏪 NEXT: BLACK MARKET SHOP REDESIGN
