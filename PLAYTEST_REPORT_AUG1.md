# VESTIBULE — Overnight Playtest Report (Aug 1, 2026)

**Session:** 6h 0m on build `6b342fd` (Balatro curve + Lucifer fixes) · ~8 runs · 1 full clear
**Verdict in one line:** the new curve works — the early game finally kills people and mid/late fights hit the 2–3 strike target — but a phantom-victory bug is still handing out free wins at fight 26+, and the bot spent 5.4 of the 6 hours stuck on the Collection screen after credits.

---

## 1 · WHAT ACTUALLY HAPPENED

**Timeline:** 34 minutes of real play (01:39–02:13), then 5.4 hours stuck post-credits.

- **7 runs died in Circle 1** (12 minutes of attempts). Every death: "Stoned to the Bone." Lost Soul (206 HP) and Drifter (533 HP) are the new walls. One death was 114 HP short — the "SO CLOSE" screen is doing its job.
- **Run 8 broke through** with the right draft (Bjorn FRENZIED carry + Vitalik FOLK MAGIC) plus Iron Strings and Clean Living pacts — then cleared the whole game in 21 minutes.
- The winning run beat Lucifer (correct 333,333/333,333 phase 1 — the HP fix works) and the secret Executive fight… **but both died to the phantom-victory bug, not to damage** (details in §3).
- Zero crashes in 6 hours — both RENDER ERROR fixes held.

**Fight texture by act (strikes to kill, from the ledger):**

| Act | Fights | Strikes/kill | Verdict |
|---|---|---|---|
| Circle 1 | Wanderer 84 → Drifter 533 | 2–4 → 5–18 | Wanderer perfect; Lost Soul/Drifter grindy (see §2) |
| Circles 2–3 | 587 → 11,918 | 2–9 | Good — real fights with real decisions |
| Circles 4–6 | 2,938 → 27,195 | 2–3 | On target |
| Circles 7–9 | 23,085 → 135,056 | 2–3 | On target |
| Lucifer | 333,333 ×2 phases | phantom-killed | untested for real |

**Economy & systems observed working:** hand rhythm (refill only at strike) ✓ · embers drain and stay drained ✓ · trips as panic buttons (35 uses, bought shrooms/acid ~10×) ✓ · pacts/forge/events firing ✓ · the new "keep current band" logic declined 6 bad replacements (kept ATK-88–103 Bjorn over fresh ATK-4 recruits) ✓ · dupe-member strategy active per your ruling ✓.

---

## 2 · TUNING — MAKING IT PROGRESSIVE AND SMOOTH

The curve's shape is right. Three specific rough edges:

**A. The Circle-1 death slog.** Deaths are correct in *number* (C1 should filter weak drafts) but wrong in *feel*: a doomed run spends 8–14 strikes chip-damaging with 0 embers (17–56 damage swings vs 130+ HP remaining) before overtime finally kills it. A player knows they're dead 2 minutes before the game agrees.
*Fix:* trim Lost Soul/Drifter ~12% (111→98, 288→253) **and** give overtime more teeth early — bosses with base damage 2–3 take too long to close the kill even at ×8/×16. Add a flat +2 damage per overtime strike under the multiplier. Doomed runs end ~3 overtime strikes sooner; winnable runs are untouched. I'll sim-validate before shipping.

**B. Ember starvation is binary.** Strike 1 is an 8-ember festival; strikes 2–4 are 0-ember dead air unless you drafted ember cards. That's the skill system working — but a *pity trickle* (end a strike at exactly 0 embers → +1 ember next strike, once per fight) removes only the dead-air case while keeping scarcity as the core puzzle. Folk Magic stays the premium version.

**C. Late-game snowball still compresses.** By C7 the carry hits 16k previews and fights flatten to the same 2–3 strike shape. Acceptable now, but the *variety* is gone — every late fight is the same fight. The boss-mechanics ideas in §4 (telegraphs, phases, gimmicks) matter more than more HP tuning here.

---

## 3 · BUGS & CONFLICTS

1. **🔴 PHANTOM VICTORY (open — trap is set).** Lucifer phase 1 died from ~331k HP in seconds; phase 2 lost 254,363 HP to *nothing* (0 cards played) and "won" at 76,093 HP. The Executive fell at 85,298/89,700. Every game-clear stat after fight 26 is polluted until this dies. `triggerVictory` now logs its caller's stack trace, and the bot pipes the game console into the ledger — **the next run you upload will name the culprit in a `game_console` event.**
2. **🟡 Bot: 5.4-hour Collection stall (fixed).** After credits the game lands on the Collection screen; the bot had no handler and burned the night. Now classified and escaped.
3. **🟡 Bot: zero relic/pedal purchases in 6 hours.** 51× "tile not in clickables" skips. Either the shop tiles moved out of the bot's sight or relics are economically dominated by member packs. If a smart player *never* buys relics, relic pricing needs a look too (see idea #9).
4. **🟢 Verified fixed this session:** both RENDER ERROR crashes, Lucifer's 185k spawn, card duplication, always-refill, shop hang, Heat contamination.
5. **🟢 Noise (harmless):** bot double-logs event choices, occasionally strikes a dead boss, "no members parsed" during transitions.

---

## 4 · 20 IDEAS — MORE ADDICTING, MORE FUN

Ordered roughly by impact-per-effort. Each ties to something observed in the data or already half-built in your codebase.

