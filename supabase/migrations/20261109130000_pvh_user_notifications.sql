-- PVH self-service notifications. Additive migration for the ACTIVE single-commune baseline.
-- IMPORTANT: source/main currently has legacy migration conflict. Reconcile full migration
-- history against supabase/deployed before applying this to staging. NEVER db push cloud blindly.
-- No application-facing INSERT rights. Events are created by an internal database trigger.
create table if not exists public.pvh_user_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  source_type text not null check (source_type in ('WORK_ITEM')),
  source_id uuid not null,
  event_code text not null check (event_code in
    ('WORK_ASSIGNED','WORK_RETURNED','WORK_COMPLETED','WORK_CANCELLED','WORK_REVIEW','WORK_DEADLINE_CHANGED')),
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (read_at is null or read_at >= created_at)
);

create index if not exists pvh_user_notifications_recipient_idx
 on public.pvh_user_notifications (tenant_id, recipient_id, created_at desc);
create index if not exists pvh_user_notifications_unread_idx
 on public.pvh_user_notifications (tenant_id, recipient_id, created_at desc)
 where read_at is null;

alter table public.pvh_user_notifications enable row level security;
alter table public.pvh_user_notifications force row level security;
revoke all on public.pvh_user_notifications from public, anon, authenticated;
grant select on public.pvh_user_notifications to authenticated;
grant update(read_at) on public.pvh_user_notifications to authenticated;

create policy pvh_self_notif_select on public.pvh_user_notifications
 for select to authenticated using (
  recipient_id = (select auth.uid())
  and exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.tenant_id = pvh_user_notifications.tenant_id
      and m.is_active and m.valid_from <= now()
      and (m.valid_to is null or m.valid_to > now())
  )
);
create policy pvh_self_notif_read on public.pvh_user_notifications
 for update to authenticated
 using (
  recipient_id = (select auth.uid())
  and exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.tenant_id = pvh_user_notifications.tenant_id
      and m.is_active and m.valid_from <= now()
      and (m.valid_to is null or m.valid_to > now())
  )
 )
 with check (
  recipient_id = (select auth.uid())
  and exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.tenant_id = pvh_user_notifications.tenant_id
      and m.is_active and m.valid_from <= now()
      and (m.valid_to is null or m.valid_to > now())
  )
 );

-- Trigger emits safe, content-free in-app signals only; it never sends email/SMS.
create or replace function public.pvh_emit_work_item_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_recipient uuid;
  v_version text;
begin
  v_recipient := new.assigned_to;
  if v_recipient is null then return new; end if;
  if tg_op = 'INSERT' then
    v_code := 'WORK_ASSIGNED';
  elsif new.assigned_to is distinct from old.assigned_to then
    v_code := 'WORK_ASSIGNED';
  elsif new.status is distinct from old.status then
    case new.status
      when 'RETURNED' then v_code := 'WORK_RETURNED';
      when 'COMPLETED' then v_code := 'WORK_COMPLETED';
      when 'CANCELLED' then v_code := 'WORK_CANCELLED';
      when 'UNDER_REVIEW' then v_code := 'WORK_REVIEW';
      else v_code := null;
    end case;
  elsif new.due_date is distinct from old.due_date then
    v_code := 'WORK_DEADLINE_CHANGED';
  end if;
  if v_code is not null then
    v_version := coalesce(new.version::text, '0');
    insert into public.pvh_user_notifications
      (tenant_id,recipient_id,source_type,source_id,event_code,dedupe_key)
    values (new.tenant_id,v_recipient,'WORK_ITEM',new.id,v_code,
      new.tenant_id::text || ':' || new.id::text || ':' ||
      v_recipient::text || ':' || v_version || ':' || v_code)
    on conflict(dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.pvh_emit_work_item_notification() from public, anon, authenticated;
drop trigger if exists pvh_emit_work_item_notification_trigger on public.work_items;
create trigger pvh_emit_work_item_notification_trigger
after insert or update of assigned_to,status,due_date on public.work_items
for each row execute function public.pvh_emit_work_item_notification();

-- The UI only supports read-after-write; due-date scheduled reminders, push/email,
-- read-all, bulk archive, and user preference delivery are deferred to later phases.
