# PVH — Demo hệ thống thông tin Phòng Văn hóa – Xã hội

Ứng dụng dự kiến phục vụ tác nghiệp, phối hợp và báo cáo cho Phòng VH-XH cấp xã tại Thái Nguyên, dùng chung một codebase với cấu hình và dữ liệu độc lập theo xã.

**Kiến trúc được người dùng đồng ý:** Next.js App Router + TypeScript + Supabase.  
**Cập nhật:** 08/11/2026.  
**Hiện trạng:** Có ứng dụng Next.js và cấu hình kết nối Supabase cho môi trường local. Các màn hình demo hiện vẫn dùng dữ liệu giả/localStorage; database cloud chưa có bảng nghiệp vụ hoặc migration được áp dụng.

## 1. Tài liệu và nguồn tham chiếu

- [Bộ plan triển khai theo 10 phase — Next.js + Supabase](../Plans/PVH_DEMO_NEXTJS_SUPABASE_v1.0/README.md): điểm bắt đầu để lập task và thực hiện; các plan cũ dùng làm nguồn kế thừa.
- [Quyết định kiến trúc Next.js + Supabase](docs/architecture/ADR-001-nextjs-supabase.md).
- [Plan nghiệp vụ và triển khai demo](../PLAN_CHI_TIET_CHUC_NANG_XAY_DUNG_DEMO_PVH_v1.0.md). Phần kỹ thuật Fastify/Vite trong plan cũ được thay thế theo ADR-001; nghiệp vụ và cổng READY/DONE tiếp tục áp dụng.
- Thiết kế tham chiếu: `/Users/dovandat/Work/designs/pvh-vhxh-demo/project/`. Đây là bộ thiết kế canvas, chưa phải source ứng dụng hoặc bằng chứng chức năng đã hoàn thành.

## 2. Kiến trúc và ranh giới trách nhiệm

- **Next.js:** giao diện, Server Components, Server Actions và Route Handlers trong cùng một ứng dụng.
- **Supabase:** PostgreSQL, Auth và private Storage; bổ sung job/Edge Function theo nhu cầu đã đặc tả.
- **Module nghiệp vụ:** tách M00–M10. M02/M03/M06/M07 có điều hướng và không gian tác nghiệp độc lập; không thay thế bằng bốn tab của một trang hồ sơ tổng hợp.
- **Đa xã:** chia sẻ source; tenant, membership, phân công và quyền theo vụ việc được kiểm tra ở server và database.
- **LEGO:** view/form/modal nhỏ, logic cục bộ, sau đó ghép vào route/layout. File giao diện tối đa 300 dòng; `page.tsx` và `route.ts` giữ mỏng.

Luồng xử lý chuẩn:

```text
Page/Form → Server Action hoặc Route Handler
          → Service + Policy + Workflow
          → Repository / PostgreSQL RPC
          → PostgreSQL + RLS / private Storage
```

Server Components đọc dữ liệu qua lớp server của feature; không bắt buộc gọi HTTP về Route Handler của chính ứng dụng. Action và Handler dùng chung service để tránh nhân đôi quy tắc.

## 3. Cây thư mục đã tạo

```text
demo-pvh/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── ban-lam-viec/
│   │   │   ├── ke-hoach-cong-viec/
│   │   │   └── <route-module>/       # Đủ các route trong bảng M00–M10
│   │   └── api/
│   │       ├── integrations/
│   │       ├── imports/
│   │       ├── exports/
│   │       └── files/
│   ├── features/
│   │   ├── auth/
│   │   └── <module>/                # Đủ M00–M10
│   │       ├── components/
│   │       ├── forms/
│   │       ├── hooks/
│   │       ├── server/              # Actions, queries, service, policy, repository
│   │       ├── schemas/             # Validation schema dùng chung khi phù hợp
│   │       └── types/               # DTO và kiểu nghiệp vụ
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── authorization/
│   │   ├── tenancy/
│   │   ├── audit/
│   │   ├── jobs/
│   │   └── errors/
│   ├── config/
│   ├── types/
│   └── styles/
├── public/                          # Không chứa tệp minh chứng hồ sơ
├── supabase/
│   ├── migrations/
│   ├── seeds/
│   │   ├── golden-b3/
│   │   └── full-system/
│   └── functions/                   # Chỉ hiện thực khi cần Edge Function
├── demo/
│   ├── configs/
│   │   ├── tenants/
│   │   └── rule-packs/
│   ├── fixtures/connectors/
│   └── scripts/
├── docs/
│   ├── business/operations/
│   ├── architecture/
│   ├── ux/
│   ├── reports/
│   ├── integrations/
│   ├── quality/
│   ├── evidence/
│   └── delivery/
└── .github/workflows/
```

