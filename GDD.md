# VESTIBULE — Game Design Document
**Version 16.0 | Updated March 24, 2026**

## Overview
Vestibule is a roguelite deck-building card game set in Hell. Players assemble a band of musicians, play cards to buff their band and deal damage, then strike bosses across 9 circles of Hell — culminating in a fight against Lucifer himself.

**Core Loop:** Build deck → Play cards → Strike boss → Earn stash → Shop → Repeat

**Inspirations:** Balatro (score multiplier psychology), Slay the Spire (roguelite deckbuilding), doom metal aesthetic

---

## Technical Details
- **Stack:** React 19 + Vite, single-file architecture (App.jsx, 5359 lines, 405KB)
- **Resolution:** 1920x1080 fixed with ScaleRoot responsive scaling
- **Repo:** github.com/HiredHeist/vestibule (private)
- **Deploy:** royceprinting.com/vestibule/

---

## Content Counts
| Category | Count |
|----------|-------|
| Unique cards | 41 |
| Starting deck | 69 cards |
| Musicians | 18 |
| Enemies | 27 (9 circles x 3) |
| Artifacts (Vintage Amps) | 7 |
| Passives (Effect Pedals) | 10 |
| Pacts | 12 |
| Riff Chains (combos) | 16 |
| Card upgrades (Doom Forge) | 41 (15 with HP buffs) |
| Boss loot drops | 8 |
| SFX files | 30 |
| Music tracks | 11 |
| Difficulty stakes | 6 |

---

## Game Flow

### 1. Main Menu
Select difficulty stake, view unlocks, settings (SFX vol, music vol, screen shake toggle, scanlines).

### 2. Opening Night (Band Selection)
Choose 2 starting musicians from the unlocked roster.

### 3. Descent Map (C2-C9)
Choose a path. Can skip fights 1 or 2 for rewards (stash, embers, ATK, corruption reduction, HP, free cards).

### 4. Circle Splash
3-second "Entering Circle V — Anger" transition with emoji, red gradient, fade-in text.

### 5. Combat
- **Play Phase:** Drag cards from hand onto stage members. Cards cost embers.
- **Strike Phase:** Press Strike. Damage = sum of member ATK x multiplier x genre x mentor links.
- **Boss Attack Phase:** Boss hits based on baseDmg + passives.
- **Repeat** for up to 4 strikes per fight.

### 6. Score Multiplier (Balatro-style hook)
- Starts at x1.0 each strike, +0.03 per card played, +0.15 per combo
- Applied to final strike damage. Displayed above Strike button (orange box).

### 7. Post-Boss: Pact -> Doom Forge -> Shop
1. **Pact:** Pick 1 of 2 permanent run buffs
2. **Doom Forge:** Upgrade 1 card permanently. Gold "+" badge.
3. **Shop:** Cards, packs, artifacts, passives, drugs, pawn shop

### 8. Lucifer (2-Phase Final Boss)
Phase 1: 3333 HP (weakened by boss kills). Phase 2: 3333 HP (AoE).

### 9. Welcome to Hell (Bonus Boss)
The Executive at 69,000 HP. Optional.

---

## Card Types (41 unique, 69 in starting deck)
- **RIFF** (purple): ATK buffs, direct damage
- **CORRUPT** (red): Corruption-scaling effects
- **UTILITY** (green): Healing, defense, draw
- **EMBER** (orange): Ember generation

### Sabbath Sigil (special)
CONSUMABLE. 1 copy in deck. Corruption->100%, Hellquake d10. Destroyed after use.
Additional copies: 5% shop chance, 42 herb cost.

---

## Musicians (18, across 9 roles)
Lead Guitarist (FRENZIED), Rhythm Guitarist (SHREDDER), Bass Player (ANCHOR),
Synth Player (CORRUPT), Drummer (DOUBLE TIME: d6 → x1/x1.5/x2), Vocalist (DEBUFF),
Dark Minstrel (FOLK MAGIC/HEXED), Hype Man (HYPE), DJ (REMIX)

### Mentor Links
Same-ROLE adjacent members form links. Multipliers: Foil 1.25x, Mythic 1.50x, Demonic 2.0x.
Stake-scaled bonus: Bronze +0% through Demonic +75%.

---

## Enemies (27)
C1 Limbo: Wanderer 50, Lost Soul 75, Drifter 110
C2 Lust: Siren 100, Tempter 150, Seducer 220 (selfbuff)
C3 Gluttony: Glutton 130, Feaster 170, Devourer 230 (cardHeal6)
C4 Greed: Miser 340, Hoarder 400, Usurer 666 (stashSteal3)
C5 Anger: Wrathful 900, Berserker 1000, Warlord 1111 (rageScale2)
C6 Heresy: Heretic 1650, Apostate 1900, False Prophet 2600 (corruptPlayer20)
C7 Violence: Brute 3000, Hunter 4000, Executioner 5500 (targetHighestHp3)
C8 Fraud: Trickster 5200, Deceiver 6800, Archfraud 9600 (fraudShuffle3)
C9 Treachery: Traitor 9000, Betrayer 11400, LUCIFER 420666
All HP x stake hpMult.

---

## Pacts (12)
Ember Surge (+1 max ember), Iron Strings (+1 ATK all), Thick Skin (+3 HP all),
Dark Bargain (-1 CORRUPT cost), Speed Demon (+1 draw), Blood Price (9x Blood Ritual),
Clean Living (+3 ATK at <15% corr), Corruption Engine (+5% corr/fight),
Merchants Eye (-20% prices), Stone Wall (-1 boss dmg), Sixth Slot (+1 member), War Drums (+1 strike)

---

## Boss Loot (8 drops, 1 per circle boss)
C1: Limbos Echo (+1 ATK all), C2: Love Letter (free first card),
C3: Endless Hunger (+3 HP all), C4: Golden Tooth (+5 stash/boss),
C5: Berserker Rage (+2 ATK strongest), C6: Heretics Brand (+25% corr dmg),
C7: The Blade (+3 ATK strongest), C8: Mask of Lies (+4 HP all)

---

## Genre System (50%+ of one type activates)
RIFF METAL +15% strike dmg, BLACK METAL +25% corruption dmg,
PROG ROCK +1 draw, DOOM METAL +2 ATK/member (no discards)

---

## Drugs
Shrooms (6 herb): 90% good (Ego Death/Time Dilation/Synesthesia/Cosmic Unity), 5% bad, 5% bunk
Acid (12 herb): 90% good (Fractal Vision/Dimensional Rift/Ego Dissolution/Astral Projection), 5% bad, 5% bunk

---

## Difficulty Stakes
| Stake | hpMult | Sim Win Rate |
|-------|--------|-------------|
| Bronze | x1.30 | ~10% |
| Silver | x1.30 | ~11% |
| Gold | x1.30 | ~11% |
| Obsidian | x1.50 | ~9% |
| Blood | x1.75 | ~2% |
| Demonic | x1.80 | ~0.04% |

---

## Audio
11 music tracks (menu, select, battle, boss, lucifer, shop, pact, forge, descent, victory, death).
30 SFX files. All normalized -6dB from SFX level.

## Constants
MAX_STRIKES:4, MAX_DISCARDS:4, HAND_SIZE:6, MAX_HAND:10, MAX_STASH:420, MAX_EMBERS_CAP:8, Deck:69 cards, Multiplier:+0.03/card +0.15/combo
