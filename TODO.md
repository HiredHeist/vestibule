# Vestibule — Master TODO & Design Reference
*Last updated: Friday, March 20, 2026 at 06:10 PM*

---

## 🔥 THE VISION
1,000,000 copies at $6.66 on Steam — Week 1.
YouTubers and streamers will push it because it is genuinely unique.
This is happening.

---

## P1 — NEXT

### 1. Simulator Fix & Run
- [ ] Fix Soundcheck temp buff in sim: origAtk on injured members reverts end-of-strike
- [ ] Fix genShop() in sim: always guarantee recruitment pack (Garage Band 10, Touring 22, Demonic 40)
- [ ] Run 3 x 1M simulations: Expert base, Beginner base, Expert with tiers
- [ ] Generate 4 balance reports + comparison

---

## P2 — BEFORE DEMO

### Known bugs still to fix
- [ ] Any remaining issues from playtest (player had more bugs but couldn't remember them all)
- [ ] Full playthrough stress test — no crashes start to finish
- [ ] Too Stoned / member death clarity
- [ ] Sim AI needs improvement — currently dies at Circle 4 despite player clearing it manually

### Ready to run sim when:
- [ ] Player finishes playtesting and confirms no more critical bugs
- [ ] Sim scaled to 200k runs (not 1M) for faster iteration

---

## P3 — FUTURE
- [ ] A11-A20 unlockable artifacts
- [ ] P11-P20 unlockable passives
- [ ] Collection/unlock screen
- [ ] Daily challenge leaderboard
- [ ] Settings menu
- [ ] Steam / mobile / PS release prep
- [ ] A&R Rep bonus stage — second album demand after beating Lucifer

---

## RULE: Update this file every single push, no exceptions.

---

## ✅ COMPLETED

### Balance Fix — Circle 1-2 Stash Rewards
- ~~**Stash rewards C1**: 2-4st → 5-8st (players can now recruit 3rd member before Drifter)~~
- ~~**Stash rewards C2**: 4-6st → 7-10st~~
- ~~**Result**: C4 survival rate 31% → 59% in sim, Drifter deaths 20% → 10%~~



### Session 10 continued
- ~~**Hand hard-cap removed** — hand CAN exceed 6 if draw cards allow, display shows ⚡ when over base~~
- ~~**Expert AI completely rewritten** — human-level combo awareness: Amp+Encore chains, DoubleDown+Overdrive, CrowdSurf first, buffer stacking, ember management~~
- ~~**Sim card scores fixed** — CrowdSurf, SoundWall, HeavyRiff no longer undervalued by 0.3x multiplier~~



### Session 10 — March 21 2026
- ~~**Resonance auto-discard bug** — duplicate cards now play independently; Resonance only fires with Resonance Coil artifact (a9)~~
- ~~**Recruit screen duplicates** — alreadyOn check removed, all duplicates allowed except DOUBLE TIME~~
- ~~**leftBought.rec initialized** — recruit pack sold state now persists correctly~~
- ~~**Recruit pack circle-gated** — Circles 1-2: Garage Band only; C3-4: Garage/Touring; C5+: all packs~~
- ~~**Hand hard-capped at 6** — excess cards return to deck, no over-soft-cap rendering bugs~~



### Session 10 — March 21 2026 (today)
- ~~**Duplicate card hover bug fixed** — Resonance auto-discard only fires with Resonance Coil artifact (a9), not by default~~
- ~~**Recruit screen duplicates allowed** — removed alreadyOn block, all duplicates allowed except DOUBLE TIME~~
- ~~**leftBought.rec initialized correctly** — recruit pack sold state now persists properly~~
- ~~**Sim bugs fixed** — Soundcheck origAtk + genShop always has recruit pack~~
- ~~**Simulator ran** — 0%% win rate, Circle 4 wall identified (Miser 360HP too high for band scaling)~~

 — Session 9 (March 20-21 2026)

### End Screen
- ~~**Shift+D dev shortcut** — instant death screen from any screen~~
- ~~**"The band ran out of herb." 200% bigger, bright green glow**~~
- ~~**Run Statistics box 150% larger** — MBScribblesFont, easy to read~~

### Battle Screen
- ~~**HandCard ability text** — MBScribblesFont everywhere~~
- ~~**Circle/fight header** — bold, bright orange-red, triple glow~~
- ~~**Boss HP right-justified** — after name, 20% bigger, pulsing red when low~~
- ~~**Boss passive text 50% bigger**~~
- ~~**Combined attack text** — matches number size, glowing gold~~
- ~~**Artifact slot placeholders** — big ⛧ pentagram emoji~~
- ~~**Hover z-index fix** — only hovered card lifts, no duplicate rising~~

### Shop Screen
- ~~**Left column cards** — emoji 72px, name 20px, desc 16px, all MBScribblesFont~~
- ~~**Recruit pack sold once per visit** — SOLD! stamp, exploit fixed~~
- ~~**Booster pack desc** — MBScribblesFont, readable~~
- ~~**Pawn shop text** — bright purple #cc88ff, all readable~~
- ~~**Pawn shop pixel-perfect alignment** — paddingTop:24 matches booster packs~~
- ~~**Shop layout** — flex gap scales with window, rows stack correctly~~
- ~~**Row gap** — flex:1 spacer pushes bottom row to align with left column~~
- ~~**Hellquake splash 5 seconds** — was 2s, now readable~~

### Opening Night Screen
- ~~**Opening Night title** — Break Gothic, 88px, 20px letter spacing, glowing~~
- ~~**Subtitle** — 50% bigger, readable gold~~
- ~~**Member names** — 2px letter spacing~~
- ~~**Ability description font** — MBScribblesFont to match keyword labels~~
- ~~**Seed/subtitle colors** — bright #e8d090, visible on black~~

### Fonts (all local, in public/fonts/)
- ~~**4 fonts deployed**: Bogarts Metal (titles/names), Scratch (flavour text), MBScribbles (all UI), Break Gothic (key screen titles)~~
- ~~**CSS @font-face system** — no more Google Fonts dependency~~

### Gameplay Fixes
- ~~**Duplicate members allowed** — all except second DOUBLE TIME drummer~~
- ~~**Two drummers re-roll** — d6 re-rolls on 1-2 if two drummers on stage~~
- ~~**Recruit pack sold bug** — && chain fixed, setLeftBought now fires correctly~~
- ~~**Black screen crash** — dblRoll removed from RecruitScreen~~
- ~~**Pawn shop exploit** — button disabled at 0 sales, counter reset removed~~
- ~~**Demo Tape** — inline replay, hover shows queued card, persists across strikes~~
- ~~**All dead cards confirmed** — Setlist, Remaster, Hellquake all working~~
- ~~**All keyword passives confirmed** — FRENZIED, ANCHOR, CORRUPT, DEBUFF~~

### Previously Completed (Sessions 1-8)
- ~~Full card set, all artifacts, all passives~~
- ~~27 fights, 9 circles, all enemy passives~~
- ~~Mentor Link system (foil/mythic/demonic tiers, bonds, auras, demonic conflict)~~
- ~~Pawn shop full sell modal~~
- ~~Opening Night, band synergy, DOUBLE TIME, Too Stoned~~
- ~~Stage drag-and-drop~~
- ~~Booster + recruitment pack system~~

---

## Dev Shortcuts
- **Shift+S** — jump to shop with 69 stash
- **Shift+D** — jump to death/end screen

## Game Constants
- MAX_STRIKES: 4 | MAX_DISCARDS: 4 | HAND_SIZE: 6 | MAX_STASH: 420 | MAX_EMBERS_CAP: 8
- Starting embers: 5 | Starting stash: 0 | Fights: 27 (index 0-26)
- Circle boss every 3rd fight — +1 max ember permanently
- 420 is sacred. Never change card height.

## Enemy HP Scaling
Wanderer 27 > Lost Soul 42 > Drifter 69 > Siren 60 > Seducer 140 > Glutton 80 > Devourer 160
> Miser 360 > Usurer 680 > Wrathful 800 > Warlord 1520 > Heretic 1650 > False Prophet 3000
> Brute 3000 > Executioner 5500 > Archfraud 9600 > Betrayer 11400 > LUCIFER 420,666

## Shop System
**Card Booster Packs:** Cassette 6st(C1) / CD-R 12st(C1) / Import Vinyl 22st(C2) / Rare Vinyl 38st(C4) / Cursed Demo 60st(C6)
**Recruitment Pack (always left column):** Garage Band 10st / Touring 22st / Demonic Pack 40st

## Repo
- github.com/HiredHeist/vestibule (private)
- PAT: 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 (expires Jun 2026)
- Dev shortcuts: Shift+S = shop 69 stash | Shift+D = death screen
- Stable tag: v0.9-pre-megapush
