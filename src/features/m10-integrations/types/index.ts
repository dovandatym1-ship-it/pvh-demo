export interface IntegrationConnectorDTO {
  id: string;
  name: string;
  type: "API_SYNC" | "BATCH_EXCEL" | "RECONCILIATION";
  lastSyncAt: string;
  recordsProcessed: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
}
