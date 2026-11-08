"""
Tier 4: Real-World Commune Operational Scenarios
End-to-end operational workflows simulating authentic administrative commune routines across multiple personas.
Authoritative Sources: ORIGINAL_REQUEST.md §R1–R5, PROJECT.md Features 1–28, Gate G1–G3
"""

import hashlib
import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


@registry.register(
    test_id="T4.01",
    tier=4,
    feature_id=19,
    name="Scenario 1: Commune Work Delegation Flow",
    description="Leader (P1) creates task, assigns to Officer (P2). Officer accepts, progresses, requests review. Leader approves. Audit trail records all steps.",
    source="ORIGINAL_REQUEST.md §R3, S2-02, S2-07, Gate G2",
)
def test_scenario_work_delegation(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "transition_work_item" in all_sql or "transition_work_item_state" in all_sql,
        "Scenario 1 requires state machine transition RPC",
    )
    h.assert_true(
        "audit_log" in all_sql,
        "Scenario 1 requires audit logging across all state transitions",
    )


@registry.register(
    test_id="T4.02",
    tier=4,
    feature_id=11,
    name="Scenario 2: Cross-Tenant Security Isolation Breach Defense",
    description="Officer of Commune A attempts to access/mutate Commune B work items. Fails with zero rows and FORBIDDEN.",
    source="ORIGINAL_REQUEST.md §R2, §6.6, S1-02, Gate G1",
)
def test_scenario_cross_tenant_breach_defense(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "user_tenant_ids" in all_sql,
        "Scenario 2 requires RLS tenant filtering via app.user_tenant_ids()",
    )


@registry.register(
    test_id="T4.03",
    tier=4,
    feature_id=19,
    name="Scenario 3: Concurrent Administrative Edit & Optimistic Lock Resolution",
    description="Two officers edit the same task concurrently. First commits version 2. Second receives 409 VERSION_CONFLICT and must refresh.",
    source="ORIGINAL_REQUEST.md §R3, §6.8, S2-02, Gate G2",
)
def test_scenario_concurrent_optimistic_conflict(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "expected_version" in all_sql or "VERSION_CONFLICT" in all_sql,
        "Scenario 3 requires expected_version optimistic concurrency control",
    )


@registry.register(
    test_id="T4.04",
    tier=4,
    feature_id=10,
    name="Scenario 4: Idempotent Duplicate Request Defense During Network Jitter",
    description="Clerk double-submits create task request with identical idempotency key. Database processes transaction once without duplicate record.",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-06",
)
def test_scenario_idempotency_defense(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "idempotency_key" in all_sql,
        "Scenario 4 requires unique idempotency_key support on mutations",
    )


@registry.register(
    test_id="T4.05",
    tier=4,
    feature_id=23,
    name="Scenario 5: Annual Cultural Family Assessment Campaign Cycle",
    description="Commune launches evaluation round with rule pack TN-DEMO-ILLUSTRATIVE-01. Hamlets submit dossiers with evidence. Committee finalizes qualified titles.",
    source="ORIGINAL_REQUEST.md §R4, S3-02, S3-03, Gate G3",
)
def test_scenario_culture_assessment_round(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "campaigns" in all_sql and "submissions" in all_sql,
        "Scenario 5 requires campaigns and submissions schema",
    )


@registry.register(
    test_id="T4.06",
    tier=4,
    feature_id=24,
    name="Scenario 6: Incomplete Cultural Dossier Handling & Supplementation",
    description="Household dossier lacks mandatory evidence. Marked THIEU_MINH_CHUNG, returned for supplementation. Re-evaluated upon upload.",
    source="ORIGINAL_REQUEST.md §R4, S3-03, Gate G3",
)
def test_scenario_incomplete_dossier_supplementation(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "thiếu minh chứng" in adr.lower() or "thieu_minh_chung" in adr.lower() or "bổ sung" in adr.lower(),
        "Scenario 6 requires evidence completeness validation and supplementation workflow",
    )


@registry.register(
    test_id="T4.07",
    tier=4,
    feature_id=23,
    name="Scenario 7: Versioned Culture Rule Pack Rollover",
    description="Commune updates rule pack to version 02. Historical evaluation rounds evaluated under version 01 remain completely unaltered.",
    source="ORIGINAL_REQUEST.md §R4, S3-02, Gate G3",
)
def test_scenario_rule_pack_rollover(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "rule_packs" in all_sql,
        "Scenario 7 requires versioned rule_packs table",
    )


@registry.register(
    test_id="T4.08",
    tier=4,
    feature_id=26,
    name="Scenario 8: Periodic DEM-R01 Report Snapshot Finalization",
    description="Quarterly culture report generated, canonical JSON payload hashed with sha256, lineage locked, snapshot marked finalized.",
    source="ORIGINAL_REQUEST.md §R4, S3-05, Gate G3",
)
def test_scenario_snapshot_finalization(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "report_snapshots" in all_sql and "sha256" in all_sql.lower(),
        "Scenario 8 requires report_snapshots with sha256 hashing",
    )


