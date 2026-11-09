import fs from "node:fs";
import path from "node:path";
import { scanVietnameseUiSource } from "./lib/vietnamese-ui-scanner.mjs";

const roots = ["src/app", "src/components", "src/features", "src/config"];
const extensions = new Set([".tsx", ".ts", ".jsx", ".js"]);
const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (extensions.has(path.extname(p))) {
      const source = fs.readFileSync(p, "utf8");
      findings.push(...scanVietnameseUiSource(source, p));
    }
  }
}
roots.forEach(walk);
console.log(JSON.stringify({ count: findings.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
