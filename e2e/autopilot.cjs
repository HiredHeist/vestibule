// e2e/autopilot.cjs — session 3 autonomous player. Runs the state machine loop.
// Doctrine: legit play only (no debug keys, no HP edits). Logs every decision.
// Usage: node e2e/autopilot.cjs [maxMinutes]
const P0 = require('./pilot.cjs')
const fs = require('fs')
const path = require('path')
const LOG = path.join(__dirname, 'session3-events.jsonl')
// Second, independent signal: the last time the bot did something that ADVANCES A
// RUN. Screen text alone is not proof of life — after a rig death the menu kept
// animating, which reset the text watchdog forever while zero cards were played.
const ACTION = { at: Date.now(), fires: 0 }
const ACTION_STALL_MS = 180000 // 3 min with no play/strike/descent = not playing
const ACTION_EVENTS = new Set(['play', 'strike', 'descent', 'draft_confirm', 'shop_buy', 'shop_leave', 'recruit_pick', 'run_start', 'event_choice', 'pact_choice', 'forge_pick', 'modal_pick'])
const ev = (type, data) => { if (ACTION_EVENTS.has(type)) ACTION.at = Date.now();
  try { if (typeof RUN === 'object' && RUN) {
    const d = data || {}
    if (type === 'play') RUN.cardsPlayed[d.card] = (RUN.cardsPlayed[d.card] || 0) + 1
    else if (type === 'play_fail') RUN.fails++
    else if (type === 'chain_fired') RUN.chains++
    else if (type === 'trip_used') RUN.trips++
    else if (type === 'discard_dig') RUN.digs++
    else if (type === 'recruit_pick') RUN.recruits.push(String(d.pick || '').slice(0, 26))
    else if (type === 'pact_choice') RUN.pacts.push(String(d.pick || '').slice(0, 26))
    else if (type === 'forge_pick') RUN.forges.push(d.card)
    else if (type === 'shop_buy') {
      const lbl = String(d.label || '')
      if (/^artifact:/.test(lbl)) RUN.relics.push(lbl.slice(9, 34))
      else if (/^effect pedal:/.test(lbl)) RUN.pedals.push(lbl.slice(13, 38))
      else if (/Pack/i.test(lbl)) RUN.packs++
    } else if (type === 'strike') {
      RUN.strikes++
      if (d.overtime) RUN.overtimeStrikes++
      if (typeof d.corr === 'number' && d.corr > RUN.peakCorruption) RUN.peakCorruption = d.corr
      if (typeof d.bossHp === 'number' && d.bossHp > RUN.maxBossHpSeen) RUN.maxBossHpSeen = d.bossHp
      // transition-tagged strikes read the circle numeral mid fight-to-fight swap
      // and are a full circle too deep — never let them set the run's depth.
      if (!d.transition && typeof d.fightIndex === 'number' && d.fightIndex > RUN.deepestFight) {
        RUN.deepestFight = d.fightIndex; RUN.deepestCircle = Math.floor(d.fightIndex / 3) + 1
      }
      const _atk = typeof d.bandAtkBase === 'number' ? d.bandAtkBase : d.bandAtk
      if (typeof _atk === 'number' && _atk > RUN.peakBandAtk) RUN.peakBandAtk = _atk
    } else if (type === 'strike_skipped') RUN.skippedStrikes++
    else if (type === 'descent') RUN.deepestBoss = String(d.pick || '').slice(0, 40)
  } } catch (e) {} fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ev: type, ...data }) + '\n') }
// every pilot op gets a hard timeout — a hung CDP call must never freeze the loop
const TMO = 20000
const wrap = fn => (...a) => Promise.race([fn(...a), new Promise((_, rej) => setTimeout(() => rej(new Error('op timeout: ' + fn.name)), TMO))])
const P = { connect: wrap(P0.connect), state: wrap(P0.state), shot: wrap(P0.shot), click: wrap(P0.click), clickText: wrap(P0.clickText), drag: wrap(P0.drag), key: wrap(P0.key), evaljs: wrap(P0.evaljs), playCard: wrap(P0.playCard) }

// ── CRASH GUARDS (Aug 1 2026) ─────────────────────────────────────────
// Node exits on an unhandled promise rejection, and the rig produces them
// whenever CDP dies mid-await (page.waitForTimeout on a closed target,
// connectOverCDP ECONNREFUSED). Observed: the bot vanished ~3s after Electron
// was killed, before any watchdog could fire. Log and keep grinding instead.
process.on('unhandledRejection', (r) => {
  try { ev('unhandled_rejection', { msg: String((r && r.message) || r).slice(0, 200) }) } catch (e) {}
})
process.on('uncaughtException', (e) => {
  try { ev('uncaught_exception', { msg: String((e && e.message) || e).slice(0, 200) }) } catch (x) {}
})

const OVERLAY_BTNS = ['got it', 'onward', 'continue', 'collect', 'claim', 'next fight', 'descend', 'take the stage', 'ok']

