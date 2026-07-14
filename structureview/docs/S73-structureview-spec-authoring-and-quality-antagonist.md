# S73: StructureView Spec Authoring and Quality Antagonist

**Segment:** S73
**Workstream:** B - Testing Information & Management Center
**Phase:** 3 (Advanced Capabilities / Integration / Extensions)
**Status:** Spec Draft - Pending Review
**Spec Type:** stream-aligned
**Depends On:** S35 (TIMC Light MVP), S46 (Roundhouse Shell Unification), S69 (Design System Extraction & New UI Salvage Plan), S72 (Platform Configuration and Settings Control Plane)
**Estimated Effort:** 4 sprints
**PR Strategy:** Spec PR -> 4 implementation PRs

---

## 1. Objective

**Job Story:** When I am turning exploratory AI output into governed delivery artifacts, I want to author, review, and challenge the work in the same place I inspect its quality signals, so I can move from rough thinking to implementation-ready specs without losing traceability.

This segment defines the next StructureView backlog capabilities: an in-tool WYSIWYG spec authoring surface and a dual-terminal, dual-LLM quality antagonist surface. Both capabilities target the shared StructureView product experience across Electron and web. The renderer, UI primitives, document model adapters, TIMC Light scoring, and provider abstractions are shared; only shell-specific file and terminal execution boundaries differ.

The authoring capability lets users create and edit CCQG specs with a ProseMirror-family editor that round-trips Markdown for repository specs and Atlassian Document Format (ADF) for Confluence or Jira synchronization. The editor is template-aware, so the ten required CCQG spec sections, EARS requirement blocks, and Gherkin scenario blocks are available as structured authoring affordances rather than passive documentation.

The antagonist capability lets one model generate specs, code, or scenarios while a second model critiques the artifact live against TIMC Light signals and the broader CCQG quality gates. It provides a host surface for the LemonAid local-AI experiment and for mixed-provider loops where the generator and critic may be different local or remote models.

The measurable outcome is a reviewed backlog spec that can drive implementation PRs for StructureView authoring and live critique. Once implemented, a user can open `/structureview`, create or edit a spec, see TIMC Light scores update as the document changes, run a generator/critic loop from the same surface, and export or sync the resulting artifact without bypassing CCQG governance.

---

## 2. Scope

### 2.1 In Scope

- `docs/S73-structureview-spec-authoring-and-quality-antagonist.md`: governed backlog spec for both future capabilities.
- `docs/research-future-capabilities.md`: retained as the raw research scratchpad and source link collection.
- `ui/src/pages/StructureView.tsx`: future shared route surface for authoring, TIMC scoring, and antagonist controls.
- `src/timc-light/`: existing local scoring engine consumed by both capabilities.
- `src/main/preload.js` and `src/main/index.js`: future Electron shell boundary for local file writes, external links, and PTY process mediation.
- `src/auth/backend-client.js`: future bridge for authenticated web/API calls to provider and sync backends.
- `@trainyard/ui`: target source for shared controls, editor chrome, terminal layout primitives, metric bars, segmented controls, and status surfaces.

### 2.2 Out of Scope

- Full implementation of either capability in this spec PR - owned by the PR breakdown in Section 6.
- Final Atlassian connector implementation, OAuth setup, and workspace provisioning - deferred to a later Atlassian sync segment or issue.
- New shared design-system extraction work beyond consuming `@trainyard/ui` surfaces already covered by S69.
- Replacing the existing `@trainyard/timc-light` scoring rules - future work may extend them but must preserve S35 compatibility.
- Production retention policy implementation for agent transcripts - this spec requires the boundary and audit events, while retention storage is deferred to the governance segment that owns FINRA 4511 controls.

---

## 3. Technical Design

### 3.1 Capability Architecture

StructureView becomes the shared quality workbench for authored documents and live AI critique. The core product surface is a renderer capability that can run in Electron or web. The shell provides environment-specific services:

```text
StructureView renderer
  Spec authoring workspace
    ProseMirror-family editor
    Markdown adapter
    ADF adapter
    CCQG template blocks
    TIMC Light live scoring
  Quality antagonist workspace
    Generator terminal/session
    Critic terminal/session
    Artifact handoff buffer
    TIMC Light and quality-gate verdict panel
  Shared services
    Provider abstraction
    Sync abstraction
    Transcript/audit event abstraction

Electron shell
  Local file system access
  node-pty process host
  Local provider process access

Web shell
  Backend file/sync APIs
  Server PTY over WebSocket
  Hosted provider access
```

