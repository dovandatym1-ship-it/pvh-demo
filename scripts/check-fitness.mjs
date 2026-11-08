#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_DIR = process.cwd();
let hasErrors = false;

function error(msg) {
  console.error(`❌ [FITNESS ERROR] ${msg}`);
  hasErrors = true;
}

function info(msg) {
  console.log(`ℹ️ [FITNESS] ${msg}`);
}

function walkDir(dir, filterFn) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, filterFn));
    } else if (filterFn(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

info("Starting Architectural Fitness Functions evaluation...");

// 1. File Line-Count Limits (ADR-002 §12)
// - New files in src/features/ <= 300 lines
const featureFiles = walkDir(
  path.join(ROOT_DIR, "src/features"),
  (f) => f.endsWith(".ts") || f.endsWith(".tsx")
);
for (const file of featureFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n").length;
  if (lines > 300) {
    error(`File line-count exceeded: ${path.relative(ROOT_DIR, file)} has ${lines} lines (max 300 allowed)`);
  }
}

// - page.tsx in src/app/(app)/ <= 100 lines
const appPageFiles = walkDir(
  path.join(ROOT_DIR, "src/app/(app)"),
  (f) => f.endsWith("page.tsx")
);
for (const file of appPageFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n").length;
  if (lines > 100) {
    error(`Page line-count exceeded: ${path.relative(ROOT_DIR, file)} has ${lines} lines (max 100 allowed)`);
  }
}

// 2. Server-Only Guards (ADR-002 §12)
// All files in src/features/*/server/*.ts (except actions.ts) must import "server-only"
const serverFiles = walkDir(path.join(ROOT_DIR, "src/features"), (f) => {
  return f.includes(`${path.sep}server${path.sep}`) && f.endsWith(".ts") && !f.endsWith("actions.ts");
});
for (const file of serverFiles) {
  const content = fs.readFileSync(file, "utf-8");
  if (!content.includes('import "server-only"') && !content.includes("import 'server-only'")) {
    error(`Missing import "server-only" in server file: ${path.relative(ROOT_DIR, file)}`);
  }
}

// 3. Secret Leak Scanner (ADR-002 §12)
// Scan all tracked src/ and config/ files for NEXT_PUBLIC_ leaking private keys or service roles
const allSrcFiles = walkDir(
  path.join(ROOT_DIR, "src"),
  (f) => f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".json")
);
const envFiles = [
  path.join(ROOT_DIR, ".env.example"),
  path.join(ROOT_DIR, ".env.local"),
].filter(fs.existsSync);

const pubPrefix = "NEXT_PUBLIC";
const secretPattern = new RegExp(pubPrefix + "_.*(?:SERVICE_ROLE|SECRET|PRIVATE_KEY)", "i");
for (const file of [...allSrcFiles, ...envFiles]) {
  const content = fs.readFileSync(file, "utf-8");
  if (secretPattern.test(content)) {
    error(`Leaked secret or service-role in public environment variable: ${path.relative(ROOT_DIR, file)}`);
  }
}

if (hasErrors) {
  console.error("\n❌ Architectural fitness checks FAILED. Commit rejected.");
  process.exit(1);
} else {
  console.log("✅ All architectural fitness checks PASSED successfully.");
  process.exit(0);
}
