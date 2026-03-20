import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// ── Audio ─────────────────────────────────────────────────────────────────────
function mkCtx(){return new(window.AudioContext||window.webkitAudioContext)()}
function playTone(freq,dur,wave,distort,vol){
  wave=wave||'sawtooth';distort=distort||false;vol=vol||0.5
  try{var ctx=mkCtx(),osc=ctx.createOscillator(),gain=ctx.createGain()
  osc.type=wave;osc.frequency.setValueAtTime(freq,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*0.25,ctx.currentTime+dur)
  gain.gain.setValueAtTime(vol,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur)
  if(distort){var d=ctx.createWaveShaper(),c=new Float32Array(256);for(var i=0;i<256;i++){var x=(i*2)/256-1;c[i]=((Math.PI+300)*x)/(Math.PI+300*Math.abs(x))}d.curve=c;osc.connect(d);d.connect(gain)}else osc.connect(gain)
  gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+dur)}catch(e){}}
var ATK_SND={'Lead Guitarist':function(){playTone(110,.5,'sawtooth',true)},'Rhythm Guitarist':function(){playTone(82,.4,'square',true)},'Bass Player':function(){playTone(41,.7,'sine')},'Drummer':function(){playTone(220,.08,'triangle');setTimeout(function(){playTone(55,.35,'sine')},20)},'Vocalist':function(){playTone(196,.35,'sine',true)},'Synth Player':function(){playTone(165,.5,'triangle')}}
function playHit(){playTone(90,.35,'sawtooth',false,.45)}
function playCard(){playTone(600,.1,'triangle',false,.15)}
function playEmber(){playTone(400,.15,'sine',false,.2);setTimeout(function(){playTone(500,.15,'sine',false,.2)},80)}
function playVictory(){[130.8,164.8,196,261.6,329.6].forEach(function(f,i){try{var ctx=mkCtx(),osc=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.13;osc.type='sine';g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.3,t+.05);g.gain.exponentialRampToValueAtTime(.001,t+.6);osc.frequency.setValueAtTime(f,t);osc.connect(g);g.connect(ctx.destination);osc.start(t);osc.stop(t+.6)}catch(e){}})}
function playDice(){playTone(300,.08,'square',false,.3);setTimeout(function(){playTone(450,.08,'square',false,.3)},100)}
function playDraw(){[220,330,440].forEach(function(f,i){setTimeout(function(){playTone(f,.08,'sine',false,.08)},i*60)})}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_EMBERS_CAP=8, MAX_STRIKES=4, MAX_DISCARDS=4, HAND_SIZE=6, MAX_STASH=420

const ENEMIES=[
  // ── CIRCLE I: LIMBO — No passives, intro difficulty ──────────
  {id:'wanderer',name:'The Wanderer',circle:'Circle I — Limbo',subtitle:'Fight 1 of 3',maxHp:27,baseDmg:2,emoji:'👤',passive:'A lost soul with no purpose. Attacks randomly.',passiveId:null},
  {id:'lostsoul',name:'The Lost Soul',circle:'Circle I — Limbo',subtitle:'Fight 2 of 3',maxHp:42,baseDmg:4,emoji:'💀',passive:'A stronger damned spirit. Hunger drives its blows.',passiveId:null},
  {id:'drifter',name:'The Drifter',circle:'Circle I — Limbo',subtitle:'Circle Boss — Fight 3 of 3',maxHp:69,baseDmg:5,emoji:'👁',passive:'Pure relentless pressure.',passiveId:null},
  // ── CIRCLE II: LUST — Enemy buffs itself each strike ─────────
  {id:'siren',name:'The Siren',circle:'Circle II — Lust',subtitle:'Fight 1 of 3',maxHp:60,baseDmg:4,emoji:'🌊',passive:'Seductive. Gains +1 damage each Strike.',passiveId:'selfbuff'},
  {id:'tempter',name:'The Tempter',circle:'Circle II — Lust',subtitle:'Fight 2 of 3',maxHp:90,baseDmg:5,emoji:'🌹',passive:'Enthralling. Gains +1 damage each Strike. Starts stronger.',passiveId:'selfbuff'},
  {id:'lust_boss',name:'The Seducer',circle:'Circle II — Lust',subtitle:'Circle Boss — Fight 3 of 3',maxHp:140,baseDmg:6,emoji:'💋',passive:'Irresistible. Gains +2 damage each Strike. Dangerous if left alive.',passiveId:'selfbuff2'},
  // ── CIRCLE III: GLUTTONY — Heals when you play cards ─────────
  {id:'glutton',name:'The Glutton',circle:'Circle III — Gluttony',subtitle:'Fight 1 of 3',maxHp:80,baseDmg:4,emoji:'🍖',passive:'Insatiable. Heals 2 HP every time a card is played.',passiveId:'cardHeal'},
  {id:'feaster',name:'The Feaster',circle:'Circle III — Gluttony',subtitle:'Fight 2 of 3',maxHp:110,baseDmg:5,emoji:'🦷',passive:'Voracious. Heals 3 HP every time a card is played.',passiveId:'cardHeal3'},
  {id:'gluttony_boss',name:'The Devourer',circle:'Circle III — Gluttony',subtitle:'Circle Boss — Fight 3 of 3',maxHp:160,baseDmg:6,emoji:'🕳',passive:'Endless hunger. Heals 4 HP per card played. Strike fast.',passiveId:'cardHeal4'},
  // ── CIRCLE IV: GREED — Steals stash on hit ───────────────────
  {id:'miser',name:'The Miser',circle:'Circle IV — Greed',subtitle:'Fight 1 of 3',maxHp:360,baseDmg:4,emoji:'💰',passive:'Greedy. Steals 1 Stash on each successful hit.',passiveId:'stealStash'},
  {id:'hoarder',name:'The Hoarder',circle:'Circle IV — Greed',subtitle:'Fight 2 of 3',maxHp:480,baseDmg:5,emoji:'🪙',passive:'Avaricious. Steals 2 Stash on each successful hit.',passiveId:'stealStash2'},
  {id:'greed_boss',name:'The Usurer',circle:'Circle IV — Greed',subtitle:'Circle Boss — Fight 3 of 3',maxHp:680,baseDmg:6,emoji:'🏦',passive:'Extracting. Steals 3 Stash per hit. Win fast or go broke.',passiveId:'stealStash3'},
  // ── CIRCLE V: ANGER — Hits harder the more you buff ─────────
  {id:'wrathful',name:'The Wrathful',circle:'Circle V — Anger',subtitle:'Fight 1 of 3',maxHp:800,baseDmg:5,emoji:'🔥',passive:'Enraged. +2 damage for each buffed member on your stage.',passiveId:'rageScale'},
  {id:'berserker',name:'The Berserker',circle:'Circle V — Anger',subtitle:'Fight 2 of 3',maxHp:1040,baseDmg:6,emoji:'⚔️',passive:'Furious. +3 damage per buffed member. Keep your band clean.',passiveId:'rageScale3'},
  {id:'anger_boss',name:'The Warlord',circle:'Circle V — Anger',subtitle:'Circle Boss — Fight 3 of 3',maxHp:1520,baseDmg:7,emoji:'💢',passive:'Explosive rage. +4 damage per buffed member. A buffed band is a target.',passiveId:'rageScale4'},
  // ── CIRCLE VI: HERESY — Corrupts your corruption system ──────
  {id:'heretic',name:'The Heretic',circle:'Circle VI — Heresy',subtitle:'Fight 1 of 3',maxHp:1650,baseDmg:5,emoji:'🔱',passive:'Blasphemous. Each Strike raises your Corruption by 10%.',passiveId:'corruptPlayer'},
  {id:'apostate',name:'The Apostate',circle:'Circle VI — Heresy',subtitle:'Fight 2 of 3',maxHp:2175,baseDmg:6,emoji:'⛧',passive:'Corrupting. Raises Corruption by 15% each Strike.',passiveId:'corruptPlayer15'},
  {id:'heresy_boss',name:'The False Prophet',circle:'Circle VI — Heresy',subtitle:'Circle Boss — Fight 3 of 3',maxHp:3000,baseDmg:7,emoji:'📖',passive:'Toxic doctrine. Corruption +20% per Strike. Hellquake territory every fight.',passiveId:'corruptPlayer20'},
  // ── CIRCLE VII: VIOLENCE — Targets your healthiest member ────
  {id:'brute',name:'The Brute',circle:'Circle VII — Violence',subtitle:'Fight 1 of 3',maxHp:3000,baseDmg:6,emoji:'🗡️',passive:'Calculated. Always targets the member with highest HP.',passiveId:'targetHighestHp'},
  {id:'hunter',name:'The Hunter',circle:'Circle VII — Violence',subtitle:'Fight 2 of 3',maxHp:4000,baseDmg:7,emoji:'🏹',passive:'Predatory. Targets highest HP member. Deals +50% damage to them.',passiveId:'targetHighestHp2'},
  {id:'violence_boss',name:'The Executioner',circle:'Circle VII — Violence',subtitle:'Circle Boss — Fight 3 of 3',maxHp:5500,baseDmg:8,emoji:'🩸',passive:'Methodical. Targets highest HP and deals double damage. Protect your strongest.',passiveId:'targetHighestHp3'},
  // ── CIRCLE VIII: FRAUD — Disables random cards in hand ───────
  {id:'trickster',name:'The Trickster',circle:'Circle VIII — Fraud',subtitle:'Fight 1 of 3',maxHp:5200,baseDmg:6,emoji:'🃏',passive:'Deceptive. After each Strike, one random card in hand is locked for 1 turn.',passiveId:'lockCard'},
  {id:'deceiver',name:'The Deceiver',circle:'Circle VIII — Fraud',subtitle:'Fight 2 of 3',maxHp:6800,baseDmg:7,emoji:'🎭',passive:'Manipulative. Locks 2 cards in hand after each Strike.',passiveId:'lockCard2'},
  {id:'fraud_boss',name:'The Archfraud',circle:'Circle VIII — Fraud',subtitle:'Circle Boss — Fight 3 of 3',maxHp:9600,baseDmg:8,emoji:'🪞',passive:'Master of lies. Locks 3 cards after each Strike. Deck management is survival.',passiveId:'lockCard3'},
  // ── CIRCLE IX: TREACHERY — Gets stronger as it takes damage ──
  {id:'traitor',name:'The Traitor',circle:'Circle IX — Treachery',subtitle:'Fight 1 of 3',maxHp:9000,baseDmg:6,emoji:'🗝️',passive:'Vindictive. Gains +1 ATK permanently for each 20 damage taken.',passiveId:'damageScaleAtk'},
  {id:'betrayer',name:'The Betrayer',circle:'Circle IX — Treachery',subtitle:'Fight 2 of 3',maxHp:11400,baseDmg:7,emoji:'🔒',passive:'Vengeful. Gains +2 ATK per 20 damage taken. Kill it fast.',passiveId:'damageScaleAtk2'},
  {id:'lucifer',name:'Lucifer',circle:'Circle IX — Treachery',subtitle:'⛧ The Final Circle — Fight 3 of 3',maxHp:420666,baseDmg:9,emoji:'😈',passive:'The Lord of Hell. Gains +2 ATK per 20 HP lost. Immune to debuff. The ultimate test.',passiveId:'damageScaleAtk3'},
]

const ALL_MUSICIANS=[
  {id:'bjorn',name:'Bjorn',role:'Lead Guitarist',atk:5,hp:6,maxHp:6,emoji:'🎸',keyword:'FRENZIED',desc:'High ATK, fragile. The carry.'},
  {id:'ragnar',name:'Ragnar',role:'Lead Guitarist',atk:4,hp:7,maxHp:7,emoji:'🎸',keyword:'FRENZIED',desc:'Slightly tankier lead.'},
  {id:'thor',name:'Thor',role:'Drummer',atk:0,hp:8,maxHp:8,emoji:'🥁',keyword:'DOUBLE TIME',desc:'Attack fires twice per turn.'},
  {id:'ingrid',name:'Ingrid',role:'Bass Player',atk:3,hp:10,maxHp:10,emoji:'🎵',keyword:'ANCHOR',desc:'High HP. Regen adjacent members.'},
  {id:'loki',name:'Loki',role:'Synth Player',atk:3,hp:6,maxHp:6,emoji:'🎹',keyword:'CORRUPT',desc:'Damage scales with Corruption.'},
  {id:'nott',name:'Nott',role:'Vocalist',atk:2,hp:7,maxHp:7,emoji:'🎤',keyword:'DEBUFF',desc:'Reduces boss passive each turn.'},
  {id:'dag',name:'Dag',role:'Bass Player',atk:2,hp:12,maxHp:12,emoji:'🎵',keyword:'ANCHOR',desc:'Tankiest member.'},
  {id:'vitalik',name:'Vitalik',role:'Dark Minstrel',atk:6,hp:9,maxHp:9,emoji:'🪈',keyword:'FOLK MAGIC',desc:'Nobody asked. Nobody complained twice.'},
  // ── NEW MEMBERS ────────────────────────────────────────────────
  {id:'sigrid',name:'Sigrid',role:'Rhythm Guitarist',atk:3,hp:8,maxHp:8,emoji:'🎸',keyword:'SHREDDER',desc:'Every riff she plays, the next one comes faster.'},
  {id:'gunnar',name:'Gunnar',role:'Rhythm Guitarist',atk:4,hp:7,maxHp:7,emoji:'🎸',keyword:'SHREDDER',desc:'Rhythm? He makes the rhythm.'},
  {id:'astrid',name:'Astrid',role:'Vocalist',atk:3,hp:8,maxHp:8,emoji:'🎤',keyword:'DEBUFF',desc:'Her voice alone can break a curse.'},
  {id:'freya',name:'Freya',role:'Synth Player',atk:4,hp:5,maxHp:5,emoji:'🎹',keyword:'CORRUPT',desc:'She plays the dark frequencies.'},
  {id:'ulf',name:'Ulf',role:'Bass Player',atk:4,hp:9,maxHp:9,emoji:'🎵',keyword:'ANCHOR',desc:'The anchor that also bites.'},
  {id:'brynja',name:'Brynja',role:'Bass Player',atk:1,hp:14,maxHp:14,emoji:'🎵',keyword:'ANCHOR',desc:'An immovable wall. The bass never stops.'},
  {id:'rolf',name:'Rolf',role:'Drummer',atk:1,hp:9,maxHp:9,emoji:'🥁',keyword:'DOUBLE TIME',desc:'Hits harder than the rest combined. Statistically speaking.'},
  {id:'orm',name:'Orm',role:'Dark Minstrel',atk:2,hp:11,maxHp:11,emoji:'🪈',keyword:'HEXED',desc:'The longer he plays, the worse it gets. For everyone.'},
  // ── LOCKED MEMBERS ─────────────────────────────────────────────
  {id:'locked1',name:'???',role:'LOCKED',atk:0,hp:0,maxHp:0,emoji:'🔒',keyword:'',desc:'Can you find the key?',locked:true},
  {id:'locked2',name:'???',role:'LOCKED',atk:0,hp:0,maxHp:0,emoji:'🔒',keyword:'',desc:'Can you find the key?',locked:true},
]