### 3.2 Spec Authoring Surface

The editor engine must be ProseMirror-compatible. The initial implementation decision remains open between TipTap and `@atlaskit/editor-core`:

- TipTap is the lighter React integration path and can convert to ADF at save or sync time.
- `@atlaskit/editor-core` is heavier but edits ADF natively and aligns with Atlassian document fidelity.
- Raw ProseMirror remains the fallback only if both higher-level choices block required template or conversion behavior.

The authoring surface must preserve Markdown as the repository source format while allowing ADF export/import where Atlassian synchronization is enabled. The implementation should prefer official Atlaskit transformers for ADF fidelity:

- `@atlaskit/editor-markdown-transformer`
- `@atlaskit/editor-json-transformer`
- `@atlaskit/adf-schema`

Community converters such as `marklassian`, `marklas`, `adf-to-md`, and `mdadf` remain evaluation candidates only if official packages fail on required round-trip cases.

### 3.3 Template-Aware Authoring

The editor must expose CCQG spec structure as document actions:

- Insert the ten-section spec template from `spec-instructions.md`.
- Insert an EARS requirement block with the five supported patterns.
- Insert a Gherkin feature/scenario block that TIMC Light can score.
- Flag missing sections, weak requirements, and malformed scenarios while the user types.
- Keep generated Markdown compatible with repository review and existing spec validation.

### 3.4 Live TIMC Light Scoring

The renderer must call `@trainyard/timc-light` on document changes and update the visible score model without requiring network access. For Markdown specs, the scoring view must include:

- EARS coverage.
- Section completeness.
- BDD coverage.
- Composite score.
- Findings with line or block anchors where available.

For JSON and future sync payloads, the scoring view must preserve the existing JSON quality signal. The same scoring engine must be consumed by Electron and web surfaces so authors see identical results across shells.

### 3.5 Dual-Terminal Quality Antagonist

The antagonist workspace contains two coordinated sessions:

- Generator session: produces a spec, code change, BDD scenario set, or remediation proposal.
- Critic session: evaluates the generated artifact against TIMC Light signals, CCQG quality gates, and the relevant spec instructions.

The terminal UI must use `xterm.js` or an equivalent `@trainyard/ui` terminal primitive that wraps it. Electron must spawn local PTYs from the main process through `node-pty`; web must use a backend PTY service streamed over WebSocket. Renderer code must not spawn shell processes directly.

The generator and critic must communicate through a typed artifact handoff rather than scraping terminal text. The handoff carries:

- Artifact kind (`spec`, `code`, `gherkin`, `diff`, `transcript`).
- Artifact content or path.
- Source session id.
- TIMC Light result.
- Critic verdict.
- Required remediation actions.

### 3.6 Provider Abstraction

The implementation must support generator and critic sessions using different providers. The first provider set should cover:

- Local provider via `CCQG_GENERIC_ENDPOINT`, including LemonAid.
- Authenticated backend provider through `src/auth/backend-client.js`.
- Direct SDK providers only where the platform configuration surface allows credentials to remain outside renderer code.

Provider configuration must integrate with S72 settings so users can select local-only, mixed local/cloud, or hosted-only modes without hardcoded endpoint values.

### 3.7 Transcript and Governance Boundary

The antagonist must emit audit events for user-visible generation, critique, regeneration, acceptance, and export actions. Transcript capture must distinguish between ephemeral terminal output and governed artifact records. Until the retention store is implemented, the UI must label transcript persistence state and prevent users from mistaking ephemeral local sessions for regulated retention.

### 3.8 File Manifest

