#!/usr/bin/env bash
# Replays PVH migrations and active pgTAP contracts against Supabase local only.
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture="$project_root/supabase/_ci_fixtures/rls_event_trigger.sql"
temporary_migration="$project_root/supabase/migrations/20261108000000_ci_only_cloud_prerequisite.sql"

if ! command -v supabase >/dev/null 2>&1; then
  printf 'Cần cài Supabase CLI để xác minh CSDL local.\n' >&2
  exit 1
fi
if [[ ! -f "$fixture" || -e "$temporary_migration" ]]; then
  printf 'Thiếu fixture hoặc migration tạm đã tồn tại; dừng để bảo vệ tệp người dùng.\n' >&2
  exit 1
fi

cleanup() {
  # Remove only the exact temporary file created by this invocation.
  if [[ -f "$temporary_migration" ]]; then rm -f -- "$temporary_migration"; fi
}
trap cleanup EXIT

cp -- "$fixture" "$temporary_migration"
cd "$project_root"

printf 'Dùng Supabase local cô lập; không truyền URL/linked target.\n'
printf 'CẢNH BÁO: supabase db reset sẽ xóa dữ liệu trong CSDL local của project này.\n'
env SUPABASE_ACCESS_TOKEN='' supabase db start
env SUPABASE_ACCESS_TOKEN='' supabase db reset
env SUPABASE_ACCESS_TOKEN='' supabase test db

printf 'PASS: local migration replay và các pgTAP contract hiện hành.\n'
