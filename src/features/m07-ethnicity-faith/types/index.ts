export interface ReligiousEstablishmentDTO {
  id: string;
  name: string;
  religion: string;
  representative: string;
  registeredEvents: string[];
  status: "NORMAL" | "UNDER_REVIEW";
}
