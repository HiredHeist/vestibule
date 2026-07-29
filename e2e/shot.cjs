const CDP=require('chrome-remote-interface');const fs=require('fs');
(async()=>{const fs2=require('fs');const targets=await CDP.List()
  let tid=null;try{tid=fs2.readFileSync('/tmp/target.id','utf8').trim()}catch(e){}
  let t=targets.find(x=>x.id===tid)
  if(!t){const pages=targets.filter(x=>x.type==='page'&&x.url.includes('4173'));t=pages[pages.length-1];if(t)fs2.writeFileSync('/tmp/target.id',t.id)}
  const c=await CDP({target:t});await c.Page.enable()
  const {data}=await c.Page.captureScreenshot({format:'png'})
  fs.writeFileSync(process.argv[2],Buffer.from(data,'base64'))
  await c.close();console.log('saved')})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
