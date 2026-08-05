# VESTIBULE — STATUS

*The glance view. `START_HERE.md` is the deep reference, `TODO.md` is the full backlog, this is "where are we right now."*
*Last updated: Aug 5, 2026 — card-fix session (uncommitted, pending push).*

---

## 🔧 UNCOMMITTED FIXES (Aug 5 session — verify build, then commit + push)

Changed files: `src/App.jsx`, `src/data/cardEngine.js`, `src/data/cards.js`, `vestibule-sim-kwstacks.js`, new `.gitattributes`.

- **Setlist Rewrite** — was a no-op; now a FREE once-per-Strike scry (peek top 3, discard costliest, keep 2). Wired in App + engine + sim (`setlistRewriteUsed` in PER_STRIKE_RESETS).
- **Rule-1 sweep** — removed every `setHand`-inside-`setDeck` violation: Gear Check, Backstage Pass, Sonic Boom, Devil's Dice. Deferred `setHand` via `setTimeout` off refs (Venue-Swap pattern).
- **Cursed Strings** — now +6 ATK this Strike with a REAL "can't be healed this fight" drawback, guarded at every member-heal site (roadie, soundcheck, wake up, séance, controlled feedback, their replay variants, folk aura, cosmic-unity trip, post-fight heal) + engine `canHeal` + sim round-trip (`_cursed`). Cleared at every fight boundary + Encore.
- **`engineUid`** — no longer a module-global counter (determinism/parity break); seeds off `S._uidSeq`. Copy cards now guard `MAX_HAND`.

Verified: engine self-test 86/86 · `npm run check` CLEAN · eslint parse-clean · sim runs clean, no NaN/crashes · independent code-audit passed after heal-site fixes. **NOT yet verified: `vite build`** (sandbox can't build — Linux native binding). Confirm on Windows before/at push.

⚠️ **Two stale git lock files** were left by the sandbox and must be deleted on Windows before committing: `.git/HEAD.lock` and `.git/refs/heads/playtest/session2.lock`.

---

## CURRENT STATE

| | |
|---|---|
| Branch | `playtest/session2` (in sync with origin, HEAD `b451d82`) |
| Build | vite build ✓ · `npm run check` CLEAN · cardEngine self-test 86/86 |
| Card parity | 104/105 (last rig run — needs the live Electron rig to re-measure) |
| Bot rig | **idle** — deliberately not running; too many bugs to collect useful data yet |
| Win rate | 22.4% Lucifer (107 real runs / 8h) — Balatro band |

---

## TOP PRIORITIES

1. **Fix bugs before any data collection.** The bot rig stays idle until the known bugs are cleared — running it now would only collect noise. This is the current focus.
2. **Design decision (open):** whether to apply the staged `balance/` difficulty set (no overtime + band HP stops being a loss condition + full heal between fights + refit HP curve). Sim says it fixes the bimodal shape. **Nothing applied yet — JV's call.**
3. **Fix the 34% unreadable-boss-HP logging** — all pacing data rests on the readable two-thirds until this is fixed.
4. **Rebuild the damage-amplification metric** — unusable from the current ledger (see retracted #3).

---

## STAGED, NOT APPLIED

- `balance/` — `git apply`-ready difficulty patches. Simulated result: Circle 1 deaths 11.3%, middle 50.1%, Circle 9 15.8%, win 22.8%, Too-Stoned deaths 0%. **Do not apply without JV's ok.**

---

## ⚠ RETRACTED NUMBERS — do not re-derive

1. **Lucifer HP "cardinal-rule violation" is a FALSE ALARM.** `enemies.js` 100000 vs `boss_hp_override.json` 666666 is deliberate — `getScaledMaxHp` special-cases `luciferBoss` (flat 333,333/phase). Syncing them makes the final boss 3.6× too easy in the sim.
2. **Riff chains are NOT spam.** True rate 0.21/strike (a counter bug reported 1.9–5.0). Don't nerf them.
3. **Damage amplification is NOT measurable from the current ledger.** Two figures reported, both wrong opposite directions. Fix the metric before sizing any balance change.

---

## HOW THINGS RUN

- **Node-based (sandbox, zero-paste):** editing, `npm run check`, the sim, cardEngine self-test, git commit/push — all run in Claude's cloud sandbox against the real mounted repo.
- **Live Electron bot rig (JV's PC only):** the rig runs on `localhost:9222`, which the sandbox can't reach. Launched by double-clicking `e2e/run-bot.bat` (via desktop control or by hand); Claude reads the ledger it writes.

---

## GUARDRAILS (self-imposed)

- Run `npm run check` + the sim before any commit (CLAUDE.md rule).
- Never touch `main` or apply `balance/` without explicit ok.
- Every code commit updates `TODO.md` in the same commit (cardinal rule).
