# Modifier Interaction Analysis — Pre-Implementation Risk Audit

**Status:** Risk audit before code. JV directive: analyze interactions, find crazy things, decide fix-vs-embrace per case.
**Date:** May 2 2026

---

## The High-Stakes Interaction Map

Two systems combining in dangerous ways:

1. **Echoplex 69%** — every card play has 69% chance to retrigger at end of strike, firing ALL effects (including permanent buffs, per JV decision).
2. **Multiplicative Joker artifacts** — Pentagram Shrine ×1.4/CORRUPT, Triple Sixes ×3/other artifact, Inverted Cross ×69, Doom Crown ×8 same-type, etc.

The danger zones are where Echoplex stacks with permanent-buff cards, or where multiplier compounding hits exponential surfaces.

---

## ⚠️ CATASTROPHIC INTERACTIONS

### 🔥 HOT BUG #1 — Echoplex × Battle Cry (Permanent ATK Inflation)

**Interaction:** Battle Cry gives +1 (or +2 with Guitar Tech pedal) ATK PERMANENTLY. Echoplex retriggers it 69% of the time.

**Math over a fight (4 strikes, 1 Battle Cry per strike):**
- Without Echoplex: +1 ATK × 4 strikes = +4 ATK by fight end
- With Echoplex: +1 × (1 + 0.69) × 4 = +6.76 ATK per fight expected
- **With Guitar Tech + Echoplex: +2 × 1.69 × 4 = +13.5 ATK per fight expected**

Over a 27-fight run with Battle Cry every strike: members reach **+90 to +180 base ATK** by run end. That's...actually fine? It's a build that EARNS the absurdity. But:

**The real risk:** Battle Cry has **4 copies in the deck**. If you draw 2-3 Battle Crys per strike, it's `0.69 × 0.69 × 0.69 = 33%` chance of all retriggering. Member gets +6 ATK in ONE strike. Over 4 strikes = +24 ATK. By strike 4 of fight 1, your bassist has 28 ATK.

**Verdict: EMBRACE.** This is exactly the dopamine. The build commits to drafting Battle Crys and Echoplex, the payoff is a god-tier band by mid-run. Balatro has Triboulet doing similar things to face cards.

**Implementation note:** No special handling needed. Echoplex retriggers run through `playCard` again, which already handles permanent buffs correctly via setStage updates.

---

### 🔥 HOT BUG #2 — Echoplex × Doom Crown "Same Type" Check

**Interaction:** Doom Crown ×8 if all cards played this strike are SAME TYPE. Echoplex retriggers fire AT END of strike. Does the retriggered card count toward "all same type"?

**Scenarios:**

**A. Retriggers count:**
- Play 4 RIFF cards. Echoplex retriggers ~2.76 of them (still RIFF). Doom Crown sees 6.76 RIFF plays. Same type = ✅ ×8.
- Play 3 RIFF + 1 CORRUPT. Echoplex retriggers fire. The CORRUPT retriggers as CORRUPT. Now you have RIFF×4 + CORRUPT×2 mixed types = ❌ ×8 doesn't fire.
- **Problem:** Echoplex actively *threatens* the Doom Crown player who plays mixed types. Pure type players are fine.

**B. Retriggers don't count:**
- Same-type check only counts ORIGINAL plays. Echoplex retriggers are "echoes," not "plays."
- Doom Crown player has consistent same-type guarantees. Echoplex is a free combo extension.
- **Better for design clarity.** Echoplex doesn't sabotage builds.

**Verdict: FIX — Retriggers do NOT count toward "same type" check or "exactly N cards played" checks.** The trigger needs an `_isEchoplex` flag.

**Implementation:** When Echoplex fires a retrigger, mark the play as `_echoplexRetrigger:true`. Doom Crown's `allSameType` check ignores retriggers. Solo Sermon's "exactly 2 cards" check ignores retriggers. Burning Stage's "all 6 cards played" check **DOES** count retriggers (since it's about volume, not purity). Same for Vintage Guitar (4+ cards).