async function screenType(s) {
  const t = s.text.toUpperCase()
  const btn = txt => s.clickables.some(c => c.t.toLowerCase().includes(txt))
  if (btn('got it')) return 'popup'
  if (btn('discard & continue') || btn('✓ confirm')) return 'modal'
  const _shopish = t.includes('BACK TO THE PIT') || t.includes("SLY'S MERCH")
  // Aug 4 2026: the opened booster modal ("Pick 1 card") renders OVER the shop, so
  // the _shopish guard below classified it as 'shop' and the bot ran shop logic
  // against a modal it could not dismiss — 9 stucks and a 62s stall in one run.
  // The modal's instruction line is "Pick N card(s)"; the shop's own booster TILE
  // reads "Pick 1." with no 'card', so this is unambiguous and must be tested FIRST.
  if (/PICK \d+ CARDS?\b/.test(t)) return 'boosterpick'
  if (!_shopish && (t.includes('⛧ CONTAINS ⛧') || (t.includes('PICK 1') && t.includes('BOOSTER')))) return 'boosterpick'
  if (t.includes('CLICK ANYWHERE') || (t.includes('CREDITS') && !t.includes('STRIKE'))) return 'credits'
  if (t.includes('WELCOME TO HELL') && !btn('strike')) return 'wth'
  if (t.includes('THE PACT')) return 'pact'
  if (!_shopish && t.includes('DOOM FORGE')) return 'forge'
  if (t.includes('— OR —') || t.includes('OR —')) return 'event'
  if (t.includes('THE DESCENT') && t.includes('SELECT THIS PATH')) return 'descent'
  if (t.includes('OPENING NIGHT')) return 'draft'
  if (btn('strike')) return 'combat'
  if (!t.includes('BACK TO THE PIT') && !t.includes('OPENING NIGHT') && /RECRUIT|PICK 1|CHOOSE YOUR/.test(t) && /ATK\s*\d/.test(s.text)) return 'recruit'
  if (t.includes('BACK TO THE PIT') || t.includes('SLY')) return 'shop'
  if (t.includes('START TUTORIAL') || t.includes('ENTER THE VESTIBULE')) return 'menu'
  if (t.includes('DEFEATED BY') || t.includes('PLAY AGAIN') || t.includes('TRY AGAIN') || t.includes('CAUSE OF DEATH')) return 'death'
  if (t.includes('LUCIFER IS DEAD') || /LUCIFER (IS )?(SLAIN|DEAD|DESTROYED|FALLS|DEFEATED)/.test(t)) return 'victory'
  if (t.includes('THE DEVIL IS DEAD')) return 'victory' // full-game victory cinematic
  if (t.includes('VICTORY') || t.includes('ONWARD')) return 'popup' // fight-victory summary → click through
  // Aug 1: post-credits Collection/gallery screens — bot sat on "Collection 38/74
  // discovered" for 5.4 HOURS (9,560 unknown_screen ticks). Escape out of any
  // meta screen that isn't a run.
  if (/COLLECTION|DISCOVERED|TROPHY|TROPHIES|ACHIEVEMENTS|HALL OF/.test(t) && !btn('strike')) return 'meta'
  // ── Aug 1 2026: every screen the Aug-1 audit found landing on 'unknown'.
  // An unclassified screen means the bot stares at it until the watchdog fires;
  // one of them (post-credits Collection) ate 5.4 hours of a 6-hour session.
  if (t.includes('PAUSED') || btn('abandon run')) return 'pause'           // overlay ABOVE combat: STRIKE is visible behind it, used to classify as combat
  if (/KEEP THIS ONE|DEMONIC CONFLICT/.test(t)) return 'demonicconflict'   // hard block: no OVERLAY_BTN matches, infinite stall
  if (/ARTIFACT SLOTS FULL|PEDAL SLOTS FULL|SLOTS FULL/.test(t)) return 'slotswap'
  if (/THE REMASTER/.test(t)) return 'modal'
  if (/NOW DISCARD \d+ TO CONTINUE|SETLIST/.test(t) && btn('confirm')) return 'modal'
  if (/PAWN SHOP/.test(t)) return 'pawn'
  if (/PRESS ANY KEY|TONIGHT ONLY/.test(t)) return 'boot'
  if (/⛧ ENTERING ⛧|ENTERING/.test(t) && !btn('strike')) return 'splash'   // circleSplash: no clickables, auto-clears in 3s
  if (/THE EXECUTIVE FALLS|THE SECOND ALBUM/.test(t)) return 'splash'
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


// ══════════════════════════════════════════════════════════════════════
// PERCEPTION LAYER (Aug 1 2026 rebuild) — DOM reads, not innerText regex.
// The Aug-1 audit found the bot was playing blind: corruption parsed as 0
// forever (anchored ^ regex that could never match), maxHp faked as hp (so
// "is anyone hurt?" was structurally false), Too Stoned members counted as
// alive, hand deduped by name (duplicate copies invisible), and the whole
// game state frozen at the moment the strike began so every ember read was
// stale after the first card. Every one of those is a silent wrong VALUE,
// which is worse than a crash. This reads the real numbers off the DOM and
// LOGS a parse_miss instead of falling back to a plausible lie.
// ══════════════════════════════════════════════════════════════════════
async function perceive(opts) {
  // `quiet` suppresses parse_miss. settleBossHp() re-perceives up to 15 times per
  // strike; without this, one settling strike would write a dozen parse_miss rows
  // for fields that are simply mid-animation, and drown the real ones.
  const raw = await P.evaljs(`(() => {
    const num = t => { const m = String(t).replace(/,/g,'').match(/-?\\d+/); return m ? +m[0] : null }
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const out = { miss: [] }

    // ── corruption ────────────────────────────────────────────────────
    // Aug 4 2026: the comment here claimed it read the 'c-<n>' stamp. It did not
    // — it took the FIRST leaf element ANYWHERE in the document matching ^\\d{1,3}%$,
    // so a shop discount badge or an HP percentage label won the race and fed a
    // wrong corruption straight into brain.cjs's corruption gating (overdrive,
    // darktuning, deathriff, necroticamp, darkcrescendo all key off it).
    // The real stamp (App.jsx ~10390) is a <span> inside the corruption tube with
    // animation 'inkStamp'; the tube itself is the right-edge column at
    // right:14px/width:56px. Anchor to those, in that order, and nothing else.
    let corr = null, corrSrc = ''
    const tube = [...document.querySelectorAll('div')].find(d => {
      const st = d.getAttribute('style') || ''
      return /right:\\s*14px/.test(st) && /width:\\s*56px/.test(st) && vis(d)
    }) || null
    for (const sp of (tube || document).querySelectorAll('span')) {
      const st = sp.getAttribute('style') || ''
      const t = (sp.textContent || '').trim()
      if (!/inkStamp/.test(st)) continue
      if (/^\\d{1,3}%$/.test(t) && vis(sp)) { corr = num(t); corrSrc = 'stamp'; break }
    }
    if (corr === null && tube) {
      for (const el of tube.querySelectorAll('span,div')) {
        const t = (el.textContent || '').trim()
        if (/^\\d{1,3}%$/.test(t) && el.children.length === 0 && vis(el)) { corr = num(t); corrSrc = 'tube'; break }
      }
    }
    // The tube renders only when corruption > 0 (App.jsx ~10384), so its ABSENCE
    // means corruption is exactly 0 — not a failed read. Only flag a miss when the
    // tube IS on screen and the stamp inside it could not be parsed.
    out._corrMissing = corr === null && !!tube
    out.corruption = corr === null ? 0 : corr
    out.corrSource = corr === null ? (tube ? 'MISS' : 'no-tube(=0)') : corrSrc

    // ── boss HP ──
    const bm = document.body.innerText.match(/([\\d,]+)\\s*\\/\\s*([\\d,]+)\\s*HP/)
    out.bossHp = bm ? num(bm[1]) : null
    out.bossMaxHp = bm ? num(bm[2]) : null
    // NOTE: the corruption tube renders only when corruption > 0 (App.jsx
    // ~10349), so its ABSENCE is meaningful — it means corruption is exactly 0,
    // not that the read failed. Flagging it produced 39 false parse_miss events
    // in a 4-minute run. Absence == 0 is correct; never flag it.
    out.inCombat = !!bm

    // ── labelled HUD pills. Verified against the LIVE DOM: the label element
    // holds only the label, and the value sits beside it in the shared parent
    // ("Embers🔥🔥🔥🔥🔥🔥6/6", "Fight2/3", "Stash40"). My first pass walked
    // previousElementSibling and read 0 for everything — caught by
    // e2e/test-perception.cjs before it could poison a single real run.
    const readPill = label => {
      for (const el of document.querySelectorAll('div,span')) {
        if ((el.textContent || '').trim().toUpperCase() !== label) continue
        const par = el.parentElement; if (!par) continue
        const pt = (par.textContent || '').replace(/\\s+/g, '')
        const frac = pt.match(/(\\d+)\\s*\\/\\s*(\\d+)/)
        if (frac) return { cur: +frac[1], max: +frac[2] }
        const bare = pt.replace(new RegExp(label, 'i'), '').match(/(\\d+)/)
        if (bare) return { cur: +bare[1], max: null }
      }
      return null
    }
    const emb = readPill('EMBERS'); if (!emb && out.inCombat) out.miss.push('embers')
    out.embers = emb ? emb.cur : 0; out.maxEmbers = emb ? emb.max : null
    // discards-LEFT lives on the "↓ DISCARD" button; readPill('DISCARD') returns
    // the discard PILE count instead — two different numbers behind one word.
    out.discardsLeft = (() => {
      for (const el of document.querySelectorAll('div,span,button')) {
        const t = (el.textContent || '').replace(/\\s+/g, ' ').trim()
        if (!/^↓?\\s*DISCARD/i.test(t) || t.length > 24) continue
        const par = el.parentElement
        const pt = ((par ? par.textContent : t) || '').replace(/\\s+/g, '')
        const m = pt.match(/(\\d+)\\s*\\/\\s*(\\d+)/)
        if (m) return +m[1]
      }
      return 0
    })()
    const stash = readPill('STASH'); out.stash = stash ? stash.cur : 0
    const fight = readPill('FIGHT'); out.fightInCircle = fight ? fight.cur : null

    // ── strikes: "⛧ STRIKE ⛧" button shows "n/m"; OVERTIME has no digits ──
    const bodyTxt = document.body.innerText
    out.overtime = /OVERTIME/i.test(bodyTxt)
    const sm = bodyTxt.match(/STRIKE[^\\d]{0,12}(\\d+)\\s*\\/\\s*(\\d+)/)
    out.strikesLeft = out.overtime ? 0 : (sm ? +sm[1] : null)
    if (out.strikesLeft === null && out.inCombat) out.miss.push('strikes')
    const mm = bodyTxt.match(/MULTIPLIER\\s*\\n?×([\\d.]+)/)
    out.strikeMult = mm ? parseFloat(mm[1]) : 1
    out.discardLen = (() => { const d = bodyTxt.match(/(\\d+)\\s*\\n?DISCARD/); return d ? +d[1] : 0 })()

    // ── circle number → true fightIndex (sabbathsigil/hexdecay gate on it) ──
    const cm = bodyTxt.match(/CIRCLE\\s+([IVX]+)/)
    const ROM = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9 }
    const circle = cm ? (ROM[cm[1]] || 1) : 1
    out.circle = circle
    out.fightIndex = (circle - 1) * 3 + ((out.fightInCircle || 1) - 1)

    // ── members: real cards only. maxHp recovered from the HP-bar width. ──
    out.members = []
    const seenBox = new Set()
    for (const d of document.querySelectorAll('div')) {
      const t = (d.textContent || '')
      if (!/ATK/.test(t) || !/HP/.test(t)) continue
      if (t.length > 420) continue
      const r = d.getBoundingClientRect()
      if (!(r.height > innerHeight * 0.11 && r.width < innerWidth * 0.24 && r.y > innerHeight * 0.18 && r.y < innerHeight * 0.70)) continue
      if (/^\\s*EMPTY\\s*$/i.test(t)) continue
      const flat = t.replace(/\\s+/g, ' ')
      const nm = flat.match(/([A-Z][a-z]+)\\s*(?:Rhythm|Lead|Bass|Synth|Drummer|Vocalist|Dark|Keyboard)/)
              || flat.match(/^\\W*([A-Z][a-z]+)/)
      const atk = flat.match(/ATK\\s*(\\d+)(?:\\s*\\+\\s*(\\d+))?/)
      const hp  = flat.match(/HP\\s*(\\d+)/)
      if (!nm || !atk) continue
      // HP bar: inline width percentage === hp/maxHp
      let maxHp = hp ? +hp[1] : 0
      for (const bar of d.querySelectorAll('div')) {
        const w = bar.style && bar.style.width
        if (w && /%$/.test(w) && bar.getBoundingClientRect().height <= 6) {
          const pct = parseFloat(w)
          if (pct > 0 && hp) maxHp = Math.max(+hp[1], Math.round(+hp[1] / (pct / 100)))
          break
        }
      }
      const role = (flat.match(/(Rhythm Guitarist|Lead Guitarist|Bass Player|Synth Player|Drummer|Vocalist|Dark Minstrel|Keyboardist)/) || [])[1] || ''
      const kw = (flat.match(/(FRENZIED|DOUBLE TIME|ANCHOR|CORRUPT|DEBUFF|FOLK MAGIC|SHREDDER|HEXED|FALLEN)/) || [])[1] || ''
      // nested divs re-match the same member; keep the LARGEST box per name
      const prevIdx = out.members.findIndex(x => x.name === nm[1])
      if (prevIdx !== -1) { if (out.members[prevIdx]._area >= r.width * r.height) continue; out.members.splice(prevIdx, 1) }
      out.members.push({
        _area: r.width * r.height,
        // atk = base + this-strike temp buff ("ATK 5 +3"); atkBase = the base group
        // ONLY. The buff swings wildly within a fight (455 -> 822 -> 295 -> 161
        // across consecutive fights in the Aug-4 ledger), so it is useless as an
        // amplification denominator. Keep both; log both.
        name: nm[1], atk: (+atk[1]) + (+(atk[2] || 0)), atkBase: +atk[1], hp: hp ? +hp[1] : 0, maxHp,
        role, keyword: kw,
        tooStoned: /TOO STONED/i.test(flat),
        tier: /DEMONIC/i.test(flat) ? 'demonic' : /MYTHIC/i.test(flat) ? 'mythic' : /FOIL/i.test(flat) ? 'foil' : '',
        x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2)
      })
    }

    // ── hand: NO name dedupe (duplicate copies are real, separately playable
    // cards — the old dedupe-by-name hid every second copy from the brain).
    // Nested divs re-match the same card, and because the fan is rotated their
    // centres differ, so positional bucketing does NOT collapse them. Filter by
    // ANCESTRY instead: keep only nodes with no matched ancestor.
    out.hand = []
    const handEls = []
    for (const d of document.querySelectorAll('div')) {
      const t = (d.textContent || '')
      if (!/RIFF|UTILITY|EMBER|CORRUPT/.test(t) || t.length >= 200) continue
      const r = d.getBoundingClientRect()
      if (!(r.y > innerHeight * 0.62 && r.height > innerHeight * 0.13)) continue
      handEls.push(d)
    }
    const outermost = handEls.filter(d => !handEls.some(o => o !== d && o.contains(d)))
    for (const d of outermost) {
      const t = (d.textContent || '')
      const r = d.getBoundingClientRect()
      const flat = t.replace(/\\s+/g, ' ')
      const m = flat.match(/^(\\d+)(.*?)(RIFF|UTILITY|EMBER|CORRUPT)/)
      if (!m) continue
      const corrGate = flat.match(/Need\\s*(\\d+)%\\s*Corr/i)
      out.hand.push({
        _area: r.width * r.height,
        cost: +m[1],
        name: m[2].replace(/[^A-Za-z' ]/g, ' ').replace(/Need \\d+% Corr/, '').trim(),
        type: m[3], corrReq: corrGate ? +corrGate[1] : 0,
        x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
        desc: flat.slice(0, 130)
      })
    }
    out.hand.sort((a, b) => a.x - b.x).forEach(c => { delete c._area })
    out.members.forEach(m => { delete m._area })
    return out
  })()`)
  if (raw && raw.inCombat && raw._corrMissing) (raw.miss = raw.miss || []).push('corruption')
  if (!(opts && opts.quiet) && raw && raw.miss && raw.miss.length) ev('parse_miss', { fields: raw.miss, corrSource: raw.corrSource })
  return raw
}

const BRAIN = require('./brain.cjs')
let strikeNumThisFight = 0, lastBossHp = null
let zeroStrikeTicks = 0, preferNewRun = false

// ── STRIKE IDENTITY (Aug 4 2026) ──────────────────────────────────────
// analyze.cjs used to join `strike` to `strike_result` on `fightIndex|bossHp`.
// That key collides: 43 of 111 keys in the Aug-4 ledger were duplicates, and
// `0|84` appeared three times with three DIFFERENT card lists, so cards got
// credited with other strikes' damage. Every strike now carries a monotonic id
// that is unique across the whole ledger (process id + counter).
const RUN_ID = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)
let strikeSeq = 0
const nextStrikeId = () => RUN_ID + '#' + (++strikeSeq)

// ── FIGHT INDEX (Aug 4 2026) ──────────────────────────────────────────
// perceive() derives fightIndex from CIRCLE numeral + FIGHT pill. During a
// fight-to-fight transition the circle numeral advances BEFORE the pill resets,
// so the pair briefly reads a full circle too deep — the ledger shows f11 right
// after f8, f14 after f11, f17 after f14. Only accept a new index when we are in
// a real fight with a live boss AND it moves by at most one; otherwise carry the
// last good value and tag the event transition:true.
const _unmatchedSeen = new Set(), _ambigSeen = new Set()
function noteUnmatched(c) {
  const k = String(c.name || '').toLowerCase()
  if (!k || _unmatchedSeen.has(k)) return
  _unmatchedSeen.add(k)
  ev('card_unmatched', { name: String(c.name).slice(0, 30), cost: c.cost, type: c.type, desc: String(c.desc || '').slice(0, 90) })
}
function noteAmbiguous(c, card) {
  const amb = BRAIN.isAmbiguous(c.name)
  if (!amb) return
  const k = String(c.name || '').toLowerCase()
  if (_ambigSeen.has(k)) return
  _ambigSeen.add(k)
  ev('card_ambiguous', { name: String(c.name).slice(0, 30), resolvedTo: card.id, candidates: amb })
}

const FIGHT = { idx: -1 }
function resolveFightIndex(g) {
  const liveBoss = !!(g.inCombat && typeof g.bossHp === 'number' && g.bossHp > 0 && g.bossMaxHp && g.strikesLeft !== null)
  const seen = typeof g.fightIndex === 'number' ? g.fightIndex : null
  if (seen !== null && liveBoss && (FIGHT.idx < 0 || seen <= FIGHT.idx + 1)) { FIGHT.idx = seen; return { fightIndex: seen, transition: false } }
  if (FIGHT.idx >= 0) return { fightIndex: FIGHT.idx, transition: true, sawFightIndex: seen }
  return { fightIndex: seen, transition: true, sawFightIndex: seen }
}

