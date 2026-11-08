export interface TenantConfig {
  id: string;
  code: string;
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
    id: "tenant-xa-a-uuid",
    code: "XA_A",
    name: "UBND Xã Thịnh Đức (Xã A mô phỏng)",
    province: "Thái Nguyên",
    hamlets: [
      { id: "xom-1", name: "Xóm Tân Thịnh" },
      { id: "xom-2", name: "Xóm Đồng Thịnh" },
      { id: "xom-3", name: "Xóm Đức Hòa" },
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
    id: "tenant-xa-b-uuid",
    code: "XA_B",
    name: "UBND Xã Tân Cương (Xã B mô phỏng)",
    province: "Thái Nguyên",
    hamlets: [
      { id: "xom-che", name: "Xóm Chè Đặc Sản" },
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

export function getTenant(idOrCode?: string): TenantConfig {
  if (!idOrCode) return TENANTS.xa_a;
  const key = idOrCode.toLowerCase().replace("-", "_");
  return TENANTS[key] || TENANTS.xa_a;
}
