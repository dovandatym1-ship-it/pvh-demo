"use client";

import * as React from "react";
import { useDemoContext } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmptyState } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import {
  ShieldCheck,
  Users,
  Settings,
  History,
  CheckCircle2,
  UserPlus,
  Search,
  Filter,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Edit,
  Mail,
  Phone,
  AlertOctagon,
  FileCheck,
} from "lucide-react";
import { PERSONAS, Persona } from "@/lib/auth/session";

interface UserAccount {
  id: string;
  code: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  roleTitle: string;
  roleCode: "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
  assignedHamlet?: string;
  canViewPII: boolean;
  status: "ACTIVE" | "LOCKED" | "PENDING";
  createdAt: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: "usr-1",
    code: "CB-001",
    fullName: "Nguyễn Văn An",
    username: "an.nguyen",
    email: "an.nguyen@pvh.thainguyen.gov.vn",
    phone: "0912.345.678",
    roleTitle: "Chủ tịch UBND xã",
    roleCode: "P1",
    assignedHamlet: "Toàn xã",
    canViewPII: false,
    status: "ACTIVE",
    createdAt: "2026-01-10",
  },
  {
    id: "usr-2",
    code: "CB-002",
    fullName: "Trần Thị Mai",
    username: "mai.tran",
    email: "mai.tran@pvh.thainguyen.gov.vn",
    phone: "0988.765.432",
    roleTitle: "Công chức VH-XH (Kiêm nhiệm)",
    roleCode: "P2",
    assignedHamlet: "Toàn xã (VH, LĐTBXH, Tôn giáo)",
    canViewPII: true,
    status: "ACTIVE",
    createdAt: "2026-01-15",
  },
  {
    id: "usr-3",
    code: "CB-003",
    fullName: "Lê Văn Hùng",
    username: "hung.le",
    email: "hung.le@pvh.thainguyen.gov.vn",
    phone: "0977.112.233",
    roleTitle: "Công chức VH-XH (Chuyên trách)",
    roleCode: "P3",
    assignedHamlet: "Toàn xã (Văn hóa, Thông tin)",
    canViewPII: true,
    status: "ACTIVE",
    createdAt: "2026-02-01",
  },
  {
    id: "usr-4",
    code: "CB-004",
    fullName: "Hoàng Văn Tuấn",
    username: "tuan.hoang",
    email: "tuan.hoang@pvh.thainguyen.gov.vn",
    phone: "0966.554.433",
    roleTitle: "Trưởng thôn / Xóm trưởng",
    roleCode: "P4",
    assignedHamlet: "Xóm Tân Thịnh",
    canViewPII: false,
    status: "ACTIVE",
    createdAt: "2026-02-15",
  },
  {
    id: "usr-5",
    code: "CB-005",
    fullName: "Phạm Thị Lan",
    username: "lan.pham",
    email: "lan.pham@pvh.thainguyen.gov.vn",
    phone: "0944.889.900",
    roleTitle: "Cán bộ Bộ phận Một cửa",
    roleCode: "P5",
    assignedHamlet: "Bộ phận Một cửa cấp xã",
    canViewPII: true,
    status: "ACTIVE",
    createdAt: "2026-03-01",
  },
  {
    id: "usr-6",
    code: "CB-006",
    fullName: "Đỗ Minh Đức",
    username: "duc.do",
    email: "duc.do@pvh.thainguyen.gov.vn",
    phone: "0933.221.144",
    roleTitle: "Cán bộ Thanh tra liên ngành",
    roleCode: "P6",
    assignedHamlet: "Đoàn kiểm tra liên ngành",
    canViewPII: true,
    status: "ACTIVE",
    createdAt: "2026-03-15",
  },
];

