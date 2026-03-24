# VESTIBULE — TODO & Status
**Updated March 24, 2026 | Commit 364195c**

---


## 🔴 CRITICAL BUGS — FROM CIRCLE 9 CRASH PLAYTEST (March 24, 2026)

### P0 — CRASH BUGS (Game-ending)

- [x] **BUG 9: 8 drawUpTo() calls use stale state** ✅ FIXED — ROOT CAUSE OF CRASH
  Lines: 3183, 3202, 3224, 3245, 3271, 3279, 3354, 3645
  All pass `deck`, `hand`, `discardPile` state vars captured in closures.
  By Circle 8-9, cards leak into multiple locations (hand+discard simultaneously).
  FIX: Replace with `deckRef.current`, `handRef.current`, `discRef.current` in all 8 calls.

- [x] **BUG 10: 10 unguarded .map() calls in render** ✅ FIXED — CRASH ON UNDEFINED
  hand.map (L5263), stage.map (L5080, L694, L878), pactChoices.map (L4853),
  floats.map (L4941), projectiles.map (L4942), shopCards.map (L1594),
  chosenPacts.map (L5132), activePassives.map (L5253)
  FIX: Add .filter(Boolean) before every .map() in render.

- [x] **BUG 11: Groupie & Setbreak setHand race** ✅ Already fixed (both return false, handled in handleDropOnStage)
  L2826 (Groupie) and L2967 (Setbreak) call setHand inside applyCard.
  handleDropOnStage ALSO calls setHand after applyCard returns. Race condition.
  FIX: Move draw logic to handleDropOnStage (like Smoke Break pattern).

### P1 — GAMEPLAY BUGS (Wrong behavior)

- [x] **BUG 1: Stonewall on Stage Dive** — DESIGN CORRECT (self-inflicted) (L2754)
  Member dies from Stage Dive self-damage without checking stoneShield.
  FIX: Add stoneShield check before setting tooStoned.

- [x] **BUG 2: Stonewall on Sound Check** — DESIGN CORRECT (L2795)
  FIX: Add stoneShield check.

- [x] **BUG 3: Stonewall on Burn Set** — DESIGN CORRECT (L2883)
  FIX: Add stoneShield check.

- [x] **BUG 4: Stonewall on Amp Static** — DESIGN CORRECT (L2925)
  FIX: Add stoneShield check.

- [x] **BUG 7: Stonewall on Possessed Performance** — DESIGN CORRECT (L3098-3099)
  FIX: Add stoneShield check.

- [x] **BUG 12: 126 duplicate React key errors** ✅ FIXED (root cause was Bug 9)

- [x] **BUG 15: Card leak in 5 handleDropOnStage handlers** ✅ FIXED
  Groupie, Setlist, Burnset, Remaster, Signal Decay all removed played card
  from hand but never added it to discard. Cards vanished permanently,
  shrinking deck over time. Fixed by including card in drawUpTo discard arg.
  UIDs appearing in multiple rendered lists simultaneously.
  ROOT CAUSE: Bug 9 (stale state in drawUpTo). Fixing Bug 9 fixes this.

### P2 — BALANCE / UX BUGS

- [x] **BUG 5: Uncapped stash in descent rewards** ✅ FIXED (L227, L234, L238, L243)
  Descent skip rewards add stash without Math.min(MAX_STASH) cap.
  FIX: Wrap all descent stash additions in Math.min(MAX_STASH, ...).

- [x] **BUG 6: Uncapped setStash calls** ✅ FIXED (capped to 420)
  Various reward paths don't respect MAX_STASH=420 limit.
  FIX: Audit all setStash calls and add caps.

- [x] **BUG 13: Consumable cards in Doom Forge** ✅ FIXED
  Sabbath Sigil (consumable) can appear in upgrade list. Wasted upgrade.
  FIX: Filter consumable cards from uniqueUpgradeable.

- [x] **BUG 14: setEmbers calls** ✅ Already capped (verified)
  Some ember additions don't respect maxEmbers or MAX_EMBERS_CAP.
  FIX: Audit all setEmbers calls and add Math.min caps.

