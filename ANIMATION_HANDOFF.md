# ⛧ ANIMATION HANDOFF — Sprite & Idle Animation Integration Guide

## SUMMARY
All 18 band member sprites, 29 boss sprites, and 18 idle animations are complete and in the repo.
Nott has been replaced with Grimnir (masked male vocalist, DEBUFF) in all code files.
This document tells you exactly how to wire everything into the game.

---

## COMMIT
Latest: `f99d4b8` (check `git log` for any newer commits after this doc)

## VITE BASE PATH
`base: '/vestibule/'` in vite.config.js — all `public/` files serve at `/vestibule/...`

---

## FILE LOCATIONS

### Static Sprites
```
public/members/{id}_stage.png     → /vestibule/members/{id}_stage.png
public/bosses/{id}.png            → /vestibule/bosses/{id}.png
```

### Idle Animations (NEW)
```
public/members/idle/{id}_stage_idle.gif → /vestibule/members/idle/{id}_stage_idle.gif
```
All GIFs: 128×128, transparent background, 16-18 frames, 170ms per frame, auto-looping.

---

## WHAT NEEDS TO CHANGE IN App.jsx

### 1. Update MEMBER_PORTRAITS (~line 567)
Currently only 9 members, pointing to old `/vestibule/members/{id}.png` files (some deleted).
Replace entire object with all 18 members using `_stage.png` files:

```js
const MEMBER_PORTRAITS={
  bjorn:'/vestibule/members/bjorn_stage.png',
  ragnar:'/vestibule/members/ragnar_stage.png',
  thor:'/vestibule/members/thor_stage.png',
  rolf:'/vestibule/members/rolf_stage.png',
  ingrid:'/vestibule/members/ingrid_stage.png',
  dag:'/vestibule/members/dag_stage.png',
  ulf:'/vestibule/members/ulf_stage.png',
  brynja:'/vestibule/members/brynja_stage.png',
  loki:'/vestibule/members/loki_stage.png',
  freya:'/vestibule/members/freya_stage.png',
  astrid:'/vestibule/members/astrid_stage.png',
  grimnir:'/vestibule/members/grimnir_stage.png',
  sigrid:'/vestibule/members/sigrid_stage.png',
  gunnar:'/vestibule/members/gunnar_stage.png',
  vitalik:'/vestibule/members/vitalik_stage.png',
  orm:'/vestibule/members/orm_stage.png',
  tanuki:'/vestibule/members/tanuki_stage.png',
  lucifer_member:'/vestibule/members/lucifer_member_stage.png',
}
```

### 2. Update STAGE_PORTRAITS (~line 578)
Same issue — only 9 members. Replace with all 18 using same `_stage.png` paths:
```js
const STAGE_PORTRAITS={
  bjorn:'/vestibule/members/bjorn_stage.png',
  ragnar:'/vestibule/members/ragnar_stage.png',
  thor:'/vestibule/members/thor_stage.png',
  rolf:'/vestibule/members/rolf_stage.png',
  ingrid:'/vestibule/members/ingrid_stage.png',
  dag:'/vestibule/members/dag_stage.png',
  ulf:'/vestibule/members/ulf_stage.png',
  brynja:'/vestibule/members/brynja_stage.png',
  loki:'/vestibule/members/loki_stage.png',
  freya:'/vestibule/members/freya_stage.png',
  astrid:'/vestibule/members/astrid_stage.png',
  grimnir:'/vestibule/members/grimnir_stage.png',
  sigrid:'/vestibule/members/sigrid_stage.png',
  gunnar:'/vestibule/members/gunnar_stage.png',
  vitalik:'/vestibule/members/vitalik_stage.png',
  orm:'/vestibule/members/orm_stage.png',
  tanuki:'/vestibule/members/tanuki_stage.png',
  lucifer_member:'/vestibule/members/lucifer_member_stage.png',
}
```

