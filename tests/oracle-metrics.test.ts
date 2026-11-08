import assert from "node:assert/strict";
import test from "node:test";
import {
  getInitialGoldenSeed,
  GOLDEN_SEED_XA_A,
  GOLDEN_SEED_XA_B,
  createInitialDemoState,
  TaskItem,
  CdsCellItem,
  InspectionRecommendationItem,
  CulturalTitleItem,
} from "../src/lib/store/demo-state";
import { TENANTS, TenantConfig } from "../src/lib/tenancy/tenant-config";

// Pure calculation replica matching demo-context.tsx reactive logic exactly
function calculateMetrics(
  tasks: TaskItem[],
  culturalTitles: CulturalTitleItem[],
  cdsMatrix: CdsCellItem[],
  recommendations: InspectionRecommendationItem[] | undefined,
  tenantConfig: TenantConfig,
  tenantCode: "XA_A" | "XA_B"
) {
  // MET-01: Open tasks (not completed and not cancelled)
  const openTasks = (tasks || []).filter(
    (t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy"
  );
  const met01 = openTasks.length;

  // MET-02: Overdue open tasks
  const met02 = openTasks.filter((t) => t.isOverdue).length;

  // MET-03: Cultural title pass rate (approved / submitted)
  const submittedCultural = (culturalTitles || []).filter(
    (t) => t.status !== "DRAFT" && t.status !== "CANCELLED"
  );
  const approvedCultural = submittedCultural.filter((t) => t.status === "APPROVED");
  const met03 =
    submittedCultural.length > 0
      ? `${((approvedCultural.length / submittedCultural.length) * 100).toFixed(1)}%`
      : "0.0%";

  // MET-04: CDS indicators confirmed rate
  let met04Str = "0%";
  let met04Num: number | string = 0;
  if (!tenantConfig.features.digitalTransformation || tenantCode === "XA_B") {
    met04Str = "N/A";
    met04Num = "N/A";
  } else {
    const applicableCds = (cdsMatrix || []).filter((c) => c.status !== "NOT_APPLICABLE");
    const confirmedCds = applicableCds.filter(
      (c) => c.status === "CONFIRMED" || c.status === "CONFIRMED_ZERO"
    );
    met04Num =
      applicableCds.length > 0
        ? Math.round((confirmedCds.length / applicableCds.length) * 100)
        : 0;
    met04Str = `${met04Num}%`;
  }

  // MET-05: Open inspection recommendations
  let met05 = 0;
  if (tenantConfig.features.fieldInspection) {
    met05 = (recommendations || []).filter(
      (r) => r.status !== "RESOLVED_CLOSED"
    ).length;
  }

  return {
    met01,
    met02,
    met03,
    met04Num,
    met04Str,
    met05,
    oracle: {
      met01: met01 < 10 ? `0${met01}` : `${met01}`,
      met02: met02 < 10 ? `0${met02}` : `${met02}`,
      met03,
      met04: met04Str,
      met05: met05 < 10 ? `0${met05}` : `${met05}`,
    },
  };
}

test("XA_A Golden Seed: Exact calculation of MET-01, MET-02, MET-04, MET-05", () => {
  const seedA = getInitialGoldenSeed("XA_A");
  const tenantA = TENANTS.xa_a;

  const res = calculateMetrics(
    seedA.tasks,
    seedA.culturalTitles,
    seedA.cdsMatrix,
    seedA.recommendations,
    tenantA,
    "XA_A"
  );

  // Exact target values required by Acceptance Criteria:
  // MET-01: 3
  assert.equal(res.met01, 3, "MET-01 must be exactly 3");
  assert.equal(res.oracle.met01, "03", "MET-01 display must be '03'");

  // MET-02: 1
  assert.equal(res.met02, 1, "MET-02 must be exactly 1");
  assert.equal(res.oracle.met02, "01", "MET-02 display must be '01'");

  // MET-03: 50.0% (2/4 approved, enforcing 50% ceiling)
  assert.equal(res.met03, "50.0%", "MET-03 must be exactly 50.0%");

  // MET-04: 60% (3 confirmed out of 5 applicable)
  assert.equal(res.met04Num, 60, "MET-04 numeric value must be 60");
  assert.equal(res.met04Str, "60%", "MET-04 string value must be '60%'");
  assert.equal(res.oracle.met04, "60%", "MET-04 display must be '60%'");

  // MET-05: 2
  assert.equal(res.met05, 2, "MET-05 must be exactly 2");
  assert.equal(res.oracle.met05, "02", "MET-05 display must be '02'");

  // Consistency with embedded metrics object
  assert.equal(seedA.metrics.met01, 3);
  assert.equal(seedA.metrics.met02, 1);
  assert.equal(seedA.metrics.met03, "50.0%");
  assert.equal(seedA.metrics.met04, "60%");
  assert.equal(seedA.metrics.met05, 2);
});

test("XA_B Golden Seed: Exact calculation of MET-01, MET-02, MET-04, MET-05", () => {
  const seedB = getInitialGoldenSeed("XA_B");
  const tenantB = TENANTS.xa_b;

  const res = calculateMetrics(
    seedB.tasks,
    seedB.culturalTitles,
    seedB.cdsMatrix,
    seedB.recommendations,
    tenantB,
    "XA_B"
  );

  // MET-01: 2
  assert.equal(res.met01, 2, "XA_B MET-01 must be 2");
  assert.equal(res.oracle.met01, "02");

  // MET-02: 0 (no overdue tasks)
  assert.equal(res.met02, 0, "XA_B MET-02 must be 0");
  assert.equal(res.oracle.met02, "00");

  // MET-04: N/A (disabled features.digitalTransformation)
  assert.equal(res.met04Num, "N/A", "XA_B MET-04 must be 'N/A'");
  assert.equal(res.met04Str, "N/A");

  // MET-05: 0 (disabled features.fieldInspection)
  assert.equal(res.met05, 0, "XA_B MET-05 must be 0");
  assert.equal(res.oracle.met05, "00");
});

test("Stress & Edge Cases: MET-01 and MET-02 Task Filter Invariants", () => {
  const tenantA = TENANTS.xa_a;

  // 1. Empty tasks
  const emptyRes = calculateMetrics([], [], [], [], tenantA, "XA_A");
  assert.equal(emptyRes.met01, 0);
  assert.equal(emptyRes.met02, 0);

  // 2. All completed or cancelled tasks (even if marked isOverdue: true)
  const completedTasks: TaskItem[] = [
    {
      id: "C1",
      code: "TASK-C1",
      title: "Completed overdue",
      domain: "Văn hóa",
      entityTag: "VH",
      assignee: "Cán bộ",
      dueText: "Đã xong",
      isOverdue: true,
      status: "Hoàn thành",
      statusBg: "",
      statusColor: "",
      statusBorder: "",
      icon: "Check",
      metric: "MET-01",
      tenantCode: "XA_A",
      targetUrl: "/",
    },
    {
      id: "C2",
      code: "TASK-C2",
      title: "Cancelled overdue",
      domain: "Văn hóa",
      entityTag: "VH",
      assignee: "Cán bộ",
      dueText: "Đã hủy",
      isOverdue: true,
      status: "Đã hủy",
      statusBg: "",
      statusColor: "",
      statusBorder: "",
      icon: "X",
      metric: "MET-01",
      tenantCode: "XA_A",
      targetUrl: "/",
    },
  ];
  const compRes = calculateMetrics(completedTasks, [], [], [], tenantA, "XA_A");
  assert.equal(compRes.met01, 0, "Completed/cancelled tasks must NOT be counted in MET-01");
  assert.equal(compRes.met02, 0, "Completed/cancelled tasks must NOT be counted in MET-02 even if isOverdue is true");

  // 3. Scale test with 500 open tasks, 150 overdue
  const largeTasks: TaskItem[] = [];
  for (let i = 0; i < 500; i++) {
    const isOverdue = i < 150;
    largeTasks.push({
      id: `T_STRESS_${i}`,
      code: `TASK-${i}`,
      title: `Stress task ${i}`,
      domain: "Nội vụ",
      entityTag: "NV",
      assignee: "Cán bộ",
      dueText: isOverdue ? "Quá hạn" : "Còn hạn",
      isOverdue,
      status: isOverdue ? "Quá hạn" : "Đang xử lý",
      statusBg: "",
      statusColor: "",
      statusBorder: "",
      icon: "Clock",
      metric: isOverdue ? "MET-02" : "MET-01",
      tenantCode: "XA_A",
      targetUrl: "/",
    });
  }
  const largeRes = calculateMetrics(largeTasks, [], [], [], tenantA, "XA_A");
  assert.equal(largeRes.met01, 500, "Should handle 500 open tasks");
  assert.equal(largeRes.met02, 150, "Should handle 150 overdue tasks");
  assert.equal(largeRes.oracle.met01, "500");
  assert.equal(largeRes.oracle.met02, "150");
});

test("Stress & Edge Cases: MET-04 CDS Matrix Formula Invariants", () => {
  const tenantA = TENANTS.xa_a;

  // 1. All cells NOT_APPLICABLE
  const allNaCells: CdsCellItem[] = [
    {
      code: "CDS-01",
      name: "Cell 1",
      value: "N/A",
      status: "NOT_APPLICABLE",
      meaning: "N/A",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-02",
      name: "Cell 2",
      value: "N/A",
      status: "NOT_APPLICABLE",
      meaning: "N/A",
      tenantCode: "XA_A",
    },
  ];
  const naRes = calculateMetrics([], [], allNaCells, [], tenantA, "XA_A");
  assert.equal(naRes.met04Num, 0, "Zero applicable cells must return 0%, not NaN or division by zero");
  assert.equal(naRes.met04Str, "0%");

  // 2. Rounding tests (1/3 = 33%, 2/3 = 67%)
  const fractionalCells: CdsCellItem[] = [
    {
      code: "CDS-01",
      name: "Cell 1",
      value: "10",
      status: "CONFIRMED",
      meaning: "test",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-02",
      name: "Cell 2",
      value: "0",
      status: "UNCONFIRMED",
      meaning: "test",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-03",
      name: "Cell 3",
      value: "0",
      status: "MISSING",
      meaning: "test",
      tenantCode: "XA_A",
    },
  ];
  const fracRes1 = calculateMetrics([], [], fractionalCells, [], tenantA, "XA_A");
  assert.equal(fracRes1.met04Num, 33, "1/3 confirmed should round to 33%");

  fractionalCells[1].status = "CONFIRMED_ZERO";
  const fracRes2 = calculateMetrics([], [], fractionalCells, [], tenantA, "XA_A");
  assert.equal(fracRes2.met04Num, 67, "2/3 confirmed should round to 67%");
});

test("Stress & Edge Cases: MET-05 Inspection Recommendations Invariants", () => {
  const tenantA = TENANTS.xa_a;

  // 1. Null / undefined recommendations
  const undefRes = calculateMetrics([], [], [], undefined, tenantA, "XA_A");
  assert.equal(undefRes.met05, 0, "Undefined recommendations must return 0 without crash");

  // 2. Only resolved recommendations
  const closedRecs: InspectionRecommendationItem[] = [
    {
      id: "R1",
      code: "KN-01",
      title: "Đã khắc phục xong",
      facilityName: "Cơ sở A",
      hamlet: "Xóm 1",
      assignee: "Cán bộ",
      dueText: "Đã xong",
      isOverdue: false,
      status: "RESOLVED_CLOSED",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
  ];
  const closedRes = calculateMetrics([], [], [], closedRecs, tenantA, "XA_A");
  assert.equal(closedRes.met05, 0, "RESOLVED_CLOSED recommendations must NOT be counted");

  // 3. Overdue and Feedback Unverified
  const openRecs: InspectionRecommendationItem[] = [
    {
      id: "R1",
      code: "KN-01",
      title: "Chờ xử lý quá hạn",
      facilityName: "Cơ sở A",
      hamlet: "Xóm 1",
      assignee: "Cán bộ",
      dueText: "Quá hạn",
      isOverdue: true,
      status: "WAITING_OVERDUE",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
    {
      id: "R2",
      code: "KN-02",
      title: "Chưa thẩm tra phản hồi",
      facilityName: "Cơ sở B",
      hamlet: "Xóm 2",
      assignee: "Cán bộ",
      dueText: "Còn 2 ngày",
      isOverdue: false,
      status: "FEEDBACK_UNVERIFIED",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
  ];
  const openRes = calculateMetrics([], [], [], openRecs, tenantA, "XA_A");
  assert.equal(openRes.met05, 2, "WAITING_OVERDUE and FEEDBACK_UNVERIFIED must both be counted");
});
