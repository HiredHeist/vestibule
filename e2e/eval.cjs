const CDP=require('chrome-remote-interface');
(async()=>{const fs2=require('fs');const targets=await CDP.List()
  let tid=null;try{tid=fs2.readFileSync('/tmp/target.id','utf8').trim()}catch(e){}
  let t=targets.find(x=>x.id===tid)
  if(!t){const pages=targets.filter(x=>x.type==='page'&&x.url.includes('4173'));t=pages[pages.length-1];if(t)fs2.writeFileSync('/tmp/target.id',t.id)}
  const c=await CDP({target:t});await c.Runtime.enable()
  const r=await c.Runtime.evaluate({expression:process.argv[2],returnByValue:true,awaitPromise:true})
  const v=r.result.value!==undefined?r.result.value:(r.exceptionDetails?('EXC: '+r.exceptionDetails.exception.description):r.result.description)
  console.log(typeof v==='string'?v.slice(0,3000):JSON.stringify(v).slice(0,3000))
  await c.close()})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