export default function QuanTriPage() {
  const { tenant, delegationExpired, setDelegationExpired, auditLogs, addAuditLog } = useDemoContext();
  const [users, setUsers] = React.useState<UserAccount[]>(INITIAL_USERS);
  const [search, setSearch] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("ALL");

  // Audit filter state
  const [auditSearch, setAuditSearch] = React.useState("");
  const [auditModuleFilter, setAuditModuleFilter] = React.useState("ALL");

  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [roleCode, setRoleCode] = React.useState<"P1" | "P2" | "P3" | "P4" | "P5" | "P6">("P2");
  const [assignedHamlet, setAssignedHamlet] = React.useState(tenant.hamlets[0]?.name || "Toàn xã");
  const [canViewPII, setCanViewPII] = React.useState(true);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.roleCode === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    const term = auditSearch.toLowerCase();
    const matchesSearch =
      !term ||
      log.action.toLowerCase().includes(term) ||
      log.personaCode.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term) ||
      log.entityId.toLowerCase().includes(term) ||
      (log.details?.message && String(log.details.message).toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(term));
    const matchesModule = auditModuleFilter === "ALL" || log.entityType === auditModuleFilter;
    return matchesSearch && matchesModule;
  });

  const handleCreateUser = () => {
    if (!fullName.trim() || !username.trim()) return;

    const personaRef = PERSONAS[roleCode];
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      code: `CB-00${users.length + 1}`,
      fullName,
      username,
      email: `${username}@pvh.thainguyen.gov.vn`,
      phone: phone || "0912.000.111",
      roleTitle: personaRef.roleTitle,
      roleCode,
      assignedHamlet,
      canViewPII,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([...users, newUser]);
    setFullName("");
    setUsername("");
    setPhone("");
    setIsModalOpen(false);
  };

  const handleToggleLock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            status: u.status === "ACTIVE" ? "LOCKED" : "ACTIVE",
          };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* AC-09 Warning Banner when delegation is expired */}
      {delegationExpired && (
        <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-950 shadow-md">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm text-rose-900 block">
                CẢNH BÁO: Giấy ủy quyền ký số của Lãnh đạo đã hết hạn hiệu lực (AC-09).
              </span>
              <p className="leading-relaxed text-rose-800">
                Tất cả các thao tác ký số, phê duyệt báo cáo Oracle sẽ bị tạm khóa cho đến khi gia hạn.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0 font-semibold"
            onClick={() => {
              setDelegationExpired(false);
              addAuditLog({
                action: "DELEGATION_RENEWED",
                entityType: "DELEGATION_AUTHORITY",
                entityId: "AC-09",
                details: { message: "Gia hạn giấy ủy quyền ký số của Lãnh đạo thành công từ Banner cảnh báo" },
              });
            }}
          >
            Gia hạn ủy quyền ngay
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F633E]">
            Phân hệ M00 • Quản trị nền tảng & Tổ chức
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Quản trị Người dùng, Phân công Cán bộ & Tham số Đa xã
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tài khoản công chức, gán vai trò theo nhân vật (P1–P6), phân bổ địa bàn và bảo vệ dữ liệu cá nhân theo nguyên tắc D03.
          </p>
        </div>

        {/* AC-09 Delegation Expiry Toggle Control */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <FileCheck className="w-4 h-4 text-[#1F633E]" />
              <span>Mô phỏng Ủy quyền Ký số (AC-09)</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {delegationExpired ? (
                <span className="text-rose-600 font-semibold">Trạng thái: ĐÃ HẾT HẠN (Tạm khóa)</span>
              ) : (
                <span className="text-emerald-700 font-medium">Trạng thái: Đang có hiệu lực</span>
              )}
            </span>
          </div>
          <Button
            size="sm"
            variant={delegationExpired ? "danger" : "outline"}
            onClick={() => {
              const nextVal = !delegationExpired;
              setDelegationExpired(nextVal);
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
            }}
            className="text-xs shrink-0"
          >
            {delegationExpired ? "Khôi phục hiệu lực" : "Kích hoạt hết hạn"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabList className="bg-slate-200/70 p-1">
          <TabTrigger value="users">
            <Users className="w-3.5 h-3.5 mr-1.5" /> Quản lý Người dùng & Cán bộ ({users.length})
          </TabTrigger>
          <TabTrigger value="tenants">
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Cấu hình Tham số Đa xã
          </TabTrigger>
          <TabTrigger value="audit">
            <History className="w-3.5 h-3.5 mr-1.5" /> Nhật ký Kiểm toán (Audit Trail) ({auditLogs.length})
          </TabTrigger>
        </TabList>

        {/* TAB 1: USER MANAGEMENT */}
        <TabContent value="users" className="space-y-4 pt-2">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Tổng số tài khoản</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{users.length} tài khoản</div>
                </div>
                <Users className="w-7 h-7 text-[#1F633E]/30" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Đang hoạt động</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">
                    {users.filter((u) => u.status === "ACTIVE").length} cán bộ
                  </div>
                </div>
                <CheckCircle2 className="w-7 h-7 text-emerald-600/30" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Được cấp quyền xem PII</div>
                  <div className="text-xl font-bold text-sky-700 mt-0.5">
                    {users.filter((u) => u.canViewPII).length} người
                  </div>
                </div>
                <KeyRound className="w-7 h-7 text-sky-600/30" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Bảo vệ PII nghiêm ngặt</div>
                  <div className="text-xl font-bold text-indigo-700 mt-0.5">Nguyên tắc D03</div>
                </div>
                <ShieldCheck className="w-7 h-7 text-indigo-600/30" />
              </CardContent>
            </Card>
          </div>

          {/* User Table Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle>Danh sách Cán bộ, Công chức & Tài khoản Cơ sở</CardTitle>
                <CardDescription>
                  Phân công nhiệm vụ theo chức danh, địa bàn phụ trách và cấp quyền truy cập các phân hệ
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Tìm tên, username, mã..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 h-8"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="P1">P1 - Chủ tịch UBND</option>
                  <option value="P2">P2 - Công chức Kiêm nhiệm</option>
                  <option value="P3">P3 - Công chức Chuyên trách</option>
                  <option value="P4">P4 - Trưởng thôn/Xóm</option>
                  <option value="P5">P5 - Cán bộ Một cửa</option>
                  <option value="P6">P6 - Thanh tra/Kiểm tra</option>
                </select>

                <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-8 shrink-0">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Thêm cán bộ mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã CB</TableHead>
                    <TableHead>Họ và tên / Tài khoản</TableHead>
                    <TableHead>Chức vụ / Vai trò</TableHead>
                    <TableHead>Địa bàn phụ trách</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Quyền PII</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {u.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-400">@{u.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="neutral" className="font-mono text-[10px]">
                            {u.roleCode}
                          </Badge>
                          <span className="text-xs text-slate-700 font-medium">{u.roleTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{u.assignedHamlet}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div>{u.phone}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        {u.canViewPII ? (
                          <Badge variant="info">Cho phép đọc</Badge>
                        ) : (
                          <Badge variant="neutral">Ẩn PII (D03)</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.status === "ACTIVE" ? (
                          <Badge variant="success">Hoạt động</Badge>
                        ) : (
                          <Badge variant="danger">Đã khóa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={u.status === "ACTIVE" ? "outline" : "secondary"}
                          className="h-7 text-xs"
                          onClick={() => handleToggleLock(u.id)}
                        >
                          {u.status === "ACTIVE" ? (
                            <>
                              <Lock className="w-3 h-3 mr-1 text-slate-500" /> Khóa
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3 mr-1 text-emerald-600" /> Mở khóa
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* TAB 2: TENANT SETTINGS */}
        <TabContent value="tenants" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình Đơn vị hành chính cấp xã</CardTitle>
                <CardDescription>Các cờ tính năng (Feature Flags) của {tenant.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-800">Chuyển đổi số (M05)</div>
                    <div className="text-[11px] text-slate-500">Tổ CNS cộng đồng, VNeID, thanh toán số</div>
                  </div>
                  <Badge variant={tenant.features.digitalTransformation ? "success" : "neutral"}>
                    {tenant.features.digitalTransformation ? "BẬT" : "TẮT"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-800">Kiểm tra hiện trường (M08)</div>
                    <div className="text-[11px] text-slate-500">Biên bản kiểm tra và kiến nghị khắc phục</div>
                  </div>
                  <Badge variant={tenant.features.fieldInspection ? "success" : "neutral"}>
                    {tenant.features.fieldInspection ? "BẬT" : "TẮT"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-800">Mô hình phân công cán bộ</div>
                    <div className="text-[11px] text-slate-500">Kiêm nhiệm đa lĩnh vực vs Phân nhiệm chuyên sâu</div>
                  </div>
                  <Badge variant="info">
                    {tenant.officerMode === "CONCURRENT" ? "KIÊM NHIỆM" : "PHÂN NHIỆM"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-semibold text-slate-800">Cơ chế bảo vệ dữ liệu cá nhân (PII)</div>
                    <div className="text-[11px] text-slate-500">Áp dụng nguyên tắc D03 bảo vệ thông tin công dân</div>
                  </div>
                  <Badge variant="success">BẢO MẬT CHẶT CHẼ</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quy hoạch Địa bàn Xóm / Thôn cơ sở</CardTitle>
                <CardDescription>Danh sách các thôn/xóm thuộc thẩm quyền quản trị của {tenant.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {tenant.hamlets.map((h, i) => (
                  <div key={h.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{h.name}</div>
                      <div className="text-[11px] text-slate-500">Mã địa bàn: {h.id}</div>
                    </div>
                    <Badge variant="info">Địa bàn cấp xóm</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* TAB 3: AUDIT TRAIL */}
        <TabContent value="audit" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle>Nhật ký Kiểm toán Hệ thống (Audit Trail)</CardTitle>
                <CardDescription>
                  Ghi nhận tự động mọi thao tác nhạy cảm, phê duyệt, ký số và biến động hệ thống (AC-09, D03)
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Tìm theo hành động, nội dung, mã..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <select
                  value={auditModuleFilter}
                  onChange={(e) => setAuditModuleFilter(e.target.value)}
                  className="text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white h-8"
                >
                  <option value="ALL">Tất cả phân hệ ({auditLogs.length})</option>
                  <option value="SYSTEM">Hệ thống nền tảng</option>
                  <option value="REPORT">Báo cáo & Ký số Oracle</option>
                  <option value="DELEGATION_AUTHORITY">Ủy quyền ký số (AC-09)</option>
                  <option value="SHARED_DATA">Dữ liệu dùng chung / Ghép định danh</option>
                  <option value="TASK">Nhiệm vụ liên ngành</option>
                  <option value="CULTURAL_TITLE">Văn hóa & Gia đình</option>
                  <option value="INSPECTION">Kiểm tra liên ngành</option>
                  <option value="TENANT">Phân định Đa xã / Reset</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Thời điểm</TableHead>
                    <TableHead className="w-32">Người thực hiện</TableHead>
                    <TableHead className="w-44">Hành động</TableHead>
                    <TableHead className="w-36">Phân hệ / Mã</TableHead>
                    <TableHead>Chi tiết nghiệp vụ</TableHead>
                    <TableHead className="w-36">Địa bàn xã</TableHead>
                    <TableHead className="w-28">Địa chỉ IP</TableHead>
                    <TableHead className="w-24 text-right pr-4">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.length === 0 ? (
                    <TableEmptyState
                      title="Không tìm thấy nhật ký kiểm toán phù hợp"
                      description="Thử thay đổi bộ lọc phân hệ hoặc từ khóa tìm kiếm."
                      colSpan={8}
                    />
                  ) : (
                    filteredAuditLogs.map((a) => {
                      const dateStr = new Date(a.timestamp).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });
                      const isTenantB =
                        a.tenantId.toLowerCase().includes("b") ||
                        (a.details?.preservedTenant && a.details.preservedTenant === "XA_A");
                      const tenantLabel = isTenantB ? "Xã Giả định B (TN-DEMO-B)" : "Xã Giả định A (TN-DEMO-A)";

                      return (
                        <TableRow key={a.id} className="hover:bg-slate-50/80">
                          <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {dateStr}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800 text-xs">
                            <span className="inline-flex items-center gap-1.5">
                              <Badge variant="info" className="text-[10px] py-0 px-1.5 font-bold">
                                {a.personaCode}
                              </Badge>
                              <span>{PERSONAS[a.personaCode as keyof typeof PERSONAS]?.name || a.userId}</span>
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-[#1F633E]">
                            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                              {a.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-semibold text-slate-800">{a.entityType}</div>
                            <div className="font-mono text-[11px] text-slate-500">{a.entityId}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 max-w-xs sm:max-w-md">
                            {String(a.details?.message || (a.details ? JSON.stringify(a.details) : "—"))}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant={isTenantB ? "warning" : "neutral"} className="text-[10px]">
                              {tenantLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-slate-500">
                            {a.ipAddress || "127.0.0.1"}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Badge variant="success" className="text-[10px] py-0.5">
                              Hợp lệ
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* Modal Thêm cán bộ mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm tài khoản cán bộ công chức mới"
        description="Khởi tạo tài khoản, phân quyền vai trò và phân bổ địa bàn phụ trách"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleCreateUser}>
              Khởi tạo tài khoản
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Họ và tên cán bộ *</label>
            <Input
              placeholder="VD: Nguyễn Văn Cường"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tên đăng nhập (Username) *</label>
              <Input
                placeholder="VD: cuong.nguyen"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số điện thoại liên hệ</label>
              <Input
                placeholder="VD: 0988.123.456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Vai trò chức danh (Persona)</label>
              <select
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value as any)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-1.5 bg-white"
              >
                <option value="P1">P1 - Chủ tịch UBND xã</option>
                <option value="P2">P2 - Công chức Kiêm nhiệm</option>
                <option value="P3">P3 - Công chức Chuyên trách</option>
                <option value="P4">P4 - Trưởng thôn/Xóm trưởng</option>
                <option value="P5">P5 - Cán bộ Một cửa tiếp nhận</option>
                <option value="P6">P6 - Cán bộ Kiểm tra/Thanh tra</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Địa bàn / Nhiệm vụ phụ trách</label>
              <select
                value={assignedHamlet}
                onChange={(e) => setAssignedHamlet(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-1.5 bg-white"
              >
                <option value="Toàn xã">Toàn xã</option>
                {tenant.hamlets.map((h) => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                ))}
                <option value="Bộ phận Một cửa">Bộ phận Một cửa</option>
                <option value="Đoàn kiểm tra liên ngành">Đoàn kiểm tra liên ngành</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Quyền truy cập thông tin định danh cá nhân (PII):</span>
              <input
                type="checkbox"
                checked={canViewPII}
                onChange={(e) => setCanViewPII(e.target.checked)}
                className="rounded border-slate-300 text-[#1F633E] focus:ring-[#1F633E]"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Tuân thủ nguyên tắc D03: Chỉ cấp quyền đọc PII cho cán bộ trực tiếp thụ lý hồ sơ (P2, P3, P5, P6).
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
