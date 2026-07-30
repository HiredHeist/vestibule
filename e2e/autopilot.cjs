// e2e/autopilot.cjs — session 3 autonomous player. Runs the state machine loop.
// Doctrine: legit play only (no debug keys, no HP edits). Logs every decision.
// Usage: node e2e/autopilot.cjs [maxMinutes]
const P0 = require('./pilot.cjs')
const fs = require('fs')
const LOG = '/home/claude/vestibule/e2e/session3-events.jsonl'
const ev = (type, data) => { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ev: type, ...data }) + '\n') }
// every pilot op gets a hard timeout — a hung CDP call must never freeze the loop
const TMO = 20000
const wrap = fn => (...a) => Promise.race([fn(...a), new Promise((_, rej) => setTimeout(() => rej(new Error('op timeout: ' + fn.name)), TMO))])
const P = { connect: P0.connect, state: wrap(P0.state), shot: wrap(P0.shot), click: wrap(P0.click), clickText: wrap(P0.clickText), drag: wrap(P0.drag), key: wrap(P0.key), evaljs: wrap(P0.evaljs) }

const OVERLAY_BTNS = ['got it', 'onward', 'continue', 'collect', 'claim', 'next fight', 'descend', 'take the stage', 'ok']

async function screenType(s) {
  const t = s.text.toUpperCase()
  const btn = txt => s.clickables.some(c => c.t.toLowerCase().includes(txt))
  if (btn('got it')) return 'popup'
  if (btn('discard & continue') || btn('✓ confirm')) return 'modal'
  if (t.includes('THE DESCENT') && t.includes('SELECT THIS PATH')) return 'descent'
  if (t.includes('OPENING NIGHT')) return 'draft'
  if (btn('strike')) return 'combat'
  if (t.includes('BACK TO THE PIT') || t.includes('SLY')) return 'shop'
  if (t.includes('START TUTORIAL') || t.includes('ENTER THE VESTIBULE')) return 'menu'
  if (t.includes('DEFEATED BY') || t.includes('PLAY AGAIN') || t.includes('TRY AGAIN') || t.includes('CAUSE OF DEATH')) return 'death'
  if (t.includes('LUCIFER IS DEAD') || t.includes('VICTORY')) return 'victory'
  return 'unknown'
}

async function hand() {
  return P.evaljs(`(() => {
    const seen = {}
    const cards = [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < 200 && r.y > 700 && r.height > 150
    })
    return cards.map(c => { const r = c.getBoundingClientRect(); const t = c.textContent.replace(/\\s+/g, ' ')
      const m = t.match(/^(\\d+)(.*?)(RIFF|UTILITY|EMBER|CORRUPT)/)
      return m ? { cost: +m[1], name: m[2].replace(/[^A-Za-z' ]/g, ' ').replace(/Need \\d+% Corr/, '').trim(), type: m[3], x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), desc: t.slice(0, 110) } : null
    }).filter(Boolean).filter(c => seen[c.name] ? false : (seen[c.name] = 1))
  })()`)
}
async function members() {
  return P.evaljs(`(() => {
    const seen = {}
    return [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /ATK\\s*\\d/.test(t) && /HP\\s*\\d/.test(t) && t.length < 160 && r.y > 250 && r.y < 700 && r.height > 150
    }).map(d => { const r = d.getBoundingClientRect(); const t = d.textContent.replace(/\\s+/g, ' ')
      const nm = t.match(/^([A-Z][a-z]+)/); const atk = t.match(/ATK\\s*(\\d+)(?:\\+(\\d+))?/); const hp = t.match(/HP\\s*(\\d+)/)
      return nm && atk ? { name: nm[1], atk: (+atk[1]) + (+(atk[2] || 0)), hp: hp ? +hp[1] : 0, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } : null
    }).filter(Boolean).filter(m => seen[m.name] ? false : (seen[m.name] = 1))
  })()`)
}

async function combatTick(s) {
  const strikes = (s.text.match(/STRIKE ⛧\s*(\d+)\s*\/\s*(\d+)/) || [])[1]
  const bossHp = (s.text.match(/(\d+)\s*\/\s*(\d+)\s*HP/) || [])
  const h = await hand(); const mem = await members()
  if (!mem.length) { ev('warn', { msg: 'no members parsed' }); return P.clickText('strike').catch(() => {}) }
  const target = mem.sort((a, b) => b.atk - a.atk)[0]
  const embers = +((s.text.match(/(\d+)\s*\/\s*\d+\s*\n?FIGHT/) || [])[1] || 99)
  // SHREDDER doctrine: embers first, then EVERY affordable RIFF back-to-back (chains
  // pay 1/2/4x per consecutive pair), buffs onto the carry, skip corr-gated dead cards.
  const rank = { EMBER: 0, RIFF: 1, UTILITY: 2, CORRUPT: 3 }
  const playable = h.filter(c => !/Need \d+% Corr/i.test(c.desc))
    .sort((a, b) => (rank[a.type] - rank[b.type]) || (a.cost - b.cost))
  let played = 0, failStreak = 0
  for (const c of playable) {
    const before = (await P.state()).text
    await P.drag(c.x, c.y, target.x, target.y)
    const after = (await P.state()).text
    if (before !== after) { played++; failStreak = 0; ev('play', { card: c.name, cardType: c.type, cost: c.cost, target: target.name }) }
    else { failStreak++; ev('play_fail', { card: c.name, cost: c.cost }) }
    if ((await P.state()).text.toUpperCase().includes('DISCARD & CONTINUE')) { await modalTick(await P.state()) }
    if (failStreak >= 3 || played >= 6) break
  }
  const preview = ((await P.state()).text.match(/DEALS\s*(\d+)/) || [])[1]
  ev('strike', { strikes, bossHp: bossHp[1], played, embers, preview })
  await P.clickText('strike').catch(e => ev('warn', { msg: 'strike btn: ' + e.message }))
  await P.connect().then(p => p.waitForTimeout(1800))
}

