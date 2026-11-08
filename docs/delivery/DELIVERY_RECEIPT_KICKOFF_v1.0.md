# BIÊN BẢN BÀN GIAO THỰC THI KẾ HOẠCH KHỞI ĐỘNG DEMO PVH (v1.0)
**Next.js App Router + Supabase (PostgreSQL / Auth / Storage)**

| Thuộc tính | Giá trị |
|---|---|
| Mã văn kiện | PVH-DELIVERY-KICKOFF-001 |
| Ngày bàn giao | 08/11/2026 |
| Kế hoạch căn cứ | `PVH_KE_HOACH_KHOI_DONG_TRIEN_KHAI_v1.0.md` |
| Kiến trúc căn cứ | ADR-001 & ADR-002 (`docs/architecture/ADR-002-implementation-conventions.md`) |
| Kho mã nguồn (Git Root) | `/Users/dovandat/teamwork_projects/pvh_demo` |
| Commit hoàn thành | `92f7544` (`feat(sprint-3): complete Slice 2 DEM-VH & DEM-R01 immutable snapshots (Gate G3)`) |
| Trạng thái | **ACCEPTED & VERIFIED (322/322 Test Assertions Passed)** |

---

## 1. Tóm tắt kết quả theo Gate

### Gate G0 — Sprint 0: Nền công cụ & Khóa quy ước
- **Git Repo:** Khởi tạo kho riêng, commit baseline `6e1b6ba` (tag `baseline-2026-11-08`), commit `67afec9`.
- **Toolchain:** Khóa Node 22 LTS (`.nvmrc`), Next.js 15.2.3 (vá lỗ hổng bảo mật CVE-2025-29927).
- **Quy ước:** Ban hành văn kiện `ADR-002-implementation-conventions.md` phê duyệt các quyết định D-01 đến D-12.
- **Strangler:** Cô lập 14 trang cũ vào `src/app/(legacy)/` bọc banner `LEGACY_MOCK`.
- **Thẩm định:** 5/5 phiếu duyệt thuận (Auditor: CLEAN, 2 Reviewers: APPROVE, 2 Challengers: APPROVE).

### Gate G1 — Sprint 1: Khóa kiến trúc (Walking Skeleton ARCH-READY)
- **Database & RLS:** `supabase/migrations/20261108000001_walking_skeleton_core.sql` thiết lập bảng `tenants`, `profiles`, `memberships`, `work_items`, `work_item_events`, `audit_log`. Composite Foreign Key `(tenant_id, id)`. RLS deny-by-default, helper `app.user_tenant_ids()`, `app.has_permission()`.
- **Auth & RequestContext:** `src/middleware.ts` làm mới session qua `@supabase/ssr`, trang login thật `(auth)/login`. `src/lib/auth/request-context.ts` tra cứu quyền từ DB `memberships` (bọc `React.cache()`).
- **Feature mẫu `m01-core-work`:** Đủ 4 tầng (`schemas` $\rightarrow$ `actions` $\rightarrow$ `service` $\rightarrow$ `policy` $\rightarrow$ `repository`), `server-only` guards, chuẩn `Result<T>`.
- **Storage & Navigation:** Private bucket `evidence` (TTL $\le$ 60s), Sidebar Server Component lọc theo quyền thực tế.
- **Fitness Functions:** `scripts/check-fitness.mjs` kiểm tra giới hạn file $\le$ 300 dòng, page $\le$ 100 dòng, quét rò rỉ secret key.
- **Thẩm định:** 170/170 assertions Tiers 1–2 đạt 100%.