// ── HP SETTLING (Aug 4 2026) ──────────────────────────────────────────
// The old code slept a flat 1800ms and read bossHp once. The damage-number
// cascade is still animating at that point, so every non-lethal strike was
// UNDERSTATED by a factor clustering at ×1.77-×2.01 — half the reported damage
// simply had not landed on the HP bar yet. Poll instead, and stop only when two
// consecutive reads agree.
async function settleBossHp(maxMs = 6000, stepMs = 400) {
  const t0 = Date.now()
  let prev, hp = null, reads = 0
  while (Date.now() - t0 < maxMs) {
    await P.connect().then(p => p.waitForTimeout(stepMs)).catch(() => {})
    const a = await perceive({ quiet: true }).catch(() => null)
    hp = a ? a.bossHp : null
    reads++
    if (reads > 1 && hp === prev) return { hp, settleMs: Date.now() - t0, reads, settled: true }
    prev = hp
  }
  return { hp, settleMs: Date.now() - t0, reads, settled: false }
}

// The most trustworthy damage figure is not "HP after" at all — it is
// hpBefore(N) - hpBefore(N+1), because the NEXT strike reads the bar long after
// every animation has finished. Hold the last strike open and emit a
// reconstruction when the following strike in the same fight begins.
let pendingStrike = null
function emitRecon(g, fightIndex) {
  if (!pendingStrike) return
  const p = pendingStrike
  if (p.fightIndex === fightIndex && typeof g.bossHp === 'number' && g.bossHp > 0 && g.bossHp <= p.hpBefore) {
    ev('strike_recon', { strikeId: p.strikeId, fightIndex, hpBefore: p.hpBefore, hpAtNextStrike: g.bossHp, dmg: p.hpBefore - g.bossHp, bandAtkBase: p.bandAtkBase })
  }
  pendingStrike = null
}

