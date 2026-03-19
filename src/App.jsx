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
    {name:'Garage Band Pack',emoji:'🎸',cost:10,desc:'Pick 1 of 2 random musicians.',members:2,foilChance:0},
    {name:'Touring Pack',emoji:'🎤',cost:22,desc:'Pick 1 of 3. 15% Foil chance.',members:3,foilChance:0.15},
    {name:'Demonic Pack',emoji:'⛧',cost:40,desc:'Pick 1 of 4. 25% Foil + 15% Mythic chance.',members:4,foilChance:0.25,mythicChance:0.15},
  ]
  return packs[Math.floor(Math.random()*packs.length)]
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
  return <div style={{position:'fixed',left:x,top:y,transform:'translateX(-50%)',fontFamily:"'Cinzel',serif",fontSize:big?'4.5rem':'2.8rem',fontWeight:900,color:color,textShadow:`0 0 24px ${color}`,pointerEvents:'none',zIndex:9000,animation:'floatUp 1.4s ease-out forwards'}}>{typeof v==='number'&&v>0?'-'+v:v}</div>
}

function DiceRoll({target,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,1200);return ()=>clearTimeout(t)},[])
  return(
    <div style={{position:'fixed',left:'50%',top:'40%',transform:'translate(-50%,-50%)',zIndex:9100,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:8,animation:'fadeIn 0.2s ease'}}>
      <div style={{fontSize:56,animation:'wiggle 0.4s ease infinite'}}>🎲</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,color:'#e8a820',letterSpacing:2,textShadow:'0 0 12px rgba(232,168,32,0.8)',background:'rgba(0,0,0,0.8)',padding:'6px 16px',borderRadius:4,border:'1px solid rgba(232,168,32,0.4)'}}>TARGET: {target&&target.name}</div>
    </div>
  )
}

function EmberDisplayLarge({current,max}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'#aa5820',letterSpacing:3,textTransform:'uppercase',fontWeight:700}}>Embers</div>
      <div style={{display:'flex',gap:5}}>
        {Array.from({length:max}).map((_,i)=>(
          <div key={i} style={{fontSize:i>=(max-current)?22:18,opacity:i>=(max-current)?1:0.18,filter:i>=(max-current)?'drop-shadow(0 0 8px rgba(255,120,0,0.9))':'grayscale(1)',transition:'all 0.25s'}}>🔥</div>
        ))}
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:18,fontWeight:900,color:current>0?'#ff6600':'#444',lineHeight:1}}>{current}/{max}</div>
    </div>
  )
}
function EmberDisplay({current,max}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'#8a4820',letterSpacing:3,textTransform:'uppercase'}}>Embers</div>
      <div style={{display:'flex',gap:3}}>
        {Array.from({length:max}).map((_,i)=>(
          <div key={i} style={{fontSize:i>=(max-current)?15:13,opacity:i>=(max-current)?1:0.22,filter:i>=(max-current)?'drop-shadow(0 0 6px rgba(255,100,0,0.8))':'grayscale(1)',transition:'all 0.25s'}}>🔥</div>
        ))}
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:900,color:current>0?'#ff6600':'#444',lineHeight:1}}>{current}/{max}</div>
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
    <div style={{position:'fixed',inset:0,zIndex:9800,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'24px 20px',overflowY:'auto'}}>
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:52,color:'#cc1111',textShadow:'0 0 40px rgba(180,0,0,0.8),0 0 80px rgba(140,0,0,0.5),3px 3px 0 #000',flexShrink:0}}>Opening Night</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:18,color:'#a09060',fontStyle:'italic',flexShrink:0}}>Select 2 musicians to start your band</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'#4a3a20',letterSpacing:2,flexShrink:0}}>RUN SEED: {seed.toString(16).toUpperCase()}</div>

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
              <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:26,color:isSel?'#e8d090':'#c8b878',textAlign:'center',padding:'5px 4px 1px',lineHeight:1}}>{m.name}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,color:'#7a6a40',textAlign:'center',padding:'3px 4px 8px',textTransform:'uppercase'}}>{m.role}</div>
              {/* Stat bar — locked vs normal */}
              {m.locked?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'18px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)',gap:6}}>
                  <div style={{fontSize:30,opacity:0.5}}>🔒</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:8,color:'#5a4020',letterSpacing:2,textAlign:'center',textTransform:'uppercase'}}>Can you find the key?</div>
                </div>
              ):(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:'#ee2222',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:38,fontWeight:900,color:'#ee2222',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:kwc,fontWeight:700,textAlign:'center',letterSpacing:0.5,maxWidth:80}}>{kw}</div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:'#33dd33',textTransform:'uppercase',fontWeight:900}}>HP</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:38,fontWeight:900,color:'#33dd33',lineHeight:1}}>{m.hp}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ABILITY EXPLANATION BOX */}
      <div style={{background:'rgba(10,6,2,0.85)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:8,padding:'20px 28px',width:'960px',flexShrink:0,marginTop:8}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:13,letterSpacing:4,color:'#8a6020',textTransform:'uppercase',textAlign:'center',marginBottom:16}}>⚗ Band Abilities — What Do They Mean?</div>
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
                <div style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,color:color,letterSpacing:1,marginBottom:5}}>{kw}</div>
                <div style={{fontFamily:"'IM Fell English',serif",fontSize:15,color:'#c0a870',lineHeight:1.45,fontStyle:'italic'}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>sel.length===2&&onComplete(sel)} disabled={sel.length<2}
        style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'14px 52px',background:'rgba(130,0,0,0.35)',border:'2px solid #cc1111',borderRadius:3,color:'#ee2222',cursor:sel.length===2?'pointer':'default',transition:'all 0.2s',flexShrink:0,boxShadow:'0 0 22px rgba(180,0,0,0.5)',opacity:sel.length===2?1:0.45,textShadow:'0 0 14px rgba(200,0,0,0.6)'}}>
        {sel.length===2?'⛧  Take the Stage':'Select 2 Musicians'}
      </button>
    
    </div>
  )
}

