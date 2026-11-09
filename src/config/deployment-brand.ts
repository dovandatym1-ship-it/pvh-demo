/**
 * Presentation-only labels for a single-commune deployment.
 * Auth/tenant scopes MUST come from verified memberships and RLS, not these labels.
 */
export function normalizeDeploymentLabel(value: string | undefined, fallback: string): string {
  const label = value?.trim() ?? "";
  if (label.length < 3 || label.length > 100 || /[<>\x00-\x1f]/.test(label)) return fallback;
  return label;
}

export const deploymentBrand = {
  organizationName: normalizeDeploymentLabel(
    process.env.NEXT_PUBLIC_ORGANIZATION_NAME,
    "Phòng Văn hóa – Xã hội cấp xã"
  ),
  regionLabel: normalizeDeploymentLabel(
    process.env.NEXT_PUBLIC_REGION_LABEL,
    "Đơn vị hành chính cấp xã"
  ),
} as const;
