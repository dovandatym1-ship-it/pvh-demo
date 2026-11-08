import "server-only";

import type { ReportSnapshotDTO } from "../types";

export const DEMO_WATERMARK_DISCLAIMER = "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]";
export const DRAFT_WATERMARK = "[DRAFT - BẢN NHÁP]";

export interface ExportResult {
  readonly filename: string;
  readonly contentType: string;
  readonly buffer: Buffer;
}

export const exportService = {
  /**
   * Export report snapshot with mandatory watermark and simulation disclaimers.
   */
  exportSnapshot(
    snapshot: ReportSnapshotDTO,
    format: "PDF" | "XLSX" | "JSON" = "JSON"
  ): ExportResult {
    const isDraft = snapshot.status === "DRAFT" || !snapshot.isFinalized;
    const baseFilename = `${snapshot.reportCode}_${snapshot.period.replace("/", "_")}_${snapshot.year}`;

    // Common metadata header
    const exportMetadata = {
      watermark: DEMO_WATERMARK_DISCLAIMER,
      statusWatermark: isDraft ? DRAFT_WATERMARK : undefined,
      snapshotId: snapshot.id,
      sha256: snapshot.sha256,
      period: snapshot.period,
      year: snapshot.year,
      finalizedAt: snapshot.finalizedAt,
      exportedAt: new Date().toISOString(),
    };

    if (format === "JSON") {
      const jsonContent = JSON.stringify(
        {
          disclaimer: DEMO_WATERMARK_DISCLAIMER,
          metadata: exportMetadata,
          snapshot,
        },
        null,
        2
      );
      return {
        filename: `${baseFilename}.json`,
        contentType: "application/json",
        buffer: Buffer.from(jsonContent, "utf-8"),
      };
    }

    if (format === "XLSX") {
      // XLSX export representation with header disclaimer banner
      const xlsxCsvBanner = [
        `# ${DEMO_WATERMARK_DISCLAIMER}`,
        isDraft ? `# ${DRAFT_WATERMARK}` : "",
        `# Snapshot ID: ${snapshot.id}`,
        `# SHA256 Hash: ${snapshot.sha256}`,
        `# Title: ${snapshot.title}`,
        `# Period: ${snapshot.period} - Year: ${snapshot.year}`,
        "---",
        "ChiTieu,GiaTri,GhiChu",
        `TongSoCongViec,${(snapshot.payload?.metrics as Record<string, unknown>)?.tasksTotal ?? 6},Tu M01`,
        `CongViecHoanThanh,${(snapshot.payload?.metrics as Record<string, unknown>)?.tasksCompleted ?? 4},Tu M01`,
        `HoSoVanHoa,${(snapshot.payload?.metrics as Record<string, unknown>)?.cultureSubmissions ?? 5},Tu M04`,
        `GiaDinhDatChuan,${(snapshot.payload?.metrics as Record<string, unknown>)?.cultureApproved ?? 2},Tu M04`,
        `ChiSoCDS,${(snapshot.payload?.metrics as Record<string, unknown>)?.cdsIndex ?? 82.5},Tong hop`,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        filename: `${baseFilename}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: Buffer.from(xlsxCsvBanner, "utf-8"),
      };
    }

    // Default to PDF with running watermark
    const pdfTextRepresentation = [
      `%PDF-1.4 DEMO`,
      `[HEADER BANNER] ${DEMO_WATERMARK_DISCLAIMER}`,
      isDraft ? `[WATERMARK] ${DRAFT_WATERMARK}` : "",
      `[TITLE] ${snapshot.title}`,
      `[METADATA] Snapshot: ${snapshot.id} | SHA-256: ${snapshot.sha256}`,
      `[RUNNING WATERMARK] ${DEMO_WATERMARK_DISCLAIMER}`,
      `[FINALIZED AT] ${snapshot.finalizedAt || "CHƯA CHỐT (DRAFT)"}`,
      `[METRICS DATA] ${JSON.stringify(snapshot.payload?.metrics || {})}`,
      `%%EOF`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      filename: `${baseFilename}.pdf`,
      contentType: "application/pdf",
      buffer: Buffer.from(pdfTextRepresentation, "utf-8"),
    };
  },
};
