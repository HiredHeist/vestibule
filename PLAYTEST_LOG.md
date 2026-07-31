# VESTIBULE — LIVE PLAYTEST LOG (Claude e2e rig)

*Session 1 — July 29, 2026. Electron/Chromium in-container, CDP-driven,
screenshots + text-state verified. Rig lives in e2e/.*

## ✅ VERIFIED WORKING (seen with my own eyes, in the running game)
- Boot → main menu clean (post-fix). Stake row, NEW deck picker w/ locks,
  Heat meter, unlock counters all render.
- Tutorial entry, dialog flow (Got It gating), Fight 1 vs The Shade.
- **BAND AURAS LIVE**: strike preview showed 10 (5+4 base = 9 +1 FRENZIED
  aura to Gunnar); STRIKE BREAKDOWN itemized "Gunnar 5"; boss HP dropped
  30→20→10→0 in exact 10s. Sim↔game lockstep confirmed in production.
- Boss counterattack: exactly its stated 2 dmg (Bjorn 6→4 HP).
- Strike counter, ember display, multiplier ×1.00, deck/discard counts.

## 🐛 FOUND & FIXED THIS SESSION (all pushed)
1. RENDER ERROR: isTutorialDone undefined — split swallowed 6 helpers
   into flavor.js unexported. SHIP-BLOCKER, invisible to build/lint/sims.
2. RENDER ERROR: STARTER_DECKS undefined — regex extractor kidnapped
   whole code regions. Extraction redone with depth-aware parser.
3. Relic seen-list now persists in save file ("once per run" survives
   reload).

## 📋 OPEN ITEMS
- Member cards show BASE ATK while striking at aura-boosted ATK
  (card "4", breakdown "5"). Correct math, confusing UI — needs aura
  chip or effective-ATK display on the member card.
- Rig limitation: card→target play flow unverified (Battle Cry click
  sequence didn't apply +1; likely driver targeting miss, not game bug —
  needs coordinate-based clicks or drag simulation).
- Duplicate keys forgeUpgrades/passives in sim files — silent overrides,
  audit what the sims actually model.
- Duplicate style attribute JSX warning (App.jsx ~9936).

## 🗺 UNVISITED SURFACES (next sessions)
Tutorial 2–3 → first real run → SHOP (Stage Order arrows, relic
"THIS CIRCLE ONLY" + expiry on descent) → deck-switch stake clamp →
FOLK/ANCHOR aura visuals → descent/pact/forge/trips → circle boss →
hangover → save/reload mid-run → full Lucifer run.

---

# SESSION 3 — July 29/30, 2026 (rig resurrection + first autonomous runs)

*Context: session 2's chat died server-side; its container (rig + save) was lost.
Rebuilt from repo in a fresh cloud container. Everything below re-verified live.*

## 🔧 RIG v2 (e2e/pilot.cjs + e2e/autopilot.cjs)
- Playwright connectOverCDP → Electron. ALL input via CDP Input domain
  (trusted events) — session 2's synthetic-event failure baked in as doctrine.
- **Card→target drag CONFIRMED WORKING** (session 1's open rig limitation is
  dead): Battle Cry dragged onto Gunnar → "ATK 4+1", mult 1.00→1.08.
- autopilot.cjs: full state machine (menu/draft/descent/combat/shop/modals/
  death/victory), SHREDDER-chain card policy, op timeouts, stuck detection,
  JSONL event ledger (e2e/session3-events.jsonl), auto-restart on death.

## ✅ VERIFIED LIVE THIS SESSION
- Session 2's death-blow fix (465f2b5) in production: "hit for 2 damage" ✓
- Descent Map: first-ever traversal. Fight/skip columns, reward previews,
  DESCEND flow all work.
- Opening Night draft (2 seeds), daily seed + streak badge, locked
  Lucifer/Tanuki tease cards.
- Fight victory → shop transition; shop first-encounter popup.
- Death screen: stats, coach tips, personal best, unlock progress, VS-last-run.
- Member card shows card-buffs as "ATK 4+1" (aura display still the open item).

## 🐛/⚖️ NEW FINDINGS
1. **BALANCE — training wheels reverted?** The Wanderer is 84 HP in v0.8.0.
   May's 64ecb85 deliberately nerfed it to 45 ("fight-1 training wheels").
   Stake retune appears to have undone the onboarding philosophy. Run #1
   (weak draft, mediocre play) DIED to fight 1, 38 HP short. JV's call.
2. **Setlist text vs behavior**: says "Draw 3", drew 2 (hand cap). Modal
   honestly reports "You drew 2 cards" but the card overpromises. Minor.
3. Out-of-strikes with healthy band = run over (by design, but the death
   screen says "DEFEATED BY The Wanderer" — reads odd when nobody died).

## 📊 RUN DATA (Bronze/Standard, all legit)
- Run #1: Sigrid+Gunnar (2×SHREDDER). DEAD fight 1 — 46/84 dmg, best 22.
- Run #2: Ulf+Vitalik. DEAD fight 1 (rig bug: member parse fail → blind
  strikes; fixed in v1.3, data excluded from balance conclusions).
