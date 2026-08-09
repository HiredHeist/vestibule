# 10 ADDICTION LEVERS + STREAMABILITY READ
*Aug 6 2026 — grounded in the veteran data, ordered easiest→highest-effort. Each has a reason and a rough cost.*

## 10 easy ideas to make players unable to stop

**1. "One more run" auto-queue.** On the death/victory screen, pre-select the same deck+stake and put a big **"⛧ DESCEND AGAIN ⛧"** as the default focused button (Enter fires it). *Why:* the data shows one-shot fights at 32% and fast runs — the friction between runs is the drop-off point, not the run itself. Balatro's entire retention trick is that restarting is one keypress. **Cost: tiny.**

**2. Daily seed with a global-ish leaderboard.** You already have `vst_daily_best` + seeds. Surface a "Today's Descent" tile on the menu with the seed, your best, and a shareable score string. *Why:* a fixed daily puzzle everyone plays creates a reason to log in every day and a natural "beat my score" loop. **Cost: small (mostly UI — the seed infra exists).**

**3. Near-miss framing on death.** When a player dies to a boss, show "**Lucifer had 4% HP left**" or "you were 1 strike away." *Why:* the survival curve shows 49.5% die at Lucifer — most deaths are *close*. A near-miss is the single most addictive signal in games; right now a loss just ends. Make the loss *sting with almost*. **Cost: tiny.**

**4. Post-run "best moment" card.** Auto-capture the biggest single strike / longest chain / highest mult of the run and show it on the end screen as a shareable stat ("Peak strike: 41,208 — Hellfire ×3"). *Why:* strike mult caps at 10,000× and one-shots are common — players are already producing huge numbers; they just never get *shown* their peak. Give them the trophy. **Cost: small.**

**5. Unlock a *thing* every run, win or lose.** A steady drip: new card, member, alt art, relic, or a lore snippet, tied to lifetime cards-played (you already track `vst_mastery` Novice→Legendary). *Why:* loss-aversion retention — even a failed run advances something. Roguelite meta-progression is why players do "just one more" at 2am. **Cost: medium (needs an unlock table, but the mastery counters exist).**

**6. Escalating streak reward + visible streak flame.** You track `vst_streak`. Make it *visible and loud* on the menu, with a small mechanical perk at 3/7/14 days (e.g. one free reroll) that you *lose* on a miss. *Why:* streaks weaponize loss-aversion — people play to not break the chain. **Cost: small.**

**7. Boss blind preview + "prep" tension.** Before a circle boss, show the incoming blind ("⛓ Next: Chains Muted") one fight early so the player can *build against it* in the shop. *Why:* the blinds are your new tension engine; letting players *plan around* them turns a rule-change from a surprise into a **decision**, which is far more replayable ("do I buy the anti-armor card or gamble?"). **Cost: small — the blind roll already exists; just surface it a fight earlier.**

**8. Weekly rotating modifier ("this week: +1 ember, bosses hit harder").** A single global rule that changes weekly. *Why:* gives veterans a reason to relearn a solved deck; keeps the meta from going stale. Slay the Spire's daily modifiers are its longest-tail content. **Cost: medium.**

**9. Deck-mastery tiers with cosmetic payoff.** Per deck, track wins and award a visible badge / alt card back / menu flourish at 1/5/10/25 wins. *Why:* gives the 9–11% win rate a *destination* — a completionist chases "10-Win Ritualist" for months. **Cost: medium.**

**10. "Ascension"-style stake ladder that auto-nudges.** After a win on a stake, prompt "Try the next stake?" with a one-tap yes (you have Bronze→Demonic). *Why:* the win rate is low enough that beating a stake feels earned — capitalize on that dopamine spike immediately by dangling the next rung while they're hot. **Cost: tiny (the stakes exist; it's a prompt).**

**The through-line:** your *gameplay* is already sticky (fast runs, big numbers, real decisions). Almost every lever above is about the **seams between runs** — the menu, the death screen, the meta-progression — which is exactly where roguelites win or lose retention. Ideas 1, 3, 7, 10 are near-free and I'd do them first.

---

## STREAMABILITY — do people want to watch this?

**Short answer: yes, and it's one of your biggest untapped assets — but it needs two specific things to pop on stream.**

### Why it's inherently streamable (you already have the DNA)
- **The genre is proven on Twitch.** Balatro and Slay the Spire are perennial watch-magnets precisely because deckbuilders are *spectator-friendly*: the viewer sees the whole board, understands the choice, and can backseat-play ("no, take the OTHER card!"). Chat participation is the engine of a stream, and draft/shop decisions are pure chat-bait.
- **Doom-metal theme = a hook no competitor has.** The deckbuilder shelf is crowded, but a *doom-metal band-management* skin is instantly legible in a thumbnail and title. That's the scroll-stopper on YouTube. Your aesthetic IS your marketing.
- **The numbers already go huge.** Strike mult to 10,000×, one-shots at 32%, chains like "Hellfire ×3 + burn" — the **big-number payoff moment** is the most clippable event in this genre (it's why Balatro's "that's a lot of chips" clips go viral). You're generating those every ~3rd fight.
- **Built-in drama beats.** ANCHOR clutch-saves fire ~every other game; blinds force live adaptation; the Lucifer wall kills half of skilled runs. That's a natural highs-and-lows arc per run — the shape a good stream needs.

### The two things it needs to actually pop on stream
1. **Legibility at a glance / on video.** A viewer on a phone, or someone watching a muted clip, must instantly read *what just happened*. That means: the **damage breakdown must be big and readable**, the **chain that fired must flash its name loudly**, and the **peak-strike number must be un-missable**. Right now the game knows its own peak strike (idea #4) but doesn't celebrate it. **Make the payoff moment cinematic** — screen shake, the mult number filling the screen, the chain name in your metal font. That single visual is what gets clipped and shared.
2. **A shareable artifact per run.** The end-of-run "best moment" card (idea #4) *is* your organic marketing — if it's a clean, brandable image with the deck, the peak number, and the boss, players post it. Every shared card is a free ad. Balatro's run-summary screen is screenshotted constantly for exactly this reason.

### What would 10× it (bigger swings, noted for later)
- **A spectator/seed-share string** so a streamer can say "seed DOOM666, beat my Lucifer run" and the whole chat plays the identical descent. Communal challenge = the deepest engagement loop in the genre.
- **Twitch-extension or chat-vote integration** (chat picks the next card/pact) — the highest-ceiling streamer feature, but real engineering. Park it, but know it's the ceiling.

**Verdict:** the game is *structurally* streamable today — right genre, unique hook, big-number payoffs, built-in drama. The gap is **presentation of the payoff moment**, not gameplay. Land idea #4 (best-moment card) + a cinematic big-strike celebration, and you have genuinely clippable, thumbnail-able content. That's a cheap, high-leverage bet.
