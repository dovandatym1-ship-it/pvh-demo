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