**Decision tree per artifact:**
| Artifact | Counts Retriggers? | Reason |
|---|---|---|
| Doom Crown | ❌ No | "Same type" purity check |
| Solo Sermon | ❌ No | "Exactly 2 cards" requires precision |
| Burning Stage | ✅ Yes | "All 6 cards" is volume |
| Vintage Guitar | ✅ Yes | "4+ cards" is volume |
| Pentagram Shrine | ✅ Yes | Per-CORRUPT-card stacks (echoplex'd CORRUPT counts) |
| Cracked Pickup | ✅ Yes | "Played a RIFF" — retrigger plays one |
| Black Mass Bell | ✅ Yes | "3+ chains" — chains can fire on retriggers |
| Ouroboros Pin | N/A | Per-discard, not per-play |

---

### 🔥 HOT BUG #3 — Echoplex × Soul Bargain (Self-Damage)

**Interaction:** Soul Bargain gives +5 ATK and -3 HP. Echoplex retriggers it. Member takes -6 HP total (potentially fatal), but gains +10 ATK.

**Math:** Over a 4-strike fight playing 1 Soul Bargain per strike:
- Without Echoplex: -12 HP, +20 ATK
- With Echoplex: -20 HP expected, +33 ATK expected
- A 9-HP member will be Too Stoned by strike 2 from the HP cost alone

**Verdict: EMBRACE WITH WARNING.** Soul Bargain is a calculated risk card. Players who draft Echoplex + Soul Bargain understand they're trading HP for ATK. The Too Stoned outcome is part of the calculus. **However: I should make sure Echoplex retriggers DON'T fire if the member would die from the retrigger** — that's a feel-bad bug, not gameplay.

**Implementation:** Before applying retrigger HP cost, check if member is alive. If retrigger would kill them, fire the +ATK buff but skip the HP damage. Or: skip retrigger entirely for fatal cards. Lean toward **"retrigger fires but member protected from death"** — feels more generous and Balatro-y.

Actually, this gets complicated — what about Blood Ritual that sacrifices 25% HP for damage? If the original play killed them, Echoplex retrigger is moot. If a 4-HP member at 16HP plays Blood Ritual (-4 HP) and Echoplex retriggers (-3 more HP), they survive. **Best rule: Echoplex retriggers obey the same death rules as original plays. If a play would kill, it kills.** This is consistent and predictable.

**Decision: KEEP IT BRUTAL.** Soul Bargain + Echoplex can absolutely TKO your bassist. That's the game.

---

### 🔥 HOT BUG #4 — Triple Sixes × Black Goat (Multiplier Compounding)

**Interaction:**
- Triple Sixes: ×3 per OTHER artifact equipped (max 3 slots = ×9 with full)
- Black Goat: ×1.5 always × ×1.5 per artifact owned. With 3 artifacts owned (counting itself? or just others?), and STACKS with Goat of Mendes ×1.5

**Worst case:** 3 artifact slots filled with Triple Sixes, Black Goat, Goat of Mendes:
- Triple Sixes ×9 (2 other artifacts)
- Black Goat: ×1.5 × ×1.5^3 (3 artifacts owned including itself) = ×1.5 × ×3.375 = ×5.06
- Goat of Mendes ×1.5

**Combined:** 9 × 5.06 × 1.5 = **×68.4 ALWAYS-ON before any other multipliers**

Add Hellmouth (×5 at 80% corr) and existing strike mult (×3) and you're at **×1,026 base damage** with ZERO conditional triggers. With ×50 base damage that's 51,000 dmg/strike.

**Verdict: TUNE.** This is too much always-on power. The fix: **Black Goat counts ONLY OTHER artifacts (not itself)**, and the per-artifact mult drops from ×1.5 to ×1.3 to keep stacking interesting but not exponential.

**Revised Black Goat:** ×1.5 always × ×1.3 per OTHER artifact owned. With 2 others = ×1.5 × ×1.69 = ×2.54. Combined with Triple Sixes ×9 = ×22.9. Plus Goat ×1.5 = ×34. Plus Hellmouth ×5 = ×170. Plus strike ×3 = ×510. Times 50 = **25,500 dmg.**

That's still *plenty* dopamine for a build that fills all 3 slots with mult artifacts and hits 80% corruption. **Big numbers without breaking the game.**

**OR: Cut Black Goat entirely and replace with something more interesting.** I'll flag this for JV decision.

---

### 🔥 HOT BUG #5 — Inverted Cross × Existing Build Stacks

**Interaction:** Inverted Cross ×69 if Corruption is exactly 100% AND no member is Too Stoned. Mythic.

**Scenario:** Player builds full corruption deck. Has Inverted Cross (mythic). At 100% corruption, no stoned members. Stack with everything else:

- Inverted Cross ×69
- Hellmouth Amplifier ×5 (≥80% corr)
- Inverted Pentacle ×5 (exactly 100% corr) [new rare]
- Pentagram Shrine ×1.4^4 = ×3.84 (4 CORRUPT cards played)
- Goat of Mendes ×1.5
- Triple Sixes ×9 (full slots)
- Strike mult ×3 (cards + chains)

**Combined:** 69 × 5 × 5 × 3.84 × 1.5 × 9 × 3 = **×268,704**

Times ×50 base damage = **13,435,200 damage in ONE strike.**

**This is technically the dopamine peak we wanted.** But it's also: 13 million damage to a Lucifer with 70K HP. Massive overkill. Numbers explode beyond meaningful comparison.

**Verdict: ADJUST. Two options:**

**Option A — Cap multipliers at a sensible ceiling.** Hard cap at ×1000 multiplier. Anything beyond rounds down. Players still see ×1000 and feel powerful, but numbers don't blur.

**Option B — Soft-cap with diminishing returns past ×500.** Each additional multiplier above ×500 contributes only 50% of its value. Beyond ×1000 only 25%. Smooths the explosion.

**Option C — Embrace it. The dopamine is the dopamine.** 13M damage that one-shots Lucifer is RAD. Players will WANT to recreate that moment.

**Decision: OPTION C with display formatting.** Big numbers are the goal. But add: damage display should show `1.2M` instead of `1,200,000` for >999,999. And `13.4M` instead of `13,435,200`. Keeps it readable. The cascade is what sells the moment, not the raw number.

---

### 🔥 HOT BUG #6 — Sigil of Set "Peak Roll" Ambiguity

**Mythic M3:** "First Strike of every fight is automatically your highest possible damage roll (all multipliers fire as if perfect conditions). One-shot per fight."

**Question:** What does "perfect conditions" mean?

If Pentagram Shrine is "×1.4 per CORRUPT card played," does Sigil of Set assume MAX corrupt cards (6)? = ×7.53 even though you played 0 CORRUPT cards?

If Doom Crown is "×8 if all same type," does Sigil assume YES regardless of plays?

If Inverted Cross is "×69 if 100% corruption + no stoned," does Sigil simulate those conditions?

**This is way too powerful as written.** Sigil + Inverted Cross + Pentagram + Doom Crown = ×69 × 7.53 × 8 = ×4156 on first strike of every fight. No build commitment needed.

**Verdict: REWORK.** New Sigil text:

> **The Sigil of Set 𓂀** — First Strike of every fight, your strike mult is automatically maximized (all card-based and chain-based mults fire as if you played 6 cards and triggered 2 chains). Other artifacts/conditions still require their own triggers. One-shot per fight.

This boosts ONLY the cards-played and chain mults to peak, leaving other artifacts to do their normal jobs. Strong but not game-breaking. Math: ×1.05^6 × ×1.78^2 = ×4.31 from card+chain alone. Combined with conditional artifacts that DO fire = strong opener but not auto-win.

---

### 🔥 HOT BUG #7 — Tongue of the Devourer + Echoplex

**Mythic M2:** "Each card you play deals damage equal to your highest member's ATK."

**Interaction:** If your highest member is 30 ATK, every card play does +30 flat damage. Echoplex retriggers each card 69% of the time = +30 damage per retrigger.

**Scenario:** 30 ATK highest member, 6 cards played, Echoplex 69%:
- Direct damage from Tongue: 6 × 30 = 180
- Echoplex retriggers: 4.14 × 30 = 124
- Total flat damage from card plays: 304

That's BEFORE the strike happens. Plus all the strike multipliers stacking.

**Verdict: EMBRACE.** Tongue of the Devourer is mythic, behind a hard unlock condition (beat C3 without losing members). Players who unlock it deserve to feel insane. The math compounds well — 304 damage as a "tax" on your strike, then strike multipliers on top.

**Implementation:** Tongue damage applies per card play (and per retrigger). Add to `totalDamage` stat. Don't multiply by strike mult — it's flat per-play damage, separate from strike resolution.

---

### 🔥 HOT BUG #8 — Witch's Sabbath × Multi-Hit Cards

**Mythic MP1:** "First card each Strike replays THREE times instead of once."

**Interaction with Encore (target attacks twice):** Encore on first card = target attacks 2× from Encore × 4 plays from Sabbath = 8 attacks effectively. ATK accumulates: each Battle Cry on encore'd member = +1×4 = +4 ATK permanent per strike. Run-ending power growth.

**Interaction with Possessed Performance (×3 ATK this strike):** Sabbath replays it 3 times. ALL members get ×3 ATK each replay? Stacking? Or does the replay re-apply the same buff?

**Verdict: NEEDS RULES CLARIFICATION.** 

**Rule for replays of buff cards:** Replays apply the buff each time. So Battle Cry × 4 plays = +4 ATK permanent. Possessed Performance × 4 plays = check if "this strike" buffs stack — they don't, the buff is just refreshed.

**Specifically for Sabbath:** Replays count as separate plays. They fire ALL effects each time. Permanent buffs stack. Temp buffs refresh (don't stack). Direct damage cards fire damage each time.

**Decision: CONSISTENT WITH ECHOPLEX RULES.** Same handling. Just a higher count.

---

### 🔥 HOT BUG #9 — The Conduit + Burning Stage

**Mythic MP2:** "Start each fight at MAX Embers. All cards cost half (rounded down)."

**Interaction:** With max embers (5-8 depending on artifacts) and half-cost cards, Round 1 of a fight you can play 6+ cards trivially. Burning Stage triggers ×3 every strike.

**Conduit + Burning Stage + Doom Crown (same type) + Echoplex 69%:**
- Round 1: Play 6 RIFF cards (all same type). Doom Crown ×8.
- Echoplex retriggers ~4 of them (don't count for same-type check).
- Pentagram Shrine doesn't trigger (no CORRUPT).
- Burning Stage ×3.
- Vintage Guitar ×1.3.

= ×8 × 3 × 1.3 = ×31.2 from artifacts. Plus strike mult ×4 (6 cards × chains). = ×125.

That's SOLID dopamine for a fully-realized build. **Verdict: this is exactly what we want.** Whale combos that take dedication should pay off massively on round 1 of every fight.

---

### 🔥 HOT BUG #10 — Tablet of Az'Tothoth Run-Persistence

**Mythic MP3:** "First Riff Chain each fight permanently upgrades a random card for the rest of the run."

**Interaction:** Over 27 fights × 1 chain per fight = up to 27 cards upgraded. By Lucifer, your deck has 27 upgraded cards. Cards have a `upgraded:true` flag that's already tracked.

**Concern:** If your deck is 69 cards and 27 are upgraded, the upgrade rate is 39%. Significant power scaling but not game-breaking. Existing upgrade system already provides reasonable buffs (CARD_UPGRADES table at line ~1000).

**Verdict: SHIP AS-IS.** This is the long-game mythic. Players who unlock it via "fire all 16 chains in one run" earned the power growth.

**Implementation note:** Track `upgradedCardCount` for stat purposes. Display in run-end summary.

---

## ⚠️ SECONDARY INTERACTIONS

### Pedal x Pedal Interactions

**Reverb Tank (first card -1 ember) + The Conduit (all cards half cost):**
- First card: cost ÷ 2 - 1 ember (min 0). A 4-cost card becomes 1 ember.
- This is fine. Slight extra discount.

**Phaser (CORRUPT -1 ember) + Wah Pedal (first CORRUPT free):**
- First CORRUPT card: cost - 1 - then made free. Free is free.
- Subsequent CORRUPT cards: -1 ember each.
- Fine. Predictable stacking.

**Octave Pedal (first chain doubles) + Black Mass Bell (×2.5 if 3+ chains):**
- Octave Pedal doubles the FIRST chain's mult. Black Mass Bell triggers on 3 chains fired. The doubled chain still counts as 1 chain for Bell's count.
- **Question:** Does the doubled chain produce a doubled MULT, or does it fire its triggered effect twice?
- **Decision:** It produces double mult. So Octave Pedal turns ×1.78 chain into ×3.56. Black Mass Bell counts plays not mult sources, so 3 distinct chains still required.

**Tuner Pedal (discard draws 1) + Bit Crusher (discard adds 5% corruption):**
- Discard 1 = draw 1 + corruption +5%. Resource generation + corruption acceleration.
- Synergizes hard with corruption-build artifacts. Intended dopamine.

**Compressor (4+ cards = next strike +1 draw +1 ember) + Echoplex:**
- 4+ cards triggers Compressor. Next strike has +1 draw, +1 ember.
- Echoplex retriggers don't count toward Compressor's threshold (consistent with same rule as Doom Crown — retriggers are echoes).

### Pedal x Cards That Fundamentally Change Game State

**Sabbath Sigil (corruption → 100%, hellquake d10, card destroyed) + Phaser (CORRUPT -1 ember):**
- Sabbath Sigil costs 0. Phaser doesn't matter. Fine.

**Russian Roulette (free, d6 outcome) + Echoplex 69%:**
- 69% chance Russian Roulette retriggers. Each retrigger is a fresh d6 roll.
- Outcomes compound: best case +12 ATK + 2 shields. Worst case TWO members Too Stoned.
- **Verdict: EMBRACE.** Russian Roulette is risk-reward. Echoplex amplifies both.

**Going Broke (spend all stash for damage) + Echoplex:**
- Going Broke costs 0, deals damage = stash spent. Echoplex retriggers... but stash is already 0. Retrigger does 0 damage.
- **Verdict: Edge case. Functions correctly — just no extra damage.**

### Mythic x Mythic Stacking

**Sigil of Set + Witch's Sabbath:**
- First strike: peak strike mult from Sigil. First card replayed 3× from Sabbath.
- The combo: peak roll × 4 plays of first card = catastrophic round 1.
- **Verdict: this is the late-game peak.** Two mythics aligning is rare, deserved.

**Inverted Cross + The Conduit:**
- The Conduit = max embers + half cost = play tons of cards. Inverted Cross = ×69 if 100% corr + no stoned.
- **The Conduit doesn't help reach 100% corruption directly.** Player still needs corruption-generating cards/builds.
- **Verdict: complementary not synergy-locked. Fine.**

**Tongue of the Devourer + Tablet of Az'Tothoth:**
- Tongue does damage = highest ATK per card. Tablet upgrades cards = stronger card effects per play.
- Over 27 fights, Tablet upgrades 27 cards. Tongue damage goes UP as members get stronger from upgraded buff cards.
- **Verdict: long-game compounding. Intended.**

---

## 🛑 BUGS THAT WOULD REQUIRE NEW CODE PATHS

### Echoplex Display
The cascade currently shows multiplier events. Echoplex retriggers fire AFTER strike resolution. Need to:
1. Animate retriggered cards visually (small "🎚 ECHO" indicator on the card)
2. Show retriggered damage in cascade
3. NOT have retriggers fire DURING the cascade (visually confusing)

**Decision:** Echoplex retriggers fire IMMEDIATELY after each card play, in a visible "echo" mini-animation. Their damage adds to the strike mult calc. Player sees: card plays → small echo of card → strike fires.

### Mythic Unlock Condition Tracking
New stats needed:
- `bossesKilledNoLoss`: Set of boss IDs killed without losing members
- `chainsFiredThisRun`: Set of chain IDs fired this run
- `luciferStrikeCount`: int, strikes used to kill Lucifer (lowest across runs)
- `soloRunVictory`: boolean, true if a Bronze run was won with only 1 member ever
- `allStonedFightWin`: boolean, true if a fight was won with all 4 members Too Stoned at any point

### Trophies UI Mythic Section
Need 3-state display:
- `???` — never seen
- silhouette + cryptic hint — seen but not unlocked
- full reveal + effect text — unlocked

"Seen" trigger: when a mythic first appears in shop after unlock. For now, treat "seen" as same as "unlocked" since mythics only appear when unlocked. Future enhancement: spectral hints in random events that reveal mythic existence.

---

## ✅ DECISIONS LOCKED (May 2 2026 — JV approved)

### LOCKED FIX #1 — Echoplex purity exclusion
Retriggers fire all card effects but are flagged `_isEchoplexRetrigger:true`.
Excluded from: `allSameType` (Doom Crown), `cards2exact` (Solo Sermon), `cards1` (The Blade), any future "exact N" or "all same" checks.
Included in: `cards3` (Vintage Guitar 4+), `cards5` (Burning Stage 6), `perCorruptCard` (Pentagram Shrine), `perChain`, all volume / per-instance checks.

### LOCKED FIX #2 — Black Goat math
Original: ×1.5 always × ×1.5 per artifact owned (including self) → max ×5.06 in 3-slot, total ×68 with Goat+Triple Sixes.
**LOCKED:** ×1.5 always × ×1.3 per OTHER artifact owned. Max from Black Goat alone: ×2.54 (with 2 other mult artifacts). Stacks with Goat of Mendes (×1.5) and Triple Sixes (×9 max). Combined ceiling: ~×34 always-on, which is meaty without breaking the math.

### LOCKED FIX #3 — Sigil of Set rewording
Original: "First Strike of every fight is automatically your highest possible damage roll (all multipliers fire as if perfect conditions)." → trivialized whole conditional artifact pool.
**LOCKED:** "First Strike of every fight, your card-played and chain mults are auto-peaked (as if you played 6 cards + fired 2 chains, ×4.31 strike mult). Other artifacts/conditions still require their own triggers. One-shot per fight."
Math: ×4.31 strike mult on opener = strong but not auto-win. Conditional artifacts (Pentagram, Inverted Cross, Doom Crown) still demand their own triggers.

---

## DECISIONS RECOMMENDED (now historical record)

1. ✅ Echoplex retriggers DON'T count toward purity checks, DO count toward volume checks. (LOCKED)
2. ✅ Soul Bargain + Echoplex can kill, with FATAL ECHO INCOMING warning UI. (LOCKED via D4)
3. ✅ Black Goat tuned to ×2.0 × ×1.3/other (LOCKED via D1, JV chose the stronger option)
4. ✅ Big numbers embraced. Comma format always (LOCKED via D5/D6)
5. ✅ Sigil of Set rewritten with auto-trip buff (LOCKED via D2)
6. ✅ Replay rules consistent across Echoplex/Sabbath/Looper. (LOCKED)
7. ✅ Mythic unlock stats list confirmed. (LOCKED)

---

## 🔒 JV DECISIONS LOCKED — ALL 6 (May 2 2026)

### D1 — Black Goat: STRONGER VARIANT 🐐
**LOCKED:** ×2.0 always × ×1.3 per OTHER artifact owned. Max from this artifact alone: ×3.38 (with 2 other mult artifacts). Stacks with Goat of Mendes (×1.5) and Triple Sixes (×9 max).
Combined ceiling: ~×46 always-on. Strong but not infinite.

### D2 — Sigil of Set: BUFFED VARIANT 𓂀
**LOCKED:** "First Strike of every fight, your card-played and chain mults are auto-peaked (×4.31). Additionally, if no other trip buff is active, that strike gains an automatic ×2 trip multiplier. One-shot per fight."
Math on opener: ×4.31 × ×2 trip = ×8.62 strike mult on round 1 of every fight. Conditional artifacts (Pentagram, Inverted Cross, Doom Crown) still demand their own triggers. Strong but not auto-win.

### D3 — Echoplex Visual: FULL RE-ANIMATION 🎚
**LOCKED:** When Echoplex's 69% roll succeeds:
- Card visibly slides back from played pile into hand position
- Plays through the same animation it did originally
- "🎚 ECHOPLEX" tape-delay overlay text fades in/out during replay
- All effects fire normally (with `_isEchoplexRetrigger:true` flag for purity exclusions)
- Then card returns to discard pile
- Total replay animation: ~600ms
- This is dramatic — the full visceral satisfaction Eddie Van Halen would approve of

### D4 — Soul Bargain Death Rule: BRUTAL WITH WARNING ⚠️
**LOCKED:** Echoplex retriggers can absolutely kill members from HP cost.
Pre-resolution, if Echoplex's planned retrigger would kill the member, show:
- "⚠️ FATAL ECHO INCOMING" overlay text (1.2s pause)
- Member portrait pulses red
- After pause, retrigger resolves and member dies
- Player gets the dramatic warning so death feels earned, not surprise
- Cancel option: NONE. The Echo decided. The price is paid.

### D5 — Damage Display: COMMA FORMAT ALWAYS ⛧
**LOCKED:** All damage numbers display with commas, no abbreviation:
- 850 → "850"
- 12,450 → "12,450"
- 1,234,567 → "1,234,567"
- 13,435,200 → "13,435,200"
- Precise. Readable. The full glory of the number you achieved is shown.
- No "M" abbreviation. No K. The 7-digit god strike number is the dopamine.

### D6 — Multiplier Cap: NO CAP 🔥
**LOCKED:** No mult cap. No diminishing returns. No display cap.
Numbers explode as the build allows. The peak whale combo at ×268,704 multiplier × ×50 base = 13,435,200 damage IS the dopamine peak we're building toward.
Lucifer at ~70K HP gets vaporized by such a strike. **This is intentional.**
The "moment of triumph" requires a number worth bragging about.

---

## 🚀 IMPLEMENTATION CLEARED

All design questions answered. All interactions analyzed. All risk mitigations locked. Code begins next session.

Ship plan: Single atomic feat commit (~750 lines), 10 phases:
1. Data additions (40+ entries with rarity tags)
2. Reclassification of 7 utility artifacts → pedals
3. Trigger logic (~12 new multTrigger types) in 3 strike-resolution sites
4. Pedal effect implementations (Echoplex 69% with full re-animation, Phaser, Wah, etc.)
5. Shop generator with weighted rarity rolls + boss-kill discount + mythic gate
6. Mythic unlock system (stat tracking, localStorage, gates)
7. Trophies UI (3-state silhouette/hint/reveal display)
8. Mythic unlock dramatic overlay
9. Sim engine port for balance verification
10. Save format bump vst_save_v3, sim run, tune

**END ANALYSIS. CODE NEXT.**
