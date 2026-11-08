-- PH02 pgTAP structural contract only. This is NOT a substitute for E2E-WORK-001.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

select has_table('public','work_item_assignments','Assignment history exists');
select has_table('public','work_item_inbox','Transactional inbox exists');
select has_table('public','work_item_mutation_requests','Idempotency receipts exist');
select has_table('public','work_item_transition_rules','Versioned transition rules exist');

select ok(to_regprocedure('app.transition_work_item(uuid,text,integer,text,text)') is not null,
  'Transition RPC deployed');
select ok(to_regprocedure('app.assign_work_item(uuid,uuid,integer,text,text)') is not null,
  'Assignment RPC deployed');
select ok(to_regprocedure('app.finalize_evidence(uuid,text)') is not null,
  'Evidence finalize RPC deployed');
select ok(to_regprocedure('app.list_work_assignees(uuid)') is not null,
  'Authorized assignee lookup RPC deployed');

select ok(not has_function_privilege('anon','app.transition_work_item(uuid,text,integer,text,text)','EXECUTE'),
  'Anon cannot invoke transition RPC');
select ok(has_function_privilege('authenticated','app.transition_work_item(uuid,text,integer,text,text)','EXECUTE'),
  'Authenticated may invoke guarded transition RPC');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.work_item_inbox'::regclass),
  'Inbox has forced RLS');
select is((select count(*)::int from public.work_item_transition_rules where rule_version=1),11,
  'SQL transition matrix contains 11 rules');
select ok(not has_table_privilege('authenticated','public.work_item_inbox','UPDATE'),
  'Inbox is append-only for authenticated users');
select has_trigger('public','work_items','work_item_assignee_guard',
  'Assignment validity is enforced for both create and reassignment');
select ok(to_regprocedure('pvh_private.is_eligible_work_assignee(uuid,uuid,uuid)') is not null,
  'Role and hamlet-aware assignment eligibility helper exists');
select ok(not has_function_privilege('authenticated',
  'pvh_private.is_eligible_work_assignee(uuid,uuid,uuid)','EXECUTE'),
  'Authenticated cannot invoke private eligibility bypass directly');
select ok(to_regprocedure('pvh_private.member_has_work_permission(uuid,uuid,text)') is not null,
  'Recipient permission helper exists');
select ok(not has_function_privilege('anon','app.list_work_assignees(uuid)','EXECUTE'),
  'Anon cannot enumerate assignees');
select ok(has_function_privilege('authenticated','app.list_work_assignees(uuid)','EXECUTE'),
  'Manager-scoped assignee lookup can be invoked with RLS checks');
select ok(not has_table_privilege('authenticated','public.work_item_mutation_requests','SELECT'),
  'Request receipts are not directly readable');
select ok(to_regprocedure('app.update_work_item_details(uuid,integer,timestamptz,uuid,text,text)') is not null,
  'Deadline and hamlet update RPC exists');
select ok(has_function_privilege('authenticated',
  'app.update_work_item_details(uuid,integer,timestamptz,uuid,text,text)','EXECUTE'),
  'Authenticated may invoke guarded details RPC');
select ok(not has_function_privilege('anon',
  'app.update_work_item_details(uuid,integer,timestamptz,uuid,text,text)','EXECUTE'),
  'Anon cannot change task details');
select ok(to_regprocedure('app.abandon_pending_evidence(uuid)') is not null,
  'Pending evidence cleanup RPC exists');
select ok(not has_function_privilege('anon','app.abandon_pending_evidence(uuid)','EXECUTE'),
  'Anon cannot cleanup evidence metadata');
select ok(exists(select 1 from pg_policies where schemaname='storage'
  and tablename='objects' and policyname='pvh_evidence_pending_owner_delete'),
  'Pending Storage owner delete policy exists');
select ok(exists(select 1 from pg_policies where schemaname='storage'
  and tablename='objects' and policyname='pvh_evidence_pending_owner_read'),
  'Pending Storage owner read policy exists');

select * from finish();
rollback;
