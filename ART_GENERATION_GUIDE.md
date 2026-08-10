# ⛧ Vestibule Art Generation Guide — For Cowork Agent

## API SETUP

### Credentials
API key is in `.env.pixellab` (gitignored). Read it via:
```bash
source .env.pixellab
# or in Python:
# key = open('.env.pixellab').read().split('=')[1].strip()
```

### Endpoint
```
POST https://api.pixellab.ai/v2/create-image-pixflux
Headers:
  Content-Type: application/json
  Authorization: Bearer $PIXELLAB_API_KEY
```

### Response Format
```json
{
  "usage": {...},
  "image": {
    "type": "base64",
    "base64": "<base64 PNG data>",
    "format": "png"
  }
}
```

---

## STANDARD SETTINGS (use for ALL generations)

```json
{
  "image_size": {"width": 128, "height": 128},
  "text_guidance_scale": 10,
  "outline": "single color black outline",
  "shading": "basic shading",
  "detail": "highly detailed",
  "no_background": true,
  "direction": "south"
}
```

### Color Anchor
Use Bjorn's sprite as `color_image` for palette consistency on ALL member/item art:
```json
"color_image": {
  "type": "base64",
  "base64": "<base64 of public/members/bjorn_stage.png>",
  "format": "png"
}
```

### Standard Negative Prompt (characters)
```
cartoon, cute, colorful, bright, happy, chibi, friendly, 80s glam, anime, manga, japanese style, cel shaded, big eyes, smooth, cropped, close up, portrait, bust shot, half body, waist up, big head
```

### Standard Negative Prompt (items/icons)
```
cartoon, cute, colorful, bright, happy, chibi, friendly, anime, manga, cel shaded, smooth, modern, clean, character, person, humanoid
```

---

## STYLE GUIDES BY CATEGORY

### Band Members
- Full body, head to boots, small character centered in frame
- "western dark fantasy pixel art style"
- Use Bjorn `color_image` for palette
- Prompt prefix: `pixel art, 128x128, neutral flat dungeon lighting, no strong light source, transparent background, full body sprite head to boots, small character centered in frame, wide shot, western dark fantasy pixel art style,`

### Bosses / Enemies
- "old school dungeons and dragons monster manual illustration style, classic TSR era fantasy monster"
- Use Bjorn `color_image` for palette
- Prompt prefix: `pixel art, 128x128, neutral flat dungeon lighting, no strong light source, transparent background, full body creature head to feet, old school dungeons and dragons monster manual illustration style, classic TSR era fantasy monster,`

### Items / Icons (stakes, packs, rewards)
- Centered object, no character
- "icon item, centered in frame"
- Prompt prefix: `pixel art, 128x128, neutral flat dungeon lighting, no strong light source, transparent background,`
- Prompt suffix: `doom metal aesthetic, icon item, centered in frame, gritty detailed, dark muted palette`

---

## WORKFLOW

1. Generate 4 seeds per item (use seeds: 666, 420, 13, 77)
2. Save all 4 as `{id}_seed{N}.png` (128x128 originals)
3. Save 5x previews as `{id}_seed{N}_5x.png` (640x640, nearest neighbor)
4. Present to user for selection
5. Save approved version to the correct `public/` subfolder
6. Push to repo when batch is complete

### Python Generation Template
```python
import base64, json, subprocess
from PIL import Image

# Load API key
with open('.env.pixellab') as f:
    api_key = f.read().split('PIXELLAB_API_KEY=')[1].split('\n')[0]

# Load Bjorn as color anchor
with open('public/members/bjorn_stage.png', 'rb') as f:
    bjorn_b64 = base64.b64encode(f.read()).decode()

def generate(item_id, description, negative, seed):
    payload = {
        "description": description,
        "negative_description": negative,
        "image_size": {"width": 128, "height": 128},
        "text_guidance_scale": 10,
        "outline": "single color black outline",
        "shading": "basic shading",
        "detail": "highly detailed",
        "no_background": True,
        "direction": "south",
        "color_image": {
            "type": "base64",
            "base64": bjorn_b64,
            "format": "png"
        },
        "seed": seed
    }
    with open('payload.json', 'w') as f:
        json.dump(payload, f)
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://api.pixellab.ai/v2/create-image-pixflux',
        '-H', 'Content-Type: application/json',
        '-H', f'Authorization: Bearer {api_key}',
        '-d', '@payload.json'
    ], capture_output=True, text=True)
    d = json.loads(result.stdout)
    if 'image' in d:
        img_bytes = base64.b64decode(d['image']['base64'])
        fname = f'{item_id}_seed{seed}.png'
        with open(fname, 'wb') as out:
            out.write(img_bytes)
        # 5x preview
        Image.open(fname).convert('RGBA').resize(
            (640, 640), Image.NEAREST
        ).save(f'{item_id}_seed{seed}_5x.png')
        return True
    return False

# Example usage:
# for seed in [666, 420, 13, 77]:
#     generate('my_item', 'pixel art, 128x128, ...description...', 'negative...', seed)
```

