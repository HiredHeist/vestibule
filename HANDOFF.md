# VESTIBULE — AI Development Handoff Document
*Last updated: Sunday, March 22, 2026 — Session 11 end state*
*This is a living document. Update it at the end of every session.*

---

## 🎯 WHAT IS THIS PROJECT

**Vestibule** is a roguelite card game built in React/Vite. The player builds a metal band and fights their way through 9 circles of Hell (27 fights), playing RIFF, EMBER, CORRUPT, and UTILITY cards to buff their band members and deal damage. Death is permanent. The game targets Steam at $6.66.

The developer (referred to as "player" in dev sessions) is a music producer and musician living in rural Japan. He plays doom metal. The game is his.

**Core loop:** Pick 2 members → Fight → Shop → Fight → Shop → Circle Boss → repeat × 9

---

## 🔧 TECHNICAL SETUP

### Repo
- **GitHub:** github.com/HiredHeist/vestibule (private)
- **PAT:** `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` (expires ~Jun 17 2026)
- **Clone:** `git clone https://github.com/HiredHeist/vestibule.git`
- **Dev server:** `cd vestibule && npm install && npm run dev` → http://localhost:5173/

### Stack
- React 18 + Vite (single file: `src/App.jsx` — ~3200 lines)
- No backend, no database — pure client-side
- Claude in Chrome extension connected to localhost:5173 tab for live monitoring

### Dev Shortcuts (in-game)
- **Shift+S** — jump to shop with 69 stash (any screen)
- **Shift+D** — jump to death screen (any screen)

### Live Log Monitoring
The game has `window.__devLog` baked in. After a game starts (past Opening Night):
```js
// In browser console — reads full game log from React state:
window.__devLog.map((e,i)=>`[${i+1}][${e.t}] ${e.msg}`).join('\n')
```
The `addLog` function in `src/App.jsx` pipes to `window.__devLog` automatically. This is a dev-only feature — remove before release.

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire game — ~3200 lines, single component |
| `TODO.md` | Master task list — **must update on every push** |
| `HANDOFF.md` | This file |
| `vestibule-sim.js` | AI simulation runner — `node vestibule-sim.js 200000` |
| `SIMULATION_REPORT.md` | Economy balance data from last 800k sim run |

---

## 🔴 SACRED RULES — NEVER BREAK THESE

1. **420 is sacred. Never change card height.** (Cards are 420px tall. This is intentional and permanent.)
2. **No push without player confirmation.** Always show the fix plan first and wait for "go".
3. **Update TODO.md on every single push.** Use JST time (UTC+9). No exceptions.
4. **All pushes use the PAT above.** The repo is private.
5. **Strike through completed TODO items immediately** when done.
6. **Do fixes in agreed batches.** Never make "random pushes mid-game."
7. **Collect a full bug list before fixing anything** during a playtest session.

---

## 🎮 GAME CONSTANTS

```js
MAX_STRIKES: 4      // Attacks per fight
MAX_DISCARDS: 4     // Discards per fight
HAND_SIZE: 6        // Normal hand size (can go over via draw cards)
MAX_STASH: 420      // Max currency (🌿)
MAX_EMBERS_CAP: 8   // Max ember capacity
Starting embers: 5
Starting stash: 3🌿
Fights: 27 total (index 0–26)
```

Circle boss every 3rd fight → +1 max ember permanently.

Stash rewards:
- `circleBaseMin = [8,6,7,9,11,11,13,13,16]`
- `circleBaseRange = [3,4,4,4,5,5,6,6,8]`

---

## ⚔️ ALL 27 ENEMIES (with HP and taglines)

