# VESTIBULE — FULL AUDIT REPORT
Generated: Session end

---

## ART STATUS

### Card Art (public/vestibule/cards/)
- **80 cards have PixelLab art** ✅
- **6 cards still have procedural placeholders:**
  hungercard, madnesscard, skullsplitter, tappedout, void_pact, whispercard

### Other Art
| Category | Files | Real Art | Procedural |
|----------|-------|----------|------------|
| Cards | 86 | 80 | 6 |
| Artifacts | 12 | 0 | 12 |
| Passives | 10 | 0 | 10 |
| Pacts | 23 | 0 | 23 |
| Loot | 5 | 0 | 5 |
| Packs | 5 | 5 | 0 |

### Not Yet Created
- Card back (`public/vestibule/cardback.png`)
- Sly portrait (`public/vestibule/shop/sly.png`)
- 5 deck covers (`public/vestibule/decks/`)
- App icon (`public/vestibule/icon.png`)
- Steam capsule images (4)

---

## EMOJI → ART WIRING STATUS

**Raw emoji renders remaining: 16**
Lines: [1633, 1663, 1930, 2077, 2147, 2203, 2252, 2775, 3047, 4178, 4229, 7410, 7424, 8120, 8322, 8339]

**Screens using CardArtImg:**
- ✅ Hand cards (120px)
- ✅ Shop sale cards (140px)
- ✅ Shop left panel (64px)
- ✅ Shop card grid (56px)
- ✅ Deck viewer cards (48px)
- ✅ Deck viewer list (20px)
- ✅ Pack opening modal cards (80px)
- ✅ Doom Forge selection (60px)
- ✅ Doom Forge upgrade preview (56px)
- ✅ Setlist Rewrite card burn (50px)
- ✅ Discard pile / draw cards (36px)
- ✅ Score unlock items (64px)
- ✅ Score unlock card preview (48px)
- ✅ Artifact tray sidebar (28px)
- ✅ Booster packs (PackArtImg)

---

## KNOWN BUGS

1. **"Back to the Pit" button** — reported not working. Handler code
   looks correct (setGameState('playing') IS called). Need browser
   console error to diagnose. Most likely a stale closure crash
   inside handleShopLeave useCallback (deps: [fightIndex,maxEmbers,stage]).
   **ACTION: Check F12 console for red errors when clicking.**

2. **Demo Tape** — FIXED this session. Was broken due to stale closure
   (lastRiffPlayed state inside useCallback). Now uses ref.
   Also added handlers for all 31 riff cards + generic fallback.

---

## CODE HEALTH

- Lines: 8910
- Hardcoded asset paths: 0 (all use import.meta.env.BASE_URL) ✅
- ErrorBoundary: returns children correctly ✅
- Save system: functional (auto-save at fight start, clear on end) ✅
- Sim: synced with Balatro system ✅
- Win rates: calibrated across all 5 decks ✅

---

## REMAINING WORK

### JV's Lane (Art + Audio)
1. [ ] 6 missing card arts (procedural placeholders)
2. [ ] 12 artifact arts (procedural)
3. [ ] 10 passive arts (procedural)
4. [ ] 5 booster pack arts (retheme to match names: cassette/cdr/vinyl/etc)
5. [ ] 1 recruitment pack art
6. [ ] Card back design
7. [ ] Sly the Fence portrait
8. [ ] 5 deck cover arts
9. [ ] App icon (512×512)
10. [ ] Menu ambient drone (30-60sec)
11. [ ] Combat music loop (60-90sec)
12. [ ] Death/defeat sting (5sec)
13. [ ] 5 SFX (card play, strike, chain, stoned, boss kill)
14. [ ] Steam capsule images (4)

### Claude's Lane (Code)
1. [ ] Debug "Back to the Pit" button (need console error)
2. [ ] Wire pack art into BoosterPack tear animation
3. [ ] Wire recruitment pack to use pack art
4. [ ] Wire card back art into draw pile
5. [ ] Wire deck cover art into menu
6. [ ] Wire Sly portrait into shop
7. [ ] Wire audio playback (when music files are ready)
8. [ ] Collection screen (Pokédex)
9. [ ] Run statistics page
10. [ ] Split App.jsx into modules (8900 lines)

---

## SHIP READINESS: 8/10

The game is mechanically complete and balanced. The Balatro combo system
works. Save/resume works. 80/86 cards have real PixelLab art. All card
screens now use CardArtImg (no more raw emoji in gameplay).

**Blocking launch:** Music (silent doom metal game = contradiction).
**Would improve launch:** Remaining procedural art, shop UX, Back to Pit bug.
**Post-launch:** Collection screen, stats page, code split, Steam achievements.