| File                                                              | Type            | Description                                                                                 |
| ----------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `docs/S73-structureview-spec-authoring-and-quality-antagonist.md` | new             | Governed backlog spec for the StructureView authoring and antagonist capabilities.          |
| `docs/research-future-capabilities.md`                            | existing        | Research scratchpad and source collection preserved as input material.                      |
| `ui/src/pages/StructureView.tsx`                                  | future modified | Shared route that hosts authoring, scoring, and antagonist workspaces.                      |
| `src/timc-light/index.js`                                         | existing        | Shared TIMC Light API consumed for live scoring.                                            |
| `src/main/preload.js`                                             | future modified | Electron bridge for local file and PTY capabilities.                                        |
| `src/main/index.js`                                               | future modified | Electron main-process owner for safe shell process spawning.                                |
| `src/auth/backend-client.js`                                      | future modified | Authenticated bridge for provider, sync, and web shell services.                            |
| `ui/src/styles/tokens.css`                                        | future modified | Token consumption updates if new shared UI primitives need StructureView-specific mappings. |

### 3.9 Functional Requirements

- REQ-001: The StructureView authoring surface shall allow a user to create a new CCQG spec from the canonical ten-section template.
- REQ-002: The StructureView authoring surface shall preserve Markdown as an exportable repository format for authored specs.
- REQ-003: Where Atlassian sync is enabled, the StructureView authoring surface shall import and export ADF without removing supported CCQG template sections.
- REQ-004: When document content changes, the StructureView authoring surface shall recompute TIMC Light scores for the active document.
- REQ-005: When TIMC Light reports EARS, section, or BDD findings, the StructureView authoring surface shall show the finding category and actionable location when a location is available.
- REQ-006: The antagonist workspace shall provide one generator session and one critic session for the same active artifact.
- REQ-007: When the generator produces an artifact, the antagonist workspace shall pass a typed artifact handoff to the critic session.
- REQ-008: When the critic evaluates an artifact, the antagonist workspace shall show TIMC Light results and critic verdicts in a shared quality panel.
- REQ-009: Where Electron local terminal mode is enabled, the shell shall spawn PTY processes only from the Electron main process.
- REQ-010: Where web terminal mode is enabled, the shell shall stream terminal IO through an authenticated server-side PTY service.
- REQ-011: If a provider endpoint is unavailable, then the antagonist workspace shall keep the authored artifact available and show the provider failure without discarding terminal history.
- REQ-012: While offline, the authoring surface shall continue local Markdown editing and TIMC Light scoring for documents already loaded in the client.
- REQ-013: The provider abstraction shall allow generator and critic roles to use different configured providers.
- REQ-014: When a user accepts, exports, or syncs a generated artifact, the system shall emit an audit event with artifact kind, session id, timestamp, and action.
- REQ-015: If transcript retention is not configured, then the system shall label transcripts as ephemeral before the user starts an antagonist session.

### 3.10 Non-Functional Requirements

| Dimension       | Requirement                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance     | The authoring surface must recompute TIMC Light results within 250 ms for Markdown documents up to 100 KB on a typical development workstation, using debouncing where needed.                                                                      |
| Security        | Renderer code must not access provider secrets, spawn local processes, or write arbitrary files directly; Electron and web shells own those boundaries.                                                                                             |
| Observability   | The implementation must emit structured events for editor save/export, TIMC score recomputation, provider session start/failure, critic verdict, and artifact acceptance.                                                                           |
| Reliability     | If ADF conversion, provider calls, or PTY startup fails, the current Markdown artifact must remain recoverable in the editor.                                                                                                                       |
| Tuneable values | TIMC status thresholds must continue to come from the TIMC Light criteria and future threshold configuration; provider timeouts, debounce windows, and terminal limits must be configurable through the S72 settings surface rather than hardcoded. |

---

## 4. BDD Scenarios

### 4.1 Example Map

**Rule:** Spec authoring preserves governance structure while users edit visually.

- Happy path: A user creates a new spec from the CCQG template and all ten required sections appear.
- Edge case: A user deletes a required section and TIMC Light immediately reports section incompleteness.
- Failure case: A Markdown-to-ADF conversion drops a Gherkin block and the editor blocks sync until the user reviews the loss.

**Rule:** Live scoring uses the same TIMC Light engine across shells.

- Happy path: A Markdown spec edited in Electron and web receives the same EARS, section, BDD, and composite scores.
- Edge case: A 100 KB spec updates scores after debounced edits without blocking text entry.
- Failure case: A malformed Gherkin scenario appears in the BDD findings panel before export.

**Rule:** The antagonist separates generation from critique.

