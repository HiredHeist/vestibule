# VESTIBULE — Game Design Document
**Version:** 2.1 (April 13, 2026)
**Genre:** Doom Metal Roguelike Deckbuilder
**Platform:** Web (React, single-file App.jsx)

---

## Core Loop
1. **Tutorial** (first time only) — 3 guided fights teach cards, corruption, combos
2. **Opening Night** — Pick 2 of 8 band members
3. **Descent Map** — Choose which fights to face (skip some for rewards)
4. **Combat** — Play cards from hand, Strike to deal damage
5. **Shop** — Buy cards, members, artifacts, passives, drugs
6. **Pact + Doom Forge** — After each boss: pick pact, upgrade a card
7. **Repeat** — 9 Circles x 3 fights = 27 enemies + Lucifer final boss

## Tutorial System
3 scripted fights with predetermined hands (~5 minutes):
- Fight 1: Cards, embers, Strike basics (corruption hidden)
- Fight 2: Corruption introduced, enemy raises it per Strike
- Fight 3: Ember management sequence leading to Riff Chain discovery
- First-encounter tips fire for pacts, shop, events, descent on first real run
- Skip Tutorial option for experienced players

## Combat System
- 4 Strikes per fight (3 on Demonic)
- 4 Discards per fight
- Play cards (cost Embers) to buff members, then Strike
- All living non-Drummer members deal ATK damage per Strike
- Drummers multiply total damage via dice roll
- Strike multiplier: +0.05x per card played, max 6.66x

## Card Types (4)
| Type | Color | Focus |
|------|-------|-------|
| RIFF | Purple | Direct damage, ATK buffs |
| CORRUPT | Red | Corruption-scaling power |
| UTILITY | Green | Healing, draw, economy |
| EMBER | Orange | Ember management |

## Genre System
50%+ cards of one type = genre bonus:
- Thrash Metal (RIFF): +15% Strike damage
- Black Metal (CORRUPT): +25% corruption damage
- Stoner Rock (UTILITY): +1 card draw
- Doom Metal (EMBER): +2 DMG/member if no discards used

## Riff Chains (16)
Play two specific cards in same Strike = x1.78 multiplier

## Corruption (0-100%)
| Threshold | Effect |
|-----------|--------|
| 25% Whispers | Weakest member takes 1 dmg/fight |
| 50% Hunger | All shop prices +25% |
| 75% Madness | 15% chance lose random card per Strike |
| 100% Possession | Boss +3 dmg, CORRUPT members +3 ATK (once) |

## Member Keywords (8)
FRENZIED, DOUBLE TIME, ANCHOR, CORRUPT, DEBUFF, FOLK MAGIC, SHREDDER, HEXED

## Member Tiers
Basic > Foil (+1 ATK/HP) > Mythic (+3 ATK/HP) > Demonic (+5 ATK/HP)

## Mentor Links
Place Foil/Mythic/Demonic LEFT of same-role Basic = permanent damage multiplier

## Synergy Bonus
3+ buffed members: +10% | 4+: +20% | 5+: +35%

## Stakes (6 difficulty levels)
Bronze (8.5%) > Silver (7.1%) > Gold (6.7%) > Obsidian (3.9%) > Blood (1.8%) > Demonic (0.9%)

## UI/UX Features
- Unaffordable cards: gray border + 55% opacity (instant affordability scan)
- Chain-ready cards: gold glow + CHAIN badge
- Corruption thermometer: hidden at 0%, appears when relevant
- 0 ATK members: skip strike animation (saves time)
- Shop items: unaffordable dimmed to 40% opacity
- CRT scanlines + VHS effect (toggleable)
- Dramatic 2s per-member strike animation
- Boss projectile attack from boss to targeted member
- Card fly-and-shrink animation on play

## Meta Systems
- Mastery (Novice > Adept > Master > Legendary per card)
- Trophy Wall (28 bosses, first-kill tracking)
- Band Legacy (member stats across runs)
- Daily Challenge (shared seed)
- Combat Log, Score system with lifetime unlocks
