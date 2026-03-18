# VESTIBULE — Game Design Document
*Living document — auto-maintained. Last updated: Session 4*

---

## CONCEPT
A doom/metal themed roguelite deckbuilder. You manage a band descending through circles of Hell, fighting bosses, building your deck, and recruiting musicians. The aesthetic is psychedelic, gothic, and darkly humorous — think Black Sabbath meets Dante's Inferno meets Balatro.

**Core loop:** Draft band → Fight → Shop → Fight → Fight → Next Circle

---

## CURRENT STATE: Circle I — Limbo (Playable)

### Fight Structure
- 3 fights per Circle
- Fight 1: The Wanderer (40 HP, 3 dmg)
- Fight 2: The Lost Soul (69 HP, 4 dmg) ← non-negotiable
- Fight 3: The Drifter / Circle Boss (100 HP, 5 dmg)

### Turn Structure
- Player starts with full hand (6 cards)
- Play cards by dragging to a band member slot
- Click **Strike** to attack (up to 4 times per fight)
- Click **Discard** to swap out unwanted cards (up to 4 times per fight)
- Hand always refills to 6 after every Strike or Discard
- After each Strike: boss attacks a random member

### Resources
- **Embers** — spent to play cards (refills each fight to 6)
- **Stash** — currency earned from winning fights, spent in shop
- **Corruption** — rises from certain cards, affects some mechanics

---

## BAND MEMBERS

| Name | Role | ATK | HP | Keyword | Special |
|------|------|-----|----|---------|----|
| Bjorn | Lead Guitarist | 5 | 6 | FRENZIED | High ATK, fragile |
| Ragnar | Lead Guitarist | 4 | 7 | FRENZIED | Slightly tankier lead |
| Thor | Drummer | 0 | 8 | DOUBLE TIME | Doubles all ATK when on stage |
| Ingrid | Bass Player | 3 | 10 | ANCHOR | High HP, regen adjacent |
| Loki | Synth Player | 3 | 6 | CORRUPT | Scales with Corruption |
| Nott | Vocalist | 2 | 7 | DEBUFF | Reduces boss passive each turn |
| Dag | Bass Player | 2 | 12 | ANCHOR | Tankiest member |

### Too Stoned Mechanic
When a member reaches 0 HP they go **Too Stoned** — tilted 15°, desaturated, locked out of play. A `Wake Up Call` card can revive them.

### Band Synergy Bonus
- 3 buffed members: +10% damage
- 4 buffed members: +20% damage
- 5 buffed members: +35% damage

---

## CARDS

### Types
- **RIFF** (purple) — buffs, damage, special attacks
- **CORRUPT** (red) — corruption manipulation, scaling damage
- **UTILITY** (green) — healing, deck manipulation, protection
- **EMBER** (gold) — ember generation and management

### Rarities
- Common, Uncommon, Rare

### Full Card List
| Card | Type | Embers | Effect |
|------|------|--------|--------|
| Amp It Up | RIFF | 2 | Target member deals double ATK this turn |
| Warm Up | RIFF | 1 | Target member +1 ATK this Strike |
| New Strings | RIFF | 3 | +2 ATK permanently to target member |
| Encore | RIFF | 2 | Target member attacks again this Strike |
| Infernal Encore | RIFF | 4 | ALL members attack again simultaneously |
| Stage Dive | RIFF | 4 | Damage = target HP to boss. Once per round |
| Overdrive | RIFF | 3 | If Corruption >80%, double ALL ATK this Strike |
| Possessed Performance | RIFF | 5 | All members deal triple ATK this Strike only |
| Burn the Set | RIFF | 2 | Discard entire hand. Draw 6 new cards |
| Sound Wall | RIFF | 3 | Deal 5 direct damage. Boss passive skips |
| Demo Tape | RIFF | 2 | Copy last Riff played, cast free *(unimplemented)* |
| Dial to Eleven | CORRUPT | 1 | +20% Corruption immediately |
| Signal Decay | CORRUPT | 2 | -30% Corruption. Heal 5 HP |
| Feedback Loop | CORRUPT | 3 | Deal damage equal to your Corruption % |
| Controlled Feedback | CORRUPT | 2 | Set Corruption to exactly 50% |
| Black Sabbath Sigil | CORRUPT | 2 | Set Corruption to 100%. Hellquake fires *(unimplemented)* |
| Sound Check | UTILITY | 2 | All band members gain +3 HP |
| Roadie | UTILITY | 1 | Target cannot go Too Stoned this Strike |
| Wake Up Call | UTILITY | 2 | Revive a Too Stoned member at full stats |
| Setlist | UTILITY | 1 | View top 4 cards. Rearrange in any order *(unimplemented)* |
| The Remaster | UTILITY | 0 | View 10 deck cards. Delete 2. Copy 1 *(unimplemented)* |
| Groupie | EMBER | 2 | Spend 2 Embers, gain 3 back. Net +1 |
| Tapped Out | EMBER | 0 | Gain 5 Embers at the start of next Strike |

