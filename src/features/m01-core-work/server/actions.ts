"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { type Result, fail } from "@/lib/types/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CreateWorkItemSchema, TransitionWorkItemSchema, AssignWorkItemSchema, UpdateWorkItemDetailsSchema } from "../schemas/work-item.schema";
import { workItemService } from "./service";
import type { WorkItemDTO } from "../types";

async function authenticatedContext() {
  try { return await getRequestContext(); }
  catch { return null; }
}

function refreshWork() {
  revalidatePath("/cong-viec");
  revalidatePath("/ban-lam-viec");
}

export async function createWorkItemAction(input: unknown): Promise<Result<WorkItemDTO>> {
  const parsed = CreateWorkItemSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Dữ liệu tạo việc không hợp lệ", parsed.error.flatten());
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Phiên không hợp lệ hoặc không có phân công công tác");
  const result = await workItemService.createWorkItem(ctx, parsed.data);
  if (result.ok) refreshWork();
  return result;
}

export async function transitionWorkItemAction(input: unknown): Promise<Result<{ id: string; status: string; version: number; cached?: boolean }>> {
  const parsed = TransitionWorkItemSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Yêu cầu chuyển trạng thái không hợp lệ", parsed.error.flatten());
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Phiên không hợp lệ hoặc không có phân công công tác");
  const result = await workItemService.transitionWorkItem(ctx, parsed.data);
  if (result.ok) { refreshWork(); revalidatePath(`/cong-viec/${parsed.data.id}`); }
  return result;
}

export async function assignWorkItemAction(input: unknown): Promise<Result<{ id: string; status: string; version: number; cached?: boolean }>> {
  const parsed = AssignWorkItemSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Yêu cầu giao việc không hợp lệ", parsed.error.flatten());
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Phiên không hợp lệ hoặc không có phân công công tác");
  const result = await workItemService.assignWorkItem(ctx, parsed.data);
  if (result.ok) { refreshWork(); revalidatePath(`/cong-viec/${parsed.data.id}`); }
  return result;
}

export async function updateWorkItemDetailsAction(input: unknown): Promise<Result<{ id: string; status: string; version: number; cached?: boolean }>> {
  const parsed = UpdateWorkItemDetailsSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Thông tin điều chỉnh không hợp lệ", parsed.error.flatten());
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Phiên không hợp lệ hoặc không có phân công công tác");
  const result = await workItemService.updateWorkItemDetails(ctx, parsed.data);
  if (result.ok) { refreshWork(); revalidatePath(`/cong-viec/${parsed.data.id}`); }
  return result;
}

const EvidenceRegistration = z.object({
  workItemId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  size: z.number().int().min(1).max(52428800),
}).strict();

export async function registerEvidenceAction(input: unknown): Promise<Result<{ id: string; objectPath: string }>> {
  const parsed = EvidenceRegistration.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Tệp không hợp lệ (PDF/PNG/JPEG/DOCX, tối đa 50MB)");
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Chưa đăng nhập hoặc không có phân công công tác");
  try {
    const db = await createServerSupabaseClient();
    const { data, error } = await db.schema("app").rpc("register_evidence", {
      p_work_item_id: parsed.data.workItemId, p_original_name: parsed.data.fileName,
    });
    if (error) return fail(error.code === "42501" ? "FORBIDDEN" : "INTERNAL", "Không đăng ký được tệp minh chứng");
    if (!data?.id || !data?.object_path) return fail("INTERNAL", "Không nhận được mã minh chứng");
    return { ok: true, data: { id: data.id, objectPath: data.object_path } };
  } catch { return fail("INTERNAL", "Không thể kết nối kho minh chứng"); }
}

export async function finalizeEvidenceAction(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = z.object({ id: z.string().uuid(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict().safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Thông tin kiểm tra tệp không hợp lệ");
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Chưa đăng nhập hoặc không có phân công công tác");
  try {
    const db = await createServerSupabaseClient();
    const { data, error } = await db.schema("app").rpc("finalize_evidence", {
      p_id: parsed.data.id, p_sha256: parsed.data.sha256,
    });
    if (error) return fail(error.code === "42501" ? "FORBIDDEN" : "INTERNAL", "Không xác nhận được tệp trên Storage");
    if (data?.status !== "UPLOADED") return fail("INTERNAL", "Không thấy trạng thái hoàn tất lưu tệp");
    refreshWork();
    return { ok: true, data: { id: parsed.data.id } };
  } catch { return fail("INTERNAL", "Không thể xác nhận tệp minh chứng"); }
}

export async function abandonPendingEvidenceAction(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = z.object({ id: z.string().uuid() }).strict().safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Mã minh chứng không hợp lệ");
  const ctx = await authenticatedContext();
  if (!ctx) return fail("UNAUTHENTICATED", "Phiên không hợp lệ");
  try {
    const db = await createServerSupabaseClient();
    const { data, error } = await db.schema("app").rpc("abandon_pending_evidence", {
      p_id: parsed.data.id,
    });
    if (error) return fail(error.code === "42501" ? "FORBIDDEN" : "INTERNAL",
      "Không thể dọn bản ghi minh chứng: tệp có thể vẫn tồn tại trên Storage");
    if (data?.abandoned !== true) return fail("INTERNAL", "Chưa xác nhận dọn minh chứng");
    refreshWork();
    return { ok: true, data: { id: parsed.data.id } };
  } catch { return fail("INTERNAL", "Không thể kết nối kho minh chứng"); }
}
