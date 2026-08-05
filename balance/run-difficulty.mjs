#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// DIFFICULTY CURVE LAB — variant runner
//
// Spawns balance/sim-difficulty.js once per (variant × policy) cell and prints
// the comparison table DIFFICULTY_CURVE.md is built from.
//
//   node balance/run-difficulty.mjs <spec.json> [gamesPerCell] [parallel]
//
// spec.json: { "regime": {ENV...}, "variants":[{name, env:{}}] }
// Each variant is run twice: POLICY=good and POLICY=weak. The win-rate ratio
// between them is the deck-skill sensitivity metric.
//
// Writes raw results to balance/results/<specName>.json
// ═══════════════════════════════════════════════════════════════════════════
import{spawn}from'child_process'
import{readFileSync,writeFileSync,mkdirSync}from'fs'
import{fileURLToPath}from'url'
import{dirname,join,basename}from'path'

const HERE=dirname(fileURLToPath(import.meta.url))
const SIM=join(HERE,'sim-difficulty.js')
const specPath=process.argv[2]
const GAMES=parseInt(process.argv[3])||4000
const PAR=parseInt(process.argv[4])||2
const spec=JSON.parse(readFileSync(specPath,'utf8'))
const regime=spec.regime||{}
const stake=spec.stake||'bronze'
const deck=spec.deck||'standard'
const policies=spec.policies||['good','weak']

const cells=[]
for(const v of spec.variants)for(const p of policies)
  cells.push({variant:v.name,policy:p,env:{...regime,...v.env,POLICY:p,...(p==='weak'?{CHAIN_SEEK:'0'}:{})}})

function runCell(cell){
  return new Promise((res,rej)=>{
    const env={...process.env,...cell.env,QUIET:'1',LAB_LABEL:cell.variant}
    const p=spawn(process.execPath,[SIM,String(GAMES),stake,deck],{env,cwd:join(HERE,'..')})
    let out='',err=''
    p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d)
    p.on('close',code=>{
      const m=out.match(/###LABJSON###(.*)/)
      if(!m)return rej(new Error(`cell ${cell.variant}/${cell.policy} produced no JSON (code ${code})\n${err}\n${out.slice(-600)}`))
      res({...cell,...JSON.parse(m[1])})
    })
  })
}

const results=[]
let idx=0
async function worker(){
  while(idx<cells.length){
    const c=cells[idx++]
    let r
    try{r=await runCell(c)}catch(e){process.stderr.write('  ✗ '+e.message+'\n');continue}
    results.push(r)
    process.stderr.write(`  ✓ ${r.variant.padEnd(26)} ${r.policy.padEnd(5)} win=${String(r.winRate).padStart(6)}%  C1=${String(r.diff.c1Deaths).padStart(5)}  mid=${String(r.diff.middleMass).padStart(5)}\n`)
  }
}
process.stderr.write(`\nDIFFICULTY LAB · ${basename(specPath)} · ${cells.length} cells × ${GAMES} games (${stake}/${deck})\n`)
process.stderr.write(`regime: ${JSON.stringify(regime)}\n\n`)
const t0=Date.now()
await Promise.all(Array.from({length:PAR},worker))
process.stderr.write(`\ndone in ${((Date.now()-t0)/1000).toFixed(0)}s\n\n`)

mkdirSync(join(HERE,'results'),{recursive:true})
const outName=basename(specPath).replace(/\.json$/,'')
writeFileSync(join(HERE,'results',outName+'.json'),JSON.stringify({spec,games:GAMES,results},null,1))

// ── TABLE ──
const by=new Map()
for(const r of results){if(!by.has(r.variant))by.set(r.variant,{});by.get(r.variant)[r.policy]=r}
const se=p=>Math.sqrt(p/100*(1-p/100)/GAMES)*100
const H=['variant','win%','±','C1%','mid%','C9%','condF3','str/fgt','med','4th%','bStr','b4th%','b1shot%','1shot%','stoned%','weak%','skill×']
const rows=[]
for(const v of spec.variants){
  const g=by.get(v.name);if(!g)continue
  const b=g.good,w=g.weak
  if(!b)continue
  const D=b.diff
  const ratio=(w&&w.winRate>0)?(b.winRate/w.winRate):(w?Infinity:NaN)
  rows.push([v.name,b.winRate.toFixed(2),se(b.winRate).toFixed(2),
    D.c1Deaths.toFixed(1),D.middleMass.toFixed(1),D.c9Deaths.toFixed(1),
    D.condWinAtF3.toFixed(1),b.strikesPerFight,D.strikesMedian,D.pctFightsToFinalStrike,
    b.bossStrikesPerFight,D.pctBossFightsToFinalStrike,b.bossOneShotRate,
    b.oneShotRate,D.deathStoned,
    w?w.winRate.toFixed(2):'-',isFinite(ratio)?ratio.toFixed(2)+'x':(w?'∞':'-')])
}
const wid=H.map((h,i)=>Math.max(h.length,...rows.map(r=>String(r[i]).length)))
const line=r=>r.map((c,i)=>i===0?String(c).padEnd(wid[i]):String(c).padStart(wid[i])).join('  ')
console.log(line(H));console.log(wid.map(x=>'─'.repeat(x)).join('  '))
for(const r of rows)console.log(line(r))
console.log(`\nn=${GAMES} games/cell. ± is 1 SE on the win rate (95% band ≈ ±2·SE).`)
console.log(`mid% = share of ALL runs ending in Circles 2-8. condF3 = win rate among runs that reached fight 3.`)
console.log(`med = median strikes per fight. 4th% = share of fights that needed the final allowed strike.`)
console.log(`bStr / b4th% / b1shot% = the same pace metrics restricted to CIRCLE BOSS fights (every 3rd).`)
console.log(`stoned% = share of deaths caused by the whole band going Too Stoned (vs missing the HP number).`)
console.log(`skill× = win%(good policy) ÷ win%(weak policy) — the deck-skill sensitivity metric.`)

// ── DEATHS BY CIRCLE, all 9 ──
console.log(`\nDEATHS BY CIRCLE (% of all runs), good policy:`)
const H2=['variant','C1','C2','C3','C4','C5','C6','C7','C8','C9','WIN']
const rows2=[]
for(const v of spec.variants){
  const g=by.get(v.name);if(!g||!g.good)continue
  const d=g.good.deathsByCircle
  rows2.push([v.name,...[1,2,3,4,5,6,7,8,9].map(c=>d['C'+c].toFixed(1)),g.good.winRate.toFixed(1)])
}
const wid2=H2.map((h,i)=>Math.max(h.length,...rows2.map(r=>String(r[i]).length)))
const line2=r=>r.map((c,i)=>i===0?String(c).padEnd(wid2[i]):String(c).padStart(wid2[i])).join('  ')
console.log(line2(H2));console.log(wid2.map(x=>'─'.repeat(x)).join('  '))
for(const r of rows2)console.log(line2(r))
