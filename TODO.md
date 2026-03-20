# Vestibule — Master TODO & Design Reference
*Priority ranked. Last updated: Friday, March 20, 2026 07:46 PM*

---

## P1 — NEXT (implement in order)

### 1. Dead Cards — Fix all 4 (most urgent)
These appear 2-3x in every deck. If they do nothing, players lose trust fast.
- [ ] **Demo Tape** — track `lastRiffPlayed` in state. On play: replay that card for free. Show 'No riff recorded yet' if none played
- [ ] **Setlist** — modal overlay: show top 4 deck cards as large draggable tiles, player reorders order, hits Confirm
- [ ] **The Remaster** — modal: show 10 random deck cards, player clicks 2 red X to delete, 1 green + to copy, Confirm
- [ ] **Hellquake** (Black Sabbath Sigil) — implement d10 result table with dramatic random outcomes

### 2. Pack Opening — Blank screen bug
- [ ] Booster pack cards show at 300x420 but screen goes blank on open — investigate and fix

### 3. Keyword Passives — Wire into combat fully
- [ ] **FRENZIED**: each Strike, if this member ATK alone > 10 dmg, gain +1 ATK perm (max +5/fight)
- [ ] **ANCHOR**: end of each Strike heal adjacent members 1HP. If both neighbors alive, self heals 1HP too
- [ ] **CORRUPT**: ATK = baseATK + floor(corruption/15). At 100% corruption ATK doubles. Show dynamically on card
- [ ] **DEBUFF**: each Strike reduces boss base dmg by 1 (min 1). Visual indicator on boss. Resets between fights

### 4. Pawn Shop Sell UI
- [ ] Wire 'Open Pawn Shop' button to show owned cards/members with sell prices
- [ ] Backend logic exists (handlePawnSellMember) — just needs the modal UI to select what to sell

### 5. Simulator Fix & Run
- [ ] Fix Soundcheck temp buff: set origAtk on injured members so +1 ATK reverts end-of-strike
- [ ] Fix genShop(): always guarantee recruitment pack (Garage Band 10, Touring 22, Demonic 40)
- [ ] Run 1M simulations, generate full balance report

---

## P2 — FUTURE
- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives
- [ ] Collection/unlock screen
- [ ] Daily challenge leaderboard
- [ ] Settings menu
- [ ] Font swap (owner providing TTF files for IM Fell English + UnifrakturMaguntia)
- [ ] Steam / mobile / PS release prep

---

## ✅ COMPLETED

### Session 9 — Mentor Link System
- ~~**Foil/Mythic/Demonic tier system** — base stat bonuses on recruit (+1/+3/+5 ATK & HP)~~
- ~~**Role Bond** — foil/mythic/demonic arriving bonds with same-role member, both get permanent ATK bonus, breaks on sell~~
- ~~**Keyword Bond** — adjacency-based amplification for all 8 keywords at foil/mythic/demonic tier~~
- ~~**Mythic/Demonic Aura** — whole-stage passive effects at mythic and demonic tier~~
- ~~**DEMONIC conflict UI** — 'Only One May Remain' full-screen showdown when second demonic arrives~~
- ~~**Pawn shop sell backend** — handlePawnSellMember wired with bond-breaking~~
- ~~**Bond glow in battle** — bonded members pulse matching keyword color~~
- ~~**Recruit screen tier visuals** — foil/mythic/demonic banners + BONDS WITH hint~~
- ~~**genRecruitPack updated** — Demonic Pack now has 3% demonic chance~~

### Session 8 — Shop & Battle UI
- ~~**Shop screen layout** — 300x420 card ratio, booster packs, left column artifacts/passives~~
- ~~**Battle hand area** — 420px fixed, card fan with paddingBottom:50~~
- ~~**Artifact slots** — 3 stage slots show equipped artifacts with hover tooltips~~
- ~~**Active panel** — shows passives only, hover expands effect text~~
- ~~**Reroll** — clears sold state, cost increases each reroll~~
- ~~**SOLD! overlay** — red diagonal on purchased cards~~

### Sessions 1-7 — Core Game
- ~~**All 8 keyword mechanics** — FRENZIED, ANCHOR, SHREDDER, DOUBLE TIME, DEBUFF, FOLK MAGIC, CORRUPT, HEXED~~
- ~~**Full enemy roster** — 27 fights, 9 circles, all passives (selfbuff, cardHeal, stealStash, rageScale, corruptPlayer, targetHighestHp, lockCard, damageScaleAtk)~~
- ~~**Complete card set** — all RIFF, CORRUPT, EMBER, UTILITY cards implemented~~
- ~~**All 10 starter artifacts + all 10 starter passives**~~
- ~~**4 circle artifacts** — Goat of Mendes, Hellfire Amulet, Sabbath Crown, Wailing Guitar~~
- ~~**Booster pack system** — Cassette, CD-R, Import Vinyl, Rare Vinyl, Cursed Demo~~
- ~~**Recruitment pack system** — Garage Band, Touring, Demonic packs always in shop~~
- ~~**Opening Night** — pick 2 from 8 random base-tier members~~
- ~~**Band synergy bonus** — 3/4/5 buffed members = +10/+20/+35% damage~~
- ~~**Stash reward scaling** — per circle, perfect bonus, corruption dividend~~
- ~~**DOUBLE TIME d6 roll** — per fight, multiplier affects whole band~~
- ~~**Too Stoned system** — members die, Black Candle, Cult Following~~
- ~~**Stage drag-and-drop** — members repositionable~~
- ~~**Pawn shop UI** — prices displayed, sell logic backend added~~

---

## Game Constants Reference
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 0 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight — reward: +1 max ember permanently

## Enemy HP Scaling
Wanderer 27 > Lost Soul 42 > Drifter 69 > Siren 60 > Seducer 140 > Glutton 80 > Devourer 160
> Miser 360 > Usurer 680 > Wrathful 800 > Warlord 1520 > Heretic 1650 > False Prophet 3000
> Brute 3000 > Executioner 5500 > Archfraud 9600 > Betrayer 11400 > LUCIFER 420,666

## Shop System
**Card Booster Packs (center grid, filtered by circle):**
- Cassette Tape 6st: 3 commons pick 1 (C1+)
- CD-R 12st: 2 common + 1 uncommon pick 1 (C1+)
- Import Vinyl 22st: 1 uncommon + 1 rare pick 1 (C2+)
- Rare Vinyl 38st: 1 rare + 30% foil (C4+)
- Cursed Demo 60st: 1 rare, 50% foil, 20% mythic, 5% DEMONIC (C6+)

**Recruitment Pack (always left column, refreshes each shop):**
- Garage Band Pack 10st: pick 1 of 2, no foil
- Touring Pack 22st: pick 1 of 3, 15% foil
- Demonic Pack 40st: pick 1 of 4, 25% foil + 15% mythic + 3% demonic

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
- Dev shortcut: Shift+S = shop with 69 stash
- Stable tag: v0.9-pre-megapush