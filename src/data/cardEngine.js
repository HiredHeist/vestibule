// ═══════════════════════════════════════════════════════════════════════════
//  cardEngine.js — THE SINGLE SHARED CARD IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════
//
//  WHY THIS FILE EXISTS
//  --------------------
//  Every card used to be implemented THREE times:
//    1. `applyCard` in src/App.jsx           (the live game — the specification)
//    2. the Demo Tape `lr.id===...` ladder   (App.jsx ~5652-5750)
//    3. `applyCardSim` in vestibule-sim-kwstacks.js
//  They drifted constantly. This file is the one implementation both callers
//  are meant to consume.
//
//  SOURCE OF TRUTH
//  ---------------
//  src/App.jsx `applyCard` IS the spec. Where src/data/cards.js card TEXT
//  disagrees with applyCard, applyCard wins and the divergence is flagged with
//  `// TEXT-MISMATCH:`. Where the Demo Tape replay branch disagrees with
//  applyCard, applyCard wins and the divergence is flagged with
//  `// DEMOTAPE-MISMATCH:`. Sim divergences are flagged `// SIM-MISMATCH:`.
//  Genuinely-inert live implementations are flagged `// LIVE NO-OP:`.
//
//  HARD INVARIANTS (these were the source of real, shipped bugs — do not
//  "improve" them away):
//
//    * `atk` is the ONLY field that produces damage. `permAtkBonus` is
//      bookkeeping/display metadata in live. A "+X ATK permanent" card adds X
//      to `atk` AND X to `permAtkBonus`; a damage formula must use `atk` ALONE.
//      Never sum the two. (The sim summed them for months: every +X ATK card
//      was silently worth 2X.)
//
//    * A "this Strike" buff MUST set `_origAtk` to the pre-buff atk whenever it
//      sets `tempBuff:true` — handleStrikeBody only expires a buff when BOTH
//      are present. Live had 8+ sites that forgot, so those buffs compounded
//      for the whole run. Here it is structurally impossible to forget: every
//      temp buff goes through `tempAtk()`/`tempAtkSet()`, and a tail
//      normalisation pass catches anything that slipped past.
//
//    * Heavy Riff is once per member per fight (`_hrUsed`) — reject otherwise.
//    * Stage Dive is once per strike (`flags.stageDiveUsed`).
//    * Boss heal passives clamp to `S.bossMaxHp` (the SCALED value). Clamping
//      to an unscaled base deleted up to 46% of a Circle-3 fight.
//
//  DETERMINISM
//  -----------
//  This module NEVER calls Math.random(). All randomness goes through
//  `ctx.rng()`. That is what makes the live game and the sim comparable.
//
//  PURITY
//  ------
//  Pure ESM. Zero React, zero DOM, zero imports from App.jsx. Only ./cards.js.
//
// ═══════════════════════════════════════════════════════════════════════════

import { ALL_CARDS, CORRUPTION_CARDS } from './cards.js'

// ─── CONSTANTS (mirrors of live values) ────────────────────────────────────
export const MAX_HAND = 10
export const MAX_STASH = 420
export const STRIKE_MULT_CAP = 10000
export const PER_CARD_MULT = 1.08   // live applyCard tail: strikeMult *= 1.08 per card played

// `contract` is injected by the Welcome-to-Hell fight; it has no cards.js entry.
const CONTRACT_CARD = {
  id: 'contract', name: 'The Contract', type: 'CORRUPT', rarity: 'Rare',
  emoji: '📝', embers: 0, effect: 'Sign away your strongest member for score.',
}

/** Every card definition the engine knows about, keyed by id. */
export const CARD_DEFS = (() => {
  const m = Object.create(null)
  for (const c of ALL_CARDS) m[c.id] = c
  for (const c of Object.values(CORRUPTION_CARDS)) m[c.id] = c
  m[CONTRACT_CARD.id] = CONTRACT_CARD
  return m
})()

// ═══════════════════════════════════════════════════════════════════════════
//  LOW-LEVEL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const num = (v, d = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : d)

/** Normalise ctx.artifacts / passives / pacts / loot: accepts ['a5'] or [{id:'a5'}]. */
function idSet(list) {
  const s = new Set()
  for (const x of list || []) s.add(typeof x === 'string' ? x : (x && x.id))
  return s
}

/** Deterministic Fisher-Yates. Never Math.random(). */
function shuffle(arr, rng) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}

/**
 * Deterministic uid for engine-created cards (echopedal / riffthief / bootlegcopy).
 * The sequence counter lives on the engine state `S`, NOT module scope — a module
 * global made two identical-seed runs mint different uids (determinism/parity break).
 */
function engineUid(S, rng) {
  S._uidSeq = (num(S._uidSeq) + 1) % 1e9
  return 'eng' + Math.floor(rng() * 1e9).toString(36) + S._uidSeq.toString(36)
}

/** All non-null, non-Too-Stoned stage members. */
const alive = (S) => S.stage.filter(m => m && !m.tooStoned)

/**
 * PERMANENT ATK. Adds to `atk` (the only damage-producing field) AND mirrors
 * into `permAtkBonus` (display metadata). Damage formulas must read `atk` only.
 */
function permAtk(mem, delta) {
  mem.atk = num(mem.atk) + delta
  mem.permAtkBonus = num(mem.permAtkBonus) + delta
}

/**
 * "THIS STRIKE" ATK. Always captures `_origAtk` before mutating, so expiry
 * (which requires BOTH tempBuff and _origAtk) can never silently fail.
 * Live wrote `_origAtk: m._origAtk || m.atk`; `=== undefined` is used here so a
 * legitimate _origAtk of 0 is not re-captured. Same behaviour otherwise, and it
 * matches applyCard's own tail-normalisation pass.
 */
function tempAtk(mem, delta) {
  if (mem._origAtk === undefined) mem._origAtk = num(mem.atk)
  mem.atk = num(mem.atk) + delta
  mem.tempAtkBonus = num(mem.tempAtkBonus) + delta
  mem.tempBuff = true
}

/** "THIS STRIKE" ATK set to an absolute value (amp ×2, resonance, possessedperf ×3). */
function tempAtkSet(mem, value) {
  if (mem._origAtk === undefined) mem._origAtk = num(mem.atk)
  const delta = value - num(mem.atk)
  mem.atk = value
  mem.tempAtkBonus = num(mem.tempAtkBonus) + delta
  mem.tempBuff = true
}

/**
 * PERMANENT ATK THAT LIVE FORGOT TO MIRROR into permAtkBonus.
 * battlecry / newstrings / encore / wakeup-revive / sabbath RESONANCE all add
 * to `atk` without touching `permAtkBonus`. Damage is unaffected (atk is the
 * only damage field) but the DamageBreakdown UI under-reports. Kept faithful.
 */
function rawAtk(mem, delta) { mem.atk = num(mem.atk) + delta }

function bumpBuff(mem) { mem.buffCount = num(mem.buffCount) + 1 }

/** FALLEN members cannot be healed; nor can a member cursed by Cursed Strings (this fight). */
const canHeal = (mem) => mem && mem.keyword !== 'FALLEN' && !mem.cursed

function heal(mem, amount) {
  if (!canHeal(mem)) return 0
  const before = num(mem.hp)
  mem.hp = Math.min(num(mem.maxHp, before), before + amount)
  return mem.hp - before
}

// ═══════════════════════════════════════════════════════════════════════════
//  OUTPUT / SIDE-CHANNEL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const log = (out, s) => { out.log.push(s) }
const float = (out, text, slot) => { out.effects.push({ type: 'float', text: String(text), slot }) }
const shake = (out) => { out.effects.push({ type: 'shake' }) }
const sfx = (out, name) => { out.effects.push({ type: 'sfx', name }) }

/**
 * Direct damage to the boss.
 * Mutates S.bossHp AND records the same number in S.directDmg. The live game
 * applies damage immediately (setEnemyHp) so bossHp must move here; the sim
 * reads S.directDmg for reporting. Callers must NOT re-apply S.directDmg to
 * S.bossHp — it is already applied.
 */
function dmgBoss(S, out, amount) {
  const dmg = Math.max(0, Math.floor(num(amount)))
  S.bossHp = Math.max(0, num(S.bossHp) - dmg)
  S.directDmg = num(S.directDmg) + dmg
  float(out, dmg, 'boss'); shake(out); sfx(out, 'hit')
  return dmg
}

function addCorruption(S, delta) {
  S.corruption = clamp(num(S.corruption) + delta, 0, 100)
  return S.corruption
}

function setCorruption(S, value) {
  S.corruption = clamp(value, 0, 100)
  return S.corruption
}

function addEmbers(S, n) {
  const before = num(S.embers)
  S.embers = Math.min(num(S.maxEmbers, 8), before + n)
  return S.embers - before
}

function mulStrikeMult(S, factor) {
  S.strikeMult = Math.min(STRIKE_MULT_CAP, Math.round(num(S.strikeMult, 1) * factor * 100) / 100)
  return S.strikeMult
}

/**
 * Draw n cards. Draws from the END of the deck (matching live's inline
 * `d[d.length-1]` sites and the sim's `deck.pop()`), reshuffles the discard in
 * deterministically when the deck runs dry, and respects MAX_HAND.
 *
 * NOTE — LIVE INCONSISTENCY: live's `drawUpTo` helper draws from the FRONT of
 * the deck and caps hand at 10; live's inline `setDeck(d => d.slice(-n))` sites
 * (sonicboom, backstagepass, gearcheck, venueswap, devilsdice) draw from the
 * BACK and enforce no cap at all. The engine uses one rule for both.
 */
function draw(S, n, rng) {
  const drawn = []
  for (let i = 0; i < n; i++) {
    if (S.hand.length >= MAX_HAND) break
    if (S.deck.length === 0) {
      if (S.discard.length === 0) break
      S.deck = shuffle(S.discard.filter(Boolean), rng)
      S.discard.length = 0
    }
    const c = S.deck.pop()
    if (!c) break
    S.hand.push(c)
    drawn.push(c)
  }
  return drawn
}

/** Discard a specific card object from hand. */
function discardFromHand(S, card) {
  const i = S.hand.findIndex(c => c && c.uid === card.uid)
  if (i >= 0) S.hand.splice(i, 1)
  S.discard.push(card)
}

/** Pick a random element via ctx.rng. */
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]

const cardTypeOf = (id) => (CARD_DEFS[id] ? CARD_DEFS[id].type : null)

// ═══════════════════════════════════════════════════════════════════════════
//  CARD IMPLEMENTATIONS
//
//  Each impl has the signature  (S, C, out) => (false | void)
//  where returning `false` REJECTS the card (caller must not charge embers).
//
//  `C` is the normalised context:
//    C.t            target slot index (ctx.targetIdx)
//    C.m            S.stage[C.t] (may be null)
//    C.rng          deterministic RNG
//    C.upgraded     bool
//    C.art/pas/pac/loot   Sets of ids
//    C.fightIndex, C.circleNum
//    C.lastRiffId   id of the last RIFF played (for Demo Tape)
//    C.selectedUids uids the player pre-selected (burnset / remaster / setbreak)
//    C.card         the card definition
//    C.selfCard     the actual hand-card instance being played (for discards)
//    C.freeCost     true when the engine should report an ember cost of 0
// ═══════════════════════════════════════════════════════════════════════════

const IMPL = Object.create(null)

