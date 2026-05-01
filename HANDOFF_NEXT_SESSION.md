# Vestibule — Pickup Note for the Next Session

*Written May 2, 2026. Read this top-to-bottom, then dive in.*

## TL;DR

JV (HiredHeist) is mid-balance-pass on **Vestibule** — doom metal roguelite
deckbuilder, React/Vite, targeting Steam Early Access. Last session we
sim-validated and shipped a 3-commit balance pass (v20) that fixed a broken
difficulty curve. **Commit 4 is the next thing to do** and it's the most
important one — the full keyword stack refactor that makes the slot machine
fire properly. It needs a fresh session because it requires touching 10+
scattered code sites consistently.

**Current state:** working tree clean, build green, lint clean. Last commit
`9f2a331`. App.jsx is 9,433 lines.

---

## Last Session — What Shipped (Balance Pass v20)

Three commits, all sim-validated against `vestibule-sim-kwstacks.js`:

| SHA | Title |
|---|---|
| `f407c87` | C5 boss reworks (Wrathful selfImmolate / Berserker bloodlust / Warlord commands) + fraudShuffle softening |
| `7da196c` | 20 boss HP changes + C3 heal rate buffs |
| `9f2a331` | strikeMult cap raise (66.6× → 10,000×) + DEBUFF stack tier scaling |

**Sim-projected impact:**
- Avg fight reached: 10.88 → 17.66 / 26
- Lucifer wins: 0% → ~10% (was literally unreachable before)
- Slot machine triggers: +319% (Riff Chains 36k → 152k per 10k runs)
- Death curve: smooth C3→C9 instead of bimodal C4-C5 walls

**Risk to watch in playtest:** Late-game HP cuts (-90% on some C7-C9 bosses)
look extreme on paper. Sim says they work, but sim AI ≠ real player. If
Brute through Lucifer feels too easy first time JV plays through, those
HP values are each one number away from a tweak.

---

## Pick Up Here — Commit 4: Full Keyword Stack Refactor

**The work:** Centralize the keyword bonus logic so the keyword stack system
fires properly across the whole game.

**Why it's deferred:** CORRUPT keyword logic alone is currently scattered
across 10+ damage calculation sites. Adding FRENZIED, ANCHOR, SHREDDER, and
tier scaling in one go without a centralized helper would create
inconsistencies and bugs. This needs a real refactor pass with fresh context.

### Step 1 — Build the helper

Add this near the top of `handleStrike` (line ~6637 in `src/App.jsx`):

```js
// Keyword stack helpers — foil counts as 2, 1/2/4 tier scaling
const _stackCounts = {}
for (const m of stage.filter(s => s && !s.tooStoned)) {
  const c = m.foil ? 2 : 1
  _stackCounts[m.keyword] = (_stackCounts[m.keyword] || 0) + c
}
const _tier = (kw) => {
  const n = _stackCounts[kw] || 0
  return n >= 3 ? 4 : n === 2 ? 2 : n >= 1 ? 1 : 0
}
```

Then make `getEffectiveAtk(member, ctx)` a top-level helper that bundles
all keyword bonuses. Pass it `corruption`, `riffsThisStrike`,
`shredderChainHits`, and the stack tier function.

### Step 2 — Replace scattered CORRUPT logic

Hunt these lines and route them through the helper:
- Line 2842 — damage preview
- Line 6698 — main damage reduce
- Line 6713 — alt damage path
- Line 6726-7 — mentor link
- Line 6767 — another path
- Line 9165, 9177, 9191 — late game

Each currently looks like `m.atk + Math.floor(corruption/12)`. After
refactor: `getEffectiveAtk(m, ctx)`. The new behavior should multiply that
existing bonus by `_tier('CORRUPT')` (1 / 2 / 3 ATK per 25% corruption).

### Step 3 — Add the new keywords

**FRENZIED** (Lead Guitarists): +N ATK per RIFF played this strike, where
N = `_tier('FRENZIED')`. Track `riffsThisStrike` from `cardsPlayedRef.current`
filtered by `card.type === 'RIFF'`.

