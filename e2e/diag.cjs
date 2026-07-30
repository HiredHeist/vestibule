// e2e/diag.cjs — vision diagnostic. Run while the game window is open:  node e2e\diag.cjs
// Prints what the bot sees. Paste the whole output back to Claude.
const fs = require('fs')
const path = require('path')
const P = require('./pilot.cjs')

;(async () => {
  console.log('══ VESTIBULE BOT DIAGNOSTIC ══')
  // 1. last ledger events
  try {
    const lines = fs.readFileSync(path.join(__dirname, 'session3-events.jsonl'), 'utf8').trim().split('\n')
    console.log('\n-- last 15 ledger events:')
    for (const l of lines.slice(-15)) {
      const d = JSON.parse(l)
      const extra = Object.fromEntries(Object.entries(d).filter(([k]) => !['ts', 'ev', 'text', 'shot'].includes(k)).map(([k, v]) => [k, String(v).slice(0, 40)]))
      console.log(' ', d.ts.slice(11, 19), d.ev, JSON.stringify(extra).slice(0, 110))
    }
  } catch (e) { console.log('ledger: none/unreadable —', e.message) }
  // 2. live vision
  const p = await P.connect()
  const vp = await P.evaljs('({w: innerWidth, h: innerHeight, dpr: devicePixelRatio})')
  console.log('\n-- viewport:', JSON.stringify(vp))
  const scan = await P.evaljs(`(() => {
    const hits = [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < 200
    }).map(d => { const r = d.getBoundingClientRect(); return {
      t: d.textContent.replace(/\\s+/g, ' ').slice(0, 34),
      y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width),
      yF: +(r.y / innerHeight).toFixed(2), hF: +(r.height / innerHeight).toFixed(2)
    } }).filter(x => x.h > 20)
    return hits.slice(0, 14)
  })()`)
  console.log('\n-- card-like divs (t / y / h / w / y-fraction / h-fraction):')
  for (const c of scan) console.log(' ', JSON.stringify(c))
  const state = await P.state()
  console.log('\n-- screen text head:', state.text.slice(0, 120).replace(/\n/g, ' | '))
  console.log('-- clickables:', state.clickables.length, state.clickables.slice(0, 6).map(c => c.t.slice(0, 20)))
  const shot = await P.shot('diag-pc')
  console.log('\n-- screenshot:', shot)
  console.log('\n══ END — paste ALL of this back ══')
  process.exit(0)
})().catch(e => { console.log('DIAG FAIL:', e.message); process.exit(1) })
