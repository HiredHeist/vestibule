// e2e/analyze.cjs — turn a raw ledger into a readable playtest report.
//   node e2e\analyze.cjs                      (analyses e2e/session3-events.jsonl)
//   node e2e\analyze.cjs path\to\ledger.jsonl
//   node e2e\analyze.cjs --since 2026-08-03   (only runs on/after a date)
//
// Prints: one line per run, then a compiled report across all runs — card usage %,
// win/loss by circle, difficulty wall, over/under-powered cards, and an INTEGRITY
// section that flags impossible kills (the phantom-victory class of bug).
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const sinceIdx = args.indexOf('--since')
const SINCE = sinceIdx !== -1 ? args[sinceIdx + 1] : null
const FILE = args.find(a => !a.startsWith('--') && a !== SINCE) || path.join(__dirname, 'session3-events.jsonl')

if (!fs.existsSync(FILE)) { console.error('no ledger at ' + FILE); process.exit(1) }

const rows = []
for (const line of fs.readFileSync(FILE, 'utf8').split('\n')) {
  if (!line.trim()) continue
  try { const d = JSON.parse(line); if (!SINCE || d.ts >= SINCE) rows.push(d) } catch (e) {}
}
if (!rows.length) { console.error('no events' + (SINCE ? ' since ' + SINCE : '')); process.exit(1) }

const pct = (n, d) => d ? (100 * n / d).toFixed(0) + '%' : '—'
const bar = (v, max, w = 18) => '█'.repeat(Math.max(0, Math.round(w * v / (max || 1)))).padEnd(w)
const CIRCLE = fi => Math.floor(fi / 3) + 1

// ── slice into runs ───────────────────────────────────────────────────
const runs = []
let cur = null
const newRun = ts => ({ start: ts, plays: [], strikes: [], results: [], summary: null, fails: 0, deepest: -1, trips: 0, digs: 0, chains: 0, relics: [], pedals: [], outcome: '?' })
for (const d of rows) {
  const k = d.ev
  if (k === 'run_start' || (k === 'session' && /v2 start/.test(String(d.msg)))) { if (cur && (cur.plays.length || cur.strikes.length)) runs.push(cur); cur = newRun(d.ts); continue }
  if (!cur) cur = newRun(d.ts)
  if (k === 'play') cur.plays.push(d)
  else if (k === 'play_fail') cur.fails++
  else if (k === 'strike') { cur.strikes.push(d); if (typeof d.fightIndex === 'number' && d.fightIndex > cur.deepest) cur.deepest = d.fightIndex }
  else if (k === 'strike_result') cur.results.push(d)
  else if (k === 'trip_used') cur.trips++
  else if (k === 'discard_dig') cur.digs++
  else if (k === 'chain_fired') cur.chains++
  else if (k === 'shop_buy') { const l = String(d.label || ''); if (/^artifact:/.test(l)) cur.relics.push(l.slice(9, 30)); else if (/^effect pedal:/.test(l)) cur.pedals.push(l.slice(13, 34)) }
  else if (k === 'run_summary') { cur.summary = d; cur.outcome = d.outcome }
  else if (k === 'run_end') cur.outcome = d.result || cur.outcome
}
if (cur && (cur.plays.length || cur.strikes.length)) runs.push(cur)

console.log('\n' + '='.repeat(96))
console.log(' VESTIBULE PLAYTEST REPORT   ' + path.basename(FILE) + '   ' + rows.length.toLocaleString() + ' events   ' + runs.length + ' runs')
console.log(' ' + rows[0].ts.replace('T', ' ').slice(0, 19) + '  ->  ' + rows[rows.length - 1].ts.replace('T', ' ').slice(0, 19))
console.log('='.repeat(96))

// ── per-run lines ─────────────────────────────────────────────────────
console.log('\n── RUN BY RUN ' + '─'.repeat(81))
console.log('  #   outcome        mins  deepest        strikes plays fail%  chains trips relic/ped  peakATK')
runs.forEach((r, i) => {
  const mins = ((new Date(r.strikes.length ? r.strikes[r.strikes.length - 1].ts : r.start) - new Date(r.start)) / 60000).toFixed(1)
  const atk = Math.max(0, ...r.strikes.map(s => s.bandAtk || 0))
  const deep = r.deepest >= 0 ? `f${r.deepest} (C${CIRCLE(r.deepest)})` : '—'
  const fr = pct(r.fails, r.plays.length + r.fails)
  console.log(
    '  ' + String(i + 1).padStart(2) + '  ' + String(r.outcome).padEnd(14) + String(mins).padStart(5) +
    '  ' + deep.padEnd(13) + String(r.strikes.length).padStart(6) + String(r.plays.length).padStart(6) +
    String(fr).padStart(6) + String(r.chains).padStart(7) + String(r.trips).padStart(6) +
    ('  ' + r.relics.length + '/' + r.pedals.length).padEnd(11) + String(atk).padStart(8)
  )
})