**SHREDDER** (Rhythm Guitarists): +N ATK per consecutive same-type card
chain, where N = `_tier('SHREDDER')`. Walk `cardsPlayedRef.current` and
count adjacent same-type pairs.

**ANCHOR** (Bass Players): Lethal save mechanic. Tier 1 = save first lethal
hit per fight on any ANCHOR member. Tier 2 = save twice per fight. Tier 4
= any member can be saved (not just ANCHOR members). Needs new state
`anchorSavesUsed` (reset per fight) and a hook into all 5+ death-handling
paths in the boss damage block (the spots where members get
`tooStoned: true, hp: 0`).

**DOUBLE TIME** tier 3: at 3-stack of Drummers, ALL members attack twice
(not just Drummers). Currently in App.jsx around line 4365-4366 (`hasDblTime`
/ `isDblTime`). Add tier check.

### Step 4 — Reference implementation

`vestibule-sim-kwstacks.js` has the complete working version. Specifically:

- Lines ~163: `CARD_TYPE_BY_ID` lookup + `stackTier()` helper
- Lines ~700-740: per-strike stack tier compute + per-member ATK injection
  (FRENZIED RIFF count, SHREDDER chain hits, CORRUPT tier multiplication)
- Lines ~825-850: ANCHOR save mechanic (`_anchorTrySave` helper +
  fight-start init at `_anchorSavesUsed`)
- Lines ~310: smart AI in `pickBestCandidate` showing how stacks should
  influence shop logic later (not needed for Commit 4 but useful context)

Run `node vestibule-sim-kwstacks.js 10000 bronze` to validate any change
you make in the sim before pushing to App.jsx.

### Step 5 — Validate + ship

