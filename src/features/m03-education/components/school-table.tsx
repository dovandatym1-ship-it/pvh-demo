"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { SchoolDTO, PrivateFacilityDTO } from "../types";
import { GraduationCap, School, Baby, ShieldCheck, AlertTriangle } from "lucide-react";

interface SchoolTableProps {
  readonly schools: SchoolDTO[];
  readonly privateFacilities: Omit<PrivateFacilityDTO, "ownerCccd">[];
}

export function SchoolTable({ schools, privateFacilities }: SchoolTableProps) {
  const [tab, setTab] = React.useState<"public" | "private">("public");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setTab("public")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            tab === "public"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <School className="w-4 h-4" />
          Trường học công lập ({schools.length})
        </button>
        <button
          onClick={() => setTab("private")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            tab === "private"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Baby className="w-4 h-4" />
          Nhóm trẻ / Mầm non độc lập ({privateFacilities.length})
        </button>
      </div>

      {tab === "public" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên trường</TableHead>
                <TableHead>Cấp học</TableHead>
                <TableHead>Hiệu trưởng</TableHead>
                <TableHead className="text-center">Số học sinh</TableHead>
                <TableHead className="text-center">Năm học</TableHead>
                <TableHead className="text-right">Chuẩn phổ cập</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.level === "PRESCHOOL"
                      ? "Mầm non"
                      : item.level === "PRIMARY"
                      ? "Tiểu học"
                      : "THCS"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {item.principal}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-xs">
                    {item.totalStudents} em
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-600">
                    {item.schoolYear}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success">
                      {item.universalizationStandard === "LEVEL_3"
                        ? "Mức độ 3"
                        : item.universalizationStandard === "LEVEL_2"
                        ? "Mức độ 2"
                        : "Mức độ 1"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "private" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhóm trẻ hoặc cơ sở</TableHead>
                <TableHead>Chủ nhóm trẻ</TableHead>
                <TableHead className="text-center">Quy mô và số trẻ hiện có</TableHead>
                <TableHead className="text-center">Diện tích (m²/trẻ)</TableHead>
                <TableHead className="text-center">PCCC / ATTP</TableHead>
                <TableHead className="text-right">Tình trạng cấp phép</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {privateFacilities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {item.ownerName}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <span className="font-semibold text-slate-900">{item.currentEnrolled}</span> / {item.capacity} trẻ
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono">
                    {item.sqmPerChild} m²
                  </TableCell>
                  <TableCell className="text-center">
                    {item.fireSafetyCertified && item.foodSafetyCertified ? (
                      <Badge variant="success">
                        <ShieldCheck className="w-3 h-3 mr-1 inline" /> Đủ điều kiện
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> Cần kiểm tra
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.licensingStatus === "LICENSED" ? "success" : "warning"}>
                      {item.licensingStatus === "LICENSED" ? "Đã cấp phép" : "Đang kiểm tra"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
