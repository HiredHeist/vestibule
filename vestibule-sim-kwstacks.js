#!/usr/bin/env node
import{readFileSync}from'fs'
// vestibule-sim.js v19.1 — Expert AI Simulator for Vestibule
// Session 16 — +Immediate draws, 15-card loop — +Events, Corruption Thresholds, Blood Oath: ALL mechanics (artifacts, passives, loot, combos, multiplier, hellquake)
// KEYWORD STACK BONUSES VARIANT — same as v19.1 + per-keyword stack tier bonuses applied at strike time.
// Stack tiers: 1 stack = ×1, 2 stacks = ×2, 3+ stacks = ×4 (slot-machine compounding)
// Foil members count as 2 stacks. Mythic members count as 1 stack but unlock unique signatures (not modeled here).
// Usage: node vestibule-sim-kwstacks.js [numGames] [stake]  (default 5000 bronze)

const NUM_GAMES=parseInt(process.argv[2])||5000;
const STAKE_ID=process.argv[3]||'bronze';
const DECK_ID=process.argv[4]||'standard';
const HP_OVERRIDE=parseFloat(process.argv[5])||0;
let BOSS_HP_OVERRIDE=null;
// Try repo root first (committed file with current live HPs), then /tmp (legacy/manual override)
try{BOSS_HP_OVERRIDE=JSON.parse(readFileSync('./boss_hp_override.json','utf8'))}catch(e){
  try{BOSS_HP_OVERRIDE=JSON.parse(readFileSync('/tmp/boss_hp_override.json','utf8'))}catch(e2){}
}
// Strip the _comment field if present so it doesn't pollute keyed lookups
if(BOSS_HP_OVERRIDE&&BOSS_HP_OVERRIDE._comment)delete BOSS_HP_OVERRIDE._comment;
const STAKES={
  bronze:{id:'bronze',name:'Bronze',hpMult:1.30,dmgAdd:0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,scoreMult:1.0,mentorBonus:0},
  silver:{id:'silver',name:'Silver',hpMult:1.30,dmgAdd:2,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,scoreMult:1.5,mentorBonus:0.05},
  gold:{id:'gold',name:'Gold',hpMult:1.43,dmgAdd:3,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,scoreMult:2.0,mentorBonus:0.05},
  obsidian:{id:'obsidian',name:'Obsidian',hpMult:1.73,dmgAdd:2,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:false,scoreMult:2.5,mentorBonus:0.12},
  blood:{id:'blood',name:'Blood',hpMult:2.05,dmgAdd:2,maxStrikes:4,startEmbers:4,startCorruption:10,healAfterFight:true,scoreMult:3.0,mentorBonus:0.20},
  demonic:{id:'demonic',name:'Demonic ⛧',hpMult:1.8,dmgAdd:4,maxStrikes:3,startEmbers:4,startCorruption:15,healAfterFight:false,scoreMult:4.0,mentorBonus:0.75}
};
const STAKE=STAKES[STAKE_ID]||STAKES.bronze;
if(HP_OVERRIDE>0)STAKE.hpMult=HP_OVERRIDE;

const ENEMIES=[
  {id:'wanderer',name:'Wanderer',maxHp:65,baseDmg:4,passiveId:null},
  {id:'lostsoul',name:'Lost Soul',maxHp:95,baseDmg:5,passiveId:null},
  {id:'drifter',name:'Drifter',maxHp:140,baseDmg:7,passiveId:null},
  {id:'siren',name:'Siren',maxHp:145,baseDmg:5,passiveId:'selfbuff'},
  {id:'tempter',name:'Tempter',maxHp:210,baseDmg:6,passiveId:'selfbuff'},
  {id:'lust_boss',name:'Seducer',maxHp:310,baseDmg:7,passiveId:'selfbuff2'},
  {id:'glutton',name:'Glutton',maxHp:200,baseDmg:5,passiveId:'cardHeal3b'},
  {id:'feaster',name:'Feaster',maxHp:280,baseDmg:6,passiveId:'cardHeal5'},
  {id:'gluttony_boss',name:'Devourer',maxHp:380,baseDmg:7,passiveId:'cardHeal8'},
  {id:'miser',name:'Miser',maxHp:280,baseDmg:4,passiveId:'stashSteal'},
  {id:'hoarder',name:'Hoarder',maxHp:350,baseDmg:5,passiveId:'stashSteal2'},
  {id:'greed_boss',name:'Usurer',maxHp:580,baseDmg:6,passiveId:'stashSteal3'},
  {id:'wrathful',name:'Wrathful',maxHp:380,baseDmg:5,passiveId:'selfImmolate'},
  {id:'berserker',name:'Berserker',maxHp:440,baseDmg:6,passiveId:'bloodlust'},
  {id:'anger_boss',name:'Warlord',maxHp:580,baseDmg:7,passiveId:'commands'},
  {id:'heretic',name:'Heretic',maxHp:480,baseDmg:5,passiveId:'corruptPlayer'},
  {id:'apostate',name:'Apostate',maxHp:580,baseDmg:6,passiveId:'corruptPlayer15'},
  {id:'heresy_boss',name:'False Prophet',maxHp:800,baseDmg:7,passiveId:'corruptPlayer20'},
  {id:'brute',name:'Brute',maxHp:580,baseDmg:6,passiveId:'targetHighestHp'},
  {id:'hunter',name:'Hunter',maxHp:780,baseDmg:7,passiveId:'targetHighestHp2'},
  {id:'violence_boss',name:'Executioner',maxHp:1050,baseDmg:8,passiveId:'targetHighestHp3'},
  {id:'trickster',name:'Trickster',maxHp:750,baseDmg:6,passiveId:'fraudShuffle'},
  {id:'deceiver',name:'Deceiver',maxHp:900,baseDmg:7,passiveId:'fraudShuffle2'},
  {id:'fraud_boss',name:'Archfraud',maxHp:1150,baseDmg:8,passiveId:'fraudShuffle3'},
  {id:'traitor',name:'Traitor',maxHp:1100,baseDmg:6,passiveId:'paranoia'},
  {id:'betrayer',name:'Betrayer',maxHp:1100,baseDmg:7,passiveId:'soulThief'},
  {id:'lucifer',name:'LUCIFER',maxHp:6666,baseDmg:9,passiveId:'luciferBoss'},
];

const ALL_MUSICIANS=[
  {id:'bjorn',role:'Lead Guitarist',name:'Bjorn',atk:5,hp:6,maxHp:6,keyword:'FRENZIED'},
  {id:'ragnar',role:'Lead Guitarist',name:'Ragnar',atk:4,hp:7,maxHp:7,keyword:'FRENZIED'},
  {id:'thor',role:'Drummer',name:'Thor',atk:0,hp:8,maxHp:8,keyword:'DOUBLE TIME'},
  {id:'ingrid',role:'Bass Player',name:'Ingrid',atk:3,hp:10,maxHp:10,keyword:'ANCHOR'},
  {id:'loki',role:'Synth Player',name:'Loki',atk:3,hp:6,maxHp:6,keyword:'CORRUPT'},
  {id:'grimnir',role:'Vocalist',name:'Grimnir',atk:2,hp:7,maxHp:7,keyword:'DEBUFF'},
  {id:'dag',role:'Bass Player',name:'Dag',atk:2,hp:12,maxHp:12,keyword:'ANCHOR'},
  {id:'vitalik',role:'Dark Minstrel',name:'Vitalik',atk:6,hp:9,maxHp:9,keyword:'FOLK MAGIC'},
  {id:'sigrid',role:'Rhythm Guitarist',name:'Sigrid',atk:3,hp:8,maxHp:8,keyword:'SHREDDER'},
  {id:'gunnar',role:'Rhythm Guitarist',name:'Gunnar',atk:4,hp:7,maxHp:7,keyword:'SHREDDER'},
  {id:'astrid',role:'Vocalist',name:'Astrid',atk:3,hp:8,maxHp:8,keyword:'DEBUFF'},
  {id:'freya',role:'Synth Player',name:'Freya',atk:4,hp:5,maxHp:5,keyword:'CORRUPT'},
  {id:'ulf',role:'Bass Player',name:'Ulf',atk:4,hp:9,maxHp:9,keyword:'ANCHOR'},
  {id:'brynja',role:'Bass Player',name:'Brynja',atk:1,hp:14,maxHp:14,keyword:'ANCHOR'},
  {id:'rolf',role:'Drummer',name:'Rolf',atk:1,hp:9,maxHp:9,keyword:'DOUBLE TIME'},
  {id:'orm',role:'Dark Minstrel',name:'Orm',atk:2,hp:11,maxHp:11,keyword:'HEXED'},
];

const ALL_CARDS=[
  {id:'amp',type:'RIFF',rarity:'Common',embers:2,copies:2},
  {id:'dialtoeleven',type:'CORRUPT',rarity:'Common',embers:0,copies:2},
  {id:'soundcheck',type:'UTILITY',rarity:'Common',embers:2,copies:2},
  {id:'sigdecay',type:'CORRUPT',rarity:'Common',embers:1,copies:1},
  {id:'battlecry',type:'RIFF',rarity:'Common',embers:2,copies:4},
  {id:'roadie',type:'UTILITY',rarity:'Common',embers:1,copies:2},
  {id:'setlist',type:'UTILITY',rarity:'Common',embers:0,copies:2},
  {id:'groupie',type:'EMBER',rarity:'Uncommon',embers:1,copies:2},
  {id:'demotape',type:'RIFF',rarity:'Common',embers:1,copies:1},
  {id:'distortion',type:'CORRUPT',rarity:'Common',embers:1,copies:3},
  {id:'staticcharge',type:'CORRUPT',rarity:'Common',embers:0,copies:2},
  {id:'powertap',type:'EMBER',rarity:'Common',embers:0,copies:2},
  {id:'setbreak',type:'UTILITY',rarity:'Common',embers:0,copies:2},
  {id:'crowdsurf',type:'RIFF',rarity:'Common',embers:2,copies:2},
  {id:'newstrings',type:'RIFF',rarity:'Uncommon',embers:2,copies:2},
  {id:'encore',type:'RIFF',rarity:'Uncommon',embers:2,copies:3},
  {id:'wakeup',type:'UTILITY',rarity:'Uncommon',embers:1,copies:2},
  {id:'feedbackloop',type:'CORRUPT',rarity:'Uncommon',embers:2,copies:1},
  {id:'tappedout',type:'EMBER',rarity:'Uncommon',embers:0,copies:2},
  {id:'controlfeedback',type:'CORRUPT',rarity:'Uncommon',embers:2,copies:1},
  {id:'burnset',type:'RIFF',rarity:'Uncommon',embers:0,copies:1},
  {id:'soundwall',type:'RIFF',rarity:'Uncommon',embers:2,copies:1},
  {id:'doubledown',type:'RIFF',rarity:'Uncommon',embers:1,copies:2,shopOnly:true},
  {id:'deathriff',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:2},
  {id:'ampoverload',type:'EMBER',rarity:'Uncommon',embers:0,copies:1},
  {id:'ampstatic',type:'CORRUPT',rarity:'Uncommon',embers:2,copies:2},
  {id:'seance',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:1},
  {id:'soundboard',type:'EMBER',rarity:'Uncommon',embers:1,copies:1},
  {id:'heavyriff',type:'RIFF',rarity:'Uncommon',embers:2,copies:2},
  {id:'resonancecard',type:'RIFF',rarity:'Uncommon',embers:1,copies:3},
  {id:'herbmoney',type:'RIFF',rarity:'Uncommon',embers:1,copies:1},
  {id:'darktuning',type:'CORRUPT',rarity:'Uncommon',embers:3,copies:2},
  {id:'stagedive',type:'RIFF',rarity:'Rare',embers:4,copies:2},
  {id:'overdrive',type:'RIFF',rarity:'Rare',embers:2,copies:0},
  {id:'infencore',type:'RIFF',rarity:'Rare',embers:3,copies:3},
  {id:'remaster',type:'UTILITY',rarity:'Rare',embers:0,copies:0},
  {id:'sabbathsigil',type:'CORRUPT',rarity:'Rare',embers:2,copies:0,consumable:true},
  {id:'possessedperf',type:'RIFF',rarity:'Rare',embers:4,copies:2},
  {id:'goingbroke',type:'RIFF',rarity:'Rare',embers:0,copies:0,shopOnly:true},
  {id:'moshpit',type:'RIFF',rarity:'Uncommon',embers:1,copies:2},
  {id:'bloodritual',type:'CORRUPT',rarity:'Rare',embers:2,copies:1},
  // NEW CARDS
  {id:'echopedal',type:'RIFF',rarity:'Uncommon',embers:1,copies:0},
  {id:'loopstation',type:'RIFF',rarity:'Rare',embers:2,copies:0},
  {id:'riffthief',type:'RIFF',rarity:'Rare',embers:2,copies:0},
  {id:'feedbackscream',type:'RIFF',rarity:'Uncommon',embers:2,copies:0},
  {id:'skullsplitter',type:'RIFF',rarity:'Uncommon',embers:3,copies:0},
  {id:'doomchord',type:'RIFF',rarity:'Uncommon',embers:2,copies:0},
  {id:'bloodharmony',type:'RIFF',rarity:'Common',embers:1,copies:0},
  {id:'sonicboom',type:'RIFF',rarity:'Rare',embers:4,copies:0},
  {id:'tremolopick',type:'RIFF',rarity:'Common',embers:1,copies:0},
  {id:'powerslide',type:'RIFF',rarity:'Common',embers:0,copies:0},
  {id:'shredsolo',type:'RIFF',rarity:'Rare',embers:2,copies:0},
  {id:'harmonicfb',type:'RIFF',rarity:'Uncommon',embers:0,copies:0},
  {id:'overdriveped',type:'RIFF',rarity:'Rare',embers:2,copies:0},
  {id:'devilsdice',type:'RIFF',rarity:'Uncommon',embers:1,copies:0},
  {id:'necroticamp',type:'RIFF',rarity:'Rare',embers:0,copies:0},
  {id:'soulbargain',type:'CORRUPT',rarity:'Uncommon',embers:0,copies:0},
  {id:'venomriff',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:0},
  {id:'offeringpit',type:'CORRUPT',rarity:'Rare',embers:2,copies:0},
  {id:'cursedstrings',type:'CORRUPT',rarity:'Common',embers:1,copies:0},
  {id:'graverobber',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:0},
  {id:'hexdecay',type:'CORRUPT',rarity:'Rare',embers:3,copies:0},
  {id:'infernalpact',type:'CORRUPT',rarity:'Rare',embers:0,copies:0},
  {id:'carrioncall',type:'CORRUPT',rarity:'Rare',embers:1,copies:0},
  {id:'possessionriff',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:0},
  {id:'hellfirerift',type:'CORRUPT',rarity:'Rare',embers:0,copies:0},
  {id:'soulsacrifice',type:'CORRUPT',rarity:'Rare',embers:0,copies:0},
  {id:'voidpact',type:'CORRUPT',rarity:'Rare',embers:0,copies:0},
  {id:'darkcrescendo',type:'CORRUPT',rarity:'Rare',embers:0,copies:0},
  {id:'russianroulette',type:'CORRUPT',rarity:'Uncommon',embers:0,copies:0},
  {id:'gearcheck',type:'UTILITY',rarity:'Common',embers:1,copies:0},
  {id:'setlistrewrite',type:'UTILITY',rarity:'Common',embers:0,copies:0},
  {id:'backstagepass',type:'UTILITY',rarity:'Uncommon',embers:2,copies:0},
  {id:'venueswap',type:'UTILITY',rarity:'Uncommon',embers:1,copies:0},
  {id:'doublebooking',type:'UTILITY',rarity:'Rare',embers:3,copies:0},
  {id:'bootlegcopy',type:'UTILITY',rarity:'Uncommon',embers:1,copies:0},
  {id:'secondwind',type:'EMBER',rarity:'Common',embers:0,copies:0},
  {id:'pyromaniac',type:'EMBER',rarity:'Uncommon',embers:1,copies:0},
  {id:'slowburn',type:'EMBER',rarity:'Common',embers:0,copies:0},
  {id:'ampfeedback',type:'EMBER',rarity:'Common',embers:1,copies:0},
  {id:'drainthecrowd',type:'EMBER',rarity:'Common',embers:0,copies:0},
  {id:'corrsiphon',type:'EMBER',rarity:'Common',embers:0,copies:0},
];

// ── KEYWORD STACK SYSTEM (variant) ───────────────────────────────
// Card type lookup for FRENZIED (per-RIFF) and SHREDDER (consecutive same-type) bonuses
const CARD_TYPE_BY_ID={};for(const _c of ALL_CARDS)CARD_TYPE_BY_ID[_c.id]=_c.type;
// Stack tier: 1 stack = ×1, 2 stacks = ×2, 3+ stacks = ×4
function stackTier(n){return n>=3?4:n===2?2:n>=1?1:0}


