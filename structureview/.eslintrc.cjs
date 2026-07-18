/** CCQG Quality Gate — ESLint config. */
module.exports = {
  root: true,
  env: { node: true, browser: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
  extends: ['eslint:recommended'],
  // Script-tag-loaded renderer modules expose themselves as globals.
  // Properly modularised in Batch 2.
  globals: {
    marked: 'readonly',
    hljs: 'readonly',
    Tabs: 'readonly',
    Sidebar: 'readonly',
    MDRenderer: 'readonly',
    JSONRenderer: 'readonly',
    DocSearch: 'readonly',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    // Legacy code has empty catches; downgraded to warning, cleaned in Batch 2.
    'no-empty': 'warn',
    // HARD-BLOCK (restored 2026-07-18 after the coverage/spike backfill). These two were
    // downgraded hard->warning under ship pressure (the S12–S17 loop); with the spike code
    // relocated and the remaining product functions refactored, they are back to error so the
    // gate can't be quietly softened again. max-params/no-empty stay warnings (not the downgraded
    // rules).
    complexity: ['error', 10],
    'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 5],
  },
  overrides: [
    {
      // The TIMC Light engine is framework-free ESM (consumed by the React bundle).
      files: ['src/timc-light/**/*.js', '**/*.mjs'],
      parserOptions: { sourceType: 'module' },
    },
    {
      // Test suites are legitimately long (many describe/it blocks) — the length/complexity
      // hard-block targets product code, not the tests that exercise it.
      files: ['**/__tests__/**/*.js', '**/*.test.js'],
      rules: { 'max-lines-per-function': 'off', complexity: 'off' },
    },
  ],
  // ui/ is a self-contained Vite + TypeScript project with its own toolchain;
  // src/renderer-dist/ is its build output. Neither is linted by the Electron app config.
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'src/renderer/js/vendor/',
    'ui/',
    'src/renderer-dist/',
    // Spike / superseded code is intentionally exempt from the gate — "Swiss cheese is fine in a
    // spike." The legacy vanilla renderer (unwired, replaced by the React UI) lives here so it
    // stops inflating the shipped coverage denominator. See spikes/README.md.
    'spikes/',
  ],
};
