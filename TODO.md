# Vestibule — Master TODO & Design Reference
*Last updated: Monday, March 23, 2026 at 05:00 AM (JST) — Session 13*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

---

## 🔴 THE ADDICTION STACK — 7 Layers (in priority order)

### Layer 1: Death Screen Overhaul ✅ COMPLETE
- [x] **A) Score + Personal Best gap** — "YOUR BEST: 14,200 — YOU NEED 1,780 MORE" in big red. Near-miss > win.
- [x] **B) Unlock progress bar** — "NEXT UNLOCK: 2,340 / 5,000 pts" with mystery silhouette. Lifetime cumulative.
- [x] **C) Run discoveries** — "NEW: First time reaching Circle 7! First Hellquake!" Permanent progress feeling.
- [x] **D) One-tap restart** — HUGE glowing pulsing Play Again button. Restarting = the obvious default.

### Layer 2: Share Score Button ✅ COMPLETE
- [x] **Clipboard copy** — "⛧ VESTIBULE — RUN #47 ⛧ SCORE: 12,420 — HEADLINER — Fell to Warlord at C5 — Can you beat this?"
- [x] Format for Discord/Twitter/Reddit (emoji, short, punchy)

### Layer 3: Unlock System ✅ COMPLETE
- [x] 1,000 pts → New card: Mosh Pit (RIFF)
- [x] 3,000 pts → Unlock Vitalik (FOLK MAGIC) in pack pool
- [x] 5,000 pts → 6th artifact slot
- [x] 10,000 pts → New card: Blood Ritual (CORRUPT, Rare)
- [x] 15,000 pts → Brynja available as Foil in packs
- [x] 25,000 pts → Demonic Pack from C3 (was C4)
- [x] 50,000 pts → ??? (locked silhouette)
- [x] 100,000 pts → Lucifer as playable member

### Layer 4: Daily Challenge + Streak Bonuses ✅ COMPLETE
- [x] **Daily seed banner** — "TODAY'S SEED: 4F2A" on start screen, one attempt locked
- [x] **Streak bonuses** — 3-day +5% score, 7-day +10% + border, 30-day Veteran badge
- [x] Daily streak counter (already built)

### Layer 5: Run History ✅ COMPLETE
- [x] Past Runs screen — last 20 runs: score, grade, death cause, circle, discoveries

### Layer 6: Achievement Badges ✅ COMPLETE
- [x] 16 achievements defined (first_blood, circle milestones, beat_lucifer, hellquake, perfect_strike, corruption_lord, sober_run, drug_lord, full_band, mentor_link, high_score_5k/10k, ten_runs, dedicated)
- [x] localStorage persistence (vst_achievements)
- [x] Triggers wired throughout game logic
- [x] Gold pulsing NEW badges on death screen
- [x] Achievement count shown (X / 16)

### Layer 7: "Almost" Mechanics ✅ COMPLETE
- [x] "X more damage would have killed [boss]!" — when boss HP < 30% of highest strike or < 200
- [x] "[Member] was just X HP from surviving!" — for members who died within 10% maxHP
- [x] "One more fight would have cleared Circle X!" — when died on fight 2 of 3
- [x] "Just X pts from your personal best!" — when within 500 pts
- [x] Shows up to 3 near-miss messages, italic orange, emotional

### Layer 8: Main Menu / Intro Screen ✅ COMPLETE
- [x] **Logo** — vestibule_logo.png (white on transparent) as hero + background
- [x] **Title** — BogartsMetalFont 96px, red glow, tagline
- [x] **Play button** — huge pulsing 'Enter the Vestibule'
- [x] **Deck selection** — 'Demo Deck' placeholder (more decks coming)
- [x] **Unlocks gallery** — all 8 milestones with progress bars, locked silhouettes
- [x] **Rules screen** — 10 rules covering all mechanics
- [x] **Options** — scanlines on/off, reset progress with confirm
- [x] **Stats row** — lifetime score, runs, streak, personal best

### Layer 9: Difficulty Stakes ✅ COMPLETE
- [x] **Stake 1: Bronze** — default difficulty, ×1.0 score
- [x] **Stake 2: Silver** — bosses +15% HP, enemies +1 dmg, ×1.5 score
- [x] **Stake 3: Gold** — bosses +30% HP, +2 dmg, shop +25%, ×2.0 score
- [x] **Stake 4: Obsidian** — +50% HP, no post-fight heal, drugs +50%, ×2.5 score
- [x] **Stake 5: Blood** — +75% HP, +3 dmg, 4 start embers, 15% start corruption, ×3.0 score
- [x] **Stake 6: Demonic ⛧** — +100% HP, +4 dmg, 3 max strikes, 15% bad trip, ×4.0 score
- [x] Stake selector on main menu (color-coded, locked until previous beaten)
- [x] Stake badge on death screen + share score
- [x] Score multiplier wired: Bronze 1x → Demonic 4x
- [x] Beat Lucifer to unlock next stake (beatStake on victory)
- [x] All modifiers wired: hpMult, dmgAdd, startEmbers, startCorruption, healAfterFight, maxStrikes

