#!/usr/bin/env python3
"""
PVH Automated E2E Test Runner CLI.
Independent, requirement-driven, opaque-box test runner across Tiers 1–4.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tests.e2e.harness import TestAssertionError, TestHarness, TestResult, registry

# Import all test suites to register test cases
import tests.e2e.tier1_feature_coverage
import tests.e2e.tier2_boundary_corner
import tests.e2e.tier3_cross_feature
import tests.e2e.tier4_commune_scenarios


def parse_args():
    parser = argparse.ArgumentParser(
        description="PVH Automated E2E Test Runner (Tiers 1–4)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--target",
        type=str,
        default="/Users/dovandat/teamwork_projects/pvh_demo",
        help="Target application directory (default: /Users/dovandat/teamwork_projects/pvh_demo)",
    )
    parser.add_argument(
        "--tier",
        type=str,
        default="all",
        choices=["1", "2", "3", "4", "all"],
        help="Filter execution by tier (1, 2, 3, 4, or all)",
    )
    parser.add_argument(
        "--feature",
        type=str,
        default="all",
        help="Filter execution by feature ID (1 to 28, or all)",
    )
    parser.add_argument(
        "--filter",
        type=str,
        default=None,
        help="Regex filter pattern matching test ID, title, or description",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in machine-readable JSON format",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Display verbose diagnostics and stack traces",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all registered test cases without running them",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Parse tier filter
    tier_filter = None
    if args.tier != "all":
        tier_filter = int(args.tier)

    # Parse feature filter
    feature_filter = None
    if args.feature != "all":
        try:
            feature_filter = int(args.feature)
        except ValueError:
            print(f"Error: Invalid feature ID '{args.feature}'. Must be integer 1–28.", file=sys.stderr)
            sys.exit(1)

    tests_to_run = registry.get_tests(
        tier=tier_filter,
        feature_id=feature_filter,
        filter_pattern=args.filter,
    )

    if args.list:
        if args.json:
            print(json.dumps([
                {
                    "test_id": t.test_id,
                    "tier": t.tier,
                    "feature_id": t.feature_id,
                    "name": t.name,
                    "description": t.description,
                    "source": t.source,
                }
                for t in tests_to_run
            ], indent=2))
        else:
            print(f"\nRegistered Test Cases ({len(tests_to_run)} total):")
            print("=" * 80)
            for t in tests_to_run:
                print(f"[{t.test_id}] Tier {t.tier} | F{t.feature_id:02d} | {t.name}")
                print(f"       Desc:   {t.description}")
                print(f"       Source: {t.source}")
            print("=" * 80)
        sys.exit(0)

    target_path = Path(args.target).resolve()
    harness = TestHarness(target_dir=target_path)

    if not args.json:
        print("\n" + "=" * 80)
        print(" PVH AUTOMATED E2E TEST RUNNER")
        print(f" Target:  {target_path}")
        print(f" Scope:   Tier: {args.tier} | Feature: {args.feature} | Filter: {args.filter or 'None'}")
        print(f" Selected: {len(tests_to_run)} test cases")
        print("=" * 80 + "\n")

    results = []
    start_time_all = time.time()

    for idx, test_case in enumerate(tests_to_run, start=1):
        t0 = time.time()
        try:
            test_case.test_fn(harness)
            duration = time.time() - t0
            res = TestResult(
                test_id=test_case.test_id,
                feature_id=test_case.feature_id,
                tier=test_case.tier,
                name=test_case.name,
                status="PASS",
                message="Requirement assertion passed",
                duration=duration,
            )
            if not args.json:
                print(f"  [PASS] {test_case.test_id} (F{test_case.feature_id:02d}) {test_case.name} ({duration:.3f}s)")
        except TestAssertionError as ae:
            duration = time.time() - t0
            res = TestResult(
                test_id=test_case.test_id,
                feature_id=test_case.feature_id,
                tier=test_case.tier,
                name=test_case.name,
                status="FAIL",
                message=str(ae),
                duration=duration,
                details=ae.details,
            )
            if not args.json:
                print(f"  [FAIL] {test_case.test_id} (F{test_case.feature_id:02d}) {test_case.name}")
                print(f"         Reason: {ae}")
        except FileNotFoundError as fnf:
            duration = time.time() - t0
            res = TestResult(
                test_id=test_case.test_id,
                feature_id=test_case.feature_id,
                tier=test_case.tier,
                name=test_case.name,
                status="FAIL",
                message=f"Missing file: {fnf}",
                duration=duration,
            )
            if not args.json:
                print(f"  [FAIL] {test_case.test_id} (F{test_case.feature_id:02d}) {test_case.name}")
                print(f"         Reason: Missing file: {fnf}")
        except Exception as e:
            duration = time.time() - t0
            res = TestResult(
                test_id=test_case.test_id,
                feature_id=test_case.feature_id,
                tier=test_case.tier,
                name=test_case.name,
                status="FAIL",
                message=f"Error: {e}",
                duration=duration,
            )
            if not args.json:
                print(f"  [FAIL] {test_case.test_id} (F{test_case.feature_id:02d}) {test_case.name}")
                print(f"         Exception: {e}")
                if args.verbose:
                    import traceback
                    traceback.print_exc()

        results.append(res)

    total_duration = time.time() - start_time_all
    passed_count = sum(1 for r in results if r.status == "PASS")
    failed_count = sum(1 for r in results if r.status == "FAIL")
    skipped_count = sum(1 for r in results if r.status == "SKIP")

    # Tier breakdown
    tier_stats = {}
    for r in results:
        t = r.tier
        if t not in tier_stats:
            tier_stats[t] = {"total": 0, "pass": 0, "fail": 0}
        tier_stats[t]["total"] += 1
        if r.status == "PASS":
            tier_stats[t]["pass"] += 1
        elif r.status == "FAIL":
            tier_stats[t]["fail"] += 1

    if args.json:
        report = {
            "target": str(target_path),
            "summary": {
                "total": len(results),
                "passed": passed_count,
                "failed": failed_count,
                "skipped": skipped_count,
                "duration_seconds": round(total_duration, 3),
                "overall_status": "PASS" if failed_count == 0 else "FAIL",
            },
            "tiers": tier_stats,
            "results": [
                {
                    "test_id": r.test_id,
                    "tier": r.tier,
                    "feature_id": r.feature_id,
                    "name": r.name,
                    "status": r.status,
                    "message": r.message,
                    "duration_seconds": round(r.duration, 4),
                    "details": r.details,
                }
                for r in results
            ],
        }
        print(json.dumps(report, indent=2))
    else:
        print("\n" + "=" * 80)
        print(" EXECUTION SUMMARY")
        print("=" * 80)
        for t in sorted(tier_stats.keys()):
            s = tier_stats[t]
            t_name = {
                1: "Tier 1 (Feature Coverage)",
                2: "Tier 2 (Boundary & Corner)",
                3: "Tier 3 (Cross-Feature)",
                4: "Tier 4 (Commune Scenarios)",
            }.get(t, f"Tier {t}")
            status_tag = "PASS" if s["fail"] == 0 else "FAIL"
            print(f" [{status_tag}] {t_name:30}: {s['pass']:3d}/{s['total']:3d} passed ({s['fail']:3d} failed)")

        print("-" * 80)
        overall_tag = "SUCCESS" if failed_count == 0 else "FAILURE"
        print(f" OVERALL STATUS: {overall_tag}")
        print(f" Total Tests:    {len(results)}")
        print(f" Passed:         {passed_count}")
        print(f" Failed:         {failed_count}")
        print(f" Duration:       {total_duration:.2f}s")
        print("=" * 80 + "\n")

    sys.exit(0 if failed_count == 0 else 1)


if __name__ == "__main__":
    main()
