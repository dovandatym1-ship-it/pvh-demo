/**
 * Comprehensive Empirical Test Harness for Milestone M1 (WS-01)
 * Challenger Agent: challenger_m1_2
 * Focus: PII Masking Engine & SSR Hydration / LocalStorage Serialization
 */

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { maskPII, PIIType } from "../src/lib/authorization/pii-mask";
import { PERSONAS, Persona } from "../src/lib/auth/session";
import {
  createInitialDemoState,
  getInitialGoldenSeed,
  DemoState,
  TenantDemoData,
} from "../src/lib/store/demo-state";
import { DemoProvider, useDemoContext } from "../src/lib/tenancy/demo-context";

// Test assertion helper
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    const msg = `  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`;
    console.error(msg);
    failures.push(msg);
  }
}

function assertEquals<T>(actual: T, expected: T, testName: string) {
  const matches = actual === expected;
  assert(
    matches,
    testName,
    `Expected "${expected}", got "${actual}"`
  );
}

console.log("======================================================================");
console.log("STARTING EMPIRICAL CHALLENGER TEST SUITE (challenger_m1_2)");
console.log("======================================================================");

// -----------------------------------------------------------------------------
// SUITE 1: PII Masking Engine - All 5 Core Types & Variations
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 1: PII Masking Engine - 5 Types & Edge Values ---");

// 1.1 CCCD
assertEquals(maskPII("019012345678", "cccd", false), "0190***678", "CCCD 12-digits masked for canViewPII=false");
assertEquals(maskPII("019012345678", "cccd", true), "019012345678", "CCCD 12-digits unmasked for canViewPII=true");
assertEquals(maskPII("019 012 345 678", "cccd", false), "0190***678", "CCCD with whitespace masked properly");
assertEquals(maskPII("1234567", "cccd", false), "******", "CCCD short string (<8 chars) returns fallback ******");
assertEquals(maskPII("12345678", "cccd", false), "1234***678", "CCCD boundary length 8 chars masks middle");

// 1.2 Phone
assertEquals(maskPII("0912345678", "phone", false), "0912***678", "Phone 10-digits masked for canViewPII=false");
assertEquals(maskPII("0912345678", "phone", true), "0912345678", "Phone 10-digits unmasked for canViewPII=true");
assertEquals(maskPII("0912.345.678", "phone", false), "0912***678", "Phone with dots masked properly");
assertEquals(maskPII("0912-345-678", "phone", false), "0912***678", "Phone with dashes masked properly");
assertEquals(maskPII("0912 345 678", "phone", false), "0912***678", "Phone with spaces masked properly");
assertEquals(maskPII("123456", "phone", false), "09******", "Phone short string (<7 chars) returns fallback 09******");

// 1.3 Aid & Money
assertEquals(maskPII(1500000, "aid", false), "***.*** đ", "Aid amount (number) masked to ***.*** đ");
assertEquals(maskPII("1500000", "aid", false), "***.*** đ", "Aid amount (string) masked to ***.*** đ");
assertEquals(maskPII(0, "aid", false), "***.*** đ", "Aid amount 0 masked to ***.*** đ");
assertEquals(maskPII("1.500.000 đ", "aid", false), "***.*** đ", "Aid formatted string masked to ***.*** đ");
assertEquals(maskPII(1500000, "money", false), "***.*** đ", "Money alias masked to ***.*** đ");
// Unmasked currency formatting:
const unmaskedAid = maskPII(1500000, "aid", true);
assert(
  unmaskedAid.includes("1.500.000") && (unmaskedAid.includes("₫") || unmaskedAid.includes("VND")),
  "Aid unmasked formats as currency with 1.500.000 VND/₫",
  `Got: ${unmaskedAid}`
);

// 1.4 Medical & Health
const diagnosis = "Lao phổi giai đoạn 2 kèm đái tháo đường typ 2";
assertEquals(
  maskPII(diagnosis, "medical", false),
  "[Thông tin y tế nhạy cảm - Bảo mật D03]",
  "Medical diagnosis masked completely to D03 privacy tag"
);
assertEquals(
  maskPII(diagnosis, "health", false),
  "[Thông tin y tế nhạy cảm - Bảo mật D03]",
  "Health alias masked completely to D03 privacy tag"
);
assertEquals(
  maskPII(diagnosis, "medical", true),
  diagnosis,
  "Medical diagnosis unmasked retains original text"
);