### 3. Add IDLE_PORTRAITS map (NEW — add after STAGE_PORTRAITS)
```js
const IDLE_PORTRAITS={
  bjorn:'/vestibule/members/idle/bjorn_stage_idle.gif',
  ragnar:'/vestibule/members/idle/ragnar_stage_idle.gif',
  thor:'/vestibule/members/idle/thor_stage_idle.gif',
  rolf:'/vestibule/members/idle/rolf_stage_idle.gif',
  ingrid:'/vestibule/members/idle/ingrid_stage_idle.gif',
  dag:'/vestibule/members/idle/dag_stage_idle.gif',
  ulf:'/vestibule/members/idle/ulf_stage_idle.gif',
  brynja:'/vestibule/members/idle/brynja_stage_idle.gif',
  loki:'/vestibule/members/idle/loki_stage_idle.gif',
  freya:'/vestibule/members/idle/freya_stage_idle.gif',
  astrid:'/vestibule/members/idle/astrid_stage_idle.gif',
  grimnir:'/vestibule/members/idle/grimnir_stage_idle.gif',
  sigrid:'/vestibule/members/idle/sigrid_stage_idle.gif',
  gunnar:'/vestibule/members/idle/gunnar_stage_idle.gif',
  vitalik:'/vestibule/members/idle/vitalik_stage_idle.gif',
  orm:'/vestibule/members/idle/orm_stage_idle.gif',
  tanuki:'/vestibule/members/idle/tanuki_stage_idle.gif',
  lucifer_member:'/vestibule/members/idle/lucifer_member_stage_idle.gif',
}
```

### 4. Add BOSS_PORTRAITS map (NEW — add after IDLE_PORTRAITS)
```js
const BOSS_PORTRAITS={
  wanderer:'/vestibule/bosses/wanderer.png',
  lostsoul:'/vestibule/bosses/lostsoul.png',
  drifter:'/vestibule/bosses/drifter.png',
  siren:'/vestibule/bosses/siren.png',
  tempter:'/vestibule/bosses/tempter.png',
  lust_boss:'/vestibule/bosses/lust_boss.png',
  glutton:'/vestibule/bosses/glutton.png',
  feaster:'/vestibule/bosses/feaster.png',
  gluttony_boss:'/vestibule/bosses/gluttony_boss.png',
  miser:'/vestibule/bosses/miser.png',
  hoarder:'/vestibule/bosses/hoarder.png',
  greed_boss:'/vestibule/bosses/greed_boss.png',
  wrathful:'/vestibule/bosses/wrathful.png',
  berserker:'/vestibule/bosses/berserker.png',
  anger_boss:'/vestibule/bosses/anger_boss.png',
  heretic:'/vestibule/bosses/heretic.png',
  apostate:'/vestibule/bosses/apostate.png',
  heresy_boss:'/vestibule/bosses/heresy_boss.png',
  brute:'/vestibule/bosses/brute.png',
  hunter:'/vestibule/bosses/hunter.png',
  violence_boss:'/vestibule/bosses/violence_boss.png',
  trickster:'/vestibule/bosses/trickster.png',
  deceiver:'/vestibule/bosses/deceiver.png',
  fraud_boss:'/vestibule/bosses/fraud_boss.png',
  traitor:'/vestibule/bosses/traitor.png',
  betrayer:'/vestibule/bosses/betrayer.png',
  lucifer:'/vestibule/bosses/lucifer_p1.png',
  ar_exec:'/vestibule/bosses/ar_exec.png',
}
```
Note: Lucifer has two phases. Use `lucifer_p1.png` initially, swap to `lucifer_p2.png` at phase transition.

---

## STAGE RENDERING — Idle Animation Logic (~line 2086)

Current code at line 2086:
```jsx
{STAGE_PORTRAITS[member.id]?<img className="squiggle" src={STAGE_PORTRAITS[member.id]} .../>:member.emoji}
```

Replace with idle-aware logic:
```jsx
{STAGE_PORTRAITS[member.id] ? (
  <img
    className={animPhase==='idle' ? '' : 'squiggle'}
    src={animPhase==='idle' && IDLE_PORTRAITS[member.id]
      ? IDLE_PORTRAITS[member.id]
      : STAGE_PORTRAITS[member.id]}
    alt={member.id}
    style={{width:'70%',height:'90%',objectFit:'contain',objectPosition:'center center'}}
  />
) : member.emoji}
```

