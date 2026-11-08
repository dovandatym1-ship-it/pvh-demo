# ADR-002: Quy ước hiện thực kiến trúc Next.js + Supabase (Implementation Conventions)

| Thuộc tính | Giá trị |
|---|---|
| **Mã tài liệu** | ADR-002 |
| **Ngày ban hành** | 08/11/2026 |
| **Trạng thái** | **APPROVED** (Phê duyệt chính thức theo Kế hoạch khởi động PVH-PLAN-KICKOFF-001) |
| **Người phê duyệt** | Product Owner, Technical Lead, Security/ATTT Reviewer |
| **Phạm vi áp dụng** | Toàn bộ mã nguồn dự án `pvh_demo` (`/Users/dovandat/teamwork_projects/pvh_demo`) |
| **Tài liệu căn cứ** | ADR-001 (Kiến trúc Next.js + Supabase), Kế hoạch khởi động v1.0 (§6), Quyết định D-01..D-12 |

---

## 1. Bối cảnh & Vấn đề kiến trúc (Context)

Theo ADR-001 và kết quả đánh giá hiện trạng baseline ngày 08/11/2026, ứng dụng prototype PVH ban đầu được xây dựng để kiểm chứng giao diện, sử dụng `localStorage` phía client (`demo-state.ts`, `demo-context.tsx`), chưa có cơ chế xác thực thật, chưa cách ly dữ liệu đa xã ở tầng CSDL và thiếu các ranh giới bảo mật cấp sản phẩm (production-grade).

Để chuyển đổi ứng dụng demo thành hệ thống sẵn sàng vận hành thực tế (production-ready) phục vụ Phòng Văn hóa – Xã hội cấp xã tại Thái Nguyên, nhóm phát triển cần một tài liệu quy chuẩn kiến trúc hiện thực (ADR-002) nhằm:
1. Xác lập các ranh giới phân tầng bất khả xâm phạm từ UI xuống CSDL.
2. Khóa chặt các quy ước import, mô hình phân quyền và cách ly đa xã (multi-tenancy).
3. Chuẩn hóa quy trình ghi dữ liệu nguyên tử qua RPC một transaction duy nhất.
4. Thiết lập các hàm kiểm định kiến trúc tự động (Architectural Fitness Functions) trong CI để ngăn chặn mọi sai lệch kiến trúc ngay từ thời điểm biên dịch.

---

## 2. Phê duyệt & Chuẩn hóa các quyết định kiến trúc D-02 đến D-12

Dự án chính thức phê chuẩn và áp dụng 11 quyết định kỹ thuật từ D-02 đến D-12:

