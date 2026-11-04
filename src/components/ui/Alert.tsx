import type { ReactNode } from "react";

const TONES = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

interface AlertProps {
  tone?: keyof typeof TONES;
  /** Optional button shown on the right, e.g. "Reload". */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A coloured message box. Errors use role="alert" so screen readers announce them. */
export function Alert({ tone = "error", action, className = "", children }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${TONES[tone]} ${className}`}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}
