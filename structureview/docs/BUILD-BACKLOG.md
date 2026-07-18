# StructureView — Build Backlog (running punch list)

> The growing doc of stuff to build. One line lands here the moment it's found, so it stops
> living in your head. Nothing here is a commitment to *when* — it's a commitment to *not forget*.
> Ordered loosely by "small + unblocks other things" first. Cross-refs to the specs that detail them.

## Bugs / cleanup (found in use)

- [ ] **CORPUS block is fake data.** `ui/src/pages/StructureView.tsx:442` — the Corpus stats panel
      ("5 files / 184 / PASS 3 / WARN 1 / FAIL 1") is hardcoded JSX wired to nothing; it never reads
      the live `docs` state, so it shows the same numbers with 0 or 80 files open. **Fix:** derive
      via `useMemo` over live `docs` + their TIMC scores (file count, summed requirements, bucket by
      composite). ~15 lines. Satisfies spike-promotion check #6 (purge mock data). Also purge
      `timc-samples.js` / the 5 sample docs on the same pass.
- [ ] **Antagonist still in the UI.** Main-process wiring removed 2026-07-11 (preload + IPC unwired;
      quality gate green). Remaining: the React route/page `ui/src/pages/Antagonist.tsx` + its nav
      item still ship. Remove or flag behind the classroom build. (Re-entry needs contract-test
      update + Decision Log entry per the unwire comments.)
- [ ] **Learning module not in the electron build.** Bring the maturity-platform content surface
      into the renderer (additive). Scope TBD.
- [ ] **tabs.js reflow violation** (`tabs.js:182`, requestAnimationFrame scroll-restore forces
      reflow, ~183ms). From the original cleanup thread — performance, not correctness.
- [ ] **BDD "coverage" is success theater — wrong denominator (owner finding, 2026-07-18).** On S85 the
      BDD panel reads **"8/8 well-formed"** (green) while the generator line says **"15 acceptance
      criteria → scenarios."** So coverage is measuring *the well-formedness of the 8 scenarios that
      exist*, not *whether all 15 ACs have one* — a green 100 while **7 ACs have no scenario.** Same bug
      family as the TIMC-rubric mismatch and the Product Family Health scope error: **a number graded
      against a denominator it was never built for.** **Fix:** coverage must be **AC-denominated** —
      "8/15 ACs have a well-formed scenario" (and flag the 7 missing by id). Keep "well-formed" as a
      *separate, secondary* quality check on the scenarios that exist; it is not coverage. A spec can't
      be allowed to show 100 while 47% of its ACs are untested — that's the exact failure StructureView
      exists to catch, committed by StructureView's own scorer. Owner's words: *"feels like success
      theater on the scores being so good."* He's right.
