# What the player sees — recommended set (V1 + V5 + V6 + V20C)

*Companion to `balance/DIFFICULTY_CURVE.md`. Nothing here is applied.*

Three of these four changes are visible on screen, and two of them change what the game **is**. Short version for the UI/UX pass.

---

## 1. The boss HP bar becomes a damage target

**Now:** an HP bar that drains, and if you run out of strikes the bar keeps draining anyway — the fight just gets more dangerous. The number is information, not a deadline.

**After:** the same bar, but it is a **deadline**. Four strikes, that number, or the run ends.

The most important UI consequence: **the player must be able to see whether they are on pace.** Balatro shows "score at least X" against a running total, permanently. Vestibule shows an HP bar — the same information inverted — but is missing the *pace* half. Minimum viable addition:

- boss HP remaining and **strikes remaining**, together, in one glance;
- ideally a "damage needed per remaining strike" figure, since that is what the player is actually planning against;
- the existing damage preview (`DamageBreakdown`) becomes far more important — it is now the difference between a considered play and a lost run.

The numbers are **published and fixed**. A player who has seen The Wanderer once knows it is 32 forever. Worth putting the whole 27-fight curve somewhere in the UI (the descent map is the natural home) so a deck can be built against Circle VII's number from Circle II.

## 2. "OVERTIME" disappears, and running out can kill you

**Now:** the counter reads `3/4`, `2/4`, `1/4`, then `☠ OVERTIME ×2`, `☠ OVERTIME ×4` — you keep playing, the boss hits harder each strike, and the fight ends when somebody dies. Nearly half of all boss fights currently go past the allowance; 7% run to **thirteen** strikes.

**After:** the counter reads `3/4`, `2/4`, `1/4`, then the run is over. The patch changes the label to `☠ NO STRIKES LEFT`, but that is a placeholder — this is the moment the run ends and it deserves real treatment.

- **The last strike needs to feel like the last strike.** The existing `strikesLeft<=1` styling (22px, red, shake, glow) already does the right thing; it now means something final.
- **Telegraph the failure one strike early.** If the player enters their final strike needing more damage than they can possibly produce, they should know. A dimmed "you cannot reach it" state is more honest than playing out a dead hand.
- The death screen gets a new dominant cause. `deathCause` distinguishes `stoned` / `beaten` / `victory`; `beaten` has been unreachable since Jul 31 and becomes **the** cause. Its copy should read "you missed the number", with the number and what you actually dealt.

## 3. The band stops being a resource you can lose

**Now:** members go Too Stoned, stay Too Stoned across fights, and when the last one drops the run ends. Nearly half of all deaths are this. It is slow, it is not really a decision, and you cannot deck-build against it.

**After:**
- A Too Stoned member still **greys out and stops contributing ATK for the rest of that fight** — the cost is real and immediate, and it is exactly the cost that makes you miss the number.
- **A wipe no longer ends the run.** The log line changes from a defeat to `💀 TOTAL WIPEOUT — the band is out. No damage for the rest of this fight.` You will probably miss the number and lose anyway — but you lose *to the number*.
- **Everyone is back at full HP for the next fight**, on every stake.

Removed from the screen: the slow attrition read where the player watches HP bars grind down over three fights knowing the run is already over. Added: every fight starts from a known, identical, plannable state. The band you plan with is the band you get.

⚠️ **Stake identity casualty.** "No free heal between fights" is currently the main mechanical difference between Bronze and Obsidian / Blood / Demonic, and their stake descriptions say so. V6 deletes it on every stake. Those descriptions must change in the same commit, and the harder stakes need a replacement pillar (they still have `dmgAdd`, price multipliers, drug costs, starting corruption and Demonic's 3 strikes). The patch comment documents the softer option: keep the +2-HP heal on those stakes and make only the *un-stoning* universal, so they keep attrition without keeping it as a loss condition.

## 4. The shape of a run changes: the circle boss becomes the event

This is the biggest felt change and it is deliberate. The two ordinary fights of each circle become a **formality** (98% of players clear them); the **circle boss is the check** (92%); and **Circle IX is the wall** — Lucifer ends about 14% of all runs by himself.

| | now | after |
|---|---|---|
| typical ordinary fight | 3 strikes, sometimes 9, sometimes 13 | 1–2 strikes, never more than 4 |
| circle boss | 4.75 strikes — i.e. usually already in overtime | 2.4 strikes, 1 in 5 goes to the final strike |
| how runs end | 48% "the band ran out of herb" | **100% "you didn't hit the number"** |
| where runs end | 14% Circle 1, 43% the middle, **38% on Lucifer** | 11% / 50% / **16%** |
| Lucifer's HP | 666,666 (333,333 × 2 phases) | **72,000** (36,000 × 2 phases) |

Two things follow for presentation:

- **The circle boss should be announced.** Right now every third fight is mechanically the peak of its circle but is presented like any other. It now carries ~5× the death rate of its neighbours and deserves the framing — a distinct pre-fight screen, distinct music, the published number front and centre.
- **Lucifer's number changes by 9×** and appears on screen in three places (the phase-1 and phase-2 log lines and the phase-2 cinematic). That is not a nerf so much as a correction: at 666,666 with no overtime he is arithmetically unbeatable. He remains, by a wide margin, the deadliest single fight in the game.

## 5. The honest downside

Ordinary fights get **shorter and less dangerous** — median 1–2 strikes, and 40% of all fights are one-shot. The tension is concentrated rather than increased: only the boss fights are close. If the goal is that *every* fight feels like a nail-biter, that is a structural change (fewer lethal checks, or non-lethal misses, or more than four strikes) rather than a curve change — see `DIFFICULTY_CURVE.md §6`.

And one number to treat as provisional: the curve was fitted against the simulator, whose card play is materially weaker than a real player's, especially deep in a run. **Expect the late-circle numbers and Lucifer in particular to need raising once the bot re-measures them.**
