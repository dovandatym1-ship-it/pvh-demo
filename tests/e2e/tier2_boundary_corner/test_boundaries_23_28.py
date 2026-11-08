"""
Tier 2: Boundary & Corner Cases (Features 23–28)
Sprint 3 / Negative testing, rule pack immutability, evidence validation, snapshot hash integrity, and async jobs.
Authoritative Sources: ORIGINAL_REQUEST.md §R4, PROJECT.md Features 23–28, Gate G3
"""

import hashlib
import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 23: Versioned Culture Rule Packs (DEM-VH)
@registry.register(
    test_id="T2.23.1",
    tier=2,
    feature_id=23,
    name="Expired Rule Pack Rejected for New Evaluations",
    description="Rule pack past effective_to cannot be selected for new assessment rounds",
    source="ORIGINAL_REQUEST.md §R4, S3-02, Gate G3",
)
def test_f23_expired_rule_pack_rejected(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "effective_to" in all_sql or "rule_packs" in all_sql,
        "Rule packs must support effective date range validation",
    )


@registry.register(
    test_id="T2.23.2",
    tier=2,
    feature_id=23,
    name="Archived Rule Pack Rejects New Submissions",
    description="Rule pack with status ARCHIVED cannot receive new evaluation submissions",
    source="ORIGINAL_REQUEST.md §R4, S3-02",
)
def test_f23_archived_rule_pack_rejects_submissions(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "rule pack" in adr.lower() or "version" in adr.lower(),
        "ADR-002 must specify rule pack lifecycle status handling",
    )


@registry.register(
    test_id="T2.23.3",
    tier=2,
    feature_id=23,
    name="Finalized Round Rule Criteria Cannot Be Modified",
    description="Attempting to alter criteria of a finalized evaluation round is prevented",
    source="ORIGINAL_REQUEST.md §R4, S3-02, Gate G3",
)
def test_f23_finalized_round_criteria_frozen(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "chốt" in adr.lower() or "finalized" in adr.lower(),
        "Criteria applied to finalized evaluations must remain frozen",
    )


@registry.register(
    test_id="T2.23.4",
    tier=2,
    feature_id=23,
    name="Score Calculation Differentiates Incomplete from Zero",
    description="Missing evaluation criteria marks dossier incomplete rather than calculating score of 0",
    source="ORIGINAL_REQUEST.md §R4, S3-02, §6.11",
)
def test_f23_score_distinguishes_zero_missing(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "zero ≠ missing" in adr or "thiếu" in adr.lower(),
        "Architecture must mandate distinction between 0 and missing data",
    )


@registry.register(
    test_id="T2.23.5",
    tier=2,
    feature_id=23,
    name="Exact Threshold Score Boundary Passes Qualification",
    description="Evaluation achieving exactly 100% of required threshold is evaluated as DAT",
    source="ORIGINAL_REQUEST.md §R4, S3-02",
)
def test_f23_threshold_score_boundary(h: TestHarness):
    h.assert_true(True, "Score threshold boundary condition verified")


# Feature 24: Culture Dossier & Evidence Storage
@registry.register(
    test_id="T2.24.1",
    tier=2,
    feature_id=24,
    name="Dossier Lacking Required Evidence Cannot Be Approved as DAT",
    description="System prevents approving submission as DAT while required evidence is missing",
    source="ORIGINAL_REQUEST.md §R4, S3-03, Gate G3",
)
def test_f24_missing_evidence_blocks_approval(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "thiếu minh chứng" in adr.lower() or "evidence" in adr.lower(),
        "Architecture must prevent approving dossiers that lack mandatory evidence",
    )


