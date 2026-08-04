// e2e/brain.cjs — EXPERT COMBAT BRAIN.
//
// AUG 4 2026 AUDIT + REWRITE. The policy had never been audited. It was a fork of
// vestibule-sim-kwstacks.js `scoreCard`, and it had drifted from BOTH the sim and
// the authoritative engine (src/data/cardEngine.js). The defects below were graded
// against `applyCardEffect` and against the live strike formula in src/App.jsx
// (`handleStrikeBody`, ~8390-8960). Every fix cites the code it was measured from.
//
// THE STRIKE FORMULA THIS POLICY IS PLAYING AGAINST (App.jsx ~8527-8930):
//   dmg = Σ getEffectiveAtk(m)  for alive, non-Drummer members     [Drummers NEVER swing]
//       × DOUBLE TIME d6 (1 / 1.5 / 2)
//       + encore bonus (a second copy of each encoreReady member's ATK)
//       × band synergy (1.10 / 1.20 / 1.35 at 3 / 4 / 5 buffed members)
//       + mentor links   × Wailing Guitar
//   final = dmg × tripMult × strikeMult × corruptionMult × artifactMult + flatArtifact
//   corruptionMult = 1.0 / 1.2 / 1.5 / 2.0 / 3.0  at  <40 / 40 / 60 / 80 / 100
//   strikeMult     = 1.0, ×1.08 per card played, ×1.78 per Riff Chain — RESET EVERY
//                    STRIKE (PER_STRIKE_RESETS, App.jsx ~5642).
//
// Two consequences drive most of this file:
//   (1) CHAINS ARE PER-STRIKE. `cardsPlayedRef` and `combosFiredRef` are both in
//       PER_STRIKE_RESETS. A chain needs BOTH halves in ONE strike, and it can
//       re-fire every strike. The old policy modelled chains per FIGHT, so it
//       claimed 31 chains in a 159-strike ledger while the game's own combat log
//       recorded ZERO (`chain_confirmed: 0`). It scored phantom completions across
//       strike boundaries and then refused to re-fire a chain for the rest of the
//       fight because it had "already fired".
//   (2) DIRECT DAMAGE BYPASSES EVERY MULTIPLIER. `dmgBoss` writes bossHp on the
//       spot; ATK buffs get multiplied at strike time. So a flat-damage card is
//       worth a shrinking fraction of a strike as the run goes on. The old policy
//       scored Stage Dive at a flat 82 forever.
//
// Card knowledge: e2e/carddata.json (86 ids, 16 chains, 18 musicians), resynced
// against src/data/cards.js + src/data/members.js on Aug 4 2026.
//
// HONESTY: this policy only reads what a player can see — member ATK/HP/keyword/
// role/stage position, corruption, embers, hand contents, boss HP, and its own
// memory of what IT played this strike. It is not told the deck, the RNG, or the
// boss's passive. Two things it SHOULD know and is not given by the driver are
// listed under "NOT FIXABLE FROM THIS FILE" at the bottom.
const { cards: ALL_CARDS, chains: RIFF_CHAINS, musicians: MUSICIANS } = require('./carddata.json')

const DEF = {}
for (const c of ALL_CARDS) DEF[c.id] = c
const defOf = card => (card && DEF[card.id]) || card || {}

// ── name matching ─────────────────────────────────────────────────────────
// The screen shows badge prefixes: "ChainRareStage Dive", "NEED New Strings".
//
// Aug 4 2026 BUG: the old stripper was `n.replace(/^(chain|rare|...|need|new)+/, '')`
// applied blind. `new` is a badge token AND the first word of a real card, so
// "New Strings" with ANY badge prefix normalised to "strings" and matched nothing.
// The Aug-4 ledger has exactly that: card_unmatched for "NEED   New Strings" and
// "Chain New Strings" — a Standard-deck card (2 copies, half of the POWER SURGE
// chain) that the bot could not play whenever the game badged it.
//
// The fix keeps the earlier lesson (a fuzzy endsWith scan silently RELABELLED
// cards, which is worse than no label) by requiring the stripped prefix to consist
// ONLY of badge tokens and the remainder to be an EXACT card name. That is a
// decidable test, not a guess. Ties go to the longest name, so "newstrings" wins
// over a hypothetical "strings".
const norm = s => (s || '').toLowerCase().replace(/[^a-z]/g, '')
const BADGE_ONLY = /^(chain|rare|common|uncommon|novice|foil|mythic|demonic|adept|master|legendary|upgraded|need|new)*$/
const BY_NORM = {}
const AMBIGUOUS = {}
for (const c of ALL_CARDS) {
  const k = norm(c.name)
  if (BY_NORM[k]) (AMBIGUOUS[k] = AMBIGUOUS[k] || [BY_NORM[k].id]).push(c.id)
  BY_NORM[k] = c
}
const NORM_KEYS = Object.keys(BY_NORM).sort((a, b) => b.length - a.length)
function matchCard(screenName) {
  const n = norm(screenName)
  if (!n) return null
  if (BY_NORM[n]) return BY_NORM[n]
  for (const k of NORM_KEYS) {
    if (n.length <= k.length || !n.endsWith(k)) continue
    if (BADGE_ONLY.test(n.slice(0, n.length - k.length))) return BY_NORM[k]
  }
  return null   // never invent a label — the caller logs card_unmatched
}
const isAmbiguous = screenName => {
  const c = matchCard(screenName)
  return (c && AMBIGUOUS[norm(c.name)]) || null
}

