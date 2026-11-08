"use client";

import * as React from "react";
import { useDemoContext } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  CalendarCheck,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
  ShieldAlert,
  Info,
  Lock,
} from "lucide-react";

interface TaskItem {
  id: string;
  code: string;
  title: string;
  category: string;
  assignee: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  hamlet?: string;
  sourceRef?: string;
  tenantCode: "XA_A" | "XA_B";
  version: number;
}

const INITIAL_TASKS: TaskItem[] = [
  // Xã A Tasks
  {
    id: "task-1",
    code: "NV-KH-2026-001",
    title: "Tổ chức bình xét danh hiệu Gia đình văn hóa đợt 1 năm 2026",
    category: "Văn hóa & Gia đình",
    assignee: "Trần Thị Mai (P2)",
    dueDate: "2026-11-20",
    priority: "HIGH",
    status: "IN_PROGRESS",
    hamlet: "Xóm A1",
    sourceRef: "KH-UBND-12/2026",
    tenantCode: "XA_A",
    version: 2,
  },
  {
    id: "task-2",
    code: "NV-KH-2026-002",
    title: "Rà soát danh sách đối tượng người có công nhận quà nhân dịp Tết",
    category: "Nội vụ & LĐTBXH",
    assignee: "Trần Thị Mai (P2)",
    dueDate: "2026-11-25",
    priority: "HIGH",
    status: "TODO",
    sourceRef: "CV-SLDTBXH-991",
    tenantCode: "XA_A",
    version: 1,
  },
  {
    id: "task-3",
    code: "NV-KH-2026-003",
    title: "Kiểm tra thực tế hiện trạng đình làng Đình A1",
    category: "Di tích & Lễ hội",
    assignee: "Đỗ Minh Đức (P6)",
    dueDate: "2026-11-15",
    priority: "MEDIUM",
    status: "COMPLETED",
    hamlet: "Xóm A2",
    tenantCode: "XA_A",
    version: 3,
  },
  {
    id: "task-4",
    code: "NV-KH-2026-004",
    title: "Thu thập số liệu phổ cập giáo dục mầm non và tiểu học",
    category: "Giáo dục",
    assignee: "Lê Văn Hùng (P3)",
    dueDate: "2026-11-30",
    priority: "LOW",
    status: "TODO",
    sourceRef: "Báo cáo PGD",
    tenantCode: "XA_A",
    version: 1,
  },
  // Xã B Tasks
  {
    id: "task-b-1",
    code: "NV-KH-B-2026-001",
    title: "Tổ chức Lễ hội Nông sản Giả định B và bình xét nếp sống văn minh",
    category: "Văn hóa & Lễ hội",
    assignee: "Dương Đình Khang (P2)",
    dueDate: "2026-11-28",
    priority: "HIGH",
    status: "IN_PROGRESS",
    hamlet: "Xóm B1",
    tenantCode: "XA_B",
    version: 1,
  },
  {
    id: "task-b-2",
    code: "NV-KH-B-2026-002",
    title: "Rà soát đối tượng nhận trợ cấp bảo trợ xã hội tháng 11/2026",
    category: "An sinh xã hội",
    assignee: "Nguyễn Thị Thảo (P5)",
    dueDate: "2026-11-20",
    priority: "MEDIUM",
    status: "TODO",
    hamlet: "Xóm B1",
    tenantCode: "XA_B",
    version: 1,
  },
];

