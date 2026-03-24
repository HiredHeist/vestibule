# Vestibule — Master TODO & Design Reference
*Last updated: Tuesday, March 24, 2026 at 7:00 PM (JST) — Session 14*

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



## 🔥 THE BIG 5 — Session 14 Priority Features

### Feature 1: COMBO SYSTEM — "Riff Chains" (16 combos)
- [x] Define 16 two-card synergy combos in RIFF_CHAINS constant
- [x] Track cardsPlayedThisStrike[] array
- [x] Detect combo in applyCard when 2nd synergy card played same strike
- [x] "⛧ RIFF CHAIN ⛧" 64px gold center flash (2.7s) + combo name 36px
- [x] Bonus damage = total stage ATK on combo trigger
- [x] Gold screen border flash + combo color glow
- [x] Combat log shows combo in gold text
- [x] Lifetime combo discovery tracking in localStorage
- [x] All 16 combos implemented: SHRED STORM, HELLFIRE, BLOOD PACT, TRIPLE THREAT, SOUL HARVEST,
      DEATH WISH, ETERNAL ENCORE, CLEAN MACHINE, WALL OF SOUND, FEEDBACK HELL,
      MOSH MADNESS, DARK SACRIFICE, NOISE GATE, POWER SURGE, DEMON CORE, LAST STAND

### Feature 2: CIRCLE BOSS REWARDS — "The Pact"
- [x] Pact screen after each boss kill (before shop)
- [x] 12 possible pact rewards, 2 random offered per circle, never repeat
- [x] Choose one → hover animations + shop transition
- [x] "⛧ Skip — Keep What You Have ⛧" button to decline both
- [x] Pact indicator on stage with emoji icons + hover tooltips
- [x] Max 9 pacts per run (one per circle boss)
- [x] All 12 pact effects wired: Ember Surge, Iron Strings, Thick Skin, Dark Bargain, Speed Demon,
      Blood Price, Clean Living, Corruption Engine, Merchant Eye, Stone Wall, Sixth Slot, War Drums
- [x] Stash tightening: ~15% off C4-C9 base stash rewards (C1-C3 unchanged)

### Feature 3: CIRCLE MAP — "The Descent"
- [x] Map screen before each circle showing 3 fights
- [x] Skip option for fights 1 and 2 (boss always required)
- [x] Skip rewards: 9 small + 9 medium options (stash, ATK, ember, corruption, cards, discards, deck thin)
- [x] Skipping = no shop after that fight (trade shop visit for quick bonus)
- [x] Balatro-style blind selection with FIGHT/SKIP layout + enemy preview
- [x] Veterans skip early circles, new players fight everything
- [x] Descent triggers for ALL circles including C1 (after Opening Night)

### Feature 4: BUILD IDENTITY — "Genre Bonus"
- [x] Track RIFF/CORRUPT/UTILITY/EMBER play percentages per run
- [x] Genre display (color bar + name) on right panel
- [x] 50%+ threshold activates Genre Bonus:
      RIFF METAL (+15% strike dmg), BLACK METAL (+25% corruption dmg),
      PROG ROCK (+1 card draw/strike), DOOM METAL (+2 ATK/member no discards)
