// ═══════════════════════════════════════════════════════════════════════════
//  e2e/test-card-parity.cjs — EMPIRICAL CARD PARITY: engine vs the LIVE GAME
// ═══════════════════════════════════════════════════════════════════════════
//
//  WHY
//  ---
//  src/data/cardEngine.js was hand-transcribed from src/App.jsx `applyCard`.
//  "It looks right" is exactly how the sim shipped months of fantasy numbers.
//  This file proves parity by MEASUREMENT: for every card in the default
//  Standard 69-card deck it plants a deterministic board in the REAL running
//  game, plays the card through the real quick-play path, reads the real state
//  back, and compares the real deltas against applyCardEffect's prediction.
//
//  Nothing here is asserted from the source. Every "live" number is read out of
//  the running app.
//
//  HOW LIVE STATE IS READ
//  ----------------------
//  Two independent channels, both from the running game:
//    1. the DEBUG HUD (Shift+`, gated on localStorage vst_debug='1'). This is
//       React state rendered verbatim: per-slot hp/maxHp/atk, embers, corruption,
//       stash, hand/deck/discard lengths, enemyHp, animPhase. It is the primary
//       measurement because it is the state itself, not a display derivation.
//    2. autopilot.perceive() — the bot's own DOM perception. Used for card/member
//       hit coordinates, bossMaxHp, and as a CROSS-CHECK on atk/hp/corruption/
//       embers. If the two channels ever disagree the run aborts loudly, because
//       that would mean one of them is lying and no number below is trustworthy.
//
//  ACCOUNTING RULES (derived by reading App.jsx, verified by the test itself)
//  -------------------------------------------------------------------------
//    * The engine leaves the played card IN S.hand and does NOT push it to
//      S.discard — the CALLER does both. So:
//          predicted live hand    = engineHand.length - 1
//          predicted live discard = engineDiscard.length + 1
//    * Live charges embers AFTER the card's own ember gain, in a single clamped
//      expression. The scenarios keep embers at 5/8 so no clamp edge is hit and
//      `engineEmbers - out.emberCost` is exact.
//    * Live's `applyCard` returns false BEFORE mutating anything on a rejection,
//      so `ok:false` predicts "nothing changed at all".
//
//  CURRENT RESULT (Aug 1 2026): 51 scenarios, 50 pass, 1 mismatch.
//  The single mismatch is a real ENGINE BUG, left in place deliberately so this
//  file keeps failing until the engine is fixed:
//
//    setbreak (Smoke Break) | handLen | live=4 engine=5
//    setbreak (Smoke Break) | deckLen | live=12 engine=11
//
//    IMPL.setbreak ends with `draw(S, 1, C.rng)` and logs "Drew 1 card".
//    Live draws NOTHING. App.jsx ~6355 calls
//        drawUpTo(remaining, deckRef.current, [...discRef.current,card,victim], 1)
//    with a REFILL TARGET of 1 (not remaining.length+1), and then throws the
//    return value away — it is never fed to setHand/setDeck. Two independent
//    reasons the card can never arrive. Measured: hand 6→4, deck 12→12.
//    Engine overstates Smoke Break by one card of draw every time it is played.
//
//  Run:   node e2e/test-card-parity.cjs            (all cards)
//         node e2e/test-card-parity.cjs amp battlecry   (subset)
//  Rig:   bash e2e/up.sh   (idempotent; game on :4173, CDP on :9222)
// ═══════════════════════════════════════════════════════════════════════════

const P = require('./pilot.cjs')
const { perceive } = require('./autopilot.cjs')
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── deterministic RNG (never Math.random) ─────────────────────────────────
function mkRng(seed) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000 }
}

// ═══════════════════════════════════════════════════════════════════════════
//  BOARD PLANT
// ═══════════════════════════════════════════════════════════════════════════
// fightIndex 13 = The Berserker (maxHp 2274, passiveId 'bloodlust'). Chosen
// deliberately: mid-game so the boss has thousands of HP (no card in the deck
// can kill it and end the fight mid-measurement), and 'bloodlust' is a
// boss-attack passive — unlike Circle III's cardHeal* bosses it does NOT move
// enemyHp when a card is played, so boss-HP deltas are pure card effect.
const FIGHT_INDEX = 13
const CIRCLE_NUM = 5

