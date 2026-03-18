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

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_EMBERS=6, MAX_STRIKES=4, MAX_DISCARDS=4, HAND_SIZE=6

const ENEMIES=[
  {id:'wanderer',name:'The Wanderer',circle:'Circle I — Limbo',subtitle:'Fight 1 of 3',maxHp:40,baseDmg:3,emoji:'👤',passive:'A lost soul with no purpose. Attacks randomly.'},
  {id:'lostsoul',name:'The Lost Soul',circle:'Circle I — Limbo',subtitle:'Fight 2 of 3',maxHp:70,baseDmg:4,emoji:'💀',passive:'A stronger damned spirit. Hunger drives its blows.'},
  {id:'drifter',name:'The Drifter',circle:'Circle I — Limbo',subtitle:'Circle Boss — Fight 3 of 3',maxHp:100,baseDmg:5,emoji:'👁',passive:'The undisputed master of Limbo. No passive — pure relentless pressure.'},
]

const ALL_MUSICIANS=[
  {id:'bjorn',name:'Bjorn',role:'Lead Guitarist',atk:5,hp:6,maxHp:6,emoji:'🎸',keyword:'FRENZIED',desc:'High ATK, fragile. The carry.'},
  {id:'ragnar',name:'Ragnar',role:'Lead Guitarist',atk:4,hp:7,maxHp:7,emoji:'🎸',keyword:'FRENZIED',desc:'Slightly tankier lead.'},
  {id:'thor',name:'Thor',role:'Drummer',atk:0,hp:8,maxHp:8,emoji:'🥁',keyword:'DOUBLE TIME',desc:'Attack fires twice per turn.'},
  {id:'ingrid',name:'Ingrid',role:'Bass Player',atk:3,hp:10,maxHp:10,emoji:'🎵',keyword:'ANCHOR',desc:'High HP. Regen adjacent members.'},
  {id:'loki',name:'Loki',role:'Synth Player',atk:3,hp:6,maxHp:6,emoji:'🎹',keyword:'CORRUPT',desc:'Damage scales with Corruption.'},
  {id:'nott',name:'Nott',role:'Vocalist',atk:2,hp:7,maxHp:7,emoji:'🎤',keyword:'DEBUFF',desc:'Reduces boss passive each turn.'},
  {id:'dag',name:'Dag',role:'Bass Player',atk:2,hp:12,maxHp:12,emoji:'🎵',keyword:'ANCHOR',desc:'Tankiest member.'},
]

const ALL_CARDS=[
  {id:'amp',name:'Amp It Up',type:'RIFF',rarity:'Common',emoji:'⚡',embers:2,effect:'Target member deals double ATK this turn.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'dialtoeleven',name:'Dial to Eleven',type:'CORRUPT',rarity:'Common',emoji:'📻',embers:1,effect:'+20% Corruption immediately.',color:'#aa1111',typeColor:'#880000'},
  {id:'soundcheck',name:'Sound Check',type:'UTILITY',rarity:'Common',emoji:'🔊',embers:2,effect:'All band members gain +3 HP.',color:'#22aa44',typeColor:'#118833'},
  {id:'sigdecay',name:'Signal Decay',type:'CORRUPT',rarity:'Common',emoji:'📡',embers:2,effect:'-30% Corruption. Heal 5 HP.',color:'#aa1111',typeColor:'#880000'},
  {id:'warmup',name:'Warm Up',type:'RIFF',rarity:'Common',emoji:'🎵',embers:1,effect:'Target member +1 ATK this Strike.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'roadie',name:'Roadie',type:'UTILITY',rarity:'Common',emoji:'🛡',embers:1,effect:'Target cannot go Too Stoned this Strike.',color:'#22aa44',typeColor:'#118833'},
  {id:'setlist',name:'Setlist',type:'UTILITY',rarity:'Common',emoji:'📋',embers:1,effect:'View top 4 cards. Rearrange in any order.',color:'#22aa44',typeColor:'#118833'},
  {id:'groupie',name:'Groupie',type:'EMBER',rarity:'Common',emoji:'🍯',embers:2,effect:'Spend 2 Embers, gain 3 back. Net +1.',color:'#c87820',typeColor:'#a05a10'},
  {id:'demotape',name:'Demo Tape',type:'RIFF',rarity:'Common',emoji:'📼',embers:2,effect:'Copy the last Riff played, cast it free.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'newstrings',name:'New Strings',type:'RIFF',rarity:'Uncommon',emoji:'🎸',embers:3,effect:'+2 ATK permanently to target member.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'encore',name:'Encore',type:'RIFF',rarity:'Uncommon',emoji:'🔁',embers:2,effect:'Target member attacks again this Strike.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'wakeup',name:'Wake Up Call',type:'UTILITY',rarity:'Uncommon',emoji:'☕',embers:2,effect:'Revive a Too Stoned member at full stats.',color:'#22aa44',typeColor:'#118833'},
  {id:'feedbackloop',name:'Feedback Loop',type:'CORRUPT',rarity:'Uncommon',emoji:'🎛',embers:3,effect:'Deal damage equal to your Corruption %.',color:'#aa1111',typeColor:'#880000'},
  {id:'tappedout',name:'Tapped Out',type:'EMBER',rarity:'Uncommon',emoji:'🪙',embers:0,effect:'Gain 5 Embers at the start of next Strike.',color:'#c87820',typeColor:'#a05a10'},
  {id:'controlfeedback',name:'Controlled Feedback',type:'CORRUPT',rarity:'Uncommon',emoji:'🎚',embers:2,effect:'Set Corruption to exactly 50%.',color:'#aa1111',typeColor:'#880000'},
  {id:'burnset',name:'Burn the Set',type:'RIFF',rarity:'Uncommon',emoji:'🔥',embers:2,effect:'Discard entire hand. Draw 6 new cards.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'soundwall',name:'Sound Wall',type:'RIFF',rarity:'Uncommon',emoji:'🔈',embers:3,effect:'Deal 5 direct damage. Boss passive skips.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'stagedive',name:'Stage Dive',type:'RIFF',rarity:'Rare',emoji:'🤘',embers:4,effect:'Damage = target HP to boss. Once per round.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'overdrive',name:'Overdrive',type:'RIFF',rarity:'Rare',emoji:'💥',embers:3,effect:'If Corruption >80%, double ALL ATK this Strike.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'infencore',name:'Infernal Encore',type:'RIFF',rarity:'Rare',emoji:'👿',embers:4,effect:'ALL members attack again simultaneously.',color:'#9933cc',typeColor:'#7722aa'},
  {id:'remaster',name:'The Remaster',type:'UTILITY',rarity:'Rare',emoji:'🎙',embers:0,effect:'View 10 deck cards. Delete 2. Copy 1.',color:'#22aa44',typeColor:'#118833'},
  {id:'sabbathsigil',name:'Black Sabbath Sigil',type:'CORRUPT',rarity:'Rare',emoji:'⛧',embers:2,effect:'Set Corruption to 100%. Hellquake fires.',color:'#aa1111',typeColor:'#880000'},
  {id:'possessedperf',name:'Possessed Performance',type:'RIFF',rarity:'Rare',emoji:'🎭',embers:5,effect:'All members deal triple ATK this Strike only.',color:'#9933cc',typeColor:'#7722aa'},
]

function seededRng(seed){let s=seed;return function(){s=Math.imul(48271,s)|0;return(s&0x7fffffff)/0x7fffffff}}

function buildDeck(seed){
  const rng=seededRng(seed)
  const deck=[]
  ALL_CARDS.forEach(function(c){
    deck.push(Object.assign({},c,{uid:Math.random().toString(36).slice(2)}))
    deck.push(Object.assign({},c,{uid:Math.random().toString(36).slice(2)}))
    deck.push(Object.assign({},c,{uid:Math.random().toString(36).slice(2)}))
  })
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
  return deck
}

function getCenter(ref){
  if(!ref||!ref.current)return{x:window.innerWidth/2,y:window.innerHeight/2}
  const r=ref.current.getBoundingClientRect()
  return{x:r.left+r.width/2,y:r.top+r.height/2}
}

const CIRCLE_ARTIFACTS=[
  {name:'The Goat of Mendes',emoji:'🐐',effect:'All band members gain +1 ATK permanently.',cost:14},
  {name:'Hellfire Amulet',emoji:'🔮',effect:'Start each fight with +2 bonus Embers.',cost:17},
  {name:'Sabbath Crown',emoji:'👑',effect:'Too Stoned members revive at 50% HP each round.',cost:22},
  {name:'Wailing Guitar',emoji:'🎸',effect:'First Strike each fight deals double damage.',cost:16},
]

function genShopCards(){
  const shuffled=[...ALL_CARDS].sort(function(){return Math.random()-.5})
  return shuffled.slice(0,3)
}
function genBoosterPacks(){
  const packs=[
    {name:'Demo Tape',emoji:'📼',cost:5,desc:'Pick 1 of 3. All Common cards.'},
    {name:'Session Pack',emoji:'🎵',cost:9,desc:'Pick 2 of 4. Common + Uncommon odds.'},
    {name:'Headliner Pack',emoji:'🎤',cost:15,desc:'Pick 2 of 5. Full rarity odds.'},
    {name:'Legendary Set',emoji:'💎',cost:24,desc:'Pick 2 of 4. Guaranteed 1 Rare + Artifact chance.'},
  ]
  return [packs[Math.floor(Math.random()*packs.length)],packs[Math.floor(Math.random()*packs.length)]]
}
function genRecruitPack(){
  const packs=[
    {name:'Garage Band Pack',cost:2,desc:'Pick 1 of 2. Common members only.'},
    {name:'Experienced Pack',cost:4,desc:'Pick 1 of 4. Chance of Foil members.'},
    {name:'Demonic Pack',cost:8,desc:'Pick up to 2 of 6. Foil and Mythic chances.'},
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
          <div key={i} style={{fontSize:i<current?22:18,opacity:i<current?1:0.18,filter:i<current?'drop-shadow(0 0 8px rgba(255,120,0,0.9))':'grayscale(1)',transition:'all 0.25s'}}>🔥</div>
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
          <div key={i} style={{fontSize:i<current?15:13,opacity:i<current?1:0.22,filter:i<current?'drop-shadow(0 0 6px rgba(255,100,0,0.8))':'grayscale(1)',transition:'all 0.25s'}}>🔥</div>
        ))}
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:900,color:current>0?'#ff6600':'#444',lineHeight:1}}>{current}/{max}</div>
    </div>
  )
}

