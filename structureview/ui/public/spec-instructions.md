# Spec Instructions — How to Write a CCQG Segment Specification

This document is the canonical reference for authoring new segment specifications in
`docs/specs/`. Follow it whenever creating a new spec so that all segments share consistent
structure, naming, and discoverability.

> **The master pipeline:** Job Story → Example Map → BDD Scenarios → Formal Spec → Tests → Agent Execution
>
> Every line of AI-generated code must be traceable back through a verifiable artifact chain to a
> documented stakeholder need. This document encodes that chain into every spec.

---

## 0. The Spec Pipeline — Why This Format Exists

Specs are not delivery manifests. They are the **primary governance artifact** for consequential
changes — the mechanism by which stakeholder intent becomes bounded, traceable, agentic execution.

Traditional user stories fail AI agents because they describe work, not the system. They depend on
invisible tribal knowledge LLMs do not possess. Research on 600 rejected pull requests found that
alignment loss during execution caused more failures than incorrect task descriptions.

The six-step translation pipeline that underpins this format:

| Step | Action | Output |
|------|--------|--------|
| 1 — JTBD Research | Identify the job being hired via switch interviews | Customer motivations, jobs-to-be-done |
| 2 — Job Story Authoring | Capture situation, motivation, expected outcome | Job Story (`When… I want to… so I can…`) |
| 3 — Impact Mapping | Decompose job into actors, impacts, deliverables | Prioritised opportunity space |
| 4 — Example Mapping | Use concrete examples to elaborate rules and surface ambiguities | Validated rules and edge cases |
| 5 — BDD Scenarios | Translate validated examples into Gherkin (Given/When/Then) | Machine-readable, executable scenarios |
| 6 — Formal Specification | Write EARS notation requirements from the Gherkin scenarios | The spec itself — Section 3 of this format |

The spec format in this document captures Steps 4–6 as required sections, with Steps 1–3 as
required anchors in Section 1 (Objective). Step 6 (Living Spec Maintenance) is encoded as an
obligation on all `Complete` specs — they must stay synchronised with implementation.

---

## 1. Naming Convention

```text
S##-kebab-case-focus-area-title.md
```

| Part | Rule |
|------|------|
| `S##` | Sequential segment number, two digits minimum (e.g. `S12`, `S29`). No gaps. Check the highest existing number before assigning. |
| `-` | Literal hyphen separator. |
| `kebab-case-focus-area-title` | Short, descriptive, all lowercase, hyphen-separated. Describe *what* the segment delivers, not how (e.g. `business-slos-observability-thresholds`, not `improve-observability`). |
| `.md` | Markdown extension. |

Micro-specs use parent-scoped naming — `S##m#-kebab-title.md` (e.g.
`S60m1-wire-gate-verdict-into-lifecycle-screen.md`). See Appendix A.

**Examples:**

```text
S12-agent-card-schema-and-registry.md
S22-dora-metrics-release-readiness.md
S29-business-slos-observability-thresholds.md
S35-timc-light-mvp.md
```

**Anti-patterns to avoid:**

- `S29_business_slos.md` — underscores not allowed
- `S29-Business-SLOs.md` — uppercase not allowed
- `s29-business-slos.md` — segment prefix must be uppercase `S`
- `S029-...` — zero-padding not used in this project

---

## 2. Frontmatter Block

Immediately after the H1 title, include a frontmatter block using bold Markdown labels. Do not
use YAML front matter fences (`---` at line 1). The block ends with a `---` horizontal rule.

```markdown
# S##: Title of the Segment

**Segment:** S##
**Workstream:** {Letter} — {Workstream Name}
**Phase:** {Number} ({Phase Name})
**Status:** {Status Value}
**Spec Type:** {stream-aligned | platform | complicated-subsystem | enabling}
**Depends On:** S## (Short Name), S## (Short Name)
**Estimated Effort:** {N sprint(s)}
**PR Strategy:** Spec PR → {N} implementation PR(s)

---
```

### Workstream Values

| Letter | Name | Covers |
|--------|------|--------|
| A | Domain Knowledge Sub-Agents | Agent card schema, domain expert agents, coordination agent |
| B | Testing Information & Management Center | TIMC shell, CI pipeline, living docs, observability, release readiness |
| C | Azure Metrics Dashboard | Dashboard views, real-time feed, Azure infrastructure |
| D | Design System & Platform | Fleet design system, UI components, Turntable Hub, dashboard builder |
| E | Developer Experience & Skills | AGENTS.md, SOUL.md, Wrap-Up Skill, BDD generator, test-plan-composer |
| F | Memory & Orchestration | Shared memory MCP primitives, agent mesh, learning loops |

