# PVH DB security, migration and verification plan
Status: TODO/PROPOSED — no DB modifications performed.

## Test matrix
| ID | Case | Expected |
|---|---|---|
| DB-SEC-01 | User from commune A SELECTs commune B record | 0 authorized rows / denied |
| DB-SEC-02 | User A INSERTs row with tenant B | Rejected by policy/constraint |
| DB-SEC-03 | User A UPDATEs tenant_id to B | Rejected by WITH CHECK and immutable tenant policy |
| DB-SEC-04 | User A creates child linked to parent tenant B | FK/policy rejects |
| DB-SEC-05 | Revoked membership accesses sensitive row | Denied even if cached JWT stale |
| DB-SEC-06 | Unauthorized role invokes RPC or reads view | Denied, no RLS bypass |
| DB-SEC-07 | User A fetches private Storage object for B | Denied |
| DB-SEC-08 | User A requests export for B | Denied before job creation and download |
| DB-SEC-09 | Admin client accidentally used on normal user path | Static/architecture review fails |
| DB-SEC-10 | Sensitive audit/notification contains PII | Redaction test fails |
| DB-DATA-01 | Duplicate code same tenant/scope | Constraint violation mapped to field error |
| DB-DATA-02 | Same code across tenants when permitted | Accepted |
| DB-DATA-03 | Delete referenced catalog value | Blocked or archived per policy |
| DB-DATA-04 | Concurrent update with old row_version | Conflict, no lost update |
| DB-DATA-05 | Retry write after timeout | Idempotent, no duplicate |
| DB-DATA-06 | Finalized report revised | New revision, original snapshot unchanged |
| DB-OPS-01 | Apply migrations from clean database | Success with seed and schema assertions |
| DB-OPS-02 | Backward-compatible upgrade | Old and new application version coexist during rollout window |
| DB-OPS-03 | Restore from backup | Recovery time and integrity verified |
| DB-OPS-04 | Clone new commune | Isolated seed, config, role and reporting verification |
| DB-PERF-01 | Tenant-scoped list and report at realistic volume | Query plan and agreed latency budget recorded |

## Required artifacts
- Actual schema inventory, migration inventory, RLS policy matrix, grants/functions/views inventory.
- Security advisor findings and fixes, EXPLAIN evidence, index decision log.
- Backup/restore and rollback playbook with tested receipts.
- DB contract test suite and CI gate; seeded users for two or more tenants.
- Reconciliation of docs vs actual Supabase project schema, with explicit project/environment identifier but no credentials.

## Non-goals of this commit
No SQL migration, no Supabase schema mutation, no RLS changes, no claim of passed tests. All tests listed are proposed acceptance criteria.
