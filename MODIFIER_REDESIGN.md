# Vestibule Modifier System Redesign

**Status:** DESIGN DRAFT — needs JV approval before implementation
**Date:** May 2 2026
**Goal:** Make the artifact + pedal system the dopamine engine of the run. Fat multipliers, build commitment, Balatro-tier combos.

---

## The Framing

> **Artifacts payout. Pedals enable.**

Two distinct systems with different mechanical roles:

| | Artifacts | Pedals |
|---|---|---|
| Slot count | 3 | 2 |
| Role | Damage multipliers (×N) | Strategy enablers (rule-changers) |
| When they fire | Each Strike | Each card play / fight start / structural |
| Why pick | Make numbers BIG | Make conditions REACHABLE |
| Power axis | Multiplicative damage | Resource economy / draw / cost / corruption |

**The combo loop:** Pedals get you to the conditions Artifacts demand. Artifacts pay the dopamine. Together, 5 well-chosen modifiers can spike a strike from ~50 damage to ~50,000+ damage when the build sings.

---

## Audit — What Exists Today

### Existing Artifacts (18 total — but 2 are weak)

**Multiplier-producing (12):**

| ID | Name | Mult | Trigger | Cost | Notes |
|---|---|---|---|---|---|
| a1 | Vintage Guitar 🎸 | ×1.3 | 4+ cards played | 10 | Solid, easy to hit |
| a2 | Devil's Tuning Fork 🔱 | ×1.5 | Corruption ≥60% | 16 | Good, includes +15% corr at fight start |
| a5 | Haunted Radio 📻 | ×1.2/chain | Per Riff Chain fired | 8 | Compounding |
| a6 | Black Candle 🕯 | ×1.4/stoned | Per Too Stoned member | 12 | Compounds with Void Engine |
| a9 | Resonance Coil ⚙️ | ×1.15/dupe | Per duplicate in hand | 10 | Niche |
| a10 | Burning Stage 🔥 | ×3.0 | All 6 cards played | 22 | Build-defining |
| ca1 | Goat of Mendes 🐐 | ×1.5 | Always | 28 | The classic |
| ca5 | Hellmouth Amplifier 🌋 | ×5.0 | Corruption ≥80% | 40 | Whale-tier |
| ca6 | Void Engine 🕳 | ×3.0/stoned | Per Too Stoned member | 35 | Compounds with Black Candle |

**Boss loot mults (8):** Limbo's Echo, Love Letter, Endless Hunger, Golden Tooth, Berserker's Rage, Heretic's Brand, The Blade, Mask of Lies. **These stay as-is** — they're rewards for boss kills, not shop picks.

**Utility artifacts (6) — NON-multiplier:**

| ID | Name | Effect | Cost | Verdict |
|---|---|---|---|---|
| a3 | The Evil Eye 🧿 | First card 0 Embers | 20 | **MOVE TO PEDAL** — economy effect, doesn't fit "payout" framing |
| a4 | Roadie's Toolbelt 🧰 | Random member Stonewall | 6 | **MOVE TO PEDAL** — defensive enabler |
| a7 | Serpent's Kiss 🐍 | +1 max Ember | 18 | **MOVE TO PEDAL** — economy effect |
| a8 | Stone Tablet 🪨 | +3 max HP all members | 12 | **MOVE TO PEDAL** — defensive enabler |
| ca2 | Hellfire Amulet 🔮 | +2 Embers each fight | 17 | **MOVE TO PEDAL** — economy effect |
| ca3 | Sabbath Crown 👑 | Too Stoned revive 50% | 22 | **MOVE TO PEDAL** — defensive |
| ca4 | Wailing Guitar 🎸 | First Strike ×2 | 16 | **KEEP AS ARTIFACT** — it's a one-shot multiplier |
| wardrums | War Drums 🪘 | +1 Strike per fight | 30 | **MOVE TO PEDAL** — structural enabler |