- [ ] **Coverage debt = the vibe-coding, measured (gate re-run 2026-07-18).** Overall 51% stmts / 49%
      branch — but the split is a *fingerprint*, not noise. Disciplined/spec-built layers are ~100%
      (auth 97–100, components 98, parsers 100, tokens 100, timc-light high); the **renderer is 4–23%**
      (`search.js` 4.9, `tabs.js` 4.8, `sidebar.js` 11, `app.js` 22) — exactly the S12–S31 vibe-coded
      surfaces. Two standouts: **`antagonist.js` = 0%** (lines 3–92, the quality enforcer has zero
      tests) and **`bdd-coverage.js`** (the success-theater scorer above) is the worst function in the
      repo — 73 lines, complexity 22. The scorer that lies about coverage is itself the least-tested,
      most-complex code. Boy Scout Rule + TDD say none of this should exist. **Fix, in order:**
      (1) backfill renderer tests (search/sidebar/tabs/app) to the 85% threshold; (2) test
      `antagonist.js` or delete it (unwired S73 spike code); (3) refactor `bdd-coverage.js` when you fix
      its denominator. **The 33 lint warnings are all function-length/complexity — the Perplexity
      hard→warning downgrades.** Re-promote the gate config to hard-block **after** the backfill, never
      before (blocking your own build then rage-quitting the gate is Paper One's reinforcing loop, live).

## Features / enhancements

- [ ] **Mockup Canvas: data-element affordance is invisible (owner UX finding, 2026-07-11).**
      Two related fixes; do both, (a) first.
      **(a) PRIMARY — the add-input placeholder is near-invisible.** The `+ data element
      (e.g. customer.name)` input renders light-grey-on-`#0a0a0f`; the one control that turns a
      component from "just text" into structured data is the quietest thing on the panel, so users
      slide past it (owner's real export: 7 components, only 3 had data elements — 4 forgotten).
      **Fix:** raise the affordance to the fleet **`--primary` (#2BAEE4)** — accent the `+` glyph /
      input border / placeholder so the eye lands on it. This is also an **accessibility fix**:
      light grey on the dark canvas almost certainly fails WCAG 2.2 AA contrast, and the design
      system already carries WCAG tokens + `--focus-ring` — cite it (regulated buyers care).
      **(b) COMPLEMENT — flag components still missing data elements.** A component with zero
      `dataElements` gets a *needs-data* cue that resolves once ≥1 is added, and it's tied to the
      B1D readiness "Data elements present" check so the canvas *points at* the exact components the
      lint counts as empty, not just the aggregate.
      **Pattern:** third instance of *finds-but-doesn't-show* (JSON reveal, search highlight, now
      data-element cue). The lint/reveal locates the gap; the surface must show it. One shared line
      in the case study — "make the structure visible" applies to the tool's own gaps too.

- [ ] **Mockup Canvas: region type defaults to `sidebar` and sticks (owner UX finding, 2026-07-12).**
      Real export: 7 regions, all `type: "sidebar"` / `name: "sidebar"` — the type selector defaults
      to `sidebar` on click-to-add and is quiet enough to slide past, so a whole layout came out
      degenerate (all one region type is not a layout). **Fix (two parts):** (a) don't default to a
      real type — new region starts `type: "untyped"` (or forces a pick) so the value is a *decision*,
      not an accident; auto-name from type + index (`content-1`, not another `sidebar`). (b) canvas
      warns when regions are all one type or names collide — surface it, don't silently accept.
      **Not a render bug:** the canvas *did* render the distinct components fine — the visual
      looked right, which is exactly why the degenerate `type` data slipped through. The surface
      accepted bad structure without complaint. That's the whole point of the fix.
      **Pattern:** fourth *finds-but-doesn't-show* instance (JSON reveal, search highlight,
      data-element cue, now region-type). Same one-liner in the case study.
- [ ] **TIMC Light applies the wrong rubric to non-API JSON (owner finding, 2026-07-12).** A B1D
      mockup deliverable scored 100 Parseability / 100 Null / 100 Key-consistency but 0 Envelope
      shape ("lacks standard API envelope data/errors/meta"), dragging composite to 87 for a
      non-defect — a mockup has no reason to carry an API envelope. **Fix:** artifact-type detection
      before rubric selection. If the doc matches the mockup shape (`screen` + `regions[]`), score it
      against the **B1D readiness rubric** (regions/states/data-elements present), not `json-response`.
      At minimum: make Envelope shape non-applicable (`n/a`, excluded from composite) when the JSON
      isn't an API response, so the score reflects real quality. This is the same lesson the evidence-
      ingestion contract teaches machines — *know what kind of thing you're looking at before you
      grade it* (`bundle_type` there = artifact-type here).
- [ ] **JSON view: format-aware header + Raw/Pretty toggle (owner finding, 2026-07-14).** The
      Document view parses and renders a *tree* (`json.js` → `jVal()`); it is NOT the original
      bytes and runs no Prettier pass — layout is re-derived from the parsed object. Two additions:
      **(a) Raw/Pretty toggle** — a `Raw JSON` button that swaps the tree for the *original text*
      pretty-printed via `JSON.stringify(parsed, null, 2)` in a `<pre>`, colored by the already-
      vendored `highlight.min.js` json grammar (no new dependency). Gives a copy-paste-able block;
      pairs with the classroom plan's "raw-source toggle."
      **(b) AUDIT-INTEGRITY banner (owner's real insight — this is the important half).** In the
      enterprise/cloud build an auditor may view stored evidence through this tree. The tree must
      *declare itself*: a small header like *"Viewing a rendered tree of a JSONL document. This is
      a readability rendering, not the stored bytes — click **Raw** to see the original data."* An
      auditor must never mistake a rendering for the source of record (FINRA 4511 / evidence-trail
      posture — same family as the evidence-ingestion contract's provenance rule). Detect and name
      the format (JSON vs JSONL vs NDJSON) in the banner. NOTE: for **JSONL** the current tree
      renderer likely `JSON.parse`s the whole blob and fails or shows only line 1 — confirm JSONL
      is parsed line-by-line before relying on the tree for `.jsonl` evidence.
      **Pattern:** same lesson as the TIMC-rubric item — *know what kind of thing you're looking
      at, and say so.*

- [ ] **Cross-file search → in-doc highlight.** Search finds which file matches but not *where*.
      Carry the query into the opened doc and fire the existing Ctrl+F highlight + scroll-to-match.
      Wiring two existing features. Detail: `docs/classroom-build-and-mockup-canvas-plan.md`.
- [ ] **MockupCanvas spike (PR B1)** + class-ready (PR B2) — the boxes→JSON reveal. Propose-stage.
      Detail: `docs/classroom-build-and-mockup-canvas-plan.md`.
- [ ] **Classroom build flag (PR A1)** — hide Login/Antagonist/upgrade, strip mock data. Same plan doc.

## Architecture / course-correction (the fleet-packaging spec)

- [ ] Extract `@trainyard/eslint-config` + `@trainyard/tsconfig`; StructureView consumes them.
- [ ] Reusable gate workflow in org `.github`; collapse the 14 workflows to stubs.
- [ ] Draw the four package boundaries + `no-restricted-imports` fence.
- [ ] Stand up `spikes/` lane; move antagonist/MockupCanvas/LemonAid in; write `docs/spike-promotion.md`.
- [ ] Spec-linter + `docs/README.md` index (bring StructureView docs to CCQG rigor).
- [ ] Evidence ingestion contract (findings.json / dependency-map → TIMC). Detail:
      `docs/evidence-ingestion-contract-plan.md`.

Full detail for the architecture items: `docs/fleet-packaging-and-spikes-spec.md`.

## Notes

- Mark items `[x]` when done; don't delete — history of what shipped is useful (supersede-don't-erase).
- New find? One line here, immediately. That's the whole discipline.
