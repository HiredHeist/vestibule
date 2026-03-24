import { useState, useRef, useEffect, useCallback } from 'react'
let _uidCounter=Date.now()
function uid(){return(++_uidCounter).toString(36)}
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

// ── SCORE SYSTEM ──────────────────────────────────────────────────
function calcRunScore(stats, won){
  const s = stats
  const baseScore = Math.floor(
    (Math.min(9,Math.floor(s.fightsSurvived/3)+1)) * 1000 +
    s.fightsSurvived * 150 +
    (s.totalDamage||0) / 10 +
    (s.highestStrike||0) * 5 +
    (s.stashEarned||0) * 2 -
    (s.tooStonedCount||0) * 50 +
    (won ? 50000 : 0)
  )
  // Streak bonus: 3-day +5%, 7-day +10%, 30-day +20%
  const streak=parseInt(localStorage.getItem('vst_streak')||'0')
  const streakMult=streak>=30?1.20:streak>=7?1.10:streak>=3?1.05:1.0
  // Stake multiplier
  const stakeId=localStorage.getItem('vst_active_stake')||'bronze'
  const stakeMult=(STAKES.find(s=>s.id===stakeId)||STAKES[0]).scoreMult
  return Math.max(0, Math.round(baseScore*streakMult*stakeMult))
}
const SCORE_GRADES=[
  {min:0,     label:'GARAGE BAND',  color:'#888888'},
  {min:500,   label:'OPENING ACT',  color:'#aa8844'},
  {min:1000,  label:'LOCAL LEGEND', color:'#c8a060'},
  {min:2000,  label:'TOURING ACT',  color:'#44aacc'},
  {min:3500,  label:'HEADLINER',    color:'#aa44ff'},
  {min:6000,  label:'CULT LEGEND',  color:'#ee2222'},
  {min:9999,  label:'LUCIFER SLAYER',color:'#ffd700'},
]
function getScoreGrade(score, won){
  if(won) return SCORE_GRADES[SCORE_GRADES.length-1]
  let grade=SCORE_GRADES[0]
  for(const g of SCORE_GRADES){ if(score>=g.min) grade=g }
  // LUCIFER SLAYER only by actually winning
  if(grade.label==='LUCIFER SLAYER'&&!won) grade=SCORE_GRADES[SCORE_GRADES.length-2]
  return grade
}

// ── UNLOCK SYSTEM ──────────────────────────────────────────────
function isUnlocked(id,lt){
  const milestone=UNLOCK_MILESTONES.find(m=>m.id===id)
  if(!milestone)return true
  const score=lt!==undefined?lt:parseInt(localStorage.getItem('vst_lifetime')||'0')
  return score>=milestone.score
}
function getUnlockedCards(){const lt=parseInt(localStorage.getItem('vst_lifetime')||'0');return ALL_CARDS.filter(c=>!c.locked||isUnlocked(c.id,lt))}
function getUnlockedMusicians(){const lt=parseInt(localStorage.getItem('vst_lifetime')||'0');return ALL_MUSICIANS.filter(m=>!m.locked||isUnlocked(m.id,lt))}

// ── RUN HISTORY ──────────────────────────────────────────────
function saveRunHistory(stats,won,enemy,seed){
  try{
    const history=JSON.parse(localStorage.getItem('vst_history')||'[]')
    const circleReached=Math.floor((stats.fightsSurvived)/3)+1
    const entry={
      date:new Date().toISOString().slice(0,16).replace('T',' '),
      score:calcRunScore(stats,won),
      grade:getScoreGrade(calcRunScore(stats,won),won).label,
      circle:won?'WIN':circleReached,
      enemy:won?'Lucifer':(enemy?.name||'Unknown'),
      cause:won?'victory':'defeated',
      fights:stats.fightsSurvived,
      damage:stats.totalDamage,
      seed:seed?.toString(16).toUpperCase()||'???',
    }
    history.unshift(entry)
    if(history.length>20)history.length=20
    localStorage.setItem('vst_history',JSON.stringify(history))
  }catch(e){/* localStorage full or unavailable */}
}
function getRunHistory(){try{return JSON.parse(localStorage.getItem('vst_history')||'[]')}catch(e){return[]}}

// ── ACHIEVEMENT SYSTEM ──────────────────────────────────────────
const ACHIEVEMENTS=[
  {id:'first_blood',label:'First Blood',desc:'Win your first fight',emoji:'🗡'},
  {id:'circle_3',label:'Into the Deep',desc:'Reach Circle 3',emoji:'🔥'},
  {id:'circle_5',label:'Halfway to Hell',desc:'Reach Circle 5',emoji:'⛧'},
  {id:'circle_7',label:'The Abyss',desc:'Reach Circle 7',emoji:'🕳'},
  {id:'circle_9',label:'Treachery',desc:'Reach Circle 9',emoji:'🗝'},
  {id:'beat_lucifer',label:'Lucifer Slayer',desc:'Defeat Lucifer',emoji:'👑'},
  {id:'hellquake',label:'Hellquake Survivor',desc:'Trigger a Hellquake and survive',emoji:'⛧'},
  {id:'perfect_strike',label:'Perfect Strike',desc:'Kill a boss in 1 Strike',emoji:'⚔'},
  {id:'corruption_lord',label:'Corruption Lord',desc:'Reach 100% Corruption and win the fight',emoji:'🌀'},
  {id:'sober_run',label:'Sober Run',desc:'Reach Circle 5 without using any drugs',emoji:'☕'},
  {id:'high_score_5k',label:'Rising Star',desc:'Score over 5,000 in a single run',emoji:'⭐'},
  {id:'high_score_10k',label:'Headliner',desc:'Score over 10,000 in a single run',emoji:'🌟'},
  {id:'drug_lord',label:'Drug Lord',desc:'Use both shrooms and acid in one run',emoji:'🍄'},
  {id:'full_band',label:'Full House',desc:'Have 5 members on stage at once',emoji:'🎸'},
  {id:'mentor_link',label:'Master and Student',desc:'Form a Mentor Link',emoji:'⛓'},
  {id:'ten_runs',label:'Dedicated',desc:'Complete 10 runs',emoji:'🔟'},
]
function getAchievements(){try{return JSON.parse(localStorage.getItem('vst_achievements')||'[]')}catch(e){return[]}}
function unlockAchievement(id){
  const current=getAchievements()
  if(current.includes(id))return false
  current.push(id)
  localStorage.setItem('vst_achievements',JSON.stringify(current))
  return true
}

const ENEMIES=[
  // ── CIRCLE I: LIMBO — No passives, intro difficulty ──────────
  {id:'wanderer',tagline:'Could not even find the exit.',name:'The Wanderer',circle:'Circle I — Limbo',subtitle:'Fight 1 of 3',maxHp:50,baseDmg:4,emoji:'👤',passive:'A lost soul with no purpose. Attacks randomly.',passiveId:null},
  {id:'lostsoul',tagline:'You were lost before you started.',name:'The Lost Soul',circle:'Circle I — Limbo',subtitle:'Fight 2 of 3',maxHp:75,baseDmg:5,emoji:'💀',passive:'A stronger damned spirit. Hunger drives its blows.',passiveId:null},
  {id:'drifter',tagline:'110 HP and pure aggression.',name:'The Drifter',circle:'Circle I — Limbo',subtitle:'Circle Boss — Fight 3 of 3',maxHp:110,baseDmg:7,emoji:'👁',passive:'Pure relentless pressure.',passiveId:null},
  // ── CIRCLE II: LUST — Enemy buffs itself each strike ─────────
  {id:'siren',tagline:'She sang. You listened. You lost.',name:'The Siren',circle:'Circle II — Lust',subtitle:'Fight 1 of 3',maxHp:100,baseDmg:5,emoji:'🌊',passive:'Seductive. Gains +1 damage each Strike.',passiveId:'selfbuff'},
  {id:'tempter',tagline:'Temptation wins again.',name:'The Tempter',circle:'Circle II — Lust',subtitle:'Fight 2 of 3',maxHp:150,baseDmg:6,emoji:'🌹',passive:'Enthralling. Gains +1 damage each Strike. Starts stronger.',passiveId:'selfbuff'},
  {id:'lust_boss',tagline:'Irresistible to the end.',name:'The Seducer',circle:'Circle II — Lust',subtitle:'Circle Boss — Fight 3 of 3',maxHp:220,baseDmg:7,emoji:'💋',passive:'Irresistible. Gains +2 damage each Strike. Dangerous if left alive.',passiveId:'selfbuff2'},
  // ── CIRCLE III: GLUTTONY — Heals when you play cards ─────────
  {id:'glutton',tagline:'It ate your strikes for breakfast.',name:'The Glutton',circle:'Circle III — Gluttony',subtitle:'Fight 1 of 3',maxHp:130,baseDmg:5,emoji:'🍖',passive:'Insatiable. Heals 2 HP every time a card is played.',passiveId:'cardHeal'},
  {id:'feaster',tagline:'Still hungry. Always hungry.',name:'The Feaster',circle:'Circle III — Gluttony',subtitle:'Fight 2 of 3',maxHp:170,baseDmg:6,emoji:'🦷',passive:'Voracious. Heals 3 HP every time a card is played.',passiveId:'cardHeal3'},
  {id:'gluttony_boss',tagline:'Everything gets devoured eventually.',name:'The Devourer',circle:'Circle III — Gluttony',subtitle:'Circle Boss — Fight 3 of 3',maxHp:230,baseDmg:7,emoji:'🕳',passive:'Endless hunger. Heals 6 HP per card played. Strike fast.',passiveId:'cardHeal6'},
  // ── CIRCLE IV: GREED — Steals stash each strike ──────────────
  {id:'miser',tagline:'You could not afford to win.',name:'The Miser',circle:'Circle IV — Greed',subtitle:'Fight 1 of 3',maxHp:340,baseDmg:4,emoji:'💰',passive:'Greedy. Steals 1🌿 from your Stash each Strike. Win to take it back.',passiveId:'stashSteal'},
  {id:'hoarder',tagline:'It had more patience than you.',name:'The Hoarder',circle:'Circle IV — Greed',subtitle:'Fight 2 of 3',maxHp:400,baseDmg:5,emoji:'🪙',passive:'Avaricious. Steals 2🌿 per Strike. Your stash is its stash.',passiveId:'stashSteal2'},
  {id:'greed_boss',tagline:'Debt always comes due.',name:'The Usurer',circle:'Circle IV — Greed',subtitle:'Circle Boss — Fight 3 of 3',maxHp:666,baseDmg:6,emoji:'🏦',passive:'Extracting. Steals 3🌿 per Strike. 666 HP of pure greed.',passiveId:'stashSteal3'},
  // ── CIRCLE V: ANGER — Hits harder the more you buff ─────────
  {id:'wrathful',tagline:'Your buffs fed its rage.',name:'The Wrathful',circle:'Circle V — Anger',subtitle:'Fight 1 of 3',maxHp:900,baseDmg:5,emoji:'🔥',passive:'Enraged. +1 damage for each buffed member on your stage.',passiveId:'rageScale1'},
  {id:'berserker',tagline:'Fury without limit.',name:'The Berserker',circle:'Circle V — Anger',subtitle:'Fight 2 of 3',maxHp:1000,baseDmg:6,emoji:'⚔️',passive:'Furious. +1 damage per buffed member.',passiveId:'rageScale1'},
  {id:'anger_boss',tagline:'Strategy means nothing to rage.',name:'The Warlord',circle:'Circle V — Anger',subtitle:'Circle Boss — Fight 3 of 3',maxHp:1111,baseDmg:7,emoji:'💢',passive:'Explosive rage. +2 damage per buffed member.',passiveId:'rageScale2'},
  // ── CIRCLE VI: HERESY — Corrupts your corruption system ──────
  {id:'heretic',tagline:'Your soul is sufficiently corrupted now.',name:'The Heretic',circle:'Circle VI — Heresy',subtitle:'Fight 1 of 3',maxHp:1650,baseDmg:5,emoji:'🔱',passive:'Blasphemous. Each Strike raises your Corruption by 10%.',passiveId:'corruptPlayer'},
  {id:'apostate',tagline:'Corruption claimed another believer.',name:'The Apostate',circle:'Circle VI — Heresy',subtitle:'Fight 2 of 3',maxHp:1900,baseDmg:6,emoji:'⛧',passive:'Corrupting. Raises Corruption by 15% each Strike.',passiveId:'corruptPlayer15'},
  {id:'heresy_boss',tagline:'Even your chaos served its doctrine.',name:'The False Prophet',circle:'Circle VI — Heresy',subtitle:'Circle Boss — Fight 3 of 3',maxHp:2600,baseDmg:7,emoji:'📖',passive:'Toxic doctrine. Corruption +20% per Strike. Hellquake territory every fight.',passiveId:'corruptPlayer20'},
  // ── CIRCLE VII: VIOLENCE — Targets your healthiest member ────
  {id:'brute',tagline:'Your healthiest fell first.',name:'The Brute',circle:'Circle VII — Violence',subtitle:'Fight 1 of 3',maxHp:3000,baseDmg:6,emoji:'🗡️',passive:'Calculated. Always targets the member with highest HP.',passiveId:'targetHighestHp'},
  {id:'hunter',tagline:'Prey spotted. Prey eliminated.',name:'The Hunter',circle:'Circle VII — Violence',subtitle:'Fight 2 of 3',maxHp:4000,baseDmg:7,emoji:'🏹',passive:'Predatory. Targets highest HP member. Deals +50% damage to them.',passiveId:'targetHighestHp2'},
  {id:'violence_boss',tagline:'The sentence was carried out.',name:'The Executioner',circle:'Circle VII — Violence',subtitle:'Circle Boss — Fight 3 of 3',maxHp:5500,baseDmg:8,emoji:'🩸',passive:'Methodical. Targets highest HP and deals double damage. Protect your strongest.',passiveId:'targetHighestHp3'},
  // ── CIRCLE VIII: FRAUD — Shuffles your hand after each strike ──
  {id:'trickster',tagline:'You played right into its hands.',name:'The Trickster',circle:'Circle VIII — Fraud',subtitle:'Fight 1 of 3',maxHp:5200,baseDmg:6,emoji:'🃏',passive:'Deceptive. After each Strike, 1 random card in hand is discarded and replaced.',passiveId:'fraudShuffle'},
  {id:'deceiver',tagline:'Nothing was what it seemed.',name:'The Deceiver',circle:'Circle VIII — Fraud',subtitle:'Fight 2 of 3',maxHp:6800,baseDmg:7,emoji:'🎭',passive:'Manipulative. After each Strike, 2 cards in hand are discarded and replaced.',passiveId:'fraudShuffle2'},
  {id:'fraud_boss',tagline:'The greatest con: you thought you could win.',name:'The Archfraud',circle:'Circle VIII — Fraud',subtitle:'Circle Boss — Fight 3 of 3',maxHp:9600,baseDmg:8,emoji:'🪞',passive:'Master of lies. After each Strike, 3 cards in hand are discarded and replaced.',passiveId:'fraudShuffle3'},
  // ── CIRCLE IX: TREACHERY ──────────────────────────────────────
  {id:'traitor',tagline:'Your own band turned on you.',name:'The Traitor',circle:'Circle IX — Treachery',subtitle:'Fight 1 of 3',maxHp:9000,baseDmg:6,emoji:'🗝️',passive:'Paranoia. Each Strike, 1 random member refuses to attack and deals 3 damage to an ally.',passiveId:'paranoia'},
  {id:'betrayer',tagline:'It stole everything you built.',name:'The Betrayer',circle:'Circle IX — Treachery',subtitle:'Fight 2 of 3',maxHp:11400,baseDmg:7,emoji:'🔒',passive:'Soul Thief. Each Strike, steals 1 permanent ATK from a random member. Returned on victory.',passiveId:'soulThief'},
  {id:'lucifer',tagline:'He has seen better challengers. A lot of them.',name:'Lucifer',circle:'Circle IX — Treachery',subtitle:'⛧ The Final Circle — Fight 3 of 3',maxHp:420666,baseDmg:9,emoji:'😈',passive:'The Lord of Hell. Your victories weaken him. Two phases. The ultimate test.',passiveId:'luciferBoss'},
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
  // ── UNLOCKABLE MEMBERS (locked until lifetime score milestone) ──
  {id:'tanuki',name:'Tanuki',role:'Bass Player',atk:8,hp:8,maxHp:8,emoji:'🦝',keyword:'ANCHOR',desc:'The heaviest bass in Hell. Built like a tank, hits like a truck.',locked:true,unlockAt:3000},
  {id:'lucifer_member',name:'Lucifer',role:'The Devil',atk:20,hp:69,maxHp:69,emoji:'😈',keyword:'FALLEN',desc:'Cannot be healed. Loses 1 HP per strike. If he dies, game over. Max 3 band members. Sell for 69 herb.',locked:true,unlockAt:100000},
]

// ── UNLOCK MILESTONES ──────────────────────────────────────────
const UNLOCK_MILESTONES=[
  {score:1000,type:'card',id:'moshpit',label:'New Card: Mosh Pit',emoji:'🤘'},
  {score:3000,type:'member',id:'tanuki',label:'New Member: Tanuki',emoji:'🦝'},
  {score:5000,type:'artifact',id:'wardrums',label:'New Artifact: War Drums',emoji:'🪘'},
  {score:10000,type:'card',id:'bloodritual',label:'New Card: Blood Ritual',emoji:'🩸'},
  {score:15000,type:'foil',id:'vitalik_foil',label:'Foil Vitalik in Packs',emoji:'✨'},
  {score:25000,type:'shop',id:'demonic_c3',label:'Demonic Pack from C3',emoji:'😈'},
  {score:50000,type:'dealer',id:'double_dealer',label:'Hold 2 Drugs at Once',emoji:'🍄'},
  {score:100000,type:'member',id:'lucifer_member',label:'Lucifer Playable',emoji:'👑'},
]

// ── DIFFICULTY STAKES ──────────────────────────────────────────
// ── THE PACT: post-boss reward choices ──────────────────────────
const CIRCLE_NAMES=['','I — Limbo','II — Lust','III — Gluttony','IV — Greed','V — Anger','VI — Heresy','VII — Violence','VIII — Fraud','IX — Treachery']
const CIRCLE_EMOJIS=['','🌑','🌹','🍖','💰','⚔','⛪','🗡','🎭','❄']

// Skip rewards for The Descent map (fight 1 = small, fight 2 = medium)
const REWARD_TIPS={
  's_stash':'Adds 15 to your permanent stash balance.',
  's_ember':'Permanently increases your max embers by 1 for the rest of the run.',
  's_corrupt':'Reduces your current corruption by 15% immediately.',
  's_atk':'One random alive band member gains +1 ATK permanently.',
  's_draw1':'Draw 1 extra card at the start of your next fight.',
  's_discard':'Start the next fight with 5 discards instead of 4.',
  's_card':'A random Common rarity card is added to your deck permanently.',
  's_stashper':'Gain 5 stash for each alive band member (2-6 members = 10-30 stash).',
  's_embers2':'Start the next fight with 2 extra embers (one-time bonus).',
  'm_stash':'Adds 25 to your permanent stash balance.',
  'm_corrupt':'Resets your corruption to 0% immediately.',
  'm_draw2':'Draw 2 extra cards at the start of your next fight.',
  'm_card':'A random Uncommon rarity card is added to your deck permanently.',
  'm_allatk':'Every alive band member gains +1 ATK permanently.',
  'm_stash40':'Adds 40 to your permanent stash balance.',
  'm_delete':'Permanently removes a random Common card from your deck. Thins your deck!',
  'm_free':'The first card you play next fight costs 0 embers.',
  'm_stonewall':'All members are shielded from Too Stoned for 2 strikes next fight.',
}

const DESCENT_REWARDS_1=[ // Fight 1 skip rewards (small) — 9 options
  {id:'s_stash',name:'+15 Stash',emoji:'🌿',apply:(gs)=>{gs.setStash(p=>Math.min(420,p+15));gs.addLog('🌿 Skipped fight: +15 Stash')}},
  {id:'s_ember',name:'+1 Max Ember',emoji:'🔥',apply:(gs)=>{gs.setMaxEmbers(p=>Math.min(8,p+1));gs.addLog('🔥 Skipped fight: +1 Max Ember')}},
  {id:'s_corrupt',name:'-15% Corruption',emoji:'✨',apply:(gs)=>{gs.setCorruption(p=>Math.max(0,p-15));gs.addLog('✨ Skipped fight: -15% Corruption')}},
  {id:'s_atk',name:'Random Member +1 ATK',emoji:'🎸',apply:(gs)=>{gs.setStage(p=>{const alive=p.map((m,i)=>m&&!m.tooStoned?i:null).filter(i=>i!==null);if(alive.length===0)return p;const idx=alive[Math.floor(Math.random()*alive.length)];const ns=[...p];ns[idx]=Object.assign({},ns[idx],{atk:ns[idx].atk+1,permAtkBonus:(ns[idx].permAtkBonus||0)+1});gs.addLog('🎸 Skipped fight: '+ns[idx].name+' +1 ATK');return ns})}},
  {id:'s_draw1',name:'Draw +1 Next Fight',emoji:'📋',apply:(gs)=>{gs.setPendingDraw(p=>p+1);gs.addLog('📋 Skipped fight: +1 Card next fight')}},
  {id:'s_discard',name:'+1 Discard Next Fight',emoji:'🗑',apply:(gs)=>{gs.setBonusDiscards(p=>p+1);gs.addLog('🗑 Skipped fight: +1 Discard next fight')}},
  {id:'s_card',name:'Random Common Card',emoji:'🃏',apply:(gs)=>{const commons=ALL_CARDS.filter(c=>c.rarity==='Common');const pick=commons[Math.floor(Math.random()*commons.length)];gs.addToDeck({...pick,uid:uid()});gs.addLog('🃏 Skipped fight: Added '+pick.name+' to deck')}},
  {id:'s_stashper',name:'+5 Stash Per Member',emoji:'💰',apply:(gs)=>{gs.setStage(p=>{const alive=p.filter(m=>m&&!m.tooStoned).length;gs.setStash(s=>Math.min(420,s+alive*5));gs.addLog('💰 Skipped fight: +'+alive*5+' Stash ('+alive+' members x 5)');return p})}},
  {id:'s_embers2',name:'+2 Bonus Embers',emoji:'⚡',apply:(gs)=>{gs.setBonusEmbers(p=>p+2);gs.addLog('⚡ Skipped fight: +2 Bonus Embers next fight')}},
]
const DESCENT_REWARDS_2=[ // Fight 2 skip rewards (medium) — 9 options
  {id:'m_stash',name:'+25 Stash',emoji:'🌿',apply:(gs)=>{gs.setStash(p=>Math.min(420,p+25));gs.addLog('🌿 Skipped fight: +25 Stash')}},
  {id:'m_corrupt',name:'Corruption → 0%',emoji:'✨',apply:(gs)=>{gs.setCorruption(0);gs.addLog('✨ Skipped fight: Corruption reset to 0%')}},
  {id:'m_draw2',name:'Draw +2 Next Fight',emoji:'📋',apply:(gs)=>{gs.setPendingDraw(p=>p+2);gs.addLog('📋 Skipped fight: +2 Cards next fight')}},
  {id:'m_card',name:'Random Uncommon Card',emoji:'🃏',apply:(gs)=>{const uncommons=ALL_CARDS.filter(c=>c.rarity==='Uncommon');const pick=uncommons[Math.floor(Math.random()*uncommons.length)];gs.addToDeck({...pick,uid:uid()});gs.addLog('🃏 Skipped fight: Added '+pick.name+' to deck')}},
  {id:'m_allatk',name:'All Members +1 ATK',emoji:'🎸',apply:(gs)=>{gs.setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,permAtkBonus:(m.permAtkBonus||0)+1}):m));gs.addLog('🎸 Skipped fight: All members +1 ATK')}},
  {id:'m_stash40',name:'+40 Stash',emoji:'💰',apply:(gs)=>{gs.setStash(p=>Math.min(420,p+40));gs.addLog('💰 Skipped fight: +40 Stash')}},
  {id:'m_delete',name:'Delete Random Common',emoji:'🗑',apply:(gs)=>{gs.deleteRandomCommon()}},
  {id:'m_free',name:'First Card Free',emoji:'⚡',apply:(gs)=>{gs.setNextCardFree(true);gs.addLog('⚡ Skipped fight: First card next fight is free')}},
  {id:'m_stonewall',name:'Stonewall All',emoji:'🛡',apply:(gs)=>{gs.setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{stoneShield:2}):m));gs.addLog('🛡 Skipped fight: All members shielded for 2 strikes')}},
]

// -- CARD UPGRADES: Doom Forge after each boss --
const CARD_UPGRADES={
  battlecry:{desc:'+2 ATK (was +1). +1 max HP to target.',hp:'target',hpAmt:1},
  amp:{desc:'Doubles ATK AND +2 max HP to target.',hp:'target',hpAmt:2},
  newstrings:{desc:'+3 ATK (was +2). +1 max HP to target.',hp:'target',hpAmt:1},
  encore:{desc:'Attacks again + +1 perm ATK. +2 max HP to target.',hp:'target',hpAmt:2},
  resonancecard:{desc:'Copies highest ATK. +2 max HP to target.',hp:'target',hpAmt:2},
  crowdsurf:{desc:'4 damage per card (was 3).'},
  heavyriff:{desc:'60% of total ATK (was 50%).'},
  stagedive:{desc:'Damage = HP. Member heals back 50%.'},
  infencore:{desc:'Doubles strike damage. +1 max HP to all.',hp:'all',hpAmt:1},
  possessedperf:{desc:'Triples ATK. Stone shield all. +2 max HP to all.',hp:'all',hpAmt:2},
  overdrive:{desc:'Doubles ATK at 50% corruption (was 60%).'},
  moshpit:{desc:'5 damage per member (was 3).'},
  demotape:{desc:'Copies 75% ATK (was 50%).'},
  burnset:{desc:'Draw 2 cards (was 1).'},
  herbmoney:{desc:'Full stash as damage. Keep half stash.'},
  goingbroke:{desc:'Stash x1.5 as damage.'},
  soundwall:{desc:'+4 base damage at all tiers.'},
  doubledown:{desc:'Next TWO cards cost 0 (was 1).'},
  distortion:{desc:'+2 temp ATK/member (was +1). +1 max HP to all.',hp:'all',hpAmt:1},
  dialtoeleven:{desc:'+15% corruption. All members +2 ATK this Strike (was +1).'},
  deathriff:{desc:'80 base damage (was 60).'},
  feedbackloop:{desc:'Corruption / 1.5 damage (was / 2).'},
  ampstatic:{desc:'Corruption / 8 ATK (was / 10).'},
  darktuning:{desc:'Corruption / 8 buffs (was / 10).'},
  sigdecay:{desc:'Draw 3 (was 2).'},
  controlfeedback:{desc:'Corruption to 50%. Heal ALL to full. +1 max HP to all.',hp:'all',hpAmt:1},
  sabbathsigil:{desc:'Roll d10 twice, pick better result.'},
  bloodritual:{desc:'8x sacrificed HP as damage (was 6x).'},
  seance:{desc:'Heal corruption/3 per member (was /4). +1 max HP to all.',hp:'all',hpAmt:1},
  soundcheck:{desc:'Heal 6 HP (was 4). +1 max HP to hurt members.',hp:'hurt',hpAmt:1},
  roadie:{desc:'Shield 3 strikes (was 2). Heal 4 HP. +2 max HP.',hp:'target',hpAmt:2},
  wakeup:{desc:'Revive + heal all to 75%. +2 max HP to ALL.',hp:'all',hpAmt:2},
  setlist:{desc:'Draw 4 (was 3).'},
  setbreak:{desc:'Gain 3 Embers (was 2). +1 max HP to weakest.',hp:'weakest',hpAmt:1},
  remaster:{desc:'Draw 4 (was 3).'},
  powertap:{desc:'Gain 3 Embers (was 2).'},
  staticcharge:{desc:'Gain 5 Embers at 0% corruption (was 4).'},
  tappedout:{desc:'Gain 6 Embers next strike (was 5).'},
  ampoverload:{desc:'Gain 4 Embers (was 3).'},
  groupie:{desc:'Gain 3 Embers. Draw 2 (was 1).'},
  soundboard:{desc:'Gain 3 Embers. Draw 2 next strike (was 1). +1 max HP to random.',hp:'random',hpAmt:1},
}

// -- BOSS LOOT: unique drops per circle boss --
const BOSS_LOOT=[
  null, // no boss at index 0
  null,
  {id:'limbos_echo',name:'Limbos Echo',emoji:'👁',desc:'+1 ATK to all members.',effect:'atk1all',circle:1},
  null,
  null,
  {id:'love_letter',name:'Love Letter',emoji:'💋',desc:'First card each fight is free.',effect:'freeFirst',circle:2},
  null,
  null,
  {id:'endless_hunger',name:'Endless Hunger',emoji:'🕳',desc:'+3 max HP to all members.',effect:'hp3all',circle:3},
  null,
  null,
  {id:'golden_tooth',name:'Golden Tooth',emoji:'🪙',desc:'+5 Stash per boss kill.',effect:'stashBoss',circle:4},
  null,
  null,
  {id:'berserker_rage',name:'Berserker Rage',emoji:'🔥',desc:'+2 ATK to strongest member.',effect:'atk2strong',circle:5},
  null,
  null,
  {id:'heretics_brand',name:'Heretics Brand',emoji:'⛧',desc:'Corruption damage +25% permanently.',effect:'corrDmg',circle:6},
  null,
  null,
  {id:'the_blade',name:'The Blade',emoji:'🗡',desc:'+3 ATK to strongest member.',effect:'atk3strong',circle:7},
  null,
  null,
  {id:'mask_of_lies',name:'Mask of Lies',emoji:'🎭',desc:'+4 max HP to all members.',effect:'hp4all',circle:8},
  null,
  null,
  null, // Lucifer - handled by victory cinematic
]
const STREAK_BONUSES=[
  null, // 0 wins
  null, // 1 win
  {desc:'+1 starting Ember',effect:'ember1'},       // 2 wins
  {desc:'Start with a free Foil member',effect:'foil'},  // 3 wins
  {desc:'+1 free card upgrade',effect:'upgrade'},    // 4 wins
  {desc:'Start with a Mythic member',effect:'mythic'}, // 5+ wins
]

const PACT_REWARDS=[
  {id:'ember_surge',name:'Ember Surge',emoji:'🔥',desc:'+1 max Embers permanently.',color:'#ff6600'},
  {id:'iron_strings',name:'Iron Strings',emoji:'🎸',desc:'All members +1 ATK permanently.',color:'#ee2222'},
  {id:'thick_skin',name:'Thick Skin',emoji:'🛡',desc:'All members +3 max HP permanently.',color:'#33dd33'},
  {id:'dark_bargain',name:'Dark Bargain',emoji:'🌑',desc:'All CORRUPT cards cost 1 less Ember.',color:'#cc44ff'},
  {id:'speed_demon',name:'Speed Demon',emoji:'⚡',desc:'Draw 1 extra card per Strike.',color:'#ffdd00'},
  {id:'blood_price',name:'Blood Price',emoji:'🩸',desc:'Blood Ritual deals 9× instead of 6×.',color:'#cc0000'},
  {id:'clean_living',name:'Clean Living',emoji:'✨',desc:'While Corruption is below 15%, all members +3 ATK.',color:'#ffffff'},
  {id:'corruption_engine',name:'Corruption Engine',emoji:'☠',desc:'+5% Corruption at start of each fight.',color:'#aa00ff'},
  {id:'merchants_eye',name:'Merchants Eye',emoji:'💰',desc:'All shop items cost 20% less.',color:'#44cc44'},
  {id:'stone_wall',name:'Stone Wall',emoji:'🧱',desc:'Members take 1 less damage per Strike (min 1).',color:'#8888aa'},
  {id:'sixth_slot',name:'Sixth Slot',emoji:'👥',desc:'+1 band member slot. Recruit at next shop.',color:'#e8a820'},
  {id:'war_drums',name:'War Drums',emoji:'🥁',desc:'+1 Strike per fight permanently.',color:'#dd2222'},
]

const STAKES=[
  {id:'bronze',name:'Bronze',color:'#cd7f32',border:'#cd7f32',hpMult:1.30,dmgAdd:0,priceMult:1.0,scoreMult:1.0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Standard difficulty. Bosses +30% HP.',mentorBonus:0},
  {id:'silver',name:'Silver',color:'#c0c0c0',border:'#c0c0c0',hpMult:1.30,dmgAdd:1,priceMult:1.0,scoreMult:1.5,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Bosses +30% HP. Enemies +1 damage.',mentorBonus:0.05},
  {id:'gold',name:'Gold',color:'#ffd700',border:'#ffd700',hpMult:1.30,dmgAdd:2,priceMult:1.25,scoreMult:2.0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Bosses +30% HP. Enemies +2 damage. Shop prices +25%.',mentorBonus:0.10},
  {id:'obsidian',name:'Obsidian',color:'#7a7a9a',border:'#6a6a8a',hpMult:1.50,dmgAdd:2,priceMult:1.25,scoreMult:2.5,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:false,drugPriceMult:1.5,badTripChance:0.05,desc:'Bosses +50% HP. No free heal after fights. Drugs 50% more expensive.',mentorBonus:0.12},
  {id:'blood',name:'Blood',color:'#8b0000',border:'#cc0000',hpMult:1.75,dmgAdd:3,priceMult:1.25,scoreMult:3.0,maxStrikes:4,startEmbers:4,startCorruption:10,healAfterFight:false,drugPriceMult:1.5,badTripChance:0.05,desc:'Bosses +75% HP. Start with 4 Embers. Corruption starts at 10%.',mentorBonus:0.35},
  {id:'demonic',name:'Demonic ⛧',color:'#ff0000',border:'#ff0000',hpMult:1.8,dmgAdd:4,priceMult:1.5,scoreMult:4.0,maxStrikes:3,startEmbers:4,startCorruption:15,healAfterFight:false,drugPriceMult:2.0,badTripChance:0.15,desc:'Bosses +80% HP. Max 3 Strikes. Bad trips 15%. Pure hell.',mentorBonus:0.75},
]
function getUnlockedStakes(){
  const beaten=JSON.parse(localStorage.getItem('vst_stakes_beaten')||'[]')
  const unlocked=[STAKES[0]] // Bronze always unlocked
  for(let i=1;i<STAKES.length;i++){if(beaten.includes(STAKES[i-1].id))unlocked.push(STAKES[i])}
  return unlocked
}
// ── WELCOME TO HELL: The Executive bonus boss ──────────────────────
const AR_EXECUTIVE={id:'ar_exec',name:'The Executive',emoji:'🕴',maxHp:69000,baseDmg:8,
  passive:'Corporate Pressure. Every 2 strikes, a Record Deal contract appears in your hand.',
  passiveId:'corporate',tagline:'The real Devil wears a suit.'}

const STAKE_UNLOCKS={
  bronze:{id:'su_bronze',name:'Devil\'s Advocate',type:'card',emoji:'😈',desc:'New card: All members +1 ATK per circle cleared this run.',color:'#cd7f32'},
  silver:{id:'su_silver',name:'Lucifer\'s Crown',type:'artifact',emoji:'👑',desc:'New artifact: +2 ATK all members at fight start.',color:'#c0c0c0'},
  gold:{id:'su_gold',name:'Fallen Angel',type:'member',emoji:'🕊',desc:'New member: 12 ATK, 4 HP. GLASS keyword — dies in one hit.',color:'#ffd700'},
  obsidian:{id:'su_obsidian',name:'Soul of the Damned',type:'passive',emoji:'💀',desc:'New pedal: Start each fight at 50% corruption. Corruption cards cost 1 less.',color:'#7a7a9a'},
  blood:{id:'su_blood',name:'Bloodstained',type:'cosmetic',emoji:'🩸',desc:'Cosmetic: Bloodstained card back. Marks you as elite.',color:'#8b0000'},
  demonic:{id:'su_demonic',name:'⛧ GOD KILLER ⛧',type:'title',emoji:'⛧',desc:'Permanent title on main menu. You are a god.',color:'#ff0044'},
}
function getStakeUnlocks(){return JSON.parse(localStorage.getItem('vst_stake_unlocks')||'[]')}
function beatStake(stakeId){
  const beaten=JSON.parse(localStorage.getItem('vst_stakes_beaten')||'[]')
  if(!beaten.includes(stakeId)){beaten.push(stakeId);localStorage.setItem('vst_stakes_beaten',JSON.stringify(beaten))}
  const unlocks=getStakeUnlocks()
  if(STAKE_UNLOCKS[stakeId]&&!unlocks.includes(stakeId)){unlocks.push(stakeId);localStorage.setItem('vst_stake_unlocks',JSON.stringify(unlocks))}
}

// ── RIFF CHAINS: 2-card combos that trigger bonus damage + visual feedback ──
const RIFF_CHAINS=[
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

const ALL_CARDS=[
  {id:'amp',name:'Amp It Up',type:'RIFF',rarity:'Common',emoji:'⚡',embers:2,effect:'Target member deals double ATK this turn.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'dialtoeleven',name:'Dial to Eleven',type:'CORRUPT',rarity:'Common',emoji:'📻',embers:0,effect:'+15% Corruption. All members +1 ATK this Strike.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'soundcheck',name:'Sound Check',type:'UTILITY',rarity:'Common',emoji:'🔊',embers:2,effect:'All members +4 HP. Injured members also gain +1 ATK this Strike.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'sigdecay',name:'Signal Decay',type:'CORRUPT',rarity:'Common',emoji:'📡',embers:1,effect:'Discard 1 card from hand. Draw 2 cards.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'battlecry',name:'Battle Cry',type:'RIFF',rarity:'Common',emoji:'🤘',embers:1,effect:'Target member +1 ATK permanently.',color:'#9933cc',typeColor:'#7722aa',copies:4},
  {id:'roadie',name:'Roadie',type:'UTILITY',rarity:'Common',emoji:'🛡',embers:1,effect:'Target cannot go Too Stoned for 2 Strikes. Heals 2 HP.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'setlist',name:'Setlist',type:'UTILITY',rarity:'Common',emoji:'📋',embers:0,effect:'Draw 3 cards. Then discard 1 card of your choice.',color:'#22aa44',typeColor:'#118833',copies:1},
  {id:'groupie',name:'Groupie',type:'EMBER',rarity:'Uncommon',emoji:'🍯',embers:1,effect:'Gain 2 Embers. Draw 1 card immediately.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'demotape',name:'Demo Tape',type:'RIFF',rarity:'Common',emoji:'📼',embers:1,effect:'Copy the last Riff played, cast it free.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'newstrings',name:'New Strings',type:'RIFF',rarity:'Uncommon',emoji:'🎸',embers:2,effect:'+2 ATK permanently to target member.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'encore',name:'Encore',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:2,effect:'Target member attacks again this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'wakeup',name:'Wake Up Call',type:'UTILITY',rarity:'Uncommon',emoji:'☕',embers:1,effect:'Heal all members 2 HP. If any member is Too Stoned, revive them.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'feedbackloop',name:'Feedback Loop',type:'CORRUPT',rarity:'Uncommon',emoji:'🎛',embers:3,effect:'Deal damage equal to Corruption ÷ 2.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'tappedout',name:'Tapped Out',type:'EMBER',rarity:'Uncommon',emoji:'🪙',embers:0,effect:'Gain 5 Embers at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'controlfeedback',name:'Controlled Feedback',type:'CORRUPT',rarity:'Uncommon',emoji:'🎚',embers:2,effect:'Set Corruption to 50%. Heal target member to full HP.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'burnset',name:'Burn the Set',type:'RIFF',rarity:'Uncommon',emoji:'🔥',embers:0,effect:'Select up to 3 cards first, then play this to discard them and draw that many +1. (No selection = draw 1 card.)',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'soundwall',name:'Sound Wall',type:'RIFF',rarity:'Uncommon',emoji:'🔈',embers:2,effect:'Direct damage: 5 (C1-3), 8 (C4-6), 12 (C7-9). Bypasses boss passive.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'stagedive',name:'Stage Dive',type:'RIFF',rarity:'Rare',emoji:'🤘',embers:4,effect:'Damage = target HP to boss. Once per round.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'overdrive',name:'Overdrive',type:'RIFF',rarity:'Rare',emoji:'💥',embers:3,effect:'If Corruption >=60%, double ALL ATK this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'infencore',name:'Infernal Encore',type:'RIFF',rarity:'Rare',emoji:'👿',embers:3,effect:'ALL members attack again simultaneously.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'remaster',name:'The Remaster',type:'UTILITY',rarity:'Rare',emoji:'🎙',embers:0,effect:'Select 1 card in hand, then play this to delete it and draw 3 cards.',color:'#22aa44',typeColor:'#118833',copies:1},
  {id:'sabbathsigil',name:'Black Sabbath Sigil',type:'CORRUPT',rarity:'Rare',emoji:'⛧',embers:2,effect:'CONSUMABLE. Corruption → 100%. Hellquake d10. Card is destroyed after use.',color:'#aa1111',typeColor:'#880000',copies:1,consumable:true,shopCost:42},
  {id:'possessedperf',name:'Possessed Performance',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:4,effect:'All members deal triple ATK this Strike only.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'crowdsurf',name:'Crowd Surf',type:'RIFF',rarity:'Common',emoji:'🏄',embers:2,effect:'Deal damage equal to cards in hand × 3.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'doubledown',name:'Double Down',type:'RIFF',rarity:'Uncommon',emoji:'🎰',embers:3,effect:'The next card played this Strike costs 0 Embers.',color:'#9933cc',typeColor:'#7722aa',copies:2,shopOnly:true},
  {id:'deathriff',name:'Death Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'💀',embers:1,effect:'Deal 60 damage, reduced by your Corruption%. Best at 0%, weakest at 100%. Corruption +10%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'ampoverload',name:'Amp Overload',type:'EMBER',rarity:'Uncommon',emoji:'🔋',embers:0,effect:'Gain 3 Embers. Costs 1 Discard. Unplayable with 0 discards remaining.',color:'#c87820',typeColor:'#a06010',copies:1},
  {id:'ampstatic',name:'Amp the Static',type:'CORRUPT',rarity:'Uncommon',emoji:'📶',embers:3,effect:'Target member gains ATK = Corruption ÷ 10 this Strike. Requires Corruption > 0.',color:'#aa1111',typeColor:'#880000',copies:2},
  // ── NEW CARDS ──────────────────────────────────────────────────
  {id:'distortion',name:'Distortion',type:'CORRUPT',rarity:'Common',emoji:'🎸',embers:1,effect:'Corruption +15%. All members +1 ATK this Strike.',color:'#aa1111',typeColor:'#880000',copies:3},
  {id:'seance',name:'Séance',type:'CORRUPT',rarity:'Uncommon',emoji:'🔮',embers:1,effect:'Heal all members HP equal to Corruption ÷ 4. Rewards high corruption.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'staticcharge',name:'Static Charge',type:'CORRUPT',rarity:'Common',emoji:'⚡',embers:0,effect:'Gain 2 Embers. Gain 4 instead if Corruption is 0%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'darktuning',name:'Dark Tuning',type:'CORRUPT',rarity:'Uncommon',emoji:'🌑',embers:3,effect:'For each 15% Corruption, one random member gains +1 ATK permanently.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'powertap',name:'Power Tap',type:'EMBER',rarity:'Common',emoji:'🔌',embers:0,effect:'Gain 2 Embers.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'soundboard',name:'Soundboard',type:'EMBER',rarity:'Uncommon',emoji:'🎛',embers:1,effect:'Gain 2 Embers. Draw 1 extra card at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:1},
  {id:'setbreak',name:'Smoke Break',type:'UTILITY',rarity:'Common',emoji:'🎼',embers:0,effect:'Select 1 card first, then play to discard it. Gain 2 Embers. (Random if no selection)',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'heavyriff',name:'Heavy Riff',type:'RIFF',rarity:'Uncommon',emoji:'🥊',embers:2,effect:'Deal damage = stage total ATK ÷ 2, direct to boss.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'resonancecard',name:'Resonance',type:'RIFF',rarity:'Uncommon',emoji:'🌀',embers:1,effect:'Target member ATK becomes equal to highest ATK on stage.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'herbmoney',name:'Herb Money',type:'RIFF',rarity:'Uncommon',emoji:'🌿',embers:1,effect:'Deal damage equal to your current Stash. Keep your Stash.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'goingbroke',name:'Going Broke',type:'RIFF',rarity:'Rare',emoji:'💸',embers:0,effect:'Spend ALL your Stash. Deal that much damage to the boss.',color:'#9933cc',typeColor:'#7722aa',copies:1,shopOnly:true},
  // ── UNLOCKABLE CARDS ───────────────────────────────────────────
  {id:'moshpit',name:'Mosh Pit',type:'RIFF',rarity:'Uncommon',emoji:'🤘',embers:1,effect:'Deal 3 damage per alive member on stage.',color:'#9933cc',typeColor:'#7722aa',copies:2,locked:true,unlockAt:1000},
  {id:'bloodritual',name:'Blood Ritual',type:'CORRUPT',rarity:'Rare',emoji:'🩸',embers:2,effect:'Sacrifice 25% of target HP. Deal 6x that HP as damage to the boss. Corruption +15%.',color:'#aa1111',typeColor:'#880000',copies:1,locked:true,unlockAt:10000},
]

const KEYWORD_DESC={
  'FRENZIED':'High damage dealer. ATK scales with consecutive buffs.',
  'DOUBLE TIME':'Rolls d6 each fight: 5-6=Double Time (×2 ATK), 3-4=Off Beat (×1.5), 1-2=Half Time (×0.5). A gamble!',
  'ANCHOR':'After each Strike, heals adjacent members +1 HP.',
  'CORRUPT':'ATK increases with Corruption level. Thrives in chaos.',
  'DEBUFF':'Reduces boss damage by 2 each Strike, stacking permanently this fight.',
  'FOLK MAGIC':'20% chance each Strike to refill all Embers.',
  'SHREDDER':'First RIFF card each Strike costs 1 less Ember.',
  'HEXED':'Gains +Corruption each Strike, ATK scales with Corruption.',
  'FALLEN':'Cannot be healed. Loses 1 HP per Strike. If Lucifer dies, game over. Max 3 band members.',
}
function seededRng(seed){let s=seed;return function(){s=Math.imul(48271,s)|0;return(s&0x7fffffff)/0x7fffffff}}

function buildDeck(seed){
  const rng=seededRng(seed)
  const deck=[]
  getUnlockedCards().filter(c=>!c.shopOnly).forEach(function(c){
    const n=c.copies||2
    for(let i=0;i<n;i++){deck.push(Object.assign({},c,{uid:uid()}))}
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
  // ── UNLOCKABLE ARTIFACT ────────────────────────────────────────
  {id:'wardrums',name:'War Drums',emoji:'🪘',effect:'+1 Strike per fight permanently (5 Strikes instead of 4).',cost:30,locked:true,unlockAt:5000},
]

// ── STARTER PASSIVES P1-P10 (CD-Rs) ───────────────────────────
const STARTER_PASSIVES=[
  {id:'p1',name:'Power Chord',emoji:'⚡',effect:'Gain 1 extra Ember at the start of every fight.',cost:6},
  {id:'p2',name:'Roadie Crew',emoji:'🔧',effect:'At the start of each fight, one random member heals 3 HP.',cost:8},
  {id:'p3',name:'Merch Table',emoji:'👕',effect:'After each fight victory, gain +2 bonus Stash.',cost:6},
  {id:'p4',name:'Feedback Hum',emoji:'🔊',effect:'All EMBER type cards give 1 additional Ember when played.',cost:10},
  {id:'p5',name:'Amp Stack',emoji:'📻',effect:'Sound Wall deals +4 additional damage. Heavy Riff deals +2 additional damage.',cost:10},
  {id:'p6',name:'Cult Following',emoji:'🕯',effect:'Each time any member goes Too Stoned, gain 3 Stash.',cost:10},
  {id:'p7',name:'Guitar Tech',emoji:'🎛',effect:'Battle Cry gives +2 ATK permanently instead of +1.',cost:8},
  {id:'p8',name:'Green Room',emoji:'🛋',effect:'At the start of each fight, all members gain Stonewall (immune to first Too Stoned event).',cost:16},
  {id:'p9',name:'Heavy Rotation',emoji:'🎚',effect:'When you draw a duplicate card into your hand, draw 1 extra card next Strike.',cost:10},
  {id:'p10',name:'Stage Fright Reversal',emoji:'🎙',effect:'The first Strike of every fight deals +10 bonus damage.',cost:14},
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
  {id:'ca1',name:'The Goat of Mendes',emoji:'🐐',effect:'All band members gain +1 ATK permanently.',cost:14},
  {id:'ca2',name:'Hellfire Amulet',emoji:'🔮',effect:'Start each fight with +2 bonus Embers.',cost:17},
  {id:'ca3',name:'Sabbath Crown',emoji:'👑',effect:'Too Stoned members revive at 50% HP each round.',cost:22},
  {id:'ca4',name:'Wailing Guitar',emoji:'🎸',effect:'First Strike each fight deals double damage.',cost:16},
]

// Card prices by rarity
function cardPrice(card){
  if(!card)return 0
  if(card.shopCost)return card.shopCost
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
  if(memberChance<0.05){
    const _sm=getUnlockedMusicians()[Math.floor(Math.random()*getUnlockedMusicians().length)]
    memberSlot={..._sm,isMember:true,cost:5,rarity:'Common',type:'RECRUIT',effect:_sm.keyword+' · '+_sm.role,foil:false,mythic:false,demonic:false,uid:uid()}
  } else if(memberChance<0.08){
    const _sm=getUnlockedMusicians()[Math.floor(Math.random()*getUnlockedMusicians().length)]
    memberSlot={..._sm,isMember:true,name:'✨ Foil '+_sm.name,cost:15,rarity:'Uncommon',type:'RECRUIT',effect:'FOIL · '+_sm.keyword+' · '+_sm.role,foil:true,mythic:false,demonic:false,uid:uid()}
  } else if(memberChance<0.09){
    const _sm=getUnlockedMusicians()[Math.floor(Math.random()*getUnlockedMusicians().length)]
    memberSlot={..._sm,isMember:true,name:'✦ Mythic '+_sm.name,cost:30,rarity:'Rare',type:'RECRUIT',effect:'MYTHIC · '+_sm.keyword+' · '+_sm.role,foil:false,mythic:true,demonic:false,uid:uid()}
  }

  // Filter cards by circle depth
  const pool=[...getUnlockedCards()].filter(c=>{
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
  // 5% chance: Black Sabbath Sigil appears (consumable, 42 cost)
  if(Math.random()<0.05){
    const sigil=ALL_CARDS.find(c=>c.id==='sabbathsigil')
    if(sigil)cards.push({...sigil,shopCost:42,uid:uid()})
  }
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
function genRecruitPack(fightIndex=0){
  const circle=Math.floor(fightIndex/3)+1
  const packs=[
    {name:'Garage Band Pack',emoji:'🎸',cost:10,desc:'Pick 1 of 2 musicians.',members:2,foilChance:0,mythicChance:0,demonicChance:0},
    {name:'Touring Pack',emoji:'🎤',cost:22,desc:'Pick 1 of 3. 25% Foil, 5% Mythic chance.',members:3,foilChance:0.25,mythicChance:0.05,demonicChance:0},
    {name:'Demonic Pack',emoji:'⛧',cost:40,desc:'Pick 1 of 4. 25% Foil, 15% Mythic, 5% DEMONIC.',members:4,foilChance:0.25,mythicChance:0.15,demonicChance:0.05},
  ]
  // Circle 1: only Garage Band
  // Circle 2-3: Garage Band or Touring (Foil/Mythic available early for Mentor Link)
  // Circle 4+: all packs (Demonic available before Hoarder wall)
  // UNLOCK: 25k lifetime — Demonic available from C3
  const demonicFromC3=isUnlocked('demonic_c3')
  if(circle<=1) return packs[0]
  if(circle<=2) return packs[Math.floor(Math.random()*2)]
  if(circle<=3) return demonicFromC3?packs[Math.floor(Math.random()*packs.length)]:packs[Math.floor(Math.random()*2)]
  return packs[Math.floor(Math.random()*packs.length)]
}

// ── MENTOR LINK SYSTEM ────────────────────────────────────────────
const KW_BOND_COLOR={'FRENZIED':'#ee2222','DOUBLE TIME':'#ff8800','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800','FALLEN':'#ff0000'}
function memberTier(m){return m&&m.demonic?'demonic':m&&m.mythic?'mythic':m&&m.foil?'foil':'base'}
function tierAtkBonus(m){return m.demonic?4:m.mythic?2:m.foil?1:0}
function tierHpBonus(m){return m.demonic?8:m.mythic?4:m.foil?2:0}
function roleBondBonus(tier){return tier==='demonic'?3:tier==='mythic'?2:tier==='foil'?1:0}
// ── MENTOR LINK ────────────────────────────────────────────────────
// foil/mythic/demonic placed directly LEFT of basic member with SAME ROLE = Mentor Link
// Stat bonus transfers once and sticks even if mentor dies
// Strike multiplier fires only when both alive + in position
const MENTOR_LINK_BONUS={foil:{atk:1,hp:2,mult:1.25},mythic:{atk:2,hp:4,mult:1.5},demonic:{atk:4,hp:8,mult:2.0}}
function scanMentorLinks(stageArr){
  const ns=stageArr.map(m=>m?{...m}:null)
  for(let i=0;i<ns.length-1;i++){
    const mentor=ns[i],basic=ns[i+1]
    if(!mentor||!basic)continue
    if(!(mentor.foil||mentor.mythic||mentor.demonic))continue
    if(basic.foil||basic.mythic||basic.demonic)continue
    if(mentor.role!==basic.role)continue // same ROLE (Lead Guitarist, Bass Player, etc)
    const tier=mentor.demonic?'demonic':mentor.mythic?'mythic':'foil'
    const bonus=MENTOR_LINK_BONUS[tier]
    ns[i]={...mentor,isMentor:true}
    if(basic.mentorLinkedToUid!==mentor.uid){
      ns[i+1]={...basic,atk:basic.atk+bonus.atk,hp:basic.hp+bonus.hp,maxHp:(basic.maxHp||basic.hp)+bonus.hp,mentorLinkedToUid:mentor.uid,mentorMult:bonus.mult,mentorTier:tier,mentorAlive:!mentor.tooStoned}
    } else {
      ns[i+1]={...basic,mentorAlive:!mentor.tooStoned,mentorMult:bonus.mult,mentorTier:tier}
    }
  }
  // Deactivate links where mentor is no longer left-adjacent
  for(let i=0;i<ns.length;i++){
    const m=ns[i]
    if(!m||!m.mentorLinkedToUid)continue
    const left=i>0?ns[i-1]:null
    const linked=left&&left.uid===m.mentorLinkedToUid&&!left.tooStoned
    if(!linked)ns[i]={...m,mentorAlive:false}
  }
  return ns
}
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
  return <div style={{position:'absolute',left:p.x,top:p.y,transform:`translate(-50%,-50%) scale(${p.s})`,fontSize:52,opacity:p.o,pointerEvents:'none',zIndex:8000,filter:'drop-shadow(0 0 20px rgba(255,80,0,0.95))'}}>{emoji}</div>
}

function Float({v,x,y,color,big,onDone}){
  color=color||'#dd2222';big=big||false
  useEffect(()=>{const t=setTimeout(onDone,1400);return ()=>clearTimeout(t)},[])
  return <div style={{position:'absolute',left:x,top:y,transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:big?'5rem':'2.8rem',fontWeight:900,color:color,textShadow:`0 0 24px ${color}, 0 0 48px ${color}44`,pointerEvents:'none',zIndex:9000,animation:'popFloat 1.6s ease-out forwards'}}>{typeof v==='number'&&v>0?'-'+v:v}</div>
}

function DiceRoll({target,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,1200);return ()=>clearTimeout(t)},[])
  return(
    <div style={{position:'absolute',left:'50%',top:'40%',transform:'translate(-50%,-50%)',zIndex:9100,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:8,animation:'fadeIn 0.2s ease'}}>
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
    const real=getUnlockedMusicians()
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
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'12px 42px 10px 42px',overflow:'hidden'}}>
      <div style={{fontFamily:"'BreakGothicFont',cursive",fontSize:60,color:'#cc1111',textShadow:'0 0 40px rgba(180,0,0,0.8),0 0 80px rgba(140,0,0,0.5),3px 3px 0 #000',flexShrink:0,letterSpacing:14}}>Opening Night</div>
      {/* DAILY SEED BANNER */}
      <div style={{display:'flex',gap:16,alignItems:'center',flexShrink:0}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820',letterSpacing:3,padding:'6px 20px',background:'rgba(40,25,5,0.8)',border:'1px solid #c87820',borderRadius:4}}>🌍 TODAY'S SEED: {(()=>{const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')).toString(16).toUpperCase()})()}</div>
        {parseInt(localStorage.getItem('vst_streak')||'0')>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#ff6600',letterSpacing:2,padding:'6px 16px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:4}}>🔥 {localStorage.getItem('vst_streak')} DAY STREAK</div>}
      </div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:24,color:'#e8d090',fontStyle:'italic',flexShrink:0}}>Select 2 musicians to start your band</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#e8d090',letterSpacing:2,flexShrink:0}}>RUN SEED: {seed.toString(16).toUpperCase()}</div>

      {/* MEMBER CARDS — 7 in a flexible row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4, 220px)',gap:14,justifyContent:'center',flexShrink:0,marginBottom:4}}>
        {pool.map(m=>{
          const isSel=sel.includes(m.id),dis=!isSel&&sel.length>=2
          const kw=m.keyword||''
          const kwc=kwColor[kw]||'#e8a820'
          return(
            <div key={m.id} onClick={()=>!m.locked&&!dis&&toggle(m.id)}
              style={{background:m.locked?'linear-gradient(180deg,#0e0e0e,#060606)':isSel?'linear-gradient(180deg,#2a1a0a,#160c04)':'linear-gradient(180deg,#1a1008,#0e0804)',
                border:m.locked?'1px solid rgba(60,60,60,0.5)':isSel?'2px solid #e8a820':dis?'1px solid rgba(80,50,10,0.25)':'1px solid rgba(160,100,25,0.5)',
                borderRadius:7,cursor:m.locked?'default':dis?'not-allowed':'pointer',height:200,
                boxShadow:isSel?'0 0 30px rgba(232,168,32,0.4),0 8px 24px rgba(0,0,0,0.8)':'0 4px 16px rgba(0,0,0,0.7)',
                opacity:dis?0.4:1,transform:isSel?'translateY(-8px) scale(1.04)':'none',
                transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',position:'relative',
                animation:(!isSel&&!dis&&!m.locked)?'throbSlow 4.5s ease-in-out infinite':'none'}}>
              <div style={{height:5,borderRadius:'7px 7px 0 0',background:isSel?'linear-gradient(90deg,#e8a820,#ffcc44)':kwc+'66'}}/>
              {isSel&&<div style={{position:'absolute',top:8,right:8,width:24,height:24,borderRadius:'50%',background:'#e8a820',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#000',fontWeight:900}}>✓</div>}
              <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,background:'rgba(0,0,0,0.3)'}}>{m.emoji}</div>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,color:isSel?'#e8d090':'#c8b878',textAlign:'center',padding:'2px 4px 0px',lineHeight:1,letterSpacing:2}}>{m.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,letterSpacing:2,color:'#c8b878',textAlign:'center',padding:'3px 4px 6px',textTransform:'uppercase'}}>{m.role}</div>
              {/* Stat bar — locked vs normal */}
              {m.locked?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'18px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)',gap:6}}>
                  <div style={{fontSize:30,opacity:0.5}}>🔒</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#9a7a40',letterSpacing:2,textAlign:'center',textTransform:'uppercase'}}>Can you find the key?</div>
                </div>
              ):(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#ee2222',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:38,fontWeight:900,color:'#ee2222',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,color:kwc,fontWeight:900,textAlign:'center',letterSpacing:0.5,maxWidth:100}}>{kw}</div>
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
      <div style={{background:'rgba(10,6,2,0.85)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:8,width:'100%',maxWidth:1700,flexShrink:0,marginTop:2,padding:'10px 24px'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'#c8a040',textTransform:'uppercase',textAlign:'center',marginBottom:6}}>⚗ Band Abilities — What Do They Mean?</div>
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
            <div key={kw} style={{display:'flex',alignItems:'flex-start',gap:10,background:'rgba(0,0,0,0.4)',borderRadius:6,padding:'8px 12px',border:`1px solid ${color}44`}}>
              <div style={{fontSize:20,flexShrink:0,marginTop:1}}>{icon}</div>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:color,letterSpacing:1,marginBottom:5}}>{kw}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#c0a870',lineHeight:1.4,fontStyle:'italic'}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>sel.length===2&&onComplete(sel)} disabled={sel.length<2}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'10px 48px',background:'rgba(130,0,0,0.35)',border:'2px solid #cc1111',borderRadius:3,color:'#ee2222',cursor:sel.length===2?'pointer':'default',transition:'all 0.2s',flexShrink:0,boxShadow:'0 0 22px rgba(180,0,0,0.5)',opacity:sel.length===2?1:0.45,textShadow:'0 0 14px rgba(200,0,0,0.6)'}}>
        {sel.length===2?'⛧  Take the Stage':'Select 2 Musicians'}
      </button>
    
    </div>
  )
}


function PawnShopModal({stage, deck, discard, stash, salesLeft, onSellMember, onSellCard, onBurnCard, onClose}){
  const [tab, setTab] = useState('cards')
  const [hoverCard, setHoverCard] = useState(null)
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
    fontFamily:"'MBScribblesFont',serif", fontSize:16, fontWeight:900, letterSpacing:3,
    padding:'10px 28px', cursor:'pointer', border:'none', textTransform:'uppercase',
    background: active?'rgba(160,80,240,0.3)':'transparent',
    color: active?'#cc88ff':'#8a6aaa',
    borderBottom: active?'2px solid #cc88ff':'2px solid transparent',
    transition:'all 0.2s'
  })
  return(
    <div style={{position:'absolute',inset:-4,zIndex:9800,background:'rgba(2,1,4,0.98)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:'30px 60px',overflowY:'auto'}}>
      {/* Stash counter — top right, ticks up on each sale */}
      <div style={{position:'absolute',top:24,right:32,display:'flex',flexDirection:'column',alignItems:'center',gap:4,
        background:'rgba(20,10,5,0.95)',border:'2px solid #55ee66',borderRadius:10,padding:'12px 20px',
        boxShadow:'0 0 24px rgba(60,220,80,0.4)',minWidth:100}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#33aa44',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>Stash</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,color:'#55ee66',lineHeight:1,
          textShadow:'0 0 20px rgba(60,220,80,0.8)'}}>{stash}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'#33aa44',fontStyle:'italic'}}>🌿</div>
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'#cc88ff',textShadow:'0 0 30px rgba(180,60,255,0.6)',marginBottom:6}}>🪙 Pawn Shop</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:25,color:'#c8a0ee',fontStyle:'italic',marginBottom:6}}>
        {salesLeft} sale{salesLeft!==1?'s':''} remaining this visit
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#8a6aaa',letterSpacing:1,marginBottom:20}}>
        Cannot sell last 2 members · Bonds break on member sale
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(160,80,240,0.2)',marginBottom:24,width:'100%',maxWidth:800}}>
        <button style={tabStyle(tab==='members')} onClick={()=>setTab('members')}>Members</button>
        <button style={tabStyle(tab==='cards')} onClick={()=>setTab('cards')}>Cards</button>
      </div>

      {/* Members tab */}
      {tab==='members'&&<div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',maxWidth:1200}}>
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
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#c0a050',textAlign:'center',letterSpacing:1,marginBottom:6}}>{m.role}</div>
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
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:1,padding:'8px',
                    background:canSell&&!cantSell?'rgba(30,80,20,0.3)':'rgba(20,30,15,0.2)',
                    border:'1px solid '+(canSell&&!cantSell?'#44cc44':'rgba(60,100,30,0.3)'),
                    borderRadius:4,color:canSell&&!cantSell?'#55ee55':'#3a5a2a',cursor:canSell&&!cantSell?'pointer':'not-allowed',boxShadow:canSell&&!cantSell?'0 0 8px rgba(60,200,60,0.3)':'none',
                    textTransform:'uppercase'}}>
                  {cantSell?'Need 2+ members':'Sell for '+price+' 🌿'}
                </button>
              </div>
            </div>
          )
        })}
      </div>}

      {/* Cards tab */}
      {tab==='cards'&&<div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',maxWidth:1200}}>
        {allCards.length===0&&<div style={{fontFamily:"'ScratchFont',serif",color:'#5a3a6a',fontStyle:'italic',fontSize:16}}>Deck is empty.</div>}
        {allCards.map((c,ci)=>{
          const price = cardSellPrice(c)
          const bc = c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
          return(
            <div key={c.uid||c.id} style={{width:180,background:'linear-gradient(180deg,#201408,#100804)',border:'1px solid '+bc+'88',borderRadius:6,position:'relative'}}
              onMouseEnter={()=>setHoverCard({c,ci})} onMouseLeave={()=>setHoverCard(null)}>
              <div style={{height:4,background:bc}}/>
              <div style={{fontSize:44,textAlign:'center',padding:'12px 0',background:'rgba(0,0,0,0.3)',borderRadius:'6px 6px 0 0'}}>{c.emoji}</div>
              <div style={{padding:'0 10px 12px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:2}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a6a40',textAlign:'center',marginBottom:6}}>{c.rarity}</div>
                <button
                  disabled={!canSell}
                  onClick={()=>{if(canSell){onSellCard(c);if(salesLeft<=1)onClose()}}}
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,letterSpacing:1,padding:'8px',
                    background:canSell?'rgba(30,80,20,0.3)':'rgba(20,30,15,0.2)',
                    border:'1px solid '+(canSell?'#44cc44':'rgba(60,100,30,0.3)'),
                    borderRadius:4,color:canSell?'#55ee55':'#3a5a2a',cursor:canSell?'pointer':'not-allowed',
                    textTransform:'uppercase',boxShadow:canSell?'0 0 8px rgba(60,200,60,0.3)':'none'}}>
                  Sell for {price} 🌿
                </button>
                <button
                  onClick={()=>{onBurnCard(c)}}
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,letterSpacing:1,padding:'6px',marginTop:4,
                    background:'rgba(160,20,20,0.25)',
                    border:'1px solid #ee3333',
                    borderRadius:4,color:'#ff4444',cursor:'pointer',
                    textTransform:'uppercase',boxShadow:'0 0 10px rgba(220,40,40,0.4)',textShadow:'0 0 8px rgba(255,60,60,0.5)'}}>
                  🔥 Burn (delete)
                </button>
              </div>
              {hoverCard&&hoverCard.ci===ci&&<div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:300,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'2px solid '+bc,borderRadius:10,padding:'14px',zIndex:9900,pointerEvents:'none',boxShadow:'0 8px 40px rgba(0,0,0,0.95),0 0 20px '+bc+'44'}}>
                <div style={{height:4,background:bc,borderRadius:'4px 4px 0 0',marginBottom:8,marginTop:-14,marginLeft:-14,marginRight:-14}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:bc,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>{c.type}</div>
                  <div style={{width:26,height:26,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:'#fff'}}>{c.embers}</div>
                </div>
                <div style={{fontSize:36,textAlign:'center',marginBottom:6}}>{c.emoji}</div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:18,color:'#e8d090',textAlign:'center',marginBottom:2,letterSpacing:1}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:bc,textAlign:'center',letterSpacing:2,marginBottom:6,textTransform:'uppercase'}}>{c.rarity}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#c8b080',textAlign:'center',lineHeight:1.5,fontStyle:'italic'}}>{c.effect}</div>
              </div>}
            </div>
          )
        })}
      </div>}

      <button onClick={onClose} style={{marginTop:30,fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,padding:'14px 50px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'#aa7030',cursor:'pointer',textTransform:'uppercase'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#c8a040'}}>
        Close Shop
      </button>
    </div>
  )
}

function ShopScreen({stash,onSpend,onLeave,circleArtifact,circlePassive,recruitPack,shopCards,boosterPacks,rerollCost,onReroll,fightIndex,activeArtifacts,activePassives,starterArtifacts,starterPassives,stage,deck,discardPile,onPawnSellMember,onPawnSellCard,onPawnBurnCard,soldIds,onMarkSold,circleCartBought,circleCpasBought,onBuyCart,onBuyCpas,heldShrooms,heldAcid,shroomsInStock,acidInStock,onBuyShrooms,onBuyAcid}){
  const drugMax=isUnlocked('double_dealer')?2:1
  const [hovId,setHovId]=useState(null)
  const [pawnSalesLeft,setPawnSalesLeft]=useState(2)
  const [pawnOpen,setPawnOpen]=useState(false)
  const [boughtIds,setBoughtIds]=useState([])
  const [leftBought,setLeftBought]=useState({cart:false,cpas:false,rec:false})
  const [boughtPackIds,setBoughtPackIds]=useState([])
  useEffect(()=>{setBoughtIds([]);setBoughtPackIds([])},[shopCards])
  const [openPackModal,setOpenPackModal]=useState(null) // {pack, cards, picksLeft, picked}
  const circleNum=Math.floor(fightIndex/3)+1
  const can=p=>stash>=p
  const stashColor=stash>=420?'#ff3300':stash>=380?'#ff9900':'#55ee66'
  const typeClr=t=>t==='CORRUPT'?'#aa1111':t==='UTILITY'?'#22aa44':t==='EMBER'?'#c87820':'#9933cc'
  const typeGlow=t=>t==='CORRUPT'?'rgba(170,0,0,0.5)':t==='UTILITY'?'rgba(30,160,50,0.5)':t==='EMBER'?'rgba(200,120,20,0.5)':'rgba(140,40,200,0.5)'
  const rarityAnim=r=>r==='Rare'?'holoShimmer 3s ease-in-out infinite':r==='Uncommon'?'uncommonGlow 2s ease-in-out infinite':''

  function buyCard(card){
    if(!can(cardPrice(card)))return
    if(card.isMember){
      // Member cards in center shop → recruit flow, NOT card flow
      onSpend(cardPrice(card),'recruit',{
        members:1,
        foilChance: card.foil?1:0,
        mythicChance: card.mythic?1:0,
        demonicChance: card.demonic?1:0,
        _memberOverride: card, // pass the specific member
      })
      setBoughtIds(p=>[...p,card.uid])
      onMarkSold&&onMarkSold(card.uid) // uid only — never card.id for members
      return
    }
    onSpend(cardPrice(card),'card',card)
    setBoughtIds(p=>[...p,card.uid||card.id])
    onMarkSold&&onMarkSold(card.uid||card.id)
  }
  function buyLeft(key,cost,type,item){
    if(!can(cost))return
    onSpend(cost,type,item)
    setLeftBought(p=>({...p,[key]:true}))
    onMarkSold&&onMarkSold(item.id||item.uid)
    if(key==='cart')onBuyCart&&onBuyCart()
    if(key==='cpas')onBuyCpas&&onBuyCpas()
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
      if(mythicChance&&r<mythicChance)return {...c,mythic:true,uid:uid()}
      if(foilChance&&r<foilChance)return {...c,foil:true,uid:uid()}
      return {...c,uid:uid()}
    })
    const _uc=getUnlockedCards()
    const commons=_uc.filter(c=>c.rarity==='Common'&&!c.shopOnly)
    const uncommons=_uc.filter(c=>c.rarity==='Uncommon')
    const rares=_uc.filter(c=>c.rarity==='Rare'&&!c.shopOnly)

    if(pack.id==='cassette')return{cards:applyFoilMythic(pickRandom(commons,3),0,0),picks:1}
    if(pack.id==='cdr')return{cards:applyFoilMythic([...pickRandom(commons,3),...pickRandom(uncommons,2)],0.03,0),picks:1}
    if(pack.id==='vinyl')return{cards:applyFoilMythic([...pickRandom(uncommons,1),...pickRandom(rares,1)],0.20,0),picks:1}
    if(pack.id==='rarevinyl')return{cards:applyFoilMythic([...pickRandom(commons,2),...pickRandom(uncommons,2),...pickRandom(rares,1)],0.30,0.05),picks:2}
    if(pack.id==='cursed'){
      const base=[...pickRandom(uncommons,2),...pickRandom(rares,2)]
      // 10% chance one is a passive
      if(rng()<0.1&&(starterPassives||[]).length){
        const pas=starterPassives[Math.floor(rng()*starterPassives.length)]
        base.push({...pas,_isPack:true,uid:uid()})
      } else {
        base.push(...pickRandom(rares,1))
      }
      return{cards:applyFoilMythic(base,0.50,0.20),picks:2}
    }
    if(pack.id==='ritual'){
      const packs=(starterPassives||[]).filter(p=>!(activePassives||[]).some(e=>e.id===p.id))
      return{cards:pickRandom(packs,Math.min(2,packs.length)).map(p=>({...p,_isPack:true,uid:uid()})),picks:1}
    }
    if(pack.id==='hellforged'){
      const arts=(starterArtifacts||[]).filter(a=>!(activeArtifacts||[]).some(e=>e.id===a.id))
      return{cards:pickRandom(arts,Math.min(2,arts.length)).map(a=>({...a,_isPack:true,uid:uid()})),picks:1}
    }
    if(pack.id==='garage'){
      const members=getUnlockedMusicians().map(m=>({...m,isMember:true,uid:uid()}))
      return{cards:pickRandom(members,2),picks:1}
    }
    if(pack.id==='touring'){
      const members=getUnlockedMusicians().map(m=>({...m,isMember:true}))
      return{cards:applyFoilMythic(pickRandom(members,3),0.15,0),picks:1}
    }
    if(pack.id==='demonic'){
      const members=getUnlockedMusicians().map(m=>({...m,isMember:true}))
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
      setBoughtPackIds(p=>[...p,openPackModal.pack.id])
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
          {card.upgraded&&<div style={{position:'absolute',bottom:6,right:6,width:22,height:22,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ffd700,#cc8800)',border:'2px solid #ffd700',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#000',boxShadow:'0 0 10px rgba(255,200,0,0.6)'}}>+</div>}
          {/* ember cost */}
          {card.embers>0&&<div style={{position:'absolute',top:card.foil||card.mythic?38:8,right:10,width:40,height:40,borderRadius:'50%',
            background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',
            border:'2px solid #ff6600',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'#fff',
            boxShadow:'0 0 12px rgba(255,100,0,0.6)'}}>{card.embers}</div>}
          <div style={{flex:'0 0 35%',display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:72,marginTop:card.foil||card.mythic?28:0,background:'rgba(0,0,0,0.25)',position:'relative'}}>
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
      <div style={{position:'absolute',inset:0,zIndex:9600,
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
              color:'#aa8a40',cursor:'pointer',textTransform:'uppercase'}}>
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
    const bought=boughtIds.includes(card.uid||card.id)||(soldIds||[]).includes(card.uid||card.id)
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
              :<div style={{position:'absolute',top:7,right:10}}><div style={{width:24,height:24,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#fff',boxShadow:'0 0 8px rgba(255,100,0,0.6)'}}>0</div></div>}
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
    const bought=boughtPackIds.includes(pack.id)
    const canBuy=can(pack.cost)&&!bought
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
        <div onClick={()=>canBuy&&handleOpenPack(pack)}
          style={{flex:1,minHeight:420,display:'flex',flexDirection:'column',alignItems:'center',
            background:'linear-gradient(160deg,#12100a 0%,#1e1a0e 40%,#120e08 100%)',
            border:hov&&canBuy?'2px solid '+ac:'1px solid '+ac+'66',
            borderRadius:10,overflow:'hidden',
            cursor:canBuy?'pointer':'default',
            transform:hov&&canBuy?'translateY(-6px) scale(1.02)':'none',
            transition:'transform 0.18s,box-shadow 0.15s,border-color 0.15s',
            boxShadow:hov&&canBuy?'0 16px 48px rgba(0,0,0,0.95),0 0 32px '+ac+'55':'2px 6px 20px rgba(0,0,0,0.7)',
            position:'relative',padding:'0 14px 18px',
            animation:bought?'':'throbShop 4.5s ease-in-out infinite'}}>
          {bought&&<SoldOverlay/>}
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
    <div style={{position:'absolute',inset:0,zIndex:9500,
      background:'radial-gradient(ellipse at 50% 0%,rgba(28,18,4,1) 0%,rgba(6,4,1,1) 100%)',
      display:'flex',flexDirection:'column',gap:10,padding:12,
      fontFamily:"'MBScribblesFont',serif",overflow:'hidden',
      boxSizing:'border-box',height:1080}}>

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
            onBuy={()=>{if(can(recruitPack.cost)){onSpend(recruitPack.cost,'recruit',recruitPack);setLeftBought(p=>({...p,rec:true}))}}} />
          {circleArtifact&&<LeftCard item={circleArtifact} price={circleArtifact.cost}
            label={'Vintage Amp · C'+circleNum} accent='#c87820' id='cart'
            sold={leftBought.cart||!!circleCartBought||activeArtifacts.some(a=>a.id===circleArtifact.id)||(soldIds||[]).includes(circleArtifact.id)}
            onBuy={()=>buyLeft('cart',circleArtifact.cost,'artifact',circleArtifact)} />}
          {circlePassive&&<LeftCard item={circlePassive} price={circlePassive.cost}
            label={'Effect Pedal · C'+circleNum} accent='#9933cc' id='cpas'
            sold={leftBought.cpas||!!circleCpasBought||activePassives.some(p=>p.id===circlePassive.id)||(soldIds||[]).includes(circlePassive.id)}
            onBuy={()=>buyLeft('cpas',circlePassive.cost,'passive',circlePassive)} />}
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'visible',minHeight:0}}>

          {/* CARDS ROW */}
          <div style={{border:'1px solid rgba(160,110,35,0.3)',borderRadius:8,padding:'8px 12px 12px',background:'rgba(10,6,2,0.3)'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#c8a040',letterSpacing:3,textTransform:'uppercase',textAlign:'center',marginBottom:4}}>🎸 Cards For Sale</div>
          <div style={{flexShrink:0,display:'flex',gap:20,justifyContent:'center',alignItems:'flex-start',paddingTop:4}}>
            {/* THE DEALER — first card */}
            <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',paddingTop:24,position:'relative'}}>
              <div style={{flex:1,minHeight:420,display:'flex',flexDirection:'column',
                background:'linear-gradient(160deg,#0a100a,#040804)',
                border:'2px solid rgba(50,180,50,0.5)',borderRadius:10,
                padding:'0 14px 14px',overflow:'hidden',
                boxShadow:'0 0 30px rgba(40,150,40,0.15)'}}>
                <div style={{height:7,flexShrink:0,background:'linear-gradient(90deg,#22882244,#44cc44ee,#22882244)',boxShadow:'0 0 12px rgba(40,200,40,0.5)'}}/> 
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:26,
                  color:'#44cc44',textAlign:'center',marginTop:8,
                  textShadow:'0 0 18px rgba(60,200,60,0.8)'}}>🌿 The Dealer</div>
                {/* Mushrooms */}
                <div onClick={()=>{if(shroomsInStock&&heldShrooms<drugMax&&can(6)){onSpend(6,'dealer',null);onBuyShrooms()}}}
                  style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    background:shroomsInStock&&heldShrooms<drugMax?'rgba(80,40,10,0.4)':'rgba(20,15,10,0.4)',
                    border:shroomsInStock&&heldShrooms<drugMax?'1px solid rgba(200,150,50,0.5)':'1px solid rgba(60,40,20,0.3)',
                    borderRadius:8,cursor:shroomsInStock&&heldShrooms<drugMax&&can(6)?'pointer':'default',
                    margin:'8px 0 4px',transition:'all 0.15s',position:'relative',
                    opacity:shroomsInStock?1:0.5}}>
                  {/* Cost oval */}
                  <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',
                    background:shroomsInStock&&heldShrooms<drugMax&&can(6)?'rgba(8,25,8,0.97)':'rgba(18,10,4,0.97)',
                    border:'2px solid '+(shroomsInStock&&heldShrooms<drugMax&&can(6)?'#44bb44':'#4a3318'),borderRadius:20,
                    padding:'3px 14px',zIndex:5,whiteSpace:'nowrap',
                    fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,
                    color:shroomsInStock&&heldShrooms<drugMax&&can(6)?'#55ee55':'#554428'}}>🌿 6</div>
                  <div style={{fontSize:72}}>🍄</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,
                    color:shroomsInStock?'#e8a820':'#554428',marginTop:4}}>
                    {heldShrooms>=drugMax?'HOLDING'+(heldShrooms>1?' ×'+heldShrooms:''):shroomsInStock?'Magic Mushrooms':'DRY'}</div>
                  {heldShrooms>=drugMax&&<SoldOverlay/>}
                </div>
                {/* Acid */}
                <div onClick={()=>{if(acidInStock&&heldAcid<drugMax&&can(12)){onSpend(12,'dealer',null);onBuyAcid()}}}
                  style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    background:acidInStock&&heldAcid<drugMax?'rgba(40,10,80,0.4)':'rgba(15,10,20,0.4)',
                    border:acidInStock&&heldAcid<drugMax?'1px solid rgba(150,50,220,0.5)':'1px solid rgba(40,20,60,0.3)',
                    borderRadius:8,cursor:acidInStock&&heldAcid<drugMax&&can(12)?'pointer':'default',
                    margin:'4px 0 8px',transition:'all 0.15s',position:'relative',
                    opacity:acidInStock?1:0.5}}>
                  {/* Cost oval */}
                  <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',
                    background:acidInStock&&heldAcid<drugMax&&can(12)?'rgba(8,25,8,0.97)':'rgba(18,10,4,0.97)',
                    border:'2px solid '+(acidInStock&&heldAcid<drugMax&&can(12)?'#44bb44':'#4a3318'),borderRadius:20,
                    padding:'3px 14px',zIndex:5,whiteSpace:'nowrap',
                    fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,
                    color:acidInStock&&heldAcid<drugMax&&can(12)?'#55ee55':'#554428'}}>🌿 12</div>
                  <div style={{fontSize:72}}>🧪</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,
                    color:acidInStock?'#cc44ff':'#4a2a6a',marginTop:4}}>
                    {heldAcid>=drugMax?'HOLDING'+(heldAcid>1?' ×'+heldAcid:''):acidInStock?'Blotter Acid':'DRY'}</div>
                  {heldAcid>=drugMax&&<SoldOverlay/>}
                </div>
              </div>
            </div>
            {shopCards.filter(Boolean).map((card,i)=><SaleCard key={i} card={card} idx={i}/>)}
          </div>
          </div>

          {/* GAP */}
          <div style={{flex:1,minHeight:8,maxHeight:30}}/>

          {/* PACKS + PAWN ROW */}
          <div style={{border:'1px solid rgba(160,110,35,0.3)',borderRadius:8,padding:'8px 12px 12px',background:'rgba(10,6,2,0.3)'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#c8a040',letterSpacing:3,textTransform:'uppercase',textAlign:'center',marginBottom:4}}>📦 Booster Packs + Pawn Shop</div>
          <div style={{flexShrink:0,display:'flex',gap:20,justifyContent:'center',alignItems:'flex-start'}}>
            {(boosterPacks||[]).slice(0,2).map((pack,i)=><BoosterPack key={i} pack={pack} idx={i}/>)}
            <div style={{paddingTop:24,flexShrink:0}}>
            <div style={{width:420,height:420,
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
            </div>
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
                onBurnCard={(c)=>{onPawnBurnCard&&onPawnBurnCard(c)}}
                onClose={()=>setPawnOpen(false)}
              />}
            </div>
            {/* REROLL + STASH — stacked, centered with pawn shop */}
            <div style={{display:'flex',flexDirection:'column',gap:12,justifyContent:'center'}}>
              <div style={{width:140,height:140,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,
                background:'rgba(25,18,4,0.92)',
                border:'3px solid rgba(200,150,30,0.85)',
                borderRadius:8,cursor:'pointer',
                boxShadow:'0 0 16px rgba(180,130,20,0.3)',
                animation:'rerollWiggle 3s ease-in-out infinite'}}
                onClick={onReroll}
                onMouseEnter={e=>{e.currentTarget.style.animation='none';e.currentTarget.style.background='rgba(55,40,8,0.95)'}}
                onMouseLeave={e=>{e.currentTarget.style.animation='rerollWiggle 3s ease-in-out infinite';e.currentTarget.style.background='rgba(25,18,4,0.92)'}}>
                <span style={{fontSize:28}}>🔄</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#e8c040',letterSpacing:2,textTransform:'uppercase'}}>Re-Roll</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:25,fontWeight:900,color:'#e8c040'}}>🌿 {rerollCost}</span>
              </div>
              <div style={{width:140,height:140,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,
                background:'rgba(5,15,5,0.92)',
                border:'2px solid #44cc44',
                borderRadius:8}}>
                <span style={{fontSize:28}}>🌿</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:39,fontWeight:900,color:'#44cc44',lineHeight:1}}>{stash}</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#44cc44',letterSpacing:2,textTransform:'uppercase',fontWeight:900}}>Stash</span>
              </div>
            </div>
          </div>
          </div>

        </div>

      </div>
    </div>
    </>
  )
}

function StageSlot({member,isAttacking,isDiceTarget,onDrop,onDragOver,onDragStart,innerRef,bondColor,mentorState,corruption}){
  const [over,setOver]=useState(false)
  const [showTip,setShowTip]=useState(false)
  if(!member){
    return <div ref={innerRef} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}}
      style={{width:240,height:300,border:`1px dashed ${over?'rgba(232,168,32,0.6)':'rgba(160,100,30,0.22)'}`,borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,background:over?'rgba(100,70,15,0.18)':'rgba(28,16,4,0.14)',transition:'all 0.2s'}}>
      <div style={{fontSize:28,opacity:.1}}>⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'rgba(160,100,30,0.28)',fontStyle:'italic'}}>empty</div>
    </div>
  }
  const st=member.tooStoned
  const buffCount=member.buffCount||0
  return(
    <div ref={innerRef} draggable onDragStart={onDragStart} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}} onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}
      style={{width:290,height:360,display:'flex',flexDirection:'column',background:st?'linear-gradient(180deg,#1a1a1a,#0a0a0a)':'linear-gradient(180deg,#1c1208,#0a0704)',
        border:isDiceTarget?'3px solid #e8a820':isAttacking?'2px solid #ff3300':mentorState==='active'?'3px solid #ffd700':mentorState==='broken'?'2px solid #555':mentorState==='mentor'?'2px solid #ffd700':bondColor?'2px solid '+bondColor:over?'2px solid #e8a820':st?'1px solid #333':member.demonic?'2px solid #ffd700':member.mythic?'2px solid #cc44ff':member.foil?'2px solid #88ccff':'2px solid rgba(190,120,25,0.85)',
        borderRadius:6,
        boxShadow:isDiceTarget?'0 0 30px rgba(232,168,32,0.7)':isAttacking?'0 0 40px rgba(255,50,0,0.8)':mentorState==='active'&&!st?'0 0 40px rgba(255,215,0,0.9),0 6px 24px rgba(0,0,0,0.85)':mentorState==='mentor'&&!st?'0 0 22px rgba(255,215,0,0.5),0 6px 24px rgba(0,0,0,0.85)':bondColor&&!st?'0 0 20px '+bondColor+',0 6px 24px rgba(0,0,0,0.85)':!st&&member.demonic?'0 0 25px rgba(255,200,0,0.5),0 6px 24px rgba(0,0,0,0.85)':!st&&member.mythic?'0 0 25px rgba(200,0,255,0.4),0 6px 24px rgba(0,0,0,0.85)':!st&&member.foil?'0 0 20px rgba(100,180,255,0.35),0 6px 24px rgba(0,0,0,0.85)':'0 6px 24px rgba(0,0,0,0.85)',
        transform:st?'rotate(15deg) scale(0.95)':'none',
        opacity:st?0.5:1,
        animation:(!st&&!isAttacking&&!isDiceTarget)?'throb 3s ease-in-out infinite':'none',
        transition:'border 0.2s, box-shadow 0.2s, opacity 0.3s, transform 0.3s',
        cursor:'grab',position:'relative'}}>
      {/* Keyword tooltip */}
      {showTip&&member&&KEYWORD_DESC[member.keyword]&&<div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',background:'rgba(8,4,2,0.97)',border:'1px solid rgba(160,100,25,0.6)',borderRadius:6,padding:'10px 14px',zIndex:9999,pointerEvents:'none',minWidth:200,maxWidth:260,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#e8a820',letterSpacing:2,textTransform:'uppercase',marginBottom:5}}>{member.keyword}</div><div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'#c8b080',lineHeight:1.5,fontStyle:'italic'}}>{KEYWORD_DESC[member.keyword]}</div></div>}
      {buffCount>0&&<div style={{position:'absolute',top:6,left:6,background:buffCount>=3?'#aa1111':'#9933cc',borderRadius:10,padding:'1px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#fff',zIndex:10,boxShadow:'0 0 8px rgba(0,0,0,0.6)'}}>+{buffCount}</div>}
      {isDiceTarget&&<div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:20}}>🎯</div>}
      {mentorState==='active'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:18,textShadow:'0 0 12px #ffd700',zIndex:12,animation:'mentorPulse 1.5s ease-in-out infinite'}}>⛓</div>}
      {mentorState==='broken'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:16,opacity:0.45,zIndex:12}}>💔</div>}
      {mentorState==='mentor'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:18,textShadow:'0 0 8px rgba(255,215,0,0.6)',zIndex:12}}>⛓</div>}
      <div style={{height:5,borderRadius:'6px 6px 0 0',
        background:st?'#333':member.demonic?'linear-gradient(90deg,#e8a820,#ffd700,#e8a820)':member.mythic?'linear-gradient(90deg,#cc44ff,#ff88ff,#cc44ff)':member.foil?'linear-gradient(90deg,#88ccff,#ffffff,#88ccff)':'linear-gradient(90deg,#dd2222,#ff7700)',
        boxShadow:st?'none':member.demonic?'0 0 14px rgba(255,200,0,0.8)':member.mythic?'0 0 14px rgba(200,0,255,0.7)':member.foil?'0 0 14px rgba(100,180,255,0.7)':'0 0 14px rgba(220,50,0,0.5)'}}/>
      {!st&&(member.demonic||member.mythic||member.foil)&&<div style={{position:'absolute',top:8,right:8,zIndex:10,fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:2,padding:'2px 7px',borderRadius:10,
        background:member.demonic?'rgba(200,160,0,0.3)':member.mythic?'rgba(150,0,220,0.3)':'rgba(80,160,255,0.2)',
        border:'1px solid '+(member.demonic?'#ffd700':member.mythic?'#cc44ff':'#88ccff'),
        color:member.demonic?'#ffd700':member.mythic?'#dd88ff':'#88ccff',
        textShadow:member.demonic?'0 0 8px rgba(255,200,0,0.9)':member.mythic?'0 0 8px rgba(200,0,255,0.9)':'0 0 8px rgba(100,180,255,0.9)'}}>
        {member.demonic?'⛧ DEMONIC':member.mythic?'✦ MYTHIC':'✨ FOIL'}
      </div>}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:68,background:'rgba(0,0,0,0.3)',position:'relative',minHeight:90}}>
        {member.emoji}
        {st&&<div style={{position:'absolute',top:4,right:4,fontSize:22}}>💨</div>}
        {isAttacking&&<div style={{position:'absolute',inset:0,background:'rgba(255,50,0,0.12)',animation:'pulse 0.4s ease infinite alternate'}}/>}
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:st?'#555':'#e8d8a0',textAlign:'center',padding:'8px 6px 3px',lineHeight:1}}>{member.name}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,letterSpacing:1.5,color:st?'#444':'#8a7a50',textAlign:'center',padding:'4px 4px 8px',textTransform:'uppercase'}}>{member.role}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 16px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'#555':'#ee2222',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>ATK</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,lineHeight:1,color:st?'#555':'#ee2222',textShadow:st?'none':'0 0 12px rgba(200,0,0,0.6)'}}>{(()=>{
            if(st)return member.atk
            const base=ALL_MUSICIANS.find(mu=>mu.id===member.id)
            const baseAtk=base?base.atk+(member.demonic?4:member.mythic?2:member.foil?1:0):member.atk
            const permBonus=member.atk-baseAtk
            const corrBonus=member.keyword==='CORRUPT'&&corruption>0?Math.floor(corruption/15):0
            const totalBonus=permBonus+corrBonus
            if(totalBonus>0)return <>{baseAtk}<span style={{fontSize:22,color:'#ff8800'}}>+{totalBonus}</span></>
            return member.atk
          })()}</div>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'#555':'#e8a820',fontWeight:700,letterSpacing:1,textAlign:'center'}}>{member.keyword}</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'#555':member.hp<=2?'#ff4400':'#33dd33',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>HP</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:36,fontWeight:900,lineHeight:1,color:st?'#555':member.hp<=2?'#ff4400':'#33dd33',textShadow:st?'none':'0 0 12px rgba(0,190,0,0.5)'}}>{member.hp}</div>
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
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={e=>{e.stopPropagation();onClick()}}
      style={{width:210,height:310,flexShrink:0,position:'relative',display:'flex',flexDirection:'column',
        background:isSelected?'linear-gradient(180deg,#2a1a0a,#160e05)':'linear-gradient(180deg,#201408,#100804)',
        border:isSelected?`2px solid #cc0000`:isHovered?`2px solid ${bc}`:`1px solid ${bc}${isShopBought?'cc':'55'}`,
        borderRadius:7,cursor:'grab',position:'relative',
        transformOrigin:'bottom center',
        transform:isDragging?'scale(0.85) rotate(5deg)':isHovered?'translateY(-80px) scale(1.5) rotate(0deg)':isSelected?`rotate(${rot}deg) translateY(-50px)`:`rotate(${rot}deg) translateY(${yOff}px)`,
        transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
        zIndex:isDragging?0:isHovered?9999:isSelected?50+index:10+index,
        boxShadow:isSelected?'0 0 0 2px #cc0000,0 0 22px rgba(200,0,0,0.75),0 0 45px rgba(180,0,0,0.4)':isShopBought?`0 0 12px ${bc}44`:isHovered?`0 36px 72px rgba(0,0,0,0.95),0 0 36px ${glow}`:'2px 4px 16px rgba(0,0,0,0.75)',
        opacity:isDragging?0.4:1,
        animation:shimmerAnim,
        margin:total>HAND_SIZE?'0 -28px':'0 -22px',userSelect:'none',willChange:isHovered?'transform':'auto'}}>
      <div style={{height:6,flexShrink:0,borderRadius:'7px 7px 0 0',background:bc,boxShadow:`0 0 14px ${glow}`}}/>
      {isUsed&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.85)',border:'2px solid #888',borderRadius:6,padding:'6px 14px',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#888',letterSpacing:4,zIndex:20,pointerEvents:'none'}}>USED</div>}
      {card.embers>0?(
        <div style={{position:'absolute',top:8,right:8,display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:canAfford?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'rgba(40,20,5,0.9)',border:`2px solid ${canAfford?'#ff6600':'#4a2a10'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:canAfford?'#fff':'#5a3a10',boxShadow:canAfford?'0 0 10px rgba(255,100,0,0.6)':'none'}}>{card.embers}</div>
          {!canAfford&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#ff4400',letterSpacing:0.5,whiteSpace:'nowrap',textShadow:'0 0 8px rgba(255,60,0,0.9)',background:'rgba(0,0,0,0.8)',borderRadius:3,padding:'1px 4px',marginTop:2}}>NEED {card.embers}🔥</div>}
        </div>
      ):(
        <div style={{position:'absolute',top:8,right:8}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#fff',boxShadow:'0 0 10px rgba(255,100,0,0.6)'}}>0</div>
        </div>
      )}
      {card.foil&&<div style={{position:'absolute',top:8,left:28,padding:'2px 5px',borderRadius:3,background:'rgba(255,215,0,0.3)',border:'1px solid rgba(255,215,0,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#ffd700',letterSpacing:1}}>✨FOIL</div>}
      {card.mythic&&<div style={{position:'absolute',top:8,left:28,padding:'2px 5px',borderRadius:3,background:'rgba(120,0,180,0.4)',border:'1px solid rgba(180,0,255,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#cc44ff',letterSpacing:1}}>⛧MYTHIC</div>}
      {card.rarity==='Rare'&&<div style={{position:'absolute',top:8,left:8,padding:'2px 5px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#ffdd44',letterSpacing:1}}>RARE</div>}
      {card.rarity==='Uncommon'&&<div style={{position:'absolute',top:8,left:8,padding:'2px 5px',borderRadius:3,background:'rgba(100,150,200,0.18)',border:'1px solid rgba(150,200,255,0.28)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:700,color:'#aaddff',letterSpacing:1}}>✦</div>}
      <div style={{height:75,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,background:'rgba(0,0,0,0.35)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at center,${bc}18,transparent 70%)`}}/>
        {card.emoji}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,color:'#eedfc0',textAlign:'center',padding:'5px 5px 2px',letterSpacing:.4,lineHeight:1.2,borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:bc,textAlign:'center',padding:'3px 4px',letterSpacing:1.8,textTransform:'uppercase',flexShrink:0,textShadow:'0 0 8px '+bc+'88'}}>{card.type}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#d0b888',textAlign:'center',padding:'2px 6px 5px',lineHeight:1.4,flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>{card.effect}</div>
    </div>
  )
}

function BossSection({enemy,currentHp,isWiggling,innerRef,debuff,chromaStr,dblRoll}){
  const pct=Math.max(0,(currentHp/enemy.maxHp)*100),isLow=currentHp<enemy.maxHp*.35
  return(
    <div ref={innerRef} style={{display:'flex',gap:0,animation:isWiggling?'wiggle 0.45s ease':'none',width:'100%',minHeight:180}}>
      <div style={{width:180,flexShrink:0,background:'radial-gradient(circle at 40% 35%,#3a0000,#080000)',border:`3px solid ${isLow?'#ff2222':'rgba(140,40,15,0.85)'}`,borderRadius:'6px 0 0 6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:90,boxShadow:isLow?'0 0 40px rgba(220,0,0,0.7),0 0 80px rgba(150,0,0,0.3)':'0 0 20px rgba(120,0,0,0.5),0 0 40px rgba(80,0,0,0.2)',position:'relative',overflow:'hidden',transition:'all 0.5s',alignSelf:'stretch'}}>
        {enemy.emoji}
        {isLow&&<div style={{position:'absolute',inset:0,background:'rgba(120,0,0,0.2)',animation:'pulse 1.2s ease infinite alternate'}}/>}
        {debuff>0&&<div style={{position:'absolute',bottom:4,right:4,background:'rgba(0,80,160,0.9)',border:'1px solid #4488ff',borderRadius:4,padding:'2px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#88aaff'}}>-{debuff}dmg</div>}
      </div>
      <div style={{flex:1,padding:'10px 24px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:2}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,letterSpacing:4,color:'#ff4422',textTransform:'uppercase',fontWeight:900,textShadow:'0 0 18px rgba(255,60,20,0.9),0 0 40px rgba(200,30,0,0.6)',textAlign:'center'}}>{enemy.circle} · {enemy.subtitle}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'#120804',lineHeight:1,textShadow:chromaStr>0?`-${chromaStr}px 0 rgba(255,0,0,0.5), ${chromaStr}px 0 rgba(0,80,255,0.4), 1px 1px 0 rgba(0,0,0,0.5)`:'1px 1px 0 rgba(0,0,0,0.5)',textAlign:'center',marginTop:10}}>{enemy.name}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:35,color:'#4a0808',fontStyle:'italic',lineHeight:1.2,fontWeight:900,textAlign:'center',marginTop:2}}>{enemy.passive}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#3a0606',letterSpacing:1,fontWeight:900,textAlign:'center'}}>Base damage: {enemy.baseDmg} per Strike</div>
        <div style={{width:'100%',marginTop:4}}>
          <div style={{width:'100%',height:26,background:'rgba(50,25,8,0.75)',border:'1px solid rgba(100,55,15,0.6)',borderRadius:2,overflow:'hidden',boxShadow:'inset 0 2px 6px rgba(0,0,0,0.7)',position:'relative'}}>
            {[25,50,75].map(pp=><div key={pp} style={{position:'absolute',top:0,bottom:0,left:`${pp}%`,width:1,background:'rgba(0,0,0,0.35)',zIndex:2}}/>)}
            <div style={{height:'100%',background:isLow?'linear-gradient(90deg,#660000,#cc0000,#ff2200)':'linear-gradient(90deg,#7a0000,#aa1100,#cc2200)',width:`${pct}%`,transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)'}}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'rgba(255,230,180,1)',letterSpacing:3,textShadow:'0 0 8px rgba(0,0,0,0.99),0 1px 3px rgba(0,0,0,0.99)'}}>{Math.max(0,currentHp)} HP REMAINING</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeckPile({count,label,onClick,cards}){
  const [tipOpen,setTipOpen]=useState(false)
  const dist=cards?{RIFF:cards.filter(c=>c.type==='RIFF').length,CORRUPT:cards.filter(c=>c.type==='CORRUPT').length,UTILITY:cards.filter(c=>c.type==='UTILITY').length,EMBER:cards.filter(c=>c.type==='EMBER').length}:null
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:onClick?'pointer':'default',position:'relative'}} onClick={onClick}
      onMouseEnter={()=>setTipOpen(true)} onMouseLeave={()=>setTipOpen(false)}>
      <div style={{position:'relative',width:90,height:112}}>
        {[2,1,0].map(i=><div key={i} style={{position:'absolute',width:80,height:100,background:i===0?'linear-gradient(135deg,#1e1408,#0a0804)':`rgba(15,10,4,${.7-i*.2})`,border:'1px solid rgba(160,110,35,0.55)',borderRadius:4,top:i*3,left:i*3}}>
          {i===0&&<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,opacity:.2,color:'#c8a060'}}>⛧</div>}
        </div>)}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:26,fontWeight:900,color:'#c8a060'}}>{count}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,letterSpacing:2,color:'#c8a040',textTransform:'uppercase'}}>{label}</div>
      {tipOpen&&dist&&count>0&&<div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'rgba(10,6,2,0.97)',border:'1px solid rgba(160,110,35,0.6)',borderRadius:6,padding:'8px 12px',pointerEvents:'none',minWidth:140,boxShadow:'0 4px 16px rgba(0,0,0,0.8)'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#c8a040',letterSpacing:2,textAlign:'center',marginBottom:4}}>{label.toUpperCase()}</div>
        {[['RIFF','#9933cc'],['CORRUPT','#aa1111'],['UTILITY','#22aa44'],['EMBER','#c87820']].map(([t,c])=>
          <div key={t} style={{display:'flex',justifyContent:'space-between',gap:8,fontFamily:"'MBScribblesFont',serif",fontSize:11,color:c,fontWeight:700}}>
            <span>{t}</span><span>{dist[t]}</span>
          </div>
        )}
        <div style={{borderTop:'1px solid rgba(160,110,35,0.3)',marginTop:4,paddingTop:3,display:'flex',justifyContent:'space-between',fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#c8a060',fontWeight:900}}>
          <span>Total</span><span>{count}</span>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#886644',textAlign:'center',marginTop:4}}>Click to view cards</div>
      </div>}
    </div>
  )
}

function PhaseDots({left,total,color,wide}){
  const sz=wide?17:13;const start=total-left;return <div style={{display:'flex',gap:wide?4:4}}>{Array.from({length:total}).map((_,i)=>{const filled=i>=start;return <div key={i} style={{width:sz,height:sz,borderRadius:4,background:filled?color:'rgba(40,20,8,0.6)',border:`1px solid ${filled?color:'rgba(80,50,20,0.3)'}`,boxShadow:filled?`0 0 9px ${color}99`:'none',transition:'all 0.25s'}}/>})}</div>
}

function EndScreen({won,cause,enemy,stats,seed,onReset,streakWins,streakLosses,totalRuns,isDailyRun,onDailyChallenge,personalBest,dailyStreak,lifetimeScore,discovered,newAchievements,enemyHp,stage}){
  const isStoned=cause==='stoned'
  const isBeaten=cause==='beaten'
  const isVictory=cause==='victory'
  const circleReached=Math.floor((stats.fightsSurvived)/3)+1
  const streakMsg=streakWins>1?'🔥 '+streakWins+' WIN STREAK!':streakLosses>2?'💀 '+streakLosses+' losses in a row...':''
  const finalScore=calcRunScore(stats,isVictory)
  const grade=getScoreGrade(finalScore,isVictory)
  const streakBonus=dailyStreak>=30?20:dailyStreak>=7?10:dailyStreak>=3?5:0
  const isBest=finalScore>=(personalBest||0)&&finalScore>0
  const beatBy=isBest&&(personalBest||0)>0?finalScore-(personalBest||0):0
  const shortBy=!isBest&&(personalBest||0)>0?(personalBest||0)-finalScore:0
  const [displayScore,setDisplayScore]=useState(0)
  const [scoreReady,setScoreReady]=useState(false)
  const [copied,setCopied]=useState(false)
  useEffect(()=>{
    let start=null,duration=1800
    const step=ts=>{
      if(!start)start=ts
      const p=Math.min(1,(ts-start)/duration)
      const eased=1-Math.pow(1-p,3)
      setDisplayScore(Math.round(eased*finalScore))
      if(p<1)requestAnimationFrame(step)
      else{setDisplayScore(finalScore);setScoreReady(true)}
    }
    const t=setTimeout(()=>requestAnimationFrame(step),300)
    return()=>clearTimeout(t)
  },[finalScore])

  // ── UNLOCK MILESTONES ──────────────────────────────────────
  const UNLOCKS=[
    {score:1000,label:'New Card: Mosh Pit',emoji:'🤘'},
    {score:3000,label:'Unlock Vitalik',emoji:'🪈'},
    {score:5000,label:'6th Artifact Slot',emoji:'⛧'},
    {score:10000,label:'New Card: Blood Ritual',emoji:'🩸'},
    {score:15000,label:'Brynja Foil Available',emoji:'✨'},
    {score:25000,label:'Demonic Pack from C3',emoji:'😈'},
    {score:50000,label:'???',emoji:'❓'},
    {score:100000,label:'Lucifer Playable',emoji:'👑'},
  ]
  const newLifetime=(lifetimeScore||0)+finalScore
  const nextUnlock=UNLOCKS.find(u=>u.score>newLifetime)||UNLOCKS[UNLOCKS.length-1]
  const prevUnlockScore=UNLOCKS.filter(u=>u.score<=newLifetime).reduce((a,u)=>Math.max(a,u.score),0)
  const unlockProgress=nextUnlock.score>prevUnlockScore?Math.min(1,(newLifetime-prevUnlockScore)/(nextUnlock.score-prevUnlockScore)):1
  const unlocksEarned=UNLOCKS.filter(u=>u.score<=newLifetime).length

  // ── PERSONAL BEST GAP (prominent) ─────────────────────────
  const BestGap=()=>{
    const streakLabel=streakBonus>0?<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#ff6600',marginTop:4}}>🔥 Streak Bonus: +{streakBonus}% score</div>:null
    if(isBest&&scoreReady&&beatBy>0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,color:'#ffd700',fontWeight:900,textShadow:'0 0 20px rgba(255,200,0,0.6)',marginTop:6,animation:'throb 1.5s ease-in-out infinite'}}>🏆 NEW PERSONAL BEST! +{beatBy.toLocaleString()}</div></>
    if(isBest&&scoreReady&&beatBy===0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,color:'#ffd700',fontWeight:900,textShadow:'0 0 20px rgba(255,200,0,0.6)',marginTop:6}}>🏆 PERSONAL BEST!</div></>
    if(shortBy>0&&shortBy<=2000)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,color:'#cc2222',fontWeight:900,textShadow:'0 0 14px rgba(200,0,0,0.5)',marginTop:6}}>SO CLOSE! Only {shortBy.toLocaleString()} pts from your best!</div></>
    if(shortBy>0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#886633',marginTop:6}}>Your Best: {(personalBest||0).toLocaleString()} — {shortBy.toLocaleString()} to beat</div></>
    return streakLabel
  }

  // ── UNLOCK PROGRESS BAR ────────────────────────────────────
  const UnlockBar=()=>(<div style={{width:'100%',maxWidth:600,margin:'8px 0'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
      <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#c8a040',letterSpacing:2,textTransform:'uppercase'}}>Next Unlock</span>
      <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#aa8030'}}>{newLifetime.toLocaleString()} / {nextUnlock.score.toLocaleString()}</span>
    </div>
    <div style={{height:24,background:'rgba(20,12,4,0.8)',border:'1px solid rgba(100,65,15,0.5)',borderRadius:12,overflow:'hidden',position:'relative'}}>
      <div style={{height:'100%',width:(unlockProgress*100)+'%',background:'linear-gradient(90deg,#8a2200,#cc4400,#e8a820)',borderRadius:12,transition:'width 1.5s ease',boxShadow:'0 0 16px rgba(200,100,0,0.5)'}}/>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#fff',textShadow:'0 0 8px rgba(0,0,0,0.9)',letterSpacing:1}}>{nextUnlock.emoji} {nextUnlock.label}</span>
      </div>
    </div>
    {unlocksEarned>0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'#aa8a50',fontStyle:'italic',textAlign:'center',marginTop:3}}>{unlocksEarned} unlock{unlocksEarned>1?'s':''} earned so far</div>}
  </div>)

  // ── DISCOVERIES ────────────────────────────────────────────
  const discoveryList=discovered?[...discovered]:[]
  const Discoveries=()=>discoveryList.length>0?(<div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',maxWidth:600,margin:'4px 0'}}>
    {discoveryList.slice(0,8).map((d,i)=><div key={i} style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#e8a820',background:'rgba(40,25,5,0.8)',border:'1px solid rgba(200,140,30,0.4)',borderRadius:4,padding:'3px 10px',letterSpacing:1}}>NEW: {d}</div>)}
  </div>):null

  // ── ACHIEVEMENT BADGES ─────────────────────────────────────
  const allAchievements=getAchievements()
  const newAchIds=newAchievements||[]
  const AchievementBadges=()=>{
    if(newAchIds.length===0&&allAchievements.length===0)return null
    return(<div style={{width:'100%',maxWidth:600,margin:'6px 0'}}>
      {newAchIds.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:6}}>
        {newAchIds.map(id=>{const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return null;return <div key={id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#ffd700',background:'rgba(60,40,0,0.8)',border:'2px solid #ffd700',borderRadius:6,padding:'4px 12px',letterSpacing:1,animation:'throb 1.5s ease-in-out infinite'}}>{a.emoji} NEW: {a.label}</div>})}
      </div>}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#aa8a50',textAlign:'center'}}>{allAchievements.length} / {ACHIEVEMENTS.length} achievements</div>
    </div>)
  }

  // ── NEAR MISS MESSAGES ─────────────────────────────────────
  const NearMiss=()=>{
    if(isVictory)return null
    const msgs=[]
    // How close to killing the boss
    if(enemyHp>0&&enemyHp<=Math.max(50,stats.highestStrike*0.3)){
      msgs.push('💀 '+enemyHp+' more damage would have killed '+(enemy?.name||'the boss')+'!')
    } else if(enemyHp>0&&enemyHp<=200){
      msgs.push('💀 Only '+enemyHp+' HP left on '+(enemy?.name||'the boss')+'!')
    }
    // Members who almost survived
    if(stage){
      const almostAlive=stage.filter(m=>m&&m.tooStoned&&m.maxHp>0)
      for(const m of almostAlive.slice(0,2)){
        const hpNeeded=Math.max(1,Math.ceil(m.maxHp*0.1))
        if(hpNeeded<=5)msgs.push('😵 '+m.name+' was just '+hpNeeded+' HP from surviving!')
      }
    }
    // Close to next circle
    const fightInCircle=stats.fightsSurvived%3
    if(fightInCircle===2){msgs.push('🔥 One more fight would have cleared Circle '+circleReached+'!')}
    // Close to personal best
    if(shortBy>0&&shortBy<=500&&!isBest){msgs.push('⚡ Just '+shortBy+' pts from your personal best!')}
    if(msgs.length===0)return null
    return(<div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center',maxWidth:600,margin:'6px 0'}}>
      {msgs.slice(0,3).map((m,i)=><div key={i} style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'#cc6644',fontStyle:'italic',textShadow:'0 0 10px rgba(200,80,40,0.4)',textAlign:'center'}}>{m}</div>)}
    </div>)
  }

  // ── SHARE BUTTON ───────────────────────────────────────────
  const stakeInfo=(()=>{const sid=localStorage.getItem('vst_active_stake')||'bronze';const sk=STAKES.find(s=>s.id===sid);return sk||STAKES[0]})()
  const bandStr=stage?stage.filter(m=>m&&!m.tooStoned).map(m=>m.name).join(', '):''
  const shareText='⛧ VESTIBULE — RUN #'+(totalRuns||1)+' ⛧\nSCORE: '+finalScore.toLocaleString()+' — '+grade.label+(stakeInfo.id!=='bronze'?' ['+stakeInfo.name+' ×'+stakeInfo.scoreMult+']':'')+'\n'+(isVictory?'⛧ DEFEATED LUCIFER! ⛧':'Fell to '+(enemy?.name||'The Vestibule')+' at Circle '+circleReached)+(isVictory&&bandStr?'\nBand: '+bandStr:'')+'\nSEED: '+seed.toString(16).toUpperCase()+'\nCan you beat this? 🤘'
  const handleShare=()=>{if(navigator.clipboard){navigator.clipboard.writeText(shareText);setCopied(true);setTimeout(()=>setCopied(false),2000)}}

  // Shared stats grid
  const StatsGrid=()=>(
    <div style={{background:'rgba(20,12,4,0.88)',border:'1px solid rgba(100,65,15,0.35)',borderRadius:8,padding:'28px 48px',minWidth:780}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'#c8a040',textTransform:'uppercase',textAlign:'center',marginBottom:18}}>Run Statistics</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 48px'}}>
        {[
          ['Circle Reached',isVictory?'ALL 9 ⛧':circleReached+' / 9'],
          ['Fights Survived',stats.fightsSurvived],
          ['Strikes Thrown',stats.strikesThrown],
          ['Cards Played',stats.cardsPlayed],
          ['Total Damage',stats.totalDamage.toLocaleString()],
          ['Highest Strike',stats.highestStrike.toLocaleString()],
          ['Too Stoned Events',stats.tooStonedCount],
          ['Max Corruption',stats.maxCorruption+'%'],
          ['Stash Earned',stats.stashEarned+' 🌿'],
          ['Total Runs',totalRuns||1],
        ].map(function(row){
          return(
            <div key={row[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(80,50,10,0.12)'}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#b09060'}}>{row[0]}</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,fontWeight:900,color:isVictory&&row[0]==='Circle Reached'?'#ffdd44':'#c8a060'}}>{row[1]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Shared bottom row
  // ── RUN HISTORY ─────────────────────────────────────────────
  const [showHistory,setShowHistory]=useState(false)
  const runHistory=getRunHistory()
  const RunHistory=()=>runHistory.length>1?(<div style={{width:'100%',maxWidth:780,margin:'4px 0'}}>
    <div onClick={()=>setShowHistory(p=>!p)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#c8a040',letterSpacing:2,textTransform:'uppercase',cursor:'pointer',textAlign:'center',padding:'4px 0'}}>
      {showHistory?'▼ Hide Past Runs':'▶ Past Runs ('+runHistory.length+')'}</div>
    {showHistory&&<div style={{background:'rgba(20,12,4,0.88)',border:'1px solid rgba(100,65,15,0.35)',borderRadius:6,padding:'10px 16px',maxHeight:200,overflowY:'auto'}}>
      {runHistory.slice(0,20).map((r,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid rgba(80,50,10,0.12)',fontFamily:"'MBScribblesFont',serif",fontSize:13}}>
        <span style={{color:'#8a7040'}}>{r.date}</span>
        <span style={{color:r.cause==='victory'?'#ffd700':'#c8a060',fontWeight:900}}>{r.score?.toLocaleString()}</span>
        <span style={{color:'#aa8040',fontSize:11}}>{r.grade}</span>
        <span style={{color:r.cause==='victory'?'#44cc44':'#cc4444',fontSize:11}}>{r.cause==='victory'?'WIN ⛧':'C'+r.circle+' '+r.enemy}</span>
      </div>)}
    </div>}
  </div>):null

  const BottomRow=()=>(
    <div style={{display:'flex',gap:20,alignItems:'center'}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#9a8a40',letterSpacing:2}}>SEED: {seed.toString(16).toUpperCase()}</div>
      {isDailyRun&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#e8a820',letterSpacing:2,padding:'3px 12px',border:'1px solid #e8a820',borderRadius:3}}>🌍 DAILY CHALLENGE</div>}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a7a40',cursor:'pointer',letterSpacing:1}}
        onClick={()=>navigator.clipboard&&navigator.clipboard.writeText(seed.toString(16).toUpperCase())}>📋 Copy Seed</div>
    </div>
  )

  // ── HUGE PLAY AGAIN + SHARE ────────────────────────────────
  const Buttons=({victory})=>(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,marginTop:8}}>
      <button onClick={()=>{onReset()}}
        style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,letterSpacing:6,
          color:victory?'#ffd700':'#ee2222',
          background:victory?'rgba(60,40,0,0.4)':'rgba(120,0,0,0.3)',
          border:victory?'3px solid #c8a020':'3px solid #aa0000',
          borderRadius:8,padding:'18px 80px',cursor:'pointer',textTransform:'uppercase',
          textShadow:victory?'0 0 30px rgba(200,150,0,0.6)':'0 0 30px rgba(200,0,0,0.6)',
          boxShadow:victory?'0 0 40px rgba(200,150,0,0.3)':'0 0 40px rgba(200,0,0,0.3)',
          animation:'throb 2s ease-in-out infinite',transition:'all 0.15s'}}>
        {victory?'⛧ Play Again ⛧':'↺ Play Again'}
      </button>
      <div style={{display:'flex',gap:12}}>
        <button onClick={handleShare}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,
            color:copied?'#44cc44':'#e8a820',background:'rgba(50,35,5,0.4)',
            border:'1px solid '+(copied?'#44cc44':'#c87820'),borderRadius:3,
            padding:'10px 24px',cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s'}}>
          {copied?'✓ Copied!':'📋 Share Score'}
        </button>
        <button onClick={()=>onDailyChallenge&&onDailyChallenge()}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,color:'#e8a820',background:'rgba(50,35,5,0.4)',border:'1px solid #c87820',borderRadius:3,padding:'10px 24px',cursor:'pointer',textTransform:'uppercase'}}>
          🌍 Daily Challenge
        </button>
      </div>
    </div>
  )

  // ── STONED TO THE BONE ─────────────────────────────────────
  if(isStoned) return(
    <div style={{position:'absolute',inset:0,zIndex:9800,background:'rgba(2,0,0,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',gap:16,animation:'fadeIn 0.8s ease',overflowY:'auto',padding:'40px 0 60px'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,180,0,0.04) 2px,rgba(0,180,0,0.04) 4px)',animation:'interlaceFlicker 0.1s steps(1) infinite',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 20%,rgba(0,80,0,0.4) 100%)',pointerEvents:'none',zIndex:0,animation:'bgPulse 2s ease-in-out infinite'}}/>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:0}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:280,color:'rgba(180,180,180,0.06)',userSelect:'none',lineHeight:1}}>Vestibule</div>
      </div>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:110,color:'#cc1111',textShadow:'-4px 0 rgba(255,0,0,0.9),4px 0 rgba(0,255,80,0.7),0 0 60px rgba(180,0,0,0.8),3px 3px 0 #000'}}>Stoned to the Bone</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:60,color:'#44ff44',fontStyle:'italic',textAlign:'center',textShadow:'0 0 20px rgba(60,255,60,0.9),0 0 50px rgba(30,200,30,0.6),0 0 100px rgba(0,150,0,0.4)'}}>The band ran out of herb.</div>
                {/* Score */}
        <div style={{textAlign:'center',margin:'4px 0'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:60,fontWeight:900,color:grade.color,textShadow:'0 0 30px '+grade.color+',3px 3px 0 #000',letterSpacing:2,lineHeight:1}}>{displayScore.toLocaleString()}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:6,color:grade.color,textTransform:'uppercase',marginTop:4,textShadow:'0 0 10px '+grade.color}}>{grade.label}</div>
          {stakeInfo.id!=='bronze'&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:stakeInfo.color,letterSpacing:2,marginTop:4,padding:'3px 14px',border:'1px solid '+stakeInfo.color,borderRadius:4,background:'rgba(0,0,0,0.4)'}}>{stakeInfo.name.toUpperCase()} ×{stakeInfo.scoreMult}</div>}
          <BestGap/>
          <NearMiss/>
        </div>
        <UnlockBar/>
        <Discoveries/>
        <AchievementBadges/>
                {dailyStreak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'#ff6600',letterSpacing:3,padding:'5px 20px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:4}}>🔥 {dailyStreak} DAY STREAK</div>}
        {streakMsg&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#aa4444',letterSpacing:3,padding:'6px 24px',background:'rgba(0,0,0,0.5)',border:'1px solid #aa4444',borderRadius:4}}>{streakMsg}</div>}
        <StatsGrid/>
        <RunHistory/>
        <BottomRow/>
                {(totalRuns||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#886644',letterSpacing:3}}>RUN #{totalRuns}</div>}
        <Buttons victory={false}/>
      </div>
    </div>
  )

  // ── BEATEN BY BOSS ─────────────────────────────────────────
  if(isBeaten) return(
    <div style={{position:'absolute',inset:0,zIndex:9800,background:'rgba(6,0,0,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',gap:14,animation:'fadeIn 0.8s ease',overflowY:'auto',padding:'40px 0 60px'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(180,0,0,0.035) 2px,rgba(180,0,0,0.035) 4px)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 30%,rgba(80,0,0,0.5) 100%)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:0}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:280,color:'rgba(180,180,180,0.05)',userSelect:'none',lineHeight:1}}>Vestibule</div>
      </div>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
        {/* Boss emoji large */}
        <div style={{fontSize:100,filter:'drop-shadow(0 0 30px rgba(200,0,0,0.6))',animation:'throb 2s ease-in-out infinite'}}>{enemy?.emoji||'💀'}</div>
        {/* Defeated by */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:6,color:'#662222',textTransform:'uppercase'}}>Defeated by</div>
        {/* Boss name */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:88,color:'#cc2222',lineHeight:1,textShadow:'-3px 0 rgba(255,0,0,0.7),3px 0 rgba(180,0,0,0.5),0 0 50px rgba(160,0,0,0.7),3px 3px 0 #000',textAlign:'center'}}>{enemy?.name||'The Vestibule'}</div>
        {/* Circle/subtitle */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:3,color:'#aa4444',textTransform:'uppercase'}}>{enemy?.circle||''} · {enemy?.subtitle||''}</div>
        {/* Sassy tagline */}
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:28,color:'#cc6666',fontStyle:'italic',textAlign:'center',textShadow:'0 0 20px rgba(180,0,0,0.5)',maxWidth:700,marginTop:4}}>"{enemy?.tagline||'The Vestibule claims another soul.'}"</div>
                {/* Score */}
        <div style={{textAlign:'center',margin:'4px 0'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:60,fontWeight:900,color:grade.color,textShadow:'0 0 30px '+grade.color+',3px 3px 0 #000',letterSpacing:2,lineHeight:1}}>{displayScore.toLocaleString()}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:6,color:grade.color,textTransform:'uppercase',marginTop:4,textShadow:'0 0 10px '+grade.color}}>{grade.label}</div>
          {stakeInfo.id!=='bronze'&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:stakeInfo.color,letterSpacing:2,marginTop:4,padding:'3px 14px',border:'1px solid '+stakeInfo.color,borderRadius:4,background:'rgba(0,0,0,0.4)'}}>{stakeInfo.name.toUpperCase()} ×{stakeInfo.scoreMult}</div>}
          <BestGap/>
          <NearMiss/>
        </div>
        <UnlockBar/>
        <Discoveries/>
        <AchievementBadges/>
                {dailyStreak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'#ff6600',letterSpacing:3,padding:'5px 20px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:4}}>🔥 {dailyStreak} DAY STREAK</div>}
        {streakMsg&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:streakWins>1?'#ff6600':'#aa4444',letterSpacing:3,padding:'6px 24px',background:'rgba(0,0,0,0.5)',border:`1px solid ${streakWins>1?'#ff6600':'#aa4444'}`,borderRadius:4}}>{streakMsg}</div>}
        <StatsGrid/>
        <RunHistory/>
        <BottomRow/>
                {(totalRuns||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#886644',letterSpacing:3}}>RUN #{totalRuns}</div>}
        <Buttons victory={false}/>
      </div>
    </div>
  )

  // ── VICTORY ────────────────────────────────────────────────
  return(
    <div style={{position:'absolute',inset:0,zIndex:9800,background:'rgba(4,3,1,0.96)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',gap:16,animation:'fadeIn 0.8s ease',overflowY:'auto',padding:'40px 0 60px'}}>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:0}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:280,color:'rgba(180,180,180,0.06)',userSelect:'none',lineHeight:1}}>Vestibule</div>
      </div>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:90,color:'#d8c9a8',textShadow:'0 0 60px rgba(210,160,20,0.5),3px 3px 0 #000'}}>⛧ Victory ⛧</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'#a09060',fontStyle:'italic',textAlign:'center'}}>All 9 circles conquered. Lucifer has fallen.</div>
                {/* Score */}
        <div style={{textAlign:'center',margin:'4px 0'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:60,fontWeight:900,color:grade.color,textShadow:'0 0 30px '+grade.color+',3px 3px 0 #000',letterSpacing:2,lineHeight:1}}>{displayScore.toLocaleString()}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:6,color:grade.color,textTransform:'uppercase',marginTop:4,textShadow:'0 0 10px '+grade.color}}>{grade.label}</div>
          {stakeInfo.id!=='bronze'&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:stakeInfo.color,letterSpacing:2,marginTop:4,padding:'3px 14px',border:'1px solid '+stakeInfo.color,borderRadius:4,background:'rgba(0,0,0,0.4)'}}>{stakeInfo.name.toUpperCase()} ×{stakeInfo.scoreMult}</div>}
          <BestGap/>
          <NearMiss/>
        </div>
        <UnlockBar/>
        <Discoveries/>
        <AchievementBadges/>
                {dailyStreak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'#ff6600',letterSpacing:3,padding:'5px 20px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:4}}>🔥 {dailyStreak} DAY STREAK</div>}
        {streakMsg&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#ff6600',letterSpacing:3,padding:'6px 24px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:4}}>{streakMsg}</div>}
        <StatsGrid/>
        <RunHistory/>
        <BottomRow/>
                {(totalRuns||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#886644',letterSpacing:3}}>RUN #{totalRuns}</div>}
        <Buttons victory={true}/>
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
    <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(2,1,0,0.98)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:32,padding:'40px 20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:'#cc1111',textShadow:'0 0 40px rgba(200,0,0,0.9),0 0 80px rgba(150,0,0,0.6)',textAlign:'center'}}>Only One May Remain</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'#a09060',fontStyle:'italic',textAlign:'center'}}>Two demonic powers cannot share the same stage.<br/>Choose who stays — the other is gone forever.</div>
      <div style={{display:'flex',gap:60,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
        <MemberCard m={existing} onPick={()=>onChoice(existing,incoming)} label="CURRENTLY ON STAGE"/>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#660000',textShadow:'0 0 20px rgba(200,0,0,0.8)'}}>VS</div>
        <MemberCard m={incoming} onPick={()=>onChoice(incoming,existing)} label="NEWLY ARRIVED"/>
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a6a40',letterSpacing:2,textAlign:'center'}}>THE UNCHOSEN WILL BE PERMANENTLY REMOVED</div>
    </div>
  )
}

function RecruitScreen({candidates,stage,onPick,onPass,onFireMember,stash}){
  const isFull=stage.filter(Boolean).length>=5
  const activeMembers=stage.map((m,i)=>m?{m,i}:null).filter(Boolean).filter(x=>!x.m.tooStoned)
  function fireSellPrice(m){return m.demonic?69:5+(m.foil?3:0)+(m.mythic?8:0)}
  return(
    <div style={{position:'absolute',inset:0,zIndex:9600,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:'40px 20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'#d0b060',textShadow:'0 0 30px rgba(200,150,20,0.4)'}}>Recruit a Member</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'#a09060',fontStyle:'italic'}}>{isFull?'🔥 Stage is full — fire a member to make room, or pass':'Choose one musician to join your band — or pass'}</div>
      <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center',maxWidth:1000}}>
        {candidates.map(m=>{
          const hasDblTime=stage.some(s=>s&&s.keyword==='DOUBLE TIME')
          const isDblTime=m.keyword==='DOUBLE TIME'
          const emptySlot=stage.findIndex(s=>!s)
          // Allow ALL duplicates — only block second DOUBLE TIME drummer
          const canAdd=emptySlot!==-1&&!(isDblTime&&hasDblTime)
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
                {isDblTime&&hasDblTime&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#ff8800',textAlign:'center',marginTop:6,letterSpacing:1}}>ONLY ONE DRUMMER</div>}
                {emptySlot===-1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#aa2200',textAlign:'center',marginTop:6,letterSpacing:1}}>STAGE FULL</div>}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onPass}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'12px 40px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:3,color:'#c8a040',cursor:'pointer',transition:'all 0.2s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#c8a040'}}>
        Pass — No Recruitment
      </button>

      {/* FIRE PANEL — only shown when stage is full */}
      {isFull&&onFireMember&&(
        <div style={{position:'absolute',bottom:24,right:24,width:520,background:'linear-gradient(160deg,#0e0a16,#080510)',border:'2px solid rgba(220,60,20,0.7)',borderRadius:12,padding:'20px 24px',boxShadow:'0 0 40px rgba(200,40,0,0.35)',zIndex:9700}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:38,color:'#ff4422',textAlign:'center',marginBottom:6,textShadow:'0 0 20px rgba(255,60,20,0.8)'}}>🔥 Fire a Member</div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'#aa5533',textAlign:'center',fontStyle:'italic',marginBottom:16}}>Fire one to open a slot</div>
          {activeMembers.map(({m,i})=>(
            <div key={m.uid||i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',marginBottom:10,background:'rgba(0,0,0,0.35)',borderRadius:8,border:'1px solid rgba(180,60,20,0.35)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,flex:1,minWidth:0}}>
                <span style={{fontSize:36}}>{m.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,color:'#e8d090',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#8a6040',letterSpacing:1}}>{m.keyword} · ATK {m.atk} · HP {m.hp}</div>
                </div>
              </div>
              <button
                onClick={()=>onFireMember(m,i)}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:1,padding:'10px 16px',background:'rgba(160,30,10,0.4)',border:'2px solid rgba(220,60,20,0.6)',borderRadius:6,color:'#ff6644',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,marginLeft:14}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,40,10,0.65)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(160,30,10,0.4)'}}>
                🔥 {fireSellPrice(m)}🌿
              </button>
            </div>
          ))}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#aa7744',textAlign:'center',marginTop:10,letterSpacing:1}}>Stash: {stash}🌿 · Refund shown per member</div>
        </div>
      )}
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
    <div style={{position:'absolute',inset:0,zIndex:9700,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:'20px'}}>
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

function SetlistModal({hand,onConfirm}){
  // Draw 2 already happened — player must pick 1 card to discard before continuing
  const [picked,setPicked]=useState(null)
  return(
    <div style={{position:'absolute',inset:0,zIndex:9700,background:'rgba(4,2,1,0.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:'40px 20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#44dd44',textShadow:'0 0 30px rgba(40,200,60,0.5)'}}>Setlist</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'#88bb88',fontStyle:'italic'}}>You drew 2 cards. Now discard 1 to continue.</div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',maxWidth:1100}}>
        {hand.map((card)=>{
          const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
          const sel=picked===card.uid
          return(
            <div key={card.uid} onClick={()=>setPicked(sel?null:card.uid)}
              style={{width:150,background:sel?'linear-gradient(180deg,#2a1a0a,#160e05)':'linear-gradient(180deg,#201408,#100804)',
                border:sel?'2px solid #cc0000':'2px solid '+bc+'66',borderRadius:7,overflow:'hidden',cursor:'pointer',
                transform:sel?'translateY(-12px) scale(1.05)':'none',transition:'all 0.15s',
                boxShadow:sel?'0 0 20px rgba(200,0,0,0.6)':'none'}}>
              <div style={{height:4,background:sel?'#cc0000':bc}}/>
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,background:'rgba(0,0,0,0.3)'}}>{card.emoji}</div>
              <div style={{padding:'6px 8px 10px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:700,color:sel?'#ff6666':'#eedfc0',textAlign:'center',marginBottom:3}}>{card.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:bc,textAlign:'center',letterSpacing:2,textTransform:'uppercase'}}>{card.type}</div>
              </div>
              {sel&&<div style={{background:'rgba(180,0,0,0.3)',padding:'4px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#ff6666',letterSpacing:2}}>DISCARD</div>}
            </div>
          )
        })}
      </div>
      <button onClick={()=>picked&&onConfirm(picked)} disabled={!picked}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',
          padding:'14px 60px',background:picked?'rgba(30,130,30,0.4)':'rgba(20,20,20,0.4)',
          border:picked?'2px solid #44dd44':'2px solid #333',borderRadius:3,
          color:picked?'#44dd44':'#444',cursor:picked?'pointer':'not-allowed',transition:'all 0.15s'}}>
        ✓ Discard &amp; Continue
      </button>
    </div>
  )
}

function App(){
  const [gameState,setGameState]=useState('menu')
  const getDailySeed=()=>{const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))}
  const [runSeed,setRunSeed]=useState(()=>Math.floor(Math.random()*0xFFFFFF))
  const [isDailyRun,setIsDailyRun]=useState(false)
  const [fightIndex,setFightIndex]=useState(0)
  const [enemy,setEnemy]=useState(ENEMIES[0])
  const [enemyHp,setEnemyHp]=useState(ENEMIES[0].maxHp)
  const [stage,setStage]=useState([null,null,null,null,null])
  const [deck,setDeck]=useState([]);const deckRef=useRef([]);
  const [hand,setHand]=useState([]);const handRef=useRef([]);
  const handTargetRef=useRef(HAND_SIZE) // target refill size, grows with Soundboard draws
  const cardsToDrawRef=useRef(0) // how many cards to draw after next strike
  const [discardPile,setDiscardPile]=useState([]);const discRef=useRef([]);
  const [maxEmbers,setMaxEmbers]=useState(5)
  const [embers,setEmbers]=useState(5)
  const [stash,setStash]=useState(3)
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
  const [shakeOffset,setShakeOffset]=useState({x:0,y:0})
  const shakeTimerRef=useRef(null)
  const triggerShake=useCallback((intensity=3,duration=200)=>{
    if(!shakeEnabled)return
    if(shakeTimerRef.current)cancelAnimationFrame(shakeTimerRef.current)
    const start=performance.now()
    const animate=(now)=>{
      const elapsed=now-start
      if(elapsed>duration){setShakeOffset({x:0,y:0});return}
      const decay=1-elapsed/duration
      const x=(Math.random()-0.5)*2*intensity*decay
      const y=(Math.random()-0.5)*2*intensity*decay
      setShakeOffset({x:Math.round(x),y:Math.round(y)})
      shakeTimerRef.current=requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  },[])
  const [circleClearedData,setCircleClearedData]=useState(null) // {circle, bossName, bossEmoji}
  const [chosenPacts,setChosenPacts]=useState([]) // pact IDs chosen this run
  const [upgradedCards,setUpgradedCards]=useState([]) // card IDs upgraded at campfire this run
  const [pactChoices,setPactChoices]=useState([]) // 2 pact options for current choice
  const [descentData,setDescentData]=useState(null) // {circleNum, fights, reward1, reward2}
  const skipDescentRef=useRef(false)
  const overrideFightIdxRef=useRef(null) // set by descent to override next fight index
  const [corruption,setCorruption]=useState(0)
  const [stageDiveUsed,setStageDiveUsed]=useState(false)
  const [diceTarget,setDiceTarget]=useState(null)
  const [showDice,setShowDice]=useState(false)
  const [pendingEmbers,setPendingEmbers]=useState(0)
  const [pendingDraw,setPendingDraw]=useState(0)
  const [bonusDiscards,setBonusDiscards]=useState(0) // extra discards next fight from descent
  const [bonusEmbers,setBonusEmbers]=useState(0) // extra embers next fight from descent
  const [lastRiffPlayed,setLastRiffPlayed]=useState(null)
  const [cardsPlayedThisStrike,setCardsPlayedThisStrike]=useState([])
  const cardsPlayedRef=useRef([])
  const combosFiredRef=useRef([])
  const [comboFlash,setComboFlash]=useState(null) // {name,color,emoji}
  const [combosDiscoveredThisRun,setCombosDiscoveredThisRun]=useState([])
  const [genreCounts,setGenreCounts]=useState({RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0})
  const genreTotal=genreCounts.RIFF+genreCounts.CORRUPT+genreCounts.UTILITY+genreCounts.EMBER
  const activeGenre=genreTotal>=4?(genreCounts.RIFF/genreTotal>=0.5?'RIFF_METAL':genreCounts.CORRUPT/genreTotal>=0.5?'BLACK_METAL':genreCounts.UTILITY/genreTotal>=0.5?'PROG_ROCK':genreCounts.EMBER/genreTotal>=0.5?'DOOM_METAL':null):null
  const discoveredRef=useRef(new Set())
  const [bossDebuff,setBossDebuff]=useState(0)
  const [bossRageAtk,setBossRageAtk]=useState(0)
  const [dblRoll,setDblRoll]=useState(null) // null=not rolled, 1-2=half, 3-4=offbeat, 5-6=double
  const [shredderUsed,setShredderUsed]=useState(false) // tracks if first RIFF played this Strike
  const [nextCardFree,setNextCardFree]=useState(false)
  const nextCardFreeRef=useRef(false)
  useEffect(()=>{nextCardFreeRef.current=nextCardFree},[nextCardFree])
  const [allCardsFree,setAllCardsFree]=useState(false) // POSSESSION hellquake: all cards cost 0 this fight
  const allCardsFreeRef=useRef(false)
  useEffect(()=>{allCardsFreeRef.current=allCardsFree},[allCardsFree])
  const [skipNextDiscard,setSkipNextDiscard]=useState(false)
  const [setlistOpen,setSetlistOpen]=useState(false)
  const [setlistCards,setSetlistCards]=useState([])
  const [remasterOpen,setRemasterOpen]=useState(false)
  const [remasterCards,setRemasterCards]=useState([])
  const [deathCause,setDeathCause]=useState('fallen')
  const [hellquakeAnim,setHellquakeAnim]=useState(null)
  const [milestoneFlash,setMilestoneFlash]=useState(null) // {text,color} for boss HP milestones
  const [strikeMult,setStrikeMult]=useState(1.0) // score multiplier that builds per card played
  const strikeMultRef=useRef(1.0)
  useEffect(()=>{strikeMultRef.current=strikeMult},[strikeMult])
  const [memberBuffs,setMemberBuffs]=useState({}) // {uid: [{text,color},...]} persistent until strike
  const addBuff=useCallback((uid,text,color)=>{setMemberBuffs(p=>({...p,[uid]:[...(p[uid]||[]),{text,color}]}))},[])  
  const [clutchFlash,setClutchFlash]=useState(null) // {text,color} for clutch moments
  const [circlePreview,setCirclePreview]=useState(null) // next circle preview data
  const [collectedLoot,setCollectedLoot]=useState([]) // boss loot IDs collected this run
  const [circleSplash,setCircleSplash]=useState(null) // {circleNum, circleName, circleEmoji} for 3s transition
  const milestonesFiredRef=useRef({half:false,quarter:false,tenth:false})
  const [phaseBanner,setPhaseBanner]=useState('play') // 'play','strike','boss'
  const [deckViewOpen,setDeckViewOpen]=useState(false)
  const [discardViewOpen,setDiscardViewOpen]=useState(false)
  const [circleArtifact,setCircleArtifact]=useState(()=>STARTER_ARTIFACTS[Math.floor(Math.random()*STARTER_ARTIFACTS.length)])
  const [circlePassive,setCirclePassive]=useState(()=>STARTER_PASSIVES[Math.floor(Math.random()*STARTER_PASSIVES.length)])
  const [activeArtifacts,setActiveArtifacts]=useState([]) // max 3
  const [discovered,setDiscovered]=useState(new Set())
  const [newAchievements,setNewAchievements]=useState([])
  const [menuView,setMenuView]=useState(null) // null, 'unlocks', 'rules', 'options'
  const [unlockTab,setUnlockTab_]=useState('milestones')
  const [unlockPage,setUnlockPage_]=useState(0)
  const [unlockHover,setUnlockHover]=useState(null) // card data for tooltip
  const setUnlockTab=(t)=>{setUnlockTab_(t);setUnlockPage_(0);setUnlockHover(null)}
  const [showPauseOptions,setShowPauseOptions]=useState(false)
  const [activeStakeId,setActiveStakeId]=useState(()=>localStorage.getItem('vst_active_stake')||'bronze')
  const activeStake=STAKES.find(s=>s.id===activeStakeId)||STAKES[0]
  const [musicVol,setMusicVol]=useState(()=>parseFloat(localStorage.getItem('vst_music_vol')||'0.3'))
  const [sfxVol,setSfxVol]=useState(()=>parseFloat(localStorage.getItem('vst_sfx_vol')||'0.5'))
  const [shakeEnabled,setShakeEnabled]=useState(()=>localStorage.getItem('vst_shake')!=='off')
  const playSfx=useCallback((name,vol)=>{
    if(sfxVol<=0)return
    try{
      const a=new Audio(import.meta.env.BASE_URL+'sfx/'+name+'.mp3')
      a.volume=sfxVol*(vol!==undefined?vol:1)
      a.play().catch(()=>{})
    }catch(e){}
  },[sfxVol])
  const tryAchieve=useCallback((id)=>{if(unlockAchievement(id))setNewAchievements(p=>[...p,id])},[])

  // ── MUSIC SYSTEM ─────────────────────────────────────────────
  const audioRef=useRef({})
  const currentTrackRef=useRef(null)
  const TRACK_MAP={menu:'menu',booster:'select',playing:'battle',shop:'shop',recruit:'shop',pact:'pact',campfire:'forge',descent:'descent',end:'death'}
  useEffect(()=>{
    // Determine track — special cases for boss/lucifer/victory
    let trackName=TRACK_MAP[gameState]||'menu'
    if(gameState==='playing'){
      if(fightIndex===26)trackName='lucifer'
      else if((fightIndex+1)%3===0)trackName='boss'
      else trackName='battle'
    }
    if(gameState==='end')trackName=(fightIndex>=26&&enemyHp<=0)?'victory':'death'
    if(gameState==='circleSplash')return // no music during splash
    if(trackName===currentTrackRef.current)return
    const vol=parseFloat(localStorage.getItem('vst_music_vol')||'0.3')
    // Fade out current
    if(currentTrackRef.current&&audioRef.current[currentTrackRef.current]){
      const old=audioRef.current[currentTrackRef.current]
      const fadeOut=setInterval(()=>{if(old.volume>0.02){old.volume=Math.max(0,old.volume-0.05)}else{old.pause();old.volume=0;clearInterval(fadeOut)}},50)
    }
    // Start new track
    if(!audioRef.current[trackName]){
      const a=new Audio(import.meta.env.BASE_URL+'music/'+trackName+'.mp3')
      a.loop=true
      a.volume=0
      audioRef.current[trackName]=a
    }
    const next=audioRef.current[trackName]
    next.volume=0
    const playPromise=next.play()
    if(playPromise)playPromise.catch(()=>{})
    // Fade in
    const targetVol=vol
    const fadeIn=setInterval(()=>{if(next.volume<targetVol-0.02){next.volume=Math.min(targetVol,next.volume+0.05)}else{next.volume=targetVol;clearInterval(fadeIn)}},50)
    currentTrackRef.current=trackName
  },[gameState,fightIndex,enemyHp])
  // First interaction: retry music (browser autoplay policy blocks before click)
  useEffect(()=>{
    const unlock=()=>{
      const trackName=currentTrackRef.current
      if(trackName&&audioRef.current[trackName]&&audioRef.current[trackName].paused){
        const vol=parseFloat(localStorage.getItem('vst_music_vol')||'0.3')
        audioRef.current[trackName].volume=vol
        audioRef.current[trackName].play().catch(()=>{})
      }
      document.removeEventListener('click',unlock)
      document.removeEventListener('keydown',unlock)
    }
    document.addEventListener('click',unlock)
    document.addEventListener('keydown',unlock)
    return()=>{document.removeEventListener('click',unlock);document.removeEventListener('keydown',unlock)}
  },[])
  // Volume change handler
  const setMusicVolume=useCallback((v)=>{
    const fv=parseFloat(v)
    localStorage.setItem('vst_music_vol',fv)
    setMusicVol(fv)
    const trackName=currentTrackRef.current
    if(trackName&&audioRef.current[trackName])audioRef.current[trackName].volume=fv
  },[])

  const [streakWins,setStreakWins]=useState(0)
  const [streakLosses,setStreakLosses]=useState(0)
  const [totalRunsPlayed,setTotalRunsPlayed]=useState(()=>parseInt(localStorage.getItem('vst_runs')||'0'))
  const [personalBest,setPersonalBest]=useState(()=>parseInt(localStorage.getItem('vst_best')||'0'))
  const [lifetimeScore,setLifetimeScore]=useState(()=>parseInt(localStorage.getItem('vst_lifetime')||'0'))
  const [dailyStreak,setDailyStreak]=useState(()=>parseInt(localStorage.getItem('vst_streak')||'0'))
  const [lastPlayedDate,setLastPlayedDate]=useState(()=>localStorage.getItem('vst_lastdate')||'')
  const [activePassives,setActivePassives]=useState([])   // max 5
  const [pendingBurningStage,setPendingBurningStage]=useState(false) // burning stage bonus next fight
  const [stashStolenThisFight,setStashStolenThisFight]=useState(0) // greed circle: track stolen stash for refund on win
  const [extraEmberNextFight,setExtraEmberNextFight]=useState(0)    // from burning stage
  const [resonanceCoilActive,setResonanceCoilActive]=useState(false)
  const [powerChordActive,setPowerChordActive]=useState(false)
  const [shopCards,setShopCards]=useState(()=>genShopCards(1))
  const [boosterPacks,setBoosterPacks]=useState(()=>genBoosterPacks(1))
  const [recruitPack,setRecruitPack]=useState(()=>genRecruitPack(0))
  const [recruitCandidates,setRecruitCandidates]=useState([])
  const [demonicConflict,setDemonicConflict]=useState(null)
  const [rerollCost,setRerollCost]=useState(2)
  const [shopBoughtIds,setShopBoughtIds]=useState([])
  const [shopSoldIds,setShopSoldIds]=useState([])
  const [circleCartBought,setCircleCartBought]=useState(false)
  const [circleCpasBought,setCirCleCpasBought]=useState(false)
  // ── DEALER: Mushrooms & Acid ──────────────────────────────────
  const [heldShrooms,setHeldShrooms]=useState(0) // player is holding shrooms
  const [heldAcid,setHeldAcid]=useState(0) // player is holding acid
  const [drugsUsedThisRun,setDrugsUsedThisRun]=useState({shrooms:0,acid:0})
  const [shroomsInStock,setShroomsInStock]=useState(()=>Math.random()<0.50)
  const [acidInStock,setAcidInStock]=useState(()=>Math.random()<0.50)
  const [activeTripEffect,setActiveTripEffect]=useState(null) // {type,name,desc,color} — shown as dramatic reveal
  const [fightTripBuff,setFightTripBuff]=useState(null) // persists for entire fight — combat checks read this
  const [luciferPhase,setLuciferPhase]=useState(0) // 0=not lucifer, 1=phase1 ice, 2=phase2 satan
  const [luciferCinematic,setLuciferCinematic]=useState(null) // {text,hpSteps} for HP melt animation
  const [victoryCinematic,setVictoryCinematic]=useState(null) // {phase,stage} for kill cinematic
  const [welcomeToHell,setWelcomeToHell]=useState(null) // 'choice','cutscene','fighting','won','lost'
  const [contractsPlayed,setContractsPlayed]=useState(0)
  const wthStrikesRef=useRef(0)
  const [stolenAtkPool,setStolenAtkPool]=useState(0) // soulThief: total ATK stolen, returned on win
  const [tripUsedThisFight,setTripUsedThisFight]=useState(false)
  const [stats,setStats]=useState({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0})

  
  // Keep refs in sync for use in timeouts
  handRef.current=hand;
  deckRef.current=deck;
  discRef.current=discardPile;
  const bossRef=useRef(null)
  const stageRefs=useRef(Array(5).fill(null).map(()=>({current:null})))
  const fid=useRef(0),prid=useRef(0)

  const addLog=m=>{
    // DEV ONLY: pipe every game log entry to window.__devLog for debugging
    if(typeof window!=='undefined'){
      if(!window.__devLog)window.__devLog=[]
      window.__devLog.push({t:new Date().toLocaleTimeString('en-US',{timeZone:'Asia/Tokyo',hour12:false}),msg:m})
    }
    setLog(p=>[m,...p.slice(0,99)])
  }
  const addFloat=(v,x,y,color,big)=>{big=big||false;const id=fid.current++;setFloats(p=>[...p,{id,v,x,y,color:color||'#dd2222',big}])}
  const remFloat=id=>setFloats(p=>p.filter(f=>f.id!==id))
  const updStat=(key,val,isMax)=>{isMax=isMax||false;setStats(p=>Object.assign({},p,{[key]:isMax?Math.max(p[key],val):p[key]+val}))}
  const discover=(mechanic,label)=>{
    if(discoveredRef.current.has(mechanic))return
    discoveredRef.current.add(mechanic)
    setDiscovered(prev=>{const next=new Set(prev);next.add(mechanic);return next})
    addFloat('⛧ DISCOVERED: '+label,getCenter(bossRef).x,getCenter(bossRef).y-160,'#ffdd00',true)
    addLog('⛧ DISCOVERED: '+label+' — first time!')
  }

  const drawUpTo=useCallback((h,d,disc,target)=>{
    const cappedTarget=Math.min(target,10)
    let nh=[...h],nd=[...d],ndisc=[...disc]
    while(nh.length<cappedTarget){
      if(nd.length===0){if(ndisc.length===0)break;nd=[...ndisc].filter(Boolean).sort(()=>Math.random()-.5);ndisc=[];addLog('🔄 Deck reshuffled.')}
      if(nd[0])nh=[...nh,nd[0]];nd=nd.slice(1);playCard()
    }
    return{h:nh.filter(Boolean),d:nd.filter(Boolean),disc:ndisc.filter(Boolean)}
  },[])

  const rollDblForStage=(stg)=>{
    const hasDrummer=stg.some(m=>m&&m.role==='Drummer')
    const drumCount2=stg.filter(m=>m&&m.role==='Drummer').length
    if(hasDrummer){let roll=Math.floor(Math.random()*6)+1;if(drumCount2>=2&&roll<=2)roll=Math.floor(Math.random()*6)+1;setDblRoll(roll)}
    else setDblRoll(null)
  }
  const startGame=useCallback(selIds=>{
    const musicians=selIds.map(id=>ALL_MUSICIANS.find(m=>m.id===id))
    const maxStage=chosenPacts.includes('sixth_slot')?6:5
    const initStage=[null,...musicians.map(m=>({...m,maxHp:m.hp})),...Array(4).fill(null)].slice(0,maxStage)
    setStage(initStage)
    const d=buildDeck(runSeed)
    const _hs=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0)
    setHand(d.slice(0,_hs))
    setDeck(d.slice(_hs))
    handTargetRef.current=_hs
    const hasDrummer=musicians.some(m=>m.role==='Drummer')
    const drumCount=musicians.filter(m=>m.role==='Drummer').length
    if(hasDrummer){let r=Math.floor(Math.random()*6)+1;if(drumCount>=2&&r<=2)r=Math.floor(Math.random()*6)+1;setDblRoll(r)}else setDblRoll(null)
    // STREAK BONUSES
    if(streakWins>=2)setMaxEmbers(p=>Math.min(MAX_EMBERS_CAP,p+1))
    if(streakWins>=3){
      // Free Foil member — upgrade first member to Foil
      setStage(p=>{const idx=p.findIndex(m=>m&&!m.foil&&!m.mythic&&!m.demonic);if(idx===-1)return p;const ns=[...p];ns[idx]=Object.assign({},ns[idx],{foil:true,atk:ns[idx].atk+1,maxHp:ns[idx].maxHp+2,hp:ns[idx].hp+2});return ns})
    }
    if(streakWins>=5){
      // Upgrade first member to Mythic
      setStage(p=>{const idx=p.findIndex(m=>m&&!m.mythic&&!m.demonic);if(idx===-1)return p;const ns=[...p];ns[idx]=Object.assign({},ns[idx],{mythic:true,foil:false,atk:ns[idx].atk+2,maxHp:ns[idx].maxHp+4,hp:ns[idx].hp+4});return ns})
    }
    if(streakWins>=2)addLog('🔥 Win streak '+streakWins+'! '+STREAK_BONUSES[Math.min(streakWins,5)].desc)
    setGameState('playing')
    addLog('⛧ '+musicians[0].name+' and '+musicians[1].name+' take the stage!')
    // Show Descent map for Circle 1
    const r1=DESCENT_REWARDS_1[Math.floor(Math.random()*DESCENT_REWARDS_1.length)]
    const r2=DESCENT_REWARDS_2[Math.floor(Math.random()*DESCENT_REWARDS_2.length)]
    setDescentData({circleNum:1,circleName:CIRCLE_NAMES[1],circleEmoji:CIRCLE_EMOJIS[1],fights:[ENEMIES[0],ENEMIES[1],ENEMIES[2]],fightIndices:[0,1,2],reward1:r1,reward2:r2,skips:[]})
    setGameState('descent')
  },[runSeed])

  const applyCard=useCallback((card,slotIdx)=>{
    const foilDiscount=(card.foil&&card.embers>=2)?1:0
    const hasShredder=stage.some(m=>m&&!m.tooStoned&&m.keyword==='SHREDDER')
    const sfxMap={RIFF:'riff_play',CORRUPT:'corrupt_play',UTILITY:'utility_play',EMBER:'ember_play'};playSfx(sfxMap[card.type]||'card_play')
    const shredderDiscount=(hasShredder&&!shredderUsed&&card.type==='RIFF'&&card.embers>=1)?1:0
    const synesthesiaDiscount=(fightTripBuff==='SYNESTHESIA')?1:0
    const darkBargainDiscount=(chosenPacts.includes('dark_bargain')&&card.type==='CORRUPT'&&card.embers>=1)?1:0
    const effectiveEmbers=(nextCardFreeRef.current&&card.id!=='doubledown')||allCardsFreeRef.current?0:Math.max(0,card.embers-foilDiscount-shredderDiscount-synesthesiaDiscount-darkBargainDiscount)
  if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers, have '+embers+'.');return false}
  if(nextCardFreeRef.current&&card.id!=='doubledown'){setNextCardFree(false)}
    if(card.id==='stagedive'&&stageDiveUsed){addLog('⚠ Stage Dive once per round only.');return false}
    const m=stage[slotIdx]
    let ns=[...stage],spent=effectiveEmbers,msg=''

    // CONTRACT CARD (Welcome to Hell)
    if(card.id==='contract'){
      const alive=ns.filter(m=>m&&!m.tooStoned).sort((a,b)=>b.atk-a.atk)
      if(alive.length<=1){addLog('📝 Cannot sign — need at least 2 members!');return false}
      const strongest=alive[0]
      const sIdx=ns.findIndex(m=>m&&m.uid===strongest.uid)
      ns[sIdx]=Object.assign({},strongest,{tooStoned:true,hp:0})
      setContractsPlayed(p=>p+1)
      msg='📝 CONTRACT SIGNED! '+strongest.name+' leaves the band. Score multiplier increased!'
      addFloat('📝 SIGNED!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ffd700',true)
      addFloat(strongest.name+' GONE',getCenter(stageRefs.current[sIdx]).x,getCenter(stageRefs.current[sIdx]).y-70,'#cc0000',true)
    }
    else if(card.id==='amp'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk*2,_origAtk:m._origAtk||m.atk,tempBuff:true,buffCount:(m.buffCount||0)+1});msg='⚡ '+m.name+' doubled ATK!';addBuff(m.uid,'×2 ATK','#cc44ff');addFloat('×2 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc')}
    else if(card.id==='battlecry'){if(!m)return false;const bcBonus=(activePassives.some(p=>p.id==='p7')?2:1)+(card.upgraded?1:0);ns[slotIdx]=Object.assign({},m,{atk:m.atk+bcBonus,buffCount:(m.buffCount||0)+1});msg='🤘 '+m.name+' Battle Cry! +'+bcBonus+' ATK forever!';addBuff(m.uid,'+'+bcBonus+' ATK','#ee2222');addFloat('+'+bcBonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#ff4400')}
    else if(card.id==='newstrings'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+2,buffCount:(m.buffCount||0)+1});msg='🎸 '+m.name+' +2 ATK permanently!';addBuff(m.uid,'+2 ATK','#ee2222');addFloat('+2 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#e8a820')}
    else if(card.id==='encore'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{encoreReady:true,buffCount:(m.buffCount||0)+1});msg='🔁 '+m.name+' encores!';addBuff(m.uid,'ENCORE','#dd2222');addFloat('ENCORE!',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#dd2222')}
    else if(card.id==='roadie'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{stoneShield:2,hp:m.keyword==='FALLEN'?m.hp:Math.min(m.maxHp,m.hp+2),buffCount:(m.buffCount||0)+1});msg='🛡 '+m.name+' shielded for 2 Strikes and healed 2 HP!'}
    else if(card.id==='stagedive'){
      if(!m)return false
      const dmg=m.hp
      const bc=getCenter(bossRef)
      const sdHp=Math.max(0,enemyHp-dmg);setEnemyHp(sdHp);if(sdHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);addFloat(dmg,bc.x,bc.y-60,'#ff6600',true)
      playHit();setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setStageDiveUsed(true);setSelected(p=>p.filter(uid=>!hand.some(c=>c.id==='stagedive'&&c.uid===uid)));updStat('totalDamage',dmg);updStat('highestStrike',dmg,true);if(dmg>=500){playSfx('big_hit');triggerShake(8,250)}
      if(sdHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🤘 '+m.name+' Stage Dives for '+dmg+' damage!'
    }
    else if(card.id==='wakeup'){
      // Heal all active members 2 HP
      ns=ns.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m)
      // Revive first Too Stoned member with 50% permanent ATK loss
      const stonedIdx=ns.findIndex(m=>m&&m.tooStoned)
      if(stonedIdx>=0){
        const sm=ns[stonedIdx]
        const startAtk=ALL_MUSICIANS.find(mu=>mu.id===sm.id)?.atk||1
        const curBase=sm._origAtk!==undefined?sm._origAtk:sm.atk
        ns[stonedIdx]=Object.assign({},sm,{tooStoned:false,hp:sm.maxHp,atk:curBase,_origAtk:undefined,tempBuff:false,buffCount:sm.buffCount||0})
        msg='☕ '+sm.name+' revived! All members +2 HP.'
        if(sm.isMentor){const _rs=scanMentorLinks(ns);_rs.forEach((rm,ri)=>{if(rm)ns[ri]=rm})}
        addFloat('REVIVED',getCenter(stageRefs.current[stonedIdx]).x,getCenter(stageRefs.current[stonedIdx]).y-70,'#22aa44')
      } else {
        msg='☕ Wake Up Call! All members +2 HP.'
        addFloat('+2 HP',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44')
      }
    }
    else if(card.id==='soundcheck'){
      const injuredCount=ns.filter(m=>m&&!m.tooStoned&&m.hp<m.maxHp).length
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:m.keyword==='FALLEN'?m.hp:Math.min(m.maxHp,m.hp+4),atk:m.hp<m.maxHp&&m.keyword!=='FALLEN'?m.atk+1:m.atk,tempBuff:m.hp<m.maxHp&&m.keyword!=='FALLEN'?true:m.tempBuff,_origAtk:m.hp<m.maxHp&&!m._origAtk&&m.keyword!=='FALLEN'?m.atk:m._origAtk}):m)
      msg='🔊 Sound Check! All +4 HP'+(injuredCount>0?' + '+injuredCount+' injured member(s) +1 ATK!':'!');stage.filter(x=>x&&!x.tooStoned).forEach(x=>addBuff(x.uid,'+HP','#33dd33'))
      addFloat('+4 HP',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44')
    }
    else if(card.id==='dialtoeleven'){const nc=Math.min(100,corruption+15);setCorruption(nc);updStat('maxCorruption',nc,true);ns=ns.map(function(m){return m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+(card.upgraded?2:1),tempAtkBonus:(m.tempAtkBonus||0)+(card.upgraded?2:1),buffCount:(m.buffCount||0)+1}):m});msg='📻 Dial to Eleven! Corruption +15% → '+nc+'%. All members +1 ATK!'}
    else if(card.id==='sigdecay'){
      // Handled in handleDropOnStage (modifies hand/deck like setlist)
      return false
    }
    else if(card.id==='remaster'){
      // Handled in handleDropOnStage to avoid stale selected closure (same fix as setlist/burnset)
      return false
    }
    else if(card.id==='setlist'){
      // Handled in handleDropOnStage to avoid double state update (same fix as burnset)
      return false
    }
    else if(card.id==='controlfeedback'){
      setCorruption(50)
      const cfTarget=ns[slotIdx]
      if(cfTarget&&!cfTarget.tooStoned){
        const healAmt=cfTarget.maxHp-cfTarget.hp
        ns[slotIdx]=Object.assign({},cfTarget,{hp:cfTarget.keyword==='FALLEN'?cfTarget.hp:cfTarget.maxHp})
        msg='🎚 Controlled Feedback! Corruption → 50%. '+cfTarget.name+' fully healed!'
        addFloat('+'+healAmt+'❤',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#44dd44')
      } else {
        msg='🎚 Corruption set to 50%.'
      }
    }
    else if(card.id==='feedbackloop'){let dmg=Math.floor(corruption/(card.upgraded?1.5:2));if(collectedLoot.includes('heretics_brand'))dmg=Math.round(dmg*1.25);if(activeGenre==='BLACK_METAL')dmg=Math.round(dmg*1.25);const bc2=getCenter(bossRef);const flHp=Math.max(0,enemyHp-dmg);setEnemyHp(flHp);if(flHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);addFloat(dmg,bc2.x,bc2.y-60,'#aa1111',dmg>=15);playHit();updStat('totalDamage',dmg);if(flHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);msg='🎛 Feedback Loop: '+dmg+' damage! ('+Math.floor(corruption)+'% ÷ 2)'+(activeGenre==='BLACK_METAL'?' [Black Metal +25%]':'')}
    else if(card.id==='soundwall'){const p5Bonus=activePassives.some(p=>p.id==='p5')?4:0;const circleNum=Math.floor(fightIndex/3)+1;const swDmg=(circleNum<=3?5:circleNum<=6?8:12)+p5Bonus+(card.upgraded?4:0);const bc3=getCenter(bossRef);const swHp=Math.max(0,enemyHp-swDmg);setEnemyHp(swHp);if(swHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);addFloat(swDmg,bc3.x,bc3.y-60,'#dd2222');playHit();if(swHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);msg='🔈 Sound Wall! '+swDmg+' direct damage.';updStat('totalDamage',swDmg)}
    else if(card.id==='groupie'){
      // Handled entirely in handleDropOnStage to avoid double setHand
      return false
    }
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
        const swCircle=Math.floor(fightIndex/3)+1;const swD=(swCircle<=3?5:swCircle<=6?8:12)+p5B
        const swHp=Math.max(0,enemyHp-swD);setEnemyHp(swHp);if(swHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);updStat('totalDamage',swD)
        addFloat(swD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#dd2222',true);playHit()
        if(swHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='feedbackloop'){
        const flD=Math.floor(corruption/2)
        const flHp=Math.max(0,enemyHp-flD);setEnemyHp(flHp);if(flHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);updStat('totalDamage',flD)
        addFloat(flD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#aa1111',flD>=15);playHit()
        if(flHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='crowdsurf'){
        const csDmg=hand.length*3
        const csHp=Math.max(0,enemyHp-csDmg);setEnemyHp(csHp);if(csHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);updStat('totalDamage',csDmg)
        addFloat(csDmg,getCenter(bossRef).x,getCenter(bossRef).y-60,'#9933cc',csDmg>=10);playHit()
        if(csHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='overdrive'&&corruption>=60){
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true,_origAtk:s._origAtk||s.atk}):s)
        addFloat('OVERDRIVE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)
      } else if(lr.id==='infencore'){
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{encoreReady:true,buffCount:(s.buffCount||0)+1}):s)
      } else if(lr.id==='resonancecard'){
        if(lrTarget&&!lrTarget.tooStoned){const maxAtk=Math.max(...ns.filter(m=>m&&!m.tooStoned).map(m=>m.atk));ns[slotIdx]=Object.assign({},lrTarget,{atk:maxAtk,tempBuff:true,_origAtk:lrTarget._origAtk||lrTarget.atk,buffCount:(lrTarget.buffCount||0)+1})}
      } else if(lr.id==='distortion'){
        const nc2=Math.min(100,corruption+15);setCorruption(nc2);updStat('maxCorruption',nc2,true)
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+1,tempBuff:true,_origAtk:s._origAtk||s.atk,buffCount:(s.buffCount||0)+1}):s)
      } else if(lr.id==='doubledown'){
        setNextCardFree(true)
      }
      msg='📼 Demo Tape! Replays: '+lr.name
      addFloat('📼 '+lr.name,getCenter(bossRef).x,getCenter(bossRef).y-100,'#e8a820',true)
    }
    else if(card.id==='burnset'){
      // Handled entirely in handleDropOnStage to avoid double state updates
      // applyCard returns false here so handleDropOnStage runs the burnset logic directly
      return false
    }
    else if(card.id==='overdrive'){if(corruption>=(card.upgraded?50:60)){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true,_origAtk:s._origAtk||s.atk}):s});msg='💥 OVERDRIVE! All ATK doubled!';addFloat('OVERDRIVE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)}else{addLog('⚠ Need >=60% Corruption.');return false}}
    else if(card.id==='crowdsurf'){
      const dmg=hand.length*(card.upgraded?4:3)
      const bc=getCenter(bossRef)
      const csHp=Math.max(0,enemyHp-dmg);setEnemyHp(csHp);if(csHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      addFloat(dmg,bc.x,bc.y-60,'#9933cc',dmg>=10);playHit();updStat('totalDamage',dmg)
      if(csHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🏄 Crowd Surf! '+hand.length+' cards × 3 = '+dmg+' damage!'
    }
    else if(card.id==='doubledown'){
      setNextCardFree(true)
      msg='🎰 Double Down! Next card costs 0 Embers.'
      addFloat('FREE!',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='deathriff'){
      const ddmg=Math.min(60,Math.floor(100-corruption))
      const bc=getCenter(bossRef)
      const drHp=Math.max(0,enemyHp-ddmg);setEnemyHp(drHp);if(drHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      const nc=Math.min(100,corruption+10);setCorruption(nc);updStat('maxCorruption',nc,true)
      addFloat(ddmg,bc.x,bc.y-60,'#880000',ddmg>=30);playHit();updStat('totalDamage',ddmg)
      if(drHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='💀 Death Riff! '+ddmg+' damage. Corruption +10%.'+(ddmg===0?' (maxed corruption)':'')
    }
    else if(card.id==='ampoverload'){
      if(discardsLeft<=0){addLog('⚠ No discards left to sacrifice!');return false}
      setEmbers(p=>Math.min(maxEmbers,p+3))
      setDiscardsLeft(p=>Math.max(0,p-1))
      playEmber()
      msg='🔋 Amp Overload! +3 Embers. -1 Discard.'
      addFloat('+3 🔥 -1 DISCARD',getCenter(bossRef).x,getCenter(bossRef).y-70,'#ff6600')
    }
    else if(card.id==='ampstatic'){
      if(!m)return false
      let bonus=Math.floor(corruption/10)
      if(activeGenre==='BLACK_METAL')bonus=Math.round(bonus*1.25)
      if(bonus===0){addLog('📶 Amp the Static needs Corruption > 0 to deal bonus ATK!');addFloat('Need Corruption!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#cc4400',false);return false}
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1})
      msg='📶 Amp the Static! '+m.name+' +'+bonus+' ATK this Strike!'
      addFloat('+'+bonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#cc4400',bonus>=4)
    }
    else if(card.id==='distortion'){
      const nc=Math.min(100,corruption+15);setCorruption(nc);updStat('maxCorruption',nc,true)
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1}):m)
      msg='🎸 Distortion! Corruption +15%. All members +1 ATK.'
      addFloat('+1 ATK',getCenter(bossRef).x,getCenter(bossRef).y-70,'#cc4400')
    }
    else if(card.id==='seance'){
      const healAmt=Math.max(1,Math.floor(corruption/4))
      ns=ns.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+healAmt)}):m)
      msg='🔮 Séance! All members +'+healAmt+' HP'+(corruption>0?' ('+Math.floor(corruption)+'% ÷ 4)':' (min 1)')
      addFloat('+'+healAmt+' HP',getCenter(bossRef).x,getCenter(bossRef).y-70,'#22aa44')
    }
    else if(card.id==='staticcharge'){
      const scBonus=corruption===0?4:2
      setEmbers(p=>Math.min(maxEmbers,p+scBonus));playEmber();spent=0
      msg='⚡ Static Charge! +'+scBonus+' Embers'+(corruption===0?' (pure signal bonus)':'')+'.'
      addFloat('+'+scBonus+' 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
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
      const ptBonus=activeArtifacts.some(a=>a.id==='a5')?3:2
      const p4Bonus=activePassives.some(p=>p.id==='p4')?1:0
      setEmbers(p=>Math.min(maxEmbers,p+ptBonus+p4Bonus));playEmber();spent=0
      msg='🔌 Power Tap! +'+(ptBonus+p4Bonus)+' Ember'+(ptBonus+p4Bonus>1?'s!':'!')
    }
    else if(card.id==='soundboard'){
      setEmbers(p=>Math.min(maxEmbers,p+2));playEmber();spent=0
      setPendingDraw(p=>p+1) // draw 1 extra card at start of next strike
      msg='🎛 Soundboard! +2 Embers. Draw 1 extra card next Strike.'
      addFloat('+2 🔥 +1 DRAW',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='setbreak'){
      // Handled entirely in handleDropOnStage to avoid double setHand race
      return false
    }
    else if(card.id==='heavyriff'){
      const p5HeavyBonus=activePassives.some(p=>p.id==='p5')?2:0
      const activeAtk=stage.filter(m=>m&&!m.tooStoned).reduce((sum,m)=>sum+m.atk,0)
      const dmg=Math.floor(activeAtk*(card.upgraded?0.6:0.5))+p5HeavyBonus
      const bc=getCenter(bossRef)
      const hrHp=Math.max(0,enemyHp-dmg);setEnemyHp(hrHp);if(hrHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      addFloat(dmg,bc.x,bc.y-60,'#9933cc',dmg>=10);playHit();updStat('totalDamage',dmg)
      if(hrHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🥊 Heavy Riff! Stage ATK ÷ 2 = '+dmg+' direct damage!'
    }
    else if(card.id==='herbmoney'){
      const herbDmg=stash
      if(herbDmg<=0){addLog('🌿 No Stash to power this!');return false}
      const bc=getCenter(bossRef)
      const hmHp=Math.max(0,enemyHp-herbDmg);setEnemyHp(hmHp);if(hmHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      addFloat(herbDmg,bc.x,bc.y-60,'#22aa44',herbDmg>=20);playHit();updStat('totalDamage',herbDmg)
      if(hmHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🌿 Herb Money! '+herbDmg+' damage ('+stash+'🌿 Stash). Stash kept.'
    }
    else if(card.id==='goingbroke'){
      if(stash<=0){addLog('💸 You are already broke!');return false}
      const brokeDmg=stash
      setStash(0)
      const bc=getCenter(bossRef)
      const gbHp=Math.max(0,enemyHp-brokeDmg);setEnemyHp(gbHp);if(gbHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      addFloat(brokeDmg,bc.x,bc.y-60,'#ffcc00',true);playHit();updStat('totalDamage',brokeDmg)
      addFloat('BROKE!',bc.x,bc.y-110,'#ffcc00',true)
      if(gbHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='💸 Going Broke! '+brokeDmg+' damage. All Stash spent.'
    }
    // ── UNLOCKABLE CARDS ─────────────────────────────────────────
    else if(card.id==='moshpit'){
      const alive=ns.filter(m=>m&&!m.tooStoned).length
      const mpDmg=alive*3
      const bc=getCenter(bossRef)
      const mpHp=Math.max(0,enemyHp-mpDmg);setEnemyHp(mpHp);if(mpHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      addFloat(mpDmg,bc.x,bc.y-60,'#cc44ff',mpDmg>=10);playHit();updStat('totalDamage',mpDmg)
      if(mpHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🤘 Mosh Pit! '+alive+' members × 3 = '+mpDmg+' damage!'
    }
    else if(card.id==='bloodritual'){
      if(!m)return false
      const sacrifice=Math.floor(m.hp*0.25)
      if(sacrifice<=0){addLog('🩸 Not enough HP to sacrifice!');return false}
      ns[slotIdx]=Object.assign({},m,{hp:m.hp-sacrifice})
      const bc=getCenter(bossRef)
      const brDmg=sacrifice*(chosenPacts.includes('blood_price')?9:(card.upgraded?8:6));const brHp=Math.max(0,enemyHp-brDmg);setEnemyHp(brHp);if(brHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      setCorruption(p=>Math.min(100,p+15));updStat('maxCorruption',Math.min(100,corruption+15),true)
      addFloat(brDmg,bc.x,bc.y-60,'#cc0000',true);playHit();updStat('totalDamage',brDmg)
      addFloat('-'+sacrifice+' HP',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#ff4444',false)
      if(brHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🩸 Blood Ritual! '+m.name+' sacrifices '+sacrifice+' HP → '+brDmg+' damage (6×)! Corruption +15%'
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
      playSfx('hellquake');triggerShake(16,600);discover('hellquake','HELLQUAKE');tryAchieve('hellquake')
      const roll=Math.floor(Math.random()*10)+1
      const bc=getCenter(bossRef)
      let hqMsg='',hqFloat='',hqColor='#aa1111',hqDesc=''
      // d10 outcomes: 5 positive, 2 mixed, 3 negative
      if(roll<=2){
        // 1-2: OBLITERATION — total band ATK × 4 (positive)
        const totalAtk=ns.filter(m=>m&&!m.tooStoned).reduce((sum,m)=>sum+m.atk,0)
        const hqDmg=totalAtk*4
        const oblitHp=Math.max(0,enemyHp-hqDmg);setEnemyHp(oblitHp);if(oblitHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
        updStat('totalDamage',hqDmg)
        if(oblitHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},2100)
        hqMsg='⛧ HELLQUAKE: OBLITERATION! '+hqDmg+' damage!';hqFloat='OBLITERATION!';hqColor='#ff2200';hqDesc='Total band ATK × 4 — '+hqDmg+' damage dealt to the boss.'
      } else if(roll===3){
        // 3: RESONANCE — all members +3 ATK permanently (positive)
        ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3}):m)
        hqMsg='⛧ HELLQUAKE: RESONANCE! All members +3 ATK forever!';hqFloat='RESONANCE!';hqColor='#ff6600';hqDesc='All members gain +3 ATK permanently.'
      } else if(roll===4){
        // 4: RITUAL — boss HP halved (positive)
        const ritualHp=Math.max(1,Math.floor(enemyHp/2));setEnemyHp(ritualHp)
        hqMsg='⛧ HELLQUAKE: RITUAL! Boss HP halved!';hqFloat='RITUAL!';hqColor='#cc44ff';hqDesc='The boss HP has been cut in half.'
      } else if(roll===5){
        // 5: THE VOID — corruption → damage, reset to 0 (positive)
        const voidDmg=Math.floor(corruption)
        const voidHp=Math.max(0,enemyHp-voidDmg);setEnemyHp(voidHp);if(voidHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
        updStat('totalDamage',voidDmg)
        setCorruption(0)
        if(voidHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},2100)
        hqMsg='⛧ HELLQUAKE: THE VOID! '+voidDmg+' damage, soul cleansed!';hqFloat='THE VOID!';hqColor='#4400aa';hqDesc='Corruption converted to '+voidDmg+' damage. Soul cleansed to 0%.'
      } else if(roll===6){
        // 6: POSSESSION — all cards free this fight (positive)
        setAllCardsFree(true)
        hqMsg='⛧ HELLQUAKE: POSSESSION! All cards free this fight!';hqFloat='POSSESSED!';hqColor='#aa44ff';hqDesc='All cards cost 0 Embers for the rest of this fight.'
      } else if(roll===7){
        // 7: BACKLASH — 30 damage BUT one random member falls (mixed)
        const backlashHp=Math.max(0,enemyHp-30);setEnemyHp(backlashHp);if(backlashHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
        updStat('totalDamage',30)
        if(backlashHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},2100)
        const alive=ns.filter(m=>m&&!m.tooStoned)
        if(alive.length>0){const victim=alive[Math.floor(Math.random()*alive.length)];const vi=ns.indexOf(victim);ns[vi]=Object.assign({},victim,{hp:0,tooStoned:true})}
        hqMsg='⛧ HELLQUAKE: BACKLASH! 30 damage, one member lost!';hqFloat='BACKLASH!';hqColor='#9933cc';hqDesc='30 damage dealt — but one member went Too Stoned.'
      } else if(roll===8){
        // 8: FEEDBACK — boss dmg doubles 2 strikes but +3 embers (mixed)
        setPendingEmbers(p=>p+3)
        setBossDebuff(p=>p-4) // negative debuff = extra boss damage for 2 strikes effectively
        hqMsg='⛧ HELLQUAKE: FEEDBACK! Boss energised but you gain 3 Embers!';hqFloat='FEEDBACK!';hqColor='#ff8800';hqDesc='+3 Embers gained — but the boss is energised for 2 Strikes.'
      } else if(roll===9){
        // 9: THE RIFF CURSE — entire hand discarded, no redraw (negative)
        setHand([]);setDiscardPile(p=>[...p,...hand])
        hqMsg='⛧ HELLQUAKE: THE RIFF CURSE! Hand obliterated!';hqFloat='CURSED!';hqColor='#880000';hqDesc='Your entire hand has been obliterated. No redraw.'
      } else {
        // 10: TOTAL WIPEOUT — random member Too Stoned AND boss heals 15 (negative)
        const alive2=ns.filter(m=>m&&!m.tooStoned)
        if(alive2.length>0){const v2=alive2[Math.floor(Math.random()*alive2.length)];const vi2=ns.indexOf(v2);ns[vi2]=Object.assign({},v2,{hp:0,tooStoned:true})}
        setEnemyHp(function(prev){return Math.min(enemy.maxHp,prev+15)})
        hqMsg='⛧ HELLQUAKE: TOTAL WIPEOUT! A member falls and the boss recovers!';hqFloat='WIPEOUT!';hqColor='#440000';hqDesc='A member fell and the boss recovered 15 HP.'
      }
      // Dramatic flash then reveal
      setHellquakeAnim({text:hqFloat,color:hqColor,desc:hqDesc})
      setTimeout(()=>setHellquakeAnim(null),5000)
      msg=hqMsg
      addFloat(hqFloat,bc.x,bc.y-80,hqColor,true)
      playHit()
    }
    else if(card.id==='possessedperf'){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*3,tempBuff:true,_origAtk:s._origAtk||s.atk}):s});msg='🎭 POSSESSED! Triple ATK!';addFloat('×3 ATK!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)}
    else if(card.id==='infencore'){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{encoreReady:true}):s});msg='👿 Infernal Encore! All members attack again!';ns.filter(x=>x&&!x.tooStoned).forEach(x=>addBuff(x.uid,'ENCORE','#dd2222'))}

    // Single-member buff corruption trigger
    if(ns[slotIdx]&&m&&(ns[slotIdx].buffCount||0)>=3&&(ns[slotIdx].buffCount||0)>(m.buffCount||0)&&(ns[slotIdx].buffCount||0)===3){
      const nc2=Math.min(100,corruption+20);setCorruption(nc2);updStat('maxCorruption',nc2,true)
      addLog('⚠ '+(ns[slotIdx].name)+' has 3+ buffs — Corruption +20%!')
    }

    setStage(ns)
    if(spent>0)setEmbers(function(p){return p-spent})
    if(msg)addLog(msg)
    updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
    if(card.type==='RIFF'&&shredderDiscount>0)setShredderUsed(true)
    if(card.type==='RIFF')setLastRiffPlayed(card)
    // ── RIFF CHAIN COMBO DETECTION ──
    cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
    const played=cardsPlayedRef.current
    for(const chain of RIFF_CHAINS){
      if(played.includes(chain.cards[0])&&played.includes(chain.cards[1])&&!combosFiredRef.current.includes(chain.id)){
        if(!combosDiscoveredThisRun.includes(chain.id)){
          setCombosDiscoveredThisRun(p=>[...p,chain.id])
          // Track lifetime discoveries
          const disc=JSON.parse(localStorage.getItem('vst_combos_discovered')||'[]')
          if(!disc.includes(chain.id)){disc.push(chain.id);localStorage.setItem('vst_combos_discovered',JSON.stringify(disc))}
        }
        setComboFlash({name:chain.name,color:chain.color,emoji:chain.emoji})
        playSfx('combo');triggerShake(10,350);setStrikeMult(p=>Math.round((p+0.15)*100)/100);addLog('⛧ RIFF CHAIN: '+chain.emoji+' '+chain.name+'! +10% bonus damage!')
        combosFiredRef.current.push(chain.id)
        addFloat('⛧ '+chain.name+' ⛧',getCenter(bossRef).x,getCenter(bossRef).y-140,chain.color,true)
        // Apply combo bonus damage = total stage ATK
        const comboBonus=ns.filter(m=>m&&!m.tooStoned).reduce((s,m)=>s+m.atk,0)
        setEnemyHp(p=>{const nh=Math.max(0,p-comboBonus);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh})
        updStat('totalDamage',comboBonus)
        setTimeout(()=>setComboFlash(null),2700)
        break
      }
    }
    // cardHeal enemy passive
    if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+2))
    else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+5))
    return true
  },[embers,stage,corruption,stageDiveUsed,deck,discardPile,hand,bossRef,stageRefs,selected,fightTripBuff,enemy,enemyHp,maxEmbers,activePassives,activeArtifacts,chosenPacts,activeGenre,fightIndex,shredderUsed,collectedLoot])

  const handleDropOnStage=useCallback((slotIdx)=>{
    if(!dragCardUid||animPhase!=='idle')return
    const card=hand.find(c=>c.uid===dragCardUid)
    if(!card)return

    // ── SMOKE BREAK: handle entirely here to avoid double setHand race ──
    if(card.id==='setbreak'){
      const handWithout=hand.filter(c=>c.uid!==card.uid)
      if(handWithout.length===0){addLog('🎼 No cards to discard!');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      const effectiveEmbers=nextCardFreeRef.current||allCardsFreeRef.current?0:Math.max(0,card.embers-((card.foil&&card.embers>=2)?1:0))
      if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      if(nextCardFreeRef.current)setNextCardFree(false)
      const preSelected=selected.filter(uid=>uid!==card.uid)
      const victim=preSelected.length>0
        ?(handWithout.find(c=>c.uid===preSelected[0])||handWithout[Math.floor(Math.random()*handWithout.length)])
        :handWithout[Math.floor(Math.random()*handWithout.length)]
      const remaining=handWithout.filter(c=>c.uid!==victim.uid)
      setHand(remaining)
      setDiscardPile(p=>[...p,card,victim])
      setSelected([])
      setEmbers(p=>Math.min(maxEmbers,p+3-effectiveEmbers))
      addLog('🎼 Smoke Break! '+victim.name+' discarded. +3 Embers.'+(preSelected.length===0?' (tip: select a card first)':''))
      addFloat('+3 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
      updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id,'_smokebreak_discard'] // count victim too for refill
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    // ── GROUPIE: handle entirely here to avoid double setHand race ──
    if(card.id==='groupie'){
      const foilDiscount=(card.foil&&card.embers>=2)?1:0
      const synDiscount=(fightTripBuff==='SYNESTHESIA')?1:0
      const effectiveEmbers=nextCardFreeRef.current||allCardsFreeRef.current?0:Math.max(0,card.embers-foilDiscount-synDiscount)
      if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      if(nextCardFreeRef.current)setNextCardFree(false)
      const p4Bonus=activePassives.some(p=>p.id==='p4')?1:0
      const handWithout=hand.filter(c=>c.uid!==card.uid)
      const res=drawUpTo(handWithout,deckRef.current,[...discRef.current,card],handWithout.length+1)
      setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
      setEmbers(p=>Math.min(maxEmbers,p+2+p4Bonus-effectiveEmbers))
      addLog('🍯 Groupie! +2 Embers, drew 1 card.')
      addFloat('+2 🔥 +1 card',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff6600')
      updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    // ── SETLIST: handle entirely here to avoid double state updates ──
    if(card.id==='setlist'){
      if(setlistOpen){setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      const effectiveEmbers=nextCardFreeRef.current||allCardsFreeRef.current?0:Math.max(0,card.embers-((card.foil&&card.embers>=2)?1:0))
      if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      if(nextCardFreeRef.current)setNextCardFree(false)
      // Draw 2 cards immediately (uncapped), then open force-discard modal
      const handWithout=hand.filter(c=>c.uid!==card.uid)
      const drawRes=drawUpTo(handWithout,deckRef.current,[...discRef.current,card],handWithout.length+(card.upgraded?4:3))
      setHand(drawRes.h);setDeck(drawRes.d);setDiscardPile(drawRes.disc)
      setSetlistCards(drawRes.h)
      setSetlistOpen(true)
      if(effectiveEmbers>0)setEmbers(p=>p-effectiveEmbers)
      addLog('📋 Setlist! Drew 2 cards — now pick 1 to discard.')
      updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    // ── BURN THE SET: handle entirely here to avoid double state updates ──
    if(card.id==='burnset'){
      const effectiveEmbers=nextCardFreeRef.current||allCardsFreeRef.current?0:Math.max(0,card.embers-((card.foil&&card.embers>=2)?1:0))
      if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      if(nextCardFreeRef.current)setNextCardFree(false)
      const toDiscard=selected.filter(uid=>uid!==card.uid).slice(0,3)
      const discardCount=toDiscard.length
      const drawCount=discardCount+1
      const remainingHand=hand.filter(c=>c.uid!==card.uid&&!toDiscard.includes(c.uid))
      const discarded=hand.filter(c=>toDiscard.includes(c.uid))
      const res=drawUpTo(remainingHand,deckRef.current,[...discRef.current,card,...discarded],remainingHand.length+drawCount)
      setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
      setSelected([])
      if(effectiveEmbers>0)setEmbers(p=>p-effectiveEmbers)
      addLog('🔥 Burned '+discardCount+' card'+(discardCount!==1?'s':'')+', drew '+drawCount+'.'+(discardCount===0?' (Tip: select cards before playing)':''))
      updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
      setLastRiffPlayed(card)
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    // ── REMASTER: handle here for fresh selected state (same fix as setlist/burnset) ──
    if(card.id==='remaster'){
      const toDeleteUid=selected.find(uid=>uid!==card.uid&&hand.some(c=>c.uid===uid))
      if(!toDeleteUid){addLog('🎙 Select 1 card in hand first, then play The Remaster.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      const effectiveEmbers=nextCardFreeRef.current||allCardsFreeRef.current?0:Math.max(0,card.embers-((card.foil&&card.embers>=2)?1:0))
      if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      if(nextCardFreeRef.current)setNextCardFree(false)
      const toDelete=hand.find(c=>c.uid===toDeleteUid)
      const handAfterDelete=hand.filter(c=>c.uid!==toDeleteUid&&c.uid!==card.uid)
      const res=drawUpTo(handAfterDelete,deckRef.current,[...discRef.current,card,toDelete],handAfterDelete.length+3)
      setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
      setSelected([])
      if(effectiveEmbers>0)setEmbers(p=>p-effectiveEmbers)
      addLog('🎙 Remastered! Deleted '+toDelete.name+', drew 3.')
      addFloat('🎙 -1 +3 CARDS',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44',true)
      updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      // cardHeal enemy passive
      if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+2))
      else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
      else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+5))
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    // ── SIGNAL DECAY: discard 1 random from hand, draw 2 ──
    if(card.id==='sigdecay'){
      const effectiveEmbers=nextCardFreeRef.current||allCardsFreeRef.current?0:Math.max(0,card.embers-((card.foil&&card.embers>=2)?1:0))
      if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers.');setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null);return}
      if(nextCardFreeRef.current)setNextCardFree(false)
      const handWithout=hand.filter(c=>c.uid!==card.uid)
      if(handWithout.length===0){
        // No cards to discard, just draw 2
        const res=drawUpTo(handWithout,deckRef.current,[...discRef.current,card],handWithout.length+2)
        setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
        addLog('📡 Signal Decay! Drew 2 cards.')
      } else {
        // Discard 1 random, draw 2
        const victimIdx=Math.floor(Math.random()*handWithout.length)
        const victim=handWithout[victimIdx]
        const remaining=handWithout.filter((_,i)=>i!==victimIdx)
        const res=drawUpTo(remaining,deckRef.current,[...discRef.current,card,victim],remaining.length+2)
        setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
        addLog('📡 Signal Decay! Discarded '+victim.name+', drew 2 cards.')
      }
      setSelected([])
      if(effectiveEmbers>0)setEmbers(p=>p-effectiveEmbers)
      updStat('cardsPlayed',1);setGenreCounts(p=>({...p,[card.type]:(p[card.type]||0)+1}));setStrikeMult(p=>Math.round((p+0.03)*100)/100)
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+2))
      else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
      else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+5))
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    const ok=applyCard(card,slotIdx)
    if(ok){
      const playedId=card.id
      const curHand=[...hand]
      const remaining=curHand.filter(c=>c.uid!==dragCardUid)
      const hasResonanceCoil=activeArtifacts.some(a=>a.id==='a9')
      const resonantIdx=hasResonanceCoil?remaining.findIndex(c=>c.id===playedId):-1
      if(resonantIdx!==-1&&!card.consumable){
        const resonant=remaining[resonantIdx]
        const withoutResonant=remaining.filter((_,i)=>i!==resonantIdx)
        setHand(withoutResonant)
        setDiscardPile(p=>[...p,card,resonant])
        setEmbers(p=>Math.min(maxEmbers,p+2))
        setPendingEmbers(p=>p+1)
        discover('resonance','RESONANCE')
        setTimeout(()=>{
          addFloat('RESONANCE +🔥',getCenter(bossRef).x,getCenter(bossRef).y-110,'#e8a820',false)
          addLog('🎵 Resonance! Duplicate discarded for +2 Embers.')
        },100)
      } else {
        setHand(remaining)
        if(card.consumable){
          addLog('⛧ '+card.name+' shatters and vanishes from your deck!')
          addFloat('CONSUMED!',getCenter(bossRef).x,getCenter(bossRef).y-110,'#ff4400',true)
        } else {
          setDiscardPile(p=>[...p,card])
        }
      }
    }
    setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
  },[dragCardUid,hand,animPhase,applyCard,embers,deck,discardPile,enemy,maxEmbers,selected,activeArtifacts,activePassives])

  const handleStageDrop=useCallback((toIdx)=>{
    if(dragCardUid){handleDropOnStage(toIdx);return}
    if(dragStageIdx===null||dragStageIdx===toIdx)return
    const ns=[...stage];var tmp=ns[dragStageIdx];ns[dragStageIdx]=ns[toIdx];ns[toIdx]=tmp
    setStage(scanMentorLinks(ns));setDragStageIdx(null)
  },[dragCardUid,dragStageIdx,stage,handleDropOnStage])

  const handleHandReorder=useCallback((fromIdx,toIdx)=>{
    if(fromIdx===toIdx||fromIdx===null||toIdx===null)return
    setHand(prev=>{
      if(fromIdx<0||fromIdx>=prev.length||toIdx<0||toIdx>=prev.length)return prev
      const next=[...prev]
      const [card]=next.splice(fromIdx,1)
      if(!card)return prev
      next.splice(toIdx,0,card)
      return next.filter(Boolean)
    })
    setDragHandIdx(null)
    setDragOverHandIdx(null)
  },[])

  const handleDiscard=useCallback(()=>{
    if(selected.length===0||discardsLeft<=0||animPhase!=='idle')return
    // (Amp Overload no longer skips discards — it costs one instead)
    const toDisc=hand.filter(c=>selected.includes(c.uid))
    const rem=hand.filter(c=>!selected.includes(c.uid))
    const res=drawUpTo(rem,deckRef.current,[...discRef.current,...toDisc],Math.max(HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0),hand.length))
    setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
    playSfx('discard');setDiscardsLeft(p=>p-1);setSelected([])
    addLog('🗑 '+toDisc.length+' discarded & replaced.')
  },[selected,discardsLeft,animPhase,hand,deck,discardPile,drawUpTo])

  const victoryFiredRef=useRef(false)
  const triggerVictoryRef=useRef(null)
  const triggerVictory=useCallback(function(){
    if(victoryFiredRef.current)return // prevent double-fire
    victoryFiredRef.current=true
    // CLUTCH DETECTION
    const aliveCount=stage.filter(m=>m&&!m.tooStoned).length
    if(aliveCount===1){setClutchFlash({text:'SOLO VICTORY!',color:'#ffd700'});playSfx('big_hit');triggerShake(8,300);setTimeout(()=>setClutchFlash(null),2500)}
    else if(strikesLeft<=0){setClutchFlash({text:'BY THE SKIN OF YOUR TEETH!',color:'#ff4400'});playSfx('big_hit');triggerShake(6,250);setTimeout(()=>setClutchFlash(null),2500)}
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
  const circleBaseMin=[8,6,7,8,9,9,11,11,14]
  const circleBaseRange=[3,4,4,3,4,4,5,5,7]
  const baseMin=circleBaseMin[Math.min(circleNum-1,8)]
  const baseRange=circleBaseRange[Math.min(circleNum-1,8)]
  const stashEarned=baseMin+Math.floor(Math.random()*baseRange)+strikesLeft+perfectBonus
    setStash(function(p){return Math.min(MAX_STASH,p+stashEarned)})
    updStat('stashEarned',stashEarned);updStat('fightsSurvived',1)
    if(Math.random()<0.15){setStash(p=>Math.min(MAX_STASH,p+2));addLog('🎽 Found some merch money! +2 Stash.')}
    if(activePassives.some(p=>p.id==='p3')){setStash(p=>Math.min(MAX_STASH,p+2));addLog('💿 Merch Table! +2 Stash.')}
    if(corruption>=69){setStash(p=>Math.min(MAX_STASH,p+3));addLog('🌀 Corruption Dividend! +3 Stash (69%+ corruption!)')}
    if(stashStolenThisFight>0){setStash(p=>Math.min(MAX_STASH,p+stashStolenThisFight));addLog('💰 Reclaimed '+stashStolenThisFight+'🌿 stolen by '+enemy.name+'!');setStashStolenThisFight(0)}
    // soulThief: return stolen ATK on victory
    if(stolenAtkPool>0){
      setStage(p=>{const alive=p.filter(m=>m&&!m.tooStoned);if(alive.length===0)return p;
        const perMember=Math.floor(stolenAtkPool/alive.length),remainder=stolenAtkPool%alive.length;let ri=0
        return p.map(m=>{if(!m||m.tooStoned)return m;const bonus=perMember+(ri<remainder?1:0);ri++;return Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus})})})
      addLog('🔓 '+stolenAtkPool+' stolen ATK returned to your band!')
      setStolenAtkPool(0)
    }
    if(perfectBonus>0)addFloat('PERFECT! +'+perfectBonus,getCenter(bossRef).x,getCenter(bossRef).y-100,'#e8a820',true)
    playSfx('victory');addLog('⛧ Victory! +'+stashEarned+' Stash'+(perfectBonus>0?' (Perfect Strike bonus!)':' earned.'))
    // ── ACHIEVEMENT TRIGGERS ─────────────────────────────────
    tryAchieve('first_blood')
    const cn=Math.floor(fightIndex/3)+1
    if(cn>=3)tryAchieve('circle_3')
    if(cn>=5)tryAchieve('circle_5')
    if(cn>=5&&drugsUsedThisRun.shrooms===0&&drugsUsedThisRun.acid===0)tryAchieve('sober_run')
    if(cn>=7)tryAchieve('circle_7')
    if(cn>=9)tryAchieve('circle_9')
    if(strikesLeft>=3&&(fightIndex+1)%3===0)tryAchieve('perfect_strike')
    if(corruption>=100)tryAchieve('corruption_lord')
    if(stage.filter(m=>m&&!m.tooStoned).length>=5)tryAchieve('full_band')
    if(fightIndex===26){tryAchieve('beat_lucifer');beatStake(activeStake.id)}
    const bq=BOSS_QUOTES[enemy&&enemy.id];if(bq)setTimeout(()=>addLog('💀 "'+bq+'"'),600)
    setTimeout(function(){
      const isCircleBoss=(fightIndex+1)%3===0
      if(isCircleBoss){
        setMaxEmbers(function(p){const newMax=Math.min(MAX_EMBERS_CAP,p+1);setEmbers(newMax);return newMax})
        playSfx('level_up');addFloat('MAX EMBERS +1',getCenter(bossRef).x,getCenter(bossRef).y-130,'#ff6600',true)
      }
      if(welcomeToHell==='fighting'){
        // The Executive defeated!
        playVictory()
        const contractBonus=1+contractsPlayed*0.5 // 1x base, +0.5x per contract
        const wthScore=Math.round(calcRunScore(stats,true)*3*contractBonus)
        addLog('⛧ THE SECOND ALBUM! Score ×3'+(contractsPlayed>0?' ×'+(1+contractsPlayed*0.5)+' (contracts)':'')+' = '+wthScore.toLocaleString())
        // Save second album title
        const stakeUn=getStakeUnlocks();if(!stakeUn.includes('second_album')){stakeUn.push('second_album');localStorage.setItem('vst_stake_unlocks',JSON.stringify(stakeUn))}
        setWelcomeToHell('won')
        setTimeout(()=>setGameState('end'),3000)
      }
      else if(fightIndex>=26){
      playVictory();setDeathCause('victory')
      setStreakWins(p=>p+1);setStreakLosses(0)
      const newRuns=totalRunsPlayed+1
      setTotalRunsPlayed(newRuns)
      localStorage.setItem('vst_runs', newRuns)
      const runScore=calcRunScore(stats, true)
      saveRunHistory(stats,true,enemy,runSeed)
      if(runScore>personalBest){setPersonalBest(runScore);localStorage.setItem('vst_best',runScore)}
      const newLifetime=lifetimeScore+runScore
      setLifetimeScore(newLifetime);localStorage.setItem('vst_lifetime',newLifetime)
      const today=new Date().toISOString().slice(0,10)
      const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10)
      const newStreak=lastPlayedDate===yesterday||lastPlayedDate===today?dailyStreak+1:1
      setDailyStreak(newStreak);localStorage.setItem('vst_streak',newStreak)
      setLastPlayedDate(today);localStorage.setItem('vst_lastdate',today)
      // Victory cinematic sequence
      const bandNames=stage.filter(m=>m&&!m.tooStoned).map(m=>m.name)
      setVictoryCinematic({phase:0,bandNames,stakeId:activeStake.id,stakeName:activeStake.name})
      setTimeout(()=>setVictoryCinematic(p=>p?{...p,phase:1}:null),800) // crack
      setTimeout(()=>{setVictoryCinematic(p=>p?{...p,phase:2}:null);playSfx('devil_dead');triggerShake(16,700)},2000) // THE DEVIL IS DEAD
      setTimeout(()=>setVictoryCinematic(p=>p?{...p,phase:3}:null),4500) // band members rise
      setTimeout(()=>setVictoryCinematic(p=>p?{...p,phase:4}:null),7000) // stake unlocked
      setTimeout(()=>{setVictoryCinematic(null);setWelcomeToHell('choice')},10000) // WTH choice
    }
      else{
        const nextCn=Math.floor((fightIndex+1)/3)+1
        setShopCards(genShopCards(nextCn))
        setBoosterPacks(genBoosterPacks(nextCn))
        setRecruitPack(genRecruitPack(fightIndex))
        setShroomsInStock(Math.random()<0.50)
        setAcidInStock(Math.random()<0.50)
        setShopSoldIds([]) // clear sold state when shop rotates
        // Rotate circle artifact + passive at each new circle (every 3rd fight)
        const isCircleBoss=(fightIndex+1)%3===0
        if(isCircleBoss){
          setCircleArtifact(STARTER_ARTIFACTS[Math.floor(Math.random()*STARTER_ARTIFACTS.length)])
          setCirclePassive(STARTER_PASSIVES[Math.floor(Math.random()*STARTER_PASSIVES.length)])
          setCircleCartBought(false)
          setCirCleCpasBought(false)
        }
        // Post-fight heal (disabled on higher stakes)
        if(activeStake.healAfterFight){setStage(prev=>prev.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m))}
        // Victory flash before shop (circle cleared extra for bosses)
        const isBossKill=(fightIndex+1)%3===0
    if(isBossKill&&collectedLoot.includes('golden_tooth')){setStash(p=>Math.min(MAX_STASH,p+5));addLog('🪙 Golden Tooth! +5 bonus Stash.')}
        const cn=Math.floor(fightIndex/3)+1
        const circleNames=['','I — Limbo','II — Lust','III — Gluttony','IV — Greed','V — Anger','VI — Heresy','VII — Violence','VIII — Fraud','IX — Treachery']
        setCircleClearedData({circle:cn,circleName:circleNames[cn]||cn,bossName:enemy.name,bossEmoji:enemy.emoji,isBoss:isBossKill})
        if(isBossKill){
          // BOSS LOOT
          const loot=BOSS_LOOT[fightIndex]
          if(loot){
            if(loot.effect==='atk1all')setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,permAtkBonus:(m.permAtkBonus||0)+1}):m))
            else if(loot.effect==='hp3all')setStage(p=>p.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+3,hp:m.hp+3}):m))
            else if(loot.effect==='hp4all')setStage(p=>p.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+4,hp:m.hp+4}):m))
            else if(loot.effect==='atk2strong'){const al=stage.filter(m=>m&&!m.tooStoned);if(al.length){const s=al.reduce((a,b)=>a.atk>b.atk?a:b);setStage(p=>p.map(m=>m&&m.uid===s.uid?Object.assign({},m,{atk:m.atk+2,permAtkBonus:(m.permAtkBonus||0)+2}):m))}}
            else if(loot.effect==='atk3strong'){const al=stage.filter(m=>m&&!m.tooStoned);if(al.length){const s=al.reduce((a,b)=>a.atk>b.atk?a:b);setStage(p=>p.map(m=>m&&m.uid===s.uid?Object.assign({},m,{atk:m.atk+3,permAtkBonus:(m.permAtkBonus||0)+3}):m))}}
            addLog('🏆 Boss Loot: '+loot.emoji+' '+loot.name+' — '+loot.desc)
            setCollectedLoot(p=>[...p,loot.id])
            setCircleClearedData(p=>p?{...p,loot}:p)
          }
          // Generate 2 pact choices (never repeat already chosen)
          const available=PACT_REWARDS.filter(p=>!chosenPacts.includes(p.id))
          const shuffled=[...available].sort(()=>Math.random()-0.5)
          const picks=shuffled.slice(0,2)
          setTimeout(()=>{setCircleClearedData(null);setPactChoices(picks);setGameState('pact')},2800)
        } else {
          setTimeout(()=>{setCircleClearedData(null);setGameState('shop')},1800)
        }
      }
    },1000)
  },[strikesLeft,corruption,fightIndex,stolenAtkPool,activeStake,stage,hand,enemy,enemyHp,embers,maxEmbers,activeArtifacts,activePassives,chosenPacts,activeGenre,animPhase,discardsLeft,deck,discardPile,fightTripBuff,luciferPhase,welcomeToHell])
  triggerVictoryRef.current=triggerVictory


  // SAFETY NET: catch ANY case where boss HP hits 0 without victory triggering
  useEffect(()=>{
    if(enemyHp<=0&&gameState==='playing'&&!victoryFiredRef.current&&enemy&&enemy.maxHp>0){
      setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},300)
    }
  },[enemyHp,gameState])


  // ── DEV SHORTCUT: Shift+S = jump to shop ─────────────────────────
  useEffect(function(){
    function onKey(e){
      if(e.shiftKey&&e.key==='S'){
        setShopCards(genShopCards(1))
        setBoosterPacks(genBoosterPacks(1))
        setRecruitPack(genRecruitPack(fightIndex))
        setRerollCost(2)
        setStash(69)
        setShroomsInStock(Math.random()<0.50)
        setAcidInStock(Math.random()<0.50)
        setGameState('shop')
      }
      if(e.shiftKey&&(e.key==='C'||e.key==='c')){
        setGameState('campfire')
      }
      if(e.shiftKey&&(e.key==='W'||e.key==='w')){
        setDeathCause('victory')
        setStats({fightsSurvived:27,strikesThrown:108,totalDamage:666666,highestStrike:42069,tooStonedCount:3,maxCorruption:100,stashEarned:420,cardsPlayed:420})
        // Trigger cinematic sequence
        const bandNames=stage.filter(m=>m&&!m.tooStoned).map(m=>m.name)
        setVictoryCinematic({phase:0,bandNames:bandNames.length>0?bandNames:['Ragnar','Bjorn'],stakeId:activeStake.id,stakeName:activeStake.name})
        setTimeout(()=>setVictoryCinematic(p=>p?{...p,phase:1}:null),800)
        setTimeout(()=>{setVictoryCinematic(p=>p?{...p,phase:2}:null);playSfx('devil_dead')},2000)
        setTimeout(()=>setVictoryCinematic(p=>p?{...p,phase:3}:null),4500)
        setTimeout(()=>setVictoryCinematic(p=>p?{...p,phase:4}:null),7000)
        setTimeout(()=>{setVictoryCinematic(null);setWelcomeToHell('choice')},10000)
      }
      if(e.shiftKey&&(e.key==='D'||e.key==='d')){
        setDeathCause('stoned')
        setStats({fightsSurvived:6,strikesThrown:24,totalDamage:420,highestStrike:69,tooStonedCount:2,maxCorruption:66,stashEarned:42,cardsPlayed:99})
        setGameState('end')
      }
      if(e.key==='Escape'){setShowPauseOptions(p=>!p)}
    }
    window.addEventListener('keydown',onKey,true)
    return function(){window.removeEventListener('keydown',onKey,true)}
  },[])

  // ── TRIP ACTIVATION ──────────────────────────────────────────────
  const activateTrip=useCallback((type)=>{
    if(tripUsedThisFight)return
    setTripUsedThisFight(true)
    const roll=Math.random()
    let effectName='',effectDesc='',effectColor='#44dd44'

    if(type==='shrooms'){
      setHeldShrooms(p=>Math.max(0,p-1))
      setDrugsUsedThisRun(p=>{const n={...p,shrooms:p.shrooms+1};if(n.shrooms>0&&n.acid>0)tryAchieve('drug_lord');return n})
      if(roll<0.05){
        // 5% bad trip
        effectName='BAD TRIP';effectDesc='Paranoia! All members -2 ATK this fight.';effectColor='#cc2222'
        setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:Math.max(1,m.atk-2)}):m))
        addLog('🍄 BAD TRIP! Paranoia — all members -2 ATK!')
      } else if(roll<0.10){
        // 5% bunk
        effectName='BUNK SHROOMS';effectDesc='Nothing happens. You feel slightly disappointed.';effectColor='#888888'
        addLog('🍄 Bunk shrooms. Nothing happened.')
      } else {
        // 90% good trip — roll d4
        const d4=Math.floor(Math.random()*4)
        if(d4===0){
          effectName='EGO DEATH';effectDesc='All members +2 ATK this fight!';effectColor='#ffdd44'
          setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+2}):m))
          addLog('🍄 EGO DEATH! All members +2 ATK!')
        } else if(d4===1){
          effectName='TIME DILATION';effectDesc='+1 bonus Strike this fight!';effectColor='#ff8800'
          setStrikesLeft(p=>p+1)
          addLog('🍄 TIME DILATION! +1 Strike this fight!')
        } else if(d4===2){
          effectName='SYNESTHESIA';effectDesc='All cards cost 1 less ember this fight!';effectColor='#cc44ff'
          // Handled via activeTripEffect check in card cost calculation
          addLog('🍄 SYNESTHESIA! All cards cost 1 less ember!')
        } else {
          effectName='COSMIC UNITY';effectDesc='All members healed to full HP + Stonewall!';effectColor='#44ddaa'
          setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:m.maxHp,stoneShield:2}):m))
          addLog('🍄 COSMIC UNITY! Full HP + Stonewall for all!')
        }
      }
    } else if(type==='acid'){
      setHeldAcid(p=>Math.max(0,p-1))
      setDrugsUsedThisRun(p=>{const n={...p,acid:p.acid+1};if(n.shrooms>0&&n.acid>0)tryAchieve('drug_lord');return n})
      if(roll<0.05){
        // 5% bad trip — Hellquake
        effectName='BAD TRIP';effectDesc='Corruption hits 100%! Hellquake!';effectColor='#cc2222'
        setCorruption(100)
        addLog('🧪 BAD TRIP! Corruption maxed — Hellquake territory!')
      } else if(roll<0.10){
        // 5% bunk
        effectName='BUNK ACID';effectDesc='Just paper. Nothing happens.';effectColor='#888888'
        addLog('🧪 Bunk acid. It was just paper.')
      } else {
        // 90% good trip — roll d4
        const d4=Math.floor(Math.random()*4)
        if(d4===0){
          effectName='FRACTAL VISION';effectDesc='All damage DOUBLED this fight!';effectColor='#ff44ff'
          addLog('🧪 FRACTAL VISION! Every card effect fires twice!')
        } else if(d4===1){
          effectName='DIMENSIONAL RIFT';effectDesc='Boss takes DOUBLE damage this fight!';effectColor='#ff3300'
          addLog('🧪 DIMENSIONAL RIFT! Boss takes double damage!')
        } else if(d4===2){
          effectName='EGO DISSOLUTION';effectDesc='Corruption → 69%. All members +3 ATK permanently!';effectColor='#aa44ff'
          setCorruption(69)
          setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3}):m))
          addLog('🧪 EGO DISSOLUTION! Corruption → 69%. All +3 ATK!')
        } else {
          effectName='ASTRAL PROJECTION';effectDesc='All members immune to boss damage this fight!';effectColor='#44ddff'
          addLog('🧪 ASTRAL PROJECTION! Band is untouchable!')
        }
      }
    }

    playSfx(type==='shrooms'?'shrooms':'acid');setActiveTripEffect({type,name:effectName,desc:effectDesc,color:effectColor})
    setFightTripBuff(effectName) // persists for entire fight — combat reads this
    setTimeout(()=>setActiveTripEffect(null),4000)
  },[tripUsedThisFight,strikesLeft])

  const handleStrike=useCallback(()=>{playSfx('strike');triggerShake(8,300);const currentMult=strikeMultRef.current;setStrikeMult(1.0);setMemberBuffs({});
    if(animPhase!=='idle'||strikesLeft<=0||enemyHp<=0)return
    const actives=stage.filter(m=>m&&!m.tooStoned)
    if(actives.length===0){addLog('⚠ No active members!');return}

    if(pendingEmbers>0){setEmbers(p=>Math.min(maxEmbers,p+pendingEmbers));addLog('🪙 +'+pendingEmbers+' Embers from Tapped Out!');playEmber();setPendingEmbers(0)}
    if(pendingDraw>0){
      const _pd=pendingDraw
      const pdRes=drawUpTo(handRef.current,deckRef.current,discRef.current,handRef.current.length+_pd)
      setHand(pdRes.h);setDeck(pdRes.d);setDiscardPile(pdRes.disc)
      addLog('🎛 Soundboard draw! +'+_pd+' card'+(_pd>1?'s':'')+'.')
      setPendingDraw(0)
    }

    // DEBUFF keyword: Nott reduces boss damage each Strike
    const debuffCount=stage.filter(m=>m&&!m.tooStoned&&m.keyword==='DEBUFF').length
    if(debuffCount>0){setBossDebuff(p=>p+debuffCount*2);addLog('🎤 Nott debuffs the boss! (-'+(debuffCount*2)+' damage)')}
    cardsToDrawRef.current=cardsPlayedRef.current.length+(activeGenre==='PROG_ROCK'?1:0)
    setAnimPhase('attacking');setStrikesLeft(p=>p-1);updStat('strikesThrown',1);setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[]

    const buffed=actives.filter(m=>(m.buffCount||0)>0)
    const bandBonus=buffed.length>=5?1.35:buffed.length>=4?1.20:buffed.length>=3?1.10:1.0
    if(bandBonus>1)addLog('🎸 Band synergy! '+buffed.length+' buffed: +'+Math.round((bandBonus-1)*100)+'% damage!')

    const hasDbl=actives.some(m=>m.role==='Drummer')
    // PARANOIA: 1 random member refuses to attack, deals 3 to ally
    let paranoiaVictim=null
    if(enemy.passiveId==='paranoia'&&actives.length>1){
      paranoiaVictim=actives[Math.floor(Math.random()*actives.length)]
      const allies=actives.filter(m=>m.uid!==paranoiaVictim.uid)
      if(allies.length>0){const target=allies[Math.floor(Math.random()*allies.length)]
        setStage(p=>p.map(m=>m&&m.uid===target.uid?Object.assign({},m,{hp:Math.max(0,m.hp-3)}):m))
        addLog('🗝 '+paranoiaVictim.name+' turns paranoid! Attacks '+target.name+' for 3 damage!')}
    }
    const p10Bonus=activePassives.some(p=>p.id==='p10')&&strikesLeft===activeStake.maxStrikes?10:0
    let dmg=actives.filter(m=>m.role!=='Drummer'&&(!paranoiaVictim||m.uid!==paranoiaVictim.uid)).reduce((s,m)=>{
      const effectiveAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/15):m.atk
      const cleanLivingBonus=(chosenPacts.includes('clean_living')&&corruption<15)?3:0
      return s+effectiveAtk+cleanLivingBonus
    },0)+p10Bonus
    // DOUBLE TIME d6 multiplier
    let dblMode='', dblMult=1
    if(hasDbl){
      if(dblRoll<=2){dblMult=0.5;dblMode='HALF TIME'}
      else if(dblRoll<=4){dblMult=1.5;dblMode='OFF BEAT'}
      else{dblMult=2;dblMode='DOUBLE TIME'}
      dmg=Math.round(dmg*dblMult)
    }
    const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer').reduce((s,m)=>{
      const ea=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/15):m.atk
      return s+ea
    },0)
    dmg+=encDmg
    dmg=Math.round(dmg*bandBonus)
    // ── MENTOR LINK strike multiplier ──────────────────────────────
    {let _mlb=0
    for(let _i=0;_i<stage.length-1;_i++){
      const _mn=stage[_i],_bs=stage[_i+1]
      if(!_mn||!_bs||_mn.tooStoned||_bs.tooStoned)continue
      if(_mn.isMentor&&_bs.mentorLinkedToUid===_mn.uid&&_bs.mentorAlive){
        const _ma=_mn.keyword==='CORRUPT'?_mn.atk+Math.floor(corruption/15):_mn.atk
        const _ba=_bs.keyword==='CORRUPT'?_bs.atk+Math.floor(corruption/15):_bs.atk
        const _effectiveMult=_bs.mentorMult+(activeStake.mentorBonus||0)
        const _b=Math.round((_ma+_ba)*(_effectiveMult-1))
        _mlb+=_b
        addLog('⛓ Mentor Link! '+_mn.name+'+'+_bs.name+' ×'+_effectiveMult.toFixed(2)+' (+'+_b+'!)');tryAchieve('mentor_link')
        addFloat('⛓ ×'+_effectiveMult.toFixed(2),getCenter(stageRefs.current[_i]).x,getCenter(stageRefs.current[_i]).y-80,'#ffd700',true)
      }
    }
    if(_mlb>0)dmg+=_mlb}
    // CA4: Wailing Guitar — first Strike deals double damage
    if(activeArtifacts.some(a=>a.id==='ca4')&&strikesLeft===activeStake.maxStrikes){dmg*=2;addLog('🎸 Wailing Guitar! First Strike deals DOUBLE damage!')}
    // GENRE BONUSES
    if(activeGenre==='RIFF_METAL'){dmg=Math.round(dmg*1.15);addLog('🎸 Riff Metal genre! +15% strike damage!')}
    if(activeGenre==='DOOM_METAL'&&discardsLeft>=MAX_DISCARDS){dmg+=actives.length*2;addLog('🎵 Doom Metal genre! +'+actives.length*2+' ATK (no discards used)')}
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
    // Compute per-member damage for cascade display
    const memberDmgs=[]
    actives.forEach(function(m){
      if(m.role==='Drummer')return
      if(paranoiaVictim&&m.uid===paranoiaVictim.uid)return
      let mAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/15):m.atk
      if(chosenPacts.includes('clean_living')&&corruption<15)mAtk+=3
      if(m.encoreReady)mAtk*=2
      memberDmgs.push({m,atk:mAtk})
    })
    actives.forEach(function(m){
      if(m.role==='Drummer')return
      const si=stage.indexOf(m)
      const from=getCenter(stageRefs.current[si])
      const ppid=prid.current++
      const md=memberDmgs.find(d=>d.m.uid===m.uid)
      const curDelay=delay
      setTimeout(function(){try{(ATK_SND[m.role]||ATK_SND['Lead Guitarist'])()}catch(e){}
        setProjectiles(function(p){return[...p,{id:ppid,from:from,to:bc,emoji:m.emoji}]})
        if(md)addFloat(md.atk,from.x,from.y-40,'#cc8800',false)
      },curDelay)
      delay+=260
    })

    setTimeout(function(){
      playHit();setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setProjectiles([])
      const tripMult=fightTripBuff==='DIMENSIONAL RIFT'||fightTripBuff==='FRACTAL VISION'?2:1;const finalDmg=Math.round(dmg*tripMult*currentMult);const newEHp=Math.max(0,enemyHp-finalDmg)
      setEnemyHp(newEHp)
      // damageScaleAtk: boss gains ATK per 20 damage taken
      if(enemy.passiveId==='luciferBoss'){
        const atkGain=luciferPhase===1?1:2
        const phaseTotalDmg=luciferPhase===1?(3333-newEHp):(3333-newEHp)
        setBossRageAtk(Math.floor(Math.max(0,phaseTotalDmg)/20)*atkGain)
      }
      addFloat('TOTAL: '+finalDmg+(currentMult>1.0?' (x'+currentMult.toFixed(2)+')':''),bc.x,bc.y-60,'#ff2200',true)
      if(folkMagicFired){
        setEmbers(maxEmbers)
        addFloat('🪈 FOLK MAGIC! Full Embers!',window.innerWidth/2,window.innerHeight*0.35,'#44ddaa',true)
        addLog('🪈 Folk Magic proc! All Embers refunded.')
      }
      updStat('totalDamage',finalDmg);updStat('highestStrike',finalDmg,true);if(finalDmg>=500){playSfx('big_hit');triggerShake(8,250)}

      setStage(function(p){return p.map(function(m){
        if(!m)return null
        var nm=Object.assign({},m)
        if(nm.encoreReady)nm=Object.assign({},nm,{encoreReady:false})
        if(nm.tempBuff&&nm._origAtk!==undefined)nm=Object.assign({},nm,{atk:nm._origAtk,_origAtk:undefined,tempBuff:false})
        return nm
      })})

      if(newEHp<=0){
        // LUCIFER PHASE TRANSITION: Phase 1 → Phase 2
        if(enemy.passiveId==='luciferBoss'&&luciferPhase===1){
          setLuciferPhase(2)
          setEnemyHp(3333)
          setBossRageAtk(0)
          // Full band reset
          setStage(p=>p.map(m=>m?Object.assign({},m,{hp:m.maxHp,tooStoned:false,stoneShield:false,tempBuff:false,encoreReady:false,ampedThisStrike:false}):null))
          setEmbers(maxEmbers)
          setStrikesLeft(activeStake.maxStrikes)
          setDiscardsLeft(MAX_DISCARDS)
          setTripUsedThisFight(false)
          setFightTripBuff(null)
          setActiveTripEffect(null)
          // Dramatic transition
          setLuciferCinematic({text:'THE ICE SHATTERS',hp:3333,phase:2})
          setTimeout(()=>setLuciferCinematic(null),4000)
          addLog('⛧ THE ICE SHATTERS ⛧')
          addLog('😈 Phase 2: Satan, Lord of the Flies — 3,333 HP')
          addLog('⛧ Band revived! Full HP, Embers, Strikes, Discards reset!')
          setAnimPhase('idle')
          return
        }
        if(triggerVictoryRef.current)triggerVictoryRef.current();return
      }

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
        // Lucifer Phase 2: AoE — hits ALL members (damage split)
        const luciferAoE=enemy.passiveId==='luciferBoss'&&luciferPhase===2
        setDiceTarget(target);setShowDice(true);playDice()
        setTimeout(function(){
          setShowDice(false)
          const variance=0
          // Apply enemy passive scaling effects before damage
        const stakeBaseDmg=enemy.baseDmg+activeStake.dmgAdd
        let scaledBaseDmg=Math.max(1,stakeBaseDmg-(chosenPacts.includes('stone_wall')?1:0))+(enemy.passiveId&&enemy.passiveId.startsWith('damageScaleAtk')?bossRageAtk:0)
        // selfbuff: boss gains +1/+2 dmg per Strike
        if(enemy.passiveId==='selfbuff'){scaledBaseDmg=stakeBaseDmg+strikesLeft}
        else if(enemy.passiveId==='selfbuff2'){scaledBaseDmg=stakeBaseDmg+(activeStake.maxStrikes-strikesLeft)*2}
        // rageScale: +X dmg per buffed member
        else if(enemy.passiveId==='rageScale1'){const buffed=stage.filter(m=>m&&(m.buffCount||0)>0).length;scaledBaseDmg=stakeBaseDmg+buffed*1}
        else if(enemy.passiveId==='rageScale2'){const buffed=stage.filter(m=>m&&(m.buffCount||0)>0).length;scaledBaseDmg=stakeBaseDmg+buffed*2}
        // corruptPlayer: raises player corruption each Strike
        else if(enemy.passiveId==='corruptPlayer'){setCorruption(p=>Math.min(100,p+10));addLog('🔱 Heretic corrupts your band! +10% Corruption.')}
        else if(enemy.passiveId==='corruptPlayer15'){setCorruption(p=>Math.min(100,p+15));addLog('⛧ Apostate corrupts! +15% Corruption.')}
        else if(enemy.passiveId==='corruptPlayer20'){setCorruption(p=>Math.min(100,p+20));addLog('📖 False Prophet corrupts! +20% Corruption.')}
        // stashSteal: steals stash each strike
        else if(enemy.passiveId==='stashSteal'){if(stash>0){const stolen=Math.min(stash,1);setStash(p=>Math.max(0,p-stolen));setStashStolenThisFight(p=>p+stolen);addLog('💰 The Miser steals '+stolen+'🌿!')}}
        else if(enemy.passiveId==='stashSteal2'){if(stash>0){const stolen=Math.min(stash,2);setStash(p=>Math.max(0,p-stolen));setStashStolenThisFight(p=>p+stolen);addLog('🪙 The Hoarder steals '+stolen+'🌿!')}}
        else if(enemy.passiveId==='stashSteal3'){if(stash>0){const stolen=Math.min(stash,3);setStash(p=>Math.max(0,p-stolen));setStashStolenThisFight(p=>p+stolen);addLog('🏦 The Usurer steals '+stolen+'🌿!')}}
        // soulThief: steal 1 permanent ATK from random member
        else if(enemy.passiveId==='soulThief'){
          scaledBaseDmg=stakeBaseDmg+stolenAtkPool
          const stealTargets=stage.filter(m=>m&&!m.tooStoned&&(m.permAtkBonus||0)>0)
          if(stealTargets.length>0){const victim=stealTargets[Math.floor(Math.random()*stealTargets.length)]
            setStage(p=>p.map(m=>m&&m.uid===victim.uid?Object.assign({},m,{atk:m.atk-1,permAtkBonus:(m.permAtkBonus||0)-1}):m))
            setStolenAtkPool(p=>p+1)
            addLog('🔒 The Betrayer steals 1 ATK from '+victim.name+'!')}
        }
        // luciferBoss: phase-specific passives
        else if(enemy.passiveId==='luciferBoss'){
          if(luciferPhase===1){
            // Frozen Wrath: frostbite 3 to all + damageScale +1
            scaledBaseDmg=stakeBaseDmg+bossRageAtk
            playSfx('boss_attack');triggerShake(10,350);setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:Math.max(0,m.hp-3)}):m))
            addLog('🧊 Frostbite! All members take 3 cold damage.')
          } else if(luciferPhase===2){
            // Infernal: AoE + damageScale +2
            scaledBaseDmg=stakeBaseDmg+bossRageAtk
          }
        }
        else{scaledBaseDmg=stakeBaseDmg}
        const actualDmg=(fightTripBuff==='ASTRAL PROJECTION')?0:Math.max(1,Math.round(scaledBaseDmg)-bossDebuff)
          const ti=stage.indexOf(target)
          if(luciferAoE&&actualDmg>0){
            // Phase 2: AoE — split damage across ALL alive members
            const splitDmg=Math.ceil(actualDmg/activeM.length)
            addLog('😈 Satan strikes ALL members for '+splitDmg+' each! ('+actualDmg+' total)')
            setStage(function(prev){
              const ns2=[...prev]
              for(let ai=0;ai<ns2.length;ai++){
                if(!ns2[ai]||ns2[ai].tooStoned)continue
                const newHp=ns2[ai].hp-splitDmg
                if(newHp<=0&&!ns2[ai].stoneShield){ns2[ai]=Object.assign({},ns2[ai],{hp:0,tooStoned:true});updStat('tooStonedCount',1);playSfx('member_down');triggerShake(12,400)
                  if(activeArtifacts.some(a=>a.id==='a6')){setEnemyHp(ehp=>{const nh=Math.max(0,ehp-8);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh});addLog('🕯 Black Candle! 8 damage!')}
                }
                else if(newHp<=0&&ns2[ai].stoneShield){const nsh=typeof ns2[ai].stoneShield==='number'?ns2[ai].stoneShield-1:0;ns2[ai]=Object.assign({},ns2[ai],{hp:1,stoneShield:nsh>0?nsh:false});setClutchFlash({text:'CLUTCH!',color:'#ffd700'});setTimeout(()=>setClutchFlash(null),1500)}
                else{ns2[ai]=Object.assign({},ns2[ai],{hp:Math.max(0,newHp)})}
              }
              const allStoned=ns2.filter(m=>m).every(m=>m.tooStoned)
              if(allStoned){discover('allstoned','TOTAL WIPEOUT');if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins this round. But you already conquered Hell.')}else{setDeathCause('stoned');playSfx('defeat')};setTimeout(()=>setGameState('end'),800)}
              return ns2
            })
            setDamageFlash(true);triggerShake(10,350);setTimeout(()=>setDamageFlash(false),400)
            setDiceTarget(null)
          } else {
          setStage(function(prev){
            const ns2=[...prev]
            if(ns2[ti]){
              const newHp=ns2[ti].hp-actualDmg
              if(newHp<=0&&!ns2[ti].stoneShield){
                ns2[ti]=Object.assign({},ns2[ti],{hp:0,tooStoned:true})
                if(ns2[ti].isMentor){for(let _bi=0;_bi<ns2.length;_bi++){if(ns2[_bi]&&ns2[_bi].mentorLinkedToUid===ns2[ti].uid)ns2[_bi]={...ns2[_bi],mentorAlive:false}}}
                updStat('tooStonedCount',1)
                // A6: Black Candle — deal 8 damage
                if(activeArtifacts.some(a=>a.id==='a6')){
                  setEnemyHp(ehp=>{const nh=Math.max(0,ehp-8);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh})
                  addLog('🕯 Black Candle! 8 damage from '+target.name+' — sacrificed!')
                }
                // P6: Cult Following — gain 3 Stash
                if(activePassives.some(p=>p.id==='p6')){
                  setStash(ps=>Math.min(MAX_STASH,ps+3))
                  addLog('🎭 Cult Following! +3 Stash.')
                }
                addFloat('TOO STONED',getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-60,'#888',false)
              } else if(newHp<=0&&ns2[ti].stoneShield){
                // StoneShield absorbs lethal hit — survives at 1 HP, decrement shield
                const newShield=typeof ns2[ti].stoneShield==='number'?ns2[ti].stoneShield-1:0
                ns2[ti]=Object.assign({},ns2[ti],{hp:1,stoneShield:newShield>0?newShield:false})
                addLog('🛡 '+target.name+' shielded from death! 1 HP remaining.'+(newShield>0?' ('+newShield+' shield left)':''))
                addFloat('SHIELDED!',getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-60,'#44ccff',true)
              } else {
                ns2[ti]=Object.assign({},ns2[ti],{hp:Math.max(0,newHp)})
              }
              addFloat(actualDmg,getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-50,'#ff3300',false)
            }
            const allStoned=ns2.filter(function(m){return m}).every(function(m){return m.tooStoned})
            if(allStoned){discover('allstoned','TOTAL WIPEOUT');if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins this round. But you already conquered Hell.')}else{setDeathCause('stoned');playSfx('defeat')};setTimeout(function(){setGameState('end')},800)}
            return ns2
          })
          if(stage[stage.indexOf(target)]&&!stage[stage.indexOf(target)].tooStoned&&(stage[stage.indexOf(target)].hp-actualDmg)<=0&&!stage[stage.indexOf(target)].stoneShield)addLog('💨 '+target.name+' is TOO STONED!')
          setDamageFlash(true);triggerShake(10,350);setTimeout(function(){setDamageFlash(false)},400)
          addLog('👁 '+enemy.name+' hits '+target.name+' for '+actualDmg)
          setDiceTarget(null)
          } // end single-target else
          setTimeout(function(){
            let nh=[...handRef.current],nd=[...deckRef.current],ndisc=[...discRef.current];
            const cardsToReplace=Math.min(cardsToDrawRef.current,10-nh.length);
            for(let _r=0;_r<cardsToReplace;_r++){
              if(nd.length===0){
                if(ndisc.length===0)break;
                nd=[...ndisc].filter(Boolean).sort(()=>Math.random()-.5);
                ndisc=[];
              }
              if(nd[0])nh=[...nh,nd[0]];nd=nd.slice(1);
            }
            setHand(nh.filter(Boolean));setDeck(nd.filter(Boolean));setDiscardPile(ndisc.filter(Boolean));
            playDraw();playSfx('draw');
            // WELCOME TO HELL: inject contract card every 2 strikes
            if(welcomeToHell==='fighting'){
              wthStrikesRef.current++
              if(wthStrikesRef.current%2===0){
                const contractCard={id:'contract',name:'Record Deal',type:'CORRUPT',rarity:'Rare',emoji:'📝',embers:0,effect:'Sign the deal. +50% score. Lose your strongest member.',color:'#aa1111',typeColor:'#880000',uid:'contract_'+uid()}
                setHand(h=>[...h,contractCard])
                addLog('📝 The Executive slides a contract across the table...')
              }
            }
            // ANCHOR keyword: heal adjacent members after Strike
            setStage(function(prev){
              const ns=[...prev];
              prev.forEach(function(m,i){
                if(m&&!m.tooStoned&&m.keyword==='ANCHOR'){
                  if(i>0&&ns[i-1]&&!ns[i-1].tooStoned&&ns[i-1].keyword!=='FALLEN')ns[i-1]=Object.assign({},ns[i-1],{hp:Math.min(ns[i-1].maxHp,ns[i-1].hp+1)});
                  if(i<4&&ns[i+1]&&!ns[i+1].tooStoned&&ns[i+1].keyword!=='FALLEN')ns[i+1]=Object.assign({},ns[i+1],{hp:Math.min(ns[i+1].maxHp,ns[i+1].hp+1)});
                }
              });
              return ns;
            });
            // CA3: Sabbath Crown — revive Too Stoned members at 50% HP after each Strike
            if(activeArtifacts.some(a=>a.id==='ca3')){
              setStage(prev=>{
                let revived=false
                const ns=prev.map(m=>{
                  if(m&&m.tooStoned){revived=true;return Object.assign({},m,{tooStoned:false,hp:Math.max(1,Math.floor(m.maxHp*0.5))})}
                  return m
                })
                if(revived)addLog('👑 Sabbath Crown! Fallen members revived at 50% HP.')
                return ns
              })
            }
            // FALLEN keyword: Lucifer loses 1 HP per strike, game over if dead
            setStage(prev=>{
              const ns=prev.map(m=>{
                if(m&&!m.tooStoned&&m.keyword==='FALLEN'){
                  const newHp=m.hp-1
                  if(newHp<=0){
                    addLog('😈 Lucifer has fallen! The Devil is dead. GAME OVER.')
                    playSfx('defeat');setTimeout(()=>{setDeathCause('fallen');setGameState('end')},800)
                    return Object.assign({},m,{hp:0,tooStoned:true})
                  }
                  return Object.assign({},m,{hp:newHp})
                }
                return m
              })
              return ns
            })
            // C8 FRAUD: discard N random cards from hand, draw N replacements
            if(enemy.passiveId==='fraudShuffle'||enemy.passiveId==='fraudShuffle2'||enemy.passiveId==='fraudShuffle3'){
              const shuffleCount=enemy.passiveId==='fraudShuffle'?1:enemy.passiveId==='fraudShuffle2'?2:3
              const curH=[...handRef.current],curD=[...deckRef.current],curDisc=[...discRef.current]
              if(curH.length>0){
                const toDiscard=Math.min(shuffleCount,curH.length)
                const indices=[]
                while(indices.length<toDiscard){const idx=Math.floor(Math.random()*curH.length);if(!indices.includes(idx))indices.push(idx)}
                const discarded=indices.map(i=>curH[i]).filter(Boolean)
                const remaining=curH.filter((_,i)=>!indices.includes(i)).filter(Boolean)
                const newDisc=[...curDisc,...discarded]
                let nd=[...curD].filter(Boolean),drawn=[]
                for(let i=0;i<toDiscard&&nd.length>0;i++)drawn.push(nd.shift())
                if(nd.length===0&&drawn.length<toDiscard&&newDisc.length>0){nd=[...newDisc].sort(()=>Math.random()-.5);const more=[];while(drawn.length<toDiscard&&nd.length>0)more.push(nd.shift());drawn=[...drawn,...more]}
                setHand([...remaining,...drawn].filter(Boolean));setDeck(nd.filter(Boolean));setDiscardPile(newDisc.filter(Boolean))
                addLog('🃏 '+enemy.name+' shuffles your hand! '+toDiscard+' card'+(toDiscard>1?'s':'')+' swapped.')
              }
            }
            setAnimPhase('idle');setSelected([]);
            // Check out-of-strikes death AFTER this strike resolves
            setStrikesLeft(function(cur){
              if(cur<=0){
                if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins. But you already conquered Hell.')}else{setDeathCause('beaten');playSfx('defeat')};
                {const _rs=calcRunScore(stats,false);saveRunHistory(stats,false,enemy,runSeed);
                // Achievement checks at game end
                if(_rs>=5000)unlockAchievement('high_score_5k')
                if(_rs>=10000)unlockAchievement('high_score_10k')
                if((totalRunsPlayed+1)>=10)unlockAchievement('ten_runs')
                const _nr=totalRunsPlayed+1;setTotalRunsPlayed(_nr);localStorage.setItem('vst_runs',_nr);if(_rs>personalBest){setPersonalBest(_rs);localStorage.setItem('vst_best',_rs)}const _nl=lifetimeScore+_rs;setLifetimeScore(_nl);localStorage.setItem('vst_lifetime',_nl);setStreakLosses(p=>p+1);setStreakWins(0);const _td=new Date().toISOString().slice(0,10);const _yd=new Date(Date.now()-86400000).toISOString().slice(0,10);const _ns=lastPlayedDate===_yd||lastPlayedDate===_td?dailyStreak+1:1;setDailyStreak(_ns);localStorage.setItem('vst_streak',_ns);setLastPlayedDate(_td);localStorage.setItem('vst_lastdate',_td)}
                setTimeout(function(){setGameState('end')},800);
              }
              return cur;
            });
          },900)
        },1200)
      },delay+400)
    },delay+200)
  },[animPhase,strikesLeft,enemyHp,stage,hand,deck,discardPile,enemy,embers,pendingEmbers,fightIndex,bossRef,stageRefs,drawUpTo,triggerVictory,bossRageAtk,bossDebuff,fightTripBuff,luciferPhase,stolenAtkPool,maxEmbers])

  const handleShopLeave=useCallback(()=>{
    // Welcome to Hell: after final shop, go to cutscene then fight
    if(welcomeToHell==='shopping'){
      setWelcomeToHell('cutscene')
      setGameState('playing') // needed so cutscene screen renders
      setTimeout(()=>{
        setEnemy(AR_EXECUTIVE)
        setEnemyHp(AR_EXECUTIVE.maxHp)
        setEmbers(maxEmbers);setStrikesLeft(activeStake.maxStrikes+(chosenPacts.includes('war_drums')?1:0));setDiscardsLeft(MAX_DISCARDS)
        setStageDiveUsed(false);setAnimPhase('idle');setSelected([]);setLastRiffPlayed(null)
        setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[]
        setContractsPlayed(0);setPendingDraw(0);wthStrikesRef.current=0
        const allCards=[...deckRef.current,...discRef.current].sort(()=>Math.random()-.5)
        const hs=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0)
        setHand(allCards.slice(0,hs));setDeck(allCards.slice(hs));setDiscardPile([])
        handTargetRef.current=hs
        setStage(p=>p.map(m=>m?Object.assign({},m,{hp:m.maxHp,tooStoned:false,tempBuff:false,encoreReady:false,stoneShield:false,atk:m._origAtk!==undefined?m._origAtk:m.atk,_origAtk:undefined}):null))
        setWelcomeToHell('fighting')
      },3000)
      return
    }
    const nextIdx=overrideFightIdxRef.current!==null?overrideFightIdxRef.current:Math.min(fightIndex+1, 26)
    overrideFightIdxRef.current=null
    // Show Descent map when entering a new circle (circles 2-9)
    if(nextIdx%3===0&&nextIdx>=3&&nextIdx<26&&!skipDescentRef.current){
      const circleNum=Math.floor(nextIdx/3)+1
      // Show 3-second circle splash first
      setCircleSplash({circleNum,circleName:CIRCLE_NAMES[circleNum],circleEmoji:CIRCLE_EMOJIS[circleNum]})
      setGameState('circleSplash')
      setTimeout(()=>{
        setCircleSplash(null)
        const r1=DESCENT_REWARDS_1[Math.floor(Math.random()*DESCENT_REWARDS_1.length)]
        const r2=DESCENT_REWARDS_2[Math.floor(Math.random()*DESCENT_REWARDS_2.length)]
        setDescentData({
          circleNum,
          circleName:CIRCLE_NAMES[circleNum],
          circleEmoji:CIRCLE_EMOJIS[circleNum],
          fights:[ENEMIES[nextIdx],ENEMIES[nextIdx+1],ENEMIES[nextIdx+2]],
          fightIndices:[nextIdx,nextIdx+1,nextIdx+2],
          reward1:r1,reward2:r2,
          skips:[]
        })
        setGameState('descent')
      },3000)
      return
    }
    setFightIndex(nextIdx)
    const nextEnemy=ENEMIES[nextIdx]
    setEnemy(nextEnemy);setEnemyHp(Math.ceil(nextEnemy.maxHp*activeStake.hpMult))
    // Pact: Corruption Engine — +5% corruption at fight start
    if(chosenPacts.includes('corruption_engine'))setCorruption(p=>Math.min(100,p+5))
    setEmbers(function(){return maxEmbers+(bonusEmbers>0?bonusEmbers:0)});playSfx('ember_gain');setStrikesLeft(activeStake.maxStrikes+(chosenPacts.includes('war_drums')?1:0));setDiscardsLeft(MAX_DISCARDS+(bonusDiscards>0?bonusDiscards:0));setPendingDraw(0)
    if(bonusDiscards>0)setBonusDiscards(0);if(bonusEmbers>0)setBonusEmbers(0)
    setStageDiveUsed(false);setAnimPhase('idle');setSelected([]);setProjectiles([]);setBossDebuff(0);setBossRageAtk(0);setNextCardFree(false);setAllCardsFree(false);setSkipNextDiscard(false);setShredderUsed(false);setLastRiffPlayed(null);setStashStolenThisFight(0);setTripUsedThisFight(false);setActiveTripEffect(null);setFightTripBuff(null);setStolenAtkPool(0);setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[];handTargetRef.current=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0);milestonesFiredRef.current={half:false,quarter:false,tenth:false};setPhaseBanner('play');setStrikeMult(1.0);setMemberBuffs({});victoryFiredRef.current=false
    // BOSS LOOT effects at fight start
    if(collectedLoot.includes('love_letter'))setNextCardFree(true)
    // ── LUCIFER PHASE SETUP ─────────────────────────────────────
    if(fightIndex===26){
      // 8 circle bosses killed = 8 × 51,750 = 414,000 reduction → 6,666 HP
      const bossKillReduction=8*51750
      const luciferActualHp=Math.max(666,420666-bossKillReduction) // 6,666
      setEnemyHp(luciferActualHp)
      setLuciferPhase(1)
      addLog('⛧ YOUR VICTORIES ECHO THROUGH HELL ⛧')
      addLog('⛧ 8 Circle Bosses defeated — Lucifer weakened to '+luciferActualHp+' HP!')
      addLog('🧊 Phase 1: Lucifer, Frozen in Cocytus')
      // Show cinematic overlay
      setLuciferCinematic({text:'YOUR VICTORIES ECHO THROUGH HELL',hp:luciferActualHp})
      setTimeout(()=>setLuciferCinematic(null),5000)
    } else {
      setLuciferPhase(0)
    }
    // Re-roll DOUBLE TIME for next fight
    const nd=stage.some(m=>m&&m.role==='Drummer')
    const ndCount=stage.filter(m=>m&&m.role==='Drummer').length
    if(nd){let r=Math.floor(Math.random()*6)+1;if(ndCount>=2&&r<=2)r=Math.floor(Math.random()*6)+1;setDblRoll(r)}else setDblRoll(null)
    setStage(p=>{
      const reset=p.map(m=>m?Object.assign({},m,{tooStoned:false,hp:m.maxHp,buffCount:0,tempBuff:false,encoreReady:false,stoneShield:false,atk:m._origAtk!==undefined?m._origAtk:m.atk,_origAtk:undefined}):null)
      return scanMentorLinks(reset)
    })
    // Redeal hand from current deck+discard
    const allCards=[...deckRef.current,...discRef.current].sort(()=>Math.random()-.5)
    const _lhs=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0)
    setHand(allCards.slice(0,_lhs))
    setDeck(allCards.slice(_lhs))
    setDiscardPile([])
    handTargetRef.current=_lhs
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
    // ── CIRCLE ARTIFACT FIGHT-START EFFECTS ──────────────────
    const hasGoat=activeArtifacts.some(a=>a.id==='ca1')     // Goat of Mendes: all +1 ATK
    const hasHellfire=activeArtifacts.some(a=>a.id==='ca2')  // Hellfire Amulet: +2 embers
    const hasCrown=activeArtifacts.some(a=>a.id==='ca3')     // Sabbath Crown: revive (handled post-strike)
    const hasWailing=activeArtifacts.some(a=>a.id==='ca4')   // Wailing Guitar: first strike x2 (handled in handleStrike)
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
          if(ns[ri].keyword!=='FALLEN')ns[ri]=Object.assign({},ns[ri],{hp:Math.min(ns[ri].maxHp,ns[ri].hp+3)})
        }
      }
      // P8: Green Room — all members Stonewall
      if(hasP8){ns=ns.map(m=>m?Object.assign({},m,{stoneShield:true}):null)}
      // CA1: Goat of Mendes — all members +1 ATK
      if(hasGoat){ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1}):m);addLog('🐐 Goat of Mendes! All members +1 ATK.')}
      return ns
    })
    // Corruption start (A2)
    if(hasDevilsFork)setCorruption(15)
    // Extra embers from Serpent's Kiss (P1 + burning stage + Hellfire Amulet)
    const extraEm=(hasP1?1:0)+burnBonus+(hasHellfire?2:0)
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
    // War Drums: +1 Strike
    if(activeArtifacts.some(a=>a.id==='wardrums')){setStrikesLeft(p=>p+1);addLog('🪘 War Drums! +1 Strike this fight.')}
    setGameState('playing')
  },[fightIndex,maxEmbers,stage])

  const handleShopSpend=useCallback((cost,type,item)=>{
    const effectiveCost=chosenPacts.includes('merchants_eye')?Math.max(1,Math.floor(cost*0.8)):cost
    if(stash<effectiveCost)return
    setStash(p=>p-effectiveCost)
    playSfx('buy')
    if(type==='card'){
      const nc=Object.assign({},item,{uid:uid(),shopBought:true})
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
      let candidates
      if(item._memberOverride){
        // Center shop member card — specific named member, already tiered
        const m=item._memberOverride
        // Use the member's actual identity (id, atk, hp, keyword etc)
        const base=ALL_MUSICIANS.find(mu=>mu.id===m.id)||m
        candidates=[{...base,foil:m.foil||false,mythic:m.mythic||false,demonic:m.demonic||false,uid:uid()}]
      } else {
        const count=item.members||2
        const real=getUnlockedMusicians()
        const shuffled=[...real].sort(()=>Math.random()-.5).slice(0,count)
        const fc=item.foilChance||0,mc=item.mythicChance||0,dc=item.demonicChance||0
        candidates=shuffled.map(m=>{
          const r=Math.random()
          if(dc&&r<dc)return{...m,demonic:true,mythic:false,foil:false}
          if(mc&&r<mc)return{...m,mythic:true,foil:false,demonic:false}
          if(fc&&r<fc)return{...m,foil:true,mythic:false,demonic:false}
          return{...m,foil:false,mythic:false,demonic:false}
        })
        // UNLOCK: Foil Vitalik — 30% chance Vitalik becomes Foil if base tier
        if(isUnlocked('vitalik_foil')){candidates=candidates.map(c=>c.id==='vitalik'&&!c.foil&&!c.mythic&&!c.demonic&&Math.random()<0.30?{...c,foil:true}:c)}
      }
      recruitPickFiredRef.current=false
      playSfx('pack_open')
      setRecruitCandidates(candidates)
      setGameState('recruit')
    } else if(type==='pack'){
      playSfx('pack_open')
      // Handle booster pack picks — route each picked card to the right place
      const picked = item.pickedCards || []
      const members = picked.filter(c => c.isMember)
      const cards = picked.filter(c => !c.isMember && !c._isPack)
      const artifacts = picked.filter(c => c._isPack && !c.cost && !c.isMember)
      const passives = picked.filter(c => c._isPack && c.cost)

      // Add regular cards to deck
      cards.forEach(c => {
        const nc = Object.assign({},c,{uid:uid(),shopBought:true})
        setDeck(p=>[...p,nc])
        setShopBoughtIds(p=>[...p,nc.uid])
        addLog('🛒 Added '+c.name+' to deck!')
      })
      // Equip artifacts
      artifacts.forEach(a => {
        if(activeArtifacts.length>=3){addLog('⚠ Artifact slots full!');return}
        setActiveArtifacts(p=>[...p,a])
        if(a.id==='a7')setMaxEmbers(p=>Math.min(8,p+1))
        if(a.id==='a8')setStage(prev=>prev.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+3,hp:m.hp+3}):null))
        addLog('⚗ Artifact equipped: '+a.name+'!')
      })
      // Equip passives
      passives.forEach(p => {
        if(activePassives.length>=5){addLog('⚠ Passive slots full!');return}
        setActivePassives(prev=>[...prev,p])
        addLog('💿 Passive equipped: '+p.name+'!')
      })
      // Members — trigger recruit flow (same as buying a recruitment pack)
      if(members.length>0){
        const enriched = members.map(m=>{
          return {...m, foil:m.foil||false, mythic:m.mythic||false, demonic:m.demonic||false}
        })
        recruitPickFiredRef.current=false
        setRecruitCandidates(enriched)
        setGameState('recruit')
      }
    } else if(type==='dealer'){
      // Dealer purchases handled by onBuyShrooms/onBuyAcid callbacks, just deduct stash
      addLog('🌿 Dealer transaction complete.')
    } else {addLog('📦 Purchased: '+item.name+'!')}
  },[stash])

  const recruitPickFiredRef=useRef(false)
  const handleRecruitPick=useCallback((member)=>{
    if(recruitPickFiredRef.current)return
    // Band cap: max 3 when Lucifer (FALLEN) is in band
    const hasLucifer=stage.some(m=>m&&m.keyword==='FALLEN')
    const currentSize=stage.filter(m=>m).length
    if(hasLucifer&&currentSize>=3){addLog('😈 Lucifer limits your band to 3 members!');setGameState('shop');setRecruitCandidates([]);return}
    recruitPickFiredRef.current=true
    const tier=memberTier(member)
    if(member.demonic){
      const existing=stage.find(m=>m&&m.demonic)
      if(existing){setDemonicConflict({incoming:member,existing});setRecruitCandidates([]);return}
    }
    let joinMsg=''
    setStage(prev=>{
      const ns=[...prev]
      const idx=ns.findIndex(m=>!m)
      if(idx!==-1){
        const withUid={...member,uid:uid(),roleBondWith:[],roleBondBonus:0}
        const bonded=applyMentorLink(withUid,ns)
        ns[idx]=bonded
        const tl=tier!=='base'?' ['+tier.toUpperCase()+']':''
        joinMsg='🎸 '+member.name+tl+' joins!'+(bonded.roleBondBonus>0?' 🔗 Bond +'+bonded.roleBondBonus+' ATK!':'')
      }
      return scanMentorLinks(ns)
    })
    if(joinMsg)addLog(joinMsg)
    setGameState('shop')
    setRecruitCandidates([])
  },[stage])

  const handleRecruitPass=useCallback(()=>{
    recruitPickFiredRef.current=false
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
    // Lucifer sells for 69 herb
    const price=member.keyword==='FALLEN'?69:member.demonic?69:5+(member.foil?3:0)+(member.mythic?8:0)
    setStage(prev=>{
      const ns=breakMentorLink(member,[...prev])
      ns[slotIdx]=null
      return ns
    })
    setStash(p=>Math.min(420,p+price))
    if(member.keyword==='FALLEN'){addLog('😈 Sold Lucifer for 69🌿! Band cap restored to 5.')}
    else{playSfx('sell');addLog('💰 Sold '+member.name+' for '+price+' stash.'+(member.roleBondBonus>0?' 🔗 Bond broken.':''))}
  },[stage])

  const handlePawnSellCard=useCallback((card)=>{
    const price=card.rarity==='Rare'?4:card.rarity==='Uncommon'?2:1
    setDeck(p=>{ const idx=p.findIndex(c=>c.uid===card.uid); if(idx===-1)return p; const n=[...p]; n.splice(idx,1); return n })
    setStash(p=>Math.min(420,p+price))
    playSfx('sell');addLog('💰 Sold '+card.name+' for '+price+' stash.')
  },[])

  const handlePawnBurnCard=useCallback((card)=>{
    setDeck(p=>{const idx=p.findIndex(c=>c.uid===card.uid);if(idx!==-1){const n=[...p];n.splice(idx,1);return n}return p})
    setDiscardPile(p=>{const idx=p.findIndex(c=>c.uid===card.uid);if(idx!==-1){const n=[...p];n.splice(idx,1);return n}return p})
    playSfx('burn');addLog('🔥 Burned '+card.name+' — permanently deleted from deck.')
  },[])

  const handleReroll=useCallback(()=>{
    if(stash<rerollCost)return
    setStash(p=>Math.min(MAX_STASH,p-rerollCost));setRerollCost(p=>p+2)
    const cn=Math.floor(fightIndex/3)+1
    setShopCards(genShopCards(cn))
    setShroomsInStock(Math.random()<0.50)
    setAcidInStock(Math.random()<0.50)
    playSfx('reroll');addLog('🔄 Shop rerolled for '+rerollCost+' 🌿')
  },[stash,rerollCost,fightIndex])

  const handleReset=()=>{
    setGameState('booster');setFightIndex(0);setEnemy(ENEMIES[0]);setEnemyHp(ENEMIES[0].maxHp)
    setStage([null,null,null,null,null]);setDeck([]);setHand([]);setDiscardPile([])
    setEmbers(activeStake.startEmbers);setMaxEmbers(activeStake.startEmbers);setStash(3);setStrikesLeft(activeStake.maxStrikes);setDiscardsLeft(MAX_DISCARDS);setPendingDraw(0);setBonusDiscards(0);setBonusEmbers(0)
    setAnimPhase('idle');setSelected([]);setProjectiles([]);setStageDiveUsed(false);setCorruption(activeStake.startCorruption);setDeathCause('fallen');setCircleClearedData(null);setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[];handTargetRef.current=HAND_SIZE;setCombosDiscoveredThisRun([]);setComboFlash(null);setChosenPacts([]);setUpgradedCards([]);setCollectedLoot([]);setPactChoices([]);setDescentData(null);overrideFightIdxRef.current=null;skipDescentRef.current=false;setGenreCounts({RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0})
    setLog(['⛧ Starting fresh...']);setShopBoughtIds([]);setShopSoldIds([]);setCircleCartBought(false);setCirCleCpasBought(false);setShopSoldIds([]);setHeldShrooms(0);setHeldAcid(0);setActiveTripEffect(null);setTripUsedThisFight(false);setFightTripBuff(null);setLuciferPhase(0);setLuciferCinematic(null);setVictoryCinematic(null);setWelcomeToHell(null);setContractsPlayed(0);setStolenAtkPool(0);setNewAchievements([]);setDrugsUsedThisRun({shrooms:0,acid:0})
    setActiveArtifacts([]);setActivePassives([]);setPendingBurningStage(false)
    setDiscovered(new Set())
    setStats({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0})
  }

  // Boss HP milestone detection
  useEffect(()=>{
    if(!enemy||enemyHp<=0||enemyHp>=enemy.maxHp)return
    const pct=enemyHp/enemy.maxHp
    const mf=milestonesFiredRef.current
    if(pct<=0.10&&!mf.tenth){mf.tenth=true;setMilestoneFlash({text:'DESTROY HIM!',color:'#ff2200'});triggerShake(6,300);playSfx('big_hit');setTimeout(()=>setMilestoneFlash(null),1800)}
    else if(pct<=0.25&&!mf.quarter){mf.quarter=true;setMilestoneFlash({text:'ALMOST',color:'#ff8800'});triggerShake(4,200);setTimeout(()=>setMilestoneFlash(null),1500)}
    else if(pct<=0.50&&!mf.half){mf.half=true;setMilestoneFlash({text:'HALFWAY',color:'#e8a820'});setTimeout(()=>setMilestoneFlash(null),1500)}
  },[enemyHp,enemy])

  // Phase banner sync
  useEffect(()=>{
    if(animPhase==='attacking')setPhaseBanner('strike')
    else if(animPhase==='boss')setPhaseBanner('boss')
    else if(animPhase==='idle')setPhaseBanner('play')
  },[animPhase])

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

  // ── MAIN MENU ──────────────────────────────────────────────
  if(gameState==='menu'){
    const lt=lifetimeScore||0
    const earned=UNLOCK_MILESTONES.filter(u=>lt>=u.score)
    const achs=getAchievements()
    const streak=dailyStreak||0
    const scanlines=localStorage.getItem('vst_scanlines')!=='off'

// Unlocks gallery
    if(menuView==='unlocks'){
    const discoveredCombos=JSON.parse(localStorage.getItem('vst_combos_discovered')||'[]')
    const tabs=[
      {id:'milestones',name:'Milestones',emoji:'🏆',color:'#e8a820'},
      {id:'members',name:'Members',emoji:'🎸',color:'#cc44ff'},
      {id:'cards',name:'Cards',emoji:'🃏',color:'#9933cc'},
      {id:'artifacts',name:'Artifacts',emoji:'⚙',color:'#c87820'},
      {id:'pedals',name:'Pedals',emoji:'🎛',color:'#9933cc'},
      {id:'combos',name:'Riff Chains',emoji:'⛧',color:'#ffdd00'},
      {id:'victories',name:'Victories',emoji:'🏆',color:'#ffd700'},
    ]
    const PAGE=8
    let items=[]
    if(unlockTab==='milestones')items=UNLOCK_MILESTONES.map(u=>({id:u.id,emoji:lt>=u.score?u.emoji:'🔒',name:lt>=u.score?u.label:'???',sub:u.score.toLocaleString()+' pts',done:lt>=u.score,pct:Math.min(100,Math.round(lt/u.score*100))}))
    else if(unlockTab==='members')items=[...ALL_MUSICIANS.filter(m=>!m.locked).map(m=>({id:m.id,emoji:m.emoji,name:m.name,sub:m.keyword,done:true})),...ALL_MUSICIANS.filter(m=>m.locked).map(m=>{const done=!m.unlockAt||lt>=m.unlockAt;return{id:m.id,emoji:done?m.emoji:'🔒',name:done?m.name:'???',sub:done?m.keyword:'LOCKED',done}}),...Array(7).fill(null).map((_,i)=>({id:'fm'+i,emoji:'🔒',name:'???',sub:'COMING SOON',done:false}))]
    else if(unlockTab==='cards')items=ALL_CARDS.map(c=>({id:c.id+(c.uid||''),emoji:c.emoji,name:c.name,sub:c.type+' · '+c.rarity+(c.shopOnly?' · SHOP':''),done:true,color:c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc',card:c}))
    else if(unlockTab==='artifacts')items=[...STARTER_ARTIFACTS.map(a=>{const done=!a.locked||(a.unlockAt&&lt>=a.unlockAt);return{id:a.id,emoji:done?a.emoji:'🔒',name:done?a.name:'???',sub:done?(a.effect||'').substring(0,50):'LOCKED',done}}),...Array(9).fill(null).map((_,i)=>({id:'fa'+i,emoji:'🔒',name:'???',sub:'COMING SOON',done:false}))]
    else if(unlockTab==='pedals')items=[...STARTER_PASSIVES.map(p=>({id:p.id,emoji:p.emoji,name:p.name,sub:(p.effect||'').substring(0,50),done:true})),...Array(10).fill(null).map((_,i)=>({id:'fp'+i,emoji:'🔒',name:'???',sub:'COMING SOON',done:false}))]
    else if(unlockTab==='combos')items=RIFF_CHAINS.map(ch=>{const found=discoveredCombos.includes(ch.id);const c1=ALL_CARDS.find(c=>c.id===ch.cards[0]);const c2=ALL_CARDS.find(c=>c.id===ch.cards[1]);return{id:ch.id,emoji:found?ch.emoji:'🔒',name:found?ch.name:'??? HIDDEN COMBO',sub:found?(c1?c1.name:'?')+' + '+(c2?c2.name:'?'):'Play two synergy cards in the same strike to discover',done:found,color:found?ch.color:'#444'}})
    else if(unlockTab==='victories'){const stakeUnlocks=getStakeUnlocks();items=['bronze','silver','gold','obsidian','blood','demonic'].map(sid=>{const su=STAKE_UNLOCKS[sid];const done=stakeUnlocks.includes(sid);return{id:su.id,emoji:done?su.emoji:'🔒',name:done?su.name:'???',sub:done?su.desc:'Beat '+sid.charAt(0).toUpperCase()+sid.slice(1)+' stake to unlock',done,color:done?su.color:'#444'}})}
    const totalPages=Math.ceil(items.length/PAGE)
    const pageItems=items.slice(unlockPage*PAGE,(unlockPage+1)*PAGE)
    return(
      <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9900,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'20px 40px',overflow:'hidden'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#cc1111',textShadow:'0 0 30px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>Unlocks</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#c8a040',letterSpacing:2}}>Lifetime Score: {lt.toLocaleString()}</div>
        {/* TABS */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center'}}>
          {tabs.map(t=><button key={t.id} onClick={()=>setUnlockTab(t.id)}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:2,padding:'8px 18px',cursor:'pointer',border:unlockTab===t.id?'2px solid '+t.color:'1px solid rgba(100,65,15,0.4)',borderRadius:6,background:unlockTab===t.id?t.color+'22':'transparent',color:unlockTab===t.id?t.color:'#8a6a30',textTransform:'uppercase',transition:'all 0.15s'}}>
            {t.emoji} {t.name}
          </button>)}
        </div>
        {/* GRID 5x5 with arrows */}
        <div style={{display:'flex',alignItems:'center',gap:16,flex:1,width:'100%',maxWidth:1200,justifyContent:'center'}}>
          <button onClick={()=>setUnlockPage_(p=>Math.max(0,p-1))} disabled={unlockPage===0}
            style={{fontSize:36,color:unlockPage>0?'#e8a820':'#333',background:'none',border:'none',cursor:unlockPage>0?'pointer':'default',padding:'10px',flexShrink:0}}>◀</button>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,flex:1,maxWidth:1200,alignContent:'start'}}>
            {pageItems.map((item,idx)=>(
              <div key={item.id} style={{background:item.done?'rgba(20,12,4,0.7)':'rgba(10,6,2,0.5)',border:item.done?'1px solid '+(item.color||'rgba(160,100,25,0.5)'):'1px solid rgba(160,120,40,0.3)',borderRadius:10,padding:'20px 14px',textAlign:'center',opacity:item.done?1:0.7,transition:'all 0.2s',position:'relative'}}
                onMouseEnter={()=>{if(item.card)setUnlockHover({card:item.card,idx})}}
                onMouseLeave={()=>setUnlockHover(null)}>
                <div style={{fontSize:64,filter:item.done?'none':'brightness(0.6)',marginBottom:6}}>{item.emoji}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:item.done?(item.color||'#e8a820'):'#c8a040',lineHeight:1.2,marginBottom:4}}>{item.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:item.done?'#c0a060':'#aa8a50',lineHeight:1.3}}>{item.sub}</div>
                {item.pct!==undefined&&!item.done&&<div style={{height:6,background:'rgba(20,12,4,0.8)',borderRadius:3,marginTop:6,overflow:'hidden'}}><div style={{height:'100%',width:item.pct+'%',background:'linear-gradient(90deg,#8a2200,#e8a820)',borderRadius:3}}/></div>}
                {/* Card tooltip */}
                {unlockHover&&unlockHover.idx===idx&&unlockHover.card&&(()=>{
                  const c=unlockHover.card
                  const bc=c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
                  return <div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',width:280,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'2px solid '+bc,borderRadius:10,padding:'16px',zIndex:100,pointerEvents:'none',boxShadow:'0 8px 30px rgba(0,0,0,0.9)'}}>
                    <div style={{height:5,background:bc,borderRadius:'5px 5px 0 0',marginBottom:10,marginTop:-16,marginLeft:-16,marginRight:-16}}/>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:bc,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>{c.type}</div>
                      <div style={{width:30,height:30,borderRadius:'50%',background:c.embers>0?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#fff'}}>{c.embers}</div>
                    </div>
                    <div style={{fontSize:44,textAlign:'center',marginBottom:8}}>{c.emoji}</div>
                    <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,color:'#e8d090',textAlign:'center',marginBottom:4,letterSpacing:1}}>{c.name}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:bc,textAlign:'center',letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>{c.rarity}{c.shopOnly?' · SHOP ONLY':''}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#c8b080',textAlign:'center',lineHeight:1.5,fontStyle:'italic'}}>{c.effect}</div>
                  </div>
                })()}
              </div>
            ))}
          </div>
          <button onClick={()=>setUnlockPage_(p=>Math.min(totalPages-1,p+1))} disabled={unlockPage>=totalPages-1}
            style={{fontSize:36,color:unlockPage<totalPages-1?'#e8a820':'#333',background:'none',border:'none',cursor:unlockPage<totalPages-1?'pointer':'default',padding:'10px',flexShrink:0}}>▶</button>
        </div>
        {/* PAGE INDICATOR */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#c8a040',letterSpacing:2}}>
          Page {unlockPage+1} of {totalPages} · {items.filter(i=>i.done).length} / {items.length} {unlockTab==='combos'?'discovered':'unlocked'}
        </div>
        <button onClick={()=>setMenuView(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:4,color:'#cc1111',background:'rgba(80,0,0,0.2)',border:'2px solid #881111',borderRadius:6,padding:'10px 40px',cursor:'pointer'}}>← Back</button>
      </div>
    )}
    // Rules screen
    if(menuView==='rules')return(
      <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.98)',display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'40px 20px',overflowY:'auto'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,color:'#cc1111',textShadow:'0 0 30px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>Rules</div>
        <div style={{maxWidth:800,width:'100%',display:'flex',flexDirection:'column',gap:12}}>
          {[
            ['🎸 The Goal','Build a metal band and fight through 9 Circles of Hell. Defeat Lucifer to win.'],
            ['⚔ Strikes','You get 4 Strikes per fight. Play cards from your hand, then Strike to deal damage.'],
            ['↓ Discards','You get 4 Discards per fight. Select cards and discard to cycle for better ones.'],
            ['🔥 Embers','Cards cost Embers to play. You refill Embers each Strike. Manage them wisely.'],
            ['🌿 Stash','Your currency. Earned from victories, spent in the shop on packs, cards, artifacts, and drugs.'],
            ['💀 Too Stoned','When a member hits 0 HP, they go Too Stoned and cannot attack. Lose all members = game over.'],
            ['🌀 Corruption','A risk/reward axis. Some cards raise it for power. Overdrive needs 60%+. Seance heals more at high corruption.'],
            ['⛓ Mentor Link','Place a Foil/Mythic/Demonic member LEFT of a basic member with the same ROLE for a damage multiplier. E.g. Foil Lead Guitarist → basic Lead Guitarist.'],
            ['🍄 The Dealer','Buy shrooms or acid in the shop. Use before your first Strike for powerful (or disastrous) effects.'],
            ['🏆 Score','Every run earns score. Lifetime score unlocks new cards, members, and artifacts permanently.'],
          ].map(([title,desc],i)=><div key={i} style={{background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:8,padding:'14px 20px'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'#e8a820',marginBottom:6}}>{title}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,color:'#c8b080',lineHeight:1.5}}>{desc}</div>
          </div>)}
        </div>
        <button onClick={()=>setMenuView(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'#cc1111',background:'rgba(80,0,0,0.2)',border:'2px solid #881111',borderRadius:6,padding:'12px 48px',cursor:'pointer',marginTop:8}}>← Back</button>
      </div>
    )

    // Options screen
    if(menuView==='options')return(
      <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.98)',display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'60px 20px',overflowY:'auto'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,color:'#cc1111',textShadow:'0 0 30px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>Options</div>
        <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:500,width:'100%'}}>
          {[
            ['Scanlines','vst_scanlines',scanlines],
            ['Screen Shake','vst_shake',localStorage.getItem('vst_shake')!=='off'],
            ['Card Hover Zoom','vst_hoverzoom',localStorage.getItem('vst_hoverzoom')!=='off'],
            ['Damage Numbers','vst_dmgnums',localStorage.getItem('vst_dmgnums')!=='off'],
          ].map(([label,key,on])=>(
            <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>{label}</span>
              <button onClick={()=>{localStorage.setItem(key,on?'off':'on');setMenuView('options')}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:on?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(on?'#44cc44':'#cc4444'),borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{on?'ON':'OFF'}</button>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>Combat Speed</span>
            <button onClick={()=>{const cur=localStorage.getItem('vst_speed')||'normal';localStorage.setItem('vst_speed',cur==='normal'?'fast':'normal');setMenuView('options')}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#e8a820',background:'rgba(0,0,0,0.4)',border:'1px solid #c87820',borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{(localStorage.getItem('vst_speed')||'normal').toUpperCase()}</button>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>Music Volume</span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="range" min="0" max="1" step="0.05" value={musicVol}
                onChange={e=>setMusicVolume(e.target.value)}
                style={{width:120,accentColor:'#e8a820',cursor:'pointer'}}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#aa8030',minWidth:36,textAlign:'right'}}>{Math.round(musicVol*100)}%</span>
            </div>
          </div>
          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>Sound Effects</span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="range" min="0" max="1" step="0.05" value={sfxVol}
                onChange={e=>{const v=parseFloat(e.target.value);setSfxVol(v);localStorage.setItem('vst_sfx_vol',v)}}
                style={{width:120,accentColor:'#e8a820',cursor:'pointer'}}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#aa8030',minWidth:36,textAlign:'right'}}>{Math.round(sfxVol*100)}%</span>
            </div>
          </div>
          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>Screen Shake</span>
            <button onClick={()=>{const nv=!shakeEnabled;setShakeEnabled(nv);localStorage.setItem('vst_shake',nv?'on':'off')}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:shakeEnabled?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(shakeEnabled?'#44cc44':'#cc4444'),borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{shakeEnabled?'ON':'OFF'}</button>
          </div>
          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(40,5,5,0.4)',border:'1px solid rgba(180,40,40,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#cc4444'}}>Reset All Progress</span>
            <button onClick={()=>{if(confirm('This will erase ALL progress, scores, achievements, and unlocks. Are you sure?')){localStorage.clear();window.location.reload()}}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#cc4444',background:'rgba(80,0,0,0.2)',border:'1px solid #cc4444',borderRadius:4,padding:'8px 24px',cursor:'pointer'}}>RESET</button>
          </div>
        </div>
        <button onClick={()=>setMenuView(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'#cc1111',background:'rgba(80,0,0,0.2)',border:'2px solid #881111',borderRadius:6,padding:'12px 48px',cursor:'pointer',marginTop:16}}>← Back</button>
      </div>
    )

    // Main menu
    return(
      <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(2,1,0,0.99)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0,overflow:'hidden'}}>
        {/* Background logo — large, subtle */}
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',opacity:0.08}}>
          <img src={import.meta.env.BASE_URL+"vestibule_logo.png"} alt="" style={{width:972,height:972,objectFit:'contain'}}/>
        </div>
        {/* Scanlines */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.015) 2px,rgba(255,255,255,0.015) 4px)',zIndex:1}}/>
        {/* Content */}
        <div style={{position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>

          {/* Title */}
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:192,color:'#cc1111',textShadow:'0 0 60px rgba(200,0,0,0.8),0 0 120px rgba(150,0,0,0.4),4px 4px 0 #000',letterSpacing:12,lineHeight:1}}>Vestibule</div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:36,color:'#8a6a40',fontStyle:'italic',letterSpacing:6,marginBottom:24}}>A roguelite descent through the 9 Circles of Hell</div>

          {/* Stats row */}
          <div style={{display:'flex',gap:20,marginBottom:16}}>
            {lt>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#aa8a50',letterSpacing:2}}>LIFETIME: {lt.toLocaleString()}</div>}
            {(totalRunsPlayed||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#aa8a50',letterSpacing:2}}>RUNS: {totalRunsPlayed}</div>}
            {streak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#ff6600',letterSpacing:2}}>🔥 {streak} DAY STREAK</div>}
            {(personalBest||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#aa8030',letterSpacing:2}}>BEST: {personalBest.toLocaleString()}</div>}
          </div>

          {/* PLAY button — HUGE */}
          <button onClick={()=>setGameState('booster')}
            style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:63,letterSpacing:10,color:'#ee2222',
              background:'rgba(120,0,0,0.25)',border:'3px solid #aa0000',borderRadius:10,
              padding:'28px 140px',cursor:'pointer',textTransform:'uppercase',
              textShadow:'0 0 30px rgba(220,0,0,0.7)',
              boxShadow:'0 0 50px rgba(180,0,0,0.3)',
              animation:'throb 2s ease-in-out infinite',transition:'all 0.2s',marginBottom:16}}>
            {getStakeUnlocks().includes('demonic')&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:'#ff0044',textShadow:'0 0 20px rgba(255,0,68,0.6),0 0 40px rgba(255,0,68,0.3)',letterSpacing:6,marginBottom:8,animation:'throb 3s ease-in-out infinite'}}>⛧ GOD KILLER ⛧</div>}
            ⛧ Enter the Vestibule ⛧
          </button>

          {/* Menu buttons row */}
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>setMenuView('unlocks')}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'#e8a820',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(200,140,30,0.5)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              🔓 Unlocks ({earned.length}/77)
            </button>
            <button onClick={()=>setMenuView('rules')}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'#c8a060',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(160,120,40,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              📜 Rules
            </button>
            <button onClick={()=>setMenuView('options')}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'#8a7a50',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(120,100,50,0.3)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              ⚙ Options
            </button>
          </div>

          {/* Stake + Deck selection */}
          <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:10,alignItems:'center'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#c8a040',letterSpacing:3,textTransform:'uppercase'}}>Difficulty Stake</div>
            <div style={{display:'flex',gap:8}}>
              {STAKES.map((sk,i)=>{
                const unlocked=getUnlockedStakes().some(u=>u.id===sk.id)
                const active=activeStakeId===sk.id
                return <div key={sk.id} onClick={()=>{if(unlocked){setActiveStakeId(sk.id);localStorage.setItem('vst_active_stake',sk.id)}}}
                  style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,
                    color:active?'#000':unlocked?sk.color:'#8a7a40',
                    background:active?sk.color:'rgba(20,12,4,0.6)',
                    border:'2px solid '+(unlocked?sk.color:'rgba(60,40,15,0.3)'),
                    borderRadius:6,padding:'8px 16px',cursor:unlocked?'pointer':'default',
                    opacity:unlocked?1:0.35,letterSpacing:1,transition:'all 0.15s',
                    boxShadow:active?'0 0 16px '+sk.color+'66':'none'}}>
                  {unlocked?sk.name:'🔒'}
                </div>
              })}
            </div>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:14,color:activeStake.color,fontStyle:'italic',textAlign:'center',maxWidth:500}}>{activeStake.desc}{activeStake.scoreMult>1?' Score ×'+activeStake.scoreMult:''}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#aa8a50',letterSpacing:2}}>DECK: Demo Deck</div>
          </div>
        </div>
      </div>
    )
  }

  // VICTORY CINEMATIC — renders above ALL screens
  if(victoryCinematic)return(
    <div style={{width:1920,height:1080,position:'relative',background:'#000',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      {/* Phase 1: Screen cracks */}
      {victoryCinematic.phase>=1&&<div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:victoryCinematic.phase>=2?0.3:0.8,transition:'opacity 2s'}}>
        <svg viewBox="0 0 1920 1080" style={{width:'100%',height:'100%'}}><g stroke="#cc1111" strokeWidth="2" fill="none" opacity="0.7">
          <path d="M960 0 L940 200 L900 350 L850 500 L800 540 L700 600"/><path d="M960 0 L980 180 L1020 380 L1080 500 L1150 580"/>
          <path d="M940 200 L800 250 L650 300"/><path d="M980 180 L1100 220 L1250 280"/>
          <path d="M900 350 L750 400 L600 500"/><path d="M1020 380 L1200 420 L1350 500"/>
          <path d="M850 500 L700 700 L600 900 L550 1080"/><path d="M1080 500 L1200 700 L1350 900 L1400 1080"/>
          <path d="M800 540 L500 650 L300 800 L100 1080"/><path d="M1150 580 L1400 680 L1600 820 L1800 1080"/>
        </g></svg>
      </div>}
      {/* Phase 2: THE DEVIL IS DEAD */}
      {victoryCinematic.phase>=2&&<div style={{animation:'fadeIn 1.5s ease',textAlign:'center'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:110,color:'#cc1111',textShadow:'0 0 60px rgba(200,0,0,0.8),0 0 120px rgba(150,0,0,0.5),0 0 200px rgba(100,0,0,0.3),4px 4px 0 #000',letterSpacing:12,lineHeight:1}}>⛧ THE DEVIL IS DEAD ⛧</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:32,color:'#e8d090',marginTop:16,animation:'fadeIn 2s ease 0.5s both',fontStyle:'italic',textShadow:'0 0 20px rgba(200,160,60,0.5)'}}>Your band survived the 9 Circles of Hell</div>
      </div>}
      {/* Phase 3: Band members rise */}
      {victoryCinematic.phase>=3&&<div style={{display:'flex',gap:24,marginTop:20,animation:'fadeIn 1s ease'}}>
        {victoryCinematic.bandNames.map((name,i)=>(
          <div key={i} style={{textAlign:'center',animation:'fadeIn 0.5s ease '+(i*0.3)+'s both'}}>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:26,color:'#ffd700',textShadow:'0 0 20px rgba(255,215,0,0.6)',letterSpacing:2}}>{name}</div>
            <div style={{fontSize:10,color:'#ffd700',marginTop:4}}>★</div>
          </div>
        ))}
      </div>}
      {/* Phase 4: Stake unlocked + click to continue */}
      {victoryCinematic.phase>=4&&<div style={{animation:'fadeIn 1s ease',textAlign:'center',marginTop:24}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'#e8a820',letterSpacing:4,textShadow:'0 0 20px rgba(200,140,0,0.6)'}}>⛧ {victoryCinematic.stakeName.toUpperCase()} CONQUERED ⛧</div>
        {STAKE_UNLOCKS[victoryCinematic.stakeId]&&<div style={{marginTop:16,animation:'fadeIn 0.8s ease 0.3s both'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#aa8040',letterSpacing:2}}>REWARD UNLOCKED</div>
          <div style={{fontSize:56,marginTop:8,filter:'drop-shadow(0 0 20px '+STAKE_UNLOCKS[victoryCinematic.stakeId].color+')'}}>{STAKE_UNLOCKS[victoryCinematic.stakeId].emoji}</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:32,color:STAKE_UNLOCKS[victoryCinematic.stakeId].color,marginTop:4,textShadow:'0 0 20px '+STAKE_UNLOCKS[victoryCinematic.stakeId].color+'66'}}>{STAKE_UNLOCKS[victoryCinematic.stakeId].name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#c8a060',marginTop:6,fontStyle:'italic'}}>{STAKE_UNLOCKS[victoryCinematic.stakeId].desc}</div>
        </div>}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#c8a040',marginTop:16,fontStyle:'italic',cursor:'pointer'}} onClick={()=>{setVictoryCinematic(null);setWelcomeToHell('choice')}}>Click anywhere to continue</div>
      </div>}
      {victoryCinematic.phase>=4&&<div style={{position:'absolute',inset:0,cursor:'pointer'}} onClick={()=>{setVictoryCinematic(null);setWelcomeToHell('choice')}}/>}
    </div>
  )

  // WELCOME TO HELL — choice, cutscene, fight
  if(welcomeToHell==='choice')return(
    <div style={{width:1920,height:1080,position:'relative',background:'#0a0604',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 80%,rgba(40,20,5,0.4),transparent)',pointerEvents:'none'}}/>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:26,color:'#aa8a50',fontStyle:'italic',textAlign:'center',maxWidth:700}}>Your band escaped Hell. But someone is waiting at the gate.</div>
      <div style={{width:200,height:3,background:'linear-gradient(90deg,transparent,#c8a040,transparent)',margin:'8px 0'}}/>
      <div style={{fontSize:80,marginBottom:8}}>🕴</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#c8a060',textAlign:'center',maxWidth:700,lineHeight:1.6,fontStyle:'italic'}}>
        "Congratulations. Truly impressive. But per your contract, you owe us one more album. Care to... renegotiate?"
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#c0a050',textAlign:'center',marginTop:4}}>— The Executive</div>
      <div style={{display:'flex',gap:30,marginTop:24}}>
        <button onClick={()=>{
          setWelcomeToHell('shopping')
          setShopCards(genShopCards(9))
          setBoosterPacks(genBoosterPacks(9))
          setRecruitPack(genRecruitPack(26))
          setShroomsInStock(Math.random()<0.50)
          setAcidInStock(Math.random()<0.50)
          setShopBoughtIds([]);setShopSoldIds([]);setCircleCartBought(false);setCirCleCpasBought(false)
          setGameState('shop')
        }}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,letterSpacing:4,padding:'16px 40px',background:'rgba(130,0,0,0.4)',border:'2px solid #cc1111',borderRadius:6,color:'#ee2222',cursor:'pointer',textShadow:'0 0 14px rgba(200,0,0,0.6)',boxShadow:'0 0 25px rgba(180,0,0,0.4)',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,0,0,0.5)';e.currentTarget.style.boxShadow='0 0 40px rgba(200,0,0,0.6)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(130,0,0,0.4)';e.currentTarget.style.boxShadow='0 0 25px rgba(180,0,0,0.4)'}}>
          ⛧ ENTER WELCOME TO HELL ⛧
        </button>
        <button onClick={()=>{setWelcomeToHell(null);setGameState('end')}}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:3,padding:'16px 32px',background:'transparent',border:'1px solid #554422',borderRadius:6,color:'#886644',cursor:'pointer',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='#c8a040';e.currentTarget.style.borderColor='#c8a040'}}
          onMouseLeave={e=>{e.currentTarget.style.color='#886644';e.currentTarget.style.borderColor='#554422'}}>
          Walk Away — End Run
        </button>
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#aa8a50',marginTop:12,fontStyle:'italic'}}>Your Lucifer victory is already saved. No penalty for losing.</div>
    </div>
  )

  if(welcomeToHell==='cutscene')return(
    <div style={{width:1920,height:1080,position:'relative',background:'#050302',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'#cc1111',textShadow:'0 0 40px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:10}}>WELCOME TO HELL</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:28,color:'#e8d090',fontStyle:'italic'}}>The Second Album</div>
      <div style={{fontSize:100,marginTop:16}}>🕴</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#aa8a50',letterSpacing:2}}>THE EXECUTIVE — 100,000 HP</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#c0a050',fontStyle:'italic'}}>The real Devil wears a suit.</div>
      <div style={{width:300,height:6,background:'rgba(200,0,0,0.3)',borderRadius:3,marginTop:12,overflow:'hidden'}}>
        <div style={{height:'100%',background:'#cc1111',animation:'loadBar 2.5s ease-in-out forwards',width:0}}/>
      </div>
    </div>
  )

  if(gameState==='booster')return <BoosterScreen onComplete={startGame} seed={runSeed}/>
  if(gameState==='circleSplash'&&circleSplash)return(
    <div style={{width:1920,height:1080,position:'relative',background:'#020100',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(180,0,0,0.03) 2px,rgba(180,0,0,0.03) 4px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 30%,rgba(80,0,0,0.4) 100%)',pointerEvents:'none'}}/>
      <div style={{fontSize:120,filter:'drop-shadow(0 0 40px rgba(200,0,0,0.6))',animation:'throb 1s ease-in-out infinite'}}>{circleSplash.circleEmoji}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#cc4444',letterSpacing:6,textTransform:'uppercase',animation:'fadeIn 0.5s ease'}}>Entering</div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'#cc1111',textShadow:'0 0 40px rgba(200,0,0,0.7),0 0 80px rgba(150,0,0,0.4),3px 3px 0 #000',letterSpacing:6,animation:'fadeIn 0.8s ease',textAlign:'center'}}>Circle {circleSplash.circleName}</div>
      <div style={{width:200,height:2,background:'linear-gradient(90deg,transparent,#cc2222,transparent)',animation:'fadeIn 1.2s ease'}}/>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'#aa6644',fontStyle:'italic',animation:'fadeIn 1.5s ease'}}>Descend deeper into Hell...</div>
    </div>
  )
  if(gameState==='descent'&&descentData)return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,overflow:'hidden'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,color:'#cc1111',textShadow:'0 0 40px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>⛧ The Descent ⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:39,color:'#e8d090',fontStyle:'italic'}}>Circle {descentData.circleName} {descentData.circleEmoji}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#e8d090',letterSpacing:2,fontWeight:900}}>Choose your path. Skipping a fight forfeits its shop.</div>
      <div style={{display:'flex',gap:30,marginTop:10}}>
        {descentData.fights.map((enemy,i)=>{
          const isBoss=i===2
          const isSkipped=descentData.skips.includes(i)
          const reward=i===0?descentData.reward1:i===1?descentData.reward2:null
          const canSkip=!isBoss
          const triggerDescend=()=>{playSfx('descent');
            const addToDeck=(card)=>{setDeck(p=>[...p,card])}
            const deleteRandomCommon=()=>{setDeck(p=>{const commons=p.filter(c=>c.rarity==='Common');if(commons.length===0){addLog('🗑 No common cards in deck to delete.');return p};const victim=commons[Math.floor(Math.random()*commons.length)];addLog('🗑 Skipped fight: Deleted '+victim.name+' from deck');return p.filter(c=>c.uid!==victim.uid)})}
            const gs={setStash,setStage,setCorruption,setMaxEmbers,setPendingDraw,setBonusDiscards,setBonusEmbers,setNextCardFree,addToDeck,deleteRandomCommon,addLog}
            if(descentData.skips.includes(0))descentData.reward1.apply(gs)
            if(descentData.skips.includes(1))descentData.reward2.apply(gs)
            const skips=descentData.skips
            const baseIdx=descentData.fightIndices[0]
            let startFight=baseIdx
            if(skips.includes(0)&&skips.includes(1))startFight=baseIdx+2
            else if(skips.includes(0))startFight=baseIdx+1
            overrideFightIdxRef.current=startFight
            setDescentData(null)
            setGameState('playing')
            skipDescentRef.current=true
            setTimeout(()=>{handleShopLeave();skipDescentRef.current=false},50)
          }
          return(
            <div key={i} style={{width:300,display:'flex',flexDirection:'column',gap:0,transition:'all 0.25s',opacity:isSkipped?0.5:1}}>
              {/* FIGHT label — clickable to proceed */}
              <div onClick={isSkipped?undefined:triggerDescend}
                style={{background:isSkipped?'rgba(40,80,20,0.3)':isBoss?'rgba(160,0,0,0.4)':'rgba(130,0,0,0.3)',border:isSkipped?'2px solid #44aa44':isBoss?'2px solid #cc1111':'2px solid rgba(200,80,80,0.5)',borderBottom:'none',borderRadius:'10px 10px 0 0',padding:'10px 16px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',color:isSkipped?'#44aa44':isBoss?'#ff4444':'#ee4444',textShadow:isBoss?'0 0 14px rgba(200,0,0,0.6)':'none',cursor:isSkipped?'default':'pointer'}}>{isSkipped?'✓ SKIPPED':isBoss?'★ BOSS FIGHT':'⚔ FIGHT'}</div>
              {/* Enemy card — clickable to proceed */}
              <div onClick={isSkipped?undefined:triggerDescend}
                style={{background:isBoss?'linear-gradient(180deg,#2a0a0a,#140404)':'linear-gradient(180deg,#1a1008,#0a0604)',
                border:isSkipped?'2px solid #44aa44':isBoss?'2px solid #cc1111':'2px solid rgba(200,80,80,0.5)',borderTop:'1px solid rgba(255,255,255,0.05)',borderBottom:canSkip&&!isSkipped?'none':isBoss?'none':'2px solid rgba(200,80,80,0.5)',
                borderRadius:(!canSkip&&!isBoss)||(isSkipped&&!canSkip)?'0 0 10px 10px':0,padding:'16px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:6,
                cursor:isSkipped?'default':'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{if(!isSkipped)e.currentTarget.style.background=isBoss?'linear-gradient(180deg,#3a1010,#1a0808)':'linear-gradient(180deg,#2a1810,#140c08)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=isBoss?'linear-gradient(180deg,#2a0a0a,#140404)':'linear-gradient(180deg,#1a1008,#0a0604)'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:isBoss?'#cc1111':'#c8a040',letterSpacing:3,textTransform:'uppercase'}}>{isBoss?'CIRCLE BOSS':'FIGHT '+(i+1)+' OF 3'}</div>
                <div style={{fontSize:48}}>{enemy.emoji}</div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:isBoss?'#ee2222':'#e8d090',textShadow:isBoss?'0 0 20px rgba(200,0,0,0.5)':'none',letterSpacing:2}}>{enemy.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#aa8040'}}>{Math.ceil(enemy.maxHp*activeStake.hpMult)} HP</div>
                {isSkipped&&reward&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#88dd88',marginTop:4}}>{reward.emoji} {reward.name}</div>}
              </div>
              {/* SKIP button — stopPropagation so it doesn't trigger fight */}
              {canSkip&&!isSkipped&&reward&&(
                <div onClick={(e)=>{e.stopPropagation();setDescentData(p=>({...p,skips:[...p.skips,i]}))}}
                  style={{background:'rgba(40,80,20,0.3)',border:'2px solid #44aa44',borderTop:'none',borderRadius:'0 0 10px 10px',padding:'12px 16px',cursor:'pointer',textAlign:'center',transition:'all 0.2s',position:'relative'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(60,120,30,0.5)';e.currentTarget.style.transform='scale(1.02)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(40,80,20,0.3)';e.currentTarget.style.transform='none'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#44aa44',letterSpacing:3,textTransform:'uppercase'}}>SKIP AND TAKE REWARD</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#88dd88',marginTop:4}}>{reward.emoji} {reward.name}</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#66aa66',marginTop:4,fontStyle:'italic',lineHeight:1.3}}>{REWARD_TIPS[reward.id]||''}</div>
                </div>
              )}
              {canSkip&&isSkipped&&(
                <div onClick={(e)=>{e.stopPropagation();setDescentData(p=>({...p,skips:p.skips.filter(s=>s!==i)}))}}
                  style={{background:'rgba(40,80,20,0.15)',border:'2px solid #44aa44',borderTop:'none',borderRadius:'0 0 10px 10px',padding:'8px 16px',cursor:'pointer',textAlign:'center'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(80,40,20,0.3)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(40,80,20,0.15)'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#886644',letterSpacing:2}}>UNDO SKIP</div>
                </div>
              )}
              {isBoss&&(
                <div onClick={triggerDescend}
                  style={{background:'rgba(130,0,0,0.35)',border:'2px solid #cc1111',borderTop:'none',borderRadius:'0 0 10px 10px',padding:'12px 16px',textAlign:'center',cursor:'pointer',transition:'all 0.2s',boxShadow:'0 0 15px rgba(180,0,0,0.3)'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,0,0,0.5)';e.currentTarget.style.boxShadow='0 0 30px rgba(200,0,0,0.6)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(130,0,0,0.35)';e.currentTarget.style.boxShadow='0 0 15px rgba(180,0,0,0.3)'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#ee2222',letterSpacing:4,textShadow:'0 0 14px rgba(200,0,0,0.6)'}}>⛧ DESCEND ⛧</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
  if(gameState==='pact')return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,overflow:'hidden'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:'#e8a820',textShadow:'0 0 40px rgba(200,140,0,0.6),0 0 80px rgba(150,100,0,0.3),3px 3px 0 #000',letterSpacing:8}}>⛧ The Pact ⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'#aa9060',fontStyle:'italic'}}>Choose your reward. The other is lost to the Void.</div>
      <div style={{display:'flex',gap:40,marginTop:16}}>
        {pactChoices.filter(Boolean).map(pact=>(
          <div key={pact.id} onClick={()=>{
            setChosenPacts(p=>[...p,pact.id])
            // Apply immediate pact effects
            if(pact.id==='ember_surge')setMaxEmbers(p=>{const n=Math.min(MAX_EMBERS_CAP,p+1);setEmbers(n);return n})
            if(pact.id==='iron_strings')setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,permAtkBonus:(m.permAtkBonus||0)+1}):m))
            if(pact.id==='thick_skin')setStage(prev=>prev.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+3,hp:m.hp+3}):m))
            if(pact.id==='war_drums')setStrikesLeft(p=>p)  // handled in strike reset via chosenPacts check
            if(pact.id==='sixth_slot')setStage(prev=>prev.length<6?[...prev,null]:prev)
            playSfx('pact');addLog('⛧ Pact chosen: '+pact.emoji+' '+pact.name)
            setGameState('campfire')
          }}
            style={{width:280,background:'linear-gradient(180deg,#1a1008,#0a0604)',border:'2px solid rgba(200,140,20,0.5)',borderRadius:10,padding:'30px 24px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:12,
              transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-8px) scale(1.05)';e.currentTarget.style.borderColor=pact.color;e.currentTarget.style.boxShadow='0 8px 40px '+pact.color+'44'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='rgba(200,140,20,0.5)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.8)'}}>
            <div style={{fontSize:64,filter:`drop-shadow(0 0 20px ${pact.color})`}}>{pact.emoji}</div>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:pact.color,textShadow:`0 0 20px ${pact.color}66`,textAlign:'center',letterSpacing:2}}>{pact.name}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#c8b080',textAlign:'center',lineHeight:1.5}}>{pact.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={()=>setGameState('campfire')}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:4,color:'#666',background:'rgba(40,20,5,0.4)',border:'1px solid #444',borderRadius:6,padding:'10px 32px',cursor:'pointer',marginTop:16,transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.color='#aa8040';e.currentTarget.style.borderColor='#aa8040'}}
        onMouseLeave={e=>{e.currentTarget.style.color='#666';e.currentTarget.style.borderColor='#444'}}>
        ⛧ Skip — Keep What You Have ⛧</button>
    </div>
  )
  if(gameState==='campfire'){
    const allDeckCards=[...deck,...discardPile]
    const uniqueUpgradeable=allDeckCards.filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i).filter(c=>!c.consumable&&CARD_UPGRADES[c.id]&&!upgradedCards.includes(c.id))
    return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'24px 40px',overflow:'hidden'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:50,color:'#ff8800',textShadow:'0 0 40px rgba(255,120,0,0.6),0 0 80px rgba(200,80,0,0.3),3px 3px 0 #000',letterSpacing:6}}>The Doom Forge</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'#cc9050',fontStyle:'italic'}}>Every riff can be heavier.</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#887040',letterSpacing:2}}>UPGRADES THIS RUN: {upgradedCards.length}</div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',maxWidth:1700,overflowY:'auto',flex:1,padding:'10px 0',alignContent:'flex-start'}}>
        {uniqueUpgradeable.map(c=>{
          const up=CARD_UPGRADES[c.id]
          const bc=c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
          const hasHp=up.hp&&up.hpAmt
          return <div key={c.id} onClick={()=>{
            setUpgradedCards(p=>[...p,c.id])
            setDeck(p=>p.map(dc=>dc.id===c.id?Object.assign({},dc,{upgraded:true,name:(dc.name||'').replace(/\+$/,'')+'+'}):dc))
            setDiscardPile(p=>p.map(dc=>dc.id===c.id?Object.assign({},dc,{upgraded:true,name:(dc.name||'').replace(/\+$/,'')+'+'}):dc))
            if(hasHp){
              const alive=stage.filter(m=>m&&!m.tooStoned)
              if(up.hp==='all')setStage(prev=>prev.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+up.hpAmt,hp:m.hp+up.hpAmt}):m))
              else if(up.hp==='target'&&alive.length>0){const t=alive.reduce((a,b)=>a.atk>b.atk?a:b);setStage(prev=>prev.map(m=>m&&m.uid===t.uid?Object.assign({},m,{maxHp:m.maxHp+up.hpAmt,hp:m.hp+up.hpAmt}):m))}
              else if(up.hp==='weakest'&&alive.length>0){const w=alive.reduce((a,b)=>a.hp<b.hp?a:b);setStage(prev=>prev.map(m=>m&&m.uid===w.uid?Object.assign({},m,{maxHp:m.maxHp+up.hpAmt,hp:m.hp+up.hpAmt}):m))}
              else if(up.hp==='hurt'){setStage(prev=>prev.map(m=>m&&!m.tooStoned&&m.hp<m.maxHp?Object.assign({},m,{maxHp:m.maxHp+up.hpAmt,hp:m.hp+up.hpAmt}):m))}
              else if(up.hp==='random'&&alive.length>0){const r=alive[Math.floor(Math.random()*alive.length)];setStage(prev=>prev.map(m=>m&&m.uid===r.uid?Object.assign({},m,{maxHp:m.maxHp+up.hpAmt,hp:m.hp+up.hpAmt}):m))}
            }
            playSfx('buy');addLog('Doom Forge: '+c.name+'+ forged!')
            setGameState('shop')
          }} style={{width:240,background:'linear-gradient(180deg,#1a1008,#0a0604)',border:'2px solid '+bc+'88',borderRadius:10,padding:'0 0 14px',cursor:'pointer',transition:'all 0.2s',position:'relative'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.borderColor='#ffd700';e.currentTarget.style.boxShadow='0 6px 25px rgba(200,150,0,0.3)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor=bc+'88';e.currentTarget.style.boxShadow='none'}}>
            <div style={{height:5,background:bc,borderRadius:'10px 10px 0 0'}}/>
            <div style={{fontSize:52,textAlign:'center',padding:'14px 0'}}>{c.emoji}</div>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:20,color:'#ffd700',textAlign:'center',letterSpacing:1}}>{c.name}+</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,textAlign:'center',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>{c.type} {c.rarity}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#c8b080',textAlign:'center',lineHeight:1.5,padding:'0 12px'}}>{up.desc}</div>
            {hasHp&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#44cc44',textAlign:'center',marginTop:6,fontWeight:900}}>+{up.hpAmt} MAX HP ({up.hp})</div>}
          </div>
        })}
        {uniqueUpgradeable.length===0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'#886644',fontStyle:'italic',padding:40}}>All cards already upgraded!</div>}
      </div>
      <button onClick={()=>setGameState('shop')}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:4,color:'#666',background:'rgba(40,20,5,0.4)',border:'1px solid #444',borderRadius:6,padding:'10px 32px',cursor:'pointer',flexShrink:0,transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.color='#cc8040';e.currentTarget.style.borderColor='#cc8040'}}
        onMouseLeave={e=>{e.currentTarget.style.color='#666';e.currentTarget.style.borderColor='#444'}}>
        Skip Upgrade</button>
    </div>
  )}
  if(demonicConflict)return <DemonicConflictScreen conflict={demonicConflict} onChoice={handleDemonicChoice}/>
  if(gameState==='recruit')return <RecruitScreen candidates={recruitCandidates} stage={stage} onPick={handleRecruitPick} onPass={handleRecruitPass} onFireMember={handlePawnSellMember} stash={stash}/>
  if(gameState==='shop')return <ShopScreen stash={stash} onSpend={handleShopSpend} onLeave={handleShopLeave} circleArtifact={circleArtifact} circlePassive={circlePassive} recruitPack={recruitPack} shopCards={shopCards} boosterPacks={boosterPacks} rerollCost={rerollCost} onReroll={handleReroll} fightIndex={fightIndex} activeArtifacts={activeArtifacts} activePassives={activePassives} starterArtifacts={STARTER_ARTIFACTS} starterPassives={STARTER_PASSIVES} stage={stage} deck={deck} discardPile={discardPile} onPawnSellMember={handlePawnSellMember} onPawnSellCard={handlePawnSellCard} onPawnBurnCard={handlePawnBurnCard} soldIds={shopSoldIds} onMarkSold={(id)=>setShopSoldIds(p=>[...p,id])} circleCartBought={circleCartBought} circleCpasBought={circleCpasBought} onBuyCart={()=>setCircleCartBought(true)} onBuyCpas={()=>setCirCleCpasBought(true)} heldShrooms={heldShrooms} heldAcid={heldAcid} shroomsInStock={shroomsInStock} acidInStock={acidInStock} onBuyShrooms={()=>setHeldShrooms(p=>p+1)} onBuyAcid={()=>setHeldAcid(p=>p+1)}/>
  if(gameState==='end')return <div style={{width:1920,height:1080,position:'relative'}}><EndScreen won={won} cause={deathCause} enemy={enemy} stats={stats} seed={runSeed} onReset={handleReset} streakWins={streakWins} streakLosses={streakLosses} totalRuns={totalRunsPlayed} isDailyRun={isDailyRun} onDailyChallenge={()=>{setRunSeed(getDailySeed());setIsDailyRun(true);handleReset()}} personalBest={personalBest} dailyStreak={dailyStreak} lifetimeScore={lifetimeScore} discovered={discovered} newAchievements={newAchievements} enemyHp={enemyHp} stage={stage}/></div>

  return(
    <div style={{width:1920,height:1080,display:'flex',flexDirection:'column',background:'var(--void)',overflow:'hidden',position:'relative',userSelect:'none',transform:shakeOffset.x||shakeOffset.y?`translate(${shakeOffset.x}px,${shakeOffset.y}px)`:'none'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:8000,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px,transparent 4px,transparent 7px,rgba(0,0,0,0.10) 7px,rgba(0,0,0,0.10) 8px,transparent 8px,transparent 14px,rgba(0,0,0,0.04) 14px,rgba(0,0,0,0.04) 15px)',animation:'vhsDrift 8s ease-in-out infinite',mixBlendMode:'overlay'}}/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:8001,animation:'vhsLine 12s linear infinite',background:'transparent'}}/>
      {damageFlash&&<div style={{position:'absolute',inset:0,zIndex:8500,pointerEvents:'none',background:'radial-gradient(ellipse at center,rgba(200,0,0,0.25),rgba(100,0,0,0.4))',animation:'flashFade 0.4s ease-out forwards'}}/>}
      {corruptHigh&&!corruptMax&&<div style={{position:'absolute',inset:0,zIndex:7999,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 40%,rgba(100,0,0,0.15) 100%)',animation:bgPulseAnim}}/>}
      {corruptMax&&<div style={{position:'absolute',inset:0,zIndex:7999,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 20%,rgba(140,0,0,0.3) 100%)',animation:'bgPulse 1s ease-in-out infinite'}}/>}
      {floats.filter(Boolean).map(f=><Float key={f.id} v={f.v} x={f.x} y={f.y} color={f.color} big={f.big} onDone={()=>remFloat(f.id)}/>)}
      {projectiles.filter(Boolean).map(p=><Projectile key={p.id} from={p.from} to={p.to} emoji={p.emoji} onDone={()=>setProjectiles(prev=>prev.filter(x=>x.id!==p.id))}/>)}
      {showDice&&diceTarget&&<DiceRoll target={diceTarget} onDone={()=>setShowDice(false)}/>}
      {hellquakeAnim&&<div style={{position:'absolute',inset:0,zIndex:9500,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20,background:'rgba(0,0,0,0.85)',animation:'fadeIn 0.1s ease'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.04) 3px,rgba(255,255,255,0.04) 4px)',animation:'interlaceFlicker 0.08s steps(1) infinite',pointerEvents:'none'}}/>
        <div style={{fontSize:120,animation:'throb 0.3s ease-in-out infinite',filter:`drop-shadow(-4px 0 rgba(255,0,0,0.8)) drop-shadow(4px 0 rgba(0,80,255,0.8))`}}>⛧</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:hellquakeAnim.color,textShadow:`-3px 0 rgba(255,0,0,0.8), 3px 0 rgba(0,80,255,0.7), 0 0 60px ${hellquakeAnim.color},0 0 120px ${hellquakeAnim.color}`,animation:'fadeIn 0.3s ease'}}>{hellquakeAnim.text}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:26,color:'rgba(255,255,255,0.9)',textAlign:'center',maxWidth:600,fontStyle:'italic',textShadow:'0 0 20px rgba(0,0,0,0.9)',animation:'fadeIn 0.5s ease',padding:'0 40px',lineHeight:1.5}}>{hellquakeAnim.desc}</div>
      </div>}
      {/* TRIP EFFECT OVERLAY */}
      {activeTripEffect&&<div style={{position:'absolute',inset:0,zIndex:9600,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,background:'rgba(0,0,0,0.88)',animation:'fadeIn 0.15s ease'}}>
        <div style={{fontSize:100,animation:'throb 0.4s ease-in-out infinite',filter:`drop-shadow(0 0 40px ${activeTripEffect.color})`}}>{activeTripEffect.type==='shrooms'?'🍄':'🧪'}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:activeTripEffect.color,textShadow:`0 0 40px ${activeTripEffect.color},0 0 80px ${activeTripEffect.color}`,animation:'fadeIn 0.3s ease'}}>{activeTripEffect.name}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:24,color:'rgba(255,255,255,0.9)',textAlign:'center',maxWidth:600,fontStyle:'italic',textShadow:'0 0 20px rgba(0,0,0,0.9)',animation:'fadeIn 0.5s ease',padding:'0 40px',lineHeight:1.5}}>{activeTripEffect.desc}</div>
      </div>}
      {/* LUCIFER CINEMATIC OVERLAY */}
      {luciferCinematic&&<div style={{position:'absolute',inset:0,zIndex:9700,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20,background:'rgba(0,0,0,0.92)',animation:'fadeIn 0.2s ease'}}>
        <div style={{fontSize:120,animation:'throb 0.4s ease-in-out infinite',filter:'drop-shadow(0 0 40px rgba(0,100,255,0.8))'}}>
          {luciferCinematic.phase===2?'😈':'🧊'}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,color:luciferCinematic.phase===2?'#ff3300':'#44ccff',
          textShadow:luciferCinematic.phase===2?'0 0 40px rgba(255,0,0,0.8),0 0 80px rgba(200,0,0,0.5)':'0 0 40px rgba(60,180,255,0.8),0 0 80px rgba(0,100,200,0.5)',
          animation:'fadeIn 0.3s ease'}}>⛧ {luciferCinematic.text} ⛧</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,color:'#fff',textShadow:'0 0 20px rgba(0,0,0,0.9)',animation:'fadeIn 0.6s ease'}}>
          {luciferCinematic.phase===2?'Phase 2: Satan, Lord of the Flies':'420,666 → '+luciferCinematic.hp+' HP'}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'rgba(255,255,255,0.7)',fontStyle:'italic',animation:'fadeIn 0.8s ease'}}>
          {luciferCinematic.phase===2?'Band fully restored. All strikes reset. Finish this.':'8 Circle Bosses defeated. Their echoes weaken the Devil.'}</div>
      </div>}
      {/* CLUTCH FLASH */}
      {clutchFlash&&<div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9250,pointerEvents:'none',fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:clutchFlash.color,textShadow:'0 0 40px '+clutchFlash.color+',0 0 80px '+clutchFlash.color+'66,4px 4px 0 #000',letterSpacing:8,animation:'popFloat 2.5s ease-out forwards',textAlign:'center'}}>{clutchFlash.text}</div>}
      {/* BOSS HP MILESTONE FLASH */}
      {milestoneFlash&&<div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9200,pointerEvents:'none',fontFamily:"'BogartsMetalFont',cursive",fontSize:90,color:milestoneFlash.color,textShadow:'0 0 40px '+milestoneFlash.color+',0 0 80px '+milestoneFlash.color+'66,4px 4px 0 #000',letterSpacing:10,animation:'popFloat 1.8s ease-out forwards'}}>{milestoneFlash.text}</div>}
      {/* DECK / DISCARD VIEWER */}
      {(deckViewOpen||discardViewOpen)&&<div style={{position:'absolute',inset:0,zIndex:9600,background:'rgba(2,1,4,0.95)',display:'flex',flexDirection:'column',alignItems:'center',padding:'30px 40px',overflowY:'auto'}} onClick={()=>{setDeckViewOpen(false);setDiscardViewOpen(false)}}>
        <div onClick={e=>e.stopPropagation()} style={{maxWidth:1200,width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:deckViewOpen?'#c8a040':'#cc4444',textShadow:'0 0 20px '+(deckViewOpen?'rgba(200,160,40,0.4)':'rgba(200,40,40,0.4)')}}>{deckViewOpen?'⛧ Deck — '+deck.length+' Cards':'⛧ Discard Pile — '+discardPile.length+' Cards'}</div>
            <div onClick={()=>{setDeckViewOpen(false);setDiscardViewOpen(false)}} style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#cc4444',cursor:'pointer',padding:'6px 16px',border:'1px solid #aa2222',borderRadius:4}}>✕ Close</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            {(deckViewOpen?[...deck].sort((a,b)=>(a.name||'').localeCompare(b.name||'')):discardPile).filter(Boolean).map((c,i)=>{
              const bc=c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
              return <div key={c.uid||i} style={{width:120,background:'linear-gradient(180deg,#201408,#100804)',border:'1px solid '+bc+'88',borderRadius:5,padding:'0 0 8px'}}>
                <div style={{height:3,background:bc,borderRadius:'5px 5px 0 0'}}/>
                <div style={{fontSize:30,textAlign:'center',padding:'8px 0',background:'rgba(0,0,0,0.3)'}}>{c.emoji}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:700,color:'#eedfc0',textAlign:'center',padding:'0 4px'}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:bc,textAlign:'center',letterSpacing:1,textTransform:'uppercase'}}>{c.type} · {c.rarity}</div>
                {c.embers>0&&<div style={{display:'flex',justifyContent:'center',marginTop:2}}><div style={{width:18,height:18,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'1px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,color:'#fff'}}>{c.embers}</div></div>}
              </div>
            })}
            {(deckViewOpen?deck:discardPile).length===0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'#886644',fontStyle:'italic',padding:40}}>{deckViewOpen?'Deck is empty — all cards in hand or discard.':'Discard pile is empty.'}</div>}
          </div>
        </div>
      </div>}
      {/* RIFF CHAIN COMBO FLASH */}
      {comboFlash&&<div style={{position:'absolute',inset:0,zIndex:9600,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8}}>
        <div style={{position:'absolute',inset:0,border:`3px solid ${comboFlash.color}`,animation:'fadeIn 0.1s ease',opacity:0.8,boxShadow:`inset 0 0 60px ${comboFlash.color}44,0 0 40px ${comboFlash.color}44`}}/>
        <div style={{fontSize:80,filter:`drop-shadow(0 0 30px ${comboFlash.color})`,animation:'throb 0.3s ease-in-out infinite'}}>{comboFlash.emoji}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:comboFlash.color,textShadow:`0 0 40px ${comboFlash.color},0 0 80px ${comboFlash.color}66,3px 3px 0 #000`,letterSpacing:8,animation:'fadeIn 0.2s ease'}}>⛧ RIFF CHAIN ⛧</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'#fff',textShadow:`0 0 20px ${comboFlash.color},3px 3px 0 #000`,letterSpacing:6,animation:'fadeIn 0.4s ease'}}>{comboFlash.name}</div>
      </div>}
      {/* CIRCLE CLEARED FLASH */}

      {circleClearedData&&<div style={{position:'absolute',inset:0,zIndex:9750,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:0,background:'rgba(0,0,0,0.94)',animation:'fadeIn 0.3s ease'}}>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',opacity:0.06}}>
          <img src={import.meta.env.BASE_URL+"vestibule_logo.png"} alt="" style={{width:864,height:864,objectFit:'contain'}}/>
        </div>
        <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <div style={{fontSize:100,filter:'drop-shadow(0 0 30px rgba(200,0,0,0.6))',animation:'throb 0.6s ease-in-out infinite'}}>{circleClearedData.bossEmoji}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:6,color:'#aa4444',textTransform:'uppercase'}}>Defeated</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:'#cc2222',textShadow:'0 0 40px rgba(200,0,0,0.7),3px 3px 0 #000',textAlign:'center',lineHeight:1}}>{circleClearedData.bossName}</div>
          <div style={{width:200,height:2,background:'linear-gradient(90deg,transparent,#cc2222,transparent)',margin:'8px 0'}}/>
          {circleClearedData.isBoss&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#e8a820',textShadow:'0 0 30px rgba(200,150,0,0.6),0 0 60px rgba(150,100,0,0.3),3px 3px 0 #000',animation:'fadeIn 0.8s ease'}}>⛧ Circle {circleClearedData.circleName} Cleared ⛧</div>}
          {circleClearedData.isBoss&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#ff6600',letterSpacing:3,marginTop:8,animation:'fadeIn 1.2s ease'}}>+1 MAX EMBERS</div>}
          {circleClearedData.loot&&<div style={{marginTop:12,padding:'12px 24px',background:'rgba(200,150,0,0.12)',border:'1px solid rgba(200,150,0,0.4)',borderRadius:8,animation:'fadeIn 1.6s ease',display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:40}}>{circleClearedData.loot.emoji}</div>
            <div>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,color:'#ffd700',letterSpacing:2}}>{circleClearedData.loot.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#c8b080'}}>{circleClearedData.loot.desc}</div>
            </div>
          </div>}
          {circleClearedData.isBoss&&circleClearedData.circle<9&&(()=>{
            const nc=circleClearedData.circle+1
            const nextEnemies=[ENEMIES[nc*3-3],ENEMIES[nc*3-2],ENEMIES[nc*3-1]]
            return <div style={{marginTop:16,animation:'fadeIn 2s ease',textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#cc4444',letterSpacing:3,textTransform:'uppercase'}}>Circle {CIRCLE_NAMES[nc]} Awaits</div>
              <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:6}}>
                {nextEnemies.filter(Boolean).map(e=><div key={e.id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#886644'}}>
                  {e.emoji} {Math.ceil(e.maxHp*activeStake.hpMult)} HP
                </div>)}
              </div>
            </div>
          })()}
        </div>
      </div>}
      {remasterOpen&&<RemasterModal cards={remasterCards} onConfirm={(delUids,copyUid)=>{
        setDeck(prev=>{
          const copyCard=prev.find(c=>c.uid===copyUid)||remasterCards.find(c=>c.uid===copyUid)
          const filtered=prev.filter(c=>!delUids.includes(c.uid))
          if(copyCard){const newCopy=Object.assign({},copyCard,{uid:uid()});filtered.push(newCopy)}
          return filtered
        })
        setRemasterOpen(false)
        addLog('🎙 Remastered: deleted 2, copied 1.')
      }} onClose={()=>setRemasterOpen(false)}/>}
      {setlistOpen&&<SetlistModal hand={setlistCards} onConfirm={(discardUid)=>{
        setHand(prev=>prev.filter(c=>c.uid!==discardUid))
        setDiscardPile(prev=>[...prev,...setlistCards.filter(c=>c.uid===discardUid)])
        setSetlistOpen(false)
        addLog('📋 Setlist locked in.')
      }} onClose={()=>setSetlistOpen(false)}/>}
      {/* PARCHMENT */}
      <div style={{flex:1,margin:'0',borderRadius:'4px 4px 0 0',position:'relative',overflow:'visible',zIndex:10,background:'linear-gradient(168deg,#cbb872 0%,#bfa85a 20%,#c8b060 40%,#baa050 60%,#c4a85c 80%,#b89e50 100%)',border:`2px solid ${corruptMax?'#660000':corruptHigh?'#7a2010':'#7a5820'}`,boxShadow:`inset 0 0 60px rgba(60,35,5,0.6),0 0 30px rgba(0,0,0,0.95)${corruptHigh?',0 0 60px rgba(120,0,0,0.3)':''}${corruptMax?',0 0 100px rgba(180,0,0,0.5)':''}`,filter:parchmentFilter,display:'flex',flexDirection:'column'}}>
        <div style={{position:'absolute',inset:5,border:'1px solid rgba(80,50,10,0.28)',pointerEvents:'none',zIndex:10,borderRadius:2}}/>
        <div style={{padding:'8px 16px 6px',position:'relative',zIndex:5,display:'flex',justifyContent:'center',borderBottom:'1px solid rgba(60,35,5,0.3)',flexShrink:0}}>
          <div style={{width:'100%',maxWidth:950,background:'rgba(8,0,0,0.55)',border:'2px solid rgba(160,20,0,0.8)',borderRadius:8,padding:'0',overflow:'hidden',animation:'bossGlow 2s ease-in-out infinite',boxShadow:'0 0 30px rgba(150,0,0,0.4),inset 0 0 40px rgba(80,0,0,0.3)'}}>
            <BossSection enemy={enemy} currentHp={enemyHp} isWiggling={isWiggling} innerRef={bossRef} debuff={bossDebuff} chromaStr={chromaStr} dblRoll={dblRoll}/>
          </div>
        </div>
        <div style={{position:'relative',zIndex:5,background:'rgba(20,11,3,0.42)',borderTop:'2px solid rgba(60,35,5,0.45)',flex:1,display:'flex',flexDirection:'column',justifyContent:'center',overflow:'visible'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'3px 16px 1px'}}>
            <div style={{flex:1,height:1,background:'rgba(60,35,5,0.2)'}}/>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:10,color:'#8a6838',opacity:.4,fontStyle:'italic',letterSpacing:4}}>— stage —</div>
            <div style={{flex:1,height:1,background:'rgba(60,35,5,0.2)'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:stage.length>5?16:50,padding:stage.length>5?'0px 10px 0px 100px':'0px 10px 0px 130px',justifyContent:'center',flex:1,position:'relative'}}>
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
              <div key={i} style={{position:'relative'}}>
                {m&&memberBuffs[m.uid]&&memberBuffs[m.uid].length>0&&<div style={{position:'absolute',top:-4,left:'50%',transform:'translateX(-50%)',zIndex:90,display:'flex',flexDirection:'column-reverse',alignItems:'center',gap:2,pointerEvents:'none'}}>
                  {memberBuffs[m.uid].map((b,bi)=><div key={bi} style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:b.color,textShadow:'0 0 8px '+b.color+'88,1px 1px 0 #000',letterSpacing:1,whiteSpace:'nowrap',animation:'fadeIn 0.3s ease'}}>{b.text}</div>)}
                </div>}
                <StageSlot member={m} slotIdx={i}
                isAttacking={animPhase==='attacking'&&m&&!m.tooStoned}
                isDiceTarget={diceTarget&&m&&diceTarget.id===m.id}
                innerRef={function(el){stageRefs.current[i]={current:el}}}
                onDragStart={function(){if(m)setDragStageIdx(i)}}
                onDragOver={function(){}}
                onDrop={function(){handleStageDrop(i)}}
                bondColor={m?getBondColor(m,stage):null}
                mentorState={m&&m.mentorLinkedToUid?(m.mentorAlive?'active':'broken'):m&&m.isMentor&&stage[i+1]&&stage[i+1].mentorLinkedToUid===m.uid&&!m.tooStoned?'mentor':null}
                corruption={corruption}
              />
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'1px 20px 2px',position:'relative',zIndex:5,flexShrink:0,borderTop:'1px solid rgba(60,35,5,0.18)',background:'rgba(10,6,2,0.28)'}}>
          {/* PHASE BANNER — left side, absolute so it never shifts center content */}
          <div style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:3,textTransform:'uppercase',
            color:phaseBanner==='play'?'#c8a040':phaseBanner==='strike'?'#ee2222':'#ff4444',
            textShadow:phaseBanner==='play'?'none':'0 0 12px '+(phaseBanner==='strike'?'rgba(220,0,0,0.6)':'rgba(255,60,60,0.6)'),
            transition:'color 0.2s',opacity:0.9}}>
            {phaseBanner==='play'?'⚔ PLAY CARDS':phaseBanner==='strike'?'💥 STRIKING!':'👿 BOSS ATTACKS'}
          </div>
          {(()=>{
            const act=stage.filter(m=>m&&!m.tooStoned)
            let dmg=act.filter(m=>m.role!=='Drummer').reduce((s,m)=>{
              let effAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/15):m.atk
              if(chosenPacts.includes('clean_living')&&corruption<15)effAtk+=3
              if(m.encoreReady)effAtk*=2
              return s+effAtk
            },0)
            for(let _mi=0;_mi<stage.length-1;_mi++){const _mn=stage[_mi],_bs=stage[_mi+1];if(!_mn||!_bs||_mn.tooStoned||_bs.tooStoned)continue;if(_mn.isMentor&&_bs.mentorLinkedToUid===_mn.uid&&_bs.mentorAlive){const _em=_bs.mentorMult+(activeStake.mentorBonus||0);const _ma=_mn.keyword==='CORRUPT'?_mn.atk+Math.floor(corruption/15):_mn.atk;const _ba=_bs.keyword==='CORRUPT'?_bs.atk+Math.floor(corruption/15):_bs.atk;dmg+=Math.round((_ma+_ba)*(_em-1))}}
            const dbl=act.some(m=>m.role==='Drummer')
            if(dbl)dmg*=2
            const buf=act.filter(m=>(m.buffCount||0)>0).length
            const bon=buf>=5?1.35:buf>=4?1.20:buf>=3?1.10:1
            dmg=Math.floor(dmg*bon)
            if(activeGenre==='RIFF_METAL')dmg=Math.round(dmg*1.15)
            if(activeGenre==='DOOM_METAL'&&discardsLeft>=MAX_DISCARDS)dmg+=act.length*2
            const fin=strikeMult>1.0?Math.round(dmg*strikeMult):dmg
            return <>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:27,color:'#c8a060',fontWeight:900,textShadow:'0 0 10px rgba(200,160,60,0.6)'}}>Combined Attack</span>
              <span key={fin} style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,color:'#cc1111',textShadow:'0 0 20px rgba(180,0,0,0.8)',animation:'attackPulse 0.5s ease-out',display:'inline-block'}}>{fin}</span>
              {bon>1&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#e8a820',letterSpacing:1}}>+{Math.round((bon-1)*100)}% SYNERGY</span>}
              <span style={{color:'#e8a820',fontSize:18,textShadow:'0 0 8px rgba(200,160,60,0.5)'}}>⟶</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:27,color:'#c8a060',fontWeight:700}}>{enemy.name}</span>
              {chosenPacts.length>0&&<div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4}}>
                {chosenPacts.filter(Boolean).map(pid=>{const p=PACT_REWARDS.find(r=>r.id===pid);return p?<div key={pid} style={{position:'relative',cursor:'help'}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-pacttip]');if(t)t.style.display='block'}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-pacttip]');if(t)t.style.display='none'}}>
                  <div style={{width:24,height:24,borderRadius:4,background:'rgba(0,0,0,0.6)',border:`1px solid ${p.color}66`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{p.emoji}</div>
                  <div data-pacttip="" style={{display:'none',position:'absolute',bottom:'120%',right:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(200,140,30,0.6)',borderRadius:6,padding:'8px 12px',zIndex:9999,pointerEvents:'none',minWidth:180,boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:p.color,marginBottom:3}}>{p.emoji} {p.name}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#c8b080',lineHeight:1.4}}>{p.desc}</div>
                  </div>
                </div>:null})}
              </div>}
            </>
          })()}
        </div>
      </div>

      {/* HAND AREA */}
      <div style={{flex:'0 0 340px',width:1920,maxWidth:1920,background:'rgba(0,0,0,0.90)',borderTop:'1px solid rgba(100,55,10,0.5)',position:'relative',zIndex:30}}>
        {/* Header */}
        <div style={{textAlign:'center',padding:'3px 0 0',position:'relative',zIndex:1,minHeight:16}}>
          {pendingEmbers>0&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#ff6600'}}>+{pendingEmbers} 🔥 pending</span>}
        </div>

        {/* LEFT COLUMN: Deck/Discard — absolute */}
        <div style={{position:'absolute',left:0,top:0,bottom:0,zIndex:60,display:'flex',flexDirection:'column',gap:6,alignItems:'center',justifyContent:'center',background:'rgba(20,12,4,0.7)',borderRadius:'0 6px 6px 0',padding:'8px 10px',border:'1px solid rgba(100,65,15,0.3)',borderLeft:'none',width:100}}>
          <DeckPile count={deck.length} label="Deck" onClick={()=>setDeckViewOpen(true)} cards={deck}/>
          <DeckPile count={discardPile.length} label="Discard" onClick={()=>setDiscardViewOpen(true)} cards={discardPile}/>
        </div>

        {/* SORT + DEALER — beside left column */}
        <div style={{position:'absolute',left:108,top:8,bottom:8,zIndex:60,display:'flex',flexDirection:'column',gap:3,alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'relative'}}
            onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='block'}}
            onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='none'}}>
            <button onClick={()=>{if(heldShrooms&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight)activateTrip('shrooms')}}
              style={{width:90,padding:'5px 8px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',
                background:heldShrooms&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'rgba(80,40,10,0.7)':'rgba(10,6,2,0.85)',
                border:heldShrooms&&!tripUsedThisFight?'2px solid #cc8800':'1px solid rgba(100,65,15,0.3)',
                borderRadius:3,color:heldShrooms&&!tripUsedThisFight?'#ffcc44':'#4a3018',
                cursor:heldShrooms&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'pointer':'not-allowed',
                opacity:heldShrooms?1:0.4,textAlign:'center'}}>🍄 {heldShrooms?'USE':'—'}</button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(200,150,50,0.6)',borderRadius:6,padding:'10px 14px',zIndex:9999,pointerEvents:'none',minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#e8a820',marginBottom:6}}>🍄 Magic Mushrooms</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#c8b080',lineHeight:1.5}}>{heldShrooms?'Use before your first Strike. 90% chance of a powerful buff — +2 ATK all, bonus Strike, cheaper cards, or full heal. 5% nothing. 5% bad trip.':'Buy from The Dealer in the shop.'}</div>
            </div>
          </div>
          <div style={{position:'relative'}}
            onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='block'}}
            onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='none'}}>
            <button onClick={()=>{if(heldAcid&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight)activateTrip('acid')}}
              style={{width:90,padding:'5px 8px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',
                background:heldAcid&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'rgba(40,10,80,0.7)':'rgba(10,6,2,0.85)',
                border:heldAcid&&!tripUsedThisFight?'2px solid #aa44ff':'1px solid rgba(100,65,15,0.3)',
                borderRadius:3,color:heldAcid&&!tripUsedThisFight?'#cc88ff':'#4a2a6a',
                cursor:heldAcid&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'pointer':'not-allowed',
                opacity:heldAcid?1:0.4,textAlign:'center'}}>🧪 {heldAcid?'USE':'—'}</button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(150,50,220,0.6)',borderRadius:6,padding:'10px 14px',zIndex:9999,pointerEvents:'none',minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#cc44ff',marginBottom:6}}>🧪 Blotter Acid</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#c8b080',lineHeight:1.5}}>{heldAcid?'Use before your first Strike. 90% chance of a game-changing effect — double damage, cards fire twice, +3 ATK all, or total immunity. 5% nothing. 5% Hellquake.':'Buy from The Dealer in the shop.'}</div>
            </div>
          </div>
          <div style={{flex:1,minHeight:20}}/>
          <button onClick={()=>setHandSort(p=>p==='embers'?'none':'embers')}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'5px 8px',width:90,background:handSort==='embers'?'rgba(200,120,20,0.45)':'rgba(10,6,2,0.85)',border:handSort==='embers'?'1px solid #e8a820':'1px solid rgba(100,65,15,0.5)',borderRadius:3,color:handSort==='embers'?'#e8a820':'#7a5a30',cursor:'pointer',textAlign:'center'}}>🔥 COST</button>
          <button onClick={()=>setHandSort(p=>p==='rarity'?'none':'rarity')}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:1,textTransform:'uppercase',padding:'5px 8px',width:90,background:handSort==='rarity'?'rgba(200,120,20,0.45)':'rgba(10,6,2,0.85)',border:handSort==='rarity'?'1px solid #e8a820':'1px solid rgba(100,65,15,0.5)',borderRadius:3,color:handSort==='rarity'?'#e8a820':'#7a5a30',cursor:'pointer',textAlign:'center'}}>⭐ RARITY</button>
        </div>

        {/* RIGHT COLUMN: Strike/Discard/Embers/Stats — absolute, clamped to right edge */}
        <div style={{position:'absolute',right:0,top:0,bottom:0,zIndex:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-evenly',padding:'8px 14px',background:'rgba(10,5,2,0.75)',borderRadius:'6px 0 0 6px',border:'1px solid rgba(100,65,15,0.3)',borderRight:'none',width:210}}>
          <div style={{width:'100%'}}>
            {strikeMult>1.0&&<div style={{textAlign:'center',marginBottom:6,padding:'4px 0',background:'rgba(255,100,0,0.15)',border:'1px solid rgba(255,100,0,0.5)',borderRadius:4}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#ff6600',letterSpacing:2,fontWeight:900}}>MULTIPLIER</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'#ff8800',textShadow:'0 0 16px rgba(255,120,0,0.6)',lineHeight:1}}>x{strikeMult.toFixed(2)}</div>
            </div>}
            <button onClick={handleStrike} disabled={!canStrike}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'10px 14px',background:canStrike?'rgba(130,0,0,0.45)':'rgba(25,12,5,0.4)',border:`2px solid ${canStrike?'#cc1111':'#2a1508'}`,borderRadius:4,color:canStrike?'#ee2222':'#3a1a08',cursor:canStrike?'pointer':'not-allowed',textShadow:canStrike?'0 0 14px rgba(200,0,0,0.6)':'none',boxShadow:canStrike?'0 0 22px rgba(130,0,0,0.3)':'none',transition:'all 0.15s',width:'100%'}}>⚔ Strike</button>
            <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'center',width:'100%',marginTop:4}}>
              <PhaseDots left={strikesLeft} total={activeStake.maxStrikes} color='#dd2222' wide={true}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:strikesLeft>0?'#dd2222':'#555'}}>{strikesLeft}/{activeStake.maxStrikes}</span>
            </div>
          </div>
          <div style={{width:'100%'}}>
            <button onClick={handleDiscard} disabled={!canDiscard}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'10px 14px',background:canDiscard?'rgba(100,70,0,0.4)':'rgba(25,15,5,0.4)',border:`2px solid ${canDiscard?'#cc9900':'#2a1a05'}`,borderRadius:4,color:canDiscard?'#f0c030':'#4a3010',cursor:canDiscard?'pointer':'not-allowed',textShadow:canDiscard?'0 0 14px rgba(220,160,0,0.6)':'none',boxShadow:canDiscard?'0 0 22px rgba(140,100,0,0.35)':'none',transition:'all 0.15s',width:'100%'}}>↓ Discard</button>
            <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'center',width:'100%',marginTop:4}}>
              <PhaseDots left={discardsLeft} total={MAX_DISCARDS} color='#e8a820' wide={true}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:discardsLeft>0?'#e8a820':'#555'}}>{discardsLeft}/{MAX_DISCARDS}</span>
            </div>
          </div>
          <EmberDisplayLarge current={embers} max={maxEmbers}/>
          <div style={{display:'flex',gap:14,justifyContent:'center',width:'100%'}}>
            {[['Fight',(fightIndex%3+1)+'/3','#dd2222'],['Corrupt',corruption>=100?'☠ '+corruption+'%':corruption+'%',corruption>=100?'#ff0000':corruption>60?'#ff3300':'#aa5500'],['Stash',stash+(stash>=420?' 🔒':stash>=380?' ⚠':''),(stash>=420?'#ff3300':stash>=380?'#ff9900':'#44cc44')]].map(function(item){return(
              <div key={item[0]} style={{textAlign:'center'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#9a7a40',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>{item[0]}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:item[2],lineHeight:1}}>{item[1]}</div>
              </div>
            )})}
          </div>
          {(()=>{
            const total=genreCounts.RIFF+genreCounts.CORRUPT+genreCounts.UTILITY+genreCounts.EMBER
            if(total<4)return null
            const pcts={RIFF:genreCounts.RIFF/total,CORRUPT:genreCounts.CORRUPT/total,UTILITY:genreCounts.UTILITY/total,EMBER:genreCounts.EMBER/total}
            const genres=[
              {type:'RIFF',name:'RIFF METAL',pct:pcts.RIFF,color:'#9933cc',bonus:'+15% RIFF damage'},
              {type:'CORRUPT',name:'BLACK METAL',pct:pcts.CORRUPT,color:'#cc44ff',bonus:'+25% corruption damage'},
              {type:'UTILITY',name:'PROG ROCK',pct:pcts.UTILITY,color:'#22aa44',bonus:'+1 card draw'},
              {type:'EMBER',name:'DOOM METAL',pct:pcts.EMBER,color:'#c87820',bonus:'+2 ATK (no discards)'},
            ]
            const active=genres.find(g=>g.pct>=0.5)
            const top=genres.reduce((a,b)=>a.pct>b.pct?a:b)
            return <div style={{width:'100%',borderTop:'1px solid rgba(100,65,15,0.3)',paddingTop:4,marginTop:2}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:active?active.color:'#c8a040',letterSpacing:1,textAlign:'center',fontWeight:active?900:400}}>
                {active?active.name+' ⚡':top.name+' '+Math.round(top.pct*100)+'%'}
              </div>
              {active&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:active.color,textAlign:'center',opacity:0.8}}>{active.bonus}</div>}
              <div style={{display:'flex',gap:1,marginTop:3,height:4,borderRadius:2,overflow:'hidden'}}>
                {genres.map(g=><div key={g.type} style={{flex:g.pct||0.01,background:g.color,opacity:g.pct>=0.5?1:0.4,transition:'all 0.3s'}}/>)}
              </div>
            </div>
          })()}
          {activePassives.length>0&&<div style={{width:'100%',borderTop:'1px solid rgba(80,60,160,0.3)',paddingTop:3}}>
            {activePassives.filter(Boolean).map((p,i)=><div key={i} style={{fontSize:10,color:'#8090c0',fontFamily:"'MBScribblesFont',serif",position:'relative',cursor:'help'}}
              onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-ptip]');if(t)t.style.opacity='1'}}
              onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-ptip]');if(t)t.style.opacity='0'}}>
              {p.emoji} {p.name}
              <div data-ptip="" style={{opacity:0,transition:'opacity 0.15s',position:'absolute',left:88,top:-10,zIndex:9999,pointerEvents:'none',minWidth:200,maxWidth:260,background:'rgba(12,7,2,0.97)',border:'1px solid rgba(80,60,180,0.5)',borderRadius:6,padding:'8px 10px',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:700,color:'#aa88ee',marginBottom:4}}>{p.emoji} {p.name}</div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:9,color:'#9a8050',fontStyle:'italic',lineHeight:1.4}}>{p.effect}</div>
              </div>
            </div>)}
          </div>}
        </div>

        {/* CARD FAN — centered, padded to avoid columns */}
        <div style={{position:'absolute',left:200,right:210,top:18,bottom:0,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:10,overflow:'visible',zIndex:50}}>
          {(handSort==='none'?hand:handSort==='embers'?[...hand].sort((a,b)=>b.embers-a.embers):[...hand].sort((a,b)=>({'Common':0,'Uncommon':1,'Rare':2}[b.rarity]||0)-({'Common':0,'Uncommon':1,'Rare':2}[a.rarity]||0))).filter(Boolean).map((card,i)=>(
            <HandCard key={card.uid} card={card} index={i} total={hand.length} isUsed={card.id==='stagedive'&&stageDiveUsed} lastRiffPlayed={card.id==='demotape'?lastRiffPlayed:null}
              isHovered={hovered===i} isSelected={selected.includes(card.uid)}
              anyHovered={hovered!==null}
              canAfford={card.embers===0||embers>=card.embers}
              isDragging={dragHandIdx===i} isShopBought={shopBoughtIds.includes(card.uid)}
              onHover={()=>setHovered(i)} onLeave={()=>setHovered(null)}
              onClick={()=>{if(card.id==='stagedive'&&stageDiveUsed)return;playSfx('select',0.5);setSelected(p=>p.includes(card.uid)?p.filter(x=>x!==card.uid):[...p,card.uid])}}
              onDragStart={()=>{setDragHandIdx(i);setDragCardUid(card.uid)}}
              onDragEnd={()=>{setDragHandIdx(null);setDragOverHandIdx(null);setDragCardUid(null)}}
              isDragOver={dragOverHandIdx===i&&dragHandIdx!==null&&dragHandIdx!==i}
              onHandDragOver={()=>{if(dragHandIdx!==null&&dragHandIdx!==i)setDragOverHandIdx(i)}}
              onHandDrop={()=>handleHandReorder(dragHandIdx,i)}
            />
          ))}
        </div>
      </div>
      {/* PAUSE OPTIONS OVERLAY (ESC key) */}
      {showPauseOptions&&<div style={{position:'absolute',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.85)'}} onClick={()=>setShowPauseOptions(false)}>
        <div onClick={e=>e.stopPropagation()} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'40px 60px',background:'rgba(10,6,2,0.98)',border:'2px solid rgba(100,65,15,0.5)',borderRadius:12,maxWidth:500,width:'90%'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:42,color:'#cc1111',textShadow:'0 0 20px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:6}}>Paused</div>
          <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%'}}>
            {[
              ['Scanlines','vst_scanlines',localStorage.getItem('vst_scanlines')!=='off'],
              ['Screen Shake','vst_shake',localStorage.getItem('vst_shake')!=='off'],
              ['Card Hover Zoom','vst_hoverzoom',localStorage.getItem('vst_hoverzoom')!=='off'],
              ['Damage Numbers','vst_dmgnums',localStorage.getItem('vst_dmgnums')!=='off'],
            ].map(([label,key,on])=>(
              <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>{label}</span>
                <button onClick={()=>{localStorage.setItem(key,on?'off':'on');setShowPauseOptions(false);setTimeout(()=>setShowPauseOptions(true),10)}}
                  style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:on?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(on?'#44cc44':'#cc4444'),borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{on?'ON':'OFF'}</button>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>Combat Speed</span>
              <button onClick={()=>{const cur=localStorage.getItem('vst_speed')||'normal';localStorage.setItem('vst_speed',cur==='normal'?'fast':'normal');setShowPauseOptions(false);setTimeout(()=>setShowPauseOptions(true),10)}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#e8a820',background:'rgba(0,0,0,0.4)',border:'1px solid #c87820',borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{(localStorage.getItem('vst_speed')||'normal').toUpperCase()}</button>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>Music Volume</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min="0" max="1" step="0.05" value={musicVol}
                  onChange={e=>setMusicVolume(e.target.value)}
                  style={{width:100,accentColor:'#e8a820',cursor:'pointer'}}/>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#aa8030',minWidth:30,textAlign:'right'}}>{Math.round(musicVol*100)}%</span>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>SFX Volume</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min="0" max="1" step="0.05" value={sfxVol}
                  onChange={e=>{const v=parseFloat(e.target.value);setSfxVol(v);localStorage.setItem('vst_sfx_vol',v)}}
                  style={{width:100,accentColor:'#e8a820',cursor:'pointer'}}/>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#aa8030',minWidth:30,textAlign:'right'}}>{Math.round(sfxVol*100)}%</span>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>Screen Shake</span>
              <button onClick={()=>{const nv=!shakeEnabled;setShakeEnabled(nv);localStorage.setItem('vst_shake',nv?'on':'off')}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:shakeEnabled?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(shakeEnabled?'#44cc44':'#cc4444'),borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{shakeEnabled?'ON':'OFF'}</button>
            </div>
          </div>
          <button onClick={()=>setShowPauseOptions(false)}
            style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,letterSpacing:4,color:'#ee2222',background:'rgba(120,0,0,0.25)',border:'2px solid #aa0000',borderRadius:8,padding:'12px 60px',cursor:'pointer',marginTop:8,animation:'throb 2s ease-in-out infinite'}}>Resume</button>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#555',letterSpacing:2,marginTop:4}}>Press ESC to close</div>
        </div>
      </div>}
    </div>
  )
}

// ── SCALE ROOT — fits game to any screen size ──────────────────
const DESIGN_W=1920,DESIGN_H=1080
function ScaleRoot(){
  const [scale,setScale]=useState(1)
  const [dims,setDims]=useState({w:DESIGN_W,h:DESIGN_H})
  useEffect(()=>{
    const calc=()=>{
      const vw=window.innerWidth,vh=window.innerHeight
      const s=Math.min(vw/DESIGN_W,vh/DESIGN_H)
      setScale(s)
      setDims({w:vw,h:vh})
    }
    calc()
    window.addEventListener('resize',calc)
    return()=>window.removeEventListener('resize',calc)
  },[])
  return(
    <div style={{width:'100vw',height:'100vh',overflow:'hidden',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:DESIGN_W,height:DESIGN_H,transform:`scale(${scale})`,transformOrigin:'center center',position:'relative'}}>
        <App/>
      </div>
    </div>
  )
}
export default ScaleRoot
