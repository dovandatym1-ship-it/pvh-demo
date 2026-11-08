export interface TenantConfig {
  id: string;
  code: "TN-DEMO-A" | "TN-DEMO-B" | string;
  name: string;
  province: string;
  hamlets: Array<{ id: string; name: string }>;
  features: {
    digitalTransformation: boolean;
    fieldInspection: boolean;
    advancedCulturalTitles: boolean;
    interDepartmentalCoordination: boolean;
  };
  officerMode: "CONCURRENT" | "SPECIALIZED"; // Kiêm nhiệm vs Phân nhiệm
  status: "ACTIVE" | "INACTIVE";
}

export const TENANTS: Record<string, TenantConfig> = {
  xa_a: {
    id: "a0000000-0000-0000-0000-000000000001",
    code: "TN-DEMO-A",
    name: "UBND Xã Giả định A",
    province: "Thái Nguyên",
    hamlets: [
      { id: "xom-a1", name: "Xóm A1" },
      { id: "xom-a2", name: "Xóm A2" },
      { id: "xom-a3", name: "Xóm A3" },
    ],
    features: {
      digitalTransformation: true,
      fieldInspection: true,
      advancedCulturalTitles: true,
      interDepartmentalCoordination: true,
    },
    officerMode: "CONCURRENT", // 1 cán bộ kiêm nhiệm nhiều mảng
    status: "ACTIVE",
  },
  xa_b: {
    id: "a0000000-0000-0000-0000-000000000002",
    code: "TN-DEMO-B",
    name: "UBND Xã Giả định B",
    province: "Thái Nguyên",
    hamlets: [
      { id: "xom-b1", name: "Xóm B1" },
    ],
    features: {
      digitalTransformation: false, // Tắt CĐS
      fieldInspection: false,        // Tắt kiểm tra hiện trường mới
      advancedCulturalTitles: true,
      interDepartmentalCoordination: true,
    },
    officerMode: "SPECIALIZED", // 2 cán bộ phân nhiệm chuyên trách
    status: "ACTIVE",
  },
};

// Aliases for TN-DEMO-A and TN-DEMO-B
TENANTS.tn_demo_a = TENANTS.xa_a;
TENANTS.tn_demo_b = TENANTS.xa_b;

export function getTenant(idOrCode?: string): TenantConfig {
  if (!idOrCode) return TENANTS.xa_a;
  const normalized = idOrCode.toLowerCase().replace(/-/g, "_");
  if (normalized === "tn_demo_a" || normalized === "xa_a" || idOrCode === "a0000000-0000-0000-0000-000000000001" || idOrCode === "tenant-xa-a-uuid") {
    return TENANTS.xa_a;
  }
  if (normalized === "tn_demo_b" || normalized === "xa_b" || idOrCode === "a0000000-0000-0000-0000-000000000002" || idOrCode === "tenant-xa-b-uuid") {
    return TENANTS.xa_b;
  }
  return TENANTS[normalized] || TENANTS.xa_a;
}
