# S##m#: Title

**Parent Segment:** S##
**Spec Type:** stream-aligned
**Status:** Spec Draft - Pending Review
**Estimated Effort:** {<= 2 days}
**File Manifest Limit:** {<= 8 files}

---

## Job Story

**Job Story:** When [situation], I want to [motivation], so I can [outcome].

---

## Scope

### In Scope

- [Visible slice delivered.]

### Out of Scope

- [Anything that changes domain policy, introduces infrastructure, or exceeds the parent stream.]

### File Manifest

| File | Type | Description |
|---|---|---|
| `path/to/file` | new/modified | [description] |

---

## Requirements

- REQ-001: The system shall [action].
- REQ-002: When [trigger], the system shall [action].
- REQ-003: If [condition], then the system shall [action].

---

## Scenarios

```gherkin
Feature: [Micro-slice title]

  Scenario: [Visible happy path]
    Given [precondition]
    When [user action or system event]
    Then [visible outcome]

  Scenario: [Boundary or failure path]
    Given [boundary/failure precondition]
    When [action]
    Then [visible or testable response]
```

---

## Delivery Surface

| Surface / Contract | Kind | Evidence of delivery |
|---|---|---|
| [screen/route/command] | screen/command | [screenshot, smoke test, route check] |

**Domain Contract consumed:** [existing contract]
**Stream Adapter owned here:** [thin stream-owned adapter, if needed]
**Translation rule:** [projection only; no new domain policy]

---

## Definition of Done

- [ ] Gate 1 - Code: file manifest complete and scoped to <= 8 files.
- [ ] Gate 2 - Tests: scenarios above are covered by automated or documented smoke checks.
- [ ] Gate 3 - Lint: project lint/typecheck passes for touched files.
- [ ] Gate 4 - Integration: parent segment contract still passes.
- [ ] Gate 5 - UI verification: named surface is reachable in the running product with evidence attached.

---

## Decision Log

| Decision | Rationale | Date |
|---|---|---|
| [decision] | [rationale] | [Month YYYY] |