// ── CONTRACT (Welcome to Hell) ─────────────────────────────────────────────
IMPL.contract = (S, C, out) => {
  const av = alive(S).sort((a, b) => num(b.atk) - num(a.atk))
  if (av.length <= 1) { log(out, '📝 Cannot sign — need at least 2 members!'); return false }
  const strongest = av[0]
  strongest.tooStoned = true
  strongest.bloodOath = false
  strongest.hp = 0
  log(out, '📝 CONTRACT SIGNED! ' + strongest.name + ' leaves the band. Score multiplier increased!')
  float(out, '📝 SIGNED!', 'boss')
  float(out, strongest.name + ' GONE', S.stage.indexOf(strongest))
}

// ── RIFF ───────────────────────────────────────────────────────────────────
IMPL.amp = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH: CARD_UPGRADES.amp promises "+2 max HP to target" when
  // upgraded; live applyCard applies no maxHp change for ANY upgraded card.
  // SIM-MISMATCH: sim models amp as `ampedThisStrike++` (a separate multiplier
  // applied at strike time) instead of doubling `atk` here.
  tempAtkSet(C.m, num(C.m.atk) * 2)
  bumpBuff(C.m)
  log(out, '⚡ ' + C.m.name + ' doubled ATK!')
  float(out, '×2 ATK', C.t)
}

IMPL.battlecry = (S, C, out) => {
  if (!C.m) return false
  const bonus = (C.pas.has('p7') ? 2 : 1) + (C.upgraded ? 1 : 0)
  rawAtk(C.m, bonus)   // live does NOT mirror into permAtkBonus here
  bumpBuff(C.m)
  log(out, '🤘 ' + C.m.name + ' Battle Cry! +' + bonus + ' ATK forever!')
  float(out, '+' + bonus + ' ATK', C.t)
}

IMPL.newstrings = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH: CARD_UPGRADES.newstrings says "+3 ATK (was +2)"; live ignores
  // `upgraded` entirely here and always grants +2.
  rawAtk(C.m, 2)
  bumpBuff(C.m)
  log(out, '🎸 ' + C.m.name + ' +2 ATK permanently!')
  float(out, '+2 ATK', C.t)
}

IMPL.encore = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH: CARD_UPGRADES.encore promises "+1 perm ATK. +2 max HP"; live
  // only sets encoreReady.
  C.m.encoreReady = true
  bumpBuff(C.m)
  log(out, '🔁 ' + C.m.name + ' encores!')
  float(out, 'ENCORE!', C.t)
}

IMPL.roadie = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH: CARD_UPGRADES.roadie promises "Shield 3 strikes, heal 4 HP,
  // +2 max HP"; live always shields 2 and heals 2.
  C.m.stoneShield = 2
  heal(C.m, 2)
  bumpBuff(C.m)
  log(out, '🛡 ' + C.m.name + ' shielded for 2 Strikes and healed 2 HP!')
}

IMPL.stagedive = (S, C, out) => {
  // Once per strike. Live checks this BEFORE resolving the target.
  if (S.flags.stageDiveUsed) { log(out, '⚠ Stage Dive once per round only.'); return false }
  if (!C.m) return false
  const dmg = num(C.m.hp)
  dmgBoss(S, out, dmg)
  S.flags.stageDiveUsed = true
  if (dmg >= 500) sfx(out, 'big_hit')
  // TEXT-MISMATCH: CARD_UPGRADES.stagedive promises "Member heals back 50%";
  // live never heals the diver.
  log(out, '🤘 ' + C.m.name + ' Stage Dives for ' + dmg + ' damage!')
}

IMPL.wakeup = (S, C, out) => {
  for (const m of alive(S)) heal(m, 2)
  const stoned = S.stage.find(m => m && m.tooStoned)
  if (stoned) {
    // Revive at full HP with ATK reset to the pre-temp-buff base.
    const base = stoned._origAtk !== undefined ? stoned._origAtk : num(stoned.atk)
    stoned.tooStoned = false
    stoned.hp = num(stoned.maxHp)
    stoned.atk = base
    delete stoned._origAtk
    stoned.tempBuff = false
    // TEXT-MISMATCH: CARD_UPGRADES.wakeup promises "heal all to 75%, +2 max HP
    // to ALL"; live heals a flat 2 and revives to FULL regardless of upgrade.
    // DEMOTAPE-MISMATCH: the echoplex/looper replay path revives at 50% maxHp
    // (App.jsx ~7588) instead of full.
    log(out, '☕ ' + stoned.name + ' revived! All members +2 HP.')
    float(out, 'REVIVED', S.stage.indexOf(stoned))
  } else {
    log(out, '☕ Wake Up Call! All members +2 HP.')
    float(out, '+2 HP', 'boss')
  }
}

IMPL.soundcheck = (S, C, out) => {
  const av = alive(S)
  const injured = av.filter(m => num(m.hp) < num(m.maxHp)).length
  for (const m of av) {
    const wasInjured = num(m.hp) < num(m.maxHp) && m.keyword !== 'FALLEN'
    heal(m, 4)
    // TEXT-MISMATCH: CARD_UPGRADES.soundcheck says "Heal 6 HP (was 4)"; live
    // always heals 4.
    // NOTE: live's injured-check reads the PRE-heal hp (all `m.hp` references
    // live inside one Object.assign literal), so a member healed to full by
    // this same card still gets the +1 ATK. Preserved.
    if (wasInjured) {
      // Live sets tempBuff + _origAtk here, so this +1 DOES expire at strike end.
      tempAtk(m, 1)
    }
  }
  log(out, '🔊 Sound Check! All +4 HP' + (injured > 0 ? ' + ' + injured + ' injured member(s) +1 ATK!' : '!'))
  float(out, '+4 HP', 'boss')
}

// ── CORRUPTION-GIFT CARDS ──────────────────────────────────────────────────
IMPL.whispercard = (S, C, out) => {
  // Live maps `mi===slotIdx ? Object.assign({},m,{atk:m.atk+2,...})` with NO
  // null guard — playing this on an empty slot throws in live. Rejected here.
  if (!C.m) return false
  permAtk(C.m, 2)
  bumpBuff(C.m)
  log(out, '🌀 Dark Whisper! +2 ATK permanently.')
}

IMPL.hungercard = (S, C, out) => {
  for (const m of alive(S)) {
    // TEXT-MISMATCH: card text said "+1 ATK this Strike", but live sets only
    // `tempAtkBonus` — NOT `tempBuff`/`_origAtk` — so the buff NEVER expires and
    // is effectively permanent. Faithful to live: raw atk bump + tempAtkBonus
    // bookkeeping, no tempBuff.
    rawAtk(m, 1)
    m.tempAtkBonus = num(m.tempAtkBonus) + 1
    bumpBuff(m)
  }
  // NO DRAW. The engine drew 2. Live (App.jsx ~5596) calls
  //   drawUpTo(hand.filter(...), deckRef.current, [...discRef.current,card], 2)
  // where the last argument is a hand-size TARGET of 2, not a count — the hand is
  // already ≥2 cards so nothing is drawn — AND the return value is discarded
  // without ever reaching setHand/setDeck. Two independent reasons the cards can
  // never arrive, exactly like setbreak. Matching live, not the card text.
  // (Reported as a live bug: the intended draw needs the setbreak-style fix.)
  log(out, '🔥 Hungering Flame! All +1 ATK.')
}

IMPL.madnesscard = (S, C, out) => {
  const dmg = Math.floor(num(S.bossMaxHp, 100) * 0.15)
  dmgBoss(S, out, dmg)
  log(out, '💀 Madness Unleashed! ' + dmg + ' damage (15% of max HP)!')
}

IMPL.dark_whisper = (S, C, out) => {
  if (!C.m) return false
  const nc = addCorruption(S, 5)
  // Same non-expiring pattern as hungercard: tempAtkBonus without tempBuff.
  rawAtk(C.m, 2)
  C.m.tempAtkBonus = num(C.m.tempAtkBonus) + 2
  bumpBuff(C.m)
  log(out, '👁 Dark Whisper! +2 ATK. Corruption +5% → ' + nc + '%')
}

IMPL.blood_price = (S, C, out) => {
  if (!C.m) return false
  permAtk(C.m, 4)
  C.m.hp = Math.max(1, num(C.m.hp) - 3)
  bumpBuff(C.m)
  log(out, '🩸 Blood Price! +4 ATK permanently. -3 HP.')
}

IMPL.void_pact = (S, C, out) => {
  const nc = addCorruption(S, 10)
  for (const m of alive(S)) {
    // TEXT-MISMATCH: "+2 ATK this Strike" — live sets tempAtkBonus only, so it
    // never expires.
    rawAtk(m, 2)
    m.tempAtkBonus = num(m.tempAtkBonus) + 2
    bumpBuff(m)
  }
  log(out, '🌀 Void Pact! All members +2 ATK. Corruption +10% → ' + nc + '%')
}

// ── CORRUPT ────────────────────────────────────────────────────────────────
IMPL.dialtoeleven = (S, C, out) => {
  const nc = addCorruption(S, 10)
  const b = C.upgraded ? 4 : 3
  for (const m of alive(S)) {
    // TEXT-MISMATCH: "ALL +3 ATK this strike" — live sets tempAtkBonus without
    // tempBuff/_origAtk, so the buff is permanent in practice. This was one of
    // the 8+ non-expiring sites called out in applyCard's own comment, and it
    // is STILL non-expiring because it never sets tempBuff at all.
    rawAtk(m, b)
    m.tempAtkBonus = num(m.tempAtkBonus) + b
    bumpBuff(m)
  }
  log(out, '📻 Dial to Eleven! Corruption +10% → ' + nc + '%. All members +' + b + ' ATK!')
}

IMPL.sigdecay = (S, C, out) => {
  // Live's applyCard returns false for this id; the real implementation lives in
  // handleDropOnStage (App.jsx ~6470). Reproduced here.
  // TEXT-MISMATCH: CARD_UPGRADES.sigdecay says "Draw 3 (was 2)"; live always 2.
  const others = S.hand.filter(c => c && c.uid !== C.selfUid)
  if (others.length === 0) {
    draw(S, 2, C.rng)
    log(out, '📡 Signal Decay! Drew 2 cards.')
  } else {
    const victim = others[Math.floor(C.rng() * others.length)]
    discardFromHand(S, victim)
    draw(S, 2, C.rng)
    log(out, '📡 Signal Decay! Discarded ' + victim.name + ', drew 2 cards.')
  }
}

IMPL.controlfeedback = (S, C, out) => {
  setCorruption(S, 50)
  // TEXT-MISMATCH: CARD_UPGRADES.controlfeedback says "Heal ALL to full"; live
  // only heals the drop target.
  if (C.m && !C.m.tooStoned) {
    const healed = num(C.m.maxHp) - num(C.m.hp)
    if (canHeal(C.m)) C.m.hp = num(C.m.maxHp)
    log(out, '🎚 Controlled Feedback! Corruption → 50%. ' + C.m.name + ' fully healed!')
    float(out, '+' + healed + '❤', C.t)
  } else {
    log(out, '🎚 Corruption set to 50%.')
  }
}

