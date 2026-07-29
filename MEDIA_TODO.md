# VESTIBULE — MEDIA TODO (Transitions + Soundtrack)

*Generated July 29, 2026 from a code audit of v0.7.13. Every game state, screen
transition, and music trigger below was verified against src/App.jsx — this is
the exhaustive list, not a wishlist from memory.*

*Delivery pipeline for animations: the existing AE splash system — WebM,
`mix-blend-mode:screen`, black background reads as transparent. 1920×1080.
Palette: --ink-bone / --blood / --gold on near-black. Aesthetic anchors:
hand-drawn scratch linework (ScratchFont energy), xeroxed-flyer grain,
D&D-Monster-Manual weight for anything demonic.*

---

## PART A — TRANSITION ANIMATIONS

Every seam in the game flow, with a creative prompt per item. Prompts are
written to work as AE self-briefs. Durations are targets — nothing over
1.5s on high-frequency transitions or it becomes a tax on the run loop.

### ⛧ TIER 1 — the run loop (player sees these dozens of times per run)

**T1.1 — Fight victory → Shop** (~0.8s)
> Prompt: The last enemy HP tick hits zero — a single downstroke power-chord
> shockwave ripples the screen edge-to-edge as ink-bone dust motes settle.
> Sly's van headlights sweep in from screen-left through the haze, wiping to
> the shop. Grimy, warm, "gig's over, get paid."

**T1.2 — Shop → Next fight** (~0.8s)
> Prompt: Van doors slam shut (screen wipe from both edges meeting center),
> beat of black, then torchlight flares outward from center revealing the
> next stage. The slam IS the downbeat of the incoming battle loop.

**T1.3 — Strike launch flourish** (~0.5s, in-fight, fires every strike)
> Prompt: A hand-drawn pentagram circle scratches itself around the band in
> 4 frames, ignites gold at the moment damage numbers fly. Must read at
> 0.5s and never block input. This is the highest-frequency animation in
> the game — err minimal.

**T1.4 — Boss kill → Circle Splash** (~1.5s)
> Prompt: Boss silhouette cracks like a shattering vinyl record — shards
> spin outward revealing the circle numeral (huge, BogartsMetalFont) burned
> into black. Gold leaf edges on the numeral, ember particles falling.

**T1.5 — Descent (Circle N → N+1)** (~1.5s)
> Prompt: Camera plunges DOWN through nine layers of scratched-ink strata —
> each layer a faint echo of that circle's boss. Speed-ramp: slow pull,
> violent drop, hard land. Hangover cost preview text bleeds in during the
> fall. This is the "Hades door" moment — make descent feel like a choice
> with weight.

**T1.6 — Death → End screen** (~1.2s)
> Prompt: All stage light snuffs to a single amp standby LED. It blinks
> twice, dies. Feedback whine pitches down into silence as the end screen
> ghosts in. No gore — exhaustion, not violence. The band just... couldn't.

### ⛧ TIER 2 — per-circle moments (seen ~once per circle)

**T2.1 — Pact offer reveal** (~1s)
> Prompt: A contract unrolls from the top of frame with a wax-seal SLAM,
> two clauses (the two pact choices) catching candlelight. Fine print
> literally squirms.

**T2.2 — Campfire / Doom Forge entry** (~1s)
> Prompt: Sparks spiral up from bottom of frame, hammer-on-anvil single hit
> flash-frames the forge. Card being upgraded silhouetted in the flame.

**T2.3 — Recruit reveal (new member walk-on)** (~1.2s)
> Prompt: Stage-door light spills, silhouette steps through backlit fog,
> resolves to the member's pixel art with their name in a scratch-font
> lower-third. Roadie-cam energy.

**T2.4 — Event screen entry** (~0.8s)
> Prompt: A tarot card flips out of darkness end-over-end and lands with a
> dust puff. Card face = the event. Keep the flip physical, one bounce.

**T2.5 — Boss intro nameplate** (~1.2s, all 8 circle bosses)
> Prompt: Screen tears horizontally like ripped poster paper revealing the
> boss beneath; nameplate slams in with chromatic aberration on impact
> frame. Template design — boss art and name are swappable layers so one
> project file serves all 8.

**T2.6 — Booster pack tear v2** (upgrade of existing 5-phase CSS anim)
> Prompt: Current state machine works; a WebM foil-glint pass on the tear
> moment + floating scrap particles would take it from good to Pokémon-
> nostalgia-spike. Lowest priority in this tier — polish, not gap.

### ⛧ TIER 3 — setpieces (seen once per run or rarer)

**T3.1 — Lucifer intro (F26)** (~3s, the one place to go long)
> Prompt: Total black. One sub-bass note. Six candle flames ignite in a
> ring, each revealing a fragment of the throne. Lucifer's eyes open LAST,
> after a beat of stillness. 6666 HP counter carves itself in like a
> branding iron. Spend the budget here.

**T3.2 — Victory cinematic plates** (5-phase sequence exists in code)
> Prompt: The code already sequences phases at 800/2000/4500/7000/10000ms —
> replace static plates with animated ones: band walking away from a
> burning throne, gold dust, slow-mo devil-horns freeze-frame. Album-cover
> composition per phase.

**T3.3 — The Executive intro (Second Album / welcomeToHell)** (~2s)
> Prompt: Fluorescent office lighting flickers ON over hell — the most
> frightening thing in the game is a conference table. Contract confetti.
> Corporate sterility invading the doom aesthetic; play it dead straight.

**T3.4 — Credits backdrop** (loopable, ~10s cycle)
> Prompt: Slow pan across a wall of gig flyers for every boss fought this
> run, edges curling, one flyer always mid-fall. Melancholy victory lap.

