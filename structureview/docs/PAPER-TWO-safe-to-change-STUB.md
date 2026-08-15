# Paper Two (concept stub) — "Safe to Change: Governing AI on Legacy Code"

> **Status:** concept, not drafted. Homed 2026-07-19 out of a 41-line inbox entry (it was a document
> masquerading as a capture — see `INBOX-RCA-CAP-2026-07-19.md`). Sibling to Paper One
> (`PAPER-ONE-antagonist-read-only.md`): Paper One governs the Builder emitting **new** code; Paper Two
> governs the harder, more common, more dangerous case — **existing** code.
>
> **⚠️ Day-job firewall (owner's delicate-dance rule):** the motivating case is a real, employer-scoped
> mainframe-retirement program. **All employer specifics — exact job counts, dates, target-stack
> particulars, in-context cloud service names — stay in `research/client-confidential/`, never here and
> never in the public paper.** This concept uses only the _generalized archetype_ and the _transferable
> pattern_. No day-job numbers, same rule as Paper One.

## Thesis

Shipping an AI-build product without making it safe for existing codebases is irresponsible —
"throwing AI at the septic field." Before an agent rewrites legacy, a **read-only Auditor
reverse-engineers it into a spec — the "spec bridge"** — i.e. Feathers' _characterization_ step (pin
down what the code actually does before you change it) made executable for agents. This promotes the
Auditor + Graph Studio from product features to an **ethical requirement.**

## The pattern

1. **Characterize (read-only)** — the Auditor reverse-engineers legacy source into a behavior spec.
2. **Generate the spec bridge** — the reverse of the forward PRD→spec bridge (which already exists;
   see `research/agentic-prd-to-spec-bridge.md`).
3. **Govern the rebuild** on the new stack with the read-only Antagonist (Paper One).
4. **Verify behavior-equivalence** against the characterization — the acceptance gate is _"does it
   still do the old thing,"_ not _"does it compile."_

## Why the referee is load-bearing here (ties to Paper One)

**Graph Studio = the dependency/risk map the agent's rotting context window physically cannot hold** —
"separation of context" (Paper One §4.1) applied to legacy. The referee holds the structure the Builder
can't see, so the agent doesn't cut into load-bearing walls it never loaded. **"The wrong version of
autonomy"** = turning an agent loose on COBOL with no map; the right autonomy is governed, characterized,
spec-bridged.

## Triage first (the calming reframe)

Not all legacy must move. In a real batch-job retirement the _majority run out_ (stay until the platform
is unplugged); only a _minority truly migrate_ (~3:1). **First deliverable is the disposition, not the
migration** — it collapses a terrifying scope to a workable one. Same product-vs-spike triage muscle as
Run 2, pointed at a mainframe.

## Canon (first-degree — extends the anti-cosplay proof to legacy/data)

- Feathers, _Working Effectively with Legacy Code_ (seams, characterization tests).
- Bernstein, _Beyond Legacy Code_ (interviewed ×2 — see Paper One).
- Sloponomics tie: legacy _is_ duct-tape-and-bubble-gum — slop that already shipped.

**Author credibility for this paper specifically:** 18 months coaching an ETL team to sustained
zero-defects; reads DB schemas; unafraid to ask questions — the anti-cosplay credential reaches into
data/ETL, not just craftsmanship.

## Open questions (generalized seams)

- **(a) Scheduler translation** — legacy job orchestration (Control-M-class) → cloud orchestration
  (EventBridge Scheduler / Step Functions / managed Airflow). A recurring legacy seam worth naming.
- **(b) Behavior-equivalence verification** as the acceptance gate — how measured.
- **(c) Future-state data-product standards** (metadata, contracts) as part of "done," not after.

## Intro framing device

_Standing before the septic field holding the plans for a fun zone — go-karts, mini-golf, arcade —
"I could work with this" and completely freaking out, at the same time. Both true; the discipline is
the bridge between them._

## Candidate build (QG)

Revise the Auditor spec to add a **reverse-engineering operation that emits a spec bridge** from legacy
source (COBOL/JCL/relational DDL + embedded Java): read-only comprehension of the existing system as the
front of the migration loop.

**Reality check:** needs the Auditor + Graph _real_ first (prompt-Auditor ~1hr/repo doesn't scale; Graph
is prototype). Concept banked; draft when the engines exist and Paper One is submitted.
