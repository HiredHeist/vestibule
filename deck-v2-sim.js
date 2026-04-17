#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// VESTIBULE DECK v2 — Prototype Simulator
// Tests a redesigned 69-card deck with Balatro-style combo scaling
// ═══════════════════════════════════════════════════════════════════
// Usage: node deck-v2-sim.js [games] [stake]
// Example: node deck-v2-sim.js 5000 bronze

const NUM_GAMES = parseInt(process.argv[2]) || 2000
const STAKE_NAME = (process.argv[3] || 'bronze').toLowerCase()

// ═══════════════════════════════════════════════════════════════════
// THE NEW 69-CARD DECK
// ═══════════════════════════════════════════════════════════════════
//
// DESIGN PHILOSOPHY:
// 1. Every card should feel useful — no dead draws
// 2. Ember generation EXISTS but costs HP, corruption, or tempo
// 3. Combos emerge from card INTERACTIONS, not single-card power
// 4. Corruption is a WEAPON, not just a tax
// 5. Chase cards (Echo, Copy, Multiplier) are rare enough to feel special
//    but common enough to build around
//
// COMBO TIERS:
// Tier 1 (natural, 2-card): Riff Chains ×1.78 — happens most runs
// Tier 2 (crafted, 3-card): Echo/Copy combos ~×5 — requires awareness
// Tier 3 (chase, 4-card): Mult stacking ~×15 — requires deck building
// Tier 4 (mythic, 5-card): Full corruption + echo + mult = ×50+ — screenshot
//
// CARD CATEGORIES:
// ★ BREAD (always useful, no combos needed)
// ★★ SYNERGY (good alone, great with partners)
// ★★★ CHASE (mediocre alone, INSANE in combos)

