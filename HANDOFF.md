# HANDOFF — May 3 evening (Trip System Overhaul)

*30-second read for tomorrow-JV. Full details in TODO.md "LATE-NIGHT STATUS" section.*

---

## State of the branch: `hangover-with-teeth`

**Two big systems shipped on this branch (not yet merged to main):**

1. **Morning session — Hangover system.** Corruption can no longer end your run. Costs deferred to next fight + next shop (HP debuff, shop tax, small stash haircut). Validated at 5K games — within statistical noise of baseline.

2. **Evening session — Trip system overhaul + DMT tier.** 8 → 24 trip effects. Bunk drugs eliminated. Mid-fight activation enabled. New premium DMT tier (boss-shop only, 25🌿). Audio sweep + screen shake on activation. Validated at 5K games — Lucifer wins jumped from 7.62% to 11.60%.

## What to playtest first tomorrow

**The order I'd hit it (~30 min):**

1. **Buy shrooms in fight-1 shop, use it mid-fight in fight 2.** Confirms mid-fight gating works (was previously `strikesLeft===maxStrikes`-locked).
2. **Survive to first boss kill, hit boss-shop, look for the 💠 DMT tile** at 25🌿. Buy if you can afford. Tile should glow with a blue-violet gradient.
3. **Try to roll BLOTTER REVELATION or PSILOCYBIN PORTAL** — these are instant-effect trips. Watch for the audio sweep + screen shake.
4. **Watch the activation overlay** — should show emoji + name in BogartsMetalFont + flavor text in ScratchFont. DMT uses the 💠 emoji (was hardcoded shrooms/acid only — fixed).
5. **If a member goes stoned, save a DMT for REBIRTH** — should fully restore them with +2 perm ATK.
6. **Try BLACK SUN with a CORRUPT-heavy hand** — every CORRUPT card should pump strike multiplier by 50%. Watch for the float text.

## Bugs caught and fixed during pre-push audit (5)
1. `dmt_traveler` achievement was unregistered — added
2. BLACK SUN `addFloat` used nonsense uid lookup — fixed
3. REBIRTH wasn't restoring `_origAtk` on revived members — fixed to mirror Wake Up Call
4. HYPERSPACE's `allCardsFreeRef` not cleared on fight reset — fixed
5. PSILOCYBIN PORTAL + THIRD EYE used stale `hand` closure — switched to `handRef.current`

## Things to watch (untested integration risks)
- DMT tile rendering exclusively at boss-shops (every 3rd shop)
- BLACK SUN compounding with stacked CORRUPT plays (engine caps at 10000× strike mult)
- AI in sim still pushes to 100% corruption 6.21 times/game — humans might do same, would mean Hangover doesn't feel like a real tradeoff
- DMT activation rate in sim is only 0.07/game — too low? Could lower price from 25🌿 to 20🌿 post-playtest

## Files changed
- `src/App.jsx` (~11,659 lines, parse OK)
- `vestibule-sim-hangover.js` (v20.1-trips, parse OK)
- `TODO.md` (head updated with both sessions)
- `HANDOFF.md` (this file)

## Sacred constants (unchanged)
- 420 (stash cap, card height), 69 (deck size)
- Fonts: BogartsMetalFont (display, NO numbers), MBScribblesFont (default+numbers), ScratchFont (flavor)
- React 18 Strict Mode: no side effects inside `setX(prev => ...)` updaters

---

*Branch sits at /home/claude/vestibule (Claude's sandbox). Diff against main shows the full Hangover + trips changeset. Push the branch, hammer it, file issues — I'll re-tune from playtest data.*