// DECK MANIFESTS
const DECK_MANIFESTS={
  standard:{amp:2,battlecry:4,newstrings:2,encore:3,infencore:3,possessedperf:2,stagedive:2,crowdsurf:2,heavyriff:2,soundwall:1,deathriff:2,moshpit:2,resonancecard:3,demotape:2,burnset:1,herbmoney:1,distortion:3,dialtoeleven:2,sigdecay:1,staticcharge:2,darktuning:2,ampstatic:2,feedbackloop:1,controlfeedback:1,seance:1,bloodritual:1,soundcheck:2,roadie:2,setlist:2,setbreak:2,wakeup:2,groupie:2,powertap:2,tappedout:2,ampoverload:1,soundboard:2},
  shredder:{amp:2,battlecry:3,newstrings:2,encore:3,infencore:2,possessedperf:2,heavyriff:2,moshpit:2,resonancecard:2,crowdsurf:2,demotape:2,soundwall:1,burnset:1,stagedive:1,herbmoney:1,echopedal:2,riffthief:2,feedbackscream:2,devilsdice:1,sonicboom:1,skullsplitter:1,tremolopick:1,harmonicfb:1,doomchord:1,distortion:2,staticcharge:2,deathriff:1,ampstatic:1,dialtoeleven:1,sigdecay:1,bloodritual:1,darktuning:1,soundcheck:2,setbreak:2,wakeup:2,roadie:1,setlist:1,powertap:2,tappedout:2,soundboard:2,groupie:1,ampoverload:1,corrsiphon:2,drainthecrowd:1},
  ritualist:{amp:1,battlecry:2,encore:2,infencore:2,possessedperf:2,heavyriff:2,resonancecard:2,crowdsurf:1,demotape:1,soundwall:1,moshpit:1,newstrings:1,herbmoney:1,burnset:1,distortion:3,darktuning:2,staticcharge:2,dialtoeleven:2,deathriff:2,ampstatic:2,seance:1,bloodritual:1,feedbackloop:1,controlfeedback:1,sigdecay:1,infernalpact:2,cursedstrings:2,possessionriff:1,soulbargain:1,hexdecay:1,offeringpit:1,carrioncall:1,russianroulette:1,soundcheck:2,roadie:2,wakeup:2,setbreak:2,gearcheck:1,doublebooking:1,powertap:2,corrsiphon:2,tappedout:1,groupie:1,soundboard:1,ampoverload:1,pyromaniac:1,ampfeedback:1,drainthecrowd:1},
  engineer:{battlecry:3,amp:2,encore:2,possessedperf:2,heavyriff:2,crowdsurf:2,infencore:1,soundwall:1,burnset:1,shredsolo:2,sonicboom:2,feedbackscream:1,overdriveped:1,harmonicfb:1,tremolopick:1,distortion:2,darktuning:2,ampstatic:1,deathriff:1,staticcharge:1,feedbackloop:1,controlfeedback:1,seance:1,venomriff:2,darkcrescendo:1,setlist:3,soundcheck:2,wakeup:2,setbreak:2,roadie:1,bootlegcopy:2,backstagepass:2,setlistrewrite:2,venueswap:1,gearcheck:1,powertap:2,groupie:2,soundboard:2,corrsiphon:2,secondwind:2,tappedout:1,ampoverload:1,ampfeedback:1,drainthecrowd:1},
  survivor:{battlecry:3,newstrings:2,encore:2,infencore:2,possessedperf:2,heavyriff:2,moshpit:2,crowdsurf:2,amp:1,soundwall:1,resonancecard:1,burnset:1,herbmoney:1,doomchord:3,sonicboom:1,necroticamp:1,distortion:2,staticcharge:2,darktuning:2,deathriff:2,controlfeedback:1,dialtoeleven:1,feedbackloop:1,seance:1,bloodritual:1,sigdecay:1,soundcheck:2,roadie:2,wakeup:2,setlist:2,setbreak:2,doublebooking:2,bootlegcopy:1,backstagepass:1,powertap:2,tappedout:2,ampoverload:2,drainthecrowd:2,groupie:1,soundboard:1,slowburn:1,pyromaniac:1,secondwind:1,corrsiphon:1},
}
const ACTIVE_DECK=DECK_MANIFESTS[DECK_ID]||DECK_MANIFESTS.standard
const DECK_HP_SCALE={standard:1.85,shredder:2.00,ritualist:1.65,engineer:1.85,survivor:1.75}
const HP_SCALE=DECK_HP_SCALE[DECK_ID]||1.0

// ── DECK IDENTITY (commit 3/4 — synced with src/App.jsx STARTER_DECKS) ──
// Mirrors the schema from main app. Each deck overrides opening conditions
// and may have a signature mechanic that fires during combat.
const DECK_IDENTITY={
  standard: {handSize:5, startEmbers:5, startCorruption:0, memberHpMod:0, memberHpPct:1.0, maxStrikesMod:0, signature:null,                 scoreMult:1.0},
  shredder: {handSize:6, startEmbers:5, startCorruption:0, memberHpMod:0, memberHpPct:0.80,maxStrikesMod:0, signature:'riff_chain_echo',    scoreMult:1.4},
  ritualist:{handSize:5, startEmbers:4, startCorruption:15,memberHpMod:0, memberHpPct:1.0, maxStrikesMod:0, signature:'corruption_feeds',   scoreMult:1.6},
  engineer: {handSize:5, startEmbers:5, startCorruption:0, memberHpMod:0, memberHpPct:1.0, maxStrikesMod:0, signature:'copier',             scoreMult:1.2},
  survivor: {handSize:5, startEmbers:5, startCorruption:0, memberHpMod:2, memberHpPct:1.0, maxStrikesMod:0, signature:'second_wind',        scoreMult:1.3},
}
const DECK_ID_DEF=DECK_IDENTITY[DECK_ID]||DECK_IDENTITY.standard

// ── PACT REWARDS (12 options, sim picks best 1 of 2 offered) ──
const PACT_IDS=['ember_surge','iron_strings','thick_skin','dark_bargain','speed_demon','blood_price','clean_living','corruption_engine','merchants_eye','stone_wall','sixth_slot','war_drums'];


// ── DOOM FORGE: card upgrades after each boss ──
const UPGRADE_PRIORITY={
  possessedperf:95,infencore:90,amp:85,stagedive:80,overdrive:78,
  encore:75,soundcheck:72,wakeup:70,battlecry:68,newstrings:66,
  heavyriff:64,feedbackloop:62,crowdsurf:60,deathriff:58,moshpit:56,
  bloodritual:54,soundwall:52,roadie:50,distortion:48,controlfeedback:46,
  powertap:44,staticcharge:42,tappedout:40,ampoverload:38,groupie:36,
  darktuning:34,ampstatic:32,resonancecard:30,herbmoney:28,goingbroke:26,
  doubledown:24,demotape:22,soundboard:20,seance:18,sabbathsigil:16,
  sigdecay:14,setlist:12,setbreak:10,burnset:8,remaster:6,dialtoeleven:4
}
const UPGRADE_HP={
  battlecry:{hp:'target',amt:1},amp:{hp:'target',amt:2},newstrings:{hp:'target',amt:1},
  encore:{hp:'target',amt:2},resonancecard:{hp:'target',amt:2},soundcheck:{hp:'all',amt:1},
  roadie:{hp:'target',amt:2},wakeup:{hp:'all',amt:2},distortion:{hp:'all',amt:1},
  controlfeedback:{hp:'all',amt:1},seance:{hp:'all',amt:1},infencore:{hp:'all',amt:1},
  possessedperf:{hp:'all',amt:2},setbreak:{hp:'weakest',amt:1},soundboard:{hp:'random',amt:1}
}

// ── ARTIFACTS (shop items, max 3 equipped) ──
const ARTIFACTS=[
  {id:'a1',name:'Vintage Guitar',cost:10,effect:'leadAtk1',multTrigger:'cards3',mult:1.3,rarity:'common'},
  {id:'a2',name:"Devil's Tuning Fork",cost:16,multTrigger:'corrupt50',mult:1.5,rarity:'uncommon',startCorr:15},
  {id:'a5',name:'Haunted Radio',cost:10,effect:'tapBoost',multTrigger:'perChain',mult:1.2,rarity:'common'},
  {id:'a6',name:'Black Candle',cost:12,effect:'deathDmg8',multTrigger:'perStoned',mult:1.4,rarity:'uncommon'},
  {id:'a9',name:'Resonance Coil',cost:10,effect:'resonanceBoost',multTrigger:'perDupePlayed',mult:1.2,rarity:'common'},
  {id:'a10',name:'Burning Stage',cost:22,effect:'perfectBonus',multTrigger:'cards5',mult:3.0,rarity:'rare'},
  {id:'crackedpickup',name:'Cracked Pickup',cost:12,multTrigger:'playedRiff',mult:1.2,rarity:'common'},
  {id:'distortioncab',name:'Distortion Cab',cost:14,multTrigger:'alwaysOn',mult:1.25,rarity:'common'},
  {id:'ashtray',name:'Ash Tray',cost:12,multTrigger:'anyStoned',mult:1.3,rarity:'common'},
  {id:'crowdnoise',name:'Crowd Noise',cost:16,multTrigger:'perAliveMember',mult:1.10,rarity:'common'},
  {id:'tapehiss',name:'Tape Hiss',cost:8,multTrigger:'noRiff',mult:1.2,rarity:'common'},
  {id:'setlistart',name:'Set List Art',cost:12,multTrigger:'firstCardEmber',mult:1.4,rarity:'common'},
  {id:'gaffertape',name:'Gaffer Tape',cost:10,multTrigger:'allHealthy',mult:1.2,rarity:'common'},
  {id:'powerstrip',name:'Power Strip',cost:11,multTrigger:'embers5',mult:1.25,rarity:'common'},
  {id:'spitcup',name:'Spit Cup',cost:10,multTrigger:'discardedStrike',mult:1.5,rarity:'common'},
  {id:'divebarsign',name:'Dive Bar Sign',cost:9,multTrigger:'earlyCircle',mult:1.35,rarity:'common',refundAtC4:true},
  {id:'pentagramshrine',name:'Pentagram Shrine',cost:22,multTrigger:'perCorruptCard',mult:1.4,rarity:'uncommon'},
  {id:'doomchoir',name:'Doom Choir',cost:24,multTrigger:'perSameRole',mult:1.5,rarity:'uncommon'},
  {id:'solosermon',name:'Solo Sermon',cost:26,multTrigger:'cards2exact',mult:6.0,rarity:'uncommon'},
  {id:'blackmassbell',name:'Black Mass Bell',cost:22,multTrigger:'chains3',mult:2.5,rarity:'uncommon'},
  {id:'ouroborospin',name:'Ouroboros Pin',cost:20,multTrigger:'perDiscardStrike',mult:1.3,rarity:'uncommon'},
  {id:'drummerstick',name:"Drummer's Stick",cost:22,multTrigger:'doubleTimeRolled',mult:2.5,rarity:'uncommon'},
  {id:'fogmachine',name:'Fog Machine',cost:24,multTrigger:'perStoned',mult:1.4,rarity:'uncommon'},
  {id:'chromeskull',name:'Chrome Skull',cost:28,multTrigger:'lastMemberStanding',mult:3.0,rarity:'uncommon'},
  {id:'doomcrown',name:'The Doom Crown',cost:38,multTrigger:'allSameType',mult:8.0,rarity:'rare'},
  {id:'triplesixes',name:'Triple Sixes',cost:35,multTrigger:'perOtherArtifact',mult:3.0,rarity:'rare'},
  {id:'invertedpentacle',name:'Inverted Pentacle',cost:36,multTrigger:'corrupt100exact',mult:5.0,rarity:'rare'},
  {id:'blackgoat',name:'The Black Goat',cost:42,multTrigger:'goatStackOther',mult:2.0,rarity:'rare'},
]
const PASSIVES=[
  {id:'p1',name:'Power Chord',cost:6,effect:'extraEmber'},      // +1 ember per fight
  {id:'p2',name:'Roadie Crew',cost:6,effect:'healRandom3'},     // Random member +3 HP per fight
  {id:'p3',name:'Merch Table',cost:8,effect:'stashBonus2'},     // +2 stash per victory
  {id:'p4',name:'Feedback Hum',cost:8,effect:'emberCards'},     // EMBER cards +1 ember
  {id:'p5',name:'Amp Stack',cost:10,effect:'soundwallBoost'},   // Sound Wall +4, Heavy Riff +2
  {id:'p6',name:'Cult Following',cost:6,effect:'deathStash3'},  // +3 stash per member death
  {id:'p7',name:'Guitar Tech',cost:10,effect:'battlecryBoost'}, // Battle Cry +2 instead of +1
  {id:'p8',name:'Green Room',cost:14,effect:'stonewall'},       // All members start with Stonewall
  {id:'p9',name:'Heavy Rotation',cost:8,effect:'dupDraw'},      // Duplicate draw = +1 card
  {id:'p10',name:'Stage Fright',cost:8,effect:'firstStrike10'}, // First strike +10 bonus dmg
]

// ── BOSS LOOT (one drop per circle boss) ──
const BOSS_LOOT_SIM=[
  null,null,{effect:'atk1all'},  // C1: +1 ATK all
  null,null,{effect:'freeFirst'}, // C2: first card free per fight
  null,null,{effect:'hp3all'},    // C3: +3 HP all
  null,null,{effect:'stashBoss'}, // C4: +5 stash per boss
  null,null,{effect:'atk2strong'},// C5: +2 ATK strongest
  null,null,{effect:'corrDmg'},   // C6: +25% corruption dmg
  null,null,{effect:'atk3strong'},// C7: +3 ATK strongest
  null,null,{effect:'hp4all'},    // C8: +4 HP all
]

// ── RIFF CHAINS (16 combos) ──
const RIFF_CHAINS_SIM=[
  ['resonancecard','infencore'],['darktuning','overdrive'],['bloodritual','wakeup'],
  ['possessedperf','encore'],['distortion','feedbackloop'],['battlecry','stagedive'],
  ['encore','infencore'],['staticcharge','deathriff'],['soundwall','amp'],
  ['feedbackloop','ampstatic'],['moshpit','battlecry'],['bloodritual','seance'],
  ['burnset','groupie'],['powertap','newstrings'],['sabbathsigil','overdrive'],
  ['stagedive','wakeup']
]

// ── HELLQUAKE D10 EFFECTS ──
function rollHellquake(gs){
  const d10=Math.floor(Math.random()*10)+1
  const alive=gs.stage.filter(m=>!m.tooStoned)
  if(d10<=2){// OBLITERATE: 25% of boss HP as damage
    const dmg=Math.floor(gs.enemyHp*0.25);gs.enemyHp=Math.max(0,gs.enemyHp-dmg)
  } else if(d10<=4){// VOID RIFT: 200 direct damage
    gs.enemyHp=Math.max(0,gs.enemyHp-200)
  } else if(d10<=5){// BACKLASH: 30 dmg to boss, -50% corruption
    gs.enemyHp=Math.max(0,gs.enemyHp-30);gs.corruption=Math.max(0,gs.corruption-50)
  } else if(d10<=6){// DARK RITUAL: 30% of boss HP
    gs.enemyHp=Math.max(1,Math.floor(gs.enemyHp*0.7))
  } else if(d10<=7){// SOUL FRACTURE: all members -3 HP
    alive.forEach(m=>{m.hp=Math.max(1,m.hp-3)})
  } else if(d10<=8){// MADNESS: random member gets +10 ATK, another dies
    if(alive.length>1){const buff=pick(alive);buff.atk+=10;const others=alive.filter(m=>m.uid!==buff.uid);const victim=pick(others);victim.tooStoned=true;victim.hp=0}
  } else if(d10<=9){// POSSESSION: all cards free this fight
    gs._allCardsFree=true
  } else {// 10: REBIRTH: full heal all + double ATK this fight
    gs.stage.forEach(m=>{if(m){m.hp=m.maxHp;m.tooStoned=false;m.atk*=2}})
  }
}
const MAX_STRIKES=4,MAX_DISCARDS=4,HAND_SIZE=6,MAX_STASH=420,MAX_EMBERS_CAP=8;
const circleBaseMin=[8,6,7,8,9,9,11,11,14],circleBaseRange=[3,4,4,3,4,4,5,5,7]; // v12 stash tightening
const MENTOR_LINK_BONUS={foil:{atk:1,hp:2,mult:1.25},mythic:{atk:2,hp:4,mult:1.5},demonic:{atk:4,hp:8,mult:2.0}};
// ═══ BAND AURAS (v0.8) — adjacency bonuses radiating to neighboring stage slots ═══
function auraAtkMap(stage,ctx){const map={}
  for(let i=0;i<stage.length;i++){const m=stage[i];if(!m||m.tooStoned)continue;let a=0
    for(const j of[i-1,i+1]){const n=stage[j];if(!n||n.tooStoned)continue
      switch(n.keyword){
        case 'FRENZIED':case 'DEBUFF':case 'DOUBLE TIME':a+=1;break
        case 'CORRUPT':if(ctx.corruption>=50)a+=1;break
        case 'HEXED':if(ctx.corruption>=25)a+=1;break
        case 'SHREDDER':if(ctx.shredderHits>0)a+=1;break
      }}
    if(a>0)map[m.uid]=a}
  return map}
function anchorAuraReduction(stage,uid){for(let i=0;i<stage.length;i++){const m=stage[i];if(!m||m.uid!==uid)continue;let r=0
  for(const j of[i-1,i+1]){const n=stage[j];if(n&&!n.tooStoned&&n.keyword==='ANCHOR')r+=1}return r}return 0}
function folkAuraHeal(stage){for(let i=0;i<stage.length;i++){const m=stage[i];if(!m||m.tooStoned)continue;let h=0
  for(const j of[i-1,i+1]){const n=stage[j];if(n&&!n.tooStoned&&n.keyword==='FOLK MAGIC')h+=1}
  if(h>0)m.hp=Math.min(m.maxHp,m.hp+h)}}
function auraStaticScore(stage){let s=0
  for(let i=0;i<stage.length;i++){const m=stage[i];if(!m||m.tooStoned)continue
    for(const j of[i-1,i+1]){const n=stage[j];if(!n||n.tooStoned)continue
      switch(n.keyword){case 'FRENZIED':case 'DEBUFF':case 'DOUBLE TIME':s+=3;break
        case 'ANCHOR':case 'FOLK MAGIC':s+=2;break
        case 'CORRUPT':case 'HEXED':case 'SHREDDER':s+=1.5;break}}}
  return s}
