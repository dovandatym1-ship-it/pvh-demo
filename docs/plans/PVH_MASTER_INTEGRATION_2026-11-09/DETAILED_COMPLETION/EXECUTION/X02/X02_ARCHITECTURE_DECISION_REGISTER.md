# X02 — SỔ QUYẾT ĐỊNH KIẾN TRÚC DỮ LIỆU PVH
**Trạng thái:** DRAFT / PENDING OWNER APPROVAL. **Không phải ADR đã duyệt.**

## ADR-01 — M00/M11 danh mục dùng chung
- **Vấn đề:** OP-M00-006 gốc sở hữu danh mục, đặc tả mới tách M11.
- **Đề xuất:** M11 sở hữu `catalog`, `catalog_value`, hierarchy, history; M00 sở hữu cấu hình hệ thống, role và nghiệp vụ; M00 đọc danh mục qua API M11.
- **Migration:** giữ compatibility adapter, backfill giá trị có tham chiếu, unique theo tenant+catalog+code+effective period; không hard-delete.
- **Gate:** chủ dự án duyệt ownership trước khi code M11.

## ADR-02 — M01 canonical registry
- **Vấn đề:** OP-M01-013/014/015 có person/household/org/facility và merge/split; spec mới chỉ nói công việc/hồ sơ.
- **Đề xuất:** M01 sở hữu canonical subjects, addresses/area history, identity reconciliation; domain modules chỉ tham chiếu bằng FK; dữ liệu nhạy cảm giữ bảng chuyên ngành riêng.
- **Gate:** thiết kế identity merge/split reversible, audit, RLS; không lưu raw identifiers trừ khi có căn cứ.

## ADR-03 — M09/M10
- **Đề xuất:** M09 sở hữu metric, report template, period, snapshot, golden exports; M10 sở hữu source connector, import job, data mapping, discrepancy, retry/idempotency. Dashboard đọc M09 metric contract.
- **Gate:** xác minh 9 OP M09, 6 OP M10 và quyền export; không nhập chung báo cáo chính thức với CSV generic.

## ADR-04 — Thông báo, profile và inbox
- **Đề xuất:** M00 sở hữu notification policy; event source phát sinh từ module nghiệp vụ; notification service lưu recipient/read state; profile branch sở hữu giao diện inbox và hồ sơ cá nhân; M01 không tạo inbox song song.
- **Gate:** xác minh Phase 2 `work_item_inbox`, tránh double delivery, cross-tenant, private avatar, revoke access.

## ADR-05 — Dữ liệu nhạy cảm M04/M06/M07
- **Đề xuất:** case-based access, field-level masking, audit reads, deny-by-default; phân tách public aggregate và hồ sơ cá nhân; không sao chép bệnh án/tín ngưỡng/trẻ em vào dashboard.
- **Gate:** căn cứ pháp lý + thẩm quyền, negative RLS tests, retention policy, signed URL.

## ADR-06 — Branch dependency và migration
- **Đề xuất:** verify ancestry và compare commits PH01–PH06; additive schema, staged rollout, backward compatibility; cherry-pick delta, không merge nhánh cumulative mù.
- **Gate:** migration staging readback + rollback + PR Draft + một người duyệt.

## Quy trình đóng ADR
`DRAFT → REVIEWED → OWNER_APPROVED → IMPLEMENTED → VERIFIED`. Mỗi ADR phải bổ sung decision date, owner, affected tables, source citations, migration refs, rollback và test IDs. Hiện tại tất cả **DRAFT**.
