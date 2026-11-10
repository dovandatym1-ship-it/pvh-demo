-- PVH integration contract: notification inbox + private avatar storage.
-- All assertions are local and leave no records behind.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public', 'pvh_user_notifications',
  'Persistent notification table exists');

select extensions.ok(
  (select c.relrowsecurity and c.relforcerowsecurity
   from pg_class c where c.oid='public.pvh_user_notifications'::regclass),
  'Notifications enforce RLS even for their owner');

select extensions.ok(
  not has_table_privilege('anon','public.pvh_user_notifications','SELECT'),
  'Anonymous user cannot enumerate notifications');

select extensions.ok(
  not has_table_privilege('authenticated','public.pvh_user_notifications','INSERT')
  and not has_table_privilege('authenticated','public.pvh_user_notifications','DELETE'),
  'Authenticated user cannot insert or delete notification events');

select extensions.ok(
  has_column_privilege('authenticated','public.pvh_user_notifications','read_at','UPDATE')
  and not has_column_privilege('authenticated','public.pvh_user_notifications','recipient_id','UPDATE')
  and not has_column_privilege('authenticated','public.pvh_user_notifications','event_code','UPDATE'),
  'Only read receipt column may be updated by authenticated user');

select extensions.ok(
  exists(select 1 from pg_policies
    where schemaname='public' and tablename='pvh_user_notifications'
      and policyname='pvh_self_notif_select')
  and exists(select 1 from pg_policies
    where schemaname='public' and tablename='pvh_user_notifications'
      and policyname='pvh_self_notif_read'),
  'Read and read-receipt operations are explicitly governed by RLS');

select extensions.ok(
  exists(select 1 from pg_trigger
    where tgrelid='public.work_items'::regclass
      and tgname='pvh_emit_work_item_notification_trigger'
      and not tgisinternal),
  'Work-item events trigger persistent notifications');

select extensions.ok(
  not has_function_privilege('anon','public.pvh_emit_work_item_notification()','EXECUTE')
  and not has_function_privilege('authenticated',
    'public.pvh_emit_work_item_notification()','EXECUTE'),
  'Clients cannot invoke the notification trigger function directly');

select extensions.ok(
  exists(select 1 from storage.buckets
    where id='pvh-avatars' and public=false and file_size_limit <= 1048576
      and allowed_mime_types = array['image/jpeg']::text[]),
  'Avatars live in a private JPEG-only size-bounded bucket');

select extensions.ok(
  (select count(*) from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname in ('pvh_avatar_owner_read', 'pvh_avatar_owner_create',
        'pvh_avatar_owner_replace', 'pvh_avatar_owner_delete')) = 4,
  'All four avatar owner-only Storage policies exist');

select * from extensions.finish();
rollback;
