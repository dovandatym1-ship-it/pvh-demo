"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { updateOwnProfileAction, changeOwnPasswordAction } from "../server/actions";
import { PersonalContactSchema, PasswordChangeSchema } from "../schemas";

type Feedback = { ok: boolean; message: string } | null;
const fieldClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 aria-[invalid=true]:border-rose-500 disabled:opacity-60";

export function PersonalDetailsForm({ displayName, contactPhone, editable }: {
  displayName: string; contactPhone: string; editable: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(contactPhone);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; contactPhone?: string }>({});
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || pending) return;
    setFeedback(null);
    const parsed = PersonalContactSchema.safeParse({ displayName: name, contactPhone: phone });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({ displayName: fields.displayName?.[0], contactPhone: fields.contactPhone?.[0] });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await updateOwnProfileAction(parsed.data);
      setFeedback(result.ok
        ? { ok: true, message: "Đã cập nhật thông tin liên hệ." }
        : { ok: false, message: result.error.message });
      if (result.ok) router.refresh();
    } catch {
      setFeedback({ ok: false, message: "Kết nối gián đoạn. Vui lòng thử lại." });
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} noValidate className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="pvh-display-name" className="mb-1.5 block text-sm font-medium text-slate-700">Tên hiển thị <span aria-hidden="true">*</span></label>
        <input id="pvh-display-name" name="displayName" autoComplete="name" value={name}
          onChange={event => { setName(event.target.value); setErrors(prev => ({ ...prev, displayName: undefined })); }}
          disabled={!editable || pending} maxLength={80} required aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? "pvh-display-name-error" : undefined} className={fieldClass} />
        {errors.displayName && <p id="pvh-display-name-error" role="alert" className="mt-1 text-xs text-rose-700">{errors.displayName}</p>}
      </div>
      <div>
        <label htmlFor="pvh-contact-phone" className="mb-1.5 block text-sm font-medium text-slate-700">Số điện thoại liên hệ</label>
        <input id="pvh-contact-phone" type="tel" name="contactPhone" autoComplete="tel" value={phone}
          onChange={event => { setPhone(event.target.value); setErrors(prev => ({ ...prev, contactPhone: undefined })); }}
          disabled={!editable || pending} maxLength={20} placeholder="Nhập số liên hệ"
          aria-invalid={Boolean(errors.contactPhone)}
          aria-describedby={errors.contactPhone ? "pvh-contact-phone-error" : undefined} className={fieldClass}/>
        {errors.contactPhone && <p id="pvh-contact-phone-error" role="alert" className="mt-1 text-xs text-rose-700">{errors.contactPhone}</p>}
      </div>
    </div>
    <p className="text-xs leading-5 text-slate-500">Thông tin liên hệ tự khai không thay đổi hồ sơ cán bộ, đơn vị, vai trò hay phân quyền.</p>
    {feedback && <p role={feedback.ok ? "status" : "alert"}
      className={`text-sm ${feedback.ok ? "text-emerald-700" : "text-rose-700"}`}>{feedback.message}</p>}
    <button type="submit" disabled={!editable || pending}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1F633E] px-4 text-sm font-semibold text-white hover:bg-[#174E31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">
      <Save size={16} aria-hidden="true"/>{pending ? "Đang lưu..." : "Lưu thay đổi"}
    </button>
    {!editable && <p className="text-sm text-amber-700">Phiên demo chỉ xem thông tin, không thể cập nhật tài khoản thật.</p>}
  </form>;
}

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";
export function ChangePasswordForm({ editable }: { editable: boolean }) {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fields: Array<{ key: PasswordField; label: string; complete: string }> = [
    { key: "currentPassword", label: "Mật khẩu hiện tại", complete: "current-password" },
    { key: "newPassword", label: "Mật khẩu mới", complete: "new-password" },
    { key: "confirmPassword", label: "Nhập lại mật khẩu mới", complete: "new-password" },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || pending) return;
    setFeedback(null);
    const parsed = PasswordChangeSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        currentPassword: fieldErrors.currentPassword?.[0],
        newPassword: fieldErrors.newPassword?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await changeOwnPasswordAction(parsed.data);
      if (result.ok) {
        setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setFeedback({ ok: true, message: "Mật khẩu đã thay đổi. Hãy đăng nhập lại trên các thiết bị khác." });
      } else setFeedback({ ok: false, message: result.error.message });
    } catch {
      setFeedback({ ok: false, message: "Chưa xác thực được mật khẩu. Vui lòng thử lại." });
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} noValidate className="space-y-4">
    <p className="flex items-center gap-2 text-sm text-slate-600">
      <ShieldCheck size={17} aria-hidden="true"/>
      Mật khẩu không được lưu trong hồ sơ; thay đổi yêu cầu xác minh mật khẩu hiện tại.
    </p>
    {fields.map(field => <div key={field.key}>
      <label htmlFor={`pvh-${field.key}`} className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</label>
      <input id={`pvh-${field.key}`} type="password" value={values[field.key]}
        autoComplete={field.complete} disabled={!editable || pending}
        onChange={event => {
          setValues(prev => ({ ...prev, [field.key]: event.target.value }));
          setErrors(prev => ({ ...prev, [field.key]: undefined }));
        }}
        minLength={field.key === "currentPassword" ? 1 : 12}
        maxLength={72} required aria-invalid={Boolean(errors[field.key])}
        aria-describedby={errors[field.key] ? `pvh-${field.key}-error` : undefined}
        className={fieldClass}/>
      {errors[field.key] && <p id={`pvh-${field.key}-error`} role="alert" className="mt-1 text-xs text-rose-700">{errors[field.key]}</p>}
    </div>)}
    {feedback && <p role={feedback.ok ? "status" : "alert"}
      className={`text-sm ${feedback.ok ? "text-emerald-700" : "text-rose-700"}`}>{feedback.message}</p>}
    <button type="submit" disabled={!editable || pending}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">
      <KeyRound size={16} aria-hidden="true"/>{pending ? "Đang cập nhật..." : "Đổi mật khẩu"}
    </button>
  </form>;
}
