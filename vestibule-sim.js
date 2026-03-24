#!/usr/bin/env node
// vestibule-sim.js v14.0 — Expert AI Simulator for Vestibule
// Session 14 — FULL SYNC: pacts, descent, genre bonus, WTH, deck thin, stash tightening
// Usage: node vestibule-sim.js [numGames] [stake]  (default 5000 bronze)

const NUM_GAMES=parseInt(process.argv[2])||5000;
const STAKE_ID=process.argv[3]||'bronze';
const STAKES={
  bronze:{id:'bronze',name:'Bronze',hpMult:1.0,dmgAdd:0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,scoreMult:1.0,mentorBonus:0},
  silver:{id:'silver',name:'Silver',hpMult:1.15,dmgAdd:1,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,scoreMult:1.5,mentorBonus:0.05},
  gold:{id:'gold',name:'Gold',hpMult:1.30,dmgAdd:2,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,scoreMult:2.0,mentorBonus:0.10},
  obsidian:{id:'obsidian',name:'Obsidian',hpMult:1.50,dmgAdd:0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:false,scoreMult:2.5,mentorBonus:0.12},
  blood:{id:'blood',name:'Blood',hpMult:1.75,dmgAdd:3,maxStrikes:4,startEmbers:4,startCorruption:10,healAfterFight:true,scoreMult:3.0,mentorBonus:0.35},
  demonic:{id:'demonic',name:'Demonic ⛧',hpMult:1.8,dmgAdd:4,maxStrikes:3,startEmbers:4,startCorruption:15,healAfterFight:false,scoreMult:4.0,mentorBonus:0.75}
};
const STAKE=STAKES[STAKE_ID]||STAKES.bronze;

const ENEMIES=[
  {id:'wanderer',name:'Wanderer',maxHp:50,baseDmg:4,passiveId:null},
  {id:'lostsoul',name:'Lost Soul',maxHp:75,baseDmg:5,passiveId:null},
  {id:'drifter',name:'Drifter',maxHp:110,baseDmg:7,passiveId:null},
  {id:'siren',name:'Siren',maxHp:100,baseDmg:5,passiveId:'selfbuff'},
  {id:'tempter',name:'Tempter',maxHp:150,baseDmg:6,passiveId:'selfbuff'},
  {id:'lust_boss',name:'Seducer',maxHp:220,baseDmg:7,passiveId:'selfbuff2'},
  {id:'glutton',name:'Glutton',maxHp:130,baseDmg:5,passiveId:'cardHeal'},
  {id:'feaster',name:'Feaster',maxHp:170,baseDmg:6,passiveId:'cardHeal3'},
  {id:'gluttony_boss',name:'Devourer',maxHp:230,baseDmg:7,passiveId:'cardHeal5'},
  {id:'miser',name:'Miser',maxHp:340,baseDmg:4,passiveId:'stashSteal'},
  {id:'hoarder',name:'Hoarder',maxHp:400,baseDmg:5,passiveId:'stashSteal2'},
  {id:'greed_boss',name:'Usurer',maxHp:500,baseDmg:6,passiveId:'stashSteal3'},
  {id:'wrathful',name:'Wrathful',maxHp:900,baseDmg:5,passiveId:'rageScale1'},
  {id:'berserker',name:'Berserker',maxHp:1000,baseDmg:6,passiveId:'rageScale1'},
  {id:'anger_boss',name:'Warlord',maxHp:1111,baseDmg:7,passiveId:'rageScale2'},
  {id:'heretic',name:'Heretic',maxHp:1650,baseDmg:5,passiveId:'corruptPlayer'},
  {id:'apostate',name:'Apostate',maxHp:1900,baseDmg:6,passiveId:'corruptPlayer15'},
  {id:'heresy_boss',name:'False Prophet',maxHp:3000,baseDmg:7,passiveId:'corruptPlayer20'},
  {id:'brute',name:'Brute',maxHp:3000,baseDmg:6,passiveId:'targetHighestHp'},
  {id:'hunter',name:'Hunter',maxHp:4000,baseDmg:7,passiveId:'targetHighestHp2'},
  {id:'violence_boss',name:'Executioner',maxHp:5500,baseDmg:8,passiveId:'targetHighestHp3'},
  {id:'trickster',name:'Trickster',maxHp:5200,baseDmg:6,passiveId:'fraudShuffle'},
  {id:'deceiver',name:'Deceiver',maxHp:6800,baseDmg:7,passiveId:'fraudShuffle2'},
  {id:'fraud_boss',name:'Archfraud',maxHp:9600,baseDmg:8,passiveId:'fraudShuffle3'},
  {id:'traitor',name:'Traitor',maxHp:9000,baseDmg:6,passiveId:'paranoia'},
  {id:'betrayer',name:'Betrayer',maxHp:11400,baseDmg:7,passiveId:'soulThief'},
  {id:'lucifer',name:'LUCIFER',maxHp:420666,baseDmg:9,passiveId:'luciferBoss'},
];

