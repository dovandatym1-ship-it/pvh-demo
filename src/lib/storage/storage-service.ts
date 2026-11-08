import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";
import { type Result, ok, fail } from "@/lib/types/result";

export const EVIDENCE_BUCKET = "evidence";
export const MAX_SIGNED_URL_TTL = 60; // strictly <= 60 seconds per ADR-002 §10

/**
 * Builds standard storage path per convention: {tenant_id}/{entity_type}/{entity_id}/{filename}
 */
export function buildStoragePath(
  tenantId: string,
  entityType: string,
  entityId: string,
  filename: string
): string {
  if (
    filename.includes("..") ||
    entityType.includes("..") ||
    entityId.includes("..") ||
    tenantId.includes("..")
  ) {
    throw new Error("Invalid path component: directory traversal detected");
  }
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${tenantId}/${entityType}/${entityId}/${cleanFilename}`;
}

/**
 * Creates short-lived signed URL for private evidence bucket.
 * Clamps TTL strictly to <= 60 seconds.
 */
export async function createEvidenceSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  requestedTtlSeconds = 60
): Promise<Result<{ signedUrl: string; expiresIn: number }>> {
  // Clamp TTL strictly to <= 60 seconds
  const ttl = Math.min(Math.max(1, requestedTtlSeconds), MAX_SIGNED_URL_TTL);

  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, ttl);

  if (error || !data) {
    return fail("NOT_FOUND", error?.message || "Không thể tạo liên kết tải tệp tin");
  }

  return ok({
    signedUrl: data.signedUrl,
    expiresIn: ttl,
  });
}
