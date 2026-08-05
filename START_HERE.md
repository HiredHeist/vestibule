# START HERE — Vestibule

**Read this first, every new session, before touching anything.**
Then read `CLAUDE.md` (canonical rules) and `TODO.md` (active work).
Last updated: Aug 5 2026.

---

## 1. What this is

**Vestibule** — a doom-metal roguelite deckbuilder. React + Electron, single-file
game in `src/App.jsx` (~11.6k lines) plus `src/data/`. The design target is
**Balatro / Slay the Spire**: a skill game about crafting a winning deck against
**fixed, published, plannable numbers**.

**JV's stated design principle, which overrides contrary suggestions:**
> "I want to stick to set numbers like the blinds in Balatro. Having numbers that
> scale randomly for players makes it difficult to craft a deck around."

Do **not** propose mechanics that scale to the player at runtime. Fixed targets only.

---

## 2. Current state

| | |
|---|---|
| Branch | `playtest/session2` (**not** `main`) |
| Repo | `github.com/HiredHeist/vestibule` (private) |
| Last pushed | `93db1a3` |
| Unpushed work | `b58f997`, `881e8d8`, `9361507` — see §6 |
| Game build | passing: vite build, `npm run check`, cardEngine 86/86, card parity 104/105 |
| Bot rig | verified stable — 8h / 107 runs / 0 crashes / 0 stalls |

---

## 3. The one-command checks

```
e2e\run-tests.bat      REM 5 gates, ~5 min. Run before trusting any data.
e2e\run-bot.bat        REM autonomous playtest, restarts itself, runs all night
node e2e\analyze.cjs   REM report over e2e\session3-events.jsonl
node vestibule-sim-kwstacks.js 5000
```

The bot rig is **silent by default**; `VST_AUDIO=1` re-enables sound.

---

## 4. ⚠️ RETRACTED NUMBERS — do not re-derive these

Three figures were reported during the Aug 4 audit and are **wrong**. They are
listed here because each one was independently re-derived at least once and sent
JV down a bad path.

**a. "Lucifer cardinal-rule violation" — FALSE ALARM. Never re-fix this.**
`enemies.js` says `maxHp:100000`; `boss_hp_override.json[26]` says `666666`. This is
**correct and deliberate.** `App.jsx getScaledMaxHp` (~5209) special-cases
`passiveId==='luciferBoss'` and returns a flat **333,333 per phase / 666,666 total**,
no deck `hpScale`. The `enemies.js` field is **dead data** for Lucifer. Both sync
gates now carry a LUCIFER_EXEMPT branch. Syncing them "fixes" the sim into
measuring a 3.6× easier final boss.

**b. Riff chains are NOT a spam mechanic.** A chain-counter bug reported
1.9–5.0 chains/strike. The detector re-emitted the whole log history after every
fight boundary (124 rows from 7 real events; one line counted 44×). **True rate is
0.21/strike** — three independent methods agree. Chains are already rare and
rewarding. Do not nerf them.

**c. Damage amplification is NOT measurable from the current ledger.** Two figures
were reported, both wrong in opposite directions: **×30 median** used a denominator
that excluded same-strike buffs; **×1.06 median** suffered survivorship bias
(excluding lethal strikes excludes every big strike). Sanity check: at ×1.06,
killing Lucifer takes 1,048 strikes; the bot throws ~92 per entire run.
**Fix the metric before sizing any balance change from it.**

---

## 5. The real finding (Aug 4, 107 real runs over 8 hours)

**Difficulty is bimodal — there is no middle.**

```
Circle 1   ████████████████████████  64 runs (60%)   <- 47% die in fight 0 alone
Circle 2-8 ███                       10 runs ( 9%)
Circle 9   █████████████             32 runs (30%)
```

Win rate **22.4%** — already in the Balatro band. The *shape* is the problem.
Conditional win rate: 22% at start → 43% past fight 1 → **56% past fight 3, then
flat.** Fights 3→26 shed only 11 of 43 runs. The run is decided in ten minutes.