- Happy path: The generator creates a spec draft and the critic evaluates it with TIMC Light plus quality-gate rubric notes.
- Edge case: The generator is local and the critic is hosted, but the artifact handoff remains provider-neutral.
- Failure case: The critic provider fails and the generator artifact remains available for manual review.

**Rule:** Shell-specific terminal execution stays outside shared renderer code.

- Happy path: Electron starts local PTYs from the main process and streams output into the renderer terminal.
- Edge case: Web starts server-side PTYs over WebSocket while reusing the same terminal component.
- Failure case: A renderer-only attempt to spawn a shell process is rejected by the shell boundary.

### 4.2 Gherkin Scenarios

```gherkin
Feature: StructureView spec authoring and quality antagonist

  Background:
    Given StructureView is open on the shared /structureview surface
    And TIMC Light is available in the client

  Scenario: Create a governed spec from the template
    Given the user starts a new spec document
    When the user selects the CCQG spec template
    Then the document contains all ten required CCQG sections
    And the section completeness score is pass

  Scenario: Surface missing required sections while editing
    Given the user is editing a CCQG spec document
    When the user removes the Acceptance Criteria section
    Then the section completeness signal reports Acceptance Criteria as missing
    And the composite TIMC Light score changes before export

  Scenario: Preserve Gherkin blocks during ADF sync
    Given Atlassian sync is enabled
    And the active Markdown spec contains a Gherkin scenario block
    When the user exports the document to ADF
    Then the exported document preserves the Gherkin block content
    And the sync action reports no lossy conversion warning

  Scenario: Score the same Markdown in Electron and web
    Given the same Markdown spec is loaded in Electron and web
    When TIMC Light analyses both documents
    Then the EARS, section, BDD, and composite scores match
    And findings use the same signal categories

  Scenario: Critique a generated artifact
    Given a generator session and critic session are configured
    When the generator produces a spec draft
    Then the antagonist passes a typed artifact handoff to the critic
    And the quality panel shows TIMC Light results and a critic verdict

  Scenario: Keep artifacts when critic provider fails
    Given a generator session has produced an artifact
    And the critic provider is unavailable
    When the antagonist requests critique
    Then the generated artifact remains available in the workspace
    And the quality panel shows a provider failure state

  Scenario: Enforce Electron PTY shell boundary
    Given Electron local terminal mode is enabled
    When a generator terminal starts
    Then the Electron main process owns the PTY process
    And renderer code receives terminal IO through the preload bridge

  Scenario: Label ephemeral transcripts before session start
    Given transcript retention is not configured
    When the user opens the antagonist workspace
    Then the workspace labels transcripts as ephemeral
    And no generated artifact is marked as retained
```

---

## 5. Test Strategy

- BDD test wiring: Add feature coverage under `src/bdd/structureview-authoring-antagonist.feature` or the repo's future Cucumber/Vitest BDD location, with step definitions covering template insertion, score updates, artifact handoff, and shell-boundary behavior.
- Unit tests: Cover Markdown template insertion, ADF/Markdown conversion adapters, TIMC scoring debounce behavior, provider role selection, typed artifact handoff validation, and transcript/audit event creation.
- Integration or smoke tests: Use Playwright or the selected UI runner to verify `/structureview` can create a spec, edit an EARS requirement, show TIMC score changes, start mocked generator/critic sessions, and export Markdown.
- Electron tests: Mock the preload bridge and verify renderer code never calls PTY or file APIs directly; main-process tests own `node-pty` integration where available.
- Web tests: Mock server PTY WebSocket streams and authenticated provider calls through the backend client.
- Manual verification: Validate at least one Markdown -> ADF -> Markdown round trip with required sections, EARS bullets, and Gherkin code blocks before implementation approval.
- Coverage target: TIMC quadrants for requirements quality, scenario coverage, section completeness, and artifact traceability; implementation PRs must keep `npm run quality-gate` passing.

---

## 6. PR Breakdown

### PR 1 - Authoring Spike and Document Model Adapters

- PR title: `feat(S73): add StructureView spec authoring foundation`
- Branch name: `feat/s73-spec-authoring-foundation`
- Depends on: S35, S69
- Delivers:
  - New files: editor adapter modules, conversion adapter tests, template block tests.
  - Modified files: `ui/src/pages/StructureView.tsx`, shared UI imports, package dependencies.
