# MODIFIER SYSTEM HARDENING AUDIT

**Status:** IN PROGRESS — Pass 1 (static analysis)
**Date:** May 2 2026
**Goal:** Lock the modifier system fundamentals 100% before art/music/splash polish.
**Bar:** No broken cards, no crashes, no weird loops, no state desync.

---

## Pass 1 — Static Audit (in progress)

### Issues found

(populating as I go)

---

### 🔴 ISSUE #1 — Echoplex replay engine covers only 27/82 cards

55 cards trigger the Echoplex visual flight but have no effect re-application.
The retrigger fires `'_echo:'+cardId` into cardsPlayedRef (so artifact triggers
count it), and shows the polychrome card flight, but the card's actual effect
does not re-fire.

**Categorization of missing cards:**

**A — Permanent ATK / HP buff cards (HIGH PRIORITY — these are exactly what
should compound with Echoplex for the dopamine):**
- `groupie` — +1 ATK perm
- `roadie` — heal random member
- `wakeup` — wake stoned member
- `bloodritual` — sacrifice for ATK
- `slowburn` — +1 ATK per RIFF chain
- `pyromaniac` — corruption-based +ATK
- `crowdsurf` — buff if crowded stage

**B — Damage cards (HIGH PRIORITY — direct damage should re-fire):**
- `tappedout` — direct dmg
- `powertap` — direct dmg
- `shredsolo` — direct dmg
- `darkcrescendo` — escalating dmg
- `goingbroke` — dmg = stash spent
- `russianroulette` — d6 outcome
- `bloodharmony` — dmg + heal
- `riffthief` — steal ATK temp
- `devilsdice` — random outcome

**C — Resource / draw cards (LOW PRIORITY — these involve hand state, replays
make less sense and could cause weird loops):**
- `gearcheck`, `setlist`, `setlistrewrite`, `setbreak`, `bootlegcopy`
- `herbmoney`, `secondwind`, `soundcheck`, `soundboard`
- `demotape`, `echopedal`, `overdrive`, `overdriveped`

