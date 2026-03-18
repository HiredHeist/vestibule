
const http = require('http');
const fs = require('fs');
async function get(n) {
  return new Promise((res,rej) => {
    http.get('http://localhost:5173/c'+n+'.b64', r => {
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d));
    }).on('error',rej);
  });
}
async function run() {
  const parts = [];
  for(let i=0;i<=8;i++) { try { parts.push(await get(i)); console.log('got chunk',i); } catch(e) { console.log('missing chunk',i,e.message); } }
  const src = Buffer.from(parts.join(''),'base64').toString('utf8');
  fs.writeFileSync('src/App.jsx', src);
  console.log('DONE! Written', src.length, 'bytes to src/App.jsx');
}
run();
