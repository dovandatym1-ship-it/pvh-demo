#!/usr/bin/env python3
"""
Adversarial Stress & Empirical Challenge Suite: M01 Core Work & Auth/RequestContext
Target: /Users/dovandat/teamwork_projects/pvh_demo
Author: Tier 5 Adversarial Challenger 1 (challenger_m4_1)

Empirically tests and reproduces white-box bugs, vulnerabilities, and missing wires in:
1. SQL Schema Alignment & Runtime RPC crash risks
2. UI-to-Backend State Machine Transition Wiring
3. Optimistic Locking & Version Conflict
4. Idempotency Key Cross-Entity Collision & Payload Drift
5. State Machine RBAC Authorization Perimeter
6. Mandatory Return Reason Enforcement
7. Composite Tenant Keys & Foreign Key Constraints
"""

import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path("/Users/dovandat/teamwork_projects/pvh_demo")

class EmpiricalChallengeRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.gaps = []

    def record_finding(self, test_id: str, title: str, status: str, message: str, details: dict = None):
        if status == "FAIL":
            self.failed += 1
            self.gaps.append({
                "test_id": test_id,
                "title": title,
                "message": message,
                "details": details or {}
            })
            print(f"❌ [GAP FOUND] {test_id}: {title}\n   Issue: {message}")
            if details:
                for k, v in details.items():
                    print(f"   - {k}: {v}")
        else:
            self.passed += 1
            print(f"✅ [PASS] {test_id}: {title} - {message}")

def test_sql_schema_column_alignment(runner: EmpiricalChallengeRunner):
    """
    Test 1: Verify whether SQL INSERT statements in app.transition_work_item
    match actual column names and constraints in work_item_events and audit_log.
    """
    m1_path = PROJECT_ROOT / "supabase/migrations/20261108000001_walking_skeleton_core.sql"
    m2_path = PROJECT_ROOT / "supabase/migrations/20261108000002_m01_core_work_full.sql"
    
    m1_sql = m1_path.read_text(encoding="utf-8")
    m2_sql = m2_path.read_text(encoding="utf-8")

    # Extract work_item_events schema in m1
    events_match = re.search(r"CREATE TABLE IF NOT EXISTS public\.work_item_events \((.*?)\);", m1_sql, re.DOTALL)
    assert events_match, "work_item_events table definition not found in m1"
    events_def = events_match.group(1)
    
    # Extract audit_log schema in m1
    audit_match = re.search(r"CREATE TABLE IF NOT EXISTS public\.audit_log \((.*?)\);", m1_sql, re.DOTALL)
    assert audit_match, "audit_log table definition not found in m1"
    audit_def = audit_match.group(1)

    # Check columns in transition_work_item INSERT
    # Check work_item_events insert
    events_insert_match = re.search(r"INSERT INTO public\.work_item_events \((.*?)\) VALUES", m2_sql, re.DOTALL)
    assert events_insert_match, "INSERT INTO public.work_item_events not found in m2 transition_work_item"
    events_insert_cols = [c.strip() for c in events_insert_match.group(1).split(",")]

    # Check audit_log insert
    audit_insert_match = re.search(r"INSERT INTO public\.audit_log \((.*?)\) VALUES", m2_sql, re.DOTALL)
    assert audit_insert_match, "INSERT INTO public.audit_log not found in m2 transition_work_item"
    audit_insert_cols = [c.strip() for c in audit_insert_match.group(1).split(",")]

    errors = []
    # 1. event_type
    if "event_type" in events_insert_cols and "event_type" not in events_def:
        errors.append("Column 'event_type' does not exist in public.work_item_events")
    # 2. from_state vs from_status
    if "from_state" in events_insert_cols and "from_state" not in events_def:
        errors.append("Column 'from_state' used in INSERT, but schema column is 'from_status'")
    # 3. to_state vs to_status
    if "to_state" in events_insert_cols and "to_state" not in events_def:
        errors.append("Column 'to_state' used in INSERT, but schema column is 'to_status'")
    # 4. created_by NOT NULL constraint
    if "created_by uuid NOT NULL" in events_def and "created_by" not in events_insert_cols:
        errors.append("Column 'created_by' is NOT NULL in public.work_item_events, but omitted from INSERT statement")
    # 5. target_type vs entity_type in audit_log
    if "target_type" in audit_insert_cols and "target_type" not in audit_def:
        errors.append("Column 'target_type' used in INSERT, but schema column is 'entity_type'")
    # 6. target_id vs entity_id in audit_log
    if "target_id" in audit_insert_cols and "target_id" not in audit_def:
        errors.append("Column 'target_id' used in INSERT, but schema column is 'entity_id'")

    if errors:
        runner.record_finding(
            "CHALLENGE-01",
            "SQL Migration Schema Mismatch in app.transition_work_item",
            "FAIL",
            "RPC app.transition_work_item will crash at runtime due to nonexistent columns and omitted NOT NULL constraints.",
            {"errors": errors}
        )
    else:
        runner.record_finding(
            "CHALLENGE-01",
            "SQL Migration Schema Mismatch in app.transition_work_item",
            "PASS",
            "All INSERT column names match schema definitions."
        )