// ── CHAIN CONFIRMATION (Aug 4 2026) ───────────────────────────────────
// `chain_fired` is the BOT's own inference (both ids appear in playedIds), which
// is not the same thing as the game firing a chain. The game writes its own line
// to the combat log: "⛧ RIFF CHAIN: <emoji> <NAME>! (...) ×N MULTIPLIER!"
// (App.jsx ~6239). Read THAT and emit chain_confirmed.
const CHAIN_BY_NAME = {}
try { for (const c of (require('./carddata.json').chainMeta || [])) CHAIN_BY_NAME[c.name.toUpperCase()] = c } catch (e) {}
// The log panel keeps a rolling window and is cleared between fights, so an
// index cursor would double-count. Track a per-line occurrence count instead and
// emit only the growth; reset it whenever a new fight starts.
const chainLogSeen = new Map()
async function scanChainLog() {
  const lines = await P.evaljs(`(() => (document.body.innerText.match(/⛧ RIFF CHAIN:[^\\n]*/g) || []))()`).catch(() => null)
  if (!Array.isArray(lines)) return
  const now = new Map()
  for (const l of lines) now.set(l, (now.get(l) || 0) + 1)
  for (const [raw, n] of now) {
    const had = chainLogSeen.get(raw) || 0
    if (n <= had) continue
    const nm = (raw.match(/⛧ RIFF CHAIN:\s*\S*\s*([A-Z][A-Z' ]+?)!/) || [])[1]
    const meta = nm ? CHAIN_BY_NAME[nm.trim().toUpperCase()] : null
    const mult = (raw.match(/×([\d.]+)\s*MULTIPLIER/) || [])[1]
    for (let i = had; i < n; i++) ev('chain_confirmed', { chain: meta ? meta.cards.join('+') : null, name: nm ? nm.trim() : null, mult: mult ? +mult : null, source: 'game_log', line: raw.slice(0, 120) })
    chainLogSeen.set(raw, n)
  }
}

async function combatTick(s) {
  // ── EXPERT COMBAT (Aug 1 2026 rebuild) ──────────────────────────────
  // Sequence a 1000-hour player uses: read the board -> dig for a live hand
  // BEFORE spending embers -> play greedily by the sim's validated policy,
  // re-reading state after EVERY card -> hold a clutch trip -> strike.
  let g = await perceive()
  if (g.bossHp !== null && g.bossMaxHp && g.bossHp === g.bossMaxHp) {
    strikeNumThisFight = 0; playedIdsThisFight.length = 0; cardsThisStrike.length = 0
    firedChainsThisFight = new Set(); hrUsedThisFight.clear(); tripUsedThisFight = false
    chainLogSeen.clear(); pendingStrike = null
  }
  lastBossHp = g.bossHp
  // resolve the fight index ONCE per tick, then reconstruct the previous strike's
  // damage from the HP the boss is showing now (long after every animation).
  const FI = resolveFightIndex(g)
  emitRecon(g, FI.fightIndex)

  const aliveOf = gg => gg.members.filter(m => !m.tooStoned)
  let membersParsed = true
  if (!aliveOf(g).length) {
    // Aug 4: this fallback invents {atk:1},{atk:0} members. 10 of 69 strikes in
    // the Aug-4 ledger logged bandAtk<=1 (one logged 0) purely because of it, and
    // those rows became division-by-~1 amplification outliers. Still needed to
    // keep the bot clicking, but the strike is now STAMPED as unparsed so the
    // analyzer can drop it instead of believing it.
    membersParsed = false
    ev('warn', { msg: 'no members parsed — using fixed slot fallback', membersParsed: false })
    const vp = await P.evaljs('({w:innerWidth,h:innerHeight})')
    g.members = [{ name: 'slot1', atk: 1, atkBase: 1, hp: 5, maxHp: 5, tooStoned: false, keyword: '', role: '', tier: '', x: Math.round(vp.w * 0.38), y: Math.round(vp.h * 0.44) },
                 { name: 'slot2', atk: 0, atkBase: 0, hp: 5, maxHp: 5, tooStoned: false, keyword: '', role: '', tier: '', x: Math.round(vp.w * 0.53), y: Math.round(vp.h * 0.44) }]
  }

  const gsFrom = gg => ({
    alive: aliveOf(gg),                       // real maxHp + tooStoned filtering
    corruption: gg.corruption,                // real value (was pinned at 0)
    stash: gg.stash, embers: gg.embers, discardsLeft: gg.discardsLeft,
    strikeMult: gg.strikeMult, bossHp: gg.bossHp || 0,
    fightIndex: gg.fightIndex,                // real index (was hardcoded 0)
    anyStoned: gg.members.some(m => m.tooStoned),
    handIds: [], handLen: gg.hand.length,
    cardsPlayedIds: playedIdsThisFight, firedChains: firedChainsThisFight,
    discardLen: gg.discardLen, hrUsed: hrUsedThisFight
  })

  // playable = matched + affordable + corruption gate satisfied at its REAL threshold.
  // Aug 4: brain.matchCard no longer fuzzy-guesses (it used to relabel Dark Whisper
  // as `whispercard`). An unmatched card is now LOGGED, once per distinct name.
  const playableIn = (gg, skipIds) => gg.hand
    .map(c => { const card = BRAIN.matchCard(c.name); if (!card) noteUnmatched(c); else noteAmbiguous(c, card); return { ...c, card } })
    .filter(c => c.card && !skipIds.has(c.card.id))
    .filter(c => !c.corrReq || gg.corruption >= c.corrReq)
    .filter(c => c.cost <= gg.embers)

  // ── PHASE 1: DIG FIRST. A human discards on a dead opening hand, before
  // committing embers — not after (the old code dug last, with embers gone).
  {
    const gs0 = gsFrom(g)
    const cand0 = playableIn(g, new Set())
    cand0.forEach(k => { k.score = BRAIN.scoreCard(k.card, { ...gs0, handIds: cand0.map(x => x.card.id) }, strikeNumThisFight, 0) })
    const best0 = cand0.sort((a, b) => b.score - a.score)[0]
    const chainLive = g.hand.some(c => { const m = BRAIN.matchCard(c.name); return m && BRAIN.RIFF_CHAINS.some(ch => (ch[0] === m.id || ch[1] === m.id) && g.hand.some(o => { const m2 = BRAIN.matchCard(o.name); return m2 && m2.id !== m.id && (ch[0] === m2.id || ch[1] === m2.id) }) ) })
    if (g.discardsLeft > 0 && g.hand.length >= 4 && (!best0 || best0.score < 40) && !chainLive) {
      // junk = unplayable corruption-gated + genuinely low value. NEVER dump a
      // free card: whispercard/hungercard/madnesscard/blood_price are 0-cost
      // power the old filter was throwing away.
      const scoredAll = g.hand.map(c => { const card = BRAIN.matchCard(c.name); return { ...c, card, score: card ? BRAIN.scoreCard(card, { ...gs0, handIds: [] }, strikeNumThisFight, 0) : 0 } })
      const junk = scoredAll
        .filter(c => c.cost > 0 && (c.score < 25 || (c.corrReq && g.corruption < c.corrReq)))
        .sort((a, b) => a.score - b.score).slice(0, 2)
      if (junk.length) {
        for (const j of junk) {
          const fresh = await perceive()
          const hit = fresh.hand.find(h => h.name === j.name && h.cost === j.cost)
          if (hit) await P.click(hit.x, hit.y)   // re-read coords: the fan re-lays-out on select
        }
        await P.clickText('↓ discard').catch(() => P.clickText('discard').catch(() => {}))
        await P.connect().then(p => p.waitForTimeout(700))
        ev('discard_dig', { dumped: junk.map(j => j.name.slice(0, 16)), reason: best0 ? 'bestScore ' + best0.score : 'no playable' })
        g = await perceive()
      }
    }
  }

  // ── PHASE 2: PLAY LOOP. Re-perceive after every card so embers/corruption/
  // ATK/hand are never stale (the audit's #1 finding: 53% of plays failed
  // because the bot was reasoning about a pre-strike snapshot).
  let played = 0, failStreak = 0
  const failedIds = new Set()   // keyed by CARD ID, not badged screen name
  for (let iter = 0; iter < 14 && played < 10 && failStreak < 3; iter++) {
    const gs = gsFrom(g)
    const cand = playableIn(g, failedIds)
    gs.handIds = cand.map(k => k.card.id)
    if (!cand.length) { if (iter === 0) ev('no_play', { handSeen: g.hand.length, embers: g.embers, corr: g.corruption, names: g.hand.map(x => x.name.slice(0, 16)) }); break }
    cand.forEach(k => { k.score = BRAIN.scoreCard(k.card, gs, strikeNumThisFight, played) })
    cand.sort((a, b) => b.score - a.score)
    const c = cand[0]
    if (c.score <= 3) break                       // sim stop-rule
    const tgt = BRAIN.pickTarget(c.card, aliveOf(g), { hrUsed: hrUsedThisFight })
    if (!tgt) break
    // ── Aug 4 2026: PLAY VERIFICATION ─────────────────────────────────
    // Success used to be inferred from an ember/discard delta sampled ONCE, ~400ms
    // after the click. Two consequences: every 0-cost card (whispercard,
    // hungercard, madnesscard, blood_price, harmonicfb, secondwind, the whole
    // corruption-gift set) changes no ember count and was read as a FAILURE, and
    // the animation had often not finished either way — 2,252 play_fail against
    // 1,951 play, a 54% "failure" rate that was mostly fiction.
    // Now: poll up to ~1.5s and accept ANY of embers / discard pile / hand size
    // moving. Hand size is the signal that catches free cards.
    const before = { e: g.embers, d: g.discardLen, h: g.hand.length }
    await P.playCard(c.x, c.y, tgt.x, tgt.y)
    let landed = false, waitedMs = 0
    for (let poll = 0; poll < 5; poll++) {
      g = await perceive()
      if (g.embers !== before.e || g.discardLen !== before.d || g.hand.length !== before.h) { landed = true; break }
      if (poll === 4) break
      await P.connect().then(p => p.waitForTimeout(300)).catch(() => {}); waitedMs += 300
    }
    if (landed) {
      played++; failStreak = 0; playedIdsThisFight.push(c.card.id); cardsThisStrike.push(c.card.id)
      if (c.card.id === 'heavyriff') hrUsedThisFight.add(tgt.name)   // once per member per fight
      for (const ch of BRAIN.RIFF_CHAINS) { const ck = ch[0] + '+' + ch[1]; if (!firedChainsThisFight.has(ck) && playedIdsThisFight.includes(ch[0]) && playedIdsThisFight.includes(ch[1])) { firedChainsThisFight.add(ck); ev('chain_fired', { chain: ck, inferred: true }) } }
      ev('play', { card: c.card.id, score: c.score, cost: c.cost, target: tgt.name, embers: g.embers, corr: g.corruption, waitedMs })
    } else {
      failStreak++; failedIds.add(c.card.id)
      ev('play_fail', { card: c.card.id, cost: c.cost, embers: g.embers, corr: g.corruption, waitedMs })
      // NO re-tap. The old "click it again to deselect" could RE-PLAY the card the
      // poll had simply not seen land yet — a double-play logged as a failure. The
      // card id is in failedIds now, so the next iteration picks a different card
      // and that click re-targets the selection anyway.
    }
    if ((await P.state()).text.toUpperCase().includes('DISCARD & CONTINUE')) { await modalTick(await P.state()); g = await perceive() }
  }

  // ── PHASE 3: CLUTCH TRIP. Sim doctrine — trips are emergency buttons and
  // late-fight finishers, NOT openers. The old rule dumped shrooms on strike 1
  // of every boss at 100% HP (9/9 trips in the last run were wasted that way).
  const bossPct = (g.bossHp && g.bossMaxHp) ? g.bossHp / g.bossMaxHp : 1
  const bandHurt = aliveOf(g).length > 0 && aliveOf(g).reduce((a, m) => a + m.hp, 0) / Math.max(1, aliveOf(g).reduce((a, m) => a + m.maxHp, 0)) < 0.4
  // Aug 3 2026: the Aug-3 ledger shows 38 trips in 22 minutes, EVERY one at
  // bossPct=100 with reason 'low strikes'. They were firing during the
  // fight-to-fight transition, where bossHp reads as the NEXT fight's full HP
  // while strikesLeft is still the previous fight's exhausted value. Three
  // guards: (a) must genuinely be in combat, (b) never on the opening strike of
  // a fight, (c) never against a boss that has taken essentially no damage.
  // Also the game allows only ONE trip per fight, so cap it bot-side and stop
  // wasting ticks re-clicking.
  const inRealCombat = g.inCombat && g.bossHp > 0 && g.strikesLeft !== null
  const emergency = g.overtime || bandHurt || (g.strikesLeft <= 1 && bossPct > 0.35)
  const desperate = inRealCombat && strikeNumThisFight > 0 && bossPct < 0.95 && emergency && !tripUsedThisFight
  if (desperate) {
    // prefer the strongest held drug for the situation: DMT > acid > shrooms late
    const pick = ['💠', '🧪', '🍄'].map(e => g0Clickable(s, e)).find(Boolean)
      || (await P.state()).clickables.find(c => /🍄|🧪|💠/.test(c.t) && c.t.length < 30)
    if (pick) {
      // Aug 4: trip_used was logged BEFORE the click and never verified, so the
      // ledger counted INTENTS (252 of them) as consumed trips. Click first,
      // confirm the button is gone, and only then write the row.
      const why = g.overtime ? 'overtime' : bandHurt ? 'band<40%hp' : 'low strikes'
      await P.click(pick.x, pick.y)
      await P.connect().then(p => p.waitForTimeout(1500)).catch(() => {})
      const st2 = await P.state().catch(() => null)
      const gone = !st2 || !st2.clickables.some(c => c.t === pick.t)
      if (gone) { tripUsedThisFight = true; ev('trip_used', { btn: pick.t, bossPct: (bossPct * 100).toFixed(0), strikesLeft: g.strikesLeft, why, verified: true }) }
      else ev('trip_failed', { btn: pick.t, why, note: 'button still present after click — not counted as a trip' })
      g = await perceive()
    }
  }

  // Aug 3: skip strikes fired during fight-to-fight transitions (bossHp=None).
  // FIRST ATTEMPT was too aggressive — it also skipped REAL strikes whenever the
  // damage-cascade overlay covered the HP readout (48 skipped in one 8-min test,
  // so fights never resolved). The authoritative signal is the STRIKE BUTTON: if
  // the game is offering one, we are in a fight, whatever the HP text looks like.
  if (g.bossHp === null) {
    const sNow = await P.state().catch(() => null)
    const hasStrikeBtn = sNow && sNow.clickables.some(c => /STRIKE/i.test(c.t) && !/DISCARD/i.test(c.t))
    if (!hasStrikeBtn) { ev('strike_skipped', { why: 'no boss HP and no strike button (transition)', fightIndex: FI.fightIndex, transition: FI.transition }); return }
  }
  const alive = aliveOf(g)
  const _bandAtk = alive.reduce((a, m) => a + (m.atk || 0), 0)
  const _bandAtkBase = alive.reduce((a, m) => a + (typeof m.atkBase === 'number' ? m.atkBase : m.atk || 0), 0)
  const _hpBefore = g.bossHp
  const strikeId = nextStrikeId()
  // Aug 4: `cards` used to be playedIdsThisFight.slice(-played). When played===0,
  // slice(-0) === slice(0) — the WHOLE fight's card list. 42 of 69 strikes logged
  // played:0 and every one of them carried a bogus non-empty card array, which is
  // exactly how moshpit / setlist / soundboard got labelled OVERPOWERED. There is
  // now a dedicated per-strike array, cleared after each strike event.
  const cardsForThisStrike = cardsThisStrike.slice()
  const base = {
    strikeId, strikes: g.strikesLeft, overtime: g.overtime, bossHp: _hpBefore, bossMaxHp: g.bossMaxHp,
    bandAtk: _bandAtk, bandAtkBase: _bandAtkBase, membersParsed,
    aliveMembers: alive.length, played, embers: g.embers, corr: g.corruption,
    chains: firedChainsThisFight.size, fightIndex: FI.fightIndex, transition: FI.transition,
    cards: cardsForThisStrike
  }
  // Aug 4: a strike with bossHp null/0 is unmeasurable — 27 of 69 strike rows had
  // one and they were silently inflating strikes-per-run. Still CLICK the button
  // (the game has to advance), but log it as strike_skipped, not as a strike.
  const measurable = typeof _hpBefore === 'number' && _hpBefore > 0
  if (!measurable) ev('strike_skipped', Object.assign({ why: 'bossHp ' + JSON.stringify(_hpBefore) + ' — unmeasurable, still striking to advance the game' }, base))
  else ev('strike', base)
  cardsThisStrike.length = 0
  strikeNumThisFight++
  await P.clickText('strike').catch(e => ev('warn', { msg: 'strike btn: ' + e.message }))
  // ── measure what the strike ACTUALLY did ──────────────────────────────
  // Aug 4: this used to be a flat waitForTimeout(1800) + one read, which samples
  // the boss HP MID-CASCADE and understated every non-lethal strike by ×1.77-×2.01.
  // Poll instead. Also record the reconstruction handle so the NEXT strike in this
  // fight can supply hpAtNextStrike, which is animation-proof.
  try {
    const settled = await settleBossHp()
    const hpAfter = settled.hp
    await scanChainLog().catch(() => {})
    if (!measurable) { pendingStrike = null; return }
    const lethal = hpAfter === 0 || hpAfter === null
    ev('strike_result', {
      strikeId, fightIndex: FI.fightIndex, transition: FI.transition,
      hpBefore: _hpBefore, hpAfter: hpAfter === null ? 'gone' : hpAfter, hpAfterSettled: hpAfter,
      settleMs: settled.settleMs, settleReads: settled.reads, settled: settled.settled,
      dmg: _hpBefore - (hpAfter === null ? 0 : hpAfter),
      bandAtk: _bandAtk, bandAtkBase: _bandAtkBase, membersParsed,
      // A killing blow can only ever report the boss's REMAINING HP as damage —
      // overkill is unobservable. Mark it so the analyzer keeps it out of the
      // percentiles instead of letting it dominate them.
      lowerBound: lethal,
      ratio: +((_hpBefore - (hpAfter === null ? 0 : hpAfter)) / Math.max(1, _bandAtkBase)).toFixed(1),
      note: lethal ? 'boss died or fight ended — damage is a LOWER BOUND' : undefined
    })
    pendingStrike = lethal ? null : { strikeId, fightIndex: FI.fightIndex, hpBefore: _hpBefore, bandAtkBase: _bandAtkBase }
  } catch (e) { pendingStrike = null }
}
function g0Clickable(s, emoji) { return (s.clickables || []).find(c => c.t.includes(emoji) && c.t.length < 30) }
const hrUsedThisFight = new Set()   // Heavy Riff: once per member per fight (live game hard-rejects a repeat)
let tripUsedThisFight = false       // the game allows one trip per fight; don't waste ticks re-clicking

// ══════════════════════════════════════════════════════════════════════
// RUN ACCOUNTING (Aug 3 2026) — the ledger previously had no per-run record,
// so answering "how deep do runs get / what kills them / which cards matter"
// meant hand-reconstructing from thousands of raw rows. Every run now ends with
// ONE `run_summary` row carrying everything an analysis needs.
// ══════════════════════════════════════════════════════════════════════
const RUN = {
  n: 0, startedAt: Date.now(), deepestFight: -1, deepestCircle: 0, deepestBoss: '',
  cardsPlayed: {}, strikes: 0, skippedStrikes: 0, fails: 0, chains: 0, trips: 0, digs: 0,
  relics: [], pedals: [], packs: 0, recruits: [], pacts: [], forges: [],
  peakCorruption: 0, peakBandAtk: 0, maxBossHpSeen: 0, overtimeStrikes: 0, deck: null
}
function runReset() {
  RUN.n++; RUN.startedAt = Date.now(); RUN.deepestFight = -1; RUN.deepestCircle = 0; RUN.deepestBoss = ''
  RUN.cardsPlayed = {}; RUN.strikes = 0; RUN.skippedStrikes = 0; RUN.fails = 0; RUN.chains = 0; RUN.trips = 0; RUN.digs = 0
  RUN.relics = []; RUN.pedals = []; RUN.packs = 0; RUN.recruits = []; RUN.pacts = []; RUN.forges = []
  RUN.peakCorruption = 0; RUN.peakBandAtk = 0; RUN.maxBossHpSeen = 0; RUN.overtimeStrikes = 0
}
// Aug 4: `run_summary` had NEVER ONCE been emitted in the whole ledger, because
// every terminal path either broke out of the loop or fell through. It is now
// emitted from a single guarded helper that every terminal path calls, and the
// guard makes a double-call (run_end -> summary, then a stall watchdog on the same
// run) a no-op instead of a second phantom run.
let summaryPending = true, runActive = false
function emitRunSummary(outcome, extra) {
  if (!summaryPending) return
  summaryPending = false; runActive = false
  ev('run_summary', Object.assign({
    run: RUN.n, outcome, deck: RUN.deck,
    minutes: +((Date.now() - RUN.startedAt) / 60000).toFixed(1),
    deepestFight: RUN.deepestFight, deepestCircle: RUN.deepestCircle, deepestBoss: RUN.deepestBoss,
    strikes: RUN.strikes, skippedStrikes: RUN.skippedStrikes, playFails: RUN.fails, chains: RUN.chains, trips: RUN.trips, digs: RUN.digs,
    overtimeStrikes: RUN.overtimeStrikes, peakCorruption: RUN.peakCorruption,
    peakBandAtk: RUN.peakBandAtk, maxBossHp: RUN.maxBossHpSeen,
    relics: RUN.relics, pedals: RUN.pedals, packsBought: RUN.packs,
    recruits: RUN.recruits, pacts: RUN.pacts, forgeUpgrades: RUN.forges,
    distinctCards: Object.keys(RUN.cardsPlayed).length,
    cardsPlayed: RUN.cardsPlayed
  }, extra || {}))
  runReset()
}
// ── RUN START (Aug 4 2026) ────────────────────────────────────────────
// death -> "play again" emitted NO run_start, so the analyzer fused consecutive
// runs: 58 run_end events collapsed into 17 reported runs and the win rate read
// 18% instead of the true 3/58 (~5%). Every path that begins a run now calls
// this, and it also stamps which of the 5 starter decks is in play — without that
// the analyzer had to score DEAD content against all 86 card ids instead of the
// ~36 the run could actually draw.
async function startRun(why, extra) {
  summaryPending = true; runActive = true
  strikeNumThisFight = 0; playedIdsThisFight.length = 0; cardsThisStrike.length = 0
  firedChainsThisFight = new Set(); hrUsedThisFight.clear(); tripUsedThisFight = false
  chainLogSeen.clear(); pendingStrike = null; FIGHT.idx = -1
  ev('run_start', Object.assign({ why }, extra || {}))
  let deck = null, stake = null
  try {
    const meta = await P.evaljs("({deck: localStorage.getItem('vst_active_deck') || 'standard', stake: localStorage.getItem('vst_active_stake') || null, heat: localStorage.getItem('vst_heat') || null, lifetime: localStorage.getItem('vst_lifetime_score') || '0'})")
    deck = meta && meta.deck; stake = meta && meta.stake
    RUN.deck = deck
    ev('run_deck', { deck, stake, heat: meta && meta.heat, lifetimeScore: meta && meta.lifetime })
  } catch (e) { ev('parse_miss', { fields: ['run_deck'], note: String(e.message).slice(0, 80) }) }
  return deck
}

// per-fight brain state (sim: _cardsPlayedIds persists across strikes within a fight)
const playedIdsThisFight = []
// Aug 4: cards played into THE CURRENT STRIKE only, cleared the moment the strike
// event is written. Replaces `playedIdsThisFight.slice(-played)`, whose `slice(-0)`
// returned the whole fight whenever nothing had been played.
const cardsThisStrike = []
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

async function forgeTick(s) {
  // Doom Forge (after pact, each circle boss): upgrade one card permanently.
  // Doctrine (GDD + FIRST_TIPS): pick your best card — score the visible deck
  // cards with the brain's static values, click the top one, then confirm.
  const cards = await P.evaljs(`(() => {
    const seen = {}
    return [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < 220 && r.height > innerHeight * 0.08 && r.width < innerWidth * 0.25
    }).map(d => { const r = d.getBoundingClientRect(); return { t: d.textContent.replace(/\s+/g, ' ').slice(0, 40), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
      .filter(c => { const k = c.t.slice(0, 20); return seen[k] ? false : (seen[k] = 1) })
  })()`).catch(() => [])
  const scored = cards.map(c => {
    const nm = (c.t.match(/^(.*?)\+?\s*(?:RIFF|UTILITY|EMBER|CORRUPT)/) || [, c.t])[1] // name precedes type on forge tiles
    return { ...c, card: BRAIN.matchCard(nm) }
  })
    .filter(c => c.card)
    .map(c => ({ ...c, v: ({ possessedperf: 95, infencore: 88, amp: 82, encore: 76, heavyriff: 74, stagedive: 72, soundwall: 70, staticcharge: 66, crowdsurf: 64, battlecry: 62, powertap: 60 })[c.card.id] || 30 }))
    .sort((a, b) => b.v - a.v)
  if (scored.length) {
    ev('forge_pick', { card: scored[0].card.id, v: scored[0].v })
    await P.click(scored[0].x, scored[0].y)
    await P.connect().then(p => p.waitForTimeout(600))
    for (const b of ['forge', 'upgrade', 'confirm', 'continue', 'skip']) { try { await P.clickText(b); break } catch (e) {} }
  } else {
    ev('forge_skip', { why: 'no cards parsed' })
    for (const b of ['skip', 'continue', ...OVERLAY_BTNS]) { try { await P.clickText(b); break } catch (e) {} }
  }
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
// Aug 1: these are module-global and were never reset, so after the first run
// filled 3 artifacts the relic branch was dead for every later run in the session.
function resetRunEconomy() { BOT.artifacts = 0; BOT.pedals = 0; BOT.boughtThisShop = new Set(); BOT.lastShopSig = '' }

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
  // Aug 1 FIX: band size was parsed by name-regex over the stage-order strip and
  // silently fell back to 2 whenever a name didn't match [A-Z][a-z]{2,} (stoned
  // members, odd glyphs). Result: bot thought the band had room, bought 6 member
  // packs it could not use, then hit BAND IS FULL and declined — pure wasted stash,
  // and the early `return` after each buy meant it NEVER reached the relic branch.
  // Counting ⟩ delimiters in the strip is glyph-agnostic and exact.
  // Aug 1 (2nd pass): the `|| 2` fallback was still live on the else-branch —
  // exactly the guess that bought 6 unusable member packs. Now: no guess. If the
  // strip is unreadable, bandSize is null and the member-pack branch is SKIPPED.
  const stripM = t.match(/STAGE ORDER[^]*?(?=⛧ THIS CIRCLE|⛧ ARTIFACT|⛧ EFFECT PEDAL|🎸 CARDS)/i)
  let bandSize = stripM ? (stripM[0].match(/⟩/g) || []).length : null
  if (bandSize === null) {
    // Aug 4: cache per shop visit — this fired an extra DOM round-trip on every
    // single shop tick when the text regex missed, which is a big slice of the
    // "shop feels slow" complaint.
    if (BOT._bandCacheSig === BOT.lastShopSig && BOT._bandCache !== undefined) bandSize = BOT._bandCache
    else {
      const domCount = await P.evaljs(`(() => {
        const strip = [...document.querySelectorAll('div')].find(d => /STAGE ORDER/i.test(d.textContent || ''))
        if (!strip) return null
        return (strip.textContent.match(/⟩/g) || []).length
      })()`).catch(() => null)
      bandSize = domCount
      BOT._bandCache = domCount; BOT._bandCacheSig = BOT.lastShopSig
    }
    if (bandSize === null) ev('parse_miss', { field: 'bandSize', note: 'member packs skipped this shop' })
  }
  // ── Aug 4 2026: VERIFY THE PURCHASE ─────────────────────────────────
  // shop_buy was written BEFORE the click and never checked, so 187 rows counted
  // INTENTS, not acquisitions — and the report's "relics/pedals acquired in N
  // runs" was built entirely out of them. Click, then confirm the stash actually
  // moved (or the tile went SOLD) before writing the row.
  const confirmSpend = async (before, tileLabel) => {
    for (let i = 0; i < 5; i++) {
      await P.connect().then(p => p.waitForTimeout(300)).catch(() => {})
      const st2 = await P.state().catch(() => null)
      if (!st2) continue
      const now = +((st2.text.match(/STASH\s*\n?💵\s*\n?(\d+)/) || [0, NaN])[1])
      if (isFinite(now) && now < before) return { ok: true, spent: before - now, stashAfter: now }
      const i2 = st2.text.toLowerCase().indexOf(String(tileLabel || '').toLowerCase())
      if (tileLabel && i2 >= 0 && /sold/i.test(st2.text.slice(i2, i2 + 60))) return { ok: true, spent: null, stashAfter: isFinite(now) ? now : null }
      if (!/SHOP|BACK TO THE PIT/i.test(st2.text)) return { ok: true, spent: null, stashAfter: null, note: 'left the shop' }
    }
    return { ok: false }
  }
  const buy = async (label, why) => {
    const c = s.clickables.find(c => c.t.toLowerCase().includes(label))
    if (!c) return false
    BOT.boughtThisShop.add(label)
    await P.click(c.x, c.y)
    const v = await confirmSpend(stash, label)
    if (v.ok) ev('shop_buy', { label: c.t.slice(0, 50), why, stash, stashAfter: v.stashAfter, spent: v.spent, bandSize, verified: true })
    else ev('shop_buy_failed', { label: c.t.slice(0, 50), why, stash, bandSize, note: 'no stash change and no SOLD stamp — intent only, NOT counted' })
    return true
  }
  const tl = t.toLowerCase()
  // sold-check: look for SOLD within 200 chars AFTER the label (case-insensitive find)
  const tryable = l => { if (BOT.boughtThisShop.has(l)) return false; const i = tl.indexOf(l.toLowerCase()); return i < 0 ? true : !/sold/i.test(t.slice(i, i + 60)) } // 60 = tile-local; wider windows bleed into neighboring tiles' SOLD stamps
  // 1. MEMBERS (sim: needsMembers = band < 5)
  if (bandSize !== null && bandSize < 5) {
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
  // 2/3. RELIC + PEDAL — Aug 1 ROOT-CAUSE FIX (zero relics bought in a 6-hour run).
  // The buy button is labelled with the ITEM'S NAME ("🤘Crowd Noise ×1.10 per alive
  // member"), never the word "artifact" — so buy('artifact') could never match any
  // clickable. The bot was structurally incapable of buying relics; this was a rig
  // blindness bug, NOT relics losing on price. Parse name+cost out of the tile block
  // and click by name. Shop text shape:
  //   ⛧ ARTIFACT \n <cost> \n <emoji> \n <Name> \n <effect>
  // Tile layout varies: sometimes "<emoji>\n<Name>\n<effect>", sometimes
  // "<emoji><Name>\n<effect>". Collect both lines after the cost as name
  // candidates and match on a short prefix — clickable text is truncated at 60
  // chars by pilot.state(), so matching a full effect sentence would miss.
  const buyNamed = async (cands, why, label) => {
    let c = null, used = ''
    for (const raw of cands) {
      const n = String(raw || '').replace(/^[^A-Za-z0-9]+/, '').slice(0, 22).toLowerCase()
      if (n.length < 3) continue
      c = s.clickables.find(x => x.t.toLowerCase().includes(n))
      if (c) { used = n; break }
    }
    if (!c) { ev('shop_skip', { tile: label, why: 'tile not clickable, tried: ' + cands.join(' | ').slice(0, 60) }); return false }
    BOT.boughtThisShop.add(label)
    await P.click(c.x, c.y)
    const v = await confirmSpend(stash, used)
    if (v.ok) ev('shop_buy', { label: (label + ': ' + c.t).slice(0, 60), why, stash, stashAfter: v.stashAfter, spent: v.spent, bandSize, matched: used, verified: true })
    else ev('shop_buy_failed', { label: (label + ': ' + c.t).slice(0, 60), why, stash, bandSize, matched: used, note: 'no stash change and no SOLD stamp — intent only, NOT counted' })
    return true
  }
  const tileInfo = marker => {
    // Aug 3: grab the next FOUR lines after the cost and drop any that are pure
    // numbers or bare emoji — the ledger showed 3x "tile not clickable, tried: 10"
    // where the captured "name" was the price line.
    const m = t.match(new RegExp(marker + '\\s*\\n(\\d+)((?:\\s*\\n[^\\n]*){1,4})'))
    if (!m) return null
    const cands = String(m[2] || '').split('\n')
      .map(x => x.trim())
      .filter(x => x && !/^\d+$/.test(x) && /[A-Za-z]{3}/.test(x))
    return { cost: +m[1], cands }
  }

  // ── Aug 4 2026: THIS BLOCK MUST STAY BELOW buyNamed/tileInfo ─────────
  // It previously sat above them. `const` is in the temporal dead zone, so every
  // single shop visit threw "Cannot access 'tileInfo' before initialization" —
  // 43 times in one session, which stuck the bot in the shop, burned all three
  // stuck-recovery attempts and aborted the run after 2.5 minutes. The relics-first
  // doctrine itself is correct (see the economy audit); the placement was not.
  // ── Aug 3 2026 DOCTRINE CHANGE: RELICS BEFORE PACKS AT BAND >= 3 ──────
  // The economy audit did the math: band slots cap at 5 and the draft + free
  // Welcome Pack already fill 3, so at most two member packs per run are usable
  // (best case 32 stash -> x1.57 damage, then it is over forever). Three cheap
  // relics stack multiplicatively to x2.5+, and the ceiling is x18+. Relics were
  // ALSO silently dead in the live game until Aug 1, which is why members-first
  // ever looked correct. Now that they work, an expert buys relics.
  const relicsFirst = bandSize !== null && bandSize >= 3
  if (relicsFirst) {
    const a0 = tileInfo('⛧ ARTIFACT')
    if (BOT.artifacts < 3 && tryable('artifact') && a0 && stash >= a0.cost) {
      if (await buyNamed(a0.cands, `relic-first cost=${a0.cost} band=${bandSize}`, 'artifact')) { BOT.artifacts++; return }
    }
    const p0 = tileInfo('⛧ EFFECT PEDAL')
    if (BOT.pedals < 2 && tryable('effect pedal') && p0 && stash >= p0.cost) {
      if (await buyNamed(p0.cands, `pedal-first cost=${p0.cost} band=${bandSize}`, 'effect pedal')) { BOT.pedals++; return }
    }
  }
  if (BOT.artifacts < 3 && tryable('artifact')) {
    const a = tileInfo('⛧ ARTIFACT')
    if (a && stash >= a.cost) { // Aug 3: dropped the +4 reserve — it blocked 10 near-affordable relic buys in one session
      if (await buyNamed(a.cands, `relic cost=${a.cost}`, 'artifact')) { BOT.artifacts++; return }
    } else if (a) ev('shop_skip', { tile: 'artifact', why: `stash ${stash} < ${a.cost}` })
  }
  if (BOT.pedals < 2 && tryable('effect pedal')) {
    const p = tileInfo('⛧ EFFECT PEDAL')
    if (p && stash >= p.cost) {
      if (await buyNamed(p.cands, `pedal cost=${p.cost}`, 'effect pedal')) { BOT.pedals++; return }
    } else if (p) ev('shop_skip', { tile: 'pedal', why: `stash ${stash} < ${p.cost}` })
  }
  // 4. DRUGS (sim: shrooms if stash>=16, acid if stash>=22 — reserve logic)
  if (stash >= 16 && /Shrooms/i.test(t) && !/Shrooms\s*\n?DRY/i.test(t) && tryable('shrooms') && await buy('shrooms', 'panic button reserve')) return
  if (stash >= 22 && /🧪/.test(t) && !/🧪\s*\n?DRY/i.test(t) && tryable('🧪') && await buy('🧪', 'acid reserve')) return
  // 4b. BOOSTER DOCTRINE (Jul 31 JV): CD-R when stash-rich — data on booster value
  if (stash >= 30 && /CD-R/i.test(t) && tryable('cd-r') && await buy('cd-r', 'booster doctrine, stash=' + stash)) return
  // 5. AURA-AWARE STAGE ORDERING (sim weapon #2): arrange members so aura emitters
  // cover the most neighbors (sim improveOrdering). Arrows: ⟨ moves member left.
  try {
    for (let moves = 0; moves < 6; moves++) {
      const strip = await P.evaljs(`(() => {
        const arrows = [...document.querySelectorAll('*')].filter(el => (el.textContent || '').trim() === '⟨' && el.children.length === 0)
          .map(el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
          .filter(a => a.x > 0).sort((a, b) => a.x - b.x || a.y - b.y)
        const m = (document.body.innerText.match(/STAGE ORDER[\s\S]{0,400}?(?=⛧ THIS CIRCLE|⛧ ARTIFACT|CARDS FOR SALE)/) || [''])[0]
        const names = [...m.matchAll(/⟨[^⟩]*?([A-Z][a-z]{2,})[^⟩]*?⟩/g)].map(x => x[1])
        return { names, arrows }
      })()`)
      if (!strip.names || strip.names.length < 3) break // ordering only matters at 3+
      const want = BRAIN.bestOrder(strip.names)
      if (JSON.stringify(want) === JSON.stringify(strip.names)) { if (moves) ev('stage_ordered', { order: want.join('>') }); break }
      let i = 0; while (want[i] === strip.names[i]) i++
      const j = strip.names.indexOf(want[i])
      if (j <= i || !strip.arrows[j]) break
      await P.click(strip.arrows[j].x, strip.arrows[j].y) // move him one slot left
      await P.connect().then(p => p.waitForTimeout(400))
    }
  } catch (e) { ev('stage_order_err', { msg: e.message.slice(0, 60) }) }
  const f = await P.shot('shop-final-' + Date.now())
  ev('shop_leave', { stash, bandSize, bought: [...BOT.boughtThisShop], shot: f })
  BOT.boughtThisShop = new Set(); BOT.lastShopSig = ''
  const leave = s.clickables.find(c => c.t.toLowerCase().includes('back to the pit'))
  if (leave) await P.click(leave.x, leave.y)
}

async function recruitTick(s) {
  // RecruitScreen after buying a pack: pick best candidate (sim pickBestCandidate policy).
  // Candidate cards are plain divs (not cursor:pointer) — query the DOM directly.
  // Aug 4 2026: READ THE GAME'S OWN "CAN I TAKE THIS?" SIGNAL.
  // RecruitScreen's card handler opens with `if(blockedDbl) return` — a SILENT
  // no-op when the band already has a DOUBLE TIME member. The bot kept choosing a
  // second drummer, the click did nothing, it retried, then passed and burned a
  // 10-40 stash pack, leaving empty band slots (JV: "it would open member packs
  // but not pick a new member even though there are empty slots").
  // The game already renders the answer: canAdd drives BOTH cursor (pointer vs
  // not-allowed) and opacity (1 vs 0.4). Read those and only consider takeable
  // cards — covers the DOUBLE TIME block AND the no-empty-slot case without the
  // bot having to model either rule itself.
  // ── Aug 4 2026: selector rebuilt from a LIVE DOM DUMP, not guesswork ──
  // Actual recruit screen structure (measured):
  //   [0] w=409 cursor=crosshair  <- CONTAINER wrapping both cards
  //   [1] w=195 cursor=pointer    <- the real card (h=308)
  //   [2] w=193 cursor=pointer    <- an inner block of the SAME card (h=156)
  //   [3] w=195 cursor=pointer    <- second card
  // Two earlier attempts failed on this: dedupe-by-text-prefix treated the FOIL
  // banner and stat block as different candidates, and "keep the outermost node"
  // kept the CONTAINER — so the bot clicked the gap between the cards, retried,
  // and finally passed, burning the pack (band never grew past 2).
  // Correct rule: only elements the game itself made interactive (cursor pointer,
  // or not-allowed when blocked), then one per screen column, tallest wins.
  let cands = await P.evaljs(`(() => {
    const hits = [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect(); const cs = getComputedStyle(d)
      if (!/ATK\\s*\\d/.test(t) || !/HP\\s*\\d/.test(t) || t.length >= 350) return false
      if (!(r.height > innerHeight * 0.12 && r.width > 120 && r.width < innerWidth * 0.22)) return false
      return cs.cursor === 'pointer' || cs.cursor === 'not-allowed'
    })
    const byCol = new Map()
    for (const d of hits) {
      const r = d.getBoundingClientRect(); const col = Math.round(r.x / 40)
      const prev = byCol.get(col)
      if (!prev || r.height > prev.getBoundingClientRect().height) byCol.set(col, d)
    }
    return [...byCol.values()].map(d => {
      const r = d.getBoundingClientRect(); const cs = getComputedStyle(d)
      return {
        t: d.textContent.replace(/\\s+/g, ' ').slice(0, 120),
        x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
        takeable: cs.cursor === 'pointer' && parseFloat(cs.opacity || '1') > 0.6
      }
    }).sort((a, b) => a.x - b.x)
  })()`).catch(() => [])
  const blocked = cands.filter(c => !c.takeable)
  if (blocked.length) ev('recruit_blocked', { count: blocked.length, cards: blocked.map(c => c.t.slice(0, 26)), why: 'game marks not-allowed (dup DOUBLE TIME / no empty slot)' })
  const takeable = cands.filter(c => c.takeable)
  if (takeable.length) cands = takeable
  if (cands.length) {
    // stack-tier bonus: favor keywords the band already runs (parsed from stage strip earlier runs — approximate with pair bonus)
    const scored = cands.map(c => { const { p, kw } = memberScoreFromText(c.t); return { ...c, p, kw } })
    const counts = {}; scored.forEach(c => { counts[c.kw] = (counts[c.kw] || 0) + 1 })
    const best = scored.sort((a, b) => (b.p + (counts[b.kw] > 1 ? 15 : 0)) - (a.p + (counts[a.kw] > 1 ? 15 : 0)))[0]
    // never sign Lucifer: 3-member cap + dies-ends-run risk isn't in the sim's model
    const safe = scored.filter(c => !/FALLEN|The Devil/i.test(c.t))
    const pickFrom = safe.length ? safe : scored
    const bestSafe = pickFrom.sort((a, b) => (b.p + (counts[b.kw] > 1 ? 15 : 0)) - (a.p + (counts[a.kw] > 1 ? 15 : 0)))[0]
    // Aug 3 2026 BALANCE TELEMETRY: log what was OFFERED, not just what was taken.
    // Without the rejected options you cannot tell an unpopular member from one that
    // never appeared — which is exactly the "band members that are always skipped"
    // question this playtest exists to answer.
    // Aug 4: `picked` here is an INTENT — it was logged BEFORE the click, so every
    // failed pick (blocked DOUBLE TIME dup, no empty slot, unresponsive screen)
    // still counted as a pick and inflated that member's rate. The intent stays,
    // clearly named; the CONFIRMED outcome is emitted below, after the click lands.
    const bestName = memberName(bestSafe.t)
    ev('recruit_options', {
      pickCount: 1, offeredCount: scored.length,
      offered: scored.map(c => ({ name: memberName(c.t), kw: c.kw, score: c.p })),
      intent: bestName
    })
    ev('recruit_pick', { pick: bestSafe.t.slice(0, 50), name: bestName, score: bestSafe.p })
    // ── Aug 4 2026: DO NOT THROW AWAY A PURCHASED PACK ────────────────────
    // The Aug-3 version diffed the first 300 chars of screen text 600ms after the
    // click and, if it hadn't changed yet, clicked "pass" — which SKIPS the recruit
    // entirely and burns the 10-40 stash pack, leaving empty band slots. JV saw
    // exactly that: "it would open member packs but not pick a new member even
    // though there are empty slots." Two errors: (a) 600ms is shorter than the
    // pack-open animation, so a successful pick often looked like a failure, and
    // (b) `bestSafe.h` doesn't exist on these DOM records, so the retry clicked a
    // guessed offset that could land on dead space.
    //
    // Now: poll for a REAL state change (recruit screen gone, or a follow-up modal),
    // retry the SAME card a few times, and never voluntarily pass while the pack is
    // unspent. Passing is a last resort only after the screen refuses to respond.
    const recruitGone = async () => {
      const st = await P.state().catch(() => null)
      if (!st) return { done: false, st: null }
      const T = st.text.toUpperCase()
      const stillPicking = /CHOOSE ONE MUSICIAN|RECRUIT A MEMBER/.test(T)
      const followUp = /BAND IS FULL|DEVIL'S CONTRACT|KEEP THIS ONE/.test(T)
      return { done: !stillPicking || followUp, st }
    }
    let after = null, took = false
    for (let attempt = 0; attempt < 3 && !took; attempt++) {
      await P.click(bestSafe.x, bestSafe.y).catch(() => {})
      // poll up to ~2.4s — the pack-open/join animation is well over 600ms
      for (let i = 0; i < 8; i++) {
        await P.connect().then(p => p.waitForTimeout(300))
        const r = await recruitGone()
        if (r.done) { took = true; after = r.st; break }
        after = r.st
      }
      if (!took) ev('recruit_retry', { attempt: attempt + 1, card: bestSafe.t.slice(0, 24) })
    }
    if (!took) {
      // Only now is passing justified — the screen is genuinely unresponsive.
      ev('recruit_unresponsive', { msg: 'card clicks not registering — passing to avoid a hang', card: bestSafe.t.slice(0, 30) })
      try { await P.clickText('pass') } catch (e) {}
    }
    if (!after) after = await P.state()
    const at = after.text.toUpperCase()
    // the CONFIRMED acquisition — the only row the report's pick rates count.
    if (took && !at.includes("DEVIL'S CONTRACT")) ev('recruit_confirmed', { name: bestName, score: bestSafe.p })
    if (at.includes("DEVIL'S CONTRACT")) { ev('lucifer_declined', {}); await P.clickText('walk away').catch(() => {}) }
    else if (at.includes('BAND IS FULL')) {
      // Replace the weakest current member ONLY if the incoming candidate is
      // actually stronger. Aug 1: bot cut its grown ATK-13 Ragnar for a fresh
      // ATK-4 Ragnar — buffed members accumulate perm ATK all run; a base-stat
      // recruit almost never beats a developed member. Value = ATK*3 + HP,
      // incoming needs a real margin (+20%) to justify losing the growth.
      const cuts = after.clickables.filter(c => /✂/.test(c.t))
      if (cuts.length) {
        const val = t => (+(t.match(/ATK\s*(\d+)/i) || [0, 0])[1]) * 3 + (+(t.match(/HP\s*(\d+)/i) || [0, 0])[1])
        const scoredCuts = cuts.map(c => ({ ...c, v: val(c.t) }))
        const weakest = scoredCuts.sort((a, b) => a.v - b.v)[0]
        const incomingV = val(bestSafe.t)
        if (incomingV > weakest.v * 1.2) {
          ev('member_replaced', { cut: weakest.t.slice(0, 40), cutV: weakest.v, inV: incomingV })
          await P.click(weakest.x, weakest.y)
        } else {
          ev('replace_declined', { weakest: weakest.t.slice(0, 30), cutV: weakest.v, inV: incomingV })
          await P.clickText('keep current band').catch(() => {})
        }
      } else await P.clickText('keep current band').catch(() => {})
    }
    // Aug 1: this sweep used to run unconditionally — RecruitScreen has NO confirm
    // button (onPick fires on the card click), so by now we're back in the shop and
    // 'recruit'/'welcome' match the shop's OWN pack tiles → it bought a second pack
    // it never intended. Only sweep if we're genuinely still on a recruit screen.
    // Aug 4: this used to burn a full state() + screenType round-trip on EVERY
    // recruit just to decide whether to press a confirm button that RecruitScreen
    // does not have (onPick fires on the card click). We already hold `after` from
    // the poll above — reuse it instead of re-reading the DOM.
    if (after && /CHOOSE ONE MUSICIAN|RECRUIT A MEMBER/i.test(after.text)) {
      for (const b of ['add to band', 'confirm', 'take', 'join']) { try { await P.clickText(b); break } catch (e) {} }
    }
  } else {
    ev('recruit_pass', { why: 'no candidates parsed' })
    try { await P.clickText('pass') } catch (e) { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e2) {} } }
  }
}

// ── ROSTER NAME RESOLUTION (Aug 4 2026) ───────────────────────────────
// `draft_click.name` was populated on 4 of 129 rows because it was a bare
// /([A-Z][a-z]+)/ against a tile whose text starts with keyword badges and stat
// blocks. Match against the KNOWN ROSTER first — the game only ever offers those
// 18 musicians — and only then fall back to the regex. `name` is never empty now.
let ROSTER_NAMES = []
try { ROSTER_NAMES = (require('./carddata.json').musicians || []).map(m => m.name) } catch (e) {}
function memberName(text) {
  const t = String(text || '')
  for (const n of ROSTER_NAMES) if (new RegExp('(^|[^A-Za-z])' + n + '([^A-Za-z]|$)', 'i').test(t)) return n
  const m = t.match(/([A-Z][a-z]{2,})/)
  return (m && m[1]) || t.replace(/\s+/g, ' ').trim().slice(0, 14) || 'UNPARSED'
}

// Draft is pick-N-of-M (N=2 by default): the confirm button reads
// "SELECT 2 MUSICIANS" until exactly N are selected, then "TAKE THE STAGE".
const draftPickCount = txt => { const m = String(txt).match(/SELECT\s+(\d+)\s+MUSICIAN/i); return m ? +m[1] : 2 }
let lastDraftSig = ''
async function draftTick(s) {
  // v2 (Jul 30): VERIFY-AFTER-EACH-CLICK. Candidate clicks TOGGLE selection and the
  // layout shifts on select — blind double-clicks can toggle forever (the "spaz").
  // Click one candidate at a time, re-read.
  const stageBtn = st => st.clickables.find(c => /take the stage/i.test(c.t))
  const noDevil = list => list.filter(c => !/FALLEN|The Devil/i.test(c.t)) // fair tests never draft Lucifer
  const parse = st => noDevil(st.clickables.filter(c => /ATK\d/.test(c.t.replace(/\s/g, '')))).map(c => {
    const { p, kw } = memberScoreFromText(c.t)
    return { ...c, kw, score: p, name: memberName(c.t) }
  }).sort((a, b) => b.score - a.score)

  // ── Aug 4 2026: LOG THE SLATE ON EVERY DRAFT ────────────────────────
  // draft_options used to be emitted only inside the loop at attempt===0, so it
  // fired 2 times against 63 draft_confirms — a draft whose candidates were
  // already selected on entry logged nothing at all, and the report's pick rates
  // were computed from an n of 2. Emit before anything else, deduped by the slate
  // itself so repeated ticks on the SAME screen don't inflate the offer counts.
  const opening = parse(s)
  const pickCount = draftPickCount(s.text)
  const sig = opening.map(c => c.name).sort().join('|')
  const fresh = sig && sig !== lastDraftSig
  if (fresh) {
    lastDraftSig = sig
    ev('draft_options', {
      pickCount, offeredCount: opening.length,
      offered: opening.map(c => ({ name: c.name, kw: c.kw, score: c.score }))
    })
  }
  const clicked = []
  let st = s
  for (let attempt = 0; attempt < 8; attempt++) {
    const ready = stageBtn(st)
    if (ready) {
      const seed = (st.text.match(/RUN SEED:\s*([A-Z0-9]+)/i) || [])[1]
      await P.click(ready.x, ready.y)
      ev('draft_confirm', { attempt, seed })
      // ONE outcome row per draft with the names actually confirmed. draft_click
      // is an INTENT (logged before the click); this is the result.
      ev('draft_result', { seed, pickCount, offeredCount: opening.length, offered: opening.map(c => c.name), confirmed: [...new Set(clicked)] })
      lastDraftSig = ''
      return
    }
    const cand = parse(st)
    if (!cand.length) { ev('draft_confused', { msg: 'no candidates parsed' }); lastDraftSig = ''; return }
    // prefer keyword-pair: if top pick's keyword has a partner, boost the partner
    const top = cand[0]
    const partner = cand.find(c => c !== top && c.kw && c.kw === top.kw)
    const order = partner ? [top, partner, ...cand.filter(c => c !== top && c !== partner)] : cand
    const pick = order[attempt % order.length]
    ev('draft_click', { attempt, pick: pick.t.slice(0, 30), name: pick.name })
    clicked.push(pick.name)
    await P.click(pick.x, pick.y)
    await P.connect().then(p => p.waitForTimeout(500))
    st = await P.state()
  }
  const f = await P.shot('draft-confused-' + Date.now())
  ev('draft_confused', { msg: '8 attempts, no TAKE THE STAGE', shot: f, offered: opening.map(c => c.name), clicked })
  lastDraftSig = ''
}

// ══════════════════════════════════════════════════════════════════════
// HARD WATCHDOG (Aug 1 2026, JV requirement: "if the demo stalls for more than
// 60 seconds make it restart from circle 1 and log what caused the error").
//
// The in-loop watchdog can only run when the loop is running. Two real overnight
// failure modes bypass it entirely:
//   1. the loop blocks forever inside an unresolved await (a hung CDP call), and
//   2. state() throws and the loop `continue`s, skipping the check — which is
//      exactly how a previous 6-hour session spun on ECONNREFUSED all night.
// This timer lives outside the loop, so neither can suppress it. It escalates:
// soft restart of the run first, then hard process exit so the launcher relaunches.
// ══════════════════════════════════════════════════════════════════════
const PROGRESS = { at: Date.now(), hash: '', softFires: 0 }
function markProgress(hash) { if (hash !== PROGRESS.hash) { PROGRESS.hash = hash; PROGRESS.at = Date.now() } }
function startHardWatchdog(stallMs, onSoftRestart) {
  const timer = setInterval(() => {
    // ── ACTION stall: alive but not actually playing ──
    const actionIdle = Date.now() - ACTION.at
    if (actionIdle > ACTION_STALL_MS) {
      ACTION.fires++
      ev('ACTION_STALL', { minutesWithoutGameplay: (actionIdle / 60000).toFixed(1), attempt: ACTION.fires })
      ACTION.at = Date.now()
      if (ACTION.fires >= 2) {
        ev('HARD_EXIT', { msg: 'no gameplay for two ACTION_STALL windows — exiting for launcher relaunch' })
        try { emitRunSummary('abandoned_hard_exit', { reason: 'ACTION_STALL x2' }) } catch (e) {}
        process.exit(3)
      }
      try { onSoftRestart() } catch (e) {}
      return
    }
    const idle = Date.now() - PROGRESS.at
    if (idle < stallMs) return
    PROGRESS.softFires++
    ev('HARD_WATCHDOG', { idleSeconds: Math.round(idle / 1000), attempt: PROGRESS.softFires })
    PROGRESS.at = Date.now()
    if (PROGRESS.softFires >= 3) {
      // Three stalls without progress = the rig itself is wedged (dead Electron,
      // dead CDP). Exit non-zero; run-bot.bat relaunches us with a fresh browser.
      ev('HARD_EXIT', { msg: 'rig wedged after 3 hard-watchdog fires — exiting for launcher relaunch' })
      try { emitRunSummary('abandoned_hard_exit', { reason: 'watchdog x3' }) } catch (e) {}
      try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ev: 'session', msg: 'hard exit' }) + '\n') } catch (e) {}
      process.exit(3)
    }
    try { onSoftRestart() } catch (e) {}
  }, 5000)
  // Deliberately NOT unref()'d: if the main loop is stuck awaiting a promise that
  // never resolves, an unref'd timer lets Node decide it has nothing to do and
  // exit silently — which is exactly what killed a test run. This timer is the
  // last thing keeping the process alive, and that is the point.
  return timer
}

