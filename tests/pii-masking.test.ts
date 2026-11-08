import assert from "node:assert/strict";
import test from "node:test";
import { maskPII } from "../src/lib/authorization/pii-mask";
import { PERSONAS } from "../src/lib/auth/session";

test("CCCD Masking: Masks 12-digit CCCD when unauthorized, preserves when authorized", () => {
  const cccd = "019012345678";

  // Unauthorized (canViewPII = false)
  const masked = maskPII(cccd, "cccd", false);
  assert.equal(masked, "0190***678", "Must retain first 4 and last 3 digits separated by ***");

  // With spaces
  const maskedSpaces = maskPII("0190 1234 5678", "cccd", false);
  assert.equal(maskedSpaces, "0190***678", "Must strip spaces before masking");

  // Short invalid CCCD
  const maskedShort = maskPII("12345", "cccd", false);
  assert.equal(maskedShort, "******", "Short CCCD must return standard ****** mask");

  // Authorized (canViewPII = true)
  const unmasked = maskPII(cccd, "cccd", true);
  assert.equal(unmasked, cccd, "Must preserve exact CCCD when authorized");
});

test("Phone Masking: Masks phone number when unauthorized, preserves when authorized", () => {
  const phone = "0912345678";

  // Unauthorized
  const masked = maskPII(phone, "phone", false);
  assert.equal(masked, "0912***678");

  // With dashes or dots
  const maskedDots = maskPII("0912.345.678", "phone", false);
  assert.equal(maskedDots, "0912***678");

  // Short phone
  const maskedShort = maskPII("12345", "phone", false);
  assert.equal(maskedShort, "09******");

  // Authorized
  const unmasked = maskPII(phone, "phone", true);
  assert.equal(unmasked, phone);
});

test("Aid / Money Masking: Masks monetary amount to '***.*** đ' when unauthorized", () => {
  const amount = 1500000;

  // Unauthorized
  const masked = maskPII(amount, "aid", false);
  assert.equal(masked, "***.*** đ", "Must return exact '***.*** đ' mask");

  // Money alias
  const maskedMoney = maskPII(amount, "money", false);
  assert.equal(maskedMoney, "***.*** đ");

  // Authorized
  const unmasked = maskPII(amount, "aid", true);
  assert.ok(unmasked.includes("1.500.000"), "Unmasked currency must contain formatted number");
  assert.ok(unmasked.includes("₫") || unmasked.includes("VND"), "Must contain currency symbol");
});

test("Medical Information Masking: D03 privacy tag compliance", () => {
  const diagnosis = "Lao phổi tiến triển, điều trị ngoại trú có kiểm soát";

  // Unauthorized
  const masked = maskPII(diagnosis, "medical", false);
  assert.equal(masked, "[Thông tin y tế nhạy cảm - Bảo mật D03]");

  const maskedHealth = maskPII(diagnosis, "health", false);
  assert.equal(maskedHealth, "[Thông tin y tế nhạy cảm - Bảo mật D03]");

  // Authorized
  const unmasked = maskPII(diagnosis, "medical", true);
  assert.equal(unmasked, diagnosis);
});

test("Domestic Violence Victim Name Masking", () => {
  const victimName = "Nguyễn Thị Thảo";

  // Unauthorized
  const masked = maskPII(victimName, "victim", false);
  assert.equal(masked, "[Ẩn danh nạn nhân BLGĐ]");

  // Authorized
  const unmasked = maskPII(victimName, "victim", true);
  assert.equal(unmasked, victimName);
});

test("Persona Role Integration with PII Guardrails", () => {
  const cccd = "019012345678";
  const amount = 2000000;
  const victim = "Lê Thị Hoa";

  // P1 (Chủ tịch UBND xã): canViewPII = false
  assert.equal(maskPII(cccd, "cccd", PERSONAS.P1), "0190***678");
  assert.equal(maskPII(amount, "aid", PERSONAS.P1), "***.*** đ");
  assert.equal(maskPII(victim, "victim", PERSONAS.P1), "[Ẩn danh nạn nhân BLGĐ]");

  // P2 (Công chức VH-XH Xã A): canViewPII = true
  assert.equal(maskPII(cccd, "cccd", PERSONAS.P2), cccd);
  assert.ok(maskPII(amount, "aid", PERSONAS.P2).includes("2.000.000"));
  assert.equal(maskPII(victim, "victim", PERSONAS.P2), victim);

  // P3 (Công chức VH-XH Xã B): canViewPII = true
  assert.equal(maskPII(cccd, "cccd", PERSONAS.P3), cccd);

  // P4 (Trưởng thôn / Người dân): canViewPII = false
  assert.equal(maskPII(cccd, "cccd", PERSONAS.P4), "0190***678");
  assert.equal(maskPII(victim, "victim", PERSONAS.P4), "[Ẩn danh nạn nhân BLGĐ]");

  // P5 (Cán bộ Một cửa xã): canViewPII = true (xử lý hồ sơ công dân tiếp nhận)
  assert.equal(maskPII(cccd, "cccd", PERSONAS.P5), cccd);
});

test("Edge Cases: Null, undefined, empty string handling", () => {
  assert.equal(maskPII(null, "cccd", false), "—");
  assert.equal(maskPII(undefined, "phone", false), "—");
  assert.equal(maskPII("", "aid", false), "—");
  assert.equal(maskPII(null, "medical", true), "—");
  assert.equal(maskPII(undefined, "victim", true), "—");
});