const ALL_CARDS=[
  {id:'amp',name:'Amp It Up',type:'RIFF',rarity:'Common',emoji:'⚡',embers:2,effect:'Target member deals double ATK this turn.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'dialtoeleven',name:'Dial to Eleven',type:'CORRUPT',rarity:'Common',emoji:'📻',embers:1,effect:'+20% Corruption immediately.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'soundcheck',name:'Sound Check',type:'UTILITY',rarity:'Common',emoji:'🔊',embers:2,effect:'All members +4 HP. Injured members also gain +1 ATK this Strike.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'sigdecay',name:'Signal Decay',type:'CORRUPT',rarity:'Common',emoji:'📡',embers:2,effect:'-30% Corruption. Heal 5 HP.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'battlecry',name:'Battle Cry',type:'RIFF',rarity:'Common',emoji:'🤘',embers:1,effect:'Target member +1 ATK permanently.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'roadie',name:'Roadie',type:'UTILITY',rarity:'Common',emoji:'🛡',embers:1,effect:'Target cannot go Too Stoned this Strike.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'setlist',name:'Setlist',type:'UTILITY',rarity:'Common',emoji:'📋',embers:1,effect:'View top 4 cards. Rearrange in any order.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'groupie',name:'Groupie',type:'EMBER',rarity:'Common',emoji:'🍯',embers:2,effect:'Spend 2 Embers, gain 3 back. Net +1.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'demotape',name:'Demo Tape',type:'RIFF',rarity:'Common',emoji:'📼',embers:2,effect:'Copy the last Riff played, cast it free.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'newstrings',name:'New Strings',type:'RIFF',rarity:'Uncommon',emoji:'🎸',embers:3,effect:'+2 ATK permanently to target member.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'encore',name:'Encore',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:2,effect:'Target member attacks again this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'wakeup',name:'Wake Up Call',type:'UTILITY',rarity:'Uncommon',emoji:'☕',embers:2,effect:'Heal all members 2 HP. If any member is Too Stoned, revive them (they lose 50% permanent ATK buffs).',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'feedbackloop',name:'Feedback Loop',type:'CORRUPT',rarity:'Uncommon',emoji:'🎛',embers:3,effect:'Deal damage equal to Corruption ÷ 2.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'tappedout',name:'Tapped Out',type:'EMBER',rarity:'Uncommon',emoji:'🪙',embers:0,effect:'Gain 5 Embers at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'controlfeedback',name:'Controlled Feedback',type:'CORRUPT',rarity:'Uncommon',emoji:'🎚',embers:2,effect:'Set Corruption to exactly 50%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'burnset',name:'Burn the Set',type:'RIFF',rarity:'Uncommon',emoji:'🔥',embers:2,effect:'Discard entire hand. Draw 6 new cards.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'soundwall',name:'Sound Wall',type:'RIFF',rarity:'Uncommon',emoji:'🔈',embers:3,effect:'Deal 5/8/12 damage (scales by fight). Boss passive skips.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'stagedive',name:'Stage Dive',type:'RIFF',rarity:'Rare',emoji:'🤘',embers:4,effect:'Damage = target HP to boss. Once per round.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'overdrive',name:'Overdrive',type:'RIFF',rarity:'Rare',emoji:'💥',embers:3,effect:'If Corruption >=60%, double ALL ATK this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'infencore',name:'Infernal Encore',type:'RIFF',rarity:'Rare',emoji:'👿',embers:3,effect:'ALL members attack again simultaneously.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'remaster',name:'The Remaster',type:'UTILITY',rarity:'Rare',emoji:'🎙',embers:0,effect:'View 10 deck cards. Delete 2. Copy 1.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'sabbathsigil',name:'Black Sabbath Sigil',type:'CORRUPT',rarity:'Rare',emoji:'⛧',embers:2,effect:'Corruption → 100%. Roll d10. Hellquake fires — anything can happen.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'possessedperf',name:'Possessed Performance',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:4,effect:'All members deal triple ATK this Strike only.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'crowdsurf',name:'Crowd Surf',type:'RIFF',rarity:'Common',emoji:'🏄',embers:2,effect:'Deal damage equal to cards in hand × 2.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'doubledown',name:'Double Down',type:'RIFF',rarity:'Uncommon',emoji:'🎰',embers:3,effect:'The next card played this Strike costs 0 Embers.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'deathriff',name:'Death Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'💀',embers:1,effect:'Deal damage = (100 - Corruption)%, max 60. Corruption +10%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'ampoverload',name:'Amp Overload',type:'EMBER',rarity:'Uncommon',emoji:'🔋',embers:0,effect:'Gain 3 Embers. Skip your next Discard this fight.',color:'#c87820',typeColor:'#a06010',copies:2},
  {id:'ampstatic',name:'Amp the Static',type:'CORRUPT',rarity:'Uncommon',emoji:'📶',embers:3,effect:'Target member gains ATK = Corruption ÷ 15 this Strike.',color:'#aa1111',typeColor:'#880000',copies:2},
  // ── NEW CARDS ──────────────────────────────────────────────────
  {id:'distortion',name:'Distortion',type:'CORRUPT',rarity:'Common',emoji:'🎸',embers:1,effect:'Corruption +10%. All members +1 ATK this Strike.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'seance',name:'Séance',type:'CORRUPT',rarity:'Uncommon',emoji:'🔮',embers:2,effect:'Heal all members HP equal to Corruption ÷ 8. Works at any corruption level.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'staticcharge',name:'Static Charge',type:'CORRUPT',rarity:'Common',emoji:'⚡',embers:0,effect:'If Corruption is 0%: gain 3 Embers. Otherwise: Corruption -5%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'darktuning',name:'Dark Tuning',type:'CORRUPT',rarity:'Uncommon',emoji:'🌑',embers:3,effect:'For each 15% Corruption, one random member gains +1 ATK permanently.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'powertap',name:'Power Tap',type:'EMBER',rarity:'Common',emoji:'🔌',embers:0,effect:'Gain 1 Ember.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'soundboard',name:'Soundboard',type:'EMBER',rarity:'Uncommon',emoji:'🎛',embers:1,effect:'Gain 2 Embers. Draw 1 extra card next Strike.',color:'#c87820',typeColor:'#a05a10',copies:1},
  {id:'setbreak',name:'Setbreak',type:'UTILITY',rarity:'Common',emoji:'🎼',embers:0,effect:'Discard a random card from hand. Gain 2 Embers.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'heavyriff',name:'Heavy Riff',type:'RIFF',rarity:'Uncommon',emoji:'🥊',embers:2,effect:'Deal damage = stage total ATK ÷ 2, direct to boss.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'resonancecard',name:'Resonance',type:'RIFF',rarity:'Uncommon',emoji:'🌀',embers:1,effect:'Target member ATK becomes equal to highest ATK on stage.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'herbmoney',name:'Herb Money',type:'RIFF',rarity:'Uncommon',emoji:'🌿',embers:2,effect:'Deal damage = 10% of current Stash (max 69). Lose that Stash.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'goingbroke',name:'Going Broke',type:'RIFF',rarity:'Rare',emoji:'💸',embers:0,effect:'Spend ALL your Stash. Deal that much damage to the boss.',color:'#9933cc',typeColor:'#7722aa',copies:1,shopOnly:true},
]

const KEYWORD_DESC={
  'FRENZIED':'High damage dealer. ATK scales with consecutive buffs.',
  'DOUBLE TIME':'Rolls d6 each fight: 5-6=Double Time (×2 ATK), 3-4=Off Beat (×1.5), 1-2=Half Time (×0.5). A gamble!',
  'ANCHOR':'After each Strike, heals adjacent members +1 HP.',
  'CORRUPT':'ATK increases with Corruption level. Thrives in chaos.',
  'DEBUFF':'Reduces boss damage by 2 each Strike, stacking permanently this fight.',
}
function seededRng(seed){let s=seed;return function(){s=Math.imul(48271,s)|0;return(s&0x7fffffff)/0x7fffffff}}

function buildDeck(seed){
  const rng=seededRng(seed)
  const deck=[]
  ALL_CARDS.forEach(function(c){
    const n=c.copies||3
    for(let i=0;i<n;i++){deck.push(Object.assign({},c,{uid:Math.random().toString(36).slice(2)}))}
  })
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
  return deck
}

function getCenter(ref){
  if(!ref||!ref.current)return{x:window.innerWidth/2,y:window.innerHeight/2}
  const r=ref.current.getBoundingClientRect()
  return{x:r.left+r.width/2,y:r.top+r.height/2}
}

// ── STARTER ARTIFACTS A1-A10 ─────────────────────────────────
const STARTER_ARTIFACTS=[
  {id:'a1',name:'Vintage Guitar',emoji:'🎸',effect:'Lead guitarist starts every fight with +1 ATK permanently.',cost:10},
  {id:'a2',name:"Devil's Tuning Fork",emoji:'🔱',effect:'Every fight begins with Corruption already at 15%.',cost:8},
  {id:'a3',name:'The Evil Eye',emoji:'🧿',effect:'The first card you play each Strike costs 0 Embers.',cost:20,rare:true},
  {id:'a4',name:"Roadie's Toolbelt",emoji:'🧰',effect:'At the start of each fight, one random member gains Stonewall (immune to Too Stoned once).',cost:6},
  {id:'a5',name:'Haunted Radio',emoji:'📻',effect:'Tapped Out gives +6 Embers instead of +5. Power Tap gives +2 instead of +1.',cost:8},
  {id:'a6',name:'Black Candle',emoji:'🕯',effect:'When any band member goes Too Stoned, deal 8 damage to the boss.',cost:12},
  {id:'a7',name:"The Serpent's Kiss",emoji:'🐍',effect:'Start each fight with 1 extra Ember permanently (max 8 total).',cost:18},
  {id:'a8',name:'Stone Tablet',emoji:'🪨',effect:'All band members gain +3 max HP permanently.',cost:12},
  {id:'a9',name:'Resonance Coil',emoji:'⚙️',effect:'Resonance (duplicate played) refunds 2 Embers instead of 1, and draws 1 card next Strike.',cost:10},
  {id:'a10',name:'Burning Stage',emoji:'🔥',effect:'Win a fight in 1 Strike: gain 5 Embers at the start of the next fight.',cost:10},
]

// ── STARTER PASSIVES P1-P10 (CD-Rs) ───────────────────────────
const STARTER_PASSIVES=[
  {id:'p1',name:'Power Chord',emoji:'💿',effect:'Gain 1 extra Ember at the start of every fight.',cost:6},
  {id:'p2',name:'Roadie Crew',emoji:'💿',effect:'At the start of each fight, one random member heals 3 HP.',cost:8},
  {id:'p3',name:'Merch Table',emoji:'💿',effect:'After each fight victory, gain +2 bonus Stash.',cost:6},
  {id:'p4',name:'Feedback Hum',emoji:'💿',effect:'All EMBER type cards give 1 additional Ember when played.',cost:10},
  {id:'p5',name:'Amp Stack',emoji:'💿',effect:'Sound Wall deals +4 additional damage. Heavy Riff deals +2 additional damage.',cost:10},
  {id:'p6',name:'Cult Following',emoji:'💿',effect:'Each time any member goes Too Stoned, gain 3 Stash.',cost:10},
  {id:'p7',name:'Guitar Tech',emoji:'💿',effect:'Battle Cry gives +2 ATK permanently instead of +1.',cost:8},
  {id:'p8',name:'Green Room',emoji:'💿',effect:'At the start of each fight, all members gain Stonewall (immune to first Too Stoned event).',cost:16},
  {id:'p9',name:'Heavy Rotation',emoji:'💿',effect:'When you draw a duplicate card into your hand, draw 1 extra card next Strike.',cost:10},
  {id:'p10',name:'Stage Fright Reversal',emoji:'💿',effect:'The first Strike of every fight deals +10 bonus damage.',cost:14},
]

const BOSS_QUOTES={
  'wanderer':'Finally... rest.',
  'lostsoul':'I was looking for something. I forgot what.',
  'drifter':'The road ends here. For now.',
  'siren':'You resisted. No one resists forever.',
  'tempter':'The flesh is weak. Even mine.',
  'lust_boss':'Desire never truly dies. Remember that.',
  'glutton':'Still... hungry...',
  'feaster':'There is always... more...',
  'gluttony_boss':'I consumed everything. Even myself.',
  'miser':'My stash... my beautiful stash...',
  'hoarder':'I was saving that for later...',
  'greed_boss':'You cannot take it with you. Neither could I.',
  'wrathful':'The rage remains. It always remains.',
  'berserker':'I felt nothing but fury. Was that living?',
  'anger_boss':'Your anger will outlast you. I promise.',
  'heretic':'The truth was never yours to know.',
  'apostate':'I chose the wrong side. Or the right one.',
  'heresy_boss':'The doctrine... was flawed. I see that now.',
  'brute':'Strong. But not strong enough.',
  'hunter':'I never missed. Until today.',
  'violence_boss':'I executed thousands. You executed me.',
  'trickster':'Ha. Good trick.',
  'deceiver':'Was anything real? No. Nothing was.',
  'fraud_boss':'The greatest fraud was believing I could win.',
  'traitor':'I betrayed everyone. Fitting that I fall last.',
  'betrayer':'Trust no one. I never did. Still lost.',
  'lucifer':'Impressive. I\'ll be seeing you again. Soon.',
}

const CIRCLE_ARTIFACTS=[
  {name:'The Goat of Mendes',emoji:'🐐',effect:'All band members gain +1 ATK permanently.',cost:14},
  {name:'Hellfire Amulet',emoji:'🔮',effect:'Start each fight with +2 bonus Embers.',cost:17},
  {name:'Sabbath Crown',emoji:'👑',effect:'Too Stoned members revive at 50% HP each round.',cost:22},
  {name:'Wailing Guitar',emoji:'🎸',effect:'First Strike each fight deals double damage.',cost:16},
]

// Card prices by rarity
function cardPrice(card){
  if(!card)return 0
  if(card.isMember)return card.foil?15:card.mythic?30:5
  const base=card.rarity==='Rare'?14:card.rarity==='Uncommon'?8:4
  return base
}

// Generate shop cards scaled by circle depth (circleNum 1-9)
function genShopCards(circleNum){
  const cn=circleNum||1
  // 9% chance to replace one slot with a member appearance
  const memberChance=Math.random()
  let memberSlot=null
  if(memberChance<0.05)memberSlot={isMember:true,name:'Band Member',emoji:'🎸',cost:5,rarity:'Common',type:'RECRUIT',effect:'A new musician joins your band.',foil:false,mythic:false}
  else if(memberChance<0.08)memberSlot={isMember:true,name:'Foil Member',emoji:'✨',cost:15,rarity:'Uncommon',type:'RECRUIT',effect:'A rare foil musician joins your band.',foil:true,mythic:false}
  else if(memberChance<0.09)memberSlot={isMember:true,name:'Mythic Member',emoji:'⛧',cost:30,rarity:'Rare',type:'RECRUIT',effect:'A mythic musician joins your band.',foil:false,mythic:true}

  // Filter cards by circle depth
  const pool=[...ALL_CARDS].filter(c=>{
    if(cn<=2)return c.rarity==='Common'||c.rarity==='Uncommon'
    if(cn<=4)return true
    return true
  })
  // Weigh rarer cards higher in later circles
  const weighted=[]
  pool.forEach(c=>{
    const w=c.rarity==='Rare'?(cn>=4?3:cn>=2?1:0):c.rarity==='Uncommon'?2:3
    for(let i=0;i<w;i++)weighted.push(c)
  })
  const shuffled=[...weighted].sort(()=>Math.random()-.5)
  const cards=[]
  const seen=new Set()
  for(const c of shuffled){
    if(!seen.has(c.id)){seen.add(c.id);cards.push(c)}
    if(cards.length===3)break
  }
  // Insert member if rolled
  if(memberSlot){cards[Math.floor(Math.random()*3)]=memberSlot}
  return cards
}

// 5 booster pack tiers — music format theme
function genBoosterPacks(circleNum){
  const cn=circleNum||1
  const allPacks=[
    {id:'cassette',name:'Cassette Tape',emoji:'📼',cost:6,desc:'3 Common cards. Pick 1.',minCircle:1},
    {id:'cdr',name:'CD-R',emoji:'💿',cost:12,desc:'2 Common + 1 Uncommon. Pick 1.',minCircle:1},
    {id:'vinyl',name:'Import Vinyl',emoji:'📀',cost:22,desc:'1 Uncommon + 1 Rare. Pick 1.',minCircle:2},
    {id:'rarevinyl',name:'Rare Vinyl',emoji:'🖤',cost:38,desc:'1 Rare + 30% Foil chance. Pick 1.',minCircle:4},
    {id:'cursed',name:'Cursed Demo',emoji:'⛧',cost:60,desc:'1 Rare guaranteed. 50% Foil, 20% Mythic, 5% Double-Mythic.',minCircle:6},
  ]
  return allPacks.filter(p=>cn>=p.minCircle).slice(-3) // show up to 3 most advanced
}

// Recruitment packs
function genRecruitPack(){
  const packs=[
    {name:'Garage Band Pack',emoji:'🎸',cost:10,desc:'Pick 1 of 2 musicians.',members:2,foilChance:0,mythicChance:0,demonicChance:0},
    {name:'Touring Pack',emoji:'🎤',cost:22,desc:'Pick 1 of 3. 15% Foil chance.',members:3,foilChance:0.15,mythicChance:0,demonicChance:0},
    {name:'Demonic Pack',emoji:'⛧',cost:40,desc:'Pick 1 of 4. 25% Foil, 15% Mythic, 3% DEMONIC.',members:4,foilChance:0.25,mythicChance:0.15,demonicChance:0.03},
  ]
  return packs[Math.floor(Math.random()*packs.length)]
}

// ── MENTOR LINK SYSTEM ────────────────────────────────────────────
const KW_BOND_COLOR={'FRENZIED':'#ee2222','DOUBLE TIME':'#ff8800','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}
function memberTier(m){return m&&m.demonic?'demonic':m&&m.mythic?'mythic':m&&m.foil?'foil':'base'}
function tierAtkBonus(m){return m.demonic?5:m.mythic?3:m.foil?1:0}
function tierHpBonus(m){return m.demonic?5:m.mythic?3:m.foil?1:0}
function roleBondBonus(tier){return tier==='demonic'?3:tier==='mythic'?2:tier==='foil'?1:0}
function getBondColor(member,stage){
  if(!member||!member.roleBondWith||member.roleBondWith.length===0)return null
  if(!stage.some(m=>m&&member.roleBondWith.includes(m.uid)))return null
  return KW_BOND_COLOR[member.keyword]||'#e8a820'
}
function applyMentorLink(newMember,ns){
  const tier=memberTier(newMember)
  const atkB=tierAtkBonus(newMember),hpB=tierHpBonus(newMember)
  let m={...newMember,atk:newMember.atk+atkB,maxHp:(newMember.maxHp||newMember.hp)+hpB,hp:(newMember.hp)+hpB,roleBondWith:[],roleBondBonus:0}
  if(tier==='base')return m
  const rb=roleBondBonus(tier)
  ns.forEach((s,i)=>{
    if(!s||!s.id||s.uid===m.uid||s.locked)return
    if(s.role===m.role){
      m={...m,atk:m.atk+rb,roleBondWith:[...m.roleBondWith,s.uid],roleBondBonus:m.roleBondBonus+rb}
      ns[i]={...s,atk:s.atk+rb,roleBondWith:[...(s.roleBondWith||[]),m.uid],roleBondBonus:(s.roleBondBonus||0)+rb}
    }
  })
  return m
}
function breakMentorLink(sold,stage){
  if(!sold.roleBondWith||sold.roleBondWith.length===0)return stage
  const rb=roleBondBonus(memberTier(sold))
  return stage.map(m=>{
    if(!m||!sold.roleBondWith.includes(m.uid))return m
    const base=(ALL_MUSICIANS.find(mu=>mu.id===m.id)||{atk:1}).atk
    return{...m,atk:Math.max(base,m.atk-rb),roleBondWith:(m.roleBondWith||[]).filter(u=>u!==sold.uid),roleBondBonus:Math.max(0,(m.roleBondBonus||0)-rb)}
  })
}


// ── Projectile ────────────────────────────────────────────────────────────────
function Projectile({from,to,emoji,onDone}){
  const [p,setP]=useState({x:from.x,y:from.y,s:1,o:1})
  const fr=useRef(null),st=useRef(null)
  useEffect(()=>{
    const go=ts=>{
      if(!st.current)st.current=ts
      const t=Math.min((ts-st.current)/520,1)
      const cx=(from.x+to.x)/2,cy=Math.min(from.y,to.y)-150
      setP({x:(1-t)*(1-t)*from.x+2*(1-t)*t*cx+t*t*to.x,y:(1-t)*(1-t)*from.y+2*(1-t)*t*cy+t*t*to.y,s:1+Math.sin(t*Math.PI)*.9,o:t<.85?1:1-(t-.85)/.15})
      if(t<1)fr.current=requestAnimationFrame(go);else onDone()
    }
    fr.current=requestAnimationFrame(go)
    return ()=>cancelAnimationFrame(fr.current)
  },[])
  return <div style={{position:'fixed',left:p.x,top:p.y,transform:`translate(-50%,-50%) scale(${p.s})`,fontSize:52,opacity:p.o,pointerEvents:'none',zIndex:8000,filter:'drop-shadow(0 0 20px rgba(255,80,0,0.95))'}}>{emoji}</div>
}

function Float({v,x,y,color,big,onDone}){
  color=color||'#dd2222';big=big||false
  useEffect(()=>{const t=setTimeout(onDone,1400);return ()=>clearTimeout(t)},[])
  return <div style={{position:'fixed',left:x,top:y,transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:big?'4.5rem':'2.8rem',fontWeight:900,color:color,textShadow:`0 0 24px ${color}`,pointerEvents:'none',zIndex:9000,animation:'floatUp 1.4s ease-out forwards'}}>{typeof v==='number'&&v>0?'-'+v:v}</div>
}

function DiceRoll({target,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,1200);return ()=>clearTimeout(t)},[])
  return(
    <div style={{position:'fixed',left:'50%',top:'40%',transform:'translate(-50%,-50%)',zIndex:9100,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:8,animation:'fadeIn 0.2s ease'}}>
      <div style={{fontSize:56,animation:'wiggle 0.4s ease infinite'}}>🎲</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#e8a820',letterSpacing:2,textShadow:'0 0 12px rgba(232,168,32,0.8)',background:'rgba(0,0,0,0.8)',padding:'6px 16px',borderRadius:4,border:'1px solid rgba(232,168,32,0.4)'}}>TARGET: {target&&target.name}</div>
    </div>
  )
}

function EmberDisplayLarge({current,max}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#aa5820',letterSpacing:3,textTransform:'uppercase',fontWeight:700}}>Embers</div>
      <div style={{display:'flex',gap:5}}>
        {Array.from({length:max}).map((_,i)=>(
          <div key={i} style={{fontSize:i>=(max-current)?22:18,opacity:i>=(max-current)?1:0.18,filter:i>=(max-current)?'drop-shadow(0 0 8px rgba(255,120,0,0.9))':'grayscale(1)',transition:'all 0.25s'}}>🔥</div>
        ))}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:current>0?'#ff6600':'#444',lineHeight:1}}>{current}/{max}</div>
    </div>
  )
}
function EmberDisplay({current,max}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#8a4820',letterSpacing:3,textTransform:'uppercase'}}>Embers</div>
      <div style={{display:'flex',gap:3}}>
        {Array.from({length:max}).map((_,i)=>(
          <div key={i} style={{fontSize:i>=(max-current)?15:13,opacity:i>=(max-current)?1:0.22,filter:i>=(max-current)?'drop-shadow(0 0 6px rgba(255,100,0,0.8))':'grayscale(1)',transition:'all 0.25s'}}>🔥</div>
        ))}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:current>0?'#ff6600':'#444',lineHeight:1}}>{current}/{max}</div>
    </div>
  )
}

function BoosterScreen({onComplete,seed}){
  const [sel,setSel]=useState([])
  const getRandom8=()=>{
    const real=ALL_MUSICIANS.filter(m=>!m.locked)
    const locked=ALL_MUSICIANS.filter(m=>m.locked)
    const shuffled=[...real].sort(()=>Math.random()-0.5)
    // Always exactly 1 locked card, 7 random real members
    const oneLocked=locked.length>0?[locked[Math.floor(Math.random()*locked.length)]]:[]
    const picked=shuffled.slice(0,8-oneLocked.length)
    return [...picked,...oneLocked].sort(()=>Math.random()-0.5)
  }
  const [pool]=useState(getRandom8)
  const toggle=id=>setSel(p=>p.includes(id)?p.filter(x=>x!==id):p.length<2?[...p,id]:p)
  const kwColor={'FRENZIED':'#ee2222','DOUBLE TIME':'#ff8800','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}
  return(
    <div style={{position:'fixed',inset:0,zIndex:9800,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:'60px 20px 24px 20px',overflowY:'auto'}}>
      <div style={{fontFamily:"'BreakGothicFont',cursive",fontSize:88,color:'#cc1111',textShadow:'0 0 40px rgba(180,0,0,0.8),0 0 80px rgba(140,0,0,0.5),3px 3px 0 #000',flexShrink:0,letterSpacing:20}}>Opening Night</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:27,color:'#e8d090',fontStyle:'italic',flexShrink:0}}>Select 2 musicians to start your band</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#e8d090',letterSpacing:2,flexShrink:0}}>RUN SEED: {seed.toString(16).toUpperCase()}</div>

      {/* MEMBER CARDS — 7 in a flexible row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:16,width:'960px',flexShrink:0,marginBottom:4}}>
        {pool.map(m=>{
          const isSel=sel.includes(m.id),dis=!isSel&&sel.length>=2
          const kw=m.keyword||''
          const kwc=kwColor[kw]||'#e8a820'
          return(
            <div key={m.id} onClick={()=>!m.locked&&!dis&&toggle(m.id)}
              style={{background:m.locked?'linear-gradient(180deg,#0e0e0e,#060606)':isSel?'linear-gradient(180deg,#2a1a0a,#160c04)':'linear-gradient(180deg,#1a1008,#0e0804)',
                border:m.locked?'1px solid rgba(60,60,60,0.5)':isSel?'2px solid #e8a820':dis?'1px solid rgba(80,50,10,0.25)':'1px solid rgba(160,100,25,0.5)',
                borderRadius:7,cursor:m.locked?'default':dis?'not-allowed':'pointer',minWidth:0,
                boxShadow:isSel?'0 0 30px rgba(232,168,32,0.4),0 8px 24px rgba(0,0,0,0.8)':'0 4px 16px rgba(0,0,0,0.7)',
                opacity:dis?0.4:1,transform:isSel?'translateY(-8px) scale(1.04)':'none',
                transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',position:'relative',
                animation:(!isSel&&!dis&&!m.locked)?'throbSlow 4.5s ease-in-out infinite':'none'}}>
              <div style={{height:5,borderRadius:'7px 7px 0 0',background:isSel?'linear-gradient(90deg,#e8a820,#ffcc44)':kwc+'66'}}/>
              {isSel&&<div style={{position:'absolute',top:8,right:8,width:24,height:24,borderRadius:'50%',background:'#e8a820',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#000',fontWeight:900}}>✓</div>}
              <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',fontSize:54,background:'rgba(0,0,0,0.3)'}}>{m.emoji}</div>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:26,color:isSel?'#e8d090':'#c8b878',textAlign:'center',padding:'5px 4px 1px',lineHeight:1,letterSpacing:2}}>{m.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,letterSpacing:2,color:'#7a6a40',textAlign:'center',padding:'3px 4px 8px',textTransform:'uppercase'}}>{m.role}</div>
              {/* Stat bar — locked vs normal */}
              {m.locked?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'18px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)',gap:6}}>
                  <div style={{fontSize:30,opacity:0.5}}>🔒</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#5a4020',letterSpacing:2,textAlign:'center',textTransform:'uppercase'}}>Can you find the key?</div>
                </div>
              ):(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#ee2222',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:38,fontWeight:900,color:'#ee2222',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:kwc,fontWeight:700,textAlign:'center',letterSpacing:0.5,maxWidth:80}}>{kw}</div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#33dd33',textTransform:'uppercase',fontWeight:900}}>HP</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:38,fontWeight:900,color:'#33dd33',lineHeight:1}}>{m.hp}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ABILITY EXPLANATION BOX */}
      <div style={{background:'rgba(10,6,2,0.85)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:8,padding:'20px 28px',width:'960px',flexShrink:0,marginTop:8}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:4,color:'#8a6020',textTransform:'uppercase',textAlign:'center',marginBottom:16}}>⚗ Band Abilities — What Do They Mean?</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            ['FRENZIED','#ee2222','⚡','Each time the boss is defeated, this member gains +1 ATK permanently.'],
            ['DOUBLE TIME','#ff8800','🥁','Rolls a d6 each fight: 5-6 doubles all ATK, 3-4 gives ×1.5, 1-2 gives only ×0.5. High risk, high reward.'],
            ['ANCHOR','#33dd33','⚓','After every Strike, heals the members next to this one for +1 HP.'],
            ['CORRUPT','#cc44ff','🌀','ATK scales up the higher your Corruption is.'],
            ['DEBUFF','#4488ff','🎤','Each Strike permanently reduces boss damage by 2 this fight. Stacks up.'],
            ['FOLK MAGIC','#44ddaa','🪈','Each Strike has a 20% chance to refund ALL the Embers you spent. Pure luck. Pure folk magic.'],
            ['SHREDDER','#ff4488','🎸','The first RIFF card you play each Strike costs 1 less Ember. Play fast, hit hard.'],
            ['HEXED','#cc8800','🟠','Each Strike auto-raises Corruption +5%. Gains +1 ATK for every 10% Corruption. Gets scarier over time.'],
          ].map(([kw,color,icon,desc])=>(
            <div key={kw} style={{display:'flex',alignItems:'flex-start',gap:10,background:'rgba(0,0,0,0.4)',borderRadius:6,padding:'12px 16px',border:`1px solid ${color}44`,flex:'1 1 180px'}}>
              <div style={{fontSize:26,flexShrink:0,marginTop:2}}>{icon}</div>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:color,letterSpacing:1,marginBottom:5}}>{kw}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#c0a870',lineHeight:1.45,fontStyle:'italic'}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>sel.length===2&&onComplete(sel)} disabled={sel.length<2}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'14px 52px',background:'rgba(130,0,0,0.35)',border:'2px solid #cc1111',borderRadius:3,color:'#ee2222',cursor:sel.length===2?'pointer':'default',transition:'all 0.2s',flexShrink:0,boxShadow:'0 0 22px rgba(180,0,0,0.5)',opacity:sel.length===2?1:0.45,textShadow:'0 0 14px rgba(200,0,0,0.6)'}}>
        {sel.length===2?'⛧  Take the Stage':'Select 2 Musicians'}
      </button>
    
    </div>
  )
}


function PawnShopModal({stage, deck, discard, stash, salesLeft, onSellMember, onSellCard, onClose}){
  const [tab, setTab] = useState('cards')
  // Show ALL copies individually so player can sell as many as they want
  // Sort deck+discard by sell price descending, then by name
  const allCards = [...deck,...discard].sort((a,b)=>{
    const pa = (a.rarity==='Rare'?4:a.rarity==='Uncommon'?2:1)+(a.foil?3:0)+(a.mythic?8:0)
    const pb = (b.rarity==='Rare'?4:b.rarity==='Uncommon'?2:1)+(b.foil?3:0)+(b.mythic?8:0)
    if(pb!==pa) return pb-pa
    return (a.name||'').localeCompare(b.name||'')
  })
  const members = stage.map((m,i)=>m?{m,i}:null).filter(Boolean)
  const canSell = salesLeft > 0
  const activeMembers = members.filter(x=>!x.m.tooStoned)

  function memberSellPrice(m){
    if(m.demonic) return 69
    return 5 + (m.foil?3:0) + (m.mythic?8:0)
  }
  function cardSellPrice(c){
    const base = c.rarity==='Rare'?4:c.rarity==='Uncommon'?2:1
    return base + (c.foil?3:0) + (c.mythic?8:0)
  }
  const tabStyle = (active) => ({
    fontFamily:"'MBScribblesFont',serif", fontSize:12, fontWeight:900, letterSpacing:2,
    padding:'8px 20px', cursor:'pointer', border:'none', textTransform:'uppercase',
    background: active?'rgba(160,80,240,0.3)':'transparent',
    color: active?'#cc88ff':'#6a4a8a',
    borderBottom: active?'2px solid #cc88ff':'2px solid transparent',
    transition:'all 0.2s'
  })
  return(
    <div style={{position:'fixed',inset:0,zIndex:9800,background:'rgba(2,1,4,0.96)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
      {/* Stash counter — top right, ticks up on each sale */}
      <div style={{position:'fixed',top:24,right:32,display:'flex',flexDirection:'column',alignItems:'center',gap:4,
        background:'rgba(20,10,5,0.95)',border:'2px solid #55ee66',borderRadius:10,padding:'12px 20px',
        boxShadow:'0 0 24px rgba(60,220,80,0.4)',minWidth:100}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#33aa44',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>Stash</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,color:'#55ee66',lineHeight:1,
          textShadow:'0 0 20px rgba(60,220,80,0.8)'}}>{stash}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'#33aa44',fontStyle:'italic'}}>🌿</div>
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'#cc88ff',textShadow:'0 0 30px rgba(180,60,255,0.6)',marginBottom:6}}>🪙 Pawn Shop</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:15,color:'#8a6aaa',fontStyle:'italic',marginBottom:4}}>
        {salesLeft} sale{salesLeft!==1?'s':''} remaining this visit
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#5a3a7a',letterSpacing:1,marginBottom:20}}>
        Cannot sell last 2 members · Bonds break on member sale
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(160,80,240,0.2)',marginBottom:24,width:'100%',maxWidth:800}}>
        <button style={tabStyle(tab==='members')} onClick={()=>setTab('members')}>Members</button>
        <button style={tabStyle(tab==='cards')} onClick={()=>setTab('cards')}>Cards</button>
      </div>

      {/* Members tab */}
      {tab==='members'&&<div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',maxWidth:900}}>
        {members.length===0&&<div style={{fontFamily:"'ScratchFont',serif",color:'#5a3a6a',fontStyle:'italic',fontSize:16}}>No members on stage.</div>}
        {members.map(({m,i})=>{
          const price = memberSellPrice(m)
          const cantSell = activeMembers.length<=2
          const bc = {'FRENZIED':'#ee2222','DOUBLE TIME':'#ff8800','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}[m.keyword]||'#e8a820'
          const tierColor = m.demonic?'#ffd700':m.mythic?'#dd88ff':m.foil?'#88ccff':null
          return(
            <div key={m.uid||i} style={{width:180,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'1px solid '+(tierColor||'rgba(160,80,240,0.4)'),borderRadius:7,overflow:'hidden',opacity:cantSell?0.5:1}}>
              {tierColor&&<div style={{background:tierColor,padding:'3px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,color:'#0a0704',letterSpacing:2}}>{m.demonic?'⛧ DEMONIC':m.mythic?'✦ MYTHIC':'✨ FOIL'}</div>}
              <div style={{fontSize:44,textAlign:'center',padding:'14px 0',background:'rgba(0,0,0,0.3)'}}>{m.emoji}</div>
              <div style={{padding:'0 10px 12px'}}>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:20,color:'#e8d090',textAlign:'center',marginBottom:2}}>{m.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#6a5030',textAlign:'center',letterSpacing:1,marginBottom:6}}>{m.role}</div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'4px 6px',background:'rgba(0,0,0,0.4)',borderRadius:3,marginBottom:8}}>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#ee2222',fontWeight:900}}>ATK</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:'#ee2222'}}>{m.atk}</div></div>
                  <div style={{alignSelf:'center',fontFamily:"'MBScribblesFont',serif",fontSize:9,color:bc,fontWeight:700}}>{m.keyword}</div>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#33dd33',fontWeight:900}}>HP</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:'#33dd33'}}>{m.hp}/{m.maxHp}</div></div>
                </div>
                {m.roleBondBonus>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#e8a820',textAlign:'center',marginBottom:6}}>🔗 Bond +{m.roleBondBonus} ATK (breaks)</div>}
                <button
                  disabled={!canSell||cantSell}
                  onClick={()=>{if(canSell&&!cantSell){onSellMember(m,i);if(salesLeft<=1)onClose()}}
                  }
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,letterSpacing:1,padding:'8px',
                    background:canSell&&!cantSell?'rgba(160,80,240,0.2)':'rgba(40,20,60,0.2)',
                    border:'1px solid '+(canSell&&!cantSell?'rgba(160,80,240,0.6)':'rgba(80,40,120,0.3)'),
                    borderRadius:4,color:canSell&&!cantSell?'#cc88ff':'#4a2a6a',cursor:canSell&&!cantSell?'pointer':'not-allowed',
                    textTransform:'uppercase'}}>
                  {cantSell?'Need 2+ members':'Sell for '+price+' 🌿'}
                </button>
              </div>
            </div>
          )
        })}
      </div>}

      {/* Cards tab */}
      {tab==='cards'&&<div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',maxWidth:900}}>
        {allCards.length===0&&<div style={{fontFamily:"'ScratchFont',serif",color:'#5a3a6a',fontStyle:'italic',fontSize:16}}>Deck is empty.</div>}
        {allCards.map(c=>{
          const price = cardSellPrice(c)
          const bc = c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
          return(
            <div key={c.uid||c.id} style={{width:140,background:'linear-gradient(180deg,#201408,#100804)',border:'1px solid '+bc+'88',borderRadius:6,overflow:'hidden'}}>
              <div style={{height:4,background:bc}}/>
              <div style={{fontSize:36,textAlign:'center',padding:'10px 0',background:'rgba(0,0,0,0.3)'}}>{c.emoji}</div>
              <div style={{padding:'0 8px 10px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:2}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#6a5030',textAlign:'center',marginBottom:4}}>{c.rarity}</div>
                <button
                  disabled={!canSell}
                  onClick={()=>{if(canSell){onSellCard(c);if(salesLeft<=1)onClose()}}}
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:1,padding:'6px',
                    background:canSell?'rgba(80,30,140,0.2)':'rgba(30,15,60,0.2)',
                    border:'1px solid '+(canSell?'rgba(140,60,220,0.5)':'rgba(60,30,100,0.3)'),
                    borderRadius:3,color:canSell?'#aa66ee':'#4a2a6a',cursor:canSell?'pointer':'not-allowed',
                    textTransform:'uppercase'}}>
                  Sell for {price} 🌿
                </button>
              </div>
            </div>
          )
        })}
      </div>}

      <button onClick={onClose} style={{marginTop:30,fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:3,padding:'12px 40px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:3,color:'#7a5020',cursor:'pointer',textTransform:'uppercase'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#7a5020'}}>
        Close Shop
      </button>
    </div>
  )
}

