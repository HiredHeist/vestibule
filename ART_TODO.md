# VESTIBULE — ART TODO

*Generated: May 3, 2026 evening (post-trip-system push)*
*Supersedes the older ART_TODO from May 2 — backup at /tmp/ART_TODO_old.md*

This is the **complete inventory** of every piece of art Vestibule still needs. Sizes match existing PNGs in the repo — your source files should be at this size or proportionally bigger if you want headroom for re-export. Place each PNG in the path shown.

---

## 📊 SUMMARY

| Category | Missing | Already Done | Total |
|---|---|---|---|
| **Cards** | 0 | 82 | 82 ✅ |
| **Members** | 0 | 18 | 18 ✅ |
| **Bosses** | 0 | 27 (+ Lucifer p1/p2) | 27 ✅ |
| **Pacts** | 0 | 13 (+10 extras) | 13 ✅ |
| **Booster Packs** | 0 | 5 | 5 ✅ |
| **Artifacts** | **26** | 12 | 38 ⚠ |
| **Pedals (passives)** | **22** | 10 | 32 ⚠ |
| **Boss Loot** | **3** | 5 | 8 ⚠ |
| **Trip Effects (NEW)** | **24** | 0 | 24 ❌ |
| **Achievements** | **17** | 0 | 17 ❌ |
| **Stakes** | **6** | 0 | 6 ❌ |
| **GRAND TOTAL TO MAKE** | **98** | | |

98 pieces is a lot. Suggested order: trip effects → stakes → achievements (highest visibility, smallest files) → artifacts → pedals → boss loot.

---

## 🗂 SOURCE-OF-TRUTH SIZES (sampled from existing PNGs)

| Asset class | Folder | Size |
|---|---|---|
| Cards | `public/vestibule/cards/` | **128×128** |
| Members (stage portraits) | `public/members/` | **128×128** |
| Bosses | `public/bosses/` | **128×128** |
| Booster Packs | `public/vestibule/packs/` | **296×512** (portrait) |
| Artifacts | `public/vestibule/artifacts/` | **64×64** |
| Pedals (passives) | `public/vestibule/passives/` | **64×64** |
| Boss Loot | `public/vestibule/loot/` | **64×64** |
| Pacts | `public/vestibule/pacts/` | **64×64** |
| **Trip Effects (NEW)** | `public/vestibule/trips/` | **256×256** *recommended* |
| **Achievements (NEW)** | `public/vestibule/achievements/` | **64×64** *recommended* |
| **Stakes (NEW)** | `public/vestibule/stakes/` | **128×128** *recommended* |

---

## 🎴 ARTIFACTS — `public/vestibule/artifacts/` — **64×64 PNG**

**Theme:** small icon, transparent background, sits on dark UI. Existing a1/a3/a5/a6/a8/a9/a10 set the style — minimal, readable at small size, gold-on-dark or red-on-dark mostly.

**Missing (26):**

| File | Suggested theme |
|---|---|
| `a2.png` | (Pentagram Shrine) — pentagram glyph |
| `crackedpickup.png` | guitar pickup with hairline crack |
| `distortioncab.png` | amp cabinet, fuzzy aura |
| `ashtray.png` | overflowing ashtray, smoke |
| `crowdnoise.png` | sound waves, crowd silhouettes |
| `tapehiss.png` | cassette tape with static lines |
| `cheapbeer.png` | beer bottle, label peeling |
| `setlistart.png` | crumpled setlist, scrawled |
| `gaffertape.png` | roll of black tape, X mark |
| `powerstrip.png` | overloaded power strip, sparks |
| `spitcup.png` | red solo cup, spit/foam |
| `toursticker.png` | layered tour stickers, weathered |
| `divebarsign.png` | flickering neon "OPEN" sign |
| `pentagramshrine.png` | candles + pentagram |
| `doomchoir.png` | hooded chorus, glow |
| `solosermon.png` | single guitar at altar |
| `blackmassbell.png` | inverted bell, blood drip |
| `ouroborospin.png` | snake-eating-tail pin |
| `drummerstick.png` | broken drumstick, splintered |
| `fogmachine.png` | dripping fog machine, vapor |
| `chromeskull.png` | reflective chrome skull |
| `doomcrown.png` | spiked iron crown |
| `triplesixes.png` | 666, dripping |
| `luciferspact.png` | signed scroll, blood seal |
| `invertedpentacle.png` | upside-down pentagram, glowing |
| `blackgoat.png` | goat's head, horns, glowing eyes |

