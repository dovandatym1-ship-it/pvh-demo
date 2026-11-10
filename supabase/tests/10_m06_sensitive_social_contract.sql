-- M06: social aid intake, masked sensitive readback and non-payment reconciliation.
-- Test identities and all records are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public','social_protection_beneficiaries','M06 beneficiaries deployed');
select extensions.has_table('public','food_safety_inspections','M06 food safety deployed');
select extensions.has_table('public','medical_facilities','M06 medical facilities deployed');
select extensions.has_table('public','epidemic_logs','M06 epidemic logs deployed');
select extensions.has_table('public','social_aid_reconciliation_requests','M06 reconciliation receipts deployed');
select extensions.ok(not has_table_privilege('authenticated','public.social_protection_beneficiaries','SELECT')
 and not has_table_privilege('authenticated','public.social_protection_beneficiaries','INSERT')
 and not has_table_privilege('authenticated','public.social_aid_reconciliation_requests','SELECT'),
 'Sensitive beneficiaries and financial receipts have no direct browser privileges');

insert into auth.users(id,email,aud,role) values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','m06-manager@example.invalid','authenticated','authenticated'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','m06-officer@example.invalid','authenticated','authenticated'),
 ('cccccccc-3333-4333-8333-cccccccccccc','m06-outsider@example.invalid','authenticated','authenticated');
insert into public.profiles(id,tenant_id,full_name)
select v.id,t.id,v.name from public.tenants t cross join (values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid,'Quản lý M06 kiểm thử'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'::uuid,'Cán bộ M06 kiểm thử')
) as v(id,name);
insert into public.org_units(id,tenant_id,code,name,kind)
select v.id,t.id,v.code,v.name,'HAMLET'
from public.tenants t cross join (values
 ('44444444-4444-4444-8444-444444444444'::uuid,'M06-HAMLET-1','Thôn kiểm thử 1'),
 ('55555555-5555-4555-8555-555555555555'::uuid,'M06-HAMLET-2','Thôn kiểm thử 2')
) as v(id,code,name);
insert into public.memberships(tenant_id,user_id,scopes)
select t.id,v.id,v.scopes from public.tenants t cross join (values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid,'{"org_unit_ids":["44444444-4444-4444-8444-444444444444"]}'::jsonb),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'::uuid,'{"org_unit_ids":["44444444-4444-4444-8444-444444444444"]}'::jsonb)
) as v(id,scopes);
insert into public.membership_roles(membership_id,role_code)
select m.id,v.role_code from public.memberships m join (values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid,'SOCIAL_MANAGER'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'::uuid,'SOCIAL_OFFICER')
) as v(id,role_code) on m.user_id=v.id;

set local role authenticated;
set local request.jwt.claim.sub='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
select extensions.lives_ok(
 $$select app.create_social_beneficiary(
 'Đối tượng kiểm thử','012345678901',null,'44444444-4444-4444-8444-444444444444',
 'Nguồn hồ sơ kiểm thử',350000,null,false)$$,
 'Authorized manager creates a beneficiary with audited RPC');
select extensions.is((select jsonb_array_length(app.list_social_beneficiaries())),1,
 'Manager sees exactly one real record');
select extensions.is((select app.list_social_beneficiaries()->0->>'cccd'),
 '012345678901','Explicit PII privilege allows personal identifier readback');
select extensions.throws_ok(
 $$select app.create_social_beneficiary(
 'Không thuộc địa bàn','012345678902',null,'55555555-5555-4555-8555-555555555555',
 'Nguồn thử',350000,null,false)$$,
 '42501',null,'Manager cannot create in out-of-scope hamlet');
select extensions.lives_ok(
 $$select app.request_social_aid_reconciliation(
 (select id from public.social_protection_beneficiaries limit 1),
 'BANG_DOI_SOAT_CI_001','CI-M06-IDEMP-001')$$,
 'Reconciliation is an audited request, not a payment');
select extensions.is(
 (select app.request_social_aid_reconciliation(
 (select id from public.social_protection_beneficiaries limit 1),
 'BANG_DOI_SOAT_CI_001','CI-M06-IDEMP-001')->>'cached'),
 'true','Repeated reconciliation request is idempotent');
reset role;
select extensions.is((select payment_status from public.social_protection_beneficiaries limit 1),
 'PENDING','Request does not falsely mark a person as paid');
select extensions.is((select count(*)::integer from public.social_aid_reconciliation_requests),
 1,'At-least-once delivery creates one reconciliation receipt');
set local role authenticated;
set local request.jwt.claim.sub='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
select extensions.is((select app.list_social_beneficiaries()->0->>'cccd'),
 null,'Read-only officer receives no raw personal identifier');
select extensions.is((select app.list_social_beneficiaries()->0->>'diagnosis'),
 null,'Read-only officer receives no raw diagnosis');
select extensions.is((select app.list_social_beneficiaries()->0->>'monthly_amount'),
 null,'Read-only officer receives no raw allowance');
select extensions.throws_ok($$select * from public.social_protection_beneficiaries$$,
 '42501',null,'Read-only officer cannot bypass masked RPC with table select');
select extensions.throws_ok(
 $$select app.create_social_beneficiary('Sai quyền','012345678903',null,
 '44444444-4444-4444-8444-444444444444','Nguồn thử',350000,null,false)$$,
 '42501',null,'Read-only officer cannot create beneficiary');
set local request.jwt.claim.sub='cccccccc-3333-4333-8333-cccccccccccc';
select extensions.throws_ok($$select app.list_social_beneficiaries()$$,
 '42501',null,'Unassigned identity cannot enumerate sensitive records');
reset role;
select * from extensions.finish();
rollback;
