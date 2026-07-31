// Extracted from App.jsx (v0.8.0 split, depth-aware parser) — pure data.
export const ENEMIES=[
  // ── CIRCLE I: LIMBO — No passives, intro difficulty ──────────
  // Wanderer — TRAINING WHEELS FIGHT. Per JV's design vision: r1 should be a
  // tutorial fight EVERY player wins, then shop 1 delivers a free 3rd member
  // (Welcome Pack at line 1484) so the band "starts popping off" in fight 2+.
  // Live playtest with 9-ATK team (Ulf 4 + Bjorn 5) STILL LOST at the previous
  // 65 HP / 2 dmg tuning — corruption-stoning + ember scarcity killed Bjorn.
  // Hard nerf: 45 HP base × 1.85 deck = 83 displayed; 2 dmg/strike means
  // members at 6 HP survive 4 hits comfortably. Goal: ~95% win rate.
  // Lost Soul (278) and Drifter (629) UNCHANGED — real game starts fight 2.
  {id:'wanderer',tagline:'Could not even find the exit.',name:'The Wanderer',circle:'Circle I — Limbo',subtitle:'Fight 1 of 3',maxHp:45,baseDmg:2,emoji:'👤',passive:'A lost soul with no purpose. Attacks randomly.',passiveId:null},
  {id:'lostsoul',tagline:'You were lost before you started.',name:'The Lost Soul',circle:'Circle I — Limbo',subtitle:'Fight 2 of 3',maxHp:61,baseDmg:5,emoji:'💀',passive:'A stronger damned spirit. Hunger drives its blows.',passiveId:null},
  {id:'drifter',tagline:'110 HP and pure aggression.',name:'The Drifter',circle:'Circle I — Limbo',subtitle:'Circle Boss — Fight 3 of 3',maxHp:142,baseDmg:7,emoji:'👁',passive:'Pure relentless pressure.',passiveId:null},
  // ── CIRCLE II: LUST — Enemy buffs itself each strike ─────────
  {id:'siren',tagline:'She sang. You listened. You lost.',name:'The Siren',circle:'Circle II — Lust',subtitle:'Fight 1 of 3',maxHp:141,baseDmg:5,emoji:'🌊',passive:'Seductive. Gains +1 damage each Strike.',passiveId:'selfbuff'},
  {id:'tempter',tagline:'Temptation wins again.',name:'The Tempter',circle:'Circle II — Lust',subtitle:'Fight 2 of 3',maxHp:220,baseDmg:6,emoji:'🌹',passive:'Enthralling. Gains +1 damage each Strike. Starts stronger.',passiveId:'selfbuff'},
  {id:'lust_boss',tagline:'Irresistible to the end.',name:'The Seducer',circle:'Circle II — Lust',subtitle:'Circle Boss — Fight 3 of 3',maxHp:585,baseDmg:7,emoji:'💋',passive:'Irresistible. Gains +2 damage each Strike. Dangerous if left alive.',passiveId:'selfbuff2'},
  // ── CIRCLE III: GLUTTONY — Heals when you play cards ─────────
  {id:'glutton',tagline:'It ate your strikes for breakfast.',name:'The Glutton',circle:'Circle III — Gluttony',subtitle:'Fight 1 of 3',maxHp:356,baseDmg:5,emoji:'🍖',passive:'Insatiable. Heals 8 HP every time a card is played.',passiveId:'cardHeal3b'},
  {id:'feaster',tagline:'Still hungry. Always hungry.',name:'The Feaster',circle:'Circle III — Gluttony',subtitle:'Fight 2 of 3',maxHp:526,baseDmg:6,emoji:'🦷',passive:'Voracious. Heals 15 HP every time a card is played.',passiveId:'cardHeal5'},
  {id:'gluttony_boss',tagline:'Everything gets devoured eventually.',name:'The Devourer',circle:'Circle III — Gluttony',subtitle:'Circle Boss — Fight 3 of 3',maxHp:1697,baseDmg:7,emoji:'🕳',passive:'Endless hunger. Heals 25 HP per card played. Strike fast.',passiveId:'cardHeal8'},
  // ── CIRCLE IV: GREED — Steals stash each strike ──────────────
  {id:'miser',tagline:'You could not afford to win.',name:'The Miser',circle:'Circle IV — Greed',subtitle:'Fight 1 of 3',maxHp:377,baseDmg:4,emoji:'💰',passive:'Greedy. Steals 1🌿 from your Stash each Strike. Win to take it back.',passiveId:'stashSteal'},
  {id:'hoarder',tagline:'It had more patience than you.',name:'The Hoarder',circle:'Circle IV — Greed',subtitle:'Fight 2 of 3',maxHp:610,baseDmg:5,emoji:'🪙',passive:'Avaricious. Steals 2🌿 per Strike. Your stash is its stash.',passiveId:'stashSteal2'},
  {id:'greed_boss',tagline:'Debt always comes due.',name:'The Usurer',circle:'Circle IV — Greed',subtitle:'Circle Boss — Fight 3 of 3',maxHp:1810,baseDmg:6,emoji:'🏦',passive:'Extracting. Steals 3🌿 per Strike. Pure greed compounded.',passiveId:'stashSteal3'},
  // ── CIRCLE V: ANGER — Hits harder the more you buff ─────────
  {id:'wrathful',tagline:'It rages itself to death.',name:'The Wrathful',circle:'Circle V — Anger',subtitle:'Fight 1 of 3',maxHp:566,baseDmg:5,emoji:'🔥',passive:'Self-immolating rage. Loses 8% HP each Strike but deals +50% damage cumulatively. Outlast it.',passiveId:'selfImmolate'},
  {id:'berserker',tagline:'Wounded fury — strike fast or weather the storm.',name:'The Berserker',circle:'Circle V — Anger',subtitle:'Fight 2 of 3',maxHp:890,baseDmg:6,emoji:'⚔️',passive:'Bloodlust. Below 50% HP, attacks deal double damage.',passiveId:'bloodlust'},
  {id:'anger_boss',tagline:'The commander of the damned.',name:'The Warlord',circle:'Circle V — Anger',subtitle:'Circle Boss — Fight 3 of 3',maxHp:2073,baseDmg:7,emoji:'💢',passive:'Commands. Each Strike, applies a random debuff: -1 ATK to all members, lose 1 ember, OR discard 1 hand card.',passiveId:'commands'},
  // ── CIRCLE VI: HERESY — Corrupts your corruption system ──────
  {id:'heretic',tagline:'Your soul is sufficiently corrupted now.',name:'The Heretic',circle:'Circle VI — Heresy',subtitle:'Fight 1 of 3',maxHp:852,baseDmg:5,emoji:'🔱',passive:'Blasphemous. Each Strike raises your Corruption by 10%.',passiveId:'corruptPlayer'},
  {id:'apostate',tagline:'Corruption claimed another believer.',name:'The Apostate',circle:'Circle VI — Heresy',subtitle:'Fight 2 of 3',maxHp:1310,baseDmg:6,emoji:'⛧',passive:'Corrupting. Raises Corruption by 15% each Strike.',passiveId:'corruptPlayer15'},
  {id:'heresy_boss',tagline:'Even your chaos served its doctrine.',name:'The False Prophet',circle:'Circle VI — Heresy',subtitle:'Circle Boss — Fight 3 of 3',maxHp:2154,baseDmg:7,emoji:'📖',passive:'Toxic doctrine. Corruption +20% per Strike. Hellquake territory every fight.',passiveId:'corruptPlayer20'},
  // ── CIRCLE VII: VIOLENCE — Targets your healthiest member ────
  {id:'brute',tagline:'Your healthiest fell first.',name:'The Brute',circle:'Circle VII — Violence',subtitle:'Fight 1 of 3',maxHp:1160,baseDmg:6,emoji:'🗡️',passive:'Calculated. Always targets the member with highest HP.',passiveId:'targetHighestHp'},
  {id:'hunter',tagline:'Prey spotted. Prey eliminated.',name:'The Hunter',circle:'Circle VII — Violence',subtitle:'Fight 2 of 3',maxHp:1681,baseDmg:7,emoji:'🏹',passive:'Predatory. Targets highest HP member. Deals +50% damage to them.',passiveId:'targetHighestHp2'},
  {id:'violence_boss',tagline:'The sentence was carried out.',name:'The Executioner',circle:'Circle VII — Violence',subtitle:'Circle Boss — Fight 3 of 3',maxHp:2508,baseDmg:8,emoji:'🩸',passive:'Methodical. Targets highest HP and deals double damage. Protect your strongest.',passiveId:'targetHighestHp3'},
  // ── CIRCLE VIII: FRAUD — Shuffles your hand after each strike ──
  {id:'trickster',tagline:'You played right into its hands.',name:'The Trickster',circle:'Circle VIII — Fraud',subtitle:'Fight 1 of 3',maxHp:2415,baseDmg:6,emoji:'🃏',passive:'Deceptive. After each Strike, 1 random card in hand is discarded and replaced.',passiveId:'fraudShuffle'},
  {id:'deceiver',tagline:'Nothing was what it seemed.',name:'The Deceiver',circle:'Circle VIII — Fraud',subtitle:'Fight 2 of 3',maxHp:3124,baseDmg:7,emoji:'🎭',passive:'Manipulative. After each Strike, 1 random card in hand is discarded and replaced.',passiveId:'fraudShuffle2'},
  {id:'fraud_boss',tagline:'The greatest con: you thought you could win.',name:'The Archfraud',circle:'Circle VIII — Fraud',subtitle:'Circle Boss — Fight 3 of 3',maxHp:4032,baseDmg:8,emoji:'🪞',passive:'Master of lies. After each Strike, 2 cards in hand are discarded and replaced.',passiveId:'fraudShuffle3'},
  // ── CIRCLE IX: TREACHERY ──────────────────────────────────────
  {id:'traitor',tagline:'Your own band turned on you.',name:'The Traitor',circle:'Circle IX — Treachery',subtitle:'Fight 1 of 3',maxHp:1280,baseDmg:6,emoji:'🗝️',passive:'Paranoia. Each Strike, 1 random member refuses to attack and deals 3 damage to an ally.',passiveId:'paranoia'},
  {id:'betrayer',tagline:'It stole everything you built.',name:'The Betrayer',circle:'Circle IX — Treachery',subtitle:'Fight 2 of 3',maxHp:1365,baseDmg:7,emoji:'🔒',passive:'Soul Thief. Each Strike, steals 1 permanent ATK from a random member. Returned on victory.',passiveId:'soulThief'},
  {id:'lucifer',tagline:'He has seen better challengers. A lot of them.',name:'Lucifer',circle:'Circle IX — Treachery',subtitle:'⛧ The Final Circle — Fight 3 of 3',maxHp:100000,baseDmg:9,emoji:'😈',passive:'The Lord of Hell. Your victories weaken him. Two phases. The ultimate test.',passiveId:'luciferBoss'},
]
