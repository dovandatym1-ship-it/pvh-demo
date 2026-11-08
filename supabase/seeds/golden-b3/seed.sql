-- ====================================================================
-- PVH v1.0 — GOLDEN SEED DATA (GOLDEN_B3) EXPANDED
-- Scope: Multi-Tenant Simulation (Xa A - Thinh Duc, Xa B - Tan Cuong)
-- Location: Thai Nguyen, Vietnam
-- Compliance: D03 Module Isolation & Multi-Tenancy RLS
-- Date: 07/11/2026
-- Matching 1:1 with DemoDataStore (TypeScript Golden Seeds)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TENANTS
-- --------------------------------------------------------------------
INSERT INTO tenants (id, code, name, province, officer_mode, features) VALUES
('a0000000-0000-0000-0000-000000000001', 'TN-DEMO-A', 'UBND Xã Giả định A', 'Thái Nguyên', 'CONCURRENT', '{"digitalTransformation": true, "fieldInspection": true, "advancedCulturalTitles": true}'::jsonb),
('a0000000-0000-0000-0000-000000000002', 'TN-DEMO-B', 'UBND Xã Giả định B', 'Thái Nguyên', 'SPECIALIZED', '{"digitalTransformation": false, "fieldInspection": false, "advancedCulturalTitles": true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------------------
-- 2. HAMLETS
-- --------------------------------------------------------------------
INSERT INTO hamlets (id, tenant_id, code, name, leader_name, households_count) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'XOM_A1', 'Xóm A1', 'Hoàng Văn Tuấn', 240),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'XOM_A2', 'Xóm A2', 'Nguyễn Văn Hòa', 180),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'XOM_A3', 'Xóm A3', 'Trần Văn Cường', 100),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'XOM_B1', 'Xóm B1', 'Đặng Văn Long', 140)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 3. PROFILES (Personas P1–P6)
-- --------------------------------------------------------------------
INSERT INTO profiles (id, tenant_id, persona_code, full_name, role, role_title, email, phone, can_view_pii) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'P1', 'Nguyễn Văn An', 'CHAIRMAN', 'Chủ tịch UBND xã', 'an.nguyen@pvh.thainguyen.gov.vn', '0912.345.678', false),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'P2', 'Trần Thị Mai', 'OFFICER_CONCURRENT', 'Công chức VH-XH (Kiêm nhiệm)', 'mai.tran@pvh.thainguyen.gov.vn', '0988.765.432', true),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'P3', 'Lê Văn Hùng', 'OFFICER_SPECIALIZED', 'Công chức VH-XH (Chuyên trách)', 'hung.le@pvh.thainguyen.gov.vn', '0977.112.233', true),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'P4', 'Hoàng Văn Tuấn', 'HAMLET_LEADER', 'Trưởng thôn A1', 'tuan.hoang@pvh.thainguyen.gov.vn', '0966.554.433', false),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'P5', 'Phạm Thị Lan', 'ONE_STOP_CLERK', 'Cán bộ Một cửa tiếp nhận', 'lan.pham@pvh.thainguyen.gov.vn', '0944.889.900', true),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'P6', 'Đỗ Minh Đức', 'INSPECTOR', 'Cán bộ Thanh tra liên ngành', 'duc.do@pvh.thainguyen.gov.vn', '0933.221.144', true)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 4. MASTER SUBJECTS (Công dân & Chủ thể quản lý)
-- --------------------------------------------------------------------
INSERT INTO master_subjects (id, tenant_id, hamlet_id, code, full_name, subject_type, id_card_number, address, status, members_count) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CD-001', 'Hoàng Văn Nam', 'HOUSEHOLD_HEAD', '019082001122', 'Số 12 Xóm A1', 'ACTIVE', 4),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CD-002', 'Nguyễn Thị Lan', 'HOUSEHOLD_HEAD', '019184003344', 'Số 45 Xóm A1', 'ACTIVE', 3),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'CD-003', 'Trần Văn Bình', 'WAR_INVALID', '019077005566', 'Số 88 Xóm A2', 'ACTIVE', 5),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'CD-004', 'Vũ Đình Trọng', 'HOUSEHOLD_HEAD', '019089007788', 'Số 05 Xóm A3', 'ACTIVE', 4),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CD-005', 'Hoàng Văn Nam', 'CITIZEN', '019082001122', 'Số 12 Xóm A1 (Khai tại Một cửa)', 'ACTIVE', 1),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CD-006', 'Nguyễn Thị Lan', 'CITIZEN', '019184003344', 'Số 45 Xóm A1 (Khai hồ sơ BTXH)', 'ACTIVE', 1),
('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CD-007', 'Nguyễn Văn Tí', 'CITIZEN', '019308009988', 'Xóm A1 (LĐ vị thành niên)', 'ACTIVE', 1),
('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CDB-001', 'Dương Đình Hùng', 'HOUSEHOLD_HEAD', '019076008912', 'Xóm B1', 'ACTIVE', 4),
('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CDB-002', 'Dương Đình Hùng', 'CITIZEN', '019076008912', 'Tổ tự quản Xóm Chè', 'ACTIVE', 1),
('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CDB-003', 'Tạ Thị Búp', 'CITIZEN', '019183004455', 'Xóm B1', 'ACTIVE', 3)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 5. MASTER FACILITIES (Cơ sở & Thiết chế thỏa mãn khóa ngoại)
-- --------------------------------------------------------------------
INSERT INTO master_facilities (id, tenant_id, hamlet_id, code, name, category, capacity, status, details) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-VH-001', 'Nhà văn hóa Xóm A1', 'CULTURAL_HOUSE', '150 chỗ ngồi', 'ACTIVE', '{"pccc": true}'::jsonb),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-VH-002', 'Đình làng A1', 'HISTORICAL_MONUMENT', 'Khuôn viên 800m2', 'ACTIVE', '{"heritageRank": "PROVINCIAL"}'::jsonb),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'CS-VH-003', 'Sân thể thao trung tâm xã Giả định A', 'SPORTS_GROUND', 'Sân bóng mini', 'ACTIVE', '{}'::jsonb),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-GD-001', 'Trường Tiểu học Giả định A', 'SCHOOL', '450 học sinh', 'ACTIVE', '{"level": "PRIMARY"}'::jsonb),
('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-GD-002', 'Nhóm trẻ độc lập Hoa Mai', 'KINDERGARTEN_CLASS', '30 trẻ', 'ACTIVE', '{"areaSqm": 65}'::jsonb),
('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-DN-001', 'Công ty TNHH May Giả định A', 'ENTERPRISE', '120 công nhân', 'ACTIVE', '{"taxCode": "4601234567"}'::jsonb),
('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-DV-001', 'Cửa hàng photocopy & dịch vụ số Giả định A', 'CULTURAL_SERVICE', '3 máy', 'ACTIVE', '{}'::jsonb),
('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-AT-001', 'Bếp ăn bán trú Tiểu học Giả định A', 'FOOD_FACILITY', '450 suất/ngày', 'ACTIVE', '{"sampleRetention": true}'::jsonb),
('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-AT-002', 'Quán cơm bình dân A1', 'FOOD_FACILITY', '60 chỗ', 'ACTIVE', '{}'::jsonb),
('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-YT-001', 'Nhà thuốc tư nhân GPP A1', 'MEDICAL_PHARMACY', 'GPP', 'ACTIVE', '{"license": "GP-46/2023"}'::jsonb),
('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS-TG-001', 'Chùa Khánh Long A1', 'RELIGIOUS_FACILITY', 'Chùa Phật giáo', 'ACTIVE', '{}'::jsonb),
('f0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CS-VH-B-001', 'Nhà văn hóa Xóm B1', 'CULTURAL_HOUSE', '120 chỗ ngồi', 'ACTIVE', '{}'::jsonb),
('f0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CS-VH-B-002', 'Không gian Trưng bày Văn hóa Trà Giả định B', 'HISTORICAL_MONUMENT', 'Khuôn viên 1500m2', 'ACTIVE', '{"heritageRank": "NATIONAL"}'::jsonb),
('f0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CS-DN-B-001', 'HTX Chè Đặc sản Giả định B', 'ENTERPRISE', '24 xã viên', 'ACTIVE', '{"taxCode": "4601998877"}'::jsonb),
('f0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CS-GD-B-001', 'Nhóm trẻ Búp Chè Xanh', 'KINDERGARTEN_CLASS', '20 trẻ', 'ACTIVE', '{"areaSqm": 45}'::jsonb),
('f0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CS-AT-B-001', 'Không gian ẩm thực trà Giả định B', 'FOOD_FACILITY', '100 chỗ', 'ACTIVE', '{}'::jsonb),
('f0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'CS-YT-B-001', 'Quầy thuốc tư nhân Giả định B', 'MEDICAL_PHARMACY', 'GPP', 'ACTIVE', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 6. CULTURAL TITLES (Gia đình văn hóa — Khống chế trần 50% MET-03)
-- --------------------------------------------------------------------
INSERT INTO cultural_titles (id, tenant_id, hamlet_id, subject_id, code, household_head, members_count, evaluation_year, score, years_recognized, status, approved_by, approved_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'GĐVH-2026-001', 'Hoàng Văn Nam', 4, 2026, 95, 3, 'APPROVED', 'c0000000-0000-0000-0000-000000000001', '2026-11-05T09:00:00Z'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'GĐVH-2026-002', 'Nguyễn Thị Lan', 3, 2026, 88, 1, 'EVALUATED', NULL, NULL),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'GĐVH-2026-003', 'Trần Văn Bình', 5, 2026, 92, 5, 'APPROVED', 'c0000000-0000-0000-0000-000000000001', '2026-11-05T09:30:00Z'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 'GĐVH-2026-004', 'Vũ Đình Trọng', 4, 2026, 74, 0, 'PROPOSED', NULL, NULL),
('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000011', 'GĐVH-B-2026-01', 'Dương Đình Hùng', 4, 2026, 96, 4, 'APPROVED', 'c0000000-0000-0000-0000-000000000003', '2026-10-28T08:00:00Z')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 7. WORK TASKS (Hàng đợi công việc MET-01, MET-02)
-- --------------------------------------------------------------------
INSERT INTO work_tasks (id, tenant_id, code, title, category, assigned_to, due_date, priority, status, hamlet_id) VALUES
('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'TASK-A-001', 'Kiểm tra an toàn PCCC tại Nhà văn hóa thôn Đồng Tiến', 'Kiểm tra hiện trường', 'c0000000-0000-0000-0000-000000000002', '2026-11-06', 'HIGH', 'IN_PROGRESS', 'b0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'TASK-A-002', 'Tổng hợp danh sách chi trả trợ cấp BTXH tháng 11/2026', 'Y tế & An sinh', 'c0000000-0000-0000-0000-000000000002', '2026-11-10', 'MEDIUM', 'TODO', 'b0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'TASK-A-003', 'Rà soát chỉ tiêu chuyển đổi số quý IV chuẩn bị báo cáo Oracle', 'KHCN & Chuyển đổi số', 'c0000000-0000-0000-0000-000000000002', '2026-11-15', 'MEDIUM', 'TODO', NULL),
('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'TASK-A-004', 'Tiếp nhận thông báo tổ chức Lễ hội Đình làng A1', 'Văn hóa & Gia đình', 'c0000000-0000-0000-0000-000000000005', '2026-11-02', 'LOW', 'COMPLETED', 'b0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'TASK-B-001', 'Lập kế hoạch tổ chức Lễ hội văn hóa Trà Giả định B 2026', 'Văn hóa & Gia đình', 'c0000000-0000-0000-0000-000000000003', '2026-11-20', 'MEDIUM', 'IN_PROGRESS', 'b0000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'TASK-B-002', 'Kiểm tra định kỳ các cơ sở sản xuất chế biến chè VietGAP', 'Kiểm tra hiện trường', 'c0000000-0000-0000-0000-000000000003', '2026-11-25', 'LOW', 'TODO', 'b0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 8. INSPECTION RECORDS (Kiến nghị kiểm tra MET-05)
-- --------------------------------------------------------------------
INSERT INTO inspection_records (id, tenant_id, code, target_name, category, hamlet_id, inspector_id, inspection_date, findings_count, remediation_status, remediation_deadline, notes) VALUES
('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'INS-001', 'Nhà văn hóa Xóm A1', 'PCCC', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '2026-11-01', 2, 'PENDING', '2026-11-06', 'Thiếu bình bọt cứu hỏa và tiêu lệnh PCCC hết hạn'),
('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'INS-002', 'Bếp ăn trường Tiểu học Giả định A', 'ATTP', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '2026-11-04', 1, 'IN_PROGRESS', '2026-11-12', 'Sổ lưu mẫu thức ăn 24h chưa ghi chép đủ 3 bước'),
('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'INS-003', 'Quán cơm bình dân A1', 'ATTP', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', '2026-10-25', 0, 'NO_VIOLATION', NULL, 'Đạt chuẩn vệ sinh cơ sở thức ăn đường phố'),
('20000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'INS-B-001', 'Cơ sở sản xuất chè Hảo Đạt', 'VIETGAP', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', '2026-10-20', 0, 'NO_VIOLATION', NULL, 'Quy trình sản xuất chè OCOP 5 sao tuân thủ tốt')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 9. 17 EXPANDED TABLES (Migration 000002)
-- --------------------------------------------------------------------

-- Table 1: labor_contracts_wages
INSERT INTO labor_contracts_wages (id, tenant_id, facility_id, business_name, tax_code, total_workers, min_wage_paid, regional_min_wage, seasonal_workers_count, bhxh_registered_count, evaluation_period) VALUES
('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000006', 'Công ty TNHH May Giả định A', '4601234567', 120, 4160000.00, 3960000.00, 15, 105, 'YEAR-2026'),
('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL, 'Xưởng mộc gia dụng A1', '4609876543', 8, 3800000.00, 3960000.00, 4, 3, 'YEAR-2026'),
('30000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000023', 'HTX Chè Đặc sản Giả định B', '4601998877', 24, 4500000.00, 3960000.00, 10, 20, 'YEAR-2026')
ON CONFLICT DO NOTHING;

-- Table 2: labor_disputes_mediation
INSERT INTO labor_disputes_mediation (id, tenant_id, case_code, requester_name, requester_role, respondent_name, dispute_content, mediator_id, received_date, session_date, attendance_count, status, outcome_summary) VALUES
('31000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'TC-LD-2026-01', 'Nguyễn Văn Hải', 'EMPLOYEE', 'Xưởng gạch A1', 'Tranh chấp tiền lương làm thêm giờ ca đêm chưa thanh toán', 'c0000000-0000-0000-0000-000000000002', '2026-10-18', '2026-10-25', 4, 'RESOLVED_SUCCESS', 'Doanh nghiệp đồng ý truy lĩnh 4.500.000đ tiền làm thêm'),
('31000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'TC-LD-2026-02', 'Tập thể công nhân Xưởng mộc', 'COLLECTIVE', 'Xưởng mộc gia dụng A1', 'Đình công tập thể yêu cầu đóng BHXH bắt buộc', 'c0000000-0000-0000-0000-000000000002', '2026-11-02', NULL, 0, 'RECEIVED', 'Vụ việc đình công tập thể vượt quá thẩm quyền cấp xã theo D03; Đã lập biên bản chuyển Cơ quan Quản lý Lao động cấp trên')
ON CONFLICT DO NOTHING;

-- Table 3: labor_underage_monitoring
INSERT INTO labor_underage_monitoring (id, tenant_id, minor_subject_id, employer_name, guardian_consent_doc, allowed_job_category, daily_hours, health_certificate_valid_until, inspection_status) VALUES
('32000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'Cơ sở gốm sứ thủ công mỹ nghệ', 'Đơn đồng thuận người giám hộ số 12/GXN-GD', 'TRADITIONAL_CRAFT', 3.5, '2027-04-15', 'COMPLIANT')
ON CONFLICT DO NOTHING;

-- Table 4: education_private_facilities
INSERT INTO education_private_facilities (id, tenant_id, facility_id, facility_type, owner_name, owner_id_card, management_credential, children_capacity, current_enrolled, total_area_sqm, fire_safety_certified, food_safety_certified, licensing_status, last_inspected_date) VALUES
('33000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'INDEPENDENT_KINDERGARTEN_CLASS', 'Trần Thị Thu Trang', '019188002233', 'Chứng chỉ nghiệp vụ QLGD mầm non số 104', 30, 24, 65.00, true, true, 'LICENSED', '2026-10-15'),
('33000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000024', 'INDEPENDENT_NURSERY_GROUP', 'Hoàng Thị Thảo', '019179004455', 'Bằng CĐ Sư phạm Mầm non', 20, 16, 45.00, true, true, 'LICENSED', '2026-09-20')
ON CONFLICT DO NOTHING;

-- Table 5: community_learning_centers
INSERT INTO community_learning_centers (id, tenant_id, center_name, director_name, annual_plan_approved, courses_conducted, total_learners, annual_rating) VALUES
('34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Trung tâm học tập cộng đồng Xã Giả định A', 'Phó Chủ tịch UBND xã (Kiêm Giám đốc)', true, 8, 320, 'EXCELLENT'),
('34000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Trung tâm học tập cộng đồng Xã Giả định B', 'Phó Chủ tịch UBND xã Giả định B', true, 6, 240, 'GOOD')
ON CONFLICT DO NOTHING;

-- Table 6: festival_records
INSERT INTO festival_records (id, tenant_id, reg_type, code, festival_name, organizer_name, scale, start_date, end_date, location_desc, attached_plan_url, status, decision_ref, decision_date) VALUES
('35000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'NOTIFICATION', 'LH-2026-001', 'Lễ hội Đình làng A1 đầu xuân', 'Ban khánh tiết Đình làng A1', 'Cấp thôn/xóm', '2026-02-18', '2026-02-20', 'Khuôn viên Đình làng A1', 'https://storage.pvh.gov.vn/plans/dinh-tan-thinh-2026.pdf', 'RECORDED', 'Văn bản tiếp nhận số 18/TB-UBND', '2026-01-25'),
('35000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'OFFICIAL_REGISTRATION', 'LH-B-2026-01', 'Lễ hội Văn hóa Trà Giả định B 2026', 'UBND Xã Giả định B & Hiệp hội Làng nghề', 'Cấp liên xã/huyện', '2026-11-20', '2026-11-22', 'Không gian Trưng bày Văn hóa Trà Giả định B', 'https://storage.pvh.gov.vn/plans/tra-gia-dinh-b-2026.pdf', 'APPROVED', 'Quyết định số 102/QĐ-UBND', '2026-10-10')
ON CONFLICT DO NOTHING;

-- Table 7: cultural_services_monitoring
INSERT INTO cultural_services_monitoring (id, tenant_id, facility_id, service_type, owner_name, device_count, content_commitment_signed, last_compliance_check, status) VALUES
('36000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000007', 'PHOTOCOPY_SHOP', 'Nguyễn Tiến Dũng', 3, true, '2026-09-15', 'ACTIVE'),
('36000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL, 'PUBLIC_GAME', 'Đặng Tuấn Anh', 18, true, '2026-10-05', 'ACTIVE'),
('36000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', NULL, 'PHOTOCOPY_SHOP', 'Lê Thị Thu', 2, true, '2026-08-20', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Table 8: domestic_violence_dossiers
INSERT INTO domestic_violence_dossiers (id, tenant_id, hamlet_id, case_code, victim_subject_id, perpetrator_name, perpetrator_relation, severity_level, reported_at, emergency_restraining_order, restraining_order_until, temporary_shelter_arranged, intervention_status, assigned_officer_id, closure_assessment) VALUES
('37000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'DV-2026-001', 'd0000000-0000-0000-0000-000000000002', 'Vũ Văn T', 'Chồng', 'URGENT_DANGER', '2026-10-28T21:00:00Z', true, '2026-11-04T21:00:00Z', 'Nhà tạm lánh khẩn cấp Hội Phụ nữ xã', 'INTERVENING', 'c0000000-0000-0000-0000-000000000002', 'Đã phối hợp Công an xã lập biên bản răn đe'),
('37000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'DV-2026-002', 'd0000000-0000-0000-0000-000000000001', 'Hoàng Văn K', 'Con trai', 'LOW_RISK', '2026-09-10T14:30:00Z', false, NULL, NULL, 'SAFE_CLOSED', 'c0000000-0000-0000-0000-000000000002', 'Tổ hòa giải xóm đã hòa giải ổn thỏa, gia đình cam kết không tái diễn'),
('37000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'DV-B-2026-01', 'd0000000-0000-0000-0000-000000000013', 'Tạ Văn Q', 'Chồng', 'LOW_RISK', '2026-08-15T19:00:00Z', false, NULL, NULL, 'SAFE_CLOSED', 'c0000000-0000-0000-0000-000000000003', 'Đã tư vấn tâm lý và theo dõi an toàn')
ON CONFLICT DO NOTHING;

-- Table 9: food_safety_checklists
INSERT INTO food_safety_checklists (id, tenant_id, facility_id, inspection_type, inspector_id, inspection_date, water_source_passed, waste_handling_passed, utensils_sanitized, food_origin_verified, sample_retention_24h_passed, health_cert_valid, total_score, conclusion) VALUES
('38000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000008', 'SCHOOL_CANTEEN', 'c0000000-0000-0000-0000-000000000006', '2026-11-04', true, true, true, true, false, true, 85, 'WARNING_REMEDIAL'),
('38000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000009', 'STREET_FOOD', 'c0000000-0000-0000-0000-000000000006', '2026-10-25', true, true, true, true, true, true, 95, 'PASSED'),
('38000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000025', 'STREET_FOOD', 'c0000000-0000-0000-0000-000000000003', '2026-10-18', true, true, true, true, true, true, 92, 'PASSED')
ON CONFLICT DO NOTHING;

-- Table 10: private_medical_pharmacy_facilities
INSERT INTO private_medical_pharmacy_facilities (id, tenant_id, facility_id, facility_sub_type, practitioner_name, license_number, license_issue_date, gpp_certified, controlled_drugs_ledger_maintained, inspection_status) VALUES
('39000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000010', 'DRUG_STORE', 'Dược sĩ Nguyễn Thị Thảo', 'GP-46/TN-2023', '2023-05-10', true, true, 'NORMAL'),
('39000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL, 'TRADITIONAL_CLINIC', 'Lương y Đặng Văn Hợp', 'GP-YCT-18/2022', '2022-08-20', true, true, 'NORMAL'),
('39000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000026', 'DRUG_STORE', 'Dược sĩ Lê Văn Khôi', 'GP-78/TN-2024', '2024-02-15', true, true, 'NORMAL')
ON CONFLICT DO NOTHING;

-- Table 11: epidemic_surveillance_logs
INSERT INTO epidemic_surveillance_logs (id, tenant_id, hamlet_id, disease_group, disease_name, cases_count, hospitalized_count, deaths_count, outbreak_alert_flag, log_week, log_year, reported_date) VALUES
('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'GROUP_B', 'DENGUE', 3, 1, 0, false, 44, 2026, '2026-11-03'),
('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'GROUP_B', 'HAND_FOOT_MOUTH', 2, 0, 0, false, 44, 2026, '2026-11-04'),
('40000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'GROUP_B', 'DENGUE', 1, 0, 0, false, 44, 2026, '2026-11-01')
ON CONFLICT DO NOTHING;

-- Table 12: religious_irregularities
INSERT INTO religious_irregularities (id, tenant_id, hamlet_id, incident_code, location_desc, organizer_identified, attendees_estimated, nature_type, verified_by, action_taken, status) VALUES
('41000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'TG-2026-01', 'Khu vườn nhà ông Bùi Văn Q, xóm A3', 'Người từ tỉnh ngoài đến truyền đạo chưa đăng ký', 18, 'UNREGISTERED_GATHERING', 'c0000000-0000-0000-0000-000000000002', 'GUIDED_OFFICIAL_REGISTRATION', 'MONITORING'),
('41000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'TG-B-2026-01', 'Khu vực giáp ranh đồi chè', 'Sinh hoạt nhóm đọc sách tín ngưỡng', 8, 'UNREGISTERED_GATHERING', 'c0000000-0000-0000-0000-000000000003', 'GUIDED_OFFICIAL_REGISTRATION', 'RESOLVED')
ON CONFLICT DO NOTHING;

-- Table 13: ethnic_policy_allocations
INSERT INTO ethnic_policy_allocations (id, tenant_id, subject_id, hamlet_id, program_code, sub_project_type, budget_allocated, public_posting_start, public_posting_end, objection_filed, approval_decision_ref, disbursement_status) VALUES
('42000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'MTQG_1719', 'HOUSING_AID', 40000000.00, '2026-10-15', '2026-10-31', false, 'QĐ-1719/2026-01', 'APPROVED'),
('42000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'MTQG_1719', 'WATER_SUPPLY', 15000000.00, '2026-11-01', '2026-11-16', false, NULL, 'POSTED'),
('42000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000004', 'MTQG_1719', 'JOB_TRANSITION', 25000000.00, '2026-09-01', '2026-09-16', false, 'QĐ-1719/2026-B1', 'DISBURSED')
ON CONFLICT DO NOTHING;

-- Table 14: citizen_residence_history
INSERT INTO citizen_residence_history (id, tenant_id, subject_id, action_type, old_hamlet_id, new_hamlet_id, old_household_code, new_household_code, event_date, reference_document, notes) VALUES
('43000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'SPLIT_HOUSEHOLD', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'HK-TT-008', 'HK-TT-012', '2024-03-15', 'QĐ số 45/QĐ-UBND', 'Tách hộ sau khi kết hôn lập gia đình riêng'),
('43000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'RELOCATE_HAMLET', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', NULL, NULL, '2025-06-20', 'QĐ số 89/QĐ-UBND', 'Chuyển nơi cư trú do thu hồi mặt bằng cụm dân cư'),
('43000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'IN_MIGRATION', NULL, 'b0000000-0000-0000-0000-000000000002', NULL, 'HK-DT-054', '2023-10-12', 'Quyết định số 112/QĐ-UBND', 'Tiếp nhận thương binh di chuyển hộ khẩu hưởng chế độ'),
('43000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'MERGE_HOUSEHOLD', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'HK-TT-019', 'HK-TT-020', '2025-01-08', 'Quyết định số 05/QĐ-UBND', 'Nhập hộ theo quy định Luật Cư trú'),
('43000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000011', 'MERGE_HOUSEHOLD', NULL, 'b0000000-0000-0000-0000-000000000004', 'HK-TC-004', 'HK-TC-001', '2024-08-01', 'QĐ số 33/QĐ-UBND', 'Quy tụ gia đình làm vùng trồng chè OCOP'),
('43000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000013', 'IN_MIGRATION', NULL, 'b0000000-0000-0000-0000-000000000004', NULL, NULL, '2025-02-14', 'QĐ số 18/QĐ-UBND', 'Chuyển đến kinh doanh du lịch trải nghiệm chè')
ON CONFLICT DO NOTHING;

-- Table 15: citizen_identity_merges (Lịch sử đã gộp định danh mẫu)
INSERT INTO citizen_identity_merges (id, tenant_id, golden_subject_id, merged_subject_id, merged_by, reason) VALUES
('44000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Atomic merge mô phỏng: Gộp bản ghi khai báo trùng lặp CCCD 019082001122 tại bộ phận Một Cửa')
ON CONFLICT DO NOTHING;

-- Table 16: import_batches
INSERT INTO import_batches (id, tenant_id, batch_code, file_name, file_sha256, target_entity, total_rows, valid_rows, error_rows, status, imported_by) VALUES
('45000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BATCH-2026-11-01', 'danh_sach_cong_dan_gia_dinh_a.xlsx', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'MASTER_SUBJECTS', 25, 23, 2, 'COMMITTED', 'c0000000-0000-0000-0000-000000000002'),
('45000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'BATCH-B-2026-10', 'danh_sach_nghe_nhan_gia_dinh_b.xlsx', 'f4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afb', 'CULTURAL_TITLES', 12, 12, 0, 'COMMITTED', 'c0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Table 17: import_row_exceptions
INSERT INTO import_row_exceptions (id, tenant_id, batch_id, row_number, raw_data, error_code, error_message, is_resolved) VALUES
('46000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '45000000-0000-0000-0000-000000000001', 14, '{"fullName": "Lê Văn T", "cccd": "019082001122", "hamlet": "Xóm Chợ"}'::jsonb, 'EX_IDENTITY_MISMATCH', 'Trùng số CCCD với công dân đã tồn tại trong CSDL', true),
('46000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '45000000-0000-0000-0000-000000000001', 19, '{"fullName": "Phạm Văn K", "cccd": "019", "hamlet": "Xóm A2"}'::jsonb, 'EX_VALUE_OUT_OF_RANGE', 'Số CCCD không đủ 12 chữ số theo quy chuẩn', false)
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 10. REPORT SNAPSHOTS (Báo cáo Oracle DEM-R01..R05 & Khóa bất biến)
-- --------------------------------------------------------------------
INSERT INTO report_snapshots (id, tenant_id, code, title, period, indicators_data, signed_by, signed_at, sha256_hash, status) VALUES
('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DEM-R-OCT-2026-A', 'Báo cáo Chỉ tiêu Văn hóa Xã Giả định A Tháng 10/2026', 'Tháng 10/2026', '{"met01": 3, "met02": 1, "met03": "50.0%", "met04": "60%", "met05": 2}'::jsonb, 'c0000000-0000-0000-0000-000000000001', '2026-10-31T16:30:00Z', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'LOCKED_IMMUTABLE'),
('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'DEM-R-OCT-2026-B', 'Báo cáo Chỉ tiêu Văn hóa Xã Giả định B Tháng 10/2026', 'Tháng 10/2026', '{"met01": 2, "met02": 0, "met03": "100%", "met04": "N/A", "met05": 0}'::jsonb, 'c0000000-0000-0000-0000-000000000003', '2026-10-31T09:00:00Z', 'b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855aaa', 'LOCKED_IMMUTABLE')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------
-- 11. AUDIT LOGS (Nhật ký kiểm toán hệ thống ban đầu)
-- --------------------------------------------------------------------
INSERT INTO audit_logs (id, tenant_id, profile_id, persona_code, action, entity_type, entity_id, details, ip_address) VALUES
('60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'P2', 'SYSTEM_INITIALIZE_GOLDEN_SEED', 'SYSTEM', 'SYS-INIT', '{"message": "Khởi tạo môi trường dữ liệu thực nghiệm Golden Seed v1.0 cho Xã A (Giả định A) và Xã B (Giả định B)"}'::jsonb, '127.0.0.1'),
('60000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'P2', 'UPDATE_TASK_STATUS', 'TASK', 'TASK-A-002', '{"message": "Hoàn thành nhiệm vụ lập danh sách BTXH tháng 11/2026"}'::jsonb, '127.0.0.1'),
('60000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'P1', 'SIGN_SNAPSHOT_ORACLE', 'REPORT', 'DEM-R-OCT-2026-A', '{"message": "Ký số ban hành báo cáo chỉ tiêu Oracle Rev 1 tháng 10/2026 (Khóa bất biến SHA-256)"}'::jsonb, '192.168.1.10'),
('60000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'P6', 'CREATE_FIELD_INSPECTION', 'INSPECTION', 'INS-001', '{"message": "Lập biên bản kiểm tra thực địa PCCC tại Nhà văn hóa Xóm A1"}'::jsonb, '192.168.1.22'),
('60000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'P2', 'APPROVE_CULTURAL_TITLE', 'CULTURAL_TITLE', 'GĐVH-2026-001', '{"message": "Phê duyệt hồ sơ bình xét GĐVH hộ Hoàng Văn Nam (95 điểm, Bước VH8)"}'::jsonb, '192.168.1.15'),
('60000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'P3', 'SYNC_COMMUNITY_DATA', 'SHARED_DATA', 'SYNC-B-01', '{"message": "Đồng bộ danh mục nghệ nhân và cơ sở văn hóa trà Xóm B1"}'::jsonb, '192.168.2.14')
ON CONFLICT DO NOTHING;