const ALL_MUSICIANS=[
  {id:'bjorn',role:'Lead Guitarist',name:'Bjorn',atk:5,hp:6,maxHp:6,keyword:'FRENZIED'},
  {id:'ragnar',role:'Lead Guitarist',name:'Ragnar',atk:4,hp:7,maxHp:7,keyword:'FRENZIED'},
  {id:'thor',role:'Drummer',name:'Thor',atk:0,hp:8,maxHp:8,keyword:'DOUBLE TIME'},
  {id:'ingrid',role:'Bass Player',name:'Ingrid',atk:3,hp:10,maxHp:10,keyword:'ANCHOR'},
  {id:'loki',role:'Synth Player',name:'Loki',atk:3,hp:6,maxHp:6,keyword:'CORRUPT'},
  {id:'nott',role:'Vocalist',name:'Nott',atk:2,hp:7,maxHp:7,keyword:'DEBUFF'},
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
  {id:'battlecry',type:'RIFF',rarity:'Common',embers:1,copies:4},
  {id:'roadie',type:'UTILITY',rarity:'Common',embers:1,copies:2},
  {id:'setlist',type:'UTILITY',rarity:'Common',embers:1,copies:1},
  {id:'groupie',type:'EMBER',rarity:'Uncommon',embers:1,copies:2},
  {id:'demotape',type:'RIFF',rarity:'Common',embers:2,copies:1},
  {id:'distortion',type:'CORRUPT',rarity:'Common',embers:1,copies:3},
  {id:'staticcharge',type:'CORRUPT',rarity:'Common',embers:0,copies:2},
  {id:'powertap',type:'EMBER',rarity:'Common',embers:0,copies:2},
  {id:'setbreak',type:'UTILITY',rarity:'Common',embers:0,copies:2},
  {id:'crowdsurf',type:'RIFF',rarity:'Common',embers:2,copies:2},
  {id:'newstrings',type:'RIFF',rarity:'Uncommon',embers:2,copies:2},
  {id:'encore',type:'RIFF',rarity:'Uncommon',embers:2,copies:3},
  {id:'wakeup',type:'UTILITY',rarity:'Uncommon',embers:1,copies:2},
  {id:'feedbackloop',type:'CORRUPT',rarity:'Uncommon',embers:3,copies:1},
  {id:'tappedout',type:'EMBER',rarity:'Uncommon',embers:0,copies:2},
  {id:'controlfeedback',type:'CORRUPT',rarity:'Uncommon',embers:2,copies:1},
  {id:'burnset',type:'RIFF',rarity:'Uncommon',embers:1,copies:1},
  {id:'soundwall',type:'RIFF',rarity:'Uncommon',embers:2,copies:1},
  {id:'doubledown',type:'RIFF',rarity:'Uncommon',embers:3,copies:2,shopOnly:true},
  {id:'deathriff',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:2},
  {id:'ampoverload',type:'EMBER',rarity:'Uncommon',embers:0,copies:1},
  {id:'ampstatic',type:'CORRUPT',rarity:'Uncommon',embers:3,copies:2},
  {id:'seance',type:'CORRUPT',rarity:'Uncommon',embers:1,copies:1},
  {id:'soundboard',type:'EMBER',rarity:'Uncommon',embers:1,copies:1},
  {id:'heavyriff',type:'RIFF',rarity:'Uncommon',embers:2,copies:2},
  {id:'resonancecard',type:'RIFF',rarity:'Uncommon',embers:1,copies:3},
  {id:'herbmoney',type:'RIFF',rarity:'Uncommon',embers:1,copies:1},
  {id:'darktuning',type:'CORRUPT',rarity:'Uncommon',embers:3,copies:2},
  {id:'stagedive',type:'RIFF',rarity:'Rare',embers:4,copies:2},
  {id:'overdrive',type:'RIFF',rarity:'Rare',embers:3,copies:1},
  {id:'infencore',type:'RIFF',rarity:'Rare',embers:3,copies:3},
  {id:'remaster',type:'UTILITY',rarity:'Rare',embers:0,copies:1},
  {id:'sabbathsigil',type:'CORRUPT',rarity:'Rare',embers:2,copies:1},
  {id:'possessedperf',type:'RIFF',rarity:'Rare',embers:4,copies:2},
  {id:'goingbroke',type:'RIFF',rarity:'Rare',embers:0,copies:1,shopOnly:true},
  {id:'moshpit',type:'RIFF',rarity:'Uncommon',embers:1,copies:2},
  {id:'bloodritual',type:'CORRUPT',rarity:'Rare',embers:2,copies:1},
];

// ── PACT REWARDS (12 options, sim picks best 1 of 2 offered) ──
const PACT_IDS=['ember_surge','iron_strings','thick_skin','dark_bargain','speed_demon','blood_price','clean_living','corruption_engine','merchants_eye','stone_wall','sixth_slot','war_drums'];

const MAX_STRIKES=4,MAX_DISCARDS=4,HAND_SIZE=6,MAX_STASH=420,MAX_EMBERS_CAP=8;
const circleBaseMin=[8,6,7,8,9,9,11,11,14],circleBaseRange=[3,4,4,3,4,4,5,5,7]; // v12 stash tightening
const MENTOR_LINK_BONUS={foil:{atk:1,hp:2,mult:1.25},mythic:{atk:2,hp:4,mult:1.5},demonic:{atk:4,hp:8,mult:2.0}};
let TRACK={linksFormed:0,linkStrikesFired:0,linkBonusDmg:0,packsOpened:0,pawnSells:0,caEffects:0,
  shroomsBought:0,acidBought:0,shroomsUsed:0,acidUsed:0,goodTrips:0,badTrips:0,bunkTrips:0,
  luciferReached:0,luciferP1Kills:0,luciferWins:0,
  pactsChosen:0,fightsSkipped:0,cardsDeleted:0,genreActivations:0,wthEntered:0,wthWins:0,contractsSigned:0};
