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
      if (typeof d.fightIndex === 'number' && d.fightIndex > RUN.deepestFight) {
        RUN.deepestFight = d.fightIndex; RUN.deepestCircle = Math.floor(d.fightIndex / 3) + 1
      }
      if (typeof d.bandAtk === 'number' && d.bandAtk > RUN.peakBandAtk) RUN.peakBandAtk = d.bandAtk
    } else if (type === 'descent') RUN.deepestBoss = String(d.pick || '').slice(0, 40)
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
async function perceive() {
  const raw = await P.evaljs(`(() => {
    const num = t => { const m = String(t).replace(/,/g,'').match(/-?\\d+/); return m ? +m[0] : null }
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const out = { miss: [] }

    // ── corruption: the stamp span carries key 'c-<n>' and reads "<n>%" ──
    let corr = null
    for (const el of document.querySelectorAll('span,div')) {
      const t = (el.textContent || '').trim()
      if (/^\\d{1,3}%$/.test(t) && el.children.length === 0 && vis(el)) { corr = num(t); break }
    }
    // Only a real defect if we're IN COMBAT (the stamp doesn't exist elsewhere).
    // Combat is identified by the boss HP readout below, so defer the miss flag.
    out._corrMissing = corr === null
    out.corruption = corr === null ? 0 : corr

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
        name: nm[1], atk: (+atk[1]) + (+(atk[2] || 0)), hp: hp ? +hp[1] : 0, maxHp,
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
  if (raw && raw.miss && raw.miss.length) ev('parse_miss', { fields: raw.miss })
  return raw
}

const BRAIN = require('./brain.cjs')
let strikeNumThisFight = 0, lastBossHp = null
let zeroStrikeTicks = 0, preferNewRun = false

async function combatTick(s) {
  // ── EXPERT COMBAT (Aug 1 2026 rebuild) ──────────────────────────────
  // Sequence a 1000-hour player uses: read the board -> dig for a live hand
  // BEFORE spending embers -> play greedily by the sim's validated policy,
  // re-reading state after EVERY card -> hold a clutch trip -> strike.
  let g = await perceive()
  if (g.bossHp !== null && g.bossMaxHp && g.bossHp === g.bossMaxHp) {
    strikeNumThisFight = 0; playedIdsThisFight.length = 0; firedChainsThisFight = new Set(); hrUsedThisFight.clear(); tripUsedThisFight = false
  }
  lastBossHp = g.bossHp

  const aliveOf = gg => gg.members.filter(m => !m.tooStoned)
  if (!aliveOf(g).length) {
    ev('warn', { msg: 'no members parsed — using fixed slot fallback' })
    const vp = await P.evaljs('({w:innerWidth,h:innerHeight})')
    g.members = [{ name: 'slot1', atk: 1, hp: 5, maxHp: 5, tooStoned: false, keyword: '', role: '', tier: '', x: Math.round(vp.w * 0.38), y: Math.round(vp.h * 0.44) },
                 { name: 'slot2', atk: 0, hp: 5, maxHp: 5, tooStoned: false, keyword: '', role: '', tier: '', x: Math.round(vp.w * 0.53), y: Math.round(vp.h * 0.44) }]
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

  // playable = matched + affordable + corruption gate satisfied at its REAL threshold
  const playableIn = (gg, skipIds) => gg.hand
    .map(c => ({ ...c, card: BRAIN.matchCard(c.name) }))
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
    const before = { e: g.embers, d: g.discardLen }
    await P.playCard(c.x, c.y, tgt.x, tgt.y)
    g = await perceive()
    if (g.embers !== before.e || g.discardLen !== before.d) {
      played++; failStreak = 0; playedIdsThisFight.push(c.card.id)
      if (c.card.id === 'heavyriff') hrUsedThisFight.add(tgt.name)   // once per member per fight
      for (const ch of BRAIN.RIFF_CHAINS) { const ck = ch[0] + '+' + ch[1]; if (!firedChainsThisFight.has(ck) && playedIdsThisFight.includes(ch[0]) && playedIdsThisFight.includes(ch[1])) { firedChainsThisFight.add(ck); ev('chain_fired', { chain: ck }) } }
      ev('play', { card: c.card.id, score: c.score, cost: c.cost, target: tgt.name, embers: g.embers, corr: g.corruption })
    } else {
      failStreak++; failedIds.add(c.card.id)
      ev('play_fail', { card: c.card.id, cost: c.cost, embers: g.embers, corr: g.corruption })
      await P.click(c.x, c.y).catch(() => {})    // deselect
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
    if (pick) { tripUsedThisFight = true; ev('trip_used', { btn: pick.t, bossPct: (bossPct * 100).toFixed(0), strikesLeft: g.strikesLeft, why: g.overtime ? 'overtime' : bandHurt ? 'band<40%hp' : 'low strikes' }); await P.click(pick.x, pick.y); await P.connect().then(p => p.waitForTimeout(1500)); g = await perceive() }
  }

  // Aug 3: skip strikes fired during fight-to-fight transitions (bossHp=None).
  // FIRST ATTEMPT was too aggressive — it also skipped REAL strikes whenever the
  // damage-cascade overlay covered the HP readout (48 skipped in one 8-min test,
  // so fights never resolved). The authoritative signal is the STRIKE BUTTON: if
  // the game is offering one, we are in a fight, whatever the HP text looks like.
  if (g.bossHp === null) {
    const sNow = await P.state().catch(() => null)
    const hasStrikeBtn = sNow && sNow.clickables.some(c => /STRIKE/i.test(c.t) && !/DISCARD/i.test(c.t))
    if (!hasStrikeBtn) { ev('strike_skipped', { why: 'no boss HP and no strike button (transition)' }); return }
  }
  const _bandAtk = aliveOf(g).reduce((a, m) => a + (m.atk || 0), 0)
  // Aug 3 2026 — PROOF-OF-REAL-RUN TELEMETRY. Log boss HP before AND after the
  // strike resolves, plus the damage actually dealt and the band's ATK. A genuine
  // kill shows dmg >= hpBefore with a band big enough to explain it; the phantom
  // victory that ate the Aug 3 night showed a boss at 330,548 HP "dying" to a band
  // dealing ~2k. With these fields, any faked kill is arithmetic anyone can catch.
  const _hpBefore = g.bossHp
  ev('strike', { strikes: g.strikesLeft, overtime: g.overtime, bossHp: _hpBefore, bossMaxHp: g.bossMaxHp, bandAtk: _bandAtk, aliveMembers: aliveOf(g).length, played, embers: g.embers, corr: g.corruption, chains: firedChainsThisFight.size, fightIndex: g.fightIndex, cards: playedIdsThisFight.slice(-played) })
  strikeNumThisFight++
  await P.clickText('strike').catch(e => ev('warn', { msg: 'strike btn: ' + e.message }))
  await P.connect().then(p => p.waitForTimeout(1800))
  // measure what the strike ACTUALLY did — the audit trail that distinguishes a
  // real kill from a race condition
  try {
    const after = await perceive()
    const hpAfter = after.bossHp
    if (_hpBefore !== null && hpAfter !== null) {
      ev('strike_result', { fightIndex: g.fightIndex, hpBefore: _hpBefore, hpAfter, dmg: _hpBefore - hpAfter, bandAtk: _bandAtk, ratio: +((_hpBefore - hpAfter) / Math.max(1, _bandAtk)).toFixed(1) })
    } else if (_hpBefore !== null && hpAfter === null) {
      ev('strike_result', { fightIndex: g.fightIndex, hpBefore: _hpBefore, hpAfter: 'gone', dmg: _hpBefore, bandAtk: _bandAtk, note: 'boss died or fight ended' })
    }
  } catch (e) {}
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
  cardsPlayed: {}, strikes: 0, fails: 0, chains: 0, trips: 0, digs: 0,
  relics: [], pedals: [], packs: 0, recruits: [], pacts: [], forges: [],
  peakCorruption: 0, peakBandAtk: 0, maxBossHpSeen: 0, overtimeStrikes: 0
}
function runReset() {
  RUN.n++; RUN.startedAt = Date.now(); RUN.deepestFight = -1; RUN.deepestCircle = 0; RUN.deepestBoss = ''
  RUN.cardsPlayed = {}; RUN.strikes = 0; RUN.fails = 0; RUN.chains = 0; RUN.trips = 0; RUN.digs = 0
  RUN.relics = []; RUN.pedals = []; RUN.packs = 0; RUN.recruits = []; RUN.pacts = []; RUN.forges = []
  RUN.peakCorruption = 0; RUN.peakBandAtk = 0; RUN.maxBossHpSeen = 0; RUN.overtimeStrikes = 0
}
function emitRunSummary(outcome, extra) {
  ev('run_summary', Object.assign({
    run: RUN.n, outcome,
    minutes: +((Date.now() - RUN.startedAt) / 60000).toFixed(1),
    deepestFight: RUN.deepestFight, deepestCircle: RUN.deepestCircle, deepestBoss: RUN.deepestBoss,
    strikes: RUN.strikes, playFails: RUN.fails, chains: RUN.chains, trips: RUN.trips, digs: RUN.digs,
    overtimeStrikes: RUN.overtimeStrikes, peakCorruption: RUN.peakCorruption,
    peakBandAtk: RUN.peakBandAtk, maxBossHp: RUN.maxBossHpSeen,
    relics: RUN.relics, pedals: RUN.pedals, packsBought: RUN.packs,
    recruits: RUN.recruits, pacts: RUN.pacts, forgeUpgrades: RUN.forges,
    distinctCards: Object.keys(RUN.cardsPlayed).length,
    cardsPlayed: RUN.cardsPlayed
  }, extra || {}))
  runReset()
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
    const domCount = await P.evaljs(`(() => {
      const strip = [...document.querySelectorAll('div')].find(d => /STAGE ORDER/i.test(d.textContent || ''))
      if (!strip) return null
      return (strip.textContent.match(/⟩/g) || []).length
    })()`).catch(() => null)
    bandSize = domCount
    if (bandSize === null) ev('parse_miss', { field: 'bandSize', note: 'member packs skipped this shop' })
  }
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
    ev('shop_buy', { label: (label + ': ' + c.t).slice(0, 60), why, stash, bandSize, matched: used })
    await P.click(c.x, c.y); return true
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
    // never sign Lucifer: 3-member cap + dies-ends-run risk isn't in the sim's model
    const safe = scored.filter(c => !/FALLEN|The Devil/i.test(c.t))
    const pickFrom = safe.length ? safe : scored
    const bestSafe = pickFrom.sort((a, b) => (b.p + (counts[b.kw] > 1 ? 15 : 0)) - (a.p + (counts[a.kw] > 1 ? 15 : 0)))[0]
    // Aug 3 2026 BALANCE TELEMETRY: log what was OFFERED, not just what was taken.
    // Without the rejected options you cannot tell an unpopular member from one that
    // never appeared — which is exactly the "band members that are always skipped"
    // question this playtest exists to answer.
    ev('recruit_options', {
      offered: scored.map(c => ({ name: (c.t.match(/([A-Z][a-z]+)/) || [])[1] || c.t.slice(0, 14), kw: c.kw, score: c.p })),
      picked: (bestSafe.t.match(/([A-Z][a-z]+)/) || [])[1] || bestSafe.t.slice(0, 14)
    })
    ev('recruit_pick', { pick: bestSafe.t.slice(0, 50), score: bestSafe.p })
    // Aug 1: a recruit click that silently misses used to hang here until the 60s
    // watchdog restarted the run (observed once in a 3-minute smoke run). Verify
    // the screen actually moved; retry at the card's upper third, which is inside
    // the portrait rather than the description text, before giving up and passing.
    const beforeSig = s.text.slice(0, 300)
    await P.click(bestSafe.x, bestSafe.y)
    await P.connect().then(p => p.waitForTimeout(600))
    let moved = (await P.state().catch(() => ({ text: '' }))).text.slice(0, 300) !== beforeSig
    if (!moved) {
      await P.click(bestSafe.x, Math.round(bestSafe.y - (bestSafe.h || 120) * 0.3)).catch(() => {})
      await P.connect().then(p => p.waitForTimeout(700))
      moved = (await P.state().catch(() => ({ text: '' }))).text.slice(0, 300) !== beforeSig
      ev('recruit_retry', { worked: moved })
      if (!moved) { try { await P.clickText('pass') } catch (e) {} }
    }
    const after = await P.state()
    const at = after.text.toUpperCase()
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
    const stillRecruit = await P.state().then(st => screenType(st)).catch(() => 'unknown')
    if (stillRecruit === 'recruit') {
      for (const b of ['add to band', 'confirm', 'take', 'join']) { try { await P.clickText(b); break } catch (e) {} }
    }
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
  const noDevil = list => list.filter(c => !/FALLEN|The Devil/i.test(c.t)) // fair tests never draft Lucifer
  let st = s
  for (let attempt = 0; attempt < 8; attempt++) {
    const ready = stageBtn(st)
    if (ready) {
      const seed = (st.text.match(/RUN SEED:\s*([A-Z0-9]+)/i) || [])[1]
      ev('draft_confirm', { attempt, seed })
      await P.click(ready.x, ready.y); return
    }
    const cand = noDevil(st.clickables.filter(c => /ATK\d/.test(c.t.replace(/\s/g, '')))).map(c => {
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
    if (attempt === 0) {
      // full opening slate — lets the report compute per-member draft pick rates
      ev('draft_options', { offered: cand.map(c => ({ name: (c.t.match(/([A-Z][a-z]+)/) || [])[1] || c.t.slice(0, 14), kw: c.kw, score: c.score })) })
    }
    ev('draft_click', { attempt, pick: pick.t.slice(0, 30), name: (pick.t.match(/([A-Z][a-z]+)/) || [])[1] || '' })
    await P.click(pick.x, pick.y)
    await P.connect().then(p => p.waitForTimeout(500))
    st = await P.state()
  }
  const f = await P.shot('draft-confused-' + Date.now())
  ev('draft_confused', { msg: '8 attempts, no TAKE THE STAGE', shot: f })
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
  try { build = require('child_process').execSync('git -C ' + JSON.stringify(path.join(__dirname, '..')) + ' log --oneline -1').toString().trim().slice(0, 50) } catch (e) {}
  ev('session', { msg: 'autopilot v2 start', build })
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
      strikeNumThisFight = 0; playedIdsThisFight.length = 0; firedChainsThisFight = new Set(); hrUsedThisFight.clear()
      resetRunEconomy()
      emitRunSummary('abandoned_stall')
      ev('run_restart', { reason: 'stall watchdog', totalStallRestarts: stallRestarts })
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
        if (recoveries > 3) { ev('abort', { msg: 'hard stuck after 3 recoveries' }); break }
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
        ev('run_start', { preferNewRun })
        if (preferNewRun) { preferNewRun = false; await P.clickText('enter the vestibule').catch(() => P.clickText('skip tutorial').catch(() => {})) }
        else await P.clickText('continue').catch(() => P.clickText('skip tutorial').catch(() => P.clickText('enter the vestibule')))
      }
      else if (type === 'death') {
        const f = await P.shot('death-' + Date.now())
        ev('run_end', { result: 'death', shot: f, text: s.text.slice(0, 1200) })
        emitRunSummary('death', { deathText: s.text.slice(0, 220).replace(/\n/g, ' | ') })
        resetRunEconomy()
        strikeNumThisFight = 0; playedIdsThisFight.length = 0; firedChainsThisFight = new Set(); hrUsedThisFight.clear(); tripUsedThisFight = false
        await P.clickText('play again').catch(() => P.clickText('try again').catch(() => {}))
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
        strikeNumThisFight = 0; playedIdsThisFight.length = 0; firedChainsThisFight = new Set(); hrUsedThisFight.clear()
        lastHash = ''; stuck = 0
        ev('run_start', { preferNewRun: true, afterWin: true })
      }
      else { for (const b of OVERLAY_BTNS) { try { await P.clickText(b); break } catch (e) {} } ev('unknown_screen', { text: s.text.slice(0, 300) }) }
    } catch (e) { ev('error', { msg: e.message, type }); if (/op timeout/.test(e.message)) await global.__opTimeout() }
    await new Promise(r => setTimeout(r, 800))
  }
  ev('session', { msg: 'autopilot loop end', minutes: ((Date.now() - t0) / 60000).toFixed(1) })
  process.exit(0)
}
// Aug 1: export the perception + policy internals so they can be unit-tested
// against a live game instead of only being exercised inside a 6-hour run.
module.exports = { perceive, screenType, combatTick, shopTick }
if (require.main === module) main()
