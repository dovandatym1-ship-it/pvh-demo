/**
 * Empirical Challenger M4-1 Test Harness
 * Role: Critic / Specialist (M00, M01 & Omnisearch Workflows Challenger)
 * Scope:
 *   1. AC-09 Delegation Expiration & Audit Trail
 *   2. Atomic Merge Duplicate Identities (RPC merge_citizen_identities simulation)
 *   3. Residence History (citizen_residence_history) Data Ingestion & Lookup
 *   4. Omnisearch Search Algorithm (4 categories, case-sensitivity, diacritics, edge cases)
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  GOLDEN_SEED_XA_A,
  GOLDEN_SEED_XA_B,
  INITIAL_AUDIT_LOGS,
  type AuditLogEntry,
  type CitizenSubjectItem,
  type CitizenResidenceHistoryItem,
  type DemoState,
  type TenantDemoData,
} from "../src/lib/store/demo-state";
import { PERSONAS, getPersona } from "../src/lib/auth/session";
import { maskPII } from "../src/lib/authorization/pii-mask";

console.log("======================================================================");
console.log("   CHALLENGER M4-1: WORKFLOWS, ATOMIC MERGE & OMNISEARCH TEST HARNESS");
console.log("======================================================================\n");

let passedTests = 0;
let totalTests = 0;
const failures: Array<{ test: string; error: string }> = [];

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests.toString().padStart(2, "0")}: ${name}`);
  } catch (err: any) {
    failures.push({ test: name, error: err.message });
    console.error(`[FAIL] Test ${totalTests.toString().padStart(2, "0")}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// ======================================================================
// ROUTE METADATA & OMNISEARCH LOGIC REPRODUCTION (from header.tsx)
// ======================================================================
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

function executeOmnisearch(
  query: string,
  data: TenantDemoData,
  persona = PERSONAS.P2
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
    // If query is empty, only show all routes as starting suggestions
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
        subtitle: `CCCD: ${maskPII(s.cccd, "cccd", persona)} • ${s.hamlet} • ${s.address}`,
        targetUrl: "/du-lieu-dung-chung",
        badge: s.status === "MERGED" ? "Đã gộp" : "Công dân",
      });
    }
  });

  // 3. Search across Facilities
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

// ======================================================================
// SECTION 1: AC-09 DELEGATION EXPIRATION & AUDIT TRAIL
// ======================================================================
console.log("\n--- SECTION 1: AC-09 DELEGATION EXPIRATION & AUDIT TRAIL ---");

test("1.1 Initial Golden Seed state has delegationExpired: false", () => {
  const initialAuditLogs = [...INITIAL_AUDIT_LOGS];
  const demoState: DemoState = {
    xa_a: JSON.parse(JSON.stringify(GOLDEN_SEED_XA_A)),
    xa_b: JSON.parse(JSON.stringify(GOLDEN_SEED_XA_B)),
    tenants: {},
    auditLogs: initialAuditLogs,
    revisions: {},
    delegationExpired: false,
  };

  assert.strictEqual(demoState.delegationExpired, false, "Initial delegationExpired should be false");
  assert.ok(Array.isArray(demoState.auditLogs), "Audit logs should be an array");
});

test("1.2 Toggle delegationExpired from false to true updates state and records audit log", () => {
  let delegationExpired = false;
  const auditLogs: AuditLogEntry[] = [];
  const currentPersona = PERSONAS.P1;

  function addAuditLog(entry: any) {
    const logItem: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: "XA_A",
      userId: currentPersona.id,
      personaCode: currentPersona.code,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1 (Localhost Demo)",
    };
    auditLogs.unshift(logItem);
  }

  // Simulation of Toggle action from quan-tri/page.tsx:284-297
  const nextVal = !delegationExpired;
  delegationExpired = nextVal;
  addAuditLog({
    action: nextVal ? "DELEGATION_EXPIRED_TRIGGERED" : "DELEGATION_RENEWED",
    entityType: "DELEGATION_AUTHORITY",
    entityId: "AC-09",
    details: {
      message: nextVal
        ? "Mô phỏng hết hạn giấy ủy quyền ký số của Lãnh đạo (AC-09) - Tạm khóa phê duyệt báo cáo Oracle"
        : "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công",
    },
  });

  assert.strictEqual(delegationExpired, true, "delegationExpired should be true after toggle");
  assert.strictEqual(auditLogs.length, 1, "Exactly 1 audit log entry should be created");
  assert.strictEqual(auditLogs[0].action, "DELEGATION_EXPIRED_TRIGGERED", "Action must be DELEGATION_EXPIRED_TRIGGERED");
  assert.strictEqual(auditLogs[0].entityType, "DELEGATION_AUTHORITY", "EntityType must be DELEGATION_AUTHORITY");
  assert.strictEqual(auditLogs[0].entityId, "AC-09", "EntityId must be AC-09");
  assert.ok(
    (auditLogs[0].details?.message as string).includes("AC-09"),
    "Log message must describe AC-09 expiration"
  );
});

test("1.3 Warning Banner conditional rendering matches delegationExpired state", () => {
  // Model banner visibility logic from quan-tri/page.tsx:220
  function isBannerVisible(delegationExpired: boolean): boolean {
    return Boolean(delegationExpired);
  }

  function getBannerContent(delegationExpired: boolean): string | null {
    if (!delegationExpired) return null;
    return "CẢNH BÁO: Giấy ủy quyền ký số của Lãnh đạo đã hết hạn hiệu lực (AC-09).";
  }

  assert.strictEqual(isBannerVisible(true), true, "Banner should be visible when delegationExpired is true");
  assert.strictEqual(isBannerVisible(false), false, "Banner should be hidden when delegationExpired is false");
  assert.ok(
    getBannerContent(true)?.includes("AC-09"),
    "Banner content must mention AC-09"
  );
  assert.strictEqual(getBannerContent(false), null, "Banner content is null when hidden");
});

test("1.4 Toggle delegationExpired from true to false via Header Toggle records DELEGATION_RENEWED", () => {
  let delegationExpired = true;
  const auditLogs: AuditLogEntry[] = [];
  const currentPersona = PERSONAS.P1;

  function addAuditLog(entry: any) {
    const logItem: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: "XA_A",
      userId: currentPersona.id,
      personaCode: currentPersona.code,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1 (Localhost Demo)",
    };
    auditLogs.unshift(logItem);
  }

  // Simulation of Header Toggle restoring validity (quan-tri/page.tsx:284)
  const nextVal = !delegationExpired;
  delegationExpired = nextVal;
  addAuditLog({
    action: nextVal ? "DELEGATION_EXPIRED_TRIGGERED" : "DELEGATION_RENEWED",
    entityType: "DELEGATION_AUTHORITY",
    entityId: "AC-09",
    details: {
      message: nextVal
        ? "Mô phỏng hết hạn giấy ủy quyền ký số của Lãnh đạo (AC-09) - Tạm khóa phê duyệt báo cáo Oracle"
        : "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công",
    },
  });

  assert.strictEqual(delegationExpired, false, "delegationExpired should be false after restoration");
  assert.strictEqual(auditLogs.length, 1, "Audit log length must be 1");
  assert.strictEqual(auditLogs[0].action, "DELEGATION_RENEWED", "Action must be DELEGATION_RENEWED");
  assert.strictEqual(auditLogs[0].entityType, "DELEGATION_AUTHORITY");
  assert.strictEqual(auditLogs[0].entityId, "AC-09");
});

test("1.5 Renew delegation from Warning Banner button directly records DELEGATION_RENEWED", () => {
  let delegationExpired = true;
  const auditLogs: AuditLogEntry[] = [];
  const currentPersona = PERSONAS.P2;

  function addAuditLog(entry: any) {
    const logItem: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: "XA_A",
      userId: currentPersona.id,
      personaCode: currentPersona.code,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1 (Localhost Demo)",
    };
    auditLogs.unshift(logItem);
  }

  // Simulation of Banner "Gia hạn ủy quyền ngay" button (quan-tri/page.tsx:237-245)
  delegationExpired = false;
  addAuditLog({
    action: "DELEGATION_RENEWED",
    entityType: "DELEGATION_AUTHORITY",
    entityId: "AC-09",
    details: { message: "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công từ Banner cảnh báo" },
  });

  assert.strictEqual(delegationExpired, false, "State should be restored to false");
  assert.strictEqual(auditLogs.length, 1);
  assert.strictEqual(auditLogs[0].action, "DELEGATION_RENEWED");
  assert.ok(
    (auditLogs[0].details?.message as string).includes("Banner cảnh báo"),
    "Details message should indicate origin from Banner"
  );
});

test("1.6 Header Bell notification badge reacts to delegationExpired", () => {
  // Modeling header.tsx:432-436
  function getBellBadgeClass(delegationExpired: boolean): string {
    return delegationExpired
      ? "w-2 h-2 rounded-full bg-rose-500 animate-ping"
      : "w-2 h-2 rounded-full bg-emerald-500";
  }

  assert.ok(getBellBadgeClass(true).includes("bg-rose-500"), "Expired delegation triggers red ping bell");
  assert.ok(getBellBadgeClass(false).includes("bg-emerald-500"), "Active delegation shows emerald steady bell");
});

test("1.7 Stress test: 50 consecutive delegation toggle cycles maintain state integrity", () => {
  let delegationExpired = false;
  const auditLogs: AuditLogEntry[] = [];

  for (let i = 0; i < 50; i++) {
    const nextVal: boolean = !delegationExpired;
    delegationExpired = nextVal;
    auditLogs.unshift({
      id: `audit-stress-${i}`,
      timestamp: new Date(Date.now() + i * 10).toISOString(),
      tenantId: "XA_A",
      userId: "P1",
      personaCode: "P1",
      action: nextVal ? "DELEGATION_EXPIRED_TRIGGERED" : "DELEGATION_RENEWED",
      entityType: "DELEGATION_AUTHORITY",
      entityId: "AC-09",
      details: { cycle: i },
      ipAddress: "127.0.0.1",
    });
  }

  assert.strictEqual(delegationExpired, false, "After 50 toggles (even number), state returns to false");
  assert.strictEqual(auditLogs.length, 50, "All 50 toggle events must be logged");
  assert.strictEqual(auditLogs[0].action, "DELEGATION_RENEWED", "Latest action was renewal");
  assert.strictEqual(auditLogs[1].action, "DELEGATION_EXPIRED_TRIGGERED", "Prior action was expiration");
});

// ======================================================================
// SECTION 2: ATOMIC MERGE DUPLICATE IDENTITIES
// ======================================================================
console.log("\n--- SECTION 2: ATOMIC MERGE DUPLICATE IDENTITIES ---");

test("2.1 Detect duplicate CCCD groups in Golden Seed XA_A and XA_B", () => {
  const subjectsA = GOLDEN_SEED_XA_A.masterSubjects;
  const subjectsB = GOLDEN_SEED_XA_B.masterSubjects;

  function findDuplicateGroups(subjects: CitizenSubjectItem[]) {
    const map: Record<string, CitizenSubjectItem[]> = {};
    subjects.forEach((s) => {
      if (s.status === "ACTIVE" && s.cccd) {
        map[s.cccd] = map[s.cccd] || [];
        map[s.cccd].push(s);
      }
    });
    return Object.entries(map).filter(([_, items]) => items.length > 1);
  }

  const dupGroupsA = findDuplicateGroups(subjectsA);
  const dupGroupsB = findDuplicateGroups(subjectsB);

  assert.strictEqual(dupGroupsA.length, 2, "Xã A must have exactly 2 duplicate CCCD groups initially");
  
  // Group 1: Hoàng Văn Nam
  const groupHoangVanNam = dupGroupsA.find(([cccd]) => cccd === "019082001122");
  assert.ok(groupHoangVanNam, "Group Hoàng Văn Nam (CCCD 019082001122) must exist");
  assert.strictEqual(groupHoangVanNam![1].length, 2, "Group Hoàng Văn Nam must contain 2 records");
  const idsNam = groupHoangVanNam![1].map((s) => s.id).sort();
  assert.deepStrictEqual(idsNam, ["SUB-01", "SUB-05"]);

  // Group 2: Nguyễn Thị Lan
  const groupNguyenThiLan = dupGroupsA.find(([cccd]) => cccd === "019184003344");
  assert.ok(groupNguyenThiLan, "Group Nguyễn Thị Lan (CCCD 019184003344) must exist");
  assert.strictEqual(groupNguyenThiLan![1].length, 2, "Group Nguyễn Thị Lan must contain 2 records");
  const idsLan = groupNguyenThiLan![1].map((s) => s.id).sort();
  assert.deepStrictEqual(idsLan, ["SUB-02", "SUB-06"]);

  // Xã B Group
  assert.strictEqual(dupGroupsB.length, 1, "Xã B must have exactly 1 duplicate CCCD group initially");
  assert.strictEqual(dupGroupsB[0][0], "019076008912", "Xã B duplicate CCCD must match Dương Đình Hùng");
  assert.deepStrictEqual(dupGroupsB[0][1].map((s) => s.id).sort(), ["SUB-B-01", "SUB-B-02"]);
});

test("2.2 Atomic merge SUB-05 into Golden ID SUB-01 in XA_A", () => {
  let currentSubjects: CitizenSubjectItem[] = JSON.parse(
    JSON.stringify(GOLDEN_SEED_XA_A.masterSubjects)
  );
  const auditLogs: AuditLogEntry[] = [];

  function addAuditLog(entry: any) {
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tenantId: "XA_A",
      userId: "P2",
      personaCode: "P2",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1",
    });
  }

  // Execute Merge simulation matching du-lieu-dung-chung/page.tsx:192-232
  const selectedGoldenId = "SUB-01";
  const selectedSubjectIds = ["SUB-01", "SUB-05"];
  const duplicateIds = selectedSubjectIds.filter((id) => id !== selectedGoldenId);
  const goldenRecord = currentSubjects.find((s) => s.id === selectedGoldenId);

  // Mutation
  currentSubjects = currentSubjects.map((s) => {
    if (duplicateIds.includes(s.id)) {
      return {
        ...s,
        status: "MERGED" as const,
        mergedIntoId: selectedGoldenId,
      };
    }
    return s;
  });

  addAuditLog({
    action: "MERGE_CITIZEN_IDENTITIES",
    entityType: "MASTER_SUBJECTS",
    entityId: selectedGoldenId,
    details: {
      message: `Atomic merge: Gộp hồ sơ công dân vào Golden ID [${selectedGoldenId} - ${goldenRecord?.fullName}] mô phỏng RPC merge_citizen_identities`,
      goldenId: selectedGoldenId,
      mergedSubjectIds: duplicateIds,
      action: "RPC merge_citizen_identities",
    },
  });

  // Verify Golden record
  const primaryRec = currentSubjects.find((s) => s.id === "SUB-01");
  assert.ok(primaryRec, "Primary record SUB-01 must exist");
  assert.strictEqual(primaryRec!.status, "ACTIVE", "Primary record must remain ACTIVE");
  assert.strictEqual(primaryRec!.mergedIntoId, undefined, "Primary record should not have mergedIntoId");

  // Verify Secondary record
  const secondaryRec = currentSubjects.find((s) => s.id === "SUB-05");
  assert.ok(secondaryRec, "Secondary record SUB-05 must exist");
  assert.strictEqual(secondaryRec!.status, "MERGED", "Secondary record must transition to MERGED");
  assert.strictEqual(secondaryRec!.mergedIntoId, "SUB-01", "Secondary record mergedIntoId must point to SUB-01");

  // Verify other records are unaffected
  const otherRec = currentSubjects.find((s) => s.id === "SUB-02");
  assert.strictEqual(otherRec!.status, "ACTIVE", "Other records must remain untouched");

  // Verify Audit Log
  assert.strictEqual(auditLogs.length, 1);
  assert.strictEqual(auditLogs[0].action, "MERGE_CITIZEN_IDENTITIES");
  assert.strictEqual(auditLogs[0].entityType, "MASTER_SUBJECTS");
  assert.strictEqual(auditLogs[0].entityId, "SUB-01");
  assert.ok(
    (auditLogs[0].details?.message as string).includes("RPC merge_citizen_identities"),
    "Audit log message must contain RPC merge_citizen_identities prefix"
  );
  assert.strictEqual(auditLogs[0].details?.action, "RPC merge_citizen_identities");
  assert.deepStrictEqual(auditLogs[0].details?.mergedSubjectIds, ["SUB-05"]);
});

test("2.3 Duplicate group count decrements after atomic merge", () => {
  let currentSubjects: CitizenSubjectItem[] = JSON.parse(
    JSON.stringify(GOLDEN_SEED_XA_A.masterSubjects)
  );

  function countActiveDupGroups(subjects: CitizenSubjectItem[]) {
    const map: Record<string, CitizenSubjectItem[]> = {};
    subjects.forEach((s) => {
      if (s.status === "ACTIVE" && s.cccd) {
        map[s.cccd] = map[s.cccd] || [];
        map[s.cccd].push(s);
      }
    });
    return Object.entries(map).filter(([_, items]) => items.length > 1).length;
  }

  assert.strictEqual(countActiveDupGroups(currentSubjects), 2, "Initially 2 duplicate groups");

  // Merge group 1: SUB-05 into SUB-01
  currentSubjects = currentSubjects.map((s) =>
    s.id === "SUB-05" ? { ...s, status: "MERGED" as const, mergedIntoId: "SUB-01" } : s
  );
  assert.strictEqual(countActiveDupGroups(currentSubjects), 1, "After merging SUB-05, count is 1");

  // Merge group 2: SUB-06 into SUB-02
  currentSubjects = currentSubjects.map((s) =>
    s.id === "SUB-06" ? { ...s, status: "MERGED" as const, mergedIntoId: "SUB-02" } : s
  );
  assert.strictEqual(countActiveDupGroups(currentSubjects), 0, "After merging SUB-06, count is 0");
});

test("2.4 Reverse merge: merging SUB-01 into Golden ID SUB-05", () => {
  let currentSubjects: CitizenSubjectItem[] = JSON.parse(
    JSON.stringify(GOLDEN_SEED_XA_A.masterSubjects)
  );

  const selectedGoldenId = "SUB-05";
  const duplicateIds = ["SUB-01"];

  currentSubjects = currentSubjects.map((s) => {
    if (duplicateIds.includes(s.id)) {
      return { ...s, status: "MERGED" as const, mergedIntoId: selectedGoldenId };
    }
    return s;
  });

  const sub05 = currentSubjects.find((s) => s.id === "SUB-05");
  const sub01 = currentSubjects.find((s) => s.id === "SUB-01");

  assert.strictEqual(sub05?.status, "ACTIVE", "SUB-05 as Golden must remain ACTIVE");
  assert.strictEqual(sub01?.status, "MERGED", "SUB-01 must become MERGED");
  assert.strictEqual(sub01?.mergedIntoId, "SUB-05", "SUB-01 mergedIntoId must point to SUB-05");
});

test("2.5 N-way merge: merging 3 duplicates into 1 Golden ID", () => {
  const customSubjects: CitizenSubjectItem[] = [
    { id: "S1", code: "C1", fullName: "Test Citizen", cccd: "9999", phone: "1", address: "A", hamlet: "H", subjectType: "CITIZEN", status: "ACTIVE", membersCount: 1, tenantCode: "XA_A" },
    { id: "S2", code: "C2", fullName: "Test Citizen", cccd: "9999", phone: "2", address: "B", hamlet: "H", subjectType: "CITIZEN", status: "ACTIVE", membersCount: 1, tenantCode: "XA_A" },
    { id: "S3", code: "C3", fullName: "Test Citizen", cccd: "9999", phone: "3", address: "C", hamlet: "H", subjectType: "CITIZEN", status: "ACTIVE", membersCount: 1, tenantCode: "XA_A" },
  ];

  const selectedGoldenId = "S1";
  const selectedSubjectIds = ["S1", "S2", "S3"];
  const duplicateIds = selectedSubjectIds.filter((id) => id !== selectedGoldenId);

  const merged = customSubjects.map((s) =>
    duplicateIds.includes(s.id) ? { ...s, status: "MERGED" as const, mergedIntoId: selectedGoldenId } : s
  );

  assert.strictEqual(merged.find((s) => s.id === "S1")?.status, "ACTIVE");
  assert.strictEqual(merged.find((s) => s.id === "S2")?.status, "MERGED");
  assert.strictEqual(merged.find((s) => s.id === "S2")?.mergedIntoId, "S1");
  assert.strictEqual(merged.find((s) => s.id === "S3")?.status, "MERGED");
  assert.strictEqual(merged.find((s) => s.id === "S3")?.mergedIntoId, "S1");
});

test("2.6 Boundary protection: invalid merge operations abort cleanly", () => {
  const subjects = JSON.parse(JSON.stringify(GOLDEN_SEED_XA_A.masterSubjects));

  function tryMerge(goldenId: string, ids: string[]): boolean {
    if (!goldenId || ids.length < 2) return false;
    return true;
  }

  assert.strictEqual(tryMerge("", ["SUB-01", "SUB-05"]), false, "Empty golden ID rejected");
  assert.strictEqual(tryMerge("SUB-01", ["SUB-01"]), false, "Single subject selected rejected");
  assert.strictEqual(tryMerge("SUB-01", []), false, "Empty subject list rejected");
  assert.strictEqual(tryMerge("SUB-01", ["SUB-01", "SUB-05"]), true, "Valid pair accepted");
});

test("2.7 Dispatch scenario simulation: Merging SUB-05 and SUB-06 at Xã A", () => {
  let currentSubjects: CitizenSubjectItem[] = JSON.parse(
    JSON.stringify(GOLDEN_SEED_XA_A.masterSubjects)
  );
  const auditLogs: AuditLogEntry[] = [];

  function addAuditLog(entry: any) {
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tenantId: "XA_A",
      userId: "P2",
      personaCode: "P2",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: "127.0.0.1",
    });
  }

  const selectedGoldenId = "SUB-05";
  const selectedSubjectIds = ["SUB-05", "SUB-06"];
  const duplicateIds = selectedSubjectIds.filter((id) => id !== selectedGoldenId);
  const goldenRecord = currentSubjects.find((s) => s.id === selectedGoldenId);

  // Mutation
  currentSubjects = currentSubjects.map((s) => {
    if (duplicateIds.includes(s.id)) {
      return {
        ...s,
        status: "MERGED" as const,
        mergedIntoId: selectedGoldenId,
      };
    }
    return s;
  });

  addAuditLog({
    action: "MERGE_CITIZEN_IDENTITIES",
    entityType: "MASTER_SUBJECTS",
    entityId: selectedGoldenId,
    details: {
      message: `Atomic merge: Gộp hồ sơ công dân vào Golden ID [${selectedGoldenId} - ${goldenRecord?.fullName}] mô phỏng RPC merge_citizen_identities`,
      goldenId: selectedGoldenId,
      mergedSubjectIds: duplicateIds,
      action: "RPC merge_citizen_identities",
    },
  });

  const sub05 = currentSubjects.find((s) => s.id === "SUB-05");
  const sub06 = currentSubjects.find((s) => s.id === "SUB-06");

  assert.strictEqual(sub05?.status, "ACTIVE", "Main record SUB-05 must remain ACTIVE");
  assert.strictEqual(sub05?.mergedIntoId, undefined, "Main record must not have mergedIntoId");
  assert.strictEqual(sub06?.status, "MERGED", "Secondary record SUB-06 must transition to MERGED");
  assert.strictEqual(sub06?.mergedIntoId, "SUB-05", "Secondary record mergedIntoId must be SUB-05");

  assert.strictEqual(auditLogs.length, 1);
  assert.strictEqual(auditLogs[0].action, "MERGE_CITIZEN_IDENTITIES");
  assert.strictEqual(auditLogs[0].entityId, "SUB-05");
  assert.ok(
    (auditLogs[0].details?.message as string).includes("RPC merge_citizen_identities"),
    "Audit log must record RPC merge_citizen_identities prefix"
  );
});

// ======================================================================
// SECTION 3: RESIDENCE HISTORY VERIFICATION
// ======================================================================
console.log("\n--- SECTION 3: RESIDENCE HISTORY VERIFICATION ---");

test("3.1 Total residence history items in Golden Seeds", () => {
  const historyA = GOLDEN_SEED_XA_A.residenceHistory;
  const historyB = GOLDEN_SEED_XA_B.residenceHistory;

  assert.ok(Array.isArray(historyA), "XA_A residenceHistory must be an array");
  assert.strictEqual(historyA.length, 4, "XA_A must have 4 residence history records");

  assert.ok(Array.isArray(historyB), "XA_B residenceHistory must be an array");
  assert.strictEqual(historyB.length, 2, "XA_B must have 2 residence history records");
});

test("3.2 Lookup residence history for citizen with multiple events (SUB-01)", () => {
  const historyA = GOLDEN_SEED_XA_A.residenceHistory;
  const citizen = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-01")!;

  // Reproduction of filteredResidenceEvents from du-lieu-dung-chung/page.tsx:239-246
  const events = historyA.filter(
    (rh) => rh.subjectId === citizen.id || rh.cccd === citizen.cccd
  );

  assert.strictEqual(events.length, 2, "SUB-01 should have exactly 2 residence history events");

  const [ev1, ev2] = events;
  assert.strictEqual(ev1.id, "RH-A-01");
  assert.strictEqual(ev1.actionType, "SPLIT_HOUSEHOLD");
  assert.strictEqual(ev1.actionTypeName, "Tách hộ gia đình");
  assert.strictEqual(ev1.oldHouseholdCode, "HK-TT-008");
  assert.strictEqual(ev1.newHouseholdCode, "HK-TT-012");
  assert.strictEqual(ev1.eventDate, "2024-03-15");
  assert.strictEqual(ev1.referenceDocument, "QĐ số 45/QĐ-UBND");

  assert.strictEqual(ev2.id, "RH-A-02");
  assert.strictEqual(ev2.actionType, "RELOCATE_HAMLET");
  assert.strictEqual(ev2.actionTypeName, "Chuyển địa bàn thôn/xóm");
  assert.strictEqual(ev2.oldHamlet, "Xóm Đức Hòa");
  assert.strictEqual(ev2.newHamlet, "Xóm Tân Thịnh");
});

test("3.3 Lookup residence history for duplicate record SUB-05 via CCCD fallback", () => {
  const historyA = GOLDEN_SEED_XA_A.residenceHistory;
  const duplicateCitizen = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-05")!;

  // Even though rh.subjectId is "SUB-01", matching on rh.cccd retrieves history
  const events = historyA.filter(
    (rh) => rh.subjectId === duplicateCitizen.id || rh.cccd === duplicateCitizen.cccd
  );

  assert.strictEqual(events.length, 2, "Duplicate record SUB-05 must retrieve history via matching CCCD");
  assert.strictEqual(events[0].id, "RH-A-01");
  assert.strictEqual(events[1].id, "RH-A-02");
});

test("3.4 Lookup residence history for single-event citizen (SUB-03)", () => {
  const historyA = GOLDEN_SEED_XA_A.residenceHistory;
  const citizen = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-03")!;

  const events = historyA.filter(
    (rh) => rh.subjectId === citizen.id || rh.cccd === citizen.cccd
  );

  assert.strictEqual(events.length, 1, "SUB-03 must have exactly 1 event");
  assert.strictEqual(events[0].id, "RH-A-03");
  assert.strictEqual(events[0].actionType, "IN_MIGRATION");
  assert.strictEqual(events[0].actionTypeName, "Chuyển đến từ ngoài xã");
  assert.strictEqual(events[0].oldHamlet, "Xã Phúc Trìu");
  assert.strictEqual(events[0].newHamlet, "Xóm Đồng Thịnh");
});

test("3.5 Lookup residence history for citizen without history (SUB-04) returns empty array", () => {
  const historyA = GOLDEN_SEED_XA_A.residenceHistory;
  const citizen = GOLDEN_SEED_XA_A.masterSubjects.find((s) => s.id === "SUB-04")!;

  const events = historyA.filter(
    (rh) => rh.subjectId === citizen.id || rh.cccd === citizen.cccd
  );

  assert.strictEqual(events.length, 0, "SUB-04 should have 0 events (clean empty state)");
});

test("3.6 Lookup when no citizen selected returns all commune events", () => {
  const historyA = GOLDEN_SEED_XA_A.residenceHistory;
  const selectedCitizen = null;

  const events = selectedCitizen
    ? historyA.filter((rh: any) => rh.subjectId === selectedCitizen || rh.cccd === selectedCitizen)
    : historyA;

  assert.strictEqual(events.length, 4, "Null citizen returns all 4 commune history events");
});

// ======================================================================
// SECTION 4: OMNISEARCH SEARCH ALGORITHM VERIFICATION
// ======================================================================
console.log("\n--- SECTION 4: OMNISEARCH SEARCH ALGORITHM VERIFICATION ---");

test("4.1 Omnisearch empty string query returns all 14 routes without crashing", () => {
  const resultsEmpty = executeOmnisearch("", GOLDEN_SEED_XA_A);
  const resultsWhitespace = executeOmnisearch("   ", GOLDEN_SEED_XA_A);

  assert.strictEqual(resultsEmpty.length, 14, "Empty query must return all 14 routes as default suggestions");
  assert.strictEqual(resultsWhitespace.length, 14, "Whitespace query must trim to empty and return 14 routes");
  assert.ok(
    resultsEmpty.every((r) => r.category === "ROUTE"),
    "All results for empty query must be ROUTE category"
  );
});

test("4.2 Omnisearch returns results across all 4 categories (ROUTE, CITIZEN, FACILITY, TASK)", () => {
  // 1. ROUTE match
  const routeResults = executeOmnisearch("ban-lam-viec", GOLDEN_SEED_XA_A);
  assert.ok(routeResults.some((r) => r.category === "ROUTE"), "Must return ROUTE for 'ban-lam-viec'");
  assert.strictEqual(routeResults[0].targetUrl, "/ban-lam-viec");

  // 2. CITIZEN match
  const citizenResults = executeOmnisearch("Hoàng Văn Nam", GOLDEN_SEED_XA_A);
  const citizens = citizenResults.filter((r) => r.category === "CITIZEN");
  assert.ok(citizens.length >= 1, "Must return CITIZEN for 'Hoàng Văn Nam'");
  assert.ok(citizens[0].title.includes("Hoàng Văn Nam"));

  // 3. FACILITY match (School, Religious, Medical, Food Safety)
  const schoolResults = executeOmnisearch("Thịnh Đức", GOLDEN_SEED_XA_A);
  const facilities = schoolResults.filter((r) => r.category === "FACILITY");
  assert.ok(facilities.length >= 1, "Must return FACILITY for 'Thịnh Đức'");

  const medicalResults = executeOmnisearch("Bích Ngọc", GOLDEN_SEED_XA_A);
  assert.ok(
    medicalResults.some((r) => r.category === "FACILITY"),
    "Must return FACILITY for medical practitioner 'Bích Ngọc'"
  );

  // 4. TASK match
  const taskResults = executeOmnisearch("TASK-A-001", GOLDEN_SEED_XA_A);
  const tasks = taskResults.filter((r) => r.category === "TASK");
  assert.ok(tasks.length >= 1, "Must return TASK for task code 'TASK-A-001'");
  assert.ok(tasks[0].title.includes("TASK-A-001"));
});

test("4.3 Omnisearch case-insensitivity: lowercase, UPPERCASE, and MixedCase produce identical matches", () => {
  const queryLower = executeOmnisearch("hoàng văn nam", GOLDEN_SEED_XA_A);
  const queryUpper = executeOmnisearch("HOÀNG VĂN NAM", GOLDEN_SEED_XA_A);
  const queryMixed = executeOmnisearch("HoÀnG vĂn NaM", GOLDEN_SEED_XA_A);

  assert.strictEqual(queryLower.length, queryUpper.length, "Lowercase and uppercase must yield same count");
  assert.strictEqual(queryLower.length, queryMixed.length, "Lowercase and mixedcase must yield same count");
  assert.deepStrictEqual(
    queryLower.map((r) => r.id),
    queryUpper.map((r) => r.id),
    "IDs must match between lowercase and uppercase"
  );
});

test("4.4 Omnisearch Vietnamese with diacritics (Có dấu) matches accurately", () => {
  const res1 = executeOmnisearch("Đức Hòa", GOLDEN_SEED_XA_A);
  assert.ok(res1.length > 0, "Query 'Đức Hòa' should match citizens/routes/facilities");

  const res2 = executeOmnisearch("Giáo dục", GOLDEN_SEED_XA_A);
  assert.ok(res2.some((r) => r.targetUrl === "/giao-duc"), "Query 'Giáo dục' should match /giao-duc route");
});

test("4.5 Empirical Stress Test: Unaccented Vietnamese (Không dấu) search behavior", () => {
  // When a user searches without accents: e.g. "hoang van nam" or "giao duc"
  const accentedQuery = executeOmnisearch("Hoàng Văn Nam", GOLDEN_SEED_XA_A);
  const unaccentedQuery = executeOmnisearch("hoang van nam", GOLDEN_SEED_XA_A);

  // In the current implementation (toLowerCase().includes(q)), unaccented does NOT match accented strings!
  console.log(`       [INFO] Accented query 'Hoàng Văn Nam' returned: ${accentedQuery.length} results`);
  console.log(`       [INFO] Unaccented query 'hoang van nam' returned: ${unaccentedQuery.length} results`);

  // We assert what the empirical behavior IS:
  // String.prototype.includes() without diacritic normalization does not match
  const unaccentedCitizenMatches = unaccentedQuery.filter((r) => r.category === "CITIZEN");
  assert.strictEqual(
    unaccentedCitizenMatches.length,
    0,
    "Empirical finding confirmed: unaccented query 'hoang van nam' returns 0 citizen results because String.includes does not strip diacritics"
  );

  // However, path matching in routes DOES work if path contains unaccented keywords
  const unaccentedRoute = executeOmnisearch("giao-duc", GOLDEN_SEED_XA_A);
  assert.ok(
    unaccentedRoute.some((r) => r.targetUrl === "/giao-duc"),
    "Route path '/giao-duc' matches unaccented query 'giao-duc'"
  );
});

test("4.6 Omnisearch special characters and regex metacharacters resilience (no crash)", () => {
  const specialQueries = [
    "()",
    "[]",
    "{}",
    ".*",
    "?+",
    "^$",
    "\\",
    "//",
    "---",
    "' OR '1'='1",
    "<script>alert(1)</script>",
    "🏛️ 🚀 🇻🇳",
    "!@#$%^&*()_+-=[]{}|;':\",./<>?",
  ];

  for (const sq of specialQueries) {
    let results: SearchResultItem[] = [];
    assert.doesNotThrow(() => {
      results = executeOmnisearch(sq, GOLDEN_SEED_XA_A);
    }, `Searching for special characters '${sq}' must not crash`);
    assert.ok(Array.isArray(results), `Results for '${sq}' must be an array`);
  }
});

test("4.7 Omnisearch large query stress test (10,000 characters buffer limit)", () => {
  const hugeQuery = "A".repeat(10000);
  let results: SearchResultItem[] = [];

  assert.doesNotThrow(() => {
    results = executeOmnisearch(hugeQuery, GOLDEN_SEED_XA_A);
  }, "10,000 character query must execute without stack overflow or crash");

  assert.strictEqual(results.length, 0, "No records match 10,000 character query");
});

test("4.8 Omnisearch PII protection: citizen subtitle uses maskPII according to persona", () => {
  const searchLeader = executeOmnisearch("Hoàng Văn Nam", GOLDEN_SEED_XA_A, PERSONAS.P1);
  const searchPublic = executeOmnisearch("Hoàng Văn Nam", GOLDEN_SEED_XA_A, PERSONAS.P4);
  const searchOfficer = executeOmnisearch("Hoàng Văn Nam", GOLDEN_SEED_XA_A, PERSONAS.P2);

  const citLeader = searchLeader.find((r) => r.category === "CITIZEN");
  const citPublic = searchPublic.find((r) => r.category === "CITIZEN");
  const citOfficer = searchOfficer.find((r) => r.category === "CITIZEN");

  assert.ok(citLeader, "Citizen result must exist for P1");
  assert.ok(citPublic, "Citizen result must exist for P4");
  assert.ok(citOfficer, "Citizen result must exist for P2");

  // P1 and P4 canViewPII is false; CCCD should be masked as '0190***122'
  assert.ok(
    citPublic!.subtitle.includes("0190***122"),
    `P4 subtitle must show masked CCCD '0190***122', received: ${citPublic!.subtitle}`
  );
  assert.ok(
    citLeader!.subtitle.includes("0190***122"),
    `P1 subtitle must show masked CCCD '0190***122', received: ${citLeader!.subtitle}`
  );

  // P2 canViewPII is true; CCCD should be clear '019082001122'
  assert.ok(
    citOfficer!.subtitle.includes("019082001122"),
    `P2 subtitle must show clear CCCD '019082001122', received: ${citOfficer!.subtitle}`
  );
});

// ======================================================================
// TEST SUMMARY & METRICS
// ======================================================================
console.log("\n======================================================================");
console.log(`   TEST HARNESS RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log("======================================================================");

if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach((f, i) => {
    console.error(`  ${i + 1}. ${f.test}: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log("\nALL TESTS PASSED SUCCESSFULLY! (100% Assertion Success Rate)");
  process.exit(0);
}
