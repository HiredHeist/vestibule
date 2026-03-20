# Vestibule — Master TODO & Design Reference
*Priority ranked. Updated end of Session 8. No encoding garbage.*

---

## P1 — NEXT (implement in order)

### 1. Mentor Link System
Complete design confirmed. Build in this order:

**A. Member object — new fields on recruit:**
- tier: base / foil / mythic / demonic
- roleBondWith: [uid, ...] — UIDs of role-bonded stage members
- roleBondBonus: number — ATK added by role bond (subtract on sell)
- keywordBondActive: boolean — keyword bond currently firing

**B. Stat bonuses on recruit:**
- Foil: +1 ATK, +1 HP vs base
- Mythic: +3 ATK, +3 HP vs base
- Demonic: +5 ATK, +5 HP vs base

**C. Role Bond — permanent, retroactive, breaks on sell:**
- Foil joins: foil AND any same-role member both get +1 ATK permanently
- Mythic joins: both get +2 ATK permanently
- Demonic joins: both get +3 ATK permanently
- On sell: revert roleBondBonus from all bonded partners

**D. Keyword Bond — adjacency required, per-strike:**
- FRENZIED foil/mythic/demonic: both adj FRENZIED get +1/+2/+3 ATK on kill
- ANCHOR foil/mythic/demonic: heals +2/+3/+4 HP per strike to neighbors
- SHREDDER foil: first 2 RIFFs discounted. Mythic: 3 RIFFs + adj. Demonic: all RIFFs
- DOUBLE TIME foil: d6 roll +1 (min x1.5). Mythic: no x0.5 possible. Demonic: min x1.5 max x3.0
- DEBUFF foil/mythic/demonic: boss loses 3/4/5 per strike
- FOLK MAGIC foil/mythic/demonic: 30%/40%/50% ember refill chance, +0/+1/+2 bonus ember
- CORRUPT foil/mythic/demonic: ATK + floor(corrupt/12) / floor(corrupt/10) / floor(corrupt/8)
- HEXED foil/mythic/demonic: +7%/+10%/+15% corruption per strike, scales at /8% / /8% / /6%

**E. Mythic Aura — whole stage, no adjacency:**
- FRENZIED mythic/demonic: all members +1/+2 ATK at fight start
- ANCHOR mythic/demonic: all members heal +1/+2 HP per strike
- SHREDDER mythic: all RIFFs -1 ember first Strike. Demonic: all Strikes
- DOUBLE TIME mythic/demonic: band dmg floor +0.50 (bad=x1.0 mid=x2.0 good=x2.5) / min x1.5 always
- DEBUFF mythic/demonic: boss starts at -2/-4 dmg before Strike 1 fires
- FOLK MAGIC mythic/demonic: 40%/50% whole-band refill, +1/+2 bonus ember on proc
- CORRUPT mythic/demonic: all CORRUPT members get scaling / scaling doubled
- HEXED mythic/demonic: all HEXED gain ATK at double / triple rate

**F. DEMONIC rules:**
- Only ONE demonic on stage at a time
- Second demonic triggers 'ONLY ONE MAY REMAIN' full-screen showdown UI
- Both cards shown side by side with full stats, bonds, aura listed
- Player picks one — the other is permanently removed (not sold)
- Sell price: 69 stash flat

**G. Pawn shop sell logic (build alongside mentor link):**
- Max 2 sells per visit, cannot sell last 2 members
- Sell prices: Common 1, Uncommon 2, Rare 4, Foil +3, Mythic +8, Demonic 69 flat, Member 5, Artifact 50% buyback
- On member sell: break all bonds, revert roleBondBonus from remaining partners

**H. Visual indicators:**
- Foil: glossy shimmer overlay on card
- Mythic: animated shiny pattern on card
- Demonic: thick glowing gold border on card
- Bonded members shop + battle: matching color glow + chain-link icon on both
- Recruit screen: show BONDS WITH [NAME] on foil/mythic/demonic candidates
- Battle: bonded pair pulses matching color when keyword bond fires

**I. Opening Night stays base tier — no foil/mythic/demonic at start**

---

### 2. Simulator Fix & Run (after mentor link is live)
Bugs to fix before running 1M sims:
- Soundcheck temp buff: set origAtk on injured members so +1 ATK reverts end-of-strike
- genShop(): always show recruitment pack (Garage Band 10, Touring 22, Demonic Pack 40)
- Then run 1M simulations and generate balance report

---

## P2 — HIGH IMPACT

### Dead Cards (all appear 2-3x in deck — broken trust if they do nothing)
- Demo Tape: track lastRiffPlayed in state. On play: cast that card free. Show error if no riff yet
- Setlist: modal overlay showing top 4 deck cards as draggable tiles, player reorders, Confirm
- The Remaster: modal showing 10 random deck cards, click 2 red X to delete, 1 green + to copy, Confirm
- Hellquake (Black Sabbath Sigil): implement d10 result table with dramatic outcomes

### Keyword Passives — Make them real
- FRENZIED: each Strike, if this member ATK alone > 10 dmg, gain +1 ATK perm (max +5/fight)
- ANCHOR: end of each Strike phase heal adjacent members 1HP. If both neighbors alive, self heals 1HP too
- CORRUPT: ATK = baseATK + floor(corruption/15). At 100% corruption ATK doubles. Show dynamically on card
- DEBUFF: each Strike reduces boss base dmg by 1 (min 1). Visual indicator on boss. Resets between fights

### Pack Opening — Blank screen bug
- Booster pack cards display at 300x420 but screen goes blank on open — investigate + fix

### Font Swap
- Owner will provide TTF files for IM Fell English + UnifrakturMaguntia replacements

---

## P3 — FUTURE
- A11-A20 unlockable artifacts
- P11-P20 unlockable passives
- Collection/unlock screen
- Daily challenge leaderboard
- Settings menu
- Steam / mobile / PS release prep

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
- Demonic Pack 40st: pick 1 of 4, 25% foil + 15% mythic

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
- Dev shortcut: Shift+S = shop with 69 stash
- Stable tag: v0.9-pre-megapush