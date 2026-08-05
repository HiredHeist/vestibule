#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// DIFFICULTY CURVE — PATCH GENERATOR
//
// Regenerates the balance/*.patch files from the CURRENT source. Every edit
// asserts its anchor text first, so a patch is never emitted against a file
// that has moved. Nothing here writes to src/ — it copies the tree to a temp
// dir, edits the copy, and diffs.
//
//   node balance/make-difficulty-patches.mjs
//
// LUCIFER. App.jsx getScaledMaxHp (~5209) SPECIAL-CASES Lucifer and returns a
// flat 333,333 per phase / 666,666 total with NO deck hpScale. enemies.js
// maxHp:100000 is DEAD DATA for him — editing it changes nothing in the real
// fight. Any Lucifer change must patch the seven 333333 literals in App.jsx AND
// boss_hp_override.json[26] AND the parity assertions that hardcode 666666.
// ═══════════════════════════════════════════════════════════════════════════
import{readFileSync,writeFileSync,mkdirSync,rmSync,cpSync}from'fs'
import{execFileSync}from'child_process'
import{fileURLToPath}from'url'
import{dirname,join}from'path'

const HERE=dirname(fileURLToPath(import.meta.url))
const ROOT=join(HERE,'..')
const TMP='/tmp/vst-diffpatch'

// ── the two fitted curves. Entry 26 is Lucifer's FLAT TOTAL, not a base. ──
// V20F — flat: every fight fitted to the same pass rate.
const V20F=[25,58,110,270,430,550,880,1000,1100,1400,1700,2000,3700,2700,3200,
            4100,4900,5700,6200,7000,7700,10000,11000,12000,10000,16000,/*Lucifer TOTAL*/55000]
// V20C — Balatro-shaped: Small/Big blind comfortable, circle BOSS is the check,
// Circle IX is the Ante-8 wall. This is the recommended curve.
const V20C=[17,41,110,170,260,530,550,590,1000,890,1100,1900,2300,1600,3000,
            2600,2900,5300,3700,4000,7000,6000,6500,11000,7200,10000,/*Lucifer TOTAL*/72000]

function edit(src,anchor,replacement,label,expect=1){
  const n=src.split(anchor).length-1
  if(n!==expect)throw new Error(`ANCHOR expected ${expect} match(es), found ${n}: ${label}\n  ${anchor.slice(0,140)}`)
  return src.split(anchor).join(replacement)
}

function makePatch(name,files){
  rmSync(TMP,{recursive:true,force:true})
  for(const side of['a','b']){mkdirSync(join(TMP,side,'src/data'),{recursive:true});mkdirSync(join(TMP,side,'e2e'),{recursive:true})}
  const rel=Object.keys(files)
  for(const f of rel){cpSync(join(ROOT,f),join(TMP,'a',f));writeFileSync(join(TMP,'b',f),files[f])}
  let out=''
  for(const f of rel){
    try{execFileSync('diff',['-u','--label','a/'+f,'--label','b/'+f,join(TMP,'a',f),join(TMP,'b',f)],{cwd:TMP})}
    catch(e){out+=e.stdout.toString()}
  }
  if(!out.trim())throw new Error('patch '+name+' is empty')
  writeFileSync(join(HERE,name),out)
  console.log(`  ✓ ${name.padEnd(44)} ${out.split('\n').filter(l=>/^[+-][^+-]/.test(l)).length} changed lines`)
}

const APP=readFileSync(join(ROOT,'src/App.jsx'),'utf8')
const ENEMIES=readFileSync(join(ROOT,'src/data/enemies.js'),'utf8')
const OVERRIDE=readFileSync(join(ROOT,'boss_hp_override.json'),'utf8')
const KWSIM=readFileSync(join(ROOT,'vestibule-sim-kwstacks.js'),'utf8')
const PARITY=readFileSync(join(ROOT,'e2e/test-card-parity.cjs'),'utf8')

console.log('generating difficulty patches...\n')

const EDITS={}

