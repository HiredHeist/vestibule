# VESTIBULE — BALANCE REPORT

*Generated Aug 4 2026 from `vestibule-sim-kwstacks.js` v19.1. Pre-playtest snapshot — the goal here is to fix the obvious balance problems BEFORE spending live-bot hours, so the bot collects signal instead of noise.*

**Method:** 5,000 games per configuration. Baseline = Bronze / Standard. Sim pace cross-validates against live (3.44 strikes/fight here vs 3.44 measured by the live bot), so the relative numbers are trustworthy; treat absolute win rates as ±0.5%.

---

## 1. HEADLINE NUMBERS

### Deck matrix (Bronze, 5,000 games each)

| Deck | Win % | Avg fight reached | Circle 1 deaths | Circle 9 deaths | Character |
|---|---|---|---|---|---|
| Survivor | **8.00%** | 24.09 / 26 | 1.5% | 73.3% | Turtle — outlasts everything, wall is Lucifer |
| Ritualist | **5.78%** | 19.17 / 26 | 7.1% | 52.2% | Tanky corruption — survives deep |
| Engineer | 4.64% | 14.06 / 26 | 21.0% | 28.6% | Balanced |
| Standard | 4.14% | 13.94 / 26 | 22.9% | 32.8% | Balanced, bimodal |
| Shredder | **3.62%** | 10.34 / 26 | **40.9%** | 23.0% | Aggro — dies in Circle 1 |

### Stake matrix (Standard deck, 5,000 games each)

| Stake | Win % | Avg fight reached | Circle 1 deaths |
|---|---|---|---|
| Bronze | 4.14% | 13.94 / 26 | 22.9% |
| Blood | 0.76% | 3.80 / 26 | 73.6% |
| Demonic | 0.42% | 2.89 / 26 | 81.8% |

Pace (Bronze/Standard): 3.44 strikes per fight · 23.2% of fights won in one strike.

---

## 2. THE TWO CORE PROBLEMS

### A. Difficulty is front-loaded, not distributed

Deaths cluster at the very start and the very end, with a hollow middle. On Standard: 22.9% die in Circle 1, ~10% across Circles 4–8 combined, then 32.8% at Lucifer. Raising the stake doesn't raise difficulty evenly — it makes the **opening** lethal (Blood 73.6%, Demonic 81.8% die in Circle 1). This is the same bimodal shape flagged in `START_HERE.md` §5, now confirmed across decks and stakes. The staged `balance/` set (no overtime + heals between fights + refit HP curve) is aimed squarely at this and the sim projects it flattens the curve.

### B. The deck identities are inverted

Win rate spans **3.62% (Shredder) to 8.00% (Survivor)** — a 2.2× spread — and it runs exactly backwards from the intended fantasy. The turtle decks win; the aggro deck loses hardest.

The cause is the `hpScale` knob, which multiplies **enemy** HP per deck: Shredder 2.00 (tankiest bosses), Standard/Engineer 1.85, Survivor 1.75, Ritualist 1.65 (weakest bosses). So the pure-aggro deck is handed the beefiest bosses *and* the thinnest survivability, and it dies in Circle 1 40.9% of the time. Meanwhile Ritualist and Survivor fight weaker bosses and outlast them. A doom-metal aggro deck that is strictly the worst option is the opposite of the intended feel, and it's a single-number fix.

---

## 3. CARD BALANCE

### Over-relied staples (Bronze/Standard)

Battle Cry alone is **12.0 plays/game (6.8% of all card plays)**. The top seven — Battle Cry, Distortion, Encore, Static Charge, Power Tap, Tapped Out, Infernal Encore — carry most games. Not necessarily overpowered, but the deck-building space is narrow: a handful of cards are auto-includes. Worth watching once the dead cards are revived and can compete.

### Universally dead cards (flagged DEAD/LOW in every or nearly every deck)

These are the real card problems — they show up dead regardless of deck:

- **Blood Harmony** — dead in all 5 decks.
- **Sabbath Sigil** — dead in all 5. (This is why **Hellquakes fired: 0** — the only card that fires them is never played.)
- **Record Deal** — dead in all 5.
- **Slow Burn** — dead in all 5.
- **Second Wind** — dead in 4/5.
- **Cursed Strings** — dead in 4/5. *Code-confirmed broken*: its "cannot be healed this fight" drawback is never wired up.
- **Gear Check** — dead in 3/5. *Code-confirmed broken*: "draw 2, discard 1" — the discard half was never implemented.
- **Setlist Rewrite** — dead where it appears. *Code-confirmed broken*: the live handler is a no-op; the card does nothing.
- **Amp Feedback, Tremolo Pick, Corruption Siphon, Drain the Crowd** — dead/low in most decks.

Split them into two piles: **broken** (Setlist Rewrite, Gear Check, Cursed Strings — fix the code) and **weak** (the rest — buff or rework).

---

## 4. DEAD FEATURES (0 activations in 5,000 games)

- **Hellquakes fired: 0** — downstream of Sabbath Sigil being dead.
- **Genre activations: 0** — the genre mechanic never triggers in the sim.
- **Contracts signed: 0** — despite WTH entered/won 203. The contract-signing branch never fires.

Each of these is either a game mechanic that is genuinely dead, or one the sim doesn't model. They can't be told apart from sim data alone — this is a **live-bot / code-review** question, and a good use of the eventual bot pass.

---

## 5. RELIC OUTLIERS

Picks are mostly healthy and spread. The floor: **Drummer's Stick (3 picks in 5,000 games)** is effectively dead; Solo Sermon (43), Triple Sixes (138), Black Goat (110), Ashtray (113) are low. Worth a look, lower priority than the cards.

---

## 6. RECOMMENDED REBALANCE ORDER

1. **Fix the three broken cards** (Setlist Rewrite, Gear Check, Cursed Strings). They're dead because they don't work — fixing them is pure upside and validates the card-parity path. *Why first: lowest risk, guaranteed win, and it shrinks the dead-card list before we judge the rest.*
2. **Re-tune deck `hpScale` so aggro isn't strictly punished.** At minimum bring Shredder's enemy-HP scale down toward the pack, or pay the fragility back in damage. *Why: the 2.2× win spread and the inverted identity are a single-number lever and the clearest "unfun" in the data.*
3. **Apply the staged `balance/` difficulty set** (design decision). The data supports it — it targets the front-loaded curve directly. *Why: needs your call, but every deck and stake shows the same bimodal shape it fixes.*
4. **Revive the weak-but-not-broken dead cards** (Blood Harmony, Sabbath Sigil, Record Deal, Slow Burn, Second Wind, Amp Feedback, Tremolo Pick, Corruption Siphon, Drain the Crowd). *Why: reviving Sabbath Sigil also un-zeroes the Hellquake system for free.*
5. **Investigate the 0-count features** (hellquakes, genre, contracts) via code review / live bot. *Why: needs a different tool than the sim; park until the bot runs.*
6. **Buff/rework Drummer's Stick and the low relics.** *Why: lowest impact, do it opportunistically.*

---

## 7. WHAT THE SIM CAN'T TELL US (needs the live bot later)

Crashes, softlocks, phantom victories, unreachable UI, and whether the 0-count features are dead-in-game or just unmodeled. Run the bot **after** items 1–3 land, so it measures the rebalanced game rather than the current one.
