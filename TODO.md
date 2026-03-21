# Vestibule — Master TODO & Design Reference
*Last updated: Saturday, March 21, 2026 at 01:15 PM*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

---

## P1 — NEXT (in order)

### 1. Playtest remaining bugs
- [ ] Drop bugs in chat as you remember them from the lost playtest notes
- [ ] Full playthrough stress test — no crashes start to finish
- [ ] Too Stoned / member death clarity

### 2. Run 200k sim (when player says go)
- [ ] node vestibule-sim.js 200000
- [ ] Review report — tune Miser HP if data supports it

---

## P2 — BEFORE DEMO

- ~~**The Miser HP 360→260** — data confirmed: median F9 damage is 192, 360 was top-10% only. Now 34%% survival rate~~
- [ ] ANCHOR+ANCHOR starting pair unwinnable — design consideration
- [ ] Any remaining bugs from lost playtest notes

---

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

## ✅ COMPLETED — Session 10

- ~~**Fire & Recruit panel** — when stage is full (5/5) on recruit screen, a fire panel appears bottom-right showing all members with sell prices. Fire one to open a slot, recruit cards light up instantly. Subtitle changes to explain the situation.~~


- ~~**Stage Dive** 2→1 copy — once per fight, 2nd copy was always dead~~
- ~~**Signal Decay** 2→1 copy — anti-synergy in corrupt builds, 1 is enough~~
- ~~**Controlled Feedback** 2→1 copy — too niche to appear twice~~
- ~~**The Remaster** 2→1 copy — powerful deck surgery, twice was too much~~
- ~~**Power Tap** +1→+2 embers (free) — +1 was nearly useless~~
- ~~**Groupie** net+1 ember → +2 embers + draw 1 card immediately~~
- ~~**Setbreak** random discard → player selects card to discard first, then plays~~
- ~~**Roadie** immune only → immune + heal 2HP (always useful now)~~
- ~~**Distortion** +10%%→+15%% corruption (competes better with Dial to Eleven)~~
- ~~**Static Charge** simplified: +2 embers always, +4 if corruption = 0%%~~


- ~~**Burn the Set reworked** — was: discard whole hand draw 6. Now: 1 ember, select up to 3 cards to discard, draw that many +1~~
- ~~**Hand over-cap display** — 7 of 6 ⚡ label, cards spread wider when over-cap so they are all reachable~~
- ~~**Hellquake explainer text** — all 10 outcomes now show a plain-English description below the title~~


- ~~**Starting stash 3🌿** — was 0, now guarantees Garage Band Pack after fight 1~~
- ~~**stealStash passive removed** — Miser/Hoarder/Usurer no longer steal herb on hit~~
- ~~**stashScale passive added** — Circle IV enemies hit harder based on stash carried (incentivises spending before fighting)~~


- ~~**Herb economy rebalanced** — C1 stash: 2-4 base → 8-10 base. Garage Band Pack (10🌿) now affordable after fight 1. C1 deaths dropped from 7.6%% to 0.2%% in sim~~
 (March 21 2026)

- ~~**Hover bug** — both same-id cards (e.g. Wake Up Call x2) rising on hover. Fixed: hover now tracked by hand INDEX not card.uid~~
- ~~**AI combo rewrite** — expertStrike rebuilt, 9 phases, all 35 cards and combos understood~~
- ~~**Recruit pack circle-gated** — C1-C2: Garage Band only (10st), C3-4: Garage/Touring, C5+: all~~
- ~~**Sim recruit pack fixed** — was offering 40st Demonic Pack in C1, AI couldn't afford~~
- ~~**C1-C3 AI survival 100%** — full 5-member band by C4 every run~~
- ~~**Resonance auto-discard bug** — only fires with Resonance Coil artifact (a9) now~~
- ~~**Hand hard-capped at 6** — excess cards return to deck~~
- ~~**Recruit screen duplicates allowed** — only DOUBLE TIME drummer blocked~~
- ~~**leftBought.rec initialized** — recruit pack sold state persists correctly~~
- ~~**Shift+D dev shortcut** — instant death screen from any screen~~
- ~~**Stash buff reverted** — original values correct, Drifter (69 HP) beatable with 2 members~~

## ✅ COMPLETED — Sessions 1-9

- ~~Full card set (35 cards), all artifacts (a1-a10), all passives (p1-p10)~~
- ~~27 fights, 9 circles, all enemy passives~~
- ~~Mentor Link — foil/mythic/demonic tiers, bonds, auras, demonic conflict~~
- ~~Pawn shop — sell members + cards, max 2 sales, SOLD stamp~~
- ~~Booster + recruitment pack system~~
- ~~Stage drag-and-drop, DOUBLE TIME, Too Stoned, ANCHOR positioning~~
- ~~Opening Night — keyword ability descriptions, band synergy~~
- ~~4 fonts: Bogarts Metal, Scratch, MBScribbles, Break Gothic~~
- ~~End screen — green glow death message, stats 150% bigger~~
- ~~Boss HP pulsing red, circle header glowing~~

---

## Dev Shortcuts
- **Shift+S** — shop with 69 stash (any screen)
- **Shift+D** — death/end screen (any screen)

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 0 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight → +1 max ember permanently
- 420 is sacred. Never change card height.
- Stash rewards: circleBaseMin=[2,4,6,8,10,10,12,12,15], circleBaseRange=[3,3,3,3,4,4,5,5,6]

## Enemy HP Scaling
Wanderer 27 > Lost Soul 42 > Drifter 69 > Siren 60 > Seducer 140 > Glutton 80 > Devourer 160
Miser 360 > Usurer 680 > Wrathful 800 > Warlord 1520 > Heretic 1650 > False Prophet 3000
Brute 3000 > Executioner 5500 > Archfraud 9600 > Betrayer 11400 > LUCIFER 420,666

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
- Shift+S = shop | Shift+D = death screen
