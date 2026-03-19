# VESTIBULE — Game Design Document
*Living document. Updated end of Session 6. Version 0.9*

---

## Concept

A roguelite card game where you manage a doom metal band descending through Dante's nine circles of Hell. Build your band, play cards to fight bosses, manage a volatile Corruption mechanic, and spend Stash in a dark market between fights. The aesthetic is stoner/psychedelic/occult/heavy metal with Norse naming conventions throughout.

**Core fantasy:** You are the cursed manager of a band that has somehow ended up in Hell. You're trying to fight your way out through 9 circles while keeping your musicians alive, your Corruption under control, and your Stash funded enough to upgrade at the Black Market.

**Tone:** Dark, funny, occult, irreverent. Boss death quotes like *"Finally... rest."* and *"I was looking for something. I forgot what."* Band members named Bjorn, Vitalik, Orm. Numbers that matter: 420, 69, 666.

---

## Core Loop

```
Opening Night (pick band) → Fight → Black Market Shop → Fight → ... × 27
```

1. **Opening Night** — pick 2 members from 8 randomly drawn (from 18-member pool)
2. **Fight** — play cards, Strike, manage HP/Embers/Corruption over 4 Strikes
3. **Black Market** — spend Stash on cards, artifacts, passives, packs, recruit new members
4. **Repeat** through 9 circles (27 total fights)

Win condition: defeat Lucifer (Circle IX, Fight 3, 420,666 HP)

---

## Resources

### Embers 🔥
- The action economy. Cards cost Embers to play.
- Start at 5 per fight. Max is 8 (gains +1 after each circle boss).
- Reset to max at the start of each Strike.
- Can exceed max with certain artifacts/passives — display shows overflow e.g. `6/5`.

### Corruption 🌀
- 0-100%. Starts at 0 each fight.
- Raised by CORRUPT cards, some enemy passives, the HEXED keyword.
- Lowered by Signal Decay, Static Charge.
- Affects damage of CORRUPT-keyword members (ATK scales up).
- At 100%: Black Sabbath Sigil triggers the **Hellquake** (d10 wild outcome).
- **Corruption Dividend:** finish a fight at 69%+ = +3 bonus Stash.

### Stash 🌿
- The currency. Earned after each fight won, scales by circle depth.
- **Circle I:** 2-4 per fight. **Circle IX:** 15-20 per fight.
- Perfect fight bonus (win in Strike 1): +circleNum extra Stash.
- Hard cap: **420**. HUD turns amber at 380, red + 🔒 at 420.
- Spent in the Black Market between fights.

### HP ❤️
- Each member has their own HP. When it hits 0: **Too Stoned**.
- Too Stoned members are tilted, faded, can't fight.
- If ALL members are Too Stoned: run over. "Stoned to the Bone."
- Revive with Wake Up Call (costs 50% of permanent ATK buffs).

---

## Fight System

Each fight has **4 Strikes** (and 4 Discards).

**One Strike:**
1. Play cards from your 6-card hand (spend Embers)
2. Hit STRIKE — entire band attacks the boss
3. Boss retaliates with its passive mechanic
4. Draw back up to 6 cards, Embers reset

**Damage formula:**
- Base damage = sum of non-drummer ATK
- CORRUPT members: ATK + floor(corruption/15)
- DOUBLE TIME drummer: d6 roll per fight — 1-2=×0.5, 3-4=×1.5, 5-6=×2
- DEBUFF stacks: reduces boss damage by 2 per Strike per DEBUFF member
- Band synergy bonus: if 3+ members are buffed, small % damage bonus

**Victory:** Boss HP reaches 0 → earn Stash → go to shop.
**Defeat:** All members Too Stoned, or 4 Strikes used without killing boss.

---

## Band Members

### Keywords (8 total)