let CARD_PLAYS={};

function rand(n){return Math.floor(Math.random()*n)}
function pick(arr){return arr[rand(arr.length)]}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function memberScore(m){return(m.atk+(m.permAtkBonus||0))*3+m.hp+(m.keyword==='FRENZIED'?6:0)+(m.keyword==='CORRUPT'?4:0)+(m.keyword==='FOLK MAGIC'?5:0)+(m.keyword==='HEXED'?3:0)+(m.keyword==='SHREDDER'?3:0)+(m.keyword==='DOUBLE TIME'?2:0)+(m.keyword==='DEBUFF'?2:0)+(m.keyword==='ANCHOR'?1:0)}
function isUpgraded(m){return m.foil||m.mythic||m.demonic}
function makeMember(base,foil,mythic,demonic){
  const m={...base,hp:base.maxHp,tooStoned:false,stoneShield:false,foil:!!foil,mythic:!!mythic,demonic:!!demonic,mentorBonusApplied:false,permAtkBonus:0,tempAtkBonus:0,uid:Math.random().toString(36).slice(2)};
  if(demonic){m.atk+=4;m.maxHp+=8;m.hp=m.maxHp}else if(mythic){m.atk+=2;m.maxHp+=4;m.hp=m.maxHp}else if(foil){m.atk+=1;m.maxHp+=2;m.hp=m.maxHp}
  return m;
}
function buildDeck(){const d=[];for(const c of ALL_CARDS.filter(c=>!c.shopOnly)){for(let i=0;i<(c.copies||2);i++)d.push({...c,uid:Math.random().toString(36).slice(2)})}return shuffle(d)}
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
function pickBestCandidate(candidates,stage){const stageBasicRoles=stage.filter(m=>!isUpgraded(m)).map(m=>m.role),stageUpgradedRoles=stage.filter(m=>isUpgraded(m)).map(m=>m.role),stageRoles=stage.map(m=>m.role);
  let best=null,bestP=-1;for(const c of candidates){let p=memberScore(c);if(isUpgraded(c)){if(stageBasicRoles.includes(c.role))p+=200;else p+=50;if(c.demonic)p+=80;else if(c.mythic)p+=40;else if(c.foil)p+=20}else{if(stageUpgradedRoles.includes(c.role))p+=200}
    if(stageRoles.filter(r=>r===c.role).length>=2&&!isUpgraded(c))p-=30;if(p>bestP){bestP=p;best=c}}return best}
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
    case 'soundwall':return 64;case 'heavyriff':return totalAtk>=10?62:33;case 'crowdsurf':return hand.length>=5?57:28;
    case 'deathriff':return corruption<50?52:18;case 'feedbackloop':return corruption>=40?57:18;
    case 'herbmoney':return stash>=30?52:10;case 'goingbroke':return stash>=50?62:5;
    case 'resonancecard':return highestAtk>=5?54:24;case 'ampstatic':return corruption>=30?50:10;
    case 'doubledown':return cardsPlayed===0&&embers>=3?74:28;
    case 'distortion':return 57;case 'dialtoeleven':return corruption<50?44:14;
    case 'controlfeedback':{const hpR=lowestHp.hp/lowestHp.maxHp;if(hpR<0.3)return 75;if(hpR<0.5&&corruption>=50)return 60;if(corruption>=70)return 55;if(corruption>=40)return 40;return 15}
    case 'sigdecay':return hand.length>=4?48:20;
    case 'darktuning':return corruption>=45?57:15;case 'sabbathsigil':return gs.fightIndex>=18?37:10;
    case 'soundcheck':return anyHurt?58:30;case 'roadie':return alive.some(m=>m.hp<=3)?55:20;
    case 'wakeup':return stage.some(m=>m.tooStoned)?90:alive.some(m=>m.hp<m.maxHp*0.5)?30:8;
    case 'setlist':return hand.length<=4?47:18;
    case 'seance':{const h=Math.floor(corruption/4);return h>=10?60:h>=5?42:15}
    case 'demotape':return cardsPlayed>0?52:0;case 'burnset':return hand.length>=5?42:15;
    case 'remaster':return hand.length>=4?44:10;
    case 'moshpit':{const al=alive.length;return al>=4?65:al>=3?50:30}
    case 'bloodritual':{const hp=alive.reduce((a,b)=>a.hp>b.hp?a:b).hp;return hp>=8?58:30}
    default:return 5;
  }
}

