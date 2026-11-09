"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/types/result";
import { AVATAR_BUCKET, MAX_AVATAR_BYTES, avatarObjectPath, validateNormalizedJpeg } from "../avatar-contract";

async function authenticated() {
  const ctx = await getRequestContext();
  const db = await createServerSupabaseClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || user.id !== ctx.userId) return null;
  return { db, user };
}

export async function uploadOwnAvatarAction(formData: FormData): Promise<Result<{ version: number }>> {
  const file = formData.get("avatar");
  if (!(file instanceof Blob) || file.type !== "image/jpeg" || file.size > MAX_AVATAR_BYTES || file.size < 32) {
    return fail("VALIDATION", "Ảnh đại diện phải là JPEG hợp lệ, nhỏ hơn 1 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const issue = validateNormalizedJpeg(bytes);
  if (issue) return fail("VALIDATION", issue);
  try {
    const session = await authenticated();
    if (!session) return fail("FORBIDDEN", "Phiên demo không được phép cập nhật ảnh thật.");
    const path = avatarObjectPath(session.user.id);
    const { error } = await session.db.storage.from(AVATAR_BUCKET).upload(path, file, {
      contentType: "image/jpeg", cacheControl: "30", upsert: true,
    });
    if (error) return fail("INTERNAL", "Chưa tải ảnh lên được. Kiểm tra quyền Storage hoặc kết nối.");
    const version = Date.now();
    // Metadata is only a cache-busting display value, never an authorization source.
    const { error: versionError } = await session.db.auth.updateUser({ data: { avatar_updated_at: version } });
    if (versionError) return fail("INTERNAL", "Ảnh đã lưu nhưng chưa đồng bộ giao diện. Tải lại trang để kiểm tra.");
    revalidatePath("/thong-tin-ca-nhan");
    revalidatePath("/", "layout");
    return ok({ version });
  } catch {
    return fail("UNAUTHENTICATED", "Phiên làm việc đã hết hạn hoặc không hợp lệ.");
  }
}

export async function removeOwnAvatarAction(): Promise<Result<{ version: number }>> {
  try {
    const session = await authenticated();
    if (!session) return fail("FORBIDDEN", "Phiên demo không thể xóa ảnh thật.");
    const { error } = await session.db.storage.from(AVATAR_BUCKET)
      .remove([avatarObjectPath(session.user.id)]);
    if (error) return fail("INTERNAL", "Không thể xóa ảnh đại diện.");
    const version = Date.now();
    await session.db.auth.updateUser({ data: { avatar_updated_at: version } });
    revalidatePath("/thong-tin-ca-nhan");
    revalidatePath("/", "layout");
    return ok({ version });
  } catch {
    return fail("UNAUTHENTICATED", "Phiên làm việc đã hết hạn hoặc không hợp lệ.");
  }
}