- [x] **BUG 8: Corruption 100% visual feedback** ✅ FIXED (☠ prefix + bright red)
  False Prophet pushes to 100% but nothing happens without Sabbath Sigil.
  FIX: Add subtle visual warning or small gameplay effect at 100%.

---

## TOP 10 — MAXIMUM ADDICTION FEATURES

These features are designed using proven psychological hooks from Balatro (variable ratio reinforcement, number-go-up transparency), Slay the Spire (build identity, meaningful choices), and Hades (meta-progression narrative). Each one targets a specific addiction mechanism.

### 1. DAMAGE BREAKDOWN ANIMATION (Number-Go-Up Dopamine)
**Hook:** Balatro's #1 trick — watching the score build in real-time.
After every Strike, show a 2-second animated breakdown:
- Base ATK ticks up member by member (each name flashes)
- Multiplier applies with screen shake + pitch-rising SFX
- Genre bonus adds with color flash
- Mentor link bonus adds with glow
- Combo bonus adds with explosion
- Final number SLAMS onto screen in huge font
Players will chase bigger numbers obsessively. The transparency makes every upgrade feel earned.
Currently damage just... happens. This makes it a SPECTACLE.

### 2. DAILY SEED + LEADERBOARD (Social Competition / Daily Habit)
**Hook:** Wordle's "one puzzle per day" retention. Players return EVERY day.
- One shared seed per day (same enemies, same shop, same card draws)
- Post-run: show your score vs global leaderboard (top 100)
- Share button generates URL: "I scored 420,069 on today's Vestibule seed — can you beat me?"
- Badge for daily streaks (3-day, 7-day, 30-day)
- Requires no backend — seed encodes all RNG, leaderboard via simple API or localStorage comparison
This alone could double retention. Wordle proved daily seeds create habits.

### 3. CARD MASTERY SYSTEM (Long-Term Progression / Completionism)
**Hook:** Pokemon "gotta catch 'em all" + Slay the Spire ascension unlocks.
- Each card tracks times played across ALL runs (persistent counter)
- Mastery tiers: Novice (10 plays) → Adept (50) → Master (200) → Legendary (666)
- Each tier unlocks a cosmetic: bronze border → silver → gold → animated holographic
- At Master tier: unlock a LORE ENTRY about the card (metal band history, Hell mythology)
- Mastery page in main menu shows grid of all 41 cards with progress bars
- Players will use "bad" cards just to master them, extending playtime massively
- Visible progress bars exploit completionism — "I'm 180/200 on Battle Cry, ONE more run"

### 4. RANDOM EVENTS BETWEEN FIGHTS (Variable Ratio Reinforcement)
**Hook:** Slay the Spire's events are what make every run feel unique.
Between non-boss fights (50% chance), present a Hell-themed event with a CHOICE:
- "The Ferryman" — Pay 15 stash to peek at next 3 shop cards, or refuse
- "Crossroads Demon" — Sacrifice 1 card from deck permanently for +3 ATK to all members
- "The Mosh Pit" — All members take 2 damage but gain +1 ATK permanently
- "Vinyl Collector" — Choose: gain a random Rare card OR +20 stash
- "Cursed Amp" — Gain +2 max embers but corruption +15%
- "Blood Pact" — One member gets double ATK but dies if they take any damage this circle
- "Audience with Satan" — Preview your next boss loot, but boss gets +10% HP
- "The Groupie" — Free random member joins (might be terrible, might be Mythic)
Each event is a GAMBLE. The variable outcomes create the "what if I picked the other one" regret that drives replays.