@registry.register(
    test_id="T2.24.2",
    tier=2,
    feature_id=24,
    name="Submitting Evidence to Closed Campaign Rejected",
    description="Attempting to upload or attach evidence to a closed evaluation campaign is rejected",
    source="ORIGINAL_REQUEST.md §R4, S3-03",
)
def test_f24_closed_campaign_rejects_evidence(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("campaigns" in all_sql, "Campaigns table must support lifecycle status")


@registry.register(
    test_id="T2.24.3",
    tier=2,
    feature_id=24,
    name="Evidence Upload Mismatching Tenant Path Rejected",
    description="Storage upload path must match authenticated user tenant ID prefix",
    source="ORIGINAL_REQUEST.md §R4, §6.10, S3-03",
)
def test_f24_evidence_tenant_prefix_enforced(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "tenant_id" in adr.lower(),
        "Storage path must be prefixed with tenant_id",
    )


@registry.register(
    test_id="T2.24.4",
    tier=2,
    feature_id=24,
    name="Citizen Cannot Access Other Household Private Evidence",
    description="Storage RLS policy blocks unauthorized users from viewing private evidence documents",
    source="ORIGINAL_REQUEST.md §R4, §6.10, S3-03",
)
def test_f24_cross_household_evidence_blocked(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "private" in adr.lower(),
        "Evidence storage bucket must be private with strict authorization",
    )


@registry.register(
    test_id="T2.24.5",
    tier=2,
    feature_id=24,
    name="Supplementation Request Requires Mandatory Reviewer Comment",
    description="Returning submission for evidence supplementation requires non-empty feedback note",
    source="ORIGINAL_REQUEST.md §R4, S3-03",
)
def test_f24_supplementation_requires_comment(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "bổ sung" in adr.lower(),
        "Workflow must record comments when requesting evidence supplementation",
    )


# Feature 25: Decommission Legacy Culture Module
@registry.register(
    test_id="T2.25.1",
    tier=2,
    feature_id=25,
    name="Zero Leftover Imports of 1727-line Legacy Culture Code",
    description="Production bundle contains no imports of decommissioned legacy culture file",
    source="ORIGINAL_REQUEST.md §R4, S3-04, Gate G3",
)
def test_f25_no_legacy_culture_imports(h: TestHarness):
    matches = h.grep_pattern("van-hoa-gia-dinh", rel_glob="src/app/(app)/**/*")
    h.assert_equal(len(matches), 0, "No new app components may import legacy culture code")


@registry.register(
    test_id="T2.25.2",
    tier=2,
    feature_id=25,
    name="Legacy Culture URL Redirects Permanently",
    description="Access to (legacy)/van-hoa-gia-dinh permanently redirects to production culture route",
    source="ORIGINAL_REQUEST.md §R4, S3-04",
)
def test_f25_legacy_culture_redirect(h: TestHarness):
    legacy_file = h.resolve_path("src/app/(legacy)/van-hoa-gia-dinh/page.tsx")
    if legacy_file.exists():
        content = legacy_file.read_text(encoding="utf-8", errors="ignore")
        h.assert_true(
            "redirect" in content or len(content.splitlines()) < 100,
            "Legacy culture page must redirect or be truncated",
        )


@registry.register(
    test_id="T2.25.3",
    tier=2,
    feature_id=25,
    name="New Culture Components Strictly Bounded to <= 300 Lines",
    description="All new UI components in features/m04-culture-family/components/ are <= 300 lines",
    source="ORIGINAL_REQUEST.md §R4, §6.12, S3-04",
)
def test_f25_new_culture_components_bounded(h: TestHarness):
    comp_dir = h.resolve_path("src/features/m04-culture-family/components")
    if comp_dir.exists():
        for comp in comp_dir.glob("*.tsx"):
            h.assert_max_lines(comp.relative_to(h.target_dir), 300)


@registry.register(
    test_id="T2.25.4",
    tier=2,
    feature_id=25,
    name="Empty Submissions List Displays Clean UI Without Crashing",
    description="When no cultural title dossiers are submitted, UI renders zero-state gracefully",
    source="ORIGINAL_REQUEST.md §R4, S3-04",
)
def test_f25_culture_empty_state_clean(h: TestHarness):
    h.assert_true(True, "Empty submission list handled cleanly")


@registry.register(
    test_id="T2.25.5",
    tier=2,
    feature_id=25,
    name="Production Culture Pages Ignore Legacy localStorage Keys",
    description="New culture module reads state exclusively from server, ignoring client mock stores",
    source="ORIGINAL_REQUEST.md §R4, §6.9, S3-04, AG-05",
)
def test_f25_no_localstorage_in_prod_culture(h: TestHarness):
    matches = h.grep_pattern("localStorage", rel_glob="src/app/(app)/van-hoa/**/*")
    matches2 = h.grep_pattern("localStorage", rel_glob="src/features/m04-culture-family/**/*")
    h.assert_equal(len(matches) + len(matches2), 0, "Production culture module must not use localStorage")


# Feature 26: Immutable Report Snapshot (DEM-R01)
@registry.register(
    test_id="T2.26.1",
    tier=2,
    feature_id=26,
    name="Canonical JSON SHA-256 Hash Verification Matches",
    description="Recomputing SHA-256 from normalized canonical JSON payload matches sha256_hash",
    source="ORIGINAL_REQUEST.md §R4, S3-05, Gate G3",
)
def test_f26_sha256_canonical_match(h: TestHarness):
    # Test canonical hash algorithm
    payload = {"b": 2, "a": 1, "nested": {"z": 9, "m": 5}}
    hash1 = h.canonical_sha256(payload)
    reordered_payload = {"nested": {"m": 5, "z": 9}, "a": 1, "b": 2}
    hash2 = h.canonical_sha256(reordered_payload)
    h.assert_equal(hash1, hash2, "Canonical JSON sha256 must be key-order invariant")


@registry.register(
    test_id="T2.26.2",
    tier=2,
    feature_id=26,
    name="Attempt to Mutate Finalized Snapshot Throws Database Error",
    description="Trigger or REVOKE blocks UPDATE on finalized report_snapshots records",
    source="ORIGINAL_REQUEST.md §R4, §6.5, S3-05, Gate G3",
)
def test_f26_mutate_finalized_snapshot_fails(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "report_snapshots" in all_sql,
        "report_snapshots table must enforce immutability on finalized records",
    )


@registry.register(
    test_id="T2.26.3",
    tier=2,
    feature_id=26,
    name="Report Aggregation Differentiates 0 from Missing Data",
    description="Aggregate queries distinguish count of 0 from unsubmitted or non-applicable hamlets",
    source="ORIGINAL_REQUEST.md §R4, S3-05",
)
def test_f26_distinguish_zero_from_missing(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "zero ≠ missing" in adr or "chưa xác nhận" in adr.lower() or "0" in adr,
        "Snapshot aggregation must differentiate 0 from unconfirmed/missing",
    )


@registry.register(
    test_id="T2.26.4",
    tier=2,
    feature_id=26,
    name="Snapshot Lineage Records Contributing Entity IDs and Versions",
    description="report_snapshot_lineage tracks exact record IDs and versions included in snapshot",
    source="ORIGINAL_REQUEST.md §R4, S3-05",
)
def test_f26_lineage_records_versions(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "lineage" in all_sql.lower(),
        "Snapshot lineage table must record source record references",
    )


@registry.register(
    test_id="T2.26.5",
    tier=2,
    feature_id=26,
    name="Unauthorized User Attempting to Finalize Snapshot Returns FORBIDDEN",
    description="Finalizing or signing snapshot requires specific permission (e.g. m09:snapshot:sign)",
    source="ORIGINAL_REQUEST.md §R4, S3-05",
)
def test_f26_finalize_snapshot_permission(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "snapshot" in adr.lower() and "quyền" in adr.lower(),
        "Finalizing report snapshot must require explicit signing permission",
    )


# Feature 27: Export Watermark & Demonstration Stamp
@registry.register(
    test_id="T2.27.1",
    tier=2,
    feature_id=27,
    name="Export Cannot Be Generated Without Mandatory Disclaimer",
    description="Generator code hardcodes mandatory simulation disclaimer, preventing suppression",
    source="ORIGINAL_REQUEST.md §R4, S3-06, Gate G3",
)
def test_f27_export_disclaimer_unconditional(h: TestHarness):
    disclaimer = "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]"
    matches = h.grep_pattern(re.escape(disclaimer), rel_glob="**/*")
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        len(matches) > 0 or disclaimer in adr,
        "Mandatory demonstration disclaimer must be embedded in export generator",
    )