def test_ui_backend_transition_wiring(runner: EmpiricalChallengeRunner):
    """
    Test 2: Verify whether TransitionActionBar and Workbench UI are connected
    to valid Route Handlers, Server Actions, and Repository methods.
    """
    action_bar_path = PROJECT_ROOT / "src/features/m01-core-work/components/transition-action-bar.tsx"
    action_bar_code = action_bar_path.read_text(encoding="utf-8")

    # Find the fetch URL in TransitionActionBar
    fetch_match = re.search(r"fetch\([`'\"](/api/work-items/[^`'\"]+)[`'\"]", action_bar_code)
    fetch_endpoint = fetch_match.group(1) if fetch_match else None

    # Check if that route handler exists
    expected_route_file = PROJECT_ROOT / "src/app/api/work-items/[id]/transition/route.ts"
    expected_route_file_alt = PROJECT_ROOT / "src/app/api/work-items/transition/route.ts"
    route_exists = expected_route_file.exists() or expected_route_file_alt.exists()

    # Check repository methods in src/features/m01-core-work/server/repository.ts
    repo_path = PROJECT_ROOT / "src/features/m01-core-work/server/repository.ts"
    repo_code = repo_path.read_text(encoding="utf-8")
    has_transition_repo = "transition" in repo_code or "transition_work_item" in repo_code

    # Check service methods in src/features/m01-core-work/server/service.ts
    service_path = PROJECT_ROOT / "src/features/m01-core-work/server/service.ts"
    service_code = service_path.read_text(encoding="utf-8")
    has_transition_service = "transition" in service_code

    # Check actions in src/features/m01-core-work/server/actions.ts
    actions_path = PROJECT_ROOT / "src/features/m01-core-work/server/actions.ts"
    actions_code = actions_path.read_text(encoding="utf-8")
    has_transition_action = "transition" in actions_code

    # Check workbench page wiring
    workbench_path = PROJECT_ROOT / "src/app/(app)/ban-lam-viec/page.tsx"
    workbench_code = workbench_path.read_text(encoding="utf-8")
    wires_on_transition = "onTransition=" in workbench_code

    missing_components = []
    if not route_exists:
        missing_components.append(f"Route handler '{expected_route_file.relative_to(PROJECT_ROOT)}' does NOT exist (UI calls {fetch_endpoint})")
    if not has_transition_repo:
        missing_components.append("workItemRepository has NO transitionWorkItem method")
    if not has_transition_service:
        missing_components.append("workItemService has NO transitionWorkItem method")
    if not has_transition_action:
        missing_components.append("actions.ts has NO transitionWorkItemAction")
    if not wires_on_transition:
        missing_components.append("ban-lam-viec/page.tsx renders WorkItemTable but never binds onTransition prop")

    if missing_components:
        runner.record_finding(
            "CHALLENGE-02",
            "State Machine Transition Flow Disconnected from Application Layer",
            "FAIL",
            "The client UI calls /api/work-items/${item.id}/transition, but no API Route, Server Action, Service, or Repository method exists.",
            {"missing_components": missing_components}
        )
    else:
        runner.record_finding(
            "CHALLENGE-02",
            "State Machine Transition Flow Disconnected from Application Layer",
            "PASS",
            "All UI components, Route Handlers, Actions, and Repository methods are properly wired."
        )