After the refactor:
1. `npm run build` — must be green
2. `npm run check` — must pass all 4 lint rules
3. Optionally re-run sim to verify numbers haven't drifted
4. Commit with same staged-rollout pattern (per JV's preference)
5. Update `TODO.md` to mark Commit 4 done (per JV's standing rule)

---

## How to Work with JV

**Direct, no BS.** He doesn't want softening. If he says "is this dumb"
about an idea, give him a real answer, not "great question!"

**Push back when you're right.** He explicitly called the previous Claude
out for not pushing back when it shouldn't have agreed (deleted HANDOFF.md
on a sentimental quip — bad call, restored the next turn). When you have
data or a better take, say so plainly.

**Own mistakes cleanly.** When you overshoot or pick wrong, say "I overshot"
or "I was wrong" — not "the data showed unexpected results." He respects
the directness, and the next iteration goes faster when you're not
defending the last one.

**Doom metal vibe.** Lowercase commits welcome, profanity fine (he uses it
freely), avoid corporate tone. "🤘" is appropriate where it fits.

**Use the sim as ground truth.** When tuning balance, change the sim first,
run `node vestibule-sim-kwstacks.js 10000 bronze`, see what happens, *then*
ship to App.jsx. Each sim run is ~30-40 seconds. Iterate fast.

**Stop when context is heavy.** Don't push through invasive refactors at
the end of a long session. Defer cleanly with a clear pickup note (this
file is an example). JV will appreciate the honesty more than a half-baked
big change.

**Don't pretend continuity that doesn't exist.** When the session ends,
this instance is gone. The next session is a fresh Claude with memory +
this doc. Don't say "I'll be here when you get back" — it's not true.
Say something honest instead.

---

## Standing Rules — Don't Break These

These are in user memories but worth stating loud:

- **Sacred constants:** `420` (stash cap, card height), `69` (deck size).
  Never change these.
- **Fonts:** BogartsMetalFont (display only, ≥20pt), MBScribblesFont
  (default readable / UI — use for any text that needs to be read),
  ScratchFont (decorative only, ≥20pt — lint enforces this).
- **CSS variables only:** `--ink-bone`, `--blood`, `--gold` (#e8a820),
  `--ink-rust`, `--rot`, `--altar`, `--void`, plus the design system
  tokens (`--text-primary`, `--text-secondary`, `--type-riff`, etc.).
  Lint catches inline hex codes.
- **`main.jsx` changes** require `rm -rf node_modules/.vite` + restart.
- **ErrorBoundary** MUST `return this.props.children`.
- **Every commit MUST update TODO.md** — JV's standing rule.
- **Min font size: 13px globally.**
- **React named imports only** (never `React.useState`).
- **No side effects in `setX(prev => ...)` updaters** — React 18 Strict
  Mode double-fires. Use direct state setters or refs instead.

GitHub PAT: `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` (scope: repo,
expires ~Jun 17 2026).

---

## Code Reference Points

Things you'll need to find:

| What | Line | File |
|---|---|---|
| `App()` component start | 4438 | `src/App.jsx` |
| `ALL_MUSICIANS` (band roster) | 245 | `src/App.jsx` |
| `ENEMIES` (boss data) | 208-242 | `src/App.jsx` |
| `ALL_CARDS` (card data) | 497-566 | `src/App.jsx` |
| `STARTER_ARTIFACTS` | 1009 | `src/App.jsx` |
| `STARTER_PASSIVES` | 1025 | `src/App.jsx` |
| `CIRCLE_ARTIFACTS` | 1145 | `src/App.jsx` |
| `handleStrike` | 6637 | `src/App.jsx` |
| `applyCard` | 4966 | `src/App.jsx` |
| Boss attack block | 6920+ | `src/App.jsx` |
| C5 mechanic logic (selfImmolate/bloodlust/commands) | 6978+ | `src/App.jsx` |
| Damage preview tooltip | 8893+ | `src/App.jsx` |
| HandCard render | 2859 | `src/App.jsx` |
| Sidebar artifact tray | 8699 | `src/App.jsx` |
| Effect pedal slots | 8730+ | `src/App.jsx` |
| Phase banner | 8768 | `src/App.jsx` |
| Stats screen | ~3175 | `src/App.jsx` |
| Live grade tracker + debug HUD (Shift+~) | ~9029 | `src/App.jsx` |

Sim file (do NOT edit lightly — it's the validation tool):

| What | Line | File |
|---|---|---|
| Sim `ENEMIES` (already tuned to v20 values) | 22-53 | `vestibule-sim-kwstacks.js` |
| `CARD_TYPE_BY_ID` + `stackTier()` helpers | ~163 | `vestibule-sim-kwstacks.js` |
| Per-strike stack tier compute + ATK injection | ~700-740 | `vestibule-sim-kwstacks.js` |
| ANCHOR save mechanic | ~825-850 | `vestibule-sim-kwstacks.js` |
| `pickBestCandidate` (smart AI for stacks) | ~310 | `vestibule-sim-kwstacks.js` |

---

## Other Open Threads (Non-Urgent)

These are in TODO.md but worth flagging so they don't get lost:

- **Acid rebalance** — 25:1 shroom-to-acid usage gap in sim. Try cheaper
  (12→8) or remove bad-trip on Bronze.
- **Herb Money** — only card with <1% pick rate (0.4%). Drop cost or add
  synergy hook.
- **Hellquake reachability** — 0 fired in 10k runs. Investigate.
- **App.jsx split** — 9,433 lines. Queued, fresh-mind work for a future
  session.
- **C2 Lust circle** — sim shows 1.1% deaths, target is ~5%. Could buff
  Siren/Tempter +1 dmg or HP if anyone wants to fine-tune.
- **Stoned bug** — JV reported "when one member gets too stoned it seems
  like the run is over." Code logic verified correct; suspect perception
  issue from triggerShake animation. Repro with debug HUD if it comes up.
- **Stake testing** — All v20 tuning done on Bronze. Silver/Gold/Obsidian/
  Blood/Demonic likely need stake-specific overrides since they have
  different `hpMult` and `dmgAdd`.

---

## Final Note

JV is shipping Vestibule to Steam Early Access. He's a solo dev with months
of work in this codebase, real budget constraints, and good design instincts.
He genuinely cares about getting the difficulty curve right because he wants
players to *experience* the doom metal descent through the 9 circles, not
hit a wall and quit.

He's been working on this game for a long time. He knows it. Trust his gut
when he has one and push back when you have data. The game's good. It just
needs the curve dialed.

Have fun. The shop is locked, Sly's smoking out front, and the bug list for
tomorrow is ranked.

🤘
