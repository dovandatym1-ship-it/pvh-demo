/** Recheck the live database assignment, never an unrefreshed JWT role claim. */
export function isMembershipCurrentlyActive(
  membership: { is_active?: boolean; valid_from?: string | null; valid_to?: string | null },
  nowMs: number = Date.now()
): boolean {
  if (membership.is_active === false || !Number.isFinite(nowMs)) return false;
  if (membership.valid_from != null) {
    const from = Date.parse(membership.valid_from);
    if (!Number.isFinite(from) || from > nowMs) return false;
  }
  if (membership.valid_to != null) {
    const until = Date.parse(membership.valid_to);
    if (!Number.isFinite(until) || until <= nowMs) return false;
  }
  return true;
}
