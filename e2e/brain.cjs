// e2e/brain.cjs — EXPERT COMBAT BRAIN, ported from vestibule-sim-kwstacks.js
// scoreCard() logic copied from the sim's validated expert policy (the one that wins
// ~40% of Bronze/Standard runs). Card knowledge: e2e/carddata.json (82 cards, 16 chains).
const { cards: ALL_CARDS, chains: RIFF_CHAINS, musicians: MUSICIANS } = require('./carddata.json')

// ---- name matching: screen shows "ChainRareStage Dive" etc — strip badges, fuzzy match
const norm = s => (s || '').toLowerCase().replace(/[^a-z]/g, '')
const BADGES = /^(chain|rare|novice|foil|mythic|adept|master|legendary|need|new)+/
const BY_NORM = {}
for (const c of ALL_CARDS) BY_NORM[norm(c.name)] = c
function matchCard(screenName) {
  let n = norm(screenName)
  if (BY_NORM[n]) return BY_NORM[n]
  const stripped = n.replace(BADGES, '')
  if (BY_NORM[stripped]) return BY_NORM[stripped]
  for (const key in BY_NORM) if (stripped.endsWith(key) || key.endsWith(stripped)) return BY_NORM[key]
  return null
}

// ---- gs-lite: assembled each strike from the live screen by autopilot
// { alive:[{name,atk,hp,maxHp}], corruption, stash, embers, handIds, handLen,
//   discardsLeft, strikeMult, cardsPlayedIds, firedChains:Set, discardLen, fightIndex, bossHp }

function scoreCard(card, gs, strikeNum, cardsPlayed) {
  let base = scoreBase(card, gs, strikeNum, cardsPlayed)
  const played = gs.cardsPlayedIds || []
  for (const ch of RIFF_CHAINS) { // completing a chain: +40
    const ck = ch[0] + '+' + ch[1]
    if (gs.firedChains.has(ck)) continue
    if ((card.id === ch[0] && played.includes(ch[1])) || (card.id === ch[1] && played.includes(ch[0]))) { base += 40; break }
  }
  for (const ch of RIFF_CHAINS) { // chain partner in hand: +15
    const ck = ch[0] + '+' + ch[1]
    if (gs.firedChains.has(ck)) continue
    const partner = card.id === ch[0] ? ch[1] : card.id === ch[1] ? ch[0] : null
    if (partner && gs.handIds.includes(partner)) { base += 15; break }
  }
  return base
}

