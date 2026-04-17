#!/usr/bin/env node
// vestibule-lab.js — Deck Optimizer & Card Testing Lab
// Usage:
//   node vestibule-lab.js test              — test current deck (baseline)
//   node vestibule-lab.js test new          — test with new cards swapped in
//   node vestibule-lab.js optimize          — hill-climb to find optimal 69-card deck
//   node vestibule-lab.js compare           — run baseline vs new side by side

const MODE=process.argv[2]||'test'
const GAMES=parseInt(process.argv[3])||2000
const rand=n=>Math.floor(Math.random()*n)
const pick=a=>a[rand(a.length)]
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=rand(i+1);[b[i],b[j]]=[b[j],b[i]]};return b}
let uid_ctr=1;const uid=()=>'u'+(uid_ctr++)

// ═══════════════════════════════════════════════════════════════════
// FULL CARD POOL — old cards + new experimental cards
// ═══════════════════════════════════════════════════════════════════

const CARD_POOL={
  // ── EXISTING CARDS (from v19.1) ──────────────────────────────
  amp:          {type:'RIFF',rarity:'Common',embers:2,   desc:'+ATK to target (amped flag for ×2)'},
  battlecry:    {type:'RIFF',rarity:'Common',embers:2,   desc:'+1 ATK permanently (Guitar Tech: +2)'},
  newstrings:   {type:'RIFF',rarity:'Uncommon',embers:2, desc:'+2 ATK permanently'},
  encore:       {type:'RIFF',rarity:'Uncommon',embers:2, desc:'Target attacks twice this strike'},
  infencore:    {type:'RIFF',rarity:'Rare',embers:3,     desc:'ALL alive members attack twice'},
  possessedperf:{type:'RIFF',rarity:'Rare',embers:4,     desc:'×3 ATK all members this strike'},
  stagedive:    {type:'RIFF',rarity:'Rare',embers:4,     desc:'Deal target HP as direct damage'},
  crowdsurf:    {type:'RIFF',rarity:'Common',embers:2,   desc:'+1 ATK perm per card in hand when played.'},
  heavyriff:    {type:'RIFF',rarity:'Uncommon',embers:2, desc:'Target +ATK perm = number of buffs on them (snowball).'},
  soundwall:    {type:'RIFF',rarity:'Uncommon',embers:2, desc:'+1 ATK perm to ALL alive members. Upgraded: +2.'},
  deathriff:    {type:'CORRUPT',rarity:'Uncommon',embers:1,desc:'60 × (1 - corruption/100) damage'},
  moshpit:      {type:'RIFF',rarity:'Uncommon',embers:1, desc:'+1 ATK perm all. 4+ alive = +2 each.'},
  resonancecard:{type:'RIFF',rarity:'Uncommon',embers:1, desc:'Match target ATK to highest'},
  demotape:     {type:'RIFF',rarity:'Common',embers:1,   desc:'Copy last riff played'},
  burnset:      {type:'RIFF',rarity:'Uncommon',embers:0, desc:'Discard up to 3, draw that +1'},
  herbmoney:    {type:'RIFF',rarity:'Uncommon',embers:1, desc:'Spend 10 stash. Target +3 ATK permanently.'},
  distortion:   {type:'CORRUPT',rarity:'Common',embers:1,desc:'+15% corruption, all +1 temp ATK'},
  dialtoeleven: {type:'CORRUPT',rarity:'Common',embers:0,desc:'+10% corruption, all +3 temp ATK'},
  sigdecay:     {type:'CORRUPT',rarity:'Common',embers:1,desc:'Discard 1, draw 2'},
  staticcharge: {type:'CORRUPT',rarity:'Common',embers:0,desc:'+4 embers if 0 corruption, else +2'},
  darktuning:   {type:'CORRUPT',rarity:'Uncommon',embers:3,desc:'corruption÷12 random +1 ATK perm'},
  ampstatic:    {type:'CORRUPT',rarity:'Uncommon',embers:2,desc:'+corruption÷12 temp ATK to target'},
  feedbackloop: {type:'CORRUPT',rarity:'Uncommon',embers:2,desc:'corruption÷2 direct damage'},
  controlfeedback:{type:'CORRUPT',rarity:'Uncommon',embers:2,desc:'Set corruption=50%, heal weakest full'},
  seance:       {type:'CORRUPT',rarity:'Uncommon',embers:1,desc:'Heal all corruption÷4 HP'},
  bloodritual:  {type:'CORRUPT',rarity:'Rare',embers:2,  desc:'Sacrifice 25% HP, deal 6× as damage'},
  soundcheck:   {type:'UTILITY',rarity:'Common',embers:2,desc:'Heal all 4 HP, hurt ones get +1 ATK'},
  roadie:       {type:'UTILITY',rarity:'Common',embers:1,desc:'Stone Shield + heal 2 HP'},
  setlist:      {type:'UTILITY',rarity:'Common',embers:0,desc:'Draw 3 cards'},
  setbreak:     {type:'UTILITY',rarity:'Common',embers:0,desc:'Discard 1, +3 embers, draw 1'},
  wakeup:       {type:'UTILITY',rarity:'Uncommon',embers:1,desc:'Heal all 2 HP, revive stoned'},
  groupie:      {type:'EMBER',rarity:'Uncommon',embers:1,desc:'+2 embers, draw 1'},
  powertap:     {type:'EMBER',rarity:'Common',embers:0,  desc:'+2 embers'},
  tappedout:    {type:'EMBER',rarity:'Uncommon',embers:0, desc:'+5 embers next strike'},
  ampoverload:  {type:'EMBER',rarity:'Uncommon',embers:0, desc:'+3 embers, lose 1 discard'},
  soundboard:   {type:'EMBER',rarity:'Uncommon',embers:1, desc:'+2 embers, draw 1 next strike'},

  // ── NEW CARDS — RIFF ────────────────────────────────────────
  feedbackscream:{type:'RIFF',rarity:'Uncommon',embers:2,desc:'Target +ATK equal to HP loss. Low HP = huge.'},
  skullsplitter:{type:'RIFF',rarity:'Uncommon',embers:3, desc:'+3 ATK perm. If target 10+ ATK already, +5 instead.'},
  doomchord:    {type:'RIFF',rarity:'Uncommon',embers:2,  desc:'+4 ATK. At ≥50% corruption, +4 adjacent too.'},
  bloodharmony: {type:'RIFF',rarity:'Common',embers:1,    desc:'Target + adjacent +2 ATK. Same keyword = +3.'},
  sonicboom:    {type:'RIFF',rarity:'Rare',embers:4,      desc:'All +2 ATK. Draw 1.'},
  tremolopick:  {type:'RIFF',rarity:'Common',embers:1,    desc:'+1 ATK. If 3+ cards this strike, +4 instead.'},
  powerslide:   {type:'RIFF',rarity:'Common',embers:0,    desc:'FREE. +1 ATK. FRENZIED = +3.'},
  wallsound:    {type:'RIFF',rarity:'Uncommon',embers:3,  desc:'+2 ATK perm all. +1 ATK perm per alive member.'},
  shredsolo:    {type:'RIFF',rarity:'Rare',embers:2,      desc:'Target attacks TWICE (second at half ATK).'},
  breakdown:    {type:'RIFF',rarity:'Common',embers:1,    desc:'+2 ATK. If last card before strike, +4.'},
  harmonicfb:   {type:'RIFF',rarity:'Uncommon',embers:0,  desc:'FREE. +1 ATK perm per RIFF card played this strike.'},
  riffthief:    {type:'RIFF',rarity:'Rare',embers:2,      desc:'Copy last card played this strike. Cast free.'},

  // ── NEW CARDS — CORRUPT ─────────────────────────────────────
  soulbargain:  {type:'CORRUPT',rarity:'Uncommon',embers:0,desc:'FREE. +5 ATK. Target -3 HP. Corruption +5%.'},
  venomriff:    {type:'CORRUPT',rarity:'Uncommon',embers:1,desc:'+2 ATK. Boss DOT: 1/strike rest of fight.'},
  offeringpit:  {type:'CORRUPT',rarity:'Rare',embers:2,   desc:'Target skips attack. Another +8 ATK. Corr +10%.'},
  cursedstrings:{type:'CORRUPT',rarity:'Common',embers:1, desc:'+3 ATK. Target cant be healed this fight.'},
  necroticamp:  {type:'CORRUPT',rarity:'Rare',embers:0,   desc:'FREE. All +1 ATK per 20% corruption.'},
  graverobber:  {type:'CORRUPT',rarity:'Uncommon',embers:1,desc:'Pull 2 from discard to hand. Corr +5%.'},
  hexdecay:     {type:'CORRUPT',rarity:'Rare',embers:3,   desc:'Boss loses 15% current HP. Corr +15%.'},
  infernalpact: {type:'CORRUPT',rarity:'Rare',embers:0,   desc:'FREE. Corruption→66%. All +2 ATK perm.'},
  carrioncall:  {type:'CORRUPT',rarity:'Rare',embers:1,   desc:'Revive stoned at 1 HP +5 ATK. Corr +20%.'},
  possessionriff:{type:'CORRUPT',rarity:'Uncommon',embers:1,desc:'+ATK = corruption÷10. (70%=+7 ATK.)'},
  darkcrescendo:{type:'CORRUPT',rarity:'Rare',embers:0,   desc:'FREE. If corr ≥80%, TRIPLE strike mult.'},

  // ── NEW CARDS — UTILITY ─────────────────────────────────────
  gearcheck:    {type:'UTILITY',rarity:'Common',embers:1, desc:'Draw 2, discard 1.'},
  setlistrewrite:{type:'UTILITY',rarity:'Common',embers:0,desc:'FREE. Look at top 3 of deck, reorder.'},
  backstagepass:{type:'UTILITY',rarity:'Uncommon',embers:2,desc:'Next card free. Draw 1.'},
  venueswap:    {type:'UTILITY',rarity:'Uncommon',embers:1,desc:'Shuffle hand into deck. Draw 6 new.'},
  doublebooking:{type:'UTILITY',rarity:'Rare',embers:3,   desc:'+1 extra Strike this fight.'},
  bootlegcopy:  {type:'UTILITY',rarity:'Uncommon',embers:1,desc:'Copy any card in hand. Temp copy.'},

  // ── NEW CARDS — EMBER (with costs) ──────────────────────────
  burnout:      {type:'EMBER',rarity:'Common',embers:0,   desc:'+3 embers. Lose 1 max ember this fight.'},
  secondwind:   {type:'EMBER',rarity:'Common',embers:0,   desc:'Gain embers = empty slots.'},
  pyromaniac:   {type:'EMBER',rarity:'Uncommon',embers:1, desc:'+2 embers. Spend all = all +3 ATK.'},
  slowburn:     {type:'EMBER',rarity:'Common',embers:0,   desc:'+1 now. +1 next 2 strikes.'},
  meltdown:     {type:'EMBER',rarity:'Rare',embers:0,     desc:'Spend ALL embers. Deal 3× as direct dmg.'},
  ampfeedback:  {type:'EMBER',rarity:'Common',embers:1,   desc:'+2 embers. Next RIFF costs -1.'},
  drainthecrowd:{type:'EMBER',rarity:'Common',embers:0,   desc:'+2 embers. Random member -2 HP.'},
  corrsiphon:   {type:'EMBER',rarity:'Common',embers:0,   desc:'+3 embers. Corruption +8%.'},

  // ── NEW CARDS — ECHO/COPY (combo enablers) ─────────────────
  echopedal:    {type:'RIFF',rarity:'Uncommon',embers:1,  desc:'Replay last card played this strike (free).'},
  loopstation:  {type:'RIFF',rarity:'Rare',embers:2,      desc:'Replay last TWO cards played this strike.'},
  bootlegtape:  {type:'RIFF',rarity:'Uncommon',embers:1,  desc:'Add copy of target hand card (temp).'},
  overdriveped: {type:'RIFF',rarity:'Rare',embers:2,      desc:'Strike multiplier ×1.5 (multiplicative).'},

  // ── NEW CARDS — GAMBLE ──────────────────────────────────────
  devilsdice:   {type:'RIFF',rarity:'Uncommon',embers:1,  desc:'Roll d6. 1-2:nothing. 3-4:+3 ATK all. 5-6:+5 ATK +draw 2.'},
  russianroulette:{type:'CORRUPT',rarity:'Uncommon',embers:0,desc:'FREE. d6. 1:stoned. 2-5:+4 ATK. 6:+8 ATK+shield.'},
}

