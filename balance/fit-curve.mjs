#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// HP CURVE AUTO-FITTER
//
// Iteratively adjusts a 27-entry boss HP curve until every fight index has the
// SAME pass rate — which is exactly the "steady death rate at every circle"
// requirement. The target pass rate is derived from the desired win rate:
//
//     passRate = targetWinRate ^ (1/27)
//
// (0.22 ^ (1/27) = 0.9448 — a 22% run win rate over 27 sequential checks needs
// each individual check to be cleared 94.5% of the time.)
//
//   node balance/fit-curve.mjs <startCurveMode> <targetWin> <iters> <games> [extraEnv...]
//
// e.g. node balance/fit-curve.mjs v20 0.22 8 1200 V1_NO_OVERTIME=1 V5_HP_NOT_LOSS=1 V6_FULL_HEAL=1
//
// Prints the fitted curve as a JS array ready to paste, plus the per-fight
// pass-rate trace of every iteration.
// ═══════════════════════════════════════════════════════════════════════════
import{execFileSync}from'child_process'
import{fileURLToPath}from'url'
import{dirname,join}from'path'

const HERE=dirname(fileURLToPath(import.meta.url))
const SIM=join(HERE,'sim-difficulty.js')
const [,,mode='v20',targetWinS='0.22',itersS='8',gamesS='1200',...extra]=process.argv
const TARGET_WIN=parseFloat(targetWinS), ITERS=parseInt(itersS), GAMES=parseInt(gamesS)
// SHAPE: if BOSS_PASS is set, non-boss fights are made comfortable and the
// circle boss carries the tension (the Balatro small/big/BOSS structure), with
// the non-boss rate solved so the product still hits the target win rate:
//     p_nonboss^18 * p_boss^9 = targetWin
// ── SHAPE ──
// FLAT (default): every fight gets the same pass rate, W^(1/27).
// BALATRO (SHAPE=balatro): the structural match to the target game. Vestibule
// already has Balatro's skeleton — 3 fights per circle, 9 circles, every 3rd
// fight a circle boss. So:
//     fights 1 and 2 of a circle  = Small / Big blind  -> comfortable
//     fight 3 of a circle         = BOSS blind         -> the real check
//     Circle IX                   = Ante 8             -> a step up on both
// Tunable with NONBOSS_PASS / BOSS_PASS / C9_NONBOSS_PASS / C9_BOSS_PASS.
const SHAPE=process.env.SHAPE||(process.env.BOSS_PASS?'boss':'flat')
const FLAT_PASS=Math.pow(TARGET_WIN,1/27)
const P_NB =parseFloat(process.env.NONBOSS_PASS   ||'0.99')
const P_B  =parseFloat(process.env.BOSS_PASS      ||'0.88')
const P9_NB=parseFloat(process.env.C9_NONBOSS_PASS||'0.97')
const P9_B =parseFloat(process.env.C9_BOSS_PASS   ||'0.65')
const isBoss=f=>((f+1)%3===0), isC9=f=>f>=24
function targetFor(f){
  if(SHAPE==='flat')return FLAT_PASS
  if(SHAPE==='boss'){
    // solve p_nonboss so the product still hits TARGET_WIN, given BOSS_PASS
    const nb=Math.pow(TARGET_WIN/Math.pow(P_B,9),1/18)
    return isBoss(f)?P_B:nb
  }
  // balatro
  // NOTE f26: Lucifer is TWO simFight calls (two phases of the same total), so
  // the measured pass rate at index 26 is PER PHASE and the run-level pass is
  // its square. C9_BOSS_PASS is specified per-phase for that reason — 0.81 per
  // phase is a 66% chance of actually beating Lucifer.
  if(isC9(f))return isBoss(f)?P9_B:P9_NB
  return isBoss(f)?P_B:P_NB
}
const TARGET_PASS=FLAT_PASS

