// e2e/autopilot.cjs — session 3 autonomous player. Runs the state machine loop.
// Doctrine: legit play only (no debug keys, no HP edits). Logs every decision.
// Usage: node e2e/autopilot.cjs [maxMinutes]
const P0 = require('./pilot.cjs')
const fs = require('fs')
const path = require('path')
const LOG = path.join(__dirname, 'session3-events.jsonl')
const ev = (type, data) => { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ev: type, ...data }) + '\n') }
// every pilot op gets a hard timeout — a hung CDP call must never freeze the loop
const TMO = 20000
const wrap = fn => (...a) => Promise.race([fn(...a), new Promise((_, rej) => setTimeout(() => rej(new Error('op timeout: ' + fn.name)), TMO))])
const P = { connect: P0.connect, state: wrap(P0.state), shot: wrap(P0.shot), click: wrap(P0.click), clickText: wrap(P0.clickText), drag: wrap(P0.drag), key: wrap(P0.key), evaljs: wrap(P0.evaljs), playCard: wrap(P0.playCard) }

const OVERLAY_BTNS = ['got it', 'onward', 'continue', 'collect', 'claim', 'next fight', 'descend', 'take the stage', 'ok']

async function screenType(s) {
  const t = s.text.toUpperCase()
  const btn = txt => s.clickables.some(c => c.t.toLowerCase().includes(txt))
  if (btn('got it')) return 'popup'
  if (btn('discard & continue') || btn('✓ confirm')) return 'modal'
  if (t.includes('THE PACT')) return 'pact'
  if (t.includes('— OR —') || t.includes('OR —')) return 'event'
  if (t.includes('THE DESCENT') && t.includes('SELECT THIS PATH')) return 'descent'
  if (t.includes('OPENING NIGHT')) return 'draft'
  if (btn('strike')) return 'combat'
  if (!t.includes('BACK TO THE PIT') && !t.includes('OPENING NIGHT') && /RECRUIT|PICK 1|CHOOSE YOUR/.test(t) && /ATK\s*\d/.test(s.text)) return 'recruit'
  if (t.includes('BACK TO THE PIT') || t.includes('SLY')) return 'shop'
  if (t.includes('START TUTORIAL') || t.includes('ENTER THE VESTIBULE')) return 'menu'
  if (t.includes('DEFEATED BY') || t.includes('PLAY AGAIN') || t.includes('TRY AGAIN') || t.includes('CAUSE OF DEATH')) return 'death'
  if (t.includes('LUCIFER IS DEAD') || (t.includes('VICTORY') && t.includes('LUCIFER'))) return 'victory'
  if (t.includes('VICTORY') || t.includes('ONWARD')) return 'popup' // fight-victory summary → click through
  return 'unknown'
}

async function hand() {
  return P.evaljs(`(() => {
    const seen = {}
    const cards = [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < 200 && r.y > innerHeight * 0.62 && r.height > innerHeight * 0.13
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
      return /ATK\\s*\\d/.test(t) && /HP\\s*\\d/.test(t) && t.length < 400 && r.y > innerHeight * 0.2 && r.y < innerHeight * 0.66 && r.height > innerHeight * 0.11 && r.width < innerWidth * 0.24
    }).map(d => { const r = d.getBoundingClientRect(); const t = d.textContent.replace(/\\s+/g, ' ')
      const nm = t.match(/([A-Z][a-z]+)\\s*(?:Rhythm|Lead|Bass|Synth|Drummer|Vocalist|Dark|[A-Z]{2})/) || t.match(/^\\W*([A-Z][a-z]+)/)
      const atk = t.match(/ATK\\s*(\\d+)(?:\\+(\\d+))?/); const hp = t.match(/HP\\s*(\\d+)/)
      return nm && atk ? { name: nm[1], atk: (+atk[1]) + (+(atk[2] || 0)), hp: hp ? +hp[1] : 0, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } : null
    }).filter(Boolean).filter(m => seen[m.name] ? false : (seen[m.name] = 1))
  })()`)
}