// ---- gs-lite: assembled each strike from the live screen by autopilot
// { alive:[{name,atk,atkBase,hp,maxHp,role,keyword,tier}], corruption, stash, embers,
//   handIds, handLen, discardsLeft, strikeMult, cardsPlayedIds (THIS FIGHT),
//   firedChains:Set, discardLen, fightIndex, bossHp, anyStoned, hrUsed:Set }

// ═══════════════════════════════════════════════════════════════════════════
//  ENGINE-VERIFIED FACT TABLES (every entry traced to a cardEngine.js IMPL)
// ═══════════════════════════════════════════════════════════════════════════

// Corruption is a DAMAGE MULTIPLIER (App.jsx ~8733), not a hazard to avoid. These
// are the exact deltas the engine applies.
const CORR_DELTA = {
  dialtoeleven: 10, distortion: 15, deathriff: 10, bloodritual: 15, corrsiphon: 8,
  soulbargain: 5, venomriff: 5, offeringpit: 10, hexdecay: 15, carrioncall: 20,
  possessionriff: 10, hellfirerift: 20, soulsacrifice: 15, voidpact: 25,
  dark_whisper: 5, void_pact: 10, setbreak: -15,
}
const CORR_SET = { infernalpact: 66, controlfeedback: 50, sabbathsigil: 100 }

// Cards whose effect READS a member's current ATK and multiplies or copies it.
// They must be played AFTER the flat +ATK cards, or the multiplier lands on the
// un-buffed number. The old policy scored every one of these ABOVE every additive
// buff, so it did the reverse in every single strike.
const MULT_ATK = new Set(['amp', 'overdrive', 'possessedperf', 'hellfirerift', 'resonancecard'])

// Flat +ATK grants (permanent or this-strike). Playing these first feeds MULT_ATK.
const ADD_ATK = new Set([
  'battlecry', 'newstrings', 'soundwall', 'moshpit', 'crowdsurf', 'heavyriff', 'skullsplitter',
  'feedbackscream', 'feedbackloop', 'venomriff', 'whispercard', 'dark_whisper', 'blood_price',
  'hungercard', 'void_pact', 'dialtoeleven', 'deathriff', 'soulsacrifice', 'infernalpact',
  'harmonicfb', 'doomchord', 'bloodharmony', 'cursedstrings', 'possessionriff', 'soulbargain',
  'sonicboom', 'necroticamp', 'distortion', 'ampstatic', 'tremolopick', 'devilsdice',
  'darktuning', 'herbmoney', 'russianroulette', 'offeringpit',
])

// Cards that grant ATK to the DROP TARGET. A Drummer must never receive one —
// App.jsx `handleStrikeBody` skips `role==='Drummer'` in the damage sum, the
// encore bonus, the DOUBLE TIME tier-3 bonus and the per-member cascade, so ATK on
// a drummer is worth exactly zero. This bit the old policy hardest on Resonance,
// whose LOWEST-ATK targeting rule aims straight at the drummer (ATK 0-1): 18 plays
// in the Aug-4 ledger, most of them a guaranteed no-op or an engine rejection.
const TARGETED_ATK = new Set([
  'amp', 'battlecry', 'newstrings', 'encore', 'whispercard', 'dark_whisper', 'blood_price',
  'feedbackloop', 'ampstatic', 'crowdsurf', 'heavyriff', 'resonancecard', 'herbmoney',
  'feedbackscream', 'skullsplitter', 'doomchord', 'bloodharmony', 'tremolopick', 'harmonicfb',
  'shredsolo', 'soulbargain', 'venomriff', 'possessionriff', 'cursedstrings', 'russianroulette',
])

// Net ember swing (gain − cost) for the self-funding / ember cards. cardEngine sets
// C.freeCost on powertap / staticcharge / soundboard / tappedout, so those cost 0.
const EMBER_NET = {
  powertap: 2, staticcharge: 2, soundboard: 2, tappedout: 5, groupie: 1, ampoverload: 3,
  corrsiphon: 3, drainthecrowd: 2, ampfeedback: 1, slowburn: 1, pyromaniac: 1, setbreak: 3,
  secondwind: 3,
}

