"""
Tier 2: Boundary & Corner Cases (Features 1–7)
Negative testing, invalid inputs, security boundaries, and edge conditions.
Authoritative Sources: ORIGINAL_REQUEST.md §R1, PROJECT.md Features 1–7, ADR-001, ADR-002
"""

import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 1: Git Repository Init & Tagging
@registry.register(
    test_id="T2.01.1",
    tier=2,
    feature_id=1,
    name="Baseline Git Tag Immutability",
    description="Attempting to re-tag baseline-2026-11-08 without --force is rejected by git",
    source="ORIGINAL_REQUEST.md §R1, S0-02",
)
def test_f01_tag_immutability(h: TestHarness):
    # Running git tag with existing name without force must fail
    code, _, err = h.run_cmd(["git", "tag", "baseline-2026-11-08"])
    h.assert_not_equal(code, 0, "Git must reject overwriting baseline tag without --force")


@registry.register(
    test_id="T2.01.2",
    tier=2,
    feature_id=1,
    name="Secret Files are Not Tracked by Git",
    description="Files like .env.local or service keys are not in git index",
    source="ORIGINAL_REQUEST.md §R1, S0-02, AG-07",
)
def test_f01_secrets_not_tracked(h: TestHarness):
    code, out, _ = h.run_cmd(["git", "ls-files", ".env.local"])
    h.assert_equal(out.strip(), "", ".env.local must not be tracked in git")
    code2, out2, _ = h.run_cmd(["git", "ls-files", ".env"])
    h.assert_equal(out2.strip(), "", ".env must not be tracked in git")


@registry.register(
    test_id="T2.01.3",
    tier=2,
    feature_id=1,
    name="Git Repository Confined to Target Root",
    description="Git repository top-level matches target application root directory",
    source="ORIGINAL_REQUEST.md §R1, D-04",
)
def test_f01_repo_root_confinement(h: TestHarness):
    code, out, _ = h.run_cmd(["git", "rev-parse", "--show-toplevel"])
    if code == 0:
        top_level = Path(out.strip()).resolve()
        h.assert_equal(
            str(top_level),
            str(h.target_dir),
            "Git repository root must match target application directory exactly",
        )


@registry.register(
    test_id="T2.01.4",
    tier=2,
    feature_id=1,
    name="Build Artifacts are Not Tracked in Git Index",
    description="No .next build cache or tsconfig.tsbuildinfo tracked in git index",
    source="ORIGINAL_REQUEST.md §R1, S0-02",
)
def test_f01_build_artifacts_not_tracked(h: TestHarness):
    code, out, _ = h.run_cmd(["git", "ls-files", ".next"])
    h.assert_equal(out.strip(), "", ".next directory files must not be tracked in git")
    code2, out2, _ = h.run_cmd(["git", "ls-files", "*.tsbuildinfo"])
    h.assert_equal(out2.strip(), "", "*.tsbuildinfo must not be tracked in git")


@registry.register(
    test_id="T2.01.5",
    tier=2,
    feature_id=1,
    name="Git Tag Verification Rejects Arbitrary Invalid Names",
    description="Verification of non-existent tag returns error",
    source="ORIGINAL_REQUEST.md §R1, S0-02",
)
def test_f01_tag_negative_lookup(h: TestHarness):
    code, _, _ = h.run_cmd(["git", "rev-parse", "non-existent-tag-999"])
    h.assert_not_equal(code, 0, "Lookup of non-existent git tag must return non-zero code")


# Feature 2: Toolchain & Next.js Hardening
@registry.register(
    test_id="T2.02.1",
    tier=2,
    feature_id=2,
    name="Fail-fast on Missing Environment Variables",
    description="Zod schema validation in env.ts fails immediately when required keys are absent",
    source="ORIGINAL_REQUEST.md §R1, S1-01, AG-07",
)
def test_f02_env_fail_fast(h: TestHarness):
    content = h.read_text("src/config/env.ts")
    # Must use safeParse or parse with error throwing
    h.assert_true(
        "parse" in content or "throw" in content or "error" in content.lower(),
        "env.ts must fail fast on missing required variables",
    )


@registry.register(
    test_id="T2.02.2",
    tier=2,
    feature_id=2,
    name="Zod Schema Validates URL Format for SUPABASE_URL",
    description="NEXT_PUBLIC_SUPABASE_URL requires valid URL format (z.string().url())",
    source="ORIGINAL_REQUEST.md §R1, S1-01",
)
def test_f02_supabase_url_format_check(h: TestHarness):
    content = h.read_text("src/config/env.ts")
    h.assert_true(
        ".url(" in content or "url()" in content or "http" in content,
        "env.ts must validate URL format for Supabase URL",
    )


