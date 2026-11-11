-- M02: source-backed labor dispute review and masked NCC readback.
-- Entire test uses synthetic data and rollback.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
select extensions.has_table('public','ncc_beneficiaries','NCC source table deployed');
select extensions.has_table('public','labor_contracts','Labor source table deployed');
select extensions.has_table('public','labor_disputes','Labor dispute source table deployed');
select extensions.ok(
 (select bool_and(relrowsecurity and relforcerowsecurity)
  from pg_class where oid in ('public.ncc_beneficiaries'::regclass,
   'public.labor_contracts'::regclass,'public.labor_disputes'::regclass)),
 'All M02 tables are forced RLS');
select extensions.ok(
 not has_table_privilege('authenticated','public.ncc_beneficiaries','SELECT')
 and not has_table_privilege('authenticated','public.ncc_beneficiaries','INSERT')
 and not has_table_privilege('authenticated','public.labor_disputes','UPDATE'),
 'Raw NCC and labor direct writes are denied');
insert into auth.users(id,email,aud,role) values
 ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','m02-reviewer@example.invalid','authenticated','authenticated'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','m02-officer@example.invalid','authenticated','authenticated'),
 ('bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb','m02-outsider@example.invalid','authenticated','authenticated');
insert into public.profiles(id,tenant_id,full_name)
select v.id,t.id,v.name from public.tenants t cross join (values
 ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb'::uuid,'Quản lý nội vụ thử'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'::uuid,'Cán bộ nội vụ thử')
) as v(id,name);
insert into public.org_units(id,tenant_id,code,name,kind)
select '44444444-4444-4444-8444-444444444444'::uuid,t.id,'M02-HAMLET','Thôn giả lập','HAMLET'
from public.tenants t;
insert into public.memberships(tenant_id,user_id,scopes)
select t.id,v.id,'{"org_unit_ids":["44444444-4444-4444-8444-444444444444"]}'::jsonb
from public.tenants t cross join (values
 ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb'::uuid),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'::uuid)
) as v(id);
insert into public.membership_roles(membership_id,role_code)
select m.id,v.role_code from public.memberships m join (values
 ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb'::uuid,'INTERNAL_REVIEWER'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'::uuid,'INTERNAL_OFFICER')
) as v(id,role_code) on v.id=m.user_id;
insert into public.ncc_beneficiaries(tenant_id,code,full_name,cccd,hamlet_id,
 category,medal_title,monthly_allowance)
select t.id,'CI-M02-NCC','Người có công thử','012345678901',
 '44444444-4444-4444-8444-444444444444','THUONG_BINH','Nguồn thử',999999
from public.tenants t;
insert into public.labor_disputes(tenant_id,code,requester_name,requester_role,
 respondent_name,dispute_content,dispute_type,received_date,source_reference)
select t.id,'CI-DISPUTE','Bên yêu cầu thử','EMPLOYEE',
 'Bên liên quan thử','Nội dung kiểm thử','INDIVIDUAL',current_date,'CI-SOURCE-001'
from public.tenants t;
set local role authenticated;
set local request.jwt.claim.sub='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
select extensions.is((select jsonb_array_length(app.list_ncc_beneficiaries())),1,
 'Officer can read only scoped NCC records via RPC');
select extensions.is((select app.list_ncc_beneficiaries()->0->>'cccd'),null,
 'Officer receives no raw identity number');
select extensions.is((select app.list_ncc_beneficiaries()->0->>'monthly_allowance'),null,
 'Officer receives no raw allowance');
select extensions.throws_ok(
 $$select * from public.ncc_beneficiaries$$,'42501',null,
 'Officer cannot bypass masked RPC with raw SELECT');
select extensions.throws_ok(
 $$select app.resolve_labor_dispute(
 (select id from public.tenants limit 1),(select id from public.labor_disputes limit 1),
 'RESOLVED_SUCCESS','Hòa giải thành',null,1,'CI-BIEN-BAN-001')$$,
 '42501',null,'Read-only officer cannot record a result');
set local request.jwt.claim.sub='bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb';
select extensions.is((select app.list_ncc_beneficiaries()->0->>'cccd'),
 '012345678901','Reviewer with PII grant may inspect ID');
select extensions.throws_ok(
 $$select app.resolve_labor_dispute(
 (select id from public.tenants limit 1),(select id from public.labor_disputes limit 1),
 'RESOLVED_SUCCESS','Hòa giải thành',null,1,null)$$,
 '22023',null,'No decision without documentary source');
select extensions.lives_ok(
 $$select app.resolve_labor_dispute(
 (select id from public.tenants limit 1),(select id from public.labor_disputes limit 1),
 'RESOLVED_SUCCESS','Hòa giải thành',null,1,'CI-BIEN-BAN-001')$$,
 'Reviewer may record sourced labor result once');
select extensions.throws_ok(
 $$select app.resolve_labor_dispute(
 (select id from public.tenants limit 1),(select id from public.labor_disputes limit 1),
 'RESOLVED_FAILED','Hòa giải không thành',null,1,'CI-BIEN-BAN-002')$$,
 'PV409',null,'Outdated version cannot override result');
reset role;
select extensions.is((select status from public.labor_disputes limit 1),
 'RESOLVED_SUCCESS','Sourced result persisted');
select extensions.is((select count(*)::integer from public.audit_log
 where action='M02_RESOLVE_LABOR_DISPUTE'),1,
 'A single immutable audit receipt exists');
set local role authenticated;
set local request.jwt.claim.sub='bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb';
select extensions.throws_ok($$select app.list_ncc_beneficiaries()$$,
 '42501',null,'Unassigned actor cannot list NCC data');
select extensions.is_empty($$select * from public.labor_disputes$$,
 'Unassigned actor cannot view dispute');
reset role;
select * from extensions.finish();
rollback;
