# Spec — Fleet Packaging, Shared Config, and the Spike Lane (PROPOSE stage)

> **Status:** Proposal — fleet-scoped, drafted in the StructureView repo because that's where
> the course-correction starts, but it governs all four engines. Answers four owner questions
> (2026-07-11): how does Quality-Guardian's good stuff reach StructureView; how do the 4 engines
> stay individually sellable; where do spikes live so the gate doesn't kill them; and is there an
> "enterprise dotfile/config repo" that makes this easier. Short answer to the last: **yes, and it
> has three well-known parts.** This spec names them and the rules that make extraction cheap later.

## 1. The problem, named

The monorepo mixes three things that want different rigor: **shippable engines** (sellable units),
**shared foundations** (tokens, config, the TIMC engine), and **spikes** (ideas on paper). Right
now they share one gate and one namespace, so either the gate strangles the spikes or the spikes
pollute the shippable surface (see: the antagonist leaking into the shipping preload; the fake
CORPUS/sample data). The fix is not more discipline applied uniformly — it's **three lanes with
three different contracts**, plus a promotion ritual between them.

## 2. The "enterprise dotfile repo" — what it actually is (three parts)

The instinct is right; the industry answer is three cooperating pieces, not one magic repo:

1. **Shared config *packages*** — `@trainyard/eslint-config`, `@trainyard/tsconfig`,
   `@trainyard/prettier-config`, and the already-real `@trainyard/design-system` (tokens) and
   `@trainyard/timc-light` (engine). Each repo/package extends these instead of copying them.
   Change the rule once in the config package; every consumer inherits it on the next install.
   *This is how QG's "good stuff" reaches StructureView: it does not get ported — it gets
   **published and depended upon**.* The S69 disposition already started this (timc-light is a
   clean package boundary); this spec makes it the rule, not the exception.
2. **Org-level `.github` repo** — GitHub's special repo whose reusable workflows and default
   community health files (CODEOWNERS, PR templates, the quality-gate workflow) are inherited by
   every repo in the org. The CCQG gate becomes a *reusable workflow* called by a 3-line stub in
   each repo, not 14 copy-pasted YAML files that drift (the self-audit found exactly this drift).
3. **A template / "paved road" repo** — a `create-trainyard-engine` template (or a
   Turborepo/Nx generator) that scaffolds a new engine already wired to the config packages, the
   reusable gate, the AGENTS.md/SOUL.md/SKILL.md trio, and a passing test surface. New engines
   start on the golden path instead of being retrofitted onto it.

None of these is a ".dotfiles" repo in the personal-env sense. Together they *are* the
"enterprise config repo" you're reaching for — the mechanism by which one decision propagates to
every product without manual porting.

## 3. The sellable-unit contract (what makes an engine extractable)

An engine is a **sellable unit** — extractable to its own repo/product with `git filter-repo` +
publish, not a rewrite — if and only if it satisfies this contract **today, inside the monorepo**:

- **Package boundary:** its own `package.json`, its own `index` public API, its own version.
- **Public API only:** sibling engines import it *through its published interface*, never by
  reaching into its internals. Enforced by lint (`no-restricted-imports` on deep paths) — the
  same static-surface discipline the contract tests already use on preload/index.
- **Own test suite + own gate pass:** it goes green on its own, without the app around it.
- **Own three-layer governance:** AGENTS.md (rules) / SOUL.md (identity) / SKILL.md (capability),
  scoped to the engine. The constitution travels with the unit.
- **Zero config duplication:** extends the shared config packages; carries no private copy.

The four engines and their target boundaries:

