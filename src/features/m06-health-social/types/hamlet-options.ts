export interface HamletOption { readonly id: string; readonly name: string }
/** Only offer hamlets present in the authorized result set; labels come from live units. */
export function buildSocialHamletOptions(
  items: readonly { readonly hamletId: string }[],
  units: readonly HamletOption[],
): HamletOption[] {
  const names = new Map(units.map(({ id, name }) => [id, name]));
  const ids = [...new Set(items.map(item => item.hamletId).filter(Boolean))];
  return ids.map(id => ({ id, name: names.get(id) || "Địa bàn chưa xác định" }))
    .sort((left, right) => left.name.localeCompare(right.name, "vi"));
}