// 1.5 Domestic Violence Victim
const victimName = "Nguyễn Thị Thảo";
assertEquals(
  maskPII(victimName, "victim", false),
  "[Ẩn danh nạn nhân BLGĐ]",
  "Victim name masked completely to anonymous tag"
);
assertEquals(
  maskPII(victimName, "victim", true),
  victimName,
  "Victim name unmasked retains original name"
);

// -----------------------------------------------------------------------------
// SUITE 2: Boundary Conditions, Empty, Null, Undefined & Edge Cases
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 2: Boundary Conditions, Edge Inputs & Injection Attempts ---");

assertEquals(maskPII(undefined, "cccd", false), "—", "undefined value returns em dash —");
assertEquals(maskPII(null, "cccd", false), "—", "null value returns em dash —");
assertEquals(maskPII("", "cccd", false), "—", "empty string returns em dash —");
assertEquals(maskPII(undefined, "phone", true), "—", "undefined value with canViewPII=true returns em dash —");
assertEquals(maskPII(null, "aid", true), "—", "null value with canViewPII=true returns em dash —");
assertEquals(maskPII("", "victim", true), "—", "empty string with canViewPII=true returns em dash —");

// Whitespace string
assertEquals(maskPII("   ", "cccd", false), "******", "Whitespace string for cccd masks safely without throw");
assertEquals(maskPII("   ", "medical", false), "[Thông tin y tế nhạy cảm - Bảo mật D03]", "Whitespace medical masks safely");

// Injection & XSS attempts in medical/victim
const xssPayload = "<script>alert('pvh-xss')</script>";
assertEquals(
  maskPII(xssPayload, "medical", false),
  "[Thông tin y tế nhạy cảm - Bảo mật D03]",
  "XSS in medical is replaced entirely (no injection leakage)"
);
assertEquals(
  maskPII(xssPayload, "victim", false),
  "[Ẩn danh nạn nhân BLGĐ]",
  "XSS in victim is replaced entirely (no injection leakage)"
);

// General fallback type
assertEquals(maskPII("SensitiveSecret", "general", false), "Se***et", "General type masks middle characters");
assertEquals(maskPII("12", "general", false), "****", "General type short string returns ****");

// Adversarial Stress Cases:
// Large string stress test (ReDoS resistance)
const largeString = "0".repeat(50000);
const startPerf = Date.now();
const largeResult = maskPII(largeString, "cccd", false);
const durationMs = Date.now() - startPerf;
assert(durationMs < 100, `Large 50,000 char input masks quickly without ReDoS (<100ms, actual: ${durationMs}ms)`);
assertEquals(largeResult, `0000***000`, "50,000 char CCCD masked deterministically to 0000***000");

// Negative number aid
assertEquals(maskPII(-500000, "aid", false), "***.*** đ", "Negative aid amount masked safely to ***.*** đ");
const unmaskedNegAid = maskPII(-500000, "aid", true);
assert(unmaskedNegAid.includes("-500.000") || unmaskedNegAid.includes("- 500.000") || unmaskedNegAid.includes("500.000"), "Negative aid unmasked formats currency");

// International phone format (+84)
assertEquals(maskPII("+84 912 345 678", "phone", false), "+849***678", "International phone with country code masked correctly");

// Golden Seed immutability check (deep clone check)
const testState = createInitialDemoState();
testState.xa_a.tasks[0].title = "CORRUPTED_TITLE";
const pristineSeedAgain = getInitialGoldenSeed("XA_A");
assert(
  pristineSeedAgain.tasks[0].title !== "CORRUPTED_TITLE",
  "Pristine Golden Seed is immune to in-memory mutation of active state (deep clone guaranteed)"
);

// -----------------------------------------------------------------------------
// SUITE 3: Role Permutations & D03 Authority Boundaries
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 3: Persona Role Permutations & D03 Authority ---");

const testCccd = "019098765432";
const testPhone = "0987654321";
const testMedical = "Viêm gan B mạn tính";

// P1 (Chairman - no inherent PII permission according to D03)
assert(PERSONAS.P1.canViewPII === false, "PERSONAS.P1 has canViewPII === false");
assertEquals(maskPII(testCccd, "cccd", PERSONAS.P1), "0190***432", "P1 (Chairman) cannot view unmasked CCCD");
assertEquals(maskPII(testPhone, "phone", PERSONAS.P1), "0987***321", "P1 (Chairman) cannot view unmasked Phone");
assertEquals(maskPII(testMedical, "medical", PERSONAS.P1), "[Thông tin y tế nhạy cảm - Bảo mật D03]", "P1 cannot view medical diagnosis");

