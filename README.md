# Vestibule

A doom metal roguelite deckbuilder. Build a band, descend through 9 circles of Hell, fight Lucifer.

**Stack:** React 18 + Vite, single-file (`src/App.jsx`)
**Dev:** `npm install && npm run dev` → http://localhost:5173/vestibule/
**Repo:** github.com/HiredHeist/vestibule (private)

---

## For AI dev agents

Read these in order before doing any work:

1. **`CLAUDE.md`** — codebase rules, file structure, gotchas, key code locations
2. **`TODO.md`** — current prioritized task list (the active work doc)
3. **`GDD.md`** — game design reference (mechanics, numbers, systems)

Then for context-specific work:
- **`ART_TODO.md`** — art asset spec (sizes, paths, direction notes)
- **`STEAM.md`** — build & deploy reference

---

## Repo structure

```
src/App.jsx              — main game (single-file architecture, ~9,500 lines)
src/main.jsx             — root mount, CRT/VHS overlay
src/App.css              — design tokens, animations
public/vestibule/        — game art (cards, artifacts, etc.)
public/members/          — 18 band member portraits + idle GIFs
public/bosses/           — 28 boss portraits
public/sfx/              — 31 sound effects
public/music/            — 11 music tracks (placeholders, originals in progress)
public/fonts/            — 9 custom fonts
vestibule-sim-kwstacks.js  — simulation engine (run: node vestibule-sim-kwstacks.js)
```

---

## Key rules (full list in CLAUDE.md)

- Every code commit MUST update `TODO.md` in the same commit
- Sacred constants: 420 (stash cap), 69 (deck size) — never change
- BogartsMetalFont: display only, NO digits. MBScribblesFont: default UI font.
- Min font size 13px globally, lint-enforced
- React named imports only (never `React.useState`)