**Why:** the fight is not a *check*. Overtime means failing to kill in 4 strikes
doesn't lose — it continues, so fight 0 takes a median of **9 strikes** against a
4-strike allowance while the band is ground down. The real loss condition is
attrition (all members Too Stoned), which no deck can be built against.

**Recommended fix set** (staged in `balance/`, **not applied**): no overtime + band
HP stops being a loss condition + full heal between fights + refit HP curve.
Simulated result: Circle 1 **11.3%**, middle **50.1%**, Circle 9 **15.8%**, win
**22.8%**, Too-Stoned deaths **0%**.

**The structural insight (JV's, and it is correct):** difficulty must be
**concentrated, not flat**. Balatro's Small and Big blinds are comfortable; the
**Boss blind** is the check. Vestibule already has that skeleton — 3 fights per
circle, every third a circle boss. Measured pass rhythm under the recommendation:
`.98 / .99 / .91` per circle, `.79` per Lucifer phase.

---

## 6. Open items

**Immediate:** three commits exist locally but could not be pushed (the cloud
session lost GitHub authorization). If `git log origin/playtest/session2..HEAD`
shows anything, push it.

**Awaiting JV's design decision:** whether to apply the recommended difficulty set.
Everything is staged as `git apply`-ready patches in `balance/`. **Nothing has been
applied to the game.**

**Known unfixed, ranked:**
1. **34% of strikes log an unreadable boss HP** — all pacing data rests on two
   thirds of the sample. Root cause of several bad readings. Fix first.
2. **The amplification metric** (§4c) — unusable until fixed.
3. **Skill sensitivity is not fixed by any variant tested.** Deck quality barely
   changes outcomes (best measured 1.36×). This is the actual "is it a skill game"
   question. The lever is multiplier-stack variance, not boss HP.
4. `autopilot.cjs` still owns shop/recruit/forge/pact decisions that were audited
   but not fully rebuilt; `brain.cjs` (combat) was rebuilt.
5. ~35 game bugs enumerated in `AUDIT_AUG1.md` — lower severity, all still open.

---

## 7. How JV works

- **Give ONE copy-pasteable command, with no annotations inside it.** He pastes
  literally. A `REM` comment or a `<placeholder>` in the middle breaks it.
- **Do not go silent.** Long unattended work with no status is the single thing
  that has cost the most trust. Post progress.
- **Verify on HIS machine, not just yours.** Two bugs shipped because they were
  tested on Linux: a Windows-only path crash (`.pathname` → `C:\C:\...`), and a
  gate "verified" by piping output past its exit code.
- **Never claim something is fixed without evidence he can reproduce.**
- Profanity and doom-metal references in commits are fine. Lowercase is fine.

---

## 8. Where things run

| | Desktop (Windows) | MacBook | Phone |
|---|---|---|---|
| Full local access + shell | ✅ start task **on your computer** | ✅ same | ❌ |
| Read/write repo files | ✅ | ✅ | ✅ (cloud, folder must be connected) |
| Run the Electron bot rig | ✅ (you launch it) | ⚠️ untested | ❌ |
| Review reports / decide | ✅ | ✅ | ✅ |

The bot rig is a Windows Electron app on `localhost:9222`. **Shell cannot reach
your machine's localhost in either mode**, so JV launches `run-bot.bat` himself;
Claude reads the ledger and iterates.

**Rig traps already learned — do not regress:**
- Never detect a screen by substring-matching button text (half of `relics.js`
  says "…this strike", so shops classified as combat and killed runs).
- Read the game log from `window.__devLog`, not `document.body.innerText` (the
  combat log is a closed overlay).
- `pkill -f "e2e/driver.cjs"` matches its own command line and kills your shell.
  Use `pkill -f "[e]2e/driver.cjs"`.
- Verify exit codes, not piped output.
- `new URL(..., import.meta.url).pathname` is broken on Windows — use `fileURLToPath`.