// ── V1: NO OVERTIME ────────────────────────────────────────────────────────
EDITS.v1=a=>{
  a=edit(a,
    `              if(false){ // OVERTIME (Jul 31 2026 JV): out-of-strikes no longer ends the fight.`,
    `              // V1 (NO OVERTIME): out of strikes with the boss alive ends the run.
              // The enemyHpRef guard is load-bearing — this updater runs AFTER the
              // strike resolves, and a kill on the final strike must resolve as a WIN.
              const _bossAlive=!(enemyHpRef.current!==undefined&&enemyHpRef.current!==null&&enemyHpRef.current<=0)
              if(cur<=0&&_bossAlive){`,
    'V1 out-of-strikes loss')
  a=edit(a,
    `        {const _ot=Math.max(0,1-strikesLeft);if(_ot>0){scaledBaseDmg=scaledBaseDmg*Math.pow(2,_ot);addLog('🔥 OVERTIME x'+Math.pow(2,_ot)+' — the crowd turns on you!')}}`,
    `        // V1 (NO OVERTIME): unreachable — the fight ends the moment the allowance
        // runs out, so there is no overtime strike for the boss to enrage on.
        {const _ot=0;if(_ot>0){scaledBaseDmg=scaledBaseDmg*Math.pow(2,_ot)}}`,
    'V1 enrage removal')
  a=edit(a,
    `{strikesLeft>0?strikesLeft+'/'+fightMaxStrikes:'☠ OVERTIME ×'+Math.pow(2,1-strikesLeft)}`,
    `{strikesLeft>0?strikesLeft+'/'+fightMaxStrikes:'☠ NO STRIKES LEFT'}`,
    'V1 strike counter label')
  return a
}

// ── V5: BAND HP IS NOT A LOSS CONDITION ────────────────────────────────────
const WIPE=`'💀 TOTAL WIPEOUT — the band is out. No damage for the rest of this fight.'`
EDITS.v5core=a=>{
  a=edit(a,
    `else if(tutorialFight>0){setShowTutorialMsg('You got stoned! No worries, try that one again.');setTimeout(()=>startTutorialFight(tutorialFight),2000);return}else{setDeathCause('stoned');playSfx('defeat')};setTimeout(()=>{clearSave();setGameState('end')},800)}`,
    `else if(tutorialFight>0){setShowTutorialMsg('You got stoned! No worries, try that one again.');setTimeout(()=>startTutorialFight(tutorialFight),2000);return}else{/* V5: a wipe is NOT a loss. The band deals no ATK for the rest of the fight; the run ends only if the HP number is missed. */playSfx('defeat');addLog(${WIPE})}}`,
    'V5 all-stoned site A')
  a=edit(a,
    `else{setDeathCause('stoned');playSfx('defeat')};const _bc=Math.floor(fightIndex/3)+1;if(_bc>bestRunCircle){localStorage.setItem('vst_best_circle',_bc.toString())};recordLegacyRun(stage,stats,false,Math.floor(fightIndex/3)+1);setTimeout(function(){clearSave();setGameState('end')},800)}`,
    `else{/* V5: see the matching branch above — a wipe costs output, not the run. */playSfx('defeat');addLog(${WIPE})}}`,
    'V5 all-stoned site B')
  return a
}
EDITS.v5wake=a=>edit(a,
  `        // Post-fight heal (disabled on higher stakes)
        if(activeStake.healAfterFight){setStage(prev=>prev.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m))}`,
  `        // V5: Too Stoned is a PER-FIGHT penalty. Wake everyone at 25% max HP so the
        // band always fields a full stage next fight — HP attrition still exists, it
        // just cannot end the run.
        setStage(prev=>prev.map(m=>m&&m.tooStoned?Object.assign({},m,{tooStoned:false,hp:Math.max(1,Math.ceil(m.maxHp*0.25))}):m))
        // Post-fight heal (disabled on higher stakes)
        if(activeStake.healAfterFight){setStage(prev=>prev.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m))}`,
  'V5 wake at fight boundary')

// ── V6: FULL HEAL BETWEEN EVERY FIGHT ──────────────────────────────────────
EDITS.v6=a=>edit(a,
  `        // Post-fight heal (disabled on higher stakes)
        if(activeStake.healAfterFight){setStage(prev=>prev.map(m=>m&&!m.tooStoned&&m.keyword!=='FALLEN'?Object.assign({},m,{hp:Math.min(m.maxHp,m.hp+2)}):m))}`,
  `        // V6: FULL HEAL BETWEEN EVERY FIGHT — no attrition carried forward, on any
        // stake. Every fight is entered at full strength, so the only thing that ends
        // a run is missing the HP number. This deliberately overrides the stake's
        // healAfterFight flag; to keep partial attrition on the harder stakes, gate
        // the un-stoning on activeStake.healAfterFight and leave the heal at +2.
        setStage(prev=>prev.map(m=>m?Object.assign({},m,{tooStoned:false,stoneShield:false,hp:m.maxHp}):m))`,
  'V6 full heal')

