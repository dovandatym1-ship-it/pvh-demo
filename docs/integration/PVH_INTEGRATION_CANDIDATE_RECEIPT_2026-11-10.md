# PVH — Integration Candidate Receipt (10/11/2026)

**Trạng thái:** IN_PROGRESS / NOT VERIFIED. **Nhánh:** `integrate/pvh-backbone-review-20261110` từ `main@e08fa3587bede82be6ea77c45d7a83a76cf9be24`.

## Nguồn
- Common base: `5c6c69846f54dddbdf99af60b3247bfece4df6f8`.
- Phase 6 safety: `fix/pvh-ph06-data-safety-20261109@0506748c01f8f43293163b2f529a5c00675c92eb` (đã gồm PH03–PH05 gốc).
- 154 đường dẫn thay đổi chỉ từ Phase (không kể các tệp xung đột); giữ 10 tệp riêng của main; 6 tệp có thay đổi từ cả hai phía cần phân giải.

## Quyết định từng xung đột
| Tệp | Chọn source trong candidate | Lý do / việc bắt buộc tiếp |
|---|---|---|
| `src/app/(app)/cong-viec/page.tsx` | PH06 | getWorkItemsPage có phân trang/lọc theo quyền; giữ các modal UI main làm nguồn tái tích hợp, không lấy getWorkItems có thể không giới hạn |
| `src/components/layout/sidebar.tsx` | PH06 | menu nhập chỉ tiêu và permission registry đầy đủ hơn; PH05 fix fail-open sẽ áp sau |
| `src/config/navigation.ts` | PH06 | hasExplicitPermission kiểm tra quyền tường minh; giữ grouping đẹp từ main làm task UI sau |
| `src/features/m01-core-work/server/repository.ts` | PH06 | RPC app transaction/OCC/idempotency; loại bỏ fallback tạo thành công giả |
| `src/features/m04-culture-family/server/actions.ts` | PH06 | khóa action di sản chưa có authority, tránh công nhận chính thức giả |
| `src/features/m06-health-social/components/beneficiary-table.tsx` | PH06 safety | DTO đã che trường nhạy cảm trên server, tránh truyền raw CCCD và bệnh lý xuống trình duyệt; modal CRUD main cần tích hợp lại |

**Quan trọng:** quyết định trên chỉ là code candidate; vẫn phải đối chiếu visual, API, nghiệp vụ, CI và owner trước G-MERGE. Không được hiểu là đánh giá 16 file UI của main đã được phục hồi đầy đủ.

## Giữ lại main-only
- `src/features/m01-core-work/components/create-work-item-modal.tsx`
- `src/features/m01-core-work/components/work-item-detail-modal.tsx`
- `src/features/m01-core-work/components/work-item-manager.tsx`
- `src/features/m01-core-work/components/work-item-return-modal.tsx`
- `src/features/m01-core-work/components/work-item-table.tsx`
- `src/features/m04-culture-family/components/culture-dossier-manager.tsx`
- `src/features/m04-culture-family/components/propose-household-modal.tsx`
- `src/features/m06-health-social/components/create-beneficiary-modal.tsx`
- `src/features/m07-ethnicity-faith/components/create-establishment-modal.tsx`
- `src/features/m07-ethnicity-faith/components/establishment-table.tsx`

## 9 migration bản cũ phải đối soát
Các file `20261108000001`–`20261108000009` trong main được **giữ lại tạm** và không xóa bằng merge máy móc. Phase 6 bổ sung migration mới, dẫn đến rủi ro trùng định nghĩa/schema nếu replay toàn bộ; **DB replay GATE BLOCKED** đến khi đối chiếu checksum, applied history cloud, dependency và quyết định chính thức archiving/forward migration. Supabase cloud chưa đổi.

## Cổng nghiệm thu còn thiếu
- PH01/02 unique-tip audit và backport chính xác.
- PH03/04/05 fix PR #8–#10 và PH06 safety PR #11 được đối chiếu theo file/commit, không merge chồng branch.
- Dashboard, login split-screen, profile/notifications, chuẩn thuật ngữ tiếng Việt cần review riêng; không thay thế source khi chưa audit.
- npm security audit còn cảnh báo; staging RLS/Storage/DB/E2E/UAT NOT_RUN.
- **Không merge main, không deploy Vercel, không chạy migration trên Demo-pvh**. Owner Đỗ Văn Đạt duyệt lần cuối.
