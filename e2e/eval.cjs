const CDP=require('chrome-remote-interface');
(async()=>{const targets=await CDP.List()
  const t=targets.find(x=>x.url.includes('4173'))||targets.find(x=>x.type==='page')
  const c=await CDP({target:t});await c.Runtime.enable()
  const r=await c.Runtime.evaluate({expression:process.argv[2],returnByValue:true,awaitPromise:true})
  const v=r.result.value!==undefined?r.result.value:(r.exceptionDetails?('EXC: '+r.exceptionDetails.exception.description):r.result.description)
  console.log(typeof v==='string'?v.slice(0,3000):JSON.stringify(v).slice(0,3000))
  await c.close()})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
