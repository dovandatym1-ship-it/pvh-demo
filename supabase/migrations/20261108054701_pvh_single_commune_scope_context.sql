-- Complete FK indexes and preserve record scopes even for all-record roles.
create index audit_log_actor_idx on public.audit_log(actor_id);
create index evidence_files_uploader_idx on public.evidence_files(uploaded_by);
create index memberships_created_by_idx on public.memberships(created_by);
create index memberships_updated_by_idx on public.memberships(updated_by);
create index system_jobs_creator_idx on public.system_jobs(created_by);
create index work_item_events_actor_idx on public.work_item_events(actor_id);
create index work_item_events_creator_idx on public.work_item_events(created_by);
alter table public.memberships add constraint scopes_unit_array check (
 not(scopes ? 'org_unit_ids') or jsonb_typeof(scopes->'org_unit_ids')='array'
);
create or replace function pvh_private.can_access_work(p_tenant uuid,p_id uuid,p_action text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.work_items w join public.memberships m on m.tenant_id=w.tenant_id and m.user_id=auth.uid()
 where w.tenant_id=p_tenant and w.id=p_id and pvh_private.has_permission(p_tenant,'m01:work:'||p_action)
 and (pvh_private.has_permission(p_tenant,'m01:work:'||p_action||'_all') or w.created_by=auth.uid() or w.assigned_to=auth.uid())
 and (not(m.scopes ? 'org_unit_ids') or exists(select 1 from jsonb_array_elements_text(m.scopes->'org_unit_ids') s(value) where s.value=w.hamlet_id::text)));
$$;
create function app.get_account_context()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_context jsonb;
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
 select jsonb_build_object('userId',m.user_id,'tenantId',m.tenant_id,'membershipId',m.id,
 'roles',m.roles,'permissions',m.permissions,'scopes',m.scopes,'fullName',p.full_name,
 'communeName',t.name,'singleCommune',true) into v_context
 from public.memberships m join public.profiles p on p.id=m.user_id join public.tenants t on t.id=m.tenant_id
 where m.user_id=auth.uid() and m.is_active and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now());
 if v_context is null then raise exception 'FORBIDDEN: account has no active assignment' using errcode='42501'; end if;
 return v_context;
end; $$;
revoke all on function app.get_account_context() from public,anon;
grant execute on function app.get_account_context() to authenticated;
notify pgrst,'reload schema';
