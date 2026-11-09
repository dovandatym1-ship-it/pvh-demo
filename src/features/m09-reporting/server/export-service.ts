import "server-only";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "node:path";
import type { ReportSnapshotDTO } from "../types";
import { verifySnapshotHash } from "./service";

export const DEMO_WATERMARK_DISCLAIMER = "MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ";
export const DRAFT_WATERMARK = "DRAFT — BẢN NHÁP";
// Traced as a static public asset in the deployed Next.js artifact.
const vietnameseFont = path.join(process.cwd(), "public", "fonts", "DejaVuSans-PVH.ttf");
export interface ExportResult {
  readonly filename: string;
  readonly contentType: string;
  readonly buffer: Buffer;
}
const METRIC_NAMES: Record<string,string> = {
  tasksTotal:"Tổng số công việc",tasksCompleted:"Công việc hoàn thành",
  tasksOverdue:"Công việc quá hạn",cultureSubmissions:"Hồ sơ văn hóa",
  cultureEligible:"Hồ sơ đạt theo rule minh họa",plansTotal:"Kế hoạch chuyển đổi số",
  indicatorsConfirmed:"Chỉ tiêu đã xác nhận",indicatorsConfirmedZero:"Chỉ tiêu xác nhận bằng 0",
  indicatorsNotReported:"Chỉ tiêu chưa báo cáo",indicatorsNotApplicable:"Chỉ tiêu không áp dụng",
  inspectionsTotal:"Cuộc kiểm tra",recommendationsTotal:"Kiến nghị kiểm tra",
  recommendationsClosed:"Kiến nghị đã khắc phục",importedValues:"Bản ghi chỉ tiêu từ file mô phỏng",
};
const METRIC_UNITS: Record<string,string> = {
  tasksTotal:"Công việc",tasksCompleted:"Công việc",tasksOverdue:"Công việc",
  cultureSubmissions:"Hồ sơ",cultureEligible:"Hồ sơ",plansTotal:"Kế hoạch",
  indicatorsConfirmed:"Chỉ tiêu",indicatorsConfirmedZero:"Chỉ tiêu",
  indicatorsNotReported:"Chỉ tiêu",indicatorsNotApplicable:"Chỉ tiêu",
  inspectionsTotal:"Cuộc",recommendationsTotal:"Kiến nghị",
  recommendationsClosed:"Kiến nghị",importedValues:"Bản ghi",
};
function safeCell(value: unknown): string {
  const text = String(value ?? "");
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? "'" + text : text;
}
function numericMetrics(snapshot: ReportSnapshotDTO): Array<{code:string;label:string;value:number}> {
  const values = snapshot.payload.metrics;
  if (!values || typeof values !== "object" || Array.isArray(values)) return [];
  return Object.entries(values as Record<string,unknown>)
    .filter(([,v]) => typeof v === "number" && Number.isFinite(v))
    .map(([code,value])=>({code,label:METRIC_NAMES[code] ?? code,value:value as number}));
}
function fileBase(snapshot: ReportSnapshotDTO): string {
  return [snapshot.reportCode,snapshot.period,snapshot.year,"v"+snapshot.revision]
    .map(x=>String(x).replace(/[^A-Za-z0-9_-]/g,"_")).join("_");
}
async function exportXlsx(snapshot: ReportSnapshotDTO): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PVH Workbench"; workbook.created = new Date();
  const sheet = workbook.addWorksheet("Bao cao",{views:[{state:"frozen",ySplit:7}]});
  sheet.columns = [
    {key:"code",width:25},{key:"label",width:48},{key:"value",width:20},{key:"note",width:45},
  ];
  sheet.mergeCells("A1:D1"); sheet.getCell("A1").value = DEMO_WATERMARK_DISCLAIMER;
  sheet.getCell("A1").font={bold:true,color:{argb:"FFAA1A1A"},size:14};
  sheet.mergeCells("A2:D2"); sheet.getCell("A2").value = safeCell(snapshot.title);
  sheet.getCell("A2").font={bold:true,size:13};
  sheet.mergeCells("A3:D3"); sheet.getCell("A3").value = "Trạng thái: "+snapshot.status+
    " | Kỳ: "+snapshot.period+" | Năm: "+snapshot.year+" | Revision: "+snapshot.revision;
  sheet.mergeCells("A4:D4"); sheet.getCell("A4").value = "Nguồn: DATABASE | SHA-256 ("+snapshot.hashAlgorithm+"): "+snapshot.sha256;
  sheet.mergeCells("A5:D5"); sheet.getCell("A5").value = snapshot.status==="FINALIZED"
    ? "Chốt nội bộ, KHÔNG phải chữ ký số hay văn bản phát hành."
    : DRAFT_WATERMARK;
  sheet.addRow([]);
  sheet.addRow(["Mã chỉ tiêu","Chỉ tiêu","Giá trị","Đơn vị / Ghi chú nguồn"]);
  const header=sheet.getRow(7); header.font={bold:true,color:{argb:"FFFFFFFF"}};
  header.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF203A64"}};
  for(const metric of numericMetrics(snapshot)) {
    sheet.addRow([safeCell(metric.code),safeCell(metric.label),metric.value,
      safeCell(METRIC_UNITS[metric.code]??"") + " · Bản chụp nguồn, không live"]);
  }
  const quality = snapshot.payload.quality as Record<string,unknown> | undefined;
  for(const [code,detail] of Object.entries(quality ?? {})){
    const d=detail as {value?:unknown;status?:unknown};
    sheet.addRow([safeCell(code),safeCell(METRIC_NAMES[code] ?? code),
      typeof d?.value==="number" ? d.value : null,safeCell(d?.status ?? "NOT_REPORTED")]);
  }
  sheet.autoFilter={from:{row:7,column:1},to:{row:7,column:4}};
  sheet.eachRow(row=>{row.alignment={vertical:"middle",wrapText:true};});
  const raw=await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}