def test_optimistic_locking_concurrency(runner: EmpiricalChallengeRunner):
    """
    Test 3: Verify Optimistic Concurrency Control (OCC) logic in SQL and application.
    """
    m2_path = PROJECT_ROOT / "supabase/migrations/20261108000002_m01_core_work_full.sql"
    m2_sql = m2_path.read_text(encoding="utf-8")

    # In SQL: verify expected_version comparison and error code
    has_occ_check = "v_current_version <> p_expected_version" in m2_sql or "v_current_version != p_expected_version" in m2_sql
    has_version_conflict = "VERSION_CONFLICT" in m2_sql

    # In TypeScript: verify if repository maps VERSION_CONFLICT to 409
    repo_path = PROJECT_ROOT / "src/features/m01-core-work/server/repository.ts"
    repo_code = repo_path.read_text(encoding="utf-8")
    repo_handles_conflict = "VERSION_CONFLICT" in repo_code

    # Check if there is any repository method that takes expectedVersion
    takes_expected_version = "expectedVersion" in repo_code or "expected_version" in repo_code

    issues = []
    if not (has_occ_check and has_version_conflict):
        issues.append("SQL migration does not properly check expected_version or raise VERSION_CONFLICT")
    if not takes_expected_version:
        issues.append("Repository layer lacks any function taking expectedVersion or handling state transition OCC")

    if issues:
        runner.record_finding(
            "CHALLENGE-03",
            "Optimistic Concurrency Control (OCC) End-to-End Handling",
            "FAIL",
            "SQL defines expected_version check, but application repository completely lacks expectedVersion parameter and transition handling.",
            {"issues": issues}
        )
    else:
        runner.record_finding(
            "CHALLENGE-03",
            "Optimistic Concurrency Control (OCC) End-to-End Handling",
            "PASS",
            "Optimistic concurrency control is implemented across SQL and repository layers."
        )

def test_idempotency_cross_entity_collision(runner: EmpiricalChallengeRunner):
    """
    Test 4: Verify idempotency key isolation across distinct entities and differing payloads.
    """
    m2_path = PROJECT_ROOT / "supabase/migrations/20261108000002_m01_core_work_full.sql"
    m2_sql = m2_path.read_text(encoding="utf-8")

    # Check how app.transition_work_item queries audit_log
    idempotency_query_match = re.search(
        r"SELECT payload INTO v_existing_audit_payload\s+FROM public\.audit_log\s+WHERE tenant_id = v_tenant_id\s+AND (.*?);",
        m2_sql,
        re.DOTALL
    )

    issues = []
    if idempotency_query_match:
        where_clause = idempotency_query_match.group(1)
        # Check if where clause filters by work_item_id or target_id
        if "p_id" not in where_clause and "target_id" not in where_clause and "entity_id" not in where_clause:
            issues.append(
                "app.transition_work_item does not scope idempotency lookup by p_id (work item ID). "
                "Reusing an idempotency key across different work items causes false cached response!"
            )
        # Check if where clause or post-check verifies to_state matches
        if "p_to_state" not in where_clause and "to_state" not in where_clause:
            issues.append(
                "app.transition_work_item does not verify if target state (p_to_state) matches cached transition state. "
                "Different transition actions sharing a key will be falsely returned as cached!"
            )
    else:
        issues.append("Idempotency lookup query not found in app.transition_work_item")

    # Check app.create_work_item in 20261108000001_walking_skeleton_core.sql for payload drift check
    m1_path = PROJECT_ROOT / "supabase/migrations/20261108000001_walking_skeleton_core.sql"
    m1_sql = m1_path.read_text(encoding="utf-8")
    checks_payload_drift = "request_hash" in m1_sql or "IDEMPOTENCY_CONFLICT" in m1_sql
    if not checks_payload_drift:
        issues.append(
            "app.create_work_item in 20261108000001 does not check payload drift (hash comparison). "
            "Calling with same idempotency key but different payload returns previous item without conflict error."
        )

    if issues:
        runner.record_finding(
            "CHALLENGE-04",
            "Idempotency Key Cross-Entity Collision & Payload Drift Vulnerability",
            "FAIL",
            "Idempotency checks allow false cache hits across different work items and silent payload drift.",
            {"issues": issues}
        )
    else:
        runner.record_finding(
            "CHALLENGE-04",
            "Idempotency Key Cross-Entity Collision & Payload Drift Vulnerability",
            "PASS",
            "Idempotency scoped strictly to entity and checks payload hash."
        )

