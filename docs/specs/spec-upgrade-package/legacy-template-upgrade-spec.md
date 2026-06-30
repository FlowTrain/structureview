# Legacy Template Upgrade Spec

**Status:** Draft
**Scope:** Legacy segment templates, specs, and instruction artifacts that predate S71 taxonomy.
**Primary Templates:** `../templates/full-spec-template.md`, `../templates/micro-spec-template.md`

---

## 1. Objective

**Job Story:** When I am modernizing older delivery artifacts, I want every spec to expose its
delivery surface, type, test evidence, and research assumptions, so I can approve agent work
without losing traceability.

This upgrade converts legacy templates into the current ten-section S71 format and adds a
repeatable route for stream-aligned micro-specs. The goal is not to rewrite history for its own
sake; it is to make active or reused artifacts pass the same governance checks as new specs.

The measurable outcome is that every touched artifact has a declared Spec Type, a delivery
surface or handoff, EARS-style requirements, BDD or validation scenarios, and a decision log.

---

## 2. Scope

### 2.1 In Scope

- Create missing current templates under `docs/specs/templates/`.
- Define migration rules for legacy full specs.
- Define when stream-aligned work should split into a micro-spec.
- Require research notes for stale, missing, or source-dependent claims.

### 2.2 Out of Scope

- Bulk migration of every historical spec in one pass.
- Changing app runtime code.
- Replacing TIMC Light scoring logic.

---

## 3. Content Design

### 3.1 Legacy Upgrade Rules

- REQ-001: The upgrade process shall preserve the original artifact's intent before adding new governance fields.
- REQ-002: When a legacy spec includes user-visible delivery, the upgraded artifact shall declare `stream-aligned` unless the visible slice is split into a child micro-spec.
- REQ-003: If a legacy spec defines reusable contracts consumed by other work, then the upgraded artifact shall declare `platform` or `complicated-subsystem` and name at least one consumer or handoff.
- REQ-004: Where a legacy spec is process-only, the upgraded artifact shall declare `enabling` and name the process artifact put in force.
- REQ-005: The upgrade process shall record classification decisions in Section 9 of the target artifact.

### 3.2 Required Migration Steps

| Step | Action | Output |
|---|---|---|
| 1 | Inventory source artifact | File path, owner, current status |
| 2 | Classify target type | Full spec, prompt upgrade spec, micro-spec, or archive |
| 3 | Apply target template | Current section structure |
| 4 | Fill evidence gaps | Research notes, local source references, or open questions |
| 5 | Validate | TIMC Light section/EARS/BDD checks and reviewer checklist |

### 3.3 Non-Functional Requirements

| Dimension | Requirement |
|---|---|
| Performance | Not applicable - documentation-only migration. |
| Security | Research notes must not include credentials, private customer data, or unpublished secrets. |
| Observability | Upgrade status is observable through artifact status, acceptance criteria, and decision logs. |
| Reliability | Every upgraded artifact must be independently understandable without relying on chat context. |
| Tuneable values | Any thresholds introduced by an upgraded spec must reference `observability/thresholds.yaml`. |

---

## 4. Validation Scenarios

**Rule:** Active specs must expose delivery accountability.
- Happy path: A stream-aligned legacy spec gains Section 10.1 with a route, command, or screen.
- Edge case: A platform spec has no first consumer yet and records a Section 10.2 handoff.
- Failure case: A spec claims UI verification is not applicable while declaring `stream-aligned`.

**Rule:** Small visible slices should use micro-specs.
- Happy path: A one-endpoint, one-screen wiring task becomes `S##m#`.
- Edge case: The slice needs a thin stream adapter but does not alter a Domain Contract.
- Failure case: The slice adds a new domain concept and must become a full spec.