| Fight | Enemy | HP | Tagline |
|-------|-------|-----|---------|
| C1-1 | The Wanderer | 27 | "Could not even find the exit." |
| C1-2 | The Lost Soul | 42 | "You were lost before you started." |
| C1-3 | The Drifter 👁 | 69 | "69 HP. That should have been easy." |
| C2-1 | The Siren 🌊 | 60 | "She sang. You listened. You lost." |
| C2-2 | The Tempter 🌹 | 90 | "Temptation wins again." |
| C2-3 | The Seducer 💋 | 140 | "Irresistible to the end." |
| C3-1 | The Glutton 🍖 | 80 | "It ate your strikes for breakfast." |
| C3-2 | The Feaster 🦷 | 110 | "Still hungry. Always hungry." |
| C3-3 | The Devourer 🕳 | 160 | "Everything gets devoured eventually." |
| C4-1 | The Miser 💰 | 260 | "You could not afford to win." |
| C4-2 | The Hoarder 🪙 | 480 | "It had more patience than you." |
| C4-3 | The Usurer 🏦 | 680 | "Debt always comes due." |
| C5-1 | The Wrathful 🔥 | 800 | "Your buffs fed its rage." |
| C5-2 | The Berserker ⚔️ | 1040 | "Fury without limit." |
| C5-3 | The Warlord 💢 | 1520 | "Strategy means nothing to rage." |
| C6-1 | The Heretic 🔱 | 1650 | "Your soul is sufficiently corrupted now." |
| C6-2 | The Apostate ⛧ | 2175 | "Corruption claimed another believer." |
| C6-3 | The False Prophet 📖 | 3000 | "Even your chaos served its doctrine." |
| C7-1 | The Brute 🗡️ | 3000 | "Your healthiest fell first." |
| C7-2 | The Hunter 🏹 | 4000 | "Prey spotted. Prey eliminated." |
| C7-3 | The Executioner 🩸 | 5500 | "The sentence was carried out." |
| C8-1 | The Trickster 🃏 | 5200 | "You played right into its hands." |
| C8-2 | The Deceiver 🎭 | 6800 | "Nothing was what it seemed." |
| C8-3 | The Archfraud 🪞 | 9600 | "The greatest con: you thought you could win." |
| C9-1 | The Traitor 🗝️ | 9000 | "Every hit made it stronger. You knew that." |
| C9-2 | The Betrayer 🔒 | 11400 | "Betrayal is its native language." |
| C9-3 | **LUCIFER** 😈 | **420,666** | "He has seen better challengers. A lot of them." |

---

## 🃏 ALL CARDS (35 total)

### RIFF cards (purple)
| Card | Embers | Effect | Copies |
|------|--------|--------|--------|
| Amp It Up | 2 | Target member ATK ×2 this fight (temp) | 2 |
| Battle Cry | 1 | Target member +1 ATK permanently | 2 |
| New Strings | 1 | Target member +2 ATK permanently | 2 |
| Encore | 1 | Target member attacks twice this Strike | 2 |
| Stage Dive | 2 | Damage = target HP → boss. Once per round | 1 |
| Demo Tape | 0 | Replay last RIFF card played (free) | 2 |
| Crowd Surf | 2 | Damage = cards in hand × 2 | 2 |
| Resonance | 1 | Target ATK = highest ATK on stage | 2 |
| Sound Wall | 1 | Direct damage (5/8/12 by circle) | 2 |
| Signal Decay | 1 | Random member -1 ATK permanently but draw 2 | 1 |
| Double Down | 0 | Next card this Strike costs 0 embers | 2 |
| Infernal Encore | 2 | ALL members attack again this Strike | 2 |
| Dark Tuning | 3 | Spread +6 ATK across band permanently | 2 |

### EMBER cards (orange)
| Card | Embers | Effect | Copies |
|------|--------|--------|--------|
| Power Tap | 0 | +2 embers free | 2 |
| Groupie | 0 | +2 embers + draw 1 card (uncapped) | 2 |
| Static Charge | 0 | +2 embers always; +4 at 0% corruption | 2 |
| Tapped Out | 0 | +5 embers next Strike | 2 |
| Soundboard | 1 | +2 embers + draw 1 card start of next Strike | 1 |
| Amp Overload | 0 | +3 embers. Costs 1 Discard. Unplayable at 0 discards | 2 |
| Dial to Eleven | 1 | +20% Corruption immediately | 2 |

### CORRUPT cards (red)
| Card | Embers | Effect | Copies |
|------|--------|--------|--------|
| Distortion | 0 | Corruption +15%. All members +1 ATK this Strike | 2 |
| Black Sabbath Sigil | 0 | Corruption →100%. Roll Hellquake | 2 |
| Death Riff | 0 | Damage = up to 60, reduced by Corruption%. Best at 0%, weakest at 100% | 2 |
| Feedback Loop | 3 | Direct damage = Corruption% ÷ 2 | 2 |
| Amp the Static | 0 | Target member +1 ATK per 15% Corruption this Strike. Requires >0% | 2 |
| Overdrive | 3 | If Corruption ≥60%, ALL ATK doubled this Strike | 2 |
| Controlled Feedback | 2 | Set Corruption to exactly 50% | 1 |
| Burn the Set | 1 | Select up to 3 cards to discard, draw that many +1 | 2 |

