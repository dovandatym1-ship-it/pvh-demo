"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TenantSwitcher } from "./tenant-switcher";
import { PersonaSwitcher } from "./persona-switcher";
import { Persona } from "@/lib/auth/session";
import { TenantConfig } from "@/lib/tenancy/tenant-config";
import { useDemoContext } from "@/lib/tenancy/demo-context";
import { maskPII } from "@/lib/authorization/pii-mask";
import {
  Bell,
  Menu,
  Search,
  ChevronRight,
  Home,
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  Theater,
  Cpu,
  HeartHandshake,
  Compass,
  ClipboardCheck,
  BarChart3,
  Settings,
  Database,
  PlaySquare,
  Calendar,
  Layers,
  X,
  User,
  Building2,
  CheckSquare,
  ArrowRight,
  AlertOctagon,
} from "lucide-react";
import { Badge } from "../ui/badge";

interface RouteMeta {
  path: string;
  name: string;
  category: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const APP_ROUTES: RouteMeta[] = [
  {
    path: "/ban-lam-viec",
    name: "Bàn làm việc tổng hợp",
    category: "Phân hệ chính",
    desc: "Hàng đợi nhiệm vụ liên ngành & 4 thẻ chỉ tiêu Oracle",
    icon: LayoutDashboard,
  },
  {
    path: "/noi-vu",
    name: "Nội vụ & Lao động",
    category: "Phân hệ chính",
    desc: "Người có công, HĐLĐ, Tiền lương tối thiểu & Hòa giải đình công",
    icon: Briefcase,
  },
  {
    path: "/giao-duc",
    name: "Giáo dục & Đào tạo",
    category: "Phân hệ chính",
    desc: "Trường lớp, Nhóm trẻ tư thục >=1.5m2 & TTHTCĐ",
    icon: GraduationCap,
  },
  {
    path: "/van-hoa-gia-dinh",
    name: "Văn hóa & Gia đình",
    category: "Phân hệ chính",
    desc: "Bình xét GĐVH 9 bước (VH1..VH9), Lễ hội & Phòng chống BLGĐ",
    icon: Theater,
  },
  {
    path: "/khcn-chuyen-doi-so",
    name: "KHCN & Chuyển đổi số",
    category: "Phân hệ chính",
    desc: "Ma trận CĐS 6 ô, MET-04 (60%) & Dữ liệu Xã B lịch sử",
    icon: Cpu,
  },
  {
    path: "/y-te-an-sinh",
    name: "Y tế & An sinh xã hội",
    category: "Phân hệ chính",
    desc: "Chi trả BTXH bảo vệ PII, ATTP mẫu lưu 24h & Y dược tư nhân",
    icon: HeartHandshake,
  },
  {
    path: "/dan-toc-ton-giao",
    name: "Dân tộc & Tôn giáo",
    category: "Phân hệ chính",
    desc: "Cơ sở tôn giáo, Sinh hoạt chưa đăng ký & Vốn MTQG 1719",
    icon: Compass,
  },
  {
    path: "/kiem-tra",
    name: "Kiểm tra liên ngành",
    category: "Phân hệ chính",
    desc: "Kiểm tra Desktop vs Mobile Checklist V14, lưu nháp offline",
    icon: ClipboardCheck,
  },
  {
    path: "/bao-cao",
    name: "Báo cáo Oracle",
    category: "Phân hệ chính",
    desc: "5 chỉ tiêu DEM-R01..R05, Snapshot Rev 1 bất biến & LineageDrawer",
    icon: BarChart3,
  },
  {
    path: "/quan-tri",
    name: "Quản trị hệ thống",
    category: "Nền tảng",
    desc: "Quản trị người dùng, Tham số đa xã, AC-09 & Nhật ký kiểm toán",
    icon: Settings,
  },
  {
    path: "/du-lieu-dung-chung",
    name: "Dữ liệu dùng chung",
    category: "Nền tảng",
    desc: "Danh mục thiết chế, Ghép định danh Atomic Merge & Biến động cư trú",
    icon: Database,
  },
  {
    path: "/playbook",
    name: "Hướng dẫn quy trình tác nghiệp",
    category: "Hỗ trợ",
    desc: "Cẩm nang hướng dẫn quy trình tác nghiệp và phối hợp liên ngành",
    icon: PlaySquare,
  },
  {
    path: "/ke-hoach-cong-viec",
    name: "Kế hoạch công việc",
    category: "Hỗ trợ",
    desc: "Kế hoạch phối hợp công tác liên ngành cấp xã",
    icon: Calendar,
  },
  {
    path: "/tich-hop",
    name: "Tích hợp hệ thống",
    category: "Hỗ trợ",
    desc: "Cổng tích hợp liên thông CSDL quốc gia và tỉnh",
    icon: Layers,
  },
];

interface SearchResultItem {
  id: string;
  category: "ROUTE" | "CITIZEN" | "FACILITY" | "TASK";
  categoryLabel: string;
  title: string;
  subtitle: string;
  targetUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function Header({
  persona,
  tenant,
  onSelectTenant,
  onSelectPersona,
  onToggleMobileMenu,
}: {
  persona: Persona;
  tenant: TenantConfig;
  onSelectTenant: (t: TenantConfig) => void;
  onSelectPersona: (p: Persona) => void;
  onToggleMobileMenu?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, delegationExpired } = useDemoContext();

  const [isOmnisOpen, setIsOmnisOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOmnisOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOmnisOpen) {
        setIsOmnisOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOmnisOpen]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (isOmnisOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOmnisOpen]);