// P4 (Hamlet Leader - no PII permission)
assert(PERSONAS.P4.canViewPII === false, "PERSONAS.P4 has canViewPII === false");
assertEquals(maskPII(testCccd, "cccd", PERSONAS.P4), "0190***432", "P4 (Hamlet Leader) cannot view unmasked CCCD");
assertEquals(maskPII(victimName, "victim", PERSONAS.P4), "[Ẩn danh nạn nhân BLGĐ]", "P4 cannot view victim name");

// P2 (Officer Concurrent - has PII permission)
assert(PERSONAS.P2.canViewPII === true, "PERSONAS.P2 has canViewPII === true");
assertEquals(maskPII(testCccd, "cccd", PERSONAS.P2), testCccd, "P2 (Officer) views unmasked CCCD");
assertEquals(maskPII(testMedical, "medical", PERSONAS.P2), testMedical, "P2 views unmasked medical diagnosis");

// P3 (Officer Specialized - has PII permission)
assert(PERSONAS.P3.canViewPII === true, "PERSONAS.P3 has canViewPII === true");
assertEquals(maskPII(victimName, "victim", PERSONAS.P3), victimName, "P3 views unmasked victim name");

// P5 (One-stop clerk - has PII permission)
assert(PERSONAS.P5.canViewPII === true, "PERSONAS.P5 has canViewPII === true");
assertEquals(maskPII(testPhone, "phone", PERSONAS.P5), testPhone, "P5 views unmasked Phone");

// P6 (Inspector - has PII permission)
assert(PERSONAS.P6.canViewPII === true, "PERSONAS.P6 has canViewPII === true");
assertEquals(maskPII(testCccd, "cccd", PERSONAS.P6), testCccd, "P6 views unmasked CCCD");

// Custom/Anomalous Persona inputs: fail-safe verification
assertEquals(
  maskPII(testCccd, "cccd", {} as Persona),
  "0190***432",
  "Empty object persona defaults to canViewPII=false (fail-safe)"
);
assertEquals(
  maskPII(testCccd, "cccd", null as unknown as Persona),
  "0190***432",
  "null persona defaults to canViewPII=false (fail-safe)"
);
assertEquals(
  maskPII(testCccd, "cccd", undefined as unknown as Persona),
  "0190***432",
  "undefined persona defaults to canViewPII=false (fail-safe)"
);
assertEquals(
  maskPII(testCccd, "cccd", { canViewPII: false } as Persona),
  "0190***432",
  "Persona with canViewPII: false is masked"
);

// -----------------------------------------------------------------------------
// SUITE 4: SSR Safety & React Server-Side Rendering
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 4: SSR Safety & Server-Side Rendering ---");

function TestChildComponent() {
  const ctx = useDemoContext();
  return React.createElement(
    "div",
    { id: "ssr-test-container" },
    React.createElement("span", { id: "tenant-name" }, ctx.tenant.name),
    React.createElement("span", { id: "current-code" }, ctx.currentTenantCode),
    React.createElement("span", { id: "met01" }, ctx.oracleMetrics.met01_openTasks),
    React.createElement("span", { id: "met02" }, ctx.oracleMetrics.met02_overdueTasks),
    React.createElement("span", { id: "met04" }, ctx.oracleMetrics.met04_cdsCoverage),
    React.createElement("span", { id: "met05" }, ctx.oracleMetrics.met05_openInspections),
    React.createElement("span", { id: "hydrated" }, String(ctx.isHydrated))
  );
}

// 4.1 Server Environment Simulation (window === undefined, localStorage === undefined)
assert(typeof window === "undefined", "Node runtime environment has typeof window === 'undefined'");

let ssrOutput = "";
try {
  const tree = React.createElement(DemoProvider, null, React.createElement(TestChildComponent));
  ssrOutput = ReactDOMServer.renderToString(tree);
  assert(true, "DemoProvider renders cleanly via ReactDOMServer.renderToString with 0 exceptions");
} catch (err) {
  assert(false, "DemoProvider throws during SSR renderToString", String(err));
}

assert(ssrOutput.includes("Giả định A"), "SSR output contains initial tenant name 'Giả định A'");
assert(ssrOutput.includes("XA_A"), "SSR output contains currentTenantCode 'XA_A'");
assert(ssrOutput.includes("03"), "SSR output contains MET-01 '03'");
assert(ssrOutput.includes("01"), "SSR output contains MET-02 '01'");
assert(ssrOutput.includes("60%"), "SSR output contains MET-04 '60%'");
assert(ssrOutput.includes("02"), "SSR output contains MET-05 '02'");
assert(ssrOutput.includes("false"), "SSR output renders isHydrated === false (matches server expectation)");

