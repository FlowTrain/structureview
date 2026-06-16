// Sample documents used to demonstrate the TIMC Light engine end-to-end in the bundled UI.
// Each is analysed live by src/timc-light/engine.js — no hardcoded scores.
// (Phase 3 replaces these with the file the user actually opens, via preload IPC.)

export const SAMPLES = {
  prd: {
    hint: 'markdown',
    content: `## PRD 2024 v2.4

- The system shall persist every authentication attempt to an immutable audit log.
- When a user submits the login form, the system shall validate credentials within 200ms.
- While the account is locked, the system shall reject all sign-in attempts.
- If the rate limit is exceeded, then the system shall return HTTP 429.
- Where the tenant is on the enterprise plan, the system shall enable SSO.
`,
  },
  arch: {
    hint: 'markdown',
    content: `## Architecture SYS-001

- The system shall expose a health endpoint.
- The gateway routes requests to services.
- When a node fails, the system shall reroute traffic automatically.
- Caching should be fast and reliable.
`,
  },
  security: {
    hint: 'markdown',
    content: `## Security Spec

- The system shall encrypt all data at rest using AES-256.
- When a session token expires, the system shall require re-authentication.
- If three failed logins occur, then the system shall lock the account.
- Where MFA is enabled, the system shall require a second factor.
`,
  },
  testplan: {
    hint: 'markdown',
    content: `## Test Plan Q4

- The system shall run the full regression suite on every release branch.
- When coverage drops below 85%, the system shall fail the build.
- Tests run nightly.
- While in maintenance mode, the system shall skip destructive tests.
`,
  },
  api: {
    hint: 'json',
    content: JSON.stringify(
      {
        items: [
          { id: 1, name: 'gateway', region: null, owner: null },
          { id: 2, name: 'auth' },
          { ref: 'x9', status: 'degraded' },
        ],
        nested: { a: { b: { c: { d: { e: { f: 'deep' } } } } } },
      },
      null,
      2
    ),
  },
};