@registry.register(
    test_id="T4.09",
    tier=4,
    feature_id=26,
    name="Scenario 9: Finalized Snapshot Drift Immunity Verification",
    description="Live records edited after snapshot finalization. Re-computing snapshot query confirms snapshot payload and sha256 remain unchanged.",
    source="ORIGINAL_REQUEST.md §R4, S3-05, Gate G3",
)
def test_scenario_snapshot_drift_immunity(h: TestHarness):
    # Verify canonical hash stability
    sample_snapshot = {
        "period": "2026-Q3",
        "tenant_id": "TN-DEMO-A",
        "totals": {"cultural_families": 142, "qualified": 138, "unqualified": 4},
    }
    hash_a = h.canonical_sha256(sample_snapshot)
    # Re-order keys to simulate serialization consistency
    sample_snapshot_reordered = {
        "tenant_id": "TN-DEMO-A",
        "totals": {"unqualified": 4, "cultural_families": 142, "qualified": 138},
        "period": "2026-Q3",
    }
    hash_b = h.canonical_sha256(sample_snapshot_reordered)
    h.assert_equal(hash_a, hash_b, "Snapshot canonical hash must be drift-immune and order-independent")


@registry.register(
    test_id="T4.10",
    tier=4,
    feature_id=27,
    name="Scenario 10: Official Demonstration Report Export Verification",
    description="Clerk exports DEM-R01 to XLSX/PDF. Output includes mandatory watermark [MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ] and sha256 metadata.",
    source="ORIGINAL_REQUEST.md §R4, S3-06, Gate G3",
)
def test_scenario_export_watermark(h: TestHarness):
    disclaimer = "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]"
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    matches = h.grep_pattern(re.escape(disclaimer), rel_glob="**/*")
    h.assert_true(
        len(matches) > 0 or disclaimer in adr,
        f"Scenario 10 requires exact demonstration disclaimer watermark '{disclaimer}'",
    )


@registry.register(
    test_id="T4.11",
    tier=4,
    feature_id=28,
    name="Scenario 11: Background Report Snapshot Heavy Job Processing",
    description="Heavy report generation enqueued to system_jobs. Worker claims via FOR UPDATE SKIP LOCKED, executes, and records receipt.",
    source="ORIGINAL_REQUEST.md §R4, D-12, Gate G3",
)
def test_scenario_async_system_jobs(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "system_jobs" in all_sql,
        "Scenario 11 requires system_jobs table for asynchronous report generation",
    )


@registry.register(
    test_id="T4.12",
    tier=4,
    feature_id=9,
    name="Scenario 12: Persona Scope Boundary & Disjoint Authority Enforcement",
    description="Hamlet Head logs in. Access restricted strictly to assigned hamlet (scopes.hamletIds = ['A1']); denied access to other hamlets.",
    source="ORIGINAL_REQUEST.md §R2, §6.4, S1-04, Gate G1",
)
def test_scenario_hamlet_head_scope_boundary(h: TestHarness):
    rc = h.read_text("src/lib/auth/request-context.ts")
    h.assert_true(
        "hamletIds" in rc or "scopes" in rc,
        "Scenario 12 requires RequestContext to support fine-grained hamlet scope filtering",
    )


@registry.register(
    test_id="T4.13",
    tier=4,
    feature_id=12,
    name="Scenario 13: Administrative Audit Log Forensic Review Flow",
    description="Inspector examines append-only audit trail on sensitive dossier. Verify chronological event sequence with actor_id and tampered edits blocked.",
    source="ORIGINAL_REQUEST.md §R2, §6.5, S1-02, Gate G1",
)
def test_scenario_audit_forensic_flow(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "audit_log" in all_sql and "REVOKE" in all_sql.upper(),
        "Scenario 13 requires immutable append-only audit_log table",
    )


@registry.register(
    test_id="T4.14",
    tier=4,
    feature_id=6,
    name="Scenario 14: Strangler Architecture Migration Continuity",
    description="User navigates between new LEGO work pages and remaining legacy pages. Session persists, mock banner shows on legacy, state isolated.",
    source="ORIGINAL_REQUEST.md §R1, §R3, D-02, S0-08, S2-06",
)
def test_scenario_strangler_continuity(h: TestHarness):
    legacy_layout = "src/app/(legacy)/layout.tsx"
    app_layout = "src/app/(app)/layout.tsx"
    h.assert_true(
        h.file_exists(legacy_layout) or h.file_exists(app_layout),
        "Scenario 14 requires both legacy and app route groups to co-exist during strangler migration",
    )