**D — Corruption / structural / one-shot cards (SKIP — replaying is weird):**
- `sabbathsigil` (already 100% corruption, can't re-apply meaningfully)
- `voidpact`, `hellfirerift`, `offeringpit`, `possessionriff`
- `darktuning`, `distortion`, `staticcharge`, `seance`
- `corrsiphon`, `carrioncall`, `sigdecay`, `feedbackloop`, `controlfeedback`
- `ampfeedback`, `ampoverload`, `ampstatic`
- `crowdsurf`, `infencore`, `possessedperf`, `remaster`, `resonancecard`
- `backstagepass`, `doublebooking`, `doubledown`, `drainthecrowd`
- `venueswap`, `burnset`

**Decision for hardening:** Add tier-A and tier-B cards (~16 cards) to
fireQueuedReplays. For tier-C/D, add a fallback that just logs `🎚 [card.name]
echoes (no re-effect)` with a NOTE float so the player understands.

**STATUS: 9 additional cards added to replay engine** (Groupie, Roadie,
Wake Up Call, Slow Burn, Riff Thief, Blood Harmony, Blood Ritual, Tapped Out,
Power Tap, Shred Solo, Dark Crescendo, Going Broke, Russian Roulette,
Devil's Dice). Now covers the BIG 36 cards. Tier-C/D cards still no-op
on replay but the visual fires.

---

### 🔴 ISSUE #2 — Mythic unlock conditions had multiple bugs

**Bug 2a:** Tongue of the Devourer checked `enemy.id==='devourer'` but the
actual enemy ID is `'gluttony_boss'`. **Unlock would NEVER fire.** Fixed.

**Bug 2b:** Witch's Sabbath required all 4 members Too Stoned simultaneously
in a fight you win — impossible because if all are stoned, no attacks happen.
**Unlock would NEVER fire naturally.**
Redesigned: Now checks at Lucifer victory whether ≥3 members went Too Stoned
at some point during the run AND that's ≥75% of all members ever used. This
captures "the haze consumed them" run-spanning theme. Achievable with
corruption builds + Sabbath Crown / Wake Up Call / revives.

**Bug 2c:** Lucifer mythic check `luciferPhase===2 || !enemy.passiveId` —
the `!enemy.passiveId` branch could never fire for Lucifer (passive is
`'luciferBoss'`). Cleaned up to just check `luciferPhase===2`.

**STATUS: Fixed. All 6 mythic unlocks now have valid trigger paths.**

---

### 🟡 ISSUE #3 — All ref resets verified

Audited all 11 new modifier-system refs:
- discardsThisFightRef ✅ resets per-fight
- discardsThisStrikeRef ✅ resets per-strike + per-fight
- wahPedalUsedRef ✅ resets per-fight
- octavePedalFiredRef ✅ resets per-fight
- tabletFiredRef ✅ resets per-fight
- queuedReplaysRef ✅ resets per-strike-end + per-fight
- luciferStrikesUsedRef ✅ resets per-fight (NOT during phase 1→2 transition, correct)
- fightLossMembersRef ✅ resets per-fight
- chainsFiredThisRunRef ✅ resets per-run
- runStonedMembersRef ✅ resets per-run (replaces dead allStonedAchievedRef)
- soloMembersUsedRef ✅ resets per-run

Removed dead `allStonedAchievedRef` to clean up.

---

### 🟡 ISSUE #4 — Pre-existing fight-start ember overwrite (NOT MY BUG, FLAGGED)

Line 8786 sets `embers = maxEmbers + bonusEmbers` first.
Line 8902 then runs `Math.min(maxEmbers, embers + extraEm)`.
Result: P1 (Power Chord) and Power Conditioner gain (+1 ember each) are SILENTLY
CAPPED to maxEmbers at fight start because embers is already at max.

This is a pre-existing bug in the fight-start logic, not introduced by the
modifier overhaul.

**STATUS: FIXED.** Refactored fight-start ember calc to do all bonuses in
one setter call. Now P1, Power Conditioner, Hellfire Amulet, and other
fight-start ember bonuses correctly stack and can temporarily overcap.

---

### 🟢 ISSUE #5 — Wah Pedal mark order safe (verified)

Cost calc reads ref BEFORE mark. Mark happens AFTER play succeeds (post
target validation). Failing plays don't waste the free shot.

---

### 🟡 ISSUE #6 — Sustain Pedal _sustainUsed leaked across fights

Fight-start reset (line 8825) didn't clear `_sustainUsed`. So a member with
lingering flag would skip sustain on next fight's first temp buff.

**STATUS: FIXED.** Added `_sustainUsed:undefined` to the fight-start
member reset.

---

### 🟢 ISSUE #7 — _isReplay guard verified safe (dead-code defense)

Replay engine fires effects directly via setStage/setEnemyHp — it does NOT
recursively call playCard. So no infinite loop possible. The `_isReplay`
guard is dead-code defense for future refactors.

---

### 🟢 ISSUE #8 — Echoplex purity vs volume math verified

Battle Cry × 2 in same strike + Echoplex retriggers correctly:
- cardsPlayedRef has `['battlecry', 'battlecry', '_echo:battlecry', '_echo:battlecry']`
- cardsRealPlays filters to 2 (purity check correct)
- Volume checks count all 4 (Pentagram Shrine compounds, etc.)

---

### 🟢 ISSUE #9 — getCenter handles null refs

Returns viewport center as fallback. Echoplex animation gracefully falls
back if slot ref is dead. Won't crash.

---

### 🔴 ISSUE #10 — handleStrike→Body stale closure risk

handleStrike's wrapper called handleStrikeBody by name, relying on TDZ
hoisting. Works at runtime but fragile. Also stale: handleStrikeBody's
closure variables wouldn't update across re-renders.

**STATUS: FIXED.** Introduced `handleStrikeBodyRef` ref pattern. handleStrike
calls `handleStrikeBodyRef.current()` which always points at the latest
useCallback. Bulletproof.

---

### 🟢 ISSUE #11 — Black Goat math consistent across 3 sites

All 3 trigger sites compute identically: `mult * 1.3^(others)`. With 3
artifacts: ×2.0 × 1.69 = ×3.38. Matches design.

---

### 🔴 ISSUE #12 — Sigil of Set never fired

Check was `strikesLeft === activeStake.maxStrikes` but `strikesLeft` is
decremented at line 7882 BEFORE the check fires at line 8186. So first
strike == maxStrikes-1, not maxStrikes. **Sigil would never trigger.**

**STATUS: FIXED.** Main strike site now checks `strikesLeft === fightMaxStrikes - 1`.
Preview sites still use `=== fightMaxStrikes` because previews run before
the decrement. Both sites use `fightMaxStrikes` for consistency with deck
modifiers.

---

### 🔴 ISSUE #13 — Wailing Guitar (ca4) had same decrement bug

Pre-existing. `strikesLeft===activeStake.maxStrikes` at line 7970 fires
after decrement. Wailing Guitar would never double the first strike.

**STATUS: FIXED.** Same pattern as Sigil. Now checks `strikesLeft === fightMaxStrikes - 1`.

---

### 🔴 ISSUE #14 — handleStrikeBody stale animPhase always early-returned

After replay delay, wrapper sets animPhase='idle' THEN calls handleStrikeBody.
But the body's closure had stale animPhase==='replaying' captured at definition
time. The early-return guard `if(animPhase!=='idle')return` would always trip,
strike would never resolve.

**STATUS: FIXED.** Removed animPhase check from body. Wrapper still gates
on animPhase before calling. Body keeps strikesLeft<=0 and enemyHp<=0 guards.

---

### 🔴 ISSUE #15 — Mythic shop filter compared wrong field

Filter: `unlockedMythics.includes(item.id)` — but `unlockedMythics` stores
unlockId values (camelCase) and `item.id` is artifact id (lowercase).
Result: even after unlocking, mythic items NEVER appeared in shop pool.

**STATUS: FIXED.** Filter now compares `item.unlockId` against the unlocked
list. Mythic shop appearance now actually works.

---

### 🔴 ISSUE #16 — Save load missed MYTHIC pools

`setActiveArtifacts((sv.art||[]).map(id=>[...STARTER_ARTIFACTS,...CIRCLE_ARTIFACTS].find(a=>a.id===id))...)`
didn't include MYTHIC_ARTIFACTS. Same for passives. Result: load a save
where you owned a mythic → mythic silently disappears.

**STATUS: FIXED.** Both lookups now include their MYTHIC pool.

---

### 🟡 ISSUE #17 — Witch's Sabbath stacked with Looper

When both equipped, first card got Looper's 1 replay + Sabbath's 2 = 3 extra
replays = 4 total plays. Sabbath description says "3 times" so should be
3 total plays.

**STATUS: FIXED.** Sabbath now supersedes Looper for first-card replays.
Echoplex still independent and can stack on top.

---

### 🟢 ISSUE #18 — Echoplex doesn't recursively trigger itself

fireQueuedReplays pushes `_echo:cardId` to cardsPlayedRef but doesn't call
playCard. So the retrigger doesn't queue another Echoplex roll. No infinite
loop possible.

---

### ⚠️ ISSUE #19 — DESIGN/IMPL MISMATCH: pedal slot count

Design lock said "3 artifacts + 2 pedals = 5 modifier slots."
Code has 5 pedal slots (matching old game state with P1-P10 pedals).
Player can stack 5 pedal effects, not 2.

**STATUS: FLAGGED, NOT AUTO-FIXED.** This is a design call:
- Path A: Keep 5 (current) — more flexibility, less Balatro-pure
- Path B: Drop to 2 (design intent) — tighter combos, harder choices

Cutting to 2 would invalidate any save with 3+ passives equipped, and
balance-shift the existing 10 starter pedals. JV decision needed.


---

## Pass 2 — Dynamic Audit (pending)

(boot dev server, click through scenarios)

---

## Resolved