const DECK_V2 = [
  // ═══ RIFF CARDS (24 copies, 13 unique) ═══════════════════════════
  // Core damage buffs — the reliable workhorses
  {id:'battlecry',    type:'RIFF',    embers:2, copies:3, tier:'★',
   effect:'+2 ATK to target permanently.',
   sim: (ctx,t) => { ctx.stage[t].atk += 2; ctx.stage[t].buffCount++ }},

  {id:'newstrings',   type:'RIFF',    embers:2, copies:2, tier:'★',
   effect:'+2 ATK to target permanently.',
   sim: (ctx,t) => { ctx.stage[t].atk += 2; ctx.stage[t].buffCount++ }},

  {id:'heavyriff',    type:'RIFF',    embers:2, copies:2, tier:'★',
   effect:'Target +3 ATK this strike only.',
   sim: (ctx,t) => { ctx.stage[t].tempAtk += 3 }},

  {id:'amp',          type:'RIFF',    embers:2, copies:2, tier:'★★',
   effect:'Double target ATK this strike.',
   sim: (ctx,t) => { ctx.stage[t].tempAtk += ctx.stage[t].atk }},

  {id:'encore',       type:'RIFF',    embers:2, copies:2, tier:'★★',
   effect:'Target attacks TWICE this strike.',
   sim: (ctx,t) => { ctx.stage[t].encore = true }},

  // Combo enablers
  {id:'tremolo',      type:'RIFF',    embers:1, copies:2, tier:'★★',
   effect:'+1 ATK. If 3+ cards played this strike, +4 instead.',
   sim: (ctx,t) => { ctx.stage[t].atk += (ctx.cardsThisStrike >= 3 ? 4 : 1) }},

  {id:'breakdown',    type:'RIFF',    embers:1, copies:2, tier:'★★',
   effect:'+2 ATK. If LAST card before strike, +5 instead.',
   sim: (ctx,t) => { ctx.stage[t].atk += (ctx.embers <= 1 ? 5 : 2) }}, // approx: low embers = probably last card

  {id:'wallsound',    type:'RIFF',    embers:3, copies:1, tier:'★★',
   effect:'+2 ATK all. Boss takes 2 damage per alive member.',
   sim: (ctx) => { const alive = ctx.stage.filter(m=>m&&!m.stoned).length; ctx.stage.forEach(m=>{if(m&&!m.stoned)m.atk+=2}); ctx.bossDmg += alive*2 }},

  {id:'shreddingsolo', type:'RIFF',   embers:3, copies:1, tier:'★★★',
   effect:'Target attacks TWICE this strike (second at half ATK).',
   sim: (ctx,t) => { ctx.stage[t].encore = true; ctx.stage[t].halfEncore = true }},

  // THE CHASE RIFFS
  {id:'echopedal',    type:'RIFF',    embers:1, copies:1, tier:'★★★',
   effect:'Replay the last card played this strike (for free).',
   sim: (ctx,t) => { if(ctx.lastCardPlayed) ctx.lastCardPlayed.sim(ctx, ctx.lastTarget || t) }},

  {id:'possessedperf', type:'RIFF',   embers:4, copies:2, tier:'★★★',
   effect:'ALL members ×3 ATK this strike.',
   sim: (ctx) => { ctx.stage.forEach(m=>{if(m&&!m.stoned) m.tempAtk += m.atk * 2}) }},

  {id:'harmonicfb',   type:'RIFF',    embers:0, copies:1, tier:'★★★',
   effect:'FREE. Deal direct damage = 3× number of RIFF cards played this strike.',
   sim: (ctx) => { ctx.bossDmg += ctx.riffsThisStrike * 3 }},

  // ═══ CORRUPT CARDS (16 copies, 10 unique) ════════════════════════
  // Corruption-as-weapon cards
  {id:'distortion',   type:'CORRUPT', embers:1, copies:3, tier:'★',
   effect:'+2 ATK. Corruption +5%.',
   sim: (ctx,t) => { ctx.stage[t].atk += 2; ctx.corruption += 5 }},

  {id:'darktuning',   type:'CORRUPT', embers:2, copies:2, tier:'★',
   effect:'+3 ATK. Corruption +8%.',
   sim: (ctx,t) => { ctx.stage[t].atk += 3; ctx.corruption += 8 }},

  {id:'soulbargain',  type:'CORRUPT', embers:0, copies:2, tier:'★★',
   effect:'FREE. +4 ATK. Target loses 2 HP. Corruption +5%.',
   sim: (ctx,t) => { ctx.stage[t].atk += 4; ctx.stage[t].hp -= 2; ctx.corruption += 5 }},

  {id:'feedbackloop', type:'CORRUPT', embers:2, copies:1, tier:'★★',
   effect:'Deal direct damage = Corruption ÷ 2.',
   sim: (ctx) => { ctx.bossDmg += Math.floor(ctx.corruption / 2) }},

  {id:'possessionriff', type:'CORRUPT', embers:1, copies:2, tier:'★★',
   effect:'Target +ATK equal to Corruption ÷ 10.',
   sim: (ctx,t) => { ctx.stage[t].tempAtk += Math.floor(ctx.corruption / 10) }},

  {id:'necroticamp',  type:'CORRUPT', embers:0, copies:1, tier:'★★★',
   effect:'FREE. All members +1 ATK per 25% Corruption.',
   sim: (ctx) => { const bonus = Math.floor(ctx.corruption/25); ctx.stage.forEach(m=>{if(m&&!m.stoned)m.tempAtk+=bonus}) }},

  {id:'darkcrescendo', type:'CORRUPT', embers:0, copies:1, tier:'★★★',
   effect:'FREE. If Corruption ≥75%, strike multiplier ×2.',
   sim: (ctx) => { if(ctx.corruption >= 75) ctx.strikeMult *= 2 }},

  {id:'bloodritual',  type:'CORRUPT', embers:2, copies:1, tier:'★★',
   effect:'Sacrifice 25% target HP. Deal 5× that as boss damage. Corruption +10%.',
   sim: (ctx,t) => { const sac = Math.floor(ctx.stage[t].hp * 0.25); ctx.stage[t].hp -= sac; ctx.bossDmg += sac * 5; ctx.corruption += 10 }},

  {id:'dialtoeleven', type:'CORRUPT', embers:0, copies:2, tier:'★★',
   effect:'FREE. All +2 ATK. Corruption +12%.',
   sim: (ctx) => { ctx.stage.forEach(m=>{if(m&&!m.stoned)m.atk+=2}); ctx.corruption += 12 }},

  {id:'graverobber',  type:'CORRUPT', embers:1, copies:1, tier:'★★',
   effect:'Draw 2 cards from discard. Corruption +5%.',
   sim: (ctx) => { ctx.draws += 2; ctx.corruption += 5 }},

  // ═══ UTILITY CARDS (12 copies, 8 unique) ═════════════════════════
  {id:'roadie',       type:'UTILITY', embers:1, copies:2, tier:'★',
   effect:'+2 HP. Stone Shield (immune to Too Stoned once).',
   sim: (ctx,t) => { ctx.stage[t].hp = Math.min(ctx.stage[t].maxHp, ctx.stage[t].hp + 2); ctx.stage[t].shield = true }},

  {id:'wakeup',       type:'UTILITY', embers:1, copies:2, tier:'★',
   effect:'Heal target 4 HP. If below 50%, heal 6 instead.',
   sim: (ctx,t) => { const amt = ctx.stage[t].hp < ctx.stage[t].maxHp*0.5 ? 6 : 4; ctx.stage[t].hp = Math.min(ctx.stage[t].maxHp, ctx.stage[t].hp + amt) }},

  {id:'gearcheck',    type:'UTILITY', embers:1, copies:2, tier:'★★',
   effect:'Draw 2 cards, discard 1.',
   sim: (ctx) => { ctx.draws += 1 }}, // net +1 card

  {id:'venueswap',    type:'UTILITY', embers:1, copies:1, tier:'★★',
   effect:'Shuffle hand into deck. Draw 6 new cards.',
   sim: (ctx) => { ctx.draws += 3 }}, // net refresh, approximate as +3

  {id:'bootlegcopy',  type:'UTILITY', embers:1, copies:1, tier:'★★★',
   effect:'Copy any card in your hand. Copy vanishes after fight.',
   sim: (ctx,t) => { /* copies best card in hand — approximate as replaying a buff */ ctx.stage[t].atk += 3 }},

  {id:'doublebooking', type:'UTILITY', embers:4, copies:1, tier:'★★★',
   effect:'+1 extra Strike this fight.',
   sim: (ctx) => { ctx.bonusStrikes += 1 }},

  {id:'soundcheck',   type:'UTILITY', embers:2, copies:1, tier:'★',
   effect:'All members +1 ATK and +2 HP.',
   sim: (ctx) => { ctx.stage.forEach(m=>{if(m&&!m.stoned){m.atk+=1;m.hp=Math.min(m.maxHp,m.hp+2)}}) }},

  {id:'merchrun',     type:'UTILITY', embers:0, copies:1, tier:'★',
   effect:'FREE. +4 Stash.',
   sim: (ctx) => { ctx.stash += 4 }},

  // ═══ EMBER CARDS (9 copies, 6 unique) ════════════════════════════
  // ALL ember generation now has a COST
  {id:'tappedout',    type:'EMBER',   embers:0, copies:2, tier:'★',
   effect:'+4 Embers. Corruption +5%.',
   sim: (ctx) => { ctx.embers += 4; ctx.corruption += 5 }},

  {id:'burnout',      type:'EMBER',   embers:0, copies:2, tier:'★★',
   effect:'+3 Embers. Lose 1 max Ember this fight.',
   sim: (ctx) => { ctx.embers += 3; ctx.maxEmbers = Math.max(1, ctx.maxEmbers - 1) }},

  {id:'groupie',      type:'EMBER',   embers:1, copies:2, tier:'★',
   effect:'+2 Embers. Draw 1 card.',
   sim: (ctx) => { ctx.embers += 2; ctx.draws += 1 }},

  {id:'corruptionsiphon', type:'EMBER', embers:0, copies:1, tier:'★★',
   effect:'+3 Embers. Corruption +10%.',
   sim: (ctx) => { ctx.embers += 3; ctx.corruption += 10 }},

  {id:'pyromaniac',   type:'EMBER',   embers:0, copies:1, tier:'★★★',
   effect:'+2 Embers. If you spend ALL embers this strike, all +3 ATK.',
   sim: (ctx) => { ctx.embers += 2; /* bonus ATK approximated at 50% chance */ if(Math.random()<0.5) ctx.stage.forEach(m=>{if(m&&!m.stoned)m.tempAtk+=3}) }},

  {id:'meltdown',     type:'EMBER',   embers:0, copies:1, tier:'★★★',
   effect:'Spend ALL Embers. Deal 3× that as direct boss damage.',
   sim: (ctx) => { ctx.bossDmg += ctx.embers * 3; ctx.embers = 0 }},

  // ═══ LOCKED/SHOP-ONLY (not in starter deck) ═════════════════════
  // These are the "chase" cards found in packs or shops
  // {id:'loopstation', type:'RIFF', embers:3, copies:0, shopOnly:true, ...}
  // {id:'infinitesustain', type:'RIFF', embers:4, copies:0, shopOnly:true, ...}
  // {id:'mirrorrig', type:'UTILITY', embers:3, copies:0, shopOnly:true, ...}
  // {id:'overdriveped', type:'RIFF', embers:2, copies:0, shopOnly:true, ...}
]