// ═══════════════════════════════════════════════════════════════════
// DECK CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

// Current v19.1 deck (baseline)
const BASELINE_DECK={
  amp:2, battlecry:4, newstrings:2, encore:3, infencore:3, possessedperf:2,
  stagedive:2, crowdsurf:2, heavyriff:2, soundwall:1, deathriff:2, moshpit:2,
  resonancecard:3, demotape:2, burnset:1, herbmoney:1,
  distortion:3, dialtoeleven:2, sigdecay:1, staticcharge:2, darktuning:2,
  ampstatic:2, feedbackloop:1, controlfeedback:1, seance:1, bloodritual:1,
  soundcheck:2, roadie:2, setlist:2, setbreak:2, wakeup:2,
  groupie:2, powertap:2, tappedout:2, ampoverload:1, soundboard:2,
}
// = 69 cards total

// Experimental deck — swap some boring cards for new ones
const EXPERIMENTAL_DECK={
  // KEEP strong existing cards
  amp:2, battlecry:3, newstrings:2, encore:3, infencore:2, possessedperf:2,
  stagedive:1, crowdsurf:1, heavyriff:2, soundwall:1, moshpit:2,
  resonancecard:2, burnset:1,
  distortion:2, sigdecay:1, feedbackloop:1, controlfeedback:1, bloodritual:1,
  soundcheck:2, roadie:2, wakeup:2, setbreak:1,
  // REDUCE boring ember cards
  groupie:1, powertap:1, tappedout:1, soundboard:1,
  // ADD new embers with costs
  burnout:2, corrsiphon:2, drainthecrowd:1, secondwind:1,
  // ADD combo enablers
  echopedal:2, bootlegtape:1, overdriveped:1,
  // ADD corruption-as-power
  soulbargain:2, necroticamp:1, possessionriff:2, darkcrescendo:1,
  // ADD fun riffs
  tremolopick:2, powerslide:2, doomchord:1, breakdown:1, harmonicfb:1, shredsolo:1,
  // ADD corrupt variety
  venomriff:1, gearcheck:1,
  // ADD gamble
  devilsdice:1, russianroulette:1,
}

