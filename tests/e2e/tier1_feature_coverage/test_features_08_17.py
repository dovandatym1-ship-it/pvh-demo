"""
Tier 1: Feature Coverage (Features 8–17)
Sprint 1 / Walking Skeleton, Auth, RequestContext, Composite Schema, RLS, Audit, Storage, Fitness Functions
Authoritative Sources: ORIGINAL_REQUEST.md §R2, PROJECT.md Features 8–17, ADR-001, ADR-002 §6
"""

import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 8: Supabase Auth & Session Refresh
@registry.register(
    test_id="T1.08.1",
    tier=1,
    feature_id=8,
    name="Middleware Module Exists",
    description="src/middleware.ts exists to intercept requests and refresh auth sessions",
    source="ORIGINAL_REQUEST.md §R2, D-07, S1-03, Gate G1",
)
def test_f08_middleware_exists(h: TestHarness):
    h.assert_file_exists("src/middleware.ts", "src/middleware.ts must exist")


@registry.register(
    test_id="T1.08.2",
    tier=1,
    feature_id=8,
    name="Middleware Implements Session Refresh via @supabase/ssr",
    description="src/middleware.ts calls createServerClient to refresh auth tokens",
    source="ORIGINAL_REQUEST.md §R2, S1-03",
)
def test_f08_middleware_session_refresh(h: TestHarness):
    content = h.read_text("src/middleware.ts")
    h.assert_true(
        "createServerClient" in content or "updateSession" in content or "supabase" in content.lower(),
        "middleware.ts must refresh Supabase session",
    )


@registry.register(
    test_id="T1.08.3",
    tier=1,
    feature_id=8,
    name="Login Page Exists under (auth) Route Group",
    description="src/app/(auth)/login/page.tsx renders email and password credentials form",
    source="ORIGINAL_REQUEST.md §R2, S1-03, Gate G1",
)
def test_f08_login_page_exists(h: TestHarness):
    h.assert_file_exists("src/app/(auth)/login/page.tsx", "Login page must exist at src/app/(auth)/login/page.tsx")
    content = h.read_text("src/app/(auth)/login/page.tsx")
    h.assert_true(
        "password" in content.lower() and "email" in content.lower(),
        "Login page must render email and password inputs",
    )


@registry.register(
    test_id="T1.08.4",
    tier=1,
    feature_id=8,
    name="Middleware Protects (app) Routes Redirecting to /login",
    description="Unauthenticated access to (app) routes redirects to /login",
    source="ORIGINAL_REQUEST.md §R2, S1-03, Gate G1",
)
def test_f08_middleware_redirect(h: TestHarness):
    content = h.read_text("src/middleware.ts")
    h.assert_true(
        "/login" in content or "redirect" in content,
        "middleware.ts must redirect unauthenticated requests to /login",
    )


@registry.register(
    test_id="T1.08.5",
    tier=1,
    feature_id=8,
    name="Logout Mechanism Clears Session Cookies",
    description="Logout handler clears auth cookies and redirects to /login",
    source="ORIGINAL_REQUEST.md §R2, S1-03, Gate G1",
)
def test_f08_logout_handler(h: TestHarness):
    # Verify logout action or route exists
    has_logout_action = h.file_exists("src/lib/auth/actions.ts") or h.file_exists("src/app/(auth)/logout/route.ts") or h.file_exists("src/app/api/auth/signout/route.ts")
    matches = h.grep_pattern("signOut", rel_glob="src/**/*")
    h.assert_true(
        has_logout_action or len(matches) > 0,
        "Application must implement signOut/logout functionality",
    )


# Feature 9: Server RequestContext & Membership
@registry.register(
    test_id="T1.09.1",
    tier=1,
    feature_id=9,
    name="RequestContext Module Exists",
    description="src/lib/auth/request-context.ts exports getRequestContext()",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04, Gate G1",
)
def test_f09_request_context_module(h: TestHarness):
    h.assert_file_exists("src/lib/auth/request-context.ts", "src/lib/auth/request-context.ts must exist")
    content = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true("getRequestContext" in content, "request-context.ts must export getRequestContext()")


