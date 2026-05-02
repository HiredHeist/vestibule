# Vestibule — Artifact + Pedal Content Pool

**Status:** DRAFT — JV review pending
**Date:** May 2 2026
**Purpose:** Concrete content list. 25 artifacts + 15 pedals with full mechanical specs.

**Framing (locked):**
- **Artifacts payout** — damage multipliers + score enhancers
- **Pedals enable** — strategy unlocks, economy, structural changes
- **3 artifact slots + 2 pedal slots = 5 modifier slots total**

---

## Existing Pool (for reference — what we already have)

**Multiplier artifacts to keep (carry forward):**

| ID | Name | Mult | Trigger |
|---|---|---|---|
| a1 | Vintage Guitar 🎸 | ×1.3 | 4+ cards played |
| a2 | Devil's Tuning Fork 🔱 | ×1.5 | Corruption ≥60% |
| a5 | Haunted Radio 📻 | ×1.2/chain | Per Riff Chain |
| a6 | Black Candle 🕯 | ×1.4/stoned | Per Too Stoned member |
| a9 | Resonance Coil ⚙️ | ×1.15/dupe | Per duplicate in hand |
| a10 | Burning Stage 🔥 | ×3.0 | All 6 cards played |
| ca1 | Goat of Mendes 🐐 | ×1.5 | Always |
| ca4 | Wailing Guitar 🎸 | ×2.0 | First Strike each fight |
| ca5 | Hellmouth Amplifier 🌋 | ×5.0 | Corruption ≥80% |
| ca6 | Void Engine 🕳 | ×3.0/stoned | Per Too Stoned member |

**That's 10 mult artifacts existing. Adding 25 NEW = 35 total mult artifacts in pool.**

**Existing pedals to keep:** P1-P10 (10 utility pedals). Adding 15 NEW = 25 total pedals.

---

# 🜏 NEW ARTIFACTS — 25 TOTAL

All produce damage multipliers OR score multipliers. Designed for combo synergy with each other and with pedals.

## ⚪ COMMON TIER (12 artifacts) — drop weight 50%

Cost range: 8–18 herb. Multipliers: ×1.15–×1.5 typically. Score bumps: +5%–+15%.

| # | Name | Effect | Cost | Mechanic | Synergy |
|---|---|---|---|---|---|
| 1 | **Cracked Pickup 🎤** | ×1.2 damage if you played a RIFF this strike | 10 | conditional `playedRiff` | Riff-heavy decks |
| 2 | **Distortion Cab 🔊** | ×1.25 damage always | 14 | `alwaysOn` | Combos with everything |
| 3 | **Ash Tray 🚬** | ×1.3 damage if any member is Too Stoned | 12 | `anyStoned` | Stoned builds |
| 4 | **Crowd Noise 🤘** | ×1.15 per alive non-stoned member | 14 | `perAliveMember` | Full bands |
| 5 | **Tape Hiss 📼** | ×1.2 if you DIDN'T play any RIFF this strike | 8 | `noRiff` | EMBER/CORRUPT decks |
| 6 | **Cheap Beer 🍺** | ×1.15, +5% run score | 10 | `alwaysOn` + scoreBump | Score chasers |
| 7 | **Set List 📋** | ×1.4 if first card played was an EMBER type | 12 | `firstCardEmber` | Resource builds |
| 8 | **Gaffer Tape 🩹** | ×1.2 if no member is below half HP | 10 | `allHealthy` | Defensive players |
| 9 | **Power Strip ⚡** | ×1.25 if you have 5+ Embers when you Strike | 11 | `embers5` | Late-strike builds |
| 10 | **Spit Cup 🥃** | ×1.5 damage if you discarded ≥1 card this fight | 10 | `discarded` | Hand-cycling |
| 11 | **Tour Sticker 🎟** | +10% run score | 8 | scoreBump only | Pure score |
| 12 | **Dive Bar Sign 🍻** | ×1.2 in Circles I-III only | 9 | `earlyCircle` | Early run boost |

## 🟡 UNCOMMON TIER (8 artifacts) — drop weight 30%

Cost range: 18–32 herb. Multipliers: ×1.5–×3.0 conditional, or smaller compounding. Score bumps: +15%–+25%.

