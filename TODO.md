# Vestibule — Master TODO & Design Reference
*Last updated: Friday, March 20, 2026 at 08:24 PM*

---

## P1 — NEXT (in order)

### 1. Pawn Shop Sell UI
- [ ] Test Open Pawn Shop button — modal should show members + cards tabs, sell prices, bond-breaking
- [ ] Verify max 2 sales per visit enforced

### 2. Simulator Fix & Run
- [ ] Fix Soundcheck temp buff: set origAtk on injured members so +1 ATK reverts end-of-strike
- [ ] Fix genShop() in simulator: always guarantee recruitment pack (Garage Band 10, Touring 22, Demonic 40)
- [ ] Run 1M simulations — generate full balance report

---

## P2 — FUTURE
- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives
- [ ] Collection/unlock screen
- [ ] Daily challenge leaderboard
- [ ] Settings menu
- [ ] Font swap (owner providing TTF files)
- [ ] Steam / mobile / PS release prep

---

## RULE: Update this file every push
Every time code is pushed to GitHub, update this file with:
- New timestamp in the title
- Newly completed items moved to the COMPLETED section with strikethrough
- Any new tasks added if discovered during the push

---

## ✅ COMPLETED

### Session 9 — March 20 2026 (today)
- ~~**Pawn Shop modal** — full sell UI with Members + Cards tabs, sell prices, bond-breaking, max 2 sales~~
- ~~**handlePawnSellCard** — selling a card removes one copy from deck, adds stash~~
- ~~**Demo Tape fix** — recursive applyCard replaced with inline riff replay~~
- ~~**Demo Tape hover tooltip** — shows 'Will replay: [card name]' or 'No riff recorded yet'~~
- ~~**Demo Tape persists across strikes** — lastRiffPlayed survives strikes, resets between fights~~
- ~~**Pack opening blank screen** — already fixed, confirmed working~~
- ~~**Keyword passives confirmed working** — FRENZIED, ANCHOR, CORRUPT, DEBUFF all fire correctly~~
- ~~**Setlist modal** — confirmed working (drag reorder top 4 deck cards)~~
- ~~**Remaster modal** — confirmed working (delete 2, copy 1 from deck)~~
- ~~**Hellquake d10 table** — confirmed fully implemented with dramatic outcomes~~

### Session 9 — Mentor Link System
- ~~**Foil/Mythic/Demonic tier system** — base stat bonuses on recruit (+1/+3/+5 ATK & HP)~~
- ~~**Role Bond** — foil/mythic/demonic bonds with same-role member on arrival, both get permanent ATK bonus, breaks on sell~~
- ~~**Keyword Bond** — adjacency-based amplification for all 8 keywords~~
- ~~**Mythic/Demonic Aura** — whole-stage passive effects~~
- ~~**DEMONIC conflict UI** — 'Only One May Remain' full-screen showdown~~
- ~~**Bond glow in battle** — bonded members pulse matching keyword color~~
- ~~**Recruit screen tier visuals** — foil/mythic/demonic banners + BONDS WITH hint~~
- ~~**genRecruitPack** — Demonic Pack now has 3% demonic chance~~
- ~~**TODO.md** — clean rewrite, strikethrough system, living timestamp~~

### Session 8 — Shop & Battle UI
- ~~**Shop screen layout** — 300x420 card ratio, booster packs, left column~~
- ~~**Battle hand area** — 420px fixed, card fan~~
- ~~**Artifact slots** — 3 stage slots with hover tooltips~~
- ~~**Reroll** — cost increases, clears sold state~~
- ~~**SOLD! overlay** — red diagonal on purchased cards~~

### Sessions 1-7 — Core Game
- ~~All 8 keyword mechanics (FRENZIED, ANCHOR, SHREDDER, DOUBLE TIME, DEBUFF, FOLK MAGIC, CORRUPT, HEXED)~~
- ~~Full enemy roster — 27 fights, 9 circles, all passives~~
- ~~Complete card set — all RIFF, CORRUPT, EMBER, UTILITY cards~~
- ~~All 10 starter artifacts + all 10 starter passives~~
- ~~4 circle artifacts — Goat of Mendes, Hellfire Amulet, Sabbath Crown, Wailing Guitar~~
- ~~Booster pack system — Cassette, CD-R, Import Vinyl, Rare Vinyl, Cursed Demo~~
- ~~Recruitment pack system — Garage Band, Touring, Demonic always in shop~~
- ~~Opening Night — pick 2 from 8 random base-tier members~~
- ~~Band synergy bonus — 3/4/5 buffed = +10/+20/+35% damage~~
- ~~DOUBLE TIME d6 roll per fight~~
- ~~Too Stoned system~~
- ~~Stage drag-and-drop repositioning~~

---

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 0 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight — reward: +1 max ember permanently

## Enemy HP Scaling
Wanderer 27 > Lost Soul 42 > Drifter 69 > Siren 60 > Seducer 140 > Glutton 80 > Devourer 160
> Miser 360 > Usurer 680 > Wrathful 800 > Warlord 1520 > Heretic 1650 > False Prophet 3000
> Brute 3000 > Executioner 5500 > Archfraud 9600 > Betrayer 11400 > LUCIFER 420,666

## Shop System
**Card Booster Packs:** Cassette 6st(C1) / CD-R 12st(C1) / Import Vinyl 22st(C2) / Rare Vinyl 38st(C4) / Cursed Demo 60st(C6)
**Recruitment Pack (always left column):** Garage Band 10st / Touring 22st / Demonic Pack 40st

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
- Dev shortcut: Shift+S = shop with 69 stash | Stable tag: v0.9-pre-megapush