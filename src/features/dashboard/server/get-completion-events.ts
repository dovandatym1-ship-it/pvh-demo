import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";

export interface CompletionEvent {
  readonly workItemId: string;
  readonly toStatus: "COMPLETED";
  readonly createdAt: string;
}

export interface CompletionEventResult {
  readonly events: CompletionEvent[];
  readonly available: boolean;
  readonly truncated: boolean;
}

/**
 * Completion counts must come from a transition ledger, not a synthetic weekly
 * series or the current state of the work_items table.
 * RLS and tenant filtering apply before the scope filter in metrics.mjs.
 */
export async function getCompletionEvents(ctx: RequestContext): Promise<CompletionEventResult> {
  const limit = 5000;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 49);

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("work_item_events")
      .select("work_item_id, to_status, created_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("to_status", "COMPLETED")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return { events: [], available: false, truncated: false };
    return {
      events: data.map((event) => ({
        workItemId: String(event.work_item_id),
        toStatus: "COMPLETED" as const,
        createdAt: String(event.created_at),
      })),
      available: data.length < limit,
      truncated: data.length === limit,
    };
  } catch {
    // Make incomplete observability explicit in the UI; never fabricate counts.
    return { events: [], available: false, truncated: false };
  }
}