IMPL.feedbackloop = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH (MAJOR): card text is "Deal direct damage equal to half your
  // Corruption". Live deals NO damage — it grants a flat +2 (or +4 at ≥50%
  // corruption) PERMANENT ATK to the target.
  // DEMOTAPE-MISMATCH: the Demo Tape replay of feedbackloop DOES deal
  // floor(corruption/2) direct damage — i.e. replaying it does something the
  // card itself never does.
  const bonus = num(S.corruption) >= 50 ? 4 : 2
  permAtk(C.m, bonus)
  float(out, '+' + bonus + ' ATK perm', C.t)
  log(out, '🎛 Feedback Loop! ' + C.m.name + ' +' + bonus + ' ATK permanently!' +
    (num(S.corruption) >= 50 ? ' (≥50% corruption bonus!)' : ''))
}

IMPL.soundwall = (S, C, out) => {
  const buff = 1 + (C.pas.has('p5') ? 1 : 0) + (C.upgraded ? 1 : 0)
  // DEMOTAPE-MISMATCH: replaying soundwall deals circle-scaled DIRECT DAMAGE
  // (5/8/12 + 4 with p5) instead of granting ATK — a completely different card.
  // TEXT-MISMATCH: CARD_UPGRADES.soundwall says "+4 base damage at all tiers",
  // which describes a damage card. This card grants no damage.
  for (const m of alive(S)) { permAtk(m, buff); bumpBuff(m) }
  log(out, '🔈 Sound Wall! All members +' + buff + ' ATK permanently!' + (C.pas.has('p5') ? ' (Amp Stack bonus!)' : ''))
}

IMPL.deathriff = (S, C, out) => {
  // TEXT-MISMATCH (MAJOR): text is "Direct damage. Low corruption = more damage."
  // Live deals NO damage — every alive member gets +2 permanent ATK.
  // CARD_UPGRADES.deathriff ("80 base damage (was 60)") describes the same
  // phantom damage card.
  for (const m of alive(S)) permAtk(m, 2)
  addCorruption(S, 10)
  log(out, '💀 Death Riff! ALL members +2 ATK permanently! Corruption +10%')
}

IMPL.ampstatic = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH: text says "ATK equal to Corruption ÷ 10" (and the upgrade
  // says ÷ 8). Live uses a flat threshold: +2, or +4 at ≥50% corruption.
  const bonus = num(S.corruption) >= 50 ? 4 : 2
  tempAtk(C.m, bonus)
  bumpBuff(C.m)
  log(out, '📶 Amp the Static! ' + C.m.name + ' +' + bonus + ' ATK this Strike!' +
    (num(S.corruption) >= 50 ? ' (≥50% corruption bonus!)' : ''))
  float(out, '+' + bonus + ' ATK', C.t)
}

IMPL.distortion = (S, C, out) => {
  const nc = addCorruption(S, 15)
  // TEXT-MISMATCH: CARD_UPGRADES.distortion says "+2 temp ATK/member (was +1)";
  // live always +1.
  for (const m of alive(S)) { tempAtk(m, 1); bumpBuff(m) }
  log(out, '🎸 Distortion! Corruption +15% → ' + nc + '%. All members +1 ATK.')
  float(out, '+1 ATK', 'boss')
}

IMPL.seance = (S, C, out) => {
  // TEXT-MISMATCH: text says "Heal ALL (Corruption ÷ 4 HP)" (upgrade ÷ 3). Live
  // uses a flat threshold: 3 HP, or 6 HP at ≥50% corruption.
  const amt = num(S.corruption) >= 50 ? 6 : 3
  for (const m of alive(S)) heal(m, amt)
  log(out, '🔮 Séance! All members +' + amt + ' HP' + (num(S.corruption) >= 50 ? ' (≥50% corruption: bonus heal!)' : ''))
  float(out, '+' + amt + ' HP', 'boss')
}

IMPL.staticcharge = (S, C, out) => {
  // TEXT-MISMATCH: CARD_UPGRADES.staticcharge says "Gain 5 Embers at 0%
  // corruption (was 4)"; live always 4.
  const bonus = num(S.corruption) === 0 ? 4 : 2
  addEmbers(S, bonus)
  C.freeCost = true      // live sets spent=0 — this card funds itself
  log(out, '⚡ Static Charge! +' + bonus + ' Embers' + (num(S.corruption) === 0 ? ' (pure signal bonus)' : '') + '.')
  float(out, '+' + bonus + ' 🔥', 'boss')
}

IMPL.darktuning = (S, C, out) => {
  const req = num(C.card.corrReq, 40)
  if (num(S.corruption) < req) {
    log(out, '🌑 Need ≥' + req + '% Corruption for Dark Tuning! (you have ' + Math.floor(num(S.corruption)) + '%)')
    float(out, '🌑 Need ' + req + '% Corruption', 'boss')
    return false
  }
  // TEXT-MISMATCH: CARD_UPGRADES.darktuning says "Corruption / 8 buffs (was /
  // 10)"; live uses a 70% threshold for 3 members instead of 2, ignoring
  // `upgraded`.
  const count = num(S.corruption) >= 70 ? 3 : 2
  const slots = S.stage.map((m, i) => (m && !m.tooStoned) ? i : -1).filter(i => i >= 0)
  for (let i = 0; i < Math.min(count, slots.length); i++) {
    const si = slots.splice(Math.floor(C.rng() * slots.length), 1)[0]
    permAtk(S.stage[si], 1)
  }
  log(out, '🌑 Dark Tuning! ' + count + ' random members +1 ATK permanently!' + (num(S.corruption) >= 70 ? ' (≥70% = 3 members!)' : ''))
  float(out, '+1 ATK ×' + count, 'boss')
}

// ── EMBER ──────────────────────────────────────────────────────────────────
IMPL.tappedout = (S, C, out) => {
  // TEXT-MISMATCH: CARD_UPGRADES.tappedout says 6 Embers; live always 5.
  S.pendingEmbers = num(S.pendingEmbers) + 5
  C.freeCost = true
  sfx(out, 'ember')
  log(out, '🪙 Tapped Out! +5 Embers next Strike.')
}

IMPL.powertap = (S, C, out) => {
  // TEXT-MISMATCH: CARD_UPGRADES.powertap says 3 Embers when upgraded; live
  // ignores `upgraded` (the 3 comes from artifact a5 instead).
  const bonus = (C.art.has('a5') ? 3 : 2) + (C.pas.has('p4') ? 1 : 0)
  addEmbers(S, bonus)
  C.freeCost = true
  sfx(out, 'ember')
  log(out, '🔌 Power Tap! +' + bonus + ' Ember' + (bonus > 1 ? 's!' : '!'))
}

IMPL.soundboard = (S, C, out) => {
  // TEXT-MISMATCH: CARD_UPGRADES.soundboard says "+3 Embers, draw 2 next
  // strike, +1 max HP to random"; live always +2 embers / +1 draw.
  addEmbers(S, 2)
  S.pendingDraw = num(S.pendingDraw) + 1
  C.freeCost = true
  sfx(out, 'ember')
  log(out, '🎛 Soundboard! +2 Embers. Draw 1 extra card next Strike.')
  float(out, '+2 🔥 +1 DRAW', 'boss')
}

IMPL.ampoverload = (S, C, out) => {
  if (num(S.discardsLeft) <= 0) { log(out, '⚠ No discards left to sacrifice!'); return false }
  // TEXT-MISMATCH: CARD_UPGRADES.ampoverload says 4 Embers; live always 3.
  addEmbers(S, 3)
  S.discardsLeft = Math.max(0, num(S.discardsLeft) - 1)
  sfx(out, 'ember')
  log(out, '🔋 Amp Overload! +3 Embers. -1 Discard.')
  float(out, '+3 🔥 -1 DISCARD', 'boss')
}

IMPL.groupie = (S, C, out) => {
  // Live's applyCard returns false; the real implementation is in
  // handleDropOnStage (App.jsx ~6362).
  // TEXT-MISMATCH: CARD_UPGRADES.groupie says "+3 Embers, draw 2"; live always
  // +2 (+1 with passive p4) and draws 1.
  addEmbers(S, 2 + (C.pas.has('p4') ? 1 : 0))
  draw(S, 1, C.rng)
  log(out, '🍯 Groupie! +2 Embers, drew 1 card.')
  float(out, '+2 🔥 +1 card', 'boss')
}

// ── UTILITY (hand-manipulation cards live handles in handleDropOnStage) ────
IMPL.setlist = (S, C, out) => {
  // Live: draws up to hand+3 (hand+4 upgraded), then opens a modal forcing the
  // player to discard 1 of choice. The engine performs the forced discard with
  // ctx.rng since "player choice" has no headless equivalent; the live UI picks
  // it manually. This is the only place the engine substitutes rng for choice.
  const n = C.upgraded ? 4 : 3
  draw(S, n, C.rng)
  const others = S.hand.filter(c => c && c.uid !== C.selfUid)
  if (others.length > 0) discardFromHand(S, others[Math.floor(C.rng() * others.length)])
  log(out, '📋 Setlist! Drew ' + n + ' cards — pick 1 to discard.')
}

IMPL.burnset = (S, C, out) => {
  // Live: handleDropOnStage (App.jsx ~6407). Discards up to 3 PRE-SELECTED
  // cards, then draws (discarded + 1).
  // TEXT-MISMATCH: CARD_UPGRADES.burnset says "Draw 2 cards (was 1)"; live's
  // draw count is discardCount+1 regardless of upgrade.
  const sel = (C.selectedUids || []).filter(u => u !== C.selfUid).slice(0, 3)
  const victims = S.hand.filter(c => c && sel.includes(c.uid))
  for (const v of victims) discardFromHand(S, v)
  const drawCount = victims.length + 1
  draw(S, drawCount, C.rng)
  log(out, '🔥 Burned ' + victims.length + ' card' + (victims.length !== 1 ? 's' : '') +
    ', drew ' + drawCount + '.' + (victims.length === 0 ? ' (Tip: select cards before playing)' : ''))
}

IMPL.remaster = (S, C, out) => {
  // Live: handleDropOnStage (App.jsx ~6441). REJECTS if nothing is selected.
  // TEXT-MISMATCH: CARD_UPGRADES.remaster says "Draw 4 (was 3)"; live always 3.
  const uid = (C.selectedUids || []).find(u => u !== C.selfUid && S.hand.some(c => c && c.uid === u))
  if (!uid) { log(out, '🎙 Select 1 card in hand first, then play The Remaster.'); return false }
  const victim = S.hand.find(c => c.uid === uid)
  // Deleted, not discarded — Remaster removes the card from the fight entirely.
  const i = S.hand.indexOf(victim)
  if (i >= 0) S.hand.splice(i, 1)
  S.discard.push(victim)
  draw(S, 3, C.rng)
  log(out, '🎙 Remastered! Deleted ' + victim.name + ', drew 3.')
  float(out, '🎙 -1 +3 CARDS', 'boss')
}