function applyCardSim(card,gs,enemy){
  const{stage}=gs,alive=stage.filter(m=>!m.tooStoned);if(alive.length===0)return;
  const target=alive.reduce((a,b)=>(a.atk+(a.permAtkBonus||0)>b.atk+(b.permAtkBonus||0)?a:b));
  const weakest=alive.reduce((a,b)=>a.hp/a.maxHp<b.hp/b.maxHp?a:b);
  const highestAtk=Math.max(...alive.map(m=>m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0)));
  // Genre tracking
  gs._genreCounts[card.type]=(gs._genreCounts[card.type]||0)+1;
  switch(card.id){
    case 'contract':{const strongest=alive.sort((a,b)=>(b.atk+(b.permAtkBonus||0))-(a.atk+(a.permAtkBonus||0)))[0];strongest.tooStoned=true;strongest.hp=0;gs._contractsPlayed++;TRACK.contractsSigned++;break}
    case 'amp':target.ampedThisStrike=true;break;
    case 'battlecry':{const b=gs.passives.some(p=>p.id==='p7')?2:1;target.atk+=b;target.permAtkBonus=(target.permAtkBonus||0)+b;break}
    case 'newstrings':target.atk+=2;target.permAtkBonus=(target.permAtkBonus||0)+2;break;
    case 'encore':target.encoreThisStrike=true;break;
    case 'soundcheck':alive.forEach(m=>{const h=m.hp<m.maxHp;m.hp=Math.min(m.maxHp,m.hp+4);if(h)m.tempAtkBonus=(m.tempAtkBonus||0)+1});break;
    case 'roadie':weakest.stoneShield=2;weakest.hp=Math.min(weakest.maxHp,weakest.hp+2);break;
    case 'distortion':gs.corruption=Math.min(100,gs.corruption+15);alive.forEach(m=>m.tempAtkBonus=(m.tempAtkBonus||0)+1);break;
    case 'dialtoeleven':gs.corruption=Math.min(100,gs.corruption+20);break;
    case 'controlfeedback':{gs.corruption=50;const ht=alive.reduce((a,b)=>a.hp/a.maxHp<b.hp/b.maxHp?a:b);ht.hp=ht.maxHp;break}
    case 'sigdecay':gs._drawExtra=(gs._drawExtra||0)+2;break;
    case 'feedbackloop':{let d=Math.floor(gs.corruption/2);if(gs._activeGenre==='BLACK_METAL')d=Math.round(d*1.25);gs._directDmg=(gs._directDmg||0)+d;break}
    case 'soundwall':{const cn=Math.floor(gs.fightIndex/3)+1;const sw=cn<=3?5:cn<=6?8:12;gs._directDmg=(gs._directDmg||0)+sw+(gs.passives.some(p=>p.id==='p5')?4:0);break}
    case 'heavyriff':{const ta=alive.reduce((s,m)=>s+m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0),0);gs._directDmg=(gs._directDmg||0)+Math.floor(ta/2);break}
    case 'crowdsurf':gs._directDmg=(gs._directDmg||0)+gs.hand.length*3;break;
    case 'deathriff':gs._directDmg=(gs._directDmg||0)+Math.floor(60*(1-gs.corruption/100));gs.corruption=Math.min(100,gs.corruption+10);break;
    case 'stagedive':gs._directDmg=(gs._directDmg||0)+target.hp;break;
    case 'overdrive':if(gs.corruption>=60)gs._overdriveActive=true;break;
    case 'infencore':gs._infencoreActive=true;break;
    case 'possessedperf':gs._possessedActive=true;break;
    case 'powertap':{gs.embers+=2+(gs.passives.some(p=>p.id==='p4')?1:0);break}
    case 'staticcharge':gs.embers+=gs.corruption===0?4:2;break;
    case 'tappedout':gs._tappedOutNext=true;if(gs.passives.some(p=>p.id==='p4'))gs.embers+=1;break;
    case 'ampoverload':{gs.embers+=3+(gs.passives.some(p=>p.id==='p4')?1:0);gs._discardsLeft=Math.max(0,gs._discardsLeft-1);break}
    case 'groupie':{gs.embers+=2+(gs.passives.some(p=>p.id==='p4')?1:0);gs._drawExtra=(gs._drawExtra||0)+1;break}
    case 'soundboard':{gs.embers+=2+(gs.passives.some(p=>p.id==='p4')?1:0);gs._drawNextStrike=(gs._drawNextStrike||0)+1;break}
    case 'setbreak':gs.embers+=2;break;
    case 'setlist':gs._drawExtra=(gs._drawExtra||0)+2;break;
    case 'doubledown':gs._nextCardFree=true;break;
    case 'wakeup':alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+2));stage.forEach(m=>{if(m.tooStoned){m.tooStoned=false;m.hp=m.maxHp}});break;
    case 'demotape':gs._directDmg=(gs._directDmg||0)+Math.floor((target.atk+(target.permAtkBonus||0))*0.5);break;
    case 'resonancecard':target.tempAtkBonus=(target.tempAtkBonus||0)+Math.max(0,highestAtk-(target.atk+(target.permAtkBonus||0)+(target.tempAtkBonus||0)));break;
    case 'ampstatic':{let b=Math.floor(gs.corruption/10);if(gs._activeGenre==='BLACK_METAL')b=Math.round(b*1.25);target.tempAtkBonus=(target.tempAtkBonus||0)+b;break}
    case 'darktuning':{const bu=Math.floor(gs.corruption/10);for(let i=0;i<bu;i++){const t=pick(alive);t.atk+=1;t.permAtkBonus=(t.permAtkBonus||0)+1}break}
    case 'herbmoney':{gs._directDmg=(gs._directDmg||0)+gs.stash;break}
    case 'goingbroke':gs._directDmg=(gs._directDmg||0)+gs.stash;gs.stash=0;break;
    case 'burnset':gs._drawExtra=(gs._drawExtra||0)+1;break;
    case 'remaster':gs._drawExtra=(gs._drawExtra||0)+3;break;
    case 'seance':{const h=Math.max(1,Math.floor(gs.corruption/4));alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+h));break}
    case 'moshpit':{gs._directDmg=(gs._directDmg||0)+alive.length*3;break}
    case 'bloodritual':{const t=alive.reduce((a,b)=>a.hp>b.hp?a:b);const sac=Math.floor(t.hp*0.25);t.hp-=sac;gs._directDmg=(gs._directDmg||0)+sac*6;gs.corruption=Math.min(100,gs.corruption+15);break}
    case 'sabbathsigil':gs.corruption=100;alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+2));gs._directDmg=(gs._directDmg||0)+15;break;
  }
  if(enemy.passiveId==='cardHeal')enemy._hp=Math.min(enemy.maxHp,enemy._hp+2);
  if(enemy.passiveId==='cardHeal3')enemy._hp=Math.min(enemy.maxHp,enemy._hp+3);
  if(enemy.passiveId==='cardHeal4')enemy._hp=Math.min(enemy.maxHp,enemy._hp+4);
  if(enemy.passiveId==='cardHeal5')enemy._hp=Math.min(enemy.maxHp,enemy._hp+5);
}

