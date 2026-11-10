const NCC_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  THUONG_BINH: "Thương binh",
  LIET_SI: "Liệt sĩ",
  BENH_BINH: "Bệnh binh",
  CHAT_DOC_HOA_HOC: "Người hoạt động kháng chiến bị nhiễm chất độc hóa học",
  BA_ME_VNAH: "Bà mẹ Việt Nam anh hùng",
};

export function nccCategoryLabel(category: string): string {
  return NCC_CATEGORY_LABELS[category] ?? "Chưa xác định diện chính sách";
}
