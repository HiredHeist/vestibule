# VESTIBULE — AI Development Handoff Document
*Last updated: Monday, March 23, 2026 at 03:00 AM (JST) — Session 13 end state*
*This is a living document. Update it at the end of every session.*

---

## 🎯 WHAT IS THIS PROJECT

**Vestibule** is a roguelite card game built in React/Vite. The player builds a metal band and fights through 9 circles of Hell (27 fights), playing RIFF/EMBER/CORRUPT/UTILITY cards to buff members and deal damage. Death is permanent. Target: Steam at $6.66.

Developer = "player" in dev sessions. Music producer, doom metal, lives in rural Japan. It is his game.

**Core loop:** Pick 2 members → Fight → Shop → Fight → Shop → Circle Boss → repeat × 9

---

## 🔧 TECHNICAL SETUP

### Repo
- **GitHub:** github.com/HiredHeist/vestibule (private)
- **PAT:** `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` (expires ~Jun 17 2026)
- **Dev server:** `cd vestibule && npm install && npm run dev` → http://localhost:5173/

### Stack
- React 18 + Vite (single file: `src/App.jsx` ~3700+ lines)
- `src/App.css` — animations and global styles
- No backend — pure client-side
- Claude in Chrome extension → localhost:5173 tab for live monitoring

### Dev Shortcuts
- **Shift+S** — jump to shop with 69 stash
- **Shift+D** — jump to death screen

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire game ~3700+ lines |
| `src/App.css` | Global styles + keyframes |
| `TODO.md` | Master task list — update on every push |
| `HANDOFF.md` | This file |
| `CLAUDE.md` | Dev context, gotchas, mechanics |
| `/home/claude/vestibule-sim.js` | Expert AI simulator v10.0 |

---

## 🎮 LATEST COMMIT STATE

**Latest commit:** `ea8001e` (Session 13, March 22 2026)

### Shipped in Session 13 (11 pushes):
1. ✅ **Usurer HP 680→420** — C4 wall solved
2. ✅ **Remaster stale closure fix** — moved to handleDropOnStage
3. ✅ **C4 Greed rework** — stashScale → stashSteal 1/2/3🌿 per strike, refund on win
4. ✅ **C5 Anger rebalance** — rageScale +1/+1/+2, HP 900/1000/1111
5. ✅ **C8 Fraud rework** — fraudShuffle: discard+redraw 1/2/3 after each strike
6. ✅ **Circle artifacts functional** — ca1 Goat (+1 ATK), ca2 Hellfire (+2 ember), ca3 Crown (revive), ca4 Wailing (x2 first strike)
7. ✅ **Boss damage variance removed** — deterministic, no ±2, no CRIT/miss
8. ✅ **Shop SOLD bugs fixed** — center cards, booster packs, circle artifacts all show SOLD correctly
9. ✅ **Boss UI cleanup** — removed redundant HP, fixed base damage text, styled Combined Attack
10. ✅ **Vintage Amp shop pulls from a1-a10** — 10 artifacts rotate randomly (was only 4 circle artifacts)
11. ✅ **Signal Decay reworked** — "Discard 1, draw 2" at 1 ember
12. ✅ **Groupie buffed** — 1 ember, Uncommon
13. ✅ **Sim v10.0 rebuilt** — all changes synced, ready to run 20k
14-16. ✅ **The Dealer** — Mushrooms (8🌿) & Acid (18🌿) shop items with 10 trip effects
17. ✅ **Card balance** — Seance ÷4, Herb Money keep stash, Wake Up free, Roadie 2 strikes
18. ✅ **C9 rework** — Traitor (Paranoia), Betrayer (Soul Thief), new unique passives
19. ✅ **Lucifer 2-phase** — 420,666→6,666 HP, Phase 1 ice + Phase 2 satan with full reset
20. ✅ **Drug prices** — shrooms 6🌿, acid 12🌿, 50% stock chance
21. ✅ **Death Screen Overhaul** — BestGap, UnlockBar, Discoveries, Share Score, huge Play Again
22. ✅ **Unlock System** — 8 milestones, Tanuki, Lucifer member, Mosh Pit, Blood Ritual, War Drums
23. ✅ **Double Dealer** — hold 2 drugs at 50k lifetime
24. ✅ **Daily Seed + Streak Bonuses** — banner on Opening Night, +5/10/20% score
25. ✅ **Run History** — last 20 runs saved, collapsible on death screen
26. ✅ **Achievement Badges** — 16 achievements, gold NEW badges on death screen
27. ✅ **Near-Miss Mechanics** — almost-killed boss, almost-survived member, almost-cleared circle
28. ✅ **Main Menu** — logo, title, Play/Unlocks/Rules/Options, deck selection placeholder — almost-killed boss, almost-survived member, almost-cleared circle, almost-beat-best
14. ✅ **Seance buffed** — 1 ember, corruption ÷ 4 (was 2 embers, ÷ 8)
15. ✅ **Herb Money reworked** — stash ÷ 2 damage, keep stash (was 10% + lose stash)
16. ✅ **Wake Up Call free** — 0 embers (was 2)
17. ✅ **Roadie 2-strike shield** — stoneShield counter (was 1 strike boolean)