// ── compiled ──────────────────────────────────────────────────────────
const allPlays = runs.flatMap(r => r.plays)
const allStrikes = runs.flatMap(r => r.strikes)
const allResults = runs.flatMap(r => r.results)
console.log('\n── COMPILED ACROSS ALL RUNS ' + '─'.repeat(68))
const wins = runs.filter(r => /VICTORY/i.test(r.outcome)).length
const deaths = runs.filter(r => r.outcome === 'death').length
const aband = runs.filter(r => /abandon|stall/i.test(r.outcome)).length
console.log(`  runs ${runs.length}   wins ${wins} (${pct(wins, runs.length)})   deaths ${deaths}   abandoned ${aband}`)
console.log(`  total: ${allPlays.length} cards played, ${allStrikes.length} strikes, ${runs.reduce((a, r) => a + r.fails, 0)} play-fails (${pct(runs.reduce((a, r) => a + r.fails, 0), allPlays.length + runs.reduce((a, r) => a + r.fails, 0))})`)

// deaths by circle = the difficulty curve
console.log('\n  DIFFICULTY WALL — where runs end:')
const byCircle = {}
runs.forEach(r => { if (r.deepest >= 0) byCircle[CIRCLE(r.deepest)] = (byCircle[CIRCLE(r.deepest)] || 0) + 1 })
const maxC = Math.max(1, ...Object.values(byCircle))
Object.keys(byCircle).map(Number).sort((a, b) => a - b).forEach(c => {
  console.log(`    Circle ${c}  ${bar(byCircle[c], maxC)} ${byCircle[c]} runs (${pct(byCircle[c], runs.length)})`)
})

// card usage — what % of the pool is even seeing play
let POOL = 0, POOL_IDS = []
try {
  const cd = require('./carddata.json'); POOL_IDS = cd.cards.map(c => c.id); POOL = POOL_IDS.length
} catch (e) {}
const useCount = {}
allPlays.forEach(p => { useCount[p.card] = (useCount[p.card] || 0) + 1 })
const distinct = Object.keys(useCount).length
console.log(`\n  CARD POOL COVERAGE: ${distinct}/${POOL || '?'} cards ever played (${pct(distinct, POOL)})`)
const never = POOL_IDS.filter(id => !useCount[id])
if (never.length) console.log(`    NEVER PLAYED (${never.length}): ${never.slice(0, 26).join(', ')}${never.length > 26 ? ' …' : ''}`)

console.log('\n  MOST PLAYED (share of all plays):')
Object.entries(useCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([c, n]) => {
  console.log(`    ${c.padEnd(18)} ${bar(n, Math.max(...Object.values(useCount)))} ${String(n).padStart(4)}  ${pct(n, allPlays.length)}`)
})

// balance signal: damage per strike vs band ATK. A card set that lets you deal
// 100x your band's ATK in one strike is where the multiplier stacking lives.
if (allResults.length) {
  console.log('\n  DAMAGE AMPLIFICATION (dmg dealt ÷ band ATK) — how hard multipliers stack:')
  const ratios = allResults.filter(r => typeof r.ratio === 'number' && r.ratio > 0).map(r => r.ratio).sort((a, b) => a - b)
  if (ratios.length) {
    const q = p => ratios[Math.min(ratios.length - 1, Math.floor(ratios.length * p))]
    console.log(`    median ×${q(0.5)}   p90 ×${q(0.9)}   max ×${ratios[ratios.length - 1]}   (n=${ratios.length} strikes)`)
    if (q(0.9) > 25) console.log('    ⚠ p90 above ×25 — multiplier stacking is doing far more work than the band. Cap stacking, not HP.')
  }
  const overkill = allResults.filter(r => r.hpAfter === 'gone' && r.bandAtk > 0 && r.dmg / r.bandAtk > 200)
  if (overkill.length) console.log(`    ⚠ ${overkill.length} kills where damage exceeded 200× band ATK — verify these are real, not races.`)
}

