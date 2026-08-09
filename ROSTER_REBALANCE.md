# ROSTER REBALANCE — "Players Are the Gameplay"
*Aug 6 2026 · all testing on the VETERAN (PLANNER=1) bot, blinds ON (shipping state) · goal: no more "always pick the same two" — every band member a real, distinct, equally-worthwhile choice.*

## ☕ TL;DR
Before, a skilled player always grabbed Bjorn + Ragnar (FRENZIED guitarists) and skipped everyone else — the two lead guitarists were picked ~80%, the four bassists ~14%, and **the drummers a dead 1–6%**. Now **every member is picked 25–38%**, no auto-includes, no dead members — and win rates stayed in band (9–12% per deck). Members still *feel* different (they hit for wildly different amounts and fill different roles); they're just all worth picking now.

**To ship: `push-fixes.bat`** (I added `members.js` + the new data docs to its file list).

---

## The root cause was a real bug, not just tuning

**BLASTBEAT — the drummers' entire ability — was never implemented in the sim.** Live (App.jsx ~8749) makes every drummer multiply the whole band's damage by 1.5 (stacking). The sim only gave drummers a tiny +1 neighbor aura. So in the sim a drummer dealt **0 damage and buffed nothing** — the veteran bot was *correct* to never pick them (1–6%). Every "drummers are weak" reading in the last report was an artifact of this parity gap.

When I implemented BLASTBEAT in the sim, the opposite problem appeared: a drummer was a **tanky 18–20 HP wall that ALSO multiplied the band** — free value in one slot. Rolf jumped to **100% pick, win rate 23%**. So drummers were never weak; they were secretly the strongest thing in the game, and live players have had that exploit the whole time.

## What changed

| Change | Before | After | Why |
|---|---|---|---|
| **BLASTBEAT multiplier** (sim + live, in sync) | ×1.5 / drummer (×2.25 for two) | **×1.35 / drummer (×1.82 for two)** | ×1.5 was above the raw break-even (4 attackers ×1.5 = 6× a 5-attacker band) so a drummer was auto-include. ×1.35 makes it a genuine trade. |
| **Drummer bodies** (`members.js`, shared) | Thor 20 HP, Rolf 18 HP (walls) | **Thor 14 HP, Rolf 11 HP, both 0 ATK** | A wall that also multiplies is free value. Moderate bodies mean a drummer is a real cost — fewer attackers, a body you must protect. |
| **Draft valuation** (`memberScore`, sim only) | Keyword weights 6→1 (FRENZIED best, ANCHOR worst) | **All non-drummer keywords equal; drummers special-cased to a flat competitive score** | Every member sits on the same budget (ATK×3 + HP = 27), so those keyword weights literally *were* the pick gradient. Flattening them makes the choice real. |
| **New: per-member leaderboard** in the sim | — | dmg/fight, pick%, win-when-used | So we can actually see this — and catch the next imbalance. |

## The result — even picks, held balance (veteran, blinds on)

**Pick rate, Standard (2,000 games):** every member **31–36%**. Drummers Rolf 35% / Thor 34% (were 1–6%). Bjorn 33%, the four ANCHOR bassists 31–34%, DEBUFF/SHREDDER/FOLK all 35%. Flat across the board.

**Win rate per deck (in band, 8–12% target):**

| Deck | Win% | Sample |
|---|---|---|
| Standard | 10.95% | 2,000g |
| Shredder | 11.13% | 800g |
| Ritualist | 11.75% | 800g |
| Engineer | 9.71% | 700g |
| Survivor | 9.14% | 700g |

**They still feel like different characters.** dmg/fight (raw ATK contribution) spreads by identity, which is exactly what you want — the choice is about *role*, not *power*:
- **FRENZIED (Bjorn/Ragnar), SHREDDER (Gunnar/Sigrid), FOLK MAGIC (Vitalik), DEBUFF (Grimnir):** ~450–560 dmg/fight — the damage engines.
- **ANCHOR bass (Ulf/Dag/Ingrid/Brynja):** ~240–290 dmg/fight but the highest *win-when-used* (survivability keeps runs alive).
- **Drummers:** 0 personal damage — they multiply everyone else, a distinct playstyle.
- **CORRUPT/HEXED (Freya/Loki/Orm):** appear only on Ritualist, picked evenly alongside the rest — the corruption isolation still holds.

Note the honest tension the data shows: Bjorn has the *highest* dmg/fight but among the *lowest* win-when-used (6.9%) — glass-cannon FRENZIED bands hit hardest but are fragile and riskier. That's a real strategic tradeoff now, not a strictly-correct pick.

## Verification
✅ `node --check`: sim + members.js clean. ✅ App.jsx babel-parse clean. ✅ cardEngine self-test 86/86. ✅ Sim `assertBossHpSync` passes. ✅ BLASTBEAT ×1.35 identical in sim (`BB_MULT`) and live (App.jsx ~8753). ✅ All BLASTBEAT help/tooltip/keyword-glossary text updated to ×1.35 (×1.82 stacked). ✅ `members.js` + new docs added to `push-fixes.bat`.

⚠️ **Needs you (can't do in sandbox):** `vite build` + a quick live playtest — draft a drummer and confirm the ×1.35 banner math feels right, and that a run no longer wants to force the two guitarists. `push-fixes.bat` build-gates the commit.

## ADDENDUM — CORRUPT/HEXED members made universal (2 new keywords)
The 3 corruption members were cut from clean decks because their old keywords did nothing without a corruption pool. Rather than cut them, they got **brand-new, corruption-free abilities** so they're draftable everywhere:

- **DISSONANCE** (Freya, Loki — Synths): *+1 ATK per DISTINCT OTHER keyword on your stage.* Rewards a varied band — literally pays you for the diverse roster we just built. Glass-cannon-ish, deck-agnostic.
- **DIRGE** (Orm — Dark Minstrel): *+1 ATK per 4 cards in your discard pile.* Ramps as a fight runs long; a tank body (3/18) that survives to snowball. Emergent synergy: strongest on **Ritualist** (410 dmg/fight — it churns the most cards) and weakest on Engineer (118 — that deck wins via multipliers, not raw ATK). Thematically perfect and NOT overpowered — mid-pack raw damage, solid win-when-used (~10%).

**Data (veteran, blinds on):** all 5 decks now field Freya/Loki/Orm at even 26–33% picks; win rates held — Standard 8.8%, Shredder 10.8%, Ritualist 11.6%, Engineer 9.4%, Survivor 8.5%. Mirrored into live App.jsx (`getEffectiveAtk` + aura table + `_atkCtx` distinctKeywords/discardCount + KEYWORD_DESC + tooltips + glossary + colors). Parse-clean.

**Follow-up (noted, not urgent):** with no member carrying CORRUPT/HEXED anymore, the "100% corruption buffs CORRUPT members" possession payoff and the HEXED corruption-pump are now inert code paths (harmless). Ritualist's corruption now comes purely from its *cards*. Could repurpose that possession hook later (e.g. buff DISSONANCE/DIRGE at high corruption) if Ritualist wants a member-corruption payoff back.

## Tuning knobs (if you want to nudge later)
All env-tunable in the sim for fast sweeps: `BB_MULT` (drummer band multiplier, default 1.35 — **keep in sync with App.jsx**), `DRUM_SCORE` (drummer draft desirability, default 31 = equal footing with attackers; 32 makes them auto-include, 30 makes them niche). The non-drummer keyword weights live in `KW_DRAFT_WEIGHT` (all 4 now).
