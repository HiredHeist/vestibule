# VESTIBULE — Steam Build Guide

## Quick Start (Desktop App)

```bash
# Install dependencies (first time only)
npm install
npm install --save-dev electron electron-builder

# Run as desktop app (dev mode)
npm run electron

# Build distributable
npm run dist:win    # Windows .exe
npm run dist:mac    # macOS .dmg  
npm run dist:linux  # Linux .AppImage
```

## Steam Setup

1. **Create Steamworks account** at https://partner.steamgames.com
   - $100 Steam Direct fee (one-time)
   
2. **Set up store page:**
   - App name: VESTIBULE
   - Genre: Strategy, Card Game, Roguelike Deckbuilder
   - Tags: Deckbuilder, Roguelite, Card Game, Strategy, Dark Fantasy, Heavy Metal
   - Price: $4.20 (pre-order) / $6.66 (full)
   
3. **Required assets:**
   - Header capsule: 460×215
   - Small capsule: 231×87
   - Large capsule: 467×181
   - Hero graphic: 3840×1240
   - Logo: 1280×720 (transparent)
   - Screenshots: 1920×1080 (minimum 5)
   - Store description + About section

4. **Build and upload:**
   ```bash
   npm run dist:win
   ```
   Upload `release/` folder contents to Steamworks via SteamPipe

5. **Steam Integration (optional for EA):**
   - Steamworks SDK for achievements
   - Steam Cloud for save data
   - These can be added post-launch

## Version: 0.6.66
## Price: $4.20 pre-order / $6.66 full
## Target: Steam Early Access