function improveOrdering(gs){const stage=gs.stage
  const linkPairs=(gs.mentorLinks||[]).map(l=>({m:stage[l.mentorIdx]&&stage[l.mentorIdx].uid,p:stage[l.protegeIdx]&&stage[l.protegeIdx].uid}))
  let improved=true,guard=0
  while(improved&&guard++<30){improved=false
    for(let i=0;i+1<stage.length;i++){const cur=auraStaticScore(stage)
      ;[stage[i],stage[i+1]]=[stage[i+1],stage[i]]
      if(auraStaticScore(stage)>cur)improved=true
      else[stage[i],stage[i+1]]=[stage[i+1],stage[i]]}}
  if(gs.mentorLinks)gs.mentorLinks.forEach((l,k)=>{const lp=linkPairs[k];if(!lp)return
    const mi=stage.findIndex(m=>m&&m.uid===lp.m),pi=stage.findIndex(m=>m&&m.uid===lp.p)
    if(mi>=0)l.mentorIdx=mi;if(pi>=0)l.protegeIdx=pi})}

let TRACK={linksFormed:0,linkStrikesFired:0,linkBonusDmg:0,packsOpened:0,pawnSells:0,caEffects:0,
  shroomsBought:0,acidBought:0,shroomsUsed:0,acidUsed:0,goodTrips:0,badTrips:0,bunkTrips:0,
  luciferReached:0,luciferP1Kills:0,luciferWins:0,
  pactsChosen:0,fightsSkipped:0,cardsDeleted:0,genreActivations:0,wthEntered:0,wthWins:0,contractsSigned:0,forgeUpgrades:0,combosTriggered:0,hellquakesFired:0,bossLootCollected:0,artifactsBought:0,passivesBought:0,eventsTriggered:0,eventMoshPit:0,eventCursedAmp:0,eventBloodOath:0,eventHellfire:0,eventSabbath:0,eventWager:0,whisperDmg:0,hungerExtraCost:0,madnessCards:0,possessionBonus:0,anchorSaves:0,kwStack2Reached:0,kwStack3Reached:0};
let CARD_PLAYS={};

function rand(n){return Math.floor(Math.random()*n)}
function pick(arr){return arr[rand(arr.length)]}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function memberScore(m){return(m.atk+(m.permAtkBonus||0))*3+m.hp+(m.keyword==='FRENZIED'?6:0)+(m.keyword==='CORRUPT'?4:0)+(m.keyword==='FOLK MAGIC'?5:0)+(m.keyword==='HEXED'?3:0)+(m.keyword==='SHREDDER'?3:0)+(m.keyword==='DOUBLE TIME'?2:0)+(m.keyword==='DEBUFF'?2:0)+(m.keyword==='ANCHOR'?1:0)}
function isUpgraded(m){return m.foil||m.mythic||m.demonic}
function makeMember(base,foil,mythic,demonic){
  const m={...base,hp:base.maxHp,tooStoned:false,stoneShield:false,foil:!!foil,mythic:!!mythic,demonic:!!demonic,mentorBonusApplied:false,permAtkBonus:0,tempAtkBonus:0,uid:Math.random().toString(36).slice(2)};
  if(demonic){m.atk+=4;m.maxHp+=8;m.hp=m.maxHp}else if(mythic){m.atk+=2;m.maxHp+=4;m.hp=m.maxHp}else if(foil){m.atk+=1;m.maxHp+=2;m.hp=m.maxHp}
  // ── DECK IDENTITY: apply HP modifiers (Survivor +2, Shredder ×0.85) ──
  if(DECK_ID_DEF.memberHpMod||DECK_ID_DEF.memberHpPct!==1){
    m.maxHp=Math.max(1,Math.round((m.maxHp+(DECK_ID_DEF.memberHpMod||0))*(DECK_ID_DEF.memberHpPct||1)))
    m.hp=m.maxHp
  }
  return m;
}
function buildDeck(){const d=[];for(const[id,copies]of Object.entries(ACTIVE_DECK)){const card=ALL_CARDS.find(c=>c.id===id);if(card)for(let i=0;i<copies;i++)d.push({...card,uid:Math.random().toString(36).slice(2)})}return shuffle(d)}
function pickStartingPair(){const pool=ALL_MUSICIANS.filter(m=>!m.locked);let best=null,bs=-1;for(let i=0;i<40;i++){const a=pick(pool),b=pick(pool);if(a.id===b.id)continue;if(a.keyword==='ANCHOR'&&b.keyword==='ANCHOR')continue;const s=memberScore(a)+memberScore(b);if(s>bs){bs=s;best=[a,b]}}return best.map(b=>makeMember(b,false,false,false))}
function arrangeStage(stage){
  const alive=stage.filter(m=>!m.tooStoned),stoned=stage.filter(m=>m.tooStoned);if(alive.length<=1)return stage;
  const pairs=[],used=new Set(),upgraded=alive.filter(m=>isUpgraded(m));
  for(const up of upgraded){const basic=alive.find(m=>m.role===up.role&&!isUpgraded(m)&&!used.has(m.uid)&&m.uid!==up.uid);if(basic){pairs.push({mentor:up,protege:basic});used.add(up.uid);used.add(basic.uid)}}
  const ordered=[],placed=new Set();for(const p of pairs){ordered.push(p.mentor);ordered.push(p.protege);placed.add(p.mentor.uid);placed.add(p.protege.uid)}
  const remaining=alive.filter(m=>!placed.has(m.uid)),anchors=remaining.filter(m=>m.keyword==='ANCHOR'),nonAnchors=remaining.filter(m=>m.keyword!=='ANCHOR');
  nonAnchors.sort((a,b)=>(b.atk+(b.permAtkBonus||0))-(a.atk+(a.permAtkBonus||0)));
  ordered.push(...nonAnchors,...anchors,...stoned);return ordered;
}
function scanMentorLinks(stage){
  const links=[];for(let i=0;i<stage.length-1;i++){const left=stage[i],right=stage[i+1];if(!left||!right||left.tooStoned||right.tooStoned)continue;
    const tier=left.demonic?'demonic':left.mythic?'mythic':left.foil?'foil':null;if(!tier)continue;
    if(left.role===right.role&&!right.foil&&!right.mythic&&!right.demonic){const bonus=MENTOR_LINK_BONUS[tier];
      if(!right.mentorBonusApplied){right.atk+=bonus.atk;right.permAtkBonus=(right.permAtkBonus||0)+bonus.atk;right.maxHp+=bonus.hp;right.hp=Math.min(right.hp+bonus.hp,right.maxHp);right.mentorBonusApplied=true;TRACK.linksFormed++}
      links.push({mentorIdx:i,protegeIdx:i+1,tier,mult:bonus.mult+STAKE.mentorBonus})}}return links;
}
function generateCandidates(pack){const pool=ALL_MUSICIANS.filter(m=>!m.locked),candidates=[],usedIds=new Set();
  for(let i=0;i<pack.numCandidates;i++){const available=pool.filter(m=>!usedIds.has(m.id));if(available.length===0)break;const base=pick(available);usedIds.add(base.id);
    const r=Math.random(),tier=r<pack.demonicChance?'demonic':r<pack.demonicChance+pack.mythicChance?'mythic':r<pack.demonicChance+pack.mythicChance+pack.foilChance?'foil':'base';
    candidates.push(makeMember(base,tier==='foil',tier==='mythic',tier==='demonic'))}return candidates}
function pickBestCandidate(candidates,stage){
  const stageBasicRoles=stage.filter(m=>!isUpgraded(m)).map(m=>m.role)
  const stageUpgradedRoles=stage.filter(m=>isUpgraded(m)).map(m=>m.role)
  // ── KEYWORD STACK AI: count current stacks so we can favor synergy picks ──
  const _stageStacks={}
  for(const _m of stage){const _s=_m.foil?2:1;_stageStacks[_m.keyword]=(_stageStacks[_m.keyword]||0)+_s}
  let best=null,bestP=-1
  for(const c of candidates){
    let p=memberScore(c)
    // Existing tier bonuses
    if(isUpgraded(c)){
      if(stageBasicRoles.includes(c.role))p+=200;else p+=50
      if(c.demonic)p+=80;else if(c.mythic)p+=40;else if(c.foil)p+=20
    }else{
      if(stageUpgradedRoles.includes(c.role))p+=200
    }
    // ── KEYWORD STACK BONUS (variant) ──
    // Simulate adding this candidate; reward tier upgrades that compound effects
    const _candStacks=c.foil?2:1
    const _before=_stageStacks[c.keyword]||0
    const _after=_before+_candStacks
    const _bTier=_before>=3?4:_before===2?2:_before>=1?1:0
    const _aTier=_after>=3?4:_after===2?2:_after>=1?1:0
    const _tierGain=_aTier-_bTier
    p+=_tierGain*40                          // tier upgrade reward
    if(_before>=1&&_tierGain===0)p+=15       // small bonus for same-keyword (no upgrade)
    // No anti-stack penalty — REMOVED the old -30 (which discouraged the new system)
    if(p>bestP){bestP=p;best=c}
  }
  return best
}
function drawCards(gs,n){for(let i=0;i<Math.min(n,10-gs.hand.length);i++){if(gs.deck.length===0){gs.deck=shuffle([...gs.discard]);gs.discard=[]}if(gs.deck.length>0)gs.hand.push(gs.deck.pop())}}

// ── PACT AI: score each pact reward, pick best ──
function scorePact(pactId,gs){
  const alive=gs.stage.filter(m=>!m.tooStoned),totalAtk=alive.reduce((s,m)=>s+m.atk+(m.permAtkBonus||0),0);
  switch(pactId){
    case 'ember_surge':return gs.maxEmbers<7?80:40;
    case 'iron_strings':return alive.length*15;
    case 'thick_skin':return alive.length*8;
    case 'dark_bargain':return gs.corruption>30?65:30;
    case 'speed_demon':return 70;
    case 'blood_price':return gs.corruption>20?55:25;
    case 'clean_living':return gs.corruption<20?60:5;
    case 'corruption_engine':return 45;
    case 'merchants_eye':return gs.stash<30?55:30;
    case 'stone_wall':return 50;
    case 'sixth_slot':return alive.length<5?90:20;
    case 'war_drums':return 85;
    default:return 10;
  }
}
function applyPact(pactId,gs){
  const alive=gs.stage.filter(m=>!m.tooStoned);
  switch(pactId){
    case 'ember_surge':gs.maxEmbers=Math.min(MAX_EMBERS_CAP,gs.maxEmbers+1);break;
    case 'iron_strings':alive.forEach(m=>{m.atk+=1;m.permAtkBonus=(m.permAtkBonus||0)+1});break;
    case 'thick_skin':alive.forEach(m=>{m.maxHp+=3;m.hp=Math.min(m.maxHp,m.hp+3)});break;
    case 'dark_bargain':break; // affects ember cost calc (simplified: skip in sim)
    case 'speed_demon':gs._speedDemon=true;break;
    case 'blood_price':break; // 9x blood ritual (handled in card scoring)
    case 'clean_living':break; // +2 ATK at 0% corruption
    case 'corruption_engine':gs.corruption=Math.min(100,gs.corruption+5);break;
    case 'merchants_eye':break; // 20% off shop
    case 'stone_wall':break; // -1 boss dmg
    case 'sixth_slot':break; // +1 member slot (handled in shop)
    case 'war_drums':gs._warDrums=true;break;
  }
}

// ── DESCENT AI: decide whether to skip fights ──
function decideDescentSkips(gs,circleNum){
  const skips=[]
  const alive=gs.stage.filter(m=>!m.tooStoned),bandPower=alive.reduce((s,m)=>s+m.atk+(m.permAtkBonus||0),0)+alive.length*3
  const allHealthy=alive.every(m=>m.hp>=m.maxHp*0.7)
  // Conservative: only skip if overpowered AND healthy (forfeits stash+shop)
  // C1 only: skip fight 1 — trivial enemies, reward is worth more than 27HP fight
  if(circleNum===1&&alive.length>=2){skips.push(0);TRACK.fightsSkipped++}
  // C2-C3: skip fight 1 only if 4+ members and healthy
  else if(circleNum<=3&&alive.length>=4&&allHealthy){skips.push(0);TRACK.fightsSkipped++}
  // C4+: never skip — stash too valuable, fights provide deck cycling
  return skips
}

// ── DECK THINNING AI: burn weak commons at pawn shop ──
function burnWeakCards(gs){
  const weakCards=['dialtoeleven','setbreak','setlist'];
  const circleNum=Math.floor(gs.fightIndex/3)+1;
  if(circleNum<3)return; // don't thin early
  for(const wid of weakCards){
    const idx=gs.deck.findIndex(c=>c.id===wid);
    if(idx!==-1){gs.deck.splice(idx,1);TRACK.cardsDeleted++}
    const dIdx=gs.discard.findIndex(c=>c.id===wid);
    if(dIdx!==-1){gs.discard.splice(dIdx,1);TRACK.cardsDeleted++}
  }
}

function rollTrip(type){
  const roll=Math.random()
  if(roll<0.05){TRACK.badTrips++;return type==='shrooms'?'BAD_SHROOMS':'BAD_ACID'}
  if(roll<0.10){TRACK.bunkTrips++;return 'BUNK'}
  TRACK.goodTrips++
  const d4=rand(4)
  if(type==='shrooms')return['EGO_DEATH','TIME_DILATION','SYNESTHESIA','COSMIC_UNITY'][d4]
  return['FRACTAL_VISION','DIMENSIONAL_RIFT','EGO_DISSOLUTION','ASTRAL_PROJECTION'][d4]
}

function scoreCard(card,gs,enemy,strikeNum,cardsPlayed){
  let base=_scoreCardBase(card,gs,enemy,strikeNum,cardsPlayed);
  // CHAIN BONUS: completing a chain is worth +40 priority
  const played=gs._cardsPlayedIds||[];
  const fired=gs._firedChains||new Set();
  for(const chain of RIFF_CHAINS_SIM){
    const ck=chain[0]+'+'+chain[1];
    if(fired.has(ck))continue;
    if((card.id===chain[0]&&played.includes(chain[1]))||(card.id===chain[1]&&played.includes(chain[0]))){
      base+=40;break;
    }
  }
  // CHAIN SETUP: if the other half of a chain is in hand, slight boost
  for(const chain of RIFF_CHAINS_SIM){
    const ck=chain[0]+'+'+chain[1];
    if(fired.has(ck))continue;
    const partner=card.id===chain[0]?chain[1]:card.id===chain[1]?chain[0]:null;
    if(partner&&gs.hand.some(c=>c.id===partner)){base+=15;break}
  }
  return base;
}

function _scoreCardBase(card,gs,enemy,strikeNum,cardsPlayed){
  const{stage,corruption,stash,embers,hand}=gs,alive=stage.filter(m=>!m.tooStoned);if(alive.length===0)return 0;
  const totalAtk=alive.reduce((s,m)=>s+m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0),0),highestAtk=alive.reduce((s,m)=>Math.max(s,m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0)),0);
  const lowestHp=alive.reduce((a,b)=>a.hp<b.hp?a:b),anyHurt=alive.some(m=>m.hp<m.maxHp*0.5);
  switch(card.id){
    case 'contract':return alive.length>2?30:0; // WTH: play contract if 3+ members
    case 'possessedperf':return 95;case 'overdrive':return corruption>=60?92:10;case 'infencore':return 88;
    case 'stagedive':return Math.max(...alive.map(m=>m.hp))>=8?82:50;
    case 'amp':return 72+(highestAtk>4?10:0);case 'encore':return 70+(highestAtk>5?10:0);case 'newstrings':return 67;case 'battlecry':return 62;
    case 'powertap':return embers<=2?84:38;case 'staticcharge':return embers<=2?(corruption===0?86:80):33;
    case 'tappedout':return strikeNum<3?78:18;case 'ampoverload':return(gs._discardsLeft>0&&embers<=2)?81:5;
    case 'groupie':return embers<=3?62:28;
    case 'soundboard':return embers<=3?60:28;case 'setbreak':return embers<=2?52:14;
    case 'soundwall':return 70;case 'heavyriff':{const t2=alive.reduce((a,b)=>(a.atk+(a.permAtkBonus||0)>b.atk+(b.permAtkBonus||0)?a:b));if(t2._hrUsed)return 3;return(t2.permAtkBonus||0)>=3?78:55};case 'crowdsurf':return hand.length>=5?74:hand.length>=3?55:30;
    case 'deathriff':return corruption<50?52:18;case 'feedbackloop':return corruption>=40?57:18;
    case 'herbmoney':return stash>=10?65:0;case 'goingbroke':return stash>=50?62:5;
    case 'resonancecard':return highestAtk>=5?54:24;case 'ampstatic':return corruption>=30?50:10;
    case 'doubledown':return cardsPlayed===0&&embers>=3?74:28;
    case 'distortion':return 57;case 'dialtoeleven':return corruption<50?44:14;
    case 'controlfeedback':{const hpR=lowestHp.hp/lowestHp.maxHp;if(hpR<0.3)return 75;if(hpR<0.5&&corruption>=50)return 60;if(corruption>=70)return 55;if(corruption>=40)return 40;return 15}
    case 'sigdecay':return hand.length>=4?48:20;
    case 'darktuning':return corruption>=70?68:corruption>=40?55:10;case 'sabbathsigil':return gs.fightIndex>=18?37:10;
    case 'soundcheck':return anyHurt?58:30;case 'roadie':return alive.some(m=>m.hp<=3)?55:20;
    case 'wakeup':return stage.some(m=>m.tooStoned)?90:alive.some(m=>m.hp<m.maxHp*0.5)?30:8;
    case 'setlist':return hand.length<=4?47:18;
    case 'seance':return corruption>=50?55:35;
    case 'demotape':return cardsPlayed>0?52:0;case 'burnset':return hand.length>=5?42:15;
    case 'remaster':return hand.length>=4?44:10;
    case 'moshpit':{const al=alive.length;return al>=4?74:al>=3?60:38}
    case 'bloodritual':{const hp=alive.reduce((a,b)=>a.hp>b.hp?a:b).hp;return hp>=8?58:30}

    // NEW CARDS scoring
    case 'echopedal':return cardsPlayed>0?75:0;case 'loopstation':return cardsPlayed>=2?85:0;case 'riffthief':return cardsPlayed>0?70:0;
    case 'feedbackscream':return 65;case 'skullsplitter':return highestAtk>=10?80:62;
    case 'doomchord':return corruption>=50?78:55;case 'bloodharmony':return 52;case 'sonicboom':return 72;
    case 'tremolopick':return cardsPlayed>=3?70:35;case 'powerslide':return alive.some(m=>m.keyword==='FRENZIED')?60:35;
    case 'shredsolo':return highestAtk>=8?80:50;case 'harmonicfb':return(gs._cardsPlayedIds||[]).filter(x=>ALL_CARDS.find(c=>c.id===x&&c.type==='RIFF')).length>=3?78:25;
    case 'overdriveped':return gs._strikeMult>=1.5?85:55;case 'devilsdice':return 55;case 'necroticamp':return corruption>=60?85:corruption>=40?60:20;
    case 'soulbargain':return 72;case 'venomriff':return 60;case 'offeringpit':return alive.length>=4?65:20;
    case 'cursedstrings':return 55;case 'graverobber':return gs.discard.length>=4?62:20;case 'hexdecay':return enemy._hp>=500?75:45;
    case 'infernalpact':return corruption<50?65:10;case 'carrioncall':return stage.some(m=>m.tooStoned)?90:0;
    case 'possessionriff':return 78;case 'darkcrescendo':return corruption>=80?98:0;case 'hellfirerift':return corruption<80?90:60;case 'soulsacrifice':return 85;case 'voidpact':return corruption<75?95:50;
    case 'russianroulette':return alive.length>=4?60:30;case 'gearcheck':return 48;case 'setlistrewrite':return 30;
    case 'backstagepass':return embers>=2?65:30;case 'venueswap':return hand.length<=3?60:20;case 'doublebooking':return 92;
    case 'bootlegcopy':return 55;case 'secondwind':return embers===0?90:embers<=2?50:10;case 'pyromaniac':return embers<=2?68:25;
    case 'slowburn':return strikeNum===0?65:30;case 'ampfeedback':return embers<=2?70:30;
    case 'drainthecrowd':return embers<=2?65:20;case 'corrsiphon':return embers<=2&&corruption<60?72:15;
    default:return 5;
  }
}

