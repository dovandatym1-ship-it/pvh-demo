# UI/UX MASTER SPECIFICATION — PVH
**Document:** UXM-v1.0 · **Status:** DESIGN BASELINE (đề xuất, chưa nghiệm thu browser) · **Priority:** P0
**Mục tiêu:** Một sản phẩm đẹp, gọn, dễ tìm tác vụ, làm việc mượt cho cán bộ xã; không biến hệ thống thành dashboard trang trí. Quy chuẩn này áp dụng M00–M11, không phụ thuộc nhóm phát triển của từng phase.

## 1. Nguồn đối chiếu và khoảng trống thực tế
- main/tailwind.config.ts đã có bảng màu gov 50–950, màu chính gov-600 #1F633E; globals.css chỉ có 2 biến nền/chữ.
- main/src/components/ui/button.tsx dùng nhiều mã màu trực tiếp; input.tsx dùng h-9 và màu focus hardcode. Cần chuyển sang semantic tokens.
- feat/pvh-dashboard/src/features/dashboard/components/dashboard.module.css có bộ biến --dash-* riêng và dark-mode cục bộ; không coi đây là Design System toàn ứng dụng.
- main/WorkItemManager có toast useState + setTimeout tại feature, không phải thông báo dùng chung.
- Layout của PH06 còn ghi tên xã cứng và nhãn chức vụ fallback; phải lấy từ ngữ cảnh xác thực, không suy diễn vai trò.
- M00–M11 bản đặc tả vẫn có field-level TBD; UI mẫu chỉ dùng trường đã xác minh, không bịa dữ liệu nghiệp vụ.

## 2. Design principles (thứ tự bắt buộc)
1. **Clarity:** số liệu, hạn, trạng thái, người xử lý rõ hơn hoa văn.
2. **Consistency:** một bộ button/table/form/modal/toast xuyên module.
3. **Progressive disclosure:** màn danh sách đủ gọn; chi tiết ở drawer/page, nâng cao ở tab có tên rõ.
4. **Safe actions:** hành động quan trọng có cảnh báo; không xóa/duyệt/chi trả do click nhầm.
5. **Performance by design:** không cần tải hết bản ghi để hiển thị đẹp.
6. **Truthful states:** không có kết quả giả. Demo có nhãn “Dữ liệu minh họa”; unavailable phải nêu lý do.
7. **Accessibility:** bàn phím, focus, tương phản, khuyết tật thị giác, màn nhỏ là yêu cầu nghiệm thu.
8. **Authorization-aware UI:** menu bị lọc theo quyền, nhưng server/RLS vẫn kiểm soát dữ liệu.

## 3. Visual tokens v1 — proposed
Các mã màu sau là thiết kế đích, cần kiểm tương phản thực tế trước khi khóa:
| Semantic token | Light | Công dụng |
|---|---|---|
| --pvh-bg | #F8FAFC | Canvas toàn app |
| --pvh-surface | #FFFFFF | Card, bảng, popup |
| --pvh-surface-subtle | #F1F5F9 | Header bảng, hovered neutral |
| --pvh-text | #0F172A | Văn bản chính |
| --pvh-text-muted | #475569 | Mô tả, nhãn phụ |
| --pvh-border | #E2E8F0 | Đường phân cách |
| --pvh-brand | #1F633E | CTA/active chính, kế thừa gov-600 |
| --pvh-brand-hover | #174E31 | Hover CTA |
| --pvh-focus | #2563EB | Focus ring rõ, không chỉ dựa vào màu thương hiệu |
| --pvh-success | #166534 | Trạng thái hoàn tất, không đồng nghĩa “được phê duyệt pháp lý” |
| --pvh-warning | #92400E | Gần hạn/cần kiểm tra |
| --pvh-danger | #B91C1C | Lỗi/xóa |
| --pvh-info | #1D4ED8 | Thông tin/đang xử lý |
| --pvh-overlay | rgba(15,23,42,.45) | Backdrop dialog |

- Grid spacing: 4/8/12/16/20/24/32 px; content gutter 16 mobile, 24 tablet, 32 desktop.
- Radius: input/button 8px, card 12px, modal 16px; không lạm dụng full pill trừ chip trạng thái.
- Elevation: hầu hết vùng dùng border 1px; shadow chỉ cho menu nổi, dialog, popover.
- Font ưu tiên system UI Việt hóa dễ đọc; 14–16px body; 13px metadata; heading page 22–26px; main KPI 28–34px. Không dùng 10–11px cho trường/bảng dữ liệu chính.
- Chiều cao tương tác: input/secondary 40px, primary desktop 40px; mobile chạm mục tiêu khoảng 44px; bảng 44–52px/row theo density.
- Motion: hover 120–160ms, dialog 160–200ms, tối giản; tôn trọng reduced-motion; không animation cho số liệu thay đổi không rõ nguồn.
- Breakpoints test: 375/390/768/1024/1440 px; breakpoint CSS theo cấu trúc Tailwind hiện có, không đặt song song ngẫu nhiên.
- Theme: LIGHT đồng bộ trước; dark mode toàn app là P2, không giữ riêng dark mode ở dashboard gây chuyển theme bất nhất.