function BoosterScreen({onComplete,seed}){
  const [sel,setSel]=useState([])
  const pool=ALL_MUSICIANS.slice(0,5)
  const toggle=id=>setSel(p=>p.includes(id)?p.filter(x=>x!==id):p.length<2?[...p,id]:p)
  return(
    <div style={{position:'fixed',inset:0,zIndex:9800,background:'rgba(4,2,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:'20px 0'}}>
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:52,color:'#d0b060',textShadow:'0 0 40px rgba(200,150,20,0.4),2px 2px 0 #000'}}>Opening Night</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:18,color:'#a09060',fontStyle:'italic'}}>Select 2 musicians to start your band</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'#4a3a20',letterSpacing:2}}>RUN SEED: {seed.toString(16).toUpperCase()}</div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',maxWidth:960,padding:'0 20px'}}>
        {pool.map(m=>{
          const s=sel.includes(m.id),dis=!s&&sel.length>=2
          return(
            <div key={m.id} onClick={()=>!dis&&toggle(m.id)} style={{width:158,background:s?'linear-gradient(180deg,#2a1a0a,#160c04)':'linear-gradient(180deg,#1a1008,#0e0804)',border:s?'2px solid #e8a820':dis?'1px solid rgba(80,50,10,0.3)':'1px solid rgba(160,100,25,0.5)',borderRadius:7,cursor:dis?'not-allowed':'pointer',boxShadow:s?'0 0 30px rgba(232,168,32,0.4),0 8px 24px rgba(0,0,0,0.8)':'0 4px 16px rgba(0,0,0,0.7)',opacity:dis?0.45:1,transform:s?'translateY(-8px) scale(1.04)':'none',transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',position:'relative'}}>
              <div style={{height:5,borderRadius:'7px 7px 0 0',background:s?'linear-gradient(90deg,#e8a820,#ffcc44)':'rgba(120,80,20,0.4)'}}/>
              {s&&<div style={{position:'absolute',top:8,right:8,width:26,height:26,borderRadius:'50%',background:'#e8a820',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#000',fontWeight:900}}>✓</div>}
              <div style={{height:88,display:'flex',alignItems:'center',justifyContent:'center',fontSize:46,background:'rgba(0,0,0,0.3)'}}>{m.emoji}</div>
              <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:22,color:s?'#e8d090':'#c8b878',textAlign:'center',padding:'5px 4px 1px',lineHeight:1}}>{m.name}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:2,color:s?'#a09050':'#7a6a40',textAlign:'center',padding:'2px 4px',textTransform:'uppercase'}}>{m.role}</div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 14px 4px',background:'rgba(0,0,0,0.65)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{textAlign:'center'}}><div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:'#6a3a3a',textTransform:'uppercase'}}>ATK</div><div style={{fontFamily:"'Cinzel',serif",fontSize:26,fontWeight:900,color:'#ee3333'}}>{m.atk}</div></div>
                <div style={{textAlign:'center'}}><div style={{fontFamily:"'Cinzel',serif",fontSize:7,color:'#2a5a2a',textTransform:'uppercase'}}>HP</div><div style={{fontFamily:"'Cinzel',serif",fontSize:26,fontWeight:900,color:'#33dd33'}}>{m.hp}</div></div>
              </div>
              <div style={{fontFamily:"'IM Fell English',serif",fontSize:11,color:s?'#a09060':'#7a6a40',textAlign:'center',padding:'4px 8px 10px',fontStyle:'italic',lineHeight:1.35}}>{m.desc}</div>
            </div>
          )
        })}
      </div>
      <button onClick={()=>sel.length===2&&onComplete(sel)} disabled={sel.length<2}
        style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,letterSpacing:4,textTransform:'uppercase',padding:'14px 52px',background:sel.length===2?'rgba(130,0,0,0.35)':'rgba(30,15,5,0.4)',border:`2px solid ${sel.length===2?'#bb1111':'#2a1508'}`,borderRadius:3,color:sel.length===2?'#ee2222':'#3a1a08',cursor:sel.length===2?'pointer':'not-allowed',transition:'all 0.2s'}}>
        {sel.length===2?'⛧  Take the Stage':'Select 2 Musicians'}
      </button>
    </div>
  )
}

