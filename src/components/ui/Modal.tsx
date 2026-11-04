"use client";

import { type ReactNode, useEffect, useId } from "react";
import { Button } from "./Button";

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  /** Width of the dialog, e.g. "max-w-sm" or "max-w-lg". */
  width?: string;
  children: ReactNode;
}

/** A centered dialog. Closes with the ✕ button, the Escape key, or a click on the dark background. */
export function Modal({ title, onClose, width = "max-w-lg", children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full rounded-xl bg-white p-6 shadow-xl ${width}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