**Verdict:** 7 artifacts are misclassified — they're enablers wearing artifact clothes. Move them to the pedal pool.

### Existing Pedals (10 total — all utility)

| ID | Name | Effect | Cost | Verdict |
|---|---|---|---|---|
| p1 | Power Chord ⚡ | +1 Ember fight start | 6 | **KEEP** — clean enabler |
| p2 | Roadie Crew 🔧 | Heal 3 HP random | 8 | **KEEP** — defensive enabler |
| p3 | Merch Table 👕 | +2 Stash on victory | 6 | **KEEP** — economy enabler |
| p4 | Feedback Hum 🔊 | EMBER cards +1 ember | 10 | **KEEP** — strong combo enabler |
| p5 | Amp Stack 📻 | Sound Wall +2, Heavy Riff cap +5 | 10 | **KEEP** — card-specific buff |
| p6 | Cult Following 🕯 | +3 Stash per stoned | 10 | **KEEP** — synergy with Black Candle build |
| p7 | Guitar Tech 🎛 | Battle Cry +2 instead of +1 | 8 | **KEEP** — card-specific buff |
| p8 | Green Room 🛋 | All members Stonewall | 16 | **KEEP** — strong defensive enabler |
| p9 | Heavy Rotation 🎚 | Duplicate cards trigger draw | 10 | **KEEP** — combo enabler |
| p10 | Stage Fright Reversal 🎙 | First Strike +10 dmg | 14 | **KEEP** — minor enabler |

**Verdict:** All 10 existing pedals are real enablers. Pool stays.

---

## Post-Audit Pool Counts

### After Reorganization (no new content yet)

- **Artifacts (multiplier-only):** `12 mult + 1 keep (Wailing Guitar) = 13` (was 18 mixed)
- **Pedals (enablers):** `10 existing + 7 reclassified = 17` (was 10)

The pool is already healthier just from reclassification. Now we add new content.

---

## NEW DESIGN — 8 New Artifacts

All multiplier-producing. Designed for combo synergy. Math sketches assume realistic stacked builds.

### Common Tier (drop weight: 50%)

| # | Name | Mult | Trigger | Cost | Realistic Stack |
|---|---|---|---|---|---|
| 1 | **Distortion Cab 🔊** | ×1.25 | Always-on | 12 | Always-on filler ×1.25 |
| 2 | **Crowd Surfer 🤘** | ×1.2/member | Per alive non-stoned member | 14 | 4 alive = ×2.07 |

### Uncommon Tier (drop weight: 30%)

| # | Name | Mult | Trigger | Cost | Realistic Stack |
|---|---|---|---|---|---|
| 3 | **Pentagram Shrine 🜏** | ×1.4/CORRUPT | Per CORRUPT card played this strike | 22 | 4 corrupt = ×3.84 |
| 4 | **Doom Choir 🎵** | ×1.6/role | Per same-role member on stage | 28 | 3 same role = ×2.56 |
| 5 | **Solo Sermon 🎤** | ×6.0 | Exactly 2 cards played this strike | 26 | Hit it = ×6.0 |

### Rare Tier (drop weight: 17%)

| # | Name | Mult | Trigger | Cost | Realistic Stack |
|---|---|---|---|---|---|
| 6 | **The Doom Crown 👑** | ×8.0 | All cards played this strike are SAME TYPE | 38 | Type-pure = ×8.0 |
| 7 | **Triple Sixes ⛧⛧⛧** | ×3.0/other artifact | Per OTHER artifact equipped | 35 | 2 others = ×9.0 |
| 8 | **Lucifer's Pact 😈** | ×4.0 | Lucifer is on stage | 40 | Lucifer-band = ×4.0 |

### Mythic Tier (drop weight: 3%)

| # | Name | Mult | Trigger | Cost | Realistic Stack |
|---|---|---|---|---|---|
| 9 | **The Inverted Cross ✟** | ×69.0 | 100% corruption AND no member stoned | 50 | The whale |

