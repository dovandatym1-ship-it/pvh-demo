import fs from "node:fs";
import path from "node:path";

const roots = ["src/app", "src/components", "src/features", "src/config"];
const extensions = new Set([".tsx", ".ts", ".jsx", ".js"]);
const checks = [
  { id: "UI_ENGLISH", re: /(?:>|(?:placeholder|aria-label|title)=["'])\s*(?:Dashboard|No data|Loading\.\.\.|Submit|Cancel|Export|Import|Reset password|Profile|Workflow)\s*(?:<|["'])/gi },
  { id: "UI_TECHNICAL", re: />[^<]*(?:assigned_to\s*=|snapshot\b|LEGACY_MOCK\b)[^<]*</gi },
  { id: "UI_AMPERSAND", re: />[^<]*[À-ỹ][^<]*\s&\s[^<]*</g },
];
const findings = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (extensions.has(path.extname(p))) {
      const source = fs.readFileSync(p, "utf8");
      for (const { id, re } of checks) {
        re.lastIndex = 0;
        for (const m of source.matchAll(re)) {
          const line = source.slice(0, m.index).split("\n").length;
          findings.push({ file: p, line, rule: id, sample: m[0].slice(0, 130) });
        }
      }
    }
  }
}
roots.forEach(walk);
console.log(JSON.stringify({ count: findings.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
