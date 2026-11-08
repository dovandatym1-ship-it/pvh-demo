export interface ReligiousEstablishmentDTO {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  religionType: string;
  representativeName: string;
  hamletId: string;
  address: string;
  status: "ACTIVE" | "PENDING_REGISTRATION" | "UNDER_REVIEW";
  followerCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReligiousEventDTO {
  id: string;
  tenantId: string;
  establishmentId: string;
  establishmentName?: string;
  title: string;
  eventDate: string;
  expectedAttendees: number;
  status: "CHO_TIEP_NHAN" | "DA_TIEP_NHAN" | "TU_CHOI";
  rejectionReason?: string | null;
  version: number;
  createdAt: string;
}

export interface ReputablePersonDTO {
  id: string;
  tenantId: string;
  fullName: string;
  ethnicGroup: string;
  hamletId: string;
  yearRecognized: number;
  policyStatus: "DANG_HUONG" | "TAM_DUNG" | "THAY_THE";
  monthlyAllowance: number;
  version: number;
  createdAt: string;
}