| Keyword | Color | Mechanic |
|---|---|---|
| **FRENZIED** | 🔴 #ee2222 | +1 ATK permanently each time this member kills a boss |
| **DOUBLE TIME** | 🟠 #ff8800 | Rolls d6 at fight start: 1-2=×0.5, 3-4=×1.5, 5-6=×2 all ATK. Die badge shown on card. |
| **ANCHOR** | 🟢 #33dd33 | After each Strike, heals adjacent stage members +1 HP |
| **CORRUPT** | 🟣 #cc44ff | ATK = base + floor(corruption/15). Scales massively at high corruption. |
| **DEBUFF** | 🔵 #4488ff | Each Strike permanently reduces boss damage by 2 this fight. Stacks. |
| **FOLK MAGIC** | 🩵 #44ddaa | 20% chance each Strike to refund ALL Embers spent that Strike |
| **SHREDDER** | 🩷 #ff4488 | First RIFF card played each Strike costs 1 less Ember |
| **HEXED** | 🟡 #cc8800 | Each Strike auto-raises Corruption +5%. Gains +1 ATK per 10% Corruption. |

### Full Member Roster (18 total)

**Original 8:**
| Name | Role | ATK | HP | Keyword | Notes |
|---|---|---|---|---|---|
| Bjorn | Lead Guitarist | 5 | 6 | FRENZIED | High ATK, fragile. The carry. |
| Ragnar | Lead Guitarist | 4 | 7 | FRENZIED | Slightly tankier lead. |
| Thor | Drummer | 0 | 8 | DOUBLE TIME | The wildcard drummer. |
| Ingrid | Bass Player | 3 | 10 | ANCHOR | High HP, heals adjacents. |
| Loki | Synth Player | 3 | 6 | CORRUPT | Glass cannon at high corruption. |
| Nott | Vocalist | 2 | 7 | DEBUFF | Whittles down boss damage. |
| Dag | Bass Player | 2 | 12 | ANCHOR | Tankiest of the original 8. |
| Vitalik | Dark Minstrel 🪈 | 6 | 9 | FOLK MAGIC | Named after Vitalik Buterin. "Nobody asked. Nobody complained twice." |

**New Members (Session 6):**
| Name | Role | ATK | HP | Keyword | Notes |
|---|---|---|---|---|---|
| Sigrid | Rhythm Guitarist | 3 | 8 | SHREDDER | "Every riff she plays, the next one comes faster." |
| Gunnar | Rhythm Guitarist | 4 | 7 | SHREDDER | "Rhythm? He makes the rhythm." |
| Astrid | Vocalist | 3 | 8 | DEBUFF | "Her voice alone can break a curse." |
| Freya | Synth Player | 4 | 5 | CORRUPT | "She plays the dark frequencies." (fragile) |
| Ulf | Bass Player | 4 | 9 | ANCHOR | "The anchor that also bites." |
| Brynja | Bass Player | 1 | 14 | ANCHOR | "An immovable wall. The bass never stops." (highest HP) |
| Rolf | Drummer | 1 | 9 | DOUBLE TIME | "Hits harder than the rest combined. Statistically speaking." |
| Orm | Dark Minstrel 🪈 | 2 | 11 | HEXED | "The longer he plays, the worse it gets. For everyone." |

**Locked Cards (2 in pool):**
- `locked1` and `locked2` — show 🔒 emoji, name "???", role "LOCKED", no ATK/HP stats
- Display text: "Can you find the key?"
- Cannot be selected on Opening Night (no click interaction)
- Dark grey border, no pulse animation (contrast with real members)
- Always exactly **1** locked card shown per Opening Night (random which one)
- Purpose: hint at unlockables, create FOMO, encourage sharing/word of mouth

