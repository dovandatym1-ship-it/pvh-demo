/** Hiển thị báo cáo: không tự coi NULL/missing là số 0. */
const reportStatuses: Record<string, string> = {
  DRAFT: "Bản nháp", SUBMITTED: "Đã trình rà soát",
  UNDER_REVIEW: "Đang rà soát", FINALIZED: "Đã chốt nội bộ",
};
const qualityStatuses: Record<string, string> = {
  NOT_REPORTED: "Chưa báo cáo", NOT_APPLICABLE: "Không áp dụng",
  UNVERIFIED: "Chưa đối soát", CONFIRMED: "Đã xác nhận",
  CONFIRMED_ZERO: "Đã xác nhận số 0",
};
export function reportStatusLabel(value: string): string {
  return reportStatuses[value] ?? "Chưa xác định";
}
export function qualityStatusLabel(value: string): string {
  return qualityStatuses[value] ?? "Chưa xác định";
}
export function metricValueLabel(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("vi-VN") : "Chưa có số liệu";
}
export function metricDelta(current: unknown, previous: unknown): number | null {
  if (typeof current !== "number" || !Number.isFinite(current) ||
      typeof previous !== "number" || !Number.isFinite(previous)) return null;
  return current - previous;
}

const metricLabels:Record<string,string>={
 tasksTotal:"Tổng công việc",tasksCompleted:"Công việc hoàn thành",tasksOverdue:"Công việc quá hạn",
 cultureSubmissions:"Hồ sơ văn hóa",cultureEligible:"Hồ sơ đạt theo quy tắc thử nghiệm",
 plansTotal:"Kế hoạch chuyển đổi số",indicatorsConfirmed:"Chỉ tiêu đã xác nhận",
 indicatorsConfirmedZero:"Chỉ tiêu được xác nhận bằng 0",indicatorsNotReported:"Chỉ tiêu chưa báo cáo",
 indicatorsNotApplicable:"Chỉ tiêu không áp dụng",inspectionsTotal:"Cuộc kiểm tra",
 recommendationsTotal:"Kiến nghị",recommendationsClosed:"Kiến nghị khép lại",
 importedValues:"Bản ghi chỉ tiêu nhập từ tệp",
};
export function metricNameLabel(code: string): string {
  return metricLabels[code] ?? "Chỉ tiêu chưa có nhãn tiếng Việt";
}

/** Domain source identifiers remain internal: never show raw codes as UI text. */
export function reportSourceLabel(sourceType: unknown): string {
  return sourceType === "DATABASE" ? "Cơ sở dữ liệu hệ thống" : "Chưa xác định nguồn";
}
