-- PH01/G1: real singleton schema, no second tenant or fictional persistent account.
-- Runs ONLY on an ephemeral database. All Auth fixtures are rolled back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT plan(32);

SELECT has_table('public','tenants','Singleton tenant table exists');
SELECT has_table('public','profiles','Auth-linked profiles exist');
SELECT has_table('public','memberships','Memberships exist');
SELECT has_table('public','membership_roles','Role assignment exists');
SELECT has_table('public','role_permissions','Permission projection source exists');
SELECT has_table('public','work_items','Work item table exists');
SELECT has_table('public','audit_log','Append-only audit exists');
SELECT has_table('public','evidence_files','Scoped evidence table exists');

SET LOCAL ROLE anon;
SELECT throws_ok('SELECT * FROM public.work_items','42501',NULL,'Anonymous cannot SELECT work items');
SELECT throws_ok('SELECT * FROM public.audit_log','42501',NULL,'Anonymous cannot SELECT audit log');
SELECT throws_ok('SELECT app.create_work_item(''anon-key'',''Fake'')','42501',NULL,'Anonymous cannot execute work RPC');
RESET ROLE;

-- Fake, rolled-back Auth identities; never seed permanent credentials.
INSERT INTO auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at) VALUES
('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ph01-officer@example.invalid','!',now()),
('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ph01-other@example.invalid','!',now()),
('00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ph01-admin@example.invalid','!',now()),
('00000000-0000-0000-0000-000000000104','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ph01-unassigned@example.invalid','!',now()),
('00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ph01-invited@example.invalid','!',now());

INSERT INTO public.profiles(id,tenant_id,full_name)
SELECT u.id,t.id, 'PH01 Test '||right(u.id::text,3)
FROM auth.users u CROSS JOIN public.tenants t
WHERE u.id IN ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000103');

INSERT INTO public.memberships(tenant_id,user_id)
SELECT t.id,u.id FROM public.tenants t CROSS JOIN auth.users u
WHERE u.id IN ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000103');

INSERT INTO public.membership_roles(membership_id,role_code)
SELECT m.id,CASE WHEN m.user_id='00000000-0000-0000-0000-000000000103' THEN 'SYSTEM_ADMIN' ELSE 'WORK_OFFICER' END
FROM public.memberships m
WHERE m.user_id IN ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000103');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000104',true);
SELECT is_empty('SELECT id FROM public.work_items','An authenticated user without membership sees no work');
SELECT throws_ok('SELECT app.create_work_item(''unassigned'',''Fake'')','42501',NULL,'An account without membership cannot create');

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
SELECT lives_ok('SELECT app.create_work_item(''ph01-idempotent'',''Real unit work'')','Authorized officer can use audited create RPC');
SELECT is((SELECT count(*)::int FROM public.work_items),1,'Creator can read own work');
SELECT lives_ok('SELECT app.create_work_item(''ph01-idempotent'',''Real unit work'')','Idempotent replay succeeds');
SELECT is((SELECT count(*)::int FROM public.work_items),1,'Idempotent replay does not insert duplicate');
SELECT throws_ok('SELECT app.create_work_item(''ph01-idempotent'',''Different payload'')','22023',NULL,'Same idempotency key with different payload fails');
SELECT throws_ok('INSERT INTO public.audit_log(tenant_id,actor_id,action,entity_type,entity_id) SELECT id,''00000000-0000-0000-0000-000000000101'',''FORGED'',''work_item'',''x'' FROM public.tenants','42501',NULL,'Authenticated clients cannot forge audit rows');
SELECT ok((app.get_account_context()->>'userId')::uuid='00000000-0000-0000-0000-000000000101','Account context derives live Auth identity');
SELECT throws_ok('UPDATE public.work_items SET title=''Direct bypass''','42501',NULL,'Direct business UPDATE is forbidden');
SELECT lives_ok('SELECT app.register_evidence((SELECT id FROM public.work_items LIMIT 1),''note.pdf'')','Evidence registration is audited by a work-scoped RPC');
SELECT is((SELECT count(*)::int FROM public.evidence_files),1,'Officer can see evidence of assigned work');

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
SELECT is_empty('SELECT id FROM public.work_items','Another officer in same commune cannot read unassigned work');
SELECT is_empty('SELECT id FROM public.evidence_files','Another officer cannot read evidence of unassigned work');

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000103',true);
SELECT is_empty('SELECT id FROM public.work_items','SYSTEM_ADMIN has no automatic business-data bypass');
SELECT is((SELECT count(*)::int FROM public.audit_log),2,'Authorized auditor reads atomic work and evidence events');
SELECT lives_ok('SELECT app.provision_membership(''00000000-0000-0000-0000-000000000105'',''Invited PH01 Officer'',''WORK_OFFICER'')','SYSTEM_ADMIN may provision an existing Auth identity atomically');
SELECT ok(EXISTS(SELECT 1 FROM public.memberships WHERE user_id='00000000-0000-0000-0000-000000000105' AND is_active),'New assignment is active and visible to admin');
SELECT lives_ok('SELECT app.set_membership_role(''00000000-0000-0000-0000-000000000105'',''WORK_VIEWER'',true)','Admin may grant an explicit additional role');
SELECT throws_ok('SELECT app.revoke_membership(''00000000-0000-0000-0000-000000000103'')','42501',NULL,'SYSTEM_ADMIN cannot revoke own only admin account');
SELECT lives_ok('SELECT app.revoke_membership(''00000000-0000-0000-0000-000000000105'')','Admin can revoke an assignment with an audited RPC');

SELECT * FROM finish();
ROLLBACK;
