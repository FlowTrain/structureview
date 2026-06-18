# TIMC Light — Evaluation Criteria

How StructureView's TIMC Light engine (`src/timc-light/`) scores a document. This reflects
the implemented logic, not an aspiration. All signals are heuristic, framework-free, and run
locally; they are **recommendations**, not compliance assertions.

## Scoring model (shared)

- Each signal returns a **0–100 score**, a list of **findings**, and a signal-specific
  **breakdown**.
- For a Markdown spec the engine runs three signals — **EARS coverage**, **Section
  completeness**, **BDD coverage** — and the document's **composite** score is the **average
  of all three**. The bar is intentionally strict: a spec missing inline BDD scenarios (or
  required sections, or EARS-form requirements) takes the hit, so pre-template specs surface
  the work needed to reach the current standard. JSON documents run a separate JSON-quality
  signal instead.
- **Traffic-light status** (used for colour) applies to any score:

  | Status | Score   | Colour |
  | ------ | ------- | ------ |
  | pass   | ≥ 80    | green  |
  | warn   | 60 – 79 | yellow |
  | fail   | < 60    | red    |

---

## 1. EARS coverage

Measures what fraction of a spec's requirements are written in EARS notation (Easy Approach
to Requirements Syntax).

### What counts as a requirement

A line is evaluated as a requirement only if it is a **list item** (`-`, `*`, or `1.`/`1)`)
**and** carries requirement language — either:

- a **normative verb**: `shall`, `must`, `should`, `will`, `may`; or
- an **EARS trigger** at the start: `When`, `While`, `If`, `Where`.

Prose bullets, file manifests, and descriptive notes are ignored. A leading requirement
label is stripped first: `- **AC1** — …`, `- REQ-001: …`, `- NFR-03. …`.

### When a requirement is "covered" (EARS-compliant)

A requirement is **covered** if it matches one of the five EARS patterns using a **strong
modal** (`shall` or `must`) — with any subject ("the system", "the engine", "consumers",
"every test file"), not only "the system":

| Pattern          | Shape                               | Example                                                     |
| ---------------- | ----------------------------------- | ----------------------------------------------------------- |
| Ubiquitous       | `<subject> shall/must …`            | The system shall log every authentication attempt.          |
| Event-driven     | `When …, <subject> shall/must …`    | When a user submits the form, the system shall validate.    |
| State-driven     | `While …, <subject> shall/must …`   | While the account is locked, the system shall reject…       |
| Unwanted         | `If …, then <subject> shall/must …` | If the rate limit is exceeded, the system shall return 429. |
| Optional feature | `Where …, <subject> shall/must …`   | Where SSO is enabled, the system shall require a token.     |

### Score

```text
score = (covered requirements / total requirements) × 100
```

A document with **no requirement lines** scores **100** (nothing to flag). Findings are
raised for each requirement that is **not** in EARS format.

### Per-requirement status (EARS view)

Each requirement is also given a status for the EARS analysis view:

| Status | Condition                                     | Score |
| ------ | --------------------------------------------- | ----- |
| pass   | matches an EARS pattern and is specific       | 92    |
| warn   | matches a pattern but uses **vague** language | 70    |
| fail   | no EARS pattern (or a weak/ambiguous verb)    | 38    |

**Vague terms** that demote a matched requirement to `warn`: _relevant, appropriate(ly), as
needed, as required, etc, reasonable, user-friendly, robust, efficient(ly), gracefully,
properly, adequate(ly), several, some, many_.

> Note: matched-but-vague requirements still count as **covered** for the coverage score;
> the `warn` status is a quality nuance shown per requirement.

---

## 2. Section completeness

Checks a spec against the **10 canonical required sections** from `spec-instructions.md §3`.

### Evidence

A section is **present** if a heading (`#`–`####`) matches its keyword(s). Only heading
lines are searched.

| #   | Required section               | Matches a heading containing…               |
| --- | ------------------------------ | ------------------------------------------- |
| 1   | Objective                      | "objective"                                 |
| 2   | Scope                          | "scope"                                     |
| 3   | Technical Design               | "technical design" or "design"              |
| 4   | BDD Scenarios                  | "bdd", "gherkin", or "scenarios"            |
| 5   | Test Strategy                  | "test strategy", "test plan", or "testing"  |
| 6   | PR Breakdown                   | "pr breakdown", "pull request", or "PR(s)"  |
| 7   | Dependencies                   | "dependenc…"                                |
| 8   | Acceptance Criteria            | "acceptance criteria"                       |
| 9   | Decision Log                   | "decision log"                              |
| 10  | Delivery Surface & Integration | "delivery surface" or "integration handoff" |

### Score

```text
score = (present sections / 10) × 100
```

The Sections view lists all ten with a present/missing flag; findings are raised for each
missing section.

---

## 3. BDD coverage

Checks that the Gherkin scenarios in a spec are well-formed.

### What counts as a scenario

A line introducing `Scenario:`, `Scenario Outline:`, or `Example:` starts a scenario block
(leading list/quote markers are tolerated). **Precision rule:** a block is only counted as a
real scenario if it contains **at least one** `Given`, `When`, or `Then` step. This excludes
prose lines that merely contain the words "Scenario"/"Example".

### Well-formed

A counted scenario is **well-formed** when it has **all three**: `Given` **and** `When`
**and** `Then`. Otherwise a finding names what's missing.

### Score

```text
score = (well-formed scenarios / total scenarios) × 100
```

A document with **no scenarios** scores **0** with a single finding ("No Gherkin scenarios
found"), since the BDD view is specifically about scenario quality.

---

## 4. BDD generator (companion to the BDD signal)

The generator scaffolds Gherkin from a spec (the deterministic part of the CCQG S39
bdd-scenario-generator skill — the LLM skill refines phrasing, edge cases, and step
definitions).

### Inputs (in priority order)

1. **Job Stories** — `When <situation>, I want to <motivation>, so I can <outcome>.`
   - `situation → Given`, `motivation → When`, `outcome → Then` (one Scenario each), and the
     first story seeds the `Feature` narrative (`As a … / I want to … / So that I can …`).
2. **Acceptance criteria** (fallback when no job stories) — labelled lines (`AC01`, `REQ-3`)
   anywhere, else bullets under an "Acceptance Criteria" heading (capped at 15). One Scenario
   each.

Every generation also appends a parametric **Scenario Outline** with an `Examples` table
covering four edge-case categories: null/missing, boundary, auth, and concurrency.

---

## Out of scope

TIMC Light examines **one document at a time**. It does not do cross-document traceability,
project-level aggregation, agent-driven rewrites, or compliance-artifact generation — those
are Quality Guardian capabilities.