async function exportPdf(snapshot: ReportSnapshotDTO): Promise<Buffer> {
  const doc=new PDFDocument({size:"A4",margin:48,bufferPages:true,
    info:{Title:safeCell(snapshot.title),Author:"PVH Workbench"}});
  const chunks:Buffer[]=[];
  doc.on("data",(chunk:Buffer)=>chunks.push(Buffer.from(chunk)));
  const ended=new Promise<Buffer>((resolve,reject)=>{
    doc.on("end",()=>resolve(Buffer.concat(chunks)));
    doc.on("error",reject);
  });
  doc.font(vietnameseFont);
  doc.fontSize(11).fillColor("#A02020").text(DEMO_WATERMARK_DISCLAIMER,{align:"center"});
  doc.moveDown(1).fontSize(16).fillColor("#17253C").text(safeCell(snapshot.title),{align:"center"});
  doc.moveDown(0.5).fontSize(10).fillColor("#4A5568")
    .text("Mã: "+snapshot.reportCode+" | Kỳ: "+snapshot.period+" | Năm: "+snapshot.year+
      " | Bản: "+snapshot.revision+" | Trạng thái: "+snapshot.status,{align:"center"});
  doc.moveDown(0.5).fontSize(9).text("SHA-256 ("+snapshot.hashAlgorithm+"): "+snapshot.sha256);
  doc.moveDown().fontSize(11).fillColor("#17253C").text("Bảng số liệu báo cáo",{underline:true});
  const tableX=48,tableWidth=doc.page.width-96,rowHeight=28;
  let tableY=doc.y+10,renderedRows=0;
  function tableHeader() {
    if(tableY>doc.page.height-120){doc.addPage();tableY=doc.y+12;}
    doc.save().fillColor("#203A64").rect(tableX,tableY,tableWidth,28).fill().restore();
    doc.fontSize(9).fillColor("#FFFFFF").text("Chỉ tiêu",tableX+10,tableY+8,{width:tableWidth-190,lineBreak:false});
    doc.text("Giá trị",tableX+tableWidth-175,tableY+8,{width:88,lineBreak:false,align:"right"});
    doc.text("Đơn vị",tableX+tableWidth-78,tableY+8,{width:68,lineBreak:false});
    tableY+=28;
  }
  function tableRow(label:string,value:string,unit:string) {
    if(tableY+rowHeight>doc.page.height-100){doc.addPage();tableY=doc.y+12;tableHeader();}
    if(renderedRows%2===0)doc.save().fillColor("#F0F4FA").rect(tableX,tableY,tableWidth,rowHeight).fill().restore();
    doc.fontSize(9).fillColor("#26354B").text(safeCell(label),tableX+10,tableY+8,
      {width:tableWidth-190,height:15,ellipsis:true,lineBreak:false});
    doc.text(safeCell(value),tableX+tableWidth-175,tableY+8,
      {width:88,lineBreak:false,align:"right"});
    doc.text(safeCell(unit),tableX+tableWidth-78,tableY+8,{width:68,lineBreak:false});
    tableY+=rowHeight;renderedRows++;
  }
  tableHeader();
  for(const m of numericMetrics(snapshot))
    tableRow(m.label,m.value.toLocaleString("vi-VN"),METRIC_UNITS[m.code]??"");
  const quality=snapshot.payload.quality as Record<string,unknown>|undefined;
  for(const [code,detail] of Object.entries(quality ?? {})) {
    const q=detail as {value?:unknown;status?:unknown};
    tableRow(METRIC_NAMES[code]??code,String(q.value??"—"),String(q.status??"NOT_REPORTED"));
  }
  doc.y=tableY+16;
  if(doc.y>doc.page.height-145)doc.addPage();
  doc.moveDown().fontSize(9).fillColor("#5B6472")
    .text("Nguồn dữ liệu: "+safeCell(snapshot.payload.sourceType)+
      " | Số bản ghi đóng góp: "+String(snapshot.payload.sourceRecords ?? 0));
  doc.moveDown().text(snapshot.status==="FINALIZED"
    ? "Đây là số liệu chốt nội bộ. Không có chữ ký số hoặc quyết định hành chính."
    : DRAFT_WATERMARK);
  const pageRange=doc.bufferedPageRange();
  for(let i=pageRange.start;i<pageRange.start+pageRange.count;i++){
    doc.switchToPage(i);
    doc.font(vietnameseFont).fontSize(8).fillColor("#677489")
      .text("PVH — Báo cáo nội bộ · "+(i+1)+"/"+pageRange.count,
        48,doc.page.height-72,{align:"right",width:doc.page.width-96,lineBreak:false});
  }
  doc.end();
  return ended;
}
export const exportService = {
  async exportSnapshot(snapshot: ReportSnapshotDTO,format:"PDF"|"XLSX"|"JSON"): Promise<ExportResult> {
    if (!verifySnapshotHash(snapshot)) throw new Error("SNAPSHOT_INTEGRITY_ERROR");
    const base=fileBase(snapshot);
    if(format==="XLSX") return {filename:base+".xlsx",contentType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer:await exportXlsx(snapshot)};
    if(format==="PDF") return {filename:base+".pdf",contentType:"application/pdf",buffer:await exportPdf(snapshot)};
    return {filename:base+".json",contentType:"application/json",
      buffer:Buffer.from(JSON.stringify({watermark:DEMO_WATERMARK_DISCLAIMER,snapshot},null,2),"utf8")};
  },
};
