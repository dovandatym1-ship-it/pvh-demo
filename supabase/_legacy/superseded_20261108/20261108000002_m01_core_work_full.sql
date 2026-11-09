-- ==============================================================================
-- Migration: 20261108000002_m01_core_work_full.sql
-- Description: Full Work Items Schema, Assignments, Links, State Machine RPC with
--              atomic audit log and optimistic concurrency control (409 VERSION_CONFLICT).
-- Authoritative Sources: ORIGINAL_REQUEST.md §R3, ADR-002, S2-01, S2-02, Gate G2
-- ==============================================================================

-- 1. Alter work_items table if necessary to add priority and check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'work_items' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.work_items ADD COLUMN priority text NOT NULL DEFAULT 'NORMAL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'work_items' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE public.work_items ADD COLUMN due_date timestamptz NULL;
  END IF;
END $$;

-- Enforce check constraints on work_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_items_priority'
  ) THEN
    ALTER TABLE public.work_items 
      ADD CONSTRAINT chk_work_items_priority 
      CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_items_title_length'
  ) THEN
    ALTER TABLE public.work_items 
      ADD CONSTRAINT chk_work_items_title_length 
      CHECK (char_length(title) <= 500);
  END IF;
END $$;

-- 2. Create work_item_assignments table
CREATE TABLE IF NOT EXISTS public.work_item_assignments (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_item_id uuid NOT NULL,
  assignee_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  role text NOT NULL DEFAULT 'ASSIGNEE',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_work_item_assignments PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_work_item_assignments UNIQUE (tenant_id, id),
  CONSTRAINT fk_work_item_assignments_item 
    FOREIGN KEY (tenant_id, work_item_id) 
    REFERENCES public.work_items(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_work_item_assignments_profile 
    FOREIGN KEY (tenant_id, assignee_id) 
    REFERENCES public.profiles(tenant_id, id) ON DELETE RESTRICT
);

-- 3. Create work_item_links table
CREATE TABLE IF NOT EXISTS public.work_item_links (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  target_id uuid NOT NULL,
  link_type text NOT NULL DEFAULT 'RELATED',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_work_item_links PRIMARY KEY (tenant_id, id),
  CONSTRAINT uq_work_item_links UNIQUE (tenant_id, id),
  CONSTRAINT fk_work_item_links_source 
    FOREIGN KEY (tenant_id, source_id) 
    REFERENCES public.work_items(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_work_item_links_target 
    FOREIGN KEY (tenant_id, target_id) 
    REFERENCES public.work_items(tenant_id, id) ON DELETE CASCADE
);

-- 4. Enable & Force Row Level Security
ALTER TABLE public.work_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_links FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.work_item_assignments FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.work_item_links FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_item_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_item_links TO authenticated;

-- Policies for work_item_assignments
CREATE POLICY work_item_assignments_select ON public.work_item_assignments
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm01:work_item:read'))
  );

CREATE POLICY work_item_assignments_insert ON public.work_item_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm01:work_item:create'))
  );

-- Policies for work_item_links
CREATE POLICY work_item_links_select ON public.work_item_links
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm01:work_item:read'))
  );

CREATE POLICY work_item_links_insert ON public.work_item_links
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT app.user_tenant_ids())
    AND (SELECT app.has_permission(tenant_id, 'm01:work_item:create'))
  );

