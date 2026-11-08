/**
 * Pure dashboard calculations. No database access, React state or demo fixtures.
 * All date-only deadlines are evaluated by civil day in Viet Nam, not UTC midnight.
 */

const CLOSED = new Set(["COMPLETED", "CANCELLED"]);
const LEADERS = new Set(["LANH_DAO_XA", "SYSTEM_ADMIN", "admin"]);
const PRIORITY = { URGENT: 0, HIGH: 1, MEDIUM: 2, NORMAL: 2, LOW: 3 };

export const DASHBOARD_STATUSES = [
  { code: "IN_PROGRESS", label: "Đang xử lý", color: "amber" },
  { code: "UNDER_REVIEW", label: "Chờ rà soát", color: "blue" },
  { code: "ASSIGNED", label: "Đã giao", color: "slate" },
  { code: "RETURNED", label: "Yêu cầu bổ sung", color: "red" },
  { code: "NEW", label: "Mới tạo", color: "slate" },
  { code: "COMPLETED", label: "Hoàn thành", color: "green" },
  { code: "CANCELLED", label: "Đã hủy", color: "slate" },
];

export const DASHBOARD_DOMAINS = [
  { code: "M04", label: "Văn hóa & Gia đình", categories: ["VAN_HOA"], href: "/van-hoa/gia-dinh-van-hoa", icon: "landmark" },
  { code: "M05", label: "Khoa học & Chuyển đổi số", categories: ["CHUYEN_DOI_SO"], href: "/khcn-chuyen-doi-so", icon: "monitor" },
  { code: "M06", label: "Y tế & An sinh", categories: ["Y_TE", "LAO_DONG_XH"], href: "/y-te-an-sinh", icon: "heart" },
  { code: "M03", label: "Giáo dục & Đào tạo", categories: ["GIAO_DUC"], href: "/giao-duc", icon: "book" },
  { code: "M02", label: "Nội vụ & Lao động", categories: ["NOI_VU"], href: "/noi-vu", icon: "building" },
];

