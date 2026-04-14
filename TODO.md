# VESTIBULE — TODO & STATUS

## Latest Session: April 14, 2026
**Latest commit:** 9715dd9
**Sim version:** v17.1 (synced with game code)

---

## SPRITE ASSETS — IN PROGRESS 🎨

### Global Prompt Prefix (prepend to ALL sprites)
`pixel art, [SIZE], neutral flat dungeon lighting, no strong light source, transparent background,`

### Export Rules
- Format: **PNG only** (never JPG — alpha channel)
- Tool: PixelLab (`pixellab.ai`) — enable "remove background" before export
- Style anchor: generate Bjorn first, use as reference for all remaining members

---

### Band Members — 96×96px (17 sprites)

| ID | Name | Role / Keyword | Status | Prompt (after global prefix) |
|----|------|----------------|--------|------------------------------|
| `bjorn` | Bjorn | Lead Guitarist / FRENZIED | [ ] | doom metal guitarist, wild long blonde hair, flying V guitar, leather jacket, snarling expression, frenzied energy |
| `ragnar` | Ragnar | Lead Guitarist / FRENZIED | [ ] | doom metal guitarist, braided red hair, Les Paul guitar, battle vest, calmer but intense |
| `thor` | Thor | Drummer / DOUBLE TIME | [ ] | doom metal drummer, massive arms, mohawk, double kick pedal visible, sweat, motion blur on sticks |
| `ingrid` | Ingrid | Bass Player / ANCHOR | [ ] | doom metal bassist, tall stoic woman, long dark hair, thick low-slung bass, rune tattoos |
| `loki` | Loki | Synth Player / CORRUPT | [ ] | dark synth player, gaunt pale face, glowing purple keys, corruption smoke wisping from hands, unsettling grin |
| `dag` | Dag | Bass Player / ANCHOR | [ ] | doom metal bassist, enormous bearded man, shoulder-width stance, massive bass guitar, immovable wall energy |
| `vitalik` | Vitalik | Dark Minstrel / FOLK MAGIC | [ ] | dark folk minstrel, wild unkempt hair, wooden flute, pagan charms hanging from neck, slightly unhinged smile |
| `sigrid` | Sigrid | Rhythm Guitarist / SHREDDER | [ ] | doom metal rhythm guitarist, sharp angular features, telecaster guitar, fast aggressive stance, picking hand blur |
| `gunnar` | Gunnar | Rhythm Guitarist / SHREDDER | [ ] | doom metal rhythm guitarist, stocky build, shaved head, SG guitar, confident swagger |
| `astrid` | Astrid | Vocalist / DEBUFF | [ ] | doom metal vocalist, dramatic stage presence, microphone raised, witchy black robes, voice crackling with dark energy |
| `freya` | Freya | Synth Player / CORRUPT | [ ] | dark synth player, ethereal woman, analog synth, dark frequencies visualized as distortion aura, ominous purple glow |
| `ulf` | Ulf | Bass Player / ANCHOR | [ ] | doom metal bassist, scarred muscular man, aggressive low stance, chunky bass guitar, anchor chain tattoo |
| `brynja` | Brynja | Bass Player / ANCHOR | [ ] | doom metal bassist, impossibly tall woman, stone-faced, downtuned 5-string bass, does not move |
| `rolf` | Rolf | Drummer / DOUBLE TIME | [ ] | doom metal drummer, wiry intense man, sparse kit, mechanical precision, thousand yard stare |
| `orm` | Orm | Dark Minstrel / HEXED | [ ] | cursed folk musician, hollow eyes, cursed lute, dark mist seeping from instrument, hexed runes on hands |
| `tanuki` | Tanuki | Bass Player / ANCHOR *(locked)* | [ ] | raccoon-dog yokai bassist, tanuki creature, heaviest bass guitar imaginable, Japanese folk meets doom metal |
| `lucifer_member` | Lucifer | The Devil / FALLEN *(locked)* | [ ] | the devil as band member, crown of thorns, burning wings folded, radiant yet decaying, tragic fallen presence |

### File placement: `public/members/{id}_stage.png` — register in `STAGE_PORTRAITS` object (~line 578)

---

### Bosses — 128×128px (28 sprites)