// ── CURVE + LUCIFER ────────────────────────────────────────────────────────
function curveFiles(CURVE,label){
  // enemies.js: entries 0..25 only. Entry 26 (lucifer) is NOT touched — it is
  // dead data, and editing it would imply it does something.
  let e=ENEMIES
  const ids=[...ENEMIES.matchAll(/\{id:'([a-z0-9_]+)',tagline:/g)].map(m=>m[1])
  if(ids.length!==27)throw new Error('expected 27 ENEMIES entries, found '+ids.length)
  if(ids[26]!=='lucifer')throw new Error('entry 26 is not lucifer, it is '+ids[26])
  for(let i=0;i<26;i++){
    const re=new RegExp(`(\\{id:'${ids[i]}',tagline:[\\s\\S]*?maxHp:)(\\d+)`)
    if(!e.match(re))throw new Error('no maxHp for '+ids[i])
    e=e.replace(re,(_,pre)=>pre+CURVE[i])
  }
  const perPhase=Math.round(CURVE[26]/2)
  const total=perPhase*2
  const pretty=perPhase.toLocaleString('en-US')
  let a=APP
  a=edit(a,`Math.ceil(333333*(1+Math.max(0,`,`Math.ceil(${perPhase}*(1+Math.max(0,`,'Lucifer HP formula (4 sites)',4)
  a=edit(a,`setLuciferCinematic({text:'THE ICE SHATTERS',hp:333333,phase:2})`,
            `setLuciferCinematic({text:'THE ICE SHATTERS',hp:${perPhase},phase:2})`,'Lucifer cinematic HP')
  a=edit(a,`addLog('😈 Phase 2: Satan, Lord of the Flies — 333,333 HP')`,
            `addLog('😈 Phase 2: Satan, Lord of the Flies — ${pretty} HP')`,'Lucifer phase 2 log')
  a=edit(a,`addLog('🧊 Phase 1: Lucifer, Frozen in Cocytus — 333,333 HP')`,
            `addLog('🧊 Phase 1: Lucifer, Frozen in Cocytus — ${pretty} HP')`,'Lucifer phase 1 log')
  a=edit(a,`    // LUCIFER (Jul 31 2026, JV): flat 666,666 total — 333,333 per phase. No deck`,
            `    // LUCIFER: flat ${total.toLocaleString('en-US')} total — ${pretty} per phase. No deck`,'Lucifer comment')
  // Preserve the file's key order and BOTH existing _comment / _lucifer_exception
  // notes — the Lucifer exception note is load-bearing documentation and must not
  // be dropped by a regeneration.
  const o=JSON.parse(OVERRIDE)
  const nO={}
  for(let i=0;i<26;i++)nO[String(i)]=CURVE[i]
  nO['26']=total
  nO._comment=o._comment+` Aug 5 2026: refitted to the ${label} published difficulty curve (balance/DIFFICULTY_CURVE.md).`
  nO._lucifer_exception=(o._lucifer_exception||'')
    .replace(/666666/g,String(total)).replace(/333,333/g,pretty).replace(/666,666/g,total.toLocaleString('en-US'))
    +` Aug 5 2026: the flat total moved 666,666 -> ${total.toLocaleString('en-US')} (${pretty} per phase) as part of the difficulty refit; App.jsx's seven literals, this entry and the sim's exemption constant all moved together.`
  const k=edit(KWSIM,
    `if(v!==666666)problems.push(\`index \${i} (lucifer): json=\${v} but the live special case is a flat 666666 (333,333 x2 phases)\`)`,
    `if(v!==${total})problems.push(\`index \${i} (lucifer): json=\${v} but the live special case is a flat ${total} (${perPhase} x2 phases)\`)`,
    'kwstacks Lucifer exemption constant')
  const ksim=edit(k,`      const actualHp=666666 // Jul 31 2026 JV: flat, no scaling — 333,333 per phase`,
    `      const actualHp=${total} // flat, no scaling — ${pretty} per phase`,'kwstacks Lucifer hardcode')
  return {'src/data/enemies.js':e,'src/App.jsx':a,'boss_hp_override.json':JSON.stringify(nO,null,1)+'\n','vestibule-sim-kwstacks.js':ksim}
}

// ── STANDALONE BUGFIX: e2e parity assertion has no Lucifer exemption ───────
// Broken RIGHT NOW, independently of this experiment: boss_hp_override.json[26]
// is 666666 (correct) and enemies.js says 100000 (dead data), so
// test-card-parity.cjs exits 1 on a correct repo, before the bot rig can run.
EDITS.parityFix=()=>({'e2e/test-card-parity.cjs':edit(PARITY,
  `  rows.forEach((e, i) => {
    if (json[i] === undefined) problems.push(\`index \${i} (\${e.id}): missing from boss_hp_override.json\`)
    else if (json[i] !== e.maxHp) problems.push(\`index \${i} (\${e.id}): json=\${json[i]} enemies.js=\${e.maxHp}\`)
  })`,
  `  // LUCIFER IS EXEMPT — the same exemption vestibule-sim-kwstacks.js:49 carries.
  // App.jsx getScaledMaxHp (~5209) special-cases passiveId==='luciferBoss' and
  // returns a FLAT 333,333 per phase / 666,666 total with NO deck hpScale, so
  // enemies.js maxHp:100000 is DEAD DATA for him and the override's 666666 is
  // the true value. Without this branch the assertion fails on a CORRECT repo
  // and the bot rig cannot start.
  const LUCIFER_TOTAL = 666666
  rows.forEach((e, i) => {
    if (json[i] === undefined) problems.push(\`index \${i} (\${e.id}): missing from boss_hp_override.json\`)
    else if (e.id === 'lucifer') {
      if (json[i] !== LUCIFER_TOTAL) problems.push(\`index \${i} (lucifer): json=\${json[i]} but the live special case is a flat \${LUCIFER_TOTAL}\`)
    }
    else if (json[i] !== e.maxHp) problems.push(\`index \${i} (\${e.id}): json=\${json[i]} enemies.js=\${e.maxHp}\`)
  })`,
  'e2e parity Lucifer exemption')})

// ── EMIT ───────────────────────────────────────────────────────────────────
makePatch('00-FIX-e2e-parity-lucifer-exemption.patch',EDITS.parityFix())
makePatch('01-v1-no-overtime.patch',{'src/App.jsx':EDITS.v1(APP)})
makePatch('02-v5-hp-not-loss.patch',{'src/App.jsx':EDITS.v5wake(EDITS.v5core(APP))})
makePatch('03-v6-full-heal.patch',{'src/App.jsx':EDITS.v6(APP)})
makePatch('04-v20c-hp-curve.patch',curveFiles(V20C,'V20C balatro-shaped'))
makePatch('05-v20f-hp-curve-ALT.patch',curveFiles(V20F,'V20F flat'))
{
  const cf=curveFiles(V20C,'V20C balatro-shaped')
  const app=EDITS.v6(EDITS.v5core(EDITS.v1(cf['src/App.jsx'])))
  makePatch('00-RECOMMENDED-v1-v5-v6-v20c.patch',Object.assign({},cf,{'src/App.jsx':app}))
}

console.log(`
done.

  APPLY FIRST, independently of this experiment — it is a live bug:
    git apply balance/00-FIX-e2e-parity-lucifer-exemption.patch

  RECOMMENDED SET — one apply:
    git apply balance/00-RECOMMENDED-v1-v5-v6-v20c.patch

  Individual variants, against pristine HEAD:
    01-v1-no-overtime.patch      V1 only
    02-v5-hp-not-loss.patch      V5 only   (CONFLICTS with 03)
    03-v6-full-heal.patch        V6 only   (CONFLICTS with 02)
    04-v20c-hp-curve.patch       the recommended curve only
    05-v20f-hp-curve-ALT.patch   the flat-shaped alternative curve

  Each curve patch touches FOUR files: src/data/enemies.js (entries 0-25),
  src/App.jsx (the seven Lucifer literals — enemies.js entry 26 is DEAD DATA and
  is deliberately left alone), boss_hp_override.json, and vestibule-sim-kwstacks.js
  (both the Lucifer-exemption constant and the simGame hardcode).
  CLAUDE.md cardinal rule: all of it in the SAME commit.`)