// ── GENRE BONUS COMPUTATION ──
function computeGenre(gs){
  const gc=gs._genreCounts,total=gc.RIFF+gc.CORRUPT+gc.UTILITY+gc.EMBER;
  if(total<4)return null;
  if(gc.RIFF/total>=0.5)return'RIFF_METAL';
  if(gc.CORRUPT/total>=0.5)return'BLACK_METAL';
  if(gc.UTILITY/total>=0.5)return'PROG_ROCK';
  if(gc.EMBER/total>=0.5)return'DOOM_METAL';
  return null;
}

function simFight(gs,phaseHp,luciferPhase){
  const fightIdx=gs.fightIndex
  const baseEnemy=gs._wthFight?{id:'ar_exec',name:'The Executive',maxHp:100000,baseDmg:8,passiveId:'corporate'}:ENEMIES[fightIdx]
  const effectiveMaxHp=phaseHp||Math.ceil(baseEnemy.maxHp*STAKE.hpMult)
  const enemy={...baseEnemy,maxHp:effectiveMaxHp,_hp:effectiveMaxHp,_atkBuff:0}
  const circleNum=Math.floor(fightIdx/3)+1,isBoss=(fightIdx+1)%3===0
  gs.embers=gs.maxEmbers;gs._tappedOutNext=false;gs._drawNextStrike=0;gs._discardsLeft=MAX_DISCARDS;gs.stashStolen=0;gs._tripBuff=null
  let maxStrikes=STAKE.maxStrikes+(gs._warDrums?1:0)
  gs._strikesLeft=maxStrikes
  gs.stage=arrangeStage(gs.stage)

  // Fight start artifacts
  if(gs.artifacts.some(a=>a.id==='a1'))gs.stage.filter(m=>m.role==='Lead Guitarist'&&!m.tooStoned).forEach(m=>{m.atk+=1;m.permAtkBonus=(m.permAtkBonus||0)+1});
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
  // Pact: clean_living bonus
  if(gs._pacts.includes('clean_living')&&gs.corruption===0)gs.stage.filter(m=>!m.tooStoned).forEach(m=>{m.tempAtkBonus=(m.tempAtkBonus||0)+2});
  // Pact: stone_wall
  const stoneWallActive=gs._pacts.includes('stone_wall');

  const links=scanMentorLinks(gs.stage);gs.mentorLinks=links;
  const dtMult={};gs.stage.filter(m=>m.keyword==='DOUBLE TIME'&&!m.tooStoned).forEach(m=>{const roll=rand(6)+1;dtMult[m.uid]=roll<=2?0.5:roll<=4?1.5:2.0});
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
    const handSize=HAND_SIZE+(gs._speedDemon?1:0)+(gs._drawNextStrike||0);
    drawCards(gs,Math.max(0,handSize-gs.hand.length));gs._drawNextStrike=0;
    if(gs._tappedOutNext){gs.embers+=5;gs._tappedOutNext=false}
    gs.embers=gs.maxEmbers;
    // Genre bonus: PROG_ROCK +1 draw
    gs._activeGenre=computeGenre(gs);
    if(gs._activeGenre==='PROG_ROCK')drawCards(gs,1);

    // WTH: inject contract every 2 strikes
    if(gs._wthFight){wthStrikeCount++;if(wthStrikeCount%2===0&&wthStrikeCount>0)gs.hand.push({id:'contract',type:'CORRUPT',rarity:'Rare',embers:0,uid:'ctr'+wthStrikeCount})}

    gs.stage.filter(m=>m.keyword==='HEXED'&&!m.tooStoned).forEach(m=>{gs.corruption=Math.min(100,gs.corruption+5);m.tempAtkBonus=(m.tempAtkBonus||0)+Math.floor(gs.corruption/10)});
    if(enemy.passiveId==='corruptPlayer')gs.corruption=Math.min(100,gs.corruption+10);
    if(enemy.passiveId==='corruptPlayer15')gs.corruption=Math.min(100,gs.corruption+15);
    if(enemy.passiveId==='corruptPlayer20')gs.corruption=Math.min(100,gs.corruption+20);
    if(enemy.passiveId==='selfbuff')enemy._atkBuff+=1;
    if(enemy.passiveId==='selfbuff2')enemy._atkBuff+=2;

    let shredderUsed=false,evilEyeUsed=!gs.artifacts.some(a=>a.id==='a3');
    const alive=gs.stage.filter(m=>!m.tooStoned);if(alive.length===0)break;
    let paranoiaVictimUid=null
    if(enemy.passiveId==='paranoia'&&alive.length>1){const victim=pick(alive);paranoiaVictimUid=victim.uid;const allies=alive.filter(m=>m.uid!==victim.uid);if(allies.length>0){const t=pick(allies);t.hp=Math.max(0,t.hp-3)}}

    let cardsPlayed=0;
    for(let att=0;att<14;att++){
      const playable=gs.hand.map((c,idx)=>({c,idx})).filter(({c})=>{
        let cost=c.embers-(gs._tripBuff==='SYNESTHESIA'?1:0);if(!evilEyeUsed)cost=0;else if(gs._nextCardFree)cost=0;
        else if(!shredderUsed&&c.type==='RIFF'&&alive.some(m=>m.keyword==='SHREDDER'))cost=Math.max(0,cost-1);
        cost=Math.max(0,cost)
        if(c.id==='ampoverload'&&gs._discardsLeft<=0)return false;return gs.embers>=cost;
      });if(playable.length===0)break;
      playable.forEach(p=>{p.score=scoreCard(p.c,gs,enemy,strike,cardsPlayed)});playable.sort((a,b)=>b.score-a.score);
      const best=playable[0];if(best.score<=3)break;
      const card=best.c;let cost=card.embers-(gs._tripBuff==='SYNESTHESIA'?1:0);
      if(!evilEyeUsed){cost=0;evilEyeUsed=true}else if(gs._nextCardFree){cost=0;gs._nextCardFree=false}
      else if(!shredderUsed&&card.type==='RIFF'&&alive.some(m=>m.keyword==='SHREDDER')){cost=Math.max(0,cost-1);shredderUsed=true}
      cost=Math.max(0,cost)
      gs.embers-=cost;gs.hand.splice(best.idx,1);
      applyCardSim(card,gs,enemy);if(card.id!=='contract')gs.discard.push(card);cardsPlayed++;
      CARD_PLAYS[card.id]=(CARD_PLAYS[card.id]||0)+1;
      if(gs._drawExtra>0){drawCards(gs,gs._drawExtra);gs._drawExtra=0}
    }

    // STRIKE DAMAGE
    const aliveNow=gs.stage.filter(m=>!m.tooStoned);let strikeDmg=0;
    for(const m of aliveNow){
      if(paranoiaVictimUid&&m.uid===paranoiaVictimUid)continue;
      let atk=m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0);
      if(m.keyword==='CORRUPT')atk+=Math.floor(gs.corruption/10);
      if(m.ampedThisStrike)atk*=2;if(gs._possessedActive)atk*=3;if(gs._overdriveActive)atk*=2;
      if(dtMult[m.uid]!==undefined)atk=Math.floor(atk*dtMult[m.uid]);
      strikeDmg+=Math.max(0,atk);if(m.encoreThisStrike)strikeDmg+=Math.max(0,atk);
    }
    if(gs._infencoreActive)strikeDmg*=2;
    let mentorMult=1.0;for(const link of links){const mn=gs.stage[link.mentorIdx],pr=gs.stage[link.protegeIdx];
      if(mn&&!mn.tooStoned&&pr&&!pr.tooStoned){mentorMult*=link.mult;TRACK.linkStrikesFired++}}
    const preLinkDmg=strikeDmg;strikeDmg=Math.floor(strikeDmg*mentorMult);TRACK.linkBonusDmg+=(strikeDmg-preLinkDmg);
    strikeDmg+=gs._directDmg||0;
    if(strike===0&&hasWailing)strikeDmg*=2;
    if(strike===0&&p10)strikeDmg+=10;
    // Genre bonus: RIFF_METAL +15%, DOOM_METAL +2/member if no discards used
    if(gs._activeGenre==='RIFF_METAL'){strikeDmg=Math.round(strikeDmg*1.15);TRACK.genreActivations++}
    if(gs._activeGenre==='DOOM_METAL'&&gs._discardsLeft>=MAX_DISCARDS){strikeDmg+=aliveNow.length*2;TRACK.genreActivations++}
    if(gs._tripBuff==='DIMENSIONAL_RIFT'||gs._tripBuff==='FRACTAL_VISION')strikeDmg*=2;
    if(aliveNow.some(m=>m.keyword==='FOLK MAGIC')&&Math.random()<0.2)gs.embers=gs.maxEmbers;
    gs.highestStrike=Math.max(gs.highestStrike,strikeDmg);gs.totalDamage+=strikeDmg;

    if(enemy.passiveId==='soulThief'){const st=aliveNow.filter(m=>(m.permAtkBonus||0)>0);if(st.length>0){const v=pick(st);v.atk-=1;v.permAtkBonus=(v.permAtkBonus||0)-1;gs.stolenAtkPool++;enemy._atkBuff+=1}}
    if(enemy.passiveId==='luciferBoss'){const ag=luciferPhase===1?1:2;enemy._atkBuff=Math.floor(Math.max(0,(enemy.maxHp-Math.max(0,enemy._hp-strikeDmg)))/20)*ag}

    enemy._hp-=strikeDmg;if(enemy._hp<=0)break;

    // BOSS ATTACKS
    let bossDmg=enemy.baseDmg+enemy._atkBuff+STAKE.dmgAdd;
    if(stoneWallActive)bossDmg=Math.max(1,bossDmg-1);
    if(enemy.passiveId==='stashSteal'&&gs.stash>0){const s=Math.min(gs.stash,1);gs.stash-=s;gs.stashStolen+=s}
    if(enemy.passiveId==='stashSteal2'&&gs.stash>0){const s=Math.min(gs.stash,2);gs.stash-=s;gs.stashStolen+=s}
    if(enemy.passiveId==='stashSteal3'&&gs.stash>0){const s=Math.min(gs.stash,3);gs.stash-=s;gs.stashStolen+=s}
    if(enemy.passiveId==='rageScale1'){const bf=aliveNow.filter(m=>(m.permAtkBonus||0)>0||(m.tempAtkBonus||0)>0).length;bossDmg+=bf*1}
    if(enemy.passiveId==='rageScale2'){const bf=aliveNow.filter(m=>(m.permAtkBonus||0)>0||(m.tempAtkBonus||0)>0).length;bossDmg+=bf*2}
    if(enemy.passiveId==='luciferBoss'&&luciferPhase===1){aliveNow.forEach(m=>{m.hp=Math.max(0,m.hp-3)})}
    if(gs._tripBuff==='ASTRAL_PROJECTION')bossDmg=0;
    const debuffers=aliveNow.filter(m=>m.keyword==='DEBUFF').length;
    if(enemy.passiveId!=='luciferBoss'||luciferPhase!==2)bossDmg=Math.max(1,bossDmg-debuffers*2*(strike+1));

    if(enemy.passiveId==='luciferBoss'&&luciferPhase===2){
      const splitDmg=Math.ceil(bossDmg/aliveNow.length)
      for(const t of aliveNow){t.hp-=splitDmg;if(t.hp<=0){if(t.stoneShield){t.hp=1;const ns=typeof t.stoneShield==='number'?t.stoneShield-1:0;t.stoneShield=ns>0?ns:false}else{t.tooStoned=true;t.hp=0;gs.tooStonedCount++}}}
    } else {
      let targets;
      if(enemy.passiveId&&enemy.passiveId.startsWith('targetHighestHp')){targets=[[...aliveNow].sort((a,b)=>b.hp-a.hp)[0]];if(enemy.passiveId==='targetHighestHp2')bossDmg=Math.floor(bossDmg*1.5);if(enemy.passiveId==='targetHighestHp3')bossDmg*=2;}else{targets=[aliveNow[rand(aliveNow.length)]]}
      for(const t of targets){const d=targets.length===1?bossDmg:Math.ceil(bossDmg/targets.length);t.hp-=d;
        if(t.hp<=0){if(t.stoneShield){t.hp=1;const ns=typeof t.stoneShield==='number'?t.stoneShield-1:0;t.stoneShield=ns>0?ns:false}else{t.tooStoned=true;t.hp=0;gs.tooStonedCount++;
          if(gs.artifacts.some(a=>a.id==='a6'))enemy._hp-=8;if(gs.passives.some(p=>p.id==='p6'))gs.stash=Math.min(MAX_STASH,gs.stash+3)}}}
    }

    for(let i=0;i<gs.stage.length;i++){if(gs.stage[i].keyword==='ANCHOR'&&!gs.stage[i].tooStoned){
      if(i>0&&!gs.stage[i-1].tooStoned)gs.stage[i-1].hp=Math.min(gs.stage[i-1].maxHp,gs.stage[i-1].hp+1);
      if(i<gs.stage.length-1&&!gs.stage[i+1].tooStoned)gs.stage[i+1].hp=Math.min(gs.stage[i+1].maxHp,gs.stage[i+1].hp+1)}}
    if(hasCrown)gs.stage.forEach(m=>{if(m.tooStoned){m.tooStoned=false;m.hp=Math.floor(m.maxHp*0.5)}});
    const fraudCount=enemy.passiveId==='fraudShuffle'?1:enemy.passiveId==='fraudShuffle2'?2:enemy.passiveId==='fraudShuffle3'?3:0;
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
    }
    gs.stage.forEach(m=>{if(!m.tooStoned)m.hp=Math.min(m.maxHp,m.hp+2)});
  }
  return{won,allDead};
}

