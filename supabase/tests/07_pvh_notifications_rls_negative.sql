-- PVH: real local PostgreSQL RLS negative/positive tests for notification recipients.
-- Synthetic Auth users only; everything is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users(id,email,aud,role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pvh-recipient-a@example.invalid','authenticated','authenticated'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','pvh-recipient-b@example.invalid','authenticated','authenticated');

insert into public.profiles(id,tenant_id,full_name)
select v.id,t.id,v.name from public.tenants t cross join (values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'Người thử A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,'Người thử B')
) as v(id,name);

insert into public.memberships(tenant_id,user_id)
select t.id,v.id from public.tenants t cross join (values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)
) as v(id);

insert into public.pvh_user_notifications
  (tenant_id,recipient_id,source_type,source_id,event_code,dedupe_key)
select t.id,v.id,'WORK_ITEM',v.source_id,'WORK_ASSIGNED',v.key
from public.tenants t cross join (values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'11111111-1111-4111-8111-111111111111'::uuid,'CI-NOTIF-A'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,'22222222-2222-4222-8222-222222222222'::uuid,'CI-NOTIF-B')
) as v(id,source_id,key);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select extensions.is(
  (select count(*)::integer from public.pvh_user_notifications),1,
  'Recipient A sees only own notification under real RLS');

select extensions.is(
  (select count(*)::integer from public.pvh_user_notifications
    where recipient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),0,
  'Recipient A cannot read recipient B notification');

with changed as (
  update public.pvh_user_notifications set read_at=now()
  where recipient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  returning id
)
select extensions.is((select count(*)::integer from changed),0,
 'Recipient A cannot mark recipient B notification read');

with changed as (
  update public.pvh_user_notifications set read_at=now()
  where recipient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  returning id
)
select extensions.is((select count(*)::integer from changed),1,
 'Recipient A may mark own notification read');

select extensions.throws_ok(
  $$update public.pvh_user_notifications
    set recipient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  '42501',null,
  'Recipient cannot reassign notification ownership through direct UPDATE');

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select extensions.is(
  (select count(*)::integer from public.pvh_user_notifications),1,
  'Recipient B sees own notification but never A');

reset role;
set local role anon;
select extensions.throws_ok(
  $$select * from public.pvh_user_notifications$$,
  '42501',null,'Anonymous requests cannot read notification data');

reset role;
select * from extensions.finish();
rollback;
