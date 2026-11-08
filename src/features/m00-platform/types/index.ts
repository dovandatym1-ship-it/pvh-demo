export interface TenantEntity {
  id: string;
  code: string;
  name: string;
  province: string;
  district: string;
  officerMode: "CONCURRENT" | "SPECIALIZED";
  features: {
    digitalTransformation: boolean;
    fieldInspection: boolean;
    advancedCulturalTitles: boolean;
  };
}
