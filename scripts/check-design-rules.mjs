#!/usr/bin/env node
/**
 * Vestibule design-rules lint.
 * Catches the two locked-in rules without playtesting:
 *   1. No fontSize below 13px anywhere
 *   2. JSX inline-style text colors must use --text-* / --type-* tokens
 *      (data-prop colors like card.color are exempt — they're identified
 *       by absence of fontSize/fontFamily on the same line)
 *
 * Exit codes:
 *   0 = clean
 *   1 = violations found (so this can be a pre-commit hook)
 *
 * Usage:
 *   npm run check
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname
const FONT_FLOOR = 13
const SCRATCH_FONT_FLOOR = 20  // ScratchFont is decorative — illegible below 20pt

// Sanctioned text colors — anything else inside a JSX style is a violation
const ALLOWED_TOKENS = new Set([
  'var(--text-primary)',
  'var(--text-secondary)',
  'var(--text-muted)',
  'var(--text-gold)',
  'var(--text-blood)',
  'var(--text-positive)',
  'var(--text-inverse)',
  // Type-identity (used as text on type badges)
  'var(--type-riff)',
  'var(--type-corrupt)',
  'var(--type-utility)',
  'var(--type-ember)',
  // Tier-identity (mythic / foil card tier indicators)
  'var(--tier-mythic)',
  'var(--tier-foil)',
  // Legacy aliases that resolve to tokens — kept readable during migration
  'var(--ink-bone)',
  'var(--ink-dim)',
  'var(--ink-rust)',
  'var(--gold)',
  'var(--gold-dim)',
  'var(--gold-dark)',
  'var(--blood)',
  'var(--rot)',
  'var(--ember)',
  'var(--parchment)',
])

// Type-identity hex still in use as text — flag but allow until --type-* migration
const TYPE_IDENTITY_HEX = new Set([
  '#9933cc', '#aa1111', '#22aa44', '#c87820',
])

// Effect colors that are deferred (positive-feedback green, mythic purple, etc.)
const DEFERRED_HEX = new Set([
  '#33dd33', '#44cc44', '#cc44ff',
])

function walk(dir) {
  const out = []
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...walk(p))
    else if (extname(p) === '.jsx' || extname(p) === '.js') out.push(p)
  }
  return out
}

const files = walk(ROOT)
let fontViolations = []
let scratchFontViolations = []
let colorOffPalette = []
let colorTypeIdentityNeedsToken = []

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1
    const isJsxStyle = /font(Size|Family|Weight):/.test(line)

    // Rule 1: fontSize floor
    const fontMatches = line.matchAll(/fontSize:(\d+)/g)
    for (const m of fontMatches) {
      const px = parseInt(m[1], 10)
      if (px < FONT_FLOOR) {
        fontViolations.push({ file, lineNo, line: line.trim(), value: px })
      }
    }

    // Rule 1b: ScratchFont legibility — illegible below 20pt
    if (line.includes("'ScratchFont'")) {
      const sizes = [...line.matchAll(/fontSize:(\d+)/g)].map(m => parseInt(m[1], 10))
      if (sizes.length > 0) {
        const smallest = Math.min(...sizes)
        if (smallest < SCRATCH_FONT_FLOOR) {
          scratchFontViolations.push({ file, lineNo, line: line.trim(), value: smallest })
        }
      }
    }

    // Rule 2: text color must be a token (only enforce inside JSX styles)
    if (!isJsxStyle) continue
    // ErrorBoundary fallback — debug-only, always-visible. Skip line.
    if (/className=['"]error-boundary|RENDER ERROR/.test(line)) continue
    // Require `color:` to be preceded by whitespace, comma, or `{` so we only match
    // object-property syntax — not `t.color:'1px solid...'` from ternary expressions.
    const colorMatches = [...line.matchAll(/(?<=[\s,{])color:'([^']+)'/g)]
    for (const m of colorMatches) {
      const value = m[1]
      // Skip rgba/rgb (handled separately) and any non-hex non-var
      if (value.startsWith('rgba(') || value.startsWith('rgb(')) continue
      if (value.startsWith('var(')) {
        if (!ALLOWED_TOKENS.has(value)) {
          colorOffPalette.push({ file, lineNo, line: line.trim(), value, reason: 'unknown CSS var' })
        }
        continue
      }
      // It's a hex (or named color)
      const hex = value.toLowerCase()
      if (TYPE_IDENTITY_HEX.has(hex)) {
        colorTypeIdentityNeedsToken.push({ file, lineNo, line: line.trim(), value: hex })
        continue
      }
      if (DEFERRED_HEX.has(hex)) {
        // Deferred — informational only, not a violation yet
        continue
      }
      colorOffPalette.push({ file, lineNo, line: line.trim(), value: hex, reason: 'off-palette hex in JSX text style' })
    }
  }
}

const rel = (p) => p.replace(process.cwd() + '/', '')

let failed = false
console.log('━━━ VESTIBULE DESIGN RULES CHECK ━━━\n')

if (fontViolations.length === 0) {
  console.log('✅ Font size floor (≥13px): CLEAN')
} else {
  failed = true
  console.log(`❌ Font size floor (≥13px): ${fontViolations.length} VIOLATION${fontViolations.length === 1 ? '' : 'S'}`)
  for (const v of fontViolations) {
    console.log(`   ${rel(v.file)}:${v.lineNo}  fontSize:${v.value}`)
  }
}

console.log('')
if (scratchFontViolations.length === 0) {
  console.log('✅ ScratchFont legibility (≥20pt): CLEAN')
} else {
  failed = true
  console.log(`❌ ScratchFont legibility (≥20pt): ${scratchFontViolations.length} VIOLATION${scratchFontViolations.length === 1 ? '' : 'S'}`)
  console.log(`   ScratchFont is decorative — switch to MBScribblesFont below 20pt.`)
  for (const v of scratchFontViolations) {
    console.log(`   ${rel(v.file)}:${v.lineNo}  fontSize:${v.value}`)
  }
}

console.log('')
if (colorOffPalette.length === 0) {
  console.log('✅ Text colors on palette: CLEAN')
} else {
  failed = true
  console.log(`❌ Text colors on palette: ${colorOffPalette.length} VIOLATION${colorOffPalette.length === 1 ? '' : 'S'}`)
  // Group by hex value for readability
  const grouped = {}
  for (const v of colorOffPalette) {
    grouped[v.value] = grouped[v.value] || []
    grouped[v.value].push(v)
  }
  for (const [val, list] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${val}  (${list.length} use${list.length === 1 ? '' : 's'})`)
    for (const v of list.slice(0, 3)) {
      console.log(`     ${rel(v.file)}:${v.lineNo}`)
    }
    if (list.length > 3) console.log(`     … and ${list.length - 3} more`)
  }
}

console.log('')
if (colorTypeIdentityNeedsToken.length === 0) {
  console.log('✅ Type-identity tokens: not yet defined, no flags')
} else {
  console.log(`⚠️  Type-identity hex still inline (${colorTypeIdentityNeedsToken.length} uses) — pending --type-* migration`)
  const grouped = {}
  for (const v of colorTypeIdentityNeedsToken) {
    grouped[v.value] = (grouped[v.value] || 0) + 1
  }
  for (const [val, count] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${val}  ×${count}`)
  }
}

console.log('')
if (failed) {
  console.log('━━━ ❌ FAILED — fix violations or add to allowed tokens ━━━')
  process.exit(1)
}
console.log('━━━ ✅ ALL RULES CLEAN ━━━')
process.exit(0)
