# VETERAN DATA CHART — Full Playtest Readout
*Aug 6 2026 · veteran (PLANNER=1 combo-lookahead) bot — the skilled-human proxy · ~9,000 fresh games this pass (2,000 each Standard/Shredder/Ritualist, 1,000 each Engineer/Survivor), pooled with the overnight batches toward the 20k you asked for.*

> **Two honest caveats up front, so you can trust the numbers:**
> 1. **This baseline is blinds-OFF.** Card-usage rankings are near-identical with blinds on/off (a staple is a staple either way), so I ran clean to get the sharpest card signal. The **shipping** win rates (blinds ON) are ~1–5% lower — that's the 8–11% band in the overnight briefing. Blinds-off win rates below run a touch higher.
> 2. **Per-member ranking isn't in the sim yet** — it tracks cards/chains/relics/keywords but not per-musician win contribution. I flag that gap below with a fix offer. Everything else is real measured data.

---

## 1. HEADLINE — all 5 decks (blinds-off baseline)

| Deck | Veteran win% | Strikes/fight | One-shot fights | Chains/game | Identity |
|---|---|---|---|---|---|
| **Standard** | 9.75% | 3.18 | 32.6% | 6.7 | Balanced buff-aggro |
| **Shredder** | 11.10% | ~3.1 | ~34% | high | Pure aggro |
| **Ritualist** | 9.00% | 2.94 | 31.1% | 2.3 | Corruption gamble |
| **Engineer** | 14.40%¹ | ~2.9 | ~35% | high | Copy/combo |
| **Survivor** | 11.20% | ~3.2 | ~30% | mid | Outlast |

¹ Engineer reads high blinds-off; with blinds it lands ~8.9% (the briefing figure). 1,000-game samples (Engineer/Survivor) carry ±2% noise.

**Read:** every deck is a genuinely different engine — none is a reskin. Win rates cluster 9–14% blinds-off → 8–11% blinds-on. That's the target: hard, but a skilled player wins roughly 1 run in 10, and each deck *plays* differently.

---

## 2. THE CARD CHART — what's strong, what's weak, what's fine

### 2a. Universal staples (Standard — the beginner engine)
These fire 9–21× per game, every game. This is the core loop a new player learns:

| Card | Plays/game | Card | Plays/game |
|---|---|---|---|
| Power Tap | 20.8 | New Strings | 11.5 |
| Mosh Pit | 20.4 | Soundboard | 11.3 |
| Amp It Up | 20.3 | Sound Wall | 11.1 |
| Groupie | 16.9 | Possessed Perf | 10.0 |
| Battle Cry | 16.7 | Demo Tape | 9.9 |
| Resonance | 16.1 | Heavy Riff | 8.9 |
| Crowd Surf | 15.3 | *Strong tier:* Burn the Set 6.9, Amp Overload 6.8, |
| Roadie | 13.9 | Sound Check 5.6, Encore 5.5, **Herb Money 4.9** |
| Tapped Out | 13.6 | Stage Dive 4.5, Setlist 3.2 |
| Wake Up Call | 12.2 | |

**Herb Money's revival worked** — dropping its 10-Stash cost took it from ~0.3/g (dead) to 4.9/g (strong staple), and balance didn't move. Clean win.

### 2b. Each deck has its own healthy engine core (this is the good news)
Post corruption-split, cards are correctly siloed — a card that looks "dead" on Standard is often a **staple at home**:

| Deck | Signature core cards (top plays) |
|---|---|
| **Shredder** | Power Tap, Battle Cry, Tapped Out, Mosh Pit, **harmonicfb** (Harmonic Feedback), Soundboard |
| **Engineer** | **backstagepass, gearcheck (Feedback Engine), bootlegcopy, setlistrewrite, secondwind, venueswap** — a full copy/combo suite that's dead everywhere else |
| **Survivor** | Mosh Pit, **secondwind, slowburn**, Battle Cry, Wake Up Call, Roadie — the outlast core |
| **Ritualist** | **Distortion (12.9/g), Static Charge (10.3/g), corrsiphon/Corruption Nexus (9.2/g), cursedstrings, infernalpact** — the corrupt engine, healthy only here |