// INTEGRITY — the check that would have caught the Aug 3 phantom victory
console.log('\n  ⚖ INTEGRITY CHECKS (does this data describe a REAL run?):')
let flags = 0
const suspicious = allResults.filter(r => r.hpAfter === 'gone' && r.bandAtk > 0 && r.hpBefore / r.bandAtk > 500)
if (suspicious.length) { flags++; console.log(`    ✗ ${suspicious.length} kill(s) where the boss had >500× the band's ATK in HP — almost certainly a phantom victory.`); suspicious.slice(0, 4).forEach(r => console.log(`        fight ${r.fightIndex}: boss ${r.hpBefore} HP vs band ATK ${r.bandAtk}`)) }
const consoles = rows.filter(r => r.ev === 'game_console' && /VICTORY-BLOCKED/.test(String(r.line)))
if (consoles.length) console.log(`    ℹ ${consoles.length} victory attempt(s) BLOCKED by the mid-transition guard (this is the fix working).`)
const crashes = rows.filter(r => ['uncaught_exception', 'unhandled_rejection', 'game_pageerror'].includes(r.ev))
if (crashes.length) { flags++; console.log(`    ✗ ${crashes.length} crash event(s)`) } else console.log('    ✓ no crashes')
const stalls = rows.filter(r => ['STALL_RESTART', 'HARD_WATCHDOG', 'ACTION_STALL', 'HARD_EXIT'].includes(r.ev))
console.log(`    ${stalls.length ? 'ℹ' : '✓'} ${stalls.length} watchdog event(s)` + (stalls.length ? ' (recovered — runs continued)' : ''))
const unknown = rows.filter(r => r.ev === 'unknown_screen').length
console.log(`    ${unknown > 20 ? '✗' : '✓'} ${unknown} unknown screens`)
if (!flags) console.log('    ✓ DATA LOOKS TRUSTWORTHY')

// ══════════════════════════════════════════════════════════════════════
// BALANCE ANALYTICS — the reason these playtests exist. Answers, per card /
// member / combo: is it dead content, is it fine, or is it too strong?
// ══════════════════════════════════════════════════════════════════════
// Card power is measured by DAMAGE AMPLIFICATION: for every strike we know which
// cards were played into it (strike.cards) and what it actually dealt relative to
// the band's raw ATK (strike_result.ratio). A card that consistently appears in
// high-ratio strikes is carrying; one that never moves the ratio is filler.
const strikeByKey = {}
allStrikes.forEach(st => { strikeByKey[st.fightIndex + '|' + st.bossHp] = st })
const cardRatios = {}
allResults.forEach(res => {
  const st = strikeByKey[res.fightIndex + '|' + res.hpBefore]
  if (!st || !Array.isArray(st.cards) || typeof res.ratio !== 'number') return
  st.cards.forEach(cid => { (cardRatios[cid] = cardRatios[cid] || []).push(res.ratio) })
})
const allRatioVals = allResults.filter(r => typeof r.ratio === 'number').map(r => r.ratio)
const baseline = allRatioVals.length ? allRatioVals.reduce((a, b) => a + b, 0) / allRatioVals.length : 0
const avg = a => a.reduce((x, y) => x + y, 0) / a.length

console.log('\n── ⚔ CARD BALANCE ' + '─'.repeat(77))
if (!POOL) console.log('  (carddata.json missing — cannot compute pool coverage)')
const verdicts = []
POOL_IDS.forEach(id => {
  const plays = useCount[id] || 0
  const rs = cardRatios[id] || []
  const amp = rs.length ? avg(rs) : null
  let verdict, note
  if (plays === 0) { verdict = 'DEAD'; note = 'never played in any run' }
  else if (plays <= 2) { verdict = 'RARE'; note = 'barely seen — needs more runs or is unreachable' }
  else if (amp === null) { verdict = 'UNMEASURED'; note = 'played but never in a measured strike' }
  else if (baseline > 0 && amp > baseline * 2.0) { verdict = 'OVERPOWERED?'; note = `strikes avg x${amp.toFixed(1)} vs baseline x${baseline.toFixed(1)}` }
  else if (baseline > 0 && amp < baseline * 0.5) { verdict = 'WEAK?'; note = `strikes avg x${amp.toFixed(1)} vs baseline x${baseline.toFixed(1)}` }
  else { verdict = 'OK'; note = `x${(amp || 0).toFixed(1)} amp, ${plays} plays` }
  verdicts.push({ id, plays, amp, verdict, note })
})
const group = v => verdicts.filter(x => x.verdict === v)
;['OVERPOWERED?', 'WEAK?', 'DEAD', 'RARE'].forEach(v => {
  const g = group(v)
  if (!g.length) return
  console.log(`\n  ${v} (${g.length}):`)
  g.sort((a, b) => (b.amp || 0) - (a.amp || 0)).slice(0, 30).forEach(x =>
    console.log(`    ${x.id.padEnd(18)} ${String(x.plays).padStart(4)} plays   ${x.note}`))
})
console.log(`\n  OK: ${group('OK').length} cards behaving normally  ·  baseline amplification x${baseline.toFixed(1)}`)
console.log('  NOTE: verdicts need volume. Under ~50 runs treat DEAD/RARE as "not yet seen", not "bad".')

