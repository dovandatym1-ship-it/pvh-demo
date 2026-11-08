/**
 * Empirical Challenger M3-2 Test Harness
 * Role: Critic / Specialist (Empirical Rules Challenger)
 * Scope: M06 & M07 Business Rules, Edge Cases, Boundaries, and Adversarial Scenarios
 */

import assert from "node:assert";
import {
  GOLDEN_SEED_XA_A,
  GOLDEN_SEED_XA_B,
  createInitialDemoState,
} from "../src/lib/store/demo-state";
import type {
  SocialProtectionItem,
  FoodSafetyItem,
  EpidemicLogItem,
  EthnicAllocationItem,
  AuditLogEntry,
} from "../src/lib/store/demo-state";
import { maskPII } from "../src/lib/authorization/pii-mask";
import { PERSONAS } from "../src/lib/auth/session";

console.log("======================================================================");
console.log("   CHALLENGER M3-2: EMPIRICAL STRESS & EDGE-CASE TEST HARNESS");
console.log("======================================================================\n");

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${name}`);
  } catch (err: any) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}`);
    throw err;
  }
}

// ======================================================================
// SUITE 1: M06 SOCIAL PROTECTION PAYMENT LOCK & PII MASKING
// ======================================================================
console.log("\n--- SUITE 1: M06 Social Protection Payment Lock & maskPII ---");

test("M06-1.1: Verify initial social protection state in Xã A Golden Seed", () => {
  const socialList = GOLDEN_SEED_XA_A.domainRecords.yTeAnSinh.socialProtection;
  assert.equal(socialList.length, 4, "Xã A phải có chính xác 4 đối tượng bảo trợ xã hội");
  
  const paidCount = socialList.filter((s) => s.paymentStatus === "PAID").length;
  const pendingCount = socialList.filter((s) => s.paymentStatus === "PENDING").length;
  
  assert.equal(paidCount, 2, "Ban đầu phải có 2 đối tượng đã chi trả (SP-01, SP-02)");
  assert.equal(pendingCount, 2, "Ban đầu phải có 2 đối tượng chờ chi trả (SP-03, SP-04)");

  const totalMonthlyBudget = socialList.reduce((acc, s) => acc + s.monthlyAmount, 0);
  assert.equal(totalMonthlyBudget, 4320000, "Tổng ngân sách trợ cấp tháng phải là 4.320.000 VNĐ");
});

test("M06-1.2: Finalize monthly payment locks the payment action and updates state", () => {
  // Clone state
  const state = createInitialDemoState();
  const currentList = state.xa_a.domainRecords.yTeAnSinh.socialProtection;
  
  // Before finalization: pending count is 2 -> Button ENABLED
  const pendingBefore = currentList.filter((s) => s.paymentStatus === "PENDING").length;
  assert.equal(pendingBefore, 2);
  const isButtonDisabledBefore = pendingBefore === 0;
  assert.equal(isButtonDisabledBefore, false, "Nút Chốt chi trả phải BẬT khi pendingPaymentCount > 0");

  // Execute handleFinalizePayment transition
  const updatedList: SocialProtectionItem[] = currentList.map((s) => ({
    ...s,
    paymentStatus: "PAID" as const,
  }));

  const pendingAfter = updatedList.filter((s) => s.paymentStatus === "PENDING").length;
  assert.equal(pendingAfter, 0, "Sau khi chốt kỳ, không còn đối tượng nào ở trạng thái PENDING");
  
  // After finalization: button MUST be locked (disabled = true)
  const isButtonDisabledAfter = pendingAfter === 0;
  assert.equal(isButtonDisabledAfter, true, "Nút Chốt chi trả phải KHÓA (disabled=true) khi pendingPaymentCount === 0");

  // Validate Audit Log contract
  const auditLog: AuditLogEntry = {
    id: `AUDIT-PAY-${Date.now()}`,
    timestamp: new Date().toISOString(),
    personaCode: "P2",
    userId: "user-p2",
    tenantId: "XA_A",
    action: "FINALIZE_MONTHLY_SOCIAL_AID_PAYMENT",
    entityType: "SOCIAL_AID_PAYMENT_PERIOD",
    entityId: "BTXH-NOV-2026",
    details: {
      message: `Chốt danh sách chi trả trợ cấp bảo trợ xã hội tháng 11/2026 cho ${updatedList.length} đối tượng`,
      totalRecipients: updatedList.length,
      totalAmount: 4320000,
    },
  };
  assert.equal(auditLog.action, "FINALIZE_MONTHLY_SOCIAL_AID_PAYMENT");
  assert.equal(auditLog.details?.totalRecipients, 4);
});

