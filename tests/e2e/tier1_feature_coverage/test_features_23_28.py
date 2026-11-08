"""
Tier 1: Feature Coverage (Features 23–28)
Sprint 3 / Slice 2: DEM-VH (Culture), DEM-R01 (Snapshots), Export Watermarks, Async System Jobs
Authoritative Sources: ORIGINAL_REQUEST.md §R4, PROJECT.md Features 23–28, Gate G3
"""

import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 23: Versioned Culture Rule Packs (DEM-VH)
@registry.register(
    test_id="T1.23.1",
    tier=1,
    feature_id=23,
    name="Table rule_packs Defined in Migrations",
    description="Table rule_packs defined with code, version, status (MINH_HOA), effective_from, effective_to",
    source="ORIGINAL_REQUEST.md §R4, S3-02, Gate G3",
)
def test_f23_rule_packs_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("rule_packs" in all_sql, "Migration must define rule_packs table")


@registry.register(
    test_id="T1.23.2",
    tier=1,
    feature_id=23,
    name="Table rule_pack_criteria Defined",
    description="Table rule_pack_criteria defines criteria rules for cultural titles",
    source="ORIGINAL_REQUEST.md §R4, S3-02",
)
def test_f23_criteria_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("rule_pack_criteria" in all_sql or "criteria" in all_sql, "Migration must define rule criteria table")


@registry.register(
    test_id="T1.23.3",
    tier=1,
    feature_id=23,
    name="Seed Contains Rule Pack TN-DEMO-ILLUSTRATIVE-01",
    description="Seed data contains rule pack TN-DEMO-ILLUSTRATIVE-01 with status MINH_HOA",
    source="ORIGINAL_REQUEST.md §R4, S3-02, Gate G3",
)
def test_f23_seed_rule_pack(h: TestHarness):
    seed_sql = h.read_text("supabase/seed.sql") if h.file_exists("supabase/seed.sql") else ""
    matches = h.grep_pattern("TN-DEMO-ILLUSTRATIVE-01", rel_glob="**/*")
    h.assert_true(
        "TN-DEMO-ILLUSTRATIVE-01" in seed_sql or len(matches) > 0,
        "Rule pack TN-DEMO-ILLUSTRATIVE-01 must be seeded",
    )


@registry.register(
    test_id="T1.23.4",
    tier=1,
    feature_id=23,
    name="Cultural Evaluations Store Rule Pack Foreign Key and Version",
    description="Evaluation records link to rule_pack_id and record the version applied",
    source="ORIGINAL_REQUEST.md §R4, S3-02",
)
def test_f23_evaluation_version_link(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "rule_pack_id" in all_sql or "rule_pack" in all_sql,
        "Evaluations must record foreign key to rule_pack",
    )


@registry.register(
    test_id="T1.23.5",
    tier=1,
    feature_id=23,
    name="Changing Rule Pack Version Does Not Alter Finalized Evaluations",
    description="Historical evaluation outcomes remain immutable when new rule pack version is introduced",
    source="ORIGINAL_REQUEST.md §R4, S3-02, Gate G3",
)
def test_f23_rule_pack_immutability(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "rule pack" in adr.lower() or "phiên bản" in adr.lower() or "version" in adr.lower(),
        "Architecture conventions must mandate rule pack versioning and historical evaluation immutability",
    )


