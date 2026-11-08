-- PH03 database contract: zero cloud state, zero seeded persons, rollback at EOF.
-- Verifies database objects and least-privilege access rather than parsing source.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public', t.name, format('PH03 table %s exists', t.name))
from unnest(array[
 'culture_rule_packs','campaigns','submissions','culture_submission_events',
 'digital_plans','digital_plan_tasks','digital_indicators','digital_indicator_events',
 'community_digital_teams','inspection_records','inspection_recommendations','inspection_events'
]) as t(name);

-- A public table must never be readable without an explicit policy.
select extensions.ok(c.relrowsecurity and c.relforcerowsecurity,
 format('RLS enabled and forced on %s', t.name))
from unnest(array[
 'culture_rule_packs','campaigns','submissions','culture_submission_events',
 'digital_plans','digital_plan_tasks','digital_indicators','digital_indicator_events',
 'community_digital_teams','inspection_records','inspection_recommendations','inspection_events'
]) as t(name)
join pg_catalog.pg_class c on c.oid=to_regclass(format('public.%I',t.name));

select extensions.ok(not pg_catalog.has_table_privilege('authenticated',format('public.%I',t.name),'INSERT')
 and not pg_catalog.has_table_privilege('authenticated',format('public.%I',t.name),'UPDATE')
 and not pg_catalog.has_table_privilege('authenticated',format('public.%I',t.name),'DELETE'),
 format('No direct authenticated DML on %s',t.name))
from unnest(array[
 'culture_rule_packs','campaigns','submissions','culture_submission_events',
 'digital_plans','digital_plan_tasks','digital_indicators','digital_indicator_events',
 'community_digital_teams','inspection_records','inspection_recommendations','inspection_events'
]) as t(name);

select extensions.ok(pg_catalog.has_table_privilege('authenticated',format('public.%I',t.name),'SELECT'),
 format('Authenticated SELECT allowed only via RLS on %s',t.name))
from unnest(array[
 'culture_rule_packs','campaigns','submissions','culture_submission_events',
 'digital_plans','digital_plan_tasks','digital_indicators','digital_indicator_events',
 'community_digital_teams','inspection_records','inspection_recommendations','inspection_events'
]) as t(name);

select extensions.ok(to_regprocedure(sig) is not null,format('Domain RPC %s exists',sig))
from unnest(array[
 'app.create_culture_rule_pack(text,integer,text,jsonb,numeric)',
 'app.create_culture_campaign(uuid,integer,text,timestamp with time zone)',
 'app.submit_culture_dossier(uuid,text,text,uuid,text,text)',
 'app.review_culture_dossier(uuid,text,numeric,text,integer,uuid)',
 'app.create_digital_plan(text,text,text)',
 'app.link_digital_plan_work(uuid,uuid)',
 'app.create_digital_indicator(uuid,text,text,text,text,text)',
 'app.update_digital_indicator_status(uuid,text,numeric,text,integer,text)',
 'app.create_inspection_record(text,text,text,uuid,text,text,date,text,text)',
 'app.create_inspection_recommendation(uuid,text,text,date,uuid,text)',
 'app.resolve_inspection_recommendation(uuid,text,text,integer)'
]) as sig;

select extensions.is(
 (select count(*)::integer from public.role_permissions
  where role_code='SYSTEM_ADMIN'
    and (permission_code like 'm04:%' or permission_code like 'm05:%' or permission_code like 'm08:%')),
 0,'SYSTEM_ADMIN does not implicitly inherit domain access');

set local role anon;
select extensions.throws_ok(
 $$select app.create_digital_plan('Kế hoạch thử','2026-Q4','Nguồn thử')$$,
 '42501',null,'Anonymous cannot invoke domain write RPC');
select extensions.throws_ok(
 $$select * from public.inspection_records$$,
 '42501',null,'Anonymous cannot read domain records');

set local role authenticated;
set local request.jwt.claim.sub = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
select extensions.throws_ok(
 $$select app.create_digital_plan('Kế hoạch thử','2026-Q4','Nguồn thử')$$,
 '42501',null,'Unprovisioned authenticated user cannot write M05');
select extensions.throws_ok(
 $$select app.create_inspection_record('KT-01','Đối tượng thử','Văn hóa',null,'Đoàn thử','ILLUSTRATIVE-v1',current_date)$$,
 '42501',null,'Unprovisioned authenticated user cannot write M08');

select * from extensions.finish();
rollback;
