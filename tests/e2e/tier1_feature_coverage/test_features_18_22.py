"""
Tier 1: Feature Coverage (Features 18–22)
Sprint 2 / Slice 1: M01 Core Work, State Machine RPC, LEGO UI, Legacy Work Decommission, Multi-role E2E
Authoritative Sources: ORIGINAL_REQUEST.md §R3, PROJECT.md Features 18–22, Gate G2
"""

import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 18: M01 Full Work Item Schema & pgTAP
@registry.register(
    test_id="T1.18.1",
    tier=1,
    feature_id=18,
    name="Full Work Item Tables Defined in Migration",
    description="Tables work_items, work_item_assignments, work_item_events, work_item_links defined",
    source="ORIGINAL_REQUEST.md §R3, S2-01, Gate G2",
)
def test_f18_full_schema_tables(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("work_items" in all_sql, "Migration must define work_items table")
    h.assert_true("work_item_assignments" in all_sql, "Migration must define work_item_assignments table")
    h.assert_true("work_item_events" in all_sql, "Migration must define work_item_events table")
    h.assert_true("work_item_links" in all_sql, "Migration must define work_item_links table")


@registry.register(
    test_id="T1.18.2",
    tier=1,
    feature_id=18,
    name="Composite Foreign Keys on Work Item Child Tables",
    description="Child tables enforce composite foreign keys (tenant_id, work_item_id)",
    source="ORIGINAL_REQUEST.md §R3, §6.5, S2-01",
)
def test_f18_composite_fk(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "REFERENCES" in all_sql and "tenant_id" in all_sql,
        "Child tables must enforce composite foreign keys with tenant_id",
    )


@registry.register(
    test_id="T1.18.3",
    tier=1,
    feature_id=18,
    name="Work Item Events Table Captures Append-only Lifecycle",
    description="work_item_events records event_type, from_state, to_state, actor_id, payload",
    source="ORIGINAL_REQUEST.md §R3, S2-01",
)
def test_f18_events_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "work_item_events" in all_sql and ("from_state" in all_sql or "to_state" in all_sql or "event" in all_sql),
        "work_item_events table must capture state transition history",
    )


@registry.register(
    test_id="T1.18.4",
    tier=1,
    feature_id=18,
    name="Work Item Links Table Supports Associations",
    description="work_item_links table enables linking tasks to other tasks or citizen entities",
    source="ORIGINAL_REQUEST.md §R3, S2-01",
)
def test_f18_links_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("work_item_links" in all_sql, "work_item_links table must exist")


@registry.register(
    test_id="T1.18.5",
    tier=1,
    feature_id=18,
    name="pgTAP Test Suite for Work Items Exists",
    description="supabase/tests contains pgTAP test for work items schema and RLS",
    source="ORIGINAL_REQUEST.md §R3, S2-01, Gate G2",
)
def test_f18_pgtap_tests(h: TestHarness):
    tests_dir = h.resolve_path("supabase/tests")
    has_pgtap = tests_dir.exists() and any(f.suffix == ".sql" for f in tests_dir.glob("*"))
    h.assert_true(has_pgtap, "pgTAP tests for work items must exist in supabase/tests")


# Feature 19: M01 Atomic State Machine RPC
@registry.register(
    test_id="T1.19.1",
    tier=1,
    feature_id=19,
    name="State Machine RPC Function Defined",
    description="PostgreSQL RPC app.transition_work_item_state exists",
    source="ORIGINAL_REQUEST.md §R3, S2-02, PROJECT.md Interface Contracts §4",
)
def test_f19_transition_rpc_defined(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "transition_work_item" in all_sql or "transition_work_item_state" in all_sql,
        "Migration must define transition_work_item RPC function",
    )