/** @param {unknown} value */
function civilDate(value) {
  if (typeof value !== "string" || value.length < 10) return null;
  const plain = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (plain) {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  const part = (type) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dayNumber(dateKey) {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

/** @param {string | Date} instant */
export function vietnamDay(instant) {
  return civilDate(instant instanceof Date ? instant.toISOString() : instant);
}

/** @param {{dueDate?: string | null, status: string}} item */
export function deadlineState(item, today) {
  if (CLOSED.has(item.status)) return { kind: "closed", days: null };
  const due = civilDate(item.dueDate);
  const now = civilDate(today);
  if (!due || !now) return { kind: "unset", days: null };
  const days = dayNumber(due) - dayNumber(now);
  return { kind: days < 0 ? "overdue" : days <= 7 ? "soon" : "later", days };
}

export function roleKind(ctx) {
  if (ctx.roles?.some((role) => LEADERS.has(role))) return "leader";
  if (ctx.roles?.includes("TRUONG_THON")) return "hamlet";
  return "officer";
}

/**
 * Defense in depth after Supabase RLS. Never increases the set of rows returned
 * by the authenticated, tenant-constrained query.
 */
export function scopeWorkItems(items, ctx) {
  const tenantItems = items.filter((item) => item.tenantId === ctx.tenantId);
  if (roleKind(ctx) === "leader") return tenantItems;
  const allowedHamlets = ctx.scopes?.hamletIds;
  if (roleKind(ctx) === "hamlet") {
    if (!Array.isArray(allowedHamlets) || allowedHamlets.length === 0) return [];
    const permitted = new Set(allowedHamlets);
    return tenantItems.filter((item) => item.hamletId && permitted.has(item.hamletId));
  }
  if (Array.isArray(allowedHamlets) && allowedHamlets.length > 0) {
    const permitted = new Set(allowedHamlets);
    return tenantItems.filter((item) => item.assignedTo === ctx.userId || (item.hamletId && permitted.has(item.hamletId)));
  }
  return tenantItems;
}

function mondayOf(dayKey) {
  const d = new Date(`${dayKey}T00:00:00Z`);
  const delta = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - delta);
  return d.toISOString().slice(0, 10);
}

function plusDays(dayKey, n) {
  const d = new Date(`${dayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatShortDate(dayKey) {
  return `${dayKey.slice(8, 10)}/${dayKey.slice(5, 7)}`;
}

function makeWeeklyTrend(items, completionEvents, today) {
  const currentMonday = mondayOf(today);
  const rows = Array.from({ length: 6 }, (_, idx) => {
    const start = plusDays(currentMonday, (idx - 5) * 7);
    return { start, label: formatShortDate(start), created: 0, completed: 0 };
  });
  const byMonday = new Map(rows.map((row) => [row.start, row]));
  for (const item of items) {
    const created = civilDate(item.createdAt);
    if (created) {
      const row = byMonday.get(mondayOf(created));
      if (row) row.created++;
    }
  }
  const ids = new Set(items.map((item) => item.id));
  const seen = new Set();
  for (const event of completionEvents) {
    if (event.toStatus !== "COMPLETED" || !ids.has(event.workItemId)) continue;
    const day = civilDate(event.createdAt);
    if (!day) continue;
    const row = byMonday.get(mondayOf(day));
    const key = `${event.workItemId}|${day}`;
    if (row && !seen.has(key)) {
      row.completed++;
      seen.add(key);
    }
  }
  return rows;
}

function urgencyRank(item, today) {
  const date = deadlineState(item, today);
  if (date.kind === "overdue") return 0;
  if (item.status === "RETURNED") return 1;
  if (item.status === "UNDER_REVIEW") return 2;
  if (date.kind === "soon") return 3;
  return 4;
}

/**
 * @param {{items: Array<any>, completionEvents?: Array<any>, ctx: any, now?: string | Date,
 *          eventsAvailable?: boolean, eventsTruncated?: boolean}} input
 */
export function buildDashboardModel(input) {
  const { ctx } = input;
  const now = input.now ?? new Date();
  const today = vietnamDay(now);
  const items = scopeWorkItems(input.items, ctx);
  const role = roleKind(ctx);
  const active = items.filter((item) => !CLOSED.has(item.status));
  const overdue = active.filter((item) => deadlineState(item, today).kind === "overdue").length;
  const dueSoon = active.filter((item) => deadlineState(item, today).kind === "soon").length;
  const review = active.filter((item) => item.status === "UNDER_REVIEW").length;
  const myOpen = active.filter((item) => item.assignedTo === ctx.userId).length;
  const urgent = active.filter((item) => {
    const d = deadlineState(item, today).kind;
    return d === "overdue" || d === "soon" || item.status === "UNDER_REVIEW" || item.status === "RETURNED";
  });
  urgent.sort((a, b) => {
    const rank = urgencyRank(a, today) - urgencyRank(b, today);
    if (rank) return rank;
    const due = (dayNumber(civilDate(a.dueDate)) ?? Infinity) - (dayNumber(civilDate(b.dueDate)) ?? Infinity);
    if (Number.isFinite(due) && due) return due;
    const p = (PRIORITY[a.priority] ?? 2) - (PRIORITY[b.priority] ?? 2);
    return p || a.title.localeCompare(b.title, "vi");
  });

  const statuses = DASHBOARD_STATUSES.map((status) => ({
    ...status, count: items.filter((item) => item.status === status.code).length,
  }));
  const domains = DASHBOARD_DOMAINS.map((domain) => {
    const related = active.filter((item) => domain.categories.includes(item.category));
    return {
      ...domain,
      count: related.length,
      overdue: related.filter((item) => deadlineState(item, today).kind === "overdue").length,
    };
  });

  const byAssignee = new Map();
  for (const item of active) {
    const id = item.assignedTo || "unassigned";
    byAssignee.set(id, (byAssignee.get(id) || 0) + 1);
  }
  const workload = [...byAssignee.entries()]
    .map(([id, count]) => ({
      id,
      label: id === "unassigned" ? "Chưa giao" : id.startsWith("user-p") ? id.replace("user-", "").toUpperCase() : `Cán bộ · ${id.slice(0, 6)}`,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, 6);

  const hamletCounts = new Map();
  for (const item of active) if (item.hamletId) hamletCounts.set(item.hamletId, (hamletCounts.get(item.hamletId) || 0) + 1);
  const hamlets = [...hamletCounts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
  const focus = role === "leader" ? { label: "Việc chưa đóng toàn xã", value: active.length }
    : role === "hamlet" ? { label: "Việc chưa đóng của địa bàn", value: active.length }
      : { label: "Việc của tôi chưa đóng", value: myOpen };

  const lastUpdated = items.map((item) => item.updatedAt).filter(Boolean).sort().at(-1) ?? null;
  // Project away descriptions and backend-only fields before crossing the RSC boundary.
  const publicItems = items.map((item) => ({
    id: item.id, tenantId: item.tenantId, title: item.title, status: item.status,
    priority: item.priority, category: item.category, assignedTo: item.assignedTo,
    dueDate: item.dueDate, hamletId: item.hamletId, createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
  return {
    today, role, userId: ctx.userId, items: publicItems, total: items.length, open: active.length, overdue, dueSoon, review, focus,
    queueIds: urgent.map((item) => item.id), queueCount: urgent.length, statuses, domains, workload, hamlets,
    weekly: makeWeeklyTrend(items, input.completionEvents ?? [], today),
    eventsAvailable: Boolean(input.eventsAvailable) && !input.eventsTruncated,
    lastUpdated,
    demo: items.some((item) => item.id.startsWith("item-demo-")),
    scopeLabel: role === "leader" ? "Toàn xã" : role === "hamlet" ? "Địa bàn được phân quyền" : "Phạm vi công tác được phân quyền",
    roleLabel: role === "leader" ? "Lãnh đạo" : role === "hamlet" ? "Trưởng thôn" : "Công chức",
  };
}
