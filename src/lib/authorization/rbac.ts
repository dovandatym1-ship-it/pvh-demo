import { Persona } from "../auth/session";
import { TenantConfig } from "../tenancy/tenant-config";

export function canAccessModule(persona: Persona, moduleKey: string, tenant: TenantConfig): boolean {
  // Check if tenant has disabled this feature module
  if (moduleKey === "m05-science-digital" && !tenant.features.digitalTransformation) {
    return false;
  }
  if (moduleKey === "m08-inspections" && !tenant.features.fieldInspection) {
    return false;
  }

  // UI-only affordance: never use demo persona as a backend authority.
  const prefix = moduleKey.split("-")[0]; // e.g. "m04"
  return persona.permissions.some(p => p.startsWith(`${prefix}:`));
}

export function canPerformAction(persona: Persona, action: string): boolean {
  return persona.permissions.includes(action);
}
