// e2e/test-perception.cjs — asserts the bot SEES the true game state.
// Every value here was silently wrong before the Aug 1 rebuild (corruption
// pinned at 0, maxHp faked as hp, stoned members counted alive, duplicate
// hand cards invisible). Run: node e2e/test-perception.cjs
const P = require('./pilot.cjs')
const { perceive } = require('./autopilot.cjs')
const sleep = ms => new Promise(r => setTimeout(r, ms))
let pass = 0, fail = 0
const chk = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}: got ${JSON.stringify(got)}${ok ? '' : '  WANT ' + JSON.stringify(want)}`)
  ok ? pass++ : fail++
}
const chkT = (name, cond, detail) => { console.log(`${cond ? '  ✓' : '  ✗'} ${name}${cond ? '' : '  — ' + detail}`); cond ? pass++ : fail++ }

;(async () => {
  const pg = await P.connect()
  await P.evaljs(`(() => {
    localStorage.setItem('vst_debug','1');localStorage.setItem('vst_heat','1');localStorage.setItem('vst_no_lucifer','1');localStorage.setItem('vst_hoverzoom','off');localStorage.setItem('vst_shake','off')
    const mk=(id,name,atk,hp,maxHp,role,kw,uid,stoned)=>({id,name,hp,maxHp,atk,role,keyword:kw,tooStoned:!!stoned,uid,foil:false,mythic:false,demonic:false,permAtkBonus:0,encoreReady:false,stoneShield:false,buffCount:0,_hrUsed:false})
    const save={v:1,gs:'playing',fi:4,seed:555,deck:'standard',relicsSeen:[],
      stage:[mk('bjorn','Bjorn',9,3,20,'Lead Guitarist','FRENZIED','u1'),mk('tanuki','Tanuki',8,16,16,'Bass Player','ANCHOR','u2'),mk('orm','Orm',2,0,11,'Dark Minstrel','HEXED','u3',true),null,null],
      dk:['amp','encore','soundcheck','powertap','moshpit','seance','darktuning','battlecry'],
      hand:['battlecry','battlecry','heavyriff','soundcheck','darktuning','stagedive'],disc:[],
      em:6,mx:6,st:40,co:55,sl:3,ms:4,dl:3,pa:[],art:[],pas:[],loot:[],upg:[],
      stats:{fightsSurvived:4,strikesThrown:12,totalDamage:400,highestStrike:90,tooStonedCount:1,maxCorruption:55,stashEarned:80,cardsPlayed:30},
      shrooms:1,acid:0,dmt:false}
    localStorage.setItem('vst_save_v4',JSON.stringify(save)); return 1
  })()`)
  await P.evaljs('location.reload()'); await sleep(4000)
  let st = await P.state()
  const cont = st.clickables.find(c => /CONTINUE|RESUME/i.test(c.t)); if (cont) { await P.click(cont.x, cont.y); await sleep(3500) }

  console.log('\n══ PERCEPTION TEST (planted state: corr 55, 1 injured, 1 stoned, dup cards) ══')
  const g = await perceive()
  chk('corruption (was ALWAYS 0 before)', g.corruption, 55)
  chk('embers', g.embers, 6)
  chkT('parse misses = none', !g.miss.length, 'missed: ' + JSON.stringify(g.miss))
  chk('members seen', g.members.length, 3)
  const bj = g.members.find(m => m.name === 'Bjorn')
  const tk = g.members.find(m => m.name === 'Tanuki')
  const orm = g.members.find(m => m.name === 'Orm')
  chkT('Bjorn maxHp recovered from HP bar (3/20, was faked as 3)', bj && bj.maxHp >= 18 && bj.maxHp <= 22, bj ? 'got maxHp ' + bj.maxHp : 'Bjorn missing')
  chkT('Bjorn reads as INJURED (<50% hp)', bj && bj.hp / bj.maxHp < 0.5, bj ? `${bj.hp}/${bj.maxHp}` : 'missing')
  chkT('Tanuki reads as HEALTHY', tk && tk.hp / tk.maxHp > 0.9, tk ? `${tk.hp}/${tk.maxHp}` : 'missing')
  chkT('Orm flagged TOO STONED (used to count as alive)', orm && orm.tooStoned, orm ? 'tooStoned=' + orm.tooStoned : 'missing')
  chkT('alive count excludes stoned = 2', g.members.filter(m => !m.tooStoned).length === 2, 'got ' + g.members.filter(m => !m.tooStoned).length)
  chkT('keywords parsed', bj && bj.keyword === 'FRENZIED' && tk && tk.keyword === 'ANCHOR', JSON.stringify(g.members.map(m => m.keyword)))
  chkT('roles parsed (needed for mentor links)', g.members.every(m => m.role), JSON.stringify(g.members.map(m => m.role)))
  // 6 planted + 2 corruption-gift cards the game grants at 25%/50% corruption
  // (Dark Whisper, Blood Price). Those two are exactly what the OLD bot could
  // not see — blood_price was unmatchable and both scored below the discard
  // threshold, so the ledger caught it dumping them to dig for "something better".
  chk('hand size (6 planted + 2 corruption gifts)', g.hand.length, 8)
  chkT('corruption-gift cards are visible AND scored as plays, not junk',
    g.hand.some(c => /Blood Price/i.test(c.name)) && g.hand.some(c => /Dark Whisper/i.test(c.name)),
    'gifts missing from hand: ' + g.hand.map(c => c.name).join(' | '))
  chkT('duplicate Battle Cry visible twice', g.hand.filter(c => /Battle Cry/i.test(c.name)).length === 2, 'got ' + g.hand.filter(c => /Battle Cry/i.test(c.name)).length)
  chkT('fightIndex derived (was hardcoded 0)', g.fightIndex === 4, 'got ' + g.fightIndex + ' circle ' + g.circle)
  chkT('boss HP read', g.bossHp > 0 && g.bossMaxHp > 0, `${g.bossHp}/${g.bossMaxHp}`)
  chkT('strikesLeft read', g.strikesLeft !== null, 'null')

  console.log('\n══ POLICY TEST (targeting + scoring on this exact board) ══')
  const BRAIN = require('./brain.cjs')
  const alive = g.members.filter(m => !m.tooStoned)
  const T = id => { const t = BRAIN.pickTarget({ id }, alive, { hrUsed: new Set(), allMembers: g.members }); return t && t.name }
  chk('stagedive → tankiest (dmg = target HP)', T('stagedive'), 'Tanuki')
  chk('resonancecard → LOWEST atk (carry = no-op)', T('resonancecard'), 'Tanuki')
  chk('controlfeedback → most injured', T('controlfeedback'), 'Bjorn')
  chk('roadie → most injured', T('roadie'), 'Bjorn')
  chk('amp → the carry', T('amp'), 'Bjorn')
  chk('bloodritual → highest HP', T('bloodritual'), 'Tanuki')
  chk('carrioncall → the STONED member', T('carrioncall'), 'Orm')
  const gs = { alive, corruption: g.corruption, stash: g.stash, embers: g.embers, handLen: g.hand.length, handIds: [], cardsPlayedIds: [], firedChains: new Set(), discardsLeft: g.discardsLeft, strikeMult: 1, bossHp: g.bossHp, fightIndex: g.fightIndex, discardLen: 0, anyStoned: true, hrUsed: new Set() }
  const sc = id => BRAIN.scoreCard({ id }, gs, 0, 0)
  chkT('darktuning scored on REAL corruption 55 (was stuck at 10)', sc('darktuning') === 55, 'got ' + sc('darktuning'))
  chkT('soundcheck sees an injured band (was stuck at 30)', sc('soundcheck') === 58, 'got ' + sc('soundcheck'))
  chkT('wakeup sees a stoned member (was 8)', sc('wakeup') === 90, 'got ' + sc('wakeup'))
  chkT('madnesscard is a top play, not junk (was 5)', sc('madnesscard') === 96, 'got ' + sc('madnesscard'))
  chkT('hungercard scored (was 5)', sc('hungercard') === 80, 'got ' + sc('hungercard'))
  chkT('blood_price scored (was unmatchable)', sc('blood_price') === 78, 'got ' + sc('blood_price'))
  const hrAll = new Set(alive.map(m => m.name))
  chkT('heavyriff drops below stop-rule when all members used it', BRAIN.scoreCard({ id: 'heavyriff' }, { ...gs, hrUsed: hrAll }, 0, 0) === 3, 'got ' + BRAIN.scoreCard({ id: 'heavyriff' }, { ...gs, hrUsed: hrAll }, 0, 0))
  chkT('heavyriff targets a member who has NOT used it', BRAIN.pickTarget({ id: 'heavyriff' }, alive, { hrUsed: new Set(['Bjorn']) }).name === 'Tanuki', 'got ' + BRAIN.pickTarget({ id: 'heavyriff' }, alive, { hrUsed: new Set(['Bjorn']) }).name)
  chkT('matchCard resolves all 82 real cards', require('./carddata.json').cards.filter(c => !BRAIN.matchCard(c.name)).length === 0, 'unmatched: ' + require('./carddata.json').cards.filter(c => !BRAIN.matchCard(c.name)).map(c => c.id).join(','))

  console.log(`\n══ ${pass} passed, ${fail} failed ══`)
  process.exit(fail ? 1 : 0)
})().catch(e => { console.log('HARNESS FAIL:', e.message); process.exit(1) })