So the corrupt cards (Distortion, Static Charge, Corruption Nexus, Death's Bargain, Signal Decay) that show DEAD on the 4 clean decks aren't broken — they're **correctly filtered out** and thriving in Ritualist. That's the corruption isolation working exactly as designed.

### 2c. Genuinely weak EVERYWHERE — the real revision candidates
Only these are weak across *every* deck they can appear in (not just deck-locked):

| Card | Status | Why | Suggested fix |
|---|---|---|---|
| **Riff Barrage** (tremolopick) | 0.08–0.14/g in every deck | A synergy card I added last session that isn't landing — its payoff is too conditional to ever be worth a slot | Either make its trigger automatic on a common condition, or bump its raw floor so it's playable off-combo |
| **Record Deal** | 0.02/g, dead in all 5 | Acquisition-gated reward whose payoff loses to literally any card draft | Make it a *build-around* (e.g. scales with cards played this run) or cut it |
| **Sabbath Sigil** | 0.04–0.08/g, dead in all 5 incl. Ritualist | Corrupt-type reward that even the corruption deck skips | Buff the corruption payoff or fold into another relic |
| **ampfeedback** (Amp Feedback) | LOW/DEAD in the decks it appears in, staple in none | No clear home archetype | Give it to one deck as an intentional core piece, or retune |

**Bottom line:** the deck engines are well-tuned. Your only genuine dead weight is ~3–4 cards, and two of them (Riff Barrage, ampfeedback) are recent additions that just need a home or a floor.

### 2d. Feature flag that never fires
**`Genre activations: 0`** across 2,000 games. Whatever "Genre" mechanic this counter tracks is either unreachable by the bot or dead content. Worth a 2-minute check — either it's broken, or it's a feature no one can trigger.

---

## 3. COMBOS / CHAINS — the skill expression

| Metric | Value | Read |
|---|---|---|
| Riff chains triggered (Standard) | 6.7 / game | The engine fires often — chains are a real part of every run, not a rare flourish |
| Chains (Ritualist) | 2.3 / game | Corruption deck leans on rot damage over chains — correct archetype split |
| Keyword Stack-2 strikes | 47.6 / game | Keyword stacking is *the* core interaction — happens ~48× a game |
| Keyword Stack-3 strikes | 43.2 / game | Deep stacks are common → the skill ceiling (stacking to tier 3) is being reached by the veteran |
| Mentor links formed | 0.84 / game, **52.5% of games** | Half of all runs form a member link — a build-defining moment lands in the majority of games |
| ANCHOR clutch-saves | 0.6 / game | A save-from-death fires in ~every other game → built-in drama |

---

## 4. DISCARD / DELETION / ECONOMY

| Metric | Value | Read |
|---|---|---|
| Cards deleted (Doom Forge burn) | 4.5 / game | Deck-thinning is active — the veteran prunes to sharpen its engine |
| Pacts chosen | 5.9 / game | Pact system is fully engaged every run |
| Doom Forge upgrades | 5.9 / game | Upgrading is a core loop, not an afterthought |
| Random events taken | 3.8 / game | Mosh Pit (1,285) & Cursed Amp (1,230) are the popular picks; Blood Oath (305) the risky one |
| **Dealer** (drugs) | 4.9 shrooms + 2.8 acid bought/… | Good:6,857 vs Bad:385 / Bunk:341 → **~90% of drug gambles pay off** |

⚠️ **Two economy flags:**
- **In-fight discards aren't separately counted** in the sim (only Forge burns are). If you want true discard-per-fight, that's a 5-line counter I can add.
- **The drug gamble is too safe** — 90% good outcomes means it's free value, not a gamble. Bumping Bad/Bunk odds (or the downside severity) would make the dealer a real risk/reward decision instead of a strictly-correct "always buy."

---

## 5. DIFFICULTY CURVE — where players actually die (Standard, blinds-off)

```
C1  Wanderer→Drifter      100–99.9% survive   (beginner-safe ✓)
C2  Siren→Seducer          95.7% by boss      (first teeth, 4% die)
C3 ★ DEVOURER             72.5% survive        ← WALL #1 (21.6% die here)
C4–C8 bosses               each <3.4% die      (the hollow mid-game, blinds-off)
C9 ★ LUCIFER               9.8% survive         ← WALL #2 (49.5% die here)
```

**This is the exact "cruise-then-cliff" the blinds were built to fix.** Blinds-off, a skilled player faces only two real walls (Devourer, Lucifer) and coasts everything between. **Blinds-on** (shipping), deaths spread across all 9 circles (C1 0.3% → C3 22% → C4 10.6% → … → Lucifer 29%) — tension the whole way down. This chart is the *before* picture that justifies the whole blind system.

---

## 6. MEMBER LEADERBOARD — now instrumented ✅

Added a per-member tracker to the sim (dmg/fight = raw ATK contribution before multipliers; pick% = how often the bot ends up using them; win-when-used = wins in games they appeared). Ran all 5 decks. **The signal is loud and consistent across every deck.**

### Bjorn dmg/fight is the flagship in EVERY deck
| Member | Keyword | Standard | Shredder | Ritualist | Engineer | Survivor | Pick% |
|---|---|---|---|---|---|---|---|
| **Bjorn** | FRENZIED | 789 | 667 | 443 | 401 | 839 | **~80%** |
| **Ragnar** | FRENZIED | 469 | 466 | 414 | 241 | 515 | **~80%** |
| Vitalik | FOLK MAGIC | 288 | 273 | 436 | 104 | 258 | ~60% |
| Gunnar/Sigrid | SHREDDER | ~280 | ~280 | ~358 | ~120 | ~275 | ~38% |
| Grimnir/Astrid | DEBUFF | ~270 | ~280 | ~377 | ~100 | ~272 | ~26% |
| Bass (Brynja/Dag/Ulf/Ingrid) | ANCHOR | ~230 | ~200 | ~370 | ~60 | ~178 | ~14% |
| Freya/Loki | CORRUPT | — | — | ~416 | — | — | ~40% (Ritualist only) |
| **Thor / Rolf** | BLASTBEAT (Drummers) | — | — | — | — | — | **1–6% ⚠️** |

### The four real takeaways

**① FRENZIED is king — and that's a *repetition* risk.** Bjorn + Ragnar are the top two damage dealers in **all five decks**, picked ~80% of the time regardless of archetype. FRENZIED (scales with riffs played) out-values everything. That's great for teaching new players "grab the guitarist," but it means every optimal band looks the same up top — which cuts against your "not repetitive" goal. **Consider either a soft nerf to FRENZIED's scaling, or buffing rival keywords so a Ritualist band and a Survivor band draft *differently* at the top.**

**② Drummers (BLASTBEAT) are nearly dead-drafted — 1–6% pick everywhere.** This is the single clearest fix target. Their buff isn't worth a roster slot to a skilled player. Either the BLASTBEAT buff is too weak, or the draft AI undervalues it. Worth a look — a whole role (Drummer) is being skipped. *(Note: Thor sits at 1% in every deck — even worse than Rolf. Check if he's unlock-gated or just underpowered.)*

