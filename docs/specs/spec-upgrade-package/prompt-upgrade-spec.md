# Prompt Upgrade Operating Spec

**Status:** Draft
**Primary Template:** `../templates/prompt-upgrade-template.md`

---

## 1. Objective

**Job Story:** When I reuse or modernize a legacy prompt, I want its behavior, inputs, output
contract, research assumptions, and evaluations to be explicit, so I can upgrade it without
accidentally changing production behavior.

Prompt upgrades are treated as governed artifacts because prompts encode product behavior. The
upgrade must separate instruction hierarchy, tool/source policy, output contract, and evaluation
coverage so future model changes can be tested instead of guessed.

---

## 2. Scope

### 2.1 In Scope

- Prompt templates, system/developer instructions, evaluator prompts, and rubric prompts.
- Research-backed updates for stale tool, model, API, or domain facts.
- Evaluation scenarios covering structure, missing context, and current-fact behavior.

### 2.2 Out of Scope

- Model fine-tuning datasets.
- Production prompt registry implementation.
- Automated eval runner implementation.

---

## 3. Content Design

### 3.1 Prompt Upgrade Rules

- REQ-001: The upgraded prompt shall separate role, task, context, constraints, tool policy, and output contract into labeled blocks.
- REQ-002: When the task depends on facts that can change, the upgraded prompt shall require research or an explicit uncertainty note.
- REQ-003: If required inputs are missing, then the upgraded prompt shall ask a blocking question or return a structured `needs_input` result.
- REQ-004: Where structured output is required, the upgraded prompt shall include a schema, example, or field-level contract.
- REQ-005: The upgraded prompt shall include evaluation scenarios before approval.

### 3.2 Upgrade Checklist

| Area | Upgrade action |
|---|---|
| Instruction hierarchy | Separate durable instructions from user/task variables. |
| Context | Name required and optional inputs; define freshness requirements. |
| Tool use | State when research, source lookup, code execution, or file inspection is required. |
| Output | Define exact structure and failure shape. |
| Safety | Define refusal, escalation, and uncertainty behavior. |
| Evals | Add at least happy path, missing context, and stale/current-fact scenarios. |

### 3.3 Non-Functional Requirements

| Dimension | Requirement |
|---|---|
| Performance | Prompts should minimize repeated context and keep reusable policy outside task-specific examples. |
| Security | Prompts must not embed secrets and must mark private source material handling expectations. |
| Observability | Prompt versions should be reviewable through source control and evaluation notes. |
| Reliability | Output contracts must include fallback behavior for missing or conflicting inputs. |
| Tuneable values | Any scoring threshold must reference a named config artifact, not prose-only magic numbers. |

---

## 4. Evaluation Scenarios

```gherkin
Feature: Prompt upgrade governance

  Scenario: Upgraded prompt returns the expected contract
    Given all required inputs are present
    When the upgraded prompt is executed
    Then the response matches the target output structure

  Scenario: Upgraded prompt blocks on missing required input
    Given a required input is missing
    When the upgraded prompt is executed
    Then it asks for the missing input or returns `needs_input`

  Scenario: Upgraded prompt researches current facts
    Given the task depends on information that may have changed
    When browsing or source lookup is available
    Then the response cites current source notes before finalizing the answer
```

---

## 5. Verification

- Review the completed prompt upgrade template.
- Run representative examples against the upgraded prompt.
- Confirm source-backed changes are recorded in Section 5 of the prompt upgrade artifact.
- Confirm failures are explicit rather than silent best-effort guesses.

---

## 6. PR Breakdown

### PR 1 - Prompt Upgrade Governance

- PR title: `docs(S71): add prompt upgrade operating spec`
- Branch name: `docs/s71-prompt-upgrade-operating-spec`
- Depends on: S71 taxonomy instructions
- Delivers:
  - New files: `docs/specs/templates/prompt-upgrade-template.md`
  - New files: `docs/specs/spec-upgrade-package/prompt-upgrade-spec.md`
- Total: 2 new files + 0 modified files
- Acceptance gate:
  1. `git -C structureview diff -- structureview/docs`

```text
docs(S71): add prompt upgrade operating spec
```

---

## 7. Dependencies

### 7.1 Hard Dependencies

| Segment | Consumed output | Reason |
|---|---|---|
| S71 | Enabling spec governance | Prompt upgrades are process artifacts governed by S71. |

### 7.2 Soft Dependencies

| Segment | Helpful output | Reason |
|---|---|---|
| S70 | Knowledge base and learning loop | Can feed prompt upgrade research findings. |

### 7.3 What Downstream Segments Depend On

| Segment | Consumes | Contract or surface |
|---|---|---|
| Future prompt migrations | Prompt upgrade template | `docs/specs/templates/prompt-upgrade-template.md` |

---

## 8. Acceptance Criteria

- [ ] Prompt upgrade template includes legacy assessment, target contract, behavioral requirements, scenarios, and research notes.
- [ ] Operating spec requires research for stale or changing facts.
- [ ] Operating spec requires eval scenarios before approval.
- [ ] Behavioral requirements use EARS notation.

---

## 9. Decision Log

| Decision | Options Considered | Rationale | Date |
|---|---|---|---|
| Require current-fact handling in prompt upgrades | Optional research note vs mandatory freshness rule | The user specifically requested additional research to close gaps during upgrade. | June 2026 |

---

## 10. Delivery Surface & Integration

**Spec Type:** enabling
**Type justification:** This spec puts a prompt upgrade process artifact in force.

### 10.1 Delivery Surface

| Surface / Contract | Kind | Evidence of delivery |
|---|---|---|
| `docs/specs/templates/prompt-upgrade-template.md` | process artifact | Template exists and defines upgrade/eval sections |

**Domain boundary:** Not applicable - prompt governance process only.

### 10.2 Integration Handoffs

| Deferred surface | Owning segment | Tracked issue |
|---|---|---|
| None | N/A | N/A |

No handoffs are deferred.