// Demo Tape replays the last RIFF, and the replay ladder does NOT match the cards
// it claims to replay (cardEngine IMPL.demotape is a wall of DEMOTAPE-MISMATCH
// notes). Sound Wall's replay is direct damage; Crowd Surf's is hand×3 damage;
// Stage Dive's is a flat 12. The old policy scored Demo Tape at a constant 52 with
// no idea what it was about to replay. Entries here are the ATK-granting replays;
// the damage ones are computed live below.
const DEMOTAPE_ATK_VALUE = {
  infencore: 95, overdrive: 86, amp: 82, distortion: 74, doubledown: 40,
  resonancecard: 66, shredsolo: 58, doomchord: 55, devilsdice: 55, overdriveped: 50,
  moshpit: 50, heavyriff: 45, bloodharmony: 45, riffthief: 45, tremolopick: 45,
  possessedperf: 35, herbmoney: 25, demotape: 20,
}
const DEMOTAPE_DMG = {   // replays that deal DIRECT damage — value them against the strike
  soundwall: (ctx) => (ctx.circle <= 3 ? 5 : ctx.circle <= 6 ? 8 : 12),
  feedbackloop: (ctx) => Math.floor(ctx.corruption / 2),
  crowdsurf: (ctx) => ctx.handLen * 3,
  sonicboom: (ctx) => ctx.bandAtk,
  stagedive: () => 12,
  skullsplitter: () => 15,
  necroticamp: () => 8,
  feedbackscream: (ctx) => Math.floor(ctx.corruption / 5) + 3,
}

const corrMultOf = c => (c >= 100 ? 3.0 : c >= 80 ? 2.0 : c >= 60 ? 1.5 : c >= 40 ? 1.2 : 1.0)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const stackTier = n => (n >= 3 ? 4 : n === 2 ? 2 : n >= 1 ? 1 : 0)

// ═══════════════════════════════════════════════════════════════════════════
//  STRIKE CONTEXT — everything derived once per scoring pass
// ═══════════════════════════════════════════════════════════════════════════
function makeCtx(gs, strikeNum, cardsPlayed) {
  const alive = (gs && gs.alive) || []
  // Drummers buff, they do not swing (App.jsx handleStrikeBody).
  const swingers = alive.filter(m => m.role !== 'Drummer')
  const bandAtk = swingers.reduce((s, m) => s + (m.atk || 0), 0)
  const played = (gs && gs.cardsPlayedIds) || []
  // autopilot pushes to playedIdsThisFight ONLY on a verified play and passes the
  // per-strike count as `cardsPlayed`, so the tail of the fight list IS this
  // strike. slice(-0) returns the whole array, hence the explicit guard.
  const thisStrike = cardsPlayed > 0 ? played.slice(-cardsPlayed) : []
  const kw = {}
  for (const m of alive) kw[m.keyword] = (kw[m.keyword] || 0) + (m.tier === 'foil' ? 2 : 1)
  const corruption = (gs && gs.corruption) || 0
  return {
    gs, alive, swingers, bandAtk, thisStrike, played,
    corruption, corrMult: corrMultOf(corruption),
    embers: (gs && gs.embers) || 0,
    maxEmbers: (gs && gs.maxEmbers) || 6,
    handIds: (gs && gs.handIds) || [],
    handLen: (gs && gs.handLen) || 0,
    strikeMult: (gs && gs.strikeMult) || 1,
    circle: Math.floor(((gs && gs.fightIndex) || 0) / 3) + 1,
    strikeNum, cardsPlayed,
    frenziedTier: stackTier(kw.FRENZIED || 0),
    frenziedCount: alive.filter(m => m.keyword === 'FRENZIED').length,
    shredderTier: stackTier(kw.SHREDDER || 0),
    shredderCount: alive.filter(m => m.keyword === 'SHREDDER').length,
    // What one strike is currently worth, so flat damage can be priced against it.
    estStrike: Math.max(1, bandAtk * ((gs && gs.strikeMult) || 1) * corrMultOf(corruption)),
  }
}

// A flat-damage card is worth the fraction of a strike it replaces. This is the
// single biggest correction in the file: Stage Dive at a constant 82 is a Circle-1
// score being applied in Circle 9, where 16 direct damage is noise against a
// 5,000-damage strike.
const dmgScore = (D, ctx) => clamp(Math.round(6 + 80 * Math.min(2, D / ctx.estStrike)), 4, 92)

// Value of a corruption change, in policy points, via the damage multiplier tier.
//
// Corruption is not free: the fight's PEAK carries out as `hangover` (App.jsx
// ~5141), which costs -floor(hangover/33) max HP per member next fight and up to
// +60% on every shop price. A BOSS KILL CLEARS IT (App.jsx ~7265). So the expert
// line is to run corruption hot into a circle boss and stay leaner on the two
// fights before it — which is what the weight below encodes. Fight 3 of 3 is
// printed on screen, so this uses nothing a player cannot see.
function corrValue(id, ctx) {
  let after
  if (CORR_SET[id] !== undefined) after = CORR_SET[id]
  else if (CORR_DELTA[id] !== undefined) after = clamp(ctx.corruption + CORR_DELTA[id], 0, 100)
  else return 0
  const gain = corrMultOf(after) / ctx.corrMult - 1
  const isBossFight = ((ctx.gs && ctx.gs.fightIndex) || 0) % 3 === 2
  // Losing a tier is always fully bad; gaining one is discounted by the hangover
  // it will cost on a non-boss fight.
  return Math.round((gain < 0 ? 100 : (isBossFight ? 100 : 55)) * gain)
}

const costOf = id => Math.max(0, (DEF[id] && DEF[id].embers) || 0)

