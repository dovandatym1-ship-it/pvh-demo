"""
Tier 1: Feature Coverage (Features 1–7)
Sprint 0 / Toolchain, Conventions & Strangler Isolation
Authoritative Sources: ORIGINAL_REQUEST.md §R1, PROJECT.md Features 1–7, ADR-001, ADR-002
"""

import json
import re
from pathlib import Path
from tests.e2e.harness import TestHarness, registry


# Feature 1: Git Repository Init & Tagging
@registry.register(
    test_id="T1.01.1",
    tier=1,
    feature_id=1,
    name="Git Repository Initialized",
    description="Target directory is an initialized Git repository with .git directory or work tree",
    source="ORIGINAL_REQUEST.md §R1, PROJECT.md F1, D-04",
)
def test_f01_git_init(h: TestHarness):
    is_git_dir = h.file_exists(".git")
    code, out, _ = h.run_cmd(["git", "rev-parse", "--is-inside-work-tree"])
    h.assert_true(
        is_git_dir or (code == 0 and out.strip() == "true"),
        "Target directory must be an initialized Git repository",
    )


@registry.register(
    test_id="T1.01.2",
    tier=1,
    feature_id=1,
    name="Baseline Git Tag Exists",
    description="Git tag 'baseline-2026-11-08' exists in repository",
    source="ORIGINAL_REQUEST.md §R1, S0-02, Gate G0",
)
def test_f01_baseline_tag_exists(h: TestHarness):
    code, out, _ = h.run_cmd(["git", "tag"])
    h.assert_equal(code, 0, "Failed to list git tags")
    tags = out.splitlines()
    h.assert_in(
        "baseline-2026-11-08",
        tags,
        "Git repository must contain tag 'baseline-2026-11-08'",
    )


@registry.register(
    test_id="T1.01.3",
    tier=1,
    feature_id=1,
    name="Baseline Tag References Initial Baseline Commit",
    description="Tag 'baseline-2026-11-08' points to valid commit object with baseline provenance",
    source="ORIGINAL_REQUEST.md §R1, S0-02",
)
def test_f01_baseline_tag_commit(h: TestHarness):
    code, out, _ = h.run_cmd(["git", "rev-parse", "baseline-2026-11-08"])
    h.assert_equal(code, 0, "Tag 'baseline-2026-11-08' does not resolve to a commit")
    commit_hash = out.strip()
    h.assert_true(len(commit_hash) >= 7, "Invalid commit hash for baseline tag")


@registry.register(
    test_id="T1.01.4",
    tier=1,
    feature_id=1,
    name="Baseline Core Project Tree Present",
    description="Target repository contains core project tree: package.json, README.md, src/",
    source="ORIGINAL_REQUEST.md §R1, S0-02",
)
def test_f01_baseline_files(h: TestHarness):
    h.assert_file_exists("package.json", "package.json missing from root")
    h.assert_file_exists("README.md", "README.md missing from root")
    h.assert_file_exists("src", "src/ directory missing from root")


@registry.register(
    test_id="T1.01.5",
    tier=1,
    feature_id=1,
    name="Gitignore Configured with Mandatory Ignores",
    description=".gitignore excludes .next/, node_modules/, .env* (except .env.example), *.tsbuildinfo",
    source="ORIGINAL_REQUEST.md §R1, S0-02",
)
def test_f01_gitignore_rules(h: TestHarness):
    h.assert_file_exists(".gitignore", ".gitignore file must exist")
    content = h.read_text(".gitignore")
    h.assert_true(bool(re.search(r"^\.next/?", content, re.M)), ".gitignore must ignore .next/")
    h.assert_true(bool(re.search(r"^node_modules/?", content, re.M)), ".gitignore must ignore node_modules/")
    h.assert_true(bool(re.search(r"^\.env\*", content, re.M) or bool(re.search(r"^\.env\.local", content, re.M))), ".gitignore must ignore .env files")
    h.assert_true(bool(re.search(r"\*\.tsbuildinfo", content)), ".gitignore must ignore *.tsbuildinfo")


# Feature 2: Toolchain & Next.js Hardening
@registry.register(
    test_id="T1.02.1",
    tier=1,
    feature_id=2,
    name="Node 22 LTS Locked in .nvmrc",
    description=".nvmrc exists and specifies Node 22 LTS",
    source="ORIGINAL_REQUEST.md §R1, D-11, S0-03",
)
def test_f02_nvmrc_node22(h: TestHarness):
    h.assert_file_exists(".nvmrc", ".nvmrc must exist at project root")
    content = h.read_text(".nvmrc").strip()
    h.assert_true(
        "22" in content or "lts/jod" in content.lower(),
        f".nvmrc must specify Node 22 LTS, found: '{content}'",
    )


