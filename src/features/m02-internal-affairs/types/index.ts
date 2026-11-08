export interface PolicyBeneficiaryDTO {
  id: string;
  fullName: string;
  policyType: string;
  monthlyAllowance: number;
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
}