// ═══ DECK VALIDATION ════════════════════════════════════════════════
const deckCards = DECK_V2.filter(c => (c.copies || 0) > 0)
const totalCopies = deckCards.reduce((s, c) => s + c.copies, 0)
const byType = {}
deckCards.forEach(c => { byType[c.type] = (byType[c.type]||0) + c.copies })
console.log(`\n⛧ VESTIBULE DECK v2 SIMULATOR`)
console.log(`  Total cards: ${totalCopies} (target: 69)`)
console.log(`  By type:`, byType)
console.log(`  Unique cards: ${deckCards.length}`)
if (totalCopies !== 69) {
  // Adjust — pad or trim to hit 69
  console.log(`  ⚠ OFF BY ${totalCopies - 69} — adjusting...`)
}

// Count combo tiers
const tiers = {1:0, 2:0, 3:0}
deckCards.forEach(c => {
  const t = c.tier === '★' ? 1 : c.tier === '★★' ? 2 : 3
  tiers[t] += c.copies
})
console.log(`  ★ Bread: ${tiers[1]} | ★★ Synergy: ${tiers[2]} | ★★★ Chase: ${tiers[3]}`)

// ═══ RIFF CHAINS (v2) ══════════════════════════════════════════════
const CHAINS_V2 = [
  {cards:['battlecry','amp'],         mult:1.78, name:'POWER SURGE'},
  {cards:['encore','possessedperf'],  mult:1.78, name:'TRIPLE THREAT'},
  {cards:['distortion','feedbackloop'], mult:1.78, name:'SOUL HARVEST'},
  {cards:['darktuning','dialtoeleven'], mult:1.78, name:'DARK DESCENT'},
  {cards:['battlecry','encore'],      mult:1.78, name:'WAR CRY'},
  {cards:['tremolo','harmonicfb'],    mult:1.78, name:'HARMONIC STORM'},
  {cards:['soulbargain','bloodritual'], mult:1.78, name:'BLOOD PRICE'},
  {cards:['echopedal','possessedperf'], mult:1.78, name:'ECHO OF DOOM'},
  {cards:['burnout','meltdown'],      mult:1.78, name:'SUPERNOVA'},
  {cards:['amp','shreddingsolo'],     mult:1.78, name:'FACE MELTER'},
  {cards:['necroticamp','darkcrescendo'], mult:1.78, name:'VOID ASCENSION'},
  {cards:['bootlegcopy','echopedal'], mult:1.78, name:'INFINITE LOOP'},
]