// Corruption 76: above every gate the deck cares about (40 Dark Tuning, 50
// bonus tiers, 70 Dark Tuning's 3-member tier) AND above all three corruption
// gift thresholds (25/50/75) — so all three gift cards are already in hand at
// load and no NEW gift can appear mid-measurement to move the hand count.
const BASE = {
  fi: FIGHT_INDEX, co: 76, em: 5, mx: 8, st: 100, sl: 3, ms: 4, dl: 3,
  deckLen: 12,
}

// Slot layout. No CORRUPT keyword (the ATK readout adds a corruption bonus for
// CORRUPT members, which would desync the DOM cross-check from real `atk`), and
// no FALLEN (which blocks every heal).
const MEMBERS = [
  { id: 'bjorn',  name: 'Bjorn',  role: 'Lead Guitarist',   kw: 'FRENZIED', atk: 9, hp: 20, maxHp: 20 },
  { id: 'gunnar', name: 'Gunnar', role: 'Rhythm Guitarist', kw: 'SHREDDER', atk: 6, hp: 10, maxHp: 18 },
  { id: 'ingrid', name: 'Ingrid', role: 'Bass Player',      kw: 'ANCHOR',   atk: 4, hp: 16, maxHp: 16 },
  { id: 'orm',    name: 'Orm',    role: 'Dark Minstrel',    kw: 'HEXED',    atk: 3, hp: 0,  maxHp: 11, stoned: true },
]

// The three corruption gift cards live appends to hand at 25/50/75%, in that
// order (App.jsx ~5031 forEach over [25,50,75]). Verified empirically below.
const GIFTS = ['dark_whisper', 'blood_price', 'void_pact']