function scoreBase(card, gs, strikeNum, cardsPlayed) {
  const alive = gs.alive; if (!alive.length) return 0
  const corruption = gs.corruption, stash = gs.stash, embers = gs.embers
  const highestAtk = Math.max(...alive.map(m => m.atk))
  const lowestHp = alive.reduce((a, b) => a.hp < b.hp ? a : b)
  const anyHurt = alive.some(m => m.hp < (m.maxHp || m.hp) * 0.5)
  const handLen = gs.handLen
  switch (card.id) {
    case 'possessedperf': return 95; case 'overdrive': return corruption >= 60 ? 92 : 10; case 'infencore': return 88
    case 'stagedive': return Math.max(...alive.map(m => m.hp)) >= 8 ? 82 : 50
    case 'amp': return 72 + (highestAtk > 4 ? 10 : 0); case 'encore': return 70 + (highestAtk > 5 ? 10 : 0); case 'newstrings': return 67; case 'battlecry': return 62
    case 'powertap': return embers <= 2 ? 84 : 38; case 'staticcharge': return embers <= 2 ? (corruption === 0 ? 86 : 80) : 33
    case 'tappedout': return strikeNum < 3 ? 78 : 18; case 'ampoverload': return (gs.discardsLeft > 0 && embers <= 2) ? 81 : 5
    case 'groupie': return embers <= 3 ? 62 : 28
    case 'soundboard': return embers <= 3 ? 60 : 28; case 'setbreak': return embers <= 2 ? 52 : 14
    case 'soundwall': return 70
    // Heavy Riff is ONCE PER MEMBER PER FIGHT — the live game hard-rejects a
    // repeat on the same member (App.jsx `if(m._hrUsed) return false`). The bot
    // used to re-offer it and burn its failStreak. Match the sim: if every alive
    // member has already ridden it, score below the stop rule.
    case 'heavyriff': {
      const used = gs.hrUsed || new Set()
      const fresh = alive.filter(m => !used.has(m.name))
      if (!fresh.length) return 3
      return Math.max(...fresh.map(m => m.atk)) >= 6 ? 78 : 55
    }
    case 'crowdsurf': return handLen >= 5 ? 74 : handLen >= 3 ? 55 : 30
    case 'deathriff': return corruption < 50 ? 52 : 18; case 'feedbackloop': return corruption >= 40 ? 57 : 18
    case 'herbmoney': return stash >= 10 ? 65 : 0; case 'goingbroke': return stash >= 50 ? 62 : 5
    case 'resonancecard': return highestAtk >= 5 ? 54 : 24; case 'ampstatic': return corruption >= 30 ? 50 : 10
    case 'doubledown': return cardsPlayed === 0 && embers >= 3 ? 74 : 28
    case 'distortion': return 57; case 'dialtoeleven': return corruption < 50 ? 44 : 14
    case 'controlfeedback': { const r = lowestHp.hp / (lowestHp.maxHp || lowestHp.hp); if (r < 0.3) return 75; if (r < 0.5 && corruption >= 50) return 60; if (corruption >= 70) return 55; if (corruption >= 40) return 40; return 15 }
    case 'sigdecay': return handLen >= 4 ? 48 : 20
    case 'darktuning': return corruption >= 70 ? 68 : corruption >= 40 ? 55 : 10; case 'sabbathsigil': return gs.fightIndex >= 18 ? 37 : 10
    case 'soundcheck': return anyHurt ? 58 : 30; case 'roadie': return alive.some(m => m.hp <= 3) ? 55 : 20
    case 'wakeup': return gs.anyStoned ? 90 : anyHurt ? 30 : 8
    case 'setlist': return handLen <= 4 ? 47 : 18
    case 'seance': return corruption >= 50 ? 55 : 35
    case 'demotape': return cardsPlayed > 0 ? 52 : 0; case 'burnset': return handLen >= 5 ? 42 : 15
    case 'remaster': return handLen >= 4 ? 44 : 10
    case 'moshpit': { const n = alive.length; return n >= 4 ? 74 : n >= 3 ? 60 : 38 }
    case 'bloodritual': { const hp = alive.reduce((a, b) => a.hp > b.hp ? a : b).hp; return hp >= 8 ? 58 : 30 }
    case 'echopedal': return cardsPlayed > 0 ? 75 : 0; case 'loopstation': return cardsPlayed >= 2 ? 85 : 0; case 'riffthief': return cardsPlayed > 0 ? 70 : 0
    case 'feedbackscream': return 65; case 'skullsplitter': return highestAtk >= 10 ? 80 : 62
    case 'doomchord': return corruption >= 50 ? 78 : 55; case 'bloodharmony': return 52; case 'sonicboom': return 72
    case 'tremolopick': return cardsPlayed >= 3 ? 70 : 35; case 'powerslide': return 45
    case 'shredsolo': return highestAtk >= 8 ? 80 : 50
    case 'harmonicfb': return (gs.cardsPlayedIds || []).filter(x => { const c = ALL_CARDS.find(k => k.id === x); return c && c.type === 'RIFF' }).length >= 3 ? 78 : 25
    case 'overdriveped': return gs.strikeMult >= 1.5 ? 85 : 55; case 'devilsdice': return 55
    case 'necroticamp': return corruption >= 60 ? 85 : corruption >= 40 ? 60 : 20
    case 'soulbargain': return 72; case 'venomriff': return 60; case 'offeringpit': return alive.length >= 4 ? 65 : 20
    case 'cursedstrings': return 55; case 'graverobber': return gs.discardLen >= 4 ? 62 : 20
    case 'hexdecay': return gs.bossHp >= 500 ? 75 : 45
    case 'infernalpact': return corruption < 50 ? 65 : 10; case 'carrioncall': return gs.anyStoned ? 90 : 0
    case 'possessionriff': return 78; case 'darkcrescendo': return corruption >= 80 ? 98 : 0
    case 'hellfirerift': return corruption < 80 ? 90 : 60; case 'soulsacrifice': return 85; case 'voidpact': return corruption < 75 ? 95 : 50
    case 'russianroulette': return alive.length >= 4 ? 60 : 30; case 'gearcheck': return 48; case 'setlistrewrite': return 30
    case 'backstagepass': return embers >= 2 ? 65 : 30; case 'venueswap': return handLen <= 3 ? 60 : 20; case 'doublebooking': return 92
    case 'bootlegcopy': return 55; case 'secondwind': return embers === 0 ? 90 : embers <= 2 ? 50 : 10; case 'pyromaniac': return embers <= 2 ? 68 : 25
    case 'slowburn': return strikeNum === 0 ? 65 : 30; case 'ampfeedback': return embers <= 2 ? 70 : 30
    case 'drainthecrowd': return embers <= 2 ? 65 : 20; case 'corrsiphon': return embers <= 2 && corruption < 60 ? 72 : 15
    // ── Aug 1 2026: FREE power cards. These were falling through to default:5,
    // which put them below the discard-junk threshold — the ledger caught the bot
    // literally DISCARDING Dark Whisper and Blood Price to dig for something
    // "better". They cost ZERO embers; a 1000-hour player plays them on sight.
    case 'madnesscard': return 96   // 15% of boss MAX HP, direct, free — best tempo card in the game
    case 'hungercard': return 80    // all +1 ATK and draw 2, free
    case 'whispercard': return 74   // +2 ATK permanent, free
    case 'blood_price': return 78   // corruption gift: +4 ATK permanent, free
    case 'dark_whisper': return 70  // corruption gift: +2 ATK permanent, free
    case 'void_pact': return 72     // corruption gift: all +2 ATK this strike, free
    case 'contract': return alive.length > 2 ? 30 : 0 // Record Deal: only with members to spare
    default: return 5
  }
}

