# PVH Database Architecture & Governance — v0.1

Status: DRAFT / proposed, not verified schema. Target: Next.js + PostgreSQL/Supabase; no SQL deployed in this task.

## Architecture decisions
1. One codebase, tenant-isolated operational data. Every tenant-owned business row has tenant_id UUID NOT NULL, created_at/by, updated_at/by, row_version; server resolves tenant from authenticated membership, not user input. Tenant-global exceptions explicitly classified.
2. Ownership: M01 owns canonical people/households/organizations/facilities ONLY after confirming existing OP source; M11 owns code lists/catalog definitions and values, NOT people or business records. M00 owns identity/organization/roles/config. Domain modules own their cases and domain attributes. Avoid cross-domain shadow master tables.
3. Prefer UUID primary keys and stable external reference keys with source_system and source_record_id; external IDs are not necessarily unique globally, use composite uniqueness by source and tenant as applicable.
4. Core operational entities normalized; JSONB reserved for flexible metadata with schema/version and validation, not as replacement for searchable relational fields.
5. Distinguish lifecycle state, approval state, archival status and soft delete; no cascade delete for legal records, audit or reports without explicit retention authority.
6. Store files in private Storage; DB stores metadata, object path, checksum, mime, size, owner record, tenant, version, sensitivity, scan status; signed access authorized against parent record.
7. Source of truth and provenance explicit: imported vs manually entered vs official reference; reconciliation does not silently overwrite authoritative data.
8. Reference data versioned with valid_from/valid_to and active flags; official classifications have controlled update pipeline, not arbitrary edits by every tenant.

## Logical schema domains (proposed)
| Schema/area | Representative entities | Ownership |
|---|---|---|
| platform | tenants, org_units, memberships, roles, permissions, role_grants, module_entitlements, settings | M00 |
| master | persons, households, organizations, facilities, addresses, external_identifiers | M01 ownership to confirm |
| catalog | catalog_definitions, catalog_values, catalog_versions, catalog_assignments | M11 |
| work | tasks, task_assignments, cases, case_events, plans, plan_items | M01 |
| domain | domain-specific records, activities, beneficiary cases, education facilities, inspections | M02–M08 |
| reporting | report_templates, metrics, periods, report_runs, report_values, source_lineage, report_snapshots, export_jobs | M09 |
| transfer | import_jobs, import_rows/errors, export_jobs, source_config | M10 MVP |
| shared | attachments, audit_events, notification_events, message_templates, job_receipts | shared services |

**Schema names are conceptual**, not an instruction to create all schemas immediately; exposure/grants/RLS must be decided before migration.

## Tenant integrity
- FK between tenant-owned tables should prevent cross-tenant links, e.g. composite UNIQUE(tenant_id,id) on parent and composite FK(tenant_id,parent_id) on child where appropriate.
- Tenant membership must be effective-dated; revocation applies immediately for sensitive operations. Roles and row/field scope evaluated server-side and by DB policies.
- System-wide catalog records must have explicit global scope and write ownership; tenant overrides separated from canonical catalog values.
- Unique constraints must match domain scope (tenant, entity type, normalized code, effective period), not blindly UNIQUE(code).
- No client-controlled tenant_id in privileged RPC; verify on all read/write paths and Storage.

## Supabase security design review checklist
- RLS on every exposed business table; no permissive authenticated-only policies.
- SELECT/INSERT/UPDATE/DELETE policy matrix; UPDATE must enforce both USING and WITH CHECK; UPDATE also needs read access.
- Views exposing sensitive data require security-invoker semantics when supported or must be kept private; functions default to invoker. SECURITY DEFINER only with documented necessity, narrow grants, safe search_path and tests.
- Do not authorize from editable user_metadata; account for stale JWT claims; do not put service role keys in browser.
- Storage object permissions check tenant, record scope and sensitivity; verify signed URL lifetime and access revocation policy.
- RLS and grants are distinct: Data API exposure, schema usage and table grants must be reviewed explicitly.
- Threat cases: IDOR, cross-tenant FK, role revoked mid-session, export overreach, indirect access through views/RPC, stale cache, unauthorized file download.

## Data correctness and lifecycle
- Field dictionary: logical/physical name, type, nullability, default, constraints, index, FK, source, sensitivity, masking, retention, lineage, example, validation and owner.
- Case state changes and audit must be atomic where required. Use transaction/RPC with authorization and version checks; don't rely on a sequence of independent client writes.
- Audit is append-only to ordinary application roles; track actor, action, record, safe changed-fields summary, timestamp, correlation ID; never log raw sensitive payloads or credentials.
- Report snapshots freeze template version, indicator formula version, source set, period, actor, creation time; corrections create new versions with linkage.
- Partitioning only when measured volume and query patterns justify it. Index by tenant + common filters, inspect EXPLAIN ANALYZE; avoid speculative over-indexing.
- Time fields stored consistently (timestamptz for instants); business reporting period stored separately; locale rendering vi-VN.

## Migration and delivery
1. Inventory actual migrations and deployed schema; compare to target before editing.
2. Create ADR for incompatible changes, backward-compatible migration plan and rollback/recovery procedure.
3. Test constraints, RLS, FK, idempotency, import/export, audit and tenant isolation in isolated DB.
4. Seed synthetic demo data only; ensure deterministic tenant fixtures and no real sensitive data.
5. Run security/performance advisors and DB tests, verify applied migrations in target environment; collect evidence.
6. No production migration without backup/restore test, deployment approval and monitoring.

## DB exit gates
- [ ] Every released entity has owner, field dictionary, ERD, keys and constraints.
- [ ] Every tenant-owned relation enforces tenant-safe references.
- [ ] Every exposed table/view/function has authorization and negative security tests.
- [ ] Every operation has transaction/concurrency/audit contract.
- [ ] Every report has source lineage and versioning.
- [ ] Migration, restore, seed, rollback and readback tests pass with evidence.
- [ ] Performance baseline and slow-query review documented.

Open: confirm M01 canonical ownership; enumerate real schema/migrations; confirm legal retention and data classifications; benchmark before deciding partitions.
