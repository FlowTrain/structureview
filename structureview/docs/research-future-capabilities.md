# Research starter — future capabilities

Scaffold for two backlog capabilities (both shared Electron + web; consume `@trainyard/ui`,
only the shell differs). Drop scraps/links under each heading; we stitch them into clean
specs (Job Story → BDD → EARS → spec) later. Both lean on the existing
`@trainyard/timc-light` engine and the rubric in `docs/timc-light-evaluation-criteria.md`.

---

## 1. In-tool spec authoring — WYSIWYG Markdown + ADF editor

**Goal.** Author specs in StructureView with a WYSIWYG editor that round-trips **Markdown**
(repo specs) and **ADF** (Atlassian Document Format, for Confluence/Jira sync), with the live
TIMC Light analysers scoring the doc as you type.

### Editor engine (all ProseMirror-based)

- **ProseMirror** — the foundation; everything below sits on it. Most control, most work.
- **TipTap** — React-friendly ProseMirror wrapper, great DX. No native ADF → you convert.
- **`@atlaskit/editor-core`** — Atlassian's own ProseMirror editor; edits **ADF natively** and
  ships a Markdown transformer. Heaviest, but the only one that's ADF-first. Start here if ADF
  fidelity is the priority.

### Markdown ⇄ ADF conversion

- **Official (Atlaskit):** `@atlaskit/editor-markdown-transformer` + `@atlaskit/editor-json-transformer` + `@atlaskit/adf-schema` (Markdown → ProseMirror → ADF).
- **Community:** `marklassian` (MD→ADF), `marklas` (bidirectional MD⇄ADF), `adf-to-md` (ADF→MD), `mdadf`.
- Markdown side already in this app: `marked` (render) — `prosemirror-markdown` does MD⇄ProseMirror.

### What's distinctive here

- **Template-aware authoring** — the editor scaffolds/enforces the CCQG spec template (the 10
  sections, EARS requirement blocks, Gherkin blocks). The section list lives in
  `spec-instructions.md §3` / the eval-criteria doc.
- **Live quality** — run `@trainyard/timc-light` on every change → EARS / Sections / BDD climb
  toward the bar as you write. This is the "exploration → formal process" jump, in the tool.

### Decisions / open questions (fill with scraps)

- TipTap (lighter, convert to ADF at save) **vs** `@atlaskit/editor-core` (ADF-native, heavy)?
- Full ADF fidelity (panels, tables, status, expand) or a constrained subset?
- Confluence **storage format** vs **ADF** for sync? Which API (Atlassian connector)?
- Two-way sync: source of truth (repo Markdown vs Confluence)? Conflict handling?
- Offline (Electron) vs online (web) — fonts/assets, no-network behavior.

---

## 2. Dual-terminal / dual-LLM — CCQG real-time quality antagonist

**Goal.** A two-terminal, two-LLM surface where one model **generates** (spec/code/scenarios)
and a second **critiques** it live against the CCQG quality gates — the "antagonist." Hosts
the **LemonAid** local-AI experiment.

### Terminal surface

- **`xterm.js`** — terminal UI in the renderer.
- **`node-pty`** — spawn real PTYs from Electron's main process (native module → needs an
  Electron rebuild). For **web**, run the PTY server-side and stream over WebSocket.

### LLM providers

- App's existing hooks: `CCQG_GENERIC_ENDPOINT` (local models, see `CLAUDE.md §9`), the
  `auth`/`backend-client` bridge, or provider SDKs direct. **LemonAid** is the local-AI harness.
- Want a **provider abstraction** so generator and critic can be different models (e.g. local
  generator + stronger critic).

### The "antagonist" loop

- Generator emits an artifact → critic evaluates it against the **rubric**: the TIMC Light
  engine + the quality-gate thresholds (`CLAUDE.md §7`: complexity, coverage, EARS, etc.).
- The eval-criteria doc + `@trainyard/timc-light` are the critic's machine-readable rubric —
  the antagonist runs the same gates the IDE shows.

### Decisions / open questions (fill with scraps)

- Providers: local (LemonAid) only, or local-generator + cloud-critic?
- Loop mode: fully automated (generate→critique→regenerate) or human-in-the-loop?
- How tightly does the critic bind to the gates — call `npm run quality-gate`, or the engine
  in-process?
- Transcript capture + governance (FINRA 4511 retention of agent actions)?
- Electron (`node-pty`) vs web (server PTY) split — the shell is the only desktop-specific part.

---

## Sources

- [Atlassian editor packages (Atlaskit)](https://community.developer.atlassian.com/t/converting-to-adf-atlassian-document-format/82496) — `@atlaskit/adf-schema`, `editor-json-transformer`, `editor-markdown-transformer`
- [Marklassian — Markdown → ADF](https://github.com/jamsinclair/marklassian)
- [marklas — bidirectional Markdown ⇄ ADF](https://github.com/byExist/marklas)
- [adf-to-md — ADF → Markdown](https://github.com/julianlam/adf-to-md)
- [markdown-confluence — md-to-adf](https://markdown-confluence.com/usage/npm-library/md-to-adf.html)
