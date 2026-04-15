# ⛧ SPRITE & ANIMATION HANDOFF — For Dev Chat Integration

## WHAT HAPPENED
All pixel art sprites and idle animations were generated in a separate art session.
- Static sprites: PixelLab API (PixFlux model, 128x128, `no_background`)
- Idle animations: PixelLab Pixelorama web editor ("Animate with Text New")
- Nott was REMOVED from codebase and replaced with **Grimnir** (masked male vocalist, DEBUFF)

## CURRENT COMMIT
`d2751dd` — all sprites and animations pushed

## FILE LOCATIONS

### Static Sprites (128x128 PNG, transparent background)
```
public/members/{id}_stage.png    — 18 band members
public/bosses/{id}.png           — 29 bosses (including lucifer_p1.png + lucifer_p2.png)
```

### Idle Animations (128x128 GIF, transparent, 16-18 frames @ 170ms)
```
public/members/idle/{id}_stage_idle.gif
```

## BAND MEMBERS — 18 total (was 17, Grimnir added)

| ID | Name | Role | Keyword | Static | Idle |
|----|------|------|---------|--------|------|
| `bjorn` | Bjorn | Lead Guitarist | FRENZIED | ✅ | ❌ MISSING |
| `ragnar` | Ragnar | Lead Guitarist | FRENZIED | ✅ | ✅ |
| `thor` | Thor | Drummer | DOUBLE TIME | ✅ | ✅ |
| `rolf` | Rolf | Drummer | DOUBLE TIME | ✅ | ✅ |
| `ingrid` | Ingrid | Bass Player | ANCHOR | ✅ | ✅ |
| `dag` | Dag | Bass Player | ANCHOR | ✅ | ✅ |
| `ulf` | Ulf | Bass Player | ANCHOR | ✅ | ✅ |
| `brynja` | Brynja | Bass Player | ANCHOR | ✅ | ✅ |
| `loki` | Loki | Synth Player | CORRUPT | ✅ | ✅ |
| `freya` | Freya | Synth Player | CORRUPT | ✅ | ✅ |
| `astrid` | Astrid | Vocalist | DEBUFF | ✅ | ✅ |
| `grimnir` | Grimnir | Vocalist | DEBUFF | ✅ | ✅ |
| `sigrid` | Sigrid | Rhythm Guitarist | SHREDDER | ✅ | ✅ |
| `gunnar` | Gunnar | Rhythm Guitarist | SHREDDER | ✅ | ✅ |
| `vitalik` | Vitalik | Dark Minstrel | FOLK MAGIC | ✅ | ✅ |
| `orm` | Orm | Dark Minstrel | HEXED | ✅ | ✅ |
| `tanuki` | Tanuki | Bass Player | ANCHOR *(locked)* | ✅ | ✅ |
| `lucifer_member` | Lucifer | The Devil | FALLEN *(locked)* | ✅ | ✅ |

## BOSSES — 29 total

| Circle | Enemies | Boss ★ | Files |
|--------|---------|--------|-------|
| I Limbo | wanderer, lostsoul, drifter | — | ✅ |
| II Lust | siren, tempter | lust_boss ★ | ✅ |
| III Gluttony | glutton, feaster | gluttony_boss ★ | ✅ |
| IV Greed | miser, hoarder | greed_boss ★ | ✅ |
| V Anger | wrathful, berserker | anger_boss ★ | ✅ |
| VI Heresy | heretic, apostate | heresy_boss ★ | ✅ |
| VII Violence | brute, hunter | violence_boss ★ | ✅ |
| VIII Fraud | trickster, deceiver | fraud_boss ★ | ✅ |
| IX Treachery | traitor, betrayer | lucifer_p1 ★, lucifer_p2 ★ | ✅ |
| Special | ar_exec | — | ✅ |

## CODE CHANGES ALREADY MADE
1. **Grimnir replaces Nott** in `src/App.jsx` line ~230:
   - `{id:'grimnir', name:'Grimnir', role:'Vocalist', ...keyword:'DEBUFF', desc:'The Masked One. Reduces boss passive each turn.'}`
2. **DEBUFF log message** changed from "Nott debuffs" → "Vocalist debuffs" (line ~4870)
3. **Both sim files** updated: `vestibule-sim.js` + `vestibule-sim-v3.js`
4. **Zero references to "Nott" remain** in codebase

## INTEGRATION TODO FOR DEV CHAT

### 1. Wire static sprites into stage
- Replace emoji divs in stage slots with `<img>` tags
- Source: `public/members/{id}_stage.png`
- Register in `STAGE_PORTRAITS` object (~line 578)
- Scale: generate at 128px, display at 96px in-game (or whatever the stage slot size is)

### 2. Wire idle animations
- Replace static `<img>` with animated GIF `<img>` for idle state
- Source: `public/members/idle/{id}_stage_idle.gif`
- GIFs auto-loop, no CSS animation needed — just swap the src
- All GIFs are 128x128, 170ms per frame, transparent background
- During combat IDLE phase → show GIF
- During STRIKE animation → switch to static or strike-specific sprite

### 3. Wire boss sprites
- Replace 90px emoji div in `BossSection` component (~line 1813)
- Source: `public/bosses/{id}.png`
- Lucifer uses `lucifer_p1.png` for phase 1, `lucifer_p2.png` for phase 2

### 4. Add Grimnir to member pool
- Already in `ALL_MUSICIANS` array in App.jsx
- Needs to be addable via recruitment packs (verify he appears in pack logic)
- Verify DEBUFF keyword works with 2 vocalists on stage simultaneously

### 5. Get Bjorn's idle animation
- Only member missing an idle GIF
- JV needs to generate and upload `bjorn_stage_idle.gif`

## ANIMATION SPEC (future — not yet generated)
- Boss idle animations (29 bosses)
- Boss death animations (29 bosses)
- Member attack animations (18 members)
- Member "too stoned" animations (18 members)

## TECHNICAL NOTES
- All PNGs have proper RGBA transparency (except bjorn which may need re-export)
- GIFs use disposal method for clean transparency
- Font for any new UI: always use **MBScribblesFont**
- 420 is sacred constant — never change (stash cap, card height)
- React rules: named imports only, no side effects in `setX(prev =>)` updaters
