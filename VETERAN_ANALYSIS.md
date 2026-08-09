# VETERAN (PLANNER) ANALYSIS — the skilled-player data
*Aug 6 2026. Numbers from the combo-lookahead planner bot (the closest proxy we have to a skilled human), 2000 games/deck (Survivor 1200). Win-rate estimates are ±~0.7%; the death-distribution SHAPE is unambiguous and consistent across all five decks.*

---

## THE DATA

| Deck | Veteran win % | Deaths in Circles 1–8 (each) | Deaths at Lucifer (C9) |
|---|---|---|---|
| Standard | 6.3% | low | high |
| Shredder | 11.1% | all <5% | **59.6%** |
| Ritualist | 11.8% | all <5% | **63.3%** |
| Engineer | **16.1%** | all <8% | 57.3% |
| Survivor | 12.7% | all **<2.3%** | **79.5%** |

(Greedy bot for reference wins ~4–12%; the planner beats it everywhere, as a skilled player should.)

## THE ONE FINDING THAT MATTERS: "cruise, then cliff"

**A skilled player's run has almost no tension until the very end.** Once the engine comes online (~Circle 3), Circles 4–8 are a formality — deaths under 3% per circle, often under 1%. Then **57–80% of all runs die at Lucifer**, a sudden wall with no ramp leading to it.

This is the single most important thing the veteran data tells us, and it's the enemy of an addictive loop:
- **The mid-game is boring for good players.** Circles 4–8 don't test anything — you're executing an engine on autopilot. No decisions matter, no risk, no dopamine.
- **Lucifer is a cliff, not a climax.** Deaths jump from ~2% (Circle 8) to 60–80% (Circle 9) with nothing in between. A cliff feels *unfair* (sudden); a climax feels *earned* (you watched it coming).
- **The challenge doesn't scale with the player.** Balatro stays addictive because the blind requirement grows exponentially — you're always one bad hand from death. Here, your power outgrows the fights by Circle 3 and nothing catches up until Lucifer.

**Fixing this shape is the highest-leverage change for the addictive loop.** Everything below serves it.

## VALIDATION: the mid-game dead zone is STRUCTURAL (not a stake/HP problem)

I tested whether a harder stake adds the missing mid-game tension. It does **not**. Veteran on **Blood** stake (Standard, 1500g):

| Circle | Deaths |
|---|---|
| 1 | **31.7%** |
| 2 | 16.7% |
| 3 | 20.5% |
| **4–8** | **1.3–4.3% each — still a cruise** |
| 9 (Lucifer) | 15.8% |

The hard stake just moved the wall to the **front** (Circles 1–3 = ~69% of deaths). **Circles 4–8 stayed trivial.** The difficulty is *bimodal* — front (hard stake) OR Lucifer (easy stake), **never the middle**.

**This is the key engineering takeaway:** you cannot fix the mid-game with HP/stat numbers. A skilled multiplicative engine either **out-scales** static HP (cruise) or, if you crank HP high enough to matter, it **front-loads** the difficulty onto weaker openings (early death). The only thing that creates tension for a strong engine in the mid-game is a mechanic it **can't out-damage** — a rule it must *play around*, not power through. That makes **boss "blinds" (rule-changers) the #1 fix, above HP scaling.**

---

## IDEAS (built on the veteran data)

### Tier 1 — fix the curve (the addictive-loop core)
1. **Scale boss difficulty per circle so it keeps pace with the player (Balatro blinds).** The data shows Circles 4–8 are trivial because boss HP doesn't grow with your engine. Ramp boss HP/damage circle-over-circle so the mid-game stays tense. This alone converts "cruise" into "rising challenge." *Highest impact.*
2. **Redistribute Lucifer's difficulty into Circles 6–9 (smooth the cliff into a ramp).** Take some of the 60–80% Lucifer lethality and spread it backward so Circles 6, 7, 8 each get meaningfully harder. Lucifer becomes the peak of a visible climb — losses feel earned, and the back third stays gripping.
3. **Boss "blinds" — each boss changes a rule** (no healing, cards cost +1, silence your top member, chains disabled this fight). Even without HP scaling, this forces the skilled player to *adapt* every fight instead of autopiloting. Kills the mid-game autopilot directly. Circles 4–8 are exactly where these belong.
4. **A slow-building in-run pressure that ramps with depth** — a rising corruption floor, per-circle enemy buffs, or a "the deeper you go, the angrier Hell gets" escalator — so tension climbs continuously rather than spiking only at the end.