// ═══════════════════════════════════════════════════════════════════════════
//  SCORING
// ═══════════════════════════════════════════════════════════════════════════
function scoreCard(card, gs, strikeNum, cardsPlayed) {
  const ctx = makeCtx(gs, strikeNum, cardsPlayed)
  const def = defOf(card)
  const id = def.id
  const base = scoreBase(def, ctx)
  // A card the engine will REJECT, or one whose effect is already spent, must stay
  // dead. The driver aborts the whole play loop after 3 failed plays, so a chain
  // bonus that resurrects an impossible card costs a third of the strike.
  if (base <= 3) return base

  // The scale is ORDINAL. The driver only ranks scores and applies two absolute
  // cuts (>3 to play at all, <25 to dump in the discard dig), so a card that both
  // completes a chain AND crosses a corruption tier is allowed to land above 100 —
  // it really is the best play on the board. The floor is clamped at 0 so the
  // ordering penalty can never push a card below the "impossible card" band.
  const s = base + chainBonus(id, ctx) + keywordSequenceBonus(def, ctx) + orderPenalty(id, ctx)
  return Math.max(0, Math.round(s))
}

// ── RIFF CHAINS, per strike ────────────────────────────────────────────────
// ×1.78 on the whole strike is worth more than any single card's effect, so
// completing a live chain outranks everything. `gs.firedChains` is deliberately
// IGNORED: the driver keeps it per-FIGHT, but combosFiredRef is a PER_STRIKE_RESET,
// so a chain that fired last strike is available again this strike.
function chainBonus(id, ctx) {
  let best = 0
  for (const ch of RIFF_CHAINS) {
    const partner = id === ch[0] ? ch[1] : id === ch[1] ? ch[0] : null
    if (!partner) continue
    const iAmPlayed = ctx.thisStrike.includes(id)
    const partnerPlayed = ctx.thisStrike.includes(partner)
    if (partnerPlayed) {
      // Already fired this strike if BOTH halves are down — a second copy adds nothing.
      if (!iAmPlayed) best = Math.max(best, 55)
    } else if (ctx.handIds.includes(partner)) {
      // Only chase the setup if BOTH halves are actually affordable this strike.
      if (ctx.embers >= costOf(id) + costOf(partner)) best = Math.max(best, 22)
    }
  }
  return best
}

// ── SHREDDER / FRENZIED sequencing ─────────────────────────────────────────
// SHREDDER pays +tier ATK per CONSECUTIVE same-type pair this strike; FRENZIED
// pays +tier ATK per RIFF this strike (App.jsx getEffectiveAtk). Neither was
// modelled at all. Both are small per card, which is exactly why they must be a
// tie-breaker and not a headline score.
function keywordSequenceBonus(def, ctx) {
  let b = 0
  if (ctx.frenziedTier > 0 && def.type === 'RIFF') {
    b += Math.min(14, 2 * ctx.frenziedCount * ctx.frenziedTier)
  }
  if (ctx.shredderTier > 0 && ctx.thisStrike.length) {
    const prev = DEF[ctx.thisStrike[ctx.thisStrike.length - 1]]
    if (prev && prev.type === def.type) b += Math.min(12, 2 * ctx.shredderCount * ctx.shredderTier)
  }
  return b
}

// ── ordering: multiply LAST ────────────────────────────────────────────────
function orderPenalty(id, ctx) {
  if (!MULT_ATK.has(id)) return 0
  const mine = costOf(id)
  // Budget = embers in hand PLUS what the ember cards still in hand will hand back.
  // Without the projection the policy fires the multiplier early whenever it is
  // momentarily short, then plays Power Tap and a flat buff afterwards — which is
  // the exact misordering this penalty exists to stop.
  let budget = ctx.embers
  for (const h of ctx.handIds) if (EMBER_NET[h] > 0 && costOf(h) <= ctx.embers) budget += EMBER_NET[h]
  for (const h of ctx.handIds) {
    if (!ADD_ATK.has(h)) continue
    // Only defer when both still fit the budget — deferring into a card you can no
    // longer afford is worse than playing it in the wrong order.
    if (budget >= mine + costOf(h)) return -34
  }
  return 0
}