// ── BAND MEMBERS: offered vs picked ───────────────────────────────────
console.log('\n── 🎸 BAND MEMBER BALANCE ' + '─'.repeat(70))
const offered = {}, picked = {}
rows.forEach(d => {
  if (d.ev === 'recruit_options' || d.ev === 'draft_options') {
    (d.offered || []).forEach(o => { if (o && o.name) offered[o.name] = (offered[o.name] || 0) + 1 })
    if (d.picked) picked[d.picked] = (picked[d.picked] || 0) + 1
  }
  if (d.ev === 'draft_click' && d.name) picked[d.name] = (picked[d.name] || 0) + 1
})
const names = [...new Set([...Object.keys(offered), ...Object.keys(picked)])]
if (!names.length) console.log('  (no draft/recruit option data yet — this needs a fresh run on the current build)')
else {
  console.log('    member          offered  picked  pick-rate   verdict')
  names.map(n => ({ n, o: offered[n] || 0, p: picked[n] || 0 }))
    .sort((a, b) => (b.p / Math.max(1, b.o)) - (a.p / Math.max(1, a.o)))
    .forEach(m => {
      const rate = m.o ? m.p / m.o : 0
      const v = m.o === 0 ? 'NEVER OFFERED' : m.p === 0 ? '⚠ ALWAYS SKIPPED' : rate > 0.75 ? '⚠ ALWAYS TAKEN' : 'ok'
      console.log(`    ${m.n.padEnd(15)} ${String(m.o).padStart(6)}  ${String(m.p).padStart(6)}  ${pct(m.p, m.o).padStart(8)}   ${v}`)
    })
  console.log('  ⚠ ALWAYS SKIPPED = dead roster slot (buff it). ⚠ ALWAYS TAKEN = auto-include (nerf or diversify).')
}

// ── COMBOS / RIFF CHAINS ──────────────────────────────────────────────
console.log('\n── ⛓ COMBO / RIFF-CHAIN BALANCE ' + '─'.repeat(64))
const chainFires = {}
rows.forEach(d => { if (d.ev === 'chain_fired' && d.chain) chainFires[d.chain] = (chainFires[d.chain] || 0) + 1 })
let CHAINS = []
try { CHAINS = (require('./carddata.json').chains || []).map(c => Array.isArray(c) ? c.join('+') : String(c)) } catch (e) {}
const totalFires = Object.values(chainFires).reduce((a, b) => a + b, 0)
if (!totalFires) console.log('  no chains fired yet — needs more runs')
else {
  console.log(`    ${totalFires} chain fires across ${runs.length} runs (${(totalFires / Math.max(1, runs.length)).toFixed(1)} per run)`)
  Object.entries(chainFires).sort((a, b) => b[1] - a[1]).forEach(([c, n]) =>
    console.log(`    ${c.padEnd(30)} ${String(n).padStart(4)}  ${pct(n, totalFires)}`))
}
const neverFired = CHAINS.filter(c => !chainFires[c])
if (neverFired.length) console.log(`    ⚠ NEVER FIRED (${neverFired.length}/${CHAINS.length}): ${neverFired.slice(0, 12).join(', ')}${neverFired.length > 12 ? ' …' : ''}`)

// what to tune
console.log('\n  🎛 TUNING SIGNALS:')
const relicRuns = runs.filter(r => r.relics.length + r.pedals.length > 0).length
console.log(`    relics/pedals acquired in ${relicRuns}/${runs.length} runs (${pct(relicRuns, runs.length)})`)
const avgDeep = runs.filter(r => r.deepest >= 0).reduce((a, r) => a + r.deepest, 0) / Math.max(1, runs.filter(r => r.deepest >= 0).length)
console.log(`    average run depth: fight ${avgDeep.toFixed(1)} of 26 (circle ${CIRCLE(Math.round(avgDeep))})`)
const avgStrikes = allStrikes.length / Math.max(1, runs.length)
console.log(`    average strikes per run: ${avgStrikes.toFixed(1)}`)
if (distinct && POOL && distinct / POOL < 0.6) console.log(`    ⚠ only ${pct(distinct, POOL)} of the card pool is being played — the rest is untested content.`)
console.log('\n' + '='.repeat(96) + '\n')