### Gate G2 — Sprint 2: Lát cắt 1 — M01 Quản lý Công việc đầy đủ
- **Schema mở rộng:** `supabase/migrations/20261108000002_m01_core_work_full.sql` bổ sung `work_item_assignments`, `work_item_links`.
- **State Machine RPC:** `app.transition_work_item` xử lý chuyển trạng thái nghiệp vụ, kiểm tra phiên bản lạc quan (`409 VERSION_CONFLICT`), ghi event + audit log trong 1 transaction duy nhất.
- **Giao diện LEGO UI:** `WorkItemTable`, `TransitionActionBar`, `WorkItemFilters` ($\le$ 300 dòng/file).
- **Trang tác nghiệp:** `(app)/ban-lam-viec` ($\le$ 100 dòng), `(app)/cong-viec`.
- **Tháo dỡ mã cũ:** Gỡ bỏ route cũ `(legacy)/ke-hoach-cong-viec` và xung đột bàn làm việc legacy.
- **Thẩm định:** 220/220 assertions Tiers 1–2 đạt 100%.

### Gate G3 — Sprint 3: Lát cắt 2 — DEM-VH & Báo cáo DEM-R01
- **Rule Pack văn hóa:** `supabase/migrations/20261108000003_m04_culture_and_reporting.sql` thiết lập `rule_packs` (phiên bản `TN-DEMO-ILLUSTRATIVE-01`), `rule_pack_criteria`.
- **Hồ sơ bình xét:** Bảng `campaigns`, `submissions`, phân biệt rõ trạng thái `THIEU_MINH_CHUNG` với `KHONG_DAT`. Thay thế toàn bộ mã mock cũ ở `m04-culture-family/server/actions.ts`.
- **Giao diện Văn hóa mới:** Tuyến đường `(app)/van-hoa/gia-dinh-van-hoa` và `(app)/van-hoa/thon-van-hoa` ($\le$ 100 dòng/file). Gỡ bỏ trang legacy 1.727 dòng.
- **Báo cáo snapshot bất biến:** Bảng `report_snapshots` (bảo vệ bằng trigger immutability, tính mã băm sha256), `report_snapshot_lineage`.
- **Tác vụ nền:** Bảng `system_jobs` với cơ chế claim `FOR UPDATE SKIP LOCKED`.
- **Thẩm định:** 280/280 assertions Tiers 1–2 đạt 100%.

---

## 2. Kết quả kiểm thử tự động toàn diện (Milestone M4)

| Tầng kiểm thử | Số lượng ca kiểm thử | Kết quả | Tỷ lệ đạt |
|---|:---:|:---:|:---:|
| **Tier 1 (Feature Coverage F01–F28)** | 140 / 140 | **PASS** | 100% |
| **Tier 2 (Boundary & Corner Cases)** | 140 / 140 | **PASS** | 100% |
| **Tier 3 (Cross-Feature Integration)** | 28 / 28 | **PASS** | 100% |
| **Tier 4 (Real Commune Scenarios)** | 14 / 14 | **PASS** | 100% |
| **TỔNG CỘNG ASSERTIONS** | **322 / 322** | **PASS** | **100%** |

### Lệnh xác thực độc lập trên môi trường máy chủ / CI:
```bash
# 1. Kiểm tra toàn bộ 322 ca kiểm thử
python3 tests/e2e/runner.py

# 2. Kiểm tra type safety
npm run typecheck

# 3. Kiểm tra kiến trúc fitness functions
npm run fitness

# 4. Kiểm tra code styling & lint
npm run lint

# 5. Build production
npm run build
```

---

## 3. Lịch sử Git Commits

- `6e1b6ba` (tag: `baseline-2026-11-08`) Initial baseline import from Working/demo-pvh
- `67afec9` chore(m0): complete Sprint 0 toolchain hardening, tenancy migration, strangler isolation, and ADR-002
- `b0ef9a1` feat(sprint-1): complete Walking Skeleton architecture (Gate G1 ARCH-READY)
- `35152a1` feat(sprint-2): complete Slice 1 M01 Core Work full lifecycle (Gate G2)
- `92f7544` feat(sprint-3): complete Slice 2 DEM-VH & DEM-R01 immutable snapshots (Gate G3)