function countDeck(deck){return Object.values(deck).reduce((s,n)=>s+n,0)}
function validateDeck(deck){
  const c=countDeck(deck);
  if(c!==69){console.error(`❌ Deck has ${c} cards, need 69`);return false}
  for(const id of Object.keys(deck)){if(!CARD_POOL[id]){console.error(`❌ Unknown card: ${id}`);return false}}
  return true
}

// ═══════════════════════════════════════════════════════════════════
// CORE SIM ENGINE (simplified from v19.1 — focuses on card balance)
// ═══════════════════════════════════════════════════════════════════

const ENEMIES=[
  {id:'wanderer',maxHp:65,baseDmg:4,passiveId:null},
  {id:'lostsoul',maxHp:95,baseDmg:5,passiveId:null},
  {id:'drifter',maxHp:140,baseDmg:7,passiveId:null},
  {id:'siren',maxHp:145,baseDmg:5,passiveId:'selfbuff'},
  {id:'tempter',maxHp:210,baseDmg:6,passiveId:'selfbuff'},
  {id:'lust_boss',maxHp:310,baseDmg:7,passiveId:'selfbuff2'},
  {id:'glutton',maxHp:160,baseDmg:5,passiveId:'cardHeal3'},
  {id:'feaster',maxHp:210,baseDmg:6,passiveId:'cardHeal5'},
  {id:'gluttony_boss',maxHp:280,baseDmg:7,passiveId:'cardHeal8'},
  {id:'miser',maxHp:400,baseDmg:4,passiveId:'stashSteal'},
  {id:'hoarder',maxHp:470,baseDmg:5,passiveId:'stashSteal2'},
  {id:'greed_boss',maxHp:780,baseDmg:6,passiveId:'stashSteal3'},
  {id:'wrathful',maxHp:972,baseDmg:5,passiveId:'rageScale1'},
  {id:'berserker',maxHp:1080,baseDmg:6,passiveId:'rageScale1'},
  {id:'anger_boss',maxHp:1200,baseDmg:7,passiveId:'rageScale2'},
  {id:'heretic',maxHp:1897,baseDmg:5,passiveId:'corruptPlayer'},
  {id:'apostate',maxHp:2185,baseDmg:6,passiveId:'corruptPlayer15'},
  {id:'heresy_boss',maxHp:2990,baseDmg:7,passiveId:'corruptPlayer20'},
  {id:'brute',maxHp:3660,baseDmg:6,passiveId:'targetHighestHp'},
  {id:'hunter',maxHp:4880,baseDmg:7,passiveId:'targetHighestHp2'},
  {id:'violence_boss',maxHp:6710,baseDmg:8,passiveId:'targetHighestHp3'},
  {id:'trickster',maxHp:6864,baseDmg:6,passiveId:'fraudShuffle'},
  {id:'deceiver',maxHp:8976,baseDmg:7,passiveId:'fraudShuffle2'},
  {id:'fraud_boss',maxHp:12672,baseDmg:8,passiveId:'fraudShuffle3'},
  {id:'traitor',maxHp:12600,baseDmg:6,passiveId:'paranoia'},
  {id:'betrayer',maxHp:15960,baseDmg:7,passiveId:'soulThief'},
  {id:'lucifer',maxHp:420666,baseDmg:9,passiveId:'luciferBoss'},
]

const MUSICIANS=[
  {id:'bjorn',role:'Lead Guitarist',atk:5,hp:6,maxHp:6,keyword:'FRENZIED'},
  {id:'ragnar',role:'Lead Guitarist',atk:4,hp:7,maxHp:7,keyword:'FRENZIED'},
  {id:'gunnar',role:'Rhythm Guitarist',atk:3,hp:7,maxHp:7,keyword:'SHREDDER'},
  {id:'erik',role:'Rhythm Guitarist',atk:3,hp:8,maxHp:8,keyword:'SHREDDER'},
  {id:'sven',role:'Drummer',atk:3,hp:6,maxHp:6,keyword:'DOUBLE TIME'},
  {id:'leif',role:'Drummer',atk:2,hp:8,maxHp:8,keyword:'DOUBLE TIME'},
  {id:'ivar',role:'Bassist',atk:3,hp:9,maxHp:9,keyword:'ANCHOR'},
  {id:'sigrid',role:'Bassist',atk:4,hp:7,maxHp:7,keyword:'ANCHOR'},
  {id:'freya',role:'Vocalist',atk:4,hp:5,maxHp:5,keyword:'CORRUPT'},
  {id:'astrid',role:'Vocalist',atk:3,hp:6,maxHp:6,keyword:'CORRUPT'},
  {id:'grimnir',role:'Vocalist',atk:3,hp:7,maxHp:7,keyword:'DEBUFF'},
  {id:'thor',role:'Keyboardist',atk:3,hp:6,maxHp:6,keyword:'FOLK MAGIC'},
]

const HP_MULT=1.3, DMG_ADD=0, MAX_STRIKES=4, MAX_EMBERS=8, HAND_SIZE=6, MAX_DISCARDS=4

function buildDeck(manifest){
  const deck=[]
  for(const[id,copies]of Object.entries(manifest)){
    const def=CARD_POOL[id];if(!def)continue
    for(let i=0;i<copies;i++)deck.push({id,type:def.type,rarity:def.rarity,embers:def.embers,uid:uid()})
  }
  return shuffle(deck)
}

function newGame(deckManifest){
  const band=shuffle([...MUSICIANS]).slice(0,5).map(m=>({...m,uid:uid(),permAtkBonus:0,tempAtkBonus:0,tooStoned:false,stoneShield:false,buffCount:0}))
  return{
    stage:band, deck:buildDeck(deckManifest), hand:[], discard:[],
    embers:5, maxEmbers:5, corruption:0, stash:3, fightIndex:0,
    won:false, fightsSurvived:0, totalDamage:0, highestStrike:0,
    _strikeMult:1.0, _cardsPlayedIds:[], _firedChains:new Set(),
    _venomDot:0, _extraStrikes:0, _slowBurnStrikes:0,
  }
}

function drawCards(gs,n){
  for(let i=0;i<n;i++){
    if(gs.deck.length===0){gs.deck=shuffle(gs.discard);gs.discard=[]}
    if(gs.deck.length>0)gs.hand.push(gs.deck.pop())
  }
}

// ═══════════════════════════════════════════════════════════════════
// CARD AI — score + apply for ALL cards (old + new)
// ═══════════════════════════════════════════════════════════════════