| Engine | Package | Sellable as | Extraction readiness |
|---|---|---|---|
| StructureView (viewer) | `@trainyard/structureview` | Free→Pro file viewer | App shell; needs sample/mock data purged (see CORPUS) |
| TIMC Light (scoring) | `@trainyard/timc-light` | Embedded quality signal | **Clean already** (S69 win; 55/55 selftests) |
| CCQG Auditor | `@trainyard/ccqg-auditor` | Standalone audit tool | Has AGENTS/SOUL; needs package boundary + gate |
| Quality Guardian / TIMC platform | `@trainyard/quality-guardian` | Enterprise platform | The bundle; consumes the other three as deps |

The rule that makes the monorepo course-correction *mechanical later*: **the boundary is drawn now
in package.json and lint rules; extraction is a packaging operation, not an archaeology dig.**

## 4. The spike lane (so ideas stay cheap and nothing gets lost)

Spikes are load-bearing — they're how ideas get on paper. They get their own lane with an
explicit, lighter contract:

- **Location:** a blessed `spikes/` (or `experiments/`) workspace, git-tracked, **exempt from the
  shipping quality gate** (or subject to a minimal "does it lint + does it have a one-line
  README" gate only). The antagonist, LemonAid, MockupCanvas all live here until promoted.
- **Never on the shipping surface:** spikes may not be imported by shippable packages. Same lint
  fence as §3. (This is the rule the antagonist violated.)
- **Promotion ritual = the S69 disposition step, formalized.** A spike graduates to a package only
  by passing a **promotion checklist** (this is the "what to put in the spec" you asked for):
  1. Does it earn a package boundary? (Would someone consume it independently?)
  2. Public API defined and documented?
  3. Test suite that passes the real gate?
  4. AGENTS/SOUL/SKILL trio written?
  5. Contract tests updated + a Decision Log entry recorded? (The antagonist's re-entry needs
     exactly this.)
  6. Mock/sample data purged? (CORPUS, timc-samples, the "5 fake docs.")

  Six checks. Fail any → stays a spike, no shame. Pass all → it's a sellable-unit candidate.
  History preserved either way: **spikes are never deleted, only promoted or parked** — the same
  supersede-don't-erase rule as the Evolution Library.

## 5. Doc/spec folder rigor (the CCQG-parity ask)

StructureView's docs lack CCQG's rigor because CCQG has AGENTS.md governing its doc structure and
StructureView doesn't. Adopt the same: a `docs/README.md` index, S-numbered specs with a required
section template (Objective / Scope / Technical Design / PR Breakdown / Decision Log), and the
lesson-linter-style check that every spec validates. This is BACKLOG-parking-lot "lesson-linter"
applied to specs — a spec-linter. The learning platform already proved the pattern (frontmatter
schema + build-time validation); port it.

## 6. PR breakdown (sized)

1. **Config packages first:** extract `@trainyard/eslint-config` + `@trainyard/tsconfig` from the
   current inline configs; StructureView consumes them. *1 session.* (Highest leverage — every
   later step inherits.)
2. **Reusable gate workflow** in the org `.github` repo; StructureView's 14 workflows collapse to
   stubs that call it. *1 session.*
3. **Draw the four package boundaries** in package.json + add the `no-restricted-imports` fence.
   No code moves yet — just the boundary + the fence that makes violations visible. *1–2 sessions.*
4. **Stand up `spikes/`** + move antagonist/MockupCanvas/LemonAid into it; write the promotion
   checklist as `docs/spike-promotion.md`. *1 session.*
5. **Spec-linter** + docs index. *1 session.*
6. **Purge mock data** (CORPUS, timc-samples) — wire CORPUS to live `docs`. *small.*

## 7. Decision log (owner)

1. Monorepo-with-workspaces (Turborepo/Nx/npm workspaces) vs. polyrepo-with-published-packages?
   (Recommend: **workspaces now, extract on sale** — keeps velocity, defers the split cost.)
2. Private registry for the shared packages (GitHub Packages / Azure Artifacts) vs. workspace
   protocol only until first extraction?
3. Does the org `.github` reusable-gate move happen before or after annual planning?
4. Spike-lane gate: truly exempt, or minimal (lint + README) — pick the floor.
