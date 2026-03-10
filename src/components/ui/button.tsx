"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]",
          {
            "bg-primary text-white hover:bg-primary-dark focus:ring-primary":
              variant === "primary",
            "bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary":
              variant === "secondary",
            "bg-danger text-white hover:bg-red-700 focus:ring-danger":
              variant === "danger",
            "bg-transparent hover:bg-gray-100 focus:ring-gray-400":
              variant === "ghost",
            "border border-border bg-white hover:bg-gray-50 focus:ring-primary":
              variant === "outline",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-5 py-2.5 text-base": size === "lg",
            "px-6 py-4 text-lg min-h-[64px]": size === "xl",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