function ShopScreen({stash,onSpend,onLeave,circleArtifact,recruitPack,shopCards,boosterPacks,rerollCost,onReroll,fightIndex,activeArtifacts,activePassives,starterArtifacts,starterPassives}){
  const [pawnMode,setPawnMode]=useState(false)
  const [pawnSalesLeft,setPawnSalesLeft]=useState(2)
  const circleNum=Math.floor(fightIndex/3)+1
  const stashColor=stash>=420?'#ff3300':stash>=380?'#ff9900':'#44cc44'
  const stashLabel=stash>=420?'🔒 CAPPED':stash>=380?'⚠ '+stash:stash
  function buyCard(card){
    const price=cardPrice(card)
    if(stash<price)return
    onSpend(price,'card',card)
  }
  return(
    <div style={{position:'fixed',inset:0,zIndex:9500,background:'rgba(3,2,1,0.97)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* HEADER */}
      <div style={{padding:'12px 20px',borderBottom:'1px solid rgba(100,60,10,0.5)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:28,color:'#d0b060'}}>⚰ The Black Market</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'#6a4820',letterSpacing:2}}>CIRCLE {circleNum} SHOP</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>🌿</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900,color:stashColor}}>{stashLabel}</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'#4a6a4a',letterSpacing:2,textTransform:'uppercase'}}>Stash</span>
          </div>
          <button onClick={onLeave} style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,letterSpacing:3,textTransform:'uppercase',padding:'10px 24px',background:'rgba(130,0,0,0.3)',border:'2px solid #882200',borderRadius:3,color:'#dd4422',cursor:'pointer'}}>
            ⛧ Next Fight
          </button>
        </div>
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* LEFT COLUMN — Artifact + Passive + Recruitment */}
        <div style={{width:200,flexShrink:0,borderRight:'1px solid rgba(80,50,10,0.4)',padding:'12px 10px',display:'flex',flexDirection:'column',gap:12,overflowY:'auto'}}>
          {/* Circle Artifact — persists this circle */}
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:7,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:6}}>⚗ Artifact — Circle {circleNum}</div>
            <div style={{background:'linear-gradient(180deg,#1e1408,#0e0804)',border:'2px solid #c87820',borderRadius:6,padding:'8px',boxShadow:'0 0 18px rgba(200,120,20,0.22)'}}>
              <div style={{fontSize:26,textAlign:'center',marginBottom:4}}>{circleArtifact.emoji}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:'#e8c070',textAlign:'center',marginBottom:2}}>{circleArtifact.name}</div>
              <div style={{fontFamily:"'IM Fell English',serif",fontSize:9,color:'#9a8050',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6}}>{circleArtifact.effect}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:8,color:'#6a4820',textAlign:'center',marginBottom:6}}>🌿 {circleArtifact.cost} Stash</div>
              <button onClick={()=>stash>=circleArtifact.cost&&onSpend(circleArtifact.cost,'artifact',circleArtifact)} disabled={stash<circleArtifact.cost}
                style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'6px',background:stash>=circleArtifact.cost?'rgba(200,120,20,0.22)':'rgba(20,12,5,0.5)',border:`1px solid ${stash>=circleArtifact.cost?'#c87820':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:stash>=circleArtifact.cost?'#e8a820':'#4a3010',cursor:stash>=circleArtifact.cost?'pointer':'not-allowed'}}>
                {stash>=circleArtifact.cost?'Buy':'Need '+circleArtifact.cost+' 🌿'}
              </button>
            </div>
          </div>

          {/* Recruitment Pack */}
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:7,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:6}}>🎸 Recruitment</div>
            <div style={{background:'linear-gradient(180deg,#181008,#0c0804)',border:'1px solid rgba(160,100,25,0.45)',borderRadius:6,padding:'8px'}}>
              <div style={{fontSize:20,textAlign:'center',marginBottom:3}}>{recruitPack.emoji}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:'#d0b060',textAlign:'center',marginBottom:2}}>{recruitPack.name}</div>
              <div style={{fontFamily:"'IM Fell English',serif",fontSize:9,color:'#8a7040',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6}}>{recruitPack.desc}</div>
              <button onClick={()=>stash>=recruitPack.cost&&onSpend(recruitPack.cost,'recruit',recruitPack)} disabled={stash<recruitPack.cost}
                style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'6px',background:stash>=recruitPack.cost?'rgba(100,70,10,0.28)':'rgba(20,12,5,0.5)',border:`1px solid ${stash>=recruitPack.cost?'rgba(160,110,30,0.5)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:stash>=recruitPack.cost?'#c8a040':'#4a3010',cursor:stash>=recruitPack.cost?'pointer':'not-allowed'}}>
                🌿 {recruitPack.cost} Stash
              </button>
            </div>
          </div>

          {/* Pawn Shop */}
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:7,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:6}}>🪙 Pawn Shop {pawnSalesLeft>0?'('+pawnSalesLeft+' left)':'(sold out)'}</div>
            <div style={{background:'rgba(15,8,3,0.8)',border:'1px solid rgba(100,60,10,0.35)',borderRadius:6,padding:'8px'}}>
              <div style={{fontFamily:"'IM Fell English',serif",fontSize:9,color:'#7a6040',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6}}>Sell cards, members, or artifacts for Stash. Max 2 items.</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:'#5a4020',marginBottom:4}}>
                Common: 1 🌿 · Uncommon: 2 🌿 · Rare: 4 🌿<br/>Foil +3 · Mythic +8 · Member: 5 🌿
              </div>
              <button onClick={()=>pawnSalesLeft>0&&setPawnMode(p=>!p)}
                style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'5px',background:pawnMode?'rgba(120,80,10,0.4)':'rgba(60,40,10,0.2)',border:'1px solid rgba(140,90,20,0.4)',borderRadius:2,color:pawnSalesLeft>0?'#c8a040':'#4a3010',cursor:pawnSalesLeft>0?'pointer':'not-allowed'}}>
                {pawnMode?'✕ Cancel Pawn':'💰 Pawn Item'}
              </button>
            </div>
          </div>
        </div>

        {/* CENTER — Cards + Packs */}
        <div style={{flex:1,padding:'12px 14px',display:'flex',flexDirection:'column',gap:12,overflowY:'auto'}}>
          {/* Cards for Sale */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase'}}>🃏 Cards for Sale</div>
              <button onClick={onReroll} style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'4px 10px',background:'rgba(60,40,10,0.3)',border:'1px solid rgba(120,80,20,0.4)',borderRadius:2,color:'#8a6030',cursor:'pointer'}}>🔄 Reroll ({rerollCost} 🌿)</button>
            </div>
            <div style={{display:'flex',gap:10}}>
              {shopCards.map((card,i)=>{
                const price=cardPrice(card)
                const canBuy=stash>=price
                const bc=card.isMember?'#e8a820':card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
                return(
                  <div key={i} style={{flex:1,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:`1px solid ${bc}55`,borderRadius:6,overflow:'hidden',opacity:canBuy?1:0.6,position:'relative'}}>
                    <div style={{height:4,background:bc}}/>
                    {card.isMember&&<div style={{position:'absolute',top:6,left:6,background:'rgba(232,168,32,0.3)',border:'1px solid #e8a820',borderRadius:3,padding:'1px 5px',fontFamily:"'Cinzel',serif",fontSize:7,color:'#e8a820',letterSpacing:1}}>MEMBER</div>}
                    <div style={{padding:'8px'}}>
                      <div style={{height:46,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,background:'rgba(0,0,0,0.3)',borderRadius:3,marginBottom:4}}>{card.emoji}</div>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:2,lineHeight:1.2}}>{card.name}</div>
                      {!card.isMember&&<div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:bc,textAlign:'center',letterSpacing:1.5,marginBottom:3}}>{card.type} · {card.rarity}</div>}
                      {!card.isMember&&<div style={{fontFamily:"'IM Fell English',serif",fontSize:9,color:'#9a8060',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6,minHeight:26}}>{card.effect}</div>}
                      {card.isMember&&<div style={{fontFamily:"'IM Fell English',serif",fontSize:9,color:'#9a8060',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6}}>{card.effect}</div>}
                      <button onClick={()=>canBuy&&buyCard(card)} disabled={!canBuy}
                        style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'5px',background:canBuy?'rgba(80,50,10,0.3)':'rgba(20,12,5,0.5)',border:`1px solid ${canBuy?'rgba(140,90,20,0.45)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:canBuy?'#c8a040':'#4a3010',cursor:canBuy?'pointer':'not-allowed'}}>
                        🌿 {price} Stash
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Starter Artifacts for Sale */}
          {activeArtifacts&&activeArtifacts.length<3&&<div style={{marginBottom:12}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:8}}>⚗ Artifacts ({activeArtifacts.length}/3 slots)</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {(starterArtifacts||[]).filter(a=>!activeArtifacts.some(ea=>ea.id===a.id)).slice(0,3).map((art,i)=>{
                const canBuy=stash>=art.cost
                return(
                  <div key={i} style={{flex:'1 1 120px',background:'linear-gradient(180deg,#1e1408,#0e0804)',border:`1px solid ${canBuy?'#c87820':'rgba(80,50,10,0.3)'}`,borderRadius:6,padding:'8px',opacity:canBuy?1:0.55}}>
                    <div style={{fontSize:20,textAlign:'center',marginBottom:3}}>{art.emoji}</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,color:'#e8c070',textAlign:'center',marginBottom:2}}>{art.name}</div>
                    <div style={{fontFamily:"'IM Fell English',serif",fontSize:8,color:'#9a8050',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6}}>{art.effect}</div>
                    <button onClick={()=>canBuy&&onSpend(art.cost,'artifact',art)} disabled={!canBuy}
                      style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'4px',background:canBuy?'rgba(200,120,20,0.22)':'rgba(20,12,5,0.5)',border:`1px solid ${canBuy?'#c87820':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:canBuy?'#e8a820':'#4a3010',cursor:canBuy?'pointer':'not-allowed'}}>
                      🌿 {art.cost}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>}

          {/* Starter Passives for Sale */}
          {activePassives&&activePassives.length<5&&<div style={{marginBottom:12}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:8}}>💿 Passives / CD-Rs ({activePassives.length}/5 slots)</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {(starterPassives||[]).filter(p=>!activePassives.some(ep=>ep.id===p.id)).slice(0,3).map((pas,i)=>{
                const canBuy=stash>=pas.cost
                return(
                  <div key={i} style={{flex:'1 1 120px',background:'linear-gradient(180deg,#14101e,#0a0812)',border:`1px solid ${canBuy?'rgba(100,80,200,0.5)':'rgba(50,40,80,0.3)'}`,borderRadius:6,padding:'8px',opacity:canBuy?1:0.55}}>
                    <div style={{fontSize:20,textAlign:'center',marginBottom:3}}>{pas.emoji}</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,color:'#aaddff',textAlign:'center',marginBottom:2}}>{pas.name}</div>
                    <div style={{fontFamily:"'IM Fell English',serif",fontSize:8,color:'#8080b0',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:6}}>{pas.effect}</div>
                    <button onClick={()=>canBuy&&onSpend(pas.cost,'passive',pas)} disabled={!canBuy}
                      style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'4px',background:canBuy?'rgba(80,60,180,0.22)':'rgba(20,12,5,0.5)',border:`1px solid ${canBuy?'rgba(100,80,200,0.5)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:canBuy?'#aaddff':'#4a3010',cursor:canBuy?'pointer':'not-allowed'}}>
                      🌿 {pas.cost}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>}

          {/* Booster Packs */}
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:8}}>📦 Booster Packs</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {boosterPacks.map((pack,i)=>{
                const canBuy=stash>=pack.cost
                return(
                  <div key={i} style={{flex:'1 1 140px',background:'linear-gradient(180deg,#1e1208,#0c0804)',border:`1px solid ${canBuy?'rgba(160,110,25,0.5)':'rgba(60,40,10,0.22)'}`,borderRadius:6,padding:'10px',opacity:canBuy?1:0.55}}>
                    <div style={{fontSize:22,textAlign:'center',marginBottom:4}}>{pack.emoji}</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:'#d0b060',textAlign:'center',marginBottom:2}}>{pack.name}</div>
                    <div style={{fontFamily:"'IM Fell English',serif",fontSize:9,color:'#8a7040',textAlign:'center',fontStyle:'italic',lineHeight:1.3,marginBottom:8}}>{pack.desc}</div>
                    <button onClick={()=>canBuy&&onSpend(pack.cost,'pack',pack)} disabled={!canBuy}
                      style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'6px',background:canBuy?'rgba(100,70,10,0.28)':'rgba(20,12,5,0.5)',border:`1px solid ${canBuy?'rgba(160,110,25,0.45)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:canBuy?'#c8a040':'#4a3010',cursor:canBuy?'pointer':'not-allowed'}}>
                      🌿 {pack.cost} Stash
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


function StageSlot({member,isAttacking,isDiceTarget,onDrop,onDragOver,onDragStart,innerRef}){
  const [over,setOver]=useState(false)
  const [showTip,setShowTip]=useState(false)
  if(!member){
    return <div ref={innerRef} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}}
      style={{width:230,height:345,border:`1px dashed ${over?'rgba(232,168,32,0.6)':'rgba(160,100,30,0.22)'}`,borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,background:over?'rgba(100,70,15,0.18)':'rgba(28,16,4,0.14)',transition:'all 0.2s'}}>
      <div style={{fontSize:28,opacity:.1}}>⛧</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:11,color:'rgba(160,100,30,0.28)',fontStyle:'italic'}}>empty</div>
    </div>
  }
  const st=member.tooStoned
  const buffCount=member.buffCount||0
  return(
    <div ref={innerRef} draggable onDragStart={onDragStart} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}} onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}
      style={{width:230,height:345,display:'flex',flexDirection:'column',background:st?'linear-gradient(180deg,#1a1a1a,#0a0a0a)':'linear-gradient(180deg,#1c1208,#0a0704)',
        border:isDiceTarget?'3px solid #e8a820':isAttacking?'2px solid #ff3300':over?'2px solid #e8a820':st?'1px solid #333':'2px solid rgba(190,120,25,0.85)',
        borderRadius:6,
        boxShadow:isDiceTarget?'0 0 30px rgba(232,168,32,0.7)':isAttacking?'0 0 40px rgba(255,50,0,0.8)':'0 6px 24px rgba(0,0,0,0.85)',
        transform:st?'rotate(15deg) scale(0.95)':'none',
        opacity:st?0.5:1,
        animation:(!st&&!isAttacking&&!isDiceTarget)?'throb 3s ease-in-out infinite':'none',
        transition:'border 0.2s, box-shadow 0.2s, opacity 0.3s, transform 0.3s',
        cursor:'grab',position:'relative'}}>
      {/* Keyword tooltip */}
      {showTip&&member&&KEYWORD_DESC[member.keyword]&&<div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',background:'rgba(8,4,2,0.97)',border:'1px solid rgba(160,100,25,0.6)',borderRadius:6,padding:'10px 14px',zIndex:9999,pointerEvents:'none',minWidth:200,maxWidth:260,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}><div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:900,color:'#e8a820',letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>{member.keyword}</div><div style={{fontFamily:"'IM Fell English',serif",fontSize:13,color:'#c8b080',lineHeight:1.5,fontStyle:'italic'}}>{KEYWORD_DESC[member.keyword]}</div></div>}
      {buffCount>0&&<div style={{position:'absolute',top:6,left:6,background:buffCount>=3?'#aa1111':'#9933cc',borderRadius:10,padding:'1px 6px',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,color:'#fff',zIndex:10,boxShadow:'0 0 8px rgba(0,0,0,0.6)'}}>+{buffCount}</div>}
      {isDiceTarget&&<div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:20}}>🎯</div>}
      <div style={{height:5,borderRadius:'6px 6px 0 0',background:st?'#333':'linear-gradient(90deg,#dd2222,#ff7700)',boxShadow:st?'none':'0 0 14px rgba(220,50,0,0.5)'}}/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,background:'rgba(0,0,0,0.3)',position:'relative',minHeight:100}}>
        {member.emoji}
        {st&&<div style={{position:'absolute',top:4,right:4,fontSize:22}}>💨</div>}
        {isAttacking&&<div style={{position:'absolute',inset:0,background:'rgba(255,50,0,0.12)',animation:'pulse 0.4s ease infinite alternate'}}/>}
      </div>
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:30,color:st?'#555':'#e8d8a0',textAlign:'center',padding:'10px 4px 3px',lineHeight:1}}>{member.name}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:1.5,color:st?'#444':'#8a7a50',textAlign:'center',padding:'4px 4px 8px',textTransform:'uppercase'}}>{member.role}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:st?'#555':'#ee2222',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>ATK</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:42,fontWeight:900,lineHeight:1,color:st?'#555':'#ee2222',textShadow:st?'none':'0 0 12px rgba(200,0,0,0.6)'}}>{member.atk}</div>
        </div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:st?'#555':'#e8a820',fontWeight:700,letterSpacing:1,textAlign:'center'}}>{member.keyword}</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:st?'#555':member.hp<=2?'#ff4400':'#33dd33',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>HP</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:42,fontWeight:900,lineHeight:1,color:st?'#555':member.hp<=2?'#ff4400':'#33dd33',textShadow:st?'none':'0 0 12px rgba(0,190,0,0.5)'}}>{member.hp}</div>
        </div>
      </div>
      <div style={{height:5,background:'rgba(0,0,0,0.5)',borderRadius:'0 0 6px 6px'}}><div style={{height:'100%',borderRadius:'0 0 6px 6px',background:st?'#333':'linear-gradient(90deg,#003800,#33dd33)',width:`${(member.hp/member.maxHp)*100}%`,transition:'width 0.4s ease'}}/></div>
    </div>
  )
}