---

## 🎚 PEDALS (passives) — `public/vestibule/passives/` — **64×64 PNG**

**Theme:** stompbox effect pedals — square footprint, knob, LED, label. Existing p1-p10 set the style.

**Missing (22):**

**Reclassified from artifacts (PNGs already exist in `/artifacts/` folder — just COPY them over to `/passives/`):**
- `a3.png` → copy from `public/vestibule/artifacts/a3.png`
- `a8.png` → copy from `public/vestibule/artifacts/a8.png`
- `ca2.png` → copy from `public/vestibule/artifacts/ca2.png`
- `ca3.png` → copy from `public/vestibule/artifacts/ca3.png`
- `wardrums.png` → copy from `public/vestibule/artifacts/wardrums.png`

**Need new art (no PNG anywhere):**
- `a4.png` (was artifact, no PNG ever)
- `a7.png` (was artifact, no PNG ever)
- `bitcrusher.png` — pixelated lo-fi pedal
- `cabletester.png` — multimeter-style pedal
- `compressorpedal.png` — pumping waveform
- `drumthrone.png` — throne with kick pedal
- `echoplex.png` — repeating wave loop
- `fuzzbox.png` — distorted hairy fuzz
- `looperpedal.png` — circular loop arrow
- `octavepedal.png` — stacked octave bars
- `phaserpedal.png` — sweep wave / sine ripple
- `powerconditioner.png` — rack-mount unit
- `reverbtank.png` — spring tank with depth
- `sustainpedal.png` — long flat note hold
- `tunerpedal.png` — needle and 440Hz mark
- `volumeknob.png` — single big knob
- `wahpedal.png` — rocker pedal in motion

---

## 💎 BOSS LOOT — `public/vestibule/loot/` — **64×64 PNG**

**Theme:** mystical trinket / talisman style. Existing 5 set the tone (golden_tooth, love_letter, etc).

**Missing (3):**
- `berserker_rage.png` — bloodied gauntlet, fist/claw
- `heretics_brand.png` — branding iron with sigil
- `limbos_echo.png` — empty mirror or hollow lantern

---

## 💠 TRIP EFFECTS — `public/vestibule/trips/` (new folder!) — **256×256 PNG**

**Theme:** these display fullscreen at fontSize:100 in the trip-reveal overlay. Source should be larger for clean pixelation. Psychedelic, doom-stoner aesthetic. **256×256 minimum, 512×512 even better since these are hero moments.**

⚠ This folder doesn't exist yet — `mkdir public/vestibule/trips` before you start. Code will need a `TripArtImg` component wired up — I'll build it in a follow-up session once you have art.

### 🍄 Shrooms (8) — gold/orange/violet palette

| File | Effect | Suggested visual |
|---|---|---|
| `ego_death.png` | All +2 ATK | mushroom with cosmic eye |
| `time_dilation.png` | +1 Strike | melting clock face |
| `synesthesia.png` | -1 ember costs | rainbow synesthetic burst |
| `cosmic_unity.png` | full heal + stonewall | conjoined mushroom hands |
| `blotter_revelation.png` | next 3 cards free | floating tarot cards |
| `psilocybin_portal.png` | draw 5 | mushroom portal opening |
| `doom_crystal.png` | top ATK doubled | crystal forming on a fist |
| `ghost_weed.png` | CORRUPT free | translucent weed leaf |

### 🧪 Acid (8) — magenta/cyan/violet palette

| File | Effect | Suggested visual |
|---|---|---|
| `fractal_vision.png` | ×2 damage | fractal kaleidoscope |
| `dimensional_rift.png` | boss takes ×2 | red tear in space |
| `ego_dissolution.png` | corruption + perm ATK | dissolving face |
| `astral_projection.png` | immune | floating soul, body below |
| `dmt_breakthrough.png` | skip 2 boss attacks | machine elf eye |
| `reality_glitch.png` | ×2 strike start | corrupted pixelated view |
| `crystal_shriek.png` | +5 ATK fight | crystal shattering, sound waves |
| `k_hole.png` | boss frozen | dissociated head, fractal hole |