| ID | Name | Circle | Status | Prompt (after global prefix) |
|----|------|--------|--------|------------------------------|
| `wanderer` | The Wanderer | I — Limbo | [ ] | lost soul, translucent humanoid, empty eye sockets, shambling posture, grey fog wisps, melancholy |
| `lostsoul` | The Lost Soul | I — Limbo | [ ] | damned spirit, skeletal form, jaw unhinged in silent scream, hunger radiating outward, reaching hands |
| `drifter` | The Drifter | I — Limbo | [ ] | relentless specter, featureless dark silhouette, single glowing eye, aggressive forward lean |
| `siren` | The Siren | II — Lust | [ ] | demonic siren, flowing hair becomes waves, hypnotic gaze, scales on arms, beauty masking menace |
| `tempter` | The Tempter | II — Lust | [ ] | demon of temptation, seductive shadow form, golden chains around wrists, corrupted halo |
| `lust_boss` | The Seducer | II — Lust | [ ] | lust circle boss, tall powerful demon, crimson skin, commanding presence, damage aura pulsing |
| `glutton` | The Glutton | III — Gluttony | [ ] | bloated hunger demon, distended belly, endless mouth, constantly eating, disgusting vitality |
| `feaster` | The Feaster | III — Gluttony | [ ] | ravenous fiend, multiple mouths across body, jagged teeth, healing from every wound |
| `gluttony_boss` | The Devourer | III — Gluttony | [ ] | massive void creature, everything bends into gravitational hunger, blackhole mouth |
| `miser` | The Miser | IV — Greed | [ ] | greed demon, clutching stolen gold coins, sunken eyes, vault door as shield, hoarding posture |
| `hoarder` | The Hoarder | IV — Greed | [ ] | avaricious demon, buried in stolen treasures, multiple arms grabbing outward, paranoid eyes |
| `greed_boss` | The Usurer | IV — Greed | [ ] | demonic banker in torn suit, debt ledger as weapon, golden crown of thorns, 666 in eyes |
| `wrathful` | The Wrathful | V — Anger | [ ] | rage demon, veins glowing red, fists raised, volcanic heat haze |
| `berserker` | The Berserker | V — Anger | [ ] | berserk demon warrior, shattered armor, eyes white with fury, wrath chains broken |
| `anger_boss` | The Warlord | V — Anger | [ ] | anger circle boss, massive demon general, strategy abandoned for pure rage, war-scarred |
| `heretic` | The Heretic | VI — Heresy | [ ] | heresy demon, inverted religious symbols, corruption smoke pouring from mouth, blasphemy made flesh |
| `apostate` | The Apostate | VI — Heresy | [ ] | fallen believer demon, burned scripture, eyes replaced by void, corrupting touch |
| `heresy_boss` | The False Prophet | VI — Heresy | [ ] | preaching demon, toxic doctrine dripping from tongue, false halo, corrupted congregation behind |
| `brute` | The Brute | VII — Violence | [ ] | calculating violence demon, cold eyes, massive clawed hands, surgical aggression |
| `hunter` | The Hunter | VII — Violence | [ ] | predatory demon, crouched stalker pose, glowing tracking eyes, prey already marked |
| `violence_boss` | The Executioner | VII — Violence | [ ] | demon executioner, enormous axe, methodical stance, sentence already written |
| `trickster` | The Trickster | VIII — Fraud | [ ] | fraud demon, jester mask, cards in hand that vanish, deceptive shimmer, laughing |
| `deceiver` | The Deceiver | VIII — Fraud | [ ] | manipulative demon, two faces, strings attached to puppet hands, your deck is its plaything |
| `fraud_boss` | The Archfraud | VIII — Fraud | [ ] | master illusionist demon, mirror shards orbiting body, nothing is real |
| `traitor` | The Traitor | IX — Treachery | [ ] | paranoia demon, backstabber form, knives in back, your band's silhouettes behind it |
| `betrayer` | The Betrayer | IX — Treachery | [ ] | soul thief demon, stolen strength visible as glowing auras, hollow mirror of your band |
| `lucifer` | Lucifer | IX — Final Boss | [ ] | satan final boss — Phase 1: regal fallen angel, cracked crown, contemptuous; Phase 2: Lord of the Flies, insect swarm, infernal throne |
| `ar_exec` | The Executive | Special | [ ] | A&R demon in business suit, contract in one hand, soul in other, empty smile, the real devil wears Armani |

### File placement: `public/bosses/{id}.png` — wire into `BossSection` component (~line 1813), replace the 90px emoji div

---

## COMPLETED THIS SESSION

