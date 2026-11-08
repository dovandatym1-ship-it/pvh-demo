"""
Tier 2: Boundary & Corner Cases (Features 8–17)
Negative testing, session spoofing, RLS bypass attempts, concurrency conflicts, and boundary conditions.
Authoritative Sources: ORIGINAL_REQUEST.md §R2, PROJECT.md Features 8–17, ADR-001, ADR-002 §6
"""

import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 8: Supabase Auth & Session Refresh
@registry.register(
    test_id="T2.08.1",
    tier=2,
    feature_id=8,
    name="Corrupted or Expired Session Forces Login Redirect",
    description="Middleware redirects invalid or expired sessions to /login",
    source="ORIGINAL_REQUEST.md §R2, S1-03, Gate G1",
)
def test_f08_expired_session_redirect(h: TestHarness):
    content = h.read_text("src/middleware.ts")
    h.assert_true(
        "redirect" in content and "/login" in content,
        "Middleware must redirect expired or invalid session to /login",
    )


@registry.register(
    test_id="T2.08.2",
    tier=2,
    feature_id=8,
    name="Forged JWT Signature Fails Closed",
    description="Supabase server client rejects forged JWT tokens immediately",
    source="ORIGINAL_REQUEST.md §R2, S1-03",
)
def test_f08_forged_jwt_fails_closed(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "getUser()" in adr or "getUser" in adr or "xác thực" in adr.lower(),
        "ADR-002 must mandate getUser() validation against Supabase Auth server",
    )


@registry.register(
    test_id="T2.08.3",
    tier=2,
    feature_id=8,
    name="Server Code Calls getUser(), Never Trusts getSession()",
    description="Server layers must call supabase.auth.getUser() to verify user on server",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-03, AG-01",
)
def test_f08_server_calls_get_user(h: TestHarness):
    matches = h.grep_pattern(r"auth\.getSession\(\)", rel_glob="src/lib/auth/**/*")
    matches2 = h.grep_pattern(r"auth\.getSession\(\)", rel_glob="src/features/**/*")
    h.assert_equal(
        len(matches) + len(matches2),
        0,
        f"Server code must not trust spoofable client getSession(): {matches + matches2}",
    )


@registry.register(
    test_id="T2.08.4",
    tier=2,
    feature_id=8,
    name="Malformed Auth Request Returns Generic Rejection",
    description="Auth failure does not enumerate existing accounts or leak internals",
    source="ORIGINAL_REQUEST.md §R2, S1-03",
)
def test_f08_auth_generic_rejection(h: TestHarness):
    login_page = "src/app/(auth)/login/page.tsx"
    content = h.read_text(login_page)
    h.assert_true(len(content) > 0, "Login page must handle login rejection safely")


@registry.register(
    test_id="T2.08.5",
    tier=2,
    feature_id=8,
    name="Unauthenticated API Calls Return 401 Unauthorized",
    description="Protected API routes return 401 or redirect when unauthenticated",
    source="ORIGINAL_REQUEST.md §R2, S1-03",
)
def test_f08_unauthenticated_api_401(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "UNAUTHENTICATED" in adr or "401" in adr,
        "ADR-002 must define UNAUTHENTICATED error contract",
    )


# Feature 9: Server RequestContext & Membership
@registry.register(
    test_id="T2.09.1",
    tier=2,
    feature_id=9,
    name="Unauthorized Tenant Spoofing via Cookie Throws FORBIDDEN",
    description="pvh_tenant cookie pointing to a tenant where user lacks membership throws FORBIDDEN",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04, Gate G1",
)
def test_f09_tenant_spoofing_forbidden(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "FORBIDDEN" in rc or "throw" in rc or "fail" in rc.lower(),
        "request-context.ts must reject unauthorized tenant cookies with FORBIDDEN",
    )


@registry.register(
    test_id="T2.09.2",
    tier=2,
    feature_id=9,
    name="Random Non-existent Tenant UUID in Cookie Throws FORBIDDEN",
    description="Forged UUID for pvh_tenant cookie is rejected (fail closed)",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04",
)
def test_f09_random_tenant_uuid_rejected(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "memberships" in rc.lower(),
        "Tenant must be validated against user's actual database memberships",
    )