```gherkin
Feature: Legacy template upgrade

  Scenario: Stream-aligned legacy spec declares a delivery surface
    Given a legacy spec that delivers a user-visible screen
    When the spec is upgraded to S71 format
    Then Section 10.1 names the screen and evidence of delivery

  Scenario: Platform spec without a consumer records a handoff
    Given a legacy spec that defines a reusable contract
    When no consumer is implemented in the same segment
    Then Section 10.2 names the owning segment and tracked issue

  Scenario: Small visible slice becomes a micro-spec
    Given a task estimated at two days or less with no new domain concept
    When it delivers one visible stream-aligned surface
    Then the task uses `docs/specs/templates/micro-spec-template.md`
```

---

## 5. Verification

- Confirm the target artifact uses one of the templates in `docs/specs/templates/`.
- Run TIMC Light for Sections, EARS, and BDD signals where available.
- Review Section 10 for type-specific delivery evidence.
- Review `research-gap-log.md` before approval and close or explicitly defer each gap.

---

## 6. PR Breakdown

### PR 1 - Template Upgrade Package

- PR title: `docs(S71): add legacy spec and prompt upgrade package`
- Branch name: `docs/s71-legacy-spec-prompt-upgrade-package`
- Depends on: S71 taxonomy instructions
- Delivers:
  - New files: `docs/specs/templates/*.md`
  - New files: `docs/specs/spec-upgrade-package/*.md`
- Total: 7 new files + 0 modified files
- Acceptance gate:
  1. `git -C structureview diff -- structureview/docs`

```text
docs(S71): add legacy spec and prompt upgrade package
```

---

## 7. Dependencies

### 7.1 Hard Dependencies

| Segment | Consumed output | Reason |
|---|---|---|
| S71 | Spec taxonomy and micro-spec format | Defines target classification and Section 10 rules. |

### 7.2 Soft Dependencies

| Segment | Helpful output | Reason |
|---|---|---|
| S35 | TIMC Light MVP | Provides local scoring for upgraded specs. |
| S39 | BDD Scenario Generator Skill | Can accelerate scenario scaffolding. |

### 7.3 What Downstream Segments Depend On

| Segment | Consumes | Contract or surface |
|---|---|---|
| Future legacy migrations | Templates and routing rules | `docs/specs/templates/` and this package. |

---

## 8. Acceptance Criteria

- [ ] Full spec, micro-spec, and prompt upgrade templates exist under `docs/specs/templates/`.
- [ ] Package README explains the upgrade flow and routing summary.
- [ ] Legacy migration rules require Spec Type, delivery surface, EARS requirements, and Decision Log.
- [ ] Micro-spec routing rules prevent new domain policy from being hidden in micro-specs.
- [ ] Research gap log includes source-backed findings and open gaps.

---

## 9. Decision Log

| Decision | Options Considered | Rationale | Date |
|---|---|---|---|
| Add templates beside docs instead of runtime code | Docs package vs app code change | The current gap is governance artifacts, not behavior. | June 2026 |
| Treat prompt upgrades as specs | Inline prompt edits vs auditable prompt upgrade spec | Prompt behavior needs inputs, outputs, research, and evaluation evidence. | June 2026 |

---

## 10. Delivery Surface & Integration

**Spec Type:** enabling
**Type justification:** This package puts an authoring and migration process artifact in force.

### 10.1 Delivery Surface

| Surface / Contract | Kind | Evidence of delivery |
|---|---|---|
| `docs/specs/spec-upgrade-package/README.md` | process artifact | Package index and workflow |
| `docs/specs/templates/full-spec-template.md` | process artifact | Current full spec template |
| `docs/specs/templates/micro-spec-template.md` | process artifact | Current micro-spec template |
| `docs/specs/templates/prompt-upgrade-template.md` | process artifact | Prompt upgrade template |

**Domain boundary:** Not applicable - documentation-only governance package.

### 10.2 Integration Handoffs

| Deferred surface | Owning segment | Tracked issue |
|---|---|---|
| None | N/A | N/A |

No handoffs are deferred because this package delivers the process artifacts directly.
