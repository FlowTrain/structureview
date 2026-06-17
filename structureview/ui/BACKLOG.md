# StructureView UI — backlog

Tracked UI follow-ups (not yet implemented). Newest first.

## Future capabilities (shared Electron + web — needs research)

These are larger product capabilities that should live in **both** the Electron app and the
enterprise web app (consume `@trainyard/ui`; only the shell differs). Not scoped yet.

- **In-tool spec authoring — WYSIWYG Markdown + ADF editor.** Author specs directly in the
  tool with a WYSIWYG editor that round-trips traditional Markdown *and* ADF (Atlassian
  Document Format) for Confluence/Jira. High-value paired with the live TIMC Light analysers:
  author a spec → see EARS / Sections / BDD quality update as you write. Research: editor
  engine (e.g. ProseMirror/TipTap), MD↔ADF conversion, schema fidelity.

- **Dual-terminal / dual-LLM chat — CCQG real-time quality antagonist.** A two-terminal,
  two-LLM surface to run the LemonAid server experiment and the full CCQG real-time quality
  antagonist (CCQG CL) — one model generating, one critiquing against the quality gates,
  live. Research: terminal/PTY in Electron vs web (xterm.js), provider wiring, transcript
  capture, how it ties into the engine + gates.

## From 2026-06-16 review

- **Real EARS feedback view (green/yellow/red).** When a doc is selected, offer the original
  per-requirement EARS analysis — each requirement line shown with pass/warn/fail coloring —
  but driven by the live engine findings (not the old mock REQ-001… data, which was removed
  with the document reader). Likely an inline annotation layer in the reader, or a sub-view
  toggled alongside Document.

- **BDD-tab upgrade copy.** On the **BDD** mode tab, the "Upgrade to Quality Guardian" message
  still talks about EARS requirements (it's keyed to the EARS/JSON `ctaSignal`). On the BDD
  tab it should reference the **BDD Generator** (generating/repairing Gherkin scenarios).
  Make the CTA copy mode-aware.

- **Count mismatches / mock counts.** Several counts are hardcoded prototype values, not real:
  - Left-nav badges (`Documents 5`, `EARS Analysis 247`) don't reflect the loaded file count.
  - Corpus stats card (`Total requirements 184`, `5 files`, PASS/WARN/FAIL tallies) is mock.
  Wire these to real values or remove them.

- **Doc-item row spacing.** In the narrow Documents column, the match-count badge, score pill,
  and × remove button crowd/overlap. Tighten the row layout (e.g. fixed widths / wrap).

## Earlier / known

- **Reader width.** The document reader sits in the center ⅓ column. Consider a wider reading
  layout (reader-dominant, analysis as a narrow rail) — pending direction.

- **highlight.js size.** Using `highlight.js/lib/common` (~110 KB gzip). If size matters,
  switch to `lib/core` + register only the languages specs actually use (js, ts, json, bash,
  yaml, python, gherkin).

## Platform / S69

- **Token remap.** `flowtrain.css` (+ the `.doc-reader` styles) is prototype-tier; remap to
  `@trainyard/ui` tokens (S32-derived) when the design system extraction lands (S69).
- **Engine relocation.** Hoist `src/timc-light` (`@trainyard/timc-light`) to a shared
  `packages/` workspace or its own repo so the web platform consumes it as a dependency.
