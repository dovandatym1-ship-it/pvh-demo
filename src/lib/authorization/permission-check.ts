/** Single exact-match permission contract. Roles have no implicit wildcard grants. */
export function hasExplicitPermission(
  permissions: readonly string[],
  requiredPermission: string
): boolean {
  return requiredPermission.length > 0 && permissions.includes(requiredPermission);
}