| Mã QĐ | Tên quyết định | Nội dung chuẩn hóa được phê duyệt |
|---|---|---|
| **D-01** | **Kiến trúc đích** | *(Đã duyệt 08/11)* Next.js 15 App Router + Supabase (Postgres, Auth, Storage) theo ADR-001. Thay thế hoàn toàn khung Fastify/Vite cũ. |
| **D-02** | **Cách ly Stranglers cho FE cũ** | Áp dụng mô hình Strangler Fig: Giữ nguyên AppShell và UI components; di dời 14 trang dashboard hiện có vào nhóm route `src/app/(legacy)/`; gắn banner cảnh báo `LEGACY_MOCK` màu hổ phách (amber); thay thế dần từng trang bằng các lát cắt kiến trúc mới tại `src/app/(app)/`. |
| **D-03** | **Quản lý phiên bản mã nguồn** | Khởi tạo kho mã nguồn Git riêng biệt tại `/Users/dovandat/teamwork_projects/pvh_demo`, cô lập khỏi workspace tổng; commit toàn bộ baseline hiện trạng nguyên gốc và gắn tag bất biến `baseline-2026-11-08`. |
| **D-04** | **Mô hình định danh xã mô phỏng** | Loại bỏ hoàn toàn các địa danh hành chính thực tế ("Thịnh Đức", "Tân Cương", "Bất Bạt", "Ba Vì", "TP. Thái Nguyên"). Chuyển sang mô hình xã mô phỏng: `TN-DEMO-A` ("Xã Giả Định A" — xóm A1, A2, A3; mô hình cán bộ kiêm nhiệm) và `TN-DEMO-B` ("Xã Giả Định B" — xóm B1; mô hình cán bộ phân nhiệm). Loại bỏ hoàn toàn cấp trung gian huyện. |
| **D-05** | **Chiến lược Migration CSDL** | Kiểm tra CSDL Cloud Supabase ở chế độ chỉ đọc (read-only). Thay thế các file migration cũ bằng bộ baseline migrations chuẩn hóa mới; lưu trữ các file migration cũ vào thư mục `supabase/_legacy/` để phục vụ tra cứu lịch sử. |
| **D-06** | **Môi trường phát triển** | Môi trường phát triển cục bộ bắt buộc sử dụng Supabase CLI chạy trên container Docker local. CSDL Cloud (`zynzpifmccbcvgddmxic`) đóng vai trò staging, chỉ được migrate thông qua CI hoặc quy trình deploy có phê duyệt. |
| **D-07** | **Xác thực danh tính demo** | Sử dụng Supabase Auth email/password thật. Mỗi persona kiểm thử (P1 đến P6) được cấp một tài khoản người dùng thực tế được tạo trong `seed.sql`. Chức năng chuyển đổi persona (`PersonaSwitcher`) chỉ hiển thị khi bật `DEMO_MODE=true` và hoạt động bằng cách đăng xuất phiên hiện tại và tự động đăng nhập lại tài khoản mới. |
| **D-08** | **Lộ trình lát cắt nghiệp vụ** | Lộ trình chuyển đổi chia thành 3 giai đoạn có kiểm chứng qua các Cổng kiểm soát (Gates): Sprint 1 khóa kiến trúc bằng Walking Skeleton (Gate G1: ARCH-READY) -> Sprint 2 triển khai Lát cắt 1: M01 Công việc (Gate G2) -> Sprint 3 triển khai Lát cắt 2: DEM-VH và DEM-R01 (Gate G3). |
| **D-09** | **Khung kiểm thử đa tầng** | Sử dụng Vitest cho kiểm thử đơn vị tầng logic nghiệp vụ (`service.ts`, `policy.ts`, `workflow.ts`); sử dụng pgTAP thực thi qua lệnh `supabase test db` cho kiểm thử CSDL, RLS và RPC; sử dụng Playwright cho kiểm thử tích hợp luồng nghiệp vụ đa vai trò (E2E). |
| **D-10** | **Tổ chức nhân sự và nhịp Sprint** | Nhóm nòng cốt gồm tối thiểu: 1 Business Analyst (BA), 1 Technical Lead / Full-stack Engineer, 1 Quality Assurance (QA). Nhịp độ thực thi: Sprint 0 kéo dài 1 tuần; các Sprint 1 đến 3 kéo dài 2 tuần mỗi sprint. |
| **D-11** | **Khóa phiên bản công nghệ nền** | Khóa runtime môi trường Node.js 22 LTS qua `.nvmrc` và cấu hình `engines` trong `package.json`. Nâng cấp Next.js lên phiên bản vá an toàn nhánh 15 (>= 15.2.3) để khắc phục triệt để lỗ hổng bỏ qua middleware CVE-2025-29927; tiếp tục duy trì `middleware.ts`. |
| **D-12** | **Cơ chế xử lý tác vụ nền (Jobs)** | Bảng CSDL `system_jobs` đóng vai trò quản lý hàng đợi tác vụ nền (trạng thái, `idempotency_key`, số lần thử lại `attempts`, kết quả `receipt`); cơ chế nhận việc sử dụng truy vấn khóa dòng `FOR UPDATE SKIP LOCKED`; worker được kích hoạt qua Route Handler có khóa bí mật nội bộ (`CRON_SECRET`), không sử dụng hàng đợi bên ngoài trong giai đoạn demo. |

---

## 3. Kiến trúc phân tầng & Luồng xử lý (Layered Architecture & Data Flow)

### 3.1. Sơ đồ các luồng xử lý chuẩn

```
[LUỒNG ĐỌC DỮ LIỆU - READ FLOW]
Server Component (page.tsx <= 100 dòng)
  └── features/<module>/server/queries.ts
        └── features/<module>/server/repository.ts
              └── Supabase Client (JWT người dùng từ session cookie)
                    └── PostgreSQL + RLS (deny-by-default, lọc theo tenant_id)

[LUỒNG GHI DỮ LIỆU - WRITE MUTATION FLOW]
Client LEGO Component (form.tsx <= 300 dòng)
  └── Server Action (features/<module>/server/actions.ts) ("use server")
        ├── 1. Schema Validation (Zod safeParse)
        ├── 2. Identity & Context (getRequestContext() từ DB session)
        ├── 3. Authorization Assertion (policy.assertPermission())
        ├── 4. Business Logic (service.ts: workflow, state transition)
        └── 5. Data Access (repository.ts)
              └── PostgreSQL RPC (Hàm duy nhất thực thi trong 1 transaction):
                    ├── Kiểm tra quyền & Idempotency Key (tenant_id, idempotency_key)
                    ├── Kiểm tra khóa lạc quan Optimistic Locking (version)
                    ├── Ghi/cập nhật bản ghi nghiệp vụ
                    ├── Ghi sự kiện trạng thái (event log)
                    └── Ghi vết kiểm toán bất biến (audit_log append-only)
        ├── 6. Cache Invalidation (revalidatePath / revalidateTag)
        └── 7. Trả về Result<T> Envelope ({ ok: true, data } | { ok: false, error })

[LUỒNG TRUY XUẤT TẬP TIN - PRIVATE STORAGE FLOW]
Route Handler (src/app/api/files/[id]/route.ts)
  └── getRequestContext() + policy.assertPermission()
        └── Supabase Storage API: Sinh Signed URL ngắn hạn (TTL <= 60 giây)

[LUỒNG XỬ LÝ TÁC VỤ NỀN - SYSTEM JOBS FLOW]
Vercel Cron / External Trigger
  └── Route Handler (src/app/api/jobs/process/route.ts) (Kiểm tra CRON_SECRET)
        └── PostgreSQL RPC: Claim job qua FOR UPDATE SKIP LOCKED
              └── Background Worker Service thực thi tác vụ -> Cập nhật receipt
```

