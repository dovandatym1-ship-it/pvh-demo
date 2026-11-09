import "server-only";
import { hasExplicitPermission } from "@/lib/authorization/permission-check";

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
    title: "Điều hành và tác nghiệp",
    items: [
      {
        title: "Tổng quan điều hành",
        route: "/dashboard",
        iconName: "LayoutDashboard",
        moduleKey: "m01",
        requiredPermission: "m01:work:read",
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
    title: "Chuyên ngành văn hóa – xã hội",
    items: [
      {
        title: "Nội vụ và lao động",
        route: "/noi-vu",
        iconName: "Building",
        moduleKey: "m02",
        requiredPermission: "m02:internal:read",
        status: "DEEP",
      },
      {
        title: "Giáo dục và đào tạo",
        route: "/giao-duc",
        iconName: "GraduationCap",
        moduleKey: "m03",
        requiredPermission: "m03:education:read",
        status: "DEEP",
      },
      {
        title: "Gia đình văn hóa",
        route: "/van-hoa/gia-dinh-van-hoa",
        iconName: "Sparkles",
        moduleKey: "m04",
        requiredPermission: "m04:culture:read",
        status: "DEEP",
      },
      {
        title: "Thôn, xóm văn hóa",
        route: "/van-hoa/thon-van-hoa",
        iconName: "Landmark",
        moduleKey: "m04",
        requiredPermission: "m04:culture:read",
        status: "DEEP",
      },
      {
        title: "Khoa học và chuyển đổi số",
        route: "/khcn-chuyen-doi-so",
        iconName: "Cpu",
        moduleKey: "m05-science-digital",
        requiredPermission: "m05:digital:read",
        status: "DEEP",
      },
      {
        title: "Y tế và an sinh xã hội",
        route: "/y-te-an-sinh",
        iconName: "HeartHandshake",
        moduleKey: "m06",
        requiredPermission: "m06:social:read",
        status: "DEEP",
      },
      {
        title: "Dân tộc và tôn giáo",
        route: "/dan-toc-ton-giao",
        iconName: "Compass",
        moduleKey: "m07",
        requiredPermission: "m07:faith:read",
        status: "DEEP",
      },
    ],
  },
  {
    title: "Kiểm tra, báo cáo và quản trị",
    items: [
      {
        title: "Kiểm tra và kiến nghị",
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
        title: "Nhập chỉ tiêu có nguồn",
        route: "/nhap-chi-tieu",
        iconName: "FileInput",
        moduleKey: "m10",
        requiredPermission: "m10:indicator:import",
        status: "DEEP",
        description: "Nhập CSV mô phỏng có kiểm tra, đối soát và lịch sử nguồn.",
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
        title: "Quản lý tài khoản và phân quyền",
        route: "/quan-tri/tai-khoan",
        iconName: "ShieldCheck",
        moduleKey: "m00",
        requiredPermission: "m00:membership:manage",
        status: "DEEP",
      },
      {
        title: "Quản trị hệ thống và cán bộ",
        route: "/quan-tri",
        iconName: "ShieldCheck",
        moduleKey: "m00",
        requiredPermission: "m00:membership:read",
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

  // Both conditions must hold when both are configured; no leader/admin bypass.
  return (
    (!item.requiredRole || userRoles.includes(item.requiredRole)) &&
    (!item.requiredPermission || hasExplicitPermission(userPermissions, item.requiredPermission))
  );
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
  // A more specific sub-route takes precedence over a broad parent route.
  // The page/server action still verifies its own permission independently.
  let match: NavigationItem | undefined;
  for (const group of NAVIGATION_REGISTRY) {
    for (const item of group.items) {
      if ((route === item.route || route.startsWith(item.route + "/")) &&
          (!match || item.route.length > match.route.length)) {
        match = item;
      }
    }
  }
  return match ? hasPermission(match, userPermissions, userRoles) : true;
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