### 5. ACHIEVEMENT-GATED STARTER DECKS (Meta-Progression / Replayability)
**Hook:** Slay the Spire's characters + Balatro's deck variants.
Unlock alternate starting decks by completing achievements:
- "The Purist" deck — Only 40 cards but all Foil. Unlock: win with 0% corruption
- "The Corrupted" deck — Start at 50% corruption but includes 3 Rare cards. Unlock: win with 100%+ corruption
- "The Speedrunner" deck — 30 cards, +2 starting embers. Unlock: win in under 15 minutes
- "The Hoarder" deck — 90 cards, +50 starting stash. Unlock: reach 420 stash in a run
- "The Minimalist" deck — 20 cards, all upgraded. Unlock: win with a deck of 30 or fewer
- "The Sabbath" deck — 69 cards + 3 Sabbath Sigils. Unlock: trigger 3 Hellquakes in one run
Each deck fundamentally changes strategy. Players who "beat the game" now have 6 MORE games to beat.

### 6. BOSS TROPHY WALL (Collection / Visual Bragging Rights)
**Hook:** Monster Hunter's trophy room. Visual proof of your conquests.
Main menu has a "Hall of Damnation" — a dark gallery wall:
- Each boss you've defeated gets a trophy slot (27 slots + Lucifer + Executive)
- Trophies show: fastest kill time, highest damage in one strike, difficulty beaten on
- Empty slots show "???" with the boss silhouette — drives completionists crazy
- Special frames for Demonic-stake kills (glowing red border)
- Lucifer's trophy is the centerpiece — tracks total kills across all stakes
- "Beat all 27 on Gold" unlocks a secret cosmetic. "All on Demonic" unlocks a hidden card.
The wall makes every loss feel like progress toward filling a slot.

### 7. CORRUPTION GAMBLING MINI-GAME (Risk/Reward Loop)
**Hook:** Balatro's "skip blind for money" risk. The "do I push my luck?" tension.
At corruption thresholds (25%, 50%, 75%), offer a gamble:
- At 25%: "Sell your soul? +5 ATK to all but corruption locks at 25% (can't reduce)"
- At 50%: "Double or nothing? Flip: heads = corruption drops to 0, tails = goes to 100"
- At 75%: "The Devil's Offer: next 3 cards are free, but every card after costs +1 ember"
These create MOMENTS — the player is sweating, weighing risk vs reward. 
The 50% coin flip is pure gambling psychology. Players will talk about "the flip" for hours.
Combine with the existing multiplier system: high corruption already boosts CORRUPT card damage, so there's always a reason to STAY corrupted.

### 8. POST-RUN REPLAY HIGHLIGHTS (Social Sharing / "One More Run" Trigger)
**Hook:** Sports highlight reels. Show the player their own greatest moments.
After every run (win OR lose), show a 10-second "highlight reel":
- "Biggest Strike: 12,450 damage on Strike 3 vs The Executioner"
- "Closest Call: Survived with 1 HP on Thor"
- "Longest Combo Chain: Shred Storm + Hellfire + Death Wish in one Strike"
- "Cards Played: 147 | Corruption Peak: 96% | Stash Earned: 389"
- Share button: generates a screenshot-ready card with your run stats
- If you LOST: "You were 2 strikes away from beating The Archfraud. Try again?"
The last line is the killer. Showing HOW CLOSE you were to winning triggers loss aversion. 
"I was RIGHT THERE" is the most powerful motivator for starting another run immediately.

### 9. BAND LEGACY SYSTEM (Emotional Attachment / Narrative)
**Hook:** XCOM's soldier attachment. You care because you invested.
- Your starting pair of musicians PERSIST across runs (until they die)
- Members accumulate "tour experience": fights survived, damage dealt, times saved by Stonewall
- After 10 runs, a member gets a "Veteran" title and +1 permanent ATK
- After 25 runs, they get a unique nickname (player-chosen or procedural: "Ragnar the Undying")
- If a veteran member dies (Too Stoned and not revived), show a memorial screen
- "Ragnar the Undying — 47 fights, 12,000 damage dealt. Rest in power."
- This makes death HURT. Players will play more carefully to protect veterans.
- Creates stories: "My Ragnar has been with me for 30 runs, he's got +4 permanent ATK from all those tours"
This transforms disposable band members into characters you CARE about.

