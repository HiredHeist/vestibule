// VESTIBULE AUTOPILOT — expert-ish DOM player. Idempotent installer.
if(window.__AP&&window.__AP.timer){clearInterval(window.__AP.timer)}
{const _oldLog=window.__AP?window.__AP.log:[];const _oldRun=window.__AP?window.__AP.run:1;
window.__AP={on:true,log:_oldLog,run:_oldRun,tick:0,lastAct:'',stuck:0,lastText:''}
const AP=window.__AP
AP.rec=(ev,d)=>{AP.log.push({t:Date.now(),ev,d});if(AP.log.length>3000)AP.log.shift()}
const txt=()=>document.body.innerText
const els=(sel)=>[...document.querySelectorAll(sel)]
function clickEl(e){if(!e)return false;['pointerdown','mousedown','pointerup','mouseup','click'].forEach(ty=>e.dispatchEvent(new MouseEvent(ty,{bubbles:true,cancelable:true,view:window})));return true}
function byText(t,max){const re=new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i')
  const c=els('div,button,span').filter(e=>re.test(e.textContent)&&e.textContent.length<(max||120)).sort((a,b)=>a.textContent.length-b.textContent.length)
  return c[0]}
AP.C=(t,max)=>{const e=byText(t,max);if(e){clickEl(e);AP.lastAct='C:'+t;return true}return false}
const handCards=()=>els('div[draggable="true"]').filter(e=>e.textContent.length>10)
const memberEls=()=>els('div').filter(e=>/GUITARIST|DRUMMER|BASS PLAYER|SYNTH|VOCALIST|KEYS/i.test(e.textContent)&&e.textContent.length<200).sort((a,b)=>a.textContent.length-b.textContent.length).slice(0,6)
const UNTARGETED=['Mosh Pit','Distortion','Sound Check','Wake Up Call','Groupie','Static Charge','Power Tap','Smoke Break','Dial to Eleven','Soundboard','Sound Wall','Infernal Encore','Possessed Perf','Crowd Surf','Séance','Seance','Amp Overload','Herb Money','Signal Decay','Burn the Set','Setlist']
const TARGETED=['Heavy Riff','New Strings','Amp It Up','Battle Cry','Encore','Resonance','Roadie','Death Riff','Amp the Static','Feedback Loop']
function tryPlay(name){
  const before=handCards().length
  const card=handCards().find(e=>e.textContent.includes(name));if(!card)return false
  clickEl(card)
  return new Promise(res=>setTimeout(()=>{
    if(handCards().length<before){AP.rec('play',name);return res(true)}
    // maybe needs target: click strongest member
    const ms=memberEls();if(ms.length){clickEl(ms[0])}
    setTimeout(()=>{const ok=handCards().length<before;if(ok)AP.rec('playT',name);res(ok)},400)
  },400))
}
async function fightRoutine(){
  // play up to 4 cards then strike
  for(let i=0;i<4;i++){
    let played=false
    for(const n of UNTARGETED){if(await tryPlay(n)){played=true;break}}
    if(!played)for(const n of TARGETED){if(await tryPlay(n)){played=true;break}}
    if(!played)break
    await new Promise(r=>setTimeout(r,300))
  }
  if(AP.C('⛧ Strike ⛧',30)||AP.C('Strike',20)){AP.rec('strike',txt().match(/(\d+[\d,]*) \/ [\d,]+ HP/)?.[1])}
}
function shopRoutine(){
  const t=txt()
  // recruit if band small
  const members=memberEls().length
  if(members<5&&/RECRUIT|Garage|Touring/i.test(t)){if(AP.C('Recruit',60)||AP.C('Garage')||AP.C('Touring')){AP.rec('buyPack',members);return}}
  if(AP.C('THIS CIRCLE ONLY',400)){AP.rec('relicTile');return}
  if(AP.C('Leave',20)||AP.C('Continue Tour',30)||AP.C('Next Fight',30)||AP.C('Descend',20)){AP.rec('leaveShop');return}
}
AP.step=async function(){
  if(!AP.on)return
  AP.tick++
  const t=txt()
  if(t===AP.lastText)AP.stuck++;else AP.stuck=0
  AP.lastText=t
  // generic popup dismissers first
  for(const b of ['Got it','Continue','CLAIM','Take It','Accept','Onward','Collect','Skip','OK']){if(byText('^'+b,30)&&AP.C(b,30)){AP.rec('popup',b);return}}
  if(/RENDER ERROR/.test(t)){AP.on=false;AP.rec('RENDER_ERROR',t.slice(0,300));return}
  if(/ENTER THE VESTIBULE/i.test(t)){AP.C('Enter the Vestibule');AP.rec('enterVestibule');return}
  if(/Continue/i.test(t)&&/DIFFICULTY STAKE/i.test(t)){AP.C('Continue');return}
  if(/Select 2 musicians/i.test(t)){
    const picks=['Bjorn','Ragnar','Freya','Sigrid'];let done=0
    for(const p of picks){const e=byText(p,180);if(e&&clickEl(e)){done++;if(done>=2)break}}
    setTimeout(()=>{AP.C('Begin')||AP.C('Start')||AP.C('Confirm')||AP.C('Enter')},600)
    AP.rec('pickPair',done);return}
  if(/CHOOSE YOUR (BAND|MEMBER)|joins the band|RECRUIT A/i.test(t)){const ms=memberEls();clickEl(ms[0]);setTimeout(()=>AP.C('Confirm')||AP.C('Choose')||AP.C('Take'),400);AP.rec('recruitPick');return}
  if(/STASH.*REROLL|SLY|PAWN/i.test(t)&&!/⛧ Strike ⛧/i.test(t)){shopRoutine();return}
  if(/DESCEND/i.test(t)&&!/⛧ Strike ⛧/i.test(t)&&!/DIFFICULTY STAKE|roguelite descent/i.test(t)){AP.C('Descend')||AP.C('Continue');AP.rec('descend');return}
  if(/PACT/i.test(t)&&/OFFER|CHOOSE|SIGN/i.test(t)){AP.C('Sign')||AP.C('Accept')||AP.C('Choose');AP.rec('pact');return}
  if(/⛧ Strike ⛧/i.test(t)){await fightRoutine();return}
  if(/VICTORY|LUCIFER SLAIN|YOU WIN|CULT LEGEND/i.test(t)){AP.rec('WIN',t.slice(0,200));AP.on=false;return}
  if(/TOO STONED|RUN OVER|DEFEAT|The band has fallen/i.test(t)&&/Try Again|New Run|Main Menu/i.test(t)){AP.rec('DEATH',t.slice(0,200));AP.C('Try Again')||AP.C('New Run');AP.run++;return}
  AP.rec('idle',t.slice(0,80))
}
AP.timer=setInterval(()=>{AP.step().catch(e=>AP.rec('ERR',e.message))},1500)
AP.rec('INSTALLED',location.href)
}
