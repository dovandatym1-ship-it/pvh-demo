export interface NCCBeneficiaryDTO {
  readonly id: string;
  readonly code: string;
  readonly fullName: string;
  readonly cccd?: string;
  readonly hamletId: string;
  readonly category: "THUONG_BINH" | "LIET_SI" | "BENH_BINH" | "CHAT_DOC_HOA_HOC" | "BA_ME_VNAH";
  readonly medalTitle: string;
  readonly monthlyAllowance: number;
  readonly hasDeduplicationFlag: boolean;
  readonly deduplicationWarning?: string;
  readonly status: "ACTIVE" | "REVIEW_PENDING";
}

export interface LaborContractDTO {
  readonly id: string;
  readonly businessName: string;
  readonly taxCode: string;
  readonly totalWorkers: number;
  readonly minWagePaid: number;
  readonly regionalMinWage: number;
  readonly isUnderMinWage: boolean;
  readonly seasonalWorkersCount: number;
  readonly bhxhRegisteredCount: number;
  readonly evaluationPeriod: string;
}

export interface LaborDisputeDTO {
  readonly id: string;
  readonly code: string;
  readonly requesterName: string;
  readonly requesterRole: "EMPLOYEE" | "EMPLOYER" | "COLLECTIVE";
  readonly respondentName: string;
  readonly disputeContent: string;
  readonly disputeType: "INDIVIDUAL" | "COLLECTIVE";
  readonly receivedDate: string;
  readonly status: "RECEIVED" | "SCHEDULED" | "RESOLVED_SUCCESS" | "RESOLVED_FAILED" | "ESCALATED_DISTRICT";
  readonly outcomeSummary?: string;
  readonly version: number;
  readonly decisionReference?: string | null;
}

/** Safe browser DTO; sensitive source fields are never serialized. */
export type NCCBeneficiaryDisplayDTO = Omit<NCCBeneficiaryDTO, "cccd" | "monthlyAllowance"> & {
  readonly cccdDisplay: string;
  readonly allowanceDisplay: string;
};
