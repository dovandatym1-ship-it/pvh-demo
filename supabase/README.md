# PVH database: deployed single-commune baseline

## Latest user requirement (08/11/2026)

Only ONE commune. Identity and permissions come from Supabase Auth accounts and live database assignments. Do not authorize by PERSONAS, user-editable metadata, profiles.can_view_pii or client-supplied user/tenant IDs.

## Cloud already provisioned

Project: `Demo-pvh`, ref `zynzpifmccbcvgddmxic` (PostgreSQL 17).

Applied migration receipts:

1. `20261108054202_pvh_single_commune_account_foundation`
2. `20261108054701_pvh_single_commune_scope_context`

Exact SQL snapshots are under `deployed/`. Behavioral verification: 46/46 checks passed against PostgreSQL under anon/authenticated roles; all test accounts and business records rolled back. This is NOT a browser/Auth login E2E result.

## Reconcile before any db push/reset

**PH01 feature branch reconciliation (source only):** active `supabase/migrations/` now contains exact byte-for-byte copies of the two SQL snapshots already applied in cloud. The nine older two-commune prototype migrations are preserved under `supabase/_legacy/superseded_20261108/`, not executed. `supabase/seed.sql` is intentionally non-personal and empty; baseline SQL provisions the singleton placeholder and permission catalogue.

This is a **source reconciliation**, not a new migration and not a cloud migration-history repair. The cloud still reports versions `20261108054202` and `20261108054701`. Do not `db push --include-all`, run a cloud reset, or attempt to reapply those versions. Local `supabase db reset` and a clean database replay are still **NOT VERIFIED** until the CLI and local PostgreSQL runtime are available; do not merge or declare Gate G1 PASS without the reproducibility receipt.

## Server contract

- `supabase.schema('app').rpc('get_account_context')`: returns `{userId, tenantId, membershipId, roles, permissions, scopes, fullName, communeName, singleCommune:true}`. Throws UNAUTHENTICATED or FORBIDDEN; never selects a persona fallback.
- Keep context request-scoped only. Recheck `app.has_permission`/RPC on mutations; never trust cached permissions or JWT role labels.
- `memberships`: one assignment per account in the single commune, with validity, active flag, optional org-unit scope. `membership_roles` is the source of role assignment; `role_permissions` is the source of grants. DB triggers refresh `memberships.roles/permissions` for compatibility. Direct authenticated writes are denied.
- `profiles.persona_code` is nullable test metadata only. `profiles.can_view_pii` is a legacy compatibility column, not authority.
- Permission namespace: `m01:work:*`; `app.has_permission` accepts `m01:work_item:*` as an alias. No implicit admin/leader/all wildcard.
- `create_work_item` accepts the same parameter names as the worker blueprint, but derives actor and commune from Auth + DB; supplied tenant must match the singleton. Idempotency key is required and scoped by account, same key with a changed payload is rejected.
- Work records are SELECT-only over REST. Writes go through `app.create_work_item`, atomically recording a work item, event, audit. Full workflow transition RPC is a Sprint 2 item, not implemented by this foundation.
- `app.register_evidence(p_work_item_id,p_original_name)` returns metadata including an opaque storage path bound to that work item. Upload using the authenticated user client to private bucket `evidence`. Read/signing requires current work-record read permission. Signed URL TTL must be <=60 seconds in the app; the DB cannot force a maximum TTL on an otherwise authorized Storage signing request.
- Restrict Supabase Auth signups operationally to invitations when provisioning real staff. A newly created Auth account has no membership/role by default and cannot access business data.
- Only M00/M01 enabled initially. Enabling a future module is not a substitute for defining its own record/PII policies.

## Current status at PH01 branch baseline

14 application tables, 1 commune (`TN-DEMO-A`, placeholder name), 5 configurable roles, 10 permissions, 1 private bucket. Live record counts and Auth account provisioning can change; verify afresh before release. No default passwords. Actual commune name and admin email await user input.

See `DB_DEPLOYMENT_RECEIPT.md` at repo root and project Working/DB_PVH_SINGLE_COMMUNE for evidence and operator provisioning SQL.


## Integration candidate archive decision (10/11/2026)
Only in `integrate/pvh-backbone-review-20261110`: the nine superseded two-commune migrations `20261108000001..00009` were removed from the executable `migrations/` path after exact blob-SHA comparison to `_legacy/superseded_20261108/`. Source history and immutable archive remain available; no remote DB changes. CI `node scripts/check-migration-ledger.mjs` validates the expected nine canonical migration files and archived SHA identities. **Do not run `supabase db push` or report clean replay until a disposable local stack and cloud history comparison pass.**
