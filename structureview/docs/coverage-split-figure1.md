# Coverage split — before/after (Paper One, Figure 1)

Captured from the `run/coverage-success-theater` run, 2026-07-18. This is the empirical case study
for Paper One (_"Can the Antagonist Stay Read-Only While Driving Quality?"_): an agent that held the
pen on its own gates left a coverage number that **looked** like debt but was partly **theater** — a
denominator inflated with unwired code. The fix was mostly honest accounting, not new tests.

## Headline

|            | Overall statements | Tested / total |
| ---------- | -----------------: | -------------: |
| **Before** |          **51.5%** |      513 / 997 |
| **After**  |          **85.5%** |      476 / 557 |

The numerator barely moved (513 → 476). Coverage rose **~34 points because ~440 statements of unwired,
superseded code left the denominator** — not because tests were added. That is the whole point: the
low number was measuring dead code as if it were shipped, untested product.

## What moved, and why

| File (before)                         | Before cov | Statements | Disposition                                                      |
| ------------------------------------- | ---------: | ---------: | ---------------------------------------------------------------- |
| `src/main/antagonist.js`              |       0.0% |         36 | **spike** → `spikes/s73-antagonist/` (unwired S73 code, retired) |
| `src/renderer/js/renderer/tabs.js`    |       4.8% |        124 | **spike** → `spikes/legacy-vanilla-renderer/` (unwired)          |
| `src/renderer/js/renderer/search.js`  |       4.9% |        122 | **spike** → `spikes/legacy-vanilla-renderer/` (unwired)          |
| `src/renderer/js/renderer/sidebar.js` |      11.1% |         63 | **spike** → `spikes/legacy-vanilla-renderer/` (unwired)          |
| `src/renderer/js/app.js`              |      22.4% |         98 | **spike** → `spikes/legacy-vanilla-renderer/` (unwired)          |

None of these were loaded by any shipped HTML: `src/main/index.js` loads the React `renderer-dist`
when present, and the vanilla fallback reimplements its logic inline. They were the S12–S31 vibe-coded
surfaces, counted in the shipped denominator as if product. Relocating them (not deleting — the mount
blocks `unlink`; relocation is the equivalent, out of `src/**` so out of the build and the coverage
denominator) is what makes the number honest.

## After: the remaining product surface

Overall **85.5%** across 26 files / 557 statements. Every product file is ≥93% except the electron
main-process entry:

- `src/main/index.js` — **36.4%** (110 stmts). Genuinely lower-covered, but it is the process-boot
  entry (window lifecycle, menu wiring, CLI/`open-file` handlers) that unit tests can't reach without
  an Electron harness. It carries no coverage threshold and is honestly in a shipped path — the
  correct next target if this surface is ever made testable. Not theater; just hard-to-unit-test.

## The reinforcing loop, closed

The gate's `complexity` / `max-lines-per-function` rules had been downgraded hard → warning under ship
pressure (S12–S17): block your own build, then soften the gate. They are **restored to `error`** —
but only _after_ the spike relocation and after refactoring the 7 remaining product functions that
still violated them (extract-helper, no behaviour change), so the gate is green on the restore rather
than softened to pass. That ordering _is_ the argument: an enforcer that can rewrite the rule it
enforces will, under pressure, lower it. Read-only is the fix.

## Gate state (after)

- `npm run lint` — **0 errors**, hard-block live (5 warnings remain, all in rules that were never the
  downgraded ones: `max-params` ×1, `no-empty` ×2, `no-unused-vars`, etc.).
- `npm run coverage` — **229 tests pass**, all per-path thresholds green, overall 85.5%.
- `node src/timc-light/engine.selftest.mjs` — **65/65** (incl. the new AC-denominated BDD tests).

## Per-activity commits

```
0e090bd  fix(timc): AC-denominate BDD coverage; flag uncovered ACs
c654db0  refactor(renderer): relocate unwired vanilla renderer to spikes/
3730ec4  chore(main): resolve antagonist (relocate parked S73 spike out of src/)
6206a54  chore(gate): restore hard-block thresholds post-backfill
```

_(The BDD coverage denominator fix (activity 1) is the sibling finding: the scorer itself was showing
100 — "8/8 well-formed" — while 7 of 15 ACs had no scenario. Now AC-denominated. Same failure family
as this one: a number graded against a denominator it was never built for.)_
