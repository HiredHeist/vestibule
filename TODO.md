# Vestibule — Master TODO & Design Reference
*Priority ranked. Auto-maintained. Updated end of Session 4.*

---

## 🔴 P1 — NEXT SESSION (Core gameplay gaps)

### 1. Implement all dead cards (most urgent)
Dead cards = broken trust. Every one of these appears 3x in the deck.

**Demo Tape** — Track `lastRiffPlayed` in state. On play: cast that card again for free. If no riff played yet this fight, show "No riff recorded yet."

**Setlist** — Modal overlay: show top 4 deck cards as large draggable tiles. Player drag-reorders then hits Confirm. Shuffles back in new order.

**The Remaster** — Modal: show 10 random deck cards. Player clicks 2 red X buttons to delete, 1 green + to duplicate. Confirms. Powerful late-game card.

**Hellquake** — See detailed spec below.

### 2. Keyword passives — make them real
These are the engine of build diversity. Without them all runs feel the same.

- **FRENZIED** (Bjorn/Ragnar) — Each Strike, if this member's ATK alone would deal >10 damage, gain +1 ATK permanently (stacks, max +5 per fight)
- **ANCHOR** (Ingrid/Dag) — End of each Strike phase: heal adjacent members 1HP. If both neighbors are alive, heal self 1HP too
- **CORRUPT** (Loki) — ATK = baseatk + floor(corruption/15). At 100% corruption, ATK doubles. Displayed dynamically on card
- **DEBUFF** (Nott) — Each Strike reduces boss base damage by 1 (min 1). Visual indicator on boss. Resets between fights
- **DOUBLE TIME** (Thor) — Already works ✅

---

## 🟠 P2 — HIGH IMPACT (Sessions 5-6)

### Hellquake — Full Design Spec
*Triggered by Black Sabbath Sigil card. Must feel catastrophic, mysterious, and unforgettable.*

**The effect — chaotic and powerful:**
Roll a d6 (1-6) at the moment of Hellquake. Result determines which of 6 equally likely outcomes fires:
1. **OBLITERATION** — Deal damage = total band ATK × 4 to boss. Pure power. Rare and clean.
2. **RESONANCE** — All band members gain +3 ATK permanently. The riff echoes forever.
3. **BACKLASH** — Boss takes 30 damage BUT one random member goes Too Stoned instantly. High risk/reward.
4. **POSSESSION** — All cards in hand become free to play this Strike. Infinite combos for one turn.
5. **RITUAL** — Reduce boss HP to exactly half, regardless of current HP. Works even if boss has 1HP left (floors to 1).
6. **THE VOID** — All Corruption is transferred to the boss as direct damage. Set your Corruption to 0. At 100% = 100 damage.

**Visual spec:**
- Screen goes black for 0.5s
- Massive ⛧ sigil expands from center
- Colour bloom (deep red → purple → white)
- Shake the entire viewport
- Reveal the outcome with gothic text announcement
- The outcome number is hidden until the moment of reveal — pure tension

### Foil & Mythic Card Editions
*Inspired by Balatro's editions but with our aesthetic*

**Foil cards** (uncommon rarity upgrade):
- Visual: animated shimmer/holographic effect on the card border
- Mechanical effect: +1 to all numeric values on the card (e.g. Amp It Up: ×2 → ×3 ATK, Warm Up: +1 → +2 ATK)
- Drop rate: ~15% chance when buying a card in shop or opening mid/high tier pack

**Mythic cards** (rare rarity upgrade):
- Visual: deep pulsing dark aura, animated runes on card back, unique colour treatment
- Mechanical effect: Card's effect triggers TWICE (e.g. Sound Check: all members +3HP fires twice = +6HP)
- Drop rate: ~4% from packs, never in base shop

