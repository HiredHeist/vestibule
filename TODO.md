# Vestibule — Master TODO & Design Reference
*Last updated: Sunday, March 22, 2026 at 11:00 PM (JST) — Session 13*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

---

## 🔴 TONIGHT — REMAINING TASKS

- [ ] **Run sim v10.0 at 20k** — all Session 13 balance changes are in, need survival curve data
- [ ] **Evaluate War Drums artifact** — +1 Strike permanently, C4+ shop, 35🌿. Only if sim says we need it for 6.66% Lucifer win rate
- [ ] **Share score button** — "Vestibule RUN #N — SCORE: X — Fell to Y at CZ — SEED: ABC" → clipboard
- [ ] **Score display playtest** — play a real run to death, verify score renders (Shift+D uses dummy data showing 0)
- [ ] **Full playthrough stress test** — clean run start to finish, verify no bugs
- [ ] **Target:** ~6.66% Lucifer win rate

---

## 🔴 P1 — UNBLOCK THE GAME

- [x] Hoarder HP 480→300 (Session 12)
- [x] Usurer HP 680→420 (Session 13)
- [x] Mentor Link fully implemented (Session 12)
- [x] C4 Greed rework — stashSteal 1/2/3🌿 per strike, refund on win (Session 13)
- [x] C5 Anger rebalance — rageScale +1/+1/+2, HP 900/1000/1111 (Session 13)
- [x] C8 Fraud rework — fraudShuffle discard+redraw 1/2/3 (Session 13)
- [x] Circle artifacts ca1-ca4 wired into fight logic (Session 13)
- [x] Sim v10.0 rebuilt and synced (Session 13)
- [ ] Re-sim 20k — awaiting go-ahead
- [ ] War Drums artifact — discuss after sim data
- [ ] Lucifer phase system (P2) — 3 phases × 140,222 HP. DISCUSS before implementing.

---

## 🏆 P1 — SCORE SYSTEM

- [x] Score formula, death screen display, count-up animation
- [x] Grade tiers: GARAGE BAND → LUCIFER SLAYER (win only)
- [x] Personal best in localStorage
- [x] Run number, daily streak
- [ ] Share score button — clipboard copy, free marketing

---

## 🔥 P1 — DAILY CHALLENGE + STREAK

- [x] Daily streak counter — 🔥 N DAY STREAK
- [ ] Daily seed banner on Opening Night
- [ ] Daily attempt locked
- [ ] Share score button

---

## 🔓 P2 — UNLOCK SYSTEM

- [ ] Unlock milestone teaser on death screen
- [ ] Lifetime score tracking (cumulative)
- [ ] Milestone unlocks: Loki 1k, Vitalik 3k, artifact slot 5k, A11-A20 10k, Lucifer's Guitarist 25k
- [ ] Achievement unlocks (one-time triggers)

---

## ✨ P2 — POLISH + ANIMATIONS

- [ ] Circle complete flash — "⛧ CIRCLE I CLEARED ⛧"
- [ ] Lucifer boss intro cinematic
- [ ] Death screen boss slam-in
- [ ] Deck variant starting options (Balatro-style: 5S/3D vs 3S/5D)

---

## 🃏 P2 — CARD BALANCE (remaining)

- [x] Signal Decay reworked — "Discard 1, draw 2" at 1 ember
- [x] Groupie buffed — 1 ember, Uncommon
- [x] Wake Up Call: 2 embers → 0 (free revival)
- [x] Roadie: immune 1 strike → immune 2 strikes (stoneShield counter)
- [x] Seance: 2 embers → 1, corruption ÷ 8 → corruption ÷ 4 (rewards high corruption)
- [x] Herb Money: deal stash ÷ 2 as damage, keep stash (was 10% + lose stash)

---

## 🌐 P3 — ONLINE LEADERBOARD

- [ ] Weekly leaderboard, two categories, seed replay, no account required

---

## P3 — FUTURE

- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives
- [ ] Collection/unlock screen, settings menu
- [ ] Steam / mobile / PS release prep
- [ ] A&R Rep bonus stage after beating Lucifer

---

## 📊 CURRENT ENEMY HP + PASSIVES (Session 13)