// NOTE: no LUCIFER_HP knob any more. Live Lucifer is a FLAT 666,666 total with
// no deck scale (App.jsx getScaledMaxHp ~5209). Entry 26 of the curve below is
// read by the sim as that flat total, so the fitter tunes it directly.
const baseEnv={NO_SKIP:'1',START_PICK:'1',QUIET:'1'}
for(const e of extra){const i=e.indexOf('=');baseEnv[e.slice(0,i)]=e.slice(i+1)}

function run(curve){
  const env={...process.env,...baseEnv,HP_CURVE_MODE:'custom',HP_CURVE:curve.join(',')}
  const out=execFileSync(process.execPath,[SIM,String(GAMES),'bronze','standard'],{env,cwd:join(HERE,'..'),maxBuffer:1<<28}).toString()
  const m=out.match(/###LABJSON###(.*)/)
  if(!m)throw new Error('no json')
  return JSON.parse(m[1])
}

// seed curve
const seedEnv={...process.env,...baseEnv,HP_CURVE_MODE:mode,DUMP_CURVE:'1'}
let curve
if(mode==='v20')curve=[30,74,180,270,410,660,770,900,1300,1300,1600,2400,2300,2700,3600,3800,4600,6000,5600,6100,8100,8100,9700,11000,11000,12000,60000]
else if(mode==='v9')curve=Array.from({length:27},(_,f)=>Math.round(45*Math.pow(1.25,f)))
else curve=mode.split(',').map(Number)

{
  let implied=1;for(let f=0;f<27;f++)implied*=targetFor(f)*(f===26?targetFor(f):1) // f26 counts twice: two phases
  console.log(`shape=${SHAPE}  requested win ${(TARGET_WIN*100).toFixed(0)}%  ->  implied win from the target pass rates: ${(implied*100).toFixed(1)}%`)
  console.log('  per-fight targets: '+Array.from({length:27},(_,f)=>targetFor(f).toFixed(2).slice(1)).join(' '))
}
console.log(`extra env: ${JSON.stringify(baseEnv)}\n`)

for(let it=0;it<ITERS;it++){
  const j=run(curve)
  const pass=j.diff.passRateByFight, n=j.diff.fightsFoughtAt
  const rmse=Math.sqrt(pass.reduce((s,p,f)=>s+(n[f]>30?(p-targetFor(f))**2:0),0)/27)
  console.log(`it${it}  win=${String(j.winRate).padStart(6)}%  C1=${String(j.diff.c1Deaths).padStart(5)}  mid=${String(j.diff.middleMass).padStart(5)}  C9=${String(j.diff.c9Deaths).padStart(5)}  str/f=${j.strikesPerFight}  passRMSE=${rmse.toFixed(4)}`)
  console.log('     pass: '+pass.map((p,f)=>n[f]>30?p.toFixed(2).slice(1):' --').join(' '))
  if(it===ITERS-1)break
  // multiplicative correction. Damage is ~lognormal in HP, so a proportional
  // step on HP moves the pass rate smoothly; k damps the step.
  const k=2.2
  curve=curve.map((h,f)=>{
    if(n[f]<30)return h                    // too few samples this deep, leave it
    const err=pass[f]-targetFor(f)         // >0 = too easy -> raise HP
    const factor=Math.min(1.6,Math.max(0.6,1+k*err))
    return Math.max(10,Math.round(h*factor))
  })
}

// round to 2 significant figures so the published table is memorable
const rnd=x=>{const e=Math.pow(10,Math.max(0,Math.floor(Math.log10(x))-1));return Math.round(x/e)*e}
const pretty=curve.map(rnd)
console.log('\nfitted (raw)   :',JSON.stringify(curve))
console.log('fitted (2 s.f.):',JSON.stringify(pretty))
const jf=run(pretty)
console.log(`\nrounded curve check: win=${jf.winRate}%  C1=${jf.diff.c1Deaths}  mid=${jf.diff.middleMass}  C9=${jf.diff.c9Deaths}  str/f=${jf.strikesPerFight}  med=${jf.diff.strikesMedian}  4th%=${jf.diff.pctFightsToFinalStrike}  1shot=${jf.oneShotRate}`)