- Run #3: Ragnar+Bjorn (2×FRENZIED). Fight 1 KILLED (~3 strikes, previews
  55/92). Shop traversed. Fight 2 Lost Soul in progress at ledger time.

## ▶ NEXT
- Autopilot grinding runs continuously; shop buy-policy is v1 log-only (TODO:
  packs-first doctrine), aura-chip UX finding still open, sim duplicate keys
  unaudited. Full run data compiles into the final report.

---

## SESSION 3 ADDENDUM — July 30 audit (pre-overnight-grind gate)

**CORRECTION:** Wanderer "84 HP training-wheels regression" was a FALSE ALARM.
maxHp:45 intact in src/data/enemies.js; 84 = 45 × 1.85 Standard hpScale (same as
May). Early bot deaths at fight 1 were the broken-input rig, not balance.

**Audit results:** npm run check ALL CLEAN (fixed 1 pre-existing 12px font) ·
build clean · console clean ~20 runs · sim dupe keys fixed (benign) · dupe-style
warning not reproducible (closed) · death-screen fix verified live.

**Rig verified end-to-end (03:35 UTC):** draft → descent → combat quick-play
(59-dmg strike) → shop buy (Welcome Pack) → recruit pick (Gunnar joined) →
Wanderer VICTORY. Rig-side fixes this session: quick-play replaces drag (native
drag loop swallows CDP input), recruit dispatch, SOLD-stamp bleed in shop parser,
rig self-heal, single-instance rule.

**NEW FLAG:** fresh 2K sim Bronze/Standard = 39.95% Lucifer wins vs July 29 doc
claim of 8.3–11.8%. Reconcile before balance decisions.

## SESSION 3 — EXPERT BRAIN + 2 NEW GAME BUGS (July 30, ~10:00 UTC)

**Combat brain transplant DONE:** sim's scoreCard policy (82 cards), chain
bonuses (16 chains), per-card targeting now drive the live bot (e2e/brain.cjs
+ carddata.json). Verified live: staticcharge 86 when embers low, wakeup 8
when nobody stoned, heavyriff 78 onto carry — real expert decisions.

**GAME BUG #1 — zombie fight on reload:** save written at 0 strikes left
reloads into a soft-locked fight (boss alive, 0 strikes, 0 embers, no death
trigger). Real players can hit this by quitting mid-fight at 0 strikes.
**GAME BUG #2 — no abandon-run option:** pause (Esc) has toggles only; a
locked/doomed run can't be abandoned without dev tools.
Bot workaround shipped (zombie guard clears save, forces new run) — but the
game itself needs: death-check on load + an Abandon Run button.

## GAME BUG #1 ROOT-CAUSED AND FIXED (July 30, ~10:20 UTC)

The fight-start auto-save was a STALE CLOSURE (violates CLAUDE.md rule #3): the
setTimeout captured the PREVIOUS fight's ending state — sl:0 (zombie fights),
un-healed stage, pre-redeal hand, stale fightIndex. One bug, many bogus stats.
FIX (src/App.jsx): (1) auto-save is now a useEffect keyed on [fightIndex,
gameState] — runs post-commit, reads fresh state; (2) loadGame() invalidates any
save with sl<=0 (kills existing poisoned saves for all players). VERIFIED LIVE:
save now coherent (sl:1/4 + matching band/hand), reload resumes into the same
sane state instead of a locked fight. Abandon-Run button (bug #2) still TODO.

## JV'S EMBER OBSERVATION → 2 REAL FINDINGS (July 31)

**GAME BUG #3 FIXED — quick-play played the WRONG card.** handleDropOnStage read
stale dragCardUid state when called synchronously from onQuickPlay: first
quick-play no-opped, later ones played the PREVIOUSLY selected card (wrong card,
wrong ember charge — source of the "embers look wrong" feel). Fix: quick-play
passes the uid directly. VERIFIED: 2-cost card charges exactly 2, first click.

**SIM DIVERGENCE FLAGGED (design call for JV):** sim refills embers to max EVERY
STRIKE (line ~764 gs.embers=gs.maxEmbers); the live game does NOT — embers carry
across strikes. The sim plays with a ~4x richer economy. Prime suspect for
sim 40% winrate vs live 56% fight-2 death rate. DECIDE: which is intended?

**Bot upgrades shipped:** discard-digging (replaces junk, verified live: dug 2,
drew into an 82-score Amp), aura-aware stage ordering (sim improveOrdering via
shop arrows), pact handler, play-verification via ember/discard deltas (hand
refills after plays — old hand-count check logged successes as play_fails).


## BALANCE PATCH + FIX BATCH (July 31 — post-first-Lucifer-kill)

JV decisions implemented: Heavy Riff once/member/fight - Lucifer 666,666 flat -
full-band replace modal + Devil's Contract popup - forge restored for the BOT
(game was fine; bot could not parse forge tiles - name extraction fixed, verified
forge_pick live). Sim after patch: 12.70% Lucifer wins (was 39.95%) = on target.
Bot: braver drug use (boss-fight openers), credits/WTH handlers, declines Lucifer,
replaces weakest member when upgrading a full band.