function scoreCard(card,gs,enemy,strikeNum,cardsPlayed){
  const{stage,corruption,embers,hand}=gs
  const alive=stage.filter(m=>!m.tooStoned);if(!alive.length)return 0
  const totalAtk=alive.reduce((s,m)=>s+m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0),0)
  const highAtk=Math.max(...alive.map(m=>m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0)))
  const anyHurt=alive.some(m=>m.hp<m.maxHp*0.5)
  const lowestHp=alive.reduce((a,b)=>a.hp<b.hp?a:b)

  switch(card.id){
    // ── EXISTING CARDS ──
    case 'possessedperf':return 95;case 'infencore':return 88;
    case 'stagedive':return Math.max(...alive.map(m=>m.hp))>=8?82:50;
    case 'amp':return 72+(highAtk>4?10:0);case 'encore':return 70+(highAtk>5?10:0);
    case 'newstrings':return 67;case 'battlecry':return 62;
    case 'powertap':return embers<=2?84:38;
    case 'staticcharge':return embers<=2?(corruption===0?86:80):33;
    case 'tappedout':return strikeNum<3?78:18;
    case 'ampoverload':return embers<=2?81:5;
    case 'groupie':return embers<=3?62:28;
    case 'soundboard':return embers<=3?60:28;
    case 'setbreak':return embers<=2?52:14;
    case 'soundwall':return 70;case 'heavyriff':{const best=alive.reduce((a,b)=>(a.permAtkBonus||0)>(b.permAtkBonus||0)?a:b);return(best.permAtkBonus||0)>=3?78:55}
    case 'crowdsurf':return hand.length>=5?74:hand.length>=3?55:30;
    case 'deathriff':return corruption<50?52:18;
    case 'feedbackloop':return corruption>=40?57:18;
    case 'herbmoney':return gs.stash>=10?65:0;
    case 'resonancecard':return highAtk>=5?54:24;
    case 'ampstatic':return corruption>=30?50:10;
    case 'distortion':return 57;case 'dialtoeleven':return corruption<50?44:14;
    case 'controlfeedback':return lowestHp.hp<lowestHp.maxHp*0.3?75:corruption>=40?40:15;
    case 'sigdecay':return hand.length>=4?48:20;
    case 'darktuning':return corruption>=45?57:15;
    case 'soundcheck':return anyHurt?58:30;case 'roadie':return alive.some(m=>m.hp<=3)?55:20;
    case 'wakeup':return stage.some(m=>m.tooStoned)?90:anyHurt?30:8;
    case 'setlist':return hand.length<=4?47:18;
    case 'seance':return Math.floor(corruption/4)>=10?60:15;
    case 'demotape':return cardsPlayed>0?52:0;case 'burnset':return hand.length>=5?42:15;
    case 'moshpit':return alive.length>=4?74:alive.length>=3?60:38;
    case 'bloodritual':return alive.reduce((a,b)=>a.hp>b.hp?a:b).hp>=8?58:30;

    // ── NEW RIFF CARDS ──
    case 'feedbackscream':return alive.some(m=>m.hp<m.maxHp*0.6)?68:25;
    case 'skullsplitter':return highAtk>=10?80:62;
    case 'doomchord':return corruption>=50?78:55;
    case 'bloodharmony':return 52;
    case 'sonicboom':return 72;
    case 'tremolopick':return cardsPlayed>=3?70:35;
    case 'powerslide':return alive.some(m=>m.keyword==='FRENZIED')?60:35;
    case 'wallsound':return alive.length>=4?76:60;
    case 'shredsolo':return highAtk>=8?80:50;
    case 'breakdown':return 50;
    case 'harmonicfb':return gs._cardsPlayedIds.filter(id=>CARD_POOL[id]?.type==='RIFF').length>=3?78:25;
    case 'riffthief':return cardsPlayed>0?70:0;

    // ── NEW CORRUPT CARDS ──
    case 'soulbargain':return 72; // free +5 ATK is amazing, HP cost is real
    case 'venomriff':return gs.fightIndex>=9?62:45; // DOT scales with fight length
    case 'offeringpit':return alive.length>=4?65:20;
    case 'cursedstrings':return 55;
    case 'necroticamp':return corruption>=60?85:corruption>=40?60:20;
    case 'graverobber':return gs.discard.length>=4?62:20;
    case 'hexdecay':return enemy._hp>=500?75:45;
    case 'infernalpact':return corruption<50?65:10;
    case 'carrioncall':return stage.some(m=>m.tooStoned)?90:0;
    case 'possessionriff':return corruption>=50?70:corruption>=30?45:15;
    case 'darkcrescendo':return corruption>=80?98:0; // GODLIKE when available

    // ── NEW UTILITY CARDS ──
    case 'gearcheck':return 48;
    case 'setlistrewrite':return 30;
    case 'backstagepass':return embers>=2?65:30;
    case 'venueswap':return hand.length<=3?60:20;
    case 'doublebooking':return 92; // extra strike is insane
    case 'bootlegcopy':return 55;

    // ── NEW EMBER CARDS (with costs) ──
    case 'burnout':return embers<=2?75:30; // great but shrinks
    case 'secondwind':return embers===0?90:embers<=2?50:10;
    case 'pyromaniac':return embers<=2?68:25;
    case 'slowburn':return strikeNum===0?65:30;
    case 'meltdown':return embers>=5?80:embers>=3?50:0;
    case 'ampfeedback':return embers<=2?70:30;
    case 'drainthecrowd':return embers<=2?65:20;
    case 'corrsiphon':return embers<=2&&corruption<60?72:15;

    // ── COMBO ENABLERS ──
    case 'echopedal':return cardsPlayed>0?75:0;
    case 'loopstation':return cardsPlayed>=2?85:0;
    case 'bootlegtape':return hand.some(c=>['possessedperf','infencore','amp','encore'].includes(c.id))?80:40;
    case 'overdriveped':return gs._strikeMult>=1.5?85:55;

    // ── GAMBLE ──
    case 'devilsdice':return 55; // EV is positive
    case 'russianroulette':return alive.length>=4?60:30; // less scary with 4+

    default:return 5;
  }
}