function scoreBase(def, ctx) {
  const alive = ctx.alive
  if (!alive.length) return 0
  const swingers = ctx.swingers.length ? ctx.swingers : alive
  const corruption = ctx.corruption, stash = (ctx.gs && ctx.gs.stash) || 0, embers = ctx.embers
  const n = alive.length
  const highestAtk = Math.max(...swingers.map(m => m.atk || 0))
  const lowestAtk = Math.min(...swingers.map(m => m.atk || 0))
  const lowestHp = alive.reduce((a, b) => (a.hp < b.hp ? a : b))
  const highestHp = alive.reduce((a, b) => (a.hp > b.hp ? a : b))
  const anyHurt = alive.some(m => m.hp < (m.maxHp || m.hp) * 0.5)
  const handLen = ctx.handLen
  const corr = corrValue(def.id, ctx)          // damage-tier value of the corruption swing
  const emberRoom = embers <= ctx.maxEmbers - 2

  switch (def.id) {
    // ── the ceiling plays ────────────────────────────────────────────────
    case 'possessedperf': return 95
    case 'overdrive': return corruption >= 60 ? 92 : 10
    case 'infencore': return 88
    case 'hellfirerift': return (corruption < 80 ? 88 : 60) + corr
    case 'darkcrescendo': return corruption >= 80 ? 98 : 0
    // Pact of the Void: ×2.5 on the strike multiplier AND +25% corruption, free.
    case 'voidpact': return 92 + corr

    // ── FLAT DAMAGE — priced against what a strike is currently worth ────
    // Every one of these writes bossHp directly (cardEngine dmgBoss) and is
    // therefore NOT multiplied by strikeMult / corruption / artifacts.
    case 'stagedive':
      // Once per STRIKE (cardEngine `flags.stageDiveUsed`). Re-offering it is a
      // guaranteed rejection and costs a third of the driver's fail budget.
      if (ctx.thisStrike.includes('stagedive')) return 0
      return dmgScore(highestHp.hp, ctx)
    case 'bloodritual': {
      const sac = Math.floor(highestHp.hp * 0.25)
      if (sac <= 0) return 0                                   // engine rejects
      return clamp(dmgScore(sac * 6, ctx) + corr, 4, 95)
    }
    case 'hexdecay': return clamp(dmgScore(Math.floor(((ctx.gs && ctx.gs.bossHp) || 0) * 0.15), ctx) + corr, 4, 95)
    case 'goingbroke': return stash >= 25 ? Math.max(0, dmgScore(stash, ctx) - 20) : 0
    // 15% of boss MAX HP. Unlike the others this scales with the fight for free, so
    // a constant IS the correct model: it is always worth roughly a third of a
    // strike, at zero embers, at every depth.
    case 'madnesscard': return 96

    // ── ember economy: play the self-funding cards FIRST ─────────────────
    // The old gates (embers<=2, embers<=3) held these back until the bot was nearly
    // broke, by which point the payoff card was unaffordable. Every one of these is
    // ember-POSITIVE, so an expert opens with them: more embers means more cards,
    // and more cards means a bigger ×1.08^n and the cards3/cards5 relics firing.
    case 'powertap': return emberRoom ? 84 : 20
    case 'staticcharge': return emberRoom ? (corruption === 0 ? 86 : 80) : 20
    case 'secondwind': return embers === 0 ? 90 : embers <= 2 ? 60 : 8
    case 'corrsiphon': return (emberRoom ? 70 : 25) + corr
    case 'ampoverload': return ((ctx.gs && ctx.gs.discardsLeft) > 0) ? (emberRoom ? 81 : 25) : 3
    case 'groupie': return emberRoom ? 66 : 30
    case 'soundboard': return emberRoom ? 64 : 30
    case 'ampfeedback': return emberRoom ? 68 : 28
    case 'drainthecrowd': return emberRoom ? 64 : 20
    case 'pyromaniac': return emberRoom ? 66 : 25
    case 'slowburn': return ctx.strikeNum === 0 ? 65 : 30
    case 'tappedout': return ctx.strikeNum < 3 ? 78 : 18
    // Smoke Break DUMPS 15% CORRUPTION and, with no pre-selection, discards a
    // RANDOM card (cardEngine IMPL.setbreak). At 62% corruption that trades a ×1.5
    // damage tier for 3 embers. The old flat 52 had no idea.
    case 'setbreak': return clamp((emberRoom ? 52 : 14) + corr, 0, 90)

    // ── permanent / band-wide ATK: value scales with the band ────────────
    case 'soundwall': return 44 + 9 * n
    case 'moshpit': return n >= 4 ? 74 : n >= 3 ? 60 : 38
    // Dial to Eleven: FREE, ALL members +3 ATK that never expires (the engine's
    // tempAtkBonus-without-tempBuff quirk), AND +10% corruption. The old policy
    // scored it 14 at corruption>=50 — it penalised the card for its own upside.
    case 'dialtoeleven': return clamp(55 + 10 * n + corr, 0, 97)
    case 'deathriff': return clamp(40 + 9 * n + corr, 0, 95)
    case 'soulsacrifice': return clamp(55 + 11 * n + corr, 0, 97)
    case 'infernalpact': return clamp(55 + 9 * n + corr, 0, 95)
    case 'distortion': return clamp(40 + 7 * n + corr, 0, 92)
    case 'sonicboom': return 44 + 10 * n
    case 'hungercard': return 70 + 5 * n
    case 'void_pact': return clamp(72 + corr, 0, 95)
    case 'necroticamp': return clamp(25 + 6 * n * Math.floor(corruption / 20), 8, 95)
    case 'devilsdice': return 35 + 8 * n
    case 'darktuning': return corruption >= 70 ? 68 : corruption >= 40 ? 55 : 10
    case 'offeringpit': return n >= 2 ? clamp(45 + corr, 0, 90) : 0
    case 'russianroulette': return n >= 3 ? 48 : 22

    // ── targeted ATK ─────────────────────────────────────────────────────
    case 'amp': return 72 + (highestAtk > 4 ? 10 : 0)
    case 'encore': return 70 + (highestAtk > 5 ? 10 : 0)
    case 'shredsolo': return highestAtk >= 8 ? 80 : 50
    case 'newstrings': return 67
    case 'battlecry': return 62
    case 'heavyriff': {
      const used = (ctx.gs && ctx.gs.hrUsed) || new Set()
      // ONCE PER MEMBER PER FIGHT (cardEngine rejects on `_hrUsed`). Drummers are
      // excluded: +ATK on a member that never swings is nothing.
      const fresh = swingers.filter(m => !used.has(m.name))
      if (!fresh.length) return 3
      const bestGain = Math.min(20, Math.ceil(Math.max(...fresh.map(m => m.atk || 0)) / 2))
      return clamp(35 + Math.round(45 * Math.min(1, bestGain / 12)), 30, 82)
    }
    case 'crowdsurf': return handLen >= 5 ? 74 : handLen >= 3 ? 55 : 30
    case 'skullsplitter': return highestAtk >= 10 ? 80 : 62
    case 'feedbackscream': return 65
    // cardEngine threshold is 50, not 40, and this is a +2/+4 PERMANENT ATK grant
    // (the "damage equal to half corruption" in the card text is a live no-op).
    case 'feedbackloop': return corruption >= 50 ? 66 : 48
    case 'ampstatic': return corruption >= 50 ? 52 : 26      // engine threshold is 50, was 30
    case 'venomriff': return clamp(60 + corr, 0, 90)
    case 'possessionriff': return clamp(78 + corr, 0, 96)
    case 'soulbargain': return clamp(72 + corr, 0, 92)
    case 'cursedstrings': return 55
    case 'doomchord': return corruption >= 50 ? 78 : 55
    case 'bloodharmony': return 52
    case 'tremolopick': return ctx.cardsPlayed >= 3 ? 70 : 35
    // Counts RIFFs THIS STRIKE. The old code counted the whole FIGHT, so it read 78
    // permanently from the second strike onward. cardEngine reads S.cardsPlayedIds,
    // which live resets every strike.
    case 'harmonicfb': {
      const riffs = ctx.thisStrike.filter(x => DEF[x] && DEF[x].type === 'RIFF').length
      return riffs >= 3 ? 78 : riffs >= 1 ? 45 : 25
    }
    case 'whispercard': return 74
    case 'dark_whisper': return clamp(70 + corr, 0, 92)
    case 'blood_price': return 78
    case 'herbmoney': return stash >= 10 ? 65 : 0            // engine rejects below 10
    // Resonance SETS the target to the highest ATK on stage. With no spread the
    // engine rejects it outright ("Already at max ATK") — and the driver's targeting
    // aims at the lowest-ATK member, which is usually the Drummer, who never swings.
    // Score the actual gain, on swingers only.
    case 'resonancecard': {
      const gain = highestAtk - lowestAtk
      if (gain <= 0) return 0
      return clamp(20 + Math.round(60 * Math.min(1, gain / 8)), 8, 80)
    }
    case 'overdriveped': return ctx.strikeMult >= 1.5 ? 85 : 55

    // ── utility / draw / heal ────────────────────────────────────────────
    case 'doubledown': {
      // Worth the cost of the priciest card it can free up.
      const bestFree = Math.max(0, ...ctx.handIds.filter(h => h !== 'doubledown').map(costOf))
      return bestFree >= 3 ? 74 : bestFree >= 2 ? 55 : 25
    }
    case 'backstagepass': return embers >= 2 ? 65 : 30
    case 'echopedal': return ctx.cardsPlayed > 0 ? 75 : 0
    case 'riffthief': return ctx.cardsPlayed > 0 ? 78 : 0    // same handler, but FREE
    case 'bootlegcopy': return handLen >= 2 ? 55 : 10
    case 'demotape': return demotapeScore(ctx)
    case 'sigdecay': return handLen >= 4 ? 48 : 20
    case 'setlist': return handLen <= 4 ? 47 : 18
    case 'gearcheck': return 48
    case 'venueswap': return handLen <= 3 ? 60 : 20
    case 'burnset': return handLen >= 5 ? 42 : 15            // no pre-selection ⇒ draws 1
    // The Remaster REJECTS unless a card was pre-selected in hand (App.jsx ~6992),
    // and the driver has no pre-selection path. It is an automatic failed play.
    case 'remaster': return 0
    // LIVE NO-OP (cardEngine IMPL.setlistrewrite) — but it is FREE, so playing it
    // still buys ×1.08 on the strike multiplier and a tick toward cards3/cards5.
    case 'setlistrewrite': return 25
    case 'doublebooking': return 92
    case 'soundcheck': return anyHurt ? 58 : 30
    case 'roadie': return alive.some(m => m.hp <= 3) ? 55 : 20
    case 'wakeup': return (ctx.gs && ctx.gs.anyStoned) ? 90 : anyHurt ? 30 : 8
    case 'carrioncall': return (ctx.gs && ctx.gs.anyStoned) ? 90 : 0
    // Healing a full band is a wasted ember; the old score had no such check.
    case 'seance': return anyHurt ? (corruption >= 50 ? 55 : 35) : 10
    // Controlled Feedback RESETS corruption to 50. Above 60% that DELETES a damage
    // tier. The old policy scored it 55 at corruption>=70 — it rewarded exactly the
    // case where the card is at its worst.
    case 'controlfeedback': {
      const r = lowestHp.hp / Math.max(1, lowestHp.maxHp || lowestHp.hp)
      const heal = r < 0.3 ? 75 : r < 0.5 ? 55 : 15
      return clamp(heal + corr, 0, 90)
    }
    // Corruption → 100 is the ×3.0 damage tier, but the d10 Hellquake can take a
    // member (rolls 7 and 10) or wipe the hand (roll 9). Worth it only when the
    // corruption jump is large and the fight is deep enough to need it.
    case 'sabbathsigil': return clamp((ctx.circle >= 5 ? 45 : 12) + corr, 0, 92)

    case 'contract': return n > 2 ? 30 : 0
    default: return 5
  }
}