-- 5. State Machine Transition RPC: app.transition_work_item
CREATE OR REPLACE FUNCTION app.transition_work_item(
  p_id uuid,
  p_to_state text,
  p_expected_version int,
  p_idempotency_key text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_current_version int;
  v_current_status text;
  v_user_id uuid;
  v_new_version int;
  v_existing_audit_payload jsonb;
  v_allowed boolean := false;
BEGIN
  -- 1. Identify caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Must be logged in to transition work items';
  END IF;

  -- 2. Fetch current work item record
  SELECT tenant_id, version, status
    INTO v_tenant_id, v_current_version, v_current_status
    FROM public.work_items
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Work item % not found', p_id;
  END IF;

  -- 3. Verify tenant authorization
  IF NOT (v_tenant_id IN (SELECT app.user_tenant_ids())) THEN
    RAISE EXCEPTION 'FORBIDDEN: Access to tenant % is forbidden', v_tenant_id;
  END IF;

  -- 4. Idempotency Check: if already transitioned with this idempotency key for this work item and target state
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT payload INTO v_existing_audit_payload
      FROM public.audit_log
     WHERE tenant_id = v_tenant_id
       AND entity_id = p_id::text
       AND payload->>'idempotency_key' = p_idempotency_key
       AND (payload->>'to_status' = p_to_state OR payload->>'to_state' = p_to_state);

    IF v_existing_audit_payload IS NOT NULL THEN
      RETURN jsonb_build_object(
        'ok', true,
        'cached', true,
        'id', p_id,
        'status', COALESCE(v_existing_audit_payload->>'to_status', v_existing_audit_payload->>'to_state'),
        'version', (v_existing_audit_payload->>'version')::int
      );
    END IF;
  END IF;

  -- 5. Optimistic Concurrency Control: verify expected_version matches
  IF v_current_version <> p_expected_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, but current version is %', p_expected_version, v_current_version;
  END IF;

  -- 6. Validate State Transition Paths
  -- Allowed transitions:
  -- NEW -> ASSIGNED, IN_PROGRESS, CANCELLED
  -- ASSIGNED -> IN_PROGRESS, CANCELLED
  -- IN_PROGRESS -> UNDER_REVIEW, CANCELLED
  -- UNDER_REVIEW -> COMPLETED, RETURNED
  -- RETURNED -> IN_PROGRESS, CANCELLED
  IF v_current_status = 'NEW' AND p_to_state IN ('ASSIGNED', 'IN_PROGRESS', 'CANCELLED') THEN
    v_allowed := true;
  ELSIF v_current_status = 'ASSIGNED' AND p_to_state IN ('IN_PROGRESS', 'CANCELLED') THEN
    v_allowed := true;
  ELSIF v_current_status = 'IN_PROGRESS' AND p_to_state IN ('UNDER_REVIEW', 'CANCELLED') THEN
    v_allowed := true;
  ELSIF v_current_status = 'UNDER_REVIEW' AND p_to_state IN ('COMPLETED', 'RETURNED') THEN
    v_allowed := true;
  ELSIF v_current_status = 'RETURNED' AND p_to_state IN ('IN_PROGRESS', 'CANCELLED') THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot transition work item from % to %', v_current_status, p_to_state;
  END IF;

  -- 7. Specific Rule Validation & RBAC Authorization Checks
  -- When transitioning to RETURNED, reason is mandatory
  IF p_to_state = 'RETURNED' AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'VALIDATION: Reason is mandatory when returning work item for revision';
  END IF;

  -- When transitioning to COMPLETED, check for reviewer approval permission
  IF p_to_state = 'COMPLETED' THEN
    IF NOT (SELECT (app.has_permission(v_tenant_id, 'm01:work_item:approve') OR app.has_permission(v_tenant_id, 'm01:work:approve'))) THEN
      RAISE EXCEPTION 'FORBIDDEN: User lacks permission to approve and complete work items';
    END IF;
  END IF;

  -- When transitioning to RETURNED, check for reviewer approval permission
  IF p_to_state = 'RETURNED' THEN
    IF NOT (SELECT (app.has_permission(v_tenant_id, 'm01:work_item:approve') OR app.has_permission(v_tenant_id, 'm01:work:assign'))) THEN
      RAISE EXCEPTION 'FORBIDDEN: User lacks permission to return work items for revision';
    END IF;
  END IF;

  -- When transitioning to ASSIGNED, check for assign permission
  IF p_to_state = 'ASSIGNED' THEN
    IF NOT (SELECT (app.has_permission(v_tenant_id, 'm01:work_item:assign') OR app.has_permission(v_tenant_id, 'm01:work:assign'))) THEN
      RAISE EXCEPTION 'FORBIDDEN: User lacks permission to assign work items';
    END IF;
  END IF;

  -- When transitioning to CANCELLED, check for delete/cancel permission
  IF p_to_state = 'CANCELLED' THEN
    IF NOT (SELECT (app.has_permission(v_tenant_id, 'm01:work_item:delete') OR app.has_permission(v_tenant_id, 'm01:work:delete'))) THEN
      RAISE EXCEPTION 'FORBIDDEN: User lacks permission to cancel work items';
    END IF;
  END IF;

  -- 8. Increment version monotonically
  v_new_version := v_current_version + 1;

  -- 9. Atomic Update on work_items
  UPDATE public.work_items
     SET status = p_to_state,
         version = v_new_version,
         updated_at = now(),
         updated_by = v_user_id
   WHERE tenant_id = v_tenant_id
     AND id = p_id;

  -- 10. Record Event in work_item_events
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
    p_id,
    v_current_status,
    p_to_state,
    v_user_id,
    p_reason,
    jsonb_build_object(
      'event_type', 'STATE_TRANSITION',
      'from_status', v_current_status,
      'to_status', p_to_state,
      'version', v_new_version,
      'reason', p_reason,
      'idempotency_key', p_idempotency_key
    ),
    v_new_version,
    v_user_id
  );

  -- 11. Insert Audit Log (same transaction)
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
    v_user_id,
    'm01:work_item:transition',
    'work_items',
    p_id::text,
    jsonb_build_object(
      'from_status', v_current_status,
      'to_status', p_to_state,
      'version', v_new_version,
      'reason', p_reason,
      'idempotency_key', p_idempotency_key
    ),
    jsonb_build_object(
      'from_status', v_current_status,
      'to_status', p_to_state,
      'version', v_new_version,
      'reason', p_reason,
      'idempotency_key', p_idempotency_key
    )
  );

  -- 12. Return Success Payload
  RETURN jsonb_build_object(
    'ok', true,
    'id', p_id,
    'status', p_to_state,
    'version', v_new_version
  );
END;
$$;

-- Alias for state transition function name compatibility
CREATE OR REPLACE FUNCTION app.transition_work_item_state(
  p_id uuid,
  p_to_state text,
  p_expected_version int,
  p_idempotency_key text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN app.transition_work_item(p_id, p_to_state, p_expected_version, p_idempotency_key, p_reason);
END;
$$;

-- Grant RPC execution permissions
REVOKE ALL ON FUNCTION app.transition_work_item(uuid, text, int, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.transition_work_item(uuid, text, int, text, text) TO authenticated;

REVOKE ALL ON FUNCTION app.transition_work_item_state(uuid, text, int, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.transition_work_item_state(uuid, text, int, text, text) TO authenticated;