function ShopScreen({stash,onSpend,onLeave,circleArtifact,recruitPack,shopCards,boosterPacks,rerollCost,onReroll}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:9500,background:'rgba(3,2,1,0.97)',display:'flex',flexDirection:'column',overflow:'auto'}}>
      <div style={{padding:'16px 24px 12px',borderBottom:'1px solid rgba(100,60,10,0.5)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:32,color:'#d0b060'}}>The Black Market</div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20}}>🌿</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:24,fontWeight:900,color:'#44cc44'}}>{stash}</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'#4a6a4a',letterSpacing:2,textTransform:'uppercase'}}>Stash</span>
          </div>
          <button onClick={onLeave} style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,letterSpacing:3,textTransform:'uppercase',padding:'10px 24px',background:'rgba(130,0,0,0.3)',border:'2px solid #882200',borderRadius:3,color:'#dd4422',cursor:'pointer'}}>
            ⛧ Next Fight
          </button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',minHeight:0}}>
        {/* LEFT */}
        <div style={{width:210,flexShrink:0,borderRight:'1px solid rgba(80,50,10,0.4)',padding:'14px 12px',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:8}}>⚗ Artifact — This Circle</div>
            <div style={{background:'linear-gradient(180deg,#1e1408,#0e0804)',border:'2px solid #c87820',borderRadius:6,padding:'10px',boxShadow:'0 0 18px rgba(200,120,20,0.22)'}}>
              <div style={{fontSize:28,textAlign:'center',marginBottom:5}}>{circleArtifact.emoji}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,color:'#e8c070',textAlign:'center',marginBottom:3}}>{circleArtifact.name}</div>
              <div style={{fontFamily:"'IM Fell English',serif",fontSize:10,color:'#9a8050',textAlign:'center',fontStyle:'italic',lineHeight:1.4,marginBottom:8}}>{circleArtifact.effect}</div>
              <button onClick={()=>stash>=circleArtifact.cost&&onSpend(circleArtifact.cost,'artifact',circleArtifact)} disabled={stash<circleArtifact.cost}
                style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:900,letterSpacing:2,textTransform:'uppercase',padding:'7px',background:stash>=circleArtifact.cost?'rgba(200,120,20,0.22)':'rgba(20,12,5,0.5)',border:`1px solid ${stash>=circleArtifact.cost?'#c87820':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:stash>=circleArtifact.cost?'#e8a820':'#4a3010',cursor:stash>=circleArtifact.cost?'pointer':'not-allowed'}}>
                🌿 {circleArtifact.cost} Stash
              </button>
            </div>
          </div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:8}}>👥 Recruitment Pack</div>
            <div style={{background:'linear-gradient(180deg,#181008,#0c0804)',border:'1px solid rgba(160,100,25,0.45)',borderRadius:6,padding:'10px'}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:'#d0b060',textAlign:'center',marginBottom:3}}>{recruitPack.name}</div>
              <div style={{fontFamily:"'IM Fell English',serif",fontSize:10,color:'#8a7040',textAlign:'center',fontStyle:'italic',lineHeight:1.4,marginBottom:8}}>{recruitPack.desc}</div>
              <button onClick={()=>stash>=recruitPack.cost&&onSpend(recruitPack.cost,'recruit',recruitPack)} disabled={stash<recruitPack.cost}
                style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:900,letterSpacing:2,textTransform:'uppercase',padding:'7px',background:stash>=recruitPack.cost?'rgba(100,70,10,0.28)':'rgba(20,12,5,0.5)',border:`1px solid ${stash>=recruitPack.cost?'rgba(160,110,30,0.5)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:stash>=recruitPack.cost?'#c8a040':'#4a3010',cursor:stash>=recruitPack.cost?'pointer':'not-allowed'}}>
                🌿 {recruitPack.cost} Stash
              </button>
            </div>
          </div>
        </div>
        {/* CENTER */}
        <div style={{flex:1,padding:'14px 16px',display:'flex',flexDirection:'column',gap:14,overflow:'auto'}}>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase'}}>🃏 Cards for Sale</div>
              <button onClick={onReroll} style={{fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',padding:'4px 10px',background:'rgba(60,40,10,0.3)',border:'1px solid rgba(120,80,20,0.4)',borderRadius:2,color:'#8a6030',cursor:'pointer'}}>🔄 Reroll ({rerollCost} 🌿)</button>
            </div>
            <div style={{display:'flex',gap:10}}>
              {shopCards.map((card,i)=>{
                const price=card.rarity==='Rare'?8:card.rarity==='Uncommon'?5:3
                const canBuy=stash>=price
                const bc=card.type==='CORRUPT'?'#aa1111':card.type==='UTILITY'?'#22aa44':card.type==='EMBER'?'#c87820':'#9933cc'
                return(
                  <div key={i} style={{flex:1,background:'linear-gradient(180deg,#1a1008,#0e0804)',border:`1px solid ${bc}55`,borderRadius:6,overflow:'hidden',opacity:canBuy?1:0.6}}>
                    <div style={{height:4,background:bc}}/>
                    <div style={{padding:'8px 10px'}}>
                      <div style={{height:50,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,background:'rgba(0,0,0,0.3)',borderRadius:3,marginBottom:5}}>{card.emoji}</div>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,color:'#eedfc0',textAlign:'center',marginBottom:2}}>{card.name}</div>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:8,color:bc,textAlign:'center',letterSpacing:1.5,marginBottom:4}}>{card.type} · {card.rarity}</div>
                      <div style={{fontFamily:"'IM Fell English',serif",fontSize:10,color:'#9a8060',textAlign:'center',fontStyle:'italic',lineHeight:1.35,marginBottom:8,minHeight:30}}>{card.effect}</div>
                      <button onClick={()=>canBuy&&onSpend(price,'card',card)} disabled={!canBuy}
                        style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',padding:'5px',background:canBuy?'rgba(80,50,10,0.3)':'rgba(20,12,5,0.5)',border:`1px solid ${canBuy?'rgba(140,90,20,0.45)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:canBuy?'#c8a040':'#4a3010',cursor:canBuy?'pointer':'not-allowed'}}>
                        🌿 {price} Stash
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:3,color:'#8a6020',textTransform:'uppercase',marginBottom:10}}>📦 Booster Packs</div>
            <div style={{display:'flex',gap:12}}>
              {boosterPacks.map((pack,i)=>{
                const canBuy=stash>=pack.cost
                return(
                  <div key={i} style={{flex:1,background:'linear-gradient(180deg,#1e1208,#0c0804)',border:`1px solid ${canBuy?'rgba(160,110,25,0.45)':'rgba(60,40,10,0.22)'}`,borderRadius:6,padding:'12px',opacity:canBuy?1:0.5}}>
                    <div style={{fontSize:26,textAlign:'center',marginBottom:5}}>{pack.emoji}</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:'#d0b060',textAlign:'center',marginBottom:3}}>{pack.name}</div>
                    <div style={{fontFamily:"'IM Fell English',serif",fontSize:10,color:'#8a7040',textAlign:'center',fontStyle:'italic',lineHeight:1.4,marginBottom:10}}>{pack.desc}</div>
                    <button onClick={()=>canBuy&&onSpend(pack.cost,'pack',pack)} disabled={!canBuy}
                      style={{width:'100%',fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',padding:'7px',background:canBuy?'rgba(100,70,10,0.28)':'rgba(20,12,5,0.5)',border:`1px solid ${canBuy?'rgba(160,110,25,0.45)':'rgba(60,40,10,0.3)'}`,borderRadius:2,color:canBuy?'#c8a040':'#4a3010',cursor:canBuy?'pointer':'not-allowed'}}>
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
    <div ref={innerRef} draggable onDragStart={onDragStart} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{setOver(false);onDrop&&onDrop(e)}}
      style={{width:230,height:345,display:'flex',flexDirection:'column',background:st?'linear-gradient(180deg,#1a1a1a,#0a0a0a)':'linear-gradient(180deg,#1c1208,#0a0704)',
        border:isDiceTarget?'3px solid #e8a820':isAttacking?'2px solid #ff3300':over?'2px solid #e8a820':st?'1px solid #333':'2px solid rgba(190,120,25,0.85)',
        borderRadius:6,
        boxShadow:isDiceTarget?'0 0 30px rgba(232,168,32,0.7)':isAttacking?'0 0 40px rgba(255,50,0,0.8)':'0 6px 24px rgba(0,0,0,0.85)',
        transform:st?'rotate(15deg) scale(0.95)':'none',
        opacity:st?0.5:1,
        animation:(!st&&!isAttacking&&!isDiceTarget)?'throb 3s ease-in-out infinite':'none',
        transition:'border 0.2s, box-shadow 0.2s, opacity 0.3s, transform 0.3s',
        cursor:'grab',position:'relative'}}>
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

function HandCard({card,index,total,isHovered,isSelected,anyHovered,canAfford,onHover,onLeave,onClick,onDragStart,onDragEnd,isDragging,isShopBought,isDragOver,onHandDragOver,onHandDrop}){
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
        border:isSelected?`2px solid #cc0000`:isHovered&&canAfford?`2px solid ${bc}`:`1px solid ${bc}${isShopBought?'cc':'55'}`,
        borderRadius:7,cursor:'grab',position:'relative',
        transformOrigin:'bottom center',
        transform:isDragging?'scale(0.85) rotate(5deg)':isHovered&&canAfford?'translateY(-52px) scale(1.18) rotate(0deg)':isSelected?`rotate(${rot}deg) translateY(-50px)`:`rotate(${rot}deg) translateY(${yOff}px)`,
        transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1),border-color 0.15s,box-shadow 0.15s',
        zIndex:isDragging?0:isHovered?9999:anyHovered?1:isSelected?50:10-Math.abs(index-mid),
        boxShadow:isSelected?'0 0 0 2px #cc0000,0 0 22px rgba(200,0,0,0.75),0 0 45px rgba(180,0,0,0.4)':isShopBought?`0 0 12px ${bc}44`:isHovered&&canAfford?`0 36px 72px rgba(0,0,0,0.95),0 0 36px ${glow}`:'2px 4px 16px rgba(0,0,0,0.75)',
        opacity:isDragging?0.4:1,
        animation:shimmerAnim,
        margin:'0 -26px',userSelect:'none'}}>
      <div style={{height:6,flexShrink:0,borderRadius:'7px 7px 0 0',background:bc,boxShadow:`0 0 14px ${glow}`}}/>
      {card.embers>0?(
        <div style={{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',background:canAfford?'radial-gradient(circle at 35% 35%,#ff8800,#cc5500)':'rgba(40,20,5,0.9)',border:`2px solid ${canAfford?'#ff6600':'#4a2a10'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:900,color:canAfford?'#fff':'#5a3a10',boxShadow:canAfford?'0 0 10px rgba(255,100,0,0.6)':'none'}}>{card.embers}</div>
      ):(
        <div style={{position:'absolute',top:8,right:8,padding:'2px 5px',borderRadius:3,background:'rgba(200,120,20,0.22)',border:'1px solid #c87820',fontFamily:"'Cinzel',serif",fontSize:9,fontWeight:700,color:'#e8a820',letterSpacing:1}}>FREE</div>
      )}
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

function BossSection({enemy,currentHp,isWiggling,innerRef}){
  const pct=Math.max(0,(currentHp/enemy.maxHp)*100),isLow=currentHp<enemy.maxHp*.35
  return(
    <div ref={innerRef} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,animation:isWiggling?'wiggle 0.45s ease':'none',width:'100%'}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:21,letterSpacing:4,color:'#cc3300',textTransform:'uppercase',fontWeight:900,textShadow:'0 0 10px rgba(200,50,0,0.4)'}}>{enemy.circle} · {enemy.subtitle}</div>
      <div style={{display:'flex',alignItems:'center',gap:16,width:'100%'}}>
        <div style={{width:130,height:130,flexShrink:0,background:'radial-gradient(circle at 40% 35%,#3a0000,#080000)',border:`3px solid ${isLow?'#ff2222':'rgba(140,40,15,0.85)'}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,boxShadow:isLow?'0 0 40px rgba(220,0,0,0.7),0 0 80px rgba(150,0,0,0.3)':'0 0 20px rgba(120,0,0,0.5),0 0 40px rgba(80,0,0,0.2)',position:'relative',overflow:'hidden',transition:'all 0.5s'}}>
          {enemy.emoji}
          {isLow&&<div style={{position:'absolute',inset:0,background:'rgba(120,0,0,0.2)',animation:'pulse 1.2s ease infinite alternate'}}/>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:58,color:'#120804',lineHeight:1,marginBottom:8,textShadow:'1px 1px 0 rgba(0,0,0,0.5)'}}>{enemy.name}</div>
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
  const sz=wide?17:13;const start=total-left;return <div style={{display:'flex',gap:wide?4:4,flex:wide?1:undefined}}>{Array.from({length:total}).map((_,i)=>{const filled=i>=start;return <div key={i} style={{width:sz,height:sz,borderRadius:4,background:filled?color:'rgba(40,20,8,0.6)',border:`1px solid ${filled?color:'rgba(80,50,20,0.3)'}`,boxShadow:filled?`0 0 9px ${color}99`:'none',transition:'all 0.25s'}}/>})}</div>
}

function EndScreen({won,stats,seed,onReset}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:9800,background:won?'rgba(4,3,1,0.96)':'rgba(3,1,1,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,animation:'fadeIn 0.8s ease',overflow:'auto',padding:'30px 0'}}>
      <div style={{fontFamily:"'UnifrakturMaguntia',cursive",fontSize:76,color:won?'#d8c9a8':'#7a0000',textShadow:won?'0 0 60px rgba(210,160,20,0.5),3px 3px 0 #000':'0 0 60px rgba(100,0,0,0.6),3px 3px 0 #000'}}>{won?'Victory':'Fallen'}</div>
      <div style={{fontFamily:"'IM Fell English',serif",fontSize:17,color:'#a09060',fontStyle:'italic'}}>{won?'The Drifter has fallen. Circle II opens.':'The Vestibule claims another soul.'}</div>
      <div style={{background:'rgba(20,12,4,0.8)',border:'1px solid rgba(100,65,15,0.4)',borderRadius:6,padding:'18px 28px',minWidth:380}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:4,color:'#8a6020',textTransform:'uppercase',textAlign:'center',marginBottom:12}}>Run Statistics</div>
        {[['Strikes Thrown',stats.strikesThrown],['Total Damage Dealt',stats.totalDamage],['Highest Strike Damage',stats.highestStrike],['Too Stoned Events',stats.tooStonedCount],['Cards Played',stats.cardsPlayed],['Max Corruption',stats.maxCorruption+'%'],['Stash Earned',stats.stashEarned+' 🌿'],['Fights Survived',stats.fightsSurvived+' / 3']].map(function(row){
          return(
            <div key={row[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:'1px solid rgba(80,50,10,0.2)'}}>
              <span style={{fontFamily:"'IM Fell English',serif",fontSize:13,color:'#8a7040',fontStyle:'italic'}}>{row[0]}</span>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,color:'#c8a060'}}>{row[1]}</span>
            </div>
          )
        })}
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'#5a4a20',letterSpacing:2}}>RUN SEED: {seed.toString(16).toUpperCase()} — Share with friends!</div>
      <button onClick={onReset} style={{fontFamily:"'Cinzel',serif",fontSize:15,letterSpacing:4,color:won?'#ee2222':'#b09858',background:won?'rgba(100,0,0,0.22)':'transparent',border:won?'2px solid #7a0000':'1px solid rgba(90,60,20,0.5)',borderRadius:3,padding:'13px 46px',cursor:'pointer',textTransform:'uppercase'}}>
        {won?'⛧ Play Again':'↺ Try Again'}
      </button>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [gameState,setGameState]=useState('booster')
  const [runSeed]=useState(()=>Math.floor(Math.random()*0xFFFFFF))
  const [fightIndex,setFightIndex]=useState(0)
  const [enemy,setEnemy]=useState(ENEMIES[0])
  const [enemyHp,setEnemyHp]=useState(ENEMIES[0].maxHp)
  const [stage,setStage]=useState([null,null,null,null,null])
  const [deck,setDeck]=useState([]);const deckRef=useRef([]);
  const [hand,setHand]=useState([]);const handRef=useRef([]);
  const [discardPile,setDiscardPile]=useState([]);const discRef=useRef([]);
  const [embers,setEmbers]=useState(MAX_EMBERS)
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
  const [log,setLog]=useState(['⛧ The gig begins.'])
  const [damageFlash,setDamageFlash]=useState(false)
  const [animPhase,setAnimPhase]=useState('idle')
  const [corruption,setCorruption]=useState(0)
  const [stageDiveUsed,setStageDiveUsed]=useState(false)
  const [diceTarget,setDiceTarget]=useState(null)
  const [showDice,setShowDice]=useState(false)
  const [pendingEmbers,setPendingEmbers]=useState(0)
  const [circleArtifact]=useState(()=>CIRCLE_ARTIFACTS[Math.floor(Math.random()*CIRCLE_ARTIFACTS.length)])
  const [shopCards,setShopCards]=useState(()=>genShopCards())
  const [boosterPacks]=useState(()=>genBoosterPacks())
  const [recruitPack,setRecruitPack]=useState(()=>genRecruitPack())
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

  const drawUpTo=useCallback((h,d,disc,target)=>{
    let nh=[...h],nd=[...d],ndisc=[...disc]
    while(nh.length<target){
      if(nd.length===0){if(ndisc.length===0)break;nd=[...ndisc].sort(()=>Math.random()-.5);ndisc=[];addLog('🔄 Deck reshuffled.')}
      nh=[...nh,nd[0]];nd=nd.slice(1);playCard()
    }
    return{h:nh,d:nd,disc:ndisc}
  },[])

  const startGame=useCallback(selIds=>{
    const musicians=selIds.map(id=>ALL_MUSICIANS.find(m=>m.id===id))
    setStage([null,musicians[0],musicians[1],null,null])
    const d=buildDeck(runSeed)
    setHand(d.slice(0,HAND_SIZE))
    setDeck(d.slice(HAND_SIZE))
    setGameState('playing')
    addLog('⛧ '+musicians[0].name+' and '+musicians[1].name+' take the stage!')
  },[runSeed])

  const applyCard=useCallback((card,slotIdx)=>{
    if(card.embers>0&&embers<card.embers){addLog('⚠ Need '+card.embers+' Embers, have '+embers+'.');return false}
    if(card.id==='stagedive'&&stageDiveUsed){addLog('⚠ Stage Dive once per round only.');return false}
    const m=stage[slotIdx]
    let ns=[...stage],spent=card.embers,msg=''

    if(card.id==='amp'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk*2,_origAtk:m._origAtk||m.atk,tempBuff:true,buffCount:(m.buffCount||0)+1});msg='⚡ '+m.name+' doubled ATK!';addFloat('×2 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc')}
    else if(card.id==='warmup'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+1,buffCount:(m.buffCount||0)+1});msg='🎵 '+m.name+' +1 ATK!';addFloat('+1 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#9933cc')}
    else if(card.id==='newstrings'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{atk:m.atk+2,buffCount:(m.buffCount||0)+1});msg='🎸 '+m.name+' +2 ATK permanently!';addFloat('+2 ATK',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#e8a820')}
    else if(card.id==='encore'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{encoreReady:true,buffCount:(m.buffCount||0)+1});msg='🔁 '+m.name+' encores!';addFloat('ENCORE!',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#dd2222')}
    else if(card.id==='roadie'){if(!m)return false;ns[slotIdx]=Object.assign({},m,{stoneShield:true,buffCount:(m.buffCount||0)+1});msg='🛡 '+m.name+' shielded!'}
    else if(card.id==='stagedive'){
      if(!m)return false
      const dmg=m.hp
      const bc=getCenter(bossRef)
      setEnemyHp(function(prev){const next=Math.max(0,prev-dmg);addFloat(dmg,bc.x,bc.y-60,'#ff6600',true);return next})
      playHit();setIsWiggling(true);setTimeout(function(){setIsWiggling(false)},500)
      setStageDiveUsed(true);updStat('totalDamage',dmg);updStat('highestStrike',dmg,true)
      msg='🤘 '+m.name+' Stage Dives for '+dmg+' damage!'
    }
    else if(card.id==='wakeup'){if(!m)return false;if(!m.tooStoned){addLog('☕ '+m.name+' is already awake.');return false};ns[slotIdx]=Object.assign({},m,{tooStoned:false,hp:m.maxHp});msg='☕ '+m.name+' revived!';addFloat('REVIVED',getCenter(stageRefs.current[slotIdx]).x,getCenter(stageRefs.current[slotIdx]).y-70,'#22aa44')}
    else if(card.id==='soundcheck'){ns=ns.map(s=>s?Object.assign({},s,{hp:Math.min(s.maxHp,s.hp+3)}):null);msg='🔊 All members +3 HP!';addFloat('+3 HP',getCenter(bossRef).x,getCenter(bossRef).y-80,'#22aa44')}
    else if(card.id==='dialtoeleven'){const nc=Math.min(100,corruption+20);setCorruption(nc);updStat('maxCorruption',nc,true);msg='📻 Corruption +20% → '+nc+'%'}
    else if(card.id==='sigdecay'){const nc=Math.max(0,corruption-30);setCorruption(nc);msg='📡 Corruption -30% → '+nc+'%'}
    else if(card.id==='controlfeedback'){setCorruption(50);msg='🎚 Corruption set to 50%.'}
    else if(card.id==='feedbackloop'){const dmg=Math.floor(corruption);const bc2=getCenter(bossRef);setEnemyHp(function(prev){return Math.max(0,prev-dmg)});addFloat(dmg,bc2.x,bc2.y-60,'#aa1111',dmg>=20);playHit();updStat('totalDamage',dmg);msg='🎛 Feedback Loop: '+dmg+' damage!'}
    else if(card.id==='soundwall'){const bc3=getCenter(bossRef);setEnemyHp(function(prev){return Math.max(0,prev-5)});addFloat(5,bc3.x,bc3.y-60,'#dd2222');playHit();msg='🔈 Sound Wall! 5 direct damage.';updStat('totalDamage',5)}
    else if(card.id==='groupie'){const gain=3;setEmbers(function(p){return Math.min(MAX_EMBERS,p+gain-card.embers)});spent=0;playEmber();msg='🍯 Groupie! Net +'+(gain-card.embers)+' Embers.';addFloat('+'+gain+' 🔥',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff6600')}
    else if(card.id==='tappedout'){setPendingEmbers(function(p){return p+5});spent=0;playEmber();msg='🪙 Tapped Out! +5 Embers next Strike.'}
    else if(card.id==='burnset'){const res=drawUpTo([],deck,discardPile,HAND_SIZE);setHand(res.h);setDeck(res.d);setDiscardPile([...res.disc,...hand]);msg='🔥 Hand burned! Drew 6 new cards.'}
    else if(card.id==='overdrive'){if(corruption>80){ns=ns.map(function(s){return s&&!s.tooStoned?Object.assign({},s,{atk:s.atk*2,tempBuff:true,_origAtk:s._origAtk||s.atk}):s});msg='💥 OVERDRIVE! All ATK doubled!';addFloat('OVERDRIVE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#ff3300',true)}else{addLog('⚠ Need >80% Corruption.');return false}}
    else if(card.id==='sabbathsigil'){setCorruption(100);updStat('maxCorruption',100,true);msg='⛧ BLACK SABBATH SIGIL! Corruption 100%!';addFloat('HELLQUAKE!',getCenter(bossRef).x,getCenter(bossRef).y-80,'#aa1111',true)}
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
    return true
  },[embers,stage,corruption,stageDiveUsed,deck,discardPile,hand,bossRef,stageRefs])

  const handleDropOnStage=useCallback((slotIdx)=>{
    if(!dragCardUid||animPhase!=='idle')return
    const card=hand.find(c=>c.uid===dragCardUid)
    if(!card)return
    const ok=applyCard(card,slotIdx)
    if(ok){setHand(p=>p.filter(c=>c.uid!==dragCardUid));setDiscardPile(p=>[...p,card])}
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
    const toDisc=hand.filter(c=>selected.includes(c.uid))
    const rem=hand.filter(c=>!selected.includes(c.uid))
    const res=drawUpTo(rem,deck,[...discardPile,...toDisc],HAND_SIZE)
    setHand(res.h);setDeck(res.d);setDiscardPile(res.disc)
    setDiscardsLeft(p=>p-1);setSelected([])
    addLog('🗑 '+toDisc.length+' discarded & replaced.')
  },[selected,discardsLeft,animPhase,hand,deck,discardPile,drawUpTo])

  const handleStrike=useCallback(()=>{
    if(animPhase!=='idle'||strikesLeft<=0||enemyHp<=0)return
    const actives=stage.filter(m=>m&&!m.tooStoned)
    if(actives.length===0){addLog('⚠ No active members!');return}

    if(pendingEmbers>0){setEmbers(p=>Math.min(MAX_EMBERS,p+pendingEmbers));addLog('🪙 +'+pendingEmbers+' Embers from Tapped Out!');playEmber();setPendingEmbers(0)}

    setAnimPhase('attacking');setStrikesLeft(p=>p-1);updStat('strikesThrown',1)

    const buffed=actives.filter(m=>(m.buffCount||0)>0)
    const bandBonus=buffed.length>=5?1.35:buffed.length>=4?1.20:buffed.length>=3?1.10:1.0
    if(bandBonus>1)addLog('🎸 Band synergy! '+buffed.length+' buffed: +'+Math.round((bandBonus-1)*100)+'% damage!')

    const hasDbl=actives.some(m=>m.role==='Drummer')
    let dmg=actives.filter(m=>m.role!=='Drummer').reduce((s,m)=>s+m.atk,0)
    if(hasDbl)dmg*=2
    const encDmg=actives.filter(m=>m.encoreReady&&m.role!=='Drummer').reduce((s,m)=>s+m.atk,0)
    dmg+=encDmg
    dmg=Math.round(dmg*bandBonus)
    addLog('⚔ Band attacks for '+dmg+'!'+( hasDbl?' (Double Time!)':''))

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
      addFloat(dmg,bc.x,bc.y-60,dmg>=15?'#ff4400':'#dd2222',dmg>=15)
      updStat('totalDamage',dmg);updStat('highestStrike',dmg,true)

      setStage(function(p){return p.map(function(m){
        if(!m)return null
        var nm=Object.assign({},m)
        if(nm.encoreReady)nm=Object.assign({},nm,{encoreReady:false})
        if(nm.tempBuff&&nm._origAtk!==undefined)nm=Object.assign({},nm,{atk:nm._origAtk,_origAtk:undefined,tempBuff:false})
        return nm
      })})

      if(newEHp<=0){
        const stashEarned=6+Math.floor(Math.random()*3)+strikesLeft
        setStash(function(p){return p+stashEarned})
        updStat('stashEarned',stashEarned);updStat('fightsSurvived',1)
        addLog('⛧ Victory! +'+stashEarned+' Stash earned.')
        setTimeout(function(){
          if(fightIndex>=2){playVictory();setTimeout(function(){setGameState('end')},800)}
          else{
            setShopCards(genShopCards())
            setRecruitPack(genRecruitPack())
            setGameState('shop')
          }
        },1000)
        return
      }

      setTimeout(function(){
        setAnimPhase('boss')
        const activeM=stage.filter(function(m){return m&&!m.tooStoned})
        if(activeM.length===0){setAnimPhase('idle');return}
        const target=activeM[Math.floor(Math.random()*activeM.length)]
        setDiceTarget(target);setShowDice(true);playDice()
        setTimeout(function(){
          setShowDice(false)
          const variance=Math.floor(Math.random()*5)-2
          const actualDmg=Math.max(1,enemy.baseDmg+variance)
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
                addFloat('TOO STONED',getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-60,'#888',false)
              } else {
                ns2[ti]=Object.assign({},ns2[ti],{hp:Math.max(0,newHp),stoneShield:false})
              }
              addFloat(actualDmg,getCenter(stageRefs.current[ti]).x,getCenter(stageRefs.current[ti]).y-50,'#ff3300',false)
            }
            const allStoned=ns2.filter(function(m){return m}).every(function(m){return m.tooStoned})
            if(allStoned){setTimeout(function(){setGameState('end')},800)}
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
            setAnimPhase('idle');setSelected([]);
          },900)
        },1200)
      },delay+400)
    },delay+200)
  },[animPhase,strikesLeft,enemyHp,stage,hand,deck,discardPile,enemy,embers,pendingEmbers,fightIndex,strikesLeft,bossRef,stageRefs,drawUpTo])

  const handleShopLeave=useCallback(()=>{
    const nextIdx=fightIndex+1
    setFightIndex(nextIdx)
    const nextEnemy=ENEMIES[nextIdx]
    setEnemy(nextEnemy);setEnemyHp(nextEnemy.maxHp)
    setEmbers(MAX_EMBERS);setStrikesLeft(MAX_STRIKES);setDiscardsLeft(MAX_DISCARDS)
    setStageDiveUsed(false);setAnimPhase('idle');setSelected([]);setProjectiles([])
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
    setGameState('playing')
  },[fightIndex])

  const handleShopSpend=useCallback((cost,type,item)=>{
    if(stash<cost)return
    setStash(p=>p-cost)
    if(type==='card'){
      const nc=Object.assign({},item,{uid:Math.random().toString(36).slice(2),shopBought:true})
      setDeck(p=>[...p,nc])
      setShopBoughtIds(p=>[...p,nc.uid])
      addLog('🛒 Bought '+item.name+'!')
    } else {addLog('📦 Purchased: '+item.name+'!')}
  },[stash])

  const handleReroll=useCallback(()=>{
    if(stash<rerollCost)return
    setStash(p=>p-rerollCost);setRerollCost(p=>p+2)
    setShopCards(genShopCards());addLog('🔄 Shop rerolled.')
  },[stash,rerollCost])

  const handleReset=()=>{
    setGameState('booster');setFightIndex(0);setEnemy(ENEMIES[0]);setEnemyHp(ENEMIES[0].maxHp)
    setStage([null,null,null,null,null]);setDeck([]);setHand([]);setDiscardPile([])
    setEmbers(MAX_EMBERS);setStash(0);setStrikesLeft(MAX_STRIKES);setDiscardsLeft(MAX_DISCARDS)
    setAnimPhase('idle');setSelected([]);setProjectiles([]);setStageDiveUsed(false);setCorruption(0)
    setLog(['⛧ Starting fresh...']);setShopBoughtIds([])
    setStats({strikesThrown:0,totalDamage:0,highestStrike:0,tooStonedCount:0,cardsPlayed:0,maxCorruption:0,stashEarned:0,fightsSurvived:0})
  }

  const canStrike=animPhase==='idle'&&strikesLeft>0&&enemyHp>0&&stage.some(m=>m&&!m.tooStoned)
  const canDiscard=animPhase==='idle'&&discardsLeft>0&&selected.length>0
  const won=fightIndex>=2&&enemyHp<=0

  if(gameState==='booster')return <BoosterScreen onComplete={startGame} seed={runSeed}/>
  if(gameState==='shop')return <ShopScreen stash={stash} onSpend={handleShopSpend} onLeave={handleShopLeave} circleArtifact={circleArtifact} recruitPack={recruitPack} shopCards={shopCards} boosterPacks={boosterPacks} rerollCost={rerollCost} onReroll={handleReroll}/>
  if(gameState==='end')return <EndScreen won={won} stats={stats} seed={runSeed} onReset={handleReset}/>

  return(
    <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',background:'var(--void)',overflow:'hidden',position:'relative',userSelect:'none'}}>
      {damageFlash&&<div style={{position:'fixed',inset:0,zIndex:8500,pointerEvents:'none',background:'radial-gradient(ellipse at center,rgba(200,0,0,0.25),rgba(100,0,0,0.4))',animation:'flashFade 0.4s ease-out forwards'}}/>}
      {floats.map(f=><Float key={f.id} v={f.v} x={f.x} y={f.y} color={f.color} big={f.big} onDone={()=>remFloat(f.id)}/>)}
      {projectiles.map(p=><Projectile key={p.id} from={p.from} to={p.to} emoji={p.emoji} onDone={()=>setProjectiles(prev=>prev.filter(x=>x.id!==p.id))}/>)}
      {showDice&&diceTarget&&<DiceRoll target={diceTarget} onDone={()=>setShowDice(false)}/>}
      {/* PARCHMENT */}
      <div style={{flex:'0 0 63%',margin:'0',borderRadius:'4px 4px 0 0',position:'relative',overflow:'visible',background:'linear-gradient(168deg,#cbb872 0%,#bfa85a 20%,#c8b060 40%,#baa050 60%,#c4a85c 80%,#b89e50 100%)',border:'2px solid #7a5820',boxShadow:'inset 0 0 60px rgba(60,35,5,0.6),0 0 30px rgba(0,0,0,0.95)',display:'flex',flexDirection:'column'}}>
        <div style={{position:'absolute',inset:5,border:'1px solid rgba(80,50,10,0.28)',pointerEvents:'none',zIndex:10,borderRadius:2}}/>
        <div style={{padding:'10px 16px 8px',position:'relative',zIndex:5,display:'flex',justifyContent:'center',borderBottom:'1px solid rgba(60,35,5,0.3)',flexShrink:0}}>
          <div style={{width:'100%',maxWidth:760,background:'rgba(8,0,0,0.55)',border:'2px solid rgba(160,20,0,0.8)',borderRadius:8,padding:'12px 20px 14px',animation:'bossGlow 2s ease-in-out infinite',boxShadow:'0 0 30px rgba(150,0,0,0.4),inset 0 0 40px rgba(80,0,0,0.3)'}}>
            <BossSection enemy={enemy} currentHp={enemyHp} isWiggling={isWiggling} innerRef={bossRef}/>
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
            let dmg=act.filter(m=>m.role!=='Drummer').reduce((s,m)=>s+m.atk,0)
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
        <div style={{position:'absolute',left:0,top:0,bottom:32,zIndex:5,display:'flex',flexDirection:'column',gap:14,alignItems:'center',justifyContent:'center',background:'rgba(20,12,4,0.7)',borderRadius:'0 6px 6px 0',padding:'12px 14px',border:'1px solid rgba(100,65,15,0.3)',borderLeft:'none',minWidth:90}}>
          <DeckPile count={deck.length} label="Deck"/>
          <DeckPile count={discardPile.length} label="Discard"/>
        </div>

        {/* RIGHT COLUMN: Buttons/Embers/Info — absolutely positioned */}
        <div style={{position:'absolute',right:0,top:0,bottom:32,zIndex:5,display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',justifyContent:'center',padding:'8px 12px',background:'rgba(10,5,2,0.6)',borderRadius:'6px 0 0 6px',border:'1px solid rgba(100,65,15,0.3)',borderRight:'none'}}>
          <button onClick={handleStrike} disabled={!canStrike}
            style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'9px 20px',background:canStrike?'rgba(130,0,0,0.45)':'rgba(25,12,5,0.4)',border:`2px solid ${canStrike?'#cc1111':'#2a1508'}`,borderRadius:3,color:canStrike?'#ee2222':'#3a1a08',cursor:canStrike?'pointer':'not-allowed',textShadow:canStrike?'0 0 14px rgba(200,0,0,0.6)':'none',boxShadow:canStrike?'0 0 22px rgba(130,0,0,0.3)':'none',transition:'all 0.15s',width:190}}>⚔ Strike</button>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',width:190}}>
            <PhaseDots left={strikesLeft} total={MAX_STRIKES} color='#dd2222' wide={true}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:900,color:strikesLeft>0?'#dd2222':'#555',minWidth:28,textAlign:'right'}}>{strikesLeft}/{MAX_STRIKES}</span>
          </div>
          <div style={{height:8}}/>
          <button onClick={handleDiscard} disabled={!canDiscard}
            style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:900,letterSpacing:3,textTransform:'uppercase',padding:'9px 20px',background:canDiscard?'rgba(100,70,0,0.4)':'rgba(25,15,5,0.4)',border:`2px solid ${canDiscard?'#cc9900':'#2a1a05'}`,borderRadius:3,color:canDiscard?'#f0c030':'#4a3010',cursor:canDiscard?'pointer':'not-allowed',textShadow:canDiscard?'0 0 14px rgba(220,160,0,0.6)':'none',boxShadow:canDiscard?'0 0 22px rgba(140,100,0,0.35)':'none',transition:'all 0.15s',width:190}}>↓ Discard</button>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',width:190}}>
            <PhaseDots left={discardsLeft} total={MAX_DISCARDS} color='#e8a820' wide={true}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:900,color:discardsLeft>0?'#e8a820':'#555',minWidth:28,textAlign:'right'}}>{discardsLeft}/{MAX_DISCARDS}</span>
          </div>
          <div style={{height:8}}/>
          <EmberDisplayLarge current={embers} max={MAX_EMBERS}/>
          <div style={{height:6}}/>
          <div style={{display:'flex',gap:14,justifyContent:'flex-end',padding:'4px 0'}}>
            {[['Fight',(fightIndex+1)+'/3','#dd2222'],['Corrupt',corruption+'%',corruption>60?'#ff3300':'#aa5500'],['Stash',stash,'#44cc44']].map(function(item){return(
              <div key={item[0]} style={{textAlign:'center',padding:'0 4px'}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:'#9a7a40',letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>{item[0]}</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900,color:item[2],lineHeight:1}}>{item[1]}</div>
              </div>
            )})}
          </div>
        </div>

        {/* CARD FAN — takes full height, padded to avoid overlapping columns */}
        <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:30,paddingLeft:110,paddingRight:220,overflow:'visible',minHeight:0,position:'relative',isolation:'isolate',zIndex:1}}>
          {hand.map((card,i)=>(
            <HandCard key={card.uid} card={card} index={i} total={hand.length}
              isHovered={hovered===card.uid} isSelected={selected.includes(card.uid)}
              anyHovered={hovered!==null}
              canAfford={card.embers===0||embers>=card.embers}
              isDragging={dragHandIdx===i} isShopBought={shopBoughtIds.includes(card.uid)}
              onHover={()=>setHovered(card.uid)} onLeave={()=>setHovered(null)}
              onClick={()=>setSelected(p=>p.includes(card.uid)?p.filter(x=>x!==card.uid):[...p,card.uid])}
              onDragStart={()=>{setDragHandIdx(i);setDragCardUid(card.uid)}}
              onDragEnd={()=>{setDragHandIdx(null);setDragOverHandIdx(null)}}
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