### 3.2. Cơ chế hai lớp kiểm soát quyền độc lập (Two-Tier Security Enforcement)
Hệ thống bắt buộc áp dụng đồng thời hai phòng tuyến phân quyền:
1. **Lớp 1 — Policy tại Server (Application Tier):** Kiểm tra vai trò, quyền hạn (`permissions`) và phạm vi (`scopes`) ngay trong `actions.ts` và `service.ts` nhằm tối ưu hóa trải nghiệm người dùng (UX) và chặn sớm yêu cầu không hợp lệ.
2. **Lớp 2 — RLS & RPC tại Database (Data Tier):** RLS và RPC tại PostgreSQL đóng vai trò chốt chặn bảo mật cuối cùng. Mọi câu lệnh SQL đều chạy dưới quyền `authenticated` và chịu sự ràng buộc của chính sách RLS lọc theo `app.user_tenant_ids()`.

---

## 4. Cấu trúc thư mục chuẩn (Directory Structure)

```
/Users/dovandat/teamwork_projects/pvh_demo/
├── .github/
│   └── workflows/
│       └── ci.yml                      # Pipeline CI tự động (typecheck, lint, build, fitness)
├── docs/
│   ├── architecture/
│   │   ├── ADR-001-nextjs-supabase.md
│   │   └── ADR-002-implementation-conventions.md
│   └── evidence/                       # Bằng chứng kiểm thử qua các Gate (S0, S1, S2, S3)
├── src/
│   ├── middleware.ts                   # Chỉ làm mới session Supabase + redirect login (KHÔNG chứa logic quyền)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx          # Giao diện đăng nhập thực tế
│   │   ├── (app)/                      # Các route kiến trúc mới
│   │   │   ├── layout.tsx              # AppShell server: nạp RequestContext, render Sidebar theo quyền
│   │   │   ├── ban-lam-viec/page.tsx   # Trang Bàn làm việc mới (<= 100 dòng)
│   │   │   └── cong-viec/page.tsx      # Trang Quản lý công việc mới (<= 100 dòng)
│   │   ├── (legacy)/                   # 14 trang dashboard prototype cũ (mô hình Strangler)
│   │   │   ├── layout.tsx              # Bọc DemoProvider + hiển thị banner LEGACY_MOCK
│   │   │   ├── ban-lam-viec/page.tsx
│   │   │   ├── ke-hoach-cong-viec/page.tsx
│   │   │   └── ... (12 trang khác)
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts  # Callback trao đổi mã Auth
│   │   │   ├── files/[id]/route.ts     # Route Handler cấp Signed URL
│   │   │   └── jobs/process/route.ts   # Route Handler xử lý system_jobs
│   │   ├── layout.tsx                  # Root layout (Fonts, Metadata)
│   │   └── page.tsx                    # Trang chủ (Redirect về /ban-lam-viec)
│   ├── config/
│   │   ├── env.ts                      # Cấu hình biến môi trường, xác thực qua Zod (Fail-Fast)
│   │   ├── navigation.ts               # Danh mục điều hướng động theo quyền
│   │   └── permissions.ts              # Catalog mã quyền toàn hệ thống
│   ├── features/
│   │   ├── m01-core-work/              # Module Công việc lõi (Walking Skeleton)
│   │   │   ├── components/             # LEGO UI components (mỗi file <= 300 dòng)
│   │   │   ├── schemas/                # Zod schemas (dùng chung client form & server action)
│   │   │   ├── server/                 # Bắt buộc có import "server-only" (trừ actions.ts)
│   │   │   │   ├── actions.ts          # Server Action điều phối ("use server")
│   │   │   │   ├── queries.ts          # Truy vấn dữ liệu cho Server Component
│   │   │   │   ├── service.ts          # Xử lý quy tắc nghiệp vụ
│   │   │   │   ├── workflow.ts         # Máy trạng thái công việc (State Machine)
│   │   │   │   ├── policy.ts           # Kiểm tra quyền trên bản ghi & phạm vi
│   │   │   │   └── repository.ts       # Tương tác Supabase Client & gọi RPC
│   │   │   └── types/                  # Kiểu dữ liệu nội bộ feature
│   │   └── m04-culture-family/         # Module Văn hóa - Gia đình
│   ├── components/
│   │   ├── layout/                     # Sidebar, Header, Breadcrumbs (dùng chung)
│   │   └── ui/                         # Base UI components (Button, Input, Modal...)
│   ├── lib/
│   │   ├── auth/
│   │   │   └── request-context.ts      # Hàm getRequestContext() trích xuất ngữ cảnh server
│   │   ├── authorization/
│   │   │   ├── assert-permission.ts    # Hàm assertPermission()
│   │   │   └── pii-mask.ts             # Tiện ích che giấu dữ liệu cá nhân nhạy cảm
│   │   ├── errors/
│   │   │   ├── app-error.ts            # Định nghĩa lỗi nghiệp vụ
│   │   │   └── result.ts               # Envelope Result<T> và ErrorCode chuẩn
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client (chỉ dùng cho tác vụ client UI nếu cần)
│   │   │   ├── server.ts               # Server client (dùng trong Server Component, Action, Route Handler)
│   │   │   ├── middleware.ts           # Middleware client (làm mới auth token)
│   │   │   └── admin.ts                # Service-role client (CẤM dùng trong request người dùng)
│   │   └── utils.ts
│   └── types/
│       └── database.ts                 # Kiểu dữ liệu sinh tự động từ supabase gen types
├── supabase/
│   ├── config.toml                     # Cấu hình Supabase local CLI
│   ├── migrations/                     # Các file migration CSDL: NNNN_<mo_ta>.sql
│   ├── tests/                          # Bộ kiểm thử pgTAP (chạy qua supabase test db)
│   ├── seed.sql                        # Dữ liệu khởi tạo cho TN-DEMO-A, TN-DEMO-B và persona P1-P6
│   └── _legacy/                        # Nơi lưu trữ migration cũ để tra cứu
└── tests/
    ├── unit/                           # Kiểm thử đơn vị Vitest cho service/policy
    ├── e2e/                            # Kịch bản kiểm thử E2E Playwright
    └── legacy-oracle/                  # Các test oracle đối soát dữ liệu cũ
```

