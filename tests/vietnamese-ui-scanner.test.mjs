import assert from "node:assert/strict";
import test from "node:test";
import { scanVietnameseUiSource } from "../scripts/lib/vietnamese-ui-scanner.mjs";

const scan = (content) => scanVietnameseUiSource(content, "fixture.tsx");

test("Scanner flags literal English controls and technical terms shown to users", () => {
  assert.equal(scan('<button>Submit</button>').some(f => f.rule === "UI_ENGLISH"), true);
  assert.equal(scan('<span>Phân công & minh chứng</span>').some(f => f.rule === "UI_AMPERSAND"), true);
  assert.equal(scan('<p>LEGACY_MOCK</p>').some(f => f.rule === "UI_TECHNICAL"), true);
  assert.equal(scan('condition ? "Chỉ việc assigned_to = tài khoản" : "Việc chung"')
    .some(f => f.rule === "UI_TECHNICAL"), true);
});

test("Scanner does not mistake TSX type syntax or dynamic data keys for UI copy", () => {
  const code = 'readonly onSnapshotCreated:(snapshot:ReportSnapshotDTO)=>void;\n' +
    'const metrics = (snapshot.payload.metrics ?? {}) as Record<string,unknown>;\n' +
    '<p>{snapshot.title}</p>';
  assert.deepEqual(scan(code), []);
});

test("Standardized Vietnamese UI labels stay clean", () => {
  assert.deepEqual(scan('<span>Phân công và minh chứng</span>'), []);
  assert.deepEqual(scan('condition ? "Chỉ công việc được giao" : "Toàn đơn vị"'), []);
});