### Tier 2 — reward the skilled cruise (turn autopilot into a game)
5. **Score/style incentives so winning isn't the only goal.** If a skilled player will clear Circles 4–8 regardless, give them a reason to *optimize*: score multipliers for speed, overkill, biggest chain, fewest cards. This is Balatro's secret — even a won hand is a scoring puzzle. Turns the trivial mid-game into a score-chase.
6. **Celebrate + bank the naneinf.** Reward gigantic hits (a "Biggest Hit" record, meta-currency for overkill, screen-shaking million-damage callouts) so the payoff fantasy pays off even when survival isn't in doubt. Big numbers you can brag about = retention.

### Tier 3 — deck balance for skilled play
7. **Engineer (16.1%) is a skilled-play outlier** — 2.6× Standard's 6.3%. Its Copier signature snowballs hardest for a planner. Either trim Copier slightly, or (better) lift the other decks toward it so every archetype rewards mastery similarly.
8. **Give Standard an identity.** At 6.3% it's just "the weaker deck." A light signature (or a guaranteed early payoff) makes the starter deck a real choice, not a handicap you graduate from.
9. **The overall skilled win rates (11–16% on synergy decks) are slightly generous for a "beat Hell" fantasy** — but don't nerf globally. Fixing the curve (ideas 1–2) redistributes difficulty into the mid-game and naturally tightens the win rate where it belongs, instead of piling it all on Lucifer.

### Tier 4 — the Lucifer near-miss engine (retention)
10. **Lean into the near-miss.** 60–80% of runs die *at the final boss* — that's an enormous well of "SO close" moments, the most addictive feeling in roguelikes. Make it land: a dramatic multi-phase Lucifer, a "you got him to 12% HP" end-screen, and a one-click fast retry so the near-miss immediately fuels the next run.
11. **Meta-progression pointed at Lucifer.** Since he's the wall everyone grinds, make every run (even a loss) feel like progress toward him — persistent unlocks/mastery that compound. A clean version of the retention hook.
12. **Mid-game decisions carry the stakes the fights don't.** If Circles 4–8 fights are easy, make the *choices* in them matter — high-variance pacts, artifact gambles, risky events, deck-thinning calls that determine whether you survive Lucifer. Move "where the run is decided" into the choices, so the mid-game is tense even when the combat is safe.

---

## SUGGESTED ORDER (revised after the Blood-stake validation)
The Blood test proved HP scaling alone can't fix the mid-game, so the order changes:

1. **#3 — boss "blinds" in Circles 4–8 FIRST.** This is the only lever that creates tension a strong engine can't out-damage. Give mid/late bosses rule-changers (no healing, cards cost +1, silence your top member, chains disabled, boss gains armor per card you play). Prototype in the sim and confirm the veteran's Circle 4–8 deaths rise from ~2% into a real 5–10% band **without** front-loading Circle 1–3.
2. **#2 — smooth the Lucifer cliff** so the endgame is a ramp (Circles 6–9 progressively harder), not a 60–80% wall.
3. **#5 + #6 — score-chase + naneinf celebration**, so the now-tense run is also a joy to optimize even when you're ahead.
4. **#10–12 — the Lucifer near-miss + meta-progression retention layer.**

The foundation is strong. The difficulty is just **mislocated and un-scaling** — it's bimodal (front or Lucifer) with a hollow middle, because static numbers can't challenge a multiplicative engine. Rule-changing blinds fix that; spread them across the descent and Vestibule goes from "solved by Circle 3" to "tense, adaptive, and different every fight." That's the addictive loop.
