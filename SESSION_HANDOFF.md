# VESTIBULE — SESSION HANDOFF
## Phone Brainstorm → Desktop Build Session
## April 14, 2026

---

## REPO & SETUP
- GitHub: github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires ~Jun 17 2026)
- Dev: `cd vestibule && npm run dev` → http://localhost:5173/vestibule/
- Latest commit: 56b3a6c
- Sim v3 (proposed balance): vestibule-sim-v3.js in repo root
- NOTE: Vite aggressively caches. Always `rm -rf node_modules/.vite` before restart.
- NOTE: main.jsx changes require full server restart (CRT/VHS overlays live there).
- NOTE: Always use MBScribblesFont for readable text. BogartsMetalFont for titles only.

---

## WHAT'S ALREADY BUILT & WORKING
- Full 9-circle campaign + Lucifer + Encore Mode
- 40 cards, 4 types (RIFF/CORRUPT/UTILITY/EMBER), 16 Riff Chains
- 8 member keywords, mentor links, member tiers
- 6 difficulty stakes (Bronze 8.5% → Demonic 0.9%)
- Tutorial system: 3 scripted fights with tooltips + first-encounter tips
- Combat animations: 2s per-member strike, boss projectile, card fly-on-play
- QoL: gray unaffordable cards, chain badges, hidden thermometer at 0%, skip 0ATK anims, dim shop items
- CRT scanlines + VHS effect (toggleable, in main.jsx)
- Vertical corruption thermometer, genre banner, upgrade indicators
- Rules screen (35 entries), combat log, mastery, trophies, daily challenge

---

## IMPLEMENTATION QUEUE (in priority order)

### 1. GHOST PREVIEW ON DRAG
When dragging a card over a member, show preview of the effect BEFORE dropping.
"+1 ATK" or "+2 HP" floats on the member being hovered. Shows the RIGHT info
at the RIGHT moment. Huge UX win — eliminates mental math.

### 2. HAND AREA OVERHAUL ("Cockpit Layout")
Current hand area is cluttered with stats scattered in corners.
NEW LAYOUT:
- LEFT PANEL: DISCARD button + remaining discards (pips or number)
- CENTER: Cards fanned out with more breathing room
- RIGHT PANEL: STRIKE button with integrated damage number + remaining strikes
  The Strike button should GROW/PULSE as you play more cards (damage increases)
- BOTTOM STRIP: Embers as "🔥 4/7" (number pair, not fixed pips), deck count, discard pile, stash
- Embers display must scale to any max (sometimes players have 7, 8, or 10 max)

### 3. DECK PEEK
Tap the deck count icon → modal shows remaining cards sorted by TYPE columns.
RIFF column (purple), CORRUPT column (red), UTILITY column (green), EMBER column (orange).
Summary counts at top: "RIFF: 12 | CORRUPT: 5 | UTILITY: 3 | EMBER: 4"
No deck ORDER shown (preserves draw tension). Lets players calculate discard odds.

### 4. DISCARD/PLAYED HISTORY
Tap the discard pile icon → scrollable chronological list of all cards played
and discarded THIS FIGHT. Most recent at top.
Labels: "Played on Strike 2" / "Discarded on Strike 1"
Helps players track moves and learn patterns.

### 5. CARD BALANCE + 69-CARD DECK
Sim-tested at 7.68% Bronze win rate (matches current 7.74%).
Sim v3 file: vestibule-sim-v3.js in repo root.

STARTER DECK (69 cards):
  RIFF (32): Battle Cry x4, Amp It Up x3, Encore x3, Mosh Pit x2,
    Heavy Riff x2, New Strings x2, Sound Wall x2, Crowd Surf x2,
    Burn the Set x1, Demo Tape x2, Resonance x3, Herb Money x1,
    Infernal Encore x2, Stage Dive x1, Possessed Perf x2, Double Down x1
  EMBER (9): Power Tap x3, Groupie x2, Tapped Out x2, Amp Overload x1, Soundboard x1
  CORRUPT (15): Distortion x3, Static Charge x3, Signal Decay x2,
    Dark Tuning x2, Dial to Eleven x2, Séance x1, Death Riff x1, Blood Ritual x1
  UTILITY (11): Roadie x3, Smoke Break x2, Setlist x2, Wake Up Call x2,
    Sound Check x1, The Remaster x1

SHOP-ONLY (exciting discoveries, NOT in starter):
  Sabbath Sigil, Overdrive, Going Broke, Controlled Feedback,
  Amp the Static, Feedback Loop, Record Deal (reworked)

CARD BUFFS:
  Dial to Eleven: corruption +5% (was +10%) — half the risk, same reward
  Smoke Break: add DRAW 1 CARD (now replaces itself in hand)
  CORRUPT keyword: +1 ATK per 10% corruption (was /15) — clean math
  Record Deal: REWORK to deck thinning — "Remove this + 2 other cards from deck. Gain 5 Stash."