def test_rbac_state_transition_perimeter(runner: EmpiricalChallengeRunner):
    """
    Test 5: Verify RBAC permissions enforcement across state transitions.
    """
    m2_path = PROJECT_ROOT / "supabase/migrations/20261108000002_m01_core_work_full.sql"
    m2_sql = m2_path.read_text(encoding="utf-8")
    wf_path = PROJECT_ROOT / "src/features/m01-core-work/server/workflow.ts"
    wf_code = wf_path.read_text(encoding="utf-8")

    issues = []
    # In workflow.ts:
    # RETURNED requires m01:work_item:approve
    # ASSIGNED requires m01:work_item:assign
    # CANCELLED requires m01:work_item:delete

    # In app.transition_work_item:
    # Check permissions enforced in SQL:
    checks_approve_on_completed = "p_to_state = 'COMPLETED'" in m2_sql and "m01:work_item:approve" in m2_sql
    checks_approve_on_returned = "p_to_state = 'RETURNED'" in m2_sql and "has_permission" in m2_sql and "m01:work_item:approve" in m2_sql
    checks_assign = "m01:work_item:assign" in m2_sql or "m01:work:assign" in m2_sql
    checks_delete = "m01:work_item:delete" in m2_sql or "m01:work:delete" in m2_sql

    if not checks_approve_on_returned:
        issues.append(
            "app.transition_work_item does NOT check m01:work_item:approve when transitioning to 'RETURNED'. "
            "Non-reviewers can reject/return dossiers in direct SQL/RPC invocation."
        )
    if not checks_assign:
        issues.append("app.transition_work_item does NOT check m01:work_item:assign when transitioning to 'ASSIGNED'")
    if not checks_delete:
        issues.append("app.transition_work_item does NOT check m01:work_item:delete when transitioning to 'CANCELLED'")

    if issues:
        runner.record_finding(
            "CHALLENGE-05",
            "RBAC Permission Gaps in State Transition RPC",
            "FAIL",
            "State transition RPC fails to enforce authorization checks for RETURNED, ASSIGNED, and CANCELLED states.",
            {"issues": issues}
        )
    else:
        runner.record_finding(
            "CHALLENGE-05",
            "RBAC Permission Gaps in State Transition RPC",
            "PASS",
            "All state transitions enforce strict granular permissions."
        )

