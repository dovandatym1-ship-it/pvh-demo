#!/usr/bin/env bash
set -euo pipefail

# Read-only Cloud Inspection Verification for PVH Demo
# Compliance: Decisions D-05, D-06 (Strict Read-Only Probe)

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://zynzpifmccbcvgddmxic.supabase.co}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-sb_publishable_wZwgnkBNwunSiCG4A0TvkA_lk4i_dOh}"

echo "=========================================================="
echo "PVH DEMO: READ-ONLY CLOUD SUPABASE INSPECTION (D-05/D-06)"
echo "Target URL: $SUPABASE_URL"
echo "Mode: STRICT READ-ONLY (GET requests only, zero mutations)"
echo "=========================================================="

AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $SUPABASE_KEY" "$SUPABASE_URL/auth/v1/health")
echo "[1] Auth Service Health (/auth/v1/health): HTTP $AUTH_STATUS"

TENANTS_RESP=$(curl -s -w "\n%{http_code}" -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" "$SUPABASE_URL/rest/v1/tenants?select=*")
TENANTS_HTTP=$(echo "$TENANTS_RESP" | tail -n1)
echo "[2] Schema Probe (public.tenants): HTTP $TENANTS_HTTP"

PROFILES_RESP=$(curl -s -w "\n%{http_code}" -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" "$SUPABASE_URL/rest/v1/profiles?select=*")
PROFILES_HTTP=$(echo "$PROFILES_RESP" | tail -n1)
echo "[3] Schema Probe (public.profiles): HTTP $PROFILES_HTTP"

echo "=========================================================="
echo "D-05 ASSESSMENT RESULT:"
if [[ "$TENANTS_HTTP" == "404" && "$PROFILES_HTTP" == "404" ]]; then
  echo "STATUS: CLOUD SCHEMA EMPTY (No application tables detected)."
  echo "DECISION D-05 PATH: Replace 2 legacy migrations with fresh baseline;"
  echo "                    archive legacy migrations into supabase/_legacy/."
else
  echo "STATUS: CLOUD SCHEMA DETECTED (Tables exist)."
  echo "DECISION D-05 PATH: Plan incremental migration."
fi
echo "=========================================================="
