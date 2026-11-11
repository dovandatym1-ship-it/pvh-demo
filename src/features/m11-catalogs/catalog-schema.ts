import { z } from "zod";

const UUID = z.string().uuid();
const code = z.string().trim().min(2).max(40).regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Mã dùng chữ, số và dấu gạch dưới");
const valueCode = z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Mã giá trị không hợp lệ");
const labelVi = z.string().trim().min(1).max(150);
const isoDate = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]);

export const CreateCatalogSchema = z.object({
  code, labelVi: labelVi.min(2), description: z.string().trim().max(500).default(""),
}).strict();

export const UpdateCatalogSchema = z.object({
  id: UUID, expectedVersion: z.number().int().min(1),
  labelVi: labelVi.min(2), description: z.string().trim().max(500),
  isActive: z.boolean(),
}).strict();

export const CreateCatalogValueSchema = z.object({
  catalogId: UUID, code: valueCode, labelVi,
  parentId: UUID.nullable(), sortOrder: z.number().int().min(0).max(999999),
  validFrom: isoDate, validTo: isoDate,
}).strict().superRefine((data, ctx) => {
  if (data.validFrom && data.validTo && data.validTo < data.validFrom) {
    ctx.addIssue({code:"custom",path:["validTo"],message:"Ngày hết hiệu lực không trước ngày bắt đầu"});
  }
});

export const UpdateCatalogValueSchema = CreateCatalogValueSchema.omit({
  catalogId: true, code: true,
}).extend({
  id: UUID, expectedVersion: z.number().int().min(1), isActive: z.boolean(),
}).strict();

export type Catalog = {
  id: string; tenant_id: string; code: string; label_vi: string;
  description: string; is_active: boolean; version: number;
  created_at: string; updated_at: string;
};
export type CatalogValue = {
  id: string; tenant_id: string; catalog_id: string; code: string;
  label_vi: string; parent_id: string | null; sort_order: number;
  valid_from: string | null; valid_to: string | null; is_active: boolean;
  version: number; updated_at: string;
};
export type CatalogEvent = {
  id: string; catalog_id: string; value_id: string | null;
  action: string; actor_id: string; created_at: string;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown>;
};

export type CatalogWorkspace = {
  catalogs: Catalog[];
  values: CatalogValue[];
  history: CatalogEvent[];
  catalogsTotal: number;
  valuesTotal: number;
  historyTotal: number;
};