### 💠 DMT (8) — white/blue-violet/holy palette

| File | Effect | Suggested visual |
|---|---|---|
| `hyperspace.png` | all cards free | star tunnel |
| `overmind.png` | ×3 strike start | giant cosmic eye |
| `godhead.png` | +10 ATK | radiant halo over band |
| `rebirth.png` | revive all | phoenix from ashes |
| `third_eye.png` | draw 8 + max ember | glowing third eye |
| `sacred_chord.png` | ×3 boss + skip | shattering tuning fork |
| `timeline_collapse.png` | +2 strikes | converging timelines |
| `black_sun.png` | +50% per CORRUPT | black sun w/ corona |

---

## 🏆 ACHIEVEMENTS — `public/vestibule/achievements/` (new folder!) — **64×64 PNG**

**Theme:** trophy/badge style, gold-on-dark. Each unique.

⚠ Folder doesn't exist yet — `mkdir public/vestibule/achievements`.

| File | Achievement |
|---|---|
| `first_blood.png` | Win your first fight |
| `circle_3.png` | Reach Circle 3 |
| `circle_5.png` | Reach Circle 5 |
| `circle_7.png` | Reach Circle 7 |
| `circle_9.png` | Reach Circle 9 |
| `beat_lucifer.png` | Defeat Lucifer (LEGEND tier visual) |
| `hellquake.png` | Trigger Hellquake and survive |
| `perfect_strike.png` | Kill boss in 1 strike |
| `corruption_lord.png` | 100% corruption AND win |
| `sober_run.png` | Reach Circle 5 with no drugs |
| `high_score_5k.png` | Score 5,000+ |
| `high_score_10k.png` | Score 10,000+ |
| `drug_lord.png` | Use both shrooms + acid |
| `dmt_traveler.png` | First DMT use |
| `full_band.png` | 5 members on stage |
| `mentor_link.png` | Form a Mentor Link |
| `ten_runs.png` | Complete 10 runs |

---

## 🎖 STAKES — `public/vestibule/stakes/` (new folder!) — **128×128 PNG**

**Theme:** difficulty badges. Bigger size because they appear on the difficulty-select screen prominently. Metal-finish color matching the stake name.

⚠ Folder doesn't exist yet — `mkdir public/vestibule/stakes`.

| File | Color theme |
|---|---|
| `bronze.png` | bronze/copper, simple shield |
| `silver.png` | silver, slightly more ornate |
| `gold.png` | gold, ornate, glowing |
| `obsidian.png` | black volcanic glass, sharp edges |
| `blood.png` | dark red, dripping |
| `demonic.png` | inverted pentagram, fire/horns |

---

## 🛠 NOTES & CONVENTIONS

**Pixel art style:** match existing assets. PixelLab `no_background:true` style for portraits. Smaller icons (artifacts/pedals/loot/pacts) are flatter pixel-art with gold/red/dark palette.

**Transparent backgrounds:** all icon-class art (artifacts, pedals, loot, achievements, trips). Member/boss portraits also transparent.

**File format:** PNG, 8-bit indexed if you want the smallest files (existing 64×64 icons are ~700 bytes).

**Naming:** lowercase, exact id match. `crackedpickup.png` not `CrackedPickup.png`. Underscores for compound words (`first_blood.png`), no hyphens. Match the IDs in src/App.jsx exactly.

**To wire up new categories I haven't yet built React components for:**
After you make art for trips/achievements/stakes, I need to build `TripArtImg`, `AchievementArtImg`, `StakeArtImg` components mirroring `CardArtImg`. ~20 lines each. Do them in one batch after you've made the art so I'm not building empty plumbing.

**The lazy-but-effective starter strategy** — if you want maximum visible impact in minimum time:
1. **Trip effects first (24)** — most visible because fullscreen reveals
2. **Stakes (6)** — appear at run-start, set tone immediately
3. **Achievements (17)** — small but accumulate over time
4. **Artifacts (26)** + **Pedals (22)** — granular but less prominent in any single moment
5. **Boss loot (3)** — only 3, easy to knock out

Let me know what categories you finish first and I'll do the React plumbing.