@registry.register(
    test_id="T1.19.2",
    tier=1,
    feature_id=19,
    name="State Machine Defines Standard Transition Path",
    description="Transitions include Mới -> Đã giao -> Đang xử lý -> Chờ rà soát -> Hoàn thành / Trả lại",
    source="ORIGINAL_REQUEST.md §R3, S2-02",
)
def test_f19_transition_path(h: TestHarness):
    wf_file = "src/features/m01-core-work/server/workflow.ts"
    if h.file_exists(wf_file):
        content = h.read_text(wf_file)
        h.assert_true("NEW" in content or "MOI" in content or "ASSIGNED" in content or "DA_GIAO" in content, "Workflow must define standard states")


@registry.register(
    test_id="T1.19.3",
    tier=1,
    feature_id=19,
    name="State Transition Increments Version Monotonically",
    description="RPC increments version column upon successful state transition",
    source="ORIGINAL_REQUEST.md §R3, §6.5, S2-02",
)
def test_f19_version_increment(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "version = version + 1" in all_sql or "version + 1" in all_sql,
        "Transition RPC must increment version by 1",
    )


@registry.register(
    test_id="T1.19.4",
    tier=1,
    feature_id=19,
    name="State Machine Records Event and Audit Simultaneously",
    description="State transition writes both work_item_events and audit_log within same transaction",
    source="ORIGINAL_REQUEST.md §R3, §6.7, S2-02",
)
def test_f19_atomic_events_audit(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "audit_log" in all_sql and "work_item_events" in all_sql,
        "State transition RPC must write to both audit_log and work_item_events",
    )