async function main() {
  const maxMs = (+(process.argv[2] || 14)) * 60000
  const t0 = Date.now()
  let lastHash = '', stuck = 0, recoveries = 0
  // 60s wall-clock stall limit (JV, Aug 1). Override with VST_STALL_MS for tests.
  const STALL_MS = +(process.env.VST_STALL_MS || 60000)
  let lastProgressHash = '', lastProgressAt = Date.now(), stallRestarts = 0
  let build = 'unknown'
  // Aug 4: an uncommitted working tree used to log the SAME build hash as the
  // clean commit, so analyze.cjs happily merged runs of different code under one
  // "current build only" scope. Mark it.
  let dirty = false
  try {
    const R = JSON.stringify(path.join(__dirname, '..'))
    build = require('child_process').execSync('git -C ' + R + ' log --oneline -1').toString().trim().slice(0, 50)
    dirty = require('child_process').execSync('git -C ' + R + ' status --porcelain').toString().trim().length > 0
    if (dirty) build += '-dirty'
  } catch (e) {}
  ev('session', { msg: 'autopilot v2 start', build, dirty })
  // player-settings for a steadier hand: hover-zoom off (cards stop re-fanning under
  // the cursor), damage numbers on. Same toggles a human sets in OPTIONS.
  try { await P.evaljs("localStorage.setItem('vst_hoverzoom','off'); localStorage.setItem('vst_shake','off'); localStorage.setItem('vst_no_lucifer','1'); localStorage.setItem('vst_heat','1'); 'ok'") } catch (e) {}
  // FRESH START (Jul 31, JV): every bot launch is a new test — wipe any mid-run save
  // so data never begins mid-story. (Mid-session rig-heals do NOT re-run this.)
  try { await P.evaljs("localStorage.removeItem('vst_save_v4'); location.reload(); 'fresh'"); await new Promise(r => setTimeout(r, 4000)) } catch (e) {}
  resetRunEconomy()
  ev('fresh_start', { note: 'save wiped at launch' })
  // Aug 1 FORENSIC TAP: pipe the game's own console into the ledger. triggerVictory
  // logs [VICTORY] + caller stack — this catches the phantom-victory bug (Lucifer
  // died at 76k, Executive at 85k) red-handed with a stack trace next time it fires.
  try {
    const pg = await P0.connect()
    pg.on('console', m => {
      const txt = m.text()
      if (/\[VICTORY\]|\[DEBUG-WIN\]|RENDER ERROR|is not defined|Uncaught|TypeError|ReferenceError/.test(txt)) {
        ev('game_console', { line: txt.slice(0, 600) })
      }
    })
    pg.on('pageerror', e2 => ev('game_pageerror', { msg: String(e2 && e2.message || e2).slice(0, 400) }))
  } catch (e) {}
  let tick = 0, opTimeouts = 0, winCount = 0
  // Fires on the SAME 60s budget as the in-loop check, but from outside the loop
  // so a hung await or an error-path `continue` cannot suppress it.
  startHardWatchdog(STALL_MS, () => {
    preferNewRun = true
    P0.reset().catch(() => {})
    P.evaljs("localStorage.removeItem('vst_save_v4'); setTimeout(()=>location.reload(),50); 'x'").catch(() => {})
  })
  const origEv = ev
  // rig self-heal: 3 consecutive op timeouts = degraded CDP session → restart Electron,
  // reconnect. Game state survives in localStorage (vst_save mid-fight snapshot).
  global.__opTimeout = async () => {
    opTimeouts++
    if (opTimeouts >= 3) {
      origEv('rig_heal', { msg: 'restarting electron after ' + opTimeouts + ' op timeouts' })
      try {
        if (process.platform === 'win32') {
          // Aug 1: self-heal was Linux-only, so on JV's Windows box a dead Electron
          // could never be revived and the run was lost for the night.
          require('child_process').execSync('taskkill /F /IM electron.exe /T', { timeout: 30000, stdio: 'ignore' })
        } else {
          require('child_process').execSync('pkill -f "electron ./e2e/driver" 2>/dev/null; pkill Xvfb 2>/dev/null; sleep 2; bash ' + path.join(__dirname, 'up.sh'), { timeout: 60000 })
        }
      } catch (e) { origEv('rig_heal_err', { msg: String(e.message).slice(0, 100) }) }
      await P0.reset(); opTimeouts = 0
      await new Promise(r => setTimeout(r, 4000))
    }
  }
  while (Date.now() - t0 < maxMs) {
    tick++
    if (tick % 10 === 0) ev('heartbeat', { tick })
    let s
    try { s = await P.state(); opTimeouts = 0 }
    catch (e) {
      // Aug 1: this used to `continue`, skipping the stall check entirely — the
      // exact path that let a session spin on ECONNREFUSED for hours. Now the
      // error itself is progress-less by definition, so we fall through to the
      // watchdog by leaving PROGRESS.at untouched, and try to revive the rig.
      ev('error', { msg: e.message })
      if (/op timeout|ECONNREFUSED|Target closed|browser has been closed/i.test(e.message)) await global.__opTimeout()
      await new Promise(r => setTimeout(r, 3000))
      continue
    }
    const hash = s.text.slice(0, 500)
    stuck = (hash === lastHash) ? stuck + 1 : 0; lastHash = hash
    const type = await screenType(s)
    // ── 60-SECOND STALL WATCHDOG (JV, Aug 1) ────────────────────────────
    // Absolute wall-clock guard, independent of the click-based `stuck`
    // counter (which the audit showed could be reset forever by a button that
    // matches but doesn't advance — that's how a 6-hour session was lost).
    // If the SCREEN TEXT has not changed in 60s: log exactly what we were
    // looking at, wipe the save, and start a clean run from Circle 1.
    if (hash !== lastProgressHash) { lastProgressHash = hash; lastProgressAt = Date.now() }
    markProgress(hash) // feeds the out-of-loop HARD watchdog
    if (Date.now() - lastProgressAt > STALL_MS) {
      const shot = await P.shot('stall-' + Date.now()).catch(() => null)
      ev('STALL_RESTART', {
        stalledSeconds: Math.round((Date.now() - lastProgressAt) / 1000),
        screenType: type, shot,
        clickables: s.clickables.slice(0, 12).map(c => c.t.slice(0, 40)),
        text: s.text.slice(0, 700)
      })
      stallRestarts++
      await P.evaljs("localStorage.removeItem('vst_save_v4'); setTimeout(()=>location.reload(),50); 'x'").catch(() => {})
      await new Promise(r => setTimeout(r, 5000))
      preferNewRun = true
      lastProgressAt = Date.now(); lastProgressHash = ''; lastHash = ''; stuck = 0
      resetRunEconomy()
      emitRunSummary('abandoned_stall')
      ev('run_restart', { reason: 'stall watchdog', totalStallRestarts: stallRestarts })
      // Aug 4: tripUsedThisFight (and the chain/strike-id per-fight state) was NOT
      // reset here, so the first fight after every stall restart could never spend
      // a trip. startRun() clears the whole per-fight block in one place.
      await startRun('stall_restart', { totalStallRestarts: stallRestarts })
      continue
    }
    if (stuck >= 6) {
      const f = await P.shot('stuck-' + Date.now()); ev('stuck', { type, shot: f, text: s.text.slice(0, 800) })
      // Aug 1: only reset `stuck` when the click actually MOVED the game. The
      // old code zeroed it on a successful click attempt, so any screen with a
      // matching-but-inert button looped forever without ever escalating.
      for (const b of OVERLAY_BTNS) {
        try {
          await P.clickText(b)
          const after = (await P.state().catch(() => ({ text: '' }))).text.slice(0, 500)
          if (after !== hash) { stuck = 0 }
          break
        } catch (e) {}
      }
      if (stuck >= 10) {
        recoveries++
        if (recoveries > 3) { ev('abort', { msg: 'hard stuck after 3 recoveries' }); emitRunSummary('abandoned_abort', { reason: 'hard stuck after 3 recoveries' }); break }
        ev('recover', { attempt: recoveries, type })
        await P.key('Escape').catch(() => {}); await P.key('Escape').catch(() => {})
        for (const b of ['back to the pit', 'skip', 'continue', 'got it']) { try { await P.clickText(b); break } catch (e) {} }
        if ((await P.state().catch(() => ({ text: '' }))).text.slice(0, 300) === lastHash) {
          await P.evaljs("location.reload(); 'x'").catch(() => {}) // save survives — resumes the run
          await new Promise(r => setTimeout(r, 5000))
        }
        stuck = 0; lastHash = ''
      }
    }
    try {
      if (type === 'popup') { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e) {} } }
      else if (type === 'modal') await modalTick(s)
      else if (type === 'event') await eventTick(s)
      else if (type === 'pact') await pactTick(s)
      else if (type === 'forge') await forgeTick(s)
      else if (type === 'boosterpick') await forgeTick(s) // same shape: card tiles, pick best, confirm
      else if (type === 'credits') { ev('credits_seen', {}); const vp = await P.evaljs('({w:innerWidth,h:innerHeight})'); await P.click(Math.round(vp.w / 2), Math.round(vp.h / 2)) }
      else if (type === 'pause') { await P.key('Escape').catch(() => {}) }
      else if (type === 'splash' || type === 'boot') { const vp = await P.evaljs('({w:innerWidth,h:innerHeight})').catch(() => null); if (vp) await P.click(Math.round(vp.w / 2), Math.round(vp.h * 0.9)).catch(() => {}) }
      else if (type === 'demonicconflict') {
        // Two DEMONIC members can't coexist. Keep the higher ATK+HP one.
        const opts = s.clickables.filter(c => /ATK\s*\d/.test(c.t))
        const val = t => (+((t.match(/ATK\s*(\d+)/) || [0, 0])[1])) * 3 + (+((t.match(/HP\s*(\d+)/) || [0, 0])[1]))
        const best = opts.sort((a, b) => val(b.t) - val(a.t))[0]
        ev('demonic_conflict', { picked: best ? best.t.slice(0, 40) : 'none', of: opts.length })
        if (best) await P.click(best.x, best.y)
        else for (const b of ['keep', 'confirm', 'continue']) { try { await P.clickText(b); break } catch (e) {} }
      }
      else if (type === 'slotswap') {
        // Artifact/pedal slots full — swap out the cheapest owned item.
        const owned = s.clickables.filter(c => /\d/.test(c.t) && c.t.length < 60 && !/CANCEL|KEEP/i.test(c.t))
        ev('slot_swap', { options: owned.length })
        if (owned.length) await P.click(owned[0].x, owned[0].y)
        else for (const b of ['cancel', 'keep current']) { try { await P.clickText(b); break } catch (e) {} }
      }
      else if (type === 'pawn') { for (const b of ['close', 'back', 'done']) { try { await P.clickText(b); break } catch (e) {} } await P.key('Escape').catch(() => {}) }
      else if (type === 'meta') {
        // Collection / trophies / achievements — leave via back/escape, then menu handler restarts
        ev('meta_screen', { text: s.text.slice(0, 60) })
        let out = false
        for (const b of ['back', 'close', 'menu', 'main menu', '✕', 'x']) { try { await P.clickText(b); out = true; break } catch (e) {} }
        if (!out) await P.key('Escape').catch(() => {})
      }
      else if (type === 'wth') {
        const f = await P.shot('wth-' + Date.now())
        ev('wth_screen', { shot: f, text: s.text.slice(0, 600) })
        // accept the Executive if offered — more coverage; fall back to any big button
        let done = false
        for (const b of ['sign', 'accept', 'enter', 'fight', 'bring it']) { try { await P.clickText(b); done = true; break } catch (e) {} }
        if (!done) { const big = s.clickables.filter(c => c.w > 150 && c.h > 40)[0]; if (big) await P.click(big.x, big.y) }
      }
      else if (type === 'descent') await descentTick(s)
      else if (type === 'combat') await combatTick(s)
      else if (type === 'shop') await shopTick(s)
      else if (type === 'recruit') await recruitTick(s)
      else if (type === 'draft') await draftTick(s)
      else if (type === 'menu') {
        // Aug 4: run_start used to fire on EVERY menu tick (18 rows for 58 runs,
        // and never on the path that actually mattered). One row per run now.
        const first = preferNewRun ? ['enter the vestibule', 'skip tutorial'] : ['continue', 'skip tutorial', 'enter the vestibule']
        let entered = false
        for (const b of first) { try { await P.clickText(b); entered = true; break } catch (e) {} }
        if (entered) { const wasNew = preferNewRun; preferNewRun = false; if (!runActive) await startRun('menu', { preferNewRun: wasNew }) }
      }
      else if (type === 'death') {
        const f = await P.shot('death-' + Date.now())
        ev('run_end', { result: 'death', shot: f, text: s.text.slice(0, 1200) })
        emitRunSummary('death', { deathText: s.text.slice(0, 220).replace(/\n/g, ' | ') })
        resetRunEconomy()
        // ── Aug 4 2026: THE RUN-FUSION BUG ────────────────────────────
        // "play again" restarts the game WITHOUT passing through the menu, so no
        // run_start was ever written and the analyzer glued the next run onto this
        // one. 58 run_end events came back as 17 runs and the win rate read 18%
        // instead of the true 3/58 (~5%). Emit run_start immediately after the click.
        let again = false
        for (const b of ['play again', 'try again']) { try { await P.clickText(b); again = true; break } catch (e) {} }
        if (again) await startRun('play_again_after_death')
        else { runActive = false; preferNewRun = true }
      }
      else if (type === 'victory') {
        // Aug 3 2026: this used to `break`, ENDING THE WHOLE SESSION on a win. JV left
        // the bot for a day and got 22 minutes of data because it "won" at 06:03 and
        // stopped. An overnight grind wants MANY runs — a victory is the end of a run,
        // not the end of the night. Record it, then start a fresh run and keep going.
        const f = await P.shot('VICTORY-' + Date.now())
        winCount++
        ev('run_end', { result: 'VICTORY', wins: winCount, shot: f, text: s.text.slice(0, 2000) })
        emitRunSummary('VICTORY')
        const vp = await P.evaljs('({w:innerWidth,h:innerHeight})').catch(() => null)
        if (vp) await P.click(Math.round(vp.w / 2), Math.round(vp.h * 0.9)).catch(() => {})
        await P.evaljs("localStorage.removeItem('vst_save_v4'); setTimeout(()=>location.reload(),50); 'x'").catch(() => {})
        await new Promise(r => setTimeout(r, 5000))
        preferNewRun = true
        resetRunEconomy()
        lastHash = ''; stuck = 0
        // Aug 4: tripUsedThisFight was NOT reset on this path, so the first fight
        // of the run after every victory could never spend a trip. startRun()
        // clears the whole per-fight block (and stamps the deck) in one place.
        await startRun('after_victory', { afterWin: true })
      }
      else { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e) {} } ev('unknown_screen', { text: s.text.slice(0, 300) }) }
    } catch (e) { ev('error', { msg: e.message, type }); if (/op timeout/.test(e.message)) await global.__opTimeout() }
    await new Promise(r => setTimeout(r, 800))
  }
  // Aug 4: EVERY terminal path emits a run_summary. Before today `run_summary`
  // had never once appeared in the ledger, so the analyzer had to reconstruct
  // outcomes from raw rows and silently fused runs together.
  emitRunSummary('abandoned_session_end', { reason: 'max minutes reached' })
  ev('session', { msg: 'autopilot loop end', minutes: ((Date.now() - t0) / 60000).toFixed(1) })
  process.exit(0)
}
// Aug 1: export the perception + policy internals so they can be unit-tested
// against a live game instead of only being exercised inside a 6-hour run.
module.exports = { perceive, screenType, combatTick, shopTick }
if (require.main === module) main()
