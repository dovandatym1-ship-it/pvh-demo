type NavigationItem = { readonly route: string };
type NavigationGroup<Item extends NavigationItem> = {
  readonly title: string;
  readonly items: readonly Item[];
};

const LEGACY_ROUTE_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  "/ban-lam-viec": ["m01:view", "m01:full", "m01:hamlet_view"],
  "/cong-viec": ["m01:view", "m01:full", "m01:hamlet_view"],
  "/noi-vu": ["m02:view", "m02:full"],
  "/giao-duc": ["m03:view", "m03:full"],
  "/van-hoa/gia-dinh-van-hoa": ["m04:view", "m04:full", "m04:propose_title", "m04:intake"],
  "/van-hoa/thon-van-hoa": ["m04:view", "m04:full", "m04:propose_title", "m04:intake"],
  "/khcn-chuyen-doi-so": ["m05:view", "m05:full"],
  "/y-te-an-sinh": ["m06:view", "m06:full", "m06:propose_aid", "m06:intake"],
  "/dan-toc-ton-giao": ["m07:view", "m07:full"],
  "/kiem-tra": ["m08:view", "m08:execute"],
  "/bao-cao": ["m09:view", "m09:draft", "m09:sign_snapshot"],
  "/nhap-chi-tieu": ["m10:import"],
  "/du-lieu-dung-chung": ["m00:admin"],
  "/tich-hop": ["m10:import"],
  "/quan-tri": ["m00:admin"],
};

/** Legacy personas use their own explicit demo permission vocabulary. */
export function filterLegacyNavigation<Item extends NavigationItem>(
  groups: readonly NavigationGroup<Item>[],
  permissions: readonly string[],
): NavigationGroup<Item>[] {
  const granted = new Set(permissions);
  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      (LEGACY_ROUTE_PERMISSIONS[item.route] ?? []).some((permission) => granted.has(permission)),
    ),
  })).filter((group) => group.items.length > 0);
}
