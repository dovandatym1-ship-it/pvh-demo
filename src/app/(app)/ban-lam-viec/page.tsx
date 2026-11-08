import React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { getWorkItems } from "@/features/m01-core-work/server/queries";
import { WorkItemTable } from "@/features/m01-core-work/components/work-item-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle, ListTodo } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkbenchPage() {
  const ctx = await getRequestContext();
  const items = await getWorkItems(ctx);

  const myTasks = items.filter((item) => item.status === "ASSIGNED" || item.status === "IN_PROGRESS");
  const overdueTasks = items.filter((item) => item.priority === "URGENT");
  const reviewTasks = items.filter((item) => item.status === "UNDER_REVIEW");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bàn làm việc</h1>
        <p className="text-sm text-gray-500">
          Tổng quan nhiệm vụ công việc hành chính tại đơn vị {ctx.tenantId}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Việc của tôi</CardTitle>
            <ListTodo className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{myTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Đang thực hiện hoặc đã tiếp nhận</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Quá hạn & Khẩn</CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{overdueTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Cần ưu tiên xử lý ngay trong ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Chờ rà soát</CardTitle>
            <Clock className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{reviewTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Hồ sơ đã nộp chờ lãnh đạo ký duyệt</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Danh sách công việc đang xử lý</h2>
        {items.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-white shadow-sm">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Bàn làm việc của bạn đang trống</p>
            <p className="text-sm text-gray-400 mt-1">Hiện không có nhiệm vụ công việc nào cần xử lý</p>
          </div>
        ) : (
          <WorkItemTable items={items} userPermissions={ctx.permissions} />
        )}
      </div>
    </div>
  );
}
