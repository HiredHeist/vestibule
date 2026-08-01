# ONE-SHOT AUDIT — Aug 1, 2026

Four parallel auditors swept the whole codebase at once (game state machine, card
correctness, bot policy, economy + rig). This file is the complete backlog so
findings are never drip-fed again. **Fixed items are struck through in TODO.md.**

## ✅ FIXED THIS SESSION

- Lucifer phase-1 kill fired FULL VICTORY instead of opening phase 2. ~15 direct-damage
  kill paths (Sound Wall, Stage Dive, Crowd Surf, Sonic Boom, Skull Splitter, Feedback
  Scream, Necrotic Amp, Going Broke, Blood Ritual, Venom DOT, Black Candle, Madness,
  3 Hellquake outcomes) called `triggerVictory` directly, bypassing the transition that
  lived only inside `handleStrikeBody`. Now `enterLuciferPhase2` is extracted and
  `triggerVictory` intercepts phase 1 at the single choke point.
- Victory safety net fired on a 600ms timer with NO HP re-check — anything that zeroed
  HP then refilled it inside that window (Lucifer P1→P2, Welcome-to-Hell handoff) won
  the game for free. Now re-reads `enemyHpRef` at fire time and aborts.
- Debug keys (Shift+S/C/W/D/H/~) were LIVE FOR EVERY PLAYER; Shift+W = instant win.
  Gated behind `vst_debug=1`.
- Lucifer spawned at 185,000 (generic scaling) because the setup block checked a stale
  `fightIndex`; resume path had the same bug.
- Two crash bugs: ShopScreen `lastRiffPlayed` out of scope, `setDiscard` typo.

## 🔴 OPEN — GAME (highest severity first)

1. **Cascade slam race voids an entire strike.** `_bossDelay` is computed with a 140ms
   per-line assumption but `DamageBreakdown` uses 380/500/700ms for mult lines, so on
   builds with ~5+ multipliers the component unmounts before `onSlam` fires and
   `_pendingHpDrop` never runs — boss takes ZERO damage that strike. App.jsx:8302.
2. **Boss heal passives DAMAGE the boss.** `setEnemyHp(p=>Math.min(enemy.maxHp,p+N))`
   clamps to the UNSCALED maxHp, which is always below live HP. The Devourer drops from
   ~11,001 to 6,442 on the first card played. 22 sites. Use `scaledMaxHp`.
3. **The Encore button is a guaranteed ReferenceError** — handler lives in `EndScreen`
   but calls ~19 App-scope setters that aren't props. Encore mode is unreachable, and
   `ErrorBoundary` replaces the game with an error wall instead of failing open.
4. **Fight-start HP omits `_stakeHpF()`** — three formulas disagree, so displayed HP ≠
   actual HP on every stake except Bronze.
5. **`handleShopLeave` has a stale `welcomeToHell`** — buying nothing in the WTH shop
   re-fights Lucifer instead of the Executive.
6. **Descent skip rewards are wiped** by the fight-start reset 50ms later.
7. **Shop: buy sites mark items SOLD before `onSpend` accepts.** Four silent early-return
   paths mean you can get free drugs, or lose a card and pay nothing.
8. **Artifact/pedal slot-swap modal is unreachable** (rendered inside the `playing`
   branch, but only reachable from shop) → buying a 4th artifact silently destroys that
   circle's relic with no refund and no feedback.
9. Reroll clears the one-pack-per-visit lock → unlimited booster re-buys.
10. Stake `priceMult`/`drugPriceMult` declared but never applied anywhere.
11. War Drums is permanently unreachable — gate reads `vst_lifetime_score`, a key nothing
    ever writes (should be `vst_lifetime`).
12. `handleReset` misses: `tutorialFight`, `corruptCardsGivenRef`, `rerollCost`,
    `pendingEmbers`, `undoSnapshot`, `recruitBought`, `victorySummary`, `dmgBreakdown`.
13. Save format gaps: `hangover`, `encoreMode`, `welcomeToHell`, `eventsSeenThisRun`,
    `fightMaxDiscards`, `pendingDraw`, `stolenAtkPool`, circle relic/pedal.
14. ~12 Strict-Mode violations (side effects inside state updaters) — double-applied
    damage, double-counted stats, duplicated discards.
