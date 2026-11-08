-- ====================================================================
-- PVH Milestone M1: Foundation Schema, RLS, Audit & RPC
-- Architecture: ADR-001, ADR-002 (§7, §8), Decisions D-02..D-12
-- Target: PostgreSQL 15+ (Supabase Local & Cloud)
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Create Application Schema
CREATE SCHEMA IF NOT EXISTS app;

-- --------------------------------------------------------------------
-- 3. CORE TABLES DEFINITION
-- --------------------------------------------------------------------

-- 3.1. Tenants (Đơn vị hành chính cấp xã mô phỏng: TN-DEMO-A, TN-DEMO-B)
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  province text NOT NULL DEFAULT 'Thái Nguyên',
  officer_mode text NOT NULL DEFAULT 'CONCURRENT', -- 'CONCURRENT' | 'SPECIALIZED'
  features jsonb NOT NULL DEFAULT '{"digitalTransformation": true, "fieldInspection": true, "advancedCulturalTitles": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_tenants_id UNIQUE (id)
);

-- 3.2. Profiles (Hồ sơ cán bộ liên kết 1:1 với auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  persona_code text NOT NULL, -- 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'
  full_name text NOT NULL,
  email text,
  phone text,
  can_view_pii boolean NOT NULL DEFAULT false,
  version int NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_profiles_tenant_id UNIQUE (tenant_id, id)
);

-- 3.3. Memberships (Tư cách thành viên công tác theo xã, vai trò và phạm vi)
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  roles text[] NOT NULL DEFAULT '{}',
  permissions text[] NOT NULL DEFAULT '{}',
  scopes jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT pk_memberships PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_memberships_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_memberships_tenant_user UNIQUE (tenant_id, user_id)
);

-- 3.4. Work Items (Thực thể công việc nghiệp vụ lõi M01)
CREATE TABLE IF NOT EXISTS public.work_items (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'CHUNG',
  priority text NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  status text NOT NULL DEFAULT 'NEW',     -- 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'RETURNED', 'CANCELLED'
  assigned_to uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  due_date timestamptz,
  hamlet_id uuid,
  version int NOT NULL DEFAULT 1 CHECK (version >= 1),
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT pk_work_items PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_work_items_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT uq_work_items_idempotency UNIQUE (tenant_id, idempotency_key)
);

-- 3.5. Work Item Events (Sổ sự kiện chuyển đổi trạng thái công việc)
CREATE TABLE IF NOT EXISTS public.work_item_events (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  work_item_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason text,
  payload jsonb DEFAULT '{}'::jsonb,
  version int NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT pk_work_item_events PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_work_item_events_tenant_id UNIQUE (tenant_id, id),
  CONSTRAINT fk_events_work_item FOREIGN KEY (tenant_id, work_item_id)
    REFERENCES work_items(tenant_id, id) ON DELETE RESTRICT
);

-- 3.6. Audit Log (Vết kiểm toán bất biến append-only)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_audit_log PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_audit_log_tenant_id UNIQUE (tenant_id, id)
);

-- --------------------------------------------------------------------
-- 4. APP SCHEMA HELPER FUNCTIONS
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.tenant_id
  FROM public.memberships m
  WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND (m.valid_to IS NULL OR m.valid_to > now())
    AND m.valid_from <= now();
$$;

CREATE OR REPLACE FUNCTION app.has_permission(p_tenant_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.tenant_id = p_tenant_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
      AND (m.valid_to IS NULL OR m.valid_to > now())
      AND m.valid_from <= now()
      AND (
        p_permission = ANY(m.permissions)
        OR 'm00:admin' = ANY(m.permissions)
        OR 'all' = ANY(m.permissions)
        OR 'LANH_DAO_XA' = ANY(m.roles)
        OR (p_permission LIKE 'm01:%' AND ('m01:full' = ANY(m.permissions) OR 'm01:view' = ANY(m.permissions)))
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION app.user_tenant_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.user_tenant_ids() TO authenticated;

REVOKE EXECUTE ON FUNCTION app.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.has_permission(uuid, text) TO authenticated;

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) ENFORCEMENT & DENY-BY-DEFAULT
-- --------------------------------------------------------------------

-- Enable and force RLS on all public tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tenants FROM anon, PUBLIC;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM anon, PUBLIC;

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.memberships FROM anon, PUBLIC;

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.work_items FROM anon, PUBLIC;

ALTER TABLE public.work_item_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.work_item_events FROM anon, PUBLIC;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit_log FROM anon, PUBLIC;

-- Append-only restriction on audit_log
REVOKE DELETE ON public.audit_log FROM authenticated, anon, PUBLIC;
REVOKE UPDATE, TRUNCATE ON public.audit_log FROM authenticated, anon, PUBLIC;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;

-- Grant standard permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_item_events TO authenticated;

-- Policies for tenants
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT app.user_tenant_ids()));

-- Policies for profiles
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- Policies for memberships
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