async function modalTick(s) {
  // discard-picker / confirm modals: pick the deadest card (corr-gated first), then continue
  const cards = await P.evaljs(`(() => {
    return [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < 200 && r.y < 720 && r.height > 100 && r.width < 400
    }).map(d => { const r = d.getBoundingClientRect(); return { t: d.textContent.replace(/\\s+/g, ' ').slice(0, 60), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
  })()`)
  if (cards.length) {
    const pick = cards.find(c => /Need \d+% Corr|Dark Tuning/i.test(c.t)) || cards[0]
    ev('modal_pick', { card: pick.t.slice(0, 40) })
    await P.click(pick.x, pick.y)
  }
  await P.clickText('discard & continue').catch(() => P.clickText('confirm').catch(() => {}))
}

async function descentTick(s) {
  // take fights, never skip (shops = economy). Leftmost SELECT THIS PATH.
  const sel = s.clickables.filter(c => c.t.toLowerCase().includes('select this path')).sort((a, b) => a.x - b.x)[0]
  if (sel) { ev('descent', { pick: sel.t.slice(0, 50) }); await P.click(sel.x, sel.y) }
  else { const d = s.clickables.find(c => c.t.includes('DESCEND')); if (d) { ev('descent', { pick: 'DESCEND' }); await P.click(d.x, d.y) } }
}

async function shopTick(s) {
  const f = `/tmp/shots/shop-${Date.now()}.png`; await P.shot(f.split('/').pop().replace('.png', ''))
  ev('shop_seen', { text: s.text.slice(0, 1500), note: 'v1 log-only; buy policy TODO', shot: f })
  const leave = s.clickables.find(c => c.t.toLowerCase().includes('back to the pit'))
  if (leave) await P.click(leave.x, leave.y)
}

async function draftTick(s) {
  // pick pair sharing a keyword w/ max ATK+HP/2
  const cand = s.clickables.filter(c => /ATK\d/.test(c.t.replace(/\s/g, ''))).map(c => {
    const kw = (c.t.match(/(FRENZIED|DOUBLE TIME|ANCHOR|CORRUPT|DEBUFF|FOLK MAGIC|SHREDDER|HEXED)/i) || [])[1] || ''
    const atk = +(c.t.match(/ATK\s*(\d+)/i) || [0, 0])[1]; const hp = +(c.t.match(/HP\s*(\d+)/i) || [0, 0])[1]
    return { ...c, kw, score: atk + hp / 2 }
  })
  let best = null
  for (const a of cand) for (const b of cand) if (a !== b) {
    const sc = a.score + b.score + (a.kw && a.kw === b.kw ? 6 : 0)
    if (!best || sc > best.sc) best = { a, b, sc }
  }
  if (best) { ev('draft', { pick: [best.a.t.slice(0, 30), best.b.t.slice(0, 30)] }); await P.click(best.a.x, best.a.y); await P.click(best.b.x, best.b.y); await P.clickText('take the stage').catch(() => {}) }
}

async function main() {
  const maxMs = (+(process.argv[2] || 14)) * 60000
  const t0 = Date.now()
  let lastHash = '', stuck = 0
  ev('session', { msg: 'autopilot v1 start' })
  let tick = 0
  while (Date.now() - t0 < maxMs) {
    tick++
    if (tick % 10 === 0) ev('heartbeat', { tick })
    let s; try { s = await P.state() } catch (e) { ev('error', { msg: e.message }); await new Promise(r => setTimeout(r, 3000)); continue }
    const hash = s.text.slice(0, 500)
    stuck = (hash === lastHash) ? stuck + 1 : 0; lastHash = hash
    const type = await screenType(s)
    if (stuck >= 6) {
      const f = await P.shot('stuck-' + Date.now()); ev('stuck', { type, shot: f, text: s.text.slice(0, 800) })
      for (const b of OVERLAY_BTNS) { try { await P.clickText(b); stuck = 0; break } catch (e) {} }
      if (stuck >= 10) { ev('abort', { msg: 'hard stuck' }); break }
    }
    try {
      if (type === 'popup') { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e) {} } }
      else if (type === 'modal') await modalTick(s)
      else if (type === 'descent') await descentTick(s)
      else if (type === 'combat') await combatTick(s)
      else if (type === 'shop') await shopTick(s)
      else if (type === 'draft') await draftTick(s)
      else if (type === 'menu') { ev('run_start', {}); await P.clickText('skip tutorial').catch(() => P.clickText('enter the vestibule')) }
      else if (type === 'death') { const f = await P.shot('death-' + Date.now()); ev('run_end', { result: 'death', shot: f, text: s.text.slice(0, 1200) }); await P.clickText('play again').catch(() => P.clickText('try again').catch(() => {})) }
      else if (type === 'victory') { const f = await P.shot('VICTORY-' + Date.now()); ev('run_end', { result: 'VICTORY', shot: f, text: s.text.slice(0, 2000) }); break }
      else { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e) {} } ev('unknown_screen', { text: s.text.slice(0, 300) }) }
    } catch (e) { ev('error', { msg: e.message, type }) }
    await new Promise(r => setTimeout(r, 800))
  }
  ev('session', { msg: 'autopilot loop end', minutes: ((Date.now() - t0) / 60000).toFixed(1) })
  process.exit(0)
}
main()