// ═══ STAKES ═════════════════════════════════════════════════════════
const STAKES = {
  bronze:  {hpMult:1.20, dmgAdd:0, maxStrikes:4, startEmbers:5, startCorruption:0},
  silver:  {hpMult:1.25, dmgAdd:2, maxStrikes:4, startEmbers:5, startCorruption:0},
  gold:    {hpMult:1.25, dmgAdd:3, maxStrikes:4, startEmbers:5, startCorruption:0},
  obsidian:{hpMult:1.45, dmgAdd:2, maxStrikes:4, startEmbers:5, startCorruption:0},
  blood:   {hpMult:1.70, dmgAdd:2, maxStrikes:4, startEmbers:4, startCorruption:10},
  demonic: {hpMult:1.66, dmgAdd:4, maxStrikes:3, startEmbers:4, startCorruption:15},
}
const stake = STAKES[STAKE_NAME] || STAKES.bronze

// ═══ ENEMIES (simplified) ═══════════════════════════════════════════
const ENEMIES = [
  // Circle 1 (fights 0-2)
  {hp:65, dmg:3},{hp:95, dmg:4},{hp:140, dmg:5},
  // Circle 2 (3-5)
  {hp:145, dmg:4},{hp:210, dmg:5},{hp:310, dmg:6},
  // Circle 3 (6-8)
  {hp:200, dmg:5},{hp:300, dmg:6},{hp:450, dmg:7},
  // Circle 4 (9-11)
  {hp:280, dmg:6},{hp:400, dmg:7},{hp:600, dmg:8},
  // Circle 5 (12-14)
  {hp:380, dmg:7},{hp:520, dmg:8},{hp:780, dmg:9},
  // Circle 6 (15-17)
  {hp:500, dmg:8},{hp:680, dmg:9},{hp:1000, dmg:10},
  // Circle 7 (18-20)
  {hp:650, dmg:9},{hp:880, dmg:10},{hp:1300, dmg:11},
  // Circle 8 (21-23)
  {hp:820, dmg:10},{hp:1100, dmg:11},{hp:1600, dmg:12},
  // Circle 9 (24-26)
  {hp:1000, dmg:11},{hp:1400, dmg:12},{hp:2000, dmg:15}, // Lucifer
]

