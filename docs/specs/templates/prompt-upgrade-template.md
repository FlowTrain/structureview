# Prompt Upgrade Spec: [Prompt or Template Name]

**Owner:** [team/person]
**Source Artifact:** `path/to/legacy-prompt-or-template`
**Target Artifact:** `path/to/upgraded-prompt-or-template`
**Status:** Draft
**Last Reviewed:** [Month YYYY]

---

## 1. Upgrade Objective

**Job Story:** When [situation], I want the prompt to [motivation], so I can [outcome].

[Describe the behavior the upgraded prompt must improve, preserve, or make testable.]

---

## 2. Legacy Assessment

| Area | Current state | Risk |
|---|---|---|
| Instruction hierarchy | [system/developer/user/tool handling] | [risk] |
| Inputs and context | [required inputs, optional context, missing fields] | [risk] |
| Output contract | [format, schema, examples] | [risk] |
| Tool and source use | [allowed tools, citation/source rules] | [risk] |
| Safety and refusal behavior | [constraints] | [risk] |
| Evaluation coverage | [existing tests or none] | [risk] |

---

## 3. Target Prompt Contract

### 3.1 Inputs

| Input | Required | Description | Validation |
|---|---|---|---|
| `[input_name]` | yes/no | [description] | [validation] |

### 3.2 Output

```json
{
  "field": "expected shape"
}
```

### 3.3 Behavioral Requirements

- REQ-001: The prompt shall state the task, context, constraints, and output contract in separate labeled blocks.
- REQ-002: When source material is missing or stale, the prompt shall require research or an explicit uncertainty note before final output.
- REQ-003: If the model cannot satisfy a required field, then the prompt shall require a blocking question or a `needs_input` result.
- REQ-004: Where tools are available, the prompt shall define when tool use is required, optional, or forbidden.

---

## 4. Evaluation Scenarios

```gherkin
Feature: [Prompt upgrade]

  Scenario: Produces the target structure
    Given valid required inputs
    When the upgraded prompt is run
    Then the response matches the target output contract

  Scenario: Handles missing context
    Given a required input is absent
    When the upgraded prompt is run
    Then the response requests the missing input or returns `needs_input`

  Scenario: Uses research for stale facts
    Given the task depends on current external facts
    When the upgraded prompt is run with tools available
    Then the response includes sourced research notes or an uncertainty note
```

---

## 5. Research Notes

| Gap | Source | Finding | Impact on prompt |
|---|---|---|---|
| [gap] | [URL or local file] | [finding] | [prompt change] |

---

## 6. Acceptance Criteria

- [ ] Legacy prompt risks are captured in Section 2.
- [ ] Target inputs and output contract are explicit.
- [ ] Behavioral requirements use EARS notation.
- [ ] Evaluation scenarios cover happy path, missing context, and stale/current-fact behavior.
- [ ] Research-backed changes cite sources or local files.
