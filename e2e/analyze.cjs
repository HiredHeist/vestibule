// e2e/analyze.cjs — turn a raw ledger into a readable playtest report.
//   node e2e\analyze.cjs                      (analyses e2e/session3-events.jsonl)
//   node e2e\analyze.cjs path\to\ledger.jsonl
//   node e2e\analyze.cjs --since 2026-08-03   (only runs on/after a date)
//
// Prints: one line per run, then a compiled report across all runs — card usage %,
// win/loss by circle, difficulty wall, over/under-powered cards, and an INTEGRITY
// section that flags impossible kills (the phantom-victory class of bug).
//
// ── Aug 4 2026 AUDIT REWRITE ──────────────────────────────────────────
// The previous version reported numbers that were confidently wrong, which is
// worse than reporting nothing: killing blows were folded into the damage
// percentiles (a kill logs hpAfter:0, so "damage" was the boss's whole remaining
// HP — p90 ×36 instead of ×12), strike↔result joins collided across runs, DEAD
// was computed against all 84 cards instead of the ~36 in the run's deck, runs
// fused because "play again" emitted no run_start, and "DATA LOOKS TRUSTWORTHY"
// only ever checked for crashes. Every one of those is fixed below and every
// verdict now prints its own sample size.
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const sinceIdx = args.indexOf('--since')
const SINCE = sinceIdx !== -1 ? args[sinceIdx + 1] : null
const FILE = args.find(a => !a.startsWith('--') && a !== SINCE) || path.join(__dirname, 'session3-events.jsonl')

if (!fs.existsSync(FILE)) { console.error('no ledger at ' + FILE); process.exit(1) }

const ALL = args.includes('--all')
let rows = []
for (const line of fs.readFileSync(FILE, 'utf8').split('\n')) {
  if (!line.trim()) continue
  try { const d = JSON.parse(line); if (!SINCE || d.ts >= SINCE) rows.push(d) } catch (e) {}
}
if (!rows.length) { console.error('no events' + (SINCE ? ' since ' + SINCE : '')); process.exit(1) }
const TOTAL_IN_RANGE = rows.length