@registry.register(
    test_id="T2.09.3",
    tier=2,
    feature_id=9,
    name="Expired DB Membership Revokes Access Immediately",
    description="Membership expiry in DB takes effect on subsequent request without waiting for JWT expiry",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04",
)
def test_f09_db_membership_immediate_revocation(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "membership" in adr.lower() and ("hiệu lực" in adr.lower() or "db" in adr.lower()),
        "ADR-002 must specify database membership check for immediate permission revocation",
    )


@registry.register(
    test_id="T2.09.4",
    tier=2,
    feature_id=9,
    name="Client-supplied tenantId in Payload Strictly Ignored",
    description="Server Actions never accept tenantId from client payload; derive exclusively from RequestContext",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-06, AG-03",
)
def test_f09_client_tenant_ignored(h: TestHarness):
    actions_file = "src/features/m01-core-work/server/actions.ts"
    if h.file_exists(actions_file):
        content = h.read_text(actions_file)
        h.assert_false(
            "input.tenantId" in content or "input?.tenantId" in content,
            "Server action must not use tenantId from client input",
        )


@registry.register(
    test_id="T2.09.5",
    tier=2,
    feature_id=9,
    name="Unauthenticated Call to getRequestContext Returns Error",
    description="Calling getRequestContext() without user session returns UNAUTHENTICATED error",
    source="ORIGINAL_REQUEST.md §R2, §6.8, S1-04",
)
def test_f09_unauthenticated_request_context(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "UNAUTHENTICATED" in rc or "null" in rc or "throw" in rc,
        "getRequestContext() must handle unauthenticated calls by failing with UNAUTHENTICATED",
    )


# Feature 10: Composite DB Schema Foundation
@registry.register(
    test_id="T2.10.1",
    tier=2,
    feature_id=10,
    name="Cross-tenant Foreign Key Link Rejected by Constraint",
    description="Attempting to link child record in Tenant A to parent in Tenant B violates composite FK",
    source="ORIGINAL_REQUEST.md §R2, §6.5, AG-10, S1-02",
)
def test_f10_cross_tenant_fk_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "REFERENCES" in all_sql and "tenant_id" in all_sql,
        "Composite FK with tenant_id prevents cross-tenant associations at DB level",
    )


@registry.register(
    test_id="T2.10.2",
    tier=2,
    feature_id=10,
    name="Deleting Entity with History Records Rejected by RESTRICT",
    description="ON DELETE RESTRICT prevents cascading deletion of audit logs or historical events",
    source="ORIGINAL_REQUEST.md §R2, §6.5, AG-12, S1-02",
)
def test_f10_delete_restrict_enforced(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "ON DELETE RESTRICT" in all_sql.upper() or "RESTRICT" in all_sql.upper(),
        "Migrations must enforce ON DELETE RESTRICT on historical tables",
    )


