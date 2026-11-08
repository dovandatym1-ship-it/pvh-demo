export interface Persona {
  id: string;
  code: "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
  name: string;
  role: string;
  roleTitle: string;
  tenantId: string;
  permissions: string[];
  isConcurrent: boolean;
  canViewPII: boolean; // P1 không mặc nhiên đọc PII nhạy cảm theo D03
}

export const PERSONAS: Record<string, Persona> = {
  P1: {
    id: "user-p1",
    code: "P1",
    name: "Nguyễn Văn An",
    role: "CHAIRMAN",
    roleTitle: "Chủ tịch UBND xã",
    tenantId: "xa_a",
    permissions: [
      "m00:admin",
      "m01:view",
      "m02:view",
      "m04:view",
      "m08:view",
      "m09:view",
      "m09:sign_snapshot",
    ],
    isConcurrent: false,
    canViewPII: false, // Phải có ủy quyền hoặc lý do công vụ theo D03
  },
  P2: {
    id: "user-p2",
    code: "P2",
    name: "Trần Thị Mai",
    role: "OFFICER_CONCURRENT",
    roleTitle: "Công chức VH-XH (Kiêm nhiệm VH, LĐTBXH, Tôn giáo)",
    tenantId: "xa_a",
    permissions: [
      "m01:full",
      "m02:full",
      "m04:full",
      "m05:full",
      "m06:full",
      "m07:full",
      "m08:execute",
      "m09:draft",
      "m10:import",
    ],
    isConcurrent: true,
    canViewPII: true,
  },
  P3: {
    id: "user-p3",
    code: "P3",
    name: "Lê Văn Hùng",
    role: "OFFICER_SPECIALIZED",
    roleTitle: "Công chức VH-XH chuyên trách (Văn hóa, Thông tin, Gia đình)",
    tenantId: "xa_b",
    permissions: [
      "m01:view",
      "m04:full",
      "m05:view",
      "m09:draft",
    ],
    isConcurrent: false,
    canViewPII: true,
  },
  P4: {
    id: "user-p4",
    code: "P4",
    name: "Hoàng Văn Tuấn",
    role: "HAMLET_LEADER",
    roleTitle: "Trưởng thôn / Xóm trưởng Tân Thịnh",
    tenantId: "xa_a",
    permissions: [
      "m01:hamlet_view",
      "m04:propose_title",
      "m06:propose_aid",
    ],
    isConcurrent: false,
    canViewPII: false,
  },
  P5: {
    id: "user-p5",
    code: "P5",
    name: "Phạm Thị Lan",
    role: "ONE_STOP_CLERK",
    roleTitle: "Cán bộ Bộ phận Một cửa xã",
    tenantId: "xa_a",
    permissions: [
      "m01:intake",
      "m04:intake",
      "m06:intake",
    ],
    isConcurrent: false,
    canViewPII: true,
  },
  P6: {
    id: "user-p6",
    code: "P6",
    name: "Đỗ Minh Đức",
    role: "INSPECTOR",
    roleTitle: "Cán bộ Thanh tra / Kiểm tra liên ngành",
    tenantId: "xa_a",
    permissions: [
      "m08:full",
      "m04:inspect",
      "m06:inspect",
      "m09:view",
    ],
    isConcurrent: false,
    canViewPII: true,
  },
};

export function getPersona(code?: string): Persona {
  if (!code) return PERSONAS.P2;
  const key = code.toUpperCase();
  return PERSONAS[key] || PERSONAS.P2;
}
