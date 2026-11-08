/** Demo persona authentication is a local-development fixture, never a deployment identity. */
export function isDemoAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
    process.env.PVH_ALLOW_DEMO_AUTH === "true"
  );
}

export const DEMO_PERSONA_CODES = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;

export function isValidDemoPersona(value: string | undefined): boolean {
  return value !== undefined && DEMO_PERSONA_CODES.some((code) => code === value);
}