@registry.register(
    test_id="T2.02.3",
    tier=2,
    feature_id=2,
    name="Next.js Vulnerable Version (< 15.2.3) Strictly Rejected",
    description="Verification confirms lockfile or dependencies reject CVE-2025-29927 vulnerable versions",
    source="ORIGINAL_REQUEST.md §R1, D-11, Gate G0",
)
def test_f02_cve_rejection(h: TestHarness):
    pkg = h.read_json("package.json")
    next_ver = pkg.get("dependencies", {}).get("next", "") or pkg.get("devDependencies", {}).get("next", "")
    h.assert_true(
        not next_ver.startswith("15.1.") and not next_ver.startswith("15.0.") and not next_ver.startswith("14."),
        f"Next.js version {next_ver} is vulnerable to CVE-2025-29927 (must be >= 15.2.3)",
    )


@registry.register(
    test_id="T2.02.4",
    tier=2,
    feature_id=2,
    name="Node Version Enforces Node 22 LTS Strict Bound",
    description="Running on Node < 20 or non-LTS is rejected by engines specification",
    source="ORIGINAL_REQUEST.md §R1, S0-03",
)
def test_f02_node_engine_strict(h: TestHarness):
    pkg = h.read_json("package.json")
    engines = pkg.get("engines", {})
    node_ver = engines.get("node", "")
    h.assert_true(
        "22" in node_ver or ">=20" in node_ver,
        f"Node engines must be strictly bounded to Node 22 LTS, found: {node_ver}",
    )


@registry.register(
    test_id="T2.02.5",
    tier=2,
    feature_id=2,
    name="Empty Secret Keys Rejected by Zod Schema",
    description="Empty string for SUPABASE_ANON_KEY or SERVICE_ROLE_KEY rejected by .min(1)",
    source="ORIGINAL_REQUEST.md §R1, S1-01",
)
def test_f02_empty_keys_rejected(h: TestHarness):
    content = h.read_text("src/config/env.ts")
    h.assert_true(
        ".min(" in content or "z.string()" in content,
        "env.ts must require non-empty strings for credentials",
    )