### UTILITY cards (green)
| Card | Embers | Effect | Copies |
|------|--------|--------|--------|
| Wake Up Call | 0 | Heal all +2HP. If any Too Stoned, revive (lose 50% ATK buffs) | 2 |
| Sound Check | 0 | All +4HP. Injured members also +1 ATK | 2 |
| Setbreak | 1 | Select 1 card first, then play to discard it. +2 embers. (Random if no selection) | 2 |
| Roadie | 1 | Target member: immune to Too Stoned this Strike + heal 2HP | 2 |
| Séance | 1 | All members +HP equal to Corruption% ÷ 8 | 2 |
| Herb Money | 2 | Damage = 10% of current Stash | 2 |
| Setlist | 1 | Draw 2 cards (uncapped). Then forced-discard 1 | 2 |
| The Remaster | 0 | Select 1 card in hand, then play to delete it and draw 3 cards | 1 |

---

## 🏆 ALL ARTIFACTS (a1–a10)

| ID | Name | Effect |
|----|------|--------|
| a1 | Vintage Guitar | Lead guitarist +1 ATK at fight start |
| a2 | Devil's Tuning Fork | Start every fight at 15% Corruption |
| a3 | Evil Eye | First card each Strike costs 0 Embers |
| a4 | Roadie's Toolbelt | Random member gets StoneShield at fight start |
| a5 | Merch Table | Earn +3 Stash whenever you kill a boss |
| a6 | Black Candle | When a member goes Too Stoned, deal 8 dmg to boss |
| a7 | Cursed Setlist | Start with +1 Max Ember, start at 50% Corruption |
| a8 | Hellfire Amulet | First Strike each fight deals double damage |
| a9 | Feedback Pedal | Feedback Loop deals +50% damage |
| a10 | The Goat of Mendes | Once per fight, if all strikes used, get 1 back |

---

## 🎛 ALL PASSIVES (p1–p10)

| ID | Name | Effect |
|----|------|--------|
| p1 | Infernal Rhythm | Drummer bonus applies to all members |
| p2 | Blood Pact | Band synergy bonus doubled |
| p3 | Satanic Panic | Corruption grows 2× faster from all sources |
| p4 | Groupie Magnet | Groupie gives +1 extra ember |
| p5 | Wall of Sound | Sound Wall does +4 damage |
| p6 | Cult Following | Gain +3 Stash when a member goes Too Stoned |
| p7 | Battle Hardened | Battle Cry gives +2 ATK (not +1) |
| p8 | Feedback Hum | All EMBER cards give +1 additional ember |
| p9 | Wailing Guitar | First Strike each fight deals double damage |
| p10 | Opening Act | First Strike of the entire fight: +10 ATK bonus |

---

## 👥 ALL MUSICIANS (16 + 2 locked)

| Name | Role | ATK | HP | Keyword |
|------|------|-----|----|---------|
| Bjorn | Lead Guitarist | 5 | 6 | FRENZIED |
| Ragnar | Lead Guitarist | 4 | 7 | FRENZIED |
| Dag | Bass Player | 2 | 12 | ANCHOR |
| Brynja | Bass Player | 1 | 14 | ANCHOR |
| Ulf | Bass Player | 4 | 9 | ANCHOR |
| Ingrid | Bass Player | 3 | 10 | ANCHOR |
| Sigrid | Rhythm Guitarist | 3 | 8 | SHREDDER |
| Gunnar | Rhythm Guitarist | 4 | 7 | SHREDDER |
| Astrid | Vocalist | 3 | 8 | DEBUFF |
| Nott | Vocalist | 2 | 7 | DEBUFF |
| Orm | Dark Minstrel | 2 | 11 | HEXED |
| Freya | Synth Player | 4 | 5 | CORRUPT |
| Loki | Synth Player | 3 | 6 | CORRUPT |
| Vitalik | Dark Minstrel | 6 | 9 | FOLK MAGIC |
| Rolf | Drummer | 1 | 9 | DOUBLE TIME |
| ??? (Locked) | ??? | ? | ? | ??? |
| ??? (Locked) | ??? | ? | ? | ??? |

### Member Keywords
- **FRENZIED** — each time the boss is defeated, this member gains +1 ATK permanently
- **ANCHOR** — after every Strike, heals members next to this one for +1 HP
- **SHREDDER** — first RIFF card each Strike costs 1 less Ember
- **DEBUFF** — each Strike permanently reduces boss damage by 2. Stacks.
- **HEXED** — each Strike auto-raises Corruption +5%. Gains +1 ATK per 10% Corruption
- **CORRUPT** — ATK scales up the higher your Corruption is
- **FOLK MAGIC** — each Strike has 20% chance to refund ALL embers spent
- **DOUBLE TIME** — rolls a d6 each fight: 5–6 doubles all ATK, 3–4 gives ×1.5, 1–2 gives ×0.5

