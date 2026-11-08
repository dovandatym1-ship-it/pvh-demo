-- PH02 pgTAP structural contract only. This is NOT a substitute for E2E-WORK-001.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

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
select ok(to_regprocedure('app.list_work_assignees()') is not null,
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

select * from finish();
rollback;
