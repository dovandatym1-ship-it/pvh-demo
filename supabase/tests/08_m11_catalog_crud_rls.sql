-- M11 pgTAP: real role, RLS, audited CRUD, optimistic locking, and cycle defense.
-- Synthetic users and catalogs are rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public','pvh_catalogs','Catalog headers table deployed');
select extensions.has_table('public','pvh_catalog_values','Catalog values table deployed');
select extensions.has_table('public','pvh_catalog_events','Catalog history table deployed');
select extensions.ok(
 (select bool_and(relrowsecurity and relforcerowsecurity) from pg_class
  where oid in ('public.pvh_catalogs'::regclass,'public.pvh_catalog_values'::regclass,
    'public.pvh_catalog_events'::regclass)),
 'RLS enabled and forced on all three M11 tables');
select extensions.ok(
 not has_table_privilege('authenticated','public.pvh_catalogs','INSERT')
 and not has_table_privilege('authenticated','public.pvh_catalog_values','UPDATE')
 and not has_table_privilege('authenticated','public.pvh_catalog_events','INSERT'),
 'No direct authenticated writes to catalogs or audit');

insert into auth.users(id,email,aud,role) values
 ('77777777-7777-4777-8777-777777777777','pvh-m11-admin@example.invalid','authenticated','authenticated'),
 ('88888888-8888-4888-8888-888888888888','pvh-m11-reader@example.invalid','authenticated','authenticated'),
 ('99999999-9999-4999-8999-999999999999','pvh-m11-outsider@example.invalid','authenticated','authenticated');

insert into public.profiles(id,tenant_id,full_name)
select v.id,t.id,v.name from public.tenants t cross join (values
 ('77777777-7777-4777-8777-777777777777'::uuid,'Quản trị thử'),
 ('88888888-8888-4888-8888-888888888888'::uuid,'Cán bộ xem thử')
) as v(id,name);

insert into public.memberships(tenant_id,user_id)
select t.id,v.id from public.tenants t cross join (values
 ('77777777-7777-4777-8777-777777777777'::uuid),
 ('88888888-8888-4888-8888-888888888888'::uuid)
) as v(id);

insert into public.membership_roles(membership_id,role_code)
select m.id, v.role_code from public.memberships m join (values
 ('77777777-7777-4777-8777-777777777777'::uuid,'SYSTEM_ADMIN'),
 ('88888888-8888-4888-8888-888888888888'::uuid,'WORK_OFFICER')
) as v(user_id,role_code) on m.user_id=v.user_id;

set local role authenticated;
set local request.jwt.claim.sub='77777777-7777-4777-8777-777777777777';

select extensions.lives_ok(
 $$select app.create_pvh_catalog('FIELD_GROUP','Nhóm lĩnh vực','Danh mục dùng chung thử nghiệm')$$,
 'Admin creates a catalog with one RPC');
select extensions.is((select count(*)::integer from public.pvh_catalogs where code='FIELD_GROUP'),
 1,'Admin reads persisted catalog using RLS');
select extensions.lives_ok(
 $$select app.create_pvh_catalog_value(
  (select id from public.pvh_catalogs where code='FIELD_GROUP'),'A','Nhóm thử A')$$,
 'Admin creates a root catalog value');
select extensions.lives_ok(
 $$select app.create_pvh_catalog_value(
  (select id from public.pvh_catalogs where code='FIELD_GROUP'),'B','Nhóm thử B',
  (select id from public.pvh_catalog_values where code='A'))$$,
 'Admin creates a child catalog value');
select extensions.is((select count(*)::integer from public.pvh_catalog_events),3,
 'Every create has an immutable domain history event');
select extensions.is((select count(*)::integer from public.audit_log where action like 'M11_%'),3,
 'Every create has the general audit receipt');

select extensions.throws_ok(
 $$select app.update_pvh_catalog_value(
   (select id from public.pvh_catalog_values where code='A'),1,'A',
   (select id from public.pvh_catalog_values where code='B'),0,true,null,null)$$,
 '22023',null,'Hierarchy cycle is rejected');
select extensions.throws_ok(
 $$select app.update_pvh_catalog_value(
   (select id from public.pvh_catalog_values where code='A'),0,'A',null,0,true,null,null)$$,
 'PV409',null,'Stale version is rejected');
select extensions.throws_ok(
 $$select app.update_pvh_catalog_value(
   (select id from public.pvh_catalog_values where code='A'),1,'A',null,0,false,null,null)$$,
 '22023',null,'Cannot deactivate value with active child');
select extensions.lives_ok(
 $$select app.update_pvh_catalog_value(
   (select id from public.pvh_catalog_values where code='B'),1,'Nhóm B sửa',null,1,false,null,null)$$,
 'Admin can version and deactivate leaf');

set local request.jwt.claim.sub='88888888-8888-4888-8888-888888888888';
select extensions.is((select count(*)::integer from public.pvh_catalogs where code='FIELD_GROUP'),
 1,'Reader may list catalog');
select extensions.throws_ok(
 $$select app.create_pvh_catalog('UNAUTHORIZED','Không hợp lệ')$$,
 '42501',null,'Reader may not create a catalog');

set local request.jwt.claim.sub='99999999-9999-4999-8999-999999999999';
select extensions.is_empty($$select id from public.pvh_catalogs$$,
 'Unprovisioned identity cannot enumerate catalogs');
select extensions.throws_ok(
 $$select app.create_pvh_catalog('UNASSIGNED','Không hợp lệ')$$,
 '42501',null,'Unprovisioned identity cannot write');

reset role;
select * from extensions.finish();
rollback;
