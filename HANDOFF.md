# HANDOFF — July 30, 2026 (bot-playtest era begins)

*Fresh-chat bootstrap. Read this + CLAUDE.md and you're fully armed. No other context needed.*

---

## 🔑 GIT — GET WORKING IN 60 SECONDS

```bash
# JV pastes a GitHub PAT into the chat (fine-grained, repo-scoped). NEVER commit it —
# GitHub push-protection blocks pushes containing PAT strings.
git clone https://x-access-token:<PAT>@github.com/HiredHeist/vestibule.git /home/claude/vestibule
git checkout playtest/session2   # active work branch
npm install && npm run build
```

- **main** — stable; everything below is merged into it as of this handoff.
- **playtest/session2** — bot-rig WIP + continuous checkpoints. Commit early, commit often (a dead chat once cost hours; branch checkpoints are the fix).
- **gh-pages** — public demo. DO NOT deploy without JV's explicit go.
- Commit style: short imperative subject + paragraph body. Every code commit updates TODO.md (cardinal rule, see CLAUDE.md).

## 🤖 THE BOT RIG (e2e/) — WHAT IT IS AND HOW TO RUN IT

An autonomous player: Electron (game at localhost:4173, CDP :9222) under Xvfb, driven by Playwright.

```bash
bash e2e/up.sh                                  # boot/repair vite preview + Electron (idempotent)
node e2e/pilot.cjs state|shot NAME|click X Y|clicktext TXT|playcard CX CY TX TY|eval JS
setsid nohup node e2e/autopilot.cjs 240 > /tmp/autopilot.out 2>&1 < /dev/null &   # grind 240 min
tail -f e2e/session3-events.jsonl               # live decision ledger (JSONL)
```

**Hard-won rig lessons (do not relearn these):**
1. **Play cards via QUICK-PLAY**: click card, then click member (game's quickPlayCardUid path). NEVER mouse-drag — HTML5 draggable cards start a native drag loop that swallows CDP input and hangs. xdotool/XTEST does not reach Electron either. pilot.playCard() does it right.
2. Synthetic JS events (dispatchEvent) do not register — CDP trusted input only.
3. Re-read the hand after every play (cards re-fan). Hover-zoom is turned OFF via player options at autopilot start.
4. Every pilot op has a 20s timeout; 3 consecutive timeouts triggers rig self-heal (restart Electron, reconnect — game resumes from vst_save).
5. Kill the bot with: for p in $(pgrep -f 'autopilot[.]cjs'); do kill -9 $p; done  — a plain pkill -f matches your own shell and kills it (exit 144).
6. Two bots on one rig = input deadlock. ONE instance, always.
7. npm run build while the rig runs kills preview+Electron — rerun bash e2e/up.sh after.

**Autopilot brain (autopilot.cjs):** state machine (menu/draft/descent/combat/shop/recruit/modal/event/death). Economy ported from simShop() in vestibule-sim-kwstacks.js: members-first packs (Welcome, Garage, Touring at C2+, Demonic at C4+), sim memberScore for draft+recruit picks, relic+pedal per circle, shrooms>=16 / acid>=22 stash reserves, mid-fight panic trips (<=2 strikes left, boss >45%). Verified end-to-end 03:35 UTC July 30: shop buy -> recruit pick (Gunnar) -> Wanderer killed with a 59-dmg strike.

## 🎯 THE MISSION (agreed with JV, unchanged)

Bronze + Standard, tutorial skipped, legit full run to a Lucifer kill. No Shift+W / HP edits in scoring runs (debug keys OK in rig-test sessions only). Fix-as-found with best judgment, flag for joint review. Failed-run data preserved. One report at the end: bugs, fixes, run-by-run data, gameplay recommendations. **Overnight grind awaits JV's explicit go.**

## ✅ STATE OF THE CODE (audited July 30, ~03:40 UTC)

- npm run check — ALL RULES CLEAN (fixed one pre-existing 12px font, App.jsx ~10482)
- build clean · game console clean across ~20 bot runs (only headless audio-device noise)
- sim duplicate keys FIXED (were benign: forgeUpgrades:0 twice in TRACK, artifacts/passives twice in newGame — same values, no mis-modeling)
- duplicate-style-attr JSX warning: not reproducible on current code — closed
- death-screen killing-blow fix (465f2b5) verified live in production

## ⚠️ OPEN QUESTIONS / WATCH LIST

1. **Sim discrepancy (flag for JV):** fresh 2K sim, Bronze/Standard = **39.95% Lucifer wins**, but the July 29 audit doc claimed "8.3–11.8%, target ~10%". Same code, different numbers — the old sweep's params are unknown. Re-run the per-deck sweep and reconcile before any balance decisions.
2. **Wanderer 84 HP is NOT a regression** — false alarm from July 30 session. maxHp:45 training wheels intact; 84 = 45 x 1.85 Standard hpScale, same math as May. (Kept here so nobody re-flags it.)
3. Relic tile showed SOLD in a shop where the bot bought nothing (possible stale circleArtBought across save/reload, echoes the v0.7.4 bug family) — unconfirmed, watch for repro in ledger screenshots.
4. Member cards show base ATK while auras boost effective ATK (card "4", breakdown "5") — UX fix wanted (aura chip), not yet done.
5. Setlist says "Draw 3" but hand cap can make it draw fewer (modal is honest). Minor text call.
6. Bot skill ceiling: play_fail noise remains (occasional misclicks); good enough to grind, not yet optimal.

## 📊 RUN DATA SO FAR

~20 legit Bronze/Standard runs, 0 wins, deepest = Circle I boss (Drifter at 28/629 HP — one strike short). Most deaths at fights 1–2 during the broken-input era (bot could not actually play cards; data before 03:30 July 30 is NOT representative of balance). Post-fix runs kill the Wanderer reliably. Full ledger: e2e/session3-events.jsonl + /tmp/shots/.

## SACRED CONSTANTS (unchanged)
420 stash cap / 69 deck size / BogartsMetalFont NO digits / MBScribblesFont default / ScratchFont 20pt+ flavor / React Strict Mode: no side effects in updaters.