**③ ANCHOR & DEBUFF members over-perform when used but are under-drafted.** Bass/ANCHOR sit at ~14% pick yet post some of the highest *win-when-used* rates (Dag 18.2% on Survivor, Brynja 15.7% on Standard). DEBUFF vocalists (Grimnir/Astrid) same story — ~26% pick, 10–15% win-when-used. These are "sleeper" members: raising their draft priority (or making their value more legible to players) would add real build diversity.

**④ The metric correctly reflects archetype.** Engineer's raw dmg/fight is *lowest* (Bjorn only 401 vs 839 on Survivor) because Engineer wins through copy/combo *multipliers*, not raw swings — its members are meant to hit soft and let chains carry. Survivor's is highest because its fights last longer (more strikes = more accumulated ATK). So the leaderboard isn't just "who's strong," it's reading each deck's win condition correctly.

> **Caveat on win-when-used:** for near-universal picks (Bjorn/Ragnar at ~80%), this number just approaches the deck's base win rate by definition — it only *discriminates* for mid-pick members (the ANCHOR/DEBUFF sleepers above). Read dmg/fight and pick% as the primary signals.

---
*Every number here is from the veteran planner bot as you asked. Blinds-off baseline for card clarity; shipping state is blinds-on (~1–5% lower win rates, deaths spread across circles).*