function applyCardSim(card,gs,enemy){
  const{stage}=gs,alive=stage.filter(m=>!m.tooStoned);if(alive.length===0)return;
  const target=alive.reduce((a,b)=>(a.atk+(a.permAtkBonus||0)>b.atk+(b.permAtkBonus||0)?a:b));
  const weakest=alive.reduce((a,b)=>a.hp/a.maxHp<b.hp/b.maxHp?a:b);
  const highestAtk=Math.max(...alive.map(m=>m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0)));
  // Genre tracking
  switch(card.id){
    case 'contract':{const strongest=alive.sort((a,b)=>(b.atk+(b.permAtkBonus||0))-(a.atk+(a.permAtkBonus||0)))[0];strongest.tooStoned=true;strongest.hp=0;gs._contractsPlayed++;TRACK.contractsSigned++;break}
    case 'amp':target.ampedThisStrike=true;break;
    case 'battlecry':{const b=(gs.passives.some(p=>p.id==='p7')?2:1)+(card.upgraded?1:0);target.atk+=b;target.permAtkBonus=(target.permAtkBonus||0)+b;break}
    case 'newstrings':target.atk+=2;target.permAtkBonus=(target.permAtkBonus||0)+2;break;
    case 'encore':target.encoreThisStrike=true;break;
    case 'soundcheck':alive.forEach(m=>{const h=m.hp<m.maxHp;m.hp=Math.min(m.maxHp,m.hp+(card.upgraded?6:4));if(h)m.tempAtkBonus=(m.tempAtkBonus||0)+1});break;
    case 'roadie':weakest.stoneShield=card.upgraded?3:2;weakest.hp=Math.min(weakest.maxHp,weakest.hp+(card.upgraded?4:2));break;
    case 'distortion':gs.corruption=Math.min(100,gs.corruption+50);alive.forEach(m=>m.tempAtkBonus=(m.tempAtkBonus||0)+1);break;
    case 'dialtoeleven':gs.corruption=Math.min(100,gs.corruption+10);gs.stage.forEach(m=>{if(!m.tooStoned){m.atk+=3;m.tempAtkBonus=(m.tempAtkBonus||0)+3}});break;
    case 'controlfeedback':{gs.corruption=50;const ht=alive.reduce((a,b)=>a.hp/a.maxHp<b.hp/b.maxHp?a:b);ht.hp=ht.maxHp;break}
    case 'sigdecay':{if(gs.hand.length>0){const vi=rand(gs.hand.length);gs.discard.push(gs.hand.splice(vi,1)[0])};drawCards(gs,2);break}
    case 'feedbackloop':{let d=Math.floor(gs.corruption/(card.upgraded?1.5:2));gs._directDmg=(gs._directDmg||0)+d;break}
    case 'soundwall':{const b=1+(gs.passives.some(p=>p.id==='p5')?1:0)+(card.upgraded?1:0);alive.forEach(m=>{m.atk+=b;m.permAtkBonus=(m.permAtkBonus||0)+b});break}
    case 'heavyriff':{const b=Math.min(20,Math.ceil((target.atk+(target.permAtkBonus||0)+(target.tempAtkBonus||0))/2))+(card.upgraded?2:0);target.atk+=b;target.permAtkBonus=(target.permAtkBonus||0)+b;break}
    case 'crowdsurf':{const b=Math.max(1,gs.hand.length)+(card.upgraded?1:0);target.atk+=b;target.permAtkBonus=(target.permAtkBonus||0)+b;break}
    case 'deathriff':gs._directDmg=(gs._directDmg||0)+Math.floor((card.upgraded?80:60)*(1-gs.corruption/100));gs.corruption=Math.min(100,gs.corruption+10);break;
    case 'stagedive':gs._directDmg=(gs._directDmg||0)+target.hp;break;
    case 'overdrive':if(gs.corruption>=(card.upgraded?50:60))gs._overdriveActive=true;break;
    case 'infencore':gs._infencoreActive=true;break;
    case 'possessedperf':gs._possessedActive=true;break;
    case 'powertap':{gs.embers=Math.min(gs.maxEmbers,gs.embers+(card.upgraded?3:2))+(gs.passives.some(p=>p.id==='p4')?1:0);break}
    case 'staticcharge':gs.embers=Math.min(gs.maxEmbers,gs.embers+(gs.corruption===0?4:2));break;
    case 'tappedout':gs._tappedOutNext=true;if(gs.passives.some(p=>p.id==='p4'))gs.embers=Math.min(gs.maxEmbers,gs.embers+1);break;
    case 'ampoverload':{gs.embers=Math.min(gs.maxEmbers,gs.embers+3+(gs.passives.some(p=>p.id==='p4')?1:0));gs._discardsLeft=Math.max(0,gs._discardsLeft-1);break}
    case 'groupie':{gs.embers=Math.min(gs.maxEmbers,gs.embers+2+(gs.passives.some(p=>p.id==='p4')?1:0));drawCards(gs,1);break}
    case 'soundboard':{gs.embers=Math.min(gs.maxEmbers,gs.embers+2+(gs.passives.some(p=>p.id==='p4')?1:0));gs._drawNextStrike=(gs._drawNextStrike||0)+1;break}
    case 'setbreak':gs.embers=Math.min(gs.maxEmbers,gs.embers+3);{const d=gs.deck.length>0?gs.deck.pop():null;if(d)gs.hand.push(d)};break;
    case 'setlist':drawCards(gs,card.upgraded?4:3);break;
    case 'doubledown':gs._nextCardFree=true;break;
    case 'wakeup':alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+2));stage.forEach(m=>{if(m.tooStoned){m.tooStoned=false;m.hp=m.maxHp}});break;
    case 'demotape':gs._directDmg=(gs._directDmg||0)+Math.floor((target.atk+(target.permAtkBonus||0))*0.5);break;
    case 'resonancecard':target.tempAtkBonus=(target.tempAtkBonus||0)+Math.max(0,highestAtk-(target.atk+(target.permAtkBonus||0)+(target.tempAtkBonus||0)));break;
    case 'ampstatic':{let b=Math.floor(gs.corruption/12);target.tempAtkBonus=(target.tempAtkBonus||0)+b;break}
    case 'darktuning':{if(gs.corruption<40)break;const n=gs.corruption>=70?3:2;for(let i=0;i<Math.min(n,alive.length);i++){const t=pick(alive);t.atk+=1;t.permAtkBonus=(t.permAtkBonus||0)+1}break}
    case 'herbmoney':{if(gs.stash>=10){gs.stash-=10;target.atk+=3;target.permAtkBonus=(target.permAtkBonus||0)+3};break}
    case 'goingbroke':gs._directDmg=(gs._directDmg||0)+gs.stash;gs.stash=0;break;
    case 'burnset':drawCards(gs,1);break;
    case 'remaster':drawCards(gs,3);break;
    case 'seance':{const h=Math.max(1,Math.floor(gs.corruption/4));alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+h));break}
    case 'moshpit':{const b=alive.length>=4?2:1;alive.forEach(m=>{m.atk+=b;m.permAtkBonus=(m.permAtkBonus||0)+b});break}
    case 'bloodritual':{const t=alive.reduce((a,b)=>a.hp>b.hp?a:b);const sac=Math.floor(t.hp*0.25);t.hp-=sac;gs._directDmg=(gs._directDmg||0)+sac*(card.upgraded?8:6);gs.corruption=Math.min(100,gs.corruption+50);break}
    case 'sabbathsigil':gs.corruption=100;if(!gs._hellquakeFired){gs._hellquakeFired=true;rollHellquake(gs);TRACK.hellquakesFired=(TRACK.hellquakesFired||0)+1};alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+2));gs._directDmg=(gs._directDmg||0)+15;gs._consumeCard=true;break;

    // NEW CARDS apply
    case 'echopedal':{const last=(gs._cardsPlayedIds||[])[gs._cardsPlayedIds.length-1];if(last&&!['echopedal','loopstation','riffthief'].includes(last)){const c=ALL_CARDS.find(x=>x.id===last);if(c)applyCardSim({...c,uid:'echo'},gs,enemy)};break}
    case 'loopstation':{(gs._cardsPlayedIds||[]).slice(-2).filter(id=>!['echopedal','loopstation','riffthief'].includes(id)).forEach(id=>{const c=ALL_CARDS.find(x=>x.id===id);if(c)applyCardSim({...c,uid:'lp'},gs,enemy)});break}
    case 'riffthief':{const last=(gs._cardsPlayedIds||[])[gs._cardsPlayedIds.length-1];if(last&&!['echopedal','loopstation','riffthief'].includes(last)){const c=ALL_CARDS.find(x=>x.id===last);if(c)applyCardSim({...c,uid:'rt'},gs,enemy)};break}
    case 'feedbackscream':target.atk+=4;target.permAtkBonus=(target.permAtkBonus||0)+4;target.hp=Math.max(1,target.hp-2);break;
    case 'skullsplitter':{const b=(target.atk+(target.permAtkBonus||0))>=10?5:3;target.atk+=b;target.permAtkBonus=(target.permAtkBonus||0)+b;break}
    case 'doomchord':target.tempAtkBonus=(target.tempAtkBonus||0)+4;if(gs.corruption>=50){const idx=gs.stage.indexOf(target);[-1,1].forEach(d=>{const n=gs.stage[idx+d];if(n&&!n.tooStoned)n.tempAtkBonus=(n.tempAtkBonus||0)+4})};break;
    case 'bloodharmony':{const idx=gs.stage.indexOf(target);target.tempAtkBonus=(target.tempAtkBonus||0)+2;[-1,1].forEach(d=>{const n=gs.stage[idx+d];if(n&&!n.tooStoned)n.tempAtkBonus=(n.tempAtkBonus||0)+2});break}
    case 'sonicboom':alive.forEach(m=>m.tempAtkBonus=(m.tempAtkBonus||0)+2);drawCards(gs,1);break;
    case 'tremolopick':target.tempAtkBonus=(target.tempAtkBonus||0)+((gs._cardsPlayedIds||[]).length>=3?4:1);break;
    case 'powerslide':target.tempAtkBonus=(target.tempAtkBonus||0)+(target.keyword==='FRENZIED'?3:1);break;
    case 'shredsolo':target.encoreThisStrike=true;break;
    case 'harmonicfb':{const r=(gs._cardsPlayedIds||[]).filter(x=>ALL_CARDS.find(c=>c.id===x&&c.type==='RIFF')).length;const b=Math.max(1,r);target.atk+=b;target.permAtkBonus=(target.permAtkBonus||0)+b;break}
    case 'overdriveped':gs._strikeMult=Math.min(10000,gs._strikeMult*1.5);break;
    case 'devilsdice':{const r=rand(6)+1;if(r>=3&&r<=4)alive.forEach(m=>m.tempAtkBonus=(m.tempAtkBonus||0)+3);else if(r>=5){alive.forEach(m=>m.tempAtkBonus=(m.tempAtkBonus||0)+5);drawCards(gs,2)};break}
    case 'necroticamp':{const b=Math.floor(gs.corruption/20);alive.forEach(m=>m.tempAtkBonus=(m.tempAtkBonus||0)+b);break}
    case 'soulbargain':target.tempAtkBonus=(target.tempAtkBonus||0)+5;target.hp=Math.max(1,target.hp-3);gs.corruption=Math.min(100,gs.corruption+5);break;
    case 'venomriff':target.atk+=3;target.permAtkBonus=(target.permAtkBonus||0)+3;gs.corruption=Math.min(100,gs.corruption+5);break;
    case 'offeringpit':{const other=alive.filter(m=>m.uid!==target.uid);if(other.length)pick(other).tempAtkBonus=(pick(other).tempAtkBonus||0)+8;gs.corruption=Math.min(100,gs.corruption+10);break}
    case 'cursedstrings':target.tempAtkBonus=(target.tempAtkBonus||0)+3;break;
    case 'graverobber':{for(let i=0;i<Math.min(2,gs.discard.length);i++)gs.hand.push(gs.discard.splice(rand(gs.discard.length),1)[0]);gs.corruption=Math.min(100,gs.corruption+5);break}
    case 'hexdecay':gs._directDmg=(gs._directDmg||0)+Math.floor(enemy._hp*0.15);gs.corruption=Math.min(100,gs.corruption+50);break;
    case 'infernalpact':gs.corruption=66;alive.forEach(m=>{m.atk+=2;m.permAtkBonus=(m.permAtkBonus||0)+2});break;
    case 'carrioncall':{const st=gs.stage.find(m=>m.tooStoned);if(st){st.tooStoned=false;st.hp=1;st.atk+=5;st.permAtkBonus=(st.permAtkBonus||0)+5};gs.corruption=Math.min(100,gs.corruption+20);break}
    case 'possessionriff':target.tempAtkBonus=(target.tempAtkBonus||0)+20;gs.corruption=Math.min(100,gs.corruption+10);break;
    case 'darkcrescendo':if(gs.corruption>=80)gs._strikeMult*=3;break;
    case 'russianroulette':{const r=rand(6)+1;if(r===1){target.tooStoned=true;target.hp=0}else if(r<=5)target.tempAtkBonus=(target.tempAtkBonus||0)+4;else{target.tempAtkBonus=(target.tempAtkBonus||0)+8;target.stoneShield=2};break}
    case 'gearcheck':drawCards(gs,2);if(gs.hand.length>0)gs.discard.push(gs.hand.splice(rand(gs.hand.length),1)[0]);break;
    case 'setlistrewrite':break;
    case 'backstagepass':gs._nextCardFree=true;drawCards(gs,1);break;
    case 'venueswap':gs.discard.push(...gs.hand);gs.hand=[];drawCards(gs,6);break;
    case 'doublebooking':gs._extraStrikes=(gs._extraStrikes||0)+1;break;
    case 'bootlegcopy':{if(gs.hand.length>0){const best=gs.hand.filter(c=>!['bootlegcopy','echopedal'].includes(c.id))[0];if(best)gs.hand.push({...best,uid:Math.random().toString(36).slice(2)})};break}
    case 'secondwind':gs.embers=gs.maxEmbers;break;
    case 'pyromaniac':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);gs._pyromaniacActive=true;break;
    case 'slowburn':gs.embers=Math.min(gs.maxEmbers,gs.embers+1);gs._slowBurnStrikes=(gs._slowBurnStrikes||0)+2;break;
    case 'ampfeedback':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);break;
    case 'drainthecrowd':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);{const v=pick(alive);v.hp=Math.max(1,v.hp-2)};break;
    case 'corrsiphon':gs.embers=Math.min(gs.maxEmbers,gs.embers+3);gs.corruption=Math.min(100,gs.corruption+80);break;
  }
  if(enemy.passiveId==='cardHeal')enemy._hp=Math.min(enemy.maxHp,enemy._hp+2);
  if(enemy.passiveId==='cardHeal3b')enemy._hp=Math.min(enemy.maxHp,enemy._hp+25);
  if(enemy.passiveId==='cardHeal3')enemy._hp=Math.min(enemy.maxHp,enemy._hp+3);
  if(enemy.passiveId==='cardHeal4')enemy._hp=Math.min(enemy.maxHp,enemy._hp+4);
  if(enemy.passiveId==='cardHeal5')enemy._hp=Math.min(enemy.maxHp,enemy._hp+50)
  if(enemy.passiveId==='cardHeal6')enemy._hp=Math.min(enemy.maxHp,enemy._hp+6);
  if(enemy.passiveId==='cardHeal8')enemy._hp=Math.min(enemy.maxHp,enemy._hp+80);
}

