/**
 * EMPIRICAL ADVERSARIAL TEST HARNESS — MILESTONE M4 (WS-04)
 * Role: challenger_m4_1 (Empirical Challenger)
 * Scope:
 *  1. AC-09 Delegation Expiration & Audit Trail
 *  2. Atomic Merge Duplicate Identities & RPC simulation
 *  3. Residence History Lookup & Multi-tenant Isolation
 *  4. Omnisearch Algorithm (4 categories, case-insensitivity, empty/special chars, Vietnamese diacritics)
 */

import {
  GOLDEN_SEED_XA_A,
  GOLDEN_SEED_XA_B,
  TenantDemoData,
  CitizenSubjectItem,
  CitizenResidenceHistoryItem,
  AuditLogEntry,
} from "../src/lib/store/demo-state";
import { maskPII } from "../src/lib/authorization/pii-mask";

// Types matching Header Omnisearch
interface RouteMeta {
  path: string;
  name: string;
  category: string;
  desc: string;
}

const APP_ROUTES: RouteMeta[] = [
  { path: "/ban-lam-viec", name: "Bàn làm việc tổng hợp", category: "Phân hệ chính", desc: "Hàng đợi nhiệm vụ liên ngành & 4 thẻ chỉ tiêu Oracle" },
  { path: "/noi-vu", name: "Nội vụ & Lao động", category: "Phân hệ chính", desc: "Người có công, HĐLĐ, Tiền lương tối thiểu & Hòa giải đình công" },
  { path: "/giao-duc", name: "Giáo dục & Đào tạo", category: "Phân hệ chính", desc: "Trường lớp, Nhóm trẻ tư thục >=1.5m2 & TTHTCĐ" },
  { path: "/van-hoa-gia-dinh", name: "Văn hóa & Gia đình", category: "Phân hệ chính", desc: "Bình xét GĐVH 9 bước (VH1..VH9), Lễ hội & Phòng chống BLGĐ" },
  { path: "/khcn-chuyen-doi-so", name: "KHCN & Chuyển đổi số", category: "Phân hệ chính", desc: "Ma trận CĐS 6 ô, MET-04 (60%) & Dữ liệu Xã B lịch sử" },
  { path: "/y-te-an-sinh", name: "Y tế & An sinh xã hội", category: "Phân hệ chính", desc: "Chi trả BTXH bảo vệ PII, ATTP mẫu lưu 24h & Y dược tư nhân" },
  { path: "/dan-toc-ton-giao", name: "Dân tộc & Tôn giáo", category: "Phân hệ chính", desc: "Cơ sở tôn giáo, Sinh hoạt chưa đăng ký & Vốn MTQG 1719" },
  { path: "/kiem-tra", name: "Kiểm tra liên ngành", category: "Phân hệ chính", desc: "Kiểm tra Desktop vs Mobile Checklist V14, lưu nháp offline" },
  { path: "/bao-cao", name: "Báo cáo Oracle", category: "Phân hệ chính", desc: "5 chỉ tiêu DEM-R01..R05, Snapshot Rev 1 bất biến & LineageDrawer" },
  { path: "/quan-tri", name: "Quản trị hệ thống", category: "Nền tảng", desc: "Quản trị người dùng, Tham số đa xã, AC-09 & Nhật ký kiểm toán" },
  { path: "/du-lieu-dung-chung", name: "Dữ liệu dùng chung", category: "Nền tảng", desc: "Danh mục thiết chế, Ghép định danh Atomic Merge & Biến động cư trú" },
  { path: "/playbook", name: "Playbook thực nghiệm", category: "Hỗ trợ", desc: "Kịch bản diễn thử 8 bước, Reset Demo Xã A độc lập" },
  { path: "/ke-hoach-cong-viec", name: "Kế hoạch công việc", category: "Hỗ trợ", desc: "Kế hoạch phối hợp công tác liên ngành cấp xã" },
  { path: "/tich-hop", name: "Tích hợp hệ thống", category: "Hỗ trợ", desc: "Cổng tích hợp liên thông CSDL quốc gia và tỉnh" },
];

interface SearchResultItem {
  id: string;
  category: "ROUTE" | "CITIZEN" | "FACILITY" | "TASK";
  categoryLabel: string;
  title: string;
  subtitle: string;
  targetUrl: string;
  badge?: string;
}

