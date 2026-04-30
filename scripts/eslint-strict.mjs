// Standalone strict scan for no-undef + react-hooks/exhaustive-deps + no-restricted-syntax
import { ESLint } from 'eslint'
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
      files: ['**/*.{js,jsx}'],
      languageOptions: {
        ecmaVersion: 'latest',
        parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        globals: { window: 'readonly', document: 'readonly', localStorage: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', fetch: 'readonly', URL: 'readonly', Audio: 'readonly', Image: 'readonly', Date: 'readonly', Math: 'readonly', JSON: 'readonly', Object: 'readonly', Array: 'readonly', Set: 'readonly', Map: 'readonly', String: 'readonly', Number: 'readonly', Boolean: 'readonly', Promise: 'readonly', parseInt: 'readonly', parseFloat: 'readonly', isNaN: 'readonly', alert: 'readonly', navigator: 'readonly', performance: 'readonly', AudioContext: 'readonly', webkitAudioContext: 'readonly', module: 'readonly', require: 'readonly', process: 'readonly', __dirname: 'readonly', Buffer: 'readonly' }
      },
      rules: {
        'no-undef': 'error',
        'no-unused-vars': 'off',
        'no-empty': 'off',
        'no-dupe-keys': 'error',
        'no-unreachable': 'error',
        'no-self-assign': 'error',
        'no-cond-assign': 'error',
        'no-constant-condition': 'error',
        'no-dupe-else-if': 'error',
        'no-duplicate-case': 'error',
        'no-fallthrough': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      }
    }
  ]
})
const results = await eslint.lintFiles(['src/App.jsx'])
const formatter = await eslint.loadFormatter('stylish')
const out = formatter.format(results)
console.log(out)
console.log(`\n--- ${results[0]?.errorCount || 0} errors, ${results[0]?.warningCount || 0} warnings ---`)
