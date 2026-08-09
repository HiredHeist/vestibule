// Extracted from App.jsx (v0.8.0 split, depth-aware parser) — pure data.
// Aug 5 2026 — BAND EQUALIZATION PASS (v2, budget 27). Every recruitable member sits on
// one power budget (maxHp + 3*ATK = 27), differing by SHAPE (glass cannon <-> wall) and
// KEYWORD. Budget 27 matches the old picked-average so overall difficulty holds while
// making every member fair. Members start at full HP.
// Aug 6 2026 — DRUMMER REBALANCE. Drummers (Thor/Rolf) are OFF the 27 budget: they deal
// 0 ATK and provide the BLASTBEAT band multiplier (x1.5/drummer) instead. They used to
// be tanky walls (hp 20/18) which made them free-value auto-includes once BLASTBEAT was
// (belatedly) modeled in the sim; now they carry MODERATE bodies (hp 14/11) so a drummer
// is a genuine trade — an attacker slot for a x1.5 band buff — and the veteran bot picks
// them ~33% (was 1-6%). The whole roster now drafts evenly (every member 25-38% pick).
export const ALL_MUSICIANS=[
  {id:'bjorn',name:'Bjorn',role:'Lead Guitarist',atk:7,hp:6,maxHp:6,emoji:'🎸',keyword:'FRENZIED',desc:'The carry. Glass cannon — highest ATK, frailest body.',bio:'Former blacksmith from Uppsala. Traded his hammer for a guitar at 14. His riffs have literally killed small animals.'},
  {id:'ragnar',name:'Ragnar',role:'Lead Guitarist',atk:6,hp:9,maxHp:9,emoji:'🎸',keyword:'FRENZIED',desc:'Aggressive lead with a little more body than Bjorn.',bio:'Claims to be descended from the real Ragnar Lothbrok. Nobody believes him, but nobody argues when he plays.'},
  // Aug 5 2026 — Thor is now a BLASTBEAT drummer (was ANCHOR). Both drummers carry
  // BLASTBEAT: multiple drummers are allowed and their ×1.5 band damage STACKS (×2.25 for
  // two). Aug 6 2026 — drummers rebalanced from tanky walls (hp 20/18) to moderate bodies
  // (hp 14/11, atk 0) so a drummer is a real ~33%-pick trade, not a free-tank auto-include.
  {id:'thor',name:'Thor',role:'Drummer',atk:0,hp:14,maxHp:14,emoji:'🥁',keyword:'BLASTBEAT',desc:'Relentless double-kick. Drummers make the whole band hit ×1.5 — swing nothing themselves, so protect them and stack for combos.',bio:'Not THAT Thor. This one is louder. Broke three drum kits in one show. The venue banned drums after that.'},
  {id:'ingrid',name:'Ingrid',role:'Bass Player',atk:4,hp:15,maxHp:15,emoji:'🎵',keyword:'ANCHOR',desc:'Sturdy foundation. Survives one lethal hit per fight (stack 3+ ANCHORs to protect the whole band).',bio:'The foundation. Ingrid held the band together through two breakups, a lawsuit, and a literal earthquake during a set.'},
  {id:'loki',name:'Loki',role:'Synth Player',atk:5,hp:12,maxHp:12,emoji:'🎹',keyword:'DISSONANCE',desc:'Balanced synth. +1 ATK for every DIFFERENT keyword elsewhere in your band — thrives in a varied lineup.',bio:'Found a synthesizer that plays frequencies no two of which agree. The more different voices around him, the louder the clash.'},
  {id:'grimnir',name:'Grimnir',role:'Vocalist',atk:7,hp:6,maxHp:6,emoji:'🎤',keyword:'DEBUFF',desc:'The Masked One. Highest-ATK debuffer, frailest voice in Hell — strips the boss passive as he hits.',bio:'Nobody has seen his face. His voice strips the will from anything that hears it. Even the sound guy wears earplugs.'},
  {id:'dag',name:'Dag',role:'Bass Player',atk:3,hp:18,maxHp:18,emoji:'🎵',keyword:'ANCHOR',desc:'Tank. Big body, small bite.',bio:'18 HP of pure Viking stubbornness. Dag once played a 9-hour set without sitting down. He does not believe in breaks.'},
  {id:'vitalik',name:'Vitalik',role:'Dark Minstrel',atk:5,hp:12,maxHp:12,emoji:'🪈',keyword:'FOLK MAGIC',desc:'Balanced body, powerful signal — refills embers and heals the band around him.',bio:'Showed up backstage with a carved bone flute. When asked to leave, he played one note. Everyone sat down and listened.'},
  {id:'sigrid',name:'Sigrid',role:'Rhythm Guitarist',atk:5,hp:12,maxHp:12,emoji:'🎸',keyword:'SHREDDER',desc:'Balanced rhythm. +ATK on every same-type chain — stack riffs.',bio:'Ex-military. Applied the same discipline to guitar that she applied to combat. Each riff is a controlled burst.'},
  {id:'gunnar',name:'Gunnar',role:'Rhythm Guitarist',atk:6,hp:9,maxHp:9,emoji:'🎸',keyword:'SHREDDER',desc:'Aggressive rhythm. He makes the rhythm.',bio:'Gunnar does not follow tempo. Tempo follows Gunnar. Three metronomes have broken trying to keep up with him.'},
  {id:'astrid',name:'Astrid',role:'Vocalist',atk:4,hp:15,maxHp:15,emoji:'🎤',keyword:'DEBUFF',desc:'Durable support. Her voice alone can break a curse and blunt the boss.',bio:'Trained as an opera singer. Got bored. Now she shatters demonic wards with a B-flat. The opera house still calls.'},
  {id:'freya',name:'Freya',role:'Synth Player',atk:6,hp:9,maxHp:9,emoji:'🎹',keyword:'DISSONANCE',desc:'Aggressive glass cannon. +1 ATK for every DIFFERENT keyword elsewhere in your band — build wide and she screams.',bio:'Freya heard the frequency that drives men mad. Instead of going mad, she tuned her synth to it. The more voices clash around her, the sharper her edge.'},
  {id:'ulf',name:'Ulf',role:'Bass Player',atk:5,hp:12,maxHp:12,emoji:'🎵',keyword:'ANCHOR',desc:'The anchor that also bites. Balanced bass.',bio:'Most bass players hold the line. Ulf holds the line and then crosses it. His low-end hits like a freight train.'},
  {id:'brynja',name:'Brynja',role:'Bass Player',atk:2,hp:21,maxHp:21,emoji:'🎵',keyword:'ANCHOR',desc:'An immovable wall. The bass never stops.',bio:'21 HP. She once tanked a full drum kit falling on her mid-set and kept playing. The wall of Valhalla.'},
  // Aug 5 2026 — Rolf stays BLASTBEAT (renamed from DOUBLE TIME). Flat ×1.5 band damage.
  // Rolf is the lighter-bodied drummer (hp 11) next to Thor (hp 14).
  {id:'rolf',name:'Rolf',role:'Drummer',atk:0,hp:11,maxHp:11,emoji:'🥁',keyword:'BLASTBEAT',desc:'Precision tempo. The whole band hits ×1.5 harder — reliable, every strike. Lighter body than Thor; keep him alive.',bio:'A mathematician who discovered the optimal striking frequency. Each hit is precisely calculated for maximum devastation.'},
  {id:'orm',name:'Orm',role:'Dark Minstrel',atk:3,hp:18,maxHp:18,emoji:'🪈',keyword:'DIRGE',desc:'Tank. +1 ATK for every 4 cards in your DISCARD pile — the deeper into the set, the heavier he plays. Keep him alive to ramp.',bio:'Orm plays an instrument nobody can name. It has too many strings and not enough frets. The longer the set runs, the more the dead seem to sing along.'},
  // Aug 6 2026 — Tanuki TRICKSTER = MIMIC: each strike his ATK matches the highest FULL
  // effective atk among other members (base+perm+temp + per-strike keyword scaling), computed
  // in getEffectiveAtk via ctx.mimicStrength (live) and _mimicStrength (sim). hp 14 per JV.
  // Sim (TEST_TANUKI=1): ~9% win, 100% pick — a fun auto-include mythic (mirrors your carry)
  // but NOT overpowered (2nd carry = diminishing returns vs utility). Reward unlock, so his budget
  // (~31) sits above the base 27.
  {id:'tanuki',name:'Tanuki',role:'Trickster',atk:8,hp:14,maxHp:14,emoji:'🦝',keyword:'TRICKSTER',desc:'MIMIC — each strike his ATK matches your strongest member, buffs and all (their FULL boosted ATK). A glass cannon body: protect him and he mirrors your carry.',locked:true,unlockAt:8000,bio:'A raccoon-dog from Japanese folklore. How he ended up in a Norse doom metal band is a question nobody dares ask.'},
  {id:'lucifer_member',name:'Lucifer',role:'The Devil',atk:20,hp:69,maxHp:96,emoji:'😈',keyword:'FALLEN',desc:'Cannot be healed. Loses 1 HP per strike. If he dies, game over. Max 3 band members. Sell for 69 herb.',locked:true,unlockAt:100000,bio:'The actual Devil. Joined the band out of boredom. Unstoppable power, but his HP drains every strike. A ticking time bomb of pure evil.'},
]
