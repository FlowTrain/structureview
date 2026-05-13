/**
 * Postgres entitlements adapter — DEFERRED per ADR-0006.
 *
 * Polyglot persistence strategy puts entitlements on Cosmos Mongo vCore.
 * Postgres carries the relational/analytical workloads (DORA metrics,
 * traceability, release pattern detection) when those phases land.
 *
 * This placeholder file documents the deferral. The Postgres adapter
 * will be reintroduced when QG Phase 3 or Q2 Release Phase 1 begins.
 */
test.skip("PostgresEntitlements — deferred per ADR-0006", () => {});