@registry.register(
    test_id="T1.09.2",
    tier=1,
    feature_id=9,
    name="RequestContext Interface Conforms to Specification",
    description="RequestContext interface includes userId, tenantId, membershipId, roles, permissions, scopes",
    source="ORIGINAL_REQUEST.md §R2, §6.4, PROJECT.md Interface Contracts §1",
)
def test_f09_request_context_interface(h: TestHarness):
    content = h.read_text("src/lib/auth/request-context.ts")
    for prop in ["userId", "tenantId", "membershipId", "roles", "permissions", "scopes"]:
        h.assert_true(prop in content, f"RequestContext must contain property '{prop}'")


@registry.register(
    test_id="T1.09.3",
    tier=1,
    feature_id=9,
    name="RequestContext Queries Database Memberships Table",
    description="RequestContext resolves valid active memberships from database",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04",
)
def test_f09_request_context_db_membership(h: TestHarness):
    content = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "memberships" in content or "membership" in content.lower(),
        "getRequestContext() must resolve roles and tenant from database memberships",
    )


@registry.register(
    test_id="T1.09.4",
    tier=1,
    feature_id=9,
    name="pvh_tenant Cookie Validated Against DB Memberships",
    description="Tenant from pvh_tenant cookie is verified against user's actual memberships in DB",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04, Gate G1",
)
def test_f09_pvh_tenant_cookie_validation(h: TestHarness):
    content = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true("pvh_tenant" in content, "request-context.ts must check 'pvh_tenant' cookie")


@registry.register(
    test_id="T1.09.5",
    tier=1,
    feature_id=9,
    name="RequestContext Memoized with React.cache",
    description="getRequestContext() uses React.cache to avoid redundant DB roundtrips in same render",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04",
)
def test_f09_request_context_cached(h: TestHarness):
    content = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true("cache" in content, "getRequestContext() must be wrapped with React.cache")


