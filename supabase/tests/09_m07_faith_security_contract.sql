-- M07: real local PostgreSQL contract. Synthetic identities, rollback at EOF.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public','religious_establishments','M07 establishments deployed');
select extensions.has_table('public','religious_events','M07 events deployed');
select extensions.has_table('public','reputable_persons','M07 reputable persons deployed');
select extensions.ok(
 (select bool_and(relrowsecurity and relforcerowsecurity) from pg_class
  where oid in ('public.religious_establishments'::regclass,'public.religious_events'::regclass,
   'public.reputable_persons'::regclass)),
 'RLS enabled and forced on M07 tables');
select extensions.ok(
 not has_table_privilege('authenticated','public.religious_establishments','INSERT')
 and not has_table_privilege('authenticated','public.religious_events','UPDATE'),
 'M07 records have no direct browser write privileges');

insert into auth.users(id,email,aud,role) values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','m07-manager@example.invalid','authenticated','authenticated'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','m07-reader@example.invalid','authenticated','authenticated'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','m07-outsider@example.invalid','authenticated','authenticated');
insert into public.profiles(id,tenant_id,full_name)
select v.id,t.id,v.name from public.tenants t cross join (values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,'Quản lý M07 thử'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,'Cán bộ M07 thử')
) as v(id,name);

insert into public.org_units(id,tenant_id,code,name,kind)
select v.id,t.id,v.code,v.name,'HAMLET'
from public.tenants t cross join (values
 ('44444444-4444-4444-8444-444444444444'::uuid,'M07-HAMLET-1','Thôn kiểm thử 1'),
 ('55555555-5555-4555-8555-555555555555'::uuid,'M07-HAMLET-2','Thôn kiểm thử 2')
) as v(id,code,name);

insert into public.memberships(tenant_id,user_id,scopes)
select t.id,v.id,v.scopes from public.tenants t cross join (values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,'{"org_unit_ids":["44444444-4444-4444-8444-444444444444"]}'::jsonb),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,'{"org_unit_ids":["55555555-5555-4555-8555-555555555555"]}'::jsonb)
) as v(id,scopes);
insert into public.membership_roles(membership_id,role_code)
select m.id,v.role_code from public.memberships m join (values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,'FAITH_MANAGER'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,'FAITH_OFFICER')
) as v(id,role_code) on m.user_id=v.id;

set local role authenticated;
set local request.jwt.claim.sub='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
select extensions.lives_ok(
 $$select app.create_faith_establishment('M07-CI-01','Cơ sở kiểm thử tín ngưỡng','PHAT_GIAO',
 'Đại diện kiểm thử','44444444-4444-4444-8444-444444444444','Địa chỉ kiểm thử',0)$$,
 'Authorized manager creates an intake with atomic audit');
select extensions.is(
 (select status from public.religious_establishments where code='M07-CI-01'),
 'PENDING_REGISTRATION','Intake does not imply official approval');
select extensions.throws_ok(
 $$select app.create_faith_establishment('M07-CI-02','Cơ sở ngoài địa bàn','PHAT_GIAO',
 'Đại diện kiểm thử','55555555-5555-4555-8555-555555555555','Địa chỉ kiểm thử',0)$$,
 '42501',null,'Cross-hamlet create is forbidden');
-- The actor is not granted audit-read; inspect the audit using the local
-- database owner within this rollback-only test, never broaden RLS for tests.
reset role;
select extensions.is(
 (select count(*)::integer from public.audit_log where action='M07_CREATE_FAITH_ESTABLISHMENT'),
 1,'Successful create leaves precisely one audit receipt');
set local role authenticated;
set local request.jwt.claim.sub='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
select extensions.lives_ok(
 $$select app.register_faith_event(
 (select id from public.religious_establishments where code='M07-CI-01'),
 'Hoạt động kiểm thử',current_date+10,20)$$,
 'Authorized manager registers an event in intake state');
select extensions.is(
 (select status from public.religious_events limit 1),'CHO_TIEP_NHAN',
 'Event registration never pretends to be approved');

set local request.jwt.claim.sub='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select extensions.is_empty($$select * from public.religious_establishments$$,
 'Read-only role cannot see records of unrelated hamlet');
select extensions.throws_ok(
 $$select app.create_faith_establishment('M07-READ','Không được ghi','PHAT_GIAO',
 'Đại diện thử','55555555-5555-4555-8555-555555555555','Địa chỉ thử',0)$$,
 '42501',null,'Viewer cannot write to own hamlet');

set local request.jwt.claim.sub='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select extensions.is_empty($$select * from public.religious_establishments$$,
 'Unassigned identity cannot read sensitive faith records');
select extensions.throws_ok(
 $$select app.register_faith_event('11111111-1111-4111-8111-111111111111',
 'Sự kiện không có quyền',current_date,1)$$,
 '42501',null,'Unassigned identity cannot register an event');

reset role;
select * from extensions.finish();
rollback;
