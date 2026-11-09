import { z } from "zod";

export const TEMPLATE_VERSION = 1;
export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const CSV_COLUMNS = [
  "source_record_id","source_version","indicator_code","period",
  "status","numeric_value","unit","source_ref",
] as const;
export const SAMPLE_TEMPLATE = [
  CSV_COLUMNS.join(","),
  "DEMO-001,1,CDS_TASKS,Q4/2026,CONFIRMED,12,hoso,SIM-DEMO/001",
  "DEMO-002,1,CDS_ZERO,Q4/2026,CONFIRMED_ZERO,0,hoso,SIM-DEMO/002",
  "DEMO-003,1,CDS_MISSING,Q4/2026,NOT_REPORTED,,hoso,SIM-DEMO/003",
].join("\r\n") + "\r\n";
export const IndicatorRowSchema = z.object({
  source_record_id: z.string().min(1).max(120).regex(/^[A-Za-z0-9_:./-]+$/),
  source_version: z.coerce.number().int().positive().max(99999),
  indicator_code: z.string().regex(/^[A-Z][A-Z0-9_-]{1,39}$/),
  period: z.string().regex(/^(Q[1-4]\/\d{4}|\d{4}-(0[1-9]|1[0-2]))$/),
  status: z.enum(["CONFIRMED","CONFIRMED_ZERO","NOT_REPORTED","NOT_APPLICABLE"]),
  numeric_value: z.union([z.literal(""),z.coerce.number().finite().min(-1e9).max(1e9)]),
  unit: z.string().min(1).max(50).regex(/^[A-Za-z0-9_%/ .]+$/),
  source_ref: z.string().regex(/^SIM-[A-Za-z0-9_:/.-]{3,100}$/),
}).superRefine((x,ctx)=>{
  const missing=x.numeric_value==="";
  if((x.status==="NOT_REPORTED"||x.status==="NOT_APPLICABLE")&&!missing)
    ctx.addIssue({code:"custom",message:"Trạng thái không có giá trị số",path:["numeric_value"]});
  if(x.status==="CONFIRMED"&&(missing||x.numeric_value===0))
    ctx.addIssue({code:"custom",message:"CONFIRMED yêu cầu số khác 0",path:["numeric_value"]});
  if(x.status==="CONFIRMED_ZERO"&&x.numeric_value!==0)
    ctx.addIssue({code:"custom",message:"CONFIRMED_ZERO yêu cầu giá trị 0",path:["numeric_value"]});
});
export interface RowError { readonly line:number;readonly reason:string; }
export interface ImportPreview {
  readonly rows: Record<string,unknown>[];
  readonly valid: number;
  readonly invalid: number;
  readonly errors: RowError[];
  readonly fileSha256: string;
  readonly templateVersion: number;
}
export function isUnsafeCsvCell(cell:string):boolean {
  // A plain negative decimal is a number, not a spreadsheet formula.
  // Other leading operators (=, +, @, -expression) remain forbidden.
  if (/^-[0-9]+(?:\.[0-9]+)?$/.test(cell.trim())) return false;
  return /^[\s\u0000-\u001f]*[=+@-]/.test(cell);
}
/** RFC 4180-ish CSV, with quoted fields/newlines and a strict single header. */
function splitCsv(text:string): string[][] {
  const rows:string[][]=[]; let row:string[]=[];let value="";let quoted=false;let closedQuote=false;
  const source=text.replace(/^\uFEFF/,"");
  for(let i=0;i<source.length;i++){
    const ch=source[i];
    if(ch==='"'){
      if(quoted&&source[i+1]==='"'){value+='"';i++;}
      else if(quoted){quoted=false;closedQuote=true;}
      else if(value===""&&!closedQuote){quoted=true;}
      else throw new Error("CSV_QUOTE_MALFORMED");
    }else if(ch===","&&!quoted){row.push(value);value="";closedQuote=false;}
    else if((ch==="\n"||ch==="\r")&&!quoted){
      if(ch==="\r"&&source[i+1]==="\n")i++;
      row.push(value);rows.push(row);row=[];value="";closedQuote=false;
    }else {
      if(closedQuote)throw new Error("CSV_QUOTE_MALFORMED");
      value+=ch;
    }
  }
  if(quoted)throw new Error("CSV_QUOTE_UNCLOSED");
  if(value.length||row.length){row.push(value);rows.push(row);}
  return rows;
}
export function parseIndicatorCsv(text:string,fileSha256:string):ImportPreview {
  if(Buffer.byteLength(text,"utf8")>MAX_CSV_BYTES)throw new Error("CSV_TOO_LARGE");
  const parsed=splitCsv(text);
  if(parsed.length===0||parsed[0].join(",")!==CSV_COLUMNS.join(","))throw new Error("CSV_HEADER_INVALID");
  if(parsed.length===1)throw new Error("CSV_NO_DATA_ROWS");
  if(parsed.length-1>MAX_ROWS)throw new Error("CSV_TOO_MANY_ROWS");
  const rows:Record<string,unknown>[]=[];const errors:RowError[]=[];let valid=0;
  const seenKeys=new Set<string>();
  for(let i=1;i<parsed.length;i++){
    const cells=parsed[i];const line=i+1;
    const data=Object.fromEntries(CSV_COLUMNS.map((col,j)=>[col,cells[j]??""]));
    const formula=cells.some(isUnsafeCsvCell);
    const shape=IndicatorRowSchema.safeParse(data);
    const reasons:string[]=[];
    if(cells.length!==CSV_COLUMNS.length)reasons.push("Sai số cột");
    if(formula)reasons.push("Giá trị có nguy cơ công thức bảng tính");
    if(!shape.success)reasons.push(...shape.error.issues.map(x=>x.path.join(".")+": "+x.message));
    if(shape.success){
      const key=shape.data.source_record_id+"\u0000"+shape.data.source_version;
      if(seenKeys.has(key))reasons.push("Trùng mã nguồn và phiên bản ngay trong file");
      seenKeys.add(key);
    }
    if(reasons.length){errors.push({line,reason:reasons.join("; ")});rows.push({...data,__invalid:true});}
    else{valid++;rows.push(data);}
  }
  return {rows,valid,invalid:errors.length,errors,fileSha256,templateVersion:TEMPLATE_VERSION};
}
