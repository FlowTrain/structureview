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
    complexity: ['warn', 10],
    'max-lines-per-function': ['warn', { max: 40, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 5],
  },
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', 'src/renderer/js/vendor/'],
};