### Phase Values

| Number | Name | Meaning |
|--------|------|---------|
| 1 | Foundation | Core scaffolding, schemas, directory structures |
| 2 | Core Capabilities | Primary pipeline scripts and workflows |
| 3 | Advanced Capabilities / Integration / Extensions | Enhancement, integration, governance |

### Status Values

| Value | Meaning |
|-------|---------|
| `Draft` | First pass; not yet reviewed |
| `Spec Draft — Pending Review` | Complete draft; awaiting stakeholder review |
| `Approved` | Reviewed and approved; implementation not yet started |
| `In Progress` | Implementation underway |
| `Implemented — Pending Review` | All deliverables complete; awaiting PR review |
| `Complete` | Merged and verified in production — living spec obligation active |
| `Complete — Superseded by S##` | A later spec materially replaces this spec's design |
| `Deferred` | Postponed to a later phase; must state reason in Decision Log (Section 8) |

### Spec Type Values (S71)

Every spec declares one of four types, mapped from Team Topologies team types onto spec
artifacts. The type determines the spec's Definition of Done — see the Gate 5 Matrix in
Section 7 of this document.

| Spec Type | Definition | Done means |
|---|---|---|
| `stream-aligned` | Delivers a slice of user-visible value end to end: data → behaviour → screen | A named user can reach the change in the running product |
| `platform` | Delivers a self-service capability other segments consume via a contract | At least one consumer is wired through the contract, proven by a contract test |
| `complicated-subsystem` | Deep specialist logic exposed through a narrow interface | The facade is consumed by a named segment; internals are invisible to consumers |
| `enabling` | Improves how other segments are delivered (process, skills, governance) | The process artifact is merged and in force |

**Classification rules:**

- A spec containing **both** platform and stream-aligned deliverables is classified
  `stream-aligned` — the stricter gate wins. Preferably, split it.
- The type is declared in frontmatter and justified in one sentence in Section 10.
- Reviewers may challenge the classification; the challenge and resolution are Decision
  Log entries.
- Legacy specs (pre-S71) adopt the field when next touched under the living spec
  obligation; the taxonomy validator skips specs without the field.

### Domain Boundary Vocabulary (S71 Evolution)

Use these terms when a spec crosses a Domain-Driven Design boundary:

| Term | Meaning |
|---|---|
| **Bounded Context** | Boundary within which a domain model and language are authoritative |
| **Domain Contract** | Published interface owned by the producing bounded context |
| **Stream Adapter** | Thin API, client, or presentation mapping owned by a delivery stream that translates a Domain Contract for its user-facing surface |
| **Anti-Corruption Layer** | Consumer-owned translation protecting one bounded context from another bounded context's model |

The producer owns the Domain Contract's meaning. The consumer owns the translation. A
Stream Adapter may project or rename existing contract data, but it must not add domain
policy or modify the producer contract. A deliberately shared model is a Shared Kernel
and requires a full spec or ADR; it is not micro-spec work.

---

## 3. Required Sections

Every spec must have all ten sections in this order. Section numbers are mandatory.

```
## 1. Objective
## 2. Scope
## 3. Technical Design
## 4. BDD Scenarios
## 5. Test Strategy
## 6. PR Breakdown
## 7. Dependencies
## 8. Acceptance Criteria
## 9. Decision Log
## 10. Delivery Surface & Integration
```

---

### Section 1 — Objective

3–5 paragraphs. Answer in this order:

1. **Job Story** — The human motivation this spec addresses, written in Job Story format:
   > *"When [situation], I want to [motivation], so I can [outcome]."*
   This must appear as the first element of Section 1. It anchors the spec to a real stakeholder
   need before any technical detail is introduced. It does not need to come from a formal JTBD
   interview, but it must represent genuine human motivation, not a solution description.

2. **What** — What does this segment deliver?

3. **Why** — What gap does it close? What breaks or degrades without it?

4. **Measurable outcome** — What is verifiably different once this spec is implemented?

Do not describe implementation details here. Save design for Section 3.

**Example:**

