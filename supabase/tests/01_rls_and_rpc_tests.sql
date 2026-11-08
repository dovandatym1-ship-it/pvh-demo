-- ====================================================================
-- pgTAP Test Suite: RLS Deny-by-Default, Multi-Tenant Isolation & RPC
-- ====================================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(12);

-- 1. Table schema verification
SELECT has_table('public', 'tenants', 'Table public.tenants must exist');
SELECT has_table('public', 'profiles', 'Table public.profiles must exist');
SELECT has_table('public', 'memberships', 'Table public.memberships must exist');
SELECT has_table('public', 'work_items', 'Table public.work_items must exist');
SELECT has_table('public', 'work_item_events', 'Table public.work_item_events must exist');
SELECT has_table('public', 'audit_log', 'Table public.audit_log must exist');

-- 2. Verify anon cannot read work_items or audit_log
SET LOCAL ROLE anon;
SELECT is_empty('SELECT * FROM public.work_items', 'Anonymous role returns zero rows on work_items');
SELECT is_empty('SELECT * FROM public.audit_log', 'Anonymous role returns zero rows on audit_log');

-- 3. Verify anon cannot insert into work_items
SELECT throws_ok(
  $$INSERT INTO public.work_items (tenant_id, title, created_by, updated_by) VALUES ('a0000000-0000-0000-0000-000000000001', 'Hacked Task', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001')$$,
  '42501',
  NULL,
  'Anonymous role cannot insert into work_items'
);

-- 4. Cross-tenant isolation verification
-- Authenticate as P2 (Commune A)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'c0000000-0000-0000-0000-000000000002';

-- Querying Commune B records must return 0 rows
SELECT is_empty(
  $$SELECT * FROM public.work_items WHERE tenant_id = 'a0000000-0000-0000-0000-000000000002'$$,
  'User of Commune A cannot read records of Commune B'
);

-- 5. RPC create_work_item execution and atomic audit logging
SELECT lives_ok(
  $$SELECT app.create_work_item(
      'IDEMP-TEST-001',
      'Kiểm tra công tác chuẩn bị Đại hội TDTT',
      'Chuẩn bị sân bãi và thiết chế thể thao',
      'HIGH',
      'c0000000-0000-0000-0000-000000000002'::uuid,
      now() + interval '5 days',
      'CHUNG',
      NULL,
      'a0000000-0000-0000-0000-000000000001'::uuid
    )$$,
  'app.create_work_item executes successfully for authorized user in Commune A'
);

-- 6. Verify audit_log entry was inserted in the same transaction
SELECT results_eq(
  $$SELECT count(*)::int FROM public.audit_log WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' AND action = 'CREATE_WORK_ITEM'$$,
  ARRAY[1],
  'Audit log contains exactly 1 entry for the created work item'
);

-- 7. Verify idempotency defense returns cached item without duplicate insert
SELECT lives_ok(
  $$SELECT app.create_work_item(
      'IDEMP-TEST-001',
      'Kiểm tra công tác chuẩn bị Đại hội TDTT',
      'Chuẩn bị sân bãi và thiết chế thể thao',
      'HIGH',
      'c0000000-0000-0000-0000-000000000002'::uuid,
      now() + interval '5 days',
      'CHUNG',
      NULL,
      'a0000000-0000-0000-0000-000000000001'::uuid
    )$$,
  'Calling app.create_work_item with duplicate idempotency key returns cached item without error'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.work_items WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' AND idempotency_key = 'IDEMP-TEST-001'$$,
  ARRAY[1],
  'Work items count remains exactly 1 after duplicate idempotent invocation'
);

-- 8. Verify direct UPDATE and DELETE on audit_log are blocked
SELECT throws_ok(
  $$UPDATE public.audit_log SET action = 'TAMPERED'$$,
  '42501',
  NULL,
  'Authenticated users cannot UPDATE public.audit_log'
);

SELECT throws_ok(
  $$DELETE FROM public.audit_log$$,
  '42501',
  NULL,
  'Authenticated users cannot DELETE FROM public.audit_log'
);

SELECT * FROM finish();
ROLLBACK;