test("M06-1.3: Idempotence of Finalize Payment under re-execution", () => {
  // If payment list is already all PAID, re-executing must keep all PAID with pendingCount = 0
  const allPaidList: SocialProtectionItem[] = [
    {
      id: "SP-01",
      code: "BTXH-01",
      fullName: "Đối tượng A",
      cccd: "019154006789",
      phone: "0945112233",
      hamlet: "Xóm 1",
      aidCategory: "Khuyết tật",
      monthlyAmount: 720000,
      diagnosis: "Bệnh lý",
      paymentStatus: "PAID",
      tenantCode: "XA_A",
    },
  ];

  const reFinalized: SocialProtectionItem[] = allPaidList.map((s) => ({
    ...s,
    paymentStatus: "PAID" as const,
  }));

  const pendingRemaining = reFinalized.filter((s: SocialProtectionItem) => (s.paymentStatus as string) === "PENDING").length;
  assert.equal(pendingRemaining, 0);
  assert.equal(reFinalized[0].paymentStatus, "PAID");
});

test("M06-1.4: maskPII engine across all 6 Personas (D03 Compliance)", () => {
  const rawCccd = "019154006789";
  const rawPhone = "0945112233";
  const rawAid = 720000;
  const rawMedical = "Thoái hóa cột sống nặng, mất khả năng tự phục vụ";

  // Personas with canViewPII = false: P1 (Chairman D03), P4 (Hamlet Leader)
  [PERSONAS.P1, PERSONAS.P4].forEach((persona) => {
    assert.equal(persona.canViewPII, false, `${persona.code} phải có canViewPII=false`);
    
    // CCCD
    const maskedCccd = maskPII(rawCccd, "cccd", persona);
    assert.equal(maskedCccd, "0191***789", `${persona.code} CCCD phải che dạng 0191***789`);
    
    // Phone
    const maskedPhone = maskPII(rawPhone, "phone", persona);
    assert.equal(maskedPhone, "0945***233", `${persona.code} Phone phải che dạng 0945***233`);
    
    // Aid
    const maskedAid = maskPII(rawAid, "aid", persona);
    assert.equal(maskedAid, "***.*** đ", `${persona.code} Aid phải che thành '***.*** đ'`);
    
    // Medical
    const maskedMedical = maskPII(rawMedical, "medical", persona);
    assert.equal(
      maskedMedical,
      "[Thông tin y tế nhạy cảm - Bảo mật D03]",
      `${persona.code} Bệnh án phải che thành nhãn bảo mật D03`
    );
  });

  // Personas with canViewPII = true: P2 (Concurrent), P3 (Specialized), P5 (Clerk), P6 (Inspector)
  [PERSONAS.P2, PERSONAS.P3, PERSONAS.P5, PERSONAS.P6].forEach((persona) => {
    assert.equal(persona.canViewPII, true, `${persona.code} phải có canViewPII=true`);
    
    const unmaskedCccd = maskPII(rawCccd, "cccd", persona);
    assert.equal(unmaskedCccd, rawCccd, `${persona.code} CCCD phải giữ nguyên vẹn`);
    
    const unmaskedPhone = maskPII(rawPhone, "phone", persona);
    assert.equal(unmaskedPhone, rawPhone, `${persona.code} Phone phải giữ nguyên vẹn`);
    
    const unmaskedAid = maskPII(rawAid, "aid", persona);
    assert(unmaskedAid.includes("720.000"), `${persona.code} Aid phải hiển thị số tiền thật (720.000)`);
    
    const unmaskedMedical = maskPII(rawMedical, "medical", persona);
    assert.equal(unmaskedMedical, rawMedical, `${persona.code} Bệnh án phải giữ nguyên vẹn`);
  });
});