```markdown
## 1. Objective

**Job Story:** When I am reviewing an AI-generated spec before implementation begins, I want to
see whether requirements are machine-readable, so I can catch ambiguities before they become bugs.

This segment delivers TIMC Light — a lightweight, client-side quality signal engine that surfaces
document-type-aware signals within StructureView without requiring agent orchestration or a paid
Quality Guardian subscription...
```

---

### Section 2 — Scope

#### 2.1 In Scope

Bulleted list of every deliverable: scripts, schemas, config files, documentation files,
workflow changes, and test files. Be specific — use file paths.

#### 2.2 Out of Scope

Bulleted list of things explicitly *not* delivered by this segment. Link to the segment that
owns each out-of-scope item where applicable. This prevents scope creep and sets expectations.

---

### Section 3 — Technical Design

Subsections as needed. Use:

- Named subsections (`### 3.1 Module Architecture`, `### 3.2 File Manifest`, etc.)
- ASCII or Markdown diagrams for directory structures
- Fenced code blocks with language specifiers for all code examples

**File manifest table format** (use when listing files concisely):

```markdown
| File | Type | Description |
|------|------|-------------|
| `path/to/file.md` | new | One-line description |
| `path/to/other.yaml` | modified | What changes |
```

#### 3.X Non-Functional Requirements (mandatory subsection)

Every spec must include a named NFR subsection — `### 3.X Non-Functional Requirements` — covering
the following dimensions where applicable:

| Dimension | What to specify |
|-----------|----------------|
| Performance | Response time thresholds, throughput targets, memory ceilings |
| Security | Auth boundaries, data classification, credential handling rules |
| Observability | Metrics emitted, log format, alerting thresholds |
| Reliability | Uptime targets, retry behaviour, graceful degradation |
| Tuneable values | All threshold values must reference `observability/thresholds.yaml` — never hardcode |

If a dimension does not apply, state it explicitly (e.g. "No auth boundary — client-side only").
This section exists so NFRs are never accidentally omitted. The research on the Time-Dimensional
Testing work established that configurability is a first-class concern: product metrics change, and
any metric displayed or enforced must be configurable without a code change.

#### Functional Requirements — EARS Notation

All functional requirements in Section 3 must use EARS (Easy Approach to Requirements Syntax)
notation. EARS was developed at Rolls-Royce for safety-critical systems and adopted by Amazon Kiro.
It makes requirements machine-readable and directly checkable by TIMC Light.

| Pattern | Template | Example |
|---------|----------|---------|
| Ubiquitous | The [system] shall [action] | The system shall display the user's full name in the navigation bar |
| Event-Driven | When [trigger], the [system] shall [action] | When the user clicks "Save", the system shall persist form data |
| State-Driven | While [state], the [system] shall [action] | While offline, the system shall queue pending write operations locally |
| Unwanted Behaviour | If [condition], then the [system] shall [action] | If the connection times out after 30s, the system shall retry three times |
| Optional Feature | Where [feature is enabled], the [system] shall [action] | Where dark mode is enabled, the system shall apply the dark colour scheme |

Write requirements in EARS notation before specifying implementation approach. This ensures the
*what* is fully defined before the *how* is designed.

---

### Section 4 — BDD Scenarios

BDD scenarios are the bridge between the Job Story (Section 1) and the formal EARS requirements
(Section 3). They are written **before** implementation begins — not as documentation after the
fact — because they are the mechanism that validates the spec's rules are complete and unambiguous.

This section follows the Example Mapping approach: use concrete examples to elaborate rules and
surface ambiguities before writing code.

#### 4.1 Example Map

List the rules this segment enforces and the concrete examples that validate them. Structure:

```markdown
**Rule:** [State the rule in plain English]
- Happy path: [What happens when everything works]
- Edge case: [What happens at the boundary]
- Failure case: [What happens when the rule is violated]
```

Minimum: 2 rules with 3 examples each (happy, edge, failure). Discovering that an edge case
cannot be described is a signal the spec is incomplete — resolve it before moving to 4.2.

#### 4.2 Gherkin Scenarios

Convert each Example Map entry into syntactically valid Gherkin. These scenarios become the
seed for the automated tests in Section 5.

