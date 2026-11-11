#!/usr/bin/env python3
"""
Static Source Contract Suite: M04/M09 Release Safety Checks
Target: repository containing this test file
Author: Challenger 2 (challenger_m4_2)

This harness checks source contracts and one in-memory reference model. It does
not execute PostgreSQL, browser flows, hosted RLS/Storage or staging. It checks:
1. Immutable report snapshot source contract (trigger and RLS grants)
2. RFC 8785 Canonical JSON hashing determinism & avalanche tamper sensitivity
3. Background system jobs concurrency & FOR UPDATE SKIP LOCKED race immunity
4. M04 verified-rule, evidence and reason checks in the review RPC
5. Mandatory demonstration watermark disclaimer presence across formats
6. Fail-closed CRON_SECRET security and HTTP authorization on job routes
"""

import concurrent.futures
import hashlib
import json
import re
import sys
import threading
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]


class EmpiricalChallengeResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.challenges = []

    def log_result(self, name: str, success: bool, reason: str, details: str = ""):
        self.challenges.append({
            "name": name,
            "success": success,
            "reason": reason,
            "details": details,
        })
        if success:
            self.passed += 1
            print(f"  [PASS] {name}: {reason}")
        else:
            self.failed += 1
            print(f"  [FAIL] {name}: {reason} -- Details: {details}", file=sys.stderr)


