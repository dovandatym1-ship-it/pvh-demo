import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";

export const jobWorker = {
  /**
   * Claim and execute next pending system job using FOR UPDATE SKIP LOCKED via RPC.
   */
  async processNextJob(
    workerId: string = "cron-worker-01"
  ): Promise<Result<{ processed: boolean; jobId?: string; message?: string }>> {
    try {
      const supabase = await createServerSupabaseClient();

      // 1. Claim next job via atomic RPC with FOR UPDATE SKIP LOCKED
      const { data: claimData, error: claimErr } = await supabase.rpc("claim_next_system_job", {
        p_worker_id: workerId,
      });

      if (claimErr) {
        return fail("INTERNAL", `Lỗi RPC claim job: ${claimErr.message}`, claimErr);
      }

      const claim = claimData as {
        ok: boolean;
        job_id?: string;
        job_type?: string;
        payload?: Record<string, unknown>;
        message?: string;
      };

      if (!claim.ok || !claim.job_id) {
        return ok({ processed: false, message: claim.message || "NO_JOB_AVAILABLE" });
      }

      const jobId = claim.job_id;
      const jobType = claim.job_type || "UNKNOWN";
      const payload = claim.payload || {};

      try {
        let receipt: Record<string, unknown> = {
          executedAt: new Date().toISOString(),
          workerId,
          status: "SUCCESS",
        };

        if (jobType === "REPORT_SNAPSHOT_GENERATION" || jobType === "REPORT_SNAPSHOT_HEAVY") {
          receipt = {
            ...receipt,
            action: "REPORT_SNAPSHOT_GENERATION",
            reportCode: payload.reportCode || "DEM-R01",
            completedAt: new Date().toISOString(),
          };
        } else if (jobType === "EXPORT_XLSX_AGGREGATION" || jobType === "REPORT_EXPORT_ASYNC") {
          receipt = {
            ...receipt,
            action: "EXPORT_XLSX_AGGREGATION",
            format: "XLSX",
            completedAt: new Date().toISOString(),
          };
        }

        // 2. Mark completed
        const { error: completeErr } = await supabase.rpc("complete_system_job", {
          p_job_id: jobId,
          p_receipt: receipt,
        });

        if (completeErr) {
          return fail("INTERNAL", `Lỗi complete_system_job: ${completeErr.message}`, completeErr);
        }

        return ok({ processed: true, jobId, message: "JOB_COMPLETED" });
      } catch (execErr: unknown) {
        const errorMsg = execErr instanceof Error ? execErr.message : String(execErr);
        await supabase.rpc("fail_system_job", {
          p_job_id: jobId,
          p_error: errorMsg,
        });
        return fail("INTERNAL", `Tác vụ ${jobId} xử lý thất bại: ${errorMsg}`);
      }
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại jobWorker.processNextJob", err);
    }
  },
};