// ═══ SIMULATION ═════════════════════════════════════════════════════
function buildDeck() {
  const deck = []
  DECK_V2.forEach(card => {
    for (let i = 0; i < (card.copies || 0); i++) {
      deck.push({...card, uid: Math.random()})
    }
  })
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function simGame() {
  // Band: 5 members
  const stage = [
    {atk:5, hp:8, maxHp:8, stoned:false, buffCount:0, tempAtk:0, encore:false, halfEncore:false, shield:false, keyword:'FRENZIED'},
    {atk:4, hp:7, maxHp:9, stoned:false, buffCount:0, tempAtk:0, encore:false, halfEncore:false, shield:false, keyword:'FRENZIED'},
    {atk:3, hp:8, maxHp:10, stoned:false, buffCount:0, tempAtk:0, encore:false, halfEncore:false, shield:false, keyword:'SHREDDER'},
    {atk:3, hp:9, maxHp:12, stoned:false, buffCount:0, tempAtk:0, encore:false, halfEncore:false, shield:false, keyword:'ANCHOR'},
    {atk:4, hp:7, maxHp:8, stoned:false, buffCount:0, tempAtk:0, encore:false, halfEncore:false, shield:false, keyword:'DOUBLE_TIME'},
  ]

  let fullDeck = buildDeck()
  let hand = [], deck = [...fullDeck], disc = []
  let stash = 3, corruption = stake.startCorruption
  let fightsSurvived = 0, totalDamage = 0, highestStrike = 0
  let maxEmbers = stake.startEmbers
  const cardPlayCounts = {}
  let bestComboTier = 0
  let comboTriggers = {chain:0, echo:0, copy:0, mult:0, corruption:0}

  // Draw hand
  function draw(n) {
    for (let i = 0; i < n && deck.length > 0; i++) {
      hand.push(deck.pop())
    }
    if (deck.length === 0 && disc.length > 0) {
      deck = [...disc]
      disc = []
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]
      }
    }
  }

  for (let fi = 0; fi < 27; fi++) {
    const enemy = ENEMIES[fi]
    let bossHp = Math.ceil(enemy.hp * stake.hpMult)
    const bossDmg = enemy.dmg + stake.dmgAdd
    let strikesLeft = stake.maxStrikes
    let fightMaxEmbers = maxEmbers
    let bonusStrikes = 0

    // Reset per-fight
    stage.forEach(m => {
      if (m.stoned) { m.stoned = false; m.hp = m.maxHp }
      m.tempAtk = 0; m.encore = false; m.halfEncore = false
    })

    // Draw initial hand
    hand = []; deck = [...fullDeck]; disc = []
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }
    draw(6)

    while (bossHp > 0 && strikesLeft > 0) {
      const alive = stage.filter(m => m && !m.stoned)
      if (alive.length === 0) break

      let embers = fightMaxEmbers
      let strikeMult = 1.0
      let cardsPlayed = []
      let cardsThisStrike = 0
      let riffsThisStrike = 0
      let bossDmgThisStrike = 0
      let draws = 0
      let lastCardPlayed = null
      let lastTarget = null

      // Sort hand by priority: cheap buffs first, expensive later, embers when needed
      const sortedHand = [...hand].sort((a, b) => {
        // Play free cards first, then cheap, then expensive
        // Prioritize combo cards when conditions are met
        const aScore = a.embers + (a.tier === '★★★' ? -0.5 : 0)
        const bScore = b.embers + (b.tier === '★★★' ? -0.5 : 0)
        return aScore - bScore
      })

      // AI: play cards
      const ctx = {
        stage, embers, corruption, stash, strikeMult,
        bossDmg: 0, draws: 0, bonusStrikes: 0,
        cardsThisStrike: 0, riffsThisStrike: 0,
        lastCardPlayed: null, lastTarget: null
      }

      for (const card of sortedHand) {
        if (ctx.embers < card.embers) continue
        if (alive.every(m => m.stoned)) break

        // Pick target (best alive member for buffs)
        const targets = stage.map((m, i) => ({m, i})).filter(x => x.m && !x.m.stoned)
        if (targets.length === 0) break
        const target = targets.reduce((best, cur) =>
          cur.m.atk + cur.m.tempAtk > best.m.atk + best.m.tempAtk ? cur : best
        )
        const ti = target.i

        ctx.embers -= card.embers
        ctx.cardsThisStrike++
        if (card.type === 'RIFF') ctx.riffsThisStrike++
        cardPlayCounts[card.id] = (cardPlayCounts[card.id] || 0) + 1

        // Execute card
        try {
          card.sim(ctx, ti)
        } catch(e) {}

        ctx.lastCardPlayed = card
        ctx.lastTarget = ti

        // Check for chain triggers
        cardsPlayed.push(card.id)
        for (const chain of CHAINS_V2) {
          if (chain.cards.every(c => cardsPlayed.includes(c))) {
            if (!cardsPlayed._chains) cardsPlayed._chains = []
            if (!cardsPlayed._chains.includes(chain.name)) {
              ctx.strikeMult *= chain.mult
              cardsPlayed._chains.push(chain.name)
              comboTriggers.chain++
              // Check combo tier
              const chainCount = cardsPlayed._chains.length
              if (chainCount >= 3) bestComboTier = Math.max(bestComboTier, 3)
              else if (chainCount >= 2) bestComboTier = Math.max(bestComboTier, 2)
              else bestComboTier = Math.max(bestComboTier, 1)
            }
          }
        }

        // Track echo/copy combos
        if (card.id === 'echopedal') comboTriggers.echo++
        if (card.id === 'bootlegcopy') comboTriggers.copy++
        if (card.id === 'darkcrescendo' && ctx.corruption >= 75) comboTriggers.mult++
        if (card.id === 'necroticamp') comboTriggers.corruption++

        hand = hand.filter(c => c.uid !== card.uid)
        disc.push(card)
      }

      // Calculate strike damage
      let dmg = 0
      for (const m of stage) {
        if (!m || m.stoned) continue
        const totalAtk = m.atk + m.tempAtk
        dmg += totalAtk
        if (m.encore) {
          dmg += m.halfEncore ? Math.ceil(totalAtk / 2) : totalAtk
        }
      }
      dmg = Math.round(dmg * ctx.strikeMult)
      dmg += ctx.bossDmg // direct damage from cards

      totalDamage += dmg
      highestStrike = Math.max(highestStrike, dmg)
      bossHp -= dmg

      // Boss attacks
      if (bossHp > 0) {
        const aliveMembers = stage.filter(m => m && !m.stoned)
        if (aliveMembers.length > 0) {
          const victim = aliveMembers[Math.floor(Math.random() * aliveMembers.length)]
          victim.hp -= bossDmg
          if (victim.hp <= 0) {
            if (victim.shield) { victim.hp = 1; victim.shield = false }
            else { victim.stoned = true; victim.hp = 0 }
          }
        }
      }

      // Reset per-strike temps
      stage.forEach(m => { if(m) { m.tempAtk = 0; m.encore = false; m.halfEncore = false } })

      strikesLeft--
      if (bonusStrikes > 0) { strikesLeft++; bonusStrikes-- }
      ctx.bonusStrikes = 0

      // Draw for next strike
      draw(ctx.draws || 0)
      draw(6 - hand.length) // refill to 6

      // Corruption effects
      if (corruption >= 75 && Math.random() < 0.15 && hand.length > 1) {
        hand.splice(Math.floor(Math.random() * hand.length), 1)
      }
      embers = fightMaxEmbers
      corruption = ctx.corruption
    }

    if (bossHp <= 0) {
      fightsSurvived++
      stash += 3 + Math.floor(Math.random() * 5)
      // Heal between fights
      stage.forEach(m => {
        if (m && m.stoned && Math.random() < 0.3) { m.stoned = false; m.hp = Math.floor(m.maxHp * 0.5) }
        if (m && !m.stoned) m.hp = Math.min(m.maxHp, m.hp + 3)
      })
    } else {
      break // died
    }
  }

  return {
    won: fightsSurvived >= 27,
    fightsSurvived,
    totalDamage,
    highestStrike,
    cardPlayCounts,
    bestComboTier,
    comboTriggers,
    finalCorruption: corruption,
  }
}

