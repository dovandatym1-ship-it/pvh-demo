-- ==============================================================================
-- Migration: 20261108000003_m04_culture_and_reporting.sql
-- Description: Culture Family Evaluation (DEM-VH), Immutable Report Snapshots (DEM-R01),
--              and Asynchronous System Jobs Engine.
-- Authoritative Sources: ORIGINAL_REQUEST.md §R4, ADR-002, S3-02, S3-03, S3-05, S3-07, Gate G3
-- ==============================================================================

-- 1. Table: rule_packs (Versioned evaluation criteria pack)
CREATE TABLE IF NOT EXISTS public.rule_packs (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ACTIVE',
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_rule_packs PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_rule_packs UNIQUE (tenant_id, id),
  CONSTRAINT uq_rule_packs_code_version UNIQUE (tenant_id, code, version),
  CONSTRAINT chk_rule_packs_status CHECK (status IN ('ACTIVE', 'MINH_HOA', 'ARCHIVED'))
);

-- 2. Table: rule_pack_criteria
CREATE TABLE IF NOT EXISTS public.rule_pack_criteria (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_pack_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  max_points numeric NOT NULL DEFAULT 100,
  threshold_points numeric NOT NULL DEFAULT 85,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_rule_pack_criteria PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_rule_pack_criteria UNIQUE (tenant_id, id),
  CONSTRAINT uq_criteria_code UNIQUE (tenant_id, rule_pack_id, code),
  CONSTRAINT chk_criteria_points CHECK (max_points > 0 AND threshold_points >= 0 AND threshold_points <= max_points),
  CONSTRAINT fk_criteria_rule_pack 
    FOREIGN KEY (tenant_id, rule_pack_id) 
    REFERENCES public.rule_packs(tenant_id, id) ON DELETE CASCADE
);

-- 3. Table: campaigns (Annual assessment rounds)
CREATE TABLE IF NOT EXISTS public.campaigns (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_pack_id uuid NOT NULL,
  year int NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_campaigns PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_campaigns UNIQUE (tenant_id, id),
  CONSTRAINT chk_campaigns_status CHECK (status IN ('OPEN', 'CLOSED', 'FINALIZED')),
  CONSTRAINT fk_campaigns_rule_pack 
    FOREIGN KEY (tenant_id, rule_pack_id) 
    REFERENCES public.rule_packs(tenant_id, id) ON DELETE RESTRICT
);

