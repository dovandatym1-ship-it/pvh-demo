/** Undefined = unrestricted by a hamlet scope; [] = explicitly no permitted hamlets. */
export function isHamletWithinScope(
  hamletId: string,
  allowedHamlets: readonly string[] | undefined,
): boolean {
  return allowedHamlets === undefined || allowedHamlets.includes(hamletId);
}
