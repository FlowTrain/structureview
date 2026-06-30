# Research Gap Log

This log captures current source-backed findings for the legacy spec and prompt upgrade package.
Use it as the first pass of evidence, then append project-specific findings as individual
artifacts are upgraded.

## Source-Backed Findings

| Topic | Source | Finding | Impact |
|---|---|---|---|
| Prompt upgrade structure | [OpenAI prompt engineering guide](https://developers.openai.com/api/docs/guides/prompt-engineering) | Effective prompts should give clear instructions and constraints, with enough context to produce consistent outputs. | Prompt upgrade specs require labeled task, context, constraints, tool policy, and output contract blocks. |
| Prompt behavior governance | [OpenAI Model Spec](https://model-spec.openai.com/) | Model behavior is governed through explicit instruction layers and behavioral expectations. | Prompt upgrades must separate durable instructions from task variables and define conflict/failure behavior. |
| Team-type taxonomy | [Team Topologies key concepts](https://teamtopologies.com/key-concepts) | Stream-aligned, platform, enabling, and complicated-subsystem teams have different responsibilities and interaction models. | S71 Spec Type routing remains aligned to the four-type taxonomy. |
| BDD syntax | [Cucumber Gherkin reference](https://cucumber.io/docs/gherkin/reference/) | Gherkin scenarios use step keywords such as Given, When, Then, And, and But; Scenario Outline supports data-driven examples. | Full specs and micro-specs should keep testable Gherkin scenarios with binary Then assertions. |
| EARS notation | [Alistair Mavin EARS overview](https://alistairmavin.com/ears/) and [IEEE EARS abstract](https://ieeexplore.ieee.org/abstract/document/5328509/) | EARS was developed at Rolls-Royce and uses a small set of structural rules to reduce ambiguity, complexity, and vagueness. | Upgraded requirements should use EARS patterns and avoid vague modal language. |
| Domain boundary translation | [Microsoft anti-corruption layer pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) | An anti-corruption layer protects a domain model by translating across boundaries rather than leaking external concepts. | Micro-specs may add thin stream adapters, but domain policy or shared models require full specs/ADRs. |
| Atlassian content format | [Atlassian Document Format reference](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/) | ADF represents rich text stored in Atlassian products as structured JSON. | Prompt/spec authoring research should account for Markdown-to-ADF fidelity when Jira/Confluence sync is involved. |

## Open Gaps To Close Per Upgrade

| Gap | Close before approval by | Notes |
|---|---|---|
| Legacy artifact inventory | Listing source file, owner, active/inactive status, and target route. | Do this before editing each artifact. |
| Product-specific delivery evidence | Screenshot, route check, CLI transcript, or contract test. | Required for Section 10 acceptance. |
| Prompt eval baseline | At least one current output sample from the legacy prompt. | Needed to know whether the upgrade improves or preserves behavior. |
| External API freshness | Current official docs for any API, model, package, or platform behavior referenced. | Required when an artifact cites current platform behavior. |
| Issue handoff IDs | GitHub issue numbers for deferred surfaces. | Required at approval time for Section 10.2 handoffs. |

## Research Workflow

1. Prefer local source files for project intent and implementation facts.
2. Use official or primary external sources for API, platform, framework, or methodology claims.
3. Record each source in the target artifact's research notes with the decision it changed.
4. If a source cannot confirm a claim, mark the claim as assumption, deferred decision, or blocker.