function demotapeScore(ctx) {
  // Demo Tape is FREE on a successful replay (cardEngine sets C.freeCost), and
  // live's lastRiffPlayedRef is a PER_FIGHT reset — so the source riff can come
  // from an earlier strike in this fight.
  let last = null
  for (let i = ctx.played.length - 1; i >= 0; i--) {
    const d = DEF[ctx.played[i]]
    if (d && d.type === 'RIFF' && d.id !== 'burnset') { last = d.id; break }
  }
  if (!last) return 0                                   // engine rejects: nothing recorded
  if (DEMOTAPE_DMG[last]) return dmgScore(DEMOTAPE_DMG[last](ctx), ctx)
  if (last === 'overdrive' && ctx.corruption < 60) return 20   // replay hardcodes the 60% gate
  return DEMOTAPE_ATK_VALUE[last] !== undefined ? DEMOTAPE_ATK_VALUE[last] : 52
}

// ═══════════════════════════════════════════════════════════════════════════
//  TARGETING
// ═══════════════════════════════════════════════════════════════════════════
// Graded against each card's real semantics in cardEngine.js:
//   resonancecard SETS target ATK to the stage maximum -> aiming at the current
//     leader is a rejection, and aiming at the Drummer is a no-op.
//   stagedive deals damage EQUAL TO TARGET HP -> wants the tankiest.
//   controlfeedback / roadie / soundcheck heal -> want the most injured.
//   bloodritual sacrifices 25% of target HP for 6x -> wants the highest HP.
//   carrioncall / wakeup need a Too Stoned member to do anything.
//   heavyriff is once per member per fight.
//   doomchord / bloodharmony also hit BOTH NEIGHBOURING STAGE SLOTS.
//   offeringpit gives +8 to a RANDOM OTHER member; the drop target gets nothing
//     (its "skips next attack" clause is a live no-op) -> the target is free.
const HIGHEST_HP = new Set(['stagedive', 'bloodritual'])
const LOWEST_ATK = new Set(['resonancecard', 'offeringpit'])
const MOST_INJURED = new Set(['roadie', 'controlfeedback', 'soundcheck'])
const STONED_TARGET = new Set(['carrioncall', 'wakeup'])
const LOWEST_VALUE = new Set(['russianroulette'])
const NEIGHBOUR_SPREAD = new Set(['doomchord', 'bloodharmony'])