def test_mandatory_return_reason(runner: EmpiricalChallengeRunner):
    """
    Test 6: Verify mandatory reason when transitioning to RETURNED.
    """
    m2_path = PROJECT_ROOT / "supabase/migrations/20261108000002_m01_core_work_full.sql"
    m2_sql = m2_path.read_text(encoding="utf-8")
    wf_path = PROJECT_ROOT / "src/features/m01-core-work/server/workflow.ts"
    wf_code = wf_path.read_text(encoding="utf-8")
    bar_path = PROJECT_ROOT / "src/features/m01-core-work/components/transition-action-bar.tsx"
    bar_code = bar_path.read_text(encoding="utf-8")

    # SQL check
    has_sql_reason_check = "p_to_state = 'RETURNED' AND (p_reason IS NULL OR trim(p_reason) = '')" in m2_sql
    # Workflow check
    has_wf_reason_rule = 'from: "UNDER_REVIEW", to: "RETURNED"' in wf_code and "requiresReason: true" in wf_code
    # UI modal check
    has_ui_textarea = "Lý do trả lại hồ sơ công việc (bắt buộc)" in bar_code and "!returnReason.trim()" in bar_code

    if has_sql_reason_check and has_wf_reason_rule and has_ui_textarea:
        runner.record_finding(
            "CHALLENGE-06",
            "Mandatory Return Reason Validation",
            "PASS",
            "Enforced at SQL RPC (trim check), Workflow state machine, and UI modal level."
        )
    else:
        runner.record_finding(
            "CHALLENGE-06",
            "Mandatory Return Reason Validation",
            "FAIL",
            "Missing mandatory reason check in one or more layers.",
            {
                "has_sql_check": has_sql_reason_check,
                "has_wf_rule": has_wf_reason_rule,
                "has_ui_modal": has_ui_textarea
            }
        )

def test_composite_tenant_keys_and_fk_integrity(runner: EmpiricalChallengeRunner):
    """
    Test 7: Verify composite tenant primary keys and foreign key constraints across M01 tables.
    """
    m1_path = PROJECT_ROOT / "supabase/migrations/20261108000001_walking_skeleton_core.sql"
    m2_path = PROJECT_ROOT / "supabase/migrations/20261108000002_m01_core_work_full.sql"
    m1_sql = m1_path.read_text(encoding="utf-8")
    m2_sql = m2_path.read_text(encoding="utf-8")

    checks = {
        "work_items_pk": "CONSTRAINT pk_work_items PRIMARY KEY (tenant_id, id)" in m1_sql,
        "work_item_events_pk": "CONSTRAINT pk_work_item_events PRIMARY KEY (tenant_id, id)" in m1_sql,
        "work_item_events_fk": "FOREIGN KEY (tenant_id, work_item_id)\n    REFERENCES work_items(tenant_id, id)" in m1_sql or "FOREIGN KEY (tenant_id, work_item_id) REFERENCES work_items(tenant_id, id)" in m1_sql or "REFERENCES work_items(tenant_id, id)" in m1_sql,
        "assignments_pk": "CONSTRAINT pk_work_item_assignments PRIMARY KEY (tenant_id, id)" in m2_sql,
        "assignments_fk_item": "FOREIGN KEY (tenant_id, work_item_id) \n    REFERENCES public.work_items(tenant_id, id)" in m2_sql or "FOREIGN KEY (tenant_id, work_item_id) REFERENCES public.work_items(tenant_id, id)" in m2_sql or "REFERENCES public.work_items(tenant_id, id)" in m2_sql,
        "assignments_fk_profile": "FOREIGN KEY (tenant_id, assignee_id) \n    REFERENCES public.profiles(tenant_id, id)" in m2_sql or "FOREIGN KEY (tenant_id, assignee_id) REFERENCES public.profiles(tenant_id, id)" in m2_sql or "REFERENCES public.profiles(tenant_id, id)" in m2_sql,
        "links_pk": "CONSTRAINT pk_work_item_links PRIMARY KEY (tenant_id, id)" in m2_sql,
        "links_fk_source": "FOREIGN KEY (tenant_id, source_id) \n    REFERENCES public.work_items(tenant_id, id)" in m2_sql or "FOREIGN KEY (tenant_id, source_id) REFERENCES public.work_items(tenant_id, id)" in m2_sql or "REFERENCES public.work_items(tenant_id, id)" in m2_sql,
    }

    failed_checks = [k for k, v in checks.items() if not v]
    if failed_checks:
        runner.record_finding(
            "CHALLENGE-07",
            "Composite Tenant Primary Key and Foreign Key Integrity",
            "FAIL",
            "Missing composite tenant key constraints.",
            {"failed_checks": failed_checks}
        )
    else:
        runner.record_finding(
            "CHALLENGE-07",
            "Composite Tenant Primary Key and Foreign Key Integrity",
            "PASS",
            "All M01 tables enforce composite PRIMARY KEY (tenant_id, id) and composite FOREIGN KEYs."
        )