15. Echoplex replays overwrite each other's damage (shared stale `enemyHp` closure).
16. Overtime multiplier display is off by one vs the engine.

## 🔴 OPEN — CARD CORRECTNESS (text ↔ live ↔ sim)

**The sim is systematically stronger than the live game, so every balance number
derived from it is optimistic:**
- **Every "+X ATK permanent" card is worth 2X in the sim** — it writes both `atk` and
  `permAtkBonus` while live writes only `atk`. Affects ~14 cards.
- **Heavy Riff has no `_hrUsed` gate in the sim** — the one-carry snowball the Jul 31
  nerf killed is still fully live inside the simulator.
- Corruption gains diverge wildly: `distortion` +15 live / **+50 sim**, `corrsiphon`
  +8/**+80**, `bloodritual` +15/**+50**, `hexdecay` +15/**+50**.
- `feedbackloop` and `deathriff` have three different implementations each (text, live,
  replay engine) — live deals ZERO damage where text and sim deal 40–60.
- `hellfirerift`, `soulsacrifice`, `voidpact` are no-ops in the sim.
- **Live: "this strike" buffs never expire** for ~16 cards (they set `tempBuff` without
  `_origAtk`) — permanent for the whole run, making live stronger than any sim number.
- `echopedal`/`riffthief`/`bootlegcopy` do NOTHING in live (a `setHand(literal)` after a
  `setHand(updater)` discards the appended copy).
- `hungercard`'s "draw 2" is dead (pure `drawUpTo` return value discarded).
- 22 of 43 `CARD_UPGRADES` do nothing in live but DO apply in the sim.
- Ember costs drift between cards.js and the sim on 8 cards; sim has 3 cards that
  don't exist (`loopstation`, `powerslide`, `graverobber`).
- `noise_gate` chain can never fire in live (both members return early from `applyCard`).

## ✅ FIXED — BOT (this session, all covered by e2e/test-perception.cjs)

The audit's verdict on the old bot: *"not a 1000-hour player; a confused beginner with a
good textbook."* The policy port was faithful — everything was broken in perception.

- Corruption parsed as **0 forever** (`^` anchored regex that could never match) → the
  entire CORRUPT half of the card pool scored at its floor; Dark Crescendo unplayable.
- Game state **frozen at strike start** → 53% of play attempts failed (185 fails / 162
  plays). Now re-perceives after every single card.
- `maxHp` faked as `hp` → "is anyone hurt?" structurally false. Now recovered from the
  HP-bar width.
- Too Stoned members counted as alive; hand deduped by name (duplicate copies invisible).
- Heavy Riff replayed into a hard rejection; now tracked once-per-member-per-fight.
- Targeting: Resonance at the carry is a mathematically guaranteed no-op; Stage Dive
  (damage = target HP) aimed at the squishy carry; Controlled Feedback healing a
  full-HP member. Now per-card target policies.
- Three FREE power cards scored 5 and were being **discarded as junk**; `blood_price`
  and `contract` were unmatchable and invisible.
- `fightIndex` hardcoded 0 → Sabbath Sigil never played.
- Trips dumped on strike 1 of full-health bosses; acid and DMT never used at all.
- Discard-dig ran AFTER the play loop (embers already spent) — now runs first.
- `|| 2` band-size fallback (bought 6 unusable packs) and `|| 4` strikes fallback.
- Relics were **unbuyable by construction** — `buy('artifact')` searched for a word the
  buy button never contains.
- 9 screen types landed on 'unknown' (DemonicConflict = hard block, pause, PackModal,
  SetlistModal, Remaster, PawnShop, circleSplash, boot, slot-swap).
- Stuck counter could be reset forever by a matching-but-inert button.

## 🟡 OPEN — BOT (lower priority)

- No mentor-link awareness in stage ordering (needs `role` + tier in ordering pass);
  worth up to +4 ATK/+8 HP and a ×2.0 multiplier.
- No ember budgeting or chain-holding lookahead (the sim shares this limitation).
- Forge scoring is an 11-entry hardcoded table ranking card power, not upgrade delta.
- Shop identity keyed on `t.length` (spurious resets within one visit).
