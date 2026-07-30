// VESTIBULE DRIVER — persistent CDP player. Native input, state-machine policy.
const CDP=require('chrome-remote-interface');const fs=require('fs')
const LOG='/home/claude/runlogs/events.jsonl'
const rec=(ev,d)=>{fs.appendFileSync(LOG,JSON.stringify({t:Date.now(),ev,d:(''+(d??'')).slice(0,220)})+'\n')}
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
let c
async function connect(){
  const targets=await CDP.List()
  let tid=null;try{tid=fs.readFileSync('/tmp/target.id','utf8').trim()}catch(e){}
  let t=targets.find(x=>x.id===tid)
  if(!t){const pages=targets.filter(x=>x.type==='page'&&x.url.includes('4173'));t=pages[pages.length-1];if(t)fs.writeFileSync('/tmp/target.id',t.id)}
  c=await CDP({target:t});await c.Runtime.enable()
}
async function ev(expr){const r=await c.Runtime.evaluate({expression:expr,returnByValue:true});return r.result.value}
async function text(){return await ev('document.body.innerText')||''}
async function find(q,idx=0,max=250){
  return await ev(`(function(){var re=new RegExp(${JSON.stringify(q)}.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&'),'i')
    var c=[...document.querySelectorAll('*')].filter(function(e){var b=e.getBoundingClientRect();return re.test(e.textContent)&&e.textContent.length<${max}&&b.width>4&&b.height>4}).sort(function(a,b){return a.textContent.length-b.textContent.length})
    var e=c[${idx}];if(!e)return null;var b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,txt:e.textContent.trim().slice(0,50)}})()`)
}
async function nclick(q,idx=0,max=250){
  const v=await find(q,idx,max);if(!v)return false
  for(const type of ['mousePressed','mouseReleased'])await c.Input.dispatchMouseEvent({type,x:v.x,y:v.y,button:'left',clickCount:1})
  return v.txt
}
const POPUPS=['Got it','Continue','Claim','Take it','Accept','Onward','Collect','Proceed']
const UNTARGETED=['Mosh Pit','Distortion','Sound Check','Wake Up Call','Groupie','Static Charge','Power Tap','Dial to Eleven','Soundboard','Sound Wall','Crowd Surf','Amp Overload','Signal Decay','Herb Money','Smoke Break']
const TARGETED=['Heavy Riff','Amp It Up','New Strings','Battle Cry','Encore','Resonance','Roadie']
async function handCount(){return await ev(`[...document.querySelectorAll('div[draggable="true"]')].filter(e=>e.textContent.length>10).length`)}
async function playCards(){
  for(let i=0;i<5;i++){
    const before=await handCount();if(before===0)return
    let played=false
    for(const n of [...UNTARGETED,...TARGETED]){
      if(!(await find(n,0,150)))continue
      await nclick(n,0,150);await sleep(500)
      if((await handCount())<before){rec('play',n);played=true;break}
      // needs a target: click the leftmost member card
      const mtxt=await nclick('LEAD GUITARIST|RHYTHM GUITARIST|DRUMMER|BASS PLAYER|SYNTH PLAYER|VOCALIST',0,200)
      await sleep(500)
      if((await handCount())<before){rec('playT',n+'->'+mtxt);played=true;break}
    }
    if(!played)return
  }
}
let lastHash='',stuck=0,screenOnce={}
async function step(){
  const t=await text()
  const h=t.slice(0,300)
  if(h===lastHash)stuck++;else{stuck=0;screenOnce={}}
  lastHash=h
  if(/RENDER ERROR/i.test(t)){rec('RENDER_ERROR',t.slice(0,300));return 'FATAL'}
  if(/THE DESCENT ⛧|Choose your path/i.test(t)){
    if(/✓ SKIPPED/.test(t)){await nclick('UNDO SKIP',0,20);rec('undoSkip');await sleep(500);return}
    const p=await nclick('Select This Path',0,30);await sleep(500)
    const d=await nclick('⛧ DESCEND ⛧',0,20)||await nclick('DESCEND',0,14)
    rec('mapPath',(p||'')+' > '+(d||''));await sleep(1600);return}
  for(const b of POPUPS){const e=await find('^'+b+'$',0,30)||await find(b,0,22);if(e&&e.txt.length<=22){await nclick(b,0,22);rec('popup',b);return}}
  if(/VICTORY IS YOURS|LUCIFER SLAIN|GOD KILLER|CULT LEGEND|YOU CONQUERED/i.test(t)){rec('WIN',t.slice(0,300));return 'WIN'}
  if(/Try Again/i.test(t)&&/(TOO STONED|FALLEN|DEFEAT|RUN ENDED|beaten)/i.test(t)){rec('DEATH',t.slice(0,300));await nclick('Try Again');return 'DEATH'}
  if(/ENTER THE VESTIBULE/i.test(t)){await nclick('Enter the Vestibule');rec('enter');return}
  if(/Select 2 musicians|TAKE THE STAGE/i.test(t)){
    const selState=await ev(`['Bjorn','Ragnar','Freya','Sigrid'].map(n=>{var e=[...document.querySelectorAll('div')].filter(x=>x.textContent.includes(n)&&/ATK/.test(x.textContent)&&x.textContent.length<200).sort((a,b)=>a.textContent.length-b.textContent.length)[0];return e?getComputedStyle(e).borderColor==='rgb(232, 168, 32)':null})`)
    const names=['Bjorn','Ragnar','Freya','Sigrid']
    let selected=selState.filter(x=>x===true).length
    for(let i=0;i<names.length&&selected<2;i++){if(selState[i]===false){await nclick(names[i],0,200);await sleep(400);selected++}}
    const b=await nclick('Take the Stage',0,40);rec('pickPair',b);await sleep(800)
    return}
  if(/⛧ STRIKE ⛧/i.test(t)||/Strike ⛧/.test(t)){
    await playCards()
    const s=await nclick('⛧ Strike ⛧',0,30);rec('strike',(t.match(/([\d,]+) \/ [\d,]+ HP/)||[])[1])
    await sleep(1800);return}
  if(/STASH/i.test(t)&&/REROLL|PAWN|SLY/i.test(t)){
    if(!screenOnce.shop){screenOnce.shop=1
      const members=(t.match(/GUITARIST|DRUMMER|BASS PLAYER|SYNTH PLAYER|VOCALIST/g)||[]).length
      if(members<5){await nclick('Recruit|Garage Pack|Touring Pack',0,80);rec('buyPack',members);await sleep(800)}
      await nclick('This circle only',0,300)&&rec('relic');await sleep(500)
    }
    const l=await nclick('Leave|Hit the road|Next fight|Back to',0,40);if(l)rec('leaveShop',l);return}
  if(/Select|Choose/i.test(t)&&/joins|candidate|recruit/i.test(t)){await nclick('GUITARIST|DRUMMER|BASS|SYNTH|VOCALIST',0,200);await sleep(400);await nclick('Confirm|Choose|Take|Recruit',0,40);rec('recruitPick');return}
  if(/DESCEND/i.test(t)&&!/roguelite descent|DIFFICULTY/i.test(t)){await nclick('Descend',0,40);rec('descend');return}
  if(stuck>6){
    rec('STUCK',t.replace(/\n+/g,'|').slice(0,700))
    // try generic advancers
    for(const g of ['Continue','Skip','Leave','Close','Back','×','Next']){if(await nclick(g,0,24)){rec('unstick',g);return}}
    if(stuck>14)return 'STUCK'
  }
}
;(async()=>{
  await connect()
  const deadline=Date.now()+parseInt(process.argv[2]||'420')*1000
  rec('DRIVER_START',null)
  while(Date.now()<deadline){
    let r
    try{r=await step()}catch(e){rec('DRVERR',e.message);try{await connect()}catch(e2){await sleep(3000)}}
    if(r==='WIN'||r==='FATAL'){console.log(r);process.exit(r==='WIN'?0:2)}
    if(r==='STUCK'){console.log('STUCK');process.exit(3)}
    await sleep(900)
  }
  console.log('TIMEBOX');process.exit(0)
})().catch(e=>{console.error(e.message);process.exit(1)})