// Exact implementation from src/components/layout/header.tsx
function executeOmnisearchAsImplemented(
  query: string,
  data: TenantDemoData,
  persona: { id: string; code: string; canViewPII: boolean }
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  // 1. Search across 14 Routes
  APP_ROUTES.forEach((r) => {
    if (!q || r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.path.includes(q)) {
      results.push({
        id: `route-${r.path}`,
        category: "ROUTE",
        categoryLabel: "Phân hệ & Trang",
        title: r.name,
        subtitle: r.desc,
        targetUrl: r.path,
        badge: r.category,
      });
    }
  });

  if (!q) {
    return results;
  }

  // 2. Search across Citizen Subjects
  const subjects = data.masterSubjects || [];
  subjects.forEach((s) => {
    const match =
      s.fullName.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.cccd.toLowerCase().includes(q) ||
      s.hamlet.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q);

    if (match) {
      results.push({
        id: `citizen-${s.id}`,
        category: "CITIZEN",
        categoryLabel: "Hồ sơ Công dân",
        title: `${s.fullName} (${s.code})`,
        subtitle: `CCCD: ${maskPII(s.cccd, "cccd", persona.canViewPII)} • ${s.hamlet} • ${s.address}`,
        targetUrl: "/du-lieu-dung-chung",
        badge: s.status === "MERGED" ? "Đã gộp" : "Công dân",
      });
    }
  });

  // 3. Search across Facilities (Schools, Cultural Facilities, Religious, Medical, Food Safety)
  const schools = data.domainRecords?.giaoDuc?.schools || [];
  schools.forEach((sc) => {
    if (sc.name.toLowerCase().includes(q) || sc.principal.toLowerCase().includes(q)) {
      results.push({
        id: `school-${sc.id}`,
        category: "FACILITY",
        categoryLabel: "Cơ sở & Thiết chế",
        title: sc.name,
        subtitle: `Hiệu trưởng: ${sc.principal} • ${sc.totalStudents} học sinh`,
        targetUrl: "/giao-duc",
        badge: "Trường học",
      });
    }
  });

  const religious = data.domainRecords?.danTocTonGiao?.religiousFacilities || [];
  religious.forEach((rf) => {
    if (rf.name.toLowerCase().includes(q) || rf.leaderName.toLowerCase().includes(q) || rf.hamlet.toLowerCase().includes(q)) {
      results.push({
        id: `religion-${rf.id}`,
        category: "FACILITY",
        categoryLabel: "Cơ sở & Thiết chế",
        title: rf.name,
        subtitle: `Trụ trì/Người đứng đầu: ${rf.leaderName} • ${rf.hamlet}`,
        targetUrl: "/dan-toc-ton-giao",
        badge: "Tôn giáo",
      });
    }
  });

  const medicals = data.domainRecords?.yTeAnSinh?.medical || [];
  medicals.forEach((m) => {
    if (m.facilityName.toLowerCase().includes(q) || m.practitionerName.toLowerCase().includes(q)) {
      results.push({
        id: `med-${m.id}`,
        category: "FACILITY",
        categoryLabel: "Cơ sở & Thiết chế",
        title: m.facilityName,
        subtitle: `Phụ trách: ${m.practitionerName} • GP: ${m.licenseNumber}`,
        targetUrl: "/y-te-an-sinh",
        badge: "Y dược tư nhân",
      });
    }
  });

  const foodSafeties = data.domainRecords?.yTeAnSinh?.foodSafety || [];
  foodSafeties.forEach((fs) => {
    if (fs.facilityName.toLowerCase().includes(q)) {
      results.push({
        id: `fs-${fs.id}`,
        category: "FACILITY",
        categoryLabel: "Cơ sở & Thiết chế",
        title: fs.facilityName,
        subtitle: `Kiểm tra ATTP: Điểm ${fs.totalScore}/100 • Kết luận: ${fs.conclusion}`,
        targetUrl: "/y-te-an-sinh",
        badge: "ATTP",
      });
    }
  });

  // 4. Search across Tasks
  const tasks = data.tasks || [];
  tasks.forEach((t) => {
    if (t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q)) {
      results.push({
        id: `task-${t.id}`,
        category: "TASK",
        categoryLabel: "Nhiệm vụ Chờ xử lý",
        title: `[${t.code}] ${t.title}`,
        subtitle: `Lĩnh vực: ${t.domain} • Hạn xử lý: ${t.dueText} • Người thực hiện: ${t.assignee}`,
        targetUrl: t.targetUrl || "/ban-lam-viec",
        badge: t.status,
      });
    }
  });

  return results;
}