**T3.5 — Daily Challenge start stinger** (~0.8s)
> Prompt: Calendar page rips away, date burns at the corners, seed number
> stamps in like a ticket punch.

**T3.6 — Lucky Draw reveal** (~1s)
> Prompt: Claw-machine-in-hell. Chain descends, grabs a card silhouette,
> hauls it up through smoke — rarity color leaks through the smoke BEFORE
> the reveal (the anticipation frame is the dopamine, not the reveal).

**T3.7 — Hangover morning-after vignette** (~1s, on descent cost application)
> Prompt: Screen blooms overexposed white then squints down to normal,
> like opening your eyes hungover. Debuff icons materialize during the
> squint. Sells the "corruption costs you tomorrow" fantasy in one beat.

---

## PART B — SOUNDTRACK MAP

### Current state (verified in code, TRACK_MAP at ~App.jsx:5677)

| Track | Covers | Verdict |
|---|---|---|
| menu.mp3 | Main menu, collection, lucky draw | keep |
| select.mp3 | Booster/pack screens | keep |
| battle.mp3 | ALL 18 normal fights | **replace with tiers** |
| boss.mp3 | ALL 8 circle bosses | **replace with tiers** |
| lucifer.mp3 | F26 | keep / re-record as centerpiece |
| shop.mp3 | Shop AND recruit | split (see below) |
| pact.mp3 | Pact screen | keep |
| forge.mp3 | Campfire/Doom Forge | keep |
| descent.mp3 | Descent screen | keep |
| death.mp3 / victory.mp3 | End screens | keep |
| *(silent)* | event, circleSplash | intentional — see stingers |

### EA plan — 3 battle tiers (record these first)

Circle = floor(fightIndex/3)+1. Tier = which third of hell you're in.

- **battle_t1** (C1–C3): Sludge-slow doom. 60–70 BPM, downtuned to C or
  lower, room-mic drum feel. The player is still cocky — the music is
  patient, heavy, inevitable.
- **battle_t2** (C4–C6): Mid-tempo stoner-doom gallop, 90–110 BPM. Fuzz
  opens up, riffs start syncopating. Pressure without panic.
- **battle_t3** (C7–C9): Blackened doom, 130+ BPM or half-time feel that
  EXPLODES into double-time on the turnaround. Tremolo top layer.
  The walls are closing in.
- **boss_t1/t2/t3** (optional for EA, same tier split): same DNA as the
  battle tier but +1 intensity notch and a signature melodic hook each.
  If time is short, ONE new boss loop still beats the current single.

**Code change when tracks land** (5 lines, in the TRACK_MAP effect):
replace `trackName='battle'` with tier lookup
`'battle_t'+Math.min(3,Math.ceil((Math.floor(fightIndex/3)+1)/3))`, same
pattern for boss. Fallback to battle.mp3 if a file is missing.

### Full-release plan — 27+ loops

One loop per fight (F0–F25) + lucifer = 27, structured as 9 circle suites
of 3 movements (fight 1 / fight 2 / boss). Each circle gets a musical
identity matching its sin — e.g., Lust slinks, Gluttony smothers, Wrath is
the fast one, Treachery is cold and dissonant. The suite structure is the
marketing story: "a 27-track doom concept album you fight through."

### Screens that deserve their own track (currently borrowed/silent)

1. **recruit** — borrows shop.mp3. Deserves a lo-fi garage-jam loop: the
   band noodling, amp hum, someone tuning. Sly's-van-adjacent.
2. **The Executive fight** — no special track. A corporate-hell theme
   (elevator-jazz chords played on detuned doom guitars) would be the
   funniest track in the game and people will clip it.
3. **event** — silent by design. A 20s ambient drone bed (no rhythm, just
   amp room-tone + low swells) would keep the world alive without music
   fatigue. Optional.

### Stingers (2–4s one-shots, live in sfx/, not music/)

- Boss kill (T1.4 partner) — one massive chord + cymbal choke
- Circle splash — riff fragment that RESOLVES into the next tier's loop key
- Member goes Too Stoned — sour bend, string buzz, silence
- Mentor link forged — harmonized dual-guitar bloom
- Lucifer death — full-band final chord, 8s natural amp decay, no fade
- Achievement/polaroid pop — single palm-muted chug + tape click

### ⚠ Technical: the mp3 gapless-loop problem (fix before recording 27 tracks)

`Audio.loop=true` + mp3 = an audible gap at every loop seam, because the
mp3 format pads encoder frames. For a game selling its soundtrack, a
hiccup every 32 bars is a dealbreaker. Options, best first:

1. **Web Audio API buffer looping** — decode once, loop sample-accurate
   with `AudioBufferSourceNode.loop`. ~40 lines replacing the current
   Audio-element player, enables real crossfades too. (Claude can build
   this.)
2. Export OGG alongside mp3 — gapless in Chromium (Electron build + most
   browsers), mp3 fallback for Safari demo visitors.
3. Author loops with the seam mid-phrase and bake a fill over it — works
   but constrains composition. Least good.

**Recording specs:** 48kHz WAV masters, loop points bar-aligned, export a
1-bar reverb/amp tail separately for crossfade material, target ~-16 LUFS
integrated (game bg level — leave the limiter headroom, doom needs
dynamics), keep stems (drums / rhythm / lead / texture) for possible
future intensity layering.

### Post-EA idea worth keeping in the pocket

Vertical layering: strike multiplier climbing = stems fading in (base loop
→ +lead at 2× → +tremolo layer at 5×). The music literally rewards big
turns. This is why the stems matter. It is ALSO exactly the kind of scope
creep that delays EA — pocket it.

---

*Priorities if recording time is scarce: battle_t1/t2/t3 + boss-kill
stinger + T1.1/T1.2/T1.4/T1.5 animations. That set alone transforms the
minute-to-minute feel.*
