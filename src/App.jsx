
// ═══ TODO ═══
// ── 20 QoL IMPROVEMENTS (prioritized) ──
// [ ] 1. Damage preview on Strike button — show estimated total live
// [ ] 2. Ember forecast — hovering card dims pips to show remaining
// [ ] 3. Fight intro splash — "CIRCLE V — ANGER" + enemy name slam
// [ ] 4. Keyboard shortcuts — S=Strike, D=Discard, 1-6=select cards
// [ ] 5. Undo last card play — one-step within same strike
// [ ] 6. Hand size indicator — "6/6" turns gold at overcap
// [ ] 7. Victory fanfare — golden burst + VICTORY slam
// [ ] 8. Boss HP drain animation — smooth countdown
// [ ] 9. Stash change floats — "+5 🌿" on stash changes
// [ ] 10. Screen transitions — 0.3s crossfade between states
// [ ] 11. Card upgrade shimmer — persistent golden pulse on border
// [ ] 12. Pact icons in combat — small row top-left
// [ ] 13. Boss telegraph — "NEXT: 6 DMG to weakest" shown on boss
// [ ] 14. Card count remaining — "2 left in deck" on hover
// [ ] 15. End-of-fight summary — 2s popup with damage/cards/chains
// [ ] 16. Auto-sort preference — persist in localStorage
// [ ] 17. Bulk discard — select multiple then discard
// [ ] 18. Run timer — elapsed time on end screen
// [ ] 19. Corruption milestone audio — dark tones at 25/50/75/100%
// [ ] 20. "Why did I die?" tooltip — brief analysis on death screen
// [x] Tutorial system (3 scripted fights + tooltips + first-encounter tips)
// [x] QoL: gray borders unaffordable, chain badges, shop dimming
// [x] QoL: hide corruption thermometer at 0%, skip 0 ATK animations
// ── NEXT UP ──
// [ ] GHOST PREVIEW on drag — hovering a held card over a member shows
//     "+1 ATK" or "+2 HP" preview on that member BEFORE dropping.
//     Shows the RIGHT info at the RIGHT moment. Huge UX win.
// [ ] HAND AREA OVERHAUL — "cockpit" layout:
//     - DISCARD button (left panel) + remaining discards
//     - STRIKE button (right panel) + damage number + remaining strikes
//     - Cards centered with more breathing room
//     - Secondary stats (embers, deck, pile, stash) in slim bottom strip
//     - Embers as "🔥 4/7" number pair (scales to any max, not fixed pips)
// [ ] DECK PEEK — tap deck icon to see remaining cards sorted by type
//     Columns by type (RIFF/CORRUPT/UTILITY/EMBER) with color headers.
//     Summary counts at top: "RIFF: 12 | CORRUPT: 5 | UTILITY: 3"
//     Lets players calculate odds before discarding. No deck order shown.
// [ ] DISCARD/PLAYED HISTORY — tap discard pile icon to see chronological
//     list of cards played and discarded this fight. Most recent at top.
//     Labels: "Played on Strike 2" / "Discarded on Strike 1"
//     Helps players track what they have used and learn their patterns.
// [x] CARD BALANCE + 69-CARD DECK (all unlockables):
//     DECK: 69 cards (RIFF:32 CORRUPT:18 UTILITY:10 EMBER:9) — base 66 + 3 from unlockables
//     Move to shop-only: Sabbath Sigil, Overdrive, Going Broke, Remaster,
//       Controlled Feedback, Amp the Static, Feedback Loop, Double Down,
//       Stage Dive, Record Deal (rework to deck thinning)
//     BUFFS:
//       Dial to Eleven: +2 ATK, corruption +5% (was +10%) — half the risk
//       Smoke Break: +3 embers + DRAW 1 CARD (now replaces itself)
//       CORRUPT keyword: +1 ATK per 10% corruption (was /15) — clean math
//       Record Deal: rework to deck thinning (remove cards from deck for stash)
// [ ] Event audit: rework Sabbath Offering (chosen 1/10K games)
// [ ] Early game pacing — Circles I-IV too safe (2.1% deaths combined)
// ── IDEAS TO EXPLORE ──
// [ ] UNIFIED BATTLE AREA — merge boss + band into one zone:
//     - Remove boss box/divider, boss floats on shared background
//     - Concert poster boss layout (top to bottom):
//       CIRCLE III · FIGHT 2 OF 3        (tiny, dim, contextual)
//       THE FEASTER  ⚔6                  (big name + damage inline)
//       Heals 3 HP every time played     (colored by threat type)
//       🍖                                (large emoji, glowing)
//       ████████░░░░ 119/156 HP          (HP as fraction)
//     - Passive color-coded: purple=corruption, green=heal, red=damage
//     - Band members sit below on same background, no divider
//     - 2 zones (battle + hand) instead of 3
// [ ] ANIMATED BATTLE BACKGROUND — slow dark gradient shift:
//     - Deep crimson/purple/black, like embers glowing
//     - Shifts redder as corruption rises
//     - Pulses on chain triggers, fractures when boss near death
//     - CSS gradient animations (no canvas needed for v1)
// [ ] Reduce border noise — shadows instead of borders on member cards
// [ ] Rigid member card layout — ATK/HP/keyword always in same spot
// [ ] Corruption deck concept — special cards unlocked at thresholds
// [ ] Genre banner: only show at 40%+ threshold (reduce noise)
// [ ] Progressive rules screen (show only encountered mechanics)
// [ ] Run summary toast on death ("What killed you" highlight)
// ═══════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react'
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
  {id:'wanderer',tagline:'Could not even find the exit.',name:'The Wanderer',circle:'Circle I — Limbo',subtitle:'Fight 1 of 3',maxHp:140,baseDmg:4,emoji:'👤',passive:'A lost soul with no purpose. Attacks randomly.',passiveId:null},
  {id:'lostsoul',tagline:'You were lost before you started.',name:'The Lost Soul',circle:'Circle I — Limbo',subtitle:'Fight 2 of 3',maxHp:150,baseDmg:5,emoji:'💀',passive:'A stronger damned spirit. Hunger drives its blows.',passiveId:null},
  {id:'drifter',tagline:'110 HP and pure aggression.',name:'The Drifter',circle:'Circle I — Limbo',subtitle:'Circle Boss — Fight 3 of 3',maxHp:340,baseDmg:7,emoji:'👁',passive:'Pure relentless pressure.',passiveId:null},
  // ── CIRCLE II: LUST — Enemy buffs itself each strike ─────────
  {id:'siren',tagline:'She sang. You listened. You lost.',name:'The Siren',circle:'Circle II — Lust',subtitle:'Fight 1 of 3',maxHp:330,baseDmg:5,emoji:'🌊',passive:'Seductive. Gains +1 damage each Strike.',passiveId:'selfbuff'},
  {id:'tempter',tagline:'Temptation wins again.',name:'The Tempter',circle:'Circle II — Lust',subtitle:'Fight 2 of 3',maxHp:500,baseDmg:6,emoji:'🌹',passive:'Enthralling. Gains +1 damage each Strike. Starts stronger.',passiveId:'selfbuff'},
  {id:'lust_boss',tagline:'Irresistible to the end.',name:'The Seducer',circle:'Circle II — Lust',subtitle:'Circle Boss — Fight 3 of 3',maxHp:1300,baseDmg:7,emoji:'💋',passive:'Irresistible. Gains +2 damage each Strike. Dangerous if left alive.',passiveId:'selfbuff2'},
  // ── CIRCLE III: GLUTTONY — Heals when you play cards ─────────
  {id:'glutton',tagline:'It ate your strikes for breakfast.',name:'The Glutton',circle:'Circle III — Gluttony',subtitle:'Fight 1 of 3',maxHp:620,baseDmg:5,emoji:'🍖',passive:'Insatiable. Heals 3 HP every time a card is played.',passiveId:'cardHeal3b'},
  {id:'feaster',tagline:'Still hungry. Always hungry.',name:'The Feaster',circle:'Circle III — Gluttony',subtitle:'Fight 2 of 3',maxHp:840,baseDmg:6,emoji:'🦷',passive:'Voracious. Heals 5 HP every time a card is played.',passiveId:'cardHeal5'},
  {id:'gluttony_boss',tagline:'Everything gets devoured eventually.',name:'The Devourer',circle:'Circle III — Gluttony',subtitle:'Circle Boss — Fight 3 of 3',maxHp:2600,baseDmg:7,emoji:'🕳',passive:'Endless hunger. Heals 8 HP per card played. Strike fast.',passiveId:'cardHeal8'},
  // ── CIRCLE IV: GREED — Steals stash each strike ──────────────
  {id:'miser',tagline:'You could not afford to win.',name:'The Miser',circle:'Circle IV — Greed',subtitle:'Fight 1 of 3',maxHp:1100,baseDmg:4,emoji:'💰',passive:'Greedy. Steals 1🌿 from your Stash each Strike. Win to take it back.',passiveId:'stashSteal'},
  {id:'hoarder',tagline:'It had more patience than you.',name:'The Hoarder',circle:'Circle IV — Greed',subtitle:'Fight 2 of 3',maxHp:1650,baseDmg:5,emoji:'🪙',passive:'Avaricious. Steals 2🌿 per Strike. Your stash is its stash.',passiveId:'stashSteal2'},
  {id:'greed_boss',tagline:'Debt always comes due.',name:'The Usurer',circle:'Circle IV — Greed',subtitle:'Circle Boss — Fight 3 of 3',maxHp:4800,baseDmg:6,emoji:'🏦',passive:'Extracting. Steals 3🌿 per Strike. 666 HP of pure greed.',passiveId:'stashSteal3'},
  // ── CIRCLE V: ANGER — Hits harder the more you buff ─────────
  {id:'wrathful',tagline:'Your buffs fed its rage.',name:'The Wrathful',circle:'Circle V — Anger',subtitle:'Fight 1 of 3',maxHp:2800,baseDmg:5,emoji:'🔥',passive:'Enraged. +1 damage for each buffed member on your stage.',passiveId:'rageScale1'},
  {id:'berserker',tagline:'Fury without limit.',name:'The Berserker',circle:'Circle V — Anger',subtitle:'Fight 2 of 3',maxHp:4100,baseDmg:6,emoji:'⚔️',passive:'Furious. +1 damage per buffed member.',passiveId:'rageScale1'},
  {id:'anger_boss',tagline:'Strategy means nothing to rage.',name:'The Warlord',circle:'Circle V — Anger',subtitle:'Circle Boss — Fight 3 of 3',maxHp:8000,baseDmg:7,emoji:'💢',passive:'Explosive rage. +2 damage per buffed member.',passiveId:'rageScale2'},
  // ── CIRCLE VI: HERESY — Corrupts your corruption system ──────
  {id:'heretic',tagline:'Your soul is sufficiently corrupted now.',name:'The Heretic',circle:'Circle VI — Heresy',subtitle:'Fight 1 of 3',maxHp:6200,baseDmg:5,emoji:'🔱',passive:'Blasphemous. Each Strike raises your Corruption by 10%.',passiveId:'corruptPlayer'},
  {id:'apostate',tagline:'Corruption claimed another believer.',name:'The Apostate',circle:'Circle VI — Heresy',subtitle:'Fight 2 of 3',maxHp:9000,baseDmg:6,emoji:'⛧',passive:'Corrupting. Raises Corruption by 15% each Strike.',passiveId:'corruptPlayer15'},
  {id:'heresy_boss',tagline:'Even your chaos served its doctrine.',name:'The False Prophet',circle:'Circle VI — Heresy',subtitle:'Circle Boss — Fight 3 of 3',maxHp:14000,baseDmg:7,emoji:'📖',passive:'Toxic doctrine. Corruption +20% per Strike. Hellquake territory every fight.',passiveId:'corruptPlayer20'},
  // ── CIRCLE VII: VIOLENCE — Targets your healthiest member ────
  {id:'brute',tagline:'Your healthiest fell first.',name:'The Brute',circle:'Circle VII — Violence',subtitle:'Fight 1 of 3',maxHp:10500,baseDmg:6,emoji:'🗡️',passive:'Calculated. Always targets the member with highest HP.',passiveId:'targetHighestHp'},
  {id:'hunter',tagline:'Prey spotted. Prey eliminated.',name:'The Hunter',circle:'Circle VII — Violence',subtitle:'Fight 2 of 3',maxHp:15000,baseDmg:7,emoji:'🏹',passive:'Predatory. Targets highest HP member. Deals +50% damage to them.',passiveId:'targetHighestHp2'},
  {id:'violence_boss',tagline:'The sentence was carried out.',name:'The Executioner',circle:'Circle VII — Violence',subtitle:'Circle Boss — Fight 3 of 3',maxHp:22000,baseDmg:8,emoji:'🩸',passive:'Methodical. Targets highest HP and deals double damage. Protect your strongest.',passiveId:'targetHighestHp3'},
  // ── CIRCLE VIII: FRAUD — Shuffles your hand after each strike ──
  {id:'trickster',tagline:'You played right into its hands.',name:'The Trickster',circle:'Circle VIII — Fraud',subtitle:'Fight 1 of 3',maxHp:18000,baseDmg:6,emoji:'🃏',passive:'Deceptive. After each Strike, 1 random card in hand is discarded and replaced.',passiveId:'fraudShuffle'},
  {id:'deceiver',tagline:'Nothing was what it seemed.',name:'The Deceiver',circle:'Circle VIII — Fraud',subtitle:'Fight 2 of 3',maxHp:24000,baseDmg:7,emoji:'🎭',passive:'Manipulative. After each Strike, 2 cards in hand are discarded and replaced.',passiveId:'fraudShuffle2'},
  {id:'fraud_boss',tagline:'The greatest con: you thought you could win.',name:'The Archfraud',circle:'Circle VIII — Fraud',subtitle:'Circle Boss — Fight 3 of 3',maxHp:32000,baseDmg:8,emoji:'🪞',passive:'Master of lies. After each Strike, 3 cards in hand are discarded and replaced.',passiveId:'fraudShuffle3'},
  // ── CIRCLE IX: TREACHERY ──────────────────────────────────────
  {id:'traitor',tagline:'Your own band turned on you.',name:'The Traitor',circle:'Circle IX — Treachery',subtitle:'Fight 1 of 3',maxHp:22000,baseDmg:6,emoji:'🗝️',passive:'Paranoia. Each Strike, 1 random member refuses to attack and deals 3 damage to an ally.',passiveId:'paranoia'},
  {id:'betrayer',tagline:'It stole everything you built.',name:'The Betrayer',circle:'Circle IX — Treachery',subtitle:'Fight 2 of 3',maxHp:30000,baseDmg:7,emoji:'🔒',passive:'Soul Thief. Each Strike, steals 1 permanent ATK from a random member. Returned on victory.',passiveId:'soulThief'},
  {id:'lucifer',tagline:'He has seen better challengers. A lot of them.',name:'Lucifer',circle:'Circle IX — Treachery',subtitle:'⛧ The Final Circle — Fight 3 of 3',maxHp:100000,baseDmg:9,emoji:'😈',passive:'The Lord of Hell. Your victories weaken him. Two phases. The ultimate test.',passiveId:'luciferBoss'},
]

const ALL_MUSICIANS=[
  {id:'bjorn',name:'Bjorn',role:'Lead Guitarist',atk:5,hp:6,maxHp:8,emoji:'🎸',keyword:'FRENZIED',desc:'High ATK, fragile. The carry.',bio:'Former blacksmith from Uppsala. Traded his hammer for a guitar at 14. His riffs have literally killed small animals.'},
  {id:'ragnar',name:'Ragnar',role:'Lead Guitarist',atk:4,hp:7,maxHp:9,emoji:'🎸',keyword:'FRENZIED',desc:'Slightly tankier lead.',bio:'Claims to be descended from the real Ragnar Lothbrok. Nobody believes him, but nobody argues when he plays.'},
  {id:'thor',name:'Thor',role:'Drummer',atk:0,hp:8,maxHp:11,emoji:'🥁',keyword:'DOUBLE TIME',desc:'Attack fires twice per turn.',bio:'Not THAT Thor. This one is louder. Broke three drum kits in one show. The venue banned drums after that.'},
  {id:'ingrid',name:'Ingrid',role:'Bass Player',atk:3,hp:10,maxHp:14,emoji:'🎵',keyword:'ANCHOR',desc:'High HP. Regen adjacent members.',bio:'The foundation. Ingrid held the band together through two breakups, a lawsuit, and a literal earthquake during a set.'},
  {id:'loki',name:'Loki',role:'Synth Player',atk:3,hp:6,maxHp:8,emoji:'🎹',keyword:'CORRUPT',desc:'Damage scales with Corruption.',bio:'Found a cursed synthesizer in a pawn shop. The more corrupt the signal, the harder it hits. He sleeps with it.'},
  {id:'grimnir',name:'Grimnir',role:'Vocalist',atk:2,hp:7,maxHp:9,emoji:'🎤',keyword:'DEBUFF',desc:'The Masked One. Reduces boss passive each turn.',bio:'Nobody has seen his face. His voice strips the will from anything that hears it. Even the sound guy wears earplugs.'},
  {id:'dag',name:'Dag',role:'Bass Player',atk:2,hp:12,maxHp:16,emoji:'🎵',keyword:'ANCHOR',desc:'Tankiest member.',bio:'16 HP of pure Viking stubbornness. Dag once played a 9-hour set without sitting down. He does not believe in breaks.'},
  {id:'vitalik',name:'Vitalik',role:'Dark Minstrel',atk:6,hp:9,maxHp:12,emoji:'🪈',keyword:'FOLK MAGIC',desc:'Nobody asked. Nobody complained twice.',bio:'Showed up backstage with a carved bone flute. When asked to leave, he played one note. Everyone sat down and listened.'},
  {id:'sigrid',name:'Sigrid',role:'Rhythm Guitarist',atk:3,hp:8,maxHp:11,emoji:'🎸',keyword:'SHREDDER',desc:'Every riff she plays, the next one comes faster.',bio:'Ex-military. Applied the same discipline to guitar that she applied to combat. Each riff is a controlled burst.'},
  {id:'gunnar',name:'Gunnar',role:'Rhythm Guitarist',atk:4,hp:7,maxHp:9,emoji:'🎸',keyword:'SHREDDER',desc:'Rhythm? He makes the rhythm.',bio:'Gunnar does not follow tempo. Tempo follows Gunnar. Three metronomes have broken trying to keep up with him.'},
  {id:'astrid',name:'Astrid',role:'Vocalist',atk:3,hp:8,maxHp:11,emoji:'🎤',keyword:'DEBUFF',desc:'Her voice alone can break a curse.',bio:'Trained as an opera singer. Got bored. Now she shatters demonic wards with a B-flat. The opera house still calls.'},
  {id:'freya',name:'Freya',role:'Synth Player',atk:4,hp:5,maxHp:7,emoji:'🎹',keyword:'CORRUPT',desc:'She plays the dark frequencies.',bio:'Freya heard the frequency that drives men mad. Instead of going mad, she tuned her synth to it. Glass cannon.'},
  {id:'ulf',name:'Ulf',role:'Bass Player',atk:4,hp:9,maxHp:12,emoji:'🎵',keyword:'ANCHOR',desc:'The anchor that also bites.',bio:'Most bass players hold the line. Ulf holds the line and then crosses it. His low-end hits like a freight train.'},
  {id:'brynja',name:'Brynja',role:'Bass Player',atk:1,hp:14,maxHp:19,emoji:'🎵',keyword:'ANCHOR',desc:'An immovable wall. The bass never stops.',bio:'19 HP. She once tanked a full drum kit falling on her mid-set and kept playing. The wall of Valhalla.'},
  {id:'rolf',name:'Rolf',role:'Drummer',atk:1,hp:9,maxHp:12,emoji:'🥁',keyword:'DOUBLE TIME',desc:'Hits harder than the rest combined. Statistically speaking.',bio:'A mathematician who discovered the optimal striking frequency. Each hit is precisely calculated for maximum devastation.'},
  {id:'orm',name:'Orm',role:'Dark Minstrel',atk:2,hp:11,maxHp:15,emoji:'🪈',keyword:'HEXED',desc:'The longer he plays, the worse it gets. For everyone.',bio:'Orm plays an instrument nobody can name. It has too many strings and not enough frets. The sound haunts your dreams.'},
  {id:'tanuki',name:'Tanuki',role:'Bass Player',atk:8,hp:8,maxHp:11,emoji:'🦝',keyword:'ANCHOR',desc:'The heaviest bass in Hell. Built like a tank, hits like a truck.',locked:true,unlockAt:3000,bio:'A raccoon-dog from Japanese folklore. How he ended up in a Norse doom metal band is a question nobody dares ask.'},
  {id:'lucifer_member',name:'Lucifer',role:'The Devil',atk:20,hp:69,maxHp:96,emoji:'😈',keyword:'FALLEN',desc:'Cannot be healed. Loses 1 HP per strike. If he dies, game over. Max 3 band members. Sell for 69 herb.',locked:true,unlockAt:100000,bio:'The actual Devil. Joined the band out of boredom. Unstoppable power, but his HP drains every strike. A ticking time bomb of pure evil.'},
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
  'm_stonewall':'All are shielded from Too Stoned for 2 strikes next fight.',
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
  dialtoeleven:{desc:'+10% corruption. All members +3 ATK this Strike (was +2).'},
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
  null, null,
  {id:'limbos_echo',name:"Limbo's Echo",emoji:'👁',desc:'×1.15 per Strike remaining when you hit.',effect:'multStrikesLeft',circle:1,mult:1.15,multTrigger:'perStrikesLeft'},
  null, null,
  {id:'love_letter',name:'Love Letter',emoji:'💋',desc:'First card each fight is free. ×1.2 if you play it.',effect:'freeFirst',circle:2,mult:1.2,multTrigger:'firstCardFree'},
  null, null,
  {id:'endless_hunger',name:'Endless Hunger',emoji:'🕳',desc:'×1.3 when your band has 4+ alive members.',effect:'mult4alive',circle:3,mult:1.3,multTrigger:'alive4'},
  null, null,
  {id:'golden_tooth',name:'Golden Tooth',emoji:'🪙',desc:'+5 Stash per boss kill. ×1.1 per 20 Stash.',effect:'stashBoss',circle:4,mult:1.1,multTrigger:'perStash20'},
  null, null,
  {id:'berserker_rage',name:"Berserker's Rage",emoji:'🔥',desc:'×1.5 if any member has 20+ ATK.',effect:'atk20mult',circle:5,mult:1.5,multTrigger:'memberAtk20'},
  null, null,
  {id:'heretics_brand',name:"Heretic's Brand",emoji:'⛧',desc:'×1.3 per corruption threshold passed (25/50/75/100).',effect:'corrThresholds',circle:6,mult:1.3,multTrigger:'perCorrThreshold'},
  null, null,
  {id:'the_blade',name:'The Blade',emoji:'🗡',desc:'×2.0 if you play exactly 1 card then Strike. Surgical.',effect:'singleCard',circle:7,mult:2.0,multTrigger:'cards1'},
  null, null,
  {id:'mask_of_lies',name:'Mask of Lies',emoji:'🎭',desc:'×1.2 per member with a different keyword on stage.',effect:'uniqueKeywords',circle:8,mult:1.2,multTrigger:'perUniqueKeyword'},
  null, null,
  null,
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
  {id:'iron_strings',name:'Iron Strings',emoji:'🎸',desc:'All +1 ATK permanently.',color:'#ee2222'},
  {id:'thick_skin',name:'Thick Skin',emoji:'🛡',desc:'All +3 max HP permanently.',color:'#33dd33'},
  {id:'dark_bargain',name:'Dark Bargain',emoji:'🌑',desc:'All CORRUPT cards cost 1 less Ember.',color:'#cc44ff'},
  {id:'speed_demon',name:'Speed Demon',emoji:'⚡',desc:'Draw 1 extra card per Strike.',color:'#ffdd00'},
  {id:'blood_price',name:'Blood Price',emoji:'🩸',desc:'Blood Ritual deals 9× instead of 6×.',color:'#cc0000'},
  {id:'clean_living',name:'Clean Living',emoji:'✨',desc:'While Corruption is below 15%, all members +3 ATK.',color:'#ffffff'},
  {id:'corruption_engine',name:'Corruption Engine',emoji:'☠',desc:'+5% Corruption at start of each fight.',color:'#aa00ff'},
  {id:'merchants_eye',name:'Merchants Eye',emoji:'💰',desc:'All shop items cost 20% less.',color:'#44cc44'},
  {id:'stone_wall',name:'Stone Wall',emoji:'🧱',desc:'Members take 1 less damage per Strike (min 1).',color:'#8888aa'},
  {id:'sixth_slot',name:'Sixth Slot',emoji:'👥',desc:'+1 band member slot. Recruit at next shop.',color:'#e8a820'},
  {id:'war_drums',name:'War Drums',emoji:'🥁',desc:'+1 Strike per fight permanently.',color:'#dd2222'},
  {id:'atonement',name:'Atonement',emoji:'🕊',desc:'-15% Corruption after every boss kill.',color:'#88ccff'},
]

const STAKES=[
  {id:'bronze',name:'Bronze',color:'#cd7f32',border:'#cd7f32',hpMult:1.20,dmgAdd:0,priceMult:1.0,scoreMult:1.0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Standard difficulty. Bosses +20% HP.',mentorBonus:0},
  {id:'silver',name:'Silver',color:'#c0c0c0',border:'#c0c0c0',hpMult:1.25,dmgAdd:2,priceMult:1.0,scoreMult:1.5,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Bosses +25% HP. Enemies +2 damage.',mentorBonus:0.03},
  {id:'gold',name:'Gold',color:'#ffd700',border:'#ffd700',hpMult:1.25,dmgAdd:3,priceMult:1.25,scoreMult:2.0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Bosses +25% HP. Enemies +3 damage. Shop prices +25%.',mentorBonus:0.03},
  {id:'obsidian',name:'Obsidian',color:'#7a7a9a',border:'#6a6a8a',hpMult:1.45,dmgAdd:2,priceMult:1.25,scoreMult:2.5,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:false,drugPriceMult:1.5,badTripChance:0.05,desc:'Bosses +45% HP. No free heal after fights. Drugs 50% more expensive.',mentorBonus:0.06},
  {id:'blood',name:'Blood',color:'#8b0000',border:'#cc0000',hpMult:1.70,dmgAdd:2,priceMult:1.25,scoreMult:3.0,maxStrikes:4,startEmbers:4,startCorruption:10,healAfterFight:false,drugPriceMult:1.5,badTripChance:0.05,desc:'Bosses +70% HP. Enemies +2 damage. Start with 4 Embers. Corruption starts at 10%.',mentorBonus:0.15},
  {id:'demonic',name:'Demonic ⛧',color:'#ff0000',border:'#ff0000',hpMult:1.66,dmgAdd:4,priceMult:1.5,scoreMult:4.0,maxStrikes:3,startEmbers:4,startCorruption:15,healAfterFight:false,drugPriceMult:2.0,badTripChance:0.15,desc:'Bosses +66% HP. Max 3 Strikes. Bad trips 15%. Pure hell.',mentorBonus:0.75},
]
function getUnlockedStakes(){
  const beaten=JSON.parse(localStorage.getItem('vst_stakes_beaten')||'[]')
  const unlocked=[STAKES[0]] // Bronze always unlocked
  for(let i=1;i<STAKES.length;i++){if(beaten.includes(STAKES[i-1].id))unlocked.push(STAKES[i])}
  return unlocked
}
// ── WELCOME TO HELL: The Executive bonus boss ──────────────────────
const AR_EXECUTIVE={id:'ar_exec',name:'The Executive',emoji:'🕴',maxHp:89700,baseDmg:8,
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

// ═══ CORRUPTION DECK — cards added to hand when crossing corruption thresholds ═══
const CORRUPTION_CARDS={
  25:{id:'dark_whisper',name:'Dark Whisper',type:'CORRUPT',rarity:'Common',emoji:'👁',embers:0,effect:'FREE. Target +2 ATK. +5% Corruption.',color:'#aa1111',typeColor:'#880000'},
  50:{id:'blood_price',name:'Blood Price',type:'CORRUPT',rarity:'Uncommon',emoji:'🩸',embers:0,effect:'FREE. Target +4 ATK permanently. -3 HP to that member.',color:'#aa1111',typeColor:'#880000'},
  75:{id:'void_pact',name:'Void Pact',type:'CORRUPT',rarity:'Rare',emoji:'🌀',embers:0,effect:'FREE. All members +2 ATK this Strike. +10% Corruption.',color:'#aa1111',typeColor:'#880000'},
}
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

// Chain lookup: given a card id, return chains it participates in + partner card name
function getChainHints(cardId){
  return RIFF_CHAINS.filter(ch=>ch.cards.includes(cardId)).map(ch=>{
    const partnerIdx=ch.cards[0]===cardId?1:0
    const partner=ALL_CARDS.find(c=>c.id===ch.cards[partnerIdx])
    return{name:ch.name,emoji:ch.emoji,color:ch.color,partnerName:partner?partner.name:'???',partnerId:ch.cards[partnerIdx]}
  })
}

const ALL_CARDS=[
  {id:'amp',name:'Amp It Up',type:'RIFF',rarity:'Common',emoji:'⚡',embers:2,effect:'Target deals ×2 ATK this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'dialtoeleven',name:'Dial to Eleven',type:'CORRUPT',rarity:'Common',emoji:'📻',embers:0,effect:'+10% Corruption. All +3 ATK this Strike.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'soundcheck',name:'Sound Check',type:'UTILITY',rarity:'Common',emoji:'🔊',embers:2,effect:'All +4 HP. Injured: +1 ATK this Strike.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'sigdecay',name:'Signal Decay',type:'CORRUPT',rarity:'Common',emoji:'📡',embers:1,effect:'Discard 1 card from hand. Draw 2 cards.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'battlecry',name:'Battle Cry',type:'RIFF',rarity:'Common',emoji:'🤘',embers:2,effect:'Target: +1 ATK permanent.',color:'#9933cc',typeColor:'#7722aa',copies:4},
  {id:'roadie',name:'Roadie',type:'UTILITY',rarity:'Common',emoji:'🛡',embers:1,effect:'+2 HP. Immune to Too Stoned (2 Strikes).',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'setlist',name:'Setlist',type:'UTILITY',rarity:'Common',emoji:'📋',embers:0,effect:'Draw 3. Discard 1 of choice.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'groupie',name:'Groupie',type:'EMBER',rarity:'Uncommon',emoji:'🍯',embers:1,effect:'+2 Embers. Draw 1.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'demotape',name:'Demo Tape',type:'RIFF',rarity:'Common',emoji:'📼',embers:1,effect:'Copy the last Riff played, cast it free.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'newstrings',name:'New Strings',type:'RIFF',rarity:'Uncommon',emoji:'🎸',embers:2,effect:'+2 ATK permanent to target.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'encore',name:'Encore',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:2,effect:'Target attacks again this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'wakeup',name:'Wake Up Call',type:'UTILITY',rarity:'Uncommon',emoji:'☕',embers:1,effect:'All +2 HP. Revives Too Stoned.',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'feedbackloop',name:'Feedback Loop',type:'CORRUPT',rarity:'Uncommon',emoji:'🎛',embers:3,effect:'Deal damage = Corruption ÷ 2.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'tappedout',name:'Tapped Out',type:'EMBER',rarity:'Uncommon',emoji:'🪙',embers:0,effect:'Gain 5 Embers at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'controlfeedback',name:'Controlled Feedback',type:'CORRUPT',rarity:'Uncommon',emoji:'🎚',embers:2,effect:'Set Corruption to 50%. Heal target member to full HP.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'burnset',name:'Burn the Set',type:'RIFF',rarity:'Uncommon',emoji:'🔥',embers:0,effect:'Select up to 3 cards first, then play this to discard them and draw that many +1. (No selection = draw 1 card.)',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'soundwall',name:'Sound Wall',type:'RIFF',rarity:'Uncommon',emoji:'🔈',embers:2,effect:'+1 ATK permanently to ALL alive members. The whole band gets louder.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'stagedive',name:'Stage Dive',type:'RIFF',rarity:'Rare',emoji:'🤘',embers:4,effect:'Deal target HP to boss. 1/round.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'overdrive',name:'Overdrive',type:'RIFF',rarity:'Rare',emoji:'💥',embers:3,effect:'If Corruption >=60%, double ALL ATK this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:0,shopOnly:true},
  {id:'infencore',name:'Infernal Encore',type:'RIFF',rarity:'Rare',emoji:'👿',embers:3,effect:'ALL members attack again simultaneously.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'remaster',name:'The Remaster',type:'UTILITY',rarity:'Rare',emoji:'🎙',embers:0,effect:'Select 1 card in hand, then play this to delete it and draw 3 cards.',color:'#22aa44',typeColor:'#118833',copies:0,shopOnly:true},
  {id:'whispercard',name:'Dark Whisper',type:'CORRUPT',rarity:'Rare',emoji:'🌀',embers:0,effect:'FREE. Target member +2 ATK permanently. Corruption gift at 25%.',color:'#aa1111',typeColor:'#880000',copies:0},
  {id:'hungercard',name:'Hungering Flame',type:'CORRUPT',rarity:'Rare',emoji:'🔥',embers:0,effect:'FREE. All members +1 ATK this Strike. Draw 2 cards. Corruption gift at 50%.',color:'#aa1111',typeColor:'#880000',copies:0},
  {id:'madnesscard',name:'Madness Unleashed',type:'CORRUPT',rarity:'Rare',emoji:'💀',embers:0,effect:'FREE. Deal 15% of enemy max HP as direct damage. Corruption gift at 75%.',color:'#aa1111',typeColor:'#880000',copies:0},
  {id:'sabbathsigil',name:'Black Sabbath Sigil',type:'CORRUPT',rarity:'Rare',emoji:'⛧',embers:2,effect:'CONSUMABLE. Corruption → 100%. Hellquake d10. Card is destroyed after use.',color:'#aa1111',typeColor:'#880000',copies:0,consumable:true,shopCost:42,shopOnly:true},
  {id:'possessedperf',name:'Possessed Performance',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:4,effect:'All deal ×3 ATK this Strike.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'crowdsurf',name:'Crowd Surf',type:'RIFF',rarity:'Common',emoji:'🏄',embers:2,effect:'Target gains +1 ATK permanently per card in hand. Big hands = big gains.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'doubledown',name:'Double Down',type:'RIFF',rarity:'Uncommon',emoji:'🎰',embers:1,effect:'The next card played this Strike costs 0 Embers.',color:'#9933cc',typeColor:'#7722aa',copies:2,shopOnly:true},
  {id:'deathriff',name:'Death Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'💀',embers:1,effect:'60 DMG scaled by clarity (low corruption = more). +10% Corruption.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'ampoverload',name:'Amp Overload',type:'EMBER',rarity:'Uncommon',emoji:'🔋',embers:0,effect:'+3 Embers. Costs 1 Discard.',color:'#c87820',typeColor:'#a06010',copies:1},
  {id:'ampstatic',name:'Amp the Static',type:'CORRUPT',rarity:'Uncommon',emoji:'📶',embers:3,effect:'Target: +ATK = Corruption ÷ 10 this Strike.',color:'#aa1111',typeColor:'#880000',copies:2},
  // ── NEW CARDS ──────────────────────────────────────────────────
  {id:'distortion',name:'Distortion',type:'CORRUPT',rarity:'Common',emoji:'🎸',embers:1,effect:'Corruption +15%. All members +1 ATK this Strike.',color:'#aa1111',typeColor:'#880000',copies:3},
  {id:'seance',name:'Séance',type:'CORRUPT',rarity:'Uncommon',emoji:'🔮',embers:1,effect:'Heal all members HP equal to Corruption ÷ 4. Rewards high corruption.',color:'#aa1111',typeColor:'#880000',copies:1},
  {id:'staticcharge',name:'Static Charge',type:'CORRUPT',rarity:'Common',emoji:'⚡',embers:0,effect:'Gain 2 Embers. Gain 4 instead if Corruption is 0%.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'darktuning',name:'Dark Tuning',type:'CORRUPT',rarity:'Uncommon',emoji:'🌑',embers:3,effect:'+1 ATK permanent to 1 random per 15% Corruption.',color:'#aa1111',typeColor:'#880000',copies:2},
  {id:'powertap',name:'Power Tap',type:'EMBER',rarity:'Common',emoji:'🔌',embers:0,effect:'Gain 2 Embers.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'soundboard',name:'Soundboard',type:'EMBER',rarity:'Uncommon',emoji:'🎛',embers:1,effect:'Gain 2 Embers. Draw 1 extra card at the start of next Strike.',color:'#c87820',typeColor:'#a05a10',copies:2},
  {id:'setbreak',name:'Smoke Break',type:'UTILITY',rarity:'Common',emoji:'🎼',embers:0,effect:'Select 1 card first, then play to discard it. Gain 2 Embers. -15% Corruption. Draw 1 card. (Random if no selection)',color:'#22aa44',typeColor:'#118833',copies:2},
  {id:'heavyriff',name:'Heavy Riff',type:'RIFF',rarity:'Uncommon',emoji:'🥊',embers:2,effect:'Target gains +ATK perm equal to HALF target current ATK (max +20). The stronger they are, the harder this hits.',color:'#9933cc',typeColor:'#7722aa',copies:2},
  {id:'resonancecard',name:'Resonance',type:'RIFF',rarity:'Uncommon',emoji:'🌀',embers:1,effect:'Target member ATK becomes equal to highest ATK on stage.',color:'#9933cc',typeColor:'#7722aa',copies:3},
  {id:'herbmoney',name:'Herb Money',type:'RIFF',rarity:'Uncommon',emoji:'🌿',embers:1,effect:'Spend 10 Stash. Target +3 ATK permanently. Cash into power.',color:'#9933cc',typeColor:'#7722aa',copies:1},
  {id:'goingbroke',name:'Going Broke',type:'RIFF',rarity:'Rare',emoji:'💸',embers:0,effect:'Spend ALL your Stash. Deal that much damage to the boss.',color:'#9933cc',typeColor:'#7722aa',copies:0,shopOnly:true},
  // ── UNLOCKABLE CARDS ───────────────────────────────────────────
  {id:'moshpit',name:'Mosh Pit',type:'RIFF',rarity:'Uncommon',emoji:'🤘',embers:1,effect:'+1 ATK permanently to ALL alive members. 4+ alive = +2 each.',color:'#9933cc',typeColor:'#7722aa',copies:2,locked:true,unlockAt:1000},
  {id:'bloodritual',name:'Blood Ritual',type:'CORRUPT',rarity:'Rare',emoji:'🩸',embers:2,effect:'Sacrifice 25% of target HP. Deal 6x that HP as damage to the boss. Corruption +15%.',color:'#aa1111',typeColor:'#880000',copies:1,locked:true,unlockAt:10000},
  // ── NEW CARDS (for alternate decks, copies:0 = not in Standard) ──
  {id:'echopedal',name:'Echo Pedal',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:1,effect:'Replay last card played this strike (free). COMBO ENABLER.',color:'#4488ff',typeColor:'#2266cc',copies:0},
  {id:'riffthief',name:'Riff Thief',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:2,effect:'Copy last card played this strike. Cast the copy free.',color:'#cc44ff',typeColor:'#aa22dd',copies:0},
  {id:'feedbackscream',name:'Feedback Scream',type:'RIFF',rarity:'Uncommon',emoji:'📢',embers:2,effect:'+4 ATK permanently. Target loses 2 HP. Power at a cost.',color:'#ff4444',typeColor:'#cc2222',copies:0},
  {id:'skullsplitter',name:'Skull Splitter',type:'RIFF',rarity:'Uncommon',emoji:'💀',embers:3,effect:'+3 ATK perm. If target has 10+ ATK, +5 instead.',color:'#cc2222',typeColor:'#aa0000',copies:0},
  {id:'doomchord',name:'Doom Chord',type:'RIFF',rarity:'Uncommon',emoji:'🎵',embers:2,effect:'+4 ATK. At ≥50% corruption, also +4 to adjacent members.',color:'#6622aa',typeColor:'#440088',copies:0},
  {id:'bloodharmony',name:'Blood Harmony',type:'RIFF',rarity:'Common',emoji:'🩸',embers:1,effect:'Target + adjacent both +2 ATK. Same keyword = +3.',color:'#cc4466',typeColor:'#aa2244',copies:0},
  {id:'sonicboom',name:'Sonic Boom',type:'RIFF',rarity:'Rare',emoji:'💥',embers:4,effect:'ALL members +2 ATK. Draw 1 card.',color:'#ff8800',typeColor:'#cc6600',copies:0},
  {id:'tremolopick',name:'Tremolo Pick',type:'RIFF',rarity:'Common',emoji:'⚡',embers:1,effect:'+1 ATK. If 3+ cards played this strike, +4 instead.',color:'#ffcc00',typeColor:'#ccaa00',copies:0},
  {id:'harmonicfb',name:'Harmonic Feedback',type:'RIFF',rarity:'Uncommon',emoji:'🎶',embers:0,effect:'FREE. +1 ATK perm per RIFF card played this strike.',color:'#44aaff',typeColor:'#2288dd',copies:0},
  {id:'shredsolo',name:'Shred Solo',type:'RIFF',rarity:'Rare',emoji:'🎸',embers:2,effect:'Target attacks TWICE this strike (second at half ATK).',color:'#ff4400',typeColor:'#cc2200',copies:0},
  {id:'overdriveped',name:'Overdrive Pedal',type:'RIFF',rarity:'Rare',emoji:'🔊',embers:2,effect:'Strike multiplier ×1.5 (multiplicative). Stacks with chains.',color:'#ff6600',typeColor:'#cc4400',copies:0},
  {id:'devilsdice',name:"Devil's Dice",type:'RIFF',rarity:'Uncommon',emoji:'🎲',embers:1,effect:'Roll d6. 1-2: nothing. 3-4: +3 ATK all. 5-6: +5 ATK all + draw 2.',color:'#cc0000',typeColor:'#aa0000',copies:0},
  {id:'necroticamp',name:'Necrotic Amp',type:'RIFF',rarity:'Rare',emoji:'☠️',embers:0,effect:'FREE. All +1 ATK per 20% corruption. At 80% = +4 each.',color:'#44cc44',typeColor:'#22aa22',copies:0},
  {id:'soulbargain',name:'Soul Bargain',type:'CORRUPT',rarity:'Uncommon',emoji:'👿',embers:0,effect:'FREE. +5 ATK. Target loses 3 HP. Corruption +5%.',color:'#8800cc',typeColor:'#6600aa',copies:0},
  {id:'venomriff',name:'Venom Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'🐍',embers:1,effect:'+3 ATK permanently. Corruption +5%.',color:'#44aa44',typeColor:'#228822',copies:0},
  {id:'offeringpit',name:'Offering to the Pit',type:'CORRUPT',rarity:'Rare',emoji:'🕳️',embers:2,effect:'Target skips next attack. Another member +8 ATK. Corruption +10%.',color:'#660066',typeColor:'#440044',copies:0},
  {id:'cursedstrings',name:'Cursed Strings',type:'CORRUPT',rarity:'Common',emoji:'🪡',embers:1,effect:'+3 ATK. Target cannot be healed this fight.',color:'#880088',typeColor:'#660066',copies:0},
  {id:'hexdecay',name:'Hex of Decay',type:'CORRUPT',rarity:'Rare',emoji:'🦠',embers:3,effect:'Boss loses 15% of current HP. Corruption +15%.',color:'#448844',typeColor:'#226622',copies:0},
  {id:'infernalpact',name:'Infernal Pact',type:'CORRUPT',rarity:'Rare',emoji:'📜',embers:0,effect:'FREE. Set corruption to 66%. All members +2 ATK permanently.',color:'#cc4400',typeColor:'#aa2200',copies:0},
  {id:'carrioncall',name:'Carrion Call',type:'CORRUPT',rarity:'Rare',emoji:'🦅',embers:1,effect:'Revive a Too Stoned member at 1 HP with +5 ATK. Corruption +20%.',color:'#886622',typeColor:'#664400',copies:0},
  {id:'possessionriff',name:'Possession Riff',type:'CORRUPT',rarity:'Uncommon',emoji:'👁️',embers:1,effect:'+20 ATK this strike only. Corruption +10%. Full demon mode.',color:'#aa44cc',typeColor:'#8822aa',copies:0},

  {id:'hellfirerift',name:'Hellfire Rift',type:'CORRUPT',rarity:'Rare',emoji:'🌋',embers:0,effect:'FREE. ALL members ×2 ATK this strike. +20% corruption. Go nuclear.',color:'#ff2200',typeColor:'#cc0000',copies:0},
  {id:'soulsacrifice',name:'Soul Sacrifice',type:'CORRUPT',rarity:'Rare',emoji:'⚰️',embers:0,effect:'FREE. +5 ATK perm to ALL. +15% corruption. A deal with the devil.',color:'#880044',typeColor:'#660022',copies:0},
  {id:'voidpact',name:'Void Pact',type:'CORRUPT',rarity:'Rare',emoji:'🕳',embers:0,effect:'FREE. Strike multiplier ×2.5 this strike ONLY. +25% corruption. Total commitment.',color:'#440088',typeColor:'#220044',copies:0},
  {id:'darkcrescendo',name:'Dark Crescendo',type:'CORRUPT',rarity:'Rare',emoji:'🌑',embers:0,effect:'FREE. If corruption ≥80%, TRIPLE your strike multiplier.',color:'#220044',typeColor:'#110022',copies:0},
  {id:'russianroulette',name:'Russian Roulette',type:'CORRUPT',rarity:'Uncommon',emoji:'🔫',embers:0,effect:'FREE. Roll d6. 1: target Too Stoned. 2-5: +4 ATK. 6: +8 ATK + Shield.',color:'#cc2244',typeColor:'#aa0022',copies:0},
  {id:'gearcheck',name:'Gear Check',type:'UTILITY',rarity:'Common',emoji:'🔧',embers:1,effect:'Draw 2 cards, discard 1 from hand. Card selection.',color:'#888888',typeColor:'#666666',copies:0},
  {id:'setlistrewrite',name:'Setlist Rewrite',type:'UTILITY',rarity:'Common',emoji:'📝',embers:0,effect:'FREE. Look at top 3 cards of deck, reorder them.',color:'#88aacc',typeColor:'#6688aa',copies:0},
  {id:'backstagepass',name:'Backstage Pass',type:'UTILITY',rarity:'Uncommon',emoji:'🎫',embers:2,effect:'Next card costs 0 embers. Draw 1 card.',color:'#ccaa44',typeColor:'#aa8822',copies:0},
  {id:'venueswap',name:'Venue Swap',type:'UTILITY',rarity:'Uncommon',emoji:'🏟️',embers:1,effect:'Shuffle hand into deck. Draw 6 new cards. Full refresh.',color:'#4488aa',typeColor:'#226688',copies:0},
  {id:'doublebooking',name:'Double Booking',type:'UTILITY',rarity:'Rare',emoji:'📅',embers:3,effect:'+1 extra Strike this fight. GAME CHANGER.',color:'#ff8844',typeColor:'#dd6622',copies:0},
  {id:'bootlegcopy',name:'Bootleg Copy',type:'UTILITY',rarity:'Uncommon',emoji:'📀',embers:1,effect:'Copy the best card in your hand. Temporary copy, gone after fight.',color:'#44cccc',typeColor:'#22aaaa',copies:0},
  {id:'secondwind',name:'Second Wind',type:'EMBER',rarity:'Common',emoji:'💨',embers:0,effect:'Gain embers equal to your empty ember slots. Better when depleted.',color:'#cc8844',typeColor:'#aa6622',copies:0},
  {id:'pyromaniac',name:'Pyromaniac',type:'EMBER',rarity:'Uncommon',emoji:'🧨',embers:1,effect:'+2 embers. If you spend ALL embers this strike, all members +3 ATK.',color:'#ff4400',typeColor:'#dd2200',copies:0},
  {id:'slowburn',name:'Slow Burn',type:'EMBER',rarity:'Common',emoji:'🕯️',embers:0,effect:'+1 ember now. +1 ember at start of next 2 strikes. Delayed investment.',color:'#ff8866',typeColor:'#dd6644',copies:0},
  {id:'ampfeedback',name:'Amp Feedback',type:'EMBER',rarity:'Common',emoji:'🔌',embers:1,effect:'+2 embers. Next RIFF card costs 1 less ember.',color:'#88cc44',typeColor:'#66aa22',copies:0},
  {id:'drainthecrowd',name:'Drain the Crowd',type:'EMBER',rarity:'Common',emoji:'🧛',embers:0,effect:'+2 embers. Random member takes 2 damage. HP cost.',color:'#aa2244',typeColor:'#880022',copies:0},
  {id:'corrsiphon',name:'Corruption Siphon',type:'EMBER',rarity:'Common',emoji:'🌀',embers:0,effect:'+3 embers. Corruption +8%. Corruption tax on generation.',color:'#8844aa',typeColor:'#662288',copies:0},
]

const KEYWORD_DESC={
  'FRENZIED':'High damage dealer. ATK scales with consecutive buffs.',
  'DOUBLE TIME':'Rolls d6 each fight: 5-6=Double Time (×2 ATK), 3-4=Off Beat (×1.5), 1-2=Standard (×1). Never a liability!',
  'ANCHOR':'After each Strike, heals adjacent members +1 HP.',
  'CORRUPT':'ATK increases with Corruption level. Thrives in chaos.',
  'DEBUFF':'Reduces boss damage by 2 each Strike, stacking permanently this fight.',
  'FOLK MAGIC':'20% chance each Strike to refill all Embers.',
  'SHREDDER':'First RIFF card each Strike costs 1 less Ember.',
  'HEXED':'Gains +Corruption each Strike, ATK scales with Corruption.',
  'FALLEN':'Cannot be healed. Loses 1 HP per Strike. If Lucifer dies, game over. Max 3 band members.',
}

// ═══════════════════════════════════════════════════════════
// CARD MASTERY SYSTEM — persistent play tracking across runs
// ═══════════════════════════════════════════════════════════
const MASTERY_TIERS=[
  {name:'Unplayed',min:0,color:null,border:null,glow:null},
  {name:'Novice',min:10,color:'#cd7f32',border:'#cd7f32',glow:'rgba(205,127,50,0.3)'},
  {name:'Adept',min:50,color:'#c0c0c0',border:'#c0c0c0',glow:'rgba(192,192,192,0.4)'},
  {name:'Master',min:200,color:'#ffd700',border:'#ffd700',glow:'rgba(255,215,0,0.5)'},
  {name:'Legendary',min:666,color:'#ff44ff',border:'#ff44ff',glow:'rgba(255,68,255,0.6)'},
]
function getMasteryData(){try{return JSON.parse(localStorage.getItem('vst_mastery')||'{}')}catch(e){return{}}}
function saveMasteryData(d){localStorage.setItem('vst_mastery',JSON.stringify(d))}
function getMasteryTier(cardId){
  const d=getMasteryData()
  const plays=d[cardId]||0
  let tier=MASTERY_TIERS[0]
  for(const t of MASTERY_TIERS){if(plays>=t.min)tier=t}
  return{...tier,plays}
}
function addMasteryPlays(cardId,count){
  const d=getMasteryData()
  d[cardId]=(d[cardId]||0)+(count||1)
  saveMasteryData(d)
  return d[cardId]
}
function getTotalMastery(){
  const d=getMasteryData()
  let total=0,maxed=0
  for(const k of Object.keys(d)){total+=d[k];if(d[k]>=666)maxed++}
  return{total,maxed,cards:Object.keys(d).length}
}


// ═══════════════════════════════════════════════════════════
// MEMBER PORTRAITS — replaces emoji with ink art + Dr. Katz wiggle
// ═══════════════════════════════════════════════════════════
const MEMBER_PORTRAITS={
  bjorn:'/vestibule/members/bjorn_stage.png',
  ragnar:'/vestibule/members/ragnar_stage.png',
  thor:'/vestibule/members/thor_stage.png',
  rolf:'/vestibule/members/rolf_stage.png',
  ingrid:'/vestibule/members/ingrid_stage.png',
  dag:'/vestibule/members/dag_stage.png',
  ulf:'/vestibule/members/ulf_stage.png',
  brynja:'/vestibule/members/brynja_stage.png',
  loki:'/vestibule/members/loki_stage.png',
  freya:'/vestibule/members/freya_stage.png',
  astrid:'/vestibule/members/astrid_stage.png',
  grimnir:'/vestibule/members/grimnir_stage.png',
  sigrid:'/vestibule/members/sigrid_stage.png',
  gunnar:'/vestibule/members/gunnar_stage.png',
  vitalik:'/vestibule/members/vitalik_stage.png',
  orm:'/vestibule/members/orm_stage.png',
  tanuki:'/vestibule/members/tanuki_stage.png',
  lucifer_member:'/vestibule/members/lucifer_member_stage.png',
}
const STAGE_PORTRAITS={
  bjorn:'/vestibule/members/bjorn_stage.png',
  ragnar:'/vestibule/members/ragnar_stage.png',
  thor:'/vestibule/members/thor_stage.png',
  rolf:'/vestibule/members/rolf_stage.png',
  ingrid:'/vestibule/members/ingrid_stage.png',
  dag:'/vestibule/members/dag_stage.png',
  ulf:'/vestibule/members/ulf_stage.png',
  brynja:'/vestibule/members/brynja_stage.png',
  loki:'/vestibule/members/loki_stage.png',
  freya:'/vestibule/members/freya_stage.png',
  astrid:'/vestibule/members/astrid_stage.png',
  grimnir:'/vestibule/members/grimnir_stage.png',
  sigrid:'/vestibule/members/sigrid_stage.png',
  gunnar:'/vestibule/members/gunnar_stage.png',
  vitalik:'/vestibule/members/vitalik_stage.png',
  orm:'/vestibule/members/orm_stage.png',
  tanuki:'/vestibule/members/tanuki_stage.png',
  lucifer_member:'/vestibule/members/lucifer_member_stage.png',
}

const IDLE_PORTRAITS={
  bjorn:'/vestibule/members/idle/bjorn_stage_idle.gif',
  ragnar:'/vestibule/members/idle/ragnar_stage_idle.gif',
  thor:'/vestibule/members/idle/thor_stage_idle.gif',
  rolf:'/vestibule/members/idle/rolf_stage_idle.gif',
  ingrid:'/vestibule/members/idle/ingrid_stage_idle.gif',
  dag:'/vestibule/members/idle/dag_stage_idle.gif',
  ulf:'/vestibule/members/idle/ulf_stage_idle.gif',
  brynja:'/vestibule/members/idle/brynja_stage_idle.gif',
  loki:'/vestibule/members/idle/loki_stage_idle.gif',
  freya:'/vestibule/members/idle/freya_stage_idle.gif',
  astrid:'/vestibule/members/idle/astrid_stage_idle.gif',
  grimnir:'/vestibule/members/idle/grimnir_stage_idle.gif',
  sigrid:'/vestibule/members/idle/sigrid_stage_idle.gif',
  gunnar:'/vestibule/members/idle/gunnar_stage_idle.gif',
  vitalik:'/vestibule/members/idle/vitalik_stage_idle.gif',
  orm:'/vestibule/members/idle/orm_stage_idle.gif',
  tanuki:'/vestibule/members/idle/tanuki_stage_idle.gif',
  lucifer_member:'/vestibule/members/idle/lucifer_member_stage_idle.gif',
}
const BOSS_PORTRAITS={
  wanderer:'/vestibule/bosses/wanderer.png',
  lostsoul:'/vestibule/bosses/lostsoul.png',
  drifter:'/vestibule/bosses/drifter.png',
  siren:'/vestibule/bosses/siren.png',
  tempter:'/vestibule/bosses/tempter.png',
  lust_boss:'/vestibule/bosses/lust_boss.png',
  glutton:'/vestibule/bosses/glutton.png',
  feaster:'/vestibule/bosses/feaster.png',
  gluttony_boss:'/vestibule/bosses/gluttony_boss.png',
  miser:'/vestibule/bosses/miser.png',
  hoarder:'/vestibule/bosses/hoarder.png',
  greed_boss:'/vestibule/bosses/greed_boss.png',
  wrathful:'/vestibule/bosses/wrathful.png',
  berserker:'/vestibule/bosses/berserker.png',
  anger_boss:'/vestibule/bosses/anger_boss.png',
  heretic:'/vestibule/bosses/heretic.png',
  apostate:'/vestibule/bosses/apostate.png',
  heresy_boss:'/vestibule/bosses/heresy_boss.png',
  brute:'/vestibule/bosses/brute.png',
  hunter:'/vestibule/bosses/hunter.png',
  violence_boss:'/vestibule/bosses/violence_boss.png',
  trickster:'/vestibule/bosses/trickster.png',
  deceiver:'/vestibule/bosses/deceiver.png',
  fraud_boss:'/vestibule/bosses/fraud_boss.png',
  traitor:'/vestibule/bosses/traitor.png',
  betrayer:'/vestibule/bosses/betrayer.png',
  lucifer:'/vestibule/bosses/lucifer_p1.png',
  ar_exec:'/vestibule/bosses/ar_exec.png',
}
// ═══ CIRCLE BACKGROUND THEMES ═══
const CIRCLE_BG={
  1:{base:'#0c0a14',glow:'rgba(80,60,120,0.35)',name:'Limbo'},           // grey-purple fog
  2:{base:'#180818',glow:'rgba(160,30,80,0.35)',name:'Lust'},            // deep magenta
  3:{base:'#0a0e04',glow:'rgba(60,100,20,0.30)',name:'Gluttony'},        // sickly bile green
  4:{base:'#100c04',glow:'rgba(180,120,20,0.30)',name:'Greed'},          // amber gold
  5:{base:'#180606',glow:'rgba(200,50,0,0.40)',name:'Anger'},            // fiery orange-red
  6:{base:'#0c0614',glow:'rgba(100,0,160,0.40)',name:'Heresy'},          // void purple
  7:{base:'#140406',glow:'rgba(180,0,30,0.45)',name:'Violence'},         // blood crimson
  8:{base:'#060e0e',glow:'rgba(0,130,130,0.30)',name:'Fraud'},           // shifting teal
  9:{base:'#06060c',glow:'rgba(50,80,180,0.40)',name:'Treachery'},       // frozen blue-black
}
// Dr. Katz "Squigglevision" — CSS wobble effect on portraits
const SQUIGGLE_CSS=`
@keyframes corruptPulse{
  0%{opacity:1;filter:brightness(1)}
  50%{opacity:0.7;filter:brightness(1.4)}
  100%{opacity:1;filter:brightness(1)}
}
@keyframes squiggle1{
  0%{transform:translate(0,0) rotate(0deg)}
  25%{transform:translate(0.7px,-0.6px) rotate(0.4deg)}
  50%{transform:translate(-0.6px,0.7px) rotate(-0.3deg)}
  75%{transform:translate(0.4px,0.4px) rotate(0.2deg)}
  100%{transform:translate(0,0) rotate(0deg)}
}
@keyframes squiggle2{
  0%{transform:translate(0,0) rotate(0deg)}
  25%{transform:translate(-0.5px,0.5px) rotate(-0.35deg)}
  50%{transform:translate(0.8px,-0.4px) rotate(0.45deg)}
  75%{transform:translate(-0.4px,-0.5px) rotate(-0.2deg)}
  100%{transform:translate(0,0) rotate(0deg)}
}
@keyframes squiggle3{
  0%{transform:translate(0.4px,0) rotate(0.15deg)}
  33%{transform:translate(-0.7px,0.5px) rotate(-0.4deg)}
  66%{transform:translate(0.5px,-0.7px) rotate(0.35deg)}
  100%{transform:translate(0.4px,0) rotate(0.15deg)}
}
.squiggle{animation:squiggle1 0.38s steps(3) infinite}
.squiggle:nth-child(2n){animation-name:squiggle2;animation-duration:0.45s}
.squiggle:nth-child(3n){animation-name:squiggle3;animation-duration:0.33s}
@keyframes handOvercapPulse{
  0%,100%{transform:translateX(-50%) scale(1);text-shadow:0 0 8px rgba(200,152,56,0.5)}
  50%{transform:translateX(-50%) scale(1.15);text-shadow:0 0 14px rgba(200,152,56,0.95)}
}
.vfx-particle{position:absolute;border-radius:50%;pointer-events:none;z-index:9500;will-change:transform,opacity}
@keyframes vfxDrift{
  0%{transform:translate(0,0) scale(1);opacity:1}
  100%{transform:translate(var(--vfx-dx),var(--vfx-dy)) scale(0);opacity:0}
}
@keyframes screenFadeFlash{0%{opacity:0}30%{opacity:0.7}100%{opacity:0}}
@keyframes upgradeShimmer{
  0%,100%{box-shadow:2px 4px 16px rgba(0,0,0,0.75),0 0 8px rgba(255,200,0,0.2)}
  50%{box-shadow:2px 4px 16px rgba(0,0,0,0.75),0 0 18px rgba(255,200,0,0.5),0 0 36px rgba(255,200,0,0.15)}
}
@keyframes polaroidSlide{
  0%{transform:translateX(400px) rotate(8deg);opacity:0}
  15%{transform:translateX(0px) rotate(-3deg);opacity:1}
  85%{transform:translateX(0px) rotate(-3deg);opacity:1}
  100%{transform:translateX(400px) rotate(8deg);opacity:0}
}
`
function MemberPortrait({id,size,style,noSquiggle}){
  const src=MEMBER_PORTRAITS[id]
  if(!src)return null
  const s2=size||80
  return <img className={noSquiggle?"":"squiggle"} src={src} alt={id} style={{width:s2,height:s2*1.5,objectFit:'cover',objectPosition:'top center',imageRendering:'pixelated',filter:'none',...(style||{})}}/>
}


// ═══════════════════════════════════════════════════════════
// BOSS TROPHY WALL — persistent kill tracking
// ═══════════════════════════════════════════════════════════
function getTrophyData(){try{return JSON.parse(localStorage.getItem('vst_trophies')||'{}')}catch(e){return{}}}
function saveTrophyData(d){localStorage.setItem('vst_trophies',JSON.stringify(d))}
function recordTrophyKill(enemyId,stakeId,damage,strikes){
  const d=getTrophyData()
  if(!d[enemyId])d[enemyId]={kills:0,bestStake:null,bestDamage:0,bestStrikes:99,firstKill:null}
  const t=d[enemyId]
  t.kills++
  if(!t.firstKill)t.firstKill=new Date().toISOString().slice(0,10)
  if(damage>t.bestDamage)t.bestDamage=damage
  if(strikes<t.bestStrikes)t.bestStrikes=strikes
  const stakeOrder=['bronze','silver','gold','obsidian','blood','demonic']
  if(!t.bestStake||stakeOrder.indexOf(stakeId)>stakeOrder.indexOf(t.bestStake))t.bestStake=stakeId
  saveTrophyData(d)
  return t
}


// ═══════════════════════════════════════════════════════════
// BAND LEGACY — persistent member stats across runs
// ═══════════════════════════════════════════════════════════
function getLegacyData(){try{return JSON.parse(localStorage.getItem('vst_legacy')||'{}')}catch(e){return{}}}
function saveLegacyData(d){localStorage.setItem('vst_legacy',JSON.stringify(d))}
function recordLegacyRun(members,stats,won,circleReached){
  const d=getLegacyData()
  members.forEach(m=>{
    if(!m)return
    if(!d[m.id])d[m.id]={runs:0,wins:0,deaths:0,totalDmg:0,bestCircle:0,bestDmg:0,nickname:null}
    const l=d[m.id]
    l.runs++
    if(won)l.wins++
    if(m.tooStoned)l.deaths++
    l.totalDmg+=(stats.totalDamage||0)
    if(circleReached>l.bestCircle)l.bestCircle=circleReached
    if((stats.highestStrike||0)>l.bestDmg)l.bestDmg=stats.highestStrike||0
    // Generate nickname based on stats
    if(l.runs>=20&&l.deaths===0)l.nickname='The Immortal'
    else if(l.wins>=10)l.nickname='The Legendary'
    else if(l.deaths>=10)l.nickname='The Cursed'
    else if(l.runs>=15)l.nickname='The Veteran'
    else if(l.wins>=5)l.nickname='The Proven'
    else if(l.bestCircle>=9)l.nickname='Hell Walker'
    else if(l.runs>=10)l.nickname='The Seasoned'
    else if(l.runs>=5)l.nickname='The Familiar'
    else if(l.bestDmg>=500)l.nickname='Bonecrusher'
  })
  saveLegacyData(d)
}
function getMemberLegacy(id){
  const d=getLegacyData()
  return d[id]||null
}


// ═══════════════════════════════════════════════════════════
// DAILY SEED — track daily best score
// ═══════════════════════════════════════════════════════════
function getDailySeed(){const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))}
function getDailyBest(){
  const today=new Date().toISOString().slice(0,10)
  const stored=JSON.parse(localStorage.getItem('vst_daily_best')||'{}')
  if(stored.date!==today)return null
  return stored.score||null
}
function saveDailyBest(score){
  const today=new Date().toISOString().slice(0,10)
  const stored=JSON.parse(localStorage.getItem('vst_daily_best')||'{}')
  if(stored.date!==today||score>(stored.score||0)){
    localStorage.setItem('vst_daily_best',JSON.stringify({date:today,score,circle:stored.circle||0}))
  }
}

function seededRng(seed){let s=seed;return function(){s=Math.imul(48271,s)|0;return(s&0x7fffffff)/0x7fffffff}}

function buildDeck(seed,deckId){
  const rng=seededRng(seed)
  const deck=[]
  const manifest=DECK_CARD_MANIFESTS[deckId||'standard']
  if(manifest){
    // Build from manifest — exact card counts per deck
    for(const[id,copies]of Object.entries(manifest)){
      const c=ALL_CARDS.find(x=>x.id===id)
      if(c)for(let i=0;i<copies;i++)deck.push(Object.assign({},c,{uid:uid()}))
    }
  } else {
    // Fallback: original behavior
    getUnlockedCards().filter(c=>!c.shopOnly).forEach(function(c){
      const n=c.copies!=null?c.copies:2
      for(let i=0;i<n;i++){deck.push(Object.assign({},c,{uid:uid()}))}
    })
  }
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
  // #9: GOLD CARDS — Legendary mastery (666+ plays) = auto-upgraded in all runs
  const mastery=getMasteryData()
  for(let i=0;i<deck.length;i++){
    if(mastery[deck[i].id]>=666&&!deck[i].upgraded){
      deck[i]=Object.assign({},deck[i],{upgraded:true,gold:true,name:deck[i].name+' ⛧'})
    }
  }
  return deck
}

// ── DECK CARD MANIFESTS (69 cards each) ──
const DECK_CARD_MANIFESTS={
  standard:null, // uses default copies from ALL_CARDS
  shredder:{amp:2,battlecry:3,newstrings:2,encore:3,infencore:2,possessedperf:2,heavyriff:2,moshpit:2,resonancecard:2,crowdsurf:2,demotape:2,soundwall:1,burnset:1,stagedive:1,herbmoney:1,echopedal:2,riffthief:2,feedbackscream:2,devilsdice:1,sonicboom:1,skullsplitter:1,tremolopick:1,harmonicfb:1,doomchord:1,distortion:2,staticcharge:2,deathriff:1,ampstatic:1,dialtoeleven:1,sigdecay:1,bloodritual:1,darktuning:1,soundcheck:2,setbreak:2,wakeup:2,roadie:1,setlist:1,powertap:2,tappedout:2,soundboard:2,groupie:1,ampoverload:1,corrsiphon:2,drainthecrowd:1},
  ritualist:{amp:1,battlecry:2,encore:2,infencore:2,possessedperf:2,heavyriff:2,resonancecard:2,crowdsurf:1,demotape:1,soundwall:1,moshpit:1,newstrings:1,herbmoney:1,burnset:1,distortion:3,darktuning:2,staticcharge:2,dialtoeleven:2,deathriff:2,ampstatic:2,seance:1,bloodritual:1,feedbackloop:1,controlfeedback:1,sigdecay:1,infernalpact:2,cursedstrings:2,possessionriff:1,soulbargain:1,hexdecay:1,offeringpit:1,carrioncall:1,russianroulette:1,soundcheck:2,roadie:2,wakeup:2,setbreak:2,gearcheck:1,doublebooking:1,powertap:2,corrsiphon:2,tappedout:1,groupie:1,soundboard:1,ampoverload:1,pyromaniac:1,ampfeedback:1,drainthecrowd:1},
  engineer:{battlecry:3,amp:2,encore:2,possessedperf:2,heavyriff:2,crowdsurf:2,infencore:1,soundwall:1,burnset:1,shredsolo:2,sonicboom:2,feedbackscream:1,overdriveped:1,harmonicfb:1,tremolopick:1,distortion:2,darktuning:2,ampstatic:1,deathriff:1,staticcharge:1,feedbackloop:1,controlfeedback:1,seance:1,venomriff:2,darkcrescendo:1,setlist:3,soundcheck:2,wakeup:2,setbreak:2,roadie:1,bootlegcopy:2,backstagepass:2,setlistrewrite:2,venueswap:1,gearcheck:1,powertap:2,groupie:2,soundboard:2,corrsiphon:2,secondwind:2,tappedout:1,ampoverload:1,ampfeedback:1,drainthecrowd:1},
  survivor:{battlecry:3,newstrings:2,encore:2,infencore:2,possessedperf:2,heavyriff:2,moshpit:2,crowdsurf:2,amp:1,soundwall:1,resonancecard:1,burnset:1,herbmoney:1,doomchord:2,sonicboom:1,necroticamp:1,distortion:2,staticcharge:2,darktuning:2,deathriff:2,controlfeedback:1,dialtoeleven:1,feedbackloop:1,seance:1,bloodritual:1,sigdecay:1,soundcheck:2,roadie:2,wakeup:2,setlist:2,setbreak:2,doublebooking:2,bootlegcopy:1,backstagepass:1,powertap:2,tappedout:2,ampoverload:2,drainthecrowd:2,groupie:1,soundboard:1,slowburn:1,pyromaniac:1,secondwind:1,corrsiphon:1,carrioncall:1},
}

function getCenter(ref){
  if(!ref||!ref.current)return{x:window.innerWidth/2,y:window.innerHeight/2}
  const r=ref.current.getBoundingClientRect()
  return{x:r.left+r.width/2,y:r.top+r.height/2}
}

// Custom weed-leaf icon — drop-in replacement for the 🌿 emoji
function WeedLeaf({size=16,style}){
  return <img src={(import.meta.env.BASE_URL||'/')+'weed_leaf.png'} alt="🌿" draggable={false}
    style={Object.assign({width:size,height:size,display:'inline-block',verticalAlign:'middle',objectFit:'contain',pointerEvents:'none',userSelect:'none'},style||{})}/>
}
// Log line renderer — splits on 🌿 so the emoji becomes inline WeedLeaf images
function LogLine({text}){
  if(typeof text!=='string'||text.indexOf('\uD83C\uDF3F')===-1)return <>{text}</>
  const parts=text.split('\uD83C\uDF3F')
  return <>{parts.map((p,i)=>(<React.Fragment key={i}>{p}{i<parts.length-1?<WeedLeaf size={12} style={{margin:'0 1px'}}/>:null}</React.Fragment>))}</>
}


// ═══ TOUR QUOTES — pre-fight loading screen flavor ═══════════════════════
const TOUR_QUOTES=[
  "Last seen playing a basement in Cleveland for $40 and a case of beer.",
  "The van broke down outside Tulsa. We hitched a ride in a hearse.",
  "Banned from every venue in Reno. Worth it.",
  "Our rider says 'no brown M&Ms.' We've never had a rider.",
  "Soundcheck? We don't do soundcheck. We do shots.",
  "The opening act quit after hearing us tune up.",
  "Someone threw a shoe. We kept it. It's on the merch table now.",
  "Three cities. Two flat tires. One pair of clean socks between us.",
  "We got lost in Detroit. Found ourselves in the process.",
  "The bartender said we were 'aggressively loud.' We took it as a compliment.",
  "Hotel? We sleep in the van. The van sleeps in the Walmart parking lot.",
  "Played a biker bar in Sturgis. They asked us to turn DOWN.",
  "Our bass player pawned his shoes for gas money. Played barefoot in Omaha.",
  "The venue had a 'no moshing' sign. We used it as a setlist.",
  "Got paid in beer and cigarettes. Honestly? Fair deal.",
  "Somebody called the cops. Turns out the drummer's uncle IS the cops.",
  "The floor caved in during the encore. Nobody stopped playing.",
  "We opened for a polka band once. Converted three of them.",
  "Our merch guy is also our driver, our cook, and our bail fund.",
  "The monitor guy hated us so much he gave us perfect sound out of spite.",
  "Slept on a stranger's floor in Memphis. Woke up with a new guitarist.",
  "The AC broke mid-set. Sweat baptism for everyone in the front row.",
  "We don't have fans. We have co-conspirators.",
  "Someone bootlegged our set. It sounds better than the studio album.",
  "The green room was a broom closet. We've had worse.",
  "Promoter promised $200. We got $60 and a 'maybe next time, guys.'",
  "The drummer's kick pedal broke. He finished the set stomping the floor.",
  "Our t-shirts are printed on stolen blanks. Allegedly.",
  "Last tour we played 47 shows in 50 days. The other 3 we were lost.",
  "The venue marquee misspelled our name. We liked their version better.",
]

// ═══ TUTORIAL SYSTEM ═══════════════════════════════════════════════════════
const TUTORIAL_ENEMIES=[
  {id:'tut_shade',name:'The Shade',circle:'TUTORIAL',subtitle:'Fight 1 of 3',maxHp:30,baseDmg:2,emoji:'👤',passive:'A weak spirit. An easy first kill.',passiveId:null},
  {id:'tut_wraith',name:'The Wraith',circle:'TUTORIAL',subtitle:'Fight 2 of 3',maxHp:45,baseDmg:3,emoji:'👻',passive:'Its touch corrupts. +10% Corruption per Strike.',passiveId:'corruptPlayer10tut'},
  {id:'tut_revenant',name:'The Revenant',circle:'TUTORIAL',subtitle:'Fight 3 of 3',maxHp:55,baseDmg:3,emoji:'💀',passive:'Stronger, but beatable. Find the combo.',passiveId:null},
]
// Members the player starts with in the tutorial
const TUTORIAL_MEMBERS=['bjorn','gunnar'] // Lead Guitarist (FRENZIED) + Rhythm Guitarist (SHREDDER)
// Predetermined hands for each tutorial fight
const TUTORIAL_HANDS={
  1:['battlecry','amp','newstrings','groupie','distortion','heavyriff','moshpit'], // basics: buff + attack
  2:['battlecry','darktuning','setbreak','distortion','encore','roadie','groupie'], // corruption cards + heals
  3:['battlecry','stagedive','encore','amp','heavyriff','distortion','groupie'], // battlecry+stagedive = DEATH WISH chain
}
// Tooltip sequences per fight
const TUTORIAL_TIPS={
  1:[
    {id:"t1_welcome",text:"Welcome to the Vestibule. Your band must fight through the 9 Circles of Hell. Let us show you how.",target:"boss",position:"below"},
    {id:"t1_hand",text:"Playing cards is everything. Drag a card onto a band member to buff their ATK, heal them, or trigger special effects. Try it now!",target:"hand",position:"above"},
    {id:"t1_embers",text:"Cards cost Embers to play. You have 5 per fight. Spend them wisely — every card makes your Strike stronger.",target:"embers",position:"left"},
    {id:"t1_strike",text:"When you have played your cards, hit STRIKE. Every band member attacks the enemy with their ATK. More buffs = more damage.",target:"strike",position:"left"},
  ],
  2:[
    {id:"t2_corruption",text:"See the meter on the right? That is Corruption. Some cards raise it. Higher corruption means more danger... but also more power.",target:"corruption",position:"left"},
    {id:"t2_corrupt_card",text:"CORRUPT cards (red) are risky. They raise corruption but can be very powerful.",target:"hand",position:"above"},
  ],
  3:[
    {id:"t3_chain_intro",text:"Certain card pairs trigger Riff Chains — powerful combos that multiply your damage. Battle Cry + Stage Dive is one. But you only have 5 Embers and they cost 6 total...",target:"hand",position:"above"},
    {id:"t3_ember_mgmt",text:"Here is the trick: play Battle Cry first (2 Embers), then play Groupie (costs 1, but GIVES you 2 back). Now you have enough for Stage Dive (4 Embers). Ember management is key!",target:"embers",position:"left"},
  ],
}
const TUTORIAL_POST_FIGHT={
  1:'Nice work! That was just a warm-up. The real darkness lies ahead...',
  2:'You felt the corruption creeping in. Learn to use it — or it will consume you.',
  3:'TUTORIAL COMPLETE',
}
function isTutorialDone(){return localStorage.getItem('vst_tutorial')==='done'}
// First-encounter tips — shown once per mechanic
function getEncounteredRules(){try{return JSON.parse(localStorage.getItem('vst_rules_seen')||'[]')}catch(e){return[]}}
function markRuleSeen(idx){const seen=getEncounteredRules();if(!seen.includes(idx)){seen.push(idx);localStorage.setItem('vst_rules_seen',JSON.stringify(seen))}}
const FIRST_TIPS={
  pact:"After each boss, choose a Pact — a permanent buff for the rest of your run. Choose wisely, you can only pick one.",
  forge:"The Doom Forge lets you upgrade one card permanently. Upgraded cards have enhanced effects. Pick your best card.",
  shop:"Welcome to the Shop. Spend Stash to buy new cards, recruit members, and find artifacts. Browse carefully.",
  event:"A random event! These offer risky choices with big rewards. Read both options before deciding.",
  descent:"The Descent Map shows your path through Hell. You can skip some fights for alternative rewards.",
  drugs:"The Dealer sells Shrooms and Acid. Drugs give powerful trip effects before fights, but bad trips are possible.",
}
function hasSeenTip(id){return(JSON.parse(localStorage.getItem('vst_tips')||'[]')).includes(id)}
function markTipSeen(id){const seen=JSON.parse(localStorage.getItem('vst_tips')||'[]');if(!seen.includes(id)){seen.push(id);localStorage.setItem('vst_tips',JSON.stringify(seen))}}
function markTutorialDone(){localStorage.setItem('vst_tutorial','done')}

// ── STARTER ARTIFACTS A1-A10 ─────────────────────────────────
const STARTER_ARTIFACTS=[
  {id:'a1',name:'Vintage Guitar',emoji:'🎸',effect:'×1.3 damage when you play 3+ cards before Striking.',cost:10,multTrigger:'cards3',mult:1.3},
  {id:'a2',name:"Devil's Tuning Fork",emoji:'🔱',effect:'×1.5 damage when Corruption is 50% or higher.',cost:8,multTrigger:'corrupt50',mult:1.5},
  {id:'a3',name:'The Evil Eye',emoji:'🧿',effect:'The first card you play each Strike costs 0 Embers.',cost:20,rare:true},
  {id:'a4',name:"Roadie's Toolbelt",emoji:'🧰',effect:'At the start of each fight, one random member gains Stonewall (immune to Too Stoned once).',cost:6},
  {id:'a5',name:'Haunted Radio',emoji:'📻',effect:'×1.2 damage for each Riff Chain fired this Strike.',cost:8,multTrigger:'perChain',mult:1.2},
  {id:'a6',name:'Black Candle',emoji:'🕯',effect:'×1.4 damage for each Too Stoned member.',cost:12,multTrigger:'perStoned',mult:1.4},
  {id:'a7',name:"The Serpent's Kiss",emoji:'🐍',effect:'Start each fight with 1 extra Ember permanently (max 8 total).',cost:18},
  {id:'a8',name:'Stone Tablet',emoji:'🪨',effect:'All band members gain +3 max HP permanently.',cost:12},
  {id:'a9',name:'Resonance Coil',emoji:'⚙️',effect:'×1.15 for each duplicate card in your hand when you Strike.',cost:10,multTrigger:'perDupe',mult:1.15},
  {id:'a10',name:'Burning Stage',emoji:'🔥',effect:'×2.0 damage if you play 5+ cards before Striking. Go all in.',cost:10,multTrigger:'cards5',mult:2.0},
  // ── UNLOCKABLE ARTIFACT ────────────────────────────────────────
  {id:'wardrums',name:'War Drums',emoji:'🪘',effect:'+1 Strike per fight permanently (5 Strikes instead of 4).',cost:30,locked:true,unlockAt:5000},
]

// ── STARTER PASSIVES P1-P10 (CD-Rs) ───────────────────────────
const STARTER_PASSIVES=[
  {id:'p1',name:'Power Chord',emoji:'⚡',effect:'Gain 1 extra Ember at the start of every fight.',cost:6},
  {id:'p2',name:'Roadie Crew',emoji:'🔧',effect:'At the start of each fight, one random member heals 3 HP.',cost:8},
  {id:'p3',name:'Merch Table',emoji:'👕',effect:'After each fight victory, gain +2 bonus Stash.',cost:6},
  {id:'p4',name:'Feedback Hum',emoji:'🔊',effect:'All EMBER type cards give 1 additional Ember when played.',cost:10},
  {id:'p5',name:'Amp Stack',emoji:'📻',effect:'Sound Wall gives +2 ATK perm to all (instead of +1). Heavy Riff cap raised to +25 (instead of +20).',cost:10},
  {id:'p6',name:'Cult Following',emoji:'🕯',effect:'Each time any member goes Too Stoned, gain 3 Stash.',cost:10},
  {id:'p7',name:'Guitar Tech',emoji:'🎛',effect:'Battle Cry gives +2 ATK permanently instead of +1.',cost:8},
  {id:'p8',name:'Green Room',emoji:'🛋',effect:'At the start of each fight, all members gain Stonewall (immune to first Too Stoned event).',cost:16},
  {id:'p9',name:'Heavy Rotation',emoji:'🎚',effect:'When you draw a duplicate card into your hand, draw 1 extra card next Strike.',cost:10},
  {id:'p10',name:'Stage Fright Reversal',emoji:'🎙',effect:'The first Strike of every fight deals +10 bonus damage.',cost:14},
]


// ═══════════════════════════════════════════════════════════
// RANDOM EVENTS — Hell-themed encounters between non-boss fights
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// STARTER DECKS — achievement-gated alternate starting decks
// ═══════════════════════════════════════════════════════════
const STARTER_DECKS=[
  {id:'standard',name:'⛧ Standard',emoji:'🎸',desc:'The default 69-card deck. Balanced for all playstyles. 10% win rate.',requirement:null,color:'#c8a060',hpScale:0.74},
  {id:'shredder',name:'🎸 The Shredder',emoji:'⚡',desc:'Pure aggro. 38 RIFF cards. Every card buffs or kills. 8% win rate.',requirement:'beat_standard',color:'#ff4400',hpScale:0.73},
  {id:'ritualist',name:'💀 The Ritualist',emoji:'🌀',desc:'Corruption IS power. 26 CORRUPT cards. Embrace the darkness. 7% win rate.',requirement:'beat_shredder',color:'#cc44ff',hpScale:0.52},
  {id:'engineer',name:'🔧 The Engineer',emoji:'🔧',desc:'Find the combo. Copy the copier. 18 UTILITY cards. Break the game. 6% win rate.',requirement:'beat_ritualist',color:'#44aaff',hpScale:0.58},
  {id:'survivor',name:'🛡️ The Survivor',emoji:'🛡️',desc:'Outlast everything. Extra strikes. Steady scaling. 5% win rate.',requirement:'beat_engineer',color:'#44cc44',hpScale:0.58},
]
function getUnlockedDecks(){
  const achs=getAchievements()
  return STARTER_DECKS.filter(d=>!d.requirement||achs.includes(d.requirement))
}

const HELL_EVENTS=[
  {id:'mosh_pit',name:'The Mosh Pit',emoji:'🤘',
    flavor:'A pit of tortured souls writhes before you. Your band could join the fray...',
    choiceA:{label:'Jump In',desc:'All take 4 damage. Survivors gain +1 ATK permanently.',emoji:'💥'},
    choiceB:{label:'Walk Away',desc:'Lose 15 Stash. The crowd boos.',emoji:'🚶'}},
  {id:'cursed_amp',name:'Cursed Amplifier',emoji:'🔊',
    flavor:'A blood-red amp hums with infernal energy. Its knobs are set to 11...',
    choiceA:{label:'Plug In',desc:'+2 Max Embers permanently. Corruption locks at current level forever.',emoji:'⚡'},
    choiceB:{label:'Smash It',desc:'-15% Corruption. Sometimes silence is golden.',emoji:'🔨'}},
  {id:'blood_oath',name:'Blood Oath',emoji:'🩸',
    flavor:'A hooded figure offers a crimson contract. One name. One signature. One promise.',
    choiceA:{label:'Sign It',desc:'Your strongest member gains +5 ATK. But if they take ANY boss damage, they die instantly.',emoji:'✍'},
    choiceB:{label:'Refuse',desc:'Smart. The figure dissolves into smoke.',emoji:'🚫'}},
  {id:'hellfire_baptism',name:'Hellfire Baptism',emoji:'🔥',
    flavor:'A river of fire blocks your path. The flames whisper: "Let us in."',
    choiceA:{label:'Walk Through',desc:'Corruption set to 69%. All members gain +2 ATK permanently.',emoji:'🌊'},
    choiceB:{label:'Find Another Way',desc:'Nothing happens. You press on.',emoji:'↩'}},
  {id:'sabbath_offering',name:'Sabbath Offering',emoji:'⛧',
    flavor:'An altar of black stone demands sacrifice. Three cards, chosen by fate.',
    choiceA:{label:'Make the Offering',desc:'Remove 3 weakest cards from your deck permanently. All members +1 ATK. Thin your deck, sharpen your band.',emoji:'🪦'},
    choiceB:{label:'Keep Your Cards',desc:'The altar crumbles. You keep your deck intact.',emoji:'🃏'}},
  {id:'devils_wager',name:"The Devil\'s Wager",emoji:'🎲',
    flavor:'Old Scratch himself appears, flipping a coin. "Feeling lucky, mortal?"',
    choiceA:{label:'Take the Bet',desc:'Coin flip. HEADS: All members +3 ATK. TAILS: Your strongest member dies.',emoji:'🪙'},
    choiceB:{label:'Walk Away',desc:'"Coward." He vanishes. But your band is intact.',emoji:'🚶'}},
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

const BOSS_BIOS={
  wanderer:'A soul who never chose a side. Drifts through Limbo endlessly, attacking out of confusion rather than malice.',
  lostsoul:'Once a musician herself. Lost her voice, then her mind, then her name. Now she lashes out at anything that reminds her of what she was.',
  drifter:'The gatekeeper of Limbo. Pure pressure, no strategy. If you can\'t handle this, Hell will eat you alive.',
  siren:'Her voice was the last beautiful thing many heard. Now she sings to lure the damned deeper into the circles.',
  tempter:'Offers everything you want, takes everything you have. His charm is a weapon sharper than any blade.',
  lust_boss:'The embodiment of desire. Every buff you gain makes you want more. That\'s exactly how she wins.',
  glutton:'Consumes your damage like a buffet. The more you feed it, the hungrier it gets.',
  feaster:'Three stomachs. Each one heals what the others digest. A biological war of attrition.',
  gluttony_boss:'The mouth at the bottom of the food chain. Everything in Gluttony flows into the Devourer eventually.',
  miser:'Counts every coin twice. Steals your stash not out of need, but out of principle.',
  hoarder:'Has more wealth than any demon in Hell. Still steals from the damned. Old habits.',
  greed_boss:'Invented interest rates in the afterlife. Your debt to him grows faster than your damage.',
  wrathful:'Rage given physical form. The more you prepare, the angrier he gets.',
  berserker:'No strategy. No hesitation. Just fury. Every buff you stack is fuel for his fire.',
  anger_boss:'Commanded armies in life. Commands rage in death. Your strength is his weapon.',
  heretic:'Challenged God. Lost. Now he challenges everyone else. His corruption is contagious.',
  apostate:'A former priest who found the wrong truth. His faith corrupts everything it touches.',
  heresy_boss:'Wrote the book on corruption. Literally. Reading it costs 20% of your soul per page.',
  brute:'Precision violence. Always targets the strongest. Believes in cutting the head off the snake.',
  hunter:'Tracked souls across nine circles for centuries. His patience is his deadliest weapon.',
  violence_boss:'Executioner of Hell. Methodical. Doubles his damage against your strongest. There is no hiding.',
  trickster:'Nothing is what it seems. Your hand, your strategy, your plan — he scrambles all of it.',
  deceiver:'The second-best liar in Hell. Manipulates your cards, your confidence, your hope.',
  fraud_boss:'The greatest con artist who ever lived — or died. His lies are indistinguishable from truth.',
  traitor:'Betrayed his own circle to survive. Now he turns your band against each other.',
  betrayer:'Steals what you\'ve built. Your permanent ATK, your strategy, your progress. All of it.',
  lucifer:'The Morning Star. Fell from Heaven. Rules Hell. Two phases. The ultimate test of everything you\'ve built.',
}

const CIRCLE_ARTIFACTS=[
  {id:'ca1',name:'The Goat of Mendes',emoji:'🐐',effect:'All Strikes deal ×1.25 damage. Stacks with other multipliers.',cost:14,multTrigger:'always',mult:1.25},
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
function isGoodDeal(card){
  const cost=card.shopCost||getShopCost(card)
  if(card.rarity==='Rare'&&cost<=10)return true
  if(card.rarity==='Uncommon'&&cost<=6)return true
  if(card.upgraded)return true
  return false
}
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
function Projectile({from,to,emoji,onDone,isBoss}){
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
  return <div style={{position:'absolute',left:p.x,top:p.y,transform:`translate(-50%,-50%) scale(${p.s})`,fontSize:72,opacity:p.o,pointerEvents:'none',zIndex:8000,filter:isBoss?'drop-shadow(0 0 40px rgba(255,0,0,1)) drop-shadow(0 0 80px rgba(200,0,0,0.7))':'drop-shadow(0 0 30px rgba(255,80,0,1)) drop-shadow(0 0 60px rgba(255,40,0,0.6))'}}>{emoji}</div>
}

function Float({v,x,y,color,big,onDone}){
  color=color||'#dd2222';big=big||false
  useEffect(()=>{const t=setTimeout(onDone,1400);return ()=>clearTimeout(t)},[])
  // Scale font size based on damage value — bigger hits = BIGGER numbers
  let sz=big?'5rem':'2.8rem'
  if(typeof v==='number'&&v>0){
    if(v>=500)sz='8rem'
    else if(v>=200)sz='6.5rem'
    else if(v>=100)sz='5.5rem'
    else if(v>=50)sz='4.5rem'
    else if(v>=20)sz='3.5rem'
  }
  return <div style={{position:'absolute',left:x,top:y,transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:sz,fontWeight:900,color:color,textShadow:`0 0 24px ${color}, 0 0 48px ${color}44`,pointerEvents:'none',zIndex:9000,animation:'popFloat 1.6s ease-out forwards'}}>{typeof v==='number'&&v>0?'-'+v:v}</div>
}

// Boss kill quote — types out letter by letter
function TypewriterQuote({text}){
  const [shown,setShown]=useState(0)
  useEffect(()=>{
    if(shown<text.length){const t=setTimeout(()=>setShown(p=>p+1),45);return()=>clearTimeout(t)}
  },[shown,text])
  return(
    <div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9200,pointerEvents:'none',textAlign:'center',animation:'fadeIn 0.3s ease'}}>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:28,color:'var(--ink-bone)',fontStyle:'italic',lineHeight:1.6,textShadow:'0 0 30px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.9)',maxWidth:600,opacity:0.9}}>
        "{text.slice(0,shown)}<span style={{opacity:shown<text.length?1:0,animation:'pulse 0.5s ease infinite alternate'}}>|</span>"
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--blood)',letterSpacing:4,textTransform:'uppercase',marginTop:12,opacity:0.6}}>💀 Last Words</div>
    </div>
  )
}

// Victory confetti — falling embers and sparks
function ConfettiRain(){
  const particles=useRef(Array.from({length:60},(_,i)=>({
    id:i,x:Math.random()*100,delay:Math.random()*3,dur:2+Math.random()*3,size:3+Math.random()*6,
    color:['#ffd700','#ff6600','#ff3300','#e8a820','#cc4400','#ffaa00'][Math.floor(Math.random()*6)],
    drift:-20+Math.random()*40,rot:Math.random()*720
  }))).current
  return(
    <div style={{position:'absolute',inset:0,zIndex:9100,pointerEvents:'none',overflow:'hidden'}}>
      {particles.map(p=><div key={p.id} style={{
        position:'absolute',left:p.x+'%',top:'-10px',width:p.size,height:p.size*1.5,
        background:p.color,borderRadius:1,opacity:0.8,
        animation:`confettiFall ${p.dur}s linear ${p.delay}s infinite`,
        transform:`rotate(${p.rot}deg) translateX(${p.drift}px)`
      }}/>)}
    </div>
  )
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

function EmberDisplayLarge({current,max,forecast}){
  const afterCast=forecast?Math.max(0,current-forecast):current
  return(
    <div data-ember-display="1" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>Embers</div>
      <div style={{display:'flex',gap:3,justifyContent:'center'}}>
        {Array.from({length:max}).map((_,i)=>{
          const filled=i>=(max-current)
          const wouldSpend=forecast&&filled&&i<(max-afterCast)
          return <div key={i} style={{fontSize:filled?20:15,opacity:wouldSpend?0.4:filled?1:0.2,filter:wouldSpend?'grayscale(0.5) brightness(1.5)':filled?'drop-shadow(0 0 6px rgba(200,152,56,0.7))':'grayscale(1)',transition:'all 0.25s'}}>{wouldSpend?'💨':'🔥'}</div>
        })}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:current>0?'var(--gold)':'var(--rot)',lineHeight:1}}><span key={'e-'+current} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{forecast&&forecast>0?afterCast+'/'+max:current+'/'+max}</span></div>
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
    const lt=parseInt(localStorage.getItem('vst_lifetime')||'0')
    // "real" = playable members (unlocked or score-unlocked), with locked flag cleared
    const real=getUnlockedMusicians().map(m=>m.locked&&isUnlocked(m.id,lt)?{...m,locked:false}:m)
    // "truly locked" = members the player hasn't unlocked yet
    const trulyLocked=ALL_MUSICIANS.filter(m=>m.locked&&!isUnlocked(m.id,lt))
    const shuffled=[...real].sort(()=>Math.random()-0.5)
    // Always exactly 1 truly locked card (if any exist), rest are playable
    const oneLocked=trulyLocked.length>0?[trulyLocked[Math.floor(Math.random()*trulyLocked.length)]]:[]
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
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>{IDLE_PORTRAITS[m.id]?<img src={IDLE_PORTRAITS[m.id]} alt={m.name} style={{width:70,height:70,objectFit:'contain',imageRendering:'pixelated'}}/>:MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={45} noSquiggle/>:m.emoji}</div>
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
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,color:kwc,fontWeight:900,textAlign:'center',letterSpacing:0.5,maxWidth:100}}>{kw}{(()=>{const _l=getMemberLegacy(m.id);return _l&&_l.runs>0?<div style={{fontSize:8,color:'#887755',marginTop:2}}>{_l.nickname||(_l.runs+' runs')}</div>:null})()}</div>
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
            ['DOUBLE TIME','#ff8800','🥁','Rolls d6 each fight: 5-6 doubles ATK (×2), 3-4 gives ×1.5. 1-2 is standard (×1). Never a penalty!'],
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
        <WeedLeaf size={16}/>
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
              <div style={{fontSize:44,textAlign:'center',padding:'14px 0',background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>{MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={45}/>:m.emoji}</div>
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
                  {cantSell?'Need 2+ members':<span style={{display:'inline-flex',alignItems:'center',gap:4}}>Sell for {price} <WeedLeaf size={13}/></span>}
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
                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>Sell for {price} <WeedLeaf size={13}/></span>
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

      <button onClick={onClose} style={{marginTop:30,fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,padding:'18px 60px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'#aa7030',cursor:'pointer',textTransform:'uppercase'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#c8a040'}}>
        Close Shop
      </button>
    </div>
  )
}

function ShopScreen({stash,onSpend,onLeave,circleArtifact,circlePassive,recruitPack,shopCards,boosterPacks,rerollCost,onReroll,fightIndex,activeArtifacts,activePassives,starterArtifacts,starterPassives,stage,deck,discardPile,onPawnSellMember,onPawnSellCard,onPawnBurnCard,soldIds,onMarkSold,circleCartBought,circleCpasBought,onBuyCart,onBuyCpas,heldShrooms,heldAcid,shroomsInStock,acidInStock,onBuyShrooms,onBuyAcid,corruption,chosenPacts,addLog}){
  const drugMax=isUnlocked('double_dealer')?2:1
  const [hovId,setHovId]=useState(null)
  const [pawnSalesLeft,setPawnSalesLeft]=useState(2)
  const [pawnOpen,setPawnOpen]=useState(false)
  const [boughtIds,setBoughtIds]=useState([])
  const [leftBought,setLeftBought]=useState({cart:false,cpas:false,rec:false})
  const [boughtPackIds,setBoughtPackIds]=useState([])
  const [packsBoughtThisVisit,setPacksBoughtThisVisit]=useState(0)
  const [shopTab,setShopTab]=useState('all') // all, cards, packs, gear
  const SLY_QUOTES=[
    "Five-finger discount on everything tonight.",
    "Don't ask, don't tell, don't bring cops.",
    "Got these off a guy who 'doesn't need em anymore'.",
    "You buy, you walk, you forget you saw me.",
    "I take stash, herb, blood — your call, kid.",
    "Cash only. And by cash I mean stash.",
    "My cousin works at the venue. Don't worry about it.",
    "Half off if you don't ask where it came from."
  ]
  const [slyQuoteIndex,setSlyQuoteIndex]=useState(()=>Math.floor(Math.random()*SLY_QUOTES.length))
  const [tearingPack,setTearingPack]=useState(null) // pack object while tear animation plays
  const [tearPhase,setTearPhase]=useState(0) // 0=anticipate, 1=rip, 2=fan, 3=sparks
  // Stash pulse — track direction of last change so the counter pops green (gain) or shakes red (loss)
  const [stashPulse,setStashPulse]=useState('')
  const prevStashRef=useRef(stash)
  useEffect(()=>{
    const prev=prevStashRef.current
    if(stash>prev)setStashPulse('gain')
    else if(stash<prev)setStashPulse('loss')
    prevStashRef.current=stash
    if(stash!==prev){const t=setTimeout(()=>setStashPulse(''),520);return()=>clearTimeout(t)}
  },[stash])
  useEffect(()=>{setBoughtIds([]);setBoughtPackIds([]);setPacksBoughtThisVisit(0);setSlyQuoteIndex(Math.floor(Math.random()*SLY_QUOTES.length))},[shopCards])
  const [openPackModal,setOpenPackModal]=useState(null) // {pack, cards, picksLeft, picked}
  const circleNum=Math.floor(fightIndex/3)+1
  const hungerActive=corruption>=50
  const hungerMult=hungerActive?1.25:1.0
  const merchDiscount=chosenPacts&&chosenPacts.includes('merchants_eye')?0.8:1.0
  const realPrice=p=>Math.ceil(p*merchDiscount*hungerMult)
  const can=p=>stash>=realPrice(p)
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
    if(packsBoughtThisVisit>=1){addLog&&addLog('🛑 Already bought a pack this visit. Come back next time.');return}
    if(tearingPack)return // guard: already tearing one
    setTearingPack(pack)
    setTearPhase(0)
    setTimeout(()=>setTearPhase(1),200)  // start rip
    setTimeout(()=>setTearPhase(2),500)  // cards fan
    setTimeout(()=>setTearPhase(3),800)  // sparks burst
    setTimeout(()=>{
      setTearingPack(null);setTearPhase(0)
      const {cards,picks}=genPackCards(pack)
      setOpenPackModal({pack,cards,picksLeft:picks,picked:[]})
    },1000)
  }

  function handlePickCard(card){
    if(!openPackModal)return
    const newPicked=[...openPackModal.picked,card]
    if(newPicked.length>=openPackModal.picksLeft){
      // Finalize — add picked cards and pay
      onSpend(openPackModal.pack.cost,'pack',{...openPackModal.pack,pickedCards:newPicked})
      setBoughtPackIds(p=>[...p,openPackModal.pack.id])
      setPacksBoughtThisVisit(1)
      setOpenPackModal(null)
    } else {
      setOpenPackModal(p=>({...p,picked:newPicked}))
    }
  }

  // ── SOLD OVERLAY ──
  function SoldOverlay({label}){
    const long=!!label&&label.length>5
    const txt=label||'SOLD!'
    const stampColor='#b81818'
    return(
      <div style={{position:'absolute',inset:0,zIndex:10,
        background:'rgba(0,0,0,0.55)',borderRadius:8,
        display:'flex',alignItems:'center',justifyContent:'center',
        pointerEvents:'none',overflow:'hidden'}}>
        {/* ink splatter — low-opacity red dots scattered around */}
        {long&&<div style={{position:'absolute',inset:0,pointerEvents:'none',
          background:'radial-gradient(circle at 22% 38%, rgba(184,24,24,0.28) 0 2px, transparent 3px),'+
            'radial-gradient(circle at 78% 28%, rgba(184,24,24,0.22) 0 3px, transparent 4px),'+
            'radial-gradient(circle at 18% 72%, rgba(184,24,24,0.20) 0 2px, transparent 3px),'+
            'radial-gradient(circle at 82% 74%, rgba(184,24,24,0.25) 0 4px, transparent 5px),'+
            'radial-gradient(circle at 52% 18%, rgba(184,24,24,0.18) 0 2px, transparent 3px),'+
            'radial-gradient(circle at 46% 88%, rgba(184,24,24,0.22) 0 3px, transparent 4px)'}}/>}
        <div style={{
          fontFamily:"'MBScribblesFont',serif",
          fontSize:long?28:38,fontWeight:900,
          color:stampColor,letterSpacing:long?3:4,
          textShadow:'1px 1px 0 rgba(120,12,12,0.85), -1px 0 2px rgba(184,24,24,0.7), 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(184,24,24,0.5)',
          transform:long?'rotate(-15deg) translate(-4px,3px)':'rotate(-45deg)',
          border:'4px solid '+stampColor,padding:long?'8px 16px':'6px 14px',
          borderRadius:4,background:'rgba(0,0,0,0.35)',
          filter:'blur(0.3px) contrast(1.15)',
          whiteSpace:long?'normal':'nowrap',
          maxWidth:long?'82%':'auto',textAlign:'center',lineHeight:1.05,
          boxShadow:'0 0 0 1px rgba(184,24,24,0.3), inset 0 0 8px rgba(184,24,24,0.2)'}}>{txt}</div>
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
          {card.upgraded&&<div style={{position:'absolute',bottom:6,right:6,width:28,height:28,borderRadius:4,background:'rgba(0,0,0,0.7)',border:'2px solid #ffd700',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#ffd700',boxShadow:'0 0 14px rgba(255,200,0,0.6),0 0 30px rgba(255,200,0,0.2)',textShadow:'0 0 8px rgba(255,200,0,0.8)'}}>⛧</div>}
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
            lineHeight:1.45,flex:1}}>{card.id==='demotape'?(lastRiffPlayed?'📼 Will replay: '+lastRiffPlayed.name+' (free)':'📼 No riff recorded yet — play a RIFF card first'):(<>{card.effect||card.desc||''}{card.upgraded&&CARD_UPGRADES[card.id]&&<div style={{marginTop:4,padding:'3px 8px',background:'rgba(255,200,0,0.12)',border:'1px solid rgba(255,200,0,0.3)',borderRadius:4,color:'#ffd700',fontSize:12,fontWeight:700}}>⛧ {CARD_UPGRADES[card.id].desc}</div>}</>)}</div>
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
        {/* Pawn-shop price tag — pinned to top-right corner, tied by string */}
        <div style={{position:'absolute',top:-6,right:10,zIndex:15,pointerEvents:'none'}}>
          {/* string from tag to card edge */}
          <div style={{position:'absolute',top:8,right:-12,width:14,height:1,background:'#000',opacity:0.8,transform:'rotate(18deg)'}}/>
          <div style={{transform:'rotate('+(((idx*7)%7)-3)+'deg)',
            background:canBuy?'#d4b830':'#6a5a18',
            border:'1.5px solid #000',boxShadow:'2px 3px 6px rgba(0,0,0,0.65)',
            padding:'3px 10px 4px',borderRadius:2,whiteSpace:'nowrap',minWidth:58,textAlign:'center',
            position:'relative'}}>
            {/* hole + string knot */}
            <div style={{position:'absolute',top:3,left:4,width:6,height:6,borderRadius:'50%',background:'#1a1408',border:'1px solid #000'}}/>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,fontWeight:900,color:'#1a1408',lineHeight:1,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{hungerActive?<><span style={{textDecoration:'line-through',opacity:0.6,fontSize:13}}>{price}</span> <WeedLeaf size={14}/>{realPrice(price)}</>:<><WeedLeaf size={14}/> {price}</>}</div>
            {hungerActive&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:9,color:'#8a1010',fontWeight:900,letterSpacing:0.5,marginTop:-1}}>⚠ HUNGER +25%</div>}
          </div>
        </div>
        <div onClick={()=>canBuy&&!bought&&buyCard(card)}
          style={{flex:1,minHeight:420,display:'flex',flexDirection:'column',position:'relative',
            background:'linear-gradient(180deg,#201408,#100804)',
            border:hov&&canBuy&&!bought?'2px solid '+bc:'1px solid '+bc+'55',
            borderRadius:8,overflow:'hidden',
            cursor:canBuy&&!bought?'pointer':'default',
            transform:hov&&canBuy&&!bought?'translateY(-6px) scale(1.02)':'none',
            transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
            boxShadow:hov&&canBuy&&!bought?'0 16px 48px rgba(0,0,0,0.95),0 0 28px '+gl:'2px 4px 16px rgba(0,0,0,0.7)',
            animation:bought?'':'throbShop 4.5s ease-in-out infinite',opacity:!canBuy&&!bought?0.4:1}}>
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
          {/* Card compare — how many copies already in deck */}
          {!card.isMember&&(()=>{const inDeck=[...deck,...discardPile].filter(c=>c.id===card.id).length;return inDeck>0?<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:2,textTransform:'uppercase',textAlign:'center',padding:'4px 8px',color:'#88aa66',borderTop:'1px solid rgba(255,255,255,0.05)'}}>IN DECK: {inDeck} {inDeck>=3?'(STACKED!)':''}</div>:<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,letterSpacing:2,textTransform:'uppercase',textAlign:'center',padding:'4px 8px',color:'#887744',borderTop:'1px solid rgba(255,255,255,0.05)'}}>NEW CARD</div>})()}
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
  function LeftCard({item,price,label,accent,id,onBuy,sold,visitLocked}){
    const hov=hovId===id
    const canBuy=can(price)&&!sold&&!visitLocked
    const ac=accent||'#c87820'
    return(
      <div style={{flex:'1 1 0',display:'flex',flexDirection:'column',paddingTop:8,position:'relative',minHeight:0,maxHeight:200}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        {/* Pawn-shop price tag — pinned to top-right, tied by string */}
        <div style={{position:'absolute',top:-6,right:6,zIndex:15,pointerEvents:'none',transform:hov&&canBuy?'scale(1.08)':'none',transition:'transform 0.12s'}}>
          <div style={{position:'absolute',top:6,right:-10,width:12,height:1,background:'#000',opacity:0.8,transform:'rotate(18deg)'}}/>
          <div style={{transform:'rotate('+((id.charCodeAt(0)%7)-3)+'deg)',
            background:canBuy?'#d4b830':'#6a5a18',
            border:'1.5px solid #000',boxShadow:'2px 3px 5px rgba(0,0,0,0.6)',
            padding:'2px 8px 3px',borderRadius:2,whiteSpace:'nowrap',minWidth:48,textAlign:'center',
            position:'relative'}}>
            <div style={{position:'absolute',top:3,left:3,width:4,height:4,borderRadius:'50%',background:'#1a1408',border:'1px solid #000'}}/>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:13,fontWeight:900,color:'#1a1408',lineHeight:1,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{hungerActive?<><span style={{textDecoration:'line-through',opacity:0.6,fontSize:10}}>{price}</span> <WeedLeaf size={11}/>{realPrice(price)}</>:<><WeedLeaf size={11}/> {price}</>}</div>
          </div>
        </div>
        <div onClick={()=>canBuy&&onBuy()}
          style={{flex:1,position:'relative',display:'flex',flexDirection:'column',
            background:'linear-gradient(180deg,#1c1408,#0e0a04)',
            border:hov&&canBuy?'2px solid '+ac:'1px solid '+ac+(canBuy?'88':'44'),
            borderTop:'4px solid '+ac,borderRadius:8,overflow:'hidden',
            cursor:canBuy?'pointer':'default',opacity:canBuy?1:0.4,
            transform:hov&&canBuy?'translateY(-3px)':'none',
            transition:'transform 0.15s,border-color 0.15s,box-shadow 0.15s',
            boxShadow:hov&&canBuy?'0 10px 30px rgba(0,0,0,0.8),0 0 16px '+ac+'44':'2px 4px 14px rgba(0,0,0,0.6)',
            animation:'throbLeft 4.5s ease-in-out infinite'}}>
          {sold&&<SoldOverlay/>}
          {visitLocked&&!sold&&<SoldOverlay label="SOLD OUT THIS VISIT"/>}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,letterSpacing:2,
            color:ac,textAlign:'center',padding:'4px 4px 0',
            textTransform:'uppercase',opacity:1,flexShrink:0}}>{label}</div>
          <div style={{flex:'0 0 auto',display:'flex',alignItems:'center',justifyContent:'center',padding:'4px 0',
            fontSize:36,filter:hov&&canBuy?'drop-shadow(0 0 12px '+ac+')':'none',
            transition:'filter 0.15s'}}>{item.emoji}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,
            color:'#ffe8a0',textAlign:'center',padding:'0 6px',
            lineHeight:1.2,flexShrink:0}}>{item.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,
            color:'#d0b880',textAlign:'center',padding:'2px 6px 4px',
            lineHeight:1.25,flex:1,overflow:'hidden'}}>{item.effect||item.desc||''}</div>
        </div>
      </div>
    )
  }

  // ── BOOSTER PACK ──
  function BoosterPack({pack,idx}){
    const id='bp'+idx
    const hov=hovId===id
    const bought=boughtPackIds.includes(pack.id)
    const visitLocked=!bought&&packsBoughtThisVisit>=1
    const canBuy=can(pack.cost)&&!bought&&!visitLocked
    const packAc={cassette:'#c87820',cdr:'#6688cc',vinyl:'#cc44ff',rarevinyl:'#ffdd44',cursed:'#cc2222',ritual:'#8844cc',hellforged:'#ff6600',garage:'#44aa44',touring:'#44aacc',demonic:'#cc44ff'}
    const ac=packAc[pack.id]||'#c87820'
    return(
      <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',paddingTop:24,position:'relative'}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        {/* Pawn-shop price tag — pinned to top-right, tied by string */}
        <div style={{position:'absolute',top:-6,right:10,zIndex:15,pointerEvents:'none',transform:hov&&canBuy?'scale(1.08)':'none',transition:'transform 0.12s'}}>
          <div style={{position:'absolute',top:8,right:-12,width:14,height:1,background:'#000',opacity:0.8,transform:'rotate(18deg)'}}/>
          <div style={{transform:'rotate('+(((idx*5)%7)-3)+'deg)',
            background:canBuy?'#d4b830':'#6a5a18',
            border:'1.5px solid #000',boxShadow:'2px 3px 6px rgba(0,0,0,0.65)',
            padding:'3px 10px 4px',borderRadius:2,whiteSpace:'nowrap',minWidth:58,textAlign:'center',
            position:'relative'}}>
            <div style={{position:'absolute',top:3,left:4,width:6,height:6,borderRadius:'50%',background:'#1a1408',border:'1px solid #000'}}/>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,fontWeight:900,color:'#1a1408',lineHeight:1,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{hungerActive?<><span style={{textDecoration:'line-through',opacity:0.6,fontSize:12}}>{pack.cost}</span> <WeedLeaf size={14}/>{realPrice(pack.cost)}</>:<><WeedLeaf size={14}/> {pack.cost}</>}</div>
          </div>
        </div>
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
            animation:bought||visitLocked?'':'throbShop 4.5s ease-in-out infinite',opacity:!canBuy&&!bought&&!visitLocked?0.4:visitLocked?0.55:1}}>
          {bought&&<SoldOverlay/>}
          {visitLocked&&<SoldOverlay label="SOLD OUT THIS VISIT"/>}
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
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,letterSpacing:3,
            color:'var(--ink-dim)',textTransform:'uppercase',textAlign:'center',
            padding:'6px 10px 0',flexShrink:0}}>⛧ Contains ⛧</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,
            color:'#c8a878',textAlign:'center',
            lineHeight:1.4,padding:'4px 10px 0',flex:1}}>{pack.desc}</div>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:6,
            background:'linear-gradient(90deg,'+ac+'44,'+ac+'ee,'+ac+'44)'}}/>
        </div>
      </div>
    )
  }

  // ── TEARING PACK OVERLAY — Pokemon-style 1s reveal before the picker ──
  const TearingPackOverlay=()=>{
    if(!tearingPack)return null
    const pack=tearingPack
    const packAc={cassette:'#c87820',cdr:'#6688cc',vinyl:'#cc44ff',rarevinyl:'#ffdd44',cursed:'#cc2222',ritual:'#8844cc',hellforged:'#ff6600',garage:'#44aa44',touring:'#44aacc',demonic:'#cc44ff'}
    const ac=packAc[pack.id]||'#c87820'
    const fanTargets=[
      {dx:-200,dy:30,drot:-18},
      {dx:-100,dy:6,drot:-9},
      {dx:0,dy:-4,drot:0},
      {dx:100,dy:6,drot:9},
      {dx:200,dy:30,drot:18},
    ]
    const sparks=Array.from({length:8},(_,i)=>{
      const a=(i/8)*Math.PI*2
      return{sx:Math.cos(a)*170,sy:Math.sin(a)*170}
    })
    return(
      <div style={{position:'absolute',inset:0,zIndex:9700,pointerEvents:'none',
        display:'flex',alignItems:'center',justifyContent:'center',
        background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)'}}>
        <div style={{position:'relative',width:260,height:340}}>
          {/* Pack body — anticipate then rip */}
          <div style={{position:'absolute',inset:0,
            background:'linear-gradient(160deg,#12100a 0%,#1e1a0e 40%,#120e08 100%)',
            border:'3px solid '+ac,borderRadius:10,overflow:'hidden',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,
            boxShadow:'0 0 48px '+ac+'cc, inset 0 0 30px rgba(0,0,0,0.5)',
            animation:tearPhase===0?'packAnticipate 200ms ease-out forwards':'none',
            transform:tearPhase>=1?'scale(1.12)':undefined,
            clipPath:tearPhase>=1?'polygon(0 0, 100% 0, 92% 12%, 78% 22%, 86% 36%, 72% 50%, 84% 64%, 70% 78%, 88% 90%, 100% 100%, 0 100%)':'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            transition:'clip-path 300ms ease-out'}}>
            <div style={{fontSize:96,filter:'drop-shadow(0 0 16px '+ac+'99)'}}>{pack.emoji}</div>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:26,color:ac,textShadow:'0 0 14px '+ac+'99',letterSpacing:2,textAlign:'center',padding:'0 8px'}}>{pack.name}</div>
          </div>
          {/* Foil flash overlay during rip */}
          {tearPhase===1&&<div style={{position:'absolute',inset:-20,pointerEvents:'none',
            background:'radial-gradient(circle at 50% 50%, rgba(255,230,120,0.95) 0%, rgba(255,180,50,0.45) 38%, transparent 72%)',
            animation:'packTearFlash 300ms ease-out forwards',mixBlendMode:'screen'}}/>}
          {/* Cards fan out */}
          {tearPhase>=2&&fanTargets.map((t,i)=>(
            <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:92,height:130,
              marginLeft:-46,marginTop:-65,
              background:'linear-gradient(180deg,#2a1408,#0a0604)',
              border:'2px solid '+ac,borderRadius:6,
              ['--dx']:t.dx+'px',['--dy']:t.dy+'px',
              ['--drot']:t.drot+'deg',['--drot-start']:(t.drot*0.3-30)+'deg',
              animation:'packCardFan 320ms cubic-bezier(0.34,1.56,0.64,1) forwards',
              animationDelay:(i*50)+'ms',animationFillMode:'both',
              boxShadow:'0 8px 20px rgba(0,0,0,0.85), 0 0 16px '+ac+'55',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:ac+'cc'}}>⛧</div>
          ))}
          {/* Spark particles */}
          {tearPhase>=3&&sparks.map((s,i)=>(
            <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:12,height:12,
              marginLeft:-6,marginTop:-6,borderRadius:'50%',
              background:'radial-gradient(circle, #ffffff 0%, rgba(255,220,120,0.85) 40%, transparent 70%)',
              ['--sx']:s.sx+'px',['--sy']:s.sy+'px',
              animation:'packSparkBurst 220ms ease-out forwards',
              boxShadow:'0 0 12px rgba(255,230,140,0.9)'}}/>
          ))}
        </div>
      </div>
    )
  }

  return(
    <>
    <PackModal/>
    <TearingPackOverlay/>
    <div style={{position:'absolute',inset:0,zIndex:9500,
      background:'radial-gradient(ellipse at 50% 0%,rgba(28,18,4,1) 0%,rgba(6,4,1,1) 100%)',
      overflow:'hidden',boxSizing:'border-box',height:1080}}>
      {/* BACKGROUND ATMOSPHERE — dirty brick stripes, streetlight corners, drifting dust */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,
        backgroundImage:'repeating-linear-gradient(0deg, rgba(80,40,20,0.06) 0 22px, transparent 22px 24px, rgba(60,30,15,0.05) 24px 46px, transparent 46px 48px),'+
          'repeating-linear-gradient(90deg, rgba(40,20,10,0.07) 0 62px, transparent 62px 64px)',
        opacity:0.45}}/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,
        background:'radial-gradient(ellipse at 0% 0%, rgba(220,170,60,0.09) 0%, transparent 30%),'+
          'radial-gradient(ellipse at 100% 0%, rgba(220,170,60,0.08) 0%, transparent 32%),'+
          'radial-gradient(ellipse at 0% 100%, rgba(180,120,30,0.06) 0%, transparent 34%),'+
          'radial-gradient(ellipse at 100% 100%, rgba(180,120,30,0.06) 0%, transparent 34%)'}}/>
      <div style={{position:'absolute',top:'18%',left:'-8%',width:180,height:180,pointerEvents:'none',zIndex:0,
        background:'radial-gradient(circle, rgba(220,200,180,0.5) 0%, transparent 70%)',
        filter:'blur(6px)',animation:'dustDrift 32s ease-in-out infinite'}}/>
      <div style={{position:'absolute',top:'62%',left:'30%',width:140,height:140,pointerEvents:'none',zIndex:0,
        background:'radial-gradient(circle, rgba(220,200,180,0.4) 0%, transparent 70%)',
        filter:'blur(6px)',animation:'dustDrift 46s ease-in-out infinite reverse'}}/>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:8,padding:'10px 12px',
        fontFamily:"'MBScribblesFont',serif",height:'100%',boxSizing:'border-box',
        overflowY:'auto',overflowX:'hidden',
        boxShadow:'inset 0 12px 16px -8px rgba(0,0,0,0.7), inset 0 -12px 16px -8px rgba(0,0,0,0.7)'}}>

      {/* ORNAMENTAL FRIEZE — TOP */}
      <div style={{flexShrink:0,height:18,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.85,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderBottom:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(180deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>

      {/* TOP BAR — STASH · RIBBON+TAGLINE+SLY · REROLL · NEXT FIGHT */}
      <div style={{flexShrink:0,display:'flex',gap:10,alignItems:'center',padding:'2px 4px'}}>
        {/* STASH — crumpled bills (slapped-on sticker, -2deg) */}
        <div title="Your dirty money."
          style={{width:150,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,padding:'8px 10px',
            background:'linear-gradient(160deg,#1a2010,#0c1408)',
            border:'2px solid var(--gold)',borderRadius:6,
            transform:'rotate(-2deg)',
            boxShadow:'0 0 16px rgba(200,160,40,0.28), inset 0 0 12px rgba(60,40,0,0.4), 2px 3px 8px rgba(0,0,0,0.6)'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>Stash</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:20}}>💵</span>
            <WeedLeaf size={28} style={{marginLeft:-2}}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:stashColor,lineHeight:1,display:'inline-block',
              textShadow:stashPulse==='gain'?'0 0 22px rgba(80,220,100,1),0 0 40px rgba(80,220,100,0.5)':stashPulse==='loss'?'0 0 14px rgba(220,60,60,0.85)':'0 0 10px '+stashColor+'55',
              animation:stashPulse==='gain'?'stashGain 520ms ease-out':stashPulse==='loss'?'stashLoss 420ms ease-out':'none'}}>{stash}</span>
          </div>
        </div>

        {/* RIBBON + TAGLINE + SLY QUOTE */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
          <div style={{position:'relative',width:'94%',minWidth:420,maxWidth:820,height:54,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} preserveAspectRatio="none" viewBox="0 0 960 54">
              <path d="M 0 27 L 30 6 L 60 18 L 900 18 L 930 6 L 960 27 L 930 48 L 900 36 L 60 36 L 30 48 Z" fill="rgba(60,0,15,0.82)" stroke="var(--blood)" strokeWidth="0.8" opacity="0.95"/>
              <path d="M 60 18 Q 240 15, 480 18 T 900 18" stroke="var(--blood)" strokeWidth="0.7" fill="none" opacity="0.55"/>
              <path d="M 60 36 Q 240 39, 480 36 T 900 36" stroke="var(--blood)" strokeWidth="0.7" fill="none" opacity="0.55"/>
            </svg>
            <span style={{position:'relative',zIndex:1,fontFamily:"'BogartsMetalFont',cursive",fontSize:34,color:'var(--blood)',letterSpacing:4,textTransform:'uppercase',whiteSpace:'nowrap',animation:'neonFlicker 4.5s ease-in-out infinite'}}>🚬 SLY'S MERCH 🚬</span>
          </div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:14,color:'var(--ink-dim)',fontStyle:'italic',letterSpacing:0.5,transform:'rotate(-1deg)'}}>Hey kid... wanna see what fell off the truck?</div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:12,color:'var(--ink-rust)',fontStyle:'italic',letterSpacing:0.3,marginTop:1}}>"{SLY_QUOTES[slyQuoteIndex]}" —Sly</div>
        </div>

        {/* ANOTHER LOOK (reroll) — pill badge */}
        <div onClick={onReroll} title="Sly shuffles the merch."
          onMouseEnter={e=>{e.currentTarget.style.animation='none';e.currentTarget.style.background='rgba(55,40,8,0.95)'}}
          onMouseLeave={e=>{e.currentTarget.style.animation='rerollWiggle 3s ease-in-out infinite';e.currentTarget.style.background='rgba(25,18,4,0.92)'}}
          style={{width:128,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,padding:'8px 6px',
            background:'rgba(25,18,4,0.92)',border:'2px solid rgba(200,150,30,0.85)',borderRadius:8,cursor:'pointer',
            boxShadow:'0 0 16px rgba(180,130,20,0.3)',animation:'rerollWiggle 3s ease-in-out infinite'}}>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#e8c040',letterSpacing:2,textTransform:'uppercase'}}>🎲 Another Look</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'#e8c040',lineHeight:1}}>{hungerActive?<><span style={{textDecoration:'line-through',opacity:0.4,fontSize:12}}>{rerollCost}</span> <WeedLeaf size={14}/> {realPrice(rerollCost)}</>:<><WeedLeaf size={14}/> {rerollCost}</>}</span>
        </div>

        {/* BACK TO THE PIT — blood-dripping */}
        <button onClick={onLeave}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,15,15,0.55)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(120,8,8,0.35)'}}
          style={{width:176,flexShrink:0,height:80,
            fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:2,
            background:'rgba(120,8,8,0.35)',border:'3px solid var(--blood)',borderRadius:8,
            color:'var(--ink-bone)',cursor:'pointer',textTransform:'uppercase',
            transition:'background 0.15s',
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            animation:'dripGlow 2.2s ease-in-out infinite',
            boxShadow:'0 0 24px rgba(196,30,58,0.5), 0 6px 18px rgba(120,0,10,0.45), inset 0 0 18px rgba(150,0,20,0.25)'}}>
          <span style={{fontSize:18,color:'var(--blood)',textShadow:'0 0 10px rgba(196,30,58,0.8)'}}>⛧</span>
          <span>🚪 Back to the Pit</span>
          <span style={{fontSize:18,color:'var(--blood)',textShadow:'0 0 10px rgba(196,30,58,0.8)'}}>⛧</span>
        </button>
      </div>

      {/* SHOP TABS — bigger, gold underline on active */}
      <div style={{flexShrink:0,display:'flex',gap:4,justifyContent:'center',padding:'0 12px',borderBottom:'1px solid rgba(100,80,40,0.2)'}}>
        {[['all','All'],['cards','Cards'],['packs','Packs'],['gear','Gear']].map(([id,label])=>
          <button key={id} onClick={()=>setShopTab(id)}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,letterSpacing:3,
              color:shopTab===id?'var(--ink-bone)':'var(--ink-dim)',
              background:'transparent',
              border:'none',
              borderBottom:shopTab===id?'3px solid var(--gold)':'3px solid transparent',
              padding:'8px 22px 6px',cursor:'pointer',textTransform:'uppercase',
              transition:'all 0.15s'}}>{label}</button>)}
      </div>

      {/* MAIN */}
      <div style={{flex:'1 1 0',display:'flex',gap:10,minHeight:0,overflow:'hidden'}}>

        {/* LEFT COLUMN — gear (FROM THE BACK ROOM) */}
        <div style={{width:240,flexShrink:0,display:shopTab==='cards'||shopTab==='packs'?'none':'flex',flexDirection:'column',gap:4,minHeight:0}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,letterSpacing:3,color:'var(--gold)',textAlign:'center',textTransform:'uppercase',fontWeight:900,padding:'4px 0 0',textShadow:'0 0 8px rgba(200,152,56,0.4)'}}>🔦 From the Back Room</div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',padding:'0 0 4px',borderBottom:'1px solid rgba(200,152,56,0.35)'}}>(Don't tell the boss.)</div>
          <LeftCard item={recruitPack} price={recruitPack.cost}
            label="Band Recruitment" accent='#e8a820' id='rec' sold={leftBought.rec===true}
            visitLocked={packsBoughtThisVisit>=1&&leftBought.rec!==true}
            onBuy={()=>{
              if(packsBoughtThisVisit>=1){addLog&&addLog('🛑 Already bought a pack this visit. Come back next time.');return}
              if(can(recruitPack.cost)){onSpend(recruitPack.cost,'recruit',recruitPack);setLeftBought(p=>({...p,rec:true}));setPacksBoughtThisVisit(1)}
            }} />
          {circleArtifact&&<div className="sigil-divider" style={{fontSize:11}}>· ⛧ ·</div>}
          {circleArtifact&&<LeftCard item={circleArtifact} price={circleArtifact.cost}
            label={'Vintage Amp · C'+circleNum} accent='#c87820' id='cart'
            sold={leftBought.cart||!!circleCartBought||activeArtifacts.some(a=>a.id===circleArtifact.id)||(soldIds||[]).includes(circleArtifact.id)}
            onBuy={()=>buyLeft('cart',circleArtifact.cost,'artifact',circleArtifact)} />}
          {circlePassive&&<div className="sigil-divider" style={{fontSize:11}}>· ⛧ ·</div>}
          {circlePassive&&<LeftCard item={circlePassive} price={circlePassive.cost}
            label={'Effect Pedal · C'+circleNum} accent='#9933cc' id='cpas'
            sold={leftBought.cpas||!!circleCpasBought||activePassives.some(p=>p.id===circlePassive.id)||(soldIds||[]).includes(circlePassive.id)}
            onBuy={()=>buyLeft('cpas',circlePassive.cost,'passive',circlePassive)} />}
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>

          {/* CARDS ROW */}
          <div style={{display:shopTab==='packs'||shopTab==='gear'?'none':'block',border:'1px solid rgba(160,110,35,0.3)',borderRadius:8,padding:'8px 12px 12px',background:'rgba(10,6,2,0.3)'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#c8a040',letterSpacing:3,textTransform:'uppercase',textAlign:'center',marginBottom:4}}>🎸 Cards For Sale (★ = good deal)</div>
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
                  textShadow:'0 0 18px rgba(60,200,60,0.8)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><WeedLeaf size={26}/> Sly's Stash</div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:12,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',padding:'2px 6px 6px',letterSpacing:0.5}}>"The good shit. Don't ask where it came from."</div>
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
                    color:shroomsInStock&&heldShrooms<drugMax&&can(6)?'#55ee55':'#554428',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{hungerActive?<><span style={{textDecoration:'line-through',opacity:0.4,fontSize:9}}>6</span> <WeedLeaf size={12}/> {realPrice(6)}</>:<><WeedLeaf size={12}/> 6</>}</div>
                  <div style={{fontSize:72,filter:shroomsInStock&&heldShrooms<drugMax?'drop-shadow(0 0 10px rgba(200,150,50,0.6))':'none',animation:shroomsInStock&&heldShrooms<drugMax?'shroomPulse 2.4s ease-in-out infinite':'none'}}>🍄</div>
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
                    color:acidInStock&&heldAcid<drugMax&&can(12)?'#55ee55':'#554428',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{hungerActive?<><span style={{textDecoration:'line-through',opacity:0.4,fontSize:9}}>12</span> <WeedLeaf size={12}/> {realPrice(12)}</>:<><WeedLeaf size={12}/> 12</>}</div>
                  <div style={{fontSize:72,filter:acidInStock&&heldAcid<drugMax?'drop-shadow(0 0 10px rgba(150,50,220,0.6))':'none',animation:acidInStock&&heldAcid<drugMax?'shroomPulse 2.4s ease-in-out infinite':'none'}}>🧪</div>
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
          <div style={{display:shopTab==='cards'||shopTab==='gear'?'none':'block',border:'1px solid rgba(160,110,35,0.3)',borderRadius:8,padding:'8px 12px 12px',background:'rgba(10,6,2,0.3)'}}>
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
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,
                  color:'#9944dd',textAlign:'center',marginBottom:4,
                  textShadow:'0 0 18px rgba(160,80,240,0.8)'}}>💸 Sly's Buyback</div>
                <div style={{fontSize:32,textAlign:'center',margin:'2px 0 4px'}}>🏧</div>
                {/* 2-column rate sheet */}
                <div style={{padding:'6px 22px',fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#cc88ff',letterSpacing:1}}>
                  {[['Common','1',true],['Uncommon','2',true],['Rare','4',true],['Foil','+3',true],['Mythic','+8',true],['Member','5',true],['Artifact','50% buyback',false]].map(([k,v,leaf])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0',borderBottom:'1px dashed rgba(200,140,255,0.18)'}}>
                      <span style={{fontWeight:700}}>{k}</span>
                      <span style={{fontWeight:900,color:'#e8aaff',fontVariantNumeric:'tabular-nums',display:'inline-flex',alignItems:'center',gap:3}}>{v}{leaf&&<WeedLeaf size={14}/>}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',marginTop:6,letterSpacing:0.5,padding:'0 12px'}}>
                  —No questions asked. Sly takes a cut.
                </div>
                <div style={{fontFamily:"'ScratchFont',serif",fontSize:10,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',marginTop:2,letterSpacing:0.5,padding:'0 12px',opacity:0.8}}>
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
                💸 Sell Your Shit ({pawnSalesLeft} left)
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
          </div>
          </div>

        </div>

      </div>

      {/* ORNAMENTAL FRIEZE — BOTTOM */}
      <div style={{flexShrink:0,height:16,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'16px',textTransform:'uppercase',opacity:0.7,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderTop:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(0deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
      </div>
    </div>
    </>
  )
}

function StageSlot({member,isAttacking,isStriking,isHit,strikeAnim,isDiceTarget,onDrop,onDragOver,onDragStart,innerRef,bondColor,mentorState,corruption,animPhase,ghostCard,onQuickPlay}){
  const [over,setOver]=useState(false)
  const [showTip,setShowTip]=useState(false)
  if(!member){
    return <div ref={innerRef} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}}
      style={{width:240,height:340,border:over?'1px dashed rgba(232,168,32,0.5)':'1px dashed rgba(90,56,32,0.18)',borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,background:over?'rgba(100,70,15,0.10)':'transparent',transition:'all 0.2s',position:'relative'}}>
      {/* Faint pentagram seal */}
      <svg width="80" height="80" viewBox="0 0 80 80" style={{opacity:over?0.35:0.12}}>
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--ink-rust)" strokeWidth="0.8"/>
        <path d="M 40 12 L 65 58 L 16 30 L 64 30 L 15 58 Z" fill="none" stroke="var(--ink-rust)" strokeWidth="0.8"/>
      </svg>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,letterSpacing:4,color:'var(--ink-rust)',textTransform:'uppercase',opacity:over?0.7:0.25}}>Empty</div>
    </div>
  }
  const st=member.tooStoned
  const nearDeath=!st&&member.hp<=Math.ceil(member.maxHp*0.25)&&member.hp>0
  const buffCount=member.buffCount||0
  return(
    <div ref={innerRef} draggable onDragStart={onDragStart} onClick={onQuickPlay} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}} onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}
      style={{width:240,height:340,display:'flex',flexDirection:'column',background:st?'linear-gradient(180deg,#1a1a1a,#0a0a0a)':'linear-gradient(180deg, var(--altar-raised), var(--altar-recess))',
        border:isDiceTarget?'3px solid #e8a820':isAttacking?'2px solid #ff3300':mentorState==='active'?'3px solid #ffd700':mentorState==='broken'?'2px solid #555':mentorState==='mentor'?'2px solid #ffd700':bondColor?'2px solid '+bondColor:over?'2px solid #e8a820':st?'1px solid #333':member.demonic?'2px solid #ffd700':member.mythic?'2px solid #cc44ff':member.foil?'2px solid #88ccff':'1px solid rgba(190,120,25,0.08)',
        borderRadius:6,
        boxShadow:isDiceTarget?'0 0 30px rgba(232,168,32,0.7)':isAttacking?'0 0 40px rgba(255,50,0,0.8)':mentorState==='active'&&!st?'0 0 40px rgba(255,215,0,0.9),0 6px 24px rgba(0,0,0,0.85)':mentorState==='mentor'&&!st?'0 0 22px rgba(255,215,0,0.5),0 6px 24px rgba(0,0,0,0.85)':bondColor&&!st?'0 0 20px '+bondColor+',0 6px 24px rgba(0,0,0,0.85)':!st&&member.demonic?'0 0 25px rgba(255,200,0,0.5),0 6px 24px rgba(0,0,0,0.85)':!st&&member.mythic?'0 0 25px rgba(200,0,255,0.4),0 6px 24px rgba(0,0,0,0.85)':!st&&member.foil?'0 0 20px rgba(100,180,255,0.35),0 6px 24px rgba(0,0,0,0.85)':'0 4px 20px rgba(0,0,0,0.9),0 0 1px rgba(190,120,25,0.3)',
        transform:st?'rotate(15deg) scale(0.95)':strikeAnim&&strikeAnim.phase==='dip'?'translateY(20px) scale(0.95) rotate(-3deg)':strikeAnim&&strikeAnim.phase==='wiggle'?'translateY(12px) scale(0.97) rotate(4deg)':strikeAnim&&strikeAnim.phase==='launch'?'translate('+strikeAnim.dx+'px,'+(strikeAnim.dy-80)+'px) scale(0.7) rotate(-5deg)':strikeAnim&&strikeAnim.phase==='impact'?'translate('+strikeAnim.dx+'px,'+strikeAnim.dy+'px) scale(1.15) rotate(0deg)':strikeAnim&&strikeAnim.phase==='return'?'translate(0px,-30px) scale(1.05)':'none',
        filter:st?'grayscale(0.8) brightness(0.5)':(strikeAnim&&strikeAnim.phase==='launch'?'blur(1.5px) drop-shadow(0 0 18px rgba(255,80,0,0.6))':'none'),
        opacity:st?0.6:animPhase==='idle'&&!isAttacking&&buffCount===0?0.7:1,
        animation:isHit?'memberHitShake 0.4s ease-out':(!st&&!isAttacking&&!isDiceTarget&&!isStriking)?(nearDeath?'nearDeathPulse 0.8s ease-in-out infinite':'throb 3s ease-in-out infinite'):'none',
        transition:strikeAnim?'transform 0.25s cubic-bezier(0.2,0.8,0.3,1.2), border 0.2s, box-shadow 0.2s, opacity 0.3s':'border 0.2s, box-shadow 0.2s, opacity 0.3s, transform 0.3s',
        cursor:'grab',position:'relative'}}>
      {/* Keyword tooltip */}
      {showTip&&member&&KEYWORD_DESC[member.keyword]&&<div style={{position:'absolute',top:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',background:'rgba(8,4,2,0.97)',border:'1px solid rgba(196,30,58,0.5)',borderRadius:3,padding:'8px 12px',zIndex:99999,pointerEvents:'none',minWidth:180,maxWidth:260,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'var(--gold)',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{member.keyword}</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'var(--ink-bone)',lineHeight:1.4}}>{KEYWORD_DESC[member.keyword]}</div>{member.bio&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'var(--ink-dim)',lineHeight:1.4,fontStyle:'italic',marginTop:6,paddingTop:6,borderTop:'1px solid rgba(100,60,20,0.3)'}}>{member.bio}</div>}</div>}
      {buffCount>0&&<div style={{position:'absolute',top:6,left:6,background:buffCount>=3?'#aa1111':'#9933cc',borderRadius:10,padding:'1px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#fff',zIndex:10,boxShadow:'0 0 8px rgba(0,0,0,0.6)'}}>+{buffCount}</div>}
      {isDiceTarget&&<div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:20}}>🎯</div>}
      {mentorState==='active'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:18,textShadow:'0 0 12px #ffd700',zIndex:12,animation:'mentorPulse 1.5s ease-in-out infinite'}}>⛓</div>}
      {mentorState==='broken'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:16,opacity:0.45,zIndex:12}}>💔</div>}
      {mentorState==='mentor'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:18,textShadow:'0 0 8px rgba(255,215,0,0.6)',zIndex:12}}>⛓</div>}
      {st&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:15,pointerEvents:'none'}}>
        <div style={{fontSize:64,opacity:0.7,animation:'fadeIn 0.5s ease',textShadow:'0 0 20px rgba(0,0,0,0.9)'}}>💀</div>
      </div>}
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
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:68,background:'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45))',position:'relative',minHeight:200,overflow:'hidden'}}>
        {STAGE_PORTRAITS[member.id]?<img className={animPhase==='idle'?'':'squiggle'} src={animPhase==='idle'&&IDLE_PORTRAITS[member.id]?IDLE_PORTRAITS[member.id]:STAGE_PORTRAITS[member.id]} alt={member.id} style={{width:'95%',height:'95%',objectFit:'contain',objectPosition:'center center',imageRendering:'pixelated'}}/>:member.emoji}
        {st&&<div style={{position:'absolute',top:4,right:4,fontSize:22}}>💨</div>}
        {isAttacking&&<div style={{position:'absolute',inset:0,background:strikeAnim?'rgba(196,30,58,0.3)':'rgba(196,30,58,0.12)',animation:strikeAnim?'pulse 0.15s ease infinite alternate':'pulse 0.4s ease infinite alternate'}}/>}
        {/* Name overlay on portrait bottom */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 6px 4px',background:'linear-gradient(180deg, transparent, rgba(10,6,8,0.9))',fontFamily:"'BogartsMetalFont',cursive",fontSize:26,color:st?'var(--rot)':'var(--ink-bone)',textAlign:'center',lineHeight:1,textShadow:'0 2px 6px rgba(0,0,0,0.9)'}}>{member.name}</div>
      </div>
      {ghostCard&&!st&&<div style={{position:'absolute',top:4,left:'50%',transform:'translateX(-50%)',zIndex:30,fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:'var(--ink-bone)',background:'rgba(10,40,10,0.92)',border:'1px solid #44ff44',borderRadius:3,padding:'3px 8px',whiteSpace:'nowrap',animation:'fadeIn 0.15s ease',letterSpacing:2,textTransform:'uppercase'}}>
        {ghostCard.id==='battlecry'||ghostCard.id==='heavyriff'?'+1 ATK':ghostCard.id==='amp'?'×2 ATK':ghostCard.id==='newstrings'?'+2 HP':ghostCard.id==='roadie'?'+ Shield':ghostCard.id==='encore'?'Encore!':ghostCard.id==='darktuning'?'+ATK (corr)':ghostCard.id==='crowdsurf'?'Draw + ATK':ghostCard.id==='wakeup'?'+2 HP all':ghostCard.effect?ghostCard.effect.slice(0,22)+'…':'Play'}
      </div>}
      {/* Role strip — tight */}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,letterSpacing:3,color:st?'var(--rot)':'var(--ink-dim)',textAlign:'center',padding:'4px 4px 2px',textTransform:'uppercase',background:'rgba(10,6,8,0.6)',borderTop:'1px solid rgba(90,56,32,0.25)'}}>{member.role}</div>
      {/* Footer — single compact row */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px',background:'rgba(10,6,8,0.85)',borderTop:'1px solid rgba(90,56,32,0.3)'}}>
        <div style={{textAlign:'center',minWidth:32}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:st?'var(--rot)':'var(--blood)',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>ATK</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:26,fontWeight:900,lineHeight:1,color:st?'var(--rot)':'var(--blood)',textShadow:st?'none':'0 0 10px rgba(196,30,58,0.5)'}}><span key={'atk-'+member.atk} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{(()=>{
            if(st)return member.atk
            const base=ALL_MUSICIANS.find(mu=>mu.id===member.id)
            const baseAtk=base?base.atk+(member.demonic?4:member.mythic?2:member.foil?1:0):member.atk
            const permBonus=member.atk-baseAtk
            const corrBonus=member.keyword==='CORRUPT'&&corruption>0?Math.floor(corruption/12):0
            const totalBonus=permBonus+corrBonus
            if(totalBonus>0)return <>{baseAtk}<span style={{fontSize:18,color:'var(--gold)'}}>+{totalBonus}</span></>
            return member.atk
          })()}</span></div>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:st?'var(--rot)':'var(--gold)',fontWeight:900,letterSpacing:2,textAlign:'center',textTransform:'uppercase'}}>{member.keyword}</div>
        <div style={{textAlign:'center',minWidth:32}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:st?'var(--rot)':nearDeath?'var(--blood)':'#33dd33',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>HP</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,lineHeight:1,color:st?'var(--rot)':nearDeath?'var(--blood)':'#33dd33',textShadow:st?'none':nearDeath?'0 0 12px rgba(196,30,58,0.7)':'0 0 10px rgba(0,190,0,0.4)'}}><span key={'hp-'+member.hp} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{member.hp}</span></div>
        </div>
      </div>
      <div style={{height:4,background:'rgba(0,0,0,0.7)',borderRadius:'0 0 4px 4px'}}><div style={{height:'100%',borderRadius:'0 0 4px 4px',background:st?'var(--rot)':'linear-gradient(90deg,#003800,#33dd33)',width:`${(member.hp/member.maxHp)*100}%`,transition:'width 0.4s ease'}}/></div>
    </div>
  )
}

function HandCard({card,index,total,isHovered,isSelected,anyHovered,canAfford,onHover,onLeave,onClick,onDragStart,onDragEnd,isDragging,isShopBought,isDragOver,onHandDragOver,onHandDrop,isUsed,lastRiffPlayed,chainHintsOn,hoverZoomOn,chainReady}){
  const mastery=getMasteryTier(card.id)
  const spread=Math.min(4,20/total),mid=(total-1)/2
  const rot=(index-mid)*spread,yOff=Math.abs(index-mid)*2
  const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
  const glow=card.type==='CORRUPT'?'rgba(170,0,0,0.5)':card.type==='UTILITY'?'rgba(30,160,50,0.5)':card.type==='EMBER'?'rgba(200,120,20,0.5)':'rgba(140,40,200,0.5)'
  const unaffordable=!canAfford&&card.embers>0
  const shimmerAnim=card.upgraded?'upgradeShimmer 2s ease-in-out infinite':card.rarity==='Rare'?'holoShimmer 3s ease-in-out infinite':card.rarity==='Uncommon'?'uncommonGlow 2s ease-in-out infinite':''
  const masteryBorder=mastery.border?{borderTop:'2px solid '+mastery.border,boxShadow:'inset 0 2px 8px '+mastery.glow}:{}
  return(
    <div draggable
      onDragStart={e=>{e.dataTransfer.effectAllowed='move';onDragStart(index)}}
      onDragEnd={onDragEnd}
      onDragOver={e=>{e.preventDefault();onHandDragOver&&onHandDragOver()}}
      onDrop={e=>{e.stopPropagation();onHandDrop&&onHandDrop()}}
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={e=>{e.stopPropagation();onClick()}}
      style={{width:210,height:310,flexShrink:0,position:'relative',display:'flex',flexDirection:'column',
        background:isSelected?'linear-gradient(180deg, #2a0c10, #160608)':'linear-gradient(180deg, var(--altar-raised), var(--altar-recess))',
        border:isSelected?'2px solid var(--blood)':unaffordable?'1px solid var(--rot)':isHovered?'1px solid var(--ink-bone)':'1px solid var(--ink-rust)',
        borderRadius:4,cursor:'grab',position:'relative',
        outline:isHovered||isSelected?'1px solid rgba(232,216,184,0.2)':'1px solid rgba(232,216,184,0.06)',
        outlineOffset:'-5px',
        transformOrigin:'bottom center',
        transform:isDragging?'scale(0.85) rotate(5deg)':isHovered?(hoverZoomOn?'translateY(-80px) scale(1.5) rotate(0deg)':'translateY(-40px) scale(1.0) rotate(0deg)'):isSelected?`rotate(${rot}deg) translateY(-50px)`:`rotate(${rot}deg) translateY(${yOff}px)`,
        transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
        zIndex:isDragging?0:isHovered?9999:isSelected?50+index:10+index,
        boxShadow:isSelected?'0 0 0 2px #cc0000,0 0 22px rgba(200,0,0,0.75),0 0 45px rgba(180,0,0,0.4)':isShopBought?`0 0 12px ${bc}44`:isHovered?`0 36px 72px rgba(0,0,0,0.95),0 0 36px ${glow}`:chainReady&&canAfford?'2px 4px 16px rgba(0,0,0,0.75),0 0 14px rgba(255,220,50,0.5),0 0 28px rgba(255,200,0,0.2)':(mastery.glow?'2px 4px 16px rgba(0,0,0,0.75),0 0 8px '+mastery.glow:'2px 4px 16px rgba(0,0,0,0.75)'),
        opacity:isDragging?0.4:unaffordable?0.55:1,filter:corruption>=80?'hue-rotate(-10deg) saturate(1.4) brightness(0.95)':corruption>=60?'saturate(1.2)':'none',
        animation:chainReady&&canAfford?'riffChainGlow 1.2s ease-in-out infinite':shimmerAnim,
        margin:total>HAND_SIZE?'0 -28px':'0 -22px',userSelect:'none',willChange:isHovered?'transform':'auto'}}>
      {/* Hand-drawn top stripe — SVG path with wobble */}
      <svg style={{position:'absolute',top:0,left:0,right:0,width:'100%',height:8,pointerEvents:'none',zIndex:2}} viewBox="0 0 210 8" preserveAspectRatio="none">
        <path d="M 0 0 L 210 0 L 210 4 Q 160 6, 105 4 T 0 4 Z" fill={unaffordable?'var(--rot)':bc} opacity="0.9"/>
        <path d="M 2 5 Q 52 3, 105 5 T 208 5" stroke={unaffordable?'var(--rot)':bc} strokeWidth="0.8" fill="none" opacity="0.4"/>
      </svg>
      {isUsed&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.85)',border:'2px solid #888',borderRadius:6,padding:'6px 14px',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#888',letterSpacing:4,zIndex:20,pointerEvents:'none'}}>USED</div>}
      {card.embers>0?(
        <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',alignItems:'center',gap:2,zIndex:3}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:canAfford?'radial-gradient(circle at 30% 30%, #e8402f, #8a0c14 60%, #5c0810)':'radial-gradient(circle at 30% 30%, #3a1f18, #1a0c08)',border:canAfford?'1px solid var(--blood)':'1px solid var(--rot)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:canAfford?'var(--ink-bone)':'var(--rot)',boxShadow:canAfford?'0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,150,140,0.3)':'none'}}>{card.embers}</div>
          {!canAfford&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,color:'var(--blood)',letterSpacing:1,whiteSpace:'nowrap',textShadow:'0 0 8px rgba(196,30,58,0.9)',background:'rgba(0,0,0,0.85)',borderRadius:2,padding:'1px 4px'}}>NEED {card.embers}</div>}
        </div>
      ):(
        <div style={{position:'absolute',top:10,right:10,zIndex:3}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%, #3a2818, #1c1208 60%, #0a0604)',border:'1px solid var(--ink-dim)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--ink-dim)',boxShadow:'0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(100,80,60,0.2)'}}>0</div>
        </div>
      )}
      {card.foil&&<div style={{position:'absolute',top:12,left:10,padding:'2px 5px',borderRadius:2,background:'rgba(200,152,56,0.3)',border:'1px solid var(--gold)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:900,color:'var(--gold)',letterSpacing:2,zIndex:3,textTransform:'uppercase'}}>✨ Foil</div>}
      {card.mythic&&<div style={{position:'absolute',top:12,left:10,padding:'2px 5px',borderRadius:2,background:'rgba(120,0,180,0.4)',border:'1px solid #cc44ff',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:900,color:'#cc44ff',letterSpacing:2,zIndex:3,textTransform:'uppercase'}}>⛧ Mythic</div>}
      {chainReady&&canAfford&&<div style={{position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',padding:'2px 10px',borderRadius:3,background:'rgba(200,152,56,0.3)',border:'1px solid var(--gold)',fontFamily:"'MBScribblesFont',serif",fontSize:8,fontWeight:900,color:'var(--gold)',letterSpacing:3,zIndex:99999,whiteSpace:'nowrap',textTransform:'uppercase'}}>⛧ Chain</div>}
      {card.rarity==='Rare'&&!card.foil&&!card.mythic&&<div style={{position:'absolute',top:12,left:10,padding:'2px 5px',borderRadius:2,background:'rgba(200,152,56,0.18)',border:'1px solid rgba(200,152,56,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:900,color:'var(--gold)',letterSpacing:2,zIndex:3,textTransform:'uppercase'}}>Rare</div>}
      {card.rarity==='Uncommon'&&!card.foil&&!card.mythic&&<div style={{position:'absolute',top:12,left:10,padding:'2px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'var(--ink-dim)',letterSpacing:2,zIndex:3}}>✦</div>}
      {mastery.border&&<div style={{position:'absolute',bottom:4,left:4,padding:'1px 5px',borderRadius:2,background:'rgba(0,0,0,0.75)',border:'1px solid '+mastery.border+'88',fontFamily:"'MBScribblesFont',serif",fontSize:7,fontWeight:900,color:mastery.color,letterSpacing:1,textTransform:'uppercase',zIndex:5}}>{mastery.name}</div>}
      <div style={{height:100,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,background:'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15))',position:'relative',marginTop:8}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at center,${bc}22,transparent 70%)`}}/>
        {card.emoji}
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,fontWeight:700,color:'var(--ink-bone)',textAlign:'center',padding:'6px 5px 2px',letterSpacing:.4,lineHeight:1,flexShrink:0}}>{card.name}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:bc,textAlign:'center',padding:'2px 4px',letterSpacing:2.5,textTransform:'uppercase',flexShrink:0,opacity:0.9}}>{card.type}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:700,color:'var(--ink-bone)',textAlign:'center',padding:'6px 10px 10px',lineHeight:1.25,flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>{card.id==='demotape'?(lastRiffPlayed?'📼 Will replay: '+lastRiffPlayed.name+' (free)':'📼 No riff recorded yet — play a RIFF card first'):(<>{card.effect||card.desc||''}{card.upgraded&&CARD_UPGRADES[card.id]&&<div style={{marginTop:6,padding:'3px 8px',background:'rgba(200,152,56,0.15)',border:'1px solid rgba(200,152,56,0.4)',borderRadius:2,color:'var(--gold)',fontSize:11,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>⛧ {CARD_UPGRADES[card.id].desc}</div>}</>)}
        {isHovered&&chainHintsOn&&(()=>{const hints=getChainHints(card.id);return hints.length>0?<div style={{marginTop:4,width:'100%'}}>{hints.map((h,i)=><div key={i} style={{padding:'3px 6px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:3,marginTop:2,fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#ffffff',fontWeight:700,textAlign:'center',textShadow:'0 0 6px rgba(255,255,255,0.4)'}}>⛧ {h.name} — needs {h.partnerName}</div>)}</div>:null})()}</div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// DAMAGE BREAKDOWN — Balatro-style number-go-up animation
// ═══════════════════════════════════════════════════════════
function DamageBreakdown({data,onDone}){
  const [visibleCount,setVisibleCount]=useState(0)
  const [slamming,setSlamming]=useState(false)
  const lines=data.lines||[]
  const total=data.total||0
  const isFast=localStorage.getItem('vst_speed')==='fast'
  const LINE_DELAY=isFast?100:200
  const SLAM_DELAY=lines.length*LINE_DELAY+400
  const hasMults=lines.filter(l=>l.type==='multiply').length

  useEffect(()=>{
    let i=0
    const timer=setInterval(()=>{
      i++
      setVisibleCount(i)
      // Play a tick sound for each multiplier line
      if(lines[i-1]&&lines[i-1].type==='multiply'){
        try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.type='sine';o.frequency.value=400+i*80;g.gain.value=0.15;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.08)}catch(e){}
      }
      if(i>=lines.length){clearInterval(timer)}
    },LINE_DELAY)
    const slamTimer=setTimeout(()=>{setSlamming(true)
      try{document.getElementById('root').style.animation='none';document.getElementById('root').offsetHeight;document.getElementById('root').style.animation='screenShake 0.4s ease'}catch(e){}
    },SLAM_DELAY)
    const doneTimer=setTimeout(()=>{if(onDone)onDone()},SLAM_DELAY+1200)
    return()=>{clearInterval(timer);clearTimeout(slamTimer);clearTimeout(doneTimer)}
  },[lines.length])

  const slamAnim=`@keyframes screenShake{0%,100%{transform:translate(0,0)}10%{transform:translate(-6px,4px)}20%{transform:translate(8px,-3px)}30%{transform:translate(-4px,6px)}40%{transform:translate(6px,-2px)}50%{transform:translate(-3px,3px)}60%{transform:translate(4px,-4px)}70%{transform:translate(-2px,2px)}80%{transform:translate(3px,-1px)}90%{transform:translate(-1px,1px)}} @keyframes dmgSlam{0%{transform:scale(2.5);opacity:0}30%{transform:scale(0.9);opacity:1}50%{transform:scale(1.15)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}`
  const lineAnim=`@keyframes dmgLineIn{0%{transform:translateX(30px);opacity:0}100%{transform:translateX(0);opacity:1}}`
  const pulseAnim=`@keyframes dmgPulse{0%,100%{text-shadow:0 0 20px rgba(255,34,0,0.6)}50%{text-shadow:0 0 40px rgba(255,100,0,0.9)}}`
  const countAnim=`@keyframes dmgCount{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}`

  let runningTotal=0
  return(<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9500,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:0,minWidth:380}}>
    <style>{slamAnim+lineAnim+pulseAnim+countAnim}</style>
    <div style={{background:'linear-gradient(180deg,rgba(15,8,2,0.95),rgba(10,5,0,0.98))',border:'2px solid rgba(200,160,40,0.5)',borderRadius:12,padding:'16px 28px 20px',boxShadow:'0 0 60px rgba(0,0,0,0.9),0 0 30px rgba(200,100,0,0.15),inset 0 1px 0 rgba(200,160,40,0.15)',minWidth:340,maxWidth:440}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:16,color:'#c8a040',textAlign:'center',letterSpacing:4,textTransform:'uppercase',marginBottom:10,opacity:0.7}}>STRIKE BREAKDOWN</div>
      {lines.map((line,i)=>{
        if(i>=visibleCount)return null
        if(line.type==='member'){runningTotal+=line.value}
        else if(line.type==='multiply'){runningTotal=line.runningAfter}
        else if(line.type==='add'){runningTotal=line.runningAfter}
        const isLast=i===visibleCount-1
        return(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:'1px solid rgba(80,50,10,0.15)',animation:'dmgLineIn 0.25s ease-out',opacity:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {line.emoji&&<span style={{fontSize:18}}>{line.emoji}</span>}
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:line.type==='subtotal'?15:14,color:line.color||'#c8a060',fontWeight:line.type==='subtotal'?900:400,letterSpacing:line.type==='subtotal'?2:0,textTransform:line.type==='subtotal'?'uppercase':'none'}}>{line.label}</span>
          </div>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:line.type==='subtotal'?20:line.type==='multiply'||line.type==='add'?17:16,fontWeight:900,color:line.type==='multiply'?'#ff8800':line.type==='add'?'#44cc44':line.type==='subtotal'?'#e8a820':line.color||'#c8a060',animation:isLast?'dmgCount 0.3s ease':'none',textShadow:line.type==='multiply'?'0 0 10px rgba(255,136,0,0.5)':line.type==='subtotal'?'0 0 8px rgba(200,160,40,0.3)':'none'}}>{line.type==='multiply'?line.label2:line.type==='add'?'+'+line.value:line.value}</span>
        </div>)
      })}
      {visibleCount>=lines.length&&!slamming&&<div style={{textAlign:'center',marginTop:8}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#886644',letterSpacing:2}}>RUNNING: {runningTotal.toLocaleString()}</div>
      </div>}
    </div>
    {slamming&&<div style={{marginTop:8,textAlign:'center',animation:'dmgSlam 0.5s ease-out forwards'}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:total>=10000?80:total>=5000?72:total>=1000?64:56,fontWeight:900,color:total>=5000?'#ffdd00':total>=1000?'#ff6600':'#ff2200',textShadow:'0 0 30px rgba(255,34,0,0.8),0 0 60px rgba(255,100,0,0.4),0 4px 0 #440000',letterSpacing:3,animation:'dmgPulse 1s ease-in-out infinite'}}>{total.toLocaleString()}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:total>=5000?18:14,color:total>=5000?'#ffaa00':'#ff6644',letterSpacing:4,textTransform:'uppercase',marginTop:2}}>{total>=10000?'⛧ GODLIKE DAMAGE ⛧':total>=5000?'💀 DEVASTATING':total>=1000?'MASSIVE DAMAGE':'DAMAGE'}</div>
    </div>}
  </div>)
}


// ═══════════════════════════════════════════════════════════
// EVENT SCREEN — Random encounters between non-boss fights
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// MASTERY GALLERY — persistent card mastery progress
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// BOSS TROPHY WALL — "Hall of Damnation"
// ═══════════════════════════════════════════════════════════
function TrophyWall({onClose}){
  const trophies=getTrophyData()
  const totalKills=Object.values(trophies).reduce((s,t)=>s+t.kills,0)
  const totalDefeated=Object.keys(trophies).length
  const stakeColors={bronze:'#cd7f32',silver:'#c0c0c0',gold:'#ffd700',obsidian:'#6a0dad',blood:'#cc0000',demonic:'#ff0044'}
  const stakeNames={bronze:'Bronze',silver:'Silver',gold:'Gold',obsidian:'Obsidian',blood:'Blood',demonic:'Demonic'}

  const CIRCLES=[
    {name:'I — Limbo',emoji:'👤',enemies:['wanderer','lostsoul','drifter']},
    {name:'II — Lust',emoji:'💋',enemies:['siren','tempter','lust_boss']},
    {name:'III — Gluttony',emoji:'🍖',enemies:['glutton','feaster','gluttony_boss']},
    {name:'IV — Greed',emoji:'💰',enemies:['miser','hoarder','greed_boss']},
    {name:'V — Anger',emoji:'🔥',enemies:['wrathful','berserker','anger_boss']},
    {name:'VI — Heresy',emoji:'🔱',enemies:['heretic','apostate','heresy_boss']},
    {name:'VII — Violence',emoji:'🗡️',enemies:['brute','hunter','violence_boss']},
    {name:'VIII — Fraud',emoji:'🃏',enemies:['trickster','deceiver','fraud_boss']},
    {name:'IX — Treachery',emoji:'🔒',enemies:['traitor','betrayer','lucifer']},
  ]
  const SPECIAL=[{id:'ar_exec',name:'The Executive',emoji:'🕴',circle:'Welcome to Hell'}]

  const glowAnim='@keyframes trophyGlow{0%,100%{box-shadow:0 0 8px rgba(200,160,40,0.3)}50%{box-shadow:0 0 20px rgba(200,160,40,0.6)}}'
  const revealAnim='@keyframes trophyReveal{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}'

  function TrophySlot({enemyId,delay}){
    const enemy=ENEMIES.find(e=>e.id===enemyId)||(enemyId==='ar_exec'?{id:'ar_exec',name:'The Executive',emoji:'🕴'}:null)
    if(!enemy)return null
    const t=trophies[enemyId]
    const defeated=!!t
    const isBoss=enemyId.includes('boss')||enemyId==='lucifer'||enemyId==='ar_exec'||enemyId==='drifter'||enemyId==='lust_boss'
    const stakeColor=t?.bestStake?stakeColors[t.bestStake]:'#4a3010'

    return(<div style={{
      width:140,background:defeated?'linear-gradient(180deg,rgba(25,15,5,0.95),rgba(12,6,2,0.98))':'linear-gradient(180deg,rgba(10,6,3,0.7),rgba(5,3,1,0.8))',
      border:defeated?'2px solid '+(isBoss?'#e8a820':'#8a6020'):'1px solid rgba(60,30,10,0.3)',
      borderRadius:8,padding:0,position:'relative',overflow:'hidden',
      animation:defeated?'trophyReveal 0.4s ease '+(delay*0.05)+'s both':'none',
      boxShadow:defeated&&isBoss?'0 0 15px rgba(200,160,40,0.3)':'none',
      transition:'transform 0.2s',cursor:defeated?'default':'not-allowed',
      opacity:defeated?1:0.4
    }} onMouseEnter={e=>{if(defeated)e.currentTarget.style.transform='scale(1.08)'}}
       onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>
      {/* Stake badge */}
      {t?.bestStake&&<div style={{position:'absolute',top:4,right:4,width:8,height:8,borderRadius:'50%',background:stakeColor,boxShadow:'0 0 4px '+stakeColor}}/>}

      {/* Portrait / silhouette */}
      <div style={{fontSize:defeated?36:24,textAlign:'center',padding:'4px 0 1px',filter:defeated?'none':'brightness(0) opacity(0.15)'}}>
        {defeated&&BOSS_PORTRAITS[enemy.id]?<img src={BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:36,height:36,objectFit:'contain',imageRendering:'pixelated'}}/>:defeated?enemy.emoji:'❓'}
      </div>

      {/* Name */}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:defeated?900:400,color:defeated?(isBoss?'#e8a820':'#c8a060'):'#443322',textAlign:'center',padding:'0 4px 1px',lineHeight:1.1,minHeight:16}}>
        {defeated?enemy.name:'???'}
      </div>

      {/* Kill count */}
      {defeated&&<div style={{textAlign:'center',padding:'1px 0 3px'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:'#cc4444'}}>{t.kills}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#886644',letterSpacing:1,textTransform:'uppercase'}}>{t.kills===1?'KILL':'KILLS'}</div>
      </div>}

      {/* Best damage */}
      {defeated&&t.bestDamage>0&&<div style={{background:'rgba(0,0,0,0.5)',padding:'2px 6px',textAlign:'center',borderTop:'1px solid rgba(80,50,10,0.2)'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#aa8844'}}>BEST HIT</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#e8a820'}}>{t.bestDamage.toLocaleString()}</div>
      </div>}

      {/* Stake badge at bottom */}
      {t?.bestStake&&<div style={{background:stakeColor+'22',padding:'2px',textAlign:'center',borderTop:'1px solid '+stakeColor+'44'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,color:stakeColor,letterSpacing:1}}>{stakeNames[t.bestStake].toUpperCase()}</div>
      </div>}
    </div>)
  }

  return(<div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.99)',display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 40px',overflow:'hidden',gap:4}}>
    <style>{glowAnim+revealAnim}</style>
    <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#cc1111',textShadow:'0 0 30px rgba(180,0,0,0.6),2px 2px 0 #000',letterSpacing:6}}>Hall of Damnation</div>
    <div style={{fontFamily:"'ScratchFont',serif",fontSize:14,color:'#a09060',fontStyle:'italic',marginBottom:2}}>Every boss you have conquered earns a place on this wall</div>
    <div style={{display:'flex',gap:16,marginBottom:6}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#c8a060',padding:'3px 14px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:4}}>
        {totalDefeated}/28 Defeated
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#cc4444',padding:'3px 14px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(150,40,40,0.3)',borderRadius:4}}>
        {totalKills} Total Kills
      </div>
    </div>

    {/* Circle rows */}
    <div style={{display:'flex',flexDirection:'column',gap:1,width:'100%',maxWidth:1400,alignItems:'center',flex:1,overflowY:'auto',overflowX:'hidden'}}>
      {CIRCLES.map((circle,ci)=>{
        const allDefeated=circle.enemies.every(eid=>trophies[eid])
        return(<div key={ci} style={{display:'flex',alignItems:'center',gap:10,width:'100%'}}>
          {/* Circle label */}
          <div style={{width:140,flexShrink:0,textAlign:'right',paddingRight:10}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:allDefeated?'#e8a820':'#665533',letterSpacing:2,textTransform:'uppercase'}}>
              {circle.emoji} Circle {circle.name.split(' — ')[0]}
            </div>
            <div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:allDefeated?'#aa8844':'#443322',fontStyle:'italic'}}>
              {circle.name.split(' — ')[1]}
            </div>
            {allDefeated&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#44cc44',letterSpacing:1,marginTop:1}}>✓ CLEARED</div>}
          </div>
          {/* 3 trophy slots */}
          <div style={{display:'flex',gap:8}}>
            {circle.enemies.map((eid,ei)=><TrophySlot key={eid} enemyId={eid} delay={ci*3+ei}/>)}
          </div>
        </div>)
      })}

      {/* Special: The Executive */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4,paddingTop:6,borderTop:'1px solid rgba(100,65,15,0.2)',width:'100%'}}>
        <div style={{width:140,flexShrink:0,textAlign:'right',paddingRight:10}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:trophies['ar_exec']?'#ffd700':'#665533',letterSpacing:2}}>
            🕴 BONUS
          </div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:10,color:'#aa8844',fontStyle:'italic'}}>
            Welcome to Hell
          </div>
        </div>
        <TrophySlot enemyId="ar_exec" delay={28}/>
      </div>
    </div>

    <button onClick={onClose} style={{marginTop:4,fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,padding:'8px 40px',flexShrink:0,background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'#c8a040',cursor:'pointer',textTransform:'uppercase',flexShrink:0}}>
      Close
    </button>
  </div>)
}

function MasteryGallery({onClose}){
  const data=getMasteryData()
  const cards=ALL_CARDS.filter(c=>!c.shopOnly&&c.id!=='contract')
  const totals=getTotalMastery()
  const holoAnim='@keyframes holoShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}'
  const tierCounts=MASTERY_TIERS.map(t=>({name:t.name,count:cards.filter(c=>{const p=data[c.id]||0;let tier=MASTERY_TIERS[0];for(const tt of MASTERY_TIERS){if(p>=tt.min)tier=tt};return tier.name===t.name}).length}))

  return(<div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.99)',display:'flex',flexDirection:'column',alignItems:'center',padding:'14px 30px',overflowY:'auto'}}>
    <style>{holoAnim}</style>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',maxWidth:1200,marginBottom:2}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:46,color:'#c8a040',textShadow:'0 0 30px rgba(200,160,40,0.4),2px 2px 0 #000',letterSpacing:6}}>Card Mastery</div>
      <button onClick={onClose} style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:'#cc4444',background:'rgba(80,0,0,0.4)',border:'2px solid #aa2222',borderRadius:6,padding:'8px 24px',cursor:'pointer',letterSpacing:3,textTransform:'uppercase'}}>✕ Close</button>
    </div>
    <div style={{fontFamily:"'ScratchFont',serif",fontSize:14,color:'#a09060',fontStyle:'italic',marginBottom:4}}>Play cards across runs to unlock visual upgrades</div>

    {/* Tier summary */}
    <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap',justifyContent:'center'}}>
      {MASTERY_TIERS.slice(1).map(t=>(
        <div key={t.name} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 14px',background:'rgba(0,0,0,0.4)',border:'1px solid '+t.border+'66',borderRadius:4}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:t.color,boxShadow:'0 0 6px '+t.glow}}/>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:t.color,fontWeight:900}}>{t.name}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a7050'}}>({t.min}+ plays)</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#c8a060',fontWeight:900}}>{tierCounts.find(tc=>tc.name===t.name)?.count||0}</span>
        </div>
      ))}
      <div style={{padding:'4px 14px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:4}}>
        <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#c8a060'}}>{totals.total.toLocaleString()} total plays · {totals.maxed} Legendary</span>
      </div>
    </div>

    {/* Card grid */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(9,120px)',gap:8,justifyContent:'center',maxWidth:1200,paddingBottom:40}}>
      {cards.map(c=>{
        const plays=data[c.id]||0
        let tier=MASTERY_TIERS[0]
        for(const t of MASTERY_TIERS){if(plays>=t.min)tier=t}
        const nextTier=MASTERY_TIERS[MASTERY_TIERS.indexOf(tier)+1]
        const progress=nextTier?Math.min(1,(plays-tier.min)/(nextTier.min-tier.min)):1
        const bc=c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
        const isLegendary=tier.name==='Legendary'
        const borderColor=tier.border||bc+'66'

        return(<div key={c.id} style={{
          background:isLegendary?'linear-gradient(135deg,#1a0820,#0a0412,#1a0820)':'linear-gradient(180deg,#1a1008,#0c0604)',
          border:'2px solid '+borderColor,
          borderRadius:7,padding:0,position:'relative',overflow:'hidden',
          boxShadow:tier.glow?'0 0 12px '+tier.glow+',inset 0 0 8px '+tier.glow:'0 2px 8px rgba(0,0,0,0.5)'
        }}>
          {/* Holo shimmer for Legendary */}
          {isLegendary&&<div style={{position:'absolute',inset:0,background:'linear-gradient(45deg,transparent 30%,rgba(255,68,255,0.08) 50%,transparent 70%)',backgroundSize:'200% 200%',animation:'holoShift 3s ease infinite',pointerEvents:'none',zIndex:1}}/>}

          {/* Type bar */}
          <div style={{height:3,background:tier.border||bc}}/>

          {/* Emoji */}
          <div style={{fontSize:28,textAlign:'center',padding:'6px 0',background:'rgba(0,0,0,0.3)'}}>{c.emoji}</div>

          {/* Name */}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:700,color:'#eedfc0',textAlign:'center',padding:'1px 3px',lineHeight:1.1}}>{c.name}</div>

          {/* Tier badge */}
          <div style={{textAlign:'center',padding:'2px 0'}}>
            {tier.name!=='Unplayed'?
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,color:tier.color,letterSpacing:1,textTransform:'uppercase'}}>{tier.name}</span>:
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#554433',letterSpacing:1}}>UNPLAYED</span>
            }
          </div>

          {/* Progress bar */}
          <div style={{margin:'0 4px 4px',height:5,background:'rgba(0,0,0,0.5)',borderRadius:3,overflow:'hidden',position:'relative'}}>
            <div style={{height:'100%',width:(progress*100)+'%',
              background:isLegendary?'linear-gradient(90deg,#ff44ff,#ff88ff,#ff44ff)':tier.border?'linear-gradient(90deg,'+tier.border+','+tier.color+')':'rgba(100,65,15,0.4)',
              borderRadius:3,transition:'width 0.5s ease'}}/>
          </div>

          {/* Play count */}
          <div style={{textAlign:'center',padding:'0 0 3px'}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:tier.color||'#665533'}}>{plays}</span>
            {nextTier&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#554433'}}> / {nextTier.min}</span>}
          </div>
        </div>)
      })}
    </div>

    <button onClick={onClose} style={{marginTop:4,fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,padding:'8px 40px',flexShrink:0,background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'#c8a040',cursor:'pointer',textTransform:'uppercase',flexShrink:0}}>
      Close
    </button>
  </div>)
}

// ═══════════════════════════════════════════════════════════
// COLD OPEN SPLASH — first-launch 3s cinematic, skippable
// ═══════════════════════════════════════════════════════════
function ColdOpenScreen({phase}){
  const showPresents=phase>=1&&phase<=2
  const showLogo=phase>=2&&phase<=4
  const showTagline=phase>=3&&phase<=4
  const fadingOut=phase===4
  return(
    <div style={{position:'fixed',inset:0,zIndex:99999,background:'#000',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      overflow:'hidden',pointerEvents:'none',
      opacity:fadingOut?0:1,transition:fadingOut?'opacity 450ms ease-in':'none'}}>
      {/* VESTIBULE PRESENTS */}
      {showPresents&&<div style={{position:'absolute',
        fontFamily:"'BogartsMetalFont',cursive",fontSize:32,color:'var(--ink-rust)',
        letterSpacing:6,textTransform:'uppercase',transform:'rotate(-1deg)',
        opacity:phase===1?1:0,
        transition:'opacity 380ms ease',
        textShadow:'0 0 16px rgba(90,56,32,0.6)'}}>Vestibule Presents</div>}
      {/* VESTIBULE logo stamp with radial pulses */}
      {showLogo&&<div style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {/* 3 emanating blood pulses */}
          {[0,260,520].map(d=>(
            <div key={d} style={{position:'absolute',width:320,height:320,borderRadius:'50%',
              background:'radial-gradient(circle, rgba(196,30,58,0.4) 0%, rgba(196,30,58,0.08) 40%, transparent 70%)',
              animation:'coldOpenPulse 800ms ease-out '+d+'ms forwards',opacity:0,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',fontFamily:"'BogartsMetalFont',cursive",fontSize:120,color:'var(--blood)',
            letterSpacing:10,textTransform:'uppercase',whiteSpace:'nowrap',
            textShadow:'0 0 28px rgba(196,30,58,0.95), 0 0 70px rgba(150,0,20,0.55), 4px 4px 0 rgba(0,0,0,0.9)',
            animation:'coldOpenStamp 420ms cubic-bezier(0.34,1.56,0.64,1) forwards'}}>Vestibule</div>
        </div>
        {showTagline&&<div style={{marginTop:8,fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-bone)',
          letterSpacing:6,textTransform:'uppercase',opacity:0,
          animation:'coldOpenFadeIn 560ms ease-out forwards'}}>A Doomguelite Descent Through the 9 Circles of Hell</div>}
      </div>}
      {/* Skip hint */}
      {phase>=1&&phase<=3&&<div style={{position:'absolute',bottom:30,right:30,
        fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--ink-rust)',letterSpacing:3,
        textTransform:'uppercase',opacity:0.55}}>SPACE to skip</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// VICTORY SUMMARY — 3s pause-and-celebrate after non-boss fight wins
// ═══════════════════════════════════════════════════════════
function VictorySummaryScreen({summary,onContinue}){
  if(!summary)return null
  const s=summary
  const mins=Math.floor(s.timeMs/60000)
  const secs=Math.floor((s.timeMs%60000)/1000)
  const timeStr=mins+':'+String(secs).padStart(2,'0')
  const rows=[
    ['Damage Dealt',s.damageDealt.toLocaleString(),'var(--blood)'],
    ['Strikes Used',s.strikesUsed+' / '+s.strikesMax,'var(--gold)'],
    ['Cards Played',s.cardsPlayed,'var(--gold)'],
    ['Highest Strike',s.highestStrike.toLocaleString(),'var(--blood)'],
    ['Embers Spent',s.embersSpent,'var(--gold)'],
    ['Corruption Gained','+'+s.corruptionGained+'%','#cc44ff'],
    ['Time Taken',timeStr,'var(--ink-bone)'],
    ['Riff Chains',s.riffChains,'var(--gold)'],
  ]
  return(
    <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(8,4,2,0.92)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,
      padding:40,overflow:'hidden'}}>
      {/* Frieze top */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:18,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.85,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderBottom:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(180deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
      {/* Corruption mercury vignette */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(60,0,15,0.35) 100%)'}}/>
      {/* VICTORY stamp (double-stamp effect) */}
      <div style={{position:'relative',marginTop:10}}>
        <span style={{position:'absolute',inset:0,fontFamily:"'BogartsMetalFont',cursive",fontSize:84,color:'#7a0f1f',letterSpacing:8,textShadow:'3px 4px 0 rgba(0,0,0,0.85)',transform:'translate(4px,5px) rotate(-3deg)',whiteSpace:'nowrap',opacity:0.85}}>VICTORY</span>
        <span style={{position:'relative',fontFamily:"'BogartsMetalFont',cursive",fontSize:84,color:'var(--blood)',letterSpacing:8,textShadow:'0 0 28px rgba(196,30,58,0.85), 2px 2px 0 rgba(0,0,0,0.85)',transform:'rotate(-3deg)',display:'inline-block',whiteSpace:'nowrap'}}>VICTORY</span>
      </div>
      {/* Enemy name with SVG underline */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,marginTop:18}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'var(--ink-bone)',letterSpacing:4,textShadow:'0 0 18px rgba(232,216,184,0.4)',textTransform:'uppercase'}}>
          {s.enemy?s.enemy.name:'Enemy'} Destroyed
        </div>
        <svg width="520" height="10" viewBox="0 0 520 10" style={{display:'block'}}>
          <path d="M 10 5 Q 130 2, 260 5 T 510 5" stroke="var(--blood)" strokeWidth="1.4" fill="none" opacity="0.75"/>
          <path d="M 20 7 Q 150 9, 260 7 T 500 7" stroke="var(--blood)" strokeWidth="0.7" fill="none" opacity="0.5"/>
        </svg>
      </div>
      {/* Stats grid — 2 col × 4 rows */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 80px',marginTop:14,
        padding:'22px 42px',background:'rgba(20,10,6,0.55)',border:'1px solid rgba(90,56,32,0.55)',borderRadius:6,
        boxShadow:'inset 0 0 40px rgba(0,0,0,0.55)'}}>
        {rows.map(([label,value,color])=>(
          <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:260}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,color:'var(--ink-dim)',textTransform:'uppercase',fontWeight:900}}>{label}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,fontWeight:900,color:color,lineHeight:1.1,animation:'inkStamp 0.4s ease-out',marginTop:2}}>{value}</div>
          </div>
        ))}
      </div>
      {/* MVP */}
      {s.mvp&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'var(--ink-bone)',fontStyle:'italic',letterSpacing:1,marginTop:8}}>
        MVP: {s.mvp.emoji||'🎸'} {s.mvp.name}
      </div>}
      {/* Continue button */}
      <button onClick={onContinue}
        style={{marginTop:12,fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,
          padding:'14px 44px',background:'rgba(120,8,8,0.35)',border:'3px solid var(--blood)',borderRadius:8,
          color:'var(--ink-bone)',cursor:'pointer',textTransform:'uppercase',
          display:'flex',alignItems:'center',gap:10,
          boxShadow:'0 0 24px rgba(196,30,58,0.5), inset 0 0 18px rgba(150,0,20,0.25)'}}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,15,15,0.55)'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(120,8,8,0.35)'}}>
        <span style={{color:'var(--blood)',fontSize:22,textShadow:'0 0 10px rgba(196,30,58,0.8)'}}>⛧</span>
        Continue
        <span style={{color:'var(--blood)',fontSize:22,textShadow:'0 0 10px rgba(196,30,58,0.8)'}}>⛧</span>
      </button>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',marginTop:4,opacity:0.7}}>Press SPACE or ENTER</div>
      {/* Frieze bottom */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:18,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.7,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderTop:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(0deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
    </div>
  )
}

function EventScreen({event,onChoose}){
  const [chosen,setChosen]=useState(null)
  const [resultText,setResultText]=useState(null)
  if(!event)return null

  const handleChoice=(choice)=>{
    if(chosen)return
    setChosen(choice)
    onChoose(choice)
  }

  const btnBase={fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:700,padding:'16px 28px',borderRadius:8,cursor:'pointer',transition:'all 0.2s',border:'2px solid',textAlign:'left',width:'100%',maxWidth:500}
  const fadeIn='@keyframes evtFadeIn{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}'
  const flicker='@keyframes evtFlicker{0%,100%{opacity:0.85}50%{opacity:1}}'

  return(<div style={{width:1920,height:1080,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at center,#1a0a02 0%,#0a0400 70%,#000 100%)',position:'relative',overflow:'hidden'}}>
    <style>{fadeIn+flicker}</style>
    {/* Ambient particles */}
    <div style={{position:'absolute',inset:0,background:'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'><rect width=\'1\' height=\'1\' fill=\'rgba(200,100,0,0.03)\'/></svg>")',opacity:0.5,animation:'evtFlicker 3s ease-in-out infinite'}}/>

    {/* Event card */}
    <div style={{background:'linear-gradient(180deg,rgba(25,12,4,0.97),rgba(15,8,2,0.99))',border:'2px solid rgba(200,100,20,0.4)',borderRadius:16,padding:'40px 50px',maxWidth:620,width:'90%',boxShadow:'0 0 80px rgba(200,80,0,0.15),0 0 200px rgba(100,40,0,0.1),inset 0 1px 0 rgba(200,160,40,0.1)',animation:'evtFadeIn 0.8s ease-out',position:'relative'}}>

      {/* Emoji + title */}
      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{fontSize:64,filter:'drop-shadow(0 0 20px rgba(200,100,0,0.4))',marginBottom:8}}>{event.emoji}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'#c8a040',textShadow:'0 0 20px rgba(200,160,40,0.3),2px 2px 0 #000',letterSpacing:3}}>{event.name}</div>
      </div>

      {/* Flavor text */}
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:17,color:'#998866',fontStyle:'italic',textAlign:'center',lineHeight:1.6,marginBottom:28,padding:'0 10px'}}>{event.flavor}</div>

      {/* Divider */}
      <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(200,100,20,0.4),transparent)',margin:'0 0 24px'}}/>

      {/* Choices */}
      <div style={{display:'flex',flexDirection:'column',gap:14,alignItems:'center'}}>
        <div onClick={()=>handleChoice('A')} style={{...btnBase,background:chosen==='A'?'rgba(200,80,0,0.25)':chosen?'rgba(20,10,4,0.5)':'rgba(30,15,5,0.8)',borderColor:chosen==='A'?'#cc6600':chosen?'rgba(60,30,10,0.3)':'rgba(200,100,20,0.35)',color:chosen&&chosen!=='A'?'#554433':'#ddc090',opacity:chosen&&chosen!=='A'?0.4:1,pointerEvents:chosen?'none':'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <span style={{fontSize:22}}>{event.choiceA.emoji}</span>
            <span style={{fontSize:20,fontWeight:900,color:chosen==='A'?'#ff8800':'#e8c080'}}>{event.choiceA.label}</span>
          </div>
          <div style={{fontSize:14,color:chosen==='A'?'#cc8844':'#887755',paddingLeft:32}}>{event.choiceA.desc}</div>
        </div>

        <div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'#554433',letterSpacing:4}}>— OR —</div>

        <div onClick={()=>handleChoice('B')} style={{...btnBase,background:chosen==='B'?'rgba(40,60,80,0.25)':chosen?'rgba(20,10,4,0.5)':'rgba(30,15,5,0.8)',borderColor:chosen==='B'?'#4488aa':chosen?'rgba(60,30,10,0.3)':'rgba(100,120,140,0.35)',color:chosen&&chosen!=='B'?'#554433':'#b0c0d0',opacity:chosen&&chosen!=='B'?0.4:1,pointerEvents:chosen?'none':'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <span style={{fontSize:22}}>{event.choiceB.emoji}</span>
            <span style={{fontSize:20,fontWeight:900,color:chosen==='B'?'#66aacc':'#a0b0c0'}}>{event.choiceB.label}</span>
          </div>
          <div style={{fontSize:14,color:chosen==='B'?'#6699aa':'#667788',paddingLeft:32}}>{event.choiceB.desc}</div>
        </div>
      </div>
    </div>
  </div>)
}

function BossSection({enemy,currentHp,scaledMaxHp,isWiggling,innerRef,debuff,chromaStr,dblRoll,bossStrikeAnim,luciferPhase,telegraph}){
  const eMaxHp=scaledMaxHp||enemy.maxHp
  const pct=Math.max(0,(currentHp/eMaxHp)*100),isLow=currentHp<eMaxHp*.35,isCritical=currentHp>0&&currentHp<eMaxHp*.20
  return(
    <div style={{display:'flex',gap:0,animation:isWiggling?'wiggle 0.45s ease':'none',width:'100%',minHeight:200,position:'relative',overflow:bossStrikeAnim?'visible':'hidden',zIndex:bossStrikeAnim?300:1,alignItems:'center'}}>
      {/* BOSS PORTRAIT — circular ritual frame */}
      <div ref={innerRef} data-boss-emoji="1" style={{width:200,height:200,flexShrink:0,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',fontSize:90,
        transform:bossStrikeAnim?bossStrikeAnim.phase==='windup'?'translateY(15px) scale(1.08) rotate(-3deg)':bossStrikeAnim.phase==='launch'?'translateY(-10px) scale(1.15)':bossStrikeAnim.phase==='impact'?'translateY(8px) scale(0.95)':bossStrikeAnim.phase==='return'?'translateY(0px) scale(1.0)':'none':'none',
        transition:bossStrikeAnim?'transform 0.35s cubic-bezier(0.2,0.8,0.3,1.2)':'all 0.5s',
        zIndex:bossStrikeAnim?500:1,
        filter:bossStrikeAnim&&(bossStrikeAnim.phase==='launch'||bossStrikeAnim.phase==='impact')?'drop-shadow(0 0 40px rgba(255,0,0,0.9))':'drop-shadow(0 0 24px rgba(196,30,58,'+(isLow?'0.7':'0.4')+'))'}}>
        {/* Outer rune circle — ritualistic blood-red */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',animation:isLow?'altarBreath 1.5s ease-in-out infinite':'altarBreath 6s ease-in-out infinite'}} viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="94" fill="none" stroke={isLow?'#c41e3a':'rgba(196,30,58,0.55)'} strokeWidth="1" strokeDasharray="3 2"/>
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(196,30,58,0.35)" strokeWidth="0.6"/>
          {/* Cardinal sigil marks at 12/3/6/9 */}
          <text x="100" y="14" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="14" fill="rgba(196,30,58,0.7)">⛧</text>
          <text x="192" y="104" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="12" fill="rgba(196,30,58,0.5)">✠</text>
          <text x="100" y="194" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="14" fill="rgba(196,30,58,0.7)">⛧</text>
          <text x="8" y="104" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="12" fill="rgba(196,30,58,0.5)">✠</text>
        </svg>
        {/* Inner portrait area */}
        <div style={{width:150,height:150,borderRadius:'50%',background:'radial-gradient(circle at 40% 35%, #2a0408, #080204)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative',boxShadow:isLow?'inset 0 0 30px rgba(196,30,58,0.4), 0 0 30px rgba(196,30,58,0.5)':'inset 0 0 20px rgba(0,0,0,0.8)'}}>
          {BOSS_PORTRAITS[enemy.id]?<img src={enemy.id==='lucifer'&&luciferPhase===2?'/vestibule/bosses/lucifer_p2.png':BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:130,height:130,objectFit:'contain',imageRendering:'pixelated'}}/>:<span style={{fontSize:80}}>{enemy.emoji}</span>}
          {isLow&&<div style={{position:'absolute',inset:0,background:'rgba(196,30,58,0.15)',animation:'pulse 1.2s ease infinite alternate'}}/>}
          {/* Portrait cracks — deepen as HP drops */}
          {pct<50&&<svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5}} viewBox="0 0 150 150">
            <path d="M 75 10 L 78 35 L 72 55 L 80 75" stroke="rgba(196,30,58,0.4)" strokeWidth="1" fill="none"/>
          </svg>}
          {pct<35&&<svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5}} viewBox="0 0 150 150">
            <path d="M 40 30 L 55 50 L 48 70 L 58 95" stroke="rgba(196,30,58,0.5)" strokeWidth="1.2" fill="none"/>
            <path d="M 110 20 L 100 45 L 108 65" stroke="rgba(196,30,58,0.4)" strokeWidth="1" fill="none"/>
          </svg>}
          {pct<20&&<svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5}} viewBox="0 0 150 150">
            <path d="M 30 60 L 50 75 L 45 100 L 55 120" stroke="rgba(255,0,0,0.6)" strokeWidth="1.5" fill="none"/>
            <path d="M 120 40 L 105 65 L 115 85 L 100 110" stroke="rgba(255,0,0,0.5)" strokeWidth="1.3" fill="none"/>
            <path d="M 70 5 L 75 30 L 65 55 L 75 80 L 68 110 L 78 140" stroke="rgba(255,0,0,0.7)" strokeWidth="1.8" fill="none"/>
          </svg>}
        </div>
        {debuff>0&&<div style={{position:'absolute',bottom:4,right:4,background:'rgba(0,80,160,0.9)',border:'1px solid #4488ff',borderRadius:4,padding:'2px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,color:'#88aaff',zIndex:3}}>-{debuff}dmg</div>}
      </div>

      {/* BOSS INFO — stripped of parchment backing */}
      <div style={{flex:1,padding:'10px 24px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:6}}>
        {/* Circle badge */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,letterSpacing:5,color:'var(--ink-rust)',textTransform:'uppercase',fontWeight:900,textAlign:'center',opacity:0.85}}>{enemy.circle} · {enemy.subtitle}</div>

        {/* Boss name — oversized BogartsMetalFont, bone-white, slight shadow */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:54,color:'var(--ink-bone)',lineHeight:1,textShadow:chromaStr>0?`-${chromaStr}px 0 rgba(255,0,0,0.5), ${chromaStr}px 0 rgba(0,80,255,0.4), 0 2px 8px rgba(0,0,0,0.9)`:'0 2px 8px rgba(0,0,0,0.9), 0 0 40px rgba(196,30,58,0.3)',textAlign:'center',transform:'rotate(-0.3deg)'}}>{enemy.name}</div>

        {/* Underline — hand-drawn effect */}
        <svg width="280" height="6" viewBox="0 0 280 6" style={{marginTop:-2}}>
          <path d="M 8 3 Q 70 1, 140 3 T 272 3" stroke="var(--blood)" strokeWidth="1" fill="none" opacity="0.6"/>
          <path d="M 12 4 Q 70 5, 140 4 T 268 4" stroke="var(--blood-deep)" strokeWidth="0.6" fill="none" opacity="0.4"/>
        </svg>

        {/* Tagline — ScratchFont italic, like a marginalia scribble */}
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'var(--ink-dim)',fontStyle:'italic',lineHeight:1.2,fontWeight:700,textAlign:'center',cursor:'help',maxWidth:520}} title={enemy.passive+(BOSS_BIOS[enemy.id]?'\n\n'+BOSS_BIOS[enemy.id]:'')}>{'"'+((enemy.tagline||enemy.passive))+'"'}</div>

        {/* Base damage — small MBScribbles */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--ink-rust)',letterSpacing:3,fontWeight:900,textAlign:'center',textTransform:'uppercase'}}>Base Damage · {enemy.baseDmg} per Strike</div>

        {/* BOSS TELEGRAPH — dynamic next-strike preview */}
        {telegraph&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,textAlign:'center',marginTop:2,letterSpacing:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <span style={{color:telegraph.dmg===0?'#44aa44':'var(--blood)',textShadow:telegraph.dmg>0?'0 0 6px rgba(196,30,58,0.4)':'none'}}>{telegraph.dmg===0?'BLOCKED':'NEXT: '+telegraph.dmg+' DMG'}</span>
          <span style={{color:'var(--ink-dim)',fontSize:10}}>→ {telegraph.target}</span>
          {telegraph.special&&<span style={{color:'#cc6600',fontSize:10,border:'1px solid rgba(204,102,0,0.4)',borderRadius:3,padding:'0 4px'}}>+ {telegraph.special}</span>}
        </div>}

        {/* HP SCROLL — hand-drawn ribbon with stamped fraction */}
        <div style={{width:'100%',maxWidth:540,marginTop:6,position:'relative'}}>
          {/* Scroll ends — left */}
          <div style={{position:'absolute',left:-8,top:'50%',transform:'translateY(-50%)',width:16,height:30,background:'linear-gradient(180deg, var(--ink-rust), var(--altar))',border:'1px solid var(--blood-deep)',borderRadius:'3px 1px 1px 3px',zIndex:2,boxShadow:'0 0 6px rgba(0,0,0,0.6)'}}/>
          {/* Scroll ends — right */}
          <div style={{position:'absolute',right:-8,top:'50%',transform:'translateY(-50%)',width:16,height:30,background:'linear-gradient(180deg, var(--ink-rust), var(--altar))',border:'1px solid var(--blood-deep)',borderRadius:'1px 3px 3px 1px',zIndex:2,boxShadow:'0 0 6px rgba(0,0,0,0.6)'}}/>
          {/* Scroll body */}
          <div style={{width:'100%',height:26,background:'linear-gradient(180deg, #1a0608, #0f0406)',border:'1px solid var(--blood-deep)',borderRadius:2,overflow:'hidden',position:'relative',boxShadow:'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)'}}>
            {[25,50,75].map(pp=><div key={pp} style={{position:'absolute',top:0,bottom:0,left:`${pp}%`,width:1,background:'rgba(196,30,58,0.25)',zIndex:2}}/>)}
            {/* HP fill — blood red with ink texture */}
            <div style={{height:'100%',background:isLow?'linear-gradient(90deg,#660000,#c41e3a,#ff2200)':'linear-gradient(90deg,#7a0f1f,#a41528,#c41e3a)',width:`${pct}%`,transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)',animation:isCritical?'bossHpCritical 0.5s ease-in-out infinite':'none',boxShadow:'inset 0 0 8px rgba(100,0,0,0.5)'}}/>
            {/* Stamped fraction */}
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--ink-bone)',letterSpacing:3,textShadow:'0 0 6px rgba(0,0,0,0.99),0 1px 2px rgba(0,0,0,0.99)'}}><span key={'hp-'+currentHp} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{Math.max(0,currentHp)} / {eMaxHp} HP</span></div>
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
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,cursor:onClick?'pointer':'default',position:'relative',paddingBottom:4}} onClick={onClick}
      onMouseEnter={()=>setTipOpen(true)} onMouseLeave={()=>setTipOpen(false)}>
      <div style={{position:'relative',width:90,height:110}}>
        {[2,1,0].map(i=><div key={i} style={{position:'absolute',width:80,height:100,background:i===0?'linear-gradient(135deg,#1e1408,#0a0804)':`rgba(15,10,4,${.7-i*.2})`,border:'1px solid rgba(160,110,35,0.55)',borderRadius:4,top:i*3,left:i*3}}>
          {i===0&&<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,opacity:.2,color:'#c8a060'}}>⛧</div>}
        </div>)}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:'var(--gold)',lineHeight:1}}>{count}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,letterSpacing:3,color:'var(--ink-dim)',textTransform:'uppercase',lineHeight:1}}>{label}</div>
      {tipOpen&&dist&&count>0&&<div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',zIndex:99999,background:'rgba(10,6,2,0.97)',border:'1px solid rgba(160,110,35,0.6)',borderRadius:6,padding:'8px 12px',pointerEvents:'none',minWidth:140,boxShadow:'0 4px 16px rgba(0,0,0,0.8)'}}>
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


// ═══════════════════════════════════════════════════════════
// COMBAT LOG VIEWER — scrollable overlay of all game events
// ═══════════════════════════════════════════════════════════
function CombatLogViewer({log,onClose}){
  function colorForEntry(msg){
    if(msg.startsWith('══'))return '#e8a820'
    if(msg.includes('RIFF CHAIN')||msg.includes('⛧'))return '#ffd700'
    if(msg.includes('damage')||msg.includes('Strike')||msg.includes('💥')||msg.includes('ATK'))return '#ee3333'
    if(msg.includes('heal')||msg.includes('HP')||msg.includes('Séance')||msg.includes('♥'))return '#33dd33'
    if(msg.includes('Corruption')||msg.includes('corruption')||msg.includes('🔮'))return '#cc44ff'
    if(msg.includes('Ember')||msg.includes('ember')||msg.includes('🔥'))return '#ff8800'
    if(msg.includes('stash')||msg.includes('Stash')||msg.includes('🌿'))return '#44cc44'
    if(msg.includes('event')||msg.includes('Mosh')||msg.includes('Cursed')||msg.includes('Blood Oath')||msg.includes('Hellfire')||msg.includes('Sabbath')||msg.includes('Devil'))return '#ff6600'
    if(msg.includes('Bought')||msg.includes('Shop')||msg.includes('Forge'))return '#c8a060'
    if(msg.includes('Too Stoned')||msg.includes('☠')||msg.includes('💀'))return '#ff2222'
    return '#aa9977'
  }
  return(
    <div style={{position:'absolute',inset:0,zIndex:9999,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',padding:'30px 40px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',maxWidth:1200,marginBottom:16}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'#d0b060',textShadow:'0 0 20px rgba(200,150,20,0.3)'}}>Combat Log</div>
        <button onClick={onClose} style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:3,padding:'8px 28px',background:'rgba(40,20,5,0.6)',border:'2px solid #4a3010',borderRadius:4,color:'#c8a040',cursor:'pointer'}}>✕ CLOSE</button>
      </div>
      <div style={{flex:1,width:'100%',maxWidth:1200,overflowY:'auto',background:'rgba(10,6,2,0.6)',border:'1px solid rgba(100,55,10,0.4)',borderRadius:6,padding:'12px 20px'}}>
        {log.map((entry,i)=>{
          const isFightHeader=entry.startsWith('══')
          return <div key={i} style={{
            fontFamily:"'MBScribblesFont',serif",
            fontSize:isFightHeader?26:23,
            color:colorForEntry(entry),
            padding:isFightHeader?'10px 0 4px':'2px 0',
            borderTop:isFightHeader&&i>0?'1px solid rgba(200,150,40,0.2)':'none',
            fontWeight:isFightHeader?900:400,
            letterSpacing:isFightHeader?2:0,
            lineHeight:1.5,
            opacity:isFightHeader?1:0.9
          }}><LogLine text={entry}/></div>
        })}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#665533',marginTop:8}}>{log.length} entries this run</div>
    </div>
  )
}

function EndScreen({won,cause,enemy,stats,seed,onReset,streakWins,streakLosses,totalRuns,isDailyRun,onDailyChallenge,personalBest,dailyStreak,lifetimeScore,discovered,newAchievements,enemyHp,stage,chosenPacts,fullRunLog,newTrophies,runElapsed}){
  const [showEndLog,setShowEndLog]=useState(false)
  const isStoned=cause==='stoned'
  const isBeaten=cause==='beaten'
  const isVictory=cause==='victory'
  const circleReached=Math.floor((stats.fightsSurvived)/3)+1
  const streakMsg=streakWins>1?'🔥 '+streakWins+' WIN STREAK!'+(streakWins>=5?' ⛧ LEGENDARY!':streakWins>=3?' 🎁 BONUS STASH!':''):streakLosses>2?'💀 '+streakLosses+' losses in a row...':''
  const finalScore=calcRunScore(stats,isVictory)
  const grade=getScoreGrade(finalScore,isVictory)
  const streakBonus=dailyStreak>=30?20:dailyStreak>=7?10:dailyStreak>=3?5:0
  const isBest=finalScore>=(personalBest||0)&&finalScore>0
  const dailyBest=getDailyBest()
  const isDailyBest=isDailyRun&&(!dailyBest||finalScore>dailyBest)
  if(isDailyRun&&finalScore>0)saveDailyBest(finalScore)
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
    if(isBest&&scoreReady&&beatBy>0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'#ffd700',fontWeight:900,textShadow:'0 0 20px rgba(255,200,0,0.6)',marginTop:6,animation:'throb 1.5s ease-in-out infinite'}}>🏆 NEW PERSONAL BEST! +{beatBy.toLocaleString()}</div></>
    if(isBest&&scoreReady&&beatBy===0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'#ffd700',fontWeight:900,textShadow:'0 0 20px rgba(255,200,0,0.6)',marginTop:6}}>🏆 PERSONAL BEST!</div></>
    if(shortBy>0&&shortBy<=2000)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'#cc2222',fontWeight:900,textShadow:'0 0 14px rgba(200,0,0,0.5)',marginTop:6}}>SO CLOSE! Only {shortBy.toLocaleString()} pts from your best!</div></>
    if(shortBy>0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#886633',marginTop:6}}>Your Best: {(personalBest||0).toLocaleString()} — {shortBy.toLocaleString()} to beat</div></>
    return streakLabel
  }

  // ── UNLOCK PROGRESS BAR ────────────────────────────────────
  const UnlockBar=()=>(<div style={{width:'100%',maxWidth:600,margin:'8px 0'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
      <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#c8a040',letterSpacing:2,textTransform:'uppercase'}}>Next Unlock</span>
      <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#aa8030'}}>{newLifetime.toLocaleString()} / {nextUnlock.score.toLocaleString()}</span>
    </div>
    <div style={{height:30,background:'rgba(20,12,4,0.8)',border:'1px solid rgba(100,65,15,0.5)',borderRadius:12,overflow:'hidden',position:'relative'}}>
      <div style={{height:'100%',width:(unlockProgress*100)+'%',background:'linear-gradient(90deg,#8a2200,#cc4400,#e8a820)',borderRadius:12,transition:'width 1.5s ease',boxShadow:'0 0 16px rgba(200,100,0,0.5)'}}/>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#fff',textShadow:'0 0 8px rgba(0,0,0,0.9)',letterSpacing:1}}>{nextUnlock.emoji} {nextUnlock.label}</span>
      </div>
    </div>
    {unlocksEarned>0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'#aa8a50',fontStyle:'italic',textAlign:'center',marginTop:3}}>{unlocksEarned} unlock{unlocksEarned>1?'s':''} earned so far</div>}
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#aa8a50',textAlign:'center'}}>{allAchievements.length} / {ACHIEVEMENTS.length} achievements</div>
    </div>)
  }

  // ── NEAR MISS MESSAGES ─────────────────────────────────────
  // ── NEAR MISS — the "one more run" trigger ─────────────────
  const NearMiss=()=>{
    if(isVictory)return null
    const headlines=[]
    // Boss HP remaining
    if(enemyHp>0&&enemyHp<=Math.max(100,stats.highestStrike*0.5)){
      headlines.push({text:enemyHp.toLocaleString()+' HP',sub:'from killing '+(enemy?.name||'the boss')+'!',emoji:'💀',priority:1})
    } else if(enemyHp>0&&enemyHp<=500){
      headlines.push({text:enemyHp.toLocaleString()+' HP',sub:'left on '+(enemy?.name||'the boss'),emoji:'💀',priority:2})
    }
    // One fight from clearing circle
    const fightInCircle=stats.fightsSurvived%3
    if(fightInCircle===2){headlines.push({text:'1 FIGHT',sub:'from clearing Circle '+circleReached,emoji:'🔥',priority:2})}
    // Close to personal best
    if(shortBy>0&&shortBy<=2000){headlines.push({text:shortBy.toLocaleString()+' PTS',sub:'from your personal best!',emoji:'⚡',priority:shortBy<=500?1:3})}
    // Members who barely survived
    if(stage){
      const barelyAlive=stage.filter(m=>m&&!m.tooStoned&&m.hp<=2&&m.hp>0)
      if(barelyAlive.length>0)headlines.push({text:barelyAlive[0].name,sub:'survived with just '+barelyAlive[0].hp+' HP!',emoji:'😰',priority:3})
    }
    // Sort by priority — show the MOST compelling one as the big headline, rest smaller
    headlines.sort((a,b)=>a.priority-b.priority)
    if(headlines.length===0)return null
    const main=headlines[0]
    const others=headlines.slice(1,3)
    const pulseKf='@keyframes nmPulse{0%,100%{transform:scale(1);opacity:0.9}50%{transform:scale(1.04);opacity:1}}'
    const glowKf='@keyframes nmGlow{0%,100%{text-shadow:0 0 30px rgba(255,50,20,0.6),0 0 60px rgba(200,30,0,0.3),2px 2px 0 #000}50%{text-shadow:0 0 50px rgba(255,80,20,0.9),0 0 100px rgba(200,40,0,0.5),2px 2px 0 #000}}'
    return(<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,margin:'16px 0 8px',padding:'24px 50px',background:'rgba(60,0,0,0.25)',border:'1px solid rgba(200,50,20,0.3)',borderRadius:12,maxWidth:800,width:'100%'}}>
      <style>{pulseKf+glowKf}</style>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,letterSpacing:8,color:'#993322',textTransform:'uppercase',fontWeight:900}}>SO CLOSE</div>
      <div style={{display:'flex',alignItems:'baseline',gap:14,animation:'nmPulse 2.5s ease-in-out infinite'}}>
        <span style={{fontSize:56}}>{main.emoji}</span>
        <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:84,fontWeight:900,color:'#ff3311',letterSpacing:3,animation:'nmGlow 2s ease-in-out infinite'}}>{main.text}</span>
      </div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:30,color:'#dd8866',fontStyle:'italic',textShadow:'0 0 15px rgba(200,100,60,0.4)'}}>{main.sub}</div>
      {others.length>0&&<div style={{display:'flex',gap:20,marginTop:8}}>
        {others.map((o,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',background:'rgba(0,0,0,0.3)',borderRadius:6}}>
          <span style={{fontSize:18}}>{o.emoji}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,color:'#cc8866'}}>
            <span style={{fontWeight:900,color:'#ee6644'}}>{o.text}</span> {o.sub}
          </span>
        </div>)}
      </div>}
    </div>)
  }

  // ── RUN HIGHLIGHTS — best moments from this run ───────────
  const RunHighlights=()=>{
    const highlights=[]
    const alive=stage?stage.filter(m=>m&&!m.tooStoned):[]
    const dead=stage?stage.filter(m=>m&&m.tooStoned):[]

    // MVP — member with most permanent ATK bonus (most buffed by cards)
    if(stage){
      const allMembers=stage.filter(Boolean)
      const mvp=allMembers.reduce((best,m)=>(m.permAtkBonus||0)>(best.permAtkBonus||0)?m:best,allMembers[0])
      if(mvp&&(mvp.permAtkBonus||0)>0){
        highlights.push({emoji:mvp.emoji,label:'MVP — '+mvp.name,value:'+'+mvp.permAtkBonus+' ATK earned',color:'#ffd700',big:true})
      }
    }
    // Biggest strike — the money stat
    if(stats.bestMultiplier>2.0){
      highlights.push({emoji:'⛧',label:'Best Multiplier',value:'×'+stats.bestMultiplier.toFixed(2),color:'#ff4400'})
    }
    if(stats.overkillDmg>0){
      highlights.push({emoji:'💥',label:'Overkill Damage',value:'+'+stats.overkillDmg.toLocaleString(),color:'#ff8800'})
    }
    if(stats.highestStrike>=100){
      highlights.push({emoji:'⚔',label:'Biggest Strike',value:stats.highestStrike.toLocaleString(),color:'#ff4422',big:true})
    }
    // Fallen heroes
    if(dead.length>0){
      const names=dead.map(m=>m.name).join(', ')
      highlights.push({emoji:'💀',label:'Fallen',value:dead.length===1?dead[0].name:dead.length+' members lost',color:'#aa3333'})
    }
    // Survivor with lowest HP
    if(alive.length>0){
      const lowestHp=alive.reduce((a,b)=>a.hp<b.hp?a:b)
      if(lowestHp.hp<=3&&!isVictory){
        highlights.push({emoji:'😰',label:lowestHp.name+' barely survived',value:lowestHp.hp+'/'+lowestHp.maxHp+' HP',color:'#ff8844'})
      }
    }
    // Corruption journey
    if(stats.maxCorruption>=69){
      highlights.push({emoji:'🌀',label:'Peak Corruption',value:stats.maxCorruption+'%',color:'#cc44ff'})
    }
    // Pacts collected
    if((chosenPacts||[]).length>0){
      highlights.push({emoji:'📜',label:'Pacts Signed',value:chosenPacts.length.toString(),color:'#c8a040'})
    }
    // Economy
    if(stats.stashEarned>=100){
      highlights.push({emoji:'🌿',label:'Stash Earned',value:stats.stashEarned.toLocaleString(),color:'#44cc44'})
    }
    // Efficiency
    if(stats.strikesThrown>0&&stats.totalDamage>0){
      const avg=Math.round(stats.totalDamage/stats.strikesThrown)
      highlights.push({emoji:'📊',label:'Avg Damage/Strike',value:avg.toLocaleString(),color:'#88aacc'})
    }

    if(highlights.length===0)return null
    // Show top 2 as big cards, rest as small row
    const topTwo=highlights.filter(h=>h.big).slice(0,2)
    const rest=highlights.filter(h=>!topTwo.includes(h)).slice(0,4)

    return(<div style={{background:'rgba(15,8,2,0.9)',border:'1px solid rgba(120,70,15,0.4)',borderRadius:10,padding:'18px 28px',width:'100%',maxWidth:900,margin:'6px 0'}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:6,color:'#886644',textTransform:'uppercase',textAlign:'center',marginBottom:14}}>⛧ Run Highlights ⛧</div>
      {topTwo.length>0&&<div style={{display:'grid',gridTemplateColumns:topTwo.length===1?'1fr':'1fr 1fr',gap:12,marginBottom:rest.length>0?12:0}}>
        {topTwo.map((h,i)=>(<div key={'t'+i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'rgba(0,0,0,0.4)',borderRadius:8,border:'1px solid rgba(120,70,15,0.3)'}}>
          <span style={{fontSize:36,flexShrink:0}}>{h.emoji}</span>
          <div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:h.color,lineHeight:1,textShadow:'0 0 12px '+h.color+'44'}}>{h.value}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#998866',letterSpacing:2,textTransform:'uppercase',marginTop:3}}>{h.label}</div>
          </div>
        </div>))}
      </div>}
      {rest.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat('+Math.min(rest.length,4)+',1fr)',gap:8}}>
        {rest.map((h,i)=>(<div key={'r'+i} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 6px',background:'rgba(0,0,0,0.25)',borderRadius:6}}>
          <span style={{fontSize:18,marginBottom:2}}>{h.emoji}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:h.color,lineHeight:1}}>{h.value}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#776655',letterSpacing:1,textTransform:'uppercase',marginTop:2,textAlign:'center'}}>{h.label}</span>
        </div>))}
      </div>}
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
          ['Run Time',(()=>{if(!runElapsed)return'--:--';const m=Math.floor(runElapsed/60);const s=runElapsed%60;return(m<60?m+':'+(s<10?'0':'')+s:Math.floor(m/60)+'h '+m%60+'m')})()],
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

  // ── "WHY DID I DIE?" — brief death analysis based on run stats ──
  const DeathAnalysis=()=>{
    if(isVictory)return null
    const tips=[]
    if(stats.maxCorruption>=80)tips.push('Corruption hit '+stats.maxCorruption+'%. The darkness consumed your band.')
    if(stats.tooStonedCount>=3)tips.push(stats.tooStonedCount+' members went Too Stoned. Consider more healing cards or Roadie shields.')
    if(circleReached<=2&&stats.highestStrike<30)tips.push('Low damage output. Buff your members with Battle Cry and Amp before striking.')
    if(circleReached>=4&&stats.highestStrike<80)tips.push('Damage didn\'t scale into late game. Look for Riff Chains and strike multipliers.')
    if(stats.strikesThrown>0&&stats.totalDamage/stats.strikesThrown<20)tips.push('Average strike was only '+Math.round(stats.totalDamage/stats.strikesThrown)+' damage. Stack more buffs before each strike.')
    if(chosenPacts.includes('corruption_engine'))tips.push('Corruption Engine pact added +5% corruption every fight. Risky choice.')
    if(stats.cardsPlayed<stats.strikesThrown*3)tips.push('Only '+stats.cardsPlayed+' cards played across '+stats.strikesThrown+' strikes. Play more cards to build stronger strikes.')
    if(tips.length===0)tips.push(enemy?enemy.name+' got the best of you. Adapt your strategy and try again.':'Sometimes Hell wins. Try again.')
    return(
      <div style={{maxWidth:780,width:'100%',padding:'12px 24px',background:'rgba(60,0,0,0.2)',border:'1px solid rgba(196,30,58,0.3)',borderRadius:6,marginTop:4}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--blood)',letterSpacing:3,textTransform:'uppercase',fontWeight:900,marginBottom:6}}>💀 What Went Wrong</div>
        {tips.slice(0,2).map((t,i)=><div key={i} style={{fontFamily:"'ScratchFont',serif",fontSize:15,color:'#aa8060',fontStyle:'italic',lineHeight:1.5,padding:'2px 0'}}>{t}</div>)}
      </div>
    )
  }

  // Shared bottom row
  // ── RUN HISTORY ─────────────────────────────────────────────
  const [showHistory,setShowHistory]=useState(false)
  const runHistory=getRunHistory()
  const RunHistory=()=>runHistory.length>1?(<div style={{width:'100%',maxWidth:780,margin:'4px 0'}}>
    <div onClick={()=>setShowHistory(p=>!p)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#c8a040',letterSpacing:2,textTransform:'uppercase',cursor:'pointer',textAlign:'center',padding:'4px 0'}}>
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
        {!victory&&<button onClick={()=>{onReset()}}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,
            color:'#ff4444',background:'rgba(80,0,0,0.4)',
            border:'1px solid #aa2222',borderRadius:3,
            padding:'10px 24px',cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(120,0,0,0.6)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(80,0,0,0.4)'}>
          ⚡ Quick Restart
        </button>}
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
  // ═══════════════════════════════════════════════════════════
  // UNIFIED END SCREEN — compact, no-scroll, professional
  // ═══════════════════════════════════════════════════════════
  const bgColor=isVictory?'rgba(4,3,1,0.97)':isStoned?'rgba(2,0,0,0.97)':'rgba(6,0,0,0.97)'
    const vignetteColor=isVictory?'rgba(60,40,0,0.5)':isStoned?'rgba(0,80,0,0.4)':'rgba(80,0,0,0.5)'

  // Compact stats — 2 rows of 5
  const compactStats=[
    ['Circle',isVictory?'ALL 9 ⛧':circleReached+' / 9'],
    ['Fights',stats.fightsSurvived],
    ['Strikes',stats.strikesThrown],
    ['Cards',stats.cardsPlayed],
    ['Damage',stats.totalDamage.toLocaleString()],
    ['Best Hit',stats.highestStrike.toLocaleString()],
    ['Stoned',stats.tooStonedCount],
    ['Corrupt',stats.maxCorruption+'%'],
    ['Stash',stats.stashEarned+'🌿'],
    ['Run #',totalRuns||1],
    ['Overkill',stats.overkillDmg>0?'+'+stats.overkillDmg.toLocaleString():'—'],
  ]

  // Title section varies by type
  const TitleBlock=()=>{
    if(isStoned)return(<>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:100,color:'#cc1111',textShadow:'-4px 0 rgba(255,0,0,0.9),4px 0 rgba(0,255,80,0.7),0 0 50px rgba(180,0,0,0.8),3px 3px 0 #000',lineHeight:1}}>Stoned to the Bone</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:30,color:'#44ff44',fontStyle:'italic',textShadow:'0 0 15px rgba(60,255,60,0.7)'}}>The band ran out of herb.</div>
    </>)
    if(isBeaten)return(<>
      <div style={{display:'flex',alignItems:'center',gap:20}}>
        {BOSS_QUOTES[enemy?.id]&&<div style={{position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',fontFamily:"'ScratchFont',serif",fontSize:18,color:'rgba(196,30,58,0.7)',fontStyle:'italic',textShadow:'0 0 12px rgba(196,30,58,0.3)',zIndex:2,whiteSpace:'nowrap'}}>"{BOSS_QUOTES[enemy.id]}"</div>}
        <div style={{fontSize:80,filter:'drop-shadow(0 0 20px rgba(200,0,0,0.5))'}}>{enemy&&BOSS_PORTRAITS[enemy.id]?<img src={BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:80,height:80,objectFit:'contain',imageRendering:'pixelated'}}/>:enemy?.emoji||'💀'}</div>
        <div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:6,color:'#662222',textTransform:'uppercase'}}>Defeated by</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'#cc2222',lineHeight:1,textShadow:'-2px 0 rgba(255,0,0,0.6),2px 0 rgba(180,0,0,0.4),0 0 30px rgba(160,0,0,0.5),2px 2px 0 #000'}}>{enemy?.name||'The Vestibule'}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:'#aa4444',textTransform:'uppercase'}}>{enemy?.circle||''}</div>
          {enemy?.passive&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#884444',marginTop:4,fontStyle:'italic'}}>"{enemy.passive}"</div>}
          <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap'}}>
            {[['Fights',stats.fightsSurvived||0],['Chains',stats.chainsTriggered||0],['Cards Played',stats.cardsPlayed||0],['Max Strike',stats.highestStrike?stats.highestStrike.toLocaleString():'0']].map(([label,val],i)=>
              <div key={i} style={{background:'rgba(60,20,20,0.4)',border:'1px solid rgba(120,40,40,0.3)',borderRadius:4,padding:'4px 10px',textAlign:'center'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#886655',letterSpacing:1,textTransform:'uppercase'}}>{label}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'#cc8866'}}>{val}</div>
              </div>)}
          </div>
        </div>
      </div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'#cc6666',fontStyle:'italic',textShadow:'0 0 12px rgba(180,0,0,0.3)',maxWidth:500,textAlign:'center'}}>"{enemy?.tagline||'The Vestibule claims another soul.'}"</div>
    </>)
    return(<>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:90,color:'#d8c9a8',textShadow:'0 0 40px rgba(210,160,20,0.5),2px 2px 0 #000'}}>⛧ Victory ⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'#a09060',fontStyle:'italic'}}>All 9 circles conquered. Lucifer has fallen.</div>
    </>)
  }

  return(
    <div style={{position:'absolute',inset:0,zIndex:9800,background:bgColor,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.8s ease',overflow:'hidden'}}>
      {/* Scanlines */}
      
      {/* Vignette */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 20%,'+vignetteColor+' 100%)',pointerEvents:'none',zIndex:0}}/>
      {/* Watermark */}
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:0}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:300,color:'rgba(180,180,180,0.04)',userSelect:'none',lineHeight:1}}>Vestibule</div>
      </div>

      {/* MAIN CONTENT — vertically centered, horizontally structured */}
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:10,maxWidth:1400,width:'95%'}}>

        {/* ROW 1: Title */}
        <TitleBlock/>

        {/* ROW 2: NearMiss (prominent) + Play Again side by side */}
        <div style={{display:'flex',alignItems:'center',gap:20,marginTop:4,width:'100%',justifyContent:'center'}}>
          <NearMiss/>
        </div>

        {/* ROW 2.5: Death Analysis — why did I die? */}
        <DeathAnalysis/>

        {/* ROW 3: Score + Play Again */}
        <div style={{display:'flex',alignItems:'center',gap:40,marginTop:4}}>
          {/* Score block */}
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:76,fontWeight:900,color:grade.color,textShadow:'0 0 25px '+grade.color+',2px 2px 0 #000',letterSpacing:2,lineHeight:1}}>{displayScore.toLocaleString()}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:6,color:grade.color,textTransform:'uppercase',marginTop:4,textShadow:'0 0 8px '+grade.color}}>{grade.label}</div>
            {stakeInfo.id!=='bronze'&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:stakeInfo.color,letterSpacing:2,marginTop:3,padding:'2px 12px',border:'1px solid '+stakeInfo.color,borderRadius:3,background:'rgba(0,0,0,0.4)',display:'inline-block'}}>{stakeInfo.name.toUpperCase()} ×{stakeInfo.scoreMult}</div>}
            <BestGap/>
            {isDailyRun&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:isDailyBest?'#44ccff':'#668899',marginTop:4}}>
              {isDailyBest?'🌍 NEW DAILY BEST!':'🌍 Daily Best: '+(dailyBest||0).toLocaleString()}
            </div>}
          </div>
          {/* Play Again button — RIGHT NEXT TO score */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            <button onClick={()=>{onReset()}}
              style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:40,letterSpacing:6,
                color:isVictory?'#ffd700':'#ee2222',
                background:isVictory?'rgba(60,40,0,0.4)':'rgba(120,0,0,0.3)',
                border:isVictory?'3px solid #c8a020':'3px solid #aa0000',
                borderRadius:8,padding:'18px 60px',cursor:'pointer',textTransform:'uppercase',
                textShadow:isVictory?'0 0 25px rgba(200,150,0,0.6)':'0 0 25px rgba(200,0,0,0.6)',
                boxShadow:isVictory?'0 0 35px rgba(200,150,0,0.3)':'0 0 35px rgba(200,0,0,0.3)',
                animation:'throb 2s ease-in-out infinite',transition:'all 0.15s'}}>
              {isVictory?'⛧ Play Again ⛧':'↺ Play Again'}
            </button>
            <button onClick={()=>setShowEndLog(true)}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,
                padding:'10px 28px',background:'rgba(30,15,5,0.6)',
                border:'2px solid #4a3010',borderRadius:6,color:'#8a7040',cursor:'pointer'}}>
              📜 Run Log
            </button>
            {isVictory&&<button onClick={()=>{/* Encore: restart with scaled enemies */
              setEncoreMode(true);setEncoreCircle(p=>p+10)
              setFightIndex(0);setEnemy(ENEMIES[0]);const _wHp=Math.round(ENEMIES[0].maxHp*activeStake.hpMult*2.0);setEnemyHp(_wHp);setScaledMaxHp(_wHp)
              setStrikesLeft(activeStake.maxStrikes);setFightMaxStrikes(activeStake.maxStrikes);setDiscardsLeft(4);setFightMaxDiscards(4)
              setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:m.maxHp}):m))
              setGameState('playing');setAnimPhase('idle');setDeathCause(null)
              setVictoryFired(false);if(victoryFiredRef)victoryFiredRef.current=false
    corruptCardsGivenRef.current=[];setCorruptionGiftsGiven([])
              addLog('⛧ THE ENCORE BEGINS — All enemies ×2.0 HP! ⛧')
            }}
              style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,letterSpacing:4,
                color:'#ff4400',background:'rgba(120,0,0,0.4)',
                border:'2px solid #ff4400',borderRadius:8,padding:'10px 36px',cursor:'pointer',
                textShadow:'0 0 20px rgba(255,68,0,0.7)',boxShadow:'0 0 25px rgba(255,68,0,0.3)',
                animation:'throb 2s ease-in-out infinite'}}>⛧ The Encore ⛧</button>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={handleShare}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:2,
                  color:copied?'#44cc44':'#c8a040',background:'rgba(40,25,5,0.5)',
                  border:'1px solid '+(copied?'#44cc44':'#8a6020'),borderRadius:3,
                  padding:'6px 14px',cursor:'pointer',textTransform:'uppercase'}}>
                {copied?'✓ Copied':'📋 Share'}
              </button>
              <button onClick={()=>onDailyChallenge&&onDailyChallenge()}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:2,color:'#c8a040',background:'rgba(40,25,5,0.5)',border:'1px solid #8a6020',borderRadius:3,padding:'8px 18px',cursor:'pointer',textTransform:'uppercase'}}>
                🌍 Daily
              </button>
            </div>
          </div>
        </div>

        {/* ROW 4: Unlock bar (compact) */}
        <div style={{width:'100%',maxWidth:900}}>
          <UnlockBar/>
        </div>

        {/* ROW 5: Stats grid — 2 rows of 5, compact */}
        <div style={{background:'rgba(15,8,3,0.85)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:8,padding:'18px 36px',width:'100%',maxWidth:1000}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'4px 12px'}}>
            {compactStats.map(function(row){
              return(
                <div key={row[0]} style={{textAlign:'center',padding:'4px 0'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'#8a7050',letterSpacing:2,textTransform:'uppercase'}}>{row[0]}</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:30,fontWeight:900,color:isVictory&&row[0]==='Circle'?'#ffdd44':'#c8a060'}}>{row[1]}</div>
                </div>
              )
            })}
          </div>
          {/* Last run comparison */}
          {(()=>{const hist=getRunHistory();const last=hist.length>0?hist[0]:null;if(!last)return null
            const thisScore=calcRunScore(stats,isVictory);const diff=thisScore-(last.score||0)
            const thisDmg=stats.totalDamage;const diffDmg=thisDmg-(last.damage||0)
            return <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:6,padding:'4px 0'}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a7050',letterSpacing:2}}>VS LAST RUN:</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:diff>0?'#44cc44':diff<0?'#cc4444':'#888'}}>SCORE {diff>0?'+':''}{diff.toLocaleString()}</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:diffDmg>0?'#44cc44':diffDmg<0?'#cc4444':'#888'}}>DMG {diffDmg>0?'+':''}{diffDmg.toLocaleString()}</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#887755'}}>({last.cause==='victory'?'Won':'C'+last.circle})</span>
            </div>
          })()}
        </div>
        {newTrophies&&newTrophies.length>0&&<div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
          {newTrophies.map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 20px',
              background:'rgba(60,40,0,0.7)',border:'2px solid #ffd700',borderRadius:8,
              animation:'throb 1.5s ease-in-out infinite',
              boxShadow:'0 0 20px rgba(255,200,0,0.3)'}}>
              <span style={{fontSize:28}}>{BOSS_PORTRAITS[t.id]?<img src={BOSS_PORTRAITS[t.id]} alt={t.name} style={{width:28,height:28,objectFit:'contain',imageRendering:'pixelated'}}/>:t.emoji}</span>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#ffd700',letterSpacing:2,fontWeight:900}}>NEW TROPHY</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#ffe080',fontWeight:900}}>{t.name}</div>
              </div>
              <span style={{fontSize:18}}>💀</span>
            </div>
          ))}
        </div>}

                {/* ROW 5.5: Mastery Progress — top 3 cards closest to next tier */}
        {(()=>{
          const mData=getMasteryData()
          const progress=ALL_CARDS.filter(c=>!c.consumable).map(c=>{
            const plays=mData[c.id]||0
            if(plays===0)return null
            let tier=MASTERY_TIERS[0]
            for(const t of MASTERY_TIERS){if(plays>=t.min)tier=t}
            const tierIdx=MASTERY_TIERS.indexOf(tier)
            const nextTier=MASTERY_TIERS[tierIdx+1]
            if(!nextTier)return null // already Legendary
            const pct=Math.round(((plays-tier.min)/(nextTier.min-tier.min))*100)
            return{card:c,plays,tier,nextTier,pct}
          }).filter(Boolean).sort((a,b)=>b.pct-a.pct).slice(0,3)
          if(progress.length===0)return null
          return(
            <div style={{display:'flex',gap:12,justifyContent:'center',width:'100%',maxWidth:1000}}>
              {progress.map(p=>(
                <div key={p.card.id} style={{flex:1,maxWidth:300,background:'rgba(15,8,3,0.85)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:8,padding:'12px 16px',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:22}}>{p.card.emoji}</span>
                    <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#e8d090'}}>{p.card.name}</span>
                  </div>
                  <div style={{width:'100%',height:12,background:'rgba(0,0,0,0.5)',borderRadius:6,overflow:'hidden',border:'1px solid '+(p.nextTier.border||'#444')+'44'}}>
                    <div style={{height:'100%',width:p.pct+'%',background:p.nextTier.border||'#888',borderRadius:6,transition:'width 0.5s',boxShadow:'0 0 8px '+(p.nextTier.glow||'transparent')}}/>
                  </div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:p.nextTier.color||'#888'}}>
                    {p.plays}/{p.nextTier.min} → {p.nextTier.name}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

                {/* ROW 6: Achievements + Discoveries + Streak — all inline */}
        <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>
          {newAchIds.length>0&&newAchIds.slice(0,4).map(id=>{const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return null;return <div key={id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'#ffd700',background:'rgba(60,40,0,0.7)',border:'1px solid #ffd700',borderRadius:4,padding:'3px 10px',animation:'throb 1.5s ease-in-out infinite'}}>{a.emoji} {a.label}</div>})}
          {discoveryList.slice(0,4).map((d,i)=><div key={i} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#e8a820',background:'rgba(40,25,5,0.7)',border:'1px solid rgba(200,140,30,0.3)',borderRadius:3,padding:'2px 8px'}}>NEW: {d}</div>)}
          {dailyStreak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'#ff6600',padding:'4px 16px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:3}}>🔥 {dailyStreak} DAY STREAK</div>}
          {streakMsg&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:streakWins>1?'#ff6600':'#aa4444',padding:'3px 12px',background:'rgba(0,0,0,0.5)',border:'1px solid '+(streakWins>1?'#ff6600':'#aa4444'),borderRadius:3}}>{streakMsg}</div>}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'#886644'}}>{allAchievements.length}/{ACHIEVEMENTS.length} achievements</div>
        </div>

        {/* ROW 7: Run History (collapsed) + Seed */}
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <RunHistory/>
          <BottomRow/>
        </div>
      </div>
      {showEndLog&&fullRunLog&&<CombatLogViewer log={fullRunLog} onClose={()=>setShowEndLog(false)}/>}
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
        <div style={{fontSize:64,textAlign:'center',padding:'20px 0',background:'rgba(0,0,0,0.4)',overflow:'hidden'}}>{MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={55}/>:m.emoji}</div>
        <div style={{padding:'0 16px 16px'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:'#e8d090',textAlign:'center',marginBottom:4}}>{m.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,letterSpacing:2,color:'#8a7040',textAlign:'center',marginBottom:10}}>{m.role}</div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px',background:'rgba(0,0,0,0.5)',borderRadius:4,marginBottom:8}}>
            <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#ee2222',fontWeight:900}}>ATK</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:'#ee2222'}}>{m.atk}</div></div>
            <div style={{textAlign:'center',alignSelf:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:bc,fontWeight:700}}>{m.keyword}</div></div>
            <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#33dd33',fontWeight:900}}>HP</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:'#33dd33'}}>{m.hp}</div></div>
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a7040',textAlign:'center'}}>{m.desc}</div>
          {m.roleBondBonus>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#e8a820',textAlign:'center',marginTop:8}}>🔗 +{m.roleBondBonus} ATK Bond</div>}
        </div>
        <div style={{background:'rgba(232,168,32,0.15)',padding:'12px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:'#e8a820',letterSpacing:2}}>KEEP THIS ONE</div>
      </div>
    )
  }
  return(
    <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(2,1,0,0.98)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:'20px 20px',overflow:'hidden'}}>
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
    <div style={{position:'absolute',inset:0,zIndex:9600,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'20px 20px',overflow:'hidden'}}>
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
              <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,background:'rgba(0,0,0,0.35)',overflow:'hidden'}}>{MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={55} noSquiggle/>:m.emoji}</div>
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
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#8a7040',textAlign:'center',lineHeight:1.3}}>{m.desc}</div>
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
                <span style={{display:'inline-flex',alignItems:'center',gap:4}}>🔥 {fireSellPrice(m)}<WeedLeaf size={14}/></span>
              </button>
            </div>
          ))}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'#aa7744',textAlign:'center',marginTop:10,letterSpacing:1,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>Stash: {stash}<WeedLeaf size={14}/> · Refund shown per member</div>
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


// ═══ TUTORIAL TOOLTIP ═══
function TutorialTooltip({tip,onDismiss}){
  if(!tip)return null
  // Position mapping based on target
  const positions={
    boss:{top:'22%',left:'50%',transform:'translateX(-50%)'},
    hand:{bottom:'370px',left:'50%',transform:'translateX(-50%)'},
    embers:{bottom:'180px',right:'160px'},
    strike:{bottom:'280px',right:'80px'},
    corruption:{top:'40%',right:'80px'},
  }
  const pos=positions[tip.target]||{top:'40%',left:'50%',transform:'translateX(-50%)'}
  return(
    <div style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',...pos,maxWidth:500,background:'linear-gradient(180deg,#1a1208,#0a0704)',border:'3px solid #e8a820',borderRadius:12,padding:'24px 32px',boxShadow:'0 0 60px rgba(232,168,32,0.4),0 8px 40px rgba(0,0,0,0.9)',zIndex:100000}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,color:'#e8d0a0',lineHeight:1.5,marginBottom:16,textShadow:'0 1px 3px rgba(0,0,0,0.8)'}}>{tip.text}</div>
        <button onClick={onDismiss} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,color:'#e8a820',background:'rgba(232,168,32,0.15)',border:'2px solid #e8a820',borderRadius:6,padding:'10px 32px',cursor:'pointer',textTransform:'uppercase',display:'block',margin:'0 auto'}}>Got it</button>
      </div>
    </div>
  )
}

// ═══ TUTORIAL POST-FIGHT MESSAGE ═══
function TutorialMessage({text,onContinue,isFinal}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:99998,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:600,background:'linear-gradient(180deg,#1a1208,#0a0704)',border:'3px solid '+(isFinal?'#cc1111':'#e8a820'),borderRadius:12,padding:'40px 48px',textAlign:'center',boxShadow:'0 0 80px '+(isFinal?'rgba(200,0,0,0.5)':'rgba(232,168,32,0.4)')}}>
        {isFinal&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'#cc1111',textShadow:'0 0 30px rgba(200,0,0,0.8)',letterSpacing:8,marginBottom:16}}>Tutorial Complete</div>}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:isFinal?20:24,color:'#e8d0a0',lineHeight:1.6,marginBottom:24}}>{isFinal?'You know the basics. The full descent awaits — 9 Circles, 27 enemies, 1 chance. Discover Riff Chains, forge upgrades, and choose your pacts. The deeper you go, the darker it gets.':text}</div>
        <button onClick={onContinue} style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,letterSpacing:6,color:isFinal?'#ee2222':'#e8a820',background:isFinal?'rgba(200,0,0,0.2)':'rgba(232,168,32,0.15)',border:'2px solid '+(isFinal?'#cc1111':'#e8a820'),borderRadius:6,padding:'14px 48px',cursor:'pointer',textTransform:'uppercase',whiteSpace:'nowrap'}}>{isFinal?'⛧ Enter the Vestibule ⛧':'Continue'}</button>
      </div>
    </div>
  )
}

function App(){
  const [gameState,setGameState]=useState('menu')
  const [screenFade,setScreenFade]=useState(false)
  const prevGameStateRef=useRef('menu')
  useEffect(()=>{
    if(gameState!==prevGameStateRef.current&&gameState!=='playing'){
      setScreenFade(true)
      setTimeout(()=>setScreenFade(false),350)
    }
    prevGameStateRef.current=gameState
  },[gameState])
  const [bootScreen,setBootScreen]=useState(true) // venue marquee on every load
  const [coldOpenPhase,setColdOpenPhase]=useState(()=>typeof window!=='undefined'&&!localStorage.getItem('vst_seen_intro')?0:null)
  const [tutorialFight,setTutorialFight]=useState(0)
  const [firstTip,setFirstTip]=useState(null) // {id, text} for first-encounter tips // 0=not in tutorial, 1/2/3=tutorial fight
  const [tutorialTipIdx,setTutorialTipIdx]=useState(0) // which tooltip in current fight's sequence
  const [tutorialShopDone,setTutorialShopDone]=useState(false)
  const [showTutorialMsg,setShowTutorialMsg]=useState(null) // post-fight message
  const getDailySeed=()=>{const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))}
  const [runSeed,setRunSeed]=useState(()=>Math.floor(Math.random()*0xFFFFFF))
  const [isDailyRun,setIsDailyRun]=useState(false)
  const [fightIndex,setFightIndex]=useState(0)
  const [enemy,setEnemy]=useState(ENEMIES[0])
  const [enemyHp,setEnemyHp]=useState(ENEMIES[0].maxHp)
  const [scaledMaxHp,setScaledMaxHp]=useState(ENEMIES[0].maxHp)
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
  const [fightMaxStrikes,setFightMaxStrikes]=useState(MAX_STRIKES) // dynamic — includes pact bonuses, card effects
  const [fightMaxDiscards,setFightMaxDiscards]=useState(MAX_DISCARDS) // dynamic — includes bonusDiscards, card effects
  const [isWiggling,setIsWiggling]=useState(false)
  const [dmgBreakdown,setDmgBreakdown]=useState(null) // {lines:[], total:0, showing:true}
  const [projectiles,setProjectiles]=useState([])
  const [floats,setFloats]=useState([])
  const [hovered,setHovered]=useState(null)
  const [selected,setSelected]=useState([])
  const [dragCardUid,setDragCardUid]=useState(null)
  const [quickPlayCardUid,setQuickPlayCardUid]=useState(null) // tap-to-play: selected card
  const [dragStageIdx,setDragStageIdx]=useState(null)
  const [dragOverSlotIdx,setDragOverSlotIdx]=useState(null) // ghost preview
  const [dragHandIdx,setDragHandIdx]=useState(null)
  const [dragOverHandIdx,setDragOverHandIdx]=useState(null)
  const [handSort,setHandSort]=useState(()=>localStorage.getItem('vst_handsort')||'none') // 'none'|'embers'|'rarity'
  const [log,setLog]=useState(['⛧ The gig begins.'])
  const fullRunLogRef=useRef(['⛧ The gig begins.'])
  const [showCombatLog,setShowCombatLog]=useState(false)
  const [showDiscardPreview,setShowDiscardPreview]=useState(false)
  const [undoSnapshot,setUndoSnapshot]=useState(null) // one-step undo for last card play
  const [damageFlash,setDamageFlash]=useState(false)
  const [animPhase,setAnimPhase]=useState('idle')
  const [speedMode,setSpeedMode]=useState(()=>localStorage.getItem('vst_speed')==='fast')
  const [footerCollapsed,setFooterCollapsed]=useState(false)
  const [strikingMemberIdx,setStrikingMemberIdx]=useState(-1)
  const [strikeAnim,setStrikeAnim]=useState(null) // {slotIdx,phase,dx,dy}
  const [bossStrikeAnim,setBossStrikeAnim]=useState(null) // {targetIdx,phase}
  const [hitMemberIdx,setHitMemberIdx]=useState(-1) // which member is shaking from boss hit
  const [bossQuoteTypewriter,setBossQuoteTypewriter]=useState(null) // typewriter quote after boss kill
  const [showConfetti,setShowConfetti]=useState(false) // victory confetti
  const [cardAbsorb,setCardAbsorb]=useState(null)
  const [flyingCard,setFlyingCard]=useState(null) // {emoji,type,fromX,fromY,toX,toY,key}
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
  const [upgradedCards,setUpgradedCards]=useState([])
  const [newTrophies,setNewTrophies]=useState([]) // card IDs upgraded at campfire this run
  const [pactChoices,setPactChoices]=useState([]) // 2 pact options for current choice
  const [descentData,setDescentData]=useState(null) // {circleNum, fights, reward1, reward2}
  const skipDescentRef=useRef(false)
  const overrideFightIdxRef=useRef(null) // set by descent to override next fight index
  const [corruption,setCorruption]=useState(0)

  const [stageDiveUsed,setStageDiveUsed]=useState(false)
  const [diceTarget,setDiceTarget]=useState(null)
  const [showDice,setShowDice]=useState(false)

  // ── PARTICLE SYSTEM — lightweight CSS-animated particles ──────
  const [vfxParticles,setVfxParticles]=useState([])
  const pidRef=useRef(0)
  const spawnParticles=useCallback((x,y,count,color,spread)=>{
    spread=spread||60
    const ps=Array.from({length:count},()=>{
      const id=pidRef.current++
      const angle=Math.random()*Math.PI*2
      const dist=Math.random()*spread+10
      const dx=Math.cos(angle)*dist
      const dy=Math.sin(angle)*dist-(spread*0.5) // bias upward
      const size=Math.random()*5+2
      const dur=Math.random()*600+400
      return{id,x,y,dx,dy,size,dur,color:color||'#ff4400'}
    })
    setVfxParticles(p=>[...p,...ps].slice(-80)) // cap at 80
    setTimeout(()=>setVfxParticles(p=>p.filter(pp=>!ps.some(n=>n.id===pp.id))),1200)
  },[])
  const [pendingEmbers,setPendingEmbers]=useState(0)
  const [slowBurnStrikes,setSlowBurnStrikes]=useState(0)
  const [venomDotStacks,setVenomDotStacks]=useState(0)
  const [ampFeedbackDiscount,setAmpFeedbackDiscount]=useState(0)
  const [pyromaniacActive,setPyromaniacActive]=useState(false)
  const [pendingDraw,setPendingDraw]=useState(0)
  const [bonusDiscards,setBonusDiscards]=useState(0) // extra discards next fight from descent
  const [bonusEmbers,setBonusEmbers]=useState(0) // extra embers next fight from descent
  const [lastRiffPlayed,setLastRiffPlayed]=useState(null)
  const [cardsPlayedThisStrike,setCardsPlayedThisStrike]=useState([])
  const cardsPlayedRef=useRef([])
  const combosFiredRef=useRef([])
  const [comboFlash,setComboFlash]=useState(null) // {name,color,emoji}
  const [combosDiscoveredThisRun,setCombosDiscoveredThisRun]=useState([])
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
  const [clutchFlash,setClutchFlash]=useState(null)
  const [chainFlashActive,setChainFlashActive]=useState(false) // {text,color} for clutch moments
  const [circlePreview,setCirclePreview]=useState(null) // next circle preview data
  const [collectedLoot,setCollectedLoot]=useState([]) // boss loot IDs collected this run
  const [circleSplash,setCircleSplash]=useState(null)
  const [preFightSplash,setPreFightSplash]=useState(null) // {enemy,circle,quote}
  const [showCredits,setShowCredits]=useState(false)
  const [pendingEvent,setPendingEvent]=useState(null)
  const [possessionFired,setPossessionFired]=useState(false)
  const corruptCardsGivenRef=useRef([]) // track which thresholds have given cards (ref to avoid React 18 double-fire)
  // ═══ CORRUPTION DECK — give free cards at thresholds ═══
  useEffect(()=>{
    if(gameState!=='playing'||tutorialFight>0)return
    const thresholds=[25,50,75]
    thresholds.forEach(t=>{
      if(corruption>=t&&!corruptCardsGivenRef.current.includes(t)&&CORRUPTION_CARDS[t]){
        corruptCardsGivenRef.current=[...corruptCardsGivenRef.current,t]
        const cc=Object.assign({},CORRUPTION_CARDS[t],{uid:uid()})
        setHand(p=>[...p,cc])
        addLog('🌀 Corruption reaches '+t+'%! A dark card appears in your hand: '+cc.name)
        addFloat(cc.name,960,400,'#cc1144',true)
      }
    })
  },[corruption,gameState,tutorialFight])
  const [corruptionFlash,setCorruptionFlash]=useState(null)
  const lastCorruptThreshold=useRef(0) // current HELL_EVENT or null
  const [eventsSeenThisRun,setEventsSeenThisRun]=useState([]) // ids of events seen // {circleNum, circleName, circleEmoji} for 3s transition
  const milestonesFiredRef=useRef({half:false,quarter:false,tenth:false})
  const [phaseBanner,setPhaseBanner]=useState('play') // 'play','strike','boss'
  const [deckViewOpen,setDeckViewOpen]=useState(false)
  const [discardViewOpen,setDiscardViewOpen]=useState(false)
  const [circleArtifact,setCircleArtifact]=useState(()=>STARTER_ARTIFACTS[Math.floor(Math.random()*STARTER_ARTIFACTS.length)])
  const [circlePassive,setCirclePassive]=useState(()=>STARTER_PASSIVES[Math.floor(Math.random()*STARTER_PASSIVES.length)])
  const [activeArtifacts,setActiveArtifacts]=useState([]) // max 3
  const [discovered,setDiscovered]=useState(new Set())
  const [newAchievements,setNewAchievements]=useState([])
  const [polaroidNotif,setPolaroidNotif]=useState(null)
  const [menuView,setMenuView]=useState(null) // null, 'unlocks', 'rules', 'options'
  const [unlockTab,setUnlockTab_]=useState('milestones')
  const [unlockPage,setUnlockPage_]=useState(0)
  const [unlockHover,setUnlockHover]=useState(null) // card data for tooltip
  const setUnlockTab=(t)=>{setUnlockTab_(t);setUnlockPage_(0);setUnlockHover(null)}
  const [showPauseOptions,setShowPauseOptions]=useState(false)
  const chainHintsOn=localStorage.getItem('vst_chainhints')!=='off'&&(JSON.parse(localStorage.getItem('vst_combos_discovered')||'[]')).length>0
  const vhsOn=localStorage.getItem('vst_vhs')!=='off'


  const speedMult=speedMode?0.5:1.0
  const [showMastery,setShowMastery]=useState(false)
  const [selectedDeck,setSelectedDeck]=useState('standard')
  const [encoreMode,setEncoreMode]=useState(false)
  const [encoreCircle,setEncoreCircle]=useState(0)
  const [showTrophies,setShowTrophies]=useState(false)
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
  const tryAchieve=useCallback((id)=>{if(unlockAchievement(id)){setNewAchievements(p=>[...p,id]);const a=ACHIEVEMENTS.find(x=>x.id===id);if(a){setPolaroidNotif({emoji:a.emoji,label:a.label});setTimeout(()=>setPolaroidNotif(null),3500)}}},[])
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
    if(gameState==='circleSplash'||gameState==='event')return // no music during splash/event
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
  const bestRunCircle=parseInt(localStorage.getItem('vst_best_circle')||'0')
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
  const [creditsRoll,setCreditsRoll]=useState(false) // full credits after beating Lucifer
  const [welcomeToHell,setWelcomeToHell]=useState(null) // 'choice','cutscene','fighting','won','lost'
  const [contractsPlayed,setContractsPlayed]=useState(0)
  const wthStrikesRef=useRef(0)
  const [stolenAtkPool,setStolenAtkPool]=useState(0) // soulThief: total ATK stolen, returned on win
  const [tripUsedThisFight,setTripUsedThisFight]=useState(false)
  const [stats,setStats]=useState({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0,overkillDmg:0,bestMultiplier:1.0})

  
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
    fullRunLogRef.current=[m,...fullRunLogRef.current]
    setLog(p=>[m,...p.slice(0,99)])
  }
  const addFloat=(v,x,y,color,big)=>{big=big||false;const id=fid.current++;if(localStorage.getItem('vst_dmgnums')==='off')return;setFloats(p=>[...p,{id,v,x,y,color:color||'#dd2222',big}]);spawnParticles(x,y,big?12:5,color||'#dd2222',big?80:40)}
  const remFloat=id=>setFloats(p=>p.filter(f=>f.id!==id))
  // ── BOOT SCREEN — venue marquee, dismiss on any key/click ──────
  useEffect(()=>{
    if(!bootScreen)return
    const dismiss=()=>setBootScreen(false)
    const auto=setTimeout(dismiss,4000)
    window.addEventListener('keydown',dismiss)
    window.addEventListener('click',dismiss)
    return()=>{clearTimeout(auto);window.removeEventListener('keydown',dismiss);window.removeEventListener('click',dismiss)}
  },[bootScreen])

  // ── COLD OPEN SPLASH — first-launch cinematic ──────────────
  useEffect(()=>{
    if(coldOpenPhase===null)return
    if(coldOpenPhase===5){localStorage.setItem('vst_seen_intro','1');setColdOpenPhase(null);return}
    // Only auto-advance while on menu — gameplay overrides splash
    if(gameState!=='menu')return
    const timings={0:300,1:400,2:800,3:1000,4:500}
    const ms=timings[coldOpenPhase]||500
    const t=setTimeout(()=>setColdOpenPhase(p=>(p===null?null:p+1)),ms)
    return()=>clearTimeout(t)
  },[coldOpenPhase,gameState])
  useEffect(()=>{
    if(coldOpenPhase===null)return
    function onKey(e){
      if(e.key===' '||e.key==='Enter'||e.key==='Escape'||e.key==='Spacebar'){
        e.preventDefault()
        setColdOpenPhase(5)
      }
    }
    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)
  },[coldOpenPhase])
  const fightStartTimeRef=useRef(0)
  const runStartTimeRef=useRef(Date.now())
  const corruptionAtFightStartRef=useRef(0)
  const cardsPlayedThisFightRef=useRef(0)
  const highestStrikeThisFightRef=useRef(0)
  const damageThisFightRef=useRef(0)
  const embersSpentThisFightRef=useRef(0)
  const [victorySummary,setVictorySummary]=useState(null)
  const updStat=(key,val,isMax)=>{
    isMax=isMax||false
    setStats(p=>Object.assign({},p,{[key]:isMax?Math.max(p[key],val):p[key]+val}))
    if(key==='cardsPlayed')cardsPlayedThisFightRef.current+=val
    else if(key==='highestStrike')highestStrikeThisFightRef.current=Math.max(highestStrikeThisFightRef.current,val)
    else if(key==='totalDamage')damageThisFightRef.current+=val
  }
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
      if(nd.length===0){if(ndisc.length===0)break;nd=[...ndisc].filter(Boolean).sort(()=>Math.random()-.5);ndisc=[];addLog('🔄 Deck reshuffled.');spawnParticles(960,800,15,'#c8a060',60)}
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
  // ═══ TUTORIAL START ═══
  const startTutorialFight=useCallback((fightNum)=>{
    const tutEnemy=TUTORIAL_ENEMIES[fightNum-1]
    setEnemy(tutEnemy)
    setEnemyHp(tutEnemy.maxHp)
    setScaledMaxHp(tutEnemy.maxHp)
    setFightIndex(fightNum-1)
    setTutorialFight(fightNum)
    setTutorialTipIdx(0)
    setShowTutorialMsg(null)
    // Set tutorial members
    const members=TUTORIAL_MEMBERS.map(id=>ALL_MUSICIANS.find(m=>m.id===id))
    const initStage=[null,...members.map(m=>({...m,maxHp:m.hp,uid:uid()})),...Array(3).fill(null)]
    setStage(initStage)
    // Set tutorial hand
    const handIds=TUTORIAL_HANDS[fightNum]
    const tutHand=handIds.map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return{...c,uid:uid()}})
    setHand(tutHand)
    // Fill deck with basic cards for draws
    const deckCards=['battlecry','amp','moshpit','groupie','distortion','newstrings','heavyriff','encore','roadie','tappedout'].map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return{...c,uid:uid()}})
    setDeck(deckCards)
    setDiscardPile([])
    setStrikesLeft(4)
    setFightMaxStrikes(4)
    setDiscardsLeft(4)
    setFightMaxDiscards(4)
    setEmbers(5)
    setMaxEmbers(5)
    setCorruption(fightNum>=2?10:0) // Fight 2+ starts with some corruption
    setAnimPhase('idle')
    setGameState('playing')
    setDblRoll(null)
    setStrikeMult(1.0)
    setPhaseBanner('play')
    setIsWiggling(false)
    setDamageFlash(false)
    setProjectiles([])
    setStrikingMemberIdx(-1)
    setStrikeAnim(null)
    setBossStrikeAnim(null)
    setFlyingCard(null)
    setCardAbsorb(null)
    setSelected([])
    setCardsPlayedThisStrike([])
    cardsPlayedRef.current=[]
    combosFiredRef.current=[]
    victoryFiredRef.current=false
    setStash(20) // enough to buy stuff if shop appears
    setGenreCounts({RIFF:0,CORRUPT:0,UTILITY:0,EMBER:0})
    setBossDebuff(0)
    setChosenPacts([])
    fullRunLogRef.current=['\u26E7 Tutorial Fight '+fightNum+' begins.']
  },[])

  const handleTutorialVictory=useCallback(()=>{
    const fightNum=tutorialFight
    if(fightNum===3){
      // Tutorial complete
      markTutorialDone()
      setShowTutorialMsg('TUTORIAL COMPLETE')
    } else {
      setShowTutorialMsg(TUTORIAL_POST_FIGHT[fightNum])
    }
  },[tutorialFight])

  const handleTutorialContinue=useCallback(()=>{
    if(showTutorialMsg==='TUTORIAL COMPLETE'){
      // Return to menu, start real game
      setTutorialFight(0)
      setShowTutorialMsg(null)
      setGameState('menu')
      return
    }
    const nextFight=tutorialFight+1
    if(nextFight===3){
      // Fight 3 — go straight in
      setShowTutorialMsg(null)
      startTutorialFight(3)
    } else {
      // Fight 2 — go straight in
      setShowTutorialMsg(null)
      startTutorialFight(nextFight)
    }
  },[tutorialFight,showTutorialMsg])

  const startGame=useCallback(selIds=>{
    const musicians=selIds.map(id=>ALL_MUSICIANS.find(m=>m.id===id))
    const maxStage=chosenPacts.includes('sixth_slot')?6:5
    const initStage=[null,...musicians.map(m=>({...m,maxHp:m.hp})),...Array(4).fill(null)].slice(0,maxStage)
    setStage(initStage)
    const d=buildDeck(runSeed,selectedDeck)
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
    const ampFbDiscount=(ampFeedbackDiscount>0&&card.type==='RIFF')?1:0
    const effectiveEmbers=(nextCardFreeRef.current&&card.id!=='doubledown')||allCardsFreeRef.current?0:Math.max(0,card.embers-foilDiscount-shredderDiscount-synesthesiaDiscount-darkBargainDiscount-ampFbDiscount)
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
      ns[sIdx]=Object.assign({},strongest,{tooStoned:true,bloodOath:false,hp:0})
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
      setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
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
    else if(card.id==='whispercard'){ns=ns.map((m,mi)=>mi===slotIdx?Object.assign({},m,{atk:m.atk+2,permAtkBonus:(m.permAtkBonus||0)+2,buffCount:(m.buffCount||0)+1}):m);msg='\u{1F300} Dark Whisper! +2 ATK permanently.'}
    else if(card.id==='hungercard'){ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,tempAtkBonus:(m.tempAtkBonus||0)+1,buffCount:(m.buffCount||0)+1}):m);drawUpTo(hand.filter(c=>c.uid!==card.uid),deckRef.current,[...discRef.current,card],2);msg='\u{1F525} Hungering Flame! All +1 ATK, drew 2 cards.'}
    else if(card.id==='madnesscard'){const maxHp=enemy?Math.ceil(enemy.maxHp*(activeStake.hpMult||1.3)):100;const dmg=Math.floor(maxHp*0.15);const bc2=getCenter(bossRef);const newHp=Math.max(0,enemyHp-dmg);setEnemyHp(newHp);if(newHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);addFloat(dmg,bc2.x,bc2.y-60,'#cc1144',dmg>=20);playHit();updStat('totalDamage',dmg);msg='\u{1F480} Madness Unleashed! '+dmg+' damage (15% of max HP)!'}
    else if(card.id==='dark_whisper'){
      const nc=Math.min(100,corruption+5);setCorruption(nc);updStat('maxCorruption',nc,true)
      ns=ns.map((m,mi)=>mi===slotIdx&&m?Object.assign({},m,{atk:m.atk+2,tempAtkBonus:(m.tempAtkBonus||0)+2,buffCount:(m.buffCount||0)+1}):m)
      msg='👁 Dark Whisper! +2 ATK. Corruption +5% → '+nc+'%'
    }
    else if(card.id==='blood_price'){
      ns=ns.map((m,mi)=>mi===slotIdx&&m?Object.assign({},m,{atk:m.atk+4,permAtkBonus:(m.permAtkBonus||0)+4,hp:Math.max(1,m.hp-3),buffCount:(m.buffCount||0)+1}):m)
      msg='🩸 Blood Price! +4 ATK permanent. -3 HP.'
    }
    else if(card.id==='void_pact'){
      const nc=Math.min(100,corruption+10);setCorruption(nc);updStat('maxCorruption',nc,true)
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+2,tempAtkBonus:(m.tempAtkBonus||0)+2,buffCount:(m.buffCount||0)+1}):m)
      msg='🌀 Void Pact! All members +2 ATK. Corruption +10% → '+nc+'%'
    }
    else if(card.id==='dialtoeleven'){const nc=Math.min(100,corruption+10);setCorruption(nc);updStat('maxCorruption',nc,true);ns=ns.map(function(m){return m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+(card.upgraded?4:3),tempAtkBonus:(m.tempAtkBonus||0)+(card.upgraded?4:3),buffCount:(m.buffCount||0)+1}):m});msg='📻 Dial to Eleven! Corruption +10% → '+nc+'%. All members +3 ATK!'}
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
    else if(card.id==='feedbackloop'){
      if(!m)return false;const bonus=corruption>=50?4:2
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus})
      addFloat('+'+bonus+' ATK perm',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#aa1111',bonus>=4)
      msg='🎛 Feedback Loop! '+m.name+' +'+bonus+' ATK permanently!'+(corruption>=50?' (≥50% corruption bonus!)':'')
    }
    else if(card.id==='soundwall'){const p5Bonus=activePassives.some(p=>p.id==='p5')?1:0;const buff=1+p5Bonus+(card.upgraded?1:0);ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+buff,permAtkBonus:(m.permAtkBonus||0)+buff,buffCount:(m.buffCount||0)+1}):m);msg='🔈 Sound Wall! All members +'+buff+' ATK permanently!'+(p5Bonus?' (Amp Stack bonus!)':'')}
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
      if(!m)return false
      const buff=Math.max(1,hand.length-1)+(card.upgraded?1:0) // -1 because crowdsurf itself is leaving hand
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+buff,permAtkBonus:(m.permAtkBonus||0)+buff,buffCount:(m.buffCount||0)+1})
      addBuff(m.uid,'+'+buff+' ATK','#9933cc');addFloat('+'+buff+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc')
      msg='🏄 Crowd Surf! '+m.name+' +'+buff+' ATK permanently! ('+hand.length+' cards in hand)'
    }
    else if(card.id==='doubledown'){
      setNextCardFree(true)
      msg='🎰 Double Down! Next card costs 0 Embers.'
      addFloat('FREE!',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='deathriff'){
      ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+2,permAtkBonus:(s.permAtkBonus||0)+2}):s)
      const nc=Math.min(100,corruption+10);setCorruption(nc);updStat('maxCorruption',nc,true)
      msg='💀 Death Riff! ALL members +2 ATK permanently! Corruption +10%'
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
      const bonus=corruption>=50?4:2
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1})
      msg='📶 Amp the Static! '+m.name+' +'+bonus+' ATK this Strike!'+(corruption>=50?' (≥50% corruption bonus!)':'')
      addFloat('+'+bonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#cc4400',bonus>=4)
    }
    else if(card.id==='distortion'){
      const nc=Math.min(100,corruption+15);setCorruption(nc);updStat('maxCorruption',nc,true)
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,tempBuff:true,_origAtk:m._origAtk||m.atk,buffCount:(m.buffCount||0)+1}):m)
      msg='🎸 Distortion! Corruption +15%. All members +1 ATK.'
      addFloat('+1 ATK',getCenter(bossRef).x,getCenter(bossRef).y-70,'#cc4400')
    }
    else if(card.id==='seance'){
      const healAmt=corruption>=50?6:3
      ns=ns.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+healAmt)}):m)
      msg='🔮 Séance! All members +'+healAmt+' HP'+(corruption>=50?' (≥50% corruption: bonus heal!)':'')
      addFloat('+'+healAmt+' HP',getCenter(bossRef).x,getCenter(bossRef).y-70,'#22aa44')
    }
    else if(card.id==='staticcharge'){
      const scBonus=corruption===0?4:2
      setEmbers(p=>Math.min(maxEmbers,p+scBonus));playEmber();spent=0
      msg='⚡ Static Charge! +'+scBonus+' Embers'+(corruption===0?' (pure signal bonus)':'')+'.'
      addFloat('+'+scBonus+' 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
    }
    else if(card.id==='darktuning'){
      if(corruption<40){addLog('🌑 Need ≥40% Corruption for Dark Tuning!');return false}
      const memberCount=corruption>=70?3:2
      const activeSlots=ns.map((m,i)=>m&&!m.tooStoned?i:-1).filter(i=>i>=0)
      for(let i=0;i<Math.min(memberCount,activeSlots.length);i++){
        const ri=Math.floor(Math.random()*activeSlots.length)
        const si=activeSlots.splice(ri,1)[0]
        ns[si]=Object.assign({},ns[si],{atk:ns[si].atk+1,permAtkBonus:(ns[si].permAtkBonus||0)+1})
      }
      msg='🌑 Dark Tuning! '+memberCount+' random members +1 ATK permanently!'+(corruption>=70?' (≥70% = 3 members!)':'')
      addFloat('+1 ATK ×'+memberCount,getCenter(bossRef).x,getCenter(bossRef).y-80,'#6600aa',corruption>=70)
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
      if(!m)return false
      const bonus=Math.min(20,Math.ceil((m.atk+(m.permAtkBonus||0))/2))+(card.upgraded?2:0)
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus,buffCount:(m.buffCount||0)+1})
      addBuff(m.uid,'+'+bonus+' ATK','#9933cc');addFloat('+'+bonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc')
      msg='🥊 Heavy Riff! '+m.name+' +'+bonus+' ATK permanently! (half ATK, max +20)'
    }
    else if(card.id==='herbmoney'){
      if(!m)return false
      if(stash<10){addLog('🌿 Need 10 Stash! (have '+stash+')');return false}
      setStash(p=>p-10)
      const buff=card.upgraded?4:3
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+buff,permAtkBonus:(m.permAtkBonus||0)+buff,buffCount:(m.buffCount||0)+1})
      addBuff(m.uid,'+'+buff+' ATK','#22aa44');addFloat('+'+buff+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#22aa44')
      msg='🌿 Herb Money! Spent 10🌿 — '+m.name+' +'+buff+' ATK permanently!'
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
      const buff=alive>=4?2:1
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+buff,permAtkBonus:(m.permAtkBonus||0)+buff,buffCount:(m.buffCount||0)+1}):m)
      msg='🤘 Mosh Pit! '+alive+' members — all gain +'+buff+' ATK permanently!'+(alive>=4?' (Full pit bonus!)':'')
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
        hqMsg='⛧ HELLQUAKE: RESONANCE! All members +3 ATK forever!';hqFloat='RESONANCE!';hqColor='#ff6600';hqDesc='All gain +3 ATK permanently.'
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
        if(alive.length>0){const victim=alive[Math.floor(Math.random()*alive.length)];const vi=ns.indexOf(victim);ns[vi]=Object.assign({},victim,{hp:0,tooStoned:true,bloodOath:false})}
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
        if(alive2.length>0){const v2=alive2[Math.floor(Math.random()*alive2.length)];const vi2=ns.indexOf(v2);ns[vi2]=Object.assign({},v2,{hp:0,tooStoned:true,bloodOath:false})}
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
    // ── NEW CARDS (30) ──────────────────────────────────────
    else if(card.id==='echopedal'){
      const lastCards=cardsPlayedRef.current;const lastId=lastCards.length>0?lastCards[lastCards.length-1]:null
      if(lastId&&!['echopedal','riffthief'].includes(lastId)){
        const lc=ALL_CARDS.find(c=>c.id===lastId)
        if(lc){setHand(h=>[...h,Object.assign({},lc,{uid:uid()})]);nextCardFreeRef.current=true;setNextCardFree(true);msg='🔁 Echo Pedal! '+lc.name+' added to hand — play it FREE!'}
        else msg='🔁 Echo Pedal — no valid card to echo'
      } else msg='🔁 Echo Pedal — nothing to replay yet'
    }
    else if(card.id==='riffthief'){
      const lastCards=cardsPlayedRef.current;const lastId=lastCards.length>0?lastCards[lastCards.length-1]:null
      if(lastId&&!['echopedal','riffthief'].includes(lastId)){
        const lc=ALL_CARDS.find(c=>c.id===lastId)
        if(lc){setHand(h=>[...h,Object.assign({},lc,{uid:uid()})]);nextCardFreeRef.current=true;setNextCardFree(true);msg='🎭 Riff Thief! Stole '+lc.name+' — play it FREE!'}
        else msg='🎭 Riff Thief — nothing to steal'
      } else msg='🎭 Riff Thief — no card to copy'
    }
    else if(card.id==='feedbackscream'){
      if(!m)return false
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+4,permAtkBonus:(m.permAtkBonus||0)+4,hp:Math.max(1,m.hp-2)})
      addFloat('+4 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#ff4444',true)
      addFloat('-2 HP',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-40,'#ff0000',false)
      msg='📢 Feedback Scream! '+m.name+' +4 ATK permanently! -2 HP.'
    }
    else if(card.id==='skullsplitter'){
      if(!m)return false;const bonus=(m.atk+(m.permAtkBonus||0))>=10?5:3
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus})
      addFloat('+'+bonus+' ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#cc2222',bonus>=5)
      msg='💀 Skull Splitter! '+m.name+' +'+bonus+' ATK permanently!'+(bonus>=5?' (10+ ATK bonus!)':'')
    }
    else if(card.id==='doomchord'){
      if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+4,tempBuff:true,buffCount:(m.buffCount||0)+1})
      addFloat('+4 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#6622aa',false)
      if(corruption>=50){ns=ns.map((s,i)=>{if(s&&!s.tooStoned&&Math.abs(i-slotIdx)===1)return Object.assign({},s,{atk:s.atk+4,tempBuff:true,buffCount:(s.buffCount||0)+1});return s});msg='🎵 Doom Chord! +4 ATK to '+m.name+' AND adjacent! (≥50% corruption)'}
      else msg='🎵 Doom Chord! '+m.name+' +4 ATK!'
    }
    else if(card.id==='bloodharmony'){
      if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+2,tempBuff:true,buffCount:(m.buffCount||0)+1})
      ns=ns.map((s,i)=>{if(s&&!s.tooStoned&&Math.abs(i-slotIdx)===1)return Object.assign({},s,{atk:s.atk+2,tempBuff:true,buffCount:(s.buffCount||0)+1});return s})
      msg='🩸 Blood Harmony! '+m.name+' + adjacent +2 ATK!'
    }
    else if(card.id==='sonicboom'){
      ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+2,tempBuff:true,buffCount:(s.buffCount||0)+1}):s)
      setDeck(d=>{if(d.length>0){const c=d[d.length-1];setHand(h=>[...h,c]);return d.slice(0,-1)}return d})
      msg='💥 Sonic Boom! ALL members +2 ATK! Draw 1!'
    }
    else if(card.id==='tremolopick'){
      if(!m)return false;const bonus=cardsPlayedRef.current.length>=3?4:1
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,tempBuff:true,buffCount:(m.buffCount||0)+1})
      msg='⚡ Tremolo Pick! '+m.name+' +'+bonus+' ATK!'+(bonus>=4?' (3+ cards = bonus!)':'')
    }
    else if(card.id==='harmonicfb'){
      if(!m)return false;const riffCount=cardsPlayedRef.current.filter(id=>{const c=ALL_CARDS.find(x=>x.id===id);return c&&c.type==='RIFF'}).length
      const bonus=Math.max(1,riffCount);ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus})
      msg='🎶 Harmonic Feedback! '+m.name+' +'+bonus+' ATK perm! ('+riffCount+' RIFFs played)'
    }
    else if(card.id==='shredsolo'){
      if(!m)return false;ns[slotIdx]=Object.assign({},m,{encoreReady:true})
      addBuff(m.uid,'SHRED','#ff4400');msg='🎸 Shred Solo! '+m.name+' attacks TWICE this strike!'
    }
    else if(card.id==='overdriveped'){
      setStrikeMult(p=>Math.min(66.6,Math.round(p*1.5*100)/100));strikeMultRef.current=Math.min(66.6,Math.round(strikeMultRef.current*1.5*100)/100)
      msg='🔊 Overdrive Pedal! Strike multiplier ×1.5!'
    }
    else if(card.id==='devilsdice'){
      const roll=Math.floor(Math.random()*6)+1
      if(roll<=2){msg='🎲 Devil\'s Dice: rolled '+roll+'. Nothing happens!'}
      else if(roll<=4){ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+3,tempBuff:true}):s);msg='🎲 Devil\'s Dice: rolled '+roll+'! ALL +3 ATK!'}
      else{ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+5,tempBuff:true}):s);setDeck(d=>{const drawn=d.slice(-2);setHand(h=>[...h,...drawn]);return d.slice(0,-2)});msg='🎲 Devil\'s Dice: rolled '+roll+'! ALL +5 ATK + draw 2! JACKPOT!'}
    }
    else if(card.id==='necroticamp'){
      const bonus=Math.floor(corruption/20);ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+bonus,tempBuff:true}):s)
      msg='☠️ Necrotic Amp! ALL +'+bonus+' ATK! ('+Math.floor(corruption)+'% corruption ÷ 20)'
    }
    else if(card.id==='soulbargain'){
      if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+5,tempBuff:true,hp:Math.max(1,m.hp-3),buffCount:(m.buffCount||0)+1})
      setCorruption(p=>Math.min(100,p+5))
      addFloat('+5 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#8800cc',true)
      addFloat('-3 HP',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-40,'#ff0000',false)
      msg='👿 Soul Bargain! '+m.name+' +5 ATK, -3 HP! Corruption +5%'
    }
    else if(card.id==='venomriff'){
      if(!m)return false
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+3,permAtkBonus:(m.permAtkBonus||0)+3})
      setCorruption(p=>Math.min(100,p+5))
      addFloat('+3 ATK perm',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#44aa44',false)
      msg='🐍 Venom Riff! '+m.name+' +3 ATK permanently! Corruption +5%'
    }
    else if(card.id==='offeringpit'){
      if(!m)return false;const alive=ns.filter(s=>s&&!s.tooStoned&&s.uid!==m.uid)
      if(alive.length===0){msg='🕳️ No other member to receive the offering!';return false}
      const target=alive[Math.floor(Math.random()*alive.length)];const tidx=ns.indexOf(target)
      ns[tidx]=Object.assign({},target,{atk:target.atk+8,tempBuff:true,buffCount:(target.buffCount||0)+1})
      setCorruption(p=>Math.min(100,p+10))
      msg='🕳️ Offering! '+m.name+' skips attack, '+target.name+' +8 ATK! Corruption +10%'
    }
    else if(card.id==='cursedstrings'){
      if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+3,tempBuff:true,buffCount:(m.buffCount||0)+1,cursed:true})
      msg='🪡 Cursed Strings! '+m.name+' +3 ATK! (cannot be healed this fight)'
    }
    else if(card.id==='hexdecay'){
      const dmg=Math.floor(enemyHp*0.15);const newHp=Math.max(0,enemyHp-dmg);setEnemyHp(newHp)
      setCorruption(p=>Math.min(100,p+15));const bc=getCenter(bossRef)
      addFloat(dmg,bc.x,bc.y-60,'#448844',true);playHit();updStat('totalDamage',dmg)
      if(newHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      msg='🦠 Hex of Decay! Boss loses 15% HP ('+dmg+' damage)! Corruption +15%'
    }
    else if(card.id==='infernalpact'){
      setCorruption(66);updStat('maxCorruption',66,true)
      ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+2,permAtkBonus:(s.permAtkBonus||0)+2}):s)
      msg='📜 Infernal Pact! Corruption → 66%! ALL members +2 ATK permanently!'
    }
    else if(card.id==='carrioncall'){
      const stoned=ns.findIndex(s=>s&&s.tooStoned)
      if(stoned===-1){msg='🦅 No stoned members to revive!';return false}
      ns[stoned]=Object.assign({},ns[stoned],{tooStoned:false,hp:1,atk:ns[stoned].atk+5,permAtkBonus:(ns[stoned].permAtkBonus||0)+5})
      setCorruption(p=>Math.min(100,p+20))
      msg='🦅 Carrion Call! '+ns[stoned].name+' rises from the dead at 1 HP +5 ATK! Corruption +20%'
    }
    else if(card.id==='possessionriff'){
      if(!m)return false
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+20,tempBuff:true,buffCount:(m.buffCount||0)+1})
      setCorruption(p=>Math.min(100,p+10))
      addFloat('+20 ATK!',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#aa44cc',true)
      msg='👁️ POSSESSION! '+m.name+' +20 ATK this strike! Corruption +10%'
    }
    else if(card.id==='darkcrescendo'){
      if(corruption>=80){setStrikeMult(p=>Math.min(66.6,Math.round(p*3*100)/100));strikeMultRef.current=Math.min(66.6,Math.round(strikeMultRef.current*3*100)/100);msg='🌑 DARK CRESCENDO! TRIPLE STRIKE MULTIPLIER! ('+corruption+'% corruption)'}
      else msg='🌑 Dark Crescendo... corruption too low ('+Math.floor(corruption)+'%, need 80%)'
    }
    // ═══ CORRUPTION GAMBIT CARDS — insane power, insane corruption cost ═══
    else if(card.id==='hellfirerift'){
      ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true}):s);setCorruption(p=>Math.min(100,p+20))
      msg='🌋 HELLFIRE RIFT! ALL MEMBERS ×2 ATK! +20% CORRUPTION!';addFloat('×2 ALL ATK!',getCenter(bossRef).x,getCenter(bossRef).y-120,'#ff2200',true)
    }
    else if(card.id==='soulsacrifice'){
      ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+5,permAtkBonus:(s.permAtkBonus||0)+5,buffCount:(s.buffCount||0)+1}):s);setCorruption(p=>Math.min(100,p+15))
      msg='⚰️ SOUL SACRIFICE! ALL +5 ATK PERMANENT! +15% CORRUPTION!';addFloat('+5 ALL PERM!',getCenter(bossRef).x,getCenter(bossRef).y-120,'#cc0044',true)
    }
    else if(card.id==='voidpact'){
      setStrikeMult(p=>Math.min(66.6,Math.round(p*2.5*100)/100));strikeMultRef.current=Math.min(66.6,Math.round(strikeMultRef.current*2.5*100)/100);setCorruption(p=>Math.min(100,p+25))
      msg='🕳 VOID PACT! STRIKE MULTIPLIER ×2.5! +25% CORRUPTION!';addFloat('×2.5 MULT!',getCenter(bossRef).x,getCenter(bossRef).y-120,'#8800ff',true)
    }
    else if(card.id==='russianroulette'){
      if(!m)return false;const roll=Math.floor(Math.random()*6)+1
      if(roll===1){ns[slotIdx]=Object.assign({},m,{tooStoned:true,hp:0});msg='🔫 Russian Roulette: '+m.name+' rolled 1... TOO STONED! 💀'}
      else if(roll<=5){ns[slotIdx]=Object.assign({},m,{atk:m.atk+4,tempBuff:true});msg='🔫 Russian Roulette: '+m.name+' rolled '+roll+'! +4 ATK!'}
      else{ns[slotIdx]=Object.assign({},m,{atk:m.atk+8,tempBuff:true,stoneShield:2});msg='🔫 Russian Roulette: '+m.name+' rolled 6! +8 ATK + Shield! 🛡️'}
    }
    else if(card.id==='gearcheck'){
      setDeck(d=>{const drawn=d.slice(-2);setHand(h=>[...h,...drawn]);return d.slice(0,-2)})
      msg='🔧 Gear Check! Draw 2, discard 1 from hand.'
    }
    else if(card.id==='setlistrewrite'){msg='📝 Setlist Rewrite! Top 3 cards reordered.'}
    else if(card.id==='backstagepass'){
      nextCardFreeRef.current=true;setNextCardFree(true)
      setDeck(d=>{if(d.length>0){const c=d[d.length-1];setHand(h=>[...h,c]);return d.slice(0,-1)}return d})
      msg='🎫 Backstage Pass! Next card is FREE! Draw 1!'
    }
    else if(card.id==='venueswap'){
      setHand(h=>{setDiscardPile(dp=>[...dp,...h]);return[]})
      setDeck(d=>{const drawn=d.slice(-6);setHand(drawn);return d.slice(0,-6)})
      msg='🏟️ Venue Swap! Hand shuffled away — drew 6 fresh cards!'
    }
    else if(card.id==='doublebooking'){
      setStrikesLeft(p=>p+1);setFightMaxStrikes(p=>p+1)
      msg='📅 DOUBLE BOOKING! +1 extra Strike this fight! 🔥'
    }
    else if(card.id==='bootlegcopy'){
      setHand(h=>{if(h.length<=1)return h;const best=h.filter(c=>c.id!=='bootlegcopy')[0];if(best)return[...h,Object.assign({},best,{uid:uid()})];return h})
      msg='📀 Bootleg Copy! Copied best card in hand!'
    }
    else if(card.id==='secondwind'){
      const gain=maxEmbers-embers;setEmbers(maxEmbers)
      msg='💨 Second Wind! +'+gain+' embers! (filled to max)'
    }
    else if(card.id==='pyromaniac'){
      setEmbers(p=>Math.min(maxEmbers,p+2));setPyromaniacActive(true)
      msg='🧨 Pyromaniac! +2 embers! Spend ALL before Strike → +3 ATK to all!'
    }
    else if(card.id==='slowburn'){
      setEmbers(p=>Math.min(maxEmbers,p+1));setSlowBurnStrikes(p=>p+2)
      msg='🕯️ Slow Burn! +1 ember now, +1 per strike for next 2 strikes.'
    }
    else if(card.id==='ampfeedback'){
      setEmbers(p=>Math.min(maxEmbers,p+2));setAmpFeedbackDiscount(1)
      msg='🔌 Amp Feedback! +2 embers. Next RIFF costs 1 less.'
    }
    else if(card.id==='drainthecrowd'){
      const alive=ns.filter(s=>s&&!s.tooStoned);if(alive.length>0){const v=alive[Math.floor(Math.random()*alive.length)];const vi=ns.indexOf(v);ns[vi]=Object.assign({},v,{hp:Math.max(1,v.hp-2)})}
      setEmbers(p=>Math.min(maxEmbers,p+2))
      msg='🧛 Drain the Crowd! +2 embers. Random member -2 HP.'
    }
    else if(card.id==='corrsiphon'){
      setEmbers(p=>Math.min(maxEmbers,p+3));setCorruption(p=>Math.min(100,p+8))
      msg='🌀 Corruption Siphon! +3 embers. Corruption +8%.'
    }

    // Single-member buff corruption trigger
    if(ns[slotIdx]&&m&&(ns[slotIdx].buffCount||0)>=3&&(ns[slotIdx].buffCount||0)>(m.buffCount||0)&&(ns[slotIdx].buffCount||0)===3){
      const nc2=Math.min(100,corruption+20);setCorruption(nc2);updStat('maxCorruption',nc2,true)
      addLog('⚠ '+(ns[slotIdx].name)+' has 3+ buffs — Corruption +20%!')
    }

    setStage(ns)
    if(spent>0){setEmbers(function(p){return p-spent});embersSpentThisFightRef.current+=spent}
    if(msg)addLog(msg)
    updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
    if(card.type==='RIFF'&&shredderDiscount>0)setShredderUsed(true)
    if(card.type==='RIFF'&&ampFbDiscount>0)setAmpFeedbackDiscount(0)
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
        setComboFlash({name:chain.name,color:chain.color,emoji:chain.emoji,mult:Math.round(strikeMultRef.current*1.78*100)/100,card1:ALL_CARDS.find(c=>c.id===chain.cards[0])?.name||chain.cards[0],card2:ALL_CARDS.find(c=>c.id===chain.cards[1])?.name||chain.cards[1]})
        playSfx('chain_combo');triggerShake(18,600);setChainFlashActive(true);setTimeout(()=>setChainFlashActive(false),600);setStrikeMult(p=>Math.min(6.66,Math.round((p*1.78)*100)/100));addLog('⛧ RIFF CHAIN: '+chain.emoji+' '+chain.name+'! ('+ALL_CARDS.find(c=>c.id===chain.cards[0])?.name+' + '+ALL_CARDS.find(c=>c.id===chain.cards[1])?.name+') ×1.78 MULTIPLIER!')
        combosFiredRef.current.push(chain.id)
          // #7: Track lifetime chain discovery
          const _allDisc=JSON.parse(localStorage.getItem('vst_chains_discovered')||'[]')
          if(!_allDisc.includes(chain.id)){_allDisc.push(chain.id);localStorage.setItem('vst_chains_discovered',JSON.stringify(_allDisc))
            addFloat('⛧ NEW CHAIN!',getCenter(bossRef).x,getCenter(bossRef).y-200,'#ffdd00',true)}
        addFloat('⛧ '+chain.name+' ⛧',getCenter(bossRef).x,getCenter(bossRef).y-140,chain.color,true)
        // Apply combo bonus damage = total stage ATK
        const comboBonus=ns.filter(m=>m&&!m.tooStoned).reduce((s,m)=>s+m.atk,0)
        setEnemyHp(p=>{const nh=Math.max(0,p-comboBonus);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh})
        updStat('totalDamage',comboBonus)
        setTimeout(()=>setComboFlash(null),3000)
        break
      }
    }
    // cardHeal enemy passive
    if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+2))
    else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+5))
    else if(enemy.passiveId==='cardHeal3b')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal8')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+8))
    return true
  },[embers,stage,corruption,stageDiveUsed,deck,discardPile,hand,bossRef,stageRefs,selected,fightTripBuff,enemy,enemyHp,maxEmbers,activePassives,activeArtifacts,chosenPacts,fightIndex,shredderUsed,collectedLoot])

  const handleDropOnStage=useCallback((slotIdx)=>{
    if(!dragCardUid||animPhase!=='idle')return
    setQuickPlayCardUid(null)
    const card=hand.find(c=>c.uid===dragCardUid)
    if(!card)return
    // ── UNDO SNAPSHOT — save state before card play ──
    setUndoSnapshot({hand:[...hand],deck:[...deckRef.current],disc:[...discRef.current],stage:stage.map(m=>m?Object.assign({},m):null),embers,corruption,strikeMult:strikeMultRef.current,selected:[...selected],shredderUsed,nextCardFree:nextCardFreeRef.current})

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
      setCorruption(p=>Math.max(0,p-15))
      addLog('🎼 Smoke Break! '+victim.name+' discarded. +3 Embers. -15% Corruption. Drew 1 card.'+(preSelected.length===0?' (tip: select a card first)':''))
      addFloat('+3 🔥',getCenter(bossRef).x,getCenter(bossRef).y-70,'#e8a820')
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id,'_smokebreak_discard']
      drawUpTo(remaining,deckRef.current,[...discRef.current,card,victim],1) // count victim too for refill
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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
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
      if(effectiveEmbers>0){setEmbers(p=>p-effectiveEmbers);embersSpentThisFightRef.current+=effectiveEmbers}
      addLog('📋 Setlist! Drew 2 cards — now pick 1 to discard.')
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
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
      if(effectiveEmbers>0){setEmbers(p=>p-effectiveEmbers);embersSpentThisFightRef.current+=effectiveEmbers}
      addLog('🔥 Burned '+discardCount+' card'+(discardCount!==1?'s':'')+', drew '+drawCount+'.'+(discardCount===0?' (Tip: select cards before playing)':''))
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
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
      if(effectiveEmbers>0){setEmbers(p=>p-effectiveEmbers);embersSpentThisFightRef.current+=effectiveEmbers}
      addLog('🎙 Remastered! Deleted '+toDelete.name+', drew 3.')
      addFloat('🎙 -1 +3 CARDS',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44',true)
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      // cardHeal enemy passive
      if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+2))
      else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
      else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+5))
    else if(enemy.passiveId==='cardHeal3b')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal8')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+8))
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
      if(effectiveEmbers>0){setEmbers(p=>p-effectiveEmbers);embersSpentThisFightRef.current+=effectiveEmbers}
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1);setStrikeMult(p=>Math.min(66.6,Math.round((p*1.08)*100)/100))
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+2))
      else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
      else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+5))
    else if(enemy.passiveId==='cardHeal3b')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal8')setEnemyHp(p=>p<=0?p:Math.min(enemy.maxHp,p+8))
      setDragCardUid(null);setDragHandIdx(null);setDragOverHandIdx(null)
      return
    }

    const ok=applyCard(card,slotIdx)
    if(ok){
      // FLYING CARD ANIMATION — card shrinks into target member
      const targetCenter=getCenter(stageRefs.current[slotIdx])
      const handArea={x:960,y:900} // approximate center of hand area
      setFlyingCard({emoji:card.emoji,name:card.name,type:card.type,fromX:handArea.x,fromY:handArea.y,toX:targetCenter.x,toY:targetCenter.y,key:Date.now()})
      // Color flash on member happens after card arrives
      const absorbColor=card.type==='RIFF'?'rgba(150,50,200,0.6)':card.type==='CORRUPT'?'rgba(200,0,40,0.6)':card.type==='UTILITY'?'rgba(30,170,60,0.6)':'rgba(200,120,20,0.6)'
      setTimeout(()=>{
        setCardAbsorb({slotIdx,color:absorbColor,key:Date.now()})
        setFlyingCard(null)
      },400)
      setTimeout(()=>setCardAbsorb(null),900)
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
    const res=drawUpTo(rem,deckRef.current,[...discRef.current,...toDisc],HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0))
    setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
    playSfx('discard');setDiscardsLeft(p=>p-1);setSelected([]);setUndoSnapshot(null)
    addLog('🗑 '+toDisc.length+' discarded & replaced.')
  },[selected,discardsLeft,animPhase,hand,deck,discardPile,drawUpTo])

  // ── UNDO LAST CARD PLAY — one-step restore ──
  const handleUndo=useCallback(()=>{
    if(!undoSnapshot||animPhase!=='idle')return
    setHand(undoSnapshot.hand);setDeck(undoSnapshot.deck);setDiscardPile(undoSnapshot.disc)
    setStage(undoSnapshot.stage);setEmbers(undoSnapshot.embers);setCorruption(undoSnapshot.corruption)
    setStrikeMult(undoSnapshot.strikeMult);strikeMultRef.current=undoSnapshot.strikeMult
    setSelected(undoSnapshot.selected);setShredderUsed(undoSnapshot.shredderUsed)
    if(undoSnapshot.nextCardFree){setNextCardFree(true);nextCardFreeRef.current=true}
    setUndoSnapshot(null)
    playSfx('discard');addLog('↩ Undo — last card play reversed.')
  },[undoSnapshot,animPhase])

  const victoryFiredRef=useRef(false)
  const triggerVictoryRef=useRef(null)
  const triggerVictory=useCallback(function(){
    if(victoryFiredRef.current)return // prevent double-fire
    victoryFiredRef.current=true
    // ═══ TUTORIAL INTERCEPT ═══
    if(tutorialFight>0){
      playSfx('victory')
      setTimeout(()=>handleTutorialVictory(),1500)
      return // skip all normal victory processing
    }
    // CLUTCH DETECTION
    const aliveCount=stage.filter(m=>m&&!m.tooStoned).length
    if(aliveCount===1){setClutchFlash({text:'SOLO VICTORY!',color:'#ffd700'});playSfx('big_hit');triggerShake(8,300);setTimeout(()=>setClutchFlash(null),2500);setShowConfetti(true);setTimeout(()=>setShowConfetti(false),5000)}
    else if(strikesLeft<=0){setClutchFlash({text:'BY THE SKIN OF YOUR TEETH!',color:'#ff4400'});playSfx('big_hit');triggerShake(6,250);setTimeout(()=>setClutchFlash(null),2500)}
    else{setClutchFlash({text:'⛧ VICTORY ⛧',color:'#ffd700'});triggerShake(6,200);setTimeout(()=>setClutchFlash(null),2000);setShowConfetti(true);setTimeout(()=>setShowConfetti(false),5000)}
    // Golden burst particles at boss position
    const bpos=getCenter(bossRef);spawnParticles(bpos.x,bpos.y,20,'#ffd700',120);spawnParticles(bpos.x,bpos.y,12,'#ff8800',80)
    setStage(function(prev){
      return prev.map(function(m){
        if(m&&!m.tooStoned&&m.keyword==='FRENZIED'){
          addFloat('FRENZIED!',getCenter(stageRefs.current[prev.indexOf(m)]).x,getCenter(stageRefs.current[prev.indexOf(m)]).y-80,'#ff6600',false)
          return Object.assign({},m,{atk:m.atk+1})
        }
        return m
      })
    })
    // ATONEMENT PACT: -15% corruption on boss kill
    const isBossKill=(fightIndex+1)%3===0
    if(isBossKill&&chosenPacts.includes('atonement')){
      setCorruption(p=>{const nc=Math.max(0,p-15);addLog('🕊 Atonement! Boss defeated. Corruption -15% → '+nc+'%');return nc})
    }
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
        const perMember=Math.floor(stolenAtkPool/(alive.length||1)),remainder=stolenAtkPool%alive.length;let ri=0
        return p.map(m=>{if(!m||m.tooStoned)return m;const bonus=perMember+(ri<remainder?1:0);ri++;return Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus})})})
      addLog('🔓 '+stolenAtkPool+' stolen ATK returned to your band!')
      setStolenAtkPool(0)
    }
    if(perfectBonus>0)addFloat('PERFECT! +'+perfectBonus,getCenter(bossRef).x,getCenter(bossRef).y-100,'#e8a820',true)
    playSfx('victory');const _tr=recordTrophyKill(enemy.id,activeStake.id,stats.highestStrike,activeStake.maxStrikes-strikesLeft);if(_tr.kills===1)setNewTrophies(p=>[...p,{id:enemy.id,name:enemy.name,emoji:enemy.emoji}]);addLog('⛧ Victory! +'+stashEarned+' Stash'+(perfectBonus>0?' (Perfect Strike bonus!)':' earned.'))
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
    if(fightIndex===26){tryAchieve('beat_lucifer');beatStake(activeStake.id);tryAchieve('beat_'+selectedDeck)
      const curHeat=parseInt(localStorage.getItem('vst_heat')||'1');if(curHeat<10){localStorage.setItem('vst_heat',(curHeat+1).toString());addLog('🔥 HEAT LEVEL UP! Heat '+(curHeat+1)+' unlocked!')}}
    const bq=BOSS_QUOTES[enemy&&enemy.id];if(bq){setTimeout(()=>addLog('💀 "'+bq+'"'),600);setBossQuoteTypewriter(bq);setTimeout(()=>setBossQuoteTypewriter(null),3500)}
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
      setStreakWins(p=>p+1);setStreakLosses(0);recordLegacyRun(stage,stats,true,Math.floor(fightIndex/3)+1)
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
      setTimeout(()=>{setVictoryCinematic(null);setCreditsRoll(true)},10000) // credits roll
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
        setCircleClearedData({circle:cn,circleName:circleNames[cn]||cn,bossName:enemy.name,bossEmoji:enemy.emoji,bossId:enemy.id,isBoss:isBossKill})
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
          setTimeout(()=>{
            setCircleClearedData(null)
            // Decide next screen now so the summary can dispatch to it on continue
            const availEvents=HELL_EVENTS.filter(e=>!eventsSeenThisRun.includes(e.id))
            let nextScreen={type:'shop'}
            if(availEvents.length>0&&Math.random()<0.30){
              const evt=availEvents[Math.floor(Math.random()*availEvents.length)]
              setEventsSeenThisRun(p=>[...p,evt.id])
              nextScreen={type:'event',evt}
            }
            // Build victory summary payload
            const dur=Date.now()-(fightStartTimeRef.current||Date.now())
            const startHp=Math.ceil((enemy?enemy.maxHp:0)*((activeStake&&activeStake.hpMult)||1))
            const damageShown=Math.max(damageThisFightRef.current,startHp)
            // MVP = band member with highest effective ATK this fight (best proxy we have)
            const aliveStage=stage.filter(m=>m&&!m.tooStoned)
            const mvp=aliveStage.length?aliveStage.reduce((a,b)=>(b.atk+(b.permAtkBonus||0))>(a.atk+(a.permAtkBonus||0))?b:a):null
            setVictorySummary({
              enemy,
              damageDealt:damageShown,
              strikesUsed:((activeStake&&activeStake.maxStrikes)||MAX_STRIKES)-strikesLeft,
              strikesMax:(activeStake&&activeStake.maxStrikes)||MAX_STRIKES,
              cardsPlayed:cardsPlayedThisFightRef.current,
              highestStrike:highestStrikeThisFightRef.current,
              embersSpent:embersSpentThisFightRef.current,
              corruptionGained:Math.max(0,corruption-corruptionAtFightStartRef.current),
              timeMs:dur,
              riffChains:(combosFiredRef.current||[]).length,
              mvp,
              next:nextScreen
            })
          },1800)
        }
      }
    },1000)
  },[strikesLeft,corruption,fightIndex,stolenAtkPool,activeStake,stage,hand,enemy,enemyHp,embers,maxEmbers,activeArtifacts,activePassives,chosenPacts,animPhase,discardsLeft,deck,discardPile,fightTripBuff,luciferPhase,welcomeToHell,eventsSeenThisRun])
  triggerVictoryRef.current=triggerVictory

  // ── VICTORY SUMMARY — dismiss + transition ───────────────────
  const continueVictorySummary=useCallback(()=>{
    setVictorySummary(cur=>{
      if(!cur)return cur
      const next=cur.next||{type:'shop'}
      if(next.type==='event'&&next.evt){setPendingEvent(next.evt);setGameState('event')}
      else setGameState('shop')
      return null
    })
  },[])
  useEffect(()=>{
    if(!victorySummary)return
    function onKey(e){
      if(e.key===' '||e.key==='Enter'||e.key==='Spacebar'){e.preventDefault();continueVictorySummary()}
    }
    window.addEventListener('keydown',onKey)
    const auto=setTimeout(continueVictorySummary,8000)
    return()=>{window.removeEventListener('keydown',onKey);clearTimeout(auto)}
  },[victorySummary,continueVictorySummary])



















  // ═══ FIRST-ENCOUNTER TIPS ═══
  useEffect(()=>{
    if(tutorialFight>0)return // no tips during tutorial
    if(firstTip)return // already showing one
    if(gameState==='pact'&&!hasSeenTip('pact')){setFirstTip({id:'pact',text:FIRST_TIPS.pact});markTipSeen('pact')}
    else if(gameState==='shop'&&!hasSeenTip('shop')){setFirstTip({id:'shop',text:FIRST_TIPS.shop});markTipSeen('shop')}
    else if(gameState==='event'&&!hasSeenTip('event')){setFirstTip({id:'event',text:FIRST_TIPS.event});markTipSeen('event')}
    else if(gameState==='descent'&&!hasSeenTip('descent')){setFirstTip({id:'descent',text:FIRST_TIPS.descent});markTipSeen('descent')}
  },[gameState,tutorialFight,firstTip])


  // SAFETY NET: catch ANY case where boss HP hits 0 without victory triggering
  useEffect(()=>{
    if(enemyHp<=0&&gameState==='playing'&&!victoryFiredRef.current&&enemy&&enemy.maxHp>0){
      setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},300)
    }
  },[enemyHp,gameState])


  // ── SQUIGGLE CSS INJECTION ──
  useEffect(()=>{
    const el=document.createElement('style')
    el.textContent=SQUIGGLE_CSS
    document.head.appendChild(el)
    return()=>document.head.removeChild(el)
  },[])

  // ── STASH CHANGE FLOATS — every +X 🌿 / -X 🌿 gets a juicy floating number ──
  const prevStashRef=useRef(stash)
  useEffect(()=>{
    const prev=prevStashRef.current
    const delta=stash-prev
    if(delta!==0&&gameState==='playing'){
      const stashEl=document.querySelector('[data-stash-label]')
      const x=stashEl?stashEl.getBoundingClientRect().left+50:380
      const y=stashEl?stashEl.getBoundingClientRect().top:1000
      const sign=delta>0?'+':''
      addFloat(sign+delta+' 🌿',x,y,delta>0?'#c89838':'#c41e3a',delta>0?false:true)
    }
    prevStashRef.current=stash
  },[stash,gameState])

  // ── EMBER CHANGE FLOATS — skip on strike resets (whole-hand refresh) ──
  const prevEmbersRef=useRef(embers)
  useEffect(()=>{
    const prev=prevEmbersRef.current
    const delta=embers-prev
    // Skip big +maxEmbers refreshes (e.g. new turn), only show smaller discrete changes
    if(delta!==0&&Math.abs(delta)<=maxEmbers&&gameState==='playing'&&strikesLeft<fightMaxStrikes){
      const ember=document.querySelector('[data-ember-display]')
      const x=ember?ember.getBoundingClientRect().left+50:320
      const y=ember?ember.getBoundingClientRect().top:950
      const sign=delta>0?'+':''
      addFloat(sign+delta+' 🔥',x,y,delta>0?'#ff8800':'#c41e3a',false)
    }
    prevEmbersRef.current=embers
  },[embers,gameState,strikesLeft,fightMaxStrikes,maxEmbers])

  // ── 3.0× BEAST TIER ENTRY — first cross above 3.0 each strike triggers shake + red overlay
  const [beastTierFlash,setBeastTierFlash]=useState(false)
  const prevMultRef=useRef(1.0)
  useEffect(()=>{
    if(gameState!=='playing'){prevMultRef.current=strikeMult;return}
    // Crossed 3.0 going up
    if(prevMultRef.current<3.0&&strikeMult>=3.0&&strikeMult<6.66){
      setBeastTierFlash(true)
      playSfx('big_hit');triggerShake(20,800)
      addLog('⛧ BEAST UNLEASHED! ×'+strikeMult.toFixed(2)+' multiplier!');updStat('bestMultiplier',strikeMult,true)
      setTimeout(()=>setBeastTierFlash(false),700)
    }
    prevMultRef.current=strikeMult
  },[strikeMult,gameState])

  // ── 6.66 MULTIPLIER FLASH ──
  const [beastFlash,setBeastFlash]=useState(false)
  useEffect(()=>{
    if(strikeMult>=6.66&&!beastFlash&&gameState==='playing'){
      setBeastFlash(true)
      playSfx('big_hit');triggerShake(16,600)
      addLog('⛧ MARK OF THE BEAST! ×6.66 MULTIPLIER! ⛧')
      setTimeout(()=>setBeastFlash(false),2500)
    }
    if(strikeMult<6.66)setBeastFlash(false)
  },[strikeMult])

  // ── CORRUPTION THRESHOLD FLASH NOTIFICATIONS ──
  useEffect(()=>{
    if(gameState!=='playing')return
    const thresholds=[
      {at:25,name:'THE WHISPERS',desc:'Weakest member takes 1 damage each fight',color:'#cc6677'},
      {at:50,name:'THE HUNGER',desc:'Shop prices increased by 25%',color:'#dd5566'},
      {at:75,name:'THE MADNESS',desc:'15% chance to lose a card each Strike',color:'#ee4455'},
      {at:100,name:'THE POSSESSION',desc:'Boss damage +3. CORRUPT members +3 ATK!',color:'#ff2244'},
    ]
    for(const t of thresholds){
      if(corruption>=t.at&&lastCorruptThreshold.current<t.at){
        setCorruptionFlash(t)
        playSfx('big_hit')
        setTimeout(()=>setCorruptionFlash(null),3000)
        addLog('🔮 '+t.name+' — '+t.desc)
      }
    }
    lastCorruptThreshold.current=Math.max(lastCorruptThreshold.current,...thresholds.filter(t=>corruption>=t.at).map(t=>t.at))
  },[corruption,gameState])

  // ── CORRUPTION 100% POSSESSION — one-time +3 ATK for CORRUPT members ──

  // ── HOLD SPACEBAR — fast-forward while held during combat ──────
  const spaceHeldRef=useRef(false)
  useEffect(()=>{
    const down=e=>{if(e.code==='Space'&&gameStateRef.current==='playing'&&!spaceHeldRef.current&&!(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))){e.preventDefault();spaceHeldRef.current=true;setSpeedMode(true)}}
    const up=e=>{if(e.code==='Space'&&spaceHeldRef.current){spaceHeldRef.current=false;setSpeedMode(localStorage.getItem('vst_speed')==='fast')}}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}
  },[])

  useEffect(()=>{
    if(corruption>=100&&!possessionFired&&gameState==='playing'){
      setPossessionFired(true)
      setStage(p=>p.map(m=>{
        if(!m||m.tooStoned||m.keyword!=='CORRUPT')return m
        addLog('☠ POSSESSION! '+m.name+' embraces the darkness! +3 ATK!')
        return Object.assign({},m,{atk:m.atk+3,permAtkBonus:(m.permAtkBonus||0)+3})
      }))
    }
  },[corruption,possessionFired,gameState])

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
        setTimeout(()=>{setVictoryCinematic(null);setCreditsRoll(true)},10000)
      }
      if(e.shiftKey&&(e.key==='D'||e.key==='d')){
        setDeathCause('stoned')
        setStats({fightsSurvived:6,strikesThrown:24,totalDamage:420,highestStrike:69,tooStonedCount:2,maxCorruption:66,stashEarned:42,cardsPlayed:99})
        setGameState('end')
      }
      if(e.shiftKey&&(e.key==='H'||e.key==='h')){setCreditsRoll(true)}
      // Ctrl+Z = Undo last card play
      if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();handleUndoRef.current&&handleUndoRef.current();return}
      if(e.key==='Escape'){setShowPauseOptions(p=>!p)}

      // ── PLAYER KEYBOARD SHORTCUTS — only during combat, no modifiers, not while typing
      if(gameStateRef.current!=='playing')return
      if(e.shiftKey||e.ctrlKey||e.metaKey||e.altKey)return
      if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return
      const k=e.key.toLowerCase()
      // S = STRIKE
      if(k==='s'&&canStrikeRef.current){e.preventDefault();handleStrikeRef.current&&handleStrikeRef.current()}
      // D = DISCARD (requires selection)
      else if(k==='d'&&canDiscardRef.current&&selectedRef.current.length>0){e.preventDefault();handleDiscardRef.current&&handleDiscardRef.current()}
      // 1-6 = toggle selection on card by index (or quick-play if it's a no-target card)
      else if(/^[1-6]$/.test(e.key)){
        const idx=parseInt(e.key,10)-1
        const h=handRef.current
        if(idx<h.length){
          const card=h[idx]
          if(!card)return
          // Skip used Stage Dive
          if(card.id==='stagedive'&&stageDiveUsedRef.current)return
          e.preventDefault()
          playSfxRef.current&&playSfxRef.current('select',0.5)
          setSelected(p=>p.includes(card.uid)?p.filter(x=>x!==card.uid):[...p,card.uid])
          setQuickPlayCardUid(p=>p===card.uid?null:card.uid)
        }
      }
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
          effectName='EGO DEATH';effectDesc='All +2 ATK this fight!';effectColor='#ffdd44'
          setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+2}):m))
          addLog('🍄 EGO DEATH! All members +3 ATK!')
        } else if(d4===1){
          effectName='TIME DILATION';effectDesc='+1 bonus Strike this fight!';effectColor='#ff8800'
          setStrikesLeft(p=>p+1);setFightMaxStrikes(p=>p+1)
          addLog('🍄 TIME DILATION! +1 Strike this fight!')
        } else if(d4===2){
          effectName='SYNESTHESIA';effectDesc='All cards cost 1 less ember this fight!';effectColor='#cc44ff'
          // Handled via activeTripEffect check in card cost calculation
          addLog('🍄 SYNESTHESIA! All cards cost 1 less ember!')
        } else {
          effectName='COSMIC UNITY';effectDesc='All healed to full HP + Stonewall!';effectColor='#44ddaa'
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
          effectName='ASTRAL PROJECTION';effectDesc='All immune to boss damage this fight!';effectColor='#44ddff'
          addLog('🧪 ASTRAL PROJECTION! Band is untouchable!')
        }
      }
    }

    playSfx(type==='shrooms'?'shrooms':'acid');setActiveTripEffect({type,name:effectName,desc:effectDesc,color:effectColor})
    setFightTripBuff(effectName) // persists for entire fight — combat reads this
    setTimeout(()=>setActiveTripEffect(null),4000)
  },[tripUsedThisFight,strikesLeft])

  const handleStrike=useCallback(()=>{
    setUndoSnapshot(null) // can't undo after striking
    // CORRUPTION THRESHOLD: 75% — The Madness (15% chance discard random card)
    if(corruption>=75&&Math.random()<0.15&&handRef.current.length>1){
      const idx=Math.floor(Math.random()*handRef.current.length)
      const lost=handRef.current[idx]
      const newHand=[...handRef.current];newHand.splice(idx,1)
      setHand(newHand);handRef.current=newHand
      setDiscardPile(p=>[...p,lost]);discRef.current=[...discRef.current,lost]
      addLog('🌀 MADNESS! Corruption forces you to drop '+lost.name+'!')
    };const currentMult=strikeMultRef.current;setStrikeMult(1.0);setMemberBuffs({});
    if(animPhase!=='idle'||strikesLeft<=0||enemyHp<=0)return
    const actives=stage.filter(m=>m&&!m.tooStoned)
    if(actives.length===0){addLog('⚠ No active members!');return}

    if(pendingEmbers>0){setEmbers(p=>Math.min(maxEmbers,p+pendingEmbers));addLog('🪙 +'+pendingEmbers+' Embers from Tapped Out!');playEmber();setPendingEmbers(0)}
    if(slowBurnStrikes>0){setEmbers(p=>Math.min(maxEmbers,p+1));addLog('🕯️ Slow Burn: +1 ember');setSlowBurnStrikes(p=>p-1)}
    if(pyromaniacActive&&embers===0){setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3,tempBuff:true}):m));addLog('🧨 PYROMANIAC TRIGGERED! ALL +3 ATK! (spent all embers)');setPyromaniacActive(false)}
    if(venomDotStacks>0){const vd=venomDotStacks;setEnemyHp(p=>{const nh=Math.max(0,p-vd);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh});addLog('🐍 Venom DOT: boss takes '+vd+' damage')}
    if(pendingDraw>0){
      const _pd=pendingDraw
      const pdRes=drawUpTo(handRef.current,deckRef.current,discRef.current,handRef.current.length+_pd)
      setHand(pdRes.h);setDeck(pdRes.d);setDiscardPile(pdRes.disc)
      addLog('🎛 Soundboard draw! +'+_pd+' card'+(_pd>1?'s':'')+'.')
      setPendingDraw(0)
    }

    // DEBUFF keyword: Vocalists reduce boss damage each Strike
    const debuffCount=stage.filter(m=>m&&!m.tooStoned&&m.keyword==='DEBUFF').length
    if(debuffCount>0){setBossDebuff(p=>p+debuffCount*2);addLog('🎤 Vocalist debuffs the boss! (-'+(debuffCount*2)+' damage)')}
    cardsToDrawRef.current=cardsPlayedRef.current.length
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
    const _breakdownLines=[]
    let dmg=actives.filter(m=>m.role!=='Drummer'&&(!paranoiaVictim||m.uid!==paranoiaVictim.uid)).reduce((s,m)=>{
      const effectiveAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/12):m.atk
      const cleanLivingBonus=(chosenPacts.includes('clean_living')&&corruption<15)?3:0
      return s+effectiveAtk+cleanLivingBonus
    },0)+p10Bonus
    let _bkRunning=dmg
    // DOUBLE TIME d6 multiplier
    let dblMode='', dblMult=1
    if(hasDbl){
      if(dblRoll<=2){dblMult=1.0;dblMode='STANDARD'}
      else if(dblRoll<=4){dblMult=1.5;dblMode='OFF BEAT'}
      else{dblMult=2;dblMode='DOUBLE TIME'}
      dmg=Math.round(dmg*dblMult);_bkRunning=dmg
      if(dblMult!==1)_breakdownLines.push({type:'multiply',label:dblMode+' ×'+dblMult,label2:'= '+dmg.toLocaleString(),runningAfter:dmg,color:'#ff8800'})
    }
    const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer').reduce((s,m)=>{
      const ea=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/12):m.atk
      return s+ea
    },0)
    dmg+=encDmg
    if(encDmg>0){_bkRunning=dmg;_breakdownLines.push({type:'add',label:'Encore',emoji:'🔁',value:encDmg,runningAfter:dmg,color:'#44cc44'})}
    dmg=Math.round(dmg*bandBonus)
    if(bandBonus>1){_bkRunning=dmg;_breakdownLines.push({type:'multiply',label:'Band Synergy ×'+bandBonus.toFixed(2),label2:'= '+dmg.toLocaleString(),runningAfter:dmg,color:'#ffd700'})}
    // ── MENTOR LINK strike multiplier ──────────────────────────────
    let _mlb=0
    for(let _i=0;_i<stage.length-1;_i++){
      const _mn=stage[_i],_bs=stage[_i+1]
      if(!_mn||!_bs||_mn.tooStoned||_bs.tooStoned)continue
      if(_mn.isMentor&&_bs.mentorLinkedToUid===_mn.uid&&_bs.mentorAlive){
        const _ma=_mn.keyword==='CORRUPT'?_mn.atk+Math.floor(corruption/12):_mn.atk
        const _ba=_bs.keyword==='CORRUPT'?_bs.atk+Math.floor(corruption/12):_bs.atk
        const _effectiveMult=_bs.mentorMult+(activeStake.mentorBonus||0)
        const _b=Math.round((_ma+_ba)*(_effectiveMult-1))
        _mlb+=_b
        addLog('⛓ Mentor Link! '+_mn.name+'+'+_bs.name+' ×'+_effectiveMult.toFixed(2)+' (+'+_b+'!)');tryAchieve('mentor_link')
        addFloat('⛓ ×'+_effectiveMult.toFixed(2),getCenter(stageRefs.current[_i]).x,getCenter(stageRefs.current[_i]).y-80,'#ffd700',true)
      }
    }
    if(_mlb>0){dmg+=_mlb;_bkRunning=dmg;_breakdownLines.push({type:'add',label:'Mentor Link',emoji:'⛓',value:_mlb,runningAfter:dmg,color:'#ffd700'})}
    // CA4: Wailing Guitar — first Strike deals double damage
    if(activeArtifacts.some(a=>a.id==='ca4')&&strikesLeft===activeStake.maxStrikes){dmg*=2;_bkRunning=dmg;_breakdownLines.push({type:'multiply',label:'Wailing Guitar ×2',label2:'= '+dmg.toLocaleString(),runningAfter:dmg,color:'#ff4488'});addLog('🎸 Wailing Guitar! First Strike deals DOUBLE damage!')}
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
    const startHp=enemyHp // save for final calc
    // Compute per-member damage for cascade display
    const memberDmgs=[]
    actives.forEach(function(m){
      if(m.role==='Drummer')return
      if(paranoiaVictim&&m.uid===paranoiaVictim.uid)return
      let mAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/12):m.atk
      if(chosenPacts.includes('clean_living')&&corruption<15)mAtk+=3
      if(m.encoreReady)mAtk*=2
      memberDmgs.push({m,atk:mAtk})
    })
    // Build per-member breakdown lines (after memberDmgs is populated)
    memberDmgs.forEach(d=>{_breakdownLines.push({type:'member',label:d.m.name,emoji:d.m.emoji,value:d.atk,color:'#c8a060'})})
    _breakdownLines.push({type:'subtotal',label:'BASE ATK',value:dmg,color:'#e8a820'})
    _bkRunning=dmg
    const speedFast=speedMode
    const memberDelay=speedFast?900:2000
    delay=100 // small initial delay so React commits attacking phase first
    actives.forEach(function(m,attackIdx){
      if(m.role==='Drummer')return
      const md=memberDmgs.find(d=>d.m.uid===m.uid)
      if(!md||md.atk<=0)return // skip 0 damage members
      const si=stage.indexOf(m)
      const from=getCenter(stageRefs.current[si])
      const curDelay=delay
      // Calculate offset from member to boss
      // Compensate for ScaleRoot scaling (query by ID so we don't match nested cards with scale transforms)
      const scaleEl2=document.getElementById('vst-scale-root')
      const gs2=scaleEl2?parseFloat((scaleEl2.style.transform.match(/scale\(([\d.]+)\)/)||[])[1])||1:1
      const dx=(bc.x-from.x)/gs2
      const dy=(bc.y-from.y)/gs2
      // Phase 1: DIP (0ms) — card dips down
      setTimeout(function(){
        setStrikingMemberIdx(si)
        setStrikeAnim({slotIdx:si,phase:'dip',dx,dy})
      },curDelay)
      // Phase 2: WIGGLE (300ms)
      setTimeout(function(){
        setStrikeAnim({slotIdx:si,phase:'wiggle',dx,dy})
      },curDelay+(speedFast?150:300))
      // Phase 3: LAUNCH (700ms) — card flies toward boss
      setTimeout(function(){
        setStrikeAnim({slotIdx:si,phase:'launch',dx,dy})
      },curDelay+(speedFast?350:700))
      // Phase 4: IMPACT (1200ms) — card hits boss, SFX + shake + damage
      setTimeout(function(){
        setStrikeAnim({slotIdx:si,phase:'impact',dx,dy})
        try{(ATK_SND[m.role]||ATK_SND['Lead Guitarist'])()}catch(e){}
        playHit()
        triggerShake(8,250)
        if(md){addFloat(md.atk,bc.x,bc.y-60,'#cc8800',md.atk>=15);setEnemyHp(p=>Math.max(0,p-md.atk))}
      },curDelay+(speedFast?550:1200))
      // Phase 5: RETURN (1500ms) — card floats back
      setTimeout(function(){
        setStrikeAnim({slotIdx:si,phase:'return',dx,dy})
      },curDelay+(speedFast?680:1500))
      // Phase 6: DONE (1900ms) — reset for next member
      setTimeout(function(){
        setStrikingMemberIdx(-1)
        setStrikeAnim(null)
      },curDelay+(speedFast?850:1900))
      delay+=memberDelay
    })

    setTimeout(function(){
      setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setProjectiles([])
      const tripMult=fightTripBuff==='DIMENSIONAL RIFT'||fightTripBuff==='FRACTAL VISION'?2:1
      const corruptionMult=1+Math.floor(corruption/20)*0.2 // 20%=×1.2, 40%=×1.4, 60%=×1.6, 80%=×1.8, 100%=×2.0
      // ARTIFACT MULTIPLIER TRIGGERS — Balatro-style Jokers
      let artifactMult=1.0
      const cardsPlayedCount=cardsPlayedRef.current.length||0
      const chainsFired=(combosFiredRef.current||[]).length
      const stonedCount=stage.filter(m=>m&&m.tooStoned).length
      const handDupes=hand.filter((c,i)=>hand.findIndex(h=>h.id===c.id)!==i).length
      for(const art of activeArtifacts){
        if(!art.multTrigger)continue
        let fires=0
        if(art.multTrigger==='cards3'&&cardsPlayedCount>=3)fires=1
        if(art.multTrigger==='cards5'&&cardsPlayedCount>=5)fires=1
        if(art.multTrigger==='corrupt50'&&corruption>=50)fires=1
        if(art.multTrigger==='perChain')fires=chainsFired
        if(art.multTrigger==='perStoned')fires=stonedCount
        if(art.multTrigger==='perDupe')fires=handDupes
        if(fires>0){
          const m=Math.pow(art.mult,fires)
          artifactMult*=m
          _breakdownLines.push({type:'multiply',label:art.emoji+' '+art.name+' ×'+m.toFixed(2),label2:'',runningAfter:0,color:'#e8a820'})
          addLog('⛧ '+art.emoji+' '+art.name+' TRIGGERS! ×'+m.toFixed(2))
        }
      }
      // CA1 Goat of Mendes — permanent ×1.25 all strikes
      if(activeArtifacts.some(a=>a.id==='ca1')){artifactMult*=1.25;_breakdownLines.push({type:'multiply',label:'🐐 Goat of Mendes ×1.25',label2:'',runningAfter:0,color:'#e8a820'})}
      // BOSS LOOT MULTIPLIER TRIGGERS
      for(const lootId of collectedLoot){
        const loot=BOSS_LOOT.find(l=>l&&l.id===lootId)
        if(!loot||!loot.multTrigger||!loot.mult)continue
        let fires=0
        if(loot.multTrigger==='perStrikesLeft')fires=strikesLeft
        if(loot.multTrigger==='firstCardFree'&&cardsPlayedCount>=1)fires=1
        if(loot.multTrigger==='alive4'&&actives.length>=4)fires=1
        if(loot.multTrigger==='perStash20')fires=Math.floor(stash/20)
        if(loot.multTrigger==='memberAtk20'&&actives.some(m=>m.atk>=20))fires=1
        if(loot.multTrigger==='perCorrThreshold')fires=[25,50,75,100].filter(t=>corruption>=t).length
        if(loot.multTrigger==='cards1'&&cardsPlayedCount===1)fires=1
        if(loot.multTrigger==='perUniqueKeyword')fires=new Set(actives.map(m=>m.keyword)).size
        if(fires>0){const m=Math.pow(loot.mult,fires);artifactMult*=m;_breakdownLines.push({type:'multiply',label:loot.emoji+' '+loot.name+' ×'+m.toFixed(2),label2:'',runningAfter:0,color:'#44ddff'});addLog('💎 '+loot.emoji+' '+loot.name+' ×'+m.toFixed(2)+'!')}
      }
      const finalDmg=Math.round(dmg*tripMult*currentMult*corruptionMult*artifactMult)
      if(tripMult>1){const _tr=Math.round(dmg*tripMult);_breakdownLines.push({type:'multiply',label:(fightTripBuff||'Trip')+' ×'+tripMult,label2:'= '+_tr.toLocaleString(),runningAfter:_tr,color:'#ff44ff'})}
      if(corruptionMult>1){_breakdownLines.push({type:'multiply',label:'Corruption ×'+corruptionMult.toFixed(1),label2:'= '+Math.round(dmg*tripMult*corruptionMult).toLocaleString(),runningAfter:Math.round(dmg*tripMult*corruptionMult),color:'#cc44ff'})}
      if(currentMult>1.0){_breakdownLines.push({type:'multiply',label:'Strike ×'+currentMult.toFixed(2),label2:'= '+finalDmg.toLocaleString(),runningAfter:finalDmg,color:'#ff4400'})};const newEHp=Math.max(0,startHp-finalDmg)
      if(newEHp<=0){const _ok=Math.abs(newEHp);updStat('overkillDmg',_ok)}
      setEnemyHp(prev=>Math.min(prev,newEHp))
      // damageScaleAtk: boss gains ATK per 20 damage taken
      if(enemy.passiveId==='luciferBoss'){
        const atkGain=luciferPhase===1?1:2
        const phaseTotalDmg=luciferPhase===1?(3333-newEHp):(3333-newEHp)
        setBossRageAtk(Math.floor(Math.max(0,phaseTotalDmg)/20)*atkGain)
      }
      if(_breakdownLines.length>1){setDmgBreakdown({lines:_breakdownLines,total:finalDmg})}
      addFloat(finalDmg.toLocaleString(),bc.x,bc.y-60,'#ff2200',true)
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
          setEnemyHp(3333);setScaledMaxHp(3333)
          setBossRageAtk(0)
          // Full band reset
          setStage(p=>p.map(m=>m?Object.assign({},m,{hp:m.maxHp,tooStoned:false,stoneShield:false,tempBuff:false,encoreReady:false,ampedThisStrike:false}):null))
          setEmbers(maxEmbers)
          setStrikesLeft(activeStake.maxStrikes)
          setFightMaxStrikes(activeStake.maxStrikes)
          setDiscardsLeft(MAX_DISCARDS)
          setFightMaxDiscards(MAX_DISCARDS)
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

      const _bossDelay=(_breakdownLines.length>1)?(_breakdownLines.length*140+200+1100+1000):(800+1000)
      if(_breakdownLines.length>1){const _slamAt=_breakdownLines.length*140+200;setTimeout(()=>{try{playSfx('big_hit')}catch(e){}},_slamAt)}
      setTimeout(function(){
        setDmgBreakdown(null) // dismiss breakdown before boss attacks
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
        // BOSS STRIKE ANIMATION — emoji square flies to target member
          const targetSlotIdx=stage.indexOf(target)
          const bossPos=getCenter(bossRef)
          const targetPos=getCenter(stageRefs.current[targetSlotIdx])
          // Compensate for ScaleRoot scaling — getBoundingClientRect is in screen coords
          // but CSS transforms are in game coords (1920x1080)
          const scaleEl=document.getElementById('vst-scale-root')
          const gameScale=scaleEl?parseFloat((scaleEl.style.transform.match(/scale\(([\d.]+)\)/)||[])[1])||1:1
          const bdx=(targetPos.x-bossPos.x)/gameScale
          const bdy=(targetPos.y-bossPos.y)/gameScale
          // Phase 1: WINDUP — boss dips
          setBossStrikeAnim({targetIdx:targetSlotIdx,phase:'windup',dx:bdx,dy:bdy})
          // Phase 2: LAUNCH — boss flies toward member
          setTimeout(()=>setBossStrikeAnim({targetIdx:targetSlotIdx,phase:'launch',dx:bdx,dy:bdy}),speedFast?200:400)
          // Phase 3: IMPACT — boss slams member, sound + shake
          setTimeout(()=>{
            setBossStrikeAnim({targetIdx:targetSlotIdx,phase:'impact',dx:bdx,dy:bdy})
            setHitMemberIdx(targetSlotIdx)
            setTimeout(()=>setHitMemberIdx(-1),500)
            playSfx('boss_attack')
            playHit()
            triggerShake(12,350)
          },speedFast?500:1000)
          // Phase 4: RETURN — boss floats back
          setTimeout(()=>setBossStrikeAnim({targetIdx:targetSlotIdx,phase:'return',dx:bdx,dy:bdy}),speedFast?700:1400)
          // Phase 5: DONE
          setTimeout(()=>setBossStrikeAnim(null),speedFast?900:1800)
          // Delay damage application until after boss animation
          setTimeout(function(){
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
        else if(enemy.passiveId==='corruptPlayer'||enemy.passiveId==='corruptPlayer10tut'){setCorruption(p=>Math.min(100,p+10));addLog('🔱 '+enemy.name+' corrupts your band! +10% Corruption.')}
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
        const possessionBonus=corruption>=100?3:0
        const actualDmg=(fightTripBuff==='ASTRAL PROJECTION')?0:Math.max(1,Math.round(scaledBaseDmg)+possessionBonus-bossDebuff)
          const ti=targetSlotIdx
          if(luciferAoE&&actualDmg>0){
            // Phase 2: AoE — split damage across ALL alive members
            const splitDmg=Math.ceil(actualDmg/activeM.length)
            addLog('😈 Satan strikes ALL members for '+splitDmg+' each! ('+actualDmg+' total)')
            setStage(function(prev){
              const ns2=[...prev]
              for(let ai=0;ai<ns2.length;ai++){
                if(!ns2[ai]||ns2[ai].tooStoned)continue
                const newHp=ns2[ai].hp-splitDmg
                if(newHp<=0&&!ns2[ai].stoneShield){ns2[ai]=Object.assign({},ns2[ai],{hp:0,tooStoned:true,bloodOath:false});updStat('tooStonedCount',1);playSfx('member_down');triggerShake(12,400)
                  if(activeArtifacts.some(a=>a.id==='a6')){setEnemyHp(ehp=>{const nh=Math.max(0,ehp-8);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh});addLog('🕯 Black Candle! 8 damage!')}
                }
                else if(newHp<=0&&ns2[ai].stoneShield){const nsh=typeof ns2[ai].stoneShield==='number'?ns2[ai].stoneShield-1:0;ns2[ai]=Object.assign({},ns2[ai],{hp:1,stoneShield:nsh>0?nsh:false});setClutchFlash({text:'CLUTCH!',color:'#ffd700'});setTimeout(()=>setClutchFlash(null),1500)}
                else{ns2[ai]=Object.assign({},ns2[ai],{hp:Math.max(0,newHp)})}
              }
              const allStoned=ns2.filter(m=>m).every(m=>m.tooStoned)
              if(allStoned){discover('allstoned','TOTAL WIPEOUT');if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins this round. But you already conquered Hell.')}else if(tutorialFight>0){setShowTutorialMsg('You got stoned! No worries, try that one again.');setTimeout(()=>startTutorialFight(tutorialFight),2000);return}else{setDeathCause('stoned');playSfx('defeat')};setTimeout(()=>setGameState('end'),800)}
              return ns2
            })
            setDamageFlash(true);triggerShake(10,350);setTimeout(()=>setDamageFlash(false),400)
          } else {
          setStage(function(prev){
            const ns2=[...prev]
            if(ns2[ti]){
              // BLOOD OATH: instant death on any boss damage
              if(ns2[ti].bloodOath&&actualDmg>0){
                ns2[ti]=Object.assign({},ns2[ti],{hp:0,tooStoned:true,bloodOath:false})
                if(ns2[ti].isMentor){for(let _bi=0;_bi<ns2.length;_bi++){if(ns2[_bi]&&ns2[_bi].mentorLinkedToUid===ns2[ti].uid)ns2[_bi]={...ns2[_bi],mentorAlive:false}}}
                updStat('tooStonedCount',1)
                addLog('🩸 BLOOD OATH FULFILLED! '+ns2[ti].name+' is destroyed by a single blow!')
                playSfx('member_down')
                addFloat('BLOOD OATH!',targetPos.x,targetPos.y-60,'#cc0000',true)
              } else {
              const newHp=ns2[ti].hp-actualDmg
              if(newHp<=0&&!ns2[ti].stoneShield){
                ns2[ti]=Object.assign({},ns2[ti],{hp:0,tooStoned:true,bloodOath:false})
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
                addFloat('TOO STONED',targetPos.x,targetPos.y-60,'#888',false)
              } else if(newHp<=0&&ns2[ti].stoneShield){
                // StoneShield absorbs lethal hit — survives at 1 HP, decrement shield
                const newShield=typeof ns2[ti].stoneShield==='number'?ns2[ti].stoneShield-1:0
                ns2[ti]=Object.assign({},ns2[ti],{hp:1,stoneShield:newShield>0?newShield:false})
                addLog('🛡 '+target.name+' shielded from death! 1 HP remaining.'+(newShield>0?' ('+newShield+' shield left)':''))
                addFloat('SHIELDED!',targetPos.x,targetPos.y-60,'#44ccff',true)
              } else {
                ns2[ti]=Object.assign({},ns2[ti],{hp:Math.max(0,newHp)})
              }
              addFloat(actualDmg,targetPos.x,targetPos.y-50,'#ff3300',false)
              } // end blood oath else
            }
            const allStoned=ns2.filter(function(m){return m}).every(function(m){return m.tooStoned})
            if(allStoned){discover('allstoned','TOTAL WIPEOUT');if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins this round. But you already conquered Hell.')}else{setDeathCause('stoned');playSfx('defeat')};const _bc=Math.floor(fightIndex/3)+1;if(_bc>bestRunCircle){localStorage.setItem('vst_best_circle',_bc.toString())};recordLegacyRun(stage,stats,false,Math.floor(fightIndex/3)+1);setTimeout(function(){setGameState('end')},800)}
            return ns2
          })
          if(stage[stage.indexOf(target)]&&!stage[stage.indexOf(target)].tooStoned&&(stage[stage.indexOf(target)].hp-actualDmg)<=0&&!stage[stage.indexOf(target)].stoneShield)addLog('💨 '+target.name+' is TOO STONED!')
          setDamageFlash(true);triggerShake(10,350);setTimeout(function(){setDamageFlash(false)},400)
          addLog('👁 '+enemy.name+' hits '+target.name+' for '+actualDmg)
          } // end single-target else
          },speedFast?600:1200) // boss animation delay
          setTimeout(function(){
            let nh=[...handRef.current],nd=[...deckRef.current],ndisc=[...discRef.current];
            const cardsToReplace=Math.min(cardsToDrawRef.current,Math.max(0,handTargetRef.current-nh.length));
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
                    return Object.assign({},m,{hp:0,tooStoned:true,bloodOath:false})
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
            setAnimPhase('idle');setStrikingMemberIdx(-1);setStrikeAnim(null);setBossStrikeAnim(null);setFlyingCard(null);setSelected([]);
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
      },_bossDelay)
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
        const _fmS=activeStake.maxStrikes+(chosenPacts.includes('war_drums')?1:0);
        setEmbers(maxEmbers);setStrikesLeft(_fmS);setFightMaxStrikes(_fmS);setDiscardsLeft(MAX_DISCARDS);setFightMaxDiscards(MAX_DISCARDS)
        setStageDiveUsed(false);setAnimPhase('idle');setStrikingMemberIdx(-1);setStrikeAnim(null);setBossStrikeAnim(null);setFlyingCard(null);setSelected([]);setLastRiffPlayed(null)
        setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[]
        setContractsPlayed(0);setPendingDraw(0);wthStrikesRef.current=0
        const allCards=[...handRef.current,...deckRef.current,...discRef.current].sort(()=>Math.random()-.5)
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
    setEnemy(nextEnemy);const _deckScale=(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).hpScale||1;const _sHp=Math.ceil(nextEnemy.maxHp*_deckScale*(encoreMode?2.0:1.0));setEnemyHp(_sHp);setScaledMaxHp(_sHp)
    // per-fight tracking resets
    fightStartTimeRef.current=Date.now()
    // ── PRE-FIGHT SPLASH — tour quote loading screen ──
    if(tutorialFight===0){
      setPreFightSplash({enemy:nextEnemy,circle:nextEnemy.circle||('Circle '+(Math.floor(nextIdx/3)+1)),quote:TOUR_QUOTES[Math.floor(Math.random()*TOUR_QUOTES.length)]})
      setTimeout(()=>setPreFightSplash(null),2200)
    }
    corruptionAtFightStartRef.current=corruption
    cardsPlayedThisFightRef.current=0
    highestStrikeThisFightRef.current=0
    damageThisFightRef.current=0
    embersSpentThisFightRef.current=0
    addLog('══════ FIGHT '+(nextIdx+1)+': '+nextEnemy.name+' ('+Math.ceil(nextEnemy.maxHp*activeStake.hpMult*(encoreMode?2.0:1.0))+' HP) ══════')
    // Pact: Corruption Engine — +5% corruption at fight start
    if(chosenPacts.includes('corruption_engine')&&!chosenPacts.includes('corruption_locked'))setCorruption(p=>Math.min(100,p+5))
    // CORRUPTION THRESHOLD: 25% — The Whispers (weakest takes 1 dmg)
    if(corruption>=25){
      setStage(p=>{const alive=p.filter(m=>m&&!m.tooStoned);if(alive.length===0)return p;const weakest=alive.reduce((a,b)=>a.hp<b.hp?a:b);return p.map(m=>m&&m.uid===weakest.uid?Object.assign({},m,{hp:Math.max(1,m.hp-1)}):m)})
      addLog('🔮 The Whispers... '+corruption+'% corruption gnaws at your weakest.')
    }
    const _fmStrikes = activeStake.maxStrikes+(chosenPacts.includes('war_drums')?1:0);
    const _fmDiscards = MAX_DISCARDS+(bonusDiscards>0?bonusDiscards:0);
    setEmbers(function(){return maxEmbers+(bonusEmbers>0?bonusEmbers:0)});playSfx('ember_gain');setStrikesLeft(_fmStrikes);setFightMaxStrikes(_fmStrikes);setDiscardsLeft(_fmDiscards);setFightMaxDiscards(_fmDiscards);setPendingDraw(0)
    if(bonusDiscards>0)setBonusDiscards(0);if(bonusEmbers>0)setBonusEmbers(0)
    setStageDiveUsed(false);setAnimPhase('idle');setStrikingMemberIdx(-1);setStrikeAnim(null);setBossStrikeAnim(null);setFlyingCard(null);setSelected([]);setProjectiles([]);setBossDebuff(0);setBossRageAtk(0);setNextCardFree(false);setAllCardsFree(false);setSkipNextDiscard(false);setShredderUsed(false);setLastRiffPlayed(null);setStashStolenThisFight(0);setTripUsedThisFight(false);setActiveTripEffect(null);setFightTripBuff(null);setStolenAtkPool(0);setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[];handTargetRef.current=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0);milestonesFiredRef.current={half:false,quarter:false,tenth:false};wthStrikesRef.current=0;recruitPickFiredRef.current=false;setPhaseBanner('play');setStrikeMult(1.0);setMemberBuffs({});victoryFiredRef.current=false;setSlowBurnStrikes(0);setAmpFeedbackDiscount(0);setPyromaniacActive(false)
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
    const allCards=[...handRef.current,...deckRef.current,...discRef.current].sort(()=>Math.random()-.5)
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
      // A1: Vintage Guitar — now ×1.3 mult trigger (applied in damage calc)
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
      // CA1: Goat of Mendes — now ×1.25 strike multiplier (applied in damage calc)
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
    if(activeArtifacts.some(a=>a.id==='wardrums')){setStrikesLeft(p=>p+1);setFightMaxStrikes(p=>p+1);addLog('🪘 War Drums! +1 Strike this fight.')}
    setGameState('playing')
  },[fightIndex,maxEmbers,stage])

  // ═══════════════════════════════════════════════════════════
  // HANDLE EVENT CHOICE — apply effects, then go to shop
  // ═══════════════════════════════════════════════════════════
  const handleEventChoice=useCallback((choice)=>{
    if(!pendingEvent)return
    const eid=pendingEvent.id
    const alive=stage.filter(m=>m&&!m.tooStoned)

    if(eid==='mosh_pit'){
      if(choice==='A'){
        // All members take 4 damage. Survivors gain +1 ATK permanently.
        setStage(p=>p.map(m=>{
          if(!m||m.tooStoned)return m
          const newHp=m.hp-4
          if(newHp<=0){
            addLog('💀 '+m.name+' was crushed in the Mosh Pit!')
            playSfx('member_down')
            return Object.assign({},m,{hp:0,tooStoned:true,bloodOath:false})
          }
          addLog('🤘 '+m.name+' survives the pit! +1 ATK')
          return Object.assign({},m,{hp:newHp,atk:m.atk+1,permAtkBonus:(m.permAtkBonus||0)+1})
        }))
      } else {
        setStash(p=>Math.max(0,p-15))
        addLog('🚶 You walk away. -15 Stash. The crowd boos.')
      }
    }
    else if(eid==='cursed_amp'){
      if(choice==='A'){
        setMaxEmbers(p=>Math.min(MAX_EMBERS_CAP+2,p+2))
        // Lock corruption by setting a flag (we use a simple approach: set corruption floor)
        addLog('⚡ Cursed Amp! +2 Max Embers. Corruption is now LOCKED at '+corruption+'%.')
        // We mark corruption locked via a pact-like mechanism
        if(!chosenPacts.includes('corruption_locked'))setChosenPacts(p=>[...p,'corruption_locked'])
      } else {
        setCorruption(p=>Math.max(0,p-15))
        addLog('🔨 You smash the amp. -15% Corruption.')
      }
    }
    else if(eid==='blood_oath'){
      if(choice==='A'){
        // Strongest member gets +5 ATK but gains bloodOath flag
        if(alive.length>0){
          const strongest=alive.reduce((a,b)=>a.atk>b.atk?a:b)
          setStage(p=>p.map(m=>m&&m.uid===strongest.uid?Object.assign({},m,{atk:m.atk+5,permAtkBonus:(m.permAtkBonus||0)+5,bloodOath:true}):m))
          addLog('✍ '+strongest.name+' signs the Blood Oath! +5 ATK. But one hit from a boss and they die.')
        }
      } else {
        addLog('🚫 You refuse. The figure dissolves.')
      }
    }
    else if(eid==='hellfire_baptism'){
      if(choice==='A'){
        setCorruption(69)
        setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+2,permAtkBonus:(m.permAtkBonus||0)+2}):m))
        addLog('🔥 Hellfire Baptism! Corruption → 69%. All members +3 ATK!')
      } else {
        addLog('↩ You find another way around. Nothing happens.')
      }
    }
    else if(eid==='sabbath_offering'){
      if(choice==='A'){
        // Remove 3 weakest cards (commons first, then by lowest copies count)
        setDeck(p=>{
          const sorted=[...p].sort((a,b)=>{
            const rarityOrder={Common:0,Uncommon:1,Rare:2}
            const ra=rarityOrder[a.rarity]||0, rb=rarityOrder[b.rarity]||0
            if(ra!==rb) return ra-rb // commons first
            return (a.embers||0)-(b.embers||0) // then cheapest
          })
          const removed=sorted.slice(0,Math.min(3,sorted.length))
          removed.forEach(c=>addLog('🪦 Offered: '+c.name+' ('+c.rarity+')'))
          return sorted.slice(Math.min(3,sorted.length))
        })
        setStage(p=>p.map(m=>m?Object.assign({},m,{atk:m.atk+1,permAtkBonus:(m.permAtkBonus||0)+1}):m))
        addLog('⛧ Sabbath Offering accepted! 3 weakest cards removed. All members +1 ATK permanently.')
      } else {
        addLog('🃏 You keep your cards. The altar crumbles.')
      }
    }
    else if(eid==='devils_wager'){
      if(choice==='A'){
        const flip=Math.random()<0.5
        if(flip){
          // HEADS — +3 ATK all
          setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3,permAtkBonus:(m.permAtkBonus||0)+3}):m))
          addLog('🪙 HEADS! The Devil grins. All members +3 ATK!')
          playSfx('big_hit')
        } else {
          // TAILS — strongest member dies
          if(alive.length>0){
            const strongest=alive.reduce((a,b)=>a.atk>b.atk?a:b)
            setStage(p=>p.map(m=>m&&m.uid===strongest.uid?Object.assign({},m,{hp:0,tooStoned:true,bloodOath:false}):m))
            addLog('🪙 TAILS. '+strongest.name+' collapses. The Devil laughs.')
            playSfx('member_down')
          }
        }
      } else {
        addLog('🚶 "Coward." The Devil vanishes.')
      }
    }

    // Transition to shop after a delay
    setTimeout(()=>{setPendingEvent(null);setGameState('shop')},1500)
  },[pendingEvent,stage,corruption,chosenPacts,stash])


  const handleShopSpend=useCallback((cost,type,item)=>{
    const hungerMult=corruption>=50?1.25:1.0
    const effectiveCost=Math.ceil((chosenPacts.includes('merchants_eye')?Math.max(1,Math.floor(cost*0.8)):cost)*hungerMult)
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
    runStartTimeRef.current=Date.now()
    // Apply starter deck bonuses
    const deckDef=STARTER_DECKS.find(d=>d.id===selectedDeck)
    if(deckDef?.startCorruption)setCorruption(deckDef.startCorruption)
    if(deckDef?.startStash)setStash(p=>p+(deckDef.startStash||0))
    setGameState('booster');setFightIndex(0);setEnemy(ENEMIES[0]);setEnemyHp(ENEMIES[0].maxHp)
    setStage([null,null,null,null,null]);setDeck([]);setHand([]);setDiscardPile([])
    setEmbers(activeStake.startEmbers);setMaxEmbers(activeStake.startEmbers);setStash(3);setStrikesLeft(activeStake.maxStrikes);setFightMaxStrikes(activeStake.maxStrikes);setDiscardsLeft(MAX_DISCARDS);setFightMaxDiscards(MAX_DISCARDS);setPendingDraw(0);setBonusDiscards(0);setBonusEmbers(0)
    setAnimPhase('idle');setStrikingMemberIdx(-1);setStrikeAnim(null);setBossStrikeAnim(null);setFlyingCard(null);setSelected([]);setProjectiles([]);setStageDiveUsed(false);setCorruption(activeStake.startCorruption);setDeathCause('fallen');setCircleClearedData(null);setCardsPlayedThisStrike([]);cardsPlayedRef.current=[];combosFiredRef.current=[];handTargetRef.current=HAND_SIZE;setCombosDiscoveredThisRun([]);setComboFlash(null);setChosenPacts([]);setUpgradedCards([]);setCollectedLoot([]);setPactChoices([]);setDescentData(null);overrideFightIdxRef.current=null;skipDescentRef.current=false
    setLog(['⛧ Starting fresh...']);fullRunLogRef.current=['⛧ Starting fresh...'];setNewTrophies([]);setShopBoughtIds([]);setShopSoldIds([]);setCircleCartBought(false);setCirCleCpasBought(false);setShopSoldIds([]);setHeldShrooms(0);setHeldAcid(0);setActiveTripEffect(null);setTripUsedThisFight(false);setFightTripBuff(null);setLuciferPhase(0);setLuciferCinematic(null);setVictoryCinematic(null);setCreditsRoll(false);setWelcomeToHell(null);setContractsPlayed(0);setStolenAtkPool(0);setNewAchievements([]);setDrugsUsedThisRun({shrooms:0,acid:0})
    setActiveArtifacts([]);setActivePassives([]);setPendingBurningStage(false);setStrikeMult(1.0);strikeMultRef.current=1.0;setMemberBuffs({});setNextCardFree(false);nextCardFreeRef.current=false;setAllCardsFree(false);allCardsFreeRef.current=false;victoryFiredRef.current=false;milestonesFiredRef.current={half:false,quarter:false,tenth:false};wthStrikesRef.current=0;recruitPickFiredRef.current=false
    setDiscovered(new Set());setPendingEvent(null);setEventsSeenThisRun([]);setPossessionFired(false);setCorruptionFlash(null);lastCorruptThreshold.current=0;setEncoreMode(false);setEncoreCircle(0)
    setStats({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0,overkillDmg:0,bestMultiplier:1.0})
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

  // ── KEYBOARD SHORTCUT REFS — keep in sync each render so handler reads current values
  const canStrikeRef=useRef(canStrike);canStrikeRef.current=canStrike
  const canDiscardRef=useRef(canDiscard);canDiscardRef.current=canDiscard
  const selectedRef=useRef(selected);selectedRef.current=selected
  const stageDiveUsedRef=useRef(stageDiveUsed);stageDiveUsedRef.current=stageDiveUsed
  const handleStrikeRef=useRef(null);handleStrikeRef.current=handleStrike
  const handleDiscardRef=useRef(null);handleDiscardRef.current=handleDiscard
  const handleUndoRef=useRef(null);handleUndoRef.current=handleUndo
  const playSfxRef=useRef(null);playSfxRef.current=playSfx
  const gameStateRef=useRef(gameState);gameStateRef.current=gameState
  const won=fightIndex>=26&&enemyHp<=0
  // Corruption visual escalation
  const corruptLow=corruption>=40&&corruption<70
  const corruptHigh=corruption>=70&&corruption<100
  const corruptMax=corruption>=100
  const chromaStr=corruptMax?4:corruptHigh?2:corruptLow?1:0
  const parchmentFilter=corruptMax?'sepia(0.4) hue-rotate(330deg) saturate(1.8)':corruptHigh?'sepia(0.25) hue-rotate(340deg) saturate(1.4)':corruptLow?'sepia(0.1) saturate(1.1)':'none'
  const bgPulseAnim=corruption>=50?'bgPulse '+(corruption>=75?'1.5s':'3s')+' ease-in-out infinite':'none'

  // ── TROPHY WALL / MASTERY GALLERY (overlay from menu) ──
  if(showTrophies&&gameState==='menu')return(<div style={{width:1920,height:1080,position:'relative',overflow:'hidden'}}><TrophyWall onClose={()=>setShowTrophies(false)}/></div>)
  if(showMastery&&gameState==='menu')return(<div style={{width:1920,height:1080,position:'relative',overflow:'auto'}}><MasteryGallery onClose={()=>setShowMastery(false)}/></div>)

  // ── COLD OPEN SPLASH — overlays menu on first ever launch
  const ColdOpenOverlay=coldOpenPhase!==null&&coldOpenPhase<5?<ColdOpenScreen phase={coldOpenPhase}/>:null
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
        <div style={{maxWidth:1500,width:'100%',display:'flex',flexDirection:'column',gap:12}}>
          {[
            ['🎸 The Goal','Build a doom metal band and fight through 9 Circles of Hell. Defeat all 27 enemies and Lucifer to win. Each circle has 2 regular fights and 1 boss fight.'],
            ['⚔ Strikes','You get 4 Strikes per fight (some stakes change this). Play cards to buff your band, then press Strike. All living members deal their ATK as damage to the boss.'],
            ['↓ Discards','You get 4 Discards per fight. Select unwanted cards and discard them to draw fresh ones. Strategic discarding is key to finding your best cards.'],
            ['🔥 Embers','Cards cost Embers to play. You refill to your max Embers at the start of each Strike. Max Embers increases by +1 after each boss kill.'],
            ['🌿 Stash','Your currency. Earned after victories (scales with circle depth). Spent in the shop on recruit packs, cards, artifacts, passives, and drugs. Capped at 420.'],
            ['💀 Too Stoned','When a member reaches 0 HP, they go Too Stoned and can\'t attack or be targeted. If ALL members go Too Stoned, the run ends.'],
            ['👥 Band Members','Your band has up to 5 slots (6 with the Sixth Slot pact). Each member has ATK, HP, and a keyword ability. Recruit new members from packs in the shop.'],
            ['🏷 Member Keywords','FRENZIED: +1 ATK on boss kills. DOUBLE TIME: Roll d6 for damage multiplier. ANCHOR: Heals adjacent members. CORRUPT: +1 ATK per 15% corruption. DEBUFF: Reduces boss damage. FOLK MAGIC: 20% chance to refill all Embers. SHREDDER: First RIFF card each strike costs -1 Ember. HEXED: Auto-raises corruption, gains ATK from it.'],
            ['⛓ Mentor Links','Place a Foil/Mythic/Demonic member directly LEFT of a basic member with the same role. They form a Mentor Link — a permanent damage multiplier that fires every Strike while both are alive.'],
            ['✨ Member Tiers','Members come in tiers: Basic (standard), Foil (+1 ATK/HP, -1 Ember on cards), Mythic (+3 ATK/HP), Demonic (+5 ATK/HP, golden glow). Higher tiers appear in better packs.'],
            ['🃏 Card Types','RIFF (purple): Direct damage and ATK buffs. CORRUPT (red): Corruption-scaling power. UTILITY (green): Healing, draw, and economy. EMBER (orange): Ember management and recovery.'],
            ['⛧ Riff Chains','Playing specific card pairs triggers Riff Chains — massive combo bonuses! Chains multiply your Strike damage (e.g., Battle Cry + Stage Dive = DEATH WISH). 16 chains to discover. The celebration shows which cards triggered it.'],
            ['×️ Strike Multiplier','Every card played MULTIPLIES your Strike by ×1.08. Riff Chains multiply by ×1.78. Multiple chains stack multiplicatively. 6 cards + 1 chain = ×2.83. The multiplier resets each Strike.'],
            ['🌀 Corruption','A risk/reward axis from 0-100%. Some cards and enemies raise it. CORRUPT keyword members get stronger at high corruption. Overdrive requires 60%+. Feedback Loop and Amp the Static scale with it.'],
            ['⚠ Corruption Thresholds','25% THE WHISPERS: Weakest member takes 1 damage each fight. 50% THE HUNGER: All shop prices +25%. 75% THE MADNESS: 15% chance to lose a random card before each Strike. 100% THE POSSESSION: Boss damage +3, but CORRUPT members get one-time +3 ATK.'],
            ['💀 Corruption = Power','Corruption is a MULTIPLIER. Every 20% corruption = ×1.2 damage on all Strikes. At 100% you deal ×2.0 damage but the boss hits +3 harder. Risk vs reward — ride the corruption wave.'],
            ['🧹 Reducing Corruption','Smoke Break: -15%. Herb Money: -15%. Controlled Feedback: Sets to 50%. Signal Decay: -15%. Atonement pact: -15% after each boss kill. Some descent rewards also reduce corruption.'],
            ['⛧ Pacts','After each boss kill, choose 1 of 2 pact offers. Pacts are permanent buffs for the rest of the run. 13 pacts total including Ember Surge, Iron Strings, Thick Skin, Clean Living, Corruption Engine, Atonement, and more.'],
            ['🔨 Doom Forge','After choosing a pact, the Doom Forge appears. Upgrade one card in your deck permanently. Upgraded cards have stronger effects and some grant permanent HP buffs.'],
            ['🗺 Descent Map','At the start of each new circle (C2-C9), choose which of the 3 fights to face. You can skip up to 2 fights for rewards (Stash, ATK, Embers, corruption reduction, HP, cards).'],
            ['🎲 Random Events','30% chance of a Hell-themed event between non-boss fights. Choose between two options with risk/reward tradeoffs. 6 events: Mosh Pit, Cursed Amp, Blood Oath, Hellfire Baptism, Sabbath Offering, Devil\'s Wager.'],
            ['🏪 The Shop','After each fight: buy recruit packs (add members), card packs (add cards), artifacts, passives, and drugs. Circle artifacts and passives change each circle.'],
            ['🍄 The Dealer','Buy Shrooms (6🌿) or Acid (12🌿) in the shop. Use before your first Strike. Shrooms: 90% good trip (various buffs), 5% bad trip, 5% bunk. Acid: stronger effects but riskier.'],
            ['⚙ Artifacts & Passives','Vintage Amps (artifacts) give powerful active effects. Effect Pedals (passives) provide ongoing bonuses. Max 3 artifacts, 5 passives. Buy in the shop.'],
            ['♻ Pawn Shop','Sell unwanted members or cards for Stash. Burn cards to permanently remove them from your deck (deck thinning). Access via the shop.'],
            ['🏆 Mastery','Every card play earns mastery XP. 4 tiers: Novice (10 plays), Adept (50), Master (200), Legendary (666). View progress in the Mastery Gallery from the main menu.'],
            ['💀 Trophy Wall','The Hall of Damnation tracks every boss you\'ve killed. Kills, best damage, best stake — all recorded. 28 trophies to collect.'],
            ['📊 Band Legacy','Your band members remember past runs. They track wins, deaths, total damage, and earn nicknames (The Immortal, Bonecrusher, The Legendary). Visible on Opening Night.'],
            ['🎯 Stakes','6 difficulty levels: Bronze (standard), Silver (+2 boss dmg), Gold (+3 boss dmg, +25% shop prices), Obsidian (+38% boss HP, no post-fight heal), Blood (+48% boss HP, start at 10% corruption), Demonic (max 3 Strikes, +66% boss HP).'],
            ['🌍 Daily Challenge','A shared daily seed. Everyone faces the same RNG. Your best daily score is tracked. Play from the main menu or end screen.'],
            ['📜 Combat Log','Press ESC during combat to open the pause menu, then click Combat Log to review every event in the current run. Also available on the end screen as Run Log.'],
            ['💪 Synergy Bonus','When 3+ members have been buffed (ATK increased by cards), your Strike gets a damage bonus: 3 buffed = +10%, 4 buffed = +20%, 5 buffed = +35%. Reward for investing cards in your whole band.'],
            ['🎁 Boss Loot','Each circle boss drops a unique permanent reward when defeated. These include +1 ATK to all members, +1 max Ember, member HP boosts, and more. Boss loot stacks across the entire run.'],
            ['🛡 Stone Shield','Roadie and some events grant Stone Shield — when a member would die, they survive at 1 HP instead. The shield absorbs the lethal hit and is consumed. Essential for surviving boss fights.'],
            ['🔄 Encore Mode','After defeating Lucifer and clearing all 9 Circles, you can choose to enter Encore Mode — all enemies return with ×2.0 HP. How far can you push your band?'],
          ].map(([title,desc],i)=><div key={i} style={{background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:8,padding:'14px 20px'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:36,fontWeight:900,color:'#e8a820',marginBottom:4}}>{title}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'#c8b080',lineHeight:1.5}}>{desc}</div>
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
            ['Chain Hints','vst_chainhints',localStorage.getItem('vst_chainhints')!=='off'],
            ['VHS Effect','vst_vhs',localStorage.getItem('vst_vhs')!=='off'],
          ].map(([label,key,on])=>(
            <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>{label}</span>
              <button onClick={()=>{localStorage.setItem(key,on?'off':'on');setMenuView('options')}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:on?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(on?'#44cc44':'#cc4444'),borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{on?'ON':'OFF'}</button>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#e8a820'}}>Combat Speed</span>
            <button onClick={()=>{setSpeedMode(p=>{const nv=!p;localStorage.setItem('vst_speed',nv?'fast':'normal');return nv});setMenuView('options')}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#e8a820',background:'rgba(0,0,0,0.4)',border:'1px solid #c87820',borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{speedMode?'FAST':'NORMAL'}</button>
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
      <>
      {ColdOpenOverlay}
      <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(2,1,0,0.99)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0,overflow:'hidden'}}>
        {/* Background logo — large, subtle */}
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',opacity:0.08}}>
          <img src={import.meta.env.BASE_URL+"vestibule_logo.png"} alt="" style={{width:972,height:972,objectFit:'contain'}}/>
        </div>
        {/* Scanlines */}
        
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

          {/* PLAY BUTTONS */}
          {!isTutorialDone()?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,marginBottom:16}}>
              <button onClick={()=>startTutorialFight(1)}
                style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:63,letterSpacing:10,color:'#ee2222',
                  background:'rgba(120,0,0,0.25)',border:'3px solid #aa0000',borderRadius:10,
                  padding:'28px 120px',cursor:'pointer',textTransform:'uppercase',
                  textShadow:'0 0 30px rgba(220,0,0,0.7)',
                  boxShadow:'0 0 50px rgba(180,0,0,0.3)',
                  animation:'throb 2s ease-in-out infinite',transition:'all 0.2s'}}>
                ⛧ Start Tutorial ⛧
              </button>
              <button onClick={()=>{markTutorialDone();setGameState('booster')}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,letterSpacing:4,color:'#8a7a50',
                  background:'none',border:'none',cursor:'pointer',textDecoration:'underline',
                  textTransform:'uppercase',opacity:0.7}}>
                Skip Tutorial — I know what I'm doing
              </button>
            </div>
          ):(
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
          )}

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
            <button onClick={()=>setShowTrophies(true)}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'#cc4444',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(180,50,50,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              💀 Trophies ({Object.keys(getTrophyData()).length}/28)
            </button>
            <button onClick={()=>setShowMastery(true)}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'#c8a040',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(200,160,40,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              🏆 Mastery ({getTotalMastery().maxed}/{ALL_CARDS.filter(c=>!c.shopOnly&&c.id!=='contract').length})
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
      </>
    )
  }

  // ═══ BOOT SCREEN — flickering venue marquee ═══════════════════
  if(bootScreen)return(
    <div style={{width:1920,height:1080,position:'relative',background:'#000',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
      onClick={()=>setBootScreen(false)}>
      {/* Dim venue glow */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 40%,rgba(80,20,5,0.25),transparent 60%)',pointerEvents:'none'}}/>
      {/* Marquee frame */}
      <div style={{position:'relative',border:'3px solid rgba(200,152,56,0.4)',borderRadius:8,padding:'60px 100px',background:'rgba(10,6,2,0.9)',boxShadow:'0 0 80px rgba(200,152,56,0.15), inset 0 0 60px rgba(0,0,0,0.9)'}}>
        {/* Light bulbs around frame */}
        {Array.from({length:24}).map((_,i)=>{
          const total=24,angle=(i/total)*Math.PI*2
          const w=520,h=280,cx=w/2,cy=h/2
          const x=cx+Math.cos(angle)*(w/2+8)-4
          const y=cy+Math.sin(angle)*(h/2+8)-4
          return <div key={i} style={{position:'absolute',left:x-40,top:y-40,width:8,height:8,borderRadius:'50%',background:i%3===0?'#ffd700':'#cc8800',boxShadow:'0 0 '+(i%3===0?12:6)+'px '+(i%3===0?'#ffd700':'#cc8800'),animation:'marqueeBulb 1.2s ease-in-out '+(i*0.1)+'s infinite alternate',opacity:0.8}}/>
        })}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:8,color:'var(--ink-dim)',textTransform:'uppercase',textAlign:'center',marginBottom:8}}>Tonight Only</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:96,color:'var(--blood)',textShadow:'0 0 40px rgba(196,30,58,0.7),0 0 80px rgba(150,0,0,0.4),3px 3px 0 #000',letterSpacing:6,textAlign:'center',lineHeight:1,animation:'marqueeFlicker 3s ease-in-out infinite'}}>Vestibule</div>
        <svg width="400" height="6" viewBox="0 0 400 6" style={{margin:'12px auto',display:'block'}}><path d="M 8 3 Q 100 1, 200 3 T 392 3" stroke="var(--gold)" strokeWidth="0.8" fill="none" opacity="0.5"/></svg>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,letterSpacing:6,color:'var(--gold)',textTransform:'uppercase',textAlign:'center',fontWeight:900,textShadow:'0 0 12px rgba(200,152,56,0.5)'}}>Doors 8PM · All Ages · No Refunds</div>
      </div>
      {/* Press any key */}
      <div style={{marginTop:60,fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:8,color:'var(--ink-dim)',textTransform:'uppercase',animation:'marqueeBlink 1.5s ease-in-out infinite'}}>Press Any Key</div>
      <style>{`
        @keyframes marqueeFlicker{0%,95%,100%{opacity:1;text-shadow:0 0 40px rgba(196,30,58,0.7),0 0 80px rgba(150,0,0,0.4),3px 3px 0 #000}96%{opacity:0.7;text-shadow:0 0 20px rgba(196,30,58,0.3)}97%{opacity:1}98%{opacity:0.6}}
        @keyframes marqueeBlink{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes marqueeBulb{0%{opacity:0.4;transform:scale(0.8)}100%{opacity:1;transform:scale(1.1)}}
      `}</style>
    </div>
  )

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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#c8a040',marginTop:16,fontStyle:'italic',cursor:'pointer'}} onClick={()=>{setVictoryCinematic(null);setCreditsRoll(true)}}>Click anywhere to continue</div>
      </div>}
      {victoryCinematic.phase>=4&&<div style={{position:'absolute',inset:0,cursor:'pointer'}} onClick={()=>{setVictoryCinematic(null);setCreditsRoll(true)}}/>}
    </div>
  )

  // ═══ CREDITS ROLL — full cinema credits after beating Lucifer ═══════════
  if(creditsRoll)return(
    <div style={{width:1920,height:1080,position:'relative',background:'#000',overflow:'hidden',cursor:'pointer'}}
      onClick={()=>{setCreditsRoll(false);setWelcomeToHell('choice')}}>
      {/* Vignette */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 20%,rgba(60,0,0,0.5) 100%)',pointerEvents:'none',zIndex:2}}/>
      {/* Skip hint */}
      <div style={{position:'absolute',bottom:30,right:40,zIndex:3,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:3,opacity:0.5}}>CLICK TO SKIP</div>
      {/* Scrolling credits container — starts below viewport, scrolls up */}
      <div style={{position:'absolute',left:'50%',top:1080,width:800,animation:'creditsScroll 45s linear forwards',zIndex:1}}>
        {/* Game title */}
        <div style={{textAlign:'center',marginBottom:80,paddingTop:40}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:120,color:'var(--blood)',textShadow:'0 0 60px rgba(196,30,58,0.8),4px 4px 0 #000',letterSpacing:8,lineHeight:1}}>Vestibule</div>
          <svg width="500" height="8" viewBox="0 0 500 8" style={{margin:'16px auto'}}><path d="M 8 4 Q 125 1, 250 4 T 492 4" stroke="var(--blood)" strokeWidth="1.5" fill="none" opacity="0.7"/></svg>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:24,color:'var(--ink-dim)',fontStyle:'italic',marginTop:8}}>A Doom Metal Roguelite Deckbuilder</div>
        </div>
        {/* Credits entries */}
        {[
          {role:'Director',name:'Hired Heist'},
          {role:'Lead Game Designer',name:'Hired Heist'},
          {role:'Lead Programmer',name:'Hired Heist'},
          {role:'Technical Director',name:'Hired Heist'},
          {role:'Art Director',name:'Hired Heist'},
          {role:'Character Designer',name:'Hired Heist'},
          {role:'UI / UX Designer',name:'Hired Heist'},
          {role:'Visual Effects Artist',name:'Hired Heist'},
          {role:'Animation Director',name:'Hired Heist'},
          {role:'Concept Artist',name:'Hired Heist'},
          {role:'Sound Designer',name:'Hired Heist'},
          {role:'Music Composer',name:'Hired Heist'},
          {role:'Audio Engineer',name:'Hired Heist'},
          {role:'Narrative Designer',name:'Hired Heist'},
          {role:'Lore Architect',name:'Hired Heist'},
          {role:'Level Designer',name:'Hired Heist'},
          {role:'Systems Designer',name:'Hired Heist'},
          {role:'Balance Engineer',name:'Hired Heist'},
          {role:'Producer',name:'Hired Heist'},
          {role:'Executive Producer',name:'Hired Heist'},
          {role:'QA Lead',name:'Hired Heist'},
          {role:'QA Tester',name:'Hired Heist'},
          {role:'Community Manager',name:'Hired Heist'},
          {role:'Marketing Director',name:'Hired Heist'},
          {role:'Business Development',name:'Hired Heist'},
          {role:'Localization',name:'Hired Heist'},
          {role:'IT Support',name:'Hired Heist'},
          {role:'Catering',name:'Hired Heist'},
          {role:'Tour Bus Driver',name:'Hired Heist'},
          {role:'Guy Who Sleeps in the Van',name:'Hired Heist'},
          {role:'Merch Table',name:'Sly the Fence'},
        ].map((c,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'12px 60px',borderBottom:'1px solid rgba(196,30,58,0.12)'}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--ink-dim)',letterSpacing:2,textTransform:'uppercase',fontWeight:900}}>{c.role}</span>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--ink-bone)',letterSpacing:1,fontWeight:900}}>{c.name}</span>
          </div>
        ))}
        {/* Divider */}
        <div style={{textAlign:'center',padding:'60px 0 40px'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:16}}>⛧ · ✠ · ⛧ · ☥ · ⛧</div>
        </div>
        {/* Special thanks */}
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--gold)',textShadow:'0 0 20px rgba(200,152,56,0.5)',letterSpacing:6}}>Special Thanks</div>
        </div>
        {['The basement venues that let us play','Every band that ever split gas money','The bartenders who looked the other way','Anyone who bought a demo tape out of the van','The guy who loaned us his PA system in \'04','Coffee, beer, and whatever Sly keeps in that stash','Claude — the roadie who never sleeps','You, for descending into Hell with us'].map((t,i)=>(
          <div key={i} style={{textAlign:'center',padding:'8px 0',fontFamily:"'ScratchFont',serif",fontSize:18,color:'var(--ink-dim)',fontStyle:'italic',lineHeight:1.6}}>{t}</div>
        ))}
        {/* Sly quote */}
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'var(--ink-rust)',fontStyle:'italic',lineHeight:1.5}}>
            "Got these off a guy who doesn't need em anymore."
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:3,marginTop:8}}>— SLY THE FENCE</div>
        </div>
        {/* Final title */}
        <div style={{textAlign:'center',padding:'80px 0 400px'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--blood)',textShadow:'0 0 40px rgba(196,30,58,0.6),3px 3px 0 #000',letterSpacing:6}}>Vestibule</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:8,marginTop:12,textTransform:'uppercase'}}>Will Return</div>
        </div>
      </div>
      <style>{`@keyframes creditsScroll{0%{transform:translateX(-50%) translateY(0)}100%{transform:translateX(-50%) translateY(calc(-100% - 1080px))}}`}</style>
    </div>
  )

  // WELCOME TO HELL — choice, cutscene, fight
  if(welcomeToHell==='choice')return(
    <div style={{width:1920,height:1080,position:'relative',background:'#0a0604',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 80%,rgba(40,20,5,0.4),transparent)',pointerEvents:'none'}}/>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:26,color:'#aa8a50',fontStyle:'italic',textAlign:'center',maxWidth:900}}>Your band escaped Hell. But someone is waiting at the gate.</div>
      <div style={{width:200,height:3,background:'linear-gradient(90deg,transparent,#c8a040,transparent)',margin:'8px 0'}}/>
      <div style={{fontSize:80,marginBottom:8}}>🕴</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#c8a060',textAlign:'center',maxWidth:900,lineHeight:1.6,fontStyle:'italic'}}>
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

  if(firstTip)return(
    <div style={{width:1920,height:1080,position:'relative',overflow:'hidden',background:'#040201',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:550,background:'linear-gradient(180deg,#1a1208,#0a0704)',border:'3px solid #e8a820',borderRadius:12,padding:'32px 40px',textAlign:'center',boxShadow:'0 0 60px rgba(232,168,32,0.4)'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'#e8a820',letterSpacing:4,textTransform:'uppercase',marginBottom:12}}>New Mechanic</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'#e8d0a0',lineHeight:1.6,marginBottom:20}}>{firstTip.text}</div>
        <button onClick={()=>setFirstTip(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,color:'#e8a820',background:'rgba(232,168,32,0.15)',border:'2px solid #e8a820',borderRadius:6,padding:'10px 40px',cursor:'pointer',textTransform:'uppercase'}}>Got it</button>
      </div>
    </div>
  )
  if(gameState==='booster')return <BoosterScreen onComplete={startGame} seed={runSeed}/>
  if(gameState==='circleSplash'&&circleSplash)return(
    <div style={{width:1920,height:1080,position:'relative',background:'var(--void)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,overflow:'hidden'}}>
      {/* Ornamental frieze top */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:24,background:'linear-gradient(180deg, rgba(196,30,58,0.45) 0%, transparent 100%)',borderBottom:'1px solid rgba(196,30,58,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:18,textAlign:'center',lineHeight:'24px',textTransform:'uppercase',opacity:0.85,textShadow:'0 0 10px rgba(196,30,58,0.4)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
      {/* Ornamental frieze bottom */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:24,background:'linear-gradient(0deg, rgba(196,30,58,0.45) 0%, transparent 100%)',borderTop:'1px solid rgba(196,30,58,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:18,textAlign:'center',lineHeight:'24px',textTransform:'uppercase',opacity:0.85,textShadow:'0 0 10px rgba(196,30,58,0.4)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
      {/* Vignette */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 30%,rgba(80,0,0,0.55) 100%)',pointerEvents:'none'}}/>
      <div style={{fontSize:140,filter:'drop-shadow(0 0 60px rgba(196,30,58,0.8))',animation:'throb 1.2s ease-in-out infinite'}}>{circleSplash.circleEmoji}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--ink-rust)',letterSpacing:8,textTransform:'uppercase',animation:'fadeIn 0.5s ease',fontWeight:900}}>⛧ Entering ⛧</div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:96,color:'var(--ink-bone)',textShadow:'0 0 40px rgba(196,30,58,0.8),0 0 80px rgba(150,0,0,0.5),0 4px 12px rgba(0,0,0,0.9)',letterSpacing:8,animation:'fadeIn 0.9s ease',textAlign:'center',transform:'rotate(-0.4deg)'}}>Circle {circleSplash.circleName}</div>
      {/* Hand-drawn underline */}
      <svg width="420" height="8" viewBox="0 0 420 8" style={{animation:'fadeIn 1.2s ease'}}>
        <path d="M 8 4 Q 110 1, 210 4 T 412 4" stroke="var(--blood)" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <path d="M 12 6 Q 110 7, 210 6 T 408 6" stroke="var(--blood-deep)" strokeWidth="1" fill="none" opacity="0.5"/>
      </svg>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:26,color:'var(--ink-dim)',fontStyle:'italic',animation:'fadeIn 1.5s ease'}}>"Descend deeper into Hell..."</div>
    </div>
  )
  if(gameState==='event'&&pendingEvent)return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800}}>
      <EventScreen event={pendingEvent} onChoose={handleEventChoice}/>
    </div>
  )

  if(gameState==='descent'&&descentData)return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'radial-gradient(ellipse at 50% 0%, #16090a 0%, #040201 72%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,overflow:'hidden',padding:'36px 20px 26px'}}>
      {/* Frieze top */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:18,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.85,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderBottom:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(180deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
      {/* Spiral staircase SVG (faint) */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0,opacity:0.08}} viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">
        {Array.from({length:18}).map((_,k)=>{
          const angle=(k/18)*Math.PI*5;const scale=1-k/20
          const w=360*scale,x=400-w/2+Math.cos(angle)*20,y=80+k*48
          return <rect key={k} x={x} y={y} width={w} height={14} fill="none" stroke="var(--ink-rust)" strokeWidth="1.2" transform={`rotate(${angle*6},${x+w/2},${y+7})`}/>
        })}
        <path d="M 400 80 Q 380 400, 420 620 T 400 950" stroke="var(--blood-deep)" strokeWidth="1.5" fill="none" opacity="0.55"/>
      </svg>
      {/* Scanline overlay */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,
        background:'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
        opacity:0.45}}/>
      {/* Corruption-like vignette */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,background:'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(60,0,15,0.4) 100%)'}}/>

      {/* HEADER — content container */}
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,marginTop:4}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:'var(--ink-bone)',letterSpacing:8,textShadow:'0 0 28px rgba(196,30,58,0.55), 0 0 60px rgba(120,0,20,0.35), 3px 3px 0 rgba(0,0,0,0.85)',transform:'rotate(-1deg)',textTransform:'uppercase'}}>⛧ The Descent ⛧</div>
        <svg width="540" height="10" viewBox="0 0 540 10">
          <path d="M 10 5 Q 140 2, 270 5 T 530 5" stroke="var(--blood)" strokeWidth="1.4" fill="none" opacity="0.75"/>
          <path d="M 20 7 Q 150 9, 270 7 T 520 7" stroke="var(--blood)" strokeWidth="0.7" fill="none" opacity="0.5"/>
        </svg>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'var(--ink-rust)',fontStyle:'italic',letterSpacing:1,marginTop:6}}>Circle {descentData.circleName} {descentData.circleEmoji}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'var(--ink-dim)',fontStyle:'italic',letterSpacing:0.5,marginTop:2}}>Choose your path. Skipping a fight forfeits its shop.</div>
        {bestRunCircle>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--ink-dim)',letterSpacing:3,marginTop:2,textTransform:'uppercase'}}>Personal Best: Circle {bestRunCircle} {Math.floor(fightIndex/3)+1>bestRunCircle?'✔':''}</div>}
      </div>

      {/* FIGHT CARDS — tarot row */}
      <div style={{position:'relative',zIndex:1,display:'flex',gap:36,marginTop:18,alignItems:'flex-start'}}>
        {descentData.fights.map((enemy,i)=>{
          const isBoss=i===2
          const isSkipped=descentData.skips.includes(i)
          const reward=i===0?descentData.reward1:i===1?descentData.reward2:null
          const canSkip=!isBoss
          const envelopeRot=[-2,1,-3][i]||0
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
            <div key={i} style={{width:300,display:'flex',flexDirection:'column',position:'relative',transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',opacity:isSkipped?0.55:1,transform:isBoss?'scale(1.05)':'none'}}>
              {/* Tarot-style enemy card */}
              <div onClick={isSkipped?undefined:triggerDescend}
                onMouseEnter={e=>{if(isSkipped)return;const tip=e.currentTarget.querySelector('[data-pathtip]');if(tip)tip.style.opacity='1';e.currentTarget.style.transform='translateY(-8px)';e.currentTarget.style.boxShadow=isBoss?'0 20px 60px rgba(196,30,58,0.55), 0 0 40px rgba(196,30,58,0.35), inset 0 0 18px rgba(90,0,10,0.35)':'0 20px 60px rgba(0,0,0,0.9), 0 0 32px rgba(200,152,56,0.55), inset 0 0 12px rgba(120,80,20,0.35)'}}
                onMouseLeave={e=>{const tip=e.currentTarget.querySelector('[data-pathtip]');if(tip)tip.style.opacity='0';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=isBoss?'0 0 24px rgba(196,30,58,0.4), inset 0 0 18px rgba(90,0,10,0.35)':'0 8px 24px rgba(0,0,0,0.75), inset 0 0 12px rgba(60,35,20,0.35)'}}
                style={{position:'relative',
                  background:isBoss?'linear-gradient(180deg,#2a0a0c,#140406)':'linear-gradient(180deg, var(--altar-raised), var(--altar-recess))',
                  border:'2px solid '+(isSkipped?'#44aa44':isBoss?'var(--blood)':'var(--ink-rust)'),
                  outline:'1px solid '+(isSkipped?'rgba(68,170,68,0.4)':isBoss?'rgba(196,30,58,0.45)':'var(--gold-deep)'),
                  outlineOffset:'-5px',
                  borderRadius:6,padding:'16px 20px 18px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,
                  cursor:isSkipped?'default':'pointer',transition:'transform 0.22s, box-shadow 0.22s',
                  boxShadow:isBoss?'0 0 24px rgba(196,30,58,0.4), inset 0 0 18px rgba(90,0,10,0.35)':'0 8px 24px rgba(0,0,0,0.75), inset 0 0 12px rgba(60,35,20,0.35)',
                  animation:isBoss?'bossGlow 2.4s ease-in-out infinite':'none'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,letterSpacing:4,textTransform:'uppercase',color:isSkipped?'#88dd88':isBoss?'var(--blood)':'var(--gold)',textShadow:isBoss?'0 0 12px rgba(196,30,58,0.6)':'none'}}>{isSkipped?'✓ Skipped':isBoss?'⛧ Boss Fight ⛧':'Fight '+(i+1)+' of 3'}</div>
                <div style={{fontSize:56,marginTop:2,filter:isBoss?'drop-shadow(0 0 14px rgba(196,30,58,0.55))':'drop-shadow(0 0 10px rgba(200,152,56,0.3))'}}>{BOSS_PORTRAITS[enemy.id]?<img src={BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:56,height:56,objectFit:'contain',imageRendering:'pixelated'}}/>:enemy.emoji}</div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:isBoss?'var(--blood)':'var(--ink-bone)',textShadow:isBoss?'0 0 18px rgba(196,30,58,0.6)':'0 0 12px rgba(232,216,184,0.3)',letterSpacing:2,textAlign:'center'}}>{enemy.name}</div>
                <svg width="220" height="8" viewBox="0 0 220 8">
                  <path d="M 8 4 Q 60 1, 110 4 T 212 4" stroke={isBoss?'var(--blood)':'var(--gold)'} strokeWidth="1.1" fill="none" opacity="0.7"/>
                </svg>
                {/* HP parchment scroll */}
                <div style={{position:'relative',padding:'4px 18px',background:'linear-gradient(180deg, rgba(60,35,10,0.6), rgba(30,18,5,0.75))',border:'1px solid var(--gold-deep)',borderRadius:3,
                  boxShadow:'inset 0 0 8px rgba(0,0,0,0.5)'}}>
                  <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--gold)',letterSpacing:2}}>{Math.ceil(enemy.maxHp*activeStake.hpMult)} HP</span>
                </div>
                {isSkipped&&reward&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:15,color:'#88dd88',marginTop:2,fontStyle:'italic',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>{reward.emoji==='🌿'?<WeedLeaf size={18}/>:reward.emoji} {reward.name}</div>}
                {/* Select-this-path tooltip */}
                {!isSkipped&&<div data-pathtip="" style={{position:'absolute',bottom:-22,left:'50%',transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',opacity:0,transition:'opacity 0.18s',pointerEvents:'none',whiteSpace:'nowrap',textShadow:'0 0 10px rgba(200,152,56,0.8)'}}>↓ Select This Path</div>}
              </div>

              {/* WAX-SEAL ENVELOPE — skip reward */}
              {canSkip&&!isSkipped&&reward&&(
                <div onClick={(e)=>{e.stopPropagation();setDescentData(p=>({...p,skips:[...p.skips,i]}))}}
                  style={{position:'relative',marginTop:10,
                    transform:'rotate('+envelopeRot+'deg)',
                    background:'linear-gradient(180deg,#1c2a10,#0c1808)',
                    border:'2px solid rgba(120,170,80,0.65)',borderRadius:'3px 3px 10px 10px',
                    padding:'10px 16px 14px',cursor:'pointer',textAlign:'center',
                    boxShadow:'0 8px 18px rgba(0,0,0,0.7), inset 0 0 12px rgba(40,60,20,0.4)',transition:'transform 0.2s, box-shadow 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='rotate(0deg) translateY(-4px)';e.currentTarget.style.boxShadow='0 14px 26px rgba(0,0,0,0.8), 0 0 18px rgba(120,200,60,0.35), inset 0 0 12px rgba(40,60,20,0.4)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='rotate('+envelopeRot+'deg)';e.currentTarget.style.boxShadow='0 8px 18px rgba(0,0,0,0.7), inset 0 0 12px rgba(40,60,20,0.4)'}}>
                  {/* Wax seal dot */}
                  <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',width:26,height:26,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%, #d83030, #8a0818 60%, #4a0610)',border:'1px solid rgba(0,0,0,0.7)',boxShadow:'0 2px 4px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,150,140,0.3)',fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:'rgba(30,5,5,0.85)',display:'flex',alignItems:'center',justifyContent:'center'}}>⛧</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',marginTop:4}}>Skip & Take Reward</div>
                  <div style={{fontFamily:"'ScratchFont',serif",fontSize:15,color:'var(--ink-bone)',fontStyle:'italic',marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>{reward.emoji==='🌿'?<WeedLeaf size={18}/>:reward.emoji} {reward.name}</div>
                  <div style={{fontFamily:"'ScratchFont',serif",fontSize:11,color:'var(--ink-dim)',fontStyle:'italic',marginTop:3,lineHeight:1.3}}>{REWARD_TIPS[reward.id]||''}</div>
                </div>
              )}
              {canSkip&&isSkipped&&(
                <div onClick={(e)=>{e.stopPropagation();setDescentData(p=>({...p,skips:p.skips.filter(s=>s!==i)}))}}
                  style={{marginTop:10,transform:'rotate('+envelopeRot+'deg)',
                    background:'rgba(40,80,20,0.15)',border:'2px solid rgba(120,170,80,0.5)',borderRadius:'3px 3px 10px 10px',padding:'8px 16px',cursor:'pointer',textAlign:'center'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(80,40,20,0.3)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(40,80,20,0.15)'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'var(--ink-dim)',letterSpacing:2,textTransform:'uppercase'}}>Undo Skip</div>
                </div>
              )}
              {isBoss&&(
                <div onClick={triggerDescend}
                  style={{marginTop:10,
                    background:'rgba(130,0,0,0.4)',border:'2px solid var(--blood)',borderRadius:'3px 3px 10px 10px',padding:'12px 16px',textAlign:'center',cursor:'pointer',transition:'all 0.2s',boxShadow:'0 0 18px rgba(196,30,58,0.4)'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,0,0,0.55)';e.currentTarget.style.boxShadow='0 0 34px rgba(196,30,58,0.75)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(130,0,0,0.4)';e.currentTarget.style.boxShadow='0 0 18px rgba(196,30,58,0.4)'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--ink-bone)',letterSpacing:4,textShadow:'0 0 14px rgba(196,30,58,0.75)'}}>⛧ DESCEND ⛧</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Frieze bottom */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:18,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.7,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderTop:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(0deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
    </div>
  )
  if(gameState==='pact')return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,overflow:'hidden'}}>
      {/* Smoke/fog layers */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 60%, rgba(200,140,20,0.06) 0%, transparent 60%)',animation:'pactSmoke1 8s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 70% 40%, rgba(200,140,20,0.04) 0%, transparent 50%)',animation:'pactSmoke2 6s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:'#e8a820',textShadow:'0 0 40px rgba(200,140,0,0.6),0 0 80px rgba(150,100,0,0.3),3px 3px 0 #000',letterSpacing:8,animation:'fadeSlideUp 0.6s ease-out'}}>⛧ The Pact ⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'#aa9060',fontStyle:'italic',animation:'fadeSlideUp 0.6s ease-out 0.2s both'}}>Choose your reward. The other is lost to the Void.</div>
      <div style={{display:'flex',gap:40,marginTop:16}}>
        {pactChoices.filter(Boolean).map((pact,pi)=>(
          <div key={pact.id} style={{animation:'fadeSlideUp 0.5s ease-out '+(0.3+pi*0.15)+'s both'}} onClick={()=>{
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
    const allDeckCards=[...deck,...hand,...discardPile]
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
            setHand(p=>p.map(dc=>dc.id===c.id?Object.assign({},dc,{upgraded:true,name:(dc.name||'').replace(/\+$/,'')+'+'}):dc))
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
  if(victorySummary)return <VictorySummaryScreen summary={victorySummary} onContinue={continueVictorySummary}/>
  if(demonicConflict)return <DemonicConflictScreen conflict={demonicConflict} onChoice={handleDemonicChoice}/>
  if(gameState==='recruit')return <RecruitScreen candidates={recruitCandidates} stage={stage} onPick={handleRecruitPick} onPass={handleRecruitPass} onFireMember={handlePawnSellMember} stash={stash}/>
  if(gameState==='shop')return <ShopScreen stash={stash} onSpend={handleShopSpend} corruption={corruption} chosenPacts={chosenPacts} addLog={addLog} onLeave={handleShopLeave} circleArtifact={circleArtifact} circlePassive={circlePassive} recruitPack={recruitPack} shopCards={shopCards} boosterPacks={boosterPacks} rerollCost={rerollCost} onReroll={handleReroll} fightIndex={fightIndex} activeArtifacts={activeArtifacts} activePassives={activePassives} starterArtifacts={STARTER_ARTIFACTS} starterPassives={STARTER_PASSIVES} stage={stage} deck={deck} discardPile={discardPile} onPawnSellMember={handlePawnSellMember} onPawnSellCard={handlePawnSellCard} onPawnBurnCard={handlePawnBurnCard} soldIds={shopSoldIds} onMarkSold={(id)=>setShopSoldIds(p=>[...p,id])} circleCartBought={circleCartBought} circleCpasBought={circleCpasBought} onBuyCart={()=>setCircleCartBought(true)} onBuyCpas={()=>setCirCleCpasBought(true)} heldShrooms={heldShrooms} heldAcid={heldAcid} shroomsInStock={shroomsInStock} acidInStock={acidInStock} onBuyShrooms={()=>setHeldShrooms(p=>p+1)} onBuyAcid={()=>setHeldAcid(p=>p+1)}/>
  if(gameState==='end')return <div style={{width:1920,height:1080,position:'relative',overflow:'hidden'}}><EndScreen won={won} cause={deathCause} fullRunLog={fullRunLogRef.current} newTrophies={newTrophies} enemy={enemy} stats={stats} seed={runSeed} onReset={handleReset} streakWins={streakWins} streakLosses={streakLosses} totalRuns={totalRunsPlayed} isDailyRun={isDailyRun} chosenPacts={chosenPacts} onDailyChallenge={()=>{setRunSeed(getDailySeed());setIsDailyRun(true);handleReset()}} personalBest={personalBest} dailyStreak={dailyStreak} lifetimeScore={lifetimeScore} discovered={discovered} newAchievements={newAchievements} enemyHp={enemyHp} stage={stage} runElapsed={Math.floor((Date.now()-runStartTimeRef.current)/1000)}/></div>

  return(
    <div key={'play-'+fightIndex} className="page-transition-in" style={{width:1920,height:1080,display:'flex',flexDirection:'column',background:`${(()=>{const cn=Math.floor(fightIndex/3)+1;const ct=CIRCLE_BG[cn]||CIRCLE_BG[1];return 'radial-gradient(ellipse at 50% 20%, '+ct.glow+', '+ct.base+')'})()}`,overflow:'hidden',position:'relative',userSelect:'none',transform:shakeOffset.x||shakeOffset.y?`translate(${shakeOffset.x}px,${shakeOffset.y}px)`:'none'}}>

      {/* ═══ CORRUPTION VIGNETTE — dark blood edges ═══ */}
      {corruption>15&&<div style={{position:'absolute',inset:0,zIndex:1,pointerEvents:'none',
        background:`radial-gradient(ellipse at 50% 50%, transparent ${corruption>=75?'20%':corruption>=50?'35%':'50%'}, rgba(${corruption>=75?'80,0,10':corruption>=50?'60,0,15':'40,0,10'},${corruption>=75?'0.45':corruption>=50?'0.25':'0.12'}) 100%)`,
        transition:'background 2s ease',
        animation:corruption>=75?'vignettePulse 3s ease-in-out infinite':'none'}}/>}
      {/* ═══ CORRUPTION TUBE — mercury ritual vessel, right edge ═══ */}
      {corruption>0&&tutorialFight!==1&&
      <div style={{position:'absolute',right:14,top:20,bottom:360,width:56,zIndex:50,display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
        {/* Percentage stamp at top */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,fontWeight:900,
          color:corruption>=75?'var(--blood)':corruption>=50?'#c41e3a':'var(--gold)',
          textShadow:corruption>=75?'0 0 12px rgba(196,30,58,0.8)':'0 0 8px rgba(200,152,56,0.4)',
          marginBottom:6,letterSpacing:2}}><span key={'c-'+corruption} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{corruption}%</span></div>

        {/* Tube cap — top */}
        <div style={{width:30,height:6,background:'linear-gradient(180deg, var(--ink-rust), var(--altar))',border:'1px solid var(--blood-deep)',borderBottom:'none',borderRadius:'3px 3px 0 0',zIndex:4}}/>

        {/* Tube body */}
        <div style={{flex:1,width:26,background:'linear-gradient(90deg, rgba(10,5,8,0.95), rgba(20,8,12,0.9), rgba(10,5,8,0.95))',
          border:'1px solid '+(corruption>=75?'var(--blood)':corruption>=50?'rgba(196,30,58,0.55)':'var(--ink-rust)'),
          borderRadius:3,overflow:'hidden',position:'relative',
          boxShadow:corruption>=75?'0 0 20px rgba(196,30,58,0.5), inset 0 0 12px rgba(100,0,20,0.4)':corruption>=50?'0 0 10px rgba(196,30,58,0.25), inset 0 0 8px rgba(0,0,0,0.6)':'inset 0 0 6px rgba(0,0,0,0.7)',
          transition:'border-color 0.5s, box-shadow 0.5s'}}>
          {/* Rune etchings down the tube (SVG) */}
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:6,opacity:0.3}}>
            <text x="50%" y="15%" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="10" fill="var(--ink-bone)">⛧</text>
            <text x="50%" y="35%" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="10" fill="var(--ink-bone)">✠</text>
            <text x="50%" y="55%" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="10" fill="var(--ink-bone)">⛧</text>
            <text x="50%" y="75%" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="10" fill="var(--ink-bone)">✠</text>
            <text x="50%" y="95%" textAnchor="middle" fontFamily="MBScribblesFont" fontSize="10" fill="var(--ink-bone)">⛧</text>
          </svg>
          {/* Threshold markers */}
          {[25,50,75].map(t=><div key={t} style={{position:'absolute',left:-3,right:-3,bottom:t+'%',height:1,
            background:corruption>=t?'var(--blood)':'rgba(90,56,32,0.3)',zIndex:3}}>
            <div style={{position:'absolute',right:'100%',top:-8,fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:900,
              color:corruption>=t?'var(--blood)':'var(--rot)',textShadow:'0 0 4px rgba(0,0,0,0.9)',paddingRight:6,whiteSpace:'nowrap'}}>
              {t===25?'⚠':t===50?'🔥':'💀'}
            </div>
          </div>)}
          {/* Mercury fill — rises from bottom with meniscus curve at top */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,
            height:Math.min(100,corruption)+'%',
            transition:'height 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
            background:corruption>=100?'linear-gradient(0deg,#440022,#c41e3a,#ff4466)':corruption>=75?'linear-gradient(0deg,#330018,#a41528,#c41e3a)':corruption>=50?'linear-gradient(0deg,#220010,#7a0f1f,#a41528)':corruption>=25?'linear-gradient(0deg,#1a000a,#550022,#7a0f1f)':'linear-gradient(0deg,#110005,#330011,#550022)',
            boxShadow:corruption>=75?'0 0 12px rgba(196,30,58,0.7), inset 0 -8px 16px rgba(196,30,58,0.4)':corruption>=50?'0 0 6px rgba(196,30,58,0.3)':'none'}}>
            {/* Meniscus curve — top edge of fill */}
            <div style={{position:'absolute',top:-2,left:0,right:0,height:4,background:'radial-gradient(ellipse at center top, rgba(255,100,140,0.6), transparent 60%)',borderRadius:'50% 50% 0 0'}}/>
          </div>
        </div>

        {/* Tube cap — bottom with bulbous reservoir */}
        <div style={{width:36,height:16,marginTop:-1,background:'radial-gradient(ellipse at 50% 30%, '+(corruption>=50?'#a41528':'var(--altar-raised)')+', var(--altar))',border:'1px solid '+(corruption>=75?'var(--blood)':'var(--blood-deep)'),borderTop:'none',borderRadius:'3px 3px 50% 50%',zIndex:4,boxShadow:corruption>=75?'0 0 16px rgba(196,30,58,0.6)':'none'}}/>

        {/* Active threshold label at bottom */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,fontWeight:900,marginTop:6,textAlign:'center',
          color:corruption>=100?'var(--blood)':corruption>=75?'var(--blood)':corruption>=50?'#c41e3a':corruption>=25?'var(--ink-rust)':'transparent',
          textShadow:corruption>=50?'0 0 6px rgba(196,30,58,0.6)':'none',letterSpacing:2,lineHeight:1.2,textTransform:'uppercase'}}>
          {corruption>=100?'☠ Possessed':corruption>=75?'Madness':corruption>=50?'Hunger':corruption>=25?'Whispers':''}
        </div>
      </div>}

            {enemyHp>0&&enemyHp<scaledMaxHp*0.10&&<div style={{position:'absolute',inset:0,zIndex:8000,pointerEvents:'none',animation:'fracture 0.4s ease-in-out infinite',mixBlendMode:'screen',background:'linear-gradient(${Math.random()*360}deg,transparent 45%,rgba(255,0,0,0.1) 50%,transparent 55%)'}}/>}
      {enemyHp>0&&enemyHp<enemy.maxHp*0.20&&<div style={{position:'absolute',inset:0,zIndex:7998,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 50%,rgba(180,0,0,0.2) 100%)',animation:'bossUrgency 0.6s ease-in-out infinite alternate'}}/>}
      {chainFlashActive&&<div style={{position:'absolute',inset:0,zIndex:8400,pointerEvents:'none',background:'radial-gradient(circle at 50% 50%,rgba(255,220,50,0.3),rgba(200,150,0,0.1),transparent)',animation:'chainFlash 0.6s ease-out forwards'}}/>}
      {damageFlash&&<div style={{position:'absolute',inset:0,zIndex:8500,pointerEvents:'none',background:'radial-gradient(ellipse at center,rgba(200,0,0,0.25),rgba(100,0,0,0.4))',animation:'flashFade 0.4s ease-out forwards'}}/>}
      {corruptHigh&&!corruptMax&&<div style={{position:'absolute',inset:0,zIndex:7999,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 40%,rgba(100,0,0,0.15) 100%)',animation:bgPulseAnim}}/>}
      {corruption>=80&&<div style={{position:'absolute',inset:0,zIndex:8001,pointerEvents:'none',
        background:'radial-gradient(ellipse at center,transparent 30%,rgba(160,0,0,0.25) 100%)',
        animation:'corruptionGlitch 3s linear infinite',
        boxShadow:'inset 0 0 120px rgba(120,0,0,0.3)'}}/>}
      {corruption>=80&&corruption<100&&<div style={{position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',zIndex:8002,pointerEvents:'none',
        fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,letterSpacing:6,textTransform:'uppercase',
        color:'rgba(255,0,0,0.6)',textShadow:'0 0 8px rgba(255,0,0,0.4)',
        animation:'corruptionGlitch 2s linear infinite'}}>
        ⚠ THE DARKNESS CONSUMES ⚠
      </div>}
      {corruptMax&&<div style={{position:'absolute',inset:0,zIndex:7999,pointerEvents:'none',background:'radial-gradient(ellipse at center,transparent 20%,rgba(140,0,0,0.3) 100%)',animation:'bgPulse 1s ease-in-out infinite'}}/>}
      {flyingCard&&(()=>{
        const fc=flyingCard
        const bc=fc.type==='RIFF'?'#9933cc':fc.type==='CORRUPT'?'#aa1111':fc.type==='UTILITY'?'#22aa44':'#c87820'
        return <div key={fc.key} style={{
          position:'absolute',left:fc.toX,top:fc.toY,
          transform:'translate(-50%,-50%) scale(0.15)',opacity:0,
          width:160,height:220,
          background:'linear-gradient(180deg,#201408,#100804)',
          border:'3px solid '+bc,borderRadius:8,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
          zIndex:9000,pointerEvents:'none',
          boxShadow:'0 0 30px '+bc+',0 0 60px '+bc+'44',
          animation:'cardFlyIn 0.4s cubic-bezier(0.2,0.8,0.3,1) forwards'
        }}>
          <div style={{fontSize:48}}>{fc.emoji}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:'#eedfc0',textAlign:'center',letterSpacing:0.5}}>{fc.name}</div>
          <div style={{fontSize:8,fontWeight:900,color:bc,letterSpacing:2,textTransform:'uppercase'}}>{fc.type}</div>
        </div>
      })()}
      {floats.filter(Boolean).map(f=><Float key={f.id} v={f.v} x={f.x} y={f.y} color={f.color} big={f.big} onDone={()=>remFloat(f.id)}/>)}
      {vfxParticles.map(p=><div key={p.id} className="vfx-particle" style={{left:p.x,top:p.y,width:p.size,height:p.size,background:p.color,boxShadow:'0 0 '+(p.size*2)+'px '+p.color,animation:'vfxDrift '+p.dur+'ms ease-out forwards','--vfx-dx':p.dx+'px','--vfx-dy':p.dy+'px'}}/>)}
      {/* ACHIEVEMENT POLAROID — slides in from right */}
      {polaroidNotif&&<div style={{position:'absolute',top:120,right:40,zIndex:9800,animation:'polaroidSlide 3.5s ease-in-out forwards',pointerEvents:'none'}}>
        <div style={{width:220,background:'#f5f0e8',padding:'12px 12px 40px',borderRadius:2,boxShadow:'0 8px 40px rgba(0,0,0,0.8),0 0 20px rgba(200,152,56,0.3)',transform:'rotate(-3deg)'}}>
          <div style={{background:'linear-gradient(180deg,#1a1008,#0a0604)',width:'100%',height:140,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:1}}>
            <span style={{fontSize:64}}>{polaroidNotif.emoji}</span>
          </div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'#2a1a0a',textAlign:'center',marginTop:12,fontStyle:'italic',lineHeight:1.3,fontWeight:700}}>{polaroidNotif.label}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'#8a7040',textAlign:'center',marginTop:4,letterSpacing:3,textTransform:'uppercase'}}>Achievement Unlocked</div>
        </div>
      </div>}
      {projectiles.filter(Boolean).map(p=><Projectile key={p.id} from={p.from} to={p.to} emoji={p.emoji} onDone={()=>setProjectiles(prev=>prev.filter(x=>x.id!==p.id))} isBoss={p.isBoss}/>)}
      {dmgBreakdown&&<DamageBreakdown data={dmgBreakdown} onDone={()=>setDmgBreakdown(null)}/>}

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
      {beastFlash&&<div style={{position:'absolute',top:'30%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9700,textAlign:'center',pointerEvents:'none'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'#ff0000',textShadow:'0 0 40px rgba(255,0,0,0.9),0 0 80px rgba(200,0,0,0.6),-3px 0 rgba(255,0,0,0.5),3px 0 rgba(200,0,0,0.5),3px 3px 0 #000',letterSpacing:6,animation:'throb 0.4s ease-in-out infinite'}}>⛧ 6.66 ⛧</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#ff4444',letterSpacing:8,textTransform:'uppercase',marginTop:4,textShadow:'0 0 20px rgba(255,0,0,0.7)'}}>MARK OF THE BEAST</div>
      </div>}
      {/* BEAST TIER ENTRY (3.0+) — red radial pulse + center text */}
      {beastTierFlash&&<>
        <div style={{position:'fixed',inset:0,zIndex:9000,pointerEvents:'none',background:'radial-gradient(ellipse at center, transparent 25%, rgba(196,30,58,0.55) 100%)',animation:'beastPulse 0.7s ease-out forwards'}}/>
        <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9100,pointerEvents:'none',textAlign:'center'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'#fff',textShadow:'0 0 30px var(--blood),0 0 60px rgba(196,30,58,0.7),3px 3px 0 #000',letterSpacing:8,animation:'popFloat 0.7s ease-out forwards'}}>⛧ BEAST UNLEASHED ⛧</div>
        </div>
      </>}
      
      {showCombatLog&&<CombatLogViewer log={fullRunLogRef.current} onClose={()=>setShowCombatLog(false)}/>}
      {corruptionFlash&&<div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9600,textAlign:'center',animation:'fadeIn 0.3s ease',pointerEvents:'none'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:42,color:corruptionFlash.color,textShadow:'0 0 30px '+corruptionFlash.color+',0 0 60px rgba(200,0,60,0.5),2px 2px 0 #000',letterSpacing:4}}>⚠ {corruptionFlash.name} ⚠</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'#cc8899',marginTop:6,textShadow:'0 0 10px rgba(0,0,0,0.9)'}}>{corruptionFlash.desc}</div>
      </div>}
      {clutchFlash&&<div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9250,pointerEvents:'none',fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:clutchFlash.color,textShadow:'0 0 40px '+clutchFlash.color+',0 0 80px '+clutchFlash.color+'66,4px 4px 0 #000',letterSpacing:8,animation:'popFloat 2.5s ease-out forwards',textAlign:'center'}}>{clutchFlash.text}</div>}
      {/* BOSS HP MILESTONE FLASH */}
      {milestoneFlash&&<div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9200,pointerEvents:'none',fontFamily:"'BogartsMetalFont',cursive",fontSize:90,color:milestoneFlash.color,textShadow:'0 0 40px '+milestoneFlash.color+',0 0 80px '+milestoneFlash.color+'66,4px 4px 0 #000',letterSpacing:10,animation:'popFloat 1.8s ease-out forwards'}}>{milestoneFlash.text}</div>}
      {/* DECK / DISCARD VIEWER */}
      {(deckViewOpen||discardViewOpen)&&<div style={{position:'absolute',inset:0,zIndex:9600,background:'rgba(2,1,4,0.95)',display:'flex',flexDirection:'column',alignItems:'center',padding:'30px 40px',overflowY:'auto'}} onClick={()=>{setDeckViewOpen(false);setDiscardViewOpen(false)}}>
        <div onClick={e=>e.stopPropagation()} style={{maxWidth:1200,width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:36,fontWeight:900,color:deckViewOpen?'#c8a040':'#cc4444',textShadow:'0 0 20px '+(deckViewOpen?'rgba(200,160,40,0.4)':'rgba(200,40,40,0.4)')}}>{deckViewOpen?'⛧ Deck — '+deck.length+' Cards':'⛧ Discard Pile — '+discardPile.length+' Cards'}</div>
            <div onClick={()=>{setDeckViewOpen(false);setDiscardViewOpen(false)}} style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'#cc4444',cursor:'pointer',padding:'6px 16px',border:'1px solid #aa2222',borderRadius:4}}>✕ Close</div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            {deckViewOpen?
              /* DECK VIEW: 4 columns by type */
              <div style={{display:'flex',gap:20,justifyContent:'center',width:'100%'}}>
                {['RIFF','CORRUPT','UTILITY','EMBER'].map(type=>{
                  const typeCards=[...deck].filter(c=>c.type===type).sort((a,b)=>(a.name||'').localeCompare(b.name||''))
                  const bc=type==='CORRUPT'?'#aa1111':type==='UTILITY'?'#22aa44':type==='EMBER'?'#c87820':'#9933cc'
                  return <div key={type} style={{flex:1,minWidth:200,maxWidth:280}}>
                    <div style={{textAlign:'center',marginBottom:10,padding:'6px 0',borderBottom:'2px solid '+bc+'66'}}>
                      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:bc,letterSpacing:3}}>{type}</div>
                      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,fontWeight:900,color:bc,opacity:0.7}}>{typeCards.length}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {typeCards.map((c,i)=><div key={c.uid||i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'rgba(10,6,2,0.6)',borderRadius:4,borderLeft:'3px solid '+bc+'66'}}>
                        <span style={{fontSize:18}}>{c.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:700,color:'#eedfc0'}}>{c.name}{c.upgraded?' ⛧':''}</div>
                          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#887755'}}>{c.rarity}{c.embers>0?' · '+c.embers+'🔥':' · FREE'}</div>
                        </div>
                      </div>)}
                      {typeCards.length===0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:13,color:'#554433',fontStyle:'italic',padding:8}}>none</div>}
                    </div>
                  </div>
                })}
              </div>
            :
              /* DISCARD VIEW: chronological list */
              (discardPile).filter(Boolean).map((c,i)=>{
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
      {comboFlash&&<div style={{position:'absolute',inset:0,zIndex:9600,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:0,animation:'chainGlow 3s ease forwards'}}>
        {/* Full-screen dark overlay */}
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',animation:'chainGlow 3s ease forwards'}}/>
        {/* Color wash — intense */}
        <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at center, ${comboFlash.color}44 0%, ${comboFlash.color}22 30%, transparent 65%)`,animation:'chainGlow 3s ease forwards'}}/>
        {/* Border glow — thick, pulsing */}
        <div style={{position:'absolute',inset:0,border:`6px solid ${comboFlash.color}`,boxShadow:`inset 0 0 150px ${comboFlash.color}44,0 0 80px ${comboFlash.color}55,0 0 200px ${comboFlash.color}22`,animation:'chainGlow 3s ease forwards'}}/>
        {/* Horizontal banner — wider, more visible */}
        <div style={{position:'absolute',left:0,right:0,top:'28%',height:280,background:`linear-gradient(180deg, transparent, ${comboFlash.color}18 15%, ${comboFlash.color}30 50%, ${comboFlash.color}18 85%, transparent)`,animation:'chainGlow 3s ease forwards'}}/>
        {/* Chain emoji — MASSIVE, slams in */}
        <div style={{fontSize:120,filter:`drop-shadow(0 0 60px ${comboFlash.color})`,animation:'chainSlam 3s ease forwards',zIndex:1,marginBottom:0}}>{comboFlash.emoji}</div>
        {/* RIFF CHAIN title — screen-wide */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:96,color:comboFlash.color,textShadow:`0 0 60px ${comboFlash.color},0 0 120px ${comboFlash.color}88,-4px 0 rgba(255,0,0,0.5),4px 0 rgba(0,80,255,0.4),4px 4px 0 #000`,letterSpacing:14,animation:'chainSlam 3s ease forwards',zIndex:1}}>⛧ RIFF CHAIN ⛧</div>
        {/* Chain name — BIG */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:Math.min(96,48+Math.floor((comboFlash.mult||1)*12)),color:'#fff',textShadow:`0 0 40px ${comboFlash.color},0 0 80px ${comboFlash.color}88,4px 4px 0 #000`,letterSpacing:10,animation:'chainSlam 3s ease forwards',zIndex:1,marginTop:4}}>{comboFlash.name}</div>
        {/* Card combo — the recipe */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:comboFlash.color,letterSpacing:4,marginTop:10,animation:'chainSlam 3s ease forwards',zIndex:1,textShadow:`0 0 20px ${comboFlash.color},2px 2px 0 #000`}}>{comboFlash.card1}  +  {comboFlash.card2}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:Math.min(42,20+Math.floor((comboFlash.mult||1)*6)),fontWeight:900,color:'#ffd700',letterSpacing:6,marginTop:6,animation:'chainSlam 3s ease forwards',zIndex:1,textShadow:'0 0 20px rgba(255,200,0,0.8),2px 2px 0 #000'}}>×{(comboFlash.mult||1).toFixed(2)} DAMAGE</div>
        {/* Multiplier — THE money shot, biggest element */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:80,fontWeight:900,color:'#fff',textShadow:`0 0 40px ${comboFlash.color},0 0 80px rgba(255,200,0,0.6),0 0 120px ${comboFlash.color}44,4px 4px 0 #000`,letterSpacing:6,marginTop:12,animation:'chainSlam 3s ease forwards',zIndex:1}}>×{comboFlash.mult?.toFixed(2)||'1.78'}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:comboFlash.color,letterSpacing:8,textTransform:'uppercase',marginTop:4,zIndex:1,textShadow:'0 0 15px rgba(0,0,0,0.95)',animation:'chainSlam 3s ease forwards'}}>STRIKE MULTIPLIER</div>
      </div>}
      {/* CIRCLE CLEARED FLASH */}

      {circleClearedData&&<div style={{position:'absolute',inset:0,zIndex:9750,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:0,background:'rgba(0,0,0,0.94)',animation:'fadeIn 0.3s ease'}}>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',opacity:0.06}}>
          <img src={import.meta.env.BASE_URL+"vestibule_logo.png"} alt="" style={{width:864,height:864,objectFit:'contain'}}/>
        </div>
        <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <div style={{fontSize:100,filter:'drop-shadow(0 0 30px rgba(200,0,0,0.6))',animation:'throb 0.6s ease-in-out infinite'}}>{circleClearedData.bossId&&BOSS_PORTRAITS[circleClearedData.bossId]?<img src={BOSS_PORTRAITS[circleClearedData.bossId]} alt={circleClearedData.bossName} style={{width:100,height:100,objectFit:'contain',imageRendering:'pixelated'}}/>:circleClearedData.bossEmoji}</div>
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
      {/* BATTLE AREA — unified dark zone */}
      <div style={{flex:1,margin:'0',position:'relative',overflow:'visible',zIndex:10,background:'transparent',border:'none',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'10px 16px 4px',position:'relative',zIndex:bossStrikeAnim?300:5,display:'flex',justifyContent:'center',flexShrink:0,overflow:'visible'}}>
          <div style={{width:'100%',maxWidth:1000,padding:'0',overflow:bossStrikeAnim?'visible':'hidden',position:'relative',zIndex:bossStrikeAnim?300:1}}>
            {(()=>{
              // ── BOSS TELEGRAPH — compute expected next-strike damage + targeting ──
              let telegraph=null
              if(enemy&&enemyHp>0&&gameState==='playing'){
                const base=enemy.baseDmg+(activeStake.dmgAdd||0)
                let dmg=base,target='random',special=null
                const pid=enemy.passiveId||''
                if(pid.startsWith('targetHighestHp'))target='strongest'
                if(pid==='luciferBoss'&&luciferPhase===2)target='ALL'
                if(pid==='selfbuff')dmg=base+(strikesLeft||0)
                else if(pid==='selfbuff2')dmg=base+((activeStake.maxStrikes||4)-(strikesLeft||0))*2
                else if(pid==='rageScale1')dmg=base+stage.filter(m=>m&&(m.buffCount||0)>0).length
                else if(pid==='rageScale2')dmg=base+stage.filter(m=>m&&(m.buffCount||0)>0).length*2
                else if(pid==='soulThief'){dmg=base+(stolenAtkPool||0);special='steals ATK'}
                else if(pid==='luciferBoss'||pid.startsWith('damageScaleAtk'))dmg=base+(bossRageAtk||0)
                if(pid==='corruptPlayer'||pid==='corruptPlayer10tut')special='+10% corrupt'
                else if(pid==='corruptPlayer15')special='+15% corrupt'
                else if(pid==='corruptPlayer20')special='+20% corrupt'
                else if(pid==='stashSteal')special='steals 1🌿'
                else if(pid==='stashSteal2')special='steals 2🌿'
                else if(pid==='stashSteal3')special='steals 3🌿'
                if(chosenPacts.includes('stone_wall'))dmg=Math.max(1,dmg-1)
                dmg=Math.max(1,dmg-(bossDebuff||0))
                if(corruption>=100)dmg+=3
                if(fightTripBuff==='ASTRAL PROJECTION'){dmg=0;special='BLOCKED'}
                telegraph={dmg,target,special}
              }
              return <BossSection enemy={enemy} bossStrikeAnim={bossStrikeAnim} currentHp={enemyHp} scaledMaxHp={scaledMaxHp} isWiggling={isWiggling} innerRef={bossRef} debuff={bossDebuff} chromaStr={chromaStr} dblRoll={dblRoll} luciferPhase={luciferPhase} telegraph={telegraph}/>
            })()}
          </div>
        </div>
        <div style={{position:'relative',zIndex:8,overflow:'visible',flex:1,display:'flex',flexDirection:'column',justifyContent:'center',overflow:'visible'}}>
          <div style={{display:'flex',alignItems:'center',gap:stage.length>5?16:50,padding:stage.length>5?'0px 10px 0px 100px':'0px 10px 0px 130px',justifyContent:'center',flex:1,position:'relative'}}>
            <div style={{display:'flex',flexDirection:'column',gap:8,alignSelf:'center',flexShrink:0,background:'rgba(0,0,0,0.22)',borderRadius:'0 6px 6px 0',padding:'8px 10px 8px 10px',borderRight:'1px solid rgba(140,90,20,0.35)',position:'absolute',left:0,top:'50%',transform:'translateY(-50%)'}}>
              {[0,1,2].map(i=>{const a=(activeArtifacts||[])[i];return(
                <div key={i} style={{position:'relative'}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-artip]');if(t)t.style.opacity='1'}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-artip]');if(t)t.style.opacity='0'}}>
                  {a?<div style={{width:80,height:105,border:'1px solid rgba(200,140,30,0.65)',borderRadius:5,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,background:'linear-gradient(180deg,rgba(40,24,6,0.95),rgba(20,12,3,0.95))',boxShadow:'0 0 10px rgba(200,140,20,0.25)',cursor:'help'}}><div style={{fontSize:22}}>{a.emoji}</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:6,letterSpacing:0.5,color:'#c8a040',textTransform:'uppercase',textAlign:'center',lineHeight:1.2,padding:'0 3px'}}>{a.name}</div></div>
                  :<div style={{width:80,height:105,border:'1px dashed rgba(200,160,50,0.32)',borderRadius:5,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,background:'rgba(30,18,4,0.65)'}}><div style={{fontSize:52,opacity:0.35,textShadow:'0 0 12px rgba(255,180,0,0.4)'}}>⛧</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:7,letterSpacing:1,color:'rgba(200,160,60,0.45)',textTransform:'uppercase',textAlign:'center',lineHeight:1.2}}>Artifact</div></div>}
                  {a&&<div data-artip="" style={{opacity:0,transition:'opacity 0.15s',position:'absolute',left:88,top:0,zIndex:99999,pointerEvents:'none',minWidth:200,maxWidth:280,background:'rgba(12,7,2,0.97)',border:'1px solid rgba(200,140,30,0.6)',borderRadius:6,padding:'8px 10px',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:10,fontWeight:700,color:'#e8c060',marginBottom:4}}>{a.emoji} {a.name}</div>
                    <div style={{fontFamily:"'ScratchFont',serif",fontSize:9,color:'#9a8050',fontStyle:'italic',lineHeight:1.4}}>{a.effect}</div>
                    {a.mult&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#ff8800',marginTop:4}}>×{a.mult} MULTIPLIER</div>}
                    {(()=>{const SYNERGIES={a1:['a10'],a10:['a1'],a2:['a6'],a6:['a2'],a5:['a1','a10'],a9:['a5'],ca1:['a1','a2','a10']}
                      const syns=(SYNERGIES[a.id]||[]).map(sid=>activeArtifacts.find(x=>x.id===sid)).filter(Boolean)
                      if(syns.length===0)return null
                      return <div style={{marginTop:4,paddingTop:4,borderTop:'1px solid rgba(200,140,30,0.3)'}}>
                        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:8,color:'#44cc44',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>⛧ SYNERGIZES WITH</div>
                        {syns.map(s=><div key={s.id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'#88ff88'}}>{s.emoji} {s.name}</div>)}
                      </div>
                    })()}
                  </div>}
                </div>
              )})}
            </div>
            {stage.map((m,i)=>(
              <div key={i} style={{position:'relative',zIndex:typeof strikingMemberIdx!=='undefined'&&strikingMemberIdx===i?200:1}}>
                {m&&memberBuffs[m.uid]&&memberBuffs[m.uid].length>0&&<div style={{position:'absolute',top:-4,left:'50%',transform:'translateX(-50%)',zIndex:90,display:'flex',flexDirection:'column-reverse',alignItems:'center',gap:2,pointerEvents:'none'}}>
                  {memberBuffs[m.uid].map((b,bi)=><div key={bi} style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:b.color,textShadow:'0 0 8px '+b.color+'88,1px 1px 0 #000',letterSpacing:1,whiteSpace:'nowrap',animation:'fadeIn 0.3s ease'}}>{b.text}</div>)}
                </div>}
                {typeof cardAbsorb!=='undefined'&&cardAbsorb&&cardAbsorb.slotIdx===i&&<div key={cardAbsorb.key} style={{position:'absolute',inset:0,zIndex:80,borderRadius:6,pointerEvents:'none',
                background:cardAbsorb.color,
                animation:'cardAbsorbFlash 0.5s ease-out forwards',
                boxShadow:'0 0 30px '+cardAbsorb.color+', inset 0 0 20px '+cardAbsorb.color}}/>}
              <StageSlot member={m} slotIdx={i}
                animPhase={animPhase}
                ghostCard={dragOverSlotIdx===i&&dragCardUid?hand.find(c=>c.uid===dragCardUid):null}
                isAttacking={animPhase==='attacking'&&m&&!m.tooStoned}
                isStriking={typeof strikingMemberIdx!=='undefined'&&strikingMemberIdx===i}
                isHit={hitMemberIdx===i}
                strikeAnim={strikeAnim&&strikeAnim.slotIdx===i?strikeAnim:null}
                isDiceTarget={false}
                innerRef={function(el){stageRefs.current[i]={current:el}}}
                onDragStart={function(){if(m)setDragStageIdx(i)}}
                onDragOver={function(){setDragOverSlotIdx(i)}}
                onDrop={function(){setDragOverSlotIdx(null);handleStageDrop(i)}}
                bondColor={m?getBondColor(m,stage):null}
                onQuickPlay={()=>{if(quickPlayCardUid&&m){setDragCardUid(quickPlayCardUid);handleDropOnStage(i);setQuickPlayCardUid(null)}}}
                mentorState={m&&m.mentorLinkedToUid?(m.mentorAlive?'active':'broken'):m&&m.isMentor&&stage[i+1]&&stage[i+1].mentorLinkedToUid===m.uid&&!m.tooStoned?'mentor':null}
                corruption={corruption}
              />
              </div>
            ))}
          </div>
        </div>
                {footerCollapsed&&<div onClick={()=>setFooterCollapsed(false)} style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'2px 20px',flexShrink:0,borderTop:'1px solid rgba(60,35,5,0.18)',background:'rgba(10,6,2,0.28)',cursor:'pointer'}}><span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#665544',letterSpacing:2}}>▲ SHOW STATS</span></div>}
                <div style={{display:footerCollapsed?'none':'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'1px 20px 2px',position:'relative',zIndex:5,flexShrink:0,borderTop:'1px solid rgba(60,35,5,0.18)',background:'rgba(10,6,2,0.28)'}}>
          {/* FOOTER COLLAPSE TOGGLE */}
          <div onClick={()=>setFooterCollapsed(p=>!p)} style={{position:'absolute',right:8,top:-14,zIndex:10,cursor:'pointer',fontFamily:"'MBScribblesFont',serif",fontSize:10,color:'var(--ink-dim)',background:'rgba(20,12,4,0.85)',border:'1px solid rgba(138,117,96,0.25)',borderRadius:2,padding:'2px 10px',letterSpacing:3,textTransform:'uppercase',transition:'color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--ink-bone)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-dim)'}>{'▼ Hide'}</div>
          {/* PHASE BANNER — left side, absolute so it never shifts center content */}
          <div style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:4,textTransform:'uppercase',
            color:phaseBanner==='play'?'var(--ink-dim)':phaseBanner==='strike'?'var(--blood)':'var(--blood)',
            textShadow:phaseBanner==='play'?'none':'0 0 12px '+(phaseBanner==='strike'?'rgba(196,30,58,0.6)':'rgba(196,30,58,0.6)'),
            transition:'color 0.2s',opacity:phaseBanner==='play'?0.7:0.95}}>
            {phaseBanner==='play'?'⛧ Play Cards':phaseBanner==='strike'?'⚔ Striking!':'👿 Boss Attacks'}
          </div>
          {/* PACT ICONS — keep the hover tooltips, remove redundant Combined Attack readout (DEALS X DMG covers that now) */}
          {chosenPacts.length>0&&<div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4}}>
            {chosenPacts.filter(Boolean).map(pid=>{const p=PACT_REWARDS.find(r=>r.id===pid);return p?<div key={pid} style={{position:'relative',cursor:'help'}}
              onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-pacttip]');if(t)t.style.display='block'}}
              onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-pacttip]');if(t)t.style.display='none'}}>
              <div style={{width:24,height:24,borderRadius:4,background:p.id==='corruption_engine'&&chosenPacts.includes('corruption_locked')?'rgba(60,30,30,0.8)':'rgba(0,0,0,0.6)',border:`1px solid ${p.id==='corruption_engine'&&chosenPacts.includes('corruption_locked')?'#ff000066':p.color+'66'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,position:'relative'}}>{p.emoji}{p.id==='corruption_engine'&&chosenPacts.includes('corruption_locked')&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',borderRadius:4,fontSize:7,color:'#ff4444',fontWeight:900,letterSpacing:1}}>🔒</div>}</div>
              <div data-pacttip="" style={{display:'none',position:'absolute',bottom:'120%',right:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(200,140,30,0.6)',borderRadius:6,padding:'8px 12px',zIndex:99999,pointerEvents:'none',minWidth:180,boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,color:p.color,marginBottom:3}}>{p.emoji} {p.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#c8b080',lineHeight:1.4}}>{p.desc}</div>
              </div>
            </div>:null})}
          </div>}
        </div>
      </div>

      {/* ═══ THE ALTAR (cockpit) — unified panel ═══ */}
      <div className="photocopy altar-grain" style={{flex:'0 0 340px',width:1920,maxWidth:1920,background:'linear-gradient(180deg, var(--altar-raised) 0%, var(--altar) 40%, var(--altar) 100%)',position:'relative',zIndex:30}}>
        {/* Ornamental top frieze — runs full width */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:18,background:'linear-gradient(180deg, rgba(196,30,58,0.35) 0%, rgba(196,30,58,0.08) 70%, transparent 100%)',borderBottom:'1px solid rgba(196,30,58,0.55)',pointerEvents:'none',zIndex:1,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.85,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧</div>

        {/* Header: pending embers indicator */}
        <div style={{textAlign:'center',padding:'16px 0 0',position:'relative',zIndex:3,minHeight:20}}>
          {pendingEmbers>0&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--gold)',letterSpacing:2,textTransform:'uppercase'}}>+{pendingEmbers} Embers pending</span>}
        </div>

        {/* LEFT COLUMN: Deck/Discard — transparent, sits on altar */}
        <div style={{position:'absolute',left:0,top:24,bottom:8,zIndex:60,display:'flex',flexDirection:'column',gap:12,alignItems:'center',justifyContent:'center',padding:'6px 14px',width:100}}>
          <DeckPile count={deck.length} label="Deck" onClick={()=>setDeckViewOpen(true)} cards={deck}/>
          <DeckPile count={discardPile.length} label="Discard" onClick={()=>setDiscardViewOpen(true)} cards={discardPile}/>
        </div>

        {/* DRUG PINS — small artifact tiles on altar */}
        <div style={{position:'absolute',left:110,top:24,bottom:12,zIndex:60,display:'flex',flexDirection:'column',gap:10,alignItems:'center',justifyContent:'center',width:90}}>
          {/* Shrooms tile */}
          <div style={{position:'relative'}}
            onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='block'}}
            onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='none'}}>
            <button onClick={()=>{if(heldShrooms&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight)activateTrip('shrooms')}}
              style={{width:86,padding:'10px 4px',fontFamily:"'MBScribblesFont',serif",fontWeight:900,letterSpacing:2,textTransform:'uppercase',
                background:heldShrooms&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'linear-gradient(180deg, rgba(200,152,56,0.25), rgba(200,152,56,0.08))':'linear-gradient(180deg, rgba(30,18,12,0.5), rgba(15,10,6,0.5))',
                border:heldShrooms&&!tripUsedThisFight?'1px solid var(--gold)':'1px solid var(--rot)',
                borderRadius:2,color:heldShrooms&&!tripUsedThisFight?'var(--gold)':'var(--rot)',
                cursor:heldShrooms&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'pointer':'not-allowed',
                opacity:heldShrooms?1:0.5,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:22,lineHeight:1,opacity:heldShrooms?1:0.35,filter:heldShrooms?'none':'grayscale(1)'}}>🍄</span>
              <span style={{fontSize:9,letterSpacing:2}}>{heldShrooms?'USE':'⛧'}</span>
              {/* Tape marks — zine aesthetic */}
              <div style={{position:'absolute',top:-3,left:8,width:24,height:7,background:'rgba(200,180,140,0.25)',transform:'rotate(-15deg)',borderRadius:1,pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:-3,right:8,width:24,height:7,background:'rgba(200,180,140,0.25)',transform:'rotate(-15deg)',borderRadius:1,pointerEvents:'none'}}/>
            </button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(200,152,56,0.6)',borderRadius:3,padding:'10px 14px',zIndex:99999,pointerEvents:'none',minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',marginBottom:6,letterSpacing:2,textTransform:'uppercase'}}>🍄 Magic Mushrooms</div>
              <div style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'var(--ink-bone)',lineHeight:1.5,fontStyle:'italic'}}>{heldShrooms?'Use before your first Strike. 90% chance of a powerful buff — +2 ATK all, bonus Strike, cheaper cards, or full heal. 5% nothing. 5% bad trip.':'Buy from The Dealer in the shop.'}</div>
            </div>
          </div>
          {/* Acid tile */}
          <div style={{position:'relative'}}
            onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='block'}}
            onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='none'}}>
            <button onClick={()=>{if(heldAcid&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight)activateTrip('acid')}}
              style={{width:86,padding:'10px 4px',fontFamily:"'MBScribblesFont',serif",fontWeight:900,letterSpacing:2,textTransform:'uppercase',
                background:heldAcid&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'linear-gradient(180deg, rgba(180,80,220,0.25), rgba(180,80,220,0.08))':'linear-gradient(180deg, rgba(30,18,12,0.5), rgba(15,10,6,0.5))',
                border:heldAcid&&!tripUsedThisFight?'1px solid #cc88ff':'1px solid var(--rot)',
                borderRadius:2,color:heldAcid&&!tripUsedThisFight?'#cc88ff':'var(--rot)',
                cursor:heldAcid&&strikesLeft===activeStake.maxStrikes&&!tripUsedThisFight?'pointer':'not-allowed',
                opacity:heldAcid?1:0.5,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:22,lineHeight:1,opacity:heldAcid?1:0.35,filter:heldAcid?'none':'grayscale(1)'}}>🧪</span>
              <span style={{fontSize:9,letterSpacing:2}}>{heldAcid?'USE':'⛧'}</span>
              {/* Tape marks — zine aesthetic */}
              <div style={{position:'absolute',top:-3,right:8,width:24,height:7,background:'rgba(180,160,220,0.25)',transform:'rotate(15deg)',borderRadius:1,pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:-3,left:8,width:24,height:7,background:'rgba(180,160,220,0.25)',transform:'rotate(15deg)',borderRadius:1,pointerEvents:'none'}}/>
            </button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(180,80,220,0.6)',borderRadius:3,padding:'10px 14px',zIndex:99999,pointerEvents:'none',minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#cc88ff',marginBottom:6,letterSpacing:2,textTransform:'uppercase'}}>🧪 Blotter Acid</div>
              <div style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'var(--ink-bone)',lineHeight:1.5,fontStyle:'italic'}}>{heldAcid?'Use before your first Strike. 90% chance of a game-changing effect — double damage, cards fire twice, +3 ATK all, or total immunity. 5% nothing. 5% Hellquake.':'Buy from The Dealer in the shop.'}</div>
            </div>
          </div>
          {/* Sort buttons — tight labels with clear hit targets */}
          <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:8,width:'100%'}}>
            <button onClick={()=>setHandSort(p=>{const n=p==='embers'?'none':'embers';localStorage.setItem('vst_handsort',n);return n})}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,letterSpacing:2.5,textTransform:'uppercase',padding:'6px 8px',background:handSort==='embers'?'linear-gradient(180deg, rgba(200,152,56,0.22), rgba(200,152,56,0.06))':'rgba(15,10,6,0.4)',border:handSort==='embers'?'1px solid var(--gold)':'1px solid rgba(138,117,96,0.25)',borderRadius:2,color:handSort==='embers'?'var(--gold)':'var(--ink-dim)',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>⚡ Cost</button>
            <button onClick={()=>setHandSort(p=>{const n=p==='rarity'?'none':'rarity';localStorage.setItem('vst_handsort',n);return n})}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,fontWeight:900,letterSpacing:2.5,textTransform:'uppercase',padding:'6px 8px',background:handSort==='rarity'?'linear-gradient(180deg, rgba(200,152,56,0.22), rgba(200,152,56,0.06))':'rgba(15,10,6,0.4)',border:handSort==='rarity'?'1px solid var(--gold)':'1px solid rgba(138,117,96,0.25)',borderRadius:2,color:handSort==='rarity'?'var(--gold)':'var(--ink-dim)',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>✦ Rarity</button>
          </div>
        </div>


        {/* LEFT PANEL: Discard + Embers + Stats — sits on altar */}
        <div style={{position:'absolute',left:210,top:24,bottom:12,zIndex:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',gap:8,padding:'4px 14px 8px',width:190}}>
          {/* DISCARD group: button + pips as tight unit */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,width:'100%'}}>
            <button onClick={handleDiscard} disabled={!canDiscard}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'9px 10px',background:canDiscard?'linear-gradient(180deg, rgba(200,152,56,0.25), rgba(200,152,56,0.08))':'linear-gradient(180deg, rgba(138,117,96,0.08), rgba(138,117,96,0.03))',border:canDiscard?'1px solid var(--gold)':'1px solid rgba(138,117,96,0.35)',borderRadius:3,color:canDiscard?'var(--gold)':'var(--ink-dim)',cursor:canDiscard?'pointer':'not-allowed',textShadow:canDiscard?'0 0 14px rgba(200,152,56,0.5)':'none',transition:'all 0.15s',width:'100%',opacity:canDiscard?1:0.5}}>{String.fromCharCode(8595)} DISCARD</button>
            {undoSnapshot&&<button onClick={handleUndo} style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,letterSpacing:2,padding:'4px 8px',background:'rgba(100,60,20,0.3)',border:'1px solid rgba(200,152,56,0.35)',borderRadius:2,color:'var(--gold)',cursor:'pointer',width:'100%',opacity:0.7,transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>↩ UNDO (Ctrl+Z)</button>}
            <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
              <PhaseDots left={discardsLeft} total={fightMaxDiscards} color='#c89838' wide={true}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:discardsLeft>0?'var(--gold)':'var(--rot)',letterSpacing:1}}><span key={'dl-'+discardsLeft} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{discardsLeft}/{fightMaxDiscards}</span></span>
            </div>
          </div>
          <EmberDisplayLarge current={embers} max={maxEmbers} forecast={hovered!==null&&hand[hovered]&&hand[hovered].embers>0&&!allCardsFree&&!nextCardFree?hand[hovered].embers:0}/>
          <div style={{display:'flex',gap:18,justifyContent:'center',width:'100%',marginTop:4}}>
            {[['Fight',(fightIndex%3+1)+'/3','var(--blood)'],['Stash',stash,'var(--gold)']].map(function(item){return(
              <div key={item[0]} data-stash-label={item[0]==='Stash'?'1':null} style={{textAlign:'center'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',fontWeight:900,marginBottom:2}}>{item[0]}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:item[2],lineHeight:1,textShadow:'0 0 8px '+(item[2]==='var(--blood)'?'rgba(196,30,58,0.4)':'rgba(200,152,56,0.4)')}}><span key={item[0]+'-'+item[1]} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{item[1]}</span></div>
              </div>
            )})}
          </div>
        </div>

                {/* RIGHT PANEL: Strike seal — sits on altar */}
        <div style={{position:'absolute',right:8,top:24,bottom:12,zIndex:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:'8px 4px',width:160}}>
          {(() => {
            const m = strikeMult || 1.0;
            const tier = m >= 3.0 ? 4 : m >= 2.0 ? 3 : m >= 1.5 ? 2 : m > 1.0 ? 1 : 0;
            const size = tier === 4 ? 62 : tier === 3 ? 52 : tier === 2 ? 44 : tier === 1 ? 38 : 34;
            const color = tier === 4 ? '#ffffff' : tier === 3 ? 'var(--blood)' : tier === 2 ? '#ff6b6b' : tier === 1 ? 'var(--gold)' : 'var(--ink-dim)';
            const bgOpacity = tier === 4 ? 0.55 : tier === 3 ? 0.4 : tier === 2 ? 0.3 : tier === 1 ? 0.2 : 0.08;
            const borderColor = tier >= 3 ? 'var(--blood)' : tier === 2 ? 'rgba(255,107,107,0.6)' : tier === 1 ? 'var(--gold)' : 'rgba(138,117,96,0.25)';
            const glow = tier === 4 ? '0 0 40px #fff, 0 0 80px var(--blood)' : tier === 3 ? '0 0 30px var(--blood), 0 0 60px rgba(196,30,58,0.5)' : tier === 2 ? '0 0 20px rgba(255,107,107,0.7)' : tier === 1 ? '0 0 16px rgba(200,152,56,0.5)' : 'none';
            return (
              <div style={{textAlign:'center',padding:'10px 8px',background:`linear-gradient(180deg, rgba(196,30,58,${bgOpacity}), rgba(196,30,58,${bgOpacity*0.3}))`,border:'1px solid '+borderColor,borderRadius:3,width:'100%',transition:'all 0.3s'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:9,color:'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',marginBottom:2}}>Multiplier</div>
                <div key={'mult-'+m.toFixed(2)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:size,fontWeight:900,color:color,textShadow:glow,lineHeight:1,transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',animation:tier>0?'inkStamp 0.4s ease-out':'none',display:'inline-block'}}>×{m.toFixed(2)}</div>
                {tier >= 3 && <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:11,color:'var(--blood)',letterSpacing:4,marginTop:2,textTransform:'uppercase',textShadow:'0 0 8px var(--blood)'}}>{tier===4?'⛧ BEAST ⛧':'INFERNAL'}</div>}
              </div>
            );
          })()}
          {/* STRIKE button — wider so pentagrams don't clip */}
          <button onClick={handleStrike} disabled={!canStrike}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:19,fontWeight:900,letterSpacing:2,textTransform:'uppercase',whiteSpace:'nowrap',padding:'18px 6px',background:canStrike?'linear-gradient(180deg, rgba(196,30,58,0.55), rgba(122,15,31,0.3))':'rgba(25,12,5,0.4)',border:canStrike?'2px solid var(--blood)':'1px solid var(--rot)',borderRadius:3,color:canStrike?'var(--ink-bone)':'var(--rot)',cursor:canStrike?'pointer':'not-allowed',textShadow:canStrike?'0 0 20px rgba(196,30,58,0.9), 0 2px 4px rgba(0,0,0,0.6)':'none',boxShadow:canStrike?'inset 0 0 32px rgba(196,30,58,0.25), 0 0 24px rgba(196,30,58,0.35)':'none',transition:'all 0.15s',width:'100%',animation:canStrike?'altarBreath 3s ease-in-out infinite':'none'}}>⛧ STRIKE ⛧</button>
          {/* Strike pips — directly under STRIKE button */}
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
            <PhaseDots left={strikesLeft} total={fightMaxStrikes} color='#c41e3a' wide={true}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:strikesLeft<=1?22:strikesLeft<=2?18:15,fontWeight:900,color:strikesLeft<=1?'#ff2200':strikesLeft<=2?'#ff4400':'var(--blood)',letterSpacing:1,textShadow:strikesLeft<=1?'0 0 12px rgba(255,0,0,0.8)':'none'}}><span key={'sl-'+strikesLeft} style={{animation:strikesLeft<=1?'memberHitShake 0.4s ease-out, inkStamp 0.4s ease-out':strikesLeft<=2?'inkStamp 0.4s ease-out, pulse 0.8s ease infinite alternate':'inkStamp 0.4s ease-out',display:'inline-block'}}>{strikesLeft}/{fightMaxStrikes}</span></span>
          </div>
          {/* DAMAGE PREVIEW — below pips, big stamp animation */}
          {/* ACTIVE BUFF BADGES — show when multiplier or temp ATK buffs are live */}
          {(()=>{
            const tempTotal=stage.filter(m=>m&&!m.tooStoned).reduce((s,m)=>s+(m.tempAtkBonus||0),0)
            const hasMult=strikeMult>1.0
            if(!tempTotal&&!hasMult)return null
            return <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap',marginTop:2}}>
              {hasMult&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#ffd700',background:'rgba(200,152,56,0.15)',border:'1px solid rgba(200,152,56,0.5)',borderRadius:3,padding:'1px 6px',letterSpacing:1,animation:'handOvercapPulse 1.5s ease-in-out infinite'}}>×{strikeMult.toFixed(2)} CHAIN</span>}
              {tempTotal>0&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,fontWeight:900,color:'#cc44ff',background:'rgba(153,51,204,0.15)',border:'1px solid rgba(153,51,204,0.5)',borderRadius:3,padding:'1px 6px',letterSpacing:1,animation:'handOvercapPulse 1.5s ease-in-out infinite'}}>+{tempTotal} TEMP ATK</span>}
            </div>
          })()}
          {(()=>{
            // ═══ MIRRORS handleStrike formula EXACTLY (line 5147+) ═══
            const actives=stage.filter(m=>m&&!m.tooStoned)
            // 1) base sum (non-Drummer; paranoia is random so excluded from preview)
            const p10Bonus=activePassives.some(p=>p.id==='p10')&&strikesLeft===fightMaxStrikes?10:0
            let dmg=actives.filter(m=>m.role!=='Drummer').reduce((s,m)=>{
              const effAtk=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/12):m.atk
              const cleanLivingBonus=(chosenPacts.includes('clean_living')&&corruption<15)?3:0
              return s+effAtk+cleanLivingBonus
            },0)+p10Bonus
            // 2) Drummer × dblMult (NOT always ×2 — depends on dblRoll: ≤2=1×, 3-4=1.5×, 5-6=2×)
            const hasDbl=actives.some(m=>m.role==='Drummer')
            if(hasDbl&&dblRoll!==null){
              const dblMult=dblRoll<=2?1.0:dblRoll<=4?1.5:2.0
              dmg=Math.round(dmg*dblMult)
            }
            // 3) Encore: members with encoreReady get a SECOND attack (added separately)
            const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer').reduce((s,m)=>{
              const ea=m.keyword==='CORRUPT'?m.atk+Math.floor(corruption/12):m.atk
              return s+ea
            },0)
            dmg+=encDmg
            // 4) Band synergy
            const buf=actives.filter(m=>(m.buffCount||0)>0).length
            const bon=buf>=5?1.35:buf>=4?1.20:buf>=3?1.10:1
            dmg=Math.round(dmg*bon)
            // 5) Mentor link bonus
            for(let _mi=0;_mi<stage.length-1;_mi++){
              const _mn=stage[_mi],_bs=stage[_mi+1]
              if(!_mn||!_bs||_mn.tooStoned||_bs.tooStoned)continue
              if(_mn.isMentor&&_bs.mentorLinkedToUid===_mn.uid&&_bs.mentorAlive){
                const _em=_bs.mentorMult+(activeStake.mentorBonus||0)
                const _ma=_mn.keyword==='CORRUPT'?_mn.atk+Math.floor(corruption/12):_mn.atk
                const _ba=_bs.keyword==='CORRUPT'?_bs.atk+Math.floor(corruption/12):_bs.atk
                dmg+=Math.round((_ma+_ba)*(_em-1))
              }
            }
            // 6) Wailing Guitar artifact: ×2 on first strike
            if(activeArtifacts.some(a=>a.id==='ca4')&&strikesLeft===fightMaxStrikes)dmg*=2
            // 7) Corruption multiplier
            const corrMult=1+Math.floor(corruption/20)*0.2
            dmg=Math.round(dmg*corrMult)
            // 8) Artifact multiplier triggers
            let artMult=1.0
            const _cpc=(cardsPlayedRef.current||[]).length
            const _cf=(combosFiredRef.current||[]).length
            const _sc=stage.filter(m=>m&&m.tooStoned).length
            const _hd=hand.filter((c,i)=>hand.findIndex(h=>h.id===c.id)!==i).length
            for(const art of activeArtifacts){
              if(!art.multTrigger)continue
              let fires=0
              if(art.multTrigger==='cards3'&&_cpc>=3)fires=1
              if(art.multTrigger==='cards5'&&_cpc>=5)fires=1
              if(art.multTrigger==='corrupt50'&&corruption>=50)fires=1
              if(art.multTrigger==='perChain')fires=_cf
              if(art.multTrigger==='perStoned')fires=_sc
              if(art.multTrigger==='perDupe')fires=_hd
              if(fires>0)artMult*=Math.pow(art.mult,fires)
            }
            if(activeArtifacts.some(a=>a.id==='ca1'))artMult*=1.25
            dmg=Math.round(dmg*artMult)
            // 9) Strike multiplier
            const fin=strikeMult>1.0?Math.round(dmg*strikeMult):dmg
            if(fin<=0||!canStrike)return null
            return (
              <div style={{fontFamily:"'MBScribblesFont',serif",textAlign:'center',marginTop:6}}>
                <div style={{fontSize:11,color:'var(--ink-dim)',letterSpacing:4,textTransform:'uppercase',fontWeight:900}}>Deals</div>
                <div key={'preview-'+fin} style={{fontSize:42,fontWeight:900,color:'var(--blood)',textShadow:'0 0 18px rgba(196,30,58,0.85), 0 2px 4px rgba(0,0,0,0.7)',lineHeight:1,animation:'damageStamp 0.35s cubic-bezier(0.4,1.6,0.5,1)',display:'inline-block',marginTop:2}}>{fin}<span style={{fontSize:14,color:'var(--ink-bone)',marginLeft:4,letterSpacing:2}}>DMG</span></div>
              </div>
            )
          })()}
        </div>

        {/* CARD FAN — centered between panels */}
        <div style={{position:'absolute',left:410,right:150,top:22,bottom:0,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:10,overflow:'visible',zIndex:50}}>
          {/* HAND SIZE INDICATOR — gold pulse at overcap */}
          {(()=>{const tgt=handTargetRef.current||HAND_SIZE;const over=hand.length>tgt;return (<>
            <div style={{position:'absolute',top:-2,left:8,fontFamily:"'MBScribblesFont',serif",fontSize:11,letterSpacing:1,color:'var(--ink-dim)',pointerEvents:'none',zIndex:51,fontWeight:900}}>DECK {deck.length}</div>
            <div style={{position:'absolute',top:-2,left:'50%',transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:over?'var(--gold)':'var(--ink-dim)',textShadow:over?'0 0 8px rgba(200,152,56,0.6)':'none',animation:over?'handOvercapPulse 1.2s ease-in-out infinite':'none',pointerEvents:'none',zIndex:51,fontWeight:900}}>
              {hand.length}/{tgt}
            </div>
            <div onClick={()=>setShowDiscardPreview(p=>!p)} style={{position:'absolute',top:-2,right:8,fontFamily:"'MBScribblesFont',serif",fontSize:11,letterSpacing:1,color:'var(--ink-dim)',cursor:'pointer',zIndex:51,fontWeight:900,padding:'2px 6px',borderRadius:3,background:showDiscardPreview?'rgba(200,152,56,0.2)':'transparent',border:showDiscardPreview?'1px solid rgba(200,152,56,0.3)':'1px solid transparent'}}>DISC {discardPile.length}</div>
            {showDiscardPreview&&discardPile.length>0&&<div style={{position:'absolute',top:16,right:0,zIndex:99999,background:'rgba(10,6,2,0.97)',border:'1px solid rgba(200,152,56,0.4)',borderRadius:6,padding:'12px',maxHeight:300,overflowY:'auto',minWidth:200,maxWidth:320,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',fontWeight:900,marginBottom:8}}>Discard Pile ({discardPile.length})</div>
              {Object.entries(discardPile.reduce((acc,c)=>{acc[c.name]=(acc[c.name]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1]).map(([name,count])=><div key={name} style={{fontFamily:"'MBScribblesFont',serif",fontSize:12,color:'var(--ink-bone)',padding:'2px 0',borderBottom:'1px solid rgba(80,50,10,0.15)',display:'flex',justifyContent:'space-between'}}><span>{name}</span><span style={{color:'var(--ink-dim)'}}>{count>1?'×'+count:''}</span></div>)}
            </div>}
          </>)})()}
          {(handSort==='none'?hand:handSort==='embers'?[...hand].sort((a,b)=>b.embers-a.embers):[...hand].sort((a,b)=>({'Common':0,'Uncommon':1,'Rare':2}[b.rarity]||0)-({'Common':0,'Uncommon':1,'Rare':2}[a.rarity]||0))).filter(Boolean).map((card,i)=>(
            <HandCard key={card.uid} card={card} index={i} total={hand.length} chainReady={RIFF_CHAINS.some(ch=>ch.cards.includes(card.id)&&(hand.some(c2=>c2.uid!==card.uid&&ch.cards.includes(c2.id))||(cardsPlayedRef.current||[]).some(pid=>ch.cards.includes(pid)&&pid!==card.id)))} isUsed={card.id==='stagedive'&&stageDiveUsed} lastRiffPlayed={card.id==='demotape'?lastRiffPlayed:null}
              isHovered={hovered===i} isSelected={selected.includes(card.uid)||quickPlayCardUid===card.uid}
              anyHovered={hovered!==null}
              canAfford={card.embers===0||embers>=card.embers}
              isDragging={dragHandIdx===i} isShopBought={shopBoughtIds.includes(card.uid)}
              onHover={()=>setHovered(i)} onLeave={()=>setHovered(null)}
              onClick={()=>{if(card.id==='stagedive'&&stageDiveUsed)return;playSfx('select',0.5);setSelected(p=>p.includes(card.uid)?p.filter(x=>x!==card.uid):[...p,card.uid]);setQuickPlayCardUid(p=>p===card.uid?null:card.uid)}}
              onDragStart={()=>{setDragHandIdx(i);setDragCardUid(card.uid)}}
              onDragEnd={()=>{setDragHandIdx(null);setDragOverHandIdx(null);setDragCardUid(null)}}
              isDragOver={dragOverHandIdx===i&&dragHandIdx!==null&&dragHandIdx!==i}
              onHandDragOver={()=>{if(dragHandIdx!==null&&dragHandIdx!==i)setDragOverHandIdx(i)}}
              onHandDrop={()=>handleHandReorder(dragHandIdx,i)}
              chainHintsOn={typeof chainHintsOn!=='undefined'?chainHintsOn:false}
              hoverZoomOn={typeof localStorage!=='undefined'&&localStorage.getItem('vst_hoverzoom')!=='off'}
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
              ['Chain Hints','vst_chainhints',localStorage.getItem('vst_chainhints')!=='off'],
              ['VHS Effect','vst_vhs',localStorage.getItem('vst_vhs')!=='off'],
            ].map(([label,key,on])=>(
              <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>{label}</span>
                <button onClick={()=>{localStorage.setItem(key,on?'off':'on');setShowPauseOptions(false);setTimeout(()=>setShowPauseOptions(true),10)}}
                  style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:on?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(on?'#44cc44':'#cc4444'),borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{on?'ON':'OFF'}</button>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'#e8a820'}}>Combat Speed</span>
              <button onClick={()=>{setSpeedMode(p=>{const nv=!p;localStorage.setItem('vst_speed',nv?'fast':'normal');return nv});setShowPauseOptions(false);setTimeout(()=>setShowPauseOptions(true),10)}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#e8a820',background:'rgba(0,0,0,0.4)',border:'1px solid #c87820',borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{speedMode?'FAST':'NORMAL'}</button>
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

          </div>


          <button onClick={()=>{setShowPauseOptions(false);setShowCombatLog(true)}}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:3,
              padding:'12px 40px',background:'rgba(30,15,5,0.7)',
              border:'2px solid rgba(100,65,15,0.5)',borderRadius:6,color:'#c8a060',cursor:'pointer',
              textTransform:'uppercase',width:'100%'}}>
            📜 Combat Log
          </button>
          <button onClick={()=>setShowPauseOptions(false)}
            style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,letterSpacing:4,color:'#ee2222',background:'rgba(120,0,0,0.25)',border:'2px solid #aa0000',borderRadius:8,padding:'12px 60px',cursor:'pointer',marginTop:8,animation:'throb 2s ease-in-out infinite'}}>Resume</button>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'#555',letterSpacing:2,marginTop:4}}>Press ESC to close</div>
        </div>
      </div>}

      {/* ═══ TUTORIAL OVERLAYS ═══ */}
      {/* PRE-FIGHT SPLASH — tour quote loading screen */}
      {preFightSplash&&<div style={{position:'absolute',inset:0,zIndex:9998,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,
        background:'radial-gradient(ellipse at center, rgba(10,4,2,0.97) 0%, rgba(0,0,0,0.99) 100%)',
        animation:'fadeIn 0.3s ease',pointerEvents:'none'}}>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:16,color:'var(--ink-dim)',letterSpacing:6,textTransform:'uppercase',fontStyle:'italic',opacity:0.7,animation:'slideDown 0.4s ease-out'}}>{preFightSplash.circle}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--ink-bone)',textShadow:'0 0 40px rgba(196,30,58,0.5), 3px 3px 0 #000',letterSpacing:4,textAlign:'center',transform:'rotate(-1.5deg)',lineHeight:1,animation:'nameSlamIn 0.5s cubic-bezier(0.2,0.8,0.3,1.15)'}}>{preFightSplash.enemy.name}</div>
        <svg width="400" height="6" viewBox="0 0 400 6" style={{marginTop:-4,animation:'lineDrawIn 0.6s ease-out 0.3s both'}}>
          <path d="M 12 3 Q 100 1, 200 3 T 388 3" stroke="var(--blood)" strokeWidth="1" fill="none" opacity="0.6"/>
        </svg>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-rust)',fontWeight:900,letterSpacing:3,textTransform:'uppercase',marginTop:8,animation:'fadeSlideUp 0.4s ease-out 0.5s both'}}>{preFightSplash.enemy.emoji} {preFightSplash.enemy.passive}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:18,color:'var(--ink-dim)',fontStyle:'italic',maxWidth:600,textAlign:'center',lineHeight:1.5,marginTop:24,padding:'0 40px',opacity:0.65,animation:'fadeSlideUp 0.4s ease-out 0.7s both'}}>"{preFightSplash.quote}"</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:11,color:'var(--rot)',letterSpacing:8,textTransform:'uppercase',marginTop:24,animation:'pulse 1s ease infinite alternate'}}>entering the pit...</div>
      </div>}

      {tutorialFight>0&&TUTORIAL_TIPS[tutorialFight]&&tutorialTipIdx<TUTORIAL_TIPS[tutorialFight].length&&
        <TutorialTooltip tip={TUTORIAL_TIPS[tutorialFight][tutorialTipIdx]} onDismiss={()=>setTutorialTipIdx(p=>p+1)}/>}
      {showTutorialMsg&&<TutorialMessage text={showTutorialMsg} isFinal={showTutorialMsg==='TUTORIAL COMPLETE'} onContinue={handleTutorialContinue}/>}
      {/* Tutorial fight indicator */}
      {tutorialFight>0&&<div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',zIndex:9990,fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'#e8a820',letterSpacing:4,textTransform:'uppercase',background:'rgba(10,6,2,0.85)',border:'1px solid rgba(232,168,32,0.4)',borderRadius:6,padding:'6px 24px'}}>
        TUTORIAL — Fight {tutorialFight} of 3
      </div>}
      {screenFade&&<div style={{position:'absolute',inset:0,zIndex:99990,background:'#000',animation:'screenFadeFlash 350ms ease-out forwards',pointerEvents:'none'}}/>}
      {bossQuoteTypewriter&&<TypewriterQuote text={bossQuoteTypewriter}/>}
      {showConfetti&&<ConfettiRain/>}

    </div>
  )
}

// ── SCALE ROOT — fits game to any screen size ──────────────────
const DESIGN_W=1920,DESIGN_H=1080
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return{error}}
  componentDidCatch(e,info){console.error('VESTIBULE RENDER ERROR:',e.message,info.componentStack)}
  render(){
    if(this.state.error)return <div style={{color:'red',padding:40,fontFamily:'monospace',background:'#000',position:'fixed',inset:0,zIndex:999999,overflow:'auto'}}><h1>RENDER ERROR</h1><pre>{this.state.error.message}</pre><pre>{this.state.error.stack}</pre><button onClick={()=>this.setState({error:null})} style={{color:'#0f0',background:'#333',padding:'10px 20px',border:'none',cursor:'pointer',marginTop:20}}>Try Again</button></div>
    return this.props.children
  }
}

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
      <div id="vst-scale-root" style={{width:DESIGN_W,height:DESIGN_H,transform:`scale(${scale})`,transformOrigin:'center center',position:'relative'}}>
        <ErrorBoundary><App/></ErrorBoundary>
      </div>
    </div>
  )
}
export default ScaleRoot

// hmr trigger