// Genre system removed — reserved for potential future genre-specific deck

function simFight(gs,phaseHp,luciferPhase){
  const fightIdx=gs.fightIndex
  const baseEnemy=gs._wthFight?{id:'ar_exec',name:'The Executive',maxHp:69000,baseDmg:8,passiveId:'corporate'}:ENEMIES[fightIdx]
  // Progressive HP scaling — per-boss calibrated values or circle-based fallback
  let effectiveMaxHp
  if(BOSS_HP_OVERRIDE&&BOSS_HP_OVERRIDE[fightIdx]){
    effectiveMaxHp=phaseHp||Math.ceil(BOSS_HP_OVERRIDE[fightIdx]*HP_SCALE*(STAKE.hpMult/1.30))
  } else {
    const CIRCLE_HP_SCALE=[1.5, 3.5, 7.0, 14.0, 25.0, 40.0, 60.0, 85.0, 120.0]
    const circleScale=CIRCLE_HP_SCALE[Math.min(8,Math.floor(fightIdx/3))]
    effectiveMaxHp=phaseHp||Math.ceil(baseEnemy.maxHp*circleScale)
  }
  const enemy={...baseEnemy,maxHp:effectiveMaxHp,_hp:effectiveMaxHp,_atkBuff:0,_immolateStacks:0}
  const circleNum=Math.floor(fightIdx/3)+1,isBoss=(fightIdx+1)%3===0
  gs.embers=gs.maxEmbers;gs._tappedOutNext=false;gs._drawNextStrike=0;gs._discardsLeft=MAX_DISCARDS;gs.stashStolen=0;gs._tripBuff=null;gs._corruptCardsGiven=[]
  let maxStrikes=STAKE.maxStrikes+(gs._warDrums?1:0)+(gs._extraStrikes||0)+(DECK_ID_DEF.maxStrikesMod||0);gs._extraStrikes=0
  gs._strikesLeft=maxStrikes
  // ── DECK SIGNATURES — reset per-fight state ──
  gs._shredderEchoesPending=0
  gs._ritualistPrevCorruption=gs.corruption
  gs._ritualistRefundsThisStrike=0
  gs._survivorSavesUsed=new Set()
  gs.stage=arrangeStage(gs.stage);gs.stage.forEach(m=>{if(m)m._hrUsed=false})

  // Fight start artifacts
  if(gs.artifacts.some(a=>a.id==='a1')){const lg=gs.stage.find(m=>m.role==='Lead Guitarist'&&!m.tooStoned);if(lg){lg.atk+=1;lg.permAtkBonus=(lg.permAtkBonus||0)+1}}
  if(gs.artifacts.some(a=>a.id==='a2'))gs.corruption=Math.max(gs.corruption,15);
  if(gs.artifacts.some(a=>a.id==='a4')){const al=gs.stage.filter(m=>!m.tooStoned);if(al.length)pick(al).stoneShield=2}
  if(gs.artifacts.some(a=>a.id==='a7'))gs.embers=Math.min(MAX_EMBERS_CAP,gs.embers+1);
  if(gs.artifacts.some(a=>a.id==='ca1')){gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.atk+=1;m.permAtkBonus=(m.permAtkBonus||0)+1});TRACK.caEffects++}
  const hasHellfire=gs.artifacts.some(a=>a.id==='ca2');
  const hasCrown=gs.artifacts.some(a=>a.id==='ca3');
  const hasWailing=gs.artifacts.some(a=>a.id==='ca4');
  if(gs.passives.some(p=>p.id==='p1'))gs.embers=Math.min(MAX_EMBERS_CAP,gs.embers+1);
  if(hasHellfire)gs.embers=Math.min(MAX_EMBERS_CAP,gs.embers+2);
  if(gs.passives.some(p=>p.id==='p2')){const al=gs.stage.filter(m=>!m.tooStoned);if(al.length){const t=pick(al);t.hp=Math.min(t.maxHp,t.hp+3)}}
  if(gs.passives.some(p=>p.id==='p8'))gs.stage.forEach(m=>{if(!m.tooStoned)m.stoneShield=2});
  let p10=gs.passives.some(p=>p.id==='p10');
  // Boss loot fight-start effects
  if(gs.loot.includes('freeFirst'))gs._nextCardFree=true
  if(gs.artifacts.some(a=>a.id==='a3'))gs._nextCardFree=true
  if(gs._pendingBurnStage){gs.embers=Math.min(MAX_EMBERS_CAP,gs.embers+5);gs._pendingBurnStage=false}
  gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set();gs._allCardsFree=false;gs._hellquakeFired=false
  // ── KEYWORD STACK: ANCHOR fight-start init ───────
  gs._anchorSavesUsed=0
  // Compute ANCHOR tier at fight start (recomputed each strike but capped here)
  {const _anchorCount=gs.stage.filter(m=>!m.tooStoned&&m.keyword==='ANCHOR').reduce((s,m)=>s+(m.foil?2:1),0);
   gs._anchorTier=stackTier(_anchorCount)}
  // Pact: clean_living bonus
  // CORRUPTION THRESHOLDS at fight start
  if(gs.corruption>=25){const _alive=gs.stage.filter(m=>!m.tooStoned);if(_alive.length>0){const _w=_alive.reduce((a,b)=>a.hp<b.hp?a:b);_w.hp=Math.max(1,_w.hp-1);TRACK.whisperDmg++}}
  if(gs.corruption>=100&&!gs._possessionFired){gs._possessionFired=true;gs.stage.forEach(m=>{if(!m.tooStoned&&m.keyword==='CORRUPT'){m.atk+=3;m.permAtkBonus=(m.permAtkBonus||0)+3}});TRACK.possessionBonus++}
  if(gs._pacts.includes('clean_living')&&gs.corruption<15)gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.tempAtkBonus=(m.tempAtkBonus||0)+2});
  // Pact: stone_wall
  const stoneWallActive=gs._pacts.includes('stone_wall');

  const links=scanMentorLinks(gs.stage);gs.mentorLinks=links;
  improveOrdering(gs)
  const dtMult={};gs.stage.filter(m=>m.keyword==='DOUBLE TIME'&&!m.tooStoned).forEach(m=>{const roll=rand(6)+1;dtMult[m.uid]=roll<=2?1.0:roll<=4?1.5:2.0});
  gs.deck=shuffle([...gs.deck,...gs.discard]);gs.discard=[];gs.hand=[];

  // TRIP logic (same as v12)
  const bandHpRatio=gs.stage.filter(m=>!m.tooStoned).reduce((s,m)=>s+m.hp/m.maxHp,0)/(gs.stage.filter(m=>!m.tooStoned).length||1)
  const fightIsHard=circleNum>=5||(isBoss&&circleNum>=4)||fightIdx>=24||gs._wthFight
  const bandIsWeak=bandHpRatio<0.6||gs.stage.filter(m=>m.tooStoned).length>0
  if(gs.heldAcid&&(fightIdx>=21||fightIdx===26||gs._wthFight||(isBoss&&circleNum>=6)||(fightIsHard&&bandIsWeak))){
    const trip=rollTrip('acid');gs.heldAcid=false;TRACK.acidUsed++
    gs._tripBuff=trip
    if(trip==='EGO_DISSOLUTION'){gs.corruption=69;gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.atk+=3;m.permAtkBonus=(m.permAtkBonus||0)+3})}
    else if(trip==='BAD_ACID'){gs.corruption=100}
  } else if(gs.heldShrooms&&(fightIsHard||bandIsWeak||(isBoss&&circleNum>=3))){
    const trip=rollTrip('shrooms');gs.heldShrooms=false;TRACK.shroomsUsed++
    gs._tripBuff=trip
    if(trip==='EGO_DEATH'){gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.atk+=2;m.tempAtkBonus=(m.tempAtkBonus||0)+2})}
    else if(trip==='COSMIC_UNITY'){gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.hp=m.maxHp;m.stoneShield=2})}
    else if(trip==='BAD_SHROOMS'){gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.atk=Math.max(1,m.atk-2)})}
  }

  if(gs._tripBuff==='TIME_DILATION')maxStrikes=Math.max(maxStrikes,5)

  let wthStrikeCount=0
  for(let strike=0;strike<maxStrikes;strike++){
    gs.stage.forEach(m=>{m.tempAtkBonus=0;m.ampedThisStrike=false;m.encoreThisStrike=false});
    gs._directDmg=0;gs._overdriveActive=false;gs._infencoreActive=false;gs._possessedActive=false;gs._nextCardFree=false;
    // ── DECK IDENTITY: hand size override (Engineer 7, Shredder 6) ──
    const _baseHand=DECK_ID_DEF.handSize||HAND_SIZE
    const handSize=_baseHand+(gs._speedDemon?1:0)+(gs._drawNextStrike||0);
    // ── RITUALIST SIGNATURE: reset per-strike ember refund cap ──
    gs._ritualistRefundsThisStrike=0
    drawCards(gs,Math.max(0,handSize-gs.hand.length));gs._drawNextStrike=0;
    if(gs._tappedOutNext){gs.embers=Math.min(gs.maxEmbers,gs.embers+5);gs._tappedOutNext=false}
    if(gs._slowBurnStrikes>0){gs.embers=Math.min(gs.maxEmbers,gs.embers+1);gs._slowBurnStrikes--}
    gs.embers=gs.maxEmbers;

    // WTH: inject contract every 2 strikes
    if(gs._wthFight){wthStrikeCount++;if(wthStrikeCount%2===0&&wthStrikeCount>0)gs.hand.push({id:'contract',type:'CORRUPT',rarity:'Rare',embers:0,uid:'ctr'+wthStrikeCount})}

    gs.stage.filter(m=>m.keyword==='HEXED'&&!m.tooStoned).forEach(m=>{gs.corruption=Math.min(100,gs.corruption+5);m.tempAtkBonus=(m.tempAtkBonus||0)+Math.floor(gs.corruption/12)});
    if(enemy.passiveId==='corruptPlayer')gs.corruption=Math.min(100,gs.corruption+10);
    if(enemy.passiveId==='corruptPlayer15')gs.corruption=Math.min(100,gs.corruption+50);
    if(enemy.passiveId==='corruptPlayer20')gs.corruption=Math.min(100,gs.corruption+20);
    if(enemy.passiveId==='selfbuff')enemy._atkBuff+=1;
    if(enemy.passiveId==='selfbuff2')enemy._atkBuff+=2;

    // CORRUPTION 75%: Madness — 15% chance lose a card before strike
    if(gs.corruption>=75&&Math.random()<0.15&&gs.hand.length>1){const _mi=rand(gs.hand.length);gs.discard.push(gs.hand.splice(_mi,1)[0]);TRACK.madnessCards++}
    let shredderUsed=false,evilEyeUsed=!gs.artifacts.some(a=>a.id==='a3');
    const alive=gs.stage.filter(m=>!m.tooStoned);if(alive.length===0)break;
    let paranoiaVictimUid=null
    if(enemy.passiveId==='paranoia'&&alive.length>1){const victim=pick(alive);paranoiaVictimUid=victim.uid;const allies=alive.filter(m=>m.uid!==victim.uid);if(allies.length>0){const t=pick(allies);t.hp=Math.max(0,t.hp-3)}}

    let cardsPlayed=0;
    for(let att=0;att<15;att++){
      const playable=gs.hand.map((c,idx)=>({c,idx})).filter(({c})=>{
        let cost=c.embers-(gs._tripBuff==='SYNESTHESIA'?1:0);if(gs._allCardsFree)cost=0;else if(!evilEyeUsed)cost=0;else if(gs._nextCardFree)cost=0;
        else if(!shredderUsed&&c.type==='RIFF'&&alive.some(m=>m.keyword==='SHREDDER'))cost=Math.max(0,cost-1);
        cost=Math.max(0,cost)
        if(c.id==='ampoverload'&&gs._discardsLeft<=0)return false;return gs.embers>=cost;
      });if(playable.length===0)break;
      playable.forEach(p=>{p.score=scoreCard(p.c,gs,enemy,strike,cardsPlayed)});playable.sort((a,b)=>b.score-a.score);
      const best=playable[0];if(best.score<=3)break;
      const card=best.c;let cost=card.embers-(gs._tripBuff==='SYNESTHESIA'?1:0);
      if(gs._allCardsFree){cost=0}else if(!evilEyeUsed){cost=0;evilEyeUsed=true}else if(gs._nextCardFree){cost=0;gs._nextCardFree=false}
      else if(!shredderUsed&&card.type==='RIFF'&&alive.some(m=>m.keyword==='SHREDDER')){cost=Math.max(0,cost-1);shredderUsed=true}
      cost=Math.max(0,cost)
      gs.embers-=cost;gs.hand.splice(best.idx,1);
      applyCardSim(card,gs,enemy);if(gs._consumeCard){gs._consumeCard=false}else if(card.id!=='contract')gs.discard.push(card);cardsPlayed++;
      gs._strikeMult=Math.min(10000,Math.round((gs._strikeMult*1.08)*100)/100)
      gs._cardsPlayedIds.push(card.id)
      if(card.type==='EMBER'&&gs.passives.some(p=>p.id==='p4'))gs.embers=Math.min(gs.maxEmbers,gs.embers+1)
      // ── RITUALIST SIGNATURE: Corruption Feeds — refund 1 ember per 10% gained ──
      if(DECK_ID_DEF.signature==='corruption_feeds'){
        const _prev=gs._ritualistPrevCorruption||0
        if(gs.corruption>_prev){
          const stepsBefore=Math.floor(_prev/10)
          const stepsAfter=Math.floor(gs.corruption/10)
          const newSteps=Math.max(0,stepsAfter-stepsBefore)
          const remaining=Math.max(0,5-(gs._ritualistRefundsThisStrike||0))
          const refund=Math.min(newSteps,remaining)
          if(refund>0){
            gs.embers=Math.min(gs.maxEmbers,gs.embers+refund)
            gs._ritualistRefundsThisStrike=(gs._ritualistRefundsThisStrike||0)+refund
          }
        }
        gs._ritualistPrevCorruption=gs.corruption
      }
      // ── ENGINEER SIGNATURE: Copier — 25% chance to dup UTILITY card to hand ──
      // Copies marked _copied to prevent infinite duplication chains.
      if(DECK_ID_DEF.signature==='copier'&&card.type==='UTILITY'&&!card._copied&&Math.random()<0.25){
        gs.hand.push({...card,uid:Math.random().toString(36).slice(2),_copied:true})
        gs._engineerCopies=(gs._engineerCopies||0)+1
      }
      // Riff chain detection
      for(const chain of RIFF_CHAINS_SIM){
        if(gs._cardsPlayedIds.includes(chain[0])&&gs._cardsPlayedIds.includes(chain[1])){
          if(!gs._firedChains)gs._firedChains=new Set()
          const ck=chain[0]+'+'+chain[1]
          if(!gs._firedChains.has(ck)){
            gs._firedChains.add(ck);gs._strikeMult=Math.min(10000,Math.round((gs._strikeMult*1.78)*100)/100)
            gs._directDmg=(gs._directDmg||0)+Math.round(gs.stage.filter(m=>!m.tooStoned).reduce((s,m)=>s+m.atk,0)*0.10)
            TRACK.combosTriggered=(TRACK.combosTriggered||0)+1
            // ── SHREDDER SIGNATURE: queue echo for next strike ──
            if(DECK_ID_DEF.signature==='riff_chain_echo'){
              gs._shredderEchoesPending=(gs._shredderEchoesPending||0)+1
            }
          }
        }
      }
      // Hellquake: only from sabbathsigil card (handled in applyCardSim)
      CARD_PLAYS[card.id]=(CARD_PLAYS[card.id]||0)+1;
      if(gs._drawExtra>0){drawCards(gs,gs._drawExtra);gs._drawExtra=0}
    }

    // STRIKE DAMAGE
    const aliveNow=gs.stage.filter(m=>!m.tooStoned);let strikeDmg=0;
    if(aliveNow.length===0)break; // all died during card play

    // ── KEYWORD STACK BONUSES (variant) ─────────────────────────
    // Compute stack counts (foil = 2, mythic = 1+signature [signatures not modeled])
    const _kwStacks={}
    for(const _m of aliveNow){const _s=_m.foil?2:1;_kwStacks[_m.keyword]=(_kwStacks[_m.keyword]||0)+_s}
    const _frenziedTier=stackTier(_kwStacks.FRENZIED||0)
    const _corruptTier=stackTier(_kwStacks.CORRUPT||0)
    const _shredderTier=stackTier(_kwStacks.SHREDDER||0)
    const _doubleTimeTier=stackTier(_kwStacks['DOUBLE TIME']||0)
    // Count RIFF cards played this strike (for FRENZIED)
    const _cardsPlayed=gs._cardsPlayedIds||[]
    const _riffsThisStrike=_cardsPlayed.filter(id=>CARD_TYPE_BY_ID[id]==='RIFF').length
    // SHREDDER: count consecutive same-type chains (each chain link = +bonus)
    let _shredderHits=0
    if(_cardsPlayed.length>=2){let _run=1;for(let _i=1;_i<_cardsPlayed.length;_i++){
      if(CARD_TYPE_BY_ID[_cardsPlayed[_i]]===CARD_TYPE_BY_ID[_cardsPlayed[_i-1]]){_run++;_shredderHits++}else _run=1
    }}
    const _auraAtk=auraAtkMap(gs.stage,{corruption:gs.corruption,shredderHits:_shredderHits,drumRollOk:Object.values(dtMult).some(v=>v>=1.5)})
    // DOUBLE TIME stack-3: all members attack twice this strike
    if(_doubleTimeTier>=4){for(const _m of aliveNow)_m._kwDoubleStrike=true}
    // Tracking: which keyword stack tiers fired this strike
    for(const _kw of Object.keys(_kwStacks)){
      const _t=stackTier(_kwStacks[_kw])
      if(_t===2)TRACK.kwStack2Reached++
      else if(_t===4)TRACK.kwStack3Reached++
    }

    for(const m of aliveNow){
      if(paranoiaVictimUid&&m.uid===paranoiaVictimUid)continue;
      let atk=m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0);
      // KEYWORD STACK BONUSES (per-member)
      if(m.keyword==='FRENZIED'&&_frenziedTier>0)atk+=_riffsThisStrike*_frenziedTier
      if(m.keyword==='CORRUPT')atk+=Math.floor(gs.corruption/12)*Math.max(1,_corruptTier)
      if(m.keyword==='SHREDDER'&&_shredderTier>0)atk+=_shredderHits*_shredderTier
      atk+=_auraAtk[m.uid]||0
      if(m.ampedThisStrike)atk*=2;if(gs._possessedActive)atk*=3;if(gs._overdriveActive)atk*=2;
      if(dtMult[m.uid]!==undefined)atk=Math.floor(atk*dtMult[m.uid]);
      strikeDmg+=Math.max(0,atk);
      if(m.encoreThisStrike||m._kwDoubleStrike)strikeDmg+=Math.max(0,atk);
    }
    if(gs._infencoreActive)strikeDmg*=2;
    folkAuraHeal(gs.stage)
    let mentorMult=1.0;for(const link of links){const mn=gs.stage[link.mentorIdx],pr=gs.stage[link.protegeIdx];
      if(mn&&!mn.tooStoned&&pr&&!pr.tooStoned){mentorMult*=link.mult;TRACK.linkStrikesFired++}}
    const preLinkDmg=strikeDmg;strikeDmg=Math.floor(strikeDmg*mentorMult);TRACK.linkBonusDmg+=(strikeDmg-preLinkDmg);
    strikeDmg+=gs._directDmg||0;
    if(strike===0&&hasWailing)strikeDmg*=2;
    if(strike===0&&p10)strikeDmg+=10;
    if(gs._tripBuff==='DIMENSIONAL_RIFT'||gs._tripBuff==='FRACTAL_VISION')strikeDmg*=2;
    // Apply strike multiplier (0.03 per card played + 0.15 per combo)
    // Corruption power multiplier
    const corrMult=gs.corruption>=100?3.0:gs.corruption>=80?2.0:gs.corruption>=60?1.5:gs.corruption>=40?1.2:1.0
    if(corrMult>1)strikeDmg=Math.round(strikeDmg*corrMult)
    // Artifact multiplier triggers
    let artMult=1.0
    const _cpc=(gs._cardsPlayedIds||[]).length
    const _cf=gs._firedChains?gs._firedChains.size:0
    const _sc=gs.stage.filter(m=>m.tooStoned).length
    // Extended sim context for new modifier triggers (minimum viable port)
    const _cardsThis=(gs._cardsPlayedIds||[]).map(id=>{
      const isEcho=typeof id==='string'&&id.startsWith('_echo:')
      const realId=isEcho?id.slice(6):id
      const c=ALL_CARDS.find(x=>x.id===realId)
      return c?Object.assign({},c,{_isEchoplexRetrigger:isEcho}):null
    }).filter(Boolean)
    const _realPlays=_cardsThis.filter(c=>!c._isEchoplexRetrigger)
    const _corrCount=_cardsThis.filter(c=>c.type==='CORRUPT').length
    const _riffCount=_cardsThis.filter(c=>c.type==='RIFF').length
    const _allSame=_realPlays.length>=3&&_realPlays.every(c=>c.type===_realPlays[0].type)
    const _aliveNS=gs.stage.filter(m=>!m.tooStoned&&m.hp>0).length
    const _aliveAll=gs.stage.filter(m=>m.hp>0).length
    const _firstType=_cardsThis.length>0?_cardsThis[0].type:null
    const _allHealthy=gs.stage.filter(m=>m).every(m=>m.hp>=Math.ceil((m.maxHp||m.hp)/2))
    const _roleCnts={}
    gs.stage.forEach(m=>{if(m&&m.role)_roleCnts[m.role]=(_roleCnts[m.role]||0)+1})
    const _maxRole=Math.max(0,...Object.values(_roleCnts))
    const _discPlays=_cardsThis.filter(c=>['sigdecay','tappedout','doubledown','goingbroke','burnset'].includes(c.id)).length
    for(const art of gs.artifacts){
      if(!art.multTrigger)continue
      let fires=0
      if(art.multTrigger==='cards3'&&_cpc>=4)fires=1
      if(art.multTrigger==='cards5'&&_cpc>=6)fires=1
      if(art.multTrigger==='corrupt50'&&gs.corruption>=60)fires=1
      if(art.multTrigger==='corrupt80'&&gs.corruption>=80)fires=1
      if(art.multTrigger==='perChain')fires=_cf
      if(art.multTrigger==='perStoned')fires=_sc
      // ── NEW TRIGGERS (minimum viable port) ──
      if(art.multTrigger==='alwaysOn')fires=1
      if(art.multTrigger==='playedRiff'&&_riffCount>0)fires=1
      if(art.multTrigger==='anyStoned'&&_sc>0)fires=1
      if(art.multTrigger==='perAliveMember')fires=_aliveNS
      if(art.multTrigger==='noRiff'&&_riffCount===0&&_cpc>0)fires=1
      if(art.multTrigger==='firstCardEmber'&&_firstType==='EMBER')fires=1
      if(art.multTrigger==='allHealthy'&&_allHealthy)fires=1
      if(art.multTrigger==='lastMemberStanding'&&_aliveAll===1)fires=1
      if(art.multTrigger==='perCorruptCard')fires=_corrCount
      if(art.multTrigger==='perSameRole')fires=Math.max(0,_maxRole)
      if(art.multTrigger==='cards2exact'&&_realPlays.length===2)fires=1
      if(art.multTrigger==='chains3'&&_cf>=3)fires=1
      if(art.multTrigger==='allSameType'&&_allSame)fires=1
      if(art.multTrigger==='perDupePlayed'){const _seen={};let _d=0;_realPlays.forEach(c=>{_seen[c.id]=(_seen[c.id]||0)+1;if(_seen[c.id]>1)_d++});fires=_d}
      if(art.multTrigger==='embers5'&&gs.embers>=5)fires=1
      if(art.multTrigger==='discardedStrike'&&_discPlays>0)fires=1
      if(art.multTrigger==='perDiscardStrike')fires=_discPlays
      if(art.multTrigger==='earlyCircle'&&gs.fightIndex<9)fires=1
      if(art.multTrigger==='doubleTimeRolled'&&Object.values(dtMult).some(v=>v>=1.5))fires=1
      if(art.multTrigger==='perOtherArtifact')fires=Math.max(0,gs.artifacts.length-1)
      if(art.multTrigger==='corrupt100exact'&&gs.corruption===100)fires=1
      if(art.multTrigger==='corruptedClean'&&gs.corruption===100&&_sc===0)fires=1
      if(art.multTrigger==='goatStackOther'){
        const others=Math.max(0,gs.artifacts.length-1)
        artMult*=(art.mult||2.0)*Math.pow(1.3,others)
        continue
      }
      // Skip in sim (need full game state):
      // - embers5, discardedFight, earlyCircle, perDiscardStrike, doubleTimeRolled,
      //   luciferOnStage, sigilOpener, tongueDamage
      if(fires>0)artMult*=Math.pow(art.mult,fires)
    }
    // ca1 'always' legacy trigger now handled by alwaysOn above
    if(artMult>1)strikeDmg=Math.round(strikeDmg*artMult)
    // Boss loot multiplier triggers
    const _lootAlive=gs.stage.filter(m=>!m.tooStoned)
    for(const lid of(gs.loot||[])){
      let fires=0
      if(lid==='limbos_echo')fires=gs._strikesLeft||0
      if(lid==='endless_hunger'&&_lootAlive.length>=4)fires=1
      if(lid==='berserker_rage'&&_lootAlive.some(m=>m.atk>=20))fires=1
      if(lid==='heretics_brand')fires=[25,50,75,100].filter(t=>gs.corruption>=t).length
      if(lid==='the_blade'&&_cpc===1)fires=1
      if(lid==='mask_of_lies')fires=new Set(_lootAlive.map(m=>m.keyword)).size
      const lootDef=[{id:'limbos_echo',mult:1.15},{id:'endless_hunger',mult:1.3},{id:'berserker_rage',mult:1.5},{id:'heretics_brand',mult:1.3},{id:'the_blade',mult:2.0},{id:'mask_of_lies',mult:1.2}].find(l=>l.id===lid)
      if(fires>0&&lootDef)strikeDmg=Math.round(strikeDmg*Math.pow(lootDef.mult,fires))
    }
    if(gs._strikeMult>1.0)strikeDmg=Math.round(strikeDmg*gs._strikeMult)
    if(aliveNow.some(m=>m.keyword==='FOLK MAGIC')&&Math.random()<0.2)gs.embers=gs.maxEmbers;
    gs.highestStrike=Math.max(gs.highestStrike,strikeDmg);gs.totalDamage+=strikeDmg;
    // Reset multiplier + combo tracking for next strike
    gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set()
    if(gs.artifacts.some(a=>a.id==='a3'))gs._nextCardFree=true

    if(enemy.passiveId==='soulThief'){const st=aliveNow.filter(m=>(m.permAtkBonus||0)>0);if(st.length>0){const v=pick(st);v.atk-=1;v.permAtkBonus=(v.permAtkBonus||0)-1;gs.stolenAtkPool++;enemy._atkBuff+=1}}
    if(enemy.passiveId==='luciferBoss'){const ag=luciferPhase===1?1:2;enemy._atkBuff=Math.floor(Math.max(0,(enemy.maxHp-Math.max(0,enemy._hp-strikeDmg)))/20)*ag}

    // ── SHREDDER SIGNATURE: apply pending echoes from PREVIOUS strike's chains ──
    let _echoDmg=0
    if(DECK_ID_DEF.signature==='riff_chain_echo'&&gs._shredderEchoesPending>0){
      _echoDmg=Math.round(strikeDmg*0.33*gs._shredderEchoesPending)
      gs._shredderEchoesPending=0
    }
    enemy._hp-=(strikeDmg+_echoDmg);if(enemy._hp<=0)break;

    // BOSS ATTACKS
    let bossDmg=enemy.baseDmg+enemy._atkBuff+STAKE.dmgAdd+(gs.corruption>=100?3:0);
    if(stoneWallActive)bossDmg=Math.max(1,bossDmg-1);
    if(enemy.passiveId==='stashSteal'&&gs.stash>0){const s=Math.min(gs.stash,1);gs.stash-=s;gs.stashStolen+=s}
    if(enemy.passiveId==='stashSteal2'&&gs.stash>0){const s=Math.min(gs.stash,1);gs.stash-=s;gs.stashStolen+=s}
    if(enemy.passiveId==='stashSteal3'&&gs.stash>0){const s=Math.min(gs.stash,2);gs.stash-=s;gs.stashStolen+=s}
    // ── C5 ANGER CIRCLE BOSS REWORKS ──
    // Wrathful: SELF-IMMOLATING RAGE — loses 8% maxHp/strike, deals +50% damage per strike (cumulative: 1.0x → 1.5x → 2.0x → 2.5x...)
    if(enemy.passiveId==='selfImmolate'){
      const _selfDamage=Math.floor(enemy.maxHp*0.08)
      enemy._hp=Math.max(0,enemy._hp-_selfDamage)
      const _stack=(enemy._immolateStacks||0)
      bossDmg=Math.floor(bossDmg*(1.0+0.5*_stack))
      enemy._immolateStacks=_stack+1
    }
    // Berserker: BLOODLUST — attacks twice per strike when below 50% HP
    let _bloodlustDouble=false
    if(enemy.passiveId==='bloodlust'&&enemy._hp<enemy.maxHp*0.5)_bloodlustDouble=true
    // Warlord: COMMANDS — each strike, applies one of: -1 ATK to all members, lose 1 ember, force-discard 1 hand card
    if(enemy.passiveId==='commands'){
      const _cmdRoll=rand(3)
      if(_cmdRoll===0){aliveNow.forEach(m=>{if(!m.tooStoned){m.atk=Math.max(0,m.atk-1);m.tempAtkBonus=(m.tempAtkBonus||0)-1}})}
      else if(_cmdRoll===1){gs.embers=Math.max(0,gs.embers-1)}
      else if(_cmdRoll===2&&gs.hand.length>0){const _di=rand(gs.hand.length);gs.discard.push(gs.hand[_di]);gs.hand.splice(_di,1)}
    }
    if(enemy.passiveId==='luciferBoss'&&luciferPhase===1){aliveNow.forEach(m=>{m.hp=Math.max(0,m.hp-3)})}
    if(gs._tripBuff==='ASTRAL_PROJECTION')bossDmg=0;
    const debuffers=aliveNow.filter(m=>m.keyword==='DEBUFF').reduce((s,m)=>s+(m.foil?2:1),0);
    const _debuffTier=stackTier(debuffers);
    if(enemy.passiveId!=='luciferBoss'||luciferPhase!==2)bossDmg=Math.max(1,bossDmg-_debuffTier*2*(strike+1));

    // Reset _kwDoubleStrike marker before next strike (it was set this strike, used, now done)
    for(const _m of aliveNow)if(_m._kwDoubleStrike)_m._kwDoubleStrike=false

    // ANCHOR save mechanic: tier-1 saves first lethal/fight, tier-2 saves twice, tier-3 (4) any member can be saved.
    // Helper applied to lethal-damage outcomes below.
    function _anchorTrySave(t){
      if(!gs._anchorTier)return false
      const cap=gs._anchorTier // 1, 2, or 4
      if(gs._anchorSavesUsed>=cap)return false
      // tier 1-2: only ANCHOR members can be saved. tier 3 (cap=4): any member.
      if(cap<4&&t.keyword!=='ANCHOR')return false
      t.hp=1;gs._anchorSavesUsed++;TRACK.anchorSaves=(TRACK.anchorSaves||0)+1;return true
    }
    // ── SURVIVOR SIGNATURE: Second Wind — first member to go tooStoned this fight is healed to 50% HP instead.
    // Returns true if saved. Once per fight.
    function _survivorSecondWindTry(t){
      if(DECK_ID_DEF.signature!=='second_wind')return false
      if(!gs._survivorSavesUsed)gs._survivorSavesUsed=new Set()
      if(gs._survivorSavesUsed.has(t.uid))return false
      gs._survivorSavesUsed.add(t.uid)
      t.hp=Math.max(1,Math.ceil(t.maxHp*0.25))
      TRACK.survivorSaves=(TRACK.survivorSaves||0)+1
      return true
    }

    if(enemy.passiveId==='luciferBoss'&&luciferPhase===2){
      const splitDmg=Math.ceil(bossDmg/aliveNow.length)
      for(const t of aliveNow){t.hp-=Math.max(1,splitDmg-anchorAuraReduction(gs.stage,t.uid));if(t.hp<=0){if(t.stoneShield){t.hp=1;const ns=typeof t.stoneShield==='number'?t.stoneShield-1:0;t.stoneShield=ns>0?ns:false}else if(_anchorTrySave(t)){/* saved */}else if(_survivorSecondWindTry(t)){/* saved */}else{t.tooStoned=true;t.hp=0;gs.tooStonedCount++}}}
    } else {
      let targets;
      if(enemy.passiveId&&enemy.passiveId.startsWith('targetHighestHp')){targets=[[...aliveNow].sort((a,b)=>b.hp-a.hp)[0]];if(enemy.passiveId==='targetHighestHp2')bossDmg=Math.floor(bossDmg*1.2);if(enemy.passiveId==='targetHighestHp3')bossDmg=Math.floor(bossDmg*1.5);}else{targets=[aliveNow[rand(aliveNow.length)]]}
      // BLOODLUST: berserker attacks twice when below 50% HP. Second hit picks a fresh target.
      const _attackRounds=_bloodlustDouble?2:1
      for(let _r=0;_r<_attackRounds;_r++){
        if(_r===1){const _stillAlive=gs.stage.filter(m=>!m.tooStoned);if(_stillAlive.length===0)break;targets=[_stillAlive[rand(_stillAlive.length)]]}
        for(const t of targets){const d=Math.max(1,(targets.length===1?bossDmg:Math.ceil(bossDmg/targets.length))-anchorAuraReduction(gs.stage,t.uid));t.hp-=d;
          if(t.hp<=0){if(t.stoneShield){t.hp=1;const ns=typeof t.stoneShield==='number'?t.stoneShield-1:0;t.stoneShield=ns>0?ns:false}else if(_anchorTrySave(t)){/* saved */}else if(_survivorSecondWindTry(t)){/* saved */}else{t.tooStoned=true;t.hp=0;gs.tooStonedCount++;
            if(gs.artifacts.some(a=>a.id==='a6'))enemy._hp-=8;if(gs.passives.some(p=>p.id==='p6'))gs.stash=Math.min(MAX_STASH,gs.stash+3)}}}
      }
    }

    for(let i=0;i<gs.stage.length;i++){if(gs.stage[i].keyword==='ANCHOR'&&!gs.stage[i].tooStoned){
      if(i>0&&!gs.stage[i-1].tooStoned)gs.stage[i-1].hp=Math.min(gs.stage[i-1].maxHp,gs.stage[i-1].hp+1);
      if(i<gs.stage.length-1&&!gs.stage[i+1].tooStoned)gs.stage[i+1].hp=Math.min(gs.stage[i+1].maxHp,gs.stage[i+1].hp+1)}}
    if(hasCrown)gs.stage.forEach(m=>{if(m.tooStoned){m.tooStoned=false;m.hp=Math.floor(m.maxHp*0.5)}});
    const fraudCount=enemy.passiveId==='fraudShuffle'?1:enemy.passiveId==='fraudShuffle2'?1:enemy.passiveId==='fraudShuffle3'?2:0;
    if(fraudCount>0&&gs.hand.length>0){const toDiscard=Math.min(fraudCount,gs.hand.length);for(let i=0;i<toDiscard;i++){const idx=rand(gs.hand.length);gs.discard.push(gs.hand.splice(idx,1)[0])};drawCards(gs,toDiscard)}
    if(gs.stage.every(m=>m.tooStoned))break;
  }

  const won=enemy._hp<=0,allDead=gs.stage.every(m=>m.tooStoned);
  if(won){
    gs.fightsSurvived++;
    if(gs.stashStolen>0)gs.stash=Math.min(MAX_STASH,gs.stash+gs.stashStolen);
    if(gs.stolenAtkPool>0){const al=gs.stage.filter(m=>!m.tooStoned);if(al.length){const per=Math.floor(gs.stolenAtkPool/al.length);al.forEach(m=>{m.atk+=per;m.permAtkBonus=(m.permAtkBonus||0)+per})};gs.stolenAtkPool=0}
    if(isBoss&&!gs._wthFight){gs.bossKills++;gs.maxEmbers=Math.min(MAX_EMBERS_CAP,gs.maxEmbers+1);
      gs.stage.filter(m=>m.keyword==='FRENZIED'&&!m.tooStoned).forEach(m=>{m.atk+=1;m.permAtkBonus=(m.permAtkBonus||0)+1})}
    if(!gs._wthFight){
      const ci=Math.min(circleNum-1,8),reward=circleBaseMin[ci]+rand(circleBaseRange[ci]+1);
      const merch=gs.passives.some(p=>p.id==='p3')?2:0,corrB=gs.corruption>=69?3:0;
      const total=reward+merch+corrB;gs.stash=Math.min(MAX_STASH,gs.stash+total);gs.stashEarned+=total;
      if(isBoss&&gs.loot.includes('stashBoss')){gs.stash=Math.min(MAX_STASH,gs.stash+5);gs.stashEarned+=5}
      if(gs._strikesLeft>=maxStrikes-1&&gs.artifacts.some(a=>a.id==='a10'))gs._pendingBurnStage=true
    }
    gs.stage.forEach(m=>{if(!m.tooStoned)m.hp=Math.min(m.maxHp,m.hp+2)});
  }
  return{won,allDead};
}

