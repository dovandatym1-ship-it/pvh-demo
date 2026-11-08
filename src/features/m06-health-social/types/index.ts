export interface SocialAidBeneficiaryDTO {
  id: string;
  fullName: string;
  category: string;
  monthlyAidAmount: number;
  healthInsuranceProvided: boolean;
  status: "RECEIVING" | "SUSPENDED";
}