## 4. App Shell và Information Architecture
**Shell:** left sidebar 256px desktop, main flex:1 min-width:0, topbar cao ~56–64px, breadcrumb, tenant label thực, avatar/role thực, notification center và hành động tài khoản.
- Desktop: sidebar sticky/collapsible, nhóm menu 2–3 cấp theo nhiệm vụ, search menu nếu menu dài; active route và breadcrumb nhất quán.
- Tablet: collapsed sidebar/drawer; content và chart còn đủ rộng.
- Mobile: drawer đóng mặc định, có backdrop, Escape/close/route navigation; focus return, khóa body scroll khi mở; không dùng sidebar đè toàn màn hình.
- Navigation registry một nguồn duy nhất: menuId, parentId, route, label, icon, permission, readiness. Không dùng DEFAULT_GROUPS khi filteredGroups=[]; không có quyền => menu rỗng và giải thích phù hợp.
- Tên menu ưu tiên “Tổng quan”, “Bàn làm việc”, “Công việc”, “Báo cáo”, “Danh mục”; tránh tên dài lặp tiền tố Phòng Văn hóa – Xã hội.
- P0: thông tin tên xã và vai trò được lấy từ ctx chính thức; lỗi lấy context => màn lỗi/reauth đúng, không mặc định “Chủ tịch UBND xã”.

## 5. Shared component inventory / acceptance contract
| ID | Component | Props chính | State bắt buộc | Interaction / gate |
|---|---|---|---|---|
| DS-01 | Button | variant,size,loading,disabled,icon | default/hover/focus/disabled/pending | một primary/page; chống double submit |
| DS-02 | Input/Textarea/Select/Date | label,required,error,help,readOnly | empty/invalid/valid/disabled | aria-describedby, keyboard, field-level error |
| DS-03 | DataTable | columns,rowKey,sort,filter,pagination,actions | loading/empty/no-results/error | server paging, row action permission, responsive horizontal scroll |
| DS-04 | FilterBar/Search | query,filters,onClear,total | dirty/loading/none | URL-backed state, debounce, clear button |
| DS-05 | Dialog/Drawer | title,description,onClose,pending | open/confirm/error | focus trap, cancel focus for destructive, mobile fit |
| DS-06 | Toast/Alert/Banner | messageCode,severity,action | pending/success/warning/error | dùng catalog trong SHARED_NOTIFICATION_DESIGN_SYSTEM |
| DS-07 | KPI Card | title,value,unit,scope,period,source,href | ready/partial/unavailable | không click nếu route không hoạt động; zero khác unavailable |
| DS-08 | ChartCard | data,metricDefinition,source | loading/ready/insufficient/error | tooltip có đơn vị, date, no invented trend |
| DS-09 | EmptyState/Boundary | reason,CTA | empty/filtered/forbidden/offline/500 | không trả dữ liệu giả |
| DS-10 | Form Layout | sections,dirty,submit,errors | untouched/dirty/submitting/error | giữ giá trị nhập, cảnh báo rời trang |
| DS-11 | StatusBadge | semanticStatus,label | fixed categories | text+icon/shape, không chỉ phân biệt màu |
| DS-12 | FilePicker/ImportPreview | limits,mapping,errors,receipt | selected/validating/partial/done | hiển thị số dòng, lỗi theo dòng và retry |
| DS-13 | Timeline/Activity | events,time,actor,kind | loading/empty/ready | nguồn sự kiện thật, quyền xem và ẩn PII |
| DS-14 | Skeleton/Progress | dimensions,progress? | idle/loading | no layout shift, không giả tiến độ |
| DS-15 | Pagination | page,pageSize,total | ready/loading | URL state, record count chính xác |
| DS-16 | Breadcrumb/Tabs | routes,selected,entitlements | focus/active/disabled | giữ context/permission, không dead links |

