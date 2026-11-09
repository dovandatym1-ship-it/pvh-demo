#!/usr/bin/env bash
# PH01 local-only DB verification. Never accepts a remote DB target.
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
prerequisite="$project_root/supabase/_ci_fixtures/rls_event_trigger.sql"
temporary_migration="$project_root/supabase/migrations/20261108000000_ci_only_cloud_prerequisite.sql"

if ! command -v supabase >/dev/null 2>&1; then
  printf 'Cần cài Supabase CLI để xác minh CSDL local.\n' >&2
  exit 1
fi
if [[ ! -f "$prerequisite" || -e "$temporary_migration" ]]; then
  printf 'Thiếu fixture hoặc migration tạm đã tồn tại; dừng để bảo vệ tệp người dùng.\n' >&2
  exit 1
fi

cleanup() {
  # Remove ONLY the exact temporary file this script just created.
  if [[ -f "$temporary_migration" ]]; then rm -f -- "$temporary_migration"; fi
}
trap cleanup EXIT

cp -- "$prerequisite" "$temporary_migration"
cd "$project_root"

printf 'PH01: khởi tạo CSDL PostgreSQL CỤC BỘ cô lập.\n'
supabase db start
printf 'PH01: chạy lại toàn bộ migration trên CSDL LOCAL (xóa dữ liệu local).\n'
supabase db reset
printf 'PH01: chạy hợp đồng pgTAP trên CSDL LOCAL.\n'
supabase test db

printf 'PH01: DB local migration + pgTAP đã thành công.\n'
