import type { WorkItemDTO } from "./index";

/** Nhãn giao diện tiếng Việt; mã nghiệp vụ giữ nguyên để không đổi DB/API. */
const statusLabels: Record<WorkItemDTO["status"], string> = {
  NEW: "Mới tạo",
  ASSIGNED: "Đã giao",
  IN_PROGRESS: "Đang xử lý",
  UNDER_REVIEW: "Chờ rà soát",
  RETURNED: "Cần bổ sung",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const priorityLabels: Record<WorkItemDTO["priority"], string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn",
};

const inboxLabels: Record<string, string> = {
  ASSIGNED: "Bạn được giao một công việc",
  REVIEW_REQUESTED: "Có công việc chờ bạn rà soát",
  RETURNED: "Công việc được trả lại để bổ sung",
  COMPLETED: "Công việc đã hoàn thành",
  CANCELLED: "Công việc đã bị hủy",
  DETAILS_UPDATED: "Hạn xử lý hoặc địa bàn đã thay đổi",
  COLLABORATOR_ADDED: "Bạn được thêm vào nhóm phối hợp",
  COLLABORATOR_REMOVED: "Bạn không còn trong nhóm phối hợp",
  COLLABORATORS_UPDATED: "Danh sách người phối hợp đã thay đổi",
};

export function workStatusLabel(status: string): string {
  return Object.prototype.hasOwnProperty.call(statusLabels, status)
    ? statusLabels[status as WorkItemDTO["status"]] : "Chưa xác định";
}

export function workPriorityLabel(priority: string): string {
  return Object.prototype.hasOwnProperty.call(priorityLabels, priority)
    ? priorityLabels[priority as WorkItemDTO["priority"]] : "Chưa xác định";
}

export function workInboxLabel(kind: string): string {
  return inboxLabels[kind] || "Có cập nhật về công việc";
}

export function workEventLabel(
  fromStatus: string | null | undefined,
  toStatus: string,
  payload: Record<string, unknown> = {},
): string {
  const kind = typeof payload.event === "string" ? payload.event : null;
  if (kind === "ASSIGNED") return "Giao hoặc chuyển người phụ trách";
  if (kind === "DETAILS_UPDATED") return "Điều chỉnh hạn xử lý hoặc địa bàn";
  if (kind === "COLLABORATORS_UPDATED") return "Cập nhật người phối hợp";
  if (!fromStatus) return "Tạo công việc";
  if (fromStatus === toStatus) return "Cập nhật thông tin công việc";
  return workStatusLabel(fromStatus) + " → " + workStatusLabel(toStatus);
}

/** datetime-local là giờ Việt Nam (UTC+07), bất kể múi giờ trình duyệt. */
export function vietnameseLocalToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  const utc = Date.UTC(y, m - 1, d, h, min);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() + 1 !== m ||
      check.getUTCDate() !== d || check.getUTCHours() !== h ||
      check.getUTCMinutes() !== min) return null;
  return new Date(utc - 7 * 60 * 60 * 1000).toISOString();
}