function simEvent(gs){
  const events=['mosh_pit','cursed_amp','blood_oath','hellfire_baptism','sabbath_offering','devils_wager'];
  const avail=events.filter(e=>!gs._eventsSeenThisRun.includes(e));
  if(avail.length===0)return;
  const evt=pick(avail);
  gs._eventsSeenThisRun.push(evt);
  TRACK.eventsTriggered++;
  const alive=gs.stage.filter(m=>!m.tooStoned);

  if(evt==='mosh_pit'){
    // AI: take it if average HP > 6, otherwise walk away
    if(alive.length>0&&alive.reduce((s,m)=>s+m.hp,0)/alive.length>6){
      gs.stage.forEach(m=>{if(!m.tooStoned){m.hp-=4;if(m.hp<=0){m.hp=0;m.tooStoned=true}else{m.atk+=1;m.permAtkBonus=(m.permAtkBonus||0)+1}}});
      TRACK.eventMoshPit++;
    }else{gs.stash=Math.max(0,gs.stash-15)}
  }
  else if(evt==='cursed_amp'){
    // AI: take it if corruption < 40 (locking low is good), refuse if high
    if(gs.corruption<40){gs.maxEmbers=Math.min(10,gs.maxEmbers+2);gs._corruptionLocked=true;TRACK.eventCursedAmp++}
    else{gs.corruption=Math.max(0,gs.corruption-15)}
  }
  else if(evt==='blood_oath'){
    // AI: refuse (too risky — member dies on any boss hit)
    // 25% chance AI takes it if strongest has >8 ATK
    const strongest=alive.length>0?alive.reduce((a,b)=>a.atk>b.atk?a:b):null;
    if(strongest&&strongest.atk>=8&&Math.random()<0.25){
      strongest.atk+=5;strongest.permAtkBonus=(strongest.permAtkBonus||0)+5;strongest.bloodOath=true;
      TRACK.eventBloodOath++
    }
  }
  else if(evt==='hellfire_baptism'){
    // AI: take it if corruption > 40 (already high, +2 ATK worth it)
    if(gs.corruption>40||alive.some(m=>m.keyword==='CORRUPT')){
      gs.corruption=69;gs.stage.forEach(m=>{if(!m.tooStoned){m.atk+=2;m.permAtkBonus=(m.permAtkBonus||0)+2}});
      TRACK.eventHellfire++
    }
  }
  else if(evt==='sabbath_offering'){
    // AI: take it if deck > 40 (deck thinning + ATK buff is always good)
    if(gs.deck.length>40){
      for(let i=0;i<Math.min(3,gs.deck.length);i++){gs.deck.splice(rand(gs.deck.length),1)}
      gs.stage.forEach(m=>{if(!m.tooStoned){m.atk+=1;m.permAtkBonus=(m.permAtkBonus||0)+1}})
      TRACK.eventSabbath++
    }
  }
  else if(evt==='devils_wager'){
    // AI: almost never take (75% refuse)
    if(Math.random()<0.25){
      if(Math.random()<0.5){
        gs.stage.forEach(m=>{if(!m.tooStoned){m.atk+=3;m.permAtkBonus=(m.permAtkBonus||0)+3}})
      }else{
        const strongest=alive.reduce((a,b)=>a.atk>b.atk?a:b);
        if(strongest){strongest.hp=0;strongest.tooStoned=true}
      }
      TRACK.eventWager++
    }
  }
}