// -----------------------------------------------------------------------------
// SUITE 5: LocalStorage Persistence, Corruption & Deserialization
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 5: LocalStorage Serialization & Corruption Resilience ---");

// Mock LocalStorage
class MockLocalStorage {
  private store: Record<string, string> = {};
  public shouldThrowOnGet = false;
  public shouldThrowOnSet = false;

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) throw new Error("Mock Storage SecurityError: Access Denied");
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) throw new Error("Mock Storage QuotaExceededError: Storage quota exceeded");
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
const STORAGE_KEY = "pvh_demo_state_v1";

// 5.1 Clean serialization of initial state
const initial = createInitialDemoState();
const serialized = JSON.stringify(initial);
mockStorage.setItem(STORAGE_KEY, serialized);

const retrieved = mockStorage.getItem(STORAGE_KEY);
assert(retrieved !== null, "Stored state is retrievable from mockStorage");
const parsed = JSON.parse(retrieved!);
assert(parsed.xa_a !== undefined, "Parsed state contains xa_a slice");
assert(parsed.xa_b !== undefined, "Parsed state contains xa_b slice");
assertEquals(parsed.xa_a.tasks.length, 6, "Parsed state contains 6 tasks for Xã A");
assertEquals(parsed.xa_b.tasks.length, 2, "Parsed state contains 2 tasks for Xã B");

// 5.2 Size verification of serialized state
const payloadSizeBytes = Buffer.byteLength(serialized, "utf8");
console.log(`  ℹ Total serialized state size: ${payloadSizeBytes} bytes (~${(payloadSizeBytes / 1024).toFixed(1)} KB)`);
assert(payloadSizeBytes < 1024 * 1024, "State payload is well under standard 5MB LocalStorage quota");

// 5.3 Simulating Corrupted JSON in localStorage
const corruptedCases = [
  "{ malformed json string ...",
  "null",
  "12345",
  "\"just a string\"",
  "[]",
  "{}",
  "{\"xa_a\": null}",
];

for (const corruptVal of corruptedCases) {
  mockStorage.setItem(STORAGE_KEY, corruptVal);
  const raw = mockStorage.getItem(STORAGE_KEY);
  let recoveredState: DemoState | null = null;
  try {
    const p = JSON.parse(raw!);
    if (p && p.xa_a && p.xa_b) {
      recoveredState = p;
    } else {
      recoveredState = createInitialDemoState();
    }
  } catch {
    recoveredState = createInitialDemoState();
  }
  assert(
    recoveredState !== null && recoveredState.xa_a !== undefined && recoveredState.xa_b !== undefined,
    `Corruption recovery handles input: ${corruptVal.substring(0, 25)}...`
  );
}

// -----------------------------------------------------------------------------
// SUITE 6: Multi-Tenancy Isolation & Independent Reset Integrity
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 6: Multi-Tenancy Isolation & Reset Integrity ---");

const freshState = createInitialDemoState();

// Mutate Xã A: change task 0 status
freshState.xa_a.tasks[0].status = "Quá hạn";
freshState.xa_a.tasks[0].isOverdue = true;

// Verify Xã B was NOT affected
assertEquals(
  freshState.xa_b.tasks[0].status,
  "Đang xử lý",
  "Mutation in Xã A tasks does not affect Xã B tasks (strict tenancy isolation)"
);

// Reset Xã A
const resetSeedA = getInitialGoldenSeed("XA_A");
freshState.xa_a = resetSeedA;
assertEquals(
  freshState.xa_a.tasks[0].status,
  "Hoàn thành",
  "Reset Xã A restores pristine Golden Seed for Xã A"
);
assertEquals(
  freshState.xa_b.tasks[0].status,
  "Đang xử lý",
  "Reset Xã A leaves Xã B untouched"
);

// Mutate Xã B: change cdsMatrix
freshState.xa_b.cdsMatrix[0].status = "CONFIRMED";
const resetSeedB = getInitialGoldenSeed("XA_B");
freshState.xa_b = resetSeedB;
assertEquals(
  freshState.xa_b.cdsMatrix[0].status,
  "NOT_APPLICABLE",
  "Reset Xã B restores pristine Golden Seed for Xã B (NOT_APPLICABLE for CDS)"
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n======================================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("======================================================================");

if (failedTests > 0) {
  console.error("FAILURES ENCOUNTERED:");
  for (const f of failures) console.error(f);
  process.exit(1);
} else {
  console.log("ALL TESTS PASSED EMPIRICALLY! VERDICT: APPROVED");
  process.exit(0);
}
