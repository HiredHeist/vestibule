# VESTIBULE — Simulation Report v17.1
**Date:** March 26, 2026
**Sim version:** v17.1 (synced with game code)
**Samples:** 10,000 games per stake

---

## Win Rate Summary

| Stake | Win Rate | Avg Fight Reached | Corruption Thresholds |
|-------|----------|-------------------|-----------------------|
| Bronze | 8.67% | 19.86 / 26 | Whisper: 16.1K dmg, Madness: 42K cards, Possess: 9.4K |
| Silver | 7.20% | 17.46 / 26 | Whisper: 14.4K dmg, Madness: 38K cards, Possess: 8.4K |
| Gold | 6.77% | 16.89 / 26 | Whisper: 14.0K dmg, Madness: 36K cards, Possess: 8.1K |
| Obsidian | 3.56% | 14.76 / 26 | Whisper: 12.3K dmg, Madness: 32K cards, Possess: 7.4K |
| Blood | 1.94% | 8.66 / 26 | Whisper: 6.9K dmg, Madness: 18.5K cards, Possess: 4.2K |
| Demonic | 0.94% | 2.72 / 26 | Whisper: 1.5K dmg, Madness: 3K cards, Possess: 0.9K |

## Key Stats (Bronze 10K)
- Genre activations: 209,271 (~21 per game)
- Riff Chains triggered: 184,017 (~18 per game)
- Mentor Links formed: 14,102 (1.41 per game)
- Cards burned (pawn shop): 58,908 (5.9 per game)

## Balance Assessment
- All stakes properly descending - no inversions
- Bronze hits target range (8-10%)
- Demonic is near-impossible (<1%) as intended
- Blood starts at 10% corruption, avg fight 8.66 = most runs die around Circle III
- Corruption thresholds fire proportionally across all stakes

## Stake Difficulty Parameters
| Stake | Boss HP Mult | Boss +DMG | Max Strikes | Start Corrupt | Heal? | Mentor Bonus |
|-------|-------------|-----------|-------------|---------------|-------|-------------|
| Bronze | 1.20 | +0 | 4 | 0% | Yes | 0% |
| Silver | 1.25 | +2 | 4 | 0% | Yes | 3% |
| Gold | 1.25 | +3 | 4 | 0% | Yes | 3% |
| Obsidian | 1.45 | +2 | 4 | 0% | No | 6% |
| Blood | 1.70 | +2 | 4 | 10% | No | 15% |
| Demonic | 1.66 | +4 | 3 | 15% | No | 75% |
