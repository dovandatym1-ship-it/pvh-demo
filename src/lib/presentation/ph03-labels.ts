/** Nhãn nghiệp vụ PH03; chỉ chuyển phần hiển thị, không thay đổi mã DB/RPC. */
export const campaignStatusLabel = (status: string): string => ({
  DRAFT: "Nháp",
  OPEN: "Đang tiếp nhận",
  CLOSED: "Đã đóng đợt",
} as Record<string, string>)[status] ?? "Chưa xác định";

export const ruleStatusLabel = (status: string): string => ({
  ILLUSTRATIVE_ONLY: "Chỉ minh họa",
  UNVERIFIED: "Chưa xác minh",
  VERIFIED: "Đã xác minh căn cứ",
} as Record<string, string>)[status] ?? "Chưa xác định";

export const dossierStatusLabel = (status: string): string => ({
  CHO_RA_SOAT: "Chờ rà soát",
  THIEU_MINH_CHUNG: "Thiếu minh chứng",
  YEU_CAU_BO_SUNG: "Yêu cầu bổ sung",
  DAT: "Đánh giá nội bộ: đạt",
  KHONG_DAT: "Đánh giá nội bộ: chưa đạt",
} as Record<string, string>)[status] ?? "Chưa xác định";

export const planStatusLabel = (status: string): string => ({
  DRAFT: "Bản nháp",
  IN_REVIEW: "Đang rà soát",
  ACTIVE: "Đang thực hiện",
  CLOSED: "Đã chốt kỳ",
} as Record<string, string>)[status] ?? "Chưa xác định";

export const indicatorStatusLabel = (status: string): string => ({
  NOT_REPORTED: "Chưa nộp",
  UNVERIFIED: "Chưa đối soát",
  CONFIRMED: "Đã xác nhận",
  CONFIRMED_ZERO: "Đã xác nhận bằng 0",
  NOT_APPLICABLE: "Không áp dụng",
} as Record<string, string>)[status] ?? "Chưa xác định";

export const recommendationStatusLabel = (status: string): string => ({
  PENDING: "Chờ khắc phục",
  FEEDBACK_UNVERIFIED: "Đã phản hồi, chờ hậu kiểm",
  RESOLVED_CLOSED: "Đã hậu kiểm và đóng",
} as Record<string, string>)[status] ?? "Chưa xác định";

/** YYYY-MM-DD theo ngày Việt Nam, không phụ thuộc múi giờ máy đang sử dụng. */
export function vietnameseToday(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return [part("year"), part("month"), part("day")].join("-");
}