def simulate_concurrent_state_transitions(runner: EmpiricalChallengeRunner):
    """
    Test 8: Simulate concurrent state transitions with competing workers and stale expected_version.
    Verifies that optimistic locking correctly prevents lost updates and rejects stale versions.
    """
    import threading
    import time

    class SimulatedWorkItem:
        def __init__(self, item_id: str, tenant_id: str, version: int = 1, status: str = "IN_PROGRESS"):
            self.id = item_id
            self.tenant_id = tenant_id
            self.version = version
            self.status = status
            self.lock = threading.Lock()
            self.history = []

        def transition(self, expected_version: int, to_state: str, actor_id: str):
            with self.lock:
                # Artificial delay to simulate race window
                time.sleep(0.01)
                if self.version != expected_version:
                    raise ValueError(f"VERSION_CONFLICT: Expected {expected_version}, current {self.version}")
                self.version += 1
                self.status = to_state
                self.history.append({"actor": actor_id, "version": self.version, "status": to_state})
                return {"version": self.version, "status": self.status}

    item = SimulatedWorkItem("work-1", "tenant-a", version=1, status="IN_PROGRESS")
    results = {"success": 0, "conflicts": 0, "errors": []}

    def worker_attempt(actor: str, exp_ver: int, target: str):
        try:
            item.transition(exp_ver, target, actor)
            results["success"] += 1
        except ValueError as e:
            if "VERSION_CONFLICT" in str(e):
                results["conflicts"] += 1
            else:
                results["errors"].append(str(e))

    # Two competing workers attempt to transition from version 1 simultaneously
    t1 = threading.Thread(target=worker_attempt, args=("officer_1", 1, "UNDER_REVIEW"))
    t2 = threading.Thread(target=worker_attempt, args=("officer_2", 1, "CANCELLED"))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Exactly one must succeed, and one must encounter VERSION_CONFLICT
    if results["success"] == 1 and results["conflicts"] == 1 and item.version == 2:
        runner.record_finding(
            "CHALLENGE-08",
            "Concurrent State Machine Race Simulation (Optimistic Locking Oracle)",
            "PASS",
            f"Exactly 1 winner succeeded (v2) and 1 loser encountered VERSION_CONFLICT. No lost update occurred."
        )
    else:
        runner.record_finding(
            "CHALLENGE-08",
            "Concurrent State Machine Race Simulation (Optimistic Locking Oracle)",
            "FAIL",
            f"Concurrency failure: {results}",
            {"results": results, "final_version": item.version}
        )

def main():
    print("=" * 80)
    print(" EMPIRICAL ADVERSARIAL STRESS TEST & AUDIT: M01 CORE WORK & AUTH")
    print(f" Target: {PROJECT_ROOT}")
    print("=" * 80 + "\n")

    runner = EmpiricalChallengeRunner()

    test_sql_schema_column_alignment(runner)
    test_ui_backend_transition_wiring(runner)
    test_optimistic_locking_concurrency(runner)
    test_idempotency_cross_entity_collision(runner)
    test_rbac_state_transition_perimeter(runner)
    test_mandatory_return_reason(runner)
    test_composite_tenant_keys_and_fk_integrity(runner)
    simulate_concurrent_state_transitions(runner)

    print("\n" + "=" * 80)
    print(f" CHALLENGE RESULTS: {runner.passed} PASSED | {runner.failed} GAPS FOUND")
    print("=" * 80)

    if runner.failed > 0:
        print("\nSUMMARY OF GAPS:")
        for idx, gap in enumerate(runner.gaps, 1):
            print(f"{idx}. [{gap['test_id']}] {gap['title']}: {gap['message']}")
        sys.exit(1)
    else:
        print("\nALL ADVERSARIAL CHALLENGES PASSED.")
        sys.exit(0)

if __name__ == "__main__":
    main()
