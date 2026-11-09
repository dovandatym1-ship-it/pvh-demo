import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { parseIndicatorCsv, SAMPLE_TEMPLATE, MAX_ROWS } from "../src/features/m10-integrations/import-contract.ts";

const sha=(s:string)=>crypto.createHash("sha256").update(s).digest("hex");
test("INT-001: three valid and two invalid rows preserve row errors",()=>{
 const source=SAMPLE_TEMPLATE+
  "bad,1,CODE_BAD,Q4/2026,CONFIRMED,12,hoso,=cmd\r\n"+
  "DEMO-X,1,CODE_TEST,Q4/2026,CONFIRMED_ZERO,8,hoso,SIM-EX/001\r\n";
 const parsed=parseIndicatorCsv(source,sha(source));
 assert.equal(parsed.valid,3);
 assert.equal(parsed.invalid,2);
 assert.deepEqual(parsed.errors.map(x=>x.line),[5,6]);
 assert.equal(parsed.rows.length,5);
 assert.equal(parsed.rows[3].__invalid,true);
});
test("INT-CSV: BOM, escaped quotes, blank, and line breaks",()=>{
 const data="\uFEFFsource_record_id,source_version,indicator_code,period,status,numeric_value,unit,source_ref\r\n"+
  '"DEMO-100",1,TEST_A,2026-11,NOT_REPORTED,,hoso,SIM-DEMO/100\r\n';
 const parsed=parseIndicatorCsv(data,sha(data));
 assert.equal(parsed.valid,1);
 assert.equal(parsed.rows[0].numeric_value,"");
});
test("INT-CSV: formula injection is not accepted",()=>{
 const data=SAMPLE_TEMPLATE+"=cmd,1,TEST_A,Q4/2026,CONFIRMED,1,hoso,SIM-DEMO/004\r\n";
 const parsed=parseIndicatorCsv(data,sha(data));
 assert.equal(parsed.invalid,1);
 assert.match(parsed.errors[0].reason,/công thức/);
});
test("INT-CSV: duplicate source id and version in same batch is rejected",()=>{
 const data=SAMPLE_TEMPLATE+
  "DEMO-001,1,CDS_TASKS,Q4/2026,CONFIRMED,12,hoso,SIM-DEMO/001\r\n";
 const parsed=parseIndicatorCsv(data,sha(data));
 assert.equal(parsed.valid,3);
 assert.equal(parsed.invalid,1);
 assert.match(parsed.errors[0].reason,/Trùng mã nguồn/);
});
test("INT-CSV: invalid header and too many rows fail closed",()=>{
 assert.throws(()=>parseIndicatorCsv("A,B\nx,y",sha("x")),/CSV_HEADER_INVALID/);
 assert.throws(()=>parseIndicatorCsv(SAMPLE_TEMPLATE.split("\r\n")[0],sha("header")),/CSV_NO_DATA_ROWS/);
 const malformed=SAMPLE_TEMPLATE+'"DEMO-5"x,1,CODE,Q4/2026,CONFIRMED,1,hoso,SIM-DEMO/001';
 assert.throws(()=>parseIndicatorCsv(malformed,sha(malformed)),/CSV_QUOTE_MALFORMED/);
 const data=SAMPLE_TEMPLATE.split("\r\n")[0]+"\n"+
  Array(MAX_ROWS+1).fill("X,1,CODE,Q4/2026,CONFIRMED,1,hoso,SIM-DEMO/001").join("\n");
 assert.throws(()=>parseIndicatorCsv(data,sha(data)),/CSV_TOO_MANY_ROWS/);
});