```gherkin
Feature: [Feature name matching the spec title]

  Background:
    Given [shared context for all scenarios in this feature]

  Scenario: [Happy path — descriptive name]
    Given [precondition]
    When [action]
    Then [expected outcome]
    And [additional assertion]

  Scenario: [Edge case — descriptive name]
    Given [precondition at boundary]
    When [action]
    Then [expected boundary behaviour]

  Scenario: [Failure case — descriptive name]
    Given [failure precondition]
    When [action that triggers the rule]
    Then [system response to violation]
```

**Rules for Gherkin in this project:**

- One `Feature` block per spec section, not per file
- `Background` is optional but preferred when 3+ scenarios share the same `Given`
- `Scenario Outline` with `Examples` table for data-driven cases
- Step definitions scaffold goes in `src/bdd/` (see bdd-scenario-generator skill)
- Every `Then` clause must map to a binary, testable assertion

---

### Section 5 — Test Strategy

Describe how the Gherkin scenarios from Section 4 become automated test coverage:

- **BDD test wiring** — Which test runner executes the `.feature` files (Cucumber, Vitest BDD, etc.)
  and where step definitions live
- **Unit test approach** — Framework, what to mock, coverage target
- **Integration or smoke test approach** — What end-to-end verification is needed
- **Manual verification steps** — If any remain after automation
- **Coverage target** — Minimum % and which quadrants of the TIMC model this touches

---

### Section 6 — PR Breakdown

One subsection per PR. Each PR subsection includes:

- **PR title** using conventional commit format: `feat(S##): short description`
- **Branch name:** `feat/s##-kebab-description`
- **Depends on:** list of merged PRs or segments
- **Delivers:** bulleted lists of new files and modified files
- **Total:** `X new files + Y modified files`
- **Acceptance gate:** numbered list of commands to run
- **Commits:** fenced code block of commit messages

---

### Section 7 — Dependencies

#### 7.1 Hard Dependencies

Table of segments whose outputs this spec *consumes*. Explain what specifically is consumed.

#### 7.2 Soft Dependencies

Table of segments that improve the result but are not strictly required.

#### 7.3 What Downstream Segments Depend On

Table of segments that will consume this spec's outputs. This section is updated as downstream
specs are authored — it is a living section and part of the living spec obligation.

---

### Section 8 — Acceptance Criteria

Numbered or bulleted list of testable, binary (pass/fail) criteria. Each criterion must be
verifiable by running a command, inspecting a file, or completing a checklist item.

Format:

```markdown
- [ ] `npm run quality-gate` exits 0
- [ ] File `docs/timc/observability/thresholds.yaml` exists and is valid YAML
- [ ] Section "Business Metrics (Open Beta)" is present in `release-readiness/stage-gates.md`
- [ ] All Gherkin scenarios in Section 4 pass via `npx cucumber-js`
- [ ] EARS notation used for all functional requirements in Section 3 (verified by TIMC Light signal)
```

The final two criteria above apply to every spec — add them unless the spec is documentation-only
(see Section 5 of this document).

---

### Section 9 — Decision Log

Record every material design choice made during spec authoring. The decision log is the audit
trail for *why* the spec is shaped the way it is. Without it, context is permanently lost at the
moment of implementation.

Format:

```markdown
## 9. Decision Log

| Decision | Options Considered | Rationale | Date |
|---|---|---|---|
| Use file-based JSONL for memory | JSONL vs LanceDB vs Cosmos DB | JSONL avoids infra dependency at Phase 2 scale; graduation path defined in S36 | April 2026 |
| Prototype in CCQG repo, not StructureView repo | CCQG vs StructureView | Keeps spec workflow intact; extract before Phase 3 per S35 cross-repo note | April 2026 |
```

Entries are append-only. Never remove a decision — if a decision is reversed, add a new entry
recording the reversal and its rationale.

If a decision is deferred rather than made, record it here with `Status: Deferred — to be resolved
before [milestone]`. Deferred decisions must not block spec approval unless they are blocking
decisions (i.e., the spec cannot be implemented without resolving them).

---

### Section 10 — Delivery Surface & Integration (S71)

Declares where the value this spec promises becomes reachable, and hands every deferred
user-facing surface to a named, accountable owner. The taxonomy validator
(`scripts/ccqg/validate-spec-taxonomy.mjs`) enforces this section's structure on every
spec that declares a Spec Type.

Format:

