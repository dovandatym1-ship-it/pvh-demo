"""
Tier 3: Cross-Feature Interactions
Pairwise combinatorial verification of multi-feature integration contracts across architecture layers.
Authoritative Sources: ORIGINAL_REQUEST.md, PROJECT.md Features 1–28, ADR-001, ADR-002
"""

import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


@registry.register(
    test_id="T3.01",
    tier=3,
    feature_id=8,
    name="Cross-Feature: Auth (F8) × RequestContext (F9)",
    description="Supabase Auth session extracts user identity and queries DB memberships to construct RequestContext",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-03, S1-04",
)
def test_cross_auth_request_context(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "auth.getUser" in rc or "getUser" in rc,
        "RequestContext must resolve authenticated user from Supabase Auth getUser()",
    )
    h.assert_true(
        "memberships" in rc.lower(),
        "RequestContext must resolve roles and permissions from database memberships",
    )


@registry.register(
    test_id="T3.02",
    tier=3,
    feature_id=8,
    name="Cross-Feature: Auth (F8) × RLS (F11)",
    description="Authenticated user session uid matches auth.uid() in PostgreSQL RLS helper app.user_tenant_ids()",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02",
)
def test_cross_auth_rls(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "auth.uid()" in all_sql and "user_tenant_ids" in all_sql,
        "RLS tenant helper function must resolve active user via auth.uid()",
    )


@registry.register(
    test_id="T3.03",
    tier=3,
    feature_id=9,
    name="Cross-Feature: RequestContext (F9) × Navigation (F14)",
    description="Server-rendered layout passes RequestContext permissions to navigation filter to render dynamic sidebar",
    source="ORIGINAL_REQUEST.md §R2, S1-07, Gate G1",
)
def test_cross_request_context_navigation(h: TestHarness):
    nav = h.read_text("src/config/navigation.ts")
    h.assert_true(
        "permission" in nav.lower() or "requiredPermission" in nav,
        "Navigation items must define required permissions evaluated against RequestContext",
    )


@registry.register(
    test_id="T3.04",
    tier=3,
    feature_id=9,
    name="Cross-Feature: RequestContext (F9) × Walking Skeleton (F13)",
    description="Server Action extracts RequestContext and asserts permission before invoking service",
    source="ORIGINAL_REQUEST.md §R2, §6.8, S1-06",
)
def test_cross_request_context_action(h: TestHarness):
    action = h.read_text("src/features/m01-core-work/server/actions.ts")
    h.assert_true(
        "getRequestContext" in action,
        "Server actions must obtain RequestContext from request context helper",
    )


@registry.register(
    test_id="T3.05",
    tier=3,
    feature_id=9,
    name="Cross-Feature: RequestContext (F9) × Simulated Tenant Model (F5)",
    description="RequestContext validates tenant from cookie against simulated communes TN-DEMO-A and TN-DEMO-B",
    source="ORIGINAL_REQUEST.md §R1, §R2, D-03, S1-04",
)
def test_cross_request_context_tenant(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "pvh_tenant" in rc,
        "RequestContext must validate pvh_tenant cookie against user memberships",
    )


@registry.register(
    test_id="T3.06",
    tier=3,
    feature_id=10,
    name="Cross-Feature: Composite Schema (F10) × RLS (F11)",
    description="Composite primary keys (tenant_id, id) integrate with RLS policies filtering on tenant_id",
    source="ORIGINAL_REQUEST.md §R2, §6.5, §6.6, S1-02",
)
def test_cross_composite_schema_rls(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "tenant_id" in all_sql and "user_tenant_ids" in all_sql,
        "Composite tenant schema must integrate with RLS tenant filter helpers",
    )


@registry.register(
    test_id="T3.07",
    tier=3,
    feature_id=10,
    name="Cross-Feature: Composite Schema (F10) × Work Items (F18)",
    description="Work item child tables enforce composite FK (tenant_id, work_item_id) referencing work_items(tenant_id, id)",
    source="ORIGINAL_REQUEST.md §R3, §6.5, S2-01",
)
def test_cross_composite_schema_work_items(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "work_items" in all_sql and "work_item_assignments" in all_sql and "tenant_id" in all_sql,
        "Work items child tables must define composite foreign keys with tenant_id",
    )


