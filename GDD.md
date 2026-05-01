# VESTIBULE — Game Design Document

*Version 3.0 — May 2, 2026 (post v20 balance pass + keyword refactor)*

**Genre:** Doom Metal Roguelite Deckbuilder
**Inspiration:** Balatro × Slay the Spire × Black Sabbath
**Platform:** Web (React + Vite, single-file App.jsx). Steam Early Access target.
**Pricing:** $4.20 pre-order / $6.66 full / $9.99 release

---

## CORE LOOP

1. **Tutorial** (first time) — 3 scripted fights teach cards, corruption, combos
2. **Opening Night** — Pick 2 of 8 starter band members
3. **Descent Map** — Choose path through 3 fights per circle (skip for rewards, forfeit shop)
4. **Combat** — Play cards from hand to buff members, then Strike. 4 strikes per fight.
5. **Shop** — Buy cards, members, artifacts, passives, drugs (Sly the Fence sells)
6. **Pact + Doom Forge** — After each circle boss: pick a pact modifier + upgrade a card
7. **Repeat** — 9 Circles × 3 fights = 27 enemies + AR Executive + Lucifer = 29 total
8. **Encore Mode** — After first Lucifer kill, replay at 2× HP scaling for prestige

---

## COMBAT FUNDAMENTALS

- **4 Strikes per fight** (3 on Demonic stake)
- **4 Discards per fight** — discard hand cards to draw replacements
- **HAND_SIZE = 6**, max 10 (over-cap pulses gold)
- Cards cost Embers (start each fight at `maxEmbers`, current cap is 8)
- Each Strike: every living, non-Drummer member deals their ATK as damage
- Drummers roll d6 to multiply total damage:
  - 1-2 = ×1.0 (no bonus)
  - 3-4 = ×1.5
  - 5-6 = ×2.0
- **strikeMult**: starts at ×1.0 each Strike, accumulates from cards/keywords
  - +×0.05 per card played (linear baseline)
  - Can be multiplied by artifacts, keywords, corruption mults
  - Cap: ×10,000 (raised from ×6.66 in v20)

---

## CARD TYPES (4)

| Type | Color | Focus |
|------|-------|-------|
| RIFF | Purple `#9933CC` | Direct damage, ATK buffs, chain triggers |
| CORRUPT | Blood red `#AA1111` | Corruption-scaling power, high risk |
| UTILITY | Green `#22AA44` | Healing, draw, economy, control |
| EMBER | Orange `#C87820` | Ember management, resource generation |

**82 unique cards** across 5 starter decks. Decks vary in composition.

---

## RIFF CHAINS (16)

Play two specific cards in the same Strike → triggers chain → ×1.78 strike multiplier.

Chain firing also adds a "DISCOVERY!" beat the first time per save. Chain pairs are deliberately discoverable through play, not pre-revealed in the UI (with `chainhints` toggle for those who want them).

---

## CORRUPTION (0-100%)

Visible thermometer (hidden when 0). Crossing thresholds adds a card to your hand.

| Threshold | Name | Effect |
|---|---|---|
| 25% | Whispers | Weakest member takes 1 damage per fight |
| 50% | Hunger | All shop prices +25% |
| 75% | Madness | 15% chance to lose a random card per Strike |
| 100% | Possession | Boss +3 dmg permanently. CORRUPT members +3 ATK once. |

CORRUPT keyword members scale ATK with corruption — high corruption is *power* if you build for it.

---

## MEMBER KEYWORDS (9)

Members have one keyword each. Keywords scale with **stack tier** (1 / 2 / 3+ same-keyword members):

| Keyword | Effect |
|---|---|
| **FRENZIED** | +ATK per RIFF played each Strike. Tier 1/2/3+ = 1×/2×/4× scaling. |
| **SHREDDER** | +ATK per consecutive same-type card chain played each Strike. Tier 1/2/3+ = 1×/2×/4×. |
| **ANCHOR** | Saves a member from a lethal hit. 1 save/fight (tier 1), 2 saves (tier 2), 4 saves *any member* (tier 3+). |
| **DOUBLE TIME** (Drummers) | Drummer roll: 5-6=×2, 3-4=×1.5, 1-2=×1. Tier 3+: ALL members attack twice (currently unreachable due to "ONLY ONE DRUMMER" rule, see TODO 1.2). |
| **CORRUPT** | +ATK from Corruption (tier 1/2/3+ = ×1/×2/×4 the per-corruption bonus). |
| **DEBUFF** | Reduces boss damage by 2 each Strike, stacking permanently this fight. |
| **FOLK MAGIC** | 20% chance each Strike to refill all Embers. |
| **HEXED** | Gains corruption each Strike, ATK scales with corruption. |
| **FALLEN** | Cannot be healed. Loses 1 HP/Strike. If Lucifer dies, game over. Max 3 band members. |

Foil members count as 2 stacks for keyword tier purposes.

---

## MEMBER TIERS

