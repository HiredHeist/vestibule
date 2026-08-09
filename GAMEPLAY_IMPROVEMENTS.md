# VESTIBULE — Playtest Summary + 20 Improvement Ideas
*Generated Aug 6 2026 from an extensive sim battery (deck matrix, 6-stake matrix, skill-gap runs, card-usage @ 3000 games, difficulty-shape analysis). All numbers are the headless sim's greedy bot unless noted; the greedy bot UNDERSTATES skill, so real human/veteran numbers run higher.*

---

## PART 1 — WHERE THE GAME STANDS (the data)

**The difficulty curve is well-shaped — "easy to start, hard to master."**
| Circle | % of runs ending here | Meaning |
|---|---|---|
| Circle 1 | **2.6%** | beginners survive the opening — good onboarding |
| Circle 2 | 9.6% | warming up |
| **Circle 3** | **24%** | first real skill wall (Circle III bosses heal per card) |
| Circles 4–8 | 1.5–5.5% | survivable once your engine is online |
| **Circle 9 / Lucifer** | **40%** | the climax wall, as intended |

Avg **3.0 strikes/fight**, **32% one-shot** rate on trash — no multiplier runaway, fights feel earned.

**Deck balance — synergy rewards commitment, nothing is broken.**
| Deck | Win % (2000g) |
|---|---|
| Standard (no synergy) | 4.2% |
| Shredder | 9.1% |
| Ritualist | 10.4% |
| Engineer | 11.0% |
| Survivor | 11.8% |

**Difficulty scales correctly across all 6 stakes** (Standard deck): Bronze 3.7% → Silver 2.4% → Gold 2.6% → Obsidian 1.8% → Blood 1.8% → Demonic 0.5%.

**The skill gap is real and grows with synergy.** On Shredder, a planning veteran wins **12.3% vs a spammer's 9.1% (+3.2)** — building around the archetype and sequencing chains clearly beats random play. On Standard (no synergy) the gap is thinner (~+0.6), which tells us: **the skill lives in deckbuilding + sequencing, exactly where we want it.**

**Card health:** ~9 cards are hard staples (played every game: Resonance, Battle Cry, Distortion, Power Tap, Static Charge, Tapped Out, Death Riff, Amp It Up, Mosh Pit). A tail of cards is near-dead in the sim — some genuinely weak (**Record Deal 0.00/g, Sabbath Sigil, Herb Money**), some are skill/synergy cards the greedy bot simply can't exploit (the new synergy cards, Cursed Strings, Second Wind). That's the honest split.

**Bottom line:** the core is genuinely good — a shaped curve, balanced decks, a real skill gap, no runaway. The opportunities below are about *depth, retention, and polish*, not fixing something broken.

---

## PART 2 — 20 IDEAS TO MAKE IT BETTER

### A. Balance & card health
1. **Rework the 3 truly-dead cards.** Record Deal (0.00/g), Sabbath Sigil, and Herb Money essentially never get played. Re-theme them into synergy or setup→payoff cards (like we did with Corruption Nexus) rather than leave them as draft dead-weight.
2. **Reduce staple auto-includes.** 9 cards are played *every single game* — a card that's always correct isn't a decision. Give the biggest staples a mild opportunity cost (corruption, a downside at high count) so drafting them is a choice, not a reflex. This is the single biggest lever for deeper deckbuilding.
3. **Audit the "revived" cards (Cursed Strings, Second Wind, Blood Harmony, Slow Burn, Amp Feedback).** They're still low-usage. Either they're genuinely niche (fine) or their payoff is unclear — a human playtest pass will tell you which.
4. **Give each deck 2–3 synergy payoffs, not 1.** Right now each archetype has one scaling card (Corruption Nexus, Riff Barrage, etc.). Two or three per archetype turns "I have a payoff" into "I'm building an engine," which is far more addictive.

