# spikes/

Superseded / throwaway code, kept for reference but **excluded from the shipped build and the
quality gate** (see `.eslintrc.cjs` `ignorePatterns` and `jest.config.cjs` `testPathIgnorePatterns`,
and the electron `build.files` glob which only packages `src/**`).

The spike rule (owner): *Swiss cheese is fine in a spike.* Spike code does not get backfilled to the
coverage threshold — that would be testing throwaway. It gets **moved here and labeled** so the
coverage number stops counting it as untested shipped product. A 4%-covered file honestly in
`spikes/` is not a bug; a 4%-covered file in a shipped path pretending to be product is.

## legacy-vanilla-renderer/

The original modular vanilla renderer, superseded by the React UI (`ui/` → `src/renderer-dist/`).
`src/main/index.js` loads `renderer-dist/index.html` when present (it is) and only falls back to the
vanilla `src/renderer/index.html` — which uses a **self-contained inline script** and does not load
any of these modules. Nothing shipped imports them. Last meaningful change: 2026-04-10.

Product-vs-spike triage of the four renderer files called out in the coverage-debt finding
(before-move statement coverage in parentheses):

| File | Before | Wired in a shipped path? | Call |
|------|-------:|--------------------------|------|
| `js/app.js` (was `src/renderer/js/app.js`) | 22.4% | No — not loaded by any HTML | **spike → relocated** |
| `js/renderer/search.js` (`DocSearch`) | 4.9% | No — no script tag / import | **spike → relocated** |
| `js/renderer/sidebar.js` (`Sidebar`) | 11.1% | No — no script tag / import | **spike → relocated** |
| `js/renderer/tabs.js` (`Tabs`) | 4.8% | No — no script tag / import | **spike → relocated** |

Decision: **all four are spike/legacy, not product.** They are unwired (the shipped renderer is the
React bundle; the vanilla fallback reimplements its logic inline), superseded, and untouched for
months. Backfilling them to 85% would be testing dead code, which the spike rule forbids. Relocated
here so the shipped coverage denominator reflects real product.

`superseded-tests/` holds their old "surface" smoke-tests (which only `require()`d the modules to
register incidental coverage — the theater in miniature). They are frozen here, not run.

Sibling modules `src/renderer/js/renderer/markdown.js` and `json.js` were **kept in `src/`**: they are
genuinely tested libraries (93–94%) and out of scope for this triage.

If the vanilla renderer is ever fully retired, this directory can be deleted outright.

## s73-antagonist/

`antagonist.js` — the S73 main-process LLM caller (`generate` + `loadGovernance`). **0% covered**,
unwired: its IPC handlers and preload exposure were removed 2026-07-11 (see the "retained but
unwired" comments in `src/main/index.js` and `src/main/preload.js`, now pointing here), and the UI
route was removed too. It is parked spike for the deferred S73 Phase A/B PRs, and it hardcodes a
personal governance path (`C:\Users\JamesGifford\...\CLAUDE.md`), so it is not shippable as-is.

Decision: **test-or-delete → resolved as delete-from-shipped via relocation.** Backfilling a parked
spike to 85% is the "don't backfill throwaway" anti-pattern; testing it would also imply it's product,
which contradicts the antagonist's retirement from this app. Relocated here so it stops inflating the
shipped coverage denominator, while preserving the code and its re-entry notes for the S73 wiring PR.
(Relocated rather than `rm`'d because this working tree's mount blocks `unlink`; relocation is the
equivalent — it is out of `src/**`, so out of the build and the coverage denominator.)
