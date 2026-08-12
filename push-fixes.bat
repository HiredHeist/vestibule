@echo off
REM Safe push helper for the Aug 5 card-fix batch.
REM Build-gated: only commits if vite build succeeds. Stages ONLY our files.
cd /d "%~dp0"

echo Clearing any stale git lock files...
del /q ".git\HEAD.lock" 2>nul
del /q ".git\refs\heads\playtest\session2.lock" 2>nul
del /q ".git\index.lock" 2>nul

echo.
echo Building to verify the code compiles...
call npx vite build
if errorlevel 1 (
  echo.
  echo ***** BUILD FAILED - NOTHING WAS COMMITTED. Fix the errors above and retry. *****
  pause
  exit /b 1
)

echo.
echo Build OK. Staging the fix files only...
git add vestibule-sim-kwstacks.js src/App.jsx src/App.css src/data/cardEval.js src/data/cards.js src/data/cardEngine.js src/data/flavor.js src/data/members.js e2e/autopilot.cjs tune-veteran.mjs STATUS.md TODO.md CLAUDE.md TOMORROW.md SKILL_FINDINGS.md VETERAN_ANALYSIS.md GAMEPLAY_IMPROVEMENTS.md OVERNIGHT_BRIEFING.md VETERAN_DATA_CHART.md ADDICTION_AND_STREAMABILITY.md ROSTER_REBALANCE.md FUN_DOPAMINE_PLAN.md FINAL_AUDIT.md

echo Committing...
git commit -m "Tanuki MIMIC + BLASTBEAT x1.5 (clean number, re-balanced) + spinning faint bg + copy polish" -m "TANUKI: new MIMIC ability (TRICKSTER) - his ATK matches your strongest OTHER member's standing atk (base+perm); copies permanent card buffs but NOT per-strike keyword scaling/temp doublers (that'd be too strong). Replaces his dead aura-copy identity. hp 7->14. Lives in the shared computeStrikeDamage via ctx.mimicStrength (live) + _mimicStrength (sim), so DEALS stays exact. Sim (TEST_TANUKI=1 unlock flag): ~8% win, 100% bot-pick but NOT overpowered (slight sidegrade, trades utility for a mirror) - zero balance risk. BLASTBEAT: x1.35 -> x1.5 (clean number JV wanted). Re-verified now that drummers are fragile (hp 14/11): Standard 2000g veteran+blinds 9.65% win, drummers ~30% pick (NOT the old auto-include) - so 1.5 is balanced again. Reworded all BLASTBEAT copy (dropped the 'no dice'/'flat, no dice' salad; x1.5, 2 drummers = x2.25). UI: background circle logo opacity 0.05->0.03 + slow clockwise spin (bgSpin 140s, keyframe in App.css); removed confusing 'x1.0 score' from Bronze stake desc. babel-parse + node --check clean, npm run check ALL RULES CLEAN, cardEngine 86/86." -m "PRIOR pushed separately (064c5ab): damage unify + DEALS==actual + aura removal + Daily Descent + faint logo." -m "DAMAGE (the big one): extracted ONE pure computeStrikeDamage() as the single source of truth; both the real strike (handleStrikeBody) and the 'DEALS X' preview call it, so they can no longer drift. Fixed the damage-APPLICATION path so the boss's HP drop EXACTLY equals computeStrikeDamage total (impacts remove a capped budget, cascade removes the exact remainder). Added a DEV-only [DEALS-CHECK] assertion. VERIFIED LIVE: DEALS 11 -> boss lost 11; DEALS 28 -> boss lost 28; no assertion fired. This closes the 'preview says 26, boss takes 18' trust bug." -m "AURAS REMOVED (declutter): stripped the neighbor-adjacency aura system (ATK +1 to neighbors, FOLK MAGIC neighbor-heal, ANCHOR neighbor damage-reduction) from App.jsx + sim. KEPT Mentor Link and every keyword's PRIMARY effect (FRENZIED/SHREDDER/DISSONANCE/DIRGE/DEBUFF/BLASTBEAT/FOLK-refill/ANCHOR-save). Removed the ⟡AURA lines from all keyword descriptions/tooltips/glossary. NOTE: Tanuki was aura-copy based -> now placeholder '+1 ATK', needs a new ability (he's locked at 8k, non-urgent). REBALANCE after aura loss: veteran+blinds all 5 decks ~8.25-9.95% (Engineer hpScale 0.90->0.83, Survivor 1.00->0.90; sim DECK_HP_SCALE + live STARTER_DECKS kept identical)." -m "UI: (1) Intro Heat meter -> DAILY DESCENT tile (today's seed + today's best + Play button using the proven daily-launch path). Heat duplicated Difficulty Stake = clutter; the Heat MECHANIC is left dormant in code (vst_heat still read) for a future NG+ mode, only its menu UI swapped. Verified the button launches a daily run. (2) Background circle logo opacity 0.08 -> 0.05 (fainter per JV). babel-parse clean; npm run check ALL RULES CLEAN; cardEngine 86/86. Two unused stub fns (_auraAtkMap/_folkAuraHealMap) left as documented no-ops for later cleanup."

echo Pushing to origin...
git push

echo.
echo ***** DONE. If you see 'DONE' with no errors above, the fixes are pushed. *****
pause