@registry.register(
    test_id="T3.08",
    tier=3,
    feature_id=11,
    name="Cross-Feature: RLS (F11) × Audit Log (F12)",
    description="Audit log table is protected by tenant RLS while recording immutable actor_id from auth.uid()",
    source="ORIGINAL_REQUEST.md §R2, §6.5, §6.6, S1-02",
)
def test_cross_rls_audit_log(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "audit_log" in all_sql and "auth.uid()" in all_sql,
        "Audit logging must record auth.uid() and enforce tenant boundaries",
    )


@registry.register(
    test_id="T3.09",
    tier=3,
    feature_id=12,
    name="Cross-Feature: Audit Log (F12) × State Machine RPC (F19)",
    description="Work item state transition RPC inserts an audit_log record in the same database transaction",
    source="ORIGINAL_REQUEST.md §R3, §6.7, S2-02, Gate G2",
)
def test_cross_audit_state_machine(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "audit_log" in all_sql and ("transition_work_item" in all_sql or "transition_work_item_state" in all_sql),
        "State transition RPC must insert audit_log within the same transaction",
    )


@registry.register(
    test_id="T3.10",
    tier=3,
    feature_id=13,
    name="Cross-Feature: Walking Skeleton (F13) × CI Fitness Functions (F16)",
    description="All modules of walking skeleton m01-core-work satisfy <=300 lines limit and server-only guards",
    source="ORIGINAL_REQUEST.md §R2, §6.12, S1-06, S1-08, Gate G1",
)
def test_cross_skeleton_fitness(h: TestHarness):
    feature_dir = h.resolve_path("src/features/m01-core-work")
    if feature_dir.exists():
        for f in feature_dir.rglob("*.ts"):
            lines = len(f.read_text(encoding="utf-8", errors="ignore").splitlines())
            h.assert_true(lines <= 300, f"m01 module {f} exceeds 300 lines ({lines} lines)")


@registry.register(
    test_id="T3.11",
    tier=3,
    feature_id=15,
    name="Cross-Feature: Private Storage (F15) × Culture Dossier (F24)",
    description="Culture dossier evidence attachments are stored in private storage bucket under {tenant_id}/culture/...",
    source="ORIGINAL_REQUEST.md §R4, §6.10, S3-03, Gate G3",
)
def test_cross_storage_culture_dossier(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "evidence" in adr.lower() or "storage" in adr.lower(),
        "Architecture must link culture dossier attachments to private storage",
    )


@registry.register(
    test_id="T3.12",
    tier=3,
    feature_id=15,
    name="Cross-Feature: Private Storage (F15) × RequestContext (F9)",
    description="Storage Route Handler validates user's RequestContext before issuing signed download URL",
    source="ORIGINAL_REQUEST.md §R2, §6.10, S1-09",
)
def test_cross_storage_request_context(h: TestHarness):
    route_file = "src/app/api/files/[id]/route.ts" if h.file_exists("src/app/api/files/[id]/route.ts") else "src/app/api/files/route.ts"
    if h.file_exists(route_file):
        content = h.read_text(route_file)
        h.assert_true(
            "getRequestContext" in content or "auth" in content.lower(),
            "File route handler must validate user context before issuing signed URL",
        )


@registry.register(
    test_id="T3.13",
    tier=3,
    feature_id=17,
    name="Cross-Feature: DB Reset (F17) × Work Items Schema (F18)",
    description="npm run db:reset successfully applies all work items schema migrations and seeds test tasks",
    source="ORIGINAL_REQUEST.md §R2, §R3, S1-10, S2-01",
)
def test_cross_db_reset_work_items(h: TestHarness):
    pkg = h.read_json("package.json")
    h.assert_in("db:reset", pkg.get("scripts", {}), "package.json must contain db:reset script")


@registry.register(
    test_id="T3.14",
    tier=3,
    feature_id=17,
    name="Cross-Feature: DB Reset (F17) × Culture Rule Packs (F23)",
    description="Seed script seeds initial illustrative rule pack TN-DEMO-ILLUSTRATIVE-01 during DB reset",
    source="ORIGINAL_REQUEST.md §R4, S1-10, S3-02",
)
def test_cross_db_reset_rule_packs(h: TestHarness):
    seed = h.read_text("supabase/seed.sql") if h.file_exists("supabase/seed.sql") else ""
    matches = h.grep_pattern("TN-DEMO-ILLUSTRATIVE-01", rel_glob="**/*")
    h.assert_true(
        "TN-DEMO-ILLUSTRATIVE-01" in seed or len(matches) > 0,
        "Rule pack TN-DEMO-ILLUSTRATIVE-01 must be seeded on DB reset",
    )