IMPL.setbreak = (S, C, out) => {
  // Live: handleDropOnStage (App.jsx ~6327).
  // TEXT-MISMATCH: card text says "Gain 2 Embers"; live grants 3.
  // CARD_UPGRADES.setbreak ("Gain 3 Embers (was 2)") therefore matches live's
  // BASE behaviour and the upgrade is unreachable.
  const others = S.hand.filter(c => c && c.uid !== C.selfUid)
  if (others.length === 0) { log(out, '🎼 No cards to discard!'); return false }
  const pre = (C.selectedUids || []).filter(u => u !== C.selfUid)
  const victim = (pre.length > 0 && others.find(c => c.uid === pre[0]))
    || others[Math.floor(C.rng() * others.length)]
  discardFromHand(S, victim)
  addEmbers(S, 3)
  S.corruption = Math.max(0, num(S.corruption) - 15)
  // NO DRAW. Aug 1 2026: verified empirically against the running game by
  // e2e/test-card-parity.cjs — live hand 6->4, deck 12->12, i.e. nothing drawn.
  // Live (App.jsx ~6355) calls drawUpTo(remaining, deck, discard, 1) with a
  // refill TARGET of 1 (not remaining.length+1) AND throws the return value away
  // without ever calling setHand/setDeck — two independent reasons no card can
  // arrive. The engine mirrors live, not the card text.
  log(out, '🎼 Smoke Break! ' + victim.name + ' discarded. +3 Embers. -15% Corruption.' +
    (pre.length === 0 ? ' (tip: select a card first)' : ''))
  float(out, '+3 🔥', 'boss')
}

// ── DEMO TAPE ──────────────────────────────────────────────────────────────
/**
 * Replays the last RIFF played. This is the ONE place the Demo Tape ladder
 * lives now (it used to be duplicated in App.jsx and again in the sim).
 * Every branch below is transcribed from live applyCard (App.jsx 5652-5750).
 * Several of them do NOT match the card they claim to replay — each such case
 * is flagged inline.
 */
IMPL.demotape = (S, C, out) => {
  const lr = C.lastRiffId
  if (!lr) { log(out, '📼 No riff recorded yet.'); return false }
  C.freeCost = true   // live sets spent=0 on a successful replay
  const t = C.m
  const av = alive(S)
  const lrName = CARD_DEFS[lr] ? CARD_DEFS[lr].name : lr
  const usable = t && !t.tooStoned

  if (lr === 'amp' && usable) {
    tempAtkSet(t, num(t.atk) * 2); bumpBuff(t)
  } else if (lr === 'battlecry' && usable) {
    rawAtk(t, C.pas.has('p7') ? 2 : 1); bumpBuff(t)
    // DEMOTAPE-MISMATCH: the replay ignores `upgraded` (+1) that the real card honours.
  } else if (lr === 'newstrings' && usable) {
    rawAtk(t, 2); bumpBuff(t)
  } else if (lr === 'encore' && usable) {
    t.encoreReady = true; bumpBuff(t)
  } else if (lr === 'soundwall') {
    // DEMOTAPE-MISMATCH: Sound Wall grants ATK; its replay deals circle-scaled
    // DIRECT DAMAGE instead.
    const circle = num(C.circleNum, Math.floor(num(C.fightIndex) / 3) + 1)
    dmgBoss(S, out, (circle <= 3 ? 5 : circle <= 6 ? 8 : 12) + (C.pas.has('p5') ? 4 : 0))
  } else if (lr === 'feedbackloop') {
    // DEMOTAPE-MISMATCH: Feedback Loop grants ATK; its replay deals
    // floor(corruption/2) direct damage (which is what the CARD TEXT claims).
    dmgBoss(S, out, Math.floor(num(S.corruption) / 2))
  } else if (lr === 'crowdsurf') {
    // DEMOTAPE-MISMATCH: Crowd Surf grants ATK; its replay deals hand×3 damage.
    dmgBoss(S, out, S.hand.length * 3)
  } else if (lr === 'overdrive' && num(S.corruption) >= 60) {
    // DEMOTAPE-MISMATCH: the real card honours `upgraded` (threshold 50);
    // the replay hardcodes 60.
    for (const m of av) tempAtkSet(m, num(m.atk) * 2)
    float(out, 'OVERDRIVE!', 'boss')
  } else if (lr === 'infencore') {
    for (const m of av) { m.encoreReady = true; bumpBuff(m) }
  } else if (lr === 'resonancecard') {
    if (usable) {
      const maxAtk = Math.max(...av.map(m => num(m.atk)))
      tempAtkSet(t, maxAtk); bumpBuff(t)
    }
  } else if (lr === 'distortion') {
    addCorruption(S, 15)
    for (const m of av) { tempAtk(m, 1); bumpBuff(m) }
  } else if (lr === 'doubledown') {
    S.flags.nextCardFree = true
  } else if (lr === 'heavyriff' && usable && !t._hrUsed) {
    // DEMOTAPE-MISMATCH: real Heavy Riff grants half of current ATK (max +20);
    // the replay grants a flat +3 and still burns the once-per-fight charge.
    rawAtk(t, 3); bumpBuff(t); t._hrUsed = true
  } else if (lr === 'moshpit') {
    // DEMOTAPE-MISMATCH: real Mosh Pit grants +2 at 4+ alive; replay always +1.
    for (const m of av) { rawAtk(m, 1); bumpBuff(m) }
  } else if (lr === 'shredsolo' && usable) {
    // DEMOTAPE-MISMATCH: real Shred Solo sets encoreReady; replay grants +4 ATK.
    rawAtk(t, 4); bumpBuff(t)
  } else if (lr === 'sonicboom') {
    // DEMOTAPE-MISMATCH: real Sonic Boom grants ATK + draws; replay deals
    // total-band-ATK direct damage.
    dmgBoss(S, out, av.reduce((s, m) => s + num(m.atk), 0))
  } else if (lr === 'stagedive') {
    // DEMOTAPE-MISMATCH: real Stage Dive deals damage = target HP; replay deals
    // a flat 12 and does NOT consume the once-per-strike charge.
    dmgBoss(S, out, 12)
  } else if (lr === 'possessedperf' && usable) {
    // DEMOTAPE-MISMATCH: real card is ×3 ATK to ALL; replay is +corruption/20
    // ATK to one member.
    rawAtk(t, Math.floor(num(S.corruption) / 20)); bumpBuff(t)
  } else if (lr === 'doomchord') {
    // DEMOTAPE-MISMATCH: real Doom Chord is +4 to target (+adjacent at ≥50%);
    // replay is +2 to everyone, permanent.
    for (const m of av) { rawAtk(m, 2); bumpBuff(m) }
  } else if (lr === 'skullsplitter') {
    // DEMOTAPE-MISMATCH: real card grants ATK; replay deals a flat 15 damage.
    dmgBoss(S, out, 15)
  } else if (lr === 'tremolopick' && usable) {
    // DEMOTAPE-MISMATCH: real card is +1/+4 temp; replay is a flat +2 permanent.
    rawAtk(t, 2); bumpBuff(t)
  } else if (lr === 'feedbackscream') {
    // DEMOTAPE-MISMATCH: real card grants +4 ATK / -2 HP; replay deals
    // floor(corruption/5)+3 direct damage.
    dmgBoss(S, out, Math.floor(num(S.corruption) / 5) + 3)
  } else if (lr === 'bloodharmony') {
    // DEMOTAPE-MISMATCH: real card is +2 to target + neighbours; replay is
    // "+1 per duplicate id in hand, +1" to the target only.
    const dupes = S.hand.filter((c, i) => S.hand.findIndex(h => h.id === c.id) !== i).length
    if (usable) { rawAtk(t, dupes + 1); bumpBuff(t) }
  } else if (lr === 'necroticamp') {
    // DEMOTAPE-MISMATCH: real card grants ATK; replay deals 8 damage and adds
    // 5% corruption (the real card adds none).
    dmgBoss(S, out, 8)
    addCorruption(S, 5)
  } else if (lr === 'herbmoney') {
    // DEMOTAPE-MISMATCH: real card SPENDS 10 stash for ATK; replay GIVES 5 stash.
    S.stash = Math.min(MAX_STASH, num(S.stash) + 5)
    log(out, '🌿 Herb Money replay! +5 Stash')
  } else if (lr === 'overdriveped' && usable) {
    // DEMOTAPE-MISMATCH: real card multiplies strikeMult ×1.5; replay is +3 ATK.
    rawAtk(t, 3); bumpBuff(t)
  } else if (lr === 'riffthief') {
    // DEMOTAPE-MISMATCH: real card copies a card into hand; replay is +2 ATK.
    if (usable) { rawAtk(t, 2); bumpBuff(t) }
  } else if (lr === 'devilsdice') {
    const roll = Math.floor(C.rng() * 6) + 1
    if (roll >= 5) {
      for (const m of av) { rawAtk(m, 5); bumpBuff(m) }
      log(out, '🎲 Replay roll: ' + roll + '! +5 ATK all!')
      // DEMOTAPE-MISMATCH: real card's 5-6 result also draws 2; replay does not.
      // Also: real card's buffs are temp; replay's are permanent.
    } else if (roll >= 3) {
      for (const m of av) { rawAtk(m, 3); bumpBuff(m) }
      log(out, '🎲 Replay roll: ' + roll + '. +3 ATK all.')
    } else {
      log(out, '🎲 Replay roll: ' + roll + '. Nothing.')
    }
  } else {
    // Generic fallback for any riff without a branch (live's behaviour).
    if (usable) { rawAtk(t, 2); bumpBuff(t) }
    log(out, '📼 Demo Tape replays ' + lrName + ' (generic)')
  }
  log(out, '📼 Demo Tape! Replays: ' + lrName)
  float(out, '📼 ' + lrName, 'boss')
}

// ── BIG RIFFS ──────────────────────────────────────────────────────────────
IMPL.overdrive = (S, C, out) => {
  const req = num(C.card.corrReq, 60)
  const need = C.upgraded ? 50 : req
  if (num(S.corruption) < need) {
    log(out, '⚠ Need ≥' + need + '% Corruption (you have ' + Math.floor(num(S.corruption)) + '%)')
    float(out, '💥 Need ' + need + '% Corruption', 'boss')
    return false
  }
  for (const m of alive(S)) tempAtkSet(m, num(m.atk) * 2)
  S.flags.overdriveActive = true
  log(out, '💥 OVERDRIVE! All ATK doubled!')
  float(out, 'OVERDRIVE!', 'boss')
}

IMPL.crowdsurf = (S, C, out) => {
  if (!C.m) return false
  // -1 because crowdsurf itself is still in `hand` when live reads it.
  // TEXT-MISMATCH: CARD_UPGRADES.crowdsurf says "4 damage per card (was 3)" —
  // this card deals no damage; the upgrade grants +1 flat ATK instead.
  const buff = Math.max(1, S.hand.length - 1) + (C.upgraded ? 1 : 0)
  permAtk(C.m, buff)
  bumpBuff(C.m)
  float(out, '+' + buff + ' ATK', C.t)
  log(out, '🏄 Crowd Surf! ' + C.m.name + ' +' + buff + ' ATK permanently! (' + S.hand.length + ' cards in hand)')
}

IMPL.doubledown = (S, C, out) => {
  // TEXT-MISMATCH: CARD_UPGRADES.doubledown says "Next TWO cards cost 0 (was
  // 1)"; live sets a single-shot nextCardFree regardless of upgrade.
  S.flags.nextCardFree = true
  log(out, '🎰 Double Down! Next card costs 0 Embers.')
  float(out, 'FREE!', 'boss')
}