function pickTarget(card, alive, opts) {
  if (!alive || !alive.length) return null
  const id = (card && card.id) || card
  const by = (pool, f, best) => pool.reduce((a, b) => (best(f(b), f(a)) ? b : a))
  const lower = (x, y) => x < y, higher = (x, y) => x > y

  if (STONED_TARGET.has(id)) {
    const stoned = ((opts && opts.allMembers) || alive).filter(m => m.tooStoned)
    if (stoned.length) return stoned[0]
  }
  // An ATK grant on a Drummer is worth zero — handleStrikeBody skips them in the
  // damage sum, the encore bonus and the per-member cascade alike.
  const swingers = alive.filter(m => m.role !== 'Drummer')
  const atkPool = TARGETED_ATK.has(id) && swingers.length ? swingers : alive

  if (id === 'heavyriff') {
    const used = (opts && opts.hrUsed) || new Set()
    const fresh = atkPool.filter(m => !used.has(m.name))
    return by(fresh.length ? fresh : atkPool, m => m.atk || 0, higher)
  }
  if (NEIGHBOUR_SPREAD.has(id)) {
    // The bonus lands on the ADJACENT stage slots (cardEngine: |i - t| === 1), so
    // an interior member spreads it to two bodies instead of one. Stage order is
    // read off the screen by x-position; an empty slot between two members breaks
    // real adjacency, which is why this only ever prefers, never insists.
    const row = atkPool.slice().sort((a, b) => (a.x || 0) - (b.x || 0))
    const interior = row.slice(1, -1)
    return interior.length ? by(interior, m => m.atk || 0, higher) : by(atkPool, m => m.atk || 0, higher)
  }
  if (HIGHEST_HP.has(id)) return by(alive, m => m.hp, higher)
  if (LOWEST_ATK.has(id)) return by(atkPool, m => m.atk || 0, lower)
  if (MOST_INJURED.has(id)) return by(alive, m => m.hp / Math.max(1, m.maxHp || m.hp), lower)
  if (LOWEST_VALUE.has(id)) return by(alive, m => m.atk * 3 + m.hp, lower)
  // Default: the carry. Concentrating permanent ATK on one member is right because
  // amp (x2) and encore (second swing) both key off a SINGLE member.
  return by(atkPool, m => m.atk || 0, higher)
}

