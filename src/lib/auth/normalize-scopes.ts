/**
 * SQL RLS uses scopes.org_unit_ids; current feature UIs consume hamletIds.
 * Preserve an explicitly empty scope as denial, never convert it to unrestricted.
 * If both names are present, intersect them to avoid widening the DB boundary.
 */
export function normalizeMembershipScopes(raw: unknown): {
  readonly hamletIds?: readonly string[];
  readonly sectorIds?: readonly string[];
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { hamletIds: [] };
  }
  const input = raw as Record<string, unknown>;
  const hasOrg = Object.prototype.hasOwnProperty.call(input, "org_unit_ids");
  const hasHamlet = Object.prototype.hasOwnProperty.call(input, "hamletIds");

  const ids = (value: unknown): string[] =>
    Array.isArray(value) && value.every(item => typeof item === "string")
      ? [...new Set(value as string[])]
      : [];

  const result: { hamletIds?: readonly string[]; sectorIds?: readonly string[] } = {};
  if (hasOrg && hasHamlet) {
    const fromDb = ids(input.org_unit_ids);
    const fromUi = new Set(ids(input.hamletIds));
    result.hamletIds = fromDb.filter(id => fromUi.has(id));
  } else if (hasOrg) result.hamletIds = ids(input.org_unit_ids);
  else if (hasHamlet) result.hamletIds = ids(input.hamletIds);

  if (Object.prototype.hasOwnProperty.call(input, "sectorIds")) {
    result.sectorIds = ids(input.sectorIds);
  } else if (Object.prototype.hasOwnProperty.call(input, "sector_ids")) {
    result.sectorIds = ids(input.sector_ids);
  }
  return result;
}