export default function KeHoachCongViecPage() {
  const { tenant, persona } = useDemoContext();
  const [tasks, setTasks] = React.useState<TaskItem[]>(INITIAL_TASKS);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [conflictMessage, setConflictMessage] = React.useState<string | null>(null);

  // New Task form state
  const [newTitle, setNewTitle] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("Văn hóa & Gia đình");
  const [newPriority, setNewPriority] = React.useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newDueDate, setNewDueDate] = React.useState("2026-11-30");

  const tenantTasks = tasks.filter((t) => t.tenantCode === tenant.code);
  const filteredTasks = tenantTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = filteredTasks.filter((t) => t.status === "COMPLETED");

  const handleMoveStatus = (taskId: string, nextStatus: "TODO" | "IN_PROGRESS" | "COMPLETED") => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus, version: t.version + 1 } : t))
    );
  };

  const handleSimulateConflict = () => {
    setConflictMessage(
      "LỖI HTTP 409 CONFLICT (AC-21, V05): Nhiệm vụ NV-KH-2026-001 vừa được cán bộ Đỗ Minh Đức (P6) lưu phiên bản mới (v3) lúc 11:32:05. Bản sửa đổi của bạn đang dựa trên version cũ (v2) nên hệ thống từ chối ghi đè (Optimistic Concurrency Lock)."
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      code: `NV-KH-${tenant.code === "XA_B" ? "B-" : ""}2026-00${tenantTasks.length + 1}`,
      title: newTitle,
      category: newCategory,
      assignee: `${persona.name} (${persona.code})`,
      dueDate: newDueDate,
      priority: newPriority,
      status: "TODO",
      tenantCode: tenant.code as "XA_A" | "XA_B",
      version: 1,
    };

    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gov-600">
            Kế hoạch & Phân công công việc • {tenant.name}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Bảng Điều phối Công việc Liên ngành Phòng VH-XH
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến độ, phân công chuyên viên và kiểm soát Maker-Checker nhiệm vụ trọng tâm cấp xã.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateConflict}
            className="text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5"
            title="Mô phỏng 2 cán bộ cùng cập nhật 1 việc"
          >
            <Lock className="w-3.5 h-3.5" /> Mô phỏng xung đột 409
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Giao việc mới
          </Button>
        </div>
      </div>

      {/* 409 Conflict Simulation Notification */}
      {conflictMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Khóa lạc quan phát hiện xung đột dữ liệu:</span>
              <p className="leading-relaxed">{conflictMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setConflictMessage(null)}
            className="text-xs font-semibold text-rose-700 hover:underline shrink-0"
          >
            Đóng thông báo
          </button>
        </div>
      )}

      {/* SLA & Multi-tenancy Info */}
      <div className="p-3.5 bg-gov-50 border border-gov-200 rounded-lg flex items-start gap-3 text-xs text-gov-800">
        <Info className="w-4 h-4 text-gov-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Kiểm soát tiến độ 2 hạn (AC-19/20):</span> Mọi công việc chuyển sang trạng thái &quot;Đã hoàn thành&quot; đều lưu vết phiên bản (versioning) và kiểm tra quyền phê duyệt của Lãnh đạo UBND (Checker). Dữ liệu được cô lập 100% cho {tenant.name}.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Tìm theo tên nhiệm vụ, mã công việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-gov-500 text-slate-700"
          >
            <option value="ALL">Tất cả ({tenantTasks.length})</option>
            <option value="TODO">Chưa thực hiện</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Kanban Board 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: TODO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                CHƯA THỰC HIỆN ({todoTasks.length})
              </h3>
            </div>
          </div>
          <div className="space-y-3 min-h-[350px] p-2 bg-slate-100/60 rounded-xl border border-slate-200/80">
            {todoTasks.map((task) => (
              <Card key={task.id} className="shadow-xs hover:border-slate-300 transition-all">
                <CardContent className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold text-gov-700 bg-gov-50 px-1.5 py-0.5 rounded border border-gov-200">
                      {task.code}
                    </span>
                    <Badge variant={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "neutral"}>
                      {task.priority === "HIGH" ? "Gấp" : task.priority === "MEDIUM" ? "Trung bình" : "Thường"}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-slate-800 leading-snug">{task.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {task.assignee}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-rose-600 font-semibold">
                      <Clock className="w-3 h-3" />
                      {task.dueDate}
                    </span>
                  </div>
                  <div className="pt-1 flex justify-end">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleMoveStatus(task.id, "IN_PROGRESS")}
                      className="gap-1 text-gov-700 hover:text-gov-800"
                    >
                      Bắt đầu xử lý <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 2: IN_PROGRESS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                ĐANG TIẾN HÀNH ({inProgressTasks.length})
              </h3>
            </div>
          </div>
          <div className="space-y-3 min-h-[350px] p-2 bg-blue-50/40 rounded-xl border border-blue-200/60">
            {inProgressTasks.map((task) => (
              <Card key={task.id} className="shadow-xs hover:border-blue-300 transition-all border-l-4 border-l-blue-500">
                <CardContent className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold text-gov-700 bg-gov-50 px-1.5 py-0.5 rounded border border-gov-200">
                      {task.code}
                    </span>
                    <Badge variant={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "neutral"}>
                      {task.priority === "HIGH" ? "Gấp" : task.priority === "MEDIUM" ? "Trung bình" : "Thường"}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-slate-800 leading-snug">{task.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {task.assignee}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-amber-600 font-semibold">
                      <Clock className="w-3 h-3" />
                      {task.dueDate}
                    </span>
                  </div>
                  <div className="pt-1 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-mono">v{task.version}</span>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleMoveStatus(task.id, "COMPLETED")}
                      className="gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Nghiệm thu xong
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 3: COMPLETED */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                ĐÃ HOÀN THÀNH ({completedTasks.length})
              </h3>
            </div>
          </div>
          <div className="space-y-3 min-h-[350px] p-2 bg-emerald-50/40 rounded-xl border border-emerald-200/60">
            {completedTasks.map((task) => (
              <Card key={task.id} className="shadow-xs hover:border-emerald-300 transition-all border-l-4 border-l-emerald-500 bg-white/90">
                <CardContent className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {task.code}
                    </span>
                    <Badge variant="success">Hoàn thành</Badge>
                  </div>
                  <h4 className="font-semibold text-slate-800 leading-snug">{task.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {task.assignee}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Add Task */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Giao nhiệm vụ công tác mới"
        description={`Kế hoạch triển khai nhiệm vụ chuyên ngành VH-XH tại ${tenant.name}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Nội dung nhiệm vụ / Công việc</label>
            <Input
              placeholder="Ví dụ: Rà soát danh sách hộ nghèo nhận trợ cấp quý 4..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Lĩnh vực chuyên ngành</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-gov-500 text-slate-700"
              >
                <option value="Văn hóa & Gia đình">Văn hóa & Gia đình</option>
                <option value="Nội vụ & LĐTBXH">Nội vụ & LĐTBXH</option>
                <option value="Giáo dục & Đào tạo">Giáo dục & Đào tạo</option>
                <option value="KHCN & CĐS">KHCN & CĐS</option>
                <option value="Y tế & An sinh">Y tế & An sinh</option>
                <option value="Dân tộc & Tôn giáo">Dân tộc & Tôn giáo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Mức độ ưu tiên</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-gov-500 text-slate-700"
              >
                <option value="HIGH">Gấp (Ưu tiên cao)</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Bình thường</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Hạn hoàn thành (SLA)</label>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu & Phân công
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