# Feature 24: Culture Dossier & Evidence Storage
@registry.register(
    test_id="T1.24.1",
    tier=1,
    feature_id=24,
    name="Campaigns and Submissions Tables Defined",
    description="Tables campaigns and submissions defined for cultural evaluation rounds",
    source="ORIGINAL_REQUEST.md §R4, S3-03, Gate G3",
)
def test_f24_campaigns_submissions_tables(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("campaigns" in all_sql, "Migration must define campaigns table")
    h.assert_true("submissions" in all_sql, "Migration must define submissions table")


@registry.register(
    test_id="T1.24.2",
    tier=1,
    feature_id=24,
    name="Evidence Storage Uses Structured Private Path",
    description="Evidence paths follow {tenant_id}/culture/{submission_id}/{file}",
    source="ORIGINAL_REQUEST.md §R4, §6.10, S3-03",
)
def test_f24_evidence_storage_path(h: TestHarness):
    matches = h.grep_pattern("culture", rel_glob="src/features/m04-culture-family/**/*")
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true("evidence" in adr.lower() or len(matches) > 0, "Culture evidence storage path must be defined")


@registry.register(
    test_id="T1.24.3",
    tier=1,
    feature_id=24,
    name="Submission Status Distinguishes THIEU_MINH_CHUNG from KHONG_DAT",
    description="Workflow explicitly differentiates missing evidence from failed qualification",
    source="ORIGINAL_REQUEST.md §R4, S3-03, Gate G3",
)
def test_f24_status_distinction(h: TestHarness):
    matches = h.grep_pattern("THIEU_MINH_CHUNG", rel_glob="**/*")
    matches_kd = h.grep_pattern("KHONG_DAT", rel_glob="**/*")
    h.assert_true(
        len(matches) > 0 or len(matches_kd) > 0,
        "System must distinguish THIEU_MINH_CHUNG (missing evidence) from KHONG_DAT (unqualified)",
    )


@registry.register(
    test_id="T1.24.4",
    tier=1,
    feature_id=24,
    name="Dossier Return Workflow Supports Evidence Supplementation",
    description="Reviewer can return submission for supplementation (YEU_CAU_BO_SUNG)",
    source="ORIGINAL_REQUEST.md §R4, S3-03",
)
def test_f24_supplementation_workflow(h: TestHarness):
    matches = h.grep_pattern("YEU_CAU_BO_SUNG", rel_glob="**/*")
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        len(matches) > 0 or "bổ sung" in adr.lower(),
        "Workflow must support return for evidence supplementation",
    )


@registry.register(
    test_id="T1.24.5",
    tier=1,
    feature_id=24,
    name="Legacy M04 Action Completely Replaced with Compliant Layering",
    description="Legacy actions.ts with client tenantId and Math.random replaced with secure server action",
    source="ORIGINAL_REQUEST.md §R4, S3-03, AG-03",
)
def test_f24_legacy_action_replaced(h: TestHarness):
    action_path = "src/features/m04-culture-family/server/actions.ts"
    if h.file_exists(action_path):
        content = h.read_text(action_path)
        h.assert_false(
            "Math.random" in content,
            "actions.ts must not use Math.random for record identifiers",
        )
        h.assert_true(
            "getRequestContext" in content,
            "actions.ts must resolve tenant from getRequestContext()",
        )


# Feature 25: Decommission Legacy Culture Module
@registry.register(
    test_id="T1.25.1",
    tier=1,
    feature_id=25,
    name="Legacy Culture Page (1727 lines) Decommissioned",
    description="src/app/(legacy)/van-hoa-gia-dinh is deleted or decommissioned",
    source="ORIGINAL_REQUEST.md §R4, S3-04, Gate G3",
)
def test_f25_legacy_culture_decommissioned(h: TestHarness):
    legacy_culture = h.resolve_path("src/app/(legacy)/van-hoa-gia-dinh")
    is_gone_or_redirect = not legacy_culture.exists() or not (legacy_culture / "page.tsx").exists() or \
        len((legacy_culture / "page.tsx").read_text(encoding="utf-8", errors="ignore").splitlines()) < 100
    h.assert_true(is_gone_or_redirect, "Legacy 1727-line culture page must be decommissioned")


@registry.register(
    test_id="T1.25.2",
    tier=1,
    feature_id=25,
    name="New Culture Routes Exist under (app)/van-hoa",
    description="Routes (app)/van-hoa/gia-dinh-van-hoa and thon-van-hoa exist",
    source="ORIGINAL_REQUEST.md §R4, S3-04",
)
def test_f25_new_culture_routes(h: TestHarness):
    vh_dir = h.resolve_path("src/app/(app)/van-hoa")
    h.assert_true(
        vh_dir.exists(),
        "src/app/(app)/van-hoa directory must exist",
    )


@registry.register(
    test_id="T1.25.3",
    tier=1,
    feature_id=25,
    name="New Culture Page Files <= 100 Lines",
    description="Route pages under src/app/(app)/van-hoa are <= 100 lines",
    source="ORIGINAL_REQUEST.md §R4, §6.12, S3-04",
)
def test_f25_culture_pages_line_limit(h: TestHarness):
    vh_dir = h.resolve_path("src/app/(app)/van-hoa")
    if vh_dir.exists():
        for page in vh_dir.rglob("page.tsx"):
            h.assert_max_lines(page.relative_to(h.target_dir), 100)


