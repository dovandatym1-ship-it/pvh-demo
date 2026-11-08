export interface TenantEntity {
  id: string;
  code: string;
  name: string;
  province: string;
  officerMode: "CONCURRENT" | "SPECIALIZED";
  features: {
    digitalTransformation: boolean;
    fieldInspection: boolean;
    advancedCulturalTitles: boolean;
  };
}