  // Search Results aggregation
  const searchResults = React.useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const qNorm = removeVietnameseDiacritics(q);
    const results: SearchResultItem[] = [];

    const matches = (text: string | undefined | null) => {
      if (!text) return false;
      const t = text.toLowerCase();
      if (t.includes(q)) return true;
      if (qNorm && removeVietnameseDiacritics(t).includes(qNorm)) return true;
      return false;
    };

    // 1. Search across 14 Routes
    APP_ROUTES.forEach((r) => {
      if (!q || matches(r.name) || matches(r.desc) || r.path.includes(q) || matches(r.path)) {
        results.push({
          id: `route-${r.path}`,
          category: "ROUTE",
          categoryLabel: "Phân hệ & Trang",
          title: r.name,
          subtitle: r.desc,
          targetUrl: r.path,
          icon: r.icon,
          badge: r.category,
        });
      }
    });

    if (!q) {
      // If query is empty, only show all routes as starting suggestions
      return results;
    }

    // 2. Search across Citizen Subjects
    const subjects = data.masterSubjects || [];
    subjects.forEach((s) => {
      const match =
        matches(s.fullName) ||
        matches(s.code) ||
        matches(s.cccd) ||
        matches(s.hamlet) ||
        matches(s.address);

      if (match) {
        results.push({
          id: `citizen-${s.id}`,
          category: "CITIZEN",
          categoryLabel: "Hồ sơ Công dân",
          title: `${s.fullName} (${s.code})`,
          subtitle: `CCCD: ${maskPII(s.cccd, "cccd", persona)} • ${s.hamlet} • ${s.address}`,
          targetUrl: "/du-lieu-dung-chung",
          icon: User,
          badge: s.status === "MERGED" ? "Đã gộp" : "Công dân",
        });
      }
    });

    // 3. Search across Facilities (Schools, Cultural Facilities, Religious, Medical, Food Safety)
    const schools = data.domainRecords?.giaoDuc?.schools || [];
    schools.forEach((sc) => {
      if (matches(sc.name) || matches(sc.principal)) {
        results.push({
          id: `school-${sc.id}`,
          category: "FACILITY",
          categoryLabel: "Cơ sở & Thiết chế",
          title: sc.name,
          subtitle: `Hiệu trưởng: ${sc.principal} • ${sc.totalStudents} học sinh`,
          targetUrl: "/giao-duc",
          icon: Building2,
          badge: "Trường học",
        });
      }
    });

    const religious = data.domainRecords?.danTocTonGiao?.religiousFacilities || [];
    religious.forEach((rf) => {
      if (matches(rf.name) || matches(rf.leaderName) || matches(rf.hamlet)) {
        results.push({
          id: `religion-${rf.id}`,
          category: "FACILITY",
          categoryLabel: "Cơ sở & Thiết chế",
          title: rf.name,
          subtitle: `Trụ trì/Người đứng đầu: ${rf.leaderName} • ${rf.hamlet}`,
          targetUrl: "/dan-toc-ton-giao",
          icon: Building2,
          badge: "Tôn giáo",
        });
      }
    });

    const medicals = data.domainRecords?.yTeAnSinh?.medical || [];
    medicals.forEach((m) => {
      if (matches(m.facilityName) || matches(m.practitionerName)) {
        results.push({
          id: `med-${m.id}`,
          category: "FACILITY",
          categoryLabel: "Cơ sở & Thiết chế",
          title: m.facilityName,
          subtitle: `Phụ trách: ${m.practitionerName} • GP: ${m.licenseNumber}`,
          targetUrl: "/y-te-an-sinh",
          icon: Building2,
          badge: "Y dược tư nhân",
        });
      }
    });

