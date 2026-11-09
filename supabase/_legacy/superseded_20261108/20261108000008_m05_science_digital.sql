-- ==============================================================================
-- Migration: 20261108000008_m05_science_digital.sql
-- Description: M05 Science & Digital Transformation Domain Schema
-- Authoritative Sources: ORIGINAL_REQUEST.md, MASTER_PLAN PH05, ADR-001, ADR-002
-- ==============================================================================

-- 1. Table: digital_indicators (Bộ 6 chỉ tiêu CĐS cơ sở)
CREATE TABLE IF NOT EXISTS public.digital_indicators (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  numeric_value numeric NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  is_confirmed_zero boolean NOT NULL DEFAULT false,
  na_reason text NULL,
  meaning text NOT NULL,
  evaluation_period text NOT NULL DEFAULT 'T10/2026',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_digital_indicators PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_digital_indicators UNIQUE (tenant_id, id),
  CONSTRAINT uq_digital_indicators_code_period UNIQUE (tenant_id, code, evaluation_period),
  CONSTRAINT chk_indicator_status CHECK (
    status IN ('CONFIRMED_ZERO', 'CONFIRMED', 'UNCONFIRMED', 'MISSING', 'NOT_APPLICABLE')
  )
);

-- 2. Table: community_digital_teams (Tổ công nghệ số cộng đồng xóm/thôn)
CREATE TABLE IF NOT EXISTS public.community_digital_teams (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hamlet_id text NOT NULL,
  leader_name text NOT NULL,
  leader_phone text NULL,
  member_count int NOT NULL DEFAULT 5,
  citizens_supported int NOT NULL DEFAULT 0,
  vneid_level2_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_community_digital_teams PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_community_digital_teams UNIQUE (tenant_id, id),
  CONSTRAINT chk_team_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- 3. Enable & Force Row Level Security (Deny-by-default)
ALTER TABLE public.digital_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_indicators FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_digital_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_digital_teams FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.digital_indicators FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.community_digital_teams FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.digital_indicators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_digital_teams TO authenticated;

-- RLS Policies
CREATE POLICY digital_indicators_select ON public.digital_indicators
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY community_digital_teams_select ON public.community_digital_teams
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- 4. RPC: app.update_digital_indicator_status
CREATE OR REPLACE FUNCTION app.update_digital_indicator_status(
  p_tenant_id uuid,
  p_indicator_id uuid,
  p_status text,
  p_value text,
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
  v_ind record;
BEGIN
  v_user_id := app.current_user_id();

  IF NOT (p_tenant_id IN (SELECT app.user_tenant_ids())) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Tenant access forbidden'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_ind
  FROM public.digital_indicators
  WHERE tenant_id = p_tenant_id AND id = p_indicator_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Digital indicator not found'
      USING ERRCODE = 'P0002';
  END IF;

  v_old_status := v_ind.status;

  UPDATE public.digital_indicators
  SET status = p_status,
      value = p_value,
      is_confirmed_zero = (p_status = 'CONFIRMED_ZERO'),
      version = version + 1,
      updated_at = now()
  WHERE tenant_id = p_tenant_id AND id = p_indicator_id;

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
    'm05.indicator.update_status',
    'digital_indicator',
    p_indicator_id,
    jsonb_build_object(
      'code', v_ind.code,
      'old_status', v_old_status,
      'new_status', p_status,
      'value', p_value
    ),
    p_idempotency_key
  );

  RETURN jsonb_build_object(
    'success', true,
    'indicator_id', p_indicator_id,
    'status', p_status
  );
END;
$$;

-- 5. Seed initial demo data for M05 in TN-DEMO-A
INSERT INTO public.digital_indicators (
  tenant_id, id, code, name, value, numeric_value, status, is_confirmed_zero, meaning, evaluation_period
) VALUES 
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CDS-01', 'Tỷ lệ TTHC phát sinh hồ sơ trực tuyến', '86.5%', 86.5, 'CONFIRMED', false, 'Hồ sơ TTHC toàn trình và một phần nộp qua Cổng DVC', 'T10/2026'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'CDS-02', 'Tỷ lệ người trưởng thành có định danh VNeID Mức 2', '92.4%', 92.4, 'CONFIRMED', false, 'Căn cước điện tử công dân kích hoạt mức 2 phục vụ Đề án 06', 'T10/2026'),
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'CDS-03', 'Sự cố mất an toàn thông tin cơ sở', '0 sự cố', 0, 'CONFIRMED_ZERO', true, 'Xác nhận không xảy ra sự cố lộ lọt hay tấn công mạng (Số 0 hợp lệ)', 'T10/2026'),
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'CDS-04', 'Tỷ lệ hộ sản xuất nông nghiệp lên sàn TMĐT', '65.0%', 65.0, 'CONFIRMED', false, 'Quảng bá và tiêu thụ nông sản (Chè Tân Cương giả định) qua sàn số', 'T10/2026'),
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'CDS-05', 'Tỷ lệ thôn/xóm có Tổ CNSCĐ hoạt động hiệu quả', '100%', 100, 'CONFIRMED', false, '3/3 xóm có tổ nòng cốt hỗ trợ người dân thao tác dịch vụ số', 'T10/2026'),
('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'CDS-06', 'Tỷ lệ thanh toán không dùng tiền mặt tại Một cửa', '78.2%', 78.2, 'CONFIRMED', false, 'Thu phí, lệ phí qua quét mã QR động VietQR / Napas', 'T10/2026');

INSERT INTO public.community_digital_teams (
  tenant_id, id, hamlet_id, leader_name, leader_phone, member_count, citizens_supported, vneid_level2_count, status
) VALUES
('a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A1', 'Nguyễn Thị Hương', '0912111222', 6, 280, 260, 'ACTIVE'),
('a0000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'A2', 'Trần Văn Mạnh', '0913222333', 5, 230, 215, 'ACTIVE'),
('a0000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'A3', 'Lê Hữu Phúc', '0914333444', 5, 195, 180, 'ACTIVE');