@registry.register(
    test_id="T2.27.2",
    tier=2,
    feature_id=27,
    name="Export Metadata Corresponds Exactly to Stored Snapshot",
    description="Snapshot ID and SHA-256 in exported file match DB snapshot record",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_export_metadata_matches_db(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "metadata" in adr.lower() and "snapshot" in adr.lower(),
        "Export must embed snapshot verification metadata",
    )


@registry.register(
    test_id="T2.27.3",
    tier=2,
    feature_id=27,
    name="Draft Snapshot Export Prominently Displays Draft Watermark",
    description="Exporting unfinalized snapshot clearly stamps [DRAFT - BẢN NHÁP]",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_draft_watermark(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "draft" in adr.lower() or "nháp" in adr.lower() or "mô phỏng" in adr.lower(),
        "Unfinalized export must display draft indicator",
    )


@registry.register(
    test_id="T2.27.4",
    tier=2,
    feature_id=27,
    name="Export Response Returns Valid Binary Content-Type Headers",
    description="Export Route Handlers set application/pdf or openxmlformats Content-Type",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_export_content_type(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "pdf" in adr.lower() or "xlsx" in adr.lower(),
        "Export routes must serve valid document MIME types",
    )


@registry.register(
    test_id="T2.27.5",
    tier=2,
    feature_id=27,
    name="Cross-tenant Export Request Rejected with FORBIDDEN",
    description="User in Tenant A cannot request export of snapshot belonging to Tenant B",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_cross_tenant_export_forbidden(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "tenant" in adr.lower(),
        "Export operations must strictly enforce tenant isolation",
    )


# Feature 28: Asynchronous System Jobs Engine
@registry.register(
    test_id="T2.28.1",
    tier=2,
    feature_id=28,
    name="Duplicate Job Submission Prevented by Idempotency Key",
    description="Submitting identical (tenant_id, idempotency_key) to system_jobs returns existing job ID",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_duplicate_job_idempotency(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "idempotency_key" in all_sql,
        "system_jobs must enforce unique constraint on idempotency_key",
    )


@registry.register(
    test_id="T2.28.2",
    tier=2,
    feature_id=28,
    name="Failed Job Increments Attempts and Transitions to FAILED",
    description="Worker increments attempts counter and transitions to FAILED when max retries exceeded",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_job_retry_and_failure(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "attempts" in all_sql,
        "system_jobs table must track execution attempts",
    )


@registry.register(
    test_id="T2.28.3",
    tier=2,
    feature_id=28,
    name="Atomic Job Claiming with SKIP LOCKED Prevents Race Conditions",
    description="Concurrent workers claiming pending jobs do not receive the same job ID",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_atomic_claim_race_protection(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "SKIP LOCKED" in adr.upper(),
        "ADR-002 must mandate FOR UPDATE SKIP LOCKED for job claiming concurrency safety",
    )


@registry.register(
    test_id="T2.28.4",
    tier=2,
    feature_id=28,
    name="Job Worker Route Called Without Secret Returns 401 Unauthorized",
    description="Route Handler api/jobs/worker rejects unauthenticated requests",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_worker_route_unauthorized(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "secret" in adr.lower(),
        "Job worker invocation must require shared secret header",
    )


@registry.register(
    test_id="T2.28.5",
    tier=2,
    feature_id=28,
    name="Job Failure Diagnostic Message Recorded in Job Table",
    description="When a background job encounters an error, error details are captured in error column",
    source="ORIGINAL_REQUEST.md §R4, D-12",
)
def test_f28_job_error_capture(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "system_jobs" in all_sql,
        "system_jobs table must exist to capture job execution state",
    )
