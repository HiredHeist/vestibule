
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

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {ENEMIES} from './data/enemies.js'
import {ALL_MUSICIANS} from './data/members.js'
import {ALL_CARDS,CARD_UPGRADES,RIFF_CHAINS,CORRUPTION_CARDS} from './data/cards.js'
import {STARTER_ARTIFACTS,MYTHIC_ARTIFACTS,CIRCLE_ARTIFACTS,STARTER_PASSIVES,MYTHIC_PEDALS,BOSS_LOOT,PACT_REWARDS} from './data/relics.js'
import {SLY_LINES,TOUR_QUOTES,BOSS_QUOTES,BOSS_BIOS,LOADING_TIPS,REWARD_TIPS,TUTORIAL_TIPS,BOSS_PORTRAITS,STONED_PORTRAITS,STAGE_PORTRAITS,MEMBER_PORTRAITS,IDLE_PORTRAITS,TUTORIAL_MEMBERS,ACHIEVEMENTS,HELL_EVENTS} from './data/flavor.js'
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
  // Deck multiplier (Shredder ×1.4, Ritualist ×1.6, Engineer ×1.5, Survivor ×1.3, Standard ×1.0)
  const deckId=localStorage.getItem('vst_active_deck')||'standard'
  const deckMult=(STARTER_DECKS.find(d=>d.id===deckId)||{}).scoreMult||1.0
  return Math.max(0, Math.round(baseScore*streakMult*stakeMult*deckMult))
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
function getUnlockedMusicians(){const lt=parseInt(localStorage.getItem('vst_lifetime')||'0')
  let pool=ALL_MUSICIANS.filter(m=>!m.locked||isUnlocked(m.id,lt))
  // vst_no_lucifer=1 (fair-test mode): the Devil sits out EVERYWHERE — draft, packs, all pools
  if(localStorage.getItem('vst_no_lucifer')==='1')pool=pool.filter(m=>m.id!=='lucifer_member')
  return pool}

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
// → ACHIEVEMENTS moved to src/data/flavor.js

function getAchievements(){try{return JSON.parse(localStorage.getItem('vst_achievements')||'[]')}catch(e){return[]}}
function unlockAchievement(id){
  const current=getAchievements()
  if(current.includes(id))return false
  current.push(id)
  localStorage.setItem('vst_achievements',JSON.stringify(current))
  return true
}

// → ENEMIES moved to src/data/enemies.js


// → ALL_MUSICIANS moved to src/data/members.js


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
// → REWARD_TIPS moved to src/data/flavor.js


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
// → CARD_UPGRADES moved to src/data/cards.js


// -- BOSS LOOT: unique drops per circle boss --
// → BOSS_LOOT moved to src/data/relics.js

const STREAK_BONUSES=[
  null, // 0 wins
  null, // 1 win
  {desc:'+1 starting Ember',effect:'ember1'},       // 2 wins
  {desc:'Start with a free Foil member',effect:'foil'},  // 3 wins
  {desc:'+1 free card upgrade',effect:'upgrade'},    // 4 wins
  {desc:'Start with a Mythic member',effect:'mythic'}, // 5+ wins
]

// → PACT_REWARDS moved to src/data/relics.js


// STAKES — difficulty modifier applied on top of the chosen deck.
// hpMult is LIVE as of v0.8 — applied via _stakeHpF() in all three HP formulas. The live
// fight-start formula uses only deck.hpScale × heat × encore. Stake difficulty
// comes from the OTHER fields: dmgAdd, maxStrikes, startEmbers, startCorruption,
// healAfterFight, drugPriceMult, badTripChance. Descriptions reflect what actually
// happens in combat — do not re-add HP-mult promises unless wiring hpMult into
// the fight formula at line ~7387 + getScaledMaxHp at line ~4959.
const STAKES=[
  {id:'bronze',name:'Bronze',color:'#cd7f32',border:'#cd7f32',hpMult:1.30,dmgAdd:0,priceMult:1.0,scoreMult:1.0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Baseline difficulty. Full heal between fights. ×1.0 score.',mentorBonus:0},
  {id:'silver',name:'Silver',color:'#c0c0c0',border:'#c0c0c0',hpMult:1.30,dmgAdd:2,priceMult:1.0,scoreMult:1.5,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Enemies +2 damage. ×1.5 score.',mentorBonus:0.03},
  {id:'gold',name:'Gold',color:'#ffd700',border:'#ffd700',hpMult:1.43,dmgAdd:3,priceMult:1.25,scoreMult:2.0,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:true,drugPriceMult:1.0,badTripChance:0.05,desc:'Enemies +3 damage, +10% HP. Shop prices +25%. ×2.0 score.',mentorBonus:0.03},
  {id:'obsidian',name:'Obsidian',color:'#7a7a9a',border:'#6a6a8a',hpMult:1.73,dmgAdd:2,priceMult:1.25,scoreMult:2.5,maxStrikes:4,startEmbers:5,startCorruption:0,healAfterFight:false,drugPriceMult:1.5,badTripChance:0.05,desc:'Enemies +2 damage, +33% HP. No free heal between fights. Shop +25%. Drugs +50%. ×2.5 score.',mentorBonus:0.06},
  {id:'blood',name:'Blood',color:'#8b0000',border:'#cc0000',hpMult:2.05,dmgAdd:2,priceMult:1.25,scoreMult:3.0,maxStrikes:4,startEmbers:4,startCorruption:10,healAfterFight:false,drugPriceMult:1.5,badTripChance:0.05,desc:'Enemies +2 damage, +58% HP. Start each fight at 4 Embers, 10% Corruption. No heal. Shop +25%. Drugs +50%. ×3.0 score.',mentorBonus:0.15},
  {id:'demonic',name:'Demonic ⛧',color:'#ff0000',border:'#ff0000',hpMult:1.80,dmgAdd:4,priceMult:1.5,scoreMult:4.0,maxStrikes:3,startEmbers:4,startCorruption:15,healAfterFight:false,drugPriceMult:2.0,badTripChance:0.15,desc:'Enemies +4 damage, +38% HP. ONLY 3 Strikes per fight. Start at 4 Embers, 15% Corruption. No heal. Shop +50%. Drugs +100%. Bad trips 15%. ×4.0 score. Pure hell.',mentorBonus:0.75},
]
// v0.8: stake HP factor relative to bronze (1.30). Resurrects formerly-dead hpMult — sim-tuned ladder:
// bronze 38% / silver 26% / gold 18% / obsidian 11% / blood 7% / demonic 1.5% (expert full-relic play, 10K sims).
const _stakeHpF=()=>((STAKES.find(s=>s.id===(localStorage.getItem('vst_active_stake')||'bronze'))||{hpMult:1.3}).hpMult/1.3)
// v0.8: per-deck stake progression (Balatro-style completion grid).
// v1 flat 'vst_stakes_beaten' migrates once -> credited to Standard.
function _stakesBeatenMap(){
  try{const v2=JSON.parse(localStorage.getItem('vst_stakes_beaten_v2')||'null');if(v2)return v2}catch(e){}
  let old=[];try{old=JSON.parse(localStorage.getItem('vst_stakes_beaten')||'[]')}catch(e){}
  const m={standard:old};localStorage.setItem('vst_stakes_beaten_v2',JSON.stringify(m));return m
}
function getStakesBeaten(deckId){const m=_stakesBeatenMap();return m[deckId]||[]}
function getUnlockedStakes(deckId){
  const beaten=getStakesBeaten(deckId||'standard')
  const unlocked=[STAKES[0]] // Bronze always unlocked
  for(let i=1;i<STAKES.length;i++){if(beaten.includes(STAKES[i-1].id))unlocked.push(STAKES[i])}
  return unlocked
}
function allDecksDemonic(){const m=_stakesBeatenMap();return STARTER_DECKS.every(d=>(m[d.id]||[]).includes('demonic'))}
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
function beatStake(stakeId,deckId){
  const beaten=JSON.parse(localStorage.getItem('vst_stakes_beaten')||'[]')
  if(!beaten.includes(stakeId)){beaten.push(stakeId);localStorage.setItem('vst_stakes_beaten',JSON.stringify(beaten))}
  // v0.8 per-deck record — difficulty access is per deck; unlock REWARDS stay global
  const m=_stakesBeatenMap();const dk=deckId||'standard';m[dk]=m[dk]||[]
  if(!m[dk].includes(stakeId)){m[dk].push(stakeId);localStorage.setItem('vst_stakes_beaten_v2',JSON.stringify(m))}
  const unlocks=getStakeUnlocks()
  if(STAKE_UNLOCKS[stakeId]&&!unlocks.includes(stakeId)){unlocks.push(stakeId);localStorage.setItem('vst_stake_unlocks',JSON.stringify(unlocks))}
}

// ── RIFF CHAINS: 2-card combos that trigger bonus damage + visual feedback ──

// ═══ CORRUPTION DECK — cards added to hand when crossing corruption thresholds ═══
// → CORRUPTION_CARDS moved to src/data/cards.js

// → RIFF_CHAINS moved to src/data/cards.js


// Chain lookup: given a card id, return chains it participates in + partner card name
function getChainHints(cardId){
  return RIFF_CHAINS.filter(ch=>ch.cards.includes(cardId)).map(ch=>{
    const partnerIdx=ch.cards[0]===cardId?1:0
    const partner=ALL_CARDS.find(c=>c.id===ch.cards[partnerIdx])
    return{name:ch.name,emoji:ch.emoji,color:ch.color,partnerName:partner?partner.name:'???',partnerId:ch.cards[partnerIdx]}
  })
}

// → ALL_CARDS moved to src/data/cards.js


// ═══════════════════════════════════════════════════════════
// KEYWORD STACK SYSTEM — centralized helpers for tier-scaled
// keyword bonuses (CORRUPT, FRENZIED, SHREDDER, etc.)
// Mirrors vestibule-sim-kwstacks.js so sim numbers match live game.
// ═══════════════════════════════════════════════════════════
// Card type lookup by ID — for FRENZIED (per-RIFF) and SHREDDER
// (consecutive same-type) bonuses introduced in later commits.
const CARD_TYPE_BY_ID={};for(const _c of ALL_CARDS)CARD_TYPE_BY_ID[_c.id]=_c.type
// Stack tier mapping — 1 stack = ×1, 2 stacks = ×2, 3+ stacks = ×4 (foil counts as 2)
function _stackTier(n){return n>=3?4:n===2?2:n>=1?1:0}
// Compute keyword stack tiers for the current band. Foil counts as 2 stacks.
// Returns { counts, tier(kw) } where counts is the raw stack count map and
// tier(kw) returns 0/1/2/4 for use in damage formulas.
function getKeywordStacks(stage){
  const counts={}
  if(!stage)return{counts,tier:()=>0}
  for(const m of stage){
    if(!m||m.tooStoned)continue
    const c=m.foil?2:1
    counts[m.keyword]=(counts[m.keyword]||0)+c
  }
  return{counts,tier:(kw)=>_stackTier(counts[kw]||0)}
}
// Effective ATK for a member, applying all keyword bonuses given strike context.
// ctx: { corruption, riffsThisStrike, shredderHits, tier }
//   - corruption: 0-100, current run corruption level (for CORRUPT)
//   - riffsThisStrike: RIFF card count played this strike (for FRENZIED, commit 4b)
//   - shredderHits: consecutive same-type pair count this strike (for SHREDDER, commit 4c)
//   - tier: function(keyword) → 0/1/2/4 (from getKeywordStacks)
// Always returns m.atk for stoned members (caller filters those out anyway).
function getEffectiveAtk(m,ctx){
  if(!m)return 0
  let atk=m.atk
  if(!ctx)return atk
  if(m.keyword==='CORRUPT'){
    const tier=ctx.tier?Math.max(1,ctx.tier('CORRUPT')):1
    atk+=Math.floor((ctx.corruption||0)/12)*tier
  }
  // FRENZIED — Lead Guitarists. +N ATK per RIFF card played this strike,
  // where N = stack tier (1 stack = +1/RIFF, 2 = +2/RIFF, 3+ = +4/RIFF).
  // Activated in commit 4b. Mirrors sim line ~761.
  if(m.keyword==='FRENZIED'){
    const tier=ctx.tier?ctx.tier('FRENZIED'):0
    if(tier>0)atk+=(ctx.riffsThisStrike||0)*tier
  }
  // SHREDDER — Rhythm Guitarists. +N ATK per consecutive same-type card pair
  // played this strike (a "chain hit"), where N = stack tier.
  // Activated in commit 4c. Mirrors sim line ~763.
  if(m.keyword==='SHREDDER'){
    const tier=ctx.tier?ctx.tier('SHREDDER'):0
    if(tier>0)atk+=(ctx.shredderHits||0)*tier
  }
  // v0.8 Band Auras — adjacency bonus computed once per strike into ctx.auraAtk
  if(ctx.auraAtk)atk+=ctx.auraAtk[m.uid]||0
  return atk
}


// ═══ BAND AURAS (v0.8) — every member radiates a small bonus to ADJACENT stage slots.
// Stoned members neither emit nor receive. Edge slots have 1 neighbor, center 2.
// Mirrors vestibule-sim-kwstacks.js aura engine (sim-validated at 10K games/deck).
function _keywordAuraVal(kw,ctx){
  switch(kw){
    case 'FRENZIED':case 'DEBUFF':case 'BLASTBEAT':return 1
    case 'CORRUPT':return (ctx.corruption||0)>=50?1:0
    case 'HEXED':return (ctx.corruption||0)>=25?1:0
    case 'SHREDDER':return (ctx.shredderHits||0)>0?1:0
    default:return 0
  }}
function _auraAtkMap(stage,ctx){const map={}
  for(let i=0;i<stage.length;i++){const m=stage[i];if(!m||m.tooStoned)continue;let a=0
    for(const j of[i-1,i+1]){const n=stage[j];if(!n||n.tooStoned)continue
      if(n.keyword==='TRICKSTER'){
        // TRICKSTER copies both neighbors' auras: relay this TRICKSTER's OTHER neighbor's
        // ATK-aura to m, plus a base +1 of its own. (v1: copies ATK auras only.)
        const other=stage[2*j-i];if(other&&!other.tooStoned)a+=_keywordAuraVal(other.keyword,ctx)
        a+=1
      }else{
        a+=_keywordAuraVal(n.keyword,ctx)
      }}
    if(a>0)map[m.uid]=a}
  return map}
function _anchorAuraRed(stage,uid){
  const i=stage.findIndex(m=>m&&m.uid===uid);if(i<0)return 0;let r=0
  for(const j of[i-1,i+1]){const n=stage[j];if(n&&!n.tooStoned&&n.keyword==='ANCHOR')r+=1}
  return r}
function _folkAuraHealMap(stage){let any=false;const map={}
  for(let i=0;i<stage.length;i++){const m=stage[i];if(!m||m.tooStoned)continue;let h=0
    for(const j of[i-1,i+1]){const n=stage[j];if(n&&!n.tooStoned&&n.keyword==='FOLK MAGIC')h+=2}
    if(h>0){map[i]=h;any=true}}
  return any?map:null}
const KEYWORD_DESC={
  'FRENZIED':'+ATK per RIFF played each Strike. Stack more for bigger bonus (1/2/4×). ⟡AURA: neighbors +1 ATK.',
  'BLASTBEAT':'Every drummer makes the whole band hit ×1.5 harder — flat, reliable, and it STACKS (2 drummers = ×2.25). Multiple drummers allowed. ⟡AURA: neighbors +1 ATK.',
  'ANCHOR':'Saves an ANCHOR member from a lethal hit. 1 stack = save 1 ANCHOR/fight. 2 stacks = save 2 ANCHORs/fight. 3+ stacks = ANY member can be saved (4 saves/fight). Stack 3+ ANCHORs to protect the whole band. ⟡AURA: neighbors take −1 boss damage.',
  'CORRUPT':'+ATK from Corruption (×1/×2/×4 by stack tier). Thrives in chaos. ⟡AURA: neighbors +1 ATK at ≥50% Corruption.',
  'DEBUFF':'Reduces boss damage by 2 each Strike, stacking permanently this fight. ⟡AURA: neighbors +1 ATK.',
  'FOLK MAGIC':'25% chance each Strike to refill all Embers. ⟡AURA: neighbors heal 2 each Strike.',
  'SHREDDER':'+ATK per consecutive same-type card chain played each Strike (1/2/4×). ⟡AURA: neighbors +1 ATK when a chain fires.',
  'HEXED':'Gains +5% Corruption each Strike, +1 ATK per 8% Corruption. ⟡AURA: neighbors +1 ATK at ≥25% Corruption.',
  'TRICKSTER':'Mythical shapeshifter. Copies the aura of BOTH neighbors and passes each to the other, plus +1 ATK of its own. Place him between your two strongest. ⟡AURA: relays both neighbors.',
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
  {name:'Legendary',min:100,color:'#ff44ff',border:'#ff44ff',glow:'rgba(255,68,255,0.6)'},
]
function getMasteryData(){try{return JSON.parse(localStorage.getItem('vst_mastery')||'{}')}catch(e){return{}}}
function getMasteryPlays(cardId){return getMasteryData()[cardId]||0}
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
// → MEMBER_PORTRAITS moved to src/data/flavor.js

// → STAGE_PORTRAITS moved to src/data/flavor.js


// → IDLE_PORTRAITS moved to src/data/flavor.js

// STONED_PORTRAITS — per-character "Too Stoned" state animations.
// JV's plan: each character slumped over with smoke clouds. Drop GIFs at
// public/members/stoned/{id}_stage_stoned.gif and they auto-load.
// Currently empty — falls back to CSS smoke-cloud overlay (see StageSlot).
// As you finish each character's stoned animation, just uncomment the line.
// → STONED_PORTRAITS moved to src/data/flavor.js

// → BOSS_PORTRAITS moved to src/data/flavor.js

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
    if(mastery[deck[i].id]>=100&&!deck[i].upgraded){
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
  survivor:{battlecry:3,newstrings:2,encore:2,infencore:2,possessedperf:2,heavyriff:2,moshpit:2,crowdsurf:2,amp:1,soundwall:1,resonancecard:1,burnset:1,herbmoney:1,doomchord:2,sonicboom:2,necroticamp:1,distortion:2,staticcharge:2,darktuning:2,deathriff:2,controlfeedback:1,dialtoeleven:1,feedbackloop:1,seance:1,bloodritual:1,sigdecay:1,soundcheck:2,roadie:2,wakeup:2,setlist:2,setbreak:2,doublebooking:2,bootlegcopy:1,backstagepass:1,powertap:2,tappedout:2,ampoverload:2,drainthecrowd:2,groupie:1,soundboard:1,slowburn:1,pyromaniac:1,secondwind:1,corrsiphon:1},
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
// → TOUR_QUOTES moved to src/data/flavor.js


// ═══ TUTORIAL SYSTEM ═══════════════════════════════════════════════════════
const TUTORIAL_ENEMIES=[
  {id:'tut_shade',name:'The Shade',circle:'TUTORIAL',subtitle:'Fight 1 of 3',maxHp:30,baseDmg:2,emoji:'👤',passive:'A weak spirit. An easy first kill.',passiveId:null},
  {id:'tut_wraith',name:'The Wraith',circle:'TUTORIAL',subtitle:'Fight 2 of 3',maxHp:45,baseDmg:3,emoji:'👻',passive:'Its touch corrupts. +10% Corruption per Strike.',passiveId:'corruptPlayer10tut'},
  {id:'tut_revenant',name:'The Revenant',circle:'TUTORIAL',subtitle:'Fight 3 of 3',maxHp:55,baseDmg:3,emoji:'💀',passive:'Stronger, but beatable. Find the combo.',passiveId:null},
]
// Members the player starts with in the tutorial
// → TUTORIAL_MEMBERS moved to src/data/flavor.js
 // Lead Guitarist (FRENZIED) + Rhythm Guitarist (SHREDDER)
// Predetermined hands for each tutorial fight
const TUTORIAL_HANDS={
  1:['battlecry','amp','newstrings','groupie','distortion','heavyriff','moshpit'], // basics: buff + attack
  2:['battlecry','darktuning','setbreak','distortion','encore','roadie','groupie'], // corruption cards + heals
  3:['battlecry','stagedive','encore','amp','heavyriff','distortion','groupie'], // battlecry+stagedive = DEATH WISH chain
}
// Tooltip sequences per fight
// → TUTORIAL_TIPS moved to src/data/flavor.js

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
  corruption:"⚠ CORRUPT cards (purple) are powerful. Pushing corruption costs you tomorrow — pricier shops, weaker band, smaller stash. But it can't end your run. Push when it's worth it.",
}
function hasSeenTip(id){return(JSON.parse(localStorage.getItem('vst_tips')||'[]')).includes(id)}
function markTipSeen(id){const seen=JSON.parse(localStorage.getItem('vst_tips')||'[]');if(!seen.includes(id)){seen.push(id);localStorage.setItem('vst_tips',JSON.stringify(seen))}}
function markTutorialDone(){localStorage.setItem('vst_tutorial','done')}

// ── STARTER ARTIFACTS A1-A10 ─────────────────────────────────
// ═══════════════════════════════════════════════════════════
// ARTIFACTS — DAMAGE/SCORE MULTIPLIERS (3 slots, max equipped)
// ═══════════════════════════════════════════════════════════
// Framing: ARTIFACTS PAYOUT, PEDALS ENABLE.
// All artifacts here produce a multiplier (mult/multTrigger) or
// score bump (scoreBump). Utility effects moved to STARTER_PASSIVES.
// Rarity weights: Common 50%, Uncommon 30%, Rare 17%, Mythic 3%.
// Mythic tier locked behind in-game accomplishments — see MYTHIC_ARTIFACTS.
// → STARTER_ARTIFACTS moved to src/data/relics.js


// ── MYTHIC ARTIFACTS (3) — UNLOCK-GATED ────────────────────────
// Not in shop pool until corresponding unlock fires. See unlock conditions
// in MODIFIER_CONTENT.md. Discovered via play, not displayed in trophies
// until "seen" or "unlocked".
// → MYTHIC_ARTIFACTS moved to src/data/relics.js


// ═══════════════════════════════════════════════════════════
// PEDALS (PASSIVES) — STRATEGY ENABLERS (2 slots, max equipped)
// ═══════════════════════════════════════════════════════════
// Framing: PEDALS ENABLE, ARTIFACTS PAYOUT.
// All pedals here change rules / economy / draw / cost / structure.
// No multipliers in this pool (those are artifacts).
// Some pedals were reclassified from artifacts (former a3/a4/a7/a8/ca2/ca3/wardrums).
// → STARTER_PASSIVES moved to src/data/relics.js


// ── MYTHIC PEDALS (3) — UNLOCK-GATED ───────────────────────────
// → MYTHIC_PEDALS moved to src/data/relics.js



// ═══════════════════════════════════════════════════════════
// RANDOM EVENTS — Hell-themed encounters between non-boss fights
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// STARTER DECKS — achievement-gated alternate starting decks
// ═══════════════════════════════════════════════════════════
// STARTER_DECKS — each deck has a distinct identity beyond just card pool.
//   hpScale         — boss HP scaling (canonical difficulty knob)
//   memberHpMod     — flat HP added to each band member at run start (Survivor +2)
//   memberHpPct     — % HP modifier applied to each band member (Shredder -15%)
//   handSize        — opening hand size (default HAND_SIZE = 5)
//   startEmbers     — fight-start ember count (default = maxEmbers, usually 5)
//   startCorruption — fight-start corruption (default 0)
//   maxStrikesMod   — bonus strikes per fight (Survivor +1)
//   freeArtifact    — start run with a random Tier 1 artifact (Engineer)
//   signature       — id of the unique mechanic ('riff_chain_echo', 'corruption_feeds',
//                     'copier', 'second_wind'). Wired in their respective handlers.
//   scoreMult       — final-score multiplier for leaderboard (stacks with stake.scoreMult)
const STARTER_DECKS=[
  {id:'standard',name:'⛧ Standard',emoji:'🎸',desc:'The default 69-card deck. Balanced for all playstyles. The honest fight.',requirement:null,color:'#c8a060',hpScale:1.85,scoreMult:1.0},
  {id:'shredder',name:'🎸 The Shredder',emoji:'⚡',desc:'Pure aggro. 38 RIFF cards. +1 hand size. Band starts at 80% HP — glass cannons. SIGNATURE: Riff Chain Echo — every chain fires a second time at 33% damage on the next strike.',requirement:'beat_standard',color:'#ff4400',hpScale:1.85,memberHpPct:1.0,handSize:6,signature:'riff_chain_echo',scoreMult:1.4},
  {id:'ritualist',name:'💀 The Ritualist',emoji:'🌀',desc:'Corruption IS power. 26 CORRUPT cards. Start each fight at 15% corruption. 4 starting embers. SIGNATURE: Corruption Feeds — every 10% corruption gained refunds 1 ember (max 5/strike).',requirement:'beat_shredder',color:'#cc44ff',hpScale:1.85,startEmbers:4,startCorruption:15,signature:'corruption_feeds',scoreMult:1.6},
  {id:'engineer',name:'🔧 The Engineer',emoji:'🔧',desc:'Combo nerd. 18 UTILITY cards. SIGNATURE: Copier — every UTILITY card has a 25% chance to add a copy of itself to your hand. Copies can\'t re-copy. Stack the engine.',requirement:'beat_ritualist',color:'#44aaff',hpScale:1.85,signature:'copier',scoreMult:1.2},
  {id:'survivor',name:'🛡️ The Survivor',emoji:'🛡️',desc:'Outlast everything. SIGNATURE: Second Wind — each member gets ONE per-fight save: when they would go Too Stoned, they instead revive at 15% HP. Stacks across the band.',requirement:'beat_engineer',color:'#44cc44',hpScale:1.85,memberHpMod:0,maxStrikesMod:0,signature:'second_wind',scoreMult:1.3},
]
function getUnlockedDecks(){
  const achs=getAchievements()
  return STARTER_DECKS.filter(d=>!d.requirement||achs.includes(d.requirement))
}

// → HELL_EVENTS moved to src/data/flavor.js


// → BOSS_QUOTES moved to src/data/flavor.js


// → BOSS_BIOS moved to src/data/flavor.js


// → CIRCLE_ARTIFACTS moved to src/data/relics.js


// Card prices by rarity
function cardPrice(card){
  if(!card)return 0
  if(card.shopCost)return card.shopCost
  if(card.isMember)return card.foil?15:card.mythic?30:5
  const base=card.rarity==='Rare'?14:card.rarity==='Uncommon'?8:4
  return base
}

// ═══════════════════════════════════════════════════════════════════
// UNIFIED SHOP PRICING (Aug 4 2026, phase 2 economy sweep)
// ═══════════════════════════════════════════════════════════════════
// THE ONLY price formula in the game. Before this there were two that
// disagreed: ShopScreen.realPrice() (hangover-based hunger curve, drove every
// DISPLAYED price and the affordability gate) and handleShopSpend's
// effectiveCost (corruption>=50 → ×1.25, what was actually CHARGED). Shrooms
// displayed 10 and charged 8; Acid displayed 20 and charged 15. Neither applied
// the stake's priceMult/drugPriceMult, so every stake's shop-difficulty knob
// was inert.
//
// CANONICAL HUNGER CURVE: the `hangover`-based one. It is what the shop UI
// advertises ("HUNGOVER +20%" etc.) and what the STAKES table documents. The
// corruption>=50 → ×1.25 curve is deleted.
//
// Order of operations (single Math.ceil at the end — one rounding rule):
//   base × merchantsEye(0.8) × hunger(1.0/1.2/1.4/1.6) × stake.priceMult
//        × (drugs only) stake.drugPriceMult
//
// kind: 'item' (cards, artifacts, pedals, packs, recruits) | 'drug' | 'reroll'
function shopHungerMult(hangoverPct){
  const h=hangoverPct||0
  return h>=100?1.60:h>=75?1.40:h>=50?1.20:1.00
}
function shopPrice(baseCost,opts){
  const o=opts||{}
  const c=Number(baseCost)||0
  if(c<=0)return 0 // free items (Welcome Pack, pack-grant re-entry) stay free
  const merchDiscount=(o.chosenPacts&&o.chosenPacts.includes&&o.chosenPacts.includes('merchants_eye'))?0.8:1.0
  const hunger=shopHungerMult(o.hangover)
  const stake=o.stake||null
  const stakeMult=(stake&&stake.priceMult)||1.0
  const drugMult=(o.kind==='drug')?((stake&&stake.drugPriceMult)||1.0):1.0
  return Math.max(1,Math.ceil(c*merchDiscount*hunger*stakeMult*drugMult))
}

// ═══ UNIFIED BUYBACK PRICING ═══
// Single source of truth for what Sly pays. The pawn modal used to show
// base+foil+mythic while handlePawnSellCard paid base only (sell a Mythic Rare:
// button said 12🌿, you got 4). Lucifer displayed 5 and paid 69 because the
// display branched on `demonic` while the handler branched on keyword==='FALLEN'
// first — and lucifer_member has FALLEN with no demonic flag.
function cardSellValue(c){
  if(!c)return 0
  const base=c.rarity==='Rare'?4:c.rarity==='Uncommon'?2:1
  return base+(c.foil?3:0)+(c.mythic?8:0)
}
function memberSellValue(m){
  if(!m)return 0
  if(m.keyword==='FALLEN')return 69 // Lucifer — checked FIRST, matches the handler
  if(m.demonic)return 69
  return 5+(m.foil?3:0)+(m.mythic?8:0)
}

// Generate shop cards scaled by circle depth (circleNum 1-9)
// NOTE (Aug 4 2026, phase 1 crash sweep): `isGoodDeal()` lived here and called
// `getShopCost()`, which is declared nowhere in the repo. Nothing called it, so it
// was a latent ReferenceError waiting for its first caller. Deleted outright —
// `cardPrice()` above is the real price source if a "good deal" badge ever returns.
// ═══════════════════════════════════════════════════════════
// RARITY-WEIGHTED ROLL — used for shop artifact + pedal generation
// ═══════════════════════════════════════════════════════════
// Rolls a random entry from a pool, weighted by rarity tier.
// Drop weights: Common 50%, Uncommon 30%, Rare 17%, Mythic 3%.
// Mythic-tier rolls bump to rare if no unlocked mythics in pool.
// Locked entries (unlockAt threshold) excluded automatically.
const RARITY_WEIGHTS={common:50,uncommon:30,rare:17,mythic:3}
function rollWeightedFromPool(pool,unlockedMythics){
  if(!pool||pool.length===0)return null
  // Filter out locked entries (e.g. War Drums until 5000 score)
  // Aug 4 2026 (phase 3): read 'vst_lifetime_score', which NOTHING ever writes — the
  // game writes 'vst_lifetime'. War Drums (and any future unlockAt relic) was therefore
  // permanently filtered out of every roll.
  const lifetimeScore=parseInt(localStorage.getItem('vst_lifetime')||'0')
  const filtered=pool.filter(item=>{
    if(item.locked&&item.unlockAt&&lifetimeScore<item.unlockAt)return false
    // Mythic items use unlockId (camelCase) — check against unlocked list, NOT item.id
    if(item.rarity==='mythic'&&unlockedMythics&&item.unlockId&&!unlockedMythics.includes(item.unlockId))return false
    return true
  })
  if(filtered.length===0)return null
  // Roll a tier first
  let tierRoll=Math.random()*100
  let chosenTier='common'
  if(tierRoll<RARITY_WEIGHTS.mythic)chosenTier='mythic'
  else if(tierRoll<RARITY_WEIGHTS.mythic+RARITY_WEIGHTS.rare)chosenTier='rare'
  else if(tierRoll<RARITY_WEIGHTS.mythic+RARITY_WEIGHTS.rare+RARITY_WEIGHTS.uncommon)chosenTier='uncommon'
  // If chosen tier has no items in filtered pool, fall back to lower tiers
  const tierFallback=['mythic','rare','uncommon','common']
  const startIdx=tierFallback.indexOf(chosenTier)
  for(let i=startIdx;i<tierFallback.length;i++){
    const t=tierFallback[i]
    const inTier=filtered.filter(item=>item.rarity===t)
    if(inTier.length>0)return inTier[Math.floor(Math.random()*inTier.length)]
  }
  // Final fallback — any item in filtered pool
  return filtered[Math.floor(Math.random()*filtered.length)]
}
// Roll an artifact for the shop (pulls from STARTER_ARTIFACTS + CIRCLE_ARTIFACTS + unlocked MYTHIC_ARTIFACTS)
function rollShopArtifact(excludeIds){
  let unlockedMythics=[]
  try{unlockedMythics=JSON.parse(localStorage.getItem('vst_mythic_unlocks')||'[]')}catch(e){}
  const pool=[...STARTER_ARTIFACTS,...CIRCLE_ARTIFACTS,...MYTHIC_ARTIFACTS.filter(m=>unlockedMythics.includes(m.unlockId))]
  // Skip artifacts that were reclassified to pedals
  let artifactPool=pool.filter(a=>!a.reclassifiedToPedal)
  // v0.7.4: Exclude already-owned artifacts so the rerolled circle artifact doesn't
  // appear as "sold" because activeArtifacts.some(...) matches the rolled id.
  if(excludeIds&&excludeIds.length){
    const filtered=artifactPool.filter(a=>!excludeIds.includes(a.id))
    if(filtered.length>0)artifactPool=filtered
  }
  return rollWeightedFromPool(artifactPool,unlockedMythics)||STARTER_ARTIFACTS[0]
}
// Roll a pedal for the shop (pulls from STARTER_PASSIVES + unlocked MYTHIC_PEDALS)
function rollShopPedal(excludeIds){
  let unlockedMythics=[]
  try{unlockedMythics=JSON.parse(localStorage.getItem('vst_mythic_unlocks')||'[]')}catch(e){}
  let pool=[...STARTER_PASSIVES,...MYTHIC_PEDALS.filter(m=>unlockedMythics.includes(m.unlockId))]
  // v0.7.4: Same exclusion logic as rollShopArtifact — prevent reroll collision
  // with active pedals causing the tile to display as sold.
  if(excludeIds&&excludeIds.length){
    const filtered=pool.filter(p=>!excludeIds.includes(p.id))
    if(filtered.length>0)pool=filtered
  }
  return rollWeightedFromPool(pool,unlockedMythics)||STARTER_PASSIVES[0]
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
  // Aug 4 2026: was `.slice(-3)` while the shop rendered `.slice(0,2)` of the
  // result — i.e. the two LEAST advanced of the three most advanced. From
  // circle 6 the list is [vinyl, rarevinyl, cursed] and Cursed Demo — 60🌿, the
  // only Mythic-chance pack in the game — was never purchasable in any run.
  // Return exactly the two slots the shop renders.
  // C1: cassette+cdr · C2-3: cdr+vinyl · C4-5: vinyl+rarevinyl · C6+: rarevinyl+cursed
  return allPacks.filter(p=>cn>=p.minCircle).slice(-2)
}

// Recruitment packs
function genRecruitPack(fightIndex=0){
  const circle=Math.floor(fightIndex/3)+1
  const packs=[
    {name:'Garage Band Pack',emoji:'🎸',cost:10,desc:'Pick 1 of 2 musicians.',members:2,foilChance:0,mythicChance:0,demonicChance:0},
    {name:'Touring Pack',emoji:'🎤',cost:22,desc:'Pick 1 of 3. 25% Foil, 5% Mythic chance.',members:3,foilChance:0.25,mythicChance:0.05,demonicChance:0},
    {name:'Demonic Pack',emoji:'⛧',cost:40,desc:'Pick 1 of 4. 25% Foil, 15% Mythic, 5% DEMONIC.',members:4,foilChance:0.25,mythicChance:0.15,demonicChance:0.05},
  ]
  // SHOP 1 (after fight 1) — FREE Garage Band Pack. Per JV: "r1 = training wheels,
  // then in shop you get a 3rd member and start to pop off." Players need a
  // guaranteed 3rd member to crack open the build crafting before fight 2.
  if(fightIndex===0) return {...packs[0],cost:0,name:'🎸 Welcome Pack',desc:'FREE — Pick 1 of 2 musicians. Welcome to your band!'}
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
const KW_BOND_COLOR={'FRENZIED':'#ee2222','BLASTBEAT':'#ff8800','TRICKSTER':'#e8b84a','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800','FALLEN':'#ff0000'}
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--blood)',letterSpacing:4,textTransform:'uppercase',marginTop:12,opacity:0.6}}>💀 Last Words</div>
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-gold)',letterSpacing:2,textShadow:'0 0 12px rgba(232,168,32,0.8)',background:'rgba(0,0,0,0.8)',padding:'6px 16px',borderRadius:4,border:'1px solid rgba(232,168,32,0.4)'}}>TARGET: {target&&target.name}</div>
    </div>
  )
}

function EmberDisplayLarge({current,max,forecast}){
  const afterCast=forecast?Math.max(0,current-forecast):current
  return(
    <div data-ember-display="1" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',fontWeight:900}} title='Embers = action points. Each card costs embers. You get them back next Strike.'>Embers</div>
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase'}}>Embers</div>
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
  const kwColor={'FRENZIED':'#ee2222','BLASTBEAT':'#ff8800','TRICKSTER':'#e8b84a','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}
  return(
    <div style={{position:'absolute',top:-2,left:-2,right:-2,bottom:-2,zIndex:9800,background:'#040201',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'12px 42px 10px 42px',overflow:'hidden'}}>
      <div style={{fontFamily:"'BreakGothicFont',cursive",fontSize:60,color:'var(--text-blood)',textShadow:'0 0 40px rgba(180,0,0,0.8),0 0 80px rgba(140,0,0,0.5),3px 3px 0 #000',flexShrink:0,letterSpacing:14}}>Opening Night</div>
      {/* DAILY SEED BANNER */}
      <div style={{display:'flex',gap:16,alignItems:'center',flexShrink:0}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-gold)',letterSpacing:3,padding:'6px 20px',background:'rgba(40,25,5,0.8)',border:'1px solid #c87820',borderRadius:4}}>🌍 TODAY'S SEED: {(()=>{const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')).toString(16).toUpperCase()})()}</div>
        {parseInt(localStorage.getItem('vst_streak')||'0')>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-blood)',letterSpacing:2,padding:'6px 16px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:4}}>🔥 {localStorage.getItem('vst_streak')} DAY STREAK</div>}
      </div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:24,color:'var(--text-primary)',fontStyle:'italic',flexShrink:0}}>Select 2 musicians to start your band</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-primary)',letterSpacing:2,flexShrink:0}}>RUN SEED: {seed.toString(16).toUpperCase()}</div>

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
              {isSel&&<div style={{position:'absolute',top:8,right:8,width:24,height:24,borderRadius:'50%',background:'#e8a820',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'var(--text-inverse)',fontWeight:900}}>✓</div>}
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>{IDLE_PORTRAITS[m.id]?<img src={IDLE_PORTRAITS[m.id]} alt={m.name} style={{width:70,height:70,objectFit:'contain',imageRendering:'pixelated'}}/>:MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={45} noSquiggle/>:m.emoji}</div>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,color:isSel?'#e8d090':'#c8b878',textAlign:'center',padding:'2px 4px 0px',lineHeight:1,letterSpacing:2}}>{m.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,letterSpacing:2,color:'var(--text-secondary)',textAlign:'center',padding:'3px 4px 6px',textTransform:'uppercase'}}>{m.role}</div>
              {/* Stat bar — locked vs normal */}
              {m.locked?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'18px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)',gap:6}}>
                  <div style={{fontSize:30,opacity:0.5}}>🔒</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2,textAlign:'center',textTransform:'uppercase'}}>Can you find the key?</div>
                </div>
              ):(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px 8px',background:'rgba(0,0,0,0.72)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:38,fontWeight:900,color:'var(--text-blood)',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,color:kwc,fontWeight:900,textAlign:'center',letterSpacing:0.5,maxWidth:100}}>{kw}{(()=>{const _l=getMemberLegacy(m.id);return _l&&_l.runs>0?<div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2}}>{_l.nickname||(_l.runs+' runs')}</div>:null})()}</div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',textTransform:'uppercase',fontWeight:900}}>HP</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:38,fontWeight:900,color:'var(--text-positive)',lineHeight:1}}>{m.hp}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ABILITY EXPLANATION BOX */}
      <div style={{background:'rgba(10,6,2,0.85)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:8,width:'100%',maxWidth:1700,flexShrink:0,marginTop:2,padding:'10px 24px'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'var(--text-secondary)',textTransform:'uppercase',textAlign:'center',marginBottom:6}}>⚗ Band Abilities — What Do They Mean?</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            ['FRENZIED','#ee2222','⚡','+ATK per RIFF card played each Strike. 1 stack = +1/RIFF, 2 stacks = +2/RIFF, 3+ stacks = +4/RIFF. Foil counts as 2 stacks.'],
            ['DOUBLE TIME','#ff8800','🥁','Drummer rolls d6 each fight: 5-6 doubles ATK (×2), 3-4 gives ×1.5, 1-2 standard. Only one drummer per band — they multiply the whole stage.'],
            ['ANCHOR','#33dd33','⚓','Saves a member from a lethal hit. 1 stack = save 1 lethal/fight on an ANCHOR. 2 stacks = 2 saves. 3+ stacks = ANY member can be saved (4 saves/fight).'],
            ['CORRUPT','#cc44ff','🌀','+ATK based on Corruption level. Per-stack-tier multiplier: ×1/×2/×4 the floor(corruption/12) bonus. Thrives in chaos.'],
            ['DEBUFF','#4488ff','🎤','Each Strike permanently reduces boss damage by 2 this fight. Stacks up.'],
            ['FOLK MAGIC','#44ddaa','🪈','Each Strike has a 20% chance to refund ALL the Embers you spent. Pure luck. Pure folk magic.'],
            ['SHREDDER','#ff4488','🎸','+ATK per consecutive same-type card pair played each Strike. Chain RIFF→RIFF→RIFF for max stacks (1/2/4× per chain hit).'],
            ['HEXED','#cc8800','🟠','Each Strike auto-raises Corruption +5%. Gains +1 ATK for every 10% Corruption. Gets scarier over time.'],
          ].map(([kw,color,icon,desc])=>(
            <div key={kw} style={{display:'flex',alignItems:'flex-start',gap:10,background:'rgba(0,0,0,0.4)',borderRadius:6,padding:'8px 12px',border:`1px solid ${color}44`}}>
              <div style={{fontSize:20,flexShrink:0,marginTop:1}}>{icon}</div>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:color,letterSpacing:1,marginBottom:5}}>{kw}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',lineHeight:1.4,fontStyle:'italic'}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>sel.length===2&&onComplete(sel)} disabled={sel.length<2}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'10px 48px',background:'rgba(130,0,0,0.35)',border:'2px solid #cc1111',borderRadius:3,color:'var(--text-blood)',cursor:sel.length===2?'pointer':'default',transition:'all 0.2s',flexShrink:0,boxShadow:'0 0 22px rgba(180,0,0,0.5)',opacity:sel.length===2?1:0.45,textShadow:'0 0 14px rgba(200,0,0,0.6)'}}>
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
    const pa = cardSellValue(a)
    const pb = cardSellValue(b)
    if(pb!==pa) return pb-pa
    return (a.name||'').localeCompare(b.name||'')
  })
  const members = stage.map((m,i)=>m?{m,i}:null).filter(Boolean)
  const canSell = salesLeft > 0

  // Aug 4 2026: display and handler now share ONE price source (see
  // memberSellValue / cardSellValue at module scope). The old local copies
  // disagreed with handlePawnSellMember/Card on Lucifer and on foil/mythic.
  const memberSellPrice = memberSellValue
  const cardSellPrice = cardSellValue
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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>Stash</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,color:'var(--text-positive)',lineHeight:1,
          textShadow:'0 0 20px rgba(60,220,80,0.8)'}}>{stash}</div>
        <WeedLeaf size={16}/>
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'var(--tier-mythic)',textShadow:'0 0 30px rgba(180,60,255,0.6)',marginBottom:6}}>🪙 Pawn Shop</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:25,color:'var(--tier-mythic)',fontStyle:'italic',marginBottom:6}}>
        {salesLeft} sale{salesLeft!==1?'s':''} remaining this visit
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-muted)',letterSpacing:1,marginBottom:20}}>
        Cannot sell last 2 members · Bonds break on member sale
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(160,80,240,0.2)',marginBottom:24,width:'100%',maxWidth:800}}>
        <button style={tabStyle(tab==='members')} onClick={()=>setTab('members')}>Members</button>
        <button style={tabStyle(tab==='cards')} onClick={()=>setTab('cards')}>Cards</button>
      </div>

      {/* Members tab */}
      {tab==='members'&&<div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',maxWidth:1200}}>
        {members.length===0&&<div style={{fontFamily:"'MBScribblesFont',serif",color:'var(--text-muted)',fontStyle:'italic',fontSize:16}}>No members on stage.</div>}
        {members.map(({m,i})=>{
          const price = memberSellPrice(m)
          // Aug 4 2026: counts ALL members, matching handlePawnSellMember's
          // `stage.filter(m=>m).length<=2`. It used to count only non-stoned
          // members, so a band of 4 with 2 stoned showed every Sell button
          // greyed out reading "Need 2+ members" while the handler would have
          // allowed the sale.
          const cantSell = members.length<=2
          const bc = {'FRENZIED':'#ee2222','BLASTBEAT':'#ff8800','TRICKSTER':'#e8b84a','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}[m.keyword]||'#e8a820'
          const tierColor = m.demonic?'#ffd700':m.mythic?'#dd88ff':m.foil?'#88ccff':null
          return(
            <div key={m.uid||i} style={{width:180,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'1px solid '+(tierColor||'rgba(160,80,240,0.4)'),borderRadius:7,overflow:'hidden',opacity:cantSell?0.5:1}}>
              {tierColor&&<div style={{background:tierColor,padding:'3px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-inverse)',letterSpacing:2}}>{m.demonic?'⛧ DEMONIC':m.mythic?'✦ MYTHIC':'✨ FOIL'}</div>}
              <div style={{fontSize:44,textAlign:'center',padding:'14px 0',background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>{MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={45}/>:m.emoji}</div>
              <div style={{padding:'0 10px 12px'}}>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:20,color:'var(--text-primary)',textAlign:'center',marginBottom:2}}>{m.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center',letterSpacing:1,marginBottom:6}}>{m.role}</div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'4px 6px',background:'rgba(0,0,0,0.4)',borderRadius:3,marginBottom:8}}>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',fontWeight:900}}>ATK</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:'var(--text-blood)'}}>{m.atk}</div></div>
                  <div style={{alignSelf:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,fontWeight:700}}>{m.keyword}</div>
                  <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',fontWeight:900}}>HP</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:'var(--text-positive)'}}>{m.hp}/{m.maxHp}</div></div>
                </div>
                {m.roleBondBonus>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',textAlign:'center',marginBottom:6}}>🔗 Bond +{m.roleBondBonus} ATK (breaks)</div>}
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
        {allCards.length===0&&<div style={{fontFamily:"'MBScribblesFont',serif",color:'var(--text-muted)',fontStyle:'italic',fontSize:16}}>Deck is empty.</div>}
        {allCards.map((c,ci)=>{
          const price = cardSellPrice(c)
          const bc = c.type==='CORRUPT'?'#aa1111':c.type==='UTILITY'?'#22aa44':c.type==='EMBER'?'#c87820':'#9933cc'
          return(
            <div key={c.uid||c.id} style={{width:180,background:'linear-gradient(180deg,#201408,#100804)',border:'1px solid '+bc+'88',borderRadius:6,position:'relative'}}
              onMouseEnter={()=>setHoverCard({c,ci})} onMouseLeave={()=>setHoverCard(null)}>
              <div style={{height:4,background:bc}}/>
              <div style={{textAlign:'center',padding:'12px 0',background:'rgba(0,0,0,0.3)',borderRadius:'6px 6px 0 0'}}><CardArtImg id={c.id} emoji={c.emoji} size={64}/></div>
              <div style={{padding:'0 10px 12px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,color:'var(--text-primary)',textAlign:'center',marginBottom:2}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center',marginBottom:6}}>{c.rarity}</div>
                <button
                  disabled={!canSell}
                  onClick={()=>{if(canSell){onSellCard(c);if(salesLeft<=1)onClose()}}}
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:1,padding:'8px',
                    background:canSell?'rgba(30,80,20,0.3)':'rgba(20,30,15,0.2)',
                    border:'1px solid '+(canSell?'#44cc44':'rgba(60,100,30,0.3)'),
                    borderRadius:4,color:canSell?'#55ee55':'#3a5a2a',cursor:canSell?'pointer':'not-allowed',
                    textTransform:'uppercase',boxShadow:canSell?'0 0 8px rgba(60,200,60,0.3)':'none'}}>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>Sell for {price} <WeedLeaf size={13}/></span>
                </button>
                <button
                  onClick={()=>{onBurnCard(c)}}
                  style={{width:'100%',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:1,padding:'6px',marginTop:4,
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
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>{c.type}</div>
                  <div style={{width:26,height:26,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-primary)'}}>{c.embers}</div>
                </div>
                <div style={{textAlign:'center',marginBottom:6}}><CardArtImg id={c.id} emoji={c.emoji} size={56}/></div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:18,color:'var(--text-primary)',textAlign:'center',marginBottom:2,letterSpacing:1}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,textAlign:'center',letterSpacing:2,marginBottom:6,textTransform:'uppercase'}}>{c.rarity}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center',lineHeight:1.5,fontStyle:'italic'}}>{c.effect}</div>
              </div>}
            </div>
          )
        })}
      </div>}

      <button onClick={onClose} style={{marginTop:30,fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,padding:'18px 60px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'var(--text-secondary)',cursor:'pointer',textTransform:'uppercase'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#c8a040'}}>
        Close Shop
      </button>
    </div>
  )
}

// ── SLY REACTIVE DIALOGUE ──
// Sly comments on what JV is *actually doing* — categorized line pools keyed off live state.
// First match wins (priority order in slyContext). Falls through to ambient when nothing notable is happening.
// → SLY_LINES moved to src/data/flavor.js

const pickSlyLine=(tag)=>{const p=SLY_LINES[tag]||SLY_LINES.ambient;return p[Math.floor(Math.random()*p.length)]}

function ShopScreen({stash,onSpend,onSwapMembers,onLeave,stake,pawnSalesLeft=2,onMarkPackBought,boughtPackIds=[],circleArtifact,circlePassive,recruitPack,recruitBought,onMarkRecruitBought,shopCards,boosterPacks,rerollCost,onReroll,fightIndex,activeArtifacts,activePassives,starterArtifacts,starterPassives,stage,deck,discardPile,onPawnSellMember,onPawnSellCard,onPawnBurnCard,soldIds,onMarkSold,circleCartBought,circleCpasBought,onBuyCart,onBuyCpas,heldShrooms,heldAcid,heldDMT,shroomsInStock,acidInStock,dmtInStock,onBuyShrooms,onBuyAcid,onBuyDMT,corruption,hangover,chosenPacts,addLog,encoreMode}){
  const drugMax=isUnlocked('double_dealer')?2:1
  const [hovId,setHovId]=useState(null)
  const [hoveringArtifact,setHoveringArtifact]=useState(false)
  const [pawnOpen,setPawnOpen]=useState(false)
  const [boughtIds,setBoughtIds]=useState([])
  const [leftBought,setLeftBought]=useState({cart:false,cpas:false,rec:false})
  // Aug 4 2026: pack-purchase bookkeeping and the pawn sales cap are PARENT
  // state now. As ShopScreen locals they were wiped by (a) the [shopCards]
  // effect, which a 2🌿 reroll triggers — re-unlocking the pack you just bought
  // and erasing the one-pack-per-visit limit — and (b) the shop→recruit→shop
  // remount, which unmounts this component entirely. The pawn cap additionally
  // has to be visible to the Recruit screen's fire panel, which sells members
  // through the same handler (see item 15).
  const packsBoughtThisVisit=((boughtPackIds||[]).length+(recruitBought?1:0))>=1?1:0
  const [shopTab,setShopTab]=useState('all') // all, cards, packs, gear
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
  // Sly's reactive line — derive context tag, re-roll line when context changes, flash on change
  const slyContext=useMemo(()=>{
    const totalBuys=boughtIds.length+boughtPackIds.length+(leftBought.cart?1:0)+(leftBought.cpas?1:0)+(leftBought.rec?1:0)
    const circle=Math.floor(fightIndex/3)+1
    // Hover-on-artifact takes top priority — Sly whispers about whatever you're eyeing
    if(hoveringArtifact)return 'hoverArtifact'
    // CLEANED OUT — nothing left to buy. Higher priority than multiBuy because it's a terminal state.
    const recruitGone=leftBought.rec||packsBoughtThisVisit>=1
    const allCardsGone=(shopCards||[]).every(c=>!c||boughtIds.includes(c.uid||c.id)||(soldIds||[]).includes(c.uid||c.id))
    const allPacksGone=(boosterPacks||[]).slice(0,2).every(p=>boughtPackIds.includes(p.id))||packsBoughtThisVisit>=1
    const cartGone=leftBought.cart||!!circleCartBought||(soldIds||[]).includes(circleArtifact?.id)
    const cpasGone=leftBought.cpas||!!circleCpasBought||(soldIds||[]).includes(circlePassive?.id)
    if(recruitGone&&allCardsGone&&allPacksGone&&cartGone&&cpasGone)return 'cleanedOut'
    if(totalBuys>=3)return 'multiBuy'
    if(boughtPackIds.length>=1)return 'boughtPack'
    if(boughtIds.length>=1||leftBought.cart||leftBought.cpas||leftBought.rec)return 'boughtCard'
    if(corruption>=50)return 'highCorruption'
    if(stash>=300)return 'flushStash'
    if(stash<=30)return 'brokeStash'
    if(encoreMode)return 'encore'
    if(circle>=6)return 'deepCircle'
    if(circle===1)return 'firstVisit'
    return 'ambient'
  },[hoveringArtifact,boughtIds,boughtPackIds,leftBought,corruption,stash,fightIndex,encoreMode,packsBoughtThisVisit,shopCards,soldIds,boosterPacks,circleCartBought,circleCpasBought,circleArtifact,circlePassive])
  const [slyLine,setSlyLine]=useState(()=>pickSlyLine('ambient'))
  const [slyFlash,setSlyFlash]=useState(false)
  const slyContextRef=useRef(slyContext)
  useEffect(()=>{
    if(slyContextRef.current===slyContext)return
    slyContextRef.current=slyContext
    setSlyLine(pickSlyLine(slyContext))
    setSlyFlash(true)
    const t=setTimeout(()=>setSlyFlash(false),650)
    return()=>clearTimeout(t)
  },[slyContext])
  // On reroll / new circle, freshen the line within the current pool too.
  // Aug 4 2026: this used to also clear boughtPackIds/packsBoughtThisVisit,
  // which made a 2🌿 reroll a laundromat for the one-pack-per-visit limit.
  // `boughtIds` is safe to clear here — a reroll mints brand-new card uids.
  useEffect(()=>{
    setBoughtIds([])
    setSlyLine(pickSlyLine(slyContextRef.current))
  },[shopCards])
  const [openPackModal,setOpenPackModal]=useState(null) // {pack, cards, picksLeft, picked}
  const circleNum=Math.floor(fightIndex/3)+1
  // ── HANGOVER SHOP TAX (v0.7.1) ─────────────────────────────────
  // Reads from `hangover` (carried-over peak from last fight), 3-step curve.
  // Aug 4 2026: the arithmetic moved to module-scope shopPrice() so display,
  // the affordability gate and the actual charge cannot drift apart again.
  // These locals now exist ONLY for the "⚠ HUNGOVER +20%" warning label.
  const hangoverPct=hangover||0
  const hungerActive=shopHungerMult(hangoverPct)>1.00
  const hungerLabel=hangoverPct>=100?'WASTED +60%':hangoverPct>=75?'HUNGOVER +40%':hangoverPct>=50?'HUNGOVER +20%':null
  // THE price function. `kind` is 'item' | 'drug' | 'reroll'.
  const realPrice=(p,kind)=>shopPrice(p,{kind:kind||'item',hangover,chosenPacts,stake})
  const can=(p,kind)=>stash>=realPrice(p,kind)
  // Show the struck-through base price whenever ANY modifier moved the number —
  // hangover, Merchants Eye, or the stake's priceMult/drugPriceMult.
  const priceMoved=(p,kind)=>realPrice(p,kind)!==p
  const rerollReal=realPrice(rerollCost,'reroll')
  const canReroll=stash>=rerollReal
  const stashColor=stash>=420?'#ff3300':stash>=380?'#ff9900':'#55ee66'
  const typeClr=t=>t==='CORRUPT'?'#aa1111':t==='UTILITY'?'#22aa44':t==='EMBER'?'#c87820':'#9933cc'
  const typeGlow=t=>t==='CORRUPT'?'rgba(170,0,0,0.5)':t==='UTILITY'?'rgba(30,160,50,0.5)':t==='EMBER'?'rgba(200,120,20,0.5)':'rgba(140,40,200,0.5)'
  const rarityAnim=r=>r==='Rare'?'holoShimmer 3s ease-in-out infinite':r==='Uncommon'?'uncommonGlow 2s ease-in-out infinite':''

  // ── PURCHASE COMMIT DISCIPLINE (Aug 4 2026) ────────────────────────
  // onSpend (handleShopSpend) now returns 'bought' | 'pending' | 'refused'.
  // NOTHING is marked sold until it says 'bought'. On 'pending' the slot-swap
  // modal is open and the parent will invoke the onCommit callback we hand it
  // if — and only if — the player confirms the swap. Before this, every caller
  // stamped the tile SOLD unconditionally: a refused purchase (or one that
  // opened the swap modal and got cancelled) burned the item for the whole
  // circle and took no stash.
  function buyCard(card){
    const price=cardPrice(card)
    if(!can(price))return
    if(card.isMember){
      // Member cards in center shop → recruit flow, NOT card flow.
      // `cost` is carried on the payload so any downstream refund path can see
      // what the pack was worth (the old payload had no cost field at all).
      const res=onSpend(price,'recruit',{
        members:1,
        cost:price,
        foilChance: card.foil?1:0,
        mythicChance: card.mythic?1:0,
        demonicChance: card.demonic?1:0,
        _memberOverride: card, // pass the specific member
      })
      if(res!=='bought')return
      setBoughtIds(p=>[...p,card.uid])
      onMarkSold&&onMarkSold(card.uid) // uid only — never card.id for members
      return
    }
    const res=onSpend(price,'card',card)
    if(res!=='bought')return
    setBoughtIds(p=>[...p,card.uid||card.id])
    onMarkSold&&onMarkSold(card.uid||card.id)
  }
  function buyLeft(key,cost,type,item){
    if(!can(cost))return
    // Runs on 'bought' immediately, or later from confirmSlotSwap on 'pending'.
    const commit=()=>{
      setLeftBought(p=>({...p,[key]:true}))
      onMarkSold&&onMarkSold(item.id||item.uid)
      if(key==='cart')onBuyCart&&onBuyCart()
      if(key==='cpas')onBuyCpas&&onBuyCpas()
    }
    const res=onSpend(cost,type,item,commit)
    if(res==='bought')commit()
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
      // 10% chance one is a passive. Aug 4 2026: deduped against already-equipped
      // pedals the way the `ritual` pack always was. Without this you could pull a
      // second Merch Table, equip it, and still only get paid once
      // (`activePassives.some(p=>p.id==='p3')`) — 60🌿 to burn a pedal slot on
      // nothing.
      const _freePedals=(starterPassives||[]).filter(p=>!(activePassives||[]).some(e=>e.id===p.id))
      if(rng()<0.1&&_freePedals.length){
        const pas=_freePedals[Math.floor(rng()*_freePedals.length)]
        base.push({...pas,_isPack:true,_packKind:'passive',uid:uid()})
      } else {
        base.push(...pickRandom(rares,1))
      }
      return{cards:applyFoilMythic(base,0.50,0.20),picks:2}
    }
    if(pack.id==='ritual'){
      const packs=(starterPassives||[]).filter(p=>!(activePassives||[]).some(e=>e.id===p.id))
      return{cards:pickRandom(packs,Math.min(2,packs.length)).map(p=>({...p,_isPack:true,_packKind:'passive',uid:uid()})),picks:1}
    }
    if(pack.id==='hellforged'){
      const arts=(starterArtifacts||[]).filter(a=>!(activeArtifacts||[]).some(e=>e.id===a.id))
      return{cards:pickRandom(arts,Math.min(2,arts.length)).map(a=>({...a,_isPack:true,_packKind:'artifact',uid:uid()})),picks:1}
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

  // ── PACKS ARE CHARGED ON OPEN (Aug 4 2026) ─────────────────────────
  // They used to be charged only on the FINAL pick, and "Pass — Take Nothing"
  // just nulled the modal without charging or marking the pack consumed. So you
  // could open Rare Vinyl, read all 5 cards, Pass, and re-open for a fresh
  // genPackCards roll — free, forever, until a Mythic showed up.
  // Now: tearing the pack open is the transaction. Picking routes the contents
  // via a zero-cost 'pack' call (shopPrice returns 0 for cost<=0), which
  // restores the ✓ Confirm Picks branch that had become unreachable.
  function handleOpenPack(pack){
    if(!can(pack.cost))return
    if((boughtPackIds||[]).includes(pack.id))return
    if(packsBoughtThisVisit>=1){addLog&&addLog('🛑 Already bought a pack this visit. Come back next time.');return}
    if(tearingPack)return // guard: already tearing one
    if(openPackModal)return
    const res=onSpend(pack.cost,'pack',{...pack,pickedCards:[]})
    if(res!=='bought')return
    onMarkPackBought&&onMarkPackBought(pack.id)
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
    if(openPackModal.picked.some(p=>p.uid===card.uid))return
    if(openPackModal.picked.length>=openPackModal.picksLeft)return
    setOpenPackModal(p=>p?{...p,picked:[...p.picked,card]}:p)
  }

  // Hand the picks to the parent router. cost 0 — the pack was already paid for
  // at open time; this call only moves the goods.
  function closePackModal(){
    if(!openPackModal){return}
    const picked=openPackModal.picked||[]
    if(picked.length)onSpend(0,'pack',{...openPackModal.pack,pickedCards:picked})
    setOpenPackModal(null)
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
    // Aug 4 2026: discriminate on the explicit `_packKind` tag stamped at
    // generation. The old `!card.cost` test was structurally dead — EVERY entry
    // in STARTER_ARTIFACTS / CIRCLE_ARTIFACTS / MYTHIC_ARTIFACTS has a truthy
    // cost, so no pack item ever read as an artifact.
    const isPassive=card._packKind==='passive'
    const isArtifact=card._packKind==='artifact'
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
            fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-gold)',letterSpacing:2,
            textShadow:'0 0 14px rgba(255,200,0,0.9)',
            background:'rgba(80,60,0,0.6)',padding:'4px 0'}}>✨ FOIL ✨</div>}
          {card.rarity==='Rare'&&!card.foil&&!card.mythic&&<div style={{position:'absolute',top:10,left:10,padding:'2px 7px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--text-gold)',letterSpacing:1}}>RARE</div>}
          {card.upgraded&&<div style={{position:'absolute',bottom:6,right:6,width:28,height:28,borderRadius:4,background:'rgba(0,0,0,0.7)',border:'2px solid #ffd700',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'var(--text-gold)',boxShadow:'0 0 14px rgba(255,200,0,0.6),0 0 30px rgba(255,200,0,0.2)',textShadow:'0 0 8px rgba(255,200,0,0.8)'}}>⛧</div>}
          {/* ember cost */}
          {card.embers>0&&<div style={{position:'absolute',top:card.foil||card.mythic?38:8,right:10,width:40,height:40,borderRadius:'50%',
            background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',
            border:'2px solid #ff6600',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--text-primary)',
            boxShadow:'0 0 12px rgba(255,100,0,0.6)'}}>{card.embers}</div>}
          <div style={{flex:'0 0 35%',display:'flex',alignItems:'center',justifyContent:'center',
            marginTop:card.foil||card.mythic?28:0,background:'rgba(0,0,0,0.25)',position:'relative',padding:'12px 0'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at center,'+bc+'20,transparent 70%)'}}/>
            <CardArtImg id={card.id} emoji={card.emoji} size={80}/>
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:700,
            color:card.mythic?'#e8aaff':card.foil?'#ffd700':'#eedfc0',
            textAlign:'center',padding:'8px 8px 3px',lineHeight:1.2,
            borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,
            color:bc,textAlign:'center',padding:'3px 4px',letterSpacing:2,
            textTransform:'uppercase',flexShrink:0}}>
            {card.isMember?card.role:isPassive?'EFFECT PEDAL':isArtifact?'VINTAGE AMP':card.type}
            {card.rarity&&!card.isMember&&!isPassive&&!isArtifact?' · '+card.rarity:''}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,
            color:'#c8a878',textAlign:'center',padding:'8px 14px',
            lineHeight:1.45,flex:1}}>{/* Aug 1: demotape branch referenced lastRiffPlayed which is NOT in ShopScreen scope → ReferenceError crashed the whole app whenever the shop rendered a Demo Tape detail (bot run hit it twice). Static text here; live replay preview only exists in combat HandCard. */}{card.id==='demotape'?('📼 '+(card.effect||'Replays the last RIFF you played this fight, free.')):(<>{card.effect||card.desc||''}{card.upgraded&&CARD_UPGRADES[card.id]&&<div style={{marginTop:4,padding:'3px 8px',background:'rgba(255,200,0,0.12)',border:'1px solid rgba(255,200,0,0.3)',borderRadius:4,color:'var(--text-gold)',fontSize:13,fontWeight:700}}>⛧ {CARD_UPGRADES[card.id].desc}</div>}</>)}</div>
          {card.isMember&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'8px 14px',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1}}>ATK</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-blood)',fontWeight:900,lineHeight:1}}>{card.atk}</div>
            </div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1,textAlign:'center'}}>{card.keyword}</div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1}}>HP</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-positive)',fontWeight:900,lineHeight:1}}>{card.hp}</div>
            </div>
          </div>}
          {isPicked&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',
            display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-positive)',letterSpacing:2}}>✓ PICKED</span>
          </div>}
        </div>
        {!isPicked&&picksLeft>0&&<div style={{marginTop:8,fontFamily:"'MBScribblesFont',serif",fontSize:13,
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
            textShadow:'0 0 20px '+ac+'99',marginBottom:6}}>{pack.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2}}>
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
          {remaining>0&&<button onClick={closePackModal}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,letterSpacing:2,
              padding:'12px 32px',background:'rgba(40,25,8,0.6)',
              border:'1px solid rgba(120,80,20,0.4)',borderRadius:6,
              color:'#aa8a40',cursor:'pointer',textTransform:'uppercase'}}>
            {picked.length>0?'Done — Take '+picked.length:'Pass — Take Nothing'}
          </button>}
          {remaining===0&&<button onClick={closePackModal}
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
      <div style={{width:225,flexShrink:0,display:'flex',flexDirection:'column',position:'relative',paddingTop:24}}
        onMouseEnter={()=>setHovId(id)} onMouseLeave={()=>setHovId(null)}>
        {/* Pawn-shop price tag — pinned to top-right corner, tied by string */}
        <div style={{position:'absolute',top:-6,right:8,zIndex:15,pointerEvents:'none'}}>
          {/* string from tag to card edge */}
          <div style={{position:'absolute',top:8,right:-12,width:14,height:1,background:'#000',opacity:0.8,transform:'rotate(18deg)'}}/>
          <div style={{transform:'rotate('+(((idx*7)%7)-3)+'deg)',
            background:canBuy?'#d4b830':'#6a5a18',
            border:'1.5px solid #000',boxShadow:'2px 3px 6px rgba(0,0,0,0.65)',
            padding:'3px 9px 4px',borderRadius:2,whiteSpace:'nowrap',minWidth:54,textAlign:'center',
            position:'relative'}}>
            {/* hole + string knot */}
            <div style={{position:'absolute',top:3,left:4,width:6,height:6,borderRadius:'50%',background:'#1a1408',border:'1px solid #000'}}/>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-inverse)',lineHeight:1,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{priceMoved(price)?<><span style={{textDecoration:'line-through',opacity:0.6,fontSize:13}}>{price}</span> <WeedLeaf size={13}/>{realPrice(price)}</>:<><WeedLeaf size={13}/> {price}</>}</div>
            {hungerActive&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',fontWeight:900,letterSpacing:0.5,marginTop:-1}}>⚠ {hungerLabel}</div>}
          </div>
        </div>
        <div onClick={()=>canBuy&&!bought&&buyCard(card)}
          style={{flex:1,minHeight:315,display:'flex',flexDirection:'column',position:'relative',
            background:'linear-gradient(180deg,#201408,#100804)',
            border:hov&&canBuy&&!bought?'2px solid '+bc:'1px solid '+bc+'55',
            borderRadius:8,overflow:'hidden',
            cursor:canBuy&&!bought?'pointer':'default',
            transform:hov&&canBuy&&!bought?'translateY(-6px) scale(1.02)':'none',
            transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s',
            ...(hov&&canBuy&&!bought?{boxShadow:'0 16px 48px rgba(0,0,0,0.95),0 0 28px '+gl}:{}),
            animation:bought?'':'throbShop 4.5s ease-in-out infinite',opacity:!canBuy&&!bought?0.4:1}}>
          {bought&&<SoldOverlay/>}
          <div style={{height:6,flexShrink:0,background:bc,boxShadow:'0 0 12px '+gl}}/>
          <div style={{position:'relative',height:28,flexShrink:0}}>
            {card.rarity==='Rare'&&<div style={{position:'absolute',top:5,left:8,padding:'2px 6px',borderRadius:3,background:'rgba(200,160,20,0.28)',border:'1px solid rgba(255,220,50,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--text-gold)',letterSpacing:1}}>RARE</div>}
            {card.rarity==='Uncommon'&&<div style={{position:'absolute',top:5,left:8,padding:'2px 6px',borderRadius:3,background:'rgba(100,150,200,0.18)',border:'1px solid rgba(150,200,255,0.28)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--tier-foil)',letterSpacing:1}}>✦</div>}
            {card.foil&&<div style={{position:'absolute',top:5,right:8,padding:'2px 6px',borderRadius:3,background:'rgba(255,215,0,0.3)',border:'1px solid rgba(255,215,0,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--text-gold)'}}>✨FOIL</div>}
            {card.mythic&&<div style={{position:'absolute',top:5,right:8,padding:'2px 6px',borderRadius:3,background:'rgba(120,0,180,0.4)',border:'1px solid rgba(180,0,255,0.6)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'#cc44ff'}}>⛧MYTHIC</div>}
            {card.embers>0
              ?<div style={{position:'absolute',top:3,right:8,width:28,height:28,borderRadius:'50%',
                  background:canBuy?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'rgba(60,30,5,0.9)',
                  border:'2px solid '+(canBuy?'#ff6600':'#6a3a10'),
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,
                  color:canBuy?'#fff':'#8a5a30',
                  boxShadow:canBuy?'0 0 12px rgba(255,100,0,0.6)':'none'}}>{card.embers}</div>
              :<div style={{position:'absolute',top:5,right:8}}><div style={{width:22,height:22,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-primary)',boxShadow:'0 0 8px rgba(255,100,0,0.6)'}}>0</div></div>}
          </div>
          <div style={{height:150,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            background:'rgba(0,0,0,0.3)',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at center,'+bc+'18,transparent 70%)'}}/>
            <CardArtImg id={card.id} emoji={card.emoji} size={105}/>
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:700,
            color:'#eedfc0',textAlign:'center',padding:'7px 8px 3px',position:'relative',
            letterSpacing:0.3,lineHeight:1.2,
            borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>{card.name}{!card.isMember&&getMasteryPlays(card.id)===0&&<span style={{marginLeft:5,fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-positive)',background:'rgba(30,120,30,0.4)',border:'1px solid rgba(60,200,60,0.5)',borderRadius:3,padding:'1px 4px',letterSpacing:1.5}}>NEW!</span>}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,
            color:bc,textAlign:'center',padding:'3px 4px',
            letterSpacing:2,textTransform:'uppercase',flexShrink:0}}>
            {card.isMember?card.role:card.type}{card.rarity&&!card.isMember?' · '+card.rarity:''}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,
            color:'#c8a878',textAlign:'center',padding:'6px 10px',
            lineHeight:1.4,flex:1}}>{card.effect||card.desc||''}</div>
          {/* Card compare — how many copies already in deck */}
          {!card.isMember&&(()=>{const inDeck=[...deck,...discardPile].filter(c=>c.id===card.id).length;return inDeck>0?<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',textAlign:'center',padding:'3px 6px',color:'var(--text-positive)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>IN DECK: {inDeck} {inDeck>=3?'(STACKED!)':''}</div>:<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',textAlign:'center',padding:'3px 6px',color:'var(--text-secondary)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>NEW CARD</div>})()}
          {card.isMember&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'8px 12px',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1}}>ATK</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'var(--text-blood)',fontWeight:900,lineHeight:1}}>{card.atk}</div>
            </div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:card.kwColor||'#aaa',letterSpacing:1,textAlign:'center'}}>{card.keyword}</div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1}}>HP</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'var(--text-positive)',fontWeight:900,lineHeight:1}}>{card.hp}</div>
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
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-inverse)',lineHeight:1,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{priceMoved(price)?<><span style={{textDecoration:'line-through',opacity:0.6,fontSize:13}}>{price}</span> <WeedLeaf size={11}/>{realPrice(price)}</>:<><WeedLeaf size={11}/> {price}</>}</div>
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
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,
            color:ac,textAlign:'center',padding:'4px 4px 0',
            textTransform:'uppercase',opacity:1,flexShrink:0}}>{label}</div>
          <div style={{flex:'0 0 auto',display:'flex',alignItems:'center',justifyContent:'center',padding:'4px 0',
            filter:hov&&canBuy?'drop-shadow(0 0 12px '+ac+')':'none',
            transition:'filter 0.15s'}}><ArtifactArtImg id={item.id} emoji={item.emoji} size={40}/></div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,
            color:'#ffe8a0',textAlign:'center',padding:'0 6px',
            lineHeight:1.2,flexShrink:0}}>{item.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,
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
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--text-inverse)',lineHeight:1,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>{priceMoved(pack.cost)?<><span style={{textDecoration:'line-through',opacity:0.6,fontSize:13}}>{pack.cost}</span> <WeedLeaf size={14}/>{realPrice(pack.cost)}</>:<><WeedLeaf size={14}/> {pack.cost}</>}</div>
          </div>
        </div>
        <div onClick={()=>canBuy&&handleOpenPack(pack)}
          style={{flex:1,minHeight:520,display:'flex',flexDirection:'column',alignItems:'center',
            background:'linear-gradient(160deg,#12100a 0%,#1e1a0e 40%,#120e08 100%)',
            border:hov&&canBuy?'2px solid '+ac:'1px solid '+ac+'66',
            borderRadius:10,overflow:'hidden',
            cursor:canBuy?'pointer':'default',
            transform:hov&&canBuy?'translateY(-6px) scale(1.02)':'none',
            transition:'transform 0.18s,border-color 0.15s',
            ...(hov&&canBuy?{boxShadow:'0 16px 48px rgba(0,0,0,0.95),0 0 32px '+ac+'55'}:{}),
            position:'relative',padding:'0 14px 18px',
            animation:bought||visitLocked?'':'throbShop 4.5s ease-in-out infinite',opacity:!canBuy&&!bought&&!visitLocked?0.4:visitLocked?0.55:1}}>
          {bought&&<SoldOverlay/>}
          {visitLocked&&<SoldOverlay label="SOLD OUT THIS VISIT"/>}
          <div style={{width:'100%',height:8,flexShrink:0,
            background:'linear-gradient(90deg,'+ac+'44,'+ac+'ee,'+ac+'44)',
            boxShadow:'0 0 16px '+ac+'99'}}/>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:3,
            color:ac,textTransform:'uppercase',opacity:1,marginTop:8,flexShrink:0}}>VESTIBULE</div>
          <div style={{flex:'0 0 38%',display:'flex',alignItems:'center',justifyContent:'center',
            filter:'drop-shadow(0 0 '+(hov?'20px':'8px')+' '+ac+(hov?'cc':'66')+')',
            transition:'filter 0.15s'}}><PackArtImg packId={pack.id} emoji={pack.emoji} size={140}/></div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:40,
            color:ac,textAlign:'center',lineHeight:1.2,
            textShadow:'0 0 16px '+ac+'99',flexShrink:0,padding:'4px 4px'}}>{pack.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:3,
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
            <div style={{filter:'drop-shadow(0 0 16px '+ac+'99)',display:'flex',alignItems:'center',justifyContent:'center'}}><PackArtImg packId={pack.id} emoji={pack.emoji} size={180}/></div>
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
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>Stash</div>
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
          <div style={{position:'relative',width:'94%',minWidth:420,maxWidth:820,height:78,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} preserveAspectRatio="none" viewBox="0 0 960 78">
              <path d="M 0 39 L 30 8 L 60 22 L 900 22 L 930 8 L 960 39 L 930 70 L 900 56 L 60 56 L 30 70 Z" fill="rgba(60,0,15,0.82)" stroke="var(--blood)" strokeWidth="0.8" opacity="0.95"/>
              <path d="M 60 22 Q 240 19, 480 22 T 900 22" stroke="var(--blood)" strokeWidth="0.7" fill="none" opacity="0.55"/>
              <path d="M 60 56 Q 240 59, 480 56 T 900 56" stroke="var(--blood)" strokeWidth="0.7" fill="none" opacity="0.55"/>
            </svg>
            <span style={{position:'relative',zIndex:1,fontFamily:"'BogartsMetalFont',cursive",fontSize:30,color:'var(--blood)',letterSpacing:3,textTransform:'uppercase',whiteSpace:'nowrap',animation:'neonFlicker 4.5s ease-in-out infinite',padding:'0 90px',lineHeight:1}}>🚬 SLY'S MERCH 🚬</span>
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--ink-bone)',letterSpacing:0.5,marginTop:4,fontWeight:700,opacity:0.85}}>Hey kid... wanna see what fell off the truck?</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:slyFlash?'#ffe69a':'var(--ink-rust)',letterSpacing:0.3,marginTop:2,fontWeight:700,fontStyle:'italic',textShadow:slyFlash?'0 0 14px rgba(255,210,90,0.85), 0 0 4px rgba(255,210,90,0.5)':'none',transition:'color 320ms ease-out, text-shadow 320ms ease-out'}}>"{slyLine}" —Sly</div>
        </div>

        {/* REROLL — pill badge, single-line wider, wiggle preserved.
            Aug 4 2026: it charged the RAW rerollCost while displaying
            realPrice(rerollCost), had no affordability gate and no disabled
            styling — a broke player got silence. Now priced through shopPrice
            like everything else and visibly dead when you can't afford it. */}
        <div onClick={()=>{if(canReroll)onReroll()}} title={canReroll?'Sly shuffles the merch.':'Not enough stash to reroll.'}
          onMouseEnter={e=>{if(!canReroll)return;e.currentTarget.style.animation='none';e.currentTarget.style.background='rgba(55,40,8,0.95)'}}
          onMouseLeave={e=>{if(!canReroll)return;e.currentTarget.style.animation='rerollWiggle 3s ease-in-out infinite';e.currentTarget.style.background='rgba(25,18,4,0.92)'}}
          style={{minWidth:160,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,padding:'8px 14px',whiteSpace:'nowrap',
            background:'rgba(25,18,4,0.92)',border:'2px solid '+(canReroll?'rgba(200,150,30,0.85)':'rgba(110,85,20,0.4)'),borderRadius:8,cursor:canReroll?'pointer':'not-allowed',
            opacity:canReroll?1:0.4,
            boxShadow:canReroll?'0 0 16px rgba(180,130,20,0.3)':'none',animation:canReroll?'rerollWiggle 3s ease-in-out infinite':'none'}}>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-gold)',letterSpacing:3,textTransform:'uppercase'}}>🎲 Reroll</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--text-gold)',lineHeight:1}}>{priceMoved(rerollCost,'reroll')?<><span style={{textDecoration:'line-through',opacity:0.4,fontSize:13}}>{rerollCost}</span> <WeedLeaf size={14}/> {rerollReal}</>:<><WeedLeaf size={14}/> {rerollCost}</>}</span>
        </div>

        {/* BACK TO THE PIT — wide, single line, throbbing red pulse. Chill cadence (2.4s) but impossible to miss. */}
        <button onClick={onLeave}
          onMouseEnter={e=>{e.currentTarget.style.animationPlayState='paused';e.currentTarget.style.background='rgba(200,30,30,0.65)'}}
          onMouseLeave={e=>{e.currentTarget.style.animationPlayState='running';e.currentTarget.style.background=''}}
          style={{minWidth:240,flexShrink:0,height:80,padding:'0 22px',
            fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,letterSpacing:2.5,
            border:'3px solid var(--blood)',borderRadius:8,
            color:'var(--ink-bone)',cursor:'pointer',textTransform:'uppercase',
            transition:'transform 0.12s',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,whiteSpace:'nowrap',
            animation:'throbPulseRed 2.4s ease-in-out infinite'}}>
          <span style={{fontSize:18,color:'var(--blood)',textShadow:'0 0 10px rgba(196,30,58,0.9)'}}>⛧</span>
          <span>🚪 Back to the Pit</span>
          <span style={{fontSize:18,color:'var(--blood)',textShadow:'0 0 10px rgba(196,30,58,0.9)'}}>⛧</span>
        </button>
      </div>

      {/* TABS REMOVED — single scrollable view */}

      {/* MAIN */}
      <div style={{flex:'1 1 0',display:'flex',gap:10,minHeight:0,overflow:'hidden'}}>

        {/* LEFT COLUMN — RECRUIT PACK (the star, fills space) + GEAR (bottom-aligned) */}
        <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',gap:8,minHeight:0,overflowY:'auto'}}>
          {/* RECRUITMENT PACK — the star. Flex:1 so it dominates the column. Most important purchase in the game. */}
          <div onClick={()=>{
              if(leftBought.rec||recruitBought||packsBoughtThisVisit>=1)return
              if(!can(recruitPack.cost))return
              // Only mark the pack consumed if the parent actually took the money
              // (it refuses when Lucifer caps the band at 3).
              if(onSpend(recruitPack.cost,'recruit',recruitPack)!=='bought')return
              setLeftBought(p=>({...p,rec:true}))
              if(onMarkRecruitBought)onMarkRecruitBought()
            }}
            style={{position:'relative',cursor:can(recruitPack.cost)&&!leftBought.rec&&!recruitBought&&packsBoughtThisVisit<1?'pointer':'default',
              flex:1,minHeight:0,
              border:'2px solid '+(leftBought.rec||recruitBought?'rgba(100,65,15,0.3)':hovId==='rec'?'rgba(255,220,120,1)':'rgba(232,168,32,0.6)'),borderRadius:10,
              background:'linear-gradient(180deg,#1a1408,#0a0604)',overflow:'hidden',
              opacity:leftBought.rec||recruitBought?0.4:1,
              transform:hovId==='rec'&&!leftBought.rec&&!recruitBought?'scale(1.02)':'none',
              transition:'transform 0.15s,border-color 0.15s',
              display:'flex',flexDirection:'column',
              ...(hovId==='rec'&&!leftBought.rec&&!recruitBought?{boxShadow:'0 0 30px rgba(232,168,32,0.45),0 0 8px rgba(255,230,150,0.5) inset'}:{boxShadow:'0 0 18px rgba(232,168,32,0.15)'})}}
            onMouseEnter={()=>setHovId('rec')} onMouseLeave={()=>setHovId(null)}>
            {(leftBought.rec||recruitBought)&&<SoldOverlay/>}
            {packsBoughtThisVisit>=1&&!leftBought.rec&&!recruitBought&&<SoldOverlay label="SOLD OUT THIS VISIT"/>}
            <div style={{flex:'1 1 0',minHeight:0,display:'flex',justifyContent:'center',alignItems:'center',padding:'12px 0 6px'}}>
              <PackArtImg packId={['cassette','cdr','vinyl','rarevinyl','cursed'][Math.min(4,Math.floor(circleNum/2))]} emoji="📦" size={288}/>
            </div>
            <div style={{padding:'4px 12px 12px',textAlign:'center',flexShrink:0}}>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,color:'var(--text-gold)',letterSpacing:3,textShadow:'0 0 14px rgba(232,168,32,0.6)'}}>Band Recruitment</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',margin:'4px 0',letterSpacing:1.5}}>{recruitPack.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',lineHeight:1.3}}>{recruitPack.effect||recruitPack.desc||''}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:'var(--text-positive)',marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                <WeedLeaf size={18}/> {realPrice(recruitPack.cost)}
              </div>
            </div>
          </div>

          {/* GEAR PANELS — Artifact above, Effect Pedal below. Both fixed-height, sit at bottom of column. */}
          {stage&&stage.filter(Boolean).length>1&&onSwapMembers&&<div style={{flexShrink:0,border:'1px solid rgba(68,221,170,0.3)',borderRadius:8,padding:'6px 8px',background:'rgba(4,10,6,0.4)',marginBottom:6}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#44ddaa',letterSpacing:2,textTransform:'uppercase',textAlign:'center',marginBottom:4}}>⟡ Stage Order — auras reach adjacent slots</div>
            <div style={{display:'flex',gap:4,justifyContent:'center',flexWrap:'wrap'}}>
              {stage.map((m,i)=>m&&<div key={m.uid} style={{display:'flex',alignItems:'center',gap:3,border:'1px solid rgba(68,221,170,0.25)',borderRadius:4,padding:'2px 5px',background:'rgba(10,20,14,0.5)'}}>
                <span onClick={()=>{if(i>0&&stage[i-1])onSwapMembers(i,i-1)}} style={{cursor:i>0&&stage[i-1]?'pointer':'default',opacity:i>0&&stage[i-1]?1:0.25,fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#44ddaa',padding:'0 2px'}}>⟨</span>
                <span style={{fontSize:14}}>{m.emoji}</span>
                <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:m.tooStoned?'var(--text-muted)':'var(--ink-bone)'}}>{m.name}</span>
                <span onClick={()=>{if(i<stage.length-1&&stage[i+1])onSwapMembers(i,i+1)}} style={{cursor:i<stage.length-1&&stage[i+1]?'pointer':'default',opacity:i<stage.length-1&&stage[i+1]?1:0.25,fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'#44ddaa',padding:'0 2px'}}>⟩</span>
              </div>)}
            </div>
          </div>}
          {circleArtifact&&<div onMouseEnter={()=>setHoveringArtifact(true)} onMouseLeave={()=>setHoveringArtifact(false)} style={{flexShrink:0,border:'1px solid rgba(200,120,32,0.4)',borderRadius:8,padding:'8px',background:'rgba(10,6,2,0.4)'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-blood)',letterSpacing:2,textTransform:'uppercase',textAlign:'center',marginBottom:4,textShadow:'0 0 8px rgba(196,30,58,0.6)'}}>⛧ This circle only</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:'var(--type-ember)',textAlign:'center',textTransform:'uppercase',marginBottom:4}}>⛧ Artifact</div>
            <LeftCard item={circleArtifact} price={circleArtifact.cost}
              label="" accent='#c87820' id='cart'
              sold={leftBought.cart||!!circleCartBought||activeArtifacts.some(a=>a.id===circleArtifact.id)||(soldIds||[]).includes(circleArtifact.id)}
              onBuy={()=>buyLeft('cart',circleArtifact.cost,'artifact',circleArtifact)} />
            {circleArtifact.mult&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-gold)',textAlign:'center',marginTop:2}}>×{circleArtifact.mult} MULTIPLIER</div>}
          </div>}

          {circlePassive&&<div style={{flexShrink:0,border:'1px solid rgba(153,51,204,0.4)',borderRadius:8,padding:'8px',background:'rgba(10,6,2,0.4)'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:'var(--type-riff)',textAlign:'center',textTransform:'uppercase',marginBottom:4}}>⛧ Effect Pedal</div>
            <LeftCard item={circlePassive} price={circlePassive.cost}
              label="" accent='#9933cc' id='cpas'
              sold={leftBought.cpas||!!circleCpasBought||activePassives.some(p=>p.id===circlePassive.id)||(soldIds||[]).includes(circlePassive.id)}
              onBuy={()=>buyLeft('cpas',circlePassive.cost,'passive',circlePassive)} />
          </div>}
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>

          {/* CARDS ROW */}
          <div style={{display:'block',border:'1px solid rgba(160,110,35,0.3)',borderRadius:8,padding:'8px 12px 12px',background:'rgba(10,6,2,0.3)'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase',textAlign:'center',marginBottom:4}}>🎸 Cards For Sale</div>
          <div style={{flexShrink:0,display:'flex',gap:20,justifyContent:'center',alignItems:'flex-start',paddingTop:4}}>
            {shopCards.filter(Boolean).map((card,i)=><SaleCard key={i} card={card} idx={i}/>)}
          </div>
          </div>

          
          {/* COMPACT DRUG SECTION */}
          <div style={{flexShrink:0,display:'flex',gap:12,justifyContent:'center',padding:'6px 0'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',letterSpacing:2,display:'flex',alignItems:'center',gap:6}}>
              <WeedLeaf size={16}/> SLY'S STASH:
            </div>
            <div onClick={()=>{if(shroomsInStock&&heldShrooms<drugMax&&can(6,'drug')){if(onSpend(6,'dealer',null)==='bought')onBuyShrooms()}}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'4px 16px',
                background:shroomsInStock&&heldShrooms<drugMax&&can(6,'drug')?'rgba(80,40,10,0.5)':'rgba(20,15,10,0.3)',
                border:'1px solid '+(shroomsInStock&&heldShrooms<drugMax?'rgba(200,150,50,0.5)':'rgba(60,40,20,0.3)'),
                borderRadius:6,cursor:shroomsInStock&&heldShrooms<drugMax&&can(6,'drug')?'pointer':'default',
                opacity:shroomsInStock?1:0.4,transition:'all 0.15s'}}>
              <span style={{fontSize:48,filter:'drop-shadow(0 0 6px rgba(232,168,32,0.4))'}}>🍄</span>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:shroomsInStock?'#e8a820':'#554428'}}>
                  {heldShrooms>=drugMax?'HOLDING':shroomsInStock?'Shrooms':'DRY'}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:2}}>
                  <WeedLeaf size={10}/> {realPrice(6,'drug')}</div>
              </div>
            </div>
            <div onClick={()=>{if(acidInStock&&heldAcid<drugMax&&can(12,'drug')){if(onSpend(12,'dealer',null)==='bought')onBuyAcid()}}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'4px 16px',
                background:acidInStock&&heldAcid<drugMax&&can(12,'drug')?'rgba(40,10,80,0.5)':'rgba(15,10,20,0.3)',
                border:'1px solid '+(acidInStock&&heldAcid<drugMax?'rgba(150,50,220,0.5)':'rgba(40,20,60,0.3)'),
                borderRadius:6,cursor:acidInStock&&heldAcid<drugMax&&can(12,'drug')?'pointer':'default',
                opacity:acidInStock?1:0.4,transition:'all 0.15s'}}>
              <span style={{fontSize:48,filter:'drop-shadow(0 0 6px rgba(204,68,255,0.4))'}}>🧪</span>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:acidInStock?'#cc44ff':'#4a2a6a'}}>
                  {heldAcid>=drugMax?'HOLDING':acidInStock?'Acid':'DRY'}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:2}}>
                  <WeedLeaf size={10}/> {realPrice(12,'drug')}</div>
              </div>
            </div>
            {/* DMT tile — boss shops only (rendered conditionally on dmtInStock from parent) */}
            {dmtInStock&&<div onClick={()=>{if(heldDMT<drugMax&&can(25,'drug')){if(onSpend(25,'dealer',null)==='bought')onBuyDMT()}}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'4px 16px',
                background:heldDMT<drugMax&&can(25,'drug')?'linear-gradient(135deg,rgba(80,180,220,0.55),rgba(180,80,220,0.55))':'rgba(20,15,30,0.3)',
                border:'1px solid '+(heldDMT<drugMax?'rgba(220,200,255,0.7)':'rgba(80,60,120,0.3)'),
                borderRadius:6,cursor:heldDMT<drugMax&&can(25,'drug')?'pointer':'default',
                opacity:1,transition:'all 0.15s',
                boxShadow:heldDMT<drugMax?'0 0 14px rgba(180,200,255,0.4)':'none'}}>
              <span style={{fontSize:48,filter:'drop-shadow(0 0 8px rgba(220,200,255,0.6))'}}>💠</span>
              <div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#e8ddff',letterSpacing:1}}>
                  {heldDMT>=drugMax?'HOLDING':'DMT'}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:2}}>
                  <WeedLeaf size={10}/> {realPrice(25,'drug')}</div>
              </div>
            </div>}
          </div>

          {/* GAP */}
          <div style={{flex:1,minHeight:8,maxHeight:30}}/>

          {/* PACKS + PAWN ROW */}
          <div style={{display:'block',border:'1px solid rgba(160,110,35,0.3)',borderRadius:8,padding:'8px 12px 12px',background:'rgba(10,6,2,0.3)'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase',textAlign:'center',marginBottom:4}}>📦 Boosters + Pawn Shop</div>
          <div style={{flexShrink:0,display:'flex',gap:20,justifyContent:'center',alignItems:'flex-start'}}>
            {(boosterPacks||[]).slice(0,2).map((pack,i)=><BoosterPack key={i} pack={pack} idx={i}/>)}
            <div style={{paddingTop:24,flexShrink:0}}>
            <div style={{width:340,height:520,
              background:'linear-gradient(160deg,#0e0a16,#080510)',
              border:'2px solid rgba(150,70,220,0.65)',borderRadius:10,
              padding:'14px 16px',
              display:'flex',flexDirection:'column',
              justifyContent:'space-between',
              boxShadow:'0 0 30px rgba(130,50,200,0.2)'}}>
              <div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:30,
                  color:'#9944dd',textAlign:'center',marginBottom:4,
                  textShadow:'0 0 18px rgba(160,80,240,0.8)'}}>💸 Sly's Buyback</div>
                <div style={{fontSize:36,textAlign:'center',margin:'4px 0 8px'}}>🏧</div>
                {/* 2-column rate sheet */}
                <div style={{padding:'8px 22px',fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--tier-mythic)',letterSpacing:1}}>
                  {[['Common','1',true],['Uncommon','2',true],['Rare','4',true],['Foil','+3',true],['Mythic','+8',true],['Member','5',true],['Artifact','50% buyback',false]].map(([k,v,leaf])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:'1px dashed rgba(200,140,255,0.18)'}}>
                      <span style={{fontWeight:700}}>{k}</span>
                      <span style={{fontWeight:900,color:'var(--tier-mythic)',fontVariantNumeric:'tabular-nums',display:'inline-flex',alignItems:'center',gap:3}}>{v}{leaf&&<WeedLeaf size={14}/>}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',marginTop:10,letterSpacing:0.5,padding:'0 12px'}}>
                  —No questions asked. Sly takes a cut.
                </div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',marginTop:4,letterSpacing:0.5,padding:'0 12px',opacity:0.8}}>
                  Max 2 sales per visit · Cannot sell last 2 members
                </div>
              </div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',fontStyle:'italic',textAlign:'center',letterSpacing:0.5,opacity:0.85}}>
                {pawnSalesLeft>0?'→ Tap Sly to make a deal':'Sold out for this visit'}
              </div>
            </div>
              {/* Aug 4 2026: the 2-sales-per-visit cap is decremented by the
                  HANDLERS now, not by these wrappers. It used to be ShopScreen
                  local state touched only here, so the Recruit screen's fire
                  panel — which calls the same handler — sold members outside the
                  limit entirely. */}
              {pawnOpen&&<PawnShopModal
                stage={stage||[]} deck={deck||[]} discard={discardPile||[]}
                stash={stash} salesLeft={pawnSalesLeft}
                onSellMember={(m,i)=>{onPawnSellMember&&onPawnSellMember(m,i)}}
                onSellCard={(c)=>{onPawnSellCard&&onPawnSellCard(c)}}
                onBurnCard={(c)=>{onPawnBurnCard&&onPawnBurnCard(c)}}
                onClose={()=>setPawnOpen(false)}
              />}
            </div>
            {/* SLY ICON — clickable portrait, opens PawnShopModal. JV will drop in pixel art animation. */}
            <div style={{paddingTop:24,flexShrink:0}}>
              <div onClick={()=>{if(pawnSalesLeft>0)setPawnOpen(true)}}
                onMouseEnter={e=>{if(pawnSalesLeft>0){e.currentTarget.style.transform='translateY(-4px) scale(1.02)';e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.95),0 0 32px rgba(160,80,240,0.55)'}}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 30px rgba(130,50,200,0.2)'}}
                style={{width:300,height:520,
                  background:'linear-gradient(160deg,#16081e,#0a0410)',
                  border:'2px solid rgba(150,70,220,0.65)',borderRadius:10,
                  cursor:pawnSalesLeft>0?'pointer':'not-allowed',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',
                  padding:'12px 12px 16px',position:'relative',
                  transition:'transform 0.18s,box-shadow 0.15s',
                  opacity:pawnSalesLeft>0?1:0.55,
                  boxShadow:'0 0 30px rgba(130,50,200,0.2)',overflow:'hidden'}}>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,
                  color:'#cc88ff',textAlign:'center',
                  textShadow:'0 0 14px rgba(180,80,240,0.8)',letterSpacing:2,flexShrink:0}}>SLY</div>
                {/* Sly portrait — 172×256 source, scales to fill 280×420 slot via object-fit. Pixelated rendering preserves the pixel art. */}
                <div data-sly-portrait="" style={{width:280,height:420,flexShrink:0,
                  background:'radial-gradient(ellipse at 50% 40%, rgba(80,40,140,0.35), rgba(30,10,50,0.85) 70%)',
                  border:'1px solid rgba(200,140,255,0.35)',borderRadius:8,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  position:'relative',overflow:'hidden'}}>
                  <img src={(import.meta.env.BASE_URL||'/')+'sly.gif'} alt="Sly"
                    style={{width:'100%',height:'100%',objectFit:'contain',imageRendering:'pixelated',display:'block'}}/>
                </div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:2,
                  color:pawnSalesLeft>0?'#cc88ff':'#4a2a6a',textTransform:'uppercase',textAlign:'center',flexShrink:0,
                  textShadow:pawnSalesLeft>0?'0 0 10px rgba(160,80,240,0.6)':'none'}}>
                  {pawnSalesLeft>0?`💸 Make a Deal (${pawnSalesLeft} left)`:'⛧ Sold Out ⛧'}
                </div>
              </div>
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


// ═══ CARD ART — shows pixel art PNG if available, falls back to emoji ═══
// Module-level cache of which PNGs exist. Without this, every CardArtImg /
// ArtifactArtImg mount runs through the async Image() probe → hasArt starts
// false → emoji renders for one paint → flips to PNG. In the shop, hover
// can trigger parent re-renders that remount these components, causing a
// visible "emoji flash". Cache the verdict per id so we resolve synchronously.
const _CARD_ART_CACHE={}      // id → boolean (true if PNG exists)
const _ARTIFACT_ART_CACHE={}  // id → boolean
function CardArtImg({id,emoji,size=52,style={}}){
  const src=import.meta.env.BASE_URL+'vestibule/cards/'+id+'.png'
  const cached=_CARD_ART_CACHE[id]
  const [hasArt,setHasArt]=React.useState(cached===true) // true if known; false otherwise (probe will confirm)
  React.useEffect(()=>{
    if(_CARD_ART_CACHE[id]!==undefined){setHasArt(_CARD_ART_CACHE[id]);return}
    const img=new window.Image()
    img.onload=()=>{_CARD_ART_CACHE[id]=true;setHasArt(true)}
    img.onerror=()=>{_CARD_ART_CACHE[id]=false;setHasArt(false)}
    img.src=src
  },[id,src])
  if(hasArt)return <img src={src} alt={id} style={{width:size,height:size,imageRendering:'pixelated',objectFit:'contain',...style}}/>
  // If cache says PNG exists but state hasn't caught up (cross-component first paint), still render PNG.
  if(cached===true)return <img src={src} alt={id} style={{width:size,height:size,imageRendering:'pixelated',objectFit:'contain',...style}}/>
  return <span style={{fontSize:size*0.85,...style}}>{emoji}</span>
}
function ArtifactArtImg({id,emoji,size=40,style={}}){
  const src=import.meta.env.BASE_URL+'vestibule/artifacts/'+id+'.png'
  const cached=_ARTIFACT_ART_CACHE[id]
  const [hasArt,setHasArt]=React.useState(cached===true)
  React.useEffect(()=>{
    if(_ARTIFACT_ART_CACHE[id]!==undefined){setHasArt(_ARTIFACT_ART_CACHE[id]);return}
    const img=new window.Image()
    img.onload=()=>{_ARTIFACT_ART_CACHE[id]=true;setHasArt(true)}
    img.onerror=()=>{_ARTIFACT_ART_CACHE[id]=false;setHasArt(false)}
    img.src=src
  },[id,src])
  if(hasArt)return <img src={src} alt={id} style={{width:size,height:size,imageRendering:'pixelated',objectFit:'contain',...style}}/>
  if(cached===true)return <img src={src} alt={id} style={{width:size,height:size,imageRendering:'pixelated',objectFit:'contain',...style}}/>
  return <span style={{fontSize:size*0.7,...style}}>{emoji}</span>
}



// ═══ SAVE/RESUME SYSTEM ═══
// SAVE FORMAT v4 — pedal slot cap reduced to 2 (was 5):
// - Old saves with 3+ pedals would silently lose pedals on load
// - Bumping vst_save_v3 → vst_save_v4 invalidates v3 saves cleanly
// SAVE FORMAT v3 (May 2 2026) — modifier system overhaul:
// - 7 utility artifacts (a3,a4,a7,a8,ca2,ca3,wardrums) reclassified to pedals
// - Old saves with these in activeArtifacts would route through wrong slot
const SAVE_KEY='vst_save_v4'
function saveGame(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch(e) {}
}
function loadGame() {
  try {
    const s = localStorage.getItem(SAVE_KEY)
    if (!s) return null
    const sv = JSON.parse(s)
    // ZOMBIE-SAVE GUARD (Jul 30 2026): the old stale-closure auto-save could write
    // sl:0 (previous fight's spent strikes) → reload = soft-locked fight with no
    // death trigger. Any save without strikes to spend is unresumable — invalidate.
    if (sv && sv.sl !== undefined && sv.sl <= 0) { clearSave(); return null }
    return sv
  } catch(e) { return null }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem('vst_save_v3'); localStorage.removeItem('vst_save') /* old key cleanup */ } catch(e) {}
}
function showFirstTimeTip(key, msg, addLog, addFloat) {
  const k = 'vst_tip_' + key
  if (localStorage.getItem(k)) return false
  localStorage.setItem(k, '1')
  if (addLog) addLog('💡 TIP: ' + msg)
  return true
}

// ═══ LOADING TIPS — doom metal wisdom ═══
// → LOADING_TIPS moved to src/data/flavor.js


// ═══ PACK ART — maps pack IDs to art files ═══
const PACK_ART_MAP={cassette:'touring',cdr:'underground',vinyl:'festival',rarevinyl:'headliner',cursed:'demonic'}
function PackArtImg({packId,emoji,size=120,style={}}){
  const [hasArt,setHasArt]=React.useState(false)
  const artFile=PACK_ART_MAP[packId]||packId
  const src=import.meta.env.BASE_URL+'vestibule/packs/'+artFile+'.png'
  React.useEffect(()=>{const img=new window.Image();img.onload=()=>setHasArt(true);img.onerror=()=>setHasArt(false);img.src=src},[packId])
  if(hasArt)return <img src={src} alt={packId} style={{width:'auto',height:size,imageRendering:'pixelated',objectFit:'contain',...style}}/>
  return <span style={{fontSize:size*0.6,...style}}>{emoji}</span>
}

function StageSlot({member,isAttacking,isStriking,isHit,strikeAnim,isDiceTarget,onDrop,onDragOver,onDragStart,innerRef,bondColor,mentorState,corruption,corruptTier,animPhase,ghostCard,onQuickPlay}){
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:4,color:'var(--ink-rust)',textTransform:'uppercase',opacity:over?0.7:0.25}}>Empty</div>
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
        transform:st?'rotate(8deg) scale(0.97)':strikeAnim&&strikeAnim.phase==='dip'?'translateY(20px) scale(0.95) rotate(-3deg)':strikeAnim&&strikeAnim.phase==='wiggle'?'translateY(12px) scale(0.97) rotate(4deg)':strikeAnim&&strikeAnim.phase==='launch'?'translate('+strikeAnim.dx+'px,'+(strikeAnim.dy-80)+'px) scale(0.7) rotate(-5deg)':strikeAnim&&strikeAnim.phase==='impact'?'translate('+strikeAnim.dx+'px,'+strikeAnim.dy+'px) scale(1.15) rotate(0deg)':strikeAnim&&strikeAnim.phase==='return'?'translate(0px,-30px) scale(1.05)':'none',
        filter:st?'grayscale(0.3) brightness(0.7) hue-rotate(-15deg)':(strikeAnim&&strikeAnim.phase==='launch'?'blur(1.5px) drop-shadow(0 0 18px rgba(255,80,0,0.6))':'none'),
        opacity:st?0.78:animPhase==='idle'&&!isAttacking&&buffCount===0?0.7:1,
        animation:isHit?'memberHitShake 0.4s ease-out':(!st&&!isAttacking&&!isDiceTarget&&!isStriking)?(nearDeath?'nearDeathPulse 0.8s ease-in-out infinite':'throb 3s ease-in-out infinite'):'none',
        transition:strikeAnim?'transform 0.25s cubic-bezier(0.2,0.8,0.3,1.2), border 0.2s, box-shadow 0.2s, opacity 0.3s':'border 0.2s, box-shadow 0.2s, opacity 0.3s, transform 0.3s',
        cursor:'grab',position:'relative'}}>
      {/* Keyword tooltip — positioned ABOVE the card to avoid the hand-fan z-index/overflow trap below */}
      {showTip&&member&&KEYWORD_DESC[member.keyword]&&<div style={{position:'absolute',bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',background:'rgba(8,4,2,0.97)',border:'1px solid rgba(196,30,58,0.5)',borderRadius:3,padding:'8px 12px',zIndex:99999,pointerEvents:'none',minWidth:180,maxWidth:260,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{member.keyword}</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-bone)',lineHeight:1.4}}>{KEYWORD_DESC[member.keyword]}</div>{member.bio&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',lineHeight:1.4,fontStyle:'italic',marginTop:6,paddingTop:6,borderTop:'1px solid rgba(100,60,20,0.3)'}}>{member.bio}</div>}</div>}
      {buffCount>0&&<div style={{position:'absolute',top:6,left:6,background:buffCount>=3?'#aa1111':'#9933cc',borderRadius:10,padding:'1px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-primary)',zIndex:10,boxShadow:'0 0 8px rgba(0,0,0,0.6)'}}>+{buffCount}</div>}
      {member.encoreReady&&<div style={{position:'absolute',top:6,right:6,background:'#dd2222',borderRadius:10,padding:'1px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-primary)',zIndex:10,boxShadow:'0 0 8px rgba(220,0,0,0.6)',animation:'pulse 0.8s ease infinite alternate'}}>🔁×2</div>}
      {isDiceTarget&&<div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:20}}>🎯</div>}
      {mentorState==='active'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:18,textShadow:'0 0 12px #ffd700',zIndex:12,animation:'mentorPulse 1.5s ease-in-out infinite'}}>⛓</div>}
      {mentorState==='broken'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:16,opacity:0.45,zIndex:12}}>💔</div>}
      {mentorState==='mentor'&&<div style={{position:'absolute',bottom:55,left:'50%',transform:'translateX(-50%)',fontSize:18,textShadow:'0 0 8px rgba(255,215,0,0.6)',zIndex:12}}>⛓</div>}
      {st&&<div style={{position:'absolute',inset:0,zIndex:15,pointerEvents:'none',overflow:'hidden'}}>
        {/* Drifting smoke clouds at varying positions/timings — reads as "passed out" not "dead" */}
        <div style={{position:'absolute',bottom:'18%',left:'12%',fontSize:42,opacity:0.85,animation:'stonedSmoke 3.2s ease-in-out infinite',filter:'drop-shadow(0 0 8px rgba(180,160,200,0.5))'}}>💨</div>
        <div style={{position:'absolute',bottom:'42%',left:'58%',fontSize:36,opacity:0.75,animation:'stonedSmoke 3.6s ease-in-out infinite 0.5s',filter:'drop-shadow(0 0 8px rgba(180,160,200,0.5))'}}>💨</div>
        <div style={{position:'absolute',bottom:'24%',right:'15%',fontSize:46,opacity:0.8,animation:'stonedSmoke 2.9s ease-in-out infinite 1.1s',filter:'drop-shadow(0 0 8px rgba(180,160,200,0.5))'}}>💨</div>
        <div style={{position:'absolute',top:'22%',left:'30%',fontSize:32,opacity:0.7,animation:'stonedSmoke 3.4s ease-in-out infinite 1.7s',filter:'drop-shadow(0 0 8px rgba(180,160,200,0.5))'}}>💨</div>
        {/* Status pill — "back next fight" subtitle removes the "run is over" feeling */}
        <div style={{position:'absolute',bottom:'38%',left:'50%',transform:'translateX(-50%)',
          fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:3,
          background:'linear-gradient(180deg, rgba(80,40,120,0.95), rgba(50,20,80,0.95))',
          color:'#ddc8f0',padding:'5px 12px',borderRadius:3,
          border:'1px solid rgba(160,100,220,0.7)',textTransform:'uppercase',
          textShadow:'0 0 8px rgba(180,100,220,0.8)',
          boxShadow:'0 0 18px rgba(120,60,180,0.5), 0 4px 12px rgba(0,0,0,0.7)',
          whiteSpace:'nowrap'}}>
          😶‍🌫️ Too Stoned
        </div>
        <div style={{position:'absolute',bottom:'30%',left:'50%',transform:'translateX(-50%)',
          fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,letterSpacing:1,
          color:'rgba(220,200,240,0.85)',padding:'2px 8px',
          textShadow:'0 0 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)',
          fontStyle:'italic',whiteSpace:'nowrap'}}>
          Back next fight
        </div>
      </div>}
      <div style={{height:5,borderRadius:'6px 6px 0 0',
        background:st?'#333':member.demonic?'linear-gradient(90deg,#e8a820,#ffd700,#e8a820)':member.mythic?'linear-gradient(90deg,#cc44ff,#ff88ff,#cc44ff)':member.foil?'linear-gradient(90deg,#88ccff,#ffffff,#88ccff)':'linear-gradient(90deg,#dd2222,#ff7700)',
        boxShadow:st?'none':member.demonic?'0 0 14px rgba(255,200,0,0.8)':member.mythic?'0 0 14px rgba(200,0,255,0.7)':member.foil?'0 0 14px rgba(100,180,255,0.7)':'0 0 14px rgba(220,50,0,0.5)'}}/>
      {!st&&(member.demonic||member.mythic||member.foil)&&<div style={{position:'absolute',top:8,right:8,zIndex:10,fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:2,padding:'2px 7px',borderRadius:10,
        background:member.demonic?'rgba(200,160,0,0.3)':member.mythic?'rgba(150,0,220,0.3)':'rgba(80,160,255,0.2)',
        border:'1px solid '+(member.demonic?'#ffd700':member.mythic?'#cc44ff':'#88ccff'),
        color:member.demonic?'#ffd700':member.mythic?'#dd88ff':'#88ccff',
        textShadow:member.demonic?'0 0 8px rgba(255,200,0,0.9)':member.mythic?'0 0 8px rgba(200,0,255,0.9)':'0 0 8px rgba(100,180,255,0.9)'}}>
        {member.demonic?'⛧ DEMONIC':member.mythic?'✦ MYTHIC':'✨ FOIL'}
      </div>}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:68,background:'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45))',position:'relative',minHeight:200,overflow:'hidden'}}>
        {STAGE_PORTRAITS[member.id]?<img className={animPhase==='idle'?'':'squiggle'} src={st&&STONED_PORTRAITS[member.id]?STONED_PORTRAITS[member.id]:animPhase==='idle'&&IDLE_PORTRAITS[member.id]?IDLE_PORTRAITS[member.id]:STAGE_PORTRAITS[member.id]} alt={member.id} style={{width:'95%',height:'95%',objectFit:'contain',objectPosition:'center center',imageRendering:'pixelated'}}/>:member.emoji}
        {isAttacking&&<div style={{position:'absolute',inset:0,background:strikeAnim?'rgba(196,30,58,0.3)':'rgba(196,30,58,0.12)',animation:strikeAnim?'pulse 0.15s ease infinite alternate':'pulse 0.4s ease infinite alternate'}}/>}
        {/* Name overlay on portrait bottom */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 6px 4px',background:'linear-gradient(180deg, transparent, rgba(10,6,8,0.9))',fontFamily:"'BogartsMetalFont',cursive",fontSize:26,color:st?'var(--rot)':'var(--ink-bone)',textAlign:'center',lineHeight:1,textShadow:'0 2px 6px rgba(0,0,0,0.9)'}}>{member.name}</div>
      </div>
      {ghostCard&&!st&&<div style={{position:'absolute',top:4,left:'50%',transform:'translateX(-50%)',zIndex:30,fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--ink-bone)',background:'rgba(10,40,10,0.92)',border:'1px solid #44ff44',borderRadius:3,padding:'3px 8px',whiteSpace:'nowrap',animation:'fadeIn 0.15s ease',letterSpacing:2,textTransform:'uppercase'}}>
        {ghostCard.id==='battlecry'||ghostCard.id==='heavyriff'?'+1 ATK':ghostCard.id==='amp'?'×2 ATK':ghostCard.id==='newstrings'?'+2 HP':ghostCard.id==='roadie'?'+ Shield':ghostCard.id==='encore'?'Encore!':ghostCard.id==='darktuning'?'+ATK (corr)':ghostCard.id==='crowdsurf'?'Draw + ATK':ghostCard.id==='wakeup'?'+2 HP all':ghostCard.effect?ghostCard.effect.slice(0,22)+'…':'Play'}
      </div>}
      {/* Role strip — tight */}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:3,color:st?'var(--rot)':'var(--ink-dim)',textAlign:'center',padding:'4px 4px 2px',textTransform:'uppercase',background:'rgba(10,6,8,0.6)',borderTop:'1px solid rgba(90,56,32,0.25)'}}>{member.role}</div>
      {/* Footer — single compact row */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 12px',background:'rgba(10,6,8,0.85)',borderTop:'1px solid rgba(90,56,32,0.3)'}}>
        <div style={{textAlign:'center',minWidth:32}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'var(--rot)':'var(--blood)',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>ATK</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:26,fontWeight:900,lineHeight:1,color:st?'var(--rot)':'var(--blood)',textShadow:st?'none':'0 0 10px rgba(196,30,58,0.5)'}}><span key={'atk-'+member.atk} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{(()=>{
            if(st)return member.atk
            const base=ALL_MUSICIANS.find(mu=>mu.id===member.id)
            const baseAtk=base?base.atk+(member.demonic?4:member.mythic?2:member.foil?1:0):member.atk
            const permBonus=member.atk-baseAtk
            const _previewKwTier=corruptTier||0
            const corrBonus=member.keyword==='CORRUPT'&&corruption>0?Math.floor(corruption/12)*Math.max(1,_previewKwTier):0
            const totalBonus=permBonus+corrBonus
            if(totalBonus>0)return <>{baseAtk}<span style={{fontSize:18,color:'var(--gold)'}}>+{totalBonus}</span></>
            return member.atk
          })()}</span></div>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'var(--rot)':'var(--gold)',fontWeight:900,letterSpacing:2,textAlign:'center',textTransform:'uppercase'}}>{member.keyword}</div>
        <div style={{textAlign:'center',minWidth:32}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:st?'var(--rot)':nearDeath?'var(--blood)':'#33dd33',textTransform:'uppercase',fontWeight:900,letterSpacing:1}}>HP</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,lineHeight:1,color:st?'var(--rot)':nearDeath?'var(--blood)':'#33dd33',textShadow:st?'none':nearDeath?'0 0 12px rgba(196,30,58,0.7)':'0 0 10px rgba(0,190,0,0.4)'}}><span key={'hp-'+member.hp} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{member.hp}</span></div>
        </div>
      </div>
      <div style={{height:4,background:'rgba(0,0,0,0.7)',borderRadius:'0 0 4px 4px'}}><div style={{height:'100%',borderRadius:'0 0 4px 4px',background:st?'var(--rot)':'linear-gradient(90deg,#003800,#33dd33)',width:`${(member.hp/member.maxHp)*100}%`,transition:'width 0.4s ease'}}/></div>
    </div>
  )
}

function HandCard({card,index,total,isHovered,isSelected,anyHovered,canAfford,onHover,onLeave,onClick,onDragStart,onDragEnd,isDragging,isShopBought,isDragOver,onHandDragOver,onHandDrop,isUsed,lastRiffPlayed,chainHintsOn,hoverZoomOn,chainReady,corruption}){
  const mastery=getMasteryTier(card.id)
  const spread=Math.min(4,20/total),mid=(total-1)/2
  const rot=(index-mid)*spread,yOff=Math.abs(index-mid)*2
  const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
  const glow=card.type==='CORRUPT'?'rgba(170,0,0,0.5)':card.type==='UTILITY'?'rgba(30,160,50,0.5)':card.type==='EMBER'?'rgba(200,120,20,0.5)':'rgba(140,40,200,0.5)'
  const unaffordable=!canAfford&&card.embers>0
  const corrLocked=card.corrReq&&(corruption||0)<card.corrReq
  const shimmerAnim=card.upgraded?'upgradeShimmer 2s ease-in-out infinite':card.rarity==='Rare'?'holoShimmer 3s ease-in-out infinite':card.rarity==='Uncommon'?'uncommonGlow 2s ease-in-out infinite':''
  const masteryBorder=mastery.border?{borderTop:'2px solid '+mastery.border,boxShadow:'inset 0 2px 8px '+mastery.glow}:{}
  return(
    <div draggable
      onDragStart={e=>{e.dataTransfer.effectAllowed='move';onDragStart(index)}}
      onDragEnd={onDragEnd}
      onDragOver={e=>{e.preventDefault();onHandDragOver&&onHandDragOver()}}
      onDrop={e=>{e.stopPropagation();onHandDrop&&onHandDrop()}}
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={e=>{e.stopPropagation();onClick()}}
      style={{width:210,height:310,flexShrink:0,position:'relative',cursor:'grab',userSelect:'none',
        zIndex:isDragging?0:isHovered?9999:isSelected?50+index:10+index,
        margin:total>HAND_SIZE?'0 -28px':'0 -22px'}}>
      {/* v0.7.13 hover-jitter fix: this outer wrapper NEVER transforms, so the hover
          hitbox stays put. All visuals + transform live on the inner div below.
          Hit-testing treats a transformed child as part of its parent, so hover covers
          the static slot AND the popped-up card — no more enter/leave feedback loop. */}
      <div style={{width:'100%',height:'100%',position:'relative',display:'flex',flexDirection:'column',
        background:isSelected?'linear-gradient(180deg, #2a0c10, #160608)':'linear-gradient(180deg, var(--altar-raised), var(--altar-recess))',
        border:isSelected?'2px solid var(--blood)':unaffordable?'1px solid var(--rot)':corrLocked?'1px solid #6622aa':isHovered?'1px solid var(--ink-bone)':'1px solid var(--ink-rust)',
        borderRadius:4,
        outline:isHovered||isSelected?'1px solid rgba(232,216,184,0.2)':'1px solid rgba(232,216,184,0.06)',
        outlineOffset:'-5px',
        transformOrigin:'bottom center',
        transform:isDragging?'scale(0.85) rotate(5deg)':isHovered?(hoverZoomOn?'translateY(-80px) scale(1.5) rotate(0deg)':'translateY(-40px) scale(1.0) rotate(0deg)'):isSelected?`rotate(${rot}deg) translateY(-50px)`:`rotate(${rot}deg) translateY(${yOff}px)`,
        transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
        boxShadow:isSelected?'0 0 0 2px #cc0000,0 0 22px rgba(200,0,0,0.75),0 0 45px rgba(180,0,0,0.4)':isShopBought?`0 0 12px ${bc}44`:isHovered?`0 36px 72px rgba(0,0,0,0.95),0 0 36px ${glow}`:chainReady&&canAfford?'2px 4px 16px rgba(0,0,0,0.75),0 0 14px rgba(255,220,50,0.5),0 0 28px rgba(255,200,0,0.2)':(mastery.glow?'2px 4px 16px rgba(0,0,0,0.75),0 0 8px '+mastery.glow:'2px 4px 16px rgba(0,0,0,0.75)'),
        opacity:isDragging?0.4:unaffordable?0.55:corrLocked?0.6:1,filter:(corruption||0)>=80?'hue-rotate(-10deg) saturate(1.4) brightness(0.95)':(corruption||0)>=60?'saturate(1.2)':'none',
        animation:chainReady&&canAfford?'riffChainGlow 1.2s ease-in-out infinite':shimmerAnim,
        willChange:isHovered?'transform':'auto'}}>
      {/* Hand-drawn top stripe — SVG path with wobble */}
      <svg style={{position:'absolute',top:0,left:0,right:0,width:'100%',height:8,pointerEvents:'none',zIndex:2}} viewBox="0 0 210 8" preserveAspectRatio="none">
        <path d="M 0 0 L 210 0 L 210 4 Q 160 6, 105 4 T 0 4 Z" fill={unaffordable?'var(--rot)':bc} opacity="0.9"/>
        <path d="M 2 5 Q 52 3, 105 5 T 208 5" stroke={unaffordable?'var(--rot)':bc} strokeWidth="0.8" fill="none" opacity="0.4"/>
      </svg>
      {isUsed&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.85)',border:'2px solid #888',borderRadius:6,padding:'6px 14px',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-muted)',letterSpacing:4,zIndex:20,pointerEvents:'none'}}>USED</div>}
      {card.embers>0?(
        <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',alignItems:'center',gap:2,zIndex:3}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:canAfford?'radial-gradient(circle at 30% 30%, #e8402f, #8a0c14 60%, #5c0810)':'radial-gradient(circle at 30% 30%, #3a1f18, #1a0c08)',border:canAfford?'1px solid var(--blood)':'1px solid var(--rot)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:canAfford?'var(--ink-bone)':'var(--rot)',boxShadow:canAfford?'0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,150,140,0.3)':'none'}}>{card.embers}</div>
          {!canAfford&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--blood)',letterSpacing:1,whiteSpace:'nowrap',textShadow:'0 0 8px rgba(196,30,58,0.9)',background:'rgba(0,0,0,0.85)',borderRadius:2,padding:'1px 4px'}}>NEED {card.embers}</div>}
        </div>
      ):(
        <div style={{position:'absolute',top:10,right:10,zIndex:3}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%, #3a2818, #1c1208 60%, #0a0604)',border:'1px solid var(--ink-dim)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--ink-dim)',boxShadow:'0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(100,80,60,0.2)'}}>0</div>
        </div>
      )}
      {card.foil&&<div style={{position:'absolute',top:12,left:10,padding:'2px 5px',borderRadius:2,background:'rgba(200,152,56,0.3)',border:'1px solid var(--gold)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',letterSpacing:2,zIndex:3,textTransform:'uppercase'}}>✨ Foil</div>}
      {card.mythic&&<div style={{position:'absolute',top:12,left:10,padding:'2px 5px',borderRadius:2,background:'rgba(120,0,180,0.4)',border:'1px solid #cc44ff',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#cc44ff',letterSpacing:2,zIndex:3,textTransform:'uppercase'}}>⛧ Mythic</div>}
      {chainReady&&canAfford&&<div style={{position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',padding:'2px 10px',borderRadius:3,background:'rgba(200,152,56,0.3)',border:'1px solid var(--gold)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',letterSpacing:3,zIndex:99999,whiteSpace:'nowrap',textTransform:'uppercase'}}>⛧ Chain</div>}
      {card.rarity==='Rare'&&!card.foil&&!card.mythic&&<div style={{position:'absolute',top:12,left:10,padding:'2px 5px',borderRadius:2,background:'rgba(200,152,56,0.18)',border:'1px solid rgba(200,152,56,0.4)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',letterSpacing:2,zIndex:3,textTransform:'uppercase'}}>Rare</div>}
      {card.rarity==='Uncommon'&&!card.foil&&!card.mythic&&<div style={{position:'absolute',top:12,left:10,padding:'2px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--ink-dim)',letterSpacing:2,zIndex:3}}>✦</div>}
      {mastery.border&&<div style={{position:'absolute',bottom:4,left:4,padding:'1px 5px',borderRadius:2,background:'rgba(0,0,0,0.75)',border:'1px solid '+mastery.border+'88',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:mastery.color,letterSpacing:1,textTransform:'uppercase',zIndex:5}}>{mastery.name}</div>}
      {/* CORRUPTION REQUIREMENT BADGE — shows when card needs more corruption than the player currently has */}
      {card.corrReq&&(corruption||0)<card.corrReq&&<div style={{position:'absolute',top:-10,right:8,padding:'3px 9px',borderRadius:3,background:'rgba(60,0,90,0.96)',border:'1.5px solid #cc44ff',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--tier-mythic)',letterSpacing:2,zIndex:99999,whiteSpace:'nowrap',textTransform:'uppercase',boxShadow:'0 0 12px rgba(180,80,240,0.6),0 4px 12px rgba(0,0,0,0.9)',textShadow:'0 0 8px rgba(204,68,255,0.8)'}}>🌑 Need {card.corrReq}% Corr</div>}
      <div style={{height:180,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15))',position:'relative',marginTop:4}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at center,${bc}22,transparent 70%)`}}/>
        <CardArtImg id={card.id} emoji={card.emoji} size={120}/>
      </div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:18,fontWeight:700,color:'var(--ink-bone)',textAlign:'center',padding:'4px 5px 1px',letterSpacing:.4,lineHeight:1,flexShrink:0}}>{card.name}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:bc,textAlign:'center',padding:'2px 4px',letterSpacing:2.5,textTransform:'uppercase',flexShrink:0,opacity:0.9}}>{card.type}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--ink-bone)',textAlign:'center',padding:'4px 8px 6px',lineHeight:1.2,flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{card.id==='demotape'?(lastRiffPlayed?'📼 Will replay: '+lastRiffPlayed.name+' (free)':'📼 No riff recorded yet — play a RIFF card first'):(<>{card.effect||card.desc||''}{card.upgraded&&CARD_UPGRADES[card.id]&&<div style={{marginTop:6,padding:'3px 8px',background:'rgba(200,152,56,0.15)',border:'1px solid rgba(200,152,56,0.4)',borderRadius:2,color:'var(--gold)',fontSize:13,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>⛧ {CARD_UPGRADES[card.id].desc}</div>}</>)}</div>
      {/* Chain hints tooltip — absolutely positioned BELOW the card so it never clips card content */}
      {isHovered&&chainHintsOn&&(()=>{const hints=getChainHints(card.id);return hints.length>0?<div style={{position:'absolute',top:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',width:230,zIndex:99999,pointerEvents:'none',display:'flex',flexDirection:'column',gap:3}}>{hints.map((h,i)=><div key={i} style={{padding:'5px 8px',background:'rgba(8,4,2,0.96)',border:'1px solid var(--gold)',borderRadius:3,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',fontWeight:900,textAlign:'center',letterSpacing:1,boxShadow:'0 4px 16px rgba(0,0,0,0.9), 0 0 12px rgba(232,168,32,0.3)'}}>⛧ {h.name} — needs {h.partnerName}</div>)}</div>:null})()}
    </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// DAMAGE BREAKDOWN — Balatro-style number-go-up animation
// ═══════════════════════════════════════════════════════════
// ── CASCADE TIMING — SINGLE SOURCE OF TRUTH (Aug 4 2026, phase 3) ────────────
// DamageBreakdown reveals one line at a time with a magnitude-scaled delay, then slams.
// handleStrikeBody has to schedule its slam-race safety net and the boss counter-attack
// AROUND that slam. Those two used to be independent guesses (lines*720+900 vs
// lines*140+2300) that grew at wildly different rates, so on multi-multiplier strikes
// the component was unmounted mid-cascade and onSlam never ran. Both sides now call
// these helpers, so the ordering holds at every line count and both speeds.
function cascadeLineDelay(line,isFast){
  if(isFast)return 90
  const base=180
  if(line&&line.type==='multiply'&&line.mult){
    if(line.mult>=5)return 700
    if(line.mult>=3)return 500
    if(line.mult>=2)return 380
    if(line.mult>=1.5)return 280
    return base
  }
  return base
}
function cascadeSlamAt(lines,isFast){
  let cum=0
  ;(lines||[]).forEach(l=>{cum+=cascadeLineDelay(l,isFast)})
  return cum+(isFast?200:400)
}

function DamageBreakdown({data,onDone,onSlam}){
  const [visibleCount,setVisibleCount]=useState(0)
  const [slamming,setSlamming]=useState(false)
  const [tickerMult,setTickerMult]=useState(1.0)  // climbing TOTAL multiplier (the star)
  // FEEL-PASS STATE:
  // floatingNums: array of {id, text, color, x, y, age, life} — slamming numbers that pile up
  // particles:    array of {id, x, y, vx, vy, color, age, life} — sparks/debris bursts
  // sourceEmojis: array of {id, emoji, color} — persistent row of mult sources below ticker
  const [floatingNums,setFloatingNums]=useState([])
  const [particles,setParticles]=useState([])
  const [sourceEmojis,setSourceEmojis]=useState([])
  // Ref tracks current floating num count so stack positioning works in closure
  const floatingCountRef=useRef(0)
  const lines=data.lines||[]
  const total=data.total||0
  const totalMult=data.totalMult||1.0
  const cascadeMults=data.cascadeMults||[]
  // Speed comes from the strike that built this payload. Reading localStorage here
  // desynced from handleStrikeBody whenever speed was toggled by HOLDING SPACE (which
  // sets speedMode without writing vst_speed) — the cascade and the timers that wrap it
  // would then run on different clocks.
  const isFast=data._fast!==undefined?!!data._fast:localStorage.getItem('vst_speed')==='fast'

  // Magnitude-scaled delay — bigger multipliers pause longer. Shared with the strike body.
  function lineDelay(line){return cascadeLineDelay(line,isFast)}

  // 666 special tier (600-699 range)
  const isDevilDeal=total>=600&&total<700

  // Drum audio helpers — share one AudioContext per call, layer drums for nonstop reward feel
  function playKick(velocity){
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)()
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.type='sine';o.frequency.setValueAtTime(140,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(50,ctx.currentTime+0.1)
      g.gain.setValueAtTime(velocity*0.4,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.18)
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.18)
    }catch(e){}
  }
  function playSnare(velocity){
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)()
      // White noise burst for the crack
      const buf=ctx.createBuffer(1,2048,ctx.sampleRate)
      const data=buf.getChannelData(0)
      for(let i=0;i<2048;i++)data[i]=(Math.random()*2-1)*0.7
      const src=ctx.createBufferSource();src.buffer=buf
      const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1200
      const g=ctx.createGain();g.gain.setValueAtTime(velocity*0.25,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12)
      src.connect(f);f.connect(g);g.connect(ctx.destination);src.start();src.stop(ctx.currentTime+0.12)
    }catch(e){}
  }
  function playDrumFill(){
    // Kick + snare hits in quick succession, ending with crash
    try{
      playKick(1.0)
      setTimeout(()=>playSnare(0.9),60)
      setTimeout(()=>playKick(0.9),120)
      setTimeout(()=>playSnare(1.0),180)
      // Crash cymbal — high-pass noise
      setTimeout(()=>{
        const ctx=new(window.AudioContext||window.webkitAudioContext)()
        const buf=ctx.createBuffer(1,8192,ctx.sampleRate)
        const data=buf.getChannelData(0)
        for(let i=0;i<8192;i++)data[i]=(Math.random()*2-1)*0.6
        const src=ctx.createBufferSource();src.buffer=buf
        const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=4000
        const g=ctx.createGain();g.gain.setValueAtTime(0.35,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.6)
        src.connect(f);f.connect(g);g.connect(ctx.destination);src.start();src.stop(ctx.currentTime+0.6)
      },240)
    }catch(e){}
  }

  // Trigger per-event feel: flash, mini-shake, particles, floating number, source emoji
  function fireEventFeel(line,multSoFar){
    const multVal=line.mult||1.0
    // 1. SCREEN FLASH — color tinted to mult source. Quick body-bg pulse.
    const flashColor=line.color||'#e8a820'
    try{
      // Tiny screen shake — magnitude scales with mult
      const shakeMag=multVal>=3?5:multVal>=2?4:3
      const _root=document.getElementById('root')
      if(_root){
        // Only override if not already in big slam shake
        _root.style.transition='transform 60ms ease-out'
        _root.style.transform='translate('+((Math.random()-0.5)*shakeMag*2)+'px,'+((Math.random()-0.5)*shakeMag*2)+'px)'
        setTimeout(()=>{if(_root)_root.style.transform='translate(0,0)'},80)
      }
      // Color-tinted flash overlay — fade quickly
      const flash=document.createElement('div')
      flash.style.cssText='position:fixed;inset:0;background:'+flashColor+';opacity:'+(multVal>=3?0.18:multVal>=2?0.12:0.08)+';z-index:99996;pointer-events:none;mix-blend-mode:screen'
      document.body.appendChild(flash)
      setTimeout(()=>{flash.style.transition='opacity 200ms ease-out';flash.style.opacity='0';setTimeout(()=>{try{flash.remove()}catch(e){}},220)},20)
    }catch(e){}

    // 2. PARTICLE BURST — radial sparks, count scales with mult
    const partCount=Math.min(24,Math.round(6+multVal*4))
    const newParts=[]
    const cx=window.innerWidth/2,cy=window.innerHeight/2-50
    const burstId=Date.now()+Math.random()
    for(let i=0;i<partCount;i++){
      const angle=(Math.PI*2*i)/partCount+Math.random()*0.4
      const speed=2+Math.random()*4+(multVal>=2?2:0)
      newParts.push({
        id:burstId+'-'+i,
        x:cx,y:cy,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed-1, // slight upward bias
        color:flashColor,
        age:0,
        life:isFast?20:35
      })
    }
    setParticles(p=>[...p,...newParts])

    // 3. FLOATING SLAMMING NUMBER — flies in from random off-side, settles in pile
    // Pile is a column to the RIGHT of the climbing mult. Each new number stacks below the last.
    const floatId=Date.now()+'-'+Math.random()
    const sideOffset=(Math.random()<0.5?-1:1)*(180+Math.random()*80)
    const targetX=170 + (Math.random()*40-20) // pile is to the right of center
    const stackIdx=floatingCountRef.current
    floatingCountRef.current++
    const targetY=-30+stackIdx*38 // each number stacks 38px below the previous
    setFloatingNums(p=>[...p,{
      id:floatId,
      text:'×'+multVal.toFixed(2),
      color:flashColor,
      label:line.emoji||'',
      startX:sideOffset,
      startY:-100, // above
      x:targetX,
      y:targetY,
      age:0,
      life:isFast?60:120,
      mult:multVal
    }])

    // 4. SOURCE EMOJI STACK — append the source emoji to the persistent row
    if(line.emoji){
      const emId=Date.now()+'-em-'+Math.random()
      setSourceEmojis(p=>[...p,{id:emId,emoji:line.emoji,color:flashColor}])
    }

    // 5. AUDIO: kick on every mult, snare on ≥2x, sub-bass rumble on ≥2.5x
    const velocity=Math.min(1.0,0.5+multVal*0.15)
    playKick(velocity)
    if(multVal>=2)setTimeout(()=>playSnare(Math.min(1.0,velocity)),40)
    // Existing ascending pitch tone — KEEP, layer on top
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)()
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.type='sine';o.frequency.value=400+visibleCount*80
      g.gain.value=0.15;o.connect(g);g.connect(ctx.destination)
      o.start();o.stop(ctx.currentTime+0.08)
      if(multVal>=2.5){
        const o2=ctx.createOscillator(),g2=ctx.createGain()
        o2.type='triangle';o2.frequency.value=80+multVal*15
        g2.gain.value=0.18;o2.connect(g2);g2.connect(ctx.destination)
        o2.start();o2.stop(ctx.currentTime+0.18)
      }
    }catch(e){}
  }

  // Particle physics tick — runs while particles exist
  useEffect(()=>{
    if(particles.length===0)return
    const tick=setInterval(()=>{
      setParticles(prev=>prev
        .map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+0.35,age:p.age+1}))
        .filter(p=>p.age<p.life)
      )
    },isFast?20:30)
    return()=>clearInterval(tick)
  },[particles.length>0])

  // Floating numbers physics tick — slam in, settle, then fade up
  useEffect(()=>{
    if(floatingNums.length===0)return
    const tick=setInterval(()=>{
      setFloatingNums(prev=>prev
        .map(f=>({...f,age:f.age+1}))
        .filter(f=>f.age<f.life)
      )
    },isFast?20:30)
    return()=>clearInterval(tick)
  },[floatingNums.length>0])

  useEffect(()=>{
    let cumDelay=0
    const timers=[]
    let multSoFar=1.0
    lines.forEach((line,i)=>{
      const t=setTimeout(()=>{
        setVisibleCount(i+1)
        // For multiply lines, climb the visible mult counter + fire all the feel-pass effects
        if(line.type==='multiply'&&line.mult){
          multSoFar=Math.round(multSoFar*line.mult*100)/100
          setTickerMult(multSoFar)
          fireEventFeel(line,multSoFar)
        }
      },cumDelay)
      timers.push(t)
      cumDelay+=lineDelay(line)
    })
    const slamAt=cumDelay+(isFast?200:400)
    const slamTimer=setTimeout(()=>{
      setSlamming(true)
      // Full drum kit fill on slam
      playDrumFill()
      if(onSlam)onSlam()
      try{
        const _root=document.getElementById('root')
        _root.style.animation='none';_root.offsetHeight
        if(isDevilDeal){
          _root.style.animation='screenShake 0.7s ease,acidTrip 1.5s ease-out'
          document.body.style.background='#660000';setTimeout(()=>{document.body.style.background='#000'},120)
          // Demonic chant — three-tone descending
          try{
            const ctx=new(window.AudioContext||window.webkitAudioContext)()
            const tones=[110,87.31,82.41]
            tones.forEach((freq,i)=>{
              setTimeout(()=>{
                const o=ctx.createOscillator(),g=ctx.createGain()
                o.type='sawtooth';o.frequency.value=freq
                g.gain.value=0.22;o.connect(g);g.connect(ctx.destination)
                o.start();o.stop(ctx.currentTime+0.4)
              },i*80)
            })
          }catch(e){}
          // Massive particle burst at slam for 666
          const newParts=[]
          const cx=window.innerWidth/2,cy=window.innerHeight/2
          for(let i=0;i<60;i++){
            const angle=(Math.PI*2*i)/60+Math.random()*0.3
            const speed=4+Math.random()*8
            newParts.push({id:'devil-'+i,x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color:'#ff2200',age:0,life:60})
          }
          setParticles(p=>[...p,...newParts])
        } else if(total>=10000){
          _root.style.animation='screenShake 0.6s ease,acidTrip 1.5s ease-out'
          document.body.style.background='#fff';setTimeout(()=>{document.body.style.background='#000'},80)
        }else if(total>=5000){
          _root.style.animation='screenShake 0.5s ease'
          document.body.style.background='#ff2200';setTimeout(()=>{document.body.style.background='#000'},60)
        }else if(total>=2500){
          _root.style.animation='screenShake 0.5s ease'
          document.body.style.background='#881100';setTimeout(()=>{document.body.style.background='#000'},40)
        }else if(total>=1000){
          _root.style.animation='screenShake 0.4s ease'
        }else if(total>=500){
          _root.style.animation='screenShake 0.3s ease'
        }else if(total>=200){
          _root.style.animation='screenPulse 0.3s ease'
        }else if(total>=50){
          _root.style.animation='screenPulse 0.15s ease'
        }
        const _splashTier=isDevilDeal?'devil':total>=10000?'godlike':total>=5000?'ultra':total>=2500?'devastating':total>=1000?'massive':total>=500?'critical':total>=200?'heavy':total>=50?'solid':null
        if(_splashTier){
          const _fx=document.createElement('video')
          _fx.src=import.meta.env.BASE_URL+'vestibule/fx/'+_splashTier+'.webm'
          _fx.autoplay=true;_fx.muted=true;_fx.playsInline=true
          _fx.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:99997;pointer-events:none;mix-blend-mode:screen'
          _fx.onended=()=>_fx.remove()
          _fx.onerror=()=>_fx.remove()
          document.body.appendChild(_fx)
          setTimeout(()=>{try{_fx.remove()}catch(e){}},3000)
        }
      }catch(e){}
    },slamAt)
    timers.push(slamTimer)
    const doneTimer=setTimeout(()=>{if(onDone)onDone()},slamAt+(isDevilDeal?2000:1200))
    timers.push(doneTimer)
    return()=>{timers.forEach(clearTimeout)}
    // Aug 4 2026 (phase 3): this was keyed on [lines.length] alone, so it captured
    // total / onSlam / isDevilDeal from the render it FIRST ran in. Combined with the
    // element having no `key`, a new breakdown with an equal line count reused the same
    // instance and never re-scheduled — no cascade, and onSlam calling the PREVIOUS
    // strike's _pendingHpDrop. The element now carries data.key, and the effect keys on
    // the payload identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[data])

  const slamAnim=`@keyframes screenShake{0%,100%{transform:translate(0,0)}10%{transform:translate(-6px,4px)}20%{transform:translate(8px,-3px)}30%{transform:translate(-4px,6px)}40%{transform:translate(6px,-2px)}50%{transform:translate(-3px,3px)}60%{transform:translate(4px,-4px)}70%{transform:translate(-2px,2px)}80%{transform:translate(3px,-1px)}90%{transform:translate(-1px,1px)}}
      @keyframes screenPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.008)}}
      @keyframes acidTrip{0%{filter:none}15%{filter:hue-rotate(60deg) saturate(2) brightness(1.3)}30%{filter:hue-rotate(120deg) saturate(3) brightness(1.1)}50%{filter:hue-rotate(200deg) saturate(2.5) brightness(1.2)}70%{filter:hue-rotate(300deg) saturate(2) brightness(1.1)}85%{filter:hue-rotate(340deg) saturate(1.5)}100%{filter:none}}
      @keyframes strikeGlow{0%{box-shadow:0 0 10px rgba(255,100,0,0.3)}100%{box-shadow:0 0 25px rgba(255,100,0,0.6)}}
      @keyframes strikeBlaze{0%{box-shadow:0 0 20px rgba(255,50,0,0.4);transform:scale(1)}100%{box-shadow:0 0 40px rgba(255,50,0,0.8);transform:scale(1.03)}}
      @keyframes strikeInferno{0%{box-shadow:0 0 30px rgba(255,0,0,0.6);transform:scale(1) rotate(-0.5deg)}100%{box-shadow:0 0 60px rgba(255,0,0,1),0 0 100px rgba(255,100,0,0.5);transform:scale(1.05) rotate(0.5deg)}}
      @keyframes hpBarCritical{0%,100%{opacity:1}50%{opacity:0.7}}
      @keyframes dmgPreviewPulse{0%{transform:scale(1.15);color:#ff4400}100%{transform:scale(1);color:var(--blood)}}
      @keyframes postStrikeFlash{0%{opacity:0;transform:scale(0.8)}20%{opacity:1;transform:scale(1.05)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.95) translateY(-20px)}}
      @keyframes heartbeat{0%,100%{opacity:0.55}50%{opacity:0.85}}
      @keyframes chainSlam{0%{opacity:0;transform:translate(-50%,-50%) scale(2.5)}15%{opacity:1;transform:translate(-50%,-50%) scale(0.9)}25%{transform:translate(-50%,-50%) scale(1.05)}35%{transform:translate(-50%,-50%) scale(1)}75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(0.8) translateY(-40px)}}
      /* slamScale — same dramatic scale/opacity beats as chainSlam, but WITHOUT
         translate(-50%,-50%). Use for elements that are already centered by their
         flex parent (mythic unlock overlay, combo flash). chainSlam's translate
         is meant for position:absolute;left:50%;top:50% elements (chainCallout)
         and shifts flex children off-center by 50% of their own width, which
         pushed the mythic-unlock title hard left. */
      @keyframes slamScale{0%{opacity:0;transform:scale(2.5)}15%{opacity:1;transform:scale(0.9)}25%{transform:scale(1.05)}35%{transform:scale(1)}75%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.8) translateY(-40px)}}
      @keyframes artifactTrigger{0%{box-shadow:0 0 0 rgba(232,168,32,0)}50%{box-shadow:0 0 20px rgba(232,168,32,0.8)}100%{box-shadow:0 0 0 rgba(232,168,32,0)}}
      @keyframes memberDistress{0%{transform:translateX(0)}100%{transform:translateX(2px)}}
      @keyframes newBadgePulse{0%,100%{opacity:0.7}50%{opacity:1}} @keyframes dmgSlam{0%{transform:scale(2.5);opacity:0}30%{transform:scale(0.9);opacity:1}50%{transform:scale(1.15)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
      @keyframes lineSlamSmall{0%{transform:translateX(30px) scale(1.0);opacity:0}50%{transform:translateX(0) scale(1.08);opacity:1}100%{transform:translateX(0) scale(1);opacity:1}}
      @keyframes lineSlamMed{0%{transform:translateX(40px) scale(1.3);opacity:0}40%{transform:translateX(-4px) scale(1.18);opacity:1}70%{transform:translateX(2px) scale(1.04)}100%{transform:translateX(0) scale(1);opacity:1}}
      @keyframes lineSlamBig{0%{transform:translateX(60px) scale(1.6);opacity:0;text-shadow:0 0 0 rgba(255,150,0,0)}30%{transform:translateX(-8px) scale(1.35);opacity:1;text-shadow:0 0 28px rgba(255,150,0,0.95)}60%{transform:translateX(4px) scale(1.1);text-shadow:0 0 18px rgba(255,150,0,0.6)}100%{transform:translateX(0) scale(1);opacity:1;text-shadow:0 0 8px rgba(255,150,0,0.4)}}
      @keyframes multClimb{0%{transform:scale(1.5);color:#ffdd44}50%{transform:scale(1.15)}100%{transform:scale(1);color:#ff8800}}
      @keyframes multClimbBig{0%{transform:scale(2);color:#ff2200;text-shadow:0 0 50px rgba(255,50,0,1),0 0 100px rgba(255,100,0,0.6)}40%{transform:scale(1.3);color:#ff6600}100%{transform:scale(1);color:#ff8800;text-shadow:0 0 20px rgba(255,100,0,0.6)}}
      @keyframes devilPulse{0%,100%{text-shadow:0 0 25px rgba(255,0,0,0.95),0 0 60px rgba(180,0,0,0.7),0 4px 0 #220000}50%{text-shadow:0 0 50px rgba(255,40,0,1),0 0 100px rgba(255,0,0,0.6),0 4px 0 #440000}}
      @keyframes emojiPopIn{0%{transform:scale(2.5) rotate(-15deg);opacity:0}50%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}`

  // Pick mult ticker color/size based on its size
  const multSize=tickerMult>=666?180:tickerMult>=100?140:tickerMult>=50?120:tickerMult>=20?100:tickerMult>=10?86:tickerMult>=5?72:tickerMult>=3?60:tickerMult>=2?52:44
  const multColor=tickerMult>=666?'#ff0000':tickerMult>=100?'#ff2200':tickerMult>=50?'#ff4400':tickerMult>=20?'#ff6600':tickerMult>=10?'#ff8800':tickerMult>=5?'#ffaa00':tickerMult>=3?'#ffcc00':tickerMult>=2?'#e8a820':'#c8a060'
  const multGlow=tickerMult>=100?'0 0 50px rgba(255,50,0,1),0 0 100px rgba(255,100,0,0.6)':tickerMult>=20?'0 0 35px rgba(255,100,0,0.9),0 0 70px rgba(255,150,0,0.4)':tickerMult>=5?'0 0 22px rgba(255,150,0,0.7)':'0 0 14px rgba(232,168,32,0.5)'
  const multAnim=tickerMult>=10?'multClimbBig 0.5s ease-out':'multClimb 0.4s ease-out'

  return(<>
    <style>{slamAnim}</style>

    {/* PARTICLE LAYER — full-viewport overlay, behind everything else */}
    <div style={{position:'fixed',inset:0,zIndex:9498,pointerEvents:'none',overflow:'hidden'}}>
      {particles.map(p=>{
        const fade=Math.max(0,1-(p.age/p.life))
        return(<div key={p.id} style={{
          position:'absolute',
          left:p.x,top:p.y,
          width:6,height:6,
          background:p.color,
          borderRadius:'50%',
          boxShadow:'0 0 10px '+p.color+', 0 0 20px '+p.color,
          opacity:fade,
          transform:'translate(-50%,-50%)'
        }}/>)
      })}
    </div>

    {/* FLOATING SLAM NUMBERS — pile to the right of the centerpiece, fly in from off-side */}
    <div style={{position:'absolute',top:'50%',left:'50%',zIndex:9501,pointerEvents:'none',transform:'translate(-50%,-50%)'}}>
      {floatingNums.map(f=>{
        // Phase 1 (age 0-12): slam in from sideOffset to target position
        // Phase 2 (12-life-30): hold in pile
        // Phase 3 (life-30 to life): float up + fade
        const phase1=Math.min(1,f.age/12)
        const inX=f.startX+(f.x-f.startX)*phase1
        const inY=f.startY+(f.y-f.startY)*phase1
        const fadePhase=f.age>(f.life-30)?(f.age-(f.life-30))/30:0
        const finalX=inX
        const finalY=inY-(fadePhase*40)
        const opacity=1-fadePhase
        const scale=phase1<1?(2-phase1):(1-fadePhase*0.2)
        const fontSize=f.mult>=3?44:f.mult>=2?38:32
        return(<div key={f.id} style={{
          position:'absolute',
          left:finalX,top:finalY,
          fontFamily:"'MBScribblesFont',serif",
          fontSize:fontSize,
          fontWeight:900,
          color:f.color,
          textShadow:'0 0 20px '+f.color+', 0 0 40px '+f.color+', 0 3px 0 #220000',
          letterSpacing:2,
          transform:'translate(-50%,-50%) scale('+scale+')',
          opacity:opacity,
          whiteSpace:'nowrap',
          willChange:'transform,opacity',
          textTransform:'uppercase'
        }}>{f.label} {f.text}</div>)
      })}
    </div>

    {/* MAIN CASCADE PANEL — climbing mult + breakdown */}
    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9500,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:0,minWidth:380}}>

      {/* CLIMBING MULTIPLIER — the centerpiece. Grows from ×1 into the thousands. */}
      {!slamming&&visibleCount>0&&<div key={tickerMult} style={{
        fontFamily:"'MBScribblesFont',serif",
        fontSize:multSize,
        fontWeight:900,
        color:multColor,
        textShadow:multGlow+',0 4px 0 #220000',
        letterSpacing:3,
        marginBottom:8,
        animation:multAnim,
        lineHeight:1
      }}>×{tickerMult.toFixed(2)}</div>}

      {/* SOURCE EMOJI STACK — persistent row showing what stacked */}
      {!slamming&&sourceEmojis.length>0&&<div style={{
        display:'flex',
        gap:6,
        marginBottom:8,
        padding:'6px 14px',
        background:'rgba(0,0,0,0.45)',
        border:'1px solid rgba(232,168,32,0.4)',
        borderRadius:24,
        backdropFilter:'blur(4px)'
      }}>
        {sourceEmojis.map((em,i)=>(
          <div key={em.id} style={{
            fontSize:24,
            animation:i===sourceEmojis.length-1?'emojiPopIn 0.4s ease-out':'none',
            filter:'drop-shadow(0 0 6px '+em.color+')'
          }}>{em.emoji}</div>
        ))}
      </div>}

      <div style={{background:'linear-gradient(180deg,rgba(15,8,2,0.95),rgba(10,5,0,0.98))',border:'2px solid rgba(200,160,40,0.5)',borderRadius:12,padding:'16px 28px 20px',boxShadow:'0 0 60px rgba(0,0,0,0.9),0 0 30px rgba(200,100,0,0.15),inset 0 1px 0 rgba(200,160,40,0.15)',minWidth:340,maxWidth:440}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:16,color:'var(--text-secondary)',textAlign:'center',letterSpacing:4,textTransform:'uppercase',marginBottom:10,opacity:0.7}}>STRIKE BREAKDOWN</div>
        {lines.map((line,i)=>{
          if(i>=visibleCount)return null
          const isLast=i===visibleCount-1
          let popAnim='lineSlamSmall'
          if(line.type==='multiply'&&line.mult){
            if(line.mult>=2.5)popAnim='lineSlamBig'
            else if(line.mult>=1.5)popAnim='lineSlamMed'
          }
          return(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:'1px solid rgba(80,50,10,0.15)',animation:isLast?popAnim+' 0.32s ease-out':'none',opacity:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {line.emoji&&<span style={{fontSize:18}}>{line.emoji}</span>}
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:line.type==='subtotal'?15:14,color:line.color||'#c8a060',fontWeight:line.type==='subtotal'?900:400,letterSpacing:line.type==='subtotal'?2:0,textTransform:line.type==='subtotal'?'uppercase':'none'}}>{line.label}</span>
            </div>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:line.type==='subtotal'?20:line.type==='multiply'||line.type==='add'?17:16,fontWeight:900,color:line.type==='multiply'?'#ff8800':line.type==='add'?'#44cc44':line.type==='subtotal'?'#e8a820':line.color||'#c8a060',textShadow:line.type==='multiply'?'0 0 10px rgba(255,136,0,0.5)':line.type==='subtotal'?'0 0 8px rgba(200,160,40,0.3)':'none'}}>{line.type==='multiply'?line.label2:line.type==='add'?'+'+line.value:line.value}</span>
          </div>)
        })}
      </div>

      {slamming&&<div style={{marginTop:8,textAlign:'center',animation:'dmgSlam 0.5s ease-out forwards'}}>
        <div style={{
          fontFamily:"'MBScribblesFont',serif",
          fontSize:isDevilDeal?108:total>=10000?96:total>=5000?84:total>=2500?72:total>=1000?64:total>=500?56:total>=200?48:total>=50?42:36,
          fontWeight:900,
          color:isDevilDeal?'#ff0000':total>=10000?'#ffffff':total>=5000?'#ffdd00':total>=2500?'#ff8800':total>=1000?'#ff6600':total>=500?'#ff4400':total>=200?'#ee6633':total>=50?'#cc8844':'#aa8866',
          textShadow:isDevilDeal?'0 0 50px rgba(255,0,0,0.95),0 0 100px rgba(180,0,0,0.7),0 4px 0 #220000':'0 0 30px rgba(255,34,0,0.8),0 0 60px rgba(255,100,0,0.4),0 4px 0 #440000',
          letterSpacing:3,
          animation:isDevilDeal?'devilPulse 0.6s ease-in-out infinite':'dmgPulse 1s ease-in-out infinite'
        }}>{total.toLocaleString()}</div>
        <div style={{
          fontFamily:"'BogartsMetalFont',cursive",
          fontSize:isDevilDeal?28:total>=5000?18:14,
          color:isDevilDeal?'#ff2222':total>=5000?'#ffaa00':'#ff6644',
          letterSpacing:isDevilDeal?6:4,
          textTransform:'uppercase',
          marginTop:isDevilDeal?6:2,
          textShadow:isDevilDeal?'0 0 20px rgba(255,0,0,0.9)':'none'
        }}>{isDevilDeal?'⛧ DEAL WITH THE DEVIL ⛧':total>=10000?'⛧ GODLIKE ⛧':total>=5000?'☠ ULTRA KILL':total>=2500?'💀 DEVASTATING':total>=1000?'🔥 MASSIVE HIT':total>=500?'💢 CRITICAL':total>=200?'⚡ HEAVY':total>=50?'SOLID HIT':'HIT'}</div>
      </div>}
    </div>
  </>)
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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:'var(--text-blood)'}}>{t.kills}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1,textTransform:'uppercase'}}>{t.kills===1?'KILL':'KILLS'}</div>
      </div>}

      {/* Best damage */}
      {defeated&&t.bestDamage>0&&<div style={{background:'rgba(0,0,0,0.5)',padding:'2px 6px',textAlign:'center',borderTop:'1px solid rgba(80,50,10,0.2)'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)'}}>BEST HIT</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-gold)'}}>{t.bestDamage.toLocaleString()}</div>
      </div>}

      {/* Stake badge at bottom */}
      {t?.bestStake&&<div style={{background:stakeColor+'22',padding:'2px',textAlign:'center',borderTop:'1px solid '+stakeColor+'44'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:stakeColor,letterSpacing:1}}>{stakeNames[t.bestStake].toUpperCase()}</div>
      </div>}
    </div>)
  }

  return(<div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.99)',display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 40px',overflow:'auto',gap:4}}>
    <style>{glowAnim+revealAnim}</style>
    <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--text-blood)',textShadow:'0 0 30px rgba(180,0,0,0.6),2px 2px 0 #000',letterSpacing:6}}>Hall of Damnation</div>
    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',fontStyle:'italic',marginBottom:2}}>Every boss you have conquered earns a place on this wall</div>
    <div style={{display:'flex',gap:16,marginBottom:6}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',padding:'3px 14px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:4}}>
        {totalDefeated}/28 Defeated
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-blood)',padding:'3px 14px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(150,40,40,0.3)',borderRadius:4}}>
        {totalKills} Total Kills
      </div>
    </div>

    {/* Circle rows */}
    <div style={{display:'flex',flexDirection:'column',gap:1,width:'100%',maxWidth:1400,alignItems:'center',flexShrink:0}}>
      {CIRCLES.map((circle,ci)=>{
        const allDefeated=circle.enemies.every(eid=>trophies[eid])
        return(<div key={ci} style={{display:'flex',alignItems:'center',gap:10,width:'100%'}}>
          {/* Circle label */}
          <div style={{width:140,flexShrink:0,textAlign:'right',paddingRight:10}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:allDefeated?'#e8a820':'#665533',letterSpacing:2,textTransform:'uppercase'}}>
              {circle.emoji} Circle {circle.name.split(' — ')[0]}
            </div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:allDefeated?'#aa8844':'#443322',fontStyle:'italic'}}>
              {circle.name.split(' — ')[1]}
            </div>
            {allDefeated&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',letterSpacing:1,marginTop:1}}>✓ CLEARED</div>}
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
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:trophies['ar_exec']?'#ffd700':'#665533',letterSpacing:2}}>
            🕴 BONUS
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',fontStyle:'italic'}}>
            Welcome to Hell
          </div>
        </div>
        <TrophySlot enemyId="ar_exec" delay={28}/>
      </div>
    </div>

    {/* ═══ MYTHIC MODIFIERS — HIDDEN UNTIL UNLOCKED ═══
        Three states per mythic:
        - Unseen (not in unlocks): blank silhouette ???
        - Seen (in unlocks): full reveal with effect text
        Players discover unlock conditions through play (Balatro-style).
        Cryptic hint shown only to seen+unlocked items. */}
    {(()=>{
      let unlocked=[]
      try{unlocked=JSON.parse(localStorage.getItem('vst_mythic_unlocks')||'[]')}catch(e){}
      const allMythics=[...MYTHIC_ARTIFACTS,...MYTHIC_PEDALS]
      const unlockedCount=allMythics.filter(m=>unlocked.includes(m.unlockId)).length
      return (<div style={{width:'100%',maxWidth:1180,marginTop:18,padding:'14px 20px 16px',background:'linear-gradient(180deg,rgba(40,20,5,0.5),rgba(20,10,3,0.7))',border:'2px solid '+(unlockedCount>0?'#e8a820':'#4a3010'),borderRadius:8,boxShadow:unlockedCount>0?'0 0 24px rgba(232,168,32,0.25)':'none'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:12}}>
          <div style={{fontSize:24,filter:unlockedCount>0?'drop-shadow(0 0 12px rgba(232,168,32,0.7))':'opacity(0.4) brightness(0.6)'}}>⛧</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:unlockedCount>0?'var(--gold)':'var(--ink-dim)',letterSpacing:6,textShadow:unlockedCount>0?'0 0 12px rgba(232,168,32,0.6)':'none'}}>MYTHIC MODIFIERS</div>
          <div style={{fontSize:24,filter:unlockedCount>0?'drop-shadow(0 0 12px rgba(232,168,32,0.7))':'opacity(0.4) brightness(0.6)'}}>⛧</div>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-rust)',textAlign:'center',marginBottom:14,letterSpacing:3,textTransform:'uppercase'}}>{unlockedCount} / {allMythics.length} discovered</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:14}}>
          {allMythics.map((m,i)=>{
            const isUnlocked=unlocked.includes(m.unlockId)
            return (<div key={m.id} style={{
              background:isUnlocked?'linear-gradient(180deg,rgba(60,40,15,0.7),rgba(30,18,5,0.85))':'linear-gradient(180deg,rgba(15,8,3,0.9),rgba(5,3,1,0.95))',
              border:isUnlocked?'2px solid var(--gold)':'1px dashed rgba(80,55,20,0.4)',
              borderRadius:6,padding:'12px 14px',
              boxShadow:isUnlocked?'0 0 16px rgba(232,168,32,0.3), inset 0 0 24px rgba(232,168,32,0.08)':'none',
              minHeight:140,display:'flex',flexDirection:'column',gap:6
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:38,filter:isUnlocked?'drop-shadow(0 0 8px rgba(232,168,32,0.6))':'opacity(0.15) brightness(0.3) blur(2px)'}}>{isUnlocked?m.emoji:'⛌'}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:18,color:isUnlocked?'var(--ink-bone)':'var(--ink-dim)',letterSpacing:1,lineHeight:1.1}}>{isUnlocked?m.name:'???'}</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:isUnlocked?'var(--gold)':'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',marginTop:2}}>
                    {isUnlocked?(MYTHIC_ARTIFACTS.includes(m)?'Mythic Artifact':'Mythic Pedal'):'Locked'}
                  </div>
                </div>
              </div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:isUnlocked?'var(--ink-bone)':'var(--ink-rust)',lineHeight:1.4,fontStyle:isUnlocked?'normal':'italic',marginTop:4}}>
                {isUnlocked?m.effect:m.hint}
              </div>
            </div>)
          })}
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',textAlign:'center',marginTop:12,fontStyle:'italic',letterSpacing:1}}>
          Mythic modifiers reveal themselves only through deeds.
        </div>
      </div>)
    })()}

    <button onClick={onClose} style={{marginTop:4,fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,padding:'8px 40px',flexShrink:0,background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'var(--text-secondary)',cursor:'pointer',textTransform:'uppercase'}}>
      Close
    </button>
  </div>)
}

// ═══ STATS SCREEN — lifetime run statistics ════════════════════════
function StatsScreen({onClose}){
  const ls=(k,d='0')=>localStorage.getItem(k)||d
  const lsInt=(k)=>parseInt(ls(k),10)||0
  const totalRuns=lsInt('vst_runs')
  const personalBest=lsInt('vst_best')
  const lifetime=lsInt('vst_lifetime')
  const dailyStreak=lsInt('vst_streak')
  const winStreak=lsInt('vst_streak_wins')
  const heat=lsInt('vst_heat')||1
  const dailyBest=lsInt('vst_daily_best')
  const lastDate=ls('vst_lastdate','—')
  // Trophies — count defeated bosses
  const trophies=(()=>{try{return JSON.parse(ls('vst_trophies','{}'))}catch(e){return{}}})()
  const bossesKilled=Object.keys(trophies).length
  const totalKills=Object.values(trophies).reduce((s,t)=>s+(t?.kills||0),0)
  // Mastery — count unique cards played
  const mastery=(()=>{try{return JSON.parse(ls('vst_mastery','{}'))}catch(e){return{}}})()
  const cardsDiscovered=Object.keys(mastery).filter(k=>mastery[k]>0).length
  const totalCardsPlayed=Object.values(mastery).reduce((s,v)=>s+v,0)
  // Top 5 most-played
  const topCards=Object.entries(mastery)
    .filter(([_,v])=>v>0)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([id,plays])=>({id,plays,name:(ALL_CARDS.find(c=>c.id===id)||{}).name||id,emoji:(ALL_CARDS.find(c=>c.id===id)||{}).emoji||'⛧'}))
  // Stake unlocks
  const stakesBeaten=(()=>{try{return JSON.parse(ls('vst_stakes_beaten','[]'))}catch(e){return[]}})()
  // Combos / chains discovered
  const combosDiscovered=(()=>{try{return JSON.parse(ls('vst_combos_discovered','[]')).length}catch(e){return 0}})()
  const chainsDiscovered=(()=>{try{return JSON.parse(ls('vst_chains_discovered','[]')).length}catch(e){return 0}})()
  // Achievements
  const achievementCount=(()=>{try{return Object.keys(JSON.parse(ls('vst_achievements','{}'))).length}catch(e){return 0}})()

  const StatCard=({label,value,sub,color='var(--text-gold)',big})=>(
    <div style={{background:'linear-gradient(180deg,rgba(25,15,5,0.95),rgba(12,6,2,0.98))',
      border:'1px solid rgba(140,90,30,0.4)',borderRadius:8,padding:'14px 18px',
      display:'flex',flexDirection:'column',gap:4,minWidth:180}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2,textTransform:'uppercase'}}>{label}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:big?38:28,color,letterSpacing:1,fontWeight:900,textShadow:'0 0 12px '+color+'55',lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:1,fontStyle:'italic'}}>{sub}</div>}
    </div>
  )

  return(<div style={{width:1920,height:1080,position:'relative',display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 80px 30px',background:'radial-gradient(ellipse at center,rgba(15,9,3,1) 0%,rgba(5,3,1,1) 100%)'}}>
    {/* Header */}
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:24,flexShrink:0}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:'var(--text-gold)',letterSpacing:6,textShadow:'0 0 24px rgba(200,160,40,0.6)',lineHeight:1}}>📊 Tour Stats</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase',marginTop:6,fontStyle:'italic'}}>Every run, every kill, every card played</div>
    </div>

    {/* Stats grid */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:14,width:'100%',maxWidth:1500,marginBottom:18,flexShrink:0}}>
      <StatCard label="Total Runs" value={totalRuns} sub={lastDate!=='—'?'Last: '+lastDate:'No runs yet'} big/>
      <StatCard label="Personal Best" value={personalBest.toLocaleString()} sub="Single-run score" color="var(--text-blood)" big/>
      <StatCard label="Lifetime Score" value={lifetime.toLocaleString()} sub="All runs combined" color="var(--text-positive)" big/>
      <StatCard label="🔥 Heat Level" value={heat+'/10'} sub={heat<10?'+'+((heat-1)*15)+'% boss HP':'⛧ MAX HEAT ⛧'} color="rgba(255,140,40,1)" big/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:14,width:'100%',maxWidth:1500,marginBottom:18,flexShrink:0}}>
      <StatCard label="Bosses Defeated" value={bossesKilled+'/28'} sub={totalKills+' total kills'} />
      <StatCard label="Cards Discovered" value={cardsDiscovered+'/85'} sub={totalCardsPlayed.toLocaleString()+' plays'} />
      <StatCard label="Daily Streak" value={dailyStreak} sub={dailyStreak>0?'days in a row':'log in to start a streak'} color="var(--text-blood)"/>
      <StatCard label="Win Streak" value={winStreak} sub="consecutive wins" color="var(--text-positive)"/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:14,width:'100%',maxWidth:1500,marginBottom:24,flexShrink:0}}>
      <StatCard label="Stakes Conquered" value={stakesBeaten.length+'/6'} sub="difficulty tiers"/>
      <StatCard label="Achievements" value={achievementCount} sub="unlocks earned"/>
      <StatCard label="Combos Found" value={combosDiscovered} sub="multi-card synergies"/>
      <StatCard label="Daily Best" value={dailyBest.toLocaleString()} sub="single-day record" color="var(--text-blood)"/>
    </div>

    {/* Top 5 most-played cards */}
    {topCards.length>0&&<div style={{width:'100%',maxWidth:1500,background:'linear-gradient(180deg,rgba(25,15,5,0.95),rgba(12,6,2,0.98))',
      border:'1px solid rgba(140,90,30,0.4)',borderRadius:8,padding:'18px 24px',flexShrink:0}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase',marginBottom:14,fontWeight:900}}>🏆 Most Played Cards</div>
      <div style={{display:'flex',gap:18,justifyContent:'space-around'}}>
        {topCards.map((c,i)=>(
          <div key={c.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:140}}>
            <div style={{fontSize:14,color:'var(--text-gold)',fontFamily:"'MBScribblesFont',serif",fontWeight:900,letterSpacing:2}}>#{i+1}</div>
            <div style={{width:80,height:80,background:'radial-gradient(circle at center,rgba(80,40,10,0.5),rgba(20,10,3,0.9))',border:'1px solid rgba(200,140,40,0.5)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <CardArtImg id={c.id} emoji={c.emoji} size={64}/>
            </div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-primary)',textAlign:'center',letterSpacing:0.5,lineHeight:1.1}}>{c.name}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',letterSpacing:1}}>{c.plays.toLocaleString()} plays</div>
          </div>
        ))}
      </div>
    </div>}

    {topCards.length===0&&<div style={{width:'100%',maxWidth:1500,padding:'40px',background:'rgba(20,12,5,0.5)',border:'1px dashed rgba(140,90,30,0.4)',borderRadius:8,textAlign:'center',flexShrink:0}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-secondary)',fontStyle:'italic',letterSpacing:1}}>Play a few runs and your most-loved cards will show up here.</div>
    </div>}

    <button onClick={onClose} style={{marginTop:20,fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,padding:'10px 50px',flexShrink:0,background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:6,color:'var(--text-secondary)',cursor:'pointer',textTransform:'uppercase'}}>
      Close
    </button>
  </div>)
}

function MasteryGallery({onClose}){
  const data=getMasteryData()
  const allCards=ALL_CARDS.filter(c=>!c.shopOnly&&c.id!=='contract')
  const [filter,setFilter]=useState('ALL')
  const [selectedCard,setSelectedCard]=useState(null)
  const discovered=new Set(Object.keys(data).filter(k=>data[k]>0))
  const totalPlays=Object.values(data).reduce((s,v)=>s+v,0)
  
  const filtered=filter==='ALL'?allCards:allCards.filter(c=>c.type===filter)
  const discCount=allCards.filter(c=>discovered.has(c.id)).length
  const pct=Math.round(discCount/allCards.length*100)
  
  const typeColors={RIFF:'#9933cc',CORRUPT:'#aa1111',UTILITY:'#22aa44',EMBER:'#c87820'}
  
  return(<div style={{position:'absolute',inset:0,zIndex:9900,background:'linear-gradient(180deg,#080404,#0a0604)',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 20px',overflowY:'auto'}}>
    {/* HEADER */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',maxWidth:1400,marginBottom:4}}>
      <div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:42,color:'var(--text-secondary)',textShadow:'0 0 30px rgba(200,160,40,0.4),2px 2px 0 #000',letterSpacing:6}}>Collection</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)'}}>{discCount}/{allCards.length} discovered · {totalPlays.toLocaleString()} total plays · {pct}% complete</div>
      </div>
      <button onClick={onClose} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--text-blood)',background:'rgba(80,0,0,0.4)',border:'2px solid #aa2222',borderRadius:6,padding:'8px 24px',cursor:'pointer',letterSpacing:3}}>✕ CLOSE</button>
    </div>
    
    {/* COMPLETION BAR */}
    <div style={{width:'100%',maxWidth:1400,height:8,background:'rgba(0,0,0,0.5)',borderRadius:4,overflow:'hidden',marginBottom:8}}>
      <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#c87820,#e8a820,#ffd700)',borderRadius:4,transition:'width 0.5s',boxShadow:'0 0 10px rgba(232,168,32,0.5)'}}/>
    </div>
    
    {/* FILTER TABS */}
    <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap',justifyContent:'center'}}>
      {[['ALL','All Cards','#c8a040'],['RIFF','Riff','#9933cc'],['CORRUPT','Corrupt','#aa1111'],['UTILITY','Utility','#22aa44'],['EMBER','Ember','#c87820']].map(([id,label,color])=>{
        const count=id==='ALL'?allCards.length:allCards.filter(c=>c.type===id).length
        const disc=id==='ALL'?discCount:allCards.filter(c=>c.type===id&&discovered.has(c.id)).length
        return <button key={id} onClick={()=>setFilter(id)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,letterSpacing:2,padding:'8px 20px',cursor:'pointer',border:filter===id?'2px solid '+color:'1px solid rgba(100,65,15,0.3)',borderRadius:6,background:filter===id?color+'22':'transparent',color:filter===id?color:'var(--text-muted)',textTransform:'uppercase',transition:'all 0.15s'}}>{label} ({disc}/{count})</button>
      })}
    </div>
    
    {/* CARD GRID */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,180px)',gap:8,justifyContent:'center',width:'100%',maxWidth:1400,paddingBottom:30}}>
      {filtered.map(c=>{
        const plays=data[c.id]||0
        const isDiscovered=plays>0
        // 'vst_lifetime_score' is never written — the game writes 'vst_lifetime'. (phase 3)
        const isLocked=c.locked&&c.unlockAt&&(parseInt(localStorage.getItem('vst_lifetime')||'0')<c.unlockAt)
        let tier=MASTERY_TIERS[0]
        for(const t of MASTERY_TIERS){if(plays>=t.min)tier=t}
        const bc=typeColors[c.type]||'#9933cc'
        const isLegendary=tier.name==='Legendary'
        
        return(<div key={c.id} onClick={()=>setSelectedCard(selectedCard?.id===c.id?null:c)}
          style={{background:isLocked?'rgba(10,6,2,0.8)':!isDiscovered?'rgba(10,6,2,0.6)':isLegendary?'linear-gradient(135deg,#1a0820,#0a0412)':'linear-gradient(180deg,#1a1008,#0c0604)',
            border:'2px solid '+(isLocked?'#222':!isDiscovered?'#333':tier.border||bc+'66'),borderRadius:7,overflow:'hidden',cursor:'pointer',
            filter:isLocked?'brightness(0.3)':!isDiscovered?'brightness(0.5) saturate(0.3)':'none',
            boxShadow:tier.glow&&isDiscovered?'0 0 12px '+tier.glow:'none',
            transform:selectedCard?.id===c.id?'scale(1.05)':'none',transition:'all 0.15s',position:'relative'}}>
          <div style={{height:3,background:isDiscovered?tier.border||bc:'#333'}}/>
          <div style={{textAlign:'center',padding:'8px 0',background:'rgba(0,0,0,0.3)',position:'relative'}}>
            {isLocked?<span style={{fontSize:48}}>🔒</span>:
             <CardArtImg id={c.id} emoji={isDiscovered?c.emoji:'❓'} size={72}/>}
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:700,color:isDiscovered?'#eedfc0':'#555',textAlign:'center',padding:'2px 4px',lineHeight:1.1}}>{isLocked?'???':c.name}</div>
          {isDiscovered&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 6px 4px'}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:tier.color,letterSpacing:1}}>{tier.name==='Unplayed'?'':tier.name}</span>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'var(--text-secondary)'}}>{plays}×</span>
          </div>}
          {!isDiscovered&&!isLocked&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:'2px 0 4px',letterSpacing:1}}>UNDISCOVERED</div>}
          {isLocked&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:'2px 0 4px',letterSpacing:1}}>LOCKED</div>}
        </div>)
      })}
    </div>
    
    {/* DETAIL PANEL — shows when card clicked */}
    {selectedCard&&<div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:800,background:'linear-gradient(180deg,rgba(20,12,4,0.98),rgba(10,6,2,0.99))',border:'2px solid '+(typeColors[selectedCard.type]||'#c8a040'),borderRadius:'12px 12px 0 0',padding:'16px 24px',zIndex:9999,boxShadow:'0 -10px 40px rgba(0,0,0,0.8)'}}>
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <CardArtImg id={selectedCard.id} emoji={selectedCard.emoji} size={80}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:32,color:'var(--text-primary)',letterSpacing:2}}>{selectedCard.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:typeColors[selectedCard.type],letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{selectedCard.type} · {selectedCard.rarity} · {selectedCard.embers} EMBERS</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',lineHeight:1.4}}>{selectedCard.effect}</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,color:'var(--text-gold)'}}>{data[selectedCard.id]||0}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2}}>PLAYS</div>
        </div>
      </div>
    </div>}
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
        fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-rust)',letterSpacing:3,
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
        <span style={{position:'absolute',inset:0,fontFamily:"'BogartsMetalFont',cursive",fontSize:84,color:'var(--text-blood)',letterSpacing:8,textShadow:'3px 4px 0 rgba(0,0,0,0.85)',transform:'translate(4px,5px) rotate(-3deg)',whiteSpace:'nowrap',opacity:0.85}}>VICTORY</span>
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',marginTop:4,opacity:0.7}}>Press SPACE or ENTER</div>
      {/* Frieze bottom */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:18,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:16,textAlign:'center',lineHeight:'18px',textTransform:'uppercase',opacity:0.7,userSelect:'none',textShadow:'0 0 8px rgba(196,30,58,0.3)',borderTop:'1px solid rgba(196,30,58,0.35)',background:'linear-gradient(0deg, rgba(196,30,58,0.18) 0%, transparent 100%)'}}>⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧ · ✠ · ⛧ · ☥ · ⛧</div>
    </div>
  )
}

function EventScreen({event,onChoose}){
  const [chosen,setChosen]=useState(null)
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
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'var(--text-secondary)',textShadow:'0 0 20px rgba(200,160,40,0.3),2px 2px 0 #000',letterSpacing:3}}>{event.name}</div>
      </div>

      {/* Flavor text */}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,color:'var(--text-secondary)',fontStyle:'italic',textAlign:'center',lineHeight:1.6,marginBottom:28,padding:'0 10px'}}>{event.flavor}</div>

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

        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:4}}>— OR —</div>

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
          {BOSS_PORTRAITS[enemy.id]?<img src={enemy.id==='lucifer'&&luciferPhase===2?import.meta.env.BASE_URL+'bosses/lucifer_p2.png':BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:130,height:130,objectFit:'contain',imageRendering:'pixelated'}}/>:<span style={{fontSize:80}}>{enemy.emoji}</span>}
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
        {debuff>0&&<div style={{position:'absolute',bottom:4,right:4,background:'rgba(0,80,160,0.9)',border:'1px solid #4488ff',borderRadius:4,padding:'2px 6px',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--tier-foil)',zIndex:3}}>-{debuff}dmg</div>}
      </div>

      {/* BOSS INFO — stripped of parchment backing */}
      <div style={{flex:1,padding:'10px 24px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:6}}>
        {/* Circle badge */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:5,color:'var(--ink-rust)',textTransform:'uppercase',fontWeight:900,textAlign:'center',opacity:0.85}}>{enemy.circle} · {enemy.subtitle}</div>

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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-rust)',letterSpacing:3,fontWeight:900,textAlign:'center',textTransform:'uppercase',textShadow:'0 0 6px rgba(196,30,58,0.4)'}}>Base Damage · {enemy.baseDmg} per Strike</div>

        {/* BOSS TELEGRAPH — dynamic next-strike preview */}
        {telegraph&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,textAlign:'center',marginTop:2,letterSpacing:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <span style={{color:telegraph.dmg===0?'#44aa44':'var(--blood)',textShadow:telegraph.dmg>0?'0 0 6px rgba(196,30,58,0.4)':'none'}}>{telegraph.dmg===0?'BLOCKED':'NEXT: '+telegraph.dmg+' DMG'}</span>
          <span style={{color:'var(--ink-dim)',fontSize:13}}>→ {telegraph.target}</span>
          {telegraph.special&&<span style={{color:'var(--text-gold)',fontSize:13,border:'1px solid rgba(204,102,0,0.4)',borderRadius:3,padding:'0 4px'}}>+ {telegraph.special}</span>}
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
          {i===0&&<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,opacity:.2,color:'var(--text-secondary)'}}>⛧</div>}
        </div>)}
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,fontWeight:900,color:'var(--gold)',lineHeight:1}}>{count}</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:3,color:'var(--ink-dim)',textTransform:'uppercase',lineHeight:1}}>{label}</div>
      {tipOpen&&dist&&count>0&&<div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',zIndex:99999,background:'rgba(10,6,2,0.97)',border:'1px solid rgba(160,110,35,0.6)',borderRadius:6,padding:'8px 12px',pointerEvents:'none',minWidth:140,boxShadow:'0 4px 16px rgba(0,0,0,0.8)'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2,textAlign:'center',marginBottom:4}}>{label.toUpperCase()}</div>
        {[['RIFF','#9933cc'],['CORRUPT','#aa1111'],['UTILITY','#22aa44'],['EMBER','#c87820']].map(([t,c])=>
          <div key={t} style={{display:'flex',justifyContent:'space-between',gap:8,fontFamily:"'MBScribblesFont',serif",fontSize:13,color:c,fontWeight:700}}>
            <span>{t}</span><span>{dist[t]}</span>
          </div>
        )}
        <div style={{borderTop:'1px solid rgba(160,110,35,0.3)',marginTop:4,paddingTop:3,display:'flex',justifyContent:'space-between',fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',fontWeight:900}}>
          <span>Total</span><span>{count}</span>
        </div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',textAlign:'center',marginTop:4}}>Click to view cards</div>
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
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'var(--text-secondary)',textShadow:'0 0 20px rgba(200,150,20,0.3)'}}>Combat Log</div>
        <button onClick={onClose} style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:3,padding:'8px 28px',background:'rgba(40,20,5,0.6)',border:'2px solid #4a3010',borderRadius:4,color:'var(--text-secondary)',cursor:'pointer'}}>✕ CLOSE</button>
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',marginTop:8}}>{log.length} entries this run</div>
    </div>
  )
}

function EndScreen({won,cause,enemy,stats,seed,onReset,onEncore,streakWins,streakLosses,totalRuns,isDailyRun,onDailyChallenge,personalBest,dailyStreak,lifetimeScore,discovered,newAchievements,enemyHp,stage,chosenPacts,fullRunLog,newTrophies,runElapsed,lastKillingBlow,devDailyScore,secondAlbumWin,contractsPlayed}){
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
    const streakLabel=streakBonus>0?<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',marginTop:4}}>🔥 Streak Bonus: +{streakBonus}% score</div>:null
    if(isBest&&scoreReady&&beatBy>0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'var(--text-gold)',fontWeight:900,textShadow:'0 0 20px rgba(255,200,0,0.6)',marginTop:6,animation:'throb 1.5s ease-in-out infinite'}}>🏆 NEW PERSONAL BEST! +{beatBy.toLocaleString()}</div></>
    if(isBest&&scoreReady&&beatBy===0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'var(--text-gold)',fontWeight:900,textShadow:'0 0 20px rgba(255,200,0,0.6)',marginTop:6}}>🏆 PERSONAL BEST!</div></>
    if(shortBy>0&&shortBy<=2000)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'var(--text-blood)',fontWeight:900,textShadow:'0 0 14px rgba(200,0,0,0.5)',marginTop:6}}>SO CLOSE! Only {shortBy.toLocaleString()} pts from your best!</div></>
    if(shortBy>0)return <>{streakLabel}<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-secondary)',marginTop:6}}>Your Best: {(personalBest||0).toLocaleString()} — {shortBy.toLocaleString()} to beat</div></>
    return streakLabel
  }

  // ── UNLOCK PROGRESS BAR ────────────────────────────────────
  const UnlockBar=()=>(<div style={{width:'100%',maxWidth:600,margin:'8px 0'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
      <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',letterSpacing:2,textTransform:'uppercase'}}>Next Unlock</span>
      <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)'}}>{newLifetime.toLocaleString()} / {nextUnlock.score.toLocaleString()}</span>
    </div>
    <div style={{height:30,background:'rgba(20,12,4,0.8)',border:'1px solid rgba(100,65,15,0.5)',borderRadius:12,overflow:'hidden',position:'relative'}}>
      <div style={{height:'100%',width:(unlockProgress*100)+'%',background:'linear-gradient(90deg,#8a2200,#cc4400,#e8a820)',borderRadius:12,transition:'width 1.5s ease',boxShadow:'0 0 16px rgba(200,100,0,0.5)'}}/>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-primary)',textShadow:'0 0 8px rgba(0,0,0,0.9)',letterSpacing:1}}>{nextUnlock.emoji} {nextUnlock.label}</span>
      </div>
    </div>
    {unlocksEarned>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',fontStyle:'italic',textAlign:'center',marginTop:3}}>{unlocksEarned} unlock{unlocksEarned>1?'s':''} earned so far</div>}
  </div>)

  // ── DISCOVERIES ────────────────────────────────────────────
  const discoveryList=discovered?[...discovered]:[]
  const Discoveries=()=>discoveryList.length>0?(<div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',maxWidth:600,margin:'4px 0'}}>
    {discoveryList.slice(0,8).map((d,i)=><div key={i} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',background:'rgba(40,25,5,0.8)',border:'1px solid rgba(200,140,30,0.4)',borderRadius:4,padding:'3px 10px',letterSpacing:1}}>NEW: {d}</div>)}
  </div>):null

  // ── ACHIEVEMENT BADGES ─────────────────────────────────────
  const allAchievements=getAchievements()
  const newAchIds=newAchievements||[]
  const AchievementBadges=()=>{
    if(newAchIds.length===0&&allAchievements.length===0)return null
    return(<div style={{width:'100%',maxWidth:600,margin:'6px 0'}}>
      {newAchIds.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:6}}>
        {newAchIds.map(id=>{const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return null;return <div key={id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',background:'rgba(60,40,0,0.8)',border:'2px solid #ffd700',borderRadius:6,padding:'4px 12px',letterSpacing:1,animation:'throb 1.5s ease-in-out infinite'}}>{a.emoji} NEW: {a.label}</div>})}
      </div>}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center'}}>{allAchievements.length} / {ACHIEVEMENTS.length} achievements</div>
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,letterSpacing:8,color:'var(--text-blood)',textTransform:'uppercase',fontWeight:900}}>SO CLOSE</div>
      <div style={{display:'flex',alignItems:'baseline',gap:14,animation:'nmPulse 2.5s ease-in-out infinite'}}>
        <span style={{fontSize:56}}>{main.emoji}</span>
        <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:84,fontWeight:900,color:'var(--text-blood)',letterSpacing:3,animation:'nmGlow 2s ease-in-out infinite'}}>{main.text}</span>
      </div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:30,color:'var(--text-blood)',fontStyle:'italic',textShadow:'0 0 15px rgba(200,100,60,0.4)'}}>{main.sub}</div>
      {others.length>0&&<div style={{display:'flex',gap:20,marginTop:8}}>
        {others.map((o,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',background:'rgba(0,0,0,0.3)',borderRadius:6}}>
          <span style={{fontSize:18}}>{o.emoji}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:17,color:'var(--text-secondary)'}}>
            <span style={{fontWeight:900,color:'var(--text-blood)'}}>{o.text}</span> {o.sub}
          </span>
        </div>)}
      </div>}
      {lastKillingBlow&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',fontStyle:'italic',marginTop:8,opacity:0.8}}>☠ {lastKillingBlow}</div>}
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
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:6,color:'var(--text-muted)',textTransform:'uppercase',textAlign:'center',marginBottom:14}}>⛧ Run Highlights ⛧</div>
      {topTwo.length>0&&<div style={{display:'grid',gridTemplateColumns:topTwo.length===1?'1fr':'1fr 1fr',gap:12,marginBottom:rest.length>0?12:0}}>
        {topTwo.map((h,i)=>(<div key={'t'+i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'rgba(0,0,0,0.4)',borderRadius:8,border:'1px solid rgba(120,70,15,0.3)'}}>
          <span style={{fontSize:36,flexShrink:0}}>{h.emoji}</span>
          <div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:h.color,lineHeight:1,textShadow:'0 0 12px '+h.color+'44'}}>{h.value}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2,textTransform:'uppercase',marginTop:3}}>{h.label}</div>
          </div>
        </div>))}
      </div>}
      {rest.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat('+Math.min(rest.length,4)+',1fr)',gap:8}}>
        {rest.map((h,i)=>(<div key={'r'+i} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 6px',background:'rgba(0,0,0,0.25)',borderRadius:6}}>
          <span style={{fontSize:18,marginBottom:2}}>{h.emoji}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:h.color,lineHeight:1}}>{h.value}</span>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:1,textTransform:'uppercase',marginTop:2,textAlign:'center'}}>{h.label}</span>
        </div>))}
      </div>}
    </div>)
  }

  // ── SHARE BUTTON ───────────────────────────────────────────
  const stakeInfo=(()=>{const sid=localStorage.getItem('vst_active_stake')||'bronze';const sk=STAKES.find(s=>s.id===sid);return sk||STAKES[0]})()
  const bandStr=stage?stage.filter(m=>m&&!m.tooStoned).map(m=>m.name).join(', '):''
  const shareText='⛧ VESTIBULE ⛧\nSCORE: '+finalScore.toLocaleString()+' — '+grade.label+(stakeInfo.id!=='bronze'?' ['+stakeInfo.name+' ×'+stakeInfo.scoreMult+']':'')+'\n'+(isVictory?'⛧ DEFEATED LUCIFER! ⛧':'Fell to '+(enemy?.name||'The Vestibule')+' at Circle '+circleReached)+(isVictory&&bandStr?'\nBand: '+bandStr:'')+'\nSEED: '+seed.toString(16).toUpperCase()+'\nCan you beat this? 🤘'
  const handleShare=()=>{if(navigator.clipboard){navigator.clipboard.writeText(shareText);setCopied(true);setTimeout(()=>setCopied(false),2000)}}

  // Shared stats grid
  const StatsGrid=()=>(
    <div style={{background:'rgba(20,12,4,0.88)',border:'1px solid rgba(100,65,15,0.35)',borderRadius:8,padding:'28px 48px',minWidth:780}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'var(--text-secondary)',textTransform:'uppercase',textAlign:'center',marginBottom:18}}>Run Statistics</div>
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
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-secondary)'}}>{row[0]}</span>
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
        {tips.slice(0,2).map((t,i)=><div key={i} style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',fontStyle:'italic',lineHeight:1.5,padding:'2px 0'}}>{t}</div>)}
      </div>
    )
  }

  // Shared bottom row
  // ── RUN HISTORY ─────────────────────────────────────────────
  const [showHistory,setShowHistory]=useState(false)
  const runHistory=getRunHistory()
  const RunHistory=()=>runHistory.length>1?(<div style={{width:'100%',maxWidth:780,margin:'4px 0'}}>
    <div onClick={()=>setShowHistory(p=>!p)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',letterSpacing:2,textTransform:'uppercase',cursor:'pointer',textAlign:'center',padding:'4px 0'}}>
      {showHistory?'▼ Hide Past Runs':'▶ Past Runs ('+runHistory.length+')'}</div>
    {showHistory&&<div style={{background:'rgba(20,12,4,0.88)',border:'1px solid rgba(100,65,15,0.35)',borderRadius:6,padding:'10px 16px',maxHeight:200,overflowY:'auto'}}>
      {runHistory.slice(0,20).map((r,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid rgba(80,50,10,0.12)',fontFamily:"'MBScribblesFont',serif",fontSize:13}}>
        <span style={{color:'#8a7040'}}>{r.date}</span>
        <span style={{color:r.cause==='victory'?'#ffd700':'#c8a060',fontWeight:900}}>{r.score?.toLocaleString()}</span>
        <span style={{color:'var(--text-secondary)',fontSize:13}}>{r.grade}</span>
        <span style={{color:r.cause==='victory'?'#44cc44':'#cc4444',fontSize:13}}>{r.cause==='victory'?'WIN ⛧':'C'+r.circle+' '+r.enemy}</span>
      </div>)}
    </div>}
  </div>):null

  const BottomRow=()=>(
    <div style={{display:'flex',gap:20,alignItems:'center'}}>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2}}>SEED: {seed.toString(16).toUpperCase()}</div>
      {isDailyRun&&devDailyScore&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:finalScore>devDailyScore?'#44ff44':'#ff4444',textAlign:'center',padding:'4px 12px',background:finalScore>devDailyScore?'rgba(40,120,40,0.2)':'rgba(120,40,40,0.2)',borderRadius:6,border:'1px solid '+(finalScore>devDailyScore?'rgba(60,180,60,0.4)':'rgba(180,60,60,0.4)'),marginBottom:8}}>{finalScore>devDailyScore?'⛧ YOU BEAT VOMITWIZARD! ⛧':'VomitWizard scored '+devDailyScore.toLocaleString()+'. Try again.'}</div>}
        {isDailyRun&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',letterSpacing:2,padding:'3px 12px',border:'1px solid #e8a820',borderRadius:3}}>🌍 DAILY CHALLENGE</div>}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',cursor:'pointer',letterSpacing:1}}
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
        {!isVictory&&<button onClick={()=>{onReset()}}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,
            color:'#ff4444',background:'rgba(80,0,0,0.4)',
            border:'1px solid #aa2222',borderRadius:3,
            padding:'10px 24px',cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(120,0,0,0.6)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(80,0,0,0.4)'}>
          ⚡ Quick Restart
        </button>}
        {!isVictory&&<button onClick={()=>{onReset(seed)}}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,
            color:'#aa8844',background:'rgba(60,40,10,0.4)',
            border:'1px solid #886622',borderRadius:3,
            padding:'10px 24px',cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(80,50,10,0.6)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(60,40,10,0.4)'}>
          🔄 Retry Seed
        </button>}
        <button onClick={handleShare}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,
            color:copied?'#44cc44':'#e8a820',background:'rgba(50,35,5,0.4)',
            border:'1px solid '+(copied?'#44cc44':'#c87820'),borderRadius:3,
            padding:'10px 24px',cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s'}}>
          {copied?'✓ Copied!':'📋 Share Score'}
        </button>
        <button onClick={()=>onDailyChallenge&&onDailyChallenge()}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:3,color:'var(--text-gold)',background:'rgba(50,35,5,0.4)',border:'1px solid #c87820',borderRadius:3,padding:'10px 24px',cursor:'pointer',textTransform:'uppercase'}}>
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
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:100,color:'var(--text-blood)',textShadow:'-4px 0 rgba(255,0,0,0.9),4px 0 rgba(0,255,80,0.7),0 0 50px rgba(180,0,0,0.8),3px 3px 0 #000',lineHeight:1}}>Stoned to the Bone</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:30,color:'var(--text-positive)',fontStyle:'italic',textShadow:'0 0 15px rgba(60,255,60,0.7)'}}>The band ran out of herb.</div>
    </>)
    if(isBeaten)return(<>
      <div style={{display:'flex',alignItems:'center',gap:20}}>
        {BOSS_QUOTES[enemy?.id]&&<div style={{position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'rgba(196,30,58,0.7)',fontStyle:'italic',textShadow:'0 0 12px rgba(196,30,58,0.3)',zIndex:2,whiteSpace:'nowrap'}}>"{BOSS_QUOTES[enemy.id]}"</div>}
        <div style={{fontSize:80,filter:'drop-shadow(0 0 20px rgba(200,0,0,0.5))'}}>{enemy&&BOSS_PORTRAITS[enemy.id]?<img src={BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:80,height:80,objectFit:'contain',imageRendering:'pixelated'}}/>:enemy?.emoji||'💀'}</div>
        <div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:6,color:'var(--text-blood)',textTransform:'uppercase'}}>Defeated by</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--text-blood)',lineHeight:1,textShadow:'-2px 0 rgba(255,0,0,0.6),2px 0 rgba(180,0,0,0.4),0 0 30px rgba(160,0,0,0.5),2px 2px 0 #000'}}>{enemy?.name||'The Vestibule'}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:'var(--text-blood)',textTransform:'uppercase'}}>{enemy?.circle||''}</div>
          {enemy?.passive&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-blood)',marginTop:4,fontStyle:'italic'}}>"{enemy.passive}"</div>}
          <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap'}}>
            {[['Fights',stats.fightsSurvived||0],['Chains',stats.chainsTriggered||0],['Cards Played',stats.cardsPlayed||0],['Max Strike',stats.highestStrike?stats.highestStrike.toLocaleString():'0']].map(([label,val],i)=>
              <div key={i} style={{background:'rgba(60,20,20,0.4)',border:'1px solid rgba(120,40,40,0.3)',borderRadius:4,padding:'4px 10px',textAlign:'center'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:1,textTransform:'uppercase'}}>{label}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--text-secondary)'}}>{val}</div>
              </div>)}
          </div>
        </div>
      </div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'var(--text-blood)',fontStyle:'italic',textShadow:'0 0 12px rgba(180,0,0,0.3)',maxWidth:500,textAlign:'center'}}>"{enemy?.tagline||'The Vestibule claims another soul.'}"</div>
    </>)
    return(<>
      {secondAlbumWin?(<>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:'var(--gold)',letterSpacing:8,textShadow:'0 0 40px rgba(232,168,32,0.95), 0 0 90px rgba(232,168,32,0.5), 4px 4px 0 #000',lineHeight:1}}>⛧ THE SECOND ALBUM ⛧</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:96,color:'var(--ink-bone)',letterSpacing:10,textShadow:'0 0 50px rgba(232,168,32,0.95), 0 0 120px rgba(196,30,58,0.6), 5px 5px 0 #000',marginTop:6}}>You Bled the Suit Dry</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'var(--text-secondary)',fontStyle:'italic',marginTop:8,textAlign:'center',maxWidth:900,lineHeight:1.4}}>The Executive lies broken at your feet. Hell could not contain you.{contractsPlayed>0?' '+contractsPlayed+' contract'+(contractsPlayed>1?'s':'')+' signed — score ×'+(1+contractsPlayed*0.5).toFixed(1)+'.':''}</div>
      </>):(<>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:90,color:'var(--text-primary)',textShadow:'0 0 40px rgba(210,160,20,0.5),2px 2px 0 #000'}}>⛧ Victory ⛧</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'var(--text-secondary)',fontStyle:'italic'}}>All 9 circles conquered. Lucifer has fallen.</div>
      </>)}
    </>)
  }

  return(
    <div style={{position:'absolute',inset:0,zIndex:9800,background:bgColor,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',paddingTop:30,paddingBottom:30,animation:'fadeIn 0.8s ease',overflowY:'auto',overflowX:'hidden'}}>
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
            {/* Encore: restart with scaled enemies. Body lives in App as handleEncore —
                it drives ~21 App-scope setters/refs that EndScreen never received, so
                inlining it here threw ReferenceError on the very first statement. */}
            {isVictory&&onEncore&&<button onClick={onEncore}
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
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:2,color:'var(--text-secondary)',background:'rgba(40,25,5,0.5)',border:'1px solid #8a6020',borderRadius:3,padding:'8px 18px',cursor:'pointer',textTransform:'uppercase'}}>
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
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2,textTransform:'uppercase'}}>{row[0]}</div>
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
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2}}>VS LAST RUN:</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:diff>0?'#44cc44':diff<0?'#cc4444':'#888'}}>SCORE {diff>0?'+':''}{diff.toLocaleString()}</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:diffDmg>0?'#44cc44':diffDmg<0?'#cc4444':'#888'}}>DMG {diffDmg>0?'+':''}{diffDmg.toLocaleString()}</span>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)'}}>({last.cause==='victory'?'Won':'C'+last.circle})</span>
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
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',letterSpacing:2,fontWeight:900}}>NEW TROPHY</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-gold)',fontWeight:900}}>{t.name}</div>
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
                    <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-primary)'}}>{p.card.name}</span>
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
          {newAchIds.length>0&&newAchIds.slice(0,4).map(id=>{const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return null;return <div key={id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-gold)',background:'rgba(60,40,0,0.7)',border:'1px solid #ffd700',borderRadius:4,padding:'3px 10px',animation:'throb 1.5s ease-in-out infinite'}}>{a.emoji} {a.label}</div>})}
          {discoveryList.slice(0,4).map((d,i)=><div key={i} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',background:'rgba(40,25,5,0.7)',border:'1px solid rgba(200,140,30,0.3)',borderRadius:3,padding:'2px 8px'}}>NEW: {d}</div>)}
          {dailyStreak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:'var(--text-blood)',padding:'4px 16px',background:'rgba(0,0,0,0.5)',border:'1px solid #ff6600',borderRadius:3}}>🔥 {dailyStreak} DAY STREAK</div>}
          {streakMsg&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:streakWins>1?'#ff6600':'#aa4444',padding:'3px 12px',background:'rgba(0,0,0,0.5)',border:'1px solid '+(streakWins>1?'#ff6600':'#aa4444'),borderRadius:3}}>{streakMsg}</div>}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)'}}>{allAchievements.length}/{ACHIEVEMENTS.length} achievements</div>
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
  const kwc={'FRENZIED':'#ee2222','BLASTBEAT':'#ff8800','TRICKSTER':'#e8b84a','ANCHOR':'#33dd33','CORRUPT':'#cc44ff','DEBUFF':'#4488ff','FOLK MAGIC':'#44ddaa','SHREDDER':'#ff4488','HEXED':'#cc8800'}
  function MemberCard({m,onPick,label}){
    const bc=kwc[m.keyword]||'#e8a820'
    return(
      <div onClick={onPick} style={{width:260,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'3px solid #e8a820',borderRadius:8,overflow:'hidden',cursor:'pointer',transition:'all 0.2s',boxShadow:'0 0 40px rgba(232,168,32,0.5)'}}
        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 0 60px rgba(232,168,32,0.8)'}}
        onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 40px rgba(232,168,32,0.5)'}}>
        <div style={{background:'linear-gradient(90deg,#e8a820,#ffcc44)',padding:'6px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:3,color:'var(--text-inverse)'}}>{label}</div>
        <div style={{fontSize:64,textAlign:'center',padding:'20px 0',background:'rgba(0,0,0,0.4)',overflow:'hidden'}}>{MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={55}/>:m.emoji}</div>
        <div style={{padding:'0 16px 16px'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:32,color:'var(--text-primary)',textAlign:'center',marginBottom:4}}>{m.name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:'var(--text-secondary)',textAlign:'center',marginBottom:10}}>{m.role}</div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px',background:'rgba(0,0,0,0.5)',borderRadius:4,marginBottom:8}}>
            <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',fontWeight:900}}>ATK</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:'var(--text-blood)'}}>{m.atk}</div></div>
            <div style={{textAlign:'center',alignSelf:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,fontWeight:700}}>{m.keyword}</div></div>
            <div style={{textAlign:'center'}}><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',fontWeight:900}}>HP</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,fontWeight:900,color:'var(--text-positive)'}}>{m.hp}</div></div>
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center'}}>{m.desc}</div>
          {m.roleBondBonus>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',textAlign:'center',marginTop:8}}>🔗 +{m.roleBondBonus} ATK Bond</div>}
        </div>
        <div style={{background:'rgba(232,168,32,0.15)',padding:'12px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-gold)',letterSpacing:2}}>KEEP THIS ONE</div>
      </div>
    )
  }
  return(
    <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(2,1,0,0.98)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:'20px 20px',overflow:'hidden'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:'var(--text-blood)',textShadow:'0 0 40px rgba(200,0,0,0.9),0 0 80px rgba(150,0,0,0.6)',textAlign:'center'}}>Only One May Remain</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-secondary)',fontStyle:'italic',textAlign:'center'}}>Two demonic powers cannot share the same stage.<br/>Choose who stays — the other is gone forever.</div>
      <div style={{display:'flex',gap:60,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
        <MemberCard m={existing} onPick={()=>onChoice(existing,incoming)} label="CURRENTLY ON STAGE"/>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--text-blood)',textShadow:'0 0 20px rgba(200,0,0,0.8)'}}>VS</div>
        <MemberCard m={incoming} onPick={()=>onChoice(incoming,existing)} label="NEWLY ARRIVED"/>
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2,textAlign:'center'}}>THE UNCHOSEN WILL BE PERMANENTLY REMOVED</div>
    </div>
  )
}

function RecruitScreen({candidates,stage,onPick,onPass,onFireMember,stash,salesLeft}){
  const isFull=stage.filter(Boolean).length>=5
  const activeMembers=stage.map((m,i)=>m?{m,i}:null).filter(Boolean).filter(x=>!x.m.tooStoned)
  // Aug 4 2026: shared with the pawn modal and handlePawnSellMember. The local
  // copy branched on `demonic` only, so Lucifer (keyword FALLEN, no demonic
  // flag) advertised 5🌿 while the handler paid 69🌿.
  const fireSellPrice=memberSellValue
  const salesRemaining=salesLeft==null?99:salesLeft
  // Jul 31 2026 (JV): full-band picks open a REPLACE modal (packs were silently
  // wasted before); Lucifer opens his contract with the sacrifice option.
  const [pendingPick,setPendingPick]=useState(null)
  const bandCount=stage.filter(Boolean).length
  const memberVal=x=>(x.m.atk+(x.m.permAtkBonus||0))*3+x.m.hp
  const signLucifer=()=>{
    const keep=[...activeMembers].sort((a,b)=>memberVal(b)-memberVal(a)).slice(0,2).map(x=>x.m.uid)
    activeMembers.filter(x=>!keep.includes(x.m.uid)).forEach(x=>onFireMember(x.m,x.i,{ignoreSalesCap:true}))
    onPick(pendingPick);setPendingPick(null)
  }
  return(
    <div style={{position:'absolute',inset:0,zIndex:9600,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'20px 20px',overflow:'hidden'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:44,color:'var(--text-secondary)',textShadow:'0 0 30px rgba(200,150,20,0.4)'}}>Recruit a Member</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-secondary)',fontStyle:'italic'}}>{isFull?'🔥 Stage is full — fire a member to make room, or pass':'Choose one musician to join your band — or pass'}</div>
      <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center',maxWidth:1000}}>
        {pendingPick&&<div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setPendingPick(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg,#1a1008,#0a0604)',border:'2px solid '+(pendingPick.keyword==='FALLEN'?'#c41e3a':'#c89838'),borderRadius:12,padding:'28px 34px',maxWidth:560,display:'flex',flexDirection:'column',gap:14,alignItems:'center'}}>
            {pendingPick.keyword==='FALLEN'?<>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:34,color:'var(--text-blood)',letterSpacing:3}}>The Devil's Contract</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',lineHeight:1.7,textAlign:'center'}}>😈 Lucifer joins ONLY a band of two. He cannot be healed. He loses 1 HP every strike. If he dies, your run ends. Unstoppable power — on a burning fuse.</div>
              {bandCount>2&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-blood)',textAlign:'center'}}>Signing him sacrifices {bandCount-2} member{bandCount-2>1?'s':''} — your two strongest stay. The rest are paid out at Sly's rates.</div>}
              <div style={{display:'flex',gap:14}}>
                <button onClick={signLucifer} style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,letterSpacing:2,color:'var(--text-primary)',background:'#7a1020',border:'1px solid #c41e3a',borderRadius:7,padding:'12px 26px',cursor:'pointer'}}>😈 SIGN THE CONTRACT</button>
                <button onClick={()=>setPendingPick(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,letterSpacing:2,color:'var(--text-muted)',background:'rgba(40,20,5,0.4)',border:'1px solid #444',borderRadius:7,padding:'12px 26px',cursor:'pointer'}}>WALK AWAY</button>
              </div>
            </>:<>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:30,color:'var(--text-gold)',letterSpacing:3}}>Band Is Full</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',textAlign:'center'}}>Recruit {pendingPick.name} — who gets cut? (Sly pays their buyback)</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
                {activeMembers.map(x=><button key={x.m.uid} onClick={()=>{onFireMember(x.m,x.i,{ignoreSalesCap:true});onPick(pendingPick);setPendingPick(null)}}
                  style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-primary)',background:'rgba(60,30,10,0.6)',border:'1px solid #886030',borderRadius:7,padding:'10px 14px',cursor:'pointer'}}>
                  ✂ {x.m.name}<br/><span style={{fontSize:13,color:'var(--ink-dim)'}}>ATK {x.m.atk+(x.m.permAtkBonus||0)} · HP {x.m.hp} · +{fireSellPrice(x.m)}🌿</span></button>)}
              </div>
              <button onClick={()=>setPendingPick(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:2,color:'var(--text-muted)',background:'none',border:'1px solid #444',borderRadius:7,padding:'8px 22px',cursor:'pointer'}}>KEEP CURRENT BAND</button>
            </>}
          </div>
        </div>}
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
            <div key={m.id} onClick={()=>{
              const blockedDbl=isDblTime&&hasDblTime
              if(blockedDbl)return
              if(m.keyword==='FALLEN'&&bandCount>2){setPendingPick(m);return}
              if(emptySlot===-1){setPendingPick(m);return}
              onPick(m)
            }}
              style={{width:200,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:'1px solid rgba(160,100,25,0.5)',borderRadius:7,overflow:'hidden',cursor:canAdd?'pointer':'not-allowed',opacity:canAdd?1:0.4,transition:'all 0.2s',transform:canAdd?'none':'none'}}
              onMouseEnter={e=>{if(canAdd)e.currentTarget.style.transform='translateY(-6px) scale(1.03)';e.currentTarget.style.boxShadow='0 0 30px rgba(232,168,32,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
              <div style={{height:4,background:m.demonic?'linear-gradient(90deg,#e8a820,#ffd700,#e8a820)':m.mythic?'linear-gradient(90deg,#cc44ff,#ff88ff,#cc44ff)':m.foil?'linear-gradient(90deg,#88ccff,#ffffff,#88ccff)':'linear-gradient(90deg,#e8a820,#ffcc44)'}}/>
              {tier&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:3,textAlign:'center',padding:'4px 0',background:m.demonic?'rgba(200,160,0,0.25)':m.mythic?'rgba(180,0,255,0.2)':'rgba(100,180,255,0.15)',color:m.demonic?'#ffd700':m.mythic?'#dd88ff':'#88ccff',textShadow:m.demonic?'0 0 12px rgba(255,200,0,0.9)':m.mythic?'0 0 12px rgba(200,0,255,0.9)':'0 0 12px rgba(100,180,255,0.9)'}}>{m.demonic?'⛧ DEMONIC ⛧':m.mythic?'✦ MYTHIC ✦':'✨ FOIL ✨'} +{m.demonic?5:m.mythic?3:1} ATK/HP</div>}
              {tier&&bondTarget&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:1,textAlign:'center',padding:'3px 0',background:'rgba(232,168,32,0.15)',color:'var(--text-gold)'}}>⚡ BONDS WITH {bondTarget.name.toUpperCase()} +{bondBonus} ATK</div>}
              <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,background:'rgba(0,0,0,0.35)',overflow:'hidden'}}>{MEMBER_PORTRAITS[m.id]?<MemberPortrait id={m.id} size={55} noSquiggle/>:m.emoji}</div>
              <div style={{padding:'8px 12px 12px'}}>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,color:'var(--text-primary)',textAlign:'center',marginBottom:2}}>{m.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:'var(--text-secondary)',textAlign:'center',textTransform:'uppercase',marginBottom:8}}>{m.role}</div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'rgba(0,0,0,0.5)',borderRadius:4,marginBottom:6}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',textTransform:'uppercase',fontWeight:900}}>ATK</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'var(--text-blood)',lineHeight:1}}>{m.atk}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,alignSelf:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',fontWeight:700}}>{m.keyword}</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',textTransform:'uppercase',fontWeight:900}}>HP</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'var(--text-positive)',lineHeight:1}}>{m.hp}</div>
                  </div>
                </div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center',lineHeight:1.3}}>{m.desc}</div>
                {isDblTime&&hasDblTime&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-gold)',textAlign:'center',marginTop:6,letterSpacing:1}}>ONLY ONE DRUMMER</div>}
                {emptySlot===-1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',textAlign:'center',marginTop:6,letterSpacing:1}}>STAGE FULL</div>}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onPass}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'12px 40px',background:'rgba(40,20,5,0.5)',border:'2px solid #4a3010',borderRadius:3,color:'var(--text-secondary)',cursor:'pointer',transition:'all 0.2s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#8a6030';e.currentTarget.style.color='#c8a040'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4a3010';e.currentTarget.style.color='#c8a040'}}>
        Pass — No Recruitment
      </button>

      {/* FIRE PANEL — only shown when stage is full */}
      {isFull&&onFireMember&&(
        <div style={{position:'absolute',bottom:24,right:24,width:520,background:'linear-gradient(160deg,#0e0a16,#080510)',border:'2px solid rgba(220,60,20,0.7)',borderRadius:12,padding:'20px 24px',boxShadow:'0 0 40px rgba(200,40,0,0.35)',zIndex:9700}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:38,color:'var(--text-blood)',textAlign:'center',marginBottom:6,textShadow:'0 0 20px rgba(255,60,20,0.8)'}}>🔥 Fire a Member</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-blood)',textAlign:'center',fontStyle:'italic',marginBottom:16}}>{salesRemaining>0?'Fire one to open a slot':"Sly's out of cash — no sales left this visit"}</div>
          {activeMembers.map(({m,i})=>(
            <div key={m.uid||i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',marginBottom:10,background:'rgba(0,0,0,0.35)',borderRadius:8,border:'1px solid rgba(180,60,20,0.35)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,flex:1,minWidth:0}}>
                <span style={{fontSize:36}}>{m.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:24,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',letterSpacing:1}}>{m.keyword} · ATK {m.atk} · HP {m.hp}</div>
                </div>
              </div>
              {/* Aug 4 2026: this panel sells through the same handler as Sly's
                  pawn shop, so it now honours the same 2-sales-per-visit cap.
                  Fire three from here then Pass used to net three extra sales. */}
              <button
                disabled={salesRemaining<=0}
                onClick={()=>{if(salesRemaining>0)onFireMember(m,i)}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:1,padding:'10px 16px',background:'rgba(160,30,10,0.4)',border:'2px solid rgba(220,60,20,0.6)',borderRadius:6,color:'var(--text-blood)',cursor:salesRemaining>0?'pointer':'not-allowed',opacity:salesRemaining>0?1:0.4,whiteSpace:'nowrap',flexShrink:0,marginLeft:14}}
                onMouseEnter={e=>{if(salesRemaining>0)e.currentTarget.style.background='rgba(200,40,10,0.65)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(160,30,10,0.4)'}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:4}}>🔥 {fireSellPrice(m)}<WeedLeaf size={14}/></span>
              </button>
            </div>
          ))}
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-secondary)',textAlign:'center',marginTop:10,letterSpacing:1,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>Stash: {stash}<WeedLeaf size={14}/> · Refund shown per member · {salesRemaining} sale{salesRemaining===1?'':'s'} left</div>
        </div>
      )}
    </div>
  )
}

// (RemasterModal deleted Aug 4 2026 — the modal was unreachable dead code: no
//  setRemasterOpen(true) / setRemasterCards() call existed anywhere in the repo.)


// onClose was passed by the call site but never destructured, so Confirm (disabled
// until a card is picked) was the ONLY exit — an empty setlistCards array made this
// a permanent softlock. Cancel button added Aug 4 2026.
function SetlistModal({hand,onConfirm,onClose}){
  // Draw 2 already happened — player must pick 1 card to discard before continuing
  const [picked,setPicked]=useState(null)
  const [hovUid,setHovUid]=useState(null)
  return(
    <div style={{position:'absolute',inset:0,zIndex:9700,background:'rgba(4,2,1,0.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:'40px 20px'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--text-positive)',textShadow:'0 0 30px rgba(40,200,60,0.5)'}}>Setlist</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-positive)',fontStyle:'italic'}}>You drew 2 cards. Now discard 1 to continue.</div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',maxWidth:1100}}>
        {hand.map((card)=>{
          const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
          const sel=picked===card.uid
          const hov=hovUid===card.uid
          return(
            <div key={card.uid} onClick={()=>setPicked(sel?null:card.uid)}
              onMouseEnter={()=>setHovUid(card.uid)} onMouseLeave={()=>setHovUid(null)}
              style={{width:150,background:sel?'linear-gradient(180deg,#2a1a0a,#160e05)':'linear-gradient(180deg,#201408,#100804)',
                border:sel?'2px solid #cc0000':'2px solid '+bc+'66',borderRadius:7,overflow:'visible',cursor:'pointer',
                transform:sel?'translateY(-12px) scale(1.05)':'none',transition:'all 0.15s',
                boxShadow:sel?'0 0 20px rgba(200,0,0,0.6)':'none',position:'relative'}}>
              <div style={{height:4,background:sel?'#cc0000':bc,borderRadius:'5px 5px 0 0'}}/>
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}><CardArtImg id={card.id} emoji={card.emoji} size={60}/></div>
              <div style={{padding:'6px 8px 10px'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:sel?'#ff6666':'var(--text-primary)',textAlign:'center',marginBottom:3}}>{card.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,textAlign:'center',letterSpacing:2,textTransform:'uppercase'}}>{card.type}</div>
              </div>
              {sel&&<div style={{background:'rgba(180,0,0,0.3)',padding:'4px',textAlign:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-blood)',letterSpacing:2,borderRadius:'0 0 5px 5px'}}>DISCARD</div>}
              {hov&&card.effect&&<div style={{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',width:240,background:'rgba(8,4,2,0.98)',border:'1px solid '+bc+'aa',borderRadius:5,padding:'10px 12px',zIndex:99999,pointerEvents:'none',boxShadow:'0 8px 32px rgba(0,0,0,0.9), 0 0 16px '+bc+'33'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,gap:8}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:bc,letterSpacing:2,textTransform:'uppercase'}}>{card.type}{card.rarity?' · '+card.rarity:''}</div>
                  {card.embers>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-gold)'}}>{card.embers}🔥</div>}
                </div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-primary)',lineHeight:1.45}}>{card.effect}</div>
              </div>}
            </div>
          )
        })}
      </div>
      <button onClick={()=>picked&&onConfirm(picked)} disabled={!picked}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',
          padding:'14px 60px',background:picked?'rgba(30,130,30,0.4)':'rgba(20,20,20,0.4)',
          border:picked?'2px solid #44dd44':'2px solid var(--text-muted)',borderRadius:3,
          color:picked?'#44dd44':'var(--text-muted)',cursor:picked?'pointer':'not-allowed',transition:'all 0.15s'}}>
        ✓ Discard &amp; Continue
      </button>
      <button onClick={()=>onClose&&onClose()}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,letterSpacing:4,textTransform:'uppercase',
          padding:'10px 40px',background:'rgba(20,12,4,0.6)',
          border:'1px solid var(--text-muted)',borderRadius:3,
          color:'var(--text-muted)',cursor:'pointer',transition:'all 0.15s'}}>
        ✕ Cancel
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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:22,color:'var(--text-primary)',lineHeight:1.5,marginBottom:16,textShadow:'0 1px 3px rgba(0,0,0,0.8)'}}>{tip.text}</div>
        <button onClick={onDismiss} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,color:'var(--text-gold)',background:'rgba(232,168,32,0.15)',border:'2px solid #e8a820',borderRadius:6,padding:'10px 32px',cursor:'pointer',textTransform:'uppercase',display:'block',margin:'0 auto'}}>Got it</button>
      </div>
    </div>
  )
}

// ═══ TUTORIAL POST-FIGHT MESSAGE ═══
function TutorialMessage({text,onContinue,isFinal}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:99998,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:600,background:'linear-gradient(180deg,#1a1208,#0a0704)',border:'3px solid '+(isFinal?'#cc1111':'#e8a820'),borderRadius:12,padding:'40px 48px',textAlign:'center',boxShadow:'0 0 80px '+(isFinal?'rgba(200,0,0,0.5)':'rgba(232,168,32,0.4)')}}>
        {isFinal&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--text-blood)',textShadow:'0 0 30px rgba(200,0,0,0.8)',letterSpacing:8,marginBottom:16}}>Tutorial Complete</div>}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:isFinal?20:24,color:'var(--text-primary)',lineHeight:1.6,marginBottom:24}}>{isFinal?'You know the basics. The full descent awaits — 9 Circles, 27 enemies, 1 chance. Discover Riff Chains, forge upgrades, and choose your pacts. The deeper you go, the darker it gets.':text}</div>
        <button onClick={onContinue} style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,letterSpacing:6,color:isFinal?'#ee2222':'#e8a820',background:isFinal?'rgba(200,0,0,0.2)':'rgba(232,168,32,0.15)',border:'2px solid '+(isFinal?'#cc1111':'#e8a820'),borderRadius:6,padding:'14px 48px',cursor:'pointer',textTransform:'uppercase',whiteSpace:'nowrap'}}>{isFinal?'⛧ Enter the Vestibule ⛧':'Continue'}</button>
      </div>
    </div>
  )
}

function App(){
  const [gameState,setGameState]=useState('menu')
  const [screenFade,setScreenFade]=useState(false)
  const [showDebugHud,setShowDebugHud]=useState(false)
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
  const [showTutorialMsg,setShowTutorialMsg]=useState(null) // post-fight message
  const getDailySeed=()=>{const d=new Date();return parseInt(d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))}
  const [runSeed,setRunSeed]=useState(()=>Math.floor(Math.random()*0xFFFFFF))
  const [isDailyRun,setIsDailyRun]=useState(false)
  const [fightIndex,setFightIndex]=useState(0)
  const [enemy,setEnemy]=useState(ENEMIES[0])
  const [enemyHp,setEnemyHp]=useState(ENEMIES[0].maxHp)
  // Aug 1 2026: live mirror of enemyHp. The victory safety net fires on a delayed
  // timer and MUST re-read HP at fire time — see the PHANTOM VICTORY fix below.
  const enemyHpRef=useRef(ENEMIES[0].maxHp)
  useEffect(()=>{enemyHpRef.current=enemyHp},[enemyHp])
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
  const stashMilestonesRef=useRef({100:false,200:false,300:false,420:false})
  useEffect(()=>{
    if(gameState!=="playing"&&gameState!=="shop")return
    const ms=stashMilestonesRef.current
    if(stash>=420&&!ms[420]){ms[420]=true;addLog("🌿🌿🌿 420! THE SACRED NUMBER! 🌿🌿🌿")
      try{const _c=new(window.AudioContext||window.webkitAudioContext)();[440,554,659,880].forEach((f,i)=>{const o=_c.createOscillator();const g=_c.createGain();o.type="sine";o.frequency.value=f;g.gain.value=0.1;o.connect(g);g.connect(_c.destination);o.start(_c.currentTime+i*0.15);o.stop(_c.currentTime+i*0.15+0.2)})}catch(e){}}
    else if(stash>=300&&!ms[300]){ms[300]=true;try{const _c=new(window.AudioContext||window.webkitAudioContext)();const o=_c.createOscillator();const g=_c.createGain();o.type="sine";o.frequency.value=700;g.gain.value=0.08;o.connect(g);g.connect(_c.destination);o.start();o.stop(_c.currentTime+0.1)}catch(e){}}
    else if(stash>=200&&!ms[200]){ms[200]=true;try{const _c=new(window.AudioContext||window.webkitAudioContext)();const o=_c.createOscillator();const g=_c.createGain();o.type="sine";o.frequency.value=600;g.gain.value=0.07;o.connect(g);g.connect(_c.destination);o.start();o.stop(_c.currentTime+0.08)}catch(e){}}
    else if(stash>=100&&!ms[100]){ms[100]=true;try{const _c=new(window.AudioContext||window.webkitAudioContext)();const o=_c.createOscillator();const g=_c.createGain();o.type="sine";o.frequency.value=500;g.gain.value=0.06;o.connect(g);g.connect(_c.destination);o.start();o.stop(_c.currentTime+0.06)}catch(e){}}
  },[stash,gameState])
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
  // showDiscardPreview removed — discard pile now viewed exclusively through the lower-left DiscardPile component (setDiscardViewOpen)
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
  // Echoplex/Looper/Sabbath replay animations — each has its own card-flight with polychrome trail
  const [echoplexReplays,setEchoplexReplays]=useState([]) // [{key,cardId,cardName,cardEmoji,cardType,fromX,fromY,toX,toY,kind}]
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
  const [setlistRewriteUsed,setSetlistRewriteUsed]=useState(false)

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
  const lastRiffPlayedRef=useRef(null)
  const [cardsPlayedThisStrike,setCardsPlayedThisStrike]=useState([])
  const cardsPlayedRef=useRef([])
  const combosFiredRef=useRef([])
  // Discard tracking refs for new modifier system (Spit Cup, Ouroboros Pin)
  const discardsThisFightRef=useRef(0)
  const discardsThisStrikeRef=useRef(0)
  // Aug 4 2026 (phase 3) — CROSS-FIGHT STALE TIMERS.
  // handleStrike/handleStrikeBody schedule a long chain of setTimeouts (cascade
  // safety net, boss counter-attack, draw refill…) that each capture THIS fight's
  // numbers. If the fight ends inside that window — kill, Lucifer phase handoff,
  // wipe, tutorial restart — the timers still fired and corrupted the NEXT fight:
  // the new boss got slammed to the old boss's leftover HP, the old boss's
  // counter-attack landed on the new band, the previous fight's refill count
  // overwrote the new hand. fightTokenRef is bumped at every fight-start boundary;
  // every deferred body captures it and bails when it no longer matches.
  const fightTokenRef=useRef(0)
  const strikeTimersRef=useRef([])
  const beginFightToken=()=>{
    fightTokenRef.current++
    try{(strikeTimersRef.current||[]).forEach(t=>clearTimeout(t))}catch(e){}
    strikeTimersRef.current=[]
    strikeInFlightRef.current=0
  }
  // Live mirrors of values that deferred strike bodies read. State closures inside
  // a setTimeout are one full strike stale (CLAUDE.md rule 3).
  const bossDebuffRef=useRef(0)
  const bossRageAtkRef=useRef(0)
  const luciferPhaseRef=useRef(0)
  // Set while a strike's damage pipeline is mid-flight (per-member impacts have
  // started, cascade block has not yet resolved victory). The 600ms victory
  // safety net must not fire inside this window or it beats the cascade.
  const strikeInFlightRef=useRef(0)
  // Snapshot of the chains fired on the most recent strike — the strike body
  // empties combosFiredRef ~2.8s before the victory summary is built.
  const lastStrikeCombosRef=useRef([])
  // Monotonic key for DamageBreakdown so React never reuses a previous strike's instance.
  const breakdownSeqRef=useRef(0)
  // Wah Pedal: tracks whether first-CORRUPT-free has been used this fight
  const wahPedalUsedRef=useRef(false)
  // Octave Pedal: tracks whether first chain double has fired this fight
  const octavePedalFiredRef=useRef(false)
  // Tablet of Az'Tothoth (mythic): tracks first-chain-of-fight upgrade
  const tabletFiredRef=useRef(false)
  // The Looper / Echoplex: queued retriggers for end of strike
  const queuedReplaysRef=useRef([])  // array of {cardId, kind:'looper'|'echoplex', slotIdx}
  const [comboFlash,setComboFlash]=useState(null)
  const [chainCallout,setChainCallout]=useState(null) // {name,color,emoji}
  const [combosDiscoveredThisRun,setCombosDiscoveredThisRun]=useState([])
  const discoveredRef=useRef(new Set())
  const [bossDebuff,setBossDebuff]=useState(0)
  const [bossRageAtk,setBossRageAtk]=useState(0)
  useEffect(()=>{bossDebuffRef.current=bossDebuff},[bossDebuff])
  useEffect(()=>{bossRageAtkRef.current=bossRageAtk},[bossRageAtk])
  // Wrathful self-immolation: stacks each strike, +50% dmg per stack, also loses 8% maxHp/strike
  const [immolateStacks,setImmolateStacks]=useState(0)
  const [dblRoll,setDblRoll]=useState(null) // null=not rolled, 1-2=half, 3-4=offbeat, 5-6=double
  // shredderUsed state removed in commit 4c — SHREDDER no longer grants
  // an ember discount; it now grants per-chain ATK via getEffectiveAtk.
  // ANCHOR (4d) — lethal save mechanic. Tier locked at fight start.
  // tier 1 = save 1 lethal hit / fight on any ANCHOR member
  // tier 2 = save 2 lethal hits / fight on any ANCHOR member
  // tier 4 (3+ stacks) = ANY member can be saved (not just ANCHORs), 4 saves / fight
  const anchorTierRef=useRef(0)
  const anchorSavesUsedRef=useRef(0)
  // Returns true if save fires (caller sets hp=1 instead of killing the member).
  // Mutates the saves-used counter on success. Only fires for boss damage; voluntary
  // member deaths (Mosh Pit, Devil's Wager, Russian Roulette, Blood Oath) bypass.
  const _tryAnchorSave=(target)=>{
    if(!target)return false
    const cap=anchorTierRef.current
    if(!cap)return false
    if(anchorSavesUsedRef.current>=cap)return false
    if(cap<4&&target.keyword!=='ANCHOR')return false // tier 1-2: only ANCHORs save themselves
    anchorSavesUsedRef.current++
    return true
  }
  // ── DECK SIGNATURES (commit 2/4) ──
  // Shredder: every Riff Chain fired this strike → echo for 50% of strike damage on
  //   the NEXT strike. shredderEchoesPendingRef stores number of pending chains; the
  //   echo damage = (next strike's base damage) × 0.5 × pendingChainCount.
  const shredderEchoesPendingRef=useRef(0)
  // Ritualist: every 10% of corruption GAINED refunds 1 ember (max 3/strike).
  //   Tracked via a useEffect watching corruption changes. Resets each strike.
  const ritualistPrevCorruptionRef=useRef(0)
  const ritualistEmberRefundsThisStrikeRef=useRef(0)
  // Survivor: each member gets ONE per-fight save when they would go tooStoned —
  // they're healed to 25% maxHp instead. Tracked via Set of member uids that have
  // already used their save this fight. Reset at fight start.
  const survivorSavesUsedRef=useRef(new Set())
  const [nextCardFree,setNextCardFree]=useState(false)
  const nextCardFreeRef=useRef(false)
  useEffect(()=>{nextCardFreeRef.current=nextCardFree},[nextCardFree])
  const [allCardsFree,setAllCardsFree]=useState(false) // POSSESSION hellquake: all cards cost 0 this fight
  const allCardsFreeRef=useRef(false)
  useEffect(()=>{allCardsFreeRef.current=allCardsFree},[allCardsFree])
  // ── FREE CARDS COUNTER (v0.7.2) — used by BLOTTER REVELATION trip ──
  // Decrements each time a card is played at zero cost via this counter.
  // Different from `nextCardFree` (single-shot bool) and `allCardsFree`
  // (whole-fight bool) — this is "next N cards free."
  const [freeCardsLeft,setFreeCardsLeft]=useState(0)
  const freeCardsLeftRef=useRef(0)
  useEffect(()=>{freeCardsLeftRef.current=freeCardsLeft},[freeCardsLeft])
  // ── BOSS SKIP COUNTER (v0.7.2) — used by DMT BREAKTHROUGH and K-HOLE trips ──
  // When >0, the boss's incoming attack is fully skipped this strike and the
  // counter decrements. Boss can still attack normally next strike if hits 0.
  // Resets on fight end / run reset (search "bossSkipStrikes").
  const [bossSkipStrikes,setBossSkipStrikes]=useState(0)
  const bossSkipStrikesRef=useRef(0)
  useEffect(()=>{bossSkipStrikesRef.current=bossSkipStrikes},[bossSkipStrikes])
  const [setlistOpen,setSetlistOpen]=useState(false)
  const [setlistCards,setSetlistCards]=useState([])
  const [deathCause,setDeathCause]=useState('fallen')
  const [lastKillingBlow,setLastKillingBlow]=useState('')
  const [hellquakeAnim,setHellquakeAnim]=useState(null)
  const [milestoneFlash,setMilestoneFlash]=useState(null) // {text,color} for boss HP milestones
  const [strikeMult,setStrikeMult]=useState(1.0)
  const multMilestonesRef=useRef({2:false,4:false,8:false,16:false}) // score multiplier that builds per card played
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
  const [pendingEvent,setPendingEvent]=useState(null)
  // ── HANGOVER SYSTEM (v0.7.1) — corruption never kills; it costs you tomorrow ─────
  // Tracks the peak corruption hit during a fight. On victory, that peak becomes
  // `hangover`, which costs the player on the *next* fight + shop:
  //   • Shop tax: prices ×(1 + tier) at 50/75/100% breakpoints
  //   • Max HP debuff: -floor(hangover/33) per member next fight, restored at boss kill
  //   • Stash haircut: 90%+ peak halves payout, 100% halves harder
  // peakCorruptionRef tracks live, hangover state holds the carried-over value.
  const [hangover,setHangover]=useState(0)
  const peakCorruptionRef=useRef(0)
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
  const [phaseBanner,setPhaseBanner]=useState('play')
  const [postStrikeFlash,setPostStrikeFlash]=useState(null)
  const [mvpFlash,setMvpFlash]=useState(null) // {name, dmg, pct} // {dmg, mult, isNewBest}
  const [currentTip,setCurrentTip]=useState('') // 'play','strike','boss'
  const [deckViewOpen,setDeckViewOpen]=useState(false)
  const [discardViewOpen,setDiscardViewOpen]=useState(false)
  const [circleArtifact,setCircleArtifact]=useState(()=>rollShopArtifact())
  const relicsSeenRef=useRef(new Set()) // v0.8 scarcity: each relic offered once per run
  const [circlePassive,setCirclePassive]=useState(()=>rollShopPedal())
  const [activeArtifacts,setActiveArtifacts]=useState([])
  const [triggeredArtifactId,setTriggeredArtifactId]=useState(null) // max 3
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
  const [showCollection,setShowCollection]=useState(false)
  const [selectedDeck,setSelectedDeck]=useState(()=>localStorage.getItem('vst_active_deck')||'standard')
  // Persist deck selection so calcRunScore can apply deck.scoreMult on game-over
  useEffect(()=>{localStorage.setItem('vst_active_deck',selectedDeck)},[selectedDeck])
  const [encoreMode,setEncoreMode]=useState(false)
  const [encoreCircle,setEncoreCircle]=useState(0)
  const [showTrophies,setShowTrophies]=useState(false)
  const [showStats,setShowStats]=useState(false)
  const [activeStakeId,setActiveStakeId]=useState(()=>localStorage.getItem('vst_active_stake')||'bronze')
  const activeStake=STAKES.find(s=>s.id===activeStakeId)||STAKES[0]

  // Single source of truth for displayed enemy HP — must match fight-start scaling
  // (line ~7387). Stake.hpMult is intentionally NOT applied here because the live
  // fight code doesn't use it either; the deck.hpScale is the canonical difficulty knob.
  // If we ever want stake.hpMult to actually affect combat, wire it into the fight-start
  // formula AND this helper at the same time.
  const getScaledMaxHp=useCallback((e)=>{
    // LUCIFER (Jul 31 2026, JV): flat 666,666 total — 333,333 per phase. No deck
    // scaling, no boss-kill reduction. The number IS the design.
    if(e&&(e.passiveId==='luciferBoss'||e.id==='lucifer')){
      const _lhl=parseInt(localStorage.getItem('vst_heat')||'1')
      return Math.ceil(333333*(1+Math.max(0,_lhl-1)*0.15)*(encoreMode?2.0:1.0)) // 666,666 total at Heat 1, scales with NG+
    }
    if(!e)return 0
    const _ds=(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).hpScale||1
    const _hl=parseInt(localStorage.getItem('vst_heat')||'1')
    const _hm=1+(Math.max(0,_hl-1)*0.15)
    return Math.ceil(e.maxHp*_ds*_hm*_stakeHpF()*(encoreMode?2.0:1.0))
  },[selectedDeck,encoreMode])

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
  // Volume change handler — update currently playing track when slider moves
  useEffect(()=>{
    const track=currentTrackRef.current
    if(track&&audioRef.current[track]){
      audioRef.current[track].volume=musicVol
    }
  },[musicVol])

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
  const [shopCards,setShopCards]=useState(()=>genShopCards(1))
  const [boosterPacks,setBoosterPacks]=useState(()=>genBoosterPacks(1))
  const [recruitPack,setRecruitPack]=useState(()=>genRecruitPack(0))
  // ── RECRUIT PACK BUY LOCK (v0.7.3) — parent-level so it survives ShopScreen
  // unmount when gameState→'recruit'. Was a ShopScreen-local `leftBought.rec`
  // before, which reset on every shop remount → infinite-buy + sell-member
  // farm exploit. Resets at every shop regen site.
  const [recruitBought,setRecruitBought]=useState(false)
  // ── SLOT SWAP MODAL (v0.7.10) ───────────────────────────────────
  // When the player tries to buy an artifact/pedal with full slots, instead
  // of just blocking and silently eating their stash (the old behavior),
  // open this modal: shows the 3 current artifacts (or 2 pedals) and the
  // incoming item; click one to swap. Cancel just closes — no purchase.
  // Stash is deducted ONLY on confirm. Shape: null | {type:'artifact'|'passive', incoming:item, cost:number}
  const [slotSwapPrompt,setSlotSwapPrompt]=useState(null)
  const [recruitCandidates,setRecruitCandidates]=useState([])
  const [demonicConflict,setDemonicConflict]=useState(null)
  const [rerollCost,setRerollCost]=useState(2)
  // Aug 4 2026 — PER-SHOP-VISIT state that used to live inside ShopScreen and
  // therefore evaporated on every reroll (the [shopCards] effect) and on every
  // shop→recruit→shop round trip (component unmount). Both are reset alongside
  // `recruitBought` at every shop entry.
  const [boughtPackIds,setBoughtPackIds]=useState([])   // booster packs opened this visit
  const [pawnSalesLeft,setPawnSalesLeft]=useState(2)    // Sly's "Max 2 sales per visit"
  const [shopBoughtIds,setShopBoughtIds]=useState([])
  const [shopSoldIds,setShopSoldIds]=useState([])
  const [circleCartBought,setCircleCartBought]=useState(false)
  const [circleCpasBought,setCirCleCpasBought]=useState(false)
  // ── DEALER: Mushrooms & Acid ──────────────────────────────────
  const [heldShrooms,setHeldShrooms]=useState(0) // player is holding shrooms
  const [heldAcid,setHeldAcid]=useState(0) // player is holding acid
  // ── DMT (v0.7.2 third drug tier) ─────────────────────────────────
  // Premium drug, sold only at boss shops (every 3rd shop). 25🌿. No bad
  // trips at this tier — "you paid for the good shit." Eight high-impact
  // effects, all variations on "I am god this fight." Same drugMax cap.
  const [heldDMT,setHeldDMT]=useState(0)
  const [dmtInStock,setDMTInStock]=useState(false)
  const [drugsUsedThisRun,setDrugsUsedThisRun]=useState({shrooms:0,acid:0})
  const [shroomsInStock,setShroomsInStock]=useState(()=>Math.random()<0.50)
  const [acidInStock,setAcidInStock]=useState(()=>Math.random()<0.50)
  const [activeTripEffect,setActiveTripEffect]=useState(null) // {type,name,desc,color} — shown as dramatic reveal
  const [fightTripBuff,setFightTripBuff]=useState(null) // persists for entire fight — combat checks read this
  const [luciferPhase,setLuciferPhase]=useState(0) // 0=not lucifer, 1=phase1 ice, 2=phase2 satan
  useEffect(()=>{luciferPhaseRef.current=luciferPhase},[luciferPhase])
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
    // ── TUTORIAL GUARD (Aug 4 2026, phase 4) ───────────────────────────────
    // updStat had no tutorialFight guard, and cardsPlayedThisFightRef /
    // highestStrikeThisFightRef / damageThisFightRef feed off it — so the first
    // real run's end-screen score included three tutorial fights' worth of
    // strikesThrown / totalDamage / cardsPlayed. Tutorial fights are not a run.
    if(tutorialFight>0)return
    isMax=isMax||false
    setStats(p=>Object.assign({},p,{[key]:isMax?Math.max(p[key],val):p[key]+val}))
    if(key==='cardsPlayed')cardsPlayedThisFightRef.current+=val
    else if(key==='highestStrike')highestStrikeThisFightRef.current=Math.max(highestStrikeThisFightRef.current,val)
    else if(key==='totalDamage')damageThisFightRef.current+=val
  }
  // ── MYTHIC UNLOCK SYSTEM ──
  // Tracks per-run conditions for unlocking the 6 mythic modifiers (Inverted Cross,
  // Tongue of the Devourer, Sigil of Set, Witch's Sabbath, The Conduit, Tablet of Az'Tothoth).
  // Conditions are HIDDEN — discovered through play. localStorage 'vst_mythic_unlocks'.
  // Per-run trackers
  const luciferStrikesUsedRef=useRef(0)  // strikes used to defeat Lucifer (lower = better)
  const fightLossMembersRef=useRef(new Set())  // member uids lost during current fight
  const chainsFiredThisRunRef=useRef(new Set())  // chain IDs fired this run
  const runStonedMembersRef=useRef(new Set())  // unique uids of members that were Too Stoned at any point this run
  const soloMembersUsedRef=useRef(new Set())  // unique members ever on stage in this run
  const [mythicUnlockOverlay,setMythicUnlockOverlay]=useState(null) // {name, emoji, hint}
  const fireMythicUnlock=useCallback((unlockId)=>{
    let unlocked=[]
    try{unlocked=JSON.parse(localStorage.getItem('vst_mythic_unlocks')||'[]')}catch(e){}
    if(unlocked.includes(unlockId))return // already unlocked
    unlocked.push(unlockId)
    localStorage.setItem('vst_mythic_unlocks',JSON.stringify(unlocked))
    // Find the mythic for the overlay
    const all=[...MYTHIC_ARTIFACTS,...MYTHIC_PEDALS]
    const mythic=all.find(m=>m.unlockId===unlockId)
    if(mythic){
      setMythicUnlockOverlay({name:mythic.name,emoji:mythic.emoji,effect:mythic.effect})
      addLog('⛧⛧⛧ MYTHIC UNLOCKED: '+mythic.emoji+' '+mythic.name+' ⛧⛧⛧')
      playSfx('victory')
      try{triggerShake(15,800)}catch(e){}
      // Auto-dismiss overlay after 5 seconds
      setTimeout(()=>setMythicUnlockOverlay(null),5000)
    }
  },[])
  const discover=(mechanic,label)=>{
    if(discoveredRef.current.has(mechanic))return
    discoveredRef.current.add(mechanic)
    setDiscovered(prev=>{const next=new Set(prev);next.add(mechanic);return next})
    addFloat('⛧ DISCOVERED: '+label,getCenter(bossRef).x,getCenter(bossRef).y-160,'#ffdd00',true)
    addLog('⛧ DISCOVERED: '+label+' — first time!')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── RESET REGISTRY (Aug 4 2026, phase 4) ───────────────────────────────
  // CLAUDE.md rule 5 lives HERE. Every piece of App state/ref that has to be
  // wiped at a boundary is registered in exactly one of these three maps,
  // keyed by its own variable name. Adding a `useState`/`useRef` therefore has
  // one obvious place to be declared — and the dev-only invariant at the
  // bottom of App re-reads App's own source, extracts every declaration name,
  // and console.warns for anything that isn't registered anywhere.
  //
  //   PER_FIGHT_RESETS — wiped at EVERY fight boundary. Four call sites, all
  //     via resetPerFightState(): the normal between-fight block, the
  //     Welcome-to-Hell Executive branch, startTutorialFight, and handleReset.
  //     Anything here is therefore automatically covered at the run boundary
  //     too — that is the whole point of the extraction. Before this existed
  //     the Welcome-to-Hell branch was missing ~35 of these and the tutorial
  //     ~55, and the two diffs regrew every time state was added.
  //   PER_RUN_RESETS   — wiped only when a new run starts (handleReset).
  //   RESET_EXEMPT     — deliberately never reset, with the reason.
  //
  // Every thunk takes the same opts bag so the maps stay uniform:
  //   {corruption, handTarget, stage, drumThrone, strikes, discards,
  //    seed, startEmbers, startStash, startCorruption, maxStrikes}
  const PER_FIGHT_RESETS=useMemo(()=>({
    // ── animation / presentation transients ──
    animPhase:()=>setAnimPhase('idle'),
    phaseBanner:()=>setPhaseBanner('play'),
    isWiggling:()=>setIsWiggling(false),
    damageFlash:()=>setDamageFlash(false),
    cardAbsorb:()=>setCardAbsorb(null),
    projectiles:()=>setProjectiles([]),
    strikingMemberIdx:()=>setStrikingMemberIdx(-1),
    strikeAnim:()=>setStrikeAnim(null),
    bossStrikeAnim:()=>setBossStrikeAnim(null),
    hitMemberIdx:()=>setHitMemberIdx(-1),
    flyingCard:()=>setFlyingCard(null),
    echoplexReplays:()=>setEchoplexReplays([]),
    comboFlash:()=>setComboFlash(null),
    chainCallout:()=>setChainCallout(null),
    chainFlashActive:()=>setChainFlashActive(false),
    hellquakeAnim:()=>setHellquakeAnim(null),
    milestoneFlash:()=>setMilestoneFlash(null),
    clutchFlash:()=>setClutchFlash(null),
    postStrikeFlash:()=>setPostStrikeFlash(null),
    mvpFlash:()=>setMvpFlash(null),
    beastFlash:()=>setBeastFlash(false),
    beastTierFlash:()=>setBeastTierFlash(false),
    triggeredArtifactId:()=>setTriggeredArtifactId(null),
    preFightSplash:()=>setPreFightSplash(null),
    dmgBreakdown:()=>setDmgBreakdown(null),
    luciferCinematic:()=>setLuciferCinematic(null),
    // ── input / selection ──
    selected:()=>setSelected([]),
    quickPlayCardUid:()=>setQuickPlayCardUid(null),
    dragCardUid:()=>setDragCardUid(null),
    dragStageIdx:()=>setDragStageIdx(null),
    dragOverSlotIdx:()=>setDragOverSlotIdx(null),
    dragHandIdx:()=>setDragHandIdx(null),
    dragOverHandIdx:()=>setDragOverHandIdx(null),
    undoSnapshot:()=>setUndoSnapshot(null),
    setlistOpen:()=>setSetlistOpen(false),
    setlistCards:()=>setSetlistCards([]),
    deckViewOpen:()=>setDeckViewOpen(false),
    discardViewOpen:()=>setDiscardViewOpen(false),
    // ── resource / combat counters ──
    strikesLeft:o=>{const s=o.strikes!=null?o.strikes:MAX_STRIKES;setStrikesLeft(s)},
    fightMaxStrikes:o=>{const s=o.strikes!=null?o.strikes:MAX_STRIKES;setFightMaxStrikes(s)},
    discardsLeft:o=>{const d=o.discards!=null?o.discards:MAX_DISCARDS;setDiscardsLeft(d)},
    fightMaxDiscards:o=>{const d=o.discards!=null?o.discards:MAX_DISCARDS;setFightMaxDiscards(d)},
    pendingDraw:()=>setPendingDraw(0),
    pendingEmbers:()=>setPendingEmbers(0),
    bonusDiscards:()=>setBonusDiscards(0),
    bonusEmbers:()=>setBonusEmbers(0),
    pendingBurningStage:()=>setPendingBurningStage(false),
    stageDiveUsed:()=>setStageDiveUsed(false),
    slowBurnStrikes:()=>setSlowBurnStrikes(0),
    venomDotStacks:()=>setVenomDotStacks(0),
    ampFeedbackDiscount:()=>setAmpFeedbackDiscount(0),
    pyromaniacActive:()=>setPyromaniacActive(false),
    immolateStacks:()=>setImmolateStacks(0),
    memberBuffs:()=>setMemberBuffs({}),
    stashStolenThisFight:()=>setStashStolenThisFight(0),
    stolenAtkPool:()=>setStolenAtkPool(0),
    contractsPlayed:()=>setContractsPlayed(0),
    // ── boss-side per-fight debuffs (state + live mirror ref) ──
    bossDebuff:()=>setBossDebuff(0),
    bossDebuffRef:()=>{bossDebuffRef.current=0},
    bossRageAtk:()=>setBossRageAtk(0),
    bossRageAtkRef:()=>{bossRageAtkRef.current=0},
    bossSkipStrikes:()=>setBossSkipStrikes(0),
    bossSkipStrikesRef:()=>{bossSkipStrikesRef.current=0},
    // ── free-card economy (state + ref pairs) ──
    nextCardFree:()=>setNextCardFree(false),
    nextCardFreeRef:()=>{nextCardFreeRef.current=false},
    allCardsFree:()=>setAllCardsFree(false),
    allCardsFreeRef:()=>{allCardsFreeRef.current=false},
    freeCardsLeft:()=>setFreeCardsLeft(0),
    freeCardsLeftRef:()=>{freeCardsLeftRef.current=0},
    lastRiffPlayed:()=>setLastRiffPlayed(null),
    lastRiffPlayedRef:()=>{lastRiffPlayedRef.current=null},
    strikeMult:()=>setStrikeMult(1.0),
    strikeMultRef:()=>{strikeMultRef.current=1.0},
    multMilestonesRef:()=>{multMilestonesRef.current={2:false,4:false,8:false,16:false}},
    // ── drugs / trips: a trip is explicitly ONE fight long ──
    tripUsedThisFight:()=>setTripUsedThisFight(false),
    activeTripEffect:()=>setActiveTripEffect(null),
    fightTripBuff:()=>setFightTripBuff(null),
    // ── card-flow refs ──
    cardsPlayedThisStrike:()=>setCardsPlayedThisStrike([]),
    cardsPlayedRef:()=>{cardsPlayedRef.current=[]},
    cardsToDrawRef:()=>{cardsToDrawRef.current=0},
    combosFiredRef:()=>{combosFiredRef.current=[]},
    lastStrikeCombosRef:()=>{lastStrikeCombosRef.current=[]},
    discardsThisFightRef:()=>{discardsThisFightRef.current=0},
    discardsThisStrikeRef:()=>{discardsThisStrikeRef.current=0},
    handTargetRef:o=>{handTargetRef.current=o.handTarget!=null?o.handTarget:HAND_SIZE},
    queuedReplaysRef:()=>{queuedReplaysRef.current=[]},
    // ── "first of fight" relic/pedal one-shots ──
    wahPedalUsedRef:()=>{wahPedalUsedRef.current=false},
    octavePedalFiredRef:()=>{octavePedalFiredRef.current=false},
    tabletFiredRef:()=>{tabletFiredRef.current=false},
    // ── deck signatures ──
    shredderEchoesPendingRef:()=>{shredderEchoesPendingRef.current=0},
    ritualistPrevCorruptionRef:o=>{ritualistPrevCorruptionRef.current=o.corruption||0},
    ritualistEmberRefundsThisStrikeRef:()=>{ritualistEmberRefundsThisStrikeRef.current=0},
    survivorSavesUsedRef:()=>{survivorSavesUsedRef.current=new Set()},
    anchorSavesUsedRef:()=>{anchorSavesUsedRef.current=0},
    anchorTierRef:o=>{
      const st=o.stage||[]
      const n=st.filter(m=>m&&!m.tooStoned&&m.keyword==='ANCHOR').reduce((s,m)=>s+(m.foil?2:1),0)
      anchorTierRef.current=_stackTier(n)
    },
    // ── per-fight bookkeeping ──
    milestonesFiredRef:()=>{milestonesFiredRef.current={half:false,quarter:false,tenth:false}},
    victoryFiredRef:()=>{victoryFiredRef.current=false},
    wthStrikesRef:()=>{wthStrikesRef.current=0},
    recruitPickFiredRef:()=>{recruitPickFiredRef.current=false},
    luciferStrikesUsedRef:()=>{luciferStrikesUsedRef.current=0},
    fightLossMembersRef:()=>{fightLossMembersRef.current=new Set()},
    luciferPhase:()=>setLuciferPhase(0),
    luciferPhaseRef:()=>{luciferPhaseRef.current=0},
    // ── per-fight stat refs (feed the victory summary) ──
    fightStartTimeRef:()=>{fightStartTimeRef.current=Date.now()},
    corruptionAtFightStartRef:o=>{corruptionAtFightStartRef.current=o.corruption||0},
    peakCorruptionRef:o=>{peakCorruptionRef.current=o.corruption||0},
    cardsPlayedThisFightRef:()=>{cardsPlayedThisFightRef.current=0},
    highestStrikeThisFightRef:()=>{highestStrikeThisFightRef.current=0},
    damageThisFightRef:()=>{damageThisFightRef.current=0},
    embersSpentThisFightRef:()=>{embersSpentThisFightRef.current=0},
    // ── DOUBLE TIME re-roll. Owned here so no fight-start path can forget it
    //    (the Welcome-to-Hell branch used to inherit Lucifer's roll for the
    //    whole Executive fight).
    dblRoll:o=>{
      const st=o.stage||[]
      const drummers=st.filter(m=>m&&m.role==='Drummer').length
      if(drummers===0){setDblRoll(null);return}
      let roll=Math.floor(Math.random()*6)+1
      if(drummers>=2&&roll<=2)roll=Math.floor(Math.random()*6)+1
      if(o.drumThrone){
        const rr=Math.floor(Math.random()*6)+1
        roll=Math.max(roll,rr)
        if(o.onLog)o.onLog('🪑 Drum Throne re-roll: kept '+roll)
      }
      setDblRoll(roll)
    },
  }),[])

  // ── PER-STRIKE RESETS ──────────────────────────────────────────────────
  // Run at the top of every strike resolution (handleStrikeBody) — the single
  // place these happen. Registered here so "what dies each strike" is data,
  // not a line buried 3,000 lines into the strike body.
  // opts: {evilEye:boolean}
  const PER_STRIKE_RESETS=useMemo(()=>({
    cardsPlayedThisStrike:()=>setCardsPlayedThisStrike([]),
    cardsPlayedRef:()=>{cardsPlayedRef.current=[]},
    combosFiredRef:()=>{combosFiredRef.current=[]},
    discardsThisStrikeRef:()=>{discardsThisStrikeRef.current=0},
    ritualistEmberRefundsThisStrikeRef:()=>{ritualistEmberRefundsThisStrikeRef.current=0},
    setlistRewriteUsed:()=>setSetlistRewriteUsed(false),
    // A3 Evil Eye reads "The first card you play each STRIKE costs 0 Embers",
    // but nextCardFree was armed only at fight start and consumed by the first
    // card played — one free card per FIGHT, a 4× shortfall at Bronze. Re-arm
    // it here so the relic does what its text says. (Aug 4 2026, phase 4)
    nextCardFree:o=>{if(o&&o.evilEye){setNextCardFree(true);nextCardFreeRef.current=true}},
  }),[])

  const resetPerFightState=useCallback(opts=>{
    const o=opts||{}
    for(const k in PER_FIGHT_RESETS)PER_FIGHT_RESETS[k](o)
  },[PER_FIGHT_RESETS])

  const resetPerStrikeState=useCallback(opts=>{
    const o=opts||{}
    for(const k in PER_STRIKE_RESETS)PER_STRIKE_RESETS[k](o)
  },[PER_STRIKE_RESETS])

  // ── PER_RUN_RESETS ─────────────────────────────────────────────────────
  // Run by handleReset AFTER resetPerFightState, so a run boundary is a
  // superset of a fight boundary by construction. handleReset is now the ONE
  // authoritative run-init path — the menu's "⛧ Enter the Vestibule ⛧" button
  // and EndScreen's "Play Again" both go through it, so a post-win reload and a
  // post-death restart produce byte-identical starting state. (Before Aug 4
  // 2026 phase 4 the menu button was a bare setGameState('booster'), so the
  // stake's startEmbers/startCorruption were never applied on that path and
  // the bot's overnight ledger was two different populations.)
  const PER_RUN_RESETS=useMemo(()=>({
    // ── run identity ──
    runSeed:o=>setRunSeed(o.seed),
    runStartTimeRef:()=>{runStartTimeRef.current=Date.now()},
    isDailyRun:()=>setIsDailyRun(false),
    gameState:()=>setGameState('booster'),
    // ── tutorial must never bleed into a real run ──
    tutorialFight:()=>setTutorialFight(0),
    tutorialTipIdx:()=>setTutorialTipIdx(0),
    showTutorialMsg:()=>setShowTutorialMsg(null),
    firstTip:()=>setFirstTip(null),
    // ── board ──
    fightIndex:()=>setFightIndex(0),
    enemy:()=>setEnemy(ENEMIES[0]),
    enemyHp:()=>setEnemyHp(ENEMIES[0].maxHp),
    scaledMaxHp:()=>setScaledMaxHp(ENEMIES[0].maxHp),
    stage:()=>setStage([null,null,null,null,null]),
    deck:()=>setDeck([]),
    hand:()=>setHand([]),
    discardPile:()=>setDiscardPile([]),
    // ── run economy (the two values the menu path used to skip entirely) ──
    embers:o=>setEmbers(o.startEmbers),
    maxEmbers:o=>setMaxEmbers(o.startEmbers),
    stash:o=>setStash(o.startStash),
    corruption:o=>setCorruption(o.corruption||0),
    hangover:()=>setHangover(0),
    // ── run-long progression ──
    chosenPacts:()=>setChosenPacts([]),
    pactChoices:()=>setPactChoices([]),
    upgradedCards:()=>setUpgradedCards([]),
    collectedLoot:()=>setCollectedLoot([]),
    newTrophies:()=>setNewTrophies([]),
    activeArtifacts:()=>setActiveArtifacts([]),
    activePassives:()=>setActivePassives([]),
    relicsSeenRef:()=>{relicsSeenRef.current=new Set()},
    descentData:()=>setDescentData(null),
    circleClearedData:()=>setCircleClearedData(null),
    circleSplash:()=>setCircleSplash(null),
    overrideFightIdxRef:()=>{overrideFightIdxRef.current=null},
    skipDescentRef:()=>{skipDescentRef.current=false},
    encoreMode:()=>setEncoreMode(false),
    encoreCircle:()=>setEncoreCircle(0),
    // ── shop / recruit ──
    // ── these five must land on the SAME value a fresh page load produces ──
    // handleReset used to null/empty them while the useState initialisers rolled
    // real content, so a post-death restart and a post-win reload disagreed about
    // whether circle 1's shops offered a relic/pedal at all. Mirror the
    // initialisers exactly. (Aug 4 2026, phase 4)
    shopCards:()=>setShopCards(genShopCards(1)),
    boosterPacks:()=>setBoosterPacks(genBoosterPacks(1)),
    recruitPack:()=>setRecruitPack(genRecruitPack(0)),
    circleArtifact:()=>setCircleArtifact(rollShopArtifact()),
    circlePassive:()=>setCirclePassive(rollShopPedal()),
    recruitBought:()=>setRecruitBought(false),
    recruitCandidates:()=>setRecruitCandidates([]),
    rerollCost:()=>setRerollCost(2),
    boughtPackIds:()=>setBoughtPackIds([]),
    pawnSalesLeft:()=>setPawnSalesLeft(2),
    shopBoughtIds:()=>setShopBoughtIds([]),
    shopSoldIds:()=>setShopSoldIds([]),
    circleCartBought:()=>setCircleCartBought(false),
    circleCpasBought:()=>setCirCleCpasBought(false),
    slotSwapPrompt:()=>setSlotSwapPrompt(null),
    gearSwapQueueRef:()=>{gearSwapQueueRef.current=[]},
    demonicConflict:()=>setDemonicConflict(null),
    // ── drugs ──
    shroomsInStock:()=>setShroomsInStock(Math.random()<0.50),
    acidInStock:()=>setAcidInStock(Math.random()<0.50),
    dmtInStock:()=>setDMTInStock(false),
    heldShrooms:()=>setHeldShrooms(0),
    heldAcid:()=>setHeldAcid(0),
    heldDMT:()=>setHeldDMT(0),
    drugsUsedThisRun:()=>setDrugsUsedThisRun({shrooms:0,acid:0,dmt:0}),
    // ── endgame / cinematics ──
    welcomeToHell:()=>setWelcomeToHell(null),
    victoryCinematic:()=>setVictoryCinematic(null),
    creditsRoll:()=>setCreditsRoll(false),
    victorySummary:()=>setVictorySummary(null),
    showConfetti:()=>setShowConfetti(false),
    bossQuoteTypewriter:()=>setBossQuoteTypewriter(null),
    deathCause:()=>setDeathCause('fallen'),
    lastKillingBlow:()=>setLastKillingBlow(''),
    currentTip:()=>setCurrentTip(''),
    mythicUnlockOverlay:()=>setMythicUnlockOverlay(null),
    newAchievements:()=>setNewAchievements([]),
    // ── events / corruption ──
    pendingEvent:()=>setPendingEvent(null),
    eventsSeenThisRun:()=>setEventsSeenThisRun([]),
    corruptionFlash:()=>setCorruptionFlash(null),
    lastCorruptThreshold:()=>{lastCorruptThreshold.current=0},
    corrPowerShownRef:()=>{corrPowerShownRef.current=false},
    // ── Aug 4 2026 phase 4: these three had NO reset anywhere in the file.
    //    corruptCardsGivenRef: run 1 got the free CORRUPT cards at 25/50/75%
    //      and every later run in the same page session got zero.
    //    discoveredRef: handleReset cleared the `discovered` STATE but not the
    //      ref that gates discover(), so from run 2 on the EndScreen discovery
    //      list was empty and the "⛧ DISCOVERED" float never fired again.
    //    stashMilestonesRef: the 100/200/300/420 log lines + the 420 arpeggio
    //      fired at most once per page session.
    corruptCardsGivenRef:()=>{corruptCardsGivenRef.current=[]},
    discoveredRef:()=>{discoveredRef.current=new Set()},
    discovered:()=>setDiscovered(new Set()),
    stashMilestonesRef:()=>{stashMilestonesRef.current={100:false,200:false,300:false,420:false}},
    combosDiscoveredThisRun:()=>setCombosDiscoveredThisRun([]),
    // ── mythic-unlock per-run trackers ──
    chainsFiredThisRunRef:()=>{chainsFiredThisRunRef.current=new Set()},
    soloMembersUsedRef:()=>{soloMembersUsedRef.current=new Set()},
    runStonedMembersRef:()=>{runStonedMembersRef.current=new Set()},
    // ── log + stats ──
    log:()=>setLog(['⛧ Starting fresh...']),
    fullRunLogRef:()=>{fullRunLogRef.current=['⛧ Starting fresh...']},
    stats:()=>setStats({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0,overkillDmg:0,bestMultiplier:1.0}),
    extraEmberNextFight:()=>setExtraEmberNextFight(0),
  }),[])

  // ── RESET_EXEMPT ───────────────────────────────────────────────────────
  // Declared state/refs that are deliberately reset at NO boundary, with the
  // reason. The dev invariant below treats anything listed here as covered.
  const RESET_EXEMPT=useMemo(()=>({
    // player settings / persisted profile — surviving a run is the point
    handSort:'user setting (vst_handsort)',speedMode:'user setting (vst_speed)',
    musicVol:'user setting',sfxVol:'user setting',shakeEnabled:'user setting',
    selectedDeck:'run configuration, chosen on the booster screen',
    activeStakeId:'run configuration, chosen on the menu',
    streakWins:'lifetime profile',streakLosses:'lifetime profile',
    totalRunsPlayed:'lifetime profile',personalBest:'lifetime profile',
    lifetimeScore:'lifetime profile',dailyStreak:'lifetime profile',
    lastPlayedDate:'lifetime profile',
    // shell / navigation chrome — not run state
    screenFade:'render transition',showDebugHud:'dev HUD toggle',
    bootScreen:'once per page load',coldOpenPhase:'once per page load',
    menuView:'menu navigation',unlockTab:'menu navigation',unlockPage:'menu navigation',
    unlockHover:'menu hover',showPauseOptions:'modal',showCollection:'modal',
    showTrophies:'modal',showStats:'modal',showCombatLog:'modal',
    footerCollapsed:'UI preference',hovered:'pointer hover',
    polaroidNotif:'self-dismissing toast',
    circlePreview:'dead state — setCirclePreview is never called anywhere',
    // self-expiring visual effects (own timers)
    floats:'self-expiring',vfxParticles:'self-expiring',shakeOffset:'self-expiring',
    // render-time mirrors: reassigned on EVERY render, so a reset is a no-op
    handRef:'render mirror of hand',deckRef:'render mirror of deck',
    discRef:'render mirror of discardPile',enemyHpRef:'effect mirror of enemyHp',
    canStrikeRef:'render mirror',canDiscardRef:'render mirror',
    selectedRef:'render mirror',stageDiveUsedRef:'render mirror',
    gameStateRef:'render mirror',modalOpenRef:'render mirror',
    prevGameStateRef:'render mirror',prevStashRef:'render mirror',
    prevEmbersRef:'render mirror',prevMultRef:'render mirror',
    handleStrikeRef:'render mirror',handleDiscardRef:'render mirror',
    handleUndoRef:'render mirror',playSfxRef:'render mirror',
    handleStrikeBodyRef:'render mirror',triggerVictoryRef:'render mirror',
    luciferPhase2Ref:'render mirror',
    // monotonic id/key counters — resetting would collide React keys
    pidRef:'monotonic key counter',fid:'monotonic key counter',
    prid:'monotonic key counter',breakdownSeqRef:'monotonic key counter',
    // owned by beginFightToken() (called at every fight/run boundary)
    fightTokenRef:'beginFightToken()',strikeTimersRef:'beginFightToken()',
    strikeInFlightRef:'beginFightToken()',
    // DOM / audio handles
    bossRef:'DOM handle',stageRefs:'DOM handles',audioRef:'audio elements',
    currentTrackRef:'audio playback state',shakeTimerRef:'timer handle',
    spaceHeldRef:'live keyboard state',
  }),[])

  // ── DEV INVARIANT: every declaration must be registered ────────────────
  // The reason CLAUDE.md rule 5 kept rotting is that nothing ever checked it.
  // This reads App's OWN source (unminified in dev only), extracts every
  // useState/useRef name declared inside it, and warns about any that is in
  // none of the four maps above. Adding a `useState` without deciding its
  // boundary is now a console warning on the very next dev load instead of a
  // silent cross-run leak discovered three overnight datasets later.
  useEffect(()=>{
    if(!import.meta.env.DEV)return
    try{
      const src=App.toString()
      const names=new Set()
      let m
      const reState=/const\s*\[\s*(\w+)\s*,\s*\w+\s*\]\s*=\s*useState\s*\(/g
      while((m=reState.exec(src))!==null)names.add(m[1])
      const reRef=/(?:const\s+|,\s*)(\w+)\s*=\s*useRef\s*\(/g
      while((m=reRef.exec(src))!==null)names.add(m[1])
      // If the source came back minified/native, the extraction is meaningless.
      if(names.size<50)return
      const covered=new Set([].concat(
        Object.keys(PER_STRIKE_RESETS),Object.keys(PER_FIGHT_RESETS),
        Object.keys(PER_RUN_RESETS),Object.keys(RESET_EXEMPT)))
      const orphans=[...names].filter(n=>!covered.has(n))
      const stale=[...covered].filter(n=>!names.has(n))
      if(orphans.length)console.warn('[RESET-REGISTRY] '+orphans.length+' App state/ref declaration(s) are not registered in PER_STRIKE_RESETS / PER_FIGHT_RESETS / PER_RUN_RESETS / RESET_EXEMPT. Pick one (CLAUDE.md rule 5):',orphans)
      if(stale.length)console.warn('[RESET-REGISTRY] registered but no longer declared in App — delete these entries:',stale)
      if(!orphans.length&&!stale.length)console.log('[RESET-REGISTRY] OK — '+names.size+' declarations, all registered.')
    }catch{/* source introspection unavailable — invariant is dev-only, fail open */}
  },[PER_STRIKE_RESETS,PER_FIGHT_RESETS,PER_RUN_RESETS,RESET_EXEMPT])

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
    beginFightToken() // fight boundary — invalidate any in-flight strike timers
    const tutEnemy=TUTORIAL_ENEMIES[fightNum-1]
    const _tutCorr=fightNum>=2?10:0 // Fight 2+ starts with some corruption
    // Set tutorial members
    const members=TUTORIAL_MEMBERS.map(id=>ALL_MUSICIANS.find(m=>m.id===id))
    const initStage=[null,...members.map(m=>({...m,maxHp:m.hp,uid:uid()})),...Array(3).fill(null)]
    // ── SHARED PER-FIGHT RESET (Aug 4 2026, phase 4) ──────────────────────
    // This block used to be a hand-rolled subset missing ~55 of the normal
    // between-fight resets — stageDiveUsed stayed used from fight 1 (dead card
    // in fights 2 and 3), milestonesFiredRef meant HALFWAY/ALMOST/DESTROY HIM
    // only ever flashed in fight 1, discardsThisFightRef compounded across all
    // three fights (while discardsThisStrikeRef WAS reset — the tell), and the
    // pedal/anchor/survivor/free-card state never reset at all. It also reset
    // five things handleReset didn't (isWiggling, damageFlash, cardAbsorb,
    // discardsThisStrikeRef, phaseBanner) — all folded into the registry.
    resetPerFightState({corruption:_tutCorr,handTarget:HAND_SIZE,stage:initStage,strikes:4,discards:4})
    setEnemy(tutEnemy)
    setEnemyHp(tutEnemy.maxHp)
    setScaledMaxHp(tutEnemy.maxHp)
    setFightIndex(fightNum-1)
    setTutorialFight(fightNum)
    setTutorialTipIdx(0)
    setShowTutorialMsg(null)
    setStage(initStage)
    // Set tutorial hand
    const handIds=TUTORIAL_HANDS[fightNum]
    const tutHand=handIds.map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return{...c,uid:uid()}})
    setHand(tutHand)
    // Fill deck with basic cards for draws
    const deckCards=['battlecry','amp','moshpit','groupie','distortion','newstrings','heavyriff','encore','roadie','tappedout'].map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return{...c,uid:uid()}})
    setDeck(deckCards)
    setDiscardPile([])
    setEmbers(5)
    setMaxEmbers(5)
    setCorruption(_tutCorr)
    setGameState('playing')
    setStash(20) // enough to buy stuff if shop appears
    setChosenPacts([])
    fullRunLogRef.current=['⛧ Tutorial Fight '+fightNum+' begins.']
  },[resetPerFightState])

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
    const _deckDef=STARTER_DECKS.find(d=>d.id===selectedDeck)||{}
    // ── DECK IDENTITY: per-member HP modifiers ──
    const _hpMod=_deckDef.memberHpMod||0       // Survivor: +2 maxHp per member
    const _hpPct=_deckDef.memberHpPct||1       // Shredder: 0.85 (band at 85% HP)
    const initStage=[null,...musicians.map(m=>{
      const _adjMaxHp=Math.max(1,Math.round((m.hp+_hpMod)*_hpPct))
      return{...m,hp:_adjMaxHp,maxHp:_adjMaxHp}
    }),...Array(4).fill(null)].slice(0,maxStage)
    setStage(initStage)
    // ── DECK IDENTITY: free starter artifact (Engineer) ──
    if(_deckDef.freeArtifact){
      // `ARTIFACTS` never existed — the real Tier-1 pool is STARTER_ARTIFACTS
      // (imported from src/data/relics.js). Latent ReferenceError until a
      // STARTER_DECKS entry set freeArtifact. Fixed Aug 4 2026.
      const _t1Pool=STARTER_ARTIFACTS.filter(a=>a.cost<=8)
      if(_t1Pool.length>0){
        const _gift=_t1Pool[Math.floor(Math.random()*_t1Pool.length)]
        setActiveArtifacts(p=>[...p,_gift])
        setTimeout(()=>addLog('🔧 Engineer\'s gift: starting artifact '+_gift.name),300)
      }
    }
    const d=buildDeck(runSeed,selectedDeck)
    // STREAK BONUSES
    const _streakW=parseInt(localStorage.getItem('vst_streak_wins')||'0')
    if(_streakW>=2){setMaxEmbers(p=>Math.min(MAX_EMBERS_CAP,p+1));setEmbers(p=>p+1);addLog('🔥 Streak bonus: +1 starting Ember!')}
    if(_streakW>=3){addLog('🔥 Streak bonus: Your next recruit has a Foil upgrade!')}
    // ── DECK IDENTITY: hand size + starting embers ──
    const _deckHandSize=_deckDef.handSize||HAND_SIZE
    const _hs=_deckHandSize+(chosenPacts.includes('speed_demon')?1:0)
    if(_deckDef.startEmbers!=null){
      setMaxEmbers(_deckDef.startEmbers)   // Shredder: 6, Ritualist: 4
      setEmbers(_deckDef.startEmbers)
    }
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
    // ── DECK IDENTITY: Ritualist starts at 25% corruption ──
    if(_deckDef.startCorruption!=null&&_deckDef.startCorruption>0){
      setCorruption(_deckDef.startCorruption)
      setTimeout(()=>addLog('💀 '+_deckDef.name+': starting at '+_deckDef.startCorruption+'% corruption'),200)
    }
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
    // SHREDDER ember discount removed in commit 4c — keyword now grants per-chain ATK
    // bonus via getEffectiveAtk, not a resource discount.
    const sfxMap={RIFF:'riff_play',CORRUPT:'corrupt_play',UTILITY:'utility_play',EMBER:'ember_play'};playSfx(sfxMap[card.type]||'card_play')
    const synesthesiaDiscount=(fightTripBuff==='SYNESTHESIA')?1:0
    const darkBargainDiscount=(chosenPacts.includes('dark_bargain')&&card.type==='CORRUPT'&&card.embers>=1)?1:0
    const ampFbDiscount=(ampFeedbackDiscount>0&&card.type==='RIFF')?1:0
    // ── NEW PEDAL DISCOUNTS ──
    // Reverb Tank: first card each strike costs 1 less ember
    const reverbTankDiscount=(activePassives.some(p=>p.id==='reverbtank')&&(cardsPlayedRef.current||[]).length===0)?1:0
    // Fuzz Box: all RIFF cards cost 1 less
    const fuzzBoxDiscount=(activePassives.some(p=>p.id==='fuzzbox')&&card.type==='RIFF')?1:0
    // Phaser: all CORRUPT cards cost 1 less
    const phaserDiscount=(activePassives.some(p=>p.id==='phaserpedal')&&card.type==='CORRUPT')?1:0
    // GHOST WEED trip (v0.7.2): all CORRUPT cards cost 0 this fight
    const ghostWeedFree=(fightTripBuff==='GHOST WEED'&&card.type==='CORRUPT')?card.embers:0
    // Wah Pedal: first CORRUPT card each fight is FREE (use ref to track)
    const wahFreeFirst=(activePassives.some(p=>p.id==='wahpedal')&&card.type==='CORRUPT'&&!wahPedalUsedRef.current)?card.embers:0
    // Cable Tester: duplicate cards cost 1 less
    const cableTesterDiscount=(activePassives.some(p=>p.id==='cabletester')&&hand.filter(c=>c.id===card.id).length>=2)?1:0
    // The Conduit (mythic): all cards cost half (rounded down)
    const conduitDiscount=activePassives.some(p=>p.id==='theconduit')?Math.floor(card.embers/2):0
    const effectiveEmbers=(nextCardFreeRef.current&&card.id!=='doubledown')||allCardsFreeRef.current||(freeCardsLeftRef.current>0&&card.id!=='doubledown')?0:Math.max(0,card.embers-foilDiscount-synesthesiaDiscount-darkBargainDiscount-ampFbDiscount-reverbTankDiscount-fuzzBoxDiscount-phaserDiscount-ghostWeedFree-wahFreeFirst-cableTesterDiscount-conduitDiscount)
  if(effectiveEmbers>0&&embers<effectiveEmbers){addLog('⚠ Need '+effectiveEmbers+' Embers, have '+embers+'.');return false}
  if(nextCardFreeRef.current&&card.id!=='doubledown'){setNextCardFree(false)}
  // ── BLOTTER REVELATION counter consumption ──
  // Only consume a "free card" charge if we're actually using it (i.e., the card had cost > 0
  // and another zero-cost mechanic isn't already covering it). nextCardFree consumed first.
  else if(freeCardsLeftRef.current>0&&card.id!=='doubledown'&&!allCardsFreeRef.current&&card.embers>0){
    freeCardsLeftRef.current=Math.max(0,freeCardsLeftRef.current-1)
    setFreeCardsLeft(p=>Math.max(0,p-1))
  }
    if(card.id==='stagedive'&&stageDiveUsed){addLog('⚠ Stage Dive once per round only.');return false}
    const m=stage[slotIdx]
    let ns=[...stage],spent=effectiveEmbers,msg=''
    // Aug 1 2026: snapshot pre-card ATK so temp buffs can be un-applied. See the
    // normalisation right before setStage(ns) below.
    const _preCardAtk=stage.map(m=>m?m.atk:null)

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
    else if(card.id==='roadie'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{stoneShield:2,hp:(m.keyword==='FALLEN'||m.cursed)?m.hp:Math.min(m.maxHp,m.hp+2),buffCount:(m.buffCount||0)+1});msg='🛡 '+m.name+' shielded for 2 Strikes and healed 2 HP!'}
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
      ns=ns.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'&&!m.cursed?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m)
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
      ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:(m.keyword==='FALLEN'||m.cursed)?m.hp:Math.min(m.maxHp,m.hp+4),atk:m.hp<m.maxHp&&m.keyword!=='FALLEN'?m.atk+1:m.atk,tempBuff:m.hp<m.maxHp&&m.keyword!=='FALLEN'?true:m.tempBuff,_origAtk:m.hp<m.maxHp&&!m._origAtk&&m.keyword!=='FALLEN'?m.atk:m._origAtk}):m)
      msg='🔊 Sound Check! All +4 HP'+(injuredCount>0?' + '+injuredCount+' injured member(s) +1 ATK!':'!');stage.filter(x=>x&&!x.tooStoned).forEach(x=>addBuff(x.uid,'+HP','#33dd33'))
      addFloat('+4 HP',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44')
    }
    else if(card.id==='whispercard'){
      // Targeted card — dropping it on an EMPTY stage slot used to throw
      // (`m.atk` on null). Reject the play cleanly, matching cardEngine.js
      // IMPL.whispercard which returns false on a null target.
      if(!m){addLog('⚠ Dark Whisper needs a band member.');return false}
      ns=ns.map((mm,mi)=>mi===slotIdx&&mm?Object.assign({},mm,{atk:mm.atk+2,permAtkBonus:(mm.permAtkBonus||0)+2,buffCount:(mm.buffCount||0)+1}):mm);msg='\u{1F300} Dark Whisper! +2 ATK permanently.'
    }
    else if(card.id==='hungercard'){ns=ns.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+1,tempAtkBonus:(m.tempAtkBonus||0)+1,buffCount:(m.buffCount||0)+1}):m);drawUpTo(hand.filter(c=>c.uid!==card.uid),deckRef.current,[...discRef.current,card],2);msg='\u{1F525} Hungering Flame! All +1 ATK, drew 2 cards.'}
    else if(card.id==='madnesscard'){const maxHp=scaledMaxHp||(enemy?enemy.maxHp:100);const dmg=Math.floor(maxHp*0.15);const bc2=getCenter(bossRef);const newHp=Math.max(0,enemyHp-dmg);setEnemyHp(newHp);if(newHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);addFloat(dmg,bc2.x,bc2.y-60,'#cc1144',dmg>=20);playHit();updStat('totalDamage',dmg);msg='\u{1F480} Madness Unleashed! '+dmg+' damage (15% of max HP)!'}
    else if(card.id==='dark_whisper'){
      const nc=Math.min(100,corruption+5);setCorruption(nc);updStat('maxCorruption',nc,true)
      ns=ns.map((m,mi)=>mi===slotIdx&&m?Object.assign({},m,{atk:m.atk+2,tempAtkBonus:(m.tempAtkBonus||0)+2,buffCount:(m.buffCount||0)+1}):m)
      msg='👁 Dark Whisper! +2 ATK. Corruption +5% → '+nc+'%'
    }
    else if(card.id==='blood_price'){
      ns=ns.map((m,mi)=>mi===slotIdx&&m?Object.assign({},m,{atk:m.atk+4,permAtkBonus:(m.permAtkBonus||0)+4,hp:Math.max(1,m.hp-3),buffCount:(m.buffCount||0)+1}):m)
      msg='🩸 Blood Price! +4 ATK permanently. -3 HP.'
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
        ns[slotIdx]=Object.assign({},cfTarget,{hp:(cfTarget.keyword==='FALLEN'||cfTarget.cursed)?cfTarget.hp:cfTarget.maxHp})
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
      if(!lastRiffPlayedRef.current){addLog('📼 No riff recorded yet.');return false}
      spent=0
      // Inline replay — directly apply the last riff effect without recursive applyCard
      const lr=lastRiffPlayedRef.current
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
      } else if(lr.id==='heavyriff'&&lrTarget&&!lrTarget.tooStoned&&!lrTarget._hrUsed){
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+3,buffCount:(lrTarget.buffCount||0)+1,_hrUsed:true})
      } else if(lr.id==='moshpit'){
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+1,buffCount:(s.buffCount||0)+1}):s)
      } else if(lr.id==='shredsolo'&&lrTarget&&!lrTarget.tooStoned){
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+4,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='sonicboom'){
        const sbD=ns.filter(s=>s&&!s.tooStoned).reduce((s,m)=>s+m.atk,0)
        const sbHp=Math.max(0,enemyHp-sbD);setEnemyHp(sbHp);updStat('totalDamage',sbD)
        addFloat(sbD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#ff6600',true);playHit()
        if(sbHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='stagedive'){
        const sdD=12;const sdHp=Math.max(0,enemyHp-sdD);setEnemyHp(sdHp);updStat('totalDamage',sdD)
        addFloat(sdD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#9933cc',true);playHit()
        if(sdHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='possessedperf'&&lrTarget&&!lrTarget.tooStoned){
        const ppB=Math.floor(corruption/20);ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+ppB,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='doomchord'){
        ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+2,buffCount:(s.buffCount||0)+1}):s)
      } else if(lr.id==='skullsplitter'){
        const skD=15;const skHp=Math.max(0,enemyHp-skD);setEnemyHp(skHp);updStat('totalDamage',skD)
        addFloat(skD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#cc2222',true);playHit()
        if(skHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='tremolopick'&&lrTarget&&!lrTarget.tooStoned){
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+2,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='feedbackscream'){
        const fsD=Math.floor(corruption/5)+3;const fsHp=Math.max(0,enemyHp-fsD);setEnemyHp(fsHp);updStat('totalDamage',fsD)
        addFloat(fsD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#aa1111',true);playHit()
        if(fsHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='bloodharmony'){
        const dupes=hand.filter((c,i)=>hand.findIndex(h=>h.id===c.id)!==i).length
        if(lrTarget&&!lrTarget.tooStoned)ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+dupes+1,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='necroticamp'){
        const naD=8;const naHp=Math.max(0,enemyHp-naD);setEnemyHp(naHp);updStat('totalDamage',naD)
        setCorruption(p=>Math.min(100,p+5))
        addFloat(naD,getCenter(bossRef).x,getCenter(bossRef).y-60,'#44aa44',true);playHit()
        if(naHp<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
      } else if(lr.id==='herbmoney'){
        setStash(p=>Math.min(420,p+5));addLog('🌿 Herb Money replay! +5 Stash')
      } else if(lr.id==='overdriveped'&&lrTarget&&!lrTarget.tooStoned){
        ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+3,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='riffthief'){
        if(lrTarget&&!lrTarget.tooStoned)ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+2,buffCount:(lrTarget.buffCount||0)+1})
      } else if(lr.id==='devilsdice'){
        const roll=Math.floor(Math.random()*6)+1
        if(roll>=5){ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+5,buffCount:(s.buffCount||0)+1}):s);addLog('🎲 Replay roll: '+roll+'! +5 ATK all!')}
        else if(roll>=3){ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+3,buffCount:(s.buffCount||0)+1}):s);addLog('🎲 Replay roll: '+roll+'. +3 ATK all.')}
        else{addLog('🎲 Replay roll: '+roll+'. Nothing.')}
      } else {
        // Fallback for any unhandled riff — generic +2 ATK to target
        if(lrTarget&&!lrTarget.tooStoned)ns[slotIdx]=Object.assign({},lrTarget,{atk:lrTarget.atk+2,buffCount:(lrTarget.buffCount||0)+1})
        addLog('📼 Demo Tape replays '+lr.name+' (generic)')
      }
      msg='📼 Demo Tape! Replays: '+lr.name
      addFloat('📼 '+lr.name,getCenter(bossRef).x,getCenter(bossRef).y-100,'#e8a820',true)
    }
    else if(card.id==='burnset'){
      // Handled entirely in handleDropOnStage to avoid double state updates
      // applyCard returns false here so handleDropOnStage runs the burnset logic directly
      return false
    }
    else if(card.id==='overdrive'){const req=card.corrReq||60;if(corruption>=(card.upgraded?50:req)){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true,_origAtk:s._origAtk||s.atk}):s});msg='💥 OVERDRIVE! All ATK doubled!';addFloat('OVERDRIVE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)}else{const showReq=card.upgraded?50:req;addLog('⚠ Need ≥'+showReq+'% Corruption (you have '+Math.floor(corruption)+'%)');addFloat('💥 Need '+showReq+'% Corruption',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true);return false}}
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
      ns=ns.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'&&!m.cursed?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+healAmt)}):m)
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
      const req=card.corrReq||40
      if(corruption<req){addLog('🌑 Need ≥'+req+'% Corruption for Dark Tuning! (you have '+Math.floor(corruption)+'%)');addFloat('🌑 Need '+req+'% Corruption',getCenter(bossRef).x,getCenter(bossRef).y-80,'#cc44ff',true);return false}
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
      // BALANCE (Jul 31 2026, JV): once per member per fight — self-compounding
      // +half-current-ATK stacking was the one-carry snowball that trivialized C3+.
      if(m._hrUsed){addLog('⚠ '+m.name+' already rode the Heavy Riff this fight!');return false}
      const bonus=Math.min(20,Math.ceil((m.atk+(m.permAtkBonus||0))/2))+(card.upgraded?2:0)
      ns[slotIdx]=Object.assign({},m,{atk:m.atk+bonus,permAtkBonus:(m.permAtkBonus||0)+bonus,buffCount:(m.buffCount||0)+1,_hrUsed:true})
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
        setEnemyHp(function(prev){return Math.min(scaledMaxHp||enemy.maxHp,prev+15)})
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
      // RULE 1 fix (was setHand inside setDeck).
      const _d=[...deckRef.current];const _drawn=_d.length>0?[_d.pop()]:[]
      setDeck(_d);setTimeout(()=>setHand(h=>[...h,..._drawn]),0)
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
      setStrikeMult(p=>Math.min(10000,Math.round(p*1.5*100)/100));strikeMultRef.current=Math.min(10000,Math.round(strikeMultRef.current*1.5*100)/100)
      msg='🔊 Overdrive Pedal! Strike multiplier ×1.5!'
    }
    else if(card.id==='devilsdice'){
      const roll=Math.floor(Math.random()*6)+1
      if(roll<=2){msg='🎲 Devil\'s Dice: rolled '+roll+'. Nothing happens!'}
      else if(roll<=4){ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+3,tempBuff:true}):s);msg='🎲 Devil\'s Dice: rolled '+roll+'! ALL +3 ATK!'}
      else{ns=ns.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+5,tempBuff:true}):s);const _dd=[...deckRef.current];const _ddr=_dd.splice(Math.max(0,_dd.length-2));setDeck(_dd);setTimeout(()=>setHand(h=>[...h,..._ddr]),0);msg='🎲 Devil\'s Dice: rolled '+roll+'! ALL +5 ATK + draw 2! JACKPOT!'}
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
      addFloat('+3 ATK permanently',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#44aa44',false)
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
      // 3B: +6 ATK this strike (fixed the never-expire bug: tempBuff now carries _origAtk),
      // and the `cursed` flag is now actually read by every heal site this fight.
      if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+6,tempBuff:true,_origAtk:m._origAtk!==undefined?m._origAtk:m.atk,buffCount:(m.buffCount||0)+1,cursed:true})
      msg='🪡 Cursed Strings! '+m.name+" +6 ATK — but can't be healed this fight!"
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
      if(corruption>=80){setStrikeMult(p=>Math.min(10000,Math.round(p*3*100)/100));strikeMultRef.current=Math.min(10000,Math.round(strikeMultRef.current*3*100)/100);msg='🌑 DARK CRESCENDO! TRIPLE STRIKE MULTIPLIER! ('+corruption+'% corruption)'}
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
      setStrikeMult(p=>Math.min(10000,Math.round(p*2.5*100)/100));strikeMultRef.current=Math.min(10000,Math.round(strikeMultRef.current*2.5*100)/100);setCorruption(p=>Math.min(100,p+25))
      msg='🕳 VOID PACT! STRIKE MULTIPLIER ×2.5! +25% CORRUPTION!';addFloat('×2.5 MULT!',getCenter(bossRef).x,getCenter(bossRef).y-120,'#8800ff',true)
    }
    else if(card.id==='russianroulette'){
      if(!m)return false;const roll=Math.floor(Math.random()*6)+1
      if(roll===1){ns[slotIdx]=Object.assign({},m,{tooStoned:true,hp:0});msg='🔫 Russian Roulette: '+m.name+' rolled 1... TOO STONED! 💨'}
      else if(roll<=5){ns[slotIdx]=Object.assign({},m,{atk:m.atk+4,tempBuff:true});msg='🔫 Russian Roulette: '+m.name+' rolled '+roll+'! +4 ATK!'}
      else{ns[slotIdx]=Object.assign({},m,{atk:m.atk+8,tempBuff:true,stoneShield:2});msg='🔫 Russian Roulette: '+m.name+' rolled 6! +8 ATK + Shield! 🛡️'}
    }
    else if(card.id==='gearcheck'){
      // RULE 1 fix: never setHand inside a setDeck updater. Compute off the ref,
      // set deck directly, defer the hand append past handleDropOnStage's plain setHand(remaining).
      const _d=[...deckRef.current];const _drawn=_d.splice(Math.max(0,_d.length-2))
      setDeck(_d);setTimeout(()=>setHand(h=>[...h,..._drawn]),0)
      msg='🔧 Gear Check! Drew 2 cards.'
    }
    else if(card.id==='setlistrewrite'){
      // 1B Scry: peek top 3 (next to draw), discard the costliest, keep the rest on top.
      // Option A: FREE but once per Strike (mirrors Stage Dive) — kills the free-spam.
      if(setlistRewriteUsed){addLog('📝 Setlist Rewrite — once per Strike.');return false}
      const _d=[...deckRef.current];const _top=_d.splice(Math.max(0,_d.length-3))
      if(_top.length>0){
        let _wi=0;for(let i=1;i<_top.length;i++){if((_top[i].embers||0)>(_top[_wi].embers||0))_wi=i}
        const _tossed=_top.splice(_wi,1)[0]
        _d.push(..._top);setDeck(_d);setDiscardPile(p=>[...p,_tossed])
        setSetlistRewriteUsed(true)
        msg='📝 Setlist Rewrite! Tossed '+_tossed.name+', kept '+_top.length+' on top.'
      }else{msg='📝 Setlist Rewrite! Deck is empty.'}
    }
    else if(card.id==='backstagepass'){
      nextCardFreeRef.current=true;setNextCardFree(true)
      // RULE 1 fix (was setHand inside setDeck).
      const _d=[...deckRef.current];const _drawn=_d.length>0?[_d.pop()]:[]
      setDeck(_d);setTimeout(()=>setHand(h=>[...h,..._drawn]),0)
      msg='🎫 Backstage Pass! Next card is FREE! Draw 1!'
    }
    else if(card.id==='venueswap'){
      // ── Aug 4 2026 PARITY FIX (measured by e2e/test-card-parity.cjs) ──────
      // Was: setHand(h=>{setDiscardPile(dp=>[...dp,...h]);return[]}) followed by a
      // setHand() buried inside a setDeck updater (CRITICAL RULE 1). Two real bugs:
      //   1. the hand dumped into the discard INCLUDED this card, and
      //      handleDropOnStage pushes the played card to the discard again once
      //      applyCard returns — so Venue Swap DUPLICATED ITSELF into the deck on
      //      every play. Measured live: 18 cards in (6 hand + 12 deck), 19 out
      //      (6 hand + 6 deck + 7 discard, with two Venue Swaps in the discard).
      //   2. it drew with a raw d.slice(-6), so a deck holding fewer than 6 cards
      //      drew short and silently skipped the discard reshuffle.
      // drawUpTo off the REFS (RULE 4) fixes both. `card` is deliberately NOT in the
      // discard arg here: this handler does not return early, so the caller still
      // adds it (that is RULE 6's "must be included" — once, not twice).
      const _hw=hand.filter(c=>c.uid!==card.uid)
      const _res=drawUpTo([],deckRef.current,[...discRef.current,..._hw],6)
      setDeck(_res.d);setDiscardPile(_res.disc)
      // handleDropOnStage calls setHand(remaining) with a PLAIN VALUE immediately
      // after applyCard returns, which REPLACES any hand update queued here. Land
      // the fresh hand after it, the same way the Copier signature does (~6845).
      setTimeout(()=>setHand(_res.h),0)
      msg='🏟️ Venue Swap! Hand shuffled away — drew 6 fresh cards!'
    }
    else if(card.id==='doublebooking'){
      setStrikesLeft(p=>p+1);setFightMaxStrikes(p=>p+1)
      msg='📅 DOUBLE BOOKING! +1 extra Strike this fight! 🔥'
    }
    else if(card.id==='bootlegcopy'){
      // ── Aug 4 2026 PARITY FIX (measured by e2e/test-card-parity.cjs) ──────
      // Was: setHand(h=>{...return[...h,copy]}). handleDropOnStage queues
      // setHand(remaining) with a PLAIN VALUE immediately after applyCard returns,
      // which REPLACES this updater — the copy never reached the hand and the card
      // was a 1-ember no-op. Measured live: hand 6 -> 5, no copy anywhere.
      // Land the copy after the caller's setHand, like the Copier signature (~6845).
      const _src=hand.length>1?hand.filter(c=>c.id!=='bootlegcopy')[0]:null
      if(_src){const _copy=Object.assign({},_src,{uid:uid()});setTimeout(()=>setHand(h=>[...h,_copy]),0)}
      msg=_src?'📀 Bootleg Copy! Copied best card in hand!':'📀 Bootleg Copy! Nothing to copy.'
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

    // ── TEMP-BUFF EXPIRY NORMALISATION (Aug 1 2026) ────────────────────
    // handleStrikeBody expires a "this Strike" buff only when BOTH tempBuff and
    // _origAtk are set. 32 card sites set tempBuff:true but only 24 captured
    // _origAtk — so 8+ cards (Doom Chord, Devil's Dice, Blood Harmony, Cursed
    // Strings, Dial to Eleven, Possession Riff, Sonic Boom's adjacency...) granted
    // buffs that NEVER expired and compounded for the entire run. That silently
    // made the live game far stronger than any sim number, in the opposite
    // direction from the sim's perm-ATK double-dip. Capture the restore value
    // here, once, for every site — no call-site archaeology required.
    ns=ns.map((m,i)=>(m&&m.tempBuff&&m._origAtk===undefined&&_preCardAtk[i]!==null&&_preCardAtk[i]!==m.atk)
      ?Object.assign({},m,{_origAtk:_preCardAtk[i]}):m)
    setStage(ns)
    if(spent>0){setEmbers(function(p){return p-spent});embersSpentThisFightRef.current+=spent}
    if(msg)addLog(msg)
    updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
    if(card.type==='RIFF'&&ampFbDiscount>0)setAmpFeedbackDiscount(0)
    if(card.type==='RIFF'){setLastRiffPlayed(card);lastRiffPlayedRef.current=card}
    // ── WAH PEDAL: mark first CORRUPT as used (free shot consumed) ──
    if(card.type==='CORRUPT'&&!wahPedalUsedRef.current&&activePassives.some(p=>p.id==='wahpedal')){
      wahPedalUsedRef.current=true
    }
    // ── BLACK SUN trip (v0.7.2): every CORRUPT card supercharges the strike multiplier by +50% ──
    if(card.type==='CORRUPT'&&fightTripBuff==='BLACK SUN'){
      setStrikeMult(p=>Math.min(10000,Math.round(p*1.5*100)/100))
      strikeMultRef.current=Math.min(10000,Math.round(strikeMultRef.current*1.5*100)/100)
      const _bc=getCenter(bossRef)
      addFloat('BLACK SUN ×1.5',_bc.x,_bc.y-100,'#aa00ff',true)
    }
    // ── RIFF CHAIN COMBO DETECTION ──
    cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
    // ── ECHOPLEX 69% / LOOPER REPLAY QUEUEING ──
    // Echoplex: 69% chance any card retriggers at end of strike (with _echo: flag).
    // Looper: first card each strike retriggers at end (deterministic).
    // Skip queueing if this play IS already a replay (prevents infinite loops).
    if(!card._isReplay){
      const _hasEcho=activePassives.some(p=>p.id==='echoplex')
      const _hasLooper=activePassives.some(p=>p.id==='looperpedal')
      const _hasSabbath=activePassives.some(p=>p.id==='witchssabbath')  // mythic: 3 replays of first card
      const _isFirstCardThisStrike=cardsPlayedRef.current.length===1
      // Echoplex roll (independent of Looper/Sabbath — can stack)
      if(_hasEcho&&Math.random()<0.69){
        queuedReplaysRef.current.push({cardId:card.id,slotIdx,kind:'echoplex'})
      }
      // First-card replay: Sabbath supersedes Looper (don't stack the two).
      // Sabbath = first card replays 3 times total → push 2 sabbath entries.
      // Looper = first card replays once → push 1 looper entry.
      if(_isFirstCardThisStrike){
        if(_hasSabbath){
          queuedReplaysRef.current.push({cardId:card.id,slotIdx,kind:'sabbath'})
          queuedReplaysRef.current.push({cardId:card.id,slotIdx,kind:'sabbath'})
        } else if(_hasLooper){
          queuedReplaysRef.current.push({cardId:card.id,slotIdx,kind:'looper'})
        }
      }
    }
    const played=cardsPlayedRef.current
    for(const chain of RIFF_CHAINS){
      if(played.includes(chain.cards[0])&&played.includes(chain.cards[1])&&!combosFiredRef.current.includes(chain.id)){
        if(!combosDiscoveredThisRun.includes(chain.id)){
          setCombosDiscoveredThisRun(p=>[...p,chain.id])
          // Track lifetime discoveries
          const disc=JSON.parse(localStorage.getItem('vst_combos_discovered')||'[]')
          if(!disc.includes(chain.id)){disc.push(chain.id);localStorage.setItem('vst_combos_discovered',JSON.stringify(disc))}
        }
        setChainCallout(chain.name);setTimeout(()=>setChainCallout(null),1200)
          setComboFlash({name:chain.name,color:chain.color,emoji:chain.emoji,mult:Math.round(strikeMultRef.current*1.78*100)/100,card1:ALL_CARDS.find(c=>c.id===chain.cards[0])?.name||chain.cards[0],card2:ALL_CARDS.find(c=>c.id===chain.cards[1])?.name||chain.cards[1]})
        playSfx('chain_combo');triggerShake(18,600);setChainFlashActive(true);setTimeout(()=>setChainFlashActive(false),600);
        // Octave Pedal: first chain each fight has its mult applied twice (×1.78 → ×3.17)
        const _octaveActive=activePassives.some(p=>p.id==='octavepedal')&&!octavePedalFiredRef.current
        const _chainMult=_octaveActive?(1.78*1.78):1.78
        if(_octaveActive){octavePedalFiredRef.current=true;addLog('🎼 Octave Pedal! First chain DOUBLED → ×'+_chainMult.toFixed(2))}
        setStrikeMult(p=>Math.min(10000,Math.round((p*_chainMult)*100)/100));showFirstTimeTip('chain','Riff Chains fire when you play BOTH cards of a pair in the same Strike. Check Rules for all 16 chains!',addLog);addLog('⛧ RIFF CHAIN: '+chain.emoji+' '+chain.name+'! ('+ALL_CARDS.find(c=>c.id===chain.cards[0])?.name+' + '+ALL_CARDS.find(c=>c.id===chain.cards[1])?.name+') ×'+_chainMult.toFixed(2)+' MULTIPLIER!')
        combosFiredRef.current.push(chain.id)
        // Mythic unlock tracking: Tablet of Az'Tothoth requires all 16 chains in one run
        chainsFiredThisRunRef.current.add(chain.id)
        if(chainsFiredThisRunRef.current.size>=16){fireMythicUnlock('tabletOfAzothoth')}
        // Tablet of Az'Tothoth (mythic): first chain each fight upgrades a random card permanently
        if(activePassives.some(p=>p.id==='tabletofazothoth')&&!tabletFiredRef.current){
          tabletFiredRef.current=true
          // Find an upgradeable card from current deck/hand/discard that isn't already upgraded
          const allDeckCards=[...deckRef.current,...hand,...discRef.current]
          const upgradeable=allDeckCards.filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i).filter(c=>!c.consumable&&CARD_UPGRADES[c.id]&&!upgradedCards.includes(c.id))
          if(upgradeable.length>0){
            const target=upgradeable[Math.floor(Math.random()*upgradeable.length)]
            setUpgradedCards(p=>[...p,target.id])
            addLog('📜 Tablet of Az\'Tothoth! '+target.name+' permanently upgraded!')
            addFloat('⛧ '+target.name+' UPGRADED!',getCenter(bossRef).x,getCenter(bossRef).y-160,'#bb44ff',true)
          }
        }
        // ── SHREDDER SIGNATURE: queue chain for echo on next strike ──
        if((STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).signature==='riff_chain_echo'){
          shredderEchoesPendingRef.current++
          addLog('⚡ Shredder Echo queued — '+chain.name+' fires again next strike at 50%')
        }
          // #7: Track lifetime chain discovery
          const _allDisc=JSON.parse(localStorage.getItem('vst_chains_discovered')||'[]')
          if(!_allDisc.includes(chain.id)){_allDisc.push(chain.id);localStorage.setItem('vst_chains_discovered',JSON.stringify(_allDisc))
            addFloat('⛧ NEW CHAIN DISCOVERED!',getCenter(bossRef).x,getCenter(bossRef).y-200,'#ffdd00',true)}
        addFloat('⛧ '+chain.name+' ⛧',getCenter(bossRef).x,getCenter(bossRef).y-140,chain.color,true)
        // ── CHAIN INSTANT DAMAGE REMOVED (v0.7.7, May 4 2026) ──
        // Pre-Balatro engine, completing a chain dealt instant damage = total
        // stage ATK on top of setting the strike multiplier. With the new
        // Balatro-style multiplicative engine (April 2026), the ×1.78 multiplier
        // IS the payoff — instant damage was double-dipping AND undocumented
        // (chain log only mentions the multiplier). JV reported this as
        // "playing Distortion damaged the boss right away" — Distortion +
        // Feedback Loop = Soul Harvest, which silently dealt total-band-ATK
        // damage on the second card. Removing keeps the chain log honest:
        // chains contribute through the multiplier at strike time, not before.
        setTimeout(()=>setComboFlash(null),3000)
        // Aug 4 2026 (phase 3): this used to `break` after the first match. A card that
        // completed TWO chains at once awarded only one ×1.78 — the second was deferred
        // to the next card play, or lost outright if that was the strike's last card.
        // combosFiredRef guards against re-firing the same chain, so continuing the scan
        // is safe; octavePedalFiredRef is set inside the body so the doubler still only
        // applies to the first chain of the fight.
      }
    }
    // cardHeal enemy passive.
    // Aug 1 2026 CRITICAL: these clamped to enemy.maxHp — the UNSCALED data value —
    // while live HP is maxHp x deckScale x heat x encore. Every clamp therefore
    // SLAMMED the boss down to its base HP the first time it "healed":
    //   Glutton 2,030 -> 1,097 (-933) · Feaster 3,325 -> 1,797 (-1,528)
    //   Devourer 11,918 -> 6,442 (-5,476, i.e. 46% of the fight deleted by one card)
    // Circle 3 was not a real fight. Now clamps to scaledMaxHp (the live value).
    if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+2))
    else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+3))
    else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+15))
    else if(enemy.passiveId==='cardHeal3b')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+8))
    else if(enemy.passiveId==='cardHeal8')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+25))
    return true
  },[embers,stage,corruption,stageDiveUsed,setlistRewriteUsed,deck,discardPile,hand,bossRef,stageRefs,selected,fightTripBuff,enemy,enemyHp,maxEmbers,activePassives,activeArtifacts,chosenPacts,fightIndex,collectedLoot])

  const handleDropOnStage=useCallback((slotIdx,uidOverride)=>{
    // QUICK-PLAY FIX (Jul 31 2026): quick-play called this synchronously after
    // setDragCardUid — the state read below was one render STALE, so the first
    // quick-play no-opped and later ones played the PREVIOUSLY selected card
    // (wrong card, wrong ember charge). Quick-play now passes the uid directly.
    const _playUid=uidOverride||dragCardUid
    if(!_playUid||animPhase!=='idle')return
    setQuickPlayCardUid(null)
    const card=hand.find(c=>c.uid===_playUid)
    if(!card)return
    // ── UNDO SNAPSHOT — save state before card play ──
    setUndoSnapshot({hand:[...hand],deck:[...deckRef.current],disc:[...discRef.current],stage:stage.map(m=>m?Object.assign({},m):null),embers,corruption,strikeMult:strikeMultRef.current,selected:[...selected],nextCardFree:nextCardFreeRef.current})

    // ── ENGINEER SIGNATURE: COPIER — 25% chance to add a copy of UTILITY card to hand ──
    // Fires BEFORE downstream branching so it works regardless of which sub-handler runs.
    // The copy is added to hand asynchronously (setTimeout 50ms) to avoid mutating hand
    // mid-play and confusing the discard flow. The copy's uid is fresh.
    // _copied flag prevents copies from re-copying (no infinite chain).
    if(card.type==='UTILITY'&&!card._copied&&(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).signature==='copier'){
      if(Math.random()<0.25){
        const _copy=Object.assign({},card,{uid:uid(),_copied:true})
        setTimeout(()=>{
          setHand(h=>[...h,_copy])
          addLog('🔧 Copier! '+card.name+' duplicated into your hand.')
          addFloat('🔧 COPY!',window.innerWidth/2,window.innerHeight*0.45,'#44aaff',true)
        },50)
      }
    }

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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      // cardHeal enemy passive
      if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+2))
      else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+3))
      else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+15))
    else if(enemy.passiveId==='cardHeal3b')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+8))
    else if(enemy.passiveId==='cardHeal8')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+25))
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
      updStat('cardsPlayed',1);addMasteryPlays(card.id,1)
    // #4: MASTERY MILESTONE POPS
    const _mp=getMasteryPlays(card.id);const _milestones=[10,25,50,100,250,500]
    if(_milestones.includes(_mp)){addFloat('⭐ MASTERY '+_mp+'!',960,400,'#ffd700',true);addLog('⭐ '+card.name+' reached '+_mp+' plays! Mastery up!')};setStrikeMult(p=>Math.min(10000,Math.round((p*1.08)*100)/100))
    // #3: ASCENDING PITCH on each card played
    try{const _ctx=new(window.AudioContext||window.webkitAudioContext)();const _o=_ctx.createOscillator();const _g=_ctx.createGain();_o.type='sine';const _cp=(cardsPlayedRef.current||[]).length;_o.frequency.value=300+_cp*120;_g.gain.value=Math.min(0.12,sfxVol*0.3);_o.connect(_g);_g.connect(_ctx.destination);_o.start();_o.stop(_ctx.currentTime+0.06)}catch(e){}
      cardsPlayedRef.current=[...cardsPlayedRef.current,card.id]
      if(enemy.passiveId==='cardHeal')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+2))
      else if(enemy.passiveId==='cardHeal3')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+3))
      else if(enemy.passiveId==='cardHeal4')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+4))
    else if(enemy.passiveId==='cardHeal6')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+6))
    else if(enemy.passiveId==='cardHeal5')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+15))
    else if(enemy.passiveId==='cardHeal3b')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+8))
    else if(enemy.passiveId==='cardHeal8')setEnemyHp(p=>p<=0?p:Math.min(scaledMaxHp||enemy.maxHp,p+25))
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
      const curHand=[...hand]
      // Jul 31: filter by _playUid — filtering by stale dragCardUid removed NOTHING on
      // quick-play, so the played card stayed in hand while a copy hit the discard
      // (card duplication + fake always-refill + infinite replays of the same card).
      const remaining=curHand.filter(c=>c.uid!==_playUid)
      // ── RESONANCE COIL (a9) STALE-LOGIC REMOVED (v0.7.9, May 4 2026) ──
      // Was: if you have a9 and a duplicate of the played card in hand, both
      // discard for +2 embers. JV reported as "played 1 card, both got played."
      // Real bug: the artifact's actual effect (line 1123) is "×1.15 strike
      // multiplier for each duplicate card in hand when you Strike", wired as
      // multTrigger:'perDupe' in the cascade engine (line 8476). The on-play
      // discard was leftover from an earlier design. Worse, eating the
      // duplicate on play meant the perDupe multiplier had nothing to count.
      // Fix: removed the on-play branch entirely. Card flows through the
      // normal "to discard" path. perDupe still fires at strike time.
      setHand(remaining)
      if(card.consumable){
        addLog('⛧ '+card.name+' shatters and vanishes from your deck!')
        addFloat('CONSUMED!',getCenter(bossRef).x,getCenter(bossRef).y-110,'#ff4400',true)
      } else {
        setDiscardPile(p=>[...p,card])
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
    // ── DISCARD TRACKING for Spit Cup / Ouroboros Pin / Bit Crusher pedal ──
    discardsThisFightRef.current+=toDisc.length
    discardsThisStrikeRef.current+=toDisc.length
    // Bit Crusher pedal: each discard = +5% corruption
    if(activePassives.some(p=>p.id==='bitcrusher')){
      const corrGain=toDisc.length*5
      setCorruption(p=>Math.min(100,p+corrGain))
      addFloat('+'+corrGain+'% corr',window.innerWidth/2,window.innerHeight*0.4,'#aa44cc')
    }
    // Tuner Pedal: discard draws 1 immediately (already covered by drawUpTo replacing)
    addLog('🗑 '+toDisc.length+' discarded & replaced.')
  },[selected,discardsLeft,animPhase,hand,deck,discardPile,drawUpTo,activePassives])

  // ── UNDO LAST CARD PLAY — one-step restore ──
  const handleUndo=useCallback(()=>{
    if(!undoSnapshot||animPhase!=='idle')return
    setHand(undoSnapshot.hand);setDeck(undoSnapshot.deck);setDiscardPile(undoSnapshot.disc)
    setStage(undoSnapshot.stage);setEmbers(undoSnapshot.embers);setCorruption(undoSnapshot.corruption)
    setStrikeMult(undoSnapshot.strikeMult);strikeMultRef.current=undoSnapshot.strikeMult
    setSelected(undoSnapshot.selected)
    if(undoSnapshot.nextCardFree){setNextCardFree(true);nextCardFreeRef.current=true}
    setUndoSnapshot(null)
    playSfx('discard');addLog('↩ Undo — last card play reversed.')
  },[undoSnapshot,animPhase])

  const victoryFiredRef=useRef(false)
  const triggerVictoryRef=useRef(null)
  // ── LUCIFER PHASE 2 ENTRY (Aug 1 2026, extracted) ─────────────────────
  // Single implementation of the phase 1 → 2 handoff. Called from
  // handleStrikeBody AND from triggerVictory's phase-1 intercept, so every kill
  // path (strike damage, direct-damage cards, DOT, hellquake, safety net) opens
  // phase 2 instead of ending the run.
  const luciferPhase2Ref=useRef(null)
  const enterLuciferPhase2=useCallback(()=>{
    // Phase 2 is a fresh fight in every way that matters (new HP pool, revived band,
    // reset strikes). Bump the fight token so phase 1's in-flight strike timers can't
    // slam the freshly-spawned phase 2 boss back down to 0.
    if(luciferPhaseRef.current===2)return // already transitioned — never run twice
    beginFightToken()
    setLuciferPhase(2);luciferPhaseRef.current=2
    const _lh2=parseInt(localStorage.getItem('vst_heat')||'1')
    const _lucP2Hp=Math.ceil(333333*(1+Math.max(0,_lh2-1)*0.15)*(encoreMode?2.0:1.0))
    setEnemyHp(_lucP2Hp);enemyHpRef.current=_lucP2Hp;setScaledMaxHp(_lucP2Hp)
    setBossRageAtk(0);bossRageAtkRef.current=0
    strikeInFlightRef.current=0
    setStage(p=>p.map(m=>m?Object.assign({},m,{hp:m.maxHp,tooStoned:false,stoneShield:false,tempBuff:false,encoreReady:false,ampedThisStrike:false,cursed:false}):null))
    setEmbers(maxEmbers)
    const _lucDeckStrMod=(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).maxStrikesMod||0
    setStrikesLeft(activeStake.maxStrikes+_lucDeckStrMod)
    setFightMaxStrikes(activeStake.maxStrikes+_lucDeckStrMod)
    setDiscardsLeft(MAX_DISCARDS)
    setFightMaxDiscards(MAX_DISCARDS)
    setTripUsedThisFight(false)
    setFightTripBuff(null)
    setActiveTripEffect(null)
    setLuciferCinematic({text:'THE ICE SHATTERS',hp:333333,phase:2})
    setTimeout(()=>setLuciferCinematic(null),4000)
    addLog('⛧ THE ICE SHATTERS ⛧')
    addLog('😈 Phase 2: Satan, Lord of the Flies — 333,333 HP')
    addLog('⛧ Band revived! Full HP, Embers, Strikes, Discards reset!')
    setAnimPhase('idle')
  },[encoreMode,maxEmbers,selectedDeck,activeStake,addLog])
  luciferPhase2Ref.current=enterLuciferPhase2

  const triggerVictory=useCallback(function(){
    if(victoryFiredRef.current)return // prevent double-fire
    // Aug 1 2026 forensic log: a bot run got full victory with Lucifer at 178k HP.
    // Every caller is supposed to have verified the kill; this logs who called and
    // with what state so a bad caller can't hide. Cheap, stays in prod builds.
    try{console.log('[VICTORY]','fi='+fightIndex,'hp='+enemyHp,'liveHp='+enemyHpRef.current,'phase='+luciferPhase,'stack:',new Error().stack.split('\n').slice(2,6).join(' <- '))}catch(e){}
    // ── LUCIFER PHASE-1 INTERCEPT (Aug 1 2026) ────────────────────────────
    // Killing phase 1 must open phase 2, never end the run. handleStrikeBody had
    // its own transition, but ~15 OTHER kill paths call triggerVictory directly
    // (Sound Wall, Feedback Loop, Crowd Surf, Stage Dive, Sonic Boom, Skull
    // Splitter, Feedback Scream, Necrotic Amp, Going Broke, Blood Ritual, Venom
    // DOT, Black Candle, Madness, and 3 Hellquake outcomes) plus the delayed
    // safety net — all of which skipped straight to THE DEVIL IS DEAD, ending the
    // game at the halfway point. Guarding at this single choke point covers every
    // caller present and future. Bot repro: "[VICTORY] fi=26 hp=0 phase=1".
    if(enemy&&(enemy.passiveId==='luciferBoss'||enemy.id==='lucifer')&&luciferPhase===1){
      try{console.log('[VICTORY-INTERCEPT] phase 1 down → opening phase 2 instead of ending the run')}catch(e){}
      if(luciferPhase2Ref.current)luciferPhase2Ref.current()
      return // victoryFiredRef intentionally NOT set — phase 2 still has to be won
    }
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
    // FRENZIED boss-kill +1 ATK perm stack removed in commit 4b — keyword now
    // grants +N ATK per RIFF played per strike via getEffectiveAtk (see helper).
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
  const stashEarnedBase=baseMin+Math.floor(Math.random()*baseRange)+strikesLeft+perfectBonus
  // ── HANGOVER STASH HAIRCUT (v0.7.1) ─────────────────────────────
  // 100% peak corruption shaves 15% of stash payout. "Blew the gig money on
  // drugs." Calibrated via 1000-game sim — heavier haircut (×0.5 at 100%,
  // ×0.75 at 90%) silently nuked Lucifer attempts; ×0.85 at 100% only is
  // the sweet spot that taxes recklessness without compounding into
  // run-ending stash starvation.
  const _peakC=peakCorruptionRef.current
  const _hairMult=_peakC>=100?0.85:1.0
  const stashEarned=Math.floor(stashEarnedBase*_hairMult)
  const _hairLost=stashEarnedBase-stashEarned
    setStash(function(p){return Math.min(MAX_STASH,p+stashEarned)})
    if(_hairLost>0){
      addLog('🥴 Hangover ate '+_hairLost+'🌿 of your gig money. (Peaked at '+_peakC+'% corruption.)')
    }
    // ── HANGOVER COMMIT ───────────────────────────────────────────
    // Boss kills clear the hangover entirely — fresh start next circle.
    // Non-boss victories carry the peak forward as `hangover` for next fight + shop.
    if(isBossKill){
      setHangover(0)
      if(_peakC>=50)addLog('💤 Boss down. The band sleeps it off — hangover cleared.')
    } else {
      setHangover(_peakC)
      if(_peakC>=50)addLog('🥴 Hangover '+_peakC+'%: shops pricier + max HP debuff next fight.')
    }
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
    if(fightIndex===26){tryAchieve('beat_lucifer');beatStake(activeStake.id,selectedDeck);tryAchieve('beat_'+selectedDeck)
      // Sigil of Set unlock: solo run (only 1 unique member used the whole run)
      if(soloMembersUsedRef.current.size<=1){fireMythicUnlock('sigilOfSet')}
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
        setTimeout(()=>{clearSave();setGameState('end')},5500) // bumped from 3000 — cinematic needs time to land
      }
      else if(fightIndex>=26){
      playVictory();setDeathCause('victory')
      setStreakWins(p=>{const nw=p+1;localStorage.setItem('vst_streak_wins',nw);return nw});setStreakLosses(0);recordLegacyRun(stage,stats,true,Math.floor(fightIndex/3)+1)
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
        setRecruitBought(false) // v0.7.3: parent-level lock — reset on shop rotate
        // Aug 4 2026: rerollCost used to escalate PERMANENTLY across the whole
        // run — it was reset only in handleReset and in the Shift+S debug shop,
        // whose presence proves a per-visit reset was intended. Pack purchases
        // and the pawn sales cap reset here too, for the same reason.
        setRerollCost(2)
        setBoughtPackIds([])
        setPawnSalesLeft(2)
        setShroomsInStock(Math.random()<0.50)
        setAcidInStock(Math.random()<0.50)
        // DMT (v0.7.2): boss-shop only. Always in stock at those shops to ensure
        // discovery — players will encounter it for the first time on a boss kill.
        setDMTInStock((fightIndex+1)%3===0)
        setShopSoldIds([]) // clear sold state when shop rotates
        // Rotate circle artifact + passive at each new circle (every 3rd fight)
        const isCircleBoss=(fightIndex+1)%3===0
        if(isCircleBoss){
          // v0.7.4: Pass active-owned IDs as exclude — prevents the rerolled
          // artifact/pedal from matching one you already own (which would cause
          // the tile to render as sold via activeArtifacts.some(...) check).
          {const _ex=[...activeArtifacts.map(a=>a.id),...relicsSeenRef.current]
          const _next=rollShopArtifact(_ex);relicsSeenRef.current.add(_next.id)
          setCircleArtifact(_next)}
          setCirclePassive(rollShopPedal(activePassives.map(p=>p.id)))
          // Dive Bar Sign — "refunds its cost when you reach Circle IV".
          // Aug 4 2026: pays back what was ACTUALLY charged (paidCost), not the
          // base sticker. It used to pay `cost` flat, so during a hangover you
          // paid 15 and got 9 back — and with Merchants Eye the refund exceeded
          // the purchase. Falls back to `cost` for pack-granted copies that
          // never went through a priced purchase.
          if(fightIndex===8){const _db=activeArtifacts.find(a=>a.refundAtC4)
            if(_db){const _dbRefund=(_db.paidCost!=null?_db.paidCost:(_db.cost||9))
              setActiveArtifacts(p=>p.filter(a=>!a.refundAtC4));setStash(p=>Math.min(MAX_STASH,p+_dbRefund));addLog('🍻 '+_db.name+' — the residency ends. '+_dbRefund+' stash refunded.')}}
          setCircleCartBought(false)
          setCirCleCpasBought(false)
        }
        // ── HANGOVER HP DEBUFF — restore on every fight victory ──
        // Restores any maxHp lost from the per-member debuff. Runs BEFORE the
        // heal so heal can fill the now-restored maxHp. Next fight's start
        // re-applies a fresh debuff based on the newly-committed `hangover`.
        // Boss kills also separately reset hangover state to 0 (see commit logic above).
        setStage(prev=>prev.map(m=>{
          if(!m||!m.hangoverHpDebuff)return m
          return Object.assign({},m,{maxHp:m.maxHp+m.hangoverHpDebuff,hangoverHpDebuff:0})
        }))
        // Post-fight heal (disabled on higher stakes)
        if(activeStake.healAfterFight){setStage(prev=>prev.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'&&!m.cursed?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m))}
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
            const startHp=getScaledMaxHp(enemy)
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
              // Aug 4 2026 (phase 3): combosFiredRef was emptied by the strike body ~2.8s
              // before this runs, so this reported 0 chains on every fight of every run.
              // Fall back to the pre-reset snapshot the strike body already takes.
              riffChains:((combosFiredRef.current||[]).length)||((lastStrikeCombosRef.current||[]).length),
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
    // ── VICTORY AUTO-TRIGGER ──
    // Wait for the multiplier cascade to fully play out before transitioning.
    // The killing strike applies HP immediately (line 8585) so enemyHp hits 0
    // BEFORE the cascade animation gets a chance to slam. If we trigger victory
    // 300ms later (the old behavior), the screen transitions mid-cascade and
    // the player sees the multiplier text get cut short, with the next fight's
    // numbers counting down on top. JV: "the attacks should finish completely
    // before moving to the shop."
    //
    // Fix: while dmgBreakdown is non-null the cascade is still rendering; bail
    // and let the effect re-run when DamageBreakdown's onDone clears it. Then
    // wait an additional 600ms beat after the cascade clears so the slam's
    // final number gets to resonate before the screen changes.
    if(enemyHp<=0&&gameState==='playing'&&!victoryFiredRef.current&&enemy&&enemy.maxHp>0){
      if(dmgBreakdown)return // cascade still running — wait for it to clear
      // ── Aug 4 2026 (phase 3) STRIKE-PIPELINE HOLD ────────────────────────
      // Per-member impact damage can take the boss to 0 several seconds BEFORE the
      // cascade block runs, and at that moment dmgBreakdown is still null — so this
      // net used to win the fight out from under the strike. On Lucifer that was
      // catastrophic: net -> phase-1 intercept -> enterLuciferPhase2() spawns 333,333,
      // then the cascade's _applyHpDrop slammed the fresh phase 2 back to 0 and the
      // next line (reading a stale luciferPhase===1) entered phase 2 a SECOND time —
      // double cinematic, double resets, double band revive. In normal fights the same
      // ordering meant the killing blow never showed its damage breakdown.
      // The cascade block owns the kill; it releases this hold when it resolves.
      setTimeout(()=>{
        if(strikeInFlightRef.current>0){
          // NOT a stale timer — this is the normal, expected handoff: the strike
          // pipeline is mid-cascade and will own the kill itself, so the safety
          // net stands down. Logged at debug level under its own tag so that a
          // REAL cross-fight leak ([STALE-TIMER-BLOCKED]) stays visible instead
          // of being buried under ~5 of these per fight.
          try{console.debug('[VICTORY-DEFERRED] cascade owns the kill')}catch(e){}
          return
        }
        // ── PHANTOM VICTORY FIX (Aug 1 2026) ──────────────────────────────
        // This timer used to call triggerVictory unconditionally. Any flow that
        // takes HP to 0 and then REFILLS it within the 600ms window won the game
        // for free: Lucifer's phase 1→2 transition (0 → 333,333) and the Welcome
        // to Hell handoff both do exactly that. Bot ledger caught it twice in one
        // run — "THE DEVIL IS DEAD" with Lucifer sitting at 76,093 HP, and the
        // Executive falling at 85,298/89,700. Re-read HP at FIRE time (ref, not
        // the stale closure value) and abort if the boss got back up.
        if(enemyHpRef.current>0){
          try{console.log('[VICTORY-ABORT] safety net cancelled — boss back to '+enemyHpRef.current+' HP (phase transition)')}catch(e){}
          return
        }
        if(triggerVictoryRef.current)triggerVictoryRef.current()
      },600)
    }
  },[enemyHp,gameState,dmgBreakdown])


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

  // ── MULTIPLIER MILESTONES ──
  useEffect(()=>{
    if(gameState!=='playing')return
    const ms=multMilestonesRef.current
    if(strikeMult>=16&&!ms[16]){ms[16]=true;addFloat('⛧ ×16 MULTIPLIER! ⛧',960,250,'#ff00ff',true);addLog('⛧ ×16 MULTIPLIER UNLOCKED! TRANSCENDENT!')}
    else if(strikeMult>=8&&!ms[8]){ms[8]=true;addFloat('🔥 ×8 MULTIPLIER!',960,250,'#ff4400',true);addLog('🔥 ×8 MULTIPLIER UNLOCKED! INSANE!')}
    else if(strikeMult>=4&&!ms[4]){ms[4]=true;addFloat('⚡ ×4 MULTIPLIER!',960,250,'#ffaa00',true);addLog('⚡ ×4 MULTIPLIER UNLOCKED!')}
    else if(strikeMult>=2&&!ms[2]){ms[2]=true;addFloat('💥 ×2 MULTIPLIER!',960,250,'#ff8800',true);addLog('💥 ×2 MULTIPLIER UNLOCKED!')}
  },[strikeMult,gameState])
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

  // ── CORRUPTION POWER NOTIFICATION — first time hitting 40% ──
  const corrPowerShownRef=useRef(false)
  useEffect(()=>{
    if(gameState==='playing'&&corruption>=40&&!corrPowerShownRef.current){
      corrPowerShownRef.current=true
      addFloat('💀 CORRUPTION = POWER!',960,300,'#cc44ff',true)
      addLog('💀 Corruption reached 40%! Your strikes now deal ×1.15 bonus damage. Higher corruption = bigger multiplier!')
    }
  },[corruption,gameState])

  // ── CORRUPTION THRESHOLD FLASH NOTIFICATIONS ──
  useEffect(()=>{
    if(gameState!=='playing')return
    // Threshold flash banners — BUZZED at 50%, WASTED at 100%. Positive framing
    // (these are the band's *high*, the cost comes tomorrow via Hangover).
    // The actual costs (shop tax, HP debuff, stash haircut) live in the
    // Hangover system — these flashes are the IN-FIGHT signal that the
    // multiplier ramp is unlocked.
    const thresholds=[
      {at:50,name:'🍺 BUZZED',desc:'CORRUPT cards hit harder. Tomorrow you pay.',color:'#dd5566'},
      {at:100,name:'🤘 WASTED',desc:'Maximum power. Tomorrow REALLY hurts.',color:'#ff2244'},
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

  // ── CORRUPTION 100% POSSESSION — REMOVED in v0.7.1 (replaced by Hangover system) ──

  // ── HOLD SPACEBAR — fast-forward while held during combat ──────
  const spaceHeldRef=useRef(false)
  useEffect(()=>{
    const down=e=>{if(e.code==='Space'&&gameStateRef.current==='playing'&&!spaceHeldRef.current&&!(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))){e.preventDefault();spaceHeldRef.current=true;setSpeedMode(true)}}
    const up=e=>{if(e.code==='Space'&&spaceHeldRef.current){spaceHeldRef.current=false;setSpeedMode(localStorage.getItem('vst_speed')==='fast')}}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}
  },[])

  // ── FIGHT 1 CORRUPTION SAFETY NET + FIRST-TIME TUTORIAL POPUP ─────
  // Per JV's design vision: r1 is training wheels. The corruption->stoned
  // spiral was killing weak teams before they reached shop 1. This clamps
  // corruption to 50% during fight 1 ONLY (fightIndex===0, not in tutorial,
  // not Welcome to Hell encore). Fight 2+ has full corruption mechanics.
  // Also fires the corruption first-tip popup on first 50% encounter EVER
  // (any fight) so players understand what corruption does.
  useEffect(()=>{
    if(corruption>=50&&!hasSeenTip('corruption')&&gameState==='playing'){
      setFirstTip({id:'corruption',text:FIRST_TIPS.corruption})
      markTipSeen('corruption')
    }
    if(corruption>50&&fightIndex===0&&tutorialFight===0&&welcomeToHell!=='fighting'&&gameState==='playing'){
      setCorruption(50)
      addLog('🛡 Training wheels: corruption capped at 50% in fight 1.')
    }
  },[corruption,fightIndex,tutorialFight,welcomeToHell,gameState])

  // ── AUTO-SAVE v4.1 (Jul 30 2026) — EFFECT-BASED, replaces the stale-closure
  // setTimeout save at fight start. That save captured the PREVIOUS fight's ending
  // state (sl:0 zombie fights, un-healed stage, pre-redeal hand, stale fightIndex).
  // An effect keyed on fightIndex runs post-commit and reads FRESH state.
  useEffect(()=>{
    if(gameState!=='playing'||tutorialFight>0)return
    const t=setTimeout(()=>{try{saveGame({
      v:1,gs:'playing',fi:fightIndex,seed:runSeed,deck:selectedDeck,relicsSeen:[...relicsSeenRef.current],
      stage:stage.map(m=>m?{id:m.id,name:m.name,hp:m.hp,maxHp:m.maxHp,atk:m.atk,role:m.role,keyword:m.keyword,tooStoned:m.tooStoned,uid:m.uid,foil:m.foil,mythic:m.mythic,demonic:m.demonic,permAtkBonus:m.permAtkBonus||0,encoreReady:m.encoreReady,stoneShield:m.stoneShield,isMentor:m.isMentor,mentorMult:m.mentorMult,mentorLinkedToUid:m.mentorLinkedToUid,mentorAlive:m.mentorAlive,buffCount:m.buffCount||0,_hrUsed:m._hrUsed||false}:null),
      dk:deck.map(c=>c.id),hand:hand.map(c=>c.id),disc:discardPile.map(c=>c.id),
      em:embers,mx:maxEmbers,st:stash,co:corruption,
      sl:Math.max(1,strikesLeft),ms:fightMaxStrikes,dl:discardsLeft, // resume restarts the fight — never store overtime/zombie strike counts
      pa:chosenPacts,art:activeArtifacts.map(a=>a.id),pas:activePassives.map(p=>p.id),
      loot:collectedLoot,upg:upgradedCards,stats:stats,
      shrooms:heldShrooms,acid:heldAcid,dmt:heldDMT,
      // Aug 4 2026 phase 4 — both of these were MISSING from the snapshot:
      //   dbl: handleContinueSave never set dblRoll, so on a fresh page load it
      //        stayed null and the strike body's `if(dblRoll<=2)` coerced null to
      //        0 → true → dblMult 1.0 STANDARD for the whole resumed fight,
      //        silently disabling DOUBLE TIME until the next fight re-rolled.
      //   hang: hangover drives the per-member max-HP debuff AND the shop hunger
      //        tax; both evaporated on resume.
      dbl:dblRoll,hang:hangover
    })}catch(e){}},150)
    return ()=>clearTimeout(t)
  },[fightIndex,gameState])

  // ── PEAK CORRUPTION TRACKER — the engine that drives Hangover ─────
  // Updates every time corruption rises. On fight victory, this peak gets
  // committed to the `hangover` state which then taxes the next shop +
  // debuffs the next fight. Resets at fight start (line ~8835) and run
  // restart (line ~9385). Ref instead of state so we don't re-render
  // on every tick — only the commit matters.
  useEffect(()=>{
    if(gameState==='playing'&&corruption>peakCorruptionRef.current){
      peakCorruptionRef.current=corruption
    }
  },[corruption,gameState])

  // ── DEV SHORTCUTS (Shift+S/C/W/D/H/~) ────────────────────────────
  // Aug 1 2026 CRITICAL: these were LIVE for every player — Shift+W fired the
  // full victory cinematic + credits with ZERO HP check (one keystroke beats the
  // game), Shift+S opened a free shop with 69 stash. Now gated behind
  // localStorage vst_debug=1 (rig/test sessions set it; players never see them).
  useEffect(function(){
    function onKey(e){
      if(e.shiftKey&&localStorage.getItem('vst_debug')!=='1'&&['S','C','c','W','w','D','d','H','h','K','k','`','~'].includes(e.key))return
      if(e.shiftKey&&e.key==='S'){
        setShopCards(genShopCards(1))
        setBoosterPacks(genBoosterPacks(1))
        setRecruitPack(genRecruitPack(fightIndex))
        setRecruitBought(false) // v0.7.3: parent-level lock — reset on debug shop entry
        setRerollCost(2)
        setBoughtPackIds([])
        setPawnSalesLeft(2)
        setStash(69)
        setShroomsInStock(Math.random()<0.50)
        setAcidInStock(Math.random()<0.50)
        setDMTInStock(true) // debug shortcut: always stock DMT for testing
        setGameState('shop')
      }
      if(e.shiftKey&&(e.key==='C'||e.key==='c')){
        setGameState('campfire')
      }
      if(e.shiftKey&&(e.key==='W'||e.key==='w')){
        console.log('[DEBUG-WIN] Shift+W pressed — debug victory cinematic fired (vst_debug=1)')
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
        setDeathCause('stoned');setLastKillingBlow('All band members went Too Stoned')
        setStats({fightsSurvived:6,strikesThrown:24,totalDamage:420,highestStrike:69,tooStonedCount:2,maxCorruption:66,stashEarned:42,cardsPlayed:99})
        clearSave();setGameState('end')
      }
      if(e.shiftKey&&(e.key==='H'||e.key==='h')){setCreditsRoll(true)}
      // Shift+K (rig only, vst_debug=1): burn 97% of boss's CURRENT HP through the
      // normal damage path. Exists to test Lucifer phase transitions + victory flow
      // live without 300 manual strikes. Uses the same guarded setter as cards.
      if(e.shiftKey&&(e.key==='K'||e.key==='k')){
        console.log('[DEBUG-DMG] Shift+K: boss HP -97%')
        setEnemyHp(p=>{const nh=Math.max(1,Math.floor(p*0.03));return nh})
      }
      // Shift+` (tilde) = toggle debug HUD overlay (state inspection)
      if(e.shiftKey&&(e.key==='`'||e.key==='~')){setShowDebugHud(p=>!p)}
      // Ctrl+Z = Undo last card play
      if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();handleUndoRef.current&&handleUndoRef.current();return}
      if(e.key==='Escape'){setShowPauseOptions(p=>!p)}

      // ── PLAYER KEYBOARD SHORTCUTS — only during combat, no modifiers, not while typing
      if(gameStateRef.current!=='playing')return
      // ...and never through an open modal (setlist / slot swap / deck / discard / pause)
      if(modalOpenRef.current)return
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

  // ── TRIP REGISTRY (v0.7.2) ───────────────────────────────────────
  // Each entry is a self-contained effect definition. Adding a new trip
  // = add an entry here. The `apply` callback runs at activation time;
  // `buffName` (if set) is what `fightTripBuff` becomes for combat reads
  // (e.g., `fightTripBuff==='ASTRAL PROJECTION'` checks elsewhere).
  // Effects with `instant:true` fire once at activation, no fight-long buff.
  // Pool sizes: 8 shrooms + 8 acid. Bad-trip rate softened from 5% → 3%.
  // Bunk (paper acid / fake shrooms) removed entirely — players never feel
  // robbed of a drug-purchase. Activation is now allowed mid-fight (no
  // strikesLeft===maxStrikes gate) so trips can be clutch panic buttons.
  const TRIP_EFFECTS={
    shrooms:{
      good:[
        {name:'EGO DEATH',desc:'All members +2 ATK this fight!',color:'#ffdd44',buffName:'EGO DEATH',
          apply:()=>{setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+2}):m));addLog('🍄 EGO DEATH! All members +2 ATK!')}},
        {name:'TIME DILATION',desc:'+1 bonus Strike this fight!',color:'#ff8800',buffName:'TIME DILATION',
          apply:()=>{setStrikesLeft(p=>p+1);setFightMaxStrikes(p=>p+1);addLog('🍄 TIME DILATION! +1 Strike this fight!')}},
        {name:'SYNESTHESIA',desc:'All cards cost 1 less ember this fight!',color:'#cc44ff',buffName:'SYNESTHESIA',
          apply:()=>{addLog('🍄 SYNESTHESIA! All cards cost 1 less ember!')}},
        {name:'COSMIC UNITY',desc:'All healed to full HP + Stonewall!',color:'#44ddaa',buffName:'COSMIC UNITY',
          apply:()=>{setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:m.cursed?m.hp:m.maxHp,stoneShield:2}):m));addLog('🍄 COSMIC UNITY! Full HP + Stonewall for all!')}},
        // ── New v0.7.2 effects ──
        {name:'BLOTTER REVELATION',desc:'Next 3 cards play FREE.',color:'#ffaa44',buffName:'BLOTTER REVELATION',instant:true,
          apply:()=>{setFreeCardsLeft(3);freeCardsLeftRef.current=3;addLog('🍄 BLOTTER REVELATION! The setlist reveals itself — next 3 cards play FREE.')}},
        {name:'PSILOCYBIN PORTAL',desc:'Draw 5 cards immediately.',color:'#cc66ff',buffName:'PSILOCYBIN PORTAL',instant:true,
          apply:()=>{
            // Top up hand by 5 (drawUpTo caps internally at 10). Result shape: {h, d, disc}.
            // Using handRef for race-safety in case the player taps the button mid-card-play.
            const _curHand=handRef.current||[]
            const target=_curHand.length+5
            const result=drawUpTo(_curHand,deckRef.current,discRef.current,target)
            if(result){
              setHand(result.h);handRef.current=result.h
              setDeck(result.d);deckRef.current=result.d
              setDiscardPile(result.disc);discRef.current=result.disc
              const drawn=(result.h?result.h.length:_curHand.length)-_curHand.length
              addLog('🍄 PSILOCYBIN PORTAL! The mycelium speaks — drew '+drawn+' card'+(drawn===1?'':'s')+'.')
            }
          }},
        {name:'DOOM CRYSTAL',desc:'Highest-ATK member: ATK doubled this fight!',color:'#ff4422',buffName:'DOOM CRYSTAL',
          apply:()=>{
            setStage(prev=>{
              const alive=prev.filter(m=>m&&!m.tooStoned)
              if(alive.length===0)return prev
              const top=alive.reduce((a,b)=>a.atk>b.atk?a:b)
              return prev.map(m=>m&&m.uid===top.uid?Object.assign({},m,{atk:m.atk*2,tempAtkBonus:(m.tempAtkBonus||0)+top.atk}):m)
            })
            addLog('🍄 DOOM CRYSTAL! One vision. One blade. Highest ATK doubled.')
          }},
        {name:'GHOST WEED',desc:'All CORRUPT cards cost 0 this fight.',color:'#88ddaa',buffName:'GHOST WEED',
          apply:()=>{addLog('🍄 GHOST WEED! Smoke from the void — CORRUPT cards are free.')}},
      ],
      // Bad trip is rare (3%). Softened from -2 ATK to -1 ATK + log-only — should sting, not ruin.
      bad:{name:'BAD TRIP',desc:'Paranoia! All members -1 ATK this fight.',color:'#cc2222',buffName:'BAD TRIP',
        apply:()=>{setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:Math.max(1,m.atk-1)}):m));addLog('🍄 BAD TRIP. Paranoia — all members -1 ATK.')}}
    },
    acid:{
      good:[
        {name:'FRACTAL VISION',desc:'All damage DOUBLED this fight!',color:'#ff44ff',buffName:'FRACTAL VISION',
          apply:()=>{addLog('🧪 FRACTAL VISION! Every card effect fires twice!')}},
        {name:'DIMENSIONAL RIFT',desc:'Boss takes DOUBLE damage this fight!',color:'#ff3300',buffName:'DIMENSIONAL RIFT',
          apply:()=>{addLog('🧪 DIMENSIONAL RIFT! Boss takes double damage!')}},
        {name:'EGO DISSOLUTION',desc:'Corruption → 69%. All members +3 ATK permanently!',color:'#aa44ff',buffName:'EGO DISSOLUTION',
          apply:()=>{
            setCorruption(69)
            setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3,permAtkBonus:(m.permAtkBonus||0)+3}):m))
            addLog('🧪 EGO DISSOLUTION! Corruption → 69%. All +3 ATK forever.')
          }},
        {name:'ASTRAL PROJECTION',desc:'All immune to boss damage this fight!',color:'#44ddff',buffName:'ASTRAL PROJECTION',
          apply:()=>{addLog('🧪 ASTRAL PROJECTION! Band is untouchable!')}},
        // ── New v0.7.2 effects ──
        {name:'DMT BREAKTHROUGH',desc:'Skip boss\'s next 2 attacks.',color:'#ffffff',buffName:'DMT BREAKTHROUGH',
          apply:()=>{setBossSkipStrikes(2);bossSkipStrikesRef.current=2;addLog('🧪 DMT BREAKTHROUGH! The machine elves arrive — boss attacks neutralized for 2 strikes.')}},
        {name:'REALITY GLITCH',desc:'Strike multiplier starts at ×2.0 every strike this fight!',color:'#88ccff',buffName:'REALITY GLITCH',
          apply:()=>{addLog('🧪 REALITY GLITCH! The simulation stutters — strikes start at ×2.0.')}},
        {name:'CRYSTAL SHRIEK',desc:'All members +5 ATK this fight!',color:'#ddaaff',buffName:'CRYSTAL SHRIEK',
          apply:()=>{
            // Big +5 buff. Differentiates from EGO DEATH's +2 by raw magnitude — this is the "I am the wall" trip.
            setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+5,tempAtkBonus:(m.tempAtkBonus||0)+5}):m))
            addLog('🧪 CRYSTAL SHRIEK! The frequencies pierce — all +5 ATK this fight!')
          }},
        {name:'K-HOLE',desc:'Boss frozen for 2 strikes. Band cannot heal this fight.',color:'#4466cc',buffName:'K-HOLE',
          apply:()=>{setBossSkipStrikes(2);bossSkipStrikesRef.current=2;addLog('🧪 K-HOLE. Dissociated. Boss frozen 2 strikes — but no healing.')}},
      ],
      // Bad trip: still triggers max corruption. Less catastrophic than before because corruption can't kill you anymore (Hangover).
      bad:{name:'BAD TRIP',desc:'Corruption hits 100%! Hangover incoming.',color:'#cc2222',buffName:'BAD TRIP',
        apply:()=>{setCorruption(100);addLog('🧪 BAD TRIP! Corruption maxed — tomorrow is gonna hurt.')}}
    },
    dmt:{
      // No bad trip pool — premium tier, all good outcomes. Boss-shop only at 25🌿.
      good:[
        {name:'HYPERSPACE',desc:'All cards cost 0 this fight!',color:'#ffffff',buffName:'HYPERSPACE',
          apply:()=>{setAllCardsFree(true);allCardsFreeRef.current=true;addLog('💠 HYPERSPACE! Outside time itself — all cards free.')}},
        {name:'OVERMIND',desc:'Strike multiplier starts at ×3.0 every strike!',color:'#88ddff',buffName:'OVERMIND',
          apply:()=>{addLog('💠 OVERMIND! The pattern emerges — strikes start at ×3.0.')}},
        {name:'GODHEAD',desc:'All members +10 ATK this fight!',color:'#ffdd44',buffName:'GODHEAD',
          apply:()=>{
            setStage(prev=>prev.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+10,tempAtkBonus:(m.tempAtkBonus||0)+10}):m))
            addLog('💠 GODHEAD! You become the riff — all +10 ATK this fight.')
          }},
        {name:'REBIRTH',desc:'Revive all stoned members at full HP, all +2 perm ATK!',color:'#ddffdd',buffName:'REBIRTH',instant:true,
          apply:()=>{
            let revivedCount=0
            setStage(prev=>prev.map(m=>{
              if(!m)return m
              if(m.tooStoned){
                revivedCount++
                // Mirror Wake Up Call's revive: restore base ATK, clear temp state, then apply +2 perm
                const baseAtk=m._origAtk!==undefined?m._origAtk:m.atk
                return Object.assign({},m,{tooStoned:false,hp:m.maxHp,atk:baseAtk+2,_origAtk:undefined,tempBuff:false,permAtkBonus:(m.permAtkBonus||0)+2})
              }
              return Object.assign({},m,{atk:m.atk+2,permAtkBonus:(m.permAtkBonus||0)+2})
            }))
            addLog('💠 REBIRTH! Death is a doorway — '+(revivedCount>0?revivedCount+' revived, ':'')+'all +2 ATK forever.')
          }},
        {name:'THIRD EYE',desc:'Draw 8 cards. Max embers +3 this fight.',color:'#aa88ff',buffName:'THIRD EYE',instant:true,
          apply:()=>{
            const _curHand=handRef.current||[]
            const target=_curHand.length+8
            const result=drawUpTo(_curHand,deckRef.current,discRef.current,target)
            if(result){
              setHand(result.h);handRef.current=result.h
              setDeck(result.d);deckRef.current=result.d
              setDiscardPile(result.disc);discRef.current=result.disc
            }
            setMaxEmbers(p=>Math.min(MAX_EMBERS_CAP,p+3))
            setEmbers(p=>Math.min(MAX_EMBERS_CAP,p+3))
            addLog('💠 THIRD EYE! The veil burns — drew 8 cards, +3 max embers.')
          }},
        {name:'SACRED CHORD',desc:'Boss takes ×3 damage AND skip its next attack!',color:'#ff88dd',buffName:'SACRED CHORD',
          apply:()=>{
            setBossSkipStrikes(p=>Math.max(p,1));bossSkipStrikesRef.current=Math.max(bossSkipStrikesRef.current,1)
            addLog('💠 SACRED CHORD! The note that splits worlds — boss takes ×3 damage, next attack skipped.')
          }},
        {name:'TIMELINE COLLAPSE',desc:'+2 bonus Strikes this fight!',color:'#ffaa00',buffName:'TIMELINE COLLAPSE',instant:true,
          apply:()=>{
            setStrikesLeft(p=>p+2);setFightMaxStrikes(p=>p+2)
            addLog('💠 TIMELINE COLLAPSE! All endings at once — +2 Strikes.')
          }},
        {name:'BLACK SUN',desc:'Every CORRUPT card played adds +50% strike multiplier!',color:'#aa00ff',buffName:'BLACK SUN',
          apply:()=>{addLog('💠 BLACK SUN! The light goes out — CORRUPT cards supercharge the strike.')}},
      ]
    }
  }

  // ── TRIP ACTIVATION ──────────────────────────────────────────────
  const activateTrip=useCallback((type)=>{
    if(tripUsedThisFight)return
    setTripUsedThisFight(true)
    // Decrement held count, bump run stat, achievement check
    if(type==='shrooms'){
      setHeldShrooms(p=>Math.max(0,p-1))
      setDrugsUsedThisRun(p=>{const n={...p,shrooms:p.shrooms+1};if(n.shrooms>0&&n.acid>0)tryAchieve('drug_lord');return n})
    } else if(type==='acid') {
      setHeldAcid(p=>Math.max(0,p-1))
      setDrugsUsedThisRun(p=>{const n={...p,acid:p.acid+1};if(n.shrooms>0&&n.acid>0)tryAchieve('drug_lord');return n})
    } else if(type==='dmt') {
      setHeldDMT(p=>Math.max(0,p-1))
      setDrugsUsedThisRun(p=>{const n={...p,dmt:(p.dmt||0)+1};return n})
      tryAchieve('dmt_traveler')
    }
    // Roll: 3% bad, 97% good for shrooms/acid. DMT has no bad pool — premium tier.
    const pool=TRIP_EFFECTS[type]
    let chosen
    if(type==='dmt'){
      chosen=pool.good[Math.floor(Math.random()*pool.good.length)]
    } else if(Math.random()<0.03){
      chosen=pool.bad
    } else {
      chosen=pool.good[Math.floor(Math.random()*pool.good.length)]
    }
    chosen.apply()
    // ── PHASE A4 (v0.7.2): louder activation moment ──
    // Existing playSfx call gives the base sting. Add an ascending pitch sweep
    // on top for pure dopamine — pitch climbs through the reveal, longer
    // and higher for DMT (the premium tier).
    playSfx(type==='shrooms'?'shrooms':type==='acid'?'acid':'big_hit')
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)()
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.type='sine'
      // Shrooms: 200→800 over 0.5s. Acid: 300→1200 over 0.7s. DMT: 400→2400 over 1.2s.
      const sweepStart=type==='shrooms'?200:type==='acid'?300:400
      const sweepEnd=type==='shrooms'?800:type==='acid'?1200:2400
      const sweepDur=type==='shrooms'?0.5:type==='acid'?0.7:1.2
      o.frequency.setValueAtTime(sweepStart,ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(sweepEnd,ctx.currentTime+sweepDur)
      g.gain.setValueAtTime(0.18,ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+sweepDur)
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+sweepDur)
    }catch(e){}
    // Shake: heavier and longer for DMT. Shrooms 20/500, Acid 25/600, DMT 35/900.
    const shakeAmount=type==='dmt'?35:type==='acid'?25:20
    const shakeDur=type==='dmt'?900:type==='acid'?600:500
    triggerShake(shakeAmount,shakeDur)
    setActiveTripEffect({type,name:chosen.name,desc:chosen.desc,color:chosen.color})
    setFightTripBuff(chosen.buffName||chosen.name) // combat reads this for ongoing buffs
    setTimeout(()=>setActiveTripEffect(null),4000)
  },[tripUsedThisFight,hand,setStage,setHand,setDeck,setDiscardPile,setStrikesLeft,setFightMaxStrikes,setFreeCardsLeft,setCorruption,setBossSkipStrikes,setHeldShrooms,setHeldAcid,setHeldDMT,setMaxEmbers,setAllCardsFree,setDrugsUsedThisRun,setTripUsedThisFight,setActiveTripEffect,setFightTripBuff])

  // ── ECHOPLEX / LOOPER / WITCH'S SABBATH REPLAY ENGINE ──
  // Replays queued during card plays fire at handleStrike start. Each replay:
  // 1. Spawns a polychrome card-flight animation (card slides from slot → boss
  //    with rainbow tracer trails, chromatic aberration, the works)
  // 2. Adds '_echo:'+cardId to cardsPlayedRef.current (purity-excluded by triggers)
  // 3. Re-applies the card's most impactful effects (permanent buffs stack,
  //    direct-damage cards re-deal damage, ATK doubles compound)
  // 4. Free of ember cost (replays are bonus actions)
  // Visual timing: 700ms per replay, staggered 200ms apart for cascade effect.
  const fireQueuedReplays=useCallback(()=>{
    const queue=queuedReplaysRef.current
    if(!queue||queue.length===0)return
    queuedReplaysRef.current=[]
    // ── Aug 4 2026 (phase 3): RETRIGGER DIRECT DAMAGE ────────────────────────
    // All 8 direct-damage branches below used to do
    //   const newHp=Math.max(0,enemyHp-dmg); setEnemyHp(newHp)
    // — an ABSOLUTE write computed from the stale `enemyHp` render closure, with no
    // victory trigger. Two queued replays both computed from the SAME stale base, so
    // the second overwrote the first and could HEAL the boss; and a retrigger that
    // killed the boss just left it sitting at 0 with the fight still running.
    // One functional-updater helper for all of them (CLAUDE.md rules 2 + 3).
    const _replayDamage=(amount)=>{
      const amt=Math.max(0,Math.round(amount||0))
      if(amt<=0)return
      enemyHpRef.current=Math.max(0,enemyHpRef.current-amt)
      setEnemyHp(prev=>{
        const nh=Math.max(0,prev-amt)
        if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
        return nh
      })
    }
    // Position references
    const bc=getCenter(bossRef)
    queue.forEach(function(replay,replayIdx){
      const card=ALL_CARDS.find(c=>c.id===replay.cardId)
      if(!card)return
      const slotIdx=replay.slotIdx
      const cx=getCenter(stageRefs.current[slotIdx])
      const stagger=replayIdx*200  // each replay 200ms after the last

      // ── PHASE 1: Spawn the polychrome card-flight at stagger time ──
      setTimeout(function(){
        const replayKey=Date.now()+replayIdx
        const cardType=card.type||'RIFF'
        // Push replay animation onto the visual stack
        setEchoplexReplays(prev=>[...prev,{
          key:replayKey,
          cardId:card.id,
          cardName:card.name,
          cardEmoji:card.emoji,
          cardType:cardType,
          fromX:cx.x,fromY:cx.y,
          toX:bc.x,toY:bc.y,
          kind:replay.kind
        }])
        // Banner text: which pedal triggered this replay
        const bannerText=replay.kind==='echoplex'?'🎚 ECHOPLEX RETRIGGER':replay.kind==='looper'?'♾ LOOPER REPLAY':'🌑 SABBATH REPLAY'
        const bannerColor=replay.kind==='echoplex'?'#ff8800':replay.kind==='looper'?'#44aaff':'#bb44ff'
        addFloat(bannerText,cx.x,cx.y-110,bannerColor,true)
        try{playSfx('chain_combo')}catch(e){}
        // Auto-cleanup the replay animation after 1.2s
        setTimeout(function(){
          setEchoplexReplays(prev=>prev.filter(r=>r.key!==replayKey))
        },1200)
      },stagger)

      // ── PHASE 2: Apply effects after card visually lands (~700ms after stagger) ──
      setTimeout(function(){
        // Mark this play as a retrigger in the cardsPlayedRef for purity exclusions
        cardsPlayedRef.current=[...cardsPlayedRef.current,'_echo:'+card.id]
        // Re-apply impactful effects
        setStage(function(prev){
          let ns=[...prev]
          const m=ns[slotIdx]
          // Battle Cry: +1 (or +2 with Guitar Tech) ATK permanent
          if(card.id==='battlecry'&&m){
            const bcBonus=(activePassives.some(p=>p.id==='p7')?2:1)+(card.upgraded?1:0)
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+bcBonus})
            addFloat('+'+bcBonus+' ATK',cx.x,cx.y-130,'#ff4400')
          }
          // New Strings: +2 ATK permanent
          else if(card.id==='newstrings'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+2})
            addFloat('+2 ATK',cx.x,cx.y-130,'#e8a820')
          }
          // Sound Wall: all +1 ATK permanent (uses passive p5 for +2)
          else if(card.id==='soundwall'){
            const swBonus=activePassives.some(p=>p.id==='p5')?2:1
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+swBonus}):mm)
            addFloat('ALL +'+swBonus+' ATK',window.innerWidth/2,window.innerHeight*0.4,'#ff4400',true)
          }
          // Whisper / Hungering Flame / etc — permanent ATK
          else if(card.id==='whispercard'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+2,permAtkBonus:(m.permAtkBonus||0)+2})
          }
          else if(card.id==='hungercard'){
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+1,tempAtkBonus:(mm.tempAtkBonus||0)+1}):mm)
          }
          else if(card.id==='dialtoeleven'){
            const dtBonus=card.upgraded?4:3
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+dtBonus,tempAtkBonus:(mm.tempAtkBonus||0)+dtBonus}):mm)
          }
          // Skull Splitter, Doom Chord, Heavy Riff, Feedback Scream — perm +ATK to target
          else if(card.id==='skullsplitter'&&m){
            const ssBonus=m.atk>=10?5:3
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+ssBonus})
          }
          else if(card.id==='doomchord'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+4})
            if(corruption>=50){
              const adj=[slotIdx-1,slotIdx+1].filter(i=>i>=0&&i<ns.length&&ns[i])
              adj.forEach(i=>{ns[i]=Object.assign({},ns[i],{atk:ns[i].atk+4})})
            }
          }
          else if(card.id==='heavyriff'&&m&&!m._hrUsed){
            const heavyMax=activePassives.some(p=>p.id==='p5')?25:20
            const hrBonus=Math.min(heavyMax,Math.floor(m.atk/2))
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+hrBonus,_hrUsed:true})
          }
          else if(card.id==='feedbackscream'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+4,hp:Math.max(1,m.hp-2)})
          }
          else if(card.id==='necroticamp'){
            const necBonus=Math.floor(corruption/20)
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+necBonus}):mm)
          }
          else if(card.id==='soulsacrifice'){
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+5}):mm)
          }
          else if(card.id==='infernalpact'){
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+2}):mm)
          }
          else if(card.id==='soulbargain'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+5,hp:Math.max(0,m.hp-3)})
            // Soul Bargain death rule: if HP would hit 0, member dies (per locked design D4)
            if(ns[slotIdx].hp<=0){
              addFloat('⚠ FATAL ECHO!',cx.x,cx.y-150,'#ff0000',true)
              ns[slotIdx]=Object.assign({},ns[slotIdx],{tooStoned:true,hp:0})
            }
          }
          else if(card.id==='venomriff'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+3})
          }
          else if(card.id==='cursedstrings'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+3})
          }
          else if(card.id==='moshpit'){
            const aliveCount=ns.filter(mm=>mm&&!mm.tooStoned).length
            const mpBonus=aliveCount>=4?2:1
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+mpBonus}):mm)
          }
          else if(card.id==='sonicboom'){
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+2}):mm)
          }
          else if(card.id==='tremolopick'&&m){
            const tpBonus=cardsPlayedRef.current.length>=3?4:1
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+tpBonus})
          }
          else if(card.id==='harmonicfb'){
            const riffsP=cardsPlayedRef.current.filter(id=>{
              const realId=String(id).startsWith('_echo:')?String(id).slice(6):id
              const c=ALL_CARDS.find(x=>x.id===realId);return c&&c.type==='RIFF'
            }).length
            if(m)ns[slotIdx]=Object.assign({},m,{atk:m.atk+riffsP})
          }
          // Encore (target attacks twice — refire encore flag)
          else if(card.id==='encore'&&m){
            ns[slotIdx]=Object.assign({},m,{encoreReady:true})
          }
          // Amp It Up: ×2 ATK temp
          else if(card.id==='amp'&&m&&!m.tooStoned){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk*2,_origAtk:m._origAtk||m.atk,tempBuff:true})
          }
          // ── ADDITIONAL REPLAY HANDLERS (tier-A/B from audit) ──
          // Groupie: +1 ATK perm to target
          else if(card.id==='groupie'&&m){
            ns[slotIdx]=Object.assign({},m,{atk:m.atk+1,permAtkBonus:(m.permAtkBonus||0)+1})
          }
          // Roadie: shield + heal target
          else if(card.id==='roadie'&&m){
            ns[slotIdx]=Object.assign({},m,{stoneShield:2,hp:(m.keyword==='FALLEN'||m.cursed)?m.hp:Math.min(m.maxHp,m.hp+2)})
          }
          // Wake Up Call: revive a Too Stoned member at 50% HP
          else if(card.id==='wakeup'){
            const stonedIdx=ns.findIndex(mm=>mm&&mm.tooStoned)
            if(stonedIdx>=0){const sm=ns[stonedIdx];ns[stonedIdx]=Object.assign({},sm,{tooStoned:false,hp:Math.floor(sm.maxHp*0.5)})}
          }
          // Slow Burn: +1 ember (no perpetual track since replay shouldn't loop the buff)
          else if(card.id==='slowburn'){
            setEmbers(p=>Math.min(maxEmbers,p+1))
          }
          // Riff Thief: steal 2 ATK from a random alive member to target
          else if(card.id==='riffthief'&&m){
            const candidates=ns.map((mm,i)=>(mm&&!mm.tooStoned&&i!==slotIdx)?i:-1).filter(i=>i>=0&&ns[i].atk>=2)
            if(candidates.length>0){
              const vi=candidates[Math.floor(Math.random()*candidates.length)]
              ns[vi]=Object.assign({},ns[vi],{atk:ns[vi].atk-2})
              ns[slotIdx]=Object.assign({},m,{atk:m.atk+2,tempBuff:true,_origAtk:m._origAtk||m.atk})
            }
          }
          // Blood Harmony: +1 ATK to all + 1 HP heal to all
          else if(card.id==='bloodharmony'){
            ns=ns.map(mm=>mm&&!mm.tooStoned?Object.assign({},mm,{atk:mm.atk+1,permAtkBonus:(mm.permAtkBonus||0)+1,hp:mm.cursed?mm.hp:Math.min(mm.maxHp,mm.hp+1)}):mm)
          }
          // Blood Ritual: sacrifice 25% target HP, deal that as damage
          else if(card.id==='bloodritual'&&m){
            const sacrifice=Math.floor(m.hp*0.25)
            if(sacrifice>0){
              ns[slotIdx]=Object.assign({},m,{hp:Math.max(1,m.hp-sacrifice)})
              // Direct damage to boss handled below in damage section
            }
          }
          return ns
        })
        // ── ADDITIONAL DIRECT DAMAGE CARD REPLAYS ──
        // Tapped Out: +5 embers next strike
        if(card.id==='tappedout'){setPendingEmbers(p=>p+5)}
        // Power Tap: +2 embers (3 with Haunted Radio a5)
        else if(card.id==='powertap'){
          const ptBonus=activeArtifacts.some(a=>a.id==='a5')?3:2
          setEmbers(p=>Math.min(maxEmbers,p+ptBonus))
        }
        // Shred Solo: direct damage = target ATK × 2 (use raw atk in replay since
        // we don't have full _atkCtx here — close enough for retrigger purposes)
        else if(card.id==='shredsolo'){
          const target=stage[slotIdx]
          if(target){
            const dmg=(target.atk||0)*2
            _replayDamage(dmg)
            addFloat(dmg.toLocaleString(),bc.x,bc.y-60,'#9933cc',true)
            updStat('totalDamage',dmg)
          }
        }
        // Dark Crescendo: dmg scales with cards played this strike (10 per card)
        else if(card.id==='darkcrescendo'){
          const cnt=cardsPlayedRef.current.length
          const dmg=cnt*10
          _replayDamage(dmg)
          addFloat(dmg.toLocaleString(),bc.x,bc.y-60,'#aa44cc',true)
          updStat('totalDamage',dmg)
        }
        // Going Broke: dmg = current stash (no spend on replay since stash was already spent)
        else if(card.id==='goingbroke'){
          // Replay just floats a "broke!" with no damage since stash is 0
          addFloat('💸 BROKE ECHO',bc.x,bc.y-90,'#ffcc00')
        }
        // Russian Roulette: roll d6 fresh each replay
        else if(card.id==='russianroulette'){
          const target=stage[slotIdx]
          if(target&&!target.tooStoned){
            const roll=Math.floor(Math.random()*6)+1
            setStage(prev=>{
              const ns=[...prev];const t=ns[slotIdx]
              if(!t)return prev
              if(roll===1){ns[slotIdx]=Object.assign({},t,{tooStoned:true,hp:0});addFloat('🔫 STONED!',cx.x,cx.y-130,'#ff0000',true)}
              else if(roll<=5){ns[slotIdx]=Object.assign({},t,{atk:t.atk+4,tempBuff:true,_origAtk:t._origAtk||t.atk});addFloat('🔫 +4 ATK!',cx.x,cx.y-130,'#22aa44')}
              else{ns[slotIdx]=Object.assign({},t,{atk:t.atk+8,tempBuff:true,_origAtk:t._origAtk||t.atk,stoneShield:2});addFloat('🔫 +8 ATK + 🛡',cx.x,cx.y-130,'#ffdd00')}
              return ns
            })
          }
        }
        // Devil's Dice: random 1-12 dmg
        else if(card.id==='devilsdice'){
          const dmg=Math.floor(Math.random()*12)+1
          _replayDamage(dmg)
          addFloat(dmg.toLocaleString(),bc.x,bc.y-60,'#cc1144',true)
          updStat('totalDamage',dmg)
        }
        // ── BLOOD RITUAL DAMAGE (separate from buff above) ──
        else if(card.id==='bloodritual'){
          const target=stage[slotIdx]
          if(target){
            const sacrifice=Math.floor(target.hp*0.25)
            if(sacrifice>0){
              _replayDamage(sacrifice*3)
              addFloat((sacrifice*3).toLocaleString(),bc.x,bc.y-60,'#aa1111',true)
              updStat('totalDamage',sacrifice*3)
            }
          }
        }
        // Direct damage cards (Stage Dive deals damage = target HP)
        if(card.id==='stagedive'){
          const target=stage[slotIdx]
          if(target){
            const dmg=target.hp
            _replayDamage(dmg)
            addFloat(dmg.toLocaleString(),bc.x,bc.y-60,'#ff2200',true)
            updStat('totalDamage',dmg)
          }
        }
        // Madness Unleashed: 15% max HP direct damage
        else if(card.id==='madnesscard'){
          const maxHp=scaledMaxHp||(enemy?enemy.maxHp:100)
          const dmg=Math.floor(maxHp*0.15)
          _replayDamage(dmg)
          addFloat(dmg.toLocaleString(),bc.x,bc.y-60,'#cc1144',true)
          updStat('totalDamage',dmg)
        }
        // Death Riff: low corruption = more damage
        else if(card.id==='deathriff'){
          const drDmg=Math.max(3,15-Math.floor(corruption/10))
          _replayDamage(drDmg)
          addFloat(drDmg.toLocaleString(),bc.x,bc.y-60,'#ff2200',true)
          updStat('totalDamage',drDmg)
        }
        // Hex of Decay: 15% current HP direct damage
        else if(card.id==='hexdecay'){
          const dmg=Math.floor(enemyHpRef.current*0.15)
          _replayDamage(dmg)
          addFloat(dmg.toLocaleString(),bc.x,bc.y-60,'#88cc44',true)
          updStat('totalDamage',dmg)
        }
        // Corruption-changing cards
        if(['dialtoeleven','sigdecay','distortion','staticcharge','seance','darktuning','soulbargain','venomriff','soulsacrifice','infernalpact','hellfirerift','offeringpit','hexdecay','possessionriff','carrioncall','corrsiphon'].includes(card.id)){
          const corrDeltas={dialtoeleven:10,sigdecay:0,distortion:15,staticcharge:0,seance:0,darktuning:0,soulbargain:5,venomriff:5,soulsacrifice:15,infernalpact:0,hellfirerift:20,offeringpit:10,hexdecay:15,possessionriff:10,carrioncall:20,corrsiphon:8}
          const delta=corrDeltas[card.id]||0
          if(delta>0){setCorruption(p=>Math.min(100,p+delta))}
        }
        // Impact SFX on land
        try{playHit();triggerShake(6,180)}catch(e){}
      },stagger+700)
    })
    // Summary log after all queued replays start
    if(queue.length>0){addLog('🎚 '+queue.length+' replay'+(queue.length>1?'s':'')+' fired!')}
  },[stage,enemyHp,scaledMaxHp,enemy,corruption,activePassives])

  // handleStrikeBody is invoked via ref to avoid stale-closure issues across
  // the handleStrike→handleStrikeBody split. Ref is wired below the definition.
  const handleStrikeBodyRef=useRef(null)
  const handleStrike=useCallback(()=>{
    setUndoSnapshot(null) // can't undo after striking
    // Guard: don't allow re-triggering during animation
    if(animPhase!=='idle'||enemyHp<=0)return // OVERTIME (Jul 31): striking allowed past 0 — boss enrages instead
    const _fightToken=fightTokenRef.current
    // ── FIRE ECHOPLEX/LOOPER/SABBATH REPLAYS first ──
    // Replays apply card effects again (stacking permanent buffs, re-dealing
    // direct damage). Marked with '_echo:' prefix in cardsPlayedRef so artifact
    // purity checks (Doom Crown allSameType, Solo Sermon cards2exact) ignore them.
    // The replay animation is staggered: 200ms apart, 700ms each.
    const _replayQueueLen=(queuedReplaysRef.current||[]).length
    fireQueuedReplays()
    // Delay the strike body if replays are firing — let visuals land first.
    // Each replay takes ~700ms with 200ms stagger; total = queue*200 + 800ms.
    if(_replayQueueLen>0){
      // Set animPhase to a non-idle marker so player can't re-click Strike
      setAnimPhase('replaying')
      const _replayDelay=_replayQueueLen*200+800
      strikeTimersRef.current.push(setTimeout(()=>{
        // Aug 4 2026 (phase 3): a replay that KILLED the boss inside this delay window
        // used to run a whole strike body against whatever fight was current — burning
        // a strike, wiping strikeMult and scheduling a full boss-attack chain on the
        // NEXT boss. Guard on fight identity + live HP + phase.
        if(fightTokenRef.current!==_fightToken){try{console.warn('[STALE-TIMER-BLOCKED] handleStrike replay-delay body (fight changed)')}catch(e){}return}
        if(gameStateRef.current!=='playing'){try{console.warn('[STALE-TIMER-BLOCKED] handleStrike replay-delay body (left the fight screen)')}catch(e){}return}
        if(enemyHpRef.current<=0){try{console.warn('[STALE-TIMER-BLOCKED] handleStrike replay-delay body (boss already dead)')}catch(e){}setAnimPhase('idle');return}
        setAnimPhase('idle');if(handleStrikeBodyRef.current)handleStrikeBodyRef.current()
      },_replayDelay))
      return
    }
    if(handleStrikeBodyRef.current)handleStrikeBodyRef.current()
  },[animPhase,strikesLeft,enemyHp,fireQueuedReplays])

  // The actual strike resolution body — extracted so we can delay it for replay animations.
  const handleStrikeBody=useCallback(()=>{
    // Aug 4 2026 (phase 3): fight identity. Every deferred body below re-checks this
    // and bails if the fight moved on while it was pending.
    const _fightToken=fightTokenRef.current
    const _stale=(where)=>{
      if(fightTokenRef.current!==_fightToken){
        try{console.warn('[STALE-TIMER-BLOCKED] '+where+' — fight token '+_fightToken+' != '+fightTokenRef.current)}catch(e){}
        return true
      }
      return false
    }
    const _reg=(t)=>{strikeTimersRef.current.push(t);return t}
    // (Ritualist's per-strike ember refund cap resets in the PER-STRIKE RESET below)
    // (75% Madness random-discard removed in v0.7.1 simplification — punishing RNG with no agency)
    // ── EARLY RETURNS FIRST (Aug 4 2026, phase 3) ──────────────────────────
    // These used to sit BELOW setStrikeMult(_newStrikeStart), so bailing out
    // ("boss already dead", "No active members!") still destroyed the accumulated
    // strike multiplier. A whole band going Too Stoned wiped a ×12 with no strike
    // thrown and no strike consumed. Read the live HP ref, not the stale closure.
    if((enemyHpRef.current!==undefined&&enemyHpRef.current!==null?enemyHpRef.current:enemyHp)<=0)return // OVERTIME: no strike floor
    const actives=stage.filter(m=>m&&!m.tooStoned)
    if(actives.length===0){addLog('⚠ No active members!');return}
    // ── #10 LUCKY DRAW — unlocked after first Lucifer kill, toggleable ──────
    // Aug 4 2026 (phase 3): moved ABOVE the currentMult capture. The ×1.5 used to be
    // applied after currentMult was already read, so it never affected the strike it
    // fired on while the log and the float both claimed it did.
    // Gate fixed too: nothing ever wrote a `vst_achievement_*` key — unlockAchievement
    // writes a JSON array to `vst_achievements`, so the whole feature was unreachable.
    const _luckyUnlocked=getAchievements().includes('beat_lucifer')&&localStorage.getItem('vst_lucky_draw')!=='off'
    const _luckyRng=((runSeed*7+stats.strikesThrown*13+fightIndex*31)%100)
    if(_luckyUnlocked&&_luckyRng<10){
      const _luckyType=_luckyRng%5
      if(_luckyType===0){strikeMultRef.current=Math.min(10000,strikeMultRef.current*1.5);addLog('🍀 LUCKY DRAW! ×1.5 Strike Mult bonus!');addFloat('🍀 LUCKY ×1.5!',960,300,'#ffdd00',true)}
      else if(_luckyType===1){setStash(p=>Math.min(420,p+10));addLog('🍀 LUCKY DRAW! +10 Stash from the crowd!');addFloat('🍀 +10 STASH!',960,300,'#44ff44',true)}
      else if(_luckyType===2){setEmbers(p=>Math.min(maxEmbers,p+2));addLog('🍀 LUCKY DRAW! +2 bonus Embers!');addFloat('🍀 +2 EMBERS!',960,300,'#ff8800',true)}
      else if(_luckyType===3&&hand.length<6){setPendingDraw(p=>p+1);addLog('🍀 LUCKY DRAW! Draw 1 extra card!');addFloat('🍀 +1 CARD!',960,300,'#44aaff',true)}
      else{setStage(p=>p.map(s=>s&&!s.tooStoned?Object.assign({},s,{atk:s.atk+1,permAtkBonus:(s.permAtkBonus||0)+1}):s));addLog('🍀 LUCKY DRAW! All members +1 ATK!');addFloat('🍀 +1 ALL ATK!',960,300,'#cc44ff',true)}
    }
    const currentMult=strikeMultRef.current
    // v0.7.2: Trip-driven strike-mult start values
    //   REALITY GLITCH (acid):  ×2.0 every strike
    //   OVERMIND (DMT):         ×3.0 every strike
    const _newStrikeStart=fightTripBuff==='OVERMIND'?3.0:fightTripBuff==='REALITY GLITCH'?2.0:1.0
    setStrikeMult(_newStrikeStart);strikeMultRef.current=_newStrikeStart
    setMemberBuffs({});
    // animPhase guard removed here — wrapper handleStrike checks it before calling.
    // After replay delay, animPhase=='replaying' in this closure (stale), so checking
    // here would always early-return and strike would never resolve.
    // ── KEYWORD STACK CONTEXT — centralized helper for tier-scaled bonuses ──
    // Stage doesn't change during damage calc, so compute tier once per strike.
    // riffsThisStrike captured here before cardsPlayedRef reset further down.
    // shredderHits = consecutive same-type pairs (each adjacent same-type
    // adds 1 hit; e.g. RIFF→RIFF→CORRUPT yields 1 hit).
    const _kwStacks=getKeywordStacks(stage)
    const _cardIdsThisStrike=cardsPlayedRef.current.slice() // snapshot before reset
    // Aug 1 2026: snapshot the fired chains too — the artifact-multiplier block far
    // below runs inside a setTimeout and reads these refs AFTER they were emptied.
    const _combosThisStrike=(combosFiredRef.current||[]).slice()
    lastStrikeCombosRef.current=_combosThisStrike // victory summary reads this after the reset below
    // Aug 4 2026 (phase 3): discard counters must be snapshotted BEFORE the per-strike
    // reset (the artifact block reads them from inside a setTimeout).
    const _discardsThisStrike=(discardsThisStrikeRef&&discardsThisStrikeRef.current)||0
    const _riffsThisStrike=_cardIdsThisStrike.filter(id=>CARD_TYPE_BY_ID[id]==='RIFF').length
    // ── SHREDDER: consecutive same-type pairs. ─────────────────────────────
    // Aug 4 2026 (phase 3): this walked the RAW id list, so an '_echo:' retrigger id
    // had CARD_TYPE_BY_ID===undefined and `undefined===undefined` counted as a type
    // MATCH. Two back-to-back retriggers handed a 3-stack SHREDDER band +4/+8 free ATK
    // per member that neither the sim nor the preview modelled. _riffsThisStrike
    // already excluded synthetics; make the shredder walk agree.
    const _realIdsThisStrike=_cardIdsThisStrike.filter(id=>!String(id).startsWith('_echo:')&&CARD_TYPE_BY_ID[id]!==undefined)
    let _shredderHits=0
    for(let _si=1;_si<_realIdsThisStrike.length;_si++){
      if(CARD_TYPE_BY_ID[_realIdsThisStrike[_si]]===CARD_TYPE_BY_ID[_realIdsThisStrike[_si-1]])_shredderHits++
    }
    const _atkCtx={corruption,tier:_kwStacks.tier,riffsThisStrike:_riffsThisStrike,shredderHits:_shredderHits,auraAtk:_auraAtkMap(stage,{corruption,shredderHits:_shredderHits})}

    if(pendingEmbers>0){setEmbers(p=>Math.min(maxEmbers,p+pendingEmbers));addLog('🪙 +'+pendingEmbers+' Embers from Tapped Out!');playEmber();setPendingEmbers(0)}
    if(slowBurnStrikes>0){setEmbers(p=>Math.min(maxEmbers,p+1));addLog('🕯️ Slow Burn: +1 ember');setSlowBurnStrikes(p=>p-1)}
    // Aug 4 2026 (phase 3): tempBuff without _origAtk NEVER expires — the expiry block
    // requires `nm.tempBuff && nm._origAtk!==undefined`. Pyromaniac was handing out
    // +3 PERMANENT ATK to every member on every proc (4 strikes = +12 for the rest of
    // the run). Stamp _origAtk so the buff actually ends after the strike.
    if(pyromaniacActive&&embers===0){setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+3,tempBuff:true,_origAtk:m._origAtk!==undefined?m._origAtk:m.atk}):m));addLog('🧨 PYROMANIAC TRIGGERED! ALL +3 ATK! (spent all embers)');setPyromaniacActive(false)}
    if(venomDotStacks>0){const vd=venomDotStacks;setEnemyHp(p=>{const nh=Math.max(0,p-vd);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh});addLog('🐍 Venom DOT: boss takes '+vd+' damage')}
    if(pendingDraw>0){
      const _pd=pendingDraw
      const pdRes=drawUpTo(handRef.current,deckRef.current,discRef.current,handRef.current.length+_pd)
      setHand(pdRes.h);setDeck(pdRes.d);setDiscardPile(pdRes.disc)
      addLog('🎛 Soundboard draw! +'+_pd+' card'+(_pd>1?'s':'')+'.')
      setPendingDraw(0)
    }

    // KEYWORD STACK — DEBUFF: tier-scaled boss debuff (foil counts as 2 stacks)
    const debuffStacks=stage.filter(m=>m&&!m.tooStoned&&m.keyword==='DEBUFF').reduce((s,m)=>s+(m.foil?2:1),0)
    const debuffTier=debuffStacks>=3?4:debuffStacks===2?2:debuffStacks>=1?1:0
    const debuffCount=debuffTier // backwards-compat name; preserved for downstream reads
    if(debuffTier>0){setBossDebuff(p=>p+debuffTier*2);addLog('🎤 Vocalist debuffs the boss! (-'+(debuffTier*2)+' damage'+(debuffTier>=2?' · STACK ×'+debuffTier:'')+')')}
    // Aug 4 2026 (phase 3): counted '_echo:' retrigger entries, so replays inflated the
    // post-strike refill and burned the deck faster than the design intends. Real plays only.
    cardsToDrawRef.current=cardsPlayedRef.current.filter(id=>!String(id).startsWith('_echo:')).length
    setAnimPhase('attacking');setStrikesLeft(p=>p-1);updStat('strikesThrown',1)
    // Mythic tracking: count strikes vs Lucifer for The Conduit unlock (≤3 strikes)
    if(enemy&&(enemy.passiveId==='luciferBoss'||enemy.id==='lucifer'||enemy.name==='Lucifer')){
      luciferStrikesUsedRef.current++
    }
    // ── PER-STRIKE RESET — the SINGLE place per-strike state is cleared ────
    // Aug 4 2026 (phase 3): discardsThisStrikeRef was only ever reset at FIGHT start,
    // so "this strike" discard relics compounded across the whole fight — Ouroboros
    // Pin's ×1.3 perDiscardStrike hit ×1.3^8 (×8.16) by strike 4 and fired on strikes
    // where you discarded nothing, and Spit Cup's discardedStrike stayed permanently on.
    // Phase 4: the contents moved into PER_STRIKE_RESETS (see RESET REGISTRY), and
    // the Ritualist ember-refund cap — which used to be reset separately ~90 lines
    // above — folded in, so there is exactly one per-strike reset site.
    resetPerStrikeState({evilEye:activeArtifacts.some(a=>a.id==='a3')||activePassives.some(p=>p.id==='a3')})

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
    // Aug 4 2026 (phase 3): gated on activeStake.maxStrikes instead of fightMaxStrikes,
    // so with the War Drums pact or a deck maxStrikesMod it never fired on strike 1 and
    // fired on strike 2 instead. The damage preview already uses fightMaxStrikes.
    // (strikesLeft here is the PRE-decrement value: strike 1 == fightMaxStrikes.)
    const p10Bonus=activePassives.some(p=>p.id==='p10')&&strikesLeft===fightMaxStrikes?10:0
    const _breakdownLines=[]
    let dmg=actives.filter(m=>m.role!=='Drummer'&&(!paranoiaVictim||m.uid!==paranoiaVictim.uid)).reduce((s,m)=>{
      const effectiveAtk=getEffectiveAtk(m,_atkCtx)
      const cleanLivingBonus=0 /* clean_living now applies at fight start */
      return s+effectiveAtk+cleanLivingBonus
    },0)+p10Bonus
    let _bkRunning=dmg
    // BLASTBEAT: each drummer makes the whole band hit +50% harder — flat, no dice, STACKS.
    let dblMult=1
    if(hasDbl){
      const _bbCount=actives.filter(m=>m.role==='Drummer').length
      dblMult=Math.round(Math.pow(1.5,_bbCount)*100)/100
      dmg=Math.round(dmg*dblMult);_bkRunning=dmg
      _breakdownLines.push({type:'multiply',label:'BLASTBEAT ×'+dblMult,label2:'= '+dmg.toLocaleString(),runningAfter:dmg,color:'#ff8800'})
    }
    // Aug 4 2026 (phase 3): the Encore bonus did NOT exclude the paranoia victim, unlike
    // the base sum, the DOUBLE TIME tier-3 bonus and memberDmgs. Against The Traitor a
    // member who "refuses to attack" still contributed full ATK here, so the per-member
    // breakdown lines summed to LESS than the BASE ATK subtotal printed under them.
    const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer'&&(!paranoiaVictim||m.uid!==paranoiaVictim.uid)).reduce((s,m)=>{
      const ea=getEffectiveAtk(m,_atkCtx)
      return s+ea
    },0)
    dmg+=encDmg
    if(encDmg>0){_bkRunning=dmg;_breakdownLines.push({type:'add',label:'Encore',emoji:'🔁',value:encDmg,runningAfter:dmg,color:'#44cc44'})}
    // ── DOUBLE TIME tier-3 (4d) — at 3+ stacks of Drummers, ALL members attack twice ──
    // NOTE (May 2): currently unreachable in normal play. The recruit screen at line 4433
    // blocks adding a 2nd DOUBLE TIME drummer (canAdd = ... && !(isDblTime&&hasDblTime)).
    // 2 basic drummers via Opening Night = 2 stacks (tier 2), not tier 3+. Code kept
    // intact in case JV ever lifts the recruit restriction. Tooltip text and rules-help
    // updated to NOT promise this tier so players aren't misled.
    const _dtTier=_kwStacks.tier('DOUBLE TIME')
    if(_dtTier>=4){
      const _dtBonusDmg=actives.filter(m=>m.role!=='Drummer'&&(!paranoiaVictim||m.uid!==paranoiaVictim.uid)).reduce((s,m)=>s+getEffectiveAtk(m,_atkCtx),0)
      if(_dtBonusDmg>0){
        dmg+=_dtBonusDmg;_bkRunning=dmg
        _breakdownLines.push({type:'add',label:'DOUBLE TIME ×3!',emoji:'🥁',value:_dtBonusDmg,runningAfter:dmg,color:'#ff8800'})
        addLog('🥁 DOUBLE TIME ×3! All members attack twice!')
      }
    }
    dmg=Math.round(dmg*bandBonus)
    if(bandBonus>1){_bkRunning=dmg;_breakdownLines.push({type:'multiply',label:'Band Synergy ×'+bandBonus.toFixed(2),label2:'= '+dmg.toLocaleString(),runningAfter:dmg,color:'#ffd700'})}
    // ── MENTOR LINK strike multiplier ──────────────────────────────
    let _mlb=0
    for(let _i=0;_i<stage.length-1;_i++){
      const _mn=stage[_i],_bs=stage[_i+1]
      if(!_mn||!_bs||_mn.tooStoned||_bs.tooStoned)continue
      if(_mn.isMentor&&_bs.mentorLinkedToUid===_mn.uid&&_bs.mentorAlive){
        const _ma=getEffectiveAtk(_mn,_atkCtx)
        const _ba=getEffectiveAtk(_bs,_atkCtx)
        const _effectiveMult=_bs.mentorMult+(activeStake.mentorBonus||0)
        const _b=Math.round((_ma+_ba)*(_effectiveMult-1))
        _mlb+=_b
        addLog('⛓ Mentor Link! '+_mn.name+'+'+_bs.name+' ×'+_effectiveMult.toFixed(2)+' (+'+_b+'!)');tryAchieve('mentor_link')
        addFloat('⛓ ×'+_effectiveMult.toFixed(2),getCenter(stageRefs.current[_i]).x,getCenter(stageRefs.current[_i]).y-80,'#ffd700',true)
      }
    }
    if(_mlb>0){dmg+=_mlb;_bkRunning=dmg;_breakdownLines.push({type:'add',label:'Mentor Link',emoji:'⛓',value:_mlb,runningAfter:dmg,color:'#ffd700'})}
    // CA4: Wailing Guitar — first Strike deals double damage.
    // Aug 4 2026 (phase 3): the old comment was wrong. setStrikesLeft(p=>p-1) is a
    // FUNCTIONAL update — it does not touch the `strikesLeft` const in this closure, so
    // strikesLeft here is still the PRE-decrement value and strike 1 == fightMaxStrikes.
    // The `-1` made this fire on strike TWO. The preview mirror (fightMaxStrikes) had it right.
    if(activeArtifacts.some(a=>a.id==='ca4')&&strikesLeft===fightMaxStrikes){dmg*=2;_bkRunning=dmg;_breakdownLines.push({type:'multiply',label:'Wailing Guitar ×2',label2:'= '+dmg.toLocaleString(),runningAfter:dmg,color:'#ff4488'});addLog('🎸 Wailing Guitar! First Strike deals DOUBLE damage!')}
    // HEXED: auto-raise corruption +5%, member gains +1 ATK per 10% corruption
    const hexedMembers=actives.filter(m=>m.keyword==='HEXED')
    if(hexedMembers.length>0){
      setCorruption(prev=>{
        const nc=Math.min(100,prev+5*hexedMembers.length)
        updStat('maxCorruption',nc,true)
        // Grant ATK based on new corruption level
        setStage(prevStage=>prevStage.map(m=>{
          if(!m||m.tooStoned||m.keyword!=='HEXED')return m
          const hexAtk=Math.floor(nc/8)
          const baseAtk=ALL_MUSICIANS.find(mu=>mu.id===m.id)?.atk||2
          return Object.assign({},m,{atk:Math.max(m.atk,baseAtk+hexAtk)})
        }))
        return nc
      })
      addLog('🟠 HEXED! Corruption +'+5*hexedMembers.length+'%. Orm grows stronger.')
    }
    const hasFolkMagic=actives.some(m=>m.keyword==='FOLK MAGIC')
    const folkMagicFired=hasFolkMagic&&Math.random()<0.25
    addLog('⚔ Band attacks for '+dmg+'!'+(hasDbl?' (BLASTBEAT ×'+dblMult+'!)':'')+(folkMagicFired?' 🪈 FOLK MAGIC!':''))

    const bc=getCenter(bossRef)
    let delay=0
    // ── Aug 3 2026: THE PHANTOM-VICTORY ROOT CAUSE ───────────────────────
    // This read the STALE `enemyHp` closure value. Between fights, and during
    // Lucifer's phase 1 -> 2 handoff, enemyHp is transiently 0 — so a strike that
    // resolved in that window computed startHp = 0, therefore newEHp = 0 - dmg <= 0,
    // therefore INSTANT VICTORY on a boss at full health. The overnight ledger caught
    // it 16 times, including "won" against Lucifer phase 2 at 330,548 / 333,333 HP
    // while the band was only dealing ~2-4k per strike. Every fight it faked is
    // balance data we have to throw away. Read the live ref instead.
    const startHp=(enemyHpRef.current!==undefined&&enemyHpRef.current!==null)?enemyHpRef.current:enemyHp
    // Compute per-member damage for cascade display
    const memberDmgs=[]
    actives.forEach(function(m){
      if(m.role==='Drummer')return
      if(paranoiaVictim&&m.uid===paranoiaVictim.uid)return
      let mAtk=getEffectiveAtk(m,_atkCtx)
      /* clean_living now applies at fight start */
      if(m.encoreReady)mAtk*=2
      memberDmgs.push({m,atk:mAtk})
    })
    // Build per-member breakdown lines (after memberDmgs is populated)
    memberDmgs.forEach(d=>{_breakdownLines.push({type:'member',label:d.m.name,emoji:d.m.emoji,value:d.atk,color:'#c8a060'})})
    _breakdownLines.push({type:'subtotal',label:'BASE ATK',value:dmg,color:'#e8a820'})
    _bkRunning=dmg
    // ── BASE MULTIPLIER for per-member impact damage (v0.7.11) ──
    // JV feedback: "the band members attacking do such little damage to the
    // boss hp bar then all at once the combos trigger and the multiplier kills
    // the boss. it would be cool if each member did their multiplied damage."
    //
    // Old: per-member impact dealt raw md.atk (3-15 dmg each), boss HP barely
    // moved during the attack animation. THEN a giant slam at the end killed
    // the boss with the full multiplied total.
    //
    // New: each member's impact deals their MULTIPLIED share of damage using
    // the deterministic base multiplier (strike × trip × corruption). The
    // artifact multiplier ("joker" reveal) still gets added at the cascade
    // slam, so the slam still rewards the player with bonus damage on top.
    // Boss HP drops dramatically with each hit AND the slam still feels good.
    //
    // Math: each member's impact = round(md.atk * baseMult). Sum across all
    // members ≈ dmg * baseMult. The post-strike cascade computes the full
    // _totalStrikeDmg = dmg * baseMult * artifactMult. At slam, _applyHpDrop
    // sets HP via Math.min(prev, newEHp), filling in the artifactMult bonus.
    const _baseTripMult=fightTripBuff==='SACRED CHORD'?3:(fightTripBuff==='DIMENSIONAL RIFT'||fightTripBuff==='FRACTAL VISION')?2:1
    const _baseCorrMult=corruption>=100?3.0:corruption>=80?2.0:corruption>=60?1.5:corruption>=40?1.2:1.0
    const _baseImpactMult=currentMult*_baseTripMult*_baseCorrMult
    // Aug 4 2026 (phase 3): the cascade's HP drop is now a DELTA, so it has to know
    // exactly how much the per-member impacts already took off. Same membership rule as
    // the impact loop below (non-Drummer, non-paranoia, atk>0).
    const _impactApplied=memberDmgs.filter(d=>d.atk>0).reduce((s,d)=>s+Math.max(1,Math.round(d.atk*_baseImpactMult)),0)
    // Mark the strike pipeline live: the 600ms victory safety net must not fire between
    // the first impact landing and the cascade block resolving the kill.
    strikeInFlightRef.current++
    const _endPipeline=()=>{if(strikeInFlightRef.current>0)strikeInFlightRef.current--}
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
      _reg(setTimeout(function(){
        if(_stale('per-member impact damage'))return
        setStrikeAnim({slotIdx:si,phase:'impact',dx,dy})
        try{(ATK_SND[m.role]||ATK_SND['Lead Guitarist'])()}catch(e){}
        playHit()
        triggerShake(8,250)
        if(md){
          // v0.7.11: deal MULTIPLIED damage at impact instead of raw md.atk.
          // Float text and HP deduction both use the multiplied value so the
          // boss HP bar moves dramatically with each hit. Artifact multiplier
          // still adds a slam bonus on top via the cascade.
          const _imp=Math.max(1,Math.round(md.atk*_baseImpactMult))
          addFloat(_imp.toLocaleString(),bc.x,bc.y-60,'#cc8800',_imp>=15)
          // Deliberately does NOT trigger victory: the cascade block a beat later owns
          // the kill (Lucifer phase handoff, overkill stat, breakdown slam). The 600ms
          // safety net is held off by strikeInFlightRef until then — see the effect.
          enemyHpRef.current=Math.max(0,enemyHpRef.current-_imp)
          setEnemyHp(p=>Math.max(0,p-_imp))
        }
      },curDelay+(speedFast?550:1200)))
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

    _reg(setTimeout(function(){
      if(_stale('strike cascade / damage resolution')){_endPipeline();return}
      setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setProjectiles([])
      const tripMult=fightTripBuff==='SACRED CHORD'?3:(fightTripBuff==='DIMENSIONAL RIFT'||fightTripBuff==='FRACTAL VISION')?2:1
      const corruptionMult=corruption>=100?3.0:corruption>=80?2.0:corruption>=60?1.5:corruption>=40?1.2:1.0 // v0.7.1: kept original ramp; cost moved to Hangover system (out-of-fight)
      // ── BIG-NUMBERS ENGINE: collect every multiplier as a discrete cascade event ──
      // Each entry = {mult, label, color}. During the cascade, the visible strikeMult
      // counter climbs through each entry one by one, building suspense as it grows
      // from ~1.85 (card-play) into the hundreds or thousands with stacked artifacts.
      // Final damage is identical to before — this is purely visualization.
      const _cascadeMults=[]
      // 1. Strike (cards + chains) — the visible mult already shows this, but we
      //    re-emit it in the cascade so the animation has a starting beat.
      if(currentMult>1.0)_cascadeMults.push({mult:currentMult,label:'Strike (cards + chains)',emoji:'⛧',color:'#ff4400'})
      // 2. Trip buff
      if(tripMult>1)_cascadeMults.push({mult:tripMult,label:fightTripBuff||'Trip',emoji:'🍄',color:'#ff44ff'})
      // 3. Corruption tier
      if(corruptionMult>1)_cascadeMults.push({mult:corruptionMult,label:'Corruption '+Math.floor(corruption)+'%',emoji:'🌀',color:'#cc44ff'})
      // ARTIFACT MULTIPLIER TRIGGERS — Balatro-style Jokers
      let artifactMult=1.0
      // Aug 4 2026 (phase 3): flat (additive) relic damage. Tongue of the Devourer used
      // to fake this as a multiplier — 1+(tongueDmg/dmg) against the PRE-multiplier base,
      // pushed into the cascade display and into _totalMult but NEVER into artifactMult.
      // It was shown and never dealt: the breakdown's running total ended higher than the
      // boss's actual HP loss. Real additive term now, applied after the multipliers.
      let _flatArtifactDmg=0
      let _flatArtifactLabel='',_flatArtifactEmoji=''
      // ── Aug 1 2026 CRITICAL: EVERY CARD/CHAIN-COUNT RELIC WAS DEAD ────────
      // These used to read cardsPlayedRef / combosFiredRef, but both are emptied
      // synchronously earlier in handleStrikeBody while this block runs inside a
      // setTimeout — so both were ALWAYS 0 and every count-based multiplier
      // silently never fired: Vintage Guitar (cards3), Burning Stage x3.0
      // (cards5), Solo Sermon x6.0 (cards2exact), Doom Crown x8.0 (allSameType),
      // Black Mass Bell x2.5 (chains3), Haunted Radio (perChain), Pentagram
      // Shrine (perCorruptCard), Cracked Pickup (playedRiff), Tape Hiss (noRiff),
      // Set List Art (firstCardEmber), Resonance Coil (perDupePlayed).
      // Relics were a dead system in the live game. Use the pre-reset snapshots.
      const cardsPlayedCount=_cardIdsThisStrike.length||0
      const chainsFired=_combosThisStrike.length
      const stonedCount=stage.filter(m=>m&&m.tooStoned).length
      const handDupes=hand.filter((c,i)=>hand.findIndex(h=>h.id===c.id)!==i).length
      // ── EXTENDED CONTEXT for new multTrigger types ──
      // _cardsThisStrike list filtered to count types/CORRUPTs/RIFFs played this strike.
      // Echoplex retriggers prefix with '_echo:' on the card ID — excluded from purity checks.
      const cardIdsThisStrike=_cardIdsThisStrike||[]
      const cardsThisStrike=cardIdsThisStrike.map(id=>{
        const isEcho=typeof id==='string'&&id.startsWith('_echo:')
        const realId=isEcho?id.slice(6):id
        const card=ALL_CARDS.find(c=>c.id===realId)
        return card?{...card,_isEchoplexRetrigger:isEcho}:null
      }).filter(Boolean)
      const cardsRealPlays=cardsThisStrike.filter(c=>!c._isEchoplexRetrigger)
      const corruptCardsCount=cardsThisStrike.filter(c=>c.type==='CORRUPT').length
      const riffCardsCount=cardsThisStrike.filter(c=>c.type==='RIFF').length
      const playedAnyRiff=riffCardsCount>0
      // Same-type purity check: every REAL play (excl Echoplex retriggers) is the same type.
      const realCardsForPurity=cardsRealPlays
      const allSameType=realCardsForPurity.length>=3&&realCardsForPurity.every(c=>c.type===realCardsForPurity[0].type)
      // Same-role count: max number of band members sharing the same role.
      const roleCounts={}
      stage.forEach(m=>{if(m&&m.role){roleCounts[m.role]=(roleCounts[m.role]||0)+1}})
      const maxSameRole=Math.max(0,...Object.values(roleCounts))
      // Alive non-stoned members
      const aliveNonStoned=stage.filter(m=>m&&!m.tooStoned&&m.hp>0).length
      // Discard tracking — discardsThisFightRef counts discards this fight.
      const discardsThisFight=(discardsThisFightRef&&discardsThisFightRef.current)||0
      const discardsThisStrike=_discardsThisStrike // snapshot taken before the per-strike reset
      // Lucifer on stage check
      const luciferOnStage=stage.some(m=>m&&(m.id==='lucifer'||m.name==='Lucifer'))
      // Drummer DOUBLE TIME rolled this fight (uses existing dblRoll state)
      const drummerDT=stage.some(m=>m&&!m.tooStoned&&m.role==='Drummer')
      // First card played type (for setlist artifact)
      const firstCardType=cardsThisStrike.length>0?cardsThisStrike[0].type:null
      // All members healthy (≥50% HP) for Gaffer Tape
      const allMembersHealthy=stage.filter(m=>m).every(m=>m.hp>=Math.ceil(m.maxHp/2))
      // Last member standing
      const aliveCount=stage.filter(m=>m&&m.hp>0).length
      // Early circle check (1-3 = early, indices 0-2)
      const earlyCircleCheck=Math.floor((fightIndex||0)/3)<3
      // Highest member ATK on stage (for Tongue of the Devourer mythic)
      const highestStageAtk=Math.max(0,...stage.filter(m=>m).map(m=>getEffectiveAtk(m,_atkCtx)))

      for(const art of activeArtifacts){
        if(!art.multTrigger)continue
        let fires=0
        // EXISTING TRIGGERS (kept)
        if(art.multTrigger==='cards3'&&cardsPlayedCount>=4)fires=1
        if(art.multTrigger==='cards5'&&cardsPlayedCount>=6)fires=1
        if(art.multTrigger==='corrupt50'&&corruption>=60)fires=1
        if(art.multTrigger==='corrupt80'&&corruption>=80)fires=1
        if(art.multTrigger==='perChain')fires=chainsFired
        if(art.multTrigger==='perStoned')fires=stonedCount
        if(art.multTrigger==='perDupe')fires=handDupes
        // ── NEW COMMON TRIGGERS ──
        if(art.multTrigger==='alwaysOn')fires=1
        if(art.multTrigger==='playedRiff'&&playedAnyRiff)fires=1
        if(art.multTrigger==='anyStoned'&&stonedCount>0)fires=1
        if(art.multTrigger==='perAliveMember')fires=aliveNonStoned
        if(art.multTrigger==='noRiff'&&!playedAnyRiff&&cardsPlayedCount>0)fires=1
        if(art.multTrigger==='firstCardEmber'&&firstCardType==='EMBER')fires=1
        if(art.multTrigger==='allHealthy'&&allMembersHealthy)fires=1
        if(art.multTrigger==='embers5'&&embers>=5)fires=1
        if(art.multTrigger==='discardedFight'&&discardsThisFight>=1)fires=1
        if(art.multTrigger==='discardedStrike'&&discardsThisStrike>=1)fires=1
        if(art.multTrigger==='perDupePlayed'){const _s={};let _d=0;(cardsRealPlays||[]).forEach(c=>{_s[c.id]=(_s[c.id]||0)+1;if(_s[c.id]>1)_d++});fires=_d}
        if(art.multTrigger==='earlyCircle'&&earlyCircleCheck)fires=1
        // ── NEW UNCOMMON TRIGGERS ──
        if(art.multTrigger==='perCorruptCard')fires=corruptCardsCount
        if(art.multTrigger==='perSameRole')fires=Math.max(0,maxSameRole)
        if(art.multTrigger==='cards2exact'&&cardsRealPlays.length===2)fires=1
        if(art.multTrigger==='chains3'&&chainsFired>=3)fires=1
        if(art.multTrigger==='perDiscardStrike')fires=discardsThisStrike
        if(art.multTrigger==='doubleTimeRolled'&&drummerDT)fires=1
        if(art.multTrigger==='lastMemberStanding'&&aliveCount===1)fires=1
        // ── NEW RARE TRIGGERS ──
        if(art.multTrigger==='allSameType'&&allSameType)fires=1
        if(art.multTrigger==='perOtherArtifact')fires=Math.max(0,activeArtifacts.length-1)
        if(art.multTrigger==='luciferOnStage'&&luciferOnStage)fires=1
        if(art.multTrigger==='corrupt100exact'&&corruption===100)fires=1
        if(art.multTrigger==='goatStackOther'){
          // Black Goat: ×2.0 always × ×1.3 per OTHER artifact
          // Implemented as: base ×2.0 fires once + ×1.3 per other artifact
          const others=Math.max(0,activeArtifacts.length-1)
          // We'll handle this as TWO mult events for clarity in cascade
          const baseAmount=art.mult||2.0
          const perOtherMult=Math.pow(1.3,others)
          const totalMult=baseAmount*perOtherMult
          artifactMult*=totalMult
          _cascadeMults.push({mult:baseAmount,label:art.name+' (base)',emoji:art.emoji,color:'#aa44cc'})
          if(others>0){_cascadeMults.push({mult:perOtherMult,label:art.name+' (×1.3 per other ×'+others+')',emoji:art.emoji,color:'#aa44cc'})}
          addLog('⛧ '+art.emoji+' '+art.name+' TRIGGERS! ×'+totalMult.toFixed(2));setTriggeredArtifactId(art.id);setTimeout(()=>setTriggeredArtifactId(null),600)
          continue
        }
        // ── NEW MYTHIC TRIGGERS ──
        if(art.multTrigger==='corruptedClean'&&corruption===100&&stonedCount===0)fires=1
        if(art.multTrigger==='tongueDamage'){
          // Each card you play deals damage = highest member ATK. Flat addition —
          // accumulated here and ADDED to finalDmg after the multiplier chain, with its
          // own additive breakdown line. Never enters artifactMult or _totalMult.
          const tongueDmg=highestStageAtk*cardsPlayedCount
          if(tongueDmg>0){
            _flatArtifactDmg+=tongueDmg
            _flatArtifactLabel=art.name;_flatArtifactEmoji=art.emoji||'👅'
            addLog('👅 '+art.name+' DEVOURS! +'+tongueDmg+' flat damage!');setTriggeredArtifactId(art.id);setTimeout(()=>setTriggeredArtifactId(null),600)
          }
          continue
        }
        if(art.multTrigger==='sigilOpener'){
          // First Strike of every fight: card+chain mults auto-peaked + auto-trip if no other trip.
          // Aug 4 2026 (phase 3): same off-by-one as Wailing Guitar — strikesLeft is the
          // PRE-decrement closure value, so strike 1 == fightMaxStrikes (preview agrees).
          const isFirstStrikeOfFight=(strikesLeft===fightMaxStrikes)
          if(isFirstStrikeOfFight){
            const peakMult=4.31  // 1.05^6 * 1.78^2 simulated peak
            artifactMult*=peakMult
            _cascadeMults.push({mult:peakMult,label:art.name+' (auto-peaked)',emoji:art.emoji,color:'#ffaa00'})
            // Auto-trip if no other trip active
            if(tripMult<=1){
              artifactMult*=2
              _cascadeMults.push({mult:2.0,label:art.name+' (auto-trip)',emoji:art.emoji,color:'#ff44ff'})
            }
            addLog('𓂀 '+art.name+' awakens! Peak roll on opening strike!');setTriggeredArtifactId(art.id);setTimeout(()=>setTriggeredArtifactId(null),600)
          }
          continue
        }
        // GENERAL FIRES HANDLER (after all custom multi-event triggers handled above)
        if(fires>0){
          const m=Math.pow(art.mult,fires)
          artifactMult*=m
          _cascadeMults.push({mult:m,label:art.name+(fires>1?' ×'+fires:''),emoji:art.emoji,color:'#e8a820'})
          addLog('⛧ '+art.emoji+' '+art.name+' TRIGGERS! ×'+m.toFixed(2));setTriggeredArtifactId(art.id);setTimeout(()=>setTriggeredArtifactId(null),600)
        }
      }
      // BOSS LOOT MULTIPLIER TRIGGERS
      for(const lootId of collectedLoot){
        const loot=BOSS_LOOT.find(l=>l&&l.id===lootId)
        if(!loot||!loot.multTrigger||!loot.mult)continue
        let fires=0
        // Aug 4 2026 (phase 3): strikesLeft is the PRE-decrement closure value, so this
        // counted the strike currently being SPENT — one extra Math.pow(mult,1) on every
        // strike of every fight, and it still fired on the last strike (0 remaining).
        if(loot.multTrigger==='perStrikesLeft')fires=Math.max(0,strikesLeft-1)
        if(loot.multTrigger==='firstCardFree'&&cardsPlayedCount>=1)fires=1
        if(loot.multTrigger==='alive4'&&actives.length>=4)fires=1
        if(loot.multTrigger==='perStash20')fires=Math.floor(stash/20)
        if(loot.multTrigger==='memberAtk20'&&actives.some(m=>m.atk>=20))fires=1
        if(loot.multTrigger==='perCorrThreshold')fires=[25,50,75,100].filter(t=>corruption>=t).length
        if(loot.multTrigger==='cards1'&&cardsPlayedCount===1)fires=1
        if(loot.multTrigger==='perUniqueKeyword')fires=new Set(actives.map(m=>m.keyword)).size
        if(fires>0){const m=Math.pow(loot.mult,fires);artifactMult*=m;_cascadeMults.push({mult:m,label:loot.name+(fires>1?' ×'+fires:''),emoji:loot.emoji,color:'#44ddff'});addLog('💎 '+loot.emoji+' '+loot.name+' ×'+m.toFixed(2)+'!')}
      }
      const finalDmg=Math.round(dmg*tripMult*currentMult*corruptionMult*artifactMult)+_flatArtifactDmg
      // Compute the TRUE total multiplier = product of every cascade mult.
      // This is what climbs in the visible counter during the cascade.
      const _totalMult=_cascadeMults.reduce((p,e)=>p*e.mult,1.0)
      // Push every cascade mult into the breakdown panel as a line. Each line
      // carries the mult value so the cascade can climb the visible mult counter.
      let _runningDmg=dmg
      for(const ev of _cascadeMults){
        _runningDmg=Math.round(_runningDmg*ev.mult)
        _breakdownLines.push({type:'multiply',label:ev.emoji+' '+ev.label+' ×'+ev.mult.toFixed(2),label2:'= '+_runningDmg.toLocaleString(),runningAfter:_runningDmg,color:ev.color,mult:ev.mult})
      }
      // Flat relic damage lands AFTER the multiplier chain, as a real additive line.
      if(_flatArtifactDmg>0){
        _runningDmg=_runningDmg+_flatArtifactDmg
        _breakdownLines.push({type:'add',label:_flatArtifactLabel||'Flat relic damage',emoji:_flatArtifactEmoji||'👅',value:_flatArtifactDmg,runningAfter:_runningDmg,color:'#ff0000'})
      }
      // ── SHREDDER SIGNATURE: apply echo damage from chains queued PREVIOUS strike ──
      // Echo = 50% of this strike's final damage × pending chain count.
      // Chains queued THIS strike (combosFiredRef populated in playCard) won't echo
      // until the strike AFTER next, because shredderEchoesPendingRef is read here
      // BEFORE we add this strike's chains to it (additions happen at end of strike).
      let _shredderEchoDmg=0
      if(shredderEchoesPendingRef.current>0){
        _shredderEchoDmg=Math.round(finalDmg*0.33*shredderEchoesPendingRef.current)
        _breakdownLines.push({type:'multiply',label:'⚡ Shredder Echo ×'+shredderEchoesPendingRef.current+' (33%)',label2:'+ '+_shredderEchoDmg.toLocaleString(),runningAfter:finalDmg+_shredderEchoDmg,color:'#ff8800'})
        addLog('⚡ Shredder Echo: '+shredderEchoesPendingRef.current+' chain(s) replay for '+_shredderEchoDmg+' bonus damage!')
        shredderEchoesPendingRef.current=0
      }
      const _totalStrikeDmg=finalDmg+_shredderEchoDmg
      // v0.8 FOLK MAGIC aura — adjacent members heal 1 per folk neighbor after each strike
      setStage(p=>{const hm=_folkAuraHealMap(p);return hm?p.map((m,i)=>m&&hm[i]&&!m.cursed?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+hm[i])}):m):p})
      // Aug 4 2026 (phase 3): overkill was ALWAYS 0 — newEHp is clamped at 0 by
      // Math.max BEFORE Math.abs() reads it, so _ok was |0|. Keep the unclamped value.
      const _rawEHp=startHp-_totalStrikeDmg
      const newEHp=Math.max(0,_rawEHp)
      if(_rawEHp<0)updStat('overkillDmg',Math.abs(_rawEHp))
      // ── HP DROP DEFERRED TO CASCADE SLAM (Option B / Balatro-style) ──
      // If the strike has multiple multipliers, hand HP-drop to the breakdown's
      // onSlam callback so HP slams down WITH the final number.
      // CRITICAL EXCEPTION: lethal strikes apply immediately, otherwise the
      // Lucifer phase 2 transition + victory triggers race with the cascade.
      //
      // Aug 4 2026 (phase 3): this used to be an ABSOLUTE write —
      // setEnemyHp(prev=>Math.min(prev,newEHp)) — with newEHp derived from a startHp
      // captured before the strike animation began. Anything else that damaged the boss
      // inside that window was silently ERASED (venom DOT lost its tick every single
      // strike), and against Lucifer it slammed a freshly-spawned phase 2 from 333,333
      // straight back to 0. It now applies a DELTA: the total strike damage minus what
      // the per-member impacts already took off. A delta is not idempotent, so the slam
      // and the safety net share an explicit once-only guard.
      const _dropDelta=Math.max(0,_totalStrikeDmg-_impactApplied)
      let _dropDone=false
      const _applyHpDrop=()=>{
        if(_dropDone)return
        if(_stale('cascade HP drop'))return
        _dropDone=true
        const _after=Math.max(0,enemyHpRef.current-_dropDelta)
        enemyHpRef.current=_after // keep the ref exact; useEffect sync lags a render
        setEnemyHp(prev=>Math.max(0,prev-_dropDelta))
        if(enemy.passiveId==='luciferBoss'){
          // luciferPhase from the render closure is a full strike stale here (this can
          // run seconds later, from the breakdown's onSlam). Read the live ref.
          const atkGain=luciferPhaseRef.current===1?1:2
          const phaseTotalDmg=Math.max(0,scaledMaxHp-_after)
          const _rage=Math.floor(Math.max(0,phaseTotalDmg)/20)*atkGain
          setBossRageAtk(_rage);bossRageAtkRef.current=_rage
        }
      }
      // Lethal if the strike total kills outright, or if the live HP left after the
      // impacts can't survive the remaining delta.
      const _lethalStrike=newEHp<=0||(enemyHpRef.current-_dropDelta)<=0
      // ── CASCADE TIMING (Aug 4 2026, phase 3) ───────────────────────────────
      // The old numbers were two unrelated guesses: the safety net at lines*720+900 and
      // the breakdown unmount (_bossDelay) at lines*140+2300. The net grew FIVE TIMES
      // faster than the unmount, so on any multi-multiplier strike the component was
      // torn down mid-cascade, onSlam never ran, and HP finally dropped seconds after
      // the boss had already counter-attacked and the player had regained control.
      // Both are now derived from cascadeSlamAt(), the same function DamageBreakdown
      // uses to schedule its own slam, so the ordering is guaranteed at BOTH speeds:
      //   slam -> (+250ms) safety net -> (+1400ms normal / +700ms fast) boss attack.
      const _slamAt=cascadeSlamAt(_breakdownLines,speedFast)
      if(_breakdownLines.length>1&&!_lethalStrike){
        // Cascade drives HP drop — boss HP stays put until SLAM
        setDmgBreakdown({key:++breakdownSeqRef.current,lines:_breakdownLines,total:_totalStrikeDmg,_pendingHpDrop:_applyHpDrop,cascadeMults:_cascadeMults,totalMult:_totalMult,_fast:speedFast})
        // SLAM-RACE SAFETY NET: if the component never got to call onSlam (unmounted,
        // remounted, tab throttled), apply the drop ourselves a beat after the slam.
        _reg(setTimeout(_applyHpDrop,_slamAt+250))
      } else {
        // Lethal OR no cascade: apply immediately
        _applyHpDrop()
        if(_breakdownLines.length>1)setDmgBreakdown({key:++breakdownSeqRef.current,lines:_breakdownLines,total:_totalStrikeDmg,cascadeMults:_cascadeMults,totalMult:_totalMult,_fast:speedFast})
      }
      addFloat(_totalStrikeDmg.toLocaleString(),bc.x,bc.y-60,'#ff2200',true)
      if(folkMagicFired){
        setEmbers(maxEmbers)
        addFloat('🪈 FOLK MAGIC! Full Embers!',window.innerWidth/2,window.innerHeight*0.35,'#44ddaa',true)
        addLog('🪈 Folk Magic proc! All Embers refunded.')
      }
      // Aug 4 2026 (phase 3): these excluded _shredderEchoDmg, which IS dealt — a
      // Shredder deck's echo damage never reached the run score and the visible float
      // (_totalStrikeDmg) disagreed with the recorded stat. Record what actually landed.
      updStat('totalDamage',_totalStrikeDmg);updStat('highestStrike',_totalStrikeDmg,true);if(_totalStrikeDmg>=500){playSfx('big_hit');triggerShake(8,250)}

      // ── VOLUME KNOB / COMPRESSOR: 4+ cards this strike → next-strike bonuses ──
      // Same emptied-ref bug as the artifact block above: Volume Knob and
      // Compressor Pedal ("4+ cards this strike") could never trigger.
      const _cardsThisCount=(_cardIdsThisStrike||[]).filter(id=>!String(id).startsWith('_echo:')).length
      if(_cardsThisCount>=4){
        if(activePassives.some(p=>p.id==='volumeknob')){
          setPendingDraw(p=>p+1)
          addLog('🔆 Volume Knob! +1 card next strike.')
        }
        if(activePassives.some(p=>p.id==='compressorpedal')){
          setPendingDraw(p=>p+1)
          setEmbers(p=>Math.min(maxEmbers,p+1))
          addLog('📊 Compressor! +1 card + 1 ember next strike.')
        }
      }

      // Sustain Pedal: temp ATK buffs persist for 1 extra strike
      const hasSustain=activePassives.some(p=>p.id==='sustainpedal')
      setStage(function(p){return p.map(function(m){
        if(!m)return null
        var nm=Object.assign({},m)
        if(nm.encoreReady)nm=Object.assign({},nm,{encoreReady:false})
        if(nm.tempBuff&&nm._origAtk!==undefined){
          if(hasSustain&&!nm._sustainUsed){
            // First strike with buff: mark sustain used, keep buff
            nm=Object.assign({},nm,{_sustainUsed:true})
          } else {
            // Normal expiry (or sustain already used)
            nm=Object.assign({},nm,{atk:nm._origAtk,_origAtk:undefined,tempBuff:false,_sustainUsed:undefined})
          }
        }
        return nm
      })})

      // ── MYTHIC UNLOCK CHECKS — fire after stage state updates ──
      setTimeout(()=>{
        // Witch's Sabbath: across the run, every member must have been
        // Too Stoned at some point. The "haze consumed them all" — and you
        // bring them back. Tracked via fightLossMembersRef union per-fight
        // accumulating into runStonedMembersRef.
        stage.forEach(function(m){
          if(m&&m.tooStoned&&m.uid){runStonedMembersRef.current.add(m.uid)}
        })
      },0)

      // ── VICTORY ROUTING ────────────────────────────────────────────────────
      // Aug 4 2026 (phase 3): the damage pipeline is done from here on, so release the
      // hold on the 600ms victory safety net. `_kill` uses the LIVE HP (impacts + the
      // delta just applied) rather than the pre-strike projection, and the Lucifer phase
      // is read from the ref — the render closure's luciferPhase is stale here, which is
      // what produced the DOUBLE phase-2 entry (double cinematic, double band revive).
      _endPipeline()
      const _kill=_lethalStrike||enemyHpRef.current<=0
      if(_kill){
        // ── MYTHIC UNLOCKS at fight victory ──
        // Inverted Cross: defeating Lucifer (final phase 2 kill)
        if(enemy&&enemy.id==='lucifer'&&luciferPhaseRef.current===2){
          fireMythicUnlock('invertedCross')
          // The Conduit: defeated Lucifer in ≤3 strikes total (across both phases)
          if(luciferStrikesUsedRef.current<=3){fireMythicUnlock('theConduit')}
        }
        // Tongue of the Devourer: beat the C3 boss without losing any members.
        // Enemy ID is 'gluttony_boss' (not 'devourer' — that was the wrong ID).
        if(enemy&&enemy.id==='gluttony_boss'){
          if(fightLossMembersRef.current.size===0){fireMythicUnlock('tongueOfDevourer')}
        }
        // Witch's Sabbath: at Lucifer victory, check if every member that was
        // ever on stage went Too Stoned at some point in the run AND there are
        // ≥3 such members (so it's a real "haze" not just one bad fight).
        if(enemy&&enemy.id==='lucifer'&&luciferPhaseRef.current===2){
          if(runStonedMembersRef.current.size>=3&&runStonedMembersRef.current.size>=soloMembersUsedRef.current.size*0.75){
            fireMythicUnlock('witchsSabbath')
          }
        }
      }

      // Aug 3 2026: never award a win off a zero/blank starting HP — that is the
      // signature of a strike landing mid-transition, not of a real kill.
      if(_kill&&startHp<=0){
        try{console.log('[VICTORY-BLOCKED] strike resolved with startHp='+startHp+' (boss mid-transition) — not a kill')}catch(e){}
        setAnimPhase('idle')
        return
      }
      if(_kill){
        // LUCIFER PHASE TRANSITION: Phase 1 → Phase 2.
        // Aug 1 2026: body extracted to enterLuciferPhase2 so the ~15 direct-damage
        // kill paths and the delayed victory safety net share ONE implementation
        // (they used to skip this entirely and end the run at the halfway point).
        if(enemy.passiveId==='luciferBoss'&&luciferPhaseRef.current===1){
          if(luciferPhase2Ref.current)luciferPhase2Ref.current()
          return
        }
        if(triggerVictoryRef.current)triggerVictoryRef.current();return
      }

      // Boss counter-attack starts a beat after the cascade slam — see the CASCADE
      // TIMING note above. Non-cascade strikes keep the old flat 1.8s.
      const _bossDelay=(_breakdownLines.length>1)?(_slamAt+(speedFast?700:1400)):(800+1000)
      if(_breakdownLines.length>1){_reg(setTimeout(()=>{try{playSfx('big_hit')}catch(e){}},_slamAt))}
      _reg(setTimeout(function(){
        if(_stale('boss counter-attack chain'))return
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
        const luciferAoE=enemy.passiveId==='luciferBoss'&&luciferPhaseRef.current===2 // ref: this runs inside a timer (rule 3)
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
          _reg(setTimeout(function(){
          if(_stale('boss counter-attack damage'))return
          const variance=0
          // Apply enemy passive scaling effects before damage
        const stakeBaseDmg=enemy.baseDmg+activeStake.dmgAdd
        // Aug 4 2026 (phase 3): bossRageAtk/bossDebuff were read from the RENDER closure
        // inside this timer, so both lagged exactly one strike — a DEBUFF vocalist logged
        // "-2 damage" and the boss immediately hit for the full undebuffed amount, and
        // Lucifer's rage never included the strike that had just landed. Refs (rule 3).
        let scaledBaseDmg=Math.max(1,stakeBaseDmg-(chosenPacts.includes('stone_wall')?1:0))+(enemy.passiveId&&enemy.passiveId.startsWith('damageScaleAtk')?bossRageAtkRef.current:0)
        // v0.8 ANCHOR aura — adjacent ANCHOR members shield the target (-1 each, floor 1)
        scaledBaseDmg=Math.max(1,scaledBaseDmg-_anchorAuraRed(stage,target.uid))
        // selfbuff: boss gains +1/+2 dmg per Strike
        if(enemy.passiveId==='selfbuff'){scaledBaseDmg=stakeBaseDmg+strikesLeft}
        else if(enemy.passiveId==='selfbuff2'){scaledBaseDmg=stakeBaseDmg+(activeStake.maxStrikes-strikesLeft)*2}
        // C5 ANGER REWORKS — replace rageScale1/2 with mechanic-distinct bosses
        // Wrathful: SELF-IMMOLATING RAGE — +50% dmg per stack (cumulative), loses 8% maxHp/strike
        else if(enemy.passiveId==='selfImmolate'){
          scaledBaseDmg=Math.floor(stakeBaseDmg*(1+0.5*immolateStacks))
          // Self-damage: 8% of maxHp (use scaledMaxHp for the actual scaled fight HP)
          const _selfDmg=Math.max(1,Math.floor((scaledMaxHp||enemy.maxHp)*0.08))
          setEnemyHp(ehp=>{
            const nh=Math.max(0,ehp-_selfDmg)
            if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500)
            return nh
          })
          setImmolateStacks(s=>s+1)
          addLog('🔥 The Wrathful immolates! -'+_selfDmg+' self-damage. Rage stack ×'+(immolateStacks+1)+'.')
        }
        // Berserker: BLOODLUST — double damage when below 50% HP
        else if(enemy.passiveId==='bloodlust'){
          scaledBaseDmg=stakeBaseDmg
          // Aug 4 2026 (phase 3): read the live HP ref — the stale enemyHp closure made
          // the Berserker's <50% check lag a full strike.
          if(enemyHpRef.current<(scaledMaxHp||enemy.maxHp)*0.5){
            scaledBaseDmg=stakeBaseDmg*2
            addLog('⚔️ BLOODLUST! Berserker strikes twice as hard!')
            addFloat('BLOODLUST!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#cc0000',true)
          }
        }
        // Warlord: COMMANDS — random debuff each strike (-1 ATK all / -1 ember / discard 1)
        else if(enemy.passiveId==='commands'){
          scaledBaseDmg=stakeBaseDmg
          const _cmd=Math.floor(Math.random()*3)
          if(_cmd===0){
            // Aug 4 2026 (phase 3): tempBuff without _origAtk never expires (the expiry
            // block requires both), so the Warlord's -1 was a PERMANENT stat loss applied
            // up to 4x per fight. Stamp _origAtk so it wears off after the strike.
            setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:Math.max(0,m.atk-1),tempBuff:true,_origAtk:m._origAtk!==undefined?m._origAtk:m.atk}):m))
            addLog('💢 Warlord commands: ALL members lose 1 ATK!')
            addFloat('-1 ATK ALL',getCenter(bossRef).x,getCenter(bossRef).y-80,'#cc1144',true)
          } else if(_cmd===1){
            setEmbers(e=>Math.max(0,e-1))
            addLog('💢 Warlord commands: lose 1 ember!')
            addFloat('-1 EMBER',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff8800',true)
          } else {
            setHand(h=>{if(h.length===0)return h;const di=Math.floor(Math.random()*h.length);const dropped=h[di];setDiscardPile(d=>[...d,dropped]);const nh=[...h];nh.splice(di,1);return nh})
            addLog('💢 Warlord commands: 1 hand card discarded!')
            addFloat('CARD LOST',getCenter(bossRef).x,getCenter(bossRef).y-80,'#cc1144',true)
          }
        }
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
          if(luciferPhaseRef.current===1){
            // Frozen Wrath: frostbite 3 to all + damageScale +1
            scaledBaseDmg=stakeBaseDmg+bossRageAtkRef.current
            playSfx('boss_attack');triggerShake(10,350);setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:Math.max(0,m.hp-3)}):m))
            addLog('🧊 Frostbite! All members take 3 cold damage.')
          } else if(luciferPhaseRef.current===2){
            // Infernal: AoE + damageScale +2
            scaledBaseDmg=stakeBaseDmg+bossRageAtkRef.current
          }
        }
        // Aug 4 2026 (phase 3): there used to be a trailing `else{scaledBaseDmg=stakeBaseDmg}`
        // here. It DISCARDED the Stone Wall pact reduction and the ANCHOR aura reduction
        // computed above — only the corruptPlayer*/stashSteal* branches (which don't touch
        // scaledBaseDmg) preserved them — so both mitigations did nothing against 15 of the
        // 27 bosses, while the attack telegraph DID subtract stone_wall and showed the
        // lower number. Bosses with no damage-modifying passive now simply keep the
        // mitigated value computed at the top.
        // targetHighestHp2/3 were matched for TARGETING only and their damage multipliers
        // were never applied anywhere: The Hunter's "+50% damage to them" and The
        // Executioner's "deals double damage" were both completely inert.
        if(enemy.passiveId==='targetHighestHp2')scaledBaseDmg=Math.max(1,Math.round(scaledBaseDmg*1.5))
        else if(enemy.passiveId==='targetHighestHp3')scaledBaseDmg=Math.max(1,scaledBaseDmg*2)
        // ── OVERTIME ENRAGE (Jul 31 2026, JV) ── past the strike limit the boss's
        // damage doubles per overtime strike: x2, x4, x8... Fight ends only in death.
        {/* Aug 1 2026 OFF-BY-ONE: strikesLeft here is the PRE-decrement closure value (the
           functional setStrikesLeft(p=>p-1) above does not update it), so the first
           overtime strike computed _ot=0 and dealt NO enrage at all. The strike-counter
           display already used 1-strikesLeft, so UI and damage disagreed by one strike. */}
        {const _ot=Math.max(0,1-strikesLeft);if(_ot>0){scaledBaseDmg=scaledBaseDmg*Math.pow(2,_ot);addLog('🔥 OVERTIME x'+Math.pow(2,_ot)+' — the crowd turns on you!')}}
        // v0.7.1: Possession bonus removed — boss damage no longer scales with player corruption.
        // The cost lives in Hangover (next fight, next shop), not in this fight.
        // v0.7.2: bossSkipStrikes — DMT BREAKTHROUGH / K-HOLE trips can fully skip
        // an incoming attack. Decrements the counter at attack time so the boss
        // can resume hitting once the trip's window expires.
        let _bossSkippedThisStrike=false
        if(bossSkipStrikesRef.current>0){
          _bossSkippedThisStrike=true
          bossSkipStrikesRef.current=Math.max(0,bossSkipStrikesRef.current-1)
          setBossSkipStrikes(p=>Math.max(0,p-1))
        }
        const actualDmg=(_bossSkippedThisStrike||fightTripBuff==='ASTRAL PROJECTION')?0:Math.max(1,Math.round(scaledBaseDmg)-bossDebuffRef.current)
        if(_bossSkippedThisStrike){
          addFloat('FROZEN',getCenter(bossRef).x,getCenter(bossRef).y-60,'#88ddff',true)
          addLog('❄ Boss frozen — attack skipped.')
        }
          const ti=targetSlotIdx
          if(luciferAoE&&actualDmg>0){
            // Phase 2: AoE — split damage across ALL alive members
            const splitDmg=Math.ceil(actualDmg/activeM.length)
            addLog('😈 Satan strikes ALL members for '+splitDmg+' each! ('+actualDmg+' total)')
            // ── ANCHOR (4d) — pre-compute save decisions BEFORE setStage ──
            // _tryAnchorSave mutates anchorSavesUsedRef, so we must call it
            // outside the setStage updater (StrictMode double-fires updaters).
            const _aoeAnchorSaved={}
            for(let ai=0;ai<stage.length;ai++){
              const _m=stage[ai]
              if(!_m||_m.tooStoned)continue
              const _newHp=_m.hp-Math.max(1,splitDmg-_anchorAuraRed(stage,_m.uid))
              if(_newHp<=0&&!_m.stoneShield){
                _aoeAnchorSaved[ai]=_tryAnchorSave(_m)
              }
            }
            setStage(function(prev){
              const ns2=[...prev]
              for(let ai=0;ai<ns2.length;ai++){
                if(!ns2[ai]||ns2[ai].tooStoned)continue
                const newHp=ns2[ai].hp-Math.max(1,splitDmg-_anchorAuraRed(stage,ns2[ai].uid))
                if(newHp<=0&&!ns2[ai].stoneShield){
                  if(_aoeAnchorSaved[ai]){
                    addLog('⚓ ANCHOR! '+ns2[ai].name+' barely survives the lethal blow!')
                    addFloat('⚓ SAVED!',getCenter(stageRefs.current[ai]).x,getCenter(stageRefs.current[ai]).y-80,'#33dd33',true)
                    ns2[ai]=Object.assign({},ns2[ai],{hp:1})
                  } else {
                    ns2[ai]=Object.assign({},ns2[ai],{hp:0,tooStoned:true,bloodOath:false});updStat('tooStonedCount',1);playSfx('member_down');triggerShake(12,400)
                    // Mythic unlock tracking: member lost during fight
                    if(ns2[ai]&&ns2[ai].uid)fightLossMembersRef.current.add(ns2[ai].uid)
                    if(activeArtifacts.some(a=>a.id==='a6')){setEnemyHp(ehp=>{const nh=Math.max(0,ehp-8);if(nh<=0)setTimeout(()=>{if(triggerVictoryRef.current)triggerVictoryRef.current()},500);return nh});addLog('🕯 Black Candle! 8 damage!')}
                  }
                }
                else if(newHp<=0&&ns2[ai].stoneShield){const nsh=typeof ns2[ai].stoneShield==='number'?ns2[ai].stoneShield-1:0;ns2[ai]=Object.assign({},ns2[ai],{hp:1,stoneShield:nsh>0?nsh:false});setClutchFlash({text:'CLUTCH!',color:'#ffd700'});setTimeout(()=>setClutchFlash(null),1500)}
                else{ns2[ai]=Object.assign({},ns2[ai],{hp:Math.max(0,newHp)})}
              }
              const allStoned=ns2.filter(m=>m).every(m=>m.tooStoned)
              if(allStoned){discover('allstoned','TOTAL WIPEOUT');if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins this round. But you already conquered Hell.')}else if(tutorialFight>0){setShowTutorialMsg('You got stoned! No worries, try that one again.');setTimeout(()=>startTutorialFight(tutorialFight),2000);return}else{setDeathCause('stoned');playSfx('defeat')};setTimeout(()=>{clearSave();setGameState('end')},800)}
              return ns2
            })
            setDamageFlash(true);triggerShake(10,350);setTimeout(()=>setDamageFlash(false),400)
          } else {
          // ── ANCHOR (4d) — pre-compute save decision BEFORE setStage ──
          let _stdAnchorSaved=false
          if(stage[ti]&&!stage[ti].tooStoned&&!(stage[ti].bloodOath&&actualDmg>0)){
            const _newHpPre=stage[ti].hp-actualDmg
            if(_newHpPre<=0&&!stage[ti].stoneShield){
              _stdAnchorSaved=_tryAnchorSave(stage[ti])
            }
          }
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
                if(_stdAnchorSaved){
                  addLog('⚓ ANCHOR! '+ns2[ti].name+' barely survives the lethal blow!')
                  addFloat('⚓ SAVED!',targetPos.x,targetPos.y-80,'#33dd33',true)
                  ns2[ti]=Object.assign({},ns2[ti],{hp:1})
                } else {
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
                } // end anchor save else
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
            if(allStoned){discover('allstoned','TOTAL WIPEOUT');if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins this round. But you already conquered Hell.')}else{setDeathCause('stoned');playSfx('defeat')};const _bc=Math.floor(fightIndex/3)+1;if(_bc>bestRunCircle){localStorage.setItem('vst_best_circle',_bc.toString())};recordLegacyRun(stage,stats,false,Math.floor(fightIndex/3)+1);setTimeout(function(){clearSave();setGameState('end')},800)}
            return ns2
          })
          if(!_stdAnchorSaved&&stage[stage.indexOf(target)]&&!stage[stage.indexOf(target)].tooStoned&&(stage[stage.indexOf(target)].hp-actualDmg)<=0&&!stage[stage.indexOf(target)].stoneShield)addLog('💨 '+target.name+' is TOO STONED!')
          setDamageFlash(true);triggerShake(10,350);setTimeout(function(){setDamageFlash(false)},400)
          addLog('👁 '+enemy.name+' hits '+target.name+' for '+actualDmg)
          } // end single-target else
          },speedFast?600:1200)) // boss animation delay
          // ── Aug 4 2026 (phase 3) BOSS-ATTACK / CONTROL ORDERING ──────────────
          // This block ends by handing control back (setAnimPhase('idle')) and it used
          // to be a flat 900ms while the boss's damage above lands at 1200ms at NORMAL
          // speed — so the player regained control 300ms BEFORE the counter-attack.
          // Clicking STRIKE immediately began strike N+1 while strike N's damage was
          // still pending, and the counter-attack's setStage then landed mid-strike on a
          // pre-buff stage closure. Fast mode (600 dmg / 900 idle) was already correct;
          // normal speed now mirrors it at damage+300 = 1500.
          _reg(setTimeout(function(){
            if(_stale('post-strike draw / refill'))return
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
            // ANCHOR +1 HP/strike adjacent regen removed in commit 4d —
            // keyword now grants per-fight lethal save via _tryAnchorSave.
            // CA3: Sabbath Crown — revive Too Stoned members at 50% HP after each Strike
            if(activeArtifacts.some(a=>a.id==='ca3')||activePassives.some(p=>p.id==='ca3')){
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
                    playSfx('defeat');setTimeout(()=>{setDeathCause('fallen');clearSave();setGameState('end')},800)
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
              const shuffleCount=enemy.passiveId==='fraudShuffle'?1:enemy.passiveId==='fraudShuffle2'?1:2
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
              if(false){ // OVERTIME (Jul 31 2026 JV): out-of-strikes no longer ends the fight.
                if(welcomeToHell==='fighting'){setDeathCause('victory');setWelcomeToHell('lost');addLog('📝 The Executive wins. But you already conquered Hell.')}else{setDeathCause('beaten');setLastKillingBlow((enemy?.name||'The boss')+' hit for '+((enemy?.baseDmg||0)+(activeStake?.dmgAdd||0))+' damage');playSfx('defeat')};
                {const _rs=calcRunScore(stats,false);saveRunHistory(stats,false,enemy,runSeed);
                // Achievement checks at game end
                if(_rs>=5000)unlockAchievement('high_score_5k')
                if(_rs>=10000)unlockAchievement('high_score_10k')
                if((totalRunsPlayed+1)>=10)unlockAchievement('ten_runs')
                const _nr=totalRunsPlayed+1;setTotalRunsPlayed(_nr);localStorage.setItem('vst_runs',_nr);if(_rs>personalBest){setPersonalBest(_rs);localStorage.setItem('vst_best',_rs)}const _nl=lifetimeScore+_rs;setLifetimeScore(_nl);localStorage.setItem('vst_lifetime',_nl);setStreakLosses(p=>p+1);setStreakWins(0);localStorage.setItem('vst_streak_wins','0');const _td=new Date().toISOString().slice(0,10);const _yd=new Date(Date.now()-86400000).toISOString().slice(0,10);const _ns=lastPlayedDate===_yd||lastPlayedDate===_td?dailyStreak+1:1;setDailyStreak(_ns);localStorage.setItem('vst_streak',_ns);setLastPlayedDate(_td);localStorage.setItem('vst_lastdate',_td)}
                setTimeout(function(){clearSave();setGameState('end')},800);
              }
              return cur;
            });
          },speedFast?900:1500))
      },_bossDelay))
    },delay+200))
  },[animPhase,strikesLeft,fightMaxStrikes,speedMode,enemyHp,stage,hand,deck,discardPile,enemy,embers,pendingEmbers,fightIndex,bossRef,stageRefs,drawUpTo,triggerVictory,bossRageAtk,bossDebuff,fightTripBuff,luciferPhase,stolenAtkPool,maxEmbers])
  // Wire the ref so handleStrike can call the latest body without stale closure
  handleStrikeBodyRef.current=handleStrikeBody

  const handleShopLeave=useCallback(()=>{
    // Welcome to Hell: after final shop, go to cutscene then fight
    if(welcomeToHell==='shopping'){
      setWelcomeToHell('cutscene')
      setGameState('playing') // needed so cutscene screen renders
      setTimeout(()=>{
        beginFightToken() // fight boundary — invalidate any in-flight strike timers
        const _fmS=activeStake.maxStrikes+(chosenPacts.includes('war_drums')?1:0);
        const hs=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0)
        // ── SHARED PER-FIGHT RESET (Aug 4 2026, phase 4) ──────────────────
        // This branch used to be a hand-rolled subset of the between-fight
        // reset missing ~35 entries, every one of which carried Lucifer's
        // state into the Executive fight: bossDebuff (a Vocalist band clamped
        // the Executive to 1 dmg/hit for the whole fight), bossSkipStrikes (a
        // DMT trip on Lucifer's last strike skipped the Executive's first two
        // attacks), anchorSavesUsedRef/survivorSavesUsedRef (lethal saves stayed
        // burned), discardsThisFightRef (discard relics fired at full stack from
        // strike 1), shredderEchoesPendingRef (free echo damage on the opener),
        // wahPedalUsedRef/octavePedalFiredRef/tabletFiredRef (three "first of
        // fight" bonuses silently never fired), fightTripBuff/activeTripEffect/
        // tripUsedThisFight (OVERMIND kept its ×3.0 floor AND no new trip could
        // be taken), the free-card trio, bonusDiscards/bonusEmbers, dblRoll
        // (DOUBLE TIME locked to Lucifer's roll), immolateStacks, luciferPhase,
        // and the six per-fight stat refs that made the victory summary report
        // LUCIFER's numbers. It is now the same call as every other fight start.
        // (triggerVictory already clears stolenAtkPool/stashStolenThisFight/
        //  corruption on the Lucifer kill; re-clearing them here is a no-op.)
        resetPerFightState({
          corruption,handTarget:hs,stage,strikes:_fmS,discards:MAX_DISCARDS,
          drumThrone:activePassives.some(p=>p.id==='drumthrone'),
        })
        setEnemy(AR_EXECUTIVE)
        setEnemyHp(AR_EXECUTIVE.maxHp);enemyHpRef.current=AR_EXECUTIVE.maxHp
        setEmbers(maxEmbers)
        const allCards=[...handRef.current,...deckRef.current,...discRef.current].sort(()=>Math.random()-.5)
        setHand(allCards.slice(0,hs));setDeck(allCards.slice(hs));setDiscardPile([])
        setStage(p=>p.map(m=>m?Object.assign({},m,{hp:m.maxHp,tooStoned:false,tempBuff:false,encoreReady:false,stoneShield:false,atk:m._origAtk!==undefined?m._origAtk:m.atk,_origAtk:undefined,cursed:false}):null))
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
    beginFightToken() // fight boundary — invalidate any in-flight strike timers
    setEnemy(nextEnemy)
    // Aug 4 2026 (phase 3) — this inlined the scaling formula and OMITTED _stakeHpF(),
    // which both getScaledMaxHp and the run-start formula include. Fight 1 was
    // stake-scaled and fights 2–27 were not, so the whole stake HP ladder did nothing
    // past the opener AND the descent map / boss preview / victory summary (all of
    // which call getScaledMaxHp) printed a number the fight never used.
    // CLAUDE.md rule 13: getScaledMaxHp is the only HP formula.
    const _sHp=getScaledMaxHp(nextEnemy);setEnemyHp(_sHp);setScaledMaxHp(_sHp);enemyHpRef.current=_sHp
    // ── SHARED PER-FIGHT RESET (Aug 4 2026, phase 4) ────────────────────
    // The ~40 lines of per-fight resets that used to be scattered through the
    // rest of this function now live in PER_FIGHT_RESETS (see RESET REGISTRY),
    // which the Welcome-to-Hell branch and startTutorialFight call too. Adding a
    // per-fight `useState` means adding ONE registry entry, not remembering
    // three call sites. Everything below this line is fight-SPECIFIC setup
    // (enemy, hangover, pacts, artifacts, loot, hand redeal) — deliberately not
    // in the registry because it varies per site.
    const _deckMaxStrikesMod=(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).maxStrikesMod||0
    const _fmStrikes=activeStake.maxStrikes+(chosenPacts.includes('war_drums')?1:0)+_deckMaxStrikesMod
    const _fmDiscards=MAX_DISCARDS+(bonusDiscards>0?bonusDiscards:0)
    const _lhs=HAND_SIZE+(chosenPacts.includes('speed_demon')?1:0)
    resetPerFightState({
      corruption,handTarget:_lhs,stage,strikes:_fmStrikes,discards:_fmDiscards,
      drumThrone:activePassives.some(p=>p.id==='drumthrone'),onLog:addLog,
    })
    // ── HANGOVER HP DEBUFF (v0.7.1) ──────────────────────────────
    // Members enter the next fight with reduced max HP based on last fight's
    // peak corruption. -⌊hangover/33⌋ per member, capped at 3. Restored on
    // boss kill (see boss-kill branch above). Applied AFTER healAfterFight so
    // we shrink both maxHp AND clamp current hp to it. The debuff is applied
    // only once at fight entry — it's carried as a stored value on each
    // member (`m.hangoverHpDebuff`) so restoration knows exactly what to undo.
    const _hangHp=Math.min(3,Math.floor((hangover||0)/33))
    if(_hangHp>0){
      setStage(p=>p.map(m=>{
        if(!m||m.tooStoned||m.keyword==='FALLEN')return m
        // If a debuff is already on the member from a prior fight (failsafe), don't double-apply.
        if(m.hangoverHpDebuff)return m
        const newMax=Math.max(1,m.maxHp-_hangHp)
        return Object.assign({},m,{maxHp:newMax,hp:Math.min(m.hp,newMax),hangoverHpDebuff:_hangHp})
      }))
      addLog('🥴 Hangover: each member -'+_hangHp+' max HP this fight.')
    }
    // ── PRE-FIGHT SPLASH — tour quote loading screen ──
    if(tutorialFight===0){
      setPreFightSplash({enemy:nextEnemy,circle:nextEnemy.circle||('Circle '+(Math.floor(nextIdx/3)+1)),quote:TOUR_QUOTES[Math.floor(Math.random()*TOUR_QUOTES.length)]})
      setTimeout(()=>setPreFightSplash(null),2200)
    }
    // (per-fight stat refs, ANCHOR tier, deck-signature refs, modifier refs and
    //  the mythic per-fight trackers all moved into PER_FIGHT_RESETS above)
    addLog('══════ FIGHT '+(nextIdx+1)+': '+nextEnemy.name+' ('+_sHp+' HP) ══════')
    // Pact: Corruption Engine — +5% corruption at fight start
    if(chosenPacts.includes('corruption_engine')&&!chosenPacts.includes('corruption_locked'))setCorruption(p=>Math.min(100,p+5))
    // CORRUPTION THRESHOLD: 25% — The Whispers (weakest takes 1 dmg)
    if(corruption>=25){
      setStage(p=>{const alive=p.filter(m=>m&&!m.tooStoned);if(alive.length===0)return p;const weakest=alive.reduce((a,b)=>a.hp<b.hp?a:b);return p.map(m=>m&&m.uid===weakest.uid?Object.assign({},m,{hp:Math.max(1,m.hp-1)}):m)})
      addLog('🔮 The Whispers... '+corruption+'% corruption gnaws at your weakest.')
    }
    // Strikes/discards/pendingDraw/bonusDiscards/bonusEmbers are applied by
    // resetPerFightState above (it received _fmStrikes/_fmDiscards). Initial
    // ember placement is left to the extraEm calculation below — don't pre-set
    // to max, or P1/Power Conditioner gains get silently capped.
    playSfx('ember_gain')
    // (the ~40-setter per-fight wipe that used to live here — including the
    //  Setlist/deck-view modals and victoryFiredRef — is now PER_FIGHT_RESETS)
    // AUTO-SAVE moved to effect-based save keyed on fightIndex (v4.1, Jul 30 2026).
    // The setTimeout save that lived here captured STALE closure state (previous
    // fight's sl/hand/stage/fightIndex) → zombie-fight saves. See effect ~line 6962.
    // BOSS LOOT effects at fight start
    if(collectedLoot.includes('love_letter'))setNextCardFree(true)
    // ── LUCIFER PHASE SETUP ─────────────────────────────────────
    // Aug 1 2026 CRITICAL FIX: was `fightIndex===26` — but fightIndex here is the
    // STALE pre-transition value (25 when entering Lucifer), so this block NEVER
    // ran. Lucifer spawned with generic HP (100000×deckScale=185,000) and
    // luciferPhase=0 (no phases, no cinematic). Bot run 00:37 Aug 1 beat the whole
    // game because of this. Must check nextIdx (the fight being entered).
    if(nextIdx===26){
      const _lheat=parseInt(localStorage.getItem('vst_heat')||'1')
      const luciferActualHp=Math.ceil(333333*(1+Math.max(0,_lheat-1)*0.15)*(encoreMode?2.0:1.0)) // phase 1 of 2 — 666,666 total at Heat 1, scales with NG+/Encore
      setEnemyHp(luciferActualHp)
      setScaledMaxHp(luciferActualHp) // display max must match — generic set above used 185,000
      setLuciferPhase(1);luciferPhaseRef.current=1
      addLog('⛧ THE DEVIL HIMSELF — 666,666 HP ACROSS TWO FORMS ⛧')
      addLog('🧊 Phase 1: Lucifer, Frozen in Cocytus — 333,333 HP')
      // Show cinematic overlay
      setLuciferCinematic({text:'666,666 HP. BRING EVERYTHING.',hp:luciferActualHp})
      setTimeout(()=>setLuciferCinematic(null),5000)
    } else {
      setLuciferPhase(0);luciferPhaseRef.current=0
    }
    // DOUBLE TIME is re-rolled by PER_FIGHT_RESETS.dblRoll (with the Drum Throne
    // re-roll folded in). This block used to roll it TWICE — once here without
    // Drum Throne, once again ~90 lines below with it.
    setStage(p=>{
      const reset=p.map(m=>m?Object.assign({},m,{tooStoned:false,hp:m.maxHp,buffCount:0,tempBuff:false,encoreReady:false,stoneShield:false,atk:m._origAtk!==undefined?m._origAtk:m.atk,_origAtk:undefined,_sustainUsed:undefined,_hrUsed:undefined,cursed:false}):null)
      return scanMentorLinks(reset)
    })
    // Redeal hand from current deck+discard
    const allCards=[...handRef.current,...deckRef.current,...discRef.current].sort(()=>Math.random()-.5)
    setHand(allCards.slice(0,_lhs))
    setDeck(allCards.slice(_lhs))
    setDiscardPile([])
    handTargetRef.current=_lhs
    addLog('⛧ Fight '+(nextIdx+1)+': '+nextEnemy.name+' awaits!')
    // ── ARTIFACT FIGHT-START EFFECTS ───────────────────────
    // A1: Vintage Guitar — lead guitarist +1 ATK
    // A2: Devil's Tuning Fork — start at 15% corruption (applied below)
    const hasDevilsFork=activeArtifacts.some(a=>a.id==='a2')
    // A3: Evil Eye — "The first card you play each Strike costs 0 Embers".
    // Arming it here only gets you the FIRST card of the FIGHT; the per-strike
    // re-arm that makes the card text true lives in the PER-STRIKE RESET inside
    // handleStrikeBody (Aug 4 2026, phase 4 — it was a 4× shortfall at Bronze).
    if(activeArtifacts.some(a=>a.id==='a3')||activePassives.some(p=>p.id==='a3')){setNextCardFree(true);nextCardFreeRef.current=true}
    // A4: Roadie's Toolbelt — random member Stonewall
    const hasToolbelt=activeArtifacts.some(a=>a.id==='a4')||activePassives.some(p=>p.id==='a4')
    // A7: Serpent's Kiss — handled via maxEmbers permanently
    // A8: Stone Tablet — handled via maxHp permanently
    // A10: Burning Stage bonus embers
    const burnBonus=pendingBurningStage?5:0 // cleared by PER_FIGHT_RESETS.pendingBurningStage
    // ── CIRCLE ARTIFACT FIGHT-START EFFECTS ──────────────────
    const hasGoat=activeArtifacts.some(a=>a.id==='ca1')     // Goat of Mendes: all +1 ATK
    // ca2 (Hellfire) and ca3 (Sabbath Crown) reclassified to pedal pool — now check activePassives
    const hasHellfire=activePassives.some(p=>p.id==='ca2')   // Hellfire Amulet: +2 embers
    const hasCrown=activePassives.some(p=>p.id==='ca3')      // Sabbath Crown: revive (handled post-strike)
    const hasWailing=activeArtifacts.some(a=>a.id==='ca4')   // Wailing Guitar: first strike x2 (handled in handleStrike)
    // ── PASSIVE FIGHT-START EFFECTS ──────────────────────────
    const hasP1=activePassives.some(p=>p.id==='p1') // +1 ember
    const hasP2=activePassives.some(p=>p.id==='p2') // +3 HP random member
    const hasP8=activePassives.some(p=>p.id==='p8') // Stonewall all
    // Reclassified passives that need fight-start handling
    const hasToolbeltP=activePassives.some(p=>p.id==='a4')  // Roadie's Toolbelt: random Stonewall
    const hasStoneTabP=activePassives.some(p=>p.id==='a8')  // Stone Tablet: +3 max HP all
    const hasSerpentKissP=activePassives.some(p=>p.id==='a7')  // Serpent's Kiss: +1 max ember
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
    // Clean Living pact: +2 ATK and +2 HP all at fight start
    if(chosenPacts.includes('clean_living')){setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{atk:m.atk+2,hp:Math.min(m.maxHp,m.hp+2)}):m));addLog('✨ Clean Living! All members +2 ATK, +2 HP.')}
    // Extra embers from passives that activate at fight start
    const hasPowerCond=activePassives.some(p=>p.id==='powerconditioner') // +1 ember
    const hasConduit=activePassives.some(p=>p.id==='theconduit') // mythic — start at MAX
    const extraEm=(hasP1?1:0)+burnBonus+(hasHellfire?2:0)+(hasPowerCond?1:0)
    // Start with embers = maxEmbers + descent bonus + passive extras.
    // Temporary overcap is allowed (these are explicit bonuses, not regen).
    if(hasConduit){
      setEmbers(maxEmbers+(bonusEmbers>0?bonusEmbers:0))
      addLog('⚡ The Conduit! Started at MAX embers.')
    } else {
      setEmbers(maxEmbers+(bonusEmbers>0?bonusEmbers:0)+extraEm)
      if(extraEm>0)addLog('🌿 Ember bonus: +'+(extraEm)+' (passives)')
    }
    // DOUBLE TIME d6 (incl. the Drum Throne re-roll) is owned by
    // PER_FIGHT_RESETS.dblRoll — see the resetPerFightState call at the top.
    // War Drums: +1 Strike
    if(activeArtifacts.some(a=>a.id==='wardrums')||activePassives.some(p=>p.id==='wardrums')){setStrikesLeft(p=>p+1);setFightMaxStrikes(p=>p+1);addLog('🪘 War Drums! +1 Strike this fight.')}
    setGameState('playing')
  },[fightIndex,maxEmbers,stage,selectedDeck,activeStake,chosenPacts,activeArtifacts,activePassives,corruption,collectedLoot,encoreMode,bonusDiscards,bonusEmbers,tutorialFight,upgradedCards,heldShrooms,heldAcid,stash,getScaledMaxHp,resetPerFightState])

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


  // ═══ GEAR ON-EQUIP SIDE EFFECTS — apply AND reverse ═══════════════
  // a7 (Serpent's Kiss) and a8 (Stone Tablet) mutate permanent stats when
  // equipped. Four separate code paths used to inline the "apply" half and NONE
  // of them implemented the "reverse" half, so swapping a8 out in the slot modal
  // paid a 6🌿 refund and left the +3 max HP on every member forever.
  const applyGearEquip=useCallback((it)=>{
    if(!it)return
    if(it.id==='a7')setMaxEmbers(p=>Math.min(MAX_EMBERS_CAP,p+1))
    if(it.id==='a8')setStage(prev=>prev.map(m=>m?Object.assign({},m,{maxHp:m.maxHp+3,hp:m.hp+3}):null))
  },[])
  const revertGearEquip=useCallback((it)=>{
    if(!it)return
    if(it.id==='a7')setMaxEmbers(p=>Math.max(1,p-1))
    if(it.id==='a8')setStage(prev=>prev.map(m=>{
      if(!m)return m
      const nmax=Math.max(1,m.maxHp-3)
      return Object.assign({},m,{maxHp:nmax,hp:Math.max(1,Math.min(m.hp,nmax))})
    }))
  },[])
  // Pack-granted gear that doesn't fit queues up behind the first swap prompt.
  const gearSwapQueueRef=useRef([])

  // ═══ THE ONE PURCHASE PATH ═══════════════════════════════════════
  // Returns 'bought' | 'pending' | 'refused'. Callers MUST gate their
  // "mark sold / grant item / set bought flag" on 'bought'. Before Aug 4 2026
  // this returned undefined, so every caller committed unconditionally: a
  // refused purchase handed over the goods for free (drug tiles) or burned the
  // tile for the whole circle without taking a coin (slot-full artifacts).
  //
  // 'pending' means the slot-swap modal is now open; `onCommit` (supplied by
  // the caller) fires only if confirmSlotSwap succeeds.
  const handleShopSpend=useCallback((cost,type,item,onCommit)=>{
    // Single pricing source — same function the shop UI renders with.
    const effectiveCost=shopPrice(cost,{kind:type==='dealer'?'drug':'item',hangover,chosenPacts,stake:activeStake})
    if(stash<effectiveCost){addLog('🚫 Not enough stash — that runs '+effectiveCost+'🌿.');return 'refused'}
    // ── LUCIFER BAND CAP ──
    // Checked BEFORE any deduction. It used to deduct first and then "refund"
    // `item.cost` — but buyCard's recruit payload carried no cost field, so
    // buying a member card at the cap charged full price and refunded 0 (and
    // that was the only setStash in the shop with no MAX_STASH clamp). Refusing
    // outright is exact by construction.
    if(type==='recruit'&&stage.some(m=>m&&m.keyword==='FALLEN')&&stage.filter(m=>m).length>=3){
      addLog('😈 Lucifer limits your band to 3 — Sly keeps the pack on the shelf.')
      playSfx('select',0.5)
      return 'refused'
    }
    // ── SLOT-FULL CHECK FOR ARTIFACTS/PEDALS (v0.7.10) ──
    // Run BEFORE deducting stash. Old behavior: deduct → check cap → silently
    // bail with stash gone. Now: if slots full, open the swap modal and don't
    // deduct anything. Modal's confirm handler will deduct and equip.
    if(type==='artifact'&&activeArtifacts.length>=3){
      setSlotSwapPrompt({type:'artifact',incoming:item,cost:effectiveCost,onCommit:onCommit||null})
      playSfx('select',0.7) // gentle select sound, not the buy "clack"
      return 'pending'
    }
    if(type==='passive'&&activePassives.length>=2){
      setSlotSwapPrompt({type:'passive',incoming:item,cost:effectiveCost,onCommit:onCommit||null})
      playSfx('select',0.7)
      return 'pending'
    }
    if(effectiveCost>0)setStash(p=>Math.max(0,p-effectiveCost))
    playSfx('buy')
    if(type==='card'){
      const nc=Object.assign({},item,{uid:uid(),shopBought:true})
      setDeck(p=>[...p,nc])
      setShopBoughtIds(p=>[...p,nc.uid])
      addLog('🛒 Bought '+item.name+'!')
    } else if(type==='artifact'){
      // `paidCost` records what was ACTUALLY charged so refund paths (Dive Bar
      // Sign's circle-IV refund, the swap-modal 50% buyback) can never pay back
      // more than you spent. See item 17.
      setActiveArtifacts(p=>[...p,Object.assign({},item,{paidCost:effectiveCost})])
      applyGearEquip(item)
      addLog('⚗ Artifact equipped: '+item.name+'!')
    } else if(type==='passive'){
      setActivePassives(p=>[...p,Object.assign({},item,{paidCost:effectiveCost})])
      // RECLASSIFIED ARTIFACTS — apply on-equip effects from passive branch too
      applyGearEquip(item)
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
        let real=getUnlockedMusicians()
        // Jul 31 2026: Lucifer never rolls when he can't legally join (band > 2) —
        // an unpickable candidate is a wasted pack slot. Test rigs can exclude him
        // entirely via localStorage vst_no_lucifer=1 for fair balance runs.
        const _bandN=stage.filter(m=>m).length
        if(_bandN>2||localStorage.getItem('vst_no_lucifer')==='1')real=real.filter(m=>m.id!=='lucifer_member')
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
      // Two call shapes: (cost, 'pack', {...pack, pickedCards:[]}) at OPEN time,
      // which only charges, and (0, 'pack', {...pack, pickedCards:[...]}) when
      // the player closes the picker, which only routes the goods.
      const picked = item.pickedCards || []
      if(picked.length){
        playSfx('pack_open')
        const members = picked.filter(c => c.isMember)
        // Aug 4 2026: routed on the explicit `_packKind` tag. The old test was
        // `c._isPack && !c.cost` for artifacts / `c._isPack && c.cost` for
        // passives — but every artifact in STARTER/CIRCLE/MYTHIC_ARTIFACTS has a
        // truthy cost, so the artifacts bucket was ALWAYS empty and every
        // pack-granted artifact was shoved into setActivePassives: an artifact
        // sitting in a pedal slot, where no artifact multiplier logic reads it.
        const cards = picked.filter(c => !c.isMember && !c._isPack && !c._packKind)
        const artifacts = picked.filter(c => c._packKind==='artifact')
        const passives = picked.filter(c => c._packKind==='passive')

        // Add regular cards to deck
        cards.forEach(c => {
          const nc = Object.assign({},c,{uid:uid(),shopBought:true})
          setDeck(p=>[...p,nc])
          setShopBoughtIds(p=>[...p,nc.uid])
          addLog('🛒 Added '+c.name+' to deck!')
        })
        // Gear that doesn't fit used to be DESTROYED with no refund and no
        // prompt — pay 60🌿 for a Cursed Demo, pick the pedal, watch it
        // evaporate. Overflow now opens the same swap modal the buy path uses,
        // at cost 0 (already paid). Extras queue behind the first.
        const _overflow=[]
        const _ownedA=new Set(activeArtifacts.map(a=>a.id))
        const _ownedP=new Set(activePassives.map(p=>p.id))
        let _aCount=activeArtifacts.length
        artifacts.forEach(a => {
          if(_ownedA.has(a.id)){addLog('⚗ '+a.name+' is already equipped — skipped.');return}
          _ownedA.add(a.id)
          if(_aCount>=3){_overflow.push({type:'artifact',incoming:a,cost:0,onCommit:null});return}
          _aCount++
          setActiveArtifacts(p=>p.length>=3?p:[...p,a])
          applyGearEquip(a)
          addLog('⚗ Artifact equipped: '+a.name+'!')
        })
        // 2-slot pedal cap (design: 3 artifacts + 2 pedals). Local counter —
        // activePassives.length is stale across forEach iterations.
        let _pCount=activePassives.length
        passives.forEach(p => {
          if(_ownedP.has(p.id)){addLog('💿 '+p.name+' is already equipped — skipped.');return}
          _ownedP.add(p.id)
          if(_pCount>=2){_overflow.push({type:'passive',incoming:p,cost:0,onCommit:null});return}
          _pCount++
          setActivePassives(prev=>prev.length>=2?prev:[...prev,p])
          applyGearEquip(p)
          addLog('💿 Pedal equipped: '+p.name+'!')
        })
        if(_overflow.length){
          gearSwapQueueRef.current=_overflow.slice(1)
          setSlotSwapPrompt(_overflow[0])
          addLog('⚠ Slots full — pick what '+_overflow[0].incoming.name+' replaces, or cancel to discard it.')
          playSfx('select',0.7)
        }
        // Members — trigger recruit flow (same as buying a recruitment pack)
        if(members.length>0){
          const enriched = members.map(m=>{
            return {...m, foil:m.foil||false, mythic:m.mythic||false, demonic:m.demonic||false}
          })
          recruitPickFiredRef.current=false
          setRecruitCandidates(enriched)
          setGameState('recruit')
        }
      }
    } else if(type==='dealer'){
      // Dealer purchases handled by onBuyShrooms/onBuyAcid callbacks, just deduct stash
      addLog('🌿 Dealer transaction complete.')
    } else {addLog('📦 Purchased: '+(item&&item.name)+'!')}
    return 'bought'
    // DEPS: `[stash]` alone left chosenPacts/stage/activeArtifacts/activePassives
    // stale. Taking Merchants Eye changes chosenPacts without changing stash, so
    // every price tag rendered 20% off while the first purchase charged full
    // price; the stale `stage` also defeated the Lucifer band-cap guard.
  },[stash,hangover,chosenPacts,activeStake,stage,activeArtifacts,activePassives,addLog,playSfx,applyGearEquip])

  // ── SLOT SWAP CONFIRM (v0.7.10, accounting rebuilt Aug 4 2026) ──
  // Player clicks one of their current artifacts/pedals in the swap modal.
  // Removes the chosen one, equips the incoming, deducts stash, and — new —
  // REVERSES the removed item's permanent on-equip effects and fires the
  // caller's onCommit so the shop tile is only stamped SOLD now, not when the
  // modal opened. Refunds 50% of what the removed item actually cost you.
  const confirmSlotSwap=useCallback((removedIdx)=>{
    if(!slotSwapPrompt)return
    const {type,incoming,cost,onCommit}=slotSwapPrompt
    const slots=type==='artifact'?activeArtifacts:activePassives
    const removed=slots[removedIdx]
    if(!removed)return
    // Refund basis is what you PAID (paidCost), not the sticker price — with a
    // hangover or Merchants Eye those diverge and the sticker price could refund
    // more than the purchase took.
    const refund=Math.floor((removed.paidCost!=null?removed.paidCost:(removed.cost||0))*0.5)
    if(stash<cost){addLog('🚫 Not enough stash to complete the swap.');return}
    setStash(p=>Math.max(0,Math.min(MAX_STASH,p-cost+refund)))
    // Reverse the OUTGOING item's permanent stats before applying the incoming
    // one's. Without this you could equip Stone Tablet (+3 max HP to everyone),
    // sell it back through this modal for a 6🌿 refund, and keep the +3 forever.
    revertGearEquip(removed)
    const _incoming=Object.assign({},incoming,{paidCost:cost})
    if(type==='artifact'){
      setActiveArtifacts(p=>{const np=[...p];np.splice(removedIdx,1);np.push(_incoming);return np})
    } else {
      setActivePassives(p=>{const np=[...p];np.splice(removedIdx,1);np.push(_incoming);return np})
    }
    applyGearEquip(incoming)
    if(onCommit)onCommit()
    addLog('🔄 Sold '+removed.name+' (+'+refund+'🌿) and equipped '+incoming.name+'.')
    playSfx('buy')
    setSlotSwapPrompt(gearSwapQueueRef.current.shift()||null)
  },[slotSwapPrompt,activeArtifacts,activePassives,stash,addLog,playSfx,applyGearEquip,revertGearEquip])
  // Cancelling consumes NOTHING: no stash, no onCommit, so the shop tile stays
  // buyable. It used to leave the tile permanently stamped SOLD.
  const cancelSlotSwap=useCallback(()=>{
    setSlotSwapPrompt(gearSwapQueueRef.current.shift()||null)
    playSfx('select',0.5)
  },[playSfx])

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
      if(member.keyword==='FALLEN'&&ns.filter(m=>m).length>2)return prev // safety: contract flow handles sacrifice first
      const idx=ns.findIndex(m=>!m)
      if(idx!==-1){
        const withUid={...member,uid:uid(),roleBondWith:[],roleBondBonus:0}
        const bonded=applyMentorLink(withUid,ns)
        ns[idx]=bonded
        // Mythic unlock tracking: track unique members for solo run condition
        soloMembersUsedRef.current.add(withUid.uid)
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
      // handleRecruitPick bails into the conflict BEFORE inserting the incoming
      // member, so if the player kept the NEW one it was never on stage — this
      // used to just delete the existing demonic member and lose both (band -1,
      // pack wasted). Equip the incoming member into the freed slot.
      const keptIsOnStage=keep&&keep.uid!=null&&ns.some(m=>m&&m.uid===keep.uid)
      if(keep&&!keptIsOnStage){
        const slot=ri>=0?ri:ns.findIndex(m=>!m)
        if(slot>=0){
          const withUid={...keep,uid:uid(),roleBondWith:[],roleBondBonus:0}
          ns[slot]=applyMentorLink(withUid,ns)
          soloMembersUsedRef.current.add(withUid.uid)
        }
      }
      return scanMentorLinks(ns)
    })
    setDemonicConflict(null)
    addLog('⛧ '+keep.name+' reigns! '+remove.name+' is gone forever.')
    setGameState('shop')
  },[])

  // opts.ignoreSalesCap — set by the Recruit screen's "band is full, who gets
  // cut?" modal and Lucifer's contract sacrifice. Those fires are part of
  // completing a purchase you already made, not walk-up pawn sales. The Recruit
  // screen's standalone FIRE PANEL does NOT set it: it used to bypass the
  // 2-sales-per-visit cap entirely (fire three, then Pass = three free sales).
  const handlePawnSellMember=useCallback((member,slotIdx,opts)=>{
    const o=opts||{}
    const bandSize=stage.filter(m=>m).length
    if(bandSize<=2){addLog('⚠ Cannot sell — need at least 2 members!');return}
    if(!o.ignoreSalesCap){
      if(pawnSalesLeft<=0){addLog("⚠ Sly's out of cash — no sales left this visit.");return}
      setPawnSalesLeft(p=>Math.max(0,p-1))
    }
    const price=memberSellValue(member)
    setStage(prev=>{
      const ns=breakMentorLink(member,[...prev])
      ns[slotIdx]=null
      return ns
    })
    setStash(p=>Math.min(MAX_STASH,p+price))
    if(member.keyword==='FALLEN'){addLog('😈 Sold Lucifer for '+price+'🌿! Band cap restored to 5.')}
    else{playSfx('sell');addLog('💰 Sold '+member.name+' for '+price+' stash.'+(member.roleBondBonus>0?' 🔗 Bond broken.':''))}
  },[stage,pawnSalesLeft,addLog,playSfx])

  const handlePawnSellCard=useCallback((card)=>{
    // The modal lists [...deck, ...discard] but this only ever SEARCHED deck —
    // and on idx===-1 it returned the deck unchanged and paid out anyway. Selling
    // a card you played last fight gave you money and let you keep the card,
    // twice per shop visit, every visit. Membership is now checked against both
    // piles synchronously, before any payout.
    const inDeck=deck.some(c=>c.uid===card.uid)
    const inDiscard=discardPile.some(c=>c.uid===card.uid)
    if(!inDeck&&!inDiscard){addLog('⚠ '+card.name+' is no longer in your collection.');return}
    if(pawnSalesLeft<=0){addLog("⚠ Sly's out of cash — no sales left this visit.");return}
    setPawnSalesLeft(p=>Math.max(0,p-1))
    const price=cardSellValue(card) // shared with the modal's button label (was base-only: Mythic Rare said 12🌿, paid 4)
    if(inDeck)setDeck(p=>{ const idx=p.findIndex(c=>c.uid===card.uid); if(idx===-1)return p; const n=[...p]; n.splice(idx,1); return n })
    else setDiscardPile(p=>{ const idx=p.findIndex(c=>c.uid===card.uid); if(idx===-1)return p; const n=[...p]; n.splice(idx,1); return n })
    setStash(p=>Math.min(MAX_STASH,p+price))
    playSfx('sell');addLog('💰 Sold '+card.name+' for '+price+' stash.')
  },[deck,discardPile,pawnSalesLeft,addLog,playSfx])

  const handlePawnBurnCard=useCallback((card)=>{
    setDeck(p=>{const idx=p.findIndex(c=>c.uid===card.uid);if(idx!==-1){const n=[...p];n.splice(idx,1);return n}return p})
    setDiscardPile(p=>{const idx=p.findIndex(c=>c.uid===card.uid);if(idx!==-1){const n=[...p];n.splice(idx,1);return n}return p})
    playSfx('burn');showFirstTimeTip('burn','Burning cards shrinks your deck. Smaller deck = draw your combos faster = bigger multipliers!',addLog);addLog('🔥 Burned '+card.name+' — permanently deleted from deck.')
  },[])

  const handleReroll=useCallback(()=>{
    // Priced through shopPrice like every other tile — it used to charge the raw
    // rerollCost while the tile displayed realPrice(rerollCost).
    const price=shopPrice(rerollCost,{kind:'reroll',hangover,chosenPacts,stake:activeStake})
    if(stash<price){addLog('🚫 Not enough stash — a reroll runs '+price+'🌿.');return}
    setStash(p=>Math.min(MAX_STASH,Math.max(0,p-price)));setRerollCost(p=>p+2)
    const cn=Math.floor(fightIndex/3)+1
    setShopCards(genShopCards(cn))
    setShroomsInStock(Math.random()<0.50)
    // DMT stock is NOT touched. It's boss-shop-only and "always in stock at
    // those shops to ensure discovery" — this used to unconditionally
    // setDMTInStock(false), so one reroll destroyed the boss-shop DMT stock
    // permanently for that visit.
    setAcidInStock(Math.random()<0.50)
    playSfx('reroll');addLog('🔄 Shop rerolled for '+price+' 🌿')
  },[stash,rerollCost,fightIndex,hangover,chosenPacts,activeStake,addLog,playSfx])

  const handleContinueSave=()=>{
    const sv=loadGame();if(!sv)return
    beginFightToken() // fight boundary — invalidate any in-flight strike timers
    setRunSeed(sv.seed);setSelectedDeck(sv.deck);setFightIndex(sv.fi)
    relicsSeenRef.current=new Set(sv.relicsSeen||[]) // v0.8.1: relic scarcity survives save/load
    setStage(sv.stage.map(m=>m?Object.assign({},ALL_MUSICIANS.find(mu=>mu.id===m.id)||{},m):null))
    setDeck(sv.dk.map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return c?Object.assign({},c,{uid:uid()}):null}).filter(Boolean))
    setHand(sv.hand.map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return c?Object.assign({},c,{uid:uid()}):null}).filter(Boolean))
    setDiscardPile(sv.disc.map(id=>{const c=ALL_CARDS.find(x=>x.id===id);return c?Object.assign({},c,{uid:uid()}):null}).filter(Boolean))
    setEmbers(sv.em);setMaxEmbers(sv.mx);setStash(sv.st);setCorruption(sv.co)
    // dblRoll: `null` means "no drummer" and is a legitimate value, so only fall
    // back to a fresh roll when the field is absent entirely (pre-phase-4 save).
    if(sv.dbl!==undefined)setDblRoll(sv.dbl)
    else rollDblForStage(sv.stage||[])
    setHangover(sv.hang||0)
    setStrikesLeft(sv.sl);setFightMaxStrikes(sv.ms);setDiscardsLeft(sv.dl)
    setChosenPacts(sv.pa||[]);setCollectedLoot(sv.loot||[]);setUpgradedCards(sv.upg||[])
    // Include MYTHIC pools so save loads with unlocked mythics restore correctly.
    // Truncate to slot caps as safety net (3 artifacts, 2 pedals).
    setActiveArtifacts((sv.art||[]).slice(0,3).map(id=>[...STARTER_ARTIFACTS,...CIRCLE_ARTIFACTS,...MYTHIC_ARTIFACTS].find(a=>a.id===id)).filter(Boolean))
    setActivePassives((sv.pas||[]).slice(0,2).map(id=>[...STARTER_PASSIVES,...MYTHIC_PEDALS].find(p=>p.id===id)).filter(Boolean))
    if((sv.pas||[]).length>2)addLog('⚠ Loaded save had '+sv.pas.length+' pedals; only first 2 equipped (cap is 2).')
    if(sv.stats)setStats(sv.stats)
    setHeldShrooms(sv.shrooms||0);setHeldAcid(sv.acid||0);setHeldDMT(sv.dmt||0)
    // ── ANCHOR refs (commit 4d): recompute from restored stage on resume.
    //    Save happens at fight start (before any saves used), so saves-used is always 0
    //    at save time. Recomputing tier from stage is deterministic and avoids needing
    //    to extend the save format. If mid-fight saves are ever added, switch this to
    //    explicit ref persistence and restore both fields from sv.
    {
      const _stage=sv.stage||[]
      const _anchorCount=_stage.filter(m=>m&&!m.tooStoned&&m.keyword==='ANCHOR').reduce((s,m)=>s+(m.foil?2:1),0)
      anchorTierRef.current=_stackTier(_anchorCount)
      anchorSavesUsedRef.current=0
    }
    const ne=ENEMIES[sv.fi]||ENEMIES[0];setEnemy(ne)
    // Aug 1 2026: resume at fight 26 must use the flat Lucifer formula + phase 1,
    // not the generic deck-scale math (was resuming Lucifer at 185,000 / phase 0).
    // Resume = fight restart, so phase 1 fresh is correct even for a mid-P2 save.
    if(sv.fi===26){
      const _lh=parseInt(localStorage.getItem('vst_heat')||'1')
      const _lhp=Math.ceil(333333*(1+Math.max(0,_lh-1)*0.15)*(encoreMode?2.0:1.0))
      setEnemyHp(_lhp);enemyHpRef.current=_lhp;setScaledMaxHp(_lhp);setLuciferPhase(1);luciferPhaseRef.current=1
    } else {
      setLuciferPhase(0);luciferPhaseRef.current=0
      const _ds=(STARTER_DECKS.find(d=>d.id===sv.deck)||{}).hpScale||1
      const _hm=1+(Math.max(0,parseInt(localStorage.getItem('vst_heat')||'1')-1)*0.15)
      const _hp=Math.ceil(ne.maxHp*_ds*_hm*_stakeHpF());setEnemyHp(_hp);enemyHpRef.current=_hp;setScaledMaxHp(_hp)
    }
    setGameState('playing');addLog('⛧ Run resumed from save...')
  }
  // ── THE ENCORE (Aug 4 2026, phase 1) ───────────────────────────────
  // This body used to be inlined in EndScreen's "⛧ The Encore ⛧" onClick, where
  // none of these setters/refs are in scope — the button threw ReferenceError on
  // its first statement, every time. Lifted into App and passed down as onEncore.
  // NOTE: this is the ONLY place corruptCardsGivenRef is reset outside handleReset.
  const handleEncore=useCallback(()=>{
    beginFightToken() // fight boundary — invalidate any in-flight strike timers
    setEncoreMode(true);setEncoreCircle(p=>p+10)
    setFightIndex(0);setEnemy(ENEMIES[0])
    // encoreMode state hasn't propagated yet, so getScaledMaxHp would still read
    // false here — inline the same formula with the ×2.0 encore multiplier forced.
    const _ds=(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).hpScale||1
    const _hl=parseInt(localStorage.getItem('vst_heat')||'1')
    const _hm=1+(Math.max(0,_hl-1)*0.15)
    const _wHp=Math.ceil(ENEMIES[0].maxHp*_ds*_hm*_stakeHpF()*2.0)
    setEnemyHp(_wHp);setScaledMaxHp(_wHp);enemyHpRef.current=_wHp
    const _encDeckStrMod=(STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).maxStrikesMod||0
    setStrikesLeft(activeStake.maxStrikes+_encDeckStrMod);setFightMaxStrikes(activeStake.maxStrikes+_encDeckStrMod);setDiscardsLeft(4);setFightMaxDiscards(4)
    setStage(p=>p.map(m=>m&&!m.tooStoned?Object.assign({},m,{hp:m.maxHp,cursed:false}):m))
    setGameState('playing');setAnimPhase('idle');setDeathCause(null)
    victoryFiredRef.current=false
    corruptCardsGivenRef.current=[]
    addLog('⛧ THE ENCORE BEGINS — All enemies ×2.0 HP! ⛧')
  },[selectedDeck,activeStake,addLog])

  // ── handleReset — THE single authoritative run-init path ───────────────
  // Called from EndScreen's "Play Again"/retry-seed buttons, the daily-challenge
  // button, AND (since Aug 4 2026 phase 4) the menu's "⛧ Enter the Vestibule ⛧"
  // and "Skip Tutorial" buttons. That menu path used to be a bare
  // setGameState('booster'), which meant embers/maxEmbers/corruption never
  // picked up the active stake's startEmbers/startCorruption and the whole
  // tutorial's stash/corruption/stats/log/runStartTime bled into the first real
  // run. Two entry points, one function, identical starting state.
  //
  // The body is now pure orchestration: everything it resets lives in
  // PER_FIGHT_RESETS / PER_RUN_RESETS (see the RESET REGISTRY above), so a run
  // boundary is a strict superset of a fight boundary by construction.
  const handleReset=(retrySeed)=>{
    const deckDef=STARTER_DECKS.find(d=>d.id===selectedDeck)
    // Deck identity wins over stake defaults where a deck defines one; this is
    // the SINGLE authoritative set (phase 2 killed the old apply-then-clobber).
    const _opts={
      seed:retrySeed||Math.floor(Math.random()*0xFFFFFF),
      startEmbers:activeStake.startEmbers,
      startStash:3+(deckDef?.startStash||0),
      corruption:(deckDef?.startCorruption>0)?deckDef.startCorruption:activeStake.startCorruption,
      strikes:activeStake.maxStrikes+(deckDef?.maxStrikesMod||0),
      discards:MAX_DISCARDS,
      handTarget:HAND_SIZE,
      stage:[],          // empty band at run start → dblRoll rolls to null
      drumThrone:false,
    }
    beginFightToken() // run reset — invalidate any in-flight strike timers
    resetPerFightState(_opts)
    for(const k in PER_RUN_RESETS)PER_RUN_RESETS[k](_opts)
    clearSave()
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

  // ── RITUALIST SIGNATURE: Corruption Feeds ──
  // Every 10% corruption GAINED refunds 1 ember, capped at 3 refunds per strike.
  // The ref is reset at fight start. Per-strike cap reset in handleStrike (see below).
  useEffect(()=>{
    if((STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).signature!=='corruption_feeds')return
    const prev=ritualistPrevCorruptionRef.current
    const gained=corruption-prev
    if(gained<=0){ritualistPrevCorruptionRef.current=corruption;return}
    // How many full 10% steps were crossed? e.g. 18→32 = 2 steps (20, 30)
    const stepsBefore=Math.floor(prev/10)
    const stepsAfter=Math.floor(corruption/10)
    const newSteps=Math.max(0,stepsAfter-stepsBefore)
    if(newSteps>0){
      const remaining=Math.max(0,5-ritualistEmberRefundsThisStrikeRef.current)
      const refund=Math.min(newSteps,remaining)
      if(refund>0){
        setEmbers(p=>Math.min(maxEmbers,p+refund))
        ritualistEmberRefundsThisStrikeRef.current+=refund
        addLog('💀 Corruption Feeds: +'+refund+' ember'+(refund>1?'s':'')+' from corruption surge')
      }
    }
    ritualistPrevCorruptionRef.current=corruption
  },[corruption,selectedDeck,maxEmbers])

  // ── SURVIVOR SIGNATURE: Second Wind ──
  // Each member gets ONE per-fight save: when they would go tooStoned, they heal
  // to 25% maxHp instead. Tracked per-member via a Set of uids in survivorSavesUsedRef.
  useEffect(()=>{
    if((STARTER_DECKS.find(d=>d.id===selectedDeck)||{}).signature!=='second_wind')return
    const stoned=stage.find(m=>m&&m.tooStoned&&!survivorSavesUsedRef.current.has(m.uid))
    if(!stoned)return
    survivorSavesUsedRef.current.add(stoned.uid)
    const reviveHp=Math.max(1,Math.ceil(stoned.maxHp*0.15))
    setStage(p=>p.map(m=>m&&m.uid===stoned.uid?Object.assign({},m,{tooStoned:false,hp:reviveHp,bloodOath:false}):m))
    addLog('🛡️ SECOND WIND! '+stoned.name+' refuses to stay down — healed to '+reviveHp+' HP!')
    addFloat('🛡 SECOND WIND',window.innerWidth/2,window.innerHeight*0.4,'#44cc44',true)
    playSfx&&playSfx('member_revive')
  },[stage,selectedDeck])

  // Phase banner sync
  useEffect(()=>{
    if(animPhase==='attacking')setPhaseBanner('strike')
    else if(animPhase==='boss')setPhaseBanner('boss')
    else if(animPhase==='idle')setPhaseBanner('play')
  },[animPhase])

  const canStrike=animPhase==='idle'&&enemyHp>0&&stage.some(m=>m&&!m.tooStoned) // OVERTIME (Jul 31): no strike floor — enrage is the cost
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
  // Combat shortcuts fired straight THROUGH open modals — pressing S while the
  // Setlist modal was up executed a strike. One mirrored flag for every overlay
  // that owns input; the keydown handler bails on it. (Aug 4 2026, phase 1)
  const modalOpenRef=useRef(false);modalOpenRef.current=!!(setlistOpen||slotSwapPrompt||deckViewOpen||discardViewOpen||showPauseOptions)
  const won=fightIndex>=26&&enemyHp<=0
  // Corruption visual escalation
  const corruptLow=corruption>=40&&corruption<70
  const corruptHigh=corruption>=70&&corruption<100
  const corruptMax=corruption>=100
  const chromaStr=corruptMax?4:corruptHigh?2:corruptLow?1:0
  const parchmentFilter=corruptMax?'sepia(0.4) hue-rotate(330deg) saturate(1.8)':corruptHigh?'sepia(0.25) hue-rotate(340deg) saturate(1.4)':corruptLow?'sepia(0.1) saturate(1.1)':'none'
  const bgPulseAnim=corruption>=50?'bgPulse '+(corruption>=75?'1.5s':'3s')+' ease-in-out infinite':'none'

  // Combat log too — the ESC menu's "Combat Log" button is now reachable from
  // every screen, so its viewer has to be as well.
  const combatLogOverlay=showCombatLog?<CombatLogViewer log={fullRunLogRef.current} onClose={()=>setShowCombatLog(false)}/>:null

  // ── GLOBAL OVERLAYS (Aug 4 2026, phase 1) ──────────────────────────
  // These two used to live inside the fall-through combat return, BELOW every
  // early return, so they were unreachable on the shop/descent/pact/forge/
  // recruit/event/end screens — and then ambushed the player the next time
  // combat rendered. Hoisted here and rendered by the shared shell below, so
  // every screen path gets them. Absolute/inset:0 still resolves against the
  // 1920x1080 #vst-scale-root, so geometry is unchanged.
  // ── SLOT SWAP MODAL (v0.7.10) ──
  //   Pops up when player tries to buy an artifact/pedal with full slots.
  //   Shows current 3 artifacts (or 2 pedals); click one to sell it for
  //   50% refund and equip the new one. Cancel button to back out.
  //   handleShopSpend sets slotSwapPrompt from the SHOP, so this MUST render on
  //   the shop screen — it never did before (buying with full slots was a silent
  //   no-op, and the stuck prompt then hijacked the next combat render).
  const slotSwapModal=slotSwapPrompt?(()=>{
    const isArt=slotSwapPrompt.type==='artifact'
    const slots=isArt?activeArtifacts:activePassives
    const incoming=slotSwapPrompt.incoming
    const cost=slotSwapPrompt.cost
    const accent=isArt?'#c87820':'#9933cc'
    const tintBg=isArt?'rgba(40,24,6,0.96)':'rgba(34,12,48,0.96)'
    return (<div style={{position:'absolute',inset:0,zIndex:9998,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease'}} onClick={cancelSlotSwap}>
      <div onClick={e=>e.stopPropagation()} style={{minWidth:680,maxWidth:900,background:tintBg,border:'2px solid '+accent,borderRadius:12,padding:'28px 36px 24px',boxShadow:'0 0 60px '+accent+'66, 0 20px 80px rgba(0,0,0,0.9)',display:'flex',flexDirection:'column',gap:20}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:accent,letterSpacing:5,textShadow:'0 0 16px '+accent+'aa, 3px 3px 0 #000'}}>{isArt?'⛧ ARTIFACT SLOTS FULL ⛧':'⚡ PEDAL SLOTS FULL ⚡'}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',letterSpacing:2,marginTop:6,fontStyle:'italic'}}>Pick one to sell for 50% refund. Cancel costs you nothing.</div>
        </div>

        {/* INCOMING — what they're buying */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'10px 14px',background:'rgba(0,0,0,0.4)',border:'1px dashed '+accent+'88',borderRadius:8}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:3,color:'var(--text-positive)',textTransform:'uppercase'}}>Incoming · {cost>0?cost+'🌿':'ALREADY PAID'}</div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            {isArt?<ArtifactArtImg id={incoming.id} emoji={incoming.emoji} size={48}/>:<div style={{fontSize:42}}>{incoming.emoji}</div>}
            <div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--text-primary)',letterSpacing:2}}>{incoming.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',fontStyle:'italic',maxWidth:520,lineHeight:1.3}}>{incoming.effect}</div>
            </div>
          </div>
        </div>

        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:3,color:accent,textTransform:'uppercase',textAlign:'center'}}>↓ Click an existing one to sell it ↓</div>

        {/* CURRENT — clickable */}
        <div style={{display:'flex',gap:14,justifyContent:'center'}}>
          {slots.map((s,i)=>(<div key={i} onClick={()=>confirmSlotSwap(i)}
            style={{flex:'0 0 auto',width:160,padding:'12px 10px',background:'rgba(0,0,0,0.55)',border:'2px solid '+accent+'aa',borderRadius:8,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8,transition:'transform 0.12s, box-shadow 0.12s, border-color 0.12s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px) scale(1.03)';e.currentTarget.style.borderColor='var(--text-blood)';e.currentTarget.style.boxShadow='0 8px 24px rgba(196,30,58,0.55)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor=accent+'aa';e.currentTarget.style.boxShadow='none'}}>
            {isArt?<ArtifactArtImg id={s.id} emoji={s.emoji} size={44}/>:<div style={{fontSize:40}}>{s.emoji}</div>}
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-primary)',letterSpacing:1,textAlign:'center',lineHeight:1.15}}>{s.name}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontStyle:'italic',color:'var(--ink-dim)',textAlign:'center',lineHeight:1.3,minHeight:32}}>{s.effect}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-positive)',letterSpacing:1,marginTop:'auto'}}>Sell · +{Math.floor((s.paidCost!=null?s.paidCost:(s.cost||0))*0.5)}🌿</div>
          </div>))}
        </div>

        <button onClick={cancelSlotSwap} style={{alignSelf:'center',marginTop:6,padding:'8px 28px',background:'rgba(0,0,0,0.6)',border:'1px solid var(--ink-rust)',borderRadius:6,color:'var(--ink-bone)',fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:4,textTransform:'uppercase',cursor:'pointer'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(60,30,30,0.7)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,0,0,0.6)'}}>Cancel</button>
      </div>
    </div>)
  })():null

  // ── PAUSE OPTIONS OVERLAY (ESC key) ──
  //   The global keydown handler toggles showPauseOptions on EVERY screen, but this
  //   overlay only ever rendered in combat — so ESC in the shop/descent/pact/forge/
  //   recruit/event/end screens silently flipped the flag with no UI, then popped up
  //   uninvited on the next combat render. It's also the only in-run escape hatch
  //   ("ABANDON RUN"), which the gameState!=='menu' guard below proves was intended
  //   to be global. Now rendered by the shared shell on every screen.
  const pauseOverlay=showPauseOptions?(<div style={{position:'absolute',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.85)'}} onClick={()=>setShowPauseOptions(false)}>
    <div onClick={e=>e.stopPropagation()} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'40px 60px',background:'rgba(10,6,2,0.98)',border:'2px solid rgba(100,65,15,0.5)',borderRadius:12,maxWidth:500,width:'90%'}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:42,color:'var(--text-blood)',textShadow:'0 0 20px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:6}}>Paused</div>
      {gameState!=='menu'&&<button onClick={()=>{if(window.confirm('Abandon this run? The tour ends here — no refunds from Hell.')){clearSave();setShowPauseOptions(false);handleReset()}}}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,letterSpacing:3,color:'var(--text-blood)',background:'rgba(60,10,10,0.5)',border:'1px solid var(--text-blood)',borderRadius:7,padding:'10px 28px',cursor:'pointer',width:'100%'}}>🏳 ABANDON RUN</button>}
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
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-gold)'}}>{label}</span>
            <button onClick={()=>{localStorage.setItem(key,on?'off':'on');setShowPauseOptions(false);setTimeout(()=>setShowPauseOptions(true),10)}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:on?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(on?'#44cc44':'#cc4444'),borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{on?'ON':'OFF'}</button>
          </div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-gold)'}}>Combat Speed</span>
          <button onClick={()=>{setSpeedMode(p=>{const nv=!p;localStorage.setItem('vst_speed',nv?'fast':'normal');return nv});setShowPauseOptions(false);setTimeout(()=>setShowPauseOptions(true),10)}}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-gold)',background:'rgba(0,0,0,0.4)',border:'1px solid #c87820',borderRadius:4,padding:'6px 20px',cursor:'pointer',minWidth:60,textAlign:'center'}}>{speedMode?'FAST':'NORMAL'}</button>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-gold)'}}>Music Volume</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="range" min="0" max="1" step="0.05" value={musicVol}
              onChange={e=>{const v=parseFloat(e.target.value);setMusicVol(v);localStorage.setItem('vst_music_vol',v)}}
              style={{width:100,accentColor:'#e8a820',cursor:'pointer'}}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',minWidth:30,textAlign:'right'}}>{Math.round(musicVol*100)}%</span>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
          <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-gold)'}}>SFX Volume</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="range" min="0" max="1" step="0.05" value={sfxVol}
              onChange={e=>{const v=parseFloat(e.target.value);setSfxVol(v);localStorage.setItem('vst_sfx_vol',v)}}
              style={{width:100,accentColor:'#e8a820',cursor:'pointer'}}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',minWidth:30,textAlign:'right'}}>{Math.round(sfxVol*100)}%</span>
          </div>
        </div>
        <div style={{padding:'10px 16px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-gold)',marginBottom:6}}>⌨ Keyboard Shortcuts</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',lineHeight:2}}>
            S = Strike · D = Discard · 1-6 = Select cards · Ctrl+Z = Undo · ESC = Pause · Space = Fast mode
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
        style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,letterSpacing:4,color:'var(--text-blood)',background:'rgba(120,0,0,0.25)',border:'2px solid #aa0000',borderRadius:8,padding:'12px 60px',cursor:'pointer',marginTop:8,animation:'throb 2s ease-in-out infinite'}}>Resume</button>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:2,marginTop:4}}>Press ESC to close</div>
    </div>
  </div>):null

  // Every screen path is computed inside renderScreen() so the global overlays
  // below (slot-swap modal, ESC pause menu) render on ALL of them, not just combat.
  const renderScreen=()=>{
  // ── TROPHY WALL / MASTERY GALLERY (overlay from menu) ──
  if(showTrophies&&gameState==='menu')return(<div style={{width:1920,height:1080,position:'relative',overflow:'hidden'}}><TrophyWall onClose={()=>setShowTrophies(false)}/></div>)
  if(showStats&&gameState==='menu')return(<div style={{width:1920,height:1080,position:'relative',overflow:'auto'}}><StatsScreen onClose={()=>setShowStats(false)}/></div>)
  if(showCollection&&gameState==='menu')return(<div style={{width:1920,height:1080,position:'relative',overflow:'auto'}}><MasteryGallery onClose={()=>setShowCollection(false)}/></div>)

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
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--text-blood)',textShadow:'0 0 30px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>Unlocks</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',letterSpacing:2}}>Lifetime Score: {lt.toLocaleString()}</div>
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
                <div style={{filter:item.done?'none':'brightness(0.6)',marginBottom:6,display:'flex',justifyContent:'center'}}><CardArtImg id={item.id||''} emoji={item.emoji} size={64}/></div>
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
                      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>{c.type}</div>
                      <div style={{width:30,height:30,borderRadius:'50%',background:c.embers>0?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'2px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-primary)'}}>{c.embers}</div>
                    </div>
                    <div style={{textAlign:'center',marginBottom:8,display:'flex',justifyContent:'center'}}><CardArtImg id={c.id} emoji={c.emoji} size={48}/></div>
                    <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,color:'var(--text-primary)',textAlign:'center',marginBottom:4,letterSpacing:1}}>{c.name}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,textAlign:'center',letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>{c.rarity}{c.shopOnly?' · SHOP ONLY':''}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',textAlign:'center',lineHeight:1.5,fontStyle:'italic'}}>{c.effect}</div>
                  </div>
                })()}
              </div>
            ))}
          </div>
          <button onClick={()=>setUnlockPage_(p=>Math.min(totalPages-1,p+1))} disabled={unlockPage>=totalPages-1}
            style={{fontSize:36,color:unlockPage<totalPages-1?'#e8a820':'#333',background:'none',border:'none',cursor:unlockPage<totalPages-1?'pointer':'default',padding:'10px',flexShrink:0}}>▶</button>
        </div>
        {/* PAGE INDICATOR */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2}}>
          Page {unlockPage+1} of {totalPages} · {items.filter(i=>i.done).length} / {items.length} {unlockTab==='combos'?'discovered':'unlocked'}
        </div>
        <button onClick={()=>setMenuView(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:4,color:'var(--text-blood)',background:'rgba(80,0,0,0.2)',border:'2px solid #881111',borderRadius:6,padding:'10px 40px',cursor:'pointer'}}>← Back</button>
      </div>
    )}
    // Rules screen
    if(menuView==='rules')return(
      <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.98)',display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'40px 20px',overflowY:'auto'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,color:'var(--text-blood)',textShadow:'0 0 30px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>Rules</div>
        <div style={{maxWidth:1500,width:'100%',display:'flex',flexDirection:'column',gap:12}}>
          {[
            ['🎸 The Goal','Build a doom metal band and fight through 9 Circles of Hell. Defeat all 27 enemies and Lucifer to win. Each circle has 2 regular fights and 1 boss fight.'],
            ['⚔ Strikes','You get 4 Strikes per fight (some stakes change this). Play cards to buff your band, then press Strike. All living members deal their ATK as damage to the boss.'],
            ['↓ Discards','You get 4 Discards per fight. Select unwanted cards and discard them to draw fresh ones. Strategic discarding is key to finding your best cards.'],
            ['🔥 Embers','Cards cost Embers to play. You refill to your max Embers at the start of each Strike. Max Embers increases by +1 after each boss kill.'],
            ['🌿 Stash','Your currency. Earned after victories (scales with circle depth). Spent in the shop on recruit packs, cards, artifacts, passives, and drugs. Capped at 420.'],
            ['💨 Too Stoned','When a member reaches 0 HP, they go Too Stoned and can\'t attack or be targeted for the rest of this fight. They recover at full HP next fight. If ALL members go Too Stoned at once, the run ends.'],
            ['👥 Band Members','Your band has up to 5 slots (6 with the Sixth Slot pact). Each member has ATK, HP, and a keyword ability. Recruit new members from packs in the shop.'],
            ['🏷 Member Keywords','FRENZIED: +ATK per RIFF played each Strike (×1/2/4 by stack tier). DOUBLE TIME: Drummer rolls d6 each fight (5-6 doubles ATK, 3-4 ×1.5, 1-2 ×1). Only one drummer per band. ANCHOR: Saves from lethal damage 1/2/any-member by stack tier (per fight). CORRUPT: +ATK from Corruption (×1/2/4 by stack tier). DEBUFF: Reduces boss damage. FOLK MAGIC: 20% chance to refill all Embers. SHREDDER: +ATK per consecutive same-type card chain (×1/2/4 by stack tier). HEXED: Auto-raises corruption, gains ATK from it. ⟡ AURAS: every member radiates a small bonus to ADJACENT slots — reorder your stage in the shop to stack them.'],
            ['⛓ Mentor Links','Place a Foil/Mythic/Demonic member directly LEFT of a basic member with the same role. They form a Mentor Link — a permanent damage multiplier that fires every Strike while both are alive.'],
            ['✨ Member Tiers','Members come in tiers: Basic (standard), Foil (+1 ATK/HP, -1 Ember on cards), Mythic (+3 ATK/HP), Demonic (+5 ATK/HP, golden glow). Higher tiers appear in better packs.'],
            ['🃏 Card Types','RIFF (purple): Direct damage and ATK buffs. CORRUPT (red): Corruption-scaling power. UTILITY (green): Healing, draw, and economy. EMBER (orange): Ember management and recovery.'],
            ['⛧ Riff Chains','Playing specific card pairs triggers Riff Chains — massive combo bonuses! Chains multiply your Strike damage (e.g., Battle Cry + Stage Dive = DEATH WISH). 16 chains to discover. The celebration shows which cards triggered it.'],
            ['×️ Strike Multiplier','Every card played MULTIPLIES your Strike by ×1.08. Riff Chains multiply by ×1.78. Multiple chains stack multiplicatively. 6 cards + 1 chain = ×2.83. Stack artifacts for the god run. The multiplier resets each Strike.'],
            ['🌀 Corruption','A risk/reward axis from 0-100%. Some cards and enemies raise it. CORRUPT keyword members get stronger at high corruption. Overdrive requires 60%+. Feedback Loop and Amp the Static scale with it.'],
            ['⚠ Corruption & Hangover','Corruption powers CORRUPT cards (purple). The peak corruption you hit during a fight becomes your HANGOVER for the next fight + shop. Hangover ≥50% = +20% shop prices. ≥75% = +40%. ≥100% = +60%. Each member loses ⌊hangover/33⌋ max HP next fight (restored at boss kill). Peaking at 100% also shaves 15% of that fight\'s stash payout. Corruption can never end your run — the cost is always tomorrow.'],
            ['💀 Corruption = Power','Corruption is a MULTIPLIER. 40%=×1.2, 60%=×1.5, 80%=×2.0, 100%=×3.0 damage but the boss hits +3 harder. Risk vs reward — ride the corruption wave.'],
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
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:42,fontWeight:900,color:'var(--text-gold)',marginBottom:4}}>{title}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,color:'var(--text-secondary)',lineHeight:1.5}}>{desc}</div>
          </div>)}
        </div>
        <button onClick={()=>setMenuView(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'var(--text-blood)',background:'rgba(80,0,0,0.2)',border:'2px solid #881111',borderRadius:6,padding:'12px 48px',cursor:'pointer',marginTop:8}}>← Back</button>
      </div>
    )

    // Options screen
    if(menuView==='options')return(
      <div style={{position:'absolute',inset:0,zIndex:9900,background:'rgba(4,2,1,0.98)',display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'60px 20px',overflowY:'auto'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,color:'var(--text-blood)',textShadow:'0 0 30px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:8}}>Options</div>
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
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-gold)'}}>{label}</span>
              <button onClick={()=>{localStorage.setItem(key,on?'off':'on');setMenuView('options')}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:on?'#44cc44':'#cc4444',background:'rgba(0,0,0,0.4)',border:'1px solid '+(on?'#44cc44':'#cc4444'),borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{on?'ON':'OFF'}</button>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-gold)'}}>Combat Speed</span>
            <button onClick={()=>{setSpeedMode(p=>{const nv=!p;localStorage.setItem('vst_speed',nv?'fast':'normal');return nv});setMenuView('options')}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-gold)',background:'rgba(0,0,0,0.4)',border:'1px solid #c87820',borderRadius:4,padding:'8px 24px',cursor:'pointer',minWidth:70,textAlign:'center'}}>{speedMode?'FAST':'NORMAL'}</button>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-gold)'}}>Music Volume</span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="range" min="0" max="1" step="0.05" value={musicVol}
                onChange={e=>{const v=parseFloat(e.target.value);setMusicVol(v);localStorage.setItem('vst_music_vol',v)}}
                style={{width:120,accentColor:'#e8a820',cursor:'pointer'}}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',minWidth:36,textAlign:'right'}}>{Math.round(musicVol*100)}%</span>
            </div>
          </div>
          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(20,12,4,0.6)',border:'1px solid rgba(100,65,15,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-gold)'}}>Sound Effects</span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="range" min="0" max="1" step="0.05" value={sfxVol}
                onChange={e=>{const v=parseFloat(e.target.value);setSfxVol(v);localStorage.setItem('vst_sfx_vol',v)}}
                style={{width:120,accentColor:'#e8a820',cursor:'pointer'}}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',minWidth:36,textAlign:'right'}}>{Math.round(sfxVol*100)}%</span>
            </div>
          </div>

          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'rgba(40,5,5,0.4)',border:'1px solid rgba(180,40,40,0.3)',borderRadius:6}}>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-blood)'}}>Reset All Progress</span>
            <button onClick={()=>{if(confirm('This will erase ALL progress, scores, achievements, and unlocks. Are you sure?')){localStorage.clear();window.location.reload()}}}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-blood)',background:'rgba(80,0,0,0.2)',border:'1px solid #cc4444',borderRadius:4,padding:'8px 24px',cursor:'pointer'}}>RESET</button>
          </div>
        </div>
        <button onClick={()=>setMenuView(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,letterSpacing:4,color:'var(--text-blood)',background:'rgba(80,0,0,0.2)',border:'2px solid #881111',borderRadius:6,padding:'12px 48px',cursor:'pointer',marginTop:16}}>← Back</button>
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
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:192,color:'var(--text-blood)',textShadow:'0 0 60px rgba(200,0,0,0.8),0 0 120px rgba(150,0,0,0.4),4px 4px 0 #000',letterSpacing:12,lineHeight:1}}>Vestibule</div>
          <div style={{fontFamily:"'ScratchFont',serif",fontSize:36,color:'var(--text-secondary)',fontStyle:'italic',letterSpacing:6,marginBottom:24}}>A roguelite descent through the 9 Circles of Hell</div>

          {/* Stats row */}
          <div style={{display:'flex',gap:20,marginBottom:16}}>
            {lt>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-secondary)',letterSpacing:2}}>LIFETIME: {lt.toLocaleString()}</div>}
            {(totalRunsPlayed||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-secondary)',letterSpacing:2}}>RUNS: {totalRunsPlayed}</div>}
            {streak>1&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-blood)',letterSpacing:2}}>🔥 {streak} DAY STREAK</div>}
            {(personalBest||0)>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-secondary)',letterSpacing:2}}>BEST: {personalBest.toLocaleString()}</div>}
          </div>

          {/* PLAY BUTTONS */}
          {!isTutorialDone()?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,marginBottom:16}}>
              <button onClick={()=>startTutorialFight(1)}
                style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:63,letterSpacing:10,color:'var(--text-blood)',
                  background:'rgba(120,0,0,0.25)',border:'3px solid #aa0000',borderRadius:10,
                  padding:'28px 120px',cursor:'pointer',textTransform:'uppercase',
                  textShadow:'0 0 30px rgba(220,0,0,0.7)',
                  boxShadow:'0 0 50px rgba(180,0,0,0.3)',
                  animation:'throb 2s ease-in-out infinite',transition:'all 0.2s'}}>
                ⛧ Start Tutorial ⛧
              </button>
              {/* handleReset() — NOT a bare setGameState('booster'). See handleReset's
                  header: the menu is a new-run entry point and must go through the
                  single authoritative run-init path, or the stake economy and the
                  tutorial's leftover state come along for the ride. */}
              <button onClick={()=>{markTutorialDone();handleReset()}}
                style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,letterSpacing:4,color:'var(--text-secondary)',
                  background:'none',border:'none',cursor:'pointer',textDecoration:'underline',
                  textTransform:'uppercase',opacity:0.7}}>
                Skip Tutorial — I know what I'm doing
              </button>
            </div>
          ):(<>
            {/* ⛧ Enter the Vestibule ⛧ — the post-win-reload new-run entry point.
                Must be handleReset(), same as EndScreen's "Play Again", or the two
                entry points start from different stake economies. */}
            <button onClick={()=>handleReset()}
              style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:63,letterSpacing:10,color:'var(--text-blood)',
                background:'rgba(120,0,0,0.25)',border:'3px solid #aa0000',borderRadius:10,
                padding:'28px 140px',cursor:'pointer',textTransform:'uppercase',
                textShadow:'0 0 30px rgba(220,0,0,0.7)',
                boxShadow:'0 0 50px rgba(180,0,0,0.3)',
                animation:'throb 2s ease-in-out infinite',transition:'all 0.2s',marginBottom:16}}>
              {allDecksDemonic()?<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:32,color:'var(--gold)',textShadow:'0 0 24px rgba(255,215,0,0.8),0 0 48px rgba(255,0,68,0.5)',letterSpacing:8,marginBottom:8,animation:'throb 2s ease-in-out infinite'}}>⛧ PANTHEON ⛧</div>
              :getStakeUnlocks().includes('demonic')&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:'var(--text-blood)',textShadow:'0 0 20px rgba(255,0,68,0.6),0 0 40px rgba(255,0,68,0.3)',letterSpacing:6,marginBottom:8,animation:'throb 3s ease-in-out infinite'}}>⛧ GOD KILLER ⛧</div>}
              ⛧ Enter the Vestibule ⛧
            </button>
            {loadGame()&&<button onClick={handleContinueSave}
              style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,letterSpacing:8,color:'var(--text-gold)',
                background:'rgba(60,40,0,0.3)',border:'2px solid #c8a020',borderRadius:8,
                padding:'16px 60px',cursor:'pointer',textTransform:'uppercase',
                textShadow:'0 0 20px rgba(200,150,0,0.5)',
                boxShadow:'0 0 30px rgba(200,150,0,0.2)',
                transition:'all 0.2s',marginBottom:8}}>
              ⛧ Continue Run ⛧
            </button>}
          </>)}

          {/* Menu buttons row */}
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>setMenuView('unlocks')}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'var(--text-gold)',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(200,140,30,0.5)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              🔓 Unlocks ({earned.length}/77)
            </button>
            <button onClick={()=>setMenuView('rules')}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'var(--text-secondary)',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(160,120,40,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              📜 Rules
            </button>
            <button onClick={()=>setMenuView('options')}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'var(--text-secondary)',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(120,100,50,0.3)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              ⚙ Options
            </button>
            <button onClick={()=>setShowTrophies(true)}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'var(--text-blood)',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(180,50,50,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              💀 Trophies ({Object.keys(getTrophyData()).length}/28)
            </button>
            <button onClick={()=>setShowCollection(true)}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'var(--text-secondary)',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(200,160,40,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              📀 Collection
            </button>
            <button onClick={()=>setShowStats(true)}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:21,letterSpacing:4,color:'var(--text-secondary)',
                background:'rgba(40,25,5,0.5)',border:'1px solid rgba(120,160,200,0.4)',borderRadius:6,
                padding:'14px 36px',cursor:'pointer',textTransform:'uppercase'}}>
              📊 Stats
            </button>
          </div>

          {/* Stake + Deck selection */}
          <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:10,alignItems:'center'}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase'}}>Difficulty Stake</div>
            <div style={{display:'flex',gap:8}}>
              {STAKES.map((sk,i)=>{
                const unlocked=getUnlockedStakes(selectedDeck).some(u=>u.id===sk.id)
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
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:activeStake.color,fontStyle:'italic',textAlign:'center',maxWidth:500}}>{activeStake.desc}{activeStake.scoreMult>1?' Score ×'+activeStake.scoreMult:''}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',letterSpacing:3,textTransform:'uppercase',marginTop:6}}>Deck</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',maxWidth:760}}>
              {STARTER_DECKS.map((dk,di)=>{
                const dkUnlocked=getUnlockedDecks().some(x=>x.id===dk.id)
                const dkActive=selectedDeck===dk.id
                const seals=getStakesBeaten(dk.id)
                const prevName=di>0?STARTER_DECKS[di-1].name.replace(/^[^ ]+ /,''):''
                return <div key={dk.id} onClick={()=>{if(!dkUnlocked)return
                    setSelectedDeck(dk.id);localStorage.setItem('vst_active_deck',dk.id)
                    const un=getUnlockedStakes(dk.id)
                    if(!un.some(u=>u.id===activeStakeId)){const top=un[un.length-1].id;setActiveStakeId(top);localStorage.setItem('vst_active_stake',top)}}}
                  title={dkUnlocked?dk.desc:('Beat '+prevName+' to unlock')}
                  style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,minWidth:104,textAlign:'center',
                    color:dkActive?'#000':dkUnlocked?(dk.color||'var(--ink-bone)'):'#6a5a30',
                    background:dkActive?(dk.color||'#c8a040'):'rgba(20,12,4,0.6)',
                    border:'2px solid '+(dkUnlocked?(dk.color||'#c8a040'):'rgba(60,40,15,0.3)'),
                    borderRadius:6,padding:'7px 10px',cursor:dkUnlocked?'pointer':'default',
                    opacity:dkUnlocked?1:0.4,letterSpacing:1,transition:'all 0.15s',
                    boxShadow:dkActive?'0 0 16px '+(dk.color||'#c8a040')+'66':'none'}}>
                  <div>{dkUnlocked?(dk.emoji+' '+dk.name.replace(/^[^ ]+ /,'')):'🔒 ???'}</div>
                  <div style={{display:'flex',gap:2,justifyContent:'center',marginTop:3,minHeight:12}}>
                    {STAKES.map(sk=>seals.includes(sk.id)&&<span key={sk.id} title={sk.name+' conquered'} style={{fontSize:13,color:dkActive?'#000':sk.color,textShadow:dkActive?'none':'0 0 4px '+sk.color}}>⛧</span>)}
                  </div>
                </div>})}
            </div>
            {/* HEAT — earned permanent difficulty/score modifier. +1 per Lucifer kill, +15% boss HP per level. */}
            {(()=>{const heat=parseInt(localStorage.getItem('vst_heat')||'1');const hpBonus=Math.round((heat-1)*15);const maxHeat=10;return(
              <div title={"Beat Lucifer to raise Heat. Each level: +15% boss HP. Higher Heat = harder fights, bigger bragging rights."} style={{marginTop:8,display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 16px',background:'rgba(40,15,5,0.6)',border:'1px solid rgba(255,100,30,0.3)',borderRadius:6,cursor:'help'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'rgba(255,140,40,0.9)',letterSpacing:3,textTransform:'uppercase',fontWeight:900}}>🔥 Heat</span>
                  <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:heat>=10?'var(--text-blood)':heat>=5?'rgba(255,140,40,1)':'var(--text-gold)',letterSpacing:1,fontWeight:900,textShadow:heat>=5?'0 0 8px rgba(255,140,40,0.6)':'none'}}>{heat} / {maxHeat}</span>
                  {hpBonus>0&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',letterSpacing:1,fontWeight:700}}>· +{hpBonus}% Boss HP</span>}
                </div>
                {/* Pip row — filled = earned, dim = locked */}
                <div style={{display:'flex',gap:3}}>
                  {Array.from({length:maxHeat}).map((_,i)=>(
                    <div key={i} style={{width:14,height:14,borderRadius:2,background:i<heat?(i>=4?'rgba(255,80,30,0.95)':'rgba(255,160,40,0.85)'):'rgba(40,25,15,0.6)',border:'1px solid '+(i<heat?'rgba(255,140,40,0.7)':'rgba(80,55,25,0.4)'),boxShadow:i<heat?'0 0 6px rgba(255,120,40,0.4)':'none'}}/>
                  ))}
                </div>
                {heat<maxHeat&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',letterSpacing:0.5,opacity:0.75}}>Beat Lucifer to raise Heat</div>}
                {heat>=maxHeat&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-blood)',letterSpacing:2,fontWeight:900,textShadow:'0 0 8px rgba(196,30,58,0.6)'}}>⛧ MAX HEAT ⛧</div>}
              </div>
            )})()}
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
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:110,color:'var(--text-blood)',textShadow:'0 0 60px rgba(200,0,0,0.8),0 0 120px rgba(150,0,0,0.5),0 0 200px rgba(100,0,0,0.3),4px 4px 0 #000',letterSpacing:12,lineHeight:1}}>⛧ THE DEVIL IS DEAD ⛧</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:32,color:'var(--text-primary)',marginTop:16,animation:'fadeIn 2s ease 0.5s both',fontStyle:'italic',textShadow:'0 0 20px rgba(200,160,60,0.5)'}}>Your band survived the 9 Circles of Hell</div>
      </div>}
      {/* Phase 3: Band members rise */}
      {victoryCinematic.phase>=3&&<div style={{display:'flex',gap:24,marginTop:20,animation:'fadeIn 1s ease'}}>
        {victoryCinematic.bandNames.map((name,i)=>(
          <div key={i} style={{textAlign:'center',animation:'fadeIn 0.5s ease '+(i*0.3)+'s both'}}>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:26,color:'var(--text-gold)',textShadow:'0 0 20px rgba(255,215,0,0.6)',letterSpacing:2}}>{name}</div>
            <div style={{fontSize:13,color:'var(--text-gold)',marginTop:4}}>★</div>
          </div>
        ))}
      </div>}
      {/* Phase 4: Stake unlocked + click to continue */}
      {victoryCinematic.phase>=4&&<div style={{animation:'fadeIn 1s ease',textAlign:'center',marginTop:24}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'var(--text-gold)',letterSpacing:4,textShadow:'0 0 20px rgba(200,140,0,0.6)'}}>⛧ {victoryCinematic.stakeName.toUpperCase()} CONQUERED ⛧</div>
        {STAKE_UNLOCKS[victoryCinematic.stakeId]&&<div style={{marginTop:16,animation:'fadeIn 0.8s ease 0.3s both'}}>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',letterSpacing:2}}>REWARD UNLOCKED</div>
          <div style={{fontSize:56,marginTop:8,filter:'drop-shadow(0 0 20px '+STAKE_UNLOCKS[victoryCinematic.stakeId].color+')'}}>{STAKE_UNLOCKS[victoryCinematic.stakeId].emoji}</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:32,color:STAKE_UNLOCKS[victoryCinematic.stakeId].color,marginTop:4,textShadow:'0 0 20px '+STAKE_UNLOCKS[victoryCinematic.stakeId].color+'66'}}>{STAKE_UNLOCKS[victoryCinematic.stakeId].name}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',marginTop:6,fontStyle:'italic'}}>{STAKE_UNLOCKS[victoryCinematic.stakeId].desc}</div>
        </div>}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-secondary)',marginTop:16,fontStyle:'italic',cursor:'pointer'}} onClick={()=>{setVictoryCinematic(null);setCreditsRoll(true)}}>Click anywhere to continue</div>
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
          <div key={i} style={{textAlign:'center',padding:'8px 0',fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--ink-dim)',fontStyle:'italic',lineHeight:1.6}}>{t}</div>
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
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:26,color:'var(--text-secondary)',fontStyle:'italic',textAlign:'center',maxWidth:900}}>Your band escaped Hell. But someone is waiting at the gate.</div>
      <div style={{width:200,height:3,background:'linear-gradient(90deg,transparent,#c8a040,transparent)',margin:'8px 0'}}/>
      <div style={{fontSize:80,marginBottom:8}}>🕴</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-secondary)',textAlign:'center',maxWidth:900,lineHeight:1.6,fontStyle:'italic'}}>
        "Congratulations. Truly impressive. But per your contract, you owe us one more album. Care to... renegotiate?"
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',textAlign:'center',marginTop:4}}>— The Executive</div>
      <div style={{display:'flex',gap:30,marginTop:24}}>
        <button onClick={()=>{
          setWelcomeToHell('shopping')
          setShopCards(genShopCards(9))
          setBoosterPacks(genBoosterPacks(9))
          setRecruitPack(genRecruitPack(26))
          setShroomsInStock(Math.random()<0.50)
          setDMTInStock(false)
          setAcidInStock(Math.random()<0.50)
          setShopBoughtIds([]);setShopSoldIds([]);setCircleCartBought(false);setCirCleCpasBought(false);setRecruitBought(false);setRerollCost(2);setBoughtPackIds([]);setPawnSalesLeft(2) // v0.7.3
          setGameState('shop')
        }}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,letterSpacing:4,padding:'16px 40px',background:'rgba(130,0,0,0.4)',border:'2px solid #cc1111',borderRadius:6,color:'var(--text-blood)',cursor:'pointer',textShadow:'0 0 14px rgba(200,0,0,0.6)',boxShadow:'0 0 25px rgba(180,0,0,0.4)',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,0,0,0.5)';e.currentTarget.style.boxShadow='0 0 40px rgba(200,0,0,0.6)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(130,0,0,0.4)';e.currentTarget.style.boxShadow='0 0 25px rgba(180,0,0,0.4)'}}>
          ⛧ ENTER WELCOME TO HELL ⛧
        </button>
        <button onClick={()=>{setWelcomeToHell(null);clearSave();setGameState('end')}}
          style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:3,padding:'16px 32px',background:'transparent',border:'1px solid #554422',borderRadius:6,color:'var(--text-muted)',cursor:'pointer',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='#c8a040';e.currentTarget.style.borderColor='#c8a040'}}
          onMouseLeave={e=>{e.currentTarget.style.color='#886644';e.currentTarget.style.borderColor='#554422'}}>
          Walk Away — End Run
        </button>
      </div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',marginTop:12,fontStyle:'italic'}}>Your Lucifer victory is already saved. No penalty for losing.</div>
    </div>
  )

  if(welcomeToHell==='cutscene')return(
    <div style={{width:1920,height:1080,position:'relative',background:'#050302',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20}}>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--text-blood)',textShadow:'0 0 40px rgba(180,0,0,0.6),3px 3px 0 #000',letterSpacing:10}}>WELCOME TO HELL</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:32,color:'var(--text-primary)',fontStyle:'italic'}}>The Second Album</div>
      <div style={{fontSize:100,marginTop:16}}>🕴</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-secondary)',letterSpacing:2}}>THE EXECUTIVE — 100,000 HP</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',fontStyle:'italic'}}>The real Devil wears a suit.</div>
      <div style={{width:300,height:6,background:'rgba(200,0,0,0.3)',borderRadius:3,marginTop:12,overflow:'hidden'}}>
        <div style={{height:'100%',background:'#cc1111',animation:'loadBar 2.5s ease-in-out forwards',width:0}}/>
      </div>
    </div>
  )

  // ── SECOND ALBUM VICTORY CINEMATIC (v0.7.12) ──
  // Plays for ~5s when player defeats The Executive in the Welcome to Hell
  // post-game. Held until setTimeout in triggerVictory transitions to 'end'.
  // Aug 4 2026 (phase 1): `welcomeToHell` is NEVER cleared — it stays 'won' so
  // EndScreen can read secondAlbumWin. Without the gameState guard this return
  // sat above the `gameState==='end'` return and rendered forever: no button,
  // no timer, no key handler. HARD FREEZE, reload-only escape. Gate on
  // gameState so triggerVictory's setGameState('end') actually lands, and let a
  // click skip the wait in case the timer is ever lost.
  if(welcomeToHell==='won'&&gameState!=='end')return(
    <div onClick={()=>{clearSave();setGameState('end')}} style={{width:1920,height:1080,position:'relative',background:'radial-gradient(ellipse at center, #1a0a04 0%, #050302 60%, #000 100%)',overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,cursor:'pointer'}}>
      {/* Gold sunburst behind crown */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center, rgba(232,168,32,0.22) 0%, transparent 50%)',animation:'fadeIn 1.2s ease',pointerEvents:'none'}}/>
      {/* Border frame — gold */}
      <div style={{position:'absolute',inset:24,border:'3px double rgba(232,168,32,0.55)',boxShadow:'inset 0 0 120px rgba(232,168,32,0.25)',borderRadius:4,pointerEvents:'none'}}/>

      {/* Tiny preamble */}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-rust)',letterSpacing:14,textTransform:'uppercase',opacity:0.85,animation:'fadeIn 0.6s ease'}}>⛧ The Executive Falls ⛧</div>

      {/* Big slamming title */}
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:108,color:'var(--gold)',letterSpacing:14,textShadow:'0 0 40px rgba(232,168,32,0.95), 0 0 90px rgba(232,168,32,0.5), 4px 4px 0 #000',animation:'slamScale 1.1s ease forwards',textAlign:'center',lineHeight:1}}>THE SECOND</div>
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:144,color:'var(--ink-bone)',letterSpacing:18,textShadow:'0 0 50px rgba(232,168,32,0.95), 0 0 120px rgba(196,30,58,0.6), 6px 6px 0 #000',animation:'slamScale 1.4s ease 0.2s both',textAlign:'center',lineHeight:1}}>ALBUM</div>

      {/* Crown */}
      <div style={{fontSize:120,filter:'drop-shadow(0 0 60px rgba(232,168,32,0.95))',animation:'slamScale 1.2s ease 0.5s both, throb 2.4s ease-in-out 1.7s infinite'}}>👑</div>

      {/* Tagline */}
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:30,color:'var(--text-primary)',fontStyle:'italic',animation:'fadeIn 1.6s ease 1.2s both',textAlign:'center',maxWidth:1400,lineHeight:1.3,padding:'0 60px'}}>You signed in blood. You played anyway. You bled the suit dry.</div>

      {/* Stake unlock */}
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--gold)',letterSpacing:6,marginTop:12,animation:'fadeIn 1.8s ease 2.2s both',textTransform:'uppercase'}}>⛧ Stake Unlocked: <span style={{color:'var(--ink-bone)'}}>Second Album</span> ⛧</div>

      {/* Subtle bottom hint */}
      <div style={{position:'absolute',bottom:48,fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-dim)',letterSpacing:8,opacity:0.6,animation:'fadeIn 2s ease 3.5s both',textTransform:'uppercase'}}>Returning to the void... (click to continue)</div>
    </div>
  )

  if(firstTip)return(
    <div style={{width:1920,height:1080,position:'relative',overflow:'hidden',background:'#040201',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:550,background:'linear-gradient(180deg,#1a1208,#0a0704)',border:'3px solid #e8a820',borderRadius:12,padding:'32px 40px',textAlign:'center',boxShadow:'0 0 60px rgba(232,168,32,0.4)'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:'var(--text-gold)',letterSpacing:4,textTransform:'uppercase',marginBottom:12}}>New Mechanic</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,color:'var(--text-primary)',lineHeight:1.6,marginBottom:20}}>{firstTip.text}</div>
        <button onClick={()=>setFirstTip(null)} style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,letterSpacing:4,color:'var(--text-gold)',background:'rgba(232,168,32,0.15)',border:'2px solid #e8a820',borderRadius:6,padding:'10px 40px',cursor:'pointer',textTransform:'uppercase'}}>Got it</button>
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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--ink-dim)',fontStyle:'italic',letterSpacing:0.5,marginTop:2}}>Choose your path. Skipping a fight forfeits its shop.</div>
        {/* HANGOVER PREVIEW (v0.7.1) — shows the cost the player carries into the next fight + shop */}
        {hangover>0&&<div style={{
          marginTop:8,padding:'8px 18px',borderRadius:6,
          background:'linear-gradient(180deg, rgba(120,0,30,0.35), rgba(60,0,15,0.45))',
          border:'1px solid '+(hangover>=100?'var(--blood)':hangover>=75?'#a41528':'var(--ink-rust)'),
          fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-bone)',
          letterSpacing:1,textAlign:'center',lineHeight:1.5,
          boxShadow:hangover>=75?'0 0 12px rgba(196,30,58,0.4)':'none'}}>
          🥴 Hangover: <b>{hangover}%</b> · Next shop +{hangover>=100?60:hangover>=75?40:hangover>=50?20:0}% · Members -{Math.min(3,Math.floor(hangover/33))} max HP
        </div>}
        {bestRunCircle>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:3,marginTop:2,textTransform:'uppercase'}}>Personal Best: Circle {bestRunCircle} {Math.floor(fightIndex/3)+1>bestRunCircle?'✔':''}</div>}
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
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:4,textTransform:'uppercase',color:isSkipped?'#88dd88':isBoss?'var(--blood)':'var(--gold)',textShadow:isBoss?'0 0 12px rgba(196,30,58,0.6)':'none'}}>{isSkipped?'✓ Skipped':isBoss?'⛧ Boss Fight ⛧':'Fight '+(i+1)+' of 3'}</div>
                <div style={{fontSize:56,marginTop:2,filter:isBoss?'drop-shadow(0 0 14px rgba(196,30,58,0.55))':'drop-shadow(0 0 10px rgba(200,152,56,0.3))'}}>{BOSS_PORTRAITS[enemy.id]?<img src={BOSS_PORTRAITS[enemy.id]} alt={enemy.name} style={{width:56,height:56,objectFit:'contain',imageRendering:'pixelated'}}/>:enemy.emoji}</div>
                <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:isBoss?'var(--blood)':'var(--ink-bone)',textShadow:isBoss?'0 0 18px rgba(196,30,58,0.6)':'0 0 12px rgba(232,216,184,0.3)',letterSpacing:2,textAlign:'center'}}>{enemy.name}</div>
                <svg width="220" height="8" viewBox="0 0 220 8">
                  <path d="M 8 4 Q 60 1, 110 4 T 212 4" stroke={isBoss?'var(--blood)':'var(--gold)'} strokeWidth="1.1" fill="none" opacity="0.7"/>
                </svg>
                {/* HP parchment scroll */}
                <div style={{position:'relative',padding:'4px 18px',background:'linear-gradient(180deg, rgba(60,35,10,0.6), rgba(30,18,5,0.75))',border:'1px solid var(--gold-deep)',borderRadius:3,
                  boxShadow:'inset 0 0 8px rgba(0,0,0,0.5)'}}>
                  <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,fontWeight:900,color:'var(--gold)',letterSpacing:2}}>{getScaledMaxHp(enemy)} HP</span>
                </div>
                {isSkipped&&reward&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--text-positive)',marginTop:2,fontStyle:'italic',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>{reward.emoji==='🌿'?<WeedLeaf size={18}/>:reward.emoji} {reward.name}</div>}
                {/* Select-this-path tooltip */}
                {!isSkipped&&<div data-pathtip="" style={{position:'absolute',bottom:-22,left:'50%',transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',opacity:0,transition:'opacity 0.18s',pointerEvents:'none',whiteSpace:'nowrap',textShadow:'0 0 10px rgba(200,152,56,0.8)'}}>↓ Select This Path</div>}
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
                  <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',width:26,height:26,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%, #d83030, #8a0818 60%, #4a0610)',border:'1px solid rgba(0,0,0,0.7)',boxShadow:'0 2px 4px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,150,140,0.3)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'rgba(30,5,5,0.85)',display:'flex',alignItems:'center',justifyContent:'center'}}>⛧</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',letterSpacing:3,textTransform:'uppercase',marginTop:4}}>Skip & Take Reward</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,color:'var(--ink-bone)',fontStyle:'italic',marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>{reward.emoji==='🌿'?<WeedLeaf size={18}/>:reward.emoji} {reward.name}</div>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',fontStyle:'italic',marginTop:3,lineHeight:1.3}}>{REWARD_TIPS[reward.id]||''}</div>
                </div>
              )}
              {canSkip&&isSkipped&&(
                <div onClick={(e)=>{e.stopPropagation();setDescentData(p=>({...p,skips:p.skips.filter(s=>s!==i)}))}}
                  style={{marginTop:10,transform:'rotate('+envelopeRot+'deg)',
                    background:'rgba(40,80,20,0.15)',border:'2px solid rgba(120,170,80,0.5)',borderRadius:'3px 3px 10px 10px',padding:'8px 16px',cursor:'pointer',textAlign:'center'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(80,40,20,0.3)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(40,80,20,0.15)'}}>
                  <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:2,textTransform:'uppercase'}}>Undo Skip</div>
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
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:56,color:'var(--text-gold)',textShadow:'0 0 40px rgba(200,140,0,0.6),0 0 80px rgba(150,100,0,0.3),3px 3px 0 #000',letterSpacing:8,animation:'fadeSlideUp 0.6s ease-out'}}>⛧ The Pact ⛧</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'var(--text-secondary)',fontStyle:'italic',animation:'fadeSlideUp 0.6s ease-out 0.2s both'}}>Choose your reward. The other is lost to the Void.</div>
      {chosenPacts.length>0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:2}}>Current: {chosenPacts.map(p=>{const pr=PACT_REWARDS.find(r=>r.id===p);return pr?pr.emoji:'⛧'}).join(' ')}</div>}
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
            playSfx('pact');showFirstTimeTip('pact','Pacts are permanent buffs. Choose wisely — you only get one per circle boss!',addLog);addLog('⛧ Pact chosen: '+pact.emoji+' '+pact.name)
            setGameState('campfire')
          }}
            style={{width:280,background:'linear-gradient(180deg,#1a1008,#0a0604)',border:'2px solid rgba(200,140,20,0.5)',borderRadius:10,padding:'30px 24px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:12,
              transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-8px) scale(1.05)';e.currentTarget.style.borderColor=pact.color;e.currentTarget.style.boxShadow='0 8px 40px '+pact.color+'44'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='rgba(200,140,20,0.5)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.8)'}}>
            <div style={{fontSize:64,filter:`drop-shadow(0 0 20px ${pact.color})`}}>{pact.emoji}</div>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:28,color:pact.color,textShadow:`0 0 20px ${pact.color}66`,textAlign:'center',letterSpacing:2}}>{pact.name}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-secondary)',textAlign:'center',lineHeight:1.5}}>{pact.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={()=>{if(window.confirm('Skip this Pact? The other option is lost forever.'))setGameState('campfire')}}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:4,color:'var(--text-muted)',background:'rgba(40,20,5,0.4)',border:'1px solid #444',borderRadius:6,padding:'10px 32px',cursor:'pointer',marginTop:16,transition:'all 0.15s'}}
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
      <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:50,color:'var(--text-gold)',textShadow:'0 0 40px rgba(255,120,0,0.6),0 0 80px rgba(200,80,0,0.3),3px 3px 0 #000',letterSpacing:6}}>The Doom Forge</div>
      <div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'var(--text-secondary)',fontStyle:'italic'}}>Every riff can be heavier.</div>
      <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',letterSpacing:2}}>UPGRADES THIS RUN: {upgradedCards.length}</div>
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
            <div style={{textAlign:'center',padding:'14px 0',display:'flex',justifyContent:'center'}}><CardArtImg id={c.id} emoji={c.emoji} size={56}/></div>
            <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:20,color:'var(--text-gold)',textAlign:'center',letterSpacing:1}}>{c.name}+</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,textAlign:'center',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>{c.type} {c.rarity}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)',textAlign:'center',lineHeight:1.5,padding:'0 12px'}}>{up.desc}</div>
            {hasHp&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',textAlign:'center',marginTop:6,fontWeight:900}}>+{up.hpAmt} MAX HP ({up.hp})</div>}
          </div>
        })}
        {uniqueUpgradeable.length===0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'var(--text-muted)',fontStyle:'italic',padding:40}}>All cards already upgraded!</div>}
      </div>
      <button onClick={()=>setGameState('shop')}
        style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,letterSpacing:4,color:'var(--text-muted)',background:'rgba(40,20,5,0.4)',border:'1px solid #444',borderRadius:6,padding:'10px 32px',cursor:'pointer',flexShrink:0,transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.color='#cc8040';e.currentTarget.style.borderColor='#cc8040'}}
        onMouseLeave={e=>{e.currentTarget.style.color='#666';e.currentTarget.style.borderColor='#444'}}>
        Skip Upgrade</button>
    </div>
  )}
  if(victorySummary)return <VictorySummaryScreen summary={victorySummary} onContinue={continueVictorySummary}/>
  if(demonicConflict)return <DemonicConflictScreen conflict={demonicConflict} onChoice={handleDemonicChoice}/>
  if(gameState==='recruit')return <RecruitScreen candidates={recruitCandidates} stage={stage} onPick={handleRecruitPick} onPass={handleRecruitPass} onFireMember={handlePawnSellMember} stash={stash} salesLeft={pawnSalesLeft}/>
  if(gameState==='shop')return <ShopScreen stash={stash} onSpend={handleShopSpend} stake={activeStake} pawnSalesLeft={pawnSalesLeft} boughtPackIds={boughtPackIds} onMarkPackBought={(id)=>setBoughtPackIds(p=>p.includes(id)?p:[...p,id])} onSwapMembers={(i,j)=>setStage(p=>{const n=[...p];const t=n[i];n[i]=n[j];n[j]=t;return n})} corruption={corruption} hangover={hangover} chosenPacts={chosenPacts} addLog={addLog} onLeave={handleShopLeave} circleArtifact={circleArtifact} circlePassive={circlePassive} recruitPack={recruitPack} recruitBought={recruitBought} onMarkRecruitBought={()=>setRecruitBought(true)} shopCards={shopCards} boosterPacks={boosterPacks} rerollCost={rerollCost} onReroll={handleReroll} fightIndex={fightIndex} activeArtifacts={activeArtifacts} activePassives={activePassives} starterArtifacts={STARTER_ARTIFACTS} starterPassives={STARTER_PASSIVES} stage={stage} deck={deck} discardPile={discardPile} onPawnSellMember={handlePawnSellMember} onPawnSellCard={handlePawnSellCard} onPawnBurnCard={handlePawnBurnCard} soldIds={shopSoldIds} onMarkSold={(id)=>setShopSoldIds(p=>[...p,id])} circleCartBought={circleCartBought} circleCpasBought={circleCpasBought} onBuyCart={()=>setCircleCartBought(true)} onBuyCpas={()=>setCirCleCpasBought(true)} heldShrooms={heldShrooms} heldAcid={heldAcid} heldDMT={heldDMT} shroomsInStock={shroomsInStock} acidInStock={acidInStock} dmtInStock={dmtInStock} onBuyShrooms={()=>setHeldShrooms(p=>p+1)} onBuyAcid={()=>setHeldAcid(p=>p+1)} onBuyDMT={()=>setHeldDMT(p=>p+1)} encoreMode={encoreMode}/>
  if(gameState==='end')return <div style={{width:1920,height:1080,position:'relative',overflow:'hidden'}}><EndScreen won={won} cause={deathCause} fullRunLog={fullRunLogRef.current} newTrophies={newTrophies} enemy={enemy} stats={stats} seed={runSeed} onReset={handleReset} onEncore={handleEncore} streakWins={streakWins} streakLosses={streakLosses} totalRuns={totalRunsPlayed} isDailyRun={isDailyRun} chosenPacts={chosenPacts} onDailyChallenge={()=>{setRunSeed(getDailySeed());setIsDailyRun(true);handleReset()}} devDailyScore={6666} personalBest={personalBest} dailyStreak={dailyStreak} lifetimeScore={lifetimeScore} discovered={discovered} newAchievements={newAchievements} enemyHp={enemyHp} stage={stage} runElapsed={Math.floor((Date.now()-runStartTimeRef.current)/1000)} lastKillingBlow={lastKillingBlow} secondAlbumWin={welcomeToHell==='won'} contractsPlayed={contractsPlayed}/></div>

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
          {/* Threshold markers — the two real breakpoints. 50% = BUZZED (CORRUPT
              multiplier active), 100% = WASTED (max multiplier + max hangover next
              fight). Earlier 25/75 ticks taught false thresholds and were removed
              in the v0.7.1 Hangover refactor. */}
          {[50,100].map(t=><div key={t} style={{position:'absolute',left:-3,right:-3,bottom:t+'%',height:t===100?2:1,
            background:corruption>=t?(t===100?'var(--blood)':'#c41e3a'):'rgba(90,56,32,0.45)',
            boxShadow:corruption>=t&&t===100?'0 0 8px rgba(196,30,58,0.8)':'none',zIndex:3}}>
            <div style={{position:'absolute',right:'100%',top:-9,fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,
              color:corruption>=t?'var(--blood)':'var(--rot)',textShadow:'0 0 4px rgba(0,0,0,0.95)',paddingRight:6,whiteSpace:'nowrap'}}>
              {t===50?'⚠':'⛧'}
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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,marginTop:6,textAlign:'center',
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
        fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:6,textTransform:'uppercase',
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
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-primary)',textAlign:'center',letterSpacing:0.5}}>{fc.name}</div>
          <div style={{fontSize:13,fontWeight:900,color:bc,letterSpacing:2,textTransform:'uppercase'}}>{fc.type}</div>
        </div>
      })()}
      {/* ═══ ECHOPLEX / LOOPER / SABBATH REPLAY ANIMATIONS ═══
          Each replay renders a card flying from member slot to boss with:
          - Polychrome rainbow trail (RGB chromatic aberration via 3 color layers)
          - Pulsing glow halo in pedal-kind color
          - Particle tracers behind the card
          - Card itself with shimmer animation and the card's emoji + name */}
      {echoplexReplays.map(function(rp){
        const tc=rp.cardType==='RIFF'?'#9933cc':rp.cardType==='CORRUPT'?'#aa1111':rp.cardType==='UTILITY'?'#22aa44':'#c87820'
        const kc=rp.kind==='echoplex'?'#ff8800':rp.kind==='looper'?'#44aaff':'#bb44ff'
        const dx=rp.toX-rp.fromX
        const dy=rp.toY-rp.fromY
        const cssVars={'--epx-dx':dx+'px','--epx-dy':dy+'px','--epx-from-x':rp.fromX+'px','--epx-from-y':rp.fromY+'px','--epx-to-x':rp.toX+'px','--epx-to-y':rp.toY+'px','--epx-tc':tc,'--epx-kc':kc}
        return (<div key={rp.key} style={Object.assign({position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:9100,overflow:'visible'},cssVars)}>
          {/* Rainbow tracer trail — 5 lagging echoes in shifting hues */}
          {[0,1,2,3,4].map(function(i){
            const hue=(i*72)  // 0,72,144,216,288 — full rainbow
            const trailDelay=i*60  // ms stagger
            return (<div key={'trail-'+i} style={{
              position:'absolute',left:rp.fromX,top:rp.fromY,
              width:96,height:132,
              transform:'translate(-50%,-50%)',
              background:'linear-gradient(180deg,hsla('+hue+',95%,55%,0.55) 0%,hsla('+((hue+30)%360)+',95%,45%,0.35) 100%)',
              border:'2px solid hsla('+hue+',95%,65%,0.75)',
              borderRadius:8,
              filter:'blur('+(3+i*1.2)+'px) saturate(1.6)',
              boxShadow:'0 0 '+(20+i*8)+'px hsla('+hue+',95%,55%,0.7), 0 0 '+(40+i*12)+'px hsla('+hue+',95%,55%,0.4)',
              animation:'echoplexTrail 1.2s cubic-bezier(0.4,0.05,0.4,0.98) '+trailDelay+'ms forwards',
              opacity:0.9-i*0.13,
              mixBlendMode:'screen'
            }}/>)
          })}
          {/* Chromatic aberration: red/cyan offset ghost cards */}
          <div style={{
            position:'absolute',left:rp.fromX,top:rp.fromY,
            transform:'translate(-50%,-50%)',
            width:128,height:178,
            background:'rgba(255,40,40,0.5)',border:'3px solid rgba(255,80,80,0.85)',borderRadius:8,
            filter:'blur(2px)',
            boxShadow:'0 0 30px rgba(255,40,40,0.7)',
            animation:'echoplexCardChromaR 1.2s cubic-bezier(0.3,0.05,0.4,0.98) forwards',
            mixBlendMode:'screen'
          }}/>
          <div style={{
            position:'absolute',left:rp.fromX,top:rp.fromY,
            transform:'translate(-50%,-50%)',
            width:128,height:178,
            background:'rgba(40,255,255,0.5)',border:'3px solid rgba(80,255,255,0.85)',borderRadius:8,
            filter:'blur(2px)',
            boxShadow:'0 0 30px rgba(40,255,255,0.7)',
            animation:'echoplexCardChromaB 1.2s cubic-bezier(0.3,0.05,0.4,0.98) forwards',
            mixBlendMode:'screen'
          }}/>
          {/* MAIN card layer — centered between chroma ghosts */}
          <div style={{
            position:'absolute',left:rp.fromX,top:rp.fromY,
            transform:'translate(-50%,-50%)',
            width:128,height:178,
            background:'linear-gradient(180deg,#201408,#100804)',
            border:'3px solid '+tc,borderRadius:8,
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,
            boxShadow:'0 0 40px '+kc+', 0 0 80px '+kc+'aa, 0 0 120px '+tc+'66',
            animation:'echoplexCardMain 1.2s cubic-bezier(0.3,0.05,0.4,0.98) forwards',
            zIndex:2
          }}>
            <div style={{fontSize:42,filter:'drop-shadow(0 0 12px '+kc+')'}}>{rp.cardEmoji}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--ink-bone)',textAlign:'center',padding:'0 6px',lineHeight:1.1}}>{rp.cardName}</div>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:kc,letterSpacing:2,textTransform:'uppercase'}}>{rp.kind==='echoplex'?'🎚 ECHO':rp.kind==='looper'?'♾ LOOP':'🌑 SABBATH'}</div>
          </div>
          {/* Particle tracers — 8 sparks trailing behind the card */}
          {[0,1,2,3,4,5,6,7].map(function(i){
            const sparkDelay=i*40
            const sparkOff=(i%2===0?-1:1)*((i*3)+5)
            return (<div key={'spark-'+i} style={{
              position:'absolute',left:rp.fromX+sparkOff,top:rp.fromY,
              transform:'translate(-50%,-50%)',
              width:4+(i%3),height:4+(i%3),
              borderRadius:'50%',
              background:'hsl('+((i*45+30)%360)+',95%,65%)',
              boxShadow:'0 0 '+(8+i)+'px hsl('+((i*45+30)%360)+',95%,55%), 0 0 '+(16+i*2)+'px hsl('+((i*45+30)%360)+',95%,65%)',
              animation:'echoplexSpark 1.2s cubic-bezier(0.4,0.05,0.4,0.98) '+sparkDelay+'ms forwards',
              opacity:0
            }}/>)
          })}
        </div>)
      })}
      {floats.filter(Boolean).map(f=><Float key={f.id} v={f.v} x={f.x} y={f.y} color={f.color} big={f.big} onDone={()=>remFloat(f.id)}/>)}
      {vfxParticles.map(p=><div key={p.id} className="vfx-particle" style={{left:p.x,top:p.y,width:p.size,height:p.size,background:p.color,boxShadow:'0 0 '+(p.size*2)+'px '+p.color,animation:'vfxDrift '+p.dur+'ms ease-out forwards','--vfx-dx':p.dx+'px','--vfx-dy':p.dy+'px'}}/>)}
      {/* ACHIEVEMENT POLAROID — slides in from right */}
      {polaroidNotif&&<div style={{position:'absolute',top:120,right:40,zIndex:9800,animation:'polaroidSlide 3.5s ease-in-out forwards',pointerEvents:'none'}}>
        <div style={{width:220,background:'#f5f0e8',padding:'12px 12px 40px',borderRadius:2,boxShadow:'0 8px 40px rgba(0,0,0,0.8),0 0 20px rgba(200,152,56,0.3)',transform:'rotate(-3deg)'}}>
          <div style={{background:'linear-gradient(180deg,#1a1008,#0a0604)',width:'100%',height:140,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:1}}>
            <span style={{fontSize:64}}>{polaroidNotif.emoji}</span>
          </div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-inverse)',textAlign:'center',marginTop:12,fontStyle:'italic',lineHeight:1.3,fontWeight:700}}>{polaroidNotif.label}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',textAlign:'center',marginTop:4,letterSpacing:3,textTransform:'uppercase'}}>Achievement Unlocked</div>
        </div>
      </div>}
      {projectiles.filter(Boolean).map(p=><Projectile key={p.id} from={p.from} to={p.to} emoji={p.emoji} onDone={()=>setProjectiles(prev=>prev.filter(x=>x.id!==p.id))} isBoss={p.isBoss}/>)}
      {mvpFlash&&<div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:99995,textAlign:'center',animation:'postStrikeFlash 2s ease-out forwards',pointerEvents:'none'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--text-gold)',letterSpacing:4,textTransform:'uppercase'}}>⭐ MVP ⭐</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:36,color:'var(--text-gold)',textShadow:'0 0 20px rgba(255,215,0,0.6)',letterSpacing:3}}>{mvpFlash.emoji} {mvpFlash.name}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-gold)'}}>{mvpFlash.atk} ATK</div>
      </div>}
      {chainCallout&&<div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:99996,textAlign:'center',animation:'chainSlam 1.2s ease-out forwards',pointerEvents:'none'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:52,fontWeight:900,color:'var(--text-gold)',textShadow:'0 0 30px rgba(255,215,0,0.8),0 0 60px rgba(255,200,0,0.4),0 4px 0 #885500',letterSpacing:8}}>⛧ {chainCallout.toUpperCase()} ⛧</div>
      </div>}
      {postStrikeFlash&&<div style={{position:'absolute',top:'15%',left:'50%',transform:'translateX(-50%)',zIndex:99998,textAlign:'center',animation:'postStrikeFlash 1.8s ease-out forwards',pointerEvents:'none'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:postStrikeFlash.dmg>=5000?42:postStrikeFlash.dmg>=1000?36:28,fontWeight:900,color:postStrikeFlash.isNewBest?'#ffdd00':'#ff8844',textShadow:'0 0 20px rgba(255,100,0,0.8)',letterSpacing:4}}>{postStrikeFlash.dmg.toLocaleString()} DMG</div>
        {postStrikeFlash.mult>1.5&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-gold)',letterSpacing:3}}>×{postStrikeFlash.mult.toFixed(2)} MULTIPLIER</div>}
        {postStrikeFlash.isNewBest&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,color:'var(--text-gold)',letterSpacing:6,marginTop:4,textShadow:'0 0 16px rgba(255,220,0,0.8)'}}>⛧ NEW BEST! ⛧</div>}
      </div>}
      {dmgBreakdown&&<DamageBreakdown key={dmgBreakdown.key||0} data={dmgBreakdown} onSlam={()=>{if(dmgBreakdown._pendingHpDrop)dmgBreakdown._pendingHpDrop()}} onDone={()=>setDmgBreakdown(null)}/>}

      {hellquakeAnim&&<div style={{position:'absolute',inset:0,zIndex:9500,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20,background:'rgba(0,0,0,0.85)',animation:'fadeIn 0.1s ease'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.04) 3px,rgba(255,255,255,0.04) 4px)',animation:'interlaceFlicker 0.08s steps(1) infinite',pointerEvents:'none'}}/>
        <div style={{fontSize:120,animation:'throb 0.3s ease-in-out infinite',filter:`drop-shadow(-4px 0 rgba(255,0,0,0.8)) drop-shadow(4px 0 rgba(0,80,255,0.8))`}}>⛧</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:hellquakeAnim.color,textShadow:`-3px 0 rgba(255,0,0,0.8), 3px 0 rgba(0,80,255,0.7), 0 0 60px ${hellquakeAnim.color},0 0 120px ${hellquakeAnim.color}`,animation:'fadeIn 0.3s ease'}}>{hellquakeAnim.text}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:26,color:'rgba(255,255,255,0.9)',textAlign:'center',maxWidth:600,fontStyle:'italic',textShadow:'0 0 20px rgba(0,0,0,0.9)',animation:'fadeIn 0.5s ease',padding:'0 40px',lineHeight:1.5}}>{hellquakeAnim.desc}</div>
      </div>}
      {/* TRIP EFFECT OVERLAY */}
      {activeTripEffect&&<div style={{position:'absolute',inset:0,zIndex:9600,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,background:'rgba(0,0,0,0.88)',animation:'fadeIn 0.15s ease'}}>
        <div style={{fontSize:100,animation:'throb 0.4s ease-in-out infinite',filter:`drop-shadow(0 0 40px ${activeTripEffect.color})`}}>{activeTripEffect.type==='shrooms'?'🍄':activeTripEffect.type==='dmt'?'💠':'🧪'}</div>
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
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:32,color:'var(--text-primary)',textShadow:'0 0 20px rgba(0,0,0,0.9)',animation:'fadeIn 0.6s ease'}}>
          {luciferCinematic.phase===2?'Phase 2: Satan, Lord of the Flies':'420,666 → '+luciferCinematic.hp+' HP'}</div>
        <div style={{fontFamily:"'ScratchFont',serif",fontSize:22,color:'rgba(255,255,255,0.7)',fontStyle:'italic',animation:'fadeIn 0.8s ease'}}>
          {luciferCinematic.phase===2?'Band fully restored. All strikes reset. Finish this.':'8 Circle Bosses defeated. Their echoes weaken the Devil.'}</div>
      </div>}
      {/* CLUTCH FLASH */}
      {beastFlash&&<div style={{position:'absolute',top:'30%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9700,textAlign:'center',pointerEvents:'none'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--text-blood)',textShadow:'0 0 40px rgba(255,0,0,0.9),0 0 80px rgba(200,0,0,0.6),-3px 0 rgba(255,0,0,0.5),3px 0 rgba(200,0,0,0.5),3px 3px 0 #000',letterSpacing:6,animation:'throb 0.4s ease-in-out infinite'}}>⛧ 6.66 ⛧</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-blood)',letterSpacing:8,textTransform:'uppercase',marginTop:4,textShadow:'0 0 20px rgba(255,0,0,0.7)'}}>MARK OF THE BEAST</div>
      </div>}
      {/* BEAST TIER ENTRY (3.0+) — red radial pulse + center text */}
      {beastTierFlash&&<>
        <div style={{position:'fixed',inset:0,zIndex:9000,pointerEvents:'none',background:'radial-gradient(ellipse at center, transparent 25%, rgba(196,30,58,0.55) 100%)',animation:'beastPulse 0.7s ease-out forwards'}}/>
        <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9100,pointerEvents:'none',textAlign:'center'}}>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--text-primary)',textShadow:'0 0 30px var(--blood),0 0 60px rgba(196,30,58,0.7),3px 3px 0 #000',letterSpacing:8,animation:'popFloat 0.7s ease-out forwards'}}>⛧ BEAST UNLEASHED ⛧</div>
        </div>
      </>}
      
      {corruptionFlash&&<div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9600,textAlign:'center',animation:'fadeIn 0.3s ease',pointerEvents:'none'}}>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:42,color:corruptionFlash.color,textShadow:'0 0 30px '+corruptionFlash.color+',0 0 60px rgba(200,0,60,0.5),2px 2px 0 #000',letterSpacing:4}}>⚠ {corruptionFlash.name} ⚠</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--tier-mythic)',marginTop:6,textShadow:'0 0 10px rgba(0,0,0,0.9)'}}>{corruptionFlash.desc}</div>
      </div>}
      {clutchFlash&&<div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9250,pointerEvents:'none',fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:clutchFlash.color,textShadow:'0 0 40px '+clutchFlash.color+',0 0 80px '+clutchFlash.color+'66,4px 4px 0 #000',letterSpacing:8,animation:'popFloat 2.5s ease-out forwards',textAlign:'center'}}>{clutchFlash.text}</div>}
      {/* BOSS HP MILESTONE FLASH */}
      {milestoneFlash&&<div style={{position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9200,pointerEvents:'none',fontFamily:"'BogartsMetalFont',cursive",fontSize:90,color:milestoneFlash.color,textShadow:'0 0 40px '+milestoneFlash.color+',0 0 80px '+milestoneFlash.color+'66,4px 4px 0 #000',letterSpacing:10,animation:'popFloat 1.8s ease-out forwards'}}>{milestoneFlash.text}</div>}
      {/* DECK / DISCARD VIEWER */}
      {(deckViewOpen||discardViewOpen)&&<div style={{position:'absolute',inset:0,zIndex:9600,background:'rgba(2,1,4,0.95)',display:'flex',flexDirection:'column',alignItems:'center',padding:'30px 40px',overflowY:'auto'}} onClick={()=>{setDeckViewOpen(false);setDiscardViewOpen(false)}}>
        <div onClick={e=>e.stopPropagation()} style={{maxWidth:1200,width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:36,fontWeight:900,color:deckViewOpen?'#c8a040':'#cc4444',textShadow:'0 0 20px '+(deckViewOpen?'rgba(200,160,40,0.4)':'rgba(200,40,40,0.4)')}}>{deckViewOpen?'⛧ Deck — '+deck.length+' Cards':'⛧ Discard Pile — '+discardPile.length+' Cards'}</div>
            <div onClick={()=>{setDeckViewOpen(false);setDiscardViewOpen(false)}} style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--text-blood)',cursor:'pointer',padding:'6px 16px',border:'1px solid #aa2222',borderRadius:4}}>✕ Close</div>
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
                        <CardArtImg id={c.id} emoji={c.emoji} size={20}/>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{c.name}{c.upgraded?' ⛧':''}</div>
                          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)'}}>{c.rarity}{c.embers>0?' · '+c.embers+'🔥':' · FREE'}</div>
                        </div>
                      </div>)}
                      {typeCards.length===0&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',fontStyle:'italic',padding:8}}>none</div>}
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
                <div style={{textAlign:'center',padding:'8px 0',background:'rgba(0,0,0,0.3)',display:'flex',justifyContent:'center'}}><CardArtImg id={c.id} emoji={c.emoji} size={36}/></div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--text-primary)',textAlign:'center',padding:'0 4px'}}>{c.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:bc,textAlign:'center',letterSpacing:1,textTransform:'uppercase'}}>{c.type} · {c.rarity}</div>
                {c.embers>0&&<div style={{display:'flex',justifyContent:'center',marginTop:2}}><div style={{width:18,height:18,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)',border:'1px solid #ff6600',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-primary)'}}>{c.embers}</div></div>}
              </div>
            })}
            {(deckViewOpen?deck:discardPile).length===0&&<div style={{fontFamily:"'ScratchFont',serif",fontSize:20,color:'var(--text-muted)',fontStyle:'italic',padding:40}}>{deckViewOpen?'Deck is empty — all cards in hand or discard.':'Discard pile is empty.'}</div>}
          </div>
        </div>
      </div>}
      {/* MYTHIC UNLOCK OVERLAY — dramatic flash when a hidden mythic unlocks */}
      {mythicUnlockOverlay&&<div style={{position:'absolute',inset:0,zIndex:9999,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:24,animation:'chainGlow 5s ease forwards'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center, rgba(232,168,32,0.35) 0%, rgba(0,0,0,0.85) 65%)',animation:'chainGlow 5s ease forwards'}}/>
        <div style={{position:'absolute',inset:0,border:'8px solid var(--gold)',boxShadow:'inset 0 0 200px rgba(232,168,32,0.55), 0 0 100px rgba(232,168,32,0.7)',animation:'chainGlow 5s ease forwards'}}/>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:42,color:'var(--gold)',letterSpacing:14,textShadow:'0 0 30px rgba(232,168,32,0.9), 0 0 60px rgba(232,168,32,0.6)',zIndex:1,animation:'slamScale 5s ease forwards'}}>⛧ MYTHIC UNLOCKED ⛧</div>
        <div style={{fontSize:160,filter:'drop-shadow(0 0 80px var(--gold))',animation:'slamScale 5s ease forwards',zIndex:1}}>{mythicUnlockOverlay.emoji}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:88,color:'var(--ink-bone)',textShadow:'0 0 40px rgba(232,168,32,0.9), 0 0 80px rgba(196,30,58,0.5), 0 4px 12px rgba(0,0,0,0.95)',letterSpacing:6,zIndex:1,animation:'slamScale 5s ease forwards',textAlign:'center',padding:'0 60px'}}>{mythicUnlockOverlay.name}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:24,color:'var(--gold)',maxWidth:1200,padding:'0 80px',textAlign:'center',letterSpacing:2,zIndex:1,animation:'fadeIn 2.5s ease',lineHeight:1.4}}>{mythicUnlockOverlay.effect}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--ink-rust)',letterSpacing:6,textTransform:'uppercase',zIndex:1,animation:'fadeIn 3.5s ease',marginTop:8}}>Will appear in shops on future runs.</div>
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
        <div style={{fontSize:120,filter:`drop-shadow(0 0 60px ${comboFlash.color})`,animation:'slamScale 3s ease forwards',zIndex:1,marginBottom:0}}>{comboFlash.emoji}</div>
        {/* RIFF CHAIN title — screen-wide */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:96,color:comboFlash.color,textShadow:`0 0 60px ${comboFlash.color},0 0 120px ${comboFlash.color}88,-4px 0 rgba(255,0,0,0.5),4px 0 rgba(0,80,255,0.4),4px 4px 0 #000`,letterSpacing:14,animation:'slamScale 3s ease forwards',zIndex:1}}>⛧ RIFF CHAIN ⛧</div>
        {/* Chain name — BIG */}
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:Math.min(96,48+Math.floor((comboFlash.mult||1)*12)),color:'var(--text-primary)',textShadow:`0 0 40px ${comboFlash.color},0 0 80px ${comboFlash.color}88,4px 4px 0 #000`,letterSpacing:10,animation:'slamScale 3s ease forwards',zIndex:1,marginTop:4}}>{comboFlash.name}</div>
        {/* Card combo — the recipe */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:comboFlash.color,letterSpacing:4,marginTop:10,animation:'slamScale 3s ease forwards',zIndex:1,textShadow:`0 0 20px ${comboFlash.color},2px 2px 0 #000`}}>{comboFlash.card1}  +  {comboFlash.card2}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:Math.min(42,20+Math.floor((comboFlash.mult||1)*6)),fontWeight:900,color:'var(--text-gold)',letterSpacing:6,marginTop:6,animation:'slamScale 3s ease forwards',zIndex:1,textShadow:'0 0 20px rgba(255,200,0,0.8),2px 2px 0 #000'}}>×{(comboFlash.mult||1).toFixed(2)} DAMAGE</div>
        {/* Multiplier — THE money shot, biggest element */}
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:80,fontWeight:900,color:'var(--text-primary)',textShadow:`0 0 40px ${comboFlash.color},0 0 80px rgba(255,200,0,0.6),0 0 120px ${comboFlash.color}44,4px 4px 0 #000`,letterSpacing:6,marginTop:12,animation:'slamScale 3s ease forwards',zIndex:1}}>×{comboFlash.mult?.toFixed(2)||'1.78'}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:20,fontWeight:900,color:comboFlash.color,letterSpacing:8,textTransform:'uppercase',marginTop:4,zIndex:1,textShadow:'0 0 15px rgba(0,0,0,0.95)',animation:'slamScale 3s ease forwards'}}>STRIKE MULTIPLIER</div>
      </div>}
      {/* CIRCLE CLEARED FLASH */}

      {circleClearedData&&<div style={{position:'absolute',inset:0,zIndex:9750,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:0,background:'rgba(0,0,0,0.94)',animation:'fadeIn 0.3s ease'}}>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',opacity:0.06}}>
          <img src={import.meta.env.BASE_URL+"vestibule_logo.png"} alt="" style={{width:864,height:864,objectFit:'contain'}}/>
        </div>
        <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <div style={{fontSize:100,filter:'drop-shadow(0 0 30px rgba(200,0,0,0.6))',animation:'throb 0.6s ease-in-out infinite'}}>{circleClearedData.bossId&&BOSS_PORTRAITS[circleClearedData.bossId]?<img src={BOSS_PORTRAITS[circleClearedData.bossId]} alt={circleClearedData.bossName} style={{width:100,height:100,objectFit:'contain',imageRendering:'pixelated'}}/>:circleClearedData.bossEmoji}</div>
          <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,letterSpacing:6,color:'var(--text-blood)',textTransform:'uppercase'}}>Defeated</div>
          <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:64,color:'var(--text-blood)',textShadow:'0 0 40px rgba(200,0,0,0.7),3px 3px 0 #000',textAlign:'center',lineHeight:1}}>{circleClearedData.bossName}</div>
          <div style={{width:200,height:2,background:'linear-gradient(90deg,transparent,#cc2222,transparent)',margin:'8px 0'}}/>
          {circleClearedData.isBoss&&<div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:48,color:'var(--text-gold)',textShadow:'0 0 30px rgba(200,150,0,0.6),0 0 60px rgba(150,100,0,0.3),3px 3px 0 #000',animation:'fadeIn 0.8s ease'}}>⛧ Circle {circleClearedData.circleName} Cleared ⛧</div>}
          {circleClearedData.isBoss&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--text-blood)',letterSpacing:3,marginTop:8,animation:'fadeIn 1.2s ease'}}>+1 MAX EMBERS</div>}
          {circleClearedData.loot&&<div style={{marginTop:12,padding:'12px 24px',background:'rgba(200,150,0,0.12)',border:'1px solid rgba(200,150,0,0.4)',borderRadius:8,animation:'fadeIn 1.6s ease',display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:40}}>{circleClearedData.loot.emoji}</div>
            <div>
              <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:22,color:'var(--text-gold)',letterSpacing:2}}>{circleClearedData.loot.name}</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-secondary)'}}>{circleClearedData.loot.desc}</div>
            </div>
          </div>}
          {circleClearedData.isBoss&&circleClearedData.circle<9&&(()=>{
            const nc=circleClearedData.circle+1
            const nextEnemies=[ENEMIES[nc*3-3],ENEMIES[nc*3-2],ENEMIES[nc*3-1]]
            return <div style={{marginTop:16,animation:'fadeIn 2s ease',textAlign:'center'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--text-blood)',letterSpacing:3,textTransform:'uppercase'}}>Circle {CIRCLE_NAMES[nc]} Awaits</div>
              <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:6}}>
                {nextEnemies.filter(Boolean).map(e=><div key={e.id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)'}}>
                  {e.emoji} {getScaledMaxHp(e)} HP
                </div>)}
              </div>
            </div>
          })()}
        </div>
      </div>}
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
                else if(pid==='selfImmolate'){dmg=Math.floor(base*(1+0.5*immolateStacks));special='+50% per stack'}
                else if(pid==='bloodlust'){if(enemyHp<(scaledMaxHp||enemy.maxHp)*0.5){dmg=base*2;special='BLOODLUST ×2'}}
                else if(pid==='commands')special='random debuff'
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
        <div style={{position:'relative',zIndex:8,overflow:'visible',flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:stage.length>5?16:50,padding:stage.length>5?'0px 10px 0px 100px':'0px 10px 0px 130px',justifyContent:'center',flex:1,position:'relative'}}>
            <div style={{display:'flex',flexDirection:'column',gap:6,alignSelf:'flex-start',flexShrink:0,background:'rgba(0,0,0,0.22)',borderRadius:'0 6px 6px 0',padding:'6px 10px 6px 10px',borderRight:'1px solid rgba(140,90,20,0.35)',position:'absolute',left:0,top:8}}>
              {[0,1,2].map(i=>{const a=(activeArtifacts||[])[i];return(
                <div key={i} style={{position:'relative'}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-artip]');if(t)t.style.opacity='1'}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-artip]');if(t)t.style.opacity='0'}}>
                  {a?<div style={{width:100,height:108,border:'2px solid rgba(200,140,30,0.65)',borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,background:'linear-gradient(180deg,rgba(40,24,6,0.95),rgba(20,12,3,0.95))',boxShadow:'0 0 14px rgba(200,140,20,0.35),inset 0 0 8px rgba(200,140,20,0.1)',cursor:'help'}}><ArtifactArtImg id={a.id} emoji={a.emoji} size={36} style={{animation:triggeredArtifactId===a.id?'artifactTrigger 0.5s ease-out':'none',transform:triggeredArtifactId===a.id?'scale(1.4)':'scale(1)',transition:'transform 0.15s'}}/><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:0.5,color:'var(--text-secondary)',textTransform:'uppercase',textAlign:'center',lineHeight:1.2,padding:'0 4px'}}>{a.name}</div>{a.mult&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,fontWeight:900,color:'var(--text-gold)',textShadow:'0 0 8px rgba(255,136,0,0.5)'}}>×{a.mult}</div>}</div>
                  :<div style={{width:100,height:108,border:'1px dashed rgba(200,160,50,0.4)',borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,background:'rgba(30,18,4,0.65)'}}><div style={{fontSize:38,opacity:0.45,textShadow:'0 0 12px rgba(255,180,0,0.4)'}}>⛧</div><div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:1.5,color:'rgba(220,170,70,0.65)',textTransform:'uppercase',textAlign:'center',lineHeight:1.2,fontWeight:900}}>Artifact</div></div>}
                  {a&&<div data-artip="" style={{opacity:0,transition:'opacity 0.15s',position:'absolute',left:88,top:0,zIndex:99999,pointerEvents:'none',minWidth:200,maxWidth:280,background:'rgba(12,7,2,0.97)',border:'1px solid rgba(200,140,30,0.6)',borderRadius:6,padding:'8px 10px',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--text-gold)',marginBottom:4}}>{a.emoji} {a.name}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',fontStyle:'italic',lineHeight:1.4}}>{a.effect}</div>
                    {a.mult&&<div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--text-gold)',marginTop:4}}>×{a.mult} MULTIPLIER</div>}
                    {(()=>{const SYNERGIES={a1:['a10'],a10:['a1'],a2:['a6'],a6:['a2'],a5:['a1','a10'],a9:['a5'],ca1:['a1','a2','a10']}
                      const syns=(SYNERGIES[a.id]||[]).map(sid=>activeArtifacts.find(x=>x.id===sid)).filter(Boolean)
                      if(syns.length===0)return null
                      return <div style={{marginTop:4,paddingTop:4,borderTop:'1px solid rgba(200,140,30,0.3)'}}>
                        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>⛧ SYNERGIZES WITH</div>
                        {syns.map(s=><div key={s.id} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-positive)'}}>{s.emoji} {s.name}</div>)}
                      </div>
                    })()}
                  </div>}
                </div>
              )})}
              {/* EFFECT PEDALS (Passives) — exactly 2 slots. Design lock: 3 artifacts + 2 pedals.
                  This forces meaningful build choices. Choose wisely. */}
              {[0,1].map(i=>{const p=(activePassives||[])[i];return(
                <div key={'p'+i} style={{position:'relative'}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-passtip]');if(t)t.style.opacity='1'}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-passtip]');if(t)t.style.opacity='0'}}>
                  {p?<div style={{width:100,height:108,border:'2px solid rgba(153,51,204,0.65)',borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,background:'linear-gradient(180deg,rgba(34,12,48,0.95),rgba(18,6,28,0.95))',boxShadow:'0 0 14px rgba(153,51,204,0.4),inset 0 0 8px rgba(153,51,204,0.12)',cursor:'help'}}>
                    <div style={{fontSize:38,filter:'drop-shadow(0 0 8px rgba(204,136,255,0.5))',lineHeight:1}}>{p.emoji}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:0.5,color:'var(--tier-mythic)',textTransform:'uppercase',textAlign:'center',lineHeight:1.1,padding:'0 4px'}}>{p.name}</div>
                  </div>
                  :<div style={{width:100,height:108,border:'1px dashed rgba(153,51,204,0.4)',borderRadius:6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,background:'rgba(20,8,30,0.65)'}}>
                    <div style={{fontSize:32,opacity:0.5,textShadow:'0 0 12px rgba(204,136,255,0.4)',lineHeight:1}}>⚡</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:1.5,color:'rgba(200,150,235,0.7)',textTransform:'uppercase',textAlign:'center',lineHeight:1.2,fontWeight:900}}>Effect<br/>Pedal</div>
                  </div>}
                  {p&&<div data-passtip="" style={{opacity:0,transition:'opacity 0.15s',position:'absolute',left:108,top:0,zIndex:99999,pointerEvents:'none',minWidth:200,maxWidth:280,background:'rgba(12,7,18,0.97)',border:'1px solid rgba(153,51,204,0.6)',borderRadius:6,padding:'8px 10px',boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:700,color:'var(--tier-mythic)',marginBottom:4}}>{p.emoji} {p.name}</div>
                    <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',fontStyle:'italic',lineHeight:1.4}}>{p.effect}</div>
                  </div>}
                </div>
              )})}
            </div>
            {(()=>{const _kwT=getKeywordStacks(stage).tier;return stage.map((m,i)=>(
              <div key={i} style={{position:'relative',zIndex:typeof strikingMemberIdx!=='undefined'&&strikingMemberIdx===i?200:1}}>
                {m&&memberBuffs[m.uid]&&memberBuffs[m.uid].length>0&&<div style={{position:'absolute',top:-4,left:'50%',transform:'translateX(-50%)',zIndex:90,display:'flex',flexDirection:'column-reverse',alignItems:'center',gap:2,pointerEvents:'none'}}>
                  {memberBuffs[m.uid].map((b,bi)=><div key={bi} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:b.color,textShadow:'0 0 8px '+b.color+'88,1px 1px 0 #000',letterSpacing:1,whiteSpace:'nowrap',animation:'fadeIn 0.3s ease'}}>{b.text}</div>)}
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
                onQuickPlay={()=>{if(quickPlayCardUid&&m){handleDropOnStage(i,quickPlayCardUid);setQuickPlayCardUid(null)}}}
                mentorState={m&&m.mentorLinkedToUid?(m.mentorAlive?'active':'broken'):m&&m.isMentor&&stage[i+1]&&stage[i+1].mentorLinkedToUid===m.uid&&!m.tooStoned?'mentor':null}
                corruption={corruption}
                corruptTier={_kwT('CORRUPT')}
              />
              </div>
            ))})()}
          </div>
        </div>
                {footerCollapsed&&<div onClick={()=>setFooterCollapsed(false)} style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'2px 20px',flexShrink:0,borderTop:'1px solid rgba(60,35,5,0.18)',background:'rgba(10,6,2,0.28)',cursor:'pointer'}}><span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-muted)',letterSpacing:2}}>▲ SHOW STATS</span></div>}
                <div style={{display:footerCollapsed?'none':'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'1px 20px 2px',position:'relative',zIndex:5,flexShrink:0,borderTop:'1px solid rgba(60,35,5,0.18)',background:'rgba(10,6,2,0.28)'}}>
          {/* FOOTER COLLAPSE TOGGLE */}
          <div onClick={()=>setFooterCollapsed(p=>!p)} style={{position:'absolute',right:8,top:-14,zIndex:10,cursor:'pointer',fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',background:'rgba(20,12,4,0.85)',border:'1px solid rgba(138,117,96,0.25)',borderRadius:2,padding:'2px 10px',letterSpacing:3,textTransform:'uppercase',transition:'color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--ink-bone)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-dim)'}>{'▼ Hide'}</div>
          {/* PHASE BANNER — only shows during strike/boss (when player needs heads-up that animation is playing). 'play' phase is silent — the player knows what to do. */}
          {phaseBanner!=='play'&&<div style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:4,textTransform:'uppercase',
            color:'var(--blood)',
            textShadow:'0 0 12px rgba(196,30,58,0.6)',
            transition:'color 0.2s',opacity:0.95}}>
            {phaseBanner==='strike'?'⚔ Striking!':'👿 Boss Attacks'}
          </div>}
          {/* TIP HINT — separately rendered, only on idle 'play' phase, low-key bottom-left */}
          {currentTip&&phaseBanner==='play'&&<div style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--ink-dim)',letterSpacing:1,fontWeight:400,textTransform:'none',opacity:0.55,maxWidth:240,fontFamily:"'MBScribblesFont',serif",pointerEvents:'none'}}>💡 {currentTip}</div>}
          {/* PACT ICONS — keep the hover tooltips, remove redundant Combined Attack readout (DEALS X DMG',animation:'dmgPreviewPulse 0.3s ease-out covers that now) */}
          {chosenPacts.length>0&&<div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4}}>
            {chosenPacts.filter(Boolean).map(pid=>{const p=PACT_REWARDS.find(r=>r.id===pid);return p?<div key={pid} style={{position:'relative',cursor:'help'}}
              onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-pacttip]');if(t)t.style.display='block'}}
              onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-pacttip]');if(t)t.style.display='none'}}>
              <div style={{width:24,height:24,borderRadius:4,background:p.id==='corruption_engine'&&chosenPacts.includes('corruption_locked')?'rgba(60,30,30,0.8)':'rgba(0,0,0,0.6)',border:`1px solid ${p.id==='corruption_engine'&&chosenPacts.includes('corruption_locked')?'#ff000066':p.color+'66'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,position:'relative'}}>{p.emoji}{p.id==='corruption_engine'&&chosenPacts.includes('corruption_locked')&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',borderRadius:4,fontSize:13,color:'var(--text-blood)',fontWeight:900,letterSpacing:1}}>🔒</div>}</div>
              <div data-pacttip="" style={{display:'none',position:'absolute',bottom:'120%',right:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(200,140,30,0.6)',borderRadius:6,padding:'8px 12px',zIndex:99999,pointerEvents:'none',minWidth:180,boxShadow:'0 4px 20px rgba(0,0,0,0.8)'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:p.color,marginBottom:3}}>{p.emoji} {p.name}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--text-secondary)',lineHeight:1.4}}>{p.desc}</div>
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
          {pendingEmbers>0&&<span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--gold)',letterSpacing:2,textTransform:'uppercase'}}>+{pendingEmbers} Embers pending</span>}
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
            <button onClick={()=>{if(heldShrooms&&!tripUsedThisFight)activateTrip('shrooms')}}
              style={{width:86,padding:'10px 4px',fontFamily:"'MBScribblesFont',serif",fontWeight:900,letterSpacing:2,textTransform:'uppercase',
                background:heldShrooms&&!tripUsedThisFight?'linear-gradient(180deg, rgba(200,152,56,0.25), rgba(200,152,56,0.08))':'linear-gradient(180deg, rgba(30,18,12,0.5), rgba(15,10,6,0.5))',
                border:heldShrooms&&!tripUsedThisFight?'1px solid var(--gold)':'1px solid var(--rot)',
                borderRadius:2,color:heldShrooms&&!tripUsedThisFight?'var(--gold)':'var(--rot)',
                cursor:heldShrooms&&!tripUsedThisFight?'pointer':'not-allowed',
                opacity:heldShrooms?1:0.5,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:22,lineHeight:1,opacity:heldShrooms?1:0.35,filter:heldShrooms?'none':'grayscale(1)'}}>🍄</span>
              <span style={{fontSize:13,letterSpacing:2}}>{heldShrooms?'USE':'⛧'}</span>
              {/* Tape marks — zine aesthetic */}
              <div style={{position:'absolute',top:-3,left:8,width:24,height:7,background:'rgba(200,180,140,0.25)',transform:'rotate(-15deg)',borderRadius:1,pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:-3,right:8,width:24,height:7,background:'rgba(200,180,140,0.25)',transform:'rotate(-15deg)',borderRadius:1,pointerEvents:'none'}}/>
            </button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(200,152,56,0.6)',borderRadius:3,padding:'10px 14px',zIndex:99999,pointerEvents:'none',minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--gold)',marginBottom:6,letterSpacing:2,textTransform:'uppercase'}}>🍄 Magic Mushrooms</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--ink-bone)',lineHeight:1.5,fontStyle:'italic'}}>{heldShrooms?'Use anytime in a fight. 1 of 8 effects: +ATK, +Strike, cheaper cards, full heal, free cards, deck draw, ATK doubled, or CORRUPT free. 3% bad trip.':'Buy from The Dealer in the shop.'}</div>
            </div>
          </div>
          {/* Acid tile */}
          <div style={{position:'relative'}}
            onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='block'}}
            onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='none'}}>
            <button onClick={()=>{if(heldAcid&&!tripUsedThisFight)activateTrip('acid')}}
              style={{width:86,padding:'10px 4px',fontFamily:"'MBScribblesFont',serif",fontWeight:900,letterSpacing:2,textTransform:'uppercase',
                background:heldAcid&&!tripUsedThisFight?'linear-gradient(180deg, rgba(180,80,220,0.25), rgba(180,80,220,0.08))':'linear-gradient(180deg, rgba(30,18,12,0.5), rgba(15,10,6,0.5))',
                border:heldAcid&&!tripUsedThisFight?'1px solid #cc88ff':'1px solid var(--rot)',
                borderRadius:2,color:heldAcid&&!tripUsedThisFight?'#cc88ff':'var(--rot)',
                cursor:heldAcid&&!tripUsedThisFight?'pointer':'not-allowed',
                opacity:heldAcid?1:0.5,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:22,lineHeight:1,opacity:heldAcid?1:0.35,filter:heldAcid?'none':'grayscale(1)'}}>🧪</span>
              <span style={{fontSize:13,letterSpacing:2}}>{heldAcid?'USE':'⛧'}</span>
              {/* Tape marks — zine aesthetic */}
              <div style={{position:'absolute',top:-3,right:8,width:24,height:7,background:'rgba(180,160,220,0.25)',transform:'rotate(15deg)',borderRadius:1,pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:-3,left:8,width:24,height:7,background:'rgba(180,160,220,0.25)',transform:'rotate(15deg)',borderRadius:1,pointerEvents:'none'}}/>
            </button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(180,80,220,0.6)',borderRadius:3,padding:'10px 14px',zIndex:99999,pointerEvents:'none',minWidth:240,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'var(--tier-mythic)',marginBottom:6,letterSpacing:2,textTransform:'uppercase'}}>🧪 Blotter Acid</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--ink-bone)',lineHeight:1.5,fontStyle:'italic'}}>{heldAcid?'Use anytime in a fight. 1 of 8 effects: ×2 damage, ×2 boss damage, +3 perm ATK, immunity, skip 2 boss attacks, +5 ATK burst, ×2 mult start, or freeze boss. 3% bad trip.':'Buy from The Dealer in the shop.'}</div>
            </div>
          </div>
          {/* DMT tile — only visible when holding DMT (boss-shop premium drug) */}
          {heldDMT>0&&<div style={{position:'relative'}}
            onMouseEnter={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='block'}}
            onMouseLeave={e=>{const t=e.currentTarget.querySelector('[data-tip]');if(t)t.style.display='none'}}>
            <button onClick={()=>{if(heldDMT&&!tripUsedThisFight)activateTrip('dmt')}}
              style={{width:86,padding:'10px 4px',fontFamily:"'MBScribblesFont',serif",fontWeight:900,letterSpacing:2,textTransform:'uppercase',
                background:!tripUsedThisFight?'linear-gradient(135deg, rgba(80,180,220,0.5), rgba(180,80,220,0.5))':'linear-gradient(180deg, rgba(30,18,12,0.5), rgba(15,10,6,0.5))',
                border:!tripUsedThisFight?'1px solid rgba(220,200,255,0.8)':'1px solid var(--rot)',
                borderRadius:2,color:!tripUsedThisFight?'#e8ddff':'var(--rot)',
                cursor:!tripUsedThisFight?'pointer':'not-allowed',
                opacity:1,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                boxShadow:!tripUsedThisFight?'0 0 12px rgba(220,200,255,0.5)':'none'}}>
              <span style={{fontSize:22,lineHeight:1,filter:!tripUsedThisFight?'drop-shadow(0 0 6px rgba(220,200,255,0.8))':'grayscale(1)'}}>💠</span>
              <span style={{fontSize:13,letterSpacing:2}}>{!tripUsedThisFight?'USE':'⛧'}</span>
              <div style={{position:'absolute',top:-3,left:8,width:24,height:7,background:'rgba(220,200,255,0.3)',transform:'rotate(-15deg)',borderRadius:1,pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:-3,right:8,width:24,height:7,background:'rgba(220,200,255,0.3)',transform:'rotate(-15deg)',borderRadius:1,pointerEvents:'none'}}/>
            </button>
            <div data-tip="" style={{display:'none',position:'absolute',left:'110%',top:0,background:'rgba(8,4,2,0.97)',border:'1px solid rgba(220,200,255,0.7)',borderRadius:3,padding:'10px 14px',zIndex:99999,pointerEvents:'none',minWidth:260,boxShadow:'0 8px 32px rgba(0,0,0,0.9)'}}>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#e8ddff',marginBottom:6,letterSpacing:2,textTransform:'uppercase'}}>💠 DMT</div>
              <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--ink-bone)',lineHeight:1.5,fontStyle:'italic'}}>Use anytime. Reality breaks. 1 of 8 godhood effects: free cards, ×3 multiplier start, +10 ATK, revive band, deep draw, ×3 boss damage, +2 strikes, or CORRUPT supercharge. NO bad trips.</div>
            </div>
          </div>}
          {/* Sort buttons — tight labels with clear hit targets */}
          <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:8,width:'100%'}}>
            <button onClick={()=>setHandSort(p=>{const n=p==='embers'?'none':'embers';localStorage.setItem('vst_handsort',n);return n})}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:2.5,textTransform:'uppercase',padding:'6px 8px',background:handSort==='embers'?'linear-gradient(180deg, rgba(200,152,56,0.22), rgba(200,152,56,0.06))':'rgba(15,10,6,0.4)',border:handSort==='embers'?'1px solid var(--gold)':'1px solid rgba(138,117,96,0.25)',borderRadius:2,color:handSort==='embers'?'var(--gold)':'var(--ink-dim)',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>⚡ Cost</button>
            <button onClick={()=>setHandSort(p=>{const n=p==='rarity'?'none':'rarity';localStorage.setItem('vst_handsort',n);return n})}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:2.5,textTransform:'uppercase',padding:'6px 8px',background:handSort==='rarity'?'linear-gradient(180deg, rgba(200,152,56,0.22), rgba(200,152,56,0.06))':'rgba(15,10,6,0.4)',border:handSort==='rarity'?'1px solid var(--gold)':'1px solid rgba(138,117,96,0.25)',borderRadius:2,color:handSort==='rarity'?'var(--gold)':'var(--ink-dim)',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>✦ Rarity</button>
          </div>
        </div>


        {/* LEFT PANEL: Discard + Embers + Stats — sits on altar */}
        <div style={{position:'absolute',left:210,top:24,bottom:12,zIndex:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',gap:8,padding:'4px 14px 8px',width:190}}>
          {/* DISCARD group: button + pips as tight unit */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,width:'100%'}}>
            <button onClick={handleDiscard} disabled={!canDiscard}
              style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'9px 10px',background:canDiscard?'linear-gradient(180deg, rgba(200,152,56,0.25), rgba(200,152,56,0.08))':'linear-gradient(180deg, rgba(138,117,96,0.08), rgba(138,117,96,0.03))',border:canDiscard?'1px solid var(--gold)':'1px solid rgba(138,117,96,0.35)',borderRadius:3,color:canDiscard?'var(--gold)':'var(--ink-dim)',cursor:canDiscard?'pointer':'not-allowed',textShadow:canDiscard?'0 0 14px rgba(200,152,56,0.5)':'none',transition:'all 0.15s',width:'100%',opacity:canDiscard?1:0.5}}>{String.fromCharCode(8595)} DISCARD</button>
            {undoSnapshot&&<button onClick={handleUndo} style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,letterSpacing:2,padding:'4px 8px',background:'rgba(100,60,20,0.3)',border:'1px solid rgba(200,152,56,0.35)',borderRadius:2,color:'var(--gold)',cursor:'pointer',width:'100%',opacity:0.7,transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>↩ UNDO (Ctrl+Z)</button>}
            <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
              <PhaseDots left={discardsLeft} total={fightMaxDiscards} color='#c89838' wide={true}/>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:15,fontWeight:900,color:discardsLeft>0?'var(--gold)':'var(--rot)',letterSpacing:1}}><span key={'dl-'+discardsLeft} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{discardsLeft}/{fightMaxDiscards}</span></span>
            </div>
          </div>
          <EmberDisplayLarge current={embers} max={maxEmbers} forecast={hovered!==null&&hand[hovered]&&hand[hovered].embers>0&&!allCardsFree&&!nextCardFree?hand[hovered].embers:0}/>
          <div style={{display:'flex',gap:18,justifyContent:'center',width:'100%',marginTop:4}}>
            {[['Fight',(fightIndex%3+1)+'/3','var(--blood)'],['Stash',stash,'var(--gold)']].map(function(item){return(
              <div key={item[0]} data-stash-label={item[0]==='Stash'?'1':null} style={{textAlign:'center'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',fontWeight:900,marginBottom:2}}>{item[0]}</div>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:28,fontWeight:900,color:item[2],lineHeight:1,textShadow:'0 0 8px '+(item[2]==='var(--blood)'?'rgba(196,30,58,0.4)':'rgba(200,152,56,0.4)')}}><span key={item[0]+'-'+item[1]} style={{animation:'inkStamp 0.4s ease-out',display:'inline-block'}}>{item[1]}</span></div>
              </div>
            )})}
          </div>
        </div>

                {/* RIGHT PANEL: Strike seal — sits on altar */}
        <div style={{position:'absolute',right:8,top:24,bottom:12,zIndex:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:'8px 4px',width:160}}>
          {(() => {
            // FULL STACK MULTIPLIER — mirrors handleStrike's product of every multiplier source.
            // Player sees the TRUE damage multiplier they're sitting on, not just card-play.
            // Updated live as artifacts trigger / corruption ticks / cards play.
            const _vmStrike = strikeMult || 1.0
            const _vmTrip = fightTripBuff==='SACRED CHORD'?3:(fightTripBuff==='DIMENSIONAL RIFT'||fightTripBuff==='FRACTAL VISION')?2:1
            const _vmCorr = corruption>=100?3.0:corruption>=80?2.0:corruption>=60?1.5:corruption>=40?1.2:1.0
            // Artifact mult triggers (mirror handleStrike loop)
            let _vmArt = 1.0
            const _vmCpc = (cardsPlayedRef.current||[]).length
            const _vmCf  = (combosFiredRef.current||[]).length
            const _vmSc  = stage.filter(m=>m&&m.tooStoned).length
            const _vmHd  = hand.filter((c,i)=>hand.findIndex(h=>h.id===c.id)!==i).length
            // Extended preview context — mirrors the real strike calc
            const _vmCardIds = cardsPlayedRef.current||[]
            const _vmCardsThisStrike = _vmCardIds.map(id=>{
              const isEcho=typeof id==='string'&&id.startsWith('_echo:')
              const realId=isEcho?id.slice(6):id
              const card=ALL_CARDS.find(c=>c.id===realId)
              return card?{...card,_isEchoplexRetrigger:isEcho}:null
            }).filter(Boolean)
            const _vmRealPlays = _vmCardsThisStrike.filter(c=>!c._isEchoplexRetrigger)
            const _vmCorruptCards = _vmCardsThisStrike.filter(c=>c.type==='CORRUPT').length
            const _vmRiffCards = _vmCardsThisStrike.filter(c=>c.type==='RIFF').length
            const _vmAllSameType = _vmRealPlays.length>=3 && _vmRealPlays.every(c=>c.type===_vmRealPlays[0].type)
            const _vmRoleCounts = {}
            stage.forEach(m=>{if(m&&m.role)_vmRoleCounts[m.role]=(_vmRoleCounts[m.role]||0)+1})
            const _vmMaxSameRole = Math.max(0, ...Object.values(_vmRoleCounts))
            const _vmAliveNS = stage.filter(m=>m&&!m.tooStoned&&m.hp>0).length
            const _vmDiscardsFight = (discardsThisFightRef && discardsThisFightRef.current) || 0
            const _vmDiscardsStrike = (discardsThisStrikeRef && discardsThisStrikeRef.current) || 0
            const _vmLuciferOnStage = stage.some(m=>m&&(m.id==='lucifer'||m.name==='Lucifer'))
            const _vmDrumDT = stage.some(m=>m&&!m.tooStoned&&m.role==='Drummer')
            const _vmFirstType = _vmCardsThisStrike.length>0 ? _vmCardsThisStrike[0].type : null
            const _vmAllHealthy = stage.filter(m=>m).every(m=>m.hp>=Math.ceil(m.maxHp/2))
            const _vmAliveAll = stage.filter(m=>m&&m.hp>0).length
            const _vmEarlyCircle = Math.floor((fightIndex||0)/3)<3
            // Build ad-hoc atk context for preview damage calc — mirrors handleStrikeBody
            const _vmKwStacks=getKeywordStacks(stage)
            const _vmRiffsThis=_vmCardsThisStrike.filter(c=>c.type==='RIFF').length
            const _vmAtkCtx={corruption,tier:_vmKwStacks.tier,riffsThisStrike:_vmRiffsThis,shredderHits:0,auraAtk:_auraAtkMap(stage,{corruption,shredderHits:0})}
            const _vmHighestAtk = Math.max(0, ...stage.filter(m=>m).map(m=>getEffectiveAtk(m,_vmAtkCtx)))
            // Base (pre-multiplier) damage — mirrors step 1 of the damage preview
            // IIFE below and `dmg` at the top of handleStrikeBody's artifact loop.
            // Needed by the tongueDamage artifact, which converts a FLAT bonus into
            // an equivalent multiplier and therefore needs a denominator.
            const _vmBaseDmg = stage.filter(m=>m&&!m.tooStoned&&m.role!=='Drummer').reduce((s,m)=>s+getEffectiveAtk(m,_vmAtkCtx),0)

            for(const art of activeArtifacts){
              if(!art.multTrigger)continue
              let fires=0
              if(art.multTrigger==='cards3'&&_vmCpc>=4)fires=1
              if(art.multTrigger==='cards5'&&_vmCpc>=6)fires=1
              if(art.multTrigger==='corrupt50'&&corruption>=60)fires=1
              if(art.multTrigger==='corrupt80'&&corruption>=80)fires=1
              if(art.multTrigger==='perChain')fires=_vmCf
              if(art.multTrigger==='perStoned')fires=_vmSc
              if(art.multTrigger==='perDupe')fires=_vmHd
              // New common
              if(art.multTrigger==='alwaysOn')fires=1
              if(art.multTrigger==='playedRiff'&&_vmRiffCards>0)fires=1
              if(art.multTrigger==='anyStoned'&&_vmSc>0)fires=1
              if(art.multTrigger==='perAliveMember')fires=_vmAliveNS
              if(art.multTrigger==='noRiff'&&_vmRiffCards===0&&_vmCpc>0)fires=1
              if(art.multTrigger==='firstCardEmber'&&_vmFirstType==='EMBER')fires=1
              if(art.multTrigger==='allHealthy'&&_vmAllHealthy)fires=1
              if(art.multTrigger==='embers5'&&embers>=5)fires=1
              if(art.multTrigger==='discardedFight'&&_vmDiscardsFight>=1)fires=1
              if(art.multTrigger==='earlyCircle'&&_vmEarlyCircle)fires=1
              // New uncommon
              if(art.multTrigger==='perCorruptCard')fires=_vmCorruptCards
              if(art.multTrigger==='perSameRole')fires=Math.max(0,_vmMaxSameRole)
              if(art.multTrigger==='cards2exact'&&_vmRealPlays.length===2)fires=1
              if(art.multTrigger==='chains3'&&_vmCf>=3)fires=1
              if(art.multTrigger==='perDiscardStrike')fires=_vmDiscardsStrike
              if(art.multTrigger==='doubleTimeRolled'&&_vmDrumDT)fires=1
              if(art.multTrigger==='lastMemberStanding'&&_vmAliveAll===1)fires=1
              // New rare
              if(art.multTrigger==='allSameType'&&_vmAllSameType)fires=1
              if(art.multTrigger==='perOtherArtifact')fires=Math.max(0,activeArtifacts.length-1)
              if(art.multTrigger==='luciferOnStage'&&_vmLuciferOnStage)fires=1
              if(art.multTrigger==='corrupt100exact'&&corruption===100)fires=1
              if(art.multTrigger==='goatStackOther'){
                const others=Math.max(0,activeArtifacts.length-1)
                _vmArt*=(art.mult||2.0)*Math.pow(1.3,others)
                continue
              }
              // Mythic
              if(art.multTrigger==='corruptedClean'&&corruption===100&&_vmSc===0)fires=1
              if(art.multTrigger==='tongueDamage'){
                // Flat damage preview: harder to express as mult, approximate
                const tongueDmg=_vmHighestAtk*_vmCpc
                // `dmg` has no binding in this IIFE — it belonged to the sibling
                // damage-preview IIFE. Every render threw once this artifact was
                // equipped and a card had been played. Use the in-scope base.
                if(tongueDmg>0&&_vmBaseDmg>0)_vmArt*=(1+tongueDmg/_vmBaseDmg)
                continue
              }
              if(art.multTrigger==='sigilOpener'){
                // Preview runs BEFORE strike, so strikesLeft hasn't decremented.
                // First strike = fightMaxStrikes (or fallback maxStrikes).
                const isFirstStrike=(strikesLeft===fightMaxStrikes)
                if(isFirstStrike){
                  _vmArt*=4.31
                  if(_vmTrip<=1)_vmArt*=2
                }
                continue
              }
              if(fires>0)_vmArt*=Math.pow(art.mult,fires)
            }
            // ca1 'always' legacy now handled by alwaysOn trigger above
            // Boss loot mult triggers
            const _activesNoStone = stage.filter(s=>s&&!s.tooStoned)
            for(const lootId of collectedLoot){
              const loot=BOSS_LOOT.find(l=>l&&l.id===lootId)
              if(!loot||!loot.multTrigger||!loot.mult)continue
              let fires=0
              if(loot.multTrigger==='perStrikesLeft')fires=Math.max(0,strikesLeft-1) // strikes left AFTER this one (matches live)
              if(loot.multTrigger==='firstCardFree'&&_vmCpc>=1)fires=1
              if(loot.multTrigger==='alive4'&&_activesNoStone.length>=4)fires=1
              if(loot.multTrigger==='perStash20')fires=Math.floor(stash/20)
              if(loot.multTrigger==='memberAtk20'&&_activesNoStone.some(m=>m.atk>=20))fires=1
              if(loot.multTrigger==='perCorrThreshold')fires=[25,50,75,100].filter(t=>corruption>=t).length
              if(loot.multTrigger==='cards1'&&_vmCpc===1)fires=1
              if(loot.multTrigger==='perUniqueKeyword')fires=new Set(_activesNoStone.map(m=>m.keyword)).size
              if(fires>0)_vmArt*=Math.pow(loot.mult,fires)
            }
            // The TRUE total multiplier — what handleStrike will actually multiply damage by.
            const m = _vmStrike * _vmTrip * _vmCorr * _vmArt
            // Tier thresholds bumped up — full stack numbers are much larger than strikeMult-only
            const tier = m >= 50 ? 5 : m >= 10 ? 4 : m >= 5 ? 3 : m >= 2.5 ? 2 : m > 1.0 ? 1 : 0
            const size = tier === 5 ? 70 : tier === 4 ? 60 : tier === 3 ? 50 : tier === 2 ? 42 : tier === 1 ? 36 : 32
            const color = tier === 5 ? '#ffffff' : tier === 4 ? '#ff2200' : tier === 3 ? 'var(--blood)' : tier === 2 ? '#ff6b6b' : tier === 1 ? 'var(--gold)' : 'var(--ink-dim)';
            const bgOpacity = tier === 5 ? 0.7 : tier === 4 ? 0.55 : tier === 3 ? 0.4 : tier === 2 ? 0.3 : tier === 1 ? 0.2 : 0.08;
            const borderColor = tier >= 4 ? '#ff2200' : tier === 3 ? 'var(--blood)' : tier === 2 ? 'rgba(255,107,107,0.6)' : tier === 1 ? 'var(--gold)' : 'rgba(138,117,96,0.25)';
            const glow = tier === 5 ? '0 0 50px #fff, 0 0 100px var(--blood), 0 0 150px rgba(255,50,0,0.6)' : tier === 4 ? '0 0 40px #ff2200, 0 0 80px rgba(255,100,0,0.5)' : tier === 3 ? '0 0 30px var(--blood), 0 0 60px rgba(196,30,58,0.5)' : tier === 2 ? '0 0 20px rgba(255,107,107,0.7)' : tier === 1 ? '0 0 16px rgba(200,152,56,0.5)' : 'none';
            // Format: keep 2 decimals up to 9.99, switch to 1 decimal for 10-99.9, integers for 100+
            const mDisplay = m >= 100 ? Math.floor(m).toLocaleString() : m >= 10 ? m.toFixed(1) : m.toFixed(2)
            return (
              <div style={{textAlign:'center',padding:'10px 8px',background:`linear-gradient(180deg, rgba(196,30,58,${bgOpacity}), rgba(196,30,58,${bgOpacity*0.3}))`,border:'1px solid '+borderColor,borderRadius:3,width:'100%',transition:'all 0.3s'}}>
                <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--ink-dim)',letterSpacing:3,textTransform:'uppercase',marginBottom:2}}>Multiplier</div>
                <div key={'mult-'+mDisplay} style={{fontFamily:"'MBScribblesFont',serif",fontSize:size,fontWeight:900,color:color,textShadow:glow,lineHeight:1,transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',animation:tier>0?'inkStamp 0.4s ease-out':'none',display:'inline-block'}}>×{mDisplay}</div>
                {tier >= 3 && <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:13,color:tier>=4?'#ffaa00':'var(--blood)',letterSpacing:4,marginTop:2,textTransform:'uppercase',textShadow:tier>=4?'0 0 12px rgba(255,150,0,0.9)':'0 0 8px var(--blood)'}}>{tier===5?'⛧ GODLIKE ⛧':tier===4?'⛧ BEAST ⛧':'INFERNAL'}</div>}
              </div>
            );
          })()}
          {/* STRIKE button — wider so pentagrams don't clip */}
          <button onClick={handleStrike} disabled={!canStrike}
            style={{fontFamily:"'MBScribblesFont',serif",fontSize:19,fontWeight:900,letterSpacing:2,textTransform:'uppercase',whiteSpace:'nowrap',padding:'18px 6px',background:canStrike?'linear-gradient(180deg, rgba(196,30,58,0.55), rgba(122,15,31,0.3))':'rgba(25,12,5,0.4)',border:canStrike?'2px solid var(--blood)':'1px solid var(--rot)',borderRadius:3,color:canStrike?'var(--ink-bone)':'var(--rot)',cursor:canStrike?'pointer':'not-allowed',
              filter:strikeMult>=8?'brightness(1.4) saturate(1.5)':strikeMult>=4?'brightness(1.2)':'none',
              // boxShadow + animation were each declared TWICE in this object — the
              // multiplier-intensity glow/animation was silently dropped by the later
              // altar pair. Merged: both layers now compose (CSS takes comma lists).
              boxShadow:[canStrike?'inset 0 0 32px rgba(196,30,58,0.25), 0 0 24px rgba(196,30,58,0.35)':null,
                strikeMult>=8?'0 0 40px rgba(255,0,0,0.8), 0 0 80px rgba(255,100,0,0.4), inset 0 0 20px rgba(255,50,0,0.5)':strikeMult>=4?'0 0 30px rgba(255,50,0,0.6), 0 0 60px rgba(255,100,0,0.3)':strikeMult>=2?'0 0 20px rgba(255,100,0,0.4)':null].filter(Boolean).join(', ')||'none',
              animation:canStrike?('altarBreath 3s ease-in-out infinite'+(strikeMult>=8?', strikeInferno 0.4s ease-in-out infinite alternate':strikeMult>=4?', strikeBlaze 0.6s ease-in-out infinite alternate':strikeMult>=2?', strikeGlow 1s ease-in-out infinite alternate':'')):'none',
              textShadow:canStrike?'0 0 20px rgba(196,30,58,0.9), 0 2px 4px rgba(0,0,0,0.6)':'none',transition:'all 0.15s',width:'100%'}}>⛧ STRIKE ⛧</button>
          {/* Strike pips — directly under STRIKE button */}
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
            <PhaseDots left={strikesLeft} total={fightMaxStrikes} color='#c41e3a' wide={true}/>
            <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:strikesLeft<=1?22:strikesLeft<=2?18:15,fontWeight:900,color:strikesLeft<=1?'#ff2200':strikesLeft<=2?'#ff4400':'var(--blood)',letterSpacing:1,textShadow:strikesLeft<=1?'0 0 12px rgba(255,0,0,0.8)':'none'}}><span key={'sl-'+strikesLeft} style={{animation:strikesLeft<=1?'memberHitShake 0.4s ease-out, inkStamp 0.4s ease-out':strikesLeft<=2?'inkStamp 0.4s ease-out, pulse 0.8s ease infinite alternate':'inkStamp 0.4s ease-out',display:'inline-block'}}>{strikesLeft>0?strikesLeft+'/'+fightMaxStrikes:'☠ OVERTIME ×'+Math.pow(2,1-strikesLeft)}</span></span>
          </div>
          {/* DAMAGE PREVIEW — below pips, big stamp animation */}
          {/* ACTIVE BUFF BADGES — CHAIN chip removed (redundant with multiplier box). TEMP ATK kept since it shows team total. */}
          {(()=>{
            const tempTotal=stage.filter(m=>m&&!m.tooStoned).reduce((s,m)=>s+(m.tempAtkBonus||0),0)
            if(!tempTotal)return null
            return <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap',marginTop:2}}>
              <span style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,fontWeight:900,color:'#cc44ff',background:'rgba(153,51,204,0.15)',border:'1px solid rgba(153,51,204,0.5)',borderRadius:3,padding:'1px 6px',letterSpacing:1,animation:'handOvercapPulse 1.5s ease-in-out infinite'}}>+{tempTotal} TEMP ATK</span>
            </div>
          })()}
          {(()=>{
            // ═══ MIRRORS handleStrike formula EXACTLY (line 5147+) ═══
            const actives=stage.filter(m=>m&&!m.tooStoned)
            // Keyword stack ctx — must match handleStrike's _atkCtx to keep preview accurate.
            // riffsThisStrike + shredderHits read from cardsPlayedRef (always fresh on render).
            const _previewKw=getKeywordStacks(stage)
            const _previewCardIds=cardsPlayedRef.current||[]
            const _previewRiffs=_previewCardIds.filter(id=>CARD_TYPE_BY_ID[id]==='RIFF').length
            let _previewShredHits=0
            for(let _psi=1;_psi<_previewCardIds.length;_psi++){
              if(CARD_TYPE_BY_ID[_previewCardIds[_psi]]===CARD_TYPE_BY_ID[_previewCardIds[_psi-1]])_previewShredHits++
            }
            const _previewCtx={corruption,tier:_previewKw.tier,riffsThisStrike:_previewRiffs,shredderHits:_previewShredHits,auraAtk:_auraAtkMap(stage,{corruption,shredderHits:_previewShredHits})}
            // 1) base sum (non-Drummer; paranoia is random so excluded from preview)
            const p10Bonus=activePassives.some(p=>p.id==='p10')&&strikesLeft===fightMaxStrikes?10:0
            let dmg=actives.filter(m=>m.role!=='Drummer').reduce((s,m)=>{
              const effAtk=getEffectiveAtk(m,_previewCtx)
              const cleanLivingBonus=0 /* clean_living now applies at fight start */
              return s+effAtk+cleanLivingBonus
            },0)+p10Bonus
            // 2) Drummer × dblMult (NOT always ×2 — depends on dblRoll: ≤2=1×, 3-4=1.5×, 5-6=2×)
            const hasDbl=actives.some(m=>m.role==='Drummer')
            if(hasDbl){
              const dblMult=Math.round(Math.pow(1.5,actives.filter(m=>m.role==='Drummer').length)*100)/100
              dmg=Math.round(dmg*dblMult)
            }
            // 3) Encore: members with encoreReady get a SECOND attack (added separately)
            const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer').reduce((s,m)=>{
              const ea=getEffectiveAtk(m,_previewCtx)
              return s+ea
            },0)
            dmg+=encDmg
            // 3.5) DOUBLE TIME tier-3 (4e): at 3+ Drummer stacks, all members attack twice
            //   NOTE: dormant — recruit screen blocks 2nd drummer. Mirrors handleStrike line ~6868.
            const _previewDtTier=_previewKw.tier('DOUBLE TIME')
            if(_previewDtTier>=4){
              const _dtBonus=actives.filter(m=>m.role!=='Drummer').reduce((s,m)=>s+getEffectiveAtk(m,_previewCtx),0)
              dmg+=_dtBonus
            }
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
                const _ma=getEffectiveAtk(_mn,_previewCtx)
                const _ba=getEffectiveAtk(_bs,_previewCtx)
                dmg+=Math.round((_ma+_ba)*(_em-1))
              }
            }
            // 6) Wailing Guitar artifact: ×2 on first strike
            if(activeArtifacts.some(a=>a.id==='ca4')&&strikesLeft===fightMaxStrikes)dmg*=2
            // 7) Corruption multiplier
            const corrMult=corruption>=100?3.0:corruption>=80?2.0:corruption>=60?1.5:corruption>=40?1.2:1.0
            dmg=Math.round(dmg*corrMult)
            // 8) Artifact multiplier triggers — full set including new modifiers
            let artMult=1.0
            const _cpc=(cardsPlayedRef.current||[]).length
            const _cf=(combosFiredRef.current||[]).length
            const _sc=stage.filter(m=>m&&m.tooStoned).length
            const _hd=hand.filter((c,i)=>hand.findIndex(h=>h.id===c.id)!==i).length
            // Extended preview context for new triggers
            const _cardIds = cardsPlayedRef.current||[]
            const _cardsThis = _cardIds.map(id=>{
              const isEcho=typeof id==='string'&&id.startsWith('_echo:')
              const realId=isEcho?id.slice(6):id
              const card=ALL_CARDS.find(c=>c.id===realId)
              return card?{...card,_isEchoplexRetrigger:isEcho}:null
            }).filter(Boolean)
            const _realPlays = _cardsThis.filter(c=>!c._isEchoplexRetrigger)
            const _corrCards = _cardsThis.filter(c=>c.type==='CORRUPT').length
            const _riffCards = _cardsThis.filter(c=>c.type==='RIFF').length
            const _allSame = _realPlays.length>=3 && _realPlays.every(c=>c.type===_realPlays[0].type)
            const _roleCnts = {}
            stage.forEach(m=>{if(m&&m.role)_roleCnts[m.role]=(_roleCnts[m.role]||0)+1})
            const _maxRole = Math.max(0, ...Object.values(_roleCnts))
            const _aliveNS = stage.filter(m=>m&&!m.tooStoned&&m.hp>0).length
            const _discFight = (discardsThisFightRef && discardsThisFightRef.current) || 0
            const _discStrike = (discardsThisStrikeRef && discardsThisStrikeRef.current) || 0
            const _lucStg = stage.some(m=>m&&(m.id==='lucifer'||m.name==='Lucifer'))
            const _drumDT = stage.some(m=>m&&!m.tooStoned&&m.role==='Drummer')
            const _firstT = _cardsThis.length>0 ? _cardsThis[0].type : null
            const _allHlth = stage.filter(m=>m).every(m=>m.hp>=Math.ceil(m.maxHp/2))
            const _aliveAll = stage.filter(m=>m&&m.hp>0).length
            const _earlyC = Math.floor((fightIndex||0)/3)<3
            const _highAtk = Math.max(0, ...stage.filter(m=>m).map(m=>getEffectiveAtk(m,_previewCtx)))
            for(const art of activeArtifacts){
              if(!art.multTrigger)continue
              let fires=0
              if(art.multTrigger==='cards3'&&_cpc>=4)fires=1
              if(art.multTrigger==='cards5'&&_cpc>=6)fires=1
              if(art.multTrigger==='corrupt50'&&corruption>=60)fires=1
              if(art.multTrigger==='corrupt80'&&corruption>=80)fires=1
              if(art.multTrigger==='perChain')fires=_cf
              if(art.multTrigger==='perStoned')fires=_sc
              if(art.multTrigger==='perDupe')fires=_hd
              if(art.multTrigger==='alwaysOn')fires=1
              if(art.multTrigger==='playedRiff'&&_riffCards>0)fires=1
              if(art.multTrigger==='anyStoned'&&_sc>0)fires=1
              if(art.multTrigger==='perAliveMember')fires=_aliveNS
              if(art.multTrigger==='noRiff'&&_riffCards===0&&_cpc>0)fires=1
              if(art.multTrigger==='firstCardEmber'&&_firstT==='EMBER')fires=1
              if(art.multTrigger==='allHealthy'&&_allHlth)fires=1
              if(art.multTrigger==='embers5'&&embers>=5)fires=1
              if(art.multTrigger==='discardedFight'&&_discFight>=1)fires=1
              if(art.multTrigger==='earlyCircle'&&_earlyC)fires=1
              if(art.multTrigger==='perCorruptCard')fires=_corrCards
              if(art.multTrigger==='perSameRole')fires=Math.max(0,_maxRole)
              if(art.multTrigger==='cards2exact'&&_realPlays.length===2)fires=1
              if(art.multTrigger==='chains3'&&_cf>=3)fires=1
              if(art.multTrigger==='perDiscardStrike')fires=_discStrike
              if(art.multTrigger==='doubleTimeRolled'&&_drumDT)fires=1
              if(art.multTrigger==='lastMemberStanding'&&_aliveAll===1)fires=1
              if(art.multTrigger==='allSameType'&&_allSame)fires=1
              if(art.multTrigger==='perOtherArtifact')fires=Math.max(0,activeArtifacts.length-1)
              if(art.multTrigger==='luciferOnStage'&&_lucStg)fires=1
              if(art.multTrigger==='corrupt100exact'&&corruption===100)fires=1
              if(art.multTrigger==='goatStackOther'){
                const others=Math.max(0,activeArtifacts.length-1)
                artMult*=(art.mult||2.0)*Math.pow(1.3,others)
                continue
              }
              if(art.multTrigger==='corruptedClean'&&corruption===100&&_sc===0)fires=1
              if(art.multTrigger==='tongueDamage'){
                const tDmg=_highAtk*_cpc
                if(tDmg>0&&dmg>0)artMult*=(1+tDmg/dmg)
                continue
              }
              if(art.multTrigger==='sigilOpener'){
                const isFS=(strikesLeft===fightMaxStrikes)
                if(isFS){artMult*=4.31;if(strikeMult<=1)artMult*=2}
                continue
              }
              if(fires>0)artMult*=Math.pow(art.mult,fires)
            }
            // ca1 'always' legacy now handled by alwaysOn trigger
            dmg=Math.round(dmg*artMult)
            // 9) Strike multiplier
            const fin=strikeMult>1.0?Math.round(dmg*strikeMult):dmg
            if(fin<=0||!canStrike)return null
            return (
              <div style={{fontFamily:"'MBScribblesFont',serif",textAlign:'center',marginTop:6}}>
                <div style={{fontSize:13,color:'var(--ink-dim)',letterSpacing:4,textTransform:'uppercase',fontWeight:900}}>Deals</div>
                <div key={'preview-'+fin} style={{fontSize:48,fontWeight:900,color:'var(--blood)',textShadow:'0 0 18px rgba(196,30,58,0.85), 0 2px 4px rgba(0,0,0,0.7)',lineHeight:1,animation:'damageStamp 0.35s cubic-bezier(0.4,1.6,0.5,1)',display:'inline-block',marginTop:2}}>{fin}<span style={{fontSize:14,color:'var(--ink-bone)',marginLeft:4,letterSpacing:2}}>DMG</span></div>
              </div>
            )
          })()}
        </div>

        {/* CARD FAN — centered between panels */}
        <div style={{position:'absolute',left:410,right:150,top:22,bottom:0,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:10,overflow:'visible',zIndex:50}}>
          {/* HAND SIZE INDICATOR — gold pulse at overcap (kept; DECK/DISC small labels removed because the lower-left DeckPile/DiscardPile already shows count + click-to-view) */}
          {(()=>{const tgt=handTargetRef.current||HAND_SIZE;const over=hand.length>tgt;return (<>
            <div style={{position:'absolute',top:-2,left:'50%',transform:'translateX(-50%)',fontFamily:"'MBScribblesFont',serif",fontSize:13,letterSpacing:2,color:over?'var(--gold)':'var(--ink-dim)',textShadow:over?'0 0 8px rgba(200,152,56,0.6)':'none',animation:over?'handOvercapPulse 1.2s ease-in-out infinite':'none',pointerEvents:'none',zIndex:51,fontWeight:900}}>
              {hand.length}/{tgt}
            </div>
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
              corruption={corruption}
            />
          ))}
        </div>
      </div>
      {/* GRADE TRACKER — REMOVED from in-game UI per JV (May 4 2026).
          Grade still displays prominently on the end screen (line ~4854).
          Removing it from gameplay reclaims top-left space and lets the
          artifact/pedal rail breathe — second pedal slot was clipping. */}
      {/* DEBUG HUD — toggle with Shift+` (tilde). Shows live game state for bug-hunting. */}
      {showDebugHud&&<div style={{position:'absolute',top:8,right:8,zIndex:9998,fontFamily:'monospace',fontSize:13,lineHeight:1.5,color:'var(--text-primary)',background:'rgba(0,0,0,0.88)',border:'1px solid var(--text-gold)',borderRadius:4,padding:'10px 14px',minWidth:280,maxWidth:340,boxShadow:'0 0 16px rgba(232,168,32,0.3)',pointerEvents:'none',userSelect:'text'}}>
        <div style={{color:'var(--text-gold)',fontWeight:900,marginBottom:4,letterSpacing:2,fontSize:13}}>━ DEBUG ━</div>
        <div>state: <span style={{color:'var(--text-gold)'}}>{gameState}</span> · phase: <span style={{color:'var(--text-gold)'}}>{animPhase}</span></div>
        <div>fight: <span style={{color:'var(--text-gold)'}}>{fightIndex+1}/27</span> · circle: <span style={{color:'var(--text-gold)'}}>{Math.floor(fightIndex/3)+1}</span></div>
        <div>strikes: <span style={{color:'var(--text-gold)'}}>{strikesLeft}/{fightMaxStrikes}</span> · disc: <span style={{color:'var(--text-gold)'}}>{discardsLeft}</span> · embers: <span style={{color:'var(--text-gold)'}}>{embers}/{maxEmbers}</span></div>
        <div>corruption: <span style={{color:corruption>=75?'var(--text-blood)':corruption>=50?'var(--text-gold)':'var(--text-primary)'}}>{corruption}%</span> · stash: <span style={{color:'var(--text-gold)'}}>{stash}</span></div>
        <div>hand: <span style={{color:'var(--text-gold)'}}>{hand.length}</span> · deck: <span style={{color:'var(--text-gold)'}}>{deck.length}</span> · disc: <span style={{color:'var(--text-gold)'}}>{discardPile.length}</span></div>
        <div>canStrike: <span style={{color:canStrike?'#44cc44':'var(--text-blood)'}}>{canStrike?'YES':'NO'}</span> · enemyHp: <span style={{color:'var(--text-gold)'}}>{enemyHp}</span></div>
        <div style={{borderTop:'1px solid rgba(232,168,32,0.3)',marginTop:6,paddingTop:6,color:'var(--text-secondary)',letterSpacing:1,fontSize:13}}>STAGE</div>
        {stage.map((m,i)=>{
          if(!m)return <div key={i} style={{color:'var(--text-muted)'}}>  [{i}] empty</div>
          const stoned=m.tooStoned
          return <div key={i} style={{color:stoned?'var(--text-blood)':'var(--text-primary)'}}>  [{i}] {stoned?'☠':'♦'} {m.name||'?'} {m.hp}/{m.maxHp} atk:{m.atk}{m.isMentor?' MENTOR':''}{m.mentorLinkedToUid?' linked':''}{m.bloodOath?' OATH':''}{m.stoneShield?' shielded':''}</div>
        })}
        <div style={{borderTop:'1px solid rgba(232,168,32,0.3)',marginTop:6,paddingTop:6,color:'var(--text-secondary)',letterSpacing:1,fontSize:13}}>FLAGS</div>
        <div style={{color:'var(--text-secondary)'}}>tutorial:{tutorialFight} wth:{welcomeToHell||'-'} death:{deathCause||'-'}</div>
        <div style={{color:'var(--text-secondary)'}}>encore:{encoreMode?'Y':'N'} stake:{activeStake?.id||'-'}</div>
        <div style={{borderTop:'1px solid rgba(232,168,32,0.3)',marginTop:6,paddingTop:6,fontSize:13,color:'var(--text-muted)',letterSpacing:1}}>shift+` to close · screenshot for repro</div>
      </div>}
      {/* CORRUPTION HEARTBEAT VIGNETTE — toned down May 4 2026 per JV.
          Old version had a malformed nested ternary that meant 40-99% corruption
          rendered no vignette at all (invalid CSS string), and only the 100% tier
          rendered — at full strength (120px inset, 0.5 alpha, no pulse). With the
          string-ternary bug fixed, ALL tiers were going to render. So scaled the
          whole curve back: smaller inset, lower alpha, slower pulse. Subtle
          background pressure, not an eye-stabbing red wash.
          Tier curve: 50%→light, 70%→medium, 90%→strong, 100%→max but still readable. */}
      {(()=>{
        if(corruption<50||gameState!=='playing')return null
        const _insetPx=corruption>=100?60:corruption>=90?50:corruption>=70?40:30
        const _alpha=corruption>=100?0.28:corruption>=90?0.22:corruption>=70?0.16:0.10
        const _anim=corruption>=90?'heartbeat 1.6s ease-in-out infinite':corruption>=70?'heartbeat 2.2s ease-in-out infinite':'none'
        return <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50,
          boxShadow:'inset 0 0 '+_insetPx+'px rgba(150,0,20,'+_alpha+')',
          animation:_anim,borderRadius:0}}/>
      })()}

      {/* ═══ TUTORIAL OVERLAYS ═══ */}
      {/* PRE-FIGHT SPLASH — tour quote loading screen */}
      {preFightSplash&&<div style={{position:'absolute',inset:0,zIndex:9998,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,
        background:'radial-gradient(ellipse at center, rgba(10,4,2,0.97) 0%, rgba(0,0,0,0.99) 100%)',
        animation:'fadeIn 0.3s ease',pointerEvents:'none'}}>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:16,color:'var(--ink-dim)',letterSpacing:6,textTransform:'uppercase',fontStyle:'italic',opacity:0.7,animation:'slideDown 0.4s ease-out'}}>{preFightSplash.circle}</div>
        <div style={{fontFamily:"'BogartsMetalFont',cursive",fontSize:72,color:'var(--ink-bone)',textShadow:'0 0 40px rgba(196,30,58,0.5), 3px 3px 0 #000',letterSpacing:4,textAlign:'center',transform:'rotate(-1.5deg)',lineHeight:1,animation:'nameSlamIn 0.5s cubic-bezier(0.2,0.8,0.3,1.15)'}}>{preFightSplash.enemy.name}</div>
        <svg width="400" height="6" viewBox="0 0 400 6" style={{marginTop:-4,animation:'lineDrawIn 0.6s ease-out 0.3s both'}}>
          <path d="M 12 3 Q 100 1, 200 3 T 388 3" stroke="var(--blood)" strokeWidth="1" fill="none" opacity="0.6"/>
        </svg>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:14,color:'var(--ink-rust)',fontWeight:900,letterSpacing:3,textTransform:'uppercase',marginTop:8,animation:'fadeSlideUp 0.4s ease-out 0.5s both'}}>{preFightSplash.enemy.emoji} {preFightSplash.enemy.passive}</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:18,color:'var(--ink-dim)',fontStyle:'italic',maxWidth:600,textAlign:'center',lineHeight:1.5,marginTop:24,padding:'0 40px',opacity:0.65,animation:'fadeSlideUp 0.4s ease-out 0.7s both'}}>"{preFightSplash.quote}"</div>
        <div style={{fontFamily:"'MBScribblesFont',serif",fontSize:13,color:'var(--rot)',letterSpacing:8,textTransform:'uppercase',marginTop:24,animation:'pulse 1s ease infinite alternate'}}>entering the pit...</div>
      </div>}

      {tutorialFight>0&&TUTORIAL_TIPS[tutorialFight]&&tutorialTipIdx<TUTORIAL_TIPS[tutorialFight].length&&
        <TutorialTooltip tip={TUTORIAL_TIPS[tutorialFight][tutorialTipIdx]} onDismiss={()=>setTutorialTipIdx(p=>p+1)}/>}
      {showTutorialMsg&&<TutorialMessage text={showTutorialMsg} isFinal={showTutorialMsg==='TUTORIAL COMPLETE'} onContinue={handleTutorialContinue}/>}
      {/* Tutorial fight indicator */}
      {tutorialFight>0&&<div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',zIndex:9990,fontFamily:"'MBScribblesFont',serif",fontSize:16,fontWeight:900,color:'var(--text-gold)',letterSpacing:4,textTransform:'uppercase',background:'rgba(10,6,2,0.85)',border:'1px solid rgba(232,168,32,0.4)',borderRadius:6,padding:'6px 24px'}}>
        TUTORIAL — Fight {tutorialFight} of 3
      </div>}
      {screenFade&&<div style={{position:'absolute',inset:0,zIndex:99990,background:'#000',animation:'screenFadeFlash 350ms ease-out forwards',pointerEvents:'none'}}/>}
      {bossQuoteTypewriter&&<TypewriterQuote text={bossQuoteTypewriter}/>}
      {showConfetti&&<ConfettiRain/>}

    </div>
  )
  }  // end renderScreen

  // ── SHARED SHELL ────────────────────────────────────────────────────
  // Fragment, not a wrapper div: App's children stay direct children of the
  // 1920x1080 #vst-scale-root, so every `position:absolute;inset:0` overlay keeps
  // the exact geometry it had inside the combat return.
  return(<>{renderScreen()}{combatLogOverlay}{slotSwapModal}{pauseOverlay}</>)
}

// ── SCALE ROOT — fits game to any screen size ──────────────────
const DESIGN_W=1920,DESIGN_H=1080
// CLAUDE.md rule 12: render() MUST return this.props.children — fail open, never
// replace the UI with an error wall. The old red "RENDER ERROR" screen only offered
// a "Try Again" button that cleared state.error, so a deterministic render bug
// re-threw instantly and dead-ended the overnight playtest bot. We keep logging
// loudly (the bot scrapes console) but always hand the children back to React.
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return{error}}
  componentDidCatch(e,info){console.error('VESTIBULE RENDER ERROR:',e&&e.message,e&&e.stack,info&&info.componentStack)}
  render(){
    // Deliberately ignores this.state.error — children are handed back every time.
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
