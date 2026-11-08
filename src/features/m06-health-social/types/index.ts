export interface SocialBeneficiaryDTO {
  readonly id: string;
  readonly code: string;
  readonly fullName: string;
  readonly cccd: string;
  readonly phone?: string;
  readonly hamletId: string;
  readonly aidCategory: string;
  readonly monthlyAmount: number;
  readonly diagnosis?: string;
  readonly paymentStatus: "PENDING" | "PAID" | "SUSPENDED";
  readonly healthInsuranceProvided: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FoodSafetyInspectionDTO {
  readonly id: string;
  readonly facilityName: string;
  readonly inspectionType: "STREET_FOOD" | "SCHOOL_CANTEEN" | "ARTISAN_PRODUCER";
  readonly inspectionDate: string;
  readonly totalScore: number;
  readonly sampleRetention24hPassed: boolean;
  readonly conclusion: "PASSED" | "WARNING_REMEDIAL" | "FAILED_SUSPEND";
}

export interface MedicalFacilityDTO {
  readonly id: string;
  readonly facilityName: string;
  readonly facilitySubType: "TRADITIONAL_CLINIC" | "SPECIALIZED_CLINIC" | "DRUG_STORE";
  readonly practitionerName: string;
  readonly licenseNumber: string;
  readonly licenseIssueDate: string;
  readonly gppCertified: boolean;
  readonly controlledDrugsLedger: boolean;
  readonly inspectionStatus: "NORMAL" | "WARNING";
}

export interface EpidemicLogDTO {
  readonly id: string;
  readonly hamletId: string;
  readonly diseaseGroup: "GROUP_A" | "GROUP_B" | "GROUP_C";
  readonly diseaseName: string;
  readonly casesCount: number;
  readonly hospitalizedCount: number;
  readonly deathsCount: number;
  readonly outbreakAlertFlag: boolean;
  readonly logWeek: number;
  readonly logYear: number;
  readonly reportedDate: string;
}
