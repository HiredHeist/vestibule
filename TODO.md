# Vestibule — Master TODO & Design Reference
*Last updated: Sunday, March 22, 2026 at 08:45 PM (JST) — Session 13*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

## ✅ Session 13 — In Progress (March 22 evening)
- [x] **Usurer HP 680→420** — C4 wall solved (98.9% survive now)
- [x] **Remaster stale closure fix** — moved to handleDropOnStage (same fix as Setlist/Burnset)
- [x] **Sim v9.0 rebuilt from scratch** — accurate packs (2/3/4 candidates), Touring C2, Demonic C4, correct tier odds, smart shop AI, mentor link optimization, stage rearrangement, pawn shop selling, CF heal targets weakest, Distortion +15%, Remaster Option C, full tracking stats
- [ ] **C5 Anger wall** — 65.5% of runs die here. Warlord (1520HP) kills 30.9% alone. Needs balance pass.
- [ ] **Re-sim after C5 fix** — target: ~45-50% C5 survival, 2-4% Lucifer encounters
- [ ] **War Drums artifact** — +1 Strike permanently, C4+ shop, 30-40🌿 (discussion needed)
- [ ] **Share score button** — copy formatted string to clipboard

## 🔴 TONIGHT'S PRIORITY LIST (ordered)

1. **C5 Anger balance** — soften rageScale: Berserker +3→+2, Warlord +4→+3 AND HP 1520→1200
2. **Re-sim 20k** — confirm C5 survival ~45-50%, check C6-C9 flow
3. **War Drums artifact** — +1 Strike per fight, rare, C4+ shop, 35🌿. Chase item that enables late-game.
4. **Re-sim with War Drums** — check if 6.66% Lucifer win rate is reachable
5. **Share score button** — "Vestibule RUN #N — SCORE: X — Fell to Y at CZ — SEED: ABC" → clipboard
6. **Score display playtest** — verify real death screen renders score (Shift+D uses dummy data)
7. **Full playthrough stress test** — clean run start to finish, verify no bugs

---

 — Design Decisions (Session 11, March 22)

### Core Philosophy
The loop is currently: play → die → play again. That is habit, not addiction.
Addiction requires: play → die → see score → see tier → see next unlock → play again IMMEDIATELY.
Slay the Spire has 1000+ hour players because every run has a score to beat, something unlocking, and a daily challenge.
We need all three.

---

#### ✅ Pack + Feedback + Shop Member fixes
- ~~**Touring Pack from C2** (was C3) — Mentor Link possible from C2~~
- ~~**Touring Pack odds** — foil 15%→25%, mythic 0%→5%~~
- ~~**Demonic Pack from C4** (was C5) — available before Hoarder wall~~
- ~~**Demonic Pack odds** — demonic 3%→5%~~
- ~~**Controlled Feedback** — now heals target member 50% max HP on play~~
- ~~**Center shop member** — shows specific named member (Foil Bjorn etc) not mystery card~~

## ✅ Mentor Link + Hoarder HP — Pushed e51626f
- ~~**Mentor Link fully implemented** — scanMentorLinks(), MENTOR_LINK_BONUS constants, all triggers wired~~
- ~~**Tier bonuses:** Foil +1ATK/+2HP/×1.5, Mythic +2ATK/+4HP/×2.0, Demonic +4ATK/+8HP/×3.0~~
- ~~**Gold border + ⛓ pulse animation** on active links, 💔 when mentor is dead~~
- ~~**Strike multiplier stacks** with Overdrive and Double Time~~
- ~~**Revival restores bond** if mentor is revived mid-fight~~
- ~~**Hoarder HP 480→300**~~
- ~~**PostCSS @import ordering fix** in App.css~~

### ✅ Pack + Recruit fixes
- ~~**Member card in center shop now triggers recruit screen** — was wrongly going to deck via buyCard~~
- ~~**Buying member card no longer marks artifact as sold** — onMarkSold now uses uid only~~
- ~~**Touring Pack available from C2** (was C3) — enables Mentor Link earlier~~
- ~~**Demonic Pack available from C4** (was C5) — available before Hoarder wall~~
- ~~**Touring Pack odds: 25% Foil, 5% Mythic** (was 15% Foil, 0% Mythic)~~
- ~~**Demonic Pack odds: 5% Demonic** (was 3%)~~

