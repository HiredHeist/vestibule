# VESTIBULE — TODO (Pre-Early Access)
*Last updated: May 1, 2026 (sim-validated balance pass v20 in progress, commit 1/3 shipped)*

---

## 🎯 BALANCE PASS v20 — STAGED ROLLOUT

Sim-validated 10k-game tuning across all 9 circles. Designed alongside JV
in long iteration session. Shipping in 3 commits to allow clean revert if
something feels off in playtest.

### Commit 1 (THIS COMMIT) — C5 boss reworks + fraudShuffle softening
- [x] Wrathful: rageScale1 → SELF-IMMOLATING RAGE (+50% dmg/strike cumulative,
      loses 8% maxHp/strike). Outlast or burst.
- [x] Berserker: rageScale1 → BLOODLUST (×2 damage when below 50% HP).
      DPS race phase mechanic.
- [x] Warlord: rageScale2 → COMMANDS (random debuff per strike: -1 ATK all,
      OR -1 ember, OR discard 1 hand card).
- [x] fraudShuffle softened: 1/2/3 → 1/1/2 cards discarded (Trickster/
      Deceiver/Archfraud).
- [x] Damage preview updated to reflect new C5 mechanics.

### Commit 2 (THIS COMMIT) — HP rebalance across 20 bosses
- [x] C3 buff: Glutton/Feaster/Devourer HP 620/840/2600 → 775/1120/3536, heal/card 3/5/8 → 8/15/25
- [x] C4 nerf: Miser/Hoarder/Usurer HP 1100/1650/4800 → 770/1220/3550 (-30%/-26%/-26%)
- [x] C5 nerf: Wrathful/Berserker/Warlord HP 2800/4100/8000 → 1090/1680/3840 (-61%/-59%/-52%)
- [x] C6 nerf: Heretic/Apostate/F.Prophet HP 6200/9000/14000 → 1550/2340/3780 (-75%/-74%/-73%)
- [x] C7 nerf: Brute/Hunter/Executioner HP 10500/15000/22000 → 2000/2850/4180 (-81% across)
- [x] C8 nerf: Trickster/Deceiver/Archfraud HP 18000/24000/32000 → 3960/5040/6400 (-78%/-79%/-80%)
- [x] C9 nerf: Traitor/Betrayer HP 22000/30000 → 2000/2100 (-91%/-93%)
- [x] Lucifer formula unchanged — already lands at 6666 HP at endgame

### Commit 3 (THIS COMMIT) — strikeMult cap raise + partial keyword stacking
- [x] strikeMult cap: 66.6× → 10,000× across all 11 clamp sites. Sim showed
      cap was never binding for the AI; this is for the dopamine ceiling
      that real players will eventually hit when they break the game.
      Balatro-feel uncap.
- [x] DEBUFF stack tier scaling: count → tier (1/2/4 by stacks), foil
      counts as 2 stacks. 3 DEBUFF members now reduce boss dmg by ×4
      tier instead of ×3 linear. Real defensive payoff for Vocalist stacks.

### Commit 4 (IN PROGRESS — staged sub-commits) — Full keyword stack refactor
Centralizes keyword bonuses into `getEffectiveAtk()` helper and re-specs
FRENZIED/SHREDDER/ANCHOR to match sim behavior (Option A: replace live
behaviors with sim-spec versions, since sim is balance source of truth).

- [x] **4a — Helper foundation + CORRUPT centralization (COMMITTED)**
      Added top-level `CARD_TYPE_BY_ID`, `_stackTier`, `getKeywordStacks`,
      `getEffectiveAtk` helpers. Centralized 10 scattered CORRUPT sites
      (2842 preview, 6700/6715/6728/6729/6769 in handleStrike, 9215-9242
      in damage tooltip). 2-stack CORRUPT now ×2 the per-corruption bonus,
      3+ stack ×4 (matches sim). 1-stack unchanged. StageSlot received
      new `corruptTier` prop computed once per render.
- [x] **4b — FRENZIED rewrite (COMMITTED)**: ripped boss-kill +1 ATK
      perm stack from victory block. FRENZIED branch in getEffectiveAtk
      now adds `riffsThisStrike * tier` per member. handleStrike
      snapshots cardsPlayedRef before the reset on line 6730 to feed
      the bonus. Damage preview reads cardsPlayedRef directly (refs are
      always fresh on render). 1-stack = +1/RIFF, 2 = +2/RIFF, 3+ = +4/RIFF.