function simShop(gs){
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

  // Artifacts
  if(!gs.circleArtBought){
    const pool=[{id:'a3',cost:20},{id:'a7',cost:18},{id:'a8',cost:12},{id:'a1',cost:10},{id:'a6',cost:12},{id:'a4',cost:6},{id:'a2',cost:8},{id:'a10',cost:10}];
    for(const art of pool){const c=Math.ceil(art.cost*discount);if(gs.stash>=c&&!gs.artifacts.some(a=>a.id===art.id)){gs.stash-=c;gs.artifacts.push(art);gs.circleArtBought=true;
      if(art.id==='a8')gs.stage.forEach(m=>{m.maxHp+=3;m.hp=Math.min(m.maxHp,m.hp+3)});break}}}
  if(!gs.circlePassBought){
    const pool=[{id:'p8',cost:16},{id:'p10',cost:14},{id:'p1',cost:6},{id:'p4',cost:10},{id:'p3',cost:6},{id:'p7',cost:8},{id:'p5',cost:10},{id:'p2',cost:8}];
    for(const pas of pool){const c=Math.ceil(pas.cost*discount);if(gs.stash>=c&&!gs.passives.some(p=>p.id===pas.id)){gs.stash-=c;gs.passives.push(pas);gs.circlePassBought=true;break}}}
  const isBossShop=gs.fightIndex%3===0&&gs.fightIndex>0;
  if(isBossShop){
    const pool=[{id:'ca1',cost:14},{id:'ca4',cost:16},{id:'ca2',cost:17},{id:'ca3',cost:22}];
    for(const ca of pool){const c=Math.ceil(ca.cost*discount);if(gs.stash>=c&&!gs.artifacts.some(a=>a.id===ca.id)){gs.stash-=c;gs.artifacts.push(ca);break}}}

  if(!gs.heldShrooms&&Math.random()<0.50&&gs.stash>=6&&gs.stash>=16){gs.stash-=6;gs.heldShrooms=true;TRACK.shroomsBought++}
  if(!gs.heldAcid&&Math.random()<0.50&&gs.stash>=12&&gs.stash>=22){gs.stash-=12;gs.heldAcid=true;TRACK.acidBought++}

  // DECK THINNING
  burnWeakCards(gs);
}