(That's 9 new artifacts, not 8 — added Distortion Cab as a "always on" common because we currently have NO common-tier mult. Without it the lowest-mult tier doesn't exist and shops feel binary "rare or nothing.")

### Pool After New Content

- **Common mult artifacts:** 4 (Vintage Guitar, Resonance Coil, Distortion Cab, Crowd Surfer)
- **Uncommon mult:** 5 (Devil's Tuning Fork, Haunted Radio, Black Candle, Pentagram Shrine, Doom Choir, Solo Sermon)
- **Rare mult:** 5 (Burning Stage, Goat of Mendes, Hellmouth, Void Engine, Wailing Guitar, Doom Crown, Triple Sixes, Lucifer's Pact)
- **Mythic mult:** 1 (Inverted Cross)

Total artifact pool: **22 mult artifacts** (was 12).

---

## NEW DESIGN — 6 New Pedals

All enablers — they unlock the conditions artifacts demand. NO multipliers in the pedal pool.

### Common Tier

| # | Name | Effect | Cost | Enables |
|---|---|---|---|---|
| 1 | **Reverb Tank 〰️** | Card mastery progress doubled this run | 10 | Long-term progression |
| 2 | **Clean Boost 🎚** | First card each Strike costs 1 less Ember (min 0) | 12 | Card-spam builds |

### Uncommon Tier

| # | Name | Effect | Cost | Enables |
|---|---|---|---|---|
| 3 | **Wah Pedal 🦶** | Discarding a card draws 1 immediately | 14 | Hand-cycling, dupe mining |
| 4 | **Phaser 🌊** | All CORRUPT cards cost 1 less Ember | 16 | Corruption builds |
| 5 | **Compressor 📊** | If you play 4+ cards in a Strike, draw 1 next Strike | 14 | 6-card builds |

### Rare Tier

| # | Name | Effect | Cost | Enables |
|---|---|---|---|---|
| 6 | **The Looper ♾️** | First card each Strike is replayed at end of Strike (free) | 25 | Combo doubling |

### Pool After Reorganization + New

- **From audit (reclassified from artifacts):** 7
  - The Evil Eye, Roadie's Toolbelt, Serpent's Kiss, Stone Tablet, Hellfire Amulet, Sabbath Crown, War Drums
- **Existing pedals:** 10 (P1-P10)
- **New pedals:** 6
- **Total:** **23 pedals** (was 10)

---

## SHOP DROP RATES

### Per Slot (each shop slot rolls independently)

| Rarity | Drop weight |
|---|---|
| Common | 50% |
| Uncommon | 30% |
| Rare | 17% |
| Mythic | 3% |

### Slot Mix in a Typical Shop

Shops show 5-7 items currently. With separate artifact + pedal pools rolling independently:
- ~3-4 cards (existing card pool, separate rarity)
- ~1-2 artifacts (new weighted rolls)
- ~1-2 pedals (new weighted rolls)

A typical shop visit shows you maybe 1 mult artifact + 1 enabler pedal. Across the 4-5 shops in a run, you'll see roughly 5-8 modifier picks total — enough to fill your 5 slots and have meaningful choice.

---

## EXAMPLE COMBOS — THE DOPAMINE CHECK

### Combo A: "Six Card Burner" (Mid-Run Achievable)

**Build conditions:** Play all 6 cards every strike. Type-pure (all RIFF).

**Modifiers:**
- Artifact: Burning Stage (×3.0 all 6 cards)
- Artifact: Vintage Guitar (×1.3 if 4+ cards)
- Artifact: Doom Crown (×8.0 if all same type)
- Pedal: Compressor (4+ cards → draw 1 next strike)
- Pedal: The Looper (first card replays free at end)

**Math:**
- Existing strike mult ~×3 (cards + chains)
- Burning Stage ×3
- Vintage Guitar ×1.3
- Doom Crown ×8
- Goat of Mendes (if owned) ×1.5
- = **×140 to ×210** depending on extras

Times ~50 base damage = **7,000-10,500 damage per strike.** Solid mid-run.

### Combo B: "Corruption Cathedral" (Late-Run Build)

**Build conditions:** Hit 100% corruption fast, never let anyone get stoned.

**Modifiers:**
- Artifact: Hellmouth Amplifier (×5.0 at 80%+ corr)
- Artifact: Pentagram Shrine (×1.4 per CORRUPT card)
- Artifact: Inverted Cross (×69.0 if 100% corr + no stoned)
- Pedal: Phaser (CORRUPT cards cost -1)
- Pedal: Devil's Tuning Fork (start at 15% corr) [reclassified pedal]

**Math:**
- Strike mult ~×3
- Hellmouth ×5
- Pentagram Shrine ×1.4^4 = ×3.84 (4 CORRUPT cards)
- Inverted Cross ×69
- = **×3,978**

Times ~50 base = **~199,000 damage per strike.** 🤘 Whale tier achieved.

### Combo C: "All Same Role" (Niche Specialist)

**Build conditions:** Recruit 3+ same-role musicians. Run a focused band.

**Modifiers:**
- Artifact: Doom Choir (×1.6 per same-role member)
- Artifact: Crowd Surfer (×1.2 per alive member)
- Artifact: Triple Sixes (×3 per other artifact)
- Pedal: Roadie Crew (heal 3 HP random) [keep alive]
- Pedal: Green Room (all members Stonewall) [keep alive]

**Math (4 same-role, all alive):**
- Strike mult ~×3
- Doom Choir ×1.6^4 = ×6.55
- Crowd Surfer ×1.2^4 = ×2.07
- Triple Sixes ×3^2 = ×9
- = **×366**

Times ~50 base = **~18,300 damage per strike.** Build-specific dopamine.

### Combo D: "Solo Sniper" (Anti-Meta Counter)

**Build conditions:** Play exactly 2 cards per strike. Surgical strikes.

**Modifiers:**
- Artifact: Solo Sermon (×6 if exactly 2 cards)
- Artifact: The Blade (×3 if exactly 1 card) — wait this conflicts. Pick one.
- Artifact: Goat of Mendes (×1.5 always)
- Pedal: Power Chord (+1 ember fight start)
- Pedal: Heavy Rotation (dupe cards trigger draw)

**Math:**
- Strike mult ~×2 (only 2 cards = ×1.05^2 = 1.10, plus chain if hit)
- Solo Sermon ×6
- Goat ×1.5
- = **~×20**

Times ~50 base = **~1,000 damage per strike.** Lower ceiling than card-spam, but very efficient ember use.

---

## OPEN DESIGN QUESTIONS — BEFORE IMPLEMENTATION

Things I want JV to confirm before I touch code:

### Q1. Are the reclassifications correct?
Moving 7 artifacts to pedals is a bigger change than adding new content. Are these the right calls?
- The Evil Eye (first card 0 embers) → pedal ✅ economy effect
- Roadie's Toolbelt (random Stonewall) → pedal ✅ defensive
- Serpent's Kiss (+1 max ember) → pedal ✅ economy
- Stone Tablet (+3 max HP) → pedal ✅ defensive structural
- Hellfire Amulet (+2 embers fight start) → pedal ✅ economy
- Sabbath Crown (Too Stoned revive) → pedal ✅ defensive
- War Drums (+1 Strike) → pedal ✅ structural

These all feel like enablers, not payouts. **Confirm or push back.**

### Q2. Is "Distortion Cab" (always-on ×1.25) needed?
We currently have 0 common-tier artifact mults. Without one, common-tier shop rolls produce only utility (now relocated to pedals) — meaning the artifact-rarity drop tiers are heavy on uncommon/rare. Distortion Cab fills the slot. **Or do you want common tier to skip — make rolls auto-bump uncommon if no common is available?**

### Q3. The Doom Crown ×8 if same type — is this too easy?
A pure-RIFF deck of 4 cards would trivially hit ×8 every strike. Maybe "if 5+ cards played this strike AND all same type" — harder condition for the big payout?

### Q4. Triple Sixes ×3 per OTHER artifact — interactions
At max 3 artifacts equipped, Triple Sixes + 2 others = ×9 always-on. That's massive. Pair with Hellmouth (×5) and Goat (×1.5) and you're at ×67 just from artifacts before any conditional triggers fire. Is this the intended ceiling for "lucky 3-artifact pulls"?

### Q5. Should pedals get their own multiplier sources eventually?
You said no in the framing question, but I want to flag: leaving pedals as pure utility means they can never be the "I had a great pedal pull" moment. It's always artifacts that are the dopamine. **Is that fine? Or do we want at least 1-2 pedals that produce mults to spice the pool?**

### Q6. Mythic at 3% drop rate — is this too rare or too common?
Across a 27-fight run with ~5 shops, expect ~25-35 modifier rolls. At 3% mythic that's 0.75-1.05 mythic appearances per run on average. Do most runs see 1 mythic? Or should mythics be rarer (1%) so seeing one feels EVENTFUL?

### Q7. Where does Wailing Guitar fit?
Currently a Circle artifact, ×2 first strike each fight. It's a multiplier so it stays artifact-class. But it's NOT a per-strike mult — it's once-per-fight. **Should it be reclassified as Common/Uncommon since its ceiling is fundamentally lower than the others?**

### Q8. Boss loot artifacts — leave them?
Limbo's Echo, Love Letter, Endless Hunger, etc. are reward-only mults dropped after specific bosses. They're already multipliers and feel like artifacts. Leave as-is or pull into the redesigned pool?

---

## IMPLEMENTATION PLAN (ONLY AFTER ABOVE QUESTIONS ANSWERED)

Once design is locked, the work has 6 phases that ship as one big atomic commit:

1. **Pool reorg.** Move 7 artifacts to STARTER_PASSIVES. Update STARTER_ARTIFACTS to mult-only. Add `rarity` field to all entries.
2. **New artifact data.** Add 9 new mult artifacts to STARTER_ARTIFACTS (or split common/uncommon into STARTER_ARTIFACTS, rare/mythic into a new tier).
3. **New pedal data.** Add 6 new pedals to STARTER_PASSIVES.
4. **Trigger logic.** Wire new `multTrigger` types in 3 strike-resolution sites:
   - `perCorruptCard`, `perAliveMember`, `allSameType`, `cards2exact`, `perOtherArtifact`, `luciferOnStage`, `perSameRole`, `corruptedClean`, `alwaysOn`
5. **Shop generator update.** Use weighted rarity rolls. Implement boss-kill discount on next shop.
6. **Sim engine port.** Mirror new triggers and pedal effects in `vestibule-sim-kwstacks.js`. Run 25K-game sim across all 5 decks. Tune.

Estimated scope: **+800-1200 lines** in App.jsx, +400-600 in sim engine, +200 in shop logic.

Risk: this is a one-way door commit. Save format changes (artifacts moved to pedal pool break old saves loading). **Bump save version, invalidate old saves on this commit.**

---

## SUCCESS CRITERIA

After this redesign ships, a player should be able to:

1. ✅ Achieve ×100+ multipliers in a typical mid-run with 2-3 lucky picks
2. ✅ Achieve ×1000+ multipliers in late-run with build commitment
3. ✅ Achieve ×5000+ multipliers when the whale (Inverted Cross) lands
4. ✅ Feel that pedal picks are MEANINGFUL (not just "+1 ember boring")
5. ✅ Feel that artifact picks are MEMORABLE (each one changes how you play)
6. ✅ See a clear difference between the 4 rarity tiers in shop
7. ✅ Have viable build paths: Card Spam, Corruption, Stoned, Same-Role, Solo, Lucifer-Band

If any of these fail in playtest, we iterate the numbers, not the framing.

---

**END OF DESIGN DOC.** Ready for JV review.
