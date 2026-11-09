-- ==============================================================================
-- Migration: 20261108000005_m06_health_social.sql
-- Description: M06 Health & Social Protection Domain Schema
-- Authoritative Sources: ORIGINAL_REQUEST.md, MASTER_PLAN PH05, ADR-001, ADR-002
-- ==============================================================================

-- 1. Table: social_protection_beneficiaries
CREATE TABLE IF NOT EXISTS public.social_protection_beneficiaries (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  full_name text NOT NULL,
  cccd text NOT NULL,
  phone text NULL,
  hamlet_id text NOT NULL,
  aid_category text NOT NULL,
  monthly_amount numeric NOT NULL DEFAULT 540000,
  diagnosis text NULL,
  payment_status text NOT NULL DEFAULT 'PENDING',
  health_insurance_provided boolean NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_social_protection_beneficiaries PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_social_protection_beneficiaries UNIQUE (tenant_id, id),
  CONSTRAINT chk_beneficiary_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'SUSPENDED'))
);

-- 2. Table: food_safety_inspections
CREATE TABLE IF NOT EXISTS public.food_safety_inspections (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  facility_name text NOT NULL,
  inspection_type text NOT NULL,
  inspection_date date NOT NULL,
  total_score int NOT NULL DEFAULT 100,
  sample_retention_24h_passed boolean NOT NULL DEFAULT true,
  conclusion text NOT NULL DEFAULT 'PASSED',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_food_safety_inspections PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_food_safety_inspections UNIQUE (tenant_id, id),
  CONSTRAINT chk_inspection_type CHECK (inspection_type IN ('STREET_FOOD', 'SCHOOL_CANTEEN', 'ARTISAN_PRODUCER')),
  CONSTRAINT chk_inspection_conclusion CHECK (conclusion IN ('PASSED', 'WARNING_REMEDIAL', 'FAILED_SUSPEND'))
);

-- 3. Table: medical_facilities
CREATE TABLE IF NOT EXISTS public.medical_facilities (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  facility_name text NOT NULL,
  facility_sub_type text NOT NULL,
  practitioner_name text NOT NULL,
  license_number text NOT NULL,
  license_issue_date date NOT NULL,
  gpp_certified boolean NOT NULL DEFAULT false,
  controlled_drugs_ledger boolean NOT NULL DEFAULT false,
  inspection_status text NOT NULL DEFAULT 'NORMAL',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_medical_facilities PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_medical_facilities UNIQUE (tenant_id, id),
  CONSTRAINT chk_facility_sub_type CHECK (facility_sub_type IN ('TRADITIONAL_CLINIC', 'SPECIALIZED_CLINIC', 'DRUG_STORE')),
  CONSTRAINT chk_inspection_status CHECK (inspection_status IN ('NORMAL', 'WARNING'))
);

-- 4. Table: epidemic_logs
CREATE TABLE IF NOT EXISTS public.epidemic_logs (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hamlet_id text NOT NULL,
  disease_group text NOT NULL,
  disease_name text NOT NULL,
  cases_count int NOT NULL DEFAULT 0,
  hospitalized_count int NOT NULL DEFAULT 0,
  deaths_count int NOT NULL DEFAULT 0,
  outbreak_alert_flag boolean NOT NULL DEFAULT false,
  log_week int NOT NULL,
  log_year int NOT NULL,
  reported_date date NOT NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_epidemic_logs PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_epidemic_logs UNIQUE (tenant_id, id),
  CONSTRAINT chk_disease_group CHECK (disease_group IN ('GROUP_A', 'GROUP_B', 'GROUP_C'))
);

-- 5. Enable & Force Row Level Security (Deny-by-default)
ALTER TABLE public.social_protection_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_protection_beneficiaries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.food_safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_safety_inspections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.medical_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_facilities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.epidemic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epidemic_logs FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.social_protection_beneficiaries FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.food_safety_inspections FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.medical_facilities FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.epidemic_logs FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.social_protection_beneficiaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.food_safety_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.medical_facilities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.epidemic_logs TO authenticated;