- [x] **4c — SHREDDER rewrite (COMMITTED)**: ripped the "first RIFF/strike
      costs 1 less ember" discount entirely — removed `shredderUsed` state,
      `hasShredder`/`shredderDiscount` from cost calc, deps array entry,
      undoSnapshot field, undo restore, and 2 fight-reset call sites.
      SHREDDER now adds `shredderHits * tier` to ATK via getEffectiveAtk,
      where shredderHits = consecutive same-type card pairs played this
      strike. Computed in handleStrike from card-id snapshot, mirrored in
      damage preview reading cardsPlayedRef live.
- [x] **4d — ANCHOR rewrite (COMMITTED)**: ripped the +1 HP/strike adjacent
      regen block. ANCHOR now saves members from lethal boss damage,
      tier 1 = 1 save/fight on ANCHOR members, tier 2 = 2 saves/fight on
      ANCHOR members, tier 4 (3+ stacks) = 4 saves/fight on ANY member.
      Added `anchorTierRef`/`anchorSavesUsedRef`, locked at fight start.
      Added `_tryAnchorSave(target)` helper that increments saves-used.
      Hooked into 2 boss-damage death sites: Lucifer phase-2 AoE and
      standard boss attack. Decisions pre-computed OUTSIDE setStage to
      avoid StrictMode double-fire of ref mutations. Voluntary deaths
      (Mosh Pit, Devil's Wager, Russian Roulette, Blood Oath) bypass
      save by design — boss damage only.
- [x] **4e — DOUBLE TIME tier-3 + tooltip/desc rewrites (COMMITTED)**:
      added DT tier-3 logic — at 3+ stacks of Drummers (or 2 foils),
      ALL non-drummer members get a second hit equal to their effective
      ATK. Sits between encore and band synergy in the damage flow.
      Mirrored in damage preview tooltip. Updated KEYWORD_DESC tooltips,
      in-game keyword glossary cards (line 1557+), and the rules-help
      Member Keywords text (line 8005) to reflect new mechanics for
      FRENZIED, SHREDDER, ANCHOR, DOUBLE TIME, CORRUPT.

**Commit 4 status: COMPLETE.** All 5 sub-commits shipped. Live game
keyword behaviors now match the sim. Re-playtest needed to verify the
2-member opener (Bjorn FRENZIED + Gunnar SHREDDER) handles Wanderer
better, and to find any tuning issues from the per-strike scaling.

### Sim results targets (after all 3 commits):
- Avg fight reached: 17.66/26 (vs 10.88 baseline, +63%)
- **Lucifer wins: 10.16%** (vs 0% baseline — earned victory tier)
- Smooth death curve C3→C9 instead of bimodal C4-C5 walls
- Slot machine fires +319% (Riff Chains 36k → 152k per 10k runs)

---

## 🩹 UI FIXES — MAY 2

### Death screen overflow clipping — DONE
- [x] EndScreen wrapper used `justifyContent:'center'` + `overflow:'hidden'`,
      which clipped both top and bottom when content exceeded 1080px.
      Switched to `flex-start` + `overflowY:'auto'` with 30px top/bottom
      padding so tall content scrolls instead of vanishing. Visible at
      line 4126 in `src/App.jsx`. Repro: die with full stats panel +
      keyword strip + achievement badges + near-miss block all firing —
      stats row at top and keyword strip at bottom were getting cut off.

### Member tooltip clipping under hand fan — DONE (May 2)
- [x] StageSlot keyword tooltip was positioned `top:'calc(100% + 6px)'`
      (below card), causing it to land in the hand-fan area where it got
      clipped despite z-index 99999. Moved to `bottom:'calc(100% + 6px)'`
      so it floats above the card into the artifact tray area which has
      breathing room. Line 2856 in App.jsx.

### Redundant DECK/DISC small labels above hand fan — DONE (May 2)
- [x] Two small text labels ("DECK 62", "DISC 0") sat at the top of the
      card-fan area duplicating data already shown in the lower-left
      DeckPile + DiscardPile components. Removed both (and the inline
      discard preview popup that was triggered by clicking DISC — the
      lower-left DiscardPile already opens a fuller viewer). Hand-size
      indicator (e.g. "5/5") in the middle is preserved. Removed the
      now-orphaned `showDiscardPreview` state. Line ~9376 area.

### Wanderer HP nerf — fight 1 should be a tutorial, not a wall — DONE (May 2)
- [x] Wanderer base maxHp 140 → 90 (35% cut). Standard deck scaled HP
      drops from 259 to 167. JV's playtest had repeated runs ending at
      Wanderer with 14 HP remaining despite playing 22 cards over 4
      strikes — system was tuned for the multiplicative ceiling but the
      2-member starter can't generate enough chains to hit it. Lost Soul
      (150) and Drifter (340) untouched, so Circle I curve goes 90 →
      150 → 340 base — gentle ramp, room to add a 3rd member from the
      shop after fight 1. NOTE: sim's wanderer HP not yet updated to
      match — sim divergence is acceptable for now since JV will
      re-tune sim post-keyword-refactor playtest.


---

## 🚨 OLDER LAUNCH BLOCKERS — FROM 10K-RUN SIM

These were identified by running the v19.1 simulator over 10,000 games at
all 6 stakes. Full report: `SIM_REPORT_MORNING.md`.

### Boss HP scaling C7-C9 — RESOLVED IN BALANCE PASS v20

### Acid rebalance — HIGH
- [ ] Acid is functionally dead. 1.6% use rate vs 40% for shrooms (40:1 ratio).
- [ ] Options: lower price (12→8), remove bad-trip on Bronze, buff guaranteed
      positive outcomes, OR show clearer effect previews.

### Herb Money buff
- [ ] Only card with <1% pick rate (0.4%). Either drop the cost or add a
      synergy hook to other RIFF cards.

### Hellquake reachability
- [ ] Sim shows 0 Hellquakes fired across 10k runs (corruption-100% never
      reached because runs die first). Worth checking whether corruption-100%
      is reachable in real play, or if the climactic Hellquake moment is
      decorative content nobody sees.

---

## 🔴 LAUNCH BLOCKERS (do these or don't ship)

### Audio (JV)
- [ ] Menu ambient drone (30-60sec dark loop)
- [ ] Combat music loop (60-90sec doom metal)
- [ ] Death/defeat sting (5-10sec)
- [ ] SFX: card play (thud/slap)
- [ ] SFX: strike hit (impact)
- [ ] SFX: chain combo (ascending chime)
- [ ] SFX: member too stoned (distorted crash)
- [ ] SFX: boss kill (heavy drop)

### Card Art (JV — PixelLab, top 10 most-played by sim)
Priority order updated based on 4k-bronze-run sim card usage data:
- [ ] Battle Cry (cards/battlecry.png) — 8.22 plays/game · #1 staple
- [ ] Encore (cards/encore.png) — 6.91/game
- [ ] Infernal Encore (cards/infencore.png) — 6.62/game
- [ ] Distortion (cards/distortion.png) — 6.46/game
- [ ] Resonance (cards/resonancecard.png) — 6.41/game
- [ ] Power Tap — 4.77/game (NEW priority based on sim)
- [ ] Static Charge — 4.72/game (NEW priority)
- [ ] Tapped Out — 4.71/game (NEW priority)
- [ ] Possessed Performance — 4.51/game
- [ ] Amp It Up (cards/amp.png) — 4.38/game
- [ ] Heavy Riff (cards/heavyriff.png) — 4.30/game
- [ ] Mosh Pit (cards/moshpit.png) — 4.30/game
- [ ] Death Riff (cards/deathriff.png) — 3.60/game
- [ ] Blood Ritual (cards/bloodritual.png) — 1.91/game

---

## 🟡 HIGH PRIORITY (first week post-EA)

### Code Quality (Claude) — RISK GROWING DAILY
- [ ] **Split App.jsx into modules.** Currently 9,261 lines. Latent bugs
      hide in a file this big (the `ns=` undefined we caught was a symptom).
      Save for fresh-eyes morning session.
      Suggested split: ShopScreen → src/screens/ShopScreen.jsx;
      MasteryGallery, StatsScreen, TrophyWall → src/screens/;
      SaleCard / BoosterPack / HandCard / StageSlot → src/components/;
      Constants (ALL_CARDS, STARTER_ARTIFACTS, etc) → src/data/;
      Animations CSS stays in App.css.

### Features (Claude)
- [ ] Heat unlocks / scoring multiplier — currently Heat is just +HP for
      bosses. No reward for the player. Add: heat-locked stake unlocks,
      heat score multiplier, heat-only cosmetics.
- [ ] More Sly contexts: hover-on-card whisper (not just artifact),
      hover-on-pack whisper, "you're broke kid" reaction at <10 stash

---

## 🟢 POST-LAUNCH (player feedback driven)

### Audio (JV)
- [ ] Per-circle music variants
- [ ] Lucifer boss theme
- [ ] Victory fanfare, corruption drone, shop ambient

### Art (JV)
- [ ] Remaining ~70+ card arts (5-10 per patch)
- [ ] Card back, loading screen, Steam capsule images

### Features (Claude)
- [ ] Unlockable card themes (cosmetic)
- [ ] Boss rush mode
- [ ] Practice mode
- [ ] Card crafting (2 copies = 1 upgraded)
- [ ] Elite fights, daily leaderboard
- [ ] Steam achievements

---

## ✅ COMPLETED — APRIL 30 → MAY 1 OVERNIGHT

### Shop polish (multiple rounds)
- [x] Shop overhaul: simpler layout, cleaner hierarchy
- [x] Cards-for-sale: 75% scale (300→225 width)
- [x] Bottom row taller (420→520) — boosters + Sly's Buyback prominent
- [x] Sly icon panel beside Buyback rates (300×520)
- [x] **Sly portrait shipped** — 172×256 animated GIF in shop slot
- [x] BACK TO THE PIT throbbing red pulse (`throbPulseRed` animation)
- [x] SLY'S MERCH banner taller (54→78), font fits cleanly
- [x] "Another Look" → "🎲 Reroll", single-line wider
- [x] Sly quotes use MBScribblesFont (readable, was illegible at 13pt)
- [x] Drug emojis 28→48 with tinted shadows
- [x] Left column: Band Recruitment dominates (flex:1, art 200→288)
- [x] Artifact + Effect Pedal renamed (Balatro-Joker logic — they rotate)
- [x] Bottom-justified gear panels

### Visible game-state systems
- [x] Effect Pedal slots in fight sidebar — always 3+, parallel to artifact tray
- [x] Phase banner cleanup (Play Cards idle text removed)
- [x] Chain hint tooltip clipping fix (absolute-positioned below card)
- [x] Hover glitch killed (3-way animation conflict diagnosed)
- [x] Band Recruitment vanishing-border fix (gold-on-gold contrast)

### Sly reactive dialogue — extended
- [x] hoverArtifact pool (5 lines, top priority)
- [x] cleanedOut pool (4 lines, when shop is bought out)
- [x] encore pool (5 lines, post-Lucifer encore mode)
- [x] encoreMode prop wired into ShopScreen
- [x] hoveringArtifact state on circle artifact panel

### Heat indicator on menu
- [x] 🔥 HEAT X/10 panel below stake selector
- [x] 10-pip row fades gold → orange → red
- [x] +15% boss HP per level shown
- [x] Hover tooltip explains system

### Stats screen
- [x] 📊 Stats button on main menu
- [x] 12 stat cards in 4-column grid
- [x] Top 5 most-played cards panel
- [x] All sourced from existing localStorage (no new tracking)

### Font legibility migration
- [x] 41 ScratchFont→MBScribblesFont swaps where fontSize<20
- [x] Lint rule 1b enforces ScratchFont≥20pt forever
- [x] Pawn shop, hunger warnings, polaroid labels, map rewards — all migrated

### Design system v3
- [x] 180 unique inline hex → 13 sanctioned tokens (92.8% reduction)
- [x] 5 text hierarchy + 2 semantic + 4 type + 2 tier
- [x] All WCAG-validated where applicable
- [x] `npm run check` is hard guard — 4 rules clean

### Sly reactive dialogue — base system (earlier this week)
- [x] 9 contextual line pools (multiBuy, boughtPack, boughtCard,
      highCorruption, flushStash, brokeStash, deepCircle, firstVisit, ambient)
- [x] Live state-driven context picks
- [x] Gold flash on context change

### Per earlier sessions
- [x] Big 5 features
- [x] Doom Forge
- [x] Sim v19.1 synced
- [x] 69-card deck
- [x] Corruption deck
- [x] Tutorial system
- [x] All 65 sprites + 18 idle anims wired
- [x] 20 dopamine features (live damage preview, screen effects, etc)
- [x] Custom AE splash animation system (WebM)
- [x] Cold open splash with localStorage skip
- [x] Pokémon-style pack tear-open animation
- [x] Mentor Link system
- [x] Score system + grade tiers
- [x] Card mastery + Pokédex collection screen
- [x] Daily challenge with "Beat VomitWizard" target
- [x] Lucky Draw (post-game, locked behind Lucifer kill)
- [x] Save/resume system
- [x] 5 starter decks
- [x] Pact system

---

## 📊 BALANCE SNAPSHOT (10K SIM)

From `SIM_REPORT_MORNING.md`, key per-game numbers worth tracking:

| Metric | Value | Verdict |
|---|---|---|
| Riff Chains / game | 9.05 | Strong rhythm ✅ |
| Doom Forge upgrades / game | 3.4 | Active crafting ✅ |
| Pacts chosen / game | 3.4 | Engaged with risk/reward ✅ |
| Random events / game | 1.6 | Choice density solid ✅ |
| Mentor Links per run | 43% | Good synergy hits ✅ |
| Boss loot collected / game | 3.4 | Drop rhythm healthy ✅ |
| Lucifer wins | 0% | ❌ TOP PRIORITY |
| Acid use rate | 1.6% (vs 40% shroom) | ❌ Acid broken |
| Hellquakes / 10k games | 0 | ⚠ Decorative, never seen |
