# HANDOFF — May 2 → 3, 2026

*30-second read for morning-JV. Full details in TODO.md "LATE-NIGHT STATUS" section.*

---

## What shipped while you slept it off 🤘

### Commit `a8529d6` — Corruption safety net + first-time tutorial popup (LATEST)
Live morning playtest revealed: even with 84 HP / 2 dmg Wanderer, weak-team players (5 ATK total) still lost fight 1 because corruption-spam pushed to 85% and "darkness consumed the band." Two fixes:

1. **Fight 1 corruption clamp:** `useEffect` watches corruption — when `>50` AND `fightIndex===0` AND not in tutorial AND not Welcome-to-Hell, clamp to 50 + log. Fight 2+ has full mechanics, no clamp.
2. **First-time corruption popup:** triggers on first 50%+ EVER. Explains what corruption does, the 100% lose condition, breakpoints (50/60/80/100%), and how to manage it down. Uses existing `setFirstTip` system.

### Commit `64ecb85` — Fight 1 training-wheels tuning + Welcome Pack
1. **The Wanderer:** 90 HP / 4 dmg → **45 HP / 2 dmg** (with 1.85× deck scale = **83 HP displayed**)
2. **Shop 1 free Welcome Pack:** new branch in `genRecruitPack()` — fightIndex 0 returns cost-0 pack for guaranteed 3rd member after fight 1
3. **`boss_hp_override.json` synced** with live HPs (auto-extracted from src/App.jsx)

### 50,000-game sim verification (10k × 5 decks, Bronze) — pre-corruption-clamp
- ✅ Wanderer **100.0% survive** across all 5 decks (was a death wall before)
- ✅ Lucifer win rate **8-11%** by deck (target ~10%, perfect)
- ⚠ Lost Soul (fight 2) is the new "real game starts here" wall, 10-29% death rate by deck — **intentional**
- ⚠ Live playtest with 5-ATK team STILL lost fight 1 to corruption spiral → fixed in `a8529d6`

---

## Morning checklist (5 min)

```bash
cd vestibule
git pull                          # gets a8529d6
rm -rf node_modules/.vite         # Vite HMR doesn't refresh BOSSES const
npm run dev
```

In browser (hard reload **Cmd+Shift+R** is critical):
- [ ] Fight 1 shows **The Wanderer · 84/84 HP · BASE DAMAGE 2 PER STRIKE**
- [ ] Spam CORRUPT cards (Dial to Eleven, Death Riff, Distortion) until corruption hits 50%
- [ ] On first 50% hit: **first-time tutorial popup** appears explaining corruption
- [ ] Try to push corruption past 50%: **clamp activates**, log message "🛡 Training wheels: corruption capped at 50% in fight 1"
- [ ] Win fight 1, enter shop, verify **🎸 Welcome Pack** at cost **0**
- [ ] Fight 2 (Lost Soul): corruption clamp should NOT apply (test by playing Dark Whisper → corruption climbs above 50% normally)

If anything looks wrong:
- Wanderer still showing 121 or 167 HP → Vite serving stale code, kill `vite` process fully and `rm -rf node_modules/.vite dist`
- Welcome Pack at cost 10 → check `vst_save_v4` in localStorage isn't restoring an old shop state, clear it
- Tutorial popup didn't show → check `vst_tips` in localStorage — if `corruption` is already in there, you've seen it on a prior run; clear `localStorage.removeItem('vst_tips')` to retest

---

## Don't tune anything else right now

The Wanderer nerf + corruption clamp + tutorial popup should make fight 1 winnable for everyone. Locked. Move to art and music.

---

## What's NOT done (still on TODO list, deferred)

- v0.7 cleanup pass: 5 architectural debt items (Echoplex replay engine, 3-site mult dedup, save load truncation UX, mythic unlock progress hints)
- Art assets: 27 boss portraits done, ~80 cards still placeholder
- Music: 11 tracks done, ~20 more needed (per-circle ambience, boss themes, victory stings)

These are NOT urgent. Game is mechanically locked through Steam EA.

---

*Sweet dreams. Tomorrow: art and music. 🎨🎸*