function ShopScreen({stash,onSpend,onLeave,circleArtifact,circlePassive,recruitPack,shopCards,boosterPacks,rerollCost,onReroll,fightIndex,activeArtifacts,activePassives,starterArtifacts,starterPassives,stage,deck,discardPile,onPawnSellMember,onPawnSellCard}){
  const [hovId,setHovId]=useState(null)
  const [pawnSalesLeft,setPawnSalesLeft]=useState(2)
  const [pawnOpen,setPawnOpen]=useState(false)
  const [boughtIds,setBoughtIds]=useState([])
  const [leftBought,setLeftBought]=useState({cart:false,cpas:false})
  useEffect(()=>{setBoughtIds([])},[shopCards])
  const [openPackModal,setOpenPackModal]=useState(null) // {pack, cards, picksLeft, picked}
  const circleNum=Math.floor(fightIndex/3)+1
  const can=p=>stash>=p
  const stashColor=stash>=420?'#ff3300':stash>=380?'#ff9900':'#55ee66'
  const typeClr=t=>t==='CORRUPT'?'#aa1111':t==='UTILITY'?'#22aa44':t==='EMBER'?'#c87820':'#9933cc'
  const typeGlow=t=>t==='CORRUPT'?'rgba(170,0,0,0.5)':t==='UTILITY'?'rgba(30,160,50,0.5)':t==='EMBER'?'rgba(200,120,20,0.5)':'rgba(140,40,200,0.5)'
  const rarityAnim=r=>r==='Rare'?'holoShimmer 3s ease-in-out infinite':r==='Uncommon'?'uncommonGlow 2s ease-in-out infinite':''

  function buyCard(card){
    if(!can(cardPrice(card)))return
    onSpend(cardPrice(card),'card',card)
    setBoughtIds(p=>[...p,card.uid||card.id])
  }
  function buyLeft(key,cost,type,item){
    if(!can(cost))return
    onSpend(cost,type,item)
    setLeftBought(p=>({...p,[key]:true}))
  }

  // ── PACK CARD GENERATOR ──
  function genPackCards(pack){
    const rng=()=>Math.random()
    const pickRandom=(arr,n)=>{
      const s=[...arr];const out=[]
      for(let i=0;i<n&&s.length;i++){const idx=Math.floor(rng()*s.length);out.push(s.splice(idx,1)[0])}
      return out
    }
    const applyFoilMythic=(cards,foilChance,mythicChance)=>cards.map(c=>{
      const r=rng()
      if(mythicChance&&r<mythicChance)return {...c,mythic:true,uid:Math.random().toString(36).slice(2)}
      if(foilChance&&r<foilChance)return {...c,foil:true,uid:Math.random().toString(36).slice(2)}
      return {...c,uid:Math.random().toString(36).slice(2)}
    })
    const commons=ALL_CARDS.filter(c=>c.rarity==='Common'&&!c.shopOnly)
    const uncommons=ALL_CARDS.filter(c=>c.rarity==='Uncommon')
    const rares=ALL_CARDS.filter(c=>c.rarity==='Rare'&&!c.shopOnly)

    if(pack.id==='cassette')return{cards:applyFoilMythic(pickRandom(commons,3),0,0),picks:1}
    if(pack.id==='cdr')return{cards:applyFoilMythic([...pickRandom(commons,3),...pickRandom(uncommons,2)],0.03,0),picks:1}
    if(pack.id==='vinyl')return{cards:applyFoilMythic([...pickRandom(uncommons,1),...pickRandom(rares,1)],0.20,0),picks:1}
    if(pack.id==='rarevinyl')return{cards:applyFoilMythic([...pickRandom(commons,2),...pickRandom(uncommons,2),...pickRandom(rares,1)],0.30,0.05),picks:2}
    if(pack.id==='cursed'){
      const base=[...pickRandom(uncommons,2),...pickRandom(rares,2)]
      // 10% chance one is a passive
      if(rng()<0.1&&(starterPassives||[]).length){
        const pas=starterPassives[Math.floor(rng()*starterPassives.length)]
        base.push({...pas,_isPack:true,uid:Math.random().toString(36).slice(2)})
      } else {
        base.push(...pickRandom(rares,1))
      }
      return{cards:applyFoilMythic(base,0.50,0.20),picks:2}
    }
    if(pack.id==='ritual'){
      const packs=(starterPassives||[]).filter(p=>!(activePassives||[]).some(e=>e.id===p.id))
      return{cards:pickRandom(packs,Math.min(2,packs.length)).map(p=>({...p,_isPack:true,uid:Math.random().toString(36).slice(2)})),picks:1}
    }
    if(pack.id==='hellforged'){
      const arts=(starterArtifacts||[]).filter(a=>!(activeArtifacts||[]).some(e=>e.id===a.id))
      return{cards:pickRandom(arts,Math.min(2,arts.length)).map(a=>({...a,_isPack:true,uid:Math.random().toString(36).slice(2)})),picks:1}
    }
    if(pack.id==='garage'){
      const members=ALL_MUSICIANS.filter(m=>!m.locked).map(m=>({...m,isMember:true,uid:Math.random().toString(36).slice(2)}))
      return{cards:pickRandom(members,2),picks:1}
    }
    if(pack.id==='touring'){
      const members=ALL_MUSICIANS.filter(m=>!m.locked).map(m=>({...m,isMember:true}))
      return{cards:applyFoilMythic(pickRandom(members,3),0.15,0),picks:1}
    }
    if(pack.id==='demonic'){
      const members=ALL_MUSICIANS.filter(m=>!m.locked).map(m=>({...m,isMember:true}))
      return{cards:applyFoilMythic(pickRandom(members,4),0.25,0.15),picks:1}
    }
    return{cards:[],picks:1}
  }

  function handleOpenPack(pack){
    if(!can(pack.cost))return
    const {cards,picks}=genPackCards(pack)
    setOpenPackModal({pack,cards,picksLeft:picks,picked:[]})
  }

  function handlePickCard(card){
    if(!openPackModal)return
    const newPicked=[...openPackModal.picked,card]
    if(newPicked.length>=openPackModal.picksLeft){
      // Finalize — add picked cards and pay
      onSpend(openPackModal.pack.cost,'pack',{...openPackModal.pack,pickedCards:newPicked})
      setOpenPackModal(null)
    } else {
      setOpenPackModal(p=>({...p,picked:newPicked}))
    }
  }

  // ── SOLD OVERLAY ──
  function SoldOverlay(){
    return(
      <div style={{position:'absolute',inset:0,zIndex:10,
        background:'rgba(0,0,0,0.55)',borderRadius:8,
        display:'flex',alignItems:'center',justifyContent:'center',
        pointerEvents:'none'}}>
        <div style={{
          fontFamily:"'MBScribblesFont',serif",fontSize:38,fontWeight:900,
          color:'#cc1111',letterSpacing:4,
          textShadow:'0 0 20px rgba(200,0,0,0.8),2px 2px 0 rgba(0,0,0,0.9)',
          transform:'rotate(-45deg)',
          border:'4px solid #cc1111',padding:'6px 14px',
          borderRadius:4,background:'rgba(0,0,0,0.4)',
          whiteSpace:'nowrap'}}>SOLD!</div>
      </div>
    )
  }

  // ── PACK CARD in modal — shows foil/mythic prominently ──
  function PackCard({card,onPick,picked,picksLeft}){
    const id='pk_'+card.uid
    const hov=hovId===id
    const isPicked=picked.some(p=>p.uid===card.uid)
    const isPassive=card._isPack&&card.cost
    const isArtifact=card._isPack&&!card.cost&&!card.isMember
    const bc=card.isMember?'#e8a820':isPassive?'#9933cc':isArtifact?'#c87820':typeClr(card.type||'RIFF')
    const gl=card.isMember?'rgba(232,168,32,0.5)':typeGlow(card.type||'RIFF')
    const foilBg=card.foil?'linear-gradient(160deg,#201a06,#1a1408,#201a06)':'linear-gradient(180deg,#201408,#100804)'
    const mythicBg=card.mythic?'linear-gradient(160deg,#16082a,#0e0818,#16082a)':'linear-gradient(180deg,#201408,#100804)'
    const cardBg=card.mythic?mythicBg:card.foil?foilBg:'linear-gradient(180deg,#201408,#100804)'
    const shimmer=card.mythic?'holoShimmer 2s ease-in-out infinite':card.foil?'holoShimmer 3s ease-in-out infinite':rarityAnim(card.rarity)
    return(
      <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',position:'relative',paddingTop:24,opacity:isPicked?0.4:1,transition:'opacity 0.2s'}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        <div onClick={()=>!isPicked&&picksLeft>0&&onPick(card)}
          style={{flex:1,minHeight:420,display:'flex',flexDirection:'column',position:'relative',
            background:cardBg,
            border:hov&&!isPicked?'2px solid '+bc:isPicked?'2px solid #333':'1px solid '+bc+'55',
            borderRadius:8,overflow:'hidden',
            cursor:!isPicked&&picksLeft>0?'pointer':'default',
            transform:hov&&!isPicked&&picksLeft>0?'translateY(-8px) scale(1.04)':'none',
            transition:'transform 0.18s,border-color 0.15s,box-shadow 0.15s',
            boxShadow:hov&&!isPicked?'0 20px 56px rgba(0,0,0,0.95),0 0 32px '+gl:
              card.mythic?'0 0 20px rgba(150,0,255,0.4)':
              card.foil?'0 0 16px rgba(255,200,0,0.3)':
              '2px 4px 16px rgba(0,0,0,0.7)',
            animation:shimmer}}>
          <div style={{height:7,flexShrink:0,
            background:card.mythic?'linear-gradient(90deg,#6600cc,#cc00ff,#6600cc)':card.foil?'linear-gradient(90deg,#aa8800,#ffd700,#aa8800)':bc,
            boxShadow:'0 0 14px '+(card.mythic?'rgba(180,0,255,0.8)':card.foil?'rgba(255,200,0,0.8)':gl)}}/>
          {/* Foil / Mythic badges — big and prominent */}
          {card.mythic&&<div style={{position:'absolute',top:10,left:0,right:0,textAlign:'center',
            fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#cc44ff',letterSpacing:2,
            textShadow:'0 0 14px rgba(200,0,255,0.9)',
            background:'rgba(80,0,120,0.6)',padding:'4px 0'}}>⛧ MYTHIC ⛧</div>}
          {!card.mythic&&card.foil&&<div style={{position:'absolute',top:10,left:0,right:0,textAlign:'center',
            fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#ffd700',letterSpacing:2,
            textShadow:'0 0 14px rgba(255,200,0,0.9)',
            background:'rgba(80,60,0,0.6)',padding:'4px 0'}}>✨ FOIL ✨</div>}
          {card.rarity==='Rare'&&!card.foil&&!card.mythic&&<div style={{position:'absolute',top:10,left:10,padding:'2px 7px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#ffdd44',letterSpacing:1}}>RARE</div>}
          {/* ember cost */}
          {card.embers>0&&<div style={{position:'absolute',top:card.foil||card.mythic?38:8,right:10,width:32,height:32,borderRadius:'50%',
            background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',
            border:'2px solid #ff6600',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'#fff',
            boxShadow:'0 0 12px rgba(255,100,0,0.6)'}}>{card.embers}</div>}
          <div style={{flex:'0 0 35%',display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:60,marginTop:card.foil||card.mythic?28:0,background:'rgba(0,0,0,0.25)',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at center,'+bc+'20,transparent 70%)'}}/>
            {card.emoji}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:700,
            color:card.mythic?'#e8aaff':card.foil?'#ffd700':'#eedfc0',
            textAlign:'center',padding:'8px 8px 3px',lineHeight:1.2,
            borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:700,
            color:bc,textAlign:'center',padding:'3px 4px',letterSpacing:2,
            textTransform:'uppercase',flexShrink:0}}>
            {card.isMember?card.role:isPassive?'EFFECT PEDAL':isArtifact?'VINTAGE AMP':card.type}
            {card.rarity&&!card.isMember&&!isPassive&&!isArtifact?' · '+card.rarity:''}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,
            color:'#c8a878',textAlign:'center',padding:'8px 14px',
            lineHeight:1.45,flex:1}}>{card.id==='demotape'?(lastRiffPlayed?'📼 Will replay: '+lastRiffPlayed.name+' (free)':'📼 No riff recorded yet — play a RIFF card first'):card.effect||card.desc||''}</div>
          {card.isMember&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'8px 14px',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#666',letterSpacing:1}}>ATK</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#ee2222',fontWeight:900,lineHeight:1}}>{card.atk}</div>
            </div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#aaa',letterSpacing:1,textAlign:'center'}}>{card.keyword}</div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#666',letterSpacing:1}}>HP</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#33dd33',fontWeight:900,lineHeight:1}}>{card.hp}</div>
            </div>
          </div>}
          {isPicked&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',
            display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#55ee55',letterSpacing:2}}>✓ PICKED</span>
          </div>}
        </div>
        {!isPicked&&picksLeft>0&&<div style={{marginTop:8,fontFamily:"'MBScribblesFont',serif",fontSize:11,
          color:hov?'#55ee55':'#2a5a2a',textAlign:'center',letterSpacing:2,
          transition:'color 0.15s'}}>
          {hov?'► PICK THIS':'click to pick'}
        </div>}
      </div>
    )
  }

  // ── PACK OPENING MODAL ──
  function PackModal(){
    if(!openPackModal)return null
    const {pack,cards,picksLeft,picked}=openPackModal
    const remaining=picksLeft-picked.length
    const packAc={cassette:'#c87820',cdr:'#6688cc',vinyl:'#cc44ff',rarevinyl:'#ffdd44',cursed:'#cc2222',ritual:'#8844cc',hellforged:'#ff6600',garage:'#44aa44',touring:'#44aacc',demonic:'#cc44ff'}
    const ac=packAc[pack.id]||'#c87820'
    return(
      <div style={{position:'fixed',inset:0,zIndex:9600,
        background:'rgba(3,1,0,0.92)',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,
        backdropFilter:'blur(4px)'}}>
        {/* Header */}
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:ac,
            textShadow:'0 0 20px '+ac+'99',marginBottom:6}}>{pack.emoji} {pack.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#8a8060',letterSpacing:2}}>
            {remaining>0?'Pick '+remaining+' card'+(remaining>1?'s':''):remaining===0?'All picks made':''}
          </div>
        </div>
        {/* Cards row */}
        <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center',padding:'0 40px'}}>
          {cards.map((card,i)=>(
            <PackCard key={i} card={card} onPick={handlePickCard}
              picked={picked} picksLeft={remaining} />
          ))}
        </div>
        {/* Pass / Done button */}
        <div style={{display:'flex',gap:16}}>
          {remaining>0&&<button onClick={()=>setOpenPackModal(null)}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:700,letterSpacing:2,
              padding:'12px 32px',background:'rgba(40,25,8,0.6)',
              border:'1px solid rgba(120,80,20,0.4)',borderRadius:6,
              color:'#6a5020',cursor:'pointer',textTransform:'uppercase'}}>
            Pass — Take Nothing
          </button>}
          {remaining===0&&<button onClick={()=>setOpenPackModal(null)}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:2,
              padding:'14px 40px',background:'rgba(20,80,20,0.4)',
              border:'2px solid #44aa44',borderRadius:6,
              color:'#55ee55',cursor:'pointer',textTransform:'uppercase',
              boxShadow:'0 0 20px rgba(60,180,60,0.3)'}}>
            ✓ Confirm Picks
          </button>}
        </div>
      </div>
    )
  }

  // ── SALE CARD ──
  function SaleCard({card,idx}){
    const id='sc'+idx
    const hov=hovId===id
    const bc=card.isMember?'#e8a820':typeClr(card.type||'RIFF')
    const gl=card.isMember?'rgba(232,168,32,0.5)':typeGlow(card.type||'RIFF')
    const price=cardPrice(card)
    const canBuy=can(price)
    const bought=boughtIds.includes(card.uid||card.id)
    return(
      <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',position:'relative',paddingTop:24}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
          background:canBuy?'rgba(8,25,8,0.97)':'rgba(18,10,4,0.97)',
          border:'2px solid '+(canBuy?'#44bb44':'#4a3318'),borderRadius:20,
          padding:'4px 16px',zIndex:15,whiteSpace:'nowrap',
          fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,
          color:canBuy?'#55ee55':'#554428',
          boxShadow:canBuy?'0 2px 16px rgba(50,200,50,0.4)':'none'}}>🌿 {price}</div>
        <div onClick={()=>canBuy&&!bought&&buyCard(card)}
          style={{flex:1,minHeight:420,display:'flex',flexDirection:'column',position:'relative',
            background:'linear-gradient(180deg,#201408,#100804)',
            border:hov&&canBuy&&!bought?'2px solid '+bc:'1px solid '+bc+'55',
            borderRadius:8,overflow:'hidden',
            cursor:canBuy&&!bought?'pointer':'default',
            transform:hov&&canBuy&&!bought?'translateY(-6px) scale(1.02)':'none',
            transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
            boxShadow:hov&&canBuy&&!bought?'0 16px 48px rgba(0,0,0,0.95),0 0 28px '+gl:'2px 4px 16px rgba(0,0,0,0.7)',
            animation:bought?'':'throbShop 4.5s ease-in-out infinite'}}>
          {bought&&<SoldOverlay/>}
          <div style={{height:7,flexShrink:0,background:bc,boxShadow:'0 0 12px '+gl}}/>
          <div style={{position:'relative',height:32,flexShrink:0}}>
            {card.rarity==='Rare'&&<div style={{position:'absolute',top:6,left:10,padding:'2px 7px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#ffdd44',letterSpacing:1}}>RARE</div>}
            {card.rarity==='Uncommon'&&<div style={{position:'absolute',top:6,left:10,padding:'2px 7px',borderRadius:3,background:'rgba(100,150,200,0.18)',border:'1px solid rgba(150,200,255,0.28)',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#aaddff',letterSpacing:1}}>✦</div>}
            {card.foil&&<div style={{position:'absolute',top:6,right:10,padding:'2px 7px',borderRadius:3,background:'rgba(255,215,0,0.3)',border:'1px solid rgba(255,215,0,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#ffd700'}}>✨FOIL</div>}
            {card.mythic&&<div style={{position:'absolute',top:6,right:10,padding:'2px 7px',borderRadius:3,background:'rgba(120,0,180,0.4)',border:'1px solid rgba(180,0,255,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#cc44ff'}}>⛧MYTHIC</div>}
            {card.embers>0
              ?<div style={{position:'absolute',top:4,right:10,width:32,height:32,borderRadius:'50%',
                  background:canBuy?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'rgba(60,30,5,0.9)',
                  border:'2px solid '+(canBuy?'#ff6600':'#6a3a10'),
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,
                  color:canBuy?'#fff':'#8a5a30',
                  boxShadow:canBuy?'0 0 12px rgba(255,100,0,0.6)':'none'}}>{card.embers}</div>
              :<div style={{position:'absolute',top:7,right:10,padding:'2px 7px',borderRadius:3,background:'rgba(200,120,20,0.22)',border:'1px solid #c87820',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#e8a820',letterSpacing:1}}>FREE</div>}
          </div>
          <div style={{height:130,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:68,background:'rgba(0,0,0,0.3)',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at center,'+bc+'18,transparent 70%)'}}/>
            {card.emoji}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:700,
            color:'#eedfc0',textAlign:'center',padding:'10px 10px 4px',
            letterSpacing:0.3,lineHeight:1.2,
            borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:700,
            color:bc,textAlign:'center',padding:'4px 6px',
            letterSpacing:2,textTransform:'uppercase',flexShrink:0}}>
            {card.isMember?card.role:card.type}{card.rarity&&!card.isMember?' · '+card.rarity:''}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,
            color:'#c8a878',textAlign:'center',padding:'8px 14px',
            lineHeight:1.5,flex:1}}>{card.effect||card.desc||''}</div>
          {card.isMember&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#666',letterSpacing:1}}>ATK</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'#ee2222',fontWeight:900,lineHeight:1}}>{card.atk}</div>
            </div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:card.kwColor||'#aaa',letterSpacing:1,textAlign:'center'}}>{card.keyword}</div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#666',letterSpacing:1}}>HP</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'#33dd33',fontWeight:900,lineHeight:1}}>{card.hp}</div>
            </div>
          </div>}
        </div>
      </div>
    )
  }

  // ── LEFT COLUMN ITEM ──
  function LeftCard({item,price,label,accent,id,onBuy,sold}){
    const hov=hovId===id
    const canBuy=can(price)&&!sold
    const ac=accent||'#c87820'
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',paddingTop:20,position:'relative'}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        <div style={{position:'absolute',top:0,left:'50%',
          transform:'translateX(-50%)'+(hov&&canBuy?' scale(1.08)':''),
          background:canBuy?'rgba(8,25,8,0.97)':'rgba(18,10,4,0.97)',
          border:'2px solid '+(canBuy?'#44bb44':'#4a3318'),borderRadius:20,
          padding:'3px 14px',zIndex:15,whiteSpace:'nowrap',
          fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,
          color:canBuy?'#55ee55':'#554428',
          transition:'transform 0.12s'}}>🌿 {price}</div>
        <div onClick={()=>canBuy&&onBuy()}
          style={{flex:1,position:'relative',display:'flex',flexDirection:'column',
            background:'linear-gradient(180deg,#1c1408,#0e0a04)',
            border:hov&&canBuy?'2px solid '+ac:'1px solid '+ac+(canBuy?'88':'44'),
            borderTop:'4px solid '+ac,borderRadius:8,overflow:'hidden',
            cursor:canBuy?'pointer':'default',
            transform:hov&&canBuy?'translateY(-3px)':'none',
            transition:'transform 0.15s,border-color 0.15s,box-shadow 0.15s',
            boxShadow:hov&&canBuy?'0 10px 30px rgba(0,0,0,0.8),0 0 16px '+ac+'44':'2px 4px 14px rgba(0,0,0,0.6)',
            animation:'throbLeft 4.5s ease-in-out infinite'}}>
          {sold&&<SoldOverlay/>}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,letterSpacing:2,
            color:ac,textAlign:'center',padding:'6px 4px 0',
            textTransform:'uppercase',opacity:1,flexShrink:0}}>{label}</div>
          <div style={{flex:'0 0 36%',display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:72,filter:hov&&canBuy?'drop-shadow(0 0 12px '+ac+')':'none',
            transition:'filter 0.15s'}}>{item.emoji}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:700,
            color:'#ffe8a0',textAlign:'center',padding:'4px 8px 2px',
            lineHeight:1.2,flexShrink:0}}>{item.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,
            color:'#d0b880',textAlign:'center',padding:'6px 10px 8px',
            lineHeight:1.4,flex:1,overflow:'hidden'}}>{item.effect||item.desc||''}</div>
        </div>
      </div>
    )
  }

  // ── BOOSTER PACK ──
  function BoosterPack({pack,idx}){
    const id='bp'+idx
    const hov=hovId===id
    const canBuy=can(pack.cost)
    const packAc={cassette:'#c87820',cdr:'#6688cc',vinyl:'#cc44ff',rarevinyl:'#ffdd44',cursed:'#cc2222',ritual:'#8844cc',hellforged:'#ff6600',garage:'#44aa44',touring:'#44aacc',demonic:'#cc44ff'}
    const ac=packAc[pack.id]||'#c87820'
    return(
      <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',paddingTop:24,position:'relative'}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        <div style={{position:'absolute',top:0,left:'50%',
          transform:'translateX(-50%)'+(hov&&canBuy?' scale(1.08)':''),
          background:canBuy?'rgba(8,25,8,0.97)':'rgba(18,10,4,0.97)',
          border:'2px solid '+(canBuy?'#44bb44':'#4a3318'),borderRadius:20,
          padding:'4px 16px',zIndex:15,whiteSpace:'nowrap',
          fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,
          color:canBuy?'#55ee55':'#554428',
          transition:'transform 0.12s'}}>🌿 {pack.cost}</div>
        <div onClick={()=>handleOpenPack(pack)}
          style={{flex:1,minHeight:420,display:'flex',flexDirection:'column',alignItems:'center',
            background:'linear-gradient(160deg,#12100a 0%,#1e1a0e 40%,#120e08 100%)',
            border:hov&&canBuy?'2px solid '+ac:'1px solid '+ac+'66',
            borderRadius:10,overflow:'hidden',
            cursor:canBuy?'pointer':'default',
            transform:hov&&canBuy?'translateY(-6px) scale(1.02)':'none',
            transition:'transform 0.18s,box-shadow 0.15s,border-color 0.15s',
            boxShadow:hov&&canBuy?'0 16px 48px rgba(0,0,0,0.95),0 0 32px '+ac+'55':'2px 6px 20px rgba(0,0,0,0.7)',
            position:'relative',padding:'0 14px 18px',
            animation:'throbShop 4.5s ease-in-out infinite'}}>
          <div style={{width:'100%',height:8,flexShrink:0,
            background:'linear-gradient(90deg,'+ac+'44,'+ac+'ee,'+ac+'44)',
            boxShadow:'0 0 16px '+ac+'99'}}/>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:3,
            color:ac,textTransform:'uppercase',opacity:1,marginTop:8,flexShrink:0}}>VESTIBULE</div>
          <div style={{fontSize:72,flex:'0 0 38%',display:'flex',alignItems:'center',justifyContent:'center',
            filter:'drop-shadow(0 0 '+(hov?'20px':'8px')+' '+ac+(hov?'cc':'66')+')',
            transition:'filter 0.15s'}}>{pack.emoji}</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:40,
            color:ac,textAlign:'center',lineHeight:1.2,
            textShadow:'0 0 16px '+ac+'99',flexShrink:0,padding:'4px 4px'}}>{pack.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,
            color:'#c8a878',textAlign:'center',
            lineHeight:1.4,padding:'8px 10px 0',flex:1}}>{pack.desc}</div>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:6,
            background:'linear-gradient(90deg,'+ac+'44,'+ac+'ee,'+ac+'44)'}}/>
        </div>
      </div>
    )
  }

  return(
    <>
    <PackModal/>
    <div style={{position:'fixed',inset:0,zIndex:9500,
      background:'radial-gradient(ellipse at 50% 0%,rgba(28,18,4,1) 0%,rgba(6,4,1,1) 100%)',
      display:'flex',flexDirection:'column',gap:10,padding:12,
      fontFamily:"'MBScribblesFont',serif",overflow:'hidden',
      boxSizing:'border-box',height:'100vh'}}>

      {/* TOP BAR */}
      <div style={{flexShrink:0,height:72,display:'flex',gap:10,alignItems:'stretch'}}>
        <div style={{width:240,flexShrink:0}}/>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
          background:'rgba(8,4,1,0.85)',border:'1px solid rgba(180,20,20,0.3)',borderRadius:8,
          boxShadow:'0 0 30px rgba(160,10,10,0.2)'}}>
          <span style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:38,color:'#cc1111',letterSpacing:2,
            textShadow:'0 0 20px rgba(220,10,10,0.95),0 0 40px rgba(190,0,0,0.7),0 0 80px rgba(150,0,0,0.4)'}}>
            ⚰ The Black Market
          </span>
        </div>
        <button onClick={onLeave}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,15,15,0.5)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(120,8,8,0.3)'}}
          style={{width:130,flexShrink:0,
            fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:700,letterSpacing:2,
            background:'rgba(120,8,8,0.3)',border:'2px solid #991010',borderRadius:8,
            color:'#ee2222',cursor:'pointer',textTransform:'uppercase',
            transition:'background 0.15s',
            display:'flex',alignItems:'center',justifyContent:'center',
            flexDirection:'column',gap:4}}>
          <span style={{fontSize:20}}>⛧</span>
          <span>Next Fight</span>
        </button>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',gap:10,overflow:'hidden',minHeight:0}}>

        {/* LEFT COLUMN */}
        <div style={{width:240,flexShrink:0,display:'flex',flexDirection:'column',gap:14}}>
          <LeftCard item={recruitPack} price={recruitPack.cost}
            label="Band Recruitment" accent='#e8a820' id='rec' sold={leftBought.rec===true}
            onBuy={()=>can(recruitPack.cost)&&onSpend(recruitPack.cost,'recruit',recruitPack)&&setLeftBought(p=>({...p,rec:true}))} />
          {circleArtifact&&<LeftCard item={circleArtifact} price={circleArtifact.cost}
            label={'Vintage Amp · C'+circleNum} accent='#c87820' id='cart'
            sold={leftBought.cart}
            onBuy={()=>buyLeft('cart',circleArtifact.cost,'artifact',circleArtifact)} />}
          {circlePassive&&<LeftCard item={circlePassive} price={circlePassive.cost}
            label={'Effect Pedal · C'+circleNum} accent='#9933cc' id='cpas'
            sold={leftBought.cpas}
            onBuy={()=>buyLeft('cpas',circlePassive.cost,'passive',circlePassive)} />}
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>

          {/* CARDS ROW */}
          <div style={{flexShrink:0,display:'flex',gap:80,justifyContent:'center',alignItems:'flex-start',paddingTop:4}}>
            {shopCards.map((card,i)=><SaleCard key={i} card={card} idx={i}/>)}
            {/* Stash + Reroll — 100px gap between them, vertically centered */}
            <div style={{display:'flex',flexDirection:'column',gap:100,alignSelf:'center'}}>
              <div style={{width:130,height:130,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
                background:'rgba(5,15,5,0.92)',
                border:'2px solid rgba(50,140,50,0.6)',
                borderRadius:8}}>
                <span style={{fontSize:22}}>🌿</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:30,fontWeight:900,color:stashColor,lineHeight:1}}>{stash}</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#2a5a2a',letterSpacing:2,textTransform:'uppercase'}}>Stash</span>
              </div>
              <div style={{width:130,height:130,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
                background:'rgba(25,18,4,0.92)',
                border:'3px solid rgba(200,150,30,0.85)',
                borderRadius:8,cursor:'pointer',
                boxShadow:'0 0 16px rgba(180,130,20,0.3),inset 0 0 20px rgba(100,70,0,0.1)',
                animation:'rerollWiggle 3s ease-in-out infinite'}}
                onClick={onReroll}
                onMouseEnter={e=>{e.currentTarget.style.animation='none';e.currentTarget.style.background='rgba(55,40,8,0.95)'}}
                onMouseLeave={e=>{e.currentTarget.style.animation='rerollWiggle 3s ease-in-out infinite';e.currentTarget.style.background='rgba(25,18,4,0.92)'}}>
                <span style={{fontSize:22}}>🔄</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#c8a030',letterSpacing:1,textTransform:'uppercase'}}>Re-Roll</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:'#55ee55'}}>🌿 {rerollCost}</span>
              </div>
            </div>
          </div>

          {/* GAP */}
          <div style={{height:20,flexShrink:0}}/>

          {/* PACKS + PAWN ROW */}
          <div style={{flexShrink:0,display:'flex',gap:80,justifyContent:'center',alignItems:'center'}}>
            {(boosterPacks||[]).slice(0,2).map((pack,i)=><BoosterPack key={i} pack={pack} idx={i}/>)}
            <div style={{width:420,height:420,flexShrink:0,
              background:'linear-gradient(160deg,#0e0a16,#080510)',
              border:'2px solid rgba(150,70,220,0.65)',borderRadius:10,
              padding:'14px 16px',
              display:'flex',flexDirection:'column',
              justifyContent:'space-between',
              boxShadow:'0 0 30px rgba(130,50,200,0.2)'}}>
              <div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:30,
                  color:'#9944dd',textAlign:'center',marginBottom:14,
                  textShadow:'0 0 18px rgba(160,80,240,0.8)'}}>🪙 Pawn Shop</div>
                <div style={{fontSize:44,textAlign:'center',margin:'6px 0'}}>🏧</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,
                  color:'#cc88ff',letterSpacing:1,lineHeight:2.2,textAlign:'center'}}>
                  Common 1🌿 · Uncommon 2🌿 · Rare 4🌿<br/>
                  Foil +3🌿 · Mythic +8🌿 · Member 5🌿<br/>
                  Artifact = 50% of buy price back
                </div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,
                  color:'#cc88ff',textAlign:'center',marginTop:8,letterSpacing:1}}>
                  Max 2 sales per visit · Cannot sell last 2 members
                </div>
              </div>
              <button
                onMouseEnter={e=>e.currentTarget.style.background='rgba(130,60,200,0.45)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(80,30,140,0.3)'}
                onClick={()=>{if(pawnSalesLeft>0)setPawnOpen(true)}}
                style={{width:'100%',fontFamily:"'MBScribblesFont',serif",
                  fontSize:14,fontWeight:900,letterSpacing:1,
                  padding:'16px',background:'rgba(80,30,140,0.3)',
                  border:'2px solid rgba(160,80,240,0.65)',borderRadius:6,
                  color:pawnSalesLeft>0?'#cc88ff':'#4a2a6a',cursor:pawnSalesLeft>0?'pointer':'not-allowed',textTransform:'uppercase',
                  transition:'background 0.15s',opacity:pawnSalesLeft>0?1:0.5,
                  boxShadow:pawnSalesLeft>0?'0 0 18px rgba(140,60,220,0.3)':'none'}}>
                💰 Open Pawn Shop ({pawnSalesLeft} left)
              </button>
              {pawnOpen&&<PawnShopModal
                stage={stage||[]} deck={deck||[]} discard={discardPile||[]}
                stash={stash} salesLeft={pawnSalesLeft}
                onSellMember={(m,i)=>{
                  onPawnSellMember&&onPawnSellMember(m,i)
                  setPawnSalesLeft(p=>Math.max(0,p-1))
                }}
                onSellCard={(c)=>{
                  onPawnSellCard&&onPawnSellCard(c)
                  setPawnSalesLeft(p=>Math.max(0,p-1))
                }}
                onClose={()=>setPawnOpen(false)}
              />}
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  )
}