function applyCard(card,gs,enemy){
  const{stage}=gs,alive=stage.filter(m=>!m.tooStoned);if(!alive.length)return
  const target=alive.reduce((a,b)=>(a.atk+(a.permAtkBonus||0)>b.atk+(b.permAtkBonus||0)?a:b))
  const weakest=alive.reduce((a,b)=>a.hp/a.maxHp<b.hp/b.maxHp?a:b)
  const highAtk=Math.max(...alive.map(m=>m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0)))
  gs._genreCounts=gs._genreCounts||{RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0}
  gs._genreCounts[card.type]=(gs._genreCounts[card.type]||0)+1

  switch(card.id){
    // ── EXISTING ──
    case 'amp':target.atk*=2;target.tempAtkBonus=(target.tempAtkBonus||0)+target.atk;break;
    case 'battlecry':{const b=1;target.atk+=b;target.permAtkBonus+=b;break}
    case 'newstrings':target.atk+=2;target.permAtkBonus+=2;break;
    case 'encore':target._encore=true;break;
    case 'infencore':alive.forEach(m=>m._encore=true);break;
    case 'possessedperf':alive.forEach(m=>{m.tempAtkBonus+=(m.atk*2);m.atk*=3});break;
    case 'stagedive':gs._directDmg=(gs._directDmg||0)+target.hp;break;
    case 'crowdsurf':{const b=gs.hand.length;target.atk+=b;target.permAtkBonus+=b;break}
    case 'heavyriff':{const b=Math.min(20,Math.ceil((target.atk+(target.permAtkBonus||0)+(target.tempAtkBonus||0))/2));target.atk+=b;target.permAtkBonus+=b;break}
    case 'soundwall':alive.forEach(m=>{m.atk+=1;m.permAtkBonus+=1});break;
    case 'deathriff':gs._directDmg=(gs._directDmg||0)+Math.floor(60*(1-gs.corruption/100));gs.corruption=Math.min(100,gs.corruption+10);break;
    case 'moshpit':{const b=alive.length>=4?2:1;alive.forEach(m=>{m.atk+=b;m.permAtkBonus+=b});break}
    case 'resonancecard':target.tempAtkBonus+=(highAtk-(target.atk+(target.permAtkBonus||0)+(target.tempAtkBonus||0)));break;
    case 'demotape':gs._directDmg=(gs._directDmg||0)+Math.floor(target.atk*0.5);break;
    case 'burnset':drawCards(gs,1);break;
    case 'herbmoney':{if(gs.stash>=10){gs.stash-=10;target.atk+=3;target.permAtkBonus+=3};break}
    case 'distortion':gs.corruption=Math.min(100,gs.corruption+15);alive.forEach(m=>m.tempAtkBonus+=1);break;
    case 'dialtoeleven':gs.corruption=Math.min(100,gs.corruption+10);alive.forEach(m=>m.tempAtkBonus+=3);break;
    case 'sigdecay':if(gs.hand.length>0)gs.discard.push(gs.hand.splice(rand(gs.hand.length),1)[0]);drawCards(gs,2);break;
    case 'staticcharge':gs.embers=Math.min(gs.maxEmbers,gs.embers+(gs.corruption===0?4:2));break;
    case 'darktuning':{const bu=Math.floor(gs.corruption/12);for(let i=0;i<bu;i++){const t=pick(alive);t.atk+=1;t.permAtkBonus+=1}break}
    case 'ampstatic':target.tempAtkBonus+=Math.floor(gs.corruption/12);break;
    case 'feedbackloop':gs._directDmg=(gs._directDmg||0)+Math.floor(gs.corruption/2);break;
    case 'controlfeedback':gs.corruption=50;weakest.hp=weakest.maxHp;break;
    case 'seance':alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+Math.floor(gs.corruption/4)));break;
    case 'bloodritual':{const t=alive.reduce((a,b)=>a.hp>b.hp?a:b);const sac=Math.floor(t.hp*0.25);t.hp-=sac;gs._directDmg=(gs._directDmg||0)+sac*6;gs.corruption=Math.min(100,gs.corruption+15);break}
    case 'soundcheck':alive.forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+4);m.tempAtkBonus+=1});break;
    case 'roadie':weakest.stoneShield=2;weakest.hp=Math.min(weakest.maxHp,weakest.hp+2);break;
    case 'setlist':drawCards(gs,3);break;
    case 'setbreak':gs.embers=Math.min(gs.maxEmbers,gs.embers+3);drawCards(gs,1);break;
    case 'wakeup':alive.forEach(m=>m.hp=Math.min(m.maxHp,m.hp+2));stage.forEach(m=>{if(m.tooStoned){m.tooStoned=false;m.hp=m.maxHp}});break;
    case 'groupie':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);drawCards(gs,1);break;
    case 'powertap':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);break;
    case 'tappedout':gs._tappedOutNext=true;break;
    case 'ampoverload':gs.embers=Math.min(gs.maxEmbers,gs.embers+3);break;
    case 'soundboard':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);gs._drawNextStrike=(gs._drawNextStrike||0)+1;break;

    // ── NEW RIFF ──
    case 'feedbackscream':{const loss=target.maxHp-target.hp;target.tempAtkBonus+=loss;break}
    case 'skullsplitter':{const b=(target.atk+(target.permAtkBonus||0))>=10?5:3;target.atk+=b;target.permAtkBonus+=b;break}
    case 'doomchord':target.tempAtkBonus+=4;if(gs.corruption>=50){const idx=stage.indexOf(target);[-1,1].forEach(d=>{const n=stage[idx+d];if(n&&!n.tooStoned)n.tempAtkBonus+=4})};break;
    case 'bloodharmony':{const idx=stage.indexOf(target);target.tempAtkBonus+=2;[-1,1].forEach(d=>{const n=stage[idx+d];if(n&&!n.tooStoned)n.tempAtkBonus+=2});break}
    case 'sonicboom':alive.forEach(m=>m.tempAtkBonus+=2);drawCards(gs,1);break;
    case 'tremolopick':target.tempAtkBonus+=(gs._cardsPlayedIds.length>=3?4:1);break;
    case 'powerslide':target.tempAtkBonus+=(target.keyword==='FRENZIED'?3:1);break;
    case 'wallsound':alive.forEach(m=>{const b=2;m.atk+=b;m.permAtkBonus+=b});break;
    case 'shredsolo':target._encore=true;break; // same as encore for sim purposes
    case 'breakdown':target.tempAtkBonus+=2;break; // AI can't reliably be "last card"
    case 'harmonicfb':{const riffs=gs._cardsPlayedIds.filter(id=>CARD_POOL[id]?.type==='RIFF').length;const b=Math.max(1,riffs);target.atk+=b;target.permAtkBonus+=b;break}
    case 'riffthief':{const last=gs._cardsPlayedIds[gs._cardsPlayedIds.length-1];if(last&&last!=='riffthief'&&last!=='echopedal'&&last!=='loopstation'&&CARD_POOL[last])applyCard({id:last,type:CARD_POOL[last].type,embers:0},gs,enemy);break}

    // ── NEW CORRUPT ──
    case 'soulbargain':target.tempAtkBonus+=5;target.hp=Math.max(1,target.hp-3);gs.corruption=Math.min(100,gs.corruption+5);break;
    case 'venomriff':target.tempAtkBonus+=2;gs._venomDot=(gs._venomDot||0)+1;break;
    case 'offeringpit':{const other=alive.filter(m=>m.uid!==target.uid);if(other.length){target._skipAttack=true;pick(other).tempAtkBonus+=8};gs.corruption=Math.min(100,gs.corruption+10);break}
    case 'cursedstrings':target.tempAtkBonus+=3;target._noHeal=true;break;
    case 'necroticamp':{const b=Math.floor(gs.corruption/20);alive.forEach(m=>m.tempAtkBonus+=b);break}
    case 'graverobber':{const n=Math.min(2,gs.discard.length);for(let i=0;i<n;i++)gs.hand.push(gs.discard.splice(rand(gs.discard.length),1)[0]);gs.corruption=Math.min(100,gs.corruption+5);break}
    case 'hexdecay':gs._directDmg=(gs._directDmg||0)+Math.floor(enemy._hp*0.15);gs.corruption=Math.min(100,gs.corruption+15);break;
    case 'infernalpact':gs.corruption=66;alive.forEach(m=>{m.atk+=2;m.permAtkBonus+=2});break;
    case 'carrioncall':{const stoned=stage.find(m=>m.tooStoned);if(stoned){stoned.tooStoned=false;stoned.hp=1;stoned.atk+=5;stoned.permAtkBonus+=5};gs.corruption=Math.min(100,gs.corruption+20);break}
    case 'possessionriff':target.tempAtkBonus+=Math.floor(gs.corruption/10);break;
    case 'darkcrescendo':if(gs.corruption>=80)gs._strikeMult*=3;break;

    // ── NEW UTILITY ──
    case 'gearcheck':drawCards(gs,2);if(gs.hand.length>0)gs.discard.push(gs.hand.splice(rand(gs.hand.length),1)[0]);break;
    case 'setlistrewrite':break; // deck manipulation — minimal sim impact
    case 'backstagepass':gs._nextCardFree=true;drawCards(gs,1);break;
    case 'venueswap':gs.discard.push(...gs.hand);gs.hand=[];drawCards(gs,6);break;
    case 'doublebooking':gs._extraStrikes=(gs._extraStrikes||0)+1;break;
    case 'bootlegcopy':{if(gs.hand.length>0){const best=gs.hand.reduce((a,b)=>scoreCard(a,gs,enemy,0,0)>scoreCard(b,gs,enemy,0,0)?a:b);gs.hand.push({...best,uid:uid(),_temp:true})}break}

    // ── NEW EMBER (with costs) ──
    case 'burnout':gs.embers=Math.min(gs.maxEmbers,gs.embers+3);gs.maxEmbers=Math.max(1,gs.maxEmbers-1);break;
    case 'secondwind':gs.embers=Math.min(gs.maxEmbers,gs.embers+(gs.maxEmbers-gs.embers));break;
    case 'pyromaniac':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);gs._pyromaniacActive=true;break;
    case 'slowburn':gs.embers=Math.min(gs.maxEmbers,gs.embers+1);gs._slowBurnStrikes=2;break;
    case 'meltdown':{const all=gs.embers;gs._directDmg=(gs._directDmg||0)+all*3;gs.embers=0;break}
    case 'ampfeedback':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);gs._nextRiffDiscount=1;break;
    case 'drainthecrowd':gs.embers=Math.min(gs.maxEmbers,gs.embers+2);{const v=pick(alive);v.hp=Math.max(1,v.hp-2)};break;
    case 'corrsiphon':gs.embers=Math.min(gs.maxEmbers,gs.embers+3);gs.corruption=Math.min(100,gs.corruption+8);break;

    // ── COMBO ENABLERS ──
    case 'echopedal':{const last=gs._cardsPlayedIds[gs._cardsPlayedIds.length-1];if(last&&last!=='echopedal'&&last!=='loopstation'&&last!=='riffthief'&&CARD_POOL[last])applyCard({id:last,type:CARD_POOL[last].type,embers:0},gs,enemy);break}
    case 'loopstation':{const ids=gs._cardsPlayedIds.slice(-2).filter(id=>id!=='echopedal'&&id!=='loopstation'&&id!=='riffthief');ids.forEach(id=>{if(CARD_POOL[id])applyCard({id,type:CARD_POOL[id].type,embers:0},gs,enemy)});break}
    case 'bootlegtape':{if(gs.hand.length>0){const best=gs.hand.filter(c=>c.id!=='bootlegtape'&&c.id!=='echopedal').reduce((a,b)=>scoreCard(a,gs,enemy,0,0)>scoreCard(b,gs,enemy,0,0)?a:b,gs.hand[0]);if(best)gs.hand.push({...best,uid:uid(),_temp:true})}break}
    case 'overdriveped':gs._strikeMult*=1.5;break;

    // ── GAMBLE ──
    case 'devilsdice':{const r=rand(6)+1;if(r>=3&&r<=4)alive.forEach(m=>m.tempAtkBonus+=3);else if(r>=5){alive.forEach(m=>m.tempAtkBonus+=5);drawCards(gs,2)}break}
    case 'russianroulette':{const r=rand(6)+1;if(r===1){target.tooStoned=true;target.hp=0}else if(r<=5)target.tempAtkBonus+=4;else{target.tempAtkBonus+=8;target.stoneShield=2}break}

    default:break;
  }

  // Boss heals on card play
  if(enemy.passiveId==='cardHeal3')enemy._hp=Math.min(enemy.maxHp,enemy._hp+3);
  if(enemy.passiveId==='cardHeal5')enemy._hp=Math.min(enemy.maxHp,enemy._hp+5);
  if(enemy.passiveId==='cardHeal8')enemy._hp=Math.min(enemy.maxHp,enemy._hp+8);
}

