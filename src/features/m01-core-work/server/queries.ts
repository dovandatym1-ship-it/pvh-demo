import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { WorkItemDTO } from "../types";

export async function getWorkItems(ctx: RequestContext): Promise<WorkItemDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return [
        {
          id: "item-demo-01",
          tenantId: ctx.tenantId,
          title: "Chuẩn bị báo cáo tổng kết phong trào Toàn dân đoàn kết xây dựng đời sống văn hóa năm 2026",
          description: "Tổng hợp số liệu từ 5 thôn/xóm, hoàn thiện dự thảo báo cáo trình UBND huyện trước 15/11",
          status: "IN_PROGRESS",
          priority: "URGENT",
          category: "VAN_HOA",
          assignedTo: "user-p2",
          dueDate: "2026-11-15",
          hamletId: null,
          version: 1,
          idempotencyKey: "seed-item-01",
          createdAt: new Date().toISOString(),
          createdBy: "user-p1",
          updatedAt: new Date().toISOString(),
          updatedBy: "user-p2",
        },
        {
          id: "item-demo-02",
          tenantId: ctx.tenantId,
          title: "Rà soát danh sách đối tượng nhận trợ cấp bảo trợ xã hội quý IV/2026",
          description: "Kiểm tra danh sách 42 đối tượng người cao tuổi, người khuyết tật, bảo đảm chi trả đúng kỳ hạn",
          status: "ASSIGNED",
          priority: "HIGH",
          category: "LAO_DONG_XH",
          assignedTo: "user-p2",
          dueDate: "2026-11-20",
          hamletId: null,
          version: 1,
          idempotencyKey: "seed-item-02",
          createdAt: new Date().toISOString(),
          createdBy: "user-p1",
          updatedAt: new Date().toISOString(),
          updatedBy: "user-p1",
        },
        {
          id: "item-demo-03",
          tenantId: ctx.tenantId,
          title: "Kiểm tra hoạt động Tổ công nghệ số cộng đồng tại Thôn Bãi Chè",
          description: "Khảo sát thực tế tỷ lệ người dân cài đặt ứng dụng dịch vụ công trực tuyến và thanh toán không dùng tiền mặt",
          status: "UNDER_REVIEW",
          priority: "MEDIUM",
          category: "CHUYEN_DOI_SO",
          assignedTo: "user-p2",
          dueDate: "2026-11-25",
          hamletId: "xom-a1",
          version: 1,
          idempotencyKey: "seed-item-03",
          createdAt: new Date().toISOString(),
          createdBy: "user-p2",
          updatedAt: new Date().toISOString(),
          updatedBy: "user-p2",
        },
        {
          id: "item-demo-04",
          tenantId: ctx.tenantId,
          title: "Thẩm định hồ sơ công nhận danh hiệu Gia đình văn hóa tiêu biểu 2026",
          description: "Tiếp nhận 120 hồ sơ đề nghị từ các xóm, đối chiếu theo Bộ tiêu chí Gia đình văn hóa cấp xã",
          status: "COMPLETED",
          priority: "LOW",
          category: "VAN_HOA",
          assignedTo: "user-p2",
          dueDate: "2026-11-05",
          hamletId: null,
          version: 2,
          idempotencyKey: "seed-item-04",
          createdAt: new Date().toISOString(),
          createdBy: "user-p1",
          updatedAt: new Date().toISOString(),
          updatedBy: "user-p1",
        },
      ];
    }
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    title: String(row.title),
    description: (row.description as string) || null,
    status: (row.status as WorkItemDTO["status"]) || "NEW",
    priority: (row.priority as WorkItemDTO["priority"]) || "MEDIUM",
    category: (row.category as string) || "CHUNG",
    assignedTo: (row.assigned_to as string) || null,
    dueDate: (row.due_date as string) || null,
    hamletId: (row.hamlet_id as string) || null,
    version: Number(row.version) || 1,
    idempotencyKey: (row.idempotency_key as string) || null,
    createdAt: String(row.created_at),
    createdBy: String(row.created_by),
    updatedAt: String(row.updated_at),
    updatedBy: String(row.updated_by),
  }));
}

export async function getWorkItemById(
  ctx: RequestContext,
  id: string
): Promise<WorkItemDTO | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    tenantId: String(data.tenant_id),
    title: String(data.title),
    description: (data.description as string) || null,
    status: (data.status as WorkItemDTO["status"]) || "NEW",
    priority: (data.priority as WorkItemDTO["priority"]) || "MEDIUM",
    category: (data.category as string) || "CHUNG",
    assignedTo: (data.assigned_to as string) || null,
    dueDate: (data.due_date as string) || null,
    hamletId: (data.hamlet_id as string) || null,
    version: Number(data.version) || 1,
    idempotencyKey: (data.idempotency_key as string) || null,
    createdAt: String(data.created_at),
    createdBy: String(data.created_by),
    updatedAt: String(data.updated_at),
    updatedBy: String(data.updated_by),
  };
}
