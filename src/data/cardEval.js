// ═══════════════════════════════════════════════════════════════════════════
//  cardEval.js — THE SHARED "EXPERT BRAIN"
// ═══════════════════════════════════════════════════════════════════════════
//
//  ONE evaluation used by BOTH the sim and the live bot. Instead of a hand-tuned
//  value per card (which rots every time a card changes), this scores a card by
//  actually PLAYING IT through the shared cardEngine on a throwaway copy of the
//  game state and measuring how much better the position got. Because it runs the
//  real card logic, it:
//    • auto-updates forever — any card/keyword change is reflected instantly,
//    • understands real interactions — adjacency auras, corruption, combos, the
//      whole board — which a flat number never can.
//
//  Input `S` is an engine-shaped state (same fields cardEngine.applyCardEffect
//  reads: stage[5], corruption, embers, maxEmbers, strikeMult, bossHp, bossMaxHp,
//  hand[], deck[], discard[], strikesLeft, cardsPlayedIds, flags{}). The sim builds
//  it from its gs; the live game publishes it to window.__vstState for the bot.
//
//  evaluateCard NEVER mutates the caller's state (it deep-clones first).
// ═══════════════════════════════════════════════════════════════════════════

import { applyCardEffect } from './cardEngine.js'

// The value knobs — the ONLY strategy numbers we maintain (was an 82-card table).
// A point of value ≈ one point of boss damage. Everything else is expressed in
// those terms so the bot trades ATK vs embers vs draw vs healing on one scale.
export const EVAL_WEIGHTS = {
  bossDamage: 1.0,     // immediate damage to the boss
  atkPerStrike: 0.9,   // +1 ATK is worth ~0.9 dmg for each remaining strike
  ember: 3.5,          // an ember enables more plays this fight
  heal: 0.7,           // a point of band HP (survival)
  draw: 4.0,           // a card in hand (card advantage)
  strikeMult: 0.5,     // ×mult applied to current band ATK over remaining strikes
  corruptionCost: 0.25, // mild penalty for raising Corruption (double-edged)
}

function _metric(S) {
  let atk = 0, hp = 0
  for (const m of S.stage) { if (m && !m.tooStoned) { atk += (m.atk || 0); hp += (m.hp || 0) } }
  return {
    bossHp: S.bossHp || 0,
    atk, hp,
    embers: S.embers || 0,
    mult: S.strikeMult || 1,
    corr: S.corruption || 0,
    hand: (S.hand || []).length,
  }
}

// Deep-clone only what the engine can mutate, so evaluation is side-effect-free.
function _cloneState(S) {
  return {
    ...S,
    stage: (S.stage || []).map(m => (m ? { ...m } : null)),
    hand: (S.hand || []).map(c => ({ ...c })),
    deck: (S.deck || []).map(c => ({ ...c })),
    discard: (S.discard || []).map(c => ({ ...c })),
    cardsPlayedIds: (S.cardsPlayedIds || []).slice(),
    flags: { ...(S.flags || {}) },
  }
}

/**
 * Score how good it is to play `cardId` right now, by simulating the play.
 * @param {string} cardId
 * @param {object} S    engine-shaped game state (see header)
 * @param {object} ctx  { targetIdx, artifacts, passives, pacts, loot, upgraded,
 *                        fightIndex, circleNum, selfUid, lastRiffId, emberCost,
 *                        bossPassiveId, strikesLeft }  (rng is supplied here)
 * @returns {number} value in "boss-damage-equivalent" points; -999 = illegal play.
 */
export function evaluateCard(cardId, S, ctx = {}) {
  const sc = _cloneState(S)
  const before = _metric(sc)
  let res
  try {
    res = applyCardEffect(cardId, sc, { rng: Math.random, ...ctx })
  } catch (e) {
    return -999
  }
  if (!res || !res.ok) return -999 // rejected / illegal in this state

  const after = _metric(sc)
  const W = EVAL_WEIGHTS
  const rem = Math.max(1, ctx.strikesLeft || 1)

  const dmg = Math.max(0, before.bossHp - after.bossHp)
  const dAtk = after.atk - before.atk
  const dEmb = after.embers - before.embers
  const dHp = after.hp - before.hp
  const dHand = after.hand - before.hand
  const dMult = after.mult - before.mult
  const dCorr = Math.max(0, after.corr - before.corr)

  return dmg * W.bossDamage
    + dAtk * rem * W.atkPerStrike
    + dEmb * W.ember
    + dHp * W.heal
    + dHand * W.draw
    + dMult * before.atk * rem * W.strikeMult
    - dCorr * W.corruptionCost
}
