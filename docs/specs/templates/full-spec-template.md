# S##: Title

**Segment:** S##
**Workstream:** {Letter} - {Workstream Name}
**Phase:** {Number} ({Phase Name})
**Status:** Spec Draft - Pending Review
**Spec Type:** {stream-aligned | platform | complicated-subsystem | enabling}
**Depends On:** {S## (Short Name) | None}
**Estimated Effort:** {N sprint(s)}
**PR Strategy:** Spec PR -> {N} implementation PR(s)

---

## 1. Objective

**Job Story:** When [situation], I want to [motivation], so I can [outcome].

[What this segment delivers.]

[Why this matters and what gap it closes.]

[Measurable outcome once complete.]

---

## 2. Scope

### 2.1 In Scope

- `path/to/file`: [deliverable]

### 2.2 Out of Scope

- [Deferred item] - owned by [S## or issue].

---

## 3. Technical Design

### 3.1 File Manifest

| File | Type | Description |
|---|---|---|
| `path/to/file` | new | [description] |

### 3.2 Functional Requirements

- REQ-001: The system shall [action].
- REQ-002: When [trigger], the system shall [action].
- REQ-003: If [condition], then the system shall [action].

### 3.3 Non-Functional Requirements

| Dimension | Requirement |
|---|---|
| Performance | [Threshold or "Not applicable - reason"] |
| Security | [Boundary, data classification, credential handling] |
| Observability | [Metrics, logs, alerts; thresholds reference `observability/thresholds.yaml`] |
| Reliability | [Retry, degradation, uptime, recovery] |
| Tuneable values | [All tuneable values and config locations] |

---

## 4. BDD Scenarios

### 4.1 Example Map

**Rule:** [Plain-language rule]
- Happy path: [example]
- Edge case: [example]
- Failure case: [example]

**Rule:** [Plain-language rule]
- Happy path: [example]
- Edge case: [example]
- Failure case: [example]

### 4.2 Gherkin Scenarios

```gherkin
Feature: [Feature name]

  Scenario: [Happy path]
    Given [precondition]
    When [action]
    Then [binary outcome]

  Scenario: [Edge case]
    Given [boundary precondition]
    When [action]
    Then [boundary outcome]

  Scenario: [Failure case]
    Given [failure precondition]
    When [action]
    Then [failure response]
```

---

## 5. Test Strategy

- BDD test wiring: [runner, feature path, step-definition path]
- Unit tests: [files, mocks, coverage target]
- Integration or smoke tests: [verification]
- Manual verification: [remaining checklist or None]
- Coverage target: [TIMC quadrants and threshold]

---

## 6. PR Breakdown

### PR 1 - [Title]

- PR title: `feat(S##): [short description]`
- Branch name: `feat/s##-[kebab-description]`
- Depends on: [None or PR/segment]
- Delivers:
  - New files: `path/to/file`
  - Modified files: `path/to/file`
- Total: X new files + Y modified files
- Acceptance gate:
  1. `[command]`

```text
feat(S##): [commit message]
test(S##): [commit message]
```

---

## 7. Dependencies

### 7.1 Hard Dependencies

| Segment | Consumed output | Reason |
|---|---|---|
| S## | [output] | [reason] |

### 7.2 Soft Dependencies

| Segment | Helpful output | Reason |
|---|---|---|
| S## | [output] | [reason] |

### 7.3 What Downstream Segments Depend On

| Segment | Consumes | Contract or surface |
|---|---|---|
| S## | [output] | [contract/surface] |

---

## 8. Acceptance Criteria

- [ ] [Binary criterion]
- [ ] All Gherkin scenarios in Section 4 pass.
- [ ] EARS notation coverage verified by TIMC Light.

---

## 9. Decision Log

| Decision | Options Considered | Rationale | Date |
|---|---|---|---|
| [decision] | [options] | [rationale] | [Month YYYY] |

---

## 10. Delivery Surface & Integration

**Spec Type:** {stream-aligned | platform | complicated-subsystem | enabling}
**Type justification:** [One sentence.]

### 10.1 Delivery Surface

| Surface / Contract | Kind | Evidence of delivery |
|---|---|---|
| [route, screen, command, contract, or process artifact] | [screen/command/contract/process] | [test, screenshot, route, contract test, or gate] |

**Domain boundary:** [Complete when the spec crosses one.]

- Producing bounded context: [context]
- Domain Contract consumed: [contract]
- Stream Adapter or Anti-Corruption Layer owned here: [adapter/layer]
- Translation rule: [projection only; no producer policy changes]

### 10.2 Integration Handoffs

| Deferred surface | Owning segment | Tracked issue |
|---|---|---|
| None | N/A | N/A |

[Justification if no handoffs.]
