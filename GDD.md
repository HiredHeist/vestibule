# VESTIBULE — Game Design Document
**Version:** 2.0 (March 26, 2026)
**Genre:** Doom Metal Roguelike Deckbuilder
**Platform:** Web (React, single-file App.jsx)

---

## Core Loop
1. **Opening Night** — Pick 2 of 8 band members
2. **Descent Map** — Choose which fights to face (skip 2 for rewards)
3. **Combat** — Play cards from hand, Strike to deal damage
4. **Shop** — Buy cards, members, artifacts, passives, drugs
5. **Pact + Doom Forge** — After each boss: pick pact, upgrade a card
6. **Repeat** — 9 Circles × 3 fights = 27 enemies + Lucifer final boss

## Combat System
- 4 Strikes per fight (3 on Demonic)
- 4 Discards per fight
- Play cards (cost Embers) to buff members, then Strike
- All living non-Drummer members deal ATK damage per Strike
- Drummers double total damage via dice roll
- Strike multiplier: +0.05× per card played, max 6.66×

## Card Types (4)
| Type | Color | Focus |
|------|-------|-------|
| RIFF | Purple | Direct damage, ATK buffs |
| CORRUPT | Red | Corruption-scaling power |
| UTILITY | Green | Healing, draw, economy |
| EMBER | Orange | Ember management |

## Genre System
50%+ cards of one type → genre bonus:
- **Thrash Metal** (RIFF): +15% Strike damage
- **Black Metal** (CORRUPT): +25% corruption damage
- **Stoner Rock** (UTILITY): +1 card draw
- **Doom Metal** (EMBER): +2 DMG/member if no discards used

## Riff Chains (16)
Play two specific cards in same Strike → ×1.78 multiplier + celebration.

## Corruption (0-100%)
| Threshold | Effect |
|-----------|--------|
| 25% Whispers | Weakest member takes 1 dmg/fight |
| 50% Hunger | All shop prices +25% |
| 75% Madness | 15% chance lose random card per Strike |
| 100% Possession | Boss +3 dmg, CORRUPT members +3 ATK (once) |

Reduction: Smoke Break -15%, Herb Money -15%, Signal Decay -15%, Controlled Feedback → 50%, Atonement pact -15%/boss

## Member Keywords (8)
FRENZIED, DOUBLE TIME, ANCHOR, CORRUPT, DEBUFF, FOLK MAGIC, SHREDDER, HEXED

## Member Tiers
Basic → Foil (+1 ATK/HP) → Mythic (+3 ATK/HP) → Demonic (+5 ATK/HP)

## Mentor Links
Place Foil/Mythic/Demonic LEFT of same-role Basic → permanent damage multiplier

## Synergy Bonus
3+ buffed members: +10% | 4+ buffed: +20% | 5+ buffed: +35%

## Pacts (13)
Permanent buffs chosen after each boss kill. Includes Ember Surge, Iron Strings, Thick Skin, Clean Living, Corruption Engine, Atonement, Blood Price, War Drums, Merchant's Eye, Speed Demon, Stone Wall, Sixth Slot, Corruption Lock.

## Doom Forge
After pact: upgrade one card permanently. Upgraded cards have + suffix and enhanced effects.

## Boss Loot
Each circle boss drops a unique permanent buff (ATK, HP, Embers, etc.)

## The Dealer
Shrooms (6 stash): 90% good trip, 5% bad, 5% bunk
Acid (12 stash): stronger effects, riskier

## Stakes (6 difficulty levels)
Bronze (standard) → Silver → Gold → Obsidian → Blood → Demonic

## Visual Polish
- CRT Scanlines (toggleable)
- VHS Effect: jitter + vignette + flicker (toggleable)
- Dramatic 2s per-member strike animation
- Boss emoji projectile attack
- Card fly-and-shrink on play
- Vertical corruption thermometer
- Genre activation banner
- Per-member HP drain during strikes

## Meta Systems
- Mastery (Novice → Adept → Master → Legendary per card)
- Trophy Wall (28 bosses, first-kill tracking)
- Band Legacy (member stats across runs)
- Daily Challenge (shared seed)
- Combat Log (full run history)
- Score system with lifetime unlocks
