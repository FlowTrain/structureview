# Legacy Spec and Prompt Upgrade Package

This package upgrades legacy spec and prompt artifacts to the current StructureView/CCQG
governance shape: full specs use the S71 ten-section format, prompt upgrades become auditable
mini-specs, and small visible slices use stream-aligned micro-specs instead of drifting into
untracked implementation notes.

## Package Contents

| File | Purpose |
|---|---|
| `legacy-template-upgrade-spec.md` | Operating spec for migrating legacy segment templates to the current S71 format. |
| `prompt-upgrade-spec.md` | Operating spec for upgrading prompts and prompt templates with research, contracts, and evaluations. |
| `micro-spec-routing.md` | Decision rules for when a stream-aligned slice should be a micro-spec. |
| `research-gap-log.md` | Source-backed research notes and open gaps to close before approving upgrades. |
| `../templates/full-spec-template.md` | Current full segment template. |
| `../templates/micro-spec-template.md` | Current stream-aligned micro-spec template. |
| `../templates/prompt-upgrade-template.md` | Prompt upgrade template. |

## Upgrade Flow

1. Inventory legacy artifacts and classify each as full spec, prompt upgrade, micro-spec, or archive.
2. Apply the appropriate template from `docs/specs/templates/`.
3. Close research gaps before approval, using `research-gap-log.md` for source notes.
4. Run TIMC Light checks for section completeness, EARS coverage, and BDD coverage.
5. Record every classification and unresolved handoff in the target artifact's Decision Log.

## Routing Summary

| Legacy artifact shape | Target |
|---|---|
| Multi-sprint segment or cross-context change | Full spec |
| Prompt, system instruction, rubric, model task template | Prompt upgrade spec |
| <= 2 day user-visible vertical slice under an existing parent segment | Micro-spec |
| Historical note with no active delivery or governance use | Archive with rationale |