---

## 5. Ma trận phụ thuộc & Ranh giới Import (Import Dependency Matrix)

Hệ thống thiết lập ranh giới phụ thuộc nghiêm ngặt giữa các tầng. Mọi vi phạm sẽ bị bộ phân tích tĩnh ESLint (`eslint-plugin-boundaries` hoặc `no-restricted-imports`) chặn đứng trong quy trình CI:

| Tầng gọi (Source Layer) | Được phép import (Allowed) | TUYỆT ĐỐI CẤM import (Forbidden) |
|---|---|---|
| `app/(app)/**` | `features/*/components`<br>`features/*/server/{queries,actions}`<br>`components/**`<br>`lib/auth/**`<br>`config/**` | `features/*/server/repository`<br>`features/*/server/service`<br>`lib/supabase/admin`<br>`demo-context`<br>`demo-state` |
| `features/X/components` | `features/X/schemas`<br>`features/X/types`<br>`features/X/server/actions`<br>`components/ui`<br>`lib/utils` | `features/Y/**` (import chéo module)<br>`features/X/server/{service,repository,queries}`<br>`lib/supabase/*` |
| `features/X/server/actions` | `features/X/server/service`<br>`features/X/server/policy`<br>`features/X/schemas`<br>`lib/auth/**`<br>`lib/errors/**` | `features/X/server/repository` (phải qua service)<br>`features/Y/**`<br>`lib/supabase/admin` |
| `features/X/server/service` | `features/X/server/workflow`<br>`features/X/server/policy`<br>`features/X/server/repository`<br>`lib/errors/**`<br>`lib/utils` | `next/*` (giữ service thuần TypeScript để test unit)<br>`features/Y/**`<br>`lib/supabase/admin` |
| `features/X/server/repository` | `lib/supabase/server`<br>`types/database`<br>`lib/errors/**` | `lib/supabase/admin`<br>`features/Y/**` |
| `lib/supabase/admin` | `config/env.ts` | **CẤM** nạp vào bất kỳ tầng nào thuộc luồng request người dùng. Chỉ dùng cho script seed CSDL cục bộ hoặc script quản trị offline. |
| `app/(legacy)/**` | Giữ nguyên các import nội bộ của prototype | **CẤM** mã nguồn mới trong `(app)` hoặc `features/` import ngược vào thư mục `(legacy)`. |

