export interface SchoolFacilityDTO {
  id: string;
  name: string;
  level: "PRE_SCHOOL" | "PRIMARY" | "SECONDARY";
  studentCount: number;
  nationalStandard: string;
}