---

## 📊 CURRENT ENEMY PASSIVES (Session 13)

| Circle | Passive | Mechanic |
|--------|---------|----------|
| C1 Limbo | None | Tutorial |
| C2 Lust | selfbuff +1/+2 | Boss gains damage each strike |
| C3 Gluttony | cardHeal 2/3/4 | Boss heals per card played |
| C4 Greed | stashSteal 1/2/3 | Steals herb per strike, refund on win |
| C5 Anger | rageScale +1/+1/+2 | Extra damage per buffed member |
| C6 Heresy | corruptPlayer +10/15/20% | Forces corruption each strike |
| C7 Violence | targetHighestHp 1x/1.5x/2x | Targets highest HP member |
| C8 Fraud | fraudShuffle 1/2/3 | Discards+redraws N cards after strike |
| C9 Treachery | damageScaleAtk | Boss gains ATK per 20 damage taken |

---

## ⛓ MENTOR LINK SYSTEM (fully implemented Session 12)

Foil/mythic/demonic member placed **directly LEFT** of same-id basic = Mentor Link.

| Tier | ATK Bonus | HP Bonus | Strike Multiplier |
|------|-----------|----------|------------------|
| Foil ✨ | +1 ATK | +2 HP | ×1.5 |
| Mythic ✦ | +2 ATK | +4 HP | ×2.0 |
| Demonic ⛧ | +4 ATK | +8 HP | ×3.0 |

---

## 🃏 SCORE SYSTEM (fully implemented Session 12)

```
score = (circleReached × 1000) + (fightsWon × 150) + (totalDamage ÷ 10)
      + (highestStrike × 5) + (stashEarned × 2) - (tooStonedEvents × 50)
      + (win bonus: 50,000)
```

Grades: GARAGE BAND → OPENING ACT → LOCAL LEGEND → TOURING ACT → HEADLINER → CULT LEGEND → ⛧ LUCIFER SLAYER (win only)

---

## 🎴 SHOP SYSTEM

- **Vintage Amp slot:** pulls from STARTER_ARTIFACTS (a1-a10), rotates each circle boss
- **Effect Pedal slot:** pulls from STARTER_PASSIVES (p1-p10), rotates each circle boss
- **Center cards:** 3 random cards, one purchase per card per shop visit
- **Booster packs:** one purchase per pack type per shop visit
- **Recruitment packs:** Garage C1+, Touring C2+, Demonic C4+
- **Circle artifacts (ca1-ca4):** available in boss shops, powerful chase items

---

## 🔴 CURRENT PRIORITIES

1. **Run sim v10.0 at 20k** — get survival curve data
2. **Evaluate War Drums artifact** (+1 Strike) based on sim
3. **Share score button** — clipboard copy
4. **Score display playtest**
5. **Full stress test**

---

## ⚠️ CRITICAL CODE GOTCHAS

1. **React Strict Mode double-fire** — NEVER put addLog/addFloat inside `setX(prev => ...)`. Always outside.
2. **Apostrophes in strings** — use `could not` not `couldn't` in JS strings.
3. **`resonancecard` not `resonance`** — always check actual id field.
4. **Named React imports** — `useState`/`useEffect` NOT `React.useState`.
5. **`selected` in applyCard deps** — MUST be in dep array for Remaster.
6. **`@import` first in CSS** — must be very first line in App.css.
7. **Cards that modify hand/deck** — Setlist, Burnset, Remaster, Signal Decay all handled in `handleDropOnStage` not `applyCard`. This avoids stale closure bugs.
8. **420 is sacred** — never change card height or stash cap.
9. **Update docs on EVERY push** — TODO.md, HANDOFF.md, CLAUDE.md are the bible.

---

## 📝 SESSION HISTORY

| Session | Date | Key Achievements |
|---------|------|-----------------|
| 1–5 | Feb 2026 | Core game built |
| 6 | Feb 2026 | Shop UI, pawn shop, booster packs |
| 7 | Feb 2026 | AI sim, economy rebalance |
| 8 | Feb 2026 | Death screens, Hellquake, Fire & Recruit |
| 9 | Mar 2026 | 13 bugs fixed, balance pass |
| 10 | Mar 21 | Batch 1–3: sold state, death screens, hand over-cap, Setlist, Remaster, Amp Overload |
| 11 | Mar 22 | 9 double-fire bugs, Demo Tape, Distortion +15%, Batch A |
| 12 | Mar 22 | Mentor Link, Hoarder cut, pack odds, score system, grades, personal best, sim v8.0 |
| 13 | Mar 22 | 11 pushes: Usurer cut, Remaster fix, C4/C5/C8 rework, circle artifacts, shop bugs, UI cleanup, Signal Decay rework, Groupie buff, sim v10.0 |

---

*Update this at end of every session. Paste HANDOFF.md + TODO.md into new chat to continue seamlessly.*