```markdown
## 10. Delivery Surface & Integration

**Spec Type:** {stream-aligned | platform | complicated-subsystem | enabling}
**Type justification:** {one sentence}

### 10.1 Delivery Surface

<!-- stream-aligned: name every screen/route/command a user touches; each surface
     must have matching entries in the Section 3 file manifest. -->
<!-- platform / complicated-subsystem: name the contract (interface/file) and every
     known consumer segment, with the contract test that proves consumption. -->
<!-- enabling: name the process artifact (template, gate, skill) put in force. -->

| Surface / Contract | Kind | Evidence of delivery |
|---|---|---|
| `/lifecycle` Release Gates panel | screen | Screenshot + route reachable from Roundhouse nav |

**Domain boundary (complete when the spec crosses one):**

- Producing bounded context: Release Gate
- Domain Contract consumed: `IMetricsStore.listRecent('gate-evaluation')`
- Stream Adapter owned here: `GET /api/query/gate-evaluations` + Lifecycle client mapping
- Translation rule: project verdict, stage, and timestamp; no release policy added

### 10.2 Integration Handoffs

<!-- Every user-facing surface this spec creates data for but does NOT deliver.
     A handoff is valid only when BOTH columns 2 and 3 are filled at approval time. -->

| Deferred surface | Owning segment | Tracked issue |
|---|---|---|
| Q4 Compliance Panel verdict rendering | S60 | #342 |

**Handoff rule:** this spec may not reach Status `Complete` while any handoff issue
is open, unless the owner has explicitly accepted the deferral in the issue thread.
```

**Rules:**

- The Spec Type repeated here must match the frontmatter declaration.
- `stream-aligned` specs must list at least one delivery surface in §10.1 and may
  never satisfy DoD Gate 5 with "N/A" (see the Gate 5 Matrix in Section 7).
- `platform` and `complicated-subsystem` specs must either name a consumer segment
  with contract-test evidence in §10.1 or declare a §10.2 handoff.
- Every §10.2 handoff row requires both an owning segment (`S##`) and a tracked
  GitHub issue (`#` + digits) at approval time.
- If a spec defers no surface, state `None` under §10.2 with one sentence of
  justification.

---

## 4. Formatting Rules