function StageSlot({member,isAttacking,isDiceTarget,onDrop,onDragOver,onDragStart,innerRef,bondColor}){
  const [over,setOver]=useState(false)
  const [showTip,setShowTip]=useState(false)
  if(!member){
    return <div ref={innerRef} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}}
      style={{width:230,height:345,border:`1px dashed ${over?'rgba(232,168,32,0.6)':'rgba(160,100,30,0.22)'}`,borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,background:over?'rgba(100,70,15,0.18)':'rgba(28,16,4,0.14)',transition:'all 0.2s'}}>
      <div style={{fontSize:28,opacity:.1}}>⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'rgba(160,100,30,0.28)',fontStyle:'italic'}}>empty</div>
    </div>
  }
  const st=member.tooStoned
  const buffCount=member.buffCount||0
  return(
    <div ref={innerRef} draggable onDragStart={onDragStart} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}} onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}
      style={{width:230,height:345,display:'flex',flexDirection:'column',background:st?'linear-gradient(180deg,#1a1a1a,#0a0a0a)':'linear-gradient(180deg,#1c1208,#0a0704)',
        border:isDiceTarget?'3px solid #e8a820':isAttacking?'2px solid #ff3300':bondColor?'2px solid '+bondColor:over?'2px solid #e8a820':st?'1px solid #333':'2px solid rgba(190,120,25,0.85)',
        borderRadius:6,
        boxShadow:isDiceTarget?'0 0 30px rgba(232,168,32,0.7)':isAttacking?'0 0 40px rgba(255,50,0,0.8)':bondColor&&!st?'0 0 20px '+bondColor+',0 6px 24px rgba(0,0,0,0.85)':'0 6px 24px rgba(0,0,0,0.85)',
        transform:st?'rotate(15deg) scale(0.95)':'none',
        opacity:st?0.5:1,
        animation:(!st&&!isAttacking&&!isDiceTarget)?'throb 3s ease-in-out infinite':'none',
        transition:'border 0.2s, box-shadow 0.2s, opacity 0.3s, transform 0.3s',
        cursor:'grab',position:'relative'}}>
      {/* Keyword tooltip */}
      {showTip&&member&&KEYWORD_DESC[member.keyword]&&<div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',background:'rgba(8,4,2,0.97)',border:'1px solid rgba(160,100,25,0.6)',borderRadius:6,padding:'10px 14px',zIndex:9999,pointerEvents:'none',minWidth:200,maxWidth:260,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#e8a820',letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>{member.keyword}</div><div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'#c8b080',lineHeight:1.5,fontStyle:'italic'}}>{KEYWORD_DESC[member.keyword]}</div></div>}
      {buffCount>0&&<div style={{position:'absolute',top:6,left:6,background:buffCount>=3?'#aa1111':'#9933cc',borderRadius:10,padding:'1px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#fff',zIndex:10,boxShadow:'0 0 8px rgba(0,0,0,0.6)'}}>+{buffCount}</div>}
      {isDiceTarget&&<div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:20}}>🎯</div>}
      <div style={{height:5,borderRadius:'6px 6px 0 0',background:st?'#333':'linear-gradient(90deg,#dd2222,#ff7700)',boxShadow:st?'none':'0 0 14px rgba(220,50,0,0.5)'}}/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,background:'rgba(0,0,0,0.3)',position:'relative',minHeight:100}}>
        {member.emoji}
        {st&&<div style={{position:'absolute',top:4,right:4,fontSize:22}}>💨</div>}
        {isAttacking&&<div style={{position:'absolute',inset:0,background:'rgba(255,50,0,0.12)',animation:'pulse 0.4s ease infinite alternate'}}/>}
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:30,color:st?'#555':'#e8d8a0',textAlign:'center',padding:'10px 4px 3px',lineHeight:1}}>{member.name}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,letterSpacing:1.5,color:st?'#444':'#8a7a50',textAlign:'center',padding:'4px 4px 8px',textTransform:'uppercase'}}>{member.role}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'#555':'#ee2222',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>ATK</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,lineHeight:1,color:st?'#555':'#ee2222',textShadow:st?'none':'0 0 12px rgba(200,0,0,0.6)'}}>{member.atk}</div>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'#555':'#e8a820',fontWeight:700,letterSpacing:1,textAlign:'center'}}>{member.keyword}</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'#555':member.hp<=2?'#ff4400':'#33dd33',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>HP</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,lineHeight:1,color:st?'#555':member.hp<=2?'#ff4400':'#33dd33',textShadow:st?'none':'0 0 12px rgba(0,190,0,0.5)'}}>{member.hp}</div>
        </div>
      </div>
      <div style={{height:5,background:'rgba(0,0,0,0.5)',borderRadius:'0 0 6px 6px'}}><div style={{height:'100%',borderRadius:'0 0 6px 6px',background:st?'#333':'linear-gradient(90deg,#003800,#33dd33)',width:`${(member.hp/member.maxHp)*100}%`,transition:'width 0.4s ease'}}/></div>
    </div>
  )
}

