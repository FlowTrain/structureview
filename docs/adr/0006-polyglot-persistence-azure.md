# ADR-0006 — Polyglot Persistence on Azure

- **Status:** Accepted
- **Date:** 2026-05-12
- **Supersedes:** Persistence section of ADR-0003 (which assumed managed Postgres)
- **Authors:** Claude (CCQG) on behalf of James Gifford

## Context

ADR-0003 deferred the host and database decision. Two facts have now
landed that fully constrain it:

1. **Microsoft hosting is a hard constraint.** All RoundhouseHQ.ai
   infrastructure runs on Azure. Cloud-agnosticism is a long-term
   ideal, not a short-term gate.
2. **The Quality Guardian brief already specifies a polyglot stack.**
   Tech Foundation table:
   - Short-Term Memory → **LangGraph PostgresSaver**
   - Long-Term Memory → **Mem0**
   - Vector + Document Store → **Azure Cosmos DB (DiskANN)**

So Cosmos and Postgres are already both committed at the architecture
level. The question is which workloads go where, and what's the
governing rule.

A separately provisioned Cosmos DB for MongoDB **vCore** cluster
(`ccqg-dev-cosmos-mongo`, RG `ccqg-metrics-dev`) is the active
destination — flipped from the retiring RU-based SKU on Microsoft's
recommendation to reduce spend.

## The Four Train Yard products' actual data workloads

| Workload | Shape | Natural fit |
|---|---|---|
| StructureView entitlements | tiny doc/user | Cosmos Mongo |
| StructureView file metadata, recent files | doc | Cosmos Mongo |
| QG agent episodic memory (session logs) | write-heavy JSONL | Cosmos Mongo |
| QG semantic memory (graph + vector) | doc + vector (DiskANN) | Cosmos Mongo |
| QG short-term LangGraph state | per-graph state snapshots | Postgres (brief-mandated) |
| QG DORA metrics | time-series, aggregate | Postgres |
| Q2 Release domain model | graph (teams ↔ domains) | Postgres |
| Q2 Release pattern detection | analytical joins, windowed aggregates | Postgres |
| Tier 4 audit trail | append-only event log, cryptographic integrity, temporal queries | Cosmos Mongo (brief-mandated: "audit trail in Cosmos DB") |
| Tier 4 traceability matrix | requirements ↔ tests ↔ results ↔ frameworks (joins) | Postgres |
| Tier 4 Certificate of Conformity artifacts | doc | Cosmos Mongo |
| Procedural memory (SKILL.md) | files | Git, not a DB |

## Decision

**Polyglot persistence, two engines, both on Azure.**

### Engine A — Azure Cosmos DB for MongoDB (vCore)

Already provisioned (`ccqg-dev-cosmos-mongo`). Single cluster, one
database per product where useful, separate collections per concern.

Owns workloads where the access pattern is:

- Single-document reads and writes by ID
- Schemaless or rapidly-evolving document shape
- Vector similarity search (DiskANN)
- Write-heavy append-only event capture (with insert-only semantics)
- Embeddings and AI output captures

### Engine B — Azure Database for PostgreSQL (Flexible Server)

To be provisioned **when the first workload needs it** (anticipated:
QG Phase 3 — LangGraph PostgresSaver + DORA metrics; Q2 Release Phase 1
— domain model). Not provisioned yet — no reason to pay for an idle DB.

Owns workloads where the access pattern is:

- Cross-entity joins (traceability, pattern detection)
- Windowed aggregations and analytical queries
- Strict transactional integrity across multiple rows
- Temporal queries against append-only event tables (Postgres temporal
  table patterns, or pg_partman + range partitioning)
- LangGraph state persistence (per QG brief)

### Governing rule

Every datastore sits behind a **port** (DIP). Application code calls
`entitlements.get(userId)`, never `cosmos.findOne(...)`. Adapters
are the only files that import driver libraries.

This means:

- The choice "Cosmos vs Postgres for X" is reversible — one adapter
  swap, all caller code unchanged.
- Tests use in-memory adapters at the port boundary; no test boots a
  real DB.
- New stores added later (e.g., a graph DB if Q2 Release outgrows
  recursive CTEs) drop into the same pattern.

## Options considered

| Option | Verdict | Rationale |
|---|---|---|
| Single store: all-Cosmos | Rejected | Pattern detection (Q2 Release) and traceability (Tier 4) genuinely want SQL joins; forcing them into Mongo aggregation pipelines is the wrong tool. |
| Single store: all-Postgres + pgvector | Rejected | Discards the already-paid migration to Cosmos vCore. Cosmos's DiskANN vector index is the engine MS optimised for; pgvector is competitive but not the choice the QG brief already made. |
| Polyglot — Cosmos primary, Postgres for relational/analytical workloads | **Accepted** | Matches the QG brief's stated architecture. Each engine handles workloads it was built for. Cost: two stores to operate. Mitigated by adapters at port boundaries. |
| Three stores (add a graph DB) | Deferred | Postgres can carry the graph workload (domain model + dependency edges) via recursive CTEs and `ltree` until volume forces specialization. Revisit at Q2 Release Phase 3. |

## Consequences

**Positive**

- Each workload runs on the engine that fits its access pattern.
- Cosmos investment (just paid for in the SKU migration) is preserved
  and immediately put to work.
- DORA metrics, release pattern detection, and compliance traceability
  — the workloads the briefs describe most ambitiously — land on the
  engine that can actually serve those queries.
- Port + adapter pattern means swaps stay cheap. If Postgres turns out
  to also be a good fit for a workload currently in Cosmos (or vice
  versa), the change is one file.

**Negative**

- Two engines to operate, monitor, back up, and patch. Mitigated by
  both being Azure-managed; ops is "click two managed-DB blades" not
  "self-host two clusters."
- Joins across engines are not possible — anything that must join
  Cosmos + Postgres data is an application-level concern (or a sign
  that the data needs to consolidate on one engine).
- The "cloud-agnostic long-term ideal" remains partial. Postgres is
  fully portable; Cosmos Mongo vCore is wire-compatible with real
  MongoDB Atlas but operationally Azure-locked. This is a known
  tradeoff explicitly accepted by the Microsoft-stay constraint.

## Provisioning timeline

| Phase | Cosmos use | Postgres use |
|---|---|---|
| Phase 2 (StructureView paid features) | Entitlements collection | None — defer provisioning |
| Phase 3 (QG agent mesh) | Episodic + semantic memory + vector | Provision; LangGraph PostgresSaver |
| Phase 3 (QG metrics) | — | DORA metrics tables |
| Phase 4 (Q2 Release Phase 1) | — | Domain model |
| Phase 4 (Tier 4) | Audit trail; Certificates | Traceability matrix |

## Revisit triggers

- Cosmos costs spike again unexpectedly → reconsider what's stored there
- A workload currently in Postgres is dominated by single-doc lookups
  → consider moving to Cosmos
- A workload currently in Cosmos needs cross-collection joins
  consistently → consider moving to Postgres
- Microsoft retires another Cosmos SKU (third migration in 18 months
  would be the wake-up call to reassess)
- Cloud-agnosticism shifts from ideal to binding → both engines have
  off-Azure equivalents; the port pattern is the migration plan

## Cross-references

- ADR-0003 — Backend service (Fastify on Azure Container Apps);
  persistence section superseded by this ADR.
- ADR-0005 — Port + adapter pattern (this ADR applies the same
  pattern to persistence boundaries).
- Quality Guardian Brief, Technology Foundation table.
