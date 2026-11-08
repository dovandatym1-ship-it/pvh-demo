-- ====================================================================
-- pgTAP Test Suite: M04 (DEM-VH), M09 (DEM-R01) & System Jobs
-- Architecture: ADR-002, Gate G3
-- Target: PostgreSQL 15+ (Supabase Local & CI)
-- ====================================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(20);

-- 1. Table schema verification for all 7 Sprint 3 tables
SELECT has_table('public', 'rule_packs', 'Table public.rule_packs must exist');
SELECT has_table('public', 'rule_pack_criteria', 'Table public.rule_pack_criteria must exist');
SELECT has_table('public', 'campaigns', 'Table public.campaigns must exist');
SELECT has_table('public', 'submissions', 'Table public.submissions must exist');
SELECT has_table('public', 'report_snapshots', 'Table public.report_snapshots must exist');
SELECT has_table('public', 'report_snapshot_lineage', 'Table public.report_snapshot_lineage must exist');
SELECT has_table('public', 'system_jobs', 'Table public.system_jobs must exist');

-- 2. Verify anon cannot read submissions or report_snapshots
SET LOCAL ROLE anon;
SELECT is_empty('SELECT * FROM public.submissions', 'Anonymous role returns zero rows on submissions');
SELECT is_empty('SELECT * FROM public.report_snapshots', 'Anonymous role returns zero rows on report_snapshots');

-- 3. Verify anon cannot insert into submissions or report_snapshots
SELECT throws_ok(
  $$INSERT INTO public.submissions (tenant_id, campaign_id, rule_pack_id, household_id, household_head_name, hamlet_id) 
    VALUES ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'HH-X', 'Test', 'XOM_A1')$$,
  '42501',
  NULL,
  'Anonymous role cannot insert into submissions'
);

SELECT throws_ok(
  $$INSERT INTO public.report_snapshots (tenant_id, report_code, title, period, year, payload, sha256) 
    VALUES ('a0000000-0000-0000-0000-000000000001', 'DEM-R01', 'Test', 'Q3/2026', 2026, '{}'::jsonb, 'test')$$,
  '42501',
  NULL,
  'Anonymous role cannot insert into report_snapshots'
);

-- 4. Cross-tenant isolation verification
-- Authenticate as P1 (Commune A)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'c0000000-0000-0000-0000-000000000001';

-- Querying Commune B records must return 0 rows
SELECT is_empty(
  $$SELECT * FROM public.submissions WHERE tenant_id = 'a0000000-0000-0000-0000-000000000002'$$,
  'User of Commune A cannot read submissions of Commune B'
);

SELECT is_empty(
  $$SELECT * FROM public.report_snapshots WHERE tenant_id = 'a0000000-0000-0000-0000-000000000002'$$,
  'User of Commune A cannot read report snapshots of Commune B'
);

-- 5. Business check constraint verification: DAT requires evidence
SELECT throws_ok(
  $$INSERT INTO public.submissions (
      tenant_id, campaign_id, rule_pack_id, household_id, household_head_name, hamlet_id, status, has_evidence
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
      'HH-NO-EVID', 'No Evidence Test', 'XOM_A1', 'DAT', false
    )$$,
  '23514',
  NULL,
  'Constraint chk_submission_dat_requires_evidence rejects DAT status without evidence'
);

-- 6. Business check constraint verification: YEU_CAU_BO_SUNG requires non-empty reviewer comment
SELECT throws_ok(
  $$INSERT INTO public.submissions (
      tenant_id, campaign_id, rule_pack_id, household_id, household_head_name, hamlet_id, status, reviewer_comment
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
      'HH-NO-COMMENT', 'No Comment Test', 'XOM_A1', 'YEU_CAU_BO_SUNG', '   '
    )$$,
  '23514',
  NULL,
  'Constraint chk_submission_supplementation_comment rejects YEU_CAU_BO_SUNG with whitespace reviewer comment'
);

-- 7. Immutability trigger on report_snapshots
SELECT throws_ok(
  $$UPDATE public.report_snapshots SET title = 'Tampered Title' WHERE status = 'FINALIZED'$$,
  'P0001',
  NULL,
  'Trigger trg_report_snapshot_immutable blocks UPDATE on finalized snapshot'
);

-- 8. RPC: finalize_report_snapshot execution on a draft snapshot
INSERT INTO public.report_snapshots (
  id,
  tenant_id,
  report_code,
  title,
  period,
  year,
  status,
  is_finalized,
  payload,
  sha256,
  created_by
) VALUES (
  'snap0000-0000-0000-0000-000000000099',
  'a0000000-0000-0000-0000-000000000001',
  'DEM-R01',
  'Bản nháp báo cáo thử nghiệm pgTAP',
  'Q4/2026',
  2026,
  'DRAFT',
  false,
  '{"commune":"TN-DEMO-A","metrics":{"tasksTotal":6},"period":"Q4/2026","year":2026}'::jsonb,
  'draft-pending-sha256',
  'c0000000-0000-0000-0000-000000000001'
);

SELECT lives_ok(
  $$SELECT app.finalize_report_snapshot(
      'snap0000-0000-0000-0000-000000000099'::uuid,
      '{"commune":"TN-DEMO-A","metrics":{"tasksTotal":6},"period":"Q4/2026","year":2026}'::jsonb
    )$$,
  'RPC finalize_report_snapshot executes successfully for authorized user on draft snapshot'
);

-- 9. RPC: claim_next_system_job execution
SELECT lives_ok(
  $$SELECT app.claim_next_system_job('test-worker-1')$$,
  'RPC claim_next_system_job executes successfully using SKIP LOCKED'
);

-- 10. RPC: finalize_campaign execution
SELECT lives_ok(
  $$SELECT app.finalize_campaign('00000000-0000-0000-0000-000000000001'::uuid)$$,
  'RPC finalize_campaign executes successfully'
);

SELECT * FROM finish();
ROLLBACK;
