# VESTIBULE — 800k Simulation Report + Addictiveness Roadmap
*Generated: Saturday, March 21, 2026 at 12:04 PM | 4 × 200k runs = 800,000 games | All results consistent across batches*

---

## RAW DATA SUMMARY

| Metric | Value |
|--------|-------|
| Total games | 800,000 |
| Lucifer wins | 0 (0.000%) |
| Avg fight reached | 8.13 / 26 |
| C1 deaths | 7.6% |
| C2 deaths | 13.8% |
| C3 deaths | 5.3% |
| C4 deaths | **73.4%** ← primary wall |
| C5+ deaths | 0% (nobody gets there) |

### Survival Curve
- F02 The Drifter: **92.4% survive** ✅ healthy
- F05 The Seducer: **78.7% survive** ✅ healthy  
- F08 The Devourer: **73.4% survive** ✅ healthy
- F09 The Miser: **32.0% survive** ⚠️ hard wall (good)
- F10 The Hoarder: **0.0% survive** 🚨 instant death wall — nobody gets past it

### Starting Pair Dominance
FRENZIED+FRENZIED appears 42k-43k times per 200k = **21% of all games** — most picked pair by far.
Nobody wins regardless of starting pair.

---

## PRIORITY LIST — FIXES & IMPROVEMENTS

### 🔴 P1 — CRITICAL (breaks the game loop)

**1. The Hoarder is an instant death wall**
Nobody survives F10 (The Hoarder, 480 HP). Even the best runs that kill Miser (260 HP) have 0% survival here.
The Hoarder jumps from 260 (Miser) to 480 — a 1.85× increase with no shops between them.
*Fix: Reduce Hoarder to 340 HP. Keep the pressure but make it beatable.*

**2. Nobody reaches Circle 5. Ever.**
73.4% die at Greed (C4). The remaining 26.6% immediately die at Hoarder.
This means Wrath, Heresy, Violence, Fraud, Treachery — ALL 5 circles — are completely unplayed.
Half the game is invisible. Players will never see Wrathful, Berserker, Warlord, or anything after.
*Fix: Scale down C4 enemy HP more aggressively. Miser 260 is right. Hoarder 340. Usurer 480.*

**3. The Seducer selfbuff passive is punishing**
F05 drops survival from 78.7% to 73.4% — a 5.3% death spike. The Seducer gains +2 ATK per strike.
By strike 4 it does 6+6+2+2+2+2 = brutal damage to low-HP members. 
*Fix: selfbuff2 passive could gain +1 per strike instead of +2. Or give Seducer fewer HP.*

---

### 🟡 P2 — HIGH IMPACT (makes game more addictive)

**4. Add a run summary "score" on the death screen**
Right now you die and see stats. You need a SCORE — a single number players can chase.
Formula: (fightsBeaten × 100) + (totalDamage ÷ 10) + (stashEarned × 2) + (highestStrike × 5) + (corruption × 3)
This creates a leaderboard number. Players will obsess over beating their score.

**5. FRENZIED is too dominant — needs competition**
21% of all games start FRENZIED+FRENZIED. The gap between good and bad starting pairs is massive.
ANCHOR+ANCHOR (avg fight 2.0) vs FRENZIED+FRENZIED (avg fight 8+).
Two fixes:
- Buff ANCHOR: heal 2HP to adjacent (not 1HP) per Strike — makes ANCHOR feel impactful early
- Buff DEBUFF: reduce boss damage by 3 (not 2) — currently underwhelming vs high-ATK pairs

**6. The corruption build is invisible**
HEXED and CORRUPT members exist but the corruption payoff (Overdrive, Feedback Loop) requires 60%+ corruption.
Most players never build to 60% corruption because they don't know the payoff is there.
*Fix: Add a visual corruption meter that shows "OVERDRIVE READY" at 60% — telegraphs the build clearly.*

**7. DOUBLE TIME feels weak**
DOUBLE TIME d6 roll: 1-2 = 0.5×, 3-4 = 1.5×, 5-6 = 2×. 
Expected value = (0.5+0.5+1.5+1.5+2+2)/6 = 1.33×. That's only 33% better than nothing on average.
Worse — rolling 1-2 actively hurts you. It's the most anxiety-inducing but least rewarding keyword.
*Fix: Make the floor 1× instead of 0.5×. Roll 1-2 = 1×, 3-4 = 1.5×, 5-6 = 2.5×. More exciting, still high variance.*

