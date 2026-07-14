# Plan — Evidence Ingestion Contract (Middle Tier → TIMC)

> **Status:** Proposal — Propose stage, pending owner review and segment numbering. Identified
> as the closing gap of the CCQG Auditor build sessions ("the missing piece is a defined
> schema field in Quality Guardian that says 'imported audit evidence'"). This is the spec
> that turns the middle tier from standalone files into fleet product. Follows the S-doc
> conventions; depends conceptually on S73 (TIMC surfaces) and the Auditor AGENTS.md v1.0.0.

## 1. Objective

**Job story:** When an audit or dependency analysis completes outside Quality Guardian, I want
its artifacts ingested as first-class scored evidence — not attachments — so TIMC quadrant
scores, release readiness, and FINRA 4511 records reflect everything the fleet knows, with
provenance a regulator could follow.

Measurable outcome: `findings.json` (Auditor) and `dependency-risk-map.md` (Dependency Graph)
import into TIMC through a validated contract; quadrant scores change in response; the
imported bundle appears in the evidence trail with hash, source, and timestamp.

## 2. The contract (draft)

### 2.1 Evidence bundle envelope

Every import is a **bundle**: an envelope wrapping one or more artifacts.

```json
{
  "bundle_id": "uuid",
  "bundle_type": "audit | dependency-map | external",
  "producer": { "agent": "ccqg-auditor", "version": "3.0.0", "governance": "AGENTS.md@sha" },
  "produced_at": "ISO-8601",
  "source_repos": ["repo@commit-sha"],
  "content_hash": "sha256 of canonicalized artifacts",
  "artifacts": [
    { "kind": "findings", "media": "application/json", "body": {} },
    { "kind": "architecture", "media": "text/vnd.mermaid", "body": "graph TD..." },
    { "kind": "risk-map", "media": "text/markdown", "body": "..." }
  ],
  "attestation": { "human_reviewer": null, "hitl_required": true }
}
```

Notes: `producer.governance` pins the constitution the agent ran under (auditability of the
_rules_, not just the output). `content_hash` + `produced_at` are the FINRA 4511 /
WORM-adjacent anchors. The `architecture_mermaid` embed fix from the Auditor thread is
subsumed: architecture is an artifact `kind`, not a bolt-on field.

### 2.2 Quadrant attribution mapping

Auditor findings already carry 4-quadrant classification; TIMC scores Q1 Traceability ·
Q2 Impact · Q3 Measurability · Q4 Completeness. The contract requires every finding to map
`{quadrant, severity, evidence_refs[]}` → TIMC treats imported findings as **upstream signal
inputs** to quadrant scores, weighted by severity and freshness (a 90-day-old CRITICAL decays
per a configurable half-life — stale audits must not prop up scores).

### 2.3 Validation gate (import-time)

Reject-with-reasons, never silently accept: envelope schema-valid; every finding has
quadrant + severity + at least one evidence ref; source_repos resolvable; content_hash
verifies; producer governance file present at pinned ref. Invalid bundles land in a
quarantine list, visible, with reasons — the misconception-log pattern applied to machines.

### 2.4 Provenance & immutability

Ingested bundles are append-only. Supersession, not mutation: a re-audit produces a new
bundle referencing the old (`supersedes: bundle_id`). History is the product — same rule as
the Evolution Library, same reason regulators like it.

### 2.5 HITL boundary

Import is an ingest, not an endorsement. Bundles affect _provisional_ scores immediately but
are flagged `unattested` until a human reviewer signs (name recorded). Release-readiness
gates may be configured to require attested-only evidence (Tier 4 mode default: attested).

## 3. Scope

**In:** the envelope schema (JSON Schema file), TIMC import endpoint/CLI, quadrant mapping +
decay rules, quarantine surface, attestation record.
**Out (deliberately):** live agent-to-TIMC streaming (bundles are batch, segment-close
cadence); external SBOM/SARIF importers (design the envelope so a SARIF adapter is a future
`bundle_type`, don't build it now); retention storage implementation (governance segment owns
FINRA 4511 storage; this spec emits the records it needs).

## 4. PR breakdown (sized like the house pattern)

1. **PR 1 — the schema:** `evidence-bundle.schema.json` + a validator CLI + three fixture
   bundles (audit, dependency-map, invalid). No UI. _1 session._
2. **PR 2 — Auditor emits the envelope:** consolidation prompt updated to wrap its outputs
   as a bundle (subsumes the `architecture_mermaid` one-line fix). _small._
3. **PR 3 — TIMC ingest:** import + quarantine + provisional scoring; attestation flag.
   _1–2 sessions._
4. **PR 4 — decay + Tier 4 attested-only gate.** _1 session._

## 5. Decision log (owner)

1. Segment number / home: new segment, or S73-family?
2. Decay half-life default (90 days?) and whether decay applies to INFO/positive findings.
3. Does the Dependency Graph emit its own bundle_type or ride inside audit bundles?
4. Quarantine visibility: TIMC-only, or also surfaced in StructureView (viewer already
   renders findings — a quarantine tab is cheap)?
5. Attestation identity source (local name field now; SSO later?).