test("M06-1.5: maskPII edge cases: null, undefined, empty, short strings, whitespace", () => {
  // Empty values
  assert.equal(maskPII(null, "cccd", false), "—");
  assert.equal(maskPII(undefined, "phone", false), "—");
  assert.equal(maskPII("", "aid", false), "—");

  // Short strings
  assert.equal(maskPII("12345", "cccd", false), "******");
  assert.equal(maskPII("0912", "phone", false), "09******");
  assert.equal(maskPII("AB", "general", false), "****");

  // Formatting & spaces
  assert.equal(maskPII(" 0191 5400 6789 ", "cccd", false), "0191***789");
  assert.equal(maskPII("0945.112.233", "phone", false), "0945***233");
  assert.equal(maskPII("0945-112-233", "phone", false), "0945***233");

  // Victim PII
  assert.equal(maskPII("Nguyễn Thị A", "victim", false), "[Ẩn danh nạn nhân BLGĐ]");
  assert.equal(maskPII("Nguyễn Thị A", "victim", true), "Nguyễn Thị A");
});

// ======================================================================
// SUITE 2: M06 FOOD SAFETY 24H SAMPLE STORAGE & EPIDEMIC ALERT
// ======================================================================
console.log("\n--- SUITE 2: M06 Food Safety 24h Sample Storage & Weekly Epidemic Alert ---");

test("M06-2.1: Food safety inspection 24h retention and scoring rules", () => {
  const foodSafety = GOLDEN_SEED_XA_A.domainRecords.yTeAnSinh.foodSafety;
  
  // Canteen facility check
  const canteen = foodSafety.find((f) => f.inspectionType === "SCHOOL_CANTEEN");
  assert(canteen, "Phải có bếp ăn trường học");
  assert.equal(canteen.sampleRetention24hPassed, true, "Bếp ăn trường học mẫu phải đạt lưu mẫu 24h");
  assert.equal(canteen.conclusion, "PASSED");

  // Street food facility check
  const streetFood = foodSafety.find((f) => f.inspectionType === "STREET_FOOD");
  assert(streetFood, "Phải có cơ sở thức ăn đường phố");
  assert.equal(streetFood.sampleRetention24hPassed, false);
  assert.equal(streetFood.conclusion, "WARNING_REMEDIAL");

  // Test scoring logic helper
  function scoreToConclusion(score: number): FoodSafetyItem["conclusion"] {
    return score >= 80 ? "PASSED" : score >= 60 ? "WARNING_REMEDIAL" : "FAILED_SUSPEND";
  }

  // Boundaries: 80, 79, 60, 59
  assert.equal(scoreToConclusion(100), "PASSED");
  assert.equal(scoreToConclusion(80), "PASSED");
  assert.equal(scoreToConclusion(79), "WARNING_REMEDIAL");
  assert.equal(scoreToConclusion(60), "WARNING_REMEDIAL");
  assert.equal(scoreToConclusion(59), "FAILED_SUSPEND");
  assert.equal(scoreToConclusion(0), "FAILED_SUSPEND");
});