- [x] Fix hand size: no cap, draws never shrink hand, Burn the Set uncapped
- [x] Soundboard +1 draw: refill now uses strikeHandSizeRef (tracks hand size at strike start)
- [x] Remove hand size text above hand (clean layout)
- [x] Fix Groupie duplicate card bug (moved to handleDropOnStage with drawUpTo)
- [x] Fix Crowd Surf damage ×2 → ×3 in both handlers
- [x] Fix Herb Money and Smoke Break log messages
- [x] Add combo tracking to all 6 handleDropOnStage special card handlers
- [x] Fix all nested setState bugs: Groupie, Smoke Break, Soundboard, Fraud shuffle, Lucifer reset
- [x] ZERO nested setDeck→setHand patterns remaining in codebase
- [x] Fix strike refill: draw back exactly N cards for N cards played (cardsToDrawRef)
- [x] Hard cap hand size at 10 cards (drawUpTo + strike refill)
- [x] Smoke Break victim counts toward refill draw (2 cards removed = 2 drawn back)
- [x] Fix Sound Wall: scales by circle (C1-3=5, C4-6=8, C7-9=12)
- [x] CORRUPT keyword ATK bonus shown on member cards (3+6 format)
- [x] Deck thinning: "Burn" at Pawn Shop — delete card permanently for free
- [x] Shop genre lean: SKIPPED by design — shop stays random, reroll is the answer
- [x] Opening Night synergy text: deferred — players learn naturally, avoid card clutter
- [x] Genre thresholds: 50% for all types, revisit after playtester feedback
- [x] Unlock gallery rewrite: 6 tabbed sections, 5x5 grid, arrow pagination, Riff Chains combos section
- [x] Descent UI: circle text +15pt, descend button moved to boss card click
- [x] Unlock gallery: 4x2 grid, 50%+ larger icons/text, locked items in gold
- [x] Descent: entire card body clickable to fight, reward tooltips with explanations
- [x] Unlock Cards tab: hover tooltip shows full card preview (280px, type/cost/emoji/name/rarity/effect)

### Feature 5: VICTORY EXPERIENCE — "The Encore" + "Welcome to Hell"
- [x] Lucifer kill cinematic: 5-phase sequence over 10 seconds
      Phase 0: screen darkens. Phase 1 (0.8s): SVG crack lines spread from center.
      Phase 2 (2s): "⛧ THE DEVIL IS DEAD ⛧" 110px red glow reveal.
      Phase 3 (4.5s): band member names rise in gold, staggered 0.3s each.
      Phase 4 (7s): "STAKE CONQUERED" + click to continue.
      Phase 5 (10s): auto-transition to end screen.
      POLISH LATER: crack SVG is placeholder — needs animated canvas/WebGL crack effect
- [x] Score counting animation — already built (eased roll-up, 1800ms, requestAnimationFrame)
- [ ] Victory music track (6th mp3)
- [x] Win-exclusive unlocks per stake: STAKE_UNLOCKS constant, beatStake records to localStorage,
      cinematic shows REWARD UNLOCKED, Victories tab in unlock gallery, God Killer title on menu
- [ ] WELCOME TO HELL bonus fight (replaces "Bonus Circle 10" / "Second Album"):
      Corporate A&R Executive office cutscene (SVG silhouette, typewriter text),
      choice to enter or walk away, 100k HP boss, "contract" mechanic
      (every 2 strikes: play contract = +50% score but lose strongest member)
- [x] Share text enhanced: victory includes band names + ⛧ DEFEATED LUCIFER ⛧ + 🤘



---

## 🎵 MUSIC & SOUND EFFECTS MASTER LIST

### Music Tracks (replace all placeholders)
Current files in public/music/:
- menu.mp3 — Main menu, unlocks gallery, rules, options
- select.mp3 — Opening Night band selection, The Descent map
- battle.mp3 — All combat (C1-C9 fights)
- shop.mp3 — Shop, recruit, Pawn Shop, The Pact screen
- death.mp3 — Death/end screen (losses)

Needed NEW tracks:
- [ ] victory.mp3 — Victory cinematic ("THE DEVIL IS DEAD" sequence)
- [ ] lucifer.mp3 — Lucifer fight only (replace battle.mp3 for fight 25-26)
- [ ] boss.mp3 — Circle boss fights (every 3rd fight, replace battle.mp3)
- [ ] descent.mp3 — The Descent map screen (currently uses select.mp3)
- [ ] pact.mp3 — The Pact reward screen (currently uses shop.mp3)
- [ ] welcome.mp3 — Welcome to Hell bonus fight (A&R Executive)