**Foil/Mythic on stage** — the mentor ability:
- A foil member card on stage pulses with an amber shimmer
- The member DIRECTLY TO ITS RIGHT receives +1 ATK passively (the "mentor" relationship)
- Visual connection: both cards have a subtle golden chain/link animation between them
- A mythic member on stage: ALL adjacent members get +1 ATK
- If two foil members are adjacent to each other, both get the bonus (mutual synergy)

### Pack System Redesign — Music Format Theme
*Inspired by Balatro's 5-type pack system. Each pack type serves a distinct purpose.*

**CASSETTE TAPE** 🎵 (2-3 Stash) — Cards for your deck
- Normal: see 3 cards, pick 1
- Dubbed: see 4 cards, pick 1 (costs 1 more)
- Limited Edition: see 5 cards, pick 2 (costs 3 more, rare)
- Contains: regular deck cards, common/uncommon weighted

**CD-R** 💿 (4-6 Stash) — Passive run buffs (our "planet cards")
- Normal: see 2 buffs, pick 1
- Burnt Copy: see 3 buffs, pick 1 (costs 2 more)
- Contains: passive upgrades that last the entire run (see Passive Buff list below)
- Opens immediately on purchase (like Balatro's celestial packs — no inventory slot needed)

**RARE VINYL** 🎸 (8-12 Stash) — Artifacts & premium finds
- Standard Press: see 1 artifact + 1 card, pick 1
- First Pressing: see 2 artifacts + 1 card, pick 1 (costs 4 more)
- Contains: circle artifacts, rare/mythic chance cards
- Higher chance of foil/mythic editions

**DEMO REEL** 📼 (6-8 Stash) — Mixed, best value variance
- Contains: mix of cards + buffs + small chance of artifact
- Normal: see 4 items (mixed), pick 2
- Masters Edition: see 6 items, pick 2 (costs 3 more)
- The gambling pack — could be amazing or mediocre

### CD-R Passive Buffs (our "planet cards")
These are permanent run upgrades. Once applied they never leave. Should feel meaningful but not broken.

**ATK-focused:**
- **Power Chord** — All RIFF cards deal +2 bonus damage when played (stacks up to 3x per run)
- **Stage Presence** — Each fight you win, one random member gains +1 ATK permanently
- **Feedback** — Every 3 RIFF cards played in one Strike, reduce all RIFF costs by 1 ember this fight

**Survival-focused:**
- **Sound Check** — Start each fight with all members at full HP + 2 bonus HP
- **Roadie Crew** — First time any member would go Too Stoned each fight, they survive at 1 HP instead
- **Encore Ready** — After each boss is defeated, fully restore one random member's HP

**Economy-focused:**
- **Merch Table** — Earn +2 Stash per fight victory (stacks with base reward)
- **Packed House** — If you enter a fight with a full 5-member band, earn +3 bonus Stash on victory
- **Back Catalogue** — Rerolling the shop costs 1 less Stash (min 1)

**Corruption/Chaos:**
- **Devil's Tuning** — Corruption never decreases below 20% (floor). In exchange, +15% base damage
- **Static** — At the start of each fight, gain a random card from outside your current deck (temporary, discarded after fight)
- **Distortion Pedal** — Every 20% Corruption = +1 ember per fight start

**Deck-focused:**
- **B-Side** — Your deck has one extra copy of every RIFF card (added at start of next fight)
- **Greatest Hits** — The first card drawn each Strike is always one you haven't played this fight
- **Soundboard** — Each fight, your first Discard is free (doesn't use a discard counter)

---

## 🟡 P3 — POLISH & DEPTH

### Ember Economy Review
*Current balance analysis:*

Starting embers: 6. Cards cost 1-5. Average card cost ~2. With 6 cards in hand, you can typically play 2-3 cards per Strike. That feels about right for early fights but too easy for Circle I.

**Proposed tweaks:**
- Reduce starting embers to **5** (creates harder choices immediately)
- The Hellfire Amulet artifact (+2 bonus embers/fight) becomes genuinely valuable
- Tapped Out (FREE, +5 next Strike) becomes a more interesting card vs alternatives
- Groupie (net +1 ember) becomes relevant as an opener for combos

### Stash Economy Review
*Current: win fight → earn 6 + rand(3) + strikes remaining. Shop costs: 3-8 per card.*

**Issues:**
- Too easy to go broke by fight 2 if you buy everything
- No way to earn Stash mid-fight
- Reroll starts at 4 and escalates — fine

**Proposed additions:**
- **Perfect Strike** bonus: if you defeat the boss in fewer than 3 strikes, earn +3 bonus Stash
- **Merch Drop**: small chance (15%) each fight to find 2 bonus Stash on the floor (logged as "Found some merch money")
- **Corruption Dividend**: if you finish a fight with >75% Corruption, earn +2 Stash (risk/reward for Loki builds)
- Cards like The Hermit from Balatro — a card that doubles your current Stash (capped at 10) could be interesting

### End Screen
- Victory: more celebratory — show run stats, band composition, signature plays
- Defeat: lean psychedelic — the Too Stoned aesthetic

### Card Draw Animation
- Cards slide up from deck into hand (upward whoosh)
- Massive juice moment, especially on full refills

### Opening Night Screen
- Show all 7 musicians (currently only 5)
- Let player see full band composition before committing

---

## 🟢 P4 — FUTURE

### Circles II-IX
Following Dante's circles — each has thematic enemies:
- II (Lust): enemies that buff themselves each round, seduction mechanic
- III (Gluttony): enemies that gain HP when you play cards
- IV (Greed): stash is at risk, enemies steal stash on hit
- V (Anger): enemies hit harder the more you buff your band
- Each circle introduces 2-3 new cards, 1 new mechanic

### Meta-progression
- Unlock new band members by completing circles
- Unlock new card types by playing specific builds
- Daily seed challenge mode
- Achievement system tied to the Too Stoned mechanic

### Sound
- Card draw sound
- Hellquake dramatic swell + impact
- Too Stoned psychedelic bloom
- Victory fanfare
- Shop ambient (dark, smoky, jazz-doom hybrid)

### Platform
- Steam page
- Card artwork (real illustrations to replace emojis)
- Mobile check

---

## 📊 FULL CARD REVIEW — What each card should do

### Currently working ✅
| Card | Status | Notes |
|------|--------|-------|
| Amp It Up | ✅ | Doubles target ATK. Core card. |
| Warm Up | ✅ | +1 ATK temp. Good cheap opener. |
| New Strings | ✅ | +2 ATK permanent. Expensive but strong. |
| Encore | ✅ | Attack again. Stack with buffs for big turns. |
| Infernal Encore | ✅ | ALL attack again. Game-winning combo. |
| Stage Dive | ✅ | HP-to-damage. Once per round. |
| Overdrive | ✅ | Double ALL ATK if >80% corrupt. Powerful. |
| Possessed Performance | ✅ | Triple ATK. Most expensive. Should feel legendary. |
| Burn the Set | ✅ | Full hand refresh. Good for digging. |
| Sound Wall | ✅ | 5 direct damage + skip boss passive. Niche but useful. |
| Dial to Eleven | ✅ | +20% corrupt. Feeds Loki and Feedback Loop. |
| Signal Decay | ✅ | -30% corrupt + 5 HP heal. Defensive control. |
| Feedback Loop | ✅ | Damage = corrupt %. Best at 80-100%. |
| Controlled Feedback | ✅ | Set to 50%. Stabilizer. |
| Sound Check | ✅ | +3 HP all. Simple but useful. |
| Roadie | ✅ | Shield from Too Stoned. Underrated. |
| Wake Up Call | ✅ | Revive member. Save a run card. |
| Groupie | ✅ | Net +1 ember. Efficient if you have embers to spend. |
| Tapped Out | ✅ | +5 embers next Strike. Free cost makes it interesting. |

### Needs implementing 🔴
| Card | Priority | Design Notes |
|------|----------|-------------|
| Demo Tape | HIGH | Track lastRiffPlayed. Copy + free cast. |
| Setlist | HIGH | Drag-to-reorder top 4 deck cards modal. |
| The Remaster | HIGH | Delete 2, copy 1 from 10 deck cards modal. |
| Black Sabbath Sigil / Hellquake | HIGH | See full Hellquake spec above. |

### Balance concerns ⚠️
| Card | Issue | Fix |
|------|-------|-----|
| Possessed Performance | 5 embers is almost never castable | Reduce to 4 embers OR reduce effect to ×2.5 ATK at 4 embers |
| Stage Dive | Once per round limits are unclear to new players | Add clear visual indicator when used |
| Sound Wall | 5 damage is weak in fights 2-3 | Scale with fight index: 5/8/12 damage |

---

## 🎮 ADDICTIVENESS ASSESSMENT

**What's working:**
- ✅ Core loop is solid and fast — fights feel active, not passive
- ✅ The aesthetic is genuinely unique — nobody else has this
- ✅ Too Stoned mechanic is memorable and thematic
- ✅ Corruption creates real tension and build identity

**What's missing for "one more run" feeling:**
- ❌ Build diversity — without keyword passives all runs feel similar. Fix is P1.
- ❌ Memorable moments — Hellquake could be THE moment. Currently it does nothing.
- ⚠️ Stakes — Too Stoned needs the psychedelic visual treatment to feel catastrophic
- ⚠️ Discovery — foil/mythic cards create "I've never seen THAT before" moments
- ❌ Meta-progression — nothing carries between runs. Even 3 unlockable band members would help.

**Honest score:** 6/10 addictiveness right now. With P1+P2 done: 8.5/10. That's a Steam launch candidate.

---

## ✅ COMPLETED SESSION 4
- [x] Play screen UI fully locked
- [x] Boss throbbing red glow box
- [x] Member cards 230×345, correct size
- [x] Hand cards: fixed height, hover z-index, drag-to-reorder
- [x] drawUpTo while loop fix
- [x] Attack number red pulse animation
- [x] Ghost card + shop leave bugs fixed
- [x] Recruit screen working
- [x] Enemy rebalance: 40/69/100 HP
- [x] GitHub + living GDD.md

### ✅ Completed in this push
- [x] "Stoned to the Bone" death screen (Dark Souls style, green glow, YOU DIED text)
- [x] Ember progression: starts at 5, +1 after each Circle boss, max cap 8
- [x] Demo Tape card implemented (replays last RIFF for free)
- [x] CORRUPT keyword live (Loki ATK = base + floor(corruption/15))
- [x] ANCHOR keyword live (Ingrid/Dag heal adjacent members +1HP after each Strike)

---

## 🎮 SETTINGS / COLLECTION / UNLOCK SYSTEM (P2)

### Settings Menu (⚙ button, top-right corner of play screen)
- [ ] Volume sliders for music and SFX separately
- [ ] Deck back design selector (unlock via run milestones)
- [ ] Accessibility options: reduce motion toggle, colorblind mode
- [ ] Seed input field for challenge/custom runs
- [ ] "How to Play" quick reference card (keywords, card types, mechanics explained)

### Collection Screen (🏆 button)
- [ ] **Band member roster** — all 7 members shown, locked ones as shadowed silhouettes with cryptic unlock hint (e.g. "Defeat Circle II with a full band")
- [ ] **Card collection** — all cards shown, locked/undiscovered as dark outlines with a ? and a subtle hint
- [ ] **Artifact collection** — artifacts found/purchased shown, undiscovered hidden
- [ ] **Run history** — last 5 runs with seed, fight reached, cause of death
- [ ] **Statistics** — total strikes thrown, total Too Stoned events, highest single strike damage, most played card, total Stash earned lifetime

### Unlock Conditions (examples to build from)
- Beat Circle I → unlock Nott and Dag
- Beat Circle II → unlock foil card editions in shop
- Go Too Stoned 10 times total → unlock a unique "Relapse" card
- Win a fight with 100% Corruption → unlock Black Sabbath Sigil as a possible starting card
- Win with only 2 band members → unlock a secret Mythic card (never appears in normal shop)
- Discover all cards → unlock a special deck back design
- Beat the game → unlock "New Game+" with a harder difficulty modifier

### Why this matters for retention
The collection screen should show you what you CAN'T have yet — silhouettes, cryptic hints, mystery.
That's the obsession loop: "just one more run to unlock that." Balatro does this brilliantly.
Even 3 locked members visible from the start gives players an immediate long-term goal.

---

## 🎨 PSYCHEDELIC VISUAL SYSTEM — RETRO 1994 TREATMENT

*The goal: make Vestibule look like it was recovered from a damaged VHS tape of a 1994 metal music video game that somehow runs perfectly. Classy, not kitsch. Think early Doom meets a CD-ROM game manual aesthetic.*

### What we mean by "retro 1994" — NOT just scanlines:

**Chromatic Aberration** — Subtle RGB channel split on key UI elements (boss name, "STONED TO THE BONE" text). Red channel shifts slightly left, blue shifts slightly right. Only on dramatic moments, not constant.

**VHS Tape Noise** — Occasional horizontal "glitch lines" that drift slowly up the screen. Not random flicker but slow, organic drift. Like a tape being played on a slightly warped machine. Applied as a CSS animation on a fixed overlay div, very low opacity (~8%).

**CRT Phosphor Glow** — Text elements get a subtle bloom effect where the glow spreads unevenly, slightly stronger on the left side (how old CRT phosphors actually decayed). Already somewhat achieved with textShadow but we can push this further.

**Pixel Font for specific UI elements** — Not the gothic fonts, but counter numbers (HP, ATK, Stash) could use a pixel/bitmap style font for those specific values only. Like they're reading off a health bar from a 1994 RPG.

**Color Banding** — Backgrounds use stepped gradients rather than smooth ones. 4-6 distinct color bands instead of linear gradient. Classic early 3D render aesthetic.

**Interlace Flicker on dramatic moments** — When Hellquake fires or Too Stoned triggers: a brief (0.3s) interlace effect where alternating rows go slightly brighter/darker. Like the TV is about to blow out.

**Dithering pattern on dark areas** — The black hand area and dark backgrounds could have a very subtle dithering texture overlay. Classic early PC game look — not pixelated but hinting at it.

**Loading/transition effect** — Between screens (shop → fight), a brief "loading" horizontal wipe with a pixel bar. Like an old game loading a new room.

### Implementation approach:
- Most effects are CSS-only (overlay divs, animations, filters)
- Chromatic aberration: `text-shadow: -1px 0 red, 1px 0 blue` variant
- VHS drift: CSS keyframe animation on a fixed overlay with `repeating-linear-gradient`
- Phosphor bloom: enhanced `filter: blur` + `mix-blend-mode: screen` on a duplicate element
- Color banding: step-function gradients in the background elements
- Keep it subtle enough that a first-time player might not consciously notice, but would feel it

### When to apply:
- **Always on:** Very subtle VHS drift, color banding, CRT phosphor glow on text
- **Corruption 50%+:** Chromatic aberration starts on boss name and attack number
- **Corruption 100% / Hellquake:** Full interlace flicker, strong chroma split, heavy bloom
- **Stoned to the Bone screen:** Maximum effect — this should look like the TV is dying

### ✅ Completed this push
- [x] All 7 musicians shown on Opening Night screen
- [x] FRENZIED keyword — +1 ATK permanently when member lands killing blow on boss
- [x] DEBUFF keyword — Nott/Vocalist reduces boss damage by 1 per Strike (resets each fight)
- [x] Hellquake d6 system — 6 wildly different outcomes: OBLITERATION / RESONANCE / BACKLASH / POSSESSION / RITUAL / THE VOID
- [x] Setlist card — drag-to-reorder modal showing top 4 deck cards, lock in new order
