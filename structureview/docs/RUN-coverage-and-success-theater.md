# Run — Kill the Success Theater + Pay the Coverage Debt

> **Self-contained work order, in-repo** (lives here on purpose — a fresh-sandbox agent clones this
> repo and must find everything it needs *inside* it; do not reference files above the repo root).
> Prepared 2026-07-18. Everything it references — `AGENTS.md`, `CLAUDE.md`, `docs/BUILD-BACKLOG.md` —
> is in this repo. **Prereq: this file and the BUILD-BACKLOG edits it points to must be committed and
> pushed to the run branch before the sandbox is refreshed** (see the "Publish before you hand off"
> note at the bottom — this run exists because that step was skipped once already).

## Kickoff (paste into a fresh session on the run branch)

> Execute `docs/RUN-coverage-and-success-theater.md`. Read `AGENTS.md` + `CLAUDE.md`, then the "BDD
> coverage success theater" and "Coverage debt" items in `docs/BUILD-BACKLOG.md`. Keep
> `npm run quality-gate` green after every activity. Stop-and-log any `[NEEDS OWNER]`.

## Context contract (read these, in this repo, then stop)

1. `AGENTS.md` + `CLAUDE.md` — constitution.
2. `docs/BUILD-BACKLOG.md` — the two findings (BDD coverage denominator; coverage debt) with the fixes.
3. The last `npm run quality-gate` output (51% overall; renderer 4–23%; `antagonist.js` 0%;
   `bdd-coverage.js` 73 lines / complexity 22; 33 warnings, all function-length/complexity).

## Guardrails

- `npm run quality-gate` green after **every** activity.
- No new mock data.
- **Spike rule (owner):** Swiss cheese is fine *in a spike*. Do NOT backfill throwaway code — decide
  **product vs spike per file**; product gets tests, spike gets *moved/labeled* so the coverage number
  stops lying. A 4% file in `ui/` claiming shipped is the bug; a 4% file honestly in `spikes/` is not.
- **Do NOT re-promote the gate config to hard-block until activities 1–3 are done.** Blocking your own
  build then softening the gate is the exact reinforcing loop Paper One is about — don't reproduce it.

## Activities (small → big; one commit each)

1. **Fix the BDD coverage denominator.** `src/timc-light/signals/bdd-coverage.js` — coverage becomes
   **AC-denominated** ("N of M ACs have a well-formed scenario") and **flags the missing ACs by id.**
   Keep "well-formed" as a separate secondary check on scenarios that exist. Refactor the complexity-22
   function while you're in it. Commit: `fix(timc): AC-denominate BDD coverage; flag uncovered ACs`.
2. **Product-vs-spike triage of the renderer** (`search.js`, `sidebar.js`, `tabs.js`, `app.js`). Per
   file: product → backfill to the 85% threshold; spike → relocate to `spikes/`/label and exclude from
   the shipped coverage denominator. Record the call per file in the commit body.
   Commit: `test(renderer): backfill product surfaces; relabel spikes`.
3. **`antagonist.js` (0% cover): test-or-delete.** Unwired S73 spike code — deleting is defensible; if
   kept, it gets tests. Log the decision + reason. Commit: `chore(main): resolve antagonist (test|remove)`.
4. **Re-promote gate to hard-block** — function-length/complexity warning→error — **only after 1–3.**
   Commit: `chore(gate): restore hard-block thresholds post-backfill`.

## Acceptance

- [ ] BDD coverage is AC-denominated; uncovered ACs flagged by id.
- [ ] Renderer files each ≥85% **or** honestly in `spikes/` (no file faking coverage in a shipped path).
- [ ] `antagonist.js` resolved (tested or removed), decision logged.
- [ ] Gate hard-block restored; `npm run quality-gate` green.
- [ ] **Before/after coverage split captured** — this is Paper One's Figure 1.
- [ ] Per-activity commits present.

## Where to point the agent (the doubled-mount gotcha)

This repo nests: `structureview/` (git root, `.git`) → `structureview/structureview/` (the npm project —
`package.json`, `docs/`, `src/`). **Point the agent's folder at the inner app dir:**
`…/trainyard-all-repos/structureview/structureview`. There `docs/RUN-…` and `npm run quality-gate` both
resolve, and git walks up to the outer `.git` on its own. Pointing one level off is what sends an agent
searching for files that are "just outside what it can see."

## Two execution models — two rules (don't conflate them)

- **Local Cowork folder run** (agent reads the mounted working tree): **no push needed.** It sees
  uncommitted files directly. Just point the folder at the inner app dir (above) and go.
- **Remote / Dispatch clone run** (agent clones from the git remote): **commit + push first**, because a
  fresh clone can't see uncommitted local work:
  1. work-order doc lives **inside the target repo** (`docs/`), self-contained;
  2. `git checkout -b run/<name>` → commit the brief **and** the docs it references;
  3. `git push -u origin run/<name>`; 4. then refresh the sandbox / point the agent at the branch.

The original failure was a work order left in a file **above the repo root** (the fleet folder isn't a
git repo) — invisible to *either* model. Keep the brief in-repo; that fixes both.