function newGame(){return{stage:pickStartingPair(),deck:buildDeck(),discard:[],hand:[],stash:3,embers:STAKE.startEmbers,maxEmbers:STAKE.startEmbers,corruption:STAKE.startCorruption,fightIndex:0,bossKills:0,artifacts:[],passives:[],fightsSurvived:0,totalDamage:0,highestStrike:0,stashEarned:0,tooStonedCount:0,won:false,mentorLinks:[],lastCircle:1,stashStolen:0,
  heldShrooms:false,heldAcid:false,stolenAtkPool:0,circleArtBought:false,circlePassBought:false,
  _pacts:[],_speedDemon:false,_warDrums:false,_genreCounts:{RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0},_activeGenre:null,_wthFight:false,_contractsPlayed:0}}

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
      const actualHp=Math.ceil(Math.max(666,420666-8*51750)*STAKE.hpMult)
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
      const r=simFight(gs,Math.ceil(100000*STAKE.hpMult),0)
      if(r.won){wthWon=true;TRACK.wthWins++}
    }
  }
  return{won:gs.won,wthWon,deathFight,deathCause,fightsSurvived:gs.fightsSurvived,totalDamage:gs.totalDamage,highestStrike:gs.highestStrike,stageSize:gs.stage.length,mentorLinks:gs.mentorLinks.length,pacts:gs._pacts.length}}