```
C1 Limbo:    Wanderer 27 → Lost Soul 42 → Drifter 69          [no passive]
C2 Lust:     Siren 60 → Tempter 90 → Seducer 140              [selfbuff +1/+1/+2 per strike]
C3 Gluttony: Glutton 80 → Feaster 110 → Devourer 160          [cardHeal 2/3/4 per card played]
C4 Greed:    Miser 260 → Hoarder 300 → Usurer 420             [stashSteal 1/2/3 per strike]
C5 Anger:    Wrathful 900 → Berserker 1000 → Warlord 1111     [rageScale +1/+1/+2 per buffed member]
C6 Heresy:   Heretic 1650 → Apostate 2175 → False Prophet 3000 [corruptPlayer +10/+15/+20% per strike]
C7 Violence: Brute 3000 → Hunter 4000 → Executioner 5500      [targetHighestHp, 1x/1.5x/2x dmg]
C8 Fraud:    Trickster 5200 → Deceiver 6800 → Archfraud 9600  [fraudShuffle 1/2/3 cards after strike]
C9 Treachery: Traitor 9000 → Betrayer 11400 → LUCIFER 420,666 [damageScaleAtk per 20 dmg taken]
```

---

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 3 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight → +1 max ember permanently
- **420 is sacred. Never change card height.**

---

## ✅ SESSION 13 — COMPLETE LOG (March 22 evening)

### Push 1: Remaster fix + Usurer HP — 4ebb456
- [x] Usurer HP 680→420
- [x] Remaster stale closure fix — moved to handleDropOnStage

### Push 2: TODO update — 3350a52
- [x] Updated TODO.md with Session 13 progress

### Push 3: C4 + C5 balance + variance removal — ae3363f
- [x] C4 stashSteal 1/2/3🌿 per strike (replaces stashScale)
- [x] Stolen stash refunded on win
- [x] C5 rageScale +2/+3/+4 → +1/+1/+2
- [x] C5 HP 800/1040/1520 → 900/1000/1111
- [x] Boss damage variance removed (deterministic)
- [x] CRIT/miss labels removed

### Push 4: Circle artifact SOLD bug — 1b0c15e
- [x] CIRCLE_ARTIFACTS given IDs (ca1-ca4)
- [x] Sold check verifies against activeArtifacts

### Push 5: Boss UI cleanup — 097cae4
- [x] Removed redundant HP numbers next to boss name
- [x] Removed ± 2 from base damage text
- [x] Combined Attack: title case, golden arrow

### Push 6: Center shop cards SOLD fix — 38d2972
- [x] Cards show SOLD after purchase (uid||id fallback)

### Push 7: Combined Attack font — 76490ad
- [x] Combined Attack + boss name: 27px matched, number 42px

### Push 8: Booster pack SOLD — 3177d7a
- [x] Booster packs once per shop visit with SoldOverlay

### Push 9: Base damage text size — a04b150
- [x] Base damage text 18px → 29px

### Push 10: C8 Fraud + Circle artifacts — 3a77cf7
- [x] C8 fraudShuffle: discard+redraw 1/2/3
- [x] CA1 Goat of Mendes: +1 ATK all at fight start
- [x] CA2 Hellfire Amulet: +2 Embers at fight start
- [x] CA3 Sabbath Crown: revive Too Stoned at 50% HP after each strike
- [x] CA4 Wailing Guitar: first strike DOUBLE damage

### Push 11: Shop artifacts + card balance — ea8001e
- [x] Vintage Amp shop slot now pulls from a1-a10 (was only ca1-ca4)
- [x] Signal Decay reworked: "Discard 1, draw 2" at 1 ember
- [x] Groupie buffed: 1 ember, Uncommon
- [x] Sim v10.0 rebuilt with all changes

### Push 12: Card balance batch — 4 cards
- [x] Seance: 2 embers → 1, corruption ÷ 8 → corruption ÷ 4
- [x] Herb Money: stash ÷ 2 damage, keep stash (was 10% + lose stash)
- [x] Wake Up Call: 2 embers → 0
- [x] Roadie: immune 2 strikes (stoneShield counter, was boolean)

---

## ✅ SESSION 12 LOG (March 22 daytime)
- Mentor Link system, Hoarder HP cut, pack odds, score system, grades, personal best, daily streak, sim v8.0

## ✅ SESSIONS 1–11
- Core game, shop, sim, death screens, 13 bugs fixed, balance pass, double-fire fixes, Demo Tape, Distortion +15%

---

## Dev Shortcuts
- **Shift+S** — shop with 69 stash
- **Shift+D** — death screen (dummy stats)

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)

## RULE: Update TODO, HANDOFF, and CLAUDE.md on EVERY push. No exceptions. Always use JST time.
