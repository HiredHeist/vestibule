# VESTIBULE — ART TODO

*Last updated: May 2, 2026 — consolidated from ART_GUIDE / ART_TODO / CARD_ART_GUIDE*

This is the art asset spec — the **how-to** companion to `TODO.md` Priority 5 + 6 (which has the high-level overview). Drop PNGs at the listed paths and they auto-load via `import.meta.env.BASE_URL`. No code changes needed unless explicitly noted.

---

## STYLE GUIDE

**Visual reference:** Darkest Dungeon meets pixel art doom metal album covers.

**Palette per card type:**
- RIFF → purple accent `#9933CC`
- CORRUPT → blood red `#AA1111`
- UTILITY → green `#22AA44`
- EMBER → orange `#C87820`

**Backgrounds:** Transparent or near-black (`#0A0602`). Card frames provide the border.

**Color discipline:** Muted base palette with one strong accent color per piece. Don't fight the frame — let the art do its job in 128×128.

---

## PRIORITY 1 — MISSING CARD ART (6 cards)

**Path:** `public/vestibule/cards/{id}.png`
**Size:** 128×128px transparent PNG
**Status:** All 6 currently render as procedural placeholder icons (under 1KB each).

| ID | Card name | Type | Direction |
|---|---|---|---|
| `hungercard` | Hungering Flame | CORRUPT | Roaring black flame with a hungry maw inside it, biting outward. Reds/blacks. |
| `madnesscard` | Madness Unleashed | CORRUPT | Cracked head with maggots/eyes pouring out. Pure madness. Disturbing. |
| `whispercard` | Dark Whisper | CORRUPT | Shadowy mouth at an ear, smoke-tendrils as the whisper. Subtle, creepy. |
| `void_pact` | Void Pact | CORRUPT | Pure black hole consuming light. Stars warping inward at the edge. |
| `skullsplitter` | Skull Splitter | RIFF | Axe (the instrument!) embedded in cracked skull. Purple energy at impact. |
| `tappedout` | Tapped Out | EMBER | Empty Marshall amp, power light dim but glowing through cracks. Pre-surge moment. |

**Note:** 4 orphan card art files exist for cards that no longer exist in code: `blood_price.png`, `contract.png`, `dark_whisper.png`, `void_pact.png` (the latter is both placeholder AND in code — keep, replace). Safe to delete the other 3.

---

## PRIORITY 2 — ARTIFACT ART (12 items)

**Path:** `public/vestibule/artifacts/{id}.png`
**Size:** 128×128px (renders 28-80px in tray and shop)
**Status:** All 12 currently procedural.
**Order:** Do shop-shown first (a1, a3, a5, a6, ca1, ca2, ca3, ca4) — players see them in the buy menu most.

| ID | Name | Direction |
|---|---|---|
| `a1` | Vintage Guitar | Old Les Paul, glowing gold aura. |
| `a3` | The Evil Eye | Single glowing teal iris in a triangular frame. |
| `a5` | Haunted Radio | Old tube radio, ghostly static, single visible face in the screen. |
| `a6` | Black Candle | Dripping wax, purple flame, skull in the wax pool. |
| `a8` | Stone Tablet | Carved runes glowing red. Crumbling at edges. |
| `a9` | Resonance Coil | Tesla coil arcing gold sparks. Tuning fork base. |
| `a10` | Burning Stage | Stage on fire, microphone silhouette in flames. |
| `wardrums` | War Drums | Tribal drums with bone sticks, blood splatter on the skin. |
| `ca1` | The Goat of Mendes | Goat skull, pentagram between horns, gold inlay. |
| `ca2` | Hellfire Amulet | Glowing red gem on chain, flames around the setting. |
| `ca3` | Sabbath Crown | Black crown with red gems and bone thorns. |
| `ca4` | Wailing Guitar | Ghost guitar mid-scream, sound waves visible. |

---

## PRIORITY 3 — PASSIVE ART (10 items)

**Path:** `public/vestibule/passives/{id}.png`
**Size:** 128×128px (renders 60-64px in shop and footer)
**Style:** CD-R / equipment / band-life theme, purple accent.
**Status:** All 10 currently procedural.