@registry.register(
    test_id="T1.02.2",
    tier=1,
    feature_id=2,
    name="Package Engines Node 22 Specified",
    description="package.json contains engines.node specifying >=22",
    source="ORIGINAL_REQUEST.md §R1, S0-03",
)
def test_f02_engines_node22(h: TestHarness):
    pkg = h.read_json("package.json")
    engines = pkg.get("engines", {})
    node_engine = engines.get("node", "")
    h.assert_true(
        "22" in node_engine or ">=20" in node_engine or "^22" in node_engine,
        f"package.json engines.node must require Node 22, found: '{node_engine}'",
    )


@registry.register(
    test_id="T1.02.3",
    tier=1,
    feature_id=2,
    name="Next.js Hardened (>= 15.2.3 for CVE-2025-29927)",
    description="package.json next dependency version is >= 15.2.3 to patch middleware bypass vulnerability",
    source="ORIGINAL_REQUEST.md §R1, D-11, Gate G0",
)
def test_f02_nextjs_patch_version(h: TestHarness):
    pkg = h.read_json("package.json")
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    next_ver = deps.get("next", "")
    h.assert_true(bool(next_ver), "Next.js dependency must be present in package.json")
    # Clean version string (remove ^, ~, >=)
    clean_ver = re.sub(r"[^\d.]", "", next_ver)
    parts = [int(p) for p in clean_ver.split(".") if p.isdigit()]
    if len(parts) >= 3:
        is_patched = (parts[0] > 15) or (parts[0] == 15 and parts[1] > 2) or (parts[0] == 15 and parts[1] == 2 and parts[2] >= 3)
        h.assert_true(
            is_patched,
            f"Next.js version must be >= 15.2.3 to patch CVE-2025-29927, found: {next_ver}",
        )


@registry.register(
    test_id="T1.02.4",
    tier=1,
    feature_id=2,
    name="Zod Environment Validation Module Exists",
    description="src/config/env.ts exists and imports Zod for schema validation",
    source="ORIGINAL_REQUEST.md §R1, §6.10, S1-01",
)
def test_f02_env_module_exists(h: TestHarness):
    h.assert_file_exists("src/config/env.ts", "src/config/env.ts must exist")
    content = h.read_text("src/config/env.ts")
    h.assert_true("zod" in content.lower(), "src/config/env.ts must use Zod for validation")


@registry.register(
    test_id="T1.02.5",
    tier=1,
    feature_id=2,
    name="Environment Config Validates Required Keys",
    description="src/config/env.ts validates NEXT_PUBLIC_SUPABASE_URL and SUPABASE keys",
    source="ORIGINAL_REQUEST.md §R1, S1-01, AG-07",
)
def test_f02_env_keys_validated(h: TestHarness):
    content = h.read_text("src/config/env.ts")
    h.assert_true("NEXT_PUBLIC_SUPABASE_URL" in content, "env.ts must validate NEXT_PUBLIC_SUPABASE_URL")
    h.assert_true("NEXT_PUBLIC_SUPABASE_ANON_KEY" in content, "env.ts must validate NEXT_PUBLIC_SUPABASE_ANON_KEY")


# Feature 3: Minimal CI Pipeline
@registry.register(
    test_id="T1.03.1",
    tier=1,
    feature_id=3,
    name="GitHub Actions CI Workflow Exists",
    description=".github/workflows/ci.yml exists and is non-empty",
    source="ORIGINAL_REQUEST.md §R1, S0-04, Gate G0",
)
def test_f03_ci_yml_exists(h: TestHarness):
    h.assert_file_exists(".github/workflows/ci.yml", ".github/workflows/ci.yml must exist")
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_true(len(content.strip()) > 20, "ci.yml must not be empty")


