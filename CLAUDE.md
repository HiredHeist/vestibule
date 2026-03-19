# VESTIBULE — Master Development Context
> Read this first. Every time. Without exception.

---

## What This Is

**Vestibule** is a roguelite card game built in React/Vite. Stoner/psychedelic/occult/heavy metal theme. Norse band members descend through 9 circles of hell (Dante's Inferno structure) fighting increasingly powerful bosses. The player builds a band, plays cards to deal damage each Strike, manages Corruption and Embers, and buys upgrades in a shop between fights.

**The owner** is a music producer and musician living in rural Minamiyamashiro, Japan. He plays doom metal, industrial music, builds analog pedals, collects vinyl. He also runs a small business (service@royceprinting.com). The game is his passion project. He knows what he wants, has strong aesthetic opinions, and trusts you to make smart technical decisions independently. **Do not over-explain. Do not ask permission for obvious things. Just build it.**

**The vibe:** You are a collaborator who has spent days building this together. You know the codebase inside out. You have opinions. You push back when something is wrong. You celebrate when something is right. This is not a client relationship — it's a creative partnership.

---

## Repo

```
github.com/HiredHeist/vestibule
Local dev: Vite on localhost:5173
Main file: src/App.jsx (~2071 lines)
CSS: src/App.css
GitHub PAT: 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 (expires ~Jun 17 2026, scope: repo)
Backup tag: v0.9-pre-megapush (safe revert point before all the big pushes)
```

**Always run a simulation or check before pushing balance changes. Always verify brace/paren count after scripted edits. Never push broken JSX.**

---

## Current Build State (Session 6 end)

Latest commit: `2eeba0d`
The game is fully playable through all 9 circles. The shop screen has just been reached for the first time and needs UI review/improvement — that's the next task.

### What's working
- Full 9-circle enemy progression (27 enemies, all with unique passives and death quotes)
- Complete card system (37 unique card types, per-card copy counts)
- 16 real band members + 2 locked mystery cards, random 8 shown per Opening Night
- Shop after every fight with scaling inventory
- Artifacts (A1-A10, all implemented)
- Passives/CD-Rs (P1-P10, all implemented)
- Foil cards (gold shimmer, -1 ember cost on 2+ ember cards)
- Mythic card badges
- DOUBLE TIME d6 roll system
- Streak tracker, daily seed, discovery floats, boss kill quotes
- End screen with full stats

### What's pending / next
- **Shop UI review and improvement** (just reached it, needs polish)
- A11-A20 unlockable artifacts (designed, not coded)
- P11-P20 unlockable passives (designed, not coded)
- Foil/Mythic pack opening mechanics
- Collection/unlock screen
- ATK cap tuning (run sim after all systems settled)
- Font swap: IM Fell English → more readable font (owner will provide TTF)
- UnifrakturMaguntia → cooler gothic font (owner will provide TTF)

---

## Core Game Mechanics

### The Loop
1. **Opening Night** — pick 2 from 8 random members (drawn from 18-member pool)
2. **Fight** — play cards, strike, manage HP/Embers/Corruption
3. **Shop** — spend Stash on cards, artifacts, passives, packs, recruit
4. **Repeat** through 27 fights across 9 circles

### Embers
- Start at 5, max 8 (gains +1 per circle boss kill)
- Cards cost Embers to play
- Reset to max each Strike
- Overflow display: shows `6/5` when bonuses push above max

### Corruption
- 0-100%, starts at 0 each fight
- Many cards raise it; some cards benefit from it
- At 100% the Hellquake mechanic fires (d10, wild outcomes)
- Corruption Dividend: at 69%+ on victory, +3 Stash bonus

### Stash (the currency)
- Earns per fight, scales by circle depth (2-4 in C1, 15-20 in C9)
- Cap: **420** (amber warning at 380, red + lock icon at 420)
- Perfect fight bonus (win in 1 Strike): +circleNum stash
- Used in shop for everything
- Herb Money card: 10% of stash as damage (max 69), lose that stash
- Going Broke card: spend ALL stash as damage (shop-only, Rare)

### Too Stoned
- Member HP reaches 0 → they go Too Stoned (rotated, faded, can't fight)
- Wake Up Call revives them but they lose 50% permanent ATK buffs
- All members Too Stoned = run over
- Black Candle artifact: deal 8 damage when any member goes Too Stoned
- Cult Following passive: +3 Stash when any member goes Too Stoned

### Keywords (all 8 active)
| Keyword | Color | Effect |
|---|---|---|
| FRENZIED | #ee2222 | +1 ATK permanently per boss kill |
| DOUBLE TIME | #ff8800 | d6 roll per fight: 1-2=×0.5, 3-4=×1.5, 5-6=×2 ATK |
| ANCHOR | #33dd33 | Heals adjacent members +1 HP after each Strike |
| CORRUPT | #cc44ff | ATK scales with Corruption level |
| DEBUFF | #4488ff | -2 boss damage per Strike, stacks permanently in fight |
| FOLK MAGIC | #44ddaa | 20% chance each Strike to refund all Embers spent |
| SHREDDER | #ff4488 | First RIFF card each Strike costs 1 less Ember |
| HEXED | #cc8800 | Each Strike auto +5% Corruption; +1 ATK per 10% Corruption |

---

## Band Members (full roster)

### Original 8
| Name | Role | ATK | HP | Keyword |
|---|---|---|---|---|
| Bjorn | Lead Guitarist | 5 | 6 | FRENZIED |
| Ragnar | Lead Guitarist | 4 | 7 | FRENZIED |
| Thor | Drummer | 0 | 8 | DOUBLE TIME |
| Ingrid | Bass Player | 3 | 10 | ANCHOR |
| Loki | Synth Player | 3 | 6 | CORRUPT |
| Nott | Vocalist | 2 | 7 | DEBUFF |
| Dag | Bass Player | 2 | 12 | ANCHOR |
| Vitalik | Dark Minstrel 🪈 | 6 | 9 | FOLK MAGIC |

*Vitalik is named after Ethereum's Vitalik Buterin. "Nobody asked. Nobody complained twice."*

### New Members (added Session 6)
| Name | Role | ATK | HP | Keyword |
|---|---|---|---|---|
| Sigrid | Rhythm Guitarist | 3 | 8 | SHREDDER |
| Gunnar | Rhythm Guitarist | 4 | 7 | SHREDDER |
| Astrid | Vocalist | 3 | 8 | DEBUFF |
| Freya | Synth Player | 4 | 5 | CORRUPT |
| Ulf | Bass Player | 4 | 9 | ANCHOR |
| Brynja | Bass Player | 1 | 14 | ANCHOR |
| Rolf | Drummer | 1 | 9 | DOUBLE TIME |
| Orm | Dark Minstrel 🪈 | 2 | 11 | HEXED |

### Locked Cards (2 in pool)
`locked1` and `locked2` — show 🔒, "???", "LOCKED", "Can you find the key?" — no stats, no click. Always exactly 1 locked card appears per Opening Night to hint at unlockables.

---

## Enemy Progression (27 fights, 9 circles)

| Circle | Theme | HP Range | Passive |
|---|---|---|---|
| I — Limbo | Intro | 27/42/69 | None |
| II — Lust | Self-buffs | 60/90/140 | +1-2 dmg per Strike |
| III — Gluttony | Heals on cards | ×4 base | 2-4 HP heal per card played |
| IV — Greed | Steals stash | ×4 base | Steal 1-3 stash per hit |
| V — Anger | Rages on buffs | ×8 base | +2-4 dmg per buffed member |
| VI — Heresy | Corrupts player | ×15 base | +10-20% corruption per Strike |
| VII — Violence | Targets highest HP | ×25 base | Always hits strongest member |
| VIII — Fraud | Locks cards | ×40 base | Locks 1-3 hand cards per Strike |
| IX — Treachery | Scales with damage | ×60 base | +1-2 ATK per 20 dmg taken |

**Lucifer: 420,666 HP** (420 = important number, 666 = cursed number, combined)

---

## The Shop

Appears after **every fight**. Stock scales by circle depth.

### Always present
- 3 cards for sale (rarity scales with circle, reroll costs 2🌿+2 per reroll)
- 9% chance one card slot replaced by a member (5/15/30 stash for base/foil/mythic)
- Circle-persistent artifact slot (same artifact until next circle — "drool factor")
- Recruitment pack (rotates each visit)
- Pawn shop (sell up to 2 items per visit)

### Card prices
- Common: 4🌿, Uncommon: 8🌿, Rare: 14🌿
- Foil +markup, Mythic: 35🌿 (Rare only)

### Booster pack tiers
| Pack | Cost | Contents | Available |
|---|---|---|---|
| 📼 Cassette Tape | 6🌿 | 3 Common, pick 1 | Always |
| 💿 CD-R | 12🌿 | 2 Common + 1 Uncommon, pick 1 | Always |
| 📀 Import Vinyl | 22🌿 | 1 Uncommon + 1 Rare, pick 1 | Circle 2+ |
| 🖤 Rare Vinyl | 38🌿 | 1 Rare + 30% foil chance | Circle 4+ |
| ⛧ Cursed Demo | 60🌿 | 1 Rare, 50% foil, 20% mythic, 5% double-mythic | Circle 6+ |

### Recruitment packs
| Pack | Cost | Contents |
|---|---|---|
| 🎸 Garage Band | 10🌿 | Pick 1 of 2 random members |
| 🎤 Touring | 22🌿 | Pick 1 of 3, 15% foil chance |
| ⛧ Demonic | 40🌿 | Pick 1 of 4, 25% foil + 15% mythic |

### Pawn values
- Common: 1🌿, Uncommon: 2🌿, Rare: 4🌿
- Foil bonus: +3🌿, Mythic bonus: +8🌿
- Any member: 5🌿, Foil member: 15🌿, Mythic member: 30🌿
- Artifacts sell back at 50% of purchase price
- Max 2 sales per shop visit

---

## Artifacts (A1-A10, all implemented)

| ID | Name | Cost | Effect |
|---|---|---|---|
| a1 | Vintage Guitar | 10🌿 | Lead guitarist starts every fight +1 ATK permanently |
| a2 | Devil's Tuning Fork | 8🌿 | Every fight starts at 15% Corruption |
| a3 | The Evil Eye | 20🌿 | First card each Strike costs 0 Embers |
| a4 | Roadie's Toolbelt | 6🌿 | Random member gets Stonewall at fight start |
| a5 | Haunted Radio | 8🌿 | Tapped Out +6 Embers, Power Tap +2 |
| a6 | Black Candle | 12🌿 | Any Too Stoned event → 8 damage to boss |
| a7 | Serpent's Kiss | 18🌿 | Permanent +1 max Ember |
| a8 | Stone Tablet | 12🌿 | All members +3 permanent max HP |
| a9 | Resonance Coil | 10🌿 | Resonance refunds 2 Embers + draws card next Strike |
| a10 | Burning Stage | 10🌿 | Win in 1 Strike: +5 Embers next fight |

**Slots: max 3 artifacts active simultaneously**

---

## Passives / CD-Rs (P1-P10, all implemented)

| ID | Name | Cost | Effect |
|---|---|---|---|
| p1 | Power Chord | 6🌿 | +1 Ember per fight start |
| p2 | Roadie Crew | 8🌿 | Random member +3 HP per fight start |
| p3 | Merch Table | 6🌿 | +2 Stash per victory |
| p4 | Feedback Hum | 10🌿 | EMBER cards give +1 extra Ember |
| p5 | Amp Stack | 10🌿 | Sound Wall +4 dmg, Heavy Riff +2 dmg |
| p6 | Cult Following | 10🌿 | +3 Stash when any member goes Too Stoned |
| p7 | Guitar Tech | 8🌿 | Battle Cry gives +2 ATK instead of +1 |
| p8 | Green Room | 16🌿 | All members get Stonewall at fight start |
| p9 | Heavy Rotation | 10🌿 | Draw duplicate → draw 1 extra card next Strike |
| p10 | Stage Fright Reversal | 14🌿 | First Strike each fight deals +10 bonus damage |

**Slots: max 5 passives active simultaneously**

---

## Designed But Not Yet Coded

### A11-A20 Unlockable Artifacts
- A11 Lucifer's Pick (unlock: reach Circle VI): Lead guitarist triple ATK on first Strike
- A12 Dark Matter Amp (unlock: beat game once): All CORRUPT cards -1 Ember
- A13 Soul Chains (unlock: all-stoned and survive): All members revive at 1 HP instead of dying
- A14 Blood Strings (unlock: 500+ dmg single Strike): New Strings gives +3 ATK permanently
- A15 The Third Eye (unlock: 5 Hellquakes): Boss passive revealed + disabled first Strike
- A16 Bone Microphone (unlock: complete run with Nott): DEBUFF stacks -3 per Strike
- A17 The Sacred Herb (unlock: 150+ stash in a run): Start each circle: all members +1 max HP + 2 bonus Embers
- A18 The Mask (unlock: use all 7 members in 5+ runs): One member gains a second keyword
- A19 The Void Pedal (unlock: win spending 0 stash): Name any card, guaranteed in opening hand
- A20 Pentagram Capacitor (unlock: OBLITERATION 3 times): Black Sabbath Sigil rolls 2d10, both apply

### P11-P20 Unlockable Passives
- P11 Cursed Demo (unlock: reach Circle V): At 69%+ Corruption, damage +20%
- P12 Ouija Board (unlock: 3 Hellquakes in one run): Black Sabbath Sigil costs 0 Embers
- P13 Whammy Bar (unlock: buff one member 5+ times in one fight): Amp It Up permanent for fight
- P14 Pentatonic Riff (unlock: play 50 RIFF cards): Draw 1 extra card per Strike start
- P15 Smoke Machine (unlock: survive 90%+ Corruption): At 80%+ Corruption, all members +2 ATK this Strike
- P16 The Reissue (unlock: delete 10+ cards with Remaster in one run): Remaster copies 2, deletes 3
- P17 Ritual Circle (unlock: complete Circle VI): At 0% Corruption fight start: +3 Embers + 10 damage
- P18 666 Hz (unlock: deal exactly 66 or 666 damage): Feedback Loop playable twice per fight
- P19 Dead Wax (unlock: win with 0 deletions): Full deck reshuffle → 5 damage to boss
- P20 Mythic Riff (unlock: beat game 3 times): Random card in opening hand each fight has doubled effect

---

## Simulation Data (500k runs, pre-Push A)

- Overall win rate: ~6% without artifacts/passives
- Circle I kills 85% of runs — the main wall
- Once past Circle III, players win ~45% of remaining runs
- Lucifer (420,666 HP) kills 93.64% of players who reach him
- Best starting combo: Ingrid+Thor (18.66% win rate)
- Worst: Nott+Ingrid (0.68% — Nott was buffed after this)
- ATK snowball still present — needs ATK cap tuning after all systems stable
- Avg ATK at win: 296,142 (snowball not yet fully addressed)

---

## Technical Notes

### Key State Variables
```js
embers / maxEmbers        // current/max ember count
corruption                // 0-100%
stash                     // current herb money (max 420)
stage[5]                  // band slots (null or member object)
hand / deck / discardPile // card arrays
fightIndex                // 0-26 (fight number)
activeArtifacts[max3]     // equipped artifacts
activePassives[max5]      // equipped passives
dblRoll                   // null | 1-6 (DOUBLE TIME d6, rolled per fight)
shredderUsed              // bool, resets per Strike
streakWins / streakLosses // addiction loop
discovered                // Set of first-time mechanic triggers
isDailyRun                // bool
```

### Key Functions
- `triggerVictory()` — handles boss kill, stash rewards, ember upgrades, shop transition
- `applyCard(card, slotIdx)` — handles all card effects
- `handleStrike()` — calculates damage, applies DOUBLE TIME, fires HEXED, etc.
- `handleShopLeave()` — resets fight state, applies artifact/passive fight-start effects, rolls d6
- `genShopCards(circleNum)` — generates 3 shop cards scaled to circle
- `getRandom8()` — picks 7 real members + 1 locked card for Opening Night

### Fonts
- **UnifrakturMaguntia** — gothic titles (boss names, Opening Night, screen headers)
- **IM Fell English** — italic flavour text (card effects, passive descriptions) — owner wants to replace this, will provide TTF
- **Cinzel** — stat labels, UI text, buttons

### Animations (in App.css)
- `throb 3s` — combat stage card pulse
- `throbSlow 4.5s` — Opening Night card pulse (added Session 6)
- `wiggle` — boss hit animation
- `floatUp` — damage/status floats
- `holoShimmer` — Rare card glow
- `uncommonGlow` — Uncommon card glow

### Hellquake (d10 outcomes when Black Sabbath Sigil played)
1-2: OBLITERATION — massive damage
3: SURGE — +3 Embers
4: RITUAL — boss HP halved
5: THE VOID — full corruption as damage, corruption → 0
6: CHARGE — Embers filled
7: BACKLASH — 30 damage but one member Too Stoned
8: DARK GIFT — +3 Embers
9: STATIC — hand discarded
10: WIPEOUT — member Too Stoned AND boss heals 15

---

## Design Philosophy

**Theme:** Stoner doom metal band descending through Dante's hell. The aesthetic is occult, heavy, psychedelic, Nordic. Every name, every card, every boss quote should feel like it belongs in this world.

**Target audience:** A 10-year-old should be able to pick it up. An adult who plays Slay the Spire should find it deep enough. The balance between those two is the challenge.

**Numbers that matter:** 420, 69, 666. These appear throughout — Lucifer at 420,666 HP, Wanderer at 27 HP (cool), Lost Soul at 42 HP, Drifter at 69 HP, corruption dividend at 69%+, stash cap at 420. This is intentional and should be maintained.

**Addiction loop mechanics (all implemented):**
- Streak tracker (win/loss banners on end screen)
- Daily seed / worldwide challenge button
- Discovery floats (first Hellquake, first Resonance, first all-stoned wipe)
- Boss kill quotes (all 27 enemies)
- Collection/unlock screen (planned — locked members hint at this)
- Run stats on end screen

---

## Aesthetic Rules (do not break these)

1. **Dark background everywhere** — rgba(4,2,1) or similar near-black
2. **Gold accents** — #e8a820, #d0b060 for highlights
3. **Red danger** — #ee2222, #cc1111 for ATK, damage, death
4. **Green health** — #33dd33 for HP
5. **No white backgrounds ever**
6. **Opening Night title is blood red with glow** — #cc1111 with red text-shadow
7. **Cinzel font for all UI labels** — letterspacing, uppercase, weight 700/900
8. **UnifrakturMaguntia for all titles** — boss names, screen names
9. **IM Fell English for flavour text** — italic, atmospheric
10. **The battlefield took days to perfect — never touch its layout without extreme caution**

---

## Common Gotchas

- **Apostrophes in log strings break JSX** — use escape or rephrase. e.g. `target.name+'s sacrifice'` → `target.name+' — sacrificed!'`
- **Brace/paren balance** — always verify after any scripted edit: `(s.match(/\{/g)||[]).length === (s.match(/\}/g)||[]).length`
- **Vite HMR caches useState** — if a useState initializer changes (like `getRandom8`), hard refresh `Cmd+Shift+R` is needed
- **Battle screen layout is sacred** — it took days. Only add elements, never rearrange
- **The stash cap is 420** — every `setStash` should go through `Math.min(MAX_STASH, ...)`
- **DOUBLE TIME d6 is rolled once per fight**, not per Strike — this is intentional
- **Going Broke is shop-only** — it's useless early game (0 stash = 0 damage)

---

## What To Do When Starting A New Session

1. `cd /home/claude/vestibule_repo && git pull`
2. `wc -l src/App.jsx` — get current line count
3. Read this file
4. Ask the owner what they want to work on
5. Look at what they're seeing (take a screenshot if browser tools available)
6. Build it

The owner will tell you what to fix. You already know the codebase. Trust yourself. 🤘