// 50% Hunger applied inside simShop via priceMult
function simShop(gs){
  const hungerMult=gs.corruption>=50?1.25:1.0
  const priceMult=(gs._pacts.includes('merchants_eye')?0.8:1.0)*hungerMult

  const circleNum=Math.floor(gs.fightIndex/3)+1;
  if(circleNum!==gs.lastCircle){gs.circleArtBought=false;gs.circlePassBought=false;gs.lastCircle=circleNum}
  const totalMembers=gs.stage.length,needsMembers=totalMembers<5||(gs._pacts.includes('sixth_slot')&&totalMembers<6);
  const discount=gs._pacts.includes('merchants_eye')?0.8:1;

  if(needsMembers){
    let pack;
    if(circleNum>=2&&gs.stash>=Math.ceil(22*discount))pack={name:'Touring',cost:Math.ceil(22*discount),numCandidates:3,foilChance:0.25,mythicChance:0.05,demonicChance:0};
    else if(gs.stash>=Math.ceil(10*discount))pack={name:'Garage',cost:Math.ceil(10*discount),numCandidates:2,foilChance:0,mythicChance:0,demonicChance:0};
    if(pack&&gs.stash>=pack.cost){const candidates=generateCandidates(pack);const chosen=pickBestCandidate(candidates,gs.stage);
      if(chosen){gs.stash-=pack.cost;TRACK.packsOpened++;let placed=false;
        if(isUpgraded(chosen)){for(let i=0;i<gs.stage.length;i++){if(gs.stage[i].role===chosen.role&&!isUpgraded(gs.stage[i])){gs.stage.splice(i,0,chosen);placed=true;break}}}
        else{for(let i=0;i<gs.stage.length;i++){if(gs.stage[i].role===chosen.role&&isUpgraded(gs.stage[i])){gs.stage.splice(i+1,0,chosen);placed=true;break}}}
        if(!placed)gs.stage.push(chosen)}}
  }else{
    if(circleNum>=2&&gs.stash>=Math.ceil(22*discount)){
      const pack=circleNum>=4&&gs.stash>=Math.ceil(40*discount)?{name:'Demonic',cost:Math.ceil(40*discount),numCandidates:4,foilChance:0.25,mythicChance:0.15,demonicChance:0.05}:{name:'Touring',cost:Math.ceil(22*discount),numCandidates:3,foilChance:0.25,mythicChance:0.05,demonicChance:0};
      const candidates=generateCandidates(pack);const chosen=pickBestCandidate(candidates,gs.stage);
      if(chosen&&gs.stash>=pack.cost){
        const linkUids=new Set();gs.mentorLinks.forEach(l=>{if(gs.stage[l.mentorIdx])linkUids.add(gs.stage[l.mentorIdx].uid);if(gs.stage[l.protegeIdx])linkUids.add(gs.stage[l.protegeIdx].uid)});
        const fireable=gs.stage.filter(m=>!linkUids.has(m.uid));
        if(fireable.length>0){const weakest=fireable.reduce((a,b)=>memberScore(a)<memberScore(b)?a:b);
          const chosenVal=memberScore(chosen)+(isUpgraded(chosen)&&gs.stage.some(m=>m.id===chosen.id&&!isUpgraded(m))?200:0);
          if(chosenVal>memberScore(weakest)+30){gs.stage=gs.stage.filter(m=>m.uid!==weakest.uid);gs.stash-=pack.cost;gs.stash+=3;TRACK.packsOpened++;TRACK.pawnSells++;
            let placed=false;if(isUpgraded(chosen)){for(let i=0;i<gs.stage.length;i++){if(gs.stage[i].role===chosen.role&&!isUpgraded(gs.stage[i])){gs.stage.splice(i,0,chosen);placed=true;break}}}
            else{for(let i=0;i<gs.stage.length;i++){if(gs.stage[i].role===chosen.role&&isUpgraded(gs.stage[i])){gs.stage.splice(i+1,0,chosen);placed=true;break}}}
            if(!placed)gs.stage.push(chosen)}}}}
  }

  // ═══ RELIC OFFER (v0.8) — ONE artifact rolled per circle, this circle only, then gone ═══
  if(gs._relicOfferCircle!==circleNum){
    gs._relicOfferCircle=circleNum
    const rw=Math.random(),want=rw<0.60?'common':rw<0.90?'uncommon':'rare'
    const avail=ARTIFACTS.filter(a=>!gs.artifacts.some(o=>o.id===a.id)&&!(gs._relicsSeen||[]).includes(a.id))
    const tier=avail.filter(a=>a.rarity===want)
    gs._relicOffer=(tier.length?tier:avail)[rand((tier.length?tier:avail).length)]||null
    if(gs._relicOffer){gs._relicsSeen=gs._relicsSeen||[];gs._relicsSeen.push(gs._relicOffer.id)}
  }
  if(gs._relicOffer&&!gs.circleArtBought){
    // Expert valuation: expected multiplier from trigger reliability priors, per deck
    const _pri={alwaysOn:1.0,playedRiff:0.9,cards3:0.8,allHealthy:0.5,anyStoned:0.25,perChain:1.2,
      perStoned:0.3,perAliveMember:4.3,perDupePlayed:0.5,firstCardEmber:0.3,embers5:0.35,cards5:0.25,
      corrupt50:DECK_ID==='ritualist'?0.75:0.25,noRiff:0.05,cards2exact:0.08,chains3:0.35,
      perCorruptCard:DECK_ID==='ritualist'?2.2:0.8,perSameRole:1.6,allSameType:0.05,
      corrupt100exact:DECK_ID==='ritualist'?0.25:0.04,lastMemberStanding:0.02,
      discardedStrike:0.55,perDiscardStrike:0.6,earlyCircle:gs.fightIndex<9?1.0:0,
      doubleTimeRolled:gs.stage.some(m=>m.keyword==='DOUBLE TIME')?0.44:0,
      perOtherArtifact:gs.artifacts.length,goatStackOther:1.0}
    const o=gs._relicOffer
    const eF=_pri[o.multTrigger]!==undefined?_pri[o.multTrigger]:0.3
    let eMult=o.multTrigger==='goatStackOther'?o.mult*Math.pow(1.3,gs.artifacts.length):Math.pow(o.mult,eF)
    const val=(eMult-1)/Math.ceil(o.cost*discount)
    const c=Math.ceil(o.cost*discount)
    if(gs.stash>=c&&(gs.artifacts.length<3?val>0.006:false)){
      gs.stash-=c;gs.artifacts.push(o);gs.circleArtBought=true
      TRACK.artPicks=TRACK.artPicks||{};TRACK.artPicks[o.id]=(TRACK.artPicks[o.id]||0)+1
      gs._relicOffer=null
      if(o.startCorr&&gs.corruption<o.startCorr)gs.corruption=o.startCorr
    }else if(gs.stash>=c&&gs.artifacts.length>=3){
      // consider replacing the weakest owned relic if the offer is clearly stronger
      let wi=-1,wv=1e9
      gs.artifacts.forEach((a2,i)=>{const f2=_pri[a2.multTrigger]!==undefined?_pri[a2.multTrigger]:0.3
        const m2=a2.multTrigger==='goatStackOther'?a2.mult*Math.pow(1.3,2):Math.pow(a2.mult||1,f2)
        if(m2<wv){wv=m2;wi=i}})
      if(wi>=0&&eMult>wv*1.35){gs.artifacts.splice(wi,1);gs.stash-=c;gs.artifacts.push(o);gs.circleArtBought=true
        TRACK.artPicks=TRACK.artPicks||{};TRACK.artPicks[o.id]=(TRACK.artPicks[o.id]||0)+1;gs._relicOffer=null}
    }
  }
  // Dive Bar Sign residency refund at Circle IV
  if(circleNum>=4){const di=gs.artifacts.findIndex(a=>a.refundAtC4)
    if(di>=0){gs.artifacts.splice(di,1);gs.stash=Math.min(MAX_STASH,gs.stash+9)}}
  if(!gs.circlePassBought){
    const pool=[{id:'p8',cost:16},{id:'p10',cost:14},{id:'p1',cost:6},{id:'p4',cost:10},{id:'p3',cost:6},{id:'p7',cost:8},{id:'p5',cost:10},{id:'p2',cost:8}];
    for(const pas of pool){const c=Math.ceil(pas.cost*discount);if(gs.stash>=c&&!gs.passives.some(p=>p.id===pas.id)){gs.stash-=c;gs.passives.push(pas);gs.circlePassBought=true;break}}}
  const isBossShop=gs.fightIndex%3===0&&gs.fightIndex>0;
  if(isBossShop){
    const pool=[{id:'ca1',cost:14},{id:'ca4',cost:16},{id:'ca2',cost:17},{id:'ca3',cost:22}];
    for(const ca of pool){const c=Math.ceil(ca.cost*discount);if(gs.stash>=c&&!gs.artifacts.some(a=>a.id===ca.id)){gs.stash-=c;gs.artifacts.push(ca);break}}}

  if(!gs.heldShrooms&&Math.random()<0.50&&gs.stash>=6&&gs.stash>=16){gs.stash-=6;gs.heldShrooms=true;TRACK.shroomsBought++}
  if(!gs.heldAcid&&Math.random()<0.50&&gs.stash>=12&&gs.stash>=22){gs.stash-=12;gs.heldAcid=true;TRACK.acidBought++}

  // 5% chance sigil appears in shop
  if(Math.random()<0.05&&gs.stash>=42&&!gs.deck.some(c=>c.id==='sabbathsigil')&&!gs.discard.some(c=>c.id==='sabbathsigil')){
    gs.deck.push({id:'sabbathsigil',type:'CORRUPT',rarity:'Rare',embers:2,consumable:true});gs.stash-=42;TRACK.sigilsBought=(TRACK.sigilsBought||0)+1
  }
  // DECK THINNING
  burnWeakCards(gs);
}

function newGame(){
  const _sE=DECK_ID_DEF.startEmbers!=null?DECK_ID_DEF.startEmbers:STAKE.startEmbers
  const _sC=DECK_ID_DEF.startCorruption!=null&&DECK_ID_DEF.startCorruption>STAKE.startCorruption?DECK_ID_DEF.startCorruption:STAKE.startCorruption
  return{stage:pickStartingPair(),deck:buildDeck(),discard:[],hand:[],stash:3,embers:_sE,maxEmbers:_sE,corruption:_sC,fightIndex:0,bossKills:0,artifacts:[],passives:[],fightsSurvived:0,totalDamage:0,highestStrike:0,stashEarned:0,tooStonedCount:0,won:false,mentorLinks:[],lastCircle:1,stashStolen:0,
  heldShrooms:false,heldAcid:false,stolenAtkPool:0,circleArtBought:false,circlePassBought:false,
  _pacts:[],_speedDemon:false,_warDrums:false,_genreCounts:{RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0},_activeGenre:null,_wthFight:false,_contractsPlayed:0,_upgradedCards:[],loot:[],_strikeMult:1.0,_cardsPlayedIds:[],_firstStrike:true,_allCardsFree:false,_nextCardFree:false,_pendingBurnStage:false,_eventsSeenThisRun:[],_corruptionLocked:false,_bloodOathUid:null,_possessionFired:false,
  // ── DECK SIGNATURE TRACKING ──
  _shredderEchoesPending:0,        // chains queued for next-strike echo (Shredder)
  _ritualistPrevCorruption:_sC,    // corruption snapshot for refund-step calc (Ritualist)
  _ritualistRefundsThisStrike:0,   // per-strike refund cap (Ritualist)
  _survivorSecondWindUsed:false,   // once-per-fight flag (Survivor)
  _engineerCopies:0                // diagnostic: how many UTILITY copies created
}}

