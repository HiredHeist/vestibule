const CDP=require('chrome-remote-interface');const fs=require('fs');
(async()=>{const targets=await CDP.List()
  let tid=null;try{tid=fs.readFileSync('/tmp/target.id','utf8').trim()}catch(e){}
  let t=targets.find(x=>x.id===tid)
  if(!t){const pages=targets.filter(x=>x.type==='page'&&x.url.includes('4173'));t=pages[pages.length-1];if(t)fs.writeFileSync('/tmp/target.id',t.id)}
  const c=await CDP({target:t});await c.Runtime.enable()
  const chk=await c.Runtime.evaluate({expression:'!!window.__AP',returnByValue:true})
  if(!chk.result.value||process.env.FRESH){const src=fs.readFileSync(__dirname+'/autopilot.js','utf8');await c.Runtime.evaluate({expression:src})}
  const st=await c.Runtime.evaluate({expression:"JSON.stringify({on:window.__AP&&__AP.on,tick:__AP&&__AP.tick,run:__AP&&__AP.run,stuck:__AP&&__AP.stuck,last:__AP&&__AP.log.slice(-4).map(l=>l.ev+':'+String(l.d||'').slice(0,40))})",returnByValue:true})
  console.log(st.result.value)
  await c.close()})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
