import * as React from "react";
import { cn } from "@/lib/utils";

const TableDensityContext = React.createContext<"normal" | "compact">("normal");

export function Table({
  className,
  density = "normal",
  ...props
}: React.HTMLAttributes<HTMLTableElement> & { density?: "normal" | "compact" }) {
  return (
    <TableDensityContext.Provider value={density}>
      <div className="relative w-full overflow-auto rounded-lg border border-slate-200">
        <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    </TableDensityContext.Provider>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100 bg-white", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-slate-50/80 data-[state=selected]:bg-slate-100", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const density = React.useContext(TableDensityContext);
  return (
    <th
      className={cn(
        "text-left align-middle font-medium text-slate-600 [&:has([role=checkbox])]:pr-0",
        density === "compact" ? "h-8 px-3 text-[11px]" : "h-10 px-4 text-xs",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const density = React.useContext(TableDensityContext);
  return (
    <td
      className={cn(
        "align-middle text-slate-700 [&:has([role=checkbox])]:pr-0",
        density === "compact" ? "py-2 px-3 text-xs" : "p-4 text-sm",
        className
      )}
      {...props}
    />
  );
}

export function TableEmptyState({
  title = "Không tìm thấy dữ liệu phù hợp",
  description = "Thử thay đổi từ khóa tìm kiếm hoặc làm mới bộ lọc.",
  actionText,
  onAction,
  colSpan = 10,
}: {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto">
          <svg className="w-10 h-10 mb-2 stroke-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="mt-3 text-xs text-gov-600 font-semibold hover:underline"
            >
              {actionText}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