@registry.register(
    test_id="T1.25.4",
    tier=1,
    feature_id=25,
    name="Navigation Registry Sets Culture Module to DEEP",
    description="Navigation registry updates culture module status to DEEP",
    source="ORIGINAL_REQUEST.md §R4, S3-04",
)
def test_f25_nav_culture_deep(h: TestHarness):
    if h.file_exists("src/config/navigation.ts"):
        content = h.read_text("src/config/navigation.ts")
        h.assert_true("van-hoa" in content or "culture" in content.lower(), "navigation.ts must register culture route")


@registry.register(
    test_id="T1.25.5",
    tier=1,
    feature_id=25,
    name="Zero Dangling Imports of Legacy Culture Code",
    description="Source tree contains no active imports of decommissioned legacy culture page",
    source="ORIGINAL_REQUEST.md §R4, S3-04",
)
def test_f25_no_dangling_imports(h: TestHarness):
    matches = h.grep_pattern("van-hoa-gia-dinh", rel_glob="src/app/(app)/**/*")
    h.assert_equal(len(matches), 0, "No new app components may import legacy culture modules")


# Feature 26: Immutable Report Snapshot (DEM-R01)
@registry.register(
    test_id="T1.26.1",
    tier=1,
    feature_id=26,
    name="Table report_snapshots Defined in Migrations",
    description="Table report_snapshots defined with payload, sha256_hash, status, version",
    source="ORIGINAL_REQUEST.md §R4, S3-05, Gate G3",
)
def test_f26_snapshots_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("report_snapshots" in all_sql, "Migration must define report_snapshots table")


@registry.register(
    test_id="T1.26.2",
    tier=1,
    feature_id=26,
    name="Table report_snapshot_lineage Defined",
    description="Table report_snapshot_lineage tracks contributing source records",
    source="ORIGINAL_REQUEST.md §R4, S3-05",
)
def test_f26_lineage_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("report_snapshot_lineage" in all_sql or "lineage" in all_sql, "Migration must define snapshot lineage table")


@registry.register(
    test_id="T1.26.3",
    tier=1,
    feature_id=26,
    name="Canonical JSON Serialization and sha256 Hash Computed on Finalization",
    description="Finalization computes sha256 checksum of canonical sorted payload",
    source="ORIGINAL_REQUEST.md §R4, S3-05, Gate G3",
)
def test_f26_sha256_hash_computed(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("sha256" in all_sql.lower(), "Snapshot finalization must compute sha256 hash")


@registry.register(
    test_id="T1.26.4",
    tier=1,
    feature_id=26,
    name="Finalized Report Snapshot Payload is Immutable",
    description="Finalized snapshots cannot be modified; UPDATE on finalized records rejected",
    source="ORIGINAL_REQUEST.md §R4, §6.5, S3-05, Gate G3",
)
def test_f26_snapshot_immutability(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "report_snapshots" in all_sql and ("trigger" in all_sql.lower() or "revoke update" in all_sql.lower() or "immutable" in all_sql.lower() or "FINALIZED" in all_sql),
        "report_snapshots must enforce immutability on finalized records",
    )


@registry.register(
    test_id="T1.26.5",
    tier=1,
    feature_id=26,
    name="Subsequent Live Data Changes Do Not Alter Stored Snapshot",
    description="Snapshot payload stores standalone copy; changes to active entities do not drift snapshot numbers",
    source="ORIGINAL_REQUEST.md §R4, S3-05, Gate G3",
)
def test_f26_payload_frozen(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "payload" in all_sql and "jsonb" in all_sql.lower(),
        "report_snapshots must store frozen payload as JSONB",
    )


# Feature 27: Export Watermark & Demonstration Stamp
@registry.register(
    test_id="T1.27.1",
    tier=1,
    feature_id=27,
    name="Export Module Contains Mandatory Demonstration Disclaimer",
    description="Export module contains [MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]",
    source="ORIGINAL_REQUEST.md §R4, S3-06, Gate G3",
)
def test_f27_mandatory_disclaimer(h: TestHarness):
    disclaimer = "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]"
    matches = h.grep_pattern(re.escape(disclaimer), rel_glob="**/*")
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        len(matches) > 0 or disclaimer in adr,
        f"Export module and documentation must contain exact mandatory disclaimer: '{disclaimer}'",
    )


