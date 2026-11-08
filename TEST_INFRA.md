# PVH E2E Test Infrastructure Specification (Next.js + Supabase)

| Attribute | Specification |
|---|---|
| **Document ID** | PVH-TEST-INFRA-001 |
| **Version / Date** | 1.0 / 2026-11-08 |
| **Integrity Mode** | Development & Production Verification |
| **Target Application** | `/Users/dovandat/teamwork_projects/pvh_demo` |
| **Test Track** | Parallel E2E Testing Track (Independent & Requirement-Driven) |
| **Authoritative Sources** | `ORIGINAL_REQUEST.md`, `PROJECT.md`, `ADR-001`, `ADR-002`, `PVH_KE_HOACH_KHOI_DONG_TRIEN_KHAI_v1.0.md` |

---

## 1. Test Philosophy & Strategy

The E2E Test Track operates strictly on an **opaque-box, requirement-driven testing paradigm**. The test suite treats the application as an integrated system adhering to documented interface contracts and business requirements, independent of internal ephemeral implementations.

### 1.1. Core Methodologies
1. **Category-Partitioning**: System inputs, user roles, commune tenancies, and workflow states are partitioned into equivalence classes (e.g., valid commune `TN-DEMO-A` vs `TN-DEMO-B` vs unauthorized external tenant; authorized officer vs unassigned worker vs commune leader).
2. **Boundary Value Analysis (BVA)**: Extreme lengths, empty payloads, version conflict collisions (`expected_version` mismatch), and zero vs null vs missing evidence values are verified at state transitions.
3. **Pairwise Combinatorial Testing**: Cross-cutting features (e.g., Auth × RLS × State Machine × Audit Logging × Storage) are systematically combined to test interface contracts.
4. **Real-World Operational Workloads**: End-to-end multi-role workflows reflect authentic commune administrative operations (work item lifecycle, annual cultural title review rounds, immutable report snapshot generation).

### 1.2. Independence & Isolation
- Tests are self-contained and idempotent.
- Tests do not rely on fragile external mock services; test assertions evaluate verified state machines, database constraints, HTTP/RPC contracts, and file system integrity.
- Zero reliance on client-side mock storage (`localStorage` / `demo-state.ts`); all operational assertions verify server actions, database RPCs, RLS policies, and immutable audit trails.

---

## 2. Directory Layout & Organization

The test infrastructure is located within the target application repository under `tests/e2e/`:

```
/Users/dovandat/teamwork_projects/pvh_demo/
├── TEST_INFRA.md                     # Test infrastructure specification & manual
├── TEST_READY.md                     # Published readiness report & feature checklist
└── tests/
    └── e2e/
        ├── __init__.py               # Python package initialization
        ├── harness.py                # Core test harness: assertions, file/git/AST/RLS helpers
        ├── runner.py                 # Automated test runner CLI & execution engine
        ├── tier1_feature_coverage/   # Tier 1: Feature Coverage in isolation
        │   ├── __init__.py
        │   ├── test_features_01_07.py # Features 1–7 (Sprint 0 / Toolchain & Conventions)
        │   ├── test_features_08_17.py # Features 8–17 (Sprint 1 / Walking Skeleton & Auth/RLS)
        │   ├── test_features_18_22.py # Features 18–22 (Sprint 2 / M01 Core Work & LEGO UI)
        │   └── test_features_23_28.py # Features 23–28 (Sprint 3 / DEM-VH & DEM-R01)
        ├── tier2_boundary_corner/    # Tier 2: Boundary, corner & negative testing
        │   ├── __init__.py
        │   ├── test_boundaries_01_07.py
        │   ├── test_boundaries_08_17.py
        │   ├── test_boundaries_18_22.py
        │   └── test_boundaries_23_28.py
        ├── tier3_cross_feature/      # Tier 3: Pairwise cross-feature interactions
        │   ├── __init__.py
        │   └── test_cross_feature.py # 28 pairwise interaction test cases
        └── tier4_commune_scenarios/  # Tier 4: Real-world commune operational flows
            ├── __init__.py
            └── test_commune_scenarios.py # 14 end-to-end commune operational scenarios
```

