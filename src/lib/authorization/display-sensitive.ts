import { maskPII } from "./pii-mask";
import type { NCCBeneficiaryDTO, NCCBeneficiaryDisplayDTO } from "../../features/m02-internal-affairs/types";
import type { SocialBeneficiaryDTO, SocialBeneficiaryDisplayDTO } from "../../features/m06-health-social/types";

/** Redact on the server before crossing the React Server → Client boundary. */
export function toNccDisplayRows(items: readonly NCCBeneficiaryDTO[], canUnmask: boolean): NCCBeneficiaryDisplayDTO[] {
  return items.map(({ cccd, monthlyAllowance, ...safeFields }) => ({
    ...safeFields,
    cccdDisplay: maskPII(cccd, "cccd", canUnmask),
    allowanceDisplay: maskPII(monthlyAllowance, "money", canUnmask),
  }));
}

export function toSocialDisplayRows(items: readonly SocialBeneficiaryDTO[], canUnmask: boolean): SocialBeneficiaryDisplayDTO[] {
  return items.map(({ cccd, phone: _phone, diagnosis, monthlyAmount, ...safeFields }) => ({
    ...safeFields,
    cccdDisplay: maskPII(cccd, "cccd", canUnmask),
    diagnosisDisplay: maskPII(diagnosis, "medical", canUnmask),
    amountDisplay: maskPII(monthlyAmount, "money", canUnmask),
  }));
}