*Quy tắc chia sẻ dữ liệu liên module:* Mọi sự trao đổi thông tin giữa các module nghiệp vụ khác nhau (ví dụ: giữa M01 và M04) bắt buộc phải thực hiện thông qua các hợp đồng dùng chung đặt tại `src/lib/` hoặc thông qua các liên kết dữ liệu trong CSDL, tuyệt đối không được import trực tiếp qua lại giữa các thư mục `features/`.

---

## 6. Danh tính, Đa xã & Chuẩn RequestContext (Identity & Tenancy)

### 6.1. Quy chuẩn RequestContext
Mọi thao tác nghiệp vụ ở tầng Server bắt buộc phải khởi tạo đối tượng ngữ cảnh an toàn `RequestContext` thông qua hàm `getRequestContext()` đặt tại `src/lib/auth/request-context.ts`:

```typescript
export interface RequestContext {
  /** UUID của người dùng trong auth.users */
  readonly userId: string;
  /** UUID của xã hiện tại (TN-DEMO-A hoặc TN-DEMO-B) */
  readonly tenantId: string;
  /** Mã định danh thành viên công tác trong bảng memberships */
  readonly membershipId: string;
  /** Danh sách vai trò: ["LANH_DAO_XA", "CAN_BO_MOT_CUA", ...] */
  readonly roles: readonly string[];
  /** Danh sách quyền hạn chi tiết: ["m01:work_item:create", ...] */
  readonly permissions: readonly string[];
  /** Phạm vi phân nhiệm chi tiết */
  readonly scopes: {
    readonly hamletIds?: readonly string[];
    readonly sectorIds?: readonly string[];
  };
}

/**
 * Trích xuất RequestContext từ Supabase Auth session và membership CSDL.
 * Bọc qua React.cache để tối ưu chỉ truy vấn một lần duy nhất trong mỗi request.
 */
export const getRequestContext = React.cache(async (): Promise<RequestContext> => {
  // 1. Xác thực người dùng qua Supabase Auth (dùng getUser(), tuyệt đối không tin getSession())
  // 2. Đọc cookie `pvh_tenant` để lấy tenant mong muốn
  // 3. Truy vấn bảng `memberships` để xác thực người dùng có quyền hợp lệ tại tenant này
  // 4. Nếu cookie trỏ đến tenant không có membership -> NÉM LỖI FORBIDDEN (Fail-Closed)
  // 5. Nạp toàn bộ roles, permissions và scopes từ CSDL
});
```

### 6.2. Nguyên tắc loại bỏ định danh từ Client (Client Payload Stripping)
Client tuyệt đối **không được phép** gửi `tenantId`, `userId`, `roles`, hoặc `permissions` trong payload gửi lên Server Action. Nếu có bất kỳ trường nào trong số này xuất hiện trong dữ liệu gửi lên, Server Action bắt buộc phải bỏ qua hoặc báo lỗi `VALIDATION`. Toàn bộ định danh bắt buộc phải được suy diễn từ phiên làm việc đã xác thực của `RequestContext`.

---

## 7. Chuẩn Cơ sở dữ liệu & Kiểm soát phiên bản (Database Standards)

### 7.1. Cột dữ liệu nền tảng chuẩn hóa (Base Columns Contract)
Mọi bảng dữ liệu nghiệp vụ mới đều bắt buộc có cấu trúc cột cơ bản như sau:

```sql
CREATE TABLE public.work_items (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'NEW',
  version int NOT NULL DEFAULT 1,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Khóa chính tổng hợp bao gồm tenant_id
  CONSTRAINT pk_work_items PRIMARY KEY (tenant_id, id),
  -- Ràng buộc chống trùng lặp theo tenant
  CONSTRAINT uq_work_items_idempotency UNIQUE (tenant_id, idempotency_key)
);
```

### 7.2. Ràng buộc khóa ngoại tổng hợp (Composite Foreign Keys)
Để ngăn chặn hoàn toàn nguy cơ trỏ nhầm dữ liệu chéo giữa các xã (cross-tenant leakage):
- Mọi bảng cha bắt buộc khai báo `UNIQUE (tenant_id, id)`.
- Mọi bảng con trỏ đến bảng cha bắt buộc sử dụng khóa ngoại gồm 2 cột:
  ```sql
  CONSTRAINT fk_assignments_work_item 
    FOREIGN KEY (tenant_id, work_item_id) 
    REFERENCES public.work_items(tenant_id, id) 
    ON DELETE RESTRICT
  ```

