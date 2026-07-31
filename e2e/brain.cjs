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
    case 'heavyriff': return highestAtk >= 6 ? 78 : 55
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
    default: return 5
  }
}

// targeting doctrine from applyCardSim: most single-target effects want the carry
// (highest ATK); protection/heal singles want the weakest.
const WEAKEST_TARGET = new Set(['roadie'])
function pickTarget(card, alive) {
  if (WEAKEST_TARGET.has(card.id)) return alive.reduce((a, b) => a.hp < b.hp ? a : b)
  return alive.reduce((a, b) => a.atk > b.atk ? a : b) // carry
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
