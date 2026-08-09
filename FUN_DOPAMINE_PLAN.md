# FUN / DOPAMINE PLAN — Vestibule
*Aug 6 2026 · a mechanic-by-mechanic pass over the whole game, then the edits I'd actually make, ranked by (impact ÷ effort). Grounded in the veteran data: fast runs (3.2 strikes/fight, 32–35% one-shots), huge numbers (strike mult to 10,000×), ~9–12% win rate, deaths now spread across all 9 circles.*

## The core finding
Vestibule's **in-fight** loop is already dopamine-rich: you build an engine, chains fire, numbers explode, one-shots feel great. The weak links are the **seams between the fun** — the moment a run ends, the moment before a boss, the moment you'd brag to a friend. Roguelites live or die on those seams (it's why Balatro's one-key restart and run-summary screenshot are its real retention engine, not the blinds). Almost every edit below sharpens a seam or amplifies a payoff you already generate but don't *celebrate*.

---

## THE 10 EDITS (ranked)

### 1. Make the big-strike payoff CINEMATIC *(highest impact, low effort)*
**Mechanic:** strike multiplier (to 10,000×), chains, one-shots — you produce a monster hit every ~3rd fight and the game barely reacts.
**Edit:** when a strike crosses a threshold (e.g. >2× the boss's remaining HP, or a chain ≥×3 fires), escalate the feedback — screen shake scaling with the number, the mult digits punching up huge in BogartsMetalFont, the chain name slamming in, a low sub-drop SFX, brief slow-mo before the HP bar detonates. **Why:** the payoff moment is the single most clippable, most re-triggerable dopamine event in the genre, and right now it's underplayed. This is the one I'd do first — it makes both playing *and* watching feel incredible.

### 2. Post-run "Set Report" card *(high impact, low-med effort)*
**Mechanic:** you already track highestStrike, chains, mastery, boss kills.
**Edit:** on every end screen (win OR loss), auto-generate one clean, branded card: deck, circle reached, **peak strike**, biggest chain, MVP band member, run score. Make it screenshot-shaped. **Why:** turns loss aversion into forward motion (even a death produced a trophy stat), and every shared card is free marketing. This *is* your streamability artifact.

### 3. Near-miss framing on death *(high impact, tiny effort)*
**Mechanic:** the survival curve shows most deaths are *close* — Lucifer kills ~half of skilled runs, usually with the boss on low HP.
**Edit:** on death, surface the twist of the knife — "Lucifer had 4% HP left" / "one more strike." **Why:** near-miss is the most potent "one more run" trigger in games. Right now a loss just… stops. Make it ache with *almost*.

### 4. One-key "Descend Again" *(med impact, tiny effort)*
**Mechanic:** runs are short; the drop-off point is the gap between them.
**Edit:** on the end screen, pre-focus a big **⛧ DESCEND AGAIN ⛧** on the same deck+stake so Enter restarts instantly (you already have the single `handleReset` run-init path — wire it to the default button + Enter). **Why:** removing one click/one decision between runs is Balatro's whole retention trick.

### 5. Boss-blind PREVIEW + shop counterplay *(med-high impact, low effort)*
**Mechanic:** blinds already roll per circle boss (you built the tiered system) — but they surprise the player.
**Edit:** show the incoming blind one fight early ("⛓ Next boss: Chains Muted") so the player can *build against it* in the shop. **Why:** converts a rule-change from a gotcha into a **decision** ("do I buy the anti-armor card or gamble my engine survives?"). Decisions are replayable; surprises aren't. Highest-leverage way to make the blinds *fun* rather than just hard.

### 6. Member-synergy "band chemistry" surfacing *(med impact, low effort — leans on the roster work)*
**Mechanic:** we just made every member distinct and evenly valuable (auras, DISSONANCE wants variety, DIRGE wants a long fight, BLASTBEAT wants attackers, ANCHOR protects). Players won't *feel* that depth unless the UI shows it.
**Edit:** on the stage, show live aura links between adjacent members (glowing threads in the keyword color) and a one-line "chemistry" readout ("DISSONANCE +3 — varied band"). **Why:** the band is now a real puzzle; make the puzzle visible so players engage with *positioning and drafting* instead of ignoring it. This directly cashes in the roster rebalance.

### 7. Deck-mastery ladder with a visible destination *(med impact, med effort)*
**Mechanic:** you track wins per stake, `vst_mastery` (Novice→Legendary), trophies.
**Edit:** per deck, a visible badge/alt-art/card-back at 1/5/10/25 wins. **Why:** a 9–12% win rate needs a *destination* — a completionist chases "10-Win Ritualist" for months. Gives the grind a shape.

### 8. Daily Descent front-and-center *(med impact, med effort)*
**Mechanic:** you already have seeds + `vst_daily_best` + streak tracking.
**Edit:** a "Today's Descent" tile on the menu — fixed seed, your best, a shareable score string, and the streak flame you *lose* on a miss. **Why:** a shared daily puzzle is a login reason and a natural "beat my score" loop; the streak weaponizes loss-aversion.

### 9. Corruption gamble — louder risk/reward theater *(med impact, low effort)*
**Mechanic:** Ritualist's corruption is now a real gamble (dmg ×1.10→1.60, but +60% incoming at 100%).
**Edit:** make pushing corruption *feel* like a bet — the screen tint/heartbeat/audio ramps as you climb, a clear "PUSH / PURGE?" beat before a boss, and a payoff flourish when a high-corruption burst lands. **Why:** the math is good but silent. Gambling is dopamine when you can *feel* the stakes rising. (Bonus: this is the most fun thing to watch on stream.)

### 10. Dealer should actually gamble *(low-med impact, tiny effort — also a balance fix)*
**Mechanic:** the data shows drugs are ~90% good outcomes (Good 6,857 vs Bad 385 / Bunk 341) — it's free value, not a gamble.
**Edit:** widen the outcome spread (better highs, real lows) and give trips louder visual/audio payoffs. **Why:** a risk with no downside isn't exciting and is a strictly-correct "always buy." Real variance makes the dealer a *decision* and a hype moment.

---

## Two mechanic bugs the study surfaced (worth a look)
- **`Genre activations: 0`** across thousands of games — a feature that never fires. Either it's unreachable/broken or it's dead content. Cheap to check, and if it's a real mechanic it's a whole missing source of variety.
- **Inert corruption hooks** (post-roster-work): the "100% corruption buffs CORRUPT members" possession payoff and HEXED pump no longer fire (no members carry those keywords). Harmless, but it's a dangling reward you could repurpose (e.g. idea #9's high-corruption payoff).

## What I'd ship first
**#1 (cinematic strike) + #3 (near-miss) + #4 (one-key restart)** are near-free and hit the three highest-frequency dopamine moments (the payoff, the loss, the restart). Then **#5 (blind preview)** and **#2 (set report)**. That five-item batch would move the "can't-stop-playing" needle more than anything else, and none of it touches the balance we just locked in.
