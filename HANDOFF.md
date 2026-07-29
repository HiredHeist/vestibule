# HANDOFF — July 29, 2026 (State-of-reality audit)

*30-second read. This replaces the stale May 3 handoff, which described a
pre-merge world. Everything below was verified against the actual code and
fresh sim runs on July 29 — not copied from old notes.*

---

## Where main actually is: `v0.7.12` (commit bd2985e)

**Everything you remembered as "deferred" is DONE and merged:**

1. **Keyword stack rework — SHIPPED.** `getEffectiveAtk()` centralized
   (src/App.jsx ~line 627). CORRUPT / FRENZIED / SHREDDER on ×1/×2/×4 tier
   scaling, ANCHOR tiered lethal saves (1/2/any-member), DOUBLE TIME tier 3
   (all members attack twice at 3+ drummer stacks). Wired into BOTH the
   strike calc (~8203-8500) and the cascade preview (~11563-11647).
2. **Hangover system + Trip overhaul — MERGED** (84f5df2). Corruption cannot
   end a run. 24 trip effects incl. DMT premium tier. The
   `hangover-with-teeth` branch pointer still exists on remote but is fully
   contained in main — safe to delete.
3. **Shop fixes shipped:** recruit-pack infinite-buy exploit (v0.7.3),
   circle-shop reroll collision (v0.7.4), plus polish through v0.7.12.
4. **App.jsx is now 11,911 lines.**

## Verified July 29 (this audit)

- **Per-deck 5K sim sweep on bronze — PASSED.** Lucifer win rates:
  Standard 9.00% · Shredder 10.48% · Ritualist 9.08% · Engineer 11.82% ·
  Survivor 8.28%. Target ~10%; all decks within band, no broken archetype.
- **Stale-text audits — CLEAN.** No corruption-kills-you strings in addLog
  or EndScreen. Only fix needed was a debug-shortcut string (Shift+D),
  corrected in this commit.
- **GitHub PAT expired ~June 17, 2026.** Repo is public so clones work;
  pushes need a new token.

## The real remaining list before Early Access

1. **Band Auras** — the ONLY approved feature with zero code. Needs design
   refinement (JV) then implementation.
2. **Card tuning backlog (non-blocking):** Record Deal near-dead in every
   deck (~0.15 plays/game). Carrion Call dead in Survivor (0.03/g) though
   healthy in Ritualist. Sabbath Sigil's low usage is mostly a sim-AI
   artifact, not a card problem.
3. **App.jsx split** — optional pre-EA, recommended post-EA.
4. **Steam packaging** — see STEAM.md.
5. **Animator cutscenes** — brief exists (19 transitions, 4 tiers);
   deal structure TBD (flat fee vs. rev share).

## Sacred constants (unchanged)

- 420 (stash cap, card height), 69 (deck size), 6666 (endgame Lucifer HP)
- Fonts: BogartsMetalFont (display, NO digits), MBScribblesFont
  (default + digits), ScratchFont (flavor)
- React 18 Strict Mode: no side effects inside `setX(prev => ...)` updaters