### 7.3. Bảo toàn dữ liệu lịch sử & Xóa mềm
- Thiết lập `ON DELETE RESTRICT` trên toàn bộ các bảng lịch sử (audit, sự kiện, snapshot, hồ sơ nhạy cảm).
- Không thực hiện xóa cứng (hard delete) dữ liệu nghiệp vụ. Toàn bộ thao tác hủy bỏ/ngừng theo dõi đều thực hiện bằng cách cập nhật cột `status` (ví dụ: `status = 'CANCELLED'`).

### 7.4. Sổ vết kiểm toán bất biến (Append-Only Audit Log)
Bảng `public.audit_log` được cấu hình bất biến, chỉ cho phép ghi thêm (`INSERT`), tuyệt đối cấm sửa hoặc xóa:
```sql
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_log FROM PUBLIC, anon, authenticated;
```

### 7.5. Snapshot báo cáo bất biến (Immutable Report Snapshots)
Bảng `report_snapshots` lưu trữ báo cáo đã chốt kỳ với các trường:
- `payload_canonical_json`: Dữ liệu JSON đã được sắp xếp khóa chuẩn hóa.
- `sha256`: Mã băm SHA-256 tính từ chuỗi JSON chuẩn hóa để đảm bảo tính toàn vẹn.
- `report_snapshot_lineage`: Bảng lưu vết các bản ghi nguồn tạo nên snapshot.
- Báo cáo đã chốt snapshot không bao giờ bị biến động số liệu ngay cả khi dữ liệu nghiệp vụ gốc thay đổi.

---

## 8. Quy chuẩn RLS & Stored Procedures (RLS & RPC Conventions)

### 8.1. Chính sách bảo mật hàng (Row-Level Security)
1. **Ép buộc RLS trên 100% bảng:**
   ```sql
   ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.work_items FORCE ROW LEVEL SECURITY;
   ```
2. **Thu hồi toàn bộ quyền của vai trò ẩn danh (`anon`):**
   ```sql
   REVOKE ALL ON TABLE public.work_items FROM anon;
   ```
3. **Mẫu chính sách RLS chuẩn (Deny-by-default, sử dụng subquery để cache truy vấn):**
   ```sql
   CREATE POLICY work_items_select ON public.work_items
     FOR SELECT TO authenticated
     USING (
       tenant_id IN (SELECT app.user_tenant_ids())
       AND (SELECT app.has_permission(tenant_id, 'm01:work_item:read'))
     );

   CREATE POLICY work_items_insert ON public.work_items
     FOR INSERT TO authenticated
     WITH CHECK (
       tenant_id IN (SELECT app.user_tenant_ids())
       AND (SELECT app.has_permission(tenant_id, 'm01:work_item:create'))
     );
   ```
4. **Cấm tuyệt đối:** Không viết các mệnh đề lỏng lẻo như `tenant_id = current_setting(...) OR current_setting(...) IS NULL` hoặc dựa vào tham số do client tùy ý thiết lập.

### 8.2. Quy chuẩn hàm Stored Procedures (PostgreSQL RPC)
1. **Mặc định `SECURITY INVOKER`:** Mọi RPC thao tác dữ liệu thông thường phải chạy dưới quyền của caller để RLS tự động kiểm soát.
2. **Quy tắc khi sử dụng `SECURITY DEFINER`:** Chỉ sử dụng khi cần thực hiện các thao tác vượt cấp có kiểm soát (như ghi vào `audit_log` hoặc nạp membership). Bắt buộc phải:
   - Đặt `SET search_path = ''`.
   - Gọi tên bảng đầy đủ schema (`public.audit_log`, `app.memberships`).
   - Tự trích xuất `auth.uid()` từ session nội bộ của PostgreSQL, tuyệt đối không nhận `p_user_id` hay `p_officer_id` từ tham số truyền vào.
   - Kiểm tra `app.has_permission` ngay trong thân hàm.
   - `REVOKE EXECUTE ... FROM PUBLIC, anon;` và chỉ `GRANT EXECUTE ... TO authenticated;`.