IMPL.heavyriff = (S, C, out) => {
  if (!C.m) return false
  // ONCE PER MEMBER PER FIGHT (balance ruling, Jul 31 2026). Reject otherwise —
  // the caller must NOT charge embers.
  if (C.m._hrUsed) { log(out, '⚠ ' + C.m.name + ' already rode the Heavy Riff this fight!'); return false }
  // NOTE: live computes the bonus from `atk + permAtkBonus`. Because
  // permAtkBonus mirrors a SUBSET of atk gains, that formula double-counts every
  // permanent buff already applied — a live quirk, preserved verbatim.
  // TEXT-MISMATCH: CARD_UPGRADES.heavyriff says "60% of total ATK (was 50%)";
  // live keeps 50% and adds a flat +2 when upgraded.
  const bonus = Math.min(20, Math.ceil((num(C.m.atk) + num(C.m.permAtkBonus)) / 2)) + (C.upgraded ? 2 : 0)
  permAtk(C.m, bonus)
  bumpBuff(C.m)
  C.m._hrUsed = true
  float(out, '+' + bonus + ' ATK', C.t)
  log(out, '🥊 Heavy Riff! ' + C.m.name + ' +' + bonus + ' ATK permanently! (half ATK, max +20)')
}

IMPL.resonancecard = (S, C, out) => {
  if (!C.m) return false
  const av = alive(S)
  if (av.length === 0) return false
  const maxAtk = Math.max(...av.map(m => num(m.atk)))
  if (maxAtk <= num(C.m.atk)) { log(out, '🌀 Already at max ATK!'); return false }
  tempAtkSet(C.m, maxAtk)
  bumpBuff(C.m)
  log(out, '🌀 Resonance! ' + C.m.name + ' ATK → ' + maxAtk + '!')
  float(out, 'ATK → ' + maxAtk, C.t)
}

IMPL.herbmoney = (S, C, out) => {
  if (!C.m) return false
  if (num(S.stash) < 10) { log(out, '🌿 Need 10 Stash! (have ' + num(S.stash) + ')'); return false }
  S.stash = num(S.stash) - 10
  // TEXT-MISMATCH: CARD_UPGRADES.herbmoney says "Full stash as damage. Keep half
  // stash." — a completely different card. Live's upgrade is just +1 ATK.
  const buff = C.upgraded ? 4 : 3
  permAtk(C.m, buff)
  bumpBuff(C.m)
  float(out, '+' + buff + ' ATK', C.t)
  log(out, '🌿 Herb Money! Spent 10🌿 — ' + C.m.name + ' +' + buff + ' ATK permanently!')
}

IMPL.goingbroke = (S, C, out) => {
  if (num(S.stash) <= 0) { log(out, '💸 You are already broke!'); return false }
  // TEXT-MISMATCH: CARD_UPGRADES.goingbroke says "Stash x1.5 as damage"; live
  // ignores `upgraded`.
  const dmg = num(S.stash)
  S.stash = 0
  dmgBoss(S, out, dmg)
  float(out, 'BROKE!', 'boss')
  log(out, '💸 Going Broke! ' + dmg + ' damage. All Stash spent.')
}

IMPL.moshpit = (S, C, out) => {
  const av = alive(S)
  // TEXT-MISMATCH: CARD_UPGRADES.moshpit says "5 damage per member (was 3)" —
  // this card deals no damage.
  const buff = av.length >= 4 ? 2 : 1
  for (const m of av) { permAtk(m, buff); bumpBuff(m) }
  log(out, '🤘 Mosh Pit! ' + av.length + ' members — all gain +' + buff + ' ATK permanently!' +
    (av.length >= 4 ? ' (Full pit bonus!)' : ''))
}

IMPL.bloodritual = (S, C, out) => {
  if (!C.m) return false
  const sacrifice = Math.floor(num(C.m.hp) * 0.25)
  if (sacrifice <= 0) { log(out, '🩸 Not enough HP to sacrifice!'); return false }
  C.m.hp = num(C.m.hp) - sacrifice
  const mult = C.pac.has('blood_price') ? 9 : (C.upgraded ? 8 : 6)
  const dmg = sacrifice * mult
  dmgBoss(S, out, dmg)
  addCorruption(S, 15)
  float(out, '-' + sacrifice + ' HP', C.t)
  log(out, '🩸 Blood Ritual! ' + C.m.name + ' sacrifices ' + sacrifice + ' HP → ' + dmg + ' damage (' + mult + '×)! Corruption +15%')
}

IMPL.sabbathsigil = (S, C, out) => {
  // NOTE: live calls setCorruption(100) FIRST, but the THE VOID branch then
  // reads the stale `corruption` closure — i.e. the PRE-card value. Preserved.
  const corrBefore = num(S.corruption)
  setCorruption(S, 100)
  sfx(out, 'hellquake'); shake(out)
  // TEXT-MISMATCH: CARD_UPGRADES.sabbathsigil says "Roll d10 twice, pick better
  // result"; live rolls once regardless.
  const roll = Math.floor(C.rng() * 10) + 1
  const av = alive(S)
  let label = ''
  if (roll <= 2) {
    const dmg = av.reduce((s, m) => s + num(m.atk), 0) * 4
    dmgBoss(S, out, dmg)
    label = 'OBLITERATION!'
    log(out, '⛧ HELLQUAKE: OBLITERATION! ' + dmg + ' damage!')
  } else if (roll === 3) {
    for (const m of av) rawAtk(m, 3)
    label = 'RESONANCE!'
    log(out, '⛧ HELLQUAKE: RESONANCE! All members +3 ATK forever!')
  } else if (roll === 4) {
    S.bossHp = Math.max(1, Math.floor(num(S.bossHp) / 2))
    label = 'RITUAL!'
    log(out, '⛧ HELLQUAKE: RITUAL! Boss HP halved!')
  } else if (roll === 5) {
    const dmg = Math.floor(corrBefore)
    dmgBoss(S, out, dmg)
    setCorruption(S, 0)
    label = 'THE VOID!'
    log(out, '⛧ HELLQUAKE: THE VOID! ' + dmg + ' damage, soul cleansed!')
  } else if (roll === 6) {
    S.flags.allCardsFree = true
    label = 'POSSESSED!'
    log(out, '⛧ HELLQUAKE: POSSESSION! All cards free this fight!')
  } else if (roll === 7) {
    dmgBoss(S, out, 30)
    if (av.length > 0) { const v = pick(av, C.rng); v.hp = 0; v.tooStoned = true; v.bloodOath = false }
    label = 'BACKLASH!'
    log(out, '⛧ HELLQUAKE: BACKLASH! 30 damage, one member lost!')
  } else if (roll === 8) {
    S.pendingEmbers = num(S.pendingEmbers) + 3
    S.bossDebuff = num(S.bossDebuff) - 4   // negative debuff = boss hits HARDER
    label = 'FEEDBACK!'
    log(out, '⛧ HELLQUAKE: FEEDBACK! Boss energised but you gain 3 Embers!')
  } else if (roll === 9) {
    // Batch C floor: lose 2 random cards, not the whole hand.
    for (let k = 0; k < 2 && S.hand.length > 0; k++) S.discard.push(S.hand.splice(Math.floor(C.rng() * S.hand.length), 1)[0])
    label = 'STATIC!'
    log(out, '⛧ HELLQUAKE: STATIC BURST! 2 cards lost to the noise.')
  } else {
    // Batch C floor: the boss recovers a little — but nobody falls.
    S.bossHp = Math.min(num(S.bossMaxHp, S.bossHp), num(S.bossHp) + 15)
    label = 'SURGE!'
    log(out, '⛧ HELLQUAKE: FEEDBACK SURGE! The boss shrugs off some damage.')
  }
  out.effects.push({ type: 'hellquake', text: label, roll })
  float(out, label, 'boss')
}

IMPL.possessedperf = (S, C, out) => {
  // TEXT-MISMATCH: CARD_UPGRADES.possessedperf promises "Stone shield all, +2
  // max HP to all"; live only triples ATK.
  for (const m of alive(S)) tempAtkSet(m, num(m.atk) * 3)
  S.flags.possessedActive = true
  log(out, '🎭 POSSESSED! Triple ATK!')
  float(out, '×3 ATK!', 'boss')
}

IMPL.infencore = (S, C, out) => {
  // Live does NOT bump buffCount here (unlike single-target `encore`).
  for (const m of alive(S)) m.encoreReady = true
  S.flags.infencoreActive = true
  log(out, '👿 Infernal Encore! All members attack again!')
}

// ── COPY / REPLAY ENABLERS ─────────────────────────────────────────────────
function copyLastPlayed(S, C, out, emoji, verb) {
  const played = S.cardsPlayedIds || []
  const lastId = played.length > 0 ? played[played.length - 1] : null
  if (!lastId || ['echopedal', 'riffthief'].includes(lastId)) {
    log(out, emoji + ' nothing to replay yet'); return
  }
  const def = CARD_DEFS[lastId]
  if (!def) { log(out, emoji + ' no valid card to echo'); return }
  if (S.hand.length >= MAX_HAND) { log(out, emoji + ' hand is full'); return }
  S.hand.push(Object.assign({}, def, { uid: engineUid(S, C.rng) }))
  S.flags.nextCardFree = true
  log(out, emoji + ' ' + verb + ' ' + def.name + ' — play it FREE!')
}
IMPL.echopedal = (S, C, out) => copyLastPlayed(S, C, out, '🔁 Echo Pedal!', 'Copied')
// TEXT-MISMATCH: Riff Thief's text says "Copy last card played this strike. Cast
// the copy free" — live is byte-identical to Echo Pedal (same handler body), so
// the two cards are functionally the same card at two different rarities.
IMPL.riffthief = (S, C, out) => copyLastPlayed(S, C, out, '🎭 Riff Thief!', 'Stole')

// ── ALT-DECK RIFFS ─────────────────────────────────────────────────────────
IMPL.feedbackscream = (S, C, out) => {
  if (!C.m) return false
  permAtk(C.m, 4)
  C.m.hp = Math.max(1, num(C.m.hp) - 2)
  float(out, '+4 ATK', C.t); float(out, '-2 HP', C.t)
  log(out, '📢 Feedback Scream! ' + C.m.name + ' +4 ATK permanently! -2 HP.')
}

IMPL.skullsplitter = (S, C, out) => {
  if (!C.m) return false
  // NOTE: like heavyriff, live's threshold reads atk+permAtkBonus (double-count).
  const bonus = (num(C.m.atk) + num(C.m.permAtkBonus)) >= 10 ? 5 : 3
  permAtk(C.m, bonus)
  float(out, '+' + bonus + ' ATK', C.t)
  log(out, '💀 Skull Splitter! ' + C.m.name + ' +' + bonus + ' ATK permanently!' + (bonus >= 5 ? ' (10+ ATK bonus!)' : ''))
}

IMPL.doomchord = (S, C, out) => {
  if (!C.m) return false
  tempAtk(C.m, 4); bumpBuff(C.m)
  float(out, '+4 ATK', C.t)
  if (num(S.corruption) >= 50) {
    S.stage.forEach((s, i) => {
      if (s && !s.tooStoned && Math.abs(i - C.t) === 1) { tempAtk(s, 4); bumpBuff(s) }
    })
    log(out, '🎵 Doom Chord! +4 ATK to ' + C.m.name + ' AND adjacent! (≥50% corruption)')
  } else {
    log(out, '🎵 Doom Chord! ' + C.m.name + ' +4 ATK!')
  }
}

IMPL.bloodharmony = (S, C, out) => {
  if (!C.m) return false
  // Batch C: now PERMANENT +2 to target + both neighbours (positional board-builder).
  permAtk(C.m, 2); bumpBuff(C.m)
  S.stage.forEach((s, i) => {
    if (s && !s.tooStoned && Math.abs(i - C.t) === 1) { permAtk(s, 2); bumpBuff(s) }
  })
  log(out, '🩸 Blood Harmony! ' + C.m.name + ' + adjacent +2 ATK permanently!')
}

