-- ==============================================================================
-- Migration: 20261108000009_m08_inspections.sql
-- Description: M08 Inspections & Remediation Domain Schema (DEM-KT)
-- Authoritative Sources: ORIGINAL_REQUEST.md, MASTER_PLAN PH06, ADR-001, ADR-002
-- ==============================================================================

-- 1. Table: inspection_records (Biên bản kiểm tra liên ngành cơ sở)
CREATE TABLE IF NOT EXISTS public.inspection_records (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  target_name text NOT NULL,
  category text NOT NULL,
  hamlet_id text NULL,
  inspector_name text NOT NULL,
  inspection_date date NOT NULL,
  findings_count int NOT NULL DEFAULT 0,
  remediation_status text NOT NULL DEFAULT 'NO_VIOLATION',
  remediation_deadline date NULL,
  notes text NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_inspection_records PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_inspection_records UNIQUE (tenant_id, id),
  CONSTRAINT chk_remediation_status CHECK (
    remediation_status IN ('NO_VIOLATION', 'PENDING', 'IN_PROGRESS', 'RESOLVED')
  )
);

-- 2. Table: inspection_recommendations (Kiến nghị khắc phục sau kiểm tra)
CREATE TABLE IF NOT EXISTS public.inspection_recommendations (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  facility_name text NOT NULL,
  hamlet_id text NOT NULL,
  assignee text NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'WAITING_OVERDUE',
  metric text NOT NULL DEFAULT 'MET-05',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_inspection_recommendations PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_inspection_recommendations UNIQUE (tenant_id, id),
  CONSTRAINT chk_rec_status CHECK (
    status IN ('WAITING_OVERDUE', 'FEEDBACK_UNVERIFIED', 'RESOLVED_CLOSED')
  ),
  CONSTRAINT fk_rec_inspection
    FOREIGN KEY (tenant_id, inspection_id)
    REFERENCES public.inspection_records(tenant_id, id) ON DELETE CASCADE
);

-- 3. Enable & Force Row Level Security (Deny-by-default)
ALTER TABLE public.inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_recommendations FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.inspection_records FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.inspection_recommendations FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inspection_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inspection_recommendations TO authenticated;

-- RLS Policies
CREATE POLICY inspection_records_select ON public.inspection_records
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY inspection_recommendations_select ON public.inspection_recommendations
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- 4. RPC: app.resolve_inspection_recommendation
CREATE OR REPLACE FUNCTION app.resolve_inspection_recommendation(
  p_tenant_id uuid,
  p_recommendation_id uuid,
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
  FROM public.inspection_recommendations
  WHERE tenant_id = p_tenant_id AND id = p_recommendation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Inspection recommendation not found'
      USING ERRCODE = 'P0002';
  END IF;

  v_old_status := v_rec.status;

  UPDATE public.inspection_recommendations
  SET status = p_status,
      version = version + 1,
      updated_at = now()
  WHERE tenant_id = p_tenant_id AND id = p_recommendation_id;

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
    'm08.recommendation.resolve',
    'inspection_recommendation',
    p_recommendation_id,
    jsonb_build_object(
      'code', v_rec.code,
      'facility_name', v_rec.facility_name,
      'old_status', v_old_status,
      'new_status', p_status
    ),
    p_idempotency_key
  );

  RETURN jsonb_build_object(
    'success', true,
    'recommendation_id', p_recommendation_id,
    'status', p_status
  );
END;
$$;

-- 5. Seed initial demo data for M08 in TN-DEMO-A
INSERT INTO public.inspection_records (
  tenant_id, id, code, target_name, category, hamlet_id, inspector_name, inspection_date, findings_count, remediation_status, remediation_deadline, notes
) VALUES 
('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'KT-2026-001', 'Cơ sở bánh mỳ Anh Tuấn', 'ATTP', 'A1', 'Đoàn kiểm tra liên ngành số 1', '2026-10-20', 1, 'IN_PROGRESS', '2026-11-15', 'Lưu mẫu thực phẩm chưa đủ 24 giờ theo quy chuẩn'),
('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002', 'KT-2026-002', 'Nhà văn hóa Xóm A2', 'PCCC', 'A2', 'Đoàn kiểm tra văn hóa - ANTT', '2026-10-22', 1, 'RESOLVED', '2026-11-05', 'Bình cứu hỏa hết hạn nạp sạc - đã bổ sung mới 2 bình bột'),
('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000003', 'KT-2026-003', 'Trường Mầm non Xã Giả Định A', 'ATTP', 'A1', 'Ban chỉ đạo VSATTP Xã', '2026-10-15', 0, 'NO_VIOLATION', NULL, 'Bếp ăn bán trú đạt chuẩn 3 bước, vệ sinh sạch sẽ');

INSERT INTO public.inspection_recommendations (
  tenant_id, id, inspection_id, code, title, facility_name, hamlet_id, assignee, due_date, status, metric
) VALUES
('a0000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'KN-01', 'Bổ sung tủ bảo quản lưu mẫu thực phẩm 24h', 'Cơ sở bánh mỳ Anh Tuấn', 'A1', 'Cán bộ Y tế - An sinh', '2026-11-15', 'WAITING_OVERDUE', 'MET-05'),
('a0000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 'KN-02', 'Trang bị lại 2 bình chữa cháy bột MFZ4', 'Nhà văn hóa Xóm A2', 'A2', 'Trưởng xóm A2', '2026-11-05', 'RESOLVED_CLOSED', 'MET-05');
