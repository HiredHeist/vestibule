# Vestibule — Master TODO & Design Reference
*Last updated: Friday, March 20, 2026 at 06:34 PM*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

---

## P1 — NEXT

### 1. Simulator Fix & Run
- [ ] Fix Soundcheck temp buff in sim: origAtk on injured members reverts end-of-strike
- [ ] Fix genShop() in sim: always guarantee recruitment pack (Garage Band 10, Touring 22, Demonic 40)
- [ ] Run 3 x 1M simulations: Expert base, Beginner base, Expert with tiers
- [ ] Generate 4 balance reports + comparison

---

## P2 — BEFORE DEMO

### Known bugs still to fix
- [ ] Any remaining issues from playtest (player had more bugs but couldn't remember them all)
- [ ] Full playthrough stress test — no crashes start to finish
- [ ] Too Stoned / member death clarity
- [ ] Sim AI needs improvement — currently dies at Circle 4 despite player clearing it manually

### Ready to run sim when:
- [ ] Player finishes playtesting and confirms no more critical bugs
- [ ] Sim scaled to 200k runs (not 1M) for faster iteration

---

## P3 — FUTURE
- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives
- [ ] Collection/unlock screen
- [ ] Daily challenge leaderboard
- [ ] Settings menu
- [ ] Steam / mobile / PS release prep
- [ ] A&R Rep bonus stage — second album demand after beating Lucifer

---

## RULE: Update this file every single push, no exceptions.

---

## ✅ COMPLETED

### Session 10 — March 21 2026 (latest)
- ~~**HOVER BUG FIXED** — hovering one Wake Up Call raised both copies. Root cause: hover tracked by card.uid, but same-id cards can have uid collisions on draw. Fixed: hover now tracked by hand INDEX. Positionally correct, immune to duplicate card issues.~~
- ~~**AI combo rewrite** — expertStrike rebuilt from scratch, 9 phases covering every card and combo chain~~
- ~~**Sim recruit pack circle-gated** — was offering 40st Demonic Pack in C1, AI couldn't afford, never recruited~~
- ~~**C1-C3 survival 100%%** — full 5-member band by C4 every run after AI + recruit fixes~~
- ~~**200k sim running** — PID 383, results in /tmp/sim-results.txt~~

### Session 10 — March 21 2026

#### Hover Bug Fix
- ~~**Duplicate card hover bug** — both Wake Up Calls rising when one hovered. Fixed: hover now tracks by hand INDEX not card.uid. Positionally correct, immune to uid issues~~

#### AI Rewrite (Full Combo Logic)
- ~~**expertStrike rewritten from scratch** — reads all 35 cards, understands every combo~~
- ~~**Phase 0**: emergency ember gen when hand is too expensive to play~~
- ~~**Phase 1**: Crowd Surf first (value = hand.length × 2, must play before hand shrinks)~~
- ~~**Phase 2**: Going Broke burst when stash high + enemy low~~
- ~~**Phase 3**: Stage Dive when member HP can kill enemy~~
- ~~**Phase 4**: Full ATK combo — NewStrings/BattleCry × N → Amp → Demo Tape → Encore → Overdrive → PossessedPerf → InfernalEncore~~
- ~~**Phase 5**: Corrupt build — Distortion, Dial to Eleven, FeedbackLoop, AmpStatic, DarkTuning, DeathRiff~~
- ~~**Phase 6**: Direct damage — SoundWall, HeavyRiff, HerbMoney~~
- ~~**Phase 7**: Ember generation for next strike~~
- ~~**Phase 8**: Utility — SoundCheck, WakeUp, Roadie, Séance~~
- ~~**Phase 9**: Mop-up remaining positive-value cards~~
- ~~**cardHeal enemy logic**: minimal plays when enemy heals per card~~
- ~~**Result**: C1-C3 AI survival 100%%, full 5-member band at C4 every run~~

#### Recruit Pack & Circle Gating
- ~~**genRecruitPack takes fightIndex** — Circles 1-2: Garage Band only (10st), C3-4: Garage/Touring, C5+: all~~
- ~~**Sim recruit pack fixed** — was randomly offering 40st Demonic Pack in C1, AI couldn't afford it~~
- ~~**Root cause confirmed**: sim offering wrong packs = no recruits = death. Not a balance issue~~

#### Core Bug Fixes
- ~~**Resonance auto-discard** — was silently eating second copy of any card played. Now only fires with Resonance Coil artifact (a9)~~
- ~~**Hand hard-capped at 6** — excess cards return to deck, no over-soft-cap rendering bugs~~
- ~~**Recruit screen duplicates** — alreadyOn check removed, all duplicates allowed except DOUBLE TIME~~
- ~~**leftBought.rec initialized** — was {cart:false,cpas:false} missing rec key, now {cart:false,cpas:false,rec:false}~~
- ~~**Shift+D dev shortcut** — instant death screen from any screen~~

#### Balance Analysis
- ~~**Confirmed**: 69 HP Drifter beatable with 2 members + good card play~~
- ~~**New wall**: The Miser (F9, 360 HP, Circle 4) — 33%% of deaths~~
- ~~**Best pairs**: FOLK MAGIC+DEBUFF (avg F9), SHREDDER+FRENZIED (avg F8.8)~~
- ~~**Worst pairs**: ANCHOR+ANCHOR (avg F2.8) — two pure supports can't carry~~

#### UI/Font Polish
- ~~**MBScribblesFont** on all HandCard ability text~~
- ~~**Circle header** — bold, glowing orange-red~~
- ~~**Boss HP** — 20% bigger, pulsing red when low~~
- ~~**"The band ran out of herb."** — 60px bright green glow~~
- ~~**Run Statistics box** — 150%% bigger, MBScribblesFont~~

### Previously Completed (Sessions 1-9)
- ~~Full card set (35 cards), all artifacts (a1-a10), all passives (p1-p10)~~
- ~~27 fights, 9 circles, all enemy passives~~
- ~~Mentor Link system (foil/mythic/demonic tiers, bonds, auras, demonic conflict)~~
- ~~Pawn shop, booster + recruitment pack system~~
- ~~Stage drag-and-drop, DOUBLE TIME, Too Stoned, ANCHOR positioning~~
- ~~Opening Night, band synergy, keyword ability descriptions~~
- ~~4 fonts deployed: Bogarts Metal, Scratch, MBScribbles, Break Gothic~~

---

## P1 — READY TO RUN SIM

- [x] Circle-gated recruit packs confirmed working  
- [x] AI combo logic rewritten  
- [x] Hover bug fixed  
- [x] Hand cap working  
- [x] Resonance fixed  
- **→ Run 200k simulation (scaled from 1M for speed)**

## P2 — BEFORE DEMO

- [ ] The Miser (360 HP) may need slight HP reduction — steep jump from Devourer (160 HP)
- [ ] ANCHOR+ANCHOR starting pair is unwinnable — design consideration
- [ ] Full playthrough stress test with real player
- [ ] Any remaining bugs from lost playtest notes

## P3 — FUTURE

- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives  
- [ ] Collection/unlock screen
- [ ] Daily challenge leaderboard
- [ ] Settings menu
- [ ] Steam / mobile / PS release prep
- [ ] A&R Rep bonus stage after beating Lucifer

---

## RULE: Update TODO on EVERY push. No exceptions.

---

## Dev Shortcuts
- **Shift+S** — jump to shop with 69 stash (works from any screen)
- **Shift+D** — jump to death/end screen (works from any screen)

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 0 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight → +1 max ember permanently
- 420 is sacred. Never change card height.
- Stash rewards: circleBaseMin=[2,4,6,8,10,10,12,12,15], circleBaseRange=[3,3,3,3,4,4,5,5,6]

## Enemy HP Scaling
Wanderer 27 > Lost Soul 42 > Drifter 69 > Siren 60 > Seducer 140 > Glutton 80 > Devourer 160
> Miser 360 > Usurer 680 > Wrathful 800 > Warlord 1520 > Heretic 1650 > False Prophet 3000
> Brute 3000 > Executioner 5500 > Archfraud 9600 > Betrayer 11400 > LUCIFER 420,666

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
- Latest stable: see git log