| # | Name | Effect | Cost | Mechanic | Synergy |
|---|---|---|---|---|---|
| 13 | **Pentagram Shrine 🜏** | ×1.4 per CORRUPT card played this strike | 22 | `perCorruptCard` (compound) | CORRUPT decks → ×3.84 at 4 corrupt cards |
| 14 | **Doom Choir 🎵** | ×1.5 per same-role member on stage | 24 | `perSameRole` (compound) | Pure-role bands → ×5.06 at 4 same-role |
| 15 | **Solo Sermon 🎤** | ×6 if EXACTLY 2 cards played this strike | 26 | `cards2exact` | Sniper builds |
| 16 | **Black Mass Bell 🔔** | ×2.5 if 3+ Riff Chains fired this strike | 22 | `chains3` | Chain decks |
| 17 | **Ouroboros Pin 🐍** | ×1.3 per discarded card (multiplicative) | 20 | `perDiscard` | Wah Pedal combo |
| 18 | **Drummer's Stick 🥁** | ×2.5 if your Drummer rolled DOUBLE TIME this fight | 22 | `doubleTimeRolled` | Drummer-dependent |
| 19 | **Fog Machine 💨** | ×1.4 per stoned member, score +20% per stoned | 24 | `perStonedScore` | Stoned + score combo |
| 20 | **Chrome Skull 💀** | ×3 if exactly 1 member is alive at strike time | 28 | `lastMemberStanding` | Death-spiral comeback |

## 🟠 RARE TIER (5 artifacts) — drop weight 17%

Cost range: 32–50 herb. Multipliers: ×3.0–×8.0. Score bumps: +25%–+40%. Build-defining picks.

| # | Name | Effect | Cost | Mechanic | Synergy |
|---|---|---|---|---|---|
| 21 | **The Doom Crown 👑** | ×8 if all cards played this strike are SAME TYPE (min 3 cards) | 38 | `allSameType` (min 3) | Type-pure decks |
| 22 | **Triple Sixes ⛧⛧⛧** | ×3 per OTHER artifact equipped | 35 | `perOtherArtifact` | Caps at ×9 with 3-slot limit |
| 23 | **Lucifer's Pact 😈** | ×4 if Lucifer is on stage. Run score ×1.3 | 40 | `luciferOnStage` + scoreMult | Lucifer band-member |
| 24 | **Inverted Pentacle ⛧** | ×5 if Corruption is exactly 100% (no over, no under) | 36 | `corrupt100exact` | Corruption peak |
| 25 | **The Black Goat 🐐** | ×1.5 always × ×1.5 per artifact owned. Compounds with Goat of Mendes (stacks!) | 42 | `goatStack` | Hyper-mult builds |

---

# 🎛 NEW PEDALS — 15 TOTAL

All enablers. NO multipliers. Their power = unlocking the conditions artifacts demand.

## ⚪ COMMON TIER (8 pedals) — drop weight 50%

Cost range: 8–16 herb.

| # | Name | Effect | Cost | Enables |
|---|---|---|---|---|
| 1 | **Reverb Tank 〰️** | First card you play each Strike costs 1 less Ember (min 0) | 12 | Card spam, Burning Stage, Solo Sermon |
| 2 | **Fuzz Box 🌫** | All RIFF cards cost 1 less Ember | 14 | Riff-heavy decks → Cracked Pickup, Vintage Guitar |
| 3 | **Tuner Pedal 🎯** | Discarding a card draws 1 immediately | 12 | Wah-style hand cycling → Ouroboros Pin, Spit Cup |
| 4 | **Wah Pedal 🦶** | First CORRUPT card each fight costs 0 Embers | 12 | CORRUPT decks → Pentagram Shrine, Devil's Tuning Fork |
| 5 | **Volume Knob 🔆** | If you played 4+ cards last Strike, draw 1 extra next Strike | 11 | Card-spam consistency → Burning Stage, Vintage Guitar |
| 6 | **Power Conditioner 🔌** | Start each fight with +1 Ember | 10 | All builds, especially fast-Strike |
| 7 | **Cable Tester 🪡** | Duplicate cards cost 1 less Ember | 12 | Resonance Coil combo |
| 8 | **Drum Throne 🪑** | Drummer rolls d6 twice and picks higher result | 14 | Drummer's Stick, DOUBLE TIME chase |

## 🟡 UNCOMMON TIER (4 pedals) — drop weight 30%

Cost range: 16–24 herb.

| # | Name | Effect | Cost | Enables |
|---|---|---|---|---|
| 9 | **Phaser 🌊** | All CORRUPT cards cost 1 less Ember | 18 | Corruption builds → Hellmouth, Pentagram, Inverted Pentacle |
| 10 | **Compressor 📊** | If you play 4+ cards in a Strike, draw 1 next Strike AND gain 1 Ember | 18 | Combo lock-in for 6-card builds |
| 11 | **Octave Pedal 🎼** | First Riff Chain each fight fires twice (double mult) | 22 | Chain stack → Black Mass Bell, Haunted Radio |
| 12 | **Sustain Pedal 🦶** | Buffs from temp ATK cards last 1 extra Strike | 20 | ATK-buff stacking decks |

