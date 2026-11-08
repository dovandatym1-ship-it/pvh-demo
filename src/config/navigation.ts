import "server-only";

export type NavigationStatus = "DEEP" | "FRAME" | "DEFERRED" | "LEGACY_MOCK";

export interface NavigationItem {
  readonly title: string;
  readonly route: string;
  readonly iconName: string;
  readonly moduleKey?: string;
  readonly requiredPermission?: string;
  readonly requiredRole?: string;
  readonly status: NavigationStatus;
  readonly badge?: string;
  readonly description?: string;
}

export interface NavigationGroup {
  readonly title: string;
  readonly items: readonly NavigationItem[];
}

export const NAVIGATION_REGISTRY: readonly NavigationGroup[] = [
  {
    title: "Điều hành & Tác nghiệp",
    items: [
      {
        title: "Dashboard điều hành",
        route: "/dashboard",
        iconName: "LayoutDashboard",
        status: "DEEP",
      },
      {
        title: "Bàn làm việc",
        route: "/ban-lam-viec",
        iconName: "LayoutDashboard",
        status: "DEEP",
      },
      {
        title: "Quản lý công việc",
        route: "/cong-viec",
        iconName: "CalendarCheck",
        moduleKey: "m01",
        requiredPermission: "m01:work:read",
        status: "DEEP",
      },
    ],
  },
  {
    title: "Văn hóa - Thông tin & Giáo dục",
    items: [
      {
        title: "Gia đình văn hóa",
        route: "/van-hoa/gia-dinh-van-hoa",
        iconName: "Sparkles",
        moduleKey: "m04",
        requiredPermission: "m04:culture:read",
        status: "DEEP",
      },
      {
        title: "Thôn / Xóm văn hóa",
        route: "/van-hoa/thon-van-hoa",
        iconName: "Landmark",
        moduleKey: "m04",
        requiredPermission: "m04:culture:read",
        status: "DEEP",
      },
      {
        title: "Giáo dục & Đào tạo",
        route: "/giao-duc",
        iconName: "GraduationCap",
        moduleKey: "m03",
        requiredPermission: "m03:education:read",
        status: "DEEP",
      },
      {
        title: "Khoa học & Chuyển đổi số",
        route: "/khcn-chuyen-doi-so",
        iconName: "Cpu",
        moduleKey: "m05-science-digital",
        requiredPermission: "m05:digital:read",
        status: "DEEP",
      },
    ],
  },
  {
    title: "Lao động, Y tế & Chính sách xã hội",
    items: [
      {
        title: "Y tế & An sinh xã hội",
        route: "/y-te-an-sinh",
        iconName: "HeartHandshake",
        moduleKey: "m06",
        requiredPermission: "m06:social:read",
        status: "DEEP",
      },
      {
        title: "Nội vụ & Lao động",
        route: "/noi-vu",
        iconName: "Building",
        moduleKey: "m02",
        requiredPermission: "m02:internal:read",
        status: "DEEP",
      },
      {
        title: "Dân tộc & Tôn giáo",
        route: "/dan-toc-ton-giao",
        iconName: "Compass",
        moduleKey: "m07",
        requiredPermission: "m07:faith:read",
        status: "DEEP",
      },
    ],
  },
  {
    title: "Kiểm tra, Báo cáo & Nền tảng",
    items: [
      {
        title: "Kiểm tra & Kiến nghị",
        route: "/kiem-tra",
        iconName: "ClipboardList",
        moduleKey: "m08-inspections",
        requiredPermission: "m08:inspection:read",
        status: "DEEP",
      },
      {
        title: "Báo cáo thống kê",
        route: "/bao-cao",
        iconName: "BarChart3",
        moduleKey: "m09",
        requiredPermission: "m09:report:read",
        status: "DEEP",
      },
      {
        title: "Dữ liệu dùng chung",
        route: "/du-lieu-dung-chung",
        iconName: "Database",
        moduleKey: "m01",
        requiredPermission: "m01:work:read",
        status: "LEGACY_MOCK",
      },
      {
        title: "Cổng tích hợp liên thông",
        route: "/tich-hop",
        iconName: "RefreshCw",
        moduleKey: "m10",
        requiredPermission: "m10:integration:read",
        status: "LEGACY_MOCK",
      },
      {
        title: "Quản trị hệ thống & Cán bộ",
        route: "/quan-tri",
        iconName: "ShieldCheck",
        moduleKey: "m00",
        requiredPermission: "m00:admin",
        status: "LEGACY_MOCK",
      },
    ],
  },
];

/**
 * Normalizes and checks whether user permissions or roles grant access to an item.
 */
export function hasPermission(
  item: NavigationItem,
  userPermissions: readonly string[] = [],
  userRoles: readonly string[] = []
): boolean {
  if (!item.requiredPermission && !item.requiredRole) {
    return true;
  }

  // Superuser admin bypass
  if (
    userRoles.includes("LANH_DAO_XA") ||
    userRoles.includes("SYSTEM_ADMIN") ||
    userRoles.includes("admin") ||
    userPermissions.includes("m00:admin") ||
    userPermissions.includes("*")
  ) {
    return true;
  }

  // Check role requirement
  if (item.requiredRole && userRoles.includes(item.requiredRole)) {
    return true;
  }

  // Check permission requirement
  if (item.requiredPermission) {
    const required = item.requiredPermission;
    if (userPermissions.includes(required)) return true;

    // Check wildcard prefix (e.g. m01:* matches m01:work:read)
    const [modulePrefix] = required.split(":");
    if (
      userPermissions.includes(`${modulePrefix}:*`) ||
      userPermissions.includes(`${modulePrefix}:full`) ||
      userPermissions.includes(`${modulePrefix}:view`)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Filter navigation groups according to user entitlements.
 * Empty permissions list returns only items with no permission required.
 */
export function filterNavigation(
  userPermissions: readonly string[] = [],
  userRoles: readonly string[] = []
): NavigationGroup[] {
  return NAVIGATION_REGISTRY.map((group) => ({
    title: group.title,
    items: group.items.filter((item) => hasPermission(item, userPermissions, userRoles)),
  })).filter((group) => group.items.length > 0);
}

export const getNavigation = filterNavigation;

/**
 * Checks whether user can access a specific route.
 */
export function canAccessRoute(
  route: string,
  userPermissions: readonly string[] = [],
  userRoles: readonly string[] = []
): boolean {
  for (const group of NAVIGATION_REGISTRY) {
    for (const item of group.items) {
      if (item.route === route || route.startsWith(item.route + "/")) {
        return hasPermission(item, userPermissions, userRoles);
      }
    }
  }
  return true;
}

/**
 * Server Route Guard: Throws FORBIDDEN if the user lacks entitlement.
 */
export function assertRoutePermission(
  route: string,
  userPermissions: readonly string[] = [],
  userRoles: readonly string[] = []
): void {
  if (!canAccessRoute(route, userPermissions, userRoles)) {
    throw new Error("FORBIDDEN: Không có quyền truy cập trang này");
  }
}