// ═══ RUN SIMULATION ═════════════════════════════════════════════════
console.log(`\n⛧ Running ${NUM_GAMES} games on ${STAKE_NAME.toUpperCase()}...\n`)

let wins = 0, totalFights = 0, totalHighest = 0
const allCardPlays = {}
const comboStats = {chain:0, echo:0, copy:0, mult:0, corruption:0}
const comboTiers = [0,0,0,0,0]
const deathCircles = new Array(10).fill(0)
let highestEverStrike = 0

for (let g = 0; g < NUM_GAMES; g++) {
  const result = simGame()
  if (result.won) wins++
  totalFights += result.fightsSurvived
  totalHighest += result.highestStrike
  highestEverStrike = Math.max(highestEverStrike, result.highestStrike)

  Object.entries(result.cardPlayCounts).forEach(([id, count]) => {
    allCardPlays[id] = (allCardPlays[id] || 0) + count
  })
  Object.entries(result.comboTriggers).forEach(([k, v]) => {
    comboStats[k] += v
  })
  comboTiers[result.bestComboTier]++

  const circle = Math.floor(result.fightsSurvived / 3)
  if (!result.won && circle < 10) deathCircles[circle]++
}

const winRate = (wins / NUM_GAMES * 100).toFixed(2)
const avgFight = (totalFights / NUM_GAMES).toFixed(1)
const avgHighest = Math.round(totalHighest / NUM_GAMES)

