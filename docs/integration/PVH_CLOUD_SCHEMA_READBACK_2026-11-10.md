# PVH — Cloud schema readback / release blockers (10/11/2026)

> **READ-ONLY audit. NO-GO for production migration, merge, or pilot.**
> Source: Supabase project `Demo-pvh` (region `ap-southeast-1`) queried via connected project tools on 10/11/2026; GitHub integration HEAD before the new DB-test commits was `c6a7ce5f`.
> Do not put service keys, real personal data, or SQL credentials into this repository.

## Cloud baseline observed

- Project status: `ACTIVE_HEALTHY`. This is infrastructure health, **not** application acceptance.
- Applied migration history (2): `20261108054202` (`pvh_single_commune_account_foundation`), `20261108054701` (`pvh_single_commune_scope_context`).
- Public schema (14 tables): `tenants`, `org_units`, `profiles`, `roles`, `permissions`, `role_permissions`, `memberships`, `membership_roles`, `module_entitlements`, `work_items`, `work_item_events`, `audit_log`, `evidence_files`, `system_jobs`.
- All 14 returned public tables have RLS enabled in the readback. **RLS enabled alone is not proof of correct policies.**
- Existing data includes one tenant, one org unit and zero users with memberships. No live workflow acceptance is possible from this readback.
- Security advisor returned **Leaked Password Protection Disabled** (`WARN`). Review [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) before production.
- Nothing was created, migrated, written, or changed in `Demo-pvh` by this audit.

## Why CI green still cannot authorize release

1. Integration candidate includes **9 active canonical migrations**; only the first **2** are recorded as applied in connected cloud.
2. The current active migration set covers the foundation, M01, PH03 M04/M05/M08, PH04 M09/M10 and notification/profile. Domain tables for M02/M03/M06/M07 were originally in **archived superseded migrations**, not the 9 active canonical files.
3. The M06 beneficiary create action currently calls direct table insert followed by a separate best-effort audit insert. On the observed cloud there is no target domain table. If that table is independently provisioned elsewhere, the audit still is not atomic; **do not mark M06 CRUD ready**.
4. M11 has only five draft features, not a verified database schema or API.
5. A new isolated local replay/pgTAP workflow at `.github/workflows/pvh-db-replay.yml` is intended to detect migration and contract errors without touching cloud.

## Mandatory release decisions

| Gate | Required proof | Status |
|---|---|---|
| G-DB | Clean 9-file replay with Supabase local/isolated staging; migrations and applied history reconciled; rollback rehearsal | BLOCKED until test results |
| G-SEC | Auth real users, RLS positive/negative with at least 3 roles and out-of-scope hamlet, Storage private access, password leak protection decision | NOT VERIFIED |
| G-FLOW | Browser → API → database readback, at-least-once retries, OCC conflict, audit and report export | NOT VERIFIED |
| G-COVERAGE | OP → UI/Action → schema/RPC → permission → test for every in-scope OP (128 source OP, 5 M11 drafts separate) | NOT VERIFIED |
| G-CLONE | Two separate xã instances with different configs, accounts and data isolation, backup/restore | NOT VERIFIED |
| G-OWNER | Owner approves explicit MVP-vs-Full scope, audit evidence, costs and merge | PENDING |

## Security and implementation actions

- **P0**: Never activate M02/M03/M06/M07 write functionality solely because a menu or a React form exists. Implement the missing canonical schema, correct RLS, audited atomic RPCs, idempotency, and evidence-based end-to-end checks before enabling writes.
- **P0**: Replace any M06 multi-request write/audit path with a single guarded transactional server-side RPC when an approved migration is available; block direct writes and false-success UI paths until then.
- **P1**: Reconcile permission names for all modules with actual grants and forced RLS, then rerun negative tests from authenticated sessions and from direct PostgREST endpoints.
- **P1**: Restore missing update/archive/restore and history behavior according to each business rule, never universally hard-delete public-service records.
- **P1**: Verify mobile/keyboard UI, full Vietnamese labeling and role-focused dashboard against real scoped counts.
- **P1**: Configure and test independent staging/preview and two-commune deployment without mixing production and demo data.
- **P2**: Revisit any deferred integrations or legal-decision actions only after the authorized domain owner confirms applicable sources and workflow.

## Scope of this receipt

This file is a verifiable baseline, **not** a declaration that any environment or module is complete. Future updates must include tested commit SHA, CI link, SQL readback, role and timestamp. No new staging project/branch or billable cloud asset was created.