---

## 🏪 SHOP SYSTEM

### Left column (circle-specific, persist sold state for entire circle)
- **Band Recruitment** — recruit pack (new member candidates)
- **Circle Artifact** — unique artifact per circle, stays SOLD until circle rotation
- **Circle Passive** — unique passive per circle, stays SOLD until circle rotation

### Center (3 random cards from pool)
- Common: 1🌿, Uncommon: 2🌿, Rare: 4🌿, Foil: +3🌿, Mythic: +8🌿

### Booster Packs
- Cassette Tape: 3 Common cards, pick 1 (6🌿)
- CD-R: 2 Common + 1 Uncommon, pick 1 (12🌿)

### Pawn Shop
- Sell members (50% of buy price), sell cards
- Max 2 sales per visit, cannot sell last 2 members

### Reroll cost starts at 2🌿, increases each reroll

---

## 💀 DEATH SCREENS

Three distinct screens triggered by `deathCause` state:

1. **`'stoned'`** — "Stoned to the Bone" — triggers ONLY when ALL members go Too Stoned simultaneously. Green scanlines, red chromatic title.

2. **`'beaten'`** — "Defeated by [BOSS NAME]" — triggers when strikes run out. Shows boss emoji large, boss name, circle/subtitle, sassy tagline, all stats. Deep crimson background.

3. **`'victory'`** — "⛧ Victory ⛧" — beats all 9 circles / Lucifer.

All three screens show identical stats grid: Circle Reached, Fights Survived, Strikes Thrown, Cards Played, Total Damage, Highest Strike, Too Stoned Events, Max Corruption, Stash Earned, Total Runs.

---

## 🔥 HELLQUAKE SYSTEM

Triggered by Black Sabbath Sigil (sets Corruption to 100% then rolls). 10 possible outcomes based on d100 roll. Each has a plain-English description shown in the UI. Notable outcomes: TOTAL WIPEOUT (member falls, boss recovers), OBLITERATION (60 direct damage), RAPTURE (all members heal full).

---

## 🏗️ CODE ARCHITECTURE KEY POINTS

### State management
- Single massive React component with ~60+ `useState` hooks
- Key refs: `handRef`, `deckRef`, `discRef`, `bossRef`, `stageRefs`
- `discoveredRef` — Set of discovered mechanics (guards against double-fire in Strict Mode)
- `recruitPickFiredRef` — prevents double-join on recruit

### React Strict Mode double-fire
**CRITICAL GOTCHA:** React 18 Strict Mode runs state updater functions TWICE in development. Never put `addLog()`, `addFloat()`, or side effects inside `setX(prev => ...)` updaters. Always move them outside the setter. This was the root cause of all "double log" bugs.

### Card play flow
1. Player drags card from hand → drops on stage slot
2. `handleDropOnStage(slotIdx)` fires
3. Special cards (burnset, setlist) are fully handled here and return early
4. All other cards call `applyCard(card, slotIdx)` which builds `ns` (new stage array)
5. After applyCard returns true, card removed from hand, deck refilled

### Between-strike refill
After enemy attacks, hand refills to `Math.max(HAND_SIZE, current hand length)` — this preserves over-cap bonus draws for the whole fight.

### Fight start
Shuffles all cards (deck + discard) and deals `HAND_SIZE` to hand. Over-cap cards from previous fight are NOT carried over between fights.

### `addLog` function
```js
const addLog=m=>{
  if(typeof window!=='undefined'){
    if(!window.__devLog)window.__devLog=[]
    window.__devLog.push({t: new Date().toLocaleTimeString('en-US',{timeZone:'Asia/Tokyo',hour12:false}), msg:m})
  }
  setLog(p=>[m,...p.slice(0,99)])
}
```

---

## 📋 CURRENT TODO STATUS

### ✅ Done (Sessions 1–11)
Everything up through Batch A of Session 11 stress test bugs. See TODO.md for full history.

### 🔴 P1 — Do Next
- Full playthrough stress test after Batch A fixes (currently untested)
- Run 200k sim for fresh balance data
- ANCHOR+ANCHOR starting pair — unwinnable, needs design solution

