# VESTIBULE — LIVE PLAYTEST LOG (Claude e2e rig)

*Session 1 — July 29, 2026. Electron/Chromium in-container, CDP-driven,
screenshots + text-state verified. Rig lives in e2e/.*

## ✅ VERIFIED WORKING (seen with my own eyes, in the running game)
- Boot → main menu clean (post-fix). Stake row, NEW deck picker w/ locks,
  Heat meter, unlock counters all render.
- Tutorial entry, dialog flow (Got It gating), Fight 1 vs The Shade.
- **BAND AURAS LIVE**: strike preview showed 10 (5+4 base = 9 +1 FRENZIED
  aura to Gunnar); STRIKE BREAKDOWN itemized "Gunnar 5"; boss HP dropped
  30→20→10→0 in exact 10s. Sim↔game lockstep confirmed in production.
- Boss counterattack: exactly its stated 2 dmg (Bjorn 6→4 HP).
- Strike counter, ember display, multiplier ×1.00, deck/discard counts.

## 🐛 FOUND & FIXED THIS SESSION (all pushed)
1. RENDER ERROR: isTutorialDone undefined — split swallowed 6 helpers
   into flavor.js unexported. SHIP-BLOCKER, invisible to build/lint/sims.
2. RENDER ERROR: STARTER_DECKS undefined — regex extractor kidnapped
   whole code regions. Extraction redone with depth-aware parser.
3. Relic seen-list now persists in save file ("once per run" survives
   reload).

## 📋 OPEN ITEMS
- Member cards show BASE ATK while striking at aura-boosted ATK
  (card "4", breakdown "5"). Correct math, confusing UI — needs aura
  chip or effective-ATK display on the member card.
- Rig limitation: card→target play flow unverified (Battle Cry click
  sequence didn't apply +1; likely driver targeting miss, not game bug —
  needs coordinate-based clicks or drag simulation).
- Duplicate keys forgeUpgrades/passives in sim files — silent overrides,
  audit what the sims actually model.
- Duplicate style attribute JSX warning (App.jsx ~9936).

## 🗺 UNVISITED SURFACES (next sessions)
Tutorial 2–3 → first real run → SHOP (Stage Order arrows, relic
"THIS CIRCLE ONLY" + expiry on descent) → deck-switch stake clamp →
FOLK/ANCHOR aura visuals → descent/pact/forge/trips → circle boss →
hangover → save/reload mid-run → full Lucifer run.