-- 4. Table: submissions (Cultural evaluation dossiers)
CREATE TABLE IF NOT EXISTS public.submissions (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  rule_pack_id uuid NOT NULL,
  rule_pack_version int NOT NULL DEFAULT 1,
  household_id text NOT NULL,
  household_head_name text NOT NULL,
  hamlet_id text NOT NULL,
  submission_type text NOT NULL DEFAULT 'GIA_DINH_VAN_HOA',
  status text NOT NULL DEFAULT 'CHO_RA_SOAT',
  score numeric NOT NULL DEFAULT 0,
  has_evidence boolean NOT NULL DEFAULT false,
  reviewer_comment text NULL,
  evidence_path text NULL,
  criteria_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text NULL,
  version int NOT NULL DEFAULT 1,
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_submissions PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_submissions UNIQUE (tenant_id, id),
  CONSTRAINT uq_submissions_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT chk_submissions_status CHECK (
    status IN ('DAT', 'KHONG_DAT', 'THIEU_MINH_CHUNG', 'CHO_RA_SOAT', 'YEU_CAU_BO_SUNG')
  ),
  CONSTRAINT chk_submission_dat_requires_evidence CHECK (status != 'DAT' OR has_evidence = true),
  CONSTRAINT chk_submission_supplementation_comment CHECK (status != 'YEU_CAU_BO_SUNG' OR (reviewer_comment IS NOT NULL AND trim(reviewer_comment) != '')),
  CONSTRAINT fk_submissions_campaign 
    FOREIGN KEY (tenant_id, campaign_id) 
    REFERENCES public.campaigns(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_submissions_rule_pack 
    FOREIGN KEY (tenant_id, rule_pack_id) 
    REFERENCES public.rule_packs(tenant_id, id) ON DELETE RESTRICT
);

-- 5. Table: report_snapshots (Immutable snapshots with sha256 checksum)
CREATE TABLE IF NOT EXISTS public.report_snapshots (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_code text NOT NULL,
  title text NOT NULL,
  period text NOT NULL,
  year int NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  payload jsonb NOT NULL,
  sha256 text NOT NULL,
  watermark text NOT NULL DEFAULT '[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]',
  is_finalized boolean NOT NULL DEFAULT false,
  idempotency_key text NULL,
  version int NOT NULL DEFAULT 1,
  finalized_at timestamptz NULL,
  finalized_by uuid NULL REFERENCES auth.users(id),
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_report_snapshots PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_report_snapshots UNIQUE (tenant_id, id),
  CONSTRAINT uq_report_snapshots_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT chk_report_snapshots_status CHECK (status IN ('DRAFT', 'FINALIZED'))
);

-- 6. Table: report_snapshot_lineage
CREATE TABLE IF NOT EXISTS public.report_snapshot_lineage (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  source_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_report_snapshot_lineage PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_report_snapshot_lineage UNIQUE (tenant_id, id),
  CONSTRAINT fk_lineage_snapshot 
    FOREIGN KEY (tenant_id, snapshot_id) 
    REFERENCES public.report_snapshots(tenant_id, id) ON DELETE CASCADE
);

-- 7. Table: system_jobs (Background job queue engine)
CREATE TABLE IF NOT EXISTS public.system_jobs (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  idempotency_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  receipt jsonb NULL,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_system_jobs PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_system_jobs UNIQUE (tenant_id, id),
  CONSTRAINT uq_system_jobs_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT chk_system_jobs_status CHECK (status IN ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- 8. Enable & Force Row Level Security on all Sprint 3 tables
ALTER TABLE public.rule_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_packs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rule_pack_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_pack_criteria FORCE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshot_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshot_lineage FORCE ROW LEVEL SECURITY;
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_jobs FORCE ROW LEVEL SECURITY;

-- Revoke anon access
REVOKE ALL ON TABLE public.rule_packs FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.rule_pack_criteria FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.campaigns FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.submissions FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.report_snapshots FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.report_snapshot_lineage FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.system_jobs FROM anon, PUBLIC;

-- Immutability on finalized report_snapshots: REVOKE UPDATE, DELETE on finalized records
REVOKE UPDATE, DELETE ON TABLE public.report_snapshots FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON TABLE public.report_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rule_packs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rule_pack_criteria TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.report_snapshot_lineage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_jobs TO authenticated;

-- RLS Policies: SELECT
CREATE POLICY rule_packs_select ON public.rule_packs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY rule_pack_criteria_select ON public.rule_pack_criteria
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY submissions_select ON public.submissions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY report_snapshots_select ON public.report_snapshots
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY report_snapshot_lineage_select ON public.report_snapshot_lineage
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY system_jobs_select ON public.system_jobs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- RLS Policies: INSERT & UPDATE
CREATE POLICY submissions_insert ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm04:culture:evaluate') OR app.has_permission(tenant_id, 'm04:propose_title') OR app.has_permission(tenant_id, 'm04:full'))
  );

CREATE POLICY submissions_update ON public.submissions
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm04:culture:evaluate') OR app.has_permission(tenant_id, 'm04:full'))
  )
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm04:culture:evaluate') OR app.has_permission(tenant_id, 'm04:full'))
  );

CREATE POLICY campaigns_insert ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm04:full') OR app.has_permission(tenant_id, 'm04:culture:evaluate'))
  );