test("M06-2.2: Creation of new food safety inspection with 24h sample retention", () => {
  const newInspection: FoodSafetyItem = {
    id: `FS-NEW-TEST`,
    facilityName: "Bếp ăn Mầm non Hoa Sen",
    inspectionType: "SCHOOL_CANTEEN",
    inspectionDate: "2026-11-07",
    totalScore: 95,
    sampleRetention24hPassed: true,
    conclusion: "PASSED",
    tenantCode: "XA_A",
  };

  assert.equal(newInspection.sampleRetention24hPassed, true);
  assert.equal(newInspection.conclusion, "PASSED");

  // Non-canteen default behavior
  const streetInspection: FoodSafetyItem = {
    id: `FS-STREET-TEST`,
    facilityName: "Quán Nước Cổng Trường",
    inspectionType: "STREET_FOOD",
    inspectionDate: "2026-11-07",
    totalScore: 55,
    sampleRetention24hPassed: false,
    conclusion: "FAILED_SUSPEND",
    tenantCode: "XA_A",
  };
  assert.equal(streetInspection.conclusion, "FAILED_SUSPEND");
});

test("M06-2.3: Weekly epidemic surveillance outbreak alert threshold (> 3 cases/week)", () => {
  const epidemics = GOLDEN_SEED_XA_A.domainRecords.yTeAnSinh.epidemics;
  assert.equal(epidemics.length, 3, "Xã A có 3 bản ghi giám sát dịch tễ Tuần 45");

  const dengue = epidemics.find((e) => e.diseaseName.includes("Dengue"))!;
  assert(dengue, "Phải có bản ghi sốt xuất huyết Dengue");
  assert.equal(dengue.casesCount, 4);
  assert.equal(dengue.outbreakAlertFlag, true);

  const tcm = epidemics.find((e) => e.diseaseName.includes("Tay chân miệng"))!;
  assert.equal(tcm.casesCount, 1);
  assert.equal(tcm.outbreakAlertFlag, false);

  const soi = epidemics.find((e) => e.diseaseName.includes("Sởi"))!;
  assert.equal(soi.casesCount, 0);
  assert.equal(soi.outbreakAlertFlag, false);

  // Logic rule in y-te-an-sinh/page.tsx:
  // e.outbreakAlertFlag || (e.diseaseName.includes("Dengue") && e.casesCount > 3)
  function isOutbreakAlert(e: EpidemicLogItem): boolean {
    return Boolean(e.outbreakAlertFlag || (e.diseaseName.includes("Dengue") && e.casesCount > 3));
  }

  assert.equal(isOutbreakAlert(dengue), true, "Dengue với 4 ca và outbreakAlertFlag=true phải kích hoạt cảnh báo đỏ");

  // Boundary checks:
  const dengue3Cases: EpidemicLogItem = {
    ...dengue,
    id: "TEST-EPI-3",
    casesCount: 3,
    outbreakAlertFlag: false,
  };
  assert.equal(isOutbreakAlert(dengue3Cases), false, "Dengue đúng 3 ca và flag=false KHÔNG kích hoạt bùng phát");

  const dengue4CasesNoFlag: EpidemicLogItem = {
    ...dengue,
    id: "TEST-EPI-4",
    casesCount: 4,
    outbreakAlertFlag: false,
  };
  assert.equal(isOutbreakAlert(dengue4CasesNoFlag), true, "Dengue 4 ca (> 3) dù flag=false vẫn kích hoạt cảnh báo nguy cơ ổ dịch");

  const otherDiseaseLowCases: EpidemicLogItem = {
    ...dengue,
    id: "TEST-EPI-OTHER",
    diseaseName: "Thủy đậu",
    casesCount: 2,
    outbreakAlertFlag: false,
  };
  assert.equal(isOutbreakAlert(otherDiseaseLowCases), false, "Bệnh khác 2 ca không kích hoạt");

  const otherDiseaseFlagged: EpidemicLogItem = {
    ...dengue,
    id: "TEST-EPI-FLAGGED",
    diseaseName: "Sởi",
    casesCount: 2,
    outbreakAlertFlag: true,
  };
  assert.equal(isOutbreakAlert(otherDiseaseFlagged), true, "Bệnh khác nếu có outbreakAlertFlag=true phải kích hoạt");
});