| Tier | Stat bonus | Visual | Source |
|---|---|---|---|
| Basic | base | normal frame | Opening Night, recruit packs |
| Foil | +1 ATK / +2 HP | blue shimmer border | rare in shop |
| Mythic | +2 ATK / +4 HP | purple shimmer border | very rare |
| Demonic | +3 ATK / +5 HP | gold shimmer border | mythic-tier shop find |

---

## MENTOR LINKS

Place a Foil/Mythic/Demonic member **directly LEFT** of a same-role Basic = active mentor link. Link triggers a permanent strike multiplier:

- Foil-mentor: ×1.5 on bond strike
- Mythic-mentor: ×2.0
- Demonic-mentor: ×3.0

43% of runs form a mentor link (per sim).

---

## SYNERGY BONUS

Number of **buffed** members at strike time:

- 3+ buffed: ×1.10 damage
- 4+: ×1.20
- 5+: ×1.35

---

## STAKES (6 difficulty levels)

Stakes layer over decks. Unlock by beating game on the previous stake.

| Stake | hpMult* | dmgAdd | priceMult | maxStrikes | startEmbers | startCorruption | scoreMult |
|---|---|---|---|---|---|---|---|
| Bronze | 1.20 | 0 | 1.0 | 4 | 5 | 0 | 1.0 |
| Silver | 1.25 | +2 | 1.0 | 4 | 5 | 0 | 1.5 |
| Gold | 1.25 | +3 | 1.25 | 4 | 5 | 0 | 2.0 |
| Obsidian | 1.45 | +2 | 1.25 | 4 | 5 | 0 | 2.5 |
| Blood | 1.70 | +2 | 1.25 | 4 | 4 | 10 | 3.0 |
| Demonic | 1.66 | +4 | 1.5 | 3 | 4 | 15 | 4.0 |

\* `hpMult` is currently unapplied in combat (see TODO 1.2 — open design call).

---

## STARTER DECKS (5, all 69 cards)

Unlock progression: each deck unlocks the next on full-game victory.

| Deck | RIFF | CORRUPT | UTILITY | EMBER | hpScale | Identity |
|---|---|---|---|---|---|---|
| ⛧ Standard | 32 | 18 | 10 | 9 | 1.85 | Balanced, all playstyles |
| 🎸 Shredder | 38 | 10 | 8 | 13 | 2.00 | Pure aggro, max RIFF |
| 💀 Ritualist | 21 | 26 | 11 | 11 | 1.65 | Corruption = power |
| 🔧 Engineer | 24 | 13 | 18 | 14 | 1.85 | Combo, copy, multiply |
| 🛡️ Survivor | 25 | 15 | 15 | 14 | 1.75 | Outlast, extra strikes |

`hpScale` is the **only** boss HP multiplier in live combat. All scaling math goes through `getScaledMaxHp` (App.jsx ~line 4904).

---

## CIRCLE PROGRESSION

9 Circles, 3 fights each (2 minor enemies + 1 circle boss):

| # | Circle | Theme | Bosses |
|---|---|---|---|
| I | Limbo | Foggy void | Wanderer / Lost Soul / Drifter |
| II | Lust | Velvet rooms | Siren / Tempter / Seducer |
| III | Gluttony | Rotting feasts | Glutton / Feaster / Devourer |
| IV | Greed | Falling gold | Miser / Hoarder / Usurer |
| V | Anger | Lakes of fire | Wrathful / Berserker / Warlord |
| VI | Heresy | Burning books | Heretic / Apostate / False Prophet |
| VII | Violence | Weapon forest | Brute / Hunter / Executioner |
| VIII | Fraud | Endless mirrors | Trickster / Deceiver / Archfraud |
| IX | Treachery | Ice plains | Traitor / Betrayer / **LUCIFER** |

**AR Executive** appears between final shop and Lucifer (89,700 HP) — the Welcome to Hell penultimate fight.

For current calibrated boss HPs, run sim or read directly from `ENEMIES` in `src/App.jsx` line 208. Boss HPs were rebalanced in v20 (commit `7da196c`) and tuned again with the keyword refactor (commits `b205628` through `58cc53f`). The doc-version of the HP table goes stale fast — always trust the code.

---

## ARTIFACTS & PASSIVES

**Artifacts** (12 total): triggered ability mods. Equip 3-4 per run from boss kills + shop.
- 7 standard (a1, a3, a5, a6, a8, a9, a10, wardrums)
- 4 corrupt (ca1, ca2, ca3, ca4) — bigger swings, gated behind C5+

**Passives** (10 total): always-on equipment. 2 effect-pedal slots + starter passives.

Both are still using procedural placeholder art (see TODO 5.2, 5.3).

---

## PACTS

After each circle boss, pick 1 of 2 pact modifiers. 13 pacts in pool, never repeat:

`ember_surge`, `iron_strings`, `thick_skin`, `dark_bargain`, `speed_demon`, `blood_price`, `clean_living`, `corruption_engine`, `merchants_eye`, `stone_wall`, `sixth_slot`, `war_drums`, `atonement`