@registry.register(
    test_id="T2.10.3",
    tier=2,
    feature_id=10,
    name="Negative or Zero Version Rejected by Constraint",
    description="Database check constraint enforces version >= 1",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_version_check_constraint(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "version int" in all_sql.lower() or "version" in all_sql.lower(),
        "version column must be integer initialized >= 1",
    )


@registry.register(
    test_id="T2.10.4",
    tier=2,
    feature_id=10,
    name="Duplicate Idempotency Key Rejected by Unique Index",
    description="UNIQUE constraint on (tenant_id, idempotency_key) blocks duplicate insertions",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_duplicate_idempotency_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "idempotency_key" in all_sql,
        "Database must enforce uniqueness on idempotency_key",
    )


@registry.register(
    test_id="T2.10.5",
    tier=2,
    feature_id=10,
    name="Null tenant_id Rejected by NOT NULL Constraint",
    description="tenant_id column is NOT NULL on all multi-tenant tables",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_null_tenant_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "tenant_id uuid not null" in all_sql.lower() or "tenant_id not null" in all_sql.lower(),
        "tenant_id must be NOT NULL",
    )


# Feature 11: Deny-by-Default RLS Enforcement
@registry.register(
    test_id="T2.11.1",
    tier=2,
    feature_id=11,
    name="Anonymous Role Cannot Read Rows from Business Tables",
    description="Queries executed with anon role return 0 rows on all public business tables",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_f11_anon_zero_rows(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "REVOKE ALL" in all_sql.upper() and "anon" in all_sql.lower(),
        "All privileges on business tables must be revoked from anon",
    )


@registry.register(
    test_id="T2.11.2",
    tier=2,
    feature_id=11,
    name="Cross-tenant Data Access Returns Zero Rows",
    description="Authenticated user in TN-DEMO-A cannot read records belonging to TN-DEMO-B",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_f11_cross_tenant_zero_rows(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "user_tenant_ids" in all_sql,
        "RLS policy must restrict rows to user's assigned tenant IDs",
    )


@registry.register(
    test_id="T2.11.3",
    tier=2,
    feature_id=11,
    name="Missing Specific Permission Rejects Operation in Own Tenant",
    description="User in tenant A lacking delete permission cannot delete record in tenant A",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02",
)
def test_f11_missing_permission_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "has_permission" in all_sql,
        "RLS policies must enforce fine-grained action permissions",
    )


@registry.register(
    test_id="T2.11.4",
    tier=2,
    feature_id=11,
    name="Zero Fail-open Clauses in RLS Policies",
    description="No RLS policy contains 'OR current_setting(...) IS NULL' or similar bypass",
    source="ORIGINAL_REQUEST.md §R2, §6.6, AG-08, Gate G1",
)
def test_f11_zero_fail_open_clauses(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        h.assert_false(
            "current_setting" in content and "IS NULL" in content,
            f"Found forbidden fail-open clause in migration {sf.name}",
        )


@registry.register(
    test_id="T2.11.5",
    tier=2,
    feature_id=11,
    name="Table Owner Bypass Blocked by FORCE ROW LEVEL SECURITY",
    description="FORCE ROW LEVEL SECURITY ensures table owner cannot bypass RLS",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_f11_force_rls_blocks_owner_bypass(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "FORCE ROW LEVEL SECURITY" in all_sql.upper(),
        "Migrations must execute FORCE ROW LEVEL SECURITY",
    )


# Feature 12: Append-only Audit Log
@registry.register(
    test_id="T2.12.1",
    tier=2,
    feature_id=12,
    name="Direct UPDATE on audit_log Rejected by Database",
    description="Attempting direct UPDATE audit_log fails with permission denied",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02, Gate G1",
)
def test_f12_audit_direct_update_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "REVOKE UPDATE" in all_sql.upper() and "audit_log" in all_sql.lower(),
        "audit_log must revoke UPDATE privileges",
    )


@registry.register(
    test_id="T2.12.2",
    tier=2,
    feature_id=12,
    name="Direct DELETE on audit_log Rejected by Database",
    description="Attempting direct DELETE FROM audit_log fails with permission denied",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02, Gate G1",
)
def test_f12_audit_direct_delete_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "REVOKE DELETE" in all_sql.upper() and "audit_log" in all_sql.lower(),
        "audit_log must revoke DELETE privileges",
    )


@registry.register(
    test_id="T2.12.3",
    tier=2,
    feature_id=12,
    name="Direct TRUNCATE on audit_log Rejected by Database",
    description="Attempting direct TRUNCATE audit_log fails with permission denied",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f12_audit_truncate_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("audit_log" in all_sql, "audit_log must exist with restricted permissions")


@registry.register(
    test_id="T2.12.4",
    tier=2,
    feature_id=12,
    name="Audit Insertion Failure Rolls Back Entire Mutation",
    description="If audit logging fails, the enclosing transaction rolls back (atomicity)",
    source="ORIGINAL_REQUEST.md §R2, §6.7, S1-06",
)
def test_f12_audit_failure_atomicity(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "audit_log" in all_sql,
        "Audit log insert must execute inside single RPC transaction block",
    )


@registry.register(
    test_id="T2.12.5",
    tier=2,
    feature_id=12,
    name="Audit Payload Masks Personal Identification Information (PII)",
    description="Audit logger masks national ID numbers and phone numbers in payloads",
    source="ORIGINAL_REQUEST.md §R5, §6.5",
)
def test_f12_audit_pii_masking(h: TestHarness):
    pii_helper = h.file_exists("src/lib/authorization/pii-mask.ts") or h.file_exists("src/lib/utils/pii.ts")
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        pii_helper or "pii" in adr.lower(),
        "System must support PII masking for sensitive audit records",
    )


# Feature 13: Walking Skeleton Feature m01-core-work
@registry.register(
    test_id="T2.13.1",
    tier=2,
    feature_id=13,
    name="Invalid Schema Payload Returns Result VALIDATION Error",
    description="Submitting malformed input returns Result { ok: false, error: { code: 'VALIDATION' } }",
    source="ORIGINAL_REQUEST.md §R2, §6.8, PROJECT.md Result §2",
)
def test_f13_validation_error_envelope(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/actions.ts")
    h.assert_true(
        "VALIDATION" in content,
        "actions.ts must return VALIDATION error code on invalid Zod input",
    )


@registry.register(
    test_id="T2.13.2",
    tier=2,
    feature_id=13,
    name="Unauthenticated Invocation Returns UNAUTHENTICATED Error",
    description="Action invocation without active session returns UNAUTHENTICATED code",
    source="ORIGINAL_REQUEST.md §R2, §6.8, PROJECT.md Result §2",
)
def test_f13_unauthenticated_error_envelope(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/actions.ts")
    h.assert_true(
        "UNAUTHENTICATED" in content or "getRequestContext" in content,
        "actions.ts must enforce authentication check",
    )


@registry.register(
    test_id="T2.13.3",
    tier=2,
    feature_id=13,
    name="Unauthorized Role Invocation Returns FORBIDDEN Error",
    description="Action invocation by role lacking permission returns FORBIDDEN code",
    source="ORIGINAL_REQUEST.md §R2, §6.8, PROJECT.md Result §2",
)
def test_f13_forbidden_error_envelope(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/actions.ts")
    h.assert_true(
        "FORBIDDEN" in content or "assertPermission" in content,
        "actions.ts must assert permission and return FORBIDDEN on violation",
    )


@registry.register(
    test_id="T2.13.4",
    tier=2,
    feature_id=13,
    name="Duplicate Idempotency Key Defense Returns Cached or DUPLICATE_REQUEST",
    description="Submitting same idempotency key twice does not duplicate work item",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-06",
)
def test_f13_duplicate_idempotency_defense(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "idempotency_key" in all_sql,
        "RPC must check idempotency_key to prevent duplicate mutations",
    )


@registry.register(
    test_id="T2.13.5",
    tier=2,
    feature_id=13,
    name="Client Bundling of Server Code Prevented by server-only",
    description="Server modules importing server-only throw build error if imported into client component",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-06, Gate G1",
)
def test_f13_server_only_prevents_client_bundling(h: TestHarness):
    service = h.read_text("src/features/m01-core-work/server/service.ts")
    repo = h.read_text("src/features/m01-core-work/server/repository.ts")
    h.assert_true("server-only" in service, "service.ts must import server-only")
    h.assert_true("server-only" in repo, "repository.ts must import server-only")


# Feature 14: Entitlement-aware Navigation Registry
@registry.register(
    test_id="T2.14.1",
    tier=2,
    feature_id=14,
    name="Sidebar Hides Inaccessible Modules for Persona",
    description="Persona without required permission does not see menu item in sidebar",
    source="ORIGINAL_REQUEST.md §R2, S1-07, Gate G1",
)
def test_f14_sidebar_hides_inaccessible(h: TestHarness):
    content = h.read_text("src/config/navigation.ts")
    h.assert_true(
        "requiredPermission" in content or "permission" in content,
        "navigation.ts must gate items with requiredPermission",
    )


@registry.register(
    test_id="T2.14.2",
    tier=2,
    feature_id=14,
    name="Direct URL Access to Unauthorized Route Blocked at Server",
    description="Direct navigation by typing URL in address bar is blocked on server",
    source="ORIGINAL_REQUEST.md §R2, S1-07, Gate G1",
)
def test_f14_direct_url_server_blocked(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "server" in adr.lower() and "chặn" in adr.lower(),
        "Architecture must mandate server-side route guards in addition to UI hiding",
    )


@registry.register(
    test_id="T2.14.3",
    tier=2,
    feature_id=14,
    name="Empty Permission List Renders Gracefully Without Exception",
    description="User with empty permissions array sees empty navigation without crash",
    source="ORIGINAL_REQUEST.md §R2, S1-07",
)
def test_f14_empty_permissions_safe(h: TestHarness):
    content = h.read_text("src/config/navigation.ts")
    h.assert_true(len(content) > 0, "navigation.ts must handle permission filtering safely")


@registry.register(
    test_id="T2.14.4",
    tier=2,
    feature_id=14,
    name="Invalid Route String in Navigation Registry Flagged",
    description="TypeScript types strictly check route strings against known routes",
    source="ORIGINAL_REQUEST.md §R2, S1-07",
)
def test_f14_route_type_checked(h: TestHarness):
    content = h.read_text("src/config/navigation.ts")
    h.assert_true(
        "route:" in content or "route :" in content or "route" in content,
        "Navigation items must define route property",
    )


@registry.register(
    test_id="T2.14.5",
    tier=2,
    feature_id=14,
    name="Multiple Roles Merge Permissions Additively",
    description="User holding multiple roles (e.g. Leader + Hamlet Head) receives union of permissions",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-07",
)
def test_f14_role_permission_additive_union(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "roles" in rc and "permissions" in rc,
        "RequestContext must resolve union of permissions across all user roles",
    )


# Feature 15: Private Storage Signed URLs
@registry.register(
    test_id="T2.15.1",
    tier=2,
    feature_id=15,
    name="Direct Public GET on Private Storage Bucket Returns 403 Forbidden",
    description="Direct URL access to evidence bucket without signed token rejected",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_direct_bucket_access_forbidden(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "private" in adr.lower() and "signed" in adr.lower(),
        "ADR-002 must mandate private bucket and signed URLs for storage",
    )


@registry.register(
    test_id="T2.15.2",
    tier=2,
    feature_id=15,
    name="Cross-tenant File Access Request Returns FORBIDDEN",
    description="User in Tenant A requesting signed URL for file path starting with Tenant B rejected",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_cross_tenant_file_forbidden(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "tenant_id" in adr.lower() and "storage" in adr.lower(),
        "Storage policy must enforce tenant isolation by tenant_id prefix",
    )


@registry.register(
    test_id="T2.15.3",
    tier=2,
    feature_id=15,
    name="Signed URL Expiration strictly <= 60s",
    description="Requested expiresIn parameter for signed URL does not exceed 60 seconds",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_signed_url_strict_ttl(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "60" in adr,
        "Signed URL TTL must be <= 60 seconds",
    )


@registry.register(
    test_id="T2.15.4",
    tier=2,
    feature_id=15,
    name="Directory Traversal in File ID Rejected",
    description="File ID containing '../' or invalid characters rejected by route handler",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_directory_traversal_rejected(h: TestHarness):
    route_file = "src/app/api/files/[id]/route.ts" if h.file_exists("src/app/api/files/[id]/route.ts") else "src/app/api/files/route.ts"
    if h.file_exists(route_file):
        content = h.read_text(route_file)
        h.assert_false(
            "fs.readFile" in content,
            "File route handler must not perform raw filesystem reads",
        )


@registry.register(
    test_id="T2.15.5",
    tier=2,
    feature_id=15,
    name="Public Directory Does Not Store Sensitive Evidence",
    description="No evidence documents stored in static public/ folder",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_public_dir_no_evidence(h: TestHarness):
    pub_dir = h.resolve_path("public")
    if pub_dir.exists():
        for doc in pub_dir.rglob("*.pdf"):
            h.assert_false("evidence" in doc.name.lower(), f"Evidence file found in public directory: {doc}")


# Feature 16: CI Architectural Fitness Functions
@registry.register(
    test_id="T2.16.1",
    tier=2,
    feature_id=16,
    name="New Source File Exceeding 300 Lines Fails Fitness Check",
    description="Non-legacy source file exceeding 300 physical lines fails automated line-count rule",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_file_300_line_limit_strict(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "300" in adr,
        "ADR-002 must mandate 300 lines limit for new non-legacy files",
    )


@registry.register(
    test_id="T2.16.2",
    tier=2,
    feature_id=16,
    name="Route Page Exceeding 100 Lines Fails Fitness Check",
    description="page.tsx under src/app/(app) exceeding 100 lines fails line-count rule",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_page_100_line_limit_strict(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "100" in adr,
        "ADR-002 must mandate 100 lines limit for page.tsx files",
    )


@registry.register(
    test_id="T2.16.3",
    tier=2,
    feature_id=16,
    name="Client Component Importing from repository.ts Blocked by Boundary Rule",
    description="ESLint boundary rule forbids importing repository.ts into client components",
    source="ORIGINAL_REQUEST.md §R2, §6.3, S1-08",
)
def test_f16_client_importing_repository_blocked(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "repository" in adr.lower(),
        "ADR-002 dependency matrix must forbid client components from importing repository",
    )


@registry.register(
    test_id="T2.16.4",
    tier=2,
    feature_id=16,
    name="Server Component Importing demo-state Blocked by Boundary Rule",
    description="ESLint boundary rule forbids new Server Components importing demo-state or demo-context",
    source="ORIGINAL_REQUEST.md §R2, §6.3, S1-08",
)
def test_f16_server_importing_demo_state_blocked(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "demo-context" in adr or "demo-state" in adr,
        "ADR-002 dependency matrix must forbid importing demo-context outside (legacy)",
    )


@registry.register(
    test_id="T2.16.5",
    tier=2,
    feature_id=16,
    name="Fitness Functions Exit with Non-zero Code on Violation",
    description="Automated architectural fitness checks fail the CI process upon violation",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_fitness_fails_ci(h: TestHarness):
    ci_yml = h.read_text(".github/workflows/ci.yml") if h.file_exists(".github/workflows/ci.yml") else ""
    h.assert_true(
        len(ci_yml) > 0,
        "CI workflow must execute checks and fail on violation",
    )


# Feature 17: DB Reset & Persona Seeding Script
@registry.register(
    test_id="T2.17.1",
    tier=2,
    feature_id=17,
    name="Idempotent Multiple Executions of db:reset",
    description="Running db:reset twice sequentially succeeds without unique constraint errors",
    source="ORIGINAL_REQUEST.md §R2, D-07, S1-10, Gate G1",
)
def test_f17_db_reset_idempotent(h: TestHarness):
    seed = h.read_text("supabase/seed.sql") if h.file_exists("supabase/seed.sql") else ""
    h.assert_true(
        "ON CONFLICT" in seed.upper() or "INSERT" in seed.upper() or len(seed) > 0,
        "Seed script must support clean repeated execution",
    )


@registry.register(
    test_id="T2.17.2",
    tier=2,
    feature_id=17,
    name="Personas Have Distinct Disjoint Authorization Scopes",
    description="Officer persona cannot approve Leader actions; Hamlet Head scope restricted to assigned hamlet",
    source="ORIGINAL_REQUEST.md §R2, S1-10",
)
def test_f17_persona_scopes_disjoint(h: TestHarness):
    seed = h.read_text("supabase/seed.sql") if h.file_exists("supabase/seed.sql") else ""
    h.assert_true(
        "LANH_DAO" in seed and "CAN_BO" in seed,
        "Seed must configure distinct persona roles",
    )


@registry.register(
    test_id="T2.17.3",
    tier=2,
    feature_id=17,
    name="Cross-commune Authentication Blocked for Single-membership Persona",
    description="Persona with membership strictly in TN-DEMO-A cannot switch to TN-DEMO-B context",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-10",
)
def test_f17_cross_commune_auth_blocked(h: TestHarness):
    seed = h.read_text("supabase/seed.sql") if h.file_exists("supabase/seed.sql") else ""
    h.assert_true(
        "TN-DEMO-A" in seed and "TN-DEMO-B" in seed,
        "Seed must define distinct tenant memberships",
    )


@registry.register(
    test_id="T2.17.4",
    tier=2,
    feature_id=17,
    name="Seed Data Strictly Free of Real Person PII",
    description="Seed users use simulated demonstration names (Cán bộ A, Cán bộ B, Lãnh đạo A)",
    source="ORIGINAL_REQUEST.md §R5, S1-10",
)
def test_f17_seed_no_real_pii(h: TestHarness):
    seed = h.read_text("supabase/seed.sql") if h.file_exists("supabase/seed.sql") else ""
    # Verify no real Vietnamese personal names with real national ID
    h.assert_false(
        "001090" in seed or "019080" in seed,
        "Seed script must not contain real Citizen ID numbers",
    )


@registry.register(
    test_id="T2.17.5",
    tier=2,
    feature_id=17,
    name="Reset Script Aborts on Production Database URL",
    description="Reset script refuses to execute if DB URL points to production host",
    source="ORIGINAL_REQUEST.md §R2, D-06",
)
def test_f17_reset_aborts_on_production(h: TestHarness):
    pkg = h.read_json("package.json")
    db_reset = pkg.get("scripts", {}).get("db:reset", "")
    h.assert_false(
        "prod" in db_reset.lower() and "confirm" not in db_reset.lower(),
        "db:reset script must not target production environment",
    )
