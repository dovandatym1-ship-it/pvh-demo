/**
 * PII Masking Utilities for PVH Demo v1.0
 * Compliance: D03 Commune Authority Boundaries & AC-10 Privacy Guardrails
 */

import type { Persona } from "../auth/session";

export type PIIType = "cccd" | "phone" | "aid" | "money" | "medical" | "health" | "victim" | "general";

/**
 * Masks sensitive PII attributes based on canViewPII flag or Persona object.
 *
 * @param value The raw sensitive value (CCCD, phone number, aid amount, medical string, or victim name)
 * @param type The type of PII field being masked
 * @param viewerOrCanView Either a boolean (canViewPII) or a Persona object
 * @returns Masked or original string
 */
export function maskPII(
  value: string | number | undefined | null,
  type: PIIType,
  viewerOrCanView: boolean | Persona
): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const canViewPII = typeof viewerOrCanView === "boolean" 
    ? viewerOrCanView 
    : Boolean(viewerOrCanView?.canViewPII);

  const str = String(value).trim();

  // If user has permission to view unmasked PII
  if (canViewPII) {
    if ((type === "aid" || type === "money") && typeof value === "number") {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    }
    return str;
  }

  // When canViewPII is false, perform deterministic masking
  switch (type) {
    case "cccd": {
      const clean = str.replace(/\s+/g, "");
      if (clean.length < 8) return "******";
      return `${clean.substring(0, 4)}***${clean.substring(clean.length - 3)}`;
    }

    case "phone": {
      const clean = str.replace(/[\s.-]+/g, "");
      if (clean.length < 7) return "09******";
      return `${clean.substring(0, 4)}***${clean.substring(clean.length - 3)}`;
    }

    case "aid":
    case "money": {
      return "***.*** đ";
    }

    case "medical":
    case "health": {
      return "[Thông tin y tế nhạy cảm - Bảo mật D03]";
    }

    case "victim": {
      return "[Ẩn danh nạn nhân BLGĐ]";
    }

    case "general":
    default: {
      if (str.length <= 4) return "****";
      return `${str.substring(0, 2)}***${str.substring(str.length - 2)}`;
    }
  }
}