// targeting doctrine from applyCardSim: most single-target effects want the carry
// (highest ATK); protection/heal singles want the weakest.
// Aug 1 2026 REWRITE. The old rule was "everything at the highest-ATK member
// except Roadie", which produced provable misplays:
//   resonancecard sets target ATK = highest ATK on stage -> aiming it at the
//     member who ALREADY has the highest ATK is a guaranteed no-op.
//   stagedive deals damage EQUAL TO TARGET HP -> wants the tankiest, not the carry.
//   controlfeedback fully heals -> wants the most injured, not a healthy carry.
//   bloodritual trades 25% of target HP for 6x damage -> wants the highest HP.
//   offeringpit makes the target SKIP ITS NEXT ATTACK -> never the carry.
//   carrioncall needs a Too Stoned member to work at all.
const HIGHEST_HP = new Set(['stagedive', 'bloodritual'])
const LOWEST_ATK = new Set(['resonancecard', 'offeringpit'])
const MOST_INJURED = new Set(['roadie', 'controlfeedback', 'soundcheck'])
const STONED_TARGET = new Set(['carrioncall', 'wakeup'])
const LOWEST_VALUE = new Set(['russianroulette'])
function pickTarget(card, alive, opts) {
  if (!alive || !alive.length) return null
  const by = (f, best) => alive.reduce((a, b) => (best(f(b), f(a)) ? b : a))
  const lower = (x, y) => x < y, higher = (x, y) => x > y
  const id = card.id
  if (STONED_TARGET.has(id)) {
    const stoned = (opts && opts.allMembers ? opts.allMembers : alive).filter(m => m.tooStoned)
    if (stoned.length) return stoned[0]
  }
  // Heavy Riff: strongest member who has NOT already used it this fight
  if (id === 'heavyriff') {
    const used = (opts && opts.hrUsed) || new Set()
    const fresh = alive.filter(m => !used.has(m.name))
    return (fresh.length ? fresh : alive).reduce((a, b) => b.atk > a.atk ? b : a)
  }
  if (HIGHEST_HP.has(id)) return by(m => m.hp, higher)
  if (LOWEST_ATK.has(id)) return by(m => m.atk, lower)
  if (MOST_INJURED.has(id)) return by(m => m.hp / Math.max(1, m.maxHp || m.hp), lower)
  if (LOWEST_VALUE.has(id)) return by(m => m.atk * 3 + m.hp, lower)
  return by(m => m.atk, higher) // default: the carry
}

// ---- aura-aware stage ordering (ported from sim improveOrdering/auraStaticScore)
const KW_BY_NAME = {}
for (const m of MUSICIANS) KW_BY_NAME[m.name.toLowerCase()] = m.keyword
function auraStaticScore(order) { // order: [{keyword}]
  let s = 0
  for (let i = 0; i < order.length; i++) {
    for (const j of [i - 1, i + 1]) {
      const n = order[j]; if (!n) continue
      switch (n.keyword) {
        case 'FRENZIED': case 'DEBUFF': case 'DOUBLE TIME': s += 3; break
        case 'ANCHOR': case 'FOLK MAGIC': s += 2; break
        case 'CORRUPT': case 'HEXED': case 'SHREDDER': s += 1.5; break
      }
    }
  }
  return s
}
function bestOrder(names) { // names in current stage order -> improved name order
  const order = names.map(n => ({ name: n, keyword: KW_BY_NAME[n.toLowerCase()] || '' }))
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

module.exports = { matchCard, scoreCard, pickTarget, ALL_CARDS, RIFF_CHAINS, MUSICIANS, bestOrder }
