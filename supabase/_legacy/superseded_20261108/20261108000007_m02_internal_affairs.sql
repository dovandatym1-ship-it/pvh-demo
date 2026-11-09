-- ==============================================================================
-- Migration: 20261108000007_m02_internal_affairs.sql
-- Description: M02 Internal Affairs, Labor & Meritorious People Domain Schema
-- Authoritative Sources: ORIGINAL_REQUEST.md, MASTER_PLAN PH05, ADR-001, ADR-002
-- ==============================================================================

-- 1. Table: ncc_beneficiaries (Người có công & Thi đua khen thưởng)
CREATE TABLE IF NOT EXISTS public.ncc_beneficiaries (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  full_name text NOT NULL,
  cccd text NULL,
  hamlet_id text NOT NULL,
  category text NOT NULL,
  medal_title text NOT NULL,
  monthly_allowance numeric NOT NULL DEFAULT 0,
  has_deduplication_flag boolean NOT NULL DEFAULT false,
  deduplication_warning text NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_ncc_beneficiaries PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_ncc_beneficiaries UNIQUE (tenant_id, id),
  CONSTRAINT chk_ncc_category CHECK (category IN ('THUONG_BINH', 'LIET_SI', 'BENH_BINH', 'CHAT_DOC_HOA_HOC', 'BA_ME_VNAH')),
  CONSTRAINT chk_ncc_status CHECK (status IN ('ACTIVE', 'REVIEW_PENDING'))
);

-- 2. Table: labor_contracts (Theo dõi tiền lương tối thiểu & BHXH cơ sở)
CREATE TABLE IF NOT EXISTS public.labor_contracts (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  tax_code text NOT NULL,
  total_workers int NOT NULL DEFAULT 0,
  min_wage_paid numeric NOT NULL DEFAULT 0,
  regional_min_wage numeric NOT NULL DEFAULT 3450000,
  is_under_min_wage boolean NOT NULL DEFAULT false,
  seasonal_workers_count int NOT NULL DEFAULT 0,
  bhxh_registered_count int NOT NULL DEFAULT 0,
  evaluation_period text NOT NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_labor_contracts PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_labor_contracts UNIQUE (tenant_id, id)
);

-- 3. Table: labor_disputes (Hòa giải tranh chấp lao động cơ sở)
CREATE TABLE IF NOT EXISTS public.labor_disputes (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  requester_name text NOT NULL,
  requester_role text NOT NULL,
  respondent_name text NOT NULL,
  dispute_content text NOT NULL,
  dispute_type text NOT NULL,
  received_date date NOT NULL,
  status text NOT NULL DEFAULT 'RECEIVED',
  outcome_summary text NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_labor_disputes PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_labor_disputes UNIQUE (tenant_id, id),
  CONSTRAINT chk_requester_role CHECK (requester_role IN ('EMPLOYEE', 'EMPLOYER', 'COLLECTIVE')),
  CONSTRAINT chk_dispute_type CHECK (dispute_type IN ('INDIVIDUAL', 'COLLECTIVE')),
  CONSTRAINT chk_dispute_status CHECK (status IN ('RECEIVED', 'SCHEDULED', 'RESOLVED_SUCCESS', 'RESOLVED_FAILED', 'ESCALATED_DISTRICT'))
);

-- 4. Enable & Force Row Level Security (Deny-by-default)
ALTER TABLE public.ncc_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncc_beneficiaries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.labor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_contracts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.labor_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_disputes FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ncc_beneficiaries FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.labor_contracts FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.labor_disputes FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ncc_beneficiaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.labor_contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.labor_disputes TO authenticated;

-- RLS Policies
CREATE POLICY ncc_beneficiaries_select ON public.ncc_beneficiaries
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY labor_contracts_select ON public.labor_contracts
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY labor_disputes_select ON public.labor_disputes
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- 5. RPC: app.resolve_labor_dispute
CREATE OR REPLACE FUNCTION app.resolve_labor_dispute(
  p_tenant_id uuid,
  p_dispute_id uuid,
  p_status text,
  p_outcome text,
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
  v_dispute record;
BEGIN
  v_user_id := app.current_user_id();

  IF NOT (p_tenant_id IN (SELECT app.user_tenant_ids())) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Tenant access forbidden'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_dispute
  FROM public.labor_disputes
  WHERE tenant_id = p_tenant_id AND id = p_dispute_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Labor dispute record not found'
      USING ERRCODE = 'P0002';
  END IF;

  v_old_status := v_dispute.status;

  UPDATE public.labor_disputes
  SET status = p_status,
      outcome_summary = p_outcome,
      version = version + 1,
      updated_at = now()
  WHERE tenant_id = p_tenant_id AND id = p_dispute_id;

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
    'm02.labor_dispute.resolve',
    'labor_dispute',
    p_dispute_id,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_status,
      'outcome_summary', p_outcome,
      'dispute_code', v_dispute.code
    ),
    p_idempotency_key
  );

  RETURN jsonb_build_object(
    'success', true,
    'dispute_id', p_dispute_id,
    'status', p_status
  );
END;
$$;

-- 6. Seed initial demo data for M02 in TN-DEMO-A
INSERT INTO public.ncc_beneficiaries (
  tenant_id, id, code, full_name, cccd, hamlet_id, category, medal_title, monthly_allowance, has_deduplication_flag, status
) VALUES 
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'NCC-TN-01', 'Nguyễn Văn Thành', '019058001122', 'A1', 'THUONG_BINH', 'Huân chương Kháng chiến Hạng Ba', 2850000, false, 'ACTIVE'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'NCC-TN-02', 'Mẹ Việt Nam AH Lê Thị Lan', '019035003344', 'A2', 'BA_ME_VNAH', 'Danh hiệu Bà Mẹ VNAH', 4850000, false, 'ACTIVE'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'NCC-TN-03', 'Hoàng Văn Thái', '019062005566', 'A3', 'BENH_BINH', 'Huy chương Chiến sĩ vẻ vang', 2150000, false, 'ACTIVE');

INSERT INTO public.labor_contracts (
  tenant_id, id, business_name, tax_code, total_workers, min_wage_paid, regional_min_wage, is_under_min_wage, seasonal_workers_count, bhxh_registered_count, evaluation_period
) VALUES
('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'HTX Nông nghiệp Xanh Giả Định A', '4600123456', 28, 4200000, 3450000, false, 6, 22, 'Q3/2026'),
('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Xưởng chế biến chè Gia Định - Xóm A1', '4600654321', 14, 3800000, 3450000, false, 4, 10, 'Q3/2026');

INSERT INTO public.labor_disputes (
  tenant_id, id, code, requester_name, requester_role, respondent_name, dispute_content, dispute_type, received_date, status, outcome_summary
) VALUES
('a0000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'TC-2026-001', 'Đỗ Văn Minh', 'EMPLOYEE', 'Xưởng chè Gia Định', 'Tranh chấp tiền lương làm thêm giờ vụ thu hoạch', 'INDIVIDUAL', '2026-10-12', 'RESOLVED_SUCCESS', 'Hai bên thống nhất thanh toán đủ 1.800.000đ tiền làm thêm giờ.');
