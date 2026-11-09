import { DASHBOARD_DOMAINS, DASHBOARD_STATUSES, deadlineState } from "./metrics.mjs";

const CLOSED = new Set(["COMPLETED", "CANCELLED"]);
const OPEN = (item) => !CLOSED.has(item.status);

function urgency(item, today) {
  const date = deadlineState(item, today);
  if (date.kind === "overdue") return 0;
  if (item.status === "RETURNED") return 1;
  if (!item.assignedTo) return 2;
  if (item.status === "UNDER_REVIEW") return 3;
  if (date.kind === "soon") return 4;
  return 5;
}

function count(items, predicate) { return items.filter(predicate).length; }
function makeCard(id, label, value, detail, tone, filter) {
  return { id, label, value, detail, tone, filter };
}

export function buildRolePresentation(model) {
  const role = model.role;
  const focusItems = role === "officer"
    ? model.items.filter((item) => item.assignedTo === model.userId)
    : model.items;
  const focusOpen = focusItems.filter(OPEN);
  const summary = model.serverSummary;
  const overdue = summary?.overdue ?? count(focusOpen, (i) => deadlineState(i, model.today).kind === "overdue");
  const dueSoon = summary?.dueSoon ?? count(focusOpen, (i) => deadlineState(i, model.today).kind === "soon");
  const returned = summary?.returned ?? count(focusOpen, (i) => i.status === "RETURNED");
  const review = summary?.review ?? count(focusOpen, (i) => i.status === "UNDER_REVIEW");
  const unassigned = summary?.unassigned ?? count(focusOpen, (i) => !i.assignedTo);

  const title = role === "leader" ? "Tổng quan điều hành"
    : role === "officer" ? "Công việc được giao" : "Theo dõi công việc địa bàn";
  const subtitle = role === "leader"
    ? "Theo dõi các điểm nghẽn, khối lượng tồn và tiến độ thực hiện tại xã."
    : role === "officer"
      ? "Ưu tiên việc được phân công, thời hạn cần xử lý và hồ sơ được trả lại."
      : "Theo dõi công việc thuộc địa bàn được phân quyền và nội dung cần phối hợp.";
  const cards = role === "leader" ? [
    makeCard("overdue", "Việc đã quá hạn", overdue, "Chưa đóng, quá ngày hạn công việc", "bad", "overdue"),
    makeCard("unassigned", "Việc chưa phân công", unassigned, "Chưa có người phụ trách", "warn", "unassigned"),
    makeCard("review", "Việc chờ rà soát", review, "Đang ở bước kiểm tra kết quả", "info", "review"),
    makeCard("open", "Tổng việc đang mở", (summary?.open ?? focusOpen.length), "Trong toàn bộ phạm vi lãnh đạo", "primary", "all"),
  ] : role === "officer" ? [
    makeCard("overdue", "Việc của tôi quá hạn", overdue, "Được giao, chưa đóng, đã quá hạn", "bad", "overdue"),
    makeCard("soon", "Việc đến hạn trong 7 ngày", dueSoon, "Bao gồm cả hạn hôm nay", "warn", "soon"),
    makeCard("returned", "Việc được giao bị trả lại", returned, "Cần kiểm tra lý do trả lại", "info", "returned"),
    makeCard("open", "Việc tôi đang phụ trách", (summary?.open ?? focusOpen.length), "Các việc được giao chưa đóng", "primary", "all"),
  ] : [
    makeCard("open", "Việc đang mở tại thôn", (summary?.open ?? focusOpen.length), "Thuộc phạm vi địa bàn", "primary", "all"),
    makeCard("overdue", "Việc địa bàn quá hạn", overdue, "Cần theo dõi, đôn đốc đúng đầu mối", "bad", "overdue"),
    makeCard("returned", "Việc cần bổ sung", returned, "Hồ sơ/trạng thái bị trả lại", "info", "returned"),
    makeCard("soon", "Việc đến hạn trong 7 ngày", dueSoon, "Trong phạm vi địa bàn được cấp quyền", "warn", "soon"),
  ];

  const ageRanges = [
    { key: "overdue", label: "Quá hạn", count: 0 },
    { key: "today", label: "Hạn hôm nay", count: 0 },
    { key: "oneThree", label: "Còn 1–3 ngày", count: 0 },
    { key: "fourSeven", label: "Còn 4–7 ngày", count: 0 },
    { key: "later", label: "Trên 7 ngày", count: 0 },
    { key: "unset", label: "Chưa có hạn", count: 0 },
  ];
  const buckets = Object.fromEntries(ageRanges.map((bucket) => [bucket.key, bucket]));
  for (const item of summary ? [] : focusOpen) {
    const state = deadlineState(item, model.today);
    if (state.kind === "overdue") buckets.overdue.count++;
    else if (state.kind === "unset") buckets.unset.count++;
    else if (state.days === 0) buckets.today.count++;
    else if (state.days <= 3) buckets.oneThree.count++;
    else if (state.days <= 7) buckets.fourSeven.count++;
    else buckets.later.count++;
  }

  if (summary?.ages) for (const bucket of summary.ages) {
    if (buckets[bucket.key]) buckets[bucket.key].count = bucket.count;
  }
  const statuses = summary?.statuses ?? DASHBOARD_STATUSES.map((status) => ({
    ...status, count: count(focusItems, (item) => item.status === status.code),
  }));
  const domains = summary?.domains ?? DASHBOARD_DOMAINS.map((domain) => {
    const matching = focusOpen.filter((item) => domain.categories.includes(item.category));
    return {
      ...domain,
      count: matching.length,
      overdue: count(matching, (item) => deadlineState(item, model.today).kind === "overdue"),
    };
  });

  const priorityIds = focusOpen
    .filter((item) => urgency(item, model.today) < 5)
    .sort((a, b) => {
      const order = urgency(a, model.today) - urgency(b, model.today);
      return order || (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
        || a.title.localeCompare(b.title, "vi");
    }).map((item) => item.id);

  return {
    role, title, subtitle, cards, focusItems, focusOpen, ageRanges, statuses, domains,
    priorityIds,
    queueTitle: role === "leader" ? "Danh sách việc cần đôn đốc"
      : role === "officer" ? "Việc tôi cần ưu tiên" : "Việc cần theo dõi tại thôn",
    queueSubtitle: role === "leader" ? "Các việc quá hạn, chưa giao, trả lại, chờ rà soát hoặc sắp đến hạn."
      : role === "officer" ? "Chỉ những việc được giao trực tiếp cho tài khoản hiện tại."
        : "Công việc thuộc địa bàn, không đồng nghĩa với quyền phê duyệt hay xử lý.",
    ageTitle: role === "leader" ? "Cơ cấu hạn việc đang mở toàn xã"
      : role === "officer" ? "Thời hạn việc tôi được giao" : "Thời hạn công việc tại thôn",
    domainTitle: role === "leader" ? "Việc tồn theo lĩnh vực"
      : role === "officer" ? "Việc được giao theo lĩnh vực" : "Việc đang mở theo lĩnh vực tại thôn",
    statusTitle: role === "leader" ? "Trạng thái công việc toàn xã"
      : role === "officer" ? "Trạng thái công việc được giao" : "Trạng thái công việc địa bàn",
    totalFocus: summary?.total ?? focusItems.length,
    totalFocusOpen: summary?.open ?? focusOpen.length,
    warningCount: overdue + returned,
  };
}
