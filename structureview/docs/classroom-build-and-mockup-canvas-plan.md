# Plan — Classroom Build + Mockup Canvas Spike

> **Status:** Proposal — pending owner review and segment numbering (this may be S73 PR-family
> work or a new segment; the owner assigns S-numbers, not this doc). Source assessment:
> `ai-maturity-learning-platform/docs/structureview-viability.md` (2026-07-11). Follows the
> house pattern established by `S73-PR1-spec-author-spike.md`: small PR-shaped increments,
> each with verification, feeding the governed spec later.

## Why now

The learning platform's UI-surfaces track (B1D) and structured-output capstone (B4) have a
documented pedagogy problem: Markdown/JSON read as "coded languages" to Tier 1–2 learners.
The staircase fix is to let learners *produce structure spatially* and meet its text form as
a reveal — and StructView already owns every hard part (JSON tree renderer, React shell,
spike pattern, download/autosave conventions). Two workstreams, deliberately small.

---

## Workstream A — Classroom Build (1 session)

Ship the Milestone-1 viewer to a cohort without inviting questions the course doesn't answer.

**PR A1 — classroom flag + pruning**

- Build-time flag (`CLASSROOM=1` env → Vite define, or a `classroom` field in a build
  config) that: hides **Login** and **Antagonist** nav items, hides the upgrade CTA in the
  TIMC panel, and strips the S69-flagged mock data (`Documents 5`, `EARS 247`, corpus stats
  card, `timc-samples.js` seeding).
- Keep: viewer, sidebar/search, tabs, raw-source toggle, **Spec Author** (optional second
  flag — fluent cohorts want it, aware cohorts don't need the nav item).
- No behavior changes outside the flag. Tests: flag on/off snapshot of nav items.

**Acceptance:** a Tier 1 learner, handed the installer and a one-page handout, opens a
provided `.md` artifact within 5 minutes unaided; nothing on screen references auth,
upgrades, or agents.

**Distribution decision needed (owner + client IT):** nsis installer (SmartScreen risk if
unsigned) vs. appx/Store path vs. IT-pushed zip of `out/`. Engineering is done either way;
this is a conversation, not code.

**Handout:** lives in the learning platform (`ai-maturity-learning-platform`), not this
repo — "install, open your first artifact" (the respectable form of idea #51; Git clone
ceremony deferred to aware-eng).

---

## Workstream B — Mockup Canvas Spike (1–2 sessions + 1 to class-ready)

**The design center: the canvas state IS the JSON.** The activity's data model mirrors the
B1D deliverable exactly, so "Reveal JSON" is a view toggle, not a converter.

**Data model** (aligned to B1D: layout regions → components → data elements → states):

```json
{
  "screen": "invoice-list",
  "regions": [
    {
      "name": "header",
      "type": "header",
      "components": [
        { "name": "CustomerName", "dataElements": ["customer.name"], "states": ["populated"] }
      ]
    }
  ]
}
```

**PR B1 — the spike** (mirror PR1's shape: one lazy route, no scope creep)

- `ui/src/pages/MockupCanvas.tsx`, lazy-loaded `/mockup` route + Sidebar nav item.
- Click-to-add region boxes on a simple CSS grid; region name + type from the B1D
  vocabulary (header / sidebar / content / footer / overlay). Click a region → add
  component rows; per component: data-element chips, state tags (default / loading /
  empty / error / populated). **No drag-drop dependency in the spike** — click-to-add +
  arrow-key nudge; @dnd-kit is a fast-follow only if the feel demands it.
- **Reveal:** button flips the right pane to the existing JSON tree renderer fed by canvas
  state. Caption, verbatim from the curriculum: *"a more precise version of what you
  already drew."*
- Persistence per SpecAuthor conventions: localStorage single-slot autosave,
  `Download .json` (slugged from screen name).
- Verification: `npm run ui:build` clean; canvas → reveal → download round-trip on a real
  screen description.

**PR B2 — class-ready**

- B1D deliverable check: a lint pane that mirrors the lesson's acceptance (≥3 regions, ≥3
  states incl. one error/empty, data elements present) — emerging/working/strong, same
  vocabulary as the lesson rubric.
- `Download .html` — the same state as a skeleton HTML file (`ui-layout-[screen].html`),
  which IS the B1D deliverable artifact.
- Empty/error states for the canvas itself; tests to pass `quality-gate`.

**Fast-follows (explicitly not now):** @dnd-kit drag/resize, TIMC-style scoring of the
description completeness, template gallery, Storybook config export (B4's use case — a
natural PR B3 when a cohort reaches B4).

**Scope fence (the placemat rule):** if a feature is not required to produce the B1D
deliverable, it is out of this workstream. S73's antagonist and authoring roadmap are
untouched; this consumes the shell, it does not redirect the program.

---

## Sequencing and effort

| Order | Item | Effort | Unblocks |
|---|---|---|---|
| 1 | PR A1 classroom flag | 1 session | B-series cohorts use StructView as the artifact tool |
| 2 | PR B1 mockup spike | 1–2 sessions | B1D taught with reveal instead of "trust me, JSON is fine" |
| 3 | PR B2 class-ready | 1 session | Misconception-log build trigger satisfied in advance |

A and B are independent; A first only because it's smaller and ships value to the nearest
cohort. Both are session-sized for the spec-driven working setup (point a session at this
doc the way C5 was built from its spec).

## Decision log (owner)

1. **Numbering/governance:** S73 PR-family, or new segment? (This doc renames on decision.)
2. **Classroom flag mechanism:** env/Vite define vs. build config file.
3. **Distribution:** nsis / appx / IT zip — client-IT dependent.
4. **Spec Author in classroom build:** hidden for aware cohorts, visible for fluent?
5. **@dnd-kit:** spike without (recommended), revisit after first cohort touch.
