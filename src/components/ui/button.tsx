import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-[#1F633E] hover:bg-[#174E31] text-white shadow-sm border border-transparent font-medium",
      secondary: "bg-[#F2F8F4] hover:bg-[#E2F0E7] text-[#1F633E] border border-[#95C7A8] font-medium",
      outline: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium",
      ghost: "hover:bg-slate-100 text-slate-700 font-medium",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-medium",
    };

    const sizes = {
      xs: "h-7 px-2.5 text-[11px] rounded",
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-9 px-4 text-sm rounded-md",
      lg: "h-11 px-6 text-base rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F633E] disabled:pointer-events-none disabled:opacity-50 select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
