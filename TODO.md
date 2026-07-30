# VESTIBULE — TODO

*Last updated: July 30, 2026 — bot-playtest rig operational, code audit clean ✅*
*Branch state: main = audited stable · playtest/session2 = bot rig WIP (see HANDOFF.md)*

## 🤖 CURRENT PHASE — AUTONOMOUS PLAYTEST (July 30)

Bot rig (e2e/) plays real Bronze/Standard runs: drafts via sim memberScore, quick-play
combat, sim-doctrine shop economy (members-first packs, relics, pedals, drug reserves),
recruit picks, panic trips. Full loop verified. Overnight Lucifer grind awaits JV's go.

**This session's code changes (audit fixes):**
- src/App.jsx ~10482: fontSize 12 -> 13 (design-rule floor; npm run check now ALL CLEAN)
- vestibule-sim-kwstacks.js: removed benign duplicate keys (forgeUpgrades in TRACK,
  artifacts/passives in newGame) — values were identical, sim behavior unchanged
- e2e/: pilot + autopilot (new; see HANDOFF.md for ops + hard-won rig lessons)

**Open items:** sim winrate discrepancy (2K fresh run says 39.95% Lucifer on Bronze/
Standard vs July 29 doc's 8.3–11.8% claim — reconcile before balance work) · aura-ATK
display chip on member cards · Setlist "Draw 3" vs hand-cap text · relic-SOLD-on-load
watch item. Details in HANDOFF.md.

---

## 🔄 LATEST HOTFIX (v0.7.4) — CIRCLE-SHOP RESET BUG

**Bug reported by JV in playtest:** "artifacts and effect pedals should reset every circle, they are stuck as showing as sold after i beat circle 1"

**Root cause:** The post-circle-boss transition at line 7212 *did* run `setCircleCartBought(false)` and `setCircleArtifact(rollShopArtifact())`. But the new tile's "sold" check OR's together four conditions:
```
sold = leftBought.cart || circleCartBought || activeArtifacts.some(a => a.id === circleArtifact.id) || soldIds.includes(...)
```
The third condition fires when the new reroll happens to land on an artifact you *already own from a previous circle*. Since `rollShopArtifact()` had no awareness of activeArtifacts, it freely re-rolled duplicates. Same exact bug for pedals.

With ~32 artifacts in the pool and at most 3 owned, collision was probabilistic — not "always sold", but frequent enough to feel persistent. JV experienced this as "stuck as showing as sold".

**Fix:** Added optional `excludeIds` parameter to `rollShopArtifact()` and `rollShopPedal()`. Filters the pool to skip owned items before rolling. Wired at the circle-boss reroll site to pass `activeArtifacts.map(a=>a.id)` and `activePassives.map(p=>p.id)`.

If somehow you owned every artifact in the filtered pool (impossible with the slot cap of 3), the filter falls back to the full pool to avoid an empty-array roll.

---

## 🔒 PREVIOUS HOTFIX (v0.7.3) — RECRUIT-PACK EXPLOIT CLOSED

**Bug reported by JV in playtest:** "the band recruitment pack lets you buy it over and over again. the intro free pack let me buy it as many times as i want and sell members to farm for money haha. it needs to be marked as sold once it is used/bought."

**Root cause:** The recruit-pack buy lock (`leftBought.rec`) was ShopScreen-local React state. Buying calls `setGameState('recruit')` which unmounts ShopScreen, killing the local lock. On return to shop, the component remounts with `leftBought.rec=false` again. Players could buy → pick member → sell at pawn shop → buy again → repeat for infinite stash.

**Fix:** Lifted the lock to the parent component as `recruitBought` state. Survives unmount. Wired:
- Parent state declaration at line 5695
- Props passed to ShopScreen
- OR'd into click gate, cursor, border, opacity, transform, glow, and SoldOverlay
- Reset at all 3 `setRecruitPack(...)` regen sites: normal next-shop transition (line 7204), debug Shift+S (line 7506), restart-from-end (line 10210)

The Welcome Pack at fight 1 (cost 0) was the most exploitable case — it's now locked just like every other shop pack.

---

This is the authoritative TODO. The old one was bloated with completed work — that history lives in git. This doc is **what's left** and **what's next**, sorted ruthlessly by priority.

---

## 📬 LATE-NIGHT STATUS (May 3 evening — Trip system overhaul)

**Branch: `hangover-with-teeth` — STILL not merged. Big additions on top of the morning's Hangover refactor.**

### Why this exists
JV asked: "are we lacking anything that is keeping this game from having Balatro/Vampire Survivors slot machine dopamine?" Audit revealed the existing drug system was *80% of the way there* — already had the right architecture (consumable purchases, fight-long buffs, dramatic reveal overlay) but only 8 effects total, 5%/5% bunk/bad rates that felt punishing, and a hard "before first strike" gate that prevented clutch use.

### Tier A — fixed what was already there ✅
- **Bunk drugs eliminated.** No more 5% "you paid 12 stash for nothing." Players never feel cheated.
- **Bad-trip rate softened: 5% → 3%.** Bad trips themselves softened too — shrooms bad trip is now -1 ATK (was -2).
- **Mid-fight activation enabled.** Removed the `strikesLeft===maxStrikes` gate. Players can clutch-drop a trip when a fight goes south. This alone changes the strategic feel — trips are now panic buttons, not opening moves.
- **TRIP_EFFECTS registry refactor.** Was nested if/else; now a clean data structure for adding effects easily.

### Tier B — expanded the pool ✅ (8 → 24 effects total)

**Shrooms (4 new, 8 total):**
- BLOTTER REVELATION — next 3 cards play FREE
- PSILOCYBIN PORTAL — draw 5 cards immediately
- DOOM CRYSTAL — highest-ATK member's ATK doubled this fight
- GHOST WEED — all CORRUPT cards cost 0 this fight

**Acid (4 new, 8 total):**
- DMT BREAKTHROUGH — skip boss's next 2 attacks
- REALITY GLITCH — strike multiplier starts at ×2.0 every strike
- CRYSTAL SHRIEK — all members +5 ATK this fight (simplified from "fades to -2" — that needed new flag plumbing)
- K-HOLE — boss frozen 2 strikes

**DMT — NEW PREMIUM TIER (8 effects, boss-shop only, 25🌿, NO bad trips):**
- HYPERSPACE — all cards cost 0 this fight
- OVERMIND — strike multiplier ×3.0 from start, every strike
- GODHEAD — all members +10 ATK this fight
- REBIRTH — revive all stoned members at full HP, all +2 perm ATK
- THIRD EYE — draw 8 cards, max embers +3 this fight
- SACRED CHORD — boss takes ×3 damage AND skip 1 attack
- TIMELINE COLLAPSE — +2 bonus strikes
- BLACK SUN — every CORRUPT card adds +50% strike multiplier on play

### New plumbing
- `freeCardsLeft` counter for BLOTTER REVELATION (different from existing `nextCardFree` single-shot bool and `allCardsFree` whole-fight bool — this is "next N cards free")
- `bossSkipStrikes` counter for DMT BREAKTHROUGH / K-HOLE / SACRED CHORD
- `heldDMT` + `dmtInStock` state with save/load wiring
- DMT shop tile rendered conditionally on boss-shops
- DMT in-fight button rendered conditionally when holding
- `dmt_traveler` achievement registered
- BLACK SUN hook in card-play handler fires +50% strike mult on CORRUPT cards
- OVERMIND/REALITY GLITCH wired into per-strike strikeMult initialization
- GHOST WEED wired into cost-discount chain
- HYPERSPACE reuses existing `allCardsFree` plumbing

### Phase A4 — louder activation moment ✅
Trip activation now produces:
- **Ascending pitch sweep** (200→800Hz shrooms / 300→1200Hz acid / 400→2400Hz DMT)
- **Sweep duration scales with tier** (0.5s / 0.7s / 1.2s)
- **Screen shake scales with tier** (20px/500ms shrooms, 25px/600ms acid, 35px/900ms DMT)
- Layered on top of existing reveal overlay + sfx sting

### 5,000-Game Sim Validation (Bronze, Standard) — TRIP SYSTEM IMPROVES BALANCE

| Metric | Pre-Hangover Baseline | Hangover Only | **Hangover + Trips v0.7.2** |
|---|---|---|---|
| Avg fight reached | 13.88 | 14.22 | **14.44** |
| Lucifer wins | 8.50% | 7.62% | **11.60%** |
| WTH wins | n/a | 3.14% | **4.94%** |

The slot-machine layer didn't break balance — it *improved* it. Players get powerful tools they actually use. Lucifer wins are above baseline now, which is the right shape for a game with this much variance.

### Bug audit done before push (5 real bugs caught and fixed) ✅
1. **Missing `dmt_traveler` achievement** — was being called via `tryAchieve` but never registered. Silently no-op'd. Added to ACHIEVEMENTS list.
2. **BLACK SUN's `addFloat` was nonsense** — used `stage.findIndex(m=>m.uid===card.uid)` which always returned -1 because card.uid is hand-card uid, not stage uid. "Worked" via the `||bossRef` fallback but positioning was broken. Replaced with clean `getCenter(bossRef)`.
3. **REBIRTH revive incomplete** — wasn't restoring `_origAtk` or clearing `tempBuff`, unlike Wake Up Call's canonical revive. Could leave revived members in stale buff state. Now mirrors Wake Up Call.
4. **HYPERSPACE's `allCardsFreeRef` not cleared at fight reset** — only React state was cleared; ref persisted. Could bleed HYPERSPACE across fights. Now both clear together.
5. **PSILOCYBIN PORTAL + THIRD EYE used stale `hand` closure** — switched to `handRef.current` for race-safety if player taps trip button mid-card-play.

### What still needs doing before merge
- [ ] **Browser playtest** — JV picks this up tomorrow. Specifically check: DMT tile renders at boss-shops only, mid-fight trip activation works, BLACK SUN strike-mult bumps fire visibly, REBIRTH actually revives stoned members, the audio sweep sounds right at all 3 tiers
- [ ] **Per-deck sim sweep** (5K × 5 decks) — only Standard validated
- [ ] **Higher-stake hangover scaling** — Demonic should hangover harder
- [ ] **Audit `addLog` strings** for stale doom-voice references
- [ ] **HANDOFF.md update**

### Risks flagged for playtest
- AI in sim hits 100% on 6.21 fights/game. If humans do the same reflexively, the Hangover meter won't feel like a tradeoff — just a knob they max. Tunable post-launch via stronger lingering costs.
- DMT only activates on 0.07 fights/game in sim because runs that survive to boss-shops *and* save 25 stash are rare. Could lower price to 20🌿 if playtest finds DMT under-encountered.
- BLACK SUN's +50% per CORRUPT card has no per-strike cap — theoretically could compound to absurd levels with stacked CORRUPT plays. Sim caps strikeMult at 10000 so engine won't break, but worth watching.

---

## 📬 PREVIOUS STATUS (May 3 morning — Hangover system)

**Branch: `hangover-with-teeth` — not yet merged to main. Sit-and-think before merge.**

### Why this exists
Corruption-as-death-trap was contradicting Vestibule's stoner-doom identity. Player experience: "I lost to corruption and didn't understand why." The whole Whispers/Hunger/Madness/Possession/Blackout system was ~12 things to track, half flavor-text fakes. Reframed corruption as a Hades-style HEAT meter: pushes you for power in-fight, costs you tomorrow. **Cannot end your run.**

### Multiplier cascade font fix ✅ (smaller, also shipped)
- `src/App.jsx:3560` and `:3580` — `BogartsMetalFont` (no digits) → `MBScribblesFont`
- Strike multiplier numbers now legible mid-cascade. Was rendering as tofu glyphs.

### Hangover-with-Teeth refactor ✅ (THE BIG ONE)

**What's deleted:**
- 75% Madness (random discard — punishing RNG with no agency)
- 25% Whispers threshold (was doc-only fake, never implemented)
- 100% Possession (+3 boss damage, +3 ATK to CORRUPT members)
- The brief Blackout countdown I shipped earlier today (still felt like a fail state, just delayed)
- Old single-tier Hunger (corruption≥50 → ×1.25 prices, read live corruption)
- Threshold flash banners with stale doom-voice ("THE WHISPERS", "POSSESSION")
- ~150 lines of state/refs/handlers for above

**What's added:**
- `hangover` state + `peakCorruptionRef` — peak corruption hit during a fight commits to next-fight + next-shop cost
- **Shop tax curve:** ≥50% → +20%, ≥75% → +40%, ≥100% → +60% (replaces single-tier Hunger)
- **HP debuff:** -⌊hangover/33⌋ max HP per member next fight (cap at 3), restored on victory
- **Stash haircut:** ×0.85 on victory if peak ≥100% (calibrated via 1000-game sim — heavier was nuking Lucifer attempts silently)
- Hangover preview banner on Descent screen (players see cost before picking next fight)
- Threshold flash banners rebranded BUZZED (50%) / WASTED (100%) — positive in-fight framing
- `FIRST_TIPS.corruption` rewritten one final time: one sentence, mentions tomorrow-cost
- Rules screen text rewritten with new mechanics + "can never end your run"
- Tube ticks at 50/100 (was misleading 25/50/75)

**In-fight ramp UNTOUCHED.** Original ×1.20/×1.50/×2.00/×3.00 CORRUPT mult curve preserved. Tested softer curves in sim — **all of them broke balance** (avg fight 7.85 vs baseline 14.65 at ×1.75 ceiling). Lesson: cost mechanics ARE the new design teeth. Don't double-nerf.

### 5,000-Game Sim Validation (Bronze, Standard deck) — PASSED

| Metric | Baseline (old) | Hangover (new) | Verdict |
|---|---|---|---|
| Avg fight reached | 13.88 | **14.22** | ✅ Better |
| Lucifer wins | 8.50% | **7.62%** | ✅ Statistical noise |
| C1 deaths | ~28% | 31.4% | ⚠ +3.4pts (HP debuff bites Lost Soul) |
| C3 deaths (Devourer wall) | ~20% | 16.8% | ✅ Gentler |
| WTH wins | — | 3.14% | ✅ Functional |

Hangover stats per game (averages): 7.84 commits at 50%+, 6.13 WASTED commits at 100%, 26.1 stash lost to haircut. AI pushes to 100% aggressively because the in-fight reward (×3.0) is worth the cost — design intent.

### What still needs doing before merge

- [ ] **Per-deck sim sweep** (5K × 5 decks) — only ran Standard. Verify other archetypes don't have outliers.
- [ ] **Higher-stake scaling** — Demonic stake should hangover *harder*. Currently uniform across stakes; will feel relatively easier on hell-tier. 5-min change to add stake multiplier on hangover effects.
- [ ] **Audit `addLog` strings** for stale doom-voice ("darkness consumes" etc.)
- [ ] **Audit `deathCause` paths** in EndScreen for any remaining corruption-kills-you references
- [ ] **HANDOFF.md update** to reflect new state
- [ ] **Browser playtest** — verify Hangover preview banner shows correctly on descent, shop labels show dynamic %, HP debuff applies + restores on boss kill
- [ ] **Decide:** merge `hangover-with-teeth` → main, or sit on it for a week and playtest

### The thing to watch in playtest
AI hits 100% on 6+ fights per run. If that's also true for human players (i.e., they push reflexively because the math always favors current-fight kills), the meter won't feel like a tradeoff — just a knob they max. Fix is making linger costs bite harder, not redesigning architecture. **Tunable post-launch, no save-breaking changes required.**

---

## 📬 PREVIOUS STATUS (May 2 — for morning JV)

**Locked in for you while you slept it off:**

### Fight 1 — Training Wheels Match (per JV's design vision)
> "r1 should be a training wheels match, then in the shop you get a 3rd member and start to pop off"

- ✅ **The Wanderer hard nerf (commit `64ecb85`):**
  - `maxHp: 45` (was 90 → 65 → finally 45) · with deck 1.85 scale = **83 HP displayed**
  - `baseDmg: 2` (was 4 → 3 → finally 2) · max 8 band damage over 4 strikes
  - Tutorial system enemies (Shade/Wraith/Revenant) UNCHANGED — they handle brand-new players
- ✅ **Shop 1 — free Welcome Pack:** new branch in `genRecruitPack()` line 1484. When `fightIndex===0`, returns a free `🎸 Welcome Pack` (cost 0, special name + desc) instead of paid Garage Band Pack. Players guaranteed a 3rd member entering fight 2 regardless of stash earned.
- ✅ **`boss_hp_override.json` synced** — auto-extracted from live `src/App.jsx` ENEMIES array. Sim now matches live boss HPs exactly (Wanderer 45, Lost Soul 150, Drifter 340, etc.).

### 50,000-Game Sim Validation (10k × 5 decks, Bronze)

**Wanderer survival rate by deck — all 100.0% (zero deaths in 50k attempts) ✅**

| Deck      | F1 Wanderer | F2 Lost Soul | F4 Siren | F7 Glutton | F10 Miser | Lucifer Win |
|-----------|-------------|--------------|----------|------------|-----------|-------------|
| Standard  | 100.0%      | 77.8%        | 65.8%    | 60.9%      | 44.7%     | 9.14%       |
| Shredder  | 100.0%      | 70.8%        | 58.8%    | 54.6%      | 42.2%     | 11.04%      |
| Ritualist | 100.0%      | 90.0%        | 82.7%    | 74.7%      | 48.6%     | 8.61%       |
| Engineer  | 100.0%      | 85.0%        | 79.8%    | 75.9%      | 59.6%     | 11.42%      |
| Survivor  | 100.0%      | 85.8%        | 81.1%    | 77.6%      | 54.3%     | 7.95%       |

**Curve summary:**
- ✅ Fight 1 = pure tutorial, 0% rage-quit risk
- ⚠ Fight 2 (Lost Soul, 150 HP) = NEW WALL, 10-29% death rate by deck — **this is intentional**, it's the "real game starts here" moment after the free Welcome Pack
- ⚠ C4 Miser → Hoarder = build-crafting wall (drop ~60% → ~45% across decks). Known difficulty spike.
- ✅ Lucifer 8-11% win rate (target ~10% = perfect)
- ✅ Engineer is strongest (11.42%) / Survivor weakest (7.95%) → 4-pt spread is healthy

### What to do in the morning (priority order)
1. **`git pull`** — gets `64ecb85` with the Wanderer nerf and Welcome Pack
2. **`rm -rf node_modules/.vite && npm run dev`** — Vite HMR doesn't refresh the BOSSES const array, hard restart needed
3. **Hard reload browser (Cmd+Shift+R)**, clear any saved run, start fresh Bronze
4. **Verify in fight 1:** Wanderer should show **83/83 HP · 2 PER STRIKE**
5. **Win it** (should feel trivial), enter shop, verify **🎸 Welcome Pack** at cost 0
6. **If Lost Soul (fight 2) at 22% death feels too punishing** in playtests, consider cutting to 130 HP. But ship as-is and watch first — that's the new "tutorial graduation" fight, ~22% is on par with Slay the Spire's first elite kill rates.

### Don't tune anything else right now
The Wanderer nerf produced exactly the curve you wanted. Locked. Move on to art and music.

---

## 🎉 SHIPPED EARLIER (May 2 daytime — modifier system + audits)

**Design freeze:** `MODIFIER_REDESIGN.md` + `MODIFIER_CONTENT.md` + `MODIFIER_INTERACTIONS.md`

**All 10 phases shipped:**
- ✅ Phase 1 — Data: 25 artifacts + 15 pedals + 6 mythic unlockables, all rarity-tagged
- ✅ Phase 2 — Main strike triggers: ~20 new multTrigger types wired
- ✅ Phase 2b — Both preview sites synced (visible mult box + DEALS preview)
- ✅ Phase 3 — Reclassified routing: a3/a4/a7/a8/ca2/ca3/wardrums all check passives
- ✅ Phase 4 — Pedal effects: ALL 18 pedals now functional including:
  - Reverb Tank, Fuzz Box, Phaser, Wah, Cable Tester (ember discounts)
  - Power Conditioner, Drum Throne, Bit Crusher (fight-start effects)
  - Volume Knob, Compressor (next-strike bonuses on 4+ cards)
  - Octave Pedal (first chain ×3.17 instead of ×1.78)
  - Sustain Pedal (temp buffs +1 strike)
  - The Looper (deterministic first-card replay)
  - **Echoplex 69% retrigger with FULL polychrome card-flight animation**
  - The Conduit (mythic — start max embers, half cost)
  - Witch's Sabbath (mythic — first card replays 3 times)
- ✅ Phase 5 — Shop weighted rolls: Common 50% / Uncommon 30% / Rare 17% / Mythic 3%
- ✅ Phase 6 — Mythic unlock system with stat tracking (5 conditions)
- ✅ Phase 7 — Mythic unlock dramatic overlay (gold glow, full-screen, 5s)
- ✅ Phase 8 — Stone Tablet / Serpent's Kiss equip-on-passive routing
- ✅ Phase 10 — Save format bump vst_save_v3

**Echoplex visual treatment** (per JV's "make it sexy" directive):
- 5 lagging rainbow trail echoes (HSL hue rotation 0-288°)
- RGB chromatic aberration ghosts (red/cyan offset layers)
- 8 particle spark tracers in hot rainbow palette
- Main card layer with kind-colored multi-distance shadow stack
- 200ms staggered, 700ms per flight, ~1.2s lifetime
- handleStrike split into handleStrike + handleStrikeBody so visuals lead math
- animPhase='replaying' blocks double-clicks during animation

**Mythic unlock conditions (DEV REFERENCE — hidden from player):**
- Inverted Cross: First Lucifer kill
- Tongue of the Devourer: Beat Devourer (C3) without losing any members
- Sigil of Set: Win Bronze run with only 1 unique member
- Witch's Sabbath: All 4 members Too Stoned at once + win the fight
- The Conduit: Beat Lucifer in ≤3 strikes
- Tablet of Az'Tothoth: Fire all 16 unique chains in one run

**Still in-progress / future polish:**
- ⏳ **PLAYTEST TUNING PASS** ← this is on JV. After 2-3 runs, look at:
  - Echoplex 69% — too consistent? too rare? Try with Battle Cry build.
  - Black Goat ×46 ceiling — earned or trivial?
  - Pentagram Shrine multiplicative compounding — fun or excessive?
  - Mythic unlock pacing — first mythic should hit ~run 4-6 ideally
  - Shop pedal/artifact rarity feel — too many commons? not enough rares?
- ⏳ Sim port for mythic pedals (Echoplex %, Looper, Sabbath, Conduit, Tablet)
  — currently sim approximates without these, real numbers will skew positive
- ⏳ Devourer C3 wall (15.4% die here — pre-existing, not caused by overhaul)

---

## ⚠️ ARCHITECTURAL DEBT (non-blocking, defer to v0.7 cleanup pass)

These are smells, not bugs. The game plays correctly — these just make
future maintenance harder.

### 1. Echoplex replay engine is hand-rolled per card
`fireQueuedReplays` duplicates effect logic from `playCard` for ~41 specific
cards. Every NEW card needs to be added to BOTH places or it silently no-ops
on retrigger.

**Fix later:** Refactor `playCard` to take `{isReplay, freeOfCost}` flag so
the replay engine just calls `playCard(card, slot, {isReplay:true})` and any
card auto-works.

### 2. Three sites duplicate artifact mult logic
Main strike (line ~7960) + visible mult preview (line ~10866) + DEALS preview
(line ~11072). Every new trigger has to be copied to all 3. They're consistent
right now (verified in Pass 1 audit) but will drift over time.

**Fix later:** Extract `computeArtifactMult(ctx, artifacts)` helper.

### 3. Save load truncation is silent
v4 saves with corrupted >2 pedals get truncated to first 2 with a log message.
No UI for player to choose which to keep. Acceptable for now since v4 is
the new format and no >2 saves should exist.

**Fix later:** "Select 2 pedals to keep" modal on truncation.

### 4. Mythic unlock conditions are pure puzzles
No "you're getting closer" hints. Players need wiki/community to find them.
Intentional Balatro-style discovery, but consider subtle progress indicators
post-launch if discovery rate is low.

---

## ✅ DESIGN LOCKED — gameplay dynamics confirmed

Per JV (May 2 2026):
- **3 artifacts + 2 pedals** = 5 modifier slots (Choice B locked)
- Permanent buff stacking with Echoplex IS the goal — players shouldn't want
  to discard buffed members. Hard choices for great players.
- Save format v4 (was v3) — old saves auto-invalidate cleanly.

After tonight's playtest: ART AND MUSIC. Game-play dynamics frozen until
v0.7 cleanup pass.

---

## 📬 OVERNIGHT STATUS (May 2 — for JV when you wake up)

While you slept I worked through P1.2 and P1.3. Summary of what changed:

**Shipped (this commit):**
- ✅ **ANCHOR save/resume bug** — Real bug found. Save format never persisted `anchorTierRef` / `anchorSavesUsedRef`, so any resumed run had ANCHOR keyword silently disabled (refs defaulted to 0). Fix recomputes tier from restored stage on `handleContinueSave`. App.jsx ~line 7860.
- ✅ **DOUBLE TIME tier-3 description fix** — Took the conservative path and updated tooltip + rules-help to drop the unreachable "3+ stacks: ALL members attack twice" promise. The dormant tier-3 code in `handleStrike` (line 6822) is kept intact with a comment explaining why — if you ever lift the 1-drummer recruit restriction at line 4433, the tier activates immediately. **The balance call (allow 2nd drummer or not) is still yours.**
- ✅ **Sim/live divergence — bigger than expected, fully fixed.** Sim wasn't off by one Wanderer number — it was using a completely different scaling formula (`CIRCLE_HP_SCALE` array vs live's `deck.hpScale` × heat × encore). Every boss diverged 2-4× from live. Used the sim's existing `BOSS_HP_OVERRIDE` mechanism rather than rewriting the sim engine. Committed `boss_hp_override.json` at repo root with all 27 current live boss HPs. Sim now loads it from the repo path automatically (with `/tmp` fallback for any old workflows). `node vestibule-sim-kwstacks.js` matches live HP exactly.
- ✅ **Verified sim keyword scaling already matches live** — `vestibule-sim-kwstacks.js` lines 736-763 use the same `stackTier` formula and same FRENZIED/SHREDDER/CORRUPT/ANCHOR scaling as `getEffectiveAtk` in App.jsx line 609. No drift, no fix needed.
- ✅ **5K Bronze sim with correct live HPs (sample run):**
  - Avg fight reached: **14.37 / 26**
  - Wanderer: **0.0% deaths** (perfect tutorial fight, was a wall before)
  - Lost Soul: **20.6% deaths** ← new wall
  - Drifter: **9.6% deaths**
  - Devourer (C3 boss): **17.9% deaths** ← second wall
  - Lucifer reached: **42.0%**, P1 kills 30.5%, full kills **17.7%** (~10% target band)
  - Mentor links forming: 44.5% of games
  - Riff chains: ~9 per game
  - 0 fights post-Heresy → C7-C9 are pushover-easy now (see new TODO 2.5)

**Could not finish without you (left as TODO):**
- ⏸ **Back to the Pit button** — Traced `handleShopLeave` fully. Found stale-closure suspects (welcomeToHell, gameState, runSeed, deck, hand, discardPile, embers, strikesLeft, fightMaxStrikes, discardsLeft, stats, pendingBurningStage all referenced in saveGame block but not in deps array). None of those would *crash* — they'd just save stale values. Without a browser repro showing the actual symptom, can't pinpoint root cause. **Action when you're awake: open shop, click Back to Pit, capture F12 console + screen recording. Then I can fix in 5 minutes.**
- ⏸ **Stoned bug** (perceptual) — Code logic is correct per your earlier verification. The "looks like the run is over" feeling is animation-driven. Without you driving the repro to confirm what's misleading, can't safely change feedback timing/colors.

**Sim now reveals two new things to discuss in the morning:**
1. **C7-C9 are essentially free** — 0% death rate from F18 (Brute) all the way to F25 (Betrayer). After surviving Devourer at C3, the run is basically won until Lucifer. This wasn't true in the old broken sim. **Real balance call needed for C7-C9 HPs** — added as new TODO 2.5.
2. **Lost Soul at 150 HP is the new tutorial wall** (20.6% deaths in fight 2). Wanderer cut to 90 was right — but Lost Soul might need a small trim too if you want a gentler ramp into the game. New TODO 1.1 verify.

**Lint:** stayed at baseline (255 reported but 1 of those is a pre-existing dupe-key from a stat object, unrelated to my changes — net 0 new problems introduced).

**Build:** green.

---

## 🟥 PRIORITY 1 — PLAYABILITY (do these before anything else)

These are bugs or imbalances that affect whether the game is fun or even completable.

### 1.1 Verify post-refactor balance with real playtest
The keyword refactor (4a-4e) replaced FRENZIED/SHREDDER/ANCHOR/CORRUPT mechanics with sim-spec versions. Sim says it works. Real player hands haven't been tested in a full run yet.

- [ ] **Run 5-10 full Bronze runs.** Note: where do you die? Where does it feel unfair? Where does it feel trivial?
- [ ] **Verify Wanderer is now beatable in 2-3 strikes** with the 2-member opener (just nerfed 140→90 base HP, scaled = 167)
- [ ] **Verify Lost Soul (150) and Drifter (340)** still feel right with new keyword scaling. If 4-RIFF spam clears them in one strike, they need a small bump.
- [ ] **Lost Soul (sim says 20.6% deaths at fight 2)** — keep watching, might need a small HP cut similar to Wanderer's. Don't change yet — playtest first.
- [ ] **Verify ANCHOR save fires correctly.** Take Ingrid into a fight, push her to lethal HP, confirm "⚓ SAVED!" float pops and she's at 1 HP after.
- [ ] **Verify FRENZIED tooltip text is correct now.** Hard refresh the dev server. Should read "+ATK per RIFF played each Strike. Stack more for bigger bonus (1/2/4×)."
- [ ] **Verify CORRUPT 2-stack scaling** (Loki + Freya). Card preview should show double the per-corruption ATK bonus.

### 1.2 Known bugs to verify/fix
- [x] **"Back to the Pit" button — VERIFIED WORKING (May 2 live browser test).** Drove a full Bronze run via Claude in Chrome, reached Sly's Merch, clicked the button. Transitioned cleanly to next fight (The Lost Soul, 278/278 HP). Zero console errors. The TODO entry was stale — likely a session-ago report that was either fixed by an unrelated commit or never actually reproduced. Original AUDIT_REPORT note even said "looks correct in code, need F12 to diagnose" — it was speculation, not a confirmed bug.
- [x] **Stoned bug — VISUAL FIX SHIPPED (May 2 live test + fix).** Live-reproed JV's "feels like the run is over" perception. Root cause was the giant 64px 💀 skull overlay rendered over each stoned member, plus heavy grayscale (0.8) + low opacity (0.6) + steep 15° rotation — together they read as "permanently dead" instead of "knocked out for this fight." Fix: removed the skull, replaced with 4 drifting smoke clouds at varying timings (`@keyframes stonedSmoke`), added a "😶‍🌫️ TOO STONED · Back next fight" purple pill with subtitle. Softened grayscale (0.8→0.3), bumped opacity (0.6→0.78), reduced rotation (15°→8°). Also scaffolded `STONED_PORTRAITS` map so when JV draws per-character slumped/smoky animations and drops them at `public/members/stoned/{id}_stage_stoned.gif`, they auto-load (just uncomment the line in the map). 18 lines pre-listed and commented in src/App.jsx ~line 749.
- [x] **Mid-fight save/resume — FIXED (cfdfc7a).**
- [x] **DOUBLE TIME copy — ALL THREE COPIES NOW CONSISTENT (this commit).** Updated the third copy in the rules-help "Member Keywords" glossary at line 8089 to match the tooltip + rules-help glossary. Also fixed Thor's `desc` ("Attack fires twice per turn" → "Lucky drummer. Roll high and the whole band hits harder.") which was misleading because doubles only fire on d6 5-6 roll. Also updated the Russian Roulette tooStoned message to use 💨 instead of 💀 to match the new visual language. Updated the rules-help "Too Stoned" entry to explicitly mention recovery between fights.
- [x] **Stake `hpMult` discrepancy — RESOLVED via description rewrite (this commit).** JV chose option 1: keep the live fight formula as-is (deck.hpScale only) and rewrite all 6 stake descriptions to remove the lying HP-mult promises. Stakes still scale difficulty meaningfully via dmgAdd, startEmbers, startCorruption, maxStrikes, drugPriceMult, healAfterFight, badTripChance, and (most dramatically) Demonic's 3-Strikes-only restriction. Each stake desc now ends with the score multiplier hook (×1.0 → ×4.0) so the reward scaling is visible. The `hpMult` field remains in the STAKES array for save-format compatibility but is documented as dead code; comments at the STAKES definition (line 419) and `getScaledMaxHp` (line 4959) warn future-edits not to re-add HP-mult promises without wiring the field into the live formula. The 50K-game sim balance work from late April remains valid since we didn't change the actual combat math.

### 1.3 Sim/live divergence — FIXED (May 2 overnight)
- [x] **Sim now uses live boss HPs.** Committed `boss_hp_override.json` at repo root with all 27 current ENEMIES maxHp values. Sim auto-loads from repo path (with /tmp fallback). `node vestibule-sim-kwstacks.js` matches live fight HP exactly via `Math.ceil(boss.maxHp × deck.hpScale)` — same as live's `getScaledMaxHp`.
- [x] **Wanderer 90 HP confirmed in sim** — 0.0% deaths in 5K Bronze run. Real tutorial fight, no longer a wall.
- [x] **Keyword stack tier scaling already matched live** — sim lines 736-763 use the same `stackTier` formula and same FRENZIED/SHREDDER/CORRUPT/ANCHOR scaling. No drift.
- [x] **Live ANCHOR save mechanic verified to match sim** — both use tier 1-2 = ANCHOR-only save, tier 3+ (cap=4) = any-member save.

**To keep this in sync going forward:** when boss base HPs change in `src/App.jsx` ENEMIES, also update `boss_hp_override.json`. The file has indices 0-26 mapped to ENEMIES[0..26].

**Latest 5K Bronze sim results (snapshot):**
- Avg fight reached: 14.37 / 26
- Wanderer 90HP: 0.0% deaths
- Lost Soul 150HP: 20.6% deaths ← new wall
- Drifter 340HP: 9.6% deaths
- Devourer 3.5KHP (C3 boss): 17.9% deaths ← second wall
- Lucifer 100KHP: 17.7% wins (~10% target band met)
- Mentor links forming: 44.5% of games
- Riff chains: ~9 per game

---

### 1.4 New finding — C7-C9 are pushover-easy now
After surviving the C3 Devourer wall, sim shows **0% death rate from F18 (Brute) all the way to F25 (Betrayer)** — the entire back half of the game. Then Lucifer has a 26.3% death rate at the end.

This wasn't visible in the old broken sim. Two interpretations:
1. **Bad** — players coast through circles 7-9 with nothing scary. Boring middle-late game.
2. **Good** — players who beat C3 deserve the power fantasy of stomping minor enemies on the way to Lucifer.

**Decision needed:** do we want C7-C9 to challenge the player, or are they intentional power-fantasy phase?
- If challenge: bump C7-C9 boss HPs by 25-40% across the board, re-sim
- If power fantasy: leave alone, but maybe add a Heresy-tier wall somewhere (False Prophet at C6) so it's not 8 fights of nothing
- Sub-decision: Lucifer might need a small bump if the run is ~17% completion already

### 1.4 Tutorial verification
- [ ] **Tutorial fight 1** uses Bjorn (FRENZIED) + Gunnar (SHREDDER). Both keywords are now per-strike bonuses. **Verify the tutorial scripted hand still teaches the new mechanics.** If the hand has no RIFF cards, FRENZIED never fires and the "this is your damage dealer" message lies.
- [ ] **Tutorial fight 3** introduces RIFF chains. Verify chain firing still works post-refactor.
- [ ] **First-encounter tips** — pacts, shop, events, descent. Confirm they fire on first real run after tutorial.

---

## 🟧 PRIORITY 2 — BALANCE & TUNING

### 2.0 Deck identity overhaul (COMPLETE — May 2)

JV decided to make each deck feel mechanically distinct. Goal: 5 unique identities with their own opening conditions, signature mechanics, and reward scaling. Specs locked in via `ask_user_input_v0` exchange. **Shipped in 4 commits over the May 2 session.**

**Done:**
- [x] **Commit 1 (`f3d579f`): Schema + opening conditions.** Extended `STARTER_DECKS` with `memberHpMod`, `memberHpPct`, `handSize`, `startEmbers`, `startCorruption`, `maxStrikesMod`, `freeArtifact`, `signature`, `scoreMult`. Wired all opening conditions at run start, fight start, encore restart, play-again restart, and Lucifer phase 2 transition.
- [x] **Commit 2 (`c6ce58e`): Signature mechanics.** All 4 unique mechanics live + score multipliers wired. Riff Chain Echo (Shredder), Corruption Feeds (Ritualist), Copier (Engineer), Second Wind (Survivor).
- [x] **Commit 3: Sim engine port + tuning** (this commit). Ported all 4 signatures to `vestibule-sim-kwstacks.js`. Ran 25K-game sim across 5 decks × 5K games, iterated through 5 tuning passes to land on a balanced curve.

**Final tuned identities (post-sim):**

| Deck | Hand | Embers | Start Corr | HP mod | Signature | Score | Sim Win % |
|---|---|---|---|---|---|---|---|
| Standard | 5 | 5 | 0% | normal | none | ×1.0 | 13.5% |
| Survivor | 5 | 5 | 0% | +2/member | SECOND WIND (per-member, 25% heal) | ×1.3 | 13.8% |
| Ritualist | 5 | 4 | 15% | normal | CORRUPTION FEEDS (5/strike cap) | ×1.6 | 13.3% |
| Shredder | 6 | 5 | 0% | -20% | RIFF CHAIN ECHO (33%) | ×1.4 | 14.9% |
| Engineer | 5 | 5 | 0% | normal | COPIER (25%, copies don't re-copy) | ×1.2 | 15.0% |

**Tuning journey (5 sim passes):**
1. Initial values: Survivor 25.6% wins (broken-easy), Ritualist 11.8% (broken-hard), Shredder 21.6%, Engineer 19.5%, Standard 13.7%
2. Survivor +1 strike removed (single most dominant buff in game), Ritualist start-corruption 25%→15%, refund cap 3→5
3. Survivor restructured: Second Wind from once-per-fight to once-per-member-per-fight, heal 50%→25% (more saves, smaller individual saves)
4. Shredder echo 50%→33%, lost +1 starting ember (back to baseline 5)
5. Engineer hand 7→6→5 (back to baseline), copier _copied flag prevents infinite duplication chains, score mult ×1.5→×1.2 (it's the easy combo deck, less risk = less reward)

**Result:** All 5 decks cluster 13-15% Bronze Lucifer win rate. Score multipliers correctly track risk: Ritualist hardest+highest reward, Engineer easiest+lowest reward.

### 2.05 Big Numbers / Cascade Feel-Pass (May 2 — IN PROGRESS)

JV asked for "Balatro meets Vampire Survivors" feel — nonstop dopamine, slamming numbers, climbing multipliers into the thousands. Diagnosed root cause: visible mult tracker only showed `strikeMult` (cards + chains), all artifact/corruption/loot multipliers fired silently in handleStrike and were baked into final damage without ever appearing on screen. Plus the 6.66 chain cap suppressed the high end.

**Done (this commit):**
- [x] **Chain cap lifted** 6.66 → 10000 (line 6346) so chains stack like everything else
- [x] **Strike damage refactored** to emit `_cascadeMults` array — discrete events for Strike, Trip, Corruption tier, every artifact, Goat of Mendes, every boss loot. Final damage math identical (multiplication is commutative) but every multiplier now visible in cascade
- [x] **Climbing total multiplier** added as cascade centerpiece — grows from ×1 through every event into the thousands. Color/size/glow escalate at ×2/3/5/10/20/50/100/666 thresholds. Up to 180px font at ×666+
- [x] **Floating slamming numbers** — each mult event spawns a `🐐 ×1.50` number that flies in from off-side, slams to a pile next to centerpiece, then fades. Vampire Survivors-style accumulation
- [x] **Per-event flash + tiny shake** — color-tinted screen flash (gold for artifact, purple for corruption, etc.) + 3-5px shake on every mult landing. Adrenaline stays elevated through whole cascade
- [x] **Drum kit audio layering** — kick on every mult (140Hz→50Hz exponential drop), snare crack on ≥2x, full drum fill (kick-snare-kick-snare-crash) on final SLAM. Replaces the flat ascending-tone of before
- [x] **Particle bursts** — 6-24 sparks per mult event, count scales with magnitude, gravity-affected, fade out. 60-particle pentagram burst on 666 DEAL WITH THE DEVIL slam
- [x] **Persistent source emoji stack** — small row below climbing mult shows what stacked (`🎸 ⛧ 🐐 🕯 🌑`). Visual record of "I did this"
- [x] **666 DEAL WITH THE DEVIL tier** for total damage in 600-699 range — red 108px font, demonic three-tone descending chant (A2→F2→E2 sawtooth), 60-particle red burst, custom devilPulse animation
- [x] **HP drop deferred to slam** (Option B / Balatro-style) — boss HP stays full during cascade, slams down WITH the final number. Lethal strikes still apply HP immediately to keep Lucifer phase 2 / victory triggers clean

**Not done yet (follow-ups):**
- [ ] **Boss HP "preview damage" indicator** during cascade — faint red ghost overlay on HP bar showing where it's about to land. Would build anticipation. Skipped this commit because it requires adding state pass-through across BossSection. Not a blocker for the dopamine feel.
- [ ] **New "synergy" artifacts to enable 666 organically** — current ceiling depends on existing artifact stacks. Tier 3 of original plan: design 6 new artifacts with strong inter-stack synergy (e.g., Hellmouth Amplifier × Void Engine × Black Candle = exponential per-stoned-member). Defer until JV plays current state and decides if numbers are big enough.
- [ ] **Settings: Cascade speed Slow/Normal/Fast/Instant.** Currently controlled by existing `vst_speed` setting (Space-hold for fast). May want a 4-way dial later if veterans want even faster.
- [ ] **Card-by-card cascade during play** (not just at Strike). Bigger refactor — defer until current state is felt.

**File locations:**
- `src/App.jsx` line ~3055 — DamageBreakdown component (massive rewrite, +437 lines)
- `src/App.jsx` line ~6346 — chain cap lifted to 10000
- `src/App.jsx` line ~7185-7245 — strike damage calc refactored to emit cascadeMults
- `src/App.jsx` line ~7270 — setDmgBreakdown passes cascadeMults + totalMult

### 2.1 Card-level outliers (from sim)
- [ ] **Herb Money** — 0.4% pick rate. Worst card in the pool. Either drop cost (1🔥→0🔥) or add synergy hook (e.g., +1 ATK per 50 stash). Currently dead weight.
- [ ] **Acid items** — 25:1 shroom-to-acid usage gap. Acid is too expensive and the bad-trip risk discourages purchase. Try cheaper (12→8) or remove bad-trip on Bronze stake only.
- [ ] **Hellquake** — 0 fires per 10K runs in sim. Either reachability bug (only triggered by sabbathsigil card) or sabbathsigil itself is dead. Investigate and fix or remove.

### 2.2 Circle-level tuning
- [ ] **C2 Lust circle** — 1.1% deaths in sim. Target ~5%. Buff Siren/Tempter +1 dmg or HP, or give them a trait that punishes the natural early-game momentum players will have.
- [ ] **C3 Gluttony heal rates** — 8/15/25 HP per card played might be too aggressive after FRENZIED/SHREDDER buffs let players spam more cards. Watch in playtest.
- [ ] **C5 Anger reworks** (Wrathful selfImmolate, Berserker bloodlust, Warlord commands) — these landed in v20. Validate they still feel right with keyword refactor.
- [ ] **Stake-specific tuning** — All v20 numbers tuned on Bronze. Silver/Gold/Obsidian/Blood/Demonic likely need stake-specific overrides since their `hpMult` and `dmgAdd` differ. Currently they all use the same enemy table.

### 2.3 Late-game HP cuts (from v20)
HP for C7-C9 was cut 75-93% in the v20 balance pass. **Sim now confirms cuts went too far** — see TODO 1.4 finding. C7-C9 currently have 0% death rate in 5K Bronze sim with live HPs. Either bump back up 25-40% (challenge path) or accept as intentional power fantasy and add a different wall mid-late game (e.g., False Prophet at C6).
- [ ] **Decide C7-C9 design intent** (challenge vs power fantasy) — see TODO 1.4
- [ ] **Brute / Hunter / Executioner playtest.** If they feel pushover-easy first time JV plays through, those values are each one number from a bump.

### 2.4 Score / grade calibration
- [ ] **Verify grade thresholds** still feel right post-refactor. With FRENZIED+SHREDDER now stacking damage harder, lifetime score might inflate. Recalibrate D→SS thresholds if a casual run now lands on A grade.

---

## 🟨 PRIORITY 3 — CODE HEALTH

### 3.1 The big one — App.jsx split
**App.jsx is 9,565 lines.** Becoming actively painful to navigate.

Suggested split:
- `src/App.jsx` (main shell, 500-1000 lines)
- `src/data/cards.js` — ALL_CARDS, CARD_TYPE_BY_ID, RIFF_CHAINS
- `src/data/enemies.js` — ENEMIES, BOSS_LOOT, boss tooltips
- `src/data/musicians.js` — ALL_MUSICIANS, member portraits, idle animations
- `src/data/decks.js` — DECK_MANIFESTS, STARTER_DECKS, mastery
- `src/data/artifacts.js` — STARTER_ARTIFACTS, CIRCLE_ARTIFACTS, passives
- `src/data/keywords.js` — KEYWORD_DESC, getKeywordStacks, getEffectiveAtk, _stackTier, KW_BOND_COLOR
- `src/data/balance.js` — STAKES, hpMult, dmgAdd, scoring
- `src/components/StageSlot.jsx` — extracted member card
- `src/components/HandCard.jsx` — extracted hand card
- `src/components/EndScreen.jsx` — extracted death screen
- `src/components/DeckPile.jsx` — extracted pile component
- `src/components/EventScreen.jsx`, `ShopScreen.jsx`, `ForgeScreen.jsx`, etc.
- `src/lib/save.js` — saveGame, loadGame, clearSave, serialization
- `src/lib/sfx.js` — playSfx, playTone, all the audio helpers
- `src/lib/scoring.js` — calcRunScore, getScoreGrade

This is **fresh-mind work** — defer to a focused session, not the end of a bug-fix marathon. A bad split creates worse problems than the long file.

### 3.2 Dead-code sweep
- [ ] **`cardsPlayedThisStrike` state** (line 4836) — only ever reset to `[]`, never appended. Probably vestigial. Either start updating it alongside `cardsPlayedRef` or remove entirely.
- [ ] **Lint baseline 254 problems** — mostly pre-existing unused-vars and unused functions. Worth a single cleanup pass (`getTotalMastery`, `getDailySeed`, `markRuleSeen`, `getUnlockedDecks`, `isGoodDeal` unused).
- [ ] **`getShopCost` is referenced but undefined** (lint error) — bug or dead code path? Verify.
- [ ] **Vite chunk size warning** — bundle > 500KB. Code-split when App.jsx is split (see 3.1).

### 3.3 Documentation drift cleanup
The docs collected over the past few months are now badly out of date. Suggestion: consolidate into 3 living docs and **delete the rest**. Stale docs cost more than no docs.

- **KEEP:** `CLAUDE.md` (rules, gotchas, structure) — needs refresh, line counts and key locations are wrong
- **KEEP:** `TODO.md` (this file)
- **KEEP:** `README.md` (intro for AI agents)
- **REWRITE/MERGE then DELETE:** `HANDOFF.md`, `HANDOFF_NEXT_SESSION.md`, `SESSION_HANDOFF.md`, `ANIMATION_HANDOFF.md`, `AUDIT_REPORT.md`, `SIM_REPORT_MORNING.md` — all stale, overlapping, generated at different points. Pull anything still relevant into `CLAUDE.md` or `TODO.md`.
- **REWRITE:** `GDD.md` — talks about strikeMult max 6.66× (now 10,000×), old keyword behaviors. Refresh before showing anyone.
- **REWRITE:** `FINAL_DECKS.md` — the boss HP table here is from before v20 balance pass. Numbers shown are 2-3× the current values. Either update or delete.
- **CONSOLIDATE:** `ART_GUIDE.md`, `ART_TODO.md`, `CARD_ART_GUIDE.md` — three art docs, all overlapping. Pick one (`ART_TODO.md` is the most actionable) and delete the others.
- **DELETE:** `CARD_IDEAS.md` — nice brainstorm doc but the cards either shipped or got dropped. Living doc with no current purpose.
- **KEEP:** `STEAM.md` — short, useful, build/deploy reference.

---

## 🎵 PRIORITY 4 — AUDIO

### 4.1 What's already here
- 31 SFX files in `public/sfx/` — full set, no missing references
- 11 music tracks in `public/music/` — placeholder versions at this point, JV plans to replace with original compositions

### 4.2 What's needed
- [ ] **JV records all 11 music tracks** as originals (Vestibule's only-doom-metal-game pitch falls flat with placeholder music).
  - `menu.mp3` — title screen ambient (60-90s loop)
  - `select.mp3` — deck/booster select (slower, foreboding, 60s loop)
  - `descent.mp3` — between-fight cutscene (building dread, 30-45s)
  - `battle.mp3` — main combat track (90-120s loop, the most important)
  - `boss.mp3` — boss fight track (heavier than battle, 90-120s loop)
  - `lucifer.mp3` — final boss (epic, distinct from `boss`, 120s+)
  - `shop.mp3` — Sly's shop (sleazier, smokier, 60s loop)
  - `forge.mp3` — Doom Forge upgrade (ritualistic, 30s)
  - `pact.mp3` — pact selection (dark choice ambient, 30s)
  - `victory.mp3` — Lucifer death / triumph (60s, can be one-shot)
  - `death.mp3` — defeat sting (5-10s, one-shot, sad)
- [ ] **Audio mixing pass** — current SFX volumes vs music balance. SFX probably too loud on default mix. Run through every state and balance.
- [ ] **Music ducking** — SFX should duck the music briefly so important hits land. Currently they overlap muddily.
- [ ] **Cross-fade between states** — abrupt cut between menu music and battle music. Should crossfade over ~1.5s.

### 4.3 Missing/desired SFX
- [ ] **ANCHOR save sound** — distinct chime/save-the-day sound when ⚓ SAVED! fires. Right now it uses generic SFX.
- [ ] **Mythic interaction discovery** — the "first time you trigger a 4+ card combo" needs a special sound. Currently just regular chain sound.
- [ ] **Achievement unlock sting** — short triumphant sound, separate from victory.
- [ ] **Foil card draw shimmer** — when a foil card enters hand, light shimmer SFX.
- [ ] **Stash milestone tones** — already exist for 100/200/300/420 but verify they're distinct, building.

---

## 🎨 PRIORITY 5 — ART ASSETS

Drop PNGs at the listed paths — they auto-load via `BASE_URL`. No code changes needed unless explicitly noted.

### 5.1 Missing card art (6 cards) — `public/vestibule/cards/`
**Size: 128×128px (transparent PNG)**

These are the only cards still rendering with procedural placeholders. All 6 are corruption-themed, narrow palette:

- [ ] **`hungercard.png`** — *Hungering Flame* (CORRUPT) — Roaring black flame with a hungry maw inside it, biting outward. Reds/blacks.
- [ ] **`madnesscard.png`** — *Madness Unleashed* (CORRUPT) — A cracked head with maggots/eyes pouring out. Pure madness. Disturbing.
- [ ] **`whispercard.png`** — *Dark Whisper* (CORRUPT) — A shadowy mouth at an ear, smoke-tendrils visible as the whisper. Subtle, creepy.
- [ ] **`void_pact.png`** — *Void Pact* (CORRUPT) — A pure black hole consuming light. Stars warping inward at the edge.
- [ ] **`skullsplitter.png`** — *Skull Splitter* (RIFF) — An axe (the instrument!) embedded in a cracked skull. Purple energy at the impact.
- [ ] **`tappedout.png`** — *Tapped Out* (EMBER) — Empty Marshall amp with the power light dim, but glowing through cracks. The pre-surge moment.

### 5.2 Artifact art (12 items) — `public/vestibule/artifacts/`
**Size: 128×128px** (renders at 28-80px in tray and shop)

All 12 currently render as procedural icons. **Replace order: do shop-shown ones first** (a1, a3, a5, a6, ca1, ca2, ca3, ca4) since players see them in the buy menu most.

- [ ] `a1.png` — **Vintage Guitar** — Old Les Paul, glowing gold aura. Triggers ×1.5 always.
- [ ] `a3.png` — **The Evil Eye** — Single glowing teal iris in a triangular frame. First card free.
- [ ] `a5.png` — **Haunted Radio** — Old tube radio, ghostly static and a single visible face in the screen.
- [ ] `a6.png` — **Black Candle** — Dripping wax, purple flame, skull in the wax pool.
- [ ] `a8.png` — **Stone Tablet** — Carved runes glowing red. Crumbling at edges.
- [ ] `a9.png` — **Resonance Coil** — Tesla coil arcing gold sparks. Tuning fork base.
- [ ] `a10.png` — **Burning Stage** — Stage on fire, microphone silhouette in flames.
- [ ] `wardrums.png` — **War Drums** — Tribal drums with bone sticks, blood splatter on the skin.
- [ ] `ca1.png` — **The Goat of Mendes** — Goat skull, pentagram between horns, gold inlay.
- [ ] `ca2.png` — **Hellfire Amulet** — Glowing red gem on chain, flames around the setting.
- [ ] `ca3.png` — **Sabbath Crown** — Black crown with red gems and bone thorns.
- [ ] `ca4.png` — **Wailing Guitar** — Ghost guitar mid-scream, sound waves visible.

### 5.3 Passive art (10 items) — `public/vestibule/passives/`
**Size: 128×128px** (renders at 60-64px in shop and footer)

CD-R / equipment / band-life theme, purple accent. All currently procedural.

- [ ] `p1.png` — **Power Chord** — Lightning striking a power strip
- [ ] `p2.png` — **Roadie Crew** — Wrench + first aid kit
- [ ] `p3.png` — **Merch Table** — Band shirt + cash on a table
- [ ] `p4.png` — **Feedback Hum** — Amp humming with orange wave lines
- [ ] `p5.png` — **Amp Stack** — Wall of stacked Marshall amps
- [ ] `p6.png` — **Cult Following** — Hooded figures in a circle, candles
- [ ] `p7.png` — **Guitar Tech** — Hands adjusting guitar pickup screws
- [ ] `p8.png` — **Green Room** — Backstage couch, dim lamp, beer cans
- [ ] `p9.png` — **Heavy Rotation** — Spinning vinyl with motion blur
- [ ] `p10.png` — **Stage Fright Reversal** — Spotlight beam piercing total darkness

### 5.4 Pact art (currently 23 placeholders) — `public/vestibule/pacts/`
**Size: 128×128px** (renders at ~120px during pact selection)

Pacts already have 23 PNG files but they may all be procedural placeholders. **Audit by file size** — anything under 1KB is procedural. The 13 actual pact slots are:

`ember_surge` 🔥, `iron_strings` 🎸, `thick_skin` 🛡, `dark_bargain` 🌑, `speed_demon` ⚡, `blood_price` 🩸, `clean_living` ✨, `corruption_engine` ☠, `merchants_eye` 💰, `stone_wall` 🧱, `sixth_slot` 👥, `war_drums` 🥁, `atonement` 🕊

- [ ] **Audit pact art folder** — confirm which are real vs placeholders
- [ ] **Replace placeholders** — pact selection is a high-attention moment, art quality matters here

### 5.5 Boss loot art (5 + new ones) — `public/vestibule/loot/`
**Size: 128×128px** (renders at ~80px on drop)

Existing art for 5 items. Drops are a high-dopamine moment.

- [ ] `love_letter.png` 💋 (C2)
- [ ] `endless_hunger.png` 🕳 (C3)
- [ ] `golden_tooth.png` 🪙 (C4)
- [ ] `the_blade.png` 🗡 (C7)
- [ ] `mask_of_lies.png` 🎭 (C8)

There are **6 more loot items** added since this list was made (`limbos_echo`, `berserker_rage`, `heretics_brand`, plus three corruption gambit cards). Verify against current `BOSS_LOOT` array and create art for any missing.

### 5.6 Booster pack art retheme (5 packs) — `public/vestibule/packs/`
**Size: 256×384px** (vertical pack shape, renders at smaller in shop)

Current files: `touring.png`, `underground.png`, `festival.png`, `headliner.png`, `demonic.png`
But the **in-game pack names** are `cassette`, `cdr`, `vinyl`, `rarevinyl`, `cursed` — **mismatch.**

**Two options:**
1. **(Recommended)** Make new pack art matching the actual format names:
   - [ ] `cassette.png` — Cracked cassette, hand-written label, DIY ($6)
   - [ ] `cdr.png` — Burned CD-R in paper sleeve, marker-scrawled ($12)
   - [ ] `vinyl.png` — Standard vinyl in sleeve, import sticker ($22)
   - [ ] `rarevinyl.png` — Holographic gold vinyl, collector's edition ($38)
   - [ ] `cursed.png` — Bone/flesh case, glowing runes, hellish ($60)
2. Rename current files in code: touring→cassette, underground→cdr, festival→vinyl, headliner→rarevinyl, demonic→cursed.

### 5.7 Recruitment pack art (1 pack) — `public/vestibule/packs/`
- [ ] **`recruit.png`** — 256×384px — Sealed envelope with band silhouette behind it, "AUDITION" stamped on front

### 5.8 Card back (1 design) — `public/vestibule/cardback.png`
**Size: 256×384px** (renders at draw pile and pack opening)
- [ ] Inverted pentagram, "VESTIBULE" wordmark, dark with gold/red accents
- Players see this every single hand. Style anchor for the whole game.

### 5.9 Sly the Fence portrait — shop
- [x] Sly art exists as animated GIF at `public/sly.gif`
- [ ] **Verify shop layout uses Sly properly** — should feel like a character, not just a portrait. Already has reactive dialogue per memories.
- [ ] **Sly voice lines** — short audio barks on shop entry, big purchase, low stash, reroll. Even 4-5 lines transforms his presence.

### 5.10 Deck cover art (5 decks) — `public/vestibule/decks/`
**Size: 384×512px** (renders at ~280×360 on deck-select screen)

Folder is empty. These are the menu thumbnails for the 5 starter decks:

- [ ] `standard.png` — Electric guitar in a single spotlight, clean, balanced
- [ ] `shredder.png` — Flying V on fire, lightning, speed lines, aggro
- [ ] `ritualist.png` — Guitar on a stone altar, black candles, occult
- [ ] `engineer.png` — Mechanical guitar made of gears and circuit traces
- [ ] `survivor.png` — Battered cracked guitar held together with duct tape

### 5.11 App icon — `public/vestibule/icon.png`
- [ ] **`icon.png` 512×512** — Stylized "V" as inverted pentagram, blood red on black. Must read at 32px on a taskbar. Drop a 256×256 and a 128×128 alongside for OS scaling.

### 5.12 Steam capsule images
For the eventual Steam page:
- [ ] **Header capsule:** 460×215 — Logo + key art crop, hero element
- [ ] **Small capsule:** 231×87 — Just the wordmark, must read tiny
- [ ] **Large capsule:** 467×181 — Wider hero variant
- [ ] **Hero graphic:** 3840×1240 — Banner for the store header
- [ ] **Logo (transparent):** 1280×720 — For overlays
- [ ] **5+ screenshots:** 1920×1080 each — In-game moments showing combo, shop, boss reveal, score screen, deck building

### 5.13 Damage splash effects (7 tiers) — `public/vestibule/fx/`
**Size: 1920×1080 WebM (VP9 codec, opaque, black background — black disappears via `mix-blend-mode: screen` in CSS)**
**Duration: 0.5-3s per tier**
**FPS: 30 or 60**

Folder is empty. These are the **dopamine bombs** that fire on big hits. Current code already wires them — just drop the files and they activate.

- [ ] **`solid.webm`** (50+ dmg) — 0.5-1s — Single ember floats up from center, faint pulse ring. Like a candle flicker.
- [ ] **`heavy.webm`** (200+ dmg) — 0.8-1.2s — Quick orange spark burst from center, small shockwave ring. Match-strike energy.
- [ ] **`critical.webm`** (500+ dmg) — 1-1.5s — Red/orange flash, sparks outward, screen edges glow red, light cracks radiating. Anvil hammer.
- [ ] **`massive.webm`** (1000+ dmg) — 1.5-2s — Center explosion, fire particles, lightning arcs across screen, debris falling. Pyrotechnics.
- [ ] **`devastating.webm`** (2500+ dmg) — 2-2.5s — Massive shockwave, screen cracks like glass with light pouring through, purple/red vortex spinning. Stage collapsing.
- [ ] **`ultra.webm`** (5000+ dmg) — 2-3s — Full eruption, white-hot center, pentagram sigils burning at edges, energy beams to corners, color cycle red→gold→white. Nuclear at a Sabbath show.
- [ ] **`godlike.webm`** (10,000+ dmg) — 2.5-3s — White flash → kaleidoscope, fractals, sacred geometry, inverted pentagram center, ⛧ symbols rain like Matrix code. DMT trip at the gates of Hell.

**AE workflow:**
1. Comp: 1920×1080, black background
2. Design effect with particles/light rays/etc.
3. Export → Media Encoder → WebM, VP9 codec
4. If AE can't WebM, export ProRes 4444 then convert: `ffmpeg -i input.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M output.webm`
5. Drop in `public/vestibule/fx/`
6. Test in-game — black should disappear

---

## 🎬 PRIORITY 6 — CUT SCENES (currently zero)

The game has **no cut scenes**. This is the biggest "AAA polish" gap. Each one anchors a memorable moment. All target **1920×1080** at **24-30fps**, **5-15 seconds** each, exported as **WebM (VP9 alpha) or MP4**.

### 6.1 Cold Open / Game Intro
**5-8 seconds, 1920×1080**
- Fade up from black on a smoky club back-alley. Camera tracks past stacked amps and graffiti walls. Distorted guitar drone builds. Final beat: stage curtain pulls back to reveal the VESTIBULE logo carved in burning runes.
- **Direction:** This sets the tone for the entire game. Should feel like the cold open of a metal documentary — gritty, lived-in, dangerous.
- **Skippable:** YES (with localStorage flag, code already supports this pattern)

### 6.2 Welcome to Hell (Welcome Tour)
**8-12 seconds, 1920×1080**
- Already has a `welcomeToHell` state in code (line 7340 area). Currently just a state transition with no visual.
- **Direction:** Camera plummets from a stormy sky down through layers of cloud, then fire, then twisted geometry, finally arriving at the gates of Hell. The Executive (AR_EXECUTIVE) is silhouetted at the gate, holding a clipboard. "We've been expecting you."
- **Trigger:** First time the player reaches Lucifer (post-final-shop, before the AR_EXECUTIVE encounter)

### 6.3 Circle entry transitions (9 short scenes)
**3-5 seconds each, 1920×1080**
- Brief flythrough into each new circle as the player descends.
- Currently the descent screen just shows enemy choices — should be preceded by a 3-5s atmospheric beat.

| Circle | Direction |
|---|---|
| **I — Limbo** | Foggy void, distant figures shuffling aimlessly, gray and listless |
| **II — Lust** | Velvet rooms with chained doors, red light, distant moaning |
| **III — Gluttony** | Mountains of rotting feasts, flies, gnashing teeth in the dark |
| **IV — Greed** | Gold coins falling forever into a black pit, glittering uselessly |
| **V — Anger** | Lakes of fire, screams, distorted bodies in eternal combat |
| **VI — Heresy** | Burning books, broken altars, false idols crumbling |
| **VII — Violence** | A forest of weapons growing from blood-soaked earth |
| **VIII — Fraud** | Endless mirrors, masks shedding to reveal more masks |
| **IX — Treachery** | Ice plains, frozen faces under the surface, wind howling |

### 6.4 Boss reveals (27 short scenes — optional, do bosses first then minor enemies later)
**2-4 seconds each, 1920×1080**
- A "name card" reveal when each boss appears for the first time. Big text, heavy hit on the name beat, boss portrait holds.
- **Priority subset (3 boss-tier per circle, 9 total):** Drifter, Seducer, Devourer, Usurer, Warlord, False Prophet, Executioner, Archfraud, Lucifer.
- **Direction:** Camera close on the boss silhouette, then snap-zoom out as the name burns onto screen. Drum hit on the name. 2 seconds total — fast, punchy, never skippable on first encounter.

### 6.5 Lucifer reveal (the big one)
**12-18 seconds, 1920×1080**
- Earned at end of C9. Should be the single best cinematic moment in the game.
- **Direction:** Black screen. Distant heartbeat builds. Eyes open in the dark — six of them. Camera pulls back to reveal Lucifer on a throne of bones, surrounded by burning books and broken instruments. He stands. He speaks one line: *"You came all this way... for an encore?"* Stage lights snap on. The final boss music drops. Title card: **LUCIFER — Circle IX, Treachery.**
- **Make it cinema.** This is the moment players post on social media.

### 6.6 Victory cutscene
**10-15 seconds, 1920×1080**
- Triggered when Lucifer dies. Currently goes straight to score screen, which feels deflating.
- **Direction:** Lucifer collapses in slow motion, the throne shattering. Camera pulls back through Hell. Each circle we descended through flashes by in reverse, but burning brighter now. The band emerges from Hell standing on a stage built on the gates. Crowd silhouettes raise lighters. Hold on the band. Cut to score screen.
- **Tease NG+:** End title says "VESTIBULE — Encore Mode Available" if first victory.

### 6.7 Death stings (3 variants)
**5-8 seconds each, 1920×1080**
- Currently goes straight to the (now-fixed) end screen. A 5-8s sting before the score increases dramatic weight.
- **`stoned.webm`** — All band members slumped on stage, smoke rising, instruments dropped. Slow zoom out. Heavy black metal dirge.
- **`beaten.webm`** — Boss silhouette towering over fallen band, victorious. The boss looks at camera. Silence.
- **`fallen.webm`** — (Lucifer's FALLEN keyword path) Lucifer's flame extinguishes; the band looks horrified at what they've done. They've killed God's adversary — what does that make them? Ambiguous moral beat.

### 6.8 Member MVP cards (cosmetic, future)
**2-3 seconds each, 1920×1080**
- After-victory: a quick name-card style flourish for the MVP member of the run, with a quote.
- **Direction:** Member portrait, name, "MVP" stamp animating in, their best stat, then their voice line (see dopamine #11).

---

## 🛍️ PRIORITY 7 — SHOP POLISH

### 7.1 Pack opening polish
- [x] 5-phase tear-open animation already shipped (per memory)
- [ ] **Verify pack art matches name** (see 5.6 — packs are mismatched currently)
- [ ] **Anticipation pause** — increase the hold-before-reveal by 200-300ms. Players need that "what's inside?" tension.
- [ ] **Rare card reveal sequence** — if pack contains a Rare card, slow the reveal of that card by 50%, add slight glow build-up.

### 7.2 Card display in shop
- [x] All shop screens use CardArtImg (per AUDIT_REPORT.md)
- [ ] **Add hover-to-zoom** on shop cards — magnify card art on hover for those who want to study before buying.
- [ ] **Show rarity badge prominently** — currently just border color. Add explicit "RARE" / "UNCOMMON" stamps.

### 7.3 Sly character development
- [ ] **Sly voice lines** (see 5.9) — when 4-5 audio barks land, run a polish session on his existing reactive dialogue to sync voice + text.
- [ ] **Sly inventory teasing** — when reroll is hovered, show a faded silhouette of "what could appear" to bait the gamble.

---

## 🧠 PRIORITY 8 — UI/UX POLISH

### 8.1 Quick wins
- [ ] **Damage preview color-codes** — preview should turn green when it kills the boss, gold when it would set personal best, red if a critical strike will leave a member dead from incoming counter
- [ ] **Card cost ghost** — when you can't afford a card, show "need X more" tooltip on hover
- [ ] **Boss intent telegraph** — small icon next to boss showing "next attack: 4 dmg → random" or similar (SLAY THE SPIRE STAPLE — players love planning)
- [ ] **Drag preview improvement** — when dragging a card to a member, show the post-play stats (current ATK + bonus). Currently you only see the buff number, not the result
- [ ] **Pre-strike multiplier breakdown** — hover the strike button to see "base 47 × 1.5 dbl × 1.78 chain × 1.5 corrupt = 188". Already mostly built (DamageBreakdown component) but needs hover trigger

### 8.2 Resolution / scaling
- [ ] Game is hard-coded at 1920×1080. Players on smaller screens (1366×768 laptops) get clipped. Add a global CSS scale transform that fits viewport.

### 8.3 Performance
- [ ] **Bundle size** — 743KB minified, 198KB gzipped. Code-split lazy-loaded screens (shop, end, collection) to drop main bundle to ~300KB
- [ ] **Animation profiling** — at 9000+ lines and dozens of styled-divs per render, the StageSlot map probably re-renders too often. Memoize with React.memo

---

## 🏆 PRIORITY 9 — META-SYSTEMS / LONGEVITY

These are what bring players back day 2, day 7, day 30.

### 9.1 Daily challenge (already started)
- [x] Daily seed system shipped
- [x] "Beat VomitWizard" target shipped
- [ ] **Daily leaderboard** — score visible across all players who beat the same daily seed. Either Steam leaderboards or a simple Firebase/Supabase backend.
- [ ] **Daily streak rewards** — 3-day streak = +X stash next run, 7-day = unlock cosmetic, 30-day = unique title. Already partially implemented.

### 9.2 Achievements
- [x] 28+ achievement system in code
- [ ] **Achievement variety pass** — review the current set. Are there enough EASY ones (early dopamine)? Enough HARD ones (long-term chase)? Should be a heavy curve: many easy, few hard.
- [ ] **Steam achievement integration** — when you ship to Steam, hook up the SDK. Already flagged in STEAM.md.

### 9.3 Cosmetics / unlockables
- [ ] **Card backs** — beat each circle = unlock a new card back. Currently single design. Hugely cheap dopamine win.
- [ ] **Foil card upgrade** — let players spend stash post-run to "foil" a favorite card. Cosmetic only, but it's their card now.
- [ ] **Member alternate art** — beat the game with a member as MVP = unlock alt-color sprite for them.

### 9.4 Endless mode
- [ ] **NG+ / Encore Mode escalation** — already exists as a flag but the scaling needs review. Should hit insane numbers on second loop. The "I broke the game" moment.
- [ ] **Infinite circle (post-Lucifer)** — after killing Lucifer, optional "Mt. Olympus" mode where bosses scale infinitely. Pure number-go-up endgame.

---

## 🚀 PRIORITY 10 — STEAM LAUNCH READY

When the above is solid, this is the path to live:

- [ ] **Set up Steamworks account** ($100 Direct fee — JV's task)
- [ ] **Create store page** with description, tags, screenshots, capsules
- [ ] **Submit Steam Direct review** (typically 5-10 days)
- [ ] **Steam Cloud save** — wire up via Steamworks SDK
- [ ] **Steam achievements** — wire up SDK
- [ ] **Build pipeline** — `npm run dist:win` → SteamPipe upload, automate this
- [ ] **Pre-order page live** at $4.20
- [ ] **Trailer** — 60-90s, Vestibule cuts, set to one of JV's tracks. Critical for storefront conversion.
- [ ] **Press kit** — screenshots, key art, fact sheet, contact info

---

## 🧬 20 DOPAMINE IDEAS — making this addictive

Why people can't stop playing **Balatro, Slay the Spire, Vampire Survivors, MTG**:

- **Balatro:** Multiplicative scaling that surprises you. Hidden joker synergies. Daily run with shareable scores. Visceral SFX on every chip/mult. "I broke the game" moments.
- **Slay the Spire:** Relic stacking, deck archetypes that feel distinct, transparent enemy intent for planning, daily climbs.
- **Vampire Survivors:** Power-up evolutions that combine into something stronger, endless number-go-up, easy unlock cadence, screen drowning in particles.
- **MTG:** Infinite combinatorics, the chase for the rare card, decks players name and share.

**The common DNA: the player should feel they discovered something the designer didn't fully anticipate.** That's the addiction.

Twenty things to push Vestibule there:

### 1. Mid-strike running multiplier tally
Show the strikeMult building in real-time as cards are played. "×1.05 → ×1.10 → ×1.78 (CHAIN!) → ×2.67". Each tick has a sound. Players feel the stack growing — Balatro's whole loop is this single mechanic visualized hard.

### 2. Joker-style artifact "loud" advertising
When an artifact triggers, it shouldn't just pulse — it should pop a banner: "🎸 VINTAGE GUITAR FIRES — ×1.5". Players should know which artifact did the thing so they go hunt for more like it.

### 3. Combo discovery banner
First time you fire a specific 4+ card combo, dim the screen, freeze for 1.5s, blast a banner: "FIRST DISCOVERY: VOID CASCADE!" with a 🔓 sound. Save to localStorage so it's once-per-account, not per-run. Players will hunt the rest.

### 4. Boss intent telegraph (Slay the Spire's killer feature)
Small icon next to boss: "next attack: ⚔ 4 dmg → random member". Lets players plan. Removes randomness from feeling unfair. Currently you can't see what's coming.

### 5. Pre-strike "kill confirm" highlight
If your pending damage will kill the boss, the strike button glows green and pulses faster. The hover shows "LETHAL". Pure dopamine — that "I solved it" feeling.

### 6. Member voice barks (low budget if needed)
2-3 short audio clips per member. They bark on crit, on dying, on MVP-ing. Even synthesized voice or just a single distorted "fuck yeah" works. Members become characters, not stat blocks.

### 7. Run highlights montage
Post-victory: 5-8 second auto-edited montage of the 3-4 biggest hits of the run, slowed down with damage numbers floating up. Like NBA 2K's after-game highlights.

### 8. Deck DNA badge
While playing, a small badge in the corner reads "RIFF SPECIALIST 78%" or "CORRUPT MASTER 65%" based on what cards you've played most. Updates live. Players start min-maxing for their badge.

### 9. Card discovery shimmer on first draw
First time you draw a card you've never played, it gets a 1.5s gold shimmer animation as it slides into hand, with a soft chime. Tracks via mastery system. Encourages exploring all 85 cards.

### 10. Synergy hint on hover
Hover a card in hand → other cards that combo with it briefly glow gold. Riff Chains visible to players who haven't memorized them. Slay the Spire does this with their "exhaust" coloring.

### 11. Member MVP voice line
After the score screen, your MVP member says a 2-second line. "Bjorn: 'I think we just killed God.'" Random per member, 4-5 lines each. Players will replay just to see them all.

### 12. Number-tier visual escalation
Damage numbers should look DIFFERENT at different tiers. 50 dmg = small white. 500 = orange, screen-shake-1. 5000 = giant gold, screen-shake-3, glow. 50000 = full-screen explosion text. Already partially in (8 tiers) — push it harder.

### 13. Daily leaderboard with friends
Daily seed already exists. Add a simple leaderboard (Steam or your own). Show your rank vs everyone. Show top 3 worldwide. Let players invite a friend's username to compare. This is how Balatro became viral.

### 14. Stash overflow conversion
When stash hits 420 cap, excess flows into something else — bonus rerolls? Bonus pack? Currently overflow is just lost. Free dopamine — every coin should feel like progress.

### 15. "Almost died" moments captured
If a member ended a fight at 1-3 HP, log it. Show on score screen: "💀 ALMOST DIED: Ingrid (1 HP)". Then "BUT YOU SURVIVED." Frames close calls as wins.

### 16. Streak meta-rewards
Win-streak rewards already exist (memory). Push it: 3 wins = +1 starting ember next run, 5 = +1 stash, 10 = unlock cosmetic. Make the streak visible on the menu so it never gets forgotten.

### 17. Cassette tape "save your run" share
At end of run, generate a tiny PNG image: pixel art cassette with run stats burned onto the label. Player can save/share. Like Balatro's run summary or Wordle's emoji grid.

### 18. Hidden mythic combo unlocks
5-10 secret combos pre-defined in code (e.g., "Possessed Performance + Echo Pedal + ×3 corruption mult"). When a player triggers one for the first time, full-screen takeover: "MYTHIC COMBO: HEAVEN'S MOUTH" with a 3-second cinematic. They scream and tell their friends.

### 19. "Gear lust" between runs
Show the 3 most-popular cards/artifacts the player has NEVER unlocked, on the death screen. "You haven't seen: ⚡ Resonance Coil." Adds run #2 motivation that wasn't there.

### 20. Ascension/stake visible meta-progress
Stakes (Bronze→Demonic) already exist. Make the meta-progress LOUD. After-run screen: "SILVER UNLOCKED → +1 boss damage, but you now know Bronze better than 78% of players." Let people know they're climbing a real ladder.

---

## NOTES TO SELF

**Cardinal rule:** every commit MUST update this TODO.md. If a feature lands, mark it done. If a bug is found, add it. The doc decays the moment it stops being touched.

**Stale doc cleanup is the cheapest unlock for the next session** — see Priority 3.3. After that, every session starts faster.

**The game is mechanically close to done.** What's left is polish, art, and the dopamine layer — which is where AAA-feel actually lives. Don't underestimate this phase. A mediocre game with great juice ships better than a great game with mediocre juice.
