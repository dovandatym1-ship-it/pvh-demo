-- M03: controlled education decision tests with synthetic source records.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
select extensions.has_table('public','schools','Education schools deployed');
select extensions.has_table('public','private_childcare_facilities','Private childcare facilities deployed');
select extensions.has_table('public','tuition_exemptions','Tuition exemptions deployed');
select extensions.ok(
  (select bool_and(relrowsecurity and relforcerowsecurity) from pg_class
   where oid in ('public.schools'::regclass,'public.private_childcare_facilities'::regclass,
     'public.tuition_exemptions'::regclass)),
  'Education tables are protected by forced RLS');
select extensions.ok(
 not has_column_privilege('authenticated','public.private_childcare_facilities','owner_cccd','SELECT')
 and has_column_privilege('authenticated','public.private_childcare_facilities','owner_name','SELECT'),
 'Owner CCCD column is never SELECT granted to clients');
select extensions.ok(
 not has_table_privilege('authenticated','public.tuition_exemptions','UPDATE'),
 'Tuition status cannot be changed by direct table writes');
insert into auth.users(id,email,aud,role) values
 ('eeeeeeee-1111-4111-8111-eeeeeeeeeeee','m03-education-reviewer@example.invalid','authenticated','authenticated'),
 ('eeeeeeee-2222-4222-8222-eeeeeeeeeeee','m03-education-officer@example.invalid','authenticated','authenticated'),
 ('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','m03-education-outsider@example.invalid','authenticated','authenticated');
insert into public.profiles(id,tenant_id,full_name)
select v.id,t.id,v.name from public.tenants t cross join (values
 ('eeeeeeee-1111-4111-8111-eeeeeeeeeeee'::uuid,'Người rà soát giáo dục'),
 ('eeeeeeee-2222-4222-8222-eeeeeeeeeeee'::uuid,'Cán bộ giáo dục')
) as v(id,name);
insert into public.memberships(tenant_id,user_id)
select t.id,v.id from public.tenants t cross join (values
 ('eeeeeeee-1111-4111-8111-eeeeeeeeeeee'::uuid),
 ('eeeeeeee-2222-4222-8222-eeeeeeeeeeee'::uuid)
) as v(id);
insert into public.membership_roles(membership_id,role_code)
select m.id,v.role_code from public.memberships m join (values
 ('eeeeeeee-1111-4111-8111-eeeeeeeeeeee'::uuid,'EDUCATION_REVIEWER'),
 ('eeeeeeee-2222-4222-8222-eeeeeeeeeeee'::uuid,'EDUCATION_OFFICER')
) as v(id,role_code) on v.id=m.user_id;

insert into public.tuition_exemptions(tenant_id,student_name,school_name,grade,category,exemption_percent,support_amount,semester)
select t.id,'Học sinh thử','Trường kiểm thử','Lớp 1','POOR_HOUSEHOLD',0,0,'HK1_CI'
from public.tenants t;

set local role authenticated;
set local request.jwt.claim.sub='eeeeeeee-2222-4222-8222-eeeeeeeeeeee';
select extensions.is((select count(*)::integer from public.tuition_exemptions),1,
 'Assigned education officer can read own-commune records');
select extensions.throws_ok(
 $$select app.approve_tuition_exemption(
 (select id from public.tenants limit 1),
 (select id from public.tuition_exemptions limit 1),'APPROVED',null,1,'CI-DECISION')$$,
 '42501',null,'Reader cannot approve');
set local request.jwt.claim.sub='eeeeeeee-1111-4111-8111-eeeeeeeeeeee';
select extensions.throws_ok(
 $$select app.approve_tuition_exemption(
 (select id from public.tenants limit 1),
 (select id from public.tuition_exemptions limit 1),'APPROVED',null,1,null)$$,
 '22023',null,'Reviewer cannot decide without documentary authority');
select extensions.lives_ok(
 $$select app.approve_tuition_exemption(
 (select id from public.tenants limit 1),
 (select id from public.tuition_exemptions limit 1),'APPROVED',null,1,'CI-DECISION-001')$$,
 'Authorized reviewer can record a sourced decision');
select extensions.throws_ok(
 $$select app.approve_tuition_exemption(
 (select id from public.tenants limit 1),
 (select id from public.tuition_exemptions limit 1),'REJECTED',null,1,'CI-DECISION-002')$$,
 'PV409',null,'Stale version is rejected');
reset role;
select extensions.is((select status from public.tuition_exemptions limit 1),'APPROVED',
 'Decision persisted');
select extensions.is((select count(*)::integer from public.audit_log
 where action='M03_REVIEW_TUITION_EXEMPTION'),1,
 'Exactly one audit record created for decision');
set local role authenticated;
set local request.jwt.claim.sub='eeeeeeee-3333-4333-8333-eeeeeeeeeeee';
select extensions.is_empty($$select * from public.tuition_exemptions$$,
 'Unassigned identity cannot list schoolchildren');
select extensions.throws_ok(
 $$select app.approve_tuition_exemption(
 (select id from public.tenants limit 1),
 '11111111-1111-4111-8111-111111111111','APPROVED',null,1,'CI-DECISION-003')$$,
 '42501',null,'Unassigned identity cannot write decisions');
reset role;
select * from extensions.finish();
rollback;
