/**
 * Smoke test — confirms the Jest runner is wired and the version helper
 * exposes the package version. RED first (no version.js yet) then GREEN.
 *
 * CCQG: Practice 6 (Test First). This test was committed BEFORE its
 * production module existed.
 */
const pkg = require('../package.json');
const { getVersion } = require('../src/lib/version');

describe('version helper', () => {
  test('returns the package.json version string', () => {
    expect(getVersion()).toBe(pkg.version);
  });

  test('returned value is a non-empty semver-shaped string', () => {
    expect(getVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
