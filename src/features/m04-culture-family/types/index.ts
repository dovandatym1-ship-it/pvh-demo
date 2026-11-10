export type SubmissionStatus =
  | "DAT"
  | "KHONG_DAT"
  | "THIEU_MINH_CHUNG"
  | "CHO_RA_SOAT"
  | "YEU_CAU_BO_SUNG";

export interface CriteriaScore {
  readonly criteriaCode: string;
  readonly criteriaName?: string;
  readonly maxPoints?: number;
  readonly thresholdPoints?: number;
  readonly score: number;
}

export interface CultureSubmissionDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly campaignId: string;
  readonly rulePackId: string;
  readonly rulePackVersion: number;
  readonly householdId: string;
  readonly householdHeadName: string;
  readonly hamletId: string;
  readonly hamletName?: string;
  readonly submissionType: string;
  readonly status: SubmissionStatus;
  readonly score: number;
  readonly hasEvidence: boolean;
  readonly reviewerComment?: string | null;
  readonly evidencePath?: string | null;
  readonly criteriaScores?: CriteriaScore[];
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy?: string | null;
}

// Backward compatibility types
export type CulturalTitleStatus = "PROPOSED" | "EVALUATED" | "APPROVED" | "REJECTED";

export interface CulturalTitleDTO {
  id: string;
  tenantId: string;
  code: string;
  householdHead: string;
  hamletId: string;
  hamletName: string;
  membersCount: number;
  evaluationYear: number;
  score: number;
  yearsRecognized: number;
  status: CulturalTitleStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CulturalFacilityDTO {
  id: string;
  code: string;
  name: string;
  category: "CULTURAL_HOUSE" | "HISTORICAL_MONUMENT" | "SPORTS_GROUND";
  capacity?: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}
