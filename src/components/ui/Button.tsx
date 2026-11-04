import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  secondary: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "text-slate-500 hover:bg-red-50 hover:text-red-600",
};

const SIZES = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function Button({ variant = "primary", size = "md", type = "button", className = "", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