**Tension & moment-to-moment feel**

1. **Boss intent telegraphs (StS-style).** You already show "NEXT: 7 DMG" — extend it to *mechanics*: "☠ next strike: AoE," "enraging in 2." Skill in a deckbuilder is planning against known threats; hidden mechanics read as randomness. Cheapest depth you can buy.
2. **Overtime as theater.** It's your best invention and it's invisible — a counter that says ×2. Give it a rising enrage meter, screen edges burning, music layer added per overtime strike. The ledger shows players living in overtime constantly early — that should *feel* like a doom-metal breakdown, not a spreadsheet state.
3. **Audio escalation tied to multiplier.** Layered stems: chain fires → guitar layer; mult over ×4 → drums double-time; big kill → full stop then crash. Balatro's dopamine is 50% audio. You have the sfx hooks (`big_hit`, `playEmber`) already.
4. **Kill-screen slow-mo.** On a lethal strike, 300ms hitstop + zoom on the final number before the cascade slams. The 20k-damage moments in this ledger deserved a spotlight; right now victory just... happens.
5. **"Dead Man's Hand" comeback rule.** Last member standing gets +50% ATK and a visual halo. You already flash SOLO VICTORY when it happens — make it mechanical. Near-death comebacks are the runs players tell friends about, and right now all-but-dead is just a slow loss.

**Decisions & build depth**

6. **Boss loot: pick 1 of 2.** Boss loot is currently fixed per boss. Every peak moment should be a decision — that's the whole roguelite loop. You already do this for pacts; extend it.
7. **Pity ember (from §2B).** End a strike at 0 embers → +1 next strike, once per fight. Kills dead-air turns, preserves scarcity.
8. **Ember Overflow.** Unspent embers at fight end → +1 stash each. Creates a real decision ("dump everything into strike 1 vs bank 2 for the shop") where currently dumping is always right. Data: the winning run ended most fights with 3–8 embers wasted.
9. **Relic economy rework.** Make each circle boss drop a *free* pick-1-of-2 relic, and shop relics rarer but stronger. The data says relics lose to member packs at current prices every single time — a whole system going unused. (Also fixes bot bug #3 from the other side.)
10. **Circle Contracts (mini-quests).** At each descent, an optional bounty: "beat this circle's boss without discarding → +25 stash / rare card." Quest-layer dopamine, and it teaches advanced play patterns. Your descent screen already has the reward-choice UI to host it.

**Meta-progression & the "one more run" loop**

11. **Retry Same Seed button on the death screen.** You already show the seed and have Copy Seed. One click → same seed, fresh run. "That was winnable, let me prove it" is the strongest one-more-run trigger that exists, and it costs a button.
12. **Unlock track visibility.** The death screen shows "86,147/100,000 → Lucifer Playable" — this is great and buried. Put next-unlock progress on the main menu and flash +progress at run end. Near-miss progress bars are slot-machine psychology, in the good way.
13. **Achievement drip with progress toasts.** 5/17 achievements after 44 runs means they're invisible. Show "Chain Collector 9/16" toasts when you advance one. Collections want *visible* partial progress — that's what makes 38/74 discovered itch.
14. **Daily seed with a ghost.** DAILY exists. Add yesterday's score ghost and a 3-tier medal (bronze/silver/gold thresholds). No server needed — medals are local, but they turn the daily into a ritual.
15. **Weekly mutator rotation.** MODIFIER_CONTENT.md already defines discovered-through-play modifiers. Surface one per week as the "Cursed Setlist" — rotating rule-benders (all CORRUPT cost 0; bosses have +1 strike; hand size 4) keep week 6 feeling like week 1.
16. **Run poster on SHARE.** The SHARE button exists — make it render a polaroid: band lineup, final score, deepest circle, killing blow, seed. People share images, not clipboard text. This is free marketing forever.

**Band identity & collection**

17. **Aura/effective-ATK chips on member cards.** Cards show base ATK while the breakdown uses effective ATK — you flagged this confusion yourself in playtest. Show "4 (+3)" with the aura glow. Understanding *why* the number is big IS the buildcraft satisfaction.
18. **Member level-ups (Foil path in-run).** Members already grow perm-ATK invisibly (Bjorn hit ATK 103 this run). Formalize it: at +10 perm ATK a member "goes Foil" with a visual upgrade and flavor line. Watching your drummer become a legend across one run is an attachment machine — and it makes the "keep current band vs new recruit" decision legible.
19. **Twin synergy (your dupe ruling, weaponized).** Two copies of the same musician get a named bond — "TWIN RIFF: +2 ATK each, chains involving them fire twice." You ruled dupes are strategy; give the strategy a payoff players can chase on purpose.
20. **Post-Lucifer Encore ladder.** Encore mode exists; Heat exists. Chain them into a visible ladder — beat Lucifer → Heat +1 with a new boss modifier each rung, and show the rung on the death/victory screen. Endgame players need a mountain that doesn't end; this builds it from parts you've already shipped.

---

## 5 · WHAT I NEED FROM YOU

1. **One more bot run** after pulling — the forensic tap will catch the phantom victory with a stack trace in the ledger.
2. Your calls on §2 tuning (C1 trim + overtime teeth + pity ember) — I'll sim-validate whichever you approve before touching game data.
3. Pick your favorites from §4 and I'll start building in priority order.
