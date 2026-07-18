# Work Order — StructureView: JSON→UI Activity + Bug Fixes (full batch)

> **A cold-start hand-off.** A fresh agent (Claude Code, or Dispatch as a proof-point run) should
> be able to execute this without the owner in the room. **Scope: the full batch** — three
> activities, ordered small → big → cleanup, each independently shippable. Each **must leave
> `npm run quality-gate` green.** If you can't keep the gate green, stop and report — do not ship
> drift. That rule is the whole point of this fleet.
>
> Prepared 2026-07-11. Route to Claude Code, or hand to Dispatch (this doubles as Dispatch's first
> real work order — see §5).

## 0. How to start (context contract — read these, in this order, then stop reading)

Pin only what you need; don't accumulate the whole repo (context rot is real). Required reading:

1. `AGENTS.md` + `CLAUDE.md` (repo root) — the constitution. Non-negotiables, output standards.
2. `docs/BUILD-BACKLOG.md` — the running punch list these activities come from.
3. `docs/classroom-build-and-mockup-canvas-plan.md` — full detail for Activity 2 (Workstream B,
   PR B1 then B2). Build what's specified; do not re-derive it.
4. `docs/fleet-packaging-and-spikes-spec.md` §4 (the spike lane) — only if Activity 2's landing
   location (`ui/` vs `spikes/`) is unclear.

That's the context contract. Everything else is retrieved just-in-time per activity.

## 1. Guardrails (non-negotiable — same posture as the CCQG Auditor)

- **Quality gate green after every activity.** `npm run quality-gate` (lint + coverage). It's
  currently green (antagonist main-process unwired 2026-07-11); keep it that way.
- **Do NOT touch `src/main/antagonist.js`** or re-wire the antagonist main process — that's
  retained-but-unwired spike code; re-wiring needs a contract-test update + Decision Log entry.
  (Activity 3 removes the *React route*, which is different — see §4.)
- **Per-activity commits.** One activity = one focused commit/PR. No mega-commits.
- **Real work only.** Activity 1 removes fake data; don't add new mock data anywhere.
- **If a decision is genuinely the owner's, stop and log it** (`[NEEDS OWNER]`) — don't guess.

## 2. Activity 1 — Fix the CORPUS panel (bug + mock purge) · SMALL · do first

**Why first:** small, self-contained, proves the loop end-to-end (edit → gate green → commit).

**The bug:** `ui/src/pages/StructureView.tsx` (~line 442) — the "Corpus" stats panel shows
hardcoded JSX (`5 files`, `184`, `PASS 3 / WARN 1 / FAIL 1`). It reads nothing; same numbers
whether 0 or 80 files are open.