### 6. BOSS DISPLAY — CONCERT POSTER LAYOUT
Remove the boss box/divider. Boss floats on shared battle background.
Vertical stack (top to bottom):
  CIRCLE III · FIGHT 2 OF 3        (tiny 12px, dim gold, contextual)
  THE FEASTER  ⚔6                  (big BogartsMetalFont, damage inline)
  Heals 3 HP every card played     (MBScribblesFont, colored by threat type)
  🍖                                (large emoji with glow)
  ████████░░░ 119/156 HP           (HP bar showing fraction)

Passive text color-coded by threat: purple=corruption, green=heal, red=damage, yellow=steal.
No box, no border. Boss and band share one unified battle area.

### 7. UNIFIED BATTLE AREA (2 zones not 3)
Merge boss area + band area into one continuous dark background.
Remove the parchment. Dark charcoal/crimson background makes cards POP.
One clean break between battle area (dark, animated) and hand area (darker, static).

### 8. ANIMATED BATTLE BACKGROUND
Slow CSS gradient shift — deep crimson/purple/black like embers glowing.
Responds to game state:
  - Shifts redder as corruption rises
  - Pulses gold on chain triggers
  - Fractures/cracks when boss near death
  - Normal: slow, dark, atmospheric
CSS gradient animations only for v1 (no canvas needed).

### 9. SABBATH OFFERING EVENT REWORK
Currently chosen 1 time in 10,000 games — functionally broken.
Rework reward to something universally useful:
  "+15 max HP to all members" or "remove one corruption threshold"

### 10. EARLY GAME PACING
Circles I-IV only kill 2.1% of players. First 12 fights have no tension.
Options: reduce early circles to 2 fights each, increase early boss HP 20-30%,
or give early bosses more dangerous passives.

---

## DESIGN IDEAS (discussed, not yet prioritized)

### Addiction Mechanics
- Strike button grows/pulses as damage builds (visible progress)
- "PLAY AGAIN" button on death screen (one click, no menu)
- Death screen shows what killed you + tip for next time
- Streak rewards visible on main menu BEFORE the streak
- Combo counter (total cards played this fight) with celebrations
- End-of-fight reward "slot machine" roll effect
- Run timer with speed bonus scoring
- Daily challenge splash screen on game open
- Ghost players: "847 players died here today" on descent map

### Feel & Polish
- Member personalities: one-line quotes, death quotes, victory quotes
- Corruption meter demon face that gets more visible as corruption rises
- Shop redesign: record store aesthetic, not spreadsheet
- Sound design overhaul: distinct sounds per card type, crunchy impacts
- Auto-highlight most impactful affordable card (subtle pulse)
- 2-second undo window on card plays
- Descent map shows enemy emoji + difficulty skulls on each node
- Celebrate EVERYTHING in first run (first card, first kill, first chain)

### UX Improvements
- Card effects animate on the member when played (ATK number pops from 5→6)
- "?" hint button for one suggestion per turn (training wheels)
- "COST: 2" text on cards instead of just ember circle number
- Ember counter shakes when you can't afford a card
- Reduce border noise — shadows instead of borders on member cards
- Rigid member card layout (ATK/HP/keyword always in exact same position)
- Font hierarchy: BogartsMetalFont for moments ONLY, MBScribblesFont for everything else

---

## KEY CODE LOCATIONS
- Tutorial config: after RIFF_CHAINS (~line 670-740)
- Tutorial components: TutorialTooltip + TutorialMessage (before App function)
- Tutorial state: tutorialFight, tutorialTipIdx, showTutorialMsg, firstTip
- startTutorialFight: before startGame function
- CRT/VHS overlays: src/main.jsx (DOM injection, __vstOverlayInit guard)
- Corruption thermometer: combat render, right edge (hidden when corruption=0)
- Strike animation: 6-phase state machine in handleStrike
- Boss projectile: uses Projectile component, fires from bossRef to stageRef
- HandCard component: ~line 2070, accepts chainReady prop
- BossSection component: ~line 2414, accepts bossStrikeAnim + scaledMaxHp
- ErrorBoundary: end of file, MUST have `return this.props.children`

## CRITICAL GOTCHAS
1. main.jsx changes require full server restart + `rm -rf node_modules/.vite`
2. BogartsMetalFont has NO number glyphs — use MBScribblesFont for digits
3. 420 is a sacred constant (stash cap, card height — never change)
4. Always use functional updates for setEnemyHp: `prev => Math.min(prev, newVal)`
5. Boss HP bar must use scaledMaxHp (not enemy.maxHp)
6. ErrorBoundary MUST have `return this.props.children` or entire app goes black
7. Tutorial fights intercept triggerVictory — skip all normal victory processing
8. First-encounter tips tracked in localStorage 'vst_tips' as JSON array
9. Tutorial completion tracked in localStorage 'vst_tutorial'