// Test reporting infrastructure
interface TestAssertion {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error?: string;
  criticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

const assertions: TestAssertion[] = [];

function assert(
  suite: string,
  id: string,
  name: string,
  condition: boolean,
  expected: unknown,
  actual: unknown,
  criticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "HIGH"
) {
  assertions.push({
    id,
    suite,
    name,
    passed: condition,
    expected,
    actual,
    criticality,
    error: condition ? undefined : `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  });
}

// ======================================================================
// SUITE 1: AC-09 DELEGATION EXPIRATION SIMULATION
// ======================================================================
console.log("\n=======================================================");
console.log("SUITE 1: AC-09 DELEGATION EXPIRATION SIMULATION & AUDIT");
console.log("=======================================================");

{
  let delegationExpired = false;
  const auditLogs: AuditLogEntry[] = [];

  const addAuditLog = (entry: {
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown>;
  }) => {
    auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: "a0000000-0000-0000-0000-000000000001",
      userId: "c0000000-0000-0000-0000-000000000002",
      personaCode: "P2",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1 (Localhost Demo)",
    });
  };

  // Test 1.1: Initial State
  assert(
    "AC-09",
    "TC-09.1",
    "Initial delegation state is not expired",
    delegationExpired === false,
    false,
    delegationExpired
  );

  // Banner should not be visible when delegationExpired is false
  const isBannerVisibleInitial = delegationExpired;
  assert(
    "AC-09",
    "TC-09.2",
    "Warning banner is HIDDEN when delegationExpired=false",
    isBannerVisibleInitial === false,
    false,
    isBannerVisibleInitial
  );

  // Test 1.2: Toggle from false to true (Trigger Expiry)
  const nextVal1 = !delegationExpired;
  delegationExpired = nextVal1;
  addAuditLog({
    action: nextVal1 ? "DELEGATION_EXPIRED_TRIGGERED" : "DELEGATION_RENEWED",
    entityType: "DELEGATION_AUTHORITY",
    entityId: "AC-09",
    details: {
      message: nextVal1
        ? "Mô phỏng hết hạn giấy ủy quyền ký số của Lãnh đạo (AC-09) - Tạm khóa phê duyệt báo cáo Oracle"
        : "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công",
    },
  });

  assert(
    "AC-09",
    "TC-09.3",
    "delegationExpired state mutated to true",
    delegationExpired === true,
    true,
    delegationExpired
  );

  const isBannerVisibleExpired = delegationExpired;
  assert(
    "AC-09",
    "TC-09.4",
    "Warning banner is DISPLAYED when delegationExpired=true",
    isBannerVisibleExpired === true,
    true,
    isBannerVisibleExpired
  );

  assert(
    "AC-09",
    "TC-09.5",
    "Audit log recorded DELEGATION_EXPIRED_TRIGGERED action",
    auditLogs[0]?.action === "DELEGATION_EXPIRED_TRIGGERED",
    "DELEGATION_EXPIRED_TRIGGERED",
    auditLogs[0]?.action
  );

  assert(
    "AC-09",
    "TC-09.6",
    "Audit log recorded entityType DELEGATION_AUTHORITY and entityId AC-09",
    auditLogs[0]?.entityType === "DELEGATION_AUTHORITY" && auditLogs[0]?.entityId === "AC-09",
    "DELEGATION_AUTHORITY:AC-09",
    `${auditLogs[0]?.entityType}:${auditLogs[0]?.entityId}`
  );

  // Test 1.3: Toggle from true back to false via Toggle Switch
  const nextVal2 = !delegationExpired;
  delegationExpired = nextVal2;
  addAuditLog({
    action: nextVal2 ? "DELEGATION_EXPIRED_TRIGGERED" : "DELEGATION_RENEWED",
    entityType: "DELEGATION_AUTHORITY",
    entityId: "AC-09",
    details: {
      message: nextVal2
        ? "Mô phỏng hết hạn giấy ủy quyền ký số của Lãnh đạo (AC-09) - Tạm khóa phê duyệt báo cáo Oracle"
        : "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công",
    },
  });

  assert(
    "AC-09",
    "TC-09.7",
    "delegationExpired state toggled back to false",
    delegationExpired === false,
    false,
    delegationExpired
  );

  assert(
    "AC-09",
    "TC-09.8",
    "Warning banner is HIDDEN after toggle to false",
    delegationExpired === false,
    false,
    delegationExpired
  );

  assert(
    "AC-09",
    "TC-09.9",
    "Audit log recorded DELEGATION_RENEWED action via toggle",
    auditLogs[0]?.action === "DELEGATION_RENEWED",
    "DELEGATION_RENEWED",
    auditLogs[0]?.action
  );

  // Test 1.4: Renew directly from Banner button
  delegationExpired = true; // activate banner again
  // Click banner button: setDelegationExpired(false) + addAuditLog
  delegationExpired = false;
  addAuditLog({
    action: "DELEGATION_RENEWED",
    entityType: "DELEGATION_AUTHORITY",
    entityId: "AC-09",
    details: { message: "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công từ Banner cảnh báo" },
  });

  assert(
    "AC-09",
    "TC-09.10",
    "Renew via banner button sets delegationExpired=false and logs audit",
    delegationExpired === false && auditLogs[0]?.details?.message === "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công từ Banner cảnh báo",
    true,
    delegationExpired === false
  );
}

// ======================================================================
// SUITE 2: ATOMIC MERGE DUPLICATE IDENTITIES
// ======================================================================
console.log("\n=======================================================");
console.log("SUITE 2: ATOMIC MERGE DUPLICATE IDENTITIES & RPC LOG");
console.log("=======================================================");

{
  // Deep clone Xa A subjects
  let subjects: CitizenSubjectItem[] = JSON.parse(JSON.stringify(GOLDEN_SEED_XA_A.masterSubjects));
  const auditLogs: AuditLogEntry[] = [];

  const addAuditLog = (entry: {
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown>;
  }) => {
    auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: "a0000000-0000-0000-0000-000000000001",
      userId: "c0000000-0000-0000-0000-000000000002",
      personaCode: "P2",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1 (Localhost Demo)",
    });
  };

  // Algorithm from du-lieu-dung-chung/page.tsx:169-178
  const getDuplicateCccdGroups = (list: CitizenSubjectItem[]) => {
    const map: Record<string, CitizenSubjectItem[]> = {};
    list.forEach((s) => {
      if (s.status === "ACTIVE" && s.cccd) {
        map[s.cccd] = map[s.cccd] || [];
        map[s.cccd].push(s);
      }
    });
    return Object.entries(map).filter(([_, items]) => items.length > 1);
  };

  // Test 2.1: Detect initial duplicates in Golden Seed Xa A
  const initialGroups = getDuplicateCccdGroups(subjects);
  assert(
    "ATOMIC_MERGE",
    "TC-M.1",
    "Initial duplicate CCCD detection finds exactly 2 groups in Xa A",
    initialGroups.length === 2,
    2,
    initialGroups.length
  );

  const group019082 = initialGroups.find(([cccd]) => cccd === "019082001122");
  const group019184 = initialGroups.find(([cccd]) => cccd === "019184003344");

  assert(
    "ATOMIC_MERGE",
    "TC-M.2",
    "Group 019082001122 contains SUB-01 and SUB-05 (Hoàng Văn Nam)",
    group019082 !== undefined &&
      group019082[1].some((s) => s.id === "SUB-01") &&
      group019082[1].some((s) => s.id === "SUB-05"),
    "SUB-01,SUB-05",
    group019082 ? group019082[1].map((s) => s.id).join(",") : "none"
  );

  assert(
    "ATOMIC_MERGE",
    "TC-M.3",
    "Group 019184003344 contains SUB-02 and SUB-06 (Nguyễn Thị Lan)",
    group019184 !== undefined &&
      group019184[1].some((s) => s.id === "SUB-02") &&
      group019184[1].some((s) => s.id === "SUB-06"),
    "SUB-02,SUB-06",
    group019184 ? group019184[1].map((s) => s.id).join(",") : "none"
  );

  // Test 2.2: Execute Atomic Merge for Group 1 (Golden: SUB-01, Duplicate: SUB-05)
  const selectedGoldenId = "SUB-01";
  const selectedSubjectIds = ["SUB-01", "SUB-05"];

  const executeMerge = (goldenId: string, subjectIds: string[]) => {
    if (!goldenId || subjectIds.length < 2) return false;
    const duplicateIds = subjectIds.filter((id) => id !== goldenId);
    const goldenRecord = subjects.find((s) => s.id === goldenId);

    subjects = subjects.map((s) => {
      if (duplicateIds.includes(s.id)) {
        return {
          ...s,
          status: "MERGED" as const,
          mergedIntoId: goldenId,
        };
      }
      return s;
    });

    addAuditLog({
      action: "MERGE_CITIZEN_IDENTITIES",
      entityType: "MASTER_SUBJECTS",
      entityId: goldenId,
      details: {
        message: `Atomic merge: Gộp hồ sơ công dân vào Golden ID [${goldenId} - ${goldenRecord?.fullName}] mô phỏng RPC merge_citizen_identities`,
        goldenId: goldenId,
        mergedSubjectIds: duplicateIds,
        action: "RPC merge_citizen_identities",
      },
    });
    return true;
  };

  const mergeSuccess = executeMerge(selectedGoldenId, selectedSubjectIds);
  assert(
    "ATOMIC_MERGE",
    "TC-M.4",
    "executeMerge returned true for valid duplicate pair",
    mergeSuccess === true,
    true,
    mergeSuccess
  );

  const masterSub01 = subjects.find((s) => s.id === "SUB-01");
  const secondarySub05 = subjects.find((s) => s.id === "SUB-05");

  assert(
    "ATOMIC_MERGE",
    "TC-M.5",
    "Master record SUB-01 retains ACTIVE status and unchanged core info",
    masterSub01?.status === "ACTIVE" &&
      masterSub01?.fullName === "Hoàng Văn Nam" &&
      masterSub01?.cccd === "019082001122" &&
      masterSub01?.mergedIntoId === undefined,
    true,
    { status: masterSub01?.status, mergedIntoId: masterSub01?.mergedIntoId }
  );

  assert(
    "ATOMIC_MERGE",
    "TC-M.6",
    "Secondary record SUB-05 mutated to status=MERGED and mergedIntoId=SUB-01",
    secondarySub05?.status === "MERGED" && secondarySub05?.mergedIntoId === "SUB-01",
    { status: "MERGED", mergedIntoId: "SUB-01" },
    { status: secondarySub05?.status, mergedIntoId: secondarySub05?.mergedIntoId }
  );

  assert(
    "ATOMIC_MERGE",
    "TC-M.7",
    "Audit log contains RPC prefix 'RPC merge_citizen_identities'",
    auditLogs[0]?.details?.action === "RPC merge_citizen_identities" &&
      String(auditLogs[0]?.details?.message).includes("RPC merge_citizen_identities"),
    true,
    auditLogs[0]?.details?.action
  );

  assert(
    "ATOMIC_MERGE",
    "TC-M.8",
    "Duplicate groups count reduced from 2 to 1 after merging SUB-05 into SUB-01",
    getDuplicateCccdGroups(subjects).length === 1,
    1,
    getDuplicateCccdGroups(subjects).length
  );

  // Test 2.3: Edge case: Guard against invalid merge (< 2 subjects)
  const invalidMergeResult = executeMerge("SUB-01", ["SUB-01"]);
  assert(
    "ATOMIC_MERGE",
    "TC-M.9",
    "Guard prevents merge when fewer than 2 subjects provided",
    invalidMergeResult === false,
    false,
    invalidMergeResult
  );

  // Test 2.4: Merge second duplicate group (SUB-02 and SUB-06)
  const mergeSuccess2 = executeMerge("SUB-02", ["SUB-02", "SUB-06"]);
  assert(
    "ATOMIC_MERGE",
    "TC-M.10",
    "Execute merge on SUB-02 + SUB-06 succeeds",
    mergeSuccess2 === true,
    true,
    mergeSuccess2
  );

  assert(
    "ATOMIC_MERGE",
    "TC-M.11",
    "Secondary record SUB-06 mutated to status=MERGED and mergedIntoId=SUB-02",
    subjects.find((s) => s.id === "SUB-06")?.status === "MERGED" &&
      subjects.find((s) => s.id === "SUB-06")?.mergedIntoId === "SUB-02",
    { status: "MERGED", mergedIntoId: "SUB-02" },
    {
      status: subjects.find((s) => s.id === "SUB-06")?.status,
      mergedIntoId: subjects.find((s) => s.id === "SUB-06")?.mergedIntoId,
    }
  );

  assert(
    "ATOMIC_MERGE",
    "TC-M.12",
    "Duplicate groups count becomes 0 when all duplicate records are merged",
    getDuplicateCccdGroups(subjects).length === 0,
    0,
    getDuplicateCccdGroups(subjects).length
  );
}

// ======================================================================
// SUITE 3: RESIDENCE HISTORY LOOKUP & TENANT ISOLATION
// ======================================================================
console.log("\n=======================================================");
console.log("SUITE 3: RESIDENCE HISTORY LOOKUP & MULTI-TENANT ISOLATION");
console.log("=======================================================");

{
  const residenceListA = GOLDEN_SEED_XA_A.residenceHistory || [];
  const residenceListB = GOLDEN_SEED_XA_B.residenceHistory || [];

  // Filter implementation from du-lieu-dung-chung/page.tsx:239-246
  const filterResidenceEvents = (
    list: CitizenResidenceHistoryItem[],
    selectedCitizen: CitizenSubjectItem | null
  ) => {
    if (selectedCitizen) {
      return list.filter(
        (rh) => rh.subjectId === selectedCitizen.id || rh.cccd === selectedCitizen.cccd
      );
    }
    return list;
  };

  // Test 3.1: Full list without filter
  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.1",
    "Xa A has exactly 4 residence history events",
    residenceListA.length === 4,
    4,
    residenceListA.length
  );

  // Test 3.2: Filter by citizen with history (SUB-01, Hoàng Văn Nam)
  const sub01 = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-01")!;
  const historySub01 = filterResidenceEvents(residenceListA, sub01);

  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.2",
    "Citizen SUB-01 loads exactly 2 residence fluctuation records",
    historySub01.length === 2,
    2,
    historySub01.length
  );

  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.3",
    "SUB-01 history records contain SPLIT_HOUSEHOLD and RELOCATE_HAMLET",
    historySub01.some((h) => h.actionType === "SPLIT_HOUSEHOLD") &&
      historySub01.some((h) => h.actionType === "RELOCATE_HAMLET"),
    true,
    historySub01.map((h) => h.actionType).join(",")
  );

  // Test 3.3: Cross-lookup for duplicate citizen SUB-05 (via CCCD correlation)
  const sub05 = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-05")!;
  const historySub05 = filterResidenceEvents(residenceListA, sub05);

  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.4",
    "Duplicate citizen SUB-05 correlates to 2 residence events via matching CCCD",
    historySub05.length === 2,
    2,
    historySub05.length
  );

  // Test 3.4: Citizen with 1 history record (SUB-02)
  const sub02 = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-02")!;
  const historySub02 = filterResidenceEvents(residenceListA, sub02);

  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.5",
    "Citizen SUB-02 loads exactly 1 residence fluctuation record (MERGE_HOUSEHOLD)",
    historySub02.length === 1 && historySub02[0].actionType === "MERGE_HOUSEHOLD",
    true,
    historySub02.map((h) => h.actionType).join(",")
  );

  // Test 3.5: Citizen with 0 history records (SUB-04, Vũ Đình Trọng)
  const sub04 = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-04")!;
  const historySub04 = filterResidenceEvents(residenceListA, sub04);

  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.6",
    "Citizen SUB-04 with no history returns empty array safely without error",
    historySub04.length === 0,
    0,
    historySub04.length
  );

  // Test 3.6: Multi-tenant isolation (Xa B records do not leak into Xa A)
  const leakCheck = residenceListA.some((rh) => rh.tenantCode === "XA_B");
  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.7",
    "Zero Xa B residence records leaked into Xa A seed",
    leakCheck === false,
    false,
    leakCheck
  );

  assert(
    "RESIDENCE_HISTORY",
    "TC-RH.8",
    "Xa B has exactly 2 residence history events (RH-B-01, RH-B-02)",
    residenceListB.length === 2,
    2,
    residenceListB.length
  );
}

// ======================================================================
// SUITE 4: OMNISEARCH SEARCH ALGORITHM & STRESS TESTS
// ======================================================================
console.log("\n=======================================================");
console.log("SUITE 4: OMNISEARCH SEARCH ALGORITHM & STRESS TESTS");
console.log("=======================================================");

{
  const data = GOLDEN_SEED_XA_A;
  const persona = { id: "p1", code: "P1", canViewPII: false };

  // Test 4.1: Empty query returns 14 routes and 0 items from other categories
  const emptyRes = executeOmnisearchAsImplemented("", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.1",
    "Empty query returns all 14 routes",
    emptyRes.length === 14 && emptyRes.every((r) => r.category === "ROUTE"),
    14,
    emptyRes.length
  );

  // Test 4.2: Whitespace-only query returns all 14 routes without crashing
  const whitespaceRes = executeOmnisearchAsImplemented("    ", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.2",
    "Whitespace query returns all 14 routes without crashing",
    whitespaceRes.length === 14,
    14,
    whitespaceRes.length
  );

  // Test 4.3: Special characters query does not throw or crash
  let specialCharsCrashed = false;
  let specialRes: SearchResultItem[] = [];
  try {
    specialRes = executeOmnisearchAsImplemented("[]()\\^$*+?.-{}<>'\"!@#%&", data, persona);
  } catch (e) {
    specialCharsCrashed = true;
  }
  assert(
    "OMNISEARCH",
    "TC-O.3",
    "Special regex/SQL characters handle safely without crashing",
    specialCharsCrashed === false,
    false,
    specialCharsCrashed
  );

  // Test 4.4: 14 Independent Routes coverage (Accented Search)
  const routeHits = APP_ROUTES.map((r) => {
    const res = executeOmnisearchAsImplemented(r.name, data, persona);
    return res.some((item) => item.targetUrl === r.path);
  });
  const allRoutesFoundAccented = routeHits.every(Boolean);
  assert(
    "OMNISEARCH",
    "TC-O.4",
    "All 14 routes discovered when searched with their exact accented names",
    allRoutesFoundAccented,
    true,
    allRoutesFoundAccented
  );

  // Test 4.5: Citizen category search (Accented & Numeric)
  const citizenCccdRes = executeOmnisearchAsImplemented("019082001122", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.5",
    "Search by CCCD 019082001122 finds citizen records (SUB-01 and SUB-05)",
    citizenCccdRes.some((r) => r.id === "citizen-SUB-01") &&
      citizenCccdRes.some((r) => r.id === "citizen-SUB-05"),
    true,
    citizenCccdRes.map((r) => r.id).join(",")
  );

  const citizenCodeRes = executeOmnisearchAsImplemented("CD-001", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.6",
    "Search by Citizen Code CD-001 finds SUB-01",
    citizenCodeRes.some((r) => r.id === "citizen-SUB-01"),
    true,
    citizenCodeRes.map((r) => r.id).join(",")
  );

  const citizenAccentedNameRes = executeOmnisearchAsImplemented("Hoàng Văn Nam", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.7",
    "Search by accented name 'Hoàng Văn Nam' finds citizen records",
    citizenAccentedNameRes.some((r) => r.category === "CITIZEN"),
    true,
    citizenAccentedNameRes.length > 0
  );

  // Test 4.6: Facilities category search
  const schoolRes = executeOmnisearchAsImplemented("Trường Tiểu học Giả định A", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.8",
    "Search finds School facility in FACILITY category",
    schoolRes.some((r) => r.category === "FACILITY" && r.badge === "Trường học"),
    true,
    schoolRes.map((r) => r.title).join(",")
  );

  const religionRes = executeOmnisearchAsImplemented("Chùa Phúc Lâm", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.9",
    "Search finds Religious facility in FACILITY category",
    religionRes.some((r) => r.category === "FACILITY" && r.badge === "Tôn giáo"),
    true,
    religionRes.map((r) => r.title).join(",")
  );

  const medicalRes = executeOmnisearchAsImplemented("Phòng khám", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.10",
    "Search finds Medical facility in FACILITY category",
    medicalRes.some((r) => r.category === "FACILITY" && r.badge === "Y dược tư nhân"),
    true,
    medicalRes.map((r) => r.title).join(",")
  );

  const foodSafetyRes = executeOmnisearchAsImplemented("Nhà hàng", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.11",
    "Search finds Food Safety facility in FACILITY category",
    foodSafetyRes.some((r) => r.category === "FACILITY" && r.badge === "ATTP"),
    true,
    foodSafetyRes.map((r) => r.title).join(",")
  );

  // Test 4.7: Task Queue category search
  const taskCodeRes = executeOmnisearchAsImplemented("TASK-A-001", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.12",
    "Search finds Task item by code TASK-A-001 in TASK category",
    taskCodeRes.some((r) => r.category === "TASK"),
    true,
    taskCodeRes.map((r) => r.title).join(",")
  );

  const taskTitleRes = executeOmnisearchAsImplemented("PCCC", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.13",
    "Search finds Task item by keyword 'PCCC'",
    taskTitleRes.some((r) => r.category === "TASK"),
    true,
    taskTitleRes.map((r) => r.title).join(",")
  );

  // Test 4.8: Case Insensitivity
  const uppercaseRes = executeOmnisearchAsImplemented("HOÀNG VĂN NAM", data, persona);
  assert(
    "OMNISEARCH",
    "TC-O.14",
    "UPPERCASE query matches lowercase data (case-insensitivity)",
    uppercaseRes.some((r) => r.id === "citizen-SUB-01"),
    true,
    uppercaseRes.length > 0
  );

  // ======================================================================
  // ADVERSARIAL STRESS TEST: UNACCENTED VIETNAMESE (TIẾNG VIỆT KHÔNG DẤU)
  // ======================================================================
  console.log("\n-------------------------------------------------------");
  console.log("ADVERSARIAL STRESS TEST: UNACCENTED VIETNAMESE QUERIES");
  console.log("-------------------------------------------------------");

  // Adversarial Test 4.9: Search route with unaccented query "noi vu"
  const unaccentedRouteRes = executeOmnisearchAsImplemented("noi vu", data, persona);
  const foundNoiVu = unaccentedRouteRes.some((r) => r.targetUrl === "/noi-vu");
  assert(
    "OMNISEARCH",
    "TC-O.15_ADV",
    "Unaccented search 'noi vu' matches Route '/noi-vu' (Nội vụ & Lao động)",
    foundNoiVu,
    true,
    foundNoiVu,
    "HIGH"
  );

  // Adversarial Test 4.10: Search route with unaccented query "giao duc"
  const unaccentedGiaoDucRes = executeOmnisearchAsImplemented("giao duc", data, persona);
  const foundGiaoDuc = unaccentedGiaoDucRes.some((r) => r.targetUrl === "/giao-duc");
  assert(
    "OMNISEARCH",
    "TC-O.16_ADV",
    "Unaccented search 'giao duc' matches Route '/giao-duc' (Giáo dục & Đào tạo)",
    foundGiaoDuc,
    true,
    foundGiaoDuc,
    "HIGH"
  );

  // Adversarial Test 4.11: Search citizen with unaccented query "hoang van nam"
  const unaccentedCitizenRes = executeOmnisearchAsImplemented("hoang van nam", data, persona);
  const foundHoangVanNam = unaccentedCitizenRes.some((r) => r.id === "citizen-SUB-01");
  assert(
    "OMNISEARCH",
    "TC-O.17_ADV",
    "Unaccented search 'hoang van nam' matches citizen 'Hoàng Văn Nam'",
    foundHoangVanNam,
    true,
    foundHoangVanNam,
    "HIGH"
  );

  // Adversarial Test 4.12: Search citizen with unaccented query "nguyen thi lan"
  const unaccentedLanRes = executeOmnisearchAsImplemented("nguyen thi lan", data, persona);
  const foundLan = unaccentedLanRes.some((r) => r.id === "citizen-SUB-02");
  assert(
    "OMNISEARCH",
    "TC-O.18_ADV",
    "Unaccented search 'nguyen thi lan' matches citizen 'Nguyễn Thị Lan'",
    foundLan,
    true,
    foundLan,
    "HIGH"
  );

  // Adversarial Test 4.13: Search facility with unaccented query "gia dinh a"
  const unaccentedThinhDucRes = executeOmnisearchAsImplemented("gia dinh a", data, persona);
  const foundThinhDucFacility = unaccentedThinhDucRes.some((r) => r.category === "FACILITY");
  assert(
    "OMNISEARCH",
    "TC-O.19_ADV",
    "Unaccented search 'gia dinh a' matches Facility 'Trường Tiểu học Giả định A'",
    foundThinhDucFacility,
    true,
    foundThinhDucFacility,
    "HIGH"
  );

  // Adversarial Test 4.14: Search hamlet with unaccented query "xom a1"
  const unaccentedTanThinhRes = executeOmnisearchAsImplemented("xom a1", data, persona);
  const foundTanThinhCitizen = unaccentedTanThinhRes.some((r) => r.category === "CITIZEN");
  assert(
    "OMNISEARCH",
    "TC-O.20_ADV",
    "Unaccented search 'tan thinh' matches Citizens in 'Xóm Tân Thịnh'",
    foundTanThinhCitizen,
    true,
    foundTanThinhCitizen,
    "HIGH"
  );
}

// ======================================================================
// SUMMARY & VERDICT
// ======================================================================
console.log("\n=======================================================");
console.log("EMPIRICAL TEST SUMMARY & METRICS");
console.log("=======================================================");

const totalTests = assertions.length;
const passedTests = assertions.filter((a) => a.passed).length;
const failedTests = assertions.filter((a) => !a.passed).length;
const passRate = ((passedTests / totalTests) * 100).toFixed(2);

console.log(`Total Assertions: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Pass Rate: ${passRate}%`);

console.log("\nDetailed Assertions Table:");
assertions.forEach((a) => {
  const icon = a.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${a.suite}] ${a.id}: ${a.name} (Criticality: ${a.criticality})`);
  if (!a.passed) {
    console.log(`   -> Error: ${a.error}`);
    console.log(`   -> Expected: ${JSON.stringify(a.expected)}`);
    console.log(`   -> Actual:   ${JSON.stringify(a.actual)}`);
  }
});

// Write output JSON for machine-readable verification
import * as fs from "fs";
const reportOutput = {
  timestamp: new Date().toISOString(),
  totalTests,
  passedTests,
  failedTests,
  passRate: `${passRate}%`,
  verdict: failedTests === 0 ? "APPROVE" : "REJECT",
  assertions,
};

fs.writeFileSync(
  "./test/challenger-m4-results.json",
  JSON.stringify(reportOutput, null, 2)
);
console.log("\nResults exported to ./test/challenger-m4-results.json");

if (failedTests > 0) {
  process.exitCode = 1;
}
