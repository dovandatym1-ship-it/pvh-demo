-- ==============================================================================
-- Migration: 20261108000006_m03_education.sql
-- Description: M03 Education Domain Schema (Schools, Private Facilities, Tuition Exemptions)
-- Authoritative Sources: ORIGINAL_REQUEST.md, MASTER_PLAN PH05, ADR-001, ADR-002
-- ==============================================================================

-- 1. Table: schools
CREATE TABLE IF NOT EXISTS public.schools (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL,
  principal text NOT NULL,
  total_students int NOT NULL DEFAULT 0,
  school_year text NOT NULL DEFAULT '2026-2027',
  universalization_standard text NOT NULL DEFAULT 'LEVEL_2',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_schools PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_schools UNIQUE (tenant_id, id),
  CONSTRAINT chk_school_level CHECK (level IN ('PRESCHOOL', 'PRIMARY', 'SECONDARY')),
  CONSTRAINT chk_universalization_standard CHECK (universalization_standard IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3'))
);

-- 2. Table: private_childcare_facilities
CREATE TABLE IF NOT EXISTS public.private_childcare_facilities (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  facility_type text NOT NULL,
  owner_name text NOT NULL,
  owner_cccd text NOT NULL,
  capacity int NOT NULL DEFAULT 15,
  current_enrolled int NOT NULL DEFAULT 10,
  total_area_sqm numeric NOT NULL DEFAULT 50.0,
  sqm_per_child numeric NOT NULL DEFAULT 2.5,
  fire_safety_certified boolean NOT NULL DEFAULT true,
  food_safety_certified boolean NOT NULL DEFAULT true,
  licensing_status text NOT NULL DEFAULT 'LICENSED',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_private_childcare_facilities PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_private_childcare_facilities UNIQUE (tenant_id, id),
  CONSTRAINT chk_facility_type CHECK (facility_type IN ('INDEPENDENT_NURSERY_GROUP', 'INDEPENDENT_KINDERGARTEN_CLASS')),
  CONSTRAINT chk_licensing_status CHECK (licensing_status IN ('LICENSED', 'PROBATION', 'SUSPENDED', 'DISSOLVED'))
);

-- 3. Table: tuition_exemptions
CREATE TABLE IF NOT EXISTS public.tuition_exemptions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  school_name text NOT NULL,
  grade text NOT NULL,
  category text NOT NULL,
  exemption_percent int NOT NULL DEFAULT 100,
  support_amount numeric NOT NULL DEFAULT 150000,
  status text NOT NULL DEFAULT 'APPROVED',
  semester text NOT NULL DEFAULT 'HK1_2026_2027',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_tuition_exemptions PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_tuition_exemptions UNIQUE (tenant_id, id),
  CONSTRAINT chk_exemption_category CHECK (category IN ('POOR_HOUSEHOLD', 'NEAR_POOR', 'DISABILITY', 'ORPHAN')),
  CONSTRAINT chk_exemption_status CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED'))
);

-- 4. Enable & Force Row Level Security (Deny-by-default)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools FORCE ROW LEVEL SECURITY;
ALTER TABLE public.private_childcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_childcare_facilities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_exemptions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.schools FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.private_childcare_facilities FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.tuition_exemptions FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.schools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.private_childcare_facilities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tuition_exemptions TO authenticated;

-- RLS Policies
CREATE POLICY schools_select ON public.schools
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY private_childcare_facilities_select ON public.private_childcare_facilities
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY tuition_exemptions_select ON public.tuition_exemptions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- 5. RPC: app.approve_tuition_exemption
CREATE OR REPLACE FUNCTION app.approve_tuition_exemption(
  p_tenant_id uuid,
  p_exemption_id uuid,
  p_status text,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_old_status text;
  v_rec record;
BEGIN
  v_user_id := app.current_user_id();

  IF NOT (p_tenant_id IN (SELECT app.user_tenant_ids())) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Tenant access forbidden'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_rec
  FROM public.tuition_exemptions
  WHERE tenant_id = p_tenant_id AND id = p_exemption_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Tuition exemption record not found'
      USING ERRCODE = 'P0002';
  END IF;

  v_old_status := v_rec.status;

  UPDATE public.tuition_exemptions
  SET status = p_status,
      version = version + 1,
      updated_at = now()
  WHERE tenant_id = p_tenant_id AND id = p_exemption_id;

  INSERT INTO public.audit_log (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    idempotency_key
  ) VALUES (
    p_tenant_id,
    v_user_id,
    'm03.exemption.status_transition',
    'tuition_exemption',
    p_exemption_id,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_status,
      'student_name', v_rec.student_name,
      'school_name', v_rec.school_name
    ),
    p_idempotency_key
  );

  RETURN jsonb_build_object(
    'success', true,
    'exemption_id', p_exemption_id,
    'status', p_status
  );
END;
$$;

-- 6. Seed initial demo data for M03 in TN-DEMO-A
INSERT INTO public.schools (
  tenant_id, id, name, level, principal, total_students, school_year, universalization_standard
) VALUES 
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Trường Mầm non Xã Giả Định A', 'PRESCHOOL', 'Nguyễn Thị Loan', 245, '2026-2027', 'LEVEL_2'),
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Trường Tiểu học Giả Định A', 'PRIMARY', 'Phạm Quốc Tuấn', 480, '2026-2027', 'LEVEL_3'),
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Trường THCS Giả Định A', 'SECONDARY', 'Vũ Thị Minh', 390, '2026-2027', 'LEVEL_2');

INSERT INTO public.private_childcare_facilities (
  tenant_id, id, name, facility_type, owner_name, owner_cccd, capacity, current_enrolled, total_area_sqm, sqm_per_child, fire_safety_certified, food_safety_certified, licensing_status
) VALUES
('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Nhóm trẻ Độc lập Hoa Sen - Xóm A1', 'INDEPENDENT_NURSERY_GROUP', 'Đặng Thu Hương', '019185002233', 18, 14, 62.0, 3.4, true, true, 'LICENSED'),
('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Lớp mẫu giáo tư thục Bình Minh - Xóm A2', 'INDEPENDENT_KINDERGARTEN_CLASS', 'Lê Thị Thuỷ', '019188004455', 25, 22, 75.0, 3.0, true, true, 'LICENSED');

INSERT INTO public.tuition_exemptions (
  tenant_id, id, student_name, school_name, grade, category, exemption_percent, support_amount, status, semester
) VALUES
('a0000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Trần Bảo An', 'Trường Mầm non Xã Giả Định A', 'Lớp Mẫu giáo lớn A1', 'POOR_HOUSEHOLD', 100, 150000, 'APPROVED', 'HK1_2026_2027'),
('a0000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002', 'Nguyễn Tiến Dũng', 'Trường Tiểu học Giả Định A', 'Lớp 3B', 'ORPHAN', 100, 150000, 'APPROVED', 'HK1_2026_2027'),
('a0000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000003', 'Hoàng Thị Mai', 'Trường THCS Giả Định A', 'Lớp 8A', 'NEAR_POOR', 50, 100000, 'PENDING', 'HK1_2026_2027');