    const foodSafeties = data.domainRecords?.yTeAnSinh?.foodSafety || [];
    foodSafeties.forEach((fs) => {
      if (matches(fs.facilityName) || matches(fs.inspectionType) || matches(fs.conclusion)) {
        results.push({
          id: `fs-${fs.id}`,
          category: "FACILITY",
          categoryLabel: "Cơ sở & Thiết chế",
          title: fs.facilityName,
          subtitle: `Kiểm tra ATTP: Điểm ${fs.totalScore}/100 • Kết luận: ${fs.conclusion}`,
          targetUrl: "/y-te-an-sinh",
          icon: Building2,
          badge: "ATTP",
        });
      }
    });

    // 4. Search across Tasks
    const tasks = data.tasks || [];
    tasks.forEach((t) => {
      if (matches(t.title) || matches(t.code) || matches(t.domain) || matches(t.assignee)) {
        results.push({
          id: `task-${t.id}`,
          category: "TASK",
          categoryLabel: "Nhiệm vụ Chờ xử lý",
          title: `[${t.code}] ${t.title}`,
          subtitle: `Lĩnh vực: ${t.domain} • Hạn xử lý: ${t.dueText} • Người thực hiện: ${t.assignee}`,
          targetUrl: t.targetUrl || "/ban-lam-viec",
          icon: CheckSquare,
          badge: t.status,
        });
      }
    });

    return results;
  }, [query, data, persona]);

  // Navigate to selected result
  const handleSelectResult = (item: SearchResultItem) => {
    setIsOmnisOpen(false);
    router.push(item.targetUrl);
  };

  // Keyboard navigation inside Omnisearch
  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(searchResults.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(searchResults.length, 1)) % Math.max(searchResults.length, 1));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(searchResults[selectedIndex]);
    }
  };

  // Calculate Breadcrumbs hierarchy based on pathname
  const currentRouteMeta = APP_ROUTES.find((r) => r.path === pathname);
  const breadcrumbTitle = currentRouteMeta?.name || (!pathname || pathname === "/" ? "Bàn làm việc" : pathname.replace("/", ""));


  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Hierarchical Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
            <Link
              href="/ban-lam-viec"
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
              title="Trang chủ"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Trang chủ</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-bold text-slate-800 truncate" title={breadcrumbTitle}>
              {breadcrumbTitle}
            </span>
          </nav>
        </div>

        {/* Center: Omnisearch Ctrl+K trigger */}
        <div className="flex items-center justify-center px-2">
          <button
            type="button"
            onClick={() => setIsOmnisOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100/90 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-all w-36 sm:w-56 md:w-72 lg:w-80 justify-between shadow-2xs hover:border-slate-300"
            title="Mở hộp tìm kiếm nhanh (Ctrl+K / Cmd+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Tìm kiếm toàn diện...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-white border border-slate-300 rounded shadow-2xs font-mono shrink-0">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Switchers & Persona */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:block">
            <TenantSwitcher currentTenant={tenant} onSelectTenant={onSelectTenant} />
          </div>

          <PersonaSwitcher currentPersona={persona} onSelectPersona={onSelectPersona} />

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <button
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors relative"
              title="Thông báo hệ thống"
            >
              <Bell className="h-4 w-4" />
              {delegationExpired ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
            <div className="text-right hidden xl:block">
              <div className="text-xs font-bold text-slate-800">{persona.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">{persona.roleTitle}</div>
            </div>
          </div>
        </div>
      </header>

      {/* OMNISEARCH COMMAND DIALOG (CTRL+K) */}
      {isOmnisOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Tìm nhanh phân hệ, công dân, cơ sở, nhiệm vụ... (↑↓ để chọn, Enter để vào)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleDialogKeyDown}
                className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800 font-medium"
              />
              <button
                onClick={() => setIsOmnisOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Không tìm thấy kết quả nào khớp với &quot;{query}&quot;
                </div>
              ) : (
                searchResults.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? "bg-gov-50 text-gov-900 font-medium border-l-3 border-gov-600"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-md shrink-0 ${
                            isSelected ? "bg-gov-100 text-gov-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="neutral" className="text-[10px] py-0 px-1 font-normal">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                          {item.categoryLabel}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with keyboard navigation guidance */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↑↓</kbd>
                  <span>Di chuyển</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd>
                  <span>Truy cập</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</kbd>
                  <span>Đóng</span>
                </span>
              </div>
              <span className="font-semibold text-gov-700">Omnisearch Toàn diện PVH v1.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
