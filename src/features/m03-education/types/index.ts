export interface SchoolDTO {
  readonly id: string;
  readonly name: string;
  readonly level: "PRESCHOOL" | "PRIMARY" | "SECONDARY";
  readonly principal: string;
  readonly totalStudents: number;
  readonly schoolYear: string;
  readonly universalizationStandard: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
}

export interface PrivateFacilityDTO {
  readonly id: string;
  readonly name: string;
  readonly facilityType: "INDEPENDENT_NURSERY_GROUP" | "INDEPENDENT_KINDERGARTEN_CLASS";
  readonly ownerName: string;
  readonly ownerCccd: string;
  readonly capacity: number;
  readonly currentEnrolled: number;
  readonly totalAreaSqm: number;
  readonly sqmPerChild: number;
  readonly fireSafetyCertified: boolean;
  readonly foodSafetyCertified: boolean;
  readonly licensingStatus: "LICENSED" | "PROBATION" | "SUSPENDED" | "DISSOLVED";
}

export interface TuitionExemptionDTO {
  readonly id: string;
  readonly studentName: string;
  readonly schoolName: string;
  readonly grade: string;
  readonly category: "POOR_HOUSEHOLD" | "NEAR_POOR" | "DISABILITY" | "ORPHAN";
  readonly exemptionPercent: number;
  readonly supportAmount: number;
  readonly status: "APPROVED" | "PENDING" | "REJECTED";
  readonly semester: string;
}
