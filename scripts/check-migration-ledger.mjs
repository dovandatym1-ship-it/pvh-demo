import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const canonical = new Set([
  "20261108054202_pvh_single_commune_account_foundation.sql",
  "20261108054701_pvh_single_commune_scope_context.sql",
  "20261108060000_m01_core_workflow.sql",
  "20261108070000_ph03_domain_verticals.sql",
  "20261108075000_ph04_imports.sql",
  "20261108080000_ph04_reporting.sql",
  "20261108081000_ph04_jobs.sql",
  "20261108104745_ph01_security_contract.sql",
  "20261109130000_pvh_user_notifications.sql",
  "20261110103000_m11_shared_catalogs.sql",
  "20261110110000_m07_safe_domain_foundation.sql",
  "20261110120000_m06_social_intake.sql",
  "20261110130000_m03_education_review.sql",
]);
const archiveHashes = {
  "20261108000001_walking_skeleton_core.sql": "f0ccadf9d023e7f278884368a0f1f78c6b78f93a",
  "20261108000002_m01_core_work_full.sql": "2ce3fe5a928ec6e8d93043d685d5889b301b344a",
  "20261108000003_m04_culture_and_reporting.sql": "8b6260ec4fb221755bc0c48bbe993cc029eae533",
  "20261108000004_m07_ethnicity_faith.sql": "fe413c9f263fec7d00019d9b410da4fa5144068f",
  "20261108000005_m06_health_social.sql": "fe3480500f91dfc7c2ff9a8ee978b9c39a0895ff",
  "20261108000006_m03_education.sql": "f670872f5f1c3a700f65e43d160f9f72ffe5ef44",
  "20261108000007_m02_internal_affairs.sql": "e87516d6994180fc13885d69d1573d8415109f47",
  "20261108000008_m05_science_digital.sql": "d66d97482dd757fadaf1a2fa6cdb888c83a719cd",
  "20261108000009_m08_inspections.sql": "25e7d177d2f9379eeba8ef46e80170b01f677a6a",
};
const activeDir = "supabase/migrations";
const archivedDir = "supabase/_legacy/superseded_20261108";
const sqlFiles = (dir) => fs.readdirSync(dir).filter(name => name.endsWith(".sql")).sort();
const issues = [];

const active = sqlFiles(activeDir);
for (const name of active) {
  if (!canonical.has(name)) issues.push(`Unexpected active migration: ${name}`);
}
for (const name of canonical) {
  if (!active.includes(name)) issues.push(`Canonical migration missing: ${name}`);
}
if (new Set(active.map(name => name.slice(0, 14))).size !== active.length) {
  issues.push("Multiple active migrations share one version.");
}
for (const [name, expectedBlobSha] of Object.entries(archiveHashes)) {
  const file = path.join(archivedDir, name);
  if (!fs.existsSync(file)) {
    issues.push(`Archived migration missing: ${name}`);
    continue;
  }
  const buf = fs.readFileSync(file);
  const header = Buffer.from(`blob ${buf.length}\0`);
  const actual = createHash("sha1").update(header).update(buf).digest("hex");
  if (actual !== expectedBlobSha) issues.push(`Archive has changed: ${name}`);
  if (active.includes(name)) issues.push(`Superseded migration still active: ${name}`);
}
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${active.length} canonical migrations, ${Object.keys(archiveHashes).length} immutable archived migrations; no version collisions.`);
console.log("STATIC ONLY: clean Supabase replay, cloud migration history and RLS still require isolated runtime verification.");