const BRAIN = require('./brain.cjs')
let strikeNumThisFight = 0, lastBossHp = null
let zeroStrikeTicks = 0, preferNewRun = false

async function combatTick(s) {
  const strikes = (s.text.match(/STRIKE ⛧\s*(\d+)\s*\/\s*(\d+)/) || [])[1]
  const bossHp = (s.text.match(/(\d+)\s*\/\s*(\d+)\s*HP/) || [])
  if (lastBossHp !== null && bossHp[2] && +bossHp[1] === +bossHp[2]) { strikeNumThisFight = 0; playedIdsThisFight.length = 0; firedChainsThisFight = new Set() } // full-HP boss = new fight
  lastBossHp = bossHp[1] ? +bossHp[1] : null
  const h = await hand(); let mem = await members()
  if (!mem.length) {
    ev('warn', { msg: 'no members parsed — using fixed slot fallback' })
    const vp = await P.evaljs('({w:innerWidth,h:innerHeight})')
    mem = [{ name: 'slot1', atk: 1, hp: 5, x: Math.round(vp.w * 0.38), y: Math.round(vp.h * 0.44) }, { name: 'slot2', atk: 0, hp: 5, x: Math.round(vp.w * 0.53), y: Math.round(vp.h * 0.44) }]
  }
  // ── EXPERT BRAIN (ported sim scoreCard policy) ──
  // gs-lite from the live screen; sim stop-rule: play best card while score > 3
  const gsLite = () => ({
    alive: mem.map(m => ({ ...m, maxHp: m.hp })), // maxHp approximation (parse limit)
    corruption: +((s.text.match(/^(\d+)%/) || [0, 0])[1]),
    stash: +((s.text.match(/STASH\s*\n?(\d+)/) || [0, 0])[1]),
    embers: +((s.text.match(/(\d+)\s*\/\s*\d+\s*\n?FIGHT/) || [0, 5])[1]),
    discardsLeft: +((s.text.match(/(\d+)\s*\/\s*\d+\s*\n?EMBERS/) || [0, 4])[1]),
    strikeMult: +((s.text.match(/MULTIPLIER\s*\n?×([\d.]+)/) || [0, 1])[1]),
    bossHp: +(bossHp[1] || 0), fightIndex: 0,
    anyStoned: /TOO STONED/i.test(s.text),
    handIds: [], handLen: 0, cardsPlayedIds: playedIdsThisFight, firedChains: firedChainsThisFight, discardLen: +((s.text.match(/(\d+)\s*\n?DISCARD/) || [0, 0])[1]),
  })
  const embers = gsLite().embers
  let played = 0, failStreak = 0
  const failed = new Set()
  for (let iter = 0; iter < 10 && played < 8 && failStreak < 3; iter++) {
    const cur = await hand()
    const known = cur.map(c => ({ ...c, card: BRAIN.matchCard(c.name) })).filter(c => c.card && !failed.has(c.name))
      .filter(c => !/Need \d+% Corr/i.test(c.desc) || gsLite().corruption >= 40)
      .filter(c => { const n = c.desc.match(/NEED\s*(\d)(?!\d|%)/); return !n || mem.length >= +n[1] })
    const gs = gsLite()
    gs.handIds = known.map(k => k.card.id); gs.handLen = cur.length
    const affordable = known.filter(k => k.cost <= gs.embers)
    if (!affordable.length) { if (iter === 0) ev('no_play', { handSeen: cur.length, matched: known.length, embers: gs.embers, names: cur.map(x => x.name.slice(0, 18)) }); break }
    affordable.forEach(k => { k.score = BRAIN.scoreCard(k.card, gs, strikeNumThisFight, played) })
    affordable.sort((a, b) => b.score - a.score)
    const c = affordable[0]
    if (c.score <= 3) break // sim stop-rule: nothing worth playing, save the hand
    const tgt = BRAIN.pickTarget(c.card, mem)
    await P.playCard(c.x, c.y, tgt.x, tgt.y)
    const after = (await hand()).length
    if (after < cur.length) {
      played++; failStreak = 0; playedIdsThisFight.push(c.card.id)
      for (const ch of BRAIN.RIFF_CHAINS) { const ck = ch[0] + '+' + ch[1]; if (!firedChainsThisFight.has(ck) && playedIdsThisFight.includes(ch[0]) && playedIdsThisFight.includes(ch[1])) firedChainsThisFight.add(ck) }
      ev('play', { card: c.card.id, score: c.score, cost: c.cost, target: tgt.name })
    }
    else { failStreak++; failed.add(c.name); ev('play_fail', { card: c.name, cost: c.cost }); await P.click(c.x, c.y).catch(() => {}) }
    if ((await P.state()).text.toUpperCase().includes('DISCARD & CONTINUE')) { await modalTick(await P.state()) }
  }
  // PANIC BUTTON (sim doctrine: clutch trips when the fight goes south) —
  // <=2 strikes left and boss above ~45%: drop a held trip before striking
  const sNow = await P.state()
  const strikesLeft = +((sNow.text.match(/STRIKE ⛧\s*(\d+)\s*\//) || [])[1] || 4)
  const hpm = sNow.text.match(/(\d+)\s*\/\s*(\d+)\s*HP/)
  if (strikesLeft <= 2 && hpm && (+hpm[1] / +hpm[2]) > 0.45) {
    const trip = sNow.clickables.find(c => /🍄|🧪|💠/.test(c.t) && c.t.length < 30)
    if (trip) { ev('trip_used', { btn: trip.t, bossPct: (100 * hpm[1] / hpm[2]).toFixed(0) }); await P.click(trip.x, trip.y); await P.connect().then(p => p.waitForTimeout(1500)) }
  }
  // ZOMBIE-FIGHT GUARD (game bug logged Jul 30): save made at 0 strikes reloads into a
  // locked fight — 0 strikes, boss alive, no death trigger, and no abandon option in pause.
  if (strikes === '0' && played === 0) { zeroStrikeTicks++ } else zeroStrikeTicks = 0
  if (zeroStrikeTicks >= 3) {
    ev('zombie_fight', { msg: 'save-at-0-strikes soft-lock — clearing save, forcing new run' })
    await P.evaljs("localStorage.removeItem('vst_save'); setTimeout(()=>location.reload(),50); 'x'").catch(() => {})
    preferNewRun = true; zeroStrikeTicks = 0
    await P.connect().then(p => p.waitForTimeout(4000))
    return
  }
  const preview = (sNow.text.match(/DEALS\s*(\d+)/) || [])[1]
  ev('strike', { strikes, bossHp: bossHp[1], played, embers, preview, chains: firedChainsThisFight.size })
  strikeNumThisFight++
  await P.clickText('strike').catch(e => ev('warn', { msg: 'strike btn: ' + e.message }))
  await P.connect().then(p => p.waitForTimeout(1800))
}
// per-fight brain state (sim: _cardsPlayedIds persists across strikes within a fight)
const playedIdsThisFight = []
let firedChainsThisFight = new Set()

async function modalTick(s) {
  // discard-picker / confirm modals: pick the deadest card (corr-gated first), then continue
  const cards = await P.evaljs(`(() => {
    return [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < 200 && r.y < innerHeight * 0.67 && r.height > innerHeight * 0.09 && r.width < innerWidth * 0.21
    }).map(d => { const r = d.getBoundingClientRect(); return { t: d.textContent.replace(/\\s+/g, ' ').slice(0, 60), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
  })()`)
  if (cards.length) {
    const pick = cards.find(c => /Need \d+% Corr|Dark Tuning/i.test(c.t)) || cards[0]
    ev('modal_pick', { card: pick.t.slice(0, 40) })
    await P.click(pick.x, pick.y)
  }
  await P.clickText('discard & continue').catch(() => P.clickText('confirm').catch(() => {}))
}

async function pactTick(s) {
  // boss-kill pact choice: prefer permanent band-wide power (sim scorePact doctrine).
  const opts = s.clickables.filter(c => c.w > 150 && c.h > 100 && !/skip/i.test(c.t))
  const score = c => {
    const t = c.t.toLowerCase(); let p = 10
    if (/all .*(\+\d+ )?max hp|max hp perm/i.test(t)) p += 80
    if (/all .*\+\d+ atk|atk permanently/i.test(t)) p += 75
    if (/ember/i.test(t)) p += 60
    if (/permanent/i.test(t)) p += 40
    if (/strike/i.test(t)) p += 45
    if (/draw|hand/i.test(t)) p += 35
    if (/instead of|deals \d+x/i.test(t)) p += 25 // single-card upgrades: meh
    if (/lose|sacrifice|dies|-\d+/i.test(t)) p -= 40
    return p
  }
  const pick = opts.sort((a, b) => score(b) - score(a))[0]
  if (pick) { ev('pact_choice', { pick: pick.t.slice(0, 60), score: score(pick) }); await P.click(pick.x, pick.y) }
  else { ev('pact_skip', {}); await P.clickText('skip').catch(() => {}) }
}

async function eventTick(s) {
  // random-event choices: prefer permanent gains, avoid stash losses. else first option.
  const opts = s.clickables.filter(c => c.w > 150 && c.h > 40 && !/hide|undo/i.test(c.t))
  const score = c => (/permanent|perm |\+\d+ ATK/i.test(c.t) ? 2 : 0) - (/lose \d+ stash/i.test(c.t) ? 1 : 0)
  const pick = opts.sort((a, b) => score(b) - score(a))[0]
  if (pick) { ev('event_choice', { pick: pick.t.slice(0, 60), all: opts.map(o => o.t.slice(0, 40)) }); await P.click(pick.x, pick.y) }
}

async function descentTick(s) {
  // take fights, never skip (shops = economy). Leftmost SELECT THIS PATH.
  const sel = s.clickables.filter(c => c.t.toLowerCase().includes('select this path')).sort((a, b) => a.x - b.x)[0]
  if (sel) { ev('descent', { pick: sel.t.slice(0, 50) }); await P.click(sel.x, sel.y) }
  else { const d = s.clickables.find(c => c.t.includes('DESCEND')); if (d) { ev('descent', { pick: 'DESCEND' }); await P.click(d.x, d.y) } }
}

// ── ECONOMY DOCTRINE — ported from vestibule-sim-kwstacks.js simShop() ──
// members-first packs, keyword-stack candidate scoring, relic + pedal per circle,
// drug reserves (shrooms if stash>=16, acid if stash>=22), then leave.
const KW_W = { FRENZIED: 6, 'FOLK MAGIC': 5, CORRUPT: 4, HEXED: 3, SHREDDER: 3, 'DOUBLE TIME': 2, DEBUFF: 2, ANCHOR: 1 }
const BOT = { boughtThisShop: new Set(), lastShopSig: '', artifacts: 0, pedals: 0 }

function memberScoreFromText(t) {
  const atk = +((t.match(/ATK\s*(\d+)/i) || [0, 0])[1])
  const hp = +((t.match(/HP\s*(\d+)/i) || [0, 0])[1])
  const kw = (t.match(/(FRENZIED|DOUBLE TIME|ANCHOR|CORRUPT|DEBUFF|FOLK MAGIC|SHREDDER|HEXED)/i) || [])[1] || ''
  let p = atk * 3 + hp + (KW_W[kw.toUpperCase()] || 0)
  if (/FOIL/i.test(t)) p += 20; if (/MYTHIC/i.test(t)) p += 40; if (/DEMONIC/i.test(t)) p += 80
  return { p, kw: kw.toUpperCase() }
}

async function shopTick(s) {
  const t = s.text
  const sig = (t.match(/STASH\s*\n?💵\s*\n?(\d+)/) || ['', '?'])[1] + '|' + t.length
  if (BOT.lastShopSig !== sig.split('|')[1]) { BOT.boughtThisShop = new Set(); BOT.lastShopSig = sig.split('|')[1] }
  const stash = +((t.match(/STASH\s*\n?💵\s*\n?(\d+)/) || [0, 0])[1])
  const bandNames = [...t.matchAll(/⟨\s*\n?[^\n⟩]*\n?([A-Z][a-z]{2,})\s*\n?⟩/g)].map(m => m[1])
  const bandSize = new Set(bandNames).size || 2
  const buy = async (label, why) => {
    const c = s.clickables.find(c => c.t.toLowerCase().includes(label))
    if (!c) return false
    BOT.boughtThisShop.add(label)
    ev('shop_buy', { label: c.t.slice(0, 50), why, stash, bandSize })
    await P.click(c.x, c.y); return true
  }
  const tl = t.toLowerCase()
  // sold-check: look for SOLD within 200 chars AFTER the label (case-insensitive find)
  const tryable = l => { if (BOT.boughtThisShop.has(l)) return false; const i = tl.indexOf(l.toLowerCase()); return i < 0 ? true : !/sold/i.test(t.slice(i, i + 60)) } // 60 = tile-local; wider windows bleed into neighboring tiles' SOLD stamps
  // 1. MEMBERS FIRST (sim: needsMembers = band < 5)
  if (bandSize < 5) {
    if (/welcome pack/i.test(t)) {
      if (tryable('welcome pack')) { if (await buy('welcome pack', 'free member')) return; ev('shop_skip', { tile: 'welcome', why: 'not in clickables' }) }
      else ev('shop_skip', { tile: 'welcome', why: 'sold/bought' })
    }
    for (const [pk, cost] of [['demonic', 40], ['touring', 22], ['garage', 10]]) {
      if (!tl.includes(pk)) continue
      if (stash < cost) { ev('shop_skip', { tile: pk, why: `stash ${stash} < ${cost}` }); continue }
      if (!tryable(pk)) { ev('shop_skip', { tile: pk, why: 'sold/bought' }); continue }
      if (await buy(pk, 'members-first, band=' + bandSize)) return
      ev('shop_skip', { tile: pk, why: 'tile not in clickables' })
    }
  }
  // 2. RELIC (one per circle; sim buys if <3 owned and value clears bar — simplified: keep 4 reserve)
  if (BOT.artifacts < 3 && /THIS CIRCLE ONLY/.test(t) && tryable('artifact')) {
    const m = t.match(/⛧ ARTIFACT\s*\n?(\d+)\s*\n?(\d+)?/)
    const cost = m ? +(m[2] || m[1]) : 99
    if (stash >= cost + 4 && await buy('artifact', 'relic value, cost=' + cost)) { BOT.artifacts++; return }
  }
  // 3. EFFECT PEDAL (sim: one passive per circle)
  if (/EFFECT PEDAL/.test(t) && tryable('effect pedal')) {
    const m = t.match(/⛧ EFFECT PEDAL\s*\n?(\d+)\s*\n?(\d+)?/)
    const cost = m ? +(m[2] || m[1]) : 99
    if (stash >= cost + 6 && await buy('effect pedal', 'pedal-per-circle, cost=' + cost)) { BOT.pedals++; return }
  }
  // 4. DRUGS (sim: shrooms if stash>=16, acid if stash>=22 — reserve logic)
  if (stash >= 16 && /Shrooms/i.test(t) && !/Shrooms\s*\n?DRY/i.test(t) && tryable('shrooms') && await buy('shrooms', 'panic button reserve')) return
  if (stash >= 22 && /🧪/.test(t) && !/🧪\s*\n?DRY/i.test(t) && tryable('🧪') && await buy('🧪', 'acid reserve')) return
  // 5. done — leave
  const f = await P.shot('shop-final-' + Date.now())
  ev('shop_leave', { stash, bandSize, bought: [...BOT.boughtThisShop], shot: f })
  BOT.boughtThisShop = new Set(); BOT.lastShopSig = ''
  const leave = s.clickables.find(c => c.t.toLowerCase().includes('back to the pit'))
  if (leave) await P.click(leave.x, leave.y)
}

async function recruitTick(s) {
  // RecruitScreen after buying a pack: pick best candidate (sim pickBestCandidate policy).
  // Candidate cards are plain divs (not cursor:pointer) — query the DOM directly.
  let cands = await P.evaljs(`(() => {
    const seen = {}
    return [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /ATK\\s*\\d/.test(t) && /HP\\s*\\d/.test(t) && t.length < 350 && r.height > innerHeight * 0.12 && r.width > innerWidth * 0.06 && r.width < innerWidth * 0.22
    }).map(d => { const r = d.getBoundingClientRect(); return { t: d.textContent.replace(/\\s+/g, ' ').slice(0, 120), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
      .filter(c => { const k = c.t.slice(0, 25); return seen[k] ? false : (seen[k] = 1) })
  })()`).catch(() => [])
  if (cands.length) {
    // stack-tier bonus: favor keywords the band already runs (parsed from stage strip earlier runs — approximate with pair bonus)
    const scored = cands.map(c => { const { p, kw } = memberScoreFromText(c.t); return { ...c, p, kw } })
    const counts = {}; scored.forEach(c => { counts[c.kw] = (counts[c.kw] || 0) + 1 })
    const best = scored.sort((a, b) => (b.p + (counts[b.kw] > 1 ? 15 : 0)) - (a.p + (counts[a.kw] > 1 ? 15 : 0)))[0]
    ev('recruit_pick', { pick: best.t.slice(0, 50), score: best.p })
    await P.click(best.x, best.y)
    for (const b of ['add to band', 'recruit', 'confirm', 'take', 'join', 'welcome']) { try { await P.clickText(b); break } catch (e) {} }
  } else {
    ev('recruit_pass', { why: 'no candidates parsed' })
    try { await P.clickText('pass') } catch (e) { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e2) {} } }
  }
}

async function draftTick(s) {
  // v2 (Jul 30): VERIFY-AFTER-EACH-CLICK. Candidate clicks TOGGLE selection and the
  // layout shifts on select — blind double-clicks can toggle forever (the "spaz").
  // Ground truth: the confirm button reads "SELECT 2 MUSICIANS" until exactly 2 are
  // selected, then becomes "TAKE THE STAGE". Click one candidate at a time, re-read.
  const stageBtn = st => st.clickables.find(c => /take the stage/i.test(c.t))
  let st = s
  for (let attempt = 0; attempt < 8; attempt++) {
    const ready = stageBtn(st)
    if (ready) { ev('draft_confirm', { attempt }); await P.click(ready.x, ready.y); return }
    const cand = st.clickables.filter(c => /ATK\d/.test(c.t.replace(/\s/g, ''))).map(c => {
      const { p, kw } = memberScoreFromText(c.t)
      return { ...c, kw, score: p }
    }).sort((a, b) => b.score - a.score)
    if (!cand.length) { ev('draft_confused', { msg: 'no candidates parsed' }); return }
    // prefer keyword-pair: if top pick's keyword has a partner, boost the partner
    const top = cand[0]
    const partner = cand.find(c => c !== top && c.kw && c.kw === top.kw)
    const order = partner ? [top, partner, ...cand.filter(c => c !== top && c !== partner)] : cand
    // click ONE candidate, then re-read and let the loop decide the next move
    const pick = order[attempt % order.length]
    ev('draft_click', { attempt, pick: pick.t.slice(0, 30) })
    await P.click(pick.x, pick.y)
    await P.connect().then(p => p.waitForTimeout(500))
    st = await P.state()
  }
  const f = await P.shot('draft-confused-' + Date.now())
  ev('draft_confused', { msg: '8 attempts, no TAKE THE STAGE', shot: f })
}

async function main() {
  const maxMs = (+(process.argv[2] || 14)) * 60000
  const t0 = Date.now()
  let lastHash = '', stuck = 0
  ev('session', { msg: 'autopilot v2 start' })
  // player-settings for a steadier hand: hover-zoom off (cards stop re-fanning under
  // the cursor), damage numbers on. Same toggles a human sets in OPTIONS.
  try { await P.evaljs("localStorage.setItem('vst_hoverzoom','off'); localStorage.setItem('vst_shake','off'); 'ok'") } catch (e) {}
  let tick = 0, opTimeouts = 0
  const origEv = ev
  // rig self-heal: 3 consecutive op timeouts = degraded CDP session → restart Electron,
  // reconnect. Game state survives in localStorage (vst_save mid-fight snapshot).
  global.__opTimeout = async () => {
    opTimeouts++
    if (opTimeouts >= 3) {
      origEv('rig_heal', { msg: 'restarting electron after ' + opTimeouts + ' op timeouts' })
      if (process.platform === 'linux') {
        try {
          require('child_process').execSync('pkill -f "electron ./e2e/driver" 2>/dev/null; pkill Xvfb 2>/dev/null; sleep 2; bash ' + path.join(__dirname, 'up.sh'), { timeout: 60000 })
        } catch (e) { origEv('rig_heal_err', { msg: e.message.slice(0, 100) }) }
      }
      await P0.reset(); opTimeouts = 0
      await new Promise(r => setTimeout(r, 4000))
    }
  }
  while (Date.now() - t0 < maxMs) {
    tick++
    if (tick % 10 === 0) ev('heartbeat', { tick })
    let s; try { s = await P.state(); opTimeouts = 0 } catch (e) { ev('error', { msg: e.message }); if (/op timeout/.test(e.message)) await global.__opTimeout(); await new Promise(r => setTimeout(r, 3000)); continue }
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
      else if (type === 'event') await eventTick(s)
      else if (type === 'pact') await pactTick(s)
      else if (type === 'descent') await descentTick(s)
      else if (type === 'combat') await combatTick(s)
      else if (type === 'shop') await shopTick(s)
      else if (type === 'recruit') await recruitTick(s)
      else if (type === 'draft') await draftTick(s)
      else if (type === 'menu') {
        ev('run_start', { preferNewRun })
        if (preferNewRun) { preferNewRun = false; await P.clickText('enter the vestibule').catch(() => P.clickText('skip tutorial').catch(() => {})) }
        else await P.clickText('continue').catch(() => P.clickText('skip tutorial').catch(() => P.clickText('enter the vestibule')))
      }
      else if (type === 'death') { const f = await P.shot('death-' + Date.now()); ev('run_end', { result: 'death', shot: f, text: s.text.slice(0, 1200) }); await P.clickText('play again').catch(() => P.clickText('try again').catch(() => {})) }
      else if (type === 'victory') { const f = await P.shot('VICTORY-' + Date.now()); ev('run_end', { result: 'VICTORY', shot: f, text: s.text.slice(0, 2000) }); break }
      else { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e) {} } ev('unknown_screen', { text: s.text.slice(0, 300) }) }
    } catch (e) { ev('error', { msg: e.message, type }); if (/op timeout/.test(e.message)) await global.__opTimeout() }
    await new Promise(r => setTimeout(r, 800))
  }
  ev('session', { msg: 'autopilot loop end', minutes: ((Date.now() - t0) / 60000).toFixed(1) })
  process.exit(0)
}
main()