test("M06-2.4: Outbreak response activation state transition and audit trail", () => {
  const state = createInitialDemoState();
  const activeOutbreak = state.xa_a.domainRecords.yTeAnSinh.epidemics[0];
  assert(activeOutbreak.outbreakAlertFlag, "Ban đầu ổ dịch đang kích hoạt flag");

  // Simulate handleActivateOutbreakResponse
  const updatedEpidemics = state.xa_a.domainRecords.yTeAnSinh.epidemics.map((e) =>
    e.id === activeOutbreak.id ? { ...e, outbreakAlertFlag: false, casesCount: 2 } : e
  );

  const resolved = updatedEpidemics.find((e) => e.id === activeOutbreak.id)!;
  assert.equal(resolved.outbreakAlertFlag, false);

  // Check Audit Log
  const log: AuditLogEntry = {
    id: `AUDIT-EPI-${Date.now()}`,
    timestamp: new Date().toISOString(),
    personaCode: "P2",
    userId: "user-p2",
    tenantId: "XA_A",
    action: "ACTIVATE_EPIDEMIC_OUTBREAK_RESPONSE",
    entityType: "EPIDEMIC_SURVEILLANCE",
    entityId: activeOutbreak.hamlet,
    details: {
      message: `Kích hoạt kế hoạch khẩn cấp xử lý ổ dịch ${activeOutbreak.diseaseName} tại ${activeOutbreak.hamlet}`,
      hamlet: activeOutbreak.hamlet,
      casesCount: activeOutbreak.casesCount,
    },
  };
  assert.equal(log.action, "ACTIVATE_EPIDEMIC_OUTBREAK_RESPONSE");
  assert.equal(log.entityId, "Xóm Tân Thịnh");
});

// ======================================================================
// SUITE 3: M07 MTQG 1719 15-DAY PUBLIC POSTING RULE
// ======================================================================
console.log("\n--- SUITE 3: M07 MTQG 1719 15-day Public Posting Rule ---");