**Opening Night mechanics:**
- Pool of 18 members total (16 real + 2 locked)
- Each run: randomly draw 7 real members + 1 locked card = 8 total
- Display in 4×2 grid (updated Session 6)
- Cards pulse with `throbSlow 4.5s` animation (50% slower than combat cards)
- Title "Opening Night" in blood red glow (#cc1111 + red text-shadow)
- 8-keyword ability explanation box below cards (4×2 grid layout)

---

## Card System

### Card Types
- **RIFF** (purple) — damage, ATK buffs, attack manipulation
- **CORRUPT** (red) — corruption management, corruption-scaling damage
- **UTILITY** (green) — healing, deck manipulation, defense
- **EMBER** (amber) — resource generation

### Complete Card List (37 types)

**Common:**
| Card | Type | Cost | Effect | Copies |
|---|---|---|---|---|
| Amp It Up | RIFF | 2 | Target member ×2 ATK this Strike | 2 |
| Battle Cry | RIFF | 1 | Target member +1 ATK permanently | 2 |
| Crowd Surf | RIFF | 2 | Damage = cards in hand × 2 | 2 |
| Demo Tape | RIFF | 2 | Copy last RIFF played, cast it free | 2 |
| Distortion | CORRUPT | 1 | Corruption +10%. All members +1 ATK this Strike | 2 |
| Groupie | EMBER | 2 | Net +1 Ember (spend 2, gain 3) | 2 |
| Power Tap | EMBER | 0 | Gain 1 Ember | 2 |
| Roadie | UTILITY | 1 | Target cannot go Too Stoned this Strike | 2 |
| Setbreak | UTILITY | 0 | Discard a random card from hand. Gain 2 Embers | 2 |
| Setlist | UTILITY | 1 | View top 4 cards. Rearrange in any order | 2 |
| Signal Decay | CORRUPT | 2 | -30% Corruption. Heal 5 HP | 2 |
| Sound Check | UTILITY | 2 | All members +4 HP. Injured members +1 ATK this Strike | 2 |
| Static Charge | CORRUPT | 0 | If 0% Corruption: +3 Embers. Else: -5% Corruption | 2 |

**Uncommon:**
| Card | Type | Cost | Effect | Copies |
|---|---|---|---|---|
| Amp Overload | EMBER | 0 | +3 Embers. Skip next Discard | 2 |
| Amp the Static | CORRUPT | 3 | Target member gains ATK = Corruption ÷ 15 this Strike | 2 |
| Burn the Set | RIFF | 2 | Discard entire hand. Draw 6 new cards | 2 |
| Controlled Feedback | CORRUPT | 2 | Set Corruption to exactly 50% | 2 |
| Dark Tuning | CORRUPT | 3 | Per 15% Corruption: one random member +1 ATK permanently | 1 |
| Death Riff | CORRUPT | 1 | Damage = (100-Corruption)%, max 60. Corruption +10% | 2 |
| Double Down | RIFF | 3 | Next card this Strike costs 0 Embers | 2 |
| Encore | RIFF | 2 | Target member attacks again this Strike | 2 |
| Feedback Loop | CORRUPT | 3 | Damage = Corruption ÷ 2 | 2 |
| Heavy Riff | RIFF | 2 | Damage = stage total ATK ÷ 2, direct | 1 |
| Herb Money | RIFF | 2 | Damage = 10% of Stash (max 69). Lose that Stash | 1 |
| New Strings | RIFF | 3 | Target member +2 ATK permanently | 2 |
| Resonance | RIFF | 1 | Target member ATK = highest ATK on stage | 1 |
| Séance | CORRUPT | 2 | Heal all members = Corruption ÷ 8 | 1 |
| Sound Wall | RIFF | 3 | 5/8/12 damage (scales by fight). Boss passive skips | 2 |
| Soundboard | EMBER | 1 | +2 Embers. Draw 1 extra card next Strike | 1 |
| Tapped Out | EMBER | 0 | +5 Embers at start of next Strike | 2 |
| Wake Up Call | UTILITY | 2 | Heal all 2 HP. Revive Too Stoned member (they lose 50% perm ATK buffs) | 2 |

**Rare:**
| Card | Type | Cost | Effect | Copies |
|---|---|---|---|---|
| Black Sabbath Sigil | CORRUPT | 2 | Corruption → 100%. Roll d10. Hellquake fires. | 2 |
| Going Broke | RIFF | 0 | Spend ALL Stash. Deal that much damage. Shop-only. | 1 |
| Infernal Encore | RIFF | 3 | ALL members attack again simultaneously | 2 |
| Overdrive | RIFF | 3 | If Corruption >=60%, double ALL ATK this Strike | 2 |
| Possessed Performance | RIFF | 4 | All members deal triple ATK this Strike | 2 |
| Stage Dive | RIFF | 4 | Damage = target member HP. Once per fight. | 2 |
| The Remaster | UTILITY | 0 | View 10 deck cards. Delete 2. Copy 1. | 2 |

**Special mechanics:**
- **Resonance system:** play a card when you have a duplicate in hand → duplicate auto-discards, refund 1 Ember, "RESONANCE 🔥" float
- **Foil cards:** -1 Ember cost (on cards that cost 2+). Gold shimmer badge.
- **Mythic cards:** Enhanced specific effects (per-card upgrades). Purple void badge.
- **Going Broke variants:** Foil = ×2 damage, Mythic = ×6 damage (designed, not yet coded)

### Hellquake (d10 outcomes)
Triggered by Black Sabbath Sigil. Corruption → 100%, then:
1-2. **OBLITERATION** — band total ATK × 4 damage
3. **RESONANCE** — all members +3 ATK permanently
4. **RITUAL** — boss HP halved (floors to 1)
5. **THE VOID** — full Corruption as damage, Corruption → 0
6. **POSSESSION** — all cards free this Strike
7. **BACKLASH** — 30 damage but random member goes Too Stoned
8. **DARK GIFT** — +3 Embers
9. **STATIC** — hand discarded
10. **TOTAL WIPEOUT** — random member Too Stoned AND boss heals 15

---

## Enemies — 9 Circles

Each circle has 3 fights (2 minions + 1 boss). All have unique passives and death quotes.

| Circle | Theme | Enemy HP (approx) | Passive Mechanic |
|---|---|---|---|
| I — Limbo | Intro | 27 / 42 / 69 | None |
| II — Lust | Self-buffing | 60 / 90 / 140 | +1-2 ATK per Strike |
| III — Gluttony | Heals on cards | ×4 base | Heals 2-4 HP per card played |
| IV — Greed | Steals Stash | ×4 base | Steals 1-3 Stash per hit |
| V — Anger | Rages on buffs | ×8 base | +2-4 ATK per buffed member |
| VI — Heresy | Corrupts player | ×15 base | +10-20% Corruption per Strike |
| VII — Violence | Targets strongest | ×25 base | Always hits highest-HP member |
| VIII — Fraud | Locks cards | ×40 base | Locks 1-3 hand cards per Strike |
| IX — Treachery | Scales with damage | ×60 base | +1-2 ATK per 20 HP damage taken |

**Lucifer:** 420,666 HP. Gains +2 ATK per 20 HP lost. The final boss.

---


## The Black Market (Shop) — Session 7 Update

Appears after **every fight**. Layout defined per sketch (Session 7).

### Screen Layout
```
┌─────────────┬──────────────────────────────┬──────────────┐
│ Band Pack   │   ⚰ The Black Market         │  Next Fight  │
│ (rotates)   ├──────────────────────────────┼──────────────┤
│             │                              │  🌿 Stash    │
│ Artifact    │  [Card 1] [Card 2] [Card 3]  │              │
│ (3 circles) │                              │  [Re-roll]   │
│             ├──────────────────────────────┴──────────────┤
│ Passive     │  [Booster Pack 1] [Booster Pack 2] [Pawn]  │
│ (3 circles) │                                             │
└─────────────┴─────────────────────────────────────────────┘
```

### Left Column (persistent per circle)
- **Band Pack** (recruitment cassette) — rotates every visit, tier based on circle
- **Vintage Amp** (artifact) — same for all 3 fights in circle. Golden border.
- **Effect Pedal** (passive) — same for all 3 fights in circle. Purple border.
- All 3 items same size, ~10% larger than cards. wiggle animation on hover.

### Center — Cards for Sale
- 3 cards identical to battle hand cards (ember cost badge, type, emoji, name, effect)
- 🌿 herb price floats above each card
- Reroll button: 2🌿 → 4🌿 → 6🌿 (always +2🌿 per reroll)
- 9% chance one slot is a band member instead of a card (5/15/30🌿)

### Bottom Row
- 2 random booster packs (MTG foil pack style, ~10% bigger than cards)
- Pawn shop panel to the right of packs (purple border, opens as overlay, max 2 sales)

### Card Pricing
| Rarity | Normal | Foil | Mythic |
|---|---|---|---|
| Common | 4🌿 | 8🌿 | — |
| Uncommon | 8🌿 | 14🌿 | — |
| Rare | 14🌿 | 22🌿 | 35🌿 |

### Booster Pack Contents (Updated Session 7)
| Pack | Emoji | Cost | Contents | Circle Gate |
|---|---|---|---|---|
| Cassette Tape | 📼 | 6🌿 | 3 Common, pick 1 | Always |
| CD-R | 💿 | 12🌿 | 3 Common + 2 Uncommon, pick 1, 3% foil | Always |
| Import Vinyl | 📀 | 22🌿 | 1 Uncommon + 1 Rare, pick 1, 20% foil | Circle 2+ |
| Rare Vinyl | 🖤 | 38🌿 | 2C+2U+1R, pick 2, 30% foil, 5% mythic | Circle 4+ |
| Cursed Demo | ⛧ | 60🌿 | 5 cards, pick 2, 10% passive chance | Circle 6+ |
| Ritual Pressing | 🕯️ | 25🌿 | 2 random Effect Pedals (P1-P10), pick 1 | Always |
| Hellforged Crate | ⚰️ | 35🌿 | 2 random Vintage Amps (A1-A10), pick 1 | Always |

### Booster Pack Appearance Rates (independent rolls)
| Pack | Rate | Gate |
|---|---|---|
| 📼 Cassette Tape | 40% | Always |
| 💿 CD-R | 40% | Always |
| 📀 Import Vinyl | 30% | Circle 2+ |
| 🖤 Rare Vinyl | 20% | Circle 4+ |
| ⛧ Cursed Demo | 10% | Circle 6+ |
| 🕯️ Ritual Pressing | 3% | Always |
| ⚰️ Hellforged Crate | 5% | Always |
| 🎸 Garage Band (recruit) | 5% | Always |
| 🎤 Touring (recruit) | 3% | Circle 3+ |
| ⛧ Demonic (recruit) | Never in booster slot | — |

### Recruitment Pack — Reserved Slot (rotates every visit)
| Circle | Pack Options |
|---|---|
| 1-2 | 100% Garage Band (10🌿) |
| 3-4 | 30% Garage Band, 70% Touring (22🌿) |
| 5+ | 20% Garage Band, 50% Touring, 30% Demonic (40🌿) |

Demonic Pack contents: Pick 1 of 4, 25% foil + 15% mythic

### Updated Artifact (Vintage Amp) Prices — DOUBLED Session 7
| ID | Name | New Cost | Pawn Value |
|---|---|---|---|
| A1 | Vintage Guitar | 20🌿 | 10🌿 |
| A2 | Devil's Tuning Fork | 16🌿 | 8🌿 |
| A3 | The Evil Eye | 40🌿 | 20🌿 |
| A4 | Roadie's Toolbelt | 12🌿 | 6🌿 |
| A5 | Haunted Radio | 16🌿 | 8🌿 |
| A6 | Black Candle | 24🌿 | 12🌿 |
| A7 | Serpent's Kiss | 36🌿 | 18🌿 |
| A8 | Stone Tablet | 24🌿 | 12🌿 |
| A9 | Resonance Coil | 20🌿 | 10🌿 |
| A10 | Burning Stage | 20🌿 | 10🌿 |

### Updated Passive (Effect Pedal) Prices — DOUBLED Session 7
| ID | Name | New Cost | Pawn Value |
|---|---|---|---|
| P1 | Power Chord | 12🌿 | 6🌿 |
| P2 | Roadie Crew | 16🌿 | 8🌿 |
| P3 | Merch Table | 12🌿 | 6🌿 |
| P4 | Feedback Hum | 20🌿 | 10🌿 |
| P5 | Amp Stack | 20🌿 | 10🌿 |
| P6 | Cult Following | 20🌿 | 10🌿 |
| P7 | Guitar Tech | 16🌿 | 8🌿 |
| P8 | Green Room | 32🌿 | 16🌿 |
| P9 | Heavy Rotation | 20🌿 | 10🌿 |
| P10 | Stage Fright Reversal | 28🌿 | 14🌿 |

### Pawn Shop
- Opens as overlay (purple border)
- Max 2 sales per visit
- Can open mid-pack-opening to sell member and make room
- All packs have a Pass button
- Cannot sell last 2 members
- Values: Common 1🌿, Uncommon 2🌿, Rare 4🌿, Foil +3🌿, Mythic +8🌿
- Member 5🌿, Foil Member 15🌿, Mythic Member 30🌿
- Artifacts/Passives: 50% of purchase price

## Artifacts (A1-A10, all implemented)

Max 3 active simultaneously. Sold at 50% back.

| ID | Name | Cost | Effect |
|---|---|---|---|
| A1 | Vintage Guitar | 10🌿 | Lead guitarist starts every fight with +1 ATK permanently |
| A2 | Devil's Tuning Fork | 8🌿 | Every fight starts at 15% Corruption |
| A3 | The Evil Eye | 20🌿 | First card each Strike costs 0 Embers (rare shop appearance) |
| A4 | Roadie's Toolbelt | 6🌿 | Random member gets Stonewall at fight start |
| A5 | Haunted Radio | 8🌿 | Tapped Out gives +6 Embers; Power Tap gives +2 |
| A6 | Black Candle | 12🌿 | When any member goes Too Stoned: deal 8 damage to boss |
| A7 | Serpent's Kiss | 18🌿 | Permanent +1 max Ember (display shows e.g. 6/5) |
| A8 | Stone Tablet | 12🌿 | All members +3 permanent max HP |
| A9 | Resonance Coil | 10🌿 | Resonance refunds 2 Embers instead of 1 + draws card |
| A10 | Burning Stage | 10🌿 | Win a fight in 1 Strike: +5 Embers next fight |

### Unlockable Artifacts A11-A20 (designed, not yet coded)

| ID | Name | Unlock Condition | Effect |
|---|---|---|---|
| A11 | Lucifer's Pick | Reach Circle VI first time | Highest-ATK lead guitarist deals triple ATK on first Strike |
| A12 | Dark Matter Amp | Beat the game once | All CORRUPT cards cost 1 less Ember |
| A13 | Soul Chains | All members Too Stoned simultaneously and survive | All members revive at 1 HP instead of dying |
| A14 | Blood Strings | Deal 500+ damage in a single Strike | New Strings gives +3 ATK permanently instead of +2 |
| A15 | The Third Eye | Trigger Hellquake 5 times across any runs | Boss passive revealed AND disabled for first Strike |
| A16 | Bone Microphone | Complete a run using Nott | DEBUFF stacks -3 per Strike instead of -2 |
| A17 | The Sacred Herb | Accumulate 150+ Stash in a single run | Start of each circle: all members +1 permanent max HP + 2 bonus Embers |
| A18 | The Mask | Use all 7 original members across 5+ runs | One random band member gains a second keyword for the run (player picks from 3) |
| A19 | The Void Pedal | Win a run spending 0 Stash in shop | Once per fight: name any card — guaranteed in opening hand |
| A20 | Pentagram Capacitor | Trigger OBLITERATION on Hellquake 3 times | Black Sabbath Sigil rolls TWO d10s, both outcomes apply simultaneously |

---

## Passives / CD-Rs (P1-P10, all implemented)

Max 5 active simultaneously.

| ID | Name | Cost | Effect |
|---|---|---|---|
| P1 | Power Chord | 6🌿 | +1 Ember at the start of every fight |
| P2 | Roadie Crew | 8🌿 | At fight start: random member heals +3 HP |
| P3 | Merch Table | 6🌿 | After each victory: +2 bonus Stash |
| P4 | Feedback Hum | 10🌿 | All EMBER cards give +1 extra Ember when played |
| P5 | Amp Stack | 10🌿 | Sound Wall +4 damage; Heavy Riff +2 damage |
| P6 | Cult Following | 10🌿 | Each time any member goes Too Stoned: +3 Stash |
| P7 | Guitar Tech | 8🌿 | Battle Cry gives +2 ATK permanently instead of +1 |
| P8 | Green Room | 16🌿 | At fight start: all members gain Stonewall (immune to first Too Stoned) |
| P9 | Heavy Rotation | 10🌿 | Draw a duplicate into hand → draw 1 extra card next Strike |
| P10 | Stage Fright Reversal | 14🌿 | First Strike of every fight deals +10 bonus damage |

### Unlockable Passives P11-P20 (designed, not yet coded)

| ID | Name | Unlock | Effect |
|---|---|---|---|
| P11 | Cursed Demo | Reach Circle V | At 69%+ Corruption, all damage +20% |
| P12 | Ouija Board | Trigger Hellquake 3 times in one run | Black Sabbath Sigil costs 0 Embers |
| P13 | Whammy Bar | Buff a single member 5+ times in one fight | Amp It Up doubles ATK permanently for the fight |
| P14 | Pentatonic Riff | Play 50 RIFF cards across any runs | Draw 1 extra card at the start of every Strike |
| P15 | Smoke Machine | Survive a fight at 90%+ Corruption | At 80%+ Corruption, all members +2 ATK that Strike |
| P16 | The Reissue | Delete 10+ cards with The Remaster in one run | Remaster lets you copy 2, delete 3 |
| P17 | Ritual Circle | Complete Circle VI | At 0% Corruption fight start: +3 Embers + 10 damage to boss |
| P18 | 666 Hz | Deal exactly 66 or 666 damage in one Strike | Feedback Loop can be played twice per fight |
| P19 | Dead Wax | Win a run with 0 card deletions | Full deck reshuffle → deal 5 damage to boss |
| P20 | Mythic Riff | Beat the game 3 times | One random opening hand card each fight has doubled effect |

---

## Addiction Loop Systems

All implemented (Session 6 Push D):

**Streak tracker** — win/loss streaks displayed on end screen with 🔥/💀 banners.

**Daily seed** — getDailySeed() from YYYYMMDD. Every player worldwide gets the same run that day. "🌍 Daily Challenge" button on end screen.

**Copy Seed** — clipboard copy for sharing runs.

**Discovery floats** — first time triggering Hellquake, Resonance, or Total Wipeout: gold "⛧ DISCOVERED: [MECHANIC]" float + special log entry.

**Boss kill quotes** — all 27 enemies have a unique death line logged 0.6s after kill.
*Examples: Wanderer: "Finally... rest." Lucifer: "Impressive. I'll be seeing you again. Soon."*

**Run statistics** — end screen shows 10 stats in 2-column grid: Circle Reached, Fights Survived, Strikes Thrown, Cards Played, Total Damage, Highest Strike, Too Stoned Events, Max Corruption, Stash Earned, Total Runs.

**Locked member cards** — always 1 visible per Opening Night to hint at unlockable content.

---

## Visual Design Language

### Colour System
- **Background:** rgba(4,2,1) — near-black with warm tint
- **Gold accents:** #e8a820, #d0b060 — titles, highlights, selected states
- **Danger/ATK:** #ee2222, #cc1111 — red
- **Health/HP:** #33dd33 — green
- **Corruption high:** #cc1111 with chroma shift at 70%+, full interlace at 100%
- **Ember:** #ff6600 — orange flame

### Typography
- **UnifrakturMaguntia** — boss names, screen titles, card names
- **Cinzel** — stats, labels, UI text, buttons
- **IM Fell English** — italic flavour text (targeted for replacement — owner will provide TTF)

### Animations
- `throb 3s` — combat stage card glow pulse
- `throbSlow 4.5s` — Opening Night card glow pulse (50% slower)
- `wiggle` — boss hit shake
- `floatUp` — damage/status floats
- `holoShimmer` — Rare card glow
- `interlaceFlicker` — high corruption / Too Stoned death screen
- `bgPulse` — background pulse at 50%+ corruption

### Opening Night Screen
- Blood red "Opening Night" title (#cc1111, red text-shadow glow)
- 4×2 grid layout (960px wide)
- Each card shows: emoji, name, role, ATK/keyword/HP stat bar (same as battlefield)
- Cards pulse with throbSlow — locked card does NOT pulse (stays still/dark)
- Locked cards: dark grey border, 🔒 emoji, "???", "LOCKED", small lock icon + "Can you find the key?"
- Ability explanation box below cards: 4×2 grid, all 8 keywords explained in plain English

### Corruption Visual Escalation
- 0-39%: normal
- 40-69%: subtle sepia, slight saturation
- 70-99%: stronger chroma, background pulse
- 100%: full interlace flicker + chroma split (red/blue channel separation)
- "Stoned to the Bone" death screen: maximum green scanline effect

---

## Technical Architecture

**Stack:** React 18, Vite, single-file component (~2100 lines)
**State:** All useState/useCallback hooks, no external state library
**Fonts:** Google Fonts (Cinzel, UnifrakturMaguntia, IM Fell English)
**Audio:** Web Audio API, programmatic tone generation
**No backend:** Fully client-side. Daily seed derived from date math.

### Key Constants
```js
MAX_EMBERS_CAP = 8
MAX_STRIKES = 4
MAX_DISCARDS = 4
HAND_SIZE = 6
MAX_STASH = 420
```

### Key State
```js
stage[5]           // band slots (null or member object)
hand/deck/discard  // card arrays with uid
embers/maxEmbers   // current resource
corruption         // 0-100
stash              // currency (capped at 420)
fightIndex         // 0-26
activeArtifacts    // max 3
activePassives     // max 5
dblRoll            // null|1-6 (rolled once per fight)
shredderUsed       // bool, resets per Strike
streakWins/Losses  // addiction loop
discovered         // Set of first-time triggers
```

---

## Balance Data (500k simulation, post-Push A, no artifacts/passives)

| Metric | Value | Status |
|---|---|---|
| Overall win rate | 0.05% | Too low — needs artifacts/passives |
| Circle I death rate | 85% | Still the main wall |
| Lucifer death rate | 93.64% | Correctly terrifying |
| Best combo | Ingrid+Thor | DOUBLE TIME + ANCHOR synergy |
| Worst combo | Nott+Ingrid | 0.68% — Nott buffed post-sim |
| Avg ATK at win | 296,142 | ATK snowball still present — cap needed |

*Next sim: run after A11-A20 + P11-P20 to establish new baseline*

---

## Pending Design Decisions

1. **ATK cap** — no hard number set. Need sim data with full artifact/passive system active. Probably somewhere around +8-12 per member.

2. **Font swap** — owner will provide TTF files. IM Fell English is hard to read at small sizes. UnifrakturMaguntia could be more metal.

3. **Going Broke Foil/Mythic** — approved: Foil = ×2, Mythic = ×6. Not yet coded.

4. **Mythic card upgrades** — 15 specific upgrades designed (see below), not yet coded.

### Mythic Card Upgrades (approved, not coded)
| Card | Normal | Mythic |
|---|---|---|
| Amp It Up | ×2 ATK | ×3 ATK |
| New Strings | +2 ATK perm | +3 ATK perm |
| Infernal Encore | All attack once more | All attack twice more |
| Death Riff | (100-corr)% dmg + 10% corrupt | (100-corr)% dmg, no corruption gain |
| Feedback Loop | Corruption ÷ 2 | Full Corruption% as damage |
| Black Sabbath Sigil | 1d10 Hellquake | 2d10, both apply |
| Possessed Performance | ×3 ATK one Strike | ×3 ATK + permanent +2 ATK all |
| Battle Cry | +1 ATK perm | +2 ATK perm |
| Crowd Surf | Hand × 2 damage | Hand × 3 damage |
| Overdrive | ×2 ATK at 60%+ | ×3 ATK at 40%+ |
| Distortion | +10% corrupt, +1 ATK | +15% corrupt, +2 ATK all |
| Stage Dive | Target HP as damage | Target HP × 2 as damage |
| Double Down | Next card free | Next 2 cards free |
| Dark Tuning | +1 ATK per 15% | +2 ATK per 15% |
| Amp the Static | Corruption ÷ 15 | Corruption ÷ 10 |

---

## Numbers That Must Never Change Without Good Reason

| Value | Number | Reason |
|---|---|---|
| Stash cap | 420 | Cultural. Non-negotiable. |
| Lucifer HP | 420,666 | 420 + 666. The two numbers combined. |
| Wanderer HP | 27 | Just cool. |
| Lost Soul HP | 42 | Just cool. |
| Drifter HP | 69 | Just cool. |
| Corruption dividend | 69%+ | Thematic. |
| FOLK MAGIC proc | 20% | Tested and fun. |