### Danh mục module và route

| Feature | Route trong `(dashboard)` | Phạm vi |
|---|---|---|
| `m00-platform` | `quan-tri/` | Quản trị, tổ chức, phân công và cấu hình |
| `m01-core-work` | `du-lieu-dung-chung/` | Chủ thể, cơ sở, hồ sơ, kế hoạch và công việc |
| `m02-internal-affairs` | `noi-vu/` | Nội vụ, CCHC, thi đua, lao động và người có công |
| `m03-education` | `giao-duc/` | Giáo dục và đào tạo |
| `m04-culture-family` | `van-hoa-gia-dinh/` | Văn hóa, thông tin và gia đình |
| `m05-science-digital` | `khcn-chuyen-doi-so/` | Khoa học công nghệ và chuyển đổi số |
| `m06-health-social` | `y-te-an-sinh/` | Y tế, dân số và an sinh |
| `m07-ethnicity-faith` | `dan-toc-ton-giao/` | Dân tộc, tín ngưỡng và tôn giáo |
| `m08-inspections` | `kiem-tra/` | Kiểm tra và kiến nghị khắc phục |
| `m09-reporting` | `bao-cao/` | Thu thập chỉ tiêu, báo cáo và snapshot |
| `m10-integrations` | `tich-hop/` | Nhập dữ liệu, tích hợp và đối soát |

M01 còn sử dụng route `ke-hoach-cong-viec/`. Route group `(dashboard)` chỉ tổ chức layout, không phải cơ chế phân quyền.

### Khi một module có nhiều nghiệp vụ

Tách tiếp theo từng nghiệp vụ cụ thể thay vì nhồi tất cả vào một service hoặc form:

```text
src/features/m04-culture-family/cultural-titles/
├── components/
├── forms/
├── hooks/
├── server/
│   ├── actions.ts
│   ├── queries.ts
│   ├── service.ts
│   ├── repository.ts
│   ├── policy.ts
│   └── workflow.ts
├── schemas/
└── types/
```

Đây là mẫu triển khai tiếp theo, chưa tạo các file nghiệp vụ. Chỉ tạo lớp cần dùng; không bắt mỗi nghiệp vụ phải có đủ file rỗng. UI giữa các feature không import chéo; nghiệp vụ phối hợp qua API server công khai của module có trách nhiệm rõ.

## 4. Quy tắc xử lý server, quyền và dữ liệu