---

### 🟢 P3 — ADDICTIVENESS FEATURES (makes people come back)

**8. Daily Challenge with global leaderboard**
Same seed for everyone, same 8 Opening Night members, compete for highest score worldwide.
This is the single biggest retention feature you can add. Creates daily habit.
Shows "You reached C4, top 12% today" — players check every day to see the percentage.

**9. "Comeback mechanic" — The Last Riff**
When ALL members are Too Stoned, before the run ends, trigger a dramatic "LAST RIFF" moment:
- Player gets 3 cards, 10 embers, one free strike to try to kill the boss
- If they win: "MIRACLE COMEBACK" achievement, run continues with 1 member revived at 1 HP
- If they lose: normal death screen but with "You almost had it" message
This turns certain-death moments into the most memorable moments of any run.

**10. Unlockable starting members**
Currently all 16 members are available from game start. Make 8 of them locked, unlocked by:
- Beat Circle 1 for first time → unlock Sigrid
- Beat Circle 2 → unlock Gunnar  
- Reach 1000 total damage across all runs → unlock Orm
- etc.
This creates progression that keeps players coming back for runs specifically to unlock things.

**11. "The Black Market" — secret shop**
Rare chance (15%) after beating a circle boss: a mysterious shop appears with 1-2 game-breaking items:
- Cursed Amp: +5 ATK to all members BUT +30% corruption permanently
- Soul Contract: one member goes DEMONIC for free but loses 3 HP permanently
- Stolen Setlist: add 3 copies of any card currently in your deck
High risk, high reward. Creates wild stories players share.

**12. Achievement popups mid-run**
Flash achievements DURING the run, not just at the end:
- "SHREDDER" — deal 100+ damage in a single strike
- "PURE HERB" — win a fight without any member taking damage
- "CORRUPTION KING" — reach 100% corruption and survive
- "FULL HOUSE" — have all 5 stage slots filled
Each one gives +5 stash reward. Small enough to not break balance, big enough to chase.

**13. Band name generator**
At Opening Night, randomly generate a band name based on selected members' keywords.
FRENZIED+ANCHOR = "Anchor of Rage" / "The Frenzy Foundation"
CORRUPT+HEXED = "Cursed Signal" / "Hexed Decay"
Display the band name throughout the run. Shows on death screen. Shareable.
People LOVE this — it creates identity for each run.

**14. Visual HP portraits**
Member cards currently show a music note emoji. At 50% HP: portrait gets a crack.
At 25% HP: portrait glows red. Makes member health viscerally readable at a glance.
Adds tension without any gameplay change.

**15. "Encore" meta-screen between circles**
After beating a circle boss, before the shop, show a brief "CIRCLE I COMPLETE" cinematic moment:
- Show the circle name + a one-liner flavor text ("Limbo broken. The damned make way.")
- Show which members leveled up (FRENZIED +1 ATK display)
- 2-second pause then into shop
This rewards the player psychologically for each circle cleared. Milestones feel earned.

---

## BALANCE NUMBERS — RECOMMENDED FIXES

Current vs Recommended HP:

| Enemy | Current | Recommended | Reason |
|-------|---------|-------------|--------|
| Miser | 260 | 260 ✅ | Already fixed, 32% survival |
| Hoarder | 480 | 340 | 0% survival — instant wall |
| Usurer | 680 | 480 | Nobody reaches it anyway |
| Wrathful | 800 | 560 | Scale down entire C5 |
| Warlord | 1520 | 900 | Too big a jump |

---

## THE ONE THING THAT WILL MAKE THIS GAME HIT

**Score + Daily Challenge + Unlocks.**

Right now the loop is: play → die → play again. That's not addiction, that's habit.
Addiction requires: play → die → see your score → see you were top 20% → check what unlocks at next milestone → play again immediately.

Slay the Spire has 1000+ hours played by its fans because every run has:
1. A score to beat
2. Something new potentially unlocking
3. A daily challenge to compare with others

Add those three things and you have the same addiction loop.

The bones of Vestibule are already excellent. The card design is smart, the metal theme is unique,
the corruption mechanic is genuinely interesting. The addiction layer is what's missing.