3. **Nguyên tử hóa trong 1 Transaction duy nhất:** Mọi mutation nghiệp vụ đa bước (ghi bản ghi + ghi event + ghi audit + tăng version + kiểm tra idempotency) bắt buộc phải nằm trọn vẹn trong **MỘT** RPC duy nhất. Cấm gọi nhiều truy vấn Supabase rời rạc từ server action để chắp vá transaction.
4. **Kiểm soát đồng thời lạc quan (Optimistic Concurrency Control):**
   - Khi cập nhật trạng thái, RPC bắt buộc kiểm tra `version = p_expected_version`.
   - Nếu số phiên bản không khớp, RPC lập tức `RAISE EXCEPTION 'VERSION_CONFLICT'` để Server Action bắt lỗi và trả về mã lỗi HTTP 409.

---

## 9. Chuẩn Envelope Result<T> & Server Actions

### 9.1. Định nghĩa Envelope Result<T> (`src/lib/types/result.ts`)
Mọi Server Action và Service method bắt buộc phải trả về kiểu `Result<T>` thống nhất, tuyệt đối không để exception chưa được xử lý lọt về client:

```typescript
export type ErrorCode =
  | "UNAUTHENTICATED"     // Người dùng chưa đăng nhập hợp lệ
  | "FORBIDDEN"           // Không có quyền truy cập hoặc vượt quá phạm vi
  | "NOT_FOUND"           // Không tìm thấy bản ghi yêu cầu
  | "VALIDATION"          // Dữ liệu đầu vào không khớp Zod schema
  | "VERSION_CONFLICT"    // Xung đột phiên bản dữ liệu (Optimistic Lock)
  | "DUPLICATE_REQUEST"   // Yêu cầu bị trùng lặp Idempotency Key
  | "INVALID_TRANSITION"  // Chuyển đổi trạng thái quy trình không hợp lệ
  | "INTERNAL";           // Lỗi hệ thống nội bộ

export interface ErrorDetails {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

export type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ErrorDetails };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ErrorCode, message: string, details?: unknown): Result<T> {
  return { ok: false, error: { code, message, details } };
}
```

### 9.2. Mẫu chuẩn hiện thực Server Action (`actions.ts`)
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { Result, fail } from "@/lib/types/result";
import { CreateWorkItemSchema, type CreateWorkItemInput } from "../schemas/work-item.schema";
import { workItemService } from "./service";
import type { WorkItemDTO } from "../types";

export async function createWorkItemAction(input: unknown): Promise<Result<WorkItemDTO>> {
  try {
    // 1. Xác thực đầu vào qua Zod
    const parsed = CreateWorkItemSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu đầu vào không hợp lệ", parsed.error.flatten());
    }

    // 2. Lấy RequestContext an toàn ở server
    const ctx = await getRequestContext();

    // 3. Kiểm tra quyền hạn
    assertPermission(ctx, "m01:work_item:create");

    // 4. Ủy thác xử lý cho service
    const result = await workItemService.create(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    // 5. Làm mới cache Next.js
    revalidatePath("/cong-viec");

    return result;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return fail("FORBIDDEN", "Bạn không có quyền thực hiện hành động này");
    }
    return fail("INTERNAL", "Đã xảy ra lỗi nội bộ hệ thống");
  }
}
```

---

## 10. Quản lý Tệp tin & Lưu trữ Riêng tư (Private Storage Conventions)

1. **Bucket riêng tư (Private Bucket):** Toàn bộ tệp tin minh chứng, hồ sơ nghiệp vụ được lưu trong bucket có tên `evidence` với cấu hình `public = false`.
2. **Cấu trúc đường dẫn (Storage Path):** Bắt buộc tuân theo định dạng phân cấp theo tenant:
   ```
   evidence/{tenant_id}/{entity_type}/{entity_id}/{filename}
   ```
   Ví dụ: `evidence/c8b3e6c2-.../culture_dossier/dos-123/bien_ban_hop.pdf`.
3. **Truy xuất qua Route Handler & Signed URLs:**
   - Người dùng không được truy cập trực tiếp file từ Storage URL công khai.
   - Mọi yêu cầu tải/xem tệp tin phải đi qua Route Handler `src/app/api/files/[id]/route.ts`.
   - Route Handler xác thực `RequestContext`, kiểm tra quyền hạn người dùng trên bản ghi sở hữu file, sau đó gọi Supabase Storage SDK để sinh một **Signed URL có thời hạn ngắn (TTL <= 60 giây)** và chuyển hướng người dùng đến URL này.

---

## 11. Xử lý Tác vụ Nền qua system_jobs (Background Processing)

1. **Cấu trúc bảng `system_jobs`:**
   - Quản lý các tác vụ xử lý tốn nhiều thời gian (tạo snapshot báo cáo `DEM-R01`, xuất khẩu XLSX/PDF dung lượng lớn).
   - Các trường chính: `id`, `tenant_id`, `job_type`, `payload`, `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), `attempts`, `idempotency_key`, `receipt` (kết quả dạng JSONB), `created_at`, `updated_at`.