CREATE POLICY campaigns_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm04:full') OR app.has_permission(tenant_id, 'm04:culture:evaluate'))
  )
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm04:full') OR app.has_permission(tenant_id, 'm04:culture:evaluate'))
  );

CREATE POLICY report_snapshots_insert ON public.report_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm09:draft') OR app.has_permission(tenant_id, 'm09:snapshot:sign') OR app.has_permission(tenant_id, 'm09:sign_snapshot') OR app.has_permission(tenant_id, 'm09:view') OR app.has_permission(tenant_id, 'm09:report:read'))
  );

CREATE POLICY report_snapshot_lineage_insert ON public.report_snapshot_lineage
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY system_jobs_insert ON public.system_jobs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY system_jobs_update ON public.system_jobs
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT app.user_tenant_ids()));

-- 9. Trigger for Finalized Report Snapshot Immutability Defense
CREATE OR REPLACE FUNCTION app.enforce_snapshot_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'FINALIZED' OR OLD.is_finalized = true THEN
    RAISE EXCEPTION 'Finalized report snapshot is immutable and cannot be updated or deleted';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_snapshot_immutable ON public.report_snapshots;
CREATE TRIGGER trg_report_snapshot_immutable
  BEFORE UPDATE OR DELETE ON public.report_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION app.enforce_snapshot_immutability();

-- 10. RPC: finalize_report_snapshot with SHA256 computation
CREATE OR REPLACE FUNCTION app.finalize_report_snapshot(
  p_snapshot_id uuid,
  p_canonical_payload jsonb,
  p_sha256 text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_sha256 text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  SELECT tenant_id INTO v_tenant_id
    FROM public.report_snapshots
   WHERE id = p_snapshot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  -- Permission check: accepts both m09:snapshot:sign and m09:sign_snapshot
  IF NOT (SELECT app.has_permission(v_tenant_id, 'm09:snapshot:sign') OR app.has_permission(v_tenant_id, 'm09:sign_snapshot')) THEN
    RAISE EXCEPTION 'FORBIDDEN: User lacks permission to finalize snapshot';
  END IF;

  -- Harmonize sha256: use verified RFC 8785 canonical hash passed from Node.js if valid 64-char hex,
  -- else compute fallback using extensions.digest
  IF p_sha256 IS NOT NULL AND p_sha256 ~ '^[a-f0-9]{64}$' THEN
    v_sha256 := p_sha256;
  ELSE
    v_sha256 := encode(extensions.digest(p_canonical_payload::text, 'sha256'), 'hex');
  END IF;

  UPDATE public.report_snapshots
     SET payload = p_canonical_payload,
         sha256 = v_sha256,
         status = 'FINALIZED',
         is_finalized = true,
         finalized_at = now(),
         finalized_by = v_user_id,
         updated_at = now(),
         updated_by = v_user_id
   WHERE id = p_snapshot_id
     AND tenant_id = v_tenant_id;

  -- Insert audit log if table exists
  INSERT INTO public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, payload, details)
  VALUES (
    v_tenant_id,
    v_user_id,
    'FINALIZE_REPORT_SNAPSHOT',
    'report_snapshots',
    p_snapshot_id::text,
    p_canonical_payload,
    jsonb_build_object('sha256', v_sha256)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'id', p_snapshot_id,
    'sha256', v_sha256,
    'status', 'FINALIZED'
  );
END;
$$;