IMPL.sonicboom = (S, C, out) => {
  // TEXT-MISMATCH: text says "+2 ATK permanently"; live grants a THIS-STRIKE
  // buff (tempBuff), so it expires.
  for (const m of alive(S)) { tempAtk(m, 2); bumpBuff(m) }
  draw(S, 1, C.rng)
  log(out, '💥 Sonic Boom! ALL members +2 ATK! Draw 1!')
}

IMPL.tremolopick = (S, C, out) => {
  // Riff Barrage (synergy): +2 ATK to ALL members per RIFF card already played
  // this Strike (max +12). All-target now — no single-target guard.
  const riffs = (S.cardsPlayedIds || []).filter(id => cardTypeOf(id) === 'RIFF').length
  const b = Math.min(12, riffs * 2)
  for (const m of alive(S)) { rawAtk(m, b); m.tempAtkBonus = num(m.tempAtkBonus) + b; bumpBuff(m) }
  log(out, '⚡ Riff Barrage! All members +' + b + ' ATK! (' + riffs + ' RIFFs played)')
}

IMPL.harmonicfb = (S, C, out) => {
  if (!C.m) return false
  const riffs = (S.cardsPlayedIds || []).filter(id => cardTypeOf(id) === 'RIFF').length
  const bonus = Math.max(1, riffs)
  permAtk(C.m, bonus)
  log(out, '🎶 Harmonic Feedback! ' + C.m.name + ' +' + bonus + ' ATK perm! (' + riffs + ' RIFFs played)')
}

IMPL.shredsolo = (S, C, out) => {
  if (!C.m) return false
  // TEXT-MISMATCH: text says "second hit at HALF ATK"; live grants a full second
  // attack via encoreReady — identical to Encore, at 2 embers vs Encore's 2.
  C.m.encoreReady = true
  log(out, '🎸 Shred Solo! ' + C.m.name + ' attacks TWICE this strike!')
}

IMPL.overdriveped = (S, C, out) => {
  mulStrikeMult(S, 1.5)
  log(out, '🔊 Overdrive Pedal! Strike multiplier ×1.5!')
}

IMPL.devilsdice = (S, C, out) => {
  const roll = Math.floor(C.rng() * 6) + 1
  if (roll <= 2) {
    log(out, "🎲 Devil's Dice: rolled " + roll + '. Nothing happens!')
  } else if (roll <= 4) {
    for (const m of alive(S)) tempAtk(m, 3)
    log(out, "🎲 Devil's Dice: rolled " + roll + '! ALL +3 ATK!')
  } else {
    for (const m of alive(S)) tempAtk(m, 5)
    draw(S, 2, C.rng)
    log(out, "🎲 Devil's Dice: rolled " + roll + '! ALL +5 ATK + draw 2! JACKPOT!')
  }
}

IMPL.necroticamp = (S, C, out) => {
  const bonus = Math.floor(num(S.corruption) / 20)
  // At 0-19% corruption the bonus is 0 but live still flags tempBuff. The engine
  // still captures _origAtk so the (no-op) buff expires cleanly.
  for (const m of alive(S)) tempAtk(m, bonus)
  log(out, '☠️ Necrotic Amp! ALL +' + bonus + ' ATK! (' + Math.floor(num(S.corruption)) + '% corruption ÷ 20)')
}

IMPL.soulbargain = (S, C, out) => {
  if (!C.m) return false
  tempAtk(C.m, 5)
  C.m.hp = Math.max(1, num(C.m.hp) - 3)
  bumpBuff(C.m)
  addCorruption(S, 5)
  float(out, '+5 ATK', C.t); float(out, '-3 HP', C.t)
  log(out, '👿 Soul Bargain! ' + C.m.name + ' +5 ATK, -3 HP! Corruption +5%')
}

IMPL.venomriff = (S, C, out) => {
  if (!C.m) return false
  permAtk(C.m, 3)
  addCorruption(S, 5)
  // NOTE: S.flags.venomDotStacks exists in live state but NO card ever sets it —
  // the boss DOT tick at App.jsx ~7796 is unreachable. Left untouched.
  float(out, '+3 ATK permanently', C.t)
  log(out, '🐍 Venom Riff! ' + C.m.name + ' +3 ATK permanently! Corruption +5%')
}

IMPL.offeringpit = (S, C, out) => {
  if (!C.m) return false
  const others = alive(S).filter(s => s.uid !== C.m.uid)
  if (others.length === 0) { log(out, '🕳️ No other member to receive the offering!'); return false }
  const target = pick(others, C.rng)
  tempAtk(target, 8)
  bumpBuff(target)
  addCorruption(S, 10)
  // TEXT-MISMATCH: text says "Target skips next attack" — live never sets any
  // skip flag, so the drop target attacks normally. The sim DOES set
  // `_skipAttack`, making the sim strictly weaker than live on this card.
  log(out, '🕳️ Offering! ' + C.m.name + ' skips attack, ' + target.name + ' +8 ATK! Corruption +10%')
}

IMPL.cursedstrings = (S, C, out) => {
  if (!C.m) return false
  // 3B: +6 ATK this strike; `cursed` is now READ by canHeal, so this member
  // cannot be healed for the rest of the fight (cleared at the fight boundary).
  tempAtk(C.m, 6)
  bumpBuff(C.m)
  C.m.cursed = true
  log(out, '🪡 Cursed Strings! ' + C.m.name + " +6 ATK — but can't be healed this fight!")
}

IMPL.hexdecay = (S, C, out) => {
  const dmg = Math.floor(num(S.bossHp) * 0.15)
  dmgBoss(S, out, dmg)
  addCorruption(S, 15)
  log(out, '🦠 Hex of Decay! Boss loses 15% HP (' + dmg + ' damage)! Corruption +15%')
}

IMPL.infernalpact = (S, C, out) => {
  // Live SETS corruption to 66 — it can LOWER corruption above 66%.
  setCorruption(S, 66)
  for (const m of alive(S)) permAtk(m, 2)
  log(out, '📜 Infernal Pact! Corruption → 66%! ALL members +2 ATK permanently!')
}

IMPL.carrioncall = (S, C, out) => {
  const i = S.stage.findIndex(s => s && s.tooStoned)
  if (i === -1) { log(out, '🦅 No stoned members to revive!'); return false }
  const m = S.stage[i]
  m.tooStoned = false
  m.hp = 1
  permAtk(m, 5)
  addCorruption(S, 20)
  log(out, '🦅 Carrion Call! ' + m.name + ' rises from the dead at 1 HP +5 ATK! Corruption +20%')
}

IMPL.possessionriff = (S, C, out) => {
  if (!C.m) return false
  tempAtk(C.m, 20)
  bumpBuff(C.m)
  addCorruption(S, 10)
  float(out, '+20 ATK!', C.t)
  log(out, '👁️ POSSESSION! ' + C.m.name + ' +20 ATK this strike! Corruption +10%')
}

IMPL.darkcrescendo = (S, C, out) => {
  if (num(S.corruption) >= 80) {
    mulStrikeMult(S, 3)
    log(out, '🌑 DARK CRESCENDO! TRIPLE STRIKE MULTIPLIER! (' + num(S.corruption) + '% corruption)')
  } else {
    // Live returns TRUE here — the card is consumed and does nothing.
    log(out, '🌑 Dark Crescendo... corruption too low (' + Math.floor(num(S.corruption)) + '%, need 80%)')
  }
}

// ── CORRUPTION GAMBIT ──────────────────────────────────────────────────────
IMPL.hellfirerift = (S, C, out) => {
  for (const m of alive(S)) tempAtkSet(m, num(m.atk) * 2)
  addCorruption(S, 20)
  log(out, '🌋 HELLFIRE RIFT! ALL MEMBERS ×2 ATK! +20% CORRUPTION!')
  float(out, '×2 ALL ATK!', 'boss')
}

IMPL.soulsacrifice = (S, C, out) => {
  for (const m of alive(S)) { permAtk(m, 5); bumpBuff(m) }
  addCorruption(S, 15)
  log(out, '⚰️ SOUL SACRIFICE! ALL +5 ATK PERMANENT! +15% CORRUPTION!')
  float(out, '+5 ALL PERM!', 'boss')
}

IMPL.voidpact = (S, C, out) => {
  mulStrikeMult(S, 2.5)
  addCorruption(S, 25)
  log(out, '🕳 VOID PACT! STRIKE MULTIPLIER ×2.5! +25% CORRUPTION!')
  float(out, '×2.5 MULT!', 'boss')
}

IMPL.russianroulette = (S, C, out) => {
  if (!C.m) return false
  const roll = Math.floor(C.rng() * 6) + 1
  if (roll === 1) {
    C.m.tooStoned = true; C.m.hp = 0
    log(out, '🔫 Russian Roulette: ' + C.m.name + ' rolled 1... TOO STONED! 💨')
  } else if (roll <= 5) {
    tempAtk(C.m, 4)
    log(out, '🔫 Russian Roulette: ' + C.m.name + ' rolled ' + roll + '! +4 ATK!')
  } else {
    tempAtk(C.m, 8)
    C.m.stoneShield = 2
    log(out, '🔫 Russian Roulette: ' + C.m.name + ' rolled 6! +8 ATK + Shield! 🛡️')
  }
}

// ── UTILITY (alt decks) ────────────────────────────────────────────────────
IMPL.gearcheck = (S, C, out) => {
  // Feedback Engine (synergy): ×strikeMult scaling with DISTINCT card ids played
  // this Strike (the combo engine). +8% per distinct card already played.
  const distinct = new Set(S.cardsPlayedIds || []).size
  const factor = 1 + 0.08 * distinct
  mulStrikeMult(S, factor)
  log(out, '🔧 Feedback Engine! Strike multiplier ×' + factor.toFixed(2) + ' (' + distinct + ' distinct cards)')
}

IMPL.setlistrewrite = (S, C, out) => {
  // 1B Scry: peek the top 3 (next to draw), discard the costliest, keep the rest on top.
  // Option A: FREE but once per Strike — reject a second play (caller must not charge).
  if (S.flags && S.flags.setlistRewriteUsed) { log(out, '📝 Setlist Rewrite — once per Strike.'); return false }
  const n = Math.min(3, S.deck.length)
  if (n === 0) { log(out, '📝 Setlist Rewrite! Deck is empty.'); return }
  const top = S.deck.splice(S.deck.length - n, n)
  const cost = (c) => num(CARD_DEFS[c.id] ? CARD_DEFS[c.id].embers : 0)
  let wi = 0
  for (let i = 1; i < top.length; i++) if (cost(top[i]) > cost(top[wi])) wi = i
  const tossed = top.splice(wi, 1)[0]
  S.deck.push(...top)
  S.discard.push(tossed)
  if (S.flags) S.flags.setlistRewriteUsed = true
  const tn = CARD_DEFS[tossed.id] ? CARD_DEFS[tossed.id].name : tossed.id
  log(out, '📝 Setlist Rewrite! Tossed ' + tn + ', kept ' + top.length + ' on top.')
}

IMPL.backstagepass = (S, C, out) => {
  S.flags.nextCardFree = true
  draw(S, 1, C.rng)
  log(out, '🎫 Backstage Pass! Next card is FREE! Draw 1!')
}

