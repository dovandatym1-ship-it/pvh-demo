import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AccountsConsole, type StaffRow } from "@/features/m00-platform/components/accounts-console";

export default async function ManageAccountsPage() {
  const ctx = await getRequestContext();
  // This page exposes write controls: viewing the directory alone is insufficient.
  assertPermission(ctx, "m00:membership:manage");

  const supabase = await createServerSupabaseClient();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("user_id, roles, is_active, org_unit_id")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("ACCOUNT_DIRECTORY_UNAVAILABLE");

  const ids = (memberships ?? []).map((m) => m.user_id);
  const profilesResult = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [], error: null };
  if (profilesResult.error) throw new Error("ACCOUNT_PROFILES_UNAVAILABLE");
  const { data: orgUnits, error: orgError } = await supabase
    .from("org_units")
    .select("id,name,kind")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .order("name");
  if (orgError) throw new Error("ACCOUNT_ORG_UNITS_UNAVAILABLE");
  const unitOptions = (orgUnits ?? []).map(unit => ({
    id: String(unit.id), name: String(unit.name), kind: String(unit.kind),
  }));
  const unitNames = new Map(unitOptions.map(unit => [unit.id, unit.name]));
  const names = new Map((profilesResult.data ?? []).map((p) => [p.id, p.full_name]));
  const staff: StaffRow[] = (memberships ?? []).map((m) => ({
    userId: m.user_id,
    fullName: names.get(m.user_id) || "Tài khoản chưa cập nhật hồ sơ",
    roles: Array.isArray(m.roles) ? m.roles : [],
    isActive: m.is_active,
    orgUnitName: m.org_unit_id ? unitNames.get(m.org_unit_id) ?? "Đơn vị chưa có trong danh mục" : "Chưa phân công đơn vị cụ thể",
  }));

  return <div className="mx-auto max-w-5xl space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản và phân quyền</h1>
      <p className="text-sm text-slate-600">Phạm vi một xã · Quyền có hiệu lực từ CSDL · Không cấp quyền xem hồ sơ nhạy cảm mặc định</p></div>
    <AccountsConsole staff={staff} orgUnits={unitOptions} />
  </div>;
}