---

## ✅ COMPLETED TONIGHT

### Addiction Stack (ALL 9 LAYERS COMPLETE)
- [x] Layer 1: Death Screen Overhaul (BestGap, UnlockBar, Discoveries, Share, huge Play Again)
- [x] Layer 2: Share Score Button (clipboard, formatted for Discord/Twitter)
- [x] Layer 3: Unlock System (8 milestones + Double Dealer at 50k + Tanuki + Lucifer member)
- [x] Layer 4: Daily Seed + Streak Bonuses (banner, +5/10/20% score)
- [x] Layer 5: Run History (last 20 runs, collapsible on death screen)
- [x] Layer 6: Achievement Badges (16 achievements, gold pulsing NEW badges)
- [x] Layer 7: Almost Mechanics (near-miss messages)
- [x] Layer 8: Main Menu (logo, Unlocks gallery, Rules, Options, deck placeholder)
- [x] Layer 9: Difficulty Stakes (6 tiers Bronze→Demonic, all modifiers wired)

### Bug Fixes
- [x] Card multi-select on overlapping cards (stopPropagation + unique z-index)
- [x] Combined Attack display rounding (Math.round→Math.floor to match combat)
- [x] MAX_STRIKES hardcoded in 14 places → activeStake.maxStrikes (Demonic stake compatible)
- [x] FALLEN healing exclusion on ANCHOR + P2 Roadie Crew
- [x] Drug prices: shrooms 8→6, acid 18→12, stock 69%→50%
- [x] Wake Up Call 0→1 ember, Herb Money 2→1 ember

### Sim + Balance
- [x] Sim v10.0 + v11.0 run (100k + 20k games)
- [x] Lucifer 2-phase boss (420,666 → 6,666 HP) — 5.01% win rate
- [x] C9 rework (Paranoia + Soul Thief)
- [x] The Dealer (shrooms 6🌿 + acid 12🌿, 50% stock)
- [x] Card balance: Seance, Herb Money, Wake Up Call, Roadie, Signal Decay, Groupie
- [x] All card buffs confirmed via sim

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
- [x] Re-sim 20k — sim v11.0 complete
- [x] War Drums artifact — unlockable at 5k lifetime
- [x] Lucifer 2-phase boss — 420,666→6,666 HP (8 boss kills), Phase 1 ice/Phase 2 satan

---

## 🏆 P1 — SCORE SYSTEM

- [x] Score formula, death screen display, count-up animation
- [x] Grade tiers: GARAGE BAND → LUCIFER SLAYER (win only)
- [x] Personal best in localStorage
- [x] Run number, daily streak
- [x] Share score button — clipboard copy on death screen

---

## 🔥 P1 — DAILY CHALLENGE + STREAK

- [x] Daily streak counter — 🔥 N DAY STREAK
- [x] Daily seed banner on Opening Night
- [x] Daily attempt locked
- [x] Share score button

---

## 🔓 P2 — UNLOCK SYSTEM

- [x] Unlock milestone teaser on death screen
- [x] Lifetime score tracking (cumulative)
- [x] Milestone unlocks: Mosh Pit 1k, Vitalik 3k, artifact slot 5k, A11-A20 10k, Lucifer's Guitarist 25k
- [x] Achievement unlocks — 16 achievements

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

### Push 13-16: The Dealer — Mushrooms & Acid
- [x] Dealer section in shop (top row, first card position)
- [x] Magic Mushrooms: 8 herb, 69% stock, hold 1 at a time
- [x] Blotter Acid: 18 herb, 69% stock, hold 1 at a time
- [x] USE buttons on battle screen (always visible, greyed when empty)
- [x] Hover tooltips explaining effects
- [x] SOLD overlay after purchase
- [x] Trip effects: 4 shroom (Ego Death/Time Dilation/Synesthesia/Cosmic Unity)
- [x] Trip effects: 4 acid (Fractal Vision/Dimensional Rift/Ego Dissolution/Astral Projection)
- [x] fightTripBuff persists entire fight (critical bug fix — was expiring after 4s overlay)
- [x] Reroll button rerolls dealer stock
- [x] Shop UI: dealer first, cost ovals, right column fixed, stash/reroll aligned

### Push 17: C9 rework + Lucifer 2-phase boss
- [x] Traitor: Paranoia — 1 member refuses to attack, deals 3 to ally
- [x] Betrayer: Soul Thief — steals 1 ATK/strike, returned on victory
- [x] Lucifer: 420,666 HP displayed, reduced by 8 boss kills (8×51,750 = -414,000 → 6,666)
- [x] Phase 1: Frozen in Cocytus (3,333 HP) — frostbite 3 all + ATK scales +1/20dmg
- [x] Phase transition: full band reset (HP, embers, strikes, discards, trip)
- [x] Phase 2: Satan (3,333 HP) — AoE split + ATK scales +2/20dmg + immune to debuff
- [x] Cinematic overlays for both phases

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