| ID | Name | Direction |
|---|---|---|
| `p1` | Power Chord | Lightning striking a power strip. |
| `p2` | Roadie Crew | Wrench + first aid kit. |
| `p3` | Merch Table | Band shirt + cash on a table. |
| `p4` | Feedback Hum | Amp humming with orange wave lines. |
| `p5` | Amp Stack | Wall of stacked Marshall amps. |
| `p6` | Cult Following | Hooded figures in a circle, candles. |
| `p7` | Guitar Tech | Hands adjusting guitar pickup screws. |
| `p8` | Green Room | Backstage couch, dim lamp, beer cans. |
| `p9` | Heavy Rotation | Spinning vinyl with motion blur. |
| `p10` | Stage Fright Reversal | Spotlight beam piercing total darkness. |

---

## PRIORITY 4 — PACT ART (13 items, audit needed)

**Path:** `public/vestibule/pacts/{id}.png`
**Size:** 128×128px (renders ~120px during pact selection)

23 PNG files exist in folder; many likely procedural placeholders. **Audit by file size first — anything under 1KB needs replacement.** The 13 actual pact slots:

`ember_surge`, `iron_strings`, `thick_skin`, `dark_bargain`, `speed_demon`, `blood_price`, `clean_living`, `corruption_engine`, `merchants_eye`, `stone_wall`, `sixth_slot`, `war_drums`, `atonement`

Pact selection is a high-attention moment between fights — art quality matters here.

---

## PRIORITY 5 — BOSS LOOT ART (5+ items, audit needed)

**Path:** `public/vestibule/loot/{id}.png`
**Size:** 128×128px (renders ~80px on drop)

Existing art for 5 items: `love_letter`, `endless_hunger`, `golden_tooth`, `the_blade`, `mask_of_lies`.

**Verify against current `BOSS_LOOT` array in src/App.jsx** — at least 6 newer loot items added since the v20 balance pass (`limbos_echo`, `berserker_rage`, `heretics_brand` and the corruption gambits). Create art for any missing.

---

## PRIORITY 6 — BOOSTER PACK ART (5 packs)

**Path:** `public/vestibule/packs/{id}.png`
**Size:** 256×384px (vertical pack shape)

**Current state:** Files on disk are `touring`/`underground`/`festival`/`headliner`/`demonic`. In-game pack names are `cassette`/`cdr`/`vinyl`/`rarevinyl`/`cursed`. **Mismatch.**

Recommended: make new art matching the actual format names.

| ID | Name | Cost | Direction |
|---|---|---|---|
| `cassette` | Cassette Tape | 6 | Cracked cassette, hand-written label, DIY |
| `cdr` | CD-R | 12 | Burned CD-R in paper sleeve, marker-scrawled |
| `vinyl` | Import Vinyl | 22 | Standard vinyl in sleeve, import sticker |
| `rarevinyl` | Rare Vinyl | 38 | Holographic gold vinyl, collector's edition |
| `cursed` | Cursed Demo | 60 | Bone/flesh case, glowing runes, hellish |

Alternative: rename the existing 5 files in code (touring → cassette, etc.). Cheaper but less themed.

---

## PRIORITY 7 — RECRUIT PACK (1)

**Path:** `public/vestibule/packs/recruit.png`
**Size:** 256×384px

Sealed envelope with band silhouette behind it, "AUDITION" stamped on front.

---

## PRIORITY 8 — CARD BACK (1)

**Path:** `public/vestibule/cardback.png`
**Size:** 256×384px (renders at draw pile and pack opening)

Inverted pentagram, "VESTIBULE" wordmark, dark with gold/red accents. Players see this every single hand — it's the style anchor for the whole game.

---

## PRIORITY 9 — DECK COVERS (5)

**Path:** `public/vestibule/decks/{id}.png`
**Size:** 384×512px (renders ~280×360 on deck-select screen)
**Status:** Folder is empty.

| ID | Direction |
|---|---|
| `standard` | Electric guitar in single spotlight, clean, balanced |
| `shredder` | Flying V on fire, lightning, speed lines, aggro |
| `ritualist` | Guitar on stone altar, black candles, occult |
| `engineer` | Mechanical guitar made of gears and circuit traces |
| `survivor` | Battered cracked guitar held together with duct tape |

---

## PRIORITY 10 — APP ICON (1)

**Path:** `public/vestibule/icon.png`
**Size:** 512×512 (also drop 256×256 and 128×128 alongside for OS scaling)

Stylized "V" as inverted pentagram, blood red on black. Must read at 32px on a taskbar.

---

## PRIORITY 11 — STEAM CAPSULES (for store page)