Track assignments (update TRACK_MAP):
  menu screen → menu.mp3
  unlocks/rules/options → menu.mp3
  Opening Night → select.mp3
  The Descent → descent.mp3 (or select.mp3)
  Regular fights (C1-C8) → battle.mp3
  Circle boss fights → boss.mp3
  C9 fights → battle.mp3 (tense variant?)
  Lucifer fight → lucifer.mp3
  The Pact → pact.mp3 (or shop.mp3)
  Shop/Recruit → shop.mp3
  Victory cinematic → victory.mp3
  Welcome to Hell → welcome.mp3
  Death screen (loss) → death.mp3
  Death screen (victory) → victory.mp3 (continue from cinematic)

### Sound Effects (all need creation)
Card plays:
- [ ] sfx_card_play.mp3 — generic card drop/play (short click/thud)
- [ ] sfx_riff_play.mp3 — RIFF card play (guitar stab)
- [ ] sfx_corrupt_play.mp3 — CORRUPT card play (dark whoosh)
- [ ] sfx_utility_play.mp3 — UTILITY card play (gentle chime)
- [ ] sfx_ember_play.mp3 — EMBER card play (fire crackle)

Combat:
- [ ] sfx_strike.mp3 — Strike button press (heavy drum hit)
- [ ] sfx_hit.mp3 — Damage dealt to boss (impact/crunch)
- [ ] sfx_big_hit.mp3 — Large damage (500+) (explosive impact)
- [ ] sfx_boss_attack.mp3 — Boss hits your band (dark thud)
- [ ] sfx_member_down.mp3 — Member goes Too Stoned (sad guitar slide)
- [ ] sfx_combo.mp3 — Riff Chain triggers (power chord + reverb)

UI:
- [ ] sfx_draw.mp3 — Draw card (paper shuffle)
- [ ] sfx_discard.mp3 — Discard card (toss sound)
- [ ] sfx_ember_gain.mp3 — Gain embers (fire whoosh)
- [ ] sfx_select.mp3 — Card/member selection (click)
- [ ] sfx_hover.mp3 — Hover over interactable (subtle tick) — OPTIONAL
- [ ] sfx_button.mp3 — Button press (UI click)

Shop:
- [ ] sfx_buy.mp3 — Purchase item (cash register/coin)
- [ ] sfx_sell.mp3 — Sell at Pawn Shop (coin drop)
- [ ] sfx_burn.mp3 — Burn card (fire woosh + paper burn)
- [ ] sfx_pack_open.mp3 — Open booster pack (rip/reveal)
- [ ] sfx_reroll.mp3 — Reroll shop (dice/shuffle)

Special:
- [ ] sfx_pact.mp3 — Choose a Pact reward (deep gong/bell)
- [ ] sfx_level_up.mp3 — Max embers +1 after boss (power up)
- [ ] sfx_victory.mp3 — Fight victory (short fanfare)
- [ ] sfx_defeat.mp3 — Run over (low drone/sad chord)
- [ ] sfx_descent.mp3 — Descend button press (gate opening)
- [ ] sfx_shrooms.mp3 — Use mushrooms (psychedelic warble)
- [ ] sfx_acid.mp3 — Use acid (electric zap + echo)
- [ ] sfx_hellquake.mp3 — Black Sabbath Sigil Hellquake (earthquake rumble)
- [ ] sfx_lucifer_intro.mp3 — Lucifer phase transition (demonic roar)
- [ ] sfx_devil_dead.mp3 — "THE DEVIL IS DEAD" cinematic moment (massive chord)

### Music Style Notes
- All tracks should be doom metal / dark ambient / industrial
- Menu: atmospheric, slow, foreboding
- Battle: driving, heavy, rhythmic (120-140 BPM)
- Boss: more intense version of battle, faster
- Lucifer: unique, most epic track, builds tension
- Victory: triumphant but still dark (doom metal victory lap)
- Shop: relaxed, eerie, like being backstage
- Death: melancholic, reflective, slow
- Welcome to Hell: corporate horror, synth + metal fusion