function HandCard({card,index,total,isHovered,isSelected,anyHovered,canAfford,onHover,onLeave,onClick,onDragStart,onDragEnd,isDragging,isShopBought,isDragOver,onHandDragOver,onHandDrop,isUsed}){
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
        zIndex:isDragging?0:isHovered?9999:anyHovered?1:isSelected?50:Math.max(1,Math.round(10-Math.abs(index-mid))),
        boxShadow:isSelected?'0 0 0 2px #cc0000,0 0 22px rgba(200,0,0,0.75),0 0 45px rgba(180,0,0,0.4)':isShopBought?`0 0 12px ${bc}44`:isHovered?`0 36px 72px rgba(0,0,0,0.95),0 0 36px ${glow}`:'2px 4px 16px rgba(0,0,0,0.75)',
        opacity:isDragging?0.4:1,
        animation:shimmerAnim,
        margin:'0 -26px',userSelect:'none',willChange:isHovered?'transform':'auto'}}>
      <div style={{height:6,flexShrink:0,borderRadius:'7px 7px 0 0',background:bc,boxShadow:`0 0 14px ${glow}`}}/>
      {isUsed&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.85)',border:'2px solid #888',borderRadius:6,padding:'6px 14px',fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,color:'#888',letterSpacing:4,zIndex:20,pointerEvents:'none'}}>USED</div>}
      {card.embers>0?(
        <div style={{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',background:canAfford?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'rgba(40,20,5,0.9)',border:`2px solid ${canAfford?'#ff6600':'#4a2a10'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:900,color:canAfford?'#fff':'#5a3a10',boxShadow:canAfford?'0 0 10px rgba(255,100,0,0.6)':'none'}}>{card.embers}</div>
      ):(
        <div style={{position:'absolute',top:8,right:8,padding:'2px 5px',borderRadius:3,background:'rgba(200,120,20,0.22)',border:'1px solid #c87820',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,color:'#e8a820',letterSpacing:1}}>FREE</div>
      )}
      {card.foil&&<div style={{position:'absolute',top:8,left:28,padding:'2px 5px',borderRadius:3,background:'rgba(255,215,0,0.3)',border:'1px solid rgba(255,215,0,0.6)',fontFamily:"'Cinzel',serif",fontSize:7,fontWeight:700,color:'#ffd700',letterSpacing:1}}>✨FOIL</div>}
      {card.mythic&&<div style={{position:'absolute',top:8,left:28,padding:'2px 5px',borderRadius:3,background:'rgba(120,0,180,0.4)',border:'1px solid rgba(180,0,255,0.6)',fontFamily:"'Cinzel',serif",fontSize:7,fontWeight:700,color:'#cc44ff',letterSpacing:1}}>⛧MYTHIC</div>}
      {card.rarity==='Rare'&&<div style={{position:'absolute',top:8,left:8,padding:'2px 5px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'Cinzel',serif",fontSize:7,fontWeight:700,color:'#ffdd44',letterSpacing:1}}>RARE</div>}
      {card.rarity==='Uncommon'&&<div style={{position:'absolute',top:8,left:8,padding:'2px 5px',borderRadius:3,background:'rgba(100,150,200,0.18)',border:'1px solid rgba(150,200,255,0.28)',fontFamily:"'Cinzel',serif",fontSize:7,fontWeight:700,color:'#aaddff',letterSpacing:1}}>✦</div>}
      <div style={{height:115,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:54,background:'rgba(0,0,0,0.35)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at center,${bc}18,transparent 70%)`}}/>
        {card.emoji}
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,color:'#eedfc0',textAlign:'center',padding:'9px 6px 3px',letterSpacing:.4,lineHeight:1.2,borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,color:bc,textAlign:'center',padding:'3px 4px',letterSpacing:1.8,textTransform:'uppercase',flexShrink:0}}>{card.type}</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:13,color:'#b09870',textAlign:'center',padding:'4px 8px 8px',lineHeight:1.4,fontStyle:'italic',flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>{card.effect}</div>
    </div>
  )
}

function BossSection({enemy,currentHp,isWiggling,innerRef,debuff,chromaStr,dblRoll}){
  const pct=Math.max(0,(currentHp/enemy.maxHp)*100),isLow=currentHp<enemy.maxHp*.35
  return(
    <div ref={innerRef} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,animation:isWiggling?'wiggle 0.45s ease':'none',width:'100%'}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:21,letterSpacing:4,color:'#cc3300',textTransform:'uppercase',fontWeight:900,textShadow:'0 0 10px rgba(200,50,0,0.4)'}}>{enemy.circle} · {enemy.subtitle}</div>
      <div style={{display:'flex',alignItems:'center',gap:16,width:'100%'}}>
        <div style={{width:130,height:130,flexShrink:0,background:'radial-gradient(circle at 40% 35%,#3a0000,#080000)',border:`3px solid ${isLow?'#ff2222':'rgba(140,40,15,0.85)'}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,boxShadow:isLow?'0 0 40px rgba(220,0,0,0.7),0 0 80px rgba(150,0,0,0.3)':'0 0 20px rgba(120,0,0,0.5),0 0 40px rgba(80,0,0,0.2)',position:'relative',overflow:'hidden',transition:'all 0.5s'}}>
          {enemy.emoji}
          {isLow&&<div style={{position:'absolute',inset:0,background:'rgba(120,0,0,0.2)',animation:'pulse 1.2s ease infinite alternate'}}/>}
          {debuff>0&&<div style={{position:'absolute',bottom:4,right:4,background:'rgba(0,80,160,0.9)',border:'1px solid #4488ff',borderRadius:4,padding:'2px 5px',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,color:'#88aaff'}}>-{debuff}dmg</div>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:58,color:'#120804',lineHeight:1,marginBottom:8,textShadow:chromaStr>0?`-${chromaStr}px 0 rgba(255,0,0,0.5), ${chromaStr}px 0 rgba(0,80,255,0.4), 1px 1px 0 rgba(0,0,0,0.5)`:'1px 1px 0 rgba(0,0,0,0.5)'}}>{enemy.name}</div>
          <div style={{fontFamily:"'IM Fell English',serif",fontSize:25,color:'#1a1008',fontStyle:'italic',opacity:1,lineHeight:1.5,fontWeight:700}}>{enemy.passive}</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:18,color:'#1a1008',marginTop:6,letterSpacing:1,fontWeight:700}}>Base damage: {enemy.baseDmg} ± 2 per Strike</div>
        </div>
      </div>
      <div style={{width:'70%',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:13,letterSpacing:3,color:'#6a4a10',textTransform:'uppercase'}}>Vitality</span>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:28,fontWeight:900,color:isLow?'#ee2222':'#6a3010',transition:'color 0.5s'}}>{Math.max(0,currentHp)} / {enemy.maxHp}</span>
        </div>
        <div style={{width:'100%',height:28,background:'rgba(50,25,8,0.75)',border:'1px solid rgba(100,55,15,0.6)',borderRadius:2,overflow:'hidden',boxShadow:'inset 0 2px 6px rgba(0,0,0,0.7)',position:'relative'}}>
          {[25,50,75].map(pp=><div key={pp} style={{position:'absolute',top:0,bottom:0,left:`${pp}%`,width:1,background:'rgba(0,0,0,0.35)',zIndex:2}}/>)}
          <div style={{height:'100%',background:isLow?'linear-gradient(90deg,#660000,#cc0000,#ff2200)':'linear-gradient(90deg,#7a0000,#aa1100,#cc2200)',width:`${pct}%`,transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,color:'rgba(240,220,180,0.95)',letterSpacing:2,textShadow:'0 1px 3px rgba(0,0,0,0.99)'}}>{Math.max(0,currentHp)} HP REMAINING</div>
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
      <div style={{fontFamily:"'Cinzel',serif",fontSize:26,fontWeight:900,color:'#c8a060'}}>{count}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,color:'#6a5a30',textTransform:'uppercase'}}>{label}</div>
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
        <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:280,color:'rgba(180,180,180,0.06)',userSelect:'none',lineHeight:1}}>Vestibule</div>
      </div>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
        {/* Title */}
        <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:isStoned?110:90,color:isStoned?'#cc1111':isVictory?'#d8c9a8':'#7a0000',textShadow:isStoned?'-4px 0 rgba(255,0,0,0.9),4px 0 rgba(0,255,80,0.7),0 0 60px rgba(180,0,0,0.8),3px 3px 0 #000':isVictory?'0 0 60px rgba(210,160,20,0.5),3px 3px 0 #000':'0 0 60px rgba(100,0,0,0.6),3px 3px 0 #000'}}>{isStoned?'Stoned to the Bone':isVictory?'⛧ Victory ⛧':'Fallen'}</div>
        <div style={{fontFamily:"'IM Fell English',serif",fontSize:20,color:isStoned?'rgba(200,80,80,0.9)':'#a09060',fontStyle:'italic',textAlign:'center'}}>{isStoned?'The band ran out of herb.':isVictory?'All 9 circles conquered. Lucifer has fallen.':'The Vestibule claims another soul.'}</div>

        {/* Streak banner */}
        {streakMsg&&<div style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,color:streakWins>1?'#ff6600':'#aa4444',letterSpacing:3,padding:'6px 24px',background:'rgba(0,0,0,0.5)',border:`1px solid ${streakWins>1?'#ff6600':'#aa4444'}`,borderRadius:4}}>{streakMsg}</div>}

        {/* Stats grid */}
        <div style={{background:'rgba(20,12,4,0.85)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:8,padding:'20px 32px',minWidth:520}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:13,letterSpacing:4,color:'#8a6020',textTransform:'uppercase',textAlign:'center',marginBottom:14}}>Run Statistics</div>
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
                  <span style={{fontFamily:"'IM Fell English',serif",fontSize:16,color:'#7a6040',fontStyle:'italic'}}>{row[0]}</span>
                  <span style={{fontFamily:"'Cinzel',serif",fontSize:17,fontWeight:900,color:isVictory&&row[0]==='Circle Reached'?'#ffdd44':'#c8a060'}}>{row[1]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Seed + daily */}
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:'#5a4a20',letterSpacing:2}}>SEED: {seed.toString(16).toUpperCase()}</div>
          {isDailyRun&&<div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:'#e8a820',letterSpacing:2,padding:'3px 12px',border:'1px solid #e8a820',borderRadius:3}}>🌍 DAILY CHALLENGE</div>}
          <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'#4a3a18',cursor:'pointer',letterSpacing:1}}
            onClick={()=>navigator.clipboard&&navigator.clipboard.writeText(seed.toString(16).toUpperCase())}>📋 Copy Seed</div>
        </div>

        {/* Buttons */}
        <div style={{display:'flex',gap:16,marginTop:4}}>
          <button onClick={onReset}
            style={{fontFamily:"'Cinzel',serif",fontSize:18,letterSpacing:4,color:isVictory?'#ee2222':'#b09858',background:isVictory?'rgba(100,0,0,0.22)':'transparent',border:isVictory?'2px solid #7a0000':'1px solid rgba(90,60,20,0.5)',borderRadius:3,padding:'12px 40px',cursor:'pointer',textTransform:'uppercase'}}>
            {isVictory?'⛧ Play Again':'↺ Try Again'}
          </button>
          <button onClick={()=>onDailyChallenge&&onDailyChallenge()}
            style={{fontFamily:"'Cinzel',serif",fontSize:14,letterSpacing:3,color:'#e8a820',background:'rgba(50,35,5,0.4)',border:'1px solid #c87820',borderRadius:3,padding:'12px 28px',cursor:'pointer',textTransform:'uppercase'}}>
            🌍 Daily Challenge
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

function RecruitScreen({candidates,stage,onPick,onPass}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:9600,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:'40px 20px'}}>
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:44,color:'#d0b060',textShadow:'0 0 30px rgba(200,150,20,0.4)'}}>Recruit a Member</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:18,color:'#a09060',fontStyle:'italic'}}>Choose one musician to join your band — or pass</div>
      <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center',maxWidth:1000}}>
        {candidates.map(m=>{
          const alreadyOn=stage.some(s=>s&&s.id===m.id)
          const emptySlot=stage.findIndex(s=>!s)
          const canAdd=!alreadyOn&&emptySlot!==-1
          return(
            <div key={m.id} onClick={()=>canAdd&&onPick(m)}
              style={{width:200,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'1px solid rgba(160,100,25,0.5)',borderRadius:7,overflow:'hidden',cursor:canAdd?'pointer':'not-allowed',opacity:canAdd?1:0.4,transition:'all 0.2s',transform:canAdd?'none':'none'}}
              onMouseEnter={e=>{if(canAdd)e.currentTarget.style.transform='translateY(-6px) scale(1.03)';e.currentTarget.style.boxShadow='0 0 30px rgba(232,168,32,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
              <div style={{height:4,background:'linear-gradient(90deg,#e8a820,#ffcc44)'}}/>
              <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,background:'rgba(0,0,0,0.35)'}}>{m.emoji}</div>
              <div style={{padding:'8px 12px 12px'}}>
                <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:24,color:'#e8d090',textAlign:'center',marginBottom:2}}>{m.name}</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:2,color:'#8a7040',textAlign:'center',textTransform:'uppercase',marginBottom:8}}>{m.role}</div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'rgba(0,0,0,0.5)',borderRadius:4,marginBottom:6}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'#ee2222',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:28,fontWeight:900,color:'#ee2222',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,alignSelf:'center'}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'#e8a820',fontWeight:700}}>{m.keyword}</div>
                    {m.role==='Drummer'&&dblRoll!==null&&<div style={{fontFamily:"'Cinzel',serif",fontSize:8,fontWeight:900,color:dblRoll<=2?'#ff3333':dblRoll<=4?'#ff9900':'#33dd33',textAlign:'center',padding:'1px 5px',background:'rgba(0,0,0,0.6)',borderRadius:3,letterSpacing:0.5,whiteSpace:'nowrap'}}>{dblRoll<=2?'HALF ×0.5':dblRoll<=4?'OFF ×1.5':'DBL ×2'} [{dblRoll}]</div>}
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'#33dd33',textTransform:'uppercase',fontWeight:900}}>HP</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:28,fontWeight:900,color:'#33dd33',lineHeight:1}}>{m.hp}</div>
                  </div>
                </div>
                <div style={{fontFamily:"'IM Fell English',serif",fontSize:11,color:'#8a7040',textAlign:'center',fontStyle:'italic',lineHeight:1.3}}>{m.desc}</div>
                {alreadyOn&&<div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'#aa6600',textAlign:'center',marginTop:6,letterSpacing:1}}>ALREADY ON STAGE</div>}
                {!alreadyOn&&emptySlot===-1&&<div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'#aa2200',textAlign:'center',marginTop:6,letterSpacing:1}}>STAGE FULL</div>}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onPass}
        style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'12px 40px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:3,color:'#7a5020',cursor:'pointer',transition:'all 0.2s'}}
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
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:44,color:'#d0b060'}}>The Remaster</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:15,color:'#a09060',fontStyle:'italic',textAlign:'center'}}>
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
                <div style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:2}}>{card.name}</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:bc,textAlign:'center',letterSpacing:2,textTransform:'uppercase'}}>{card.type}</div>
              </div>
              <div style={{display:'flex',gap:4,padding:'4px 6px 8px'}}>
                <button onClick={()=>canDel&&toggleDelete(card.uid)}
                  style={{flex:1,padding:'4px 0',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:900,background:isDel?'rgba(180,0,0,0.4)':'rgba(60,20,10,0.4)',border:isDel?'1px solid #ee2222':'1px solid rgba(100,40,20,0.4)',borderRadius:2,color:isDel?'#ff4444':'#6a3020',cursor:canDel?'pointer':'not-allowed'}}>
                  {isDel?'✓ DEL':'✗ DEL'}
                </button>
                <button onClick={()=>canCopy&&setToCopy(isCopy?null:card.uid)}
                  style={{flex:1,padding:'4px 0',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:900,background:isCopy?'rgba(0,120,40,0.4)':'rgba(10,40,20,0.4)',border:isCopy?'1px solid #22aa44':'1px solid rgba(20,60,30,0.4)',borderRadius:2,color:isCopy?'#44dd44':'#2a5a30',cursor:canCopy?'pointer':'not-allowed'}}>
                  {isCopy?'✓ CPY':'+CPY'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:16}}>
        <button onClick={()=>ready&&onConfirm(toDelete,toCopy)} disabled={!ready}
          style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:ready?'rgba(30,130,30,0.3)':'rgba(20,20,20,0.3)',border:ready?'2px solid #22aa44':'1px solid #333',borderRadius:3,color:ready?'#44dd44':'#555',cursor:ready?'pointer':'not-allowed'}}>
          ✓ Apply
        </button>
        <button onClick={onClose}
          style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:'rgba(80,40,10,0.3)',border:'1px solid rgba(100,60,20,0.5)',borderRadius:3,color:'#8a6030',cursor:'pointer'}}>
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
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:48,color:'#d0b060'}}>Setlist</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:16,color:'#a09060',fontStyle:'italic'}}>Drag to reorder the top of your deck</div>
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
                <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:3}}>{card.name}</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:8,color:bc,textAlign:'center',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>{card.type}</div>
                <div style={{fontFamily:"'IM Fell English',serif",fontSize:10,color:'#b09870',textAlign:'center',fontStyle:'italic',lineHeight:1.4}}>{card.effect}</div>
              </div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'rgba(200,160,60,0.5)',textAlign:'center',padding:'4px',background:'rgba(0,0,0,0.4)'}}>#{i+1}</div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:16}}>
        <button onClick={()=>onConfirm(ordered)}
          style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:'rgba(30,130,30,0.3)',border:'2px solid #22aa44',borderRadius:3,color:'#44dd44',cursor:'pointer'}}>
          ✓ Lock In
        </button>
        <button onClick={onClose}
          style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'12px 40px',background:'rgba(80,40,10,0.3)',border:'1px solid rgba(100,60,20,0.5)',borderRadius:3,color:'#8a6030',cursor:'pointer'}}>
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
  const [rerollCost,setRerollCost]=useState(4)
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
    if(hasDrummer){const roll=Math.floor(Math.random()*6)+1;setDblRoll(roll)}
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
    if(hasDrummer){const r=Math.floor(Math.random()*6)+1;setDblRoll(r)}else setDblRoll(null)
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
      // Cast the last riff on the same slot
      const lrCopy=Object.assign({},lastRiffPlayed,{uid:'demotape-'+Math.random().toString(36).slice(2),embers:0})
      const ok2=applyCard(lrCopy,slotIdx)
      if(ok2){msg='📼 Demo Tape! Replays: '+lastRiffPlayed.name}
      else{return false}
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
      setTimeout(()=>setHellquakeAnim(null),2000)
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
    setStageDiveUsed(false);setAnimPhase('idle');setSelected([]);setProjectiles([]);setBossDebuff(0);setBossRageAtk(0);setNextCardFree(false);setSkipNextDiscard(false);setShredderUsed(false)
    // Re-roll DOUBLE TIME for next fight
    const nd=stage.some(m=>m&&m.role==='Drummer')
    if(nd){const r=Math.floor(Math.random()*6)+1;setDblRoll(r)}else setDblRoll(null)
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
    if(hasDrummer){
      const roll=Math.floor(Math.random()*6)+1
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
      // Pick random candidates from ALL_MUSICIANS (more options for better packs)
      const count=item.name.includes('Demonic')?6:item.name.includes('Experienced')?4:2
      const shuffled=[...ALL_MUSICIANS].sort(()=>Math.random()-.5)
      setRecruitCandidates(shuffled.slice(0,count))
      setGameState('recruit')
    } else {addLog('📦 Purchased: '+item.name+'!')}
  },[stash])

  const handleRecruitPick=useCallback((member)=>{
    // Find first empty slot on stage
    setStage(prev=>{
      const ns=[...prev]
      const idx=ns.findIndex(m=>!m)
      if(idx!==-1){
        ns[idx]=Object.assign({},member,{uid:Math.random().toString(36).slice(2)})
        addLog('🎸 '+member.name+' joins the band!')
      }
      return ns
    })
    setGameState('shop')
    setRecruitCandidates([])
  },[])

  const handleRecruitPass=useCallback(()=>{
    addLog('👋 No new members recruited.')
    setGameState('shop')
    setRecruitCandidates([])
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
  if(gameState==='recruit')return <RecruitScreen candidates={recruitCandidates} stage={stage} onPick={handleRecruitPick} onPass={handleRecruitPass}/>
  if(gameState==='shop')return <ShopScreen stash={stash} onSpend={handleShopSpend} onLeave={handleShopLeave} circleArtifact={circleArtifact} recruitPack={recruitPack} shopCards={shopCards} boosterPacks={boosterPacks} rerollCost={rerollCost} onReroll={handleReroll} fightIndex={fightIndex} activeArtifacts={activeArtifacts} activePassives={activePassives} starterArtifacts={STARTER_ARTIFACTS} starterPassives={STARTER_PASSIVES}/>
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
        <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:64,color:hellquakeAnim.color,textShadow:`-3px 0 rgba(255,0,0,0.8), 3px 0 rgba(0,80,255,0.7), 0 0 60px ${hellquakeAnim.color},0 0 120px ${hellquakeAnim.color}`,animation:'fadeIn 0.3s ease'}}>{hellquakeAnim.text}</div>
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
            <div style={{fontFamily:"'IM Fell English',serif",fontSize:10,color:'#8a6838',opacity:.4,fontStyle:'italic',letterSpacing:4}}>— stage —</div>
            <div style={{flex:1,height:1,background:'rgba(60,35,5,0.2)'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 10px 12px 220px',justifyContent:'center',flex:1,position:'relative'}}>
            <div style={{display:'flex',flexDirection:'column',gap:8,alignSelf:'center',flexShrink:0,background:'rgba(0,0,0,0.22)',borderRadius:'0 6px 6px 0',padding:'8px 10px 8px 10px',borderRight:'1px solid rgba(140,90,20,0.35)',position:'absolute',left:0,top:'50%',transform:'translateY(-50%)'}}>
              {[1,2,3].map(i=><div key={i} style={{width:80,height:105,border:'1px dashed rgba(200,160,50,0.32)',borderRadius:5,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,background:'rgba(30,18,4,0.65)'}}><div style={{fontSize:24,opacity:.28}}>⚗</div><div style={{fontFamily:"'Cinzel',serif",fontSize:7,letterSpacing:1,color:'rgba(200,160,60,0.45)',textTransform:'uppercase',textAlign:'center',lineHeight:1.2}}>Artifact</div></div>)}
            </div>
            {stage.map((m,i)=>(
              <StageSlot key={i} member={m} slotIdx={i}
                isAttacking={animPhase==='attacking'&&m&&!m.tooStoned}
                isDiceTarget={diceTarget&&m&&diceTarget.id===m.id}
                innerRef={function(el){stageRefs.current[i]={current:el}}}
                onDragStart={function(){if(m)setDragStageIdx(i)}}
                onDragOver={function(){}}
                onDrop={function(){handleStageDrop(i)}}
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
              <span style={{fontFamily:"'IM Fell English',serif",fontSize:17,color:'#3a2508',opacity:1,fontStyle:'italic'}}>combined attack</span>
              <span key={fin} style={{fontFamily:"'Cinzel',serif",fontSize:34,fontWeight:900,color:'#cc1111',textShadow:'0 0 20px rgba(180,0,0,0.8)',animation:'attackPulse 0.5s ease-out',display:'inline-block'}}>{fin}</span>
              {bon>1&&<span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'#e8a820',letterSpacing:1}}>+{Math.round((bon-1)*100)}% SYNERGY</span>}
              <span style={{color:'#6a3010',opacity:.5,fontSize:14}}>⟶</span>
              <span style={{fontFamily:"'IM Fell English',serif",fontSize:17,color:'#3a2508',opacity:1,fontStyle:'italic'}}>{enemy.name}</span>
            </>
          })()}
        </div>
      </div>

      {/* HAND AREA */}
      <div style={{flex:1,background:'rgba(0,0,0,0.90)',borderTop:'1px solid rgba(100,55,10,0.5)',padding:'0',display:'flex',flexDirection:'column',zIndex:30,minHeight:0,position:'relative'}}>
        <div style={{textAlign:'center',padding:'6px 0 0',flexShrink:0,position:'relative',zIndex:0}}>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:900,letterSpacing:3,color:'#8a0000',textTransform:'uppercase',textShadow:'0 0 10px rgba(120,0,0,0.4)'}}>Your Hand — {hand.length} of {HAND_SIZE}</span>
          {pendingEmbers>0&&<span style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'#ff6600',marginLeft:12}}>+{pendingEmbers} 🔥 pending</span>}
        </div>

        {/* LEFT COLUMN: Deck/Discard — absolutely positioned */}
        <div style={{position:'absolute',left:0,top:0,bottom:32,zIndex:60,display:'flex',flexDirection:'column',gap:14,alignItems:'center',justifyContent:'center',background:'rgba(20,12,4,0.7)',borderRadius:'0 6px 6px 0',padding:'12px 14px',border:'1px solid rgba(100,65,15,0.3)',borderLeft:'none',minWidth:90}}>
          <DeckPile count={deck.length} label="Deck"/>
          <DeckPile count={discardPile.length} label="Discard"/>
        </div>

        {/* ACTIVE PASSIVES/ARTIFACTS PANEL — toggleable */}
        {(activeArtifacts.length>0||activePassives.length>0)&&<div style={{position:'absolute',right:231,bottom:0,zIndex:60,maxWidth:180}}>
          <div style={{background:'rgba(10,5,2,0.95)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:'6px 0 0 6px',padding:'6px 8px'}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:7,letterSpacing:2,color:'#8a6020',textTransform:'uppercase',marginBottom:4}}>Active</div>
            {activeArtifacts.map((a,i)=><div key={i} style={{fontSize:11,color:'#c8a040',fontFamily:"'Cinzel',serif",marginBottom:1}}>{a.emoji} {a.name}</div>)}
            {activePassives.map((p,i)=><div key={i} style={{fontSize:11,color:'#8090c0',fontFamily:"'Cinzel',serif",marginBottom:1}}>{p.emoji} {p.name}</div>)}
          </div>
        </div>}
        {/* RIGHT COLUMN: Buttons/Embers/Info — absolutely positioned */}
        <div style={{position:'absolute',right:0,top:0,bottom:32,zIndex:60,display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',justifyContent:'center',padding:'8px 12px',background:'rgba(10,5,2,0.6)',borderRadius:'6px 0 0 6px',border:'1px solid rgba(100,65,15,0.3)',borderRight:'none'}}>
          <button onClick={handleStrike} disabled={!canStrike}
            style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'9px 20px',background:canStrike?'rgba(130,0,0,0.45)':'rgba(25,12,5,0.4)',border:`2px solid ${canStrike?'#cc1111':'#2a1508'}`,borderRadius:3,color:canStrike?'#ee2222':'#3a1a08',cursor:canStrike?'pointer':'not-allowed',textShadow:canStrike?'0 0 14px rgba(200,0,0,0.6)':'none',boxShadow:canStrike?'0 0 22px rgba(130,0,0,0.3)':'none',transition:'all 0.15s',width:190}}>⚔ Strike</button>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',width:190}}>
            <PhaseDots left={strikesLeft} total={MAX_STRIKES} color='#dd2222' wide={true}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:18,fontWeight:900,color:strikesLeft>0?'#dd2222':'#555',minWidth:32,textAlign:'right'}}>{strikesLeft}/{MAX_STRIKES}</span>
          </div>
          <div style={{height:8}}/>
          <button onClick={handleDiscard} disabled={!canDiscard}
            style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'9px 20px',background:canDiscard?'rgba(100,70,0,0.4)':'rgba(25,15,5,0.4)',border:`2px solid ${canDiscard?'#cc9900':'#2a1a05'}`,borderRadius:3,color:canDiscard?'#f0c030':'#4a3010',cursor:canDiscard?'pointer':'not-allowed',textShadow:canDiscard?'0 0 14px rgba(220,160,0,0.6)':'none',boxShadow:canDiscard?'0 0 22px rgba(140,100,0,0.35)':'none',transition:'all 0.15s',width:190}}>↓ Discard</button>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',width:190}}>
            <PhaseDots left={discardsLeft} total={MAX_DISCARDS} color='#e8a820' wide={true}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:18,fontWeight:900,color:discardsLeft>0?'#e8a820':'#555',minWidth:32,textAlign:'right'}}>{discardsLeft}/{MAX_DISCARDS}</span>
          </div>
          <div style={{height:8}}/>
          <EmberDisplayLarge current={embers} max={maxEmbers}/>
          <div style={{height:6}}/>
          <div style={{display:'flex',gap:14,justifyContent:'flex-end',padding:'4px 0'}}>
            {[['Fight',(fightIndex%3+1)+'/3','#dd2222'],['Corrupt',corruption+'%',corruption>60?'#ff3300':'#aa5500'],['Stash',stash+(stash>=420?' 🔒':stash>=380?' ⚠':''),(stash>=420?'#ff3300':stash>=380?'#ff9900':'#44cc44')]].map(function(item){return(
              <div key={item[0]} style={{textAlign:'center',padding:'0 4px'}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'#9a7a40',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>{item[0]}</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900,color:item[2],lineHeight:1}}>{item[1]}</div>
              </div>
            )})}
          </div>
        </div>

        {/* CARD FAN — takes full height, padded to avoid overlapping columns */}
        {/* Sort buttons — stacked vertically to the right of deck/discard */}
        <div style={{position:'absolute',left:119,bottom:32,zIndex:60,display:'flex',flexDirection:'column',gap:4}}>
          <button onClick={()=>setHandSort(p=>p==='embers'?'none':'embers')}
            style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'8px 12px',width:100,background:handSort==='embers'?'rgba(200,120,20,0.45)':'rgba(10,6,2,0.85)',border:handSort==='embers'?'1px solid #e8a820':'1px solid rgba(100,65,15,0.5)',borderRadius:3,color:handSort==='embers'?'#e8a820':'#7a5a30',cursor:'pointer',textAlign:'center'}}>🔥 COST</button>
          <button onClick={()=>setHandSort(p=>p==='rarity'?'none':'rarity')}
            style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'8px 12px',width:100,background:handSort==='rarity'?'rgba(200,120,20,0.45)':'rgba(10,6,2,0.85)',border:handSort==='rarity'?'1px solid #e8a820':'1px solid rgba(100,65,15,0.5)',borderRadius:3,color:handSort==='rarity'?'#e8a820':'#7a5a30',cursor:'pointer',textAlign:'center'}}>⭐ RARITY</button>
        </div>
        <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:30,paddingLeft:110,paddingRight:220,overflow:'visible',minHeight:0,position:'relative',zIndex:50}}>
          {(handSort==='none'?hand:handSort==='embers'?[...hand].sort((a,b)=>b.embers-a.embers):[...hand].sort((a,b)=>({'Common':0,'Uncommon':1,'Rare':2}[b.rarity]||0)-({'Common':0,'Uncommon':1,'Rare':2}[a.rarity]||0))).map((card,i)=>(
            <HandCard key={card.uid} card={card} index={i} total={hand.length} isUsed={card.id==='stagedive'&&stageDiveUsed}
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