### 10. "THE ENCORE" — POST-LUCIFER ENDLESS MODE (Infinite Scaling)
**Hook:** Cookie Clicker / Vampire Survivors endgame. "How far can I go?"
After beating Lucifer, unlock "The Encore" — infinite circles with scaling enemies:
- Circle 10+: Enemies have randomized passives + increasing HP (×1.2 per circle)
- Every 3 circles: a "Remix Boss" with 2 combined passives (cardHeal + rageScale, etc.)
- Leaderboard: deepest circle reached + total damage dealt
- New card drops only available in Encore mode (ultra-rare, broken effects)
- The further you go, the more the screen distorts (heavier scanlines, color shift, screen shake)
- At Circle 13: "You've gone too deep. The music is playing backwards."
- At Circle 20: "The game is watching you."
This gives endgame players a reason to keep going after mastering all 6 stakes.
The escalating visual corruption is unsettling and memorable — players will screenshot and share.

---

## PLAY AGAIN BUGS — FIXED (found during edge case audit)
- [x] handleReset missing setStrikeMult reset — multiplier carried over between runs!
- [x] handleReset missing victoryFiredRef reset — bosses UNKILLABLE on second run!
- [x] handleReset missing setAllCardsFree reset — POSSESSION hellquake persisted forever
- [x] handleReset missing setNextCardFree/Ref — free card stuck on
- [x] handleReset missing setMemberBuffs — stale buff badges
- [x] handleReset missing milestonesFiredRef — boss HP milestones never re-fired
- [x] Division by alive.length without ||1 guard (stolenAtkPool crash)

## BALANCE PASS v4 (from 300K sim data) — COMPLETED
- [x] Clean Living pact: 0%→<15% threshold, +2→+3 ATK (was 3.8% WR, 26 picks)
- [x] Setlist: draw 2→3 cards, upgraded draws 4 (was 1.0 plays/game)
- [x] Herb Money: 2→1 ember cost (was 2.3 plays/game)  
- [x] Dial to Eleven: +20%→+15% corruption, added +1 ATK all (was 2.0 plays/game)
- [x] All changes synced to simulator

## COMPLETED FEATURES

### Core Game
- [x] 41 unique cards, 69-card starting deck
- [x] 18 musicians across 9 roles
- [x] 27 enemies across 9 circles of Hell
- [x] 6 difficulty stakes (Bronze through Demonic)
- [x] Lucifer 2-phase final boss
- [x] Welcome to Hell bonus boss (The Executive, 69k HP)
- [x] ScaleRoot responsive scaling at 1920x1080

### Big 5 Features
- [x] Riff Chains (16 combos, +10% ATK + multiplier spike)
- [x] Pacts (12 choices after each boss)
- [x] Descent Map (fight skip with rewards)
- [x] Genre Bonus (4 genres at 50%+ threshold)
- [x] Victory Cinematic + Welcome to Hell bonus boss

### Addiction Features (5/5)
- [x] Score Multiplier Counter (x0.03/card, x0.15/combo, wired into damage)
- [x] Near-Death Clutch System (SOLO VICTORY / BY THE SKIN OF YOUR TEETH / CLUTCH)
- [x] Boss Loot Drops (8 unique drops per circle boss)
- [x] Streak Rewards (2-win ember, 3-win Foil, 5-win Mythic)
- [x] One More Circle Hook (next circle enemy preview on boss clear)

### Doom Forge (Card Upgrades)
- [x] 41 upgrade definitions, 15 with permanent HP buffs
- [x] Gold "+" badge on upgraded cards
- [x] 9+ upgraded card effects mechanically wired
- [x] Appears after Pact, before Shop (boss -> pact -> forge -> shop)