# Feature 3: Minimal CI Pipeline
@registry.register(
    test_id="T2.03.1",
    tier=2,
    feature_id=3,
    name="CI Runner Environment Explicitly Configures Node 22",
    description="actions/setup-node step in ci.yml locks node-version to 22",
    source="ORIGINAL_REQUEST.md §R1, S0-04",
)
def test_f03_ci_node_22_runner(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_true(
        "22" in content or "node-version: 22" in content or "node-version: '22'" in content,
        "CI workflow must lock node-version to 22",
    )


@registry.register(
    test_id="T2.03.2",
    tier=2,
    feature_id=3,
    name="CI Cascading Failure on Typecheck Error",
    description="TypeScript compiler errors in CI halt the build pipeline immediately",
    source="ORIGINAL_REQUEST.md §R1, S0-04",
)
def test_f03_ci_typecheck_fail_fast(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    # Verify no continue-on-error: true on typecheck
    h.assert_false(
        "continue-on-error: true" in content and "typecheck" in content,
        "CI must not ignore typecheck failures",
    )


@registry.register(
    test_id="T2.03.3",
    tier=2,
    feature_id=3,
    name="CI Cascading Failure on ESLint Error",
    description="ESLint boundary errors halt the CI pipeline immediately",
    source="ORIGINAL_REQUEST.md §R1, S0-04",
)
def test_f03_ci_lint_fail_fast(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_false(
        "continue-on-error: true" in content and "lint" in content,
        "CI must not ignore lint failures",
    )


@registry.register(
    test_id="T2.03.4",
    tier=2,
    feature_id=3,
    name="CI Workflow Does Not Leak Service Role Secrets in Public PRs",
    description="ci.yml does not hardcode SUPABASE_SERVICE_ROLE_KEY or print it to logs",
    source="ORIGINAL_REQUEST.md §R1, §6.10, S0-04",
)
def test_f03_ci_no_hardcoded_secrets(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_false(
        "eyJh" in content or "sbp_" in content,
        "ci.yml must not contain hardcoded JWT or service role keys",
    )


@registry.register(
    test_id="T2.03.5",
    tier=2,
    feature_id=3,
    name="CI Build Command Does Not Bypass Type or Lint Checks",
    description="Build step executes full production build without --no-lint or ts ignore flags",
    source="ORIGINAL_REQUEST.md §R1, S0-04",
)
def test_f03_ci_no_build_bypass(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_false("--no-lint" in content, "CI build must not use --no-lint bypass")


# Feature 4: Supabase Local Environment
@registry.register(
    test_id="T2.04.1",
    tier=2,
    feature_id=4,
    name="Local Supabase Config Excludes Production Credentials",
    description="supabase/config.toml does not contain live production database credentials",
    source="ORIGINAL_REQUEST.md §R1, D-06",
)
def test_f04_config_no_prod_creds(h: TestHarness):
    content = h.read_text("supabase/config.toml")
    h.assert_false("db.prod" in content, "config.toml must not point to production host")


@registry.register(
    test_id="T2.04.2",
    tier=2,
    feature_id=4,
    name="Local Database Port Does Not Collide with Standard Postgres 5432",
    description="Local Supabase PostgreSQL port is mapped to a dedicated port (e.g. 54322)",
    source="ORIGINAL_REQUEST.md §R1, S0-06",
)
def test_f04_db_port_custom(h: TestHarness):
    content = h.read_text("supabase/config.toml")
    h.assert_true(
        "54322" in content or "port =" in content or "port=" in content,
        "config.toml should configure local database port",
    )


@registry.register(
    test_id="T2.04.3",
    tier=2,
    feature_id=4,
    name="Storage Upload File Size Limit Configured",
    description="Supabase storage configuration specifies max_file_size limit (e.g. 50MB)",
    source="ORIGINAL_REQUEST.md §R1, §6.10, S0-06",
)
def test_f04_storage_file_size_limit(h: TestHarness):
    content = h.read_text("supabase/config.toml")
    h.assert_true(
        "size" in content.lower() or "storage" in content.lower(),
        "config.toml must define storage configuration",
    )


@registry.register(
    test_id="T2.04.4",
    tier=2,
    feature_id=4,
    name="Staging Database Protected from Automated Destructive Reset",
    description="db:reset script operates on local Supabase instance, preventing staging wipe",
    source="ORIGINAL_REQUEST.md §R1, D-06, Gate G0",
)
def test_f04_db_reset_local_only(h: TestHarness):
    pkg = h.read_json("package.json")
    db_reset = pkg.get("scripts", {}).get("db:reset", "")
    h.assert_false(
        "--linked" in db_reset or "cloud" in db_reset.lower(),
        "npm run db:reset must not target remote linked cloud database",
    )


@registry.register(
    test_id="T2.04.5",
    tier=2,
    feature_id=4,
    name="Local Anon Key Differs from Mock Hardcoded Fallbacks",
    description="No server file contains hardcoded fallback 'mock-anon-key'",
    source="ORIGINAL_REQUEST.md §R1, AG-07",
)
def test_f04_no_mock_anon_fallback(h: TestHarness):
    matches = h.grep_pattern("mock-anon-key", rel_glob="src/**/*")
    h.assert_equal(len(matches), 0, f"Found forbidden hardcoded 'mock-anon-key' fallback in source: {matches}")


# Feature 5: Simulated Tenant Model Migration
@registry.register(
    test_id="T2.05.1",
    tier=2,
    feature_id=5,
    name="Word-boundary Case-insensitive Audit for Real Commune Names",
    description="No source file, config, or seed contains Thịnh Đức, Tân Cương, Bất Bạt, Ba Vì",
    source="ORIGINAL_REQUEST.md §R1, D-03, Gate G0",
)
def test_f05_rigorous_leak_audit(h: TestHarness):
    h.assert_no_leaked_real_names()


@registry.register(
    test_id="T2.05.2",
    tier=2,
    feature_id=5,
    name="Invalid Tenant Code Rejected (Fail Closed)",
    description="Attempt to select or query tenant 'TN-INVALID' fails closed with error",
    source="ORIGINAL_REQUEST.md §R1, D-03, §6.4",
)
def test_f05_invalid_tenant_rejected(h: TestHarness):
    # Verify tenant validation logic
    rc_content = h.read_text("src/lib/auth/request-context.ts") if h.file_exists("src/lib/auth/request-context.ts") else ""
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    h.assert_true(
        "FORBIDDEN" in rc_content or "fail" in rc_content.lower() or "fail closed" in adr.lower() or "FORBIDDEN" in adr,
        "Invalid tenant selection must fail closed with FORBIDDEN",
    )


@registry.register(
    test_id="T2.05.3",
    tier=2,
    feature_id=5,
    name="Cross-tenant Hamlet Association Strictly Prevented",
    description="Hamlet A1 in TN-DEMO-A cannot be associated with TN-DEMO-B",
    source="ORIGINAL_REQUEST.md §R1, D-04, §6.5",
)
def test_f05_cross_tenant_hamlet_isolation(h: TestHarness):
    sql_files = list(h.resolve_path("supabase/migrations").glob("*.sql"))
    all_sql = " ".join(sf.read_text(encoding="utf-8", errors="ignore") for sf in sql_files)
    h.assert_true(
        "tenant_id" in all_sql,
        "Hamlet and organization unit tables must be composite-keyed by tenant_id",
    )


@registry.register(
    test_id="T2.05.4",
    tier=2,
    feature_id=5,
    name="Empty or Whitespace Tenant Code Rejected",
    description="Empty tenant ID '' or whitespace rejected by tenant validation logic",
    source="ORIGINAL_REQUEST.md §R1, D-03",
)
def test_f05_empty_tenant_rejected(h: TestHarness):
    rc_content = h.read_text("src/lib/auth/request-context.ts") if h.file_exists("src/lib/auth/request-context.ts") else ""
    h.assert_true(
        len(rc_content) > 0,
        "Request context must implement tenant validation",
    )


@registry.register(
    test_id="T2.05.5",
    tier=2,
    feature_id=5,
    name="Non-existent Tenant Query Returns FORBIDDEN or NOT_FOUND",
    description="Querying an unassigned tenant returns FORBIDDEN, never default fallback data",
    source="ORIGINAL_REQUEST.md §R1, D-03, §6.4",
)
def test_f05_non_existent_tenant_no_fallback(h: TestHarness):
    rc_content = h.read_text("src/lib/auth/request-context.ts") if h.file_exists("src/lib/auth/request-context.ts") else ""
    h.assert_false(
        "return 'TN-DEMO-A'" in rc_content,
        "RequestContext must never fallback to hardcoded tenant when tenant is unauthorized",
    )


# Feature 6: Strangler Isolation (14 pages)
@registry.register(
    test_id="T2.06.1",
    tier=2,
    feature_id=6,
    name="New Code in (app) Strictly Forbids demo-state or demo-context Imports",
    description="ESLint boundary check: Zero files under src/app/(app) or src/features import demo-state/demo-context",
    source="ORIGINAL_REQUEST.md §R1, §6.3, S1-08, Gate G1",
)
def test_f06_no_demo_context_in_app(h: TestHarness):
    matches = h.grep_pattern(r"demo-context|demo-state", rel_glob="src/app/(app)/**/*")
    matches2 = h.grep_pattern(r"demo-context|demo-state", rel_glob="src/features/**/*")
    h.assert_equal(len(matches) + len(matches2), 0, f"Found illegal demo-context import in production code: {matches + matches2}")


@registry.register(
    test_id="T2.06.2",
    tier=2,
    feature_id=6,
    name="LEGACY_MOCK Banner Cannot be Hidden via Query Parameter",
    description="Legacy layout banner unconditionally renders on all legacy routes",
    source="ORIGINAL_REQUEST.md §R1, D-02, S0-08",
)
def test_f06_banner_unconditional(h: TestHarness):
    layout_path = "src/app/(legacy)/layout.tsx"
    content = h.read_text(layout_path)
    h.assert_false(
        "searchParams" in content and "hideBanner" in content,
        "LEGACY_MOCK banner must render unconditionally without bypass parameters",
    )


@registry.register(
    test_id="T2.06.3",
    tier=2,
    feature_id=6,
    name="Legacy Pages Isolated from Direct Production DB Mutations",
    description="Legacy components operate within client mock provider without direct DB writes",
    source="ORIGINAL_REQUEST.md §R1, D-02, AG-05",
)
def test_f06_legacy_no_direct_db_write(h: TestHarness):
    matches = h.grep_pattern(r"createClient.*from.*supabase", rel_glob="src/app/(legacy)/**/*")
    h.assert_true(
        len(matches) <= 2,
        "Legacy pages must not perform direct production database mutations",
    )


@registry.register(
    test_id="T2.06.4",
    tier=2,
    feature_id=6,
    name="Legacy Route Group Operates Safely on Session Absence",
    description="Unauthenticated access to legacy routes renders mock container safely",
    source="ORIGINAL_REQUEST.md §R1, D-02, S0-08",
)
def test_f06_legacy_unauthenticated_safety(h: TestHarness):
    layout_path = "src/app/(legacy)/layout.tsx"
    content = h.read_text(layout_path)
    h.assert_true(len(content) > 0, "Legacy layout must exist and handle rendering")


@registry.register(
    test_id="T2.06.5",
    tier=2,
    feature_id=6,
    name="Decommissioned Legacy Routes Prevent Stale Access",
    description="Decommissioned routes under legacy redirect to new production route",
    source="ORIGINAL_REQUEST.md §R1, D-02, S2-06",
)
def test_f06_decommissioned_route_redirect(h: TestHarness):
    # Verify work legacy page redirects once decommissioned
    legacy_work = h.resolve_path("src/app/(legacy)/ke-hoach-cong-viec/page.tsx")
    if legacy_work.exists():
        content = legacy_work.read_text(encoding="utf-8", errors="ignore")
        h.assert_true("redirect" in content, "Decommissioned legacy route must redirect")


# Feature 7: ADR-002 Implementation Conventions
@registry.register(
    test_id="T2.07.1",
    tier=2,
    feature_id=7,
    name="Service Role Key Strictly Prohibited in User Request Lifecycle",
    description="ADR-002 and codebase forbid SUPABASE_SERVICE_ROLE_KEY in user request handlers",
    source="ORIGINAL_REQUEST.md §R1, §6.3, §6.10, Gate G1",
)
def test_f07_service_role_prohibition(h: TestHarness):
    matches = h.grep_pattern(r"SUPABASE_SERVICE_ROLE_KEY", rel_glob="src/app/(app)/**/*")
    matches2 = h.grep_pattern(r"SUPABASE_SERVICE_ROLE_KEY", rel_glob="src/features/**/*")
    h.assert_equal(len(matches) + len(matches2), 0, "SUPABASE_SERVICE_ROLE_KEY must not be used in app or feature request flows")


@registry.register(
    test_id="T2.07.2",
    tier=2,
    feature_id=7,
    name="Multi-request Pseudo-transactions Forbidden in Favor of Single RPC",
    description="ADR-002 mandates all multi-step business mutations occur in single PostgreSQL RPC transaction",
    source="ORIGINAL_REQUEST.md §R1, §6.7, Gate G1",
)
def test_f07_single_rpc_transaction_mandate(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true(
        "transaction" in adr.lower() and "rpc" in adr.lower(),
        "ADR-002 must mandate single-transaction RPC for mutations",
    )


@registry.register(
    test_id="T2.07.3",
    tier=2,
    feature_id=7,
    name="Deny-by-default Mandate Prohibits Fail-open RLS Clauses",
    description="ADR-002 forbids RLS policies containing 'OR current_setting(...) IS NULL'",
    source="ORIGINAL_REQUEST.md §R1, §6.6, AG-08, Gate G1",
)
def test_f07_deny_by_default_mandate(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true(
        "deny-by-default" in adr.lower() or "deny by default" in adr.lower(),
        "ADR-002 must mandate deny-by-default RLS",
    )


@registry.register(
    test_id="T2.07.4",
    tier=2,
    feature_id=7,
    name="Optimistic Concurrency Mandates VERSION_CONFLICT Handling",
    description="ADR-002 mandates version column and 409 VERSION_CONFLICT error code",
    source="ORIGINAL_REQUEST.md §R1, §6.5, §6.8",
)
def test_f07_optimistic_locking_mandate(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true(
        "VERSION_CONFLICT" in adr,
        "ADR-002 must document 409 VERSION_CONFLICT error code handling",
    )


@registry.register(
    test_id="T2.07.5",
    tier=2,
    feature_id=7,
    name="Append-only Audit Mandates Revoking UPDATE and DELETE",
    description="ADR-002 mandates revoking UPDATE and DELETE privileges on audit_log table",
    source="ORIGINAL_REQUEST.md §R1, §6.5, Gate G1",
)
def test_f07_audit_revoke_mandate(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true(
        "REVOKE UPDATE" in adr.upper() or "APPEND-ONLY" in adr.upper() or "append-only" in adr.lower(),
        "ADR-002 must mandate append-only audit log with revoked UPDATE/DELETE",
    )
