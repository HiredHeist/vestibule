// Extracted from App.jsx (v0.8.0 split, depth-aware parser) — pure data.
export const ALL_CARDS=[
  {id:'amp',name:'Amp It Up',type:'RIFF',rarity:'Common',emoji:'⚡',embers:2,effect:'Target deals DOUBLE damage.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'dialtoeleven',name:'Dial to Eleven',type:'CORRUPT',rarity:'Common',emoji:'📻',embers:0,effect:'+10% Corruption. ALL members +3 ATK — the buff does NOT wear off.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'soundcheck',name:'Sound Check',type:'UTILITY',rarity:'Common',emoji:'🔊',embers:2,effect:'ALL +4 HP. Members that were hurt also get +1 ATK this Strike.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'sigdecay',name:'Signal Decay',type:'CORRUPT',rarity:'Common',emoji:'📡',embers:1,effect:'Discard 1, draw 2. Trade up.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'battlecry',name:'Battle Cry',type:'RIFF',rarity:'Common',emoji:'🤘',embers:1,effect:'Target: +1 ATK permanently.',color:'#9933cc',typeColor:'#7722aa',copies:4},
  {id:'roadie',name:'Roadie',type:'UTILITY',rarity:'Common',emoji:'🛡',embers:1,effect:'+2 HP. Stonewall shield (immune to KO for 2 strikes).',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'setlist',name:'Setlist',type:'UTILITY',rarity:'Common',emoji:'📋',embers:0,effect:'Draw up to 3, then discard 1 of your choice.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'groupie',name:'Groupie',type:'EMBER',rarity:'Uncommon',emoji:'🍯',embers:1,effect:'+2 Embers. Draw 1 card.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'demotape',name:'Demo Tape',type:'RIFF',rarity:'Common',emoji:'📼',embers:1,effect:'Replay your last RIFF card for free.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'newstrings',name:'New Strings',type:'RIFF',rarity:'Uncommon',emoji:'🎸',embers:2,effect:'+2 ATK permanently to target.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'encore',name:'Encore',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:2,effect:'Target attacks TWICE.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'wakeup',name:'Wake Up Call',type:'UTILITY',rarity:'Uncommon',emoji:'☕',embers:1,effect:'ALL +2 HP. Revives knocked-out members.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'feedbackloop',name:'Feedback Loop',type:'CORRUPT',rarity:'Uncommon',emoji:'🎛',embers:2,effect:'Target +2 ATK permanently. +4 instead at 50%+ Corruption.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'tappedout',name:'Tapped Out',type:'EMBER',rarity:'Uncommon',emoji:'🪙',embers:0,effect:'Gain 5 Embers at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'controlfeedback',name:'Controlled Feedback',type:'CORRUPT',rarity:'Uncommon',emoji:'🎚',embers:2,effect:'Reset Corruption to 50%. Fully heal target. A second chance.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'burnset',name:'Burn the Set',type:'RIFF',rarity:'Uncommon',emoji:'🔥',embers:0,effect:'Select up to 3 cards first, then play this to discard them and draw that many +1. (No selection = draw 1 card.)',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'soundwall',name:'Sound Wall',type:'RIFF',rarity:'Uncommon',emoji:'🔈',embers:2,effect:'+1 ATK permanently to ALL. The whole band gets louder.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'stagedive',name:'Stage Dive',type:'RIFF',rarity:'Rare',emoji:'🤘',embers:3,effect:'Deal damage equal to target HP. Once per round.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'overdrive',name:'Overdrive',type:'RIFF',rarity:'Rare',emoji:'💥',embers:3,effect:'Requires 60% Corruption. DOUBLE every member ATK this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:0,shopOnly:true,corrReq:60},
  {id:'infencore',name:'Infernal Encore',type:'RIFF',rarity:'Rare',emoji:'👿',embers:3,effect:'ALL members attack TWICE. Total carnage.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'remaster',name:'The Remaster',type:'UTILITY',rarity:'Rare',emoji:'🎙',embers:0,effect:'Select 1 card in hand, then play this to delete it and draw 3 cards.',color:'#22aa44',typeColor:'#118833',copies:0,shopOnly:true},
  // ── LEGACY "CORRUPTION GIFT" CARDS ───────────────────────────────────────
  // Aug 4 2026: these three still claimed to be the 25% / 50% / 75% Corruption
  // gifts. They are not, and have not been for some time — the thresholds hand out
  // CORRUPTION_CARDS (dark_whisper / blood_price / void_pact) at the bottom of this
  // file. The "Corruption gift at N%" clause described a mechanism that no longer
  // exists, so it is gone. They remain real, draftable cards (shop + booster pools
  // read getUnlockedCards() and do not filter on copies), just not gifts.
  // Text also corrected to what the code does: Hungering Flame draws NOTHING (live
  // passes drawUpTo a hand-size TARGET of 2 and throws the result away) and its
  // "+1 ATK this Strike" never expires (tempAtkBonus without tempBuff).
  {id:'whispercard',name:'Whispered Curse',type:'CORRUPT',rarity:'Rare',emoji:'🌀',embers:0,effect:'FREE. Target member +2 ATK permanently.',color:'#aa1111',typeColor:'#880000',copies:0},
  {id:'hungercard',name:'Hungering Flame',type:'CORRUPT',rarity:'Rare',emoji:'🔥',embers:0,effect:'FREE. ALL members +1 ATK — the buff does NOT wear off.',color:'#aa1111',typeColor:'#880000',copies:0},
  {id:'madnesscard',name:'Madness Unleashed',type:'CORRUPT',rarity:'Rare',emoji:'💀',embers:0,effect:'FREE. Deal damage equal to 15% of the boss MAX HP.',color:'#aa1111',typeColor:'#880000',copies:0},
  {id:'sabbathsigil',name:'Black Sabbath Sigil',type:'CORRUPT',rarity:'Rare',emoji:'⛧',embers:0,effect:'FREE. Corruption → 100%. Hellquake d10. Card is destroyed after use. EMBRACE THE VOID.',color:'#aa1111',typeColor:'#880000',copies:0,consumable:true,shopCost:20,shopOnly:true},
  {id:'possessedperf',name:'Possessed Performance',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:3,effect:'ALL members deal ×3 ATK. Full demon mode.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'crowdsurf',name:'Crowd Surf',type:'RIFF',rarity:'Common',emoji:'🏄',embers:2,effect:'Target gains +1 ATK permanently per card in hand. Big hands = big gains.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'doubledown',name:'Double Down',type:'RIFF',rarity:'Uncommon',emoji:'🎰',embers:1,effect:'The next card played this Strike costs 0 Embers.',color:'#9933cc',typeColor:'#7722aa',copies:2,shopOnly:true},
  {id:'deathriff',name:'Death Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'💀',embers:1,effect:'ALL members +2 ATK permanently. +10% Corruption.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'ampoverload',name:'Amp Overload',type:'EMBER',rarity:'Uncommon',emoji:'🔋',embers:0,effect:'+3 Embers. Costs 1 discard.',color:'#c87820',typeColor:'#a06010',copies:1},
  {id:'ampstatic',name:'Amp the Static',type:'CORRUPT',rarity:'Uncommon',emoji:'📶',embers:2,effect:'Target +2 ATK this Strike. +4 instead at 50%+ Corruption.',color:'#aa1111',typeColor:'#880000',copies:2},
  // ── NEW CARDS ──────────────────────────────────────────────────
  {id:'distortion',name:'Distortion',type:'CORRUPT',rarity:'Common',emoji:'🎸',embers:1,effect:'Corruption +15%. All members +1 ATK this Strike.',color:'#aa1111',typeColor:'#880000',copies:3},
  {id:'seance',name:'Séance',type:'CORRUPT',rarity:'Uncommon',emoji:'🔮',embers:1,effect:'Heal ALL members 3 HP. 6 HP instead at 50%+ Corruption.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'staticcharge',name:'Static Charge',type:'CORRUPT',rarity:'Common',emoji:'⚡',embers:0,effect:'Gain 2 Embers. Gain 4 instead if Corruption is 0%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'darktuning',name:'Dark Tuning',type:'CORRUPT',rarity:'Uncommon',emoji:'🌑',embers:2,effect:'Needs ≥40% Corruption. 2 random members +1 ATK permanently. 3 members at 70%+.',color:'#aa1111',typeColor:'#880000',copies:2,corrReq:40},
  {id:'powertap',name:'Power Tap',type:'EMBER',rarity:'Common',emoji:'🔌',embers:0,effect:'Gain 2 Embers.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'soundboard',name:'Soundboard',type:'EMBER',rarity:'Uncommon',emoji:'🎛',embers:1,effect:'Gain 2 Embers. Draw 1 extra card at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'setbreak',name:'Smoke Break',type:'UTILITY',rarity:'Common',emoji:'🎼',embers:0,effect:'Select 1 card first, then play to discard it. Gain 3 Embers. -15% Corruption. (Random card if no selection.)',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'heavyriff',name:'Heavy Riff',type:'RIFF',rarity:'Uncommon',emoji:'🥊',embers:2,effect:'ONCE per member per fight. Target gains +ATK perm equal to HALF target current ATK (max +20). The stronger they are, the harder this hits.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'resonancecard',name:'Resonance',type:'RIFF',rarity:'Uncommon',emoji:'🌀',embers:1,effect:'Target member ATK becomes the highest ATK on stage — this Strike only.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'herbmoney',name:'Herb Money',type:'RIFF',rarity:'Uncommon',emoji:'🌿',embers:1,effect:'Spend 10 Stash. Target +3 ATK permanently. Cash into power.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'goingbroke',name:'Going Broke',type:'RIFF',rarity:'Rare',emoji:'💸',embers:0,effect:'Spend ALL your Stash. Deal that much damage to the boss.',color:'#9933cc',typeColor:'#7722aa',copies:0,shopOnly:true},
  // ── UNLOCKABLE CARDS ───────────────────────────────────────────
  {id:'moshpit',name:'Mosh Pit',type:'RIFF',rarity:'Uncommon',emoji:'🤘',embers:1,effect:'+1 ATK permanently to ALL alive members. 4+ alive = +2 each.',color:'#9933cc',typeColor:'#7722aa',copies:2,locked:true,unlockAt:1000},
  {id:'bloodritual',name:'Blood Ritual',type:'CORRUPT',rarity:'Rare',emoji:'🩸',embers:2,effect:'Sacrifice 25% of target HP. Deal 6x that HP as damage to the boss. Corruption +15%.',color:'#aa1111',typeColor:'#880000',copies:1,locked:true,unlockAt:10000},
  // ── NEW CARDS (for alternate decks, copies:0 = not in Standard) ──
  // Aug 4 2026 — DIFFERENTIATED PAIR. echopedal and riffthief share ONE handler in
  // both src/App.jsx and cardEngine.js (copyLastPlayed): they are the same card.
  // riffthief was the RARE one at 2 embers vs echopedal's Uncommon 1 — strictly
  // worse, so the Rare was never worth drafting. Split on cost, which is data and
  // therefore fixable without touching applyCard: Echo Pedal is the 1-ember
  // Uncommon, Riff Thief is the FREE Rare. (Making their EFFECTS differ needs an
  // App.jsx change — listed under LIVE-SIDE FIXES NEEDED.)
  {id:'echopedal',name:'Echo Pedal',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:1,effect:'Copy the last card you played into your hand. The next card you play is FREE.',color:'#4488ff',typeColor:'#2266cc',copies:0},
  {id:'riffthief',name:'Riff Thief',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:0,effect:'FREE. Copy the last card you played into your hand. The next card you play is FREE too.',color:'#cc44ff',typeColor:'#aa22dd',copies:0},
  {id:'feedbackscream',name:'Feedback Scream',type:'RIFF',rarity:'Uncommon',emoji:'📢',embers:2,effect:'+4 ATK permanently. Costs 2 HP. Power at a price.',color:'#ff4444',typeColor:'#cc2222',copies:0},
  {id:'skullsplitter',name:'Skull Splitter',type:'RIFF',rarity:'Uncommon',emoji:'💀',embers:2,effect:'+3 ATK permanently. 10+ ATK target? +5 instead.',color:'#cc2222',typeColor:'#aa0000',copies:0},
  {id:'doomchord',name:'Doom Chord',type:'RIFF',rarity:'Uncommon',emoji:'🎵',embers:2,effect:'+4 ATK this Strike. At 50%+ Corruption, adjacent members get +4 too.',color:'#6622aa',typeColor:'#440088',copies:0},
  {id:'bloodharmony',name:'Blood Harmony',type:'RIFF',rarity:'Common',emoji:'🩸',embers:1,effect:'+2 ATK this Strike to the target AND both neighbours.',color:'#cc4466',typeColor:'#aa2244',copies:0},
  {id:'sonicboom',name:'Sonic Boom',type:'RIFF',rarity:'Rare',emoji:'💥',embers:3,effect:'ALL members +2 ATK this Strike. Draw 1.',color:'#ff8800',typeColor:'#cc6600',copies:0},
  {id:'tremolopick',name:'Tremolo Pick',type:'RIFF',rarity:'Common',emoji:'⚡',embers:1,effect:'+1 ATK this Strike. +4 instead if you already played 3+ cards.',color:'#ffcc00',typeColor:'#ccaa00',copies:0},
  {id:'harmonicfb',name:'Harmonic Feedback',type:'RIFF',rarity:'Uncommon',emoji:'🎶',embers:0,effect:'FREE. +1 ATK permanently per RIFF played this Strike (minimum +1).',color:'#44aaff',typeColor:'#2288dd',copies:0},
  // Aug 4 2026 — DIFFERENTIATED PAIR. shredsolo's only effect is `encoreReady=true`
  // — byte-identical to Encore (Uncommon, 2 embers) — while its text promised a
  // half-ATK second hit nothing implements. Text corrected above; the Rare now
  // earns its slot by costing 1 instead of 2, i.e. Encore at a discount. (A genuine
  // half-ATK second hit needs an App.jsx change — see LIVE-SIDE FIXES NEEDED.)
  {id:'shredsolo',name:'Shred Solo',type:'RIFF',rarity:'Rare',emoji:'🎸',embers:1,effect:'Target attacks TWICE this Strike. Both hits at full ATK.',color:'#ff4400',typeColor:'#cc2200',copies:0},
  {id:'overdriveped',name:'Overdrive Pedal',type:'RIFF',rarity:'Rare',emoji:'🔊',embers:2,effect:'Strike multiplier ×1.5 (multiplicative). Stacks with chains.',color:'#ff6600',typeColor:'#cc4400',copies:0},
  {id:'devilsdice',name:"Devil's Dice",type:'RIFF',rarity:'Uncommon',emoji:'🎲',embers:1,effect:'Roll d6. 1-2: nothing. 3-4: ALL +3 ATK this Strike. 5-6: ALL +5 ATK this Strike + draw 2.',color:'#cc0000',typeColor:'#aa0000',copies:0},
  {id:'necroticamp',name:'Necrotic Amp',type:'RIFF',rarity:'Rare',emoji:'☠️',embers:0,effect:'FREE. ALL +1 ATK this Strike per 20% Corruption. At 80% = +4 each.',color:'#44cc44',typeColor:'#22aa22',copies:0},
  {id:'soulbargain',name:'Soul Bargain',type:'CORRUPT',rarity:'Uncommon',emoji:'👿',embers:0,effect:'+5 ATK this Strike. -3 HP. +5% Corruption. Blood for power.',color:'#8800cc',typeColor:'#6600aa',copies:0},
  {id:'venomriff',name:'Venom Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'🐍',embers:1,effect:'+3 ATK permanently. +5% Corruption.',color:'#44aa44',typeColor:'#228822',copies:0},
  {id:'offeringpit',name:'Offering to the Pit',type:'CORRUPT',rarity:'Rare',emoji:'🕳️',embers:2,effect:'A random OTHER member gets +8 ATK this Strike. Corruption +10%.',color:'#660066',typeColor:'#440044',copies:0},
  {id:'cursedstrings',name:'Cursed Strings',type:'CORRUPT',rarity:'Common',emoji:'🪡',embers:1,effect:"+6 ATK this Strike. That member can't be healed this fight.",color:'#880088',typeColor:'#660066',copies:0},
  {id:'hexdecay',name:'Hex of Decay',type:'CORRUPT',rarity:'Rare',emoji:'🦠',embers:3,effect:'Boss loses 15% of current HP. +15% Corruption.',color:'#448844',typeColor:'#226622',copies:0},
  {id:'infernalpact',name:'Infernal Pact',type:'CORRUPT',rarity:'Rare',emoji:'📜',embers:0,effect:'FREE. Set corruption to 66%. All members +2 ATK permanently.',color:'#cc4400',typeColor:'#aa2200',copies:0},
  {id:'carrioncall',name:'Carrion Call',type:'CORRUPT',rarity:'Rare',emoji:'🦅',embers:1,effect:'Revive a Too Stoned member at 1 HP with +5 ATK. Corruption +20%.',color:'#886622',typeColor:'#664400',copies:0},
  {id:'possessionriff',name:'Possession Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'👁️',embers:1,effect:'+20 ATK this strike. +10% Corruption. Demon mode.',color:'#aa44cc',typeColor:'#8822aa',copies:0},

  {id:'hellfirerift',name:'Hellfire Rift',type:'CORRUPT',rarity:'Rare',emoji:'🌋',embers:0,effect:'FREE. ALL members ×2 ATK this strike. +20% corruption. Go nuclear.',color:'#ff2200',typeColor:'#cc0000',copies:0,shopOnly:true},
  {id:'soulsacrifice',name:'Soul Sacrifice',type:'CORRUPT',rarity:'Rare',emoji:'⚰️',embers:0,effect:'+5 ATK to ALL permanently. +15% Corruption.',color:'#880044',typeColor:'#660022',copies:0,shopOnly:true},
  {id:'voidpact',name:'Pact of the Void',type:'CORRUPT',rarity:'Rare',emoji:'🕳',embers:0,effect:'FREE. Strike multiplier ×2.5 this strike ONLY. +25% corruption. Total commitment.',color:'#440088',typeColor:'#220044',copies:0,shopOnly:true},
  {id:'darkcrescendo',name:'Dark Crescendo',type:'CORRUPT',rarity:'Rare',emoji:'🌑',embers:0,effect:'FREE. If corruption ≥80%, TRIPLE your strike multiplier.',color:'#220044',typeColor:'#110022',copies:0},
  {id:'russianroulette',name:'Russian Roulette',type:'CORRUPT',rarity:'Uncommon',emoji:'🔫',embers:0,effect:'FREE. Roll d6. 1: target goes Too Stoned. 2-5: +4 ATK this Strike. 6: +8 ATK this Strike + Shield.',color:'#cc2244',typeColor:'#aa0022',copies:0},
  {id:'gearcheck',name:'Gear Check',type:'UTILITY',rarity:'Common',emoji:'🔧',embers:1,effect:'Draw 2 cards.',color:'#888888',typeColor:'#666666',copies:0},
  // ⚠ LIVE NO-OP: applyCard's whole body for this card is a log line — there is no
  // deck-peek or reorder UI anywhere in src/App.jsx. Kept in the data (removing it
  // would change deck manifests) but it does nothing. See LIVE-SIDE FIXES NEEDED.
  {id:'setlistrewrite',name:'Setlist Rewrite',type:'UTILITY',rarity:'Common',emoji:'📝',embers:0,effect:'FREE. Look at top 3 of your deck; discard the costliest, keep 2 on top.',color:'#88aacc',typeColor:'#6688aa',copies:0},
  {id:'backstagepass',name:'Backstage Pass',type:'UTILITY',rarity:'Uncommon',emoji:'🎫',embers:2,effect:'Next card is FREE. Draw 1.',color:'#ccaa44',typeColor:'#aa8822',copies:0},
  {id:'venueswap',name:'Venue Swap',type:'UTILITY',rarity:'Uncommon',emoji:'🏟️',embers:1,effect:'Shuffle hand away. Draw 6 fresh cards.',color:'#4488aa',typeColor:'#226688',copies:0},
  {id:'doublebooking',name:'Double Booking',type:'UTILITY',rarity:'Rare',emoji:'📅',embers:3,effect:'+1 extra Strike this fight. Game changer.',color:'#ff8844',typeColor:'#dd6622',copies:0},
  {id:'bootlegcopy',name:'Bootleg Copy',type:'UTILITY',rarity:'Uncommon',emoji:'📀',embers:1,effect:'Copy the first other card in your hand. The copy joins your deck.',color:'#44cccc',typeColor:'#22aaaa',copies:0},
  {id:'secondwind',name:'Second Wind',type:'EMBER',rarity:'Common',emoji:'💨',embers:0,effect:'Gain embers equal to your empty ember slots. Better when depleted.',color:'#cc8844',typeColor:'#aa6622',copies:0},
  {id:'pyromaniac',name:'Pyromaniac',type:'EMBER',rarity:'Uncommon',emoji:'🧨',embers:1,effect:'+2 embers. If you spend ALL embers this strike, all members +3 ATK.',color:'#ff4400',typeColor:'#dd2200',copies:0},
  {id:'slowburn',name:'Slow Burn',type:'EMBER',rarity:'Common',emoji:'🕯️',embers:0,effect:'+1 ember now. +1 ember at start of next 2 strikes. Delayed investment.',color:'#ff8866',typeColor:'#dd6644',copies:0},
  {id:'ampfeedback',name:'Amp Feedback',type:'EMBER',rarity:'Common',emoji:'🔌',embers:1,effect:'+2 Embers. Next RIFF costs 1 less.',color:'#88cc44',typeColor:'#66aa22',copies:0},
  {id:'drainthecrowd',name:'Drain the Crowd',type:'EMBER',rarity:'Common',emoji:'🧛',embers:0,effect:'+2 Embers. A random member loses 2 HP (never below 1).',color:'#aa2244',typeColor:'#880022',copies:0},
  {id:'corrsiphon',name:'Corruption Siphon',type:'EMBER',rarity:'Common',emoji:'🌀',embers:0,effect:'+3 Embers. +8% Corruption.',color:'#8844aa',typeColor:'#662288',copies:0},
]
// ── CARD UPGRADES (Doom Forge, ⛧ gold cards) ────────────────────────────────
// Aug 4 2026 — REWRITTEN AGAINST THE CODE. Every desc below used to describe an
// upgrade that was never implemented: max-HP grants that nothing reads (the `hp`
// / `hpAmt` fields were dead metadata — src/App.jsx only ever renders `.desc` and
// uses key-presence to decide what is upgradeable), damage numbers for cards that
// deal no damage, and "was X" baselines that were already the base behaviour.
// `upgraded` is honoured by EXACTLY nine cards in src/App.jsx applyCard (mirrored
// in src/data/cardEngine.js): battlecry, crowdsurf, heavyriff, herbmoney,
// soundwall, dialtoeleven, bloodritual, setlist, overdrive. Every other entry is a
// COSMETIC upgrade — gold border, mastery credit, no rules change — and now says
// so instead of promising an effect the player will never get.
// KEEP EVERY KEY: App.jsx (~6249, ~10323) uses presence in this table to decide
// which cards the Forge may offer. Deleting a key removes the card from the Forge.
export const CARD_UPGRADES={
  // ── REAL upgrades (the code branches on `upgraded`) ──
  battlecry:{desc:'+2 ATK permanently (was +1).'},
  crowdsurf:{desc:'+1 extra ATK on top of the per-card bonus.'},
  heavyriff:{desc:'+2 extra ATK on top of the half-ATK bonus.'},
  herbmoney:{desc:'+4 ATK permanently (was +3).'},
  soundwall:{desc:'+2 ATK permanently to ALL (was +1).'},
  dialtoeleven:{desc:'ALL members +4 ATK (was +3).'},
  bloodritual:{desc:'8x sacrificed HP as damage (was 6x).'},
  setlist:{desc:'Draw up to 4 (was 3).'},
  overdrive:{desc:'Only needs 50% Corruption (was 60%).'},
  // ── COSMETIC upgrades (no rules change — the card ignores `upgraded`) ──
  amp:{desc:'Gold foil. No rules change.'},
  newstrings:{desc:'Gold foil. No rules change.'},
  encore:{desc:'Gold foil. No rules change.'},
  resonancecard:{desc:'Gold foil. No rules change.'},
  stagedive:{desc:'Gold foil. No rules change.'},
  infencore:{desc:'Gold foil. No rules change.'},
  possessedperf:{desc:'Gold foil. No rules change.'},
  moshpit:{desc:'Gold foil. No rules change.'},
  demotape:{desc:'Gold foil. No rules change.'},
  burnset:{desc:'Gold foil. No rules change.'},
  goingbroke:{desc:'Gold foil. No rules change.'},
  doubledown:{desc:'Gold foil. No rules change.'},
  distortion:{desc:'Gold foil. No rules change.'},
  deathriff:{desc:'Gold foil. No rules change.'},
  feedbackloop:{desc:'Gold foil. No rules change.'},
  ampstatic:{desc:'Gold foil. No rules change.'},
  darktuning:{desc:'Gold foil. No rules change.'},
  sigdecay:{desc:'Gold foil. No rules change.'},
  controlfeedback:{desc:'Gold foil. No rules change.'},
  sabbathsigil:{desc:'Gold foil. No rules change.'},
  seance:{desc:'Gold foil. No rules change.'},
  soundcheck:{desc:'Gold foil. No rules change.'},
  roadie:{desc:'Gold foil. No rules change.'},
  wakeup:{desc:'Gold foil. No rules change.'},
  setbreak:{desc:'Gold foil. No rules change.'},
  remaster:{desc:'Gold foil. No rules change.'},
  powertap:{desc:'Gold foil. No rules change.'},
  staticcharge:{desc:'Gold foil. No rules change.'},
  tappedout:{desc:'Gold foil. No rules change.'},
  ampoverload:{desc:'Gold foil. No rules change.'},
  groupie:{desc:'Gold foil. No rules change.'},
  soundboard:{desc:'Gold foil. No rules change.'},
}
export const RIFF_CHAINS=[
  {id:'shred_storm',name:'SHRED STORM',cards:['resonancecard','infencore'],color:'#ffdd00',emoji:'⚡'},
  {id:'hellfire',name:'HELLFIRE',cards:['darktuning','overdrive'],color:'#ff4400',emoji:'🔥'},
  {id:'blood_pact',name:'BLOOD PACT',cards:['bloodritual','wakeup'],color:'#cc0000',emoji:'🩸'},
  {id:'triple_threat',name:'TRIPLE THREAT',cards:['possessedperf','encore'],color:'#ff00ff',emoji:'👿'},
  {id:'soul_harvest',name:'SOUL HARVEST',cards:['distortion','feedbackloop'],color:'#aa00ff',emoji:'💀'},
  {id:'death_wish',name:'DEATH WISH',cards:['battlecry','stagedive'],color:'#ff2222',emoji:'☠'},
  {id:'eternal_encore',name:'ETERNAL ENCORE',cards:['encore','infencore'],color:'#ff8800',emoji:'🔁'},
  {id:'clean_machine',name:'CLEAN MACHINE',cards:['staticcharge','deathriff'],color:'#ffffff',emoji:'✨'},
  {id:'wall_of_sound',name:'WALL OF SOUND',cards:['soundwall','amp'],color:'#4488ff',emoji:'🔊'},
  {id:'feedback_hell',name:'FEEDBACK HELL',cards:['feedbackloop','ampstatic'],color:'#cc44ff',emoji:'🎛'},
  {id:'mosh_madness',name:'MOSH MADNESS',cards:['moshpit','battlecry'],color:'#44ff44',emoji:'🤘'},
  {id:'dark_sacrifice',name:'DARK SACRIFICE',cards:['bloodritual','seance'],color:'#880044',emoji:'🔮'},
  {id:'noise_gate',name:'NOISE GATE',cards:['burnset','groupie'],color:'#ffaa00',emoji:'🎸'},
  {id:'power_surge',name:'POWER SURGE',cards:['powertap','newstrings'],color:'#ff6600',emoji:'🔌'},
  {id:'demon_core',name:'DEMON CORE',cards:['sabbathsigil','overdrive'],color:'#ff0044',emoji:'⛧'},
  {id:'last_stand',name:'LAST STAND',cards:['stagedive','wakeup'],color:'#00ddff',emoji:'💪'},
]
// ── CORRUPTION GIFTS ────────────────────────────────────────────────────────
// The cards actually handed out when Corruption crosses 25% / 50% / 75%.
// Aug 4 2026:
//   * added `copies` (0 — they are gifts, never in a starting deck). Every other
//     card in the game carries the field; these three did not, so any code doing
//     `c.copies>0` or summing copies read `undefined` on exactly these three.
//   * NAME COLLISIONS FIXED. Two different cards displayed "Dark Whisper"
//     (dark_whisper here and whispercard in ALL_CARDS) and two displayed
//     "Void Pact" (void_pact here and voidpact in ALL_CARDS). These three are the
//     canonical gift names; the ALL_CARDS entries were renamed instead.
//   * text corrected: the 25% and 75% gifts write tempAtkBonus WITHOUT tempBuff,
//     so their "this Strike" buffs never expire (cardEngine IMPL.dark_whisper /
//     IMPL.void_pact). The text now says what happens.
export const CORRUPTION_CARDS={
  25:{id:'dark_whisper',name:'Dark Whisper',type:'CORRUPT',rarity:'Common',emoji:'👁',embers:0,effect:'FREE. Target +2 ATK — the buff does NOT wear off. +5% Corruption.',color:'#aa1111',typeColor:'#880000',copies:0},
  50:{id:'blood_price',name:'Blood Price',type:'CORRUPT',rarity:'Uncommon',emoji:'🩸',embers:0,effect:'FREE. Target +4 ATK permanently. -3 HP to that member.',color:'#aa1111',typeColor:'#880000',copies:0},
  75:{id:'void_pact',name:'Void Pact',type:'CORRUPT',rarity:'Rare',emoji:'🌀',embers:0,effect:'FREE. ALL members +2 ATK — the buff does NOT wear off. +10% Corruption.',color:'#aa1111',typeColor:'#880000',copies:0},
}