- Total: 6 new files + 4 modified files
- Acceptance gate:
  1. `npm run timc:test`
  2. `npm run test`
  3. `npm run lint`

```text
feat(S73): add spec authoring document adapters
test(S73): cover markdown template and conversion behavior
```

### PR 2 - Live TIMC Authoring Feedback

- PR title: `feat(S73): score authored specs live in StructureView`
- Branch name: `feat/s73-live-authoring-quality`
- Depends on: PR 1
- Delivers:
  - New files: editor scoring hooks, score panel tests, fixture specs.
  - Modified files: `ui/src/pages/StructureView.tsx`, `src/timc-light` imports if needed.
- Total: 4 new files + 3 modified files
- Acceptance gate:
  1. `npm run timc:test`
  2. `npm run test`
  3. `npm run lint`

```text
feat(S73): wire live timc scoring into spec authoring
test(S73): verify section ears and bdd feedback while editing
```

### PR 3 - Dual-Session Provider and Antagonist Loop

- PR title: `feat(S73): add generator critic antagonist loop`
- Branch name: `feat/s73-quality-antagonist-loop`
- Depends on: PR 2, S72
- Delivers:
  - New files: provider role abstraction, artifact handoff model, antagonist workspace tests.
  - Modified files: `src/auth/backend-client.js`, `ui/src/pages/StructureView.tsx`, settings integration.
- Total: 7 new files + 5 modified files
- Acceptance gate:
  1. `npm run test`
  2. `npm run lint`
  3. `npm run quality-gate`

```text
feat(S73): add generator critic provider roles
test(S73): verify typed artifact handoffs and critic failure states
```

### PR 4 - Terminal Shell Integration and Governance Events

- PR title: `feat(S73): add terminal shell boundaries and antagonist audit events`
- Branch name: `feat/s73-terminal-governance`
- Depends on: PR 3
- Delivers:
  - New files: terminal shell adapters, audit event tests, mocked PTY/WebSocket tests.
  - Modified files: `src/main/index.js`, `src/main/preload.js`, `ui/src/pages/StructureView.tsx`.
- Total: 8 new files + 5 modified files
- Acceptance gate:
  1. `npm run test`
  2. `npm run lint`
  3. `npm run quality-gate`
  4. Manual Electron smoke test for local terminal startup with mocked provider.

```text
feat(S73): enforce terminal shell boundaries
test(S73): cover antagonist audit events and transcript states
```

---

## 7. Dependencies

### 7.1 Hard Dependencies

| Segment | Consumed output                                                 | Reason                                                                                                          |
| ------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| S35     | TIMC Light scoring engine and BDD generator foundation          | Both capabilities use the same local scoring rubric as the current StructureView quality panel.                 |
| S69     | Design system extraction and StructureView disposition guidance | New UI must consume `@trainyard/ui` patterns instead of growing a forked StructureView component set.           |
| S72     | Platform settings control plane                                 | Provider endpoints, local/cloud mode, terminal limits, and sync settings need a governed configuration surface. |

### 7.2 Soft Dependencies

| Segment | Helpful output                         | Reason                                                                              |
| ------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| S46     | Roundhouse shell unification           | Helps keep the web surface aligned with the broader Train Yard shell.               |
| S53     | Jira Forge App - Atlassian Marketplace | May provide future Atlassian auth and sync patterns.                                |
| S68     | Governance Artifact Version Registry   | Can record authored spec and generated artifact versions once the workflow matures. |

### 7.3 What Downstream Segments Depend On

| Segment                             | Consumes                                         | Contract or surface                                                                      |
| ----------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Future Atlassian sync segment       | Markdown/ADF adapter behavior                    | Import/export contract for repository Markdown and ADF documents.                        |
| Future LemonAid integration segment | Provider role abstraction and antagonist handoff | Generator/critic provider contract and typed artifact handoff.                           |
| Future retention/governance segment | Antagonist audit events                          | Audit event schema for generated, critiqued, accepted, exported, and retained artifacts. |

---

## 8. Acceptance Criteria

