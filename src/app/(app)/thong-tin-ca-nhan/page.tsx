import { UserRound, Shield, Mail, Building2 } from "lucide-react";
import { getPersonalAccount } from "@/features/self-service/server/account";
import { PersonalDetailsForm, ChangePasswordForm } from "@/features/self-service/components/account-forms";
import { AvatarUploader } from "@/features/self-service/components/avatar-uploader";

export const dynamic = "force-dynamic";

export default async function PersonalAccountPage() {
  const account = await getPersonalAccount();
  return <div className="mx-auto max-w-5xl space-y-6 pb-8">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <UserRound size={30} aria-hidden="true"/>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thông tin cá nhân</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">Quản lý thông tin liên hệ và bảo mật tài khoản đang đăng nhập.</p>
        </div>
        <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          {account.editable ? "Tài khoản xác thực" : "Chế độ chỉ xem"}
        </span>
      </div>
    </header>
    <AvatarUploader editable={account.editable} initialVersion={account.avatarVersion}/>
    <section className="grid gap-4 md:grid-cols-2" aria-label="Thông tin công tác">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm text-slate-500"><Mail size={16} aria-hidden="true"/> Email đăng nhập</div>
        <p className="mt-2 break-all font-medium text-slate-900">{account.email ?? "Không có email xác thực trong phiên này"}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm text-slate-500"><Building2 size={16} aria-hidden="true"/> Vai trò công tác (chỉ đọc)</div>
        <p className="mt-2 font-medium text-slate-900">{account.roles.length ? account.roles.join(", ") : "Chưa xác định"}</p>
      </div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-lg font-semibold text-slate-900">Thông tin liên hệ</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">Chỉ sửa các trường do chính bạn tự khai.</p>
      <PersonalDetailsForm displayName={account.displayName ?? ""} contactPhone={account.contactPhone ?? ""}
        editable={account.editable}/>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="security-heading">
      <div className="mb-5 flex items-center gap-2">
        <Shield size={20} className="text-emerald-800" aria-hidden="true"/>
        <h2 id="security-heading" className="text-lg font-semibold text-slate-900">Bảo mật tài khoản</h2>
      </div>
      <ChangePasswordForm editable={account.editable}/>
    </section>
  </div>;
}