### Balance Tweaks (after Big 5)
- [ ] Demonic: +100% HP → +80% HP (target ~0.5% win rate)
- [ ] Blood: starting corruption 15% → 10% (target ~1.5%)
- [ ] Juice: screen shake, hit sounds, card play sounds, damage number bounce

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

### Additional Features
- [x] ESC pause overlay — options accessible anytime during gameplay
- [x] Music system — 5 tracks (menu, select, battle, shop, death) with crossfade + volume slider
- [x] Circle cleared flash — victory overlay after every fight win, boss kills get full celebration
- [x] Playtester feedback form (.docx, 44 questions, 9 sections)
- [x] Base path /vestibule/ for royceprinting.com deployment
- [x] Responsive ScaleRoot (1920×1080 design, scales to any screen)
- [x] Battle layout rewrite (boss compact, stage 290×360 cards, hand 340px, right panel flex)
- [x] Opening Night layout rewrite (4×2 grid, full-width abilities, uniform card heights)
- [x] FREE badge → 0 ember circle on all cards
- [x] Playtester feedback form (HTML, 44 questions, mailto vomitwizard@gmail.com)
- [x] Dev shortcut Shift+W triggers full victory cinematic (was skipping to end)

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
- [x] Sim v11.1 synced (Wake Up 1 ember, Herb Money 1 ember, Mosh Pit, Blood Ritual)

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

## ✅ SESSION 14 — COMPLETE LOG (March 24, 2026)

### Card Rebalance v12.0 (e2be53a)
- [x] 28 card changes: copies, embers, effects
- [x] 6 mechanic updates: Crowd Surf ×3, Herb Money full stash, Blood Ritual 6×,
      Controlled Feedback full heal, Amp Static ÷10, Wake Up Call no ATK penalty
- [x] Setbreak → Smoke Break rename
- [x] Double Down → shop only
- [x] Deck stays 69 cards, sim v12.0 synced

### Sim v12.0 with Stakes
- [x] Sim supports all 6 stakes: node vestibule-sim.js 50000 silver
- [x] Bronze 12.78%, Silver 7.37%, Gold 4.03%, Obsidian 2.26%, Blood 0.86%, Demonic 0.01%

### Opening Night Polish
- [x] Boss area +20px, stage -22px, combined attack bar tighter
- [x] FREE badge → 0 ember circle on all cards
- [x] Full-width ability box (960→1700px), uniform member card heights
- [x] 4×2 grid centered, fixed scaling, solid background (no border bleed)
- [x] Text sizes increased: title, roles, abilities, member names

### Feature 1: Riff Chains (97e7380)
- [x] 16 two-card combos with visual feedback (2.7s flash)
- [x] Bonus damage = total stage ATK
- [x] Lifetime discovery tracking in localStorage

### Feature 2: The Pact (d1e4387)
- [x] 12 boss rewards, all effects wired
- [x] Skip button, pact indicators on stage

### Feature 3: The Descent (cc24ccf → a6ed30c)
- [x] Circle map with FIGHT/SKIP layout
- [x] 18 skip rewards (9 small + 9 medium)
- [x] Triggers for all circles including C1
- [x] bonusDiscards + bonusEmbers state wired

### Bug Fixes
- [x] Hand size: no cap, draws never shrink hand
- [x] All nested setState eliminated (Groupie, Smoke Break, Soundboard, Fraud, Lucifer)
- [x] Strike refill: draw back exactly N cards played (cardsToDrawRef)
- [x] Crowd Surf ×2 → ×3, Herb Money log, Smoke Break log
- [x] Sound Wall scales by circle not fightIndex
- [x] CORRUPT keyword ATK bonus shown on member cards (3+6 format)
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
