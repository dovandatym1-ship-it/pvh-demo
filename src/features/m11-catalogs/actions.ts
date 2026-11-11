"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/types/result";
import {
 CreateCatalogSchema,UpdateCatalogSchema,
 CreateCatalogValueSchema,UpdateCatalogValueSchema,
} from "./catalog-schema";

type Receipt = { id: string; version: number };
type DbError = { code?: string | null } | null;
function translateError(error: DbError): Result<Receipt> {
  switch(error?.code){
    case "23505": return fail("VALIDATION","Mã đã tồn tại trong phạm vi danh mục này.");
    case "23503": return fail("VALIDATION","Danh mục hoặc mục cha không tồn tại.");
    case "PV409": return fail("VERSION_CONFLICT","Dữ liệu đã được người khác cập nhật. Hãy tải lại trước khi lưu.");
    case "42501": return fail("FORBIDDEN","Không được phép cập nhật danh mục này.");
    case "P0002": return fail("NOT_FOUND","Không tìm thấy danh mục hoặc giá trị.");
    case "22023": return fail("VALIDATION","Dữ liệu không hợp lệ, có vòng lặp phân cấp hoặc có mục con còn hiệu lực.");
    default: return fail("INTERNAL","Không thể lưu danh mục. Dữ liệu chưa được xác nhận.");
  }
}
function receipt(data: unknown): Result<Receipt> {
  if (!data || typeof data !== "object") return fail("INTERNAL","Không nhận được xác nhận ghi dữ liệu.");
  const row = data as Record<string,unknown>;
  if(typeof row.id!=="string" || typeof row.version!=="number") return fail("INTERNAL","Xác nhận ghi dữ liệu không hợp lệ.");
  revalidatePath("/danh-muc-dung-chung");
  return ok({id:row.id,version:row.version});
}

export async function createCatalogAction(input: unknown): Promise<Result<Receipt>> {
  const parsed=CreateCatalogSchema.safeParse(input);
  if(!parsed.success) return fail("VALIDATION","Mã, tên và mô tả danh mục chưa hợp lệ.",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertPermission(ctx,"m11:catalog:manage");
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("create_pvh_catalog",{
      p_code:parsed.data.code,p_label_vi:parsed.data.labelVi,p_description:parsed.data.description,
    });
    return error?translateError(error):receipt(data);
  }catch{return fail("FORBIDDEN","Không có quyền tạo danh mục hoặc phiên không hợp lệ.");}
}

export async function updateCatalogAction(input: unknown): Promise<Result<Receipt>> {
  const parsed=UpdateCatalogSchema.safeParse(input);
  if(!parsed.success) return fail("VALIDATION","Dữ liệu điều chỉnh danh mục không hợp lệ.",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertPermission(ctx,"m11:catalog:manage");
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("update_pvh_catalog",{
      p_catalog_id:parsed.data.id,p_expected_version:parsed.data.expectedVersion,
      p_label_vi:parsed.data.labelVi,p_description:parsed.data.description,
      p_is_active:parsed.data.isActive,
    });
    return error?translateError(error):receipt(data);
  }catch{return fail("FORBIDDEN","Không có quyền sửa danh mục hoặc phiên không hợp lệ.");}
}

export async function createCatalogValueAction(input: unknown): Promise<Result<Receipt>> {
  const parsed=CreateCatalogValueSchema.safeParse(input);
  if(!parsed.success) return fail("VALIDATION","Thông tin giá trị danh mục không hợp lệ.",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertPermission(ctx,"m11:catalog:manage");
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("create_pvh_catalog_value",{
      p_catalog_id:parsed.data.catalogId,p_code:parsed.data.code,p_label_vi:parsed.data.labelVi,
      p_parent_id:parsed.data.parentId,p_sort_order:parsed.data.sortOrder,
      p_valid_from:parsed.data.validFrom,p_valid_to:parsed.data.validTo,
    });
    return error?translateError(error):receipt(data);
  }catch{return fail("FORBIDDEN","Không có quyền thêm giá trị hoặc phiên không hợp lệ.");}
}

export async function updateCatalogValueAction(input: unknown): Promise<Result<Receipt>> {
  const parsed=UpdateCatalogValueSchema.safeParse(input);
  if(!parsed.success) return fail("VALIDATION","Thông tin điều chỉnh giá trị không hợp lệ.",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertPermission(ctx,"m11:catalog:manage");
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("update_pvh_catalog_value",{
      p_value_id:parsed.data.id,p_expected_version:parsed.data.expectedVersion,
      p_label_vi:parsed.data.labelVi,p_parent_id:parsed.data.parentId,
      p_sort_order:parsed.data.sortOrder,p_is_active:parsed.data.isActive,
      p_valid_from:parsed.data.validFrom,p_valid_to:parsed.data.validTo,
    });
    return error?translateError(error):receipt(data);
  }catch{return fail("FORBIDDEN","Không có quyền điều chỉnh giá trị hoặc phiên không hợp lệ.");}
}
