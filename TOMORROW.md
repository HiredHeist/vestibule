# TOMORROW — turnkey plan (written overnight Aug 5→6 2026, autonomously)

*JV asked me to make tomorrow easy and log everything. This is the pick-up-and-go doc. Read this first, then `STATUS.md`.*

---

## ✅ DONE OVERNIGHT (safe, verified, no babysitting needed)

1. **Victory-hang bug FIXED in the bot** (`e2e/autopilot.cjs`, `node --check` clean).
   - Root cause, straight from tonight's ledger: after a full-game victory the reload lands on an Opening Night whose **TAKE THE STAGE button is present but a no-op** — the bot re-confirmed the same draft **45 times** until the 60s watchdog fired ("hangs on the next round after winning").
   - Fix: a `draftConfirmStreak` loop-breaker — after 3 confirms on a draft screen that never advances, it logs `draft_stuck_reload` (with a screenshot) and forces a clean reload to a fresh run. Breaks the hang in ~3 ticks instead of ~60s. Resets the instant the bot leaves the draft screen, so normal drafting is untouched.
   - ⚠️ **Not yet tested on the live game** (I can't run the Electron bot from my sandbox). First thing to verify tomorrow: win a run (Shift+W dev shortcut) and confirm the bot starts a clean new run. The underlying *game* bug (post-victory Opening Night confirm being a no-op) is still worth a real fix in `App.jsx` too — the bot fix just stops it wasting the night.

2. **Everything from the evening session is staged for push** (`push-fixes.bat`): skip-fix + Skill-Pass sim scaffolding + Band Legacy nickname removal + docs + the bot victory-fix. Run `push-fixes.bat` when ready (it build-gates on Windows).

---

## 🧱 HARD CONSTRAINT I HIT (so you know why I didn't just "do it all")

- **I cannot `vite build` in my sandbox** — the Linux box is missing the `@rolldown/binding-linux-x64-gnu` native binding (your `node_modules` has the Windows one). This is environmental, NOT a code problem. Consequence: **I can't verify live `App.jsx` edits compile**, so shipping unverified combat/ember surgery to run while you sleep was a real white-screen risk. Bot code (`.cjs`) and the sim I *can* verify (`node --check`), so those I did.
- **The sim is useless for tuning the skill levers.** Proven tonight: even a *5%* raw-damage nudge drops the sim's win rate 6.5% → 0.7% (10×). The sim's greedy bot can't adapt or build combos, so its win rate is not a valid signal for "is this well-tuned." **Only the live bot (which adapts, won ~22% on the old game) can tune this.** Do not tune these off sim numbers.

---

## 🎯 THE REBALANCE PLAN (refined by tonight's findings)

Goal (JV): highly skill-based deckbuilder — **random play should LOSE**, crafted combos rare + rewarding + naneinf, **not spammable**. No damage caps.

### What we proved tonight
- **The disease, quantified:** the current game rewards spam over skill — baseline LAZY **7.6%** win **>** SKILLED **4.0%**, and the spam player almost never dies early. A mindless player out-performs a careful one.
- **Two candidate levers:** (1) ember economy (per-fight pool, plug leaks), (2) chains-carry-the-damage.
- **Key correction:** a uniform raw-damage scaler (`SP_RAW_DMG`) is **just a global difficulty nerf**, NOT a shift toward chains — because live damage is fully multiplicative (`bandATK × strikeMult × trip × corruption × artifacts`), scaling the base scales the chained result identically. So **don't ship the raw scaler as "chains-dominant."** The real chains-dominant lever means changing the *ratio*: cap/slow additive ATK stacking, or boost the per-chain multiplier — a real rebalance, needs design.

### Recommended order tomorrow (fast + safe)
1. **Port ONLY the ember leak-plug to live, gentle.** This is the lever that structurally forces card selection (you can't play your whole hand → you must choose). Do NOT nerf raw damage yet.
   - **Mechanism:** a per-fight ember-**generation** cap. Track total embers *gained* this fight; once it exceeds the cap, further generation is ignored. Bounds EMBER cards / Ritualist refunds / free-grants **without deleting** them.
   - **Live implementation (ready to build):**
     - Add `const emberGenThisFightRef = useRef(0)` and register it in **`PER_FIGHT_RESETS`** (grep `RESET REGISTRY` in `App.jsx`) so it zeroes at every fight boundary (cardinal rule 5).
     - Add a helper `const gainEmbers = useCallback((n) => { const allow = Math.max(0, SKILL_TUNE.emberGenCap - emberGenThisFightRef.current); const keep = Math.min(n, allow); emberGenThisFightRef.current += keep; setEmbers(p => Math.min(maxEmbers, p + keep)) }, [maxEmbers])`.
     - Replace the ~20 ember-gain sites `setEmbers(p=>Math.min(maxEmbers,p+X))` with `gainEmbers(X)`. Sites (approx, re-grep `setEmbers` first): 6344, 6371, 6391, 6395, 6758, 6762, 6766, 6771, 6775, 6969, 6996, 8293, 8324, 8501, 8543, 8544, 9109 (leave the *spend* sites and the fight-start `embers=maxEmbers` reset alone).
     - Gate behind a top-of-file `const SKILL_TUNE = { emberGenCap: 999 }` — set `999` = OFF (identical to today). Flip to a real value (start generous, e.g. **8–10 per fight**) once wired, so the first live-bot run is a gentle nudge, not a wall.
   - **Verify:** you run `push-fixes.bat` (build-gates). If build passes, HMR picks it up; the bot reads the change live.
2. **Run the overnight/live bot on the gentle leak-plug**, read the ledger (`e2e/session3-events.jsonl` → `node e2e/analyze.cjs`): win rate, death-by-circle, avg cards/strike, chain rate. Tune `emberGenCap` DOWN until spam stops trivially winning but a good engine still clears.
3. **THEN design the real chains-dominant lever** (separate, meatier): make riff chains the necessary path to boss-killing numbers so random play (which rarely completes chains) falls short. Likely: dampen additive per-card ATK growth and/or raise the per-chain `strikeMult` bump — measured on the live bot, not the sim.

### Live code map (re-grep before relying — line numbers drift)
- Strike damage assembly: `App.jsx` `handleStrikeBody` ~8467; base band sum `let dmg=...` ~8602; BLASTBEAT ~8613; `_baseImpactMult` (strikeMult×trip×corruption) ~8732.
- Chain strikeMult bumps: ~6596 (×1.5), ~6855 (×1.78 on chain), cap `Math.min(10000,...)`.
- Ember gain sites: `grep -n "setEmbers" src/App.jsx` (spend vs gain).
- HP source of truth: `getScaledMaxHp` (cardinal rule 13 — only place to touch boss HP).

---

## 📋 SIM FLAGS REFERENCE (all env-gated, default-OFF, for experiments only)
`SKILL_PASS=1` · `LAZY=1` (spam-player) · `SP_EMBER_GEN_CAP=N` (leak-plug) · `SP_RAW_DMG=F` (global nerf — NOT true chains-dominant) · `SP_EMBER_PER_STRIKE` · `SP_MULT_CAP` · `SP_CAP_ALL` · `SP_STRIKE_CAP_PCT` · `SP_THRESH` · `SP_CORR_PER_CARD`. Reminder: **sim win-rate ≠ tuning signal for these levers.**

---

## FIRST 10 MINUTES TOMORROW
1. `push-fixes.bat` to bank tonight's work (if not already pushed).
2. Start the game, Shift+W to force a victory, confirm the bot (or you) lands cleanly on a fresh run — validates the victory-hang fix.
3. Wire the `gainEmbers` leak-plug (step 1 above) behind `SKILL_TUNE.emberGenCap`, build-verify, set a gentle cap.
4. Run the bot 30–60 min, read `analyze.cjs`, tune the cap. That's the loop.