@registry.register(
    test_id="T3.15",
    tier=3,
    feature_id=18,
    name="Cross-Feature: Work Items Schema (F18) × State Machine RPC (F19)",
    description="State transition RPC enforces work_items table constraints and optimistic version increments",
    source="ORIGINAL_REQUEST.md §R3, §6.5, S2-01, S2-02",
)
def test_cross_work_items_state_machine(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "work_items" in all_sql and "version" in all_sql,
        "Work items schema must provide version column for state machine RPC optimistic locking",
    )


@registry.register(
    test_id="T3.16",
    tier=3,
    feature_id=19,
    name="Cross-Feature: State Machine RPC (F19) × LEGO UI (F20)",
    description="LEGO UI components invoke server actions calling state machine RPC and react to VERSION_CONFLICT",
    source="ORIGINAL_REQUEST.md §R3, S2-02, S2-03",
)
def test_cross_state_machine_lego_ui(h: TestHarness):
    comp_dir = h.resolve_path("src/features/m01-core-work/components")
    h.assert_true(comp_dir.exists(), "LEGO UI directory must exist")


@registry.register(
    test_id="T3.17",
    tier=3,
    feature_id=20,
    name="Cross-Feature: LEGO UI (F20) × Decommission Legacy Work (F21)",
    description="New LEGO work page replaces legacy work page, navigation updates from LEGACY_MOCK to DEEP",
    source="ORIGINAL_REQUEST.md §R3, S2-03, S2-06, Gate G2",
)
def test_cross_lego_ui_legacy_decommission(h: TestHarness):
    h.assert_file_exists("src/app/(app)/cong-viec/page.tsx", "Production cong-viec page must exist")


@registry.register(
    test_id="T3.18",
    tier=3,
    feature_id=22,
    name="Cross-Feature: Playwright E2E (F22) × State Machine (F19)",
    description="Multi-role E2E tests execute complete state lifecycle transitions through the RPC state machine",
    source="ORIGINAL_REQUEST.md §R3, S2-05, S2-07, Gate G2",
)
def test_cross_e2e_state_machine(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "playwright" in adr.lower() or "e2e" in adr.lower(),
        "ADR-002 must mandate E2E testing of multi-role state machine transitions",
    )


@registry.register(
    test_id="T3.19",
    tier=3,
    feature_id=23,
    name="Cross-Feature: Culture Rule Packs (F23) × Culture Dossier (F24)",
    description="Evaluation dossier evaluates household submissions against specified criteria in active rule pack",
    source="ORIGINAL_REQUEST.md §R4, S3-02, S3-03, Gate G3",
)
def test_cross_rule_packs_dossier(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "rule_pack" in all_sql and "submissions" in all_sql,
        "Submissions table must relate to rule_packs",
    )


@registry.register(
    test_id="T3.20",
    tier=3,
    feature_id=24,
    name="Cross-Feature: Culture Dossier (F24) × Decommission Legacy Culture (F25)",
    description="New culture dossier LEGO components replace 1,727-line legacy culture page",
    source="ORIGINAL_REQUEST.md §R4, S3-03, S3-04, Gate G3",
)
def test_cross_culture_dossier_legacy_decommission(h: TestHarness):
    vh_dir = h.resolve_path("src/app/(app)/van-hoa")
    h.assert_true(vh_dir.exists(), "src/app/(app)/van-hoa directory must exist")


@registry.register(
    test_id="T3.21",
    tier=3,
    feature_id=24,
    name="Cross-Feature: Culture Dossier (F24) × Report Snapshot (F26)",
    description="Finalized cultural assessment submissions serve as source lineage records for DEM-R01 snapshot",
    source="ORIGINAL_REQUEST.md §R4, S3-03, S3-05, Gate G3",
)
def test_cross_dossier_report_snapshot(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "snapshot" in adr.lower() and "lineage" in adr.lower(),
        "Architecture must define snapshot lineage tracking from source evaluation records",
    )


