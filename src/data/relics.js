// Extracted from App.jsx (v0.8.0 split, depth-aware parser) — pure data.
export const STARTER_ARTIFACTS=[
  // ── EXISTING MULTIPLIERS (kept, retagged with rarity) ─────────
  {id:'a1',name:'Vintage Guitar',emoji:'🎸',effect:'×1.3 when you play 4+ cards before Striking.',cost:10,multTrigger:'cards3',mult:1.3,rarity:'common'},
  {id:'a2',name:"Devil's Tuning Fork",emoji:'🔱',effect:'Start each fight at 15% Corruption. ×1.5 damage when Corruption hits 60%+.',cost:16,multTrigger:'corrupt50',mult:1.5,rarity:'uncommon',startCorr:15},
  {id:'a5',name:'Haunted Radio',emoji:'📻',effect:'×1.2 damage for each Riff Chain fired this Strike.',cost:8,multTrigger:'perChain',mult:1.2,rarity:'common'},
  {id:'a6',name:'Black Candle',emoji:'🕯',effect:'×1.4 damage for each Too Stoned member.',cost:12,multTrigger:'perStoned',mult:1.4,rarity:'uncommon'},
  {id:'a9',name:'Resonance Coil',emoji:'⚙️',effect:'×1.2 for each duplicate card PLAYED this Strike.',cost:10,multTrigger:'perDupePlayed',mult:1.2,rarity:'common'},
  {id:'a10',name:'Burning Stage',emoji:'🔥',effect:'×3.0 if you play ALL 6 cards before Striking. Total commitment.',cost:22,multTrigger:'cards5',mult:3.0,rarity:'rare'},
  // ── NEW COMMON-TIER (12) ──────────────────────────────────────
  {id:'crackedpickup',name:'Cracked Pickup',emoji:'🎤',effect:'×1.2 damage if you played a RIFF this strike.',cost:12,multTrigger:'playedRiff',mult:1.2,rarity:'common'},
  {id:'distortioncab',name:'Distortion Cab',emoji:'🔊',effect:'×1.25 damage always.',cost:14,multTrigger:'alwaysOn',mult:1.25,rarity:'common'},
  {id:'ashtray',name:'Ash Tray',emoji:'🚬',effect:'×1.3 damage if any member is Too Stoned.',cost:12,multTrigger:'anyStoned',mult:1.3,rarity:'common'},
  {id:'crowdnoise',name:'Crowd Noise',emoji:'🤘',effect:'×1.10 per alive non-stoned member.',cost:16,multTrigger:'perAliveMember',mult:1.10,rarity:'common'},
  {id:'tapehiss',name:'Tape Hiss',emoji:'📼',effect:"×1.2 if you DIDN'T play any RIFF this strike.",cost:8,multTrigger:'noRiff',mult:1.2,rarity:'common'},
  {id:'setlistart',name:'Set List',emoji:'📋',effect:'×1.4 if first card played was an EMBER type.',cost:12,multTrigger:'firstCardEmber',mult:1.4,rarity:'common'},
  {id:'gaffertape',name:'Gaffer Tape',emoji:'🩹',effect:'×1.2 if no member is below half HP.',cost:10,multTrigger:'allHealthy',mult:1.2,rarity:'common'},
  {id:'powerstrip',name:'Power Strip',emoji:'⚡',effect:'×1.25 if you have 5+ Embers when you Strike.',cost:11,multTrigger:'embers5',mult:1.25,rarity:'common'},
  {id:'spitcup',name:'Spit Cup',emoji:'🥃',effect:'×1.5 damage if you discarded ≥1 card this STRIKE.',cost:10,multTrigger:'discardedStrike',mult:1.5,rarity:'common'},
  {id:'divebarsign',name:'Dive Bar Sign',emoji:'🍻',effect:'×1.35 in Circles I-III. Refunds its cost when you reach Circle IV — the residency ends.',cost:9,multTrigger:'earlyCircle',mult:1.35,rarity:'common',refundAtC4:true},
  // ── NEW UNCOMMON-TIER (8) ─────────────────────────────────────
  {id:'pentagramshrine',name:'Pentagram Shrine',emoji:'🜏',effect:'×1.4 per CORRUPT card played this strike (multiplicative).',cost:22,multTrigger:'perCorruptCard',mult:1.4,rarity:'uncommon'},
  {id:'doomchoir',name:'Doom Choir',emoji:'🎵',effect:'×1.5 per same-role member on stage (multiplicative).',cost:24,multTrigger:'perSameRole',mult:1.5,rarity:'uncommon'},
  {id:'solosermon',name:'Solo Sermon',emoji:'🎙',effect:'×6.0 if EXACTLY 2 cards played this strike.',cost:26,multTrigger:'cards2exact',mult:6.0,rarity:'uncommon'},
  {id:'blackmassbell',name:'Black Mass Bell',emoji:'🔔',effect:'×2.5 if 3+ Riff Chains fired this strike.',cost:22,multTrigger:'chains3',mult:2.5,rarity:'uncommon'},
  {id:'ouroborospin',name:'Ouroboros Pin',emoji:'🐍',effect:'×1.3 per discarded card this strike (multiplicative).',cost:20,multTrigger:'perDiscardStrike',mult:1.3,rarity:'uncommon'},
  {id:'drummerstick',name:"Drummer's Stick",emoji:'🥁',effect:'×2.5 if your Drummer rolled DOUBLE TIME this fight.',cost:22,multTrigger:'doubleTimeRolled',mult:2.5,rarity:'uncommon'},
  {id:'fogmachine',name:'Fog Machine',emoji:'💨',effect:'×1.4 per stoned member. +20% run score per stoned at fight end.',cost:24,multTrigger:'perStoned',mult:1.4,scoreBumpPerStoned:0.20,rarity:'uncommon'},
  {id:'chromeskull',name:'Chrome Skull',emoji:'💀',effect:'×3 if exactly 1 member is alive at strike time.',cost:28,multTrigger:'lastMemberStanding',mult:3.0,rarity:'uncommon'},
  // ── NEW RARE-TIER (5) ─────────────────────────────────────────
  {id:'doomcrown',name:'The Doom Crown',emoji:'👑',effect:'×8 if all cards played this strike are SAME TYPE (min 3 cards).',cost:38,multTrigger:'allSameType',mult:8.0,rarity:'rare'},
  {id:'triplesixes',name:'Triple Sixes',emoji:'⛧',effect:'×3 per OTHER artifact equipped (max ×9 with full slots).',cost:35,multTrigger:'perOtherArtifact',mult:3.0,rarity:'rare'},
  {id:'luciferspact',name:"Lucifer's Pact",emoji:'😈',effect:'×4 if Lucifer is on stage. Run score ×1.3.',cost:40,multTrigger:'luciferOnStage',mult:4.0,scoreMult:1.3,rarity:'rare'},
  {id:'invertedpentacle',name:'Inverted Pentacle',emoji:'🜺',effect:'×5 if Corruption is exactly 100% (no over, no under).',cost:36,multTrigger:'corrupt100exact',mult:5.0,rarity:'rare'},
  {id:'blackgoat',name:'The Black Goat',emoji:'🐐',effect:'×2.0 always × ×1.3 per OTHER artifact owned. Stacks with Goat of Mendes.',cost:42,multTrigger:'goatStackOther',mult:2.0,rarity:'rare'},
  // ── UNLOCKABLE (kept) ─────────────────────────────────────────
  {id:'wardrums',name:'War Drums',emoji:'🪘',effect:'+1 Strike per fight permanently (5 Strikes instead of 4).',cost:30,locked:true,unlockAt:5000,reclassifiedToPedal:true},
]
export const MYTHIC_ARTIFACTS=[
  {id:'invertedcross',name:'The Inverted Cross',emoji:'✟',effect:'×69 damage if Corruption is exactly 100% AND no member is Too Stoned. Run score ×1.5.',cost:50,multTrigger:'corruptedClean',mult:69.0,scoreMult:1.5,rarity:'mythic',unlockId:'invertedCross',hint:'When the King of Hell falls before you for the first time...'},
  {id:'tongueofdevourer',name:'Tongue of the Devourer',emoji:'👅',effect:"Every card you play deals damage equal to your highest member's ATK. Stacks with all multipliers.",cost:50,multTrigger:'tongueDamage',mult:1.0,rarity:'mythic',unlockId:'tongueOfDevourer',hint:"Stand against the third circle's hunger without sacrifice."},
  {id:'sigilofset',name:'The Sigil of Set',emoji:'𓂀',effect:'First Strike of every fight, card+chain mults are auto-peaked (×4.31). Plus auto-×2 trip mult if no other trip is active. One-shot per fight.',cost:50,multTrigger:'sigilOpener',mult:4.31,rarity:'mythic',unlockId:'sigilOfSet',hint:'Walk the path alone. Burn through Hell with one voice.'},
]
export const CIRCLE_ARTIFACTS=[
  {id:'ca1',name:'The Goat of Mendes',emoji:'🐐',effect:'All Strikes deal ×1.5 damage. Stacks with other multipliers.',cost:28,multTrigger:'alwaysOn',mult:1.5,rarity:'rare'},
  // ca2 (Hellfire Amulet) RECLASSIFIED to pedal pool
  // ca3 (Sabbath Crown) RECLASSIFIED to pedal pool
  {id:'ca4',name:'Wailing Guitar',emoji:'🎸',effect:'First Strike each fight deals double damage.',cost:16,multTrigger:'firstStrikeOfFight',mult:2.0,rarity:'uncommon'},
  {id:'ca5',name:'Hellmouth Amplifier',emoji:'🌋',effect:'×5.0 damage when Corruption is 80%+. The sound of Hell itself.',cost:40,multTrigger:'corrupt80',mult:5.0,rarity:'rare'},
  {id:'ca6',name:'Void Engine',emoji:'🕳',effect:'×3.0 for each Too Stoned member. Feed the machine your bandmates.',cost:35,multTrigger:'perStoned',mult:3.0,rarity:'rare'},
]
export const STARTER_PASSIVES=[
  // ── ORIGINAL P1-P10 (kept, retagged with rarity) ──────────────
  {id:'p1',name:'Power Chord',emoji:'⚡',effect:'Gain 1 extra Ember at the start of every fight.',cost:6,rarity:'common'},
  {id:'p2',name:'Roadie Crew',emoji:'🔧',effect:'At the start of each fight, one random member heals 3 HP.',cost:8,rarity:'common'},
  {id:'p3',name:'Merch Table',emoji:'👕',effect:'After each fight victory, gain +2 bonus Stash.',cost:6,rarity:'common'},
  {id:'p4',name:'Feedback Hum',emoji:'🔊',effect:'All EMBER type cards give 1 additional Ember when played.',cost:10,rarity:'uncommon'},
  {id:'p5',name:'Amp Stack',emoji:'📻',effect:'Sound Wall gives +2 ATK permanently to all (instead of +1). Heavy Riff cap raised to +25 (instead of +20).',cost:10,rarity:'uncommon'},
  {id:'p6',name:'Cult Following',emoji:'🕯',effect:'Each time any member goes Too Stoned, gain 3 Stash.',cost:10,rarity:'common'},
  {id:'p7',name:'Guitar Tech',emoji:'🎛',effect:'Battle Cry gives +2 ATK permanently instead of +1.',cost:8,rarity:'common'},
  {id:'p8',name:'Green Room',emoji:'🛋',effect:'At the start of each fight, all members gain Stonewall (immune to first Too Stoned event).',cost:16,rarity:'uncommon'},
  {id:'p9',name:'Heavy Rotation',emoji:'🎚',effect:'When you draw a duplicate card into your hand, draw 1 extra card next Strike.',cost:10,rarity:'uncommon'},
  {id:'p10',name:'Stage Fright Reversal',emoji:'🎙',effect:'The first Strike of every fight deals +10 bonus damage.',cost:14,rarity:'common'},
  // ── RECLASSIFIED FROM ARTIFACTS (7) ───────────────────────────
  // Former a3, a4, a7, a8, ca2, ca3, wardrums — all utility/structural.
  {id:'a3',name:'The Evil Eye',emoji:'🧿',effect:'The first card you play each Strike costs 0 Embers.',cost:20,rarity:'rare',reclassified:true},
  {id:'a4',name:"Roadie's Toolbelt",emoji:'🧰',effect:'At the start of each fight, one random member gains Stonewall (immune to Too Stoned once).',cost:6,rarity:'common',reclassified:true},
  {id:'a7',name:"The Serpent's Kiss",emoji:'🐍',effect:'Start each fight with 1 extra Ember permanently (max 8 total).',cost:18,rarity:'uncommon',reclassified:true},
  {id:'a8',name:'Stone Tablet',emoji:'🪨',effect:'All band members gain +3 max HP permanently.',cost:12,rarity:'uncommon',reclassified:true},
  {id:'ca2',name:'Hellfire Amulet',emoji:'🔮',effect:'Gain +2 Embers at the start of each fight.',cost:17,rarity:'uncommon',reclassified:true},
  {id:'ca3',name:'Sabbath Crown',emoji:'👑',effect:'When a member goes Too Stoned, 50% chance to revive them at 1 HP.',cost:22,rarity:'rare',reclassified:true},
  {id:'wardrums',name:'War Drums',emoji:'🪘',effect:'+1 Strike per fight permanently (5 Strikes instead of 4).',cost:30,rarity:'rare',locked:true,unlockAt:5000,reclassified:true},
  // ── NEW COMMON PEDALS (8) ─────────────────────────────────────
  {id:'reverbtank',name:'Reverb Tank',emoji:'〰️',effect:'First card you play each Strike costs 1 less Ember (min 0).',cost:12,rarity:'common'},
  {id:'fuzzbox',name:'Fuzz Box',emoji:'🌫',effect:'All RIFF cards cost 1 less Ember.',cost:14,rarity:'common'},
  {id:'tunerpedal',name:'Tuner Pedal',emoji:'🎯',effect:'Discarding a card draws 1 immediately.',cost:12,rarity:'common'},
  {id:'wahpedal',name:'Wah Pedal',emoji:'🦶',effect:'First CORRUPT card each fight costs 0 Embers.',cost:12,rarity:'common'},
  {id:'volumeknob',name:'Volume Knob',emoji:'🔆',effect:'If you played 4+ cards last Strike, draw 1 extra next Strike.',cost:11,rarity:'common'},
  {id:'powerconditioner',name:'Power Conditioner',emoji:'🔌',effect:'Start each fight with +1 Ember.',cost:10,rarity:'common'},
  {id:'cabletester',name:'Cable Tester',emoji:'🪡',effect:'Duplicate cards cost 1 less Ember.',cost:12,rarity:'common'},
  {id:'drumthrone',name:'Drum Throne',emoji:'🪑',effect:'Drummer rolls d6 twice and picks higher result.',cost:14,rarity:'common'},
  // ── NEW UNCOMMON PEDALS (4) ───────────────────────────────────
  {id:'phaserpedal',name:'Phaser',emoji:'🌊',effect:'All CORRUPT cards cost 1 less Ember.',cost:18,rarity:'uncommon'},
  {id:'compressorpedal',name:'Compressor',emoji:'📊',effect:'If you play 4+ cards in a Strike, draw 1 next Strike AND gain 1 Ember.',cost:18,rarity:'uncommon'},
  {id:'octavepedal',name:'Octave Pedal',emoji:'🎼',effect:'First Riff Chain each fight fires twice (double mult).',cost:22,rarity:'uncommon'},
  {id:'sustainpedal',name:'Sustain Pedal',emoji:'🦶',effect:'Buffs from temp ATK cards last 1 extra Strike.',cost:20,rarity:'uncommon'},
  // ── NEW RARE PEDALS (3) ───────────────────────────────────────
  {id:'looperpedal',name:'The Looper',emoji:'♾️',effect:'First card each Strike replays at end of Strike (free).',cost:28,rarity:'rare'},
  {id:'bitcrusher',name:'Bit Crusher',emoji:'💥',effect:'Each card you discard gives +5% Corruption.',cost:26,rarity:'rare'},
  {id:'echoplex',name:'Echoplex',emoji:'🎚',effect:'When you play a card, 69% chance it triggers a second time at end of Strike (free). The god-tier pedal.',cost:42,rarity:'rare'},
]
export const MYTHIC_PEDALS=[
  {id:'witchssabbath',name:"The Witch's Sabbath",emoji:'🌑',effect:'First card each Strike replays THREE times instead of once. Looper × Echoplex on steroids.',cost:50,rarity:'mythic',unlockId:'witchsSabbath',hint:'Let the haze consume them all, and emerge victorious.'},
  {id:'theconduit',name:'The Conduit',emoji:'⚡',effect:'Start each fight at MAX Embers. All cards cost half (rounded down).',cost:50,rarity:'mythic',unlockId:'theConduit',hint:'Slay the King swiftly. Mercy is for the weak.'},
  {id:'tabletofazothoth',name:"Tablet of Az'Tothoth",emoji:'📜',effect:'First Riff Chain each fight permanently upgrades a random card for the rest of the run.',cost:50,rarity:'mythic',unlockId:'tabletOfAzothoth',hint:'Master every chain in a single descent.'},
]
export const BOSS_LOOT=[
  null, null,
  {id:'limbos_echo',name:"Limbo's Echo",emoji:'👁',desc:'×1.3 per Strike remaining when you hit.',effect:'multStrikesLeft',circle:1,mult:1.3,multTrigger:'perStrikesLeft'},
  null, null,
  {id:'love_letter',name:'Love Letter',emoji:'💋',desc:'First card each fight is free. ×1.2 if you play it.',effect:'freeFirst',circle:2,mult:1.2,multTrigger:'firstCardFree'},
  null, null,
  {id:'endless_hunger',name:'Endless Hunger',emoji:'🕳',desc:'×2.0 when your band has 4+ alive members.',effect:'mult4alive',circle:3,mult:2.0,multTrigger:'alive4'},
  null, null,
  {id:'golden_tooth',name:'Golden Tooth',emoji:'🪙',desc:'+5 Stash per boss kill. ×1.1 per 20 Stash.',effect:'stashBoss',circle:4,mult:1.1,multTrigger:'perStash20'},
  null, null,
  {id:'berserker_rage',name:"Berserker's Rage",emoji:'🔥',desc:'×2.5 if any member has 20+ ATK.',effect:'atk20mult',circle:5,mult:2.5,multTrigger:'memberAtk20'},
  null, null,
  {id:'heretics_brand',name:"Heretic's Brand",emoji:'⛧',desc:'×1.5 per corruption threshold passed (25/50/75/100).',effect:'corrThresholds',circle:6,mult:1.5,multTrigger:'perCorrThreshold'},
  null, null,
  {id:'the_blade',name:'The Blade',emoji:'🗡',desc:'×3.0 if you play exactly 1 card then Strike. Surgical.',effect:'singleCard',circle:7,mult:3.0,multTrigger:'cards1'},
  null, null,
  {id:'mask_of_lies',name:'Mask of Lies',emoji:'🎭',desc:'×1.2 per member with a different keyword on stage.',effect:'uniqueKeywords',circle:8,mult:1.2,multTrigger:'perUniqueKeyword'},
  null, null,
  null,
]
export const PACT_REWARDS=[
  {id:'ember_surge',name:'Ember Surge',emoji:'🔥',desc:'+1 max Embers permanently.',color:'#ff6600'},
  {id:'iron_strings',name:'Iron Strings',emoji:'🎸',desc:'All +1 ATK permanently.',color:'#ee2222'},
  {id:'thick_skin',name:'Thick Skin',emoji:'🛡',desc:'All +3 max HP permanently.',color:'#33dd33'},
  {id:'dark_bargain',name:'Dark Bargain',emoji:'🌑',desc:'All CORRUPT cards cost 1 less Ember.',color:'#cc44ff'},
  {id:'speed_demon',name:'Speed Demon',emoji:'⚡',desc:'Draw 1 extra card per Strike.',color:'#ffdd00'},
  {id:'blood_price',name:'Blood Price',emoji:'🩸',desc:'Blood Ritual deals 9× instead of 6×.',color:'#cc0000'},
  {id:'clean_living',name:'Clean Living',emoji:'✨',desc:'At fight start: all members +2 ATK and +2 HP.',color:'#ffffff'},
  {id:'corruption_engine',name:'Corruption Engine',emoji:'☠',desc:'+5% Corruption at start of each fight.',color:'#aa00ff'},
  {id:'merchants_eye',name:'Merchants Eye',emoji:'💰',desc:'All shop items cost 20% less.',color:'#44cc44'},
  {id:'stone_wall',name:'Stone Wall',emoji:'🧱',desc:'Members take 1 less damage per Strike (min 1).',color:'#8888aa'},
  {id:'sixth_slot',name:'Sixth Slot',emoji:'👥',desc:'+1 band member slot. Recruit at next shop.',color:'#e8a820'},
  {id:'war_drums',name:'War Drums',emoji:'🥁',desc:'+1 Strike per fight permanently.',color:'#dd2222'},
  {id:'atonement',name:'Atonement',emoji:'🕊',desc:'-15% Corruption after every boss kill.',color:'#88ccff'},
]