function simGame(){const gs=newGame();let deathFight=-1,deathCause='';
  for(let f=0;f<27;f++){gs.fightIndex=f;
    const circleNum=Math.floor(f/3)+1,isBoss=(f+1)%3===0;

    // DESCENT: decide skips (skip early easy fights for rewards)
    const fightInCircle=f%3; // 0,1,2
    const skips=decideDescentSkips(gs,circleNum);

    if(fightInCircle<2&&skips.includes(fightInCircle)){
      // Skipped this fight — get a small reward instead
      const alive=gs.stage.filter(m=>!m.tooStoned);
      if(fightInCircle===0){gs.stash=Math.min(MAX_STASH,gs.stash+5*alive.length)} // +5 per member
      else{const r=pick(alive);r.atk+=1;r.permAtkBonus=(r.permAtkBonus||0)+1} // random +1 ATK
      gs.fightsSurvived++;
      continue;
    }

    if(f===26){
      TRACK.luciferReached++
      const actualHp=666666 // Jul 31 2026 JV: flat, no scaling — 333,333 per phase
      const phase1Hp=Math.ceil(actualHp/2)
      const phase2Hp=actualHp-phase1Hp
      const r1=simFight(gs,phase1Hp,1)
      if(r1.won){
        TRACK.luciferP1Kills++
        gs.stage.forEach(m=>{m.hp=m.maxHp;m.tooStoned=false;m.stoneShield=false;m.tempAtkBonus=0})
        gs.embers=gs.maxEmbers;gs._tripBuff=null
        const r2=simFight(gs,phase2Hp,2)
        if(r2.won){gs.won=true;TRACK.luciferWins++;break}
        else{deathFight=f;deathCause=r2.allDead?'stoned':'beaten';break}
      } else{deathFight=f;deathCause=r1.allDead?'stoned':'beaten';break}
    } else {
      const result=simFight(gs,null,0)
      if(result.won){
        if(STAKE.healAfterFight)gs.stage.forEach(m=>{if(m&&!m.tooStoned)m.hp=Math.min(m.maxHp,m.hp+2)})
        // PACT: after boss kills, choose best of 2 random pacts
        if(isBoss&&gs._pacts.length<9){
          const available=PACT_IDS.filter(p=>!gs._pacts.includes(p));
          if(available.length>=2){
            const a=pick(available),b=pick(available.filter(x=>x!==a));
            const best=scorePact(a,gs)>=scorePact(b,gs)?a:b;
            gs._pacts.push(best);applyPact(best,gs);TRACK.pactsChosen++;
          }
        }
        // BOSS LOOT
        const loot=BOSS_LOOT_SIM[gs.fightIndex]
        if(loot){
          gs.loot.push(loot.effect)
          const alive=gs.stage.filter(m=>!m.tooStoned)
          if(loot.effect==='atk1all')gs.stage.forEach(m=>{if(m&&!m.tooStoned)m.atk+=1})
          else if(loot.effect==='hp3all')gs.stage.forEach(m=>{if(m){m.maxHp+=3;m.hp+=3}})
          else if(loot.effect==='hp4all')gs.stage.forEach(m=>{if(m){m.maxHp+=4;m.hp+=4}})
          else if(loot.effect==='atk2strong'&&alive.length>0){const s2=alive.reduce((a,b)=>a.atk>b.atk?a:b);s2.atk+=2}
          else if(loot.effect==='atk3strong'&&alive.length>0){const s3=alive.reduce((a,b)=>a.atk>b.atk?a:b);s3.atk+=3}
          TRACK.bossLootCollected=(TRACK.bossLootCollected||0)+1
        }
        // DOOM FORGE: upgrade best card after boss
        if(isBoss){
          const allCards=[...gs.deck,...gs.discard]
          const uniqueIds=[...new Set(allCards.map(c=>c.id))]
          const upgradeable=uniqueIds.filter(id=>UPGRADE_PRIORITY[id]&&!gs._upgradedCards.includes(id))
          if(upgradeable.length>0){
            upgradeable.sort((a,b)=>(UPGRADE_PRIORITY[b]||0)-(UPGRADE_PRIORITY[a]||0))
            const pick_id=upgradeable[0]
            gs._upgradedCards.push(pick_id)
            // Mark cards as upgraded
            gs.deck.forEach(c=>{if(c.id===pick_id)c.upgraded=true})
            gs.discard.forEach(c=>{if(c.id===pick_id)c.upgraded=true})
            // Apply HP buffs
            const hpDef=UPGRADE_HP[pick_id]
            if(hpDef){
              const alive=gs.stage.filter(m=>!m.tooStoned)
              if(hpDef.hp==='all')gs.stage.forEach(m=>{if(m){m.maxHp+=hpDef.amt;m.hp+=hpDef.amt}})
              else if(hpDef.hp==='target'&&alive.length>0){const t=alive.reduce((a,b)=>a.atk>b.atk?a:b);t.maxHp+=hpDef.amt;t.hp+=hpDef.amt}
              else if(hpDef.hp==='weakest'&&alive.length>0){const w=alive.reduce((a,b)=>a.hp<b.hp?a:b);w.maxHp+=hpDef.amt;w.hp+=hpDef.amt}
              else if(hpDef.hp==='random'&&alive.length>0){const r=pick(alive);r.maxHp+=hpDef.amt;r.hp+=hpDef.amt}
            }
            TRACK.forgeUpgrades++
          }
        }
        // RANDOM EVENTS (30% between non-boss fights)
        if(!isBoss&&gs._eventsSeenThisRun.length<6&&Math.random()<0.30){
          simEvent(gs)
        }
        if(fightInCircle<2||isBoss)simShop(gs) // skip shop for skipped fights
      }else{deathFight=f;deathCause=result.allDead?'stoned':'beaten';break}
    }}

  // WELCOME TO HELL: if won, attempt bonus fight
  let wthWon=false;
  if(gs.won){
    // AI: enter WTH if band is strong enough
    const alive=gs.stage.filter(m=>!m.tooStoned),totalAtk=alive.reduce((s,m)=>s+m.atk+(m.permAtkBonus||0),0);
    if(alive.length>=3&&totalAtk>=30){
      TRACK.wthEntered++
      // Shop visit before WTH
      simShop(gs)
      // Reset band for WTH
      gs.stage.forEach(m=>{m.hp=m.maxHp;m.tooStoned=false;m.stoneShield=false;m.tempAtkBonus=0})
      gs._wthFight=true;gs._contractsPlayed=0;
      gs.deck=shuffle([...gs.deck,...gs.discard]);gs.discard=[];gs.hand=[];
      const r=simFight(gs,Math.ceil(69000*STAKE.hpMult),0)
      if(r.won){wthWon=true;TRACK.wthWins++}
    }
  }
  return{won:gs.won,wthWon,deathFight,deathCause,fightsSurvived:gs.fightsSurvived,totalDamage:gs.totalDamage,highestStrike:gs.highestStrike,stageSize:gs.stage.length,mentorLinks:gs.mentorLinks.length,pacts:gs._pacts.length,upgrades:gs._upgradedCards.length}}

// ── RUN SIMULATION ──
console.log(`\n⛧ VESTIBULE SIM v19.1 [${STAKE.name}] [${DECK_ID.toUpperCase()}] — ${NUM_GAMES.toLocaleString()} games\n`);
const t0=Date.now();
TRACK={linksFormed:0,linkStrikesFired:0,linkBonusDmg:0,packsOpened:0,pawnSells:0,caEffects:0,
  shroomsBought:0,acidBought:0,shroomsUsed:0,acidUsed:0,goodTrips:0,badTrips:0,bunkTrips:0,
  luciferReached:0,luciferP1Kills:0,luciferWins:0,
  pactsChosen:0,fightsSkipped:0,cardsDeleted:0,genreActivations:0,wthEntered:0,wthWins:0,contractsSigned:0,forgeUpgrades:0,combosTriggered:0,hellquakesFired:0,bossLootCollected:0,artifactsBought:0,passivesBought:0,eventsTriggered:0,eventMoshPit:0,eventCursedAmp:0,eventBloodOath:0,eventHellfire:0,eventSabbath:0,eventWager:0,whisperDmg:0,hungerExtraCost:0,madnessCards:0,possessionBonus:0,anchorSaves:0,kwStack2Reached:0,kwStack3Reached:0};
CARD_PLAYS={};
const deathsByFight=new Array(27).fill(0),surviveByFight=new Array(27).fill(0);let wins=0,wthWins=0,totalFights=0,gamesWithLinks=0,totalPacts=0;
for(let i=0;i<NUM_GAMES;i++){const r=simGame();totalFights+=r.fightsSurvived;totalPacts+=r.pacts;if(r.mentorLinks>0)gamesWithLinks++;
  if(r.won){wins++;if(r.wthWon)wthWins++;for(let f=0;f<27;f++)surviveByFight[f]++}else{for(let f=0;f<r.deathFight;f++)surviveByFight[f]++;deathsByFight[r.deathFight]++}}
const elapsed=((Date.now()-t0)/1000).toFixed(1);

console.log(`Time: ${elapsed}s | Avg fight reached: ${(totalFights/NUM_GAMES).toFixed(2)} / 26`);
console.log(`Lucifer wins: ${wins} (${(wins/NUM_GAMES*100).toFixed(2)}%)`);
console.log(`WTH wins: ${wthWins} (${(wthWins/NUM_GAMES*100).toFixed(2)}%)\n`);
console.log('SURVIVAL CURVE:');console.log('─'.repeat(80));
const fightNames=ENEMIES.map(e=>e.name);
for(let f=0;f<27;f++){const survPct=(surviveByFight[f]/NUM_GAMES*100).toFixed(1),deathPct=(deathsByFight[f]/NUM_GAMES*100).toFixed(1);
  const bar='█'.repeat(Math.round(surviveByFight[f]/NUM_GAMES*40)),circle=Math.floor(f/3)+1,boss=(f+1)%3===0?' ★':'  ';
  const nameStr=`F${String(f).padStart(2,'0')} ${fightNames[f]}`.padEnd(22)
  let hpVal
  if(BOSS_HP_OVERRIDE&&BOSS_HP_OVERRIDE[f])hpVal=BOSS_HP_OVERRIDE[f]
  else{const CS=[1.5,3.5,7.0,14.0,25.0,40.0,60.0,85.0,120.0];hpVal=Math.ceil(ENEMIES[f].maxHp*CS[Math.min(8,Math.floor(f/3))])}
  const hpStr=hpVal>=1e6?(hpVal/1e6).toFixed(1)+'M':hpVal>=1000?(hpVal/1000).toFixed(1)+'K':hpVal+'';
  const hpDisp=(hpStr+'HP').padStart(10)
  const wall=deathsByFight[f]/NUM_GAMES>0.15?' ← WALL':'';
  console.log(`C${circle}${boss} ${nameStr}${hpDisp} | ${survPct.padStart(5)}% survive | ${deathPct.padStart(5)}% die here ${bar}${wall}`)}
console.log('─'.repeat(80));
console.log(`\nDeath distribution by circle:`);
for(let c=1;c<=9;c++){let d=0;for(let f=(c-1)*3;f<c*3;f++)d+=deathsByFight[f];console.log(`  Circle ${c}: ${(d/NUM_GAMES*100).toFixed(1)}% of runs end here`)}
console.log(`  Lucifer wins: ${(wins/NUM_GAMES*100).toFixed(2)}%`);
console.log(`\n🔮 CORRUPTION THRESHOLDS:`)
console.log(`  Whisper dmg (25%): ${TRACK.whisperDmg.toLocaleString()}`)
console.log(`  Hunger extra cost (50%): applied via shop mult`)
console.log(`  Madness cards lost (75%): ${TRACK.madnessCards.toLocaleString()}`)
console.log(`  Possession bonuses (100%): ${TRACK.possessionBonus.toLocaleString()}`)
console.log(`\n🎲 RANDOM EVENTS:`)
console.log(`  Total events: ${TRACK.eventsTriggered.toLocaleString()} (${(TRACK.eventsTriggered/NUM_GAMES).toFixed(1)}/game)`)
console.log(`  Mosh Pit taken: ${TRACK.eventMoshPit}`)
console.log(`  Cursed Amp taken: ${TRACK.eventCursedAmp}`)
console.log(`  Blood Oath taken: ${TRACK.eventBloodOath}`)
console.log(`  Hellfire Baptism taken: ${TRACK.eventHellfire}`)
console.log(`  Sabbath Offering taken: ${TRACK.eventSabbath}`)
console.log(`  Devil's Wager taken: ${TRACK.eventWager}`)
console.log(`\n⛧ NEW FEATURE STATS:`);
console.log(`  Pacts chosen: ${TRACK.pactsChosen.toLocaleString()} (${(totalPacts/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`  Fights skipped: ${TRACK.fightsSkipped.toLocaleString()} (${(TRACK.fightsSkipped/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`  Cards deleted (burn): ${TRACK.cardsDeleted.toLocaleString()} (${(TRACK.cardsDeleted/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`  Genre activations: ${TRACK.genreActivations.toLocaleString()}`);
console.log(`  WTH entered: ${TRACK.wthEntered} | WTH won: ${TRACK.wthWins}`);
console.log(`  Contracts signed: ${TRACK.contractsSigned}`)
console.log(`  Riff Chains triggered: ${(TRACK.combosTriggered||0).toLocaleString()}`)
console.log(`  Hellquakes fired: ${(TRACK.hellquakesFired||0).toLocaleString()}`)
console.log(`  Boss loot collected: ${(TRACK.bossLootCollected||0).toLocaleString()}`)
console.log(`\n🎸 KEYWORD STACKS (variant rules):`)
console.log(`  Stack-2 strikes (any keyword): ${TRACK.kwStack2Reached.toLocaleString()} (${(TRACK.kwStack2Reached/NUM_GAMES).toFixed(1)}/game)`)
console.log(`  Stack-3 strikes (any keyword): ${TRACK.kwStack3Reached.toLocaleString()} (${(TRACK.kwStack3Reached/NUM_GAMES).toFixed(1)}/game)`)
console.log(`  ANCHOR saves used: ${TRACK.anchorSaves.toLocaleString()} (${(TRACK.anchorSaves/NUM_GAMES).toFixed(1)}/game)`)
console.log(`  Doom Forge upgrades: ${TRACK.forgeUpgrades.toLocaleString()} (${(TRACK.forgeUpgrades/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`\n⛓ MENTOR LINK STATS:`);
console.log(`  Links formed: ${TRACK.linksFormed.toLocaleString()} (${(TRACK.linksFormed/NUM_GAMES).toFixed(2)} per game)`);
console.log(`  Games with active link: ${gamesWithLinks} (${(gamesWithLinks/NUM_GAMES*100).toFixed(1)}%)`);
console.log(`\n🍄🧪 DEALER STATS:`);
console.log(`  Shrooms bought: ${TRACK.shroomsBought.toLocaleString()} | Acid bought: ${TRACK.acidBought.toLocaleString()}`);
console.log(`  Used: ${TRACK.shroomsUsed.toLocaleString()} shrooms, ${TRACK.acidUsed.toLocaleString()} acid`);
console.log(`  Good: ${TRACK.goodTrips.toLocaleString()} | Bad: ${TRACK.badTrips.toLocaleString()} | Bunk: ${TRACK.bunkTrips.toLocaleString()}`);
console.log(`\n😈 LUCIFER: Reached ${TRACK.luciferReached} | P1 kills: ${TRACK.luciferP1Kills} | Wins: ${TRACK.luciferWins}`);

// Card usage
const cardNames={amp:'Amp It Up',dialtoeleven:'Dial to Eleven',soundcheck:'Sound Check',sigdecay:'Signal Decay',battlecry:'Battle Cry',roadie:'Roadie',setlist:'Setlist',groupie:'Groupie',demotape:'Demo Tape',distortion:'Distortion',staticcharge:'Static Charge',powertap:'Power Tap',setbreak:'Smoke Break',crowdsurf:'Crowd Surf',newstrings:'New Strings',encore:'Encore',wakeup:'Wake Up Call',feedbackloop:'Feedback Loop',tappedout:'Tapped Out',controlfeedback:'Controlled Feedback',burnset:'Burn the Set',soundwall:'Sound Wall',doubledown:'Double Down',deathriff:'Death Riff',ampoverload:'Amp Overload',ampstatic:'Amp the Static',seance:'Seance',soundboard:'Soundboard',heavyriff:'Heavy Riff',resonancecard:'Resonance',herbmoney:'Herb Money',darktuning:'Dark Tuning',stagedive:'Stage Dive',overdrive:'Overdrive',infencore:'Infernal Encore',remaster:'The Remaster',sabbathsigil:'Sabbath Sigil',possessedperf:'Possessed Perf',goingbroke:'Going Broke',moshpit:'Mosh Pit',bloodritual:'Blood Ritual',contract:'Record Deal'};
const sorted=Object.entries(CARD_PLAYS).sort((a,b)=>b[1]-a[1]);
const totalPlays=sorted.reduce((s,e)=>s+e[1],0);
console.log(`\n🃏 CARD USAGE (${totalPlays.toLocaleString()} plays):`);console.log('─'.repeat(80));
for(const [id,plays] of sorted){
  const perGame=(plays/NUM_GAMES).toFixed(2);const pctAll=(plays/totalPlays*100).toFixed(1);
  const name=(cardNames[id]||id).padEnd(24);
  let verdict='';if(plays/NUM_GAMES<0.5)verdict='⚠ LOW';if(plays/NUM_GAMES<0.1)verdict='❌ DEAD';
  if(plays/NUM_GAMES>8)verdict='🔥 STAPLE';else if(plays/NUM_GAMES>4)verdict='✅ STRONG';else if(plays/NUM_GAMES>2)verdict='👍 SOLID';
  console.log(`${name} ${String(plays).padStart(9)} ${perGame.padStart(8)}/g ${(pctAll+'%').padStart(6)}  ${verdict}`)}
console.log('─'.repeat(80));
console.log(`\n⛧ Simulation complete.\n`);

process.on('exit',()=>{if(TRACK.artPicks)console.log('RELIC PICKS',JSON.stringify(TRACK.artPicks))})