| Asset | Size | Notes |
|---|---|---|
| Header capsule | 460×215 | Logo + key art crop, hero element |
| Small capsule | 231×87 | Just the wordmark, must read tiny |
| Large capsule | 467×181 | Wider hero variant |
| Hero graphic | 3840×1240 | Banner for store header |
| Logo (transparent) | 1280×720 | For overlays |
| Screenshots (5+) | 1920×1080 each | In-game moments: combo, shop, boss reveal, score, deck building |

---

## PRIORITY 12 — DAMAGE SPLASH FX (7 tiers)

**Path:** `public/vestibule/fx/{tier}.webm`
**Size:** 1920×1080
**Format:** WebM (VP9 codec, opaque, **black background** — black disappears in-game via `mix-blend-mode: screen`)
**Duration:** 0.5-3s per tier
**FPS:** 30 or 60
**Status:** `fx/` folder is empty — code is wired, just drop files in.

| Tier | Trigger | Duration | Direction |
|---|---|---|---|
| `solid` | 50+ dmg | 0.5-1s | Single ember floats up, faint pulse ring. Candle flicker. |
| `heavy` | 200+ dmg | 0.8-1.2s | Quick orange spark burst, small shockwave ring. Match-strike. |
| `critical` | 500+ dmg | 1-1.5s | Red/orange flash, sparks outward, edges glow red, light cracks radiating. Anvil hammer. |
| `massive` | 1,000+ dmg | 1.5-2s | Center explosion, fire particles, lightning arcs, debris falling. Pyrotechnics. |
| `devastating` | 2,500+ dmg | 2-2.5s | Massive shockwave, screen cracks like glass with light pouring through, purple/red vortex. Stage collapsing. |
| `ultra` | 5,000+ dmg | 2-3s | Full eruption, white-hot center, pentagram sigils burning at edges, energy beams to corners, color cycle red→gold→white. Nuclear at a Sabbath show. |
| `godlike` | 10,000+ dmg | 2.5-3s | White flash → kaleidoscope, fractals, sacred geometry, inverted pentagram center, ⛧ symbols rain like Matrix code. DMT trip at the gates of Hell. |

### After Effects workflow

1. New comp: 1920×1080, black background
2. Design effect (particles, light rays, etc.)
3. Export → Media Encoder → WebM, VP9 codec
4. If AE can't WebM, export ProRes 4444 then convert with FFmpeg:
   ```
   ffmpeg -i input.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M output.webm
   ```
5. Drop in `public/vestibule/fx/`
6. Test in-game — black should disappear, effect composites over gameplay

---

## CUT SCENES (TODO 6)

See **TODO.md Priority 6** for the full list of cut scenes (intro, Welcome to Hell, 9 circle entries, 27 boss reveals, Lucifer reveal, victory, 3 death stings) with sizes and direction notes.

All cut scenes target **1920×1080**, **24-30fps**, **5-15 seconds**, exported as WebM (VP9) or MP4. Same AE workflow as above.

---

## ASSETS THAT EXIST

For reference — what's already done so we don't redo:

- ✅ **76 of 82 cards** have real PixelLab pixel art (only the 6 above remain)
- ✅ **18 band members** — stage portraits + idle GIFs (`public/members/{id}_stage.png` + `public/members/idle/{id}_stage_idle.gif`)
- ✅ **28 boss portraits** (`public/bosses/{id}.png`)
- ✅ **Sly the Fence** — animated GIF at `public/sly.gif`
- ✅ **Vestibule logo** — `public/vestibule_logo.png`
- ✅ **5 boss-loot art** files (audit needed for newer loot items)
- ✅ **23 pact files** (audit needed for procedural placeholders)

---

## FILE NAMING CONVENTIONS

- Always lowercase, snake_case
- PNG with transparency
- Match the in-code `id` exactly — code looks up by id
- No spaces, no special characters
- 128×128 default for icons, 256×384 for cards/packs, 384×512 for deck covers, 1920×1080 for fullscreen FX/cutscenes

---

## QUICK WINS BY ROI

If JV has 3 hours to spend on art, here's the order:

1. **6 missing card arts** (1 hour with PixelLab) — closes the visible gap, every shop pull is now fully arted
2. **5 booster pack arts** (1 hour) — fixes the cassette/cdr/vinyl mismatch, packs are a high-dopamine moment
3. **Card back** (30 min) — players see this every hand
4. **App icon** (30 min) — needed for any build that ships

Everything else is "nice to have" before launch. Steam capsules and cutscenes can wait until pre-launch.
