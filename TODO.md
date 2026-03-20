# Vestibule — Master TODO & Design Reference
*Last updated: Friday, March 20, 2026 at 08:35 PM*

---

## P1 — NEXT

### 1. Simulator Fix & Run
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
- Newly completed items moved to COMPLETED with strikethrough
- Any new tasks added if discovered

---

## ✅ COMPLETED

### Session 9 — March 20 2026
- ~~**Allow duplicate band members** — all duplicates allowed except second DOUBLE TIME drummer~~
- ~~**DOUBLE TIME re-roll mechanic** — two drummers re-roll d6 if it lands on 1 or 2~~
- ~~**Black screen crash fix** — removed dblRoll reference from RecruitScreen (not a prop)~~
- ~~**Pawn Shop sell modal** — full UI, Members + Cards tabs, sell prices, bond-breaking~~
- ~~**Pawn shop opens on Cards tab** — sorted by price high to low, all copies shown individually~~
- ~~**Pawn shop stash counter** — live counter top-right, ticks up on each sale~~
- ~~**Pawn shop exploit fix** — button disabled at 0 sales, removed counter reset bug~~
- ~~**Max 2 sales per visit enforced** — button greyed out + no-click at 0~~
- ~~**handlePawnSellCard** — removes one copy from deck, adds sell price to stash~~
- ~~**Demo Tape fix** — inline riff replay, no recursive crash~~
- ~~**Demo Tape hover tooltip** — shows queued card name or 'No riff recorded yet'~~
- ~~**Demo Tape persists across strikes** — resets between fights only~~
- ~~**Pack opening confirmed working** — no blank screen~~
- ~~**All keyword passives confirmed** — FRENZIED, ANCHOR, CORRUPT, DEBUFF all fire~~
- ~~**Setlist modal confirmed working** — drag reorder top 4 deck cards~~
- ~~**Remaster modal confirmed working** — delete 2, copy 1~~
- ~~**Hellquake d10 confirmed working** — full dramatic outcome table~~

### Mentor Link System
- ~~**Foil/Mythic/Demonic tier system** — +1/+3/+5 ATK & HP on recruit~~
- ~~**Role Bond** — permanent ATK bonus on arrival, breaks on sell~~
- ~~**Keyword Bond** — adjacency amplification for all 8 keywords~~
- ~~**Mythic/Demonic Aura** — whole-stage passives~~
- ~~**DEMONIC conflict UI** — Only One May Remain showdown~~
- ~~**Bond glow in battle** — bonded members pulse matching color~~
- ~~**Recruit screen tier visuals** — foil/mythic/demonic banners + BONDS WITH hint~~

### Session 8 — Shop & Battle UI
- ~~**Shop screen** — 300x420 card ratio, booster packs, left column~~
- ~~**Battle hand area** — 420px fixed, card fan~~
- ~~**Artifact slots** — 3 stage slots with tooltips~~
- ~~**Reroll** — cost increases, clears sold state~~

### Sessions 1-7 — Core Game
- ~~All 8 keyword mechanics~~
- ~~27 fights, 9 circles, all enemy passives~~
- ~~Complete card set, all artifacts, all passives~~
- ~~Booster + recruitment pack system~~
- ~~Opening Night, band synergy, DOUBLE TIME, Too Stoned~~
- ~~Stage drag-and-drop~~

---

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 0 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight — +1 max ember permanently

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