Each is a permanent run modifier with a tradeoff (e.g., `blood_price` = +3 ATK all but lose 5 HP/fight).

---

## DOOM FORGE

After each circle boss: select one card to upgrade. Upgrade options vary by card:
- Cost reduction (most common)
- Effect amplification (e.g., +ATK becomes +ATK + draw)
- Type swap (rare, deep upgrade)

3.4 forges per run on average (per sim).

---

## DRUGS (shrooms / acid)

Bought from Sly. Pre-fight consumables with random effects.

- **Shrooms**: 65% positive (+stash, +cards, +ATK), 30% neutral, 5% bad trip
- **Acid**: 90% game-changing (×2 dmg, double cards, +3 ATK all, immunity), 5% nothing, 5% Hellquake

Acid is currently underused (25:1 shroom:acid ratio per sim — see TODO 2.1).

---

## DOPAMINE LAYER (live as of v20)

Currently shipped:
1. Live damage preview pulse on change
2. 7-tier damage screen effects (50/200/500/1K/2.5K/5K/10K+)
3. Ascending pitch beep on each card played
4. Boss HP bar critical pulse below 50%
5. Post-strike highlight flash with NEW BEST! callout
6. Stash count-up with cha-ching
7. Chain fire golden flash + rising synth
8. Strike button escalation (4 tiers)
9. Daily seed challenge (Beat VomitWizard)
10. Lucky Draw (post-Lucifer unlock)
11. Artifact trigger pulse
12. Corruption heartbeat vignette
13. Chain name callout
14. Card mastery pops (10/25/50/100/250/500 plays)
15. Member MVP after victory
16. Shop NEW! badges
17. Live grade tracker (D→C→B→A→S→SS)
18. Member distress at low HP
19. Multiplier milestones (×2/×4/×8/×16)
20. Stash milestones (100/200/300/420)

20 more dopamine ideas in TODO.md (the bottom section). Highest-impact: running mult tally, boss intent telegraph, kill-confirm highlight.

---

## META SYSTEMS

- **Mastery** — 6-tier card play tracking (Novice → Adept → Master → Legendary → Mythic → Eternal)
- **Trophy Wall** — 28 boss first-kill records
- **Band Legacy** — per-member stats across runs
- **Daily Challenge** — shared seed, "Beat VomitWizard" target (6,666 score)
- **Score grades** — D, C, B, A, S, SS
- **Stake unlocks** — Bronze → Demonic progression
- **Achievements** — 28+ unlocks tracked in localStorage

---

## UI/UX FEATURES

- Unaffordable cards: gray border + 55% opacity
- Chain-ready cards: gold glow + CHAIN badge (when `chainhints` enabled)
- Corruption thermometer: hidden at 0%
- 0-ATK members: skip strike animation
- Shop items: unaffordable dimmed to 40%
- CRT scanlines + VHS overlay (toggleable)
- Drag preview on member hover
- Card fly-and-shrink animation on play
- Boss projectile attack vector
- Ghost preview on drag-over
- Per-fight save (auto-saved at fight start, cleared on end)

---

## TUTORIAL FLOW

3 scripted fights with predetermined hands (~5 minutes):

1. **Fight 1** (Wanderer) — Cards, embers, Strike basics. Corruption hidden. Members: Bjorn (FRENZIED) + Gunnar (SHREDDER).
2. **Fight 2** — Corruption introduced. Enemy raises corruption per Strike.
3. **Fight 3** — Ember management sequence ending with a Riff Chain discovery.

After tutorial, FIRST_TIPS fire on first encounter with: pacts, shop, events, descent map.

Skip Tutorial option for experienced players.

---

## CHARACTER ROSTER

**18 band members**, 8 archetypal roles:

- **Lead Guitarists**: Bjorn, Ragnar (FRENZIED)
- **Rhythm Guitarists**: Sigrid, Gunnar (SHREDDER)
- **Bass Players**: Ingrid, Dag, Ulf, Brynja, Tanuki (ANCHOR)
- **Drummers**: Thor, Rolf (DOUBLE TIME)
- **Synth Players**: Loki, Freya (CORRUPT)
- **Vocalists**: Grimnir, Astrid (DEBUFF)
- **Dark Minstrels**: Vitalik, Orm (FOLK MAGIC / HEXED)
- **The Devil**: Lucifer (FALLEN, post-victory unlock)

Members have idle GIF animations (`public/members/idle/{id}_stage_idle.gif`) and stage portraits (`public/members/{id}_stage.png`).

---

## RELATED DOCS

- `CLAUDE.md` — dev notes, code structure, gotchas
- `TODO.md` — prioritized task list (the active work doc)
- `ART_TODO.md` — art assets needed
- `STEAM.md` — build & deploy guide

---

## VERSION HISTORY (recent)

- v3.0 (May 2, 2026) — full rewrite after v20 balance + keyword refactor + HP-scaling fix
- v2.1 (Apr 13, 2026) — pre-rewrite (kept now only for archive reference)
- v2.0 — initial 9-circle structure
- v1.x — early prototype (single-file 5-circle game)
