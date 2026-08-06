# SKILL FINDINGS — pro bot + "make skill beat spam" (autonomous session, Aug 6 2026)

*JV stepped away and authorized autonomous run/test/flag work. This is what I found. All sim changes are env-gated and default-OFF — the default sim + the live game are unchanged (verified: default sim still ~4.5–6%).*

---

## 🏆 THE BIG WIN — the pro bot is now genuinely good

Built a **combo-lookahead planner brain** (the "veteran") into the headless sim, gated by `PLANNER=1`. It searches short sequences of plays through the REAL card engine (+ the real chain-fire) and plays the move that leads to the best *loaded strike* — so it sets up combos instead of scoring one card at a time.

**Then I found and fixed a critical bug in it:** the planner valued leftover embers at 3.5 each (borrowed from the greedy evaluator), so a card that spent 2 embers for +4 ATK looked like a *net loss* — the planner hoarded embers and under-played, doing feeble strikes **worse than random**. Leftover embers at end-of-strike are near-worthless. After the fix (damage-focused value, low `PLAN_W_ember`):

| Brain | Base-game Lucifer win% |
|---|---|
| Random spammer (LAZY) | ~7% |
| Old greedy bot | ~5% |
| **Veteran planner (before fix)** | 5.3% |
| **Veteran planner (after fix)** | **9.2%** ← now clearly the best player |

This is the runnable pro bot you asked for — I can run and improve it thousands of games at a time with no live game and no babysitting.

---

## 🎯 THE HEADLINE FINDING — order-dependent chains are the skill lever

**Riff chains currently fire if both cards are played in a strike, IN ANY ORDER.** So a spammer that just dumps its hand triggers them by sheer volume. The game's central "skill" mechanic **rewards playing *more* cards, not the *right* cards in the *right order*.** That is the root reason skill can't beat spam.

I added `SP_CHAIN_ORDER=1`: a chain fires only when its two cards are the **last two plays, in order (A→B)** — a real sequencing test a random player rarely hits but a planner reliably lands. The auto-tuner's data is unambiguous:

| Config | Veteran | Spammer | Gap |
|---|---|---|---|
| Chains ANY order (`SP_CHAIN_ORDER=0`) | 10.0% | **10.9%** | −0.9 (spam wins) |
| Chains IN ORDER + payoff 2.5× | **6.6%** | 3.7% | **+2.9 (skill wins ~1.8×)** |

**With order OFF, the spammer wins. With order ON, the veteran wins.** Every top-gap config the tuner found has `SP_CHAIN_ORDER=1`. This is the single most important gameplay edit.

---

## 🤖 THE AUTO-TUNER — `tune-veteran.mjs` (resumable, gap-optimized)

Plays hundreds of games per trial and hill-climbs both the veteran brain (planner weights/depth) and the spam-punishing game levers (chain order/payoff, ember cap) to **maximize the skill gap** (veteran% − spammer%). It's **resumable** — it saves the best config to `tune-best.json` and continues from it, so it can run in chunks (my sandbox caps each run at ~3 min; **on your machine it can run for hours and keep improving**).

Run it: `node tune-veteran.mjs` (env: `TUNE_MIN`=minutes, `TUNE_GAMES`=games/eval). Best config after only ~10 trials:
`SP_CHAIN_ORDER=1 SP_CHAIN_MULT=2.5 SP_EMBER_GEN_CAP=11 PLAN_W_ember=0.4 PLAN_DEPTH=3 PLAN_BEAM=4` → veteran 6.6% / spammer 3.7%.

⚠️ **Honest ceiling:** param tuning gets a ~2–3% gap (veteran ~1.8× spammer). To make skill *crush* spam, it needs the CARD/MECHANIC edits below — the game's outcome is still dominated by survival/RNG/raw-stat-stacking, and in-combat order is a thin slice unless we make it matter more.

---

## 🚩 FLAGGED CARD & GAMEPLAY EDITS (to give a skilled deck-builder a massive edge)

Ranked by impact on the skill gap:

1. **Make riff chains order-dependent (SEQUENCE matters).** THE lever. Play A→B in order to fire the chain. Random order = no chain. This alone flips the gap from spam-favored to skill-favored. Port `SP_CHAIN_ORDER` logic into the live game (`App.jsx` ~6846 `for(const chain of RIFF_CHAINS)` — currently `includes(a)&&includes(b)`, any order).
2. **Raise chain payoff (~2.5×) so landing sequences is the main damage path.** Pairs with #1 — chains must be *worth* the skill to execute them.
3. **Cap per-fight ember GENERATION (~10–11), don't delete generators.** Stops infinite-refill hand-dumping so you must *choose* which cards to play — random chooses wrong. (Ready-to-wire `gainEmbers` spec in `TOMORROW.md`.)
4. **Punish redundant / wrong-order plays.** Ideas: a card that's *dead* unless it follows a specific setup (e.g., "if the last card played was a RIFF, +X; else fizzle"); "wasted" plays (playing a buff on a maxed member, or a 4th card when 3 would combo) add Corruption. Random play eats these penalties; a planner avoids them.
5. **Make deckbuilding matter more (draft/shop synergy).** Right now a *random* drafter does almost as well as a careful one because most cards are individually fine and independent. Add explicit archetype synergies (cards that scale off other owned cards / keywords) so a rookie's random deck is incoherent while a curated deck snowballs. This is where the deepest "deck-fixing skill" lives.
6. **Order-sensitive keywords.** e.g. a keyword that only triggers if the member is played into a specific adjacency, or a chain that needs 3 cards in exact order for a huge payoff — rare, rewarding, unspammable (your words).

---

## 📁 What changed this session (all env-gated / default-OFF; default sim + live game unchanged)
- `vestibule-sim-kwstacks.js` — combo-lookahead planner (`PLANNER=1`), planner ember-hoarding fix (`PLAN_W_*`), `SP_CHAIN_ORDER`, decoupled `SP_CHAIN_MULT`/`SP_EMBER_GEN_CAP` from the harsh bundle, planner chain-value fix.
- `src/data/cardEval.js` — `EVAL_WEIGHTS` now env-tunable (browser-safe; live game unaffected).
- `tune-veteran.mjs` — NEW resumable auto-tuner.

## ▶️ NEXT (fast, when you're back)
1. Port **order-dependent chains** (#1) into the live game + run the live bot to confirm the gap holds on the real game.
2. Let `tune-veteran.mjs` run for an hour on your machine to push the gap further.
3. Design 3–5 **synergy/sequence cards** (#4–6) — that's what turns a +3% gap into "skilled players crush rookies."
