-- ==============================================================================
-- Migration: 20261108000004_m07_ethnicity_faith.sql
-- Description: M07 Ethnicity & Faith Domain Schema (Religious Establishments, Events, Reputable Persons).
-- Authoritative Sources: ORIGINAL_REQUEST.md, MASTER_PLAN PH05, ADR-001, ADR-002
-- ==============================================================================

-- 1. Table: religious_establishments
CREATE TABLE IF NOT EXISTS public.religious_establishments (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  religion_type text NOT NULL DEFAULT 'PHAT_GIAO',
  representative_name text NOT NULL,
  hamlet_id text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  follower_count int NOT NULL DEFAULT 0,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_religious_establishments PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_religious_establishments UNIQUE (tenant_id, id),
  CONSTRAINT chk_establishment_status CHECK (status IN ('ACTIVE', 'PENDING_REGISTRATION', 'UNDER_REVIEW'))
);

-- 2. Table: religious_events
CREATE TABLE IF NOT EXISTS public.religious_events (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  title text NOT NULL,
  event_date date NOT NULL,
  expected_attendees int NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'CHO_TIEP_NHAN',
  rejection_reason text NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_religious_events PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_religious_events UNIQUE (tenant_id, id),
  CONSTRAINT chk_event_status CHECK (status IN ('CHO_TIEP_NHAN', 'DA_TIEP_NHAN', 'TU_CHOI')),
  CONSTRAINT fk_events_establishment 
    FOREIGN KEY (tenant_id, establishment_id) 
    REFERENCES public.religious_establishments(tenant_id, id) ON DELETE CASCADE
);

-- 3. Table: reputable_persons
CREATE TABLE IF NOT EXISTS public.reputable_persons (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  ethnic_group text NOT NULL DEFAULT 'TAY',
  hamlet_id text NOT NULL,
  year_recognized int NOT NULL DEFAULT 2024,
  policy_status text NOT NULL DEFAULT 'DANG_HUONG',
  monthly_allowance numeric NOT NULL DEFAULT 800000,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_reputable_persons PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_reputable_persons UNIQUE (tenant_id, id),
  CONSTRAINT chk_policy_status CHECK (policy_status IN ('DANG_HUONG', 'TAM_DUNG', 'THAY_THE'))
);

-- 4. Enable & Force Row Level Security
ALTER TABLE public.religious_establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religious_establishments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.religious_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religious_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reputable_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputable_persons FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.religious_establishments FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.religious_events FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.reputable_persons FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.religious_establishments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.religious_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reputable_persons TO authenticated;

-- RLS Policies
CREATE POLICY religious_establishments_select ON public.religious_establishments
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY religious_events_select ON public.religious_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY reputable_persons_select ON public.reputable_persons
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- 5. Seed initial demo data for M07
INSERT INTO public.religious_establishments (
  tenant_id, id, code, name, religion_type, representative_name, hamlet_id, address, status, follower_count
) VALUES 
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'CS-TN-01', 'Chùa Giả Định A', 'PHAT_GIAO', 'Thích Đạo Tâm', 'A1', 'Xóm A1, Xã Giả Định A', 'ACTIVE', 320),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'CS-TN-02', 'Điểm nhóm Tin Lành Xóm A2', 'TIN_LANH', 'Hoàng Văn Sùng', 'A2', 'Xóm A2, Xã Giả Định A', 'ACTIVE', 85)
ON CONFLICT (tenant_id, id) DO NOTHING;

INSERT INTO public.reputable_persons (
  tenant_id, id, full_name, ethnic_group, hamlet_id, year_recognized, policy_status, monthly_allowance
) VALUES
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'Ma Văn Thắng', 'TAY', 'A1', 2023, 'DANG_HUONG', 800000),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 'Dương Văn Bình', 'DAO', 'A2', 2024, 'DANG_HUONG', 800000)
ON CONFLICT (tenant_id, id) DO NOTHING;
