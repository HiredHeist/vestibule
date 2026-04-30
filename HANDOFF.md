# VESTIBULE — HANDOFF DOCUMENT
## Last updated: May 1, 2026 (overnight polish + sim verification)

---

## WHO YOU ARE
You are "Roadie" — Claude, the AI dev partner for Vestibule.
JV (alias "VomitWizard", may change before release) is a solo developer
and music producer living in rural Minamiyamashiro, Japan. They play doom
metal, build analog pedals, collect vinyl, and have a large guitar/synth rig.
GitHub: HiredHeist. Repo: github.com/HiredHeist/vestibule (private).
PAT: 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 (expires ~Jun 17 2026).
You have direct git push access to main.

JV works from a three-terminal setup: dev server, git pull, Claude Code CLI.
JV likes: direct communication, no BS, fast iteration, 420 jokes, doom metal.
JV hates: tiny unreadable fonts, ugly red corruption overlays, wasted screen space.

---

## WHAT VESTIBULE IS
Doom metal roguelite deckbuilder in React/Vite. Think Balatro meets Black Sabbath.
9 circles of Hell, multiplicative combo system, 85 card pool, 69 cards per deck.
Balatro-style "number go up" with doom metal theming.

**Sacred constants:** 420 (stash cap, card height), 69 (deck size).
**Fonts:** BogartsMetalFont (display), MBScribblesFont (UI/readable), ScratchFont (flavor — 20pt+ ONLY, lint enforced).
**Design tokens (App.css :root):** 5 text + 2 semantic + 4 type + 2 tier = 13 tokens. Lint guards on file. `npm run check` enforces.
**Minimum font size:** 13px (10pt) globally. NEVER go under this. Lint enforced.
**Default readable font:** MBScribblesFont. ScratchFont is decorative — anything under 20pt MUST use MBScribblesFont. Lint enforced.

---

## CURRENT STATE (commit 0f1d548 + parallel session art commits — May 1, 2026)

### What's working:
- Full game loop: menu → deck select → 9 circles × 3 fights → Lucifer boss → victory
- Balatro multiplicative combo system (×1.05 per card, corruption mult, artifact triggers)
- 85 cards, all balanced (8 cards rebalanced previously, 1 outlier flagged from sim — Herb Money 0.4% pick)
- 42 card texts rewritten for clarity (no jargon, plain English)
- 80/86 card arts are PixelLab pixel art (6 still procedural)
- 5 booster pack arts (touring/underground/festival/headliner/demonic)
- Save/resume system (auto-save at fight start)
- 5 starter decks (Standard/Shredder/Ritualist/Engineer/Survivor)
- Shop with Sly the Fence character (animated GIF portrait shipped, 172×256 pixel art looping idle in shop slot)
- Doom Forge card upgrades
- Pact system (risk/reward modifiers)
- Score system with grades (D→SS)
- Daily challenge with "Beat VomitWizard" target (6,666)
- Lucky Draw (seeded 1-in-10 bonus, locked behind Lucifer kill, toggleable)
- Collection screen (Pokédex style, filter tabs, completion %, click-to-inspect)
- 11 music tracks (placeholder) with working volume slider
- Cold open splash screen with localStorage skip
- Electron wrapper ready for Steam

### THE ADDICTION UPDATE (20 dopamine features, all live):
1. Live damage preview pulse on change
2. Screen effects scaling with damage (8 tiers: 50/200/500/1K/2.5K/5K/10K+)
3. Ascending pitch beep on each card played (300Hz + 120Hz/card)
4. Boss HP bar critical pulse below 50%
5. Post-strike highlight flash ("4,847 DMG ×4.2" + "NEW BEST!")
6. Stash count-up with cha-ching sounds
7. Chain fire golden screen flash + rising synth
8. Strike button escalation (4 tiers: normal/glow/blaze/inferno)
9. Daily "Beat VomitWizard" score target
10. Lucky Draw (seeded, post-game unlock, toggleable)
11. Artifact trigger pulse (icon flashes gold in sidebar)
12. Corruption heartbeat vignette (red pulse at screen edges)
13. Chain name callout ("⛧ MOSH MADNESS ⛧" center screen, 52px)
14. Card mastery pops at 10/25/50/100/250/500 plays
15. Member MVP after victory ("⭐ MVP: Björn — 24 ATK")
16. Shop "NEW!" badges on never-played cards
17. Live grade tracker in top-left (D→C→B→A→S→SS)
18. Member distress at ≤25% HP (subtle desaturate + shake)
19. Multiplier milestones (×2/×4/×8/×16 celebrations)
20. Stash milestones (100/200/300/420 fanfare chord)

