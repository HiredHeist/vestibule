// e2e/pilot.cjs — session 3 driver core. Trusted-input hand over CDP.
// Lesson from session 2 baked in: NEVER synthetic DOM events. All clicks go
// through CDP Input domain (playwright page.mouse) = browser-level trusted input.
const pw = require('playwright')
const fs = require('fs')

let browser, page
async function connect() {
  if (page && !page.isClosed()) return page
  browser = await pw.chromium.connectOverCDP('http://localhost:9222')
  const ctx = browser.contexts()[0]
  page = ctx.pages().find(p => p.url().includes('4173')) || ctx.pages()[0]
  await page.bringToFront()
  return page
}

// ---------- perception ----------
async function state() {
  const p = await connect()
  return p.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth }
    const clickables = [...document.querySelectorAll('button,[role=button],[onclick],[style*="cursor: pointer"],[style*="cursor:pointer"]')]
      .filter(vis).slice(0, 80).map(el => { const r = el.getBoundingClientRect(); return { t: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) } })
    return { url: location.href, title: document.title, text: document.body.innerText.slice(0, 4000), clickables }
  })
}
async function shot(name) {
  const p = await connect()
  const f = `/tmp/shots/${name || Date.now()}.png`
  fs.mkdirSync('/tmp/shots', { recursive: true })
  await p.screenshot({ path: f })
  return f
}
// find visible element center by text (exact-ish match, shortest wins)
async function locate(txt) {
  const s = await state()
  const q = txt.toLowerCase()
  const hits = s.clickables.filter(c => c.t.toLowerCase().includes(q)).sort((a, b) => a.t.length - b.t.length)
  return hits[0] || null
}
// ---------- action (all trusted CDP input) ----------
async function click(x, y) { const p = await connect(); await p.mouse.click(x, y); await p.waitForTimeout(350) }
async function clickText(txt) { const c = await locate(txt); if (!c) throw new Error(`no clickable matching "${txt}"`); await click(c.x, c.y); return c }
async function drag(x1, y1, x2, y2) {
  const p = await connect()
  await p.mouse.move(x1, y1); await p.mouse.down()
  for (let i = 1; i <= 8; i++) await p.mouse.move(x1 + (x2 - x1) * i / 8, y1 + (y2 - y1) * i / 8)
  await p.mouse.up(); await p.waitForTimeout(400)
}
async function key(k) { const p = await connect(); await p.keyboard.press(k); await p.waitForTimeout(250) }
async function evaljs(code) { const p = await connect(); return p.evaluate(code) }

async function reset() { try { if (browser) await browser.close() } catch (e) {} browser = null; page = null }

module.exports = { connect, state, shot, locate, click, clickText, drag, key, evaljs, reset }

// CLI: node pilot.cjs state | shot NAME | click X Y | clicktext TXT | key K | eval CODE
if (require.main === module) {
  const [cmd, ...a] = process.argv.slice(2)
  ;(async () => {
    if (cmd === 'state') { const s = await state(); console.log(JSON.stringify(s, null, 1).slice(0, 6000)) }
    else if (cmd === 'shot') console.log(await shot(a[0]))
    else if (cmd === 'click') await click(+a[0], +a[1])
    else if (cmd === 'clicktext') console.log(JSON.stringify(await clickText(a.join(' '))))
    else if (cmd === 'drag') await drag(+a[0], +a[1], +a[2], +a[3])
    else if (cmd === 'key') await key(a[0])
    else if (cmd === 'eval') console.log(JSON.stringify(await evaljs(a.join(' '))))
    process.exit(0)
  })().catch(e => { console.error('ERR:', e.message); process.exit(1) })
}
