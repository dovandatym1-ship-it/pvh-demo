export interface DigitalIndicatorDTO {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly value: string;
  readonly numericValue?: number;
  readonly status: "CONFIRMED_ZERO" | "CONFIRMED" | "UNCONFIRMED" | "MISSING" | "NOT_APPLICABLE";
  readonly isConfirmedZero: boolean;
  readonly naReason?: string;
  readonly meaning: string;
  readonly evaluationPeriod: string;
}

export interface CommunityDigitalTeamDTO {
  readonly id: string;
  readonly hamletId: string;
  readonly leaderName: string;
  readonly leaderPhone?: string;
  readonly memberCount: number;
  readonly citizensSupported: number;
  readonly vneidLevel2Count: number;
  readonly status: "ACTIVE" | "INACTIVE";
}
