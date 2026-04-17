import{readFileSync,writeFileSync}from'fs'
import{execSync}from'child_process'

// Target CONDITIONAL win rates: of players who REACH this boss, what % survive past
const TARGETS=[
  0.96, 0.96, 0.85,  // C1: reg, reg, boss
  0.96, 0.96, 0.85,  // C2
  0.96, 0.96, 0.85,  // C3
  0.96, 0.96, 0.85,  // C4
  0.96, 0.96, 0.85,  // C5
  0.96, 0.96, 0.85,  // C6
  0.96, 0.96, 0.85,  // C7
  0.96, 0.96, 0.85,  // C8
  0.96, 0.96, 0.70,  // C9 + Lucifer
]

const BASE_HP=[65,95,140,145,210,310,160,210,280,400,470,780,972,1080,1200,1897,2185,2990,3660,4880,6710,6864,8976,12672,12600,15960,420666]
const NAMES=['Wanderer','Lost Soul','Drifter','Siren','Tempter','Seducer','Glutton','Feaster','Devourer','Miser','Hoarder','Usurer','Wrathful','Berserker','Warlord','Heretic','Apostate','False Prophet','Brute','Hunter','Executioner','Trickster','Deceiver','Archfraud','Traitor','Betrayer','LUCIFER']

// Start with reasonable multipliers based on previous calibration
let mults=[1.3,1.5,2.0,2.5,3.0,4.0,4.5,5.0,6.0,7.0,8.0,10.0,11.0,12.0,14.0,16.0,18.0,22.0,26.0,30.0,35.0,36.0,38.0,42.0,40.0,42.0,0.5]

console.log('\n⛧ BOSS HP CALIBRATOR v2 — targeting 96% regular / 85% boss / 70% Lucifer\n')

for(let iter=0;iter<30;iter++){
  const hp=mults.map((m,i)=>Math.ceil(BASE_HP[i]*m))
  writeFileSync('/tmp/boss_hp_override.json',JSON.stringify(hp))
  
  const out=execSync('node vestibule-sim.js 3000 bronze',{cwd:'/home/claude/vestibule',timeout:60000}).toString()
  
  // Parse survival rates
  const survRates=[]
  for(const line of out.split('\n')){
    const m=line.match(/([\d.]+)% survive/)
    if(m)survRates.push(parseFloat(m[1])/100)
  }
  if(survRates.length<27)continue
  
  // Compute conditional win rates
  const condWin=survRates.map((s,i)=>i===0?s:survRates[i-1]>0?s/survRates[i-1]:1)
  
  // Overall WR
  const wrm=out.match(/Lucifer wins: \d+ \(([\d.]+)%\)/)
  const wr=wrm?parseFloat(wrm[1]):0
  
  // Adjust multipliers
  let adj=0
  for(let f=0;f<27;f++){
    const actual=condWin[f]
    const target=TARGETS[f]
    const diff=actual-target // positive = too easy
    if(Math.abs(diff)>0.015){
      // If too easy (actual > target), increase HP. If too hard, decrease.
      mults[f]*=(1+diff*1.5)
      mults[f]=Math.max(0.3,mults[f])
      adj++
    }
  }
  
  process.stdout.write(`  Iter ${String(iter+1).padStart(2)}: WR=${wr.toFixed(1).padStart(5)}% | ${adj} bosses adjusted`)
  if(adj<=2||Math.abs(wr-9.2)<1.5){
    process.stdout.write(' ← CONVERGED\n')
    break
  }
  process.stdout.write('\n')
}

// Final 5K validation run
const finalHp=mults.map((m,i)=>Math.ceil(BASE_HP[i]*m))
writeFileSync('/tmp/boss_hp_override.json',JSON.stringify(finalHp))
console.log('\n  Running 5K validation...')
const val=execSync('node vestibule-sim.js 5000 bronze',{cwd:'/home/claude/vestibule',timeout:60000}).toString()

// Parse and display
const survRates=[]
for(const line of val.split('\n')){const m=line.match(/([\d.]+)% survive/);if(m)survRates.push(parseFloat(m[1])/100)}
const condWin=survRates.map((s,i)=>i===0?s:survRates[i-1]>0?s/survRates[i-1]:1)
const wrm=val.match(/Lucifer wins: \d+ \(([\d.]+)%\)/);const wr=wrm?parseFloat(wrm[1]):0

console.log('\n⛧ CALIBRATED RESULTS (5K validation)')
console.log(`  Overall Win Rate: ${wr}%\n`)
console.log(`${'#'.padStart(3)} ${'Boss'.padEnd(16)} ${'HP'.padStart(10)} ${'Target'.padStart(8)} ${'Actual'.padStart(8)} ${'Diff'.padStart(7)}  Status`)
console.log('─'.repeat(75))
for(let i=0;i<27;i++){
  const c=Math.floor(i/3)+1,boss=(i+1)%3===0,mark=boss?' ★':'  '
  const hpStr=finalHp[i]>=1e6?(finalHp[i]/1e6).toFixed(1)+'M':finalHp[i]>=1000?(finalHp[i]/1000).toFixed(1)+'K':''+finalHp[i]
  const tgt=(TARGETS[i]*100).toFixed(0)
  const act=(condWin[i]*100).toFixed(1)
  const diff=condWin[i]-TARGETS[i]
  const status=Math.abs(diff)<0.03?'✅':diff>0?'🟡 easy':'🟡 hard'
  console.log(`C${c}${mark} ${NAMES[i].padEnd(16)} ${hpStr.padStart(10)} ${(tgt+'%').padStart(8)} ${(act+'%').padStart(8)} ${(diff>0?'+':'')+((diff*100).toFixed(1)+'%').padStart(6)}  ${status}`)
}

// Output the final HP array
console.log('\nconst CALIBRATED_HP = [')
for(let i=0;i<27;i+=3){
  const c=Math.floor(i/3)+1
  console.log(`  ${finalHp[i]}, ${finalHp[i+1]}, ${finalHp[i+2]},  // C${c}: ${NAMES[i]}, ${NAMES[i+1]}, ${NAMES[i+2]}`)
}
console.log(']')
