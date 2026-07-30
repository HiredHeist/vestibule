// Native coordinate click on the smallest element matching text (arg1). Optional index arg2.
const CDP=require('chrome-remote-interface');const fs=require('fs');
(async()=>{const targets=await CDP.List()
  let tid=null;try{tid=fs.readFileSync('/tmp/target.id','utf8').trim()}catch(e){}
  let t=targets.find(x=>x.id===tid)
  if(!t){const pages=targets.filter(x=>x.type==='page'&&x.url.includes('4173'));t=pages[pages.length-1];if(t)fs.writeFileSync('/tmp/target.id',t.id)}
  const c=await CDP({target:t});await c.Runtime.enable();await c.Input;
  const q=process.argv[2];const idx=parseInt(process.argv[3]||'0')
  const r=await c.Runtime.evaluate({expression:`(function(){
    var re=new RegExp(${JSON.stringify(q)}.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&'),'i')
    var c=[...document.querySelectorAll('*')].filter(function(e){return re.test(e.textContent)&&e.textContent.length<250&&e.getBoundingClientRect().width>0}).sort(function(a,b){return a.textContent.length-b.textContent.length})
    var e=c[${idx}];if(!e)return null;var b=e.getBoundingClientRect()
    return {x:b.x+b.width/2,y:b.y+b.height/2,txt:e.textContent.trim().slice(0,40)}})()`,returnByValue:true})
  const v=r.result.value
  if(!v){console.log('NF');await c.close();return}
  for(const type of ['mousePressed','mouseReleased'])
    await c.Input.dispatchMouseEvent({type,x:v.x,y:v.y,button:'left',clickCount:1})
  console.log('NCLICK['+v.txt+'] @'+Math.round(v.x)+','+Math.round(v.y))
  await c.close()})().catch(e=>{console.error('ERR',e.message);process.exit(1)})