1. **Server boundary:** `queries/service/repository/policy` và client đặc quyền phải được đánh dấu `server-only` khi hiện thực. Server Actions có directive `use server`, xác thực và kiểm tra quyền từng lần gọi.
2. **Session:** tách browser/server Supabase client. Với Next.js 16+ dùng `src/proxy.ts` để hỗ trợ refresh session/điều hướng; quyền vẫn kiểm tra trong Action, Handler, service và RLS. Khóa phiên bản Next.js/Supabase trước khi viết scaffold.
3. **Tenant:** không tin tenant/role do client gửi; đối chiếu membership, hiệu lực phân công, module entitlement, lĩnh vực/xóm, sensitivity và quyền theo vụ việc. Hết ủy quyền phải chặn hành động tương ứng dù JWT chưa được refresh.
4. **Admin client:** chỉ dùng server cho tác vụ quản trị đặc quyền có kiểm tra riêng và audit; thao tác thông thường dùng phiên người dùng. Không đưa service role/secret key vào biến `NEXT_PUBLIC_*`.
5. **RLS:** áp dụng policies cho các bảng được expose; kiểm tra cả dữ liệu sau cập nhật, quyền với view/function và Storage. Browser không được ghi trực tiếp để bỏ qua workflow bắt buộc.
6. **Transaction:** nộp hồ sơ, thay trạng thái, idempotency, version check, audit và snapshot nhiều bước cần transaction/RPC có quyền thực thi phù hợp; không coi chuỗi request Supabase độc lập là transaction.
7. **Tệp:** private bucket; kiểm tra quyền theo đối tượng cha trước upload/download/export. Không đặt minh chứng hoặc backup trong `public/` hay Git.
8. **Cache:** phân biệt user/tenant/phạm vi truy cập; không cache dùng chung kết quả có dữ liệu cá nhân. Đổi xã, tài khoản hoặc quyền phải làm mới dữ liệu tương ứng.
9. **Jobs:** import/export lớn, snapshot, đối soát và reset cần trạng thái job/receipt/retry. Không dùng tác vụ nền không được theo dõi sau khi request đã kết thúc.
10. **Mô phỏng:** dùng dữ liệu giả, pack minh họa có version và nhãn kết quả mô phỏng. Không hiển thị PASS khi chưa có evidence.

## 5. Migration, seed và cấu hình môi trường

- Migration SQL nằm trong `supabase/migrations/`, tạo bằng Supabase CLI sau khi kiểm tra phiên bản và lệnh hỗ trợ; bao gồm schema, constraints, RLS, functions và grants liên quan.
- Golden seed (`GOLDEN_B3`) và seed mở rộng (`FULL_DEMO_EXT`) tách file dưới `supabase/seeds/`; không loại seed mở rộng khỏi báo cáo tổng thể để ép khớp oracle.
- SQL migration và seed đã có trong source, nhưng chưa áp dụng lên cloud; chính sách tenant và hàm đặc quyền cần sửa và kiểm thử trước khi triển khai.
- Sao chép `.env.example` thành `.env.local`, điền URL và publishable key của project Supabase demo. Không đặt secret/service role key trong biến `NEXT_PUBLIC_*` hoặc đưa file môi trường local vào Git.
- Chỉ dùng project Supabase dành cho demo/dev khi dựng ban đầu. CI phải phân biệt môi trường và không mặc định migrate production mỗi lần push.
- Không sử dụng `.ba/runtime.db`, `.ba/knowledge.db` hoặc tạo SQLite riêng cho ứng dụng.

## 6. Cài đặt và chạy

Chạy `npm ci` để cài dependency từ lockfile, sau đó `npm run dev` và mở `http://localhost:3000`. Khởi động lại dev server sau khi sửa `.env.local`.

Các việc còn lại trước khi coi hệ thống đã kết nối dữ liệu nghiệp vụ:

- Sửa và kiểm thử RLS, quyền gọi hàm và cách ly tenant trước khi nạp migration và seed.
- Tích hợp từng luồng với Supabase Auth và database, kiểm tra ghi/đọc lại và quyền truy cập.
- Hoàn thiện hướng dẫn migrate, generate types, seed, reset và quy trình vận hành an toàn.

Không ghi lệnh hoặc thông tin kết nối chưa được hiện thực như hướng dẫn sử dụng đã hoàn tất.

## 7. Điều kiện trước khi xây nghiệp vụ

Mỗi nghiệp vụ phải có OP ID, nguồn/giả định, mục tiêu, form/data, workflow, quyền, đầu ra và tình huống nghiệm thu trước khi READY. Theo dõi cả 76 REQ + 8 delta và danh mục OP; đủ menu không có nghĩa đủ nghiệp vụ.

## 8. Tài liệu kỹ thuật tham chiếu

- [Next.js — Data security](https://nextjs.org/docs/app/guides/data-security).
- [Next.js — Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
- [Supabase — SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Kết nối Auth endpoint đã được kiểm tra bằng publishable key; kết quả này không chứng minh các luồng nghiệp vụ đã sử dụng database.
