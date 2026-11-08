# TEST READY: Official E2E Test Suite & Automated Harness Publication

| Attribute | Specification |
|---|---|
| **Author** | `e2e_test_writer_1` (Parallel E2E Testing Track) |
| **Parent Agent** | `pvh_suborch_e2e_track` (`af0bfa5d-e471-4265-b1d7-2fb27f2b3d18`) |
| **Status** | **TEST READY** (100% of 28 Features Covered across all 4 Tiers) |
| **Target Application** | `/Users/dovandat/teamwork_projects/pvh_demo` |
| **Total Test Cases** | **322 Automated Assertions** |
| **Harness Location** | `tests/e2e/runner.py` and `tests/e2e/harness.py` |
| **Infrastructure Spec** | `TEST_INFRA.md` |

---

## 1. Executive Summary

The automated requirement-driven, opaque-box E2E test suite has been established, verified, and published. It is ready for continuous gating across all project implementation milestones (Sprint 0 through Sprint 3, and the Final Milestone Phase 1 & 2).

### 1.1. Tier Distribution Summary
| Tier | Description | Target Scope | Test Count | Pass/Fail Semantics |
|:---:|---|---|:---:|---|
| **Tier 1** | **Feature Coverage** | Features 1–28 (≥5 per feature) | **140** | Happy-path execution, schema validity, layer contracts, baseline existence. |
| **Tier 2** | **Boundary & Corner Cases** | Features 1–28 (≥5 per feature) | **140** | Negative tests, invalid inputs, tenant spoofing, optimistic locking (`409 VERSION_CONFLICT`), idempotency duplicate defense. |
| **Tier 3** | **Cross-Feature Interactions** | Features 1–28 (Pairwise combinations) | **28** | Multi-feature integration: Auth × RequestContext, RLS × Composite FKs, State Machine × Audit, Storage × Dossiers, Snapshots × Watermarks. |
| **Tier 4** | **Real-World Commune Scenarios** | Full System (Commune workflows) | **14** | End-to-end multi-role operational flows: Work delegation & review, annual cultural assessment, immutable snapshot locking, async jobs. |
| **Total** | | **All 28 Features** | **322** | **Comprehensive Automated Verification** |

---

## 2. Test Execution Command Reference

The test runner CLI is located at `tests/e2e/runner.py` and runs with standard Python 3.

### 2.1. Basic Commands
```bash
# 1. Run entire test suite (all 322 test cases) against target application
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py

# 2. Run specific Tier
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 1
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 2
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 3
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 4

# 3. Run all tests for a specific feature (Features 1 through 28)
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --feature 5
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --feature 13
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --feature 19

# 4. Filter by test ID pattern or keyword
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --filter "T1.01"
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --filter "VERSION_CONFLICT"
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --filter "audit"

# 5. Machine-readable JSON output for CI pipeline
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --json

# 6. Verbose mode with stack traces
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --verbose

# 7. List all 322 registered test cases
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --list
```

### 2.2. Exit Code Semantics
- `0`: All executed test cases **PASSED**.
- `1`: One or more test cases **FAILED** or encountered execution errors.

---

## 3. Feature-to-Test Mapping Matrix (All 28 Features)