---

## SHOP — The Black Market
*Needs redesign — currently functional but not exciting*

### Current Features
- **Cards for Sale** — 3 random cards, buy with Stash, reroll available
- **Recruitment Pack** — buy to see random musicians, pick 1 to add to stage or pass
- **Booster Packs** — not yet implemented
- **Circle Artifact** — passive buff purchasable once per circle

### Circle Artifacts
| Name | Effect | Cost |
|------|--------|------|
| The Goat of Mendes | All band members gain +1 ATK permanently | 14 |
| Hellfire Amulet | Start each fight with +2 bonus Embers | 17 |
| Sabbath Crown | Too Stoned members revive at 50% HP each round | 22 |
| Wailing Guitar | First Strike each fight deals double damage | 16 |

---

## TODO / ROADMAP

### Immediate (before shop redesign)
- [ ] Setlist card: modal to view/rearrange top 4 deck cards
- [ ] The Remaster card: modal to view/delete/copy deck cards
- [ ] Demo Tape card: track "last riff played" state
- [ ] Hellquake: implement effect (triggered by Black Sabbath Sigil)

### Shop Redesign
- [ ] Make it feel like a cursed black market treasure room
- [ ] Booster pack opening animation
- [ ] Better visual hierarchy

### Psychedelic / Too Stoned Visual System *(see TODO.md for full spec)*
- [ ] HP degradation: 4 visual stages as member takes damage
- [ ] Corruption UI escalation (50%/75%/100% thresholds)
- [ ] Too Stoned: dramatic screen flash + psychedelic bloom + sound

### Future Circles
- [ ] Circle II — The Lustful (new enemies, new cards, new mechanics)
- [ ] Circle III+ — scale difficulty, introduce harder mechanics
- [ ] Hellquake proper implementation

### Sound
- [ ] Card draw sound
- [ ] Too Stoned dramatic moment sound
- [ ] Victory fanfare upgrade

---

## TECHNICAL NOTES
- **Stack:** React + Vite, single file `src/App.jsx`
- **Repo:** https://github.com/HiredHeist/vestibule.git
- **Dev:** `npm run dev` → localhost:5173
- **Deploy:** `git pull` in ~/vestibule after each push
- **Hand size:** `HAND_SIZE=6` (configurable for future artifacts)
- **Deck:** 3 copies of every card, shuffled with seeded RNG
- **Reshuffle:** automatic when deck empty, pulls from discard pile

---

## SESSION LOG

### Session 4 (2026-03-18)
- GitHub workflow established
- Full play screen UI built and locked
- Boss throbbing red glow box
- Member cards 230×345, filled content, stat labels readable
- Hand cards: fixed height 295px, hover z-index via anyHovered+isolation
- Hand drag-to-reorder (insert style)
- drawUpTo while loop fix — hand always refills fully
- Attack number 34px with red pulse animation on change
- Artifact zone flush left with separator
- Strike/Discard with phase dots, ember counter, fight/corrupt/stash HUD
- Shop leave bug fixed (animPhase reset, hand redealt)
- Recruit screen implemented (Garage/Experienced/Demonic packs)
- Enemy rebalance: Wanderer 40HP, Lost Soul 69HP, Drifter 100HP
