import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

// Flat config (ESLint 9), analog zur pact-app-Migration (PR #93/#94) aber für
// einen reinen TS-Worker ohne Next: typescript-eslint recommended direkt.
// Finding f3869413dfa9: `npm run lint` war seit der ESLint-9-Anhebung tot,
// weil keine Flat-Config existierte.
export default [
  {
    ignores: ['node_modules/**', '.wrangler/**', 'public/**', 'coverage/**'],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module', ecmaVersion: 2023 },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },
]