### ✅ Score System — Pushed
- ~~**Score formula** — circleReached×1000 + fights×150 + damage÷10 + highestStrike×5 + stash×2 - tooStoned×50~~
- ~~**Grade tiers** — GARAGE BAND / OPENING ACT / LOCAL LEGEND / TOURING ACT / HEADLINER / CULT LEGEND / LUCIFER SLAYER (win only)~~
- ~~**Count-up animation** — score ticks up over 1.8s on death screen~~
- ~~**Personal best** — localStorage, shows "NEW BEST!" or "X pts away"~~
- ~~**Daily streak** — consecutive days tracked, shows 🔥 N DAY STREAK~~
- ~~**Run counter** — RUN #N shown on death screen~~
- ~~**TODO: LUCIFER SLAYER unlocks Lucifer as a playable member (broken/TBD stats)**~~

## 🔴 P1 — UNBLOCK THE GAME (do first, everything else depends on this)

- [x] **Hoarder HP 480→300** — sim confirms fixed
- [x] **Usurer HP 680→420** — sim confirms 98.9% survive C4 now
- [x] **Implement Mentor Link** — fully implemented Session 12
- [x] **Sim v9.0** — accurate pack system, mentor link aware, smart shop AI
- [ ] **C5 Anger balance** — Warlord kills 30.9%, rageScale too punishing. Cut Berserker +3→+2, Warlord +4→+3, HP 1520→1200.
- [ ] **Re-sim after C5 fix** — target ~45-50% C5 survival
- [ ] **War Drums artifact** — +1 Strike permanently, rare C4+ artifact, 35🌿. Enables late-game.
- [ ] **Lucifer phase system (P2)** — 3 phases × 140,222 HP with different passives. DISCUSS before implementing.
- [ ] **Target:** ~6.66% Lucifer win rate

---

## 🏆 P1 — SCORE SYSTEM (biggest retention feature)

- [x] **Score formula** — `(circleReached × 1000) + (fightsWon × 150) + (totalDamage ÷ 10) + (highestStrike × 5) + (stashEarned × 2) - (tooStonedEvents × 50)`
- [x] **Score displayed on death screen** — large, prominent, always shown
- [x] **Score counter tick-up animation** — numbers count up to final score on death screen
- [x] **Grade/tier label** — F → D → C → B → A → S → ⛧ LUCIFER SLAYER (hardcoded brackets from sim data)
- [x] **Personal best in localStorage** — "YOU BEAT YOUR BEST BY 420 🌿" — miss: "YOUR BEST: 6,100 — 1,680 short"
- [x] **Run number displayed** — small "RUN #47" corner counter, persists in localStorage

---

## 🔥 P1 — DAILY CHALLENGE + STREAK

- [ ] **Daily seed banner on Opening Night** — prominent "TODAY'S SEED: 4F2A — March 22", not buried
- [ ] **Daily attempt locked** — first daily play locks score, no re-runs for daily category
- [x] **Daily streak counter** — 🔥 7 DAY STREAK shown on death screen. Resets on miss. Daily habit engine.
- [ ] **Share score button** — copies "Vestibule — RUN #47 — SCORE: 12,420 ⛧ CONDEMNED — Fell to The Hoarder at C4 — SEED: 67D60A" — free viral marketing

---

## 🔓 P2 — UNLOCK SYSTEM

- [ ] **Unlock milestone teaser on death screen** — "NEXT UNLOCK AT: 5,000 pts — ??? Member" even before real unlocks exist
- [ ] **Lifetime score tracking** — cumulative across all runs, stored localStorage
- [ ] **Milestone unlocks (lifetime score):**
  - 1,000 pts → Loki (CORRUPT Synth Player) unlocked
  - 3,000 pts → Vitalik (FOLK MAGIC, ATK 6) unlocked  
  - 5,000 pts → Bonus artifact slot unlocked
  - 10,000 pts → A11–A20 artifact set unlocked
  - 25,000 pts → Lucifer's Guitarist (demonic tier, absurd stats)
- [ ] **Achievement unlocks (one-time triggers):**
  - First boss defeated → Foil card variants appear in shop
  - 100% corruption + survived → Distortion Foil unlocked
  - Folk Magic fired 5× in one run → Vitalik Mythic variant
  - Beat The Miser without spending stash → Going Broke card unlocked