-- Policies for work_items
CREATE POLICY work_items_select ON public.work_items
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (
      app.has_permission(tenant_id, 'm01:work:read')
      OR app.has_permission(tenant_id, 'm01:work_item:read')
    )
  );

CREATE POLICY work_items_insert ON public.work_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (
      app.has_permission(tenant_id, 'm01:work:create')
      OR app.has_permission(tenant_id, 'm01:work_item:create')
    )
  );

CREATE POLICY work_items_update ON public.work_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (
      app.has_permission(tenant_id, 'm01:work:update')
      OR app.has_permission(tenant_id, 'm01:work_item:update')
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (
      app.has_permission(tenant_id, 'm01:work:update')
      OR app.has_permission(tenant_id, 'm01:work_item:update')
    )
  );

CREATE POLICY work_items_delete ON public.work_items
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (
      app.has_permission(tenant_id, 'm01:work:delete')
      OR app.has_permission(tenant_id, 'm01:work_item:delete')
    )
  );

-- Policies for work_item_events
CREATE POLICY work_item_events_select ON public.work_item_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY work_item_events_insert ON public.work_item_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT app.user_tenant_ids()));

-- Policies for audit_log
CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT app.user_tenant_ids()));

CREATE POLICY audit_log_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT app.user_tenant_ids()));

-- --------------------------------------------------------------------
-- 6. SINGLE-TRANSACTION RPC: app.create_work_item
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.create_work_item(
  p_idempotency_key text,
  p_title text,
  p_description text DEFAULT NULL,
  p_priority text DEFAULT 'MEDIUM',
  p_assigned_to uuid DEFAULT NULL,
  p_due_date timestamptz DEFAULT NULL,
  p_category text DEFAULT 'CHUNG',
  p_hamlet_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_tenant_id uuid;
  v_existing jsonb;
  v_new_work_item public.work_items%ROWTYPE;
BEGIN
  -- 1. Actor check via auth.uid()
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- 2. Resolve and validate tenant_id
  v_tenant_id := COALESCE(p_tenant_id, (SELECT app.user_tenant_ids() LIMIT 1));
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: No active tenant membership' USING ERRCODE = '42501';
  END IF;

  -- 3. Check authorization via app.has_permission
  IF NOT (
    app.has_permission(v_tenant_id, 'm01:work:create')
    OR app.has_permission(v_tenant_id, 'm01:work_item:create')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to create work item' USING ERRCODE = '42501';
  END IF;

  -- 4. Idempotency check: (tenant_id, idempotency_key)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT to_jsonb(w) || jsonb_build_object('cached', true)
    INTO v_existing
    FROM public.work_items w
    WHERE w.tenant_id = v_tenant_id
      AND w.idempotency_key = p_idempotency_key;

    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  END IF;

  -- 5. Insert into work_items with version = 1
  INSERT INTO public.work_items (
    tenant_id,
    title,
    description,
    priority,
    category,
    assigned_to,
    due_date,
    hamlet_id,
    version,
    idempotency_key,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    p_title,
    p_description,
    COALESCE(p_priority, 'MEDIUM'),
    COALESCE(p_category, 'CHUNG'),
    p_assigned_to,
    p_due_date,
    p_hamlet_id,
    1,
    p_idempotency_key,
    v_actor_id,
    v_actor_id
  )
  RETURNING * INTO v_new_work_item;

  -- 6. Insert into work_item_events
  INSERT INTO public.work_item_events (
    tenant_id,
    work_item_id,
    from_status,
    to_status,
    actor_id,
    reason,
    payload,
    version,
    created_by
  ) VALUES (
    v_tenant_id,
    v_new_work_item.id,
    NULL,
    v_new_work_item.status,
    v_actor_id,
    'Khởi tạo công việc',
    jsonb_build_object('title', p_title, 'priority', v_new_work_item.priority, 'idempotency_key', p_idempotency_key),
    1,
    v_actor_id
  );

  -- 7. Insert into audit_log (atomic transaction mandate)
  INSERT INTO public.audit_log (
    tenant_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    payload,
    details
  ) VALUES (
    v_tenant_id,
    v_actor_id,
    'CREATE_WORK_ITEM',
    'work_item',
    v_new_work_item.id::text,
    jsonb_build_object('title', p_title, 'priority', v_new_work_item.priority, 'idempotency_key', p_idempotency_key),
    jsonb_build_object('title', p_title, 'priority', v_new_work_item.priority, 'idempotency_key', p_idempotency_key)
  );

  -- 8. Return created work item
  RETURN to_jsonb(v_new_work_item);
END;
$$;

REVOKE EXECUTE ON FUNCTION app.create_work_item FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.create_work_item TO authenticated;

-- --------------------------------------------------------------------
-- 7. PRIVATE STORAGE: evidence bucket & RLS
-- --------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET public = false;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;

CREATE POLICY evidence_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1]::uuid IN (SELECT app.user_tenant_ids())
  );

CREATE POLICY evidence_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1]::uuid IN (SELECT app.user_tenant_ids())
  );