| Feature # | Feature Name | Tier 1 (Happy Path) | Tier 2 (Boundaries) | Tier 3 (Cross-Feature) | Tier 4 (Commune Flow) | Total Tests |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| **F01** | Git Repo Init & Tagging | `T1.01.1`–`T1.01.5` (5) | `T2.01.1`–`T2.01.5` (5) | — | — | **10** |
| **F02** | Toolchain & Next.js Hardening | `T1.02.1`–`T1.02.5` (5) | `T2.02.1`–`T2.02.5` (5) | `T3.25` | — | **11** |
| **F03** | Minimal CI Pipeline | `T1.03.1`–`T1.03.5` (5) | `T2.03.1`–`T2.03.5` (5) | — | — | **10** |
| **F04** | Supabase Local Environment | `T1.04.1`–`T1.04.5` (5) | `T2.04.1`–`T2.04.5` (5) | `T3.26` | — | **11** |
| **F05** | Simulated Tenant Model Migration | `T1.05.1`–`T1.05.5` (5) | `T2.05.1`–`T2.05.5` (5) | `T3.05` | — | **11** |
| **F06** | Strangler Isolation (14 pages) | `T1.06.1`–`T1.06.5` (5) | `T2.06.1`–`T2.06.5` (5) | `T3.27` | `T4.14` | **12** |
| **F07** | ADR-002 Implementation Conventions | `T1.07.1`–`T1.07.5` (5) | `T2.07.1`–`T2.07.5` (5) | `T3.28` | — | **11** |
| **F08** | Supabase Auth & Session Refresh | `T1.08.1`–`T1.08.5` (5) | `T2.08.1`–`T2.08.5` (5) | `T3.01`, `T3.02` | — | **12** |
| **F09** | Server RequestContext & Membership | `T1.09.1`–`T1.09.5` (5) | `T2.09.1`–`T2.09.5` (5) | `T3.03`–`T3.05`, `T3.12` | `T4.12` | **15** |
| **F10** | Composite DB Schema Foundation | `T1.10.1`–`T1.10.5` (5) | `T2.10.1`–`T2.10.5` (5) | `T3.06`, `T3.07` | `T4.04` | **13** |
| **F11** | Deny-by-Default RLS Enforcement | `T1.11.1`–`T1.11.5` (5) | `T2.11.1`–`T2.11.5` (5) | `T3.02`, `T3.06`, `T3.08`, `T3.26` | `T4.02` | **15** |
| **F12** | Append-only Audit Log | `T1.12.1`–`T1.12.5` (5) | `T2.12.1`–`T2.12.5` (5) | `T3.08`, `T3.09` | `T4.13` | **13** |
| **F13** | Walking Skeleton Feature m01-core-work | `T1.13.1`–`T1.13.5` (5) | `T2.13.1`–`T2.13.5` (5) | `T3.04`, `T3.10` | — | **12** |
| **F14** | Entitlement-aware Navigation Registry | `T1.14.1`–`T1.14.5` (5) | `T2.14.1`–`T2.14.5` (5) | `T3.03`, `T3.27` | — | **12** |
| **F15** | Private Storage Signed URLs | `T1.15.1`–`T1.15.5` (5) | `T2.15.1`–`T2.15.5` (5) | `T3.11`, `T3.12` | — | **12** |
| **F16** | CI Architectural Fitness Functions | `T1.16.1`–`T1.16.5` (5) | `T2.16.1`–`T2.16.5` (5) | `T3.10`, `T3.25` | — | **12** |
| **F17** | DB Reset & Persona Seeding Script | `T1.17.1`–`T1.17.5` (5) | `T2.17.1`–`T2.17.5` (5) | `T3.13`, `T3.14` | — | **12** |
| **F18** | M01 Full Work Item Schema & pgTAP | `T1.18.1`–`T1.18.5` (5) | `T2.18.1`–`T2.18.5` (5) | `T3.07`, `T3.13`, `T3.15` | — | **13** |
| **F19** | M01 Atomic State Machine RPC | `T1.19.1`–`T1.19.5` (5) | `T2.19.1`–`T2.19.5` (5) | `T3.09`, `T3.15`, `T3.16`, `T3.18` | `T4.01`, `T4.03` | **16** |
| **F20** | M01 LEGO UI Implementation | `T1.20.1`–`T1.20.5` (5) | `T2.20.1`–`T2.20.5` (5) | `T3.16`, `T3.17` | — | **12** |
| **F21** | Decommission Legacy Work Pages | `T1.21.1`–`T1.21.5` (5) | `T2.21.1`–`T2.21.5` (5) | `T3.17` | — | **11** |
| **F22** | M01 Playwright Multi-role E2E Test | `T1.22.1`–`T1.22.5` (5) | `T2.22.1`–`T2.22.5` (5) | `T3.18` | — | **11** |
| **F23** | Versioned Culture Rule Packs (DEM-VH) | `T1.23.1`–`T1.23.5` (5) | `T2.23.1`–`T2.23.5` (5) | `T3.14`, `T3.19` | `T4.05`, `T4.07` | **14** |
| **F24** | Culture Dossier & Evidence Storage | `T1.24.1`–`T1.24.5` (5) | `T2.24.1`–`T2.24.5` (5) | `T3.11`, `T3.19`, `T3.20`, `T3.21` | `T4.06` | **15** |
| **F25** | Decommission Legacy Culture Module | `T1.25.1`–`T1.25.5` (5) | `T2.25.1`–`T2.25.5` (5) | `T3.20` | — | **11** |
| **F26** | Immutable Report Snapshot (DEM-R01) | `T1.26.1`–`T1.26.5` (5) | `T2.26.1`–`T2.26.5` (5) | `T3.21`, `T3.22`, `T3.23` | `T4.08`, `T4.09` | **15** |
| **F27** | Export Watermark & Demonstration Stamp | `T1.27.1`–`T1.27.5` (5) | `T2.27.1`–`T2.27.5` (5) | `T3.22`, `T3.24` | `T4.10` | **13** |
| **F28** | Asynchronous System Jobs Engine | `T1.28.1`–`T1.28.5` (5) | `T2.28.1`–`T2.28.5` (5) | `T3.23`, `T3.24` | `T4.11` | **13** |
| **Total** | | **140 tests** | **140 tests** | **28 tests** | **14 scenarios** | **322 tests** |

---

## 4. Milestone Gating Criteria

### Gate G0 (Sprint 0: Toolchain & Conventions)
- **Target Features**: Features 1–7.
- **Verification Command**:
  ```bash
  python3 tests/e2e/runner.py --filter "T[12]\.0[1-7]"
  ```
- **Passing Threshold**: 70/70 test cases pass exit code 0.

### Gate G1 (Sprint 1: ARCH-READY Walking Skeleton)
- **Target Features**: Features 8–17 (and prerequisite F01–F07).
- **Verification Command**:
  ```bash
  python3 tests/e2e/runner.py --filter "T[12]\.(0[89]|1[0-7])"
  ```
- **Passing Threshold**: 100/100 test cases pass exit code 0.

### Gate G2 (Sprint 2: Slice 1 M01 Core Work)
- **Target Features**: Features 18–22.
- **Verification Command**:
  ```bash
  python3 tests/e2e/runner.py --filter "T[12]\.(1[89]|2[0-2])"
  ```
- **Passing Threshold**: 50/50 test cases pass exit code 0.

### Gate G3 (Sprint 3: Slice 2 DEM-VH & DEM-R01)
- **Target Features**: Features 23–28.
- **Verification Command**:
  ```bash
  python3 tests/e2e/runner.py --filter "T[12]\.(2[3-8])"
  ```
- **Passing Threshold**: 60/60 test cases pass exit code 0.

### Final Milestone Phase 1 & 2 (Gating 100% Pass)
- **Target**: All 322 test cases across Tiers 1, 2, 3, and 4.
- **Verification Command**:
  ```bash
  python3 tests/e2e/runner.py
  ```
- **Passing Threshold**: 322/322 test cases pass exit code 0.