---

## ✨ P2 — POLISH + ANIMATIONS

- [ ] **Circle complete flash** — 2 second "⛧ CIRCLE I CLEARED ⛧" screen with stash earned before shop. Circle number fills with visual effect progressing toward apocalyptic by C7+.
- [ ] **Score tick-up animation on death screen** — counter counts up to final score
- [ ] **Lucifer boss intro cinematic** — brief screen before fight 27, builds dread
- [ ] **Death screen boss slam-in** — boss emoji animates in dramatically on beaten screen

---

## 🃏 P2 — CARD BALANCE PASS (after sim confirms wall is gone)

- [ ] **Signal Decay rework** — 0.02 plays/game, AI avoids it. Change to: "Discard 1 card from hand. Draw 2 cards." Cycle card, keeps theme.
- [ ] **Wake Up Call: 2 embers → 0** — revival should feel free in emergencies
- [ ] **Roadie: immune 1 strike → immune 2 strikes** — not worth a deck slot at 1 strike
- [ ] **Séance: 2 embers → 1 ember** — corruption-scaling heal needs to be cheaper to pick early
- [ ] **Double Down: update sim AI** — AI not chaining it correctly. Fix expertStrike to play it before most expensive card in hand.

---

## 🌐 P3 — ONLINE LEADERBOARD (after offline loop is proven addicting)

- [ ] **Weekly leaderboard** — top 100 scores, resets Sunday midnight
- [ ] **Two categories** — Best Seeded Run (verifiable, anyone can replay) + Best Random Run
- [ ] **Seed replay** — clicking a leaderboard seed loads that exact run
- [ ] **No account required** — name typed once, stored locally


---

## 🔴 PLAYTEST BUGS — Session 10 (March 21–22)
**✅ CODE VERIFIED: 26/26 checks passed — all 13 bugs confirmed fixed**

- ~~**Burn the Set black screen** — FIXED: was calling setHand/setDeck/setDiscardPile inside applyCard AND handleDropOnStage — two competing state updates. Now handled entirely in handleDropOnStage, applyCard skipped~~
- ~~**buildDeck copies fallback was 3** — FIXED: `c.copies||3` changed to `c.copies||2` so no card accidentally gets 3 copies~~


- ~~**#1 Amp the Static silently unplayable** — FIXED: effect text says "Requires Corruption > 0", shows "Need Corruption!" float at boss~~
- ~~**#2 Burn the Set no selection UI** — FIXED: effect text rewritten to explain mechanic, tip shown in log when played with no cards selected~~
- ~~**#3 Artifacts/passives re-appear after purchase** — FIXED: App-level shopSoldIds persists sold state across visits, clears only when shop rotates~~
- ~~**#4 Stage Dive stuck selected** — FIXED: clears from selected state on use, onClick blocked when card is already used~~
- ~~**#5 Hand over-cap via Groupie draw** — FIXED: Groupie draw capped at HAND_SIZE inside setHand callback~~
- ~~**#6 Foil/Mythic/Demonic no stage visual** — FIXED: tier badge top-right, colored top bar (silver/purple/gold), matching border glow~~
- ~~**#7 Circle artifacts/passives never rotate** — FIXED: circleArtifact/Passive now have setters, rotate at each circle boss~~
- ~~**#8 Permanent ATK buffs reverting between fights** — FIXED: fight start clears _origAtk and restores permanent ATK value~~
- ~~**#9 FOLK MAGIC silent ember refill** — FIXED: float now fires centre-screen, large and unmissable~~
- ~~**#10 Death Riff confusing/broken** — FIXED: effect text rewritten, always playable (deals 0 dmg at 100% corruption instead of blocking)~~
- ~~**#11 Booster pack cards/members silently lost** — FIXED: handleShopSpend now has 'pack' handler — members→recruit flow, cards→deck, artifacts+passives→equip~~
- ~~**#12 HP 0 without Too Stoned** — FIXED: stoneShield now saves at 1HP minimum, shows SHIELDED float, no zombie state~~
- ~~**#13 Hand fills with unplayable cards** — FIXED: unaffordable cards show "NEED X🔥" label under ember badge~~
- ~~**#14 Foil member card played from hand with no effect** — FIXED: members never go to deck now, always route to recruit flow~~