// ═══════════════════════════════════════════════════════════════════════════
//  STAGE ORDERING (Band Auras)
// ═══════════════════════════════════════════════════════════════════════════
// Rebuilt against live `_auraAtkMap` (App.jsx ~418). The old table was invented:
// it paid ANCHOR and FOLK MAGIC (+2) MORE than CORRUPT and SHREDDER (+1.5), when
// in the live aura map ANCHOR and FOLK MAGIC grant no ATK at all (ANCHOR reduces
// incoming boss damage, FOLK MAGIC heals 1) and CORRUPT/HEXED/SHREDDER do.
// It also credited auras landing on Drummers, who never swing.
const KW_BY_NAME = {}, ROLE_BY_NAME = {}
for (const m of MUSICIANS) { KW_BY_NAME[m.name.toLowerCase()] = m.keyword; ROLE_BY_NAME[m.name.toLowerCase()] = m.role || '' }
// Emitter weights: unconditional ATK auras first, then the conditional ones
// discounted by how often the condition holds mid-run, then the defensive auras.
const AURA_W = {
  FRENZIED: 3, DEBUFF: 3, 'DOUBLE TIME': 3,   // +1 ATK to neighbours, always
  HEXED: 2.5,                                  // +1 ATK at >=25% corruption
  CORRUPT: 2,                                  // +1 ATK at >=50% corruption
  SHREDDER: 1.5,                               // +1 ATK only while a same-type chain runs
  ANCHOR: 1, 'FOLK MAGIC': 1,                  // defensive: -1 boss damage / +1 heal
}
function auraStaticScore(order) {
  let s = 0
  for (let i = 0; i < order.length; i++) {
    const me = order[i]
    // A Drummer receiving +1 ATK gains nothing; it still benefits from the
    // defensive auras, so it is not excluded outright, only discounted.
    const recv = me.role === 'Drummer' ? 0.25 : 1
    for (const j of [i - 1, i + 1]) {
      const nb = order[j]; if (!nb) continue
      s += recv * (AURA_W[nb.keyword] || 0)
    }
  }
  return s
}
function bestOrder(names) {
  const order = names.map(nm => ({
    name: nm,
    keyword: KW_BY_NAME[String(nm).toLowerCase()] || '',
    role: ROLE_BY_NAME[String(nm).toLowerCase()] || '',
  }))
  let improved = true, guard = 0
  while (improved && guard++ < 30) {
    improved = false
    for (let i = 0; i + 1 < order.length; i++) {
      const cur = auraStaticScore(order)
      ;[order[i], order[i + 1]] = [order[i + 1], order[i]]
      if (auraStaticScore(order) > cur) improved = true
      else [order[i], order[i + 1]] = [order[i + 1], order[i]]
    }
  }
  return order.map(o => o.name)
}

// ═══════════════════════════════════════════════════════════════════════════
//  NOT FIXABLE FROM THIS FILE (documented, not silently ignored)
// ═══════════════════════════════════════════════════════════════════════════
//  * RELIC / PEDAL AWARENESS. The driver never tells the policy which artifacts or
//    pedals the run owns, and the perception layer does not read them off the HUD.
//    Optimal play order changes completely with Echoplex / The Looper / The Witch's
//    Sabbath (the FIRST card of a strike retriggers, so it must be the highest-value
//    one), Set List (x1.4 if the first card played was an EMBER type — which fights
//    the "ember cards first" rule this file just installed), Vintage Guitar (x1.3 at
//    4+ cards), Solo Sermon (x6.0 at EXACTLY 2 cards — a hard stop rule), The Doom
//    Crown (x8.0 if every card this strike shares a type), Ouroboros Pin (x1.3 per
//    discard). Wiring these needs autopilot.cjs to perceive and pass owned item ids.
//  * WHEN TO STRIKE. The driver strikes unconditionally after the play loop; the
//    policy has no veto. With embers not refilling between strikes, "spend down,
//    then strike" is close to right, but Solo Sermon / The Blade / Burning Stage all
//    make the card COUNT itself a decision, and overtime enrage makes late strikes
//    dangerous. A real answer needs a search over the remaining hand, not a heuristic.
//  * TRIP TIMING, SHOP, RECRUIT, PACT and FORGE choices all live in autopilot.cjs.
module.exports = { matchCard, isAmbiguous, scoreCard, pickTarget, ALL_CARDS, RIFF_CHAINS, MUSICIANS, bestOrder }