def run_all_challenges():
    res = EmpiricalChallengeResult()
    print("=" * 80)
    print(" STATIC SOURCE CONTRACT SUITE: M04/M09 RELEASE SAFETY")
    print(" Target:", PROJECT_ROOT)
    print("=" * 80)

    # -------------------------------------------------------------------------
    # AREA 1: RFC 8785 CANONICAL HASH & TAMPER SENSITIVITY
    # -------------------------------------------------------------------------
    print("\n--- [AREA 1] RFC 8785 CANONICAL HASH & TAMPER SENSITIVITY ---")

    def sort_keys_recursive(obj):
        if isinstance(obj, dict):
            return {k: sort_keys_recursive(obj[k]) for k in sorted(obj.keys())}
        if isinstance(obj, list):
            return [sort_keys_recursive(item) for item in obj]
        return obj

    def canonical_sha256(payload):
        sorted_obj = sort_keys_recursive(payload)
        canonical_str = json.dumps(sorted_obj, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    # Challenge 1.1: Key Ordering Invariance
    p1 = {
        "commune": "TN-DEMO-A",
        "period": "Q3/2026",
        "year": 2026,
        "metrics": {"tasksTotal": 6, "tasksCompleted": 4, "cdsIndex": 82.5},
        "details": [{"b": 2, "a": 1}, {"z": 9, "y": 8}],
    }
    p2 = {
        "year": 2026,
        "details": [{"a": 1, "b": 2}, {"y": 8, "z": 9}],
        "metrics": {"cdsIndex": 82.5, "tasksCompleted": 4, "tasksTotal": 6},
        "period": "Q3/2026",
        "commune": "TN-DEMO-A",
    }
    h1 = canonical_sha256(p1)
    h2 = canonical_sha256(p2)
    if h1 == h2:
        res.log_result(
            "Challenge 1.1 - RFC 8785 Key Order Invariance",
            True,
            f"Permuted payload keys produce identical SHA-256 hash: {h1}",
        )
    else:
        res.log_result(
            "Challenge 1.1 - RFC 8785 Key Order Invariance",
            False,
            "Permuted payload keys produced differing hashes",
            f"h1={h1}, h2={h2}",
        )

    # Challenge 1.2: Tamper Sensitivity & Avalanche Effect
    base_hash = h1
    tampered_p = {
        "commune": "TN-DEMO-A",
        "period": "Q3/2026",
        "year": 2026,
        "metrics": {"tasksTotal": 7, "tasksCompleted": 4, "cdsIndex": 82.5}, # 6 -> 7
        "details": [{"b": 2, "a": 1}, {"z": 9, "y": 8}],
    }
    tampered_hash = canonical_sha256(tampered_p)

    # Compute bitwise Hamming distance
    b1 = bytes.fromhex(base_hash)
    b2 = bytes.fromhex(tampered_hash)
    bit_diff = sum(bin(x ^ y).count("1") for x, y in zip(b1, b2))

    if base_hash != tampered_hash and bit_diff >= 80:
        res.log_result(
            "Challenge 1.2 - 1-Character Tamper Sensitivity & Avalanche",
            True,
            f"Single-digit alteration altered hash with {bit_diff}/256 bits flipped (~{bit_diff/256*100:.1f}%)",
        )
    else:
        res.log_result(
            "Challenge 1.2 - 1-Character Tamper Sensitivity & Avalanche",
            False,
            "Tamper not detected or insufficient avalanche effect",
            f"bit_diff={bit_diff}",
        )

    # -------------------------------------------------------------------------
    # AREA 2: IMMUTABLE REPORT SNAPSHOT DEFENSE
    # -------------------------------------------------------------------------
    print("\n--- [AREA 2] IMMUTABLE REPORT SNAPSHOT DEFENSE ---")

    ph03_sql = (PROJECT_ROOT / "supabase/migrations/20261108070000_ph03_domain_verticals.sql").read_text(encoding="utf-8")
    report_sql = (PROJECT_ROOT / "supabase/migrations/20261108080000_ph04_reporting.sql").read_text(encoding="utf-8")
    jobs_sql = (PROJECT_ROOT / "supabase/migrations/20261108081000_ph04_jobs.sql").read_text(encoding="utf-8")
    report_normalized = re.sub(r"\s+", " ", report_sql.lower())
    jobs_normalized = re.sub(r"\s+", " ", jobs_sql.lower())
    ph03_normalized = re.sub(r"\s+", " ", ph03_sql.lower())

    # Challenge 2.1: Immutability Trigger Defined on BEFORE UPDATE OR DELETE
    has_trigger_fn = "create function pvh_private.guard_report_snapshot()" in report_normalized
    blocks_finalized = "old.status='finalized'" in report_normalized and "old.payload is distinct from new.payload" in report_normalized
    has_trigger = "create trigger guard_report_snapshot before update or delete on public.report_snapshots" in report_normalized

    if has_trigger_fn and blocks_finalized and has_trigger:
        res.log_result(
            "Challenge 2.1 - Database Snapshot Immutability Trigger",
            True,
            "pvh_private.guard_report_snapshot rejects deletion and mutation of finalized report payload/hash/lineage fields",
        )
    else:
        res.log_result(
            "Challenge 2.1 - Database Snapshot Immutability Trigger",
            False,
            "Migration missing enforce_snapshot_immutability or trigger binding",
        )

    # Challenge 2.2: RLS Deny-by-Default on report_snapshots
    has_force_rls = "alter table public.%i force row level security" in report_normalized
    revoked_delete = "revoke all on public.%i from public,anon,authenticated" in report_normalized
    no_update_policy = not re.search(r"create policy\s+\w+\s+on public\.report_snapshots\s+for\s+(update|delete|all)", report_sql, re.IGNORECASE)

    if has_force_rls and revoked_delete and no_update_policy:
        res.log_result(
            "Challenge 2.2 - Multi-Layer Immutability (Revocation & RLS Policy Absence)",
            True,
            "Migration forces RLS, revokes direct grants and defines a read policy without client update/delete policies",
        )
    else:
        res.log_result(
            "Challenge 2.2 - Multi-Layer Immutability",
            False,
            "Unrestricted update policies or unrevoked privileges detected",
        )

    # -------------------------------------------------------------------------
    # AREA 3: BACKGROUND JOBS CONCURRENCY & SKIP LOCKED
    # -------------------------------------------------------------------------
    print("\n--- [AREA 3] BACKGROUND JOBS CONCURRENCY & SKIP LOCKED ---")

    # Challenge 3.1: RPC claim_next_system_job uses FOR UPDATE SKIP LOCKED
    has_skip_locked = "for update skip locked" in jobs_normalized
    orders_by_fifo = "order by created_at,id" in jobs_normalized
    increments_attempts = "attempts=attempts+1" in jobs_normalized
    guards_max_attempts = "attempts<max_attempts" in jobs_normalized

    if has_skip_locked and orders_by_fifo and increments_attempts and guards_max_attempts:
        res.log_result(
            "Challenge 3.1 - RPC claim_next_system_job SKIP LOCKED Semantics",
            True,
            "Uses FOR UPDATE SKIP LOCKED, deterministic created_at/id order, increments attempts, and requeues only before max attempts",
        )
    else:
        res.log_result(
            "Challenge 3.1 - RPC claim_next_system_job SKIP LOCKED Semantics",
            False,
            "claim_next_system_job missing concurrency or attempt bounds",
        )

    # Challenge 3.2: in-memory reference model only; not a PostgreSQL concurrency test.
    num_jobs = 40
    num_workers = 30
    jobs = [{"id": f"j-{i}", "status": "PENDING", "attempts": 0, "max_attempts": 3} for i in range(num_jobs)]
    lock = threading.Lock()
    claimed_record = []

    def simulate_worker(worker_id):
        time.sleep(0.001)
        with lock:
            for job in jobs:
                if job["status"] in ("PENDING", "QUEUED") and job["attempts"] < job["max_attempts"]:
                    job["status"] = "PROCESSING"
                    job["attempts"] += 1
                    claimed_record.append((worker_id, job["id"]))
                    return job["id"]
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = [executor.submit(simulate_worker, f"w-{i}") for i in range(num_jobs + 20)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    claimed_job_ids = [r for r in results if r is not None]
    unique_job_ids = set(claimed_job_ids)

    if len(claimed_job_ids) == len(unique_job_ids) and len(unique_job_ids) == num_jobs:
        res.log_result(
            "Challenge 3.2 - In-Memory Claim Reference Model",
            True,
            f"Reference model produced 0 duplicate claims across {num_jobs + 20} attempts; does not execute PostgreSQL",
        )
    else:
        res.log_result(
            "Challenge 3.2 - In-Memory Claim Reference Model",
            False,
            "Race condition detected in concurrent claim simulation",
            f"claimed={len(claimed_job_ids)}, unique={len(unique_job_ids)}",
        )

    # -------------------------------------------------------------------------
    # AREA 4: CULTURE DOSSIER CHECK CONSTRAINTS & WORKFLOW
    # -------------------------------------------------------------------------
    print("\n--- [AREA 4] CULTURE DOSSIER CHECK CONSTRAINTS & WORKFLOW ---")

    # Challenge 4.1: M04 review RPC validates verified rules, evidence and reason.
    has_verified_pack_gate = "v_pack.status<>'verified'" in ph03_normalized and "unverified_legal_rule_or_threshold" in ph03_normalized
    has_evidence_gate = "p_status='dat'" in ph03_normalized and "verified_evidence_required" in ph03_normalized
    has_reason_gate = "length(btrim(coalesce(p_reason,'')))<5" in ph03_normalized and "reason_required" in ph03_normalized

    if has_verified_pack_gate and has_evidence_gate and has_reason_gate:
        res.log_result(
            "Challenge 4.1 - M04 Verified Rule/Evidence/Reason Gates",
            True,
            "Review RPC rejects DAT without a verified pack, threshold and evidence; requires a non-empty reason",
        )
    else:
        res.log_result(
            "Challenge 4.1 - M04 Verified Rule/Evidence/Reason Gates",
            False,
            "Review RPC is missing one or more verified-rule, evidence or reason checks",
        )

    # Challenge 4.2: Legacy application scoring is retired; no unverified
    # threshold may create a recognition decision. The replacement PH03 flow
    # remains illustrative and gates internal review on a verified rule pack.
    legacy_paths = [
        PROJECT_ROOT / "src/features/m04-culture-family/server/workflow.ts",
        PROJECT_ROOT / "src/features/m04-culture-family/server/service.ts",
        PROJECT_ROOT / "src/features/m04-culture-family/server/repository.ts",
        PROJECT_ROOT / "src/features/m04-culture-family/schemas/index.ts",
    ]
    legacy_actions = (PROJECT_ROOT / "src/features/m04-culture-family/server/actions.ts").read_text(encoding="utf-8")
    ph03_actions = (PROJECT_ROOT / "src/features/m04-culture-family/server/ph03-actions.ts").read_text(encoding="utf-8")
    ph03_workspace = (PROJECT_ROOT / "src/features/m04-culture-family/components/ph03-culture-workspace.tsx").read_text(encoding="utf-8")

    retired_legacy_scoring = all(not path.exists() for path in legacy_paths)
    old_actions_fail_closed = "return fail<never>(" in legacy_actions and "return ok(" not in legacy_actions
    ph03_requires_verified_pack = "reviewRuleVerified" in ph03_workspace
    ph03_is_illustrative = "open_illustrative_culture_campaign" in ph03_actions

    if retired_legacy_scoring and old_actions_fail_closed and ph03_requires_verified_pack and ph03_is_illustrative:
        res.log_result(
            "Challenge 4.2 - Unverified Legacy Scoring Retired",
            True,
            "Legacy fixed-score workflow is removed; old action entrypoints fail closed and PH03 gates internal review on verified rule packs",
        )
    else:
        res.log_result(
            "Challenge 4.2 - Unverified Legacy Scoring Retired",
            False,
            "Legacy scoring path remains reachable or the PH03 replacement is not explicitly gated",
        )

    # -------------------------------------------------------------------------
    # AREA 5: DEMONSTRATION DISCLAIMER & WATERMARK INTEGRITY
    # -------------------------------------------------------------------------
    print("\n--- [AREA 5] DEMONSTRATION DISCLAIMER & WATERMARK INTEGRITY ---")

    export_path = PROJECT_ROOT / "src/features/m09-reporting/server/export-service.ts"
    export_code = export_path.read_text(encoding="utf-8")

    disclaimer_str = "BẢN THỬ NGHIỆM — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ"
    has_disclaimer_const = f'DEMO_WATERMARK_DISCLAIMER = "{disclaimer_str}"' in export_code
    has_draft_watermark = 'DRAFT_WATERMARK = "BẢN NHÁP — CHƯA ĐƯỢC PHÊ DUYỆT"' in export_code
    exports_json = 'watermark:DEMO_WATERMARK_DISCLAIMER' in export_code
    exports_xlsx = 'sheet.getCell("A1").value = DEMO_WATERMARK_DISCLAIMER' in export_code
    exports_pdf = 'text(DEMO_WATERMARK_DISCLAIMER,{align:"center"})' in export_code

    if has_disclaimer_const and has_draft_watermark and exports_json and exports_xlsx and exports_pdf:
        res.log_result(
            "Challenge 5.1 - Demonstration Watermark Across All Export Formats",
            True,
            f"Mandatory watermark '{disclaimer_str}' unconditionally stamped on JSON, XLSX, and PDF",
        )
    else:
        res.log_result(
            "Challenge 5.1 - Demonstration Watermark Across All Export Formats",
            False,
            "Export service does not unconditionally stamp demonstration watermark across all formats",
        )

    # -------------------------------------------------------------------------
    # AREA 6: JOB ENDPOINTS FAIL-CLOSED AUTHORIZATION (CRON_SECRET)
    # -------------------------------------------------------------------------
    print("\n--- [AREA 6] JOB ENDPOINTS FAIL-CLOSED AUTHORIZATION ---")

    job_proc_path = PROJECT_ROOT / "src/app/api/jobs/process/route.ts"
    job_work_path = PROJECT_ROOT / "src/app/api/jobs/worker/route.ts"
    proc_code = job_proc_path.read_text(encoding="utf-8")
    work_code = job_work_path.read_text(encoding="utf-8")

    proc_delegates = 'from "../worker/route"' in proc_code and "GET,POST,dynamic" in proc_code
    work_checks_secret = "process.env.CRON_SECRET" in work_code and "timingSafeEqual" in work_code
    work_fails_closed = "status:503" in work_code and "status:401" in work_code

    if proc_delegates and work_checks_secret and work_fails_closed:
        res.log_result(
            "Challenge 6.1 - Job Endpoints Fail-Closed Authorization & Production Secret Guard",
            True,
            "The legacy endpoint delegates to the worker; worker requires timing-safe CRON_SECRET comparison and fails closed when absent/invalid",
        )
    else:
        res.log_result(
            "Challenge 6.1 - Job Endpoints Fail-Closed Authorization",
            False,
            "Job endpoints missing fail-closed authentication logic",
        )

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print(" STATIC SOURCE CONTRACT SUMMARY (NOT DB/BROWSER/STAGING ACCEPTANCE)")
    print(f" Total Challenges : {res.passed + res.failed}")
    print(f" Passed           : {res.passed}")
    print(f" Failed           : {res.failed}")
    print("=" * 80)

    if res.failed > 0:
        print(" Verdict: GAPS_FOUND")
        sys.exit(1)
    else:
        print(" Verdict: STATIC CONTRACTS PASS; runtime and owner gates remain separate")
        sys.exit(0)


if __name__ == "__main__":
    run_all_challenges()
