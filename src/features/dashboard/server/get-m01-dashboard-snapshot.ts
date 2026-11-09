import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import { DASHBOARD_DOMAINS, DASHBOARD_STATUSES, vietnamDay } from "../metrics.mjs";
import type { DashboardItem, DashboardModel } from "../metrics.mjs";
import { resolveWorkScope } from "@/features/m01-core-work/server/work-scope";

const OPEN = ["NEW", "ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW", "RETURNED"];
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function vietnamMidnight(day: string): string {
  return new Date(Date.parse(day + "T00:00:00Z") - 7 * 3600000).toISOString();
}

function addDays(day: string, days: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weeklyStarts(day: string): string[] {
  const mondayOffset = (new Date(day + "T00:00:00Z").getUTCDay() + 6) % 7;
  const monday = addDays(day, -mondayOffset);
  return Array.from({ length: 6 }, (_, i) => addDays(monday, (i - 5) * 7));
}

/**
 * Count via PostgREST HEAD + exact count, not a 100-row readback. RLS is applied
 * for every request. Only a bounded operational queue crosses the RSC boundary.
 * A failed count is an ERROR, never silently zero.
 */
export async function getM01DashboardSnapshot(ctx: RequestContext): Promise<DashboardModel> {
  if (!ctx.permissions.includes("m01:work:read")) throw new Error("FORBIDDEN: Không có quyền xem thống kê M01");
  const db = await createServerSupabaseClient();
  const scope = resolveWorkScope(ctx);
  const today = vietnamDay(new Date());
  if (!today) throw new Error("Không xác định được ngày thống kê theo múi giờ Việt Nam");
  const day0 = vietnamMidnight(today);
  const day1 = vietnamMidnight(addDays(today, 1));
  const day4 = vietnamMidnight(addDays(today, 4));
  const day8 = vietnamMidnight(addDays(today, 8));

  function workQuery(fields: string, options: { count?: "exact"; head?: boolean } = {}) {
    let q = db.from("work_items").select(fields, options).eq("tenant_id", ctx.tenantId);
    if (scope.kind === "hamlet") {
      q = scope.hamlets.length ? q.in("hamlet_id", [...scope.hamlets]) : q.eq("id", ZERO_UUID);
    } else if (scope.kind === "officer") {
      q = q.eq("assigned_to", ctx.userId);
    }
    return q;
  }

  type WorkQuery = ReturnType<typeof workQuery>;
  async function countRows(label: string, refine: (query: WorkQuery) => WorkQuery): Promise<number> {
    const { count, error } = await refine(workQuery("id", { count: "exact", head: true }));
    if (error || count === null) {
      throw new Error("DB_ERROR: Không thể thống kê " + label + (error?.code ? " (" + error.code + ")" : ""));
    }
    return count;
  }
  const open = (q: WorkQuery) => q.in("status", OPEN);
  const overdue = (q: WorkQuery) => open(q).lt("due_date", day0);
  const statusJobs = DASHBOARD_STATUSES.map(async status => ({
    ...status,
    count: await countRows("trạng thái " + status.code, q => q.eq("status", status.code)),
  }));
  const ageJobs = [
    countRows("việc quá hạn", overdue),
    countRows("việc hạn hôm nay", q => open(q).gte("due_date", day0).lt("due_date", day1)),
    countRows("việc hạn 1–3 ngày", q => open(q).gte("due_date", day1).lt("due_date", day4)),
    countRows("việc hạn 4–7 ngày", q => open(q).gte("due_date", day4).lt("due_date", day8)),
    countRows("việc hạn sau 7 ngày", q => open(q).gte("due_date", day8)),
    countRows("việc chưa có hạn", q => open(q).is("due_date", null)),
  ];
  const domainsJob = DASHBOARD_DOMAINS.map(async domain => {
    const [n, o] = await Promise.all([
      countRows("lĩnh vực " + domain.code, q => open(q).in("category", [...domain.categories])),
      countRows("quá hạn " + domain.code, q => overdue(q).in("category", [...domain.categories])),
    ]);
    return { ...domain, count: n, overdue: o };
  });
  const weeklyJob = weeklyStarts(today).map(async start => ({
    start,
    label: start.slice(8) + "/" + start.slice(5, 7),
    created: await countRows("việc tạo mới tuần " + start,
      q => q.gte("created_at", vietnamMidnight(start))
        .lt("created_at", vietnamMidnight(addDays(start, 7)))),
    completed: 0,
  }));

  const [statuses, ages, domains, weekly, returned, unassigned, last, queue] = await Promise.all([
    Promise.all(statusJobs),
    Promise.all(ageJobs),
    Promise.all(domainsJob),
    Promise.all(weeklyJob),
    countRows("việc trả lại", q => q.eq("status", "RETURNED")),
    countRows("việc chưa giao", q => open(q).is("assigned_to", null)),
    workQuery("updated_at").order("updated_at", { ascending: false }).limit(1),
    workQuery("id,tenant_id,title,status,priority,category,assigned_to,due_date,hamlet_id,created_at,updated_at")
      .in("status", OPEN)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(30),
  ]);
  if (last.error || queue.error) throw new Error("DB_ERROR: Không tải được danh sách thống kê M01");

  const rows = (queue.data || []) as Record<string, unknown>[];
  const items: DashboardItem[] = rows.map(row => ({
    id: String(row.id), tenantId: String(row.tenant_id), title: String(row.title),
    status: String(row.status), priority: String(row.priority), category: String(row.category),
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    hamletId: row.hamlet_id ? String(row.hamlet_id) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }));
  const total = statuses.reduce((n, status) => n + status.count, 0);
  const closed = statuses.filter(s => s.code === "COMPLETED" || s.code === "CANCELLED")
    .reduce((n, status) => n + status.count, 0);
  const active = total - closed;
  const overdueCount = ages[0];
  const dueSoon = ages[1] + ages[2] + ages[3];
  const review = statuses.find(s => s.code === "UNDER_REVIEW")?.count || 0;
  const role = scope.kind === "tenant" ? "leader" : scope.kind === "hamlet" ? "hamlet" : "officer";
  const scopeLabel = role === "leader" ? "Toàn xã theo quyền đọc" :
    role === "hamlet" ? "Địa bàn được phân quyền" : "Phạm vi công tác được phân quyền";
  const roleLabel = role === "leader" ? "Lãnh đạo" : role === "hamlet" ? "Trưởng thôn" : "Công chức";
  const aging = [
    { key: "overdue", label: "Quá hạn", count: ages[0] },
    { key: "today", label: "Hạn hôm nay", count: ages[1] },
    { key: "oneThree", label: "Còn 1–3 ngày", count: ages[2] },
    { key: "fourSeven", label: "Còn 4–7 ngày", count: ages[3] },
    { key: "later", label: "Trên 7 ngày", count: ages[4] },
    { key: "unset", label: "Chưa có hạn", count: ages[5] },
  ];
  return {
    today, role, userId: ctx.userId, items, total, open: active, overdue: overdueCount,
    dueSoon, review, focus: { label: "Việc chưa đóng", value: active },
    queueIds: items.map(item => item.id), queueCount: active, statuses, domains,
    workload: [], hamlets: [], weekly, eventsAvailable: false,
    lastUpdated: last.data?.[0]?.updated_at ? String(last.data[0].updated_at) : null,
    demo: ctx.tenantId.startsWith("TN-DEMO-"), scopeLabel, roleLabel,
    serverSummary: { total, open: active, overdue: overdueCount, dueSoon, returned,
      unassigned, review, ages: aging, statuses, domains },
  };
}
