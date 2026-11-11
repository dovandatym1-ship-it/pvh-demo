import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Source-level regression sentinels only. Real PostgreSQL/RLS and 3-persona
// browser E2E are still mandatory before Gate G2 can be approved.
const sql = readFileSync(new URL("../supabase/migrations/20261108060000_m01_core_workflow.sql", import.meta.url), "utf8");

function definition(name) {
  let start = sql.indexOf(`create function ${name}`);
  if (start === -1) start = sql.indexOf(`create or replace function ${name}`);
  assert.notEqual(start, -1, `Missing SQL function ${name}`);
  const end = sql.indexOf("$$;", start);
  assert.notEqual(end, -1, `Incomplete SQL function ${name}`);
  return sql.slice(start, end + 3);
}

test("assignment validates role permissions and hamlet scope on create and reassign", () => {
  const eligible = definition("pvh_private.is_eligible_work_assignee(");
  assert.match(eligible, /m01:work:read/);
  assert.match(eligible, /m01:work:update/);
  assert.match(eligible, /org_unit_ids/);
  assert.match(sql, /create trigger work_item_assignee_guard before insert or update of assigned_to,hamlet_id/);
  assert.match(definition("app.assign_work_item("), /is_eligible_work_assignee\(v_tenant,p_assigned_to,v_item.hamlet_id\)/);
});

test("work item visibility check precedes conflict and transition details", () => {
  const body = definition("app.transition_work_item(");
  const row = body.indexOf("select * into v_item from public.work_items");
  const access = body.indexOf("if not pvh_private.can_access_work(v_tenant,p_id,'read')", row);
  const version = body.indexOf("if v_item.version<>p_expected_version", row);
  assert.ok(row >= 0 && access > row && version > access);
});

test("transition holds a row lock through the optimistic version check and write", () => {
  const body = definition("app.transition_work_item(");
  const select = body.indexOf("select * into v_item from public.work_items");
  const lock = body.indexOf("for update", select);
  const version = body.indexOf("if v_item.version<>p_expected_version", select);
  const update = body.indexOf("update public.work_items set status=p_to_state", select);
  assert.ok(select >= 0 && lock > select && version > lock && update > version);
  assert.match(body, /where id=p_id and tenant_id=v_tenant for update/);
});

test("review recipients must be authorized and cannot be the assignee", () => {
  const body = definition("app.transition_work_item(");
  assert.match(body, /m01:work:review/);
  assert.match(body, /m01:work:read_all/);
  assert.match(body, /m.user_id is distinct from v_item.assigned_to/);
  assert.match(body, /VALIDATION_NO_ELIGIBLE_REVIEWER/);
  assert.match(body, /insert into public.work_item_inbox[\s\S]*select distinct v_tenant,p_id,m.user_id,v_item.version,'REVIEW_REQUESTED'/);
});

test("migration backfills uploaded legacy evidence and keeps unknown files pending", () => {
  assert.match(sql, /update public.evidence_files f[\s\S]*from storage.objects o/);
  assert.match(sql, /o.name = f.object_path/);
  assert.match(sql, /and \(p_action<>'read' or f.status='UPLOADED'\)/);
});

test("guard helpers cannot be called directly by API roles", () => {
  for (const signature of [
    "pvh_private.member_has_work_permission(uuid,uuid,text)",
    "pvh_private.is_eligible_work_assignee(uuid,uuid,uuid)",
    "pvh_private.validate_work_assignee()",
  ]) {
    assert.ok(sql.includes(`revoke all on function ${signature} from public,anon,authenticated;`));
  }
});

test("deadline and hamlet updates require OCC, reason, atomic event and inbox", () => {
  const body = definition("app.update_work_item_details(");
  assert.match(body, /nullif\(btrim\(p_reason\),''\) is null/);
  assert.match(body, /v_item.version<>p_expected_version/);
  assert.match(body, /update public.work_items set due_date=p_due_date,hamlet_id=p_hamlet_id/);
  assert.match(body, /insert into public.work_item_events/);
  assert.match(body, /insert into public.work_item_inbox/);
  assert.match(body, /work_item_mutation_requests/);
});

test("pending upload cleanup refuses to remove metadata while an object exists", () => {
  const body = definition("app.abandon_pending_evidence(");
  assert.match(body, /v_file.status<>'PENDING'/);
  assert.match(body, /v_file.uploaded_by<>auth.uid\(\)/);
  assert.match(body, /exists\(select 1 from storage.objects/);
  assert.match(body, /delete from public.evidence_files/);
  assert.match(sql, /pvh_evidence_pending_owner_delete/);
  assert.match(sql, /pvh_evidence_pending_owner_read/);
});

test("source reference is atomic and checked on an idempotency replay", () => {
  const body = definition("app.create_work_item_v2(");
  assert.match(sql, /add column source_ref text check/);
  assert.match(body, /v_original:=app.create_work_item\(/);
  assert.match(body, /if v_current is distinct from v_source_ref then/);
  assert.match(body, /raise exception 'IDEMPOTENCY_CONFLICT'/);
  assert.match(body, /update public.work_items set source_ref=v_source_ref/);
});

test("inbox read receipts preserve immutable notifications and RLS", () => {
  const body = definition("app.mark_work_inbox_read(");
  assert.match(sql, /create table public.work_item_inbox_reads/);
  assert.match(sql, /alter table public.work_item_inbox_reads force row level security/);
  assert.match(body, /recipient_id=auth.uid\(\)/);
  assert.match(body, /on conflict\(inbox_id\) do nothing/);
  assert.match(body, /MARK_INBOX_READ/);
  assert.doesNotMatch(body, /update public.work_item_inbox /);
});

test("collaborators gain read-only scoped access through versioned changes", () => {
  const edit = definition("app.set_work_collaborators(");
  const access = definition("pvh_private.can_access_work(");
  assert.match(sql, /create table public.work_item_collaborators/);
  assert.match(sql, /create policy collaborator_work_read/);
  assert.match(access, /p_action='read' and exists\(select 1 from public.work_item_collaborators/);
  assert.match(access, /m.scopes \? 'org_unit_ids'/);
  assert.match(edit, /pvh_private.is_eligible_work_collaborator/);
  assert.match(edit, /v_item.version<>p_expected_version/);
  assert.match(edit, /insert into public.work_item_events/);
  assert.match(edit, /COLLABORATOR_ADDED/);
  assert.match(sql, /revoke all on function pvh_private.is_eligible_work_collaborator/);
});
