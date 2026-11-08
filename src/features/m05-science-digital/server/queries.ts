import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { DigitalIndicatorDTO, CommunityDigitalTeamDTO } from "../types";

export async function getDigitalIndicators(ctx: RequestContext): Promise<DigitalIndicatorDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("digital_indicators")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("code", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "b0000000-0000-0000-0000-000000000001",
        code: "CDS-01",
        name: "Tỷ lệ TTHC phát sinh hồ sơ trực tuyến",
        value: "86.5%",
        numericValue: 86.5,
        status: "CONFIRMED",
        isConfirmedZero: false,
        meaning: "Hồ sơ TTHC toàn trình và một phần nộp qua Cổng DVC",
        evaluationPeriod: "T10/2026",
      },
      {
        id: "b0000000-0000-0000-0000-000000000002",
        code: "CDS-02",
        name: "Tỷ lệ người trưởng thành có định danh VNeID Mức 2",
        value: "92.4%",
        numericValue: 92.4,
        status: "CONFIRMED",
        isConfirmedZero: false,
        meaning: "Căn cước điện tử công dân kích hoạt mức 2 phục vụ Đề án 06",
        evaluationPeriod: "T10/2026",
      },
      {
        id: "b0000000-0000-0000-0000-000000000003",
        code: "CDS-03",
        name: "Sự cố mất an toàn thông tin cơ sở",
        value: "0 sự cố",
        numericValue: 0,
        status: "CONFIRMED_ZERO",
        isConfirmedZero: true,
        meaning: "Xác nhận không xảy ra sự cố lộ lọt hay tấn công mạng (Số 0 hợp lệ)",
        evaluationPeriod: "T10/2026",
      },
      {
        id: "b0000000-0000-0000-0000-000000000004",
        code: "CDS-04",
        name: "Tỷ lệ hộ sản xuất nông nghiệp lên sàn TMĐT",
        value: "65.0%",
        numericValue: 65.0,
        status: "CONFIRMED",
        isConfirmedZero: false,
        meaning: "Quảng bá và tiêu thụ nông sản (Chè đặc sản địa phương giả định) qua sàn số",
        evaluationPeriod: "T10/2026",
      },
      {
        id: "b0000000-0000-0000-0000-000000000005",
        code: "CDS-05",
        name: "Tỷ lệ thôn/xóm có Tổ CNSCĐ hoạt động hiệu quả",
        value: "100%",
        numericValue: 100,
        status: "CONFIRMED",
        isConfirmedZero: false,
        meaning: "3/3 xóm có tổ nòng cốt hỗ trợ người dân thao tác dịch vụ số",
        evaluationPeriod: "T10/2026",
      },
      {
        id: "b0000000-0000-0000-0000-000000000006",
        code: "CDS-06",
        name: "Tỷ lệ thanh toán không dùng tiền mặt tại Một cửa",
        value: "78.2%",
        numericValue: 78.2,
        status: "CONFIRMED",
        isConfirmedZero: false,
        meaning: "Thu phí, lệ phí qua quét mã QR động VietQR / Napas",
        evaluationPeriod: "T10/2026",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    value: String(row.value),
    numericValue: row.numeric_value ? Number(row.numeric_value) : undefined,
    status: (row.status as DigitalIndicatorDTO["status"]) || "CONFIRMED",
    isConfirmedZero: Boolean(row.is_confirmed_zero),
    naReason: row.na_reason ? String(row.na_reason) : undefined,
    meaning: String(row.meaning),
    evaluationPeriod: String(row.evaluation_period),
  }));
}

export async function getCommunityDigitalTeams(ctx: RequestContext): Promise<CommunityDigitalTeamDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("community_digital_teams")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("hamlet_id", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "b1000000-0000-0000-0000-000000000001",
        hamletId: "A1",
        leaderName: "Nguyễn Thị Hương",
        leaderPhone: "0912111222",
        memberCount: 6,
        citizensSupported: 280,
        vneidLevel2Count: 260,
        status: "ACTIVE",
      },
      {
        id: "b1000000-0000-0000-0000-000000000002",
        hamletId: "A2",
        leaderName: "Trần Văn Mạnh",
        leaderPhone: "0913222333",
        memberCount: 5,
        citizensSupported: 230,
        vneidLevel2Count: 215,
        status: "ACTIVE",
      },
      {
        id: "b1000000-0000-0000-0000-000000000003",
        hamletId: "A3",
        leaderName: "Lê Hữu Phúc",
        leaderPhone: "0914333444",
        memberCount: 5,
        citizensSupported: 195,
        vneidLevel2Count: 180,
        status: "ACTIVE",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    hamletId: String(row.hamlet_id),
    leaderName: String(row.leader_name),
    leaderPhone: row.leader_phone ? String(row.leader_phone) : undefined,
    memberCount: Number(row.member_count) || 5,
    citizensSupported: Number(row.citizens_supported) || 0,
    vneidLevel2Count: Number(row.vneid_level2_count) || 0,
    status: (row.status as CommunityDigitalTeamDTO["status"]) || "ACTIVE",
  }));
}