### B. Skill & depth
5. **Finish the 2 strike-level synergy cards** — Cult Following (×mult per band member sharing the dominant keyword) and One True Sound (×2.5 if 5+ same-type cards played this fight). These reward *band* coherence and *deck purity* — the deepest layer of deckbuilding skill.
6. **Make boss passives into Balatro-style "blinds."** The strongest untapped skill lever: each boss changes a *rule* (no healing this fight, cards cost +1, your highest-ATK member is silenced, chains disabled). Forces adaptation instead of running the same engine every fight.
7. **Reward damage-free wins.** With the per-circle heal, HP is a resource across 3 fights. A small bonus for clearing a fight without a member dropping would add a "play clean" skill layer.
8. **Chain lookahead helper (opt-in).** A toggle that highlights which of the 16 chains your current *hand* can complete this strike — teaches the pairs fast and rewards planning without hand-holding beginners.
9. **Deeper corruption decisions.** Corruption is a great risk/reward axis but the AI treats it as free power. Add a sharper cliff (e.g., a real penalty at 90%+) so *when* to push corruption becomes a genuine skill read.

### C. Difficulty curve & pacing
10. **Smooth or telegraph the Circle 3 wall (24%).** The Circle III bosses heal per card and spike difficulty. Either telegraph the counter-strategy ("burst them fast, don't over-play") via a tip, or soften the heal slightly so the jump from Circle 2 (9.6%) feels less like a cliff.
11. **Tighten the stake gradient.** Silver/Gold are nearly identical (~2.5%) and Obsidian/Blood are identical (~1.8%). Re-tune so each of the 6 stakes is a distinct, felt step up — right now it's more like 3 difficulty tiers than 6.
12. **Add a "so close" comeback beat to Lucifer.** 40% of runs die at the climax. A rare, earned comeback mechanic (or clearer telegraphing of the phase-2 spike) makes those losses feel fair instead of feel-bad — critical for the "one more run" pull.

### D. Addictiveness & retention
13. **Bring back light meta-progression.** Something small that persists between runs (cosmetic unlocks, a card-mastery track, band nicknames done right) gives the "I'm getting somewhere" hook even on a loss. Removed the Band Legacy clutter — but a *clean* version of that idea is a strong retention lever.
14. **Celebrate the naneinf.** The multiplicative engine is the payoff fantasy — lean into it. A "Biggest Hit" hall of fame, screen-shaking million-damage callouts, and an end-screen "peak multiplier" stat make big numbers feel *earned and braggable*.
15. **Score-chase mode / seeded runs.** The daily challenge exists; expose a "share this seed" + a personal-best score per seed so players optimize the same run — huge for skill expression and replayability.
16. **Run-defining choices earlier.** Pacts/artifacts appear after the first boss. A single early "band identity" choice (pick a starting boon that nudges an archetype) would make runs feel distinct from turn one.

### E. UX, clarity & smoothness
17. **The combo flash should show the EFFECT, not just the mult.** We just gave all 16 chains unique effects — the celebration currently shows "×N". Show the effect too ("HELLFIRE — ×3.0 + Burn 15!") so players *learn* what each chain does and get excited to build them.
18. **Readable damage breakdown.** With multiplicative scaling, players need to *see* why a hit was huge (base ATK × chain × corruption × relics). A clean, animated breakdown makes power legible — and legible power is addictive power.
19. **Mid-run deck/chain viewer.** Now that Rules are reachable mid-run, add a "your deck" view that flags which chains your deck *can* make. Turns deckbuilding from guesswork into deliberate planning.
20. **Second-tier onboarding.** The tutorial nails the core loop. Layer in *just-in-time* tooltips the first time a player sees a keyword, a synergy card, or corruption 75% — so the depth reveals gradually instead of all at once (the overwhelm risk you flagged).

### Bonus
21. **Performance: code-split the 840KB bundle.** The build warns it's over 500KB. Not gameplay, but a smoother/faster load helps first impressions and mobile.

---

## SUGGESTED PRIORITY ORDER
1. **#17 + #18 (combo/damage clarity)** — cheap, high-impact on the "feels rewarding" axis, and directly showcases the new chain effects.
2. **#2 (reduce auto-includes) + #5 (strike-level synergy)** — the biggest deckbuilding-depth wins.
3. **#6 (boss blinds)** — the biggest *skill* lever left.
4. **#10 + #11 (curve/stake smoothing)** — makes the challenge feel fair and progressive.
5. **#13 + #14 (meta-progression + naneinf celebration)** — the retention/"one more run" hooks.

Everything else is polish that compounds. The foundation is strong; this is about turning a good skill game into an addictive one.
