# PR 1 — Spec Author spike (S73)

> First PR for **S73 — StructureView spec authoring & quality antagonist**. Delivers the
> in-tool authoring spike: a WYSIWYG editor that round-trips Markdown and runs the live
> `@trainyard/timc-light` analysers as you type. De-risks the S73 §9 editor decision.

## Summary

Adds a `/author` route — **Spec Author** — to the StructureView renderer. It's a TipTap
(ProseMirror) editor seeded with the CCQG 10-section template. Every change is serialised back
to Markdown and scored in-process by the existing TIMC Light engine, so EARS / Sections / BDD
climb toward the 90 bar while you write. This is the "exploration → formal process" jump,
inside the tool.

## What's in

- **`ui/src/pages/SpecAuthor.tsx`** — the editor + live score pane (composite, per-signal
  bars, section checklist). Seeded with the CCQG template (10 sections + EARS + Gherkin
  blocks). Auto-saves the draft to the device; `Download .md` writes the file.
- **`ui/src/main.jsx`** — new `/author` route, **lazy-loaded** (`React.lazy` + `Suspense`) so
  TipTap/ProseMirror is code-split out of the main StructureView bundle until the page opens.
- **`ui/src/pages/StructureView.tsx`** — **Spec Author** nav item (routes to `/author`).
- **`ui/src/components/layout/Sidebar.tsx`** — `edit` (pencil) icon for the nav item.
- **`ui/package.json`** — `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`,
  `tiptap-markdown`.

## Behaviour notes

- **Autosave is device-local** (`localStorage`, single draft slot) — not repo persistence and
  nothing leaves the machine. `Download .md` is how a finished spec lands in `docs/` (filename
  is slugged from the first heading).
- **Document typography is scoped** to the editor so it reads like a spec rather than
  inheriting the app's large display/nav heading sizes.
- **Decision Log** in the template is a bullet, not a Markdown table — StarterKit ships no
  table support, so a table renders mashed together. Full table editing needs
  `@tiptap/extension-table` (fast follow).

## Verification

- `npm run ui:build` — clean (1958 modules). After the lazy split the editor is its own
  `SpecAuthor-*.js` chunk; the main bundle drops back under the 500 kB warning.
- TipTap + `tiptap-markdown` + Vite bundle verified in isolation; `getMarkdown()` feeds
  `analyse()` cleanly.
- The seed CCQG template scores **100 / 100 / 100** (EARS / Sections / BDD) through the real
  engine, confirming the round-trip preserves headings, EARS bullets, and the Gherkin block.
- Quality gate: new UI files live under `ui/`, which is excluded from ESLint, Prettier, and
  Jest coverage (engine unchanged) — no gate impact.

## S73 Decision Log — editor engine

**Finding: TipTap is viable.** The Markdown round-trip + live scoring loop works on TipTap +
`tiptap-markdown` without `@atlaskit/editor-core`. Recommend defaulting to TipTap and only
reaching for the heavier Atlaskit editor if **ADF-native** editing becomes the priority.

## Deferred (out of scope for PR 1)

- **ADF round-trip + Confluence/Jira sync** — deferred to the **Jira-plugin cycle**. The
  Atlassian connector, ADF fidelity scope, and source-of-truth/conflict handling (S73 §9) are
  picked up when the Jira plugin work comes back around.
- **Repo-file persistence** — save straight to `docs/*.md` via the Electron file APIs
  (multi-file, real persistence) instead of `localStorage`. Natural PR 2.
- **Spec tables** — `@tiptap/extension-table` for the Decision Log and similar.
- **Template enforcement** — scaffolding/guarding the 10 sections as the author writes.

## Suggested commit

```
branch: feat/s73-spec-author-spike
feat(structureview): in-tool Spec Author spike with live TIMC Light scoring (S73 PR1)
```
