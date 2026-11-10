"use client";

import { useState, useTransition, type FormEvent } from "react";
import { inviteStaffAction, revokeStaffAction, setStaffRoleAction } from "../server/accounts";

const ROLE_OPTIONS = [
  {code:"SYSTEM_ADMIN",label:"Quản trị hệ thống"},
  {code:"WORK_MANAGER",label:"Quản lý công việc"},
  {code:"WORK_OFFICER",label:"Cán bộ xử lý công việc"},
  {code:"WORK_VIEWER",label:"Người được xem công việc"},
  {code:"AUDITOR",label:"Cán bộ kiểm tra"},
  {code:"FAITH_OFFICER",label:"Cán bộ dân tộc, tín ngưỡng và tôn giáo"},
  {code:"FAITH_MANAGER",label:"Quản lý công tác dân tộc, tín ngưỡng và tôn giáo"},
  {code:"SOCIAL_OFFICER",label:"Cán bộ y tế và an sinh xã hội"},
  {code:"SOCIAL_MANAGER",label:"Quản lý y tế và an sinh xã hội"},
  {code:"EDUCATION_OFFICER",label:"Cán bộ giáo dục"},
  {code:"EDUCATION_REVIEWER",label:"Cán bộ được phân công rà soát hồ sơ giáo dục"},
  {code:"INTERNAL_OFFICER",label:"Cán bộ nội vụ và lao động"},
  {code:"INTERNAL_REVIEWER",label:"Cán bộ rà soát nội vụ và lao động"},
] as const;
const roleLabel=(code:string)=>ROLE_OPTIONS.find(role=>role.code===code)?.label??"Vai trò chưa có nhãn";

export interface StaffRow {
  userId: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
}

export function AccountsConsole({ staff }: { staff: StaffRow[] }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await inviteStaffAction({
        email: String(data.get("email") || ""),
        fullName: String(data.get("fullName") || ""),
        roleCode: String(data.get("roleCode") || ""),
      });
      setFeedback(result.ok ? "Đã gửi lời mời và tạo phân công; tải lại danh sách để đối chiếu." : result.error.message);
      if (result.ok) form.reset();
    });
  };

  const updateRole = (userId: string, grant: boolean) => {
    const role = selectedRoles[userId];
    if (!role) return setFeedback("Chọn một vai trò trước khi cập nhật.");
    if (!window.confirm(`${grant ? "Cấp" : "Thu hồi"} quyền ${roleLabel(role)} cho tài khoản này?`)) return;
    startTransition(async () => {
      const result = await setStaffRoleAction(userId, role, grant);
      setFeedback(result.ok ? "Đã cập nhật vai trò. Làm mới trang để đối soát." : result.error.message);
    });
  };

  const revoke = (userId: string) => {
    if (!window.confirm("Thu hồi toàn bộ phân công? Người này sẽ mất quyền ngay ở yêu cầu tiếp theo; lịch sử vẫn được giữ.")) return;
    startTransition(async () => {
      const result = await revokeStaffAction(userId);
      setFeedback(result.ok ? "Đã thu hồi phân công. Làm mới trang để đối soát." : result.error.message);
    });
  };

  return (
    <div className="space-y-6">
      {feedback && <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">{feedback}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Mời cán bộ vào hệ thống</h2>
        <p className="text-sm text-slate-600">Thư mời được gửi qua Supabase Auth. Quyền sẽ được cấp theo vai trò đã chọn; không tạo mật khẩu mặc định.</p>
        <form onSubmit={submitInvite} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Họ và tên
            <input className="mt-1 w-full rounded border p-2" name="fullName" maxLength={150} required autoComplete="name" />
          </label>
          <label className="text-sm">Email công vụ
            <input className="mt-1 w-full rounded border p-2" type="email" name="email" required autoComplete="email" />
          </label>
          <label className="text-sm">Vai trò ban đầu
            <select className="mt-1 w-full rounded border p-2" name="roleCode" required defaultValue="WORK_OFFICER">
              {ROLE_OPTIONS.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
            </select>
          </label>
          <button disabled={pending} type="submit" className="self-end rounded bg-emerald-700 p-2 font-semibold text-white disabled:opacity-50">{pending ? "Đang xử lý..." : "Gửi lời mời và phân công"}</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Danh sách phân công</h2>
        {staff.length === 0 && <p className="text-sm text-slate-500">Chưa có tài khoản được phân công.</p>}
        {staff.map((person) => (
          <div key={person.userId} className="rounded-lg border border-slate-200 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{person.fullName}</p>
                <p className="text-xs text-slate-500">{person.roles.map(roleLabel).join(", ") || "Chưa được cấp vai trò"}</p>
              </div>
              <span className={`text-xs rounded-full px-2 py-1 ${person.isActive ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                {person.isActive ? "Đang hiệu lực" : "Đã thu hồi"}
              </span>
            </div>
            {person.isActive && <div className="flex flex-wrap gap-2 items-center">
              <select aria-label={`Vai trò cho ${person.fullName}`} className="rounded border p-2 text-sm" value={selectedRoles[person.userId] || ""} onChange={(e) => setSelectedRoles((old) => ({ ...old, [person.userId]: e.target.value }))}>
                <option value="">Chọn vai trò</option>
                {ROLE_OPTIONS.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
              </select>
              <button disabled={pending} onClick={() => updateRole(person.userId, true)} className="rounded border p-2 text-sm">Cấp vai trò</button>
              <button disabled={pending} onClick={() => updateRole(person.userId, false)} className="rounded border p-2 text-sm">Thu hồi vai trò</button>
              <button disabled={pending} onClick={() => revoke(person.userId)} className="rounded border border-red-200 p-2 text-sm text-red-700">Thu hồi phân công</button>
            </div>}
          </div>
        ))}
      </section>
    </div>
  );
}