// ═══════════════════════════════════════════════════════════════════
// FIGHT SIMULATION
// ═══════════════════════════════════════════════════════════════════

function simFight(gs){
  const enemy={...ENEMIES[gs.fightIndex],_hp:Math.ceil(ENEMIES[gs.fightIndex].maxHp*HP_MULT),_atkBuff:0}
  gs.embers=gs.maxEmbers;gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set()
  gs._directDmg=0;gs._venomDot=gs._venomDot||0;gs._genreCounts={RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0}
  gs.deck=shuffle([...gs.deck,...gs.discard]);gs.discard=[];gs.hand=[]
  const maxStr=MAX_STRIKES+(gs._extraStrikes||0);gs._extraStrikes=0

  for(let strike=0;strike<maxStr;strike++){
    const alive=gs.stage.filter(m=>!m.tooStoned);if(!alive.length)break
    alive.forEach(m=>{m.tempAtkBonus=0;m._encore=false;m._skipAttack=false})
    gs._directDmg=0;gs._pyromaniacActive=false
    drawCards(gs,Math.max(0,HAND_SIZE-gs.hand.length))
    if(gs._tappedOutNext){gs.embers=Math.min(gs.maxEmbers,gs.embers+5);gs._tappedOutNext=false}
    if(gs._slowBurnStrikes>0){gs.embers=Math.min(gs.maxEmbers,gs.embers+1);gs._slowBurnStrikes--}
    gs.embers=gs.maxEmbers

    // AI plays cards
    for(let att=0;att<15;att++){
      const playable=gs.hand.map((c,i)=>({c,i})).filter(({c})=>{
        let cost=c.embers;if(gs._nextCardFree)cost=0;cost=Math.max(0,cost)
        return gs.embers>=cost
      });if(!playable.length)break
      playable.forEach(p=>p.score=scoreCard(p.c,gs,enemy,strike,gs._cardsPlayedIds.length))
      playable.sort((a,b)=>b.score-a.score)
      if(playable[0].score<=3)break
      const best=playable[0],card=best.c
      let cost=card.embers;if(gs._nextCardFree){cost=0;gs._nextCardFree=false}
      gs.embers-=cost;gs.hand.splice(best.i,1)
      applyCard(card,gs,enemy)
      gs.discard.push(card)
      gs._cardsPlayedIds.push(card.id)
      gs._strikeMult=Math.min(6.66,Math.round((gs._strikeMult+0.05)*100)/100)
      CARD_PLAYS[card.id]=(CARD_PLAYS[card.id]||0)+1
    }

    // STRIKE: compute damage
    const postAlive=gs.stage.filter(m=>!m.tooStoned&&!m._skipAttack)
    let dmg=postAlive.reduce((s,m)=>{
      let a=m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0)
      if(m.keyword==='CORRUPT')a+=Math.floor(gs.corruption/12)
      if(m._encore)a*=2
      return s+a
    },0)
    dmg+=gs._directDmg
    dmg+=gs._venomDot // DOT ticks
    if(gs._pyromaniacActive&&gs.embers===0)postAlive.forEach(m=>m.tempAtkBonus+=3)
    const finalDmg=Math.round(dmg*gs._strikeMult)
    enemy._hp-=finalDmg;gs.totalDamage+=finalDmg;gs.highestStrike=Math.max(gs.highestStrike,finalDmg)
    if(enemy._hp<=0)return{won:true}

    // Boss attacks back
    const bossAlive=gs.stage.filter(m=>!m.tooStoned);if(!bossAlive.length)break
    const bossDmg=Math.max(1,enemy.baseDmg+DMG_ADD+enemy._atkBuff)
    const victim=pick(bossAlive)
    victim.hp-=bossDmg
    if(victim.hp<=0){
      if(victim.stoneShield){victim.hp=1;victim.stoneShield=false}
      else{victim.tooStoned=true;victim.hp=0}
    }
    if(enemy.passiveId==='selfbuff')enemy._atkBuff+=1
    if(enemy.passiveId==='selfbuff2')enemy._atkBuff+=2
    if(enemy.passiveId==='corruptPlayer')gs.corruption=Math.min(100,gs.corruption+10)
    if(enemy.passiveId==='corruptPlayer15')gs.corruption=Math.min(100,gs.corruption+15)
    if(enemy.passiveId==='corruptPlayer20')gs.corruption=Math.min(100,gs.corruption+20)
  }
  return{won:false}
}

