"use server";

import { ProposeCulturalTitleSchema, ProposeCulturalTitleInput } from "../schemas";
import { CulturalTitleDTO } from "../types";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function proposeCulturalTitleAction(input: ProposeCulturalTitleInput, tenantId: string, userId: string) {
  const validated = ProposeCulturalTitleSchema.parse(input);

  // Mock persistence or Supabase call
  const newRecord: CulturalTitleDTO = {
    id: `tit-${Date.now()}`,
    tenantId,
    code: `GĐVH-2026-${Math.floor(100 + Math.random() * 900)}`,
    householdHead: validated.householdHead,
    hamletId: validated.hamletId,
    hamletName: "Xóm Tân Thịnh",
    membersCount: validated.membersCount,
    evaluationYear: 2026,
    score: validated.score,
    yearsRecognized: 0,
    status: "PROPOSED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await logAuditEvent({
    tenantId,
    userId,
    personaCode: "P4",
    action: "PROPOSE_CULTURAL_TITLE",
    entityType: "CULTURAL_TITLE",
    entityId: newRecord.id,
    details: { householdHead: validated.householdHead },
  });

  return { success: true, data: newRecord };
}
