export function Spinner({ label, className = "" }: { label: string; className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-2 text-sm text-slate-500 ${className}`}>
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
        aria-hidden="true"
      />
      {label}
    </p>
  );
}