// ── RUN SIMULATION ──
console.log(`\n⛧ VESTIBULE SIM v14.0 [${STAKE.name}] — ${NUM_GAMES.toLocaleString()} games\n`);
const t0=Date.now();
TRACK={linksFormed:0,linkStrikesFired:0,linkBonusDmg:0,packsOpened:0,pawnSells:0,caEffects:0,
  shroomsBought:0,acidBought:0,shroomsUsed:0,acidUsed:0,goodTrips:0,badTrips:0,bunkTrips:0,
  luciferReached:0,luciferP1Kills:0,luciferWins:0,
  pactsChosen:0,fightsSkipped:0,cardsDeleted:0,genreActivations:0,wthEntered:0,wthWins:0,contractsSigned:0};
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
  const nameStr=`F${String(f).padStart(2,'0')} ${fightNames[f]}`.padEnd(22),hpStr=f===26?Math.ceil(6666*STAKE.hpMult)+'HP':Math.ceil(ENEMIES[f].maxHp*STAKE.hpMult)+'HP';
  const wall=deathsByFight[f]/NUM_GAMES>0.15?' ← WALL':'';
  console.log(`C${circle}${boss} ${nameStr}${hpStr.padStart(8)} | ${survPct.padStart(5)}% survive | ${deathPct.padStart(5)}% die here ${bar}${wall}`)}
console.log('─'.repeat(80));
console.log(`\nDeath distribution by circle:`);
for(let c=1;c<=9;c++){let d=0;for(let f=(c-1)*3;f<c*3;f++)d+=deathsByFight[f];console.log(`  Circle ${c}: ${(d/NUM_GAMES*100).toFixed(1)}% of runs end here`)}
console.log(`  Lucifer wins: ${(wins/NUM_GAMES*100).toFixed(2)}%`);
console.log(`\n⛧ NEW FEATURE STATS:`);
console.log(`  Pacts chosen: ${TRACK.pactsChosen.toLocaleString()} (${(totalPacts/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`  Fights skipped: ${TRACK.fightsSkipped.toLocaleString()} (${(TRACK.fightsSkipped/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`  Cards deleted (burn): ${TRACK.cardsDeleted.toLocaleString()} (${(TRACK.cardsDeleted/NUM_GAMES).toFixed(1)} avg/game)`);
console.log(`  Genre activations: ${TRACK.genreActivations.toLocaleString()}`);
console.log(`  WTH entered: ${TRACK.wthEntered} | WTH won: ${TRACK.wthWins}`);
console.log(`  Contracts signed: ${TRACK.contractsSigned}`);
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