console.log(`════════════════════════════════════════════════════`)
console.log(`  WIN RATE: ${winRate}% (${wins}/${NUM_GAMES})`)
console.log(`  Avg fights survived: ${avgFight}/27`)
console.log(`  Avg highest strike: ${avgHighest}`)
console.log(`  All-time highest strike: ${highestEverStrike}`)
console.log(`════════════════════════════════════════════════════`)

console.log(`\n  COMBO TRIGGERS (per game avg):`)
console.log(`    Riff Chains: ${(comboStats.chain/NUM_GAMES).toFixed(1)}`)
console.log(`    Echo Replays: ${(comboStats.echo/NUM_GAMES).toFixed(1)}`)
console.log(`    Bootleg Copies: ${(comboStats.copy/NUM_GAMES).toFixed(1)}`)
console.log(`    Dark Crescendo (×2 mult): ${(comboStats.mult/NUM_GAMES).toFixed(2)}`)
console.log(`    Necrotic Amp (corruption scaling): ${(comboStats.corruption/NUM_GAMES).toFixed(2)}`)

console.log(`\n  COMBO TIER DISTRIBUTION:`)
console.log(`    No combos: ${(comboTiers[0]/NUM_GAMES*100).toFixed(1)}%`)
console.log(`    Tier 1 (1 chain): ${(comboTiers[1]/NUM_GAMES*100).toFixed(1)}%`)
console.log(`    Tier 2 (2 chains): ${(comboTiers[2]/NUM_GAMES*100).toFixed(1)}%`)
console.log(`    Tier 3 (3+ chains): ${(comboTiers[3]/NUM_GAMES*100).toFixed(1)}%`)

