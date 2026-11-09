export type WorkNotificationCode =
  | "WORK_ASSIGNED" | "WORK_RETURNED" | "WORK_COMPLETED"
  | "WORK_CANCELLED" | "WORK_REVIEW" | "WORK_DEADLINE_CHANGED";
const MESSAGES: Record<WorkNotificationCode, string> = {
  WORK_ASSIGNED: "Bạn có công việc mới được giao",
  WORK_RETURNED: "Một công việc đã được trả lại để bổ sung",
  WORK_COMPLETED: "Công việc liên quan đã hoàn thành",
  WORK_CANCELLED: "Công việc liên quan đã hủy",
  WORK_REVIEW: "Công việc liên quan đang được rà soát",
  WORK_DEADLINE_CHANGED: "Hạn xử lý công việc đã được cập nhật",
};
export function notificationLabel(code: string): string {
  if (Object.prototype.hasOwnProperty.call(MESSAGES, code)) {
    return MESSAGES[code as WorkNotificationCode];
  }
  return "Có cập nhật mới liên quan đến công việc";
}
