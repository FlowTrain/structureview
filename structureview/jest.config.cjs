module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/__helpers__/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/renderer/js/vendor/**',
    // ESM engine (verified via `npm run timc:test`) and built UI output are not
    // instrumented by the CommonJS jest setup.
    '!src/timc-light/**',
    '!src/renderer-dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    'src/lib/**/*.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/tokens/**/*.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/parsers/**/*.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/auth/**/*.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/components/**/*.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/views/**/*.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/main/preload.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/main/ipc-auth.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/main/setup-auth.js': { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/renderer/js/renderer/markdown.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/renderer/js/renderer/json.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  clearMocks: true,
};