function HandCard({card,index,total,isHovered,isSelected,anyHovered,canAfford,onHover,onLeave,onClick,onDragStart,onDragEnd,isDragging,isShopBought,isDragOver,onHandDragOver,onHandDrop,isUsed,lastRiffPlayed}){
  const spread=Math.min(4,20/total),mid=(total-1)/2
  const rot=(index-mid)*spread,yOff=Math.abs(index-mid)*2
  const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
  const glow=card.type==='CORRUPT'?'rgba(170,0,0,0.5)':card.type==='UTILITY'?'rgba(30,160,50,0.5)':card.type==='EMBER'?'rgba(200,120,20,0.5)':'rgba(140,40,200,0.5)'
  const unaffordable=!canAfford&&card.embers>0
  const shimmerAnim=card.rarity==='Rare'?'holoShimmer 3s ease-in-out infinite':card.rarity==='Uncommon'?'uncommonGlow 2s ease-in-out infinite':''
  return(
    <div draggable
      onDragStart={e=>{e.dataTransfer.effectAllowed='move';onDragStart(index)}}
      onDragEnd={onDragEnd}
      onDragOver={e=>{e.preventDefault();onHandDragOver&&onHandDragOver()}}
      onDrop={e=>{e.stopPropagation();onHandDrop&&onHandDrop()}}
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      style={{width:190,height:295,flexShrink:0,position:'relative',display:'flex',flexDirection:'column',
        background:isSelected?'linear-gradient(180deg,#2a1a0a,#160e05)':'linear-gradient(180deg,#201408,#100804)',
        border:isSelected?`2px solid #cc0000`:isHovered?`2px solid ${bc}`:`1px solid ${bc}${isShopBought?'cc':'55'}`,
        borderRadius:7,cursor:'grab',position:'relative',
        transformOrigin:'bottom center',
        transform:isDragging?'scale(0.85) rotate(5deg)':isHovered?'translateY(-52px) scale(1.18) rotate(0deg)':isSelected?`rotate(${rot}deg) translateY(-50px)`:`rotate(${rot}deg) translateY(${yOff}px)`,
        transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
        zIndex:isDragging?0:isHovered?9999:isSelected?50:Math.max(1,Math.round(10-Math.abs(index-mid))),
        boxShadow:isSelected?'0 0 0 2px #cc0000,0 0 22px rgba(200,0,0,0.75),0 0 45px rgba(180,0,0,0.4)':isShopBought?`0 0 12px ${bc}44`:isHovered?`0 36px 72px rgba(0,0,0,0.95),0 0 36px ${glow}`:'2px 4px 16px rgba(0,0,0,0.75)',
        opacity:isDragging?0.4:1,
        animation:shimmerAnim,
        margin:'0 -26px',userSelect:'none',willChange:isHovered?'transform':'auto'}}>
      <div style={{height:6,flexShrink:0,borderRadius:'7px 7px 0 0',background:bc,boxShadow:`0 0 14px ${glow}`}}/>
      {isUsed&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.85)',border:'2px solid #888',borderRadius:6,padding:'6px 14px',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#888',letterSpacing:4,zIndex:20,pointerEvents:'none'}}>USED</div>}
      {card.embers>0?(
        <div style={{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',background:canAfford?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'rgba(40,20,5,0.9)',border:`2px solid ${canAfford?'#ff6600':'#4a2a10'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:canAfford?'#fff':'#5a3a10',boxShadow:canAfford?'0 0 10px rgba(255,100,0,0.6)':'none'}}>{card.embers}</div>
      ):(
        <div style={{position:'absolute',top:8,right:8,padding:'2px 5px',borderRadius:3,background:'rgba(200,120,20,0.22)',border:'1px solid #c87820',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:700,color:'#e8a820',letterSpacing:1}}>FREE</div>
      )}
      {card.foil&&<div style={{position:'absolute',top:8,left:28,padding:'2px 5px',borderRadius:3,background:'rgba(255,215,0,0.3)',border:'1px solid rgba(255,215,0,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#ffd700',letterSpacing:1}}>✨FOIL</div>}
      {card.mythic&&<div style={{position:'absolute',top:8,left:28,padding:'2px 5px',borderRadius:3,background:'rgba(120,0,180,0.4)',border:'1px solid rgba(180,0,255,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#cc44ff',letterSpacing:1}}>⛧MYTHIC</div>}
      {card.rarity==='Rare'&&<div style={{position:'absolute',top:8,left:8,padding:'2px 5px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#ffdd44',letterSpacing:1}}>RARE</div>}
      {card.rarity==='Uncommon'&&<div style={{position:'absolute',top:8,left:8,padding:'2px 5px',borderRadius:3,background:'rgba(100,150,200,0.18)',border:'1px solid rgba(150,200,255,0.28)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#aaddff',letterSpacing:1}}>✦</div>}
      <div style={{height:115,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:54,background:'rgba(0,0,0,0.35)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at center,${bc}18,transparent 70%)`}}/>
        {card.emoji}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,color:'#eedfc0',textAlign:'center',padding:'9px 6px 3px',letterSpacing:.4,lineHeight:1.2,borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:bc,textAlign:'center',padding:'3px 4px',letterSpacing:1.8,textTransform:'uppercase',flexShrink:0,textShadow:'0 0 8px '+bc+'88'}}>{card.type}</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'#b09870',textAlign:'center',padding:'4px 8px 8px',lineHeight:1.4,fontStyle:'italic',flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>{card.effect}</div>
    </div>
  )
}

function BossSection({enemy,currentHp,isWiggling,innerRef,debuff,chromaStr,dblRoll}){
  const pct=Math.max(0,(currentHp/enemy.maxHp)*100),isLow=currentHp<enemy.maxHp*.35
  return(
    <div ref={innerRef} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,animation:isWiggling?'wiggle 0.45s ease':'none',width:'100%'}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'#cc3300',textTransform:'uppercase',fontWeight:900,textShadow:'0 0 10px rgba(200,50,0,0.4)'}}>{enemy.circle} · {enemy.subtitle}</div>
      <div style={{display:'flex',alignItems:'center',gap:16,width:'100%'}}>
        <div style={{width:130,height:130,flexShrink:0,background:'radial-gradient(circle at 40% 35%,#3a0000,#080000)',border:`3px solid ${isLow?'#ff2222':'rgba(140,40,15,0.85)'}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,boxShadow:isLow?'0 0 40px rgba(220,0,0,0.7),0 0 80px rgba(150,0,0,0.3)':'0 0 20px rgba(120,0,0,0.5),0 0 40px rgba(80,0,0,0.2)',position:'relative',overflow:'hidden',transition:'all 0.5s'}}>
          {enemy.emoji}
          {isLow&&<div style={{position:'absolute',inset:0,background:'rgba(120,0,0,0.2)',animation:'pulse 1.2s ease infinite alternate'}}/>}
          {debuff>0&&<div style={{position:'absolute',bottom:4,right:4,background:'rgba(0,80,160,0.9)',border:'1px solid #4488ff',borderRadius:4,padding:'2px 5px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#88aaff'}}>-{debuff}dmg</div>}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:58,color:'#120804',lineHeight:1,textShadow:chromaStr>0?`-${chromaStr}px 0 rgba(255,0,0,0.5), ${chromaStr}px 0 rgba(0,80,255,0.4), 1px 1px 0 rgba(0,0,0,0.5)`:'1px 1px 0 rgba(0,0,0,0.5)'}}>{enemy.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:26,fontWeight:900,color:isLow?'#ee2222':'#6a3010',textAlign:'right',lineHeight:1,flexShrink:0,marginLeft:12}}>{Math.max(0,currentHp)}<span style={{fontSize:14,color:'#4a2a0a',fontWeight:400}}> / {enemy.maxHp}</span></div>
            </div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:37,color:'#1a1008',fontStyle:'italic',opacity:1,lineHeight:1.4,fontWeight:700}}>{enemy.passive}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#1a1008',marginTop:6,letterSpacing:1,fontWeight:700}}>Base damage: {enemy.baseDmg} ± 2 per Strike</div>
        </div>
      </div>
      <div style={{width:'70%',margin:'0 auto'}}>
        
        <div style={{width:'100%',height:28,background:'rgba(50,25,8,0.75)',border:'1px solid rgba(100,55,15,0.6)',borderRadius:2,overflow:'hidden',boxShadow:'inset 0 2px 6px rgba(0,0,0,0.7)',position:'relative'}}>
          {[25,50,75].map(pp=><div key={pp} style={{position:'absolute',top:0,bottom:0,left:`${pp}%`,width:1,background:'rgba(0,0,0,0.35)',zIndex:2}}/>)}
          <div style={{height:'100%',background:isLow?'linear-gradient(90deg,#660000,#cc0000,#ff2200)':'linear-gradient(90deg,#7a0000,#aa1100,#cc2200)',width:`${pct}%`,transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'rgba(240,220,180,0.95)',letterSpacing:2,textShadow:'0 1px 3px rgba(0,0,0,0.99)'}}>{Math.max(0,currentHp)} HP REMAINING</div>
        </div>
      </div>
    </div>
  )
}

function DeckPile({count,label}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{position:'relative',width:90,height:112}}>
        {[2,1,0].map(i=><div key={i} style={{position:'absolute',width:80,height:100,background:i===0?'linear-gradient(135deg,#1e1408,#0a0804)':`rgba(15,10,4,${.7-i*.2})`,border:'1px solid rgba(160,110,35,0.55)',borderRadius:4,top:i*3,left:i*3}}>
          {i===0&&<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,opacity:.2,color:'#c8a060'}}>⛧</div>}
        </div>)}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:26,fontWeight:900,color:'#c8a060'}}>{count}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,letterSpacing:2,color:'#6a5a30',textTransform:'uppercase'}}>{label}</div>
    </div>
  )
}

function PhaseDots({left,total,color,wide}){
  const sz=wide?17:13;const start=total-left;return <div style={{display:'flex',gap:wide?4:4}}>{Array.from({length:total}).map((_,i)=>{const filled=i>=start;return <div key={i} style={{width:sz,height:sz,borderRadius:4,background:filled?color:'rgba(40,20,8,0.6)',border:`1px solid ${filled?color:'rgba(80,50,20,0.3)'}`,boxShadow:filled?`0 0 9px ${color}99`:'none',transition:'all 0.25s'}}/>})}</div>
}

function EndScreen({won,cause,stats,seed,onReset,streakWins,streakLosses,totalRuns,isDailyRun,onDailyChallenge}){
  const isStoned=cause==='stoned'
  const isVictory=cause==='victory'
  const circleReached=Math.floor((stats.fightsSurvived)/3)+1
  const streakMsg=streakWins>1?'🔥 '+streakWins+' WIN STREAK!':streakLosses>2?'💀 '+streakLosses+' losses in a row...':''
  return(
    <div style={{position:'fixed',inset:0,zIndex:9800,background:isStoned?'rgba(2,0,0,0.97)':isVictory?'rgba(4,3,1,0.96)':'rgba(3,1,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,animation:'fadeIn 0.8s ease',overflow:'auto',padding:'24px 0'}}>
      {isStoned&&<div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,180,0,0.04) 2px,rgba(0,180,0,0.04) 4px)',animation:'interlaceFlicker 0.1s steps(1) infinite',pointerEvents:'none',zIndex:0}}/>}
      {isStoned&&<div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 20%,rgba(0,80,0,0.4) 100%)',pointerEvents:'none',zIndex:0,animation:'bgPulse 2s ease-in-out infinite'}}/>}
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:0}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:280,color:'rgba(180,180,180,0.06)',userSelect:'none',lineHeight:1}}>Vestibule</div>
      </div>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
        {/* Title */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:isStoned?110:90,color:isStoned?'#cc1111':isVictory?'#d8c9a8':'#7a0000',textShadow:isStoned?'-4px 0 rgba(255,0,0,0.9),4px 0 rgba(0,255,80,0.7),0 0 60px rgba(180,0,0,0.8),3px 3px 0 #000':isVictory?'0 0 60px rgba(210,160,20,0.5),3px 3px 0 #000':'0 0 60px rgba(100,0,0,0.6),3px 3px 0 #000'}}>{isStoned?'Stoned to the Bone':isVictory?'⛧ Victory ⛧':'Fallen'}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:isStoned?'rgba(200,80,80,0.9)':'#a09060',fontStyle:'italic',textAlign:'center'}}>{isStoned?'The band ran out of herb.':isVictory?'All 9 circles conquered. Lucifer has fallen.':'The Vestibule claims another soul.'}</div>

        {/* Streak banner */}
        {streakMsg&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:streakWins>1?'#ff6600':'#aa4444',letterSpacing:3,padding:'6px 24px',background:'rgba(0,0,0,0.5)',border:`1px solid ${streakWins>1?'#ff6600':'#aa4444'}`,borderRadius:4}}>{streakMsg}</div>}

        {/* Stats grid */}
        <div style={{background:'rgba(20,12,4,0.85)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:8,padding:'20px 32px',minWidth:520}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:4,color:'#8a6020',textTransform:'uppercase',textAlign:'center',marginBottom:14}}>Run Statistics</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 32px'}}>
            {[
              ['Circle Reached', isVictory?'ALL 9 ⛧':circleReached+' / 9'],
              ['Fights Survived', stats.fightsSurvived],
              ['Strikes Thrown', stats.strikesThrown],
              ['Cards Played', stats.cardsPlayed],
              ['Total Damage', stats.totalDamage.toLocaleString()],
              ['Highest Strike', stats.highestStrike.toLocaleString()],
              ['Too Stoned Events', stats.tooStonedCount],
              ['Max Corruption', stats.maxCorruption+'%'],
              ['Stash Earned', stats.stashEarned+' 🌿'],
              ['Total Runs', totalRuns||1],
            ].map(function(row){
              return(
                <div key={row[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(80,50,10,0.15)'}}>
                  <span style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'#7a6040',fontStyle:'italic'}}>{row[0]}</span>
                  <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,fontWeight:900,color:isVictory&&row[0]==='Circle Reached'?'#ffdd44':'#c8a060'}}>{row[1]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Seed + daily */}
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#5a4a20',letterSpacing:2}}>SEED: {seed.toString(16).toUpperCase()}</div>
          {isDailyRun&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#e8a820',letterSpacing:2,padding:'3px 12px',border:'1px solid #e8a820',borderRadius:3}}>🌍 DAILY CHALLENGE</div>}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#4a3a18',cursor:'pointer',letterSpacing:1}}
            onClick={()=>navigator.clipboard&&navigator.clipboard.writeText(seed.toString(16).toUpperCase())}>📋 Copy Seed</div>
        </div>

        {/* Buttons */}
        <div style={{display:'flex',gap:16,marginTop:4}}>
          <button onClick={onReset}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:isVictory?'#ee2222':'#b09858',background:isVictory?'rgba(100,0,0,0.22)':'transparent',border:isVictory?'2px solid #7a0000':'1px solid rgba(90,60,20,0.5)',borderRadius:3,padding:'12px 40px',cursor:'pointer',textTransform:'uppercase'}}>
            {isVictory?'⛧ Play Again':'↺ Try Again'}
          </button>
          <button onClick={()=>onDailyChallenge&&onDailyChallenge()}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,color:'#e8a820',background:'rgba(50,35,5,0.4)',border:'1px solid #c87820',borderRadius:3,padding:'12px 28px',cursor:'pointer',textTransform:'uppercase'}}>
            🌍 Daily Challenge
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────


function DemonicConflictScreen({conflict,onChoice}){
  const {incoming,existing}=conflict
  const kwc={'FRENZIED':'#ee2222','DOUBLE TIME':'#ff8800','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}
  function MemberCard({m,onPick,label}){
    const bc=kwc[m.keyword]||'#e8a820'
    return(
      <div onClick={onPick} style={{width:260,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'3px solid #e8a820',borderRadius:8,overflow:'hidden',cursor:'pointer',transition:'all 0.2s',boxShadow:'0 0 40px rgba(232,168,32,0.5)'}}
        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 0 60px rgba(232,168,32,0.8)'}}
        onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 40px rgba(232,168,32,0.5)'}}>
        <div style={{background:'linear-gradient(90deg,#e8a820,#ffcc44)',padding:'6px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,letterSpacing:3,color:'#0a0704'}}>{label}</div>
        <div style={{fontSize:64,textAlign:'center',padding:'20px 0',background:'rgba(0,0,0,0.4)'}}>{m.emoji}</div>
        <div style={{padding:'0 16px 16px'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:'#e8d090',textAlign:'center',marginBottom:4}}>{m.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,letterSpacing:2,color:'#8a7040',textAlign:'center',marginBottom:10}}>{m.role}</div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px',background:'rgba(0,0,0,0.5)',borderRadius:4,marginBottom:8}}>
            <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#ee2222',fontWeight:900}}>ATK</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:'#ee2222'}}>{m.atk}</div></div>
            <div style={{textAlign:'center',alignSelf:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:bc,fontWeight:700}}>{m.keyword}</div></div>
            <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#33dd33',fontWeight:900}}>HP</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:'#33dd33'}}>{m.hp}</div></div>
          </div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'#8a7040',textAlign:'center',fontStyle:'italic'}}>{m.desc}</div>
          {m.roleBondBonus>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#e8a820',textAlign:'center',marginTop:8}}>🔗 +{m.roleBondBonus} ATK Bond</div>}
        </div>
        <div style={{background:'rgba(232,168,32,0.15)',padding:'12px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:'#e8a820',letterSpacing:2}}>KEEP THIS ONE</div>
      </div>
    )
  }
  return(
    <div style={{position:'fixed',inset:0,zIndex:9900,background:'rgba(2,1,0,0.98)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:32,padding:'40px 20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:'#cc1111',textShadow:'0 0 40px rgba(200,0,0,0.9),0 0 80px rgba(150,0,0,0.6)',textAlign:'center'}}>Only One May Remain</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'#a09060',fontStyle:'italic',textAlign:'center'}}>Two demonic powers cannot share the same stage.<br/>Choose who stays — the other is gone forever.</div>
      <div style={{display:'flex',gap:60,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
        <MemberCard m={existing} onPick={()=>onChoice(existing,incoming)} label="CURRENTLY ON STAGE"/>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#660000',textShadow:'0 0 20px rgba(200,0,0,0.8)'}}>VS</div>
        <MemberCard m={incoming} onPick={()=>onChoice(incoming,existing)} label="NEWLY ARRIVED"/>
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#4a3020',letterSpacing:2,textAlign:'center'}}>THE UNCHOSEN WILL BE PERMANENTLY REMOVED</div>
    </div>
  )
}

function RecruitScreen({candidates,stage,onPick,onPass}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:9600,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:'40px 20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'#d0b060',textShadow:'0 0 30px rgba(200,150,20,0.4)'}}>Recruit a Member</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'#a09060',fontStyle:'italic'}}>Choose one musician to join your band — or pass</div>
      <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center',maxWidth:1000}}>
        {candidates.map(m=>{
          const alreadyOn=stage.some(s=>s&&s.id===m.id)
          const hasDblTime=stage.some(s=>s&&s.keyword==='DOUBLE TIME')
          const isDblTime=m.keyword==='DOUBLE TIME'
          const emptySlot=stage.findIndex(s=>!s)
          // Allow duplicates EXCEPT second DOUBLE TIME (two drummers = broken multiplier)
          const canAdd=!alreadyOn&&emptySlot!==-1&&!(isDblTime&&hasDblTime)
          const tier=m.demonic?'DEMONIC':m.mythic?'MYTHIC':m.foil?'FOIL':null
          const bondTarget=stage.find(s=>s&&s.role===m.role&&!s.tooStoned)
          const bondBonus=m.demonic?3:m.mythic?2:m.foil?1:0
          return(
            <div key={m.id} onClick={()=>canAdd&&onPick(m)}
              style={{width:200,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'1px solid rgba(160,100,25,0.5)',borderRadius:7,overflow:'hidden',cursor:canAdd?'pointer':'not-allowed',opacity:canAdd?1:0.4,transition:'all 0.2s',transform:canAdd?'none':'none'}}
              onMouseEnter={e=>{if(canAdd)e.currentTarget.style.transform='translateY(-6px) scale(1.03)';e.currentTarget.style.boxShadow='0 0 30px rgba(232,168,32,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
              <div style={{height:4,background:m.demonic?'linear-gradient(90deg,#e8a820,#ffd700,#e8a820)':m.mythic?'linear-gradient(90deg,#cc44ff,#ff88ff,#cc44ff)':m.foil?'linear-gradient(90deg,#88ccff,#ffffff,#88ccff)':'linear-gradient(90deg,#e8a820,#ffcc44)'}}/>
              {tier&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:3,textAlign:'center',padding:'4px 0',background:m.demonic?'rgba(200,160,0,0.25)':m.mythic?'rgba(180,0,255,0.2)':'rgba(100,180,255,0.15)',color:m.demonic?'#ffd700':m.mythic?'#dd88ff':'#88ccff',textShadow:m.demonic?'0 0 12px rgba(255,200,0,0.9)':m.mythic?'0 0 12px rgba(200,0,255,0.9)':'0 0 12px rgba(100,180,255,0.9)'}}>{m.demonic?'⛧ DEMONIC ⛧':m.mythic?'✦ MYTHIC ✦':'✨ FOIL ✨'} +{m.demonic?5:m.mythic?3:1} ATK/HP</div>}
              {tier&&bondTarget&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,letterSpacing:1,textAlign:'center',padding:'3px 0',background:'rgba(232,168,32,0.15)',color:'#e8a820'}}>⚡ BONDS WITH {bondTarget.name.toUpperCase()} +{bondBonus} ATK</div>}
              <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,background:'rgba(0,0,0,0.35)'}}>{m.emoji}</div>
              <div style={{padding:'8px 12px 12px'}}>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,color:'#e8d090',textAlign:'center',marginBottom:2}}>{m.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,letterSpacing:2,color:'#8a7040',textAlign:'center',textTransform:'uppercase',marginBottom:8}}>{m.role}</div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'rgba(0,0,0,0.5)',borderRadius:4,marginBottom:6}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#ee2222',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'#ee2222',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,alignSelf:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#e8a820',fontWeight:700}}>{m.keyword}</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#33dd33',textTransform:'uppercase',fontWeight:900}}>HP</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'#33dd33',lineHeight:1}}>{m.hp}</div>
                  </div>
                </div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'#8a7040',textAlign:'center',fontStyle:'italic',lineHeight:1.3}}>{m.desc}</div>
                {alreadyOn&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#aa6600',textAlign:'center',marginTop:6,letterSpacing:1}}>ALREADY ON STAGE</div>}
                {!alreadyOn&&isDblTime&&hasDblTime&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#ff8800',textAlign:'center',marginTop:6,letterSpacing:1}}>ONLY ONE DRUMMER</div>}
                {!alreadyOn&&emptySlot===-1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#aa2200',textAlign:'center',marginTop:6,letterSpacing:1}}>STAGE FULL</div>}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onPass}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'12px 40px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:3,color:'#7a5020',cursor:'pointer',transition:'all 0.2s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#7a5020'}}>
        Pass — No Recruitment
      </button>
    </div>
  )
}


function RemasterModal({cards,onConfirm,onClose}){
  const [toDelete,setToDelete]=useState([])
  const [toCopy,setToCopy]=useState(null)
  const toggleDelete=(uid)=>{
    if(toDelete.includes(uid)){setToDelete(p=>p.filter(x=>x!==uid))}
    else if(toDelete.length<2){setToDelete(p=>[...p,uid])}
  }
  const ready=toDelete.length===2&&toCopy!==null
  return(
    <div style={{position:'fixed',inset:0,zIndex:9700,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:'20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'#d0b060'}}>The Remaster</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:15,color:'#a09060',fontStyle:'italic',textAlign:'center'}}>
        Click <span style={{color:'#ee2222',fontWeight:900}}>2 cards to delete</span> · Click <span style={{color:'#22aa44',fontWeight:900}}>1 card to copy</span>
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',maxWidth:1100,overflowY:'auto',maxHeight:'55vh'}}>
        {cards.map((card)=>{
          const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
          const isDel=toDelete.includes(card.uid)
          const isCopy=toCopy===card.uid
          const canDel=!isCopy&&(isDel||toDelete.length<2)
          const canCopy=!isDel
          return(
            <div key={card.uid} style={{width:140,background:'linear-gradient(180deg,#201408,#100804)',border:isDel?'2px solid #ee2222':isCopy?'2px solid #22aa44':'1px solid '+bc+'55',borderRadius:7,overflow:'hidden',opacity:(isDel||isCopy||(!isDel&&!isCopy))?1:0.5,transition:'all 0.2s',flexShrink:0}}>
              <div style={{height:4,background:bc}}/>
              <div style={{height:70,display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,background:'rgba(0,0,0,0.35)'}}>{card.emoji}</div>
              <div style={{padding:'6px 8px 4px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:2}}>{card.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:7,color:bc,textAlign:'center',letterSpacing:2,textTransform:'uppercase'}}>{card.type}</div>
              </div>
              <div style={{display:'flex',gap:4,padding:'4px 6px 8px'}}>
                <button onClick={()=>canDel&&toggleDelete(card.uid)}
                  style={{flex:1,padding:'4px 0',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,background:isDel?'rgba(180,0,0,0.4)':'rgba(60,20,10,0.4)',border:isDel?'1px solid #ee2222':'1px solid rgba(100,40,20,0.4)',borderRadius:2,color:isDel?'#ff4444':'#6a3020',cursor:canDel?'pointer':'not-allowed'}}>
                  {isDel?'✓ DEL':'✗ DEL'}
                </button>
                <button onClick={()=>canCopy&&setToCopy(isCopy?null:card.uid)}
                  style={{flex:1,padding:'4px 0',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,background:isCopy?'rgba(0,120,40,0.4)':'rgba(10,40,20,0.4)',border:isCopy?'1px solid #22aa44':'1px solid rgba(20,60,30,0.4)',borderRadius:2,color:isCopy?'#44dd44':'#2a5a30',cursor:canCopy?'pointer':'not-allowed'}}>
                  {isCopy?'✓ CPY':'+CPY'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:16}}>
        <button onClick={()=>ready&&onConfirm(toDelete,toCopy)} disabled={!ready}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:ready?'rgba(30,130,30,0.3)':'rgba(20,20,20,0.3)',border:ready?'2px solid #22aa44':'1px solid #333',borderRadius:3,color:ready?'#44dd44':'#555',cursor:ready?'pointer':'not-allowed'}}>
          ✓ Apply
        </button>
        <button onClick={onClose}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:'rgba(80,40,10,0.3)',border:'1px solid rgba(100,60,20,0.5)',borderRadius:3,color:'#8a6030',cursor:'pointer'}}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function SetlistModal({cards,onConfirm,onClose}){
  const [order,setOrder]=useState(cards.map((_,i)=>i))
  const [dragging,setDragging]=useState(null)
  const move=(from,to)=>{
    const next=[...order]
    const [item]=next.splice(from,1)
    next.splice(to,0,item)
    setOrder(next)
  }
  const ordered=order.map(i=>cards[i])
  return(
    <div style={{position:'fixed',inset:0,zIndex:9700,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#d0b060',fontFamily:"'BreakGothicFont',cursive"}}>Setlist</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'#a09060',fontStyle:'italic'}}>Drag to reorder the top of your deck</div>
      <div style={{display:'flex',gap:16,alignItems:'flex-end'}}>
        {ordered.map((card,i)=>{
          const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
          return(
            <div key={card.uid} draggable
              onDragStart={()=>setDragging(i)}
              onDragOver={e=>{e.preventDefault()}}
              onDrop={()=>{if(dragging!==null&&dragging!==i){move(dragging,i);setDragging(null)}}}
              onDragEnd={()=>setDragging(null)}
              style={{width:160,background:'linear-gradient(180deg,#201408,#100804)',border:'2px solid '+bc,borderRadius:7,overflow:'hidden',cursor:'grab',opacity:dragging===i?0.5:1,transition:'transform 0.15s',transform:dragging===i?'scale(0.95)':'scale(1)'}}>
              <div style={{height:5,background:bc}}/>
              <div style={{height:90,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,background:'rgba(0,0,0,0.35)'}}>{card.emoji}</div>
              <div style={{padding:'8px 10px 12px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:3}}>{card.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:bc,textAlign:'center',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>{card.type}</div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:10,color:'#b09870',textAlign:'center',fontStyle:'italic',lineHeight:1.4}}>{card.effect}</div>
              </div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'rgba(200,160,60,0.5)',textAlign:'center',padding:'4px',background:'rgba(0,0,0,0.4)'}}>#{i+1}</div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:16}}>
        <button onClick={()=>onConfirm(ordered)}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:'rgba(30,130,30,0.3)',border:'2px solid #22aa44',borderRadius:3,color:'#44dd44',cursor:'pointer'}}>
          ✓ Lock In
        </button>
        <button onClick={onClose}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:'rgba(80,40,10,0.3)',border:'1px solid rgba(100,60,20,0.5)',borderRadius:3,color:'#8a6030',cursor:'pointer'}}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function App(){
  const [gameState,setGameState]=useState('booster')
  const getDailySeed=()=>{const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))}
  const [runSeed,setRunSeed]=useState(()=>Math.floor(Math.random()*0xFFFFFF))
  const [isDailyRun,setIsDailyRun]=useState(false)
  const [fightIndex,setFightIndex]=useState(0)
  const [enemy,setEnemy]=useState(ENEMIES[0])
  const [enemyHp,setEnemyHp]=useState(ENEMIES[0].maxHp)
  const [stage,setStage]=useState([null,null,null,null,null])
  const [deck,setDeck]=useState([]);const deckRef=useRef([]);
  const [hand,setHand]=useState([]);const handRef=useRef([]);
  const [discardPile,setDiscardPile]=useState([]);const discRef=useRef([]);
  const [maxEmbers,setMaxEmbers]=useState(5)
  const [embers,setEmbers]=useState(5)
  const [stash,setStash]=useState(0)
  const [strikesLeft,setStrikesLeft]=useState(MAX_STRIKES)
  const [discardsLeft,setDiscardsLeft]=useState(MAX_DISCARDS)
  const [isWiggling,setIsWiggling]=useState(false)
  const [projectiles,setProjectiles]=useState([])
  const [floats,setFloats]=useState([])
  const [hovered,setHovered]=useState(null)
  const [selected,setSelected]=useState([])
  const [dragCardUid,setDragCardUid]=useState(null)
  const [dragStageIdx,setDragStageIdx]=useState(null)
  const [dragHandIdx,setDragHandIdx]=useState(null)
  const [dragOverHandIdx,setDragOverHandIdx]=useState(null)
  const [handSort,setHandSort]=useState('none') // 'none'|'embers'|'rarity'
  const [log,setLog]=useState(['⛧ The gig begins.'])
  const [damageFlash,setDamageFlash]=useState(false)
  const [animPhase,setAnimPhase]=useState('idle')
  const [corruption,setCorruption]=useState(0)
  const [stageDiveUsed,setStageDiveUsed]=useState(false)
  const [diceTarget,setDiceTarget]=useState(null)
  const [showDice,setShowDice]=useState(false)
  const [pendingEmbers,setPendingEmbers]=useState(0)
  const [lastRiffPlayed,setLastRiffPlayed]=useState(null)
  const [bossDebuff,setBossDebuff]=useState(0)
  const [bossRageAtk,setBossRageAtk]=useState(0)
  const [dblRoll,setDblRoll]=useState(null) // null=not rolled, 1-2=half, 3-4=offbeat, 5-6=double
  const [shredderUsed,setShredderUsed]=useState(false) // tracks if first RIFF played this Strike
  const [nextCardFree,setNextCardFree]=useState(false)
  const [skipNextDiscard,setSkipNextDiscard]=useState(false)
  const [setlistOpen,setSetlistOpen]=useState(false)
  const [setlistCards,setSetlistCards]=useState([])
  const [remasterOpen,setRemasterOpen]=useState(false)
  const [remasterCards,setRemasterCards]=useState([])
  const [deathCause,setDeathCause]=useState('fallen')
  const [hellquakeAnim,setHellquakeAnim]=useState(null)
  const [circleArtifact]=useState(()=>CIRCLE_ARTIFACTS[Math.floor(Math.random()*CIRCLE_ARTIFACTS.length)])
  const [circlePassive]=useState(()=>STARTER_PASSIVES[Math.floor(Math.random()*STARTER_PASSIVES.length)])
  const [activeArtifacts,setActiveArtifacts]=useState([]) // max 3
  const [discovered,setDiscovered]=useState(new Set())
  const [streakWins,setStreakWins]=useState(0)
  const [streakLosses,setStreakLosses]=useState(0)
  const [totalRunsPlayed,setTotalRunsPlayed]=useState(0)
  const [activePassives,setActivePassives]=useState([])   // max 5
  const [pendingBurningStage,setPendingBurningStage]=useState(false) // burning stage bonus next fight
  const [extraEmberNextFight,setExtraEmberNextFight]=useState(0)    // from burning stage
  const [resonanceCoilActive,setResonanceCoilActive]=useState(false)
  const [powerChordActive,setPowerChordActive]=useState(false)
  const [shopCards,setShopCards]=useState(()=>genShopCards(1))
  const [boosterPacks,setBoosterPacks]=useState(()=>genBoosterPacks(1))
  const [recruitPack,setRecruitPack]=useState(()=>genRecruitPack())
  const [recruitCandidates,setRecruitCandidates]=useState([])
  const [demonicConflict,setDemonicConflict]=useState(null)
  const [rerollCost,setRerollCost]=useState(2)
  const [shopBoughtIds,setShopBoughtIds]=useState([])
  const [stats,setStats]=useState({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0})

  
  // Keep refs in sync for use in timeouts
  handRef.current=hand;
  deckRef.current=deck;
  discRef.current=discardPile;
  const bossRef=useRef(null)
  const stageRefs=useRef(Array(5).fill(null).map(()=>({current:null})))
  const fid=useRef(0),prid=useRef(0)

  const addLog=m=>setLog(p=>[m,...p.slice(0,7)])
  const addFloat=(v,x,y,color,big)=>{big=big||false;const id=fid.current++;setFloats(p=>[...p,{id,v,x,y,color:color||'#dd2222',big}])}
  const remFloat=id=>setFloats(p=>p.filter(f=>f.id!==id))
  const updStat=(key,val,isMax)=>{isMax=isMax||false;setStats(p=>Object.assign({},p,{[key]:isMax?Math.max(p[key],val):p[key]+val}))}
  const discover=(mechanic,label)=>{
    setDiscovered(prev=>{
      if(prev.has(mechanic))return prev
      const next=new Set(prev)
      next.add(mechanic)
      addFloat('⛧ DISCOVERED: '+label,getCenter(bossRef).x,getCenter(bossRef).y-160,'#ffdd00',true)
      addLog('⛧ DISCOVERED: '+label+' — first time!')
      return next
    })
  }

  const drawUpTo=useCallback((h,d,disc,target)=>{
    let nh=[...h],nd=[...d],ndisc=[...disc]
    while(nh.length<target){
      if(nd.length===0){if(ndisc.length===0)break;nd=[...ndisc].sort(()=>Math.random()-.5);ndisc=[];addLog('🔄 Deck reshuffled.')}
      nh=[...nh,nd[0]];nd=nd.slice(1);playCard()
    }
    return{h:nh,d:nd,disc:ndisc}
  },[])

  const rollDblForStage=(stg)=>{
    const hasDrummer=stg.some(m=>m&&m.role==='Drummer')
    const drumCount2=stg.filter(m=>m&&m.role==='Drummer').length
    if(hasDrummer){let roll=Math.floor(Math.random()*6)+1;if(drumCount2>=2&&roll<=2)roll=Math.floor(Math.random()*6)+1;setDblRoll(roll)}
    else setDblRoll(null)
  }
  const startGame=useCallback(selIds=>{
    const musicians=selIds.map(id=>ALL_MUSICIANS.find(m=>m.id===id))
    const initStage=[null,...musicians.map(m=>({...m,maxHp:m.hp})),...Array(3).fill(null)].slice(0,5)
    setStage(initStage)
    const d=buildDeck(runSeed)
    setHand(d.slice(0,HAND_SIZE))
    setDeck(d.slice(HAND_SIZE))
    const hasDrummer=musicians.some(m=>m.role==='Drummer')
    const drumCount=musicians.filter(m=>m.role==='Drummer').length
    if(hasDrummer){let r=Math.floor(Math.random()*6)+1;if(drumCount>=2&&r<=2)r=Math.floor(Math.random()*6)+1;setDblRoll(r)}else setDblRoll(null)
    setGameState('playing')
    addLog('⛧ '+musicians[0].name+' and '+musicians[1].name+' take the stage!')
  },[runSeed])

  const applyCard=useCallback((card,slotIdx)=>{
    const foilDiscount=(card.foil&&card.embers>=2)?1:0
    const hasShredder=stage.some(m=>m&&!m.tooStoned&&m.keyword==='SHREDDER')
    const shredderDiscount=(hasShredder&&!shredderUsed&&card.type==='RIFF'&&card.embers>=1)?1:0
    const effectiveEmbers=nextCardFree&&card.id!=='doubledown'?0:Math.max(0,card.embers-foilDiscount-shredderDiscount)
  if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers, have '+embers+'.');return false}
  if(nextCardFree&&card.id!=='doubledown'){setNextCardFree(false)}
    if(card.id==='stagedive'&&stageDiveUsed){addLog('⚠ Stage Dive once per round only.');return false}
    const m=stage[slotIdx]
    let ns=[...stage],spent=effectiveEmbers,msg=''

    if(card.id==='amp'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk*2,_origAtk:m._origAtk||m.atk,tempBuff:true,buffCount:(m.buffCount||0)+1});msg='⚡ '+m.name+' doubled ATK!';addFloat('×2 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc')}
    else if(card.id==='battlecry'){if(!m)return false;const bcBonus=activePassives.some(p=>p.id==='p7')?2:1;ns[slotIdx]=Object.assign({},m,{atk:m.atk+bcBonus,buffCount:(m.buffCount||0)+1});msg='🤘 '+m.name+' Battle Cry! +'+bcBonus+' ATK forever!';addFloat('+'+bcBonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#ff4400')}
    else if(card.id==='newstrings'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+2,buffCount:(m.buffCount||0)+1});msg='🎸 '+m.name+' +2 ATK permanently!';addFloat('+2 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#e8a820')}
    else if(card.id==='encore'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{encoreReady:true,buffCount:(m.buffCount||0)+1});msg='🔁 '+m.name+' encores!';addFloat('ENCORE!',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#dd2222')}
    else if(card.id==='roadie'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{stoneShield:true,buffCount:(m.buffCount||0)+1});msg='🛡 '+m.name+' shielded!'}
    else if(card.id==='stagedive'){
      if(!m)return false
      const dmg=m.hp
      const bc=getCenter(bossRef)
      const sdHp=Math.max(0,enemyHp-dmg);setEnemyHp(sdHp);addFloat(dmg,bc.x,bc.y-60,'#ff6600',true)
      playHit();setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setStageDiveUsed(true);updStat('totalDamage',dmg);updStat('highestStrike',dmg,true)
      if(sdHp<=0)setTimeout(triggerVictory,500)
      msg='🤘 '+m.name+' Stage Dives for '+dmg+' damage!'
    }
    else if(card.id==='wakeup'){
      // Heal all active members 2 HP
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m)
      // Revive first Too Stoned member with 50% permanent ATK loss
      const stonedIdx=ns.findIndex(m=>m&&m.tooStoned)
      if(stonedIdx>=0){
        const sm=ns[stonedIdx]
        const baseAtk=sm._origAtk!==undefined?sm._origAtk:sm.atk
        const startAtk=ALL_MUSICIANS.find(mu=>mu.id===sm.id)?.atk||1
        const permGain=baseAtk-startAtk
        const newAtk=startAtk+Math.floor(permGain*0.5)
        ns[stonedIdx]=Object.assign({},sm,{tooStoned:false,hp:sm.maxHp,atk:Math.max(startAtk,newAtk),_origAtk:undefined,tempBuff:false,buffCount:Math.floor((sm.buffCount||0)*0.5)})
        msg='☕ '+sm.name+' revived! (lost 50% ATK buffs) All members +2 HP.'
        addFloat('REVIVED',getCenter(stageRefs.current[stonedIdx]).x,getCenter(stageRefs.current[stonedIdx]).y-70,'#22aa44')
      } else {
        msg='☕ Wake Up Call! All members +2 HP.'
        addFloat('+2 HP',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44')
      }
    }
    else if(card.id==='soundcheck'){
      const injuredCount=ns.filter(m=>m&&!m.tooStoned&&m.hp<m.maxHp).length
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+4),atk:m.hp<m.maxHp?m.atk+1:m.atk,tempBuff:m.hp<m.maxHp?true:m.tempBuff,_origAtk:m.hp<m.maxHp&&!m._origAtk?m.atk:m._origAtk}):m)
      msg='🔊 Sound Check! All +4 HP'+(injuredCount>0?' + '+injuredCount+' injured member(s) +1 ATK!':'!')
      addFloat('+4 HP',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44')
    }
    else if(card.id==='dialtoeleven'){const nc=Math.min(100,corruption+20);setCorruption(nc);updStat('maxCorruption',nc,true);msg='📻 Corruption +20% → '+nc+'%'}
    else if(card.id==='sigdecay'){const nc=Math.max(0,corruption-30);setCorruption(nc);msg='📡 Corruption -30% → '+nc+'%'}
    else if(card.id==='remaster'){
      const pool=deck.length>=10?[...deck].sort(()=>Math.random()-.5).slice(0,10):[...deck]
      if(pool.length===0){addLog('🎙 Deck is empty!');return false}
      setRemasterCards(pool)
      setRemasterOpen(true)
      spent=0
      msg='🎙 The Remaster — choose wisely.'
    }
    else if(card.id==='setlist'){
      // Show top 4 deck cards in a reorder modal
      const top4=deck.slice(0,4)
      if(top4.length===0){addLog('📋 Deck is empty!');return false}
      setSetlistCards(top4)
      setSetlistOpen(true)
      spent=0
      msg='📋 Setlist opened — rearrange the top of your deck.'
    }
    else if(card.id==='controlfeedback'){setCorruption(50);msg='🎚 Corruption set to 50%.'}
    else if(card.id==='feedbackloop'){const dmg=Math.floor(corruption/2);const bc2=getCenter(bossRef);const flHp=Math.max(0,enemyHp-dmg);setEnemyHp(flHp);addFloat(dmg,bc2.x,bc2.y-60,'#aa1111',dmg>=15);playHit();updStat('totalDamage',dmg);if(flHp<=0)setTimeout(triggerVictory,500);msg='🎛 Feedback Loop: '+dmg+' damage! ('+Math.floor(corruption)+'% ÷ 2)'}
    else if(card.id==='soundwall'){const p5Bonus=activePassives.some(p=>p.id==='p5')?4:0;const swDmg=(fightIndex===0?5:fightIndex===1?8:12)+p5Bonus;const bc3=getCenter(bossRef);const swHp=Math.max(0,enemyHp-swDmg);setEnemyHp(swHp);addFloat(swDmg,bc3.x,bc3.y-60,'#dd2222');playHit();if(swHp<=0)setTimeout(triggerVictory,500);msg='🔈 Sound Wall! '+swDmg+' direct damage.';updStat('totalDamage',swDmg)}
    else if(card.id==='groupie'){const gain=3+(activePassives.some(p=>p.id==='p4')?1:0);setEmbers(function(p){return Math.min(maxEmbers,p+gain-card.embers)});spent=0;playEmber();msg='🍯 Groupie! Net +'+(gain-card.embers)+' Embers.';addFloat('+'+gain+' 🔥',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff6600')}
    else if(card.id==='tappedout'){setPendingEmbers(function(p){return p+5});spent=0;playEmber();msg='🪙 Tapped Out! +5 Embers next Strike.'}
    else if(card.id==='demotape'){
      if(!lastRiffPlayed){addLog('📼 No riff recorded yet.');return false}
      spent=0
      // Inline replay — directly apply the last riff effect without recursive applyCard
      const lr=lastRiffPlayed
      const lrTarget=ns[slotIdx]
      if(lr.id==='amp'&&lrTarget&&!lrTarget.tooStoned){
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk*2,_origAtk:lrTarget._origAtk||lrTarget.atk,tempBuff:true,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='battlecry'&&lrTarget&&!lrTarget.tooStoned){
        const bcB=activePassives.some(p=>p.id==='p7')?2:1
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+bcB,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='newstrings'&&lrTarget&&!lrTarget.tooStoned){
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+2,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='encore'&&lrTarget&&!lrTarget.tooStoned){
        ns[slotIdx]=Object.assign({},lrTarget,{encoreReady:true,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='soundwall'){
        const p5B=activePassives.some(p=>p.id==='p5')?4:0
        const swD=(fightIndex<=0?5:fightIndex<=1?8:12)+p5B
        const swHp=Math.max(0,enemyHp-swD);setEnemyHp(swHp);updStat('totalDamage',swD)
        addFloat(swD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#dd2222',true);playHit()
        if(swHp<=0)setTimeout(triggerVictory,500)
      } else if(lr.id==='feedbackloop'){
        const flD=Math.floor(corruption/2)
        const flHp=Math.max(0,enemyHp-flD);setEnemyHp(flHp);updStat('totalDamage',flD)
        addFloat(flD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#aa1111',flD>=15);playHit()
        if(flHp<=0)setTimeout(triggerVictory,500)
      } else if(lr.id==='crowdsurf'){
        const csDmg=hand.length*2
        const csHp=Math.max(0,enemyHp-csDmg);setEnemyHp(csHp);updStat('totalDamage',csDmg)
        addFloat(csDmg,getCenter(bossRef).x,getCenter(bossRef).y-60,'#9933cc',csDmg>=10);playHit()
        if(csHp<=0)setTimeout(triggerVictory,500)
      } else if(lr.id==='overdrive'&&corruption>=60){
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true,_origAtk:s._origAtk||s.atk}):s)
        addFloat('OVERDRIVE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)
      } else if(lr.id==='infencore'){
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{encoreReady:true,buffCount:(s.buffCount||0)+1}):s)
      }
      msg='📼 Demo Tape! Replays: '+lr.name
      addFloat('📼 '+lr.name,getCenter(bossRef).x,getCenter(bossRef).y-100,'#e8a820',true)
    }
    else if(card.id==='burnset'){const res=drawUpTo([],deck,discardPile,HAND_SIZE);setHand(res.h);setDeck(res.d);setDiscardPile([...res.disc,...hand]);msg='🔥 Hand burned! Drew 6 new cards.'}
    else if(card.id==='overdrive'){if(corruption>=60){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true,_origAtk:s._origAtk||s.atk}):s});msg='💥 OVERDRIVE! All ATK doubled!';addFloat('OVERDRIVE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)}else{addLog('⚠ Need >=60% Corruption.');return false}}
    else if(card.id==='crowdsurf'){
      const dmg=hand.length*2
      const bc=getCenter(bossRef)
      const csHp=Math.max(0,enemyHp-dmg);setEnemyHp(csHp)
      addFloat(dmg,bc.x,bc.y-60,'#9933cc',dmg>=10);playHit();updStat('totalDamage',dmg)
      if(csHp<=0)setTimeout(triggerVictory,500)
      msg='🏄 Crowd Surf! '+hand.length+' cards × 2 = '+dmg+' damage!'
    }
    else if(card.id==='doubledown'){
      setNextCardFree(true)
      msg='🎰 Double Down! Next card costs 0 Embers.'
      addFloat('FREE!',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='deathriff'){
      if(corruption>=100){addLog('💀 Corruption maxed — Death Riff fizzles!');return false}
      const ddmg=Math.min(60,Math.floor(100-corruption))
      const bc=getCenter(bossRef)
      const drHp=Math.max(0,enemyHp-ddmg);setEnemyHp(drHp)
      const nc=Math.min(100,corruption+10);setCorruption(nc);updStat('maxCorruption',nc,true)
      addFloat(ddmg,bc.x,bc.y-60,'#880000',ddmg>=30);playHit();updStat('totalDamage',ddmg)
      if(drHp<=0)setTimeout(triggerVictory,500)
      msg='💀 Death Riff! '+ddmg+' damage. Corruption +10%.'
    }
    else if(card.id==='ampoverload'){
      setEmbers(p=>Math.min(maxEmbers,p+3));setSkipNextDiscard(true);playEmber()
      msg='🔋 Amp Overload! +3 Embers. Next Discard skipped.'
      addFloat('+3 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#ff6600')
    }
    else if(card.id==='ampstatic'){
      if(!m)return false
      const bonus=Math.floor(corruption/15)
      if(bonus===0){addLog('📶 Need some Corruption first!');return false}
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1})
      msg='📶 Amp the Static! '+m.name+' +'+bonus+' ATK this Strike!'
      addFloat('+'+bonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#cc4400',bonus>=4)
    }
    else if(card.id==='distortion'){
      const nc=Math.min(100,corruption+10);setCorruption(nc);updStat('maxCorruption',nc,true)
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1}):m)
      msg='🎸 Distortion! Corruption +10%. All members +1 ATK.'
      addFloat('+1 ATK',getCenter(bossRef).x,getCenter(bossRef).y-70,'#cc4400')
    }
    else if(card.id==='seance'){
      const healAmt=Math.max(1,Math.floor(corruption/8))
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+healAmt)}):m)
      msg='🔮 Séance! All members +'+healAmt+' HP'+(corruption>0?' ('+Math.floor(corruption)+'% ÷ 8)':' (min 1)')
      addFloat('+'+healAmt+' HP',getCenter(bossRef).x,getCenter(bossRef).y-70,'#22aa44')
    }
    else if(card.id==='staticcharge'){
      if(corruption===0){setEmbers(p=>Math.min(maxEmbers,p+3));playEmber();msg='⚡ Static Charge! No corruption → +3 Embers.';addFloat('+3 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')}
      else{const nc=Math.max(0,corruption-5);setCorruption(nc);msg='⚡ Static Charge! Corruption -5% → '+nc+'%';addFloat('-5% Corrupt',getCenter(bossRef).x,getCenter(bossRef).y-70,'#aa5500')}
    }
    else if(card.id==='darktuning'){
      const stacks=Math.floor(corruption/15)
      if(stacks===0){addLog('🌑 Need 15%+ Corruption!');return false}
      let remaining=stacks
      const activeSlots=ns.map((m,i)=>m&&!m.tooStoned?i:-1).filter(i=>i>=0)
      while(remaining>0&&activeSlots.length>0){
        const ri=Math.floor(Math.random()*activeSlots.length)
        const si=activeSlots[ri]
        ns[si]=Object.assign({},ns[si],{atk:ns[si].atk+1})
        remaining--
      }
      msg='🌑 Dark Tuning! +'+stacks+' ATK spread across the band permanently!'
      addFloat('+'+stacks+' ATK!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#6600aa',stacks>=3)
    }
    else if(card.id==='powertap'){
      const ptBonus=activeArtifacts.some(a=>a.id==='a5')?2:1
      const p4Bonus=activePassives.some(p=>p.id==='p4')?1:0
      setEmbers(p=>Math.min(maxEmbers,p+ptBonus+p4Bonus));playEmber();spent=0
      msg='🔌 Power Tap! +'+(ptBonus+p4Bonus)+' Ember'+(ptBonus+p4Bonus>1?'s!':'!')
    }
    else if(card.id==='soundboard'){
      setEmbers(p=>Math.min(maxEmbers,p+2));playEmber();spent=0
      setPendingEmbers(p=>p+1) // draw 1 extra next strike via pending
      msg='🎛 Soundboard! +2 Embers. +1 draw next Strike.'
      addFloat('+2 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='setbreak'){
      const candidates=hand.filter(c=>c.uid!==card.uid)
      if(candidates.length===0){addLog('🎼 No cards to discard!');return false}
      const victim=candidates[Math.floor(Math.random()*candidates.length)]
      setHand(p=>p.filter(c=>c.uid!==victim.uid))
      setDiscardPile(p=>[...p,victim])
      setEmbers(p=>Math.min(maxEmbers,p+2));playEmber();spent=0
      msg='🎼 Setbreak! '+victim.name+' sacrificed to the riff gods. +2 Embers.'
      addFloat('+2 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='heavyriff'){
      const p5HeavyBonus=activePassives.some(p=>p.id==='p5')?2:0
      const activeAtk=stage.filter(m=>m&&!m.tooStoned).reduce((sum,m)=>sum+m.atk,0)
      const dmg=Math.floor(activeAtk/2)+p5HeavyBonus
      const bc=getCenter(bossRef)
      const hrHp=Math.max(0,enemyHp-dmg);setEnemyHp(hrHp)
      addFloat(dmg,bc.x,bc.y-60,'#9933cc',dmg>=10);playHit();updStat('totalDamage',dmg)
      if(hrHp<=0)setTimeout(triggerVictory,500)
      msg='🥊 Heavy Riff! Stage ATK ÷ 2 = '+dmg+' direct damage!'
    }
    else if(card.id==='herbmoney'){
      const herbDmg=Math.min(69,Math.floor(stash*0.1))
      if(herbDmg<=0){addLog('🌿 No Stash to spend!');return false}
      const herbLoss=Math.floor(stash*0.1)
      setStash(p=>Math.max(0,p-herbLoss))
      const bc=getCenter(bossRef)
      const hmHp=Math.max(0,enemyHp-herbDmg);setEnemyHp(hmHp)
      addFloat(herbDmg,bc.x,bc.y-60,'#22aa44',herbDmg>=20);playHit();updStat('totalDamage',herbDmg)
      addFloat('-'+herbLoss+' 🌿',bc.x,bc.y-100,'#44cc44')
      if(hmHp<=0)setTimeout(triggerVictory,500)
      msg='🌿 Herb Money! '+herbDmg+' damage. Lost '+herbLoss+' Stash.'
    }
    else if(card.id==='goingbroke'){
      if(stash<=0){addLog('💸 You are already broke!');return false}
      const brokeDmg=stash
      setStash(0)
      const bc=getCenter(bossRef)
      const gbHp=Math.max(0,enemyHp-brokeDmg);setEnemyHp(gbHp)
      addFloat(brokeDmg,bc.x,bc.y-60,'#ffcc00',true);playHit();updStat('totalDamage',brokeDmg)
      addFloat('BROKE!',bc.x,bc.y-110,'#ffcc00',true)
      if(gbHp<=0)setTimeout(triggerVictory,500)
      msg='💸 Going Broke! '+brokeDmg+' damage. All Stash spent.'
    }
    else if(card.id==='resonancecard'){
      if(!m)return false
      const maxAtk=Math.max(...ns.filter(mb=>mb&&!mb.tooStoned).map(mb=>mb.atk))
      if(maxAtk<=m.atk){addLog('🌀 Already at max ATK!');return false}
      ns[slotIdx]=Object.assign({},m,{atk:maxAtk,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1})
      msg='🌀 Resonance! '+m.name+' ATK → '+maxAtk+'!'
      addFloat('ATK → '+maxAtk,getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc',true)
    }
    else if(card.id==='sabbathsigil'){
      setCorruption(100);updStat('maxCorruption',100,true)
      discover('hellquake','HELLQUAKE')
      const roll=Math.floor(Math.random()*10)+1
      const bc=getCenter(bossRef)
      let hqMsg='',hqFloat='',hqColor='#aa1111'
      // d10 outcomes: 5 positive, 2 mixed, 3 negative
      if(roll<=2){
        // 1-2: OBLITERATION — total band ATK × 4 (positive)
        const totalAtk=ns.filter(m=>m&&!m.tooStoned).reduce((sum,m)=>sum+m.atk,0)
        const hqDmg=totalAtk*4
        const oblitHp=Math.max(0,enemyHp-hqDmg);setEnemyHp(oblitHp)
        updStat('totalDamage',hqDmg)
        if(oblitHp<=0)setTimeout(triggerVictory,2100)
        hqMsg='⛧ HELLQUAKE: OBLITERATION! '+hqDmg+' damage!';hqFloat='OBLITERATION!';hqColor='#ff2200'
      } else if(roll===3){
        // 3: RESONANCE — all members +3 ATK permanently (positive)
        ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3}):m)
        hqMsg='⛧ HELLQUAKE: RESONANCE! All members +3 ATK forever!';hqFloat='RESONANCE!';hqColor='#ff6600'
      } else if(roll===4){
        // 4: RITUAL — boss HP halved (positive)
        const ritualHp=Math.max(1,Math.floor(enemyHp/2));setEnemyHp(ritualHp)
        hqMsg='⛧ HELLQUAKE: RITUAL! Boss HP halved!';hqFloat='RITUAL!';hqColor='#cc44ff'
      } else if(roll===5){
        // 5: THE VOID — corruption → damage, reset to 0 (positive)
        const voidDmg=Math.floor(corruption)
        const voidHp=Math.max(0,enemyHp-voidDmg);setEnemyHp(voidHp)
        updStat('totalDamage',voidDmg)
        setCorruption(0)
        if(voidHp<=0)setTimeout(triggerVictory,2100)
        hqMsg='⛧ HELLQUAKE: THE VOID! '+voidDmg+' damage, soul cleansed!';hqFloat='THE VOID!';hqColor='#4400aa'
      } else if(roll===6){
        // 6: POSSESSION — all cards free this Strike (positive)
        setEmbers(maxEmbers);setPendingEmbers(maxEmbers)
        hqMsg='⛧ HELLQUAKE: POSSESSION! All cards free this Strike!';hqFloat='POSSESSED!';hqColor='#aa44ff'
      } else if(roll===7){
        // 7: BACKLASH — 30 damage BUT one random member falls (mixed)
        const backlashHp=Math.max(0,enemyHp-30);setEnemyHp(backlashHp)
        updStat('totalDamage',30)
        if(backlashHp<=0)setTimeout(triggerVictory,2100)
        const alive=ns.filter(m=>m&&!m.tooStoned)
        if(alive.length>0){const victim=alive[Math.floor(Math.random()*alive.length)];const vi=ns.indexOf(victim);ns[vi]=Object.assign({},victim,{hp:0,tooStoned:true})}
        hqMsg='⛧ HELLQUAKE: BACKLASH! 30 damage, one member lost!';hqFloat='BACKLASH!';hqColor='#9933cc'
      } else if(roll===8){
        // 8: FEEDBACK — boss dmg doubles 2 strikes but +3 embers (mixed)
        setPendingEmbers(p=>p+3)
        setBossDebuff(p=>p-4) // negative debuff = extra boss damage for 2 strikes effectively
        hqMsg='⛧ HELLQUAKE: FEEDBACK! Boss energised but you gain 3 Embers!';hqFloat='FEEDBACK!';hqColor='#ff8800'
      } else if(roll===9){
        // 9: THE RIFF CURSE — entire hand discarded, no redraw (negative)
        setHand([]);setDiscardPile(p=>[...p,...hand])
        hqMsg='⛧ HELLQUAKE: THE RIFF CURSE! Hand obliterated!';hqFloat='CURSED!';hqColor='#880000'
      } else {
        // 10: TOTAL WIPEOUT — random member Too Stoned AND boss heals 15 (negative)
        const alive2=ns.filter(m=>m&&!m.tooStoned)
        if(alive2.length>0){const v2=alive2[Math.floor(Math.random()*alive2.length)];const vi2=ns.indexOf(v2);ns[vi2]=Object.assign({},v2,{hp:0,tooStoned:true})}
        setEnemyHp(function(prev){return Math.min(enemy.maxHp,prev+15)})
        hqMsg='⛧ HELLQUAKE: TOTAL WIPEOUT! A member falls and the boss recovers!';hqFloat='WIPEOUT!';hqColor='#440000'
      }
      // Dramatic flash then reveal
      setHellquakeAnim({text:hqFloat,color:hqColor})
      setTimeout(()=>setHellquakeAnim(null),5000)
      msg=hqMsg
      addFloat(hqFloat,bc.x,bc.y-80,hqColor,true)
      playHit()
    }
    else if(card.id==='possessedperf'){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*3,tempBuff:true,_origAtk:s._origAtk||s.atk}):s});msg='🎭 POSSESSED! Triple ATK!';addFloat('×3 ATK!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)}
    else if(card.id==='infencore'){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{encoreReady:true}):s});msg='👿 Infernal Encore! All members attack again!'}

    // Single-member buff corruption trigger
    if(ns[slotIdx]&&m&&(ns[slotIdx].buffCount||0)>=3&&(ns[slotIdx].buffCount||0)>(m.buffCount||0)&&(ns[slotIdx].buffCount||0)===3){
      const nc2=Math.min(100,corruption+20);setCorruption(nc2);updStat('maxCorruption',nc2,true)
      addLog('⚠ '+(ns[slotIdx].name)+' has 3+ buffs — Corruption +20%!')
    }

    setStage(ns)
    if(spent>0)setEmbers(function(p){return p-spent})
    if(msg)addLog(msg)
    updStat('cardsPlayed',1)
    if(card.type==='RIFF'&&shredderDiscount>0)setShredderUsed(true)
    if(card.type==='RIFF')setLastRiffPlayed(card)
    // cardHeal enemy passive
    if(enemy.passiveId==='cardHeal')setEnemyHp(p=>Math.min(enemy.maxHp,p+2))
    else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>Math.min(enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>Math.min(enemy.maxHp,p+4))
    return true
  },[embers,stage,corruption,stageDiveUsed,deck,discardPile,hand,bossRef,stageRefs])

  const handleDropOnStage=useCallback((slotIdx)=>{
    if(!dragCardUid||animPhase!=='idle')return
    const card=hand.find(c=>c.uid===dragCardUid)
    if(!card)return
    const ok=applyCard(card,slotIdx)
    if(ok){
      const playedId=card.id
      setHand(function(curHand){
        const remaining=curHand.filter(c=>c.uid!==dragCardUid)
        // Resonance: if another copy of same card is in hand, auto-discard it for +1 ember
        const resonantIdx=remaining.findIndex(c=>c.id===playedId)
        if(resonantIdx!==-1){
          const resonant=remaining[resonantIdx]
          const withoutResonant=remaining.filter((_,i)=>i!==resonantIdx)
          setDiscardPile(p=>[...p,card,resonant])
          const resonanceEmbers=activeArtifacts.some(a=>a.id==='a9')?2:1
          setEmbers(p=>Math.min(maxEmbers,p+resonanceEmbers))
          discover('resonance','RESONANCE')
          if(activeArtifacts.some(a=>a.id==='a9'))setPendingEmbers(p=>p+1)// draw extra card via pending
          setTimeout(()=>{
            addFloat('RESONANCE +🔥',getCenter(bossRef).x,getCenter(bossRef).y-110,'#e8a820',false)
            addLog('🎵 Resonance! Duplicate discarded for +1 Ember.')
          },100)
          return withoutResonant
        }
        setDiscardPile(p=>[...p,card])
        return remaining
      })
    }
    setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
  },[dragCardUid,hand,animPhase,applyCard])

  const handleStageDrop=useCallback((toIdx)=>{
    if(dragCardUid){handleDropOnStage(toIdx);return}
    if(dragStageIdx===null||dragStageIdx===toIdx)return
    const ns=[...stage];var tmp=ns[dragStageIdx];ns[dragStageIdx]=ns[toIdx];ns[toIdx]=tmp
    setStage(ns);setDragStageIdx(null)
  },[dragCardUid,dragStageIdx,stage,handleDropOnStage])

  const handleHandReorder=useCallback((fromIdx,toIdx)=>{
    if(fromIdx===toIdx||fromIdx===null||toIdx===null)return
    setHand(prev=>{
      const next=[...prev]
      const [card]=next.splice(fromIdx,1)
      next.splice(toIdx,0,card)
      return next
    })
    setDragHandIdx(null)
    setDragOverHandIdx(null)
  },[])

  const handleDiscard=useCallback(()=>{
    if(selected.length===0||discardsLeft<=0||animPhase!=='idle')return
    if(skipNextDiscard){setSkipNextDiscard(false);addLog('🔋 Discard skipped (Amp Overload).');return}
    const toDisc=hand.filter(c=>selected.includes(c.uid))
    const rem=hand.filter(c=>!selected.includes(c.uid))
    const res=drawUpTo(rem,deck,[...discardPile,...toDisc],HAND_SIZE)
    setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
    setDiscardsLeft(p=>p-1);setSelected([])
    addLog('🗑 '+toDisc.length+' discarded & replaced.')
  },[selected,discardsLeft,animPhase,hand,deck,discardPile,drawUpTo])

  const triggerVictory=useCallback(function(){
    setStage(function(prev){
      return prev.map(function(m){
        if(m&&!m.tooStoned&&m.keyword==='FRENZIED'){
          addFloat('FRENZIED!',getCenter(stageRefs.current[prev.indexOf(m)]).x,getCenter(stageRefs.current[prev.indexOf(m)]).y-80,'#ff6600',false)
          return Object.assign({},m,{atk:m.atk+1})
        }
        return m
      })
    })
    // Bonus scales with circle depth
  const circleNum=Math.floor(fightIndex/3)+1
  const perfectBonus=strikesLeft>=3?(circleNum):0 // won in 1 Strike = perfect
  if(strikesLeft>=3&&activeArtifacts.some(a=>a.id==='a10')){
    setPendingBurningStage(true)
    addLog('🔥 Burning Stage! +5 Embers next fight.')
  }
  const circleBaseMin=[2,4,6,8,10,10,12,12,15]
  const circleBaseRange=[3,3,3,3,4,4,5,5,6]
  const baseMin=circleBaseMin[Math.min(circleNum-1,8)]
  const baseRange=circleBaseRange[Math.min(circleNum-1,8)]
  const stashEarned=baseMin+Math.floor(Math.random()*baseRange)+strikesLeft+perfectBonus
    setStash(function(p){return Math.min(MAX_STASH,p+stashEarned)})
    updStat('stashEarned',stashEarned);updStat('fightsSurvived',1)
    if(Math.random()<0.15){setStash(p=>Math.min(MAX_STASH,p+2));addLog('🎽 Found some merch money! +2 Stash.')}
    if(activePassives.some(p=>p.id==='p3')){setStash(p=>Math.min(MAX_STASH,p+2));addLog('💿 Merch Table! +2 Stash.')}
    if(corruption>=69){setStash(p=>Math.min(MAX_STASH,p+3));addLog('🌀 Corruption Dividend! +3 Stash (69%+ corruption!)')}
    if(perfectBonus>0)addFloat('PERFECT! +'+perfectBonus,getCenter(bossRef).x,getCenter(bossRef).y-100,'#e8a820',true)
    addLog('⛧ Victory! +'+stashEarned+' Stash'+(perfectBonus>0?' (Perfect Strike bonus!)':' earned.'))
    const bq=BOSS_QUOTES[enemy&&enemy.id];if(bq)setTimeout(()=>addLog('💀 "'+bq+'"'),600)
    setTimeout(function(){
      const isCircleBoss=(fightIndex+1)%3===0
      if(isCircleBoss){
        setMaxEmbers(function(p){const newMax=Math.min(MAX_EMBERS_CAP,p+1);setEmbers(newMax);return newMax})
        addFloat('MAX EMBERS +1',getCenter(bossRef).x,getCenter(bossRef).y-130,'#ff6600',true)
      }
      if(fightIndex>=26){
      playVictory();setDeathCause('victory')
      setStreakWins(p=>p+1);setStreakLosses(0)
      setTotalRunsPlayed(p=>p+1)
      setTimeout(function(){setGameState('end')},800)
    }
      else{
        const nextCn=Math.floor((fightIndex+1)/3)+1
        setShopCards(genShopCards(nextCn))
        setBoosterPacks(genBoosterPacks(nextCn))
        setRecruitPack(genRecruitPack())
        setGameState('shop')
      }
    },1000)
  },[strikesLeft,corruption,fightIndex])



  // ── DEV SHORTCUT: Shift+S = jump to shop ─────────────────────────
  useEffect(function(){
    function onKey(e){
      if(e.shiftKey&&e.key==='S'){
        setShopCards(genShopCards(1))
        setBoosterPacks(genBoosterPacks(1))
        setRecruitPack(genRecruitPack())
        setRerollCost(2)
        setStash(69)
        setGameState('shop')
      }
    }
    window.addEventListener('keydown',onKey)
    return function(){window.removeEventListener('keydown',onKey)}
  },[])

  const handleStrike=useCallback(()=>{
    if(animPhase!=='idle'||strikesLeft<=0||enemyHp<=0)return
    const actives=stage.filter(m=>m&&!m.tooStoned)
    if(actives.length===0){addLog('⚠ No active members!');return}

    if(pendingEmbers>0){setEmbers(p=>Math.min(maxEmbers,p+pendingEmbers));addLog('🪙 +'+pendingEmbers+' Embers from Tapped Out!');playEmber();setPendingEmbers(0)}

    // DEBUFF keyword: Nott reduces boss damage each Strike
    const debuffCount=stage.filter(m=>m&&!m.tooStoned&&m.keyword==='DEBUFF').length
    if(debuffCount>0){setBossDebuff(p=>p+debuffCount*2);addLog('🎤 Nott debuffs the boss! (-'+(debuffCount*2)+' damage)')}
    setAnimPhase('attacking');setStrikesLeft(p=>p-1);updStat('strikesThrown',1)

    const buffed=actives.filter(m=>(m.buffCount||0)>0)
    const bandBonus=buffed.length>=5?1.35:buffed.length>=4?1.20:buffed.length>=3?1.10:1.0
    if(bandBonus>1)addLog('🎸 Band synergy! '+buffed.length+' buffed: +'+Math.round((bandBonus-1)*100)+'% damage!')

    const hasDbl=actives.some(m=>m.role==='Drummer')
    const p10Bonus=activePassives.some(p=>p.id==='p10')&&strikesLeft===MAX_STRIKES?10:0
    let dmg=actives.filter(m=>m.role!=='Drummer').reduce((s,m)=>{
      const effectiveAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/15):m.atk
      return s+effectiveAtk
    },0)+p10Bonus
    // DOUBLE TIME d6 multiplier
    let dblMode='', dblMult=1
    if(hasDbl){
      if(dblRoll<=2){dblMult=0.5;dblMode='HALF TIME'}
      else if(dblRoll<=4){dblMult=1.5;dblMode='OFF BEAT'}
      else{dblMult=2;dblMode='DOUBLE TIME'}
      dmg=Math.round(dmg*dblMult)
    }
    const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer').reduce((s,m)=>s+m.atk,0)
    dmg+=encDmg
    dmg=Math.round(dmg*bandBonus)
    // HEXED: auto-raise corruption +5%, member gains +1 ATK per 10% corruption
    const hexedMembers=actives.filter(m=>m.keyword==='HEXED')
    if(hexedMembers.length>0){
      setCorruption(prev=>{
        const nc=Math.min(100,prev+5*hexedMembers.length)
        updStat('maxCorruption',nc,true)
        // Grant ATK based on new corruption level
        setStage(prevStage=>prevStage.map(m=>{
          if(!m||m.tooStoned||m.keyword!=='HEXED')return m
          const hexAtk=Math.floor(nc/10)
          const baseAtk=ALL_MUSICIANS.find(mu=>mu.id===m.id)?.atk||2
          return Object.assign({},m,{atk:Math.max(m.atk,baseAtk+hexAtk)})
        }))
        return nc
      })
      addLog('🟠 HEXED! Corruption +'+5*hexedMembers.length+'%. Orm grows stronger.')
    }
    const hasFolkMagic=actives.some(m=>m.keyword==='FOLK MAGIC')
    const folkMagicFired=hasFolkMagic&&Math.random()<0.2
    addLog('⚔ Band attacks for '+dmg+'!'+(hasDbl?' ('+dblMode+' ×'+dblMult+'!)':'')+(folkMagicFired?' 🪈 FOLK MAGIC!':''))

    const bc=getCenter(bossRef)
    let delay=0
    actives.forEach(function(m){
      if(m.role==='Drummer')return
      const si=stage.indexOf(m)
      const from=getCenter(stageRefs.current[si])
      const ppid=prid.current++
      setTimeout(function(){try{(ATK_SND[m.role]||ATK_SND['Lead Guitarist'])()}catch(e){}
        setProjectiles(function(p){return[...p,{id:ppid,from:from,to:bc,emoji:m.emoji}]})},delay)
      delay+=260
    })

    setTimeout(function(){
      playHit();setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setProjectiles([])
      const newEHp=Math.max(0,enemyHp-dmg)
      setEnemyHp(newEHp)
      // damageScaleAtk: boss gains ATK per 20 damage taken
      if(enemy.passiveId&&enemy.passiveId.startsWith('damageScaleAtk')){
        const atkGain=enemy.passiveId==='damageScaleAtk'?1:enemy.passiveId==='damageScaleAtk2'?2:2
        const rageStacks=Math.floor((enemy.maxHp-newEHp)/20)
        setBossRageAtk(rageStacks*atkGain)
      }
      addFloat(dmg,bc.x,bc.y-60,dmg>=15?'#ff4400':'#dd2222',dmg>=15)
      if(folkMagicFired){
        setEmbers(maxEmbers)
        addFloat('🪈 FOLK MAGIC!',bc.x,bc.y-120,'#44ddaa',true)
        addLog('🪈 Folk Magic! All Embers refunded!')
      }
      updStat('totalDamage',dmg);updStat('highestStrike',dmg,true)

      setStage(function(p){return p.map(function(m){
        if(!m)return null
        var nm=Object.assign({},m)
        if(nm.encoreReady)nm=Object.assign({},nm,{encoreReady:false})
        if(nm.tempBuff&&nm._origAtk!==undefined)nm=Object.assign({},nm,{atk:nm._origAtk,_origAtk:undefined,tempBuff:false})
        return nm
      })})

      if(newEHp<=0){triggerVictory();return}

      setTimeout(function(){
        setAnimPhase('boss')
        const activeM=stage.filter(function(m){return m&&!m.tooStoned})
        if(activeM.length===0){setAnimPhase('idle');return}
        // targetHighestHp passive
        let target
        if(enemy.passiveId&&enemy.passiveId.startsWith('targetHighestHp')){
          target=activeM.reduce((best,m)=>m.hp>best.hp?m:best,activeM[0])
        } else {
          target=activeM[Math.floor(Math.random()*activeM.length)]
        }
        setDiceTarget(target);setShowDice(true);playDice()
        setTimeout(function(){
          setShowDice(false)
          const variance=Math.floor(Math.random()*5)-2
          // Apply enemy passive scaling effects before damage
        let scaledBaseDmg=enemy.baseDmg+(enemy.passiveId&&enemy.passiveId.startsWith('damageScaleAtk')?bossRageAtk:0)
        // selfbuff: boss gains +1/+2 dmg per Strike
        if(enemy.passiveId==='selfbuff'){scaledBaseDmg=enemy.baseDmg+strikesLeft}
        else if(enemy.passiveId==='selfbuff2'){scaledBaseDmg=enemy.baseDmg+(MAX_STRIKES-strikesLeft)*2}
        // rageScale: +X dmg per buffed member
        else if(enemy.passiveId==='rageScale'){const buffed=stage.filter(m=>m&&(m.buffCount||0)>0).length;scaledBaseDmg=enemy.baseDmg+buffed*2}
        else if(enemy.passiveId==='rageScale3'){const buffed=stage.filter(m=>m&&(m.buffCount||0)>0).length;scaledBaseDmg=enemy.baseDmg+buffed*3}
        else if(enemy.passiveId==='rageScale4'){const buffed=stage.filter(m=>m&&(m.buffCount||0)>0).length;scaledBaseDmg=enemy.baseDmg+buffed*4}
        // corruptPlayer: raises player corruption each Strike
        else if(enemy.passiveId==='corruptPlayer'){setCorruption(p=>Math.min(100,p+10));addLog('🔱 Heretic corrupts your band! +10% Corruption.')}
        else if(enemy.passiveId==='corruptPlayer15'){setCorruption(p=>Math.min(100,p+15));addLog('⛧ Apostate corrupts! +15% Corruption.')}
        else if(enemy.passiveId==='corruptPlayer20'){setCorruption(p=>Math.min(100,p+20));addLog('📖 False Prophet corrupts! +20% Corruption.')}
        // stealStash passives handled after damage
        else{scaledBaseDmg=enemy.baseDmg}
        const actualDmg=Math.max(1,Math.round(scaledBaseDmg)+variance-bossDebuff)
          const varLabel=variance>0?' (CRIT!)':variance<0?' (miss)':''
          const ti=stage.indexOf(target)
          setStage(function(prev){
            const ns2=[...prev]
            if(ns2[ti]){
              const newHp=ns2[ti].hp-actualDmg
              if(newHp<=0&&!ns2[ti].stoneShield){
                ns2[ti]=Object.assign({},ns2[ti],{hp:0,tooStoned:true})
                addLog('💨 '+target.name+' is TOO STONED!')
                updStat('tooStonedCount',1)
                // A6: Black Candle — deal 8 damage
                if(activeArtifacts.some(a=>a.id==='a6')){
                  setEnemyHp(ehp=>Math.max(0,ehp-8))
                  addLog('🕯 Black Candle! 8 damage from '+target.name+' — sacrificed!')
                }
                // P6: Cult Following — gain 3 Stash
                if(activePassives.some(p=>p.id==='p6')){
                  setStash(ps=>Math.min(MAX_STASH,ps+3))
                  addLog('🎭 Cult Following! +3 Stash.')
                }
                addFloat('TOO STONED',getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-60,'#888',false)
              } else {
                ns2[ti]=Object.assign({},ns2[ti],{hp:Math.max(0,newHp),stoneShield:false})
              }
              addFloat(actualDmg,getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-50,'#ff3300',false)
            }
            const allStoned=ns2.filter(function(m){return m}).every(function(m){return m.tooStoned})
            if(allStoned){discover('allstoned','TOTAL WIPEOUT');setDeathCause('fallen');setTimeout(function(){setGameState('end')},800)}
            return ns2
          })
          setDamageFlash(true);setTimeout(function(){setDamageFlash(false)},400)
          addLog('👁 '+enemy.name+' hits '+target.name+' for '+actualDmg+varLabel)
          setDiceTarget(null)
          setTimeout(function(){
            let nh=[...handRef.current],nd=[...deckRef.current],ndisc=[...discRef.current];
            while(nh.length<HAND_SIZE){
              if(nd.length===0){
                if(ndisc.length===0)break;
                nd=[...ndisc].sort(()=>Math.random()-.5);
                ndisc=[];
              }
              nh=[...nh,nd[0]];nd=nd.slice(1);
            }
            setHand(nh);setDeck(nd);setDiscardPile(ndisc);
            playDraw();
            // ANCHOR keyword: heal adjacent members after Strike
            setStage(function(prev){
              const ns=[...prev];
              prev.forEach(function(m,i){
                if(m&&!m.tooStoned&&m.keyword==='ANCHOR'){
                  if(i>0&&ns[i-1]&&!ns[i-1].tooStoned)ns[i-1]=Object.assign({},ns[i-1],{hp:Math.min(ns[i-1].maxHp,ns[i-1].hp+1)});
                  if(i<4&&ns[i+1]&&!ns[i+1].tooStoned)ns[i+1]=Object.assign({},ns[i+1],{hp:Math.min(ns[i+1].maxHp,ns[i+1].hp+1)});
                }
              });
              return ns;
            });
            setAnimPhase('idle');setSelected([]);
            // Check out-of-strikes death AFTER this strike resolves
            setStrikesLeft(function(cur){
              if(cur<=0){
                setDeathCause('stoned');
                setTimeout(function(){setGameState('end')},800);
              }
              return cur;
            });
          },900)
        },1200)
      },delay+400)
    },delay+200)
  },[animPhase,strikesLeft,enemyHp,stage,hand,deck,discardPile,enemy,embers,pendingEmbers,fightIndex,bossRef,stageRefs,drawUpTo,triggerVictory,bossRageAtk,bossDebuff])

  const handleShopLeave=useCallback(()=>{
    const nextIdx=Math.min(fightIndex+1, 26)
    setFightIndex(nextIdx)
    const nextEnemy=ENEMIES[nextIdx]
    setEnemy(nextEnemy);setEnemyHp(nextEnemy.maxHp)
    setEmbers(function(){return maxEmbers});setStrikesLeft(MAX_STRIKES);setDiscardsLeft(MAX_DISCARDS)
    setStageDiveUsed(false);setAnimPhase('idle');setSelected([]);setProjectiles([]);setBossDebuff(0);setBossRageAtk(0);setNextCardFree(false);setSkipNextDiscard(false);setShredderUsed(false);setLastRiffPlayed(null)
    // Re-roll DOUBLE TIME for next fight
    const nd=stage.some(m=>m&&m.role==='Drummer')
    const ndCount=stage.filter(m=>m&&m.role==='Drummer').length
    if(nd){let r=Math.floor(Math.random()*6)+1;if(ndCount>=2&&r<=2)r=Math.floor(Math.random()*6)+1;setDblRoll(r)}else setDblRoll(null)
    setStage(p=>p.map(m=>m?Object.assign({},m,{tooStoned:false,hp:m.maxHp,buffCount:0,tempBuff:false,encoreReady:false,stoneShield:false}):null))
    // Redeal hand from current deck+discard
    setDeck(function(curDeck){
      setDiscardPile(function(curDisc){
        const allCards=[...curDeck,...curDisc].sort(()=>Math.random()-.5)
        const newHand=allCards.slice(0,HAND_SIZE)
        const newDeck=allCards.slice(HAND_SIZE)
        setHand(newHand)
        setTimeout(()=>setDiscardPile([]),0)
        return newDeck
      })
      return curDeck
    })
    addLog('⛧ Fight '+(nextIdx+1)+': '+nextEnemy.name+' awaits!')
    // ── ARTIFACT FIGHT-START EFFECTS ───────────────────────
    // A1: Vintage Guitar — lead guitarist +1 ATK
    const hasVintageGuitar=activeArtifacts.some(a=>a.id==='a1')
    // A2: Devil's Tuning Fork — start at 15% corruption (applied below)
    const hasDevilsFork=activeArtifacts.some(a=>a.id==='a2')
    // A3: Evil Eye — first card each Strike free (state reset each fight)
    if(activeArtifacts.some(a=>a.id==='a3'))setNextCardFree(true)
    // A4: Roadie's Toolbelt — random member Stonewall
    const hasToolbelt=activeArtifacts.some(a=>a.id==='a4')
    // A7: Serpent's Kiss — handled via maxEmbers permanently
    // A8: Stone Tablet — handled via maxHp permanently
    // A10: Burning Stage bonus embers
    const burnBonus=pendingBurningStage?5:0
    if(pendingBurningStage)setPendingBurningStage(false)
    // ── PASSIVE FIGHT-START EFFECTS ──────────────────────────
    const hasP1=activePassives.some(p=>p.id==='p1') // +1 ember
    const hasP2=activePassives.some(p=>p.id==='p2') // +3 HP random member
    const hasP8=activePassives.some(p=>p.id==='p8') // Stonewall all
    // Apply stage modifications
    setStage(prev=>{
      let ns=[...prev]
      // A1: Vintage Guitar — lead guitarist +1 ATK on fight start
      if(hasVintageGuitar){
        const li=ns.findIndex(m=>m&&m.role==='Lead Guitarist')
        if(li>=0)ns[li]=Object.assign({},ns[li],{atk:ns[li].atk+1})
      }
      // A4: Roadie's Toolbelt — random member Stonewall
      if(hasToolbelt){
        const actives=ns.map((m,i)=>m?i:-1).filter(i=>i>=0)
        if(actives.length>0){
          const ri=actives[Math.floor(Math.random()*actives.length)]
          ns[ri]=Object.assign({},ns[ri],{stoneShield:true})
        }
      }
      // P2: Roadie Crew — random member +3 HP
      if(hasP2){
        const actives=ns.map((m,i)=>m&&!m.tooStoned?i:-1).filter(i=>i>=0)
        if(actives.length>0){
          const ri=actives[Math.floor(Math.random()*actives.length)]
          ns[ri]=Object.assign({},ns[ri],{hp:Math.min(ns[ri].maxHp,ns[ri].hp+3)})
        }
      }
      // P8: Green Room — all members Stonewall
      if(hasP8){ns=ns.map(m=>m?Object.assign({},m,{stoneShield:true}):null)}
      return ns
    })
    // Corruption start (A2)
    if(hasDevilsFork)setCorruption(15)
    // Extra embers from Serpent's Kiss (P1 + burning stage)
    const extraEm=(hasP1?1:0)+burnBonus
    setEmbers(p=>Math.min(maxEmbers,p+extraEm))
    if(extraEm>0)addLog('🌿 Ember bonus: +'+(extraEm)+' (passives/artifacts)')
    // Roll DOUBLE TIME d6 if drummer is on stage
    const hasDrummer=stage.some(m=>m&&m.role==='Drummer')
    const drumCount3=stage.filter(m=>m&&m.role==='Drummer').length
    if(hasDrummer){
      let roll=Math.floor(Math.random()*6)+1
      if(drumCount3>=2&&roll<=2)roll=Math.floor(Math.random()*6)+1
      setDblRoll(roll)
    } else {
      setDblRoll(null)
    }
    setGameState('playing')
  },[fightIndex,maxEmbers,stage])

  const handleShopSpend=useCallback((cost,type,item)=>{
    if(stash<cost)return
    setStash(p=>p-cost)
    if(type==='card'){
      const nc=Object.assign({},item,{uid:Math.random().toString(36).slice(2),shopBought:true})
      setDeck(p=>[...p,nc])
      setShopBoughtIds(p=>[...p,nc.uid])
      addLog('🛒 Bought '+item.name+'!')
    } else if(type==='artifact'){
      if(activeArtifacts.length>=3){addLog('⚠ Artifact slots full! Max 3.');return}
      setActiveArtifacts(p=>[...p,item])
      // A7: Serpent's Kiss — permanent +1 max ember
      if(item.id==='a7')setMaxEmbers(p=>Math.min(8,p+1))
      // A8: Stone Tablet — permanent +3 max HP all members
      if(item.id==='a8')setStage(prev=>prev.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+3,hp:m.hp+3}):null))
      addLog('⚗ Artifact equipped: '+item.name+'!')
    } else if(type==='passive'){
      if(activePassives.length>=5){addLog('⚠ Passive slots full! Max 5.');return}
      setActivePassives(p=>[...p,item])
      addLog('💿 Passive equipped: '+item.name+'!')
    } else if(type==='recruit'){
      const count=item.members||2
      const real=ALL_MUSICIANS.filter(m=>!m.locked)
      const shuffled=[...real].sort(()=>Math.random()-.5).slice(0,count)
      const fc=item.foilChance||0,mc=item.mythicChance||0,dc=item.demonicChance||0
      const candidates=shuffled.map(m=>{
        const r=Math.random()
        if(dc&&r<dc)return{...m,demonic:true,mythic:false,foil:false}
        if(mc&&r<mc)return{...m,mythic:true,foil:false,demonic:false}
        if(fc&&r<fc)return{...m,foil:true,mythic:false,demonic:false}
        return{...m,foil:false,mythic:false,demonic:false}
      })
      setRecruitCandidates(candidates)
      setGameState('recruit')
    } else {addLog('📦 Purchased: '+item.name+'!')}
  },[stash])

  const handleRecruitPick=useCallback((member)=>{
    const tier=memberTier(member)
    if(member.demonic){
      const existing=stage.find(m=>m&&m.demonic)
      if(existing){setDemonicConflict({incoming:member,existing});setRecruitCandidates([]);return}
    }
    setStage(prev=>{
      const ns=[...prev]
      const idx=ns.findIndex(m=>!m)
      if(idx!==-1){
        const withUid={...member,uid:Math.random().toString(36).slice(2),roleBondWith:[],roleBondBonus:0}
        const bonded=applyMentorLink(withUid,ns)
        ns[idx]=bonded
        const tl=tier!=='base'?' ['+tier.toUpperCase()+']':''
        addLog('🎸 '+member.name+tl+' joins!'+(bonded.roleBondBonus>0?' 🔗 Bond +'+bonded.roleBondBonus+' ATK!':''))
      }
      return ns
    })
    setGameState('shop')
    setRecruitCandidates([])
  },[stage])

  const handleRecruitPass=useCallback(()=>{
    addLog('👋 No new members recruited.')
    setGameState('shop')
    setRecruitCandidates([])
  },[])

  const handleDemonicChoice=useCallback((keep,remove)=>{
    setStage(prev=>{
      const ns=breakMentorLink(remove,[...prev])
      const ri=ns.findIndex(m=>m&&m.uid===remove.uid)
      if(ri>=0)ns[ri]=null
      return ns
    })
    setDemonicConflict(null)
    addLog('⛧ '+keep.name+' reigns! '+remove.name+' is gone forever.')
    setGameState('shop')
  },[])

  const handlePawnSellMember=useCallback((member,slotIdx)=>{
    const bandSize=stage.filter(m=>m).length
    if(bandSize<=2){addLog('⚠ Cannot sell — need at least 2 members!');return}
    const price=member.demonic?69:5+(member.foil?3:0)+(member.mythic?8:0)
    setStage(prev=>{
      const ns=breakMentorLink(member,[...prev])
      ns[slotIdx]=null
      return ns
    })
    setStash(p=>Math.min(420,p+price))
    addLog('💰 Sold '+member.name+' for '+price+' stash.'+(member.roleBondBonus>0?' 🔗 Bond broken.':''))
  },[stage])

  const handlePawnSellCard=useCallback((card)=>{
    const price=card.rarity==='Rare'?4:card.rarity==='Uncommon'?2:1
    setDeck(p=>{ const idx=p.findIndex(c=>c.uid===card.uid); if(idx===-1)return p; const n=[...p]; n.splice(idx,1); return n })
    setStash(p=>Math.min(420,p+price))
    addLog('💰 Sold '+card.name+' for '+price+' stash.')
  },[])

  const handleReroll=useCallback(()=>{
    if(stash<rerollCost)return
    setStash(p=>Math.min(MAX_STASH,p-rerollCost));setRerollCost(p=>p+2)
    const cn=Math.floor(fightIndex/3)+1
    setShopCards(genShopCards(cn));addLog('🔄 Shop rerolled for '+rerollCost+' 🌿')
  },[stash,rerollCost,fightIndex])

  const handleReset=()=>{
    setGameState('booster');setFightIndex(0);setEnemy(ENEMIES[0]);setEnemyHp(ENEMIES[0].maxHp)
    setStage([null,null,null,null,null]);setDeck([]);setHand([]);setDiscardPile([])
    setEmbers(5);setMaxEmbers(5);setStash(0);setStrikesLeft(MAX_STRIKES);setDiscardsLeft(MAX_DISCARDS)
    setAnimPhase('idle');setSelected([]);setProjectiles([]);setStageDiveUsed(false);setCorruption(0);setDeathCause('fallen')
    setLog(['⛧ Starting fresh...']);setShopBoughtIds([])
    setActiveArtifacts([]);setActivePassives([]);setPendingBurningStage(false)
    setDiscovered(new Set())
    setStats({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0})
  }

  const canStrike=animPhase==='idle'&&strikesLeft>0&&enemyHp>0&&stage.some(m=>m&&!m.tooStoned)
  const canDiscard=animPhase==='idle'&&discardsLeft>0&&selected.length>0
  const won=fightIndex>=26&&enemyHp<=0
  // Corruption visual escalation
  const corruptLow=corruption>=40&&corruption<70
  const corruptHigh=corruption>=70&&corruption<100
  const corruptMax=corruption>=100
  const chromaStr=corruptMax?4:corruptHigh?2:corruptLow?1:0
  const parchmentFilter=corruptMax?'sepia(0.4) hue-rotate(330deg) saturate(1.8)':corruptHigh?'sepia(0.25) hue-rotate(340deg) saturate(1.4)':corruptLow?'sepia(0.1) saturate(1.1)':'none'
  const bgPulseAnim=corruption>=50?'bgPulse '+(corruption>=75?'1.5s':'3s')+' ease-in-out infinite':'none'

  if(gameState==='booster')return <BoosterScreen onComplete={startGame} seed={runSeed}/>
  if(demonicConflict)return <DemonicConflictScreen conflict={demonicConflict} onChoice={handleDemonicChoice}/>
  if(gameState==='recruit')return <RecruitScreen candidates={recruitCandidates} stage={stage} onPick={handleRecruitPick} onPass={handleRecruitPass}/>
  if(gameState==='shop')return <ShopScreen stash={stash} onSpend={handleShopSpend} onLeave={handleShopLeave} circleArtifact={circleArtifact} circlePassive={circlePassive} recruitPack={recruitPack} shopCards={shopCards} boosterPacks={boosterPacks} rerollCost={rerollCost} onReroll={handleReroll} fightIndex={fightIndex} activeArtifacts={activeArtifacts} activePassives={activePassives} starterArtifacts={STARTER_ARTIFACTS} starterPassives={STARTER_PASSIVES} stage={stage} deck={deck} discardPile={discardPile} onPawnSellMember={handlePawnSellMember} onPawnSellCard={handlePawnSellCard}/>
  if(gameState==='end')return <EndScreen won={won} cause={deathCause} stats={stats} seed={runSeed} onReset={handleReset} streakWins={streakWins} streakLosses={streakLosses} totalRuns={totalRunsPlayed} isDailyRun={isDailyRun} onDailyChallenge={()=>{setRunSeed(getDailySeed());setIsDailyRun(true);handleReset()}}/>

  return(
    <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',background:'var(--void)',overflow:'hidden',position:'relative',userSelect:'none'}}>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:8000,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px,transparent 4px,transparent 7px,rgba(0,0,0,0.10) 7px,rgba(0,0,0,0.10) 8px,transparent 8px,transparent 14px,rgba(0,0,0,0.04) 14px,rgba(0,0,0,0.04) 15px)',animation:'vhsDrift 8s ease-in-out infinite',mixBlendMode:'overlay'}}/>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:8001,animation:'vhsLine 12s linear infinite',background:'transparent'}}/>
      {damageFlash&&<div style={{position:'fixed',inset:0,zIndex:8500,pointerEvents:'none',background:'radial-gradient(ellipse at center,rgba(200,0,0,0.25),rgba(100,0,0,0.4))',animation:'flashFade 0.4s ease-out forwards'}}/>}
      {corruptHigh&&!corruptMax&&<div style={{position:'fixed',inset:0,zIndex:7999,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 40%,rgba(100,0,0,0.15) 100%)',animation:bgPulseAnim}}/>}
      {corruptMax&&<div style={{position:'fixed',inset:0,zIndex:7999,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 20%,rgba(140,0,0,0.3) 100%)',animation:'bgPulse 1s ease-in-out infinite'}}/>}
      {floats.map(f=><Float key={f.id} v={f.v} x={f.x} y={f.y} color={f.color} big={f.big} onDone={()=>remFloat(f.id)}/>)}
      {projectiles.map(p=><Projectile key={p.id} from={p.from} to={p.to} emoji={p.emoji} onDone={()=>setProjectiles(prev=>prev.filter(x=>x.id!==p.id))}/>)}
      {showDice&&diceTarget&&<DiceRoll target={diceTarget} onDone={()=>setShowDice(false)}/>}
      {hellquakeAnim&&<div style={{position:'fixed',inset:0,zIndex:9500,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20,background:'rgba(0,0,0,0.85)',animation:'fadeIn 0.1s ease'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.04) 3px,rgba(255,255,255,0.04) 4px)',animation:'interlaceFlicker 0.08s steps(1) infinite',pointerEvents:'none'}}/>
        <div style={{fontSize:120,animation:'throb 0.3s ease-in-out infinite',filter:`drop-shadow(-4px 0 rgba(255,0,0,0.8)) drop-shadow(4px 0 rgba(0,80,255,0.8))`}}>⛧</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:hellquakeAnim.color,textShadow:`-3px 0 rgba(255,0,0,0.8), 3px 0 rgba(0,80,255,0.7), 0 0 60px ${hellquakeAnim.color},0 0 120px ${hellquakeAnim.color}`,animation:'fadeIn 0.3s ease'}}>{hellquakeAnim.text}</div>
      </div>}
      {remasterOpen&&<RemasterModal cards={remasterCards} onConfirm={(delUids,copyUid)=>{
        setDeck(prev=>{
          const copyCard=prev.find(c=>c.uid===copyUid)||remasterCards.find(c=>c.uid===copyUid)
          const filtered=prev.filter(c=>!delUids.includes(c.uid))
          if(copyCard){const newCopy=Object.assign({},copyCard,{uid:Math.random().toString(36).slice(2)});filtered.push(newCopy)}
          return filtered
        })
        setRemasterOpen(false)
        addLog('🎙 Remastered: deleted 2, copied 1.')
      }} onClose={()=>setRemasterOpen(false)}/>}
      {setlistOpen&&<SetlistModal cards={setlistCards} onConfirm={(ordered)=>{
        setDeck(prev=>[...ordered,...prev.slice(setlistCards.length)])
        setSetlistOpen(false)
        addLog('📋 Setlist locked in.')
      }} onClose={()=>setSetlistOpen(false)}/>}
      {/* PARCHMENT */}
      <div style={{flex:'0 0 63%',margin:'0',borderRadius:'4px 4px 0 0',position:'relative',overflow:'visible',background:'linear-gradient(168deg,#cbb872 0%,#bfa85a 20%,#c8b060 40%,#baa050 60%,#c4a85c 80%,#b89e50 100%)',border:`2px solid ${corruptMax?'#660000':corruptHigh?'#7a2010':'#7a5820'}`,boxShadow:`inset 0 0 60px rgba(60,35,5,0.6),0 0 30px rgba(0,0,0,0.95)${corruptHigh?',0 0 60px rgba(120,0,0,0.3)':''}${corruptMax?',0 0 100px rgba(180,0,0,0.5)':''}`,filter:parchmentFilter,display:'flex',flexDirection:'column'}}>
        <div style={{position:'absolute',inset:5,border:'1px solid rgba(80,50,10,0.28)',pointerEvents:'none',zIndex:10,borderRadius:2}}/>
        <div style={{padding:'10px 16px 8px',position:'relative',zIndex:5,display:'flex',justifyContent:'center',borderBottom:'1px solid rgba(60,35,5,0.3)',flexShrink:0}}>
          <div style={{width:'100%',maxWidth:760,background:'rgba(8,0,0,0.55)',border:'2px solid rgba(160,20,0,0.8)',borderRadius:8,padding:'12px 20px 14px',animation:'bossGlow 2s ease-in-out infinite',boxShadow:'0 0 30px rgba(150,0,0,0.4),inset 0 0 40px rgba(80,0,0,0.3)'}}>
            <BossSection enemy={enemy} currentHp={enemyHp} isWiggling={isWiggling} innerRef={bossRef} debuff={bossDebuff} chromaStr={chromaStr} dblRoll={dblRoll}/>
          </div>
        </div>
        <div style={{position:'relative',zIndex:5,background:'rgba(20,11,3,0.42)',borderTop:'2px solid rgba(60,35,5,0.45)',flex:1,display:'flex',flexDirection:'column',justifyContent:'center',overflow:'visible'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'3px 16px 1px'}}>
            <div style={{flex:1,height:1,background:'rgba(60,35,5,0.2)'}}/>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:10,color:'#8a6838',opacity:.4,fontStyle:'italic',letterSpacing:4}}>— stage —</div>
            <div style={{flex:1,height:1,background:'rgba(60,35,5,0.2)'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 10px 12px 220px',justifyContent:'center',flex:1,position:'relative'}}>
            <div style={{display:'flex',flexDirection:'column',gap:8,alignSelf:'center',flexShrink:0,background:'rgba(0,0,0,0.22)',borderRadius:'0 6px 6px 0',padding:'8px 10px 8px 10px',borderRight:'1px solid rgba(140,90,20,0.35)',position:'absolute',left:0,top:'50%',transform:'translateY(-50%)'}}>
              {[0,1,2].map(i=>{const a=(activeArtifacts||[])[i];return(
                <div key={i} style={{position:'relative'}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-artip]');if(t)t.style.opacity='1'}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-artip]');if(t)t.style.opacity='0'}}>
                  {a?<div style={{width:80,height:105,border:'1px solid rgba(200,140,30,0.65)',borderRadius:5,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,background:'linear-gradient(180deg,rgba(40,24,6,0.95),rgba(20,12,3,0.95))',boxShadow:'0 0 10px rgba(200,140,20,0.25)',cursor:'help'}}><div style={{fontSize:22}}>{a.emoji}</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:6,letterSpacing:0.5,color:'#c8a040',textTransform:'uppercase',textAlign:'center',lineHeight:1.2,padding:'0 3px'}}>{a.name}</div></div>
                  :<div style={{width:80,height:105,border:'1px dashed rgba(200,160,50,0.32)',borderRadius:5,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,background:'rgba(30,18,4,0.65)'}}><div style={{fontSize:52,opacity:0.35,textShadow:'0 0 12px rgba(255,180,0,0.4)'}}>⛧</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:7,letterSpacing:1,color:'rgba(200,160,60,0.45)',textTransform:'uppercase',textAlign:'center',lineHeight:1.2}}>Artifact</div></div>}
                  {a&&<div data-artip="" style={{opacity:0,transition:'opacity 0.15s',position:'absolute',left:88,top:0,zIndex:9999,pointerEvents:'none',minWidth:180,maxWidth:240,background:'rgba(12,7,2,0.97)',border:'1px solid rgba(200,140,30,0.6)',borderRadius:6,padding:'8px 10px',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:700,color:'#e8c060',marginBottom:4}}>{a.emoji} {a.name}</div>
                    <div style={{fontFamily:"'ScratchFont',serif",fontSize:9,color:'#9a8050',fontStyle:'italic',lineHeight:1.4}}>{a.effect}</div>
                  </div>}
                </div>
              )})}
            </div>
            {stage.map((m,i)=>(
              <StageSlot key={i} member={m} slotIdx={i}
                isAttacking={animPhase==='attacking'&&m&&!m.tooStoned}
                isDiceTarget={diceTarget&&m&&diceTarget.id===m.id}
                innerRef={function(el){stageRefs.current[i]={current:el}}}
                onDragStart={function(){if(m)setDragStageIdx(i)}}
                onDragOver={function(){}}
                onDrop={function(){handleStageDrop(i)}}
                bondColor={m?getBondColor(m,stage):null}
              />
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'4px 20px 6px',position:'relative',zIndex:5,flexShrink:0,borderTop:'1px solid rgba(60,35,5,0.18)',background:'rgba(10,6,2,0.28)'}}>
          {(()=>{
            const act=stage.filter(m=>m&&!m.tooStoned)
            let dmg=act.filter(m=>m.role!=='Drummer').reduce((s,m)=>{
              const effAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/15):m.atk
              return s+effAtk
            },0)
            const dbl=act.some(m=>m.role==='Drummer')
            if(dbl)dmg*=2
            const buf=act.filter(m=>(m.buffCount||0)>0).length
            const bon=buf>=5?1.35:buf>=4?1.20:buf>=3?1.10:1
            const fin=Math.round(dmg*bon)
            return <>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:34,color:'#c8a060',fontWeight:700,textShadow:'0 0 10px rgba(200,160,60,0.6)'}}>combined attack</span>
              <span key={fin} style={{fontFamily:"'MBScribblesFont',serif",fontSize:34,fontWeight:900,color:'#cc1111',textShadow:'0 0 20px rgba(180,0,0,0.8)',animation:'attackPulse 0.5s ease-out',display:'inline-block'}}>{fin}</span>
              {bon>1&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#e8a820',letterSpacing:1}}>+{Math.round((bon-1)*100)}% SYNERGY</span>}
              <span style={{color:'#6a3010',opacity:.5,fontSize:14}}>⟶</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#c8a060',fontWeight:700}}>{enemy.name}</span>
            </>
          })()}
        </div>
      </div>

      {/* HAND AREA */}
      <div style={{flex:'0 0 420px',background:'rgba(0,0,0,0.90)',borderTop:'1px solid rgba(100,55,10,0.5)',padding:'0',display:'flex',flexDirection:'column',zIndex:30,minHeight:0,position:'relative'}}>
        <div style={{textAlign:'center',padding:'6px 0 0',flexShrink:0,position:'relative',zIndex:0}}>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:3,color:'#8a0000',textTransform:'uppercase',textShadow:'0 0 10px rgba(120,0,0,0.4)'}}>Your Hand — {hand.length} of {HAND_SIZE}</span>
          {pendingEmbers>0&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#ff6600',marginLeft:12}}>+{pendingEmbers} 🔥 pending</span>}
        </div>

        {/* LEFT COLUMN: Deck/Discard — absolutely positioned */}
        <div style={{position:'absolute',left:0,top:0,bottom:0,zIndex:60,display:'flex',flexDirection:'column',gap:10,alignItems:'center',justifyContent:'center',background:'rgba(20,12,4,0.7)',borderRadius:'0 6px 6px 0',padding:'12px 14px',border:'1px solid rgba(100,65,15,0.3)',borderLeft:'none',minWidth:90}}>
          <DeckPile count={deck.length} label="Deck"/>
          <DeckPile count={discardPile.length} label="Discard"/>
        </div>

        {/* ACTIVE PASSIVES/ARTIFACTS PANEL — toggleable */}
        {activePassives.length>0&&<div style={{position:'absolute',right:231,bottom:0,zIndex:60,maxWidth:240}}
          onMouseEnter={e=>{const d=e.currentTarget.querySelector('[data-passdetail]');if(d)d.style.display='block'}}
          onMouseLeave={e=>{const d=e.currentTarget.querySelector('[data-passdetail]');if(d)d.style.display='none'}}>
          <div style={{background:'rgba(10,5,2,0.95)',border:'1px solid rgba(80,60,160,0.45)',borderRadius:'6px 0 0 6px',padding:'7px 10px',cursor:'help'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:7,letterSpacing:2,color:'#6070a0',textTransform:'uppercase',marginBottom:4}}>💿 Passives</div>
            {activePassives.map((p,i)=><div key={i} style={{fontSize:11,color:'#8090c0',fontFamily:"'MBScribblesFont',serif",marginBottom:2}}>{p.emoji} {p.name}</div>)}
            <div data-passdetail="" style={{display:'none',marginTop:8,borderTop:'1px solid rgba(80,60,160,0.3)',paddingTop:6}}>
              {activePassives.map((p,i)=><div key={i} style={{marginBottom:6}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#aabbee',fontWeight:700,marginBottom:1}}>{p.emoji} {p.name}</div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:8,color:'#7080aa',fontStyle:'italic',lineHeight:1.4}}>{p.effect}</div>
              </div>)}
            </div>
          </div>
        </div>}
        {/* RIGHT COLUMN: Buttons/Embers/Info — absolutely positioned */}
        <div style={{position:'absolute',right:0,top:0,bottom:0,zIndex:60,display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',justifyContent:'center',padding:'8px 22px 8px 12px',background:'rgba(10,5,2,0.6)',borderRadius:'6px 0 0 6px',border:'1px solid rgba(100,65,15,0.3)',borderRight:'none'}}>
          <button onClick={handleStrike} disabled={!canStrike}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'9px 20px',background:canStrike?'rgba(130,0,0,0.45)':'rgba(25,12,5,0.4)',border:`2px solid ${canStrike?'#cc1111':'#2a1508'}`,borderRadius:3,color:canStrike?'#ee2222':'#3a1a08',cursor:canStrike?'pointer':'not-allowed',textShadow:canStrike?'0 0 14px rgba(200,0,0,0.6)':'none',boxShadow:canStrike?'0 0 22px rgba(130,0,0,0.3)':'none',transition:'all 0.15s',width:190}}>⚔ Strike</button>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',width:190}}>
            <PhaseDots left={strikesLeft} total={MAX_STRIKES} color='#dd2222' wide={true}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:strikesLeft>0?'#dd2222':'#555',minWidth:32,textAlign:'right'}}>{strikesLeft}/{MAX_STRIKES}</span>
          </div>
          <div style={{height:8}}/>
          <button onClick={handleDiscard} disabled={!canDiscard}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'9px 20px',background:canDiscard?'rgba(100,70,0,0.4)':'rgba(25,15,5,0.4)',border:`2px solid ${canDiscard?'#cc9900':'#2a1a05'}`,borderRadius:3,color:canDiscard?'#f0c030':'#4a3010',cursor:canDiscard?'pointer':'not-allowed',textShadow:canDiscard?'0 0 14px rgba(220,160,0,0.6)':'none',boxShadow:canDiscard?'0 0 22px rgba(140,100,0,0.35)':'none',transition:'all 0.15s',width:190}}>↓ Discard</button>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',width:190}}>
            <PhaseDots left={discardsLeft} total={MAX_DISCARDS} color='#e8a820' wide={true}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:discardsLeft>0?'#e8a820':'#555',minWidth:32,textAlign:'right'}}>{discardsLeft}/{MAX_DISCARDS}</span>
          </div>
          <div style={{height:8}}/>
          <EmberDisplayLarge current={embers} max={maxEmbers}/>
          <div style={{height:6}}/>
          <div style={{display:'flex',gap:14,justifyContent:'flex-end',padding:'4px 0'}}>
            {[['Fight',(fightIndex%3+1)+'/3','#dd2222'],['Corrupt',corruption+'%',corruption>60?'#ff3300':'#aa5500'],['Stash',stash+(stash>=420?' 🔒':stash>=380?' ⚠':''),(stash>=420?'#ff3300':stash>=380?'#ff9900':'#44cc44')]].map(function(item){return(
              <div key={item[0]} style={{textAlign:'center',padding:'0 4px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#9a7a40',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>{item[0]}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:item[2],lineHeight:1}}>{item[1]}</div>
              </div>
            )})}
          </div>
        </div>

        {/* CARD FAN — takes full height, padded to avoid overlapping columns */}
        {/* Sort buttons — stacked vertically to the right of deck/discard */}
        <div style={{position:'absolute',left:119,bottom:32,zIndex:60,display:'flex',flexDirection:'column',gap:4}}>
          <button onClick={()=>setHandSort(p=>p==='embers'?'none':'embers')}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'8px 12px',width:100,background:handSort==='embers'?'rgba(200,120,20,0.45)':'rgba(10,6,2,0.85)',border:handSort==='embers'?'1px solid #e8a820':'1px solid rgba(100,65,15,0.5)',borderRadius:3,color:handSort==='embers'?'#e8a820':'#7a5a30',cursor:'pointer',textAlign:'center'}}>🔥 COST</button>
          <button onClick={()=>setHandSort(p=>p==='rarity'?'none':'rarity')}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'8px 12px',width:100,background:handSort==='rarity'?'rgba(200,120,20,0.45)':'rgba(10,6,2,0.85)',border:handSort==='rarity'?'1px solid #e8a820':'1px solid rgba(100,65,15,0.5)',borderRadius:3,color:handSort==='rarity'?'#e8a820':'#7a5a30',cursor:'pointer',textAlign:'center'}}>⭐ RARITY</button>
        </div>
        <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:50,paddingLeft:110,paddingRight:220,overflow:'visible',minHeight:0,position:'relative',zIndex:50}}>
          {(handSort==='none'?hand:handSort==='embers'?[...hand].sort((a,b)=>b.embers-a.embers):[...hand].sort((a,b)=>({'Common':0,'Uncommon':1,'Rare':2}[b.rarity]||0)-({'Common':0,'Uncommon':1,'Rare':2}[a.rarity]||0))).map((card,i)=>(
            <HandCard key={card.uid} card={card} index={i} total={hand.length} isUsed={card.id==='stagedive'&&stageDiveUsed} lastRiffPlayed={card.id==='demotape'?lastRiffPlayed:null}
              isHovered={hovered===card.uid} isSelected={selected.includes(card.uid)}
              anyHovered={hovered!==null}
              canAfford={card.embers===0||embers>=card.embers}
              isDragging={dragHandIdx===i} isShopBought={shopBoughtIds.includes(card.uid)}
              onHover={()=>setHovered(card.uid)} onLeave={()=>setHovered(null)}
              onClick={()=>setSelected(p=>p.includes(card.uid)?p.filter(x=>x!==card.uid):[...p,card.uid])}
              onDragStart={()=>{setDragHandIdx(i);setDragCardUid(card.uid)}}
              onDragEnd={()=>{setDragHandIdx(null);setDragOverHandIdx(null);setDragCardUid(null)}}
              isDragOver={dragOverHandIdx===i&&dragHandIdx!==null&&dragHandIdx!==i}
              onHandDragOver={()=>{if(dragHandIdx!==null&&dragHandIdx!==i)setDragOverHandIdx(i)}}
              onHandDrop={()=>handleHandReorder(dragHandIdx,i)}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
