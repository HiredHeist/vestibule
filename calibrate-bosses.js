#!/usr/bin/env node
// calibrate-bosses.js — Auto-tune individual boss HP for target death rates
// Runs the full sim repeatedly, adjusting each boss until death rates match targets

// Import the sim by spawning it — but we need to modify it to accept per-boss HP
// Instead, let's build a mini calibration loop right here

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Target survival curve — what % of players should survive PAST each fight
// C1 is forgiving (30% die total), then ~10-15% per circle after
const TARGET_SURVIVE = [
  1.00,  // F0  Wanderer    — everyone survives
  0.92,  // F1  Lost Soul   — 8% die (first real threat)
  0.85,  // F2  Drifter     — 7% more die (C1 boss, first wall)
  0.80,  // F3  Siren       — 5% die
  0.74,  // F4  Tempter     — 6% die
  0.67,  // F5  Seducer     — 7% die (C2 boss)
  0.64,  // F6  Glutton     — 3% die (gluttons heal, tricky)
  0.60,  // F7  Feaster     — 4% die
  0.54,  // F8  Devourer    — 6% die (C3 boss)
  0.50,  // F9  Miser       — 4% die
  0.46,  // F10 Hoarder     — 4% die
  0.40,  // F11 Usurer      — 6% die (C4 boss, stash steal hurts)
  0.37,  // F12 Wrathful    — 3% die
  0.33,  // F13 Berserker   — 4% die
  0.28,  // F14 Warlord     — 5% die (C5 boss, rage scaling)
  0.25,  // F15 Heretic     — 3% die (corruption pressure starts)
  0.22,  // F16 Apostate    — 3% die
  0.18,  // F17 F.Prophet   — 4% die (C6 boss)
  0.16,  // F18 Brute       — 2% die
  0.14,  // F19 Hunter      — 2% die
  0.12,  // F20 Executioner — 2% die (C7 boss)
  0.115, // F21 Trickster   — 0.5% die (fraud shuffle, not too deadly)
  0.110, // F22 Deceiver    — 0.5% die
  0.105, // F23 Archfraud   — 0.5% die (C8 boss — if you got here, you're strong)
  0.103, // F24 Traitor     — 0.2% die
  0.101, // F25 Betrayer    — 0.2% die
  0.100, // F26 LUCIFER     — 0.1% die → 10% final win rate
]

// Current base HP values from the sim
const BASE_HP = [
  65, 95, 140,     // C1
  145, 210, 310,   // C2
  160, 210, 280,   // C3
  400, 470, 780,   // C4
  972, 1080, 1200, // C5
  1897, 2185, 2990,// C6
  3660, 4880, 6710,// C7
  6864, 8976, 12672,// C8
  12600, 15960, 420666 // C9
]

const NAMES = [
  'Wanderer','Lost Soul','Drifter',
  'Siren','Tempter','Seducer',
  'Glutton','Feaster','Devourer',
  'Miser','Hoarder','Usurer',
  'Wrathful','Berserker','Warlord',
  'Heretic','Apostate','False Prophet',
  'Brute','Hunter','Executioner',
  'Trickster','Deceiver','Archfraud',
  'Traitor','Betrayer','LUCIFER'
]

// Start with current multipliers (1.3 for all)
let multipliers = new Array(27).fill(1.3)

console.log('\n⛧ BOSS HP CALIBRATOR — tuning each boss for target death rates\n')
console.log('Target: C1 ~30% total deaths (forgiving), C2+ ~10-15% per circle')
console.log('Final target: ~10% overall win rate\n')

// We'll iterate: run sim, check rates, adjust multipliers
const ITERATIONS = 20
const GAMES_PER_ITER = 1000

for(let iter = 0; iter < ITERATIONS; iter++) {
  // Write multipliers to a temp file the sim can read
  const hpValues = multipliers.map((m, i) => Math.ceil(BASE_HP[i] * m))
  writeFileSync('/tmp/boss_hp_override.json', JSON.stringify(hpValues))
  
  // Run sim with override
  const output = execSync(
    `node vestibule-sim.js ${GAMES_PER_ITER} bronze`, 
    { cwd: '/home/claude/vestibule', timeout: 60000 }
  ).toString()
  
  // Parse survival rates
  const surviveRates = []
  const lines = output.split('\n')
  for(const line of lines) {
    const match = line.match(/(\d+\.\d+)% survive/)
    if(match) surviveRates.push(parseFloat(match[1]) / 100)
  }
  
  if(surviveRates.length < 27) {
    console.log('  ⚠ Could not parse survival rates, got', surviveRates.length)
    continue
  }
  
  // Parse win rate
  const wrMatch = output.match(/Lucifer wins: \d+ \((\d+\.\d+)%\)/)
  const winRate = wrMatch ? parseFloat(wrMatch[1]) : 0
  
  // Adjust multipliers based on actual vs target survival
  let adjustments = 0
  for(let f = 0; f < 27; f++) {
    const actual = surviveRates[f]
    const target = TARGET_SURVIVE[f]
    const diff = actual - target // positive = too many survive = too easy
    
    if(Math.abs(diff) > 0.02) { // more than 2% off target
      // Scale multiplier proportionally
      const factor = 1.0 + diff * 1.2 // aggressive adjustment
      multipliers[f] = Math.max(0.5, multipliers[f] * factor)
      adjustments++
    }
  }
  
  console.log(`  Iter ${iter+1}: WR=${winRate.toFixed(1)}% | ${adjustments} bosses adjusted`)
  
  if(adjustments === 0) {
    console.log('  ✅ All bosses within 2% of target!')
    break
  }
}

// Final report
const finalHp = multipliers.map((m, i) => Math.ceil(BASE_HP[i] * m))
console.log('\n' + '═'.repeat(70))
console.log('CALIBRATED BOSS HP VALUES:')
console.log('═'.repeat(70))
console.log(`${'Fight'.padEnd(6)} ${'Boss'.padEnd(16)} ${'Base HP'.padStart(8)} ${'Mult'.padStart(6)} ${'New HP'.padStart(10)} ${'Target Surv'.padStart(12)}`)
console.log('─'.repeat(70))
for(let i = 0; i < 27; i++) {
  const circle = Math.floor(i/3) + 1
  const isBoss = (i+1)%3 === 0
  const marker = isBoss ? ' ★' : '  '
  console.log(`C${circle}${marker} ${NAMES[i].padEnd(16)} ${BASE_HP[i].toString().padStart(8)} ${('×'+multipliers[i].toFixed(2)).padStart(6)} ${finalHp[i].toLocaleString().padStart(10)} ${(TARGET_SURVIVE[i]*100).toFixed(0).padStart(10)}%`)
}

// Output as code ready to paste
console.log('\n// Paste into ENEMIES array (or use as HP overrides):')
console.log('const CALIBRATED_HP = [')
for(let i = 0; i < 27; i += 3) {
  const c = Math.floor(i/3) + 1
  console.log(`  ${finalHp[i]}, ${finalHp[i+1]}, ${finalHp[i+2]},  // Circle ${c}: ${NAMES[i]}, ${NAMES[i+1]}, ${NAMES[i+2]}`)
}
console.log(']')
