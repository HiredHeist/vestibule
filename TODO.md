# Vestibule — Master TODO & Design Reference
*Last updated: Friday, March 20, 2026 at 06:43 PM*

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

- [ ] The Miser (360 HP) — may need reduction, steep jump from Devourer (160 HP)
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

## ✅ COMPLETED — Session 10 (March 21 2026)

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