function simGame(deckManifest){
  const gs=newGame(deckManifest)
  for(let f=0;f<27;f++){
    gs.fightIndex=f
    const result=simFight(gs)
    if(result.won){
      gs.fightsSurvived=f+1
      if(f===26){gs.won=true;return gs}
      // Heal between fights
      gs.stage.forEach(m=>{if(!m.tooStoned)m.hp=m.maxHp})
    } else {
      gs.fightsSurvived=f
      return gs
    }
  }
  return gs
}

// ═══════════════════════════════════════════════════════════════════
// REPORTING
// ═══════════════════════════════════════════════════════════════════

let CARD_PLAYS={}

function runTest(deckManifest,label,games){
  CARD_PLAYS={}
  const total=countDeck(deckManifest)
  if(!validateDeck(deckManifest))return null
  let wins=0,totalDmg=0,totalFights=0
  const deathByCircle=new Array(10).fill(0)
  for(let i=0;i<games;i++){
    const r=simGame(deckManifest)
    if(r.won)wins++
    totalDmg+=r.totalDamage
    totalFights+=r.fightsSurvived
    if(!r.won)deathByCircle[Math.floor(r.fightsSurvived/3)]++
  }
  const winRate=(wins/games*100).toFixed(2)
  const avgFight=(totalFights/games).toFixed(1)

  console.log(`\n⛧ ${label} — ${games} games`)
  console.log(`═══════════════════════════════════════════`)
  console.log(`  Deck: ${total} cards`)
  console.log(`  Win rate: ${winRate}% (${wins}/${games})`)
  console.log(`  Avg fight: ${avgFight}/27`)
  console.log(`  Avg damage/game: ${Math.round(totalDmg/games).toLocaleString()}`)
  console.log(`\n  Death by circle:`)
  for(let c=0;c<9;c++){
    const pct=(deathByCircle[c]/games*100).toFixed(1)
    const bar='█'.repeat(Math.round(deathByCircle[c]/games*30))
    console.log(`    C${c+1}: ${pct.padStart(5)}% ${bar}`)
  }

  // Card usage report
  const entries=Object.entries(CARD_PLAYS).map(([id,plays])=>{
    const copies=deckManifest[id]||0
    return{id,plays,perGame:plays/games,perCopy:copies>0?plays/games/copies:0,copies}
  }).sort((a,b)=>b.perGame-a.perGame)

  const totalPlays=entries.reduce((s,e)=>s+e.plays,0)
  const top10pct=entries.slice(0,10).reduce((s,e)=>s+e.plays,0)/totalPlays*100

  console.log(`\n  Card Usage (top 10 = ${top10pct.toFixed(1)}% of all plays):`)
  console.log(`  ${'Card'.padEnd(22)} ${'Plays'.padStart(7)} ${'Plays/G'.padStart(8)} ${'Per Copy'.padStart(9)} ${'Type'.padStart(8)}`)
  console.log(`  ${'─'.repeat(60)}`)
  entries.forEach(e=>{
    const pool=CARD_POOL[e.id]
    const flag=e.perGame<1?'  ⚠ LOW':e.perGame>10?'  🔥 HOT':''
    console.log(`  ${e.id.padEnd(22)} ${String(e.plays).padStart(7)} ${e.perGame.toFixed(2).padStart(8)} ${e.perCopy.toFixed(2).padStart(9)} ${(pool?.type||'?').padStart(8)}${flag}`)
  })

  // Strategy diversity
  const byType={RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0}
  entries.forEach(e=>{const t=CARD_POOL[e.id]?.type;if(t)byType[t]+=e.plays})
  const typeTotal=Object.values(byType).reduce((s,n)=>s+n,0)
  console.log(`\n  Strategy Mix:`)
  Object.entries(byType).forEach(([t,n])=>console.log(`    ${t.padEnd(10)} ${(n/typeTotal*100).toFixed(1)}%`))

  return{winRate:parseFloat(winRate),avgFight:parseFloat(avgFight),top10pct,byType}
}

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZER — hill climb toward best 69-card deck
// ═══════════════════════════════════════════════════════════════════

