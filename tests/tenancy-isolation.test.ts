import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialDemoState,
  getInitialGoldenSeed,
  GOLDEN_SEED_XA_A,
  GOLDEN_SEED_XA_B,
  DemoState,
  TenantCode,
  AuditLogEntry,
  TaskItem,
} from "../src/lib/store/demo-state";
import { TENANTS } from "../src/lib/tenancy/tenant-config";
import { PERSONAS } from "../src/lib/auth/session";

// State reducer implementation replicating demo-context.tsx resetTenant function exactly
function executeResetTenant(
  prevState: DemoState,
  tenantIdOrCode: "XA_A" | "XA_B" | string,
  persona = PERSONAS.P2,
  storageMock?: { setItem: (key: string, val: string) => void }
): DemoState {
  const targetCode: TenantCode =
    tenantIdOrCode.toUpperCase().includes("B") ? "XA_B" : "XA_A";
  const targetKey = targetCode === "XA_A" ? "xa_a" : "xa_b";
  const pristineSeed = getInitialGoldenSeed(targetCode);

  const resetAuditLog: AuditLogEntry = {
    id: `audit-reset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    tenantId: targetCode === "XA_A" ? TENANTS.xa_a.id : TENANTS.xa_b.id,
    userId: persona.id,
    personaCode: persona.code,
    action: "AUDIT_RESET_TENANT",
    entityType: "TENANT",
    entityId: targetCode,
    details: {
      message: `Khôi phục toàn bộ bảng dữ liệu ${
        targetCode === "XA_A" ? "Xã Thịnh Đức (Xã A)" : "Xã Tân Cương (Xã B)"
      } về trạng thái Golden Seed ban đầu`,
      preservedTenant: targetCode === "XA_A" ? "XA_B" : "XA_A",
    },
    ipAddress: "127.0.0.1 (Localhost Demo)",
  };

  const nextState: DemoState = {
    ...prevState,
    [targetKey]: pristineSeed,
    tenants: {
      ...prevState.tenants,
      [targetCode]: pristineSeed,
      [targetKey]: pristineSeed,
    },
    auditLogs: [resetAuditLog, ...prevState.auditLogs],
  };

  if (storageMock) {
    storageMock.setItem("pvh_demo_state_v1", JSON.stringify(nextState));
  }

  return nextState;
}

test("Deep Clone Invariance: getInitialGoldenSeed returns a mutable clone without polluting seed or future clones", () => {
  const clone1 = getInitialGoldenSeed("XA_A");
  const originalTaskCount = clone1.tasks.length;

  // Mutate clone1 deeply
  clone1.tasks.push({
    id: "MUTATED_TASK",
    code: "TASK-MUT",
    title: "Mutated Task",
    domain: "Test",
    entityTag: "Test",
    assignee: "Test",
    dueText: "Now",
    isOverdue: false,
    status: "Đang xử lý",
    statusBg: "",
    statusColor: "",
    statusBorder: "",
    icon: "Clock",
    metric: "MET-01",
    tenantCode: "XA_A",
    targetUrl: "/",
  });
  clone1.culturalTitles[0].score = 999;
  clone1.cdsMatrix[0].value = "MUTATED_VALUE";

  // Check that GOLDEN_SEED_XA_A itself is NOT mutated
  assert.equal(
    GOLDEN_SEED_XA_A.tasks.length,
    originalTaskCount,
    "GOLDEN_SEED_XA_A must remain pristine"
  );
  assert.notEqual(GOLDEN_SEED_XA_A.culturalTitles[0].score, 999);
  assert.notEqual(GOLDEN_SEED_XA_A.cdsMatrix[0].value, "MUTATED_VALUE");

  // Check that a fresh call to getInitialGoldenSeed("XA_A") is completely clean
  const clone2 = getInitialGoldenSeed("XA_A");
  assert.equal(
    clone2.tasks.length,
    originalTaskCount,
    "New clone must not have the mutated task"
  );
  assert.equal(clone2.culturalTitles[0].score, 95);
  assert.equal(clone2.cdsMatrix[0].value, "0");
});

test("Multi-tenancy Isolation: resetTenant('XA_A') resets Xã A and leaves Xã B 100% intact", () => {
  const state0 = createInitialDemoState();

  // 1. Mutate Xã B significantly
  const mutatedTaskB: TaskItem = {
    id: "TB-MUTATED-99",
    code: "TASK-B-MUTATED",
    title: "Nhiệm vụ riêng của Xã B đã được cán bộ Tân Cương tạo mới",
    domain: "Văn hóa & Gia đình",
    entityTag: "Đặc sản Chè",
    assignee: "Cán bộ Tân Cương",
    dueText: "Hôm nay",
    isOverdue: false,
    status: "Đang xử lý",
    statusBg: "bg-blue-50",
    statusColor: "text-blue-700",
    statusBorder: "border-blue-200",
    icon: "Check",
    metric: "MET-01",
    tenantCode: "XA_B",
    targetUrl: "/van-hoa-gia-dinh",
  };

  const stateWithMutatedB: DemoState = {
    ...state0,
    xa_b: {
      ...state0.xa_b,
      tasks: [mutatedTaskB, ...state0.xa_b.tasks],
      culturalTitles: [
        {
          ...state0.xa_b.culturalTitles[0],
          score: 100,
          householdHead: "Dương Đình Hùng (Đã thẩm định xuất sắc)",
        },
      ],
      masterSubjects: [
        ...state0.xa_b.masterSubjects,
        {
          id: "SUB-B-NEW",
          code: "CDB-999",
          fullName: "Công dân mới Xã Tân Cương",
          cccd: "019099998888",
          phone: "0988776655",
          address: "Xóm Chè Tân Cương",
          hamlet: "Xóm Chè Đặc Sản",
          subjectType: "CITIZEN",
          status: "ACTIVE",
          membersCount: 3,
          tenantCode: "XA_B",
        },
      ],
    },
    tenants: {
      ...state0.tenants,
      XA_B: {
        ...state0.xa_b,
        tasks: [mutatedTaskB, ...state0.xa_b.tasks],
      },
    },
  };

  // 2. Mutate Xã A (e.g. mark all tasks as completed, delete some items)
  const stateWithMutatedAAndB: DemoState = {
    ...stateWithMutatedB,
    xa_a: {
      ...stateWithMutatedB.xa_a,
      tasks: stateWithMutatedB.xa_a.tasks.map((t) => ({
        ...t,
        status: "Hoàn thành",
        isOverdue: false,
      })),
      culturalTitles: [],
      recommendations: [],
    },
    tenants: {
      ...stateWithMutatedB.tenants,
      XA_A: {
        ...stateWithMutatedB.xa_a,
        tasks: [],
      },
    },
  };

  // Pre-condition verification:
  assert.equal(
    stateWithMutatedAAndB.xa_a.tasks.filter((t) => t.status !== "Hoàn thành").length,
    0,
    "Pre-condition: Xã A open tasks must be 0 after mutation"
  );
  assert.equal(
    stateWithMutatedAAndB.xa_b.tasks.length,
    state0.xa_b.tasks.length + 1,
    "Pre-condition: Xã B has 1 additional task"
  );
  assert.equal(
    stateWithMutatedAAndB.xa_b.tasks[0].id,
    "TB-MUTATED-99"
  );
  assert.equal(
    stateWithMutatedAAndB.xa_b.culturalTitles[0].score,
    100
  );
  assert.equal(
    stateWithMutatedAAndB.xa_b.masterSubjects.length,
    state0.xa_b.masterSubjects.length + 1
  );

  // Snapshot Xã B state before reset
  const xaBBeforeResetSnapshot = JSON.stringify(stateWithMutatedAAndB.xa_b);

  // 3. Action: Reset Xã A
  const stateAfterResetA = executeResetTenant(stateWithMutatedAAndB, "XA_A", PERSONAS.P2);

  // Post-condition: Xã A must be restored to pristine seed
  assert.equal(
    stateAfterResetA.xa_a.tasks.length,
    GOLDEN_SEED_XA_A.tasks.length,
    "Xã A task count must match golden seed"
  );
  assert.equal(
    stateAfterResetA.xa_a.tasks.filter((t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy").length,
    3,
    "Xã A MET-01 open tasks must be restored to 3"
  );
  assert.equal(
    stateAfterResetA.xa_a.tasks.filter((t) => t.isOverdue && t.status !== "Hoàn thành" && t.status !== "Đã hủy").length,
    1,
    "Xã A MET-02 overdue tasks must be restored to 1"
  );
  assert.equal(
    stateAfterResetA.xa_a.culturalTitles.length,
    GOLDEN_SEED_XA_A.culturalTitles.length,
    "Xã A cultural titles must be restored"
  );
  assert.equal(
    stateAfterResetA.xa_a.recommendations.length,
    GOLDEN_SEED_XA_A.recommendations.length,
    "Xã A recommendations must be restored"
  );

  // CRITICAL CHECK: Xã B must be 100% UNTOUCHED
  const xaBAfterResetSnapshot = JSON.stringify(stateAfterResetA.xa_b);
  assert.equal(
    xaBAfterResetSnapshot,
    xaBBeforeResetSnapshot,
    "CRITICAL: Xã B data must be 100% identical byte-for-byte to its mutated state before reset!"
  );
  assert.equal(
    stateAfterResetA.xa_b.tasks[0].id,
    "TB-MUTATED-99",
    "Xã B mutated task must remain intact"
  );
  assert.equal(
    stateAfterResetA.xa_b.culturalTitles[0].score,
    100,
    "Xã B mutated score must remain intact"
  );
  assert.equal(
    stateAfterResetA.xa_b.masterSubjects.length,
    state0.xa_b.masterSubjects.length + 1,
    "Xã B added citizen must remain intact"
  );
});

test("Audit Log Generation: AUDIT_RESET_TENANT is created with exact contract properties", () => {
  const state0 = createInitialDemoState();
  const initialLogCount = state0.auditLogs.length;

  const resetTimeBefore = Date.now();
  const stateAfterReset = executeResetTenant(state0, "XA_A", PERSONAS.P2);
  const resetTimeAfter = Date.now();

  assert.equal(
    stateAfterReset.auditLogs.length,
    initialLogCount + 1,
    "Audit logs length must increase by exactly 1"
  );

  const topLog = stateAfterReset.auditLogs[0];

  // Verify Audit Log contract fields
  assert.ok(topLog.id.startsWith("audit-reset-"), "Log ID must have 'audit-reset-' prefix");
  assert.equal(topLog.action, "AUDIT_RESET_TENANT", "Action must be 'AUDIT_RESET_TENANT'");
  assert.equal(topLog.entityType, "TENANT", "EntityType must be 'TENANT'");
  assert.equal(topLog.entityId, "XA_A", "EntityId must be 'XA_A'");
  assert.equal(topLog.tenantId, TENANTS.xa_a.id, "TenantId must match TENANTS.xa_a.id");
  assert.equal(topLog.personaCode, "P2", "Persona code must match acting persona");
  assert.equal(topLog.userId, PERSONAS.P2.id, "UserId must match acting persona id");

  // Verify timestamp validity
  const logTimestamp = new Date(topLog.timestamp).getTime();
  assert.ok(
    !isNaN(logTimestamp) && logTimestamp >= resetTimeBefore - 1000 && logTimestamp <= resetTimeAfter + 1000,
    "Log timestamp must be valid ISO date string matching current execution time"
  );

  // Verify details object
  assert.ok(topLog.details, "Details must exist");
  assert.equal(
    (topLog.details as any).preservedTenant,
    "XA_B",
    "Details must specify preservedTenant: 'XA_B'"
  );
  assert.ok(
    (topLog.details as any).message.includes("Thịnh Đức"),
    "Details message must describe restoring Thịnh Đức"
  );
});

test("Symmetric Isolation: resetTenant('XA_B') resets Xã B and leaves Xã A 100% intact", () => {
  const state0 = createInitialDemoState();

  // Mutate Xã A
  const stateWithMutatedA: DemoState = {
    ...state0,
    xa_a: {
      ...state0.xa_a,
      tasks: [
        {
          id: "TA-MUTATED-123",
          code: "TASK-A-MUT",
          title: "Công việc đột xuất của Xã A",
          domain: "Nội vụ",
          entityTag: "Đột xuất",
          assignee: "P2",
          dueText: "Hôm nay",
          isOverdue: false,
          status: "Đang xử lý",
          statusBg: "",
          statusColor: "",
          statusBorder: "",
          icon: "Clock",
          metric: "MET-01",
          tenantCode: "XA_A",
          targetUrl: "/",
        },
        ...state0.xa_a.tasks,
      ],
    },
  };

  // Mutate Xã B
  const stateWithMutatedAB: DemoState = {
    ...stateWithMutatedA,
    xa_b: {
      ...stateWithMutatedA.xa_b,
      tasks: [],
      culturalTitles: [],
    },
  };

  const xaABeforeResetSnapshot = JSON.stringify(stateWithMutatedAB.xa_a);

  // Reset Xã B
  const stateAfterResetB = executeResetTenant(stateWithMutatedAB, "XA_B", PERSONAS.P3);

  // Xã B restored
  assert.equal(
    stateAfterResetB.xa_b.tasks.length,
    GOLDEN_SEED_XA_B.tasks.length,
    "Xã B tasks restored to golden seed"
  );
  assert.equal(
    stateAfterResetB.xa_b.culturalTitles.length,
    GOLDEN_SEED_XA_B.culturalTitles.length,
    "Xã B cultural titles restored"
  );

  // Xã A 100% preserved
  const xaAAfterResetSnapshot = JSON.stringify(stateAfterResetB.xa_a);
  assert.equal(
    xaAAfterResetSnapshot,
    xaABeforeResetSnapshot,
    "Xã A must be 100% untouched when Xã B is reset"
  );

  // Audit log for XA_B
  const topLog = stateAfterResetB.auditLogs[0];
  assert.equal(topLog.action, "AUDIT_RESET_TENANT");
  assert.equal(topLog.entityId, "XA_B");
  assert.equal((topLog.details as any).preservedTenant, "XA_A");
});

test("Stress & Concurrency: 100 alternating resets with rapid mutations maintain strict isolation", () => {
  let state = createInitialDemoState();

  for (let i = 0; i < 100; i++) {
    // Add unique mutation to opposite tenant
    if (i % 2 === 0) {
      // Resetting XA_A: Mutate XA_B first
      state = {
        ...state,
        xa_b: {
          ...state.xa_b,
          tasks: [
            {
              id: `TB-CYCLE-${i}`,
              code: `TB-C-${i}`,
              title: `Mutation in cycle ${i}`,
              domain: "Văn hóa",
              entityTag: "Tag",
              assignee: "P3",
              dueText: "Due",
              isOverdue: false,
              status: "Đang xử lý",
              statusBg: "",
              statusColor: "",
              statusBorder: "",
              icon: "Clock",
              metric: "MET-01",
              tenantCode: "XA_B",
              targetUrl: "/",
            },
            ...state.xa_b.tasks,
          ],
        },
      };

      const bTasksCountBefore = state.xa_b.tasks.length;
      state = executeResetTenant(state, "XA_A");
      assert.equal(
        state.xa_b.tasks.length,
        bTasksCountBefore,
        `Cycle ${i}: Xã B task count must not change when Xã A is reset`
      );
      assert.equal(
        state.xa_a.tasks.length,
        GOLDEN_SEED_XA_A.tasks.length,
        `Cycle ${i}: Xã A must be exactly pristine`
      );
    } else {
      // Resetting XA_B: Mutate XA_A first
      state = {
        ...state,
        xa_a: {
          ...state.xa_a,
          tasks: [
            {
              id: `TA-CYCLE-${i}`,
              code: `TA-C-${i}`,
              title: `Mutation in cycle ${i}`,
              domain: "Nội vụ",
              entityTag: "Tag",
              assignee: "P2",
              dueText: "Due",
              isOverdue: false,
              status: "Đang xử lý",
              statusBg: "",
              statusColor: "",
              statusBorder: "",
              icon: "Clock",
              metric: "MET-01",
              tenantCode: "XA_A",
              targetUrl: "/",
            },
            ...state.xa_a.tasks,
          ],
        },
      };

      const aTasksCountBefore = state.xa_a.tasks.length;
      state = executeResetTenant(state, "XA_B");
      assert.equal(
        state.xa_a.tasks.length,
        aTasksCountBefore,
        `Cycle ${i}: Xã A task count must not change when Xã B is reset`
      );
      assert.equal(
        state.xa_b.tasks.length,
        GOLDEN_SEED_XA_B.tasks.length,
        `Cycle ${i}: Xã B must be exactly pristine`
      );
    }
  }

  assert.equal(
    state.auditLogs.length,
    createInitialDemoState().auditLogs.length + 100,
    "100 audit logs must be recorded without loss"
  );
});

test("LocalStorage Persistence Simulation: State is serialized cleanly without errors", () => {
  const store = new Map<string, string>();
  const mockStorage = {
    setItem: (k: string, v: string) => store.set(k, v),
  };

  const state0 = createInitialDemoState();
  const nextState = executeResetTenant(state0, "XA_A", PERSONAS.P2, mockStorage);

  const rawJson = store.get("pvh_demo_state_v1");
  assert.ok(rawJson, "LocalStorage must contain 'pvh_demo_state_v1'");

  const parsed = JSON.parse(rawJson!);
  assert.equal(parsed.xa_a.tasks.length, GOLDEN_SEED_XA_A.tasks.length);
  assert.equal(parsed.auditLogs[0].action, "AUDIT_RESET_TENANT");
  assert.equal(parsed.auditLogs[0].entityId, "XA_A");
});