**Do:**
- Replace the hardcoded Corpus block with values **derived from the live `docs` state** via
  `useMemo`: file count = `docs.length`; total requirements = sum of each doc's TIMC analysis
  count; PASS/WARN/FAIL = count docs by composite score (>80 / 60–80 / <60), using the analysis
  path the page already calls (`src/timc-light/engine.js`; don't invent a second one).
- **Purge the fake sample data** (S69 disposition): `ui/src/timc-samples.js` seeding of
  `SAMPLE_DOCS`, and mock nav badges (`Documents 5`, `EARS 247`, corpus `184`). Empty state reads
  honestly ("No documents open — Open folder").

**Acceptance:**
- [ ] Open 0 files → Corpus shows 0 / empty, not `184`.
- [ ] Open N real files → counts + buckets reflect them, live.
- [ ] No hardcoded corpus numbers or `timc-samples` seeding remain on the shipping surface.
- [ ] `quality-gate` green. Commit: `fix(ui): wire Corpus panel to live docs; purge sample data`.

## 3. Activity 2 — JSON→UI Mockup Canvas (2 UI spike items) · BIG · the main event

**Spec:** `docs/classroom-build-and-mockup-canvas-plan.md` (Workstream B, PR B1 then B2). Build
what's specified — do not re-design.

**Item B1 — the spike:**
- New **lazy-loaded** `/mockup` route → `ui/src/pages/MockupCanvas.tsx` + a Sidebar nav item.
- Click-to-add region boxes on a CSS grid; region type from the **B1D vocabulary**
  (header / sidebar / content / footer / overlay). Click a region → component rows; per component:
  data-element chips + state tags (default / loading / empty / error / populated). **No drag-drop
  dependency** (click-to-add + arrow-key nudge; @dnd-kit is a later fast-follow).
- **The reveal:** a button flips the right pane to the **existing JSON tree renderer**
  (`src/renderer/js/renderer/json.js` path) fed by canvas state. Caption verbatim:
  *"a more precise version of what you already drew."* Canvas state model **is** the B1D
  deliverable JSON (regions → components → dataElements → states) — reveal is a view toggle.
- Persistence per SpecAuthor: `localStorage` single-slot autosave, `Download .json` (slugged).

**Item B2 — class-ready:**
- A lint pane mirroring the **B1D acceptance** (≥3 regions, ≥3 states incl. one error/empty, data
  elements present) shown emerging / working / strong.
- `Download .html` — canvas state as a skeleton `ui-layout-[screen].html` (the B1D artifact).
- Empty/error states for the canvas itself; new tests pass the gate.

**Acceptance:**
- [ ] `npm run ui:build` clean; `/mockup` lazy-loads (not in main bundle until opened).
- [ ] Canvas → reveal → `Download .json` round-trips on a real screen; output validates against
      the B1D deliverable shape; `Download .html` yields a usable skeleton.
- [ ] `quality-gate` green. Commits: `feat(ui): mockup canvas spike (B1)` then
      `feat(ui): mockup canvas class-ready — B1D lint + html export (B2)`.
- [ ] **[NEEDS OWNER]** — land in `ui/` (product feature) or `spikes/` (fleet-packaging §4)?
      **Default `ui/`** unless told otherwise; record the choice.

## 4. Activity 3 — Cleanup · SMALL · do last

**3a — Remove the Antagonist React route/page.** Main process is already unwired; the
`/antagonist` route (`ui/src/pages/Antagonist.tsx`) + Sidebar nav item still ship and would call a
missing bridge. Remove the route + nav item (leave `Antagonist.tsx` on disk; just stop routing).
- [ ] No Antagonist nav item/route in the shipping UI. App builds. Gate green.

**3b — Cross-file search → in-doc highlight.** StructView already has in-doc search
(`src/renderer/js/renderer/search.js`, Ctrl+F, match nav). When a result opens from a
**cross-file** search, carry the query into the document view and fire the existing highlight +
scroll-to-first-match. Wiring two existing features, not new infrastructure.
- [ ] Opening a cross-file match highlights the term + scrolls to first hit. Gate green.
- [ ] Commits: `chore(ui): remove antagonist route`; `feat(ui): carry search query into opened doc`.

## 5. If routed to Dispatch (proof-point framing)

This work order doubles as Dispatch's first real run. Success isn't just "the code works" — it's:
did Dispatch **respect the context contract** (§0, didn't over-read), **honor the guardrails**
(§1, gate green, didn't touch antagonist.js main process, added no mock data), **produce
per-activity commits**, and **stop-and-log** on the `[NEEDS OWNER]` decision instead of guessing?
Four for four = passed. The feature is secondary to the governance — an agent you can trust is one
that stays inside its constitution under real work.

## 6. Definition of Done (whole work order)

- All three activities' acceptance boxes checked (or `[NEEDS OWNER]` logged with the reason).
- `npm run quality-gate` green on the final state.
- Per-activity commits present, each scoped.
- The Activity 2 landing-location decision (`ui/` vs `spikes/`) recorded.
- No new mock data; antagonist.js main process untouched; no scope creep beyond these three.
- Report written back (§7).

## 7. Report-back format

```
## Work Order Report — <date> — <agent: Claude Code | Dispatch>
- Activity 1 (Corpus): DONE | BLOCKED — <one line>
- Activity 2 (Mockup Canvas B1/B2): DONE B1 / B2 | PARTIAL — <one line>; landed in <ui/ | spikes/>
- Activity 3 (Cleanup 3a/3b): DONE 3a / 3b | PARTIAL — <one line>
- Quality gate: GREEN | RED — <if red, why>
- [NEEDS OWNER] decisions surfaced: <list, or none>
- Commits: <hashes/messages>
- Notes / surprises: <anything the owner should know>
```

*Owner note: this is your third big-three item, full batch. When the report comes back green, that
loop closes — star it in the weekly review.*
