-- M11: tenant-scoped shared catalogs, versioned CRUD, hierarchy and immutable history.
-- No fake master data or auth identities. Changes use audited RPCs only.
insert into public.permissions(code,description) values
 ('m11:catalog:read','Tra cứu danh mục dùng chung'),
 ('m11:catalog:manage','Quản lý và ghi lịch sử danh mục dùng chung')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code)
select r.role_code, r.perm_code from (values
 ('SYSTEM_ADMIN','m11:catalog:read'),('SYSTEM_ADMIN','m11:catalog:manage'),
 ('WORK_MANAGER','m11:catalog:read'),('WORK_OFFICER','m11:catalog:read'),
 ('WORK_VIEWER','m11:catalog:read'),('AUDITOR','m11:catalog:read')
) as r(role_code,perm_code)
where exists(select 1 from public.roles x where x.code=r.role_code)
on conflict do nothing;

create table public.pvh_catalogs (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 code text not null check(code ~ '^[A-Z][A-Z0-9_]{1,39}$'),
 label_vi text not null check(length(btrim(label_vi)) between 2 and 150),
 description text not null default '' check(length(description)<=500),
 is_active boolean not null default true,
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,code)
);

create table public.pvh_catalog_values (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 catalog_id uuid not null,
 code text not null check(code ~ '^[A-Z0-9][A-Z0-9_\-]{0,39}$'),
 label_vi text not null check(length(btrim(label_vi)) between 1 and 150),
 parent_id uuid,
 sort_order integer not null default 0 check(sort_order between 0 and 999999),
 valid_from date,valid_to date,
 is_active boolean not null default true,
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,catalog_id,id),unique(tenant_id,catalog_id,code),
 foreign key(tenant_id,catalog_id) references public.pvh_catalogs(tenant_id,id) on delete restrict,
 foreign key(tenant_id,catalog_id,parent_id) references public.pvh_catalog_values(tenant_id,catalog_id,id) on delete restrict,
 check(parent_id is distinct from id),
 check(valid_from is null or valid_to is null or valid_to>=valid_from)
);

create table public.pvh_catalog_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 catalog_id uuid not null,
 value_id uuid,
 actor_id uuid not null references auth.users(id) on delete restrict,
 action text not null check(action in ('CREATE_CATALOG','UPDATE_CATALOG','CREATE_VALUE','UPDATE_VALUE')),
 before_value jsonb,after_value jsonb not null,
 created_at timestamptz not null default now(),
 foreign key(tenant_id,catalog_id) references public.pvh_catalogs(tenant_id,id) on delete restrict,
 foreign key(tenant_id,catalog_id,value_id) references public.pvh_catalog_values(tenant_id,catalog_id,id) on delete restrict
);

create index pvh_catalog_values_lookup_idx on public.pvh_catalog_values(tenant_id,catalog_id,is_active,sort_order,code);
create index pvh_catalog_values_parent_idx on public.pvh_catalog_values(tenant_id,catalog_id,parent_id);
create index pvh_catalog_events_history_idx on public.pvh_catalog_events(tenant_id,catalog_id,created_at desc);

do $$ declare t text; begin
 foreach t in array array['pvh_catalogs','pvh_catalog_values','pvh_catalog_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on table public.%I from public,anon,authenticated',t);
  execute format('grant select on table public.%I to authenticated',t);
  execute format('create policy %I on public.%I for select to authenticated using (pvh_private.has_permission(tenant_id,''m11:catalog:read'') or pvh_private.has_permission(tenant_id,''m11:catalog:manage''))',t||'_select',t);
 end loop;
end $$;

-- History records cannot be changed, even by another SQL application path.
create trigger pvh_catalog_events_immutable before update or delete or truncate
 on public.pvh_catalog_events for each statement
 execute function pvh_private.reject_log_mutation();