### 🟡 P2 — Before Demo
- Run score on death screen (biggest retention feature)
- Daily Challenge + leaderboard
- Unlockable members
- Hoarder HP reduction (480 → ~340, sim shows 0% survival)
- Circle complete cinematic

### 🔵 P3 — Future
- A11–A20 artifacts, P11–P20 passives
- Collection/unlock screen
- Settings menu
- Steam / mobile / PS release prep
- A&R Rep bonus stage after beating Lucifer

---

## 🔄 HOW TO DO A DEV SESSION

### Starting a session
1. `cd vestibule && git pull`
2. `npm run dev` if not running
3. Open http://localhost:5173/ in the Claude in Chrome tab
4. Hard refresh (Cmd+Shift+R) to clear any cached state
5. Start a game — `window.__devLog` auto-initialises on first `addLog` call

### Reading the live log
```js
window.__devLog.map((e,i)=>`[${i+1}][${e.t}] ${e.msg}`).join('\n')
```

### Making fixes
1. Read relevant source sections first
2. Write fix as Python string replacement (assert old string exists first!)
3. Check browser console for errors after applying
4. Get player confirmation before pushing
5. Push: `git add src/App.jsx && git commit -m "..." && git push`
6. Update TODO.md with JST timestamp

### Commit message format
`Batch X: short description of what changed`

### TODO update format
Always include JST time: `Sunday, March 22, 2026 at 12:38 PM (JST)`
Strike through completed items with `~~text~~`.
Add new items under the appropriate P1/P2/P3 section.

---

## 🧪 SIMULATION

`node vestibule-sim.js 200000` runs 200,000 simulated games.

Output includes:
- Per-fight survival rates
- Average damage dealt
- Card usage frequency
- Economy stats (average stash earned per circle)

Last sim: 800k runs, March 2026. Key findings:
- C1 death rate: 0.2% (was 7.6% before economy rebalance)
- Hoarder (F11, 480HP): 0% survival — needs HP reduction
- Miser reduced 360→260 HP based on sim data

---

## ⚠️ KNOWN ISSUES / DESIGN NOTES

- **ANCHOR+ANCHOR** starting pair is effectively unwinnable — both members have very low ATK. Either gate this combo or add synergy.
- **Setbreak** card: player must SELECT a card first before playing Setbreak, otherwise it discards randomly. The tip text shows in-log but may not be obvious enough in UI.
- **Hand over-cap** is intentional and strategic — Crowd Surf (damage = hand size × 2) benefits from big hands.
- **Distortion is unplayable at 100% corruption** but still shows in hand. Consider greying it differently or changing the interaction.
- The `Resonance` card `id` in code is `'resonancecard'` not `'resonance'` — important for Demo Tape case matching.

---

## 📝 SESSION HISTORY SUMMARY

| Session | Date | Key Achievements |
|---------|------|-----------------|
| 1–5 | Feb 2026 | Core game built — cards, fights, members, shop |
| 6 | Feb 2026 | Shop UI overhaul, pawn shop, booster packs |
| 7 | Feb 2026 | AI sim written, economy rebalanced |
| 8 | Feb 2026 | Death screens, Hellquake explainer, Fire & Recruit panel |
| 9 | Mar 2026 | Bug sweep, 13 bugs fixed, balance pass |
| 10 | Mar 21–22 | Burn the Set fix, batch 1–3 (circle sold, death screens, hand over-cap, Setlist, Remaster, Amp Overload) |
| 11 | Mar 22 | Live playtest monitoring, 9 double-fire bugs fixed, Demo Tape Resonance, Distortion +15%, all Batch A done |

---

## 🚨 THINGS THAT WILL BREAK YOU

1. **Apostrophes in JS string literals** — all taglines use single quotes. Apostrophes (`'`) inside them cause parse errors. Always use `could not` not `couldn't`.
2. **React Strict Mode double-fire** — never put addLog/addFloat inside state setters. Always move outside.
3. **Card `id` vs card `name`** — the Resonance card has `id:'resonancecard'` but displays as "Resonance". Always check the actual `id` field not the display name.
4. **Vite HMR** — sometimes hot reload gets stuck. Hard refresh (Cmd+Shift+R) or cache-bust URL (`?v=timestamp`) usually fixes it.
5. **The Claude in Chrome tab** — the extension only monitors ONE specific tab. If the player opens a second window at localhost:5173, the AI cannot see it. Always play in the tab the extension is watching.

---

*This document should be updated at the end of every session. When starting a new chat, paste this entire document as context.*