- [ ] This spec exists at `docs/S73-structureview-spec-authoring-and-quality-antagonist.md`.
- [ ] The spec covers both backlog capabilities from `docs/research-future-capabilities.md`.
- [ ] The spec names the Electron and web shell split for file access, terminal access, and provider access.
- [ ] The spec identifies `@trainyard/timc-light` as the shared scoring engine for live authoring and antagonist critique.
- [ ] The spec identifies `@trainyard/ui` as the shared UI consumption target.
- [ ] The PR breakdown separates authoring adapters, live TIMC feedback, provider/antagonist logic, and terminal/governance boundaries.
- [ ] All Gherkin scenarios in Section 4 are syntactically valid and map to testable outcomes.
- [ ] EARS notation coverage is verified by TIMC Light for all functional requirements in Section 3.

---

## 9. Decision Log

| Decision                                                          | Options Considered                                         | Rationale                                                                                                                                           | Date      |
| ----------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Keep the two backlog capabilities in one umbrella spec for review | One spec vs two immediate specs                            | The capabilities share StructureView, TIMC Light, provider configuration, and shell-boundary decisions; implementation PRs keep the work separable. | June 2026 |
| Classify the spec as stream-aligned                               | stream-aligned vs platform vs enabling                     | The eventual value is directly reachable on `/structureview`; supporting adapters are implementation details behind that user-visible surface.      | June 2026 |
| Keep editor engine selection open until implementation spike      | TipTap vs `@atlaskit/editor-core` vs raw ProseMirror       | ADF fidelity and bundle weight need empirical validation before locking the editor dependency.                                                      | June 2026 |
| Preserve Markdown as the repository source format                 | Markdown source vs ADF source vs Confluence storage source | Repository specs remain the governed review artifact while ADF supports Atlassian sync.                                                             | June 2026 |
| Require typed artifact handoff between generator and critic       | Typed handoff vs terminal transcript scraping              | Typed handoff keeps critique testable and prevents provider-specific terminal output from becoming the integration contract.                        | June 2026 |

---

## 10. Delivery Surface & Integration

**Spec Type:** stream-aligned
**Type justification:** The segment delivers user-visible authoring and critique workflows reachable from the StructureView product surface.

### 10.1 Delivery Surface

| Surface / Contract                        | Kind     | Evidence of delivery                                                                                  |
| ----------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `/structureview` spec authoring workspace | screen   | User can create/edit a CCQG spec and see TIMC Light scores update while typing.                       |
| `/structureview` antagonist workspace     | screen   | User can run generator and critic sessions against one active artifact with visible quality verdicts. |
| Markdown/ADF document adapter             | contract | Round-trip tests preserve required sections, EARS bullets, and Gherkin blocks.                        |
| Generator/critic provider roles           | contract | Unit tests prove generator and critic can use different configured providers.                         |
| Terminal shell adapter                    | contract | Electron tests prove PTY startup is main-process owned; web tests prove server PTY streaming is used. |
| Antagonist audit event model              | contract | Tests prove generation, critique, acceptance, export, and retention-state events are emitted.         |

**Domain boundary:** Complete when implementation crosses from StructureView presentation into provider, terminal, sync, and governance contexts.

- Producing bounded context: StructureView Authoring and Quality Workbench
- Domain Contract consumed: `@trainyard/timc-light.analyse`, S72 provider/settings contracts, future Atlassian sync contract
- Stream Adapter or Anti-Corruption Layer owned here: Markdown/ADF adapter, provider role adapter, PTY shell adapter, antagonist artifact handoff
- Translation rule: Project editor state, provider output, and terminal events into governed document artifacts and TIMC/critic findings; do not change TIMC scoring policy or provider model behavior inside the StructureView stream.

### 10.2 Integration Handoffs

| Deferred surface                                             | Owning segment                      | Tracked issue |
| ------------------------------------------------------------ | ----------------------------------- | ------------- |
| Production Atlassian sync connector and OAuth provisioning   | Future Atlassian sync segment       | Pending issue |
| FINRA 4511 retention storage for antagonist transcripts      | Future governance/retention segment | Pending issue |
| Hoisted `@trainyard/ui` terminal/editor primitive extraction | S69 follow-up                       | Pending issue |

Implementation approval must replace each pending issue placeholder with a tracked issue or split the deferred surface into a named segment before Status can move to `Approved`.