create function app.create_pvh_catalog(p_code text,p_label_vi text,p_description text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_row public.pvh_catalogs%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m11:catalog:manage')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_code is null or upper(btrim(p_code)) !~ '^[A-Z][A-Z0-9_]{1,39}$'
 or p_label_vi is null or length(btrim(p_label_vi)) not between 2 and 150
 or length(coalesce(p_description,''))>500
 then raise exception 'INVALID_CATALOG' using errcode='22023';end if;
 insert into public.pvh_catalogs(tenant_id,code,label_vi,description,created_by,updated_by)
 values(v_tenant,upper(btrim(p_code)),btrim(p_label_vi),coalesce(btrim(p_description),''),v_actor,v_actor)
 returning * into v_row;
 insert into public.pvh_catalog_events(tenant_id,catalog_id,actor_id,action,after_value)
 values(v_tenant,v_row.id,v_actor,'CREATE_CATALOG',to_jsonb(v_row));
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M11_CREATE_CATALOG','pvh_catalog',v_row.id::text,jsonb_build_object('code',v_row.code));
 return to_jsonb(v_row);
end;$$;

create function app.update_pvh_catalog(p_catalog_id uuid,p_expected_version integer,
 p_label_vi text,p_description text,p_is_active boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_old public.pvh_catalogs%rowtype;v_new public.pvh_catalogs%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m11:catalog:manage')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_expected_version is null or p_label_vi is null or length(btrim(p_label_vi)) not between 2 and 150
 or length(coalesce(p_description,''))>500 or p_is_active is null
 then raise exception 'INVALID_CATALOG' using errcode='22023';end if;
 select * into v_old from public.pvh_catalogs where tenant_id=v_tenant and id=p_catalog_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002';end if;
 if v_old.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='PV409';end if;
 if not p_is_active and exists(select 1 from public.pvh_catalog_values
 where tenant_id=v_tenant and catalog_id=v_old.id and is_active) then
 raise exception 'ACTIVE_VALUES_EXIST' using errcode='22023';end if;
 update public.pvh_catalogs set label_vi=btrim(p_label_vi),
 description=coalesce(btrim(p_description),''),is_active=p_is_active,
 version=version+1,updated_at=now(),updated_by=v_actor
 where id=v_old.id returning * into v_new;
 insert into public.pvh_catalog_events(tenant_id,catalog_id,actor_id,action,before_value,after_value)
 values(v_tenant,v_new.id,v_actor,'UPDATE_CATALOG',to_jsonb(v_old),to_jsonb(v_new));
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M11_UPDATE_CATALOG','pvh_catalog',v_new.id::text,
 jsonb_build_object('oldVersion',v_old.version,'newVersion',v_new.version));
 return to_jsonb(v_new);
end;$$;

create function app.create_pvh_catalog_value(p_catalog_id uuid,p_code text,p_label_vi text,
 p_parent_id uuid default null,p_sort_order integer default 0,p_valid_from date default null,p_valid_to date default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_row public.pvh_catalog_values%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m11:catalog:manage')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_code is null or upper(btrim(p_code)) !~ '^[A-Z0-9][A-Z0-9_-]{0,39}$'
 or p_label_vi is null or length(btrim(p_label_vi)) not between 1 and 150
 or p_sort_order is null or p_sort_order not between 0 and 999999
 or (p_valid_from is not null and p_valid_to is not null and p_valid_to<p_valid_from)
 then raise exception 'INVALID_VALUE' using errcode='22023';end if;
 if not exists(select 1 from public.pvh_catalogs where tenant_id=v_tenant and id=p_catalog_id and is_active)
 then raise exception 'INACTIVE_CATALOG' using errcode='22023';end if;
 if p_parent_id is not null and not exists(
 select 1 from public.pvh_catalog_values where tenant_id=v_tenant and catalog_id=p_catalog_id
 and id=p_parent_id and is_active) then raise exception 'INVALID_PARENT' using errcode='22023';end if;
 insert into public.pvh_catalog_values(tenant_id,catalog_id,code,label_vi,parent_id,sort_order,valid_from,valid_to,created_by,updated_by)
 values(v_tenant,p_catalog_id,upper(btrim(p_code)),btrim(p_label_vi),p_parent_id,p_sort_order,
 p_valid_from,p_valid_to,v_actor,v_actor) returning * into v_row;
 insert into public.pvh_catalog_events(tenant_id,catalog_id,value_id,actor_id,action,after_value)
 values(v_tenant,p_catalog_id,v_row.id,v_actor,'CREATE_VALUE',to_jsonb(v_row));
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M11_CREATE_VALUE','pvh_catalog_value',v_row.id::text,jsonb_build_object('code',v_row.code));
 return to_jsonb(v_row);
end;$$;

create function app.update_pvh_catalog_value(p_value_id uuid,p_expected_version integer,p_label_vi text,
 p_parent_id uuid,p_sort_order integer,p_is_active boolean,p_valid_from date,p_valid_to date)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_old public.pvh_catalog_values%rowtype;
 v_new public.pvh_catalog_values%rowtype;v_cycle boolean;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m11:catalog:manage')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_expected_version is null or p_label_vi is null or length(btrim(p_label_vi)) not between 1 and 150
 or p_sort_order is null or p_sort_order not between 0 and 999999 or p_is_active is null
 or (p_valid_from is not null and p_valid_to is not null and p_valid_to<p_valid_from)
 then raise exception 'INVALID_VALUE' using errcode='22023';end if;
 -- Serializes all parent changes within one catalog to prevent concurrent cycles.
 select * into v_old from public.pvh_catalog_values where tenant_id=v_tenant and id=p_value_id;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002';end if;
 perform 1 from public.pvh_catalogs where tenant_id=v_tenant and id=v_old.catalog_id for update;
 select * into v_old from public.pvh_catalog_values where tenant_id=v_tenant and id=p_value_id for update;
 if v_old.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='PV409';end if;
 if p_parent_id is not null then
  if not exists(select 1 from public.pvh_catalog_values
    where tenant_id=v_tenant and catalog_id=v_old.catalog_id and id=p_parent_id and is_active)
  then raise exception 'INVALID_PARENT' using errcode='22023';end if;
  with recursive ancestors as (
   select id,parent_id from public.pvh_catalog_values where tenant_id=v_tenant and catalog_id=v_old.catalog_id and id=p_parent_id
   union all
   select parent.id,parent.parent_id from public.pvh_catalog_values parent
   join ancestors a on a.parent_id=parent.id
   where parent.tenant_id=v_tenant and parent.catalog_id=v_old.catalog_id
  )
  select exists(select 1 from ancestors where id=p_value_id) into v_cycle;
  if v_cycle then raise exception 'CATALOG_CYCLE' using errcode='22023';end if;
 end if;
 if not p_is_active and exists(select 1 from public.pvh_catalog_values
 where tenant_id=v_tenant and catalog_id=v_old.catalog_id and parent_id=p_value_id and is_active)
 then raise exception 'ACTIVE_CHILDREN_EXIST' using errcode='22023';end if;
 update public.pvh_catalog_values set label_vi=btrim(p_label_vi),parent_id=p_parent_id,
 sort_order=p_sort_order,is_active=p_is_active,valid_from=p_valid_from,valid_to=p_valid_to,
 version=version+1,updated_at=now(),updated_by=v_actor where id=p_value_id returning * into v_new;
 insert into public.pvh_catalog_events(tenant_id,catalog_id,value_id,actor_id,action,before_value,after_value)
 values(v_tenant,v_new.catalog_id,v_new.id,v_actor,'UPDATE_VALUE',to_jsonb(v_old),to_jsonb(v_new));
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M11_UPDATE_VALUE','pvh_catalog_value',v_new.id::text,
 jsonb_build_object('oldVersion',v_old.version,'newVersion',v_new.version));
 return to_jsonb(v_new);
end;$$;

revoke execute on function app.create_pvh_catalog(text,text,text) from public,anon,authenticated;
revoke execute on function app.update_pvh_catalog(uuid,integer,text,text,boolean) from public,anon,authenticated;
revoke execute on function app.create_pvh_catalog_value(uuid,text,text,uuid,integer,date,date) from public,anon,authenticated;
revoke execute on function app.update_pvh_catalog_value(uuid,integer,text,uuid,integer,boolean,date,date) from public,anon,authenticated;
grant execute on function app.create_pvh_catalog(text,text,text) to authenticated;
grant execute on function app.update_pvh_catalog(uuid,integer,text,text,boolean) to authenticated;
grant execute on function app.create_pvh_catalog_value(uuid,text,text,uuid,integer,date,date) to authenticated;
grant execute on function app.update_pvh_catalog_value(uuid,integer,text,uuid,integer,boolean,date,date) to authenticated;
notify pgrst,'reload schema';
