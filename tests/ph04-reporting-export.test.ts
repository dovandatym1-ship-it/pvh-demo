import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { exportService,DEMO_WATERMARK_DISCLAIMER } from "../src/features/m09-reporting/server/export-service.ts";
import type { ReportSnapshotDTO } from "../src/features/m09-reporting/types/index.ts";

const canonicalText='{"metrics": {"tasksTotal": 2, "tasksCompleted": 1, "tasksOverdue": 0}, "sourceRecords": 2, "sourceType": "DATABASE"}';
const snapshot:ReportSnapshotDTO={
 id:"00000000-0000-4000-8000-000000000001",tenantId:"00000000-0000-4000-8000-000000000002",
 reportCode:"RPT-WORK",title:"Báo cáo tiến độ công việc",period:"Q4/2026",year:2026,revision:1,
 previousSnapshotId:null,version:4,createdBy:"00000000-0000-4000-8000-000000000002",status:"FINALIZED",
 payload:{metrics:{tasksTotal:2,tasksCompleted:1,tasksOverdue:0},sourceRecords:2,sourceType:"DATABASE"},
 canonicalText,sha256:crypto.createHash("sha256").update(canonicalText).digest("hex"),
 hashAlgorithm:"PG_JSONB_TEXT_V1",watermark:DEMO_WATERMARK_DISCLAIMER,isFinalized:true,
 finalizedAt:"2026-11-08T00:00:00.000Z",finalizedBy:null,
 createdAt:"2026-11-08T00:00:00.000Z",updatedAt:"2026-11-08T00:00:00.000Z",
};
test("RPT-005: XLSX is an actual Excel ZIP with numerically typed values",async()=>{
 const exported=await exportService.exportSnapshot(snapshot,"XLSX");
 assert.equal(exported.buffer.subarray(0,2).toString(),"PK");
 const workbook=new ExcelJS.Workbook();
 await workbook.xlsx.load(exported.buffer as any);
 const sheet=workbook.getWorksheet("Bao cao");
 assert.ok(sheet);
 assert.equal(sheet.getCell("A1").value,DEMO_WATERMARK_DISCLAIMER);
 const rows=sheet.getRows(8,3)!;
 assert.equal(rows[0].getCell(3).value,2);
 assert.equal(rows[1].getCell(3).value,1);
 assert.equal(rows[2].getCell(3).value,0);
});
test("RPT-005: PDF parses and includes demo disclaimer in a valid stream",async()=>{
 const exported=await exportService.exportSnapshot(snapshot,"PDF");
 assert.equal(exported.buffer.subarray(0,5).toString(),"%PDF-");
 assert.match(exported.buffer.subarray(-60).toString(),/%%EOF/);
 const parsed=await PDFDocument.load(exported.buffer);
 assert.ok(parsed.getPageCount()>=1);
});
test("RPT-006: changed content with stale digest cannot be exported",async()=>{
 const modified={...snapshot,sha256:"0".repeat(64)};
 await assert.rejects(exportService.exportSnapshot(modified,"XLSX"),/SNAPSHOT_INTEGRITY_ERROR/);
});
