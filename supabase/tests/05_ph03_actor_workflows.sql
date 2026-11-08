-- PH03 transactional integration: real role projections/RPCs/RLS with synthetic IDs.
-- No personal data, no external services, no test users persist (ROLLBACK).
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users(id,email,aud,role) values
 ('11111111-1111-4111-8111-111111111111','ph03-a@example.invalid','authenticated','authenticated'),
 ('22222222-2222-4222-8222-222222222222','ph03-b@example.invalid','authenticated','authenticated'),
 ('33333333-3333-4333-8333-333333333333','ph03-c@example.invalid','authenticated','authenticated');

insert into public.profiles(id,tenant_id,full_name)
select u.id,t.id,u.name from public.tenants t cross join (values
 ('11111111-1111-4111-8111-111111111111'::uuid,'Test A'),
 ('22222222-2222-4222-8222-222222222222'::uuid,'Test B'),
 ('33333333-3333-4333-8333-333333333333'::uuid,'Test C')
) as u(id,name);

insert into public.org_units(id,tenant_id,code,name,kind)
select h.id,t.id,h.code,h.name,'HAMLET' from public.tenants t cross join (values
 ('44444444-4444-4444-8444-444444444444'::uuid,'CI-HAMLET-A','Xóm giả lập A'),
 ('55555555-5555-4555-8555-555555555555'::uuid,'CI-HAMLET-B','Xóm giả lập B')
) as h(id,code,name);

insert into public.memberships(tenant_id,user_id,scopes)
select t.id,u.id,u.scopes from public.tenants t cross join (values
 ('11111111-1111-4111-8111-111111111111'::uuid,'{"org_unit_ids":["44444444-4444-4444-8444-444444444444"]}'::jsonb),
 ('22222222-2222-4222-8222-222222222222'::uuid,'{"org_unit_ids":["44444444-4444-4444-8444-444444444444"]}'::jsonb),
 ('33333333-3333-4333-8333-333333333333'::uuid,'{"org_unit_ids":["55555555-5555-4555-8555-555555555555"]}'::jsonb)
) as u(id,scopes);

insert into public.membership_roles(membership_id,role_code)
select m.id,roles.code from public.memberships m join (values
 ('11111111-1111-4111-8111-111111111111'::uuid,'CULTURE_SUBMITTER'),
 ('11111111-1111-4111-8111-111111111111'::uuid,'DIGITAL_COORDINATOR'),
 ('11111111-1111-4111-8111-111111111111'::uuid,'INSPECTION_COORDINATOR'),
 ('11111111-1111-4111-8111-111111111111'::uuid,'WORK_MANAGER'),
 ('22222222-2222-4222-8222-222222222222'::uuid,'CULTURE_REVIEWER'),
 ('22222222-2222-4222-8222-222222222222'::uuid,'DIGITAL_COORDINATOR'),
 ('22222222-2222-4222-8222-222222222222'::uuid,'INSPECTION_COORDINATOR'),
 ('22222222-2222-4222-8222-222222222222'::uuid,'WORK_MANAGER')
) as roles(user_id,code) on roles.user_id=m.user_id;

set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select extensions.lives_ok(
 $$select app.create_digital_plan('Kế hoạch kiểm thử PH03','2026-Q4','CI-PLAN-001')$$,
 'M05 plan writer can create a source-backed draft');
select extensions.lives_ok(
 $$select app.create_digital_indicator(null,'CI-M05-001','Số liệu kiểm thử','hồ sơ','2026-Q4','')$$,
 'M05 writer can register indicator without invented data');
select extensions.lives_ok(
 $$select app.update_digital_indicator_status(
   (select id from public.digital_indicators where code='CI-M05-001'),
   'UNVERIFIED',0,'CI-REPORT-001',1,null)$$,
 'M05 can store actual zero as unverified value');
select extensions.throws_ok(
 $$select app.update_digital_indicator_status(
   (select id from public.digital_indicators where code='CI-M05-001'),
   'CONFIRMED_ZERO',0,'CI-REPORT-001',2,null)$$,
 '42501',null,'M05 author cannot confirm own data');