IMPL.venueswap = (S, C, out) => {
  // Live discards the REST of the hand and draws 6. The played card is not part
  // of that dump: the caller (live's handleDropOnStage, the sim's play loop)
  // moves it to the discard itself. Dumping it here too is exactly how live used
  // to duplicate Venue Swap into the deck on every play — 18 cards in, 19 out
  // (fixed Aug 4 2026, App.jsx ~6644, proved by e2e/test-card-parity.cjs).
  // Filtering on selfUid is correct for BOTH callers: the sim removes the played
  // card from S.hand before calling (the filter is then a no-op), the parity
  // harness leaves it in (the filter keeps it in hand for the caller to move).
  const self = S.hand.filter(c => c && c.uid === C.selfUid)
  const rest = S.hand.filter(c => !(c && c.uid === C.selfUid))
  S.discard.push(...rest)
  S.hand.length = 0
  S.hand.push(...self)
  draw(S, 6, C.rng)
  log(out, '🏟️ Venue Swap! Hand shuffled away — drew 6 fresh cards!')
}

IMPL.doublebooking = (S, C, out) => {
  S.strikesLeft = num(S.strikesLeft) + 1
  S.fightMaxStrikes = num(S.fightMaxStrikes) + 1
  log(out, '📅 DOUBLE BOOKING! +1 extra Strike this fight! 🔥')
}

IMPL.bootlegcopy = (S, C, out) => {
  // Copies the first card in hand that is not itself a Bootleg Copy. Live filters
  // by ID, so a SECOND Bootleg Copy in hand is not a legal source either.
  // There is deliberately no hand-length guard: `best` coming back undefined
  // already covers "nothing to copy", and a length test would be off by one for
  // one of the two callers (the sim removes the played card from S.hand before
  // calling, the parity harness leaves it in).
  // LIVE BUG FIXED Aug 4 2026: live queued its copy with setHand() and
  // handleDropOnStage then replaced the whole hand with a plain value, so the
  // copy was destroyed and the card did nothing at all. App.jsx ~6660.
  const best = S.hand.filter(c => c && c.id !== 'bootlegcopy')[0]
  if (!best) { log(out, '📀 Bootleg Copy! Nothing to copy.'); return }
  if (S.hand.length >= MAX_HAND) { log(out, '📀 Bootleg Copy! Hand is full.'); return }
  S.hand.push(Object.assign({}, best, { uid: engineUid(S, C.rng) }))
  log(out, '📀 Bootleg Copy! Copied best card in hand!')
}

// ── EMBER (alt decks) ──────────────────────────────────────────────────────
IMPL.secondwind = (S, C, out) => {
  const gain = num(S.maxEmbers) - num(S.embers)
  S.embers = num(S.maxEmbers)
  draw(S, 1, C.rng)
  log(out, '💨 Second Wind! +' + gain + ' embers (max) + drew 1!')
}

IMPL.pyromaniac = (S, C, out) => {
  addEmbers(S, 2)
  S.flags.pyromaniacActive = true
  log(out, '🧨 Pyromaniac! +2 embers! Spend ALL before Strike → +3 ATK to all!')
}

IMPL.slowburn = (S, C, out) => {
  addEmbers(S, 2)
  S.flags.slowBurnStrikes = num(S.flags.slowBurnStrikes) + 2
  log(out, '🕯️ Slow Burn! +2 embers now, +2 per strike for next 2 strikes.')
}

IMPL.ampfeedback = (S, C, out) => {
  addEmbers(S, 2)
  S.flags.ampFeedbackDiscount = 1
  log(out, '🔌 Amp Feedback! +2 embers. Next RIFF costs 1 less.')
}

IMPL.drainthecrowd = (S, C, out) => {
  // Death's Bargain (synergy): +1 ATK to ALL members per 10% of the band's total
  // HP that is MISSING (comeback). All-target, this Strike.
  const av = alive(S)
  let cur = 0, mx = 0
  for (const m of av) { cur += num(m.hp); mx += num(m.maxHp, num(m.hp)) }
  const missing = mx > 0 ? (mx - cur) / mx : 0
  const b = Math.floor(missing * 10)
  for (const m of av) { rawAtk(m, b); m.tempAtkBonus = num(m.tempAtkBonus) + b; bumpBuff(m) }
  log(out, "🧛 Death's Bargain! All members +" + b + ' ATK! (' + Math.round(missing * 100) + '% band HP missing)')
}

IMPL.corrsiphon = (S, C, out) => {
  // Corruption Nexus (synergy): +1 ATK to all per 10% Corruption, this strike.
  const b = Math.floor(num(S.corruption) / 10)
  for (const m of alive(S)) { rawAtk(m, b); m.tempAtkBonus = num(m.tempAtkBonus) + b; bumpBuff(m) }
  log(out, '🌀 Corruption Nexus! All members +' + b + ' ATK (from ' + num(S.corruption) + '% Corruption)!')
}

