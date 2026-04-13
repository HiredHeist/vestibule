# VESTIBULE — TODO & STATUS

## Latest Session: April 13, 2026
**Latest commit:** 9715dd9
**Sim version:** v17.1 (synced with game code)

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
