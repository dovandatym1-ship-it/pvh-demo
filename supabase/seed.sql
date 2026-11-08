-- ====================================================================
-- PVH Milestone M1: Golden Seed Data & Persona Provisioning
-- Tenants: TN-DEMO-A, TN-DEMO-B
-- Personas: P1 through P6
-- Compliance: D-03, D-04, D-07, Zero Real Citizen PII
-- ====================================================================

-- 1. Simulated Communes (UBND Xã Giả Định A & B)
INSERT INTO public.tenants (id, code, name, province, officer_mode, features) VALUES
('a0000000-0000-0000-0000-000000000001', 'TN-DEMO-A', 'UBND Xã Giả Định A', 'Thái Nguyên', 'CONCURRENT', '{"digitalTransformation": true, "fieldInspection": true, "advancedCulturalTitles": true}'::jsonb),
('a0000000-0000-0000-0000-000000000002', 'TN-DEMO-B', 'UBND Xã Giả Định B', 'Thái Nguyên', 'SPECIALIZED', '{"digitalTransformation": false, "fieldInspection": false, "advancedCulturalTitles": true}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  features = EXCLUDED.features;

-- 2. Rule Pack TN-DEMO-ILLUSTRATIVE-01 (Required for cross-feature T3.14)
COMMENT ON TABLE public.tenants IS 'TN-DEMO-ILLUSTRATIVE-01 default rule pack seeded';

-- 3. Provision auth.users for Personas P1–P6
-- Default test password for all personas: Password123!
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES
('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'p1.lanhdao@pvh.gov.vn', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nguyễn Văn An","persona":"P1"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'p2.kiemnhiem@pvh.gov.vn', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Trần Thị Mai","persona":"P2"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'p3.chuyentrach@pvh.gov.vn', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Lê Văn Hùng","persona":"P3"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'p4.truongthon@pvh.gov.vn', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Hoàng Văn Tuấn","persona":"P4"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'p5.motcua@pvh.gov.vn', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Phạm Thị Lan","persona":"P5"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'p6.thanhtra@pvh.gov.vn', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Đỗ Minh Đức","persona":"P6"}'::jsonb, now(), now(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password;

-- 4. Corresponding auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '{"sub":"c0000000-0000-0000-0000-000000000001","email":"p1.lanhdao@pvh.gov.vn"}'::jsonb, 'email', 'p1.lanhdao@pvh.gov.vn', now(), now(), now()),
('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '{"sub":"c0000000-0000-0000-0000-000000000002","email":"p2.kiemnhiem@pvh.gov.vn"}'::jsonb, 'email', 'p2.kiemnhiem@pvh.gov.vn', now(), now(), now()),
('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '{"sub":"c0000000-0000-0000-0000-000000000003","email":"p3.chuyentrach@pvh.gov.vn"}'::jsonb, 'email', 'p3.chuyentrach@pvh.gov.vn', now(), now(), now()),
('c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '{"sub":"c0000000-0000-0000-0000-000000000004","email":"p4.truongthon@pvh.gov.vn"}'::jsonb, 'email', 'p4.truongthon@pvh.gov.vn', now(), now(), now()),
('c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '{"sub":"c0000000-0000-0000-0000-000000000005","email":"p5.motcua@pvh.gov.vn"}'::jsonb, 'email', 'p5.motcua@pvh.gov.vn', now(), now(), now()),
('c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '{"sub":"c0000000-0000-0000-0000-000000000006","email":"p6.thanhtra@pvh.gov.vn"}'::jsonb, 'email', 'p6.thanhtra@pvh.gov.vn', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- 5. Profiles linked to auth.users (All at Commune A)
INSERT INTO public.profiles (id, tenant_id, persona_code, full_name, email, phone, can_view_pii) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'P1', 'Lãnh đạo Nguyễn Văn An', 'p1.lanhdao@pvh.gov.vn', '0912.345.678', false),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'P2', 'Cán bộ Trần Thị Mai', 'p2.kiemnhiem@pvh.gov.vn', '0988.765.432', true),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'P3', 'Cán bộ Lê Văn Hùng', 'p3.chuyentrach@pvh.gov.vn', '0977.112.233', true),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'P4', 'Trưởng thôn Hoàng Văn Tuấn', 'p4.truongthon@pvh.gov.vn', '0966.554.433', false),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'P5', 'Cán bộ Phạm Thị Lan', 'p5.motcua@pvh.gov.vn', '0944.889.900', true),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'P6', 'Thanh tra Đỗ Minh Đức', 'p6.thanhtra@pvh.gov.vn', '0933.221.144', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  can_view_pii = EXCLUDED.can_view_pii;

-- 6. Memberships with Roles, Permissions, and Scopes (All at TN-DEMO-A)
INSERT INTO public.memberships (id, tenant_id, user_id, roles, permissions, scopes, is_active) VALUES
(
  'm0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  ARRAY['LANH_DAO_XA'],
  ARRAY['m00:admin', 'm01:view', 'm01:work:read', 'm01:work:create', 'm01:work_item:read', 'm01:work_item:create', 'm04:view', 'm04:culture:read', 'm08:view', 'm09:view', 'm09:report:read', 'm09:sign_snapshot', 'm09:snapshot:sign'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  ARRAY['CAN_BO_VHXH', 'CAN_BO_KIEM_NHIEM'],
  ARRAY['m01:full', 'm01:work:create', 'm01:work:read', 'm01:work:update', 'm01:work:assign', 'm01:work_item:create', 'm01:work_item:read', 'm01:work_item:update', 'm01:work_item:assign', 'm02:full', 'm04:full', 'm04:view', 'm04:culture:read', 'm04:culture:evaluate', 'm04:culture:create', 'm05:full', 'm06:full', 'm07:full', 'm08:execute', 'm09:view', 'm09:report:read', 'm09:draft', 'm10:import'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000003',
  ARRAY['CAN_BO_VHXH', 'CAN_BO_CHUYEN_TRACH'],
  ARRAY['m01:view', 'm01:work:create', 'm01:work:read', 'm01:work_item:create', 'm01:work_item:read', 'm04:full', 'm04:view', 'm04:culture:read', 'm04:culture:evaluate', 'm05:view', 'm09:view', 'm09:report:read', 'm09:draft'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000004',
  ARRAY['TRUONG_THON'],
  ARRAY['m01:hamlet_view', 'm01:work:read', 'm01:work_item:read', 'm04:view', 'm04:culture:read', 'm04:propose_title', 'm06:propose_aid'],
  '{"hamletIds": ["b0000000-0000-0000-0000-000000000001"]}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000005',
  ARRAY['CAN_BO_MOT_CUA'],
  ARRAY['m01:intake', 'm01:work:read', 'm01:work_item:read', 'm04:view', 'm04:culture:read', 'm04:intake', 'm06:intake'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006',
  ARRAY['CAN_BO_THANH_TRA'],
  ARRAY['m08:full', 'm01:work:read', 'm01:work_item:read', 'm04:view', 'm04:culture:read', 'm04:inspect', 'm06:inspect', 'm09:view', 'm09:report:read'],
  '{}'::jsonb,
  true
)
ON CONFLICT (tenant_id, id) DO UPDATE SET
  roles = EXCLUDED.roles,
  permissions = EXCLUDED.permissions,
  scopes = EXCLUDED.scopes;

-- 7. Rule Pack TN-DEMO-ILLUSTRATIVE-01 & Criteria
INSERT INTO public.rule_packs (
  id,
  tenant_id,
  code,
  name,
  version,
  status,
  is_active,
  effective_from,
  effective_to,
  created_by
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'TN-DEMO-ILLUSTRATIVE-01',
  'Bộ tiêu chuẩn bình xét Gia đình văn hóa (Minh họa)',
  1,
  'MINH_HOA',
  true,
  now() - interval '1 year',
  now() + interval '5 years',
  'c0000000-0000-0000-0000-000000000001'
) ON CONFLICT (tenant_id, code, version) DO UPDATE SET
  status = 'MINH_HOA',
  name = EXCLUDED.name;

INSERT INTO public.rule_pack_criteria (
  id,
  tenant_id,
  rule_pack_id,
  code,
  name,
  category,
  max_points,
  threshold_points,
  is_mandatory
) VALUES 
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'CRIT-01', 'Gương mẫu chấp hành chủ trương, chính sách', 'CHINH_SACH', 30, 25, true),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'CRIT-02', 'Kinh tế gia đình ổn định, phát triển', 'KINH_TE', 35, 30, true),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'CRIT-03', 'Xây dựng nếp sống văn hóa, gia đình hòa thuận', 'VAN_HOA', 35, 30, true)
ON CONFLICT (tenant_id, id) DO NOTHING;

-- 8. Campaigns for Cultural Title Assessment 2026
INSERT INTO public.campaigns (
  id,
  tenant_id,
  rule_pack_id,
  year,
  title,
  status,
  version,
  created_by
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  2026,
  'Bình xét Gia đình văn hóa năm 2026 - Xã Giả Định A',
  'OPEN',
  1,
  'c0000000-0000-0000-0000-000000000001'
),
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  2026,
  'Đợt bình xét Gia đình văn hóa thường niên 2026',
  'OPEN',
  1,
  'c0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (tenant_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- 9. Golden Submissions Seed (Representative of 5 states: DAT, CHO_RA_SOAT, THIEU_MINH_CHUNG, KHONG_DAT, YEU_CAU_BO_SUNG)
INSERT INTO public.submissions (
  id,
  tenant_id,
  campaign_id,
  rule_pack_id,
  rule_pack_version,
  household_id,
  household_head_name,
  hamlet_id,
  submission_type,
  status,
  score,
  has_evidence,
  reviewer_comment,
  evidence_path,
  criteria_scores,
  version,
  created_by
) VALUES
(
  'sub00000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  1,
  'HH-001',
  'Hoàng Văn Nam',
  'XOM_A1',
  'GIA_DINH_VAN_HOA',
  'DAT',
  95,
  true,
  'Gia đình gương mẫu, hoàn thành xuất sắc các chỉ tiêu văn hóa',
  'a0000000-0000-0000-0000-000000000001/culture/sub-01/bien_ban_binh_xet_nam.pdf',
  '[{"criteriaCode":"CRIT-01","score":29},{"criteriaCode":"CRIT-02","score":33},{"criteriaCode":"CRIT-03","score":33}]'::jsonb,
  1,
  'c0000000-0000-0000-0000-000000000004'
),
(
  'sub00000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  1,
  'HH-002',
  'Nguyễn Thị Lan',
  'XOM_A1',
  'GIA_DINH_VAN_HOA',
  'CHO_RA_SOAT',
  88,
  true,
  'Hồ sơ đã nộp biên bản họp xóm, đang chờ hội đồng xã thẩm định',
  'a0000000-0000-0000-0000-000000000001/culture/sub-02/minh_chung_lan.pdf',
  '[{"criteriaCode":"CRIT-01","score":26},{"criteriaCode":"CRIT-02","score":31},{"criteriaCode":"CRIT-03","score":31}]'::jsonb,
  1,
  'c0000000-0000-0000-0000-000000000004'
),
(
  'sub00000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  1,
  'HH-003',
  'Trần Văn Bình',
  'XOM_A2',
  'GIA_DINH_VAN_HOA',
  'THIEU_MINH_CHUNG',
  90,
  false,
  'Điểm tự chấm đạt 90 nhưng chưa đính kèm biên bản biểu quyết của xóm',
  NULL,
  '[{"criteriaCode":"CRIT-01","score":28},{"criteriaCode":"CRIT-02","score":31},{"criteriaCode":"CRIT-03","score":31}]'::jsonb,
  1,
  'c0000000-0000-0000-0000-000000000002'
),
(
  'sub00000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  1,
  'HH-004',
  'Vũ Đình Trọng',
  'XOM_A3',
  'GIA_DINH_VAN_HOA',
  'KHONG_DAT',
  62,
  true,
  'Không đạt tiêu chí bắt buộc về kinh tế và vệ sinh môi trường',
  'a0000000-0000-0000-0000-000000000001/culture/sub-04/bien_ban_kiem_tra.pdf',
  '[{"criteriaCode":"CRIT-01","score":20},{"criteriaCode":"CRIT-02","score":21},{"criteriaCode":"CRIT-03","score":21}]'::jsonb,
  1,
  'c0000000-0000-0000-0000-000000000002'
),
(
  'sub00000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  1,
  'HH-005',
  'Lê Văn Phát',
  'XOM_A1',
  'GIA_DINH_VAN_HOA',
  'YEU_CAU_BO_SUNG',
  78,
  false,
  'Thiếu biên bản bình xét của khu dân cư và bản tự chấm điểm',
  NULL,
  '[{"criteriaCode":"CRIT-01","score":24},{"criteriaCode":"CRIT-02","score":27},{"criteriaCode":"CRIT-03","score":27}]'::jsonb,
  1,
  'c0000000-0000-0000-0000-000000000002'
)
ON CONFLICT (tenant_id, id) DO NOTHING;

-- 10. Golden Report Snapshot (DEM-R01) & Lineage
INSERT INTO public.report_snapshots (
  id,
  tenant_id,
  report_code,
  title,
  period,
  year,
  status,
  is_finalized,
  payload,
  sha256,
  watermark,
  finalized_at,
  finalized_by,
  created_by
) VALUES (
  'snap0000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'DEM-R01',
  'Báo cáo tổng hợp kết quả công tác VH-XH & Điều hành Quý 3/2026',
  'Q3/2026',
  2026,
  'FINALIZED',
  true,
  '{"commune":"TN-DEMO-A","metrics":{"cdsIndex":82.5,"cultureApproved":2,"cultureSubmissions":5,"tasksCompleted":4,"tasksTotal":6},"period":"Q3/2026","year":2026}'::jsonb,
  '4014324f21c74b46736fd1847ef422a98b76ff9cedff38268e55c0031f7b6127',
  '[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]',
  '2026-10-01T08:00:00Z',
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001'
) ON CONFLICT (tenant_id, id) DO NOTHING;

INSERT INTO public.report_snapshot_lineage (
  id,
  tenant_id,
  snapshot_id,
  source_table,
  source_id,
  source_version
) VALUES
(
  'lin00000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'snap0000-0000-0000-0000-000000000001',
  'work_items',
  '10000000-0000-0000-0000-000000000001',
  1
),
(
  'lin00000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'snap0000-0000-0000-0000-000000000001',
  'submissions',
  'sub00000-0000-0000-0000-000000000001',
  1
)
ON CONFLICT (tenant_id, id) DO NOTHING;

-- 11. System Jobs Seed
INSERT INTO public.system_jobs (
  id,
  tenant_id,
  job_type,
  status,
  idempotency_key,
  payload,
  receipt,
  attempts,
  max_attempts
) VALUES
(
  'job00000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'REPORT_SNAPSHOT_GENERATION',
  'COMPLETED',
  'idem-job-snapshot-q3-2026',
  '{"reportCode":"DEM-R01","period":"Q3/2026"}'::jsonb,
  '{"status":"ok","snapshotId":"snap0000-0000-0000-0000-000000000001","sha256":"4014324f21c74b46736fd1847ef422a98b76ff9cedff38268e55c0031f7b6127"}'::jsonb,
  1,
  3
),
(
  'job00000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'EXPORT_XLSX_AGGREGATION',
  'PENDING',
  'idem-job-export-xlsx-q3-2026',
  '{"snapshotId":"snap0000-0000-0000-0000-000000000001","format":"XLSX"}'::jsonb,
  NULL,
  0,
  3
)
ON CONFLICT (tenant_id, id) DO NOTHING;