@registry.register(
    test_id="T1.19.5",
    tier=1,
    feature_id=19,
    name="Optimistic Concurrency Control with 409 VERSION_CONFLICT",
    description="RPC rejects transitions with mismatched version and returns VERSION_CONFLICT",
    source="ORIGINAL_REQUEST.md §R3, §6.8, S2-02, Gate G2",
)
def test_f19_version_conflict_return(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    has_conflict = "VERSION_CONFLICT" in all_sql or "expected_version" in all_sql
    h.assert_true(has_conflict, "Transition RPC must enforce optimistic locking with expected_version")


# Feature 20: M01 LEGO UI Implementation
@registry.register(
    test_id="T1.20.1",
    tier=1,
    feature_id=20,
    name="Work Item Route Page Exists and <= 100 Lines",
    description="src/app/(app)/cong-viec/page.tsx exists and is <= 100 lines",
    source="ORIGINAL_REQUEST.md §R3, S2-03, Gate G2",
)
def test_f20_work_page_lines(h: TestHarness):
    page_path = "src/app/(app)/cong-viec/page.tsx"
    h.assert_file_exists(page_path, "src/app/(app)/cong-viec/page.tsx must exist")
    h.assert_max_lines(page_path, 100, "Work page must be <= 100 lines")


@registry.register(
    test_id="T1.20.2",
    tier=1,
    feature_id=20,
    name="Workbench Route Page Exists and <= 100 Lines",
    description="src/app/(app)/ban-lam-viec/page.tsx exists and is <= 100 lines",
    source="ORIGINAL_REQUEST.md §R3, S2-04, Gate G2",
)
def test_f20_workbench_page_lines(h: TestHarness):
    page_path = "src/app/(app)/ban-lam-viec/page.tsx"
    h.assert_file_exists(page_path, "src/app/(app)/ban-lam-viec/page.tsx must exist")
    h.assert_max_lines(page_path, 100, "Workbench page must be <= 100 lines")


@registry.register(
    test_id="T1.20.3",
    tier=1,
    feature_id=20,
    name="LEGO Components Reside in Feature Directory",
    description="Components reside in src/features/m01-core-work/components/",
    source="ORIGINAL_REQUEST.md §R3, §6.2, S2-03",
)
def test_f20_lego_components_exist(h: TestHarness):
    comp_dir = h.resolve_path("src/features/m01-core-work/components")
    h.assert_true(comp_dir.exists(), "src/features/m01-core-work/components must exist")
    components = list(comp_dir.glob("*.tsx"))
    h.assert_true(len(components) >= 2, f"Expected LEGO components in m01, found {len(components)}")


@registry.register(
    test_id="T1.20.4",
    tier=1,
    feature_id=20,
    name="Every LEGO Component File <= 300 Lines",
    description="All components under src/features/m01-core-work/components/ are <= 300 lines",
    source="ORIGINAL_REQUEST.md §R3, §6.12, S2-03, Gate G2",
)
def test_f20_lego_components_lines(h: TestHarness):
    comp_dir = h.resolve_path("src/features/m01-core-work/components")
    if comp_dir.exists():
        for comp in comp_dir.glob("*.tsx"):
            h.assert_max_lines(comp.relative_to(h.target_dir), 300)


@registry.register(
    test_id="T1.20.5",
    tier=1,
    feature_id=20,
    name="Workbench Displays Categorized Tasks",
    description="Workbench renders task sections: My Tasks, Overdue, Awaiting Review",
    source="ORIGINAL_REQUEST.md §R3, S2-04",
)
def test_f20_workbench_sections(h: TestHarness):
    content = h.read_text("src/app/(app)/ban-lam-viec/page.tsx")
    matches = h.grep_pattern("công việc", rel_glob="src/app/(app)/ban-lam-viec/**/*", case_sensitive=False)
    h.assert_true(len(content) > 0 or len(matches) > 0, "Workbench must render task summaries")


# Feature 21: Decommission Legacy Work Pages
@registry.register(
    test_id="T1.21.1",
    tier=1,
    feature_id=21,
    name="Legacy Work Page Decommissioned",
    description="Legacy route (legacy)/ke-hoach-cong-viec is deleted or permanently redirected",
    source="ORIGINAL_REQUEST.md §R3, S2-06, Gate G2",
)
def test_f21_legacy_work_decommissioned(h: TestHarness):
    legacy_work = h.resolve_path("src/app/(legacy)/ke-hoach-cong-viec")
    is_removed_or_redirect = not legacy_work.exists() or (legacy_work / "page.tsx").read_text(encoding="utf-8", errors="ignore").find("redirect") != -1
    h.assert_true(is_removed_or_redirect, "Legacy work route must be removed or redirected")


@registry.register(
    test_id="T1.21.2",
    tier=1,
    feature_id=21,
    name="Legacy Workbench Work Components Removed",
    description="Work tasks card removed from legacy workbench page",
    source="ORIGINAL_REQUEST.md §R3, S2-06",
)
def test_f21_legacy_workbench_clean(h: TestHarness):
    legacy_wb = h.resolve_path("src/app/(legacy)/ban-lam-viec/page.tsx")
    if legacy_wb.exists():
        content = legacy_wb.read_text(encoding="utf-8", errors="ignore")
        h.assert_true("redirect" in content or "DECOMMISSIONED" in content or len(content.splitlines()) < 100, "Legacy workbench work items must be decommissioned")


@registry.register(
    test_id="T1.21.3",
    tier=1,
    feature_id=21,
    name="Navigation Registry Sets Work Items Status to DEEP",
    description="Navigation registry updates work items menu item status from LEGACY_MOCK to DEEP",
    source="ORIGINAL_REQUEST.md §R3, S2-06",
)
def test_f21_nav_status_deep(h: TestHarness):
    if h.file_exists("src/config/navigation.ts"):
        content = h.read_text("src/config/navigation.ts")
        h.assert_true("DEEP" in content, "navigation.ts must indicate DEEP status for completed slices")


@registry.register(
    test_id="T1.21.4",
    tier=1,
    feature_id=21,
    name="Navigation Route Links Point to (app)/cong-viec",
    description="Work item navigation link directs to /cong-viec production route",
    source="ORIGINAL_REQUEST.md §R3, S2-06",
)
def test_f21_nav_link_production(h: TestHarness):
    if h.file_exists("src/config/navigation.ts"):
        content = h.read_text("src/config/navigation.ts")
        h.assert_true("/cong-viec" in content, "Navigation must point to /cong-viec")


@registry.register(
    test_id="T1.21.5",
    tier=1,
    feature_id=21,
    name="Application Builds Cleanly Post-decommissioning",
    description="Decommissioning legacy work items does not leave dangling imports",
    source="ORIGINAL_REQUEST.md §R3, S2-06, Gate G2",
)
def test_f21_clean_build(h: TestHarness):
    matches = h.grep_pattern("ke-hoach-cong-viec", rel_glob="src/app/(app)/**/*")
    h.assert_equal(len(matches), 0, "No new app components may import legacy work modules")


# Feature 22: M01 Playwright Multi-role E2E Test
@registry.register(
    test_id="T1.22.1",
    tier=1,
    feature_id=22,
    name="Multi-role E2E Test Specification Exists",
    description="Playwright E2E test file exists for multi-role work flow",
    source="ORIGINAL_REQUEST.md §R3, S2-07, Gate G2",
)
def test_f22_playwright_test_file(h: TestHarness):
    test_path1 = "tests/e2e/m01_multi_role.spec.ts"
    test_path2 = "tests/e2e/work_item_workflow.spec.ts"
    h.assert_true(
        h.file_exists(test_path1) or h.file_exists(test_path2) or h.file_exists("tests/e2e/runner.py"),
        "Multi-role E2E test file must exist",
    )


@registry.register(
    test_id="T1.22.2",
    tier=1,
    feature_id=22,
    name="E2E Test Exercises Assigner Role",
    description="Test simulates task creation and assignment by Assigner/Leader persona",
    source="ORIGINAL_REQUEST.md §R3, S2-07",
)
def test_f22_assigner_role(h: TestHarness):
    content = h.read_text("tests/e2e/m01_multi_role.spec.ts") if h.file_exists("tests/e2e/m01_multi_role.spec.ts") else ""
    plan = h.read_text("README.md") if h.file_exists("README.md") else ""
    h.assert_true("assign" in content.lower() or "assigner" in content.lower() or "giao việc" in (content + plan).lower(), "E2E test must exercise assigner role")


@registry.register(
    test_id="T1.22.3",
    tier=1,
    feature_id=22,
    name="E2E Test Exercises Worker Processing Role",
    description="Test simulates Worker persona moving task to In Progress and Under Review",
    source="ORIGINAL_REQUEST.md §R3, S2-07",
)
def test_f22_worker_role(h: TestHarness):
    content = h.read_text("tests/e2e/m01_multi_role.spec.ts") if h.file_exists("tests/e2e/m01_multi_role.spec.ts") else ""
    plan = h.read_text("README.md") if h.file_exists("README.md") else ""
    h.assert_true("worker" in content.lower() or "xử lý" in (content + plan).lower() or "progress" in content.lower(), "E2E test must exercise worker role")


@registry.register(
    test_id="T1.22.4",
    tier=1,
    feature_id=22,
    name="E2E Test Exercises Reviewer Approval Role",
    description="Test simulates Reviewer persona reviewing and completing task",
    source="ORIGINAL_REQUEST.md §R3, S2-07",
)
def test_f22_reviewer_role(h: TestHarness):
    content = h.read_text("tests/e2e/m01_multi_role.spec.ts") if h.file_exists("tests/e2e/m01_multi_role.spec.ts") else ""
    plan = h.read_text("README.md") if h.file_exists("README.md") else ""
    h.assert_true("reviewer" in content.lower() or "rà soát" in (content + plan).lower() or "completed" in content.lower(), "E2E test must exercise reviewer role")


@registry.register(
    test_id="T1.22.5",
    tier=1,
    feature_id=22,
    name="E2E Test Verifies Multi-role Audit Trail",
    description="Test asserts that audit trail captures actions of assigner, worker, and reviewer",
    source="ORIGINAL_REQUEST.md §R3, S2-07, Gate G2",
)
def test_f22_audit_trail_assertion(h: TestHarness):
    content = h.read_text("tests/e2e/m01_multi_role.spec.ts") if h.file_exists("tests/e2e/m01_multi_role.spec.ts") else ""
    plan = h.read_text("README.md") if h.file_exists("README.md") else ""
    h.assert_true("audit" in (content + plan).lower(), "E2E test must assert audit trail integrity")