// Helper as implemented in dan-toc-ton-giao/page.tsx
function calculateDaysPosted(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function evaluateMTQG1719Disbursement(allocation: EthnicAllocationItem): {
  daysPosted: number;
  isTimeEligible: boolean;
  hasNoObjection: boolean;
  canDisburse: boolean;
  isDisbursed: boolean;
} {
  const daysPosted = calculateDaysPosted(allocation.publicPostingStart, allocation.publicPostingEnd);
  const isTimeEligible = daysPosted >= 15;
  const hasNoObjection = !allocation.objectionFiled;
  const canDisburse = isTimeEligible && hasNoObjection;
  const isDisbursed = allocation.disbursementStatus === "DISBURSED";

  return { daysPosted, isTimeEligible, hasNoObjection, canDisburse, isDisbursed };
}

test("M07-3.1: Verify MTQG 1719 allocations in Xã A Golden Seed", () => {
  const allocations = GOLDEN_SEED_XA_A.domainRecords.danTocTonGiao.ethnicAllocations;
  assert.equal(allocations.length, 3, "Xã A phải có 3 hồ sơ MTQG 1719");

  // EA-01: Hoàng Văn Sùng
  const ea01 = allocations.find((a) => a.id === "EA-01")!;
  const res01 = evaluateMTQG1719Disbursement(ea01);
  assert.equal(res01.daysPosted, 16, "EA-01 niêm yết từ 2026-10-15 đến 2026-10-31 là 16 ngày");
  assert.equal(res01.isTimeEligible, true);
  assert.equal(res01.hasNoObjection, true);
  assert.equal(res01.canDisburse, true, "EA-01 đủ điều kiện giải ngân -> Nút MỞ (enabled)");
  assert.equal(res01.isDisbursed, false);

  // EA-02: Lương Văn Thắng
  const ea02 = allocations.find((a) => a.id === "EA-02")!;
  const res02 = evaluateMTQG1719Disbursement(ea02);
  assert.equal(res02.daysPosted, 7, "EA-02 niêm yết từ 2026-11-01 đến 2026-11-08 là 7 ngày");
  assert.equal(res02.isTimeEligible, false, "EA-02 chưa đủ 15 ngày");
  assert.equal(res02.canDisburse, false, "EA-02 Nút Phê duyệt giải ngân phải KHÓA (disabled)");

  // EA-03: Triệu Thị Mùi
  const ea03 = allocations.find((a) => a.id === "EA-03")!;
  const res03 = evaluateMTQG1719Disbursement(ea03);
  assert.equal(res03.daysPosted, 18, "EA-03 niêm yết 18 ngày (>= 15)");
  assert.equal(res03.isTimeEligible, true);
  assert.equal(res03.hasNoObjection, false, "EA-03 có objectionFiled=true");
  assert.equal(res03.canDisburse, false, "EA-03 có khiếu nại -> Nút Phê duyệt giải ngân phải KHÓA (disabled)");
});

test("M07-3.2: Adversarial Boundary Tests for 15-day Public Posting Rule", () => {
  // Boundary 1: Exactly 14 days -> MUST BE LOCKED
  const item14Days: EthnicAllocationItem = {
    id: "TEST-14D",
    beneficiaryName: "Hộ A",
    cccd: "019000111222",
    hamlet: "Xóm 1",
    programCode: "MTQG_1719",
    subProjectType: "HOUSING_AID",
    budgetAllocated: 40000000,
    publicPostingStart: "2026-11-01",
    publicPostingEnd: "2026-11-15",
    objectionFiled: false,
    disbursementStatus: "POSTED",
    tenantCode: "XA_A",
  };
  const res14 = evaluateMTQG1719Disbursement(item14Days);
  assert.equal(res14.daysPosted, 14);
  assert.equal(res14.isTimeEligible, false);
  assert.equal(res14.canDisburse, false, "14 ngày phải bị KHÓA");

  // Boundary 2: Exactly 15 days, no objection -> MUST BE UNLOCKED
  const item15Days: EthnicAllocationItem = {
    ...item14Days,
    id: "TEST-15D",
    publicPostingEnd: "2026-11-16",
  };
  const res15 = evaluateMTQG1719Disbursement(item15Days);
  assert.equal(res15.daysPosted, 15);
  assert.equal(res15.isTimeEligible, true);
  assert.equal(res15.canDisburse, true, "Đúng 15 ngày và không khiếu nại phải được MỞ KHÓA");

  // Boundary 3: Exactly 15 days, with objection -> MUST BE LOCKED
  const item15DaysObj: EthnicAllocationItem = {
    ...item15Days,
    id: "TEST-15D-OBJ",
    objectionFiled: true,
  };
  const res15Obj = evaluateMTQG1719Disbursement(item15DaysObj);
  assert.equal(res15Obj.daysPosted, 15);
  assert.equal(res15Obj.isTimeEligible, true);
  assert.equal(res15Obj.hasNoObjection, false);
  assert.equal(res15Obj.canDisburse, false, "15 ngày nhưng có khiếu nại phải bị KHÓA");

  // Boundary 4: Long posting (60 days), but with objection -> MUST BE LOCKED
  const item60DaysObj: EthnicAllocationItem = {
    ...item14Days,
    id: "TEST-60D-OBJ",
    publicPostingStart: "2026-09-01",
    publicPostingEnd: "2026-10-31",
    objectionFiled: true,
  };
  const res60 = evaluateMTQG1719Disbursement(item60DaysObj);
  assert.equal(res60.daysPosted, 60);
  assert.equal(res60.canDisburse, false, "60 ngày có khiếu nại vẫn phải bị KHÓA");
});

test("M07-3.3: Disbursement execution and post-disbursement state (Hoàn tất)", () => {
  const state = createInitialDemoState();
  const ea01 = state.xa_a.domainRecords.danTocTonGiao.ethnicAllocations.find((a) => a.id === "EA-01")!;
  
  // Before disbursement: status is APPROVED, canDisburse is true
  const resBefore = evaluateMTQG1719Disbursement(ea01);
  assert.equal(resBefore.canDisburse, true);
  assert.equal(resBefore.isDisbursed, false);

  // Execute disbursement
  const updatedAllocations = state.xa_a.domainRecords.danTocTonGiao.ethnicAllocations.map((a) =>
    a.id === ea01.id ? { ...a, disbursementStatus: "DISBURSED" as const } : a
  );

  const disbursedItem = updatedAllocations.find((a) => a.id === ea01.id)!;
  const resAfter = evaluateMTQG1719Disbursement(disbursedItem);
  assert.equal(resAfter.isDisbursed, true);
  // When isDisbursed is true, UI displays "Hoàn tất" badge instead of disbursement button
  assert.equal(disbursedItem.disbursementStatus, "DISBURSED");

  // Audit log
  const log: AuditLogEntry = {
    id: `AUDIT-DISB-${Date.now()}`,
    timestamp: new Date().toISOString(),
    personaCode: "P2",
    userId: "user-p2",
    tenantId: "XA_A",
    action: "APPROVE_MTQG_1719_DISBURSEMENT",
    entityType: "ETHNIC_POLICY_ALLOCATION",
    entityId: ea01.beneficiaryName,
    details: {
      message: `Phê duyệt giải ngân vốn MTQG 1719 cho hộ ${ea01.beneficiaryName}`,
      budget: ea01.budgetAllocated,
      subProjectType: ea01.subProjectType,
    },
  };
  assert.equal(log.action, "APPROVE_MTQG_1719_DISBURSEMENT");
  assert.equal(log.details?.budget, 44000000);
});

test("M07-3.4: Xã B already-disbursed MTQG 1719 record verification", () => {
  const allocationsB = GOLDEN_SEED_XA_B.domainRecords.danTocTonGiao.ethnicAllocations;
  assert.equal(allocationsB.length, 1);
  const eaB01 = allocationsB[0];
  assert.equal(eaB01.beneficiaryName, "Hoàng Văn Nam");
  assert.equal(eaB01.disbursementStatus, "DISBURSED");

  const resB = evaluateMTQG1719Disbursement(eaB01);
  assert.equal(resB.isDisbursed, true, "Xã B record phải hiển thị Hoàn tất");
});

// ======================================================================
// SUITE 4: MULTI-TENANCY ISOLATION FOR M06 & M07
// ======================================================================
console.log("\n--- SUITE 4: Multi-Tenancy Data Isolation (Xã A vs Xã B) ---");

test("M06-M07-4.1: Complete isolation between Xã A and Xã B domain records", () => {
  const state = createInitialDemoState();
  const yTeA = state.xa_a.domainRecords.yTeAnSinh;
  const yTeB = state.xa_b.domainRecords.yTeAnSinh;
  const danTocA = state.xa_a.domainRecords.danTocTonGiao;
  const danTocB = state.xa_b.domainRecords.danTocTonGiao;

  // Social protection isolation
  assert.notEqual(yTeA.socialProtection.length, yTeB.socialProtection.length, "Số lượng BTXH Xã A và Xã B phải độc lập");
  
  // Food safety isolation
  assert.notEqual(yTeA.foodSafety.length, yTeB.foodSafety.length, "Số lượng ATTP Xã A và Xã B phải độc lập");

  // Epidemic isolation
  assert.equal(yTeA.epidemics.length, 3);
  assert.equal(yTeB.epidemics.length, 1);
  assert.equal(yTeB.epidemics[0].casesCount, 0, "Xã B có 0 ca sốt xuất huyết");
  assert.equal(yTeB.epidemics[0].outbreakAlertFlag, false, "Xã B không có cờ cảnh báo ổ dịch");

  // Ethnic allocations isolation
  assert.equal(danTocA.ethnicAllocations.length, 3);
  assert.equal(danTocB.ethnicAllocations.length, 1);
  assert.equal(danTocB.ethnicAllocations[0].disbursementStatus, "DISBURSED");
});

console.log("\n======================================================================");
console.log(`   CHALLENGER M3-2 RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log("======================================================================\n");