function optimize(){
  const GAMES_PER_TEST=50
  const ITERATIONS=300  // per archetype = 1200 total variations
  const allCardIds=Object.keys(CARD_POOL).filter(id=>!CARD_POOL[id]?.shopOnly)

  // 4 deck archetypes — each starts from a seed and hill-climbs toward its identity
  const archetypes=[
    {name:'THE SHREDDER',desc:'Aggro riff deck — hit fast, hit hard',
      bias:{RIFF:2.0,CORRUPT:0.7,UTILITY:0.5,EMBER:0.8},
      seed:{...BASELINE_DECK}},
    {name:'THE RITUALIST',desc:'Corruption-as-power — high risk, godlike damage',
      bias:{RIFF:0.8,CORRUPT:2.0,UTILITY:0.6,EMBER:0.8},
      seed:{...BASELINE_DECK}},
    {name:'THE ENGINEER',desc:'Combo deck — echo, copy, multiply, break the game',
      bias:{RIFF:1.2,CORRUPT:0.8,UTILITY:1.5,EMBER:1.0},
      seed:{...BASELINE_DECK}},
    {name:'THE SURVIVOR',desc:'Balanced — steady scaling, survives to late game',
      bias:{RIFF:1.0,CORRUPT:1.0,UTILITY:1.3,EMBER:1.0},
      seed:{...BASELINE_DECK}},
  ]

  console.log(`\n⛧ DECK OPTIMIZER — searching for 4 optimal decks across ${ITERATIONS*4} variations...\n`)

  const results=[]

  for(const arch of archetypes){
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`  🔍 Searching: ${arch.name}`)
    console.log(`  ${arch.desc}`)
    console.log(`${'═'.repeat(60)}`)

    let bestDeck={...arch.seed}
    CARD_PLAYS={}
    const origLog2=console.log;console.log=()=>{}
    let bestStats=runTest(bestDeck,`${arch.name} seed`,GAMES_PER_TEST)
    console.log=origLog2
    let bestScore=fitnessBiased(bestStats,arch.bias)

    let improvements=0
    for(let iter=0;iter<ITERATIONS;iter++){
      const candidate={...bestDeck}

      // Biased mutation — favor cards matching archetype
      const action=rand(4)
      if(action<=1){
        // Swap: remove 1, add 1 biased toward archetype
        const inDeck=Object.keys(candidate).filter(id=>candidate[id]>0)
        if(inDeck.length){
          const rem=pick(inDeck);candidate[rem]--;if(candidate[rem]<=0)delete candidate[rem]
          // Weighted pick — favor cards matching archetype bias
          const candidates=allCardIds.filter(id=>(candidate[id]||0)<4)
          const weights=candidates.map(id=>{const t=CARD_POOL[id]?.type||'RIFF';return arch.bias[t]||1.0})
          const totalW=weights.reduce((s,w)=>s+w,0)
          let r=Math.random()*totalW,accum=0
          let addId=candidates[0]
          for(let ci=0;ci<candidates.length;ci++){accum+=weights[ci];if(r<=accum){addId=candidates[ci];break}}
          candidate[addId]=(candidate[addId]||0)+1
        }
      } else if(action===2){
        // Adjust copies
        const inDeck=Object.keys(candidate).filter(id=>candidate[id]>1)
        const canAdd=allCardIds.filter(id=>(candidate[id]||0)<4)
        if(inDeck.length&&canAdd.length){
          const rem=pick(inDeck);candidate[rem]--
          const add=pick(canAdd);candidate[add]=(candidate[add]||0)+1
        }
      } else {
        // Big swap: remove 2, add 2
        const inDeck=Object.keys(candidate).filter(id=>candidate[id]>=2)
        const notIn=allCardIds.filter(id=>!candidate[id])
        if(inDeck.length&&notIn.length){
          const rem=pick(inDeck);candidate[rem]-=2;if(candidate[rem]<=0)delete candidate[rem]
          const add=pick(notIn);candidate[add]=2
        }
      }

      if(countDeck(candidate)!==69)continue
      CARD_PLAYS={}
      // Suppress output for iterations
      const origLog=console.log;console.log=()=>{}
      const stats=runTest(candidate,`iter`,GAMES_PER_TEST)
      console.log=origLog
      if(!stats)continue
      const score=fitnessBiased(stats,arch.bias)
      if(score>bestScore){
        bestDeck={...candidate};bestStats=stats;bestScore=score;improvements++
        if(improvements%10===0)process.stdout.write(`  ✅ ${improvements} improvements (iter ${iter}, fitness ${score.toFixed(1)}, WR ${stats.winRate}%)\n`)
      }
    }

    // Final detailed report
    CARD_PLAYS={}
    const origLog3=console.log;console.log=()=>{}
    const finalStats=runTest(bestDeck,`${arch.name} — FINAL`,200)
    console.log=origLog3
    process.stdout.write(`  ✅ Done! ${improvements} improvements. WR=${finalStats.winRate}%\n`)
    results.push({name:arch.name,desc:arch.desc,deck:bestDeck,stats:finalStats,score:bestScore})
  }

  // Print all decks as reviewable manifests
  console.log(`\n\n${'═'.repeat(60)}`)
  console.log(`⛧ OPTIMIZATION COMPLETE — 4 DECK OPTIONS FOR REVIEW`)
  console.log(`${'═'.repeat(60)}\n`)
  results.forEach((r,i)=>{
    console.log(`\n── DECK ${i+1}: ${r.name} ──`)
    console.log(`   ${r.desc}`)
    console.log(`   Win Rate: ${r.stats.winRate}% | Fitness: ${r.score.toFixed(1)}`)
    console.log(`   Strategy: RIFF ${(r.stats.byType.RIFF/Object.values(r.stats.byType).reduce((s,n)=>s+n,0)*100).toFixed(0)}% / CORRUPT ${(r.stats.byType.CORRUPT/Object.values(r.stats.byType).reduce((s,n)=>s+n,0)*100).toFixed(0)}% / UTIL ${(r.stats.byType.UTILITY/Object.values(r.stats.byType).reduce((s,n)=>s+n,0)*100).toFixed(0)}% / EMBER ${(r.stats.byType.EMBER/Object.values(r.stats.byType).reduce((s,n)=>s+n,0)*100).toFixed(0)}%`)
    console.log(`   Cards:`)
    Object.entries(r.deck).sort((a,b)=>b[1]-a[1]).forEach(([id,n])=>{
      const pool=CARD_POOL[id]
      console.log(`     ${id.padEnd(22)} ×${n}  ${(pool?.type||'?').padEnd(8)} ${pool?.desc?.slice(0,50)||''}`)
    })
  })
}

function fitnessBiased(stats,bias){
  if(!stats)return-Infinity
  const winPenalty=Math.abs(stats.winRate-85)*3 // lab sim runs high, target ~85%
  const diversityBonus=100-stats.top10pct
  const typeTotal=Object.values(stats.byType).reduce((s,n)=>s+n,0)
  // Reward decks that match their archetype's type distribution
  let typeFit=0
  const totalBias=Object.values(bias).reduce((s,n)=>s+n,0)
  Object.entries(bias).forEach(([type,weight])=>{
    const actual=(stats.byType[type]||0)/typeTotal
    const target=weight/totalBias
    typeFit-=Math.abs(actual-target)*50
  })
  return diversityBonus-winPenalty+typeFit
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

if(MODE==='test'){
  runTest(BASELINE_DECK,'BASELINE (v19.1)',GAMES)
}else if(MODE==='new'){
  runTest(EXPERIMENTAL_DECK,'EXPERIMENTAL DECK',GAMES)
}else if(MODE==='compare'){
  const b=runTest(BASELINE_DECK,'BASELINE (v19.1)',GAMES)
  const e=runTest(EXPERIMENTAL_DECK,'EXPERIMENTAL',GAMES)
  if(b&&e){
    console.log(`\n${'═'.repeat(60)}`)
    console.log('COMPARISON:')
    console.log(`  Baseline:     ${b.winRate}% WR, ${b.top10pct.toFixed(1)}% top10, ember ${(b.byType.EMBER/Object.values(b.byType).reduce((s,n)=>s+n,0)*100).toFixed(1)}%`)
    console.log(`  Experimental: ${e.winRate}% WR, ${e.top10pct.toFixed(1)}% top10, ember ${(e.byType.EMBER/Object.values(e.byType).reduce((s,n)=>s+n,0)*100).toFixed(1)}%`)
    console.log(`  Winner: ${e.winRate>b.winRate-2&&e.winRate<b.winRate+2?'BALANCED':'NEEDS TUNING'} (target: similar WR, lower ember %)`)
  }
}else if(MODE==='optimize'){
  optimize()
}else{
  console.log('Usage: node vestibule-lab.js [test|new|compare|optimize] [games]')
}