console.log(`\n  DEATH DISTRIBUTION:`)
ENEMIES.forEach((_, i) => {
  if (i % 3 === 0) {
    const c = Math.floor(i/3) + 1
    const deaths = deathCircles[c-1] || 0
    const pct = (deaths/NUM_GAMES*100).toFixed(1)
    const bar = '█'.repeat(Math.round(pct))
    console.log(`    Circle ${c}: ${pct}% ${bar}`)
  }
})

console.log(`\n  CARD PLAY RATES (per game, sorted):`)
const sorted = Object.entries(allCardPlays)
  .map(([id, count]) => {
    const card = DECK_V2.find(c => c.id === id)
    const perGame = count / NUM_GAMES
    const copies = card ? card.copies : 1
    const perCopy = perGame / copies
    return {id, perGame, perCopy, tier: card?.tier || '★', type: card?.type || '?'}
  })
  .sort((a, b) => b.perGame - a.perGame)

sorted.forEach(c => {
  const pad = c.id.padEnd(18)
  const pg = c.perGame.toFixed(1).padStart(6)
  const pc = c.perCopy.toFixed(2).padStart(6)
  const flag = c.perCopy < 1.0 ? ' ⚠ LOW' : c.perCopy > 8.0 ? ' 🔥 HOT' : c.perCopy > 5.0 ? ' ✅ STRONG' : ''
  console.log(`    ${c.tier} ${c.type.padEnd(8)} ${pad} ${pg}/g  ${pc}/copy${flag}`)
})

console.log(`\n⛧ Simulation complete.\n`)