2. **Cơ chế Claim tác vụ chống tranh chấp (Concurrency Lock):**
   - Worker nhận việc thông qua câu lệnh SQL:
     ```sql
     SELECT id, payload FROM public.system_jobs
     WHERE status = 'PENDING' AND tenant_id = p_tenant_id
     ORDER BY created_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED;
     ```
3. **Kích hoạt Worker:** Worker được kích hoạt định kỳ thông qua Cron gọi vào Route Handler nội bộ `src/app/api/jobs/process/route.ts` có xác thực qua header `Authorization: Bearer <CRON_SECRET>`.

---

## 12. Các Hàm Kiểm định Kiến trúc Tự động trong CI (Architectural Fitness Functions)

Quy trình CI (`.github/workflows/ci.yml`) bắt buộc cấu hình các cổng kiểm soát tự động để chặn đứng mọi commit vi phạm:

1. **Kiểm tra ranh giới Import (ESLint Boundary Rule):** Chạy lệnh `npm run lint` để kiểm tra quy tắc cấm import chéo giữa các tầng theo đúng Mục 5 của tài liệu này.
2. **Giới hạn độ dài tệp tin (File Length Budget):**
   - Mọi tệp tin mới được tạo bên ngoài thư mục `src/app/(legacy)/` bắt buộc có độ dài **<= 300 dòng**.
   - Mọi tệp tin `page.tsx` trong `src/app/(app)/` bắt buộc có độ dài **<= 100 dòng**.
3. **Ranh giới Server-Only:** Toàn bộ tệp tin nằm trong thư mục `src/features/*/server/` (ngoại trừ `actions.ts` khai báo `"use server"`) bắt buộc phải có dòng khai báo đầu tiên:
   ```typescript
   import "server-only";
   ```
4. **Quét rò rỉ Khóa bí mật (Zero Secret Leak):**
   - Quét toàn bộ mã nguồn: Cấm tuyệt đối sự xuất hiện của tiền tố `NEXT_PUBLIC_` đi kèm với các từ khóa `SERVICE_ROLE`, `SECRET`, `PRIVATE_KEY`.
   - Cấm viết cứng fallback URL hoặc anon key trong mã nguồn. Toàn bộ phải thông qua `src/config/env.ts`.
5. **Kiểm tra RLS trên Schema CSDL (Database Schema RLS Linter):** Script phân tích file migration SQL kiểm tra mọi câu lệnh `CREATE TABLE` đều phải đi kèm `ENABLE ROW LEVEL SECURITY` và tối thiểu một câu lệnh `CREATE POLICY`.
6. **Kiểm tra độ lệch kiểu dữ liệu CSDL:** Lệnh `npm run db:types` kiểm tra đồng bộ giữa schema PostgreSQL và `src/types/database.ts`, CI sẽ báo lỗi nếu có diff chưa được commit.
7. **Bộ kiểm thử tự động xanh 100%:** Mọi pull request đều phải vượt qua:
   - `npm run typecheck` (`tsc --noEmit` exit code 0).
   - `npm run test` (Toàn bộ test đơn vị Vitest đạt).
   - `npm run test:db` (Toàn bộ kịch bản kiểm tra RLS/RPC bằng pgTAP đạt).
   - `npm run test:e2e` (Smoke test Playwright đạt).

---

## 13. Hệ quả & Lộ trình Chuyển đổi Strangler (Consequences & Migration)

1. **Hiệu lực thi hành:** Toàn bộ mã nguồn mới phát triển từ Sprint 1 trở đi bắt buộc tuân thủ 100% các quy định trong ADR-002 này. Bất kỳ ngoại lệ nào đều phải được thảo luận và bổ sung chính thức vào ADR bằng một phụ lục sửa đổi có chữ ký duyệt.
2. **Đối với 14 trang Prototype cũ:**
   - Toàn bộ 14 trang dashboard hiện tại được di dời vào `src/app/(legacy)/`, bọc trong layout legacy hiển thị banner cảnh báo `LEGACY_MOCK`.
   - Tại Sprint 2: Trang Bàn làm việc và Quản lý công việc mới tại `src/app/(app)/` sẽ hoàn thành và gỡ bỏ hoàn toàn route legacy tương ứng (`ke-hoach-cong-viec`).
   - Tại Sprint 3: Phân hệ Văn hóa - Gia đình mới sẽ hoàn thành và gỡ bỏ hoàn toàn route legacy `van-hoa-gia-dinh`.
   - Các trang legacy còn lại tiếp tục được cô lập và thay thế dần trong các sprint tiếp theo của dự án theo đúng tinh thần mẫu kiến trúc Strangler Fig.
