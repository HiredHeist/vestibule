# VESTIBULE — STATUS

*The glance view. `START_HERE.md` is the deep reference, `TODO.md` is the full backlog, this is "where are we right now."*
*Last updated: Aug 5, 2026 — card-fix session (uncommitted, pending push).*

---

## ✅ PUSHED — Aug 5 card fixes (commit `a263913`)

Setlist Rewrite (no-op → free once-per-Strike scry) · rule-1 `setHand`-inside-`setDeck` sweep (Gear Check, Backstage Pass, Sonic Boom, Devil's Dice) · Cursed Strings +6 ATK with a real "can't be healed this fight" drawback wired at every heal site · `engineUid` determinism fix · `.gitattributes` for line-ending hygiene.

## 🃏 UNCOMMITTED — Aug 5 BATCH C: revive dead cards (push via `push-fixes.bat`)

Changed files: `src/App.jsx`, `src/data/cardEngine.js`, `src/data/cards.js`, `vestibule-sim-kwstacks.js`.

- **Blood Harmony** → permanent +2 to target + both neighbours (positional). **Tremolo Pick** → +4 ATK permanent at 2+ cards. **Sabbath Sigil** Hellquake rolls 9/10 floored (never a run-ender). **Second Wind** → refill + draw 1. **Slow Burn** → +2/+2/+2. **Amp Feedback** → FREE. **Drain the Crowd** → +3 embers. **Corruption Siphon** → +4 embers.
- Verified: engine 86/86, parse-clean, no crashes, win rates steady. ⚠️ The sim's static-policy bot can't measure individual card buffs (it doesn't draft/play RIFF utility) — the **live bot** is the judge.

## ✅ PUSHED — Aug 5 BAND EQUALIZATION (Batch B, commit `560a955`)

Changed files: `src/App.jsx`, `src/data/members.js`, `vestibule-sim-kwstacks.js`.

- **Boss HP is deck-independent** — per-deck `hpScale` unified to 1.85; all decks fight the same blind (matches JV's Balatro principle).
- **Band equalized** — every recruitable member on one budget (`maxHp + 3×ATK = 27`), differing by shape + keyword, no strictly-better picks. Members start at full HP. Deck stat-fudges removed (Survivor +2 HP, Shredder ×0.80).
- **BLASTBEAT** (was DOUBLE TIME) — flat ×1.5 band damage, no dice, STACKS; multiple drummers allowed (Thor + Rolf both BLASTBEAT). Drummer's Stick relic now reliable.
- **TRICKSTER** (Tanuki, was ANCHOR) — relays both neighbors' auras. **FOLK MAGIC** 25%/heal-2, **HEXED** +1 ATK per 8%. **Second Wind** revive 25%→15%.
- **Sim result:** 5 decks converged to **4.6–7.2%** (was 3.6–8.5); Shredder aggro worst→mid (3.62→6.07%).

Verified: engine self-test 86/86 · eslint parse-clean · sim clean across decks, no NaN/crashes. **NOT verified: `vite build` + in-game feel** of the App.jsx combat changes (BLASTBEAT stacking, TRICKSTER aura) — the build gate on push catches compile errors; playtest the feel.

⚠️ If a git write left stale `.git/*.lock` files, `push-fixes.bat` clears them first.

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
