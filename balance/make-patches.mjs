#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Regenerates the .patch files in balance/ from the CURRENT contents of the
// real source files. Run it after pulling, so the patches still apply.
//
//   node balance/make-patches.mjs
//
// It never writes to src/ — it copies the file to a temp tree, edits the copy,
// and diffs. Every edit asserts its anchor text first, so a patch is never
// generated against a file that has moved out from under it.
// ═══════════════════════════════════════════════════════════════════════════
import{readFileSync,writeFileSync,mkdirSync,rmSync,cpSync}from'fs'
import{execFileSync}from'child_process'
import{dirname,join}from'path'
import{fileURLToPath}from'url'

const HERE=dirname(fileURLToPath(import.meta.url))
const ROOT=join(HERE,'..')
const TMP='/tmp/vst-patchgen'

function sub(src,anchor,replacement){
  if(!src.includes(anchor))throw new Error('ANCHOR NOT FOUND:\n'+anchor.slice(0,200))
  if(src.split(anchor).length>2)throw new Error('ANCHOR NOT UNIQUE:\n'+anchor.slice(0,200))
  return src.replace(anchor,replacement)
}

// Build one patch: {name, files:{relPath: transformFn}}
function buildPatch(name,files,header){
  rmSync(TMP,{recursive:true,force:true});mkdirSync(TMP,{recursive:true})
  const diffs=[]
  for(const[rel,fn]of Object.entries(files)){
    const orig=readFileSync(join(ROOT,rel),'utf8')
    const next=fn(orig)
    if(next===orig)throw new Error(`patch ${name}: ${rel} unchanged`)
    mkdirSync(join(TMP,'a',dirname(rel)),{recursive:true})
    mkdirSync(join(TMP,'b',dirname(rel)),{recursive:true})
    writeFileSync(join(TMP,'a',rel),orig)
    writeFileSync(join(TMP,'b',rel),next)
    let d=''
    try{execFileSync('git',['diff','--no-index','--','a/'+rel,'b/'+rel],{cwd:TMP,encoding:'utf8'})}
    catch(e){d=e.stdout}   // git diff --no-index exits 1 when files differ
    if(!d)throw new Error(`patch ${name}: empty diff for ${rel}`)
    // git diff --no-index prefixes the paths it was given, so they come out as
    // a/a/<rel> and b/b/<rel>. Strip the doubling so `git apply` from the repo
    // root with the default -p1 lands on the real file.
    d=d.replace(new RegExp('a/a/'+rel.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'),'g'),'a/'+rel)
       .replace(new RegExp('b/b/'+rel.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'),'g'),'b/'+rel)
    diffs.push(d)
  }
  writeFileSync(join(HERE,name),header+'\n'+diffs.join(''))
  console.log('wrote balance/'+name)
}

// ═══ PATCH 1 — diminishing returns per chain within a strike ═══════════════
const LADDER='[1.60, 1.25, 1.10, 1.02]'

const cardsJs=s=>sub(s,
`// ── CORRUPTION GIFTS ─`,
`// ── RIFF CHAIN DIMINISHING RETURNS ─────────────────────────────────────────
// The Nth chain completed IN ONE STRIKE is worth CHAIN_MULT_LADDER[N-1]; the
// last entry repeats for every chain past it. Before this the rate was a flat
// x1.78 with no cap, no decay and no cost, so k chains in a strike were worth
// 1.78^k — measured p90 amplification x68 and a 32% chance of one-shotting a
// BOSS. The first chain is deliberately still the biggest single multiplier a
// card play can produce; only the stack is flattened.
// Keep in sync with the copy in vestibule-sim-kwstacks.js.
export const CHAIN_MULT_LADDER = ${LADDER}
export function chainMultFor(nthZeroBased){
  return CHAIN_MULT_LADDER[Math.min(nthZeroBased, CHAIN_MULT_LADDER.length - 1)]
}

// ── CORRUPTION GIFTS ─`)

const appJsx=s=>{
  s=sub(s,
    `import {ALL_CARDS,CARD_UPGRADES,RIFF_CHAINS,CORRUPTION_CARDS} from './data/cards.js'`,
    `import {ALL_CARDS,CARD_UPGRADES,RIFF_CHAINS,CORRUPTION_CARDS,chainMultFor} from './data/cards.js'`)
  // Move the mult calculation ABOVE setComboFlash so the flash shows the real number.
  s=sub(s,
`        setChainCallout(chain.name);setTimeout(()=>setChainCallout(null),1200)
          setComboFlash({name:chain.name,color:chain.color,emoji:chain.emoji,mult:Math.round(strikeMultRef.current*1.78*100)/100,card1:ALL_CARDS.find(c=>c.id===chain.cards[0])?.name||chain.cards[0],card2:ALL_CARDS.find(c=>c.id===chain.cards[1])?.name||chain.cards[1]})
        playSfx('chain_combo');triggerShake(18,600);setChainFlashActive(true);setTimeout(()=>setChainFlashActive(false),600);
        // Octave Pedal: first chain each fight has its mult applied twice (×1.78 → ×3.17)
        const _octaveActive=activePassives.some(p=>p.id==='octavepedal')&&!octavePedalFiredRef.current
        const _chainMult=_octaveActive?(1.78*1.78):1.78`,
`        // ── DIMINISHING RETURNS (balance pass) ──
        // combosFiredRef holds the chains ALREADY fired this strike, and this
        // chain is pushed onto it further down, so its length is this chain's
        // 0-based index within the strike. Chains still fire unlimited times —
        // they just stop compounding at 1.78^k.
        const _chainNth=combosFiredRef.current.length
        const _chainBase=chainMultFor(_chainNth)
        setChainCallout(chain.name);setTimeout(()=>setChainCallout(null),1200)
          setComboFlash({name:chain.name,color:chain.color,emoji:chain.emoji,mult:Math.round(strikeMultRef.current*_chainBase*100)/100,card1:ALL_CARDS.find(c=>c.id===chain.cards[0])?.name||chain.cards[0],card2:ALL_CARDS.find(c=>c.id===chain.cards[1])?.name||chain.cards[1]})
        playSfx('chain_combo');triggerShake(18,600);setChainFlashActive(true);setTimeout(()=>setChainFlashActive(false),600);
        // Octave Pedal: first chain each fight has its mult applied twice.
        // It reads _chainBase, so the pedal is still "double the chain you just
        // fired" — and because the pedal only ever fires on the FIRST chain of a
        // fight, it always doubles the top rung of the ladder.
        const _octaveActive=activePassives.some(p=>p.id==='octavepedal')&&!octavePedalFiredRef.current
        const _chainMult=_octaveActive?(_chainBase*_chainBase):_chainBase`)
  // The '×1.78' fallback printed by the combo flash when mult is missing.
  s=sub(s,`×{comboFlash.mult?.toFixed(2)||'1.78'}`,`×{comboFlash.mult?.toFixed(2)||'1.60'}`)
  return s
}

const simJs=s=>sub(s,
`            gs._firedChains.add(ck);gs._strikeMult=Math.min(10000,Math.round((gs._strikeMult*1.78)*100)/100)`,
`            // ── DIMINISHING RETURNS — keep in sync with CHAIN_MULT_LADDER in
            //    src/data/cards.js (the sim keeps its own copy of card data).
            const _nth=(gs._chainsThisStrike||0);gs._chainsThisStrike=_nth+1
            const _cl=CHAIN_MULT_LADDER_SIM
            const _cm=_cl[Math.min(_nth,_cl.length-1)]
            gs._firedChains.add(ck);gs._strikeMult=Math.min(10000,Math.round((gs._strikeMult*_cm)*100)/100)`)

const simJs2=s=>{
  s=sub(s,
`const RIFF_CHAINS_SIM=[`,
`// Mirror of CHAIN_MULT_LADDER in src/data/cards.js. Nth chain in one strike.
const CHAIN_MULT_LADDER_SIM=${LADDER}
const RIFF_CHAINS_SIM=[`)
  // reset the per-strike counter alongside the other per-strike chain state
  s=sub(s,
`    gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set()
    if(gs.artifacts.some(a=>a.id==='a3'))gs._nextCardFree=true`,
`    gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set();gs._chainsThisStrike=0
    if(gs.artifacts.some(a=>a.id==='a3'))gs._nextCardFree=true`)
  s=sub(s,
`  gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set();gs._allCardsFree=false;gs._hellquakeFired=false`,
`  gs._strikeMult=1.0;gs._cardsPlayedIds=[];gs._firedChains=new Set();gs._chainsThisStrike=0;gs._allCardsFree=false;gs._hellquakeFired=false`)
  return simJs(s)
}

buildPatch('01-chain-diminishing-returns.patch',{
  'src/data/cards.js':cardsJs,
  'src/App.jsx':appJsx,
  'vestibule-sim-kwstacks.js':simJs2,
},`# PATCH 1/2 — Riff Chain diminishing returns
#
#   The Nth chain in a strike is worth ${LADDER}[N-1] instead of a flat x1.78.
#   Apply with:  git apply balance/01-chain-diminishing-returns.patch
#
#   Touches: src/data/cards.js (new export), src/App.jsx (chain firing block),
#            vestibule-sim-kwstacks.js (the same rule in the sim).
#   Nothing else reads 1.78. Verified: grep -n "1\\.78" src/ vestibule-sim-kwstacks.js
`)

// ═══ PATCH 2 — chains also pay a band-ATK-scaled flat bonus ════════════════
const CHAIN_ATK_BONUS='0.75'

const cardsJs2=s=>sub(s,
`export const CHAIN_MULT_LADDER = ${LADDER}`,
`export const CHAIN_MULT_LADDER = ${LADDER}
// Each chain ALSO adds flat damage equal to CHAIN_ATK_BONUS x the band's raw
// ATK line, applied AFTER the multiplier cascade so it cannot itself be
// amplified. This is the half of the chain payoff that scales with the band you
// actually recruited: without it the band's stat line is 0.3% of the damage a
// strike deals, and doubling every member's ATK moves the win rate by 1.25x.
export const CHAIN_ATK_BONUS = ${CHAIN_ATK_BONUS}`)

const appJsx2=s=>{
  s=sub(s,
    `import {ALL_CARDS,CARD_UPGRADES,RIFF_CHAINS,CORRUPTION_CARDS,chainMultFor} from './data/cards.js'`,
    `import {ALL_CARDS,CARD_UPGRADES,RIFF_CHAINS,CORRUPTION_CARDS,chainMultFor,CHAIN_ATK_BONUS} from './data/cards.js'`)
  // 1. Capture the band's raw ATK line before any multiplier touches it.
  s=sub(s,
`    },0)+p10Bonus
    let _bkRunning=dmg`,
`    },0)+p10Bonus
    // Raw band ATK line, before DOUBLE TIME / trip / corruption / relics /
    // strikeMult. The Riff Chain band bonus is measured in these units.
    const _bandAtkBase=dmg
    let _bkRunning=dmg`)
  // 2. Add the bonus to the real total.
  s=sub(s,
`      const finalDmg=Math.round(dmg*tripMult*currentMult*corruptionMult*artifactMult)+_flatArtifactDmg`,
`      // ── RIFF CHAIN BAND BONUS ──
      // Each chain fired this strike adds CHAIN_ATK_BONUS x the raw band ATK
      // line, AFTER the cascade so it is never amplified. A chain is therefore
      // worth more to a band with 40 ATK than to a band with 11, which is the
      // whole point: recruiting has to change the number on the screen.
      const _chainAtkBonusDmg=Math.round(_bandAtkBase*CHAIN_ATK_BONUS*_combosThisStrike.length)
      const finalDmg=Math.round(dmg*tripMult*currentMult*corruptionMult*artifactMult)+_flatArtifactDmg+_chainAtkBonusDmg`)
  // 3. Show it in the damage breakdown, right after the flat relic line.
  s=sub(s,
`      // ── SHREDDER SIGNATURE: apply echo damage from chains queued PREVIOUS strike ──`,
`      if(_chainAtkBonusDmg>0){
        _runningDmg=_runningDmg+_chainAtkBonusDmg
        _breakdownLines.push({type:'add',label:'⛧ Riff Chain band bonus ×'+_combosThisStrike.length,emoji:'⛧',value:_chainAtkBonusDmg,runningAfter:_runningDmg,color:'#ffdd00'})
      }
      // ── SHREDDER SIGNATURE: apply echo damage from chains queued PREVIOUS strike ──`)
  return s
}

const simJs3=s=>{
  s=sub(s,
`const CHAIN_MULT_LADDER_SIM=${LADDER}`,
`const CHAIN_MULT_LADDER_SIM=${LADDER}
// Mirror of CHAIN_ATK_BONUS in src/data/cards.js.
const CHAIN_ATK_BONUS_SIM=${CHAIN_ATK_BONUS}`)
  s=sub(s,
`    for(const m of aliveNow){
      if(paranoiaVictimUid&&m.uid===paranoiaVictimUid)continue;
      if(m._skipAttack)continue;
      let atk=m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0);`,
`    let _bandAtkBase=0
    for(const m of aliveNow){
      if(paranoiaVictimUid&&m.uid===paranoiaVictimUid)continue;
      if(m._skipAttack)continue;
      let atk=m.atk+(m.permAtkBonus||0)+(m.tempAtkBonus||0);`)
  s=sub(s,
`      atk+=_auraAtk[m.uid]||0
      if(m.ampedThisStrike)atk*=Math.pow(2,m.ampedThisStrike);`,
`      atk+=_auraAtk[m.uid]||0
      // Raw band ATK line — the units the Riff Chain band bonus is measured in.
      if(m.role!=='Drummer')_bandAtkBase+=Math.max(0,atk)*((m.encoreThisStrike||m._kwDoubleStrike)?2:1)
      if(m.ampedThisStrike)atk*=Math.pow(2,m.ampedThisStrike);`)
  s=sub(s,
`    if(gs._strikeMult>1.0)strikeDmg=Math.round(strikeDmg*gs._strikeMult)`,
`    if(gs._strikeMult>1.0)strikeDmg=Math.round(strikeDmg*gs._strikeMult)
    // ── RIFF CHAIN BAND BONUS — after every multiplier, so it never compounds.
    {const _cn=gs._firedChains?gs._firedChains.size:0
     if(_cn>0)strikeDmg+=Math.round(_bandAtkBase*CHAIN_ATK_BONUS_SIM*_cn)}`)
  return s
}

buildPatch('02-chain-band-atk-bonus.patch',{
  'src/data/cards.js':s=>cardsJs2(cardsJs(s)),
  'src/App.jsx':s=>appJsx2(appJsx(s)),
  'vestibule-sim-kwstacks.js':s=>simJs3(simJs2(s)),
},`# PATCH 2/2 — Riff Chains also pay a band-ATK-scaled flat bonus
#
#   Every chain fired in a strike adds ${CHAIN_ATK_BONUS} x the band's raw ATK line as flat
#   damage, applied AFTER the whole multiplier cascade so it can never be
#   amplified. This is the half of the fix that makes recruiting matter.
#
#   THIS PATCH INCLUDES PATCH 1. Apply this one OR patch 1, not both:
#     git apply balance/02-chain-band-atk-bonus.patch
#
#   Touches: src/data/cards.js, src/App.jsx (strike body: band ATK capture,
#            finalDmg, damage-breakdown line), vestibule-sim-kwstacks.js.
`)