-- RLS Policies
CREATE POLICY social_protection_beneficiaries_select ON public.social_protection_beneficiaries
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY food_safety_inspections_select ON public.food_safety_inspections
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY medical_facilities_select ON public.medical_facilities
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY epidemic_logs_select ON public.epidemic_logs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- 6. RPC: app.record_social_aid_payment
CREATE OR REPLACE FUNCTION app.record_social_aid_payment(
  p_tenant_id uuid,
  p_beneficiary_id uuid,
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
  v_new_status text := 'PAID';
  v_beneficiary record;
BEGIN
  v_user_id := app.current_user_id();

  IF NOT (p_tenant_id IN (SELECT app.user_tenant_ids())) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Tenant access forbidden'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_beneficiary
  FROM public.social_protection_beneficiaries
  WHERE tenant_id = p_tenant_id AND id = p_beneficiary_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Beneficiary not found'
      USING ERRCODE = 'P0002';
  END IF;

  v_old_status := v_beneficiary.payment_status;

  UPDATE public.social_protection_beneficiaries
  SET payment_status = v_new_status,
      version = version + 1,
      updated_at = now()
  WHERE tenant_id = p_tenant_id AND id = p_beneficiary_id;

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
    'm06.beneficiary.record_payment',
    'social_protection_beneficiary',
    p_beneficiary_id,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', v_new_status,
      'beneficiary_name', v_beneficiary.full_name,
      'amount', v_beneficiary.monthly_amount
    ),
    p_idempotency_key
  );

  RETURN jsonb_build_object(
    'success', true,
    'beneficiary_id', p_beneficiary_id,
    'payment_status', v_new_status
  );
END;
$$;

-- 7. Seed initial demo data for M06 in TN-DEMO-A
INSERT INTO public.social_protection_beneficiaries (
  tenant_id, id, code, full_name, cccd, phone, hamlet_id, aid_category, monthly_amount, diagnosis, payment_status, health_insurance_provided
) VALUES 
('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BT-TN-01', 'Nguyễn Thị Mùi', '019156001234', '0912345678', 'A1', 'Người cao tuổi đơn thân', 540000, 'Suy tim độ 2, cao huyết áp', 'PAID', true),
('a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'BT-TN-02', 'Trần Văn Hùng', '019082005678', '0987654321', 'A2', 'Khuyết tật vận động nặng', 720000, 'Liệt nửa người sau tai biến', 'PENDING', true),
('a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'BT-TN-03', 'Lê Thị Sen', '019163009876', '0934567890', 'A3', 'Hộ nghèo có người bệnh nặng', 540000, 'Thận mạn giai đoạn 3', 'PENDING', true);

INSERT INTO public.food_safety_inspections (
  tenant_id, id, facility_name, inspection_type, inspection_date, total_score, sample_retention_24h_passed, conclusion
) VALUES
('a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Bếp ăn Trường Mầm non Xã A', 'SCHOOL_CANTEEN', '2026-10-15', 96, true, 'PASSED'),
('a0000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'Cơ sở bánh mỳ Anh Tuấn - Xóm A1', 'STREET_FOOD', '2026-10-20', 78, false, 'WARNING_REMEDIAL');

INSERT INTO public.medical_facilities (
  tenant_id, id, facility_name, facility_sub_type, practitioner_name, license_number, license_issue_date, gpp_certified, controlled_drugs_ledger, inspection_status
) VALUES
('a0000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 'Nhà thuốc số 1 Xóm A1', 'DRUG_STORE', 'Dược sĩ Nguyễn Thị Thoa', 'GPP-2023-889', '2023-05-10', true, true, 'NORMAL'),
('a0000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', 'Phòng chẩn trị Y học cổ truyền Lương y Đức', 'TRADITIONAL_CLINIC', 'Lương y Vũ Văn Đức', 'YHCT-2022-104', '2022-08-15', false, false, 'WARNING');

INSERT INTO public.epidemic_logs (
  tenant_id, id, hamlet_id, disease_group, disease_name, cases_count, hospitalized_count, deaths_count, outbreak_alert_flag, log_week, log_year, reported_date
) VALUES
('a0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'A1', 'GROUP_B', 'Sốt xuất huyết Dengue', 3, 1, 0, false, 44, 2026, '2026-11-02'),
('a0000000-0000-0000-0000-000000000002', 'e3000000-0000-0000-0000-000000000002', 'A2', 'GROUP_B', 'Cúm mùa', 12, 0, 0, false, 44, 2026, '2026-11-03');