### Tutorial System ✅
- [x] 3 scripted tutorial fights with predetermined hands
- [x] Fight 1: Cards, embers, Strike (corruption hidden)
- [x] Fight 2: Corruption + danger (thermometer appears)
- [x] Fight 3: Ember management + DEATH WISH chain combo
- [x] Tooltip overlay system (modal, one tip at a time)
- [x] Main menu: Start Tutorial / Skip Tutorial buttons
- [x] Tutorial Complete screen → back to real game
- [x] Loss during tutorial → auto-restart current fight
- [x] Progressive UI hiding (corruption/genres hidden until relevant)
- [x] First-encounter contextual tips (pacts, shop, events, descent)

### 5 QoL UI Improvements ✅
- [x] #4: Gray borders + dim on unaffordable cards
- [x] #5: Hide corruption thermometer when corruption = 0%
- [x] #9: Gold glow + CHAIN badge on playable chain pairs
- [x] #12: Skip strike animation for 0 ATK members
- [x] #16: Dim unaffordable shop items to 40% opacity

---

## COMPLETED — Previous Sessions

### Combat Animations (Session 18)
- [x] Dramatic 2s per-member strike animation
- [x] Boss emoji projectile attack (correct targeting)
- [x] Card fly-and-shrink animation on play
- [x] Per-member HP drain during strikes
- [x] HP bar uses scaledMaxHp (drains from first hit)
- [x] Dice roll removed from boss attack
- [x] Sound timing fixed (ATK_SND + playHit at IMPACT only)

### Visual Polish (Session 17-18)
- [x] CRT Scanlines + VHS Effect (toggleable)
- [x] Vertical corruption thermometer
- [x] Genre activation visual banner
- [x] Upgrade indicator (gold pentagram)
- [x] Chain hints on hover (toggleable)
- [x] Mastery progress + Trophy progress on end screen
- [x] Rules screen (35 entries)
- [x] Options menu cleanup (7 toggles, all functional)

### Balance (Session 18)
- [x] Full stake rebalance (Bronze 8.7% → Demonic 0.9%)
- [x] Sim v17.1 synced with game code
- [x] Only 1 locked member in Opening Night

---

## IN PROGRESS / NEEDS TESTING
- [ ] Tutorial flow: needs full playtesting pass for edge cases
- [ ] First-encounter tips: verify they fire at the right moments
- [ ] Chain highlight: verify it doesn't create visual noise with many chains

---

## REMAINING TODO

### High Priority
- [ ] Corruption thermometer tuning (player feedback)
- [ ] Event choice audit — Sabbath Offering useless on low stakes
- [ ] Early game pacing — Circles I-IV are too safe (2.1% of deaths)

### Card Balance (from Deep Audit)
- [ ] Buff Dial to Eleven: +3 ATK (was +2)
- [ ] Buff Setlist: reduce to 1 Ember (was 2)
- [ ] Buff Smoke Break: add "Draw 1 card"
- [ ] Rework Record Deal: sacrifice HP, not the whole member
- [ ] Buff CORRUPT keyword: +1 ATK per 12% (was 15%)
- [ ] Fix Sabbath Offering event (rework reward)

### UX Ideas to Consider (from brainstorm list)
- [ ] Collapse stats footer into expandable tray
- [ ] Fade out idle/unbuffed members during card phase
- [ ] Simplify boss info box (details behind hover)
- [ ] Delay genre banner until 40%+ threshold
- [ ] Show chain hints only after first chain discovered
- [ ] Progressive rules screen (show only encountered rules)
- [ ] Auto-highlight playable combos with connecting line
- [ ] Card type grouping toggle in pause menu
- [ ] Quick-play (tap card then tap member, no drag needed)
- [ ] Combine damage breakdown with strike animation
- [ ] "Hold to speed up" on Strike button
- [ ] Highlight "best value" shop items
- [ ] Compact tabbed shop layout
- [ ] Run summary toast on death
- [ ] "What killed you" highlight on death screen
- [ ] Persistent "best run" marker on descent map
- [ ] Show boss HP as fraction ("52/60 HP")
- [ ] Corruption deck — corruption-only cards at thresholds

---

## WIN RATES (10K each, Sim v17.1)
| Stake | Win Rate | Avg Fight |
|-------|----------|-----------|
| Bronze | 8.45% | 19.87/26 |
| Silver | 7.14% | 17.49/26 |
| Gold | 6.72% | 16.89/26 |
| Obsidian | 3.90% | 14.76/26 |
| Blood | 1.84% | 8.45/26 |
| Demonic | 0.87% | 2.65/26 |