---

- ~~**Setlist draw lost** — same double state update bug as Burn the Set. Moved to handleDropOnStage, draws now persist correctly~~
- ~~**Double member join log** — addLog inside setStage updater fired twice. Moved outside updater~~
- ~~**Double Too Stoned log** — same cause, deferred with setTimeout~~
### ✅ Batch 3 — Pushed
- ~~**Two distinct death screens** — "Stoned to the Bone" only when all members Too Stoned. "Beaten" screen when strikes run out~~
- ~~**Beaten screen shows boss** — large boss emoji, boss name, circle, subtitle, sassy tagline~~
- ~~**27 boss taglines** (apostrophes fixed — Couldn't→Could not etc)~~
- ~~**27 boss taglines** — every enemy from Wanderer to Lucifer has a unique line~~
- ~~**deathCause wired correctly** — allStoned→'stoned', out of strikes→'beaten', win→'victory'~~

### ✅ Batch 2 — Pushed
- ~~**Hand over-cap uncapped** — Groupie draws above HAND_SIZE, between-strike refill fills back to max(6, current hand size)~~
- ~~**Soundboard actually draws** — pendingDraw state fires at start of next strike, draw is uncapped~~
- ~~**Setlist reworked** — draws 2 cards immediately (uncapped), then forces player to discard 1 before continuing~~
- ~~**Hover overlap reduced** — card fan margins tightened so hover misfires are less frequent~~

### ✅ Batch 1 — Pushed 26c51f9
- ~~**Circle artifact/passive SOLD persists** — circleCartBought/circleCpasBought moved to App state, reset only on circle rotation~~
- ~~**deathCause triggers fixed** — allStoned→'stoned', out of strikes→'beaten' (was backwards)~~
- ~~**Amp Overload reworked** — now costs 1 discard (sacrifices a yellow block), unplayable at 0 discards~~
- ~~**Remaster Option C** — delete 1 selected card from hand, draw 3. No more self-copy exploit~~

## 🔴 STRESS TEST BUGS — Session 11 (March 22, found during live play)

### ✅ Batch A — Pushed (double-fire + card bugs)
- ~~**discover() fires twice** — ref guard outside setter~~
- ~~**Too Stoned fires twice** — addLog moved outside setStage~~
- ~~**Soundboard draws twice** — addLog moved outside setDeck~~
- ~~**Recruit joins twice** — recruitPickFiredRef guard~~
- ~~**Setlist opens twice** — guard in handleDropOnStage~~
- ~~**Demo Tape no effect on Resonance** — Resonance+Distortion+DoubleDown cases added~~
- ~~**Distortion +10%→+15%** — impl and msg synced~~
- ~~**Circle sold triple-safety** — now checks soldIds too~~
- ~~**NEED X🔥 too small** — bigger font, red glow, dark bg~~

### Batch A — Double-log / React double-fire (all same root cause)
- [x] **Recruit joins twice** — Ingrid, Sigrid, Dag all logged `🎸 X joins!` twice at same timestamp
- [x] **Too Stoned fires twice** — `💨 TOO STONED` same timestamp x2 in damage handler
- [x] **Hellquake DISCOVERED fires twice** — discover() called twice on same event
- [x] **Setlist modal opens twice** — `Drew 2 cards` logged twice in same fight
- [x] **Soundboard draws twice** — `pendingDraw` fires twice from one play

### Batch B — Card behaviour bugs
- [x] **Demo Tape no effect on Dag** — logged as replayed but target effect didn't apply
- [x] **Distortion impl still +10% not +15%** — def updated but impl never synced
- [x] **Circle artifact/passive re-appears after buying** — Batch 1 fix not working in practice
- [x] **NEED X🔥 label not prominent enough** — players think Feedback Loop/Distortion are broken, not unaffordable

## P1 — IMMEDIATE (see addiction layer above for full list)

- [ ] **Full playthrough stress test** — Batch 1 pushed, needs retest — all 13 bugs fixed, needs a clean run start to finish
- [ ] **Run 200k sim** — after Batch 2+3 complete — `node vestibule-sim.js 200000` — economy and card changes need fresh balance data
- [ ] **ANCHOR+ANCHOR starting pair** — unwinnable combination, design consideration

---

## P2 — BEFORE DEMO

- [ ] **Run score number on death screen** — single chase-able number, biggest retention feature
- [ ] **Daily Challenge + leaderboard** — same seed for everyone, global comparison
- [ ] **Unlockable members** — give players a reason to keep running
- [ ] **Hoarder HP** — sim showed 0% survival at F10 (480HP), recommend reducing to ~340
- [ ] **Circle complete cinematic** — brief milestone moment between circles

---

## P3 — FUTURE

- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives
- [ ] Collection/unlock screen
- [ ] Settings menu
- [ ] Steam / mobile / PS release prep
- [ ] A&R Rep bonus stage after beating Lucifer

---

## RULE: Update TODO on EVERY push. No exceptions. Always use JST time.

---

## ✅ COMPLETED — Sessions 1–10

### Session 10 (March 21–22)
- ~~Fire & Recruit panel — when stage full (5/5) on recruit screen, fire panel appears bottom-right showing all members with sell prices~~
- ~~Fire panel 2× larger — width 520, fonts 15-38px, emoji 36px, HP shown per member~~
- ~~Card balance pass — Stage Dive/Signal Decay/Controlled Feedback/Remaster reduced to 1 copy~~
- ~~Weak ember cards buffed — Power Tap +2, Groupie draw1+2embers, Setbreak player choice~~
- ~~Roadie immune+heal2HP, Distortion +15%, Static Charge simplified~~
- ~~Burn the Set reworked — 1 ember, select up to 3 to discard, draw that many +1~~
- ~~Hand over-cap display — shows "7 of 6 ⚡", cards spread wider~~
- ~~Hellquake explainer text — all 10 outcomes show plain-English description~~
- ~~Starting stash 3🌿 — guarantees Garage Band Pack after fight 1~~
- ~~stealStash passive removed — replaced with stashScale (hit harder based on stash carried)~~
- ~~Herb economy rebalanced — C1 base 2-4 → 8-10, C1 deaths 7.6% → 0.2% in sim~~
- ~~Miser HP 360→260 — data driven: median F9 damage 192, 360 was top-10% only~~
- ~~800k simulation report + addictiveness roadmap written to SIMULATION_REPORT.md~~

### Sessions 1–9
- ~~Full card set (35 cards), all artifacts (a1-a10), all passives (p1-p10)~~
- ~~27 fights, 9 circles, all enemy passives~~
- ~~Mentor Link — foil/mythic/demonic tiers, bonds, auras, demonic conflict~~
- ~~Pawn shop — sell members + cards, max 2 sales, SOLD stamp~~
- ~~Booster + recruitment pack system~~
- ~~Stage drag-and-drop, DOUBLE TIME, Too Stoned, ANCHOR positioning~~
- ~~Opening Night — keyword ability descriptions, band synergy~~
- ~~4 fonts: Bogarts Metal, Scratch, MBScribbles, Break Gothic~~
- ~~End screen — green glow death message, stats 150% bigger~~
- ~~Boss HP pulsing red, circle header glowing~~
- ~~Hover bug fixed — hover tracked by hand INDEX not card.uid~~
- ~~AI combo rewrite — expertStrike rebuilt, 9 phases, all combos~~
- ~~Shift+D dev shortcut — instant death screen~~
- ~~Resonance auto-discard bug fixed~~

---

## Dev Shortcuts
- **Shift+S** — shop with 69 stash (any screen)
- **Shift+D** — death/end screen (any screen)

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 3 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight → +1 max ember permanently
- **420 is sacred. Never change card height.**
- Stash rewards: circleBaseMin=[8,6,7,9,11,11,13,13,16], circleBaseRange=[3,4,4,4,5,5,6,6,8]

## Enemy HP Scaling
Wanderer 27 → Lost Soul 42 → Drifter 69 → Siren 60 → Seducer 140 → Glutton 80 → Devourer 160
Miser **260** → Hoarder 480 → Usurer 680 → Wrathful 800 → Warlord 1520 → Heretic 1650
False Prophet 3000 → Brute 3000 → Executioner 5500 → Archfraud 9600 → Betrayer 11400 → **LUCIFER 420,666**

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