### UI/UX Improvements
- [x] 1. Wire multiplier into damage (x0.03/card)
- [x] 2. Persistent buff badges on members (clear on strike)
- [x] 3. Shrink stage 17%, expand cards 20%
- [x] 4. Boss passive 35pt dark blood red, centered text, 180px icon
- [x] 5. Passive tooltips in combat (hover for effect)
- [x] 6. Artifact tooltips in combat (already existed)
- [x] 7. Ember cost scaling (solved by card enlargement)
- [x] 8. Deck hover distribution tooltip (RIFF/CORRUPT/UTILITY/EMBER)
- [x] 10. Shop section borders + labels ("Cards For Sale", "Booster Packs + Pawn Shop")
- [x] 13. Circle transition splash (3-second placeholder)
- [x] 15. Deck hover distribution tooltip
- [x] Card hover 50% scale (translateY -80px, scale 1.5)
- [x] Multiplier box orange (#ff8800)
- [x] Boss box redesign v4 (180px icon, centered text, 35pt passive)

### Audio
- [x] 30 SFX files (card plays, combat, UI, shop)
- [x] 11 music tracks (menu, select, battle, boss, lucifer, shop, pact, forge, descent, victory, death)
- [x] All audio normalized -6dB from SFX level
- [x] Crossfade on track switch
- [x] Smart track selection (boss/lucifer/victory overrides)

### Balance
- [x] Sim v16.0 with ALL mechanics modeled
- [x] Bronze 9.33% win rate (hpMult 1.30)
- [x] Silver 11.22% win rate (hpMult 1.30)
- [x] Gold 11.20% | Obsidian 9.12% | Blood 2.10% | Demonic 0.03%
- [x] Sabbath Sigil consumable (1 in deck, 5% shop at 42 herb)
- [x] 6 card cost reductions (Setlist 0, Burn Set 0, Feedback Loop 2, Demo Tape 1, Amp Static 2, Smoke Break +3)
- [x] Enemy rebalance (False Prophet 2600, Devourer cardHeal6, Usurer 666, Executive 69k)

### Bug Fixes
- [x] Strike damage (finalDmg scope, strikeMult ref)
- [x] Free first card (nextCardFreeRef for stable closure)
- [x] Nested setState (Soundboard setDiscardPile inside setHand)
- [x] Victory checks on ALL direct damage cards
- [x] POSSESSION Hellquake (allCardsFree state + ref)
- [x] Missing useCallback deps (applyCard, handleDropOnStage, handleStrike)
- [x] Blank screen (activeGenre temporal dead zone)
- [x] Boss not dying (stale triggerVictory closure -> triggerVictoryRef)
- [x] cardHeal resurrection (p<=0?p: guard on all 15 cardHeal lines)
- [x] Safety net self-block (removed premature victoryFiredRef flag)
- [x] Black Candle game lock (victory check + AoE path)
- [x] Play Again button crash (playSfx not in EndScreen scope)
- [x] EndScreen scroll clipping (flex-start + padding)

---

## REMAINING TODO

### High Priority
- [ ] **9. Opening Night redesign** — 4-5 candidates, synergy hints, flavor text
- [ ] **12. End screen stats bigger** — individual stat boxes, screenshot-worthy

### Card Art
- [ ] Replace all emoji placeholders with custom art
- [ ] Boss artwork for all 27 enemies
- [ ] Card frame designs per type

### Music
- [ ] Unique tracks for boss, lucifer, pact, forge, descent, victory (currently reusing select/shop)
- [ ] Circle splash audio (short 3-sec stings)

### Future Features (from Addiction Ideas)
- [ ] Run History + Ghost Data (last 20 runs timeline)
- [ ] Deck Personality System (track player card preferences)
- [ ] Seed Sharing + Challenge Mode (URL-based seed comparison)
- [ ] Addiction Loop Timer ("Average run time: 8 minutes")
- [ ] Score chain visualization
- [ ] Daily mutations
- [ ] Boss loot table expansion
- [ ] Stash gambling
- [ ] Deck tracker overlay
- [ ] Combo reveals (preview before playing)
- [ ] Skill tree (meta-progression)
- [ ] Endless mode (past Circle 9)

### Technical
- [ ] Deploy to royceprinting.com/vestibule/ (production build)
- [ ] Card animations (play, discard, draw)
- [ ] Turn flow animations (strike sequence)
- [ ] Performance optimization (component splitting if needed)
