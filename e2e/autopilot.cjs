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
  // ── Aug 4 2026: THE STRIKE BUTTON, NOT THE WORD "STRIKE" ────────────
  // `btn('strike')` was a SUBSTRING test over every clickable's text, and half the
  // relic pool describes itself with the word: "Solo Sermon x6.0 if EXACTLY 2
  // cards played this strike", "Resonance Coil x1.2 for each duplicate card
  // PLAYED this Strike", "Spit Cup x1.5 if you discarded >=1 card this STRIKE".
  // Those tiles are clickables ON THE SHOP SCREEN, so any shop that happened to
  // roll one of them was classified as COMBAT — combatTick then hunted for a hand
  // that does not exist, never pressed "Back to the Pit", and the run wedged.
  // This is not hypothetical: the 18.7-minute pre-change baseline died exactly
  // that way at 10:19 (15 stuck rows on "SLY'S MERCH" typed as combat, then two
  // ACTION_STALL windows and a HARD_EXIT).
  // The real button is <button>⛧ STRIKE ⛧</button> (App.jsx ~12244) and nothing
  // else in the game renders that as its whole label.
  const strikeBtn = s.clickables.some(c => /^[⛧\s]*strike[⛧\s]*$/i.test((c.t || '').trim()))
  // ── Aug 4 2026: GLOBAL OVERLAYS ARE TESTED FIRST ────────────────────
  // These four render at z-index 9998/9999 OVER whatever screen is underneath,
  // and the screen underneath keeps all of its own text and clickables in the
  // DOM. Every one of them used to be tested BELOW `btn('strike')` -> 'combat'
  // and BELOW 'BACK TO THE PIT' -> 'shop', so:
  //   * ESC pause over combat classified as COMBAT. The bot then played cards
  //     into a blocked overlay, nothing landed, and it sat there until the 60s
  //     stall watchdog wiped the run. As of today the pause overlay renders on
  //     EVERY screen and the bot's own recovery paths press Escape, so this was
  //     a guaranteed hang, not a theoretical one.
  //   * The slot-swap modal (also new today) classified as SHOP. Every click the
  //     shop logic then made landed on the modal's full-screen backdrop, whose
  //     onClick is cancelSlotSwap — so buying gear with full slots was an
  //     infinite buy/cancel loop and the modal was unreachable by construction.
  if (t.includes('PAUSED') || btn('abandon run')) return 'pause'
  if (/ARTIFACT SLOTS FULL|PEDAL SLOTS FULL|SLOTS FULL/.test(t)) return 'slotswap'
  if (/DEMONIC CONFLICT|KEEP THIS ONE/.test(t)) return 'demonicconflict'
  if (/THE REMASTER/.test(t) && btn('confirm')) return 'modal'
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
  if (t.includes('WELCOME TO HELL') && !strikeBtn) return 'wth'
  if (t.includes('THE PACT')) return 'pact'
  if (!_shopish && t.includes('DOOM FORGE')) return 'forge'
  if (t.includes('— OR —') || t.includes('OR —')) return 'event'
  if (t.includes('THE DESCENT') && t.includes('SELECT THIS PATH')) return 'descent'
  if (t.includes('OPENING NIGHT')) return 'draft'
  // Shop before combat: the shop legitimately renders no strike button, but this
  // ordering is the belt to the strikeBtn braces above.
  if (_shopish && !strikeBtn) return 'shop'
  if (strikeBtn) return 'combat'
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
  if (/COLLECTION|DISCOVERED|TROPHY|TROPHIES|ACHIEVEMENTS|HALL OF/.test(t) && !strikeBtn) return 'meta'
  // ── Aug 1 2026: every screen the Aug-1 audit found landing on 'unknown'.
  // An unclassified screen means the bot stares at it until the watchdog fires;
  // one of them (post-credits Collection) ate 5.4 hours of a 6-hour session.
  // (pause / slotswap / demonicconflict / remaster are tested at the TOP now)
  if (/NOW DISCARD \d+ TO CONTINUE|SETLIST/.test(t) && btn('confirm')) return 'modal'
  if (/PAWN SHOP/.test(t)) return 'pawn'
  if (/PRESS ANY KEY|TONIGHT ONLY/.test(t)) return 'boot'
  if (/⛧ ENTERING ⛧|ENTERING/.test(t) && !strikeBtn) return 'splash'   // circleSplash: no clickables, auto-clears in 3s
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
      const kw = (flat.match(/(FRENZIED|BLASTBEAT|TRICKSTER|ANCHOR|CORRUPT|DEBUFF|FOLK MAGIC|SHREDDER|HEXED|FALLEN)/) || [])[1] || ''
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
    // ── OWNED ARTIFACTS + PEDALS (Aug 4 2026) ─────────────────────────────
    // THE relic-blindness fix. App.jsx ~11868 renders a fixed rail down the left
    // of the stage: three 100x108 artifact tiles then two 100x108 pedal tiles,
    // ALWAYS all five, empty ones printing the placeholder word "Artifact" /
    // "Effect Pedal". A filled tile prints the item's NAME (and "xN" for a
    // multiplier artifact) — exactly the text a human reads off the screen. Slot
    // identity comes from vertical order, which is fixed by the layout, so the
    // 3-artifact / 2-pedal split needs no colour or id inspection.
    out.gearRail = (() => {
      const els = []
      for (const d of document.querySelectorAll('div')) {
        const r = d.getBoundingClientRect()
        if (r.width < 96 || r.width > 104 || r.height < 104 || r.height > 112) continue
        if (!vis(d)) continue
        els.push(d)
      }
      // Each slot matches TWICE: the position:relative wrapper (which also holds
      // the absolutely-positioned hover tooltip, so its textContent is the name
      // AND the full effect text) and the tile itself. Keep the innermost, which
      // is the tile — its text is just the name (+ "xN").
      const inner = els.filter(d => !els.some(o => o !== d && d.contains(o)))
      if (inner.length < 5) return null
      const boxes = inner.map(d => { const r = d.getBoundingClientRect(); return { x: r.x, y: r.y, t: (d.textContent || '').replace(/\\s+/g, ' ').trim() } })
      // The rail is one column down the left of the stage: leftmost x, top-to-bottom.
      const minX = Math.min(...boxes.map(b => b.x))
      const col = boxes.filter(b => b.x <= minX + 8).sort((a, b) => a.y - b.y)
      if (col.length < 5) return null
      return col.slice(0, 5).map(b => b.t)
    })()
    out.hand.sort((a, b) => a.x - b.x).forEach(c => { delete c._area })
    out.members.forEach(m => { delete m._area })
    return out
  })()`)
  if (raw && raw.inCombat && raw._corrMissing) (raw.miss = raw.miss || []).push('corruption')
  // Translate the rail's screen text into ids. Kept OUT of the page eval so the
  // relic table (parsed from src/data/relics.js by brain.cjs) stays in one place.
  if (raw) {
    raw.artifacts = []; raw.pedals = []
    if (raw.gearRail) {
      raw.gearRail.forEach((txt, i) => {
        if (!txt || /^(⛧\s*)?artifact$/i.test(txt) || /^(⚡\s*)?effect\s*pedal$/i.test(txt)) return
        const d = BRAIN.matchRelic(txt.replace(/×[\d.]+\s*$/, ''))
        if (!d) { noteUnknownGear(txt, i); return }
        if (i < 3) raw.artifacts.push(d.id); else raw.pedals.push(d.id)
      })
      OWNED.artifacts = raw.artifacts; OWNED.pedals = raw.pedals
    } else { raw.artifacts = OWNED.artifacts.slice(); raw.pedals = OWNED.pedals.slice() }
    raw.loot = OWNED.loot.slice()
    // Cache the band with its live ATK/HP/keyword/role/tier. The shop and the
    // recruit screen only show names (or a card with no history), so the last
    // combat read is the best picture of the band those screens can score against.
    if (raw.members && raw.members.length) {
      OWNED.band = raw.members.map(m => ({ name: m.name, role: m.role, keyword: m.keyword, tier: m.tier, atk: m.atk, hp: m.hp, maxHp: m.maxHp, tooStoned: m.tooStoned }))
    }
  }
  if (!(opts && opts.quiet) && raw && raw.miss && raw.miss.length) ev('parse_miss', { fields: raw.miss, corrSource: raw.corrSource })
  return raw
}

const BRAIN = require('./brain.cjs')
// ── OWNED GEAR (Aug 4 2026) ───────────────────────────────────────────
// Artifacts and pedals are re-read off the HUD rail on every perceive(); this
// cache only covers the screens where the rail is not on screen (shop, forge,
// pact) so the shop can still evaluate an offer against what the run owns.
// `loot` cannot be re-read at all — boss loot is applied to damage (App.jsx
// ~8903) but never rendered in combat. The only place the player is ever told
// they got it is the combat log ("🏆 Boss Loot: ..."), so that is where the bot
// reads it too, and it is remembered for the rest of the run.
const OWNED = { artifacts: [], pedals: [], loot: [], band: [] }
const _unknownGear = new Set()
function noteUnknownGear(txt, slot) {
  const k = String(txt).slice(0, 40)
  if (_unknownGear.has(k)) return
  _unknownGear.add(k)
  ev('gear_unmatched', { text: k, slot })
}
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
// CURSOR, not an occurrence count. window.__devLog is APPEND-ONLY for the whole
// run — it is NOT cleared between fights (only the on-screen log panel is). The
// old code counted occurrences per distinct line and cleared that map at every
// fight boundary, so after each fight EVERY historical chain line re-counted as
// new. Measured on JV's Aug-4 ledger: 124 chain_confirmed rows from SEVEN real
// chain events, one line emitted 44 times — a 17x overcount that made chains
// look like a 1.9-per-strike spam mechanic when the true rate is 0.20.
// A cursor cannot drift this way. Reset it only when __devLog itself resets
// (page reload / new run), detected by the log shrinking.
let devLogCursor = 0
// Boss loot is announced ONLY in the combat log (App.jsx ~7414 addLog('🏆 Boss
// Loot: ...')) — there is no loot rail in combat — so this is the one place a
// player, or the bot, can learn that The Blade (x3.0 at EXACTLY 1 card) is live.
async function scanLootLog() {
  const lines = await P.evaljs(
    `(() => ((window.__devLog||[]).map(e=>e&&e.msg||'').filter(m=>m.indexOf('Boss Loot:')>=0)))()`
  ).catch(() => null)
  if (!Array.isArray(lines)) return
  for (const l of lines) {
    const nm = (l.match(/Boss Loot:\s*\S*\s*([^—-]+)/) || [])[1]
    const d = nm ? BRAIN.matchRelic(nm.trim()) : null
    if (d && d.kind === 'loot' && !OWNED.loot.includes(d.id)) {
      OWNED.loot.push(d.id)
      ev('loot_seen', { id: d.id, name: d.name, trigger: d.multTrigger, mult: d.mult, source: 'combat log' })
    }
  }
}

async function scanChainLog() {
  // Read window.__devLog, NOT document.body.innerText. addLog() pushes every
  // game log entry to __devLog unconditionally (App.jsx ~5370), but the combat
  // log itself is an OVERLAY that is closed almost all the time — so scanning
  // visible text could never see a chain line. That is why chain_confirmed was
  // 0 across every session while chain_fired (the bot's own inference) was 31.
  // Pull the whole log WITH its length so we can advance a cursor over it.
  const res = await P.evaljs(
    `(() => { const d = window.__devLog || []; return { n: d.length, msgs: d.map(e => e && e.msg || '') } })()`
  ).catch(() => null)
  if (!res || !Array.isArray(res.msgs)) return
  // __devLog shrank => the page reloaded (new run). Start over.
  if (res.n < devLogCursor) devLogCursor = 0
  const fresh = res.msgs.slice(devLogCursor)
  devLogCursor = res.n
  for (const raw of fresh) {
    if (raw.indexOf('RIFF CHAIN:') < 0) continue
    const nm = (raw.match(/⛧ RIFF CHAIN:\s*\S*\s*([A-Z][A-Z' ]+?)!/) || [])[1]
    const meta = nm ? CHAIN_BY_NAME[nm.trim().toUpperCase()] : null
    const mult = (raw.match(/×([\d.]+)\s*MULTIPLIER/) || [])[1]
    ev('chain_confirmed', { chain: meta ? meta.cards.join('+') : null, name: nm ? nm.trim() : null, mult: mult ? +mult : null, source: 'game_log', line: raw.slice(0, 120) })
  }
}

// ── TRIP DOCTRINE (Aug 4 2026 rebuild) ────────────────────────────────
// The old rule was "panic button only": never on the opening strike, never
// against a boss above 95% HP. That structurally forbade the single best use of
// a trip in the game. App.jsx ~8433 reads the trip buff as the STARTING strike
// multiplier of EVERY strike in the fight — REALITY GLITCH (acid) x2.0, OVERMIND
// (DMT) x3.0 — so a trip spent on the FIRST strike of a circle boss is worth up
// to four strikes of that multiplier, while the same trip spent to survive a
// trash fight buys one strike of it. Shrooms have no multiplier outcome in the
// pool at all, so they stay the panic button; acid and DMT become boss openers.
// The game allows one trip per fight, so it is capped bot-side either way.
async function tripDoctrine(s, g, FI) {
  if (tripUsedThisFight) return g
  const inRealCombat = g.inCombat && g.bossHp > 0 && g.strikesLeft !== null
  if (!inRealCombat) return g
  const bossPct = (g.bossHp && g.bossMaxHp) ? g.bossHp / g.bossMaxHp : 1
  const alive = g.members.filter(m => !m.tooStoned)
  const bandHurt = alive.length > 0 && alive.reduce((a, m) => a + m.hp, 0) / Math.max(1, alive.reduce((a, m) => a + m.maxHp, 0)) < 0.4
  // ── Aug 4 2026: "HELD" IS THE WORD *USE*, NOT THE EMOJI ─────────────
  // The three drug pins ALWAYS render (App.jsx ~11991); an empty one is greyed
  // out, cursor:not-allowed, and its label is the emoji + "⛧", while a held one
  // reads emoji + "USE". The old code matched on the emoji alone, so it clicked
  // empty slots — a dead click that logged trip_failed and, because the pin was
  // still there afterwards, never counted. The 18.7-minute pre-change baseline
  // used ZERO trips; the smoke test caught two of these against "🧪⛧".
  const btn = e => (s.clickables || []).find(c => c.t.includes(e) && /USE/i.test(c.t) && c.t.length < 30)
  const B = { dmt: btn('💠'), acid: btn('🧪'), shrooms: btn('🍄') }
  const held = { dmt: !!B.dmt, acid: !!B.acid, shrooms: !!B.shrooms }
  // "Fight 3/3" is printed on the HUD — the boss of the circle.
  const isBoss = typeof FI.fightIndex === 'number' && FI.fightIndex % 3 === 2
  const plan = BRAIN.tripPlan(held, {
    isBoss, strikeNum: strikeNumThisFight, bossPct, overtime: g.overtime,
    bandHurt, tripUsed: tripUsedThisFight, inCombat: inRealCombat, strikesLeft: g.strikesLeft,
  })
  if (!plan.use) return g
  const pick = B[plan.which]
  if (!pick) return g
  await P.click(pick.x, pick.y)
  await P.connect().then(p => p.waitForTimeout(1500)).catch(() => {})
  const st2 = await P.state().catch(() => null)
  const gone = !st2 || !st2.clickables.some(c => c.t === pick.t)
  if (gone) { tripUsedThisFight = true; ev('trip_used', { btn: pick.t, drug: plan.which, planned: /opener/.test(plan.why), bossPct: (bossPct * 100).toFixed(0), strikesLeft: g.strikesLeft, why: plan.why, fightIndex: FI.fightIndex, verified: true }) }
  else ev('trip_failed', { btn: pick.t, why: plan.why, note: 'button still present after click — not counted as a trip' })
  return await perceive()
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
    pendingStrike = null
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
    discardLen: gg.discardLen, hrUsed: hrUsedThisFight,
    // Aug 4 2026 — the relic-blindness fix, driver side. Everything the shape
    // planner and the per-card relic bonus need, read off the HUD rail.
    relics: [].concat(gg.artifacts || [], gg.loot || []), pedals: gg.pedals || [],
    thisStrikeIds: cardsThisStrike.slice(), chainsThisStrike: 0,
    maxEmbers: gg.maxEmbers || 6,
  })

  // ── PHASE 0: PLANNED TRIP. A x2.0/x3.0 strike multiplier that lasts the whole
  // fight has to be live BEFORE the first strike and before the cards are chosen
  // (HYPERSPACE makes every card free, THIRD EYE draws 8) — not after.
  if (!tripUsedThisFight && strikeNumThisFight === 0) {
    const g2 = await tripDoctrine(s, g, FI)
    if (g2) g = g2
  }

  // playable = matched + affordable + corruption gate satisfied at its REAL threshold.
  // Aug 4: brain.matchCard no longer fuzzy-guesses (it used to relabel Dark Whisper
  // as `whispercard`). An unmatched card is now LOGGED, once per distinct name.
  const playableIn = (gg, skipIds) => gg.hand
    .map(c => { const card = BRAIN.matchCard(c.name); if (!card) noteUnmatched(c); else noteAmbiguous(c, card); return { ...c, card } })
    .filter(c => c.card && !skipIds.has(c.card.id))
    .filter(c => !c.corrReq || gg.corruption >= c.corrReq)
    .filter(c => c.cost <= gg.embers)

  // score = the audited combat policy + a small additive relic term. scoreCard
  // itself is untouched; relicCardBonus only re-ranks near-ties (play the CORRUPT
  // card while the Pentagram Shrine is on the rail) and can never resurrect a
  // card the policy has already declared impossible.
  const scoreWithRelics = (card, gs, sn, cp) => {
    const base = BRAIN.scoreCard(card, gs, sn, cp)
    if (base <= 3) return base
    return Math.max(0, base + BRAIN.relicCardBonus(card.id, gs))
  }

  // ── PHASE 1: DIG FIRST. A human discards on a dead opening hand, before
  // committing embers — not after (the old code dug last, with embers gone).
  {
    const gs0 = gsFrom(g)
    const cand0 = playableIn(g, new Set())
    cand0.forEach(k => { k.score = scoreWithRelics(k.card, { ...gs0, handIds: cand0.map(x => x.card.id) }, strikeNumThisFight, 0) })
    const best0 = cand0.sort((a, b) => b.score - a.score)[0]
    const chainLive = g.hand.some(c => { const m = BRAIN.matchCard(c.name); return m && BRAIN.RIFF_CHAINS.some(ch => (ch[0] === m.id || ch[1] === m.id) && g.hand.some(o => { const m2 = BRAIN.matchCard(o.name); return m2 && m2.id !== m.id && (ch[0] === m2.id || ch[1] === m2.id) }) ) })
    // Aug 4 2026: with Ouroboros Pin (x1.3 PER discard this strike) or Spit Cup
    // (x1.5 if you discarded at all) on the rail, a discard is not a last resort
    // — it is a damage multiplier, and the dig should fire on a hand the old
    // threshold called perfectly good.
    const digPlan = BRAIN.planStrike(gs0, cand0)
    const digRelic = digPlan && digPlan.discards > 0 && g.discardsLeft > 0
    if (digRelic) ev('discard_relic', { want: digPlan.discards, why: digPlan.why })
    if (g.discardsLeft > 0 && g.hand.length >= 4 && (digRelic || ((!best0 || best0.score < 40) && !chainLive))) {
      // junk = unplayable corruption-gated + genuinely low value. NEVER dump a
      // free card: whispercard/hungercard/madnesscard/blood_price are 0-cost
      // power the old filter was throwing away.
      const scoredAll = g.hand.map(c => { const card = BRAIN.matchCard(c.name); return { ...c, card, score: card ? scoreWithRelics(card, { ...gs0, handIds: [] }, strikeNumThisFight, 0) : 0 } })
      const junk = (digRelic
        // A discard relic makes the discard itself the payoff, so dump the worst
        // cards on the board — but never the best one, and never a free card that
        // is about to be played this strike.
        ? scoredAll.filter(c => c.score < (best0 ? best0.score : 100)).sort((a, b) => a.score - b.score).slice(0, digPlan.discards)
        : scoredAll.filter(c => c.cost > 0 && (c.score < 25 || (c.corrReq && g.corruption < c.corrReq))).sort((a, b) => a.score - b.score).slice(0, 2))
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
  let planLogged = ''
  const failedIds = new Set()   // keyed by CARD ID, not badged screen name
  // Aug 4 2026: was `failStreak < 3`. Each failure already adds the card to
  // failedIds so it is never retried, and brain.cjs now returns <=3 for cards the
  // engine would reject — so a "failure" is almost always the VERIFICATION poll
  // missing a landed play, not an illegal one. Aborting the whole strike after
  // three of those threw away playable cards; 4 with the same per-card lockout is
  // still a hard stop against a genuinely unresponsive board.
  for (let iter = 0; iter < 14 && played < 10 && failStreak < 4; iter++) {
    const gs = gsFrom(g)
    const cand = playableIn(g, failedIds)
    gs.handIds = cand.map(k => k.card.id)
    if (!cand.length) { if (iter === 0) ev('no_play', { handSeen: g.hand.length, embers: g.embers, corr: g.corruption, names: g.hand.map(x => x.name.slice(0, 16)) }); break }
    cand.forEach(k => { k.score = scoreWithRelics(k.card, gs, strikeNumThisFight, played) })
    cand.sort((a, b) => b.score - a.score)
    // The stop-rule runs BEFORE the planner, and the planner only ever sees cards
    // that pass it. Scoring <=3 means "the engine will reject this or its effect is
    // already spent" — such a card must never be counted towards a shape (a dead
    // RIFF would let The Doom Crown believe it can reach three of one type), and a
    // hand of nothing but dead cards must stop the strike for the audited reason,
    // not as a phantom "the plan says play zero cards".
    if (cand[0].score <= 3) break                 // sim stop-rule
    const live = cand.filter(k => k.score > 3)
    // ── RELIC SEQUENCING (Aug 4 2026) ─────────────────────────────────
    // Ask the planner for the best SHAPE of this strike given what is on the
    // rail. It enumerates every affordable subset and picks the one whose relic
    // multipliers x card value is highest, so Solo Sermon (x6.0 at EXACTLY 2),
    // The Doom Crown (x8.0 all-one-type), Vintage Guitar (x1.3 at 4+) and Set
    // List (x1.4 ember-first) resolve against each other by arithmetic instead
    // of a hardcoded priority. It only overrides the default line when an owned
    // relic actually pays for a different one.
    const plan = BRAIN.planStrike({ ...gs, thisStrikeIds: cardsThisStrike.slice() }, live)
    if (plan && plan.active) {
      const sig = plan.cap + '|' + plan.typeLock + '|' + plan.ids.join(',')
      if (sig !== planLogged) { planLogged = sig; ev('relic_plan', { cap: plan.cap, typeLock: plan.typeLock, first: plan.nextId, mult: +plan.mult.toFixed(2), why: plan.why, ids: plan.ids, relics: gs.relics, pedals: gs.pedals }) }
      if (cardsThisStrike.length >= plan.cap) { ev('plan_stop', { at: cardsThisStrike.length, mult: +plan.mult.toFixed(2), why: plan.why }); break }
      if (plan.typeLock) { const keep = live.filter(k => (k.card.type || k.type) === plan.typeLock); if (keep.length) live.length = 0, live.push(...keep) }
      if (plan.nextId) { const i = live.findIndex(k => k.card.id === plan.nextId); if (i > 0) live.unshift(live.splice(i, 1)[0]) }
    }
    const c = live[0]
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

  // ── PHASE 3: TRIP. See tripDoctrine() — the boss-opener case already ran
  // BEFORE the play loop; this is the emergency half.
  g = (await tripDoctrine(s, g, FI)) || g

  // Aug 3: skip strikes fired during fight-to-fight transitions (bossHp=None).
  // FIRST ATTEMPT was too aggressive — it also skipped REAL strikes whenever the
  // damage-cascade overlay covered the HP readout (48 skipped in one 8-min test,
  // so fights never resolved). The authoritative signal is the STRIKE BUTTON: if
  // the game is offering one, we are in a fight, whatever the HP text looks like.
  if (g.bossHp === null) {
    const sNow = await P.state().catch(() => null)
    const hasStrikeBtn = sNow && sNow.clickables.some(c => /^[⛧\s]*strike[⛧\s]*$/i.test((c.t || '').trim()))
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
  // Click the BUTTON by exact label. clickText('strike') picks the shortest
  // clickable containing the word, which on a screen offering Solo Sermon is a
  // relic tile, not the strike button.
  {
    const sBtn = (await P.state().catch(() => ({ clickables: [] }))).clickables.find(c => /^[⛧\s]*strike[⛧\s]*$/i.test((c.t || '').trim()))
    if (sBtn) await P.click(sBtn.x, sBtn.y).catch(e => ev('warn', { msg: 'strike btn: ' + e.message }))
    else await P.clickText('⛧ strike').catch(() => P.clickText('strike').catch(e => ev('warn', { msg: 'strike btn: ' + e.message })))
  }
  // ── measure what the strike ACTUALLY did ──────────────────────────────
  // Aug 4: this used to be a flat waitForTimeout(1800) + one read, which samples
  // the boss HP MID-CASCADE and understated every non-lethal strike by ×1.77-×2.01.
  // Poll instead. Also record the reconstruction handle so the NEXT strike in this
  // fight can supply hpAtNextStrike, which is animation-proof.
  try {
    const settled = await settleBossHp()
    const hpAfter = settled.hp
    await scanChainLog().catch(() => {})
    await scanLootLog().catch(() => {})
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
  devLogCursor = 0; pendingStrike = null; FIGHT.idx = -1
  resetRunEconomy()
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
  // ── Aug 4 2026: SCORE THE REAL LIST ─────────────────────────────────
  // Pacts are a closed set of 13 (PACT_REWARDS in src/data/relics.js). The old
  // scorer was a regex over the tile text that paid "max hp" 80+10 and "strike"
  // 45+10, so THICK SKIN (+3 max HP) beat WAR DRUMS (+1 Strike per fight, for the
  // rest of the run — a permanent +25-33% on total damage) every time they were
  // offered together, and SIXTH SLOT (a whole extra band member) lost to it too.
  // brain.pactScore matches the tile against the actual reward ids.
  const opts = s.clickables.filter(c => c.w > 150 && c.h > 100 && !/skip/i.test(c.t))
  const scored = opts.map(c => { const r = BRAIN.pactScore(c.t); return { ...c, v: r.v, id: r.id } }).sort((a, b) => b.v - a.v)
  const pick = scored[0]
  if (pick) {
    ev('pact_choice', { pick: pick.t.slice(0, 60), id: pick.id, score: pick.v, offered: scored.map(o => ({ id: o.id, v: o.v, t: o.t.slice(0, 28) })) })
    await P.click(pick.x, pick.y)
  } else { ev('pact_skip', {}); await P.clickText('skip').catch(() => {}) }
}

// Card tiles on the Forge / booster-pick screens, with their FULL text (the
// upgrade description matters — see forgeTick).
async function cardTiles(maxLen) {
  return P.evaljs(`(() => {
    const seen = {}
    return [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent || ''; const r = d.getBoundingClientRect()
      return /RIFF|UTILITY|EMBER|CORRUPT/.test(t) && t.length < ${maxLen || 260} && r.height > innerHeight * 0.08 && r.width < innerWidth * 0.25
    }).map(d => { const r = d.getBoundingClientRect(); return { t: d.textContent.replace(/\\s+/g, ' ').slice(0, 200), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
      .filter(c => { const k = c.t.slice(0, 20); return seen[k] ? false : (seen[k] = 1) })
  })()`).catch(() => [])
}
const tileCard = t => BRAIN.matchCard((String(t).match(/^(.*?)\+?\s*(?:RIFF|UTILITY|EMBER|CORRUPT)/) || [, t])[1])

async function forgeTick(s) {
  // ── Aug 4 2026: FORGE PICKS WERE ARBITRARY ──────────────────────────
  // The old scorer was an 11-name hardcoded table with everything else defaulting
  // to 30 — and FOUR of its top five (possessedperf 95, infencore 88, amp 82,
  // encore 76) are COSMETIC upgrades: App.jsx applyCard branches on `upgraded` for
  // exactly nine card ids, and none of those four is one of them. So most forges
  // this bot has ever performed changed nothing at all, and the balance data has
  // "upgraded Possessed Performance" rows that mean gold foil and nothing else.
  // The tile itself says which is which ("Gold foil. No rules change.") — read it.
  const cards = await cardTiles(260)
  const scored = cards.map(c => {
    const card = tileCard(c.t)
    if (!card) return null
    const f = BRAIN.forgeScore(card.id, c.t, RUN.cardsPlayed)
    return { ...c, card, v: f.v, real: f.real }
  }).filter(Boolean).sort((a, b) => b.v - a.v)
  if (scored.length) {
    const top = scored[0]
    ev('forge_pick', {
      card: top.card.id, v: top.v, realUpgrade: !!top.real,
      offered: scored.slice(0, 8).map(c => c.card.id + (c.real ? '*' : '')),
      note: top.real ? undefined : 'no REAL upgrade on offer — every tile is cosmetic',
    })
    await P.click(top.x, top.y)
    await P.connect().then(p => p.waitForTimeout(600))
    // Clicking a Forge tile applies immediately and routes to the shop (App.jsx
    // ~11405) — there is no confirm button, so only press one if we are somehow
    // still on the Forge.
    const after = await P.state().catch(() => null)
    if (after && /DOOM FORGE/i.test(after.text)) { for (const b of ['forge', 'upgrade', 'confirm', 'skip upgrade']) { try { await P.clickText(b); break } catch (e) {} } }
  } else {
    ev('forge_skip', { why: 'no cards parsed' })
    for (const b of ['skip upgrade', 'skip', 'continue', ...OVERLAY_BTNS]) { try { await P.clickText(b); break } catch (e) {} }
  }
}

// ── BOOSTER / CARD PICK (Aug 4 2026) ──────────────────────────────────
// This screen used to be routed straight into forgeTick, so a booster pick was
// graded by the FORGE's hardcoded upgrade table — a list about which cards are
// worth UPGRADING, which is a different question from which card is worth ADDING
// to the deck, and which defaulted 70+ of the 82 cards to a flat 30. Score the
// card as a deck addition: real combat value, chain partners already in the deck,
// and curve.
async function cardPickTick(s) {
  const cards = await cardTiles(260)
  const deckIds = Object.keys(RUN.cardsPlayed || {})
  const scored = cards.map(c => {
    const card = tileCard(c.t)
    if (!card) return null
    const r = BRAIN.cardPickScore(card.id, { deckIds })
    return { ...c, card, v: r.v, reasons: r.reasons }
  }).filter(Boolean).sort((a, b) => b.v - a.v)
  if (!scored.length) {
    ev('boosterpick_confused', { why: 'no card tiles parsed' })
    for (const b of ['confirm', 'take', 'continue', ...OVERLAY_BTNS]) { try { await P.clickText(b); break } catch (e) {} }
    return
  }
  const top = scored[0]
  ev('booster_pick', { card: top.card.id, v: top.v, why: top.reasons, offered: scored.map(c => c.card.id + ':' + c.v) })
  await P.click(top.x, top.y)
  await P.connect().then(p => p.waitForTimeout(500))
  for (const b of ['confirm', 'take', 'add to deck', 'continue', 'done', 'close']) { try { await P.clickText(b); break } catch (e) {} }
}

async function eventTick(s) {
  // ── Aug 4 2026: PRICE THE TRADE, DON'T KEYWORD-MATCH IT ─────────────
  // The old scorer was `+2 if the text says permanent, -1 if it says lose stash`,
  // which cannot tell "+1 ATK to survivors, everyone takes 4 damage and may be
  // KO'd" (mosh_pit A) from "+5 ATK, but one boss hit kills him" (blood_oath A).
  // Events are free-text, so this stays a text model — but it now prices the
  // magnitudes and the risks against each other instead of counting keywords.
  const opts = s.clickables.filter(c => c.w > 150 && c.h > 40 && !/hide|undo/i.test(c.t))
  const score = c => {
    const t = c.t
    let v = 0
    const allAtk = (t.match(/ALL[^.]{0,24}\+(\d+)\s*ATK/i) || [])[1]
    const oneAtk = (t.match(/\+(\d+)\s*ATK/i) || [])[1]
    if (allAtk) v += (+allAtk) * 26
    else if (oneAtk) v += (+oneAtk) * 9
    if (/permanent/i.test(t)) v *= 1.5
    const stashG = (t.match(/\+(\d+)\s*(?:stash|🌿)/i) || [])[1]; if (stashG) v += (+stashG) * 0.7
    const stashL = (t.match(/-\s*(\d+)\s*(?:stash|🌿)/i) || [])[1] || (t.match(/lose\s*(\d+)/i) || [])[1]
    if (stashL) v -= (+stashL) * 0.7
    const emb = (t.match(/\+(\d+)\s*(?:max\s*)?ember/i) || [])[1]; if (emb) v += (+emb) * 22
    const hp = (t.match(/\+(\d+)\s*(?:max\s*)?HP/i) || [])[1]; if (hp) v += (+hp) * 3
    const corrDown = (t.match(/-\s*(\d+)%?\s*corrupt/i) || [])[1]; if (corrDown) v += (+corrDown) * 0.3
    const corrUp = (t.match(/\+\s*(\d+)%?\s*corrupt/i) || [])[1]; if (corrUp) v += (+corrUp) * 0.2
    // Risk. A KO'd member is gone for the fight and takes their ATK with them;
    // a member who dies to one boss hit is a run-ending liability in Circle 6+.
    const dmg = (t.match(/take[s]?\s*(\d+)\s*damage/i) || [])[1]; if (dmg) v -= (+dmg) * 6
    if (/tooStoned|knocked out|KO|crushed|dies|death/i.test(t)) v -= 40
    if (/one hit .* die|blood oath/i.test(t)) v -= 35
    if (/nothing happens|walk away|refuse|leave/i.test(t)) v += 2   // the safe out is worth a little
    if (/lock/i.test(t) && /corrupt/i.test(t)) v -= 18              // locked corruption kills the damage tiers
    return Math.round(v)
  }
  const scored = opts.map(c => ({ ...c, v: score(c) })).sort((a, b) => b.v - a.v)
  const pick = scored[0]
  if (pick) { ev('event_choice', { pick: pick.t.slice(0, 60), score: pick.v, all: scored.map(o => o.t.slice(0, 34) + '=' + o.v) }); await P.click(pick.x, pick.y) }
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
const KW_W = { FRENZIED: 6, 'FOLK MAGIC': 5, BLASTBEAT: 5, TRICKSTER: 5, CORRUPT: 4, HEXED: 3, SHREDDER: 3, DEBUFF: 2, ANCHOR: 1 }
const BOT = { boughtThisShop: new Set(), lastShopSig: '', artifacts: 0, pedals: 0 }
// Aug 1: these are module-global and were never reset, so after the first run
// filled 3 artifacts the relic branch was dead for every later run in the session.
function resetRunEconomy() {
  BOT.artifacts = 0; BOT.pedals = 0; BOT.boughtThisShop = new Set(); BOT.lastShopSig = ''
  BOT.bandNames = []; BOT._bandCache = undefined; BOT._bandCacheSig = ''
  // Aug 4 2026: owned gear is PER-RUN. Carrying last run's artifacts/pedals/loot
  // into the next one would make the shape planner chase a Solo Sermon the band
  // does not have — the exact class of bug the module-global BOT counters had.
  OWNED.artifacts = []; OWNED.pedals = []; OWNED.loot = []; OWNED.band = []
}

// ── BAND + DECK CONTEXT (Aug 4 2026) ──────────────────────────────────
// Every out-of-combat decision — which relic to buy, which member to sign, which
// pact to take — depends on the band that actually exists, and none of them used
// to look at it. The shop's STAGE ORDER strip prints the names; the roster gives
// role and keyword for a name, exactly as the player's own knowledge does.
const ROSTER_BY_NAME = {}
for (const m of (BRAIN.MUSICIANS || [])) ROSTER_BY_NAME[String(m.name).toLowerCase()] = m
function bandFromNames(names) {
  return (names || []).map(n => {
    const m = ROSTER_BY_NAME[String(n).toLowerCase()]
    return m ? { name: m.name, role: m.role, keyword: m.keyword, atk: m.atk, hp: m.hp, tier: '' } : { name: n, role: '', keyword: '', atk: 0, hp: 0, tier: '' }
  })
}
// Type mix of the cards this run has actually drawn — the only deck read the bot
// is entitled to (it cannot open a deck list it never clicked). Used to price
// Set List (ember-first) and Pentagram Shrine (per CORRUPT card).
// The richest band picture available: the live combat read if we have had one
// this run, otherwise the roster's base stats for the names on the shop strip.
function bandNow() {
  if (OWNED.band && OWNED.band.length) return OWNED.band
  return bandFromNames(BOT.bandNames || [])
}
function deckTypesSeen() {
  const out = {}
  for (const id of Object.keys(RUN.cardsPlayed || {})) {
    const c = BRAIN.ALL_CARDS.find(x => x.id === id)
    if (c) out[c.type] = (out[c.type] || 0) + RUN.cardsPlayed[id]
  }
  if (!Object.keys(out).length) return { RIFF: 30, CORRUPT: 15, UTILITY: 14, EMBER: 10 }
  return out
}

// ── SLOT SWAP MODAL (Aug 4 2026 — first version that ever reached it) ──
// Slots are hard-capped at 3 artifacts + 2 pedals, so past that point every
// purchase is a REPLACEMENT and the only question is whether the incoming item
// beats the worst one already equipped, net of the 50% refund (confirmSlotSwap).
// The old handler clicked `owned[0]` — the first tile, unscored — which threw
// away a x1.5 always-on relic for a x1.02 situational one about a third of the
// time. Cancelling costs nothing (cancelSlotSwap consumes no stash and leaves
// the tile buyable), so a bad swap has a strictly better alternative.
async function slotSwapTick(s) {
  const info = await P.evaljs(`(() => {
    const txt = document.body.innerText
    const inc = (txt.match(/Incoming[\\s\\S]{0,40}?\\n([^\\n]+)\\n/) || [])[1] || ''
    const tiles = [...document.querySelectorAll('div')].filter(d => {
      const r = d.getBoundingClientRect()
      return r.width > 140 && r.width < 190 && r.height > 100 && /Sell/i.test(d.textContent || '')
    }).map(d => { const r = d.getBoundingClientRect(); return { t: (d.textContent || '').replace(/\\s+/g, ' ').slice(0, 120), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
      .sort((a, b) => a.x - b.x)
    return { inc, tiles }
  })()`).catch(() => ({ inc: '', tiles: [] }))
  const ctx = { band: bandNow(), owned: [].concat(OWNED.artifacts, OWNED.pedals, OWNED.loot), corruption: 0, deckTypes: deckTypesSeen(), circle: (RUN.deepestCircle || 1) }
  const incoming = BRAIN.relicBuyScore(info.inc, ctx)
  const scored = (info.tiles || []).map(t => {
    const nm = t.t.replace(/Sell.*$/i, '').trim()
    const r = BRAIN.relicBuyScore(nm, { ...ctx, owned: [] })
    return { ...t, name: nm.slice(0, 24), score: r.score, why: r.why }
  }).sort((a, b) => a.score - b.score)
  const weakest = scored[0]
  // Half the removed item's paid cost comes back, so the true bar is "better than
  // the worst tile" with a margin for the growth/effects being reverted.
  if (weakest && incoming.score > weakest.score * 1.25 + 8) {
    ev('slot_swap', { action: 'swap', out: weakest.name, outScore: weakest.score, in: info.inc.slice(0, 24), inScore: incoming.score, why: incoming.why })
    await P.click(weakest.x, weakest.y)
  } else {
    ev('slot_swap', { action: 'cancel', in: info.inc.slice(0, 24), inScore: incoming.score, bestOwnedFloor: weakest ? weakest.score : null, why: incoming.why || 'nothing worth replacing' })
    let done = false
    for (const b of ['cancel', 'keep current']) { try { await P.clickText(b); done = true; break } catch (e) {} }
    if (!done) await P.key('Escape').catch(() => {})
  }
}

// ── MEMBER SCORING (Aug 4 2026 rebuild) ───────────────────────────────
// Was: ATK*3 + HP + a flat keyword weight. Two things that wrong made every
// recruit and every draft pick suspect as balance data:
//   1. DRUMMERS DO NOT SWING. App.jsx handleStrike filters role==='Drummer' out
//      of the damage sum entirely, so scoring Rolf (ATK 1) or Thor (ATK 0) on ATK
//      graded them on a column that contributes zero. What a drummer actually
//      does is roll the band-wide DOUBLE TIME d6 — x1.0/x1.5/x2.0, E[x1.5] on the
//      WHOLE band's damage. Under the old scorer a drummer was the worst card on
//      the screen every single time, which is exactly the shape of the
//      "this member is always skipped" verdict this playtest exists to test.
//   2. KEYWORD VALUE IS A STEP FUNCTION. _stackTier maps 1/2/3+ stacks to
//      tiers 1/2/4, so the SECOND SHREDDER is worth far more than the first, and
//      the third more again. A flat per-keyword weight cannot express that, and
//      the "counts" bonus the old code applied counted keywords among the OFFERED
//      candidates rather than among the band that already exists.
// brain.recruitScore models both, plus mentor links (a foil/mythic/demonic
// member left-adjacent to a basic member of the SAME ROLE) and the ANCHOR-3
// band-wide save.
function parseMemberTile(t) {
  const atkm = t.match(/ATK\s*(\d+)/i)
  const hpm = t.match(/HP\s*(\d+)/i)
  const kw = ((t.match(/(FRENZIED|BLASTBEAT|TRICKSTER|ANCHOR|CORRUPT|DEBUFF|FOLK MAGIC|SHREDDER|HEXED|FALLEN)/i) || [])[1] || '').toUpperCase()
  const role = (t.match(/(Rhythm Guitarist|Lead Guitarist|Bass Player|Synth Player|Drummer|Vocalist|Dark Minstrel|The Devil)/i) || [])[1] || ''
  const name = memberName(t)
  const roster = ROSTER_BY_NAME[String(name).toLowerCase()]
  return {
    name, keyword: kw || (roster ? roster.keyword : ''),
    role: role || (roster ? roster.role : ''),
    atk: atkm ? +atkm[1] : (roster ? roster.atk : 0),
    hp: hpm ? +hpm[1] : (roster ? roster.hp : 0),
    tier: /DEMONIC/i.test(t) ? 'demonic' : /MYTHIC/i.test(t) ? 'mythic' : /FOIL/i.test(t) ? 'foil' : '',
  }
}
function memberScoreFromText(t) {
  const m = parseMemberTile(t)
  const r = BRAIN.recruitScore(m, bandNow())
  return { p: r.score, kw: m.keyword, why: r.reasons, role: m.role, name: m.name }
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
  // Who is actually in the band, by name, off the STAGE ORDER strip. Needed
  // BEFORE the gear branch so a relic can be scored against the band it will be
  // used with; the old code only parsed this at the very end, for stage ordering.
  if (stripM) {
    const found = []
    for (const m of (BRAIN.MUSICIANS || [])) if (new RegExp('(^|[^A-Za-z])' + m.name + '([^A-Za-z]|$)', 'i').test(stripM[0])) found.push(m.name)
    if (found.length) BOT.bandNames = found
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
    // Aug 3: grab the next lines after the cost and drop any that are pure
    // numbers or bare emoji — the ledger showed 3x "tile not clickable, tried: 10"
    // where the captured "name" was the price line.
    // ── Aug 4 2026: READ THE PRICE THE SHOP WILL ACTUALLY CHARGE ────────
    // Today's shop rebuild made every tile render the BASE price struck through
    // next to the real one whenever any modifier moved it (App.jsx ~2021:
    // priceMoved() -> <s>{price}</s> {realPrice(price)}). Hangover alone is up to
    // +60%. The old regex took the FIRST number, i.e. the struck-through base, so
    // with a hangover the bot thought a 22-stash pedal cost 14, "afforded" it, and
    // clicked a tile whose cursor is `default` because canBuy is false — which is
    // exactly the "tile not clickable" rows in the ledger. Take the LAST number in
    // the leading price block: that is what `can()` and handleShopSpend use.
    const m = t.match(new RegExp(marker + '((?:\\s*\\n[^\\n]*){1,7})'))
    if (!m) return null
    const lines = String(m[1] || '').split('\n').map(x => x.trim()).filter(Boolean)
    const prices = []
    let i = 0
    for (; i < lines.length; i++) {
      const only = lines[i].replace(/[^\d\s]/g, '').trim()
      const nums = lines[i].match(/\d+/g)
      if (nums && only.length && !/[A-Za-z]{3}/.test(lines[i])) { prices.push(...nums.map(Number)); continue }
      break
    }
    if (!prices.length) return null
    const cands = lines.slice(i).filter(x => !/^\d+$/.test(x) && /[A-Za-z]{3}/.test(x))
    // struck-through base first, effective second — the charge is the LAST one.
    return { cost: prices[prices.length - 1], baseCost: prices[0], cands }
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
  // ── Aug 4 2026: EVALUATE THE RELIC, DO NOT JUST AFFORD IT ────────────
  // Until now the bot bought whatever artifact the shop happened to roll, as long
  // as the stash covered it. Three of the offered artifacts are DEAD against the
  // band this bot actually builds — Lucifer's Pact (x4 only with Lucifer on stage,
  // and the bot never signs him), Chrome Skull (x3 only when exactly ONE member is
  // alive), Doom Choir (x1.5 per SAME-ROLE member, worthless on a 5-role band) —
  // and Drummer's Stick is worth nothing without a drummer. Every one of those
  // purchases showed up in the balance report as "relic bought, run still lost",
  // which is a statement about the bot, not the relic. Score the offer against the
  // real band and the real deck; skip it and keep the stash otherwise.
  const gearCtx = () => ({
    band: bandNow(),
    owned: [].concat(OWNED.artifacts, OWNED.pedals, OWNED.loot),
    corruption: 0, deckTypes: deckTypesSeen(), circle: (RUN.deepestCircle || 1),
  })
  // A relic is worth buying when it moves the needle at all AND the stash it costs
  // buys more multiplier here than it would as a member pack (~x1.25 for 22).
  const gearVerdict = (tile, kind) => {
    if (!tile) return { ok: false, why: 'no tile' }
    let best = { score: 0, why: 'unreadable' }
    for (const cand of tile.cands) {
      const r = BRAIN.relicBuyScore(cand, gearCtx())
      if (r.score > best.score || best.why === 'unreadable') best = r
    }
    const perStash = best.score / Math.max(1, tile.cost)
    // Stash is worthless in the bank (cap 420, and the run can end at any fight),
    // so the bar drops once the wallet is fat: a mediocre always-on multiplier
    // beats 200 unspent stash. Without this the new scoring would hoard.
    const rich = stash >= 60
    const minScore = rich ? 8 : 18, minPer = rich ? 0.35 : 0.9
    if (best.score < minScore || perStash < minPer) return { ok: false, why: `${best.name || tile.cands[0]}: score ${best.score} (${best.why}) @${tile.cost} = ${perStash.toFixed(2)}/stash${rich ? ' [rich bar]' : ''}`, score: best.score }
    return { ok: true, why: `${best.name || ''}: score ${best.score} (${best.why}) @${tile.cost}`, score: best.score }
  }
  const tryGear = async (marker, kind, label, cap, ownedCount) => {
    if (ownedCount >= cap || !tryable(label)) return false
    const tile = tileInfo(marker)
    if (!tile) return false
    if (stash < tile.cost) { ev('shop_skip', { tile: label, why: `stash ${stash} < ${tile.cost}` }); return false }
    const v = gearVerdict(tile, kind)
    if (!v.ok) { BOT.boughtThisShop.add(label); ev('shop_skip', { tile: label, why: 'NOT WORTH IT — ' + v.why }); return false }
    if (await buyNamed(tile.cands, `${label} cost=${tile.cost} ${v.why}`, label)) {
      if (label === 'artifact') BOT.artifacts++; else BOT.pedals++
      return true
    }
    return false
  }
  const relicsFirst = bandSize !== null && bandSize >= 3
  if (relicsFirst) {
    if (await tryGear('⛧ ARTIFACT', 'artifact', 'artifact', 3, Math.max(BOT.artifacts, OWNED.artifacts.length))) return
    if (await tryGear('⛧ EFFECT PEDAL', 'pedal', 'effect pedal', 2, Math.max(BOT.pedals, OWNED.pedals.length))) return
  }
  if (await tryGear('⛧ ARTIFACT', 'artifact', 'artifact', 3, Math.max(BOT.artifacts, OWNED.artifacts.length))) return
  if (await tryGear('⛧ EFFECT PEDAL', 'pedal', 'effect pedal', 2, Math.max(BOT.pedals, OWNED.pedals.length))) return
  // 4. DRUGS. Doctrine change (Aug 4 2026): a trip is not a panic button, it is a
  // planned boss opener — REALITY GLITCH (acid) and OVERMIND (DMT) set the STARTING
  // strike multiplier to x2.0 / x3.0 for EVERY strike of the fight. DMT was never
  // bought at all before today, so its whole outcome pool has zero live data.
  if (stash >= 25 && /💠/.test(t) && !/💠\s*\n?DRY/i.test(t) && tryable('💠') && await buy('💠', 'DMT: boss opener, x3.0 strike mult all fight')) return
  if (stash >= 22 && /🧪/.test(t) && !/🧪\s*\n?DRY/i.test(t) && tryable('🧪') && await buy('🧪', 'acid: boss opener, x2.0 strike mult all fight')) return
  if (stash >= 16 && /Shrooms/i.test(t) && !/Shrooms\s*\n?DRY/i.test(t) && tryable('shrooms') && await buy('shrooms', 'panic button reserve')) return
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
  if (blocked.length) ev('recruit_blocked', { count: blocked.length, cards: blocked.map(c => c.t.slice(0, 26)), why: 'game marks not-allowed (no empty slot / band rule)' })
  const takeable = cands.filter(c => c.takeable)
  if (takeable.length) cands = takeable
  if (cands.length) {
    // Scored against the BAND THAT EXISTS (keyword stack tiers, mentor links, and
    // the drummer's band-wide d6) — see memberScoreFromText. The old "+15 if two
    // candidates share a keyword" bonus is gone: it counted keywords among the
    // OFFERED cards, which says nothing about the stack the band is building.
    const scored = cands.map(c => { const r = memberScoreFromText(c.t); return { ...c, p: r.p, kw: r.kw, why: r.why, role: r.role } })
    // never sign Lucifer: 3-member cap + dies-ends-run risk isn't in the sim's model
    const safe = scored.filter(c => !/FALLEN|The Devil/i.test(c.t))
    const pickFrom = safe.length ? safe : scored
    const bestSafe = pickFrom.sort((a, b) => b.p - a.p)[0]
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
      offered: scored.map(c => ({ name: memberName(c.t), kw: c.kw, role: c.role, score: c.p })),
      band: bandNow().map(m => m.name + '/' + (m.keyword || '?')),
      intent: bestName
    })
    ev('recruit_pick', { pick: bestSafe.t.slice(0, 50), name: bestName, score: bestSafe.p, why: bestSafe.why })
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
        // Aug 4 2026: the same ATK*3+HP that made drummers invisible was deciding
        // who gets FIRED. A drummer scored 3-11 here, so the band's only d6 roller
        // was always the first one cut. Score both sides with the real model, and
        // grade the incoming member against the band MINUS whoever is being cut.
        const val = t => BRAIN.recruitScore(parseMemberTile(t), bandNow()).score
        const scoredCuts = cuts.map(c => ({ ...c, v: val(c.t) }))
        const weakest = scoredCuts.sort((a, b) => a.v - b.v)[0]
        const incomingV = bestSafe.p
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
// Aug 5 2026 (JV: "hangs on the next round after winning"): after a full-game
// VICTORY the reload can land on an Opening Night whose TAKE THE STAGE button is
// present but a no-op (confirm doesn't advance) — the bot then re-confirms the
// same draft forever (tonight's ledger: 45 draft_confirms in one stuck stretch)
// until the 60s watchdog fires. This counter breaks that loop in ~3 ticks and
// forces a clean reload so the next run starts fresh. Reset in the main loop the
// moment we leave the draft screen.
let draftConfirmStreak = 0
async function draftTick(s) {
  // v2 (Jul 30): VERIFY-AFTER-EACH-CLICK. Candidate clicks TOGGLE selection and the
  // layout shifts on select — blind double-clicks can toggle forever (the "spaz").
  // Click one candidate at a time, re-read.
  const stageBtn = st => st.clickables.find(c => /take the stage/i.test(c.t))
  const noDevil = list => list.filter(c => !/FALLEN|The Devil/i.test(c.t)) // fair tests never draft Lucifer
  // Aug 4 2026: score each candidate against the band being drafted SO FAR, not
  // in isolation. Opening Night picks 2 of 4, and the second pick is a completely
  // different question once the first is locked in — a second SHREDDER crosses a
  // stack tier, a second Drummer is worth nothing (the game blocks it), and a
  // foil member next to a same-role basic opens a mentor link.
  const parse = (st, taken) => {
    const virtual = (taken || []).map(n => ROSTER_BY_NAME[String(n).toLowerCase()]).filter(Boolean)
      .map(m => ({ name: m.name, role: m.role, keyword: m.keyword, atk: m.atk, hp: m.hp, tier: '' }))
    return noDevil(st.clickables.filter(c => /ATK\d/.test(c.t.replace(/\s/g, '')))).map(c => {
      const m = parseMemberTile(c.t)
      const r = BRAIN.recruitScore(m, virtual)
      return { ...c, kw: m.kw || m.keyword, role: m.role, score: r.score, why: r.reasons, name: m.name }
    }).sort((a, b) => b.score - a.score)
  }

  // ── Aug 4 2026: LOG THE SLATE ON EVERY DRAFT ────────────────────────
  // draft_options used to be emitted only inside the loop at attempt===0, so it
  // fired 2 times against 63 draft_confirms — a draft whose candidates were
  // already selected on entry logged nothing at all, and the report's pick rates
  // were computed from an n of 2. Emit before anything else, deduped by the slate
  // itself so repeated ticks on the SAME screen don't inflate the offer counts.
  const opening = parse(s, [])
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
      // Loop-breaker: if we've already confirmed this draft screen several times
      // without ever advancing (the post-victory no-op-button hang), stop clicking
      // the dead button and force a clean reload to the menu instead.
      draftConfirmStreak++
      if (draftConfirmStreak >= 3) {
        const shot = await P.shot('draft-stuck-reload-' + Date.now()).catch(() => null)
        ev('draft_stuck_reload', { confirms: draftConfirmStreak, seed, shot, text: st.text.slice(0, 400) })
        draftConfirmStreak = 0; lastDraftSig = ''
        await P.evaljs("localStorage.removeItem('vst_save_v4'); setTimeout(()=>location.reload(),50); 'x'").catch(() => {})
        await new Promise(r => setTimeout(r, 5000))
        return
      }
      await P.click(ready.x, ready.y)
      ev('draft_confirm', { attempt, seed })
      // ONE outcome row per draft with the names actually confirmed. draft_click
      // is an INTENT (logged before the click); this is the result.
      ev('draft_result', { seed, pickCount, offeredCount: opening.length, offered: opening.map(c => c.name), confirmed: [...new Set(clicked)] })
      lastDraftSig = ''
      return
    }
    // Re-score against what is already clicked: recruitScore's stack-tier and
    // mentor-link terms do the "keyword pair" job properly, so the old hardcoded
    // "boost anyone sharing the top pick's keyword" heuristic is gone.
    const cand = parse(st, clicked)
    if (!cand.length) { ev('draft_confused', { msg: 'no candidates parsed' }); lastDraftSig = ''; return }
    const order = cand.filter(c => !clicked.includes(c.name)).concat(cand)
    const pick = order[attempt % order.length]
    ev('draft_click', { attempt, pick: pick.t.slice(0, 30), name: pick.name, score: pick.score, why: pick.why })
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
    // Aug 4 2026: this used to reload the game WITHOUT closing the run out, so
    // `runActive` stayed true; the menu handler's `if (!runActive)` guard then
    // suppressed run_start for the run that came back, and the analyzer fused it
    // onto the abandoned one — the same run-fusion bug that made the win rate read
    // 18% instead of 5%, arriving down a different path.
    preferNewRun = true
    try { emitRunSummary('abandoned_watchdog', { reason: 'hard/action watchdog soft restart' }) } catch (e) {}
    runActive = false
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
    if (type !== 'draft') draftConfirmStreak = 0 // reset the post-victory draft loop-breaker once we advance off Opening Night
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
      else if (type === 'boosterpick') await cardPickTick(s)
      else if (type === 'credits') { ev('credits_seen', {}); const vp = await P.evaljs('({w:innerWidth,h:innerHeight})'); await P.click(Math.round(vp.w / 2), Math.round(vp.h / 2)) }
      else if (type === 'pause') {
        // ESC toggles the overlay (App.jsx ~7795). If the keypress does not land
        // — the window can lose focus, and the overlay is the one screen with no
        // "continue" button — the backdrop's own onClick closes it, so click a
        // corner well outside the centred panel. Never click ABANDON RUN.
        ev('pause_overlay', { note: 'ESC pause overlay — dismissing' })
        await P.key('Escape').catch(() => {})
        const after = await P.state().catch(() => null)
        if (after && /PAUSED/i.test(after.text)) {
          const vp = await P.evaljs('({w:innerWidth,h:innerHeight})').catch(() => null)
          if (vp) await P.click(Math.round(vp.w * 0.06), Math.round(vp.h * 0.06)).catch(() => {})
          const after2 = await P.state().catch(() => null)
          if (after2 && /PAUSED/i.test(after2.text)) ev('pause_stuck', { note: 'ESC and backdrop click both failed' })
        }
      }
      else if (type === 'splash' || type === 'boot') { const vp = await P.evaljs('({w:innerWidth,h:innerHeight})').catch(() => null); if (vp) await P.click(Math.round(vp.w / 2), Math.round(vp.h * 0.9)).catch(() => {}) }
      else if (type === 'demonicconflict') {
        // Two DEMONIC members can't coexist. Keep the higher ATK+HP one.
        const opts = s.clickables.filter(c => /ATK\s*\d/.test(c.t))
        const val = t => BRAIN.recruitScore(parseMemberTile(t), bandNow()).score
        const best = opts.sort((a, b) => val(b.t) - val(a.t))[0]
        ev('demonic_conflict', { picked: best ? best.t.slice(0, 40) : 'none', of: opts.length })
        if (best) await P.click(best.x, best.y)
        else for (const b of ['keep', 'confirm', 'continue']) { try { await P.clickText(b); break } catch (e) {} }
      }
      else if (type === 'slotswap') await slotSwapTick(s)
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
