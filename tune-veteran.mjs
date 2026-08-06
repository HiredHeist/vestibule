// ═══════════════════════════════════════════════════════════════════════════
//  tune-veteran.mjs — autonomous co-optimizer (Aug 6 2026)
//
//  Plays thousands of headless games and hill-climbs TWO things at once:
//    • the VETERAN brain's value weights + planner depth/beam  (make skill strong)
//    • the spam-punishing GAME rules (ember-gen cap, chain payoff, raw-dmg)  (punish
//      the random spammer)
//  Fitness rewards the SKILL GAP — veteran win% minus spammer win% — while capping
//  the credit for the veteran ceiling (we want strong, not trivial) and punishing
//  spam wins hard. Everything is logged; the best config is written continuously so
//  it can be read/stopped at any time.
//
//  Run:  nohup node tune-veteran.mjs > tune-console.log 2>&1 &
//  Env:  TUNE_GAMES (games/eval, default 500), TUNE_MIN (wall-clock budget, default 90)
// ═══════════════════════════════════════════════════════════════════════════
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const SIM = 'vestibule-sim-kwstacks.js'
const GAMES = parseInt(process.env.TUNE_GAMES) || 400
const STAKE = 'bronze', DECK = 'standard'
const BUDGET_MIN = parseFloat(process.env.TUNE_MIN) || 90
const LOG = 'tune-log.jsonl', BEST = 'tune-best.json', PROG = 'tune-progress.txt'

// param: [min, max, step, isInt]. Tunes the (fixed) planner brain + the decoupled
// skill-rewarding GAME levers, on the otherwise-normal game (NO harsh SKILL_PASS bundle).
const SPACE = {
  PLAN_W_ember:      [0.0, 1.5, 0.1,  false], // planner terminal ember value (low = spend freely)
  PLAN_W_draw:       [0.0, 1.5, 0.1,  false],
  PLAN_W_corr:       [0.0, 1.0, 0.1,  false],
  PLAN_DEPTH:        [2,   4,   1,    true],
  PLAN_BEAM:         [2,   4,   1,    true],
  SP_CHAIN_ORDER:    [0,   1,   1,    true],  // order-dependent chains (a real sequencing test)
  SP_CHAIN_MULT:     [1.0, 4.0, 0.25, false], // chain payoff
  SP_EMBER_GEN_CAP:  [4,   14,  1,    true],  // per-fight ember-gen bound (14 ≈ off)
}
const KEYS = Object.keys(SPACE)
const SEED = {
  PLAN_W_ember:0.3, PLAN_W_draw:0.4, PLAN_W_corr:0.25, PLAN_DEPTH:3, PLAN_BEAM:3,
  SP_CHAIN_ORDER:1, SP_CHAIN_MULT:2.5, SP_EMBER_GEN_CAP:10,
}

function winRate(env) {
  try {
    const out = execSync(`node ${SIM} ${GAMES} ${STAKE} ${DECK}`, {
      env: { ...process.env, ...env },
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 25,
    })
    const m = out.match(/Lucifer wins:[^%]*?([\d.]+)%/)
    return m ? parseFloat(m[1]) : 0
  } catch (e) { return 0 }
}
function fitness(p) {
  const envP = {}; for (const k of KEYS) envP[k] = String(p[k])
  const vWin = winRate({ ...envP, PLANNER: '1' })
  const lWin = winRate({ ...envP, LAZY: '1' })
  // Reward the SKILL GAP directly (veteran − spammer), plus a small bonus for a healthy
  // veteran win rate so we don't converge on a config where everyone just loses.
  const fit = (vWin - lWin) + 0.15 * Math.min(vWin, 25)
  return { fit, vWin, lWin }
}
const clampSnap = (k, v) => { let [mn, mx, st, isInt] = SPACE[k]; v = Math.max(mn, Math.min(mx, v)); v = isInt ? Math.round(v) : Math.round(v / st) * st; return Math.round(v * 1000) / 1000 }
const randParam = (k) => { const [mn, mx, st] = SPACE[k]; const n = Math.floor((mx - mn) / st); return clampSnap(k, mn + st * Math.floor(Math.random() * (n + 1))) }
const randPoint = () => { const q = {}; for (const k of KEYS) q[k] = randParam(k); return q }
function perturb(p) { const q = { ...p }; const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const k = KEYS[Math.floor(Math.random() * KEYS.length)]; const st = SPACE[k][2]; q[k] = clampSnap(k, p[k] + (Math.random() < 0.5 ? -1 : 1) * st * (1 + Math.floor(Math.random() * 2))) } return q }

let best = null, bestFit = -1e9, trials = 0
const t0 = Date.now()
const log = (o) => fs.appendFileSync(LOG, JSON.stringify(o) + '\n')
const prog = (s) => fs.writeFileSync(PROG, s)

console.log(`[tuner] start — ${GAMES} games/eval, budget ${BUDGET_MIN} min, ${KEYS.length} params`)
// RESUME: if a prior best exists, continue from it; else evaluate the seed.
if (fs.existsSync(BEST)) {
  try {
    const prev = JSON.parse(fs.readFileSync(BEST, 'utf8'))
    best = prev.p; bestFit = prev.fit; trials = 0
    console.log(`[tuner] resumed from saved best: fit=${bestFit.toFixed(2)} vWin=${prev.vWin} lWin=${prev.lWin}`)
  } catch (e) { best = null }
}
if (!best) {
  const r = fitness(SEED); best = SEED; bestFit = r.fit; trials++
  fs.writeFileSync(BEST, JSON.stringify({ ...r, p: SEED }, null, 2))
  log({ trials, kind: 'seed', ...r, p: SEED })
  console.log(`[tuner] seed: vWin=${r.vWin} lWin=${r.lWin} fit=${r.fit.toFixed(2)}`)
}
while ((Date.now() - t0) / 60000 < BUDGET_MIN) {
  const cand = Math.random() < 0.25 ? randPoint() : perturb(best)
  const r = fitness(cand); trials++
  const rec = { trials, fit: +r.fit.toFixed(2), vWin: r.vWin, lWin: r.lWin, min: +((Date.now() - t0) / 60000).toFixed(1), p: cand }
  if (r.fit > bestFit) { best = cand; bestFit = r.fit; rec.NEWBEST = true; fs.writeFileSync(BEST, JSON.stringify({ ...r, p: cand }, null, 2)); console.log(`[tuner] NEW BEST t${trials}: vWin=${r.vWin} lWin=${r.lWin} gap=${(r.vWin - r.lWin).toFixed(1)} fit=${r.fit.toFixed(2)}`) }
  log(rec)
  prog(`trials=${trials}  bestFit=${bestFit.toFixed(2)}  elapsed=${((Date.now() - t0) / 60000).toFixed(1)}min\nBEST: ${JSON.stringify(best)}\nlast: vWin=${r.vWin} lWin=${r.lWin} fit=${r.fit.toFixed(2)}\n`)
}
console.log(`[tuner] budget reached — ${trials} trials, bestFit=${bestFit.toFixed(2)}`)
console.log(`[tuner] BEST: ${JSON.stringify(best)}`)