-- 11. RPC: create_report_snapshot (atomic snapshot creation)
CREATE OR REPLACE FUNCTION app.create_report_snapshot(
  p_report_code text,
  p_title text,
  p_period text,
  p_year int,
  p_payload jsonb,
  p_idempotency_key text DEFAULT NULL,
  p_status text DEFAULT 'DRAFT'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_snapshot_id uuid;
  v_sha256 text;
  v_existing record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  SELECT app.user_tenant_ids() INTO v_tenant_id LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: User has no active tenant context';
  END IF;

  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
      FROM public.report_snapshots
     WHERE tenant_id = v_tenant_id
       AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true,
        'id', v_existing.id,
        'sha256', v_existing.sha256,
        'status', v_existing.status,
        'is_finalized', v_existing.is_finalized,
        'cached', true
      );
    END IF;
  END IF;

  v_snapshot_id := gen_random_uuid();
  IF p_status = 'FINALIZED' THEN
    v_sha256 := encode(extensions.digest(p_payload::text, 'sha256'), 'hex');
    INSERT INTO public.report_snapshots (
      id, tenant_id, report_code, title, period, year, status,
      payload, sha256, is_finalized, idempotency_key, finalized_at, finalized_by, created_by
    ) VALUES (
      v_snapshot_id, v_tenant_id, p_report_code, p_title, p_period, p_year, 'FINALIZED',
      p_payload, v_sha256, true, p_idempotency_key, now(), v_user_id, v_user_id
    );
  ELSE
    v_sha256 := 'PENDING';
    INSERT INTO public.report_snapshots (
      id, tenant_id, report_code, title, period, year, status,
      payload, sha256, is_finalized, idempotency_key, created_by
    ) VALUES (
      v_snapshot_id, v_tenant_id, p_report_code, p_title, p_period, p_year, 'DRAFT',
      p_payload, v_sha256, false, p_idempotency_key, v_user_id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_snapshot_id,
    'sha256', v_sha256,
    'status', p_status
  );
END;
$$;

-- 12. RPC: finalize_campaign
CREATE OR REPLACE FUNCTION app.finalize_campaign(
  p_campaign_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  SELECT tenant_id INTO v_tenant_id
    FROM public.campaigns
   WHERE id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  IF NOT (SELECT app.has_permission(v_tenant_id, 'm04:full') OR app.has_permission(v_tenant_id, 'm04:culture:evaluate')) THEN
    RAISE EXCEPTION 'FORBIDDEN: User lacks permission to finalize campaign';
  END IF;

  UPDATE public.campaigns
     SET status = 'FINALIZED',
         updated_at = now(),
         updated_by = v_user_id
   WHERE id = p_campaign_id
     AND tenant_id = v_tenant_id;

  RETURN jsonb_build_object('ok', true, 'id', p_campaign_id, 'status', 'FINALIZED');
END;
$$;

-- 13. RPC: Claim next job using FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION app.claim_next_system_job(
  p_worker_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_job record;
BEGIN
  SELECT *
    INTO v_job
    FROM public.system_jobs
   WHERE status IN ('PENDING', 'QUEUED')
     AND attempts < max_attempts
   ORDER BY created_at ASC
   LIMIT 1
     FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'NO_JOB_AVAILABLE');
  END IF;

  UPDATE public.system_jobs
     SET status = 'PROCESSING',
         attempts = attempts + 1,
         updated_at = now()
   WHERE id = v_job.id;

  RETURN jsonb_build_object(
    'ok', true,
    'job_id', v_job.id,
    'job_type', v_job.job_type,
    'payload', v_job.payload,
    'attempts', v_job.attempts + 1
  );
END;
$$;

-- 14. RPC: complete_system_job
CREATE OR REPLACE FUNCTION app.complete_system_job(
  p_job_id uuid,
  p_receipt jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.system_jobs
     SET status = 'COMPLETED',
         receipt = p_receipt,
         updated_at = now()
   WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  RETURN jsonb_build_object('ok', true, 'job_id', p_job_id, 'status', 'COMPLETED');
END;
$$;

-- 15. RPC: fail_system_job
CREATE OR REPLACE FUNCTION app.fail_system_job(
  p_job_id uuid,
  p_error text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.system_jobs
     SET status = 'FAILED',
         error_message = p_error,
         updated_at = now()
   WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  RETURN jsonb_build_object('ok', true, 'job_id', p_job_id, 'status', 'FAILED');
END;
$$;
