import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";

export interface EnqueueJobInput {
  readonly jobType: string;
  readonly payload: Record<string, unknown>;
  readonly idempotencyKey?: string;
  readonly maxAttempts?: number;
}

export interface SystemJobDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly jobType: string;
  readonly status: "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  readonly payload: Record<string, unknown>;
  readonly receipt?: Record<string, unknown> | null;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly errorMessage?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const jobService = {
  /**
   * Enqueue a new background job with idempotency defense.
   */
  async enqueueJob(
    ctx: RequestContext,
    input: EnqueueJobInput
  ): Promise<Result<{ id: string; status: string }>> {
    try {
      const supabase = await createServerSupabaseClient();
      const jobId = crypto.randomUUID();
      const idempotencyKey =
        input.idempotencyKey ||
        `idem-job-${ctx.tenantId}-${input.jobType}-${Date.now()}-${jobId.slice(0, 8)}`;

      // Check existing by idempotency
      const { data: existing } = await supabase
        .from("system_jobs")
        .select("id, status")
        .eq("tenant_id", ctx.tenantId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        return ok({ id: String(existing.id), status: String(existing.status) });
      }

      const { data, error } = await supabase
        .from("system_jobs")
        .insert({
          id: jobId,
          tenant_id: ctx.tenantId,
          job_type: input.jobType,
          status: "PENDING",
          payload: input.payload,
          idempotency_key: idempotencyKey,
          attempts: 0,
          max_attempts: input.maxAttempts || 3,
        })
        .select("id, status")
        .single();

      if (error) {
        return fail("INTERNAL", `Lỗi CSDL khi tạo tác vụ nền: ${error.message}`, error);
      }

      return ok({ id: String(data.id), status: String(data.status) });
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại jobService.enqueueJob", err);
    }
  },
};