## 6. Screen blueprints theo thứ tự làm
### S01 Tổng quan / Dashboard (P0)
- Top: title ngắn + vai trò/phạm vi/dấu thời gian dữ liệu + nút làm mới.
- Row 1: 4 KPI có định nghĩa cụ thể: việc đang mở / quá hạn / chờ rà soát / sắp đến hạn, theo quyền. Với role cán bộ, “việc của tôi” thay KPI toàn đơn vị nếu không có quyền.
- Row 2: hàng đợi ưu tiên (quan trọng hơn chart), lọc theo overdue/returned/review/due.
- Row 3: tối đa 2 biểu đồ chính (xu hướng 6 tuần và phân bố 7 trạng thái), có source note. Dữ liệu không đủ thì nêu rõ.
- Nếu dùng ví dụ, nhãn Dữ liệu minh họa cố định, không ẩn.
- Tương tác KPI dẫn tới danh sách đã lọc hợp lệ; kiểm thử drill-down permission.
### S02 Bàn làm việc (P0)
- Danh sách việc đang chờ người dùng hành động, nhắc hạn và trạng thái; không trộn với dashboard thống kê.
- Filter nhóm “Của tôi / Chờ phản hồi / Đến hạn / Hoàn tất”, phân trang phía server, CTA đúng quyền.
### S03 Công việc (P0)
- Header + nút “Tạo công việc” + filter/search/sort + DataTable có số kết quả và paging.
- Click row mở chi tiết (page/drawer), không tải toàn bộ hồ sơ vào client. Form tạo/sửa tập trung trường quan trọng, nâng cao thu gọn.
- Mỗi thao tác create/assign/transition: progress, OCC, idempotency, explicit error; không optimistic update đối với trạng thái nghiệp vụ không chắc chắn.
### S04 Văn hóa/Gia đình (P1)
- Mẫu list → đợt → hồ sơ → minh chứng → rà soát; phân biệt quyết định pháp lý với kết quả mô phỏng.
- Không tự áp rule “85 điểm” hoặc cho công nhận nếu rule chưa VERIFIED.
### S05 Báo cáo (P0/P1)
- Kỳ, mẫu, trạng thái, phiên bản, người tạo, chất lượng nguồn. Biểu đồ chỉ đi kèm định nghĩa metric.
- Xuất PDF/XLSX có job/receipt và quyền tải, hiển thị rõ chốt/bản điều chỉnh.
### S06 Nhập chỉ tiêu (P1)
- 3 bước: tải mẫu → kiểm tra bản xem trước + lỗi theo dòng → xác nhận ghi + receipt.
- Tránh chỉ cho một nút commit khi vẫn có dòng lỗi; xác định REJECT_ALL / ACCEPT_VALID.
### S07 Quản trị (P1)
- M00 6 menu; role and account management có cảnh báo tăng quyền, khóa tài khoản; audit read-only.
- M11 không hiển thị như chức năng live khi chưa code.
### S08 M02/M03/M05/M06/M07/M08 (P2 theo chiều sâu)
- Giữ template danh sách và form chung nhưng field chuyên ngành từ spec thật; dạng skeleton phải có nhãn “Đang hoàn thiện”.
- Đối tượng nhạy cảm không được lộ tên, CCCD, y tế, tôn giáo trên dashboard hoặc notification chung.

## 7. Copywriting & microinteractions
- Viết câu ngắn, tiếng Việt nhất quán, có “điều gì + bước tiếp”; hạn chế từ kỹ thuật như RPC, JSON, RowLevelSecurity trên giao diện.
- Toast thành công mặc định ~4s; lỗi cần xử lý không tự biến mất; dialog chỉ khi tác động lớn; validation ngay dưới trường + error summary.
- Tất cả action icon cần accessible label và tooltip phù hợp; không đặt “Xem thêm” không dẫn đi đâu.
- Search debounce 250–400ms cho client query; nếu URL-driven submit thì giữ hành vi rõ, không double-fetch.
- Không dùng flash màn trắng khi chuyển route; skeleton ổn định, giữ scroll khi thay filter; mọi thao tác có trạng thái loading trong ≤100ms là mục tiêu.

## 8. Evidence & gate UX
- Token catalog + component documentation + 16 story cases (default/focus/disabled/invalid/empty...).
- Screenshot từng S01–S07 ở 375,390,768,1024,1440; riêng desktop 1440 so sánh visual với main/dashboard/merged.
- Automated axe hoặc tương đương + keyboard/manual; không có lỗi critical WCAG 2.2 AA.
- Visual regression ngưỡng pixel được calibrate, có vùng động (date/ids) mask; không dùng ngưỡng tùy tiện để che sai layout.
- Chủ dự án duyệt giao diện qua hình thật và luồng thao tác, không chỉ mock Figma.
- **DoR:** UXM có tokens, mẫu màn, chính sách alert, breakpoint và acceptance; **DoD:** code tiêu thụ chung + screenshot + UAT + performance evidence.

## 9. Open decisions (không tự coi approved)
UXD-01 màu thương hiệu cuối cùng; UXD-02 dark mode toàn hệ thống; UXD-03 có cần drawer thay trang chi tiết công việc; UXD-04 menu nhiều cấp theo 128 OP; UXD-05 bộ chỉ tiêu riêng cho từng vai trò từ nguồn dữ liệu đủ độ tin cậy.