// ═══════════════════════════════════════════════════════════════════════════
//  BOSS "heals when you play a card" PASSIVES
//  These clamp to bossMaxHp — the SCALED value. Clamping to an unscaled base
//  slammed the boss down to its data HP the first time it "healed" (Devourer
//  11,918 → 6,442: 46% of the fight deleted by one card).
// ═══════════════════════════════════════════════════════════════════════════
//
//  Aug 4 2026 CLEANUP: this table used to carry four DEAD ids — cardHeal(2),
//  cardHeal3(3), cardHeal4(4), cardHeal6(6) — that no entry in src/data/enemies.js
//  has ever used. (App.jsx still has its own inline branches for them; they are
//  equally unreachable there and are listed under LIVE-SIDE FIXES.) Only the three
//  below are real. Their ids are historical and LIE about their values — the number
//  in the id is the heal amount they had before the Gluttony retune, not the amount
//  they heal now. Renaming them would mean editing enemies.js AND every
//  `enemy.passiveId==='cardHealX'` branch in App.jsx in the same commit; until then
//  the mapping is documented here rather than silently misleading:
//
//      passiveId     enemy                     heal/card    id implies
//      ───────────────────────────────────────────────────────────────
//      cardHeal3b    Glutton      (fight 7)         8            3
//      cardHeal5     Feaster      (fight 8)        15            5
//      cardHeal8     Devourer     (fight 9, boss)  25            8
//
const CARD_HEAL = {
  cardHeal3b: 8, cardHeal5: 15, cardHeal8: 25,
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/** Every card id the engine handles. */
export const ENGINE_CARD_IDS = Object.keys(IMPL)

/**
 * Build a valid default engine state. Everything is overridable via `partial`.
 * Intended for tests and for the sim's per-fight setup.
 */
export function newEngineState(partial = {}) {
  const mk = (i, o = {}) => Object.assign({
    uid: 'm' + i, id: 'member' + i, name: 'Member ' + i,
    atk: 5 + i, hp: 20, maxHp: 20, role: 'Guitarist', keyword: 'SHREDDER',
    tooStoned: false, stoneShield: 0, tempBuff: false,
    permAtkBonus: 0, tempAtkBonus: 0, buffCount: 0,
    foil: false, mythic: false, demonic: false,
    _hrUsed: false, ampedCount: 0, encoreReady: false,
  }, o)

  const mkCard = (id, n) => ({ id, uid: id + '_' + n })

  const S = {
    stage: [mk(0), mk(1), mk(2, { hp: 12 }), mk(3, { tooStoned: true, hp: 0 }), null],
    corruption: 40,
    embers: 5,
    maxEmbers: 8,
    stash: 100,
    strikeMult: 1,
    bossHp: 5000,
    bossMaxHp: 5000,
    bossDebuff: 0,
    hand: [mkCard('battlecry', 1), mkCard('amp', 2), mkCard('powertap', 3), mkCard('battlecry', 4)],
    deck: Array.from({ length: 12 }, (_, i) => mkCard('newstrings', 100 + i)),
    discard: [],
    strikesLeft: 4,
    fightMaxStrikes: 4,
    discardsLeft: 4,
    cardsPlayedIds: [],
    directDmg: 0,
    pendingDraw: 0,
    pendingEmbers: 0,
    flags: {
      nextCardFree: false,
      allCardsFree: false,
      freeCardsLeft: 0,
      stageDiveUsed: false,
      setlistRewriteUsed: false,
      possessedActive: false,
      overdriveActive: false,
      infencoreActive: false,
      bossSkipStrikes: 0,
      slowBurnStrikes: 0,
      pyromaniacActive: false,
      venomDotStacks: 0,
      tripBuff: null,
      cursedNoHeal: false,
      ampFeedbackDiscount: 0,
      lastRiffId: null,
    },
  }
  const { flags, ...rest } = partial
  Object.assign(S, rest)
  if (flags) Object.assign(S.flags, flags)
  return S
}

/**
 * THE SHARED CARD IMPLEMENTATION.
 *
 * @param {string} cardId
 * @param {object} S    plain mutable engine state (see newEngineState)
 * @param {object} ctx  {
 *    targetIdx,                       // stage slot the card was played on
 *    artifacts, passives, pacts, loot, // arrays of ids (or {id} objects)
 *    upgraded, fightIndex, circleNum,
 *    rng,                             // () => [0,1)  — REQUIRED for determinism
 *    // optional extensions:
 *    lastRiffId,                      // Demo Tape source (falls back to S.flags.lastRiffId)
 *    selectedUids,                    // player pre-selection (burnset/remaster/setbreak)
 *    selfUid,                         // uid of the card instance being played
 *    emberCost,                       // effective cost the caller intends to charge
 *    bossPassiveId,                   // enables the cardHeal boss passives
 * }
 * @returns {{ok:boolean, log:string[], effects:object[], emberCost:number}}
 *
 * `ok:false` means the card was REJECTED — the caller must not charge embers,
 * must not discard the card, and must not count it as played.
 *
 * `emberCost` is what the caller should actually charge: 0 for self-funding
 * cards (Power Tap, Static Charge, Soundboard, Tapped Out, a successful Demo
 * Tape), otherwise `ctx.emberCost ?? card.embers`.
 */
export function applyCardEffect(cardId, S, ctx = {}) {
  const out = { ok: true, log: [], effects: [], emberCost: 0 }
  const card = CARD_DEFS[cardId]
  const impl = IMPL[cardId]
  if (!impl) {
    out.ok = false
    out.log.push('⚠ Unknown card: ' + cardId)
    return out
  }

  const rng = typeof ctx.rng === 'function' ? ctx.rng : (() => 0.5)
  const t = num(ctx.targetIdx, 0)
  const C = {
    t,
    m: S.stage[t] || null,
    rng,
    upgraded: !!ctx.upgraded,
    art: idSet(ctx.artifacts),
    pas: idSet(ctx.passives),
    pac: idSet(ctx.pacts),
    loot: idSet(ctx.loot),
    fightIndex: num(ctx.fightIndex, 0),
    circleNum: num(ctx.circleNum, Math.floor(num(ctx.fightIndex, 0) / 3) + 1),
    lastRiffId: ctx.lastRiffId !== undefined ? ctx.lastRiffId : (S.flags && S.flags.lastRiffId) || null,
    selectedUids: ctx.selectedUids || [],
    selfUid: ctx.selfUid !== undefined ? ctx.selfUid : null,
    card: card || { id: cardId, embers: 0, type: 'RIFF', name: cardId },
    freeCost: false,
  }

  // Snapshot for the tail passes (mirrors applyCard's `_preCardAtk` + buffCount check).
  const preAtk = S.stage.map(m => (m ? num(m.atk) : null))
  const preBuffCount = C.m ? num(C.m.buffCount) : null
  const hadTarget = !!C.m

  let rejected = false
  try {
    rejected = impl(S, C, out) === false
  } catch (e) {
    out.ok = false
    out.log.push('⚠ Engine error on ' + cardId + ': ' + (e && e.message))
    return out
  }
  if (rejected) {
    out.ok = false
    return out
  }

  // ── SINGLE-MEMBER 3-BUFF CORRUPTION TRIGGER ──────────────────────────────
  // Live: a member reaching EXACTLY 3 buffs on the DROP TARGET costs +20%
  // Corruption. Fires once, on the transition to 3.
  const post = S.stage[t]
  if (post && hadTarget && num(post.buffCount) === 3 && num(post.buffCount) > preBuffCount) {
    addCorruption(S, 20)
    out.log.push('⚠ ' + post.name + ' has 3+ buffs — Corruption +20%!')
  }

  // ── TEMP-BUFF EXPIRY NORMALISATION ───────────────────────────────────────
  // Belt-and-braces: every temp buff already goes through tempAtk/tempAtkSet,
  // which capture _origAtk. This catches anything that mutated atk directly.
  // Without BOTH tempBuff and _origAtk, handleStrikeBody never expires the buff
  // and it compounds for the entire run.
  S.stage.forEach((m, i) => {
    if (m && m.tempBuff && m._origAtk === undefined && preAtk[i] !== null) m._origAtk = preAtk[i]
  })

  // ── PER-CARD STRIKE MULTIPLIER (applyCard tail) ──────────────────────────
  mulStrikeMult(S, PER_CARD_MULT)

  // ── LAST RIFF TRACKING (feeds Demo Tape) ─────────────────────────────────
  // burnset is EXCLUDED. It is a RIFF, and live's burnset branch does call
  // setLastRiffPlayed(card) (App.jsx ~6429) — but it never touches
  // lastRiffPlayedRef.current, and Demo Tape reads the REF. So in the live game
  // Burn the Set can never become Demo Tape's replay source. (Reported as a live
  // bug: the branch is missing its `lastRiffPlayedRef.current=card` line.)
  if (C.card.type === 'RIFF' && cardId !== 'burnset') S.flags.lastRiffId = cardId

  // ── CARDS-PLAYED LEDGER ──────────────────────────────────────────────────
  // Pushed AFTER resolution: live's tremolopick/harmonicfb read cardsPlayedRef
  // before the tail appends this card.
  //
  // SYNTHETIC ENTRIES: live's ledger is not a list of cards, it is a list of
  // EVENTS. Smoke Break pushes TWO entries — the card id plus
  // '_smokebreak_discard' (App.jsx ~6352) — and each Echoplex retrigger pushes
  // '_echo:'+id (~7474). Anything that reads the ledger's LENGTH therefore counts
  // them: Tremolo Pick's ">=3 cards played" threshold hits a strike earlier when a
  // Smoke Break was played. Anything that reads the ledger's TYPES ignores them,
  // because cardTypeOf/ALL_CARDS.find returns nothing for a synthetic id (that is
  // what keeps harmonicfb's RIFF count honest). Both behaviours are reproduced:
  // the synthetic entry is appended here, and cardTypeOf returns null for it.
  S.cardsPlayedIds.push(cardId)
  if (cardId === 'setbreak') S.cardsPlayedIds.push('_smokebreak_discard')

  // ── BOSS "heals on card play" PASSIVES ───────────────────────────────────
  const healAmt = CARD_HEAL[ctx.bossPassiveId]
  if (healAmt && S.bossHp > 0) {
    S.bossHp = Math.min(num(S.bossMaxHp, S.bossHp), num(S.bossHp) + healAmt)
  }

  // ── EMBER COST REPORT ────────────────────────────────────────────────────
  out.emberCost = C.freeCost ? 0 : num(ctx.emberCost, num(C.card.embers, 0))
  return out
}

// ═══════════════════════════════════════════════════════════════════════════
//  SELF-TEST — `node src/data/cardEngine.js`
//  Node-only. `typeof process` guards the browser bundle (Vite tree-shakes it).
// ═══════════════════════════════════════════════════════════════════════════
/* global process */
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const failures = []
  const fail = (msg) => failures.push(msg)

  // Deterministic LCG so a failure is always reproducible.
  let seed = 0x2f6e2b1
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }

  /** Deep walk: no undefined values, no NaN, anywhere in S. */
  function walk(v, path, seen) {
    if (v === null || v === undefined) {
      if (v === undefined) fail(`undefined at ${path}`)
      return
    }
    if (typeof v === 'number') { if (Number.isNaN(v)) fail(`NaN at ${path}`); return }
    if (typeof v !== 'object') return
    if (seen.has(v)) return
    seen.add(v)
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`, seen)); return }
    for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`, seen)
  }

  let okCount = 0, rejectCount = 0
  const perCard = []

  for (const id of ENGINE_CARD_IDS) {
    // Fresh state per card so one card's rejection can't cascade.
    const S = newEngineState({
      flags: { lastRiffId: 'battlecry' },
    })
    // Make selection-dependent cards exercisable.
    const selectedUids = [S.hand[1].uid, S.hand[2].uid, S.hand[3].uid]
    let res
    try {
      res = applyCardEffect(id, S, {
        targetIdx: 0,
        artifacts: ['a5'], passives: ['p4', 'p5', 'p7'], pacts: [], loot: [],
        upgraded: false, fightIndex: 4, circleNum: 2, rng,
        selectedUids, selfUid: 'not-in-hand',
        bossPassiveId: 'cardHeal3b',
        emberCost: num(CARD_DEFS[id] && CARD_DEFS[id].embers, 0),
      })
    } catch (e) {
      fail(`${id}: THREW ${e && e.stack}`)
      perCard.push([id, 'THREW'])
      continue
    }

    if (typeof res.ok !== 'boolean') fail(`${id}: ok is not a boolean`)
    if (!Array.isArray(res.log)) fail(`${id}: log is not an array`)
    if (!Array.isArray(res.effects)) fail(`${id}: effects is not an array`)
    if (res.ok) okCount++; else rejectCount++

    // (b) no NaN / undefined anywhere in S
    walk(S, id, new Set())

    // (c) tempBuff implies _origAtk
    for (const m of S.stage) {
      if (m && m.tempBuff && m._origAtk === undefined) {
        fail(`${id}: member ${m.uid} has tempBuff:true but _origAtk undefined`)
      }
    }

    // structural sanity
    if (S.stage.length !== 5) fail(`${id}: stage length became ${S.stage.length}`)
    if (S.bossHp < 0) fail(`${id}: bossHp went negative (${S.bossHp})`)
    if (S.corruption < 0 || S.corruption > 100) fail(`${id}: corruption out of range (${S.corruption})`)
    if (S.embers > S.maxEmbers) fail(`${id}: embers ${S.embers} > maxEmbers ${S.maxEmbers}`)
    if (S.hand.length > MAX_HAND) fail(`${id}: hand overflowed to ${S.hand.length}`)
    if (typeof res.emberCost !== 'number' || Number.isNaN(res.emberCost)) fail(`${id}: bad emberCost`)

    perCard.push([id, res.ok ? 'ok' : 'reject'])
  }

  // (d) coverage of every id in cards.js (+ the corruption gifts + contract)
  const engineSet = new Set(ENGINE_CARD_IDS)
  for (const c of ALL_CARDS) {
    if (!engineSet.has(c.id)) fail(`COVERAGE: cards.js id "${c.id}" is not in ENGINE_CARD_IDS`)
  }
  for (const c of Object.values(CORRUPTION_CARDS)) {
    if (!engineSet.has(c.id)) fail(`COVERAGE: CORRUPTION_CARDS id "${c.id}" is not in ENGINE_CARD_IDS`)
  }
  if (!engineSet.has('contract')) fail('COVERAGE: "contract" is not in ENGINE_CARD_IDS')
  for (const id of ENGINE_CARD_IDS) {
    if (!CARD_DEFS[id]) fail(`COVERAGE: engine implements "${id}" which has no card definition`)
  }

  // Targeted invariant regression checks (the bugs this file exists to kill).
  {
    // Heavy Riff: second use on the same member must be REJECTED.
    const S = newEngineState()
    const c = { targetIdx: 0, rng, artifacts: [], passives: [], pacts: [], loot: [] }
    const r1 = applyCardEffect('heavyriff', S, c)
    const r2 = applyCardEffect('heavyriff', S, c)
    if (!r1.ok) fail('heavyriff: first use should succeed')
    if (r2.ok) fail('heavyriff: second use on same member must be rejected (_hrUsed)')
  }
  {
    // Stage Dive: second use in the same strike must be REJECTED.
    const S = newEngineState()
    const c = { targetIdx: 0, rng, artifacts: [], passives: [], pacts: [], loot: [] }
    const r1 = applyCardEffect('stagedive', S, c)
    const r2 = applyCardEffect('stagedive', S, c)
    if (!r1.ok) fail('stagedive: first use should succeed')
    if (r2.ok) fail('stagedive: second use in one strike must be rejected (stageDiveUsed)')
  }
  {
    // permAtkBonus must never be summed into atk by the engine itself.
    const S = newEngineState({ stage: [Object.assign(newEngineState().stage[0], { atk: 10, permAtkBonus: 0 })] })
    S.stage.length = 5; S.stage.fill(null, 1)
    applyCardEffect('newstrings', S, { targetIdx: 0, rng, artifacts: [], passives: [], pacts: [], loot: [] })
    if (S.stage[0].atk !== 12) fail(`newstrings: atk should be 12, got ${S.stage[0].atk}`)
  }
  {
    // Boss heal passive clamps to the SCALED max, not a base value.
    const S = newEngineState({ bossHp: 4990, bossMaxHp: 5000 })
    applyCardEffect('powertap', S, { targetIdx: 0, rng, bossPassiveId: 'cardHeal8', artifacts: [], passives: [], pacts: [], loot: [] })
    if (S.bossHp !== 5000) fail(`cardHeal8 should clamp to bossMaxHp 5000, got ${S.bossHp}`)
  }
  {
    // Determinism: same seed → identical result.
    const run = () => {
      let s = 12345
      const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000 }
      const S = newEngineState()
      for (const id of ['devilsdice', 'russianroulette', 'sabbathsigil', 'darktuning', 'drainthecrowd']) {
        applyCardEffect(id, S, { targetIdx: 0, rng: r, artifacts: [], passives: [], pacts: [], loot: [] })
      }
      return JSON.stringify(S)
    }
    if (run() !== run()) fail('DETERMINISM: identical seeds produced different states')
  }

  const total = ENGINE_CARD_IDS.length
  if (failures.length === 0) {
    console.log(`PASS ${total}/${total}`)
    console.log(`  cards implemented: ${total}  (accepted: ${okCount}, legitimately rejected: ${rejectCount})`)
    console.log(`  coverage: cards.js ${ALL_CARDS.length} + CORRUPTION_CARDS ${Object.keys(CORRUPTION_CARDS).length} + contract`)
    process.exit(0)
  } else {
    console.log(`FAIL ${total - failures.length}/${total}`)
    for (const f of failures) console.log('  ✗ ' + f)
    process.exit(1)
  }
}
