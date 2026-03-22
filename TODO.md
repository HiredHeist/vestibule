# Vestibule — Master TODO & Design Reference
*Last updated: Sunday, March 22, 2026 at 11:24 AM (JST)*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

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

## P1 — DO NEXT

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
