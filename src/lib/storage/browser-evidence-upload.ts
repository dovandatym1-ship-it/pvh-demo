"use client";

import { createClient } from "@/lib/supabase/client";

/** Storage transport boundary; feature UI never imports a Supabase client directly. */
export async function uploadEvidenceObject(objectPath: string, file: File): Promise<void> {
  const db = createClient();
  const { error } = await db.storage.from("evidence")
    .upload(objectPath, file, { upsert: false, contentType: file.type });
  if (error) throw new Error("PRIVATE_STORAGE_UPLOAD_FAILED");
}