---

## 3. 4-Tier Test Classification & Coverage

The test suite consists of **322 automated test cases** covering all 28 features in `PROJECT.md § Feature Inventory`:

| Tier | Name | Target Scope | Min Tests per Feature | Total Test Cases | Focus |
|:---:|---|---|:---:|:---:|---|
| **Tier 1** | **Feature Coverage** | Features 1–28 | ≥5 | **140** | Happy-path execution, baseline existence, structural conformity, contract fulfillment in isolation. |
| **Tier 2** | **Boundary & Corner Cases** | Features 1–28 | ≥5 | **140** | Invalid inputs, empty payloads, permission violations, cross-tenant spoofing, optimistic lock concurrency conflicts (`409 VERSION_CONFLICT`), idempotency duplicate defense. |
| **Tier 3** | **Cross-Feature Interactions** | Features 1–28 | Pairwise | **28** | Multi-feature integration: Auth × RequestContext, RLS × Composite FKs, State Machine × Audit Logging, Private Storage × Culture Dossiers, Snapshots × Exports. |
| **Tier 4** | **Real-World Commune Scenarios** | Full System | End-to-end | **14** | Multi-role administrative flows: Work delegation & review, annual cultural assessment, immutable report snapshot locking, async job worker processing, strangler page migration. |
| **Total** | | | | **322** | **100% Feature Inventory Coverage across all 4 Tiers** |

---

## 4. Test Runner CLI & Execution Interface

The test runner `tests/e2e/runner.py` is executable with standard Python 3.

### 4.1. Basic Execution Commands
```bash
# Run entire test suite across all 4 tiers against target application
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py

# Run specific Tier (1, 2, 3, or 4)
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 1
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 2
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 3
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --tier 4

# Run tests for a specific feature (1 to 28)
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --feature 13

# Filter by test ID pattern
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --filter "T1.13"

# Specify custom target directory
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --target /path/to/repo

# Output machine-readable JSON for CI integration
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --json

# Verbose output mode
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --verbose

# List all registered test cases without execution
python3 /Users/dovandat/teamwork_projects/pvh_demo/tests/e2e/runner.py --list
```

### 4.2. Exit Code Semantics
- `0`: All executed test cases **PASSED**.
- `1`: One or more test cases **FAILED** or encountered execution errors.

---

## 5. Input/Output Contracts & Authoritative Oracles

### 5.1. RequestContext Contract (`src/lib/auth/request-context.ts`)
```typescript
export interface RequestContext {
  userId: string;
  tenantId: string; // Must match TN-DEMO-A or TN-DEMO-B
  membershipId: string;
  roles: string[]; // ["LANH_DAO_XA", "CAN_BO_MOT_CUA", etc.]
  permissions: string[]; // ["m01:work_item:create", "m01:work_item:assign", etc.]
  scopes: {
    hamletIds?: string[];
    sectorIds?: string[];
  };
}
```

### 5.2. Standard Result Envelope (`src/lib/types/result.ts`)
```typescript
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "VERSION_CONFLICT"
  | "DUPLICATE_REQUEST"
  | "INVALID_TRANSITION"
  | "INTERNAL";

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorDetails };
```

### 5.3. Milestone Gating Semantics
The runner serves as the automated gatekeeper for each project milestone:
- **Gate G0 (Sprint 0)**: Features 1–7 pass in Tier 1 and Tier 2.
- **Gate G1 (Sprint 1)**: Features 8–17 pass in Tier 1 and Tier 2; walking skeleton verified.
- **Gate G2 (Sprint 2)**: Features 18–22 pass in Tier 1 and Tier 2; M01 multi-role workflow verified.
- **Gate G3 (Sprint 3)**: Features 23–28 pass in Tier 1 and Tier 2; DEM-VH and DEM-R01 verified.
- **Gate M4 (Final Milestone)**: 100% of Tiers 1, 2, 3, and 4 pass exit 0.
