const CDP=require('chrome-remote-interface');const fs=require('fs');
(async()=>{const targets=await CDP.List()
  const t=targets.find(x=>x.url.includes('4173'))||targets.find(x=>x.type==='page')
  const c=await CDP({target:t});await c.Page.enable()
  const {data}=await c.Page.captureScreenshot({format:'png'})
  fs.writeFileSync(process.argv[2],Buffer.from(data,'base64'))
  await c.close();console.log('saved')})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
