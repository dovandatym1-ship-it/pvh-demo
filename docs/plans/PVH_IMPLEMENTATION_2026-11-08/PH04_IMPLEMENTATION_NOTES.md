# PH04 Implementation Notes — M09 / M10

Baseline: `feat/pvh-ph03-domain-verticals@2d25ced7242263c663217d04d08426bcb5f801aa`.
Target: `feat/pvh-ph04-reporting-integrations`. `main` remains unchanged.

## Scope

- P04-01..12: Five source-backed reports, period/revision lifecycle, frozen contributor lineage, deterministic SHA-256 over PostgreSQL `jsonb::text` (explicitly **not** RFC 8785), actual XLSX/PDF, and a job executor that must produce an artifact before success.
- P04-13..18: Versioned CSV indicator template, strict parse/preview/error list, explicit partial-import policy, idempotent transactional commit, source provenance, a simulated adapter boundary, and export/input safety.
- Dependencies: PH03 schema and M00 permission projection. PH03 G3 has not been owner-accepted.

## Migration and verification

- New forward-only PH04 migration; do not apply to `Demo-pvh` cloud. Reconcile DB baseline and G3 before staging rollout.
- Tables and RPCs are deny-write-by-default with explicit permission checks, audit insert in the same transaction, read-only report aggregation, and no scope-changing cookie or client tenant IDs.
- Run typecheck/build/lint, deterministic unit tests, file signature/parser tests, and static security checks locally. SQL/RLS and browser→API→DB tests must be executed on an isolated database with approved migration baseline before claiming G4 PASS.

## Rollback

- Revert application commit before deployment; PH04 schema is additive. On isolated staging, restore the pre-migration backup rather than dropping shared tables or rewriting migration history.
- Never force-merge branches PH01–PH03 or modify production deployment as part of PH04 implementation.

Owner acceptance: **PENDING**. Test statuses and unresolved blockers are tracked in `PH04_IMPLEMENTATION_RECEIPT.md`.
