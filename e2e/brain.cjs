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
//  RELIC AWARENESS (Aug 4 2026 — ADDITIVE. Nothing above this line changed.)
//
//  The block below is the answer to the "NOT FIXABLE FROM THIS FILE" note that
//  used to live here: the driver now PERCEIVES owned artifacts and pedals off the
//  combat HUD rail (App.jsx ~11868: three 100x108 artifact tiles then two pedal
//  tiles, each printing the item's NAME — exactly what a human reads) and passes
//  the ids in. Everything here is a pure function of that list; the combat card
//  scoring above is untouched and still runs first.
// ═══════════════════════════════════════════════════════════════════════════

// Relic definitions are PARSED from src/data/relics.js at load, not copied, so a
// balance change to a mult or a trigger cannot silently desync the bot.
const RELIC_DEF = {}, RELIC_BY_NORM = {}
try {
  const _rtxt = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'data', 'relics.js'), 'utf8')
  let pool = ''
  for (const line of _rtxt.split('\n')) {
    const p = line.match(/export const ([A-Z_]+)\s*=/); if (p) { pool = p[1]; continue }
    const id = line.match(/[{,]id:'([^']+)'/); if (!id) continue
    const nm = (line.match(/[,{]name:'([^']*)'/) || line.match(/[,{]name:"([^"]*)"/) || [])[1]
    if (!nm) continue
    const d = {
      id: id[1], name: nm, pool,
      kind: /PASSIVE|PEDAL/.test(pool) ? 'pedal' : pool === 'BOSS_LOOT' ? 'loot' : 'artifact',
      multTrigger: (line.match(/multTrigger:'([^']+)'/) || [])[1] || null,
      mult: +((line.match(/[,{]mult:([\d.]+)/) || [])[1] || 0),
      cost: +((line.match(/[,{]cost:(\d+)/) || [])[1] || 0),
      rarity: (line.match(/rarity:'([^']+)'/) || [])[1] || '',
      unimplemented: /unimplemented:true/.test(line),
      effect: (line.match(/effect:'([^']*)'/) || line.match(/effect:"([^"]*)"/) || [])[1] || '',
    }
    RELIC_DEF[d.id] = d
    RELIC_BY_NORM[norm(d.name)] = d
  }
} catch (e) { /* relics.js unreadable — every function below degrades to "no relics" */ }
// Longest-first so "Set List" cannot be eaten by a shorter key inside a HUD blob.
const RELIC_NORM_KEYS = Object.keys(RELIC_BY_NORM).sort((a, b) => b.length - a.length)
function matchRelic(screenName) {
  const n = norm(screenName)
  if (!n) return null
  if (RELIC_BY_NORM[n]) return RELIC_BY_NORM[n]
  for (const k of RELIC_NORM_KEYS) if (k.length >= 5 && n.includes(k)) return RELIC_BY_NORM[k]
  return null
}
const relicDef = id => RELIC_DEF[id] || null

// Triggers whose value depends on the SHAPE of the strike the bot is about to
// throw (how many cards, of what types, in what order). Everything else — always
// on, per-stoned-member, per-other-artifact — is a constant factor that cannot
// change the decision, so it is deliberately excluded from the planner.
const SHAPE_TRIGGERS = new Set([
  'cards3', 'cards5', 'cards2exact', 'cards1', 'allSameType', 'firstCardEmber',
  'playedRiff', 'noRiff', 'embers5', 'perCorruptCard', 'perDupePlayed',
  'perDiscardStrike', 'discardedStrike', 'perChain', 'chains3',
])
// First-card replay pedals. Echoplex is NOT here on purpose: App.jsx ~6758 rolls
// its 69% on EVERY card played, not on the first one, so it is a reason to play
// MORE cards, never a reason to reorder them. (The audit brief listed it as a
// first-card effect; the code disagrees and the code wins.)
const FIRST_REPLAYS = { looperpedal: 1, witchssabbath: 2 }

function ownedShapeRelics(owned) {
  const out = []
  for (const id of (owned || [])) {
    const d = RELIC_DEF[id]
    if (d && d.multTrigger && d.mult > 0 && SHAPE_TRIGGERS.has(d.multTrigger)) out.push(d)
  }
  return out
}

// Multiplier the owned shape-relics pay for one concrete strike shape.
function shapeMult(shape, relics) {
  let m = 1
  for (const r of relics) {
    let fires = 0
    switch (r.multTrigger) {
      case 'cards3': fires = shape.n >= 4 ? 1 : 0; break
      case 'cards5': fires = shape.n >= 6 ? 1 : 0; break
      case 'cards2exact': fires = shape.n === 2 ? 1 : 0; break
      case 'cards1': fires = shape.n === 1 ? 1 : 0; break
      case 'allSameType': fires = (shape.n >= 3 && shape.sameType) ? 1 : 0; break
      case 'firstCardEmber': fires = shape.firstType === 'EMBER' ? 1 : 0; break
      case 'playedRiff': fires = shape.riffs > 0 ? 1 : 0; break
      case 'noRiff': fires = (shape.riffs === 0 && shape.n > 0) ? 1 : 0; break
      case 'embers5': fires = shape.embersAfter >= 5 ? 1 : 0; break
      case 'perCorruptCard': fires = shape.corrupts; break
      case 'perDupePlayed': fires = shape.dupes; break
      case 'perDiscardStrike': fires = shape.discards; break
      case 'discardedStrike': fires = shape.discards >= 1 ? 1 : 0; break
      case 'perChain': fires = shape.chains; break
      case 'chains3': fires = shape.chains >= 3 ? 1 : 0; break
    }
    if (fires > 0) m *= Math.pow(r.mult, fires)
  }
  return m
}

// A strike is worth more than any one card, so the planner prices the strike
// itself at BASE and the cards as their own ordinal scores. Relic multipliers
// scale the WHOLE thing, which is exactly why a x6.0 Solo Sermon can be worth
// throwing away two good cards for.
const PLAN_BASE = 120

// ── planStrike ─────────────────────────────────────────────────────────────
// Enumerate every reachable strike shape and return the best one. Returns null
// when nothing owned cares about shape, so the driver keeps its old behaviour.
//   gs.relics / gs.pedals : owned ids (artifacts+loot, pedals)
//   cands                 : [{id,type,cost,score}] already filtered to playable
function planStrike(gs, cands) {
  const owned = [].concat(gs.relics || [], gs.pedals || [])
  const shaped = ownedShapeRelics(owned)
  const replays = (gs.pedals || []).reduce((s, id) => s + (FIRST_REPLAYS[id] || 0), 0)
  if (!shaped.length && !replays) return null
  // The driver's candidate records carry the resolved card under `.card`; accept
  // either shape so a caller passing raw hand records cannot silently produce a
  // plan full of undefined ids (which is exactly what shipped for ten minutes).
  const list = (cands || []).map(c => {
    const id = c && (c.id || (c.card && c.card.id))
    if (!id) return null
    return { id, type: c.type || (c.card && c.card.type) || (DEF[id] && DEF[id].type) || '', cost: c.cost || 0, score: c.score || 0 }
  }).filter(Boolean)
  if (!list.length) return null
  const embers = (gs && gs.embers) || 0
  const alreadyPlayed = ((gs && gs.thisStrikeIds) || [])
  const already = alreadyPlayed.length
  const alreadyTypes = alreadyPlayed.map(id => (DEF[id] && DEF[id].type) || '')
  const discardsLeft = (gs && gs.discardsLeft) || 0
  const chains = (gs && gs.chainsThisStrike) || 0
  // EXHAUSTIVE over subsets, not greedy. A greedy "best score first" walk cannot
  // find the shape Vintage Guitar wants (four CHEAP cards beats two expensive
  // ones) or the one Doom Crown wants (three cards of one type), which is exactly
  // the kind of sequencing this planner exists to do.
  const pool = list.slice().sort((a, b) => b.score - a.score).slice(0, 10)
  const wantsDiscard = shaped.some(r => r.multTrigger === 'perDiscardStrike' || r.multTrigger === 'discardedStrike')
  const discards = wantsDiscard ? Math.min(discardsLeft, 2) : 0
  const evaluate = (chosen, firstIdx) => {
    let spend = 0
    for (const c of chosen) spend += c.cost
    const ordered = firstIdx > 0 ? [chosen[firstIdx], ...chosen.filter((_, i) => i !== firstIdx)] : chosen
    const types = alreadyTypes.concat(ordered.map(c => c.type))
    const seen = {}; let dupes = 0
    for (const id of alreadyPlayed.concat(ordered.map(c => c.id))) { seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) dupes++ }
    const shape = {
      n: already + ordered.length,
      sameType: types.length > 0 && types.every(t => t === types[0]),
      firstType: types[0] || null,
      riffs: types.filter(t => t === 'RIFF').length,
      corrupts: types.filter(t => t === 'CORRUPT').length,
      dupes, discards, chains, embersAfter: embers - spend,
    }
    const m = shapeMult(shape, shaped)
    let value = ordered.reduce((s, c) => s + c.score, 0)
    if (replays && already === 0 && ordered.length) value += ordered[0].score * replays
    return { total: m * (PLAN_BASE + value), mult: m, shape, ordered }
  }
  let best = null, naive = null
  const N = pool.length
  for (let mask = 0; mask < (1 << N); mask++) {
    const chosen = []
    let spend = 0, ok = true
    for (let i = 0; i < N; i++) {
      if (!(mask & (1 << i))) continue
      chosen.push(pool[i]); spend += pool[i].cost
      if (chosen.length > 6 || spend > embers) { ok = false; break }
    }
    if (!ok) continue
    // chosen is already in descending-score order; try "best card first" and, if a
    // different type sits in the set, that card first (Set List's EMBER rule).
    const firsts = new Set([0])
    for (let i = 1; i < chosen.length; i++) if (chosen[i].type !== chosen[0].type) firsts.add(i)
    for (const fi of firsts) {
      const r = evaluate(chosen, fi)
      if (!best || r.total > best.r.total) best = { r, chosen, fi }
    }
  }
  if (!best) return null
  // The naive line the driver would take without a plan: highest score first,
  // spend down. Used only to decide whether the plan actually changes anything.
  {
    const chosen = []; let spend = 0
    for (const c of pool) { if (chosen.length >= 6) break; if (spend + c.cost > embers) continue; chosen.push(c); spend += c.cost }
    naive = chosen.map(c => c.id).join(',')
  }
  const ord = best.r.ordered
  // The type lock is only real when an owned relic PAYS for purity (Doom Crown).
  // Without that gate, any single-type subset would have locked the driver out of
  // better off-type cards for nothing.
  const purityPaid = shaped.some(r => r.multTrigger === 'allSameType') && best.r.shape.sameType && best.r.shape.n >= 3
  const plan = {
    total: best.r.total, mult: best.r.mult,
    cap: already + ord.length,
    typeLock: purityPaid ? ord[0].type : null,
    firstPrefer: already === 0 && ord.length ? ord[0].type : null,
    nextId: ord.length ? ord[0].id : null,
    ids: ord.map(c => c.id), discards,
    naive,
    why: shaped.filter(r => shapeMult(best.r.shape, [r]) > 1).map(r => r.name),
  }
  // Only OVERRIDE the (audited, incrementally re-scored) default line when an
  // owned relic genuinely pays for a different shape. A plan whose multiplier is
  // 1.0 is just a static knapsack re-ranking of the same cards, and the driver's
  // per-card re-scoring is strictly better information than that.
  // ACTIVE means "the driver must do something different". A relic whose
  // multiplier is the same for every shape (Spit Cup fires on the DISCARD, not on
  // the cards) cannot change the argmax, so the plan is only worth following when
  // the chosen cards or their order actually differ from the default line.
  plan.active = plan.ids.join(',') !== naive
  return plan
}

// ── relicCardBonus ─────────────────────────────────────────────────────────
// Per-card score delta from owned relics, used ON TOP of scoreCard(). Small and
// additive by design: it re-ranks near-ties (play the CORRUPT card when the
// Pentagram Shrine is on the rail) without ever resurrecting an unplayable card.
function relicCardBonus(cardId, gs) {
  const owned = [].concat(gs.relics || [], gs.pedals || [])
  if (!owned.length) return 0
  const def = DEF[cardId]; if (!def) return 0
  const played = (gs.thisStrikeIds || []).map(id => (DEF[id] && DEF[id].type) || '')
  let b = 0
  for (const id of owned) {
    const r = RELIC_DEF[id]; if (!r || !r.multTrigger) continue
    switch (r.multTrigger) {
      case 'perCorruptCard': if (def.type === 'CORRUPT') b += 24; break
      case 'playedRiff': if (def.type === 'RIFF' && !played.includes('RIFF')) b += 14; break
      case 'noRiff': if (def.type === 'RIFF') b -= 22; break
      case 'perDupePlayed': if ((gs.thisStrikeIds || []).includes(cardId)) b += 14; break
      case 'perChain': case 'chains3': break // chainBonus already dominates these
      case 'corrupt50': case 'corrupt80': case 'corrupt100exact': case 'corruptedClean': {
        // A corruption card is worth more when a corruption relic is one tier away.
        const need = r.multTrigger === 'corrupt50' ? 60 : r.multTrigger === 'corrupt80' ? 80 : 100
        const d = CORR_SET[cardId] !== undefined ? CORR_SET[cardId] - (gs.corruption || 0) : (CORR_DELTA[cardId] || 0)
        if (d > 0 && (gs.corruption || 0) < need && (gs.corruption || 0) + d >= need) b += Math.min(40, Math.round(20 * r.mult))
        break
      }
    }
  }
  return b
}

// ── relicBuyScore ──────────────────────────────────────────────────────────
// What an offered artifact/pedal is worth TO THIS RUN. The old shop bought
// whatever the tile happened to be, so Lucifer's Pact (x4 if Lucifer is on stage
// — the bot never signs Lucifer) and Chrome Skull (x3 if exactly ONE member is
// alive) were bought at full price as dead weight, and then the balance report
// blamed the relic. ctx: {band:[{role,keyword,tier}], owned:[ids], corruption,
// deckTypes:{RIFF:n,...}, circle}
function relicBuyScore(idOrName, ctx) {
  const r = RELIC_DEF[idOrName] || matchRelic(idOrName)
  if (!r) return { score: 0, why: 'unknown item' }
  const c = ctx || {}
  const band = c.band || []
  const owned = c.owned || []
  const alive = band.filter(m => m && !m.tooStoned)
  const n = alive.length
  const roles = {}; alive.forEach(m => { roles[m.role] = (roles[m.role] || 0) + 1 })
  const maxSameRole = Math.max(0, ...Object.values(roles))
  const hasDrummer = alive.some(m => m.role === 'Drummer')
  const deckTypes = c.deckTypes || {}
  const totalCards = Math.max(1, Object.values(deckTypes).reduce((a, b) => a + b, 0))
  const corr = c.corruption || 0
  // Expected multiplier this run, given the band that actually exists.
  let em = 1, why = r.multTrigger || 'utility'
  switch (r.multTrigger) {
    case 'alwaysOn': em = r.mult; break
    case 'cards3': em = 1 + (r.mult - 1) * 0.55; break            // 4+ cards happens often, not always
    case 'cards5': em = 1 + (r.mult - 1) * 0.15; break            // all 6 cards is rare
    case 'cards2exact': em = 1 + (r.mult - 1) * 0.75; break       // the bot can CHOOSE to stop at 2
    case 'cards1': em = 1 + (r.mult - 1) * 0.5; break
    case 'allSameType': em = 1 + (r.mult - 1) * 0.35; break       // reachable but costs card quality
    case 'firstCardEmber': em = 1 + (r.mult - 1) * ((deckTypes.EMBER || 0) / totalCards > 0.08 ? 0.8 : 0.25); break
    case 'playedRiff': em = 1 + (r.mult - 1) * 0.85; break
    case 'noRiff': em = 1 + (r.mult - 1) * 0.2; break             // fights the whole deck
    case 'embers5': em = 1 + (r.mult - 1) * 0.3; break            // conflicts with spending embers
    case 'discardedStrike': em = 1 + (r.mult - 1) * 0.6; break
    case 'perDiscardStrike': em = Math.pow(r.mult, 1.2); break
    case 'perCorruptCard': em = Math.pow(r.mult, Math.min(3, 1 + 2 * ((deckTypes.CORRUPT || 0) / totalCards))); break
    case 'perDupePlayed': em = Math.pow(r.mult, 0.8); break
    case 'perChain': em = Math.pow(r.mult, 1.0); break
    case 'chains3': em = 1 + (r.mult - 1) * 0.2; break
    case 'perAliveMember': em = Math.pow(r.mult, n); break
    case 'perSameRole': em = maxSameRole >= 2 ? Math.pow(r.mult, maxSameRole) : 1; break
    case 'perStoned': em = 1 + (r.mult - 1) * 0.3; break          // stoned members are a LOSS; never plan for them
    case 'anyStoned': em = 1 + (r.mult - 1) * 0.35; break
    case 'allHealthy': em = 1 + (r.mult - 1) * 0.5; break
    case 'lastMemberStanding': em = n <= 1 ? r.mult : 1.02; break // dead relic with a real band
    case 'doubleTimeRolled': em = hasDrummer ? 1 + (r.mult - 1) * 0.33 : 1; break // d6 5-6 = 1/3
    case 'luciferOnStage': em = alive.some(m => m.keyword === 'FALLEN') ? r.mult : 1; break
    case 'corrupt50': em = 1 + (r.mult - 1) * (corr >= 40 ? 0.8 : 0.5); break
    case 'corrupt80': em = 1 + (r.mult - 1) * (corr >= 60 ? 0.7 : 0.4); break
    case 'corrupt100exact': em = 1 + (r.mult - 1) * 0.2; break    // EXACTLY 100 is hard to hold
    case 'corruptedClean': em = 1 + (r.mult - 1) * 0.1; break
    case 'perOtherArtifact': em = Math.pow(r.mult, Math.max(0, owned.filter(o => (RELIC_DEF[o] || {}).kind === 'artifact').length)); break
    case 'goatStackOther': em = r.mult * Math.pow(1.3, Math.max(0, owned.filter(o => (RELIC_DEF[o] || {}).kind === 'artifact').length)); break
    case 'earlyCircle': em = (c.circle || 1) <= 2 ? 1 + (r.mult - 1) * 0.7 : 1.0; break
    case 'firstStrikeOfFight': em = 1 + (r.mult - 1) * 0.28; break
    case 'tongueDamage': em = 1.8; break
    case 'sigilOpener': em = 2.2; break
    default: em = 0                                              // no multiplier: priced below
  }
  let score
  if (em) score = Math.round((em - 1) * 100)
  else {
    // Utility pedals: hand-priced against what they actually do for a strike.
    const UTIL = {
      p1: 30, p2: 8, p3: 14, p4: 26, p5: 30, p6: 8, p7: 16, p8: 20, p10: 18,
      a3: 42, a4: 8, a7: 30, a8: 22, ca2: 34, ca3: 16, wardrums: 90,
      reverbtank: 20, fuzzbox: 26, wahpedal: 14, volumeknob: 18, powerconditioner: 22,
      cabletester: 14, drumthrone: hasDrummer ? 34 : 0, phaserpedal: 24, compressorpedal: 30,
      octavepedal: 30, sustainpedal: 18, looperpedal: 70, bitcrusher: 22, echoplex: 110,
      witchssabbath: 150, theconduit: 140, tabletofazothoth: 90,
    }
    score = UTIL[r.id] !== undefined ? UTIL[r.id] : 12
  }
  if (r.unimplemented) return { score: 0, why: 'UNIMPLEMENTED in App.jsx — does nothing', em: 1 }
  if (owned.includes(r.id)) return { score: 0, why: 'already owned', em: 1 }
  return { score, why, em: +(em || 0).toFixed(2), cost: r.cost, kind: r.kind, name: r.name }
}

// ── recruitScore ───────────────────────────────────────────────────────────
// The old scorer was ATK*3+HP+keyword, which is wrong twice over: drummers do not
// swing at all (App.jsx handleStrike filters role==='Drummer' out of the damage
// sum) so their ATK column is noise, and keyword value is a STEP function of how
// many the band already has (_stackTier: 1 -> 1, 2 -> 2, 3+ -> 4), so the second
// SHREDDER is worth far more than the first.
// cand: {name, atk, hp, role, keyword, tier}   band: same shape, already on stage
const KW_UNIT = { FRENZIED: 7, CORRUPT: 6, SHREDDER: 6, HEXED: 5, DEBUFF: 5, 'FOLK MAGIC': 4, ANCHOR: 3, 'DOUBLE TIME': 3 }
const TIER_BONUS = { demonic: 46, mythic: 26, foil: 12 }
function recruitScore(cand, band) {
  if (!cand) return { score: 0 }
  const alive = (band || []).filter(Boolean)
  const kwCount = {}; alive.forEach(m => { kwCount[m.keyword] = (kwCount[m.keyword] || 0) + (m.tier === 'foil' ? 2 : 1) })
  const roleCount = {}; alive.forEach(m => { roleCount[m.role] = (roleCount[m.role] || 0) + 1 })
  const bandAtk = alive.filter(m => m.role !== 'Drummer').reduce((s, m) => s + (m.atk || 0), 0)
  const reasons = []
  let s = 0

  if (cand.role === 'Drummer') {
    // A drummer contributes ZERO to the damage sum and instead rolls the band-wide
    // DOUBLE TIME d6 (1-2 x1.0, 3-4 x1.5, 5-6 x2.0 → E = x1.5). On a band already
    // swinging for B, that expected +50% is worth ~B/2 of ATK — an order of
    // magnitude more than the 0-1 ATK the old scorer graded him on. A SECOND
    // drummer adds nothing (the game blocks a second DOUBLE TIME anyway).
    if (roleCount.Drummer) { reasons.push('2nd drummer: d6 already covered'); s += 4 }
    else { s += 55 + Math.round(bandAtk * 0.5); reasons.push('first drummer: band-wide d6 E[x1.5]') }
    s += (cand.hp || 0) * 0.6   // he still soaks boss hits
  } else {
    s += (cand.atk || 0) * 3 + (cand.hp || 0) * 0.8
  }

  // Keyword MARGINAL value across the stack-tier step, not a flat weight.
  const kw = cand.keyword
  if (kw) {
    const add = cand.tier === 'foil' ? 2 : 1
    const before = kwCount[kw] || 0
    const t = n => (n >= 3 ? 4 : n === 2 ? 2 : n >= 1 ? 1 : 0)
    const step = t(before + add) - t(before)
    const unit = KW_UNIT[kw] || 3
    s += unit * (1 + step * 3)
    if (step > 0) reasons.push(kw + ' stack ' + before + '->' + (before + add) + ' (tier +' + step + ')')
  }
  // 3+ ANCHOR protects the WHOLE band from one lethal hit each.
  if (kw === 'ANCHOR' && (kwCount.ANCHOR || 0) + 1 >= 3) { s += 22; reasons.push('ANCHOR 3-stack: band-wide save') }
  // MENTOR LINK: a foil/mythic/demonic member placed left of a BASIC member of the
  // SAME ROLE grants stats and a x1.25/x1.5/x2.0 strike multiplier (scanMentorLinks).
  if (cand.tier && cand.tier !== '' && alive.some(m => m.role === cand.role && !m.tier)) {
    const mm = cand.tier === 'demonic' ? 60 : cand.tier === 'mythic' ? 40 : 22
    s += mm; reasons.push('mentor link available with existing ' + cand.role)
  }
  s += TIER_BONUS[cand.tier] || 0
  // Never sign the Devil: 3-member band cap and his death ends the run.
  if (kw === 'FALLEN') return { score: -999, reasons: ['FALLEN: caps the band at 3 and ends the run if he dies'] }
  return { score: Math.round(s), reasons }
}

// ── forgeScore ─────────────────────────────────────────────────────────────
// The Doom Forge only ever offers cards in CARD_UPGRADES, but only NINE of those
// keys change any rule (App.jsx applyCard branches on `upgraded`); the rest are
// gold foil and nothing else, and the tile SAYS SO ("Gold foil. No rules change.").
// The old scorer's hand-written table put four cosmetics in its top five, so most
// forge picks were literally worth zero. Read the tile's own text.
const REAL_UPGRADE_VALUE = {
  soundwall: 96,      // +1 -> +2 ATK permanently to ALL, every copy, forever
  dialtoeleven: 92,   // +3 -> +4 ATK to ALL, 0 embers, 2 copies in Standard
  battlecry: 88,      // +1 -> +2 permanent, 1 ember, FOUR copies in Standard
  heavyriff: 74,      // +2 on top of half-ATK, once per member per fight
  bloodritual: 70,    // 6x -> 8x sacrificed HP
  herbmoney: 52,      // +3 -> +4 permanent, costs 10 stash
  crowdsurf: 50,      // +1 on top of per-card-in-hand
  overdrive: 44,      // corruption gate 60 -> 50
  setlist: 34,        // draw 3 -> 4
}
function forgeScore(cardId, tileText, deckCounts) {
  const cosmetic = /no rules change|gold foil/i.test(String(tileText || ''))
  const real = REAL_UPGRADE_VALUE[cardId]
  if (cosmetic && !real) return { v: 6, real: false }
  if (!real) return { v: cosmetic ? 6 : 20, real: false }
  const copies = (deckCounts && deckCounts[cardId]) || 1
  // Upgrades apply to EVERY copy in the deck, so copies multiply the payoff.
  return { v: Math.round(real * (1 + 0.22 * Math.max(0, copies - 1))), real: true }
}

// ── cardPickScore ──────────────────────────────────────────────────────────
// Booster packs and shop card offers used to be scored by the FORGE table (the
// driver routed 'boosterpick' straight into forgeTick), so a booster pick was
// graded on whether the card happened to be one of eleven hardcoded names. Score
// the card as a deck addition instead: standalone power, chain partners already
// in the deck, and curve.
function cardPickScore(cardId, ctx) {
  const def = DEF[cardId]; if (!def) return { v: 0 }
  const c = ctx || {}
  const deckIds = c.deckIds || []
  const reasons = []
  // Standalone power, on the same ordinal scale the combat policy uses. Reuse the
  // real scorer against a neutral mid-run board so the two agree.
  const board = c.gs || { alive: [{ name: 'x', atk: 8, hp: 9, maxHp: 12, role: 'Lead Guitarist', keyword: 'FRENZIED' }], corruption: 50, embers: 6, handIds: [], cardsPlayedIds: [], handLen: 5, stash: 30, fightIndex: 4, discardsLeft: 2, strikeMult: 1, bossHp: 500, discardLen: 0, hrUsed: new Set() }
  let v = 0
  try { v = scoreCard({ id: cardId }, board, 1, 1) } catch (e) { v = 20 }
  // Chain partners already owned: a live chain is x1.78+ on a whole strike.
  for (const ch of RIFF_CHAINS) {
    const partner = cardId === ch[0] ? ch[1] : cardId === ch[1] ? ch[0] : null
    if (!partner) continue
    if (deckIds.includes(partner)) { v += 28; reasons.push('chain partner ' + partner + ' in deck') }
    else { v += 6 }
  }
  // Curve: a 3-ember card is only castable alongside one other card.
  if ((def.embers || 0) >= 3) v -= 10
  if ((def.embers || 0) === 0) v += 8
  // Dead weight the data files themselves flag.
  if (cardId === 'setlistrewrite') { v = 1; reasons.push('LIVE NO-OP (App.jsx applyCard logs only)') }
  return { v: Math.round(v), reasons }
}

// ── pactScore ──────────────────────────────────────────────────────────────
// Boss pacts are a fixed list of 13 (PACT_REWARDS). The old scorer was a regex
// over the tile text that paid "ember" 60 and "strike" 45, so War Drums (+1 STRIKE
// PER FIGHT — a permanent +25-33% damage for the rest of the run) lost to "+3 max
// HP". Score the actual list.
const PACT_VALUE = {
  war_drums: 100,        // +1 strike/fight forever = +25-33% total damage
  sixth_slot: 88,        // a whole extra member for the rest of the run
  speed_demon: 72,       // +1 card per strike compounds every strike
  ember_surge: 60,       // +1 max ember = one more card per strike
  iron_strings: 55,      // all +1 ATK permanently
  blood_price: 40,       // only if Blood Ritual is in the deck
  dark_bargain: 38,      // all CORRUPT -1 ember
  corruption_engine: 34, // +5% corruption/fight: damage tiers, costs hangover
  clean_living: 32,      // +2 ATK/+2 HP at fight start
  thick_skin: 28,        // all +3 max HP
  merchants_eye: 26,     // 20% off everything
  stone_wall: 24,        // -1 damage per strike
  atonement: 20,         // -15% corruption after a boss
}
const PACT_BY_NORM = {}
for (const k of Object.keys(PACT_VALUE)) PACT_BY_NORM[k.replace(/_/g, '')] = k
function pactScore(text) {
  const n = norm(text)
  for (const key of Object.keys(PACT_BY_NORM)) if (n.includes(key)) {
    const id = PACT_BY_NORM[key]
    return { v: PACT_VALUE[id], id }
  }
  // Unknown tile: fall back to a conservative reading of the text.
  let v = 10
  if (/strikeperfight|strikeperfightpermanently/.test(n)) v = 90
  else if (/bandmemberslot/.test(n)) v = 85
  else if (/extracardperstrike|draw1extra/.test(n)) v = 70
  else if (/maxember/.test(n)) v = 58
  else if (/allatkpermanently|all1atk/.test(n)) v = 52
  else if (/maxhp/.test(n)) v = 26
  return { v, id: null }
}

// ── tripPlan ───────────────────────────────────────────────────────────────
// Trips were a panic button. Two of them are among the biggest multipliers in the
// game and apply to EVERY strike of the fight (App.jsx ~8433: OVERMIND x3.0,
// REALITY GLITCH x2.0 as the STARTING strike multiplier, every strike), so the
// correct line is to open a circle boss with the strongest one held, not to burn
// it surviving a trash fight. Returns {use, which, why}.
//   held: {dmt,acid,shrooms} booleans, ctx: {isBoss, strikeNum, bossPct, overtime,
//   bandHurt, tripUsed, inCombat, strikesLeft}
function tripPlan(held, ctx) {
  const c = ctx || {}
  if (c.tripUsed || !c.inCombat) return { use: false }
  const have = ['dmt', 'acid', 'shrooms'].filter(k => held && held[k])
  if (!have.length) return { use: false }
  // PLANNED: open a circle boss with the best multiplier trip in hand.
  if (c.isBoss && c.strikeNum === 0) {
    const which = held.dmt ? 'dmt' : held.acid ? 'acid' : null
    // Shrooms have no strike-multiplier outcome, so they are NOT worth an opener;
    // they stay in the bag as the panic button they are good at.
    if (which) return { use: true, which, why: 'boss opener (x2.0/x3.0 strike mult applies to EVERY strike)' }
  }
  // EMERGENCY: unchanged doctrine, but shrooms are now preferred so a planned
  // boss opener is not spent saving a trash fight.
  const emergency = c.overtime || c.bandHurt || (c.strikesLeft <= 1 && c.bossPct > 0.35)
  if (emergency && c.strikeNum > 0 && c.bossPct < 0.95) {
    const which = held.shrooms ? 'shrooms' : held.acid ? 'acid' : 'dmt'
    return { use: true, which, why: c.overtime ? 'overtime' : c.bandHurt ? 'band<40%hp' : 'low strikes' }
  }
  return { use: false }
}

// ═══════════════════════════════════════════════════════════════════════════
//  STILL NOT FIXABLE FROM THIS FILE
// ═══════════════════════════════════════════════════════════════════════════
//  * WHEN TO STRIKE is now partly answerable (planStrike returns a card CAP, which
//    is what Solo Sermon / The Blade / Burning Stage actually need), but the driver
//    still strikes unconditionally afterwards. A true answer needs a search over the
//    remaining hand and the boss's telegraphed damage, not a shape enumeration.
//  * BOSS LOOT is applied to damage (App.jsx ~8903) but is NEVER RENDERED during
//    combat, so the bot can only know it owns The Blade from the award popup it read
//    when the boss died. Loot ids captured that way are passed in with the relics.
//  * SHOP / RECRUIT / PACT / FORGE selection all live in autopilot.cjs; this file
//    only supplies the numbers.
module.exports = {
  matchCard, isAmbiguous, scoreCard, pickTarget, ALL_CARDS, RIFF_CHAINS, MUSICIANS, bestOrder,
  // Aug 4 2026 additions (purely additive — combat scoring above is untouched):
  RELIC_DEF, matchRelic, relicDef, planStrike, relicCardBonus, relicBuyScore,
  recruitScore, forgeScore, cardPickScore, pactScore, tripPlan, shapeMult, ownedShapeRelics,
}