---

## REMAINING ART TO GENERATE

### Shop Packs (save to public/vestibule/packs/)
| ID | Name | Description Prompt |
|----|------|--------------------|
| `cassette` | Cassette Tape | worn cassette tape with dark metal band logo on label, magnetic tape slightly unspooled, scratched plastic shell |
| `cdr` | CD-R | burned CD-R disc with band name written in marker, scratched reflective surface, in slim jewel case |
| `vinyl` | Vinyl Record | dark vinyl LP record, partially out of a weathered album sleeve with doom metal artwork |
| `rare_vinyl` | Rare Vinyl | rare limited pressing vinyl record, colored splatter wax, ornate gatefold sleeve, collector item |
| `cursed_demo` | Cursed Demo | cursed demo tape, cracked cassette oozing dark energy, forbidden recording, eldritch symbols on label |

### Deck Types (save to public/vestibule/decks/)
| ID | Name | Description Prompt |
|----|------|--------------------|
| `standard` | Standard | pentagram sigil branded into dark leather, standard doom metal symbol, basic emblem |
| `shredder` | Shredder | broken guitar pick wreathed in lightning, aggressive sharp edges, shredder emblem |
| `ritualist` | Ritualist | dark ritual circle with candles and runes, occult ceremony symbol, ritualist emblem |
| `engineer` | Engineer | dark mechanical gears and vacuum tubes, amp circuitry, sound engineer emblem |
| `survivor` | Survivor | scarred battle shield with claw marks, battered but unbroken, survivor emblem |

### Shop Rewards (save to public/vestibule/rewards/)
| ID | Name | Emoji | Description Prompt |
|----|------|-------|--------------------|
| `s_stash` | +15 Stash | 🌿 | small dark pouch of herbs and stash, green glow, weed bag |
| `s_ember` | +1 Ember | 🔥 | single burning ember floating, dark fire magic, hellfire spark |
| `s_maxhp` | +2 Max HP | ❤️ | dark pulsing heart crystal, blood red gem, health increase |
| `s_atk` | +1 ATK | ⚔️ | dark iron gauntlet making a fist, power increase, attack boost |
| `s_heal` | Heal All | 💚 | green healing potion bottle, glowing restoration liquid |
| `s_reroll` | Reroll Cards | 🎲 | dark bone dice with skull pips, reroll symbol |
| `s_remove` | Remove Card | 🗑️ | dark fire burning a playing card, card removal |
| `s_upgrade` | Upgrade Card | ⬆️ | dark anvil with sparks, forging upgrade, enhancement |
| `s_corrupt_down` | -15% Corruption | 🧹 | dark broom sweeping away purple corruption mist |
| `m_recruit` | Recruit Member | 👤 | dark recruitment poster with "WANTED" and band silhouette |
| `m_swap` | Swap Member | 🔄 | two dark arrows circling each other, swap symbol |
| `m_heal_member` | Heal Member | 💊 | dark pill bottle with skull and crossbones, medicine |

### Collection Tabs (save to public/vestibule/collection/)
| ID | Name | Emoji | Description Prompt |
|----|------|-------|--------------------|
| `col_milestones` | Milestones | 🏆 | dark trophy with pentagram engraving, achievement award |
| `col_members` | Members | 🎸 | dark guitar headstock silhouette, band members icon |
| `col_cards` | Cards | 🃏 | dark playing card with doom skull, card collection icon |
| `col_artifacts` | Artifacts | 💎 | dark cursed gemstone, artifact collection icon |
| `col_pedals` | Pedals | 🎛️ | dark guitar effects pedal with glowing knobs |
| `col_combos` | Riff Chains | ⛧ | dark chain links forming a pentagram, combo icon |

---

## FILE STRUCTURE
```
public/
├── members/           ← band member static sprites (done)
│   └── idle/          ← idle animation GIFs (done)
├── bosses/            ← boss/enemy sprites (done + tutorial enemies)
└── vestibule/
    ├── cards/         ← card art (86 done)
    ├── pacts/         ← pact art (23 done)
    ├── loot/          ← loot art (5 done)
    ├── stakes/        ← stake unlock icons (6 done)
    ├── packs/         ← shop pack icons (TODO)
    ├── decks/         ← deck type icons (TODO)
    ├── rewards/       ← shop reward icons (TODO)
    └── collection/    ← collection tab icons (TODO)
```

---

## IMPORTANT RULES
- All output is 128×128 PNG with transparent background
- Always use `no_background: true`
- Always use Bjorn as `color_image` for palette consistency
- Always generate 4 seeds and let user pick
- Show 5× previews (640×640 nearest neighbor) so user can see detail
- Use `imageRendering: 'pixelated'` in CSS when displaying pixel art
- Never commit `.env.pixellab` to git (add to .gitignore)
- Sacred constants: 420 (stash cap), 69 (deck size) — never change