select extensions.throws_ok(
 $$select app.update_digital_indicator_status(
   (select id from public.digital_indicators where code='CI-M05-001'),
   'UNVERIFIED',0,'CI-REPORT-001',null,null)$$,
 'PV409',null,'M05 null version cannot bypass concurrency control');

select extensions.lives_ok(
 $$select app.create_inspection_record('CI-KT-001','Đối tượng kiểm thử','Văn hóa',
   '44444444-4444-4444-8444-444444444444','Đầu mối A','ILLUSTRATIVE-v1',current_date)$$,
 'M08 authorized inspector can record a local-only case');
select extensions.throws_ok(
 $$select app.create_inspection_record('CI-KT-002','Đối tượng kiểm thử','Văn hóa',
   '55555555-5555-4555-8555-555555555555','Đầu mối A','ILLUSTRATIVE-v1',current_date)$$,
 '42501',null,'M08 cannot write outside assigned hamlet');
select extensions.lives_ok(
 $$select app.create_inspection_recommendation(
   (select id from public.inspection_records where code='CI-KT-001'),
   'CI-REC-001','Khắc phục lỗi thử nghiệm',current_date+3,
   '22222222-2222-4222-8222-222222222222','CI-REC-IDEMP')$$,
 'M08 recommendation creates M01 work atomically');
select extensions.is((select count(*)::integer from public.inspection_recommendations
 where code='CI-REC-001'),1,'M08 recommendation has one linked work item');

set local request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
select extensions.is_empty(
 $$select * from public.inspection_records where code='CI-KT-001'$$,
 'Third persona cannot see out-of-scope inspection records');
select extensions.throws_ok(
 $$select app.create_digital_plan('Kế hoạch trái quyền','2026-Q4','CI-SOURCE')$$,
 '42501',null,'Third persona cannot invoke a domain write RPC');

set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select extensions.throws_ok(
 $$select app.resolve_inspection_recommendation(
   (select id from public.inspection_recommendations where code='CI-REC-001'),
   'RESOLVED_CLOSED','Đề nghị đóng sớm',1)$$,
 '22023',null,'M08 cannot close before M01 work is completed');
select extensions.lives_ok(
 $$select app.update_digital_indicator_status(
   (select id from public.digital_indicators where code='CI-M05-001'),
   'CONFIRMED_ZERO',0,'CI-REPORT-001',2,null)$$,
 'Independent M05 reviewer can confirm actual zero');
select extensions.lives_ok(
 $$select app.open_illustrative_culture_campaign('GIA_DINH',
   extract(year from current_date)::integer,'Đợt kiểm thử PH03',now()+interval '10 days')$$,
 'M04 reviewer can open illustrative pack and campaign atomically');

set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select extensions.lives_ok(
 $$select app.submit_culture_dossier(
   (select id from public.campaigns where title='Đợt kiểm thử PH03'),
   'CI-HOUSEHOLD-01','Hộ giả lập',
   '44444444-4444-4444-8444-444444444444','CI-SOURCE-001','CI-DOSSIER-IDEMP')$$,
 'M04 submitter can file in permitted hamlet');
select extensions.lives_ok(
 $$select app.submit_culture_dossier(
   (select id from public.campaigns where title='Đợt kiểm thử PH03'),
   'CI-HOUSEHOLD-01','Hộ giả lập',
   '44444444-4444-4444-8444-444444444444','CI-SOURCE-001','CI-DOSSIER-IDEMP')$$,
 'M04 duplicate request returns same row');
select extensions.is((select count(*)::integer from public.submissions
 where subject_ref='CI-HOUSEHOLD-01'),1,'M04 idempotency created exactly one dossier');

set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select extensions.throws_ok(
 $$select app.review_culture_dossier(
   (select id from public.submissions where subject_ref='CI-HOUSEHOLD-01'),
   'DAT',100,'Đạt điều kiện kiểm thử',1,null)$$,
 '42501',null,'M04 cannot mark illustrative rule pack as DAT');
select extensions.lives_ok(
 $$select app.review_culture_dossier(
   (select id from public.submissions where subject_ref='CI-HOUSEHOLD-01'),
   'YEU_CAU_BO_SUNG',null,'Cần bổ sung minh chứng',1,null)$$,
 'M04 independent reviewer can request evidence with audit');

select * from extensions.finish();
rollback;