| Element | Rule |
|---------|------|
| **Code blocks** | Always specify language: ` ```typescript `, ` ```yaml `, ` ```gherkin `, ` ```text `, ` ```bash ` etc. Never use bare ` ``` `. |
| **File paths** | Always in backtick inline code: `` `docs/timc/observability/thresholds.yaml` `` |
| **Section separators** | Use `---` horizontal rule between every top-level section (##). |
| **Tables** | Use GFM pipe tables. Align pipes. |
| **Heading hierarchy** | H1 for spec title only. H2 for numbered sections. H3 for subsections. H4 for sub-subsections. Never skip levels. |
| **Links** | Use relative paths for links within the repo. |
| **Bold** | Reserve for frontmatter labels and important callouts, not decorative emphasis. |
| **Emoji** | Do not use unless the segment explicitly involves UI copy. |
| **Job Story** | Always the first paragraph of Section 1. In italics. |
| **EARS requirements** | Always in named subsection of Section 3. Never mixed into prose. |
| **Gherkin** | Always in fenced code blocks with ` ```gherkin ` language specifier. |

---

## 5. Documentation-Only Specs

Some segments deliver only documentation and configuration files (no executable code). These
specs follow the same format with the following adjustments:

- **Section 3 (Technical Design):** Replace with "Content Design" — describe the document
  structure, the data model, and cross-references between files rather than code architecture.
  NFR subsection still required where applicable.
- **Section 4 (BDD Scenarios):** Replace with "Validation Scenarios" — describe concrete
  examples that confirm the documentation is correct and complete (e.g., "given this YAML,
  the reader should be able to answer X"). Gherkin is optional for documentation specs.
- **Section 5 (Test Strategy):** Replace with "Verification" — describe how to confirm the
  documents are correct (e.g., YAML lint, link checking, peer review checklist).
- **Section 6 (PR Breakdown):** PR titles use `docs(S##):` prefix instead of `feat(S##):`.
- **Section 10 (Delivery Surface & Integration):** Still required in full — documentation
  specs are typically `enabling` and name the process artifact they put in force.

---

## 6. Living Spec Obligation

Specs marked `Complete` are not frozen — they are living documents. The spec is the
authoritative source of truth, not the code. When implementation diverges from the spec, the spec
must be updated.

**Triggers for spec update:**

- A downstream spec changes the interface or output this spec defines
- An implementation decision changes something described in Section 3
- A bug fix reveals that an acceptance criterion was wrong
- A decision in Section 9 is reversed

**Process:** Open a `docs(S##): update living spec — [reason]` PR. No implementation code in
this PR. The PR description must link to the implementation change that triggered the update.

**Supersession:** If a later spec materially replaces this spec's entire design (not just updates
it), change the Status to `Complete — Superseded by S##` and add a decision log entry. Do not
delete the old spec — it is part of the audit trail.

---

## 7. Checklist Before Opening a Spec PR

- [ ] File named `S##-kebab-case-title.md` in `docs/specs/`
- [ ] Segment number is the next available (no gaps, no duplicates)
- [ ] All 10 sections present and in order
- [ ] All code blocks have language specifiers
- [ ] Frontmatter complete (all 8 fields, including correct Workstream letter and Spec Type)
- [ ] Section 1 opens with a Job Story in `When / I want to / so I can` format
- [ ] Job Story contains no technology names, file names, format names, or tool names — if it does, it has drifted into Section 3 or 4 territory and must be rewritten
- [ ] Job Story passes the technology-swap test: if the entire implementation stack were replaced, would the actor's situation, motivation, and desired outcome still be true?
- [ ] Section 3 contains a named NFR subsection
- [ ] Section 3 functional requirements use EARS notation
- [ ] Section 4 contains at least 2 rules with 3 examples each in the Example Map
- [ ] Section 4 Gherkin scenarios are syntactically valid (`npx gherkin-lint` passes)
- [ ] Section 7 dependencies reference real segment numbers
- [ ] Section 8 acceptance criteria are binary and testable
- [ ] Section 8 includes criterion: "All Gherkin scenarios in Section 4 pass"
- [ ] Section 8 includes criterion: "EARS notation coverage verified (TIMC Light passes)"
- [ ] Section 9 Decision Log has at least one entry (even if "No material decisions — straightforward implementation")
- [ ] Section 10 declares the Spec Type (matching frontmatter) with a one-sentence justification
- [ ] Section 10.1 names every delivery surface or contract with evidence of delivery
- [ ] If the spec crosses a bounded-context boundary, Section 10.1 names the producing
      bounded context, Domain Contract, consumer-owned Stream Adapter or Anti-Corruption
      Layer, and translation rule
- [ ] Section 10.2 lists every deferred user-facing surface with an owning segment and a tracked `#issue` — or states `None` with justification
- [ ] `node scripts/ccqg/validate-spec-taxonomy.mjs <spec-file>` exits 0
- [ ] No hardcoded threshold values — all tuneable values reference `observability/thresholds.yaml`
- [ ] `npm run quality-gate` passes on the branch

### Gate 5 Matrix — Type-Dependent Definition of Done (S71)

The five-gate DoD (Code → Tests → Lint → Integration → UI Verification) keeps gates 1–4
unchanged for all spec types. Gate 5 depends on the declared Spec Type:

| Spec Type | Gate 5 requirement | "N/A" allowed? |
|---|---|---|
| `stream-aligned` | Named screen/route reachable in the running app; navigation evidence (screenshot or recorded check) attached to the final PR | **Never** |
| `platform` | Consumption gate: ≥1 consumer wired via the contract, proven by a contract test in CI; or a first-consumer handoff (segment + issue) per §10.2 | Only via §10.2 handoff |
| `complicated-subsystem` | Same as platform, applied to the facade | Only via §10.2 handoff |
| `enabling` | Adoption gate: the process artifact is merged and active (gate runs, template required, skill invocable) | Never (the artifact itself is the surface) |

This matrix is mirrored in the "Done means done" practice text in `AGENTS.md`,
`.claude/SOUL.md`, and `CLAUDE.md` §6. The taxonomy validator rejects a bare Gate 5
"N/A" claim in any `stream-aligned` spec.

---

## 8. Segment Register

Current highest segment number: **S72**. Next available: **S73**.

### Workstream Legend

| Letter | Full Name | Scope |
|--------|-----------|-------|
| **A** | Domain Knowledge Sub-Agents | Agent card schema, domain expert agents (financial trading, healthcare, IoT), coordination agent, domain lifecycle CLI |
| **B** | Testing Information & Management Center | TIMC shell, CI pipeline scripts, living docs, traceability, observability, release readiness, data ingestion |
| **C** | Azure Metrics Dashboard | React dashboard views, Azure Function backend, Cosmos DB infrastructure, real-time SSE feed |
| **D** | Design System & Platform | Fleet-wide design system (shadcn/ui tokens), UI component library, Turntable Hub, quality-dashboard-builder skill |
| **E** | Developer Experience & Skills | AGENTS.md, SOUL.md, Wrap-Up Skill, BDD scenario generator, test-plan-composer, agent-card-creator |
| **F** | Memory & Orchestration | Shared memory MCP primitives, agent mesh coordination, ExpeL/DSPy learning loops |

### All Segments

| S# | Title | Workstream | Status |
|----|-------|-----------|--------|
| S12 | Agent Card Schema & Registry | A | Complete |
| S13 | Cognitive Architecture | A | Complete |
| S14 | Financial Trading Expert | A | Complete |
| S15 | Coordination Agent | A | Complete |
| S17 | Domain Agent Lifecycle CLI | A | Complete |
| S18 | TIMC Directory Structure & Shell | B | Complete |
| S19 | Test Case Schema & Migration | B | Complete |
| S20 | Living Documentation Pipeline | B | Complete |
| S21 | Traceability Matrix Engine | B | Complete |
| S22 | DORA Metrics & Release Readiness | B | Complete |
| S23 | Domain Extension Hooks | B | Complete |
| S24 | Azure Infrastructure | C | Complete |
| S25 | Data Ingestion Pipeline | B | Complete |
| S26 | Dashboard — Exec Summary & Quality Trends | C | Complete |
| S27 | Dashboard — Agent Activity & TIMC Explorer | C | Complete |
| S28 | Dashboard — Live Gate & Real-Time Feed | C | Complete |
| S29 | Business SLOs, Observability Thresholds & Error Budget Policy | B | Implemented — Pending Review |
| S30 | Synthetic Monitoring & Canary Rollout | B | Implemented — Pending Review |
| S31 | AI Model Governance | B | Implemented — Pending Review |
| S32 | Fleet-Wide Design System Token File | D | Spec Draft — Pending Review |
| S33 | Agents SOUL Authoring | E | Spec Draft — Pending Review |
| S34 | Wrap-Up Skill | E | Spec Draft — Pending Review |
| S35 | TIMC Light MVP | B | Complete |
| S36 | Shared Memory MCP Primitives | F | Spec Draft — Pending Review |
| S37 | Quality Dashboard Builder Skill | D | Spec Draft — Pending Review |
| S38 | Turntable Hub Static | D | Complete |
| S39 | BDD Scenario Generator Skill | E | Spec Draft — Pending Review |
| S40 | Test Plan Composer Skill | E | Spec Draft — Pending Review |
| S41 | QMS Controls (RCA + CAP + HITL) | B | Complete |
| S42 | Test Execution Engine | B | Spec Draft — Pending Review |
| S43 | Accessibility V1 — WCAG Gate | C | Spec Draft — Pending Review |
| S44 | Quality Guardian Activation Layer | B | Spec Draft — Pending Review |
| S45 | Delivery Traceability Registry | C | Complete |
| S46 | UI Consolidation — Roundhouse Shell Unification | D | Complete |
| S47 | Self-Healing Agent (HITL-Gated) | A | Spec Draft — Pending Review |
| S48 | Real-Time Signal Ingestion Layer | C | Spec Draft — Pending Review |
| S49 | TIMC Explorer / Traceability Matrix UI | C | Spec Draft — Pending Review |
| S50 | Agent Activity Feed (Multi-Agent Observability) | C | Spec Draft — Pending Review |
| S51 | Mock-to-Live Data Provider Switching | C | Spec Draft — Pending Review |
| S52 | RCA + CAP Workflow Engine UI | B | Spec Draft — Pending Review |
| S53 | Jira Forge App — Atlassian Marketplace | E | Spec Draft — Pending Review |
| S54 | Test Deduplication | B | Spec Draft — Pending Review |
| S55 | Visual Review / Snapshot Diffing | B | Spec Draft — Pending Review |
| S56 | Low-Code Test Authoring Agent (Gherkin) | A | Spec Draft — Pending Review |
| S57 | Test Data Generator (Context-Aware) | B | Spec Draft — Pending Review |
| S58 | new-ui-pages Token Integration & Shell Pattern Convergence | D | Spec Draft — Pending Review |
| S59 | Dashboard Design System v0.1.3 | D | Complete |
| S60 | Phase 2 Test Plan View UI | C | Complete |
| S60m1 | Wire Gate Verdict Into the Lifecycle Screen (micro-spec) | C | Implemented — Pending Review |
| S61 | Live Gate / Release Readiness Gate Engine (incl. Canary Decision Layer) | B | Spec Draft — Pending Review |
| S62 | Metrics Ingestion — Storage-Agnostic (TMIC/DORA/Hub off file-write loop) | B | Spec Draft — Pending Review |
| S63 | TMIC Additive PML Coverage (v1/v2/Light coexist) | B | Spec Draft — Pending Review |
| S64 | Platform Direction ADR — Postgres + Clerk + Cloud Cost Eval | D | Spec Draft — Pending Review |
| S65 | Cosmos → Postgres Migration (PostgresAdapter implements S62 IMetricsStore) | B | Stub — Pending S64 approval |
| S66 | Clerk Auth Consolidation (phased rollout per WS9 audit) | D | Stub — Pending S64 approval |
| S67 | AWS vs Azure Cloud Migration (conditional on S64 cost trigger) | D | Stub — Conditional |
| S68 | Governance Artifact Version Registry | E | Implemented — Pending Review |
| S69 | Design System Extraction & New UI Salvage Plan | D | Implemented — Pending Review |
| S70 | Fleet Audit Intelligence — Knowledge Base, Wiki Synthesis & Learning Loop | F | Complete |
| S71 | Spec Taxonomy & Delivery Surface — Stream-Aligned, Platform, and Micro-Spec Formats | E | In Progress |
| S72 | Platform Configuration and Settings Control Plane | D | Spec Draft — Pending Review |

### Segment Dependency Notes

| S# | Spec File | Hard Dependencies | Downstream Consumers |
|----|-----------|-------------------|----------------------|
| S62 | [`S62-metrics-ingestion-storage-agnostic.md`](./S62-metrics-ingestion-storage-agnostic.md) | S25 (Data Ingestion Pipeline), S64 (Platform Direction ADR — IMetricsStore contract rationale) | S65 (PostgresAdapter implements IMetricsStore), S61 (canary driver loader reads via IMetricsStore) |

### Micro-Spec Register Rows

Micro-specs register under their parent segment, immediately after the parent's row, using
the parent-scoped number (e.g. `S60m1`). They do not consume sequential `S##` numbers.

---

## Appendix A — Micro-Spec Format (S71)

A micro-spec is a full-citizen governance artifact for small **stream-aligned** slices —
one endpoint wired to one screen is the canonical example. It makes the small vertical
slice the cheapest unit of governed work: half-day wiring tasks get a sanctioned
lightweight path instead of drifting unspecified or being priced out by the full format.

**Naming:** `S##m#-kebab-title.md` where `S##` is the parent segment whose stream the
slice belongs to (e.g. `S60m1-wire-gate-verdict-into-lifecycle-screen.md`). Micro-specs
register under their parent in the Segment Register.

**Template:** [`templates/micro-spec-template.md`](./templates/micro-spec-template.md)

### Eligibility (all must hold; if any fails, write a full spec)

- Estimated effort ≤ 2 days; file manifest ≤ 8 files
- No new infrastructure, no new external dependency, no new domain concept
- Spec Type is `stream-aligned` (micro-specs exist to deliver visible slices)
- Consumes existing Domain Contracts without modifying them
- May add a thin stream-owned Stream Adapter required to deliver the named surface
- Does not add domain policy, redefine domain vocabulary, or create a Shared Kernel

### Required Content (target ≤ 2 pages)

| Section | Content |
|---|---|
| Frontmatter | Parent segment, Spec Type (always `stream-aligned`), Status, Effort |
| Job Story | One Job Story, same rules as full specs |
| Scope | In/out bullets; file manifest table |
| Requirements | 1–5 EARS statements |
| Scenarios | 2–5 Gherkin scenarios (example map optional) |
| Delivery Surface | The Section 10.1 table — mandatory, one row minimum; include Domain Contract and Stream Adapter details when crossing a boundary |
| DoD checklist | The five gates inline, Gate 5 per the stream-aligned rule |
| Decision log | Single line minimum |

Micro-specs are validated by the same taxonomy validator as full specs
(`node scripts/ccqg/validate-spec-taxonomy.mjs <file>` must exit 0).