## 🟠 RARE TIER (3 pedals) — drop weight 17%

Cost range: 24–32 herb. These are build-locking picks.

| # | Name | Effect | Cost | Enables |
|---|---|---|---|---|
| 13 | **The Looper ♾️** | First card each Strike replays at end of Strike (free) | 28 | Effectively +1 free card → 6-card combos easier |
| 14 | **Bit Crusher 💥** | Each card you discard gives +5% Corruption | 26 | Corruption rocket → Hellmouth, Inverted Pentacle |
| 15 | **Echoplex 🎚** | When you play a card, 25% chance it triggers a second time at end of Strike (free) | 30 | Random combo extension → Doom Crown, Pentagram Shrine, Burning Stage |

---


---

# 💎 MYTHIC TIER — UNLOCKABLES (6 total)

These are NOT in the shop pool by default. Each is gated behind a specific in-game accomplishment. After unlock, they enter the mythic 3% drop rate (which itself scales with how many mythics you've unlocked).

## 🜏 Mythic Artifacts (3)

| # | Name | Effect | Unlock Condition |
|---|---|---|---|
| **M1** | **The Inverted Cross ✟** | ×69 damage if Corruption is exactly 100% AND no member is Too Stoned. Run score ×1.5. | Beat Lucifer for the first time |
| **M2** | **Tongue of the Devourer 👅** | Every card you play deals damage equal to your highest member's ATK. Stacks WITH all multipliers. | Beat Devourer (C3) without losing any band members |
| **M3** | **The Sigil of Set 𓂀** | First Strike of every fight automatically triggers as if all multiplier conditions are met (peak roll). One-shot per fight. | Win a Bronze run using only ONE band member |

## 🎛 Mythic Pedals (3)

| # | Name | Effect | Unlock Condition |
|---|---|---|---|
| **MP1** | **The Witch's Sabbath 🌑** | First card each Strike replays THREE times (Looper × Echoplex on steroids) | Win a fight with all 4 members Too Stoned at the end |
| **MP2** | **The Conduit ⚡** | Start each fight at MAX Embers. All cards cost half (rounded down) | Beat Lucifer in under 4 strikes |
| **MP3** | **Tablet of Az'Tothoth 📜** | First Riff Chain each fight permanently upgrades a random card for the rest of the run | Fire all 16 unique Riff Chains in a single run |

## Mythic Drop Rate (Scales With Unlocks)

| Unlocks Owned | Per-shop-slot Mythic Rate |
|---|---|
| 0 | 0% (auto-bumps to rare) |
| 1-2 | 1.5% |
| 3-4 | 2.0% |
| 5-6 | 3.0% |

Even at full unlock, mythic appears ~1× per run on average. They stay sacred.

## Implementation Requirements

1. **New stat tracking:** `bossesKilledNoLoss`, `luciferStrikeCount`, `chainsFiredThisRun`, `soloRunCompleted`, `allStonedFightWin`
2. **Unlock storage:** `localStorage['vst_mythic_unlocks']` — array of unlocked IDs
3. **Shop pool gate:** filter mythic rolls to only include unlocked entries
4. **Unlock event UI:** dramatic overlay on first-time trigger
5. **Trophies page:** show locked mythics as silhouettes with hint, revealed mythics with full effect

---

# Drop Rate Math

Per shop slot, weighted roll:
- Common 50% / Uncommon 30% / Rare 17% / Mythic 3%

Mythic tier currently has 0 entries in this draft (Inverted Cross was on the previous list — see Q below). I left mythic empty pending JV decision.

Across a typical run with ~5 shops × ~2 modifier slots per shop = **~10 modifier rolls.**
Expected per run:
- Common: ~5
- Uncommon: ~3
- Rare: ~1.7
- Mythic: ~0.3

That means most runs see 1-2 rare picks, and 1 in 3 runs sees a mythic.

---

# Combo Examples (sanity check)

## Combo A: "All-RIFF Type-Pure Sermon"
Build: All RIFF cards. Hit Doom Crown's same-type condition.

**Artifacts:**
- Doom Crown ×8 (same type)
- Cracked Pickup ×1.2 (played a RIFF)
- Vintage Guitar ×1.3 (4+ cards)

**Pedals:**
- Fuzz Box (all RIFFs -1 ember)
- The Looper (first card replays)

**Math:** 8 × 1.2 × 1.3 = ×12.48 from new artifacts alone. Times existing strike mult ~×3 = ×37. With Goat of Mendes ×1.5 added = ×56. Times 50 base = **2,800 damage strike.** Solid mid-run.

## Combo B: "Corruption Cathedral"
Build: Rocket corruption to 100%, weaponize.

**Artifacts:**
- Inverted Pentacle ×5 (exactly 100% corr)
- Pentagram Shrine ×1.4^4 = ×3.84 (4 CORRUPT)
- Hellmouth Amplifier ×5 (≥80% corr)

**Pedals:**
- Phaser (CORRUPT -1 ember)
- Bit Crusher (discard = +5% corr)

**Math:** 5 × 3.84 × 5 = ×96. Times strike mult ×3 = ×288. Times Goat ×1.5 = ×432. Times 50 base = **21,600 damage strike.** Whale tier without even owning Inverted Cross mythic.

## Combo C: "Triple Six Engine"
Build: 3 mult artifacts, ride the multiplier-of-multipliers.

**Artifacts:**
- Triple Sixes ×3 per other artifact = ×9 with full slots
- The Black Goat ×1.5 × ×1.5/artifact = ×3.375 with 3 artifacts
- Hellmouth ×5 (corruption-locked)

**Pedals:**
- Phaser, Bit Crusher

**Math:** 9 × 3.375 × 5 = ×151. With strike mult and existing Goat = ×680+. **34,000 damage.**

## Combo D: "Last Member Standing"
Build: Sacrifice members, ride the comeback artifact.

**Artifacts:**
- Chrome Skull ×3 (exactly 1 member alive)
- Solo Sermon ×6 (exactly 2 cards)
- Goat of Mendes ×1.5

**Pedals:**
- The Looper (free card replay), Power Conditioner (+1 ember)

**Math:** 3 × 6 × 1.5 = ×27 base. Strike mult ×2 (only 2 cards) = ×54. **2,700 per strike** but cheap to execute (only 2 cards used). High strikes-per-fight.

---

# 🚨 Open Questions for JV

## Q1. Mythic tier — RESOLVED
6 mythic unlockables added (3 artifacts + 3 pedals). All gated behind in-game accomplishments. See MYTHIC TIER section above.

## Q2. Score-enhancing artifacts — is this enough?
Currently 4 artifacts directly affect score (Cheap Beer, Tour Sticker, Lucifer's Pact, Fog Machine). The rest indirectly enhance score by enabling more damage. **Should there be a dedicated score-multiplier artifact category?**

## Q3. The Black Goat stacking with Goat of Mendes
Designed to multiply existing Goat. If you own both: damage = `× Goat 1.5 × BlackGoat (1.5 × 1.5^artifacts)`. With 3 artifacts that's `1.5 × 5.06 = ×7.6` from the Goat pair alone. **Is this intentionally over-the-top, or should they not stack?**

## Q4. Drum Throne (re-roll d6) — too strong?
Currently DOUBLE TIME (5-6 = ×2 dmg) is ~33% chance per fight. With Drum Throne, re-rolling makes it ~55% chance. Combined with Drummer's Stick (×2.5 if rolled DT), this is a 55%-likely ×2.5 mult on 22 herb. **Probably fine but flagging.**

## Q5. Tape Hiss (×1.2 if NO RIFF) — niche?
Designed for CORRUPT/EMBER-only decks. Most players play SOME riffs. Is this too niche to be common-tier?

## Q6. Dive Bar Sign (Circles I-III only) — front-loaded?
Cheap and powerful early, dead later. Common tier feels right. Is the limit annoying?

## Q7. Echoplex 25% replay chance
Replaces Whammy Bar after JV feedback. 25% per card means avg 1.5 replays in a 6-card strike. Feels right for legendary tape-delay flavor (Eddie Van Halen, Page, May). **Tune % up if too rare, down if too consistent.**

## Q8. Should I draft 5 mythic-tier slots so the 3% drop rate has content?
With 0 mythics drafted, mythic rolls auto-bump to rare. That's fine but means players never see "MYTHIC ARTIFACT" in shop. **Want me to draft 3-5 mythics?**

---

# Implementation Cost Estimate

If approved as-is:
- **Data definitions:** ~120 lines (25 artifacts + 15 pedals)
- **New triggers wired in 3 sites:** ~80 lines per site × 3 = ~240 lines
- **Shop generator weighted rolls:** ~40 lines
- **Pedal effect implementations** (Reverb Tank, Tuner Pedal, etc): ~150 lines
- **Sim engine port:** ~200 lines (only multiplier triggers — pedals are skip-able for sim accuracy)
- **Total: ~750 lines** of careful implementation work

Save format change: `vst_save` → `vst_save_v3` (invalidate old saves).

Ship plan: ONE atomic commit `feat(modifiers): 25 artifacts + 15 pedals — Balatro-tier combo engine`

---

**END OF DRAFT — JV REVIEW PENDING**