### Custom AE splash animation system:
Drop WebM files at `public/vestibule/fx/[tier].webm` — auto-play fullscreen
with mix-blend-mode:screen. 7 tiers: solid, heavy, critical, massive,
devastating, ultra, godlike. 1920×1080, black background.

---

## OVERNIGHT POLISH SESSION — APRIL 30 → MAY 1, 2026

Multi-hour shop polish + readability + dopamine-system pass. All commits
on main, all green builds, all 4 lint rules clean.

### Shop redesign (multiple rounds)
- Cards-for-sale section scaled to 75% (300×420 → 225×315) freeing center vertical
- Bottom row (Boosters + Sly's Buyback) grew taller (420 → 520) for prominence
- New Sly Icon panel beside Sly's Buyback (300×520) — clickable, opens PawnShopModal
- **Sly portrait shipped** — animated GIF (172×256, looping idle) at `public/sly.gif`,
  rendered with `objectFit:contain` + `imageRendering:pixelated` in the panel slot
- Removed redundant "Sell Your Shit" button from Buyback rates panel
- BACK TO THE PIT button: wider (240px), single line, throbbing red pulse
  via new `@keyframes throbPulseRed` (2.4s cycle, hover pauses)
- SLY'S MERCH header: banner taller (54→78), font 26→30, fits inside chevrons
- "Another Look" → "🎲 Reroll" — wider single-line, wiggle preserved
- Sly quote text: ScratchFont 13→14 → MBScribblesFont 14-15 (readable)
- 🍄 Shrooms / 🧪 Acid emojis: 28 → 48 with tinted drop shadows
- Left column reorganized: Band Recruitment dominates (flex:1, art 200→288),
  Artifact + Effect Pedal panels bottom-justified
- Renamed "⛧ Vintage Amp · C{N}" → "⛧ Artifact" (Balatro-Joker logic — items rotate per shop)
- Renamed "⛧ Effect Pedal · C{N}" → "⛧ Effect Pedal"

### Effect Pedal slots in left sidebar (during fights)
Always-render 3+ purple slots parallel to artifact tray. Empty state shows
⚡ icon + "EFFECT PEDAL" placeholder. Filled state has gradient + glow +
hover tooltip with full effect text. Players see from fight 1 that two
collectable systems exist.

### Phase banner cleanup
"⛧ Play Cards" idle text removed (redundant). "⚔ Striking!" / "👿 Boss
Attacks" still telegraph hands-off animation phases. Tip-of-the-day shows
during idle in its own positioned div.

### Sly reactive dialogue — extended
Added 3 new line pools (5 lines each):
- `hoverArtifact` — top priority when hovering circle artifact panel
- `cleanedOut` — when shop is fully bought-out / unaffordable
- `encore` — when entering shop in encore mode (post-Lucifer)
Wired `encoreMode` prop into ShopScreen, added `hoveringArtifact` state.

### Heat indicator on main menu
🔥 HEAT 3/10 panel below stake selector. 10-pip row fades gold → orange → red
as level rises. +15% boss HP per level. "Beat Lucifer to raise Heat" hint
when not maxed, "⛧ MAX HEAT ⛧" at level 10. Hover tooltip explains system.

### Stats screen (📊 Stats button on main menu)
Full-screen modal with 12 stat cards in 4-column grid:
Total Runs, Personal Best, Lifetime Score, Heat Level, Bosses Defeated (X/28),
Cards Discovered (X/85), Daily Streak, Win Streak, Stakes Conquered (X/6),
Achievements, Combos Found, Daily Best.
Bottom panel: top 5 most-played cards with art + count.
All from existing localStorage — no new tracking added.

### Font legibility migration
- 41 ScratchFont usages with fontSize<20 → MBScribblesFont
- 24 ScratchFont usages at fontSize≥20 kept (splash titles, victory text, etc)
- Pawn shop "Deck is empty.", hunger warnings, polaroid labels, map rewards,
  tutorial flavor — all migrated
- New lint rule 1b enforces ScratchFont≥20pt forever

### Hover glitch fix
Diagnosed 3-way conflict: `throbShop` animation animating box-shadow,
inline `boxShadow` set at rest, `transition: box-shadow 0.15s` causing
React re-renders to flicker. Fix: removed inline boxShadow at rest from
SaleCard + BoosterPack, conditionally applied on hover via spread, removed
`box-shadow` from transition rule. Animation owns rest state exclusively.

### Band Recruitment border vanishing fix
Hover gold-glow was washing out same-hued gold border. Brightened border to
near-white-gold (rgba(255,220,120,1)) on hover with inset highlight.

### Pack art +20%
Recruitment pack image 240 → 288, since Band Recruitment is now flex:1 and
deserves the visual weight.

### Empty slot legibility
Empty Artifact + Effect Pedal placeholder text bumped from 0.45/0.5 alpha
to 0.65/0.7 with letter-spacing 1→1.5 + fontWeight:900. Still clearly empty,
now actually readable.

### Design system status
**13 sanctioned tokens (started at 180 unique inline hex):**
- 5 text hierarchy: --text-primary / --text-secondary / --text-muted / --text-gold / --text-blood
- 2 semantic: --text-positive / --text-inverse
- 4 type identity: --type-riff / --type-corrupt / --type-utility / --type-ember
- 2 tier identity: --tier-mythic / --tier-foil

**4 lint rules tracked, all clean:**
1. Font size floor ≥13px
2. ScratchFont legibility ≥20pt
3. Text colors on palette (no off-token hex in JSX text styles)
4. Type-identity tokens

`npm run check` is hard CI guard — passes only on tokens.

### 10K-RUN BALANCE SIM (overnight)
Ran 10,000 games across all 6 stakes. **Major findings:**
- ✅ Card economy healthy: 36 cards seen, no dead picks except Herb Money (0.4%)
- ✅ Slot-machine systems firing: 9 chains/game, 3.4 forge upgrades, 3.4 pacts,
  43% mentor link engagement
- ❌ **Lucifer is unreachable at every stake** — 0/10000 wins. C7-C9 boss HP
  scaling needs a pass. 82% of bronze runs end in Circle 4 or 5.
- ❌ Acid is functionally broken — 40:1 shroom-to-acid usage ratio
- ⚠ Hellquakes never fire in sim (corruption-100% never reached because
  runs don't survive that long)

Full report at `SIM_REPORT_MORNING.md`. Raw outputs at
`/tmp/sim_results/{stake}.txt`.

---

## KEY TECHNICAL DETAILS

### Vite config:
- `base: '/vestibule/'` — ALL asset paths must use `import.meta.env.BASE_URL`
- NEVER hardcode `/vestibule/` in asset paths
- After main.jsx changes: `rm -rf node_modules/.vite` + restart

### React patterns:
- Named imports only (no `import React from 'react'`)
- No side effects inside `setX(prev => ...)` updaters (React 18 Strict Mode)
- Use REFS for values read inside useCallback (stale closure prevention)
- `lastRiffPlayedRef` pattern: state + ref mirror for useCallback access
- ErrorBoundary MUST `return this.props.children`

### State architecture:
- App.jsx is ~9050 lines (needs splitting — on TODO list)
- handleShopLeave deps: [fightIndex,maxEmbers,stage,selectedDeck,activeStake,
  chosenPacts,activeArtifacts,activePassives,corruption,collectedLoot,encoreMode,
  bonusDiscards,bonusEmbers,tutorialFight,upgradedCards,heldShrooms,heldAcid,stash]
- applyCard deps are comprehensive (line ~5564)
- CardArtImg auto-loads PNGs from `public/vestibule/cards/[id].png`
- PackArtImg uses PACK_ART_MAP: {cassette:'touring',cdr:'underground',
  vinyl:'festival',rarevinyl:'headliner',cursed:'demonic'}

### Known patterns that WILL break things:
- Orphaned state setters (state deleted but setter call remains) → crash
- `setUnlockTab_` has underscore — wrapper `setUnlockTab` calls it
- `const [musicVol,setMusicVol]` not `setMusicVolume`
- Always check `getMasteryPlays()` exists (was missing, broke all card plays)
- Every commit MUST update TODO.md

---

## BUGS FIXED THIS SESSION
1. `setSkipNextDiscard` orphaned — crashed "Back to the Pit" every click
2. `setVictoryFired` orphaned — would crash encore mode
3. `setCorruptionGiftsGiven` orphaned — would crash encore mode
4. `setMusicVolume` → `setMusicVol` name mismatch — music slider broken
5. `getMasteryPlays` undefined — broke ALL card plays (cards wouldn't leave hand)
6. Demo Tape stale closure (lastRiffPlayed → lastRiffPlayedRef)
7. Demo Tape only handled 12/31 riff cards — added all 31 + generic fallback
8. `corruption` not passed as prop to HandCard
9. 83 hardcoded `/vestibule/` asset paths fixed for Vite BASE_URL
10. 4 "permanentlyanent" typos fixed
11. handleShopLeave stale closure — deps expanded from 3 to 18 state variables
12. Music volume slider now persists to localStorage AND updates live playback
13. setUnlockTab duplicate declaration fixed
14. setGenreCounts orphaned (genre system removed)
15. Victory/retry buttons used undefined `victory` instead of `isVictory`

---

## WHAT JV NEEDS TO DO (ART + AUDIO)

### Card art still procedural (6 cards):
- skullsplitter, tappedout, hungercard, madnesscard, whispercard, void_pact
- 128×128, transparent bg, drop at public/vestibule/cards/[id].png

### Artifacts (12, all procedural):
a1, a3, a5, a6, a8, a9, a10, wardrums, ca1, ca2, ca3, ca4
- 128×128, gold accent, public/vestibule/artifacts/

### Passives (10, all procedural):
p1-p10
- 128×128, purple accent, public/vestibule/passives/

### Booster packs: need retheme to match names (cassette/cdr/vinyl/rarevinyl/cursed)

### Other art needed:
- Card back (128×178), Sly portrait (128×128)
- 5 deck covers (128×128), App icon (512×512)
- Recruitment pack art, Steam capsules (4 sizes)
- 7 AE damage splash animations (1920×1080 WebM, see ART_TODO.md)
- Cold open AE animation (added to TODO)

### Audio (blocked until CA guitar trip):
- Replace 11 placeholder tracks with real doom metal
- SFX: card play, strike, chain, stoned, boss kill

---

## WHAT CLAUDE NEEDS TO DO (CODE)

### HIGH PRIORITY:
1. Shop overhaul — make it feel like a back-alley deal, not a spreadsheet
2. Wire pack art into BoosterPack tear animation
3. Wire recruitment pack to use pack art
4. Wire card back, deck covers, Sly portrait when art is ready
5. UI cleanup pass after 13px font bump (layouts may overflow)

### MEDIUM PRIORITY:
6. Split App.jsx into modules (~9050 lines is dangerous)
7. Run statistics page (lifetime stats)
8. Mobile touch controls (tap-to-select, tap-member-to-play)
9. More dopamine juice (screen crack overlays, particles, camera zoom)
10. Pack tear-open animation (Pokémon style)

### LOW PRIORITY:
11. Heat system rewards visible on menu
12. Electron build testing
13. Sim recalibration after card rebalance
14. Steam achievements integration

---

## CARD BALANCE CHANGES THIS SESSION

### Cost reductions (8 cards):
- Battle Cry: 2e → 1e
- Dark Tuning: 3e → 2e
- Possessed Performance: 4e → 3e
- Stage Dive: 4e → 3e
- Sonic Boom: 4e → 3e
- Skull Splitter: 3e → 2e
- Feedback Loop: 3e → 2e
- Amp the Static: 3e → 2e

### Text clarity (42 cards rewritten):
- No jargon, no math homework, plain English
- "×2 ATK this Strike" → "DOUBLE damage"
- "Target attacks again this Strike" → "Target attacks TWICE"
- Full list in CARD_REFERENCE.md

---

## DESIGN PHILOSOPHY
- 69 = deck size, 85 = total card pool. Not all cards appear in every run.
- Permanent ATK buffs > direct damage. No division math.
- Every card should do ONE thing simply.
- Nuclear moments 1 in 20 strikes.
- Corruption is POWER (risk/reward).
- Target: most addictive card game possible.
- Price: $4.20 pre-order / $6.66 full / $9.99 release.
- Ship readiness: 8/10. Music is #1 launch blocker.
- The number 420 is sacred — never change as stash cap or card height.
- Dev alias: VomitWizard (may change before release).
- JV has ~1 month of funds. Ship Early Access ASAP.
- Path: Steam → Mobile ($4.99) → Console (publisher deal after 10k units).

---

## HOW TO START A NEW SESSION
1. `cd ~/vestibule && git pull`
2. Read this HANDOFF.md
3. Check TODO.md and ART_TODO.md for current priorities
4. Ask JV "what are we building?" and go

## REFERENCE FILES IN REPO:
- HANDOFF.md (this file)
- TODO.md (task list)
- ART_TODO.md (all art needed with descriptions)
- CARD_REFERENCE.md (all 85 cards with costs/effects)
- AUDIT_REPORT.md (code health status)
- CARD_ART_GUIDE.md (PixelLab prompt descriptions)
- STEAM.md (Electron build guide)
- SIMULATION_REPORT.md (balance data)

## TRANSCRIPT LOCATION:
/mnt/transcripts/ — contains full conversation history from all sessions.
Read incrementally (files are massive). Check journal.txt for catalog.