function plantScript(handIds, over) {
  const o = Object.assign({}, BASE, over || {})
  const mem = (over && over.members) || MEMBERS
  const stage = mem.map(m => ({
    id: m.id, name: m.name, hp: m.hp, maxHp: m.maxHp, atk: m.atk, role: m.role,
    keyword: m.kw, tooStoned: !!m.stoned, uid: 'u_' + m.id,
    foil: false, mythic: false, demonic: false,
    permAtkBonus: 0, tempAtkBonus: 0, tempBuff: false,
    encoreReady: false, stoneShield: false, buffCount: 0, _hrUsed: false,
  }))
  while (stage.length < 5) stage.push(null)
  const save = {
    v: 1, gs: 'playing', fi: o.fi, seed: 555, deck: 'standard', relicsSeen: [],
    stage,
    dk: Array.from({ length: o.deckLen }, () => 'newstrings'),
    hand: handIds, disc: [],
    em: o.em, mx: o.mx, st: o.st, co: o.co, sl: o.sl, ms: o.ms, dl: o.dl,
    pa: [], art: [], pas: [], loot: [], upg: [],
    stats: { fightsSurvived: 13, strikesThrown: 30, totalDamage: 4000, highestStrike: 200, tooStonedCount: 1, maxCorruption: o.co, stashEarned: 200, cardsPlayed: 60 },
    shrooms: 0, acid: 0, dmt: false,
  }
  return `(() => {
    localStorage.setItem('vst_debug','1');localStorage.setItem('vst_heat','1');localStorage.setItem('vst_no_lucifer','1')
    localStorage.setItem('vst_hoverzoom','off');localStorage.setItem('vst_shake','off')
    localStorage.setItem('vst_handsort','none');localStorage.setItem('vst_chainhints','0')
    localStorage.setItem('vst_mastery','{}');localStorage.setItem('vst_lifetime','999999')
    localStorage.setItem('vst_active_stake','bronze')
    localStorage.setItem('vst_save_v4',${JSON.stringify(JSON.stringify(save))})
    return 1
  })()`
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIVE STATE READ
// ═══════════════════════════════════════════════════════════════════════════
const READ_LIVE = `(() => {
  let hud = null
  for (const el of document.querySelectorAll('div')) {
    const t = el.textContent || ''
    if (t.indexOf('\\u2501 DEBUG \\u2501') === 0) { hud = el.innerText; break }
  }
  // encore badges ("\\uD83D\\uDD01\\u00D72") rendered on StageSlot when encoreReady
  const badges = []
  for (const el of document.querySelectorAll('div')) {
    const t = (el.textContent || '').trim()
    if (t === '\\uD83D\\uDD01\\u00D72' && el.children.length === 0) {
      const r = el.getBoundingClientRect()
      if (r.width > 0) badges.push(Math.round(r.x + r.width / 2))
    }
  }
  // HAND CARD ROOTS, read STRUCTURALLY (HandCard's root is the only 210x310 div).
  // autopilot.perceive() parses the hand out of innerText, which drops a Stage
  // Dive already spent this round (its "USED" stamp lands before the cost digit
  // and breaks the ^\\d+ anchor) and collapses very small hands into their own
  // container. Neither is acceptable when the whole point is clicking card #N.
  const cards = []
  for (const el of document.querySelectorAll('div')) {
    const st = el.style
    if (!st || st.width !== '210px' || st.height !== '310px') continue
    const r = el.getBoundingClientRect()
    if (r.width <= 0) continue
    cards.push({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: (el.textContent || '').replace(/\\s+/g, ' ').slice(0, 60) })
  }
  cards.sort((a, b) => a.x - b.x)
  return { hud, badges, cards }
})()`

function parseHud(txt) {
  if (!txt) return null
  const g = (re, n) => { const m = txt.match(re); return m ? +m[n] : null }
  const s = {
    phase: (txt.match(/phase:\s*(\w+)/) || [])[1] || null,
    strikesLeft: g(/strikes:\s*(\d+)\/(\d+)/, 1),
    maxStrikes: g(/strikes:\s*(\d+)\/(\d+)/, 2),
    discardsLeft: g(/strikes:[^\n]*·\s*disc:\s*(\d+)/, 1),
    embers: g(/embers:\s*(\d+)\/(\d+)/, 1),
    maxEmbers: g(/embers:\s*(\d+)\/(\d+)/, 2),
    corruption: g(/corruption:\s*(\d+)%/, 1),
    stash: g(/stash:\s*(-?\d+)/, 1),
    hand: g(/hand:\s*(\d+)\s*·\s*deck:\s*(\d+)\s*·\s*disc:\s*(\d+)/, 1),
    deck: g(/hand:\s*(\d+)\s*·\s*deck:\s*(\d+)\s*·\s*disc:\s*(\d+)/, 2),
    discard: g(/hand:\s*(\d+)\s*·\s*deck:\s*(\d+)\s*·\s*disc:\s*(\d+)/, 3),
    enemyHp: g(/enemyHp:\s*(-?\d+)/, 1),
    stage: [null, null, null, null, null],
  }
  const re = /\[(\d)\]\s*(♦|☠)\s*(.+?)\s+(-?\d+)\/(-?\d+)\s+atk:(-?\d+)/g
  let m
  while ((m = re.exec(txt))) {
    s.stage[+m[1]] = { name: m[3].trim(), hp: +m[4], maxHp: +m[5], atk: +m[6], stoned: m[2] === '☠' }
  }
  return s
}

/** One full live snapshot: HUD state + perceive() cross-check + coordinates. */
async function snap() {
  const raw = await P.evaljs(READ_LIVE)
  const hud = parseHud(raw && raw.hud)
  if (!hud) throw new Error('DEBUG HUD not found — is vst_debug set and Shift+` pressed?')
  const g = await perceive()
  // map encore badges to slots by nearest member x
  const encore = [false, false, false, false, false]
  for (const bx of raw.badges) {
    let best = -1, bd = 1e9
    hud.stage.forEach((s, i) => {
      if (!s) return
      const mem = g.members.find(mm => mm.name === s.name)
      if (!mem) return
      const d = Math.abs(mem.x - bx)
      if (d < bd) { bd = d; best = i }
    })
    if (best >= 0 && bd < 200) encore[best] = true
  }
  return { hud, g, encore, cards: raw.cards || [], bossMaxHp: g.bossMaxHp }
}

/** Poll until the game has settled: animPhase idle + two identical reads. */
async function settle(maxMs = 9000) {
  let prev = null, stableAt = 0
  const t0 = Date.now()
  while (Date.now() - t0 < maxMs) {
    const raw = await P.evaljs(READ_LIVE)
    const hud = parseHud(raw && raw.hud)
    const key = JSON.stringify(hud)
    if (hud && hud.phase === 'idle' && key === prev) {
      stableAt++
      if (stableAt >= 2) return
    } else { stableAt = 0 }
    prev = key
    await sleep(220)
  }
}

/** Cross-check the two independent live channels. Disagreement = abort. */
function crossCheck(cardId, tag, s, problems) {
  const { hud, g } = s
  const push = (f, a, b) => problems.push(`${cardId} | CROSS-CHECK ${tag} ${f} | hud=${a} dom=${b}`)
  if (hud.corruption !== g.corruption) push('corruption', hud.corruption, g.corruption)
  if (hud.embers !== g.embers) push('embers', hud.embers, g.embers)
  if (hud.enemyHp !== g.bossHp) push('bossHp', hud.enemyHp, g.bossHp)
  // hand length is cross-checked against the STRUCTURAL card read, not
  // perceive()'s innerText parse (see READ_LIVE for why that one is unreliable
  // for USED cards and 3-card hands).
  if (hud.hand !== s.cards.length) push('handLen', hud.hand, s.cards.length)
  for (const m of hud.stage) {
    if (!m) continue
    const d = g.members.find(x => x.name === m.name)
    if (!d) { push('member:' + m.name, 'present', 'MISSING'); continue }
    if (d.atk !== m.atk) push('atk:' + m.name, m.atk, d.atk)
    if (d.hp !== m.hp) push('hp:' + m.name, m.hp, d.hp)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  ENGINE MIRROR
// ═══════════════════════════════════════════════════════════════════════════
function engineStateFrom(s, handIds, memberDefs) {
  const stage = s.hud.stage.map((m, i) => {
    if (!m) return null
    const def = memberDefs.find(d => d.name === m.name) || {}
    return {
      uid: 'u_' + (def.id || m.name), id: def.id || m.name, name: m.name,
      atk: m.atk, hp: m.hp, maxHp: m.maxHp,
      role: def.role || '', keyword: def.kw || '',
      tooStoned: m.stoned, stoneShield: 0, tempBuff: false,
      permAtkBonus: 0, tempAtkBonus: 0, buffCount: 0,
      foil: false, mythic: false, demonic: false,
      _hrUsed: false, ampedCount: 0, encoreReady: s.encore[i],
    }
  })
  while (stage.length < 5) stage.push(null)
  return {
    stage,
    corruption: s.hud.corruption,
    embers: s.hud.embers,
    maxEmbers: s.hud.maxEmbers,
    stash: s.hud.stash,
    strikeMult: 1,
    bossHp: s.hud.enemyHp,
    bossMaxHp: s.bossMaxHp,
    bossDebuff: 0,
    hand: handIds.map((id, i) => ({ id, uid: 'h' + i })),
    deck: Array.from({ length: s.hud.deck }, (_, i) => ({ id: 'newstrings', uid: 'd' + i })),
    discard: Array.from({ length: s.hud.discard }, (_, i) => ({ id: 'newstrings', uid: 'x' + i })),
    strikesLeft: s.hud.strikesLeft,
    fightMaxStrikes: s.hud.maxStrikes,
    discardsLeft: s.hud.discardsLeft,
    cardsPlayedIds: [],
    directDmg: 0,
    pendingDraw: 0,
    pendingEmbers: 0,
    flags: {
      nextCardFree: false, allCardsFree: false, freeCardsLeft: 0,
      stageDiveUsed: false, possessedActive: false, overdriveActive: false,
      infencoreActive: false, bossSkipStrikes: 0, slowBurnStrikes: 0,
      pyromaniacActive: false, venomDotStacks: 0, tripBuff: null,
      cursedNoHeal: false, ampFeedbackDiscount: 0, lastRiffId: null,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCENARIOS — one per card of the default Standard 69-card deck
// ═══════════════════════════════════════════════════════════════════════════
// filler cards are chosen so no RIFF_CHAIN can fire (a chain needs BOTH of a
// pair played in the same strike; only ONE card is ever played per scenario, so
// chains are structurally impossible — but the fillers are never played anyway).
const FILL = ['newstrings', 'roadie']

// slot: 0 Bjorn (9/20-20), 1 Gunnar (6/10-18 injured), 2 Ingrid (4/16-16), 3 Orm (stoned)
// `id` is the row label; `card` is the card actually played (defaults to `id`)
// so a card can appear in several scenarios (gate open / gate closed / repeat).
const SC = (id, opts = {}) => {
  const card = opts.card || id
  return Object.assign({ id, card, slot: 0, hand: [card, ...FILL] }, opts)
}

/** Which corruption gift cards live will already have appended to hand. */
const giftsFor = corr => GIFTS.filter((_, i) => corr >= [25, 50, 75][i])

const SCENARIOS = [
  // ── RIFF ────────────────────────────────────────────────────────────────
  SC('amp'),
  SC('battlecry'),
  SC('newstrings'),
  SC('encore'),
  SC('burnset', { hand: ['burnset', 'newstrings', 'roadie'], selectIdx: [1, 2] }),
  SC('soundwall'),
  SC('stagedive', { slot: 2 }),
  SC('infencore'),
  SC('possessedperf'),
  SC('crowdsurf'),
  SC('heavyriff'),
  SC('resonancecard', { slot: 2 }),
  SC('herbmoney'),
  SC('moshpit'),
  // Demo Tape needs a real RIFF in live's lastRiffPlayedRef, which the save
  // format does not carry — so a Battle Cry is genuinely played first and the
  // baseline snapshot is taken AFTER it. `playIdx` is the index in the hand as
  // it exists after that pre-play removed the Battle Cry.
  SC('demotape', { hand: ['battlecry', 'demotape', 'roadie'], preplay: { idx: 0, slot: 0 }, playIdx: 0, lastRiffId: 'battlecry' }),
  // ── UTILITY ─────────────────────────────────────────────────────────────
  SC('soundcheck'),
  SC('roadie', { slot: 1 }),
  SC('wakeup'),
  SC('setbreak'),
  SC('setlist', { setlistModal: true }),
  // ── EMBER ───────────────────────────────────────────────────────────────
  SC('groupie'),
  SC('tappedout'),
  SC('powertap'),
  SC('soundboard'),
  SC('ampoverload'),
  // ── CORRUPT ─────────────────────────────────────────────────────────────
  SC('dialtoeleven'),
  SC('sigdecay'),
  SC('feedbackloop'),
  SC('controlfeedback', { slot: 1 }),
  SC('deathriff'),
  SC('ampstatic'),
  SC('distortion'),
  SC('seance'),
  SC('staticcharge'),
  // Dark Tuning picks its buff targets with Math.random() in live, which the
  // headless engine cannot mirror. Both sides are still checked for HOW MANY
  // members gained HOW MUCH — just not which ones. (Note both sides also only
  // reach 2 of the advertised 3 members: `for(i<Math.min(count,slots.length))`
  // re-evaluates against a list the loop body splices. Live bug, faithfully
  // reproduced by the engine — so the multiset comparison still catches a
  // divergence in the count.)
  SC('darktuning', { atkMode: 'multiset' }),
  SC('bloodritual', { slot: 2 }),
  // ── CORRUPTION GIFT CARDS (enter hand at 25/50/75% — not deck cards) ────
  SC('dark_whisper', { hand: FILL, giftIdx: 0 }),
  SC('blood_price', { hand: FILL, giftIdx: 1 }),
  SC('void_pact', { hand: FILL, giftIdx: 2 }),

  // ══ SECOND PASS: the OTHER side of every branch the deck actually hits ══
  // The scenarios above all run at 76% Corruption. Every ≥50% / ≥70% / ==0%
  // threshold in these cards is therefore only half-tested. These re-run the
  // same cards on the low side of their gate.
  SC('seance@30',        { card: 'seance',        plant: { co: 30 } }),   // heal 3, not 6
  SC('feedbackloop@30',  { card: 'feedbackloop',  plant: { co: 30 } }),   // +2 ATK, not +4
  SC('ampstatic@30',     { card: 'ampstatic',     plant: { co: 30 } }),   // +2 ATK, not +4
  SC('staticcharge@0',   { card: 'staticcharge',  plant: { co: 0 } }),    // +4 embers, not +2
  SC('darktuning@45',    { card: 'darktuning',    plant: { co: 45 }, atkMode: 'multiset' }),

  // ══ REJECTION PATHS — a card the caller must NOT charge for ══
  // `ok:false` predicts "nothing changed at all"; the test verifies live agrees
  // on every field including the ember charge and the card staying in hand.
  SC('darktuning<40',    { card: 'darktuning',    plant: { co: 30 } }),   // corrReq gate
  SC('herbmoney/broke',  { card: 'herbmoney',     plant: { st: 5 } }),    // needs 10 stash
  SC('ampoverload/nodisc', { card: 'ampoverload', plant: { dl: 0 } }),    // needs a discard
  SC('resonance/atMax',  { card: 'resonancecard', slot: 0 }),             // target already max ATK
  SC('carrion/noStoned', { card: 'wakeup', plant: { members: MEMBERS.slice(0, 3) } }), // heal-only branch

  // ══ ONCE-PER-X INVARIANTS (named in the engine header as shipped bugs) ══
  // Play the card, snapshot, play a second copy at the same target: the second
  // must be rejected in live AND in the engine, with no ember charge.
  SC('heavyriff×2', {
    card: 'heavyriff', hand: ['heavyriff', 'heavyriff', 'roadie'],
    preplay: { idx: 0, slot: 0 }, playIdx: 0,
    patchEngine: S => { S.stage[0]._hrUsed = true },
  }),
  SC('stagedive×2', {
    card: 'stagedive', slot: 2, hand: ['stagedive', 'stagedive', 'roadie'],
    plant: { em: 8 },   // so the SECOND play fails on the gate, not on embers
    preplay: { idx: 0, slot: 2 }, playIdx: 0,
    patchEngine: S => { S.flags.stageDiveUsed = true },
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
//  SCENARIO RUNNER
// ═══════════════════════════════════════════════════════════════════════════
async function loadScenario(sc) {
  await P.evaljs(plantScript(sc.hand, sc.plant))
  await P.evaljs('location.reload()')
  // wait for the title screen's CONTINUE button rather than sleeping blind
  let cont = null
  for (let i = 0; i < 30; i++) {
    await sleep(400)
    const st = await P.state()
    cont = st.clickables.find(c => /CONTINUE RUN|CONTINUE|RESUME/i.test(c.t))
    if (cont) break
  }
  if (!cont) throw new Error('no CONTINUE button after reload')
  await P.click(cont.x, cont.y)
  // wait for combat
  for (let i = 0; i < 30; i++) {
    await sleep(350)
    const st = await P.state()
    if (st.clickables.some(c => /STRIKE/i.test(c.t))) break
  }
  await P.key('Shift+Backquote')
  await sleep(400)
  const raw = await P.evaljs(READ_LIVE)
  if (!raw || !raw.hud) { await P.key('Shift+Backquote'); await sleep(400) }
  await settle(4000)
}

/** click a hand card (toggles `selected` + quickPlayCardUid, then toggles back off) */
async function toggleSelect(s, idx) {
  const c = s.cards[idx]
  if (!c) throw new Error('no hand card at index ' + idx)
  await P.click(c.x, c.y)
  await sleep(200)
}

async function playHandCard(s, idx, memberName) {
  const c = s.cards[idx]
  if (!c) throw new Error('no hand card at index ' + idx + ' (hand: ' + s.cards.map(x => x.t).join(' | ') + ')')
  const mem = s.g.members.find(m => m.name === memberName)
  if (!mem) throw new Error('member not on stage: ' + memberName)
  await P.playCard(c.x, c.y, mem.x, mem.y)
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPARISON
// ═══════════════════════════════════════════════════════════════════════════
function compare(cardId, A, B, S, out, ctx) {
  const mm = []
  const cmp = (field, live, engine) => {
    if (live !== engine) mm.push(`${cardId} | ${field} | live=${live} engine=${engine}`)
  }
  const rejected = !out.ok

  // ── per-member atk / hp ────────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    const la = A.hud.stage[i], lb = B.hud.stage[i], e = S.stage[i]
    if (!la && !lb && !e) continue
    if (!lb || !e) { mm.push(`${cardId} | slot${i} | live=${lb ? lb.name : 'null'} engine=${e ? e.name : 'null'}`); continue }
    if (ctx.atkMode !== 'multiset') cmp(`slot${i}(${lb.name}).atk`, lb.atk, e.atk)
    cmp(`slot${i}(${lb.name}).hp`, lb.hp, e.hp)
    cmp(`slot${i}(${lb.name}).tooStoned`, lb.stoned, !!e.tooStoned)
    cmp(`slot${i}(${lb.name}).encoreReady`, B.encore[i], !!e.encoreReady)
  }
  // RNG-targeted buffs: compare the SORTED atk deltas, so "2 members gained +1"
  // is verified even though live's Math.random() picked different slots.
  if (ctx.atkMode === 'multiset') {
    const liveD = [], engD = []
    for (let i = 0; i < 5; i++) {
      const la = A.hud.stage[i], lb = B.hud.stage[i], e = S.stage[i]
      if (!la || !lb || !e) continue
      liveD.push(lb.atk - la.atk); engD.push(e.atk - la.atk)
    }
    liveD.sort((a, b) => a - b); engD.sort((a, b) => a - b)
    cmp('atkDeltas(multiset)', JSON.stringify(liveD), JSON.stringify(engD))
  }

  // ── resources ──────────────────────────────────────────────────────────
  cmp('corruption', B.hud.corruption, S.corruption)
  cmp('embers', B.hud.embers, rejected ? A.hud.embers : Math.max(0, S.embers - out.emberCost))
  cmp('stash', B.hud.stash, S.stash)
  cmp('bossHp', B.hud.enemyHp, S.bossHp)
  cmp('discardsLeft', B.hud.discardsLeft, S.discardsLeft)

  // ── hand / deck / discard.  Engine leaves the played card in hand and out
  //    of discard; the caller (live) moves it. Hence the ±1.
  const selfMoved = rejected ? 0 : 1
  cmp('handLen', B.hud.hand, S.hand.length - selfMoved + (ctx.extraHandDelta || 0))
  cmp('deckLen', B.hud.deck, S.deck.length)
  cmp('discardLen', B.hud.discard, S.discard.length + selfMoved + (ctx.extraDiscardDelta || 0))

  return mm
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════
;(async () => {
  const eng = await import('file://' + require('path').resolve(__dirname, '../src/data/cardEngine.js'))
  const { applyCardEffect, CARD_DEFS } = eng

  const only = process.argv.slice(2).filter(a => !a.startsWith('-'))
  const list = only.length ? SCENARIOS.filter(s => only.includes(s.id)) : SCENARIOS

  await P.connect()

  const rows = []          // {id, status, detail}
  const skipped = []       // {id, reason}
  const engineBugs = []    // mismatch lines
  const crossProblems = []

  for (const sc of list) {
    let row = { id: sc.id, status: 'ERROR', detail: '' }
    try {
      await loadScenario(sc)

      // ── resolve the true hand layout (planted ids + the corruption gifts
      //    live appends for every threshold the planted Corruption is past) ──
      let A = await snap()
      const memberDefs = (sc.plant && sc.plant.members) || MEMBERS
      const handIds = sc.hand.concat(giftsFor((sc.plant && sc.plant.co !== undefined) ? sc.plant.co : BASE.co))
      if (A.hud.hand !== handIds.length) {
        throw new Error(`hand length ${A.hud.hand} != expected ${handIds.length} (${handIds.join(',')})`)
      }
      crossCheck(sc.id, 'pre', A, crossProblems)

      // ── optional pre-play (Demo Tape needs a real RIFF in lastRiffPlayedRef) ──
      if (sc.preplay) {
        await playHandCard(A, sc.preplay.idx, memberDefs[sc.preplay.slot].name)
        await settle()
        A = await snap()
        // the pre-played card left hand
        handIds.splice(sc.preplay.idx, 1)
        if (A.hud.hand !== handIds.length) throw new Error('preplay hand desync')
        crossCheck(sc.id, 'pre2', A, crossProblems)
      }

      // ── optional pre-selection (Burn the Set reads `selected`) ──
      const selectedUids = []
      if (sc.selectIdx) {
        for (const i of sc.selectIdx) { await toggleSelect(A, i); selectedUids.push('h' + i) }
        A = await snap()   // selection does not change game state, but re-read coords
      }

      // ── play the card ──
      const playIdx = sc.giftIdx !== undefined
        ? sc.hand.length + sc.giftIdx
        : (sc.playIdx !== undefined ? sc.playIdx : 0)
      const targetName = memberDefs[sc.slot].name
      const liveCardName = A.cards[playIdx] ? A.cards[playIdx].t.slice(0, 34) : '?'
      await playHandCard(A, playIdx, targetName)
      await settle()

      const ctxExtra = { extraHandDelta: 0, extraDiscardDelta: 0, atkMode: sc.atkMode }

      // ── Setlist forces a modal discard before the hand settles ──
      if (sc.setlistModal) {
        const st = await P.state()
        const confirm = st.clickables.find(c => /DISCARD & CONTINUE/i.test(c.t))
        if (!confirm) throw new Error('Setlist modal did not open')
        // pick any card in the modal (a 150px card tile) that is not the button
        const pick = st.clickables.find(c => /RIFF|UTILITY|EMBER|CORRUPT/.test(c.t) && !/DISCARD & CONTINUE/i.test(c.t) && c.w > 100 && c.w < 220)
        if (!pick) throw new Error('no card tile in Setlist modal')
        await P.click(pick.x, pick.y)
        await sleep(300)
        const st2 = await P.state()
        const confirm2 = st2.clickables.find(c => /DISCARD & CONTINUE/i.test(c.t))
        await P.click(confirm2.x, confirm2.y)
        await settle()
        // NOTE: no extra delta here. Live's forced discard happens in the modal;
        // the engine performs the same discard inline (its documented rng-for-
        // player-choice substitution). Counting it twice was a TEST bug.
      }

      const B = await snap()
      crossCheck(sc.id, 'post', B, crossProblems)

      // ── engine prediction from snapshot A ──
      const S = engineStateFrom(A, handIds, memberDefs)
      // Carry the once-per-X flags live tracks in refs the HUD does not expose
      // (member._hrUsed, stageDiveUsed) into the mirrored engine state.
      if (sc.patchEngine) sc.patchEngine(S)
      const card = CARD_DEFS[sc.card]
      const out = applyCardEffect(sc.card, S, {
        targetIdx: sc.slot,
        artifacts: [], passives: [], pacts: [], loot: [],
        upgraded: false,
        fightIndex: FIGHT_INDEX, circleNum: CIRCLE_NUM,
        rng: mkRng(0x51ede5 + sc.id.length),
        lastRiffId: sc.lastRiffId !== undefined ? sc.lastRiffId : null,
        selectedUids,
        selfUid: 'h' + playIdx,
        emberCost: card ? (card.embers || 0) : 0,
        bossPassiveId: null,   // fight 13 = 'bloodlust', no cardHeal
      })

      const mm = compare(sc.id, A, B, S, out, ctxExtra)
      if (mm.length === 0) {
        row = { id: sc.id, status: 'PASS', detail: `${liveCardName} → ${targetName}` }
      } else {
        row = { id: sc.id, status: 'MISMATCH', detail: mm.length + ' field(s)' }
        engineBugs.push(...mm)
      }
    } catch (e) {
      row = { id: sc.id, status: 'SKIP', detail: e.message }
      skipped.push({ id: sc.id, reason: e.message })
    }
    rows.push(row)
    const mark = row.status === 'PASS' ? '✓' : row.status === 'MISMATCH' ? '✗' : '–'
    console.log(`  ${mark} ${row.status.padEnd(9)} ${row.id.padEnd(16)} ${row.detail}`)
  }

  // ═══ REPORT ═══
  console.log('\n══ MISMATCH DETAIL ══')
  if (engineBugs.length === 0) console.log('  (none)')
  for (const b of engineBugs) console.log('  ' + b)

  if (crossProblems.length) {
    console.log('\n══ PERCEPTION DISAGREEMENT (HUD vs DOM — measurements untrustworthy) ══')
    for (const c of crossProblems) console.log('  ' + c)
  }

  if (skipped.length) {
    console.log('\n══ SKIPPED ══')
    for (const s of skipped) console.log(`  ${s.id}: ${s.reason}`)
  }

  console.log('\n══ NOT OBSERVABLE FROM OUTSIDE (not asserted here) ══')
  for (const l of [
    'pendingEmbers  — Tapped Out\'s "+5 next Strike" is a ref live never renders.',
    'pendingDraw    — Soundboard\'s "+1 draw next Strike", same.',
    'strikeMult     — the per-card ×1.08 tail is applied by both, but the HUD',
    '                 does not print it; it only becomes visible at Strike time.',
    'tempBuff/_origAtk — internal expiry bookkeeping. Its EFFECT (a buff that',
    '                 does or does not survive the Strike) is a handleStrike',
    '                 concern, not an applyCard one, so it is out of scope here.',
    'buffCount      — not rendered numerically; the 3-buff +20% Corruption',
    '                 trigger it drives IS covered, via the corruption field.',
    'Cards outside the Standard 69: every ALL_CARDS entry with copies:0 (the',
    '                 alt-deck riffs, Setlist Rewrite, Bootleg Copy, ...) plus the',
    '                 shopOnly set (Overdrive, Remaster, Sabbath Sigil, Double',
    '                 Down, Going Broke, Hellfire Rift, Soul Sacrifice, Void',
    '                 Pact). They never start in a Standard deck, but the shop and',
    '                 booster pools DO offer them (App.jsx ~916 draws from',
    '                 getUnlockedCards() unfiltered by copies), so a long run can',
    '                 acquire them. Untested by this file.',
  ]) console.log('  ' + l)

  const passed = rows.filter(r => r.status === 'PASS').length
  const mism = rows.filter(r => r.status === 'MISMATCH').length
  const skip = rows.filter(r => r.status === 'SKIP').length
  console.log(`\n${rows.length} tested, ${passed} passed, ${mism} mismatched, ${skip} skipped`)
  process.exit((mism || skip || crossProblems.length) ? 1 : 0)
})().catch(e => { console.log('HARNESS FAIL:', e.message); console.log(e.stack); process.exit(1) })