Logic:
- **animPhase === 'idle'**: Show animated GIF (self-loops at 170ms/frame). Remove squiggle class — the GIF IS the animation now.
- **animPhase === 'attacking'** or **'boss'**: Show static PNG with squiggle class for the strike wobble effect.

### Why this works
GIF `<img>` tags auto-animate in all browsers. Swapping `src` between GIF and PNG is instantaneous. No CSS animation system needed for idle — the GIF handles it.

---

## BOSS RENDERING — Replace Emoji (~line 2527-2533)

Current code in BossSection component (~line 2527):
```jsx
<div data-boss-emoji="1" style={{...fontSize:90...}}>
  {enemy.emoji}
</div>
```

Replace emoji with portrait:
```jsx
<div data-boss-emoji="1" style={{...}}>
  {BOSS_PORTRAITS[enemy.id]
    ? <img src={BOSS_PORTRAITS[enemy.id]} alt={enemy.name}
        style={{width:120,height:120,objectFit:'contain',imageRendering:'pixelated'}}/>
    : enemy.emoji}
</div>
```

Also update end-of-fight boss display (~line 2967):
```jsx
{enemy?.emoji||'💀'}
```
→ replace with portrait version with emoji fallback.

Also update circle map boss display (~line 2294):
```jsx
{defeated?enemy.emoji:'❓'}
```
→ replace with small portrait thumbnail with emoji fallback.

---

## LUCIFER PHASE SWAP

Lucifer boss has two sprites:
- Phase 1: `lucifer_p1.png` — Baphomet throne form
- Phase 2: `lucifer_p2.png` — Lord of the Flies insectoid form

In BossSection, check `luciferPhase` state:
```jsx
src={enemy.id==='lucifer' && luciferPhase===2
  ? '/vestibule/bosses/lucifer_p2.png'
  : BOSS_PORTRAITS[enemy.id]}
```

---

## GRIMNIR (replaces Nott) — ALREADY DONE IN CODE
- `src/App.jsx` line ~230: `{id:'grimnir', name:'Grimnir', ...keyword:'DEBUFF'}`
- DEBUFF log (~line 4870): says "Vocalist debuffs" not "Nott debuffs"
- Both sim files updated
- Zero "nott" references remain
- **Verify**: Grimnir appears in recruitment pack logic (he should inherit Nott's old slot)

---

## ALL 18 MEMBER IDS
```
bjorn, ragnar, thor, rolf, ingrid, dag, ulf, brynja,
loki, freya, astrid, grimnir, sigrid, gunnar,
vitalik, orm, tanuki, lucifer_member
```

---

## STYLE NOTES
- Sprites are 128×128, display at whatever size the stage slots need
- Use `imageRendering: 'pixelated'` for crisp pixel art scaling
- Keep the squiggle CSS for non-idle states — it adds life during combat
- Font: always MBScribblesFont for readable UI text
- 420 is sacred (stash cap, card height — never change)

---

## FUTURE ANIMATIONS (not yet generated)
- Boss idle animations (29 bosses)
- Boss death animations (29 bosses)
- Member attack/strike animations (18 members)
- Member "too stoned" animations (18 members)

---

## TESTING CHECKLIST
- [ ] All 18 members show portraits (not emoji) in stage slots
- [ ] All 18 members show portraits in recruitment UI, shop, and end screen
- [ ] Idle GIFs play smoothly during idle phase
- [ ] GIFs stop (swap to static) during strike/boss attack phases
- [ ] All 29 bosses show portraits (not emoji) in BossSection
- [ ] Bosses show portraits in circle map and victory screen
- [ ] Lucifer swaps from P1 to P2 sprite at phase transition
- [ ] Grimnir appears in recruitment packs and works with DEBUFF keyword
- [ ] No remaining emoji fallbacks for any member or boss with a sprite
- [ ] Squiggle animation still works during combat phases
