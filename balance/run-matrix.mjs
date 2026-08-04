#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// CHAIN BALANCE LAB — variant runner
//
// Spawns balance/sim-chainlab.js once per (variant × ATK scale) cell, in
// parallel up to the core count, and prints one comparison table.
//
//   node balance/run-matrix.mjs <spec.json> [gamesPerCell] [parallel]
//
// spec.json:  { "policy": {ENV...}, "atkScales":[0.5,1,2], "variants":[{name,env:{}}] }
// Writes raw results to balance/results/<specName>.json
// ═══════════════════════════════════════════════════════════════════════════
import{spawn}from'child_process'
import{readFileSync,writeFileSync,mkdirSync}from'fs'
import{fileURLToPath}from'url'
import{dirname,join,basename}from'path'

const HERE=dirname(fileURLToPath(import.meta.url))
const SIM=join(HERE,'sim-chainlab.js')
const specPath=process.argv[2]
const GAMES=parseInt(process.argv[3])||3000
const PAR=parseInt(process.argv[4])||2
const spec=JSON.parse(readFileSync(specPath,'utf8'))
const atkScales=spec.atkScales||[0.5,1,2]
const policy=spec.policy||{}
const stake=spec.stake||'bronze'
const deck=spec.deck||'standard'

const cells=[]
for(const v of spec.variants)for(const a of atkScales)cells.push({variant:v.name,atk:a,env:{...policy,...v.env,ATK_SCALE:String(a)}})

function runCell(cell){
  return new Promise((res,rej)=>{
    const env={...process.env,...cell.env,QUIET:'1',LAB_LABEL:cell.variant}
    const p=spawn(process.execPath,[SIM,String(GAMES),stake,deck],{env,cwd:join(HERE,'..')})
    let out='',err=''
    p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d)
    p.on('close',code=>{
      const m=out.match(/###LABJSON###(.*)/)
      if(!m)return rej(new Error(`cell ${cell.variant}@${cell.atk} produced no JSON (code ${code})\n${err}\n${out.slice(-500)}`))
      res({...cell,...JSON.parse(m[1])})
    })
  })
}

const results=[]
let idx=0
async function worker(){
  while(idx<cells.length){
    const c=cells[idx++]
    const r=await runCell(c)
    results.push(r)
    process.stderr.write(`  ✓ ${r.variant.padEnd(22)} atk×${String(r.atk).padEnd(4)} win=${String(r.winRate).padStart(5)}%  chains/strike=${r.chainsPerStrike}\n`)
  }
}
process.stderr.write(`\nCHAIN LAB · ${basename(specPath)} · ${cells.length} cells × ${GAMES} games (${stake}/${deck})\n`)
process.stderr.write(`policy: ${JSON.stringify(policy)}\n\n`)
const t0=Date.now()
await Promise.all(Array.from({length:PAR},worker))
process.stderr.write(`\ndone in ${((Date.now()-t0)/1000).toFixed(0)}s\n\n`)

mkdirSync(join(HERE,'results'),{recursive:true})
const outName=basename(specPath).replace(/\.json$/,'')
writeFileSync(join(HERE,'results',outName+'.json'),JSON.stringify({spec,games:GAMES,results},null,1))

// ── TABLE ──
const byVariant=new Map()
for(const r of results){if(!byVariant.has(r.variant))byVariant.set(r.variant,{});byVariant.get(r.variant)[r.atk]=r}
const order=spec.variants.map(v=>v.name)
const se=p=>Math.sqrt(p/100*(1-p/100)/GAMES)*100
const H=['variant','win%@1x','±','str/fgt','bStr','1shot%','b1shot%','ampMed','ampP90','ch/strike','C1%','C9%','atk.5x','atk2x','ΔATK','Δ/±','×sens']
const rows=[]
for(const name of order){
  const g=byVariant.get(name);if(!g)continue
  const b=g[1],lo=g[0.5],hi=g[2]
  const d=(hi&&lo)?+(hi.winRate-lo.winRate).toFixed(2):NaN
  const dse=(hi&&lo)?Math.sqrt(se(hi.winRate)**2+se(lo.winRate)**2):NaN
  const ratio=(hi&&lo&&lo.winRate>0)?(hi.winRate/lo.winRate):NaN
  rows.push([name,b?b.winRate.toFixed(2):'-',b?se(b.winRate).toFixed(2):'-',
    b?b.strikesPerFight:'-',b?(b.bossStrikesPerFight??'-'):'-',b?b.oneShotRate:'-',b?(b.bossOneShotRate??'-'):'-',
    b?b.ampMedian:'-',b?b.ampP90:'-',b?b.chainsPerStrike:'-',
    b?b.deathsByCircle.C1:'-',b?b.deathsByCircle.C9:'-',
    lo?lo.winRate.toFixed(2):'-',hi?hi.winRate.toFixed(2):'-',
    isNaN(d)?'-':d.toFixed(2),isNaN(d)?'-':(d/dse).toFixed(1)+'σ',isNaN(ratio)?'-':ratio.toFixed(2)+'x'])
}
const w=H.map((h,i)=>Math.max(h.length,...rows.map(r=>String(r[i]).length)))
const line=r=>r.map((c,i)=>String(c).padStart(i===0?-w[i]:w[i]).padEnd(w[i])).join('  ')
console.log(line(H));console.log(w.map(x=>'─'.repeat(x)).join('  '))
for(const r of rows)console.log(line(r))
console.log(`\nn=${GAMES} games/cell. ± is 1 SE on the win rate. ΔATK = win%(atk×2) − win%(atk×0.5).`)
console.log(`Δ/± is that delta in combined standard errors — under ~2σ it is noise.`)
