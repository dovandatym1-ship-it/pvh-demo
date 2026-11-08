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
  ARRAY['m00:admin', 'm01:view', 'm01:work:read', 'm01:work:create', 'm01:work_item:read', 'm01:work_item:create', 'm04:view', 'm08:view', 'm09:view', 'm09:sign_snapshot'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  ARRAY['CAN_BO_VHXH', 'CAN_BO_KIEM_NHIEM'],
  ARRAY['m01:full', 'm01:work:create', 'm01:work:read', 'm01:work:update', 'm01:work:assign', 'm01:work_item:create', 'm01:work_item:read', 'm01:work_item:update', 'm01:work_item:assign', 'm02:full', 'm04:full', 'm05:full', 'm06:full', 'm07:full', 'm08:execute', 'm09:draft', 'm10:import'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000003',
  ARRAY['CAN_BO_VHXH', 'CAN_BO_CHUYEN_TRACH'],
  ARRAY['m01:view', 'm01:work:create', 'm01:work:read', 'm01:work_item:create', 'm01:work_item:read', 'm04:full', 'm05:view', 'm09:draft'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000004',
  ARRAY['TRUONG_THON'],
  ARRAY['m01:hamlet_view', 'm01:work:read', 'm01:work_item:read', 'm04:propose_title', 'm06:propose_aid'],
  '{"hamletIds": ["b0000000-0000-0000-0000-000000000001"]}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000005',
  ARRAY['CAN_BO_MOT_CUA'],
  ARRAY['m01:intake', 'm01:work:read', 'm01:work_item:read', 'm04:intake', 'm06:intake'],
  '{}'::jsonb,
  true
),
(
  'm0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000006',
  ARRAY['CAN_BO_THANH_TRA'],
  ARRAY['m08:full', 'm01:work:read', 'm01:work_item:read', 'm04:inspect', 'm06:inspect', 'm09:view'],
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
  effective_to
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'TN-DEMO-ILLUSTRATIVE-01',
  'Bộ tiêu chuẩn bình xét Gia đình văn hóa (Minh họa)',
  1,
  'ACTIVE',
  true,
  now() - interval '1 year',
  now() + interval '5 years'
) ON CONFLICT (tenant_id, code, version) DO NOTHING;

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
