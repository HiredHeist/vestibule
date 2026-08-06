# VESTIBULE — STATUS

*The glance view. `START_HERE.md` is the deep reference, `TODO.md` is the full backlog, this is "where are we right now."*
*Last updated: Aug 5, 2026 — skill-pass R&D + skip-fix + nickname removal (uncommitted, pending push).*

---

## 🌙 OVERNIGHT (Aug 5→6, autonomous) — victory-hang FIXED + turnkey plan

- **Bot victory-hang FIXED** (`e2e/autopilot.cjs`, node --check clean): after a full-game win the bot looped on a no-op Opening Night draft (45 confirms in tonight's ledger) until the 60s watchdog. Added a `draftConfirmStreak` loop-breaker → clean reload in ~3 ticks. **Untested on the live Electron bot** — verify tomorrow (Shift+W to force a win).
- **`TOMORROW.md` written** — the pick-up-and-go plan. Two hard findings: (1) I can't `vite build` in-sandbox (missing native binding — env, not code), so no unverified live edits overnight; (2) **the sim is useless for tuning these levers** — a 5% raw nerf tanks it 6.5%→0.7%; only the live bot can tune. Refined plan: port ONLY a gentle ember leak-plug to live first (the raw-damage scaler is just a global nerf, not true chains-dominant).

## 🧪 UNCOMMITTED — Aug 5 SKILL-PASS R&D + skip-fix + Band Legacy removal (push via `push-fixes.bat`)

Changed files: `src/App.jsx` (Band Legacy nicknames removed), `vestibule-sim-kwstacks.js` (skip-fix + Skill-Pass scaffolding — env-gated, default-OFF).

- **Band Legacy nicknames REMOVED** (JV: clutter) — on-card render + stale FAQ entry gone; tracking fns left as harmless no-ops.
- **Descent skip-fix (sim):** `decideDescentSkips` no longer skips fight 1 of a circle (that forfeited the free Welcome member pack → boss under-equipped). Baseline SKILLED C1 deaths **24%→~2%**, win **4.0%→5.33%**. Now `return []`, matching the live bot which already never skips. **Changes the sim default** (a real improvement).
- **Skill-based R&D (all env-gated, default-OFF — NOT live yet):** goal is a genuinely skill-based deckbuilder — random play should LOSE, crafted combos rare/rewarding/naneinf, not spammable. **Key finding: today's game rewards spam over skill** (baseline LAZY **7.6%** > SKILLED **4.0%**; lazy almost never dies in C1). The levers that matter are the **ember economy** (`SP_EMBER_GEN_CAP` per-fight leak-plug) and **chains-carry-the-damage** (`SP_RAW_DMG`); damage caps rejected (naneinf). ⚠️ **The sim can't validate chains-dominant** — its greedy bot doesn't build combos, so every aggressive config just makes everyone die. **Next: validate on the LIVE BOT.** Full flag list: `SKILL_PASS, LAZY, SP_EMBER_GEN_CAP, SP_RAW_DMG, SP_EMBER_PER_STRIKE, SP_MULT_CAP, SP_CAP_ALL, SP_STRIKE_CAP_PCT, SP_THRESH, SP_CORR_PER_CARD`.

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