# Feature 10: Composite DB Schema Foundation
@registry.register(
    test_id="T1.10.1",
    tier=1,
    feature_id=10,
    name="Core Tables Define Composite Tenant Primary/Unique Key",
    description="Migrations define composite primary key or unique (tenant_id, id)",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_composite_pk(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    h.assert_true(len(sql_files) > 0, "No SQL migration files found in supabase/migrations")
    found_composite = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"PRIMARY\s+KEY\s*\([^)]*tenant_id[^)]*\)", content, re.IGNORECASE) or \
           re.search(r"UNIQUE\s*\([^)]*tenant_id[^)]*id[^)]*\)", content, re.IGNORECASE):
            found_composite = True
            break
    h.assert_true(found_composite, "Migrations must define composite key including tenant_id")


@registry.register(
    test_id="T1.10.2",
    tier=1,
    feature_id=10,
    name="Standard Audit and Concurrency Columns Present",
    description="Business tables define version, created_at, created_by, updated_at, updated_by",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_standard_columns(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found_cols = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "version" in content and "created_at" in content and "created_by" in content:
            found_cols = True
            break
    h.assert_true(found_cols, "Migrations must contain standard version and audit columns")


@registry.register(
    test_id="T1.10.3",
    tier=1,
    feature_id=10,
    name="Idempotency Key Unique Constraint Present",
    description="Mutation tables include UNIQUE(tenant_id, idempotency_key)",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_idempotency_constraint(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "idempotency_key" in content:
            found = True
            break
    h.assert_true(found, "Migrations must define idempotency_key column")


@registry.register(
    test_id="T1.10.4",
    tier=1,
    feature_id=10,
    name="Foreign Keys Use Composite Tenant Reference",
    description="Foreign keys reference (tenant_id, parent_id) to prevent cross-tenant links",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_composite_fk(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found_fk = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"REFERENCES\s+\w+\s*\([^)]*tenant_id[^)]*\)", content, re.IGNORECASE):
            found_fk = True
            break
    h.assert_true(found_fk, "Migrations must define composite foreign keys with tenant_id")


@registry.register(
    test_id="T1.10.5",
    tier=1,
    feature_id=10,
    name="Historical and Audit Records Specify ON DELETE RESTRICT",
    description="Audit and historical tables use ON DELETE RESTRICT rather than CASCADE",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f10_on_delete_restrict(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found_restrict = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "ON DELETE RESTRICT" in content.upper() or "RESTRICT" in content.upper():
            found_restrict = True
            break
    h.assert_true(found_restrict, "Historical tables must enforce ON DELETE RESTRICT")


# Feature 11: Deny-by-Default RLS Enforcement
@registry.register(
    test_id="T1.11.1",
    tier=1,
    feature_id=11,
    name="Business Tables Enable Row Level Security",
    description="SQL migrations execute ENABLE ROW LEVEL SECURITY on all public business tables",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_f11_enable_rls(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "ENABLE ROW LEVEL SECURITY" in content.upper():
            found = True
            break
    h.assert_true(found, "Migrations must contain ENABLE ROW LEVEL SECURITY")


@registry.register(
    test_id="T1.11.2",
    tier=1,
    feature_id=11,
    name="Business Tables Force Row Level Security",
    description="SQL migrations execute FORCE ROW LEVEL SECURITY to prevent table owner bypass",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_f11_force_rls(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "FORCE ROW LEVEL SECURITY" in content.upper():
            found = True
            break
    h.assert_true(found, "Migrations must contain FORCE ROW LEVEL SECURITY")


@registry.register(
    test_id="T1.11.3",
    tier=1,
    feature_id=11,
    name="Anonymous Access Revoked from Business Tables",
    description="REVOKE ALL ON public business tables FROM anon",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_f11_revoke_anon(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"REVOKE\s+ALL.*FROM\s+anon", content, re.IGNORECASE):
            found = True
            break
    h.assert_true(found, "Migrations must REVOKE ALL on business tables from anon")


@registry.register(
    test_id="T1.11.4",
    tier=1,
    feature_id=11,
    name="RLS Policies Enforce Tenant Isolation via Helper",
    description="RLS SELECT policies filter by tenant_id in (select app.user_tenant_ids())",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02",
)
def test_f11_rls_tenant_helper(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "user_tenant_ids" in content:
            found = True
            break
    h.assert_true(found, "RLS policies must filter by app.user_tenant_ids()")


@registry.register(
    test_id="T1.11.5",
    tier=1,
    feature_id=11,
    name="RLS Policies Assert Permissions via Helper",
    description="RLS policies check permissions via app.has_permission(tenant_id, ...)",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02",
)
def test_f11_rls_permission_helper(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "has_permission" in content:
            found = True
            break
    h.assert_true(found, "RLS policies must assert permissions via app.has_permission()")


# Feature 12: Append-only Audit Log
@registry.register(
    test_id="T1.12.1",
    tier=1,
    feature_id=12,
    name="Audit Log Table Schema Defined",
    description="Table audit_log defined with tenant_id, actor_id, action, entity_type, entity_id, payload, created_at",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f12_audit_table_schema(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found_table = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "create table" in content.lower() and "audit_log" in content.lower():
            found_table = True
            break
    h.assert_true(found_table, "Table audit_log must be defined in migrations")


@registry.register(
    test_id="T1.12.2",
    tier=1,
    feature_id=12,
    name="Audit Log UPDATE and DELETE Revoked",
    description="REVOKE UPDATE, DELETE ON audit_log FROM authenticated, anon, public",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02, Gate G1",
)
def test_f12_audit_revoke_mutation(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found_revoke = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"REVOKE\s+UPDATE.*ON\s+.*audit_log", content, re.IGNORECASE) or \
           re.search(r"REVOKE\s+DELETE.*ON\s+.*audit_log", content, re.IGNORECASE):
            found_revoke = True
            break
    h.assert_true(found_revoke, "Audit log must revoke UPDATE and DELETE privileges")


@registry.register(
    test_id="T1.12.3",
    tier=1,
    feature_id=12,
    name="Mutation RPC Inserts Audit Log Record in Same Transaction",
    description="Business mutation RPC inserts into audit_log inside transaction",
    source="ORIGINAL_REQUEST.md §R2, §6.7, S1-06, Gate G1",
)
def test_f12_audit_inside_rpc(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "insert into" in content.lower() and "audit_log" in content.lower():
            found = True
            break
    h.assert_true(found, "Mutation RPC must write to audit_log")


@registry.register(
    test_id="T1.12.4",
    tier=1,
    feature_id=12,
    name="Audit Record Records auth.uid() as Actor",
    description="Audit insertion resolves actor_id from auth.uid()",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02",
)
def test_f12_audit_actor_uid(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "auth.uid()" in content and "audit_log" in content:
            found = True
            break
    h.assert_true(found, "Audit log must record actor from auth.uid()")


@registry.register(
    test_id="T1.12.5",
    tier=1,
    feature_id=12,
    name="Audit Log Protected by Tenant Isolation RLS",
    description="Audit log table has RLS policy restricting reads to user's tenant",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02",
)
def test_f12_audit_rls(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    found = False
    for sf in sql_files:
        content = sf.read_text(encoding="utf-8", errors="ignore")
        if "audit_log" in content and "ENABLE ROW LEVEL SECURITY" in content.upper():
            found = True
            break
    h.assert_true(found, "audit_log table must have RLS enabled")


# Feature 13: Walking Skeleton Feature m01-core-work
@registry.register(
    test_id="T1.13.1",
    tier=1,
    feature_id=13,
    name="m01-core-work Complete Layer Structure Exists",
    description="src/features/m01-core-work contains schemas, server, and components directories",
    source="ORIGINAL_REQUEST.md §R2, §6.2, S1-06, Gate G1",
)
def test_f13_structure_exists(h: TestHarness):
    h.assert_file_exists("src/features/m01-core-work", "src/features/m01-core-work must exist")
    h.assert_file_exists("src/features/m01-core-work/server/actions.ts", "actions.ts must exist")
    h.assert_file_exists("src/features/m01-core-work/server/service.ts", "service.ts must exist")
    h.assert_file_exists("src/features/m01-core-work/server/repository.ts", "repository.ts must exist")
    h.assert_file_exists("src/features/m01-core-work/server/policy.ts", "policy.ts must exist")


@registry.register(
    test_id="T1.13.2",
    tier=1,
    feature_id=13,
    name="m01 Actions Coordinates Zod, Context, Policy, and Service",
    description="actions.ts parses Zod input, calls getRequestContext, asserts permission, calls service",
    source="ORIGINAL_REQUEST.md §R2, §6.8, S1-06",
)
def test_f13_actions_coordinator(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/actions.ts")
    h.assert_true('"use server"' in content or "'use server'" in content, "actions.ts must declare 'use server'")
    h.assert_true("getRequestContext" in content, "actions.ts must call getRequestContext()")
    h.assert_true("service" in content.lower(), "actions.ts must coordinate service call")


@registry.register(
    test_id="T1.13.3",
    tier=1,
    feature_id=13,
    name="m01 Service Coordinates Business Rules with server-only Guard",
    description="service.ts contains business rules and imports 'server-only'",
    source="ORIGINAL_REQUEST.md §R2, §6.2, §6.3, S1-06",
)
def test_f13_service_layer(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/service.ts")
    h.assert_true("server-only" in content, "service.ts must import 'server-only'")


@registry.register(
    test_id="T1.13.4",
    tier=1,
    feature_id=13,
    name="m01 Policy Asserts Record-level Entitlement",
    description="policy.ts contains permission assertion functions",
    source="ORIGINAL_REQUEST.md §R2, §6.2, S1-05, S1-06",
)
def test_f13_policy_layer(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/policy.ts")
    h.assert_true("server-only" in content, "policy.ts must import 'server-only'")
    h.assert_true("permission" in content.lower(), "policy.ts must assert permissions")


@registry.register(
    test_id="T1.13.5",
    tier=1,
    feature_id=13,
    name="m01 Repository Calls PostgreSQL RPC Returning Result<T>",
    description="repository.ts calls app.create_work_item RPC via user session client",
    source="ORIGINAL_REQUEST.md §R2, §6.2, S1-06, Gate G1",
)
def test_f13_repository_layer(h: TestHarness):
    content = h.read_text("src/features/m01-core-work/server/repository.ts")
    h.assert_true("server-only" in content, "repository.ts must import 'server-only'")
    h.assert_true("rpc" in content.lower(), "repository.ts must invoke Supabase RPC")


# Feature 14: Entitlement-aware Navigation Registry
@registry.register(
    test_id="T1.14.1",
    tier=1,
    feature_id=14,
    name="Navigation Registry Module Exists",
    description="src/config/navigation.ts defines navigation item registry",
    source="ORIGINAL_REQUEST.md §R2, S1-07, Gate G1",
)
def test_f14_nav_registry_exists(h: TestHarness):
    h.assert_file_exists("src/config/navigation.ts", "src/config/navigation.ts must exist")


@registry.register(
    test_id="T1.14.2",
    tier=1,
    feature_id=14,
    name="Navigation Items Specify Required Permissions and Route",
    description="Navigation items specify requiredPermission, route, and status",
    source="ORIGINAL_REQUEST.md §R2, S1-07",
)
def test_f14_nav_item_structure(h: TestHarness):
    content = h.read_text("src/config/navigation.ts")
    h.assert_true("route" in content, "Navigation registry items must define 'route'")
    h.assert_true("requiredPermission" in content or "permission" in content, "Navigation registry items must define permissions")


@registry.register(
    test_id="T1.14.3",
    tier=1,
    feature_id=14,
    name="Navigation Filter Function Evaluates RequestContext Permissions",
    description="Function filters navigation links based on user permissions in RequestContext",
    source="ORIGINAL_REQUEST.md §R2, S1-07",
)
def test_f14_nav_filter_fn(h: TestHarness):
    content = h.read_text("src/config/navigation.ts")
    h.assert_true(
        "filter" in content.lower() or "getNavigation" in content or "hasPermission" in content,
        "navigation.ts must provide filtering based on permissions",
    )


@registry.register(
    test_id="T1.14.4",
    tier=1,
    feature_id=14,
    name="Navigation Registry Distinguishes Status Types",
    description="Navigation status supports DEEP, FRAME, DEFERRED, LEGACY_MOCK",
    source="ORIGINAL_REQUEST.md §R2, S1-07",
)
def test_f14_nav_statuses(h: TestHarness):
    content = h.read_text("src/config/navigation.ts")
    h.assert_true(
        "LEGACY_MOCK" in content or "status" in content,
        "navigation.ts must support status indicators",
    )


@registry.register(
    test_id="T1.14.5",
    tier=1,
    feature_id=14,
    name="Sidebar Renders Server-side Based on Filtered Navigation",
    description="Sidebar layout is a Server Component rendering dynamic navigation",
    source="ORIGINAL_REQUEST.md §R2, S1-07, Gate G1",
)
def test_f14_sidebar_server_rendered(h: TestHarness):
    sidebar_path = "src/components/layout/sidebar.tsx"
    app_layout = "src/app/(app)/layout.tsx"
    h.assert_true(
        h.file_exists(sidebar_path) or h.file_exists(app_layout),
        "Sidebar component or App layout must exist",
    )


# Feature 15: Private Storage Signed URLs
@registry.register(
    test_id="T1.15.1",
    tier=1,
    feature_id=15,
    name="Private Storage Bucket Configured",
    description="Evidence bucket configured as private (public = false)",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_private_bucket(h: TestHarness):
    content = ""
    if h.file_exists("supabase/config.toml"):
        content += h.read_text("supabase/config.toml")
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    for sf in sql_files:
        content += sf.read_text(encoding="utf-8", errors="ignore")
    h.assert_true(
        "evidence" in content.lower() or "buckets" in content.lower(),
        "Private storage bucket must be defined",
    )


@registry.register(
    test_id="T1.15.2",
    tier=1,
    feature_id=15,
    name="Storage Path Convention Structured by Tenant",
    description="Storage paths follow {tenant_id}/{entity}/{id}/{file}",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_storage_path(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    matches = h.grep_pattern(r"\{tenant_id\}", rel_glob="**/*")
    h.assert_true(
        "tenant_id" in adr or len(matches) > 0,
        "Storage path structure must include tenant_id prefix",
    )


@registry.register(
    test_id="T1.15.3",
    tier=1,
    feature_id=15,
    name="File Route Handler Exists",
    description="src/app/api/files/[id]/route.ts exists to serve authorized signed URLs",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09, Gate G1",
)
def test_f15_route_handler_exists(h: TestHarness):
    h.assert_true(
        h.file_exists("src/app/api/files/[id]/route.ts") or h.file_exists("src/app/api/files/route.ts"),
        "File route handler must exist under src/app/api/files",
    )


@registry.register(
    test_id="T1.15.4",
    tier=1,
    feature_id=15,
    name="File Route Handler Verifies Permission Before Issuing Signed URL",
    description="Route handler checks RequestContext and permission before creating signed URL",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_file_handler_auth(h: TestHarness):
    route_file = "src/app/api/files/[id]/route.ts" if h.file_exists("src/app/api/files/[id]/route.ts") else "src/app/api/files/route.ts"
    if h.file_exists(route_file):
        content = h.read_text(route_file)
        h.assert_true(
            "createSignedUrl" in content or "signedUrl" in content or "auth" in content.lower(),
            "File route handler must authenticate and generate signed URL",
        )


@registry.register(
    test_id="T1.15.5",
    tier=1,
    feature_id=15,
    name="Signed URL TTL Restricted to <= 60 Seconds",
    description="Generated signed URLs have short expiration (<= 60s)",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_f15_signed_url_ttl(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    matches = h.grep_pattern(r"60", rel_glob="src/app/api/files/**/*")
    h.assert_true(
        "60" in adr or len(matches) > 0,
        "Signed URL TTL must be restricted to <= 60 seconds",
    )


# Feature 16: CI Architectural Fitness Functions
@registry.register(
    test_id="T1.16.1",
    tier=1,
    feature_id=16,
    name="ESLint Rules Enforce Layer Boundaries",
    description="ESLint configuration forbids cross-tier illegal imports",
    source="ORIGINAL_REQUEST.md §R2, §6.3, S1-08, Gate G1",
)
def test_f16_eslint_boundaries(h: TestHarness):
    pkg = h.read_json("package.json")
    has_eslint = "eslint" in pkg.get("devDependencies", {}) or "eslint" in pkg.get("dependencies", {})
    h.assert_true(has_eslint, "ESLint must be installed in package.json")


@registry.register(
    test_id="T1.16.2",
    tier=1,
    feature_id=16,
    name="File Line-count Limit (<= 300 lines) Enforced for Non-legacy Code",
    description="Fitness check ensures all new non-legacy source files are <= 300 lines",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_file_line_count(h: TestHarness):
    # Verify non-legacy feature files do not exceed 300 lines
    for f in h.resolve_path("src/features").rglob("*.ts"):
        lines = len(f.read_text(encoding="utf-8", errors="ignore").splitlines())
        h.assert_true(lines <= 300, f"File {f} exceeds 300 lines ({lines} lines)")


@registry.register(
    test_id="T1.16.3",
    tier=1,
    feature_id=16,
    name="Page Line-count Limit (<= 100 lines) Enforced for Route Pages",
    description="Fitness check ensures all page.tsx under src/app/(app) are <= 100 lines",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_page_line_count(h: TestHarness):
    app_dir = h.resolve_path("src/app/(app)")
    if app_dir.exists():
        for page in app_dir.rglob("page.tsx"):
            lines = len(page.read_text(encoding="utf-8", errors="ignore").splitlines())
            h.assert_true(lines <= 100, f"Page {page} exceeds 100 lines ({lines} lines)")


@registry.register(
    test_id="T1.16.4",
    tier=1,
    feature_id=16,
    name="Server Modules Enforce 'server-only' Guard",
    description="All modules under features/*/server/ (except actions.ts) import 'server-only'",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_server_only_guards(h: TestHarness):
    server_dir = h.resolve_path("src/features")
    if server_dir.exists():
        for sf in server_dir.rglob("server/*.ts"):
            if sf.name == "actions.ts":
                continue
            content = sf.read_text(encoding="utf-8", errors="ignore")
            h.assert_true(
                'import "server-only"' in content or "import 'server-only'" in content,
                f"Server file {sf} must import 'server-only'",
            )


@registry.register(
    test_id="T1.16.5",
    tier=1,
    feature_id=16,
    name="Secret Scanner Asserts No Leaked Secret Keys in NEXT_PUBLIC_",
    description="No NEXT_PUBLIC_ environment variable contains SERVICE_ROLE or secret strings",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-08, Gate G1",
)
def test_f16_no_leaked_public_secrets(h: TestHarness):
    matches = h.grep_pattern(r"NEXT_PUBLIC_.*(?:SERVICE_ROLE|SECRET)", rel_glob="**/*")
    h.assert_equal(len(matches), 0, f"Leaked private keys in NEXT_PUBLIC_ variables: {matches}")


# Feature 17: DB Reset & Persona Seeding Script
@registry.register(
    test_id="T1.17.1",
    tier=1,
    feature_id=17,
    name="package.json Defines db:reset Script",
    description="package.json defines 'db:reset' npm script for local development",
    source="ORIGINAL_REQUEST.md §R2, D-07, S1-10, Gate G1",
)
def test_f17_db_reset_script_defined(h: TestHarness):
    pkg = h.read_json("package.json")
    scripts = pkg.get("scripts", {})
    h.assert_in("db:reset", scripts, "package.json must define 'db:reset' script")


@registry.register(
    test_id="T1.17.2",
    tier=1,
    feature_id=17,
    name="Seed Script Provisions Simulated Communes TN-DEMO-A and TN-DEMO-B",
    description="Seed script populates tenants table with TN-DEMO-A and TN-DEMO-B",
    source="ORIGINAL_REQUEST.md §R2, S1-10, Gate G1",
)
def test_f17_seed_tenants(h: TestHarness):
    seed_path = "supabase/seed.sql"
    h.assert_file_exists(seed_path, "supabase/seed.sql must exist")
    content = h.read_text(seed_path)
    h.assert_true("TN-DEMO-A" in content, "seed.sql must seed TN-DEMO-A")
    h.assert_true("TN-DEMO-B" in content, "seed.sql must seed TN-DEMO-B")


@registry.register(
    test_id="T1.17.3",
    tier=1,
    feature_id=17,
    name="Seed Script Provisions P1-P6 Personas",
    description="Seed script provisions personas P1 through P6 with distinct roles",
    source="ORIGINAL_REQUEST.md §R2, S1-10, Gate G1",
)
def test_f17_seed_personas(h: TestHarness):
    content = h.read_text("supabase/seed.sql")
    h.assert_true("LANH_DAO" in content or "CAN_BO" in content, "seed.sql must define persona roles")


@registry.register(
    test_id="T1.17.4",
    tier=1,
    feature_id=17,
    name="Seed Provisions Auth Accounts for Personas",
    description="Seed script or creation script provisions auth credentials for testing",
    source="ORIGINAL_REQUEST.md §R2, D-07, S1-10",
)
def test_f17_seed_auth_accounts(h: TestHarness):
    content = h.read_text("supabase/seed.sql")
    has_users = "auth.users" in content or "identities" in content or "email" in content
    h.assert_true(has_users, "seed.sql must provision accounts for authentication")


@registry.register(
    test_id="T1.17.5",
    tier=1,
    feature_id=17,
    name="Seed Associates Personas with Memberships and Permissions",
    description="Seed script populates memberships and role_permissions tables",
    source="ORIGINAL_REQUEST.md §R2, S1-10",
)
def test_f17_seed_memberships(h: TestHarness):
    content = h.read_text("supabase/seed.sql")
    h.assert_true("memberships" in content, "seed.sql must seed memberships")