// ── SCOPE ─────────────────────────────────────────────────────────────
// The ledger is append-only across every session ever run, so a plain report
// mixed 5 days of KNOWN-BROKEN builds into the totals. Default to the newest
// build hash; --all overrides.
// Aug 4 FIX: --since used to DISABLE build scoping *and* suppress the SCOPE line
// entirely, so the report silently became all-time. Same silent fallback fired
// when the newest build had <=20 events. Build scoping now runs under --since
// too, and the SCOPE line is printed unconditionally — including the fallback.
let BUILD = null, SCOPE = ''
if (ALL) {
  SCOPE = 'ALL sessions, including known-broken older builds — totals are NOT comparable'
} else {
  for (let i = rows.length - 1; i >= 0; i--) { const d = rows[i]; if (d.ev === 'session' && d.build) { BUILD = d.build; break } }
  if (!BUILD) SCOPE = 'no session/build marker in range — falling back to EVERY session in range (totals NOT comparable)'
  else {
    let keep = false; const filtered = []
    for (const d of rows) { if (d.ev === 'session' && d.build) keep = (d.build === BUILD); if (keep) filtered.push(d) }
    if (filtered.length > 20) { rows = filtered; SCOPE = 'current build only — ' + BUILD.slice(0, 52) }
    else { SCOPE = 'FALLBACK: newest build ' + BUILD.slice(0, 30) + ' has only ' + filtered.length + ' events (<=20) — reporting EVERY session in range (totals NOT comparable)'; BUILD = null }
  }
}
let DIRTY = false
try { DIRTY = require('child_process').execSync('git -C ' + JSON.stringify(path.join(__dirname, '..')) + ' status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().length > 0 } catch (e) {}
if (DIRTY) SCOPE += '   [working tree -dirty at analysis time]'
if (SINCE) SCOPE += '   [--since ' + SINCE + ': ' + TOTAL_IN_RANGE.toLocaleString() + ' events in range, build scoping STILL APPLIED]'

const pct = (n, d) => d ? (100 * n / d).toFixed(0) + '%' : '—'
const bar = (v, max, w = 18) => '█'.repeat(Math.max(0, Math.round(w * v / (max || 1)))).padEnd(w)
const CIRCLE = fi => Math.floor(fi / 3) + 1
const TOTAL_FIGHTS = 27               // fight indices are 0..26
const num = a => a.filter(x => typeof x === 'number' && isFinite(x))
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const qtl = (sorted, p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null
const f1 = v => v === null ? '—' : (Math.round(v * 10) / 10).toFixed(1)

// ── card / deck knowledge ─────────────────────────────────────────────
let CD = { cards: [], chains: [], chainMeta: [], musicians: [], decks: {} }
try { CD = Object.assign(CD, require('./carddata.json')) } catch (e) {}
const CARD_BY_ID = {}; CD.cards.forEach(c => { CARD_BY_ID[c.id] = c })
const POOL_IDS = CD.cards.map(c => c.id)
const CHAIN_META = (CD.chainMeta && CD.chainMeta.length)
  ? CD.chainMeta
  : (CD.chains || []).map(c => ({ id: c.join('+'), name: c.join('+').toUpperCase(), cards: c }))
const CHAIN_KEY = ch => ch.cards.join('+')

// ── slice into runs ───────────────────────────────────────────────────
// Aug 4 FIX: runs used to be sliced on `run_start` only. death -> "play again"
// emitted no run_start, so consecutive runs FUSED — 58 run_end events collapsed
// into 17 reported runs and the win rate read 18% instead of the true 5%. Runs
// now also close on run_end / run_summary, and run_summary (which the bot never
// once emitted before today) is preferred over reconstruction wherever present.
const runs = []
let cur = null
const newRun = ts => ({
  start: ts, lastTs: ts, endTs: null, plays: [], strikes: [], results: [], summary: null,
  fails: 0, deepest: -1, trips: 0, digs: 0, chains: 0, relics: [], pedals: [],
  outcome: '?', deck: null, _pendingClose: false
})
const closeRun = () => { if (cur && (cur.plays.length || cur.strikes.length || cur.summary)) runs.push(cur); cur = null }
for (const d of rows) {
  const k = d.ev
  if (cur && cur._pendingClose) {
    // autopilot emits run_end immediately followed by run_summary — let the
    // summary land on the run it describes before closing it.
    if (k === 'run_summary') { cur.summary = d; cur.outcome = d.outcome || cur.outcome; cur.endTs = d.ts; closeRun(); continue }
    closeRun()
  }
  if (k === 'run_start' || (k === 'session' && /v2 start/.test(String(d.msg)))) { closeRun(); cur = newRun(d.ts); continue }
  if (!cur) cur = newRun(d.ts)
  cur.lastTs = d.ts
  if (k === 'play') cur.plays.push(d)
  else if (k === 'play_fail') cur.fails++
  else if (k === 'run_deck') cur.deck = d.deck
  else if (k === 'strike') {
    cur.strikes.push(d)
    // transition-tagged strikes read the circle numeral mid fight-to-fight swap,
    // which inflated depth by a full circle (f8 -> f11 -> f14 -> f17). Not depth.
    if (!d.transition && typeof d.fightIndex === 'number' && d.fightIndex > cur.deepest) cur.deepest = d.fightIndex
  } else if (k === 'strike_result') cur.results.push(d)
  else if (k === 'trip_used') cur.trips++
  else if (k === 'discard_dig') cur.digs++
  else if (k === 'chain_confirmed' || k === 'chain_fired') cur.chains++
  else if (k === 'shop_buy') { const l = String(d.label || ''); if (/^artifact:/.test(l)) cur.relics.push(l.slice(9, 30)); else if (/^effect pedal:/.test(l)) cur.pedals.push(l.slice(13, 34)) }
  else if (k === 'run_summary') { cur.summary = d; cur.outcome = d.outcome || cur.outcome; cur.endTs = d.ts; closeRun() }
  else if (k === 'run_end') { cur.outcome = d.result || cur.outcome; cur.endTs = d.ts; cur._pendingClose = true }
}
closeRun()

const runEnds = rows.filter(r => r.ev === 'run_end').length
const runSummaries = rows.filter(r => r.ev === 'run_summary').length

console.log('\n' + '='.repeat(96))
console.log(' VESTIBULE PLAYTEST REPORT   ' + path.basename(FILE) + '   ' + rows.length.toLocaleString() + ' events   ' + runs.length + ' runs')
console.log(' SCOPE: ' + SCOPE)
console.log(' ' + rows[0].ts.replace('T', ' ').slice(0, 19) + '  ->  ' + rows[rows.length - 1].ts.replace('T', ' ').slice(0, 19))
console.log('='.repeat(96))

// ── which deck(s) were played ─────────────────────────────────────────
// Every verdict below ("DEAD", "chain never fired") is only meaningful against
// the cards the run could actually draw. A run's starter deck holds ~36-48 of
// the 86 known ids; the rest are shop-only, copies:0, or unlock-gated.
const DECK_DEFAULT = 'standard'   // App.jsx: localStorage 'vst_active_deck' || 'standard'; the bot never changes it
const decksSeen = [...new Set(runs.map(r => r.deck).filter(Boolean))]
const DECK_RECORDED = decksSeen.length > 0
const DECKS_USED = DECK_RECORDED ? decksSeen : [DECK_DEFAULT]
const deckPool = {}   // id -> copies, unioned over every deck actually played
DECKS_USED.forEach(id => { const m = (CD.decks || {})[id] || {}; for (const [cid, n] of Object.entries(m)) deckPool[cid] = Math.max(deckPool[cid] || 0, n) })
// corruption-threshold gifts land in hand in EVERY run regardless of deck
CD.cards.forEach(c => { if (c.source === 'corruption_gift') deckPool[c.id] = deckPool[c.id] || 1 })
// Standard runs getUnlockedCards(), so its `locked` cards (moshpit @1000,
// bloodritual @10000 lifetime score) are in the deck only once unlocked. Decide
// from the recorded lifetime score; where the ledger predates run_deck, fall back
// to evidence — a card that was actually played was obviously unlocked.
const LIFETIME = Math.max(0, ...rows.filter(d => d.ev === 'run_deck').map(d => +d.lifetimeScore || 0))
const LIFETIME_KNOWN = rows.some(d => d.ev === 'run_deck' && d.lifetimeScore != null)
const gateNote = {}
DECKS_USED.forEach(dk => {
  const g = (CD.deckUnlockGated || {})[dk] || {}
  for (const [cid, info] of Object.entries(g)) {
    const unlocked = LIFETIME_KNOWN ? LIFETIME >= info.unlockAt : !!rows.some(d => d.ev === 'play' && d.card === cid)
    if (unlocked) deckPool[cid] = Math.max(deckPool[cid] || 0, info.copies)
    else gateNote[cid] = 'locked (unlock at ' + info.unlockAt + ' lifetime score; ' + (LIFETIME_KNOWN ? 'run had ' + LIFETIME : 'never played, and the ledger records no lifetime score') + ')'
  }
})
const IN_DECK = id => !!deckPool[id]
const whyNotInDeck = id => {
  if (gateNote[id]) return gateNote[id]
  const c = CARD_BY_ID[id]
  if (!c) return 'unknown id'
  if (c.locked) return 'locked (unlock at ' + c.unlockAt + ' lifetime score)'
  if (c.shopOnly) return 'shop-only'
  if (c.source === 'event_reward') return 'event reward, never in a deck'
  if (c.copies === 0) return 'copies:0 — other decks / packs only'
  return 'not in this deck manifest'
}
const DECK_SIZE = Object.values(deckPool).reduce((a, b) => a + b, 0)
console.log('\n DECK SCOPE: ' + DECKS_USED.join(' + ') +
  (DECK_RECORDED ? '' : '  (NOT RECORDED in ledger — assuming the bot default; emit run_deck to remove this guess)') +
  '   ' + Object.keys(deckPool).length + ' distinct ids / ' + DECK_SIZE + ' cards, of ' + POOL_IDS.length + ' ids known to the game')

// ── per-run lines ─────────────────────────────────────────────────────
console.log('\n── RUN BY RUN ' + '─'.repeat(81))
console.log('  #   outcome        mins  deepest        strikes plays fail%  chains trips relic/ped  peakATK')
const runMinutes = r => {
  if (r.summary && typeof r.summary.minutes === 'number') return r.summary.minutes
  // Aug 4 FIX: was lastStrike-minus-start, which threw away everything after the
  // final strike (shop, death screen, the whole tail of the run).
  return (new Date(r.endTs || r.lastTs) - new Date(r.start)) / 60000
}
// a strike is only measurable if the boss HP behind it is real
const realStrikes = r => r.strikes.filter(s => typeof s.bossHp === 'number' && s.bossHp > 0 && !s.transition)
runs.forEach((r, i) => {
  const mins = runMinutes(r).toFixed(1)
  const atk = Math.max(0, ...r.strikes.map(s => (typeof s.bandAtkBase === 'number' ? s.bandAtkBase : s.bandAtk) || 0))
  const deep = r.deepest >= 0 ? `f${r.deepest} (C${CIRCLE(r.deepest)})` : '—'
  const fr = pct(r.fails, r.plays.length + r.fails)
  console.log(
    '  ' + String(i + 1).padStart(2) + '  ' + String(r.outcome).padEnd(14) + String(mins).padStart(5) +
    '  ' + deep.padEnd(13) + String(realStrikes(r).length).padStart(6) + String(r.plays.length).padStart(6) +
    String(fr).padStart(6) + String(r.chains).padStart(7) + String(r.trips).padStart(6) +
    ('  ' + r.relics.length + '/' + r.pedals.length).padEnd(11) + String(atk).padStart(8)
  )
})

// ── compiled ──────────────────────────────────────────────────────────
const allPlays = runs.flatMap(r => r.plays)
const allStrikes = runs.flatMap(r => r.strikes)
const allResults = runs.flatMap(r => r.results)
const allRealStrikes = runs.flatMap(realStrikes)
console.log('\n── COMPILED ACROSS ALL RUNS ' + '─'.repeat(68))
const wins = runs.filter(r => /VICTORY/i.test(r.outcome)).length
const deaths = runs.filter(r => /death/i.test(r.outcome)).length
const aband = runs.filter(r => /abandon|stall/i.test(r.outcome)).length
const unk = runs.length - wins - deaths - aband
console.log(`  runs ${runs.length}   wins ${wins} (${pct(wins, runs.length)})   deaths ${deaths}   abandoned ${aband}   unresolved ${unk}`)
console.log(`  terminal events in range: ${runEnds} run_end, ${runSummaries} run_summary` +
  (runEnds > runs.length ? `   ⚠ ${runEnds} run_end but only ${runs.length} runs sliced — some runs still fusing` : ''))
console.log(`  total: ${allPlays.length} cards played, ${allRealStrikes.length} measurable strikes (${allStrikes.length} strike events), ${runs.reduce((a, r) => a + r.fails, 0)} play-fails (${pct(runs.reduce((a, r) => a + r.fails, 0), allPlays.length + runs.reduce((a, r) => a + r.fails, 0))})`)

// deaths by circle = the difficulty curve
console.log('\n  DIFFICULTY WALL — where runs end:')
const byCircle = {}
runs.forEach(r => { if (r.deepest >= 0) byCircle[CIRCLE(r.deepest)] = (byCircle[CIRCLE(r.deepest)] || 0) + 1 })
const maxC = Math.max(1, ...Object.values(byCircle))
Object.keys(byCircle).map(Number).sort((a, b) => a - b).forEach(c => {
  console.log(`    Circle ${c}  ${bar(byCircle[c], maxC)} ${byCircle[c]} runs (${pct(byCircle[c], runs.length)})`)
})

// card usage — what % of the DECK is even seeing play
const useCount = {}
allPlays.forEach(p => { useCount[p.card] = (useCount[p.card] || 0) + 1 })
const deckIds = Object.keys(deckPool)
const distinctInDeck = deckIds.filter(id => useCount[id]).length
const distinctAll = Object.keys(useCount).length
console.log(`\n  DECK COVERAGE: ${distinctInDeck}/${deckIds.length} deck cards ever played (${pct(distinctInDeck, deckIds.length)})   ·   ${distinctAll} distinct ids played overall`)
const neverInDeck = deckIds.filter(id => !useCount[id])
if (neverInDeck.length) console.log(`    IN DECK, NEVER PLAYED (${neverInDeck.length}): ${neverInDeck.slice(0, 26).join(', ')}${neverInDeck.length > 26 ? ' …' : ''}`)
const playedOutOfDeck = Object.keys(useCount).filter(id => !IN_DECK(id))
if (playedOutOfDeck.length) console.log(`    played but NOT in the deck manifest (shop/pack/forge/gift acquisitions): ${playedOutOfDeck.join(', ')}`)

console.log('\n  MOST PLAYED (share of all plays):')
Object.entries(useCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([c, n]) => {
  console.log(`    ${c.padEnd(18)} ${bar(n, Math.max(...Object.values(useCount)))} ${String(n).padStart(4)}  ${pct(n, allPlays.length)}`)
})

// ══════════════════════════════════════════════════════════════════════
// STRIKE ↔ RESULT JOIN
// Aug 4 FIX: the join key used to be `fightIndex|bossHp`, which collides across
// runs (43 of 111 keys in the Aug-4 ledger; `0|84` appeared three times with
// three different card lists). Autopilot now stamps a monotonic strikeId on
// strike / strike_result / strike_recon. Legacy rows fall back to the old key
// ONLY where that key is unique — ambiguous ones are dropped, and counted.
// ══════════════════════════════════════════════════════════════════════
const byId = {}, legacyKey = {}, legacyDup = new Set()
allStrikes.forEach(st => {
  if (st.strikeId) { byId[st.strikeId] = st; return }
  const k = st.fightIndex + '|' + st.bossHp
  if (legacyKey[k]) legacyDup.add(k); else legacyKey[k] = st
})
const reconById = {}
rows.forEach(d => { if (d.ev === 'strike_recon' && d.strikeId) reconById[d.strikeId] = d })
let joinDropped = 0
const strikeFor = res => {
  if (res.strikeId) return byId[res.strikeId] || null
  const k = res.fightIndex + '|' + res.hpBefore
  if (legacyDup.has(k)) { joinDropped++; return null }
  return legacyKey[k] || null
}

// ── AMPLIFICATION SAMPLE ──────────────────────────────────────────────
// Aug 4 FIX (the big one). A killing blow logs hpAfter:0, so "damage dealt" was
// the boss's ENTIRE remaining HP and the ratio measured overkill, not output.
// Lethal strikes dominated every percentile (p90 ×36.1 vs ×12.4 without them).
// They are now a SEPARATE, explicitly-lower-bound sample.
// Denominator is bandAtkBase (base ATK group only) — bandAtk included this-strike
// temp buffs and swung 455 -> 822 -> 295 -> 161 across consecutive fights.
const SAMPLE = []
let droppedNoAtk = 0, droppedNoJoin = 0
allResults.forEach(res => {
  const st = strikeFor(res)
  if (!st) droppedNoJoin++
  const rec = res.strikeId ? reconById[res.strikeId] : null
  const denom = typeof res.bandAtkBase === 'number' ? res.bandAtkBase
    : typeof (st && st.bandAtkBase) === 'number' ? st.bandAtkBase
      : typeof res.bandAtk === 'number' ? res.bandAtk : null
  if (denom === null || denom <= 1) { droppedNoAtk++; return }   // the {atk:1},{atk:0} member-parse fallback
  const lethal = res.hpAfter === 0 || res.hpAfter === 'gone'
  // damage, best source first:
  //   recon   hpBefore(N) - hpBefore(N+1), immune to the cascade animation
  //   settled polled until two equal reads
  //   raw     the old single sample at +1800ms (understates by ×1.77-×2.01)
  let dmg = null, src = 'raw'
  if (rec && typeof rec.dmg === 'number') { dmg = rec.dmg; src = 'recon' }
  else if (typeof res.hpAfterSettled === 'number' && typeof res.hpBefore === 'number') { dmg = res.hpBefore - res.hpAfterSettled; src = 'settled' }
  else if (typeof res.dmg === 'number') { dmg = res.dmg; src = 'raw' }
  if (dmg === null || !(dmg > 0)) return
  SAMPLE.push({ res, st, denom, lethal, dmg, src, ratio: dmg / denom, cards: (st && Array.isArray(st.cards)) ? st.cards : [] })
})
const NONLETHAL = SAMPLE.filter(x => !x.lethal)
const LETHAL = SAMPLE.filter(x => x.lethal)
const nlRatios = NONLETHAL.map(x => x.ratio).sort((a, b) => a - b)
const lethalRatios = LETHAL.map(x => x.ratio).sort((a, b) => a - b)
const srcMix = SAMPLE.reduce((m, x) => (m[x.src] = (m[x.src] || 0) + 1, m), {})

console.log('\n  DAMAGE AMPLIFICATION (dmg dealt ÷ band BASE ATK) — how hard multipliers stack:')
if (!SAMPLE.length) console.log('    (no usable strike_result rows — need bandAtkBase > 1 and a positive damage read)')
else {
  if (nlRatios.length) {
    console.log(`    NON-LETHAL strikes (the real amplification signal):`)
    console.log(`      median ×${f1(qtl(nlRatios, 0.5))}   p90 ×${f1(qtl(nlRatios, 0.9))}   max ×${f1(nlRatios[nlRatios.length - 1])}   (n=${nlRatios.length})`)
  } else console.log('    NON-LETHAL strikes: n=0 — nothing to percentile')
  if (lethalRatios.length) {
    console.log(`    LETHAL strikes: ${lethalRatios.length} killing blows, amplification >= ×${f1(qtl(lethalRatios, 0.5))} median / >= ×${f1(lethalRatios[lethalRatios.length - 1])} max`)
    console.log(`      (LOWER BOUND ONLY — overkill is unobservable: a kill logs hpAfter 0, so "damage" is capped at the boss's remaining HP)`)
  }
  const p90 = qtl(nlRatios, 0.9)
  if (nlRatios.length >= 30 && p90 > 25) console.log('    ⚠ non-lethal p90 above ×25 (n=' + nlRatios.length + ') — multiplier stacking is doing far more work than the band. Cap stacking, not HP.')
  else if (p90 !== null && p90 > 25) console.log('    · non-lethal p90 is ×' + f1(p90) + ' but n=' + nlRatios.length + ' (<30) — NOT calling cap-stacking on that sample.')
  console.log(`    damage source mix: ${Object.entries(srcMix).map(([k, v]) => k + '=' + v).join(' ')}   dropped: ${droppedNoAtk} bandAtkBase<=1, ${joinDropped} ambiguous legacy joins`)
}

// ══════════════════════════════════════════════════════════════════════
// INTEGRITY — an explicit checklist with sample sizes, not a bare verdict.
// Aug 4 FIX: "DATA LOOKS TRUSTWORTHY" used to require only zero crashes. The
// 9,701-unknown-screen check printed an X and never incremented flags; stalls,
// parse_miss, strike_skipped, no_play, warn and 1,244 error events were never
// inspected at all; and the phantom-victory detector required hpAfter==='gone'
// while real kills log hpAfter:0, so it was structurally dead code.
// ══════════════════════════════════════════════════════════════════════
console.log('\n  ⚖ INTEGRITY CHECKS (does this data describe a REAL run?):')
let flags = 0
const count = ev => rows.filter(r => r.ev === ev).length
const line = (bad, txt) => { if (bad) flags++; console.log('    ' + (bad ? '✗' : '✓') + ' ' + txt) }

// phantom victory: a kill logs hpAfter 0 (NOT 'gone'), so match both.
const phantom = allResults.filter(r => {
  const atk = typeof r.bandAtkBase === 'number' ? r.bandAtkBase : r.bandAtk
  return (r.hpAfter === 0 || r.hpAfter === 'gone') && r.hpBefore > 0 && atk > 0 && r.hpBefore / atk > 60
})
line(phantom.length > 0, `${phantom.length} kill(s) with boss HP > 60× band base ATK  (of ${allResults.length} strike_result rows)` + (phantom.length ? ' — verify these are not phantom victories' : ''))
phantom.slice(0, 4).forEach(r => console.log(`        fight ${r.fightIndex}: boss ${r.hpBefore} HP vs band base ATK ${r.bandAtkBase != null ? r.bandAtkBase : r.bandAtk}`))

const crashes = rows.filter(r => ['uncaught_exception', 'unhandled_rejection', 'game_pageerror'].includes(r.ev))
line(crashes.length > 0, `${crashes.length} crash event(s) (uncaught_exception / unhandled_rejection / game_pageerror)`)

const stallEvs = rows.filter(r => ['STALL_RESTART', 'HARD_WATCHDOG', 'ACTION_STALL', 'HARD_EXIT'].includes(r.ev))
const hardStalls = rows.filter(r => ['ACTION_STALL', 'HARD_EXIT'].includes(r.ev)).length
line(hardStalls > 0, `${stallEvs.length} watchdog event(s) — ${hardStalls} of them ACTION_STALL/HARD_EXIT (the bot was NOT playing)`)

const unknown = count('unknown_screen')
line(unknown > 20, `${unknown} unknown screens (threshold >20 = the bot is lost)`)

const parseMiss = count('parse_miss')
line(parseMiss > 0, `${parseMiss} parse_miss event(s) — a perception field the bot could not read`)

const skipped = count('strike_skipped')
line(skipped > 0, `${skipped} strike_skipped event(s) — strikes fired with no measurable boss HP`)

const badStrikes = allStrikes.filter(s => s.bossHp === null || s.bossHp === 0 ||
  ((typeof s.bandAtkBase === 'number' ? s.bandAtkBase : s.bandAtk) <= 1) || s.membersParsed === false).length
line(allStrikes.length > 0 && badStrikes / allStrikes.length > 0.05,
  `${badStrikes}/${allStrikes.length} strikes (${pct(badStrikes, allStrikes.length)}) have bossHp null/0 or band base ATK <= 1 (threshold >5%)`)

const errs = count('error'), warns = count('warn'), noPlay = count('no_play'), unmatched = count('card_unmatched')
console.log(`    ℹ noise counters: ${errs} error, ${warns} warn, ${noPlay} no_play, ${unmatched} card_unmatched, ${count('play_fail')} play_fail (${pct(count('play_fail'), count('play') + count('play_fail'))} of play attempts)`)
const blocked = rows.filter(r => r.ev === 'game_console' && /VICTORY-BLOCKED/.test(String(r.line)))
if (blocked.length) console.log(`    ℹ ${blocked.length} victory attempt(s) BLOCKED by the mid-transition guard (this is the fix working).`)
console.log(`    → ${flags} of 7 integrity checks FAILED.  ` + (flags ? 'Treat the numbers above as suspect until these are explained.' : 'All 7 checks passed on the sample sizes shown.'))

// ══════════════════════════════════════════════════════════════════════
// BALANCE ANALYTICS — per card / member / combo: dead, fine, or too strong?
// Card power = DAMAGE AMPLIFICATION over NON-LETHAL strikes only, with a MEDIAN
// baseline (the old MEAN was dragged around by the ×69.8 overkill artifacts) and
// hard minimum sample sizes on every verdict.
// ══════════════════════════════════════════════════════════════════════
const cardRatios = {}
NONLETHAL.forEach(x => { x.cards.forEach(cid => { (cardRatios[cid] = cardRatios[cid] || []).push(x.ratio) }) })
const baseline = med(nlRatios)

const MIN_PLAYS = 15, MIN_RATIOS = 10
console.log('\n── ⚔ CARD BALANCE ' + '─'.repeat(77))
if (!POOL_IDS.length) console.log('  (carddata.json missing — cannot compute pool coverage)')
console.log(`  method: median amplification over NON-LETHAL strikes only · baseline = median ×${f1(baseline)} (n=${nlRatios.length})`)
console.log(`  a verdict needs >=${MIN_PLAYS} plays AND >=${MIN_RATIOS} measured strikes; everything else is reported as unmeasured, not judged.`)
const verdicts = []
POOL_IDS.forEach(id => {
  const plays = useCount[id] || 0
  const rs = cardRatios[id] || []
  const amp = rs.length ? med(rs) : null
  let verdict, note
  if (!IN_DECK(id) && plays === 0) { verdict = 'NOT IN DECK'; note = whyNotInDeck(id) }
  else if (plays === 0) { verdict = 'DEAD'; note = `in the deck (${deckPool[id]} copies) and never played in any run` }
  else if (plays < MIN_PLAYS || rs.length < MIN_RATIOS) { verdict = 'UNMEASURED'; note = `${plays} plays, ${rs.length} measured strikes — below the ${MIN_PLAYS}/${MIN_RATIOS} verdict floor` }
  else if (baseline > 0 && amp > baseline * 2.0) { verdict = 'OVERPOWERED?'; note = `median ×${f1(amp)} vs baseline ×${f1(baseline)}  (n=${plays} plays / ${rs.length} strikes)` }
  else if (baseline > 0 && amp < baseline * 0.5) { verdict = 'WEAK?'; note = `median ×${f1(amp)} vs baseline ×${f1(baseline)}  (n=${plays} plays / ${rs.length} strikes)` }
  else { verdict = 'OK'; note = `×${f1(amp)} amp  (n=${plays} plays / ${rs.length} strikes)` }
  verdicts.push({ id, plays, amp, verdict, note })
})
const group = v => verdicts.filter(x => x.verdict === v)
;['OVERPOWERED?', 'WEAK?', 'DEAD', 'UNMEASURED'].forEach(v => {
  const g = group(v)
  if (!g.length) return
  console.log(`\n  ${v} (${g.length}):`)
  g.sort((a, b) => (b.amp || 0) - (a.amp || 0) || b.plays - a.plays).slice(0, 30).forEach(x =>
    console.log(`    ${x.id.padEnd(18)} ${String(x.plays).padStart(4)} plays   ${x.note}`))
  if (g.length > 30) console.log(`    … ${g.length - 30} more`)
})
const nid = group('NOT IN DECK')
if (nid.length) {
  console.log(`\n  NOT IN DECK (excluded, ${nid.length}) — these CANNOT be dead content for this deck:`)
  const byReason = {}
  nid.forEach(x => { (byReason[x.note] = byReason[x.note] || []).push(x.id) })
  Object.entries(byReason).sort((a, b) => b[1].length - a[1].length).forEach(([why, ids]) =>
    console.log(`    ${('(' + ids.length + ') ' + why).padEnd(46)} ${ids.slice(0, 12).join(', ')}${ids.length > 12 ? ' …' : ''}`))
}
console.log(`\n  OK: ${group('OK').length} cards behaving normally  ·  ${group('UNMEASURED').length} played but under the verdict floor`)
console.log('  NOTE: verdicts need volume. Under ~50 runs treat DEAD as "not yet seen", not "bad".')

// ── BAND MEMBERS: offered vs picked ───────────────────────────────────
// Aug 4 FIX: pick rates were unusable. draft_options fired only on attempt 0
// (2 events vs 63 draft_confirms), draft_click.name was populated on 4 of 129
// rows, recruit_options.picked was logged BEFORE the click so failed picks
// counted as picks, and the draft is pick-2-of-8 — so 25% is the arithmetic
// MAXIMUM while "ALWAYS TAKEN" triggered above 75%. Pick rate is now normalised
// by the expected rate (pickCount / offeredCount) and no verdict fires under 10
// offers. Every musician is listed so unseen ones read NEVER OFFERED.
console.log('\n── 🎸 BAND MEMBER BALANCE ' + '─'.repeat(70))
const offered = {}, picked = {}, expSum = {}
const bump = (o, k, v) => { o[k] = (o[k] || 0) + v }
rows.forEach(d => {
  if (d.ev === 'draft_options' || d.ev === 'recruit_options') {
    const list = (d.offered || []).filter(o => o && o.name)
    const pickCount = typeof d.pickCount === 'number' ? d.pickCount : (d.ev === 'recruit_options' ? 1 : 2)
    const expected = list.length ? Math.min(1, pickCount / list.length) : 0
    list.forEach(o => { bump(offered, o.name, 1); bump(expSum, o.name, expected) })
  }
  // CONFIRMED picks only. recruit_options.picked / draft_click fire BEFORE the
  // click lands, so they count intents; draft_result / recruit_pick are outcomes.
  if (d.ev === 'draft_result') (d.confirmed || []).forEach(n => { if (n) bump(picked, n, 1) })
  if (d.ev === 'recruit_confirmed' && d.name) bump(picked, d.name, 1)
})
// legacy ledgers have neither draft_result nor recruit_confirmed — fall back to
// the intent events, and SAY SO rather than silently mixing the two.
const CONFIRMED_AVAILABLE = rows.some(d => d.ev === 'draft_result' || d.ev === 'recruit_confirmed')
if (!CONFIRMED_AVAILABLE) {
  rows.forEach(d => {
    if (d.ev === 'recruit_options' && d.picked) bump(picked, d.picked, 1)
    if (d.ev === 'draft_click' && d.name) bump(picked, d.name, 1)
  })
}
const ROSTER = (CD.musicians || []).map(m => m.name)
const names = [...new Set([...ROSTER, ...Object.keys(offered), ...Object.keys(picked)])]
const MIN_OFFERS = 10
if (!names.length) console.log('  (no roster in carddata.json and no draft/recruit option data yet)')
else {
  if (!CONFIRMED_AVAILABLE) console.log('  ⚠ this ledger has no draft_result/recruit_confirmed rows — falling back to draft_click/recruit_options.picked, which are INTENTS logged before the click. Failed picks are counted as picks.')
  console.log(`  pick-rate is normalised: 1.00 = taken exactly as often as random choice would (draft is pick-2-of-N, so raw ~25% IS the ceiling).`)
  console.log(`  no verdict below ${MIN_OFFERS} offers.`)
  console.log('    member          offered  picked   raw    vs-random   verdict')
  names.map(n => ({ n, o: offered[n] || 0, p: picked[n] || 0, e: expSum[n] || 0 }))
    .sort((a, b) => (b.e ? b.p / b.e : -1) - (a.e ? a.p / a.e : -1))
    .forEach(m => {
      const rel = m.e > 0 ? m.p / m.e : null
      const v = m.o === 0 ? 'NEVER OFFERED'
        : m.o < MIN_OFFERS ? `(n=${m.o} — too few offers to judge)`
          : m.p === 0 ? '⚠ ALWAYS SKIPPED'
            : rel !== null && rel > 1.6 ? '⚠ AUTO-INCLUDE'
              : rel !== null && rel < 0.4 ? '⚠ RARELY TAKEN' : 'ok'
      console.log(`    ${m.n.padEnd(15)} ${String(m.o).padStart(6)}  ${String(m.p).padStart(6)}  ${pct(m.p, m.o).padStart(5)}   ${(rel === null ? '—' : '×' + f1(rel)).padStart(8)}   ${v}   n=${m.o}`)
    })
  console.log('  ⚠ ALWAYS SKIPPED = dead roster slot (buff it). ⚠ AUTO-INCLUDE = taken >1.6× random (nerf or diversify).')
}

// ── COMBOS / RIFF CHAINS ──────────────────────────────────────────────
// Aug 4 FIX: chains whose cards are not in the run's deck were reported as
// NEVER FIRED — darktuning+overdrive and sabbathsigil+overdrive need a shop-only
// card, bloodritual+wakeup needs a card locked behind 10,000 lifetime score. They
// are impossible, not underused. Also `chain_fired` was the BOT'S OWN inference;
// `chain_confirmed` is the game's own "⛧ RIFF CHAIN:" log line.
console.log('\n── ⛓ COMBO / RIFF-CHAIN BALANCE ' + '─'.repeat(64))
const chainFires = {}, chainSrc = {}
rows.forEach(d => {
  if (d.ev === 'chain_confirmed' && d.chain) { bump(chainFires, d.chain, 1); chainSrc.confirmed = (chainSrc.confirmed || 0) + 1 }
})
const anyConfirmed = !!chainSrc.confirmed
if (!anyConfirmed) rows.forEach(d => { if (d.ev === 'chain_fired' && d.chain) { bump(chainFires, d.chain, 1); chainSrc.inferred = (chainSrc.inferred || 0) + 1 } })
const totalFires = Object.values(chainFires).reduce((a, b) => a + b, 0)
console.log('  source: ' + (anyConfirmed ? "chain_confirmed (the game's own ⛧ RIFF CHAIN log line)" : "chain_fired — the BOT'S OWN INFERENCE, not the game's signal. Treat as approximate."))
if (!totalFires) console.log('  no chains fired yet — needs more runs')
else {
  console.log(`    ${totalFires} chain fires across ${runs.length} runs (${(totalFires / Math.max(1, runs.length)).toFixed(1)} per run)`)
  Object.entries(chainFires).sort((a, b) => b[1] - a[1]).forEach(([c, n]) =>
    console.log(`    ${c.padEnd(30)} ${String(n).padStart(4)}  ${pct(n, totalFires)}`))
}
const possible = [], impossible = []
CHAIN_META.forEach(ch => {
  const missing = ch.cards.filter(cid => !IN_DECK(cid))
  ;(missing.length ? impossible : possible).push({ ch, missing })
})
const neverFired = possible.filter(x => !chainFires[CHAIN_KEY(x.ch)])
if (neverFired.length) console.log(`    ⚠ NEVER FIRED but POSSIBLE (${neverFired.length}/${possible.length} in-deck chains): ${neverFired.map(x => CHAIN_KEY(x.ch)).slice(0, 12).join(', ')}${neverFired.length > 12 ? ' …' : ''}`)
if (impossible.length) {
  console.log(`    NOT AVAILABLE IN DECK (${impossible.length}/${CHAIN_META.length}) — cannot fire, do NOT read as underused:`)
  impossible.forEach(x => console.log(`      ${CHAIN_KEY(x.ch).padEnd(30)} missing: ${x.missing.map(m => m + ' (' + whyNotInDeck(m) + ')').join(', ')}`))
}

// what to tune
console.log('\n  🎛 TUNING SIGNALS:')
const relicRuns = runs.filter(r => r.relics.length + r.pedals.length > 0).length
console.log(`    relics/pedals acquired in ${relicRuns}/${runs.length} runs (${pct(relicRuns, runs.length)})`)
const deepRuns = runs.filter(r => r.deepest >= 0)
const avgDeep = deepRuns.reduce((a, r) => a + r.deepest, 0) / Math.max(1, deepRuns.length)
console.log(`    average run depth: fight ${avgDeep.toFixed(1)} of ${TOTAL_FIGHTS} (indices 0-${TOTAL_FIGHTS - 1}, circle ${CIRCLE(Math.round(avgDeep))})   n=${deepRuns.length} runs with a non-transition strike`)
console.log(`    average measurable strikes per run: ${(allRealStrikes.length / Math.max(1, runs.length)).toFixed(1)}   (${allStrikes.length - allRealStrikes.length} strike events excluded: transition or no boss HP)`)
if (deckIds.length && distinctInDeck / deckIds.length < 0.6) console.log(`    ⚠ only ${pct(distinctInDeck, deckIds.length)} of the DECK is being played — the rest is untested content.`)
console.log('\n' + '='.repeat(96) + '\n')