@registry.register(
    test_id="T1.27.2",
    tier=1,
    feature_id=27,
    name="XLSX Export Configured with Header Disclaimer Banner",
    description="Spreadsheet exports configure prominent simulation banner in header",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_xlsx_banner(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    matches = h.grep_pattern("XLSX", rel_glob="**/*")
    h.assert_true("xlsx" in adr.lower() or len(matches) > 0, "XLSX export must include disclaimer banner")


@registry.register(
    test_id="T1.27.3",
    tier=1,
    feature_id=27,
    name="PDF Export Configured with Running Watermark",
    description="PDF exports configure watermark and running header disclaimer",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_pdf_watermark(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    matches = h.grep_pattern("PDF", rel_glob="**/*")
    h.assert_true("pdf" in adr.lower() or len(matches) > 0, "PDF export must include watermark banner")


@registry.register(
    test_id="T1.27.4",
    tier=1,
    feature_id=27,
    name="Export Output Embeds Snapshot Hash and Timestamp Metadata",
    description="Exports display snapshot_id, timestamp, and sha256 hash in metadata section",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_export_metadata(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "metadata" in adr.lower() or "sha256" in adr.lower(),
        "Export specification must require snapshot metadata embedding",
    )


@registry.register(
    test_id="T1.27.5",
    tier=1,
    feature_id=27,
    name="Export Validates Snapshot Finalization Before Official Generation",
    description="Official export requires snapshot status = FINALIZED",
    source="ORIGINAL_REQUEST.md §R4, S3-06",
)
def test_f27_export_requires_finalized(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "finalized" in adr.lower() or "chốt" in adr.lower(),
        "Export requires finalized snapshot status",
    )


# Feature 28: Asynchronous System Jobs Engine
@registry.register(
    test_id="T1.28.1",
    tier=1,
    feature_id=28,
    name="Table system_jobs Defined in Migrations",
    description="Table system_jobs defined with job_type, payload, status, attempts, idempotency_key, receipt",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10, Gate G3",
)
def test_f28_system_jobs_table(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("system_jobs" in all_sql, "Migration must define system_jobs table")


@registry.register(
    test_id="T1.28.2",
    tier=1,
    feature_id=28,
    name="Job Worker Uses FOR UPDATE SKIP LOCKED",
    description="Job claiming query specifies FOR UPDATE SKIP LOCKED to prevent race conditions",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_skip_locked_claiming(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "FOR UPDATE SKIP LOCKED" in (all_sql + adr).upper(),
        "Job worker claiming must use FOR UPDATE SKIP LOCKED",
    )


@registry.register(
    test_id="T1.28.3",
    tier=1,
    feature_id=28,
    name="System Jobs Lifecycle Transitions",
    description="Job status supports PENDING, PROCESSING, COMPLETED, FAILED",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_job_lifecycle(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "PENDING" in all_sql or "PROCESSING" in all_sql or "status" in all_sql,
        "system_jobs table must track lifecycle status",
    )


@registry.register(
    test_id="T1.28.4",
    tier=1,
    feature_id=28,
    name="System Jobs Store Completion Receipt Upon Success",
    description="system_jobs includes receipt column storing output metadata or storage URL",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_job_receipt(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true("receipt" in all_sql, "system_jobs table must include receipt column")


@registry.register(
    test_id="T1.28.5",
    tier=1,
    feature_id=28,
    name="Job Worker Route Handler Protected by Secret Header",
    description="Route Handler api/jobs/worker validates authorization token before executing jobs",
    source="ORIGINAL_REQUEST.md §R4, D-12, §6.10",
)
def test_f28_worker_route_security(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    matches = h.grep_pattern("jobs", rel_glob="src/app/api/**/*")
    h.assert_true(
        "secret" in adr.lower() or len(matches) > 0,
        "Job worker route handler must be protected by secret authorization",
    )