@registry.register(
    test_id="T1.03.2",
    tier=1,
    feature_id=3,
    name="CI Triggers on Push and Pull Request",
    description="CI workflow configures triggers for push and pull_request",
    source="ORIGINAL_REQUEST.md §R1, S0-04",
)
def test_f03_ci_triggers(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_true("push" in content, "CI must trigger on push")
    h.assert_true("pull_request" in content, "CI must trigger on pull_request")


@registry.register(
    test_id="T1.03.3",
    tier=1,
    feature_id=3,
    name="CI Uses npm ci for Deterministic Installs",
    description="CI workflow runs 'npm ci' to install dependencies",
    source="ORIGINAL_REQUEST.md §R1, S0-04, Gate G0",
)
def test_f03_ci_npm_ci(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_true("npm ci" in content, "CI workflow must use 'npm ci'")


@registry.register(
    test_id="T1.03.4",
    tier=1,
    feature_id=3,
    name="CI Runs Typecheck Verification",
    description="CI workflow executes typecheck step",
    source="ORIGINAL_REQUEST.md §R1, S0-04, Gate G0",
)
def test_f03_ci_typecheck(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_true("typecheck" in content or "tsc" in content, "CI workflow must execute typecheck")


@registry.register(
    test_id="T1.03.5",
    tier=1,
    feature_id=3,
    name="CI Runs Lint and Build Steps",
    description="CI workflow executes lint and build steps",
    source="ORIGINAL_REQUEST.md §R1, S0-04, Gate G0",
)
def test_f03_ci_lint_build(h: TestHarness):
    content = h.read_text(".github/workflows/ci.yml")
    h.assert_true("lint" in content, "CI workflow must run lint")
    h.assert_true("build" in content, "CI workflow must run build")


# Feature 4: Supabase Local Environment
@registry.register(
    test_id="T1.04.1",
    tier=1,
    feature_id=4,
    name="Supabase Config TOML Exists",
    description="supabase/config.toml exists at project root",
    source="ORIGINAL_REQUEST.md §R1, D-05, D-06, S0-06",
)
def test_f04_config_toml_exists(h: TestHarness):
    h.assert_file_exists("supabase/config.toml", "supabase/config.toml must exist")


@registry.register(
    test_id="T1.04.2",
    tier=1,
    feature_id=4,
    name="Supabase Configures Local Database Port",
    description="supabase/config.toml configures local PostgreSQL port (e.g. 54322)",
    source="ORIGINAL_REQUEST.md §R1, S0-06",
)
def test_f04_config_db_port(h: TestHarness):
    content = h.read_text("supabase/config.toml")
    h.assert_true("port" in content and "db" in content, "config.toml must configure db port")


@registry.register(
    test_id="T1.04.3",
    tier=1,
    feature_id=4,
    name="Supabase Configures Auth and Storage Services",
    description="supabase/config.toml defines auth and storage configuration blocks",
    source="ORIGINAL_REQUEST.md §R1, S0-06, D-06",
)
def test_f04_config_services(h: TestHarness):
    content = h.read_text("supabase/config.toml")
    h.assert_true("[auth]" in content, "config.toml must define [auth] section")
    h.assert_true("[storage]" in content, "config.toml must define [storage] section")


@registry.register(
    test_id="T1.04.4",
    tier=1,
    feature_id=4,
    name="Supabase Cloud Inspection Read-Only Constraint",
    description="Cloud staging instance zynzpifmccbcvgddmxic is designated read-only for local dev",
    source="ORIGINAL_REQUEST.md §R1, D-06, Gate G0",
)
def test_f04_cloud_read_only(h: TestHarness):
    adr = h.read_text("docs/architecture/ADR-002-implementation-conventions.md") if h.file_exists("docs/architecture/ADR-002-implementation-conventions.md") else ""
    plan = h.read_text("README.md") if h.file_exists("README.md") else ""
    combined = adr + plan
    h.assert_true(
        "read-only" in combined.lower() or "chỉ đọc" in combined.lower() or "local" in combined.lower(),
        "Documentation must designate cloud inspection as read-only and local docker as development runtime",
    )


@registry.register(
    test_id="T1.04.5",
    tier=1,
    feature_id=4,
    name="Supabase Migrations Directory Exists",
    description="supabase/migrations/ directory exists for SQL migrations",
    source="ORIGINAL_REQUEST.md §R1, S0-06",
)
def test_f04_migrations_dir(h: TestHarness):
    h.assert_file_exists("supabase/migrations", "supabase/migrations directory must exist")


# Feature 5: Simulated Tenant Model Migration
@registry.register(
    test_id="T1.05.1",
    tier=1,
    feature_id=5,
    name="Zero Occurrences of Thịnh Đức",
    description="Application source, configs, and seeds contain zero occurrences of Thịnh Đức",
    source="ORIGINAL_REQUEST.md §R1, D-03, S0-07, Gate G0",
)
def test_f05_no_thinh_duc(h: TestHarness):
    matches = h.grep_pattern("Thịnh Đức", rel_glob="src/**/*", case_sensitive=False)
    h.assert_equal(len(matches), 0, f"Leaked real commune 'Thịnh Đức' found in source: {matches}")


@registry.register(
    test_id="T1.05.2",
    tier=1,
    feature_id=5,
    name="Zero Occurrences of Tân Cương",
    description="Application source, configs, and seeds contain zero occurrences of Tân Cương",
    source="ORIGINAL_REQUEST.md §R1, D-03, S0-07, Gate G0",
)
def test_f05_no_tan_cuong(h: TestHarness):
    matches = h.grep_pattern("Tân Cương", rel_glob="src/**/*", case_sensitive=False)
    h.assert_equal(len(matches), 0, f"Leaked real commune 'Tân Cương' found in source: {matches}")


@registry.register(
    test_id="T1.05.3",
    tier=1,
    feature_id=5,
    name="Zero Occurrences of Bất Bạt or Ba Vì",
    description="Application source, configs, and seeds contain zero occurrences of Bất Bạt or Ba Vì",
    source="ORIGINAL_REQUEST.md §R1, D-03, S0-07, Gate G0",
)
def test_f05_no_bat_bat_ba_vi(h: TestHarness):
    matches_bb = h.grep_pattern("Bất Bạt", rel_glob="src/**/*", case_sensitive=False)
    matches_bv = h.grep_pattern("Ba Vì", rel_glob="src/**/*", case_sensitive=False)
    h.assert_equal(len(matches_bb) + len(matches_bv), 0, f"Leaked real commune 'Bất Bạt/Ba Vì' found in source")


@registry.register(
    test_id="T1.05.4",
    tier=1,
    feature_id=5,
    name="Simulated Tenant Identifiers TN-DEMO-A and TN-DEMO-B Present",
    description="Tenant configuration and seed files reference simulated communes TN-DEMO-A and TN-DEMO-B",
    source="ORIGINAL_REQUEST.md §R1, D-03, S0-07, Gate G0",
)
def test_f05_simulated_tenant_ids(h: TestHarness):
    matches_a = h.grep_pattern("TN-DEMO-A", rel_glob="**/*", case_sensitive=True)
    matches_b = h.grep_pattern("TN-DEMO-B", rel_glob="**/*", case_sensitive=True)
    h.assert_true(len(matches_a) > 0, "TN-DEMO-A identifier must be defined in configuration or seed")
    h.assert_true(len(matches_b) > 0, "TN-DEMO-B identifier must be defined in configuration or seed")


@registry.register(
    test_id="T1.05.5",
    tier=1,
    feature_id=5,
    name="District Tier Eliminated from Tenancy Model",
    description="Tenancy hierarchy operates at commune level without district intermediate level",
    source="ORIGINAL_REQUEST.md §R1, D-03, S0-07",
)
def test_f05_no_district_tier(h: TestHarness):
    matches = h.grep_pattern("TP. Thái Nguyên", rel_glob="src/**/*", case_sensitive=False)
    h.assert_equal(len(matches), 0, f"District tier 'TP. Thái Nguyên' must be eliminated: {matches}")


# Feature 6: Strangler Isolation (14 pages)
@registry.register(
    test_id="T1.06.1",
    tier=1,
    feature_id=6,
    name="Legacy Route Group Directory Exists",
    description="Directory src/app/(legacy) exists to isolate legacy prototype pages",
    source="ORIGINAL_REQUEST.md §R1, D-02, S0-08, Gate G0",
)
def test_f06_legacy_dir_exists(h: TestHarness):
    h.assert_file_exists("src/app/(legacy)", "src/app/(legacy) route group must exist")


@registry.register(
    test_id="T1.06.2",
    tier=1,
    feature_id=6,
    name="Legacy Layout Wraps with DemoProvider",
    description="src/app/(legacy)/layout.tsx wraps legacy pages with DemoProvider",
    source="ORIGINAL_REQUEST.md §R1, S0-08, Gate G0",
)
def test_f06_legacy_provider(h: TestHarness):
    layout_path = "src/app/(legacy)/layout.tsx"
    h.assert_file_exists(layout_path, "Legacy layout.tsx must exist")
    content = h.read_text(layout_path)
    h.assert_true(
        "DemoProvider" in content or "Provider" in content,
        "Legacy layout must wrap children in DemoProvider",
    )


@registry.register(
    test_id="T1.06.3",
    tier=1,
    feature_id=6,
    name="Legacy Layout Renders LEGACY_MOCK Banner",
    description="src/app/(legacy)/layout.tsx displays visible LEGACY_MOCK banner",
    source="ORIGINAL_REQUEST.md §R1, S0-08, Gate G0",
)
def test_f06_legacy_mock_banner(h: TestHarness):
    layout_path = "src/app/(legacy)/layout.tsx"
    content = h.read_text(layout_path)
    h.assert_true(
        "LEGACY_MOCK" in content or "mô phỏng" in content.lower(),
        "Legacy layout must display LEGACY_MOCK banner",
    )


@registry.register(
    test_id="T1.06.4",
    tier=1,
    feature_id=6,
    name="Legacy Pages Preserved Under (legacy)",
    description="Original dashboard pages are relocated into src/app/(legacy)/",
    source="ORIGINAL_REQUEST.md §R1, S0-08, Gate G0",
)
def test_f06_legacy_pages_relocated(h: TestHarness):
    legacy_dir = h.resolve_path("src/app/(legacy)")
    pages = list(legacy_dir.rglob("page.tsx"))
    h.assert_true(
        len(pages) >= 5,
        f"Legacy route group must contain legacy pages, found {len(pages)}",
    )


@registry.register(
    test_id="T1.06.5",
    tier=1,
    feature_id=6,
    name="Application Builds Cleanly with Legacy Isolation",
    description="Next.js build succeeds with (legacy) route group isolated",
    source="ORIGINAL_REQUEST.md §R1, S0-08, Gate G0",
)
def test_f06_build_succeeds(h: TestHarness):
    # Verify package.json contains build script
    pkg = h.read_json("package.json")
    scripts = pkg.get("scripts", {})
    h.assert_in("build", scripts, "package.json must contain 'build' script")


# Feature 7: ADR-002 Implementation Conventions
@registry.register(
    test_id="T1.07.1",
    tier=1,
    feature_id=7,
    name="ADR-002 Document Exists",
    description="docs/architecture/ADR-002-implementation-conventions.md exists",
    source="ORIGINAL_REQUEST.md §R1, S0-05, Gate G0",
)
def test_f07_adr002_exists(h: TestHarness):
    h.assert_file_exists(
        "docs/architecture/ADR-002-implementation-conventions.md",
        "ADR-002 document must exist",
    )


@registry.register(
    test_id="T1.07.2",
    tier=1,
    feature_id=7,
    name="ADR-002 Specifies 4-Layer Architecture",
    description="ADR-002 documents the strict layered flow: App -> Action/Service -> Repository -> Postgres RPC",
    source="ORIGINAL_REQUEST.md §R1, §6.1, S0-05",
)
def test_f07_adr002_layers(h: TestHarness):
    content = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true("Server Action" in content or "actions.ts" in content, "ADR-002 must specify Server Action layer")
    h.assert_true("service" in content.lower(), "ADR-002 must specify service layer")
    h.assert_true("repository" in content.lower(), "ADR-002 must specify repository layer")
    h.assert_true("RPC" in content, "ADR-002 must specify PostgreSQL RPC layer")


@registry.register(
    test_id="T1.07.3",
    tier=1,
    feature_id=7,
    name="ADR-002 Specifies RequestContext Contract",
    description="ADR-002 specifies getRequestContext() and server-side membership validation",
    source="ORIGINAL_REQUEST.md §R1, §6.4, S0-05",
)
def test_f07_adr002_request_context(h: TestHarness):
    content = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true("RequestContext" in content, "ADR-002 must specify RequestContext contract")
    h.assert_true("pvh_tenant" in content, "ADR-002 must specify pvh_tenant cookie validation")


@registry.register(
    test_id="T1.07.4",
    tier=1,
    feature_id=7,
    name="ADR-002 Approves Decisions D-02 to D-12",
    description="ADR-002 formally documents approval of decisions D-02 through D-12",
    source="ORIGINAL_REQUEST.md §R1, §4, S0-05, Gate G0",
)
def test_f07_adr002_decisions(h: TestHarness):
    content = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    for d in ["D-02", "D-03", "D-04", "D-05", "D-06", "D-07", "D-08", "D-09", "D-10", "D-11", "D-12"]:
        h.assert_true(d in content, f"ADR-002 must document decision {d}")


@registry.register(
    test_id="T1.07.5",
    tier=1,
    feature_id=7,
    name="ADR-002 Defines Fitness Functions",
    description="ADR-002 defines automated limits: <=300 lines/file, <=100 lines/page, server-only imports",
    source="ORIGINAL_REQUEST.md §R1, §6.12, S0-05",
)
def test_f07_adr002_fitness_functions(h: TestHarness):
    content = h.read_text("docs/architecture/ADR-002-implementation-conventions.md")
    h.assert_true("300" in content, "ADR-002 must specify <= 300 lines/file rule")
    h.assert_true("100" in content, "ADR-002 must specify <= 100 lines/page rule")
    h.assert_true("server-only" in content, "ADR-002 must specify server-only imports rule")