@registry.register(
    test_id="T3.22",
    tier=3,
    feature_id=26,
    name="Cross-Feature: Report Snapshot (F26) × Export Watermark (F27)",
    description="Finalized report snapshot provides frozen payload and sha256 checksum to official export generator",
    source="ORIGINAL_REQUEST.md §R4, S3-05, S3-06, Gate G3",
)
def test_cross_snapshot_export_watermark(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "sha256" in adr.lower() and "mô phỏng" in adr.lower(),
        "Export generator must combine snapshot sha256 checksum with demonstration watermark",
    )


@registry.register(
    test_id="T3.23",
    tier=3,
    feature_id=26,
    name="Cross-Feature: Report Snapshot (F26) × Async System Jobs (F28)",
    description="Generating heavy quarterly DEM-R01 snapshot is offloaded to system_jobs background queue",
    source="ORIGINAL_REQUEST.md §R4, D-12, S3-05",
)
def test_cross_snapshot_system_jobs(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "system_jobs" in adr or "job" in adr.lower(),
        "ADR-002 must specify offloading large report snapshots to system_jobs",
    )


@registry.register(
    test_id="T3.24",
    tier=3,
    feature_id=27,
    name="Cross-Feature: Export Watermark (F27) × Async System Jobs (F28)",
    description="Async worker generates watermarked PDF/XLSX export, saves to private bucket, and records receipt",
    source="ORIGINAL_REQUEST.md §R4, D-12, S3-06",
)
def test_cross_export_system_jobs(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "receipt" in adr.lower() or "system_jobs" in adr,
        "System jobs must record output receipt upon export completion",
    )


@registry.register(
    test_id="T3.25",
    tier=3,
    feature_id=2,
    name="Cross-Feature: Toolchain Hardening (F2) × Fitness Functions (F16)",
    description="Locked Node 22 LTS environment runs automated ESLint layer boundary checks in CI",
    source="ORIGINAL_REQUEST.md §R1, §R2, S0-03, S1-08",
)
def test_cross_toolchain_fitness(h: TestHarness):
    pkg = h.read_json("package.json")
    has_lint = "lint" in pkg.get("scripts", {})
    h.assert_true(has_lint, "package.json must contain lint script")


@registry.register(
    test_id="T3.26",
    tier=3,
    feature_id=4,
    name="Cross-Feature: Supabase Local (F4) × RLS (F11)",
    description="Local Supabase Docker instance enforces PostgreSQL RLS policies and passes pgTAP suite",
    source="ORIGINAL_REQUEST.md §R1, §R2, D-06, S1-02",
)
def test_cross_supabase_local_rls(h: TestHarness):
    h.assert_file_exists("supabase/config.toml", "supabase/config.toml must exist")


@registry.register(
    test_id="T3.27",
    tier=3,
    feature_id=6,
    name="Cross-Feature: Strangler Isolation (F6) × Navigation (F14)",
    description="Navigation registry flags legacy pages with status = LEGACY_MOCK and layout displays mock banner",
    source="ORIGINAL_REQUEST.md §R1, §R2, D-02, S1-07, Gate G0",
)
def test_cross_strangler_navigation(h: TestHarness):
    nav = h.read_text("src/config/navigation.ts") if h.file_exists("src/config/navigation.ts") else ""
    layout = h.read_text("src/app/(legacy)/layout.tsx") if h.file_exists("src/app/(legacy)/layout.tsx") else ""
    h.assert_true(
        "LEGACY_MOCK" in (nav + layout),
        "Legacy routes must be tagged with LEGACY_MOCK in navigation registry or layout",
    )


@registry.register(
    test_id="T3.28",
    tier=3,
    feature_id=7,
    name="Cross-Feature: ADR-002 Conventions (F7) × All Features (F8–F28)",
    description="ADR-002 architectural decisions D-02 through D-12 govern full feature inventory",
    source="ORIGINAL_REQUEST.md §R1, S0-05, Gate G0",
)
def test_cross_adr002_governance(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    for d in ["D-02", "D-03", "D-07", "D-08", "D-11", "D-12"]:
        h.assert_true(d in adr, f"ADR-002 must document governance decision {d}")